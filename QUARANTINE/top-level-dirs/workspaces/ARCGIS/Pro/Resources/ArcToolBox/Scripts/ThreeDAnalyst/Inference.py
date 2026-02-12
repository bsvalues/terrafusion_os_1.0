import os
import sys
import math
import time
import mmap
import torch
import threading
import traceback
from torch.utils.data import Dataset, DataLoader, Subset
from torch.utils.data._utils.collate import default_collate
from multiprocessing import Process, Lock, Queue, cpu_count
from multiprocessing.queues import Empty
from ThreeD_Utilities import write_to_memory_1b, read_from_memory_1b, write_to_memory
from ThreeDAnalyst.CommonDefines import *
from ThreeDAnalyst.RLE import *
from ThreeDAnalyst.LoadNetwork import *
from ThreeDAnalyst.GPUselection import *
from ThreeDAnalyst.ConvertDilatedConvolutionToCustom import *

Parameters = type("Parameters", (object,), {"inference_threshold": 0.5, "block_size" : 1024, "block_buffer" : 256})

def load_data(folder_path_data, folder_path_data_recurrent):
    def get_data_from_folder(folder_path):
        data = {}
        for root, _, files in os.walk(folder_path):
            for file in files:
                if file.endswith(".rle"):
                    i, j = extract_ij_from_filename(file)
                    data[(i, j)] = os.path.relpath(os.path.join(root, file), folder_path)
        return data

    # Load data from the main folder.
    data = get_data_from_folder(folder_path_data)
    all_data = set(data.keys())

    # Load data from the recurrent folder if provided.
    data_recurrent = None
    if folder_path_data_recurrent is not None:
        data_recurrent = get_data_from_folder(folder_path_data_recurrent)
        all_data.update(data_recurrent.keys())

    # Debugging information.
    print("Inference total:", len(all_data))
    print("Data:", len(data))
    if data_recurrent is not None:
        print("Data recurrent:", len(data_recurrent))

    # Compile result.
    result = [(idx, data.get(idx), data_recurrent.get(idx) if data_recurrent else None) for idx in all_data]

    return result


class NumpyDatasetLoad(Dataset):
    def __init__(self, data, folder_path_data, folder_path_data_recurrent):
        self.data = data
        self.folder_path_data = folder_path_data
        self.folder_path_data_recurrent = folder_path_data_recurrent

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        default_shape = (1024, 1024)

        data = self.data[idx]
        idx = data[0]
        data_path = os.path.join(self.folder_path_data, data[1]) if data[1] is not None else None
        data_path_recurrent = os.path.join(self.folder_path_data_recurrent, data[2]) if data[2] is not None else None

        if data_path is None and data_path_recurrent is None:
            raise FileNotFoundError("Data and recurrent data are not found:", idx)

        if data_path is not None:
            data_path = torch.from_numpy(rle_to_matrix(data_path)).float()
        else:
            data_path = torch.zeros(default_shape, dtype=torch.float)

        if data_path_recurrent is not None:
            data_path_recurrent = torch.from_numpy(rle_to_matrix(data_path_recurrent)).float()
        elif self.folder_path_data_recurrent is not None:
            data_path_recurrent = torch.zeros(default_shape, dtype=torch.float)
        else:
            data_path_recurrent = 0.5 * torch.ones(default_shape, dtype=torch.float)

        # Add a channel dimension: [Height, Width] -> [Channel, Height, Width].
        # Adds channel dimension at the beginning.
        data_path = torch.unsqueeze(data_path, axis=0)
        data_path_recurrent = torch.unsqueeze(data_path_recurrent, axis=0)

        combined_tensor = 2.0 * torch.cat((data_path, data_path_recurrent), dim=0) - 1.0

        return combined_tensor, idx


def NumpyDatasetLoadCustomCollate(batch):
    data = [item[0] for item in batch] # Collate the tensor data.
    idx = [item[1] for item in batch] # Keep idx as is (list of tuples).
    return default_collate(data), idx


def ProcessData(model, device, batch_size, data, folder_path_data, folder_path_data_recurrent, folder_path_target, parameters):
    #print(f"Processing {device} - {len(data)}")
    dataset = NumpyDatasetLoad(data, folder_path_data, folder_path_data_recurrent)

    dataloader = DataLoader(dataset, batch_size = batch_size, shuffle = False, collate_fn = NumpyDatasetLoadCustomCollate) # Using num_workers produces slower results.

    with torch.no_grad():
        for sample_data, idx in dataloader:
            # Move the sample_data to the target GPU device once.
            sample_data = sample_data.to(device)

            output = model(sample_data)

            output = output[:, :, parameters.block_buffer : -parameters.block_buffer, parameters.block_buffer : -parameters.block_buffer]
            output = parameters.inference_threshold < output

            def save_output(out, i, j):
                if torch.any(out != 0.0):
                    iFolderX0 = i >> 4
                    iFolderY0 = j >> 4

                    iFolderX1 = iFolderX0 >> 4
                    iFolderY1 = iFolderY0 >> 4

                    folder_path = os.path.join(folder_path_target, f"{iFolderX1}_{iFolderY1}", f"{iFolderX0}_{iFolderY0}")

                    # Create directories if they do not exist.
                    os.makedirs(folder_path, exist_ok=True)

                    matrix_to_rle_gpu(out[0], os.path.join(folder_path, f"{i}_{j}.rle"))

            if True:
                # Create and start a thread for each iteration of the for loop.
                threads = []

                for out, (i, j) in zip(output, idx):
                    thread = threading.Thread(target = save_output, args = (out, i, j))
                    threads.append(thread)
                    thread.start()

                # Wait for all threads to complete.
                for thread in threads:
                    thread.join()
            else:
                for out, (i, j) in zip(output, idx):
                    save_output(out, i, j)

            #print(f"Processed {device} - {idx}")


