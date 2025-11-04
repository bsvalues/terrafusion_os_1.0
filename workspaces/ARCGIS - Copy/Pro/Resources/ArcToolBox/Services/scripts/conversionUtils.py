import arcpy
import numpy as np

conversionUnitsToMeters = {
    "METERS": 1.0,
    "KILOMETERS": 1000.0,
    "FEET": 0.3048006096012192,
    "MILES": 1609.34721869,
    "YARDS": 0.9144018288,
    "FEETINT": 0.3048,
    "MILESINT": 1609.34,
    "YARDSINT": 0.9144
    }

def convertLengthtoSRUnits(descInFeatures, value, valueUnits, method=None):
    '''converts the value in valueUnits to spatial refernce units'''
    # isInputProjected
    srInFeatures = descInFeatures.spatialReference
    if srInFeatures.PCSName:
        dataUnits = descInFeatures.spatialReference.linearUnitName
        if dataUnits == "Meter":
            dataUnits = "Meters"
        arcpy.AddMessage("SR units: {}".format(dataUnits))
        metersPerUnit = srInFeatures.metersPerUnit
        convertedValue = convertLengthToPCSUnits(value, valueUnits, dataUnits, metersPerUnit)
    else:
        #According to Eric for GCS and Geodesic, radiusunits should be in Meters
        if method and method == "GEODESIC":
            arcpy.AddMessage("Conversion units switched to Meters instead of SR units for Geodesic")
            return conversionUnitsToMeters[valueUnits.upper()] * value
        else:
            convertedValue = convertLengthToGCSUnits(value, valueUnits, descInFeatures.extent)
    return convertedValue

def convertLengthToPCSUnits(value, valueUnits, conversionUnits, metersPerUnit):
    '''convert values in valueUnits to SR units for projected coordinate system
    value: value to be coverted
    valueUnits: the units in which the value is specified
    conversionUnits: the units to which the value must be converted
    metersPerUnit specified by the spatial reference of the data
    '''

    if conversionUnits == valueUnits:
        return value
    elif conversionUnits == "Meters":
        return conversionUnitsToMeters[valueUnits.upper()] * value
    else:
        meterValue = conversionUnitsToMeters[valueUnits.upper()] * value
        return  meterValue/metersPerUnit

def convertLengthToGCSUnits(value, valueUnits, extent):
    ''' convert values in valueUnits to SR units for GCS'''
    spatialReference = extent.spatialReference
    # Get extent center point
    centerX = (extent.XMax + extent.XMin) / 2.0
    centerY = (extent.YMax + extent.YMin) / 2.0
    pointCenter = arcpy.PointGeometry(arcpy.Point(centerX, centerY),
                                      spatialReference)

    # Project to a custom Azimuthal Equidistant PCS using the center of exent
    wkt = 'PROJCS["Custom_Azimuthal_Equidistant",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",{}],PARAMETER["Latitude_Of_Origin",{}],UNIT["Meter",1]]'.format(
        centerX, centerY)
    equidistantSR = arcpy.SpatialReference()
    equidistantSR.loadFromString(wkt)
    pointCenterPCS = pointCenter.projectAs(equidistantSR)

    # Calculate output of cellsize in Meter
    cellsize = conversionUnitsToMeters[valueUnits.upper()] * value

    # Shift projected point by one cellsize in vertical and horizontal directions
    vPoint = arcpy.PointGeometry(arcpy.Point(pointCenterPCS.centroid.X,
                                             pointCenterPCS.centroid.Y + cellsize),
                                 equidistantSR)
    vPointGCS = vPoint.projectAs(spatialReference)
    hPoint = arcpy.PointGeometry(
        arcpy.Point(pointCenterPCS.centroid.X + cellsize,
                    pointCenterPCS.centroid.Y), equidistantSR)
    hPointGCS = hPoint.projectAs(spatialReference)

    # Return average of shift projected in decimal degrees
    return (vPointGCS.centroid.Y - pointCenter.centroid.Y + hPointGCS.centroid.X - pointCenter.centroid.X) / 2

