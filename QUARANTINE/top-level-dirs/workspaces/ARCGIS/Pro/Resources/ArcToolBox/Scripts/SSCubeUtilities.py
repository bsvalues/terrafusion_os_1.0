import os as OS
import arcpy as ARCPY
import numpy as NUM
import numpy.ma as MA
import SSUtilities as UTILS
import SSTimeUtilities as TUTILS
import SSTimeSeries as TS
import SSDataObject as SSDO
import SSCubeObject as SSCO
import numpy.linalg as LA
import scipy.stats as SCPS
import scipy.optimize as OPT
import arcgisscripting as ARC
import json as JSON
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')
################ Constants ###################
maxGompIters = 200
maxExpIters = 200

hexScale = NUM.sqrt(3.0)
riskFunMin = 10
riskFunStep = 5
riskFunMax = 100
minNumTimeCube = 10
dbgInput = None

allAggregationTypes = [None, "SUM", "MEAN", "MIN", "MAX", "STD", "MEDIAN"]
allPredictionTypes = ["ZEROS", "SPATIAL_NEIGHBORS", "SPACE_TIME_NEIGHBORS",
                      "TEMPORAL_TREND"]
spatialTypes = ["SPATIAL_NEIGHBORS", "SPACE_TIME_NEIGHBORS"]
splineArray = NUM.asarray([0, 1, -2, -1], dtype = NUM.int32)

agg2Number = {"SUM" : 0, "MEAN": 1, "MIN": 2, "MAX": 3, "STD": 4, "MEDIAN": 5}
pred2Number = {"ZEROS" : 0, "SPATIAL_NEIGHBORS": 1, "SPACE_TIME_NEIGHBORS": 2,
               "TEMPORAL_TREND": 3}

allCubeThemes = ["TIME_SERIES_CLUSTERING_RESULTS", "HOT_AND_COLD_SPOT_TRENDS",
                 "EMERGING_HOT_SPOT_ANALYSIS_RESULTS", "TIME_SERIES_CHANGE_POINTS",
                 "FORECAST_RESULTS", "TRENDS", "NUMBER_OF_ESTIMATED_BINS",
                 "TIME_SERIES_OUTLIER_RESULTS", "LOCATIONS_WITH_DATA",
                 "LOCATIONS_EXCLUDED_FROM_ANALYSIS","COUNT",
                 "TEMPORAL_AGGREGATION_COUNT", "LOCAL_OUTLIER_RESULTS",
                 "HOT_AND_COLD_SPOT_RESULTS", "VALUE", "ESTIMATED_BINS",
                 "LOCAL_OUTLIER_ANALYSIS_RESULTS", "PERCENTAGE_OF_LOCAL_OUTLIERS",
                 "LOCAL_OUTLIER_IN_MOST_RECENT_TIME_PERIOD",
                 "LOCATIONS_WITHOUT_SPATIAL_NEIGHBORS"]

################## Locals ##########################
coreCubeVarNames = ['time', 'projection', 'x', 'y', 'lat', 'lon']
corePanelVarNames = ['time', 'projection', 'x', 'y', 'lat', 'lon', 
                     'poly_coords', 'poly_breaks']
convertAlignment = {"End": "END_TIME", "Start": "START_TIME"}

supportDist = ["FEET", "FOOT", "US_FEET", "US_FOOT", "FOOT_US", 
               "METERS", "METER", "KILOMETER", "KILOMETERS", 
               "MILE", "MILES", "US_MILES", "US_MILE", "MILE_US", 
               "FEETINT", "MILESINT"]

supportTime = ["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS",
               "YEARS"]

aggcTypes = {"SUM" : 0, "MEAN": 1, "MIN": 2, "MAX": 3, "STD": 4, "MEDIAN": 5}

predcTypes = {"ZEROS" : 0, "SPATIAL_NEIGHBORS": 1, "SPACE_TIME_NEIGHBORS": 2,
              "TEMPORAL_TREND": 3}

categoryDict = {0:"No Pattern Detected", 1:"New Hot Spot", 
                2:"Consecutive Hot Spot", 3:"Intensifying Hot Spot", 
                4:"Persistent Hot Spot", 5:"Diminishing Hot Spot",
                6:"Sporadic Hot Spot", 7:"Oscillating Hot Spot", 
                8:"Historical Hot Spot",
                -1:"New Cold Spot", -2:"Consecutive Cold Spot",
                -3:"Intensifying Cold Spot", -4:"Persistent Cold Spot",
                -5:"Diminishing Cold Spot", -6:"Sporadic Cold Spot",
                -7:"Oscillating Cold Spot", 
                -8:"Historical Cold Spot"}

hsSigBinValue = 1
mkSigValue = .1
emergingNumSig = .9

numericTypes =  [int, NUM.int32, NUM.int64, NUM.float32, NUM.float64, float]

histMethod = "RISK_FUN"

aggTypeOutDict = {"SUM": 1, "MEAN": 2, "MIN": 3, "MAX": 4,
                  "STD": 5, "MEDIAN": 6}
predTypeOutDict = {'ZEROS': 1, 'SPACE': 2, 'SPACETIME': 3, 'TREND': 4}

coTypeDict = {0: 'Never Significant', 1: 'Only High-High Cluster',
              2: 'Only Low-High Outlier', 3: 'Only Low-Low Cluster', 
              4: 'Only High-Low Outlier', 5: 'Multiple Types'}

coLastDict = {2: 'Low-High Outlier', 4:'High-Low Outlier'}

textFieldKeys = ["cell_size", "cell_units", "grid_type", 
                 "num_rows", "num_cols", 
                 "left_start_time", "right_start_time", 
                 "left_end_time", "right_end_time",
                 "time_step", "time_units", "num_time", 
                 "time_step_alignment", 
                 "vertical_separation", "display_type"]

denomTypes = ['SmallInteger', 'Integer', 'Single', 'Double']

cfConventionMap = {
                    "albers": "albers_conical_equal_area",
                    "azimuthal_equidistant": "azimuthal_equidistant",
                    "lambert_azimuthal_equal_area": "lambert_azimuthal_equal_area",
                    "lambert_conformal_conic": "lambert_conformal_conic",
                    "cylindrical_equal_area": "lambert_cylindrical_equal_area",
                    "mercator": "mercator",
                    "orthographic": "orthographic",
                    "stereographic": "stereographic",
                    "transverse_mercator": "transverse_mercator",
                    }

forecastType2Label = {0: ARCPY.GetIDMessage(220031), 1: ARCPY.GetIDMessage(220032),
                      2: ARCPY.GetIDMessage(220033), 3: ARCPY.GetIDMessage(220034),
                      100: ARCPY.GetIDMessage(260351), 101: ARCPY.GetIDMessage(260352),
                      102: ARCPY.GetIDMessage(260353), 103: ARCPY.GetIDMessage(260354), 
                      104: ARCPY.GetIDMessage(260355), 105: ARCPY.GetIDMessage(260373)}

curveType2Label = {'mean': ARCPY.GetIDMessage(220035), 
                   'linear': ARCPY.GetIDMessage(220036), 
                   'parabolic': ARCPY.GetIDMessage(220037), 
                   'exponential': ARCPY.GetIDMessage(220038),
                   'gompertz': ARCPY.GetIDMessage(220039)}

evalType2Label = {'mean': ARCPY.GetIDMessage(220035),
                  'linear': ARCPY.GetIDMessage(220036), 
                  'parabolic': ARCPY.GetIDMessage(220037), 
                  'exponential': ARCPY.GetIDMessage(220038),
                  'gompertz': ARCPY.GetIDMessage(220039),
                  'exponential smoothing': ARCPY.GetIDMessage(220032)}

curveType2Eq = {'mean': (1, 'Xt = c; c={0}'), 
                'linear': (2, 'Xt = a*t+b; a={0}, b={1}'), 
                'parabolic': (3, 'Xt = a*t^2+b*t+c; a={0}, b={1}, c={2}'), 
                'exponential': (3, 'Xt = k + a*exp(b*t); k={0}, a={1}, b={2}'),
                'gompertz': (4, 'Xt = k+a*exp(-b*exp(-c*t)); k={0}, a={1}, b={2}, c={3}')}

confidenceStr2Alpha = {'90%': .1, '95%': .05, '99%': .01}

localOutlierTypes = ["LOCAL_OUTLIER_ANALYSIS_RESULTS", 
                     "PERCENTAGE_OF_LOCAL_OUTLIERS", 
                     "LOCAL_OUTLIER_IN_MOST_RECENT_TIME_PERIOD",
                     "LOCATIONS_WITHOUT_SPATIAL_NEIGHBORS"]

aggPref = ["NONE", "SUM", "MEAN", "MIN", "MAX", "STD", "MED"]
neighPref = ["ZEROS", "SPATIAL_NEIGHBORS", "SPACE_TIME_NEIGHBORS", "TEMPORAL_TREND", "NONE", "DROP"]

aggMsgIDStart = 220435
neighMsgIDStart = 220442

aggregation2Label = {agg:ARCPY.GetIDMessage(aggMsgIDStart+ind) for ind, agg in enumerate(aggPref)}

fill2Label = {neigh:ARCPY.GetIDMessage(neighMsgIDStart+ind) for ind, neigh in enumerate(neighPref)}
fill2Label["DROP"] = ARCPY.GetIDMessage(220471)

targetVarStr = " (Target)"

toolHelpID = []

def getPercentile(baseData, percValue = 50, axis = None):
    if hasattr(baseData, "mask"):
        return NUM.percentile(NUM.array(baseData), percValue, axis = axis)
    else:
        return NUM.percentile(baseData, percValue, axis = axis)

def createCurveEquationField(cube, varNames, methodArray, analysisMask = None):
    """Curve Fit Equation Field"""

    candidateFieldList = []
    if hasattr(cube.dataset, 'forecast_type'):
        forecastType = int(cube.dataset.forecast_type)
    else:
        forecastType = 1

    if forecastType == 3 and varNames[0] in cube.dataset.variables:

        #### Only Create Field for Curve Fitting ####
        if analysisMask is not None:
            numLocations = analysisMask.sum()
        else:
            numLocations = cube.numLocations

        coefs = NUM.zeros((numLocations, 4), dtype = float)

        #### Combine All Coefs Into an Array ####
        for ind, varName in enumerate(varNames):
            data = cube.obtainValues(varName)
            if analysisMask is not None:
                data = data[analysisMask]

            coefs[:,ind] = data

        #### Create Coefficient String Field ####
        coefStrings = NUM.zeros(numLocations, dtype="<U256")

        for ind, method in enumerate(methodArray):
            numCoef, coefString = curveType2Eq[method]
            coefVals = [ UTILS.formatValue(i) for i in coefs[ind, 0:numCoef] ]
            coefStrings[ind] = coefString.format(*coefVals)

        alias = "Forecast Equation"
        candidateField = SSDO.CandidateField("EQUATION", "TEXT", data = coefStrings, 
                                                alias = alias, length = 256)
        candidateFieldList.append(candidateField)

    return candidateFieldList

def createSeasonFields(cube, varName, methodArray, analysisMask = None):
    try:
        forecastType = int(cube.dataset.forecast_type)
    except:
        #### Default to Exponential Smoothing for Old/Temp Cubes ####
        forecastType = 1

    candidateFieldList = []
    data = cube.obtainValues(varName)
    if analysisMask is not None:
        data = data[analysisMask]

    if forecastType == 0:
        #### Random Forest ####
        alias = "Time Window"
        candidateField = SSDO.CandidateField("TIMEWINDOW", "LONG", data = abs(data), alias = alias)
        candidateFieldList.append(candidateField)

        #### Check For Auto-Detect ####
        if methodArray[0].endswith("auto_detect"):
            isSeasonal = NUM.array(data > 0, dtype = NUM.int32)
        else:
            isSeasonal = NUM.zeros(cube.numLocations, dtype = NUM.int32)
        alias = "Is Seasonal"
        candidateField = SSDO.CandidateField("IS_SEASON", "LONG", data = isSeasonal, alias = alias)
        candidateFieldList.append(candidateField)

    elif forecastType == 1:
        #### Exp Smoothing ####
        alias = "Season Length"
        candidateField = SSDO.CandidateField("SEASON", "LONG", data = abs(data), alias = alias)
        candidateFieldList.append(candidateField)

    elif forecastType == 2:
        #### Evaluate Forecast by Location ####
        n = len(data)

        #### Season - Time Window - Is Seasonal ####
        info = NUM.ones((n, 3), dtype = NUM.int32) * -1

        for ind, value in enumerate(data):
            method = methodArray[ind]
            if method.startswith("forest-based"):
                info[ind, 1] = abs(value)
                if method.endswith("auto_detect"):
                    info[ind, 2] = int(value > 0)
                else:
                    info[ind, 2] = 0
            elif method.startswith('exponential smoothing'):
                info[ind, 0] = abs(value)
                info[ind, 2] = int(value > 0)
            else:
                info[ind, 2] = 0

        alias = "Season Length"
        candidateField = SSDO.CandidateField("SEASON", "LONG", data = info[:,0].ravel(), alias = alias)
        candidateFieldList.append(candidateField)

        alias = "Time Window"
        candidateField = SSDO.CandidateField("TIMEWINDOW", "LONG", data = info[:,1].ravel(), alias = alias)
        candidateFieldList.append(candidateField)

        alias = "Is Seasonal"
        candidateField = SSDO.CandidateField("IS_SEASON", "LONG", data = info[:,2].ravel(), alias = alias)
        candidateFieldList.append(candidateField)

    else:
        #### No Season Info for Curve Fitting ####
        pass

    return candidateFieldList

def isPanel(dataset):
    """Returns a boolean for whether the input netcdf file is a cube.

    INPUTS:
    netcdfFile (str): path to the netcdf file
    """

    validStr = 'Space-Time Pattern Mining Panel Cube'
    try:
        if validStr in dataset.description:
            return True
        else:
            return False
    except:
        return False

def isPanelFromFile(ncFile):
    import netCDF4 as NET

    try:
        dataset = NET.Dataset(ncFile, keepweakref = True)
        isPanelCube = isPanel(dataset) 
        dataset.close()
    except:
        isPanelCube = False

    return isPanelCube 

def isMasked(data):
    return hasattr(data, 'mask')

def fillWithZeros(data):
    if isMasked(data):
        data = data.filled()
        data[data == -9999.] = 0
    return data

def expandMaskedResult(res, mask):
    out = NUM.zeros(len(mask), res.dtype)
    out[mask] = res 
    return out 

def opt_gompertz(input_params, y):
    K, a, b, c = input_params

    return ARC._ss.gompertz(y, K, a, b, c)

def opt_geometric(input_params, y):
    K, a, b = input_params

    return ARC._ss.geometric(y, K, a, b)

def opt_geometric_residual(input_params, y):
    K, a, b = input_params

    return ARC._ss.geometric_residual(y, K, a, b)

def opt_geometric_jacobian(input_params, y):
    K, a, b = input_params

    return ARC._ss.geometric_jacobian(y, K, a, b)

def opt_gompertz_residual(input_params, y):
    K, a, b, c = input_params

    return ARC._ss.gompertz_residual(y, K, a, b, c)

def opt_gompertz_jacobian(input_params, y):
    K, a, b, c = input_params

    return ARC._ss.gompertz_jacobian(y, K, a, b, c)

def getRateNames(dataset, removeSTD = False):
    rates = []
    try:
        rateInfo = dataset.rate_info
        rateInfo = rateInfo.split(";")
        for rate in rateInfo:
            rateName, rateType = rate.split(",")
            if removeSTD:
                if rateType == "EMPIRICAL_BAYES_STANDARDIZED":
                    rates.append(rateName)
            else:
                rates.append(rateName)
    except:
        pass

    return rates

def calculateFittedLine(x, Y):
    length = len(x)
    sumX = NUM.sum(x)
    sumX2 = NUM.sum(NUM.square(x))
    sumY = NUM.sum(Y)
    sumXY = NUM.sum(x * Y)
    slope = (length * sumXY - sumX * sumY) / (length * sumX2 - sumX * sumX)
    intercept = (sumY - slope * sumX) / length;
    return slope, intercept


def getToolTheme2D(tool, var, dataset):
    
    isPanelCube = isPanel(dataset)
    varNames = list(dataset.variables.keys())
    toolList = []

    if isPanelCube:
        #### PANEL CUBE ####
        if tool == "CREATE" or tool == "MDR" or tool == "OLD_MDR" or tool == "SUBSET":
            if "TRENDS" not in toolList:
                if "{0}_TREND_ZSCORE".format(var) in varNames:
                    toolList.append("TRENDS")

            rateNames = getRateNames(dataset, removeSTD = False)
            if var not in rateNames:
                toolList.append("NUMBER_OF_ESTIMATED_BINS")

        elif "FORECAST" in tool:
            toolList = []
            if "FORECAST_{0}_FIT".format(var) in varNames:
                
                if hasattr(dataset, 'is_forecast'):
                    if "{0}_TREND_ZSCORE".format(var) in varNames:
                        toolList.append("TRENDS")
                    if "FORECAST_{0}_FIT".format(var) in varNames:
                        toolList.append("FORECAST_RESULTS")
                        toolList.append("NUMBER_OF_ESTIMATED_BINS")
            else:
                toolList.append("NUMBER_OF_ESTIMATED_BINS")
                toolList.append("TRENDS")
    else:
        #### GRID CUBE ####
        if tool == "CREATE" or tool == "MDR"or tool == "OLD_MDR" or tool == "SUBSET":
            toolList = ["LOCATIONS_WITH_DATA", "TRENDS"]
            if var != "COUNT":
                rateNames = getRateNames(dataset, removeSTD = False)
                if var not in rateNames:
                    toolList.append("LOCATIONS_EXCLUDED_FROM_ANALYSIS")
                    toolList.append("NUMBER_OF_ESTIMATED_BINS")

        elif "FORECAST" in tool:
            toolList = []
            if "FORECAST_{0}_FIT".format(var) in varNames:
                toolList.append("LOCATIONS_WITH_DATA")
                if hasattr(dataset, 'is_forecast'):
                    if "{0}_TREND_ZSCORE".format(var) in varNames:
                        toolList.append("TRENDS")
                    if "FORECAST_{0}_FIT".format(var) in varNames:
                        toolList.append("FORECAST_RESULTS")
                    if var != "COUNT":
                        toolList.append("LOCATIONS_EXCLUDED_FROM_ANALYSIS")
                        toolList.append("NUMBER_OF_ESTIMATED_BINS")
            else:
                toolList.append("LOCATIONS_WITH_DATA")
                toolList.append("TRENDS")

    if tool == "TSCLUST":
        toolList = ["TIME_SERIES_CLUSTERING_RESULTS"]
    elif tool == "EMERGING":
        toolList = ["HOT_AND_COLD_SPOT_TRENDS",
                    "EMERGING_HOT_SPOT_ANALYSIS_RESULTS"]
    elif tool == "OUTLIER":
        toolList = localOutlierTypes
    elif tool == "CPD":
        toolList = ["TIME_SERIES_CHANGE_POINTS"]

    if "FORECAST_{0}_OUTLIER".format(var) in varNames:
            if hasattr(dataset, 'is_forecast'):
                toolList.append("TIME_SERIES_OUTLIER_RESULTS")
 
    return toolList

def getToolTheme3D(tool, var, dataset):
    varNames = list(dataset.variables.keys())
    toolList = []

    if tool == "CREATE" or tool == "MDR" or "FORECAST" in tool or tool == "SUBSET":
        toolList = ["VALUE"]
        if var != "COUNT":
            rateNames = getRateNames(dataset, removeSTD = False)
            if var not in rateNames:
                toolList.append("ESTIMATED_BINS")
        if "TEMPORAL_AGGREGATION_COUNT" in varNames:
            toolList.append("TEMPORAL_AGGREGATION_COUNT")

    if tool == "EMERGING":
        toolList = ["HOT_AND_COLD_SPOT_RESULTS"]
    if tool == "OUTLIER":
        toolList = ["LOCAL_OUTLIER_RESULTS"]
    if "FORECAST" in tool:
        if "FORECAST_{0}_FIT".format(var) in varNames:
            if hasattr(dataset, 'is_forecast'):
                toolList.append("FORECAST_RESULTS")
        if "FORECAST_{0}_OUTLIER".format(var) in varNames:
            if hasattr(dataset, 'is_forecast'):
                toolList.append("TIME_SERIES_OUTLIER_RESULTS")
    elif tool == "CPD":
        toolList.append("TIME_SERIES_CHANGE_POINTS")

    return toolList
 
class ProjectionPlaceholder(object):
    def __init__(self):
        self.grid_mapping_name = []
        self.esri_pe_string = []
        self.standard_parallel = []
        self.longitude_of_central_meridian = []
        self.longitude_of_projection_origin = []
        self.latitude_of_projection_origin = []
        self.false_easting = []
        self.false_northing = []
        self.longitude_of_projection_origin
        self.scale_factor_at_projection_origin = []


class CubeSpatialRef(object):
    """
    Prepare parameters required for constructing Cube projection variable

    INPUT:
        extent (obj): ArcPy Extent Object
        spatialRef (obj): Spatial Refeence
        displayCVMessage {bool}: Display Convention Message

    METHOD:
        latOfOrigin(): return the latitude of the projected origin
        extentInDegree(): return the extent object for GCS

    ATTRIBUTES:
        gridMapping (str): projection name
        lonOfProjOrigin (float): longitude of projected origin
        latOfProjOrigin (float): latitude of projected origin
        falseEasting (float): false easting
        falseNorthing (float): false northing
        standardParallel (float): standard parallel1 of the projection
        lonOfCentralMeridian (float): longitude of central meridian
        scaleFactorAtProjOrigin (float): scale factor at projection origin
        scaleFacotrAtCentralMeridian (float): scale factor at central meridian
        extentInDegree (obj): extent object of GCS
        meterPerUnit (float): meter per unit of projection
        extent (obj): ArcPy Extent Object with specified spatial reference
        spatialRef (obj): ArcPy SpatialReference Object
    NOTES:
        (1): extent objection required spatial reference
    """
    def __init__(self, extent, spatialRef, displayCVMessage = True):

        #### Set up Local Variables ####
        self.esriKey = spatialRef.projectionName.lower().replace(" ", "_")
        if self.esriKey in cfConventionMap:
            #### Specify the Spatial Reference Parameters ####
            self.isCFCompliant = True
        else:
            #### Not CF Compliant ####
            self.isCFCompliant = False
            if  displayCVMessage:
                ARCPY.AddIDMessage("WARNING", 110067)

        self.gridMapping = spatialRef.projectionName.lower()
        self.lonOfProjOrigin = spatialRef.longitude
        self.PCSCode = spatialRef.PCSCode
        self.latOfProjOrigin = self.latOfOrgin()
        self.falseEasting = spatialRef.falseEasting
        self.falseNorthing = spatialRef.falseNorthing
        self.standardParallel = spatialRef.standardParallel1
        self.lonOfCentralMeridian = spatialRef.centralMeridian
        self.scaleFactorAtProjOrigin = spatialRef.scaleFactor
        self.scaleFactorAtCentralMeridian = self.scaleFactorAtProjOrigin
        gcsProjection = spatialRef.GCS
        self.extentInDegree = extent.projectAs(gcsProjection)
        self.meterPerUnit = spatialRef.metersPerUnit
        self.linearUnitName = spatialRef.linearUnitName
        self.extent = extent.projectAs(spatialRef)
        self.spatialRef = spatialRef

    def latOfOrgin(self):
        """
        OUTPUT
            latOfOrigin(float): Latitude of the projection origin(1)

        NOTE:
            (1)Used when ArcPy can not find origin property.  Value is retrieved
               from projection definition.
        """

        import re as RE
        spatialRef = ARCPY.SpatialReference(self.PCSCode)
        self.peString = spatialRef.exportToString()
        self.peString = self.peString.split(";")[0]
        lat_of_origin_regex = r"Latitude_Of_Origin',(\d+\.?\d*)]"
        match = RE.search(lat_of_origin_regex, self.peString)
        self.peString = self.peString.replace("'", "\\\"")
        if match:
            return float(match.groups()[0])
        else:
            #### When Can't Find Latitude of Origin, Return 0 ####
            return 0.

    def createProjectionVariable(self, projection=None):
        """
        Function to create cube projection variable
        INPUT
            projection (object): projection variable open for writing in NetCDF

        """
        if projection is None:
            projection  = ProjectionPlaceholder()

        if self.isCFCompliant:
            mappingType = cfConventionMap[self.esriKey]
            projection.grid_mapping_name = mappingType
            projection.esri_pe_string = self.spatialRef.exportToString()

            #### Albers Equal Area ####
            if mappingType == "albers_conical_equal_area":
                projection.standard_parallel = self.standardParallel
                projection.longitude_of_central_meridian = self.lonOfCentralMeridian
                projection.latitude_of_projection_origin = self.latOfProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Azimuthal Equidistant ####
            elif mappingType == "azimuthal_equidistant":
                projection.longitude_of_projection_origin = self.lonOfProjOrigin
                projection.latitude_of_projection_origin = self.latOfProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Lambert Azimuthal Equal Area ####
            elif mappingType == "lambert_azimuthal_equal_area":
                projection.longitude_of_projection_origin = self.lonOfProjOrigin
                projection.latitude_of_projection_origin = self.latOfProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Lambert Conformal ####
            elif mappingType == "lambert_conformal_conic":
                projection.standard_parallel = self.standardParallel
                projection.longitude_of_central_meridian = self.lonOfCentralMeridian
                projection.latitude_of_projection_origin = self.latOfProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Lambert Cylindrical Equal Area ####
            elif mappingType == "lambert_cylindrical_equal_area":
                projection.longitude_of_central_meridian = self.lonOfCentralMeridian
                projection.scale_factor_at_projection_origin = self.scaleFactorAtProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Mercator ####
            elif mappingType == "mercator":
                projection.longitude_of_projection_origin = self.lonOfProjOrigin
                projection.scale_factor_at_projection_origin = self.scaleFactorAtProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Orthographic ####
            elif mappingType == "orthographic":
                projection.longitude_of_projection_origin = self.lonOfProjOrigin
                projection.latitude_of_projection_origin = self.latOfProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Stereographic ####
            elif mappingType == "stereographic":
                projection.longitude_of_projection_origin = self.lonOfProjOrigin
                projection.latitude_of_projection_origin = self.latOfProjOrigin
                projection.scale_factor_at_projection_origin = self.scaleFactorAtProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

            #### Transverse Mercator ####
            else:
                projection.scale_factor_at_central_meridian = self.scaleFactorAtCentralMeridian
                projection.longitude_of_central_meridian = self.lonOfCentralMeridian
                projection.latitude_of_projection_origin = self.latOfProjOrigin
                projection.false_easting = self.falseEasting
                projection.false_northing = self.falseNorthing

        else:
            #### Not CF Complient ####
            projection.grid_mapping_name = self.esriKey
            projection.esri_pe_string = self.spatialRef.exportToString()

        if isinstance(projection, ProjectionPlaceholder):
            return projection

def emergingReport(binCounter, numLocations):
        
    #### Summary Info ####
    rows = []
    header = ARCPY.GetIDMessage(84551)
    rows.append([ "", ARCPY.GetIDMessage(84601), ARCPY.GetIDMessage(84602) ])
    categories = [ ARCPY.GetIDMessage(i) for i in range(84557, 84565) ]
    totalCount = 0
    for ind, cat in enumerate(categories):
        bin = ind + 1
        hotCount = binCounter[bin]
        coldCount = binCounter[-bin]
        totalCount += hotCount
        totalCount += coldCount
        rows.append([ cat, str(hotCount), str(coldCount) ])

    #### End Line ####
    rows.append("EMPTY")

    outputTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                        justify = ['left', 'right', 'right'],
                                        titleFillToken = "-", colPad = 10,
                                        emptyFillToken = "-",
                                        footnote=[ARCPY.GetIDMessage(84565).format(totalCount,numLocations)],
                                        force2Txt=False)
    outputTable += "\n"

    #### Category Table ####
    rows = []
    header = ARCPY.GetIDMessage(84566)
    # rows.append([header])
    # emptyRow = [""]
    # rows.append("EMPTY")
    # rows.append(emptyRow)
    if UTILS.couldExportHTMLMessage():
        UTILS.outputHeader(header, level=5)
    else:
        outputTable += "\n" + header + "\n"
        outputTable += "-"*70 + "\n\n"

    #### Top Hot ####
    # rowString = UTILS.formatString("{0} {1}")
    # bullet = "-"

    # rows.append([ ARCPY.GetIDMessage(84581) ])
    outputTable += UTILS.outputParagraph(ARCPY.GetIDMessage(84581), force2Txt=False) + "\n"


    for idVal in range(84582, 84589):
        rows.append(ARCPY.GetIDMessage(idVal))

    outputTable += UTILS.outputBulletList(rows, ordered=False, force2Txt=False) + "\n"
    # ARCPY.AddMessage("\n")
    rows = []

    #### Time Intervals ####
    #### Bottom Hot ####
    # rows.append([ ARCPY.GetIDMessage(84589) ])
    outputTable += UTILS.outputParagraph(ARCPY.GetIDMessage(84589), force2Txt=False) + "\n"
    # rows.append([ rowString.format(bullet, ARCPY.GetIDMessage(84590)) ])
    rows.append(ARCPY.GetIDMessage(84590))
    outputTable += UTILS.outputBulletList(rows, ordered=False, force2Txt=False)

    #### End Line ####
    if not UTILS.couldExportHTMLMessage():
    # rows.append("EMPTY")
    # rows.append(emptyRow)
        outputTable += "-"*70 + "\n\n"
    # ARCPY.AddMessage("-"*70)
    # ARCPY.AddMessage("\n")
    rows = []

    #### Top Cold ####
    # rows.append([ ARCPY.GetIDMessage(84591) ])
    outputTable += UTILS.outputParagraph(ARCPY.GetIDMessage(84591), force2Txt=False) + "\n"
    for idVal in range(84592, 84599):
        # rows.append([ rowString.format(bullet, ARCPY.GetIDMessage(idVal)) ])
        rows.append(ARCPY.GetIDMessage(idVal))

    # rows.append(emptyRow)
    outputTable += UTILS.outputBulletList(rows, ordered=False, force2Txt=False) + "\n"
    # ARCPY.AddMessage("\n")
    rows = []

    #### Bottom Cold ####
    # rows.append([ ARCPY.GetIDMessage(84599) ])
    outputTable += UTILS.outputParagraph(ARCPY.GetIDMessage(84599), force2Txt=False) + "\n"
    # rows.append([ rowString.format(bullet, ARCPY.GetIDMessage(84600)) ])
    rows.append(ARCPY.GetIDMessage(84600))
    outputTable += UTILS.outputBulletList(rows, ordered=False, force2Txt=False)

    #### End Line ####
    # rows.append("EMPTY")
    if not UTILS.couldExportHTMLMessage():
        # rows.append("EMPTY")
        # rows.append(emptyRow)
        # ARCPY.AddMessage("-"*70)
        outputTable += "-"*70 + "\n"

    # outputTable += UTILS.outputTextTable(rows, pad = 1,
    #                                      emptyFillToken = "-",
    #                                      force2Txt=False)

    return outputTable

