'''
 ==================================================
 defenseVisibilityUtilities.py
 --------------------------------------------------
 requirements: ArcGIS Pro
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Provides helper methods for Visibility tools
 ==================================================
'''

# IMPORTS ==========================================
import math
import os
import sys
import re
import locale
import arcpy

try:
    from . import defenseHelper
except ImportError:
    import defenseHelper

# LOCALS ===========================================
deleteme = [] # intermediate datasets to be deleted
debug = False # extra messaging during development
srWGS84 = arcpy.SpatialReference(4326) # GCS_WGS_1984
srWAZED = arcpy.SpatialReference(54032) # World Azimuthal Equidistant
llosFields = {"OFFSET":[2.0, "Offset height above surface"]}
rlosFields = {"OFFSETA":[2.0, "Observer offset above surface"],
              "OFFSETB":[0.0, "Target offset above surface"],
              "RADIUS1":[0.0, "Minimum range from observer"],
              "RADIUS2":[1000.0, "Maximum range from observer"],
              "AZIMUTH1":[0.0, "Left azimuth"],
              "AZIMUTH2":[360.0, "Right azimuth"],
              "VERT1":[90.0, "Top vertical angle"],
              "VERT2":[-90.0, "Bottom vertical angle"]}
acceptableDistanceUnits = ['METERS', 'KILOMETERS',
                           'MILES', 'NAUTICAL_MILES',
                           'FEET', 'US_SURVEY_FEET']
joinExcludeFields = ['OBJECTID', 'OID', 'ObjectID',
                     'SHAPE', 'Shape', 'Shape_Length', 'Shape_Area']
scratch = None

# FUNCTIONS ========================================

def FindFirstRasterLayer():
    ''' Return the first raster layer found in the current Pro map '''
    try :
        aprx = arcpy.mp.ArcGISProject("CURRENT")
        currentMap = aprx.listMaps()[0]
        for layer in currentMap.listLayers():
            if arcpy.Describe(layer).dataType == 'MosaicLayer':
                return layer.name
            elif layer.isRasterLayer:
                return layer.name
    except :
        pass

    return None

def _getFieldNameList(targetTable, excludeList):
    '''
    Returns a list of field names from targetTable
    '''
    nameList = []
    try:
        if not targetTable:
            raise Exception("Source table {0} does not exist or is null.".format(targetTable))
        fields = arcpy.ListFields(targetTable)
        for field in fields:
            if not excludeList or not excludeList == []:
                if not field.name in excludeList:
                    nameList.append(field.name.upper())
            else:
                nameList.append(field.name.upper())
        return nameList
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _addDoubleField(targetTable, fieldsToAdd):
    '''
    Adds a list of fields to a targetTable
    '''
    try:
        existingFields = _getFieldNameList(targetTable, joinExcludeFields)
        for currentField in list(fieldsToAdd.keys()):
            if currentField in existingFields:
                arcpy.AddIDMessage("WARNING", 200814, currentField, targetTable) # Field {0} is already in {1}. Skipping this field name.
            else:
                fName = currentField
                fDefault = float(fieldsToAdd[currentField][0])
                fAlias = fieldsToAdd[currentField][1]
                if debug: arcpy.AddMessage(arcpy.GetIDMessage(200751).format(fName,fAlias)) # Adding field {0} with alias {1}.
                arcpy.AddField_management(targetTable,
                                          fName,
                                          "DOUBLE",
                                          '',
                                          '',
                                          '',
                                          fAlias) 
        return targetTable
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _calculateDefaultFieldValues(targetTable, fieldsToAdd):
    '''
    Calculates default field values from built-in list
    '''
    try:
        existingFields = _getFieldNameList(targetTable, joinExcludeFields)
        for currentField in fieldsToAdd:
            if not currentField in existingFields:
                arcpy.AddIDMessage("WARNING", 200815, currentField, targetTable) # Cannot calculate default for {0}. Field does not exist in {1}.
            else:
                if debug:
                    arcpy.AddMessage(arcpy.GetIDMessage(200752).format(currentField)) # Calculating default for {0}
                arcpy.CalculateField_management(targetTable,
                                                currentField,
                                                fieldsToAdd[currentField][0],
                                                "PYTHON_9.3")

        return targetTable
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _calculateFieldValue(targetTable, fieldName, fieldValue):
    '''
    Calculates field value from argument
    '''
    try:
        existingFields = _getFieldNameList(targetTable, joinExcludeFields)
        if not fieldName in existingFields:
            raise Exception("Field {0} is not in {1}".format(fieldName, targetTable))
        else:
            arcpy.CalculateField_management(targetTable,
                                            fieldName,
                                            fieldValue,
                                            "PYTHON_9.3")
        return targetTable
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _getRasterMinMax(inputRaster):
    '''
    returns minimum and maximum statistic value from an input raster
    '''
    try:
        minR = locale.atof(arcpy.GetRasterProperties_management(inputRaster, "MINIMUM").getOutput(0))
        maxR = locale.atof(arcpy.GetRasterProperties_management(inputRaster, "MAXIMUM").getOutput(0))
        if debug: arcpy.AddMessage(arcpy.GetIDMessage(200753).format(minR, maxR)) # _getRasterMinMax min={0}, max={1}"
        return [minR, maxR]
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _clipRasterToArea(inputSurface, inputArea, outputClip):
    '''
    returns a raster subset that is clipped from inputSurface using inputArea.
    '''
    try:
        #Need Spatial Analyst to run this tool
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise Exception("Spatial Analyst license is not available.")

        from arcpy import sa

        arcpy.AddMessage(arcpy.GetIDMessage(200754).format(os.path.basename(str(inputSurface)),
                                                              os.path.basename(inputArea)))  # Clipping {0} to area {1}...
        saClipSurface = sa.ExtractByMask(inputSurface, inputArea)
        saClipSurface.save(outputClip)

        return outputClip
    
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _getUniqueValuesFromField(inputTable, inputField):
    '''
    Get a list of unique values from inputField in inputTable
    '''
    try:
        valueList = []
        with arcpy.da.SearchCursor(inputTable, inputField) as cursor:
            for row in cursor:
                if not row[0] in valueList:
                    valueList.append(row[0])
        valueList.sort(reverse=True)
        #if debug: arcpy.AddMessage("Sorted list: {0}".format(valueList))
        return valueList
    
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _getCentroid(inputFeatures):
    '''
    Gets the centroid of Featureclass using Minimum Bounding Geometry's Rectange By Width option
    returns a PointGeometry
    '''
    try:
        featureSR = arcpy.Describe(inputFeatures).spatialReference
        centroidPoint = None

        observerMBG = arcpy.CreateUniqueName("observerMBG", "memory")
        deleteme.append(observerMBG)

        result = arcpy.MinimumBoundingGeometry_management(inputFeatures,
                                                          observerMBG,
                                                          "RECTANGLE_BY_WIDTH")
        with arcpy.da.SearchCursor(observerMBG, ["SHAPE@"]) as cursor:
            for row in cursor:
                plyCentroid = row[0].centroid
                centroidPoint = arcpy.PointGeometry(plyCentroid, featureSR)

        return centroidPoint
    
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _getLocalWAZED(inputPoint):
    '''
    return a localized World Azimuthal Equidistant
    Spatial Reference based on inputPoint as PointGeometry
    '''
    try:
        newSR = arcpy.SpatialReference()
        pntGeom = inputPoint.projectAs(srWGS84)
        pnt = pntGeom.firstPoint
        strAZED = srWAZED.exportToString()
        arcpy.AddMessage(arcpy.GetIDMessage(200810).format(pnt.X, pnt.Y)) # Using Central Meridian: {0}, and Latitude of Origin: {1}.
        strAZED = re.sub('PARAMETER\[\"Central_Meridian\"\,.+?]',
               'PARAMETER[\"Central_Meridian\",{0}]'.format(str(pnt.X)),
               strAZED)
        strAZED = re.sub('PARAMETER\[\"Latitude_Of_Origin\"\,.+?]',
               'PARAMETER[\"Latitude_Of_Origin\",{0}]'.format(str(pnt.Y)),
               strAZED)
        newSR.loadFromString(strAZED)

        return newSR

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def _prepPointFromSurface(inputPoints, inputSurface, outputPoints, offsetFieldName, spotFieldName):
    '''
    Adds attributes and SPOT and makes 3D Points
    '''
    try:
        if debug: arcpy.AddMessage(arcpy.GetIDMessage(200755).format(os.path.basename(inputPoints)))  # Adding surface info for {0}
        zFieldName = "Z"
        # get Z from surface for points
        arcpy.AddSurfaceInformation_3d(inputPoints,
                                    inputSurface,
                                    zFieldName,
                                    "BILINEAR")

        inputPoints = _addDoubleField(inputPoints,
                                      {spotFieldName:[0.0, spotFieldName]})
        # calculate SPOT = Z + OFFSET
        arcpy.CalculateField_management(inputPoints,
                                        spotFieldName,
                                        "!{0}! + !{1}!".format(zFieldName, offsetFieldName),
                                        "PYTHON_9.3")
        
        # Make 3D point from SPOT
        arcpy.FeatureTo3DByAttribute_3d(inputPoints,
                                     outputPoints,
                                     spotFieldName)
        
        return outputPoints

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
        return None