def convertSquareMapUnits(outRaster, conversionUnits):
    '''convert the area in square map units to desired conversion units'''

    if not conversionUnits:
        return 1.0

    descRaster = arcpy.Describe(outRaster)
    extent = descRaster.extent
    pointsArr = arcpy.Array([extent.upperLeft,
                                 extent.upperRight,
                                 extent.lowerRight,
                                 extent.lowerLeft,
                                 extent.upperLeft])

    extentPolygon = arcpy.Polygon(pointsArr, extent.spatialReference)
    conversionUnits = conversionUnits.upper().lstrip("SQUARE_")
    stdUnitArea = extentPolygon.getArea("PRESERVE_SHAPE", conversionUnits)
    geoDesicArea = extent.height * extent.width
    stdUnitAreaPerGeodesicArea = stdUnitArea/geoDesicArea

    return stdUnitAreaPerGeodesicArea


def convertEValuetoDecimalRep(value):
    '''converts e float values to regular
    decimals since gp tools doesn't like e values
    returns string'''

    valueOfStr =  str(value).lower()
    if "e" not in valueOfStr:
        return valueOfStr
    else:
        valStr, power = valueOfStr.split("e")
        powInt = int(power)
        isNegativeNum = False
        if "-" in valStr:
            valStr = valStr[1:]
            isNegativeNum = True
        # check decimal value by investigating dot pos
        dotPosition = valStr.find(".")
        if dotPosition < 0:
            dotPosition = len(valStr)
            valStr = valStr + "."
        #Positive powers
        if powInt > 0 :
            newDotPosition = dotPosition + powInt
            if len(valStr) < newDotPosition:
                #appendZeroes to end of the string
                for i in range(0, powInt-dotPosition+1):
                    valStr += "0"
                convertedStr = valStr[:dotPosition]+\
                             valStr[dotPosition+1:]
            else:
                #just move dot to right
                convertedStr = valStr[:dotPosition] + \
                             valStr[dotPosition+1:newDotPosition+1] + \
                             "." + valStr[newDotPosition+1:]
        # negative powers
        else:
            newDotPosition = dotPosition + powInt
            if newDotPosition > 0:
                #move dot to left
                convertedStr = valStr[:newDotPosition] +\
                             "." + valStr[newDotPosition:dotPosition]+\
                             valStr[dotPosition+1]
            else:
                #append zeroes to front of the string
                for i in range(newDotPosition, 0):
                    valStr = "0" + valStr
                newPos = valStr.find(".")
                convertedStr = "0." + valStr[:newPos] + valStr[newPos+1:]
        if isNegativeNum:
            convertedStr = "-{}".format(convertedStr)
        return convertedStr

def convertLengthtoSRUnits_RA(out_sr, in_sr, in_ext, value, valueUnits, method=None):
    '''converts the value in valueUnits to spatial reference units,
    The difference from convertLengthtoSRUnits is input parameters '''
    
    # check analysis map unit
    analysis_sr = in_sr
    if out_sr:
        analysis_sr = out_sr 
    
    # isInputProjected
    if analysis_sr.PCSName:
        mapUnits = analysis_sr.linearUnitName
        if mapUnits == "Meter":
            mapUnits = "Meters"
        arcpy.AddMessage("SR units: {}".format(mapUnits))
        metersPerUnit = analysis_sr.metersPerUnit
        convertedValue = convertLengthToPCSUnits(value, valueUnits, mapUnits, metersPerUnit)
    else:
        #According to Eric for GCS and Geodesic, radiusunits should be in Meters
        if method and method == "GEODESIC":
            arcpy.AddMessage("Conversion units switched to Meters instead of SR units for Geodesic")
            return conversionUnitsToMeters[valueUnits.upper()] * value
        else:
            pointRef = calculateRefPoints(in_ext, in_sr, analysis_sr)
            convertedValue = convertLengthToGCSUnits_RA(value, valueUnits, analysis_sr, pointRef)       
    return convertedValue

