import torch
from multiprocessing import Process, Queue
from ThreeDAnalyst.ConvertDilatedConvolutionToCustom import *

def get_gpu_memory_info(gpu_list = None):
    if gpu_list is None:
        gpu_list = range(torch.cuda.device_count())

    gpu_memory_info = []
    for i in gpu_list:
        free_memory, total_memory = torch.cuda.mem_get_info(i)
        gpu_memory_info.append((i, total_memory, free_memory))
    return gpu_memory_info

def measure_memory_consumption(device, model, batch_size, input_shape):
    torch.cuda.reset_peak_memory_stats(device)

    input_data = torch.randn(batch_size, *input_shape).to(device)

    with torch.no_grad():
        _ = model(input_data)

    peak_memory = torch.cuda.max_memory_allocated(device)

    return peak_memory

def process_gpu(function, arguments, input_shape, device_index, total_memory, free_memory, result_queue):
    try:
        device = torch.device(f"cuda:{device_index}")
        torch.cuda.empty_cache()

        model = function(*arguments).to(device)
        
        # Convert the dilated convolutions to custom convolutions.
        if not has_tensor_cores(device):
            convert_dilated_convs_to_custom(model, device)
        
        model.eval()

        memory_consumed = measure_memory_consumption(device, model, 1, input_shape)
        if memory_consumed + (512 << 20) <= free_memory:
            optimal_batch_size = free_memory // (memory_consumed << 1)
            optimal_batch_size = int(optimal_batch_size)

            if 0 < optimal_batch_size:
                result_queue.put({"device_index": device_index,
                                  "total_memory": total_memory,
                                  "free_memory": free_memory,
                                  "memory_consumed": memory_consumed,
                                  "optimal_batch_size": optimal_batch_size})
    except RuntimeError as e:
        print(f"Error on GPU {device_index}: {e}")

def find_optimal_batch_sizes(function, arguments, input_shape, gpu_list = None):
    results = []

    gpu_memory_info = get_gpu_memory_info(gpu_list)
    if gpu_memory_info:
        result_queue = Queue()

        processes = []

        for device_index, total_memory, free_memory in gpu_memory_info:
            p = Process(target = process_gpu, args = (function, arguments, input_shape, device_index, total_memory, free_memory, result_queue))
            p.daemon = True # Set the process as a daemon.",
            p.start()
            processes.append(p)

        for p in processes:
            p.join()

        while not result_queue.empty():
            info = result_queue.get()

            print(f"GPU {info['device_index']}:")
            print(f"  Total memory: {info['total_memory'] / (1 << 20):.2f} MB")
            print(f"  Free memory: {info['free_memory'] / (1 << 20):.2f} MB")
            print(f"  Used memory: {(info['total_memory'] - info['free_memory']) / (1 << 20):.2f} MB")
            print(f"  Memory consumed by batch size 1: {info['memory_consumed'] / (1 << 20):.2f} MB")
            print(f"  Optimal batch size: {info['optimal_batch_size']}")

            results.append((info["device_index"], info["optimal_batch_size"]))

    if len(results) == 0:
        print("No suitable GPUs found.")
        return [(-1, torch.get_num_threads())]

    split_results = []
    for device_index, optimal_batch_size in results:
        if 3 < optimal_batch_size:
            optimal_batch_size_2 = optimal_batch_size >> 1
            split_results.append((device_index, optimal_batch_size - optimal_batch_size_2))
            split_results.append((device_index, optimal_batch_size_2))
        else:
          split_results.append((device_index, optimal_batch_size))

    results = split_results

    results = sorted(results, key = lambda x: (x[0], -x[1]))

    return results
