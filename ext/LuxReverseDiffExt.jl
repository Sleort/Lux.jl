module LuxReverseDiffExt

import Lux: __value
using ReverseDiff: TrackedReal, TrackedArray, value

__value(x::AbstractArray{<:TrackedReal}) = value.(x)
__value(x::TrackedArray) = value(x)

end
