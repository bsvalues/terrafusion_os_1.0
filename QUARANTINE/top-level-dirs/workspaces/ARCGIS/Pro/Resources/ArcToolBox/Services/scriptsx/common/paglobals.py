from enum import Enum


# expression type for arcpy.CalculateField_management
CALFIELD_PY_METHOD = "PYTHON3"

# default layer name loaded from a feature collection
DEFAULT_LAYER_NAME = "feature collection"

# default virtual field name of shape area
DEFAULT_AREA_VF = ["SHAPE__AREA", "SHAPE_AREA", "ST_AREA(SHAPE)",
                   "ST__AREA(SHAPE)", "ST_AREA_SHAPE_",
                   "ST__AREA_SHAPE_", "SHAPE@AREA",
                   "SHAPE.STAREA()"]

# default virtual field name of shape length
DEFAULT_LENGTH_VF = ["SHAPE__LENGTH", "SHAPE_LENGTH", "ST_LENGTH(SHAPE)",
                     "ST__LENGTH(SHAPE)", "ST_LENGTH_SHAPE_",
                     "ST__LENGTH_SHAPE_", "SHAPE@LENGTH",
                     "SHAPE.STLENGTH()"]

SUPPORTED_LINEAR_UNITS = (
    "kilometers",        # 1,000 meters
    "meters",            # metric base unit of distance
    "decimeters",        # 0.1 of a meter
    "centimeters",       # 0.001 of a meter
    "millimeters",       # 0.001 of a meter
    "nauticalmilesint",  # 1,852.0 meters.
    "milesint",          # 1,609.344 meters.
    "yardsint",          # 0.9144 meters.
    "feetint",           # 0.3048 meters.
    "inchesint",         # 0.0254 meters
    "nauticalmiles",     # 1,853.248 meters.
    "miles",             # 63,360.0/39.37 meters.
    "yards",             # 36.0/39.37 meters.
    "feet",              # 1,200/3937 meters or 0.3048006096012192
    "inches",            # 1.0/39.37 meters.
    "decimaldegrees",    # Angular unit of measure based on 1/360 of a circle.
    "points"             # 0.0254/72.0 meters.
)

SUPPORTED_AREAL_UNITS = (
    "squarekilometers",   # Area of a square 1 kilometer per side
    "hectares",           # Standard metric unit of land area as defined by a square 100 meters per side
    "ares",               # area of a square 10 meters per side
    "squaremeters",       # Area of a square 1 meter per side
    "squaredecimeters",   # Area of a square 1 decimeter per side
    "squarecentimeters",  # Area of a square 1 centimeter per side
    "squaremillimeters",  # Area of a square 1 millimeter per side
    "squaremiles",        # Area of a square 1 Statue mile per side
    "acres",              # Area of 4046.8564224 square meters
    "squareyards",        # Area of a square 1 international yard per side
    "squarefeet",         # Area of a square 1 international foot per side
    "squareinches",       # Area of a square 1 international inch per side
    "squaremilesus",      # Area of a square 1 US Survey mile per side.
    "acresus",            # Used when working with US Survey feet and equal to 43,560 square U.S. Survey Feet or 4,046.872 square meters
    "squareyardsus",      # Area of a square 1 US Survey yard per side
    "squarefeetus",       # Area of a square 1 US Survey foot per side
    "squareinchesus",     # Area of a square 1 US Survey inch per side
)

# key for cost to report
COST_KEY = "cost"

# currently supported calculation of statistics
SUPPORTED_STATS = ["min", "max", "mean", "sum", "stddev"]

# Labels of the statistics
SUPPORTED_STATS_LBLS = ["Sum", "Mean", "Minimum", "Maximum", "Standard deviation"]

# currently supported field types for statistics calculation
SUPPORTED_STAT_FIELD_TYPE = ["Double", "Single", "Integer", "SmallInteger", "Date",
                             "BigInteger", "DateOnly", "TimeOnly",
                             "TimestampOffset"]

# currently supported groupby field type
SUPPORTED_GB_FIELD_TYPE = ["Integer", "SmallInteger", "String", "Date", "Text",
                           "BigInteger", "DateOnly", "TimeOnly",
                           "TimestampOffset"]

# currently all field types
ALL_FIELD_TYPES = ["Blob", "BigInteger", "Date", "DateOnly", "Double",
                   "Geometry", "GlobalID", "Guid", "Integer",
                   "OID", "Raster", "Single", "SmallInteger",
                   "String", "TimeOnly", "TimestampOffset"]

# numeric field types
NUMERIC_FIELD_TYPES = ["Double", "Single", "Integer", "SmallInteger", "BigInteger"]

