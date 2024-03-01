


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
└ @ Lux /var/lib/buildkite-agent/builds/gpuci-10/julialang/lux-dot-jl/src/utils.jl:9
Epoch [1]: Loss 0.5626893
Epoch [1]: Loss 0.51298076
Epoch [1]: Loss 0.47964352
Epoch [1]: Loss 0.44629377
Epoch [1]: Loss 0.430804
Epoch [1]: Loss 0.40386695
Epoch [1]: Loss 0.39630252
Validation: Loss 0.36233026 Accuracy 1.0
Validation: Loss 0.37604427 Accuracy 1.0
Epoch [2]: Loss 0.36498487
Epoch [2]: Loss 0.35543242
Epoch [2]: Loss 0.337987
Epoch [2]: Loss 0.31620017
Epoch [2]: Loss 0.2998754
Epoch [2]: Loss 0.28880602
Epoch [2]: Loss 0.2764368
Validation: Loss 0.25447172 Accuracy 1.0
Validation: Loss 0.26214194 Accuracy 1.0
Epoch [3]: Loss 0.25577176
Epoch [3]: Loss 0.25065833
Epoch [3]: Loss 0.23448367
Epoch [3]: Loss 0.22224261
Epoch [3]: Loss 0.21047576
Epoch [3]: Loss 0.19668907
Epoch [3]: Loss 0.18944617
Validation: Loss 0.17853662 Accuracy 1.0
Validation: Loss 0.18175203 Accuracy 1.0
Epoch [4]: Loss 0.1819684
Epoch [4]: Loss 0.1705351
Epoch [4]: Loss 0.16284846
Epoch [4]: Loss 0.15646768
Epoch [4]: Loss 0.1485022
Epoch [4]: Loss 0.14115435
Epoch [4]: Loss 0.1347578
Validation: Loss 0.1274459 Accuracy 1.0
Validation: Loss 0.12957901 Accuracy 1.0
Epoch [5]: Loss 0.12842822
Epoch [5]: Loss 0.12172341
Epoch [5]: Loss 0.11837906
Epoch [5]: Loss 0.11181179
Epoch [5]: Loss 0.1067516
Epoch [5]: Loss 0.10319384
Epoch [5]: Loss 0.098702684
Validation: Loss 0.09219136 Accuracy 1.0
Validation: Loss 0.09453597 Accuracy 1.0
Epoch [6]: Loss 0.0925374
Epoch [6]: Loss 0.09023671
Epoch [6]: Loss 0.08758189
Epoch [6]: Loss 0.08245692
Epoch [6]: Loss 0.07715756
Epoch [6]: Loss 0.073747575
Epoch [6]: Loss 0.07484344
Validation: Loss 0.06760585 Accuracy 1.0
Validation: Loss 0.07012216 Accuracy 1.0
Epoch [7]: Loss 0.0684533
Epoch [7]: Loss 0.067225456
Epoch [7]: Loss 0.06282674
Epoch [7]: Loss 0.060444787
Epoch [7]: Loss 0.058758724
Epoch [7]: Loss 0.056935955
Epoch [7]: Loss 0.049782965
Validation: Loss 0.050123423 Accuracy 1.0
Validation: Loss 0.05262923 Accuracy 1.0
Epoch [8]: Loss 0.052451186
Epoch [8]: Loss 0.04898668
Epoch [8]: Loss 0.04693233
Epoch [8]: Loss 0.045399442
Epoch [8]: Loss 0.04325281
Epoch [8]: Loss 0.04177333
Epoch [8]: Loss 0.0437567
Validation: Loss 0.037441373 Accuracy 1.0
Validation: Loss 0.039882448 Accuracy 1.0
Epoch [9]: Loss 0.03718517
Epoch [9]: Loss 0.038238756
Epoch [9]: Loss 0.036939807
Epoch [9]: Loss 0.034569133
Epoch [9]: Loss 0.033115808
Epoch [9]: Loss 0.03181766
Epoch [9]: Loss 0.028768286
Validation: Loss 0.028412037 Accuracy 1.0
Validation: Loss 0.030650279 Accuracy 1.0
Epoch [10]: Loss 0.031217365
Epoch [10]: Loss 0.02835632
Epoch [10]: Loss 0.02770094
Epoch [10]: Loss 0.027590137
Epoch [10]: Loss 0.024880055
Epoch [10]: Loss 0.023494542
Epoch [10]: Loss 0.02343002
Validation: Loss 0.022222182 Accuracy 1.0
Validation: Loss 0.024230054 Accuracy 1.0
Epoch [11]: Loss 0.022968426
Epoch [11]: Loss 0.021883525
Epoch [11]: Loss 0.020809349
Epoch [11]: Loss 0.02255267
Epoch [11]: Loss 0.021795006
Epoch [11]: Loss 0.020244999
Epoch [11]: Loss 0.01732013
Validation: Loss 0.018031497 Accuracy 1.0
Validation: Loss 0.019777484 Accuracy 1.0
Epoch [12]: Loss 0.018449554
Epoch [12]: Loss 0.019045714
Epoch [12]: Loss 0.018184997
Epoch [12]: Loss 0.017503388
Epoch [12]: Loss 0.017523512
Epoch [12]: Loss 0.016420603
Epoch [12]: Loss 0.015410485
Validation: Loss 0.015123749 Accuracy 1.0
Validation: Loss 0.016653461 Accuracy 1.0
Epoch [13]: Loss 0.016116839
Epoch [13]: Loss 0.015546665
Epoch [13]: Loss 0.015208285
Epoch [13]: Loss 0.015608379
Epoch [13]: Loss 0.014499322
Epoch [13]: Loss 0.014306484
Epoch [13]: Loss 0.012016663
Validation: Loss 0.013043463 Accuracy 1.0
Validation: Loss 0.014391307 Accuracy 1.0
Epoch [14]: Loss 0.013840447
Epoch [14]: Loss 0.013911471
Epoch [14]: Loss 0.012414285
Epoch [14]: Loss 0.0132638225
Epoch [14]: Loss 0.0129847955
Epoch [14]: Loss 0.012662452
Epoch [14]: Loss 0.01200722
Validation: Loss 0.011495647 Accuracy 1.0
Validation: Loss 0.012697743 Accuracy 1.0
Epoch [15]: Loss 0.01211393
Epoch [15]: Loss 0.011722025
Epoch [15]: Loss 0.0119894985
Epoch [15]: Loss 0.011774351
Epoch [15]: Loss 0.011365046
Epoch [15]: Loss 0.011202216
Epoch [15]: Loss 0.010656777
Validation: Loss 0.010279788 Accuracy 1.0
Validation: Loss 0.011382695 Accuracy 1.0
Epoch [16]: Loss 0.010377975
Epoch [16]: Loss 0.010910435
Epoch [16]: Loss 0.010987857
Epoch [16]: Loss 0.010278388
Epoch [16]: Loss 0.01050384
Epoch [16]: Loss 0.009633544
Epoch [16]: Loss 0.0110759605
Validation: Loss 0.009301623 Accuracy 1.0
Validation: Loss 0.010293224 Accuracy 1.0
Epoch [17]: Loss 0.009810895
Epoch [17]: Loss 0.010315498
Epoch [17]: Loss 0.009135963
Epoch [17]: Loss 0.0091910865
Epoch [17]: Loss 0.0091797495
Epoch [17]: Loss 0.00953956
Epoch [17]: Loss 0.009056248
Validation: Loss 0.008479189 Accuracy 1.0
Validation: Loss 0.009393081 Accuracy 1.0
Epoch [18]: Loss 0.00867315
Epoch [18]: Loss 0.009011677
Epoch [18]: Loss 0.008277668
Epoch [18]: Loss 0.008760173
Epoch [18]: Loss 0.008766528
Epoch [18]: Loss 0.008654326
Epoch [18]: Loss 0.008798524
Validation: Loss 0.0077843172 Accuracy 1.0
Validation: Loss 0.008634607 Accuracy 1.0
Epoch [19]: Loss 0.008209634
Epoch [19]: Loss 0.008358967
Epoch [19]: Loss 0.008086117
Epoch [19]: Loss 0.007992735
Epoch [19]: Loss 0.008091163
Epoch [19]: Loss 0.00743998
Epoch [19]: Loss 0.0074552023
Validation: Loss 0.0071876505 Accuracy 1.0
Validation: Loss 0.007970937 Accuracy 1.0
Epoch [20]: Loss 0.0077532544
Epoch [20]: Loss 0.0076660137
Epoch [20]: Loss 0.00792549
Epoch [20]: Loss 0.007151885
Epoch [20]: Loss 0.006897432
Epoch [20]: Loss 0.007295597
Epoch [20]: Loss 0.006465375
Validation: Loss 0.0066659893 Accuracy 1.0
Validation: Loss 0.0074022016 Accuracy 1.0
Epoch [21]: Loss 0.006426575
Epoch [21]: Loss 0.007290085
Epoch [21]: Loss 0.0071067214
Epoch [21]: Loss 0.0067295786
Epoch [21]: Loss 0.0070085973
Epoch [21]: Loss 0.0068011573
Epoch [21]: Loss 0.006631789
Validation: Loss 0.006213531 Accuracy 1.0
Validation: Loss 0.00690089 Accuracy 1.0
Epoch [22]: Loss 0.006025406
Epoch [22]: Loss 0.0066009164
Epoch [22]: Loss 0.006426998
Epoch [22]: Loss 0.006647628
Epoch [22]: Loss 0.0065542455
Epoch [22]: Loss 0.006268837
Epoch [22]: Loss 0.0065498613
Validation: Loss 0.0058082785 Accuracy 1.0
Validation: Loss 0.0064619905 Accuracy 1.0
Epoch [23]: Loss 0.006419776
Epoch [23]: Loss 0.0057876036
Epoch [23]: Loss 0.0062078075
Epoch [23]: Loss 0.005887476
Epoch [23]: Loss 0.00578506
Epoch [23]: Loss 0.006037447
Epoch [23]: Loss 0.0059776446
Validation: Loss 0.005448888 Accuracy 1.0
Validation: Loss 0.006058069 Accuracy 1.0
Epoch [24]: Loss 0.0059894775
Epoch [24]: Loss 0.005750439
Epoch [24]: Loss 0.0056156227
Epoch [24]: Loss 0.005442708
Epoch [24]: Loss 0.005986997
Epoch [24]: Loss 0.0051341783
Epoch [24]: Loss 0.0056456374
Validation: Loss 0.0051233377 Accuracy 1.0
Validation: Loss 0.00570032 Accuracy 1.0
Epoch [25]: Loss 0.0057626953
Epoch [25]: Loss 0.0052926224
Epoch [25]: Loss 0.0053356118
Epoch [25]: Loss 0.0049162363
Epoch [25]: Loss 0.0053528165
Epoch [25]: Loss 0.005148436
Epoch [25]: Loss 0.0058078514
Validation: Loss 0.0048311055 Accuracy 1.0
Validation: Loss 0.005376198 Accuracy 1.0

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
Julia Version 1.10.1
Commit 7790d6f0641 (2024-02-13 20:41 UTC)
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
  JULIA_PROJECT = /var/lib/buildkite-agent/builds/gpuci-10/julialang/lux-dot-jl/docs/Project.toml
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
- Julia: 1.10.1
- LLVM: 15.0.7

Environment:
- JULIA_CUDA_HARD_MEMORY_LIMIT: 25%

1 device:
  0: NVIDIA A100-PCIE-40GB MIG 1g.5gb (sm_80, 4.224 GiB / 4.750 GiB available)
┌ Warning: LuxAMDGPU is loaded but the AMDGPU is not functional.
└ @ LuxAMDGPU ~/.cache/julia-buildkite-plugin/depots/01872db4-8c79-43af-ab7d-12abac4f24f6/packages/LuxAMDGPU/sGa0S/src/LuxAMDGPU.jl:19

```


---


*This page was generated using [Literate.jl](https://github.com/fredrikekre/Literate.jl).*

