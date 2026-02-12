import json

big_data_connection_format_type_names = {"shapefile": "shapefile", "delimited": "delimited"}

# Note: Key is esri term and value is big data connection term
big_data_connection_supported_data_type_keywords = dict(Int8="Int8", Int16="Int16", Int32="Int32", Int64="Int64",
                                                        Float32="Float32", Float64="Float64", String="String",
                                                        Boolean="Boolean", Date="Date", Long="Int32", BigInteger="Int64", Binary="BLOB",

                                                        DATE="Date", LONG="Int32", BIG_INTEGER="Int64", FLOAT="Float32", STRING="String",
                                                        DOUBLE="Float64", SHORT="Int32", BLOB="Binary")

big_data_connection_supported_geometry_type_keywords = dict(point="esriGeometryPoint",
                                                            polyline="esriGeometryPolyline",
                                                            polygon="esriGeometryPolygon")

def from_big_data_connection_data_type_to_esri(data_type_keyword):
    for key, value in big_data_connection_supported_data_type_keywords.items():
        if value == data_type_keyword:
            return key
    return None

def from_esri_to_big_data_connection_data_type(data_type_keyword):
    if data_type_keyword in big_data_connection_supported_data_type_keywords:
        return big_data_connection_supported_data_type_keywords[data_type_keyword]
    else:
        return None

def from_big_data_connection_geometry_type_to_esri(geometry_type_keyword):
    for key, value in big_data_connection_supported_geometry_type_keywords.items():
        if value == geometry_type_keyword:
            return key
    return None

def from_esri_to_big_data_connection_geometry_type(geometry_type_keyword):
    if geometry_type_keyword in big_data_connection_supported_data_type_keywords:
        return big_data_connection_supported_geometry_type_keywords[geometry_type_keyword]
    else:
        return None

def valid_json(json_dict):
    try:
        json.dumps(json_dict)
    except Exception as e:
        return False
    return True


def dict_extract(key, var):
    """
    Based on https://stackoverflow.com/questions/9807634/find-all-occurrences-of-a-key-in-nested-python-dictionaries-and-lists
    but has been adapted for python 3
    :param key: The key of interest
    :param var: the Dictionary of interest
    :return: A generator that contains all the sub dictionaries that contain the same key as the one specified in the param key
    """

    if hasattr(var, 'items'):
        for k, v in var.items():
            if k == key:
                yield v
            if isinstance(v, dict):
                for result in dict_extract(key, v):
                    yield result
            elif isinstance(v, list):
                for d in v:
                    for result in dict_extract(key, d):
                        yield result

