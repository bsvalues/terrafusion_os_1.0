__all__ = ['invalid_bdc_characters',
           'is_number',
           'time_stepping_missing_values',
           'validate_desktop_output',
           'validate_greater_than_zero',
           'validate_input_bdc_dataset',
           'validate_input_source',
           'validate_is_projected_cs',
           'validate_output',
           'validate_server_input',
           'validate_time_boundary',
           'validate_time_on_input_desktop',
           'validate_time_units_greater_than', 
           'validate_units_greater_than',
           'validate_whole_number'
           ]


import re


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


def invalid_bdc_characters(input_name):
    invalid_chars = ('!', '@', '#', '$', '%', \
        '^', '&', '*', '(', ')', '+', '?', '`', '~', ';', ':', '>', '<', \
        ',', "'", '"', '/')
    if any([i in input_name for i in invalid_chars]):
        return True
    return False


def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False


def json_validator(file):
    import json
    try:
        with open(file, encoding='utf-8') as data:
            json.loads(data.read())
        return True
    except:
        return False


def time_validation_desktop_interval_or_instant(input_layer_to_validate, param_to_warn_on, d):
    """ 
    Works for tools that accept instant or interval time. Desktop only.
    """
    import arcpy
    # time validation
    if not hasattr(d, 'StartTimeField') or (
        hasattr(d, 'StartTimeField') and not d.StartTimeField):
        param_to_warn_on.setIDMessage('WARNING', 120028,
                                    input_layer_to_validate.displayName)


def time_validation_desktop_instant_only(input_layer_to_validate, param_to_warn_on, d):
    """
    Works for tools that require instant time. Desktop only.
    """
    import arcpy
    # time validation
    if not hasattr(d, 'StartTimeField') or (
            hasattr(d, 'StartTimeField') and not d.StartTimeField):
        param_to_warn_on.setIDMessage('WARNING', 120028,
                          input_layer_to_validate.displayName)
    elif hasattr(d, 'EndTimeField') and d.EndTimeField:
        msg = arcpy.GetIDMessage(120040) % (
        input_layer_to_validate.displayName, "instant", "interval")
        param_to_warn_on.setWarningMessage(f'120040: {msg}')
    else:
        pass


def time_stepping_missing_values(self, in_time_step_interval, in_time_step_repeat, in_time_step_reference, in_time_params):
    if in_time_step_interval:
        if not validate_greater_than_zero(in_time_step_interval):
            self.params[in_time_params["interval"]].setIDMessage('ERROR', 323)

    if in_time_step_repeat:
        if not validate_greater_than_zero(in_time_step_repeat):
            self.params[in_time_params["repeat"]].setIDMessage('ERROR', 323)

    if in_time_step_reference is not None:
        if in_time_step_interval is None:
            self.params[in_time_params["interval"]].setIDMessage("ERROR", 735)


def validate_desktop_output(dataset_path, is_table):
    """
    Validate the output name
    """

    import os
    import arcpy

    if not dataset_path:
        return dataset_path

    dataset_path = dataset_path.replace("/", "\\")
    gdb_index = dataset_path.rfind('.gdb\\')
    sde_index = dataset_path.rfind('.sde\\')

    if dataset_path.startswith('%'):
        dir_name = os.path.dirname(dataset_path)
        base_name = os.path.basename(dataset_path)
        base_name = base_name.replace("-", "_")
        base_name = base_name.replace(" ", "_")
        dataset_path = os.path.join(dir_name, base_name)

    elif gdb_index > -1:
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
                ext = dataset_path[dot_index + 1:]
                if ext != 'csv':
                    dataset_path = dataset_path[0:dot_index] + '.csv'

    return dataset_path


def validate_greater_than_zero(in_value):
    """Validate that a linear unit is greater than 0"""

    try:
        n = float(in_value.split(' ')[0])
    except ValueError:
        # If it isn't a number, skip
        return True
    else:
        if n > 0:
            return True
        else:
            return False


