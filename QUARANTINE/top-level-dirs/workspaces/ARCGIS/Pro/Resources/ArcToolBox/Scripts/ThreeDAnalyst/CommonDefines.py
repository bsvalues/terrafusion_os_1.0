import os

def rename_file(file_name, add = "", new_extension = None, rename = True):
    # Split the path into a root and extension part.
    root, ext = os.path.splitext(file_name)

    # Assign the new extension if provided.
    if new_extension is not None:
        ext = "." + new_extension

    # Create the new file name by concatenating the root, add, and extension.
    new_file_name = f"{root}{add}{ext}"

    # Rename the file using os.rename.
    # Check if the original file exists.
    if rename and os.path.exists(file_name):
        # Rename the file to the new name
        os.rename(file_name, new_file_name)

    return new_file_name

def extract_ij_from_filename(path):
    """
    Extracts i and j from the file name given a path in the format 'path/{i}_{j}.extension'.

    Parameters:
    - path (str): The file path.

    Returns:
    - tuple: A tuple containing i and j as integers.
    """
    # Split the path into its components to isolate the file name.
    _, filename = os.path.split(path)

    # Split the filename to separate the name from its extension.
    name, _ = os.path.splitext(filename)

    # Split the name by '_' to extract i and j.
    i_str, j_str = name.split('_')

    # Convert i and j into integers.
    i = int(i_str)
    j = int(j_str)

    return i, j
