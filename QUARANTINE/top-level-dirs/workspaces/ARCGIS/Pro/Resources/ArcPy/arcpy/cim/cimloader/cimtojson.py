import arcpy
from json import JSONEncoder, loads
from enum import Enum
import datetime

__all__ = ["CimJsonEncoder"]

def GetDateTimeAsInt(dt):
    if dt:
        timestamp = int(dt.replace(tzinfo=datetime.timezone.utc).timestamp())
        return int(str(timestamp) + '000')
    else:
        return None

pointAttribs = ["X", "Y", "Z"]
def GetPointAttribs(obj):
    output = dict()
    for key in pointAttribs:
        output[key.lower()] = getattr(obj, key)
    return output

class CimJsonEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime.datetime):
            return GetDateTimeAsInt(o)
        if o.__class__ is type:
            return None #class object, not class instance
        if hasattr(o, "_arc_object"):
            if hasattr(getattr(o, "_arc_object"), "JSON"):
                json_repr = getattr(getattr(o, "_arc_object"), "JSON")
                if type(json_repr) == str:
                    return loads(json_repr)
                return json_repr
            else:
                return GetPointAttribs(getattr(o, "_arc_object"))
        else:
            if issubclass(o.__class__, Enum):
                return o.name
            result = {key : value for key, value in o.__dict__.items() if value != str()}
            result["type"] = str(o.__class__).split("'>")[0].split('.')[-1]
            return result
