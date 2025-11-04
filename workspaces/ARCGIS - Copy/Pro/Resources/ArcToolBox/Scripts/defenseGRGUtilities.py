'''
 ==================================================
 defenseGRGUtilities.py
 --------------------------------------------------
 requirements: ArcGIS Pro
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Gridded Reference Graphic (GRG) Creation Utilities
 ==================================================
'''

import locale
import math
import os
import sys

import arcpy

try:
    from . import defenseHelper
except ImportError:
    import defenseHelper

supportedSortMethods = ['UR', 'UL', 'LR', 'LL', 'PEANO', 'CENTER', 
                        'COUNTERCLOCKWISE', 'CLOCKWISE', 'NONE']

def ColIdxToXlName_AreaGRG(index):
    ''' Converts an index into a letter, labeled like excel columns, A to Z, AA to ZZ, etc.'''
    ordA = ord('A')
    ordZ = ord('Z')
    lenL = ordZ - ordA + 1
    s = ""
    while(int(index) >= 0):
        s = chr(int(index) % lenL + ordA) + s
        index = math.floor(int(index) / lenL) - 1
    return s

def ColIdxToXlName_PointGRG(index):
    ''' Converts an index into a letter, labeled like excel columns, A to Z, AA to ZZ, etc. '''
    if index < 1:
        raise ValueError("Index is too small")
    result = ""
    while True:
        if index > 26:
            index, r = divmod(index - 1, 26)
            result = chr(r + ord('A')) + result
        else:
            return chr(index + ord('A') - 1) + result

def convertLinearUnits(value, from_unit, to_unit):
    try:
        # Method just wraps this version
        from convert_spatial_units import convert_linear_units

        return convert_linear_units(value, from_unit, to_unit)
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
        return value # Just return input value

def getLocalWAZED(inputFeatures):
    try:
        from defenseVisibilityUtilities import _getLocalWAZED, _getCentroid

        # Get centroid of input points in Lat/Lon
        centroidPoint = _getCentroid(inputFeatures)
        srWGS84 = arcpy.SpatialReference(4326) # GCS_WGS_1984
        ddCentroidPoint = centroidPoint.projectAs(srWGS84)
        
        # Use this point to create a localized WAZED
        arcpy.AddMessage(arcpy.GetIDMessage(200796)) # Using localized World Azimuthal Equidistant for analysis...
        srLocalWAZED = _getLocalWAZED(ddCentroidPoint)

        return srLocalWAZED
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None

'''
Sample adapted/taken from: https://github.com/usgs/arcgis-sample/blob/master/scripts/RotateFeatureClass.py
License: Public Domain: https://github.com/usgs/arcgis-sample/blob/master/LICENSE.txt
'''
def RotateFeatureClass(inputFC, outputFC,
                       angle=0, pivot_point=None, scratch='memory'):
    """Rotate Feature Class

    inputFC     Input features
    outputFC    Output feature class
    angle       Angle to rotate, in degrees
    pivot_point X,Y coordinates (as space-separated string)
                Default is LOWER_LEFT of inputFC
    scratch     scratch workspace

    As the output feature class no longer has a "real" xy locations,
    after rotation, it no coordinate system defined.
    """

    def RotateXY(x, y, xc=0, yc=0, angle=0, units="DEGREES"):
        """Rotate an xy cooordinate about a specified origin
        x,y      xy coordinates
        xc,yc   center of rotation
        angle   angle
        units    "DEGREES" (default) or "RADIANS"
        """
        x = x - xc
        y = y - yc
        # make angle clockwise (like Rotate_management)
        angle = angle * -1
        if units == "DEGREES":
            angle = math.radians(angle)
        xr = (x * math.cos(angle)) - (y * math.sin(angle)) + xc
        yr = (x * math.sin(angle)) + (y * math.cos(angle)) + yc
        return xr, yr

    # temp names for cleanup
    lyrFC, lyrTmp = [None] * 2  # layers
    tmpFC  = None # temp dataset
    deleteme = []
    saveExt = arcpy.env.extent
    saveQfnSetting = arcpy.env.qualifiedFieldNames 

    try:
        # process parameters
        try:
            xcen, ycen = [float(xy) for xy in pivot_point.split()]
            pivot_point = xcen, ycen
        except:
            # if pivot point was not specified, get it from
            # the LOWER_LEFT corner of the feature class
            ext = arcpy.Describe(inputFC).extent
            xcen, ycen  = ext.XMin, ext.YMin
            pivot_point = xcen, ycen

        angle = float(angle)

        # Disable any GP environment clips
        arcpy.ClearEnvironment("extent")

        # get feature class properties
        lyrFC = 'lyrFC'
        deleteme.append(lyrFC)

        arcpy.MakeFeatureLayer_management(inputFC, lyrFC)
        dFC = arcpy.Describe(lyrFC)
        shpField = dFC.shapeFieldName
        shpType = dFC.shapeType

        # create temp feature class
        tmpFC = arcpy.CreateUniqueName("rotateFC", scratch)
        deleteme.append(tmpFC)

        # Create Feature Class using inputFC as template (so will have "Grid" field)
        arcpy.CreateFeatureclass_management(os.path.dirname(tmpFC),
                                            os.path.basename(tmpFC),
                                            shpType,
                                            inputFC)
        lyrTmp = 'lyrTmp'
        deleteme.append(lyrTmp)
        arcpy.MakeFeatureLayer_management(tmpFC, lyrTmp)

        # rotate the feature class coordinates for each feature, and each feature part

        # open read and write cursors
        updateFields = ['SHAPE@','Grid']
        arcpy.AddMessage(arcpy.GetIDMessage(200509)) # Rotating temporary dataset.

        parts = arcpy.Array()
        rings = arcpy.Array()
        ring = arcpy.Array()

        with arcpy.da.SearchCursor(lyrFC, updateFields) as inRows, \
             arcpy.da.InsertCursor(lyrTmp, updateFields) as outRows:
            for inRow in inRows:
                shp = inRow[0] # SHAPE
                p = 0
                for part in shp:
                    for pnt in part:
                        if pnt:
                            x, y = RotateXY(pnt.X, pnt.Y, xcen, ycen, angle)
                            ring.add(arcpy.Point(x, y, pnt.ID))
                        else:
                            # if we have a ring, save it
                            if len(ring) > 0:
                                rings.add(ring)
                                ring.removeAll()
                    # we have our last ring, add it
                    rings.add(ring)
                    ring.removeAll()
                    # if only one, remove nesting
                    if len(rings) == 1: rings = rings.getObject(0)
                    parts.add(rings)
                    rings.removeAll()
                    p += 1

                # if only one, remove nesting
                if len(parts) == 1: parts = parts.getObject(0)
                if dFC.shapeType == "Polyline":
                    shp = arcpy.Polyline(parts)
                else:
                    shp = arcpy.Polygon(parts)
                parts.removeAll()

                gridValue = inRow[1] # GRID string
                outRows.insertRow([shp, gridValue])  # write row to output

        arcpy.AddMessage(arcpy.GetIDMessage(200510)) # Merging temporary, rotated dataset with output.
        arcpy.env.qualifiedFieldNames = False
        arcpy.CopyFeatures_management(lyrTmp, outputFC)

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        # reset environment
        arcpy.env.extent = saveExt
        arcpy.env.qualifiedFieldNames = saveQfnSetting

        # Clean up temp files
        defenseHelper.removeDatasetList(deleteme)

        # return pivot point
        try:
            pivot_point = "{0} {1}".format(*pivot_point)
        except:
            pivot_point = None

        return pivot_point

    # END RotateFeatureClass