def outlierReport(binData, timeBreaks, isStartTime):
    numTime, numLocations = binData.shape
    lessT = numTime - 1.0

    #### Location Based Sums of Categories ####
    numAny = binData != 0
    numHH = (binData == 1).sum(0)
    numLL = (binData == 3).sum(0)
    bin2 = (binData == 2)
    bin4 = (binData == 4)
    numLH = bin2.sum(0)
    numHL = bin4.sum(0)
    numOut = numLH + numHL

    #### Time Based Sums of Categories
    timeLH = bin2.sum(1)
    timeHL = bin4.sum(1)

    #### Set Single and More Than One Cat ####
    typeData = NUM.zeros((numLocations,), dtype = NUM.int32)
    sumData = NUM.zeros((numLocations,4), dtype = bool)
    sumData[:,0] = numHH > 0
    sumData[:,1] = numLH > 0
    sumData[:,2] = numLL > 0
    sumData[:,3] = numHL > 0
    sumCats = sumData.sum(1)

    #### Single Cat ####
    onlyOneCat = sumCats == 1
    typeData[onlyOneCat] = sumData[onlyOneCat].argmax(1) + 1

    #### Multiple Cat ####
    moreThanOneCat = sumCats > 1
    typeData[moreThanOneCat] = 5

    #### Last Time Step Table ####
    lastDataLH = binData[-1] == 2
    lastDataHL = binData[-1] == 4
    sumLastLH = lastDataLH.sum()
    sumLastHL = lastDataHL.sum()
    sumLastOut = sumLastHL + sumLastLH
    rows = []
    header = ARCPY.GetIDMessage(84641)
    rows.append([ARCPY.GetIDMessage(84642), "{0}".format(sumLastOut)])
    rows.append([ARCPY.GetIDMessage(84643), "{0}".format(sumLastHL)])
    rows.append([ARCPY.GetIDMessage(84644), "{0}".format(sumLastLH)])

    #### End Line ####
    rows.append("EMPTY")

    lastTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                      justify = ['left', 'right'],
                                      titleFillToken = "-",
                                      emptyFillToken = "-", emphasizeHeadRow=False,
                                      force2Txt=False)
    outputTable = "\n" + lastTable + "\n"

    #### Key Time Step Table ####
    rows = []
    header = ARCPY.GetIDMessage(84645)
    timeAll = timeHL + timeLH
    if isStartTime:
        secondChange = 'STARTTIME'
    else:
        secondChange = 'ENDTIME'

    #### First/Last ####
    firstLastInfo = TUTILS.getFirstLastTimeSteps(timeAll, timeBreaks, 
                                                    secondChange = secondChange)
    firstStartTime, firstEndTime, lastStartTime, lastEndTime = firstLastInfo

    #### First Outlier ####
    if firstStartTime != "None":
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84646), rowSpan=2), firstStartTime])
        rows.append(["@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(firstEndTime), align="right")])
    else:
        rows.append([ARCPY.GetIDMessage(84646), firstStartTime])

    #### Last Outlier ####
    if lastStartTime != "None":
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84647), rowSpan=2), lastStartTime])
        rows.append(["@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(lastEndTime), align="right")])
    else:
        rows.append([ARCPY.GetIDMessage(84647), lastStartTime])

    #### Most All Outliers ####
    mostAllInfo = TUTILS.getKeyTimeSteps(timeAll, timeBreaks, minimum = False, 
                                            secondChange = secondChange)
    mostOutTimeVal, mostOutStartTime, mostOutEndTime = mostAllInfo
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84648), rowSpan=3), mostOutTimeVal])
    rows.append([ "@@none", UTILS.buildTableCell(mostOutStartTime, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(mostOutEndTime), align="right")])

    #### Least All Outliers ####
    leastAllInfo = TUTILS.getKeyTimeSteps(timeAll, timeBreaks, 
                                            secondChange = secondChange)
    leastOutTimeVal, leastOutStartTime, leastOutEndTime = leastAllInfo
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84649), rowSpan=3), leastOutTimeVal])
    rows.append([ "@@none", UTILS.buildTableCell(leastOutStartTime, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(leastOutEndTime), align="right")])

    #### Most HL ####
    mostHLInfo = TUTILS.getKeyTimeSteps(timeHL, timeBreaks, minimum = False, 
                                        secondChange = secondChange)
    mostHLTimeVal, mostHLStartTime, mostHLEndTime = mostHLInfo
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84650), rowSpan=3), mostHLTimeVal])
    rows.append([ "@@none", UTILS.buildTableCell(mostHLStartTime, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(mostHLEndTime), align="right")])

    #### Least HL ####
    leastHLInfo = TUTILS.getKeyTimeSteps(timeHL, timeBreaks, 
                                            secondChange = secondChange)
    leastHLTimeVal, leastHLStartTime, leastHLEndTime = leastHLInfo
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84651), rowSpan=3), leastHLTimeVal])
    rows.append([ "@@none", UTILS.buildTableCell(leastHLStartTime, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(leastHLEndTime), align="right")])

    #### Most LH ####
    mostLHInfo = TUTILS.getKeyTimeSteps(timeLH, timeBreaks, minimum = False, 
                                        secondChange = secondChange)
    mostLHTimeVal, mostLHStartTime, mostLHEndTime = mostLHInfo
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84652), rowSpan=3), mostLHTimeVal])
    rows.append([ "@@none", UTILS.buildTableCell(mostLHStartTime, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(mostLHEndTime), align="right")])

    #### Least LH ####
    leastLHInfo = TUTILS.getKeyTimeSteps(timeLH, timeBreaks, 
                                            secondChange = secondChange)
    leastLHTimeVal, leastLHStartTime, leastLHEndTime = leastLHInfo
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84653), rowSpan=3), leastLHTimeVal])
    rows.append([ "@@none", UTILS.buildTableCell(leastLHStartTime, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(ARCPY.GetIDMessage(84574).format(leastLHEndTime), align="right")])

    #### End Line ####
    rows.append("EMPTY")

    keyTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                     justify = ['left', 'right'],
                                     titleFillToken = "-",
                                     emptyFillToken = "-", emphasizeHeadRow=False,
                                     force2Txt=False)
    outputTable += "\n" + keyTable + "\n"

    #### Location Summary Table ####
    rows = []
    header = ARCPY.GetIDMessage(84664)
    emptyRow = ["", "", ""]

    #### Category/Location Label ####
    rows.append([ ARCPY.GetIDMessage(84657), 
                    ARCPY.GetIDMessage(84671),
                    ARCPY.GetIDMessage(84673)])

    #### Calc Category Totals ####
    typeHHSum = (typeData == 1).sum()
    typeLHSum = (typeData == 2).sum()
    typeLLSum = (typeData == 3).sum()
    typeHLSum = (typeData == 4).sum()
    typeMixSum = (typeData == 5).sum()
    typeAllSum = typeHHSum + typeLHSum + typeLLSum + typeHLSum + typeMixSum
    typeNotSum = numLocations - typeAllSum
    n = numLocations * 1.0
    typeHHPerc = UTILS.formatValue((typeHHSum / n) * 100, "%0.2f")
    typeLHPerc = UTILS.formatValue((typeLHSum / n) * 100, "%0.2f")
    typeLLPerc = UTILS.formatValue((typeLLSum / n) * 100, "%0.2f")
    typeHLPerc = UTILS.formatValue((typeHLSum / n) * 100, "%0.2f")
    typeMixPerc = UTILS.formatValue((typeMixSum / n) * 100, "%0.2f")
    typeNotPerc = UTILS.formatValue((typeNotSum / n) * 100, "%0.2f")

    #### Add Cat Rows ####
    rows.append([ ARCPY.GetIDMessage(84670),  
                    "{0}".format(typeNotSum),
                    typeNotPerc ])
    rows.append([ ARCPY.GetIDMessage(84665),  
                    "{0}".format(typeHHSum),
                    typeHHPerc ])
    rows.append([ ARCPY.GetIDMessage(84666),  
                    "{0}".format(typeLHSum),
                    typeLHPerc ])
    rows.append([ ARCPY.GetIDMessage(84667),  
                    "{0}".format(typeLLSum),
                    typeLLPerc ])
    rows.append([ ARCPY.GetIDMessage(84668),  
                    "{0}".format(typeHLSum),
                    typeHLPerc ])
    rows.append([ ARCPY.GetIDMessage(84669),  
                    "{0}".format(typeMixSum),
                    typeMixPerc ])

    #### End Line ####
    rows.append("EMPTY")

    catTable = UTILS.outputTextTable(rows, header = header, pad = 1,
                                     justify = ['left', 'right', 'right'],
                                     titleFillToken = "-",
                                     emptyFillToken = "-",
                                     force2Txt=False)
    outputTable += "\n" + catTable + "\n"

    #### Entire Cube ####
    rows = []
    header = ARCPY.GetIDMessage(84654)

    #### Locations w/ Outliers ####
    numWithOutliers = (numOut != 0).sum()
    strNumOutliers = ARCPY.GetIDMessage(84656).format(numWithOutliers, numLocations)
    rows.append([ARCPY.GetIDMessage(84655), "@@none", UTILS.buildTableCell(strNumOutliers, colSpan=2)])

    #### Empty Row ####
    rows.append(emptyRow)

    #### Category/Bin Label ####
    rows.append([ ARCPY.GetIDMessage(84657),  ARCPY.GetIDMessage(84658), ARCPY.GetIDMessage(84674)])

    #### High/Low Outlier Bins ####
    nBins = numLocations * lessT
    sumHighOut = numHL.sum()
    sumLowOut = numLH.sum()
    percHighOut = UTILS.formatValue((sumHighOut / nBins) * 100., "%0.2f")
    percLowOut = UTILS.formatValue((sumLowOut / nBins) * 100., "%0.2f")
    rows.append([ ARCPY.GetIDMessage(84659), "{0}".format(sumHighOut), percHighOut])
    rows.append([ ARCPY.GetIDMessage(84660), "{0}".format(sumLowOut), percLowOut])
        
    #### High/Low Cluster Bins ####
    sumHighClust = numHH.sum()
    sumLowClust = numLL.sum()
    percHighClust = UTILS.formatValue((sumHighClust / nBins) * 100., "%0.2f")
    percLowClust = UTILS.formatValue((sumLowClust / nBins) * 100., "%0.2f")
    rows.append([ ARCPY.GetIDMessage(84661), "{0}".format(sumHighClust), percHighClust])
    rows.append([ ARCPY.GetIDMessage(84662), "{0}".format(sumLowClust), percLowClust])

    #### Not Significant ####
    sumNotSig = int(nBins) - (sumHighClust + sumLowOut + sumLowClust + sumHighOut)
    percNotSig = UTILS.formatValue((sumNotSig / nBins) * 100., "%0.2f")
    rows.append([ ARCPY.GetIDMessage(84663), "{0}".format(sumNotSig), percNotSig])

    #### End Line ####
    rows.append("EMPTY")

    cubeTable = UTILS.outputTextTable(rows, header = header, pad = 1, 
                                      justify = ['left', 'right', 'right'],
                                      titleFillToken = "-", emptyFillToken = "-", emphasizeHeadRow=False, boldRows=2,
                                      force2Txt=False)
    outputTable += "\n" + cubeTable 

    return outputTable

def timeSeriesTrendReport(mkStats, mkPVals):
    header = ARCPY.GetIDMessage(84804)
    rows = [[ARCPY.GetIDMessage(84790), ARCPY.GetIDMessage(84805),
             ARCPY.GetIDMessage(84806), ARCPY.GetIDMessage(84807)]]

    for ind, mkStat in enumerate(mkStats):
        mkPVal = mkPVals[ind]
        direction, trendString = UTILS.getMannKendallDirStr(mkStat, mkPVal) 
        rows.append([str(ind+1), direction, 
                     UTILS.formatValue(mkStat, "%0.4f"),
                     UTILS.formatValue(mkPVal, "%0.4f")])

    rows.append("EMPTY")

    trendTSTable = UTILS.outputTextTable(rows, header = header, pad = 1, colPad = 5,
                                         justify = ['left', 'left', 'right', 'right'],
                                         titleFillToken = "-",
                                         emptyFillToken = "-", force2Txt=False)

    return trendTSTable

def createHotSpot3DFields(varName, indexData, pvData, binData, varID = ""):
    """Returns core Hot-Spot Output Fields for 3D.(1)

    INPUTS:
    varName (str): name of core field
    indexData (array): hot-spot zscore
    pvData (array): p-values
    binData (array): hot-spot significance bin
    varID (str): number to append to field names

    NOTES:
    (1) Input arrays should already have their masks applied.
    """

    candidateFieldList = []
    alias = UTILS.formatString("Hot Spot Analysis z-score ({0})").format(varName)
    candidateField = SSDO.CandidateField("HS_ZSCORE{0}".format(varID), 
                                         "DOUBLE", data = indexData,
                                         alias = alias)
    candidateFieldList.append(candidateField)

    alias = UTILS.formatString("Hot Spot Analysis p-value ({0})").format(varName)
    candidateField = SSDO.CandidateField("HS_PVALUE{0}".format(varID), 
                                         "DOUBLE", data = pvData,
                                         alias = alias)
    candidateFieldList.append(candidateField)

    alias = UTILS.formatString("Hot Spot Analysis bin ({0})").format(varName)
    candidateField = SSDO.CandidateField("HS_BIN{0}".format(varID),
                                            "LONG",
                                            data = binData,
                                            alias = alias)
    candidateFieldList.append(candidateField)

    return candidateFieldList

def createForecast3DFields(varName, rawData, fitData, highData = None, lowData = None,
                           levelData = None, trendData = None, seasonData = None):
    """Returns core Forecast Output Fields for 3D.(1)

    INPUTS:
    varName (str): name of core field
    rawData (array): original data + forecast
    fitData (array): forecast fit + forecast
    highData {array, None}: high intervals
    lowData {array, None}: low intervals
    levelData {array, None}: level components for exponential smoothing
    trendData {array, None}: trend components for exponential smoothing
    seasonData {array, None}: seasonal components for exponential smoothing

    NOTES:
    (1) Input arrays should already have their masks applied.
    """

    candidateFieldList = []
    alias = UTILS.formatString("Original Data with Forecasts for {0}").format(varName)
    candidateField = SSDO.CandidateField("VALUE", "DOUBLE", data = rawData,
                                         alias = alias)
    candidateFieldList.append(candidateField)

    alias = UTILS.formatString("Fitted Data with Forecasts for {0}").format(varName)
    candidateField = SSDO.CandidateField("FITTED", "DOUBLE", data = fitData,
                                         alias = alias)
    candidateFieldList.append(candidateField)

    residual = rawData - fitData
    alias = "Residual (Original - Fitted)"
    candidateField = SSDO.CandidateField("RESIDUAL", "DOUBLE", data = residual,
                                            alias = alias)
    candidateFieldList.append(candidateField)

    addCIValues = True
    if highData is not None and lowData is not None and NUM.allclose(highData, lowData):
        addCIValues = False

    if highData is not None and addCIValues:
        alias = UTILS.formatString("Original Data with High Intervals for {0}").format(varName)
        candidateField = SSDO.CandidateField("HIGH", "DOUBLE", data = highData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Original Data with Low Intervals for {0}").format(varName)
        candidateField = SSDO.CandidateField("LOW", "DOUBLE", data = lowData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

    if levelData is not None:

        alias = UTILS.formatString("Level Component for {0}").format(varName)
        candidateField = SSDO.CandidateField("LEVEL", "DOUBLE", data = levelData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Trend Component for {0}").format(varName)
        candidateField = SSDO.CandidateField("TREND", "DOUBLE", data = trendData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        levelTrend = levelData + trendData
        alias = UTILS.formatString("Level + Trend Component for {0}").format(varName)
        candidateField = SSDO.CandidateField("LEVELTREND", "DOUBLE", data = levelTrend,
                                             alias = alias)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Season Component for {0}").format(varName)
        candidateField = SSDO.CandidateField("SEASON", "DOUBLE", data = seasonData,
                                             alias = alias)
        candidateFieldList.append(candidateField)

    return candidateFieldList

def createLocalOutlier3DFields(varName, indexData, pvData, binData, 
                               zData = None, lagData = None, varID = ""):
    """Returns core Hot-Spot Output Fields for 3D.(1)

    INPUTS:
    varName (str): name of core field
    indexData (array): hot-spot zscore
    pvData (array): p-values
    binData (array): hot-spot significance bin
    varID (str): number to append to field names

    NOTES:
    (1) Input arrays should already have their masks applied.
    """

    candidateFieldList = []
    alias = UTILS.formatString("Cluster Outlier Analysis Index ({0})").format(varName)
    candidateField = SSDO.CandidateField("CO_INDEX{0}".format(varID),
                                         "DOUBLE", data = indexData,
                                         alias = alias)
    candidateFieldList.append(candidateField)

    alias = UTILS.formatString("Cluster Outlier Analysis p-value ({0})").format(varName)
    candidateField = SSDO.CandidateField("CO_PVALUE{0}".format(varID),
                                         "DOUBLE", data = pvData,
                                         alias = alias)
    candidateFieldList.append(candidateField)

    alias = UTILS.formatString("Cluster Outlier Analysis Type ({0})").format(varName)
    candidateField = SSDO.CandidateField("CO_TYPE{0}".format(varID),
                                         "LONG", data = binData,
                                         alias = alias)
    candidateFieldList.append(candidateField)

    if zData is not None:
        alias = UTILS.formatString("Cluster Outlier Analysis Z Transformed ({0})").format(varName)
        candidateField = SSDO.CandidateField("CO_ZTRAN{0}".format(varID), "DOUBLE", data = zData,
                                             alias = alias, checkNullValues = True)
        candidateFieldList.append(candidateField)

        alias = UTILS.formatString("Cluster Outlier Analysis Spatial Lag ({0})").format(varName)
        candidateField = SSDO.CandidateField("CO_LAG{0}".format(varID), "DOUBLE", data = lagData,
                                             alias = alias, checkNullValues = True)
        candidateFieldList.append(candidateField)

    return candidateFieldList

def timeSeriesComplexity(inData, analysisMask = None):
    import struct as STRUCT
    import zlib as ZLIB

    shapeInfo = inData.shape
    cubeConvert = False
    if len(shapeInfo) == 3:
        #### SSCube ####
        cubeConvert = True
        t, rows, cols = shapeInfo
    else:
        #### SSPanel ####
        t, rows = shapeInfo

    if analysisMask is None:
        locations = NUM.arange(rows, dtype = NUM.int32)
    else:
        locations = NUM.array(NUM.nonzero(analysisMask)[0], dtype = NUM.int32)
    n = len(locations)

    if cubeConvert:
        #### SSCube ####
        data = NUM.zeros((n, t), dtype = float)
        for ind, location in enumerate(locations):
            row = location // cols
            col = location % cols
            data[ind] = inData[:, row, col]
    else:
        #### SSPanel (Transpose) ####
        data = inData.T

    cnt = n * 2
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007), 0, cnt, 1)

    DM = NUM.zeros((n, n))
    dataComplexity = []
    for series in data:
        l = list(series)
        o = STRUCT.pack('%sf' % len(l), *l)
        complexity = len(ZLIB.compress(o))
        dataComplexity.append(complexity)

        ARCPY.SetProgressorPosition()

    for i in range(n):
        complexI = dataComplexity[i]
        li = list(data[i])
        for j in range(i+1, n):
            complexJ = dataComplexity[j]
            lj = list(data[j])
            lj.extend(li)
            complexityCombo = len(ZLIB.compress(STRUCT.pack('%sf' % len(lj), *lj)))
            distance = (complexityCombo - min([complexI, complexJ]))/max([complexI, complexJ])
            DM[i, j] = distance
            DM[j, i] = distance

        ARCPY.SetProgressorPosition()

    return DM, locations

def remapTimeSeriesMeans(clusters, means, n):
    """ReMaps Averaged Time Series Based on Cluster Order.

    clusters (array, n): cluster ids in location id order
    means (array, nxt): average time-series for each cluster 
    n (int): number of output locations
    """

    corder = clusters[0:n] - 1
    return (means[corder]).T.ravel()

def runtimeTimeSeriesChecks(numClusters, numLocations):
    """Runtime error checks for Time Series Clustering on Space Time Cubes.

    numClusters (int): number of input clusters
    numLocations (int): number of valid locations in a space time cube
    """

    if numClusters is not None:
        if numLocations < 2:
            #### Must Have at Least 2 Valid Locations ####
            ARCPY.AddIDMessage("ERROR", 110216, 2)
            return False

        if numClusters >= numLocations:
            #### Must Have at Least 2 Valid Locations ####
            ARCPY.AddIDMessage("ERROR", 110190, numClusters, numLocations)
            return False

    return True

def runtimeFDAChecks(basisFamily, degree, interKnot, numBasis, numTime):
    """Runtime error checks for Time Series Clustering on Space Time Cubes.
     numClusters (int): number of input clusters
    numLocations (int): number of valid locations in a space time cube
    """
    if basisFamily == 'Fourier':
        if numBasis is not None:
            if numBasis % 2 == 0:
                ARCPY.AddMessage('Even number of basis functions provided. Rounding up the number of basis functions ')
            elif numBasis > numTime:
                ARCPY.AddMessage('Number of basis functions exceed number of time bins')
                return False
    elif basisFamily == 'Spline':
        if degree < 1:
            ARCPY.AddMessage('Invalid polynomial degree defined')
            return False
        if not isinstance(degree, int):
            ARCPY.AddMessage('Polynomial degree needs to be an integer')
            return False
        if interKnot < degree + 1:
            ARCPY.AddMessage('Small number of knots defined. Defaulting to degree + 1')
    return True

def fourierBasis(numBasis, numTime, numExtrapolate = None):
    """
    Utility function to generate Fourier Basis Functions for FDA decomposition

    Parameters
    ----------
    numBasis        : integer
                      Number of basis function
    numTime         : integer
                      Number of time-steps
    numExtrapolate  : integer
                      Number of time-steps to predict

    Notes
    -----
    * Will return odd number of functions, the first one is constant function.
    * The result basis functions will be evenly distributed along the period domain.

    Returns
    -------
    array
                    each row will be a basis function

    """

    if numExtrapolate is not None:
        x = NUM.arange(numTime + numExtrapolate)
        basisMat = NUM.zeros((numTime+ numExtrapolate, numBasis))
    else:
        x = NUM.arange(numTime)
        basisMat = NUM.zeros((numTime, numBasis))

    basisMat[:,0] += 1

    base =  int(numBasis / 2) + 1

    if basisMat.shape[1] % 2 == 0:
        base =  int(numBasis / 2)

    for i in range(1, base):
        theta = 2 * NUM.pi * i * x / numTime
        basisMat[:, (2 * i - 1)] = NUM.sin(theta)
        basisMat[:, 2 * i] = NUM.cos(theta)
    return basisMat

def splineBasis(numBasis, numTime, interKnots=None, degree=3):
    """
    Utility function to generate Spline Basis Functions for FDA decomposition

    Parameters
    ----------
    numBasis        : integer
                      Number of basis function
    numTime         : integer
                      Number of time-steps
    interKnots      : array, optional
                      Array of additional knots for b-spline definition (default value is None)
    degree          : integer, optional
                      Degree of polynomial fit (default value is 3)

    Returns
    -------
    tuple
                    (2 elements)
                    (array of basis functions, array of knots)

    """
    from scipy.interpolate import splev

    # Define Spline Knots
    knots = createSplineKnots(interKnots=interKnots, numTime=numTime, numBasis=numBasis, degree=degree)

    # Number of Spline Basis Functions
    # numBasis = len(knots)
    #
    numBasis = len(knots) - 4
    basisMat = NUM.empty((numTime, numBasis), dtype=float)
    x = NUM.arange(numTime)
    for i in range(numBasis):
        ## Switch Basis via Coefficient Parameterization
        coefs = NUM.zeros((numBasis,))
        coefs[i] = 1
        ## Get Spline Basis Function
        basisMat[:, i] = splev(x, (knots, coefs, degree))

    return basisMat, knots


def createSplineKnots(numBasis, numTime, interKnots=None, degree=3):
    """
    Utility function to create bound discontinuous, interior smooth spline knots

    Parameters
    ----------
    numBasis        : integer
                      Number of basis function
    numTime         : integer
                      Number of time-steps
    interKnots      : array, optional
                      Array of additional knots for b-spline definition (default value is None)
    degree          : integer, optional
                      Degree of polynomial fit (default value is 3)

    Notes
    -----
    * If numBasis is less than 10, it will be increased to 10
    * 2 knots will be inserted at 0, another 2 will be inserted at numTime-1, the rest knots will be evenly distributed along the time step range
    * If additional knots are provided through interKnots, it will inserted into current existing knot array

    Returns
    -------
    array
                    array of knots

    """
    order = degree + 1
    num = 0
    if numBasis is None:
        num = numTime
    elif numBasis < 10:
        num = 10
    else:
        num = numBasis
    knots = NUM.linspace(degree - 1, numTime - degree, num=num - order)
    knots = NUM.concatenate([NUM.repeat(0, order), knots, NUM.repeat(numTime - 1, order)])
    if interKnots is not None:
        if interKnots.min() < 2:
            ARCPY.AddWarning('Cannot define intermediate knots beyond first two time steps. Truncating...')
        if interKnots.max() > numTime - 1:
            ARCPY.AddWarning('Cannot define intermediate knots beyond last two time steps. Truncating...')
        knots = NUM.concatenate([knots, interKnots])
        knots.sort()
    l = []
    currentKnot = -1
    count = 0
    for k in knots:
        knot = int(k)
        if knot < 0 or knot >= numTime:
            continue
        if currentKnot != knot:
            currentKnot = knot
            count = 0
        count += 1
        if count <= order:
            l.append(knot)
    knots = NUM.array(l)

    return NUM.atleast_1d(NUM.asarray(knots, dtype=int))

    
def generateCubePopupChartField(cube, varName, theme=None, additionalData=None, prepareDataOnly=False):
    """
        prepare the data in this function, then use the `generateCubePopupChartFieldFromData`
        function to generate Pop-ups fields
        :param cube:
        :param varName:
        :param theme:
        :return:
        """
    import SSPanel as PANEL

    ARCPY.ResetProgressor()
    truncate = theme in ["FORECAST_RESULTS", "TIME_SERIES_OUTLIER_RESULTS"]
    if truncate:
        #### Truncate Variables to Separate Original/Fit and Forecast ####
        varString = "FORECAST_" + varName + "_{0}"
        truncateID = int(cube.dataset.begin_forecast_bin)

        #### Forecast Values ####
        forecastValues = []

        #### Fitted Values ####
        fitName = varString.format("FIT")
        fittedValues = []

        #### Confidence Intervals ####
        highName = varString.format("HIGH")
        lowName = varString.format("LOW")
        intervalValues = []

        #### Seasonality Values ####
        seasonalName = varString.format("SEASON")

        #### Outliers ####
        outlierName = varString.format("OUTLIER")

        #### Method Strings ####
        forecastMethodName = varString.format("METHOD")
        forecastMethodValues = []
        forecastMethodDict = dict()
        stC = cube.dataset.json_method_str
        if stC[-1] != "}":
            stC += "}"
        for key, value in JSON.loads(stC).items():
            forecastMethodDict[int(key)] = value
        forestBasedForecastMethods = set()
        for key, value in forecastMethodDict.items():
            if value.startswith("forest-based"):
                forestBasedForecastMethods.add(int(key))

    if theme == "TIME_SERIES_CLUSTERING_RESULTS":
        clusterIds = []

    T = cube.numTime
    cubeIsPanel = isinstance(cube, PANEL.SSPanel)
    if cubeIsPanel:
        #### Primary Data ####
        variable = cube.dataset.variables[varName]
        N = cube.numLocations
        rawValues = variable[:].data.T
        if truncate:
            rawValues = variable[0:truncateID, :].data.T
            forecastValues = variable[truncateID:, :].data.T

            fittedValues = cube.dataset.variables[fitName][0:truncateID, :].data.copy().T

            forecastMethodValues = cube.dataset.variables[forecastMethodName][:].data

            seasonValues = cube.dataset.variables[seasonalName][:].data

            lowValues = cube.dataset.variables[lowName][truncateID:, :].data.T
            highValues = cube.dataset.variables[highName][truncateID:, :].data.T

            if outlierName in cube.dataset.variables:
                forecastOutliers = cube.dataset.variables[outlierName][0:truncateID, :].data.copy().T
            else:
                forecastOutliers = NUM.zeros((N, T), dtype = NUM.int32)

            for i in range(N):
                if forecastMethodValues[i] in forestBasedForecastMethods:
                    season = abs(seasonValues[i])
                    fittedValues[i][0: season] = NUM.nan

        if theme == "TIME_SERIES_CLUSTERING_RESULTS":
            vb_additional = cube.dataset.variables["TSCLUST_" + varName + "_CLUSTER"]
            clusterIds = vb_additional[:].data

        if theme == "CHANGE_POINT_DETECTION_RESULTS":
            changePoints = cube.dataset.variables["CPD_" + varName + "_ISCP"][:].T
    else:
        variable = cube.dataset.variables[varName][:].data
        mask = cube.getAnalysisMask(varName).reshape(cube.numRows, cube.numCols)
        rawValues = variable[:, mask].T
        N = rawValues.shape[0]
        if truncate:
            rawValues = variable[:truncateID, mask].T

            forecastValues = variable[truncateID:, mask].T

            fittedValues = cube.dataset.variables[fitName][:].data[:truncateID, mask].copy().T

            forecastMethodValues = cube.dataset.variables[forecastMethodName][:].data[mask]

            seasonValues = cube.dataset.variables[seasonalName][:].data[mask]

            lowValues = cube.dataset.variables[lowName][:].data[truncateID:, mask].T
            highValues = cube.dataset.variables[highName][:].data[truncateID:, mask].T

            if outlierName in cube.dataset.variables:
                forecastOutliers = cube.dataset.variables[outlierName][:].data[:truncateID, mask].copy().T
            else:
                forecastOutliers = NUM.zeros((N, T), dtype = NUM.int32)

            for i in range(N):
                if forecastMethodValues[i] in forestBasedForecastMethods:
                    season = abs(seasonValues[i])
                    fittedValues[i][0: season] = NUM.nan
        if theme == "TIME_SERIES_CLUSTERING_RESULTS":
            vb_additional = cube.dataset.variables["TSCLUST_" + varName + "_CLUSTER"]
            clusterIds = vb_additional[:].data[mask]

        if theme == "CHANGE_POINT_DETECTION_RESULTS":
            variableCPD = cube.dataset.variables["CPD_" + varName + "_ISCP"][:].data
            changePoints = variableCPD[:, mask].T

    #### Pack the data into a dict for next tome use ####
    startTimes, endTimes = cube.getOutputTimeFieldInfo()
    if cube.isStartTime:
        t0 = startTimes[0]
    else:
        t0 = endTimes[0]
    data = {
        "rawValues": rawValues,
        "t0": t0.strftime("%Y/%m/%d %H:%M:%S"),
        "intv": str(cube.timeSize),
        "N": N,
        "T": T,
        "timeUnit": cube.timeUnit
    }
    if theme == "TIME_SERIES_CLUSTERING_RESULTS":
        data["clusterIds"] = clusterIds

    if theme == "CHANGE_POINT_DETECTION_RESULTS":
        data["changePoints"] = changePoints #cube.dataset.variables["CPD_" + varName + "_ISCP"][:].T
        # data["changeType"] = cube.dataset.change_point_type
        if cube.isPanel:
            dataCPT = cube.obtainValues("CPD_" + varName + "_CHTYPE", flatten=False)
            data["changeType"] = dataCPT[0]
        else:
            ### If we have different change types we need to apply the mask ###
            dataCPT = cube.obtainValues("CPD_" + varName + "_CHTYPE")
            data["changeType"] = dataCPT.ravel()[0]


        #data["changeType"] = dataCPT[0][0]

    if truncate:
        data["forecastValues"] = forecastValues
        data["forecastMethodValues"] = forecastMethodValues
        data["fittedValues"] = fittedValues
        data["intervalLowValues"] = lowValues
        data["intervalHighValues"] = highValues
        data["seasonValues"] = seasonValues
        data["forecastMethodDict"] = forecastMethodDict
        data["forecastOutliers"] = forecastOutliers

    if prepareDataOnly:
        return data, varName, theme, additionalData
    else:
        return generateCubePopupChartFieldFromData(data, varName, theme, additionalData=additionalData)


def generateCubePopupChartFieldFromData(data, varName, theme=None, additionalData=None, indStart=None, indEnd=None):
    """
    With provided dataset, this function generates the HTML Pop-up field for Feature Class
    :param data:
    :param varName:
    :param theme:
    :return:
    """
    import locale as LOCALE
    import json as JSON
    PRECISION = 4
    if theme == "CHANGE_POINT_DETECTION_RESULTS":
        template = """<html>
            <head>
              <meta charset = "utf-8">
              <script>
                var data = @@data;
                var lang = "@@lang";
                var rp = "file:///" + g_resourceFolder + "/";
                var st = document.createElement("script"); 
                st.type = "text/javascript";
                st.src = rp + "ArcToolbox/Scripts/Images/timeSeriesChangePointPlot.js";
                document.head.appendChild(st);
              </script>
            </head>
            <body></body>
            </html>"""
    else:
        template = """<html>
    <head>
      <meta charset = "utf-8">
      <script>
        var ts = @@ts,
            t0 = "@@t0",
            intv = @@interval,
            unit = "@@unit",
            vn = "@@varName",
            lang="@@lang",
            labels = @@labels,
            @@additionalParam
            rp = "file:///" + g_resourceFolder + "/";
          var st = document.createElement("script"); 
          st.type = "text/javascript";
          st.src = rp + "ArcToolbox/Scripts/Images/timeSeriesPlot.js";
          document.head.appendChild(st);
      </script>
    </head>
    <body></body>
    </html>"""

    labelDict = {
        "date": ARCPY.GetIDMessage(84970),
        "time": ARCPY.GetIDMessage(84971),
        "datetime": ARCPY.GetIDMessage(84972),
        "average": ARCPY.GetIDMessage(84967),
        "original": ARCPY.GetIDMessage(84968)
    }

    if theme == "CHANGE_POINT_DETECTION_RESULTS":
        labelDict["headerNote"] = ARCPY.GetIDMessage(220326)
        labelDict["chpts"] = ARCPY.GetIDMessage(220331)
        labelDict["segMeanVals"] = ARCPY.GetIDMessage(220332)
        labelDict["chpt"] = ARCPY.GetIDMessage(220339)
        labelDict["segMean"] = ARCPY.GetIDMessage(220340)
        if data["changeType"] == 0:
            labelDict["changeStr"] = ARCPY.GetIDMessage(220327)
        elif data["changeType"] == 1:
            labelDict["globalMean"] = ARCPY.GetIDMessage(220321)
            labelDict["changeStr"] = ARCPY.GetIDMessage(220328)
            labelDict["footNote"] = ARCPY.GetIDMessage(220330)
            labelDict["segUpperBounds"] = ARCPY.GetIDMessage(220333)
            labelDict["segLowerBounds"] = ARCPY.GetIDMessage(220334)
            labelDict["globUpperBounds"] = ARCPY.GetIDMessage(220335)
            labelDict["segArea"] = ARCPY.GetIDMessage(220336)
            labelDict["globLowerBounds"] = ARCPY.GetIDMessage(220337)
            labelDict["segUpper"] = ARCPY.GetIDMessage(220341)
            labelDict["segLower"] = ARCPY.GetIDMessage(220342)
            labelDict["globUpper"] = ARCPY.GetIDMessage(220343)
            labelDict["globLower"] = ARCPY.GetIDMessage(220344)
        elif data["changeType"] == 2:
            labelDict["changeStr"] = ARCPY.GetIDMessage(220322)
            labelDict["segLine"] = ARCPY.GetIDMessage(220338)
            labelDict["segSlope"] = ARCPY.GetIDMessage(220323)
            labelDict["segIntercept"] = ARCPY.GetIDMessage(220324)
        else:
            labelDict["changeStr"] = ARCPY.GetIDMessage(220329)

    t0 = data["t0"]
    intv = data["intv"]
    N = data["N"]
    timeUnit = data["timeUnit"]
    truncate = theme in ["FORECAST_RESULTS", "TIME_SERIES_OUTLIER_RESULTS"]
    rawValues = data["rawValues"]
    hasOutlierResult = False

    if theme == "TIME_SERIES_CLUSTERING_RESULTS":
        template = template.replace("@@additionalParam",
                                    """cid = @@cid,
                                    g_mean = @@g_mean,""")
        clusterIds = data["clusterIds"]
        uniqueCids = NUM.unique(clusterIds)
        mean_centers = {}
        for cid in uniqueCids:
            mask = NUM.where(data["clusterIds"] == cid)[0]
            mean_centers[cid] = str([UTILS.roundValue(d, PRECISION) for d in rawValues[mask].mean(axis=0).tolist()])
    elif truncate:
        #### Get Confidence Intervals ####
        template = template.replace("@@additionalParam",
                                    """forecast = @@forecast, 
        fit = @@fit, 
        conf_int = @@conf_int,
        F_M = "@@F_M",
        CC = @@CC,
        outliers=@@outliers,""")
        labelDict["forecasted"] = ARCPY.GetIDMessage(84969)
        labelDict["fit"] = ARCPY.GetIDMessage(84975)
        labelDict["conf_int"] = ARCPY.GetIDMessage(84976)
        labelDict["FSStr"] = ARCPY.GetIDMessage(220040)
        labelDict["residual"] = ARCPY.GetIDMessage(84079)
        labelDict["otl_pos"] = ARCPY.GetIDMessage(220092)
        labelDict["otl_neg"] = ARCPY.GetIDMessage(220093)
        forecastValues = data["forecastValues"]
        fittedValues = data["fittedValues"]
        intervalLowValues = data["intervalLowValues"]
        intervalHighValues = data["intervalHighValues"]
        seasonValues = data["seasonValues"]
        forecastMethodValues = data["forecastMethodValues"]
        forecastMethodDict = data["forecastMethodDict"]
        forecastOutliers = data["forecastOutliers"]
        hasCompareCandidates = False
        hasOutlierResult = True

        #### prepare the compare candidates ####
        if isinstance(additionalData, dict) and "compareCandidates" in additionalData:
            hasCompareCandidates = True
            compareCandidates = additionalData["compareCandidates"]
            useRMSEValidation = compareCandidates["useValidation"]
            cc_forecastCollection = compareCandidates["forecastCollection"]
            cc_fitCollection = compareCandidates["fitCollection"]
            cc_seasonCollection = compareCandidates["seasonCollection"]
            cc_methodCollection = compareCandidates["methodCollection"]
            cc_rmseCollection = compareCandidates["rmseCollection"]
            cc_bestSolutionIds = compareCandidates["selectedSolutionIds"]
            cc_intvConfLowCollection = compareCandidates["intvLowCollection"]
            cc_intvConfHighCollection = compareCandidates["intvHighCollection"]
            cc_allMethodNameAlternative = compareCandidates["allMethodNameAlternative"]

    else:
        template = template.replace("@@additionalParam", "")

    resourcePath = OS.path.dirname(OS.path.dirname(OS.path.dirname(__file__)))

    #### Add locale information ####
    lang, code = LOCALE.getdefaultlocale()
    langIds = [lang[0:2], lang.replace('_', "-")]
    selectedLang = 'en'
    for langId in langIds:
        localeJSPath = OS.path.join(resourcePath,
                                    "Charts\\scripts\\culture",
                                    "wijmo.culture.@c.min.js".replace('@c', langId))
        if OS.path.isfile(localeJSPath):
            selectedLang = langId
            break
    template = template.replace("@@lang", selectedLang)
    column = []
    maxLength = 0

    labelDictStr = str(labelDict)

    if indStart is not None and indEnd is not None:
        generateField = False
        indStart = max(indStart, 0)
        indEnd = min(indEnd, N)
    else:
        generateField = True
        indStart = 0
        indEnd = N
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84997), 0, N, 1)
    ARCPY.SetProgressorPosition(indStart)
    for ind in range(indStart, indEnd):
        ts = [UTILS.roundValue(d, PRECISION) for d in rawValues[ind].tolist()]
        if theme == "CHANGE_POINT_DETECTION_RESULTS":
            d = {
                "ts": ts,
                "t0": t0,
                "vn": varName,
                "intv": intv,
                "unit": timeUnit,
                "labels": labelDict,
                "cps": NUM.nonzero(data["changePoints"][ind])[0].tolist(),
                "cpt": str(data["changeType"])
            }
            s = template.replace("@@data", JSON.dumps(d))
        else:
            ts = str(ts)
            if truncate:
                cc = "[]"
                if hasCompareCandidates:
                    cc = []
                    bestForecastId = cc_bestSolutionIds[ind]
                    existingMethod = set()
                    for ind_data in range(len(cc_forecastCollection)):
                        season = abs(int(cc_seasonCollection[ind_data][ind]))
                        method = cc_methodCollection[ind_data][ind]
                        methodOrigin = method
                        if method in existingMethod:
                            continue
                        else:
                            existingMethod.add(method)

                        if method.startswith("forest-based") and method.find("time_window:auto_detect") > 0:
                            method = method.replace("time_window:auto_detect", "time_window:auto_detect({})".format(season))
                            method = method.replace("forest-based", ARCPY.GetIDMessage(220031))

                        if method.startswith("exponential smoothing") and method.find("seasonality:auto_detect") > 0:
                            method = method.replace("seasonality:auto_detect", "seasonality:auto_detect({})".format(season))
                            method = method.replace("exponential smoothing", ARCPY.GetIDMessage(220032))
                        else:
                            if method in evalType2Label:
                                method = evalType2Label[method]

                        candidate = {
                            "forecast": [UTILS.roundValue(d, PRECISION)
                                         for d in cc_forecastCollection[ind_data][:, ind].tolist()],
                            "fit": [UTILS.roundValue(d, PRECISION)
                                    for d in cc_fitCollection[ind_data][:, ind].tolist()],
                            "conf_int": [],
                            "season": season,
                            "method": method,
                            "rmse": cc_rmseCollection[ind_data][ind],
                        }
                        if candidate["method"].startswith("forest-based"):
                            candidate["fit"] = candidate["fit"][abs(candidate["season"]): ]
                        low = cc_intvConfLowCollection[ind_data][:, ind].tolist()
                        if not NUM.isnan(low[0]):
                            high = cc_intvConfHighCollection[ind_data][:, ind].tolist()
                            candidate["conf_int"] = [[UTILS.roundValue(low[i], 4), UTILS.roundValue(high[i], 4)]
                                                     for i in range(len(low))]

                        if useRMSEValidation:
                            candidate["rmse_name"] = "Validation RMSE"
                        else:
                            candidate["rmse_name"] = "RMSE"
                        if ind_data == bestForecastId:
                            candidate["best"] = True
                        else:
                            candidate["best"] = False
                        if methodOrigin in cc_allMethodNameAlternative:
                            candidate["alias"] = cc_allMethodNameAlternative[methodOrigin]["alias"]

                        cc.append(candidate)

                    cc = JSON.dumps(cc)

                    fitOut = "[]"
                    predOut = "[]"
                    intOut = "[]"
                else:
                    fitOut = str([UTILS.roundValue(d, 4) for d in fittedValues[ind].tolist() if not NUM.isnan(d)])
                    predOut = str([UTILS.roundValue(d, 4) for d in forecastValues[ind].tolist()])
                    if NUM.isnan(intervalLowValues[ind][0]):
                        intOut = "[]"
                    else:
                        low = [UTILS.roundValue(v, 4) for v in intervalLowValues[ind].tolist()]
                        high = [UTILS.roundValue(v, 4) for v in intervalHighValues[ind].tolist()]
                        intOut = str([[low[i], high[i]] for i in range(len(low))])
                        if low == high:
                            intOut = "[]"
                        

                if theme == "TIME_SERIES_OUTLIER_RESULTS" and hasOutlierResult:
                    outliers = str(NUM.nonzero(forecastOutliers[ind])[0].tolist())

                else:
                    outliers = "[]"

            else:
                fitOut = "[]"
                predOut = "[]"
                intOut = "[]"
                cc = "[]"
                outliers = "[]"

            # t_mean = self.seriseMeans[ind]
            # t_median = self.seriseMedians[ind]
            s = template.replace("@@ts", ts) \
                .replace("@@t0", t0) \
                .replace("@@varName", varName) \
                .replace("@@interval", intv) \
                .replace("@@unit", timeUnit) \
                .replace("@@labels", labelDictStr) \
                .replace("@@forecast", predOut) \
                .replace("@@conf_int", intOut) \
                .replace("@@fit", fitOut)\
                .replace("@@outliers", outliers)
            if theme == "TIME_SERIES_CLUSTERING_RESULTS":
                s = s.replace("@@g_mean", mean_centers[clusterIds[ind]]) \
                    .replace("@@cid", str(clusterIds[ind]))
            if theme in ["FORECAST_RESULTS", "TIME_SERIES_OUTLIER_RESULTS"]:
                season = abs(seasonValues[ind])
                method = forecastMethodDict[forecastMethodValues[ind]]

                if method.startswith("forest-based") and method.find("time_window:auto_detect") > 0:
                    method = method.replace("time_window:auto_detect", "time_window:auto_detect({})".format(season))
                    method = method.replace("forest-based", ARCPY.GetIDMessage(220031))

                if method.startswith("exponential smoothing") and method.find("seasonality:auto_detect") > 0:
                    method = method.replace("seasonality:auto_detect", "seasonality:auto_detect({})".format(season))
                    method = method.replace("exponential smoothing", ARCPY.GetIDMessage(220032))
                else:
                    if method in evalType2Label:
                        method = evalType2Label[method]

                s = s.replace("@@F_M", method) \
                    .replace("@@CC", cc)

        if len(s) > maxLength:
            maxLength = len(s)
        column.append(s)
        ARCPY.SetProgressorPosition()

    maxLength += 10

    if generateField:
        textArray = None
        try:
            textArray = NUM.array(column, dtype="U" + str(maxLength))
        except:
            ARCPY.AddIDMessage("ERROR", 120273)
            raise SystemExit()
        candidateField = SSDO.CandidateField("HTML_CHART", "TEXT",
                                             textArray,
                                             alias="Time Series HTML Pop-Up",
                                             length=maxLength)
        return candidateField
    else:
        return column, maxLength

