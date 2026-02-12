from __future__ import unicode_literals
import os
import json
import arcpy
import analysisutils
import classifyUtils
import time
import debugUtils
from copy import deepcopy

#Interpolate Models

interpolateParams = \
{"1":
{
"semivariogram_model_type" : "POWER",
"number_semivariograms": 30,
"overlap_factor" : 1,
"max_local_points" : 50,
"search_neighborhood" : arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax":8,"nbrMin":8})
},

"5":{
"semivariogram_model_type" : "POWER",
"number_semivariograms" : 100,
"overlap_factor" : 1.5,
"max_local_points" : 75,
"search_neighborhood" : arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax":10,"nbrMin":10})
},

"9":{
"semivariogram_model_type" : "K_BESSEL",
"number_semivariograms" : 200,
"overlap_factor" : 3,
"max_local_points" : 200,
"search_neighborhood" : arcpy.SearchNeighborhoodStandardCircular(**{"nbrMax":15,"nbrMin":15}),
"transformation_type" : "EMPIRICAL"
}

}



def interpolatePoints(startTime, inFeatures, field, outFeatures,
                      interpolateOptions, classificationType, numClasses,
                      classBreaks, boundingPolygonLayer, predictPointLayer,
                      includePredictionError, predictionErrorOutput,
                      predictedPointValues):
    '''interpolate points based on EBK and returns a contour surface,
    prediction error, predicted PointValues and drawingInfo'''


    # convert interpolateOption to EBK params
    interpolateOptions = interpolateParams[interpolateOptions]


    # update env extent based on bounding polygonLayer
    if boundingPolygonLayer:
        boundingPolygonLayer = updateEnvExtent(startTime, boundingPolygonLayer)

    # create interpolated surface and drawingInfo
    # update classifctionType to suit the tool
    classificationType = updateClassificationType(classificationType)
    gaLayer = interpolateToSurface(startTime, inFeatures, field, outFeatures,
                                   boundingPolygonLayer, interpolateOptions, classificationType,
                                   numClasses, classBreaks)

    # create error surface
    if includePredictionError:
        # set outputtype to prediction error
        arcpy.AddMessage("creating Error Surface")
        errInterpolateOptions=deepcopy(interpolateOptions)
        errInterpolateOptions["output_type"] = "PREDICTION_STANDARD_ERROR"
        if classificationType.upper() == "MANUAL":
            classificationType = "EQUAL_INTERVAL"
            numClasses = len(classBreaks)
        errorLayer = interpolateToSurface(startTime, inFeatures, field,
                                        predictionErrorOutput, boundingPolygonLayer,
                                        errInterpolateOptions, classificationType,
                                        numClasses, classBreaks)

    # create drawingInfos:
    #drawingInfo, errorDrawingInfo = classifyUtils.getGAContourDrawingInfo(outFeatures,
                                                                          #includePredictionError)

    # create predictedPointvalues

    if predictPointLayer and predictedPointValues:
        arcpy.AddMessage("Predicting points")
        predictPointCopy = os.path.join(arcpy.env.scratchGDB, "predictPoints")
        arcpy.CopyFeatures_management(predictPointLayer, predictPointCopy)
        arcpy.GALayerToPoints_ga(gaLayer, predictPointCopy, "", predictedPointValues)
        startTime = analysisutils.AddTimerMessage(startTime, "GALayer to Points")

    #return drawingInfo, errorDrawingInfo
    return
#End def interpolatePoints



