import arcpy

def standardize_units(unit):
    """ Standardize unit names """

    unit = unit.lower()

    if not unit:
        return "unknown"
    if unit + "s" in ['millimeters', 'centimeters', 'meters', 'kilometers']:
        return unit + "s"
    elif unit in ["nautical miles",  "nautical_miles"]:
        return "nauticalmiles"
    elif unit == ["yard_us", "yards_us"]:
        return "yards"
    elif unit in ["mile_us", "miles_us"]:
        return "miles"
    elif unit in ["foot_us", "feet_us", "foot"]:
        return "feet"
    elif unit in ["inch_us", "inches_us"]:
        return "inches"
    else:
        return unit


def convert_linear_units(value, from_unit, to_unit):
    """ Convert values from one unit to another.
    :param from_unit: String - The unit the value is currently in
    :param to_unit:  String - The unit to convert the value to
    :return: Float - Converted value
    """
    base_unit = 'meters'
    from_unit = standardize_units(from_unit)
    to_unit   = standardize_units(to_unit)

    # if the from and to units are same, just return the original value
    if (from_unit == to_unit) or ("unknown" in (from_unit, to_unit)):
        return value


    try:
        #  We first convert value in the 'from unit' to a value in the base unit
        #    and then from base unit to the to unit.
        first_constant_to_use = arcpy.LinearUnitConversionFactor(from_unit, "Meters")
        second_constant_to_use = 1.0/arcpy.LinearUnitConversionFactor(to_unit, "Meters")
    except KeyError:
        raise NotImplementedError('Converting linear units {} to {} not supported.'. format(from_unit, to_unit))
    return (float(value) * first_constant_to_use) * second_constant_to_use


def convert_areal_units(value, to_unit, from_unit):
    base_unit = 'squaremeters'
    from_unit = standardize_units(from_unit)
    to_unit   = standardize_units(to_unit)

    # if the from and to units are same, just return the original value
    if (from_unit == to_unit) or ("unknown" in [from_unit, to_unit]):
        return value

    try:
        #  We first convert value in the 'from unit' to a value in the base unit
        #  and then from base unit to the to unit.
        first_constant_to_use = arcpy.ArealUnitConversionFactor(from_unit, "SquareMeters")
        second_constant_to_use = 1.0/arcpy.ArealUnitConversionFactor(to_unit, "SquareMeters")
    except KeyError:
        raise NotImplementedError('Converting areal units {} to {} not supported.'. format(from_unit, to_unit))

    return (float(value) * first_constant_to_use) * second_constant_to_use


def haversine(point1, point2):
    """ Calculate the distance between two points along a sphere's surface (radius of the sphere is equal to Earth's)
    Does not account for changes in elevation (datum)
    :param point1 Tuple - Tuple of (x, y) for the first point
    :param point2 Tuple - Tuple of (x, y) for the second point
    :return Float - The distance between the two points about the surface of the globe in kilometers.
    """
    from math import radians, sin, cos, asin, sqrt
    radius_of_earth_km = 6371
    lng1, lat1, lng2, lat2 = list(map(radians, list(point1 + point2)))
    d = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lng2 - lng1) / 2) ** 2
    return 2 * radius_of_earth_km * asin(sqrt(d))


def dd_to_km_ratio(extent):
    """ Calculates the ratio of km to decimal degrees based on the extent.
    :param extent: arcpy.Extent - The extent of the study area needing conversion
    :return: Float - The ratio of the distance in decimal degrees to the distance in kilometers
    """
    x_diff = extent.XMax - extent.XMin
    haversine_size = haversine((extent.XMin, extent.YMin),
                               (extent.XMax, extent.YMin))
    return haversine_size / x_diff
