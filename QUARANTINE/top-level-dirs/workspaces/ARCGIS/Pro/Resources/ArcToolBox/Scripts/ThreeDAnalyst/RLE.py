from re import L
import numpy as np
import torch
import torch.nn.functional as F

# Determine the encoding size based on the width of the matrix.
def determine_encoding_type(x):
    if x <= 0xFF:
        return 'B'  # Byte
    elif x <= 0xFFFF:
        return 'H'  # Word
    else:
        return 'I'  # Double word

def determine_encoding_size(x):
    if x <= 0xFF:
        return 1  # Byte
    elif x <= 0xFFFF:
        return 2  # Word
    else:
        return 4  # Double word

# Encode a value to bytes based on the specified encoding size.
def encode_value(value, encoding_size):
    if encoding_size == 'B':
        return value.to_bytes(1, byteorder='little')
    elif encoding_size == 'H':
        return value.to_bytes(2, byteorder='little')
    elif encoding_size == 'I':
        return value.to_bytes(4, byteorder='little')
    else:
      raise ValueError('Invalid encoding size')

# Convert a row to its RLE representation using a single list for transitions.
def convert_row_to_rle(row):
    if len(row) == 0:
        return []

    rle = []
    prev_val = False
    for i, val in enumerate(row):
        if val != prev_val:
            rle.append(i)
            prev_val = val

    if prev_val:
        rle.append(len(row))

    return rle

# Convert a boolean matrix to RLE and write to a binary file.
def matrix_to_rle(matrix, filename):
    # Assert that the matrix is two-dimensional
    assert matrix.ndim == 2, "Input matrix is not 2-dimensional."

    height, width = matrix.shape

    # Initialize an accumulator for the RLE data
    accumulated_data = bytearray()

    # Write the width and height of the matrix to the file
    accumulated_data.extend(width.to_bytes(4, byteorder='little'))
    accumulated_data.extend(height.to_bytes(4, byteorder='little'))

    encoding_size_runs = determine_encoding_type((width + 1) // 2)
    encoding_size = determine_encoding_type(width + 1)

    for row in matrix:
        rle = convert_row_to_rle(row)
        num_runs = len(rle) // 2  # Each run is represented by a start and end, so the number of runs is half the length of rle

        # Write the number of runs using the appropriate size
        accumulated_data.extend(encode_value(num_runs, encoding_size_runs))

        # Write each index in the RLE representation using the determined size
        for index in rle:
            accumulated_data.extend(encode_value(index, encoding_size))

    # Write the accumulated RLE data to the file in a single operation
    with open(filename, 'wb') as file:
        file.write(accumulated_data)


# Convert a boolean matrix to RLE and write to a binary file.
def matrix_to_rle_gpu(matrix, filename):
    # Assert that the matrix is two-dimensional
    assert matrix.ndim == 2, "Input matrix is not 2-dimensional."

    height, width = matrix.shape

    # Initialize an accumulator for the RLE data
    accumulated_data = bytearray()

    # Write the width and height of the matrix to the file
    accumulated_data.extend(width.to_bytes(4, byteorder='little'))
    accumulated_data.extend(height.to_bytes(4, byteorder='little'))

    encoding_size_runs = determine_encoding_type((width + 1) // 2)
    encoding_size = determine_encoding_type(width + 1)

    # Pad the matrix with False values at the start and end of each row
    padded_matrix = F.pad(matrix, (1, 1), "constant", value=False)

    # Compute transitions for each row
    transitions = padded_matrix[:, 1:] != padded_matrix[:, :-1]

    # Use torch.where to find the indices of transitions in 2D
    row_indices, col_indices = torch.where(transitions)
    row_indices, col_indices = row_indices.cpu(), col_indices.cpu()

    start = 0
    nPositions = row_indices.shape[0]
    for row in range(height):
        while start < nPositions and row_indices[start] < row:
            start += 1

        end = start
        while end < nPositions and row_indices[end] == row:
            end += 1

        assert (end - start) % 2 == 0, "Invalid RLE representation."

        num_runs = (end - start) // 2  # Each run is represented by a start and end, so the number of runs is half the length of rle

        # Write the number of runs using the appropriate size
        accumulated_data.extend(encode_value(num_runs, encoding_size_runs))

        # Write each index in the RLE representation using the determined size
        for index in range(start, end):
            accumulated_data.extend(encode_value(col_indices[index].item(), encoding_size))

        start = end

    # Write the accumulated RLE data to the file in a single operation
    with open(filename, 'wb') as file:
        file.write(accumulated_data)

# # Example usage
# if __name__ == "__main__":
#     # Define a 2D boolean matrix
#     matrix_tensor = torch.tensor([
#         [False, False, True, True, False, True, True, True, False],
#         [True, True, False, False, True, False, False, False, True],
#     ], dtype=torch.bool)

#     # Convert the matrix to RLE indices using GPU
#     matrix_tensor = matrix_tensor.cuda()  # Ensure the tensor is on the GPU
#     matrix_to_rle_gpu(matrix_tensor, r'c:\temp\rle_output_gpu.rle')


# Example usage
# a = np.array([[True, True, False, True, False], [False, False, True, False, True]], dtype=bool)
# matrix_to_rle(a, r'c:\temp\rle_output_np1.bin')
# a = np.array([[True] * 65536, [False] * 65536], dtype=bool)
# matrix_to_rle(a, r'c:\temp\rle_output_np2.bin')

def rle_to_matrix(filename):
    """
    Decodes RLE-encoded data from a binary file and reconstructs the original boolean matrix.

    Args:
    - filename: The path to the binary file containing the RLE-encoded data.
    - width: The width of the original matrix.
    - height: The height of the original matrix.

    Returns:
    - A 2D numpy array representing the original boolean matrix.
    """

    # Read the RLE data from the file
    with open(filename, 'rb') as file:
        rle_data = bytearray(file.read())

    data_pointer = 0
    width = int.from_bytes(rle_data[data_pointer:data_pointer+4], byteorder='little')
    data_pointer += 4
    height = int.from_bytes(rle_data[data_pointer:data_pointer+4], byteorder='little')
    data_pointer += 4

    # Calculate encoding sizes based on width
    encoding_size_runs = determine_encoding_size((width + 1) // 2)
    encoding_size = determine_encoding_size(width + 1)

    # Initialize the matrix
    matrix = np.zeros((height, width), dtype=bool)

    length = len(rle_data)

    for i in range(height):
        # Decode the number of runs for the current row
        if length < data_pointer + encoding_size_runs:
            raise "Failed to load RLE."
        num_runs = int.from_bytes(rle_data[data_pointer:data_pointer+encoding_size_runs], byteorder='little')
        data_pointer += encoding_size_runs

        for _ in range(num_runs):
            # Decode the start index of the current run
            if length < data_pointer + encoding_size:
                raise "Failed to load RLE."
            start = int.from_bytes(rle_data[data_pointer:data_pointer+encoding_size], byteorder='little')
            data_pointer += encoding_size

            # Decode the end index of the current run
            if length < data_pointer + encoding_size:
                raise "Failed to load RLE."
            end = int.from_bytes(rle_data[data_pointer:data_pointer+encoding_size], byteorder='little')
            data_pointer += encoding_size

            # Set the corresponding indices in the matrix row to True
            matrix[i, start:end+1] = True

    if data_pointer != length:
        raise "Failed to load RLE."

    return matrix
