from .typesdict import TypesDictionary
from enum import Enum
from lxml import objectify
from lxml import etree

__all__ = ["WhatToExpect", "GetCoreType", "GetCIMArrayType", "GetBasicArrayType", "GetAttributeWithType", "ChangeNoneTypeInEnum", "ChangeBoolType", "GetCimType", "GetObjectFromType", "GetCIMObject"]

class WhatToExpect(Enum):
    CimType = 0
    BasicType = 1
    ArrayOfBasicType = 2
    ArrayOfCimType = 3
    UnknownToLog = 4
    ArrayOfUnknownToLog = 5

def GetCoreType(type_string):
    from pydoc import locate
    try:
        py_type = TypesDictionary[type_string]
        return locate(py_type)
    except:
        return None

def GetClassFromCIM(class_name, module_name=None):
    import importlib
    cim_module = importlib.import_module("arcpy.cim")
    if hasattr(cim_module, class_name):
        return getattr(cim_module, class_name)
    return None

def GetAttributeWithType(element, debug=False):
    arr = element.items()
    what_to_expect = WhatToExpect.UnknownToLog
    is_array = False
    if not arr:
        return None, what_to_expect
    for obj in arr:
        type_expected = obj[-1].split(':')[-1]
        if debug:
            print("Getting the expected type: {}".format(type_expected))
        if type_expected.startswith('ArrayOf'):
            is_array = True
            type_expected = type_expected.split('ArrayOf')[-1]
        if debug:
            print("Stripping ArrayOf. Type : {}".format(type_expected))
        cls = GetClassFromCIM(type_expected)
        if debug:
            print("Trying to obtain the cim class: {}".format(cls))
        if cls:
            if is_array:
                what_to_expect = WhatToExpect.ArrayOfCimType
            else:
                what_to_expect = WhatToExpect.CimType
            return cls, what_to_expect
        elif GetCoreType(type_expected):
            if is_array:
                what_to_expect = WhatToExpect.ArrayOfBasicType
            else:
                what_to_expect = WhatToExpect.BasicType
            return GetCoreType(type_expected), what_to_expect
        else:
            if is_array:
                what_to_expect = WhatToExpect.ArrayOfUnknownToLog
            else:
                what_to_expect = WhatToExpect.UnknownToLog
            return type_expected, what_to_expect

def ChangeNoneTypeInEnum(obj, cls, attr_name, text):
    if text == 'None':
        setattr(obj, attr_name, getattr(cls, "eNone"))
    else:
        setattr(obj, attr_name, getattr(cls, text))

def ChangeBoolType(obj, cls, attr_name, text):
    trueList = ["true", "True", "TRUE"]
    falseList = ["false","False", "FALSE"]

    if text in trueList:
        setattr(obj, attr_name, True)
    elif text in falseList:
        setattr(obj, attr_name, False)
    else:
        setattr(obj, attr_name, cls(text))

def GetCimType(cls, element):
    live_object = cls()
    for child in element.getchildren():
        cls, expecting_type = GetAttributeWithType(child)
        if hasattr(live_object, child.tag):
            attr_class = getattr(live_object, child.tag).__class__
            if issubclass(attr_class, Enum):
                ChangeNoneTypeInEnum(live_object, attr_class, child.tag, child.text)
            else:
                if not cls:
                    ChangeBoolType(live_object, attr_class, child.tag, child.text)
                else:
                    child_obj = GetObjectFromType(cls, expecting_type, child)
                    setattr(live_object, child.tag, child_obj)
                    if child_obj and not isinstance(child_obj, list):
                        pass#setattr(child_obj, "xml_obj", child)
    #setattr(live_object, "xml_obj", element)
    return live_object

def GetObjectFromType(cls, expecting_type, element, debug=False):
    if expecting_type == WhatToExpect.CimType:
        return GetCimType(cls, element)
    elif expecting_type == WhatToExpect.BasicType:
        return GetCoreType(cls)(element.text)
    elif expecting_type == WhatToExpect.ArrayOfCimType:
        return GetCIMArrayType(cls, element)
    elif expecting_type == WhatToExpect.ArrayOfBasicType:
        return GetBasicArrayType(cls, element)
    else:
        if debug:
            print("="*20)
            GetAttributeWithType(element, True)
            print("="*20)
            print("Error handling the following type:")
            print(cls, expecting_type, element)
            print("#"*20)

def GetCIMArrayType(cls, element):
    object_list = []
    for child in element.getchildren():
        cls, expecting_type = GetAttributeWithType(child)
        object_list.append(GetObjectFromType(cls, expecting_type, child))
    return object_list

def GetBasicArrayType(cls, element):
    object_list = []
    for child in element.getchildren():
        cls, expecting_type = GetAttributeWithType(child)
        object_list.append(GetObjectFromType(cls, expecting_type, child))
    return object_list

def GetCIMObject(cimdefinition):
    element = etree.fromstring(bytes(cimdefinition, encoding='utf8'))
    cls, expecting_type = GetAttributeWithType(element)
    obj = GetObjectFromType(cls, expecting_type, element)
    #setattr(obj, "xml_obj", element)
    return obj