def GRGFromArea(AOI,
                outputFeatureClass,
                cellWidth,
                cellHeight,
                cellUnits,
                labelStartPos,
                labelStyle,
                labelSeperator):
    '''Create Gridded Reference Graphic (GRG) from area input.'''

    deleteme = []
    scratch = "memory"
    fc_WM = None

    try:
        fc = arcpy.CreateUniqueName("AOI", scratch)
        deleteme.append(fc)

        fishnet = arcpy.CreateUniqueName("fishnet", scratch)
        deleteme.append(fishnet)

        arcpy.CopyFeatures_management(AOI, fc)

        # If output coordinate system set, use that, otherwise use input points SR
        if (arcpy.env.outputCoordinateSystem is not None):
            if arcpy.env.outputCoordinateSystem.type == 'Geographic':
                 arcpy.AddIDMessage("WARNING", 210008) # Output coordinate system must be a projected coordinate system
            else:
                # Project the input point into this SR
                arcpy.AddIDMessage("INFORMATIVE", 200804)
                polyProjected = arcpy.CreateUniqueName("GRG_POINT_PROJECTED", scratch)
                deleteme.append(polyProjected)
                arcpy.Project_management(fc, polyProjected, arcpy.env.outputCoordinateSystem)
                fc = polyProjected

        targetSR = arcpy.Describe(fc).spatialReference

        # If not projected/PCS(GCS), then create a SR that has linear units (the inputs to the tool)
        # Use a local WAZAD to minimize error (similar to defense visibility tools)
        if targetSR.type == 'Geographic':
            arcpy.AddIDMessage("WARNING", 1606) # This tool requires projected data to accurately measure distances
            srLocalWAZED = getLocalWAZED(fc)
            if srLocalWAZED is None:
                # if fails to create local PCS then error and return (should not happen)
                arcpy.AddIDMessage("ERROR", 210008) # Output coordinate system must be a projected coordinate system
                return

            polyGeoProjected = arcpy.CreateUniqueName("GRG_POINT_PROJECTED_FROM_GEO", scratch)
            deleteme.append(polyGeoProjected)
            arcpy.Project_management(fc, polyGeoProjected, srLocalWAZED)
            fc = polyGeoProjected
            targetSR = srLocalWAZED

        luName = targetSR.linearUnitName

        # Convert from input unit value/parameter to meters (defense tools use their own subset of units)
        cellWidthMeters = defenseHelper.convertFromUnitNameToMeters(cellWidth, cellUnits)
        cellHeightMeters = defenseHelper.convertFromUnitNameToMeters(cellHeight, cellUnits)

        # Then convert from meters into Linear Units used by SR
        cellWidth = convertLinearUnits(cellWidthMeters, "Meters", luName)
        cellHeight = convertLinearUnits(cellHeightMeters, "Meters", luName)

        '''
        ' create a minimum bounding rectangle around the AOI
        ' The use of the MBG_FIELDS option in MinimumBoundingGeometry_management
        ' tool also creates a field that has the shape orientation
        '''
        arcpy.AddMessage(arcpy.GetIDMessage(200511)) # Getting Minimum Bounding Geometry that fits the Area of Interest.
        minBound = arcpy.CreateUniqueName("minBound", scratch)
        deleteme.append(minBound)

        arcpy.MinimumBoundingGeometry_management(fc, minBound, 'RECTANGLE_BY_AREA','#','#','MBG_FIELDS')

        '''
        ' Extract the minimum bounding rectangle orienatation angle to a variable
        '''
        with arcpy.da.SearchCursor(minBound,["MBG_Orientation", "MBG_LENGTH", "MBG_WIDTH"]) as mbRows:
            for row in mbRows:
                orientation = row[0]
                arcpy.AddMessage(arcpy.GetIDMessage(200512).format(str(orientation))) # Orientation Angle: {0}.
                if(orientation >= 45 and orientation <= 135):
                    horizontalCells = math.ceil(row[1]/float(cellWidth))
                    verticalCells = math.ceil(row[2]/float(cellHeight))
                else:
                    verticalCells = math.ceil(row[1]/float(cellWidth))
                    horizontalCells = math.ceil(row[2]/float(cellHeight))
                arcpy.AddMessage(arcpy.GetIDMessage(200513).format(horizontalCells, verticalCells)) # Creating Grid {0} x {1}.

        arcpy.AddMessage(arcpy.GetIDMessage(200514).format(labelStartPos)) # labelStartPos
        '''
        ' Set up labeling depending on start position
        '''
        labelNumber = 0
        letterIndex = 0
        secondLetterIndex = 0

        if labelStartPos == "UPPER_LEFT":
            letterIndex = verticalCells - 1
            secondLetterIndex = -1
            if labelStyle != 'NUMERIC':
                labelNumber = 0
            else:
                labelNumber = (verticalCells - 1) * horizontalCells
        elif labelStartPos == "UPPER_RIGHT":
            letterIndex = verticalCells - 1
            secondLetterIndex = horizontalCells
            if labelStyle != 'NUMERIC':
                labelNumber = horizontalCells + 1
            else:
                labelNumber = (verticalCells * horizontalCells) + 1
        elif labelStartPos == "LOWER_RIGHT":
            letterIndex = 0
            secondLetterIndex = horizontalCells
            labelNumber = horizontalCells + 1
        elif labelStartPos == "LOWER_LEFT":
            letterIndex = 0
            secondLetterIndex = -1
            labelNumber = 0

        '''
        ' Explode the minimum bounding rectangle to points
        '''
        with arcpy.da.SearchCursor(minBound, 'SHAPE@XY', explode_to_points=True) as cursor:
            pts = [r[0] for r in cursor][0:4]

        '''
        ' Because the fishnet tool always creates a non rotated fishnet before it applies
        ' its rotation we need to determine what the opposite point location would be if the
        ' minimum polygon was not rotated
        '''
        if orientation < 45:
            angle = math.radians(orientation)
            x = float(pts[2][0]) - float(pts[0][0])
            y = float(pts[2][1]) - float(pts[0][1])
            xr = (x * math.cos(angle)) - (y * math.sin(angle)) + float(pts[0][0])
            yr = (x * math.sin(angle)) + (y * math.cos(angle)) + float(pts[0][1])
            origin = str(pts[0][0]) + ' ' + str(pts[0][1])
            yaxis =  str(pts[1][0]) + ' ' + str(pts[1][1])
        elif orientation >= 45 and orientation <= 135:
            angle = math.radians((90 - orientation) * -1)
            x = float(pts[1][0]) - float(pts[3][0])
            y = float(pts[1][1]) - float(pts[3][1])
            xr = (x * math.cos(angle)) - (y * math.sin(angle)) + float(pts[3][0])
            yr = (x * math.sin(angle)) + (y * math.cos(angle)) + float(pts[3][1])
            origin = str(pts[3][0]) + ' ' + str(pts[3][1])
            yaxis =  str(pts[0][0]) + ' ' + str(pts[0][1])
        else:
            angle = math.radians((180 - orientation) * -1)
            x = float(pts[0][0]) - float(pts[2][0])
            y = float(pts[0][1]) - float(pts[2][1])
            xr = (x * math.cos(angle)) - (y * math.sin(angle)) + float(pts[2][0])
            yr = (x * math.sin(angle)) + (y * math.cos(angle)) + float(pts[2][1])
            origin = str(pts[2][0]) + ' ' + str(pts[2][1])
            yaxis =  str(pts[3][0]) + ' ' + str(pts[3][1])

        oppositeCorner = str(xr) + " " + str(yr)

        '''
        ' Now use the CreateFishnet_management tool to create the desired grid
        '''
        arcpy.AddMessage(arcpy.GetIDMessage(200515)) # Creating Fishnet Grid...
        arcpy.CreateFishnet_management(fishnet, origin, yaxis, str(cellWidth), str(cellHeight), 0, 0, oppositeCorner, "NO_LABELS", fc, "POLYGON")

        '''
        ' Add a field which will be used to add the grid labels
        '''
        arcpy.AddMessage(arcpy.GetIDMessage(200516)) # Adding field for labeling the grid.
        gridField = "Grid"
        arcpy.AddField_management(fishnet, gridField, "TEXT")

        '''
        ' Loop through features and label
        '''

        with arcpy.da.UpdateCursor(fishnet, ['OID','Grid']) as cursor:
            verticalCount = 0
            horizontalCount = 0
            for row in cursor:
                if labelStartPos == "LOWER_LEFT" or labelStartPos == 'UPPER_LEFT':
                    labelNumber = labelNumber + 1
                    secondLetterIndex = secondLetterIndex + 1
                else:
                    labelNumber = labelNumber - 1
                    secondLetterIndex = secondLetterIndex - 1

                letter = ColIdxToXlName_AreaGRG(int(letterIndex))
                secondLetter = ColIdxToXlName_AreaGRG(int(secondLetterIndex))

                if (labelStyle == "ALPHA_NUMERIC"):
                    row[1] = letter + str(int(labelNumber))
                elif (labelStyle == "ALPHA_ALPHA"):
                    row[1] = letter + labelSeperator + secondLetter
                elif (labelStyle == "NUMERIC"):
                    row[1] = labelNumber

                cursor.updateRow(row)

                horizontalCount = horizontalCount + 1

                if horizontalCount >= horizontalCells:
                    horizontalCount = 0
                    verticalCount = verticalCount + 1
                    if labelStartPos == "UPPER_LEFT":
                        letterIndex = letterIndex - 1
                        secondLetterIndex = -1
                        if labelStyle != 'NUMERIC':
                            labelNumber = 0
                        else:
                            labelNumber = (verticalCells - (verticalCount + 1)) * horizontalCells
                    elif labelStartPos == "UPPER_RIGHT":
                        letterIndex = letterIndex - 1
                        secondLetterIndex = horizontalCells
                        if labelStyle != 'NUMERIC':
                            labelNumber = horizontalCells + 1
                    elif labelStartPos == "LOWER_RIGHT":
                        letterIndex = letterIndex + 1
                        secondLetterIndex = horizontalCells
                        if labelStyle != 'NUMERIC':
                            labelNumber = horizontalCells + 1
                        else:
                            labelNumber = ((verticalCount + 1) * horizontalCells) + 1
                    elif labelStartPos == "LOWER_LEFT":
                        letterIndex = letterIndex + 1
                        secondLetterIndex = -1
                        if labelStyle != 'NUMERIC':
                            labelNumber = 0

        arcpy.CopyFeatures_management(fishnet, outputFeatureClass)

        return outputFeatureClass

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None

    finally:
        defenseHelper.removeDatasetList(deleteme)

