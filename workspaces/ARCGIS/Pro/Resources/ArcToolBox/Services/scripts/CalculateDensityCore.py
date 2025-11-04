from __future__ import unicode_literals
import arcpy
import os
import aolutils
import analysisutils
import classifyUtils
import time
import conversionUtils

errorMsgs = {
    100107:u"Field {} does not have any positive values.", 
    100108:u"Field {} has negative values. Only positive values will be considered for calculating density."
}


def calculateDensity(startTime,
                     inFeatures,
                     outFeatures,
                     field,
                     cellsize,
                     cellsizeUnits,
                     radius,
                     radiusUnits,
                     boundingPolygonLayer,
                     areaUnits,
                     classificationType,
                     numClasses):
    
    #arcpy.AddMessage("In core Script")
    #arcpy.AddMessage("{},{},{},{},{},{}".format(field, cellsize, 
                                                #cellsizeUnits, radius, 
                                                #radiusUnits, areaUnits))
    #save environments
    origExtent = arcpy.env.extent or ""
    origMask = arcpy.env.mask or ""

    # describe
    descInFeatures = arcpy.Describe(inFeatures)
    srInFeatures = descInFeatures.spatialReference  
    
    # update workspace
    #if "in_memory" in outFeatures:
        #wksp = "in_memory"
    #else:
        #wksp = arcpy.env.scratchGDB
    
    wksp = arcpy.env.scratchGDB
    outRaster = os.path.join(wksp, "densityRaster")
    classRaster = os.path.join(wksp, "classRaster")

    #using planar for lines because of a desktop bug
    method = "GEODESIC"
    if "line" in descInFeatures.shapeType:
        method = "PLANAR"

    # update cellsize
    if cellsize and cellsizeUnits:        
        cellsize = conversionUtils.convertLengthtoSRUnits(descInFeatures, cellsize, 
                                                cellsizeUnits) 
        startTime = analysisutils.AddTimerMessage(startTime, "Convert cellsize to SRUnits")
    else:
        extent = descInFeatures.extent
        cellsize  = min(extent.width, extent.height)/1250.0   
    arcpy.AddMessage("updated cellsize: {}".format(cellsize))
        
    
    # update radiusUnits
    if radius and radiusUnits:
        radius = conversionUtils.convertLengthtoSRUnits(descInFeatures, radius, radiusUnits, method)
        arcpy.AddMessage("updated radius: {}".format(radius))
        startTime = analysisutils.AddTimerMessage(startTime, "Convert radius to SR Units")
    else:
        radius = "#"
    
    # update populationField
    if not field:
        field = "None"   
    elif not selectPositiveFieldValues(inFeatures, field):
        return None

    #defaults to # for desktop tool
    #online tool is coded to always have areaunits from org profile
    if areaUnits:
        updatedAreaUnits = "SQUARE_{}".format(areaUnits.upper().lstrip("SQUARE"))                       
    else:        
        updatedAreaUnits = "#"    
    arcpy.AddMessage("updated area units:{}".format(updatedAreaUnits))


        
    # Calculate Mask if boundingPolygonLayer
    if boundingPolygonLayer:
        maskPolygon = updateMaskingPolygon(startTime, boundingPolygonLayer)
        arcpy.env.mask = maskPolygon
        arcpy.env.extent = arcpy.Describe(maskPolygon).extent
        arcpy.AddMessage("updated boundingPolygon") 
        startTime = analysisutils.AddTimerMessage(startTime, "updated BoundingPolygon")
    else:
        arcpy.env.extent = ""


    arcpy.AddMessage("Kernel Density parameters")
    arcpy.AddMessage("{},{},{},{}.{}, {}".format(field, cellsize, radius, updatedAreaUnits, "#", method))

    if arcpy.CheckExtension('Spatial') == 'Available':
        if arcpy.CheckOutExtension('Spatial') != 'CheckedOut':
            arcpy.AddMessage('Unable to access the Spatial License.')
            raise Exception
    else:
        arcpy.AddMessage('Spatial license is not available.')
        raise Exception

    result = arcpy.gp.KernelDensity_sa(inFeatures, field, outRaster, cellsize, radius, updatedAreaUnits,"#", method)
    arcpy.CheckInExtension('Spatial')
    startTime = analysisutils.AddTimerMessage(startTime, "Kernel Density")


    
    # convert SR units to reqd area units if needed
    if updatedAreaUnits == "SQUARE_MAP_UNITS":        
        conversionFactor = conversionUtils.convertSquareMapUnits(outRaster, areaUnits)        
    else:
        conversionFactor = 1.0
        
    arcpy.AddMessage("conversionFactor:{}".format(conversionFactor))    
    #arcpy.AddMessage(outRaster)
    #set environments
    arcpy.env.mask = ""
    arcpy.env.extent = ""
    drawingInfo = classifyUtils.classifyRaster(startTime, outRaster, "value", classificationType, 
                                            numClasses, classRaster, outFeatures, conversionFactor, areaUnits)
    #nonSimpleFeatures = os.path.join(wksp, "nonSimpleFeatures")
    #drawingInfo = classifyUtils.classifyRaster(outRaster, "value", classificationType, 
                                            #numClasses, classRaster, nonSimpleFeatures, conversionFactor)
    
    # remove polygons less than cellsize
    #minimumPolyArea = cellsize * cellsize * 1.1
    #maxAllowableOffset = cellsize
    #arcpy.SimplifyPolygon_cartography(nonSimpleFeatures, outFeatures,"POINT_REMOVE", 
                                    #maxAllowableOffset,
                                    #minimumPolyArea, "NO_CHECK","NO_KEEP")

    startTime = analysisutils.AddTimerMessage(startTime, "Total time for classifyRaster")
    aolutils.createShapeAreaField(outFeatures, areaUnits)
    startTime = analysisutils.AddTimerMessage(startTime, "shapeArea field")
    #restore environments
    arcpy.env.extent = origExtent
    arcpy.env.mask = origMask
    return drawingInfo

    