def calculateRefPoints(extent, insr, outsr):
    # Create polygon feature    
    array = arcpy.Array([arcpy.Point(extent['xmin'], extent['ymin']),
                         arcpy.Point(extent['xmax'], extent['ymin']),
                         arcpy.Point(extent['xmax'], extent['ymax']),
                         arcpy.Point(extent['xmin'], extent['ymax'])])
    polygon = arcpy.Polygon(array, insr)
    polygonGCS = polygon.projectAs(outsr)
    
    array = polygonGCS.getPart(0)
    xcoordinates =  []
    ycoordinates =  []
    for point in array:
        xcoordinates.append((point.X))
        ycoordinates.append((point.Y))

    # Calculate a reference point
    pointX = (max(xcoordinates) + min(xcoordinates))/ 2
    pointY = max(abs(max(ycoordinates)), abs(min(ycoordinates)))
    pointRef = arcpy.PointGeometry(arcpy.Point(pointX, pointY), outsr)
    return pointRef

def calculateCenterPoints(extent, insr, outsr):
    # Get extent center point
    centerX = (extent["xmax"] + extent["xmin"]) / 2.0
    centerY = (extent["ymax"] + extent["ymin"]) / 2.0 
    
    # Define point feature for center location
    pointCenter = arcpy.PointGeometry(arcpy.Point(centerX, centerY), insr)
    pointCenterGCS = pointCenter.projectAs(outsr)
    return pointCenterGCS

def convertLengthToGCSUnits_RA(value, valueUnits, spatialReference, pointCenter):
    ''' convert values in valueUnits to SR units for GCS '''

    # Project to a custom Azimuthal Equidistant PCS using the center of exent
    wkt = 'PROJCS["Custom_Azimuthal_Equidistant", \
            GEOGCS["GCS_WGS_1984", \
            DATUM["D_WGS_1984", \
            SPHEROID["WGS_1984",6378137.0,298.257223563]], \
            PRIMEM["Greenwich",0.0], \
            UNIT["Degree",0.017453292519943295]],\
            PROJECTION["Azimuthal_Equidistant"], \
            PARAMETER["False_Easting",0.0], \
            PARAMETER["False_Northing",0.0], \
            PARAMETER["Central_Meridian",{}], \
            PARAMETER["Latitude_Of_Origin",{}], \
            UNIT["Meter",1.0]]'.format(pointCenter.centroid.X, pointCenter.centroid.Y)
    arcpy.AddMessage("wkt: {}".format(wkt))
    equidistantSR = arcpy.SpatialReference()
    equidistantSR.loadFromString(wkt)
    pointCenterPCS = pointCenter.projectAs(equidistantSR)

    # Calculate output of cellsize in Meter
    arcpy.AddMessage("Calculating cellsize")
    cellsize = conversionUnitsToMeters[valueUnits.upper()] * value

    # Shift projected point by one cellsize in vertical and horizontal directions
    vPoint = arcpy.PointGeometry(arcpy.Point(pointCenterPCS.centroid.X,
                                             pointCenterPCS.centroid.Y + cellsize),
                                 equidistantSR)
    vPointGCS = vPoint.projectAs(spatialReference)
    hPoint = arcpy.PointGeometry(
        arcpy.Point(pointCenterPCS.centroid.X + cellsize,
                    pointCenterPCS.centroid.Y), equidistantSR)
    hPointGCS = hPoint.projectAs(spatialReference)

    # Return average of shift projected in decimal degrees
    return (vPointGCS.centroid.Y - pointCenter.centroid.Y + hPointGCS.centroid.X - pointCenter.centroid.X) / 2