def createStringVariable(dataset, varName, varValue, maxSize):
    """
    Function to create new variable in cube

    INPUT:
        dataset (obj): ncFile dataset object
        varName (str): New variable name
        varValue (NUM Arr): 2D/ 3D NumPy Arrays with variable values
        maxSize (int): Max String Size
    OUTPUT:
        new variable added to the cube

    """

    dataset.createDimension('labelDim', len(varValue))
    data = dataset.createVariable(varName, str, ('labelDim',))
    data[:] = varValue

def createVariable(dataset, varName, varValue, spatialRef, 
                   dimType = 3, dType = 'f8', maskName = None, isPanel = False):
    """
    Independent function to create new variable in cube
    INPUT:
        dataset (obj): netcdf4 dataset object
        varName (str): New variable name
        varValue (NUM Arr): 2D/ 3D NumPy Arrays with variable values
        dimType {int}: Variable dimensions, default is 3
        dType {str}: Variable dtype, default is 'f8'
        maskName {str}: Mask name associated with this variable
        isPanel {bool}: Check type
    OUTPUT:
        new variable added to the cube
    """

    if isPanel:
        if dimType == 1:
            dim = ('locations')
        else:
            dim = ('time', 'locations')

        var = dataset.createVariable(varName, dType, dim)
        var.long_name = varName
        var.standard_name = varName
        var.grid_mapping = 'projection'
        var.esri_pe_string = spatialRef.exportToString()
        if 'f' in dType:
            missingValue = -9999.
        else:
            missingValue = -9999
        var.missing_value = missingValue
        var.type = 'variable'
        if dimType == 1:
            var.coordinates = "lat lon"
        else:
            var.coordinates = "time lat lon"

        if maskName is not None:
            var.setncattr('mask', maskName)

        var[:] = varValue

        return


    if dimType == 2:
        dim = ('y', 'x')
    else:
        dim = ('time', 'y', 'x')
    var = dataset.createVariable(varName, dType, dim)
    var.long_name = varName
    var.standard_name = varName
    var.grid_mapping = 'projection'
    var.esri_pe_string = spatialRef.exportToString()
    if 'f' in dType:
        missingValue = -9999.
    else:
        missingValue = -9999
    var.missing_value = missingValue
    var.type = 'variable'
    if dimType == 2:
        var.coordinates = "lat lon"
    else:
        var.coordinates = "time lat lon"

    if maskName is not None:
        var.setncattr('mask',maskName)

    var[:] = varValue

def addTimeVariableInfo(timeVar, timeSize, startTimeStr, value):
    """
    Function to create time variable and assign values
    INPUT:
        startTimeStr (str): dtString for start time of first time bin
        value (NUM Arr): 1D NumPy Array represents seconds
    OUTPUT:
        add time variable to cube
    """
    timeVar.long_name = 'time'
    timeVar.standard_name = 'time'
    timeVar.units =  'seconds since '+ startTimeStr
    timeVar.calendar = 'gregorian'
    timeVar._CoordinateAxisType = 'Time'
    timeVar._ChunkSize = timeSize
    timeVar.type = 'dimension'
    timeVar[:] = value


