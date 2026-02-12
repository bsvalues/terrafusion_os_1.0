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
"""
Contains the code assigning functions to the special Raster methods.

If this code were in the Raster modules we would introduce a circular
dependency between the Functions and the Raster modules Functions depends
on Raster.

For a full fledged Raster class you need to import Raster and RasterMethods.
If you do not need the special methods, than you do not need to import this
module.
"""

from . import Functions
from . import Raster

# See also http://docs.python.org/lib/module-operator.html.

# If one of those methods does not support the operation with the
# supplied arguments, it should return NotImplemented.
def returnNotImplemented(*args):
    return NotImplemented

def unaryPos(raster):
    return raster

# Basic customization.
# http://docs.python.org/reference/datamodel.html#basic-customization
Raster.Raster.__lt__ = Functions.LessThan         # <
Raster.Raster.__le__ = Functions.LessThanEqual    # <=
Raster.Raster.__eq__ = Functions.EqualTo          # ==
Raster.Raster.__ne__ = Functions.NotEqual         # !=
Raster.Raster.__gt__ = Functions.GreaterThan      # >
Raster.Raster.__ge__ = Functions.GreaterThanEqual # >=

# Emulating numeric types.
# http://docs.python.org/ref/numeric-types.html
Raster.Raster.__neg__ = Functions.Negate # -v
Raster.Raster.__pos__ = unaryPos         # +v
Raster.Raster.__abs__ = Functions.Abs    # abs(v)

Raster.Raster.__add__  = Functions.Plus  # +
Raster.Raster.__radd__ = lambda self, lhs: Functions.Plus(lhs, self)
Raster.Raster.__sub__  = Functions.Minus # -
# TODO Huh?
Raster.Raster.__rsub__ = Functions.Minus
# Raster.Raster.__rsub__ = lambda self, lhs: Functions.Minus(lhs, self)
Raster.Raster.__mul__  = Functions.Times # *
Raster.Raster.__rmul__ = lambda self, lhs: Functions.Times(lhs, self)
Raster.Raster.__pow__  = Functions.Power # **
Raster.Raster.__rpow__ = lambda self, lhs: Functions.Power(lhs, self)

Raster.Raster.__lshift__  = Functions.BitwiseLeftShift  # <<
Raster.Raster.__rlshift__ = lambda self, lhs: Functions.BitwiseLeftShift(lhs, self)
Raster.Raster.__rshift__  = Functions.BitwiseRightShift # >>
Raster.Raster.__rrshift__ = lambda self, lhs: Functions.BitwiseRightShift(lhs, self)

Raster.Raster.__div__       = Functions.Divide     # /
Raster.Raster.__rdiv__      = lambda self, lhs: Functions.Divide(lhs, self)
Raster.Raster.__floordiv__  = Functions.FloorDivide # //
Raster.Raster.__rfloordiv__ = lambda self, lhs: Functions.FloorDivide(lhs, self)
Raster.Raster.__truediv__   = Functions.FloatDivide # /
Raster.Raster.__rtruediv__  = lambda self, lhs: Functions.FloatDivide(lhs, self)
Raster.Raster.__mod__       = Functions.Mod        # %
Raster.Raster.__rmod__      = lambda self, lhs: Functions.Mod(lhs, self)
Raster.Raster.__divmod__    = returnNotImplemented # divmod()
Raster.Raster.__rdivmod__   = returnNotImplemented

# The Python bitwise operators are used for Raster boolean operators.
Raster.Raster.__invert__ = Functions.BooleanNot # ~
Raster.Raster.__and__    = Functions.BooleanAnd # &
Raster.Raster.__rand__   = lambda self, lhs: Functions.BooleanAnd(lhs, self)
Raster.Raster.__xor__    = Functions.BooleanXOr # ^
Raster.Raster.__rxor__   = lambda self, lhs: Functions.BooleanXOr(lhs, self)
Raster.Raster.__or__     = Functions.BooleanOr  # |
Raster.Raster.__ror__    = lambda self, lhs: Functions.BooleanOr(lhs, self)

# Python will use the non-augmented versions of these.
Raster.Raster.__iadd__      = returnNotImplemented # +=
Raster.Raster.__isub__      = returnNotImplemented # -=
Raster.Raster.__imul__      = returnNotImplemented # *=
Raster.Raster.__idiv__      = returnNotImplemented # /=
Raster.Raster.__itruediv__  = returnNotImplemented # /=
Raster.Raster.__ifloordiv__ = returnNotImplemented # //=
Raster.Raster.__imod__      = returnNotImplemented # %=
Raster.Raster.__ipow__      = returnNotImplemented # **=
Raster.Raster.__ilshift__   = returnNotImplemented # <<=
Raster.Raster.__irshift__   = returnNotImplemented # >>=
Raster.Raster.__iand__      = returnNotImplemented # &=
Raster.Raster.__ixor__      = returnNotImplemented # ^=
Raster.Raster.__ior__       = returnNotImplemented # |=

# Methods corresponding to operations that are not supported by the
# particular kind of number implemented (e.g., bitwise operations for
# non-integral numbers) should be left undefined.
# __complex__
# __int__
# __long__
# __float__
# __oct__
# __hex__
# __index__

# Deprecated http://docs.python.org/ref/coercion-rules.html.
# __coerce__