# # Function to examine the model's precision.
# def examine_model_precision(model):
#     print("Model Parameters:")
#     for name, param in model.named_parameters():
#         print(f"{name}: {param.dtype}")

#     print("\nModel Buffers:")
#     for name, buffer in model.named_buffers():
#         print(f"{name}: {buffer.dtype}")

def worker(task_queue, queue_lock_fix, process_check, accumulate_errors, target_gpu, batch_size, model_path, folder_path_data, folder_path_data_recurrent, folder_path_target, parameters, config_path = None):
    process_check.put(False)  

    if target_gpu < 0:
        device = torch.device("cpu")
    else:
        device = torch.device(f"cuda:{target_gpu}")

    # Load the model configuration.
    model = read_model(model_path, device, config_path)
    
    # Convert the dilated convolutions to custom convolutions.
    if not has_tensor_cores(device):
        convert_dilated_convs_to_custom(model, device)

    model.eval()

    while accumulate_errors.empty():
        try:
            # Try to get a task from the queue.
            with queue_lock_fix:
                data = task_queue.get(block = False)
            # Execute the task.
            ProcessData(model, device, batch_size, data, folder_path_data, folder_path_data_recurrent, folder_path_target, parameters)
        except Empty:
            # Exit loop if no task is available.
            break
        except Exception as _:
            accumulate_errors.put(traceback.format_exc()) # Get the full traceback as a string.
        
    process_check.put(True)

def Inference(model_path, gpu_list, folder_path_data, folder_path_data_recurrent, folder_path_target, parameters, config_path = None, mapped_file = None, error_file = None):
    gpu_info = find_optimal_batch_sizes(read_model, (model_path, "cpu", config_path), (2, parameters.block_size, parameters.block_size), gpu_list)
    print("GPU Info:", gpu_info)

    # Load the data.
    data = load_data(folder_path_data, folder_path_data_recurrent)

    number_of_data = len(data)

    if number_of_data == 0:
        return

    partitions = []
    i = 0
    current_batch_size = 1
    while True:
        for _ in range(3):
            for _ in range(len(gpu_info)):
                if number_of_data < current_batch_size:
                    current_batch_size = number_of_data

                j = i + current_batch_size
                number_of_data -= current_batch_size
                partitions.append((i, j))
                i = j

                if number_of_data == 0:
                    break

            if number_of_data == 0:
                break

        if number_of_data == 0:
            break

        current_batch_size *= 2

    queue_lock_fix = Lock()
    all_partitions = Queue()
    for i, j in reversed(partitions):
      all_partitions.put(data[i:j])

    # Determine the number of processes based on gpu_info.
    num_processes = min(len(partitions), len(gpu_info))

    process_check = Queue()
    accumulate_errors = Queue()

    # Start the timer.
    start_time = time.time()

    # Start worker processes.
    processes = []
    for i in range(num_processes):
        print(num_processes, i, gpu_info[i][0], gpu_info[i][1])
        p = Process(target = worker, args = (all_partitions, queue_lock_fix, process_check, accumulate_errors, gpu_info[i][0], gpu_info[i][1], model_path, folder_path_data, folder_path_data_recurrent, folder_path_target, parameters, config_path))
        p.daemon = True # Set the process as a daemon.
        p.start()
        processes.append(p)

    if mapped_file is not None:
        try:
            with open(mapped_file, "r+b") as f:
                mm = None
                try:
                    mm = mmap.mmap(f.fileno(), 128)

                    write_to_memory(mm, 16, 8, len(data))
                    write_to_memory_1b(mm, 0, 1)

                    while accumulate_errors.empty():
                        if read_from_memory_1b(mm, 8) != 0:
                            # Tool has been cancelled
                            raise

                        current_size = all_partitions.qsize()
                        current_size_adjusted = current_size + num_processes

                        if current_size_adjusted < len(partitions):
                            write_to_memory(mm, 24, 8, len(data) - partitions[current_size_adjusted][0])

                        if current_size == 0:
                            break

                        time.sleep(0.250)
                finally:
                    if mm is not None:
                        mm.close()
        except:
            pass

    # Wait for all worker processes to complete.
    for p in processes:
        p.join()

    # Stop the timer.
    end_time = time.time()

    # Calculate the elapsed time.
    execution_time = end_time - start_time

    print(f"Execution time: {execution_time} seconds.")
    
    while True:
        try:  
            record = accumulate_errors.get(block = False)
            
            if error_file is None:
                raise Exception(record)

            with open(error_file, "a") as f:
                f.write("\n")  
                f.write(record)
        except Empty:
            # Exit loop if no records is available.
            break

    task_count = 0
    while True:
        try:  
            record = process_check.get(block = False)
            if record:
                task_count += 1
            else:
                task_count -= 1
        except Empty:
            # Exit loop if no records is available.
            break
   
    if task_count != 0:
        record = "Not all processes terminated successfully!"  

        if error_file is None:
              raise Exception(record)
        
        with open(error_file, "a") as f:
            f.write("\n")  
            f.write(record)
  