class ForecastMetrics(object):
    def __init__(self):
        pass

    def calculateMetrics(self):
        ''' 
        Utility function to calculate forecast metrics
        '''
        data = NUM.array(self.data)
        forecast = NUM.array(self.fitForecast)
        
        e = data - forecast[0:self.numTime]
        s = data + forecast[0:self.numTime]
        p_e = e / data * 100
        naivePred = -NUM.diff(data, axis = 0)
        r_e = (e[1:] / naivePred)
        q = e / ( NUM.abs(naivePred).mean(axis = 0) )

        ## Absolute Error Metrics
        self.mse = (e**2).mean(axis=0) ## Mean Square Error
        self.rmse = NUM.sqrt(self.mse) ## Root Mean Square Error
        self.mae = NUM.abs(e).mean(axis=0) ## Mean Absolute Error
        self.mdae = NUM.median(NUM.abs(e), axis = 0) ## Median Absolute Error

        ## Percentage Error Metrics
        self.rmspq = NUM.sqrt((p_e**2).mean(axis=0)) ## Root Mean Square Percentage Error
        self.rmdspq = NUM.sqrt(NUM.median(p_e**2, axis=0)) ## Root Median Square Percentage Error
        self.mape = NUM.abs(p_e).mean(axis=0) ## Mean Absolute Percentage Error
        self.mdape = NUM.median(NUM.abs(p_e) ) ## Median Absolute Percentage Error
        self.smape = ( 200 * NUM.abs(e) / s ).mean(axis=0) ## Symmetric Mean Absolute Percentage Error
        self.smdape = NUM.median( ( 200 * NUM.abs(e) / s ), axis=0 ) ##  Symmetric Median Absolute Percentage Error

        ## Relative Error Metrics
        self.mrae = NUM.abs(r_e).mean(axis=0) ## Mean Relative Absolute Error
        self.mdrae = NUM.median( NUM.abs(r_e), axis=0 ) ## Median Relative Absolute Error
        self.gmrae = SCPS.gmean(NUM.abs(r_e), axis=0) ## Geometric Relative Absolute Error

        ## Scaled Error Metrics
        self.mase = NUM.abs(q).mean(axis=0) ## Mean Absolute Scaled Errors
        self.mdase = NUM.median( NUM.abs(q), axis=0 ) ## Median Absolute Scaled Errors
        self.rmase = NUM.sqrt(self.mase) ## Root Mean Absolute Scaled Errors

    def generateMetricReport(self):
        cols = [ ARCPY.GetIDMessage(i) for i in [84657, 84271, 84272, 84261, 84414, 84262] ]
        rows = [cols]
        rows.append(["RMSE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mse) ])
        rows.append(["RRMSE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.rmse) ])
        rows.append(["MAE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mae) ])
        rows.append(["MDAE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mdae) ])

        rows.append(["RMSPQ"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.rmspq) ])
        rows.append(["RMDSPQ"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.rmdspq) ])
        rows.append(["MAPE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mape) ])
        rows.append(["MDAPE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mdape) ])
        rows.append(["SMAPE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.smape) ])
        rows.append(["SMDAPE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.smdape) ])

        rows.append(["MRAE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mrae) ])
        rows.append(["MDRAE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mdrae) ])
        rows.append(["GMRAE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.gmrae) ])

        rows.append(["MASE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mase) ])
        rows.append(["MDASE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.mdase) ])
        rows.append(["RMASE"] + [ UTILS.formatValue(i, "%0.2f") for i in UTILS.arraySummaryStats(self.rmase) ])

        return rows

class RandomForestForecast(object):
    def __init__(self, data, addTime, validationSize = 0, neighbors = None, typeSampling = "ALL",
                 outlierOption = None, outlierConfidence = "90%", outlierTestSize = None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.forecastType = 0
        self.numTime, self.numLocations = data.shape
        self.forecastTime = self.numTime + self.addTime

        #### Resolve Outlier Options ####
        if outlierOption is not None:
            if self.outlierConfidence in confidenceStr2Alpha:
                self.outlierAlpha = confidenceStr2Alpha[self.outlierConfidence]
            else:
                self.outlierAlpha = .1

            if self.outlierTestSize is None:
                self.outlierTestSize = max(1, int(self.numTime * .05))

        #### Create Output Arrays ####
        self.rawForecast = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.lowIntervals = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.highIntervals = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.fitForecast = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.seasonInt = NUM.zeros(self.numLocations, dtype = NUM.int32)
        self.infoParamNames = ""
        self.seed = 0

        self.doValidation = False
        if validationSize:
            self.doValidation = True

    def linearDetrend(self, data):
        size = data.shape[0]
        matA = NUM.ones((size, 2), dtype = float)
        matA[:,0] = NUM.arange(size)
        coefs = NUM.linalg.lstsq(matA, data, rcond = -1)
        slopeIntercepts = NUM.round(coefs[0], 8)

        if size == self.numTime:
            #### Detrend including addTime ####
            extend = NUM.tile(NUM.arange(self.forecastTime),self.numLocations).reshape(self.numLocations,self.forecastTime)
        else:
            #### Detrend for Test Size ####
            extend = NUM.tile(NUM.arange(self.numTime), self.numLocations).reshape(self.numLocations, self.numTime)

        allYHat = extend.T*slopeIntercepts[0]+slopeIntercepts[1]
        yhat = allYHat[0:size,]
        resid = data - allYHat[0:size,]
        return resid, yhat, allYHat

    def findFrequencies(self, data):
        periods = []
        import warnings as WARNINGS
        with WARNINGS.catch_warnings():
            WARNINGS.simplefilter("ignore")        
            for i in NUM.arange(data.shape[1]):
                periods.append(TS.findfrequency(data.T[i]))
        return periods

    def __filterZero(self,listArr, mask):
        if mask.sum() > 0:
            lElem = []
            for arr in listArr:
                lElem.append(arr[mask].copy())
            return lElem
        else:
            return listArr
    def outputImportanceTable(self, outputTable, otherVariables, locIds = None):
        """Create Importance Table """

        if self.importanceInformation is not None:
            freq, ind, values, location  = self.importanceInformation

            unq = NUM.unique(location)
            newInd = NUM.zeros(len(ind), dtype = NUM.int32)
            labels = []
            n =  len(unq)
            
            if len(freq) != len(unq):
                n =  len(unq)

            for i in NUM.arange(n):
                mask = location == unq[i]
                ids = NUM.asarray(ind[mask]/NUM.abs(freq[i]), dtype= NUM.int32)
                item = NUM.abs(freq[i]) - NUM.asarray(ind[mask]%NUM.abs(freq[i]), dtype= NUM.int32)
                newInd[mask]= item

                for j in NUM.arange(len(ids)):
                    labels.append(otherVariables[ids[j]])

        container = UTILS.DataContainer()
        msk = values >= 0
        
        if self.useOneModel == 0:
            arrs = self.__filterZero([location, NUM.array(labels), newInd, values],msk)
            container.generateOutput(outputTable, arrs, 
                                 ["LOCATION",    "VARIABLE", "LAG",      "IMPORTANCE"],
                                 [ARCPY.GetIDMessage(220511), ARCPY.GetIDMessage(84068), 
                                  ARCPY.GetIDMessage(220512), ARCPY.GetIDMessage(220510)])
        elif self.useOneModel == 1:
            arrs = self.__filterZero([ NUM.array(labels), newInd, values],msk)
            container.generateOutput(outputTable, arrs, 
                                 ["VARIABLE", "LAG",      "IMPORTANCE"],
                                 [ARCPY.GetIDMessage(84068),  ARCPY.GetIDMessage(220512),
                                  ARCPY.GetIDMessage(220510)])
        elif self.useOneModel == 2:
            arrs = self.__filterZero([location, NUM.array(labels), newInd, values],msk)        
            container.generateOutput(outputTable, arrs, 
                                 ["CLUSTER_ID", "VARIABLE", "LAG",      "IMPORTANCE"],
                                 [ARCPY.GetIDMessage(84790), ARCPY.GetIDMessage(84068),
                                  ARCPY.GetIDMessage(220512), ARCPY.GetIDMessage(220510)])
            
        if self.useOneModel == 1:
            fields = {"LAG": "LAG", "IMPORTANCE": "IMPORTANCE", "VARIABLE": "VARIABLE"}
            fields = UTILS.honorCaseSDE(outputTable, fields)

            charName = ARCPY.GetIDMessage(220294)
            chart = ARCPY.Chart(charName )
            chart.type = "bar"
            chart.title = charName
            chart.bar.aggregation = "MEAN"
            chart.xAxis.field = fields["LAG"]
            chart.xAxis.title = ARCPY.GetIDMessage(220295)
            chart.yAxis.field =  fields["IMPORTANCE"]
            chart.yAxis.title =  ARCPY.GetIDMessage(220510)
            
            if not self.univariate:
                chart.bar.splitCategory =  fields["VARIABLE"]
                
            self.chartImportance = chart
        elif self.useOneModel == 2:
            fields = {"LAG": "LAG", "IMPORTANCE": "IMPORTANCE", "VARIABLE": "VARIABLE", "CLUSTER_ID": "CLUSTER_ID"}
            fields = UTILS.honorCaseSDE(outputTable, fields)
            charName = ARCPY.GetIDMessage(220294)
            chart = ARCPY.Chart(charName )
            chart.type = "bar"
            chart.title = charName
            chart.bar.aggregation = "MEAN"
            chart.xAxis.field = fields["LAG"]
            chart.xAxis.title = ARCPY.GetIDMessage(220295)
            chart.yAxis.field = fields["IMPORTANCE"]
            chart.yAxis.title = ARCPY.GetIDMessage(220510)
                
            if self.univariate:
                chart.bar.splitCategory = fields["CLUSTER_ID"]
                chart.bar.multiSeriesDisplay = "Grid"
                self.chartImportance = chart
            else:
                chart.bar.splitCategory = fields["VARIABLE"]

        else:
            fields = {"LAG": "LAG", "VARIABLE": "VARIABLE"}
            fields = UTILS.honorCaseSDE(outputTable, fields)

            charName = ARCPY.GetIDMessage(220294)
            chart = ARCPY.Chart(charName )
            chart.type = "bar"
            chart.title = charName
            chart.bar.aggregation = "COUNT"
            chart.xAxis.field = fields["LAG"]
            chart.xAxis.title = ARCPY.GetIDMessage(220295)
            
            if not self.univariate:
                chart.bar.splitCategory = fields["VARIABLE"]

            if not self.lagIsConstant:
                msg = ARCPY.GetIDMessage(220296) +" "+ ARCPY.GetIDMessage(220503)
            else:
                msg = ARCPY.GetIDMessage(220296)
            
            chart.description = msg
            self.chartImportance = chart

    def storeValues(self, **arg):

        if dbgInput is not None:
            fileOutput = fr"{dbgInput}\test2"
            fileOutput1 = fr"NUM.load(r'{dbgInput}"+r"\test{0}.npy')"
            fileOutputs = fr"{dbgInput}"+r"\test{0}.npy"
            
            f = open(fileOutput,"w")
            print("import arcgisscripting as ARC", file= f)
            print("import numpy as NUM", file= f)
            print("ARC._ss.multivariate_time_series_forest(", file=f )
            id= 0
            for e in arg.items():
                if type(e[1]) == NUM.ndarray:
                    NUM.save(fileOutputs.format(id), e[1])
                    print(e[0],"=", fileOutput1.format(id), ",", file= f)
                    id+=1

                if type(e[1]) in [int, float, str, bool ]:
                    print(e[0],"=", fr"{e[1]}", ",", file= f)

                if e[1] is None:
                    print(e[0],"=", "None", ",", file= f)

                if type(e[1]) == list:
                    st =[]
                    for ne in e[1]:
                        NUM.save(fileOutputs.format(id), ne)
                        st.append(fileOutput1.format(id))
                        id+=1 
                    print(e[0],"=[",",".join(st) , "],", file= f)
            print("import SSCubeUtilities as SC", file= f)
            print("SC.RandomForestForecast.viewResults(t, info, testSize, steps2Predict)", file=f)
            f.close()

        return arg

    @staticmethod
    def viewResults(t, info, testSize, addTime):
        """ View results """

        locs = info.shape[1]
        steps = info.shape[0]
        steps2Predict = addTime

        import matplotlib.pyplot as plt
        n= steps + steps2Predict
        axT = NUM.arange(testSize) +(steps-testSize)
        r = info 

        def testInfo(id, v, x,  type = 'r-'):
            yv = v.T[id]
            plt.plot(x, yv, type)
            plt.title(str(id))

        def test(id, x, type = 'b-'):
            yv = x.T[id]
            xvr = NUM.arange(len(yv))
            plt.plot(xvr, yv, type)

        x0 = t[0].reshape(n,locs)
        x1 = t[1].reshape(n,locs)
        x2 = t[2].reshape(n,locs)
        ti = t[3].reshape(testSize,locs)

        for i in NUM.arange(locs):
            id = i
            testInfo(id,ti,axT)
            test(id, x0, "-")
            test(id, x1,"-")
            test(id, x2,"-")
            test(id, r)
            plt.show()
        
    def forecast(self, lagSize = None, detrend = True, forestParameters = None, 
                useSameLagForTesting = False, 
                thresholdClass = 10000000, predictMode = False,
                implementation = "NEW", otherData = None, 
                xy = None,
                percentange_importance = 0,
                recalculate_model = False, max_k = 10, 
                useOneModel = "BY_LOCATION",
                zoneData = None,
                locations = None,
                listOtherVariables = None):
        """ Predict using different options in RF
        INPUT:
            lagSize (int/None): If value is provided the periodicity is not calculated
            detrend (bool): Detrend each Time series
            forestParameters {dict}: Change random forest parameters
            useSameLagForTesting {bool}: Apply the same lag for predicting and testing (only if lagSize is None)
            thresholdClass {int}: Use this threshold to execute a regression or classification
            predictMode {bool}: True -> Use trained prediction to predict next steps, False-> use original values to predict next steps
            implementation (string) -> "VALUE" -> cpp using just X->lags
                                       "CHANGE"  -> cpp using X Lags and   Lineal Least Squared Errors as Y
        """

        typeMode = {"BY_LOCATION": 0, 
                    "UNIQUE_MODEL":1,
                    "BY_CLUSTER":2,
                    "BY_ZONES": 3}
        
        useOneModel = typeMode[useOneModel] 
        self.clustersIds = None
        self.importanceInformation  = None
        self.chartImportance = None
        self.otherPredictions =[]
        
        if locations is None:
            locations = NUM.arange(self.numLocations, dtype= NUM.int32)
        
        import time as TIME
        #### Get Seed ####
        maxSeedValue = 100000
        seed = UTILS.getRandomSeed()
        if seed == 0:
            NUM.random.seed(int(TIME.time()))
            seed = int(NUM.random.randint(maxSeedValue ))
        #ARCPY.AddWarning(str(seed))
        self.seed = seed
        if lagSize is None:
            self.timeWindowInfo = "time_window:auto_detect"
        else:
            self.timeWindowInfo = "time_window:user_defined({})".format(lagSize)
        numTrees = 100
        leafSize = 5
        sampleSize = -1
        maxLevel = self.numTime
        header = ""
        testSize = self.validationSize
        uncertainty = 1
        num_threads = UTILS.getNumberOfThreadsDefault()
        sampleSize = -1

        if forestParameters is not None:
            if "numTrees" in forestParameters:
                numTrees = forestParameters["numTrees"]
            if "leafSize" in forestParameters:
                leafSize = forestParameters["leafSize"]
            if  "maxLevel" in forestParameters:
                maxLevel = forestParameters["maxLevel"]
            if "uncertainty" in forestParameters:
                uncertainty = forestParameters["uncertainty"]  
            if "sampleSize" in forestParameters:
                sampleSize = forestParameters["sampleSize"]

        #### Get The number of thread - default 50% cpu capacity ####
        numThreads  = UTILS.getNumberOfThreadsDefault()

        #### Define testSize ####
        testSizeAux = self.validationSize
        if testSizeAux is None:
            testSizeAux = 0
            
        if testSizeAux < 2:
            ARCPY.AddIDMessage("WARNING",110479)

        if implementation in ["VALUE", "RESIDUAL"]:

            #### Type of RF option 0-> local, 1-> all neighbors, 2-> cone neighbors ###
            typeSpatialConfiguration = 0

            #### Check if neighbor object is set ###
            if self.neighbors is not None:
                if self.typeSampling == "ALL":
                    #### Use all neighbors ####
                    typeSpatialConfiguration = 1
                elif self.typeSampling == "CONE" :
                    #### Use cone approach ###
                    typeSpatialConfiguration = 2

            predictionTest = None
            output = None

            #### Select Mode ####
            #### Prediction is executed using X-lag and Y next step###
            internalMethodEval = 0

            if implementation == "RESIDUAL":
                #### Prediction is executed using X-lag and Y as the error of ###
                #### linear least squared next step ###
                internalMethodEval = 2

            info = self.data
            frq = None
            frqTest = None
            yTrend =  None
            yTrendTest = None

            #### Calculate Detrend Information ####
            if detrend:
                info, yhat, yTrend = self.linearDetrend(self.data)

            self.info = info
            self.lagIsConstant = True
            
            #### Define frequences ####
            if lagSize is None and useOneModel == 0:
                frq = NUM.array(self.findFrequencies(self.data), dtype = NUM.int32)
                if testSize:
                    frqTest = NUM.array(self.findFrequencies(self.data[:-testSize:]), dtype = NUM.int32)

                if len(set(frq)) > 1:
                    self.lagIsConstant = False
                lagSize = 0

            if useOneModel > 0:
                if lagSize is None:
                    lagSize = int(self.numTime*0.25)
                    self.timeWindowInfo = "time_window:{0}".format(lagSize)
                    
                    
            self.lagSize = lagSize  
            enableOneModelWithOneVariable  = False

            if otherData is None:
                #### BY_Location ####
                if useOneModel == 0:
                    args = self.storeValues(
                                            x = info,
                                            type_run = typeSpatialConfiguration,
                                            frequence = frq,
                                            frequence_test = frqTest,
                                            seed = seed,
                                            steps_to_predict = self.addTime,
                                            neighbors_obj = self.neighbors,
                                            threshold_predict_mode = thresholdClass,
                                            number_trees = numTrees,
                                            test_size = testSizeAux,
                                            eval_pend = internalMethodEval,
                                            lag = lagSize,
                                            sample_size = sampleSize,
                                            level = maxLevel,
                                            num_threads = numThreads,
                                            locations = locations,
                                            index = -1)
                    #### Main predictor function ####
                    output = ARC._ss.time_series_forest(**args)
                else:
                    #### Regional/ Entire One model ####
                    enableOneModelWithOneVariable = True

                    args = self.storeValues(
                                                    x = info,
                                                    type_run = typeSpatialConfiguration,
                                                    frequence = None,
                                                    frequence_test = None,
                                                    seed = seed,
                                                    steps_to_predict = self.addTime,
                                                    neighbors_obj = self.neighbors,
                                                    threshold_predict_mode = thresholdClass,
                                                    number_trees = numTrees,
                                                    test_size = testSizeAux,
                                                    eval_pend = 0,
                                                    lag = lagSize,
                                                    sample_size = sampleSize,
                                                    level = maxLevel,
                                                    num_threads = numThreads,
                                                    list_xs = None,
                                                    list_tests = None,
                                                    xy_locations = xy,
                                                    percentange_importance = percentange_importance,
                                                    recalculate_model = recalculate_model,
                                                    max_k = max_k,
                                                    use_one_model = useOneModel,
                                                    zones = zoneData,
                                                    locations = locations)
                    if useOneModel == 2 and zoneData is not None:
                        self.clustersIds = NUM.asarray(NUM.unique(zoneData), dtype = NUM.int32)
                    #### Main predictor function ####
                    output = ARC._ss.multivariate_time_series_forest(**args)
                    if output is None:
                        raise SystemExit()

            else:
                 #### By_Location/Regional/Entire####    
                self.otherPredictions = []
                self.otherTests = []
                for idD, dataCovariable in enumerate(otherData):
                    frq1 = NUM.array(self.findFrequencies(dataCovariable), dtype = NUM.int32)
                    outputt = ARC._ss.time_series_forest(
                                                    x = dataCovariable,
                                                    type_run = typeSpatialConfiguration,
                                                    frequence = frq1,
                                                    frequence_test = frq1,
                                                    seed = seed,
                                                    steps_to_predict = self.addTime,
                                                    neighbors_obj = self.neighbors,
                                                    threshold_predict_mode = thresholdClass,
                                                    number_trees = numTrees,
                                                    test_size = testSizeAux,
                                                    eval_pend = 0,
                                                    lag = 0,
                                                    sample_size = sampleSize,
                                                    level = maxLevel,
                                                    num_threads = numThreads,
                                                    locations = locations,
                                                    index = idD)

                    if type(outputt) == tuple and outputt[8] == 1:
                        ARCPY.AddIDMessage("ERROR", 110486, listOtherVariables[idD])
                        raise SystemExit
                        
                    if outputt is None:
                        raise SystemExit

                    predict1 = outputt[0].reshape(self.forecastTime, self.numLocations)
                    predict1[0:self.numTime, 0:self.numLocations] = dataCovariable.copy()
                    test1 = None;
                    if outputt[3] is not None:
                        test1 = outputt[3].reshape(testSizeAux, self.numLocations)
                    self.otherPredictions.append(predict1)
                    self.otherTests.append(test1)

                args = self.storeValues(
                                                x = info,
                                                type_run = typeSpatialConfiguration,
                                                frequence = frq,
                                                frequence_test = frqTest,
                                                seed = seed,
                                                steps_to_predict = self.addTime,
                                                neighbors_obj = self.neighbors,
                                                threshold_predict_mode = thresholdClass,
                                                number_trees = numTrees,
                                                test_size = testSizeAux,
                                                eval_pend = 0,
                                                lag = lagSize,
                                                sample_size = sampleSize,
                                                level = maxLevel,
                                                num_threads = numThreads,
                                                list_xs = self.otherPredictions,
                                                list_tests = self.otherTests,
                                                xy_locations = xy,
                                                percentange_importance = percentange_importance,
                                                recalculate_model = recalculate_model,
                                                max_k = max_k,
                                                use_one_model = useOneModel,
                                                zones = zoneData,
                                                locations = locations)
                if useOneModel == 2 and zoneData is not None:
                    self.clustersIds = NUM.asarray(NUM.unique(zoneData), dtype = NUM.int32)

                #### Main predictor function ####
                output = ARC._ss.multivariate_time_series_forest(**args)
                if output is None:
                    raise SystemExit()
            #### output info ###
            #### 0 (array) -> main prediction dim (self.forecastTime*self.numLocations)
            #### 1 (array) -> Quartile 5%  dim (self.forecastTime*self.numLocations)
            #### 2 (array) -> Quartile 95%  dim (self.forecastTime*self.numLocations)
            #### 3 (array) -> Test prediction dim (testSize*self.numLocations)
            #### 4 (array) -> Type of method used internally (0-> regression, 1->classification)  dim (self.numLocations) 
            #### 5 (array) -> Errors seq ... loc_ind1, type, loc_indN, type dim (variable)
            #### 6 (array) -> Lag Used in Prediction
            #### 7 (array) -> Lag Used in Validation
            #### 8 (int)   -> display warning - all constant

            #### Multivariate
            #### 8 (int array): knn -> best bandwidth dim (self.numLocations)
            #### 9 (int array): indices importance lag steps (size is unkwnown)
            #### 10 (float array): value importance lag steps (size is unkwnown)
            #### 11 (int array): indices location  (size is unkwnown)
            #### 12 (int array): recalculated or not
            self.bandwidth = None
            self.useOneModel = useOneModel
            self.univariate = otherData is None

            if otherData is not None or enableOneModelWithOneVariable:
                self.importanceInformation = (output[6], output[9], output[10], output[11])

            if output is None:
                raise SystemExit()

            predictionTest = None
            startSlice = None
            endSlice =  None
            if not detrend:
                predict = output[0].reshape(self.forecastTime, self.numLocations)
                self.rawForecast[0:self.numTime:,] = info
                self.rawForecast[-self.addTime:,] = predict[-self.addTime:,]
                if testSize:
                    predictionTest = output[3].reshape(testSizeAux, self.numLocations)
                self.lowIntervals = output[1].reshape(self.forecastTime, self.numLocations)
                self.highIntervals = output[2].reshape(self.forecastTime, self.numLocations)
                self.fitForecast = output[0].reshape(self.forecastTime, self.numLocations)
            else:
                methodUsed = output[4]
                predict = output[0].reshape(self.forecastTime, self.numLocations)
                self.rawForecast[0:self.numTime:,] = info
                self.rawForecast[-self.addTime:,] = predict[-self.addTime:,]

                if testSize:
                    predictionTest = output[3].reshape(testSizeAux, self.numLocations)
                    startSlice = self.forecastTime - self.addTime - testSizeAux
                    endSlice = self.forecastTime - self.addTime

                self.lowIntervals = output[1].reshape(self.forecastTime, self.numLocations)
                self.highIntervals = output[2].reshape(self.forecastTime, self.numLocations)
                self.fitForecast = output[0].reshape(self.forecastTime, self.numLocations)

                #### Verify Validation ###
                #if testSize is not None:
                #    self.fitForecast[int(self.numTime-testSizeAux):int(self.numTime),:] = predictionTest

                for i in NUM.arange(self.numLocations):
                    self.rawForecast.T[i] =  self.rawForecast.T[i] + yTrend.T[i]
                    self.lowIntervals.T[i] =  self.lowIntervals.T[i] + yTrend.T[i]
                    self.highIntervals.T[i] =  self.highIntervals.T[i] + yTrend.T[i]
                    self.fitForecast.T[i] =  self.fitForecast.T[i] + yTrend.T[i]

                    if testSize:
                        predictionTest.T[i] = predictionTest.T[i] + yTrend.T[i][slice(startSlice,endSlice)]

            self.seasonInt = output[6]

            idErrors = None
            typeError = None
            if output[5] is not None:
                nlocErrors = len(output[5])//2
                error =  output[5].reshape(nlocErrors, 2)
                idErrors = error.T[0]
                typeError = error.T[1]
                ARCPY.AddIDMessage("ERROR",110211)
                raise SystemExit

            if idErrors is None :
                #### Calculate SSD ####
                res = self.data - self.fitForecast[0:self.numTime]
                self.ssd = (res**2.0).sum(0)
                self.rmse = NUM.sqrt(self.ssd/(self.numTime - NUM.abs(self.seasonInt)))
                if testSize:
                    #### All predictions (trained and new steps predictions ####
                    #### Check a particular location  ####
                    #ARCPY.AddMessage(str(self.data[-testSizeAux:].T[0]) + " " + str(predictionTest.T[0]))
                    res = self.data[-testSizeAux:] - predictionTest
                    self.validationSSD = (res**2.0).sum(0)
                    self.validationRMSE = NUM.sqrt(self.validationSSD/testSizeAux)
            else:

                strErrors = ",".join([str((e+1, typeError[id]))  for id, e in enumerate(NUM.unique(idErrors)) if id < 30])
                ARCPY.AddWarning("The following locations were not processed (List first 30 of {0}):{1}.".format(len(idErrors), strErrors)) 

                goodIds = NUM.ones(self.data.shape[1], dtype = bool)
                goodIds[NUM.unique(idErrors)] = False
                res = self.data.T[goodIds].T - self.fitForecast[0:self.numTime].T[goodIds].T
                self.ssd = (res**2.0).sum(0)
                lagsTrainPred = output[6]
                lagsTrainPred = lagsTrainPred[goodIds]
                self.rmse  = NUM.sqrt(self.ssd/(self.numTime - lagsTrainPred))

                if testSize:
                    lagsValidation = output[7]
                    predictionTest = output[3].reshape(testSizeAux, self.numLocations)
                    res = self.data[-testSizeAux:].T[goodIds].T - predictionTest.T[goodIds].T
                    self.validationSSD = (res**2.0).sum(0)
                    self.validationRMSE = NUM.sqrt(self.validationSSD/testSizeAux)

            #### Outliers ####
            if self.outlierOption is not None:
                self.tsOutliers = TS.TSOutliers(self, alpha = self.outlierAlpha, 
                                                testSize = self.outlierTestSize)
                self.outliers = self.tsOutliers.outliers
            else:
                self.outliers = NUM.zeros((self.forecastTime, self.numLocations), dtype = bool)

            #### Build JSON Method String ####
            self.__buildJSONMethodStr()
            return

    def confidenceIntervals(self):
        pass

    def updateForestDict(self, parameters):
        """ Update parameters list """
        info = []
        for id,parameter in enumerate(parameters):
            if id > 6 and parameter.value is not None and id not in [16,17]:
                info.append(str(parameter.name)+":"+str(parameter.valueAsText.lower()))
        self.infoParamNames = info

    def __buildJSONMethodStr(self):
        self.infoParamName = ["seed:{0}".format(self.seed)] + self.infoParamNames + [self.timeWindowInfo]
        strP = "; ".join(self.infoParamName) 
        d = {}
        d[0] = 'forest-based; ' + strP
        self.jsonMethodStr = JSON.dumps(d)
        self.methodInts = NUM.zeros(self.numLocations, dtype = NUM.int32)

    def report(self, cube=None, varName=None, print = False):
        seedMsg = ARCPY.GetIDMessage(84821)
        self.table = createForecastReport(self, cube=cube, varName=varName)

        if print:
            ARCPY.AddMessage(seedMsg.format(self.seed))
            ARCPY.AddMessage(self.table)

        return self.table

class HoltWintersForecast(object):
    def __init__(self, data, addTime, seasonalInt = None, validationSize = 0, 
                 seasonalType = "ADD", outlierOption = None, 
                 outlierConfidence = "90%", outlierTestSize = None):

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.forecastType = 1
        self.numTime, self.numLocations = data.shape
        self.forecastTime = self.numTime + self.addTime
        self.seasonalType = self.seasonalType.upper()

        #### Resolve Outlier Options ####
        if outlierOption is not None:
            if self.outlierConfidence in confidenceStr2Alpha:
                self.outlierAlpha = confidenceStr2Alpha[self.outlierConfidence]
            else:
                self.outlierAlpha = .1

            if self.outlierTestSize is None:
                self.outlierTestSize = max(1, int(self.numTime * .05))

        #### Create Output Arrays ####
        self.result = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.fitForecast = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.rawForecast = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.rawForecast[0:self.numTime] = data
        self.lowIntervals = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.highIntervals = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.lowIntervals[0:self.numTime] = data
        self.highIntervals[0:self.numTime] = data
        self.ssd = NUM.zeros(self.numLocations, dtype = float)
        self.rmse = NUM.zeros(self.numLocations, dtype = float)
        self.seasonInt = NUM.zeros(self.numLocations, dtype = NUM.int32)
        self.alphas = NUM.zeros(self.numLocations, dtype = float)
        self.betas = NUM.zeros(self.numLocations, dtype = float)
        self.gammas = NUM.ones(self.numLocations, dtype = float)
        self.levelComponents = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.trendComponents = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)
        self.seasonComponents = NUM.zeros((self.forecastTime, self.numLocations), dtype = float)

        #### Assess Whether to Validation ####
        self.doValidation = False
        if self.validationSize:
            self.validationSSD = NUM.zeros(self.numLocations, dtype = float)
            self.validationRMSE = NUM.zeros(self.numLocations, dtype = float)
            self.doValidation = True

        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220001), 0, self.numLocations, 1)
        for i in range(self.numLocations):
            ts = self.data[:,i]
            ohw = TS.OptimizedHoltWinters(ts, dampen = True, seasonalInt = self.seasonalInt, 
                                          seasonalType = self.seasonalType)
            ohw.forecast(self.addTime)
            self.fitForecast[0:self.numTime,i] = ohw.fitted
            self.fitForecast[self.numTime:,i] = ohw.prediction
            self.rawForecast[self.numTime:,i] = ohw.prediction
            self.result[0:self.numTime,i] = ts
            self.result[self.numTime:,i] = ohw.prediction
            self.lowIntervals[self.numTime:,i] = ohw.lowInterval
            self.highIntervals[self.numTime:,i] = ohw.highInterval
            self.ssd[i] = ohw.ssd
            self.rmse[i] = NUM.sqrt(ohw.ssd / self.numTime)
            self.seasonInt[i] = ohw.seasonalInt
            self.alphas[i] = ohw.alpha
            self.betas[i] = ohw.beta
            self.levelComponents[:,i] = ohw.levelComponents
            self.trendComponents[:,i] = ohw.trendComponents
            if ohw.isSeasonal:
                self.gammas[i] = ohw.gamma
                self.seasonComponents[:,i] = ohw.seasonComponents

            if self.doValidation:
                ssd, rmse = TS.getValidationMetrics(ohw, self.validationSize)
                self.validationSSD[i] = ssd
                self.validationRMSE[i] = rmse

            ARCPY.SetProgressorPosition()

        #### Outliers ####
        if self.outlierOption is not None:
            self.tsOutliers = TS.TSOutliers(self, alpha = self.outlierAlpha, 
                                            testSize = self.outlierTestSize)
            self.outliers = self.tsOutliers.outliers
        else:
            self.outliers = NUM.zeros((self.forecastTime, self.numLocations), dtype = bool)

        #### Build JSON Method String ####
        self.__buildJSONMethodStr()

        #### Set Non-Seasonal to -1 ####
        self.seasonInt[self.seasonInt == 1] = -1

    def __buildJSONMethodStr(self):
        d = {}
        if self.seasonalInt is None:
            d[0] = 'exponential smoothing; seasonality:auto_detect'
        else:
            d[0] = 'exponential smoothing; seasonality:user_defined({})'.format(self.seasonalInt)
        self.jsonMethodStr = JSON.dumps(d)
        self.methodInts = NUM.zeros(self.numLocations, dtype = NUM.int32)

    def report(self, cube = None, varName = None, print = False):
        self.table = createForecastReport(self, cube = cube, varName = varName)

        if print:
            ARCPY.AddMessage(self.table)

        return self.table
        
class CurveFitForecast(object):
    def __init__(self, data, addTime, fitType = "LINEAR", upBoundFactor = 10,
                 validationSize = 0, outlierOption = None, 
                 outlierConfidence = "90%", outlierTestSize = None):

        UTILS.assignClassAttr(self, locals())
        self.forecastType = 3

        #### Parse Fit Type ####
        self.applyLinear = False 
        self.applyParabolic = False 
        self.applyGeometric = False 
        self.applyGompertz = False 
        self.warnGeometric = False
        self.warnGompertz = False
        if fitType.upper() == "PARABOLIC":
            self.applyParabolic = True
        elif fitType.upper() == "EXPONENTIAL":
            self.applyGeometric = True
            self.warnGeometric = True
        elif fitType.upper() == "GOMPERTZ":
            self.applyGompertz = True
            self.warnGompertz = True
        elif fitType.upper() == "AUTO_DETECT":
            self.applyLinear = True
            self.applyParabolic = True
            self.applyGeometric = True
            self.applyGompertz = True
            self.warnGeometric = True
            self.warnGompertz = True
        else:
            self.applyLinear = True

        self.numTime, self.numLocations = data.shape
        self.forecastTime = self.numTime + self.addTime

        #### Resolve Outlier Options ####
        if outlierOption is not None:
            if self.outlierConfidence in confidenceStr2Alpha:
                self.outlierAlpha = confidenceStr2Alpha[self.outlierConfidence]
            else:
                self.outlierAlpha = .1

            if self.outlierTestSize is None:
                self.outlierTestSize = max(1, int(self.numTime * .05))

        #### Keep Track of Forecast Coefficients ####
        self.meanCoef = data.mean(0)
        self.linearCoef = NUM.zeros((self.numLocations, 2), dtype = float)
        self.parabolicCoef = NUM.zeros((self.numLocations, 3), dtype = float)
        self.geometricCoef = NUM.zeros((self.numLocations, 3), dtype = float)
        self.gompertzCoef = NUM.zeros((self.numLocations, 4), dtype = float)
        self.finalCoef = NUM.zeros((self.numLocations, 4), dtype = float)

        #### Fit/Forecast/Stats ####
        self.fitForecast = NUM.ones((self.forecastTime, self.numLocations), dtype = float) * self.meanCoef
        self.rawForecast = NUM.ones((self.forecastTime, self.numLocations), dtype = float) * self.meanCoef
        self.rawForecast[0:self.numTime] = data
        self.ssd = NUM.ones(self.numLocations, dtype=float) * abs(UTILS.shpFileNull['DOUBLE'])
        self.rmse = NUM.ones(self.numLocations, dtype=float) * abs(UTILS.shpFileNull['DOUBLE'])
        self.methods = NUM.zeros(self.numLocations, dtype="<U11")
        self.seasonInt = NUM.ones(self.numLocations, dtype = NUM.int32) * -1

        #### Create NULL Intervals ####
        self.highIntervals = NUM.ones((self.forecastTime, self.numLocations), dtype = float) * NUM.nan
        self.lowIntervals = NUM.ones((self.forecastTime, self.numLocations), dtype = float) * NUM.nan

        #### Keep Track of Constant or Negative Values ####
        isConstant = data.var(0) == 0
        hasNegative = (data < 0).sum(0) != 0
        self.geometricWarningArray = isConstant 
        self.gompertzWarningArray = isConstant | hasNegative

        #### Assess Whether to Validation ####
        self.doValidation = False
        if self.validationSize:
            self.validationSSD = NUM.ones(self.numLocations, dtype=float) * abs(UTILS.shpFileNull['DOUBLE'])
            self.validationRMSE = NUM.ones(self.numLocations, dtype=float) * abs(UTILS.shpFileNull['DOUBLE'])
            self.doValidation = True
            self.validationTime = self.numTime - self.validationSize
            self.validationData = self.data[0:self.numTime - self.validationSize]

    def checkSlope(self, data):
        numTime = len(data)
        matA = NUM.ones((numTime, 2), dtype=float)
        matA[:, 0] = NUM.arange(numTime)
        coefs = NUM.linalg.lstsq(matA, data, rcond=-1)
        slopeIntercepts = coefs[0]
        return slopeIntercepts[0]

    def updateForecast(self, newForecast, newSSD, newRMSE, method):
        ids = NUM.where(newSSD < self.ssd)[0]
        self.fitForecast[:,ids] = newForecast[:,ids]
        self.rawForecast[self.numTime:,ids] = newForecast[self.numTime:,ids]

        self.ssd[ids] = newSSD[ids]
        self.rmse[ids] = newRMSE[ids]
        self.methods[ids] = method

        return ids

    def updateValidationForecast(self, newSSD, newRMSE, method):
        ids = NUM.where(newSSD < self.validationSSD)[0]
        self.validationSSD[ids] = newSSD[ids]
        self.validationRMSE[ids] = NUM.sqrt(newSSD[ids] / self.validationSize)
        self.methods[ids] = method

        return ids

    def updateForecastByID(self, newForecast, newSSD, newRMSE, ids = None):
        if ids is None:
            self.fitForecast[:] = newForecast
            self.rawForecast[self.numTime:] = newForecast[self.numTime:]
            self.ssd[:] = newSSD
            self.rmse[:] = newRMSE
        else:
            self.fitForecast[:,ids] = newForecast
            self.rawForecast[self.numTime:,ids] = newForecast[self.numTime:]
            self.ssd[ids] = newSSD
            self.rmse[ids] = newRMSE

    def calculateStats(self, estimate, ids = None):
        data = self.data
        if ids is not None:
            data[:,ids]

        res = estimate[:self.numTime, :] - data
        ssd = (res**2).sum(0)
        
        return ssd

    def calculateValidationStats(self, estimate, ids = None):
        data = self.data
        if ids is not None:
            data[:,ids]

        res = estimate[self.validationTime:, :] - data
        ssd = (res**2).sum(0)
        
        return ssd

    def setMeanForecasts(self):

        #### Exponential Failures ####
        badSum = self.geometricWarningArray.sum()
        if self.warnGeometric and badSum:
            ARCPY.AddIDMessage("WARNING", 110323, badSum, self.numLocations)
            updateIDs = NUM.where(self.geometricWarningArray)[0]
            badIDs = [str(i) for i in updateIDs[0:30]]
            badIDs = ", ".join(badIDs)
            ARCPY.AddIDMessage("WARNING", 110324, "Location ID", badIDs)

            #### Set Mean Forecast ####
            if self.fitType.upper() == "EXPONENTIAL":
                self.meanForecast(updateIDs)

        #### Gompertz Failures ####
        badSum = self.gompertzWarningArray.sum()
        if self.warnGompertz and badSum:
            ARCPY.AddIDMessage("WARNING", 110325, badSum, self.numLocations)
            updateIDs = NUM.where(self.gompertzWarningArray)[0]
            badIDs =[str(i) for i in updateIDs[0:30]]
            badIDs = ", ".join(badIDs)
            ARCPY.AddIDMessage("WARNING", 110326, "Location ID", badIDs)

            #### Set Mean Forecast ####
            if self.fitType.upper() == "GOMPERTZ":
                self.meanForecast(updateIDs)

        #### Overwrite Exp/Gompertz With Mean if Mean is Best Case ####
        if self.fitType.upper() == "AUTO_DETECT":
            candidateIDs = self.geometricWarningArray | self.gompertzWarningArray
            replaceIDs = []
            replaceKeys = ["exponential", "gompertz"]
            for id in NUM.where(candidateIDs)[0]:
                if self.methods[id] in replaceKeys:
                    replaceIDs.append(id)
            if len(replaceIDs):
                replaceIDs = NUM.array(replaceIDs, dtype = NUM.int32)
                self.meanForecast(replaceIDs)

    def meanForecast(self, ids):
        data = self.data[:,ids]
        if self.doValidation:
            #### Set Mean Forecast Validation RMSE ####
            meanData = data[0:self.validationTime].mean(0)
            res = data[self.validationTime:] - meanData
            vssd = (res**2).sum(0)
            self.validationSSD[ids] = vssd
            self.validationRMSE[ids] = NUM.sqrt(vssd / self.validationSize)
            absScaledRes = abs(res / data[self.validationTime:]).sum(0)

        #### Base Mean Forecast ####
        meanData = data.mean(0)
        self.fitForecast[:,ids] = meanData
        self.rawForecast[self.numTime:,ids] = meanData
        res = data - meanData
        ssd = (res**2).sum(0)
        self.ssd[ids] = ssd
        self.rmse[ids] = NUM.sqrt(ssd / self.numTime)
        self.methods[ids] = 'mean'

    def forecast(self):
        #### Ignore Runtime Warnings ####
        import warnings
        warnings.simplefilter("ignore")

        #### Choose RMSE Choice Type ####
        if self.doValidation:
            self.__forecastValidationRMSE()
        else:
            self.__forecastRMSE()

        #### Report Convergence Fails ####
        self.setMeanForecasts()

        #### Outliers ####
        if self.outlierOption is not None:
            self.tsOutliers = TS.TSOutliers(self, alpha = self.outlierAlpha, 
                                            testSize = self.outlierTestSize)
            self.outliers = self.tsOutliers.outliers
        else:
            self.outliers = NUM.zeros((self.forecastTime, self.numLocations), dtype = bool)

        #### Build JSON Method String ####
        self.__buildJSONMethodStr()

    def __forecastValidationRMSE(self):

        if self.applyLinear:
            #### Linear Validation ####
            forecast, ssd, rmse = self.linearForecasting(validation = True)
            ids = self.updateValidationForecast(ssd, rmse, "linear")

            #### Always Run Regular Linear Forecast for All Locations ####
            forecast, ssd, rmse = self.linearForecasting(validation = False)
            self.updateForecastByID(forecast, ssd, rmse, ids = None)

        if self.applyParabolic:
            #### Parabolic ####
            forecast, ssd, rmse = self.parabolicForecasting(validation = True)
            ids = self.updateValidationForecast(ssd, rmse, "parabolic")

            if len(ids):
                #### Only Run Regular Forecast for Locations with Lower SSD ####
                forecast, ssd, rmse = self.parabolicForecasting(validation = False, ids = ids)
                self.updateForecastByID(forecast, ssd, rmse, ids)

        if self.applyGeometric:
            #### Geometric ####
            forecast, ssd, rmse = self.geometricForecasting(validation = True)
            ids = self.updateValidationForecast(ssd, rmse, "exponential")

            if len(ids):
                #### Only Run Regular Forecast for Locations with Lower SSD ####
                forecast, ssd, rmse = self.geometricForecasting(validation = False, ids = ids)
                self.updateForecastByID(forecast, ssd, rmse, ids)

        if self.applyGompertz:
            #### Gompertz ####
            forecast, ssd, rmse = self.gompertzForecasting(validation = True)
            ids = self.updateValidationForecast(ssd, rmse, "gompertz")

            if len(ids):
                #### Only Run Regular Forecast for Locations with Lower SSD ####
                forecast, ssd, rmse = self.gompertzForecasting(validation = False, ids = ids)
                self.updateForecastByID(forecast, ssd, rmse, ids)

    def __forecastRMSE(self):

        if self.applyLinear:
            #### Linear ####
            forecast, ssd, rmse = self.linearForecasting(validation = False)
            ids = self.updateForecast(forecast, ssd, rmse, "linear")

        if self.applyParabolic:
            #### Parabolic ####
            forecast, ssd, rmse = self.parabolicForecasting(validation = False)
            ids = self.updateForecast(forecast, ssd, rmse, "parabolic")

        if self.applyGeometric:
            #### Geometric ####
            forecast, ssd, rmse = self.geometricForecasting(validation = False)
            ids = self.updateForecast(forecast, ssd, rmse, "exponential")

        if self.applyGompertz:
            #### Gompertz ####
            forecast, ssd, rmse = self.gompertzForecasting(validation = False)
            ids = self.updateForecast(forecast, ssd, rmse, "gompertz")


    def __buildJSONMethodStr(self):
        d = {}
        v = {}
        self.methodInts = NUM.zeros(self.numLocations, dtype = NUM.int32)
        c = 0
        for ind, value in enumerate(self.methods):

            #### Combine Final Coefficients ####
            numCoef, coefStr = curveType2Eq[value]
            if value == "linear":
                self.finalCoef[ind, 0:numCoef] = self.linearCoef[ind]
            elif value == "parabolic":
                self.finalCoef[ind, 0:numCoef] = self.parabolicCoef[ind]
            elif value == "exponential":
                self.finalCoef[ind, 0:numCoef] = self.geometricCoef[ind]
            elif value == "gompertz":
                self.finalCoef[ind, 0:numCoef] = self.gompertzCoef[ind]
            else:
                self.finalCoef[ind, 0] = self.meanCoef[ind]

            #### Transform Method to Unique Integer ####
            if value not in v:
                v[value] = c
                d[c] = value
                c += 1
            self.methodInts[ind] = v[value]

        self.jsonMethodStr = JSON.dumps(d)

    def getInfo(self, validation = True, ids = None):
        if validation:
            numTime = self.validationTime
            forecastTime = self.numTime
            data = self.validationData
        else:
            numTime = self.numTime
            forecastTime = self.numTime + self.addTime
            data = self.data 

        if ids is not None:
            data = data[:,ids]

        numTime, numLocations = data.shape

        return data, numTime, numLocations, forecastTime

    def getStats(self, forecast, validation = True, ids = None):
        data = self.data
        if ids is not None:
            data = data[:,ids]

        if validation:
            res = data[self.validationTime:, :] - forecast[self.validationTime:, :]
            ssd = (res** 2).sum(0)
            rmse = NUM.sqrt(ssd / self.validationSize)
        else:
            res = data - forecast[:self.numTime, :]
            ssd = (res**2).sum(0)
            rmse = NUM.sqrt(ssd / self.numTime)

        return ssd, rmse

    def linearForecasting(self, validation = True, ids = None):

        if validation:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220002))
        else:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220003))

        data, numTime, numLocations, forecastTime = self.getInfo(validation, ids)
        extend = NUM.tile(NUM.arange(forecastTime), numLocations).reshape(numLocations, forecastTime)

        matA = NUM.ones((numTime, 2), dtype=float)
        matA[:, 0] = NUM.arange(numTime)

        coefs = NUM.linalg.lstsq(matA, data, rcond=-1)
        slopeIntercepts = coefs[0]

        #### Add Forecast Coefficients ####
        if not validation:
            self.linearCoef[:] = slopeIntercepts.T

        forecast = extend.T * slopeIntercepts[0] + slopeIntercepts[1]
        ssd, rmse = self.getStats(forecast, validation = validation, ids = ids)

        return forecast, ssd, rmse

    def parabolicForecasting(self, validation = True, ids = None):

        if validation:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220004))
        else:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220005))

        data, numTime, numLocations, forecastTime = self.getInfo(validation, ids)
        extend = NUM.tile(NUM.arange(forecastTime), numLocations).reshape(numLocations, forecastTime)

        matA = NUM.ones((numTime, 3), dtype=float)
        matA[:, 0] = NUM.arange(numTime) ** 2
        matA[:, 1] = NUM.arange(numTime)

        coefs = NUM.linalg.lstsq(matA, data, rcond=-1)
        slopeIntercepts = coefs[0]

        #### Add Forecast Coefficients ####
        if not validation:
            if ids is None:
                self.parabolicCoef[:] = slopeIntercepts.T
            else:
                self.parabolicCoef[ids] = slopeIntercepts.T

        forecast = extend.T ** 2 * slopeIntercepts[0] + extend.T * slopeIntercepts[1] + slopeIntercepts[2]
        ssd, rmse = self.getStats(forecast, validation = validation, ids = ids)

        return forecast, ssd, rmse

    def geometric(self, t, *args):
        K, a, b = args[0]
        return ARC._ss.geometric_fun(t, K, a, b)

    def geometricInitParam(self, data, numTime, numLocations):
        #### Smooth Time Series by Parabolic for all Locations ####
        x = NUM.arange(numTime)
        extend = NUM.tile(x, numLocations).reshape(numLocations, numTime)

        matC = NUM.ones((numTime, 3), dtype=float)
        matC[:, 0] = x ** 2
        matC[:, 1] = x

        coefs = NUM.linalg.lstsq(matC, data, rcond=-1)
        slopeIntercepts = coefs[0]

        derivative = 2 * extend.T * slopeIntercepts[0] + slopeIntercepts[1]
        smoothed = extend.T ** 2 * slopeIntercepts[0] + extend.T * slopeIntercepts[1] + slopeIntercepts[2]

        #### Estimate Coefs using the Smoothed Curve and Derivative ####
        matA = NUM.ones((numTime, 2), dtype=float)
        p0s = NUM.zeros((numLocations, 3), dtype = float)

        for i in range(numLocations):
            #### Estimate Growth Rate b0 = dx/dt = bx, Derivative = b_hat * smoothed + intercept ####
            matA[:, 0] = smoothed[:, i]
            matY = derivative[:, i]
            coefs = NUM.linalg.lstsq(matA, matY, rcond=-1)
            b0 = NUM.exp(coefs[0][0])
            if b0 < 1E-16:
                b0 = 1E-16

            #### Estimate a0 and k0: smoothed = a exp(b_hat*t) + k ####
            matA[:, 0] = b0**x
            matY = smoothed[:, i]
            coefs = NUM.linalg.lstsq(matA, matY, rcond=-1)
            slopeIntercepts = coefs[0]
            p0s[i] = (slopeIntercepts[1], slopeIntercepts[0], b0)

        return p0s

    def geometricResidual(self, input_params, y, x):
        diff = y - self.geometric(x, input_params)
        return diff

    def geometricJacobian(self, input_params, y, x):
        numTime = len(y)
        K, a, b = input_params
        dK = -1 * NUM.ones(numTime, dtype=float)
        da = -1 * b ** x
        db = a * da * x
        jac = NUM.array([dK, da, db]).reshape(3, numTime).T

        return jac

    def geometricForecasting(self, validation = True, ids = None):
        data, numTime, numLocations, forecastTime = self.getInfo(validation, ids)
        forecast = NUM.zeros((forecastTime, numLocations), dtype=float)
        extend = NUM.arange(numTime)
        extendPred = NUM.arange(forecastTime)

        if validation:
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220006), 0, numLocations, 1)
        else:
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220007), 0, numLocations, 1)

        #### Get Bad Value Array ####
        isSubset = ids is not None
        badValues = self.geometricWarningArray
        if isSubset:
            badValues = badValues[ids]

        bounds = (-NUM.inf, NUM.inf)
        p0s = self.geometricInitParam(data, numTime, numLocations)

        for i in range(numLocations):
            locationData = data[:, i].ravel()
            success = False
            if not badValues[i]:
                try:
                    p0 = p0s[i]
                    GeometricParam = OPT.least_squares(fun=opt_geometric_residual, x0=p0, 
                                                        jac=opt_geometric_jacobian, 
                                                        args=(locationData,), 
                                                        bounds=bounds, method='trf', 
                                                        max_nfev=maxExpIters)
                    coefs = GeometricParam['x']
                    newForecast = self.geometric(forecastTime, coefs)
                    success = NUM.isinf(newForecast).sum() == 0
                except:
                    pass

                #### Update Bad Record Boolean Array ####
                if not success:
                    if isSubset:
                        self.geometricWarningArray[ids[i]] = True
                    else:
                        self.geometricWarningArray[i] = True
                else:
                    #### Add Forecast Coefficients ####
                    if not validation:
                        if isSubset:
                            self.geometricCoef[ids[i]] = (coefs[0], coefs[1], 
                                                          NUM.log(coefs[2]))
                        else:
                            self.geometricCoef[i] = (coefs[0], coefs[1], 
                                                     NUM.log(coefs[2]))

            #### Mean Forecast For All Bad Records ####
            if not success:
                newForecast = NUM.repeat(locationData.mean(), forecastTime)

            #### Update Forecast ####
            forecast[:,i] = newForecast

            ARCPY.SetProgressorPosition()

        ssd, rmse = self.getStats(forecast, validation = validation, ids = ids)

        return forecast, ssd, rmse

    def gompertz(self, t, *args):
        K, a, b, c = args[0]
        return ARC._ss.gompertz_fun(t, K, a, b, c)

    def gompertzInitParam(self, data, numTime, numLocations, locNegativeTrend):
        """Optimal initial parameters for the Gompertz Curve.

            user equation:
                                        a * exp(-b * exp(-c*t)) + k
                where:
                                        a determines the range of S-shape
                                        b translates the S-shape to the left or right
                                        c sets the growth rate
                                        k sets the level of S-shape
                bounds are:
                                        a  (0, 10 * max + 0.00001) if positive trend
                                            (- 10 * max + 0.00001, 0) if negative trend
                                        b  (0, inf)
                                        c  (0, inf)
                                        k  (0, inf)
                having properties:
                                        maxChangeValue = a*c/e
                                            that is c = maxChangeValue * e / a
                                        maxChangeDate = -ln(ln(2)/b)/c
                                            that is b = ln(2) / exp(- maxChangeDate * c)
                reference:
                                        https://en.wikipedia.org/wiki/Gompertz_function

            script equation:
                                        k0 * (a0 ** (b0 ** t)) + c0
                where:
                                        k0 determines the range of S-shape
                                        a0 translates the S-shape to the left or right
                                        b0 sets the growth rate
                                        c0 sets the level of S-shape
                bounds are:
                                        k0  (0, 10 * max + 0.00001) if positive trend
                                            (- 10 * max + 0.00001, 0) if negative trend
                                        a0  (0, inf)
                                        b0  (0, inf)
                                        c0  (0, inf)
                initialized by:
                                        k0 = max - min, if positive trend to allow a increasing S-shape
                                             min - max, if negative trend to allow a decreasing S-shape
                                        c0 = min, if positive trend
                                             max, if negative trend
                                        a0 and b0 is initialized based on the point with the largest first order difference
                                            afeter fitting cubic function to the data.
                                            Find more details in findMaxRateDate() and gompertzInitParam().

            the above equations are equivalent by:
                                        k0 = a,       a = k0
                                        a0 = exp(-b), b = -ln(a0)
                                        b0 = exp(-c), c = -ln(b0)
                                        c0 = k,       k = c0

            notes:
                "max" and "min" is the maximum and minimum value given a time series.
                "e" is the euler's number.
                "maxChangeValue" means largest first order difference.
                "maxChangeDate" time of means largest first order difference.

        """
        MAX = data.max(0)
        MIN = data.min(0)
        maxChangeDate, maxChangeValue = self.findMaxRateDate(data, numTime, numLocations)

        c0 = MIN

        k0 = MAX - MIN

        b0_wiki = NUM.multiply(maxChangeValue, NUM.divide(NUM.e, k0), dtype=NUM.float64)
        b0 = NUM.exp(-b0_wiki, dtype=NUM.float64)

        a0_wiki = NUM.divide(NUM.log(2, dtype=NUM.float64), 
                             NUM.exp(- maxChangeDate * b0_wiki, dtype=NUM.float64), dtype=NUM.float64)
        a0 = NUM.exp(-a0_wiki, dtype=NUM.float64)
        a0[a0 < 1E-16] = 1E-3 

        #### Revise for Decreasing Trend ####
        c0[locNegativeTrend] = MAX[locNegativeTrend]
        k0[locNegativeTrend] = - k0[locNegativeTrend]

        return NUM.column_stack((k0, a0, b0, c0))

    def findMaxRateDate(self, data, numTime, numLocations):
        extend = NUM.tile(NUM.arange(numTime), numLocations).reshape(numLocations, numTime)

        matA = NUM.ones((numTime, 4), dtype=float)
        x = NUM.arange(numTime)
        matA[:, 0] = x ** 3
        matA[:, 1] = x ** 2
        matA[:, 2] = x

        coefs = NUM.linalg.lstsq(matA, data, rcond=-1)
        slopeIntercepts = coefs[0]

        derivative = 3 * extend.T ** 2 * slopeIntercepts[0] + 2 * extend.T * slopeIntercepts[1] + slopeIntercepts[2]
        maxChangeDate = derivative.argmax(0)
        maxChangeValue = derivative.max(0)

        return maxChangeDate, maxChangeValue

    def gompertzForecasting(self, validation = True, ids = None):

        data, numTime, numLocations, forecastTime = self.getInfo(validation, ids)
        forecast = NUM.zeros((forecastTime, numLocations), dtype=float)
        extend = NUM.arange(numTime)
        extendPred = NUM.arange(forecastTime)

        if validation:
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220008), 0, numLocations, 1)
        else:
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220009), 0, numLocations, 1)

        MAX = data.max(0)
        locNegativeTrend = self.checkSlope(data) < 0
        p0s = self.gompertzInitParam(data, numTime, numLocations, locNegativeTrend)

        #### Get Bad Value Array ####
        isSubset = ids is not None
        badValues = self.gompertzWarningArray
        if isSubset:
            badValues = badValues[ids]

        for i in range(numLocations):
            locationData = data[:, i].ravel()
            success = False
            if not badValues[i]:
                try:
                    if locNegativeTrend[i]:
                        bounds = ((-MAX[i] * self.upBoundFactor - 0.001, 0, 0, 0), [0, NUM.inf, NUM.inf, NUM.inf])
                    else:
                        bounds = (0, [MAX[i] * self.upBoundFactor + 0.001, NUM.inf, NUM.inf, NUM.inf])

                    p0 = p0s[i]

                    GompertzParam = OPT.least_squares(fun=opt_gompertz_residual, x0=p0,
                                                        jac=opt_gompertz_jacobian,
                                                        args=(locationData,),
                                                        bounds=bounds, method='trf',
                                                        max_nfev=maxGompIters)
                    coefs = GompertzParam['x']
                    newForecast = self.gompertz(forecastTime, coefs)
                    success = NUM.isinf(newForecast).sum() == 0
                except:
                    pass

                #### Update Bad Record Boolean Array ####
                if not success:
                    if isSubset:
                        self.gompertzWarningArray[ids[i]] = True
                    else:
                        self.gompertzWarningArray[i] = True
                else:
                    #### Add Forecast Coefficients ####
                    if not validation:
                        if isSubset:
                            self.gompertzCoef[ids[i]] = (coefs[3], coefs[0],
                                                         -NUM.log(coefs[1], dtype=NUM.float64),
                                                         -NUM.log(coefs[2], dtype=NUM.float64))
                        else:
                            self.gompertzCoef[i] = (coefs[3], coefs[0],
                                                    -NUM.log(coefs[1], dtype=NUM.float64),
                                                    -NUM.log(coefs[2], dtype=NUM.float64))

            #### Mean Forecast For All Bad Records ####
            if not success:
                newForecast = NUM.repeat(locationData.mean(), forecastTime)

            #### Update Forecast ####
            forecast[:,i] = newForecast

            ARCPY.SetProgressorPosition()

        ssd, rmse = self.getStats(forecast, validation = validation, ids = ids)

        return forecast, ssd, rmse

    def report(self, cube = None, varName = None, print = False):
        self.table = createForecastReport(self, cube = cube, varName = varName)

        if print:
            ARCPY.AddMessage(self.table)

        return self.table

def regenGeneralCubeReport(cube, varName):
    import SSCube as CUBE

    if isinstance(cube, CUBE.SSCube):
        if varName is None:
            for v in cube.dataset.variables:
                if v.endswith("_FIT"):
                    varName = v.split("FORECAST_")[-1].split("_FIT")[0]
                    break

        analysisMask = cube.obtainVariableMask(varName)
        cube.cubeInfo.reset_search_info(mask=analysisMask)
        tiledMask = NUM.tile(analysisMask, cube.cubeInfo.num_time)
        tiledMask = tiledMask.reshape(cube.numTime, cube.numRows, cube.numCols)

        #### Retrieve Values from Cube ####
        fillZeros = varName[-6:] == '_ZEROS'
        y = cube.obtainValues(varName, flatten=False,
                                    fillZeros=fillZeros) * 1.0

        #### One-Dimensional (flattened) Masks ####
        tiledMask = tiledMask.ravel()
        y = y.ravel()
        #### Set Stats ####
        cube.setStats(y, tiledMask)

    return cube.generalCubeReport()

def createForecastReport(forecastObject, cube=None, varName=None):
    import locale as LOCALE

    table = ""
    if forecastObject.forecastType != 2:
        cols = [ ARCPY.GetIDMessage(i) for i in [84657, 84271, 84272, 84261, 84414, 84262] ]
        rows = [cols]

        #### RMSE Stats ####
        rmseStats = UTILS.arraySummaryStats(forecastObject.rmse)
        row = [ARCPY.GetIDMessage(84987)] + [ UTILS.formatValue(i, "%0.2f") for i in rmseStats ]
        rows.append(row)

        #### Train SSD Stats ####
        if forecastObject.doValidation:
            validStats = UTILS.arraySummaryStats(forecastObject.validationRMSE)
            row = [ARCPY.GetIDMessage(84988)] + [ UTILS.formatValue(i, "%0.2f") for i in validStats ]
            rows.append(row)

        #### Create Output Table ####
        justify = ['left'] + ['right'] * 5
        header = ARCPY.GetIDMessage(84991)
        rows.append("EMPTY")
        table += UTILS.outputTextTable(rows, header = header, pad = 1, justify = justify,
                                       colPad = 2, titleFillToken = "-", emptyFillToken = "-", force2Txt=False)


        #### Summary of Curve Types ####
        if forecastObject.forecastType == 3:

            #### Create Method Count Dict ####
            resDict = {'mean': 0, 'linear': 0, 'parabolic': 0, 
                        'exponential': 0, 'gompertz': 0}
            for method in forecastObject.methods:
                resDict[method] += 1

            #### Auto Detect ####
            isAuto = forecastObject.fitType.upper() == "AUTO_DETECT"

            #### Has Mean ####
            hasMean = resDict['mean'] > 0
           
            #### Combined Bool for Summary ####
            if isAuto or hasMean:
            
                #### Shared Info for Table ####
                rows = [[ARCPY.GetIDMessage(84999), ARCPY.GetIDMessage(84965), 
                         ARCPY.GetIDMessage(84996)]]

                methodOrder = ['linear', 'parabolic', 'exponential', 'gompertz', 'mean']
                n = forecastObject.numLocations

                if isAuto:
                    #### Logic Loop for Auto-Detect ####
                    for method in methodOrder:
                        methodLab = curveType2Label[method]
                        count = resDict[method]
                        perc = (count / n) * 100
                        if method == 'mean':
                            if count:
                                rows.append([methodLab, str(count), UTILS.formatValue(perc, '%0.2f')])
                        else:
                           rows.append([methodLab, str(count), UTILS.formatValue(perc, '%0.2f')])

                else:
                    #### Logic Loop for Single Method with Mean ####
                    for method in methodOrder:
                        methodLab = curveType2Label[method]
                        count = resDict[method]
                        if count:
                            perc = (count / n) * 100
                            rows.append([methodLab, str(count), UTILS.formatValue(perc, '%0.2f')])

                #### Shared Final Table ####
                rows.append("EMPTY")
                justify = ['left', 'right', 'right']
                header = ARCPY.GetIDMessage(84984)
                table += UTILS.outputTextTable(rows, header = header, pad = 1, justify = justify,
                                    colPad = 3, titleFillToken = "-", emptyFillToken = "-", force2Txt=False)

    #### Get Hybrid Info ####
    else:
        cols = [ARCPY.GetIDMessage(84992)] + [ ARCPY.GetIDMessage(i) for i in [84271, 84272, 84261, 84414, 84262] ]
        rows = [cols]

        #### Input Forecast Cube Info ####
        if forecastObject.doValidation:
            header = ARCPY.GetIDMessage(84993)
            targetCollection = forecastObject.validationRMSECollection
            finalValues = forecastObject.validationRMSE
            pass
        else:
            header = ARCPY.GetIDMessage(84994)
            targetCollection = forecastObject.rmseCollection
            finalValues = forecastObject.rmse
            pass

        for ind, data in enumerate(targetCollection):
            basename = OS.path.basename(forecastObject.cubeObjects[ind].path)
            filename = OS.path.splitext(basename)[0]
            rmseStats = UTILS.arraySummaryStats(data)
            row = [filename] + [ UTILS.formatValue(i, "%0.2f") for i in rmseStats]
            rows.append(row)

        #### Add Empty Space Before Output Cube ####
        rows.append([""] * 6)

        #### Output Cube Info ####
        basename = OS.path.basename(forecastObject.outputFC)
        filename = OS.path.splitext(basename)[0]
        rmseStats = UTILS.arraySummaryStats(finalValues)
        row = [filename] + [ UTILS.formatValue(i, "%0.2f") for i in rmseStats]
        rows.append(row)
        rows.append("EMPTY")

        #### Create Output Table ####
        justify = ['left'] + ['right'] * 5
        table += UTILS.outputTextTable(rows, header = header, pad = 1, justify = justify,
                                       colPad = 2, titleFillToken = "-", emptyFillToken = "-", force2Txt=False)

        rfList = []
        header = ARCPY.GetIDMessage(84995)
        methodDict = JSON.loads(forecastObject.jsonMethodStr)
        rows = [[ARCPY.GetIDMessage(84978), ARCPY.GetIDMessage(84965), ARCPY.GetIDMessage(84996)]]

        equivalentMethodsSta = None
        if not forecastObject.useValidation:
            rows = [[ARCPY.GetIDMessage(84978), ARCPY.GetIDMessage(220029), ARCPY.GetIDMessage(220030)]]
            equivalentMethodsSta = forecastObject.getEquivalentMethodsSta()

        staRows = []
        percRemains = 100.0
        cnt = 0

        if equivalentMethodsSta is None:
            for k, v in methodDict.items():
                count = (forecastObject.methodInts == int(k)).sum()
                cnt += 1
                if cnt != len(methodDict.keys()):
                    perc = round(count / forecastObject.numValidLocations * 100, 2)
                    percRemains -= perc
                else:
                    perc = percRemains
                staRows.append([v, count, perc])
        else:
            for k, v in methodDict.items():
                count = (forecastObject.methodInts == int(k)).sum()
                cnt += 1
                if cnt != len(methodDict.keys()):
                    perc = round(count / forecastObject.numValidLocations * 100, 2)
                    percRemains -= perc
                else:
                    perc = percRemains
                countEquv = 0
                if v in equivalentMethodsSta:
                    countEquv = equivalentMethodsSta[v]
                percEquv = round(countEquv / forecastObject.numValidLocations * 100, 2)
                staRows.append([v, count, perc, countEquv, percEquv])

            existingMethods = set(methodDict.values())
            for name in equivalentMethodsSta.keys():
                if name not in existingMethods:
                    countEquv = equivalentMethodsSta[name]
                    percEquv = round(countEquv / forecastObject.numValidLocations * 100, 2)
                    staRows.append([name, 0, 0, countEquv, percEquv])

        staRows = sorted(staRows, key=lambda x: x[0])
        staRows = sorted(staRows, key=lambda x: x[1], reverse=True)

        for data in staRows:
            v = data[0]
            count = data[1]
            perc = data[2]
            if "forest-based" in v:
                rfList.append(v)
                rows.append([
                    ["Forest-based", UTILS.buildSuperscript(len(rfList))],
                    "%i" % count,
                    UTILS.formatValue(perc, "%0.2f")])
            elif v.startswith("exponential smoothing"):
                rfList.append(v)
                rows.append([
                    ["Exponential Smoothing", UTILS.buildSuperscript(len(rfList))],
                    "%i" % count,
                    UTILS.formatValue(perc, "%0.2f")])
            elif v.startswith("Time Series AI"):
                rfList.append(v)
                rows.append(["Time Series AI model", "%i" % count, UTILS.formatValue(perc, "%0.2f")])
            else:
                rows.append([evalType2Label[v], "%i" % count, UTILS.formatValue(perc, "%0.2f")])

            if len(data) > 3:
                rows[-1][1] = "{0} ({1})".format(count, LOCALE.format_string("%0.2f", perc))
                rows[-1][2] = "{0} ({1})".format(data[-2], LOCALE.format_string("%0.2f", data[-1]))
        rows.append("EMPTY")

        justify = ["left", "right", "right"]

        footnotes = None
        if len(rfList):
            footnotes = []
            #### Signature meaning note ####
            for id, name in enumerate(rfList):
                footnotes.append("{0}. {1}".format(id+1, name))

        table += UTILS.outputTextTable(rows, header = header, footnote=footnotes,
                                       pad = 1, justify = justify,
                                       colPad = 2, titleFillToken = "-", emptyFillToken = "-", force2Txt=False)

    return table

def tsOutlierReport(forecastCube, forecastObject):

    rows = []
    tsOut = forecastObject.tsOutliers
    header = ARCPY.GetIDMessage(220083)
    rows.append([ARCPY.GetIDMessage(220078), str(int(tsOut.numLocationsWithOutliers))])
    rows.append([ARCPY.GetIDMessage(220079), UTILS.formatValue(tsOut.percLocationsWithOutliers, "%0.2f")])
    sumStr = "{0}; {1}; {2}"
    locationSum = sumStr.format(str(int(tsOut.minOutliersByLocation)), 
                                UTILS.formatValue(tsOut.meanOutliersByLocation, "%0.2f"),
                                str(int(tsOut.maxOutliersByLocation)))
    rows.append([ARCPY.GetIDMessage(220080), locationSum])

    timeSum = sumStr.format(str(int(tsOut.minOutliersByTime)), 
                            UTILS.formatValue(tsOut.meanOutliersByTime, "%0.2f"),
                            str(int(tsOut.maxOutliersByTime)))
    rows.append([ARCPY.GetIDMessage(220081), timeSum])

    #### Only Show Max Time Bin if There are Outliers ####
    if tsOut.numOutliersOverTime > 0:

        #### Forecast Start and End Times ####
        if forecastCube.isStartTime:
            spanStr1 = ARCPY.GetIDMessage(84627)
            spanStr2 = ARCPY.GetIDMessage(84628)
            tAlign = ARCPY.GetIDMessage(84632)
        else:
            spanStr1 = ARCPY.GetIDMessage(84629)
            spanStr2 = ARCPY.GetIDMessage(84630)
            tAlign = ARCPY.GetIDMessage(84633)

        #### Time Step Intervals ####
        startTimes, endTimes = forecastCube.getOutputTimeFieldInfo()
        rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(220082), rowSpan=4), spanStr1 ])

        #### Time Step Interval With Largest Outlier ####
        startBin = tsOut.maxOutliersTimeBin
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(startTimes[startBin]), align="right") ])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right") ])
        if forecastCube.isStartTime:
            rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(startTimes[startBin+1]), align="right") ])
        else:
            rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(endTimes[startBin]), align="right") ])

    table = UTILS.outputTextTable(rows, header = header, pad = 1,
                                  justify = ['left', 'right'],
                                  titleFillToken = "-",
                                  emptyFillToken = "-", emphasizeHeadRow=False,
                                  force2Txt=False)

    return table