def validate_input_bdc_dataset(input_path):
    import ntpath
    import arcpy

    """Validate an input BDC dataset parameter to make sure it's a BDC, valid JSON, and existing dataset"""
    bdc_file, bdc_dataset = ntpath.split(input_path.valueAsText)
    error = tuple()
    # Check that it's a BDC File
    if ".bdc" in bdc_file or ".mfc" in bdc_file:
        # Check that it's a valid JSON
        if json_validator(bdc_file):
            try:
                # Check that it's the correct type of data using Describe
                d_dataset = arcpy.Describe(input_path.value)
                if not (d_dataset.dataType == "BDFeatureClass" or d_dataset.dataType == "BDTable"):
                    error = (120292, bdc_dataset)
            except:
                bdc, dataset = ntpath.split(bdc_file.valueAsText)
                d_bdc = arcpy.Describe(bdc)
                if len(d_bdc.children) == 0:
                    error = (120292, bdc_dataset)
        else:
            error = (3220,)

    else:
        error = (120328, )
    return bdc_file, bdc_dataset, error


def validate_input_source(input_dataset):
    '''
    Validates the input sources for desktop tools
    '''
    if hasattr(input_dataset, "catalogPath"):
        if input_dataset.catalogPath.upper().startswith("HTTP"):
            return False, 160938
        elif input_dataset.catalogPath.endswith(".csv_Features") or input_dataset.catalogPath.endswith(".txt_Features"):
            return False, 152
    if not hasattr(input_dataset, "fields"):
        return False, 152
    if hasattr(input_dataset, "path") and input_dataset.path.endswith(".gpkg"):
        return False, 152

    return True,


def validate_is_projected_cs(in_dataset):
    """Validate if a spatial reference is projected"""

    import arcpy

    try:
        spatial_ref = arcpy.Describe(in_dataset).spatialReference
        return spatial_ref.type == 'Projected'
    except:
        return True


def validate_output(in_value):
    """
    Validate the output name, trim off anything longer than 120 characters
    """
    in_value = in_value.replace("-", "_")
    in_value = in_value.replace(" ", "_")

    return in_value[:120]


def validate_server_input(input_dataset):
    if '.bdc' in input_dataset or '.mfc' in input_dataset:
        return False, 120287
    else:
        return True,


def validate_time_boundary(self, in_time_boundary_split, in_time_boundary_reference, in_time_boundary_params):
    """Validation of time boundary (split and reference) for Enterprise and Desktop"""
    if in_time_boundary_reference is not None:
        if in_time_boundary_split is None:
            self.params[in_time_boundary_params["split"]].setIDMessage("ERROR", 735)

    if in_time_boundary_split:
        if not validate_greater_than_zero(in_time_boundary_split):
            self.params[in_time_boundary_params["split"]].setIDMessage('ERROR', 323)
        if not validate_whole_number(in_time_boundary_split):
            self.params[in_time_boundary_params["split"]].setIDMessage('ERROR', 1032,
                                        self.params[in_time_boundary_params["split"]].displayName)