class RemoteUtilityCall(Enum):
    SOAPOnly = 1   # Only call the remote utility service via SOAP
    RESTOnly = 2   # Only call the remote utility service via REST
    SOAPFirst = 3  # Call remote utility service via SOAP first, use REST as fall back
    RESTFirst = 4  # Call remote utility service via REST first, use SOAP as fall back

# lookup between the H3 Hexagon resolution and the cell area in the unit of square kilometers
# https://pro.arcgis.com/en/pro-app/latest/tool-reference/data-management/generatetesellation.htm
H3_HEXAGON_RES = {
    0:  4357449.416078381,
    1:  609788.441794133,
    2:  86801.780398997,
    3:  12393.434655088,
    4:  1770.347654491,
    5:  252.903858182,
    6:  36.129062164,
    7:  5.161293360,
    8:  0.737327598,
    9:  0.105332513,
    10: 0.015047502,
    11: 0.002149643,
    12: 0.000307092,
    13: 0.000043870,
    14: 0.000006267,
    15: 0.000000895
}

# fully qualified field names in PostGreSQL/mobileGeodatabase
FQ_FIELD_NAMES = ["FID", "AREA", "LEN", "POINTS", "NUMOFPTS",
                  "ENTITY", "EMINX", "EMINY", "EMAXX",
                  "EMAXY", "EMINZ", "EMAXZ",
                  "MIN_MEASURE",
                  "MAX_MEASURE"]

# Enumerator of workspace
class Workspace(Enum):
    FGDB = 1      # file geodatabase
    InMemory = 2  # in_memory
    Memory = 3    # memory
    SDE = 4       # SDE
    FSDB = 5      # feature service db

# Enumerator of message category
class MsgCategory(Enum):
    AO = 1  # ArcGIS Online
    GP = 2  # GP
    GE = 3  # GPExt

DEFAULT_DOWNLOADABLE_FEATCOUNT = None

# Lookup used for SS tools to get conversion factor
DISTANCE_UNIT_INFO = {
    "METER": ("Meters", 1.0),
    "METERS": ("Meters", 1.0),
    "INTL_FOOT": ("International Feet", 0.3048),
    "FOOT": ("Feet", 0.3048006096012192),
    "FEET": ("Feet", 0.3048006096012192),
    "FOOT_US": ("US_Feet", 0.3048006096012192),
    "US_FOOT": ("US_Feet", 0.3048006096012192),
    "US_FEET": ("US_Feet", 0.3048006096012192),
    "MILE_US": ("US Miles", 1609.347218694438),
    "US_MILES": ("US Miles", 1609.347218694438),
    "US_MILE": ("US Miles", 1609.347218694438),
    "MILES": ("Miles", 1609.347218694438),
    "MILE": ("Miles", 1609.347218694438),
    "KILOMETER": ("Kilometers", 1000.0),
    "KILOMETERS": ("Kilometers", 1000.0),
    "FOOT_CLARKE": ("Clarke Feet", 0.304797265),
    "FATHOM": ("Fathoms", 1.8288),
    "NAUTICAL_MILE": ("Nautical Miles", 1852.0),
    "METER_GERMAN": ("German Meters", 1.00000135965),
    "CHAIN_US": ("US Chains", 20.11684023368047),
    "LINK_US": ("US Links", 0.2011684023368047),
    "YARD_CLARKE": ("Clarke Yards", 0.914391795),
    "CHAIN_CLARKE": ("Clarke Chains", 20.11661949),
    "LINK_CLARKE": ("Clarke Links", 0.2011661949),
    "YARD_SEARS": ("Sears Yards", 0.9143984146160287),
    "FOOT_SEARS": ("Sears Feet", 0.3047994715386762),
    "CHAIN_SEARS": ("Sears Chains", 20.11676512155263),
    "LINK_SEARS": ("Sears Links", 0.2011676512155263),
    "YARD_BENOIT_1895_A": ("Benoit Yards (1895 A)", 0.9143992),
    "FOOT_BENOIT_1895_A": ("Benoit Feet (1895 A)", 0.3047997333333333),
    "CHAIN_BENOIT_1895_A": ("Benoit Chains (1895 A)", 20.1167824),
    "LINK_BENOIT_1895_A": ("Benoit Links (1895 A)", 0.201167824),
    "YARD_BENOIT_1895_B": ("Benoit Yards (1895 B)", 0.9143992042898124),
    "FOOT_BENOIT_1895_B": ("Benoit Feet (1895 B)", 0.3047997347632708),
    "CHAIN_BENOIT_1895_B": ("Benoit Chains (1895 B)", 20.11678249437587),
    "LINK_BENOIT_1895_B": ("Benoit Links (1895 B)", 0.2011678249437587),
    "FOOT_1865": ("Feet (1865)", 0.3048008333333334),
    "FOOT_INDIAN": ("Indian Feet", 0.3047995102481469),
    "FOOT_INDIAN_1937": ("Indian Feet (1937)", 0.30479841),
    "FOOT_INDIAN_1962": ("Indian Feet (1962)", 0.3047996),
    "FOOT_INDIAN_1975": ("Indian Feet (1975)", 0.3047995),
    "YARD_INDIAN": ("Indian Yards", 0.9143985307444408),
    "YARD_INDIAN_1937": ("Indian Yards (1937)", 0.91439523),
    "YARD_INDIAN_1962": ("Indian Yards (1962)", 0.9143988),
    "YARD_INDIAN_1975": ("Indian Yards (1975)", 0.9143985),
    "FOOT_GOLD_COAST": ("Gold Coast Feet", 0.3047997101815088),
    "FOOT_BRITISH_1936": ("British Feet (1936)", 0.3048007491),
    "YARD": ("Yards", 0.9144),
    "YARD_US": ("US Yards", 0.9144018288036576),
    "CHAIN": ("Chains", 20.1168),
    "LINK": ("Links", 0.201168),
    "DECIMETER": ("Decimeters", 0.1),
    "CENTIMETER": ("Centimeters", 0.01),
    "MILLIMETER": ("Millimeters", 0.001),
    "INCH": ("Inches", 0.0254),
    "INCH_US": ("US Inches", 0.0254000508001016),
    "ROD": ("Rods", 5.0292),
    "ROD_US": ("US Rods", 5.029210058420118),
    "NAUTICAL_MILE_US": ("US Nautical Miles", 1853.248),
    "NAUTICAL_MILE_UK": ("UK Nautical Miles", 1853.184),
    "50_KILOMETERS": ("50 Kilometers", 50000.0),
    "150_KILOMETERS": ("150 Kilometers", 150000.0),
    "UNKNOWN": ("Unknown Units", 1.0),
    "RADIAN": ("Radians", 1.0),
    "RADIANS": ("Radians", 1.0),
    "DEGREE": ("Degrees", 0.0174532925199433),
    "MINUTE": ("Minutes", 0.0002908882086657216),
    "SECOND": ("Seconds", 0.00000484813681109536),
    "GRAD": ("Grads", 0.01570796326794897),
    "GON": ("Gons", 0.01570796326794897),
    "MICRORADIAN": ("Microradians", 0.000001),
    "MINUTE_CENTESIMAL": ("Centesimal Minutes", 0.0001570796326794897),
    "SECOND_CENTESIMAL": ("Centesimal Seconds", 0.000001570796326794897),
    "MIL_6400": ("MIL_6400", 0.0009817477042468104),
    "INCHESINT": ("International Feet", 0.0254),
    "FEETINT": ("International Feet", 0.3048),
    "YARDSINT": ("International Feet", 0.9144),
    "MILESINT": ("Statute Miles", 1609.344),
    "STATUTE_MILE": ("Statute Miles", 1609.344)
}