def getSeasonalRows(forecastObject):
    """Analysis Details for Seasons and Time Window for Forest and Exp Smoothing Only."""

    rows = []
    methodDict = JSON.loads(forecastObject.jsonMethodStr)
    autoDetect = methodDict['0'].endswith("auto_detect")
    numLocations = forecastObject.numLocations

    if autoDetect:
        #### % Seasonal ####
        percSeasonal = ((forecastObject.seasonInt > 1).sum() / numLocations) * 100.
        percSeasonal = UTILS.formatValue(percSeasonal, "%0.2f")
        rows.append([ARCPY.GetIDMessage(84983), percSeasonal])

        #### Seasonal Stats ####
        seasonStats = UTILS.arraySummaryStats(abs(forecastObject.seasonInt))

        if forecastObject.forecastType == 0:
            labels = [ARCPY.GetIDMessage(i) for i in range(220018, 220023)]
        else:
            labels = [ARCPY.GetIDMessage(i) for i in range(220012, 220017)]

        for ind, value in enumerate(seasonStats):
            rows.append( [labels[ind], UTILS.formatValue(value, "%0.2f")] )
    else:
        swValue = str(abs(forecastObject.seasonInt[0]))
        if forecastObject.forecastType == 0:
            #### % Seasonal is N/A ####
            rows.append( [ARCPY.GetIDMessage(84983), ARCPY.GetIDMessage(84982)] )

            #### User Defined Time Window ####
            rows.append( [ARCPY.GetIDMessage(220023), swValue] )
        else:
            #### % Seasonal ####
            percSeasonal = ((forecastObject.seasonInt > 1).sum() / numLocations) * 100.
            percSeasonal = UTILS.formatValue(percSeasonal, "%0.2f")
            rows.append([ARCPY.GetIDMessage(84983), percSeasonal])

            #### User Defined Seasons ####
            rows.append([ARCPY.GetIDMessage(220017), swValue] )

    return rows

def forecastAnalysisReport(initCubeObject, forecastCube, forecastObject, inputVar = None, cubeObjects = []):

    forecastType = forecastObject.forecastType

    outputTable = ""
    if forecastType != 2:
        #### Regenerate Initial Cube Report (Forest, Exp Smoothing or Curve Fit) ####
        outputTable += regenGeneralCubeReport(initCubeObject, inputVar)

    #### Set Base Table Info ####
    header = ARCPY.GetIDMessage(84845)
    rows = []

    #### List Input Forecast Cubes (Evaluate) or Input Cube (Other Tools) ####
    if forecastType == 2:
        rows.append([ARCPY.GetIDMessage(84977), ARCPY.GetIDMessage(84978)])

        for cube in cubeObjects:
            outPath, outName = OS.path.split(cube.path)
            cubeName, cubeExt = OS.path.splitext(outName)
            row = [outName, str(forecastType2Label[int(cube.dataset.forecast_type)])]
            rows.append(row)
    else:
        rows.append([ARCPY.GetIDMessage(84979), ARCPY.GetIDMessage(84978)])
        outPath, outName = OS.path.split(initCubeObject.path)
        cubeName, cubeExt = OS.path.splitext(outName)
        row = [outName, str(forecastType2Label[forecastType])]
        rows.append(row)

    rows.append("EMPTY")

    #### Number of Forecast Time Steps ####
    startBin = int(forecastCube.dataset.begin_forecast_bin)
    numForecast = forecastCube.numTime - startBin

    rows.append([ARCPY.GetIDMessage(84980), str(numForecast)])

    #### Validation Size ####
    if forecastObject.forecastType == 2:
        if forecastObject.useValidation:
            rows.append([ARCPY.GetIDMessage(84981), str(forecastObject.validationSize)])
    else:
        rows.append([ARCPY.GetIDMessage(84981), str(forecastObject.validationSize)])

    #### Seasonal Info ####
    if forecastType <= 1:
        #### Forest and Exponential Smoothing Only ####
        rows += getSeasonalRows(forecastObject)

    elif forecastType == 2:
        #### Evaluate Tool - % Seasonal Only ####
        methodDict = JSON.loads(forecastObject.jsonMethodStr)
        num = 0
        for ind, methodInt in enumerate(forecastObject.methodInts):
            method = methodDict[str(methodInt)]
            if method.startswith("forest-based"):
                if method.endswith("auto_detect"):
                    if forecastObject.seasonInt[ind] > 1:
                        num += 1
            elif method.startswith('exponential smoothing'):
                if forecastObject.seasonInt[ind] > 1:
                    num += 1
                
        numLocations = forecastObject.numLocations
        percSeasonal = UTILS.formatValue(num/numLocations * 100, "%0.2f")
        rows.append([ARCPY.GetIDMessage(84983), percSeasonal])

    else:
        #### Curve Fit - % Seasonal is N/A ####
        rows.append([ARCPY.GetIDMessage(84983), ARCPY.GetIDMessage(84982)])

    rows.append("EMPTY")

    #### Forecast Start and End Times ####
    if forecastCube.isStartTime:
        spanStr1 = ARCPY.GetIDMessage(84627)
        spanStr2 = ARCPY.GetIDMessage(84628)
        tAlign = ARCPY.GetIDMessage(84632)
    else:
        spanStr1 = ARCPY.GetIDMessage(84629)
        spanStr2 = ARCPY.GetIDMessage(84630)
        tAlign = ARCPY.GetIDMessage(84633)

    #### Start Forecast Time Step Interval ####
    startTimes, endTimes = forecastCube.getOutputTimeFieldInfo(exact = True)
    rows.append([{"data": ARCPY.GetIDMessage(84985), "prop": {"rowspan": 4}}, spanStr1 ])

    #### First Time Step Interval Equal to Last When Predicting One ####
    if numForecast == 1:
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(forecastCube.lastStartTime), align="right") ])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right") ])
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(forecastCube.lastEndTime), align="right") ])
    else:
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(startTimes[startBin]), align="right") ])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right") ])
        if forecastCube.isStartTime:
            rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(startTimes[startBin+1]), align="right") ])
        else:
            rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(endTimes[startBin]), align="right") ])

    #### Empty Space Row to Match Init Cube Report ####
    rows.append(["", ""])

    #### Last Time Step Interval ####
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84986), rowSpan=4), spanStr1 ])
    rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(forecastCube.lastStartTime), align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(forecastCube.lastEndTime), align="right")])
    rows.append("EMPTY")

    outputTable += UTILS.outputTextTable(rows, header = header, pad = 1,
                                         justify = ['left', 'right'],
                                         titleFillToken = "-",
                                         emptyFillToken = "-",
                                         force2Txt=False)

    if forecastType == 2:
        outputTable += forecastObject.report(initCubeObject)
    else:
        outputTable += forecastObject.report(initCubeObject, inputVar)

    if forecastObject.outlierOption is not None:
        outputTable += tsOutlierReport(forecastCube, forecastObject)

    return outputTable

