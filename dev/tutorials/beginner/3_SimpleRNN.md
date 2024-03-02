


<a id='Training-a-Simple-LSTM'></a>

# Training a Simple LSTM


In this tutorial we will go over using a recurrent neural network to classify clockwise and anticlockwise spirals. By the end of this tutorial you will be able to:


1. Create custom Lux models.
2. Become familiar with the Lux recurrent neural network API.
3. Training using Optimisers.jl and Zygote.jl.


<a id='Package-Imports'></a>

## Package Imports


```julia
using Lux, LuxAMDGPU, LuxCUDA, JLD2, MLUtils, Optimisers, Zygote, Random, Statistics
```


<a id='Dataset'></a>

## Dataset


We will use MLUtils to generate 500 (noisy) clockwise and 500 (noisy) anticlockwise spirals. Using this data we will create a `MLUtils.DataLoader`. Our dataloader will give us sequences of size 2 × seq*len × batch*size and we need to predict a binary value whether the sequence is clockwise or anticlockwise.


```julia
function get_dataloaders(; dataset_size=1000, sequence_length=50)
    # Create the spirals
    data = [MLUtils.Datasets.make_spiral(sequence_length) for _ in 1:dataset_size]
    # Get the labels
    labels = vcat(repeat([0.0f0], dataset_size ÷ 2), repeat([1.0f0], dataset_size ÷ 2))
    clockwise_spirals = [reshape(d[1][:, 1:sequence_length], :, sequence_length, 1)
                         for d in data[1:(dataset_size ÷ 2)]]
    anticlockwise_spirals = [reshape(
                                 d[1][:, (sequence_length + 1):end], :, sequence_length, 1)
                             for d in data[((dataset_size ÷ 2) + 1):end]]
    x_data = Float32.(cat(clockwise_spirals..., anticlockwise_spirals...; dims=3))
    # Split the dataset
    (x_train, y_train), (x_val, y_val) = splitobs((x_data, labels); at=0.8, shuffle=true)
    # Create DataLoaders
    return (
        # Use DataLoader to automatically minibatch and shuffle the data
        DataLoader(collect.((x_train, y_train)); batchsize=128, shuffle=true),
        # Don't shuffle the validation data
        DataLoader(collect.((x_val, y_val)); batchsize=128, shuffle=false))
end
```


```
get_dataloaders (generic function with 1 method)
```


<a id='Creating-a-Classifier'></a>

## Creating a Classifier


We will be extending the `Lux.AbstractExplicitContainerLayer` type for our custom model since it will contain a lstm block and a classifier head.


We pass the fieldnames `lstm_cell` and `classifier` to the type to ensure that the parameters and states are automatically populated and we don't have to define `Lux.initialparameters` and `Lux.initialstates`.


