"""---------------------------------------------------------------------------
Name:              SummarizeCenterAndDispersion.py
Purpose:           Mean Center, Median Center, Central Feature and Ellipse for AGOL
Author:            Esri Inc.
Created:           11/8/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
---------------------------------------------------------------------------"""

# from __future__ import unicode_literals
import os
import json
import arcpy
import hostedgp as agolgp
import aolutils
import popup
import time
import SSDataObject as SSDO
import CentralFeature as CF
import MeanCenter as MEANCENT
import MedianCenter as MEDCENT
import StandardEllipse as SE
import datetime
import SSUtilities
from arcpy import ExecuteError

# ****Constant variables****
REQD_TOOLBOXES = "Workflows.tbx"
TASK_NAME = u"SummarizeCenterAndDispersion"
err_msg = ""

costFactor = 0.001

error_ID = [308, 401, 898, 978, 100261]

ERROR_CODES = {
    641: u"Too few records for analysis. This tool requires at least {} feature(s) to compute results.",
    100052: u"The field name {} does not exist in the {}.",
    }

PARAM_NAMES = {
    "analysisLayer": 0,
    "summarizeType": 1,
    "ellipseSize": 2,
    "weightField": 3,
    "groupField": 4,
    "outputName": 5,
    "context": 6,
    "CentralFeatureResultLayer": 7,
    "MeanCenterResultLayer": 8,
    "MedianCenterResultLayer": 9,
    "EllipseResultLayer": 10,
    }

CENTER_DRAW_INFO = {"esriGeometryPoint": {"renderer": {"type": "simple",
                                "symbol": {"type": "esriSMS",
                                           "style": "esriSMSCircle",
                                           "color": [38, 204, 255, 255],
                                           "size": 18,
                                           "angle": 0,
                                           "xoffset": 0,
                                           "yoffset": 0,
                                           "outline": {"color": [54, 93, 141, 255], "width": 1}}}},
                    "esriGeometryMultipoint": {"renderer": {"type": "simple",
                                "symbol": {"type": "esriSMS",
                                           "style": "esriSMSCircle",
                                           "color": [38, 204, 255, 255],
                                           "size": 18,
                                           "angle": 0,
                                           "xoffset": 0,
                                           "yoffset": 0,
                                           "outline": {"color": [54, 93, 141, 255], "width": 1}}}},
             "esriGeometryPolyline": {"renderer":{"type":"simple",
                                        "symbol": {"type": "esriSLS",
                                                   "style": "esriSLSSolid",
                                                   "color": [38,204,255,255],
                                                   "width": 2}}},
             "esriGeometryPolygon":{"renderer":{"type": "simple",
                                       "symbol": {"type": "esriSFS",
                                                  "style": "esriSFSSolid",
                                                  "color": [38,204,255,255],
                                                  "outline": {
                                                      "type": "esriSLS",
                                                      "style": "esriSLSSolid",
                                                      "color": [54,93,141,255],
                                                      "width": 1.5}}},
                           "transparency":25
                           }
             }

MEDIAN_DRAW_INFO = {
	"renderer": {
		"type": "simple",
		"symbol": {
			"type": "esriSMS",
			"style": "esriSMSCircle",
			"color": [255, 247, 51, 255],
			"size": 18,
			"angle": 0,
			"xoffset": 0,
			"yoffset": 0,
			"outline": {
				"color": [54, 93, 141, 255],
				"width": 1
			}
		}
	}
}

MEAN_DRAW_INFO = {
	"renderer": {
		"type": "simple",
		"symbol": {
			"type": "esriSMS",
			"style": "esriSMSCircle",
			"color": [51, 242, 0, 255],
			"size": 18,
			"angle": 0,
			"xoffset": 0,
			"yoffset": 0,
			"outline": {
				"color": [54, 93, 141, 255],
				"width": 1
			}
		}
	}
}

ELLIPSE_DRAW_INFO = {
    "renderer": {
        "type": "simple",
        "symbol": {
            "type": "esriSFS",
            "style": "esriSFSSolid",
            "color": [0, 0, 0, 0],
            "outline": {
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "color": [230, 51, 255, 255],
                "width": 2.5
            }
        }
    }, "transparency": 0
}