def validate_time_on_input_desktop(self, in_d_layer, input_param_num, in_time_step_interval, in_time_step_repeat, in_time_step_reference, in_time_params):
    """Validation of presence of time used in time stepping parameters. On desktop only."""
    import arcpy
    if not hasattr(in_d_layer, 'StartTimeField') or (hasattr(in_d_layer,
                                                            'StartTimeField') and not in_d_layer.StartTimeField):
        if in_time_step_interval:
            self.params[in_time_params["interval"]].setIDMessage('WARNING', 120028,
                                        self.params[input_param_num].displayName)
        if in_time_step_repeat:
            self.params[in_time_params["repeat"]].setIDMessage('WARNING', 120028,
                                        self.params[input_param_num].displayName)
        if in_time_step_reference:
            self.params[in_time_params["reference"]].setIDMessage('WARNING', 120028,
                                        self.params[input_param_num].displayName)
    elif hasattr(in_d_layer, 'EndTimeField') and in_d_layer.EndTimeField:
        if in_time_step_interval:
            msg = arcpy.GetIDMessage(120040) % (
            self.params[input_param_num].displayName, "instant", "interval")
            self.params[in_time_params["interval"]].setWarningMessage(f'120040: {msg}')
        if in_time_step_repeat:
            msg = arcpy.GetIDMessage(120040) % (
            self.params[input_param_num].displayName, "instant", "interval")
            self.params[in_time_params["repeat"]].setWarningMessage(f'120040: {msg}')
        if in_time_step_reference:
            msg = arcpy.GetIDMessage(120040) % (
            self.params[input_param_num].displayName, "instant", "interval")
            self.params[in_time_params["reference"]].setWarningMessage(f'120040: {msg}')


def validate_time_units_greater_than(time_unit1, time_unit2):
    """Do a unit sensitive comparison of time unit values"""

    # Not all of these unit types are used, but are included for completeness
    # Conversion uses number of seconds/type
    unit_conversion = {'MILLISECONDS': 1.0,
                       'SECONDS': 1000.0,
                       'MINUTES': 60000.0,
                       'HOURS': 3600000.0,
                       'DAYS': 86400000.0,
                       'WEEKS': 604800000.0,
                       'MONTHS': 2628000000.0,
                       'YEARS': 31536000000.0}

    time_unit1 = time_unit1.replace(',', '.')
    time_unit2 = time_unit2.replace(',', '.')

    val1, unit1 = time_unit1.split(' ', 1)
    val2, unit2 = time_unit2.split(' ', 1)
    unit1 = unit1.upper().replace(' ', '')
    unit2 = unit2.upper().replace(' ', '')

    compare1 = unit_conversion[unit1] * float(val1)
    compare2 = unit_conversion[unit2] * float(val2)

    return compare1 > compare2


def validate_whole_number(in_value):
    """Validate that a time or linear unit is a whole number"""

    try:
        n = float(in_value.split(' ')[0])
    except ValueError:
        # If it isn't a number, skip
        return True
    else:
        if n.is_integer():
            return True
        else:
            return False


def validate_units_greater_than(linear_unit1, linear_unit2):
    """Do a unit sensitive comparison of linear unit values"""

    # Not all of these unit types are used, but are included for completeness
    unit_conversion = {'CENTIMETERS': 0.01,
                       'DECIMETERS': 0.1,
                       'FEET': 0.3048006096012192,
                       'INCHES': 0.0254000508001016,
                       'KILOMETERS': 1000.0,
                       'METERS': 1.0,
                       'MILES': 1609.347218694437,
                       'MILLIMETERS': 0.001,
                       'NAUTICALMILES': 1853.248,
                       'POINTS': 0.000352777778,
                       'UNKNOWN': 1.0,
                       'YARDS': 0.9144018288036576,
                       'NAUTICALMILESINT': 1852.0,
                       'MILESINT': 1609.344,
                       'YARDSINT': 0.9144,
                       'FEETINT': 0.3048}

    linear_unit1 = linear_unit1.replace(',', '.')
    linear_unit2 = linear_unit2.replace(',', '.')

    val1, unit1 = linear_unit1.split(' ', 1)
    val2, unit2 = linear_unit2.split(' ', 1)
    unit1 = unit1.upper().replace(' ', '')
    unit2 = unit2.upper().replace(' ', '')

    compare1 = unit_conversion[unit1] * float(val1)
    compare2 = unit_conversion[unit2] * float(val2)

    return compare1 > compare2


def verifyFieldExists(inputLayer, field_name):
    """Checks if a field exists."""

    import arcpy
    if field_name.lower() in [f.name.lower() for f in arcpy.ListFields(inputLayer, field_name)]:
        return True
    else:
        return False