def GRGFromPoint(starting_point,
                 output_feature_class,
                 horizontal_cells,
                 vertical_cells,
                 cell_width,
                 cell_height,
                 cell_units,
                 label_start_position,
                 label_style,
                 labelSeperator,
                 gridAngle,
                 gridAngleUnits):
    ''' Create Gridded Reference Graphic (GRG) from point input.'''

    targetPointOrigin = starting_point
    numberCellsHo = horizontal_cells
    numberCellsVert = vertical_cells
    cellWidth = cell_width
    cellHeight = cell_height
    cellUnits = cell_units
    labelStartPos = label_start_position
    labelStyle = label_style
    rotation = defenseHelper.convertFromUnitNameToDegrees(gridAngle, gridAngleUnits)
    outputFeatureClass = output_feature_class

    deleteme = []

    point_WM = None
    scratch = "memory"

    try:

        tempOutput = arcpy.CreateUniqueName("tempFishnetGrid", scratch)
        deleteme.append(tempOutput)

        numberOfFeatures = arcpy.GetCount_management(targetPointOrigin)
        if(int(numberOfFeatures[0]) == 0):
            raise Exception("The input start location must contain at least one feature.")

        if(int(numberOfFeatures[0]) > 1):
            arcpy.AddIDMessage("WARNING", 200521) # More than one feature detected for the start location, last feature entered will be used.

        # If output coordinate system set, use that, otherwise use input points SR
        if (arcpy.env.outputCoordinateSystem is not None):
            if arcpy.env.outputCoordinateSystem.type == 'Geographic':
                 arcpy.AddIDMessage("WARNING", 210008) # Output coordinate system must be a projected coordinate system
            else:
                # Project the input point into this SR
                arcpy.AddIDMessage("INFORMATIVE", 200804)
                pointProjected = arcpy.CreateUniqueName("GRG_POINT_PROJECTED", scratch)
                deleteme.append(pointProjected)
                arcpy.Project_management(targetPointOrigin, pointProjected, arcpy.env.outputCoordinateSystem)
                targetPointOrigin = pointProjected

        targetSR = arcpy.Describe(targetPointOrigin).spatialReference

        # If not projected/PCS(GCS), then create a SR that has linear units (the inputs to the tool)
        # Use a local WAZAD to minimize error (similar to defense visibility tools)
        if targetSR.type == 'Geographic':
            arcpy.AddIDMessage("WARNING", 1606) # This tool requires projected data to accurately measure distances
            srLocalWAZED = getLocalWAZED(targetPointOrigin)
            if srLocalWAZED is None:
                # if fails to create local PCS then error and return (should not happen)
                arcpy.AddIDMessage("ERROR", 210008) # Output coordinate system must be a projected coordinate system
                return

            pointGeoProjected = arcpy.CreateUniqueName("GRG_POINT_PROJECTED_FROM_GEO", scratch)
            deleteme.append(pointGeoProjected)
            arcpy.Project_management(targetPointOrigin, pointGeoProjected, srLocalWAZED)
            targetPointOrigin = pointGeoProjected
            targetSR = srLocalWAZED

        luName = targetSR.linearUnitName

        # Convert from input unit value/parameter to meters (defense tools use their own subset of units)
        cellWidthMeters = defenseHelper.convertFromUnitNameToMeters(cellWidth, cellUnits)
        cellHeightMeters = defenseHelper.convertFromUnitNameToMeters(cellHeight, cellUnits)

        # Then convert from meters into Linear Units used by SR
        cellWidth = convertLinearUnits(cellWidthMeters, "Meters", luName)
        cellHeight = convertLinearUnits(cellHeightMeters, "Meters", luName)

        # Get the coordinates of the first point
        extent = None
        with arcpy.da.SearchCursor(targetPointOrigin, ['SHAPE@']) as rows:
            for row in rows:
                shape = row[0]
                extent = shape.extent
                break
        pointExtents = str.split(str(extent))

        # From the template extent, get the origin, y axis, and opposite corner coordinates
        rightCorner =  locale.atof(pointExtents[0]) + ((float(cellWidth) * float(numberCellsVert)) / 2.0)
        leftCorner = locale.atof(pointExtents[0]) - ((float(cellWidth) * float(numberCellsVert)) / 2.0)
        topCorner = locale.atof(pointExtents[1]) + ((float(cellHeight) * float(numberCellsHo)) / 2.0)
        bottomCorner = locale.atof(pointExtents[1]) - ((float(cellHeight) * float(numberCellsHo)) / 2.0)

        originCoordinate = str(leftCorner) + " " + str(bottomCorner)
        yAxisCoordinate = str(leftCorner) + " " + str(bottomCorner + 10)
        oppCornerCoordinate = str(rightCorner) + " " + str(topCorner)
        fullExtent = str(leftCorner) + " " + str(bottomCorner) + " " + str(rightCorner) + " " + str(topCorner)

        # Set the start position for labeling
        startPos = None
        if (labelStartPos == "UPPER_RIGHT"):
            startPos = "UR"
        elif (labelStartPos == "UPPER_LEFT"):
            startPos = "UL"
        elif (labelStartPos == "LOWER_LEFT"):
            startPos = "LL"
        elif (labelStartPos == "LOWER_RIGHT"):
            startPos = "LR"

        arcpy.AddMessage(arcpy.GetIDMessage(200515)) # Creating Fishnet Grid...

        prevOCSSetting = arcpy.env.outputCoordinateSystem 
        arcpy.env.outputCoordinateSystem = targetSR # Set SR to be used by CreateFishnet

        arcpy.CreateFishnet_management(tempOutput, originCoordinate, yAxisCoordinate, 0, 0, str(numberCellsHo), str(numberCellsVert), oppCornerCoordinate, "NO_LABELS", fullExtent, "POLYGON")

        # Sort the grid upper left to lower right, and delete the in memory one
        arcpy.AddMessage(arcpy.GetIDMessage(200518)) # Sorting the grid for labeling.
        tempSort = arcpy.CreateUniqueName("tempSort", scratch)
        deleteme.append(tempSort)

        # Note: Sort on Shape requires Advanced License
        arcpy.Sort_management(tempOutput, tempSort, [["Shape", "ASCENDING"]], startPos)

        # Add a field which will be used to add the grid labels
        arcpy.AddMessage(arcpy.GetIDMessage(200516)) # Adding field for labeling the grid.
        gridField = "Grid"
        arcpy.AddField_management(tempSort, gridField, "TEXT")

        # Number the fields
        arcpy.AddMessage(arcpy.GetIDMessage(200519)) # Numbering the grids.
        letterIndex = 1
        secondLetterIndex = 1
        letter = 'A'
        secondLetter = 'A'
        number = 1
        lastY = -9999

        with arcpy.da.UpdateCursor(tempSort, ['SHAPE@', gridField]) as cursor:
            for row in cursor:
                yPoint = row[0].firstPoint.Y
                if (lastY != yPoint) and (lastY != -9999):
                    letterIndex += 1
                    letter = ColIdxToXlName_PointGRG(letterIndex)
                    if (labelStyle != "NUMERIC"):
                        number = 1
                    secondLetter = 'A'
                    secondLetterIndex = 1
                lastY = yPoint

                if (labelStyle == "ALPHA_NUMERIC"):
                    row[1] = str(letter) + str(number)
                elif (labelStyle == "ALPHA_ALPHA"):
                    row[1] = str(letter) + labelSeperator + str(secondLetter)
                elif (labelStyle == "NUMERIC"):
                    row[1] = str(number)

                cursor.updateRow(row)
                number += 1
                secondLetterIndex += 1
                secondLetter = ColIdxToXlName_PointGRG(secondLetterIndex)

        # Rotate the geometries, if needed.
        if (rotation != 0):
            arcpy.AddMessage(arcpy.GetIDMessage(200520)) # Rotating the grid.
            RotateFeatureClass(tempSort, outputFeatureClass, rotation, 
                               pointExtents[0] + " " + pointExtents[1], scratch)
        else:
            arcpy.CopyFeatures_management(tempSort, outputFeatureClass)

        arcpy.env.outputCoordinateSystem = prevOCSSetting

        return outputFeatureClass

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)