def surfaceContainsPoints(pointFeatures, surfaceRaster):
    '''
    Check if points fall within surface extent, return True or False

    Note: projects both surface extent and pointFeatures to WGS84 so both will 
    have same Spatial Reference and within checks will work 
    '''
    try:

        surfaceDesc = arcpy.Describe(surfaceRaster)
        pointsDesc = arcpy.Describe(pointFeatures)

        surfaceSR = surfaceDesc.spatialReference
        pointsSR = pointsDesc.spatialReference

        # Warn if not the same Spatial Reference
        if (surfaceSR.name != pointsSR.name) or (surfaceSR.FactoryCode != pointsSR.FactoryCode) :
            arcpy.AddIDMessage("INFORMATIVE", 200812, str(pointsSR.name), str(surfaceSR.name)) # Checking if input surface contains input points. Surface and input points spatial references do not match: {0} is not equal to {1}.

        surfaceExtent = surfaceDesc.extent

        projSurfaceExtent = surfaceExtent.projectAs(srWGS84) 

        isWithin = False

        with arcpy.da.SearchCursor(pointFeatures, ["SHAPE@"]) as pointRows:
            for pointRow in pointRows:
    
                point = pointRow[0]   
                projPoint = point.projectAs(srWGS84).firstPoint

                isWithin = projSurfaceExtent.contains(projPoint) 

                x = projPoint.X  
                y = projPoint.Y 
          
                if not isWithin : 
                    arcpy.AddIDMessage("WARNING", 200813, str(x), str(y)) # Point:{0}, {1} is *NOT* in extent of the analysis area.
                    break

    except:
        arcpy.AddWarning(arcpy.GetIDMessage(61040) + " surfaceContainsPoints()")
        isWithin = True

    if debug: arcpy.AddMessage(arcpy.GetIDMessage(200756).format(isWithin)) # Input Points Within Surface: {0}

    return isWithin

def makeProfileGraph(inputFeatures):
    ''' Add a ProfileGraph attachment to the dataset '''

    try:

        import matplotlib
        current_backend = matplotlib.get_backend()
        required_backend = 'Agg'
        if current_backend != required_backend:
            # Workaround: starting at 2.7, this backend changed
            # Switch backend to one that will work with files
            arcpy.AddMessage('matplotlib: ' + current_backend + ' -> ' + required_backend)
            matplotlib.use(required_backend)

        import matplotlib.pyplot as plt

        scratchFolder = arcpy.env.scratchFolder
        srInput = arcpy.Describe(inputFeatures).spatialReference

        rawLOS = {}
        profileGraphName = "profile"
        # Current: {<SourceOID> : [<TarIsVis>, [<observerD=0.0>,<observerZ>],
        #                                      [<targetD>,<targetZ>],
        #                                      [<segmentList>]]]}
        #
        #             where
        #           [<segment>] is [<visibilityCode>,[d0,...,dN],[z0,...,zN]]
            
        # Unique sight lines
        sightLineIDs = []
        with arcpy.da.SearchCursor(inputFeatures,["SourceOID"]) as rows:
            for row in rows:
                thisID = row[0]
                if thisID not in sightLineIDs:
                    sightLineIDs.append(thisID)

        #if debug == True: arcpy.AddMessage("sightLineIDs list: " + str(sightLineIDs))
        arcpy.AddMessage(arcpy.GetIDMessage(200757).format(len(sightLineIDs)))
        
        arcpy.AddField_management(inputFeatures,profileGraphName,"TEXT")
        expression = '"profile" + str(!SourceOID!) + ".png"'
        arcpy.CalculateField_management(inputFeatures,profileGraphName,expression, "PYTHON")
        
        # get visible and non-visible lines for each LLOS
        for currentID in sightLineIDs:
            whereclause = ('"SourceOID" = {0}'.format(currentID))
            tarIsViz = None
            cursorFields = ["OID@","SHAPE@", "SourceOID", "TarIsVis","VisCode","ObsSPOT","TgtSPOT","OID_OBSERV","OID_TARGET"]
            with arcpy.da.SearchCursor(inputFeatures, cursorFields,whereclause) as rows:
                startX = None
                startY = None
                tgtD = 0.0
                line = 0
                segmentList = []
                for row in rows:
                    oid = row[0]
                    geometry = row[1]
                    sourceOID = row[2]
                    targetIsViz = row[3]
                    visibilityCode = row[4]
                    obsD = 0.0
                    obsZ = row[5]
                    tgtZ = row[6]
                    obsID = row[7]
                    tgtID = row[8]
                    partNum = 0
                    point = 0
                    partCount = geometry.partCount
                    #if debug == True: arcpy.AddMessage("OID: " + str(oid))
                    # go through parts in the line
                    for part in geometry:
                        #if debug == True: arcpy.AddMessage("Line: " + str(line) + " Part: " + str(partNum) + " PointCount: " + str(len(part)))
                        segment = []
                        partD = []
                        partZ = []
                        for pnt in part:
                            if (line == 0) and (partNum == 0) and (point == 0): # if it is the very first point in the LLOS
                                startX = pnt.X
                                startY = pnt.Y
                                #if debug == True: arcpy.AddMessage("startX,startY: " + str(startX) + "," + str(startY))
                                distFromStart = 0
                                partD.append(0.0)
                                partZ.append(pnt.Z)
        
                            else: # for all other points in the LLOS
                                distFromStart = math.sqrt((pnt.X - startX)**2 + (pnt.Y - startY)**2)
                                if distFromStart > tgtD:
                                    tgtD = distFromStart
                                partD.append(distFromStart)
                                partZ.append(pnt.Z)
                            point += 1
                            #if debug == True: arcpy.AddMessage("Adding parts to segment ...")
                            segment = [visibilityCode,partD,partZ]
                            #if debug == True: arcpy.AddMessage("\nsegment: " + str(segment) + "\n")
                        partNum += 1
                        #if debug == True: arcpy.AddMessage("Adding segment to segment list ...")
                        segmentList.append(segment)
                    line += 1
            #del rows
            rawLOS[currentID] = [targetIsViz,[obsD,obsZ,obsID],[tgtD,tgtZ,tgtID],segmentList]
        #if debug == True: arcpy.AddMessage("rawLOS: " + str(rawLOS))
        
        # build a graph for each LLOS
        graphLocationDict = {}
        arcpy.AddMessage(arcpy.GetIDMessage(200758)) # Building graphs for lines ...
        #for llosID in rawLOS.keys(): #UPDATE
        for llosID in list(rawLOS.keys()):

            graphInputList = rawLOS[llosID]
            # get the values for the current llos
            # Current: {<SourceOID> : [<TarIsVis>, [<observerD=0.0>,<observerZ>],
            #                                      [<segmentList0>,...,<segmentListN>]]}

            targetVisibility = graphInputList[0]
            observer = graphInputList[1]
            obsD = observer[0]
            obsZ = observer[1]
            obsID = observer[2]
            target = graphInputList[2]
            tgtD = target[0]
            tgtZ = target[1]
            tgtID = target[2]
            segmentList = graphInputList[3]
            arcpy.AddMessage(arcpy.GetIDMessage(200759).format(str(obsID), str(tgtID))) # Building graph from observer {0} to target {1}...
            # plot the line of sight
            plt.plot([obsD,tgtD],[obsZ,tgtZ],'k--',linewidth=1)

            # plot the visible profile
            for segment in segmentList:
                if segment[0] == 1 and len(segment[1]) != 0: # for visible segments - plot in green
                    segmentVizColor = 'g'
                if segment[0] == 2 and len(segment[1]) != 0: # for non-visible segments - plot in red
                    segmentVizColor = 'r'
                plt.plot(segment[1], segment[2], segmentVizColor, linewidth=1)

            # plot observer
            blueFilledCircle = 'bo'
            greenFilledCircle = 'go'
            redFilledCircle = 'ro'
            plt.plot(obsD, obsZ, blueFilledCircle)
            # plot target
            if targetVisibility == 1:
                targetSymbol = greenFilledCircle
            else:
                targetSymbol = redFilledCircle
            plt.plot(tgtD, tgtZ, targetSymbol)

            # titles & labels
            if (targetVisibility == 1):
                targetVisibilityMsg = "VISIBLE"
            else:
                targetVisibilityMsg = "NOT VISIBLE"
            plt.title("Target {0} is {1} to observer {2}".format(tgtID, targetVisibilityMsg, obsID))
            plt.ylabel("Elevation above sea level")
            plt.xlabel("Distance to target ({0})".format(srInput.linearUnitName))
            plt.grid(True)

            # save the graph to a PNG file in the scratch folder
            graphPath = os.path.join(scratchFolder, "profile{0}.png".format(llosID))
            #if debug == True: arcpy.AddMessage("graphPath: " + str(graphPath))
            plt.savefig(graphPath, dpi=120)
            plt.clf() # clear the figure

            graphLocationDict[llosID] = graphPath
            deleteme.append(graphPath)

        plt.close('all') # close all graphs
        if current_backend != required_backend:
            # restore previous matplotlib backend
            arcpy.AddMessage('matplotlib: ' + required_backend + ' -> ' + current_backend)
            matplotlib.use(current_backend)

        arcpy.AddMessage(arcpy.GetIDMessage(200760)) # Enabling attachments ...
        arcpy.EnableAttachments_management(inputFeatures)

        matchTable = os.path.join(scratch,"matchTable")
        deleteme.append(matchTable)
        arcpy.AddMessage(arcpy.GetIDMessage(200761)) # Building match table ...
        arcpy.GenerateAttachmentMatchTable_management(inputFeatures,scratchFolder,matchTable,profileGraphName,"*.png","ABSOLUTE")

        arcpy.AddMessage(arcpy.GetIDMessage(200762)) # Attaching profile graphs to sightlines ...
        inOIDField = arcpy.Describe(inputFeatures).OIDFieldName
        arcpy.AddAttachments_management(inputFeatures,inOIDField,matchTable,"MatchID","Filename")

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