To understand more about container layers, please look at [Container Layer](../../manual/interface#Container-Layer).


```julia
struct SpiralClassifier{L, C} <:
       Lux.AbstractExplicitContainerLayer{(:lstm_cell, :classifier)}
    lstm_cell::L
    classifier::C
end
```


We won't define the model from scratch but rather use the [`Lux.LSTMCell`](../../api/Lux/layers#Lux.LSTMCell) and [`Lux.Dense`](../../api/Lux/layers#Lux.Dense).


```julia
function SpiralClassifier(in_dims, hidden_dims, out_dims)
    return SpiralClassifier(
        LSTMCell(in_dims => hidden_dims), Dense(hidden_dims => out_dims, sigmoid))
end
```


```
Main.var"##225".SpiralClassifier
```


We can use default Lux blocks – `Recurrence(LSTMCell(in_dims => hidden_dims)` – instead of defining the following. But let's still do it for the sake of it.


Now we need to define the behavior of the Classifier when it is invoked.


```julia
function (s::SpiralClassifier)(
        x::AbstractArray{T, 3}, ps::NamedTuple, st::NamedTuple) where {T}
    # First we will have to run the sequence through the LSTM Cell
    # The first call to LSTM Cell will create the initial hidden state
    # See that the parameters and states are automatically populated into a field called
    # `lstm_cell` We use `eachslice` to get the elements in the sequence without copying,
    # and `Iterators.peel` to split out the first element for LSTM initialization.
    x_init, x_rest = Iterators.peel(Lux._eachslice(x, Val(2)))
    (y, carry), st_lstm = s.lstm_cell(x_init, ps.lstm_cell, st.lstm_cell)
    # Now that we have the hidden state and memory in `carry` we will pass the input and
    # `carry` jointly
    for x in x_rest
        (y, carry), st_lstm = s.lstm_cell((x, carry), ps.lstm_cell, st_lstm)
    end
    # After running through the sequence we will pass the output through the classifier
    y, st_classifier = s.classifier(y, ps.classifier, st.classifier)
    # Finally remember to create the updated state
    st = merge(st, (classifier=st_classifier, lstm_cell=st_lstm))
    return vec(y), st
end
```


<a id='Defining-Accuracy,-Loss-and-Optimiser'></a>

## Defining Accuracy, Loss and Optimiser


Now let's define the binarycrossentropy loss. Typically it is recommended to use `logitbinarycrossentropy` since it is more numerically stable, but for the sake of simplicity we will use `binarycrossentropy`.


```julia
function xlogy(x, y)
    result = x * log(y)
    return ifelse(iszero(x), zero(result), result)
end

function binarycrossentropy(y_pred, y_true)
    y_pred = y_pred .+ eps(eltype(y_pred))
    return mean(@. -xlogy(y_true, y_pred) - xlogy(1 - y_true, 1 - y_pred))
end

function compute_loss(x, y, model, ps, st)
    y_pred, st = model(x, ps, st)
    return binarycrossentropy(y_pred, y), y_pred, st
end

matches(y_pred, y_true) = sum((y_pred .> 0.5f0) .== y_true)
accuracy(y_pred, y_true) = matches(y_pred, y_true) / length(y_pred)
```


```
accuracy (generic function with 1 method)
```


Finally lets create an optimiser given the model parameters.


```julia
function create_optimiser(ps)
    opt = Optimisers.Adam(0.01f0)
    return Optimisers.setup(opt, ps)
end
```


```
create_optimiser (generic function with 1 method)
```


<a id='Training-the-Model'></a>

## Training the Model


```julia
function main()
    # Get the dataloaders
    (train_loader, val_loader) = get_dataloaders()

    # Create the model
    model = SpiralClassifier(2, 8, 1)
    rng = Random.default_rng()
    Random.seed!(rng, 0)
    ps, st = Lux.setup(rng, model)

    dev = gpu_device()
    ps = ps |> dev
    st = st |> dev

    # Create the optimiser
    opt_state = create_optimiser(ps)

    for epoch in 1:25
        # Train the model
        for (x, y) in train_loader
            x = x |> dev
            y = y |> dev
            (loss, y_pred, st), back = pullback(compute_loss, x, y, model, ps, st)
            gs = back((one(loss), nothing, nothing))[4]
            opt_state, ps = Optimisers.update(opt_state, ps, gs)

            println("Epoch [$epoch]: Loss $loss")
        end

        # Validate the model
        st_ = Lux.testmode(st)
        for (x, y) in val_loader
            x = x |> dev
            y = y |> dev
            (loss, y_pred, st_) = compute_loss(x, y, model, ps, st_)
            acc = accuracy(y_pred, y)
            println("Validation: Loss $loss Accuracy $acc")
        end
    end

    return (ps, st) |> cpu_device()
end

ps_trained, st_trained = main()
```


```
┌ Warning: `replicate` doesn't work for `TaskLocalRNG`. Returning the same `TaskLocalRNG`.
└ @ LuxCore ~/.cache/julia-buildkite-plugin/depots/01872db4-8c79-43af-ab7d-12abac4f24f6/packages/LuxCore/t4mG0/src/LuxCore.jl:13
Epoch [1]: Loss 0.5615842
Epoch [1]: Loss 0.51270664
Epoch [1]: Loss 0.46934727
Epoch [1]: Loss 0.45120928
Epoch [1]: Loss 0.43895102
Epoch [1]: Loss 0.41273075
Epoch [1]: Loss 0.38538027
Validation: Loss 0.37414372 Accuracy 1.0
Validation: Loss 0.37538657 Accuracy 1.0
Epoch [2]: Loss 0.36136538
Epoch [2]: Loss 0.35638463
Epoch [2]: Loss 0.34529662
Epoch [2]: Loss 0.32158917
Epoch [2]: Loss 0.29737282
Epoch [2]: Loss 0.29149896
Epoch [2]: Loss 0.2764268
Validation: Loss 0.26282752 Accuracy 1.0
Validation: Loss 0.26293993 Accuracy 1.0
Epoch [3]: Loss 0.26222202
Epoch [3]: Loss 0.24666908
Epoch [3]: Loss 0.2311269
Epoch [3]: Loss 0.22231871
Epoch [3]: Loss 0.21492006
Epoch [3]: Loss 0.2037428
Epoch [3]: Loss 0.19287035
Validation: Loss 0.18387413 Accuracy 1.0
Validation: Loss 0.18349576 Accuracy 1.0
Epoch [4]: Loss 0.18130685
Epoch [4]: Loss 0.17352544
Epoch [4]: Loss 0.16936329
Epoch [4]: Loss 0.15631807
Epoch [4]: Loss 0.15165442
Epoch [4]: Loss 0.14192593
Epoch [4]: Loss 0.14128473
Validation: Loss 0.13175485 Accuracy 1.0
Validation: Loss 0.13135788 Accuracy 1.0
Epoch [5]: Loss 0.13216706
Epoch [5]: Loss 0.12572189
Epoch [5]: Loss 0.11954362
Epoch [5]: Loss 0.11466796
Epoch [5]: Loss 0.108803555
Epoch [5]: Loss 0.10375823
Epoch [5]: Loss 0.10074419
Validation: Loss 0.09636645 Accuracy 1.0
Validation: Loss 0.09607629 Accuracy 1.0
Epoch [6]: Loss 0.0984276
Epoch [6]: Loss 0.08995168
Epoch [6]: Loss 0.08758517
Epoch [6]: Loss 0.08325355
Epoch [6]: Loss 0.080650225
Epoch [6]: Loss 0.07727011
Epoch [6]: Loss 0.0748848
Validation: Loss 0.07144948 Accuracy 1.0
Validation: Loss 0.07132534 Accuracy 1.0
Epoch [7]: Loss 0.06980403
Epoch [7]: Loss 0.069127224
Epoch [7]: Loss 0.06364802
Epoch [7]: Loss 0.0609722
Epoch [7]: Loss 0.06231652
Epoch [7]: Loss 0.05699496
Epoch [7]: Loss 0.060755096
Validation: Loss 0.053505115 Accuracy 1.0
Validation: Loss 0.053494334 Accuracy 1.0
Epoch [8]: Loss 0.05282244
Epoch [8]: Loss 0.051415455
Epoch [8]: Loss 0.04788196
Epoch [8]: Loss 0.046166807
Epoch [8]: Loss 0.04623215
Epoch [8]: Loss 0.042947493
Epoch [8]: Loss 0.04245136
Validation: Loss 0.040309545 Accuracy 1.0
Validation: Loss 0.040393963 Accuracy 1.0
Epoch [9]: Loss 0.04040468
Epoch [9]: Loss 0.037485715
Epoch [9]: Loss 0.036337063
Epoch [9]: Loss 0.036194593
Epoch [9]: Loss 0.03354699
Epoch [9]: Loss 0.032964103
Epoch [9]: Loss 0.03212768
Validation: Loss 0.03077174 Accuracy 1.0
Validation: Loss 0.030905707 Accuracy 1.0
Epoch [10]: Loss 0.031315815
Epoch [10]: Loss 0.02973275
Epoch [10]: Loss 0.028323352
Epoch [10]: Loss 0.026510023
Epoch [10]: Loss 0.026485758
Epoch [10]: Loss 0.024878696
Epoch [10]: Loss 0.022911772
Validation: Loss 0.024146296 Accuracy 1.0
Validation: Loss 0.02430253 Accuracy 1.0
Epoch [11]: Loss 0.023434596
Epoch [11]: Loss 0.02282546
Epoch [11]: Loss 0.023431903
Epoch [11]: Loss 0.02172491
Epoch [11]: Loss 0.020843957
Epoch [11]: Loss 0.019788107
Epoch [11]: Loss 0.020540228
Validation: Loss 0.019629054 Accuracy 1.0
Validation: Loss 0.01976512 Accuracy 1.0
Epoch [12]: Loss 0.020032618
Epoch [12]: Loss 0.01972054
Epoch [12]: Loss 0.018057263
Epoch [12]: Loss 0.017380096
Epoch [12]: Loss 0.016987957
Epoch [12]: Loss 0.016558662
Epoch [12]: Loss 0.016175784
Validation: Loss 0.01646344 Accuracy 1.0
Validation: Loss 0.01658485 Accuracy 1.0
Epoch [13]: Loss 0.017847793
Epoch [13]: Loss 0.015486909
Epoch [13]: Loss 0.016052183
Epoch [13]: Loss 0.014344658
Epoch [13]: Loss 0.013810993
Epoch [13]: Loss 0.014851287
Epoch [13]: Loss 0.0126214065
Validation: Loss 0.01419069 Accuracy 1.0
Validation: Loss 0.014299323 Accuracy 1.0
Epoch [14]: Loss 0.013620775
Epoch [14]: Loss 0.01414828
Epoch [14]: Loss 0.013892238
Epoch [14]: Loss 0.01324922
Epoch [14]: Loss 0.0126684485
Epoch [14]: Loss 0.012922122
Epoch [14]: Loss 0.009902682
Validation: Loss 0.01250398 Accuracy 1.0
Validation: Loss 0.012610007 Accuracy 1.0
Epoch [15]: Loss 0.01221917
Epoch [15]: Loss 0.0124797635
Epoch [15]: Loss 0.011836322
Epoch [15]: Loss 0.011904255
Epoch [15]: Loss 0.011047113
Epoch [15]: Loss 0.01105872
Epoch [15]: Loss 0.011888342
Validation: Loss 0.011192732 Accuracy 1.0
Validation: Loss 0.011271488 Accuracy 1.0
Epoch [16]: Loss 0.010849124
Epoch [16]: Loss 0.011026792
Epoch [16]: Loss 0.009804585
Epoch [16]: Loss 0.010664158
Epoch [16]: Loss 0.010697834
Epoch [16]: Loss 0.010340735
Epoch [16]: Loss 0.01048292
Validation: Loss 0.010120397 Accuracy 1.0
Validation: Loss 0.010207268 Accuracy 1.0
Epoch [17]: Loss 0.008666286
Epoch [17]: Loss 0.01014933
Epoch [17]: Loss 0.010673643
Epoch [17]: Loss 0.00899405
Epoch [17]: Loss 0.009725457
Epoch [17]: Loss 0.009282693
Epoch [17]: Loss 0.009492885
Validation: Loss 0.00923541 Accuracy 1.0
Validation: Loss 0.009297335 Accuracy 1.0
Epoch [18]: Loss 0.008736304
Epoch [18]: Loss 0.008569973
Epoch [18]: Loss 0.009043861
Epoch [18]: Loss 0.0088172695
Epoch [18]: Loss 0.008310294
Epoch [18]: Loss 0.0090244785
Epoch [18]: Loss 0.008945955
Validation: Loss 0.008475063 Accuracy 1.0
Validation: Loss 0.008553696 Accuracy 1.0
Epoch [19]: Loss 0.0078874305
Epoch [19]: Loss 0.008138549
Epoch [19]: Loss 0.008532291
Epoch [19]: Loss 0.007554755
Epoch [19]: Loss 0.008147682
Epoch [19]: Loss 0.008238723
Epoch [19]: Loss 0.0073670316
Validation: Loss 0.007826131 Accuracy 1.0
Validation: Loss 0.007878842 Accuracy 1.0
Epoch [20]: Loss 0.0076576276
Epoch [20]: Loss 0.007260156
Epoch [20]: Loss 0.00797863
Epoch [20]: Loss 0.0072805085
Epoch [20]: Loss 0.00749382
Epoch [20]: Loss 0.0070445454
Epoch [20]: Loss 0.0074651996
Validation: Loss 0.00725755 Accuracy 1.0
Validation: Loss 0.007327594 Accuracy 1.0
Epoch [21]: Loss 0.0073763514
Epoch [21]: Loss 0.0067198696
Epoch [21]: Loss 0.007289071
Epoch [21]: Loss 0.0068557933
Epoch [21]: Loss 0.006737641
Epoch [21]: Loss 0.00655994
Epoch [21]: Loss 0.0069276085
Validation: Loss 0.006758742 Accuracy 1.0
Validation: Loss 0.006806784 Accuracy 1.0
Epoch [22]: Loss 0.0069826054
Epoch [22]: Loss 0.006477653
Epoch [22]: Loss 0.006426408
Epoch [22]: Loss 0.0063648503
Epoch [22]: Loss 0.006657618
Epoch [22]: Loss 0.005866644
Epoch [22]: Loss 0.0062701236
Validation: Loss 0.0063146558 Accuracy 1.0
Validation: Loss 0.006373492 Accuracy 1.0
Epoch [23]: Loss 0.0060657696
Epoch [23]: Loss 0.006162966
Epoch [23]: Loss 0.006112942
Epoch [23]: Loss 0.005899852
Epoch [23]: Loss 0.0059551364
Epoch [23]: Loss 0.0057486044
Epoch [23]: Loss 0.0071944064
Validation: Loss 0.0059216246 Accuracy 1.0
Validation: Loss 0.0059685195 Accuracy 1.0
Epoch [24]: Loss 0.006122802
Epoch [24]: Loss 0.0055973367
Epoch [24]: Loss 0.0056971107
Epoch [24]: Loss 0.0059936666
Epoch [24]: Loss 0.0051995283
Epoch [24]: Loss 0.0054764543
Epoch [24]: Loss 0.005353873
Validation: Loss 0.0055647735 Accuracy 1.0
Validation: Loss 0.005614071 Accuracy 1.0
Epoch [25]: Loss 0.00547022
Epoch [25]: Loss 0.005307231
Epoch [25]: Loss 0.005742235
Epoch [25]: Loss 0.0050484333
Epoch [25]: Loss 0.0053463527
Epoch [25]: Loss 0.0049458733
Epoch [25]: Loss 0.005864639
Validation: Loss 0.005246535 Accuracy 1.0
Validation: Loss 0.005289743 Accuracy 1.0

```


<a id='Saving-the-Model'></a>

## Saving the Model


We can save the model using JLD2 (and any other serialization library of your choice) Note that we transfer the model to CPU before saving. Additionally, we recommend that you don't save the model


```julia
@save "trained_model.jld2" {compress = true} ps_trained st_trained
```


Let's try loading the model


```julia
@load "trained_model.jld2" ps_trained st_trained
```


```
2-element Vector{Symbol}:
 :ps_trained
 :st_trained
```


<a id='Appendix'></a>

## Appendix


```julia
using InteractiveUtils
InteractiveUtils.versioninfo()
if @isdefined(LuxCUDA) && CUDA.functional(); println(); CUDA.versioninfo(); end
if @isdefined(LuxAMDGPU) && LuxAMDGPU.functional(); println(); AMDGPU.versioninfo(); end
```


```
Julia Version 1.10.2
Commit bd47eca2c8a (2024-03-01 10:14 UTC)
Build Info:
  Official https://julialang.org/ release
Platform Info:
  OS: Linux (x86_64-linux-gnu)
  CPU: 48 × AMD EPYC 7402 24-Core Processor
  WORD_SIZE: 64
  LIBM: libopenlibm
  LLVM: libLLVM-15.0.7 (ORCJIT, znver2)
Threads: 48 default, 0 interactive, 24 GC (on 2 virtual cores)
Environment:
  LD_LIBRARY_PATH = /usr/local/nvidia/lib:/usr/local/nvidia/lib64
  JULIA_DEPOT_PATH = /root/.cache/julia-buildkite-plugin/depots/01872db4-8c79-43af-ab7d-12abac4f24f6
  JULIA_PROJECT = /var/lib/buildkite-agent/builds/gpuci-12/julialang/lux-dot-jl/docs/Project.toml
  JULIA_AMDGPU_LOGGING_ENABLED = true
  JULIA_DEBUG = Literate
  JULIA_CPU_THREADS = 2
  JULIA_NUM_THREADS = 48
  JULIA_LOAD_PATH = @:@v#.#:@stdlib
  JULIA_CUDA_HARD_MEMORY_LIMIT = 25%

CUDA runtime 12.3, artifact installation
CUDA driver 12.3
NVIDIA driver 545.23.8

CUDA libraries: 
- CUBLAS: 12.3.4
- CURAND: 10.3.4
- CUFFT: 11.0.12
- CUSOLVER: 11.5.4
- CUSPARSE: 12.2.0
- CUPTI: 21.0.0
- NVML: 12.0.0+545.23.8

Julia packages: 
- CUDA: 5.2.0
- CUDA_Driver_jll: 0.7.0+1
- CUDA_Runtime_jll: 0.11.1+0

Toolchain:
- Julia: 1.10.2
- LLVM: 15.0.7

Environment:
- JULIA_CUDA_HARD_MEMORY_LIMIT: 25%

1 device:
  0: NVIDIA A100-PCIE-40GB MIG 1g.5gb (sm_80, 4.328 GiB / 4.750 GiB available)
┌ Warning: LuxAMDGPU is loaded but the AMDGPU is not functional.
└ @ LuxAMDGPU ~/.cache/julia-buildkite-plugin/depots/01872db4-8c79-43af-ab7d-12abac4f24f6/packages/LuxAMDGPU/sGa0S/src/LuxAMDGPU.jl:19

```


---


*This page was generated using [Literate.jl](https://github.com/fredrikekre/Literate.jl).*

