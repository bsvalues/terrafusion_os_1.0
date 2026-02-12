def validate_input_source(input_dataset):
    '''
    Validates the input sources for desktop tools
    '''
    if hasattr(input_dataset, "catalogPath"):
        if input_dataset.catalogPath.endswith(".csv_Features")\
            or input_dataset.catalogPath.endswith(".txt_Features"):
            return False, 152
    if not hasattr(input_dataset, "fields"):
        return False, 152
    if hasattr(input_dataset, "path") and (input_dataset.path.endswith(".gpkg") or input_dataset.path.endswith(".geodatabase")):
        return False, 152

    return True,

def validate_desktop_output(dataset_path, is_table):
    """
    Validate the output name
    """

    if not dataset_path:
        return dataset_path
    dataset_path = dataset_path.replace("/", "\\")
    gdb_index = dataset_path.rfind('.gdb\\')
    sde_index = dataset_path.rfind('.sde\\')

    if gdb_index > -1:
        # .gdb
        slash_index = gdb_index + 4  # account for the .gdb\ word
        dataset_fullname = dataset_path[slash_index + 1:]
        dataset_name, dataset_ext = get_dataset_name_parts(dataset_fullname)
        dataset_name = dataset_name.replace("-", "_")
        dataset_name = dataset_name.replace(" ", "_")
        dataset_path = dataset_path[0:slash_index + 1] + dataset_name
    elif sde_index > -1:
        # .sde
        slash_index = sde_index + 4  # account for the .sde\ word
        dataset_fullname = dataset_path[slash_index + 1:].replace("-", "_") # get the full name (without the path) and replace - with _
        dataset_fullname = dataset_fullname.replace(" ", "_")
        dataset_path = dataset_path[0:slash_index + 1] + dataset_fullname
    else:
        # .shp/.csv
        dot_index = dataset_path.rfind('.')
        if dot_index == -1:  # no extension. need to add it
            if is_table:
                dataset_path = dataset_path + ".csv"
            else:
                dataset_path = dataset_path + ".shp"
        else:  # if feature with geometry, but doesn't have shp
            if not is_table:
                ext = dataset_path[dot_index + 1:]
                if ext != 'shp':
                    dataset_path = dataset_path[0:dot_index] + '.shp'
            else:
                # if table doesn't have csv, needs to be switched to csv
                ext = dataset_path[dot_index + 1:].lower()
                if ext != 'csv':
                    if ext == 'txt':
                        pass
                    else:
                        dataset_path = dataset_path[0:dot_index] + '.csv'

    return dataset_path

def get_dataset_name_parts(fullname):
    """
    Accepts the fullname of a dataset e.g. mydataset.shp (not the whole path to it)
    """
    if not fullname:
        return "", ""

    last_dot_index = fullname.rfind('.')
    if last_dot_index == -1:
        return fullname, ""
    dataset_name = fullname[0:last_dot_index]
    dataset_ext = fullname[last_dot_index + 1:]
    return dataset_name, dataset_ext