if __name__ == '__main__':

    hostedgp = None
    # timer messages
    startTime = time.time()
    beginTime = startTime

    try:

        hostedgp = agolgp.HostedGP(PARAM_NAMES["context"], PARAM_NAMES["outputName"])
        outputName = hostedgp.GetOutputName(PARAM_NAMES["outputName"])
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        startTime = aolutils.AddTimerMessage(startTime, "Check privilege")
        
        # The input feature that the analysis will be performed on
        inputServices, inputFeatures, inputLayersName, inShape, inputCount, inputChangedFields = \
        aolutils.getHostedLayer(hostedgp, "Input Layer", PARAM_NAMES["analysisLayer"])

        summarizeType = arcpy.GetParameterAsText(PARAM_NAMES["summarizeType"])

        sumTypeDict = {"CentralFeature": False, "MeanCenter": False, "MedianCenter": False, "Ellipse": False}
        for sumType, sumBool in sumTypeDict.items():
            if sumType in summarizeType:
                sumTypeDict[sumType] = True

        # The size of output ellipses in standard deviations.
        ellipseSize = arcpy.GetParameterAsText(PARAM_NAMES["ellipseSize"])
        if not ellipseSize:
            ellipseSize = "1 standard deviation"

        field_list = []

        # The numeric field used to weight distances. (optional)
        weightField = arcpy.GetParameterAsText(PARAM_NAMES["weightField"])
        if weightField:
            weightField = aolutils.updateChangedFieldNames(weightField, inputChangedFields).upper()
            field_list.append(weightField.upper())
            weightParam = "Weight"
        else:
            weightParam = "No Weight"

        # Field used to group features for separate central feature computations.
        # The case field can be of integer, date, or string type. (optional)
        groupField = arcpy.GetParameterAsText(PARAM_NAMES["groupField"])
        if groupField:
            groupField = aolutils.updateChangedFieldNames(groupField, inputChangedFields).upper()
            groupParam = "GroupBy"
            field_list.append(groupField.upper())

        else:
            groupParam = "No Group By"

        service_url = ""
        entoken = ""
        referer = ""
        arcpy.env.extent = None

        # Get cloud output paths
        wkspc = aolutils.getOutputWkspc(inputCount)

        returnType = 1
        if outputName.createService:
            returnType = 2
        scratch = ""
        ssdo = SSDO.SSDataObject(inputFeatures)
        if ssdo.shapeType == "Point":
            ssdo.obtainData(fields = field_list)
        else:
            ssdo.obtainData(fields = field_list, requireGeometry= True)

        layerOrder = -1
        outCount = {"CentralFeature": 0, "MeanCenter": 0, "MedianCenter": 0, "Ellipse": 0}
        outShape = {"CentralFeature": None, "MeanCenter": None, "MedianCenter": None, "Ellipse": None}

        paramsDict = {"analysisLayer": {"count": inputCount, "shapeType": inShape}}
        # check publishing privilege
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        res = aolutils.HostedToolResult(outputName)
        for sumType, sumBool in sumTypeDict.items():
            if sumBool:
                outDesc = ""
                layerOrder += 1
                startTime = aolutils.AddTimerMessage(startTime, "Run {}".format(sumType))
                scratch = os.path.join(wkspc, "{}Output".format(sumType))
                arcpy.AddMessage(u"{0} output path {1}".format(sumType, scratch))

                try:
                    if sumType == 'CentralFeature':
                        result = CF.CentralFeature(ssdo=ssdo, weightField=weightField, caseField=groupField)
                        drawingInfo = CENTER_DRAW_INFO[inShape]
                    elif sumType == 'MeanCenter':
                        result = MEANCENT.MeanCenter(ssdo=ssdo, weightField=weightField, caseField=groupField)
                        drawingInfo = MEAN_DRAW_INFO
                    elif sumType == 'MedianCenter':
                        result = MEDCENT.MedianCenter(ssdo=ssdo, weightField=weightField, caseField=groupField)
                        drawingInfo = MEDIAN_DRAW_INFO
                    else:
                        result = SE.StandardEllipse(ssdo=ssdo, weightField=weightField, caseField=groupField, stdDeviations = int(ellipseSize[0]))
                        drawingInfo = ELLIPSE_DRAW_INFO
                    result.createOutput(scratch)

                except:
                    raise arcpy.ExecuteError
                #     # arcpy.AddMessage("error {}".format(e))
                #     for i in e:
                #         # arcpy.AddMessage(i)
                #         if i[1] == 641:
                #             numFeatures = i[2].split(":")[1].split(" ")[-5]
                #             errormsg = ERROR_CODES[641].format(numFeatures)
                #             aolutils.AddErrorCode(641, errormsg, {"numFeatures": numFeatures})
                #         elif i[1] == 728:
                #             fieldName = i[2].split(":")[1].split(" ")[2]
                #             paramName = inputLayersName
                #             errormsg = ERROR_CODES[100052].format(fieldName, paramName)
                #             aolutils.AddErrorCode(100052, errormsg, {"fieldName": fieldName, "paramName": paramName})
                #         elif i[1] in error_ID:
                #             aolutils.AddErrorCode(i[1], i[2].split(":")[1])

                # info = arcpy.gp.GetAllMessages()
                # for i in info:
                #     arcpy.AddMessage(i)
                startTime = aolutils.AddTimerMessage(startTime, "Create {} Output Layer".format(sumType))
                descOut = arcpy.Describe(scratch)
                outCount[sumType] = int(arcpy.GetCount_management(scratch).getOutput(0))
                outShape[sumType] = descOut.shapeType
                outDesc = aolutils.getOutDescription("{}Layer".format(sumType), layerOrder, drawingInfo)
                res.addHostedOutput(descOut, outDesc, PARAM_NAMES["{}ResultLayer".format(sumType)])

        startTime = res.generateHostedResult(hostedgp, startTime)

        values = [inputCount,
                  weightParam,
                  groupParam,
                  outCount["CentralFeature"],
                  outCount["MeanCenter"],
                  outCount["MedianCenter"],
                  outCount["Ellipse"],
                  ]

        numObjects = inputCount + sum(outCount.values())
        aolutils.LogUsageMetering(TASK_NAME, numObjects, numObjects * costFactor, beginTime, values)

        paramsDict = {"analysisLayer": {"count": inputCount, "shapeType": inShape},
                      "centralResultLayer": {"count": outCount["CentralFeature"],
                                             "shapeType": outShape["CentralFeature"]},
                      "meanResultLayer": {"count": outCount["MeanCenter"],
                                          "shapeType": outShape["MeanCenter"]},
                      "medianResultLayer": {"count": outCount["MedianCenter"],
                                            "shapeType": outShape["MedianCenter"]},
                      "ellipseResultLayer": {"count": outCount["Ellipse"],
                                             "shapeType": outShape["Ellipse"]}}
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, error_ID)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()

