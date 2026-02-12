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

import sys


def propertyGet(function):
    locals = sys._getframe(1).f_locals
    name = function.__name__
    prop = locals.get(name)

    if not isinstance(prop, property):
        prop = property(function, doc=function.__doc__)
    else:
        doc = prop.__doc__ or function.__doc__
        prop = property(function, prop.fset, prop.fdel, doc)

    return prop


def propertySet(function):
    locals = sys._getframe(1).f_locals
    name = function.__name__
    prop = locals.get(name)

    if not isinstance(prop, property):
        prop = property(None, function, doc=function.__doc__)
    else:
        doc = prop.__doc__ or function.__doc__
        prop = property(prop.fget, function, prop.fdel, doc)

    return prop


def propertyDel(function):
    locals = sys._getframe(1).f_locals
    name = function.__name__
    prop = locals.get(name)

    if not isinstance(prop, property):
        prop = property(None, None, function, doc=function.__doc__)
    else:
        prop = property(prop.fget, prop.fset, function, prop.__doc__)

    return prop
