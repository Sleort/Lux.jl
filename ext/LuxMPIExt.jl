module LuxMPIExt

using Lux: MPIBackend, NCCLBackend, DistributedUtils, __unwrap_val, MPI_CUDA_AWARE,
           MPI_ROCM_AWARE
using LuxDeviceUtils: AbstractLuxDevice, LuxCUDADevice, LuxAMDGPUDevice, cpu_device,
                      set_device!, __is_functional
using MPI: MPI

function DistributedUtils.__initialize(
        ::Type{MPIBackend}; cuda_devices=nothing, amdgpu_devices=nothing,
        force_cuda::Bool=false, caller::String="", force_amdgpu::Bool=false) # Undocumented internal kwarg 
    !MPI.Initialized() && MPI.Init()
    DistributedUtils.MPI_Initialized[] = true

    local_rank = MPI.Comm_rank(MPI.COMM_WORLD)

    if cuda_devices !== missing && __is_functional(LuxCUDADevice)
        if cuda_devices === nothing
            set_device!(LuxCUDADevice, nothing, local_rank + 1)
        else
            set_device!(LuxCUDADevice, cuda_devices[local_rank + 1])
        end
    elseif force_cuda
        error(lazy"CUDA devices are not functional (or `LuxCUDA.jl` not loaded) and `force_cuda` is set to `true`. This is caused by backend: $(caller).")
    end

    if amdgpu_devices !== missing && __is_functional(LuxAMDGPUDevice)
        if amdgpu_devices === nothing
            set_device!(LuxAMDGPUDevice, nothing, local_rank + 1)
        else
            set_device!(LuxAMDGPUDevice, amdgpu_devices[local_rank + 1])
        end
    elseif force_amdgpu
        error(lazy"AMDGPU devices are not functional (or `LuxAMDGPU.jl` not loaded) and `force_amdgpu` is set to `true`. This is caused by backend: $(caller).")
    end

    return
end

DistributedUtils.__get_distributed_backend(::Type{MPIBackend}) = MPIBackend(MPI.COMM_WORLD)

DistributedUtils.local_rank(backend::MPIBackend) = MPI.Comm_rank(backend.comm)

DistributedUtils.total_workers(backend::MPIBackend) = MPI.Comm_size(backend.comm)

# Broadcast
function DistributedUtils.__bcast!(
        backend::MPIBackend, sendrecvbuf, dev::AbstractLuxDevice; root=0)
    MPI.Bcast!(sendrecvbuf, backend.comm; root)
    return sendrecvbuf
end

function DistributedUtils.__bcast!(
        backend::MPIBackend, sendbuf, recvbuf, dev::AbstractLuxDevice; root=0)
    return DistributedUtils.__bcast!(
        backend, ifelse(DistributedUtils.local_rank(backend) == root, sendbuf, recvbuf),
        dev; root)
end

for (aware, dType) in ((MPI_CUDA_AWARE, LuxCUDADevice), (MPI_ROCM_AWARE, LuxAMDGPUDevice))
    if !aware
        @eval begin
            function DistributedUtils.__bcast!(
                    backend::MPIBackend, sendrecvbuf, dev::$dType; root=0)
                cdev = cpu_device()
                sendrecvbuf_ = sendrecvbuf |> cdev
                DistributedUtils.__bcast!(backend, sendrecvbuf_, cdev; root)
                sendrecvbuf .= dev(sendrecvbuf_)
                return sendrecvbuf
            end

            function DistributedUtils.__bcast!(
                    backend::MPIBackend, sendbuf, recvbuf, dev::$dType; root=0)
                cdev = cpu_device()
                sendbuf_ = sendbuf |> cdev
                recvbuf_ = recvbuf |> cdev
                DistributedUtils.__bcast!(backend, sendbuf_, recvbuf_, cdev; root)
                recvbuf .= dev(recvbuf_)
                return recvbuf
            end
        end
    end
end