def makeImageServiceLayer(url, outName, extent):

    if not (url and outName and extent):
        return None

    imageLayer = arcpy.management.MakeImageServerLayer(url, outName, extent)

    return imageLayer

def expandExtent(extent, expandBy=0.5):
    """
    Increase the size of an arcpy extent object by a given percentage. 
    :param extent: arcpy.Extent object
    :param expandBy: float, percentage to increase the extent size by
    :return: arcpy.Extent object with increased size
    """

    # Calculate the new width and height
    newWidth = extent.width * (1 + expandBy)
    newHeight = extent.height * (1 + expandBy)
    
    # Calculate the difference between the old and new width/height
    deltaWidth = newWidth - extent.width
    deltaHeight = newHeight - extent.height
    
    # Create a new extent object with the increased size
    expandedExtent = arcpy.Extent(
        extent.XMin - deltaWidth / 2,
        extent.YMin - deltaHeight / 2,
        extent.XMax + deltaWidth / 2,
        extent.YMax + deltaHeight / 2)
    
    return expandedExtent

def getUnionOfFCExtents(featureClassList, expandByPercent = 0.25):

    scratch = arcpy.env.scratchGDB
    mergedFeatures = arcpy.CreateUniqueName("merged", scratch)
    arcpy.Merge_management(featureClassList, mergedFeatures)
    envelopeOfPoints = arcpy.CreateUniqueName("envelope_of_points", scratch)
    arcpy.MinimumBoundingGeometry_management(mergedFeatures, envelopeOfPoints, 'ENVELOPE')
    desc = arcpy.Describe(envelopeOfPoints)

    unionExtent = desc.extent
 
    expandByExtent = expandExtent(unionExtent, expandByPercent)

    return expandByExtent

####### TOOL METHODS #######

def highestPointsByArea(inputAreaFeature,
                      inputSurfaceRaster,
                      outputPointFeature):
    ''' Highest Points By Area main method '''

    hi_low_Switch = 'MAXIMUM'

    return hi_lowPointByArea(inputAreaFeature,
                      inputSurfaceRaster,
                      hi_low_Switch,
                      outputPointFeature)

def lowestPointsByArea(inputAreaFeature,
                      inputSurfaceRaster,
                      outputPointFeature):
    ''' Lowest Points By Area main method '''

    hi_low_Switch = 'MINIMUM'

    return hi_lowPointByArea(inputAreaFeature,
                      inputSurfaceRaster,
                      hi_low_Switch,
                      outputPointFeature)

