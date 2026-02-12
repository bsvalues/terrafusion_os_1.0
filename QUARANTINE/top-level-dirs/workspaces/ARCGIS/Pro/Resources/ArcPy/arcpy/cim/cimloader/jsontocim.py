import arcpy
from json import JSONEncoder
from enum import Enum
import datetime

__all__ = ["GetJSONTypeOBJ", "GetClassFromCIM", "ConstructTypeObject"]

def getDateTimefromInt(dt):
    if dt:
        if dt < 0 :
            future = datetime.datetime.utcfromtimestamp(int(str(abs(dt))[:-3]))
            zero = datetime.datetime.utcfromtimestamp(0)
            current = future - zero
            current = zero - current
            return current
        return datetime.datetime.utcfromtimestamp(int(str(dt)[:-3]))
    else:
        return None

def GetClassFromCIM(class_name, module_name=None):
    import importlib
    cim_module = importlib.import_module("arcpy.cim")
    if hasattr(cim_module, class_name):
        return getattr(cim_module, class_name)
    return None

def DictToPoint(pt_dict):
    pt_list = list(pt_dict.values())
    return arcpy.Point(*pt_list)

def ConvertDataToArcpyData(cls, jsonObj):
    if cls.__name__ == "SpatialReference":
        return jsonObj
    if "spatialReference" in jsonObj:
        return arcpy.AsShape(jsonObj, esri_json=True)
    if cls.__name__ == "Point":
        return DictToPoint(jsonObj)
    if cls.__name__ == "Extent":
        return jsonObj
    if cls.__name__ == "Polygon":
        return jsonObj
    if cls.__name__ == "Field":
        return jsonObj
    return jsonObj

def ConstructTypeObject(type_class, default_none=True):
    type_object = type_class()
    attr_list = [attr for attr in dir(type_object) if not attr.startswith('__') and not callable(getattr(type_object, attr))]
    for attr in attr_list:
        attr_value = getattr(type_object, attr)
        if isinstance(attr_value, str):
            type_class = GetClassFromCIM(attr_value)
            if type_class is not None:
                if default_none:
                    setattr(type_object, attr, None)
                else:
                    setattr(type_object, attr, ConstructTypeObject(type_class, default_none))
    return type_object

def GetJSONTypeOBJ(json_obj):
    type_obj = None
    if isinstance(json_obj, dict):
        if "type" in json_obj.keys():
            type_class = GetClassFromCIM(json_obj["type"])
            if type_class is not None:
                type_obj = ConstructTypeObject(type_class)
        if type_obj is None:
            return type_obj
        for key, value in json_obj.items():
            if hasattr(type_obj, key):
                type_attr = getattr(type_obj, key)
                if isinstance(value, dict):
                    inter_obj = GetJSONTypeOBJ(value)
                    if inter_obj is None:
                        if hasattr(type_attr, "__name__"):
                            setattr(type_obj, key, ConvertDataToArcpyData(type_attr, value))
                        else:
                            setattr(type_obj, key, value)
                    else:
                        setattr(type_obj, key, inter_obj)
                elif isinstance(value, list):
                    obj_list = list()
                    for obj_in_list in value:
                        obj_list.append(GetJSONTypeOBJ(obj_in_list))

                    # check for arcpy data 
                    if (all(o is None for o in obj_list)):
                        if hasattr(type_attr, "__name__"):
                            setattr(type_obj, key, ConvertDataToArcpyData(type_attr, value))
                        else:
                            setattr(type_obj, key, value)
                    else:
                        setattr(type_obj, key, obj_list)
                elif type_attr.__class__.__name__ == 'TimeInstant':
                    setattr(type_obj, key, getDateTimefromInt(value))
                elif type_obj.__class__.__name__ == "TimeExtent":
                    if key == "start":
                        setattr(type_obj, "start", getDateTimefromInt(value))
                    if key == "end":
                        setattr(type_obj, "end", getDateTimefromInt(value))
                else:
                    setattr(type_obj, key, value)
    elif isinstance(json_obj, list):
        obj_list = list()
        for value in json_obj:
            obj_list.append(GetJSONTypeOBJ(value))
        return obj_list
    else:
        return json_obj
    return type_obj