SS_DATATYPE_2_DATATYPE = {
    "LONG": "Integer",
    "SHORT": "SmallInteger",
    "FLOAT": "Single",
    "DOUBLE": "Double",
    "TEXT": "String",
    "STRING": "String",
    "DATE": "Date",
}

#region Parameter index lookup

# index of parameters for FindHotspots
FHS_PARAM_NAMES = {
    "analysisLayer":           0,
    "analysisField":           1,
    "dividedByField":          2,
    "boundingPolygonLayer":    3,
    "aggregationPolygonLayer": 4,
    "shapeType":               5,
    "cellSize":                6,
    "cellSizeUnits":           7,
    "distanceBand":            8,
    "distanceBandUnits":       9,
    "outputName":             10,
    "context":                11,
    "hotSpotsResultLayer":    12,
    "processInfo":            13
}

# index of parameters for FindOutliers
FO_PARAM_NAMES = {
    "analysisLayer": 0,
    "analysisField": 1,
    "dividedByField": 2,
    "boundingPolygonLayer": 3,
    "aggregationPolygonLayer": 4,
    "permutations": 5,
    "shapeType": 6,
    "cellSize": 7,
    "cellSizeUnits": 8,
    "distanceBand": 9,
    "distanceBandUnits": 10,
    "outputName": 11,
    "context": 12,
    "outliersResultLayer": 13,
    "processInfo": 14
}

# index of parameters for FindPointClusters
FPC_PARAM_NAMES = {
    "analysisLayer": 0,
    "minFeaturesCluster": 1,
    "searchDistanceValue": 2,
    "searchDistanceUnit": 3,
    "outputName": 4,
    "context": 5,
    "clusteringMethod": 6,
    "sensitivity": 7,
    "timeField": 8,
    "searchTimeInterval": 9,
    "searchTimeUnits": 10,
    "resultLayer": 11,
    "processInfo": 12
}
#endregion