def hi_lowPointByArea(inputAreaFeature,
                      inputSurfaceRaster,
                      hi_low_Switch,
                      outputPointFeature):
    '''
    Finds the highest or lowest point by pixel value in a given inputAreaFeature of inputSurfaceRaster
    inputAreaFeature - input polygon feature
    inputSurfaceRaster - input raster of elevation
    hi_low_Switch - MAXIMUM for highest,
                    or MINIMUM for lowest
    outputPointFeature - point feature class containing results
    
    returns point feature class
    '''
    global scratch
    try:

        ## Check if a valid input area is supplied
        if not inputAreaFeature:
            arcpy.AddMessage(arcpy.GetIDMessage(200763)) # No in out area - using entire surface
        else:
            if not arcpy.Exists(inputAreaFeature):
                arcpy.AddIDMessage("ERROR", 200816) # Please provide a valid input area
                return
            # Check if there are features in the input area
            if int(arcpy.GetCount_management(inputAreaFeature).getOutput(0)) == 0:
                arcpy.AddIDMessage("ERROR", 200817) # Please provide at least one input area feature
                return

        #Need Spatial Analyst to run this tool
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise Exception("Spatial Analyst license is not available.")
        from arcpy import sa
        scratch = arcpy.env.scratchGDB
        # Get SR of the surface and set as default output
        surfaceDescribe = arcpy.Describe(inputSurfaceRaster)
        srSurface = surfaceDescribe.spatialReference
        #surfaceCellSize = max(surfaceDescribe.meanCellHeight, surfaceDescribe.meanCellWidth)
        arcpy.env.outputCoordinateSystem = srSurface
        arcpy.AddMessage(arcpy.GetIDMessage(200764).format(srSurface.name)) #  Using {0} for analysis.
        
        if inputAreaFeature is None:
            clipSurface = inputSurfaceRaster   
        else:
            # Clip surface to area

            #TODO: Warn user if clipping large area of small cells, and processing will take time
            
            #Make a copy of the input Area in the SR of the surface
            tempAreaFeatures = arcpy.CreateUniqueName("tempAreaFeatures", scratch)
            deleteme.append(tempAreaFeatures)

            arcpy.Project_management(inputAreaFeature,
                                     tempAreaFeatures,
                                     srSurface)
        
            #TODO: Compare extents of area and surface, if area not inside, raise Exception
        
            #Clipping surface to area
            clipSurface = arcpy.CreateUniqueName("clipSurface", scratch)
            deleteme.append(clipSurface)

            clipSurface = _clipRasterToArea(inputSurfaceRaster, tempAreaFeatures, clipSurface)
        
        #Get stats for clipped surface
        filterStatValue = None
        minStatValue, maxStatValue = _getRasterMinMax(clipSurface)
        if hi_low_Switch == "MAXIMUM":
            filterStatValue = maxStatValue
        else:
            filterStatValue = minStatValue       

        #Filter the cells from clipped raster
        arcpy.AddMessage(arcpy.GetIDMessage(200765).format(hi_low_Switch, filterStatValue)) # Finding cells with {0} value of {1}...
        expressionSetNull = r"VALUE <> {0}".format(filterStatValue)
        setNull = arcpy.CreateUniqueName("setNull", scratch)
        deleteme.append(setNull)

        resultSetNull = sa.SetNull(clipSurface, clipSurface, expressionSetNull)
        resultSetNull.save(setNull)
        
        #Converting to points
        arcpy.RasterToPoint_conversion(setNull, outputPointFeature, "VALUE")
        #Add 'Elevation' field, and remove 'Grid_code'
        addFieldName = "Elevation"
        dropFieldName = "grid_code"
        outputPointFeature = _addDoubleField(outputPointFeature, {addFieldName:[0,addFieldName]})
        expressionCalcField = r"!{0}!".format(dropFieldName)
        arcpy.CalculateField_management(outputPointFeature, addFieldName, expressionCalcField, "PYTHON_9.3")
        arcpy.DeleteField_management(outputPointFeature, [dropFieldName, "pointid"])

        return outputPointFeature
    
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def addLLOSFields(inputObserverTable,
                  inputObserverDefault,
                  inputTargetTable,
                  inputTargetDefault):
    '''
    Adds field OFFSET to both observer and target point and line features
    
    inputObserverTable - input observer features
    inputObserverDefault - the input default value to calculate for observer offset
    inputTargetTable - input target features
    inputTargetDefault - the input default value to calculate for target offset
    
    returns list with two feature classes:
    outputObserverTable - inputObserverTable with offset fields added
    outputTargetTable - inputTargetTable with offset fields added
    '''
    try:
        # Add field to Observer table

        arcpy.AddMessage(arcpy.GetIDMessage(200766)) # Adding Observer fields...
        outputObserverTable = _addDoubleField(inputObserverTable,
                                      llosFields)
        arcpy.AddMessage(arcpy.GetIDMessage(200767)) # Calculating Observer values...
        outputObserverTable = _calculateFieldValue(outputObserverTable,
                                                   "OFFSET",
                                                   float(inputObserverDefault))
        #Add field to Target table
        arcpy.AddMessage(arcpy.GetIDMessage(200768)) # Adding Target fields...
        outputTargetTable = _addDoubleField(inputTargetTable,
                                            llosFields)
        arcpy.AddMessage(arcpy.GetIDMessage(200769)) #  Calculating Target values...
        outputObserverTable = _calculateFieldValue(outputTargetTable,
                                                   "OFFSET",
                                                   float(inputTargetDefault))

        return [outputObserverTable, outputTargetTable]

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def addRLOSObserverFields(inputFeatures,
                          inputOFFSETA,
                          inputOFFSETB,
                          inputRADIUS1,
                          inputRADIUS2,
                          inputAZIMUTH1,
                          inputAZIMUTH2,
                          inputVERT1,
                          inputVERT2):
    '''
    Adds Observer fields and values to inputFeatures:
    OFFSETA: observer offset height above surface, default is 2.0
    OFFSETB: surface offset, default is 0.0
    RADIUS1: Near distance, default is 0.0
    RADIUS2: Farthest distance, default is 1000.0
    AZIMUTH1: Left Azimuth in horizontal field of view, default is 0.0
    AZIMUTH2: Right Azimuth in horizontal field of view, default is 360.0
    VERT1: Top Angle in vertical field of view, default is 90.0
    VERT2: Bottom Angle in vertical field of view, default is -90.0
    
    returns the inputFeatures
    
    '''
    try:
        if not inputOFFSETA: inputOFFSETA = 2.0
        if not inputOFFSETB: inputOFFSETB = 0.0
        if not inputRADIUS1: inputRADIUS1 = 0.0
        if not inputRADIUS2: inputRADIUS2 = 1000.0
        if not inputAZIMUTH1: inputAZIMUTH1 = 0.0
        if not inputAZIMUTH2: inputAZIMUTH2 = 360.0
        if not inputVERT1: inputVERT1 = 90.0
        if not inputVERT2: inputVERT2 = -90.0
        
        _addDoubleField(inputFeatures, rlosFields)
        
        arcpy.AddMessage(arcpy.GetIDMessage(200770)) # Updating Observer values...
        _calculateFieldValue(inputFeatures, "OFFSETA", inputOFFSETA)
        _calculateFieldValue(inputFeatures, "OFFSETB", inputOFFSETB)
        _calculateFieldValue(inputFeatures, "RADIUS1", inputRADIUS1)
        _calculateFieldValue(inputFeatures, "RADIUS2", inputRADIUS2)
        _calculateFieldValue(inputFeatures, "AZIMUTH1", inputAZIMUTH1)
        _calculateFieldValue(inputFeatures, "AZIMUTH2", inputAZIMUTH2)
        _calculateFieldValue(inputFeatures, "VERT1", inputVERT1)
        _calculateFieldValue(inputFeatures, "VERT2", inputVERT2)
        
        return inputFeatures
    
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def findLocalPeaksOrValleys(inputAreaFeature,
                   inputNumberOfPeaks,
                   inputSurfaceRaster,
                   outputPeakFeatures,
                   hi_low_Switch):
    '''
    Uses an inverted sinks method to find several local peaks on a surface
    inputAreaFeature - Input Area where to find the peaks (Optional - uses entire surface is not set)
    inputNumberOfPeaks - Number of Highest Points (peaks)  to find
    inputSurfaceRaster - Input Surface to find peaks
    outputPeakFeatures - Output Peak Points to create
    
    returns output point feature class
    '''
    global scratch
    try:
        ## Check if a valid input area is supplied
        if not inputAreaFeature:
            arcpy.AddMessage(arcpy.GetIDMessage(200763)) # No in out area - using entire surface
        else:
            if not arcpy.Exists(inputAreaFeature):
                arcpy.AddIDMessage("ERROR", 200816) # Please provide a valid input area
                return
            # Check if there are features in the input area
            if int(arcpy.GetCount_management(inputAreaFeature).getOutput(0)) == 0:
                arcpy.AddIDMessage("ERROR", 200817) # Please provide at least one input area feature
                return

        #Need Spatial Analyst to run this tool
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise Exception("Spatial Analyst license is not available.")
        from arcpy import sa
        scratch = arcpy.env.scratchGDB
        # Get SR of the surface and set as default output
        surfaceDescribe = arcpy.Describe(inputSurfaceRaster)
        srSurface = surfaceDescribe.spatialReference
        surfaceCellSize = max(surfaceDescribe.meanCellHeight, surfaceDescribe.meanCellWidth)
        arcpy.env.outputCoordinateSystem = srSurface
        arcpy.AddMessage(arcpy.GetIDMessage(200764).format(srSurface.name)) # Using {0} for analysis.
            
        if inputAreaFeature is None:
            clipSurface = inputSurfaceRaster   
        else:
            #Make a copy of the input Area in the SR of the surface
            tempAreaFeatures = arcpy.CreateUniqueName("tempAreaFeatures", scratch)
            deleteme.append(tempAreaFeatures)

            arcpy.Project_management(inputAreaFeature,
                                     tempAreaFeatures,
                                     srSurface)
        
            #TODO: Compare extents of area and surface, if area not inside, raise Exception
        
            #Clipping surface to area
            clipSurface = arcpy.CreateUniqueName("clipSurface", scratch)
            deleteme.append(clipSurface)

            clipSurface = _clipRasterToArea(inputSurfaceRaster, tempAreaFeatures, clipSurface)

        if hi_low_Switch == "MAXIMUM":
            invertValue = -1
            sqlSortValue = "DESC"
            arcpy.AddMessage(arcpy.GetIDMessage(200771)) # Inverting clipped surface...
        else:
            invertValue = 1   
            sqlSortValue = "ASC"

        minStatValue, maxStatValue = _getRasterMinMax(clipSurface)
        invertedMapAlgebra = (((arcpy.Raster(clipSurface) - minStatValue) * invertValue) + maxStatValue)

        #flow direction & sink
        arcpy.AddMessage(arcpy.GetIDMessage(200772))  # Finding sinks or inverted sinks...
        saFlowDirection = sa.FlowDirection(invertedMapAlgebra, "NORMAL")
        saSink = sa.Sink(saFlowDirection)
        invertedSinks = arcpy.CreateUniqueName("sinksOrInvertedSinks", "memory")
        deleteme.append(invertedSinks)

        saSink.save(invertedSinks)

        #need to make sure there is a VAT for GetCount
        arcpy.BuildRasterAttributeTable_management(invertedSinks, "Overwrite")

        #check the number of sink values before proceeding as no sinks will cause an error
        result = arcpy.GetCount_management(invertedSinks)
        numberSinkValues = int(result.getOutput(0))

        arcpy.AddMessage(arcpy.GetIDMessage(200773).format(numberSinkValues)) # {0} sinks found"

        if numberSinkValues == 0:
            # No sink holes found in input area raise error
            raise Exception("The input area contains no unique peaks")
        else:
            #convert the sink values to a polygon feature class,
            #This prevents adjacent cells of the same pixel value being seen as separate sink areas 
            arcpy.AddMessage(arcpy.GetIDMessage(200774)) # Converting sink values to polygon features...
            sinkPolys = arcpy.CreateUniqueName("sinkPolys", scratch)
            deleteme.append(sinkPolys)

            rasterValueField = "Value"
            conversionField = "Gridcode"
            simplifyShape = "NO_SIMPLIFY"
            arcpy.RasterToPolygon_conversion(invertedSinks,
                                             sinkPolys,
                                             simplifyShape,
                                             rasterValueField)

            #convert the polygon fc to a point fc to get central point of each feature
            pointSinks = arcpy.CreateUniqueName("pointSinks", scratch)
            deleteme.append(pointSinks)

            arcpy.FeatureToPoint_management(sinkPolys, pointSinks)

            #extract values to points
            arcpy.AddMessage(arcpy.GetIDMessage(200775).format(inputSurfaceRaster)) # Extracting elevation values from {0}...
            sinkValues = arcpy.CreateUniqueName("sinkValues", scratch)
            sa.ExtractValuesToPoints(pointSinks, inputSurfaceRaster, sinkValues, "NONE", "VALUE_ONLY")
            deleteme.append(sinkValues)

            #check the number of sink values is greater the the number of peaks inputted by the users
            if(numberSinkValues <  int(inputNumberOfPeaks)):
                arcpy.AddMessage(arcpy.GetIDMessage(200776).format(inputNumberOfPeaks, numberSinkValues)) # The input area does not contain {0} unique peaks, returning top {1} peaks...
                inputNumberOfPeaks = numberSinkValues

            #we need to store the object ids of the top (x) number of peaks
            highestPoint_IDs = []

            #File geodatabase do not allow us to use a SQL prefix of TOP so we will have to do it through a search cursor
            orderby_sql_clause = 'ORDER BY RASTERVALU ' + sqlSortValue  # ex: 'ORDER BY RASTERVALU DESC'
            with arcpy.da.SearchCursor(sinkValues, ['RASTERVALU','OID@'], \
                                       sql_clause=(None, orderby_sql_clause)) as cursor:
                counter = 1
                for row in cursor:
                    if counter <= int(inputNumberOfPeaks):
                        highestPoint_IDs.append(row[1])
                        counter = counter + 1

            arcpy.MakeFeatureLayer_management(sinkValues, "sortedPoints")
            
            #we need to define a different query if the value number of peaks to find is only 1
            if len(highestPoint_IDs) == 1:
                selectExpression = r'"OBJECTID" = {0}'.format(highestPoint_IDs[0])
            else:
                selectExpression = r'"OBJECTID" IN {0}'.format(tuple(highestPoint_IDs))

            arcpy.SelectLayerByAttribute_management("sortedPoints",
                                                    "NEW_SELECTION",
                                                    selectExpression)
            arcpy.CopyFeatures_management("sortedPoints", outputPeakFeatures)

            # select X highest values.
            valueField = "RASTERVALU"
            uniqueElevationList = _getUniqueValuesFromField(outputPeakFeatures, valueField)

            peakCount = arcpy.GetCount_management(outputPeakFeatures).getOutput(0)
            peakList = uniqueElevationList[:int(inputNumberOfPeaks)]
            arcpy.AddMessage(arcpy.GetIDMessage(200777).format(peakCount, str(peakList))) # Found {0} peaks of with elevations {1}.

            # Add 'Elevation' field
            elevField = "Elevation"
            arcpy.AddField_management(outputPeakFeatures,
                                      elevField,
                                      "DOUBLE")
            calculateFieldExpression = r"!{0}!".format(valueField)
            arcpy.CalculateField_management(outputPeakFeatures,
                                            elevField,
                                            calculateFieldExpression,
                                            "PYTHON_9.3")
            # Remove unnecessary fields
            arcpy.DeleteField_management(outputPeakFeatures, [valueField, "grid_code", "pointid"])

            return outputPeakFeatures

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def linearLineOfSight(inputObserverFeatures,
                      inputObserverHeight,
                      inputTargetFeatures,
                      inputTargetHeight,
                      inputSurface,
                      outputLineOfSight,
                      outputSightLines,
                      outputObservers,
                      outputTargets,
                      inputObstructionFeatures,
                      addProfileGraphToSurfaceLine):
    ''' Linear Line Of Sight main method '''

    global scratch

    try:

        # Check if a valid observer is supplied
        if not inputObserverFeatures:
            arcpy.AddIDMessage("ERROR", 200818)  # Please provide a valid observer
            return
        # Check if there are any features in the observer
        if int(arcpy.GetCount_management(inputObserverFeatures).getOutput(0)) == 0:
            arcpy.AddIDMessage("ERROR", 200819)  # Please provide at least one observer
            return
        # Check if a valid target is supplied
        if not inputTargetFeatures:
            arcpy.AddIDMessage("ERROR", 200820) # Please provide a valid target feature
            return
        # Check if there are any features for the target
        if int(arcpy.GetCount_management(inputTargetFeatures).getOutput(0)) == 0:
            arcpy.AddIDMessage("ERROR", 200821) # Please provide at least one target feature
            return

        #Need Spatial Analyst to run this tool
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise Exception("Spatial Analyst license is not available.")
        from arcpy import sa
        if arcpy.CheckExtension("3D") == "Available":
            arcpy.CheckOutExtension("3D")
        else:
            raise Exception("3D Analyst license is not available.")

        scratch = arcpy.env.scratchGDB

        #########
        # Special handling of Feature/Image Services - basically just copy to local datasets
        descObs = arcpy.Describe(inputObserverFeatures)
        if descObs.catalogPath.lower().startswith('http'): 
            obsTemp = arcpy.CreateUniqueName("observers", scratch)
            arcpy.management.CopyFeatures(inputObserverFeatures, obsTemp)
            deleteme.append(obsTemp)
            inputObserverFeatures = obsTemp

        descTargs = arcpy.Describe(inputTargetFeatures)
        if descTargs.catalogPath.lower().startswith('http'): 
            targsTemp = arcpy.CreateUniqueName("targets", scratch)
            arcpy.management.CopyFeatures(inputTargetFeatures, targsTemp)
            deleteme.append(obsTemp)
            inputTargetFeatures = targsTemp

        descSurface = arcpy.Describe(inputSurface)
        imageServiceUrl = None
        if descSurface.catalogPath.lower().startswith('http'): 
            imageServiceUrl = descSurface.catalogPath
        else:
            # WORKAROUND: AddSurfaceInformation_3d is failing for this case (map layer with Image Service)
            # so we need to convert to different type that works (ImageServiceLayer)
            if hasattr(descSurface, "format") and descSurface.format == 'Image Service':
                layerName = descSurface.name
                try :
                    currentMap = arcpy.mp.ArcGISProject("CURRENT").listMaps()[0]
                    for layer in currentMap.listLayers():
                        if layer.name == layerName:
                            if layer.dataSource.lower().startswith('http'): 
                                imageServiceUrl = layer.dataSource
                                break
                except :
                    pass

        # if Image Service found create an ImageServiceLayer from this
        if imageServiceUrl:
            try :
                observerExtent = getUnionOfFCExtents([inputObserverFeatures, inputTargetFeatures])
                inputSurface = makeImageServiceLayer(imageServiceUrl, 'tempLLOSSurface', observerExtent)
                if not inputSurface:
                    arcpy.AddIDMessage("ERROR", 10587) # There was a problem reading the raster from the image server.
            except :
                arcpy.AddIDMessage("ERROR", 10587) # There was a problem reading the raster from the image server.
                return # can't continue 
        else:
            inputSurface = descSurface.catalogPath # Workaround to _3d gp tools not working with layer string names (TODO: investigate)
        #########

        # Check that all observer and target points are within the surface extent
        arcpy.AddMessage(arcpy.GetIDMessage(200778)) # Checking that observer points fall within the extent of the input surface.
        observersWithInSurface = surfaceContainsPoints(inputObserverFeatures, inputSurface)
        if not observersWithInSurface:
            errorMsg = arcpy.AddIDMessage('ERROR', 200822) # Not all input observer points fall within the extent of the input surface.
            raise Exception(errorMsg)

        arcpy.AddMessage(arcpy.GetIDMessage(200779)) # Checking that target points fall within the extent of the input surface.
        targetsWithInSurface = surfaceContainsPoints(inputTargetFeatures, inputSurface)
        if not targetsWithInSurface:
            errorMsg = arcpy.AddIDMessage('ERROR', 200823) # Not all input observer points fall within the extent of the input surface.
            raise Exception(errorMsg)

        #get spatial reference of surface
        srSurface = arcpy.Describe(inputSurface).spatialReference
        offsetFieldName = "OFFSET"
        #Check if Observers have "OFFSET" field
        hasObsOffset, hasTgtOffset = True, True
        inputObsFields = _getFieldNameList(inputObserverFeatures, [])
        if not offsetFieldName in inputObsFields:
            arcpy.AddMessage(arcpy.GetIDMessage(200780).format(inputObserverHeight)) # OFFSET field not in Observers. Using Observer Height Above Surface value of {0}.
            hasObsOffset = False
        #Check if Targets have "OFFSET" field
        inputTgtFields = _getFieldNameList(inputTargetFeatures, [])
        if not offsetFieldName in inputTgtFields:
            arcpy.AddMessage(arcpy.GetIDMessage(200781).format(inputTargetHeight)) # OFFSET field not in Targets. Using Target Height Above Surface value of {0}
            hasTgtOffset = False
        
        #Project Observers and add fields if needed
        arcpy.AddMessage(arcpy.GetIDMessage(200782).format(srSurface.name)) # Projecting Observers and Targets to Input Surface spatial reference {0}
        prjObservers = arcpy.CreateUniqueName("prjObservers", scratch)
        deleteme.append(prjObservers)

        arcpy.Project_management(inputObserverFeatures,
                                 prjObservers,
                                 srSurface)
        if not hasObsOffset:
            prjObservers = _addDoubleField(prjObservers,
                                           {offsetFieldName:[inputObserverHeight, "Offset above surface"]})
            prjObservers = _calculateFieldValue(prjObservers,
                                                offsetFieldName,
                                                inputObserverHeight)
        #Project targets and add fields
        prjTargets = arcpy.CreateUniqueName("prjTargets", scratch)
        deleteme.append(prjTargets)

        arcpy.Project_management(inputTargetFeatures,
                                 prjTargets,
                                 srSurface)
        if not hasTgtOffset:
            prjTargets = _addDoubleField(prjTargets,
                                         {offsetFieldName:[inputTargetHeight, "Offset above surface"]})
            prjTargets = _calculateFieldValue(prjTargets,
                                              offsetFieldName,
                                              inputTargetHeight)

        #Get elevation of Observers and Targets over surface
        obsSpotFieldName = "ObsSPOT"
        dddObservers = arcpy.CreateUniqueName("dddObservers", scratch)
        deleteme.append(dddObservers)

        arcpy.AddMessage(arcpy.GetIDMessage(200783)) # Building 3D observer points...
        dddObservers = _prepPointFromSurface(prjObservers,
                                             inputSurface,
                                             dddObservers,
                                             offsetFieldName,
                                             obsSpotFieldName)

        if not dddObservers :
            arcpy.AddError(arcpy.GetIDMessage(200755).format(str(prjObservers) + '  :  ' + str(inputSurface)))
            return # can't continue without surface info

        tgtSpotFieldName = "TgtSPOT"
        dddTargets = arcpy.CreateUniqueName("dddTargets", scratch)
        deleteme.append(dddTargets)   

        arcpy.AddMessage(arcpy.GetIDMessage(200784)) # Building 3D target points...
        dddTargets = _prepPointFromSurface(prjTargets,
                                           inputSurface,
                                           dddTargets,
                                           offsetFieldName,
                                           tgtSpotFieldName)
        
        if not dddTargets :
            arcpy.AddError(arcpy.GetIDMessage(200755).format(str(prjTargets) + '  :  ' + str(inputSurface)))
            return # can't continue without surface info

        #Construct Sight Lines
        arcpy.AddMessage(arcpy.GetIDMessage(200785)) # Constructing Sight Lines between observers and targets...
        dddSightLines = arcpy.CreateUniqueName("dddSightLines", scratch)
        deleteme.append(dddSightLines)

        arcpy.ConstructSightLines_3d(dddObservers,
                                     dddTargets,
                                     dddSightLines,
                                     obsSpotFieldName,
                                     tgtSpotFieldName,
                                     None,
                                     None,
                                     "OUTPUT_THE_DIRECTION")

        #TODO: use Intervisibility_3d to determine obstructions from other data types?

        #Build MBR, set as mask
        arcpy.AddMessage(arcpy.GetIDMessage(200811)) # Building minimum bounding rectangle of sight lines for analysis mask...
        mbrSightLines = arcpy.CreateUniqueName("mbrSightLines", scratch)
        deleteme.append(mbrSightLines)

        arcpy.MinimumBoundingGeometry_management(dddSightLines,
                                                 mbrSightLines,
                                                 "RECTANGLE_BY_WIDTH")


        #Line Of Sight
        arcpy.AddMessage(arcpy.GetIDMessage(200786)) # Building Line Of Sight...

        # ? arcpy.env.mask = mbrSightLines ?

        llosObstructionPoints = arcpy.CreateUniqueName("llosObstructionPoints", scratch)
        deleteme.append(llosObstructionPoints)

        arcpy.LineOfSight_3d(inputSurface,
                             dddSightLines,
                             outputLineOfSight,
                             llosObstructionPoints,
                             "#",
                             "#",
                             None,
                             None,
                             inputObstructionFeatures)


        arcpy.AddMessage(arcpy.GetIDMessage(200787)) # Joining attribute results...
        #join sightline attributes to surfaceline
        arcpy.JoinField_management(outputLineOfSight,
                                    "SourceOID",
                                    dddSightLines,
                                    "OID",
                                    ["OID_OBSERV",
                                     "OID_TARGET",
                                     "DIST_ALONG",
                                     "AZIMUTH"])
        #join surfaceline attributes to sightline
        arcpy.JoinField_management(dddSightLines,
                                    "OID",
                                    outputLineOfSight,
                                    "SourceOID",
                                    ["TarIsVis",
                                     "OID_OBSERV",
                                     "OID_TARGET"])
        #join observer spot field to surface line
        arcpy.JoinField_management(outputLineOfSight,
                                   "OID_OBSERV",
                                   dddObservers,
                                   arcpy.Describe(dddObservers).oidFieldName,
                                   ["ObsSPOT"])
        #join target spot field to surface line
        arcpy.JoinField_management(outputLineOfSight,
                                   "OID_TARGET",
                                   dddTargets,
                                   arcpy.Describe(dddTargets).oidFieldName,
                                   ["TgtSPOT"])

        #Get target visibility for each target, add to Observers and Targets and Sight Lines
        arcpy.AddMessage(arcpy.GetIDMessage(200788)) # Attributing output Observer features...
        llosStartVertex = arcpy.CreateUniqueName("llosStartVertex", scratch)
        deleteme.append(llosStartVertex)

        arcpy.FeatureVerticesToPoints_management(dddSightLines,
                                                 llosStartVertex,
                                                 "START")
        arcpy.Identity_analysis(llosStartVertex,
                                dddObservers,
                                outputObservers,
                                "ALL")

        #Get target visibility count stats on targets
        arcpy.AddMessage(arcpy.GetIDMessage(200789)) # Calculating frequency on Target features...
        llosEndVertex = arcpy.CreateUniqueName("llosEndVertex", scratch)
        deleteme.append(llosEndVertex)

        arcpy.FeatureVerticesToPoints_management(dddSightLines,
                                                 llosEndVertex,
                                                 "END")
        arcpy.Identity_analysis(llosEndVertex,
                                dddTargets,
                                outputTargets,
                                "ALL")
        arcpy.MakeFeatureLayer_management(outputTargets, "targetLayer")
        arcpy.SelectLayerByAttribute_management("targetLayer",
                                                "NEW_SELECTION",
                                                '''"TarIsVis" = 1''')
        targetStats = arcpy.CreateUniqueName("targetStats", scratch)
        deleteme.append(targetStats)

        statsFields = [["TarIsVis",  "COUNT"]]
        caseField = "OID_TARGET"
        arcpy.Statistics_analysis("targetLayer",
                                targetStats,
                                statsFields,
                                caseField)
        arcpy.JoinField_management(outputTargets,
                        caseField,
                        targetStats,
                        caseField,
                        ["FREQUENCY", "COUNT_TarIsVis"])

        #copy outputs
        arcpy.CopyFeatures_management(dddSightLines,
                                      outputSightLines)

        # Build profile graphs for each Line Of Sight
        if addProfileGraphToSurfaceLine:
            
            arcpy.AddMessage(arcpy.GetIDMessage(200790)) # Building profile graph...
            makeProfileGraph(outputLineOfSight)

        #drop fields
        #arcpy.DeleteField_management(outputLineOfSight, [])
        arcpy.DeleteField_management(outputSightLines, ["OID_OBSERV_1",
                                                        "OID_TARGET_1"])
        arcpy.DeleteField_management(outputObservers, ["Height",
                                                       "FID_llosStartVertex",
                                                       "OID_OBSERV_1",
                                                       "OID_TARGET_1",
                                                       "ORIG_FID",
                                                       "FID_dddObservers"])
        arcpy.DeleteField_management(outputTargets, ["Height",
                                                     "ORIG_FID",
                                                     "OID_OBSERV_1",
                                                     "OID_TARGET_1",
                                                     "FID_llosEndVertex",
                                                     "FID_dddTargets"])

        return [outputLineOfSight,
                outputSightLines,
                outputObservers,
                outputTargets]

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)
            
