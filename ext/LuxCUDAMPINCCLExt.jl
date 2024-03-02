module LuxCUDAMPINCCLExt

import Lux: MPIBackend, NCCLBackend, DistributedUtils
import LuxDeviceUtils: AbstractLuxDevice, LuxCUDADevice
import MPI
import NCCL
import Setfield: @set!

function DistributedUtils.__initialize(
        ::Val{:NCCL}; cuda_devices=nothing, amdgpu_devices=missing)
    DistributedUtils.NCCL_Initialized[] = true
    @assert amdgpu_devices===missing "`AMDGPU` is not supported by `NCCL`."
    DistributedUtils.__initialize(Val(:MPI); cuda_devices, amdgpu_devices)
    return
end

function DistributedUtils.__get_distributed_backend(::Val{:NCCL})
    unique_id = NCCL.UniqueID()  # Generate on all ranks to know the type
    mpi_backend = DistributedUtils.__get_distributed_backend(Val(:MPI))
    buf = [unique_id.internal...]
    DistributedUtils.bcast!(mpi_backend, buf; root=0)
    @set! unique_id.internal = Tuple(buf)

    nranks = DistributedUtils.total_workers(mpi_backend)
    rank = DistributedUtils.local_rank(mpi_backend)

    return NCCLBackend(NCCL.Communicator(nranks, rank; unique_id), mpi_backend)
end

DistributedUtils.local_rank(backend::NCCLBackend) = NCCL.rank(backend.comm)

DistributedUtils.total_workers(backend::NCCLBackend) = NCCL.size(backend.comm)

# For non-CUDA Arrays, fallback to MPI

# Broadcast

function DistributedUtils.__bcast!(
        backend::NCCLBackend, sendrecvbuf, ::LuxCUDADevice; root=0)
    NCCL.Broadcast!(sendrecvbuf, backend.comm; root)
    return sendrecvbuf
end

function DistributedUtils.__bcast!(
        backend::NCCLBackend, sendrecvbuf, dev::AbstractLuxDevice; root=0)
    return DistributedUtils.__bcast!(backend.mpi_backend, sendrecvbuf, dev; root)
end

function DistributedUtils.__bcast!(
        backend::NCCLBackend, sendbuf, recvbuf, ::LuxCUDADevice; root=0)
    NCCL.Broadcast!(sendbuf, recvbuf, backend.comm; root)
    return recvbuf
end

function DistributedUtils.__bcast!(
        backend::NCCLBackend, sendbuf, recvbuf, dev::AbstractLuxDevice; root=0)
    return DistributedUtils.__bcast!(backend.mpi_backend, sendbuf, recvbuf, dev; root)
end

# Allreduce

function DistributedUtils.__allreduce!(
        backend::NCCLBackend, sendrecvbuf, op::F, ::LuxCUDADevice) where {F}
    op = ifelse(op === DistributedUtils.avg, NCCL.avg, op)
    NCCL.Allreduce!(sendrecvbuf, op, backend.comm)
    return sendrecvbuf
end

function DistributedUtils.__allreduce!(
        backend::NCCLBackend, sendrecvbuf, op::F, dev::AbstractLuxDevice) where {F}
    return DistributedUtils.__allreduce!(backend.mpi_backend, sendrecvbuf, op, dev)
end

function DistributedUtils.__allreduce!(
        backend::NCCLBackend, sendbuf, recvbuf, op::F, ::LuxCUDADevice) where {F}
    op = ifelse(op === DistributedUtils.avg, NCCL.avg, op)
    NCCL.Allreduce!(sendbuf, recvbuf, op, backend.comm)
    return recvbuf
end

function DistributedUtils.__allreduce!(
        backend::NCCLBackend, sendbuf, recvbuf, op::F, dev::AbstractLuxDevice) where {F}
    return DistributedUtils.__allreduce!(backend.mpi_backend, sendbuf, recvbuf, op, dev)
end

# Reduce

function DistributedUtils.__reduce!(
        backend::NCCLBackend, sendrecvbuf, op::F, ::LuxCUDADevice; root::Int) where {F}
    op = ifelse(op === DistributedUtils.avg, NCCL.avg, op)
    NCCL.Reduce!(sendrecvbuf, op, backend.comm; root)
    return sendrecvbuf
end

function DistributedUtils.__reduce!(backend::NCCLBackend, sendrecvbuf, op::F,
        dev::AbstractLuxDevice; root::Int) where {F}
    return DistributedUtils.__reduce!(backend.mpi_backend, sendrecvbuf, op, dev; root)
end

function DistributedUtils.__reduce!(
        backend::NCCLBackend, sendbuf, recvbuf, op::F, ::LuxCUDADevice; root::Int) where {F}
    op = ifelse(op === DistributedUtils.avg, NCCL.avg, op)
    NCCL.Reduce!(sendbuf, recvbuf, op, backend.comm; root)
    return recvbuf
end

function DistributedUtils.__reduce!(backend::NCCLBackend, sendbuf, recvbuf, op::F,
        dev::AbstractLuxDevice; root::Int) where {F}
    return DistributedUtils.__reduce!(backend.mpi_backend, sendbuf, recvbuf, op, dev; root)
end

end