def SortFeaturesByDistanceFromCenter(sourceLayer, sortedFeatures, centerFeature = None):

    deleteme = []

    try:

        useCenterFeature = False
        scratch = arcpy.env.scratchGDB
        if centerFeature is not None:
            if arcpy.Exists(centerFeature):
                centerFeatureCount = int(arcpy.management.GetCount(centerFeature).getOutput(0))
                if (centerFeatureCount == 1):
                    useCenterFeature = True
            if not useCenterFeature:
                # Could not use CenterFeature: %1. There is more than one feature, feature is outside extent, or other issue.
                arcpy.AddIDMessage("WARNING", 200832, str(centerFeature))

        if useCenterFeature:
            meanCenterFeature = centerFeature
        else:
            # Compute the mean center
            arcpy.AddIDMessage("INFORMATIVE", 200833) # No Center Point supplied. Computing and using features Mean Center.
            meanCenterFeature = arcpy.CreateScratchName('mean_center_', workspace=scratch)
            deleteme.append(meanCenterFeature)
            try:
                arcpy.stats.MeanCenter(sourceLayer, meanCenterFeature)
            except:
                pass # WORKAROUND for DeprecationWarning: `np.float` is a deprecated alias for the builtin `float`

        # TODO: may need to switch Parameter from GEODESIC to PLANAR for geo vs. projected source
        arcpy.analysis.Near(sourceLayer, meanCenterFeature, None, "NO_LOCATION", "NO_ANGLE", "GEODESIC", "NEAR_DIST NEAR_DIST")

        arcpy.Sort_management(sourceLayer, sortedFeatures, "NEAR_DIST ASCENDING")

        arcpy.management.DeleteField(sourceLayer, "NEAR_DIST;NEAR_FID")

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def SortFeaturesBySpiral(sourceLayer, sortedFeatures, spatialSortMethod, centerFeature = None, 
                         rangeIncrements = -1):

    deleteme = []

    try:

        useCenterFeature = False
        scratch = arcpy.env.scratchGDB
        if centerFeature is not None:
            if arcpy.Exists(centerFeature):
                centerFeatureCount = int(arcpy.management.GetCount(centerFeature).getOutput(0))
                if (centerFeatureCount == 1):
                    useCenterFeature = True
            if not useCenterFeature:
                # Could not use CenterFeature: %1. There is more than one feature, feature is outside extent, or other issue.
                arcpy.AddIDMessage("WARNING", 200832, str(centerFeature))

        if useCenterFeature:
            meanCenterFeature = centerFeature
        else:
            # Compute the mean center
            arcpy.AddIDMessage("INFORMATIVE", 200833) # No Center Point supplied. Computing and using features Mean Center.
            meanCenterFeature = arcpy.CreateScratchName('mean_center_', workspace=scratch)
            deleteme.append(meanCenterFeature)
            try:
                arcpy.stats.MeanCenter(sourceLayer, meanCenterFeature)
            except:
                pass # WORKAROUND for DeprecationWarning: `np.float` is a deprecated alias for the builtin `float`

        rankedFeatures = arcpy.CreateScratchName('rank_features_', workspace=scratch)
        deleteme.append(rankedFeatures)

        # A bit tricky, we are copying the original layer so we can easily get the extent of the
        # selected features only
        arcpy.CopyFeatures_management(sourceLayer, rankedFeatures)

        if rangeIncrements <= 0:
            # If not set, then set based on the number of features
            rankedFeaturesCount = int(arcpy.management.GetCount(rankedFeatures).getOutput(0))

            if rankedFeaturesCount < 450: # 1 to 9
                rangeIncrements = int(rankedFeaturesCount / 50) + 1
            else:
                rangeIncrements = 10 # 10 if above

        rankedDescribe = arcpy.Describe(rankedFeatures)

        rankedExtent = rankedDescribe.extent
        rankedWidth = max(rankedExtent.width, rankedExtent.height) / 2.0

        rangeIntervalDistance = rankedWidth / float(rangeIncrements)

        arcpy.AddIDMessage("INFORMATIVE", 110035, str(rangeIncrements), str(rangeIntervalDistance))

        rankField = 'RANK_'
        arcpy.AddField_management(rankedFeatures, rankField, "LONG")

        # TODO: may need different method - Near will use meters vs. SR if SRs differ between inputs
        # Switch Parameter from GEODESIC to PLANAR for geo vs. projected source
        arcpy.analysis.Near(rankedFeatures, meanCenterFeature, None, "NO_LOCATION", "ANGLE", 
                        "PLANAR", "NEAR_DIST DIST_TO_CENTER;NEAR_ANGLE ANGLE_TO_CENTER")

        with arcpy.da.UpdateCursor(rankedFeatures, ['DIST_TO_CENTER', 'ANGLE_TO_CENTER', rankField]) as outputCursor:
            for outputRow in outputCursor:
                distanceToCenter = outputRow[0]
                angleToCenter    = outputRow[1]
                # TRICKY: ANGLE_TO_CENTER is currently:
                # (1) Cartesian (we want North bearing) (Note: Near PLANAR option does this)
                # and (2) Angle To Center (we want Angle From Center)
                angleFromCenter  = angleToCenter + 180.0  # Convert Angle To Center to Angle From Center
                cartesianToCompass = (450.0 - angleFromCenter) % 360 # Convert to North Bearing
                rankValue          = int(distanceToCenter / rangeIntervalDistance)  # Set rank by Interval 
                outputRow[1] = cartesianToCompass
                outputRow[2] = rankValue
                outputCursor.updateRow(outputRow)

        clockwise = spatialSortMethod == 'CLOCKWISE'

        if clockwise:
            arcpy.Sort_management(rankedFeatures, sortedFeatures, "RANK_ ASCENDING;ANGLE_TO_CENTER ASCENDING")
        else:
            arcpy.Sort_management(rankedFeatures, sortedFeatures, "RANK_ ASCENDING;ANGLE_TO_CENTER DESCENDING")

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        pass
        defenseHelper.removeDatasetList(deleteme)

def AddDistanceToCenterFeature(inputLayer, centerFeature):

    # Error check
    useCenterFeature = False
    if centerFeature is None:
        centerFeature = "NOT SET"
    else:
        if arcpy.Exists(centerFeature):
            centerFeatureCount = int(arcpy.management.GetCount(centerFeature).getOutput(0))
            if (centerFeatureCount == 1):
                useCenterFeature = True

    if not useCenterFeature:
        # Could not use CenterFeature: %1. There is more than one feature, feature is outside extent, or other issue.
        arcpy.AddIDMessage("WARNING", 200832, str(centerFeature))
        return

    # TODO: 
    # 1. Switch Parameter from GEODESIC to PLANAR for geo vs. projected source
    # 2. Possibly allow DIST_TO_CENTER, ANGLE_TO_CENTER to be parameters (hard-coded for now)
    arcpy.analysis.Near(inputLayer, centerFeature, None, "NO_LOCATION", "ANGLE", 
                        "GEODESIC", "NEAR_DIST DIST_TO_CENTER;NEAR_ANGLE ANGLE_TO_CENTER")

    # TRICY: Near GEODESIC returns bearing from North, but with negative angles
    arcpy.management.CalculateField(inputLayer, "ANGLE_TO_CENTER", 
        "CalcNiceBearing(!ANGLE_TO_CENTER!, !DIST_TO_CENTER!)", "PYTHON3", 
        """def CalcNiceBearing(bearingIn, distance):
        if distance < 0:
            return 0
        else:
            bearing = bearingIn
            if bearingIn < 0:
                bearing = 360.0 + bearingIn
            return round(bearing, 0)""", 
        "TEXT", "NO_ENFORCE_DOMAINS")

    # This always gets added by Near GP Tool for some reason, even when you tell it not to
    arcpy.management.DeleteField(inputLayer, "NEAR_FID")