def updateEnvExtent(startTime, boundingPolygon):
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
        arcpy.analysis.PairwiseIntersect([boundingPolygon, outPolygon], extentPolygon, "ONLY_FID")
        arcpy.env.extent = arcpy.Describe(extentPolygon).extent
        arcpy.AddMessage("env extent set to intersection of extent and boundingPolygonLayer")
        startTime = analysisutils.AddTimerMessage(startTime, "intersection of env.extent and boundingPolygon")

        return extentPolygon
    else:
        arcpy.env.extent = arcpy.Describe(boundingPolygon).extent
        return boundingPolygon
        #boundingPolyMappingLayer = arcpy.mapping.Layer(boundingPolygon)
        #startTime = analysisutils.AddTimerMessage(startTime, "Created mapping layer")
        #if boundingPolyMappingLayer._arc_object.getselectionset():
            #startTime = analysisutils.AddTimerMessage(startTime, "Get SelectionSet")
            #arcpy.env.extent = boundingPolyMappingLayer.getSelectedExtent()
            ##arcpy.AddMessage("env extent set to bounding polygons selected features")
            #startTime = analysisutils.AddTimerMessage(startTime, "set env.extent to selectedFeatures Extent")
        #else:
            #arcpy.env.extent = boundingPolyMappingLayer.getExtent()
            #arcpy.AddMessage("env extent set to bounding polygons features")
            #startTime = analysisutils.AddTimerMessage(startTime, "set env.extent to boundingPolygons extent")

#End def setEnvExtent

def interpolateToSurface(startTime, _inFeatures, _field, _outFeatures,
                         _boundingPolyLayer, _interpolateOptions,
                         _classificationType, _numClasses, _classBreaks,
                         ):
    '''interpolate surface with options'''

    startTime = analysisutils.AddTimerMessage(startTime, "EBK")
    # if boundingPolygon write contours to scratch
    if _boundingPolyLayer:
        arcpy.env.extent = arcpy.Describe(_boundingPolyLayer).extent
        outputContours = arcpy.CreateUniqueName("contours", "in_memory")
    else:
        arcpy.env.extent = ""
        outputContours = _outFeatures

    galayer = "galayer"
    # create interpolated surface
    if arcpy.CheckExtension('GeoStats') == 'Available':
        if arcpy.CheckOutExtension('GeoStats') != 'CheckedOut':
            arcpy.AddMessage('Unable to access the GeoStats license.')
            raise Exception
    else:
        arcpy.AddMessage('GeoStats license is not available.')
        raise Exception

    arcpy.EmpiricalBayesianKriging_ga(_inFeatures, _field, galayer, **_interpolateOptions)
    arcpy.CheckInExtension('GeoStats')

    # create contours
    multiPartContours = arcpy.CreateUniqueName("multiPartcontours", "in_memory")
    arcpy.GALayerToContour_ga(galayer, "FILLED CONTOUR", multiPartContours,
                              "Presentation", _classificationType,
                              _numClasses, _classBreaks)

    startTime = analysisutils.AddTimerMessage(startTime, "GALayer to Contour")

    # clip if boundingPolygonLayer
    if _boundingPolyLayer:
        #arcpy.AddMessage("clipped Polygon")
        bLayerPath = os.path.join(arcpy.env.scratchGDB, "boundingPolygon")
        arcpy.CopyFeatures_management(_boundingPolyLayer, bLayerPath )
        arcpy.Clip_analysis(multiPartContours, bLayerPath, outputContours)
        multiPartContours = outputContours
        startTime = analysisutils.AddTimerMessage(startTime, "Clip to bounding polygon")


    #split the multipart contours
    arcpy.MultipartToSinglepart_management(multiPartContours,_outFeatures)
    arcpy.DeleteField_management(outputContours,"ORIG_FID")
    startTime = analysisutils.AddTimerMessage(startTime, "Multipart to Singlepart")

    #add shape area field
    #analysisutils.createShapeAreaField(outputContours)

    arcpy.AddMessage(outputContours)
    return galayer

#End def interpolate surface

def updateClassificationType(_classificationType):
    '''change classification type values'''
    if _classificationType == "EqualInterval":
        _classificationType = "EQUAL_INTERVAL"
    elif _classificationType == "GeometricInterval" or \
         _classificationType =="GeometricalIntreval":
        _classificationType = "GEOMETRIC_INTERVAL"
    elif _classificationType == "EqualArea":
        _classificationType = "QUANTILE"
    else:
        _classificationType = _classificationType.upper()
    return _classificationType

