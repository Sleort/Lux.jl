


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
Epoch [1]: Loss 0.5606861
Epoch [1]: Loss 0.5158283
Epoch [1]: Loss 0.47265038
Epoch [1]: Loss 0.45719814
Epoch [1]: Loss 0.42862305
Epoch [1]: Loss 0.40761948
Epoch [1]: Loss 0.3940247
Validation: Loss 0.37381393 Accuracy 1.0
Validation: Loss 0.36923894 Accuracy 1.0
Epoch [2]: Loss 0.38570946
Epoch [2]: Loss 0.3485387
Epoch [2]: Loss 0.32679203
Epoch [2]: Loss 0.31782064
Epoch [2]: Loss 0.30481696
Epoch [2]: Loss 0.29084986
Epoch [2]: Loss 0.27411664
Validation: Loss 0.2628156 Accuracy 1.0
Validation: Loss 0.25946617 Accuracy 1.0
Epoch [3]: Loss 0.2626651
Epoch [3]: Loss 0.24676964
Epoch [3]: Loss 0.22812146
Epoch [3]: Loss 0.22524394
Epoch [3]: Loss 0.21525763
Epoch [3]: Loss 0.20245942
Epoch [3]: Loss 0.19354513
Validation: Loss 0.18409654 Accuracy 1.0
Validation: Loss 0.18202275 Accuracy 1.0
Epoch [4]: Loss 0.17951167
Epoch [4]: Loss 0.17736287
Epoch [4]: Loss 0.17083992
Epoch [4]: Loss 0.15470894
Epoch [4]: Loss 0.15074913
Epoch [4]: Loss 0.14252695
Epoch [4]: Loss 0.13835195
Validation: Loss 0.13214874 Accuracy 1.0
Validation: Loss 0.13075379 Accuracy 1.0
Epoch [5]: Loss 0.13049944
Epoch [5]: Loss 0.12431632
Epoch [5]: Loss 0.12211384
Epoch [5]: Loss 0.11491228
Epoch [5]: Loss 0.10971228
Epoch [5]: Loss 0.10431281
Epoch [5]: Loss 0.100105815
Validation: Loss 0.09683073 Accuracy 1.0
Validation: Loss 0.095643476 Accuracy 1.0
Epoch [6]: Loss 0.095393896
Epoch [6]: Loss 0.09121395
Epoch [6]: Loss 0.08881124
Epoch [6]: Loss 0.08536787
Epoch [6]: Loss 0.081986174
Epoch [6]: Loss 0.07665451
Epoch [6]: Loss 0.07252767
Validation: Loss 0.071916506 Accuracy 1.0
Validation: Loss 0.07079701 Accuracy 1.0
Epoch [7]: Loss 0.071237564
Epoch [7]: Loss 0.068645366
Epoch [7]: Loss 0.06705962
Epoch [7]: Loss 0.06347357
Epoch [7]: Loss 0.05770378
Epoch [7]: Loss 0.058717445
Epoch [7]: Loss 0.05267602
Validation: Loss 0.05395806 Accuracy 1.0
Validation: Loss 0.05293695 Accuracy 1.0
Epoch [8]: Loss 0.0521388
Epoch [8]: Loss 0.05074055
Epoch [8]: Loss 0.051204517
Epoch [8]: Loss 0.04633306
Epoch [8]: Loss 0.044009186
Epoch [8]: Loss 0.04524079
Epoch [8]: Loss 0.04249888
Validation: Loss 0.040756524 Accuracy 1.0
Validation: Loss 0.039847035 Accuracy 1.0
Epoch [9]: Loss 0.039679926
Epoch [9]: Loss 0.038587935
Epoch [9]: Loss 0.039185453
Epoch [9]: Loss 0.036413375
Epoch [9]: Loss 0.03212134
Epoch [9]: Loss 0.032859497
Epoch [9]: Loss 0.033436794
Validation: Loss 0.031174624 Accuracy 1.0
Validation: Loss 0.030394068 Accuracy 1.0
Epoch [10]: Loss 0.030019889
Epoch [10]: Loss 0.03087357
Epoch [10]: Loss 0.029451862
Epoch [10]: Loss 0.027936751
Epoch [10]: Loss 0.024406299
Epoch [10]: Loss 0.026317775
Epoch [10]: Loss 0.024155546
Validation: Loss 0.024497142 Accuracy 1.0
Validation: Loss 0.02383112 Accuracy 1.0
Epoch [11]: Loss 0.022879634
Epoch [11]: Loss 0.024150467
Epoch [11]: Loss 0.023260646
Epoch [11]: Loss 0.02212873
Epoch [11]: Loss 0.022061814
Epoch [11]: Loss 0.019717207
Epoch [11]: Loss 0.019557508
Validation: Loss 0.019913055 Accuracy 1.0
Validation: Loss 0.019342823 Accuracy 1.0
Epoch [12]: Loss 0.019501604
Epoch [12]: Loss 0.019058198
Epoch [12]: Loss 0.01858902
Epoch [12]: Loss 0.018819407
Epoch [12]: Loss 0.017808376
Epoch [12]: Loss 0.016865868
Epoch [12]: Loss 0.0148337055
Validation: Loss 0.016713383 Accuracy 1.0
Validation: Loss 0.01621781 Accuracy 1.0
Epoch [13]: Loss 0.016779765
Epoch [13]: Loss 0.016050236
Epoch [13]: Loss 0.0152777545
Epoch [13]: Loss 0.015608728
Epoch [13]: Loss 0.014204911
Epoch [13]: Loss 0.015032588
Epoch [13]: Loss 0.015716149
Validation: Loss 0.014412172 Accuracy 1.0
Validation: Loss 0.01397289 Accuracy 1.0
Epoch [14]: Loss 0.014552211
Epoch [14]: Loss 0.01378317
Epoch [14]: Loss 0.0137633905
Epoch [14]: Loss 0.013152312
Epoch [14]: Loss 0.013433326
Epoch [14]: Loss 0.012541404
Epoch [14]: Loss 0.011907367
Validation: Loss 0.012679491 Accuracy 1.0
Validation: Loss 0.012287129 Accuracy 1.0
Epoch [15]: Loss 0.012386914
Epoch [15]: Loss 0.012139164
Epoch [15]: Loss 0.012411306
Epoch [15]: Loss 0.0114354575
Epoch [15]: Loss 0.012284051
Epoch [15]: Loss 0.011031348
Epoch [15]: Loss 0.011277698
Validation: Loss 0.011335262 Accuracy 1.0
Validation: Loss 0.010978898 Accuracy 1.0
Epoch [16]: Loss 0.010277385
Epoch [16]: Loss 0.01097953
Epoch [16]: Loss 0.01054452
Epoch [16]: Loss 0.010747188
Epoch [16]: Loss 0.010580216
Epoch [16]: Loss 0.011127751
Epoch [16]: Loss 0.0102571715
Validation: Loss 0.01024857 Accuracy 1.0
Validation: Loss 0.009921234 Accuracy 1.0
Epoch [17]: Loss 0.010192978
Epoch [17]: Loss 0.009775648
Epoch [17]: Loss 0.009630648
Epoch [17]: Loss 0.009151226
Epoch [17]: Loss 0.01027368
Epoch [17]: Loss 0.009290633
Epoch [17]: Loss 0.009277534
Validation: Loss 0.009342787 Accuracy 1.0
Validation: Loss 0.00904065 Accuracy 1.0
Epoch [18]: Loss 0.0091135865
Epoch [18]: Loss 0.008792849
Epoch [18]: Loss 0.009218025
Epoch [18]: Loss 0.0086805215
Epoch [18]: Loss 0.008732565
Epoch [18]: Loss 0.008814553
Epoch [18]: Loss 0.008229862
Validation: Loss 0.008576617 Accuracy 1.0
Validation: Loss 0.008296079 Accuracy 1.0
Epoch [19]: Loss 0.0092050005
Epoch [19]: Loss 0.008111561
Epoch [19]: Loss 0.00795017
Epoch [19]: Loss 0.007603924
Epoch [19]: Loss 0.008546904
Epoch [19]: Loss 0.0077193487
Epoch [19]: Loss 0.007409841
Validation: Loss 0.007917594 Accuracy 1.0
Validation: Loss 0.007655991 Accuracy 1.0
Epoch [20]: Loss 0.008005055
Epoch [20]: Loss 0.007931636
Epoch [20]: Loss 0.007410372
Epoch [20]: Loss 0.007526802
Epoch [20]: Loss 0.0072058644
Epoch [20]: Loss 0.00712621
Epoch [20]: Loss 0.00776676
Validation: Loss 0.0073464285 Accuracy 1.0
Validation: Loss 0.007101387 Accuracy 1.0
Epoch [21]: Loss 0.0072532445
Epoch [21]: Loss 0.007287056
Epoch [21]: Loss 0.0066644833
Epoch [21]: Loss 0.00716435
Epoch [21]: Loss 0.0064157937
Epoch [21]: Loss 0.006972431
Epoch [21]: Loss 0.008116713
Validation: Loss 0.0068419725 Accuracy 1.0
Validation: Loss 0.0066119186 Accuracy 1.0
Epoch [22]: Loss 0.006668388
Epoch [22]: Loss 0.006434395
Epoch [22]: Loss 0.0067424225
Epoch [22]: Loss 0.006576884
Epoch [22]: Loss 0.006343075
Epoch [22]: Loss 0.006527043
Epoch [22]: Loss 0.0061458135
Validation: Loss 0.0063932505 Accuracy 1.0
Validation: Loss 0.0061773686 Accuracy 1.0
Epoch [23]: Loss 0.0059643174
Epoch [23]: Loss 0.0063224863
Epoch [23]: Loss 0.0063545634
Epoch [23]: Loss 0.006032306
Epoch [23]: Loss 0.0056085037
Epoch [23]: Loss 0.006420642
Epoch [23]: Loss 0.0059441226
Validation: Loss 0.005993788 Accuracy 1.0
Validation: Loss 0.0057902792 Accuracy 1.0
Epoch [24]: Loss 0.00582896
Epoch [24]: Loss 0.005675414
Epoch [24]: Loss 0.0060058255
Epoch [24]: Loss 0.0055106133
Epoch [24]: Loss 0.0062222187
Epoch [24]: Loss 0.00535284
Epoch [24]: Loss 0.005015239
Validation: Loss 0.0056366487 Accuracy 1.0
Validation: Loss 0.005444357 Accuracy 1.0
Epoch [25]: Loss 0.0056326026
Epoch [25]: Loss 0.0056151934
Epoch [25]: Loss 0.0052148593
Epoch [25]: Loss 0.005695367
Epoch [25]: Loss 0.005301879
Epoch [25]: Loss 0.0049775895
Epoch [25]: Loss 0.005264299
Validation: Loss 0.005316565 Accuracy 1.0
Validation: Loss 0.0051343255 Accuracy 1.0

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
  JULIA_PROJECT = /var/lib/buildkite-agent/builds/gpuci-16/julialang/lux-dot-jl/docs/Project.toml
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

2 devices:
  0: Quadro RTX 5000 (sm_75, 15.320 GiB / 16.000 GiB available)
  1: Quadro RTX 5000 (sm_75, 15.736 GiB / 16.000 GiB available)
┌ Warning: LuxAMDGPU is loaded but the AMDGPU is not functional.
└ @ LuxAMDGPU ~/.cache/julia-buildkite-plugin/depots/01872db4-8c79-43af-ab7d-12abac4f24f6/packages/LuxAMDGPU/sGa0S/src/LuxAMDGPU.jl:19

```


---


*This page was generated using [Literate.jl](https://github.com/fredrikekre/Literate.jl).*