# Allreduce
function DistributedUtils.__allreduce!(
        backend::MPIBackend, sendrecvbuf, op::F, dev::AbstractLuxDevice) where {F}
    mpiop = ifelse(op === DistributedUtils.avg, +, op)
    MPI.Allreduce!(sendrecvbuf, mpiop, backend.comm)
    if op === DistributedUtils.avg
        sendrecvbuf ./= DistributedUtils.total_workers(backend)
    end
    return sendrecvbuf
end

function DistributedUtils.__allreduce!(
        backend::MPIBackend, sendbuf, recvbuf, op::F, dev::AbstractLuxDevice) where {F}
    mpiop = ifelse(op === DistributedUtils.avg, +, op)
    MPI.Allreduce!(sendbuf, recvbuf, mpiop, backend.comm)
    if op === DistributedUtils.avg
        recvbuf ./= DistributedUtils.total_workers(backend)
    end
    return recvbuf
end

for (aware, dType) in ((MPI_CUDA_AWARE, LuxCUDADevice), (MPI_ROCM_AWARE, LuxAMDGPUDevice))
    if !aware
        @eval begin
            function DistributedUtils.__allreduce!(
                    backend::MPIBackend, sendrecvbuf, op::F, dev::$dType) where {F}
                cdev = cpu_device()
                sendrecvbuf_ = sendrecvbuf |> cdev
                DistributedUtils.__allreduce!(backend, sendrecvbuf_, op, cdev)
                sendrecvbuf .= dev(sendrecvbuf_)
                return sendrecvbuf
            end

            function DistributedUtils.__allreduce!(
                    backend::MPIBackend, sendbuf, recvbuf, op::F, dev::$dType) where {F}
                cdev = cpu_device()
                sendbuf_ = sendbuf |> cdev
                recvbuf_ = recvbuf |> cdev
                DistributedUtils.__allreduce!(backend, sendbuf_, recvbuf_, op, cdev)
                recvbuf .= dev(recvbuf_)
                return recvbuf
            end
        end
    end
end

# Reduce
function DistributedUtils.__reduce!(backend::MPIBackend, sendrecvbuf, op::F,
        dev::AbstractLuxDevice; root::Int) where {F}
    mpiop = ifelse(op === DistributedUtils.avg, +, op)
    MPI.Reduce!(sendrecvbuf, mpiop, backend.comm; root)
    if op === DistributedUtils.avg
        sendrecvbuf ./= DistributedUtils.total_workers(backend)
    end
    return sendrecvbuf
end

function DistributedUtils.__reduce!(backend::MPIBackend, sendbuf, recvbuf, op::F,
        dev::AbstractLuxDevice; root::Int) where {F}
    mpiop = ifelse(op === DistributedUtils.avg, +, op)
    MPI.Reduce!(sendbuf, recvbuf, mpiop, backend.comm; root)
    if op === DistributedUtils.avg
        recvbuf ./= DistributedUtils.total_workers(backend)
    end
    return recvbuf
end

for (aware, dType) in ((MPI_CUDA_AWARE, LuxCUDADevice), (MPI_ROCM_AWARE, LuxAMDGPUDevice))
    if !aware
        @eval begin
            function DistributedUtils.__reduce!(backend::MPIBackend, sendrecvbuf, op::F,
                    dev::$dType; root::Int) where {F}
                cdev = cpu_device()
                sendrecvbuf_ = sendrecvbuf |> cdev
                DistributedUtils.__reduce!(backend, sendrecvbuf_, op, cdev; root)
                sendrecvbuf .= dev(sendrecvbuf_)
                return sendrecvbuf
            end

            function DistributedUtils.__reduce!(backend::MPIBackend, sendbuf, recvbuf,
                    op::F, dev::$dType; root::Int) where {F}
                cdev = cpu_device()
                sendbuf_ = sendbuf |> cdev
                recvbuf_ = recvbuf |> cdev
                DistributedUtils.__reduce!(backend, sendbuf_, recvbuf_, op, cdev; root)
                recvbuf .= dev(recvbuf_)
                return recvbuf
            end
        end
    end
end

end