def updateMaskingPolygon(startTime, boundingPolygonLayer):   
    if arcpy.env.extent:
        extent = arcpy.env.extent
        sr = extent.spatialReference
        pointsArr = arcpy.Array([extent.upperLeft,
                                 extent.upperRight,
                                 extent.lowerRight,
                                 extent.lowerLeft,
                                 extent.upperLeft])

        selectingPolygon = arcpy.Polygon(pointsArr, sr)
        outPolygon = os.path.join("in_memory","outPolygon")
        arcpy.AddMessage(outPolygon)
        #arcpy.env.outputCoordinateSystem = input_layer
        arcpy.CopyFeatures_management(selectingPolygon,outPolygon)
        #arcpy.env.outputCoordinateSystem = ""
        extentPolygon = "in_memory\extentPolygon"
        arcpy.analysis.PairwiseIntersect([boundingPolygonLayer, outPolygon], extentPolygon, "ONLY_FID")

        #arcpy.env.extent = arcpy.Describe(extentPolygon).extent
        arcpy.AddMessage("mask set to intersection of extent and boundingPolygonLayer")
        startTime = analysisutils.AddTimerMessage(startTime, "intersection of env.extent and boundingPolygon")         
        return extentPolygon
    else:
        return boundingPolygonLayer

def selectPositiveFieldValues(_inFeatures, _field):
    '''kernel density supports only +ve values. 
       Make sure only the +ve values are selected
    '''
    params = {"fieldName":_field}
    try:
        layer = arcpy.MakeFeatureLayer_management(_inFeatures, "positiveFieldLyr").getOutput(0)
        selectionSet = layer.getSelectionSet() 
        if selectionSet:
            selection_mode = "SUBSET_SELECTION"
        else:
            selection_mode = "NEW_SELECTION"
        #if arcpy.env.extent: 
            #selection_mode = "SUBSET_SELECTION"            
        #else:
            #selection_mode = "NEW_SELECTION"
        
        whereExpr = "{} >= 0".format(_field)
        arcpy.AddMessage(whereExpr)
        result = arcpy.GetCount_management(_inFeatures)
        countBeforeSelection = int(result.getOutput(0))
        arcpy.AddMessage(countBeforeSelection)        
        arcpy.SelectLayerByAttribute_management(_inFeatures,selection_mode,whereExpr)
        result = arcpy.GetCount_management(_inFeatures)
        countAfterSelection = int(result.getOutput(0))
        arcpy.AddMessage(countAfterSelection)
        if countAfterSelection == 0:
            errorMsg = errorMsgs[100107].format(_field)
            analysisutils.AddErrorCode(errorMsg, 100107, params)
            return False
        elif countAfterSelection < countBeforeSelection:
            errorMsg = errorMsgs[100108].format(_field)
            analysisutils.AddErrorCode(errorMsg, 100108, params, True)            
        return True
    except:
        arcpy.AddMessage("Exception when selecting positive field values")
        raise Exception
        #return False
    
   
