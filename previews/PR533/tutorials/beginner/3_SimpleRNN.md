


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
Epoch [1]: Loss 0.56337523
Epoch [1]: Loss 0.50749266
Epoch [1]: Loss 0.4758215
Epoch [1]: Loss 0.43860504
Epoch [1]: Loss 0.42790496
Epoch [1]: Loss 0.41194782
Epoch [1]: Loss 0.39885217
Validation: Loss 0.36296716 Accuracy 1.0
Validation: Loss 0.3732893 Accuracy 1.0
Epoch [2]: Loss 0.35736123
Epoch [2]: Loss 0.3434135
Epoch [2]: Loss 0.33560383
Epoch [2]: Loss 0.31588352
Epoch [2]: Loss 0.31151587
Epoch [2]: Loss 0.2920998
Epoch [2]: Loss 0.26698464
Validation: Loss 0.2546891 Accuracy 1.0
Validation: Loss 0.26114035 Accuracy 1.0
Epoch [3]: Loss 0.259471
Epoch [3]: Loss 0.24404362
Epoch [3]: Loss 0.22976619
Epoch [3]: Loss 0.21903744
Epoch [3]: Loss 0.21114576
Epoch [3]: Loss 0.20052813
Epoch [3]: Loss 0.19355203
Validation: Loss 0.17837946 Accuracy 1.0
Validation: Loss 0.18164967 Accuracy 1.0
Epoch [4]: Loss 0.17823732
Epoch [4]: Loss 0.17048615
Epoch [4]: Loss 0.16280311
Epoch [4]: Loss 0.15655974
Epoch [4]: Loss 0.14760914
Epoch [4]: Loss 0.14239024
Epoch [4]: Loss 0.1370506
Validation: Loss 0.12748694 Accuracy 1.0
Validation: Loss 0.1295225 Accuracy 1.0
Epoch [5]: Loss 0.12994863
Epoch [5]: Loss 0.12275815
Epoch [5]: Loss 0.11752546
Epoch [5]: Loss 0.11356672
Epoch [5]: Loss 0.10654067
Epoch [5]: Loss 0.100888304
Epoch [5]: Loss 0.09479289
Validation: Loss 0.09269297 Accuracy 1.0
Validation: Loss 0.094441496 Accuracy 1.0
Epoch [6]: Loss 0.093255214
Epoch [6]: Loss 0.08957571
Epoch [6]: Loss 0.086840674
Epoch [6]: Loss 0.08172738
Epoch [6]: Loss 0.077597246
Epoch [6]: Loss 0.07599001
Epoch [6]: Loss 0.07186393
Validation: Loss 0.06809278 Accuracy 1.0
Validation: Loss 0.07010147 Accuracy 1.0
Epoch [7]: Loss 0.068605244
Epoch [7]: Loss 0.067331865
Epoch [7]: Loss 0.06451231
Epoch [7]: Loss 0.06092893
Epoch [7]: Loss 0.057723038
Epoch [7]: Loss 0.0554845
Epoch [7]: Loss 0.05397105
Validation: Loss 0.050649825 Accuracy 1.0
Validation: Loss 0.052674334 Accuracy 1.0
Epoch [8]: Loss 0.053284228
Epoch [8]: Loss 0.04977673
Epoch [8]: Loss 0.045068648
Epoch [8]: Loss 0.046246633
Epoch [8]: Loss 0.042481896
Epoch [8]: Loss 0.043650232
Epoch [8]: Loss 0.042448647
Validation: Loss 0.038022988 Accuracy 1.0
Validation: Loss 0.039942697 Accuracy 1.0
Epoch [9]: Loss 0.03894242
Epoch [9]: Loss 0.038044807
Epoch [9]: Loss 0.03599082
Epoch [9]: Loss 0.034863945
Epoch [9]: Loss 0.034015667
Epoch [9]: Loss 0.031943746
Epoch [9]: Loss 0.027422937
Validation: Loss 0.028977012 Accuracy 1.0
Validation: Loss 0.03071075 Accuracy 1.0
Epoch [10]: Loss 0.027655954
Epoch [10]: Loss 0.029910116
Epoch [10]: Loss 0.028461806
Epoch [10]: Loss 0.02769566
Epoch [10]: Loss 0.025012089
Epoch [10]: Loss 0.02581808
Epoch [10]: Loss 0.023657847
Validation: Loss 0.02273979 Accuracy 1.0
Validation: Loss 0.024292124 Accuracy 1.0
Epoch [11]: Loss 0.023513962
Epoch [11]: Loss 0.022855058
Epoch [11]: Loss 0.021361468
Epoch [11]: Loss 0.022309836
Epoch [11]: Loss 0.020640735
Epoch [11]: Loss 0.019956086
Epoch [11]: Loss 0.021272216
Validation: Loss 0.018474635 Accuracy 1.0
Validation: Loss 0.019821646 Accuracy 1.0
Epoch [12]: Loss 0.019270498
Epoch [12]: Loss 0.01882109
Epoch [12]: Loss 0.016773555
Epoch [12]: Loss 0.017190112
Epoch [12]: Loss 0.018190682
Epoch [12]: Loss 0.017357487
Epoch [12]: Loss 0.017387226
Validation: Loss 0.015499344 Accuracy 1.0
Validation: Loss 0.016677149 Accuracy 1.0
Epoch [13]: Loss 0.015779877
Epoch [13]: Loss 0.015924936
Epoch [13]: Loss 0.014994588
Epoch [13]: Loss 0.015805464
Epoch [13]: Loss 0.0142917745
Epoch [13]: Loss 0.014824415
Epoch [13]: Loss 0.013730542
Validation: Loss 0.013364432 Accuracy 1.0
Validation: Loss 0.014385283 Accuracy 1.0
Epoch [14]: Loss 0.013575071
Epoch [14]: Loss 0.012616677
Epoch [14]: Loss 0.01323857
Epoch [14]: Loss 0.013758374
Epoch [14]: Loss 0.013333771
Epoch [14]: Loss 0.013033183
Epoch [14]: Loss 0.012406262
Validation: Loss 0.011774819 Accuracy 1.0
Validation: Loss 0.012693521 Accuracy 1.0
Epoch [15]: Loss 0.012905721
Epoch [15]: Loss 0.011829946
Epoch [15]: Loss 0.011386659
Epoch [15]: Loss 0.011737516
Epoch [15]: Loss 0.011765862
Epoch [15]: Loss 0.011290196
Epoch [15]: Loss 0.009845454
Validation: Loss 0.010532862 Accuracy 1.0
Validation: Loss 0.011352824 Accuracy 1.0
Epoch [16]: Loss 0.010622037
Epoch [16]: Loss 0.0107609
Epoch [16]: Loss 0.010245346
Epoch [16]: Loss 0.010922714
Epoch [16]: Loss 0.01079922
Epoch [16]: Loss 0.009943573
Epoch [16]: Loss 0.010571126
Validation: Loss 0.009531221 Accuracy 1.0
Validation: Loss 0.010299222 Accuracy 1.0
Epoch [17]: Loss 0.009550773
Epoch [17]: Loss 0.010480063
Epoch [17]: Loss 0.009140246
Epoch [17]: Loss 0.009862572
Epoch [17]: Loss 0.009848495
Epoch [17]: Loss 0.0086590955
Epoch [17]: Loss 0.009460954
Validation: Loss 0.008695112 Accuracy 1.0
Validation: Loss 0.009389089 Accuracy 1.0
Epoch [18]: Loss 0.009549481
Epoch [18]: Loss 0.009139927
Epoch [18]: Loss 0.009277986
Epoch [18]: Loss 0.007986956
Epoch [18]: Loss 0.008701671
Epoch [18]: Loss 0.008203172
Epoch [18]: Loss 0.007905444
Validation: Loss 0.007982956 Accuracy 1.0
Validation: Loss 0.008633497 Accuracy 1.0
Epoch [19]: Loss 0.00886791
Epoch [19]: Loss 0.008086185
Epoch [19]: Loss 0.0077967397
Epoch [19]: Loss 0.007457369
Epoch [19]: Loss 0.008494241
Epoch [19]: Loss 0.0076411897
Epoch [19]: Loss 0.008464104
Validation: Loss 0.007374733 Accuracy 1.0
Validation: Loss 0.007978723 Accuracy 1.0
Epoch [20]: Loss 0.008167287
Epoch [20]: Loss 0.008027346
Epoch [20]: Loss 0.0075749415
Epoch [20]: Loss 0.0070367185
Epoch [20]: Loss 0.0070394366
Epoch [20]: Loss 0.0071471184
Epoch [20]: Loss 0.0069574304
Validation: Loss 0.0068419212 Accuracy 1.0
Validation: Loss 0.007406818 Accuracy 1.0
Epoch [21]: Loss 0.0069039883
Epoch [21]: Loss 0.0069390945
Epoch [21]: Loss 0.006867515
Epoch [21]: Loss 0.0071829
Epoch [21]: Loss 0.007075423
Epoch [21]: Loss 0.006676506
Epoch [21]: Loss 0.0070679435
Validation: Loss 0.006376546 Accuracy 1.0
Validation: Loss 0.006913584 Accuracy 1.0
Epoch [22]: Loss 0.0067913886
Epoch [22]: Loss 0.006518925
Epoch [22]: Loss 0.0063136145
Epoch [22]: Loss 0.006793047
Epoch [22]: Loss 0.0063467296
Epoch [22]: Loss 0.0059652575
Epoch [22]: Loss 0.007233184
Validation: Loss 0.0059630037 Accuracy 1.0
Validation: Loss 0.006460206 Accuracy 1.0
Epoch [23]: Loss 0.0059201797
Epoch [23]: Loss 0.006337505
Epoch [23]: Loss 0.005474203
Epoch [23]: Loss 0.0059581194
Epoch [23]: Loss 0.0066161533
Epoch [23]: Loss 0.006115027
Epoch [23]: Loss 0.006049047
Validation: Loss 0.0055922223 Accuracy 1.0
Validation: Loss 0.0060674576 Accuracy 1.0
Epoch [24]: Loss 0.005552082
Epoch [24]: Loss 0.005813565
Epoch [24]: Loss 0.006083791
Epoch [24]: Loss 0.0055008107
Epoch [24]: Loss 0.0057632094
Epoch [24]: Loss 0.005676751
Epoch [24]: Loss 0.0049953447
Validation: Loss 0.005260218 Accuracy 1.0
Validation: Loss 0.005704651 Accuracy 1.0
Epoch [25]: Loss 0.0056951186
Epoch [25]: Loss 0.005383821
Epoch [25]: Loss 0.0054311836
Epoch [25]: Loss 0.005119635
Epoch [25]: Loss 0.005088772
Epoch [25]: Loss 0.0053907353
Epoch [25]: Loss 0.005808809
Validation: Loss 0.004961744 Accuracy 1.0
Validation: Loss 0.0053842487 Accuracy 1.0

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
  JULIA_PROJECT = /var/lib/buildkite-agent/builds/gpuci-2/julialang/lux-dot-jl/docs/Project.toml
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
  0: NVIDIA A100-PCIE-40GB MIG 1g.5gb (sm_80, 4.359 GiB / 4.750 GiB available)
┌ Warning: LuxAMDGPU is loaded but the AMDGPU is not functional.
└ @ LuxAMDGPU ~/.cache/julia-buildkite-plugin/depots/01872db4-8c79-43af-ab7d-12abac4f24f6/packages/LuxAMDGPU/sGa0S/src/LuxAMDGPU.jl:19

```


---


*This page was generated using [Literate.jl](https://github.com/fredrikekre/Literate.jl).*