def NumberFeatures(inputFeatures,
                   fieldToNumber,
                   inputArea,
                   spatialSortMethod,
                   startingNumber,
                   incrementBy,
                   newFieldType,
                   centerFeature,
                   centerDistanceAdd,
                   overwriteValueIfExists = True,
                   letteringFormat = None,
                   startingLetter = None,
                   omitLetters = None):

    deleteme = []

    try:

        useLettersForNumbers = False
        numbers2Letters = None
        if startingNumber < 0 and letteringFormat is not None and startingLetter is not None:
            useLettersForNumbers = True
            numbers2Letters = defenseHelper.NumbersToLetters(letterFormat=letteringFormat, omitLettersList=omitLetters)
            startingNumber = numbers2Letters.letterToNumber(startingLetter)
            if startingNumber < 0 or startingNumber > 2000:
                arcpy.AddIDMessage("WARNING", 200826, str(startingLetter)) # Not a valid ASCII letter, or could not convert letter(s) to value:
                startingNumber = 1 # Make sure we get some reasonable value or don't use

        if int(startingNumber) > 100000:
            arcpy.AddIDMessage("WARNING", 201005, str(startingNumber)) # Value larger than expected: 

        if int(incrementBy) > 10000:
            arcpy.AddIDMessage("WARNING", 201005, str(incrementBy)) # Value larger than expected: 

        joinFieldName, notUsedAlias = defenseHelper.createUniqueFieldName(inputFeatures, 'f_join_id')
        defenseHelper.addUniqueID(inputFeatures, joinFieldName, "LONG")

        if overwriteValueIfExists:
            inputFeaturesLayer = arcpy.MakeFeatureLayer_management(inputFeatures).getOutput(0)
        else:
            inputFeaturesLayer = inputFeatures 

        if inputArea is None:
            selectionLayer = inputFeaturesLayer
        else:
            inputFeaturesLayerName = inputFeaturesLayer if isinstance(inputFeaturesLayer, str) else inputFeaturesLayer.name

            selectionLayer = arcpy.SelectLayerByLocation_management(inputFeaturesLayerName, 
                "INTERSECT", inputArea, "#", "NEW_SELECTION")
        scratch = arcpy.env.scratchGDB
        sorted_features = arcpy.CreateScratchName('sorted_features_', workspace=scratch)
        deleteme.append(sorted_features)

        if spatialSortMethod in supportedSortMethods[0:5]:
            arcpy.Sort_management(selectionLayer, sorted_features, [["Shape", "ASCENDING"]], spatialSortMethod)
        elif spatialSortMethod == supportedSortMethods[5]: # 'CENTER' 
            SortFeaturesByDistanceFromCenter(selectionLayer, sorted_features, centerFeature)
        elif spatialSortMethod in supportedSortMethods[6:8]: # 'COUNTERCLOCKWISE', 'CLOCKWISE'
            SortFeaturesBySpiral(selectionLayer, sorted_features, spatialSortMethod, centerFeature)
        else: # NONE or other(unexpected value)
            arcpy.CopyFeatures_management(selectionLayer, sorted_features)

        defenseHelper.addUniqueID(sorted_features, fieldToNumber, newFieldType, 
                                   startingNumber, incrementBy)

        fieldNames = [f.name for f in arcpy.ListFields(inputFeatures)]

        ##############################################################################
        # ORIGINAL
        # Note: Needed to be changed because it would overwrite existing values with nulls
        # - not always the desired behavior if we are numbering one sector at a time
        # # Delete the numbering field if it exists (the join below will put it back)
        #if fieldToNumber in fieldNames: 
        #    arcpy.DeleteField_management(inputFeatures, fieldToNumber)
        #arcpy.JoinField_management(inputFeatures, joinFieldName,
        #                            sorted_features, joinFieldName,
        #                            fieldToNumber) 
        # NEW: brute force feature class join code for just the join_id and number fields
        if not fieldToNumber in fieldNames: 
            arcpy.AddField_management(inputFeatures, fieldToNumber, newFieldType)

        # Create a dictionary mapping JoinID to the number
        joinFieldToNumberDict = {}
        with arcpy.da.SearchCursor(sorted_features, [joinFieldName, fieldToNumber]) as inputCursor:
            for inputRow in inputCursor:
                joinID = inputRow[0]
                number = inputRow[1]
                if joinID is not None and number is not None:
                    joinFieldToNumberDict[joinID] = number

        editOp = defenseHelper.requiresEditOp(inputFeatures)
        if editOp:
            wkspc = defenseHelper.getWorkspace(inputFeatures)
            edit = arcpy.da.Editor(wkspc)
            edit.startEditing()
            edit.startOperation()

        # Now update the input features with this number if the JoinIDs match
        with arcpy.da.UpdateCursor(inputFeatures, [joinFieldName, fieldToNumber]) as outputCursor:
            for outputRow in outputCursor:
                joinID2     = outputRow[0]
                transferVal = outputRow[1]

                if joinID2 in joinFieldToNumberDict:
                    if transferVal is None or overwriteValueIfExists:
                        transferVal = joinFieldToNumberDict[joinID2]

                        if useLettersForNumbers:
                            transferVal = numbers2Letters.numberToLetter(transferVal)

                outputRow[1] = transferVal
                outputCursor.updateRow(outputRow)

        if editOp:
            edit.stopOperation()
            edit.stopEditing(True)
            del edit
        #
        ##############################################################################

        arcpy.DeleteField_management(inputFeatures, joinFieldName)

        if centerDistanceAdd: 
            AddDistanceToCenterFeature(selectionLayer, centerFeature)

        arcpy.SelectLayerByAttribute_management(selectionLayer, "CLEAR_SELECTION")

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def NumberBySector(inputFeatures,
                   sectorsToNumber,
                   fieldToNumber,
                   inputArea,
                   newFieldType,
                   spatial_sort_method,
                   sector_increment,
                   center_feature,
                   center_distance_add):

    deleteme = []

    try:

        if spatial_sort_method in supportedSortMethods:
            default_spatial_sort_method = spatial_sort_method
        else:
            default_spatial_sort_method = 'CENTER'

        # TRICKY: Zero out values in fieldToNumber if it exists
        fieldNames = [f.name for f in arcpy.ListFields(inputFeatures)]
        if fieldToNumber in fieldNames: 
            arcpy.AddIDMessage("INFORMATIVE", 200831, str(fieldToNumber)) # Field: %1 already exists, clearing values
            arcpy.CalculateField_management(inputFeatures, fieldToNumber, "None", "PYTHON3")

        CENTER_KEY = 'CENTER'

        fieldNames = [f.name for f in arcpy.ListFields(sectorsToNumber)]

        # SectorName, StartNumber, SortMethod

        searchFields = []
        searchFields.append("OID@")   # Index 0
        searchFields.append("Shape@") # Index 1

        # We won't require these fields, but use them if they exist
        sectorNameIndex = 0
        if "SectorName" in fieldNames: 
            searchFields.append("SectorName")
            sectorNameIndex = 2

        startNumberIndex = 0
        if "StartNumber" in fieldNames: 
            searchFields.append("StartNumber")
            startNumberIndex = (sectorNameIndex > 0) + 2

        sortMethodIndex = 0
        if "SortMethod" in fieldNames: 
            searchFields.append("SortMethod")
            sortMethodIndex = (sectorNameIndex > 0) + (startNumberIndex > 0) + 2

        sectorDictionary = {}

        sectorCount = 0
        with arcpy.da.SearchCursor(sectorsToNumber, searchFields) as cursor:
            # print(cursor.fields)
            for row in cursor:
                sectorCount += 1

                sectorOID   = row[0]
                sectorShape = row[1]

                sectorName = "Sector: " + str(sectorCount)
                if sectorNameIndex > 0 :
                    sectorName = row[sectorNameIndex].upper() # IMPORTANT: make these uppercase

                # IMPORTANT: if no start number set in Sector FeatureClass use default of sector_increment
                startNumber = sectorCount * sector_increment 
                if startNumberIndex > 0 :
                    startNumber = row[startNumberIndex]

                sortMethod = default_spatial_sort_method
                if sortMethodIndex > 0 :
                    sortMethod = row[sortMethodIndex]

                sectorDictionary[sectorName] = (sectorOID, sectorShape, startNumber, sortMethod)

        inputFeaturesLayer = "inputFeaturesLayer"
        arcpy.MakeFeatureLayer_management(inputFeatures, inputFeaturesLayer)
        sectorsToNumberLayer = "sectorsToNumberLayer"
        arcpy.MakeFeatureLayer_management(sectorsToNumber, sectorsToNumberLayer)

        # Debug
        # preSelectedCount = int(arcpy.management.GetCount(inputFeaturesLayer).getOutput(0))
        # print("Total Features: " + str(preSelectedCount))

        removeCenterSector = False
        centerShape = None
        upperSectorNames = list(sectorDictionary.keys())
        if CENTER_KEY in upperSectorNames:
            # if we have a Sector with this special name, then we will need to exclude this from the other sector
            removeCenterSector = True
            centerShape = sectorDictionary[CENTER_KEY][1]

        for sectorKey, sectorTuple in sectorDictionary.items(): 

            sectorName  = sectorKey
            sectorOID   = sectorTuple[0]
            sectorShape = sectorTuple[1]
            startNumber = sectorTuple[2]
            sortMethod  = sectorTuple[3]

            # Numbering Sector, Name : %1, StartNumber/Sort Method: %2
            arcpy.AddIDMessage("INFORMATIVE", 200834, sectorName, str(startNumber) + '/' + sortMethod)

            arcpy.management.SelectLayerByLocation(inputFeaturesLayer, "INTERSECT", sectorShape, '#', "NEW_SELECTION")

            # TRICKY: if there is a special sector name: "Center" then
            # remove this center sector from selection to allow these to overlap, 
            # and not be double counted
            if removeCenterSector and (sectorName != CENTER_KEY):
                arcpy.management.SelectLayerByLocation(inputFeaturesLayer, "INTERSECT", centerShape, '#', "REMOVE_FROM_SELECTION")

            # Debug: 
            # postSelectedCount = int(arcpy.management.GetCount(inputFeaturesLayer).getOutput(0))
            # print("Sector: " + sectorName + ", Selection Count: " + str(postSelectedCount))

            # Now we have the selection set we want, we can 
            NumberFeatures(inputFeaturesLayer,
                   fieldToNumber,
                   inputArea,
                   sortMethod,
                   startNumber,
                   1,
                   newFieldType,
                   center_feature,
                   False,
                   overwriteValueIfExists = False)

            arcpy.SelectLayerByAttribute_management(inputFeaturesLayer, "CLEAR_SELECTION")

        # Note: we have to do this here, vs. in NumberFeatures or all the rows will not be calculated
        if center_distance_add: 
            if inputArea is None:
                selectionLayer = inputFeaturesLayer
            else:
                selectionLayer = arcpy.SelectLayerByLocation_management(inputFeaturesLayer, 
                    "INTERSECT", inputArea, "#", "NEW_SELECTION")
            AddDistanceToCenterFeature(selectionLayer, center_feature)

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