def initializeForecastTool(inputCube, inputVar):
    import SSCube as CUBE
    import SSPanel as PANEL
    import numpy as NUM

    #### Warn if using COUNT ####
    if inputVar == "COUNT":
        ARCPY.AddIDMessage("WARNING", 110322)

    #### Boolean for Panel Or Not ####
    isPanelCube = isPanelFromFile(inputCube)

    validIds = None
    mask = None
    analysisMask = None

    if not isPanelCube:
        cube = CUBE.SSCube(inputCube)
        mask = cube.obtainVariableMask(inputVar)
        validIds = NUM.where(mask.ravel())[0]
        var = cube.obtainValues(inputVar)
        data = var.reshape(cube.numTime, (cube.numCols * cube.numRows))[:, validIds]
        analysisMask = cube.getAnalysisMask(inputVar, None)
    else:
        cube = PANEL.SSPanel(inputCube)
        data = cube.obtainValues(inputVar)

    if hasattr(cube, "isForecast") and cube.isForecast:
        ARCPY.AddIDMessage("ERROR", 110321)
        raise SystemExit()

    return cube, data.data.copy(), analysisMask, isPanelCube

def initializeMultivariateForecastTool(inputCube, inputVar, otherVars, clusterZone= None, clusterVar = None):
    import SSCube as CUBE
    import SSPanel as PANEL
    import numpy as NUM

    #### Warn if using COUNT ####
    if inputVar == "COUNT":
        ARCPY.AddIDMessage("WARNING", 110322)

    #### Boolean for Panel Or Not ####
    isPanelCube = isPanelFromFile(inputCube)

    validIds = None
    mask = None
    analysisMask = None
    otherData = []
    xy = None
    clustData = None    
    varZone = None
    locations = None

    if clusterZone is not None:
        if clusterZone == "BY_CLUSTER":
            varZone = "TSCLUST_{0}_CLUSTER".format(clusterVar)

    if not isPanelCube:
        cube = CUBE.SSCube(inputCube)
        mask = cube.obtainVariableMask(inputVar)
        maskFlat = mask.ravel()

        locations = NUM.arange(cube.sizeSlice, dtype = NUM.int32)

        for otherVar  in otherVars:
            maskTemp = cube.obtainVariableMask(otherVar)
            maskFlatTemp = maskTemp.ravel()
            maskFlat = maskFlat*maskFlatTemp

        validIds = NUM.where(maskFlat)[0]
        locations = locations[validIds]

        var = cube.obtainValues(inputVar)
        data = var.reshape(cube.numTime, (cube.numCols * cube.numRows))[:, validIds]

        for otherVar  in otherVars:
            var1 = cube.obtainValues(otherVar)
            data1 = var1.reshape(cube.numTime, (cube.numCols * cube.numRows))[:, validIds]
            otherData.append(data1.data.copy())

        xv, yv = NUM.meshgrid(cube.x, cube.y)
        x = xv.ravel()[maskFlat]
        y = yv.ravel()[maskFlat]
        xy = NUM.zeros((len(x),2), float)
        xy.T[0]= x;
        xy.T[1]= y;

        analysisMask = maskFlat
    else:
        cube = PANEL.SSPanel(inputCube)
        data = cube.obtainValues(inputVar)
        for otherVar  in otherVars:
            data1 = cube.obtainValues(otherVar)
            otherData.append(data1.data.copy())
            
        xy = NUM.zeros((len(cube.x),2), float)
        xy.T[0]= cube.x;
        xy.T[1]= cube.y;
        validIds = NUM.arange(len(cube.x))
        locations = validIds
            
    if hasattr(cube, "isForecast") and cube.isForecast:
        ARCPY.AddIDMessage("ERROR", 110321)
        raise SystemExit()

    if varZone is not None:
        clustData = cube.obtainValues(varZone)
        clustData = clustData.ravel()

        if not isPanelCube:
            clustData = clustData[maskFlat]

    return cube, data.data.copy(), analysisMask, isPanelCube, otherData, xy, validIds, clustData, locations

def AdjustFieldLength(candidatesFields):
    """ This method changes the Method Field length when is > 255 """
    for candField in candidatesFields:
        if candField.name == "METHOD" and len(candField.data) > 0:
            #### Avoid change Field Maximum length
            if len(candField.data[0]) > 255:
                candField.length = len(candField.data[0])
            break

def finalizeForecastTool(cube, forecastObject, inputVar, outputFC, analysisMask,
                         outputCube = None, returnFieldsInfo = False, popupFieldThreshold = 5e6,
                         theme="FORECAST_RESULTS", listOtherVariables = None, clusterData = None):
    import SSCube as CUBE
    import SSPanel as PANEL
    import numpy as NUM
    cubeForecastPath = None
    tempForecastCube = False

    if forecastObject.forecastType == 2:
        theme = "FORECAST_RESULTS"

    #### Create Forecast Cube ####
    if outputCube is None:
        outputCube = UTILS.returnScratchName("FORECAST_CUBE","TEXT", extension= "nc")
        tempForecastCube = True

    if forecastObject.forecastType == 2:
        #### Copy Entire Cube (Hybrid Only) ####
        cube.copyForecastCubeFile(outputCube, forecastObject)
    else:
        cube.createForecastCubeFile(outputCube, forecastObject)

    #### Create Output Cube Object and Add Forecast Variables ####
    forecastCube = None
    if not cube.isPanel:
        forecastCube = CUBE.SSCube(outputCube, 'a')
        forecastCube.addForecastVariables(forecastObject, inputVar, analysisMask, listOtherVariables)
    else:
        forecastCube = PANEL.SSPanel(outputCube, 'a')
        forecastCube.addForecastVariables(forecastObject, inputVar, listOtherVariables)

    #### Add Mann-Kendall Only for Non-Temp Forecast Cubes ####
    if not tempForecastCube:
        #### Add Mann-Kendall ####
        forecastCube.mannKendall(inputVar)
        if listOtherVariables is not None:
            for ind, varName in enumerate(listOtherVariables):
                forecastCube.mannKendall(varName)

    if forecastObject.forecastType == 2:
        if forecastObject.useValidation:
            forecastCube.dataset.has_validation = "TRUE"
            forecastCube.hasValidation = True
        else:
            forecastCube.dataset.has_validation = "FALSE"
            forecastCube.hasValidation = False

    #### Report ####
    if forecastObject.forecastType == 2:
        #### Hybrid ####
        reportTables = forecastAnalysisReport(cube, forecastCube, forecastObject, inputVar, 
                                             forecastObject.cubeObjects)
    else:
        reportTables = forecastAnalysisReport(cube, forecastCube, forecastObject, inputVar)
    ARCPY.AddMessage(reportTables)

    #### Close Input Cube ####
    cube.close()

    #### Get Candidate Fields for Output FC ####
    candidateFields = forecastCube.forecastOutputFields2D(outputFC, inputVar)

    if forecastObject.forecastType == 2:
        #### For hybrid tool, update RMSE field name ####
        for cf in candidateFields:
            if cf.name == "F_RMSE":
                cf.alias = "Best Forecast Root Mean Square Error"
            if cf.name == "V_RMSE":
                cf.alias = "Best Validation Root Mean Square Error"
        candidateFields += forecastObject.generateAllRMSEFields2D()
        
    if clusterData is not None:
        candidateField = SSDO.CandidateField("CLUSTER_ID",
                                             "LONG",
                                              data = clusterData,
                                              alias=ARCPY.GetIDMessage(84790))
        candidateFields.append(candidateField)
        
    

    N = forecastObject.numLocations
    T = forecastObject.numTime
    extraFCFieldInfo = []
    if forecastObject.forecastType == 2:
        popupFieldThreshold /= 5
    if N * T <= popupFieldThreshold:
        #### Directly Generate the HTML Pop-Ups Field ####
        if not UTILS.isShapeFile(outputFC):
            if forecastObject.forecastType == 2:
                #### For hybrid tool, use its own function to generate the popup charts with extra information ####
                chartField = generateCubePopupChartField(forecastCube, inputVar,
                                                         theme=theme,
                                                         additionalData=forecastObject.prepareCompareData())
            else:
                chartField = generateCubePopupChartField(forecastCube, inputVar, theme=theme)
            candidateFields.append(chartField)
        else:
            #### Throw Warning That We Ignore PopUps for Shapefiles ####
            ARCPY.AddIDMessage("WARNING", 110315)
        AdjustFieldLength(candidateFields)

        #### Create Output FC and Close Forecast Cube Object ####
        forecastCube.exportFeatures2D(outputFC, candidateFields)
    else:
        AdjustFieldLength(candidateFields)
        
        #### Create Output FC and Close Forecast Cube Object ####
        forecastCube.exportFeatures2D(outputFC, candidateFields)

        #### enerate the Generate HTML Pop-Ups ####
        if not UTILS.isShapeFile(outputFC):
            try:
                popupFieldName = "HTML_CHART"
                popupFieldAlias = "Time Series HTML Pop-Up"
                additionalData = None
                if forecastObject.forecastType == 2:
                    #### For hybrid tool, use its own function to generate extra information ####
                    additionalData = forecastObject.prepareCompareData()

                _data, _varName, _theme, _additionalData = generateCubePopupChartField(forecastCube, inputVar,
                                                                                       theme=theme,
                                                                                       additionalData=additionalData,
                                                                                       prepareDataOnly=True)
                batchSize = int(popupFieldThreshold / T)
                currentPos = 0
                popupUpdateCursor = None
                totoalUpdated = 0
                rowLengthLimit = 1e4
                while currentPos < N:
                    rows, maxRowLength = generateCubePopupChartFieldFromData(_data, _varName, _theme,
                                                                             additionalData=_additionalData,
                                                                             indStart=currentPos,
                                                                             indEnd=currentPos + batchSize)
                    if currentPos == 0:
                        #### Create New Field for the FC ####
                        rowLengthLimit = int(maxRowLength * 1.1)
                        ARCPY.management.AddFields(
                            outputFC,
                            [[popupFieldName, 'Text', popupFieldAlias, rowLengthLimit, None, None]])
                        fields = ['OBJECTID', popupFieldName]
                        popupUpdateCursor = ARCPY.da.UpdateCursor(outputFC, fields)

                    localPos = 0
                    recordSize = len(rows)
                    for r in popupUpdateCursor:
                        if len(rows[localPos]) < rowLengthLimit:
                            r[1] = rows[localPos]
                        else:
                            r[1] = ""
                        popupUpdateCursor.updateRow(r)
                        totoalUpdated += 1
                        localPos += 1
                        if localPos >= recordSize:
                            break

                    currentPos += batchSize

                extraFCFieldInfo.append({"name": popupFieldName, "alias": popupFieldAlias})
            except:
                ARCPY.AddIDMessage("ERROR", ARCPY.GetIDMessage(426))
                raise SystemExit()
        else:
            #### Throw Warning That We Ignore PopUps for Shapefiles ####
            ARCPY.AddIDMessage("WARNING", 110315)

    forecastCube.close()
    #### Remove Temporal Cube --(Temp approach) ####
    if tempForecastCube:
        try:
            OS.remove(outputCube)
        except:
            pass
    
    if returnFieldsInfo:
        if not UTILS.isShapeFile(outputFC):
            fieldsInfo = [{"name": f.name, "alias": f.alias} for f in candidateFields] + extraFCFieldInfo
        else:
            fieldsInfo = [{"name": f.name, "alias": f.name} for f in candidateFields]
        return {"fieldsInfo": fieldsInfo}


class HybridForecast(object):
    def __init__(self, cubeObjects, outputFC, useValidation=True, outlierOption = None):
        UTILS.assignClassAttr(self, locals())
        self.numCubes = len(cubeObjects)
        self.forecastType = 2
        self.doValidation = self.useValidation
        self.cubeWithShortestPredTime = cubeObjects[0]

        #### Validate and Set Attributes ####
        self.__validate()

        self.generatePopups = not UTILS.isShapeFile(outputFC)
        # if self.generatePopups:
        self.beginForecastBin = int(self.cubeObjects[0].beginForecastBin)
        self.forecastCollection = []
        self.fitCollection = []
        self.intvHighCollection = []
        self.intvLowCollection = []
        self.seasonCollection = []
        self.methodCollection = []
        self.rmseCollection = []
        self.validationRMSECollection = []
        self.allMethodNames = set()
        self.allMethodNameAlternative = {}
        self.equivalentMethodMat = None
        self.dummyFieldNames = []

        #### Choose Best Method ####
        if useValidation:
            self.__choose()
        else:
            self.__chooseWithHLN()

    def __choose(self):
        #### Default Progress ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220010))

        #### Get Base Cube Info Data ####
        cube = self.cubeObjects[0]
        self.isPanel = cube.isPanel
        self.varName = None
        prefix = None
        self.validIds = None
        self.analysisMask = None
        self.numValidLocations = self.numLocations
        self.selectedSolutionIds = None

        for varName in cube.obtainVariableList():
            if varName.endswith("_FIT"):
                self.varName = varName.split("FORECAST_")[-1].split("_FIT")[0]
                prefix = varName.split("_FIT")[0]
                self.inputVar = self.varName

                #### Warn if using COUNT ####
                if self.inputVar == "COUNT":
                    ARCPY.AddIDMessage("WARNING", 110322)

                if not self.isPanel:
                    self.mask = cube.obtainVariableMask(self.varName)
                    self.validIds = NUM.where(self.mask.ravel())[0]
                    self.analysisMask = cube.getAnalysisMask(self.varName, None)
                    self.numValidLocations = self.analysisMask.sum()

                self.selectedSolutionIds = NUM.zeros(self.numValidLocations, dtype=int)
                self.rawForecast = self.getVariable(cube, self.varName)[: self.numTimeWithPred, :]
                self.fitForecast = self.getVariable(cube, prefix+"_FIT")[: self.numTimeWithPred, :]
                self.rmse = self.getVariable(cube, prefix+"_RMSE")
                self.rmseCollection.append(self.rmse.copy())
                self.seasonInt = self.getVariable(cube, prefix+"_SEASON")
                self.highIntervals = self.getVariable(cube, prefix+"_HIGH")[: self.numTimeWithPred, :]
                self.lowIntervals = self.getVariable(cube, prefix+"_LOW")[: self.numTimeWithPred, :]
                methods = self.getVariable(cube, prefix+"_METHOD")
                #### Map Method(s) ####
                stC = cube.dataset.json_method_str
                if stC[-1] != "}":
                    stC +="}"
                cubeDict = JSON.loads(stC)
                self.currentMethods = [cubeDict[str(i)] for i in methods]
                if self.useValidation:
                    self.validationRMSE = self.getVariable(cube, prefix+"_VALIDRMSE")
                    self.validationRMSECollection.append(self.validationRMSE.copy())
                if self.generatePopups:
                    self.forecastCollection.append(self.rawForecast[self.beginForecastBin:].copy())
                    self.fitCollection.append(self.fitForecast[0: self.beginForecastBin].copy())
                    self.seasonCollection.append(self.seasonInt.copy())
                    self.intvHighCollection.append(self.highIntervals[self.beginForecastBin:].copy())
                    self.intvLowCollection.append(self.lowIntervals[self.beginForecastBin:].copy())
                    self.methodCollection.append(self.currentMethods.copy())
                break

        #### Do Analysis ####
        for ind, cube in enumerate(self.cubeObjects[1:]):
            #### RMSE Criteria Decision ####
            if self.useValidation:
                ext = "_VALIDRMSE"
                var = self.validationRMSE
                targetCollection = self.validationRMSECollection
            else:
                ext = "_RMSE"
                var = self.rmse
                targetCollection = self.rmseCollection

            #### Assess Whether Better than Last ####
            rmse = self.getVariable(cube, prefix+ext)
            ids = NUM.where(rmse < var)[0]
            targetCollection.append(rmse.copy())
            self.selectedSolutionIds[ids] = ind + 1

            if len(ids) or self.generatePopups:
                data_forecast = self.getVariable(cube, self.varName)[: self.numTimeWithPred, :]
                data_fit = self.getVariable(cube, prefix+"_FIT")[: self.numTimeWithPred, :]
                data_season = self.getVariable(cube, prefix+"_SEASON")
                data_high = self.getVariable(cube, prefix+"_HIGH")[: self.numTimeWithPred, :]
                data_low = self.getVariable(cube, prefix+"_LOW")[: self.numTimeWithPred, :]
                data_rmse = self.getVariable(cube, prefix+"_RMSE")
                if self.doValidation:
                    data_validRMSE = self.getVariable(cube, prefix+"_VALIDRMSE")

                #### Update Methods ####
                stC = cube.dataset.json_method_str
                if stC[-1] != "}":
                    stC += "}"
                cubeDict = JSON.loads(stC)
                methods = self.getVariable(cube, prefix + "_METHOD")

                if len(ids):
                    self.__updateVariable(data_forecast, self.rawForecast, ids)
                    self.__updateVariable(data_fit, self.fitForecast, ids)
                    self.__updateVariable(data_season, self.seasonInt, ids)
                    self.__updateVariable(data_high, self.highIntervals, ids)
                    self.__updateVariable(data_low, self.lowIntervals, ids)
                    self.__updateVariable(data_rmse, self.rmse, ids)
                    if self.doValidation:
                        self.__updateVariable(data_validRMSE, self.validationRMSE, ids)
                    for id in ids:
                        methodInt = methods[id]
                        self.currentMethods[id] = cubeDict[str(methodInt)]

                if self.generatePopups:
                    self.forecastCollection.append(data_forecast[self.beginForecastBin:].copy())
                    self.fitCollection.append(data_fit[0: self.beginForecastBin].copy())
                    self.seasonCollection.append(data_season.copy())
                    self.intvHighCollection.append(data_high[self.beginForecastBin:].copy())
                    self.intvLowCollection.append(data_low[self.beginForecastBin:].copy())
                    self.methodCollection.append([cubeDict[str(m)] for m in methods])

        #### Build JSON Method String ####
        self.__buildJSONMethodStr()

        self.allMethodNames = set(list(self.currentMethods))
        self.allMethodNameArray = NUM.array(list(self.allMethodNames))
        self.allMethodNameAlternative = self.__buildMethodAlternativeNames()

    def __chooseWithHLN(self):
        #### Get Base Cube Info Data ####
        cube = self.cubeObjects[0]
        self.isPanel = cube.isPanel
        self.validIds = None
        self.analysisMask = None
        self.numValidLocations = self.numLocations
        self.selectedSolutionIds = None
        rawValues = None

        for ind, cube in enumerate(self.cubeObjects):
            if ind == 0:
                if not self.isPanel:
                    self.mask = cube.obtainVariableMask(self.varName)
                    self.validIds = NUM.where(self.mask.ravel())[0]
                    self.analysisMask = cube.getAnalysisMask(self.varName, None)
                    self.numValidLocations = self.analysisMask.sum()

            #### Get All the Essential Data ####
            data_forecast = self.getVariable(cube, self.varName)[: self.numTimeWithPred, :]
            if ind == 0:
                rawValues = data_forecast[: self.beginForecastBin, :].copy()
            data_fit = self.getVariable(cube, "FORECAST_" + self.varName + "_FIT")[: self.numTimeWithPred, :]
            data_season = self.getVariable(cube, "FORECAST_" + self.varName + "_SEASON")
            data_high = self.getVariable(cube, "FORECAST_" + self.varName + "_HIGH")[: self.numTimeWithPred, :]
            data_low = self.getVariable(cube, "FORECAST_" + self.varName + "_LOW")[: self.numTimeWithPred, :]

            #### Get Methods ####
            stC = cube.dataset.json_method_str
            if stC[-1] != "}":
                stC += "}"
            cubeDict = JSON.loads(stC)
            for methodName in cubeDict.values():
                self.allMethodNames.add(methodName)
            methods = self.getVariable(cube, "FORECAST_" + self.varName + "_METHOD")

            self.forecastCollection.append(data_forecast[self.beginForecastBin:])
            self.fitCollection.append(data_fit[0: self.beginForecastBin])
            self.seasonCollection.append(data_season)
            self.intvHighCollection.append(data_high[self.beginForecastBin:])
            self.intvLowCollection.append(data_low[self.beginForecastBin:])
            self.methodCollection.append([cubeDict[str(m)] for m in methods])

            data_rmse = self.getVariable(cube, "FORECAST_" + self.varName + "_RMSE")
            self.rmseCollection.append(data_rmse)

        #### Prepare the Container for the Best Results ####
        self.selectedSolutionIds = NUM.zeros(self.numValidLocations, dtype=int)
        self.rawForecast = NUM.zeros((self.numTimeWithPred, self.numValidLocations), dtype=float)
        self.fitForecast = NUM.zeros((self.numTimeWithPred, self.numValidLocations), dtype=float)
        self.highIntervals = NUM.zeros((self.numTimeWithPred, self.numValidLocations), dtype=float)
        self.lowIntervals = NUM.zeros((self.numTimeWithPred, self.numValidLocations), dtype=float)
        self.rmse = NUM.zeros(self.numValidLocations, dtype=float)
        self.seasonInt = NUM.zeros(self.numValidLocations, dtype=int)

        #### Use HLN to get best solutions of each location ####
        numAllMethods = len(self.allMethodNames)
        numInputCubes = len(self.cubeObjects)
        self.equivalentMethodMat = NUM.full((self.numValidLocations, numAllMethods), -1, dtype=int)
        self.allMethodNameArray = NUM.array(list(self.allMethodNames))

        methodIdMap = {}
        self.currentMethods = [None] * self.numValidLocations
        for ind, name in enumerate(self.allMethodNameArray):
            methodIdMap[name] = ind

        targetRMSE = self.rmseCollection

        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220010), 0, self.numValidLocations, 1)
        for locationId in range(self.numValidLocations):
            uniqueMethods = set()
            candidateMethodInd_inCube = []
            candidateMethodInd_inDummyFields = []
            fitValues = []
            rmseValues = []
            raw = rawValues[:, locationId]
            stepBegin = 0
            for ind in range(numInputCubes):
                methodName = self.methodCollection[ind][locationId]
                if methodName.startswith("forest-based"):
                    timeWindow = abs(self.seasonCollection[ind][locationId])
                    stepBegin = max(timeWindow, stepBegin)
                if methodName not in uniqueMethods:
                    uniqueMethods.add(methodName)
                    fitValues.append(self.fitCollection[ind][:, locationId])
                    rmseValues.append(targetRMSE[ind][locationId])
                    candidateMethodInd_inCube.append(ind)
                    fieldInd = methodIdMap[methodName]
                    candidateMethodInd_inDummyFields.append(fieldInd)
                    self.equivalentMethodMat[locationId][fieldInd] = 0

            equivalentMethodInds = TS.HLNTestBatch(raw, fitValues, rmseValues, stepBegin, forecastSteps=self.addTime, alpha=0.05)
            self.equivalentMethodMat[locationId][candidateMethodInd_inDummyFields[equivalentMethodInds[0]]] = 2
            for id in equivalentMethodInds[1:]:
                self.equivalentMethodMat[locationId][candidateMethodInd_inDummyFields[id]] = 1

            #### Replace the values with the best method ####
            bestCubeId =candidateMethodInd_inCube[equivalentMethodInds[0]]
            self.selectedSolutionIds[locationId] = bestCubeId
            self.currentMethods[locationId] = self.allMethodNameArray[candidateMethodInd_inDummyFields[equivalentMethodInds[0]]]
            self.fitForecast[:self.beginForecastBin, locationId] = fitValues[equivalentMethodInds[0]]
            self.fitForecast[self.beginForecastBin:, locationId] = self.forecastCollection[bestCubeId][:, locationId]
            self.rawForecast[:self.beginForecastBin, locationId] = raw
            self.rawForecast[self.beginForecastBin:, locationId] = self.forecastCollection[bestCubeId][:, locationId]
            self.seasonInt[locationId] = self.seasonCollection[bestCubeId][locationId]
            if NUM.isnan(self.intvHighCollection[bestCubeId][0, locationId]):
                self.highIntervals[:, locationId] = None
                self.lowIntervals[:, locationId] = None
            else:
                self.highIntervals[:self.beginForecastBin, locationId] = raw
                self.lowIntervals[:self.beginForecastBin, locationId] = raw
                self.highIntervals[self.beginForecastBin:, locationId] = self.intvHighCollection[bestCubeId][:, locationId]
                self.lowIntervals[self.beginForecastBin:, locationId] = self.intvLowCollection[bestCubeId][:, locationId]
            self.rmse[locationId] = self.rmseCollection[bestCubeId][locationId]

        self.__buildJSONMethodStr()
        self.allMethodNameAlternative = self.__buildMethodAlternativeNames()

    def __buildJSONMethodStr(self):
        d = {}
        v = {}
        self.methodInts = NUM.zeros(self.numValidLocations, dtype = NUM.int32)
        c = 0
        for ind, value in enumerate(self.currentMethods):
            if value not in v:
                v[value] = c
                d[c] = value
                c += 1
            self.methodInts[ind] = v[value]

        self.jsonMethodStr = JSON.dumps(d)

    def __updateVariable(self, data, var2Update, ids):
        if data.ndim == 2:
            var2Update[:,ids] = data[:,ids]
        else:
            var2Update[ids] = data[ids]

    def getVariable(self, cube, varName):
        data = cube.obtainValues(varName, flatten = False)
        if not self.isPanel:
            if data.ndim == 3:
                data = data.ravel().reshape(cube.numTime, (cube.numCols * cube.numRows))[:, self.validIds]
            else:
                data = data.ravel()[self.validIds]
        return data.data.copy()

    def __buildMethodAlternativeNames(self):
        result = {}
        existingNames = set()
        existingAlias = set()
        complexMethodCount_alias = 1
        complexMethodCount_name = 1
        for methodStr in self.allMethodNameArray:
            result[methodStr] = {"count": 0}
        for methodStr in self.currentMethods:
            result[methodStr]["count"] += 1

        methodList = [[methodStr, result[methodStr]["count"]] for methodStr in result.keys()]

        methodList = sorted(methodList, key=lambda x: x[0])
        methodList = sorted(methodList, key=lambda x: x[1], reverse=True)

        for ind, item in enumerate(methodList):
            methodStr = item[0]
            methodHead = methodStr.split(";")[0]
            alias = methodHead

            if methodHead.startswith("forest-based") or methodHead.startswith("exponential smoothing"):
                aliasAppd = "[{}]".format(complexMethodCount_alias)
                complexMethodCount_alias += 1
            else:
                aliasAppd = ""
            if alias in evalType2Label:
                alias = evalType2Label[alias]
            else:
                alias = alias[0].upper() + alias[1:]

            while alias+aliasAppd in existingAlias:
                aliasAppd = "[{}]".format(complexMethodCount_alias)
                complexMethodCount_alias += 1

            alias += aliasAppd

            nameAppd = ""
            if methodStr.startswith("forest-based"):
                name = "FRST"
                nameAppd = str(complexMethodCount_name)
                complexMethodCount_name += 1
            elif methodStr.startswith("exponential smoothing"):
                name = "ES"
                nameAppd = str(complexMethodCount_name)
                complexMethodCount_name += 1
            elif methodStr == "exponential":
                name = "EXP"
            else:
                name = methodHead[0:6].upper()

            nameNew = name[0: 6 - len(nameAppd)] + nameAppd
            while nameNew in existingNames:
                nameNew = name[0: 6 - len(str(complexMethodCount_name))] + str(complexMethodCount_name)
                complexMethodCount_name += 1

            result[methodStr]["name"] = nameNew
            result[methodStr]["alias"] = alias
            existingNames.add(nameNew)
            existingAlias.add(alias)
        return result

    def generateAllRMSEFields2D(self):
        self.dummyFieldNames = []
        if self.doValidation:
            targetCollection = self.validationRMSECollection
            nameTemplate = "V_RMSE_{0}"
            aliasTemplate = "{0} Validation RMSE"
        else:
            targetCollection = self.rmseCollection
            nameTemplate = "F_RMSE_{0}"
            aliasTemplate = "{0} Forecast RMSE"

        candidateFieldList = []
        for ind, cube in enumerate(self.cubeObjects):
            basename = OS.path.basename(cube.path)
            filename = OS.path.splitext(basename)[0]
            data = targetCollection[ind]

            candidateField = SSDO.CandidateField(nameTemplate.format(ind+1),
                                                 "DOUBLE",
                                                 data=data,
                                                 alias=aliasTemplate.format(filename))
            candidateFieldList.append(candidateField)

        if self.equivalentMethodMat is not None:
            shortMethodNames = []
            shortMethodAlias = []
            for fullName in self.allMethodNameArray:
                shortMethodNames.append(self.allMethodNameAlternative[fullName]["name"])
                shortMethodAlias.append(self.allMethodNameAlternative[fullName]["alias"])
            shortMethodNames = NUM.array(shortMethodNames)
            shortMethodAlias = NUM.array(shortMethodAlias)

            fieldLength = 0
            equalMethodNames = [None] * self.numValidLocations
            for locationId in range(self.numValidLocations):
                equalMethods = shortMethodAlias[NUM.where(self.equivalentMethodMat[locationId] >= 1)]
                if len(equalMethods):
                    equalMethods = sorted(equalMethods)
                    methodsStr = " | ".join(equalMethods)
                    fieldLength = max(fieldLength, len(methodsStr))
                    equalMethodNames[locationId] = methodsStr
            fieldLength += 5
            candidateField = SSDO.CandidateField("EQUAL_MTHD",
                                                 "TEXT",
                                                 data=NUM.array(equalMethodNames, dtype="U"+str(fieldLength)),
                                                 alias="Methods with Equivalent Accuracy")
            candidateFieldList.append(candidateField)
            nameTemplate = "OPT_{0}"
            aliasTemplate = "Is Optimal Method: {0}"

            staFields = []
            for ind, fieldName in enumerate(shortMethodNames):
                fieldName = nameTemplate.format(fieldName)
                self.dummyFieldNames.append(fieldName)
                fieldAlias = aliasTemplate.format(shortMethodAlias[ind])
                data = self.equivalentMethodMat[:, ind].copy()
                data[data == 2] = 1
                candidateField = SSDO.CandidateField(fieldName,
                                                     "LONG",
                                                     data=data,
                                                     alias=fieldAlias)
                staFields.append(candidateField)
            self.dummyFieldNames = sorted(self.dummyFieldNames)
            candidateFieldList += sorted(staFields, key=lambda x: x.name)

        return candidateFieldList

    def updateDummyFields(self):
        numDummyFields = len(self.dummyFieldNames)
        if not self.generatePopups or numDummyFields == 0:
            return
        dummyUpdateCursor = ARCPY.da.UpdateCursor(self.outputFC, ['OBJECTID']+self.dummyFieldNames)
        for r in dummyUpdateCursor:
            for ind in range(1, 1+numDummyFields):
                if r[ind] < 0:
                    r[ind] = None
            dummyUpdateCursor.updateRow(r)

    def getEquivalentMethodsSta(self):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220024))
        if self.equivalentMethodMat is None:
            return None
        methodsCount = NUM.zeros(len(self.allMethodNameArray), dtype=int)
        for locationId in range(self.numValidLocations):
            equalMethods = NUM.where(self.equivalentMethodMat[locationId] >= 1)[0]
            methodsCount[equalMethods] += 1
        equivalentMethodsSta = {}
        for ind, name in enumerate(self.allMethodNameArray):
            if methodsCount[ind] > 0:
                equivalentMethodsSta[name] = methodsCount[ind]
        return equivalentMethodsSta

    def __validate(self):
        import SSPanel as PANEL
        #### Runtime Validation ####
        if self.numCubes < 2:
            #### Must Have at Least Two Cubes ####
            ARCPY.AddIDMessage("ERROR", 110336)
            raise SystemExit()

        numTime0 = None
        numLocation0 = None
        numPred0 = 0
        cubeTypeIsPanel = None
        varName0 = None
        startTime0 = None
        timeSize0 = None
        inputCubeFiles = set()
        self.allPredictions = True
        self.validationSize = 0
        cube0Centroids = []
        predTimeDiff = False
        validationSizes = []

        for ind, cube in enumerate(self.cubeObjects):
            if cube.dataset.is_forecast == "FALSE":
                #### Must be All Forecast Cubes ####
                self.allPredictions = False
                ARCPY.AddIDMessage("ERROR", 110330)
                raise SystemExit()

            #### Keep track of validation steps in each cube ####
            validationSize = 0
            if hasattr(cube.dataset, 'validation_size'):
                validationSize = int(cube.dataset.validation_size)
            validationSizes.append(str(validationSize))

            if cube.path in inputCubeFiles:
                #### Duplicate Forecast Cube ####
                ARCPY.AddIDMessage("ERROR", 110328)
                raise SystemExit()
            else:
                inputCubeFiles.add(cube.path)

            vn = None

            for v in cube.dataset.variables:
                if v.endswith("_FIT"):
                    vn = v.split("FORECAST_")[-1].split("_FIT")[0]
                    break

            if ind == 0:
                numTime0 = int(cube.dataset.begin_forecast_bin)
                numLocation0 = cube.numLocations
                numPred0 = cube.numTime - numTime0
                cubeTypeIsPanel = isinstance(cube, PANEL.SSPanel)
                varName0 = vn
                startTime0 = cube.firstStartTime
                timeSize0 = cube.timeSize
                self.validationSize = validationSize
            else:
                if numTime0 != int(cube.dataset.begin_forecast_bin):
                    #### Number of Time Periods (Excluding Forecast) ####
                    ARCPY.AddIDMessage("ERROR", 110332)
                    raise SystemExit()

                if numLocation0 != cube.numLocations:
                    #### Number of Locations ####
                    ARCPY.AddIDMessage("ERROR", 110333)
                    raise SystemExit()

                if cubeTypeIsPanel != isinstance(cube, PANEL.SSPanel):
                    #### Cube Type ####
                    ARCPY.AddIDMessage("ERROR", 110329)
                    raise SystemExit()

                if varName0 != vn:
                    #### Analysis Variable ####
                    ARCPY.AddIDMessage("ERROR", 110331)
                    raise SystemExit()

                if startTime0 != cube.firstStartTime:
                    #### Start Time ####
                    ARCPY.AddIDMessage("ERROR", 110334)
                    raise SystemExit()

                if timeSize0 != cube.timeSize:
                    #### Time Step Interval ####
                    ARCPY.AddIDMessage("ERROR", 110335)
                    raise SystemExit()

                numPred = cube.numTime - int(cube.dataset.begin_forecast_bin)
                if numPred0 != numPred:
                    predTimeDiff = True
                    if numPred < numPred0:
                        self.cubeWithShortestPredTime = cube
                        numPred0 = numPred

            if isinstance(cube, PANEL.SSPanel):
                Xs = cube.obtainValues("x")
                Ys = cube.obtainValues("y")
                centroids = [(Xs[i], Ys[i]) for i in range(len(Xs))]
            else:
                centroids = []
                numCols = cube.numCols
                mask = cube.getAnalysisMask(varName0)
                cubeIdList = NUM.where(mask)[0]
                for id in cubeIdList:
                    row = id // numCols
                    col = id % numCols
                    centroids.append(cube.obtainCentroid(row=row, col=col))

            if ind == 0:
                cube0Centroids = centroids
            else:
                allCentroidsSame = True
                if len(centroids) != len(cube0Centroids):
                    allCentroidsSame = False
                else:
                    for i in range(len(centroids)):
                        if not NUM.allclose(centroids[i], cube0Centroids[i]):
                            allCentroidsSame = False
                            break
                if not allCentroidsSame:
                    #### Location Centroids ####
                    ARCPY.AddIDMessage("ERROR", 110338)
                    raise SystemExit()

        if self.doValidation:
            #### Validation Time Steps ####
            validSet = set(validationSizes)
            if len(validSet) > 1:
                firstArg = ", ".join(validationSizes[0:-1])
                ARCPY.AddIDMessage("ERROR", 110337, firstArg, validationSizes[-1])
                raise SystemExit()

        if predTimeDiff:
            ARCPY.AddIDMessage("WARNING", 110327)

        self.numLocations = numLocation0
        self.addTime = numPred0
        self.numTime = numTime0
        self.numTimeWithPred = numTime0 + numPred0
        self.varName = varName0

    def prepareCompareData(self):
        if not self.generatePopups:
            return None
        data = {
            "forecastCollection": self.forecastCollection,
            "fitCollection": self.fitCollection,
            "intvHighCollection": self.intvHighCollection,
            "intvLowCollection": self.intvLowCollection,
            "seasonCollection": self.seasonCollection,
            "methodCollection": self.methodCollection,
            "selectedSolutionIds": self.selectedSolutionIds,
            "allMethodNameAlternative": self.allMethodNameAlternative
        }
        if self.doValidation:
            data["rmseCollection"] = self.validationRMSECollection
            data["useValidation"] = True
        else:
            data["rmseCollection"] = self.rmseCollection
            data["useValidation"] = False

        return {"compareCandidates": data}

    def report(self, cube = None, print = False):
        self.table = createForecastReport(self, cube = cube)

        if print:
            ARCPY.AddMessage(self.table)

        return self.table

