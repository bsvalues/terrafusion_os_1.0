#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

__all__ = ['_BaseArcObject', '_ObjectWithoutInitCall', 'passthrough_attr', 'pass_parameterized_attr', 'FromScriptingArcObject']

class _ArcobjectPassthrough:
    def __getattr__(self, attr):
        if attr == "__methods__":
            return []
        x = getattr(self._arc_object, attr)
        if not callable(x):
            return convertArcObjectToPythonObject(x)
        raise AttributeError("%s" % attr)
    def __setattr__(self, attr, val):
        ao = val
        try:
            ao = val._arc_object
        except (AttributeError, RuntimeError):
            pass
        return setattr(self._arc_object, attr, ao)
    def __delattr__(self, attr):
        return delattr(self._arc_object, attr)

class _BaseArcObject:
    _arc_object = None
    def __init__(self, *args, **kwargs):
        """Wrapper for ArcGIS scripting Arc Objects --
           Create a new object instance if no reference is passed in."""
        from arcpy import gp
        super(_BaseArcObject, self).__init__()
        self._arc_object = gp._gp.CreateObject(self.__class__.__name__,
                    *((arg._arc_object if hasattr(arg, '_arc_object') else arg)
                        for arg in args))
        for attr, value in list(kwargs.items()):
            setattr(self._arc_object, attr, value)
        self._go()
    def _go(self):
        if getattr(self, '__passthrough_to_ao__', False):
            self.__class__ = type(self.__class__.__name__, (self.__class__, _ArcobjectPassthrough), self.__dict__)
    def __repr__(self):
        return "<%s object at %s[%s]>" % (self.__class__.__name__,
                         hex(id(self)),
                         hex(id(self._arc_object)))
    def __str__(self):
        return str(self._arc_object)

class _ObjectWithoutInitCall:
    """Provide classes that inherit with this an implementation-free way
       to wrap instances without calling __init__"""
    @classmethod
    def __from_scripting_arc_object__(cls, wrap_object):
        instance = cls.__new__(cls)
        instance._arc_object = wrap_object
        return instance

class _ObjectWithoutInitCallWrapper:
    """Provide classes that inherit with this an implementation-free way
       to wrap instances without calling __init__"""
    @classmethod
    def __from_scripting_arc_object__(cls, wrap_object):
        instance = cls.__new__(cls, wrap_object)
        return instance

def passthrough_attr(attr_name, readonly=False, doc=None):
    def _get(self):
        try:
            return convertArcObjectToPythonObject(getattr(self._arc_object, attr_name))
        except AttributeError:
            from arcpy import gp
            raise AttributeError(
                    gp.getIDMessage(89013,
                        "The attribute %r is not supported on this instance of %s.") %
                    (attr_name, self.__class__.__name__))
    def _set(self, val):
        def cval(val):
            if isinstance(val, (str, int, float, bool)):
                return val
            try:
                return getattr(val, '_arc_object')
            except (RuntimeError, AttributeError):
                if isinstance(val, (set, list)):
                    return type(val)(list(map(cval, val)))
                else:
                    return val
        try:
            return setattr(self._arc_object, attr_name, cval(val))
        except AttributeError:
            from arcpy import gp
            raise NameError(
                    gp.getIDMessage(89013,
                        "The attribute %r is not supported on this instance of %s.") %
                    (attr_name, self.__class__.__name__))
    def _del(self, val):
        return delattr(self._arc_object, val)

    if readonly:
        return property(_get, None, None, doc)
    return property(_get, _set, None, doc)

def pass_parameterized_attr(attr_name, *args, **kwargs):
    """ Adding support to pass attribute while pulling an attribute.
        TODO: incorporate with the passthrough_attr"""
    def _get(self):
        try:
            params = {}
            if kwargs is not None:
              for key, value in list(kwargs.items()):
                  if(hasattr(self, key)):
                    params[key] = getattr(self, value)
                  else:
                    params[key] = value
            return convertArcObjectToPythonObject(getattr(self._arc_object, attr_name)(*args, **params))
        except AttributeError:
            from arcpy import gp
            raise NameError(
                    gp.getIDMessage(89013,
                        "The attribute %r is not supported on this instance of %s.") %
                    (attr_name, self.__class__.__name__))
    def _set(self, val):
        def cval(val):
            try:
              params = {}
              if kwargs is not None:
                for key, value in list(kwargs.items()):
                    if(hasattr(self, key)):
                      params[key] = getattr(self, value)
                    else:
                      params[key] = value
                return getattr(val, '_arc_object')(*args, **params)
            except (RuntimeError, AttributeError):
                if isinstance(val, (set, list)):
                    return type(val)(list(map(cval, val)))
                else:
                    return val
        try:
            params = {}
            if kwargs is not None:
              for key, value in list(kwargs.items()):
                  if(hasattr(self, key)):
                    params[key] = getattr(self, value)
                  else:
                    params[key] = value
            return setattr(self._arc_object, attr_name, {'params':(params), 'value': cval(val)})
        except AttributeError:
            from arcpy import gp
            raise NameError(
                    gp.getIDMessage(89013,
                        "The attribute %r is not supported on this instance of %s.") %
                    (attr_name, self.__class__.__name__))
    def _del(self, val):
        return delattr(self._arc_object, val)

    return property(_get, _set, None)


def FromScriptingArcObject(cls, obj):
    """Bypass the constructor for objects created from existing arc objects."""
    # Custom routine?
    if hasattr(cls, '__from_scripting_arc_object__'):
        return cls.__from_scripting_arc_object__(obj)
    # No; do normal thing.
    class conversion:
        pass
    new_obj = conversion()
    new_obj._arc_object = obj
    new_obj.__class__ = cls
    new_obj._go()
    return new_obj
