from enum import Enum

class ConvertCoordNotation(Enum):
    INPUT_COORD_FORMAT = "input_coordinate_format"
    INPUT_COORD_FORMAT_DD_1 = "DD 1"
    INPUT_COORD_FORMAT_DD_2 = "DD 2"
    INPUT_COORD_FORMAT_USNG = "USNG"
    INPUT_COORD_FORMAT_MGRS = "MGRS"
    OUTPUT_COORD_FORMAT = "output_coordinate_format"
    OUTPUT_COORD_FORMAT_DD_1 = "DD 1"
    OUTPUT_COORD_FORMAT_DD_2 = "DD 2"
    OUTPUT_COORD_FORMAT_USNG = "USNG"
    OUTPUT_COORD_FORMAT_MGRS = "MGRS"
    X_FIELD = "x_field"
    Y_FIELD = "y_field"

class Gazetteer(Enum):
    LXT_GAZ = "LOCATEXT_GAZETTEER"
    ALL = "ALL_FEATURES"
    ADMIN = "ADMINISTRATIVE_FEATURES"
    HYDRO = "HYDROLOGICAL_FEATURES"
    GEN = "LOCALITY_FEATURES"
    POP = "POPULATED_PLACES"
    TRANS = "TRANSPORTATION_FEATURES"
    PT = "SPOT_FEATURES"
    TERR = "TERRAIN_FEATURES"
    SEA = "UNDERSEA_FEATURES"
    VEG = "VEGETATION_FEATURES"
    GEO_FILTER = "FILTER_BY_ROI"
    NO_GEO_FILTER = "INCLUDE_ALL_FILTER"
    GEONAMES = "GEONAMES"
    NGA_GNS = "NGA_GNS"
    USGS_GNIS = "USGS_GNIS"
    USGS_ANT = "USGS_ANTARCTIC_NAMES"
    PRECISION = "Precision"
    ORIG_COORD = 'Original Coordinate'
    CASE_SENSITIVE = 'Case Sensitive'
    ERRORS_ALLOWED = 'Errors Allowed'
    EFEL = 'Errors From Error Level'
    SR = 'Spatial Reference'
    NAME = 'placename'

class RPFTypes(Enum):
    CADRG = "CADRG"
    CIB = "CIB"
    DTED = "DTED"
    HRE = "HRE"

class AllowDuplicates(Enum):
    EXCLUDE = "EXCLUDE_DUPLICATES"
    ALLOW = "ALLOW_DUPLICATES"
    OVERWRITE = "OVERWRITE_DUPLICATES"