class SubsetSpaceTimeCube(object):
    def __init__(self, outputCube=None):
        UTILS.assignClassAttr(self, locals())

        writeCube = False

        if self.outoutCube:
            writeCube = True

            #### Check Path Exists ####
            outPath, outName = OS.path.split(outputCube)
            if not OS.path.exists(outPath):
                ARCPY.AddIDMessage("ERROR", 436, outPath)
                raise SystemExit()

            #### Initialize Cube ####
            try:
                dataset = NET.Dataset(ncFile, 'w')
            except:
                #### Not Writeable ####
                ARCPY.AddIDMessage("ERROR", 210, ncFile)
                raise SystemExit()




def generateForecatingSymbology(values, fieldName, fieldAlias, shapeType,
                                colors=None, valueToExclude=None, valueToExcludeLabel=None,
                                labelAppendixFirst=None, labelAppendixLast=None):
    """
    Use a template layer to generate a customized layer.
    The default symbol is described in a line 'decribeSymbolType',
    this position should be known from the template layer.

    OUTPUT :  layer (lyrx) path
    """
    import tempfile as TEMPFILE
    from datetime import datetime
    import math as MATH

    if len(values) == 0:
        return None

    data = values[~ (NUM.isinf(values) | NUM.isnan(values))]
    
    #### Remove SHP NULL ####
    try: 
        dt = UTILS.numpyDtypeConvert[data.dtype]
        shpNULL = UTILS.shpFileNull[dt]
        data = data[data!=shpNULL] 
    except:
        pass

    if len(data) == 0:
        return None

    layerFileTemplate = None
    valueUnique = None
    typeSymbolLocation = None
    line_fieldName = None
    line_fieldAlias = None
    DECIMAL_PLACE = 6

    if colors is None:
        colors = ["239,243,255", "189,215,231", "107,174,214", "49,130,189", "8,81,156"]

    numCategory = len(colors)
    numUniqueValue = len(NUM.unique(data))
    if numUniqueValue <= numCategory:
        numCategory = numUniqueValue - 2

    minV = NUM.min(data)
    if numCategory > 1:
        uniqueValues = [cat[0] for cat in UTILS.classifyVariable(numCategory, "NATURAL_BREAKS", values=data)[0]]
        uniqueValues[-1] += 0.0000005
        uniqueValues = NUM.round(uniqueValues, DECIMAL_PLACE)
    else:
        valueMax = NUM.round(NUM.max(data)+0.0000005, DECIMAL_PLACE)
        uniqueValues = NUM.array([valueMax])

    minBreak = None
    #### Check Template Layer ####
    if shapeType.upper() == "POLYGON":
        layerFileTemplate = "RFPolygonRegression.lyrx"
        typeSymbolLocation = 263
        line_fieldAlias = 306
        minBreak = 296
        line_fieldName = 295

    elif shapeType.upper() == "POINT":
        layerFileTemplate = "RFPointRegression.lyrx"
        typeSymbolLocation = 265
        line_fieldAlias = 308
        minBreak = 298
        line_fieldName = 297
    else:
        return None

    pathLayer = OS.path.join(UTILS.pathLayers, layerFileTemplate)
    lines = []

    if OS.path.isfile(pathLayer):
        f = open(pathLayer, 'r')
        lines = f.readlines()
        f.close()
    else:
        return None

    decribeSymbolType = lines[typeSymbolLocation].strip("\n")
    head = lines[line_fieldAlias].replace("NAME_FIELD", fieldAlias)
    lines[line_fieldAlias] = head
    newElem = []

    if minBreak is not None:
        minBreakV = lines[minBreak].replace("4", str(minV))
        lines[minBreak] = minBreakV

    if line_fieldName is not None:
        lines[line_fieldName] = lines[line_fieldName].replace("PREDICTED", fieldName)

    if isinstance(uniqueValues, NUM.floating) or isinstance(uniqueValues, int):
        uniqueValues = NUM.array([uniqueValues])

    uniqueValues[-1] = MATH.ceil(uniqueValues[-1])
    lowerBounds = uniqueValues.copy()
    lowerBounds[0] = minV
    for id in range(1, len(lowerBounds)):
        lowerBounds[id] = uniqueValues[id-1] + 0.000001
    # to avoid the -0.0 cases
    if NUM.isclose(uniqueValues[0], 0):
        uniqueValues[0] = 0
    if NUM.isclose(lowerBounds[0], 0):
        lowerBounds[0] = 0

    #### Generate New Elements in the Template Replacing Values ####
    if len(uniqueValues) <= 1 and labelAppendixFirst is not None and labelAppendixLast is not None:
        labelAppendixFirst = None
        labelAppendixLast = None
    for id, i in enumerate(uniqueValues):
        vUpper = UTILS.formatValue(
                i, UTILS.getPerfectFormatDecimal(i, DECIMAL_PLACE, minDeciamlLimit=1, returnFormatStr=True))
        vLower = UTILS.formatValue(
                lowerBounds[id], UTILS.getPerfectFormatDecimal(lowerBounds[id],
                    DECIMAL_PLACE, minDeciamlLimit=1, returnFormatStr=True))
        if vUpper == vLower:
            valueLabel = vUpper
        else:
            valueLabel = "{} - {}".format(vLower, vUpper)

        label = valueLabel
        if valueToExclude is not None and id == 0:
            i = valueToExclude
            if valueToExcludeLabel is None:
                label = valueLabel
            else:
                label = valueToExcludeLabel
        if id == 0 and labelAppendixFirst is not None:
            label += labelAppendixFirst
        if id == len(uniqueValues)-1 and labelAppendixLast is not None:
            label += labelAppendixLast
        ele = decribeSymbolType.replace("150,150,150", colors[id])
        ele = ele.replace("\\u226499999", label)
        ele = ele.replace("99999", str(i))
        ele = ele.replace("CATEGORY", str(i))

        if str(type(i)).startswith('U'):
            ele = ele.replace('"VALUE2CHANGE"', str(i))
        else:
            ele = ele.replace('VALUE2CHANGE', str(i))

        if valueUnique is not None:
            ele = ele.replace("VALUETOSEARCH", str(valueUnique[id]))

        newElem.append(ele)

    replac = ",".join(newElem)
    lines[typeSymbolLocation] = replac
    iniText = lines[0:typeSymbolLocation]
    endText = lines[typeSymbolLocation:len(lines)]
    iniText += endText

    #### Update the color ramp for symbology pane ####
    if shapeType.upper() == "POLYGON":
        lineNums = [268, 295]
    else:
        lineNums = [270, 297]

    colorRamp = {
        "type": "CIMMultipartColorRamp",
        "colorRamps": [],
        "weights": []
    }
    startId = 0
    if valueToExclude is not None:
        startId = 1
    for ind in range(startId, len(colors)-1):
        colorFrom = list(map(int, colors[ind].split(","))) + [100]
        colorTo = list(map(int, colors[ind + 1].split(","))) + [100]
        ramp = {
            "type": "CIMLinearContinuousColorRamp",
            "colorSpace": {
                "type": "CIMICCColorSpace",
                "url": "CIELAB"
            },
            "fromColor": {
                "type": "CIMRGBColor",
                "values": colorFrom
            },
            "toColor": {
                "type": "CIMRGBColor",
                "values": colorTo
            }
        }
        colorRamp["colorRamps"].append(ramp)
        colorRamp["weights"].append(1)
    if len(colorRamp["weights"]):
        iniText = iniText[0: lineNums[0]] + ["\"colorRamp\" : " + JSON.dumps(colorRamp) + ","] + iniText[lineNums[1]:]

    layObj = JSON.loads("".join(iniText))
    return "JSONCIMDEF=" + JSON.dumps(layObj["layerDefinitions"][0])

def describe(ncFile):
    import SSPanel as PANEL
    import SSCube as CUBE
    import locale as LOCALE

    isPanel = isPanelFromFile(ncFile)

    if isPanel:
        cube = PANEL.SSPanel(ncFile)
        cubeType = 'PANEL'
        #### Get Analysis Variables ####
        analysisVars, cubeSubType = getBaseVar(cube)
        baseVar = analysisVars[0]
        cubeName = getCubeName(cubeType, cubeSubType)
    else:
        cube = CUBE.SSCube(ncFile)
        cubeType = 'CUBE'

        #### Get Analysis Variables ####
        analysisVars, cubeSubType = getBaseVar(cube)
        baseVar = analysisVars[0]
        cubeName = getCubeName(cubeType, cubeSubType)

        ## Get Aggregation Stats
        analysisMask = cube.obtainVariableMask(baseVar)
        cube.cubeInfo.reset_search_info(mask=analysisMask)
        tiledMask = NUM.tile(analysisMask, cube.cubeInfo.num_time)
        y = cube.obtainValues(baseVar, flatten=False,fillZeros=False) * 1.0
        
        tiledMask = tiledMask.ravel()
        y = y.ravel()
        _ = cube.setStats(y, tiledMask)

        #### Float Count to the Top of List ####
        varStr = 'COUNT'
        if varStr in analysisVars:
            countVar = analysisVars.pop(analysisVars.index(varStr))
            analysisVars.insert(0, varStr)

    cube.buildCubeReport(varNames=analysisVars, outputMessage = False, subType = cubeSubType)
    
    rows = cube.messageInfo['rows']
    headers = cube.messageInfo['header']
    pads = cube.messageInfo['pad']
    justifies = cube.messageInfo['justify']
    titleFillTokens = cube.messageInfo['titleFillToken']
    colPads = cube.messageInfo['colPad']
    emphasizeHeadRows = cube.messageInfo['emphasizeHeadRow']
    returnHTMLMsgs = cube.messageInfo['returnHTMLMsg']
    sizes = cube.messageInfo['tableSize']
    countFlag = cube.messageInfo['isCount']
    summFlag = cube.messageInfo['isSumm']

    #### Modify Rows for Describe Specific Cells ####
    if cube.aggShapeType.upper() == "FISHNET_GRID":
        shapeStr = ARCPY.GetIDMessage(220459)
    elif cube.aggShapeType.upper() == "HEXAGON_GRID":
        shapeStr = ARCPY.GetIDMessage(220460)
    elif cube.aggShapeType.upper() == "POINT":
        shapeStr = ARCPY.GetIDMessage(220461)
    elif cube.aggShapeType.upper() == "POLYGON":
        shapeStr = ARCPY.GetIDMessage(220462)
    ##### Shape Type for MDR Cubes #####
    if hasattr(cube.dataset, "sourceTool"):
        if cube.dataset.sourceTool.upper() == "Cube_MDRaster".upper():
            shapeStr = ARCPY.GetIDMessage(220459)
        elif cube.dataset.sourceTool.upper() == "Panel_MDRaster".upper():
            shapeStr = ARCPY.GetIDMessage(220462)

    rows[0].insert(2, [ ARCPY.GetIDMessage(220458), shapeStr])

    #### Add Creation Time Information ####
    if cube.dataset.source.upper() == "GEOANALYTICS":
        version = cube.dataset.source
        createdTime = cube.dataset.history
        cubeSubType = cube.dataset.source.upper()
        cubeName = getCubeName(cubeType, cubeSubType)
    else:
        version = cube.dataset.source.split(';')[1]
        versionNum = UTILS.versionStr2Float(version)
        createdTime = cube.dataset.history.split('Created by ')[1]

    mdrStr = ""
    superSymbol = "*"

    if cubeSubType == "OLD_MDR" or cubeSubType == "MDR" or cubeSubType == "MDR_SUBSET":
        mdrStr = ARCPY.GetIDMessage(220251)
        

    #### Update Version for Forecast Cube Created with Pro <3.0
    if "_FORECAST" in cubeSubType.upper() and versionNum < 3:
        version = ARCPY.GetIDMessage(220456)
    
    if cube.dataset.source.upper() == "GEOANALYTICS": 
        dateOutput = ARCPY.GetIDMessage(220472).format(cubeName, createdTime)
    else:
        dateOutput = ARCPY.GetIDMessage(220455).format(cubeName, mdrStr, version, createdTime)
    #### Output Version and Creation Date Info ####
   
    cubeSubType = cubeSubType

    versionText = dateOutput.replace("  ", " ")

    if isPanel and cubeSubType.upper() in ["CREATE", "OLD_MDR"] and versionNum < 2.9:
        versionText = [versionText, UTILS.buildSuperscript(superSymbol)]
        supScriptMessage = superSymbol + ARCPY.GetIDMessage(220250)
        versionMessage = UTILS.outputParagraph(versionText)
        ARCPY.AddMessage(versionMessage)
        ARCPY.AddMessage(supScriptMessage)
    elif isPanel and cubeSubType.upper() in ["CREATE", "OLD_MDR"] and versionNum >= 2.9:
        if "SUBSET" in cubeSubType.upper():
            subsetMessage = ARCPY.GetIDMessage(220483).format(versionText)
            supScriptMessage = superSymbol + ARCPY.GetIDMessage(220484)
            ARCPY.AddMessage(subsetMessage)
            ARCPY.AddMessage(supScriptMessage)
        else:
            versionText = [versionText, UTILS.buildSuperscript(superSymbol)]
            supScriptMessage = superSymbol + ARCPY.GetIDMessage(220502)
            versionMessage = UTILS.outputParagraph(versionText)
            ARCPY.AddMessage(versionMessage)
            ARCPY.AddMessage(supScriptMessage)
    else:
        if "SUBSET" in cubeSubType.upper():
            subsetMessage = ARCPY.GetIDMessage(220483).format(versionText)
            supScriptMessage = superSymbol + ARCPY.GetIDMessage(220484)
            ARCPY.AddMessage(subsetMessage)
            ARCPY.AddMessage(supScriptMessage)
        else:
            ARCPY.AddMessage(versionText)

    ####  Define Table Attributes Cube Report ####
    iterList = zip(rows, headers, pads, justifies, titleFillTokens, 
                    colPads, emphasizeHeadRows, returnHTMLMsgs, sizes,
                    countFlag, summFlag)
    report = []
    fullTable = []

    summaryCount = 0
    trendCount = 0

    summaryReport = []
    trendReport = []

    showSummary = True
    showTrend = True

    summaryStr = ARCPY.GetIDMessage(84636).format("")
    trendStr = ARCPY.GetIDMessage(84536).format("")
    
    for ind, tableInput in enumerate(iterList):
        if ind == 1:
            
            analysisHistory = getAnalysisHistory(cube, returnMessage = True)

            if "_FORECAST" in cubeSubType:
                if "SUBSET" not in cubeSubType:
                    varInd = [i for i, var in enumerate(analysisHistory['Analysis Applied']) if targetVarStr in var[0]][0]
                    forecastVar = analysisHistory['Variable'][varInd]
                    showSeason = True
                else:
                    forecastVar = analysisHistory['Variable']
                    showSeason = False
                
                outputTable = forecastDescribeReport(cube, forecastVar, showSeason = showSeason)
                header = ARCPY.GetIDMessage(220464)
                fullTable=UTILS.outputAccordion([outputTable], title = header, titleLevel=5,
                                            expand=True, returnHTMLMsg=False,
                                            force2Txt=False, titleFillToken="*")
                ARCPY.AddMessage(fullTable)

        boldCols = None
        if summaryStr in tableInput[1]:
            boldCols = 0

        if any([ARCPY.GetIDMessage(220453) in v for v in tableInput[0]]):
            boldCols = 0

        report=[UTILS.outputTextTable(tableInput[0], header = None,
                                pad = tableInput[2], justify = tableInput[3],
                                titleFillToken = tableInput[4], 
                                colPad = tableInput[5], emphasizeHeadRow = tableInput[6],
                                tableSize =  tableInput[8], boldCols = boldCols,
                                force2Txt=False, returnHTMLMsg=True)]
        expand = False
        if ind < 1:
            expand = True

        if tableInput[9] or tableInput[10]:
            summaryCount += 1
            varSummaryAccordion = UTILS.outputAccordion(report, title = tableInput[1], titleLevel=6,
                                          expand=expand, returnHTMLMsg=True,
                                          force2Txt=False, titleFillToken="*")
            summaryReport.append(varSummaryAccordion)

        elif trendStr in tableInput[1]:
            trendCount += 1
            varTrendAccordion = UTILS.outputAccordion(report, title = tableInput[1], titleLevel=6,
                                          expand=expand, returnHTMLMsg=True,
                                          force2Txt=False, titleFillToken="*")
            trendReport.append(varTrendAccordion)

        else:
            fullTable = UTILS.outputAccordion(report, title = tableInput[1], titleLevel=5,
                                              expand=expand, returnHTMLMsg=False,
                                              force2Txt=False, titleFillToken="*")

            ARCPY.AddMessage(fullTable)

        if summaryCount == len(analysisVars) and showSummary:
            header = ARCPY.GetIDMessage(220469)
            summaryTable = UTILS.outputAccordion(summaryReport, title = header, titleLevel=5,
                                                 expand=False, returnHTMLMsg=False,
                                                 force2Txt=False, titleFillToken="*")
            ARCPY.AddMessage(summaryTable)

            showSummary = False

        if trendCount == len(analysisVars) and showTrend:
            header = ARCPY.GetIDMessage(220470)
            trendTable = UTILS.outputAccordion(trendReport, title = header, titleLevel=5,
                                                 expand=False, returnHTMLMsg=False,
                                                 force2Txt=False, titleFillToken="*")
            ARCPY.AddMessage(trendTable)
            showTrend = False


    return cube, cubeSubType

def getAnalysisHistory(cube, cubeType=None, returnMessage = False):

    import SSPanel as PANEL
    import SSCube as CUBE
    import locale as LOCALE

    emptyRow = ["", ""]
    historyDict = {'Variable':[], 'Analysis Applied':[]}
    
    #### Number of Columns in Messages Table ####
    nColsTable = 10
    #### Start ID for Messages (Consequetive) in GPSSFunctions2.xml ####
    stcMsgIdInit = 220252
    colMsgIdInit = 220273
    #### Build Dictionary for Cube Theme Strings ####
    cubeDict = {v:stcMsgIdInit + i for i, v in enumerate(allCubeThemes)}

    #### Get Space Time Cube Type and Subtype####
    if cubeType is None:
        if isinstance(cube, CUBE.SSCube):
            createID = str(50000001)
            baseVars, cubeSubType = getBaseVar(cube)
            historyDict['Variable'] = baseVars
            if hasattr(cube.dataset, "source"):
                if cube.dataset.source.upper() == "GEOANALYTICS":
                    createID = str(51010002)

        elif isinstance(cube, PANEL.SSPanel):
            createID = str(50000004)
            baseVars, cubeSubType = getBaseVar(cube)
            historyDict['Variable'] = baseVars

        if "FORECAST" in cubeSubType:
            initTool = [cubeSubType]
        elif cubeSubType.upper() == "OLD_MDR":
            initTool = ["MDR"]
        elif cubeSubType not in ["CREATE", "MDR"]:
            initTool = ["CREATE"]
            #if cubeSubType.upper() != "OLD_MDR":
                #initTool.append(cubeSubType)
        else:
            initTool = [cubeSubType]

        if "SUBSET" in cubeSubType:
            initTool = ["SUBSET"]


    allVars = cube.obtainVariableList()

    toolDict = {"CREATE": "Space Time Cube Creation",
                "TSCLUST" :"Time Series Clustering",
                "EMERGING":"Emerging Hot Spot Analysis",
                "OUTLIER" : "Local Outlier Analysis",
                "CPD":"Change Point Detection",
                "FOREST_FORECAST": "Forest-based Forecast",
                "EXP_SMOOTHING_FORECAST":"Exponential Smoothing Forecast",
                "HYBRID_FORECAST": "Evaluate Forecasts By Location",
                "CURVE_FIT_FORECAST": "Curve Fit Forecast",
                "MDR": "Space Time Cube Creation",
                "OLD_MDR": "Space Time Cube Creation",
                "SUBSET": "Space Time Cube Creation",
                "TIMESERIES_AI_FORECAST": "Timeseries AI Forecast"}

    linkDict = {"CREATE" : createID,
                "TSCLUST" : str(50000005),
                "EMERGING": str(50000002),
                "OUTLIER": str(50000003),
                "CPD":str(50010004),
                "FOREST_FORECAST": str(50020003),
                "EXP_SMOOTHING_FORECAST": str(50020002),
                "HYBRID_FORECAST": str(50020004),
                "CURVE_FIT_FORECAST": str(50020001),
                "MDR": str(50000006),
                "OLD_MDR" :str(50000006),
                "SUBSET":str(50040002),
                "TIMESERIES_AI_FORECAST": str(79040002)}

    helpLinks = UTILS.getHelpLinks(list(linkDict.values()))
    helpLinkDict = {tool:link for tool, link in zip(linkDict.keys(), helpLinks)}
    header = ARCPY.GetIDMessage(220272)
    rows = [[ARCPY.GetIDMessage( colMsgIdInit+i ) for i in range(nColsTable)]]

    for var in historyDict['Variable']:
        toolList = []
        linkList = []
        theme2DList = []
        theme3DList = []

        if "FORECAST_{0}_FIT".format(var) in allVars:
            for tool in initTool:
                toolList = [toolDict[tool] + targetVarStr]
                linkList.append(helpLinkDict[tool])

                #### Get 2D and 3D Themes ####
                themes = getToolTheme2D(tool, var, cube.dataset)
                theme2DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])
                themes = getToolTheme3D(tool, var, cube.dataset)
                theme3DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])

        elif cubeSubType.upper() not in ["CREATE", "MDR"]: ## Tools that require pre-existing cubes
            
            for tool in initTool:
                toolList.append(toolDict[tool])
                linkList.append(helpLinkDict[tool])

                #### Get 2D and 3D Themes ####
                themes = getToolTheme2D(tool, var, cube.dataset)
                theme2DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])
                themes = getToolTheme3D(tool, var, cube.dataset)
                theme3DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])
        else:
            for tool in initTool:
                toolList = [toolDict[tool]]
                linkList.append(helpLinkDict[tool])
                #### Get 2D and 3D Themes ####
                themes = getToolTheme2D(tool, var, cube.dataset)
                theme2DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])
                themes = getToolTheme3D(tool, var, cube.dataset)
                theme3DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])

        neighborType, aggMethod = getAggregation(var, cube, cubeSubType)

        for tool in toolDict.keys():
            if any(tool.upper()+'_'+var.upper() in varName for varName in allVars):
                if tool not in initTool:
                    toolList.append(toolDict[tool])
                    linkList.append(helpLinkDict[tool])
                    #### Get 2D and 3D Themes ####
                    themes = getToolTheme2D(tool, var, cube.dataset)
                    theme2DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])
                    themes = getToolTheme3D(tool, var, cube.dataset)
                    theme3DList.append([ARCPY.GetIDMessage(cubeDict[t]) for t in themes])

        historyDict['Analysis Applied'].append(toolList)

        cubeStats = getCubeStats(cube, var)
        rowSpan = len(toolList)

        rows.append([UTILS.buildTableCell(var, rowSpan=rowSpan),
                        UTILS.buildTableCell(aggregation2Label[aggMethod], rowSpan=rowSpan),
                        UTILS.buildTableCell(fill2Label[neighborType], rowSpan=rowSpan),
                        UTILS.buildTableCell(LOCALE.format_string("%0.4f", cubeStats[0]), rowSpan=rowSpan),
                        UTILS.buildTableCell(LOCALE.format_string("%0.4f", cubeStats[1]), rowSpan=rowSpan),
                        UTILS.buildTableCell(LOCALE.format_string("%0.4f", cubeStats[2]), rowSpan=rowSpan),
                        UTILS.buildTableCell(LOCALE.format_string("%0.4f", cubeStats[3]), rowSpan=rowSpan),
                        #UTILS.buildTableCell([UTILS.buildHyperlink(toolList[0], linkList[0])]),
                        UTILS.buildTableCell([toolList[0]]),
                        UTILS.buildTableCell('\n'.join(theme2DList[0])),
                        UTILS.buildTableCell('\n'.join(theme3DList[0]))
                        ])

        for tool, link, theme2D, theme3D in zip(toolList[1:], linkList[1:], theme2DList[1:], theme3DList[1:]):
            rows.append(["@@none","@@none", "@@none", "@@none", "@@none", "@@none",  "@@none",
                            #UTILS.buildTableCell([UTILS.buildHyperlink(tool, link)]),
                            UTILS.buildTableCell([tool]),
                            UTILS.buildTableCell('\n'.join(theme2D), rowSpan=1),
                            UTILS.buildTableCell('\n'.join(theme3D), rowSpan=1)
                            ])

    # process time series correlation results separately, since the analysis involves two different variables
    tsCorrVars = set()
    for var_name in allVars:
        if var_name.startswith("TSCORR_") and var_name.endswith("_ABSMAX_COR"):
            vn = var_name.removeprefix("TSCORR_").removesuffix("_ABSMAX_COR")
            if f"TSCORR_{vn}_ABSMAX_LAG" in allVars:
                tsCorrVars.add(vn)

    tsCorrVarsValid = []
    if len(tsCorrVars):
        for v1 in historyDict['Variable']:
            for v2 in historyDict['Variable']:
                vn = f"{v1}_{v2}"
                if vn in tsCorrVars:
                    rows.append([[vn, UTILS.buildSuperscript("*")],
                                 ARCPY.GetIDMessage(84499), ARCPY.GetIDMessage(84499), ARCPY.GetIDMessage(84499),
                                 ARCPY.GetIDMessage(84499), ARCPY.GetIDMessage(84499), ARCPY.GetIDMessage(84499),
                                 # UTILS.buildTableCell([UTILS.buildHyperlink(toolList[0], linkList[0])]),
                                 "Time Series Cross Correlation",
                                 ARCPY.GetIDMessage(220812),
                                 ""
                                 ])
                    tsCorrVarsValid.append(vn)
    if len(tsCorrVarsValid):
        footnote = ["* " + ARCPY.GetIDMessage(220813).format(", ".join(tsCorrVarsValid))]
    else:
        footnote = None

    outputTable = [UTILS.outputTextTable(rows, header = None, pad = 1,
                                    justify = ['left']*10,
                                    titleFillToken = "-",
                                    footnote=footnote,
                                    emptyFillToken = "-", emphasizeHeadRow=True,
                                    force2Txt=False, returnHTMLMsg=True)]

    fullTable = UTILS.outputAccordion(outputTable, title =ARCPY.GetIDMessage(220272),
                                     titleLevel=5, expand=True, returnHTMLMsg=False,
                                     force2Txt=False, titleFillToken="*")
    
    if returnMessage:
        ARCPY.AddMessage(fullTable)
    return historyDict