def radialLineOfSight(inputObserverFeatures,
                      inputObserverHeight,
                      inputRadiusOfObserver,
                      inputSurface,
                      outputVisibility,
                      inputSpatialReference):
    '''
    Builds a viewshed from one or more observer point features and an input surface.
    
    inputObserverFeatures - one or more observer features
    inputObserverHeight - If OFFSETA is not present in inputObserverFeatures use this value
    inputRadiusOfObserver - If RADIUS2 is not present in inputObserverFeatures use this value
    inputSurface - Surface to consider for visibility analysis
    outputVisibility - polygon features showing areas visible and not-visible to observers
    inputSpatial Reference - spatial reference of outputVisibility features
    '''
    global scratch
    
    try:
        #Need Spatial Analyst to run this tool
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise Exception("Spatial Analyst license is not available.")
        from arcpy import sa

        # Set scratch as temp workspace
        scratch = arcpy.env.scratchGDB

        #########
        # Special handling of Feature/Image Services - basically just copy to local datasets
        descObs = arcpy.Describe(inputObserverFeatures)
        if descObs.catalogPath.lower().startswith('http'): 
            obsTemp = arcpy.CreateUniqueName("observers", scratch)
            arcpy.management.CopyFeatures(inputObserverFeatures, obsTemp)
            deleteme.append(obsTemp)
            inputObserverFeatures = obsTemp

        descSurface = arcpy.Describe(inputSurface)
        if descSurface.catalogPath.lower().startswith('http'): 
            observerExtent = getUnionOfFCExtents([inputObserverFeatures])
            inputSurface = makeImageServiceLayer(descSurface.catalogPath, 'tempRLOSSurface', observerExtent)
            if not inputSurface:
                arcpy.AddIDMessage("ERROR", 10587) # There was a problem reading the raster from the image server.
        #########

        # get original spatial reference of inputs
        srObservers = arcpy.Describe(inputObserverFeatures).spatialReference
        srSurface = arcpy.Describe(inputSurface).spatialReference
        
        #Check observer fields for RADIUS2 and OFFSETA
        hasRADIUS2 = True
        hasOFFSETA = True
        observerFieldList = _getFieldNameList(inputObserverFeatures, [])
        if not "RADIUS2" in observerFieldList:
            arcpy.AddMessage(arcpy.GetIDMessage(200791).format(inputRadiusOfObserver)) # RADIUS2 field not in Input Observer Features. Using Radius Of Observer {0}
            hasRADIUS2 = False
        else:
            inputRadiusOfObserver = _getUniqueValuesFromField(inputObserverFeatures,
                                                              "RADIUS2")[:1][0]
            arcpy.AddMessage(arcpy.GetIDMessage(200792).format(inputRadiusOfObserver))  # RADIUS2 field in Input Observer Features. Using maximum radius of {0}
        if not "OFFSETA" in observerFieldList:
            arcpy.AddMessage(arcpy.GetIDMessage(200793).format(inputObserverHeight)) # OFFSETA field not in Input Observer Features. Using Observer Height Above Surface {0}
            hasOFFSETA = False
        
        # Check that all observer points are within the surface extent
        arcpy.AddMessage(arcpy.GetIDMessage(200794)) # Checking that observer points fall within the extent of the input surface.
        observersWithInSurface = surfaceContainsPoints(inputObserverFeatures, inputSurface)
        if not observersWithInSurface:
            errorMsg = arcpy.AddIDMessage('ERROR', 200822) # Not all input observer points fall within the extent of the input surface.
            raise Exception(errorMsg)

        #get number of observers:
        numberOfObservers = int(arcpy.GetCount_management(inputObserverFeatures).getOutput(0))
        
        #get centroid of observers in Lat/Lon
        arcpy.AddMessage(arcpy.GetIDMessage(200795)) # Getting centroid of input observer points...
        centroidPoint = _getCentroid(inputObserverFeatures)
        ddCentroidPoint = centroidPoint.projectAs(srWGS84)
        
        #make localized WAZED
        arcpy.AddMessage(arcpy.GetIDMessage(200796))
        srLocalWAZED = _getLocalWAZED(ddCentroidPoint)
        arcpy.env.outputCoordinateSystem = srLocalWAZED
        
        #project Observers to temp dataset in local WAZED
        tempObservers = arcpy.CreateUniqueName("tempObservers", scratch)
        deleteme.append(tempObservers)

        arcpy.Project_management(inputObserverFeatures, tempObservers, srLocalWAZED)
        
        #If not hasRADIUS2: add RADIUS2
        if not hasRADIUS2:
            tempObservers = _addDoubleField(tempObservers, {"RADIUS2":[inputRadiusOfObserver, "RADIUS2"]})
            tempObservers = _calculateFieldValue(tempObservers, "RADIUS2", inputRadiusOfObserver)
        #If not hasOFFSETA: add OFFSETA
        if not hasOFFSETA:
            tempObservers = _addDoubleField(tempObservers, {"OFFSETA":[inputObserverHeight, "OFFSETA"]})
            tempObservers = _calculateFieldValue(tempObservers, "OFFSETA", inputObserverHeight)
                
        #Buffer observers
        bufferObservers = arcpy.CreateUniqueName("bufferObservers", scratch)
        deleteme.append(bufferObservers)

        distanceUnits = "METERS"
        bufferDistance = "{0} {1}".format(inputRadiusOfObserver, distanceUnits)
        arcpy.AddMessage(arcpy.GetIDMessage(200797).format(bufferDistance)) # Buffering observers to {0}
        arcpy.Buffer_analysis(tempObservers,
                              bufferObservers,
                              bufferDistance,
                              "#",
                              "#",
                              "None",
                              None,
                              "GEODESIC")

        arcpy.AddMessage(arcpy.GetIDMessage(200798)) # Projecting observers to match surface..."
        observersSurfaceSR = arcpy.CreateUniqueName("observersSurfaceSR", scratch)
        deleteme.append(observersSurfaceSR)

        arcpy.Project_management(tempObservers,
                                 observersSurfaceSR,
                                 srSurface,
                                 None,
                                 srLocalWAZED,
                                 "PRESERVE_SHAPE")
        arcpy.AddMessage(arcpy.GetIDMessage(200799)) # Projecting buffer to match surface...
        bufferSurfaceSR = arcpy.CreateUniqueName("bufferSurfaceSR", scratch)
        deleteme.append(bufferSurfaceSR)

        arcpy.Project_management(bufferObservers,
                                 bufferSurfaceSR,
                                 srSurface,
                                 None,
                                 srLocalWAZED,
                                 "PRESERVE_SHAPE")
        
        arcpy.AddMessage(arcpy.GetIDMessage(200800)) # Clipping image to observer buffers...
        
        clipSurface = arcpy.CreateUniqueName("clipSurface", scratch)
        deleteme.append(clipSurface)

        clipSurface = _clipRasterToArea(inputSurface, bufferSurfaceSR, clipSurface)        

        arcpy.AddMessage(arcpy.GetIDMessage(200801)) # Building viewshed of observers to surface...
        tempViewshed = arcpy.CreateUniqueName("tempViewshed", scratch)
        deleteme.append(tempViewshed)
        tempAGL = arcpy.CreateUniqueName("tempAGL", scratch)
        deleteme.append(tempAGL)

        saViewshed = sa.Viewshed(clipSurface,
                                 observersSurfaceSR,
                                 1.0,
                                 "CURVED_EARTH",
                                 0.13,
                                 tempAGL)
        saViewshed.save(tempViewshed)

        arcpy.AddMessage(arcpy.GetIDMessage(200802)) # Converting viewshed to polygon features...
        viewshedPolys = arcpy.CreateUniqueName("viewshedPolys", scratch)
        deleteme.append(viewshedPolys)

        rasterValueField = "Value"
        conversionField = "Gridcode"
        simplifyShape = "SIMPLIFY"
        arcpy.RasterToPolygon_conversion(tempViewshed,
                                         viewshedPolys,
                                         simplifyShape,
                                         rasterValueField)

        arcpy.AddMessage(arcpy.GetIDMessage(200803)) # Clipping polygons to max buffer...
        clippedPolys = arcpy.CreateUniqueName("clippedPolys", scratch)
        deleteme.append(clippedPolys)

        arcpy.Intersect_analysis([viewshedPolys, bufferSurfaceSR], clippedPolys, "NO_FID")

        arcpy.AddMessage(arcpy.GetIDMessage(200804)) # Projecting to output spatial reference...
        arcpy.Project_management(clippedPolys, outputVisibility, inputSpatialReference)
        arcpy.AddField_management(outputVisibility,
                                  "VISIBILITY",
                                  "LONG")
        arcpy.CalculateField_management(outputVisibility,
                                        "VISIBILITY",
                                        '!{0}!'.format(conversionField),
                                        "PYTHON_9.3")
        dropFields = [conversionField, 'Id']
        arcpy.DeleteField_management(outputVisibility, dropFields)

        return outputVisibility
    
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def createSectorPolygon(cx, cy, r1, r2, startBearing, endBearing):
    ''' Create a range fan/sector polygon from parameters '''

    # Convert to radians and from north bearing to XY angle 
    start = math.radians(90.0 - startBearing)
    # Adjust end if it crosses 360
    if startBearing > endBearing:
        endBearing = endBearing + 360.0
    end = math.radians(90.0 - endBearing)

    point = arcpy.Point()
    array = arcpy.Array()

    # Calculate the end x,y for the wedge
    x_end = cx + r2*math.cos(start)
    y_end = cy + r2*math.sin(start)

    # Use intervalInDegrees as the angle step value for each circle point
    intervalInDegrees = 5
    intervalInRadians = math.radians(intervalInDegrees)

    # Calculate the outer edge of the wedge
    a = start

    # If r1 == 0 then create a wedge from the center point
    if r1 == 0:
        #Add the start point to the array
        point.X = cx
        point.Y = cy
        array.add(point)
        #Calculate the rest of the wedge
        while a >= end:
            point.X = cx + r2*math.cos(a)
            point.Y = cy + r2*math.sin(a)
            array.add(point)
            a -= intervalInRadians

        if a != end :
            point.X = cx + r2*math.cos(end)
            point.Y = cy + r2*math.sin(end)
            array.add(point)

        #Close the polygon
        point.X = cx
        point.Y = cy
        array.add(point)
    else:
        # Calculate the outer edge of the wedge (clockwise)
        while a >= end:
            point.X = cx + r2*math.cos(a)
            point.Y = cy + r2*math.sin(a)
            a -= intervalInRadians
            array.add(point)

        if a != end :
            point.X = cx + r2*math.cos(end)
            point.Y = cy + r2*math.sin(end)
            array.add(point)
            a = end

        # Calculate the inner edge of the wedge (counter-clockwise)
        while a <= start:
            point.X = cx + r1*math.cos(a)
            point.Y = cy + r1*math.sin(a)
            a += intervalInRadians
            array.add(point)

        if a != start :
            point.X = cx + r1*math.cos(start)
            point.Y = cy + r1*math.sin(start)
            array.add(point)

        # Close the polygon by adding the end point
        point.X = x_end
        point.Y = y_end
        array.add(point)

    #Create the polygon from the points
    polygon = arcpy.Polygon(array)

    return polygon

