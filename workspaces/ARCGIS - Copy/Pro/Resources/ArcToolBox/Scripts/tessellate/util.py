import math

metersPer = { "SqMillimeter": 1.0E-6,
              "SqCentimeter": 1.0E-4,
              "SqDecimeter" : 1.0E-2,
              "Are"         : 1.0E+2,
              "Hectare"     : 1.0E+4,
              "SqKilometer" : 1.0E+6,
              "SqInch"      : 6.4516E-4,
              "SqFoot"      : 9.290304E-2,
              "SqYard"      : 8.3612736E-1,
              "Acre"        : 4.0468564224E+3,
              "SqMile"      : 2.58998811E+6 }


def AreaUnitToMeterRadius(value, unit):
    """ for square """
    return value * metersPer[unit] / math.sqrt(2)
