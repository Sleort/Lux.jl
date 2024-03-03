module LuxSimpleChainsExt

using Lux
import SimpleChains
import Lux: SimpleChainsModelConversionError, __to_simplechains_adaptor,
            __fix_input_dims_simplechain
import Optimisers
import Random: AbstractRNG

function __fix_input_dims_simplechain(layers::Vector, input_dims)
    return SimpleChains.SimpleChain(input_dims, layers...)
end

__equivalent_simplechains_fn(::typeof(Lux.relu)) = SimpleChains.relu
__equivalent_simplechains_fn(f::F) where {F} = f

function __to_simplechains_adaptor(layer::Dense{use_bias}) where {use_bias}
    return SimpleChains.TurboDense{use_bias}(
        __equivalent_simplechains_fn(layer.activation), layer.out_dims)
end

function __to_simplechains_adaptor(layer::Chain)
    return reduce(vcat, map(__to_simplechains_adaptor, layer.layers))
end

function __to_simplechains_adaptor(layer::Conv)
    if all(==(1), layer.stride) &&
       layer.groups == 1 &&
       all(==(1), layer.dilation) &&
       (!(layer.pad isa SamePad) && all(==(0), layer.pad))
        return SimpleChains.Conv(__equivalent_simplechains_fn(layer.activation),
            layer.kernel_size, layer.out_chs)
    end
    throw(SimpleChainsModelConversionError("Conv with non-standard parameters not \
                                            supported."))
end

function __to_simplechains_adaptor(layer::Dropout)
    layer.dims isa Colon && return SimpleChains.Dropout(layer.p)
    throw(SimpleChainsModelConversionError("Dropout with non-standard parameters not \
                                            supported."))
end

function __to_simplechains_adaptor(layer::FlattenLayer)
    if layer.N === nothing
        throw(SimpleChainsModelConversionError("`FlattenLayer(nothing)` not supported. For \
                                                `SimpleChains.Flatten` you must use \
                                                `FlattenLayer(N::Int)`"))
    end
    return SimpleChains.Flatten(layer.N)
end

function __to_simplechains_adaptor(layer::MaxPool)
    if layer.stride == layer.k && (!(layer.pad isa SamePad) && all(==(0), layer.pad))
        return SimpleChains.MaxPool(layer.k)
    end
    throw(SimpleChainsModelConversionError("MaxPool with non-standard parameters not \
                                            supported."))
end

__to_simplechains_adaptor(layer) = throw(SimpleChainsModelConversionError(layer))

function Lux.initialparameters(::AbstractRNG, layer::SimpleChainsLayer)
    return (; params=Array(SimpleChains.init_params(layer.layer)))
end

# Some type-piracy for nicer interaction with NNlib
NNlib.logsoftmax(x::SimpleChains.StrideArray{T, 2}) where {T} = SimpleChains.logsoftmax(x)

function NNlib.logsoftmax!(y::SimpleChains.StrideArray{T1, 2},
        x::Union{SimpleChains.StrideArray{T2, 2}, SimpleChains.PtrArray{T2, 2}};
        dims=1) where {T1, T2}
    @assert dims == 1
    m = similar(y, SimpleChains.static_size(y, 2))
    SimpleChains.logsoftmax!(y, m, x)
    return y
end

end
