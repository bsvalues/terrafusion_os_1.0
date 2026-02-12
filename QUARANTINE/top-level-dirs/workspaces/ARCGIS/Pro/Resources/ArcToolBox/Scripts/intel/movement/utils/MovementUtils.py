import arcpy
import json
import os

def get_time_field_from_lyr(input_layer: str) -> str:
    """Gets the time field from the input layer by reading from the CIM definition.
    
    Keyword Arguments:
        input_layer {Feature Layer} -- Input Feature Layer that is being used to identify cotravelers.
    """

    d = arcpy.Describe(input_layer)
    if d.dataType != 'BDFeatureClass':
        time_field = d.startTimeField
        if len(time_field) > 0:
            return time_field
        else:
            arcpy.AddError(arcpy.GetIDMessage(120028).format(d.baseName))
            exit()

    else:
        bdc_path = os.path.split(input_layer)
        with open(bdc_path[0], 'r') as bdcfile:
            bdc_properties = json.loads(bdcfile.read())
            dataset = [ds for ds in bdc_properties["datasets"] if ds["alias"] == bdc_path[1]]
            try:
                return dataset[0]["time"]["fields"][0]["name"]
            except:
                arcpy.AddError(arcpy.GetIDMessage(120028).format(d.baseName))
                exit()  

def get_objectid_field(input_layer: str) -> str:
    """Gets the OBJECT ID field from the input feature layer and returns that as a string.

    Args:
        input_layer (arcpy.FeatureSet): The input feature layer.  This is generally either the input feature class defined in class initialization.
    """
    
    d = arcpy.Describe(input_layer)
    return d.OIDFieldName

def spatial_reference_code(input_layer:str) -> int:
    return arcpy.Describe(input_layer).spatialReference.factoryCode

def empty_output(input_layer: str) -> bool:
    """Simple funtion that returns a boolean to determine if a feature class is empty.
    Args:
        input_layer (str): The feature layer to identify if it contains features or is empty.
    Returns:
        bool: True represents an empty feature layer while False represents a feature layer containing features.
    """
    results = arcpy.GetCount_management(input_layer)

    if int(results[0]) < 1:
        return True

    else:
        return False


def get_feature_count(feature_class=None):
    result = arcpy.GetCount_management(feature_class)
    return int(result[0])