def addViewshedFields(observerPointsFC, innerRadiusInput, outerRadiusInput, \
    leftAzimuthInput, rightAzimuthInput, observerOffsetInput, targetOffsetInput):
    ''' Add Viewshed Fields to dataset ''' 

    desc = arcpy.Describe(observerPointsFC)
    fieldNames = [x.name for x in desc.Fields]

    # arcpy.AddMessage('Current Fields: ' + str(fieldNames))
    
    if "RADIUS1" not in fieldNames : 
        arcpy.AddField_management(observerPointsFC, "RADIUS1", "SHORT")
    arcpy.CalculateField_management(observerPointsFC, "RADIUS1", innerRadiusInput, "PYTHON_9.3", "")

    if "RADIUS2" not in fieldNames : 
        arcpy.AddField_management(observerPointsFC, "RADIUS2", "SHORT")
    arcpy.CalculateField_management(observerPointsFC, "RADIUS2", outerRadiusInput, "PYTHON_9.3", "")

    if "AZIMUTH1" not in fieldNames : 
        arcpy.AddField_management(observerPointsFC, "AZIMUTH1", "SHORT")
    arcpy.CalculateField_management(observerPointsFC, "AZIMUTH1", leftAzimuthInput, "PYTHON_9.3", "")

    if "AZIMUTH2" not in fieldNames : 
        arcpy.AddField_management(observerPointsFC, "AZIMUTH2", "SHORT")
    arcpy.CalculateField_management(observerPointsFC, "AZIMUTH2", rightAzimuthInput, "PYTHON_9.3", "")

    if "OFFSETA" not in fieldNames : 
        arcpy.AddField_management(observerPointsFC, "OFFSETA", "SHORT")
    arcpy.CalculateField_management(observerPointsFC, "OFFSETA", observerOffsetInput, "PYTHON_9.3", "")

    if "OFFSETB" not in fieldNames : 
        arcpy.AddField_management(observerPointsFC, "OFFSETB", "SHORT")
    arcpy.CalculateField_management(observerPointsFC, "OFFSETB", targetOffsetInput, "PYTHON_9.3", "")

def createViewshed(inputObserverPoints, elevationRaster, outerRadiusInput, \
    leftAzimuthInput, rightAzimuthInput, observerOffsetInput, \
    innerRadiusInput, viewshed, sectorWedge, fullWedge):
    ''' Create Viewshed main method '''

    try:

        tempWorkspace = 'memory'

        # Error Checking:
        if arcpy.CheckExtension("3D") != "Available":
            arcpy.AddIDMessage('ERROR', 200824)  #3D license is not available.
            return

        if not arcpy.Exists(inputObserverPoints) :
            arcpy.AddIDMessage("ERROR", 200825, str(inputObserverPoints))  # Dataset does not exist: '
            return

        if not arcpy.Exists(elevationRaster) :
            arcpy.AddIDMessage("ERROR", 200825, str(elevationRaster)) # Dataset does not exist: '
            return

        inputPointsCount = int(arcpy.GetCount_management(inputObserverPoints).getOutput(0))
        if inputPointsCount == 0 :
            arcpy.AddIDMessage("ERROR", 200827, str(inputObserverPoints)) # No features in input feature set
            return

        elevDesc = arcpy.Describe(elevationRaster)
        elevationSR = elevDesc.spatialReference

        if not elevationSR.type == "Projected":
            arcpy.AddIDMessage("ERROR", 200828, elevationSR.name) #  Input elevation raster must be in a projected coordinate system. Existing elevation raster is in {0}
            return

        # Done error checking, do processing:
        arcpy.env.outputCoordinateSystem = elevationSR

        donutWedges = []
        pieWedges = []

        tempObserverPoints = arcpy.CreateUniqueName("tempPoints", tempWorkspace) 
        deleteme.append(tempObserverPoints)

        arcpy.Project_management(inputObserverPoints, tempObserverPoints, elevationSR)

        # Check if points falls within surface extent
        isWithin = surfaceContainsPoints(tempObserverPoints, elevationRaster)
        if not isWithin:
            arcpy.AddIDMessage("ERROR", 200829, str(os.path.basename(elevationRaster))) # Input Observer(s) does not fall within the extent of the input surface: {0}
            return

        addViewshedFields(tempObserverPoints, innerRadiusInput, outerRadiusInput, \
            leftAzimuthInput, rightAzimuthInput, observerOffsetInput, \
            0) # Set Target Height to 0

        outerBuffer = arcpy.CreateUniqueName("OuterBuffer", tempWorkspace)
        deleteme.append(outerBuffer)

        arcpy.AddMessage(arcpy.GetIDMessage(200805)) # Buffering observers...
        arcpy.Buffer_analysis(tempObserverPoints, \
            outerBuffer, "RADIUS2", "#", "#", "NONE", None, "GEODESIC")

        desc = arcpy.Describe(outerBuffer)
        xMin = desc.Extent.XMin
        yMin = desc.Extent.YMin
        xMax = desc.Extent.XMax
        yMax = desc.Extent.YMax
        Extent = str(xMin) + " " + str(yMin) + " " + str(xMax) + " " + str(yMax)

        arcpy.env.extent = desc.Extent

        # Set Raster Output Mask (to improve performance)
        arcpy.env.mask = outerBuffer

        arcpy.AddMessage(arcpy.GetIDMessage(200806)) # Clipping image to observer buffer...

        clip = arcpy.CreateUniqueName("clip", tempWorkspace)
        deleteme.append(clip)

        intervis = arcpy.CreateUniqueName("intervis", tempWorkspace)
        deleteme.append(intervis)

        unclipped = arcpy.CreateUniqueName("unclipped", tempWorkspace)
        deleteme.append(unclipped)

        arcpy.Clip_management(elevationRaster, Extent, clip)

        arcpy.AddMessage(arcpy.GetIDMessage(200808)) # Calculating viewshed...
        arcpy.Viewshed_3d(clip, tempObserverPoints, intervis, "1", "FLAT_EARTH", "0.13")

        if not arcpy.Exists(intervis):
            # if Viewshed_3d fails this won't exist so stop here
            raise Exception(arcpy.GetIDMessage(952) % "Viewshed_3d")

        arcpy.AddMessage(arcpy.GetIDMessage(200807))
        arcpy.RasterToPolygon_conversion(in_raster=intervis, out_polygon_features=unclipped,
                                         simplify="NO_SIMPLIFY")

        fields = ["SHAPE@XY", "RADIUS1", "RADIUS2", "AZIMUTH1", "AZIMUTH2"]

        ## get the attributes from the input point
        with arcpy.da.SearchCursor(tempObserverPoints,fields) as cursor:
            for row in cursor:
                centerX      = row[0][0]
                centerY      = row[0][1]
                radiusInner  = row[1]
                radiusOuter  = row[2]
                startBearing = row[3]
                endBearing   = row[4]

                # IMPORTANT: radius must be in map units
                donutWedge = createSectorPolygon(centerX, centerY, radiusInner, radiusOuter, startBearing, endBearing)
                donutWedges.append(donutWedge)

                pieWedge = createSectorPolygon(centerX, centerY, 0, radiusOuter, startBearing, endBearing)
                pieWedges.append(pieWedge)

        arcpy.CopyFeatures_management(donutWedges, sectorWedge)
        arcpy.CopyFeatures_management(pieWedges, fullWedge)

        arcpy.AddMessage(arcpy.GetIDMessage(200809))

        dissolve = arcpy.CreateUniqueName("dissolve", tempWorkspace)
        deleteme.append(dissolve)

        arcpy.Clip_analysis(unclipped, sectorWedge, dissolve)
        arcpy.Dissolve_management(dissolve, viewshed, "gridcode", "", "MULTI_PART", "DISSOLVE_LINES")

        # Output Symbol layer requires the field to be "VISIBILITY"
        arcpy.AddField_management(viewshed, "VISIBILITY", "LONG")
        arcpy.CalculateField_management(viewshed, "VISIBILITY", '!gridcode!', "PYTHON_9.3")

        return

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def createRangeFan(inputObserverPoints, rangeFanOutput, 
                    innerRadiusInput, outerRadiusInput, leftAzimuthInput, rightAzimuthInput):
    ''' Create Range Fan geometries and add to dataset '''

    try:

        if not arcpy.Exists(inputObserverPoints):
            arcpy.AddIDMessage("ERROR", 200830, str(inputObserverPoints)) # Dataset does not exist:
            return

        inputPointsCount = int(arcpy.GetCount_management(inputObserverPoints).getOutput(0))
        if inputPointsCount == 0 :
            arcpy.AddIDMessage("ERROR", 200827, str(inputObserverPoints)) # No features in input feature set
            return

        orig_out_sr = arcpy.env.outputCoordinateSystem

        centroidPoint = _getCentroid(inputObserverPoints)

        outputSR = _getLocalWAZED(centroidPoint)

        tempObserverPoints = arcpy.CreateUniqueName('tempPoints', 'memory')
        deleteme.append(tempObserverPoints)

        arcpy.Project_management(inputObserverPoints, tempObserverPoints, outputSR)

        rangeSectorPolygons = []
        arcpy.env.outputCoordinateSystem = outputSR

        nullValuesSkipped = False

        fields = ["SHAPE@XY"]
        ## get the attributes from the input point
        with arcpy.da.SearchCursor(tempObserverPoints, fields) as cursor:
            for row in cursor:

                if row[0] is None:
                    nullValuesSkipped = True
                    continue

                centerX      = row[0][0]
                centerY      = row[0][1]

                if centerX is None or centerY is None:
                    nullValuesSkipped = True
                    continue

                # Important: createSectorPolygon assumes meters and degrees
                rangeSectorPolygon = createSectorPolygon(centerX, centerY, innerRadiusInput, outerRadiusInput, leftAzimuthInput, rightAzimuthInput)
                rangeSectorPolygons.append(rangeSectorPolygon)

        if nullValuesSkipped :
            arcpy.AddIDMessage("WARNING", 3108) # Null fields skipped

        arcpy.CopyFeatures_management(rangeSectorPolygons, rangeFanOutput)

        arcpy.env.outputCoordinateSystem = orig_out_sr

        return rangeFanOutput

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)

