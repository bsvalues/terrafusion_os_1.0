"""---------------------------------------------------------------------------
Name:              FindPointClusters.py
Purpose:           Density-base Clustering for AGOL wtih DBScan and HDBscan
Author:            Esri Inc.
Created:           3/13/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    Pro 2.1
---------------------------------------------------------------------------"""

# from __future__ import unicode_literals
import os
import arcpy
import hostedgp as agolgp
import aolutils
import time
from arcpy import ExecuteError
import rendererUtils
import SSCluster as SC
import datetime

# ****Constant variables****
REQD_TOOLBOXES = "Workflows.tbx"
TASK_NAME = u"FindPointClusters"
err_msg = ""

costFactor = 0.001

error_ID = [100260, 110141]

PARAM_NAMES = {
    "analysisLayer": 0,
    "minFeaturesCluster": 1,
    "searchDistanceValue": 2,
    "searchDistanceUnit": 3,
    "outputName": 4,
    "context": 5,
    "resultLayer": 6,
    }

if __name__ == '__main__':

    hostedgp = None
    # timer messages
    startTime = time.time()
    beginTime = startTime

    try:

        hostedgp = agolgp.HostedGP(PARAM_NAMES["context"], PARAM_NAMES["outputName"])
        outputName = hostedgp.GetOutputName(PARAM_NAMES["outputName"])
        # check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)
        startTime = aolutils.AddTimerMessage(startTime, "Check privilege")

        # The input feature that the analysis will be performed on
        inputServices, inputFeatures, inputLayersName, inShape, inputCount, inputChangedFields = \
        aolutils.getHostedLayer(hostedgp, "Input Layer", PARAM_NAMES["analysisLayer"])

        if inShape != "esriGeometryPoint":
            msg = "The geometry type of {} must be Points".format("Analysis Layer") 
            aolutils.AddErrorCode(100091, msg, {"paramName":"Analysis Layer"})
            raise arcpy.ExecuteError

        paramsDict = {"analysisLayer": {"count": inputCount, "shapeType": inShape}}
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # Minimum Points to Seed Cluster
        minClusterSize = int(arcpy.GetParameterAsText(PARAM_NAMES["minFeaturesCluster"]))
        if minClusterSize < 2:
            aolutils.AddErrorCode(110143, "The Minimum Number of Features per Cluster must be greater than 1.")
            raise arcpy.ExecuteError

        # Search Distance
        searchDistanceValue = arcpy.GetParameterAsText(PARAM_NAMES["searchDistanceValue"])
        searchDistanceUnit = arcpy.GetParameterAsText(PARAM_NAMES["searchDistanceUnit"])
        searchDistance = ""

        if searchDistanceValue == 'nan':
            searchDistance = ""
        elif searchDistanceValue and searchDistanceUnit:
            searchDistance = "{} {}".format(searchDistanceValue, searchDistanceUnit)

        service_url = ""
        entoken = ""
        referer = ""

        arcpy.env.extent = None

        # Get cloud output paths
        wkspc = aolutils.getOutputWkspc(inputCount)
        scratchFeatures = os.path.join(wkspc, "PointClustersOutput")
        arcpy.AddMessage(u"Output path {}".format(scratchFeatures))

        colorCount = []
        try:
            startTime = aolutils.AddTimerMessage(startTime, "Running Analysis")
            cluster = None

            if searchDistance:
                clusterMethod = "DBSCAN"
                cluster = SC.DBSCAN(inputFeatures, scratchFeatures, minClusterSize, searchDistance)
            else:
                clusterMethod = "HDBSCAN"
                cluster = SC.HDBSCAN(inputFeatures, scratchFeatures, minClusterSize)
            cluster.run()
            uniques, colorCount = cluster.output()
            flayer = "outFeatures"
            arcpy.MakeFeatureLayer_management(scratchFeatures, flayer)
            returnType = 1
            if outputName.createService:
                returnType = 2

        except Exception as e:
            # arcpy.AddMessage("error {}".format(e))
            msgid = int(str(e))
            aolutils.AddErrorCode(msgid, arcpy.GetIDMessage(msgid))
            raise arcpy.ExecuteError
        info = arcpy.gp.GetAllMessages()
        # for i in info:
            # arcpy.AddMessage(i)

        descOut = arcpy.Describe(flayer)
        outCount = int(arcpy.GetCount_management(flayer).getOutput(0))
        res = aolutils.HostedToolResult(outputName)
        noise = True
        if -1 not in uniques:
            noise = False
        drawingInfo = rendererUtils.getDBClusterRenderingInfo(colorCount, noise)

        outDesc = aolutils.getOutDescription("PointClustersLayer", 0, drawingInfo)
        res.addHostedOutput(descOut, outDesc, PARAM_NAMES["resultLayer"])
        startTime = res.generateHostedResult(hostedgp, startTime)
        startTime = aolutils.AddTimerMessage(startTime, "Create Output Layer")


        values = [inputCount,
                  clusterMethod,
                  ]

        numObjects = inputCount
        aolutils.LogUsageMetering(TASK_NAME, numObjects, numObjects * costFactor, beginTime, values)

        paramsDict = {"analysisLayer": {"count": inputCount, "shapeType": inShape},
                      "resultLayer": {"count": outCount, "shapeType": "Point"}}
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, error_ID)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