def checkCubeExtent2D(cube):
    
    cubeExtent = [cube.extent.XMin, cube.extent.YMin,
                  cube.extent.XMax, cube.extent.YMax,]

    projExtent = list(UTILS.getXYZProjectionDomain(cube.spatialReference))

    projExtent.pop(-1)
    projExtent.pop(2)
    outBounds = False
    
    for dim in range(len(cubeExtent)):
        if dim // 2 == 0 and cubeExtent[dim] < projExtent[dim]:
            cubeExtent[dim] = projExtent[dim]
            outBounds = True
        elif dim // 2 == 1 and cubeExtent[dim] > projExtent[dim]:
            cubeExtent[dim] = projExtent[dim]
            outBounds = True

    if outBounds:
        ARCPY.AddIDMessage("WARNING", 220240)

    return cubeExtent

def writeCubeExtent(outFC, cube):
    #### Check Write Location ####
    outPath, outName = OS.path.split(outFC)
    if not ARCPY.Exists(outPath):
        #### Not Writeable ####
        ARCPY.AddIDMessage("ERROR", 210, outFC)
        raise SystemExit()

    cubeExtent = checkCubeExtent2D(cube)

    if cubeExtent[0] == cubeExtent[2] and cubeExtent[1] == cubeExtent[3]:
        ARCPY.AddIDMessage("WARNING", 220241)

        extentObj = ARCPY.Extent(XMin = cubeExtent[0],
                             YMin = cubeExtent[1],
                             XMax = cubeExtent[2],
                             YMax = cubeExtent[3],
                            spatial_reference = cube.spatialReference)

        xyArray = NUM.array([cubeExtent[0], cubeExtent[1]])
        xyArray = xyArray.reshape(1,2)
        d = UTILS.DataContainer(spatialRef = cube.spatialReference, xy= xyArray)
        d.generateOutput(outFC, listFields=[])

    else:

        extentObj = ARCPY.Extent(XMin = cubeExtent[0],
                             YMin = cubeExtent[1],
                             XMax = cubeExtent[2],
                             YMax = cubeExtent[3],
                            spatial_reference = cube.spatialReference)
        d = UTILS.DataContainer(spatialRef = cube.spatialReference, shapes= [extentObj.polygon])
        d.generateOutput(outFC, []) 


    return

def getAggregation(var, cube, cubeSubType):
    import SSCube as CUBE
    import SSPanel as PANEL

    baseVar = "COUNT"
    if isinstance(cube, CUBE.SSCube):

        if var.upper() != baseVar.upper():
            for neigh in neighPref:
                if neigh in var:
                    varName = var.replace("_"+neigh, "")
                    break
                else:
                    neigh = 'NONE'
                    varName = var

            for agg in aggPref:
                if agg in varName.split("_")[-1]:
                    break
                else:
                    agg = 'NONE'
        else:
            neigh = 'NONE'
            agg = 'NONE'
    elif isinstance(cube, PANEL.SSPanel):

        for neigh in neighPref:
            if neigh in var:
                varName = var.replace("_"+neigh, "")
                break
            else:
                neigh = "DROP"
                if var.upper() == baseVar.upper():
                    neigh = 'ZEROS'
                varName = var
                if hasattr(cube.dataset, 'sourceTool'):
                    if cube.dataset.sourceTool.upper() == "PANEL_MDRASTER":
                        neigh = 'NONE'

        for agg in aggPref:
            if agg in varName.split("_")[-1]:
                break
            else:
                agg = "NONE"

    return neigh, agg

def generateChangePointPopupField(data, cube, varName, outputFC, candidateFieldList):
    if UTILS.isShapeFile(outputFC):
        return

    popupFieldThreshold = 1e7
    N = data["N"]
    T = data["T"]

    appendPopupsSeperately = N * T > popupFieldThreshold

    if not appendPopupsSeperately:
        candidateFieldList.append(
            generateCubePopupChartFieldFromData(
                data, varName, theme="CHANGE_POINT_DETECTION_RESULTS"))
        cube.exportFeatures2D(outputFC, candidateFieldList)
    else:
        cube.exportFeatures2D(outputFC, candidateFieldList)
        #### Append the Popups by chunk ####
        popupFieldName = "HTML_CHART"
        popupFieldAlias = "Time Series HTML Pop-Up"
        batchSize = int(popupFieldThreshold / T)
        currentPos = 0
        popupUpdateCursor = None
        totoalUpdated = 0
        while currentPos < N:
            rows, maxRowLength = generateCubePopupChartFieldFromData(
                data, varName, theme="CHANGE_POINT_DETECTION_RESULTS",
                indStart=currentPos, indEnd=currentPos + batchSize)
            if currentPos == 0:
                #### Create New Field for the FC ####
                ARCPY.management.AddFields(
                    outputFC,
                    [[popupFieldName, 'Text', popupFieldAlias, int(maxRowLength * 1.1), None, None]])
                fields = ['OBJECTID', popupFieldName]
                popupUpdateCursor = ARCPY.da.UpdateCursor(outputFC, fields)

            localPos = 0
            recordSize = len(rows)
            for r in popupUpdateCursor:
                r[1] = rows[localPos]
                popupUpdateCursor.updateRow(r)
                totoalUpdated += 1
                localPos += 1
                if localPos >= recordSize:
                    break

            currentPos += batchSize

def getBaseVar(cube):
    import SSCube as CUBE
    import SSPanel as PANEL
    allVars = cube.obtainVariableList()
    cpdVars = [var.replace("CPD_", "").replace("_ISCP", "") for var in allVars if "CPD_" in var and "_ISCP" in var]
    analysisVars = []
    
    if isinstance(cube, CUBE.SSCube):
        
        if "PROCESSING_BINARY_MASK" in allVars:
            cubeSubType = "CREATE"
            baseVar = "COUNT"
            ## Add Aggregated Variables
            flag = '_ESTIMATED'
            if hasattr(cube.dataset, 'subsetType'):
                flag = "_MASK"
            analysisVars.append(baseVar)
            _ = [analysisVars.append(var.replace(flag,'')) for var in allVars if flag in var and var != "PROCESSING_BINARY_MASK"]
            #### Check for Subset Cube ####
            if hasattr(cube.dataset, 'subsetType'):
                cubeSubType = "SUBSET"

        if hasattr(cube.dataset, 'forecast_type'):
            #### Subset Forecast Cube ####
            if hasattr(cube.dataset, 'subsetType'):
                baseMask = '_TREND_ZSCORE'
                baseVars = [var for ind, var in enumerate(allVars) if baseMask in var]
                cubeSubType = "SUBSET"
                analysisVars = [field.split(baseMask)[0] for field in baseVars if baseMask in field]

            #### Non-Subset Forecast Cube ####
            else:
                forecastMask = "_FIT"
                forecastInd = [ind for ind, var in enumerate(allVars) if forecastMask in var ]

                if len(forecastInd) >0:
                    baseVar = allVars[forecastInd[0]].replace(forecastMask, "")
                    baseVar = baseVar.replace("FORECAST_", "")
                else:
                    baseVar = ""

                otherVars = [var for var in allVars if baseVar not in var ]
                predMask  = "_TREND_ZSCORE"
                predVars = [var.replace(predMask, "") for var in otherVars if predMask in var ]

                analysisVars.append(baseVar)
                _ = [analysisVars.append(var) for var in predVars]

                if "" in analysisVars:
                    analysisVars.remove("")

            forecastType = int(cube.dataset.forecast_type)
            if forecastType == 0:
                cubeSubType = "FOREST_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "FOREST_FORECAST_SUBSET"

            elif forecastType == 1:
                cubeSubType = "EXP_SMOOTHING_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "EXP_SMOOTHING_FORECAST_SUBSET"

            elif forecastType == 2:
                cubeSubType = "HYBRID_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "HYBRID_FORECAST_SUBSET"

            elif forecastType == 3:
                cubeSubType = "CURVE_FIT_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "CURVE_FIT_FORECAST_SUBSET"

            elif 100 <= forecastType <= 105:
                cubeSubType = "TIMESERIES_AI_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "TIMESERIES_AI_FORECAST_SUBSET"

            else:
                ARCPY.AddWarning("Not a valid forecast cube") ##TODO
                cube.close()
                raise SystemExit()
   
        elif hasattr(cube.dataset, 'sourceTool'):
            if cube.dataset.sourceTool.upper() == "CUBE_MDRASTER":
                ## MDR Cube
                cubeSubType = "MDR"
                ## Add Aggregated Variables
                flag = '_MASK'
                analysisVars = [var.replace(flag,'') for var in allVars if flag in var]
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "MDR_SUBSET"
            elif cube.dataset.sourceTool.upper() == "CUBE":
                cubeSubType = "CREATE"
                baseVar = "COUNT"
                ## Add Aggregated Variables
                flag = '_ESTIMATED'
                if hasattr(cube.dataset, 'subsetType'):
                    flag = "_MASK"
                analysisVars.append(baseVar)
                _ = [analysisVars.append(var.replace(flag,'')) for var in allVars if flag in var and var != "PROCESSING_BINARY_MASK"]
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "SUBSET"

        ### OLD MDR WITHOUT INDICATION
        elif "PROCESSING_BINARY_MASK" not in allVars:
            cubeSubType = "OLD_MDR"
            flag = '_MASK'
            analysisVars = [var.replace(flag,'') for var in allVars if flag in var]
            #### Check for Subset Cube ####
            if hasattr(cube.dataset, 'subsetType'):
                cubeSubType = "OLD_MDR_SUBSET"

        if len(cpdVars) > 0 :
            analysisVars.extend(cpdVars)

    elif isinstance(cube, PANEL.SSPanel):

        baseMask = '_TREND_ZSCORE'
        emergingMask = "EMERGING_"
        baseVars = [var for ind, var in enumerate(allVars) if baseMask in var and emergingMask not in var]

        if hasattr(cube.dataset, 'sourceTool'):
            if cube.dataset.sourceTool.upper() == "PANEL_MDRASTER":
                ## MDR Cube
                cubeSubType = "MDR"
                analysisVars = [field.split(baseMask)[0] for field in baseVars if baseMask in field]
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "MDR_SUBSET"
                    
            elif cube.dataset.sourceTool.upper() == "PANEL":
                cubeSubType = "CREATE"
                analysisVars = [field.split(baseMask)[0] for field in baseVars if baseMask in field]
                #### Check for Subset Cube ####
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "SUBSET"

        elif len(baseVars) > 0 :
            analysisVars = [field.split(baseMask)[0] for field in baseVars if baseMask in field]
            cubeSubType = "CREATE"
            #### Check for Subset Cube ####
            if hasattr(cube.dataset, 'subsetType'):
                cubeSubType = "SUBSET"

        if hasattr(cube.dataset, 'forecast_type'):
            #### Subset Forecast Cube ####
            if hasattr(cube.dataset, 'subsetType'):
                baseMask = '_TREND_ZSCORE'
                baseVars = [var for ind, var in enumerate(allVars) if baseMask in var]
                cubeSubType = "SUBSET"
                analysisVars = [field.split(baseMask)[0] for field in baseVars if baseMask in field]

            #### Non-Subset Forecast Cube ####
            else:
                forecastMask = "_FIT"
                forecastInd = [ind for ind, var in enumerate(allVars) if forecastMask in var ]
                baseVar = allVars[forecastInd[0]].replace(forecastMask, "")
                baseVar = baseVar.replace("FORECAST_", "")

                otherVars = [var for var in allVars if baseVar not in var ]
                predMask  = "_TREND_ZSCORE"
                predVars = [var.replace(predMask, "") for var in otherVars if predMask in var ]

                analysisVars = [baseVar]
                _ = [analysisVars.append(var) for var in predVars]

            forecastType = int(cube.dataset.forecast_type)
            if forecastType == 0:
                cubeSubType = "FOREST_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "FOREST_FORECAST_SUBSET"

            elif forecastType == 1:
                cubeSubType = "EXP_SMOOTHING_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "EXP_SMOOTHING_FORECAST_SUBSET"

            elif forecastType == 2:
                cubeSubType = "HYBRID_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "HYBRID_FORECAST_SUBSET"

            elif forecastType == 3:
                cubeSubType = "CURVE_FIT_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "CURVE_FIT_FORECAST_SUBSET"
            
            elif 100 <= forecastType <= 105:
                cubeSubType = "TIMESERIES_AI_FORECAST"
                if hasattr(cube.dataset, 'subsetType'):
                    cubeSubType = "TIMESERIES_AI_FORECAST_SUBSET"

            else:
                ARCPY.AddWarning("Not a valid forecast cube") ##TODO
                cube.close()
                raise SystemExit()

        if len(cpdVars) > 0 :
            analysisVars.extend(cpdVars)

    analysisVars = list(set(analysisVars))
    if len(analysisVars) > 0:
        sortInd = [NUM.where(allVars==var)[0][0] for var in analysisVars]
        sortInd.sort()
        analysisVars = [allVars[ind] for ind in sortInd]

    return analysisVars, cubeSubType

def getCubeName(cubeType, cubeSubType):

    if cubeType.upper() == "PANEL":
        cubeName = ARCPY.GetIDMessage(220474)
    elif cubeType.upper() == "CUBE":
        cubeName = ARCPY.GetIDMessage(220475)
    
    if "FORECAST" in cubeSubType.upper():
        cubeName = ARCPY.GetIDMessage(220476)

    if cubeSubType.upper() == "GEOANALYTICS":
        cubeName = ARCPY.GetIDMessage(220473)

    return cubeName

def getCubeStats(cube, varName):
    stats = []
    data = readVar(cube, varName)
    #### Handle Inf Values in Array ####
    data = data[data != NUM.nan_to_num(NUM.inf)]
    data = data[data != -NUM.nan_to_num(NUM.inf)]
    #### Calculate Statistics ####
    stats.append(data.min())
    stats.append(data.mean())
    stats.append(data.max())
    stats.append(data.std(ddof=1))

    return stats

def changePointAnalysisReport(cube, changePointList):
    #### Initial Cube Report ####
    outputTable = cube.generalCubeReport()

    #### Important Dates Report ####
    header = ARCPY.GetIDMessage(220283)
    rows = []

    numTime, numLoc = changePointList.shape
    numChangePointPerTime = changePointList.sum(axis=1)

    startTimes, endTimes = cube.getOutputTimeFieldInfo()
    if cube.isStartTime:
        useTimes = startTimes
    else:
        useTimes = endTimes

    firstCP = 0
    while firstCP < numTime and numChangePointPerTime[firstCP] <= 0:
        firstCP += 1

    if firstCP != numTime:
        firstChangePoint = TUTILS.dateTime2String(useTimes[firstCP])
    else:
        firstChangePoint = None

    lastCP = numTime - 1
    while lastCP >= 0 and numChangePointPerTime[lastCP] <= 0:
        lastCP -= 1

    if lastCP != -1:
        lastChangePoint = TUTILS.dateTime2String(useTimes[lastCP])
    else:
        lastChangePoint = None

    mostChangeCP = NUM.argmax(numChangePointPerTime)
    if numChangePointPerTime[mostChangeCP] > 0:
        mostChangePoints = TUTILS.dateTime2String(useTimes[mostChangeCP])
    else:
        mostChangePoints = None


    #nonZeroIndices = NUM.nonzero(numChangePointPerTime)[0]

    #if len(nonZeroIndices) > 0:
    #    firstChangePoint = TUTILS.dateTime2String(useTimes[nonZeroIndices[0]]) 
    #    lastChangePoint = TUTILS.dateTime2String(useTimes[nonZeroIndices[-1]])
    #    mostChangePoints = TUTILS.dateTime2String(useTimes[NUM.argmax(numChangePointPerTime)])
    #else:
    #    firstChangePoint = 0
    #    lastChangePoint = 0
    #    mostChangePoints = 0

    rows.append([ARCPY.GetIDMessage(220284), mostChangePoints])
    rows.append([ARCPY.GetIDMessage(220285), firstChangePoint])
    rows.append([ARCPY.GetIDMessage(220286), lastChangePoint])

    rows.append("EMPTY")

    outputTable += UTILS.outputTextTable(rows, header=header, pad=1,
                                         justify=['left', 'right'],
                                         titleFillToken="-",
                                         emptyFillToken="-",
                                         emphasizeHeadRow=False,
                                         force2Txt=False)
    #### Summary of Number of Change
    header = ARCPY.GetIDMessage(220287)
    rows = []
    ### exclude first change point
    numChangePointPerTime = numChangePointPerTime[1:]

    #### Remove the locations which did not have appropriate data ####
    numChangePointPerTime = numChangePointPerTime[numChangePointPerTime >= 0]

    if len(numChangePointPerTime) > 0:
        minVal = NUM.min(numChangePointPerTime)
        maxVal = NUM.max(numChangePointPerTime) 
        meanVal = LOCALE.format_string("%0.2f",NUM.mean(numChangePointPerTime))
        medianVal = LOCALE.format_string("%0.2f",NUM.median(numChangePointPerTime))
        stdVal = LOCALE.format_string("%0.2f",NUM.std(numChangePointPerTime))
    else:
        minVal = None
        maxVal = None
        meanVal = None
        medianVal = None
        stdVal = None

    rows.append([ARCPY.GetIDMessage(220288), minVal])
    rows.append([ARCPY.GetIDMessage(220289), maxVal])
    rows.append([ARCPY.GetIDMessage(220290), meanVal])
    rows.append([ARCPY.GetIDMessage(220291), medianVal])
    rows.append([ARCPY.GetIDMessage(220292), stdVal])

    outputTable += UTILS.outputTextTable(rows, header=header, pad=1,
                                         justify=['left', 'right'],
                                         titleFillToken="-",
                                         emptyFillToken="-",
                                         emphasizeHeadRow=False,
                                         force2Txt=False)

    return outputTable

def getSeason(cube, varName):
    import SSPanel as PANEL

    seasonVar = "FORECAST_{0}_SEASON".format(varName)
    methodVar = "FORECAST_{0}_METHOD".format(varName)

    stC = cube.dataset.json_method_str
    if stC[-1] != "}":
        stC += "}"
    methodDict = JSON.loads(stC)
    methodMap = cube.obtainValues(methodVar, flatten = True)
    
    methodArray = NUM.array([methodDict[str(i)] for i in methodMap])

    data = cube.obtainValues(seasonVar, flatten = False)
    numLocations = cube.numLocations
    if not isinstance(cube, PANEL.SSPanel):
        mask = cube.obtainVariableMask(varName)
        validIds = NUM.where(mask.ravel())[0]
        numLocations = validIds.shape[0]
        if data.ndim == 3:
            data = data.ravel().reshape(cube.numTime, (cube.numCols * cube.numRows))[:, validIds]
        else:
            data = data.ravel()[validIds]
    
    seasonInt = data.data.copy()
    
    count = 0
    
    for d,m in zip(data, methodArray):
        if m.startswith('exponential smoothing'):
            if d > 1:
                count += 1
        elif m.startswith("forest-based") and m.endswith("auto_detect"):
            if d > 1:
                count += 1
                
    perc = abs(count/numLocations)
    
    return seasonInt, perc, methodArray, numLocations

def forecastDescribeReport(cube, forecastVar, showSeason = True):

    forecastType = int(cube.dataset.forecast_type)
    #### Set Base Table Info ####
    
    rows = []

    #### List Input Forecast Cubes (Evaluate) or Input Cube (Other Tools) ####
    forecastStr = str(forecastType2Label[forecastType])
    if forecastType == 2:
        forecastStr = ARCPY.GetIDMessage(220463)
    rows.append([ARCPY.GetIDMessage(84978), forecastStr])

    rows.append("EMPTY")

    #### Number of Forecast Time Steps ####
    startBin = int(cube.dataset.begin_forecast_bin)
    numForecast = cube.numTime - startBin

    rows.append([ARCPY.GetIDMessage(84980), str(numForecast)])

    #### Validation Size ####
    if forecastType == 2:
        if cube.dataset.has_validation.upper() == "TRUE":
            rows.append([ARCPY.GetIDMessage(84981), str(cube.dataset.validation_size)])
    else:
        rows.append([ARCPY.GetIDMessage(84981), str(cube.dataset.validation_size)])
    
    #### Seasonal Info ####
    
    methodDict = JSON.loads(cube.dataset.json_method_str)
    autoDetect = methodDict['0'].endswith("auto_detect")
    if showSeason:
        seasonInt, perc, methodArray, numLocations = getSeason(cube, forecastVar)

        if autoDetect:
            #### % Seasonal ####
            percSeasonal = perc * 100.
            percSeasonal = UTILS.formatValue(percSeasonal, "%0.2f")
            rows.append([ARCPY.GetIDMessage(84983), percSeasonal])

            #### Seasonal Stats ####
            seasonStats = UTILS.arraySummaryStats(abs(seasonInt))

            if forecastType == 0:
                labels = [ARCPY.GetIDMessage(i) for i in range(220018, 220023)]
            else:
                labels = [ARCPY.GetIDMessage(i) for i in range(220012, 220017)]

            for ind, value in enumerate(seasonStats):
                rows.append( [labels[ind], UTILS.formatValue(value, "%0.2f")] )
        else:
            swValue = str(abs(seasonInt[0]))
            if forecastType == 3:
                #### % Seasonal is N/A ####
                rows.append( [ARCPY.GetIDMessage(84983), ARCPY.GetIDMessage(84982)] )

                #### User Defined Time Window ####
                #rows.append( [ARCPY.GetIDMessage(220023), swValue] )
            else:
                #### % Seasonal ####
                percSeasonal = perc * 100.
                percSeasonal = UTILS.formatValue(percSeasonal, "%0.2f")
                rows.append([ARCPY.GetIDMessage(84983), percSeasonal])

                #### User Defined Seasons ####
                rows.append( [ARCPY.GetIDMessage(220017), swValue] )

        rows.append("EMPTY")

    #### Forecast Start and End Times ####
    if cube.isStartTime:
        spanStr1 = ARCPY.GetIDMessage(84627)
        spanStr2 = ARCPY.GetIDMessage(84628)
        tAlign = ARCPY.GetIDMessage(84632)
    else:
        spanStr1 = ARCPY.GetIDMessage(84629)
        spanStr2 = ARCPY.GetIDMessage(84630)
        tAlign = ARCPY.GetIDMessage(84633)

    #### Start Forecast Time Step Interval ####
    startTimes, endTimes = cube.getOutputTimeFieldInfo(exact=True)
    rows.append([{"data": ARCPY.GetIDMessage(84985), "prop": {"rowspan": 4}}, spanStr1 ])

    #### First Time Step Interval Equal to Last When Predicting One ####
    if numForecast == 1:
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(cube.lastStartTime), align="right") ])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right") ])
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(cube.lastEndTime), align="right") ])
    else:
        rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(startTimes[startBin]), align="right") ])
        rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right") ])
        if cube.isStartTime:
            rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(startTimes[startBin+1]), align="right") ])
        else:
            rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(endTimes[startBin]), align="right") ])

    #### Empty Space Row to Match Init Cube Report ####
    rows.append(["", ""])

    #### Last Time Step Interval ####
    rows.append([ UTILS.buildTableCell(ARCPY.GetIDMessage(84986), rowSpan=4), spanStr1 ])
    rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(cube.lastStartTime), align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(spanStr2, align="right")])
    rows.append([ "@@none", UTILS.buildTableCell(TUTILS.dateTime2String(cube.lastEndTime), align="right")])
    rows.append("EMPTY")

    outputTable = UTILS.outputTextTable(rows, header = None, pad = 1,
                                         justify = ['left', 'right'],
                                         titleFillToken = "-",
                                         emptyFillToken = "-",
                                         emphasizeHeadRow=False,
                                         returnHTMLMsg=True,
                                         force2Txt=False)

    return outputTable

def readVar(cube, varName):
    import SSPanel as PANEL
    

    data = cube.obtainValues(varName, flatten = False)
    if not isinstance(cube, PANEL.SSPanel):
        mask = cube.obtainVariableMask(varName)
        validIds = NUM.where(mask.ravel())[0]
        if data.ndim == 3:
            data = data.ravel().reshape(cube.numTime, (cube.numCols * cube.numRows))[:, validIds]
        else:
            data = data.ravel()[validIds]
    return data.data.copy()

def subsetChecks(cube, timeInputs = None, spaceInputs = None):
    subsetType = []
    if timeInputs is not None:
        subsetType.append("TIME")
    if spaceInputs is not None:
        subsetType.append("SPACE")

    return subsetType

def subsetReport(subsetCubeNC, parentCubeNC, subsetType = None):
    import SSPanel as PANEL
    import SSCube as CUBE
    
    rows = []
    rows.append(["", UTILS.buildTableCell(ARCPY.GetIDMessage(220479)), 
                UTILS.buildTableCell(ARCPY.GetIDMessage(220480))])
                
    isSubsetPanel = isPanelFromFile(subsetCubeNC)
    isOrigPanel = isPanelFromFile(parentCubeNC)
    
    #### Get Number of Bins ####
    if isSubsetPanel:
        subsetCube = PANEL.SSPanel(subsetCubeNC)
        try:
            nBinsSubset = subsetCube.neighborInfo.numObs
        except:
            nBinsSubset = subsetCube.numObs
    else:
        subsetCube = CUBE.SSCube(subsetCubeNC)
        nBinsSubset = subsetCube.numObs

    if isOrigPanel:
        parentCube = PANEL.SSPanel(parentCubeNC)
        try:
            nBinsOrig = parentCube.neighborInfo.numObs
        except:
            nBinsOrig = parentCube.numObs
    else:
        parentCube = CUBE.SSCube(parentCubeNC)
        nBinsOrig = parentCube.numObs

    #### Get Number of Locations ####
    nLocsOrig = parentCube.numLocations
    nLocsSubset = subsetCube.numLocations

    #### Get Number of Time Steps ####
    nTimeSubset = subsetCube.numTime
    nTimeOrig = parentCube.numTime

    #### First Time Step Start Time ####
    startTimeSubset = TUTILS.dateTime2String(subsetCube.firstStartTime)
    startTimeOrig = TUTILS.dateTime2String(parentCube.firstStartTime)

    #### First Time Step Temporal Bias ####
    ##### Remove End Bias if Last Time Bin is Removed in Subset #####
    subsetStartBias = subsetCube.startBias
    if subsetCube.firstStartTime > parentCube.firstStartTime:
        subsetStartBias = 0

    startBiasSubset = UTILS.formatPercentage(subsetStartBias, 2, multiplier=1)
    startBiasOrig = UTILS.formatPercentage(parentCube.startBias, 2, multiplier=1)

    #### Last Time Step End Time ####
    endTimeSubset = TUTILS.dateTime2String(subsetCube.lastEndTime)
    endTimeOrig = TUTILS.dateTime2String(parentCube.lastEndTime)

    #### Last Time Step Temporal Bias ####
    ##### Remove End Bias if Last Time Bin is Removed in Subset #####
    subsetEndBias = subsetCube.endBias
    if subsetCube.lastEndTime < parentCube.lastEndTime:
        subsetEndBias = 0

    endBiasSubset = UTILS.formatPercentage(subsetEndBias, 2, multiplier=1)
    endBiasOrig = UTILS.formatPercentage(parentCube.endBias, 2, multiplier=1)

    #### Write Out Top Rows ####
    rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84528)),
                UTILS.buildTableCell(nLocsOrig), UTILS.buildTableCell(nLocsSubset)])
    rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84603)),
                UTILS.buildTableCell(nTimeOrig), UTILS.buildTableCell(nTimeSubset)])
    
    if "TIME" in subsetType.upper():
        
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(220481)),
                UTILS.buildTableCell(startTimeOrig), UTILS.buildTableCell(startTimeSubset)])
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84634)),
                    UTILS.buildTableCell(startBiasOrig), UTILS.buildTableCell(startBiasSubset)])
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(220482)),
                    UTILS.buildTableCell(endTimeOrig), UTILS.buildTableCell(endTimeSubset)])
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84635)),
                    UTILS.buildTableCell(endBiasOrig), UTILS.buildTableCell(endBiasSubset)])
    if isSubsetPanel:
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84723)),
                    UTILS.buildTableCell(nBinsOrig), UTILS.buildTableCell(nBinsSubset)])
    else:
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(220231)),
                    UTILS.buildTableCell(nBinsOrig), UTILS.buildTableCell(nBinsSubset)])
    
    outputTable = UTILS.outputTextTable(rows, header = None, pad = 1,
                                         justify = ['left', 'right', 'right'],
                                         titleFillToken = "-",
                                         emptyFillToken = "-",
                                         emphasizeHeadRow=True,
                                         returnHTMLMsg=True,
                                         force2Txt=False)

    #### Additional Table for Grid Cube - Masked Locations ####
    if not isSubsetPanel:
        varNames, _ = getBaseVar(subsetCube)

        cubeTableRow = [["", "", 
                        UTILS.buildTableCell(ARCPY.GetIDMessage(220479)),
                        UTILS.buildTableCell(ARCPY.GetIDMessage(220480))]]

        for var in varNames:
            #### Get Original Masked/Unmasked ####
            mask = parentCube.obtainVariableMask(var)
            numUnmaskedParent = mask.sum()
            numMaskedParent = nLocsOrig - numUnmaskedParent

            #### Get Subset Masked/Unmasked ####
            mask = subsetCube.obtainVariableMask(var)
            numUnmaskedSubset = mask.sum()
            numMaskedSubset = nLocsSubset - numUnmaskedSubset

            cubeTableRow.append([UTILS.buildTableCell(var, rowSpan=4),
                                UTILS.buildTableCell(ARCPY.GetIDMessage(220232), align="left"), 
                                UTILS.buildTableCell(numUnmaskedParent), 
                                UTILS.buildTableCell(numUnmaskedSubset)])

            cubeTableRow.append([ "@@none", 
                                UTILS.buildTableCell(ARCPY.GetIDMessage(220508)),
                                UTILS.buildTableCell(numMaskedParent), 
                                UTILS.buildTableCell(numMaskedSubset)])

            cubeTableRow.append([ "@@none", 
                                UTILS.buildTableCell(ARCPY.GetIDMessage(220448)),
                                UTILS.buildTableCell(numUnmaskedParent*nTimeOrig),
                                UTILS.buildTableCell(numUnmaskedSubset*nTimeSubset)])
            
            cubeTableRow.append([ "@@none", 
                                UTILS.buildTableCell(ARCPY.GetIDMessage(220509)),
                                UTILS.buildTableCell(numMaskedParent*nTimeOrig),
                                UTILS.buildTableCell(numMaskedSubset*nTimeSubset)])

            #cubeTableRow.append("EMPTY")

        cubeTable = UTILS.outputTextTable(cubeTableRow, header = None, pad = 1,
                                        justify = ['left', 'right', 'right', 'right'],
                                        titleFillToken = "-",
                                        emptyFillToken = "-", 
                                        returnHTMLMsg=True,
                                        emphasizeHeadRow=True,
                                        force2Txt=False)

        header = ARCPY.GetIDMessage(220478)
        fullTable = UTILS.outputAccordion([outputTable, cubeTable], title = header, titleLevel=5,
                                                expand=True, returnHTMLMsg=False,
                                                force2Txt=False, titleFillToken="*")
        
    else:    

        header = ARCPY.GetIDMessage(220478)
        fullTable = UTILS.outputAccordion([outputTable], title = header, titleLevel=5,
                                                expand=True, returnHTMLMsg=False,
                                                force2Txt=False, titleFillToken="*")
    #### Subset Informative Table ####
    ARCPY.AddMessage(fullTable)
    #### Close Cubes
    subsetCube.close()
    parentCube.close()

    ####  Describe Space Time Cube Table for the Subset Cube
    cube, _ = describe(subsetCubeNC)
    cube.close()
    return 