def createRangeFansFromFeatures(
        inputFeatures, rangeFanOutput, 
        innerRadiusField, outerRadiusField, 
        leftAzimuthField, rightAzimuthField,
        distanceUnit, angleUnit):
    ''' Lookup values in feature class attributes and use to create range fan geometries'''

    try:

        if not arcpy.Exists(inputFeatures):
            arcpy.AddIDMessage("ERROR", 200830, str(inputFeatures)) # Dataset does not exist:
            return

        inputPointsCount = int(arcpy.GetCount_management(inputFeatures).getOutput(0))
        if inputPointsCount == 0 :
            arcpy.AddIDMessage("ERROR", 200827, str(inputFeatures)) # No features in input feature set
            return

        # Check input fields exist 
        inFields = [field.name for field in arcpy.ListFields(inputFeatures)]
        if not ((innerRadiusField in inFields) and (outerRadiusField in inFields) 
            and (leftAzimuthField in inFields) and (rightAzimuthField in inFields)):
            arcpy.AddIDMessage("ERROR", 11) # Required fields missing
            return

        orig_out_sr = arcpy.env.outputCoordinateSystem

        centroidPoint = _getCentroid(inputFeatures)

        outputSR = _getLocalWAZED(centroidPoint)

        tempPoints = arcpy.CreateUniqueName('tempPoints', 'memory')
        deleteme.append(tempPoints)

        arcpy.Project_management(inputFeatures, tempPoints, outputSR)

        rangeSectorPolygons = []
        arcpy.env.outputCoordinateSystem = outputSR

        nullValuesSkipped = False

        fields = ["SHAPE@XY", innerRadiusField, outerRadiusField, leftAzimuthField, rightAzimuthField]
        ## get the attributes from the input point
        with arcpy.da.SearchCursor(tempPoints, fields) as cursor:
            for row in cursor:

                if row[0] is None:
                    nullValuesSkipped = True
                    continue

                centerX      = row[0][0]
                centerY      = row[0][1]

                innerRadius  = row[1]
                outerRadius  = row[2]
                leftAzimuth  = row[3]
                rightAzimuth = row[4]

                if centerX is None or centerY is None or innerRadius is None or \
                    outerRadius is None or leftAzimuth is None or rightAzimuth is None:
                    nullValuesSkipped = True
                    continue

                if (innerRadius < 0) or (outerRadius < 0) or (leftAzimuth < 0) or (leftAzimuth < 0) :
                    arcpy.AddWarning(arcpy.GetIDMessage(963) + 
                                 ', ' + str(innerRadius) + ', ' + str(outerRadius) +
                                 ', ' + str(leftAzimuth) + ', ' + str(rightAzimuth))
                    continue

                innerRadiusMeters   = defenseHelper.convertFromUnitNameToMeters(innerRadius, distanceUnit) 
                outerRadiusMeters   = defenseHelper.convertFromUnitNameToMeters(outerRadius, distanceUnit) 
                leftAzimuthDegrees  = defenseHelper.convertFromUnitNameToDegrees(leftAzimuth, angleUnit)
                rightAzimuthDegrees = defenseHelper.convertFromUnitNameToDegrees(rightAzimuth, angleUnit)

                # Important: createSectorPolygon assumes meters and degrees
                rangeSectorPolygon = createSectorPolygon(centerX, centerY, 
                        innerRadiusMeters, outerRadiusMeters, leftAzimuthDegrees, rightAzimuthDegrees)
                rangeSectorPolygons.append(rangeSectorPolygon)

        if nullValuesSkipped :
            arcpy.AddIDMessage("WARNING", 3108) # Null fields skipped

        arcpy.CopyFeatures_management(rangeSectorPolygons, rangeFanOutput)

        arcpy.env.outputCoordinateSystem = orig_out_sr

        return rangeFanOutput

    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
    finally:
        defenseHelper.removeDatasetList(deleteme)
