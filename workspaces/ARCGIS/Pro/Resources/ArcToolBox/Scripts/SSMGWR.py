# coding: utf-8
"""
Tool Name:     MGWR (Multiscale Geographically Weighted Regression)
Source Name:   SSMGWR.py
Version:       ArcGIS Pro 2.3
Author:        Environmental Systems Research Institute Inc.
Description:   Runs MGWR and produces standard output.
"""

################ Imports ####################
import sys as SYS
import os as OS

import arcpy.management
import numpy as NUM
import numpy.linalg as LA
import scipy.spatial as SCPS
import arcpy as ARCPY
import arcpy.management as DM
import arcgisscripting as ARC
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import WeightsUtilities as WU
import Stats as STATS
import locale as LOCALE
from scipy.stats import t as TSTATS
import scipy.optimize as OPTIMIZE
import tempfile as TEMPFILE

LOCALE.setlocale(LOCALE.LC_ALL, '')
MAX_ITER_GWR = 25
MAX_ITER_MGWR = 25
MAX_ITER_VAR = 25
MAX_ITER_GRADIENT = 250
AICC_EQUAL_CRITERIA = 0.1
DIAGNOSTIC_CALCULATION_METHOD = 3 # 0 as original method, 1 as optimized method with FOR-LOOP, 2 as optimized methos with Blaze, 3 as optimized method with Blaze and select lowest AICc in the middle
MEMORY_USAGE_LIMITATION = 8E7 # if 0 is provided, Pro will try to allocate a large memory to fit all the data at once, which might crash Pro
# whether to calculate the local condition numbers
DO_LOCALCOND_NUMS_CAL = True
SUPPORTED_SOLVE_METHOD = ["BACK-FITTING", "GRADIENT"]
POLY_NUM = 5

GRADIENTS_METHOD = "TRUST-CONSTR"  # must be one of ["NEWTON", "TRUST-CONSTR"]

fullLayerPath = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], 
                             "Resources", "ArcToolbox", "Templates", "Layers")

convertFamilyType = {'CONTINUOUS': 'GAUSSIAN',
                     'BINARY': 'LOGIT',
                     'COUNT': 'POISSON'}

################ Output Field Names #################
gwrFCFieldNames = ["RESIDUAL", "STDRESID", "INFLUENCE",
                   "COOKS_D"]
gwrFCFieldAlias = [ARCPY.GetIDMessage(84079), ARCPY.GetIDMessage(220513), ARCPY.GetIDMessage(220514),
                   ARCPY.GetIDMessage(220515)]

# gwrFCFieldAlias = ["Residual", "Std Residual", "Influence",
#                    "Cook's D"]

gwrFCFieldScaledNames = ["S_RESIDUAL", "S_STDRESID", "INFLUENCE", "COOKS_D"]
gwrFCFieldScaledAlias = [ARCPY.GetIDMessage(84079) + " " + ARCPY.GetIDMessage(220516),
                         ARCPY.GetIDMessage(220513) + " " + ARCPY.GetIDMessage(220516),
                         ARCPY.GetIDMessage(220514),
                         ARCPY.GetIDMessage(220515)]

# gwrNumNeighName = "NUM_NEIGHS"
# gwrNumNeighAlias = "Number of Neighbors"

gwrVarScaledName = "S_{0}"
gwrVarScaledAlias = ARCPY.GetIDMessage(220517)

gwrLocalR2Name = "LOCALR2"
gwrLocalR2Alias = ARCPY.GetIDMessage(220518)

gwrLocalCondNumsName = "CND_NUMBER"
gwrLocalCondNumsAlias = ARCPY.GetIDMessage(220519)

gwrPredFieldName = "PREDICTED"
gwrPredFieldAlias = ARCPY.GetIDMessage(220520)
gwrPredFieldScaledName = "S_PREDICT"
gwrPredFieldScaledAlias = ARCPY.GetIDMessage(220520).format(ARCPY.GetIDMessage(220521))

gwrInterceptName = "INTRCPT"
gwrInterceptAlias = ARCPY.GetIDMessage(84064)
gwrInterceptScaledName = "S_INTRCPT"
gwrInterceptScaledAlias = ARCPY.GetIDMessage(84064) + " " + "(Scaled)"

gwrCoefFieldName = "C_{0}"
gwrCoefFieldAlias = ARCPY.GetIDMessage(220522)
gwrCoefFieldScaledName = "S_C_{0}"
gwrCoefFieldScaledAlias = ARCPY.GetIDMessage(220522).format(ARCPY.GetIDMessage(220521))
gwrCoefFieldReversedName = "C_{0}"
gwrCoefFieldReversedAlias = ARCPY.GetIDMessage(220522).format(ARCPY.GetIDMessage(220523))

gwrSigFieldName = "SG_{}"
gwrSigFieldAlias = ARCPY.GetIDMessage(220524)
gwrSigFieldScaledName = "S_SG_{}"
gwrSigFieldScaledAlias = ARCPY.GetIDMessage(220524).format(ARCPY.GetIDMessage(220521))

# gwrRawCoefFieldName = "RC_{0}"
# gwrRawCoefFieldAlias = "Raw Coefficient ({0})"
#
# gwrRawPredFieldName = "RAWPREDICT"
# gwrRawPredFieldAlias = "Raw Predicted ({0})"

gwrSEFieldName = "SE_{0}"
gwrSEFieldAlias = ARCPY.GetIDMessage(220525)
gwrSEFieldScaledName = "S_SE_{0}"
gwrSEFieldScaledAlias = ARCPY.GetIDMessage(220525).format(ARCPY.GetIDMessage(220521))

gwrTTestFieldName = "T_{0}"
gwrTTestFieldAlias = ARCPY.GetIDMessage(220526)
gwrTTestFieldScaledName = "S_T_{0}"
gwrTTestFieldScaledAlias = ARCPY.GetIDMessage(220526).format(ARCPY.GetIDMessage(220521))

# ggwrRawFieldName = "RAW_PRED"
# ggwrRawFieldAlias = "Raw Predicted ({0})"

def execute(parameters, messages):

    ### Get parameter values ####
    inputFC = UTILS.getTextParameter(0, parameters)
    depVarName = UTILS.getTextParameter(1, parameters).upper()
    modelType = UTILS.getTextParameter(2, parameters).upper()
    indVarNames = UTILS.getTextParameter(3, parameters).upper()
    indVarNames = indVarNames.split(";")
    outputFC = UTILS.getTextParameter(4, parameters)
    outPath, outName = OS.path.split(outputFC)
    neighborType = UTILS.getTextParameter(5, parameters)
    neighborMethod = UTILS.getTextParameter(6, parameters)
    minNumNeighs = UTILS.getNumericParameter(7, parameters)
    maxNumNeighs = UTILS.getNumericParameter(8, parameters)
    userDistUnit = UTILS.getTextParameter(9, parameters)
    minDistance = UTILS.getNumericParameter(10, parameters)
    maxDistance = UTILS.getNumericParameter(11, parameters)
    numNeighsInc = UTILS.getNumericParameter(12, parameters)
    distanceInc = UTILS.getNumericParameter(13, parameters)
    numIncrements = UTILS.getNumericParameter(14, parameters)
    numNeighs = UTILS.getNumericParameter(15, parameters)
    bandwidth = UTILS.getNumericParameter(16, parameters)
    predictInputFC = UTILS.getTextParameter(23, parameters)
    predictVT = parameters[24].value
    predictOutputFC = UTILS.getTextParameter(25, parameters)
    robust = parameters[26].value
    kernel = UTILS.getTextParameter(27, parameters)
    standarizeInput = parameters[30].value
    if kernel is None:
        kernel = "BISQUARE"
    outVarStatTable = UTILS.getTextParameter(28, parameters)
    rasterDir = UTILS.getTextParameter(29, parameters)
    #### Check If User Has the Advanced License to Conduct This Analysis ####
    if not checkLicense() and rasterDir is not None:
        ARCPY.AddIDMessage("ERROR", 110257)
        raise SystemExit()

    #### Check the output path in runtime before taking actions ####
    UTILS.checkOutputPath(outputFC, "FC")
    if predictOutputFC is not None:
        UTILS.checkOutputPath(predictOutputFC, "FC")
    if outVarStatTable is not None:
        UTILS.checkOutputPath(outVarStatTable, "TABLE")

    #### Create SSDataObject ####
    allVars = [depVarName] + indVarNames
    checker = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields = allVars)
    ssdo = SSDO.SSDataObject(inputFC, templateFC=outputFC)
    ssdo.obtainData(ssdo.oidName, allVars, minNumObs=30)

    #### Get Family ####
    family = convertFamilyType[modelType]

    #### Build the individual Search Criterions for each variable ####
    if neighborMethod == "MANUAL_INTERVALS":
        if neighborType == "NUMBER_OF_NEIGHBORS":
            gloableCriterion = [minNumNeighs + (i * numNeighsInc) for i in range(numIncrements)]
            paramIndv = parameters[18]
        else:
            gloableCriterion = [minDistance + (i * distanceInc) for i in range(numIncrements)]
            paramIndv = parameters[21]
        rangeCollection = []
        collectionDict = {}
        rows = paramIndv.value
        if rows is not None:
            for rowInd, row in enumerate(rows):
                vn = row[0].value.upper()
                if row[1] > 0 and row[2] > 0 and row[3] > 0:
                    collectionDict[vn] = [row[1] + (i * row[2]) for i in range(row[3])]
        for vn in indVarNames:
            if vn in collectionDict:
                rangeCollection.append(collectionDict[vn])
            else:
                rangeCollection.append(gloableCriterion)
        if neighborType =="NUMBER_OF_NEIGHBORS":
            mgwr = MGWR(ssdo, depVarName, indVarNames,
                        numNeighborsCollection=rangeCollection,
                        kernel=kernel, interceptBW=gloableCriterion,
                        standarizeInput=standarizeInput)
        else:
            mgwr = MGWR(ssdo, depVarName, indVarNames,
                        distanceCollection=rangeCollection, userDistUnit=userDistUnit,
                        kernel=kernel, interceptBW=gloableCriterion,
                        standarizeInput=standarizeInput)
    elif neighborMethod == "USER_DEFINED":
        if neighborType == "NUMBER_OF_NEIGHBORS":
            gloableCriterion = [numNeighs]
            paramIndv = parameters[19]
        else:
            gloableCriterion = [bandwidth]
            paramIndv = parameters[22]
        rangeCollection = []
        collectionDict = {}
        rows = paramIndv.value
        if rows is not None:
            for rowInd, row in enumerate(rows):
                vn = row[0].value.upper()
                if row[1] > 0 :
                    collectionDict[vn] = [row[1]]
        for vn in indVarNames:
            if vn in collectionDict:
                rangeCollection.append(collectionDict[vn])
            else:
                rangeCollection.append(gloableCriterion)
        if neighborType == "NUMBER_OF_NEIGHBORS":
            mgwr = MGWR(ssdo, depVarName, indVarNames,
                        numNeighborsCollection=rangeCollection,
                        kernel=kernel, interceptBW=gloableCriterion[0],
                        standarizeInput=standarizeInput)
        else:
            mgwr = MGWR(ssdo, depVarName, indVarNames,
                        distanceCollection=rangeCollection, userDistUnit=userDistUnit,
                        kernel=kernel, interceptBW=gloableCriterion[0],
                        standarizeInput=standarizeInput)
    else:  # Golden Search or Gradient Search
        if neighborType == "NUMBER_OF_NEIGHBORS":
            gloableCriterion = [minNumNeighs, maxNumNeighs]
            if neighborMethod == "GOLDEN_SEARCH":
                paramIndv = parameters[17]
            else:
                paramIndv = parameters[33]
        else:
            gloableCriterion = [minDistance, maxDistance]
            if neighborMethod == "GOLDEN_SEARCH":
                paramIndv = parameters[20]
            else:
                paramIndv = parameters[34]
        if gloableCriterion[0] is None:
            gloableCriterion[0] = -9999
        if gloableCriterion[1] is None:
            gloableCriterion[1] = -9999
        rangeCollection = []
        collectionDict = {}
        rows = paramIndv.value
        if rows is not None:
            for rowInd, row in enumerate(rows):
                vn = row[0].value.upper()
                cunstom_range = gloableCriterion.copy()
                if row[1] > 0:
                    cunstom_range[0] = row[1]
                if row[2] > 0:
                    cunstom_range[1] = row[2]
                collectionDict[vn] = cunstom_range
        for vn in indVarNames:
            if vn in collectionDict:
                rangeCollection.append(collectionDict[vn])
            else:
                rangeCollection.append(gloableCriterion)
        solveMethod = "GRADIENT" if neighborMethod.upper().find("GRADIENT")>=0 else "BACK-FITTING"

        if neighborType == "NUMBER_OF_NEIGHBORS":
            mgwr = MGWR(ssdo, depVarName, indVarNames,
                        numNeighborsRanges=rangeCollection,
                        kernel=kernel,
                        standarizeInput=standarizeInput, solveMethod=solveMethod)
        else:
            mgwr = MGWR(ssdo, depVarName, indVarNames,
                        distanceRanges=rangeCollection, userDistUnit=userDistUnit,
                        kernel=kernel,
                        standarizeInput=standarizeInput, solveMethod=solveMethod)
    parameters[4].symbology = None
    mgwr.createMGWROutputFC(outputFC)
    if outVarStatTable:
        parameters[28].charts = mgwr.createVariableStatTable(outVarStatTable)

    #### Render Results ####
    if standarizeInput:
        data = {"field": "S_STDRESID"}
    else:
        data = {"field": "STDRESID"}
    if ssdo.shapeType.upper() == "POINT":
        UTILS.buildLocaleCIMLayer("GWR_Points.lyrx", 4, data=data)
    else:
        UTILS.buildLocaleCIMLayer("GWR_Polygons.lyrx", 4, data=data)

    #### Prediction ####
    if predictInputFC is not None:
        predVarNames = [vRow[0].value.upper() for vRow in predictVT]
        checker = UTILS.ExecuteNewFieldTypeChecker(predictInputFC, predictOutputFC, fields = predVarNames)
        mgwr.predictNewFC(predictInputFC, predVarNames, predictOutputFC, robust=robust)
        try:
            desc = ARCPY.Describe(predictInputFC)
            shapeType = desc.ShapeType.upper()
            predLYR = ""
            if modelType == "BINARY":
                if shapeType == "POINT":
                    predLYR = "GWR_Predict_Points_Binary.lyrx"
                else:
                    predLYR = "GWR_Predict_Polygons_Binary.lyrx"
            elif modelType == "COUNT":
                if shapeType == "POINT":
                    predLYR = "GWR_Predict_Points_Count.lyrx"
                else:
                    predLYR = "GWR_Predict_Polygons_Count.lyrx"
            else:
                if shapeType == "POINT":
                    predLYR = "GWR_Predict_Points.lyrx"
                else:
                    predLYR = "GWR_Predict_Polygons.lyrx"
            UTILS.buildLocaleCIMLayer(predLYR, 25)
        except:
            pass

    #### Coefficient Rasters ####
    if rasterDir is not None:
        outputPref, ext = OS.path.splitext(outName)
        outRasterLayers = mgwr.predictionCoefficientRasters(rasterDir, outputPref, robust=robust)
        ARCPY.SetParameter(31, outRasterLayers)

    groupLayer = mgwr.buildOutputGroupLayer(outputFC)
    ARCPY.SetParameter(32, groupLayer)

    #### Add Charts To The Results ####
    chartList = list()
    depVarOutName = mgwr.out_depVarName
    indVarOutNames = mgwr.out_indVarNames
    chartTitle = ""

    #### Create Scatter Plot Matrix for Xs and Y ####
    smChartFields = [depVarOutName] + indVarOutNames
    smChartFieldsAlias = [mgwr.out_depVarAlias] + mgwr.out_indVarAlias

    if len(smChartFields) < 3:
        if len(smChartFields) == 2:
            chartTitle = ARCPY.GetIDMessage(84888).format(ARCPY.GetIDMessage(220641))
            sChart1 = ARCPY.Chart(chartTitle)
            sChart1.type = 'scatter'
            sChart1.title = chartTitle
            # sChart1.description = 'desc'
            sChart1.xAxis.field = smChartFields[1]
            sChart1.yAxis.field = [smChartFields[0]]
            sChart1.xAxis.title = smChartFieldsAlias[1]
            sChart1.yAxis.title = smChartFieldsAlias[0]
            sChart1.scatter.showTrendLine = True
            chartList.append(sChart1)
    else:
        if len(smChartFields) > 10:
            ARCPY.AddIDMessage("WARNING", 110249, len(smChartFields))
            smChartFields = smChartFields[:10]
        chartTitle = ARCPY.GetIDMessage(84888).format(ARCPY.GetIDMessage(220642))
        smChart = ARCPY.Chart(chartTitle)
        smChart.type = 'scatterMatrix'
        smChart.title = chartTitle
        smChart.scatterMatrix.fields = smChartFields
        smChart.scatterMatrix.showTrendLine = True
        smChart.scatterMatrix.showHistograms = True
        # smChart.scatterMatrix.showAsRSquared = True
        chartList.append(smChart)

    #### Create Histograms for Residuals/Deviance Residuals ####
    chartTitle = ARCPY.GetIDMessage(84889)
    if standarizeInput:
        histChartXfield = 'S_STDRESID'
    else:
        histChartXfield = 'STDRESID'
    histChartXTitle = ARCPY.GetIDMessage(84891)
    histChartShowComparisonDistribution = True
    histChartShowMean = True

    histChart = ARCPY.Chart(chartTitle)
    histChart.type = 'histogram'
    histChart.title = chartTitle
    histChart.xAxis.field = histChartXfield
    histChart.xAxis.title = histChartXTitle
    histChart.histogram.showComparisonDistribution = histChartShowComparisonDistribution
    histChart.histogram.showMean = histChartShowMean
    chartList.append(histChart)

    #### Create Scatter Plot for Residuals in CONTINUOUS Model ####
    yAxisField = []
    yAxisTitle = ''
    chartTitle = ARCPY.GetIDMessage(84893)
    if standarizeInput:
        yAxisField = ['S_STDRESID']
    else:
        yAxisField = ['STDRESID']
    yAxisTitle = ARCPY.GetIDMessage(84891)
    sChart = ARCPY.Chart(chartTitle)
    sChart.type = 'scatter'
    sChart.title = chartTitle
    # sChart.description = 'desc'
    if standarizeInput:
        sChart.xAxis.field = 'S_PREDICT'
    else:
        sChart.xAxis.field = 'PREDICTED'
    sChart.yAxis.field = yAxisField
    sChart.xAxis.title = ARCPY.GetIDMessage(84895)
    sChart.yAxis.title = yAxisTitle
    sChart.scatter.showTrendLine = False
    chartList.append(sChart)

    parameters[4].charts = chartList

def checkEmptyGroupLayer(groupLayer):
    """
    Check if the groupLayer is actually empty
    """
    layers = [groupLayer]
    while len(layers):
        l = layers.pop(0)
        if not l.isGroupLayer:
            return False
        if len(l.listLayers()):
            layers += l.listLayers()
    return True
    
def postExecute(parameters):
    #### Move the main result feature class into group layer ####
    try:
        aliasTemplate = "{0}"
        if parameters[30].value:
            aliasTemplate = ARCPY.GetIDMessage(220517)

        outputFC = UTILS.getTextParameter(4, parameters)
        project = ARCPY.mp.ArcGISProject('CURRENT')
        map = project.activeMap

        groups2Delete = []
        for gl in map.listLayers(UTILS.getTextParameter(32, parameters)):
            if gl.isGroupLayer and checkEmptyGroupLayer(gl):
                groups2Delete.append(gl)
        for gl in groups2Delete:
            map.removeLayer(gl)

        layerGroup = map.listLayers(UTILS.getTextParameter(32, parameters))[0]
        layerMainName = OS.path.basename(outputFC)
        if layerMainName.lower().endswith(".shp"):
            layerMainName = layerMainName[0: -4]
        layerMain = None
        nameFilter = layerMainName
        if len(map.listLayers(nameFilter)) > 0:
            lc = map.listLayers(nameFilter)[0]
            if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(lc.dataSource) or OS.path.normpath(outputFC).removesuffix(".shp").lower().startswith("memory\\"):
                layerMain = lc
        if layerMain is None:
            nameFilter = f"*:{layerMainName}"
            if len(map.listLayers(nameFilter)) > 0:
                lc = map.listLayers(nameFilter)[0]
                if OS.path.normpath(outputFC).removesuffix(".shp") == OS.path.normpath(lc.dataSource):
                    layerMain = lc

        if layerGroup and len(layerGroup.listLayers()):
            ### Update the legend heading of each layer ####
            ind = 0
            l2move = []
            indVarNames = UTILS.getTextParameter(3, parameters).split(";")
            descInputFC = ARCPY.Describe(UTILS.getTextParameter(0, parameters))
            anaFields = []
            for i in indVarNames:
                for fieldObj in descInputFC.fields:
                    if fieldObj.name.upper() == i.upper():
                        anaFields.append(aliasTemplate.format(fieldObj.aliasName))
            anaFields.append(aliasTemplate.format(ARCPY.GetIDMessage(84064)))

            for lyr in layerGroup.listLayers():
                if lyr.isGroupLayer:
                    break
                df = lyr.getDefinition("V2")
                if hasattr(df.renderer, "heading") and hasattr(lyr, "name"):
                    df.renderer.heading = lyr.name
                    lyr.setDefinition(df)
                ind += 1
                l2move.append(lyr)
                if ind % 2 == 0:
                    emptyGL = ARCPY.mp.LayerFile(OS.path.join(fullLayerPath, "SS_Empty_Group.lyrx"))
                    map.addLayerToGroup(layerGroup, emptyGL, "bottom")
                    targetSubGroup = layerGroup.listLayers()[-1]
                    targetSubGroup.name = anaFields[(ind - 1) // 2 % len(anaFields)]
                    for l in l2move:
                        map.addLayerToGroup(targetSubGroup, l, "bottom")
                        map.removeLayer(l)
                    l2move = []

            #### Move the main output layer into the group layer ####
            if layerMain is not None:
                layerMain.name = ARCPY.GetIDMessage(84891)
                map.moveLayer(layerGroup.listLayers()[0], layerMain, "BEFORE")

            for lyr in layerGroup.listLayers():
                if lyr.isGroupLayer:
                    l_cim = lyr.getDefinition("V2")
                    l_cim.expanded = False
                    lyr.setDefinition(l_cim)
    except:
        pass

def raiseSearchParamError():
    """
    Internal API error, should not be exposed to user.
    """
    ARCPY.AddError("The number of independent variables and the number of search criterions should be same.")
    raise SystemExit()

def globalGWRCoincidentPointChecker(ssdo):
    maxCoin = ssdo.counts.max()
    if maxCoin >= 1000 or maxCoin == ssdo.numObs:
        ARCPY.AddIDMessage("ERROR", 110246, str(maxCoin), str(ssdo.numObs))
        raise SystemExit()
    else:
        coinBool = ssdo.counts != 1
        numWithCoin = coinBool.sum()
        if numWithCoin:
            ARCPY.AddIDMessage("WARNING", 110251, str(numWithCoin))

def checkLicense():
    product = ARCPY.ProductInfo()
    if product in ["ArcInfo"]:
        return True
    elif product == "ArcServer":
        #### 3D extension is used to verify that server used advance lic ####
        if ARCPY.CheckExtension("3D") == "Available":
            return True
        else:
            return False
    else:
        return False


def combineExtets(ext1, ext2):
    """
    combine two Extent to get the extended one
    """
    return ARCPY.Extent(
        min(ext1.XMin, ext2.XMin),
        min(ext1.YMin, ext2.YMin),
        max(ext1.XMax, ext2.XMax),
        max(ext1.YMax, ext2.YMax)
    )


class MGWR(object):

    @staticmethod
    def createField(name, dataType=None, aliasName=None):
        """
        Method for conveniently creating Field Object
        Parameters
        ----------
        name
        dataType
        aliasName

        Returns
        -------

        """
        newField = ARCPY.Field()
        newField.name = name
        if dataType:
            # if dataType.upper() == "INTEGER":
            #     dataType = "Long"
            if dataType.upper() in ["FLOAT", "SINGLE"]:
                dataType = "Double"
            newField.type = dataType
        if aliasName:
            newField.aliasName = aliasName
        return newField

    @staticmethod
    def getOutputFCFields(inputFC, outputFC, depVarName, indVarNames,
                          standarizeInput, initModelType=None,
                          calLocalCondNums=DO_LOCALCOND_NUMS_CAL):
        """ Get the list of field names according to user's input.
        The names will be attached to param's schema attribute for model builder
        :param parameters:
        :return:
        """
        resultFields = []
        if not ARCPY.Exists(inputFC):
            return resultFields

        #### Prepare Derived Variables for Output Feature Class ####
        descInputFC = ARCPY.Describe(inputFC)
        inputFCFields = dict()
        for fieldObj in descInputFC.fields:
            inputFCFields[fieldObj.name.upper()] = fieldObj

        #### Add the input fields one by one since they are standardized ####
        appendFields = [depVarName] + indVarNames
        if standarizeInput:
            appendFields = [gwrVarScaledName.format(v) for v in appendFields]

        if standarizeInput:
            coefFN = gwrCoefFieldScaledName
            coefFA = gwrCoefFieldScaledAlias

            seFN = gwrSEFieldScaledName
            seFA = gwrSEFieldScaledAlias

            ttFN = gwrTTestFieldScaledName
            ttFA = gwrTTestFieldScaledAlias

            sigFN = gwrSigFieldScaledName
            sigFA = gwrSigFieldScaledAlias

            predFN = gwrPredFieldScaledName
            predFA = gwrPredFieldScaledAlias

            FCFN = gwrFCFieldScaledNames
            FCFA = gwrFCFieldScaledAlias

        else:
            coefFN = gwrCoefFieldName
            coefFA = gwrCoefFieldAlias

            seFN = gwrSEFieldName
            seFA = gwrSEFieldAlias

            ttFN = gwrTTestFieldName
            ttFA = gwrTTestFieldAlias

            sigFN = gwrSigFieldName
            sigFA = gwrSigFieldAlias

            predFN = gwrPredFieldName
            predFA = gwrPredFieldAlias

            FCFN = gwrFCFieldNames
            FCFA = gwrFCFieldAlias

        #### Start With Coefficients, SEs and pseudo-T values for the intercept ####
        appendFields.append(coefFN.format(gwrInterceptName))
        appendFields.append(seFN.format(gwrInterceptName))
        appendFields.append(ttFN.format(gwrInterceptName))
        appendFields.append(sigFN.format(gwrInterceptName))

        # indVarOut = []
        for varName in indVarNames:
            appendFields.append(coefFN.format(varName))
            appendFields.append(seFN.format(varName))
            appendFields.append(ttFN.format(varName))
            appendFields.append(sigFN.format(varName))

        ##### Add prediction field ####
        appendFields.append(predFN)

        if standarizeInput:
            #### Add reverse prediction field ####
            appendFields.append(gwrPredFieldName)
            for varName in [gwrInterceptName] + indVarNames:
                appendFields.append(gwrCoefFieldReversedName.format(varName))

        appendFields += FCFN

        if initModelType == "GWR":
            appendFields.append(gwrLocalR2Name)

        if calLocalCondNums:
            appendFields.append(gwrLocalCondNumsName)

        outPath, outName = OS.path.split(outputFC)
        indVarOut = UTILS.createAppendFieldNames(appendFields, outPath)

        c = 0
        for ind, varName in enumerate([depVarName] + indVarNames):
            varNameValid = indVarOut[ind]
            if standarizeInput:
                outAlias = gwrVarScaledAlias.format(inputFCFields[varName.upper()].aliasName)
                field = MGWR.createField(varNameValid, "DOUBLE", outAlias)
            else:
                outAlias = inputFCFields[varName.upper()].aliasName
                field = MGWR.createField(varNameValid, "DOUBLE", outAlias)

            resultFields.append(field)
            c += 1

        coefInterceptName = indVarOut[c]
        c += 1
        coefInterceptAlias = coefFA.format(gwrInterceptAlias)
        field = MGWR.createField(coefInterceptName, "DOUBLE", coefInterceptAlias)
        resultFields.append(field)

        seInterceptName = indVarOut[c]
        c += 1
        seInterceptAlias = seFA.format(gwrInterceptAlias)
        field = MGWR.createField(seInterceptName, "DOUBLE", seInterceptAlias)
        resultFields.append(field)

        ttInterceptName = indVarOut[c]
        c += 1
        ttInterceptAlias = ttFA.format(gwrInterceptAlias)
        field = MGWR.createField(ttInterceptName, "DOUBLE", ttInterceptAlias)
        resultFields.append(field)

        sigInterceptName = indVarOut[c]
        c += 1
        sigInterceptAlias = sigFA.format(gwrInterceptAlias)
        field = MGWR.createField(sigInterceptName, "SHORT", sigInterceptAlias)
        resultFields.append(field)

        for varInd, varName in enumerate(indVarNames):
            #### Add Coefficient ####
            fieldName = indVarOut[c]
            alias = coefFA.format(inputFCFields[varName.upper()].aliasName)
            field = MGWR.createField(fieldName, "DOUBLE", alias)
            resultFields.append(field)
            c += 1

            #### Add SE ####
            fieldName = indVarOut[c]
            alias = seFA.format(inputFCFields[varName.upper()].aliasName)
            field = MGWR.createField(fieldName, "DOUBLE", alias)
            resultFields.append(field)
            c += 1

            #### Add T-Stats ####
            fieldName = indVarOut[c]
            alias = ttFA.format(inputFCFields[varName.upper()].aliasName)
            field = MGWR.createField(fieldName, "DOUBLE", alias)
            resultFields.append(field)
            c += 1

            #### Add Significance ####
            fieldName = indVarOut[c]
            alias = sigFA.format(inputFCFields[varName.upper()].aliasName)
            field = MGWR.createField(fieldName, "SHORT", alias)
            resultFields.append(field)
            c += 1

        #### Add Prediction Field ####
        fieldName = indVarOut[c]
        alias = predFA.format(inputFCFields[depVarName.upper()].aliasName)
        field = MGWR.createField(fieldName, "DOUBLE", alias)
        resultFields.append(field)
        c += 1

        #### Add reverse standarized values ####
        if standarizeInput:
            fieldName = indVarOut[c]
            fieldAlias = gwrPredFieldAlias.format(inputFCFields[depVarName.upper()].aliasName)
            field = MGWR.createField(fieldName, "DOUBLE", fieldAlias)
            resultFields.append(field)
            c += 1

            for ind in range(1 + len(indVarNames)):
                vn = indVarOut[c]
                c += 1
                if ind == 0:
                    alias = gwrCoefFieldReversedAlias.format(gwrInterceptAlias)
                else:
                    alias = gwrCoefFieldReversedAlias.format(inputFCFields[indVarNames[ind - 1].upper()].aliasName)
                field = MGWR.createField(vn, "DOUBLE", alias)
                resultFields.append(field)


        for varInd in range(len(FCFN)):
            alias = FCFA[varInd]
            varName = indVarOut[c]
            c += 1
            field = MGWR.createField(varName, "DOUBLE", alias)
            resultFields.append(field)

        if initModelType == "GWR":
            varName = indVarOut[c]
            c += 1
            field = MGWR.createField(varName, "DOUBLE", gwrLocalR2Alias)
            resultFields.append(field)

        if calLocalCondNums:
            varName = indVarOut[c]
            c += 1
            field = MGWR.createField(varName, "DOUBLE", gwrLocalCondNumsAlias)
            resultFields.append(field)

        return resultFields

    @staticmethod
    def getPredictFCFields(depVarName, inputFC, predictInputFC, predictOutputFC, predVarTable, standarizeInput):
        """
        Get the list of field names according to user's input.
        The names will be attached to param's schema attribute for model builder
        :param parameters:
        :return:
        """
        resultFields = []
        if not ARCPY.Exists(inputFC):
            return resultFields
        if not ARCPY.Exists(predictInputFC):
            return resultFields

        depVarAlias = ""
        descInFC = ARCPY.Describe(inputFC)
        for f in descInFC.fields:
            if f.name.upper() == depVarName.upper():
                depVarAlias = f.aliasName

        descPredFC = ARCPY.Describe(predictInputFC)
        outPath, outName = OS.path.split(predictOutputFC)
        predFCFields = dict()
        for fieldObj in descPredFC.fields:
            predFCFields[fieldObj.name.upper()] = fieldObj

        predVarNames = [vRow[0].value for vRow in predVarTable]
        for fieldName in predVarNames:
            if fieldName.upper() not in predFCFields:
                return []
        appendFields = predVarNames.copy()
        if standarizeInput:
            vnFA = gwrVarScaledAlias
            appendFields = [gwrVarScaledName.format(v) for v in appendFields]
            appendFields += [gwrPredFieldScaledName, gwrPredFieldName]

            coefFN = gwrCoefFieldScaledName
            coefFA = gwrCoefFieldScaledAlias
        else:
            vnFA = "{0}"
            appendFields += [gwrPredFieldName]

            coefFN = gwrCoefFieldName
            coefFA = gwrCoefFieldAlias

        appendFields += [coefFN.format(vn.upper()) for vn in [gwrInterceptName] + predVarNames]
        if standarizeInput:
            appendFields += [gwrCoefFieldReversedName.format(vn) for vn in [gwrInterceptName] + predVarNames]

        appendFieldsValid = UTILS.createAppendFieldNames(appendFields, outPath)

        C = 0

        for ind, varName in enumerate(predVarNames):
            varNameValid = appendFieldsValid[ind]
            field = MGWR.createField(varNameValid, "DOUBLE",
                                              vnFA.format(predFCFields[predVarNames[ind].upper()].aliasName))
            resultFields.append(field)
            C += 1
        if standarizeInput:
            vn = appendFieldsValid[C]
            C += 1
            alias = gwrPredFieldScaledAlias.format(depVarAlias)
            field = MGWR.createField(vn, "DOUBLE", alias)
            resultFields.append(field)

            #### Do the reverse y prediction here ####
            vn = appendFieldsValid[C]
            C += 1
            alias = gwrPredFieldAlias.format(depVarAlias)
            field = MGWR.createField(vn, "DOUBLE", alias)
            resultFields.append(field)
        else:
            vn = appendFieldsValid[C]
            C += 1
            alias = gwrPredFieldAlias.format(depVarAlias)
            field = MGWR.createField(vn, "DOUBLE", alias)
            resultFields.append(field)

        for ind in range(1 + len(predVarNames)):
            vn = appendFieldsValid[C]
            C += 1
            if ind == 0:
                alias = coefFA.format(gwrInterceptAlias)
            else:
                alias = coefFA.format(predFCFields[predVarNames[ind - 1].upper()].aliasName)
            field = MGWR.createField(vn, "DOUBLE", alias)
            resultFields.append(field)

        if standarizeInput:
            for ind in range(1 + len(predVarNames)):
                vn = appendFieldsValid[C]
                C += 1
                if ind == 0:
                    alias = gwrCoefFieldReversedAlias.format(gwrInterceptAlias)
                else:
                    alias = gwrCoefFieldReversedAlias.format(predFCFields[predVarNames[ind - 1].upper()].aliasName)
                field = MGWR.createField(vn, "DOUBLE", alias)
                resultFields.append(field)

        return resultFields

    @staticmethod
    def makeDerivedRasterLayers(indVarNames, outputFC, outputDir, standarizeInput, fromUI):
        outRasterLayers = []
        outLayerNames = []
        outRasterLayers_std = []
        outLayerNames_std = []

        #### Get Output FC Prefix ####
        outPath, outName = OS.path.split(outputFC)
        outputPref, ext = OS.path.splitext(outName)

        #### Get Base Workspace Type ####
        baseType = UTILS.getBaseWorkspaceType(outputDir)
        ext = ""
        delRaster = False
        if baseType.upper() == "FILESYSTEM":
            #### Add tif Extension for Folders ####
            ext = ".tif"
            delRaster = True

        #### Create Slope Rasters ####
        for varInd, varName in enumerate(["INTERCEPT"] + indVarNames):
            varNameOut = "C_" + varName
            varNameOut_std = "S_C_" + varName
            if outputPref is not None:
                varNameOut = outputPref + "_" + varNameOut
                varNameOut_std = outputPref + "_" + varNameOut_std
            varNameOut = ARCPY.ValidateFieldName(varNameOut, ARCPY.env.scratchGDB)
            varNameOut_std = ARCPY.ValidateFieldName(varNameOut_std, ARCPY.env.scratchGDB)
            outName = OS.path.join(outputDir, varNameOut) + ext
            outName_std = OS.path.join(outputDir, varNameOut_std) + ext
            outRasterLayers.append(outName)
            outLayerNames.append(varNameOut)
            outRasterLayers_std.append(outName_std)
            outLayerNames_std.append(varNameOut_std)

        if standarizeInput:
            if fromUI:
                return outRasterLayers_std, outLayerNames_std, ext, delRaster
            else:
                return outRasterLayers_std + outRasterLayers, outLayerNames_std + outLayerNames, ext, delRaster
        else:
            return outRasterLayers, outLayerNames, ext, delRaster

    @staticmethod
    def getTempCoefLayerPath():
        tempFolder = TEMPFILE.gettempdir()
        return OS.path.join(tempFolder, "SS_MGWR_Cofficient_Temp_Layer.lyrx")

    @staticmethod
    def getTempCoefLayerPathSmallRange():
        tempFolder = TEMPFILE.gettempdir()
        return OS.path.join(tempFolder, "SS_MGWR_Cofficient_Temp_Layer_SR.lyrx")

    @staticmethod
    def getTempSigLayerPath():
        tempFolder = TEMPFILE.gettempdir()
        return OS.path.join(tempFolder, "SS_MGWR_Significant_Temp_Layer.lyrx")

    def __init__(self, ssdo, depVarName, indVarNames,
                 numNeighborsCollection=None, distanceCollection=None,
                 numNeighborsRanges=None, distanceRanges=None, userDistUnit=None,
                 kernel="BISQUARE", family="GAUSSIAN", silentMessages=False, interceptBW=None,
                 calLocalCondNums=DO_LOCALCOND_NUMS_CAL, standarizeInput=True, solveMethod="BACK-FITTING"):

        #### check if MGWR is supported for current shipset ####
        if not hasattr(ARC._ss, "MGWR"):
            ARCPY.AddIDMessage("ERROR", 110472)
            raise SystemExit()
        self.ssdo = ssdo
        self.depVarName = depVarName
        self.indVarNames = indVarNames
        self.kernel = kernel
        self.silentMessages = silentMessages
        self.userDistUnit = None
        if userDistUnit:
            self.userDistUnit = userDistUnit.upper()
        else:
            # use the input data's default unit as the unit. Then the distance convert factor will be 1.0
            self.userDistUnit = self.ssdo.distanceInfo.name.upper()
        if self.userDistUnit.upper() == "UNKNOWN":
            self.userDistUnitName = ""
        else:
            self.userDistUnitName = self.userDistUnit
            if self.userDistUnitName.lower() in UTILS.localizableUnit:
                self.userDistUnitName = UTILS.localizableUnit[self.userDistUnitName.lower()].replace("{0} ", "").replace("{0}", "")
        self.family = family
        self.interceptBW = interceptBW
        if self.interceptBW is not None:
            if isinstance(self.interceptBW, list):
                if len(self.interceptBW) == 0:
                    self.interceptBW = None
                elif len(self.interceptBW) == 1:
                    self.interceptBW = self.interceptBW[0]

        self.calLocalCondNums = calLocalCondNums
        self.standarizeInput = standarizeInput
        self.solveMethod = "BACK-FITTING"
        if solveMethod and solveMethod.upper() in SUPPORTED_SOLVE_METHOD:
            self.solveMethod = solveMethod.upper()
        self.polyCoef = None
        self.gradientBestResult = {
            "aicc": None,
            "bandwidth": None
        }

        #### Coincident Points Check####
        globalGWRCoincidentPointChecker(ssdo)

        #### Detect the search strategy ####
        self.searchMethod = None
        self.numNeighborsCollection = None
        self.distanceCollection = None
        self.numNeighborsRanges = None
        self.distanceRanges = None

        self.predSSDO = None
        """The ssdo used for prediction. Also indicate if the prediction is conducted"""

        if numNeighborsCollection is not None:
            if len(numNeighborsCollection) != len(self.indVarNames):
                raiseSearchParamError()
            self.numNeighborsCollection = numNeighborsCollection
            self.searchMethod = "FIXED_NEIGHBORS"
            for neighbors in numNeighborsCollection:
                if len(neighbors) > 1:
                    self.searchMethod = "MANUAL_NEIGHBORS"
                if len(neighbors) < 1:
                    raiseSearchParamError()
            if isinstance(self.interceptBW, list) and len(self.interceptBW) > 1:
                self.searchMethod = "MANUAL_NEIGHBORS"

        elif distanceCollection is not None:
            if len(distanceCollection) != len(self.indVarNames):
                raiseSearchParamError()
            self.distanceCollection = distanceCollection
            self.searchMethod = "FIXED_DISTANCES"
            for distances in distanceCollection:
                if len(distances) > 1:
                    self.searchMethod = "MANUAL_DISTANCES"
                if len(distances) < 1:
                    raiseSearchParamError()
            if isinstance(self.interceptBW, list) and len(self.interceptBW) > 1:
                self.searchMethod = "MANUAL_DISTANCES"

        elif numNeighborsRanges is not None:
            if len(numNeighborsRanges) != len(self.indVarNames):
                raiseSearchParamError()
            self.numNeighborsRanges = numNeighborsRanges
            self.searchMethod = "OPTIMAL_NEIGHBORS"
            for neighborRange in self.numNeighborsRanges:
                if len(neighborRange) != 2:
                    raiseSearchParamError()
            pass
        elif distanceRanges is not None:
            if len(distanceRanges) != len(self.indVarNames):
                raiseSearchParamError()
            self.distanceRanges = distanceRanges
            self.searchMethod = "OPTIMAL_DISTANCES"
            for distRange in self.distanceRanges:
                if len(distRange) != 2:
                    raiseSearchParamError()
            pass

        if self.searchMethod is None:
            #### Internal API error, should not be exposed to user. ####
            ARCPY.AddError("No bandwidth search method is provided.")
            raise SystemExit()

        if self.solveMethod != "BACK-FITTING" and self.searchMethod not in ["OPTIMAL_NEIGHBORS", "OPTIMAL_DISTANCES"]:
            #### Internal API error, should not be exposed to user. ####
            ARCPY.AddError(f"Current search method: {self.searchMethod} is not supported for current solve method: {self.solveMethod}! Unable to proceed.")
            raise SystemExit()

        self.fields2render_coef = []
        """Coefficience fields to render"""

        self.fields2render_sig = []
        """Significance fields to render"""

        self.fields2render_condNum = None
        """Condition number field to render"""

        self.out_indVarNames = []
        self.out_depVarName = None
        self.out_indVarAlias = []
        self.out_depVarAlias = None
        self.outputFC = ""

        self.__initialize()
        self.__calculate()

        if not self.mgwr.can_solve:
            return
        if ARCPY.env.isCancelled:
            raise SystemExit()
        self.report()

    def __initialize(self):
        #### Shorthand Attributes ####
        ssdo = self.ssdo

        self.searchByDist = self.searchMethod in ["FIXED_DISTANCES", "MANUAL_DISTANCES", "OPTIMAL_DISTANCES"]
        """If the search method is based on distance"""

        #### MasterField Can Not Be The Dependent Variable ####
        if ssdo.masterField == self.depVarName:
            ARCPY.AddIDMessage("ERROR", 945, ssdo.masterField,
                               ARCPY.GetIDMessage(84112))
            raise SystemExit()

        #### Remove the MasterField from Independent Vars ####
        if ssdo.masterField in self.indVarNames:
            self.indVarNames.remove(ssdo.masterField)
            ARCPY.AddIDMessage("WARNING", 736, ssdo.masterField)

        #### Remove the Dependent Variable from Independent Vars ####
        if self.depVarName in self.indVarNames:
            self.indVarNames.remove(self.depVarName)
            if not self.silentMessages:
                ARCPY.AddIDMessage("WARNING", 850, self.depVarName)

        #### Raise Error If No Independent Vars ####
        if not len(self.indVarNames):
            ARCPY.AddIDMessage("ERROR", 737)
            raise SystemExit()

        #### Create Dependent Variable ####
        self.allVars = [self.depVarName] + self.indVarNames
        yData = ssdo.fields[self.depVarName].returnDouble()

        #### Round Data and Check Negative ####
        if self.family == "LOGIT":
            yData = UTILS.createBinaryVariable(yData)
        if self.family == "POISSON":
            yData = UTILS.createCountVariable(yData)

        self.n = ssdo.numObs
        self.ids = NUM.arange(self.n, dtype = NUM.int32)
        self.y = NUM.empty(self.n, dtype = float)
        self.y[:] = yData
        self.mgwrGradientStage = 0

        #### Assure that Variance is Larger than Zero ####
        zeroVarFields = []
        yStd = NUM.std(self.y)
        self.depVar_std = 1.0
        self.depVar_mean = 0.0
        if NUM.isnan(yStd) or yStd <= 0.0:
            zeroVarFields.append(self.depVarName)
        else:
            if self.standarizeInput:
                self.depVar_std = yStd
                self.depVar_mean = NUM.mean(self.y)
                self.y = (self.y - self.depVar_mean) / yStd

        #### Create Design Matrix ####
        self.k = len(self.indVarNames) + 1
        """Number of independent variables plus one (intercept)"""
        self.indVar_stds = NUM.ones(len(self.indVarNames))
        self.indVar_means = NUM.zeros(len(self.indVarNames))

        """number of variables plus intercept"""

        self.x = NUM.ones((self.n, self.k), dtype=float)
        for column, variable in enumerate(self.indVarNames):
            varData = ssdo.fields[variable].data
            xStd = NUM.std(varData)
            if NUM.isnan(xStd) or xStd <= 0.0:
                zeroVarFields.append(variable)
            else:
                if self.standarizeInput:
                    self.indVar_stds[column] = xStd
                    xMean = NUM.mean(varData)
                    self.indVar_means[column] = xMean
                    self.x[:, column + 1] = (varData - xMean) / xStd
                else:
                    self.x[:, column + 1] = varData

        #### Error for Constant Fields ####
        if len(zeroVarFields):
            zeroNames = ", ".join(zeroVarFields)
            ARCPY.AddIDMessage("ERROR", 1588, zeroNames)
            raise SystemExit()

        ##### Check for Near Perfect Global Multicollinearity ####
        xx = NUM.dot(self.x.T, self.x)
        try:
            xxi = LA.inv(xx)
        except:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        #### 2nd CPP Check ####
        can_invert = ARC._ss.global_invert_check(self.x)
        if not can_invert:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        self.distanceUnitConvertFactor = 1.0
        if self.searchByDist:
            inputDistUnit = self.ssdo.distanceInfo.name
            inputDistFactor = UTILS.distanceUnitInfo[inputDistUnit][1]
            userDistFactor = UTILS.distanceUnitInfo[self.userDistUnit][1]
            if userDistFactor != inputDistFactor:
                self.distanceUnitConvertFactor = userDistFactor/inputDistFactor

        if ssdo.useChordal:
            self.coords = ssdo.spheroidCoords
        else:
            self.coords = ssdo.xyCoords

        #### Standaridize the coordinates here for gradient method ####
        if self.solveMethod == "GRADIENT":
            dimension = self.coords.shape[1]
            self.coords_scaled = self.coords.copy()
            self.coords_stdMax = 0
            self.coords_means = NUM.zeros(dimension)
            for column in range(dimension):
                xStd = self.coords[:, column].std()
                xMean = self.coords[:, column].mean()
                self.coords_means[column] = xMean
                self.coords_scaled[:, column] -= xMean
                if xStd > self.coords_stdMax:
                    self.coords_stdMax = xStd
            self.coords_scaled /= self.coords_stdMax
        else:
            self.coords_stdMax = 1.0

        #### reshape the search creteria ####
        #### convert distance if necessary ####
        if self.searchByDist:
            self.globalPossibleMinBD, self.globalPossibleMaxBD = self.__getMinMaxDistanceRange()
        else:
            self.globalPossibleMinBD, self.globalPossibleMaxBD = self.__getMinMaxNumNeighborRange()

        self.validSearchRangeNeigh = None
        self.validSearchRangeDist = None
        self.validSearchRangeId = None

        if self.searchMethod == "FIXED_NEIGHBORS":
            neighborNums = []
            for nn in self.numNeighborsCollection:
                self.__checkSearchBandwidth(nn[0])
                neighborNums.append(nn[0])
            neighborNums.insert(0, self.interceptBW)
            self.validSearchRangeNeigh = NUM.array(neighborNums, dtype=NUM.int64)
        elif self.searchMethod == "MANUAL_NEIGHBORS":
            neighborNums = []
            startInd = []
            for nn in self.numNeighborsCollection:
                startInd.append(len(neighborNums))
                neighborNums += nn
            nn0 = list(set(neighborNums)) # use the union of other variables' neighbor # for intercept
            nn0.sort()
            self.__checkSearchBandwidth(nn0[0])
            self.__checkSearchBandwidth(nn0[-1])
            neighborNums = nn0 + neighborNums
            startInd = [0] + [i + len(nn0) for i in startInd]
            self.validSearchRangeNeigh = NUM.array(neighborNums, dtype=NUM.int64)
            self.validSearchRangeId = NUM.array(startInd, dtype=NUM.int64)
        elif self.searchMethod == "OPTIMAL_NEIGHBORS":
            neighborNums = []
            globalMinNeighboeNum = self.globalPossibleMinBD
            globalMaxNeighboeNum = self.globalPossibleMaxBD
            for nn in self.numNeighborsRanges:
                if nn[0] <= 0:
                    nn[0] = globalMinNeighboeNum
                if nn[1] <= 0:
                    nn[1] = globalMaxNeighboeNum
                if nn[0] > nn[1]:
                    ARCPY.AddIDMessage("ERROR", 110223)
                    raise SystemExit()
                neighborNums += nn
            neighborNums = [min(neighborNums), max(neighborNums)] + neighborNums
            self.__checkSearchBandwidth(min(neighborNums))
            self.__checkSearchBandwidth(max(neighborNums))
            self.validSearchRangeNeigh = NUM.array(neighborNums, dtype=NUM.int64)
        elif self.searchMethod == "FIXED_DISTANCES":
            distances = []
            for dd in self.distanceCollection:
                distances.append(dd[0])
                self.__checkSearchBandwidth(dd[0])
            distances.insert(0, self.interceptBW)
            self.validSearchRangeDist = NUM.array(distances, dtype=NUM.double)
        elif self.searchMethod == "MANUAL_DISTANCES":
            distances = []
            startInd = []
            for dd in self.distanceCollection:
                startInd.append(len(distances))
                distances += dd
            dd0 = list(set(distances)) # use the union of other variables' distances for intercept
            dd0.sort()
            self.__checkSearchBandwidth(dd0[0])
            self.__checkSearchBandwidth(dd0[-1])
            distances = dd0 + distances
            startInd = [0] + [i+len(dd0) for i in startInd]
            self.validSearchRangeDist = NUM.array(distances, dtype=NUM.double)
            self.validSearchRangeId = NUM.array(startInd, dtype=NUM.int64)
        elif self.searchMethod == "OPTIMAL_DISTANCES":
            distances = []
            globalMinDist = self.globalPossibleMinBD
            globalMaxDist = self.globalPossibleMaxBD
            for dd in self.distanceRanges:
                if dd[0] == -9999:
                    dd[0] = globalMinDist
                if dd[1] == -9999:
                    dd[1] = globalMaxDist
                distances += dd
                self.__checkSearchBandwidth(min(distances))
                self.__checkSearchBandwidth(max(distances))
                if dd[0] > dd[1]:
                    ARCPY.AddIDMessage("ERROR", 110224)
                    raise SystemExit()
            distances = [min(distances), max(distances)] + distances
            self.validSearchRangeDist = NUM.array(distances, dtype=NUM.double)

        if self.searchByDist:
            self.validSearchRangeDist *= self.distanceUnitConvertFactor
            if self.solveMethod == "GRADIENT":
                self.validSearchRangeDistScaled = self.validSearchRangeDist / self.coords_stdMax

        if self.solveMethod == "GRADIENT" and not self.searchByDist:
            KNNLowerBoundary = max(self.globalPossibleMinBD, NUM.min(self.validSearchRangeNeigh))
            self.polyCoef = self.__cal_poly_dist_function(KNNLowerBoundary)

    def __checkSearchBandwidth(self, bandwidth):
        """
        Check if the search bandwidth is within the possible min/max gloable range.
        If not, throw the error message and exit
        :param bandwidth:
        :return:
        """

        if self.searchByDist:
            distRange = [round(self.globalPossibleMinBD, 2), round(self.globalPossibleMaxBD, 2)]
            if bandwidth < distRange[0] or bandwidth > distRange[1]:
                ARCPY.AddIDMessage("ERROR", 110469,
                                   UTILS.formatValue(distRange[0], "%.2f"),
                                   "{0} {1}".format(UTILS.formatValue(distRange[1], "%.2f"), self.userDistUnitName))
                raise SystemExit
        else:
            if bandwidth < self.globalPossibleMinBD or bandwidth > self.globalPossibleMaxBD:
                ARCPY.AddIDMessage("ERROR", 110470,
                                   self.globalPossibleMinBD,
                                   self.globalPossibleMaxBD)
                raise SystemExit

    def __getMinMaxDistanceRange(self):
        """
        Get Default Min/Max Search Distances based on KNN.
        The unit of returned distances are consistent with user provided unit
        """

        #### Set Progressor ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84426), 0,
                            self.ssdo.numObs, 1)

        #### Set Minimum/Maximum KNN ####
        minKNN = self.k + 1
        if self.n < minKNN:
            ARCPY.AddIDMessage("ERROR", 110265)
            raise SystemExit()
        if self.n <= 60:
            minKNN = max(5, minKNN)
        else:
            minKNN = max(30, minKNN)

        #### Keep Track of Min/Max Distances ####
        minDist = 0.0
        if self.ssdo.useChordal:
            XMin = self.coords[:, 0].min()
            XMax = self.coords[:, 0].max()
            YMin = self.coords[:, 1].min()
            YMax = self.coords[:, 1].max()
            ZMin = self.coords[:, 2].min()
            ZMax = self.coords[:, 2].max()
            maxDist = ((XMin - XMax) ** 2 + (YMin - YMax) ** 2 + (ZMin - ZMax) ** 2) ** 0.5
        else:
            ext = self.ssdo.extent
            maxDist = ((ext.XMin - ext.XMax) ** 2 + (ext.YMin - ext.YMax) ** 2) ** 0.5
        if self.solveMethod == "GRADIENT":
            maxDist *= 2.2
        kdTree = SCPS.cKDTree(self.coords)
        for coordinates in self.coords:
            info = kdTree.query(coordinates, k = minKNN, p = 2)
            distances = info[0]
            if distances[-1] > minDist:
                minDist = distances[-1]
            #### Reset Progessor ####
            ARCPY.SetProgressorPosition()

        return round(minDist / self.distanceUnitConvertFactor, 2), round(maxDist /self.distanceUnitConvertFactor, 2)

    def __getMinMaxNumNeighborRange(self):
        if self.n > 60:
            floor = 30
        else:
            floor = 5
        return max(self.k + 1, floor), self.n


    def __calculate(self):
        self.numThreads = UTILS.getNumberOfThreadsDefault()
        validSearchRangeDist = self.validSearchRangeDist
        if self.solveMethod == "GRADIENT":
            coords = self.coords_scaled
            if self.searchByDist:
                validSearchRangeDist = self.validSearchRangeDistScaled
        else:
            coords = self.coords

        iter_mgwr = MAX_ITER_GRADIENT if self.solveMethod == "GRADIENT" else MAX_ITER_MGWR

        self.mgwr = ARC._ss.MGWR(self.y, self.x, coords, self.searchMethod, self.kernel,
                                 search_range_neighbors=self.validSearchRangeNeigh,
                                 search_range_distances=validSearchRangeDist,
                                 search_range_start_ids=self.validSearchRangeId,
                                 num_threads=self.numThreads,
                                 max_iter_gwr=MAX_ITER_GWR, max_iter_mgwr=iter_mgwr,
                                 max_iter_var=MAX_ITER_VAR, aicc_equal_criteria=AICC_EQUAL_CRITERIA,
                                 diagnostic_method=DIAGNOSTIC_CALCULATION_METHOD,
                                 do_local_cond_nums=1 if self.calLocalCondNums else 0,
                                 memory_usage_limitation=MEMORY_USAGE_LIMITATION)
        if self.solveMethod == "GRADIENT":
            result = self.__calculateGradient()
        else:  # the back-fitting method
            result = self.mgwr.calculate()

        if result == 3:
            ARCPY.AddIDMessage("ERROR", 952, "MGWR")
            raise SystemExit()
        elif not result:
            raise SystemExit()

        if ARCPY.env.isCancelled:
            raise SystemExit()

        initModelType = {
            0: "NONE",
            1: "GWR",
            2: "OLS"
        }

        self.initModelType = initModelType[self.mgwr.init_model_statistics["type"]]
        """The string model type if global init model, within ["NONE", "GWR", "OLS"]"""

        self.hasInitModel = self.initModelType != "NONE"
        if self.initModelType == "OLS":
            ARCPY.AddIDMessage("WARNING", 110471)
        self.__validateStatiticResults()

    def __calculateGradient(self):
        init_bandwidth = self.mgwr.gradient_init(gwr_init=True, learning_rate=1.0, poly_coefs=self.polyCoef)
        if init_bandwidth is None:
            raise SystemExit()

        if GRADIENTS_METHOD == "NEWTON":
            result = self.mgwr.gradient_newton_calculate()
            if not result:
                raise SystemExit()
        else:  #"TRUST-CONSTR"
            jac = True
            display_res = False
            options = {"disp": display_res, "maxiter": MAX_ITER_GRADIENT}
            if display_res:
                options["verbose"] = 2

            if self.searchByDist:
                options["gtol"] = 1e-4
                b = self.validSearchRangeDistScaled
            else:
                options["gtol"] = 1e-2
                b = self.validSearchRangeNeigh
            bounds = [(b[ind * 2], b[ind * 2 + 1]) for ind in range(self.k)]
            self.mgwrGradientStage = 1
            md = OPTIMIZE.minimize(self.__calculate_gradient_core, x0=init_bandwidth,
                              bounds=bounds, jac=jac, method=GRADIENTS_METHOD.lower(),
                              options=options)

            if self.mgwrGradientStage >= MAX_ITER_GRADIENT:
                ARCPY.AddIDMessage("WARNING", 110252)
            if self.searchByDist:
                x_int = NUM.array(self.gradientBestResult["bandwidth"], dtype=float)
            else:
                x_int = NUM.array([int(x) for x in self.gradientBestResult["bandwidth"]], dtype=float)
            self.__calculate_gradient_core(x_int, False)
            self.__calculate_gradient_core(x_int, True)
        ARCPY.ResetProgressor()
        return 1

    def __calculate_gradient_core(self, bandwidth, diagnose=False):
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220504) % self.mgwrGradientStage)
        self.mgwrGradientStage += 1
        result = self.mgwr.gradient_rerun_core(bw_array=bandwidth, diagnose=diagnose)
        if result is None:
            raise SystemExit()
        else:
            if self.gradientBestResult["aicc"] is None or self.gradientBestResult["aicc"] > result["aicc"]:
                self.gradientBestResult["aicc"] = result["aicc"]
                self.gradientBestResult["bandwidth"] = bandwidth
            return result["aicc"], result["diff_aicc"]

    def __validateStatiticResults(self):
        """
        After the calculation is finished, do some post calculation,
        then validate the results again and throw error if detect any.
        """

        dof = self.n - self.mgwr.enp
        self.adj_alphas = 0.05 / self.mgwr.enps_array
        self.t_critical = TSTATS.ppf(1 - self.adj_alphas / 2, dof)
        self.num_significant_coefs_array = NUM.zeros(self.k)
        for var_ind in range(self.k):
            c_T = self.mgwr.coef[:, var_ind] / NUM.sqrt(self.mgwr.var_coef[:, var_ind])
            self.num_significant_coefs_array[var_ind] = len(NUM.where(NUM.abs(c_T) >= self.t_critical[var_ind])[0])

        #### Find the index of iteration that prAoduces the lowest global aicc
        self.lowest_aicc_ind = 0
        for ind, aicc in enumerate(self.mgwr.optimal_hist_aicc_global_array):
            if aicc < self.mgwr.optimal_hist_aicc_global_array[self.lowest_aicc_ind]:
                self.lowest_aicc_ind =  ind

        if self.initModelType == "GWR":
            #### Global Stat Warning ####
            globalFlag = self.mgwr.init_model_statistics["adj_r2"] == 1 or self.mgwr.init_model_statistics["adj_r2"] < 0

            #### Check Local PDev ####
            localFlag = self.__warnVectorValues(self.mgwr.local_R2)

            #### Warn for Poor Values ####
            if globalFlag or localFlag:
                ARCPY.AddIDMessage("WARNING", 110259)

    def __warnVectorValues(self, values):
        nanVals = NUM.isnan(values)
        warnFlag = nanVals.sum() != 0

        #### Check Negative Values ####
        if not warnFlag:
            warnFlag = (values < 0).sum() != 0

            #### Check Perfect Prediction ####
            if not warnFlag:
                warnFlag = (values == 1).sum() != 0

        return warnFlag

    def __reverseStandarize(self):
        rawX = NUM.ones((self.n, self.k), dtype=float)
        for column, variable in enumerate(self.indVarNames):
            rawX[:, column+1] = self.ssdo.fields[variable].data

        self.rawCoef = self.mgwr.coef.copy()
        self.rawPred = NUM.zeros(self.n, dtype=float)
        for ind in range(1, self.k):
            self.rawCoef[:, ind] *= (self.depVar_std / self.indVar_stds[ind - 1])

        for i in range(self.n):
            self.rawCoef[i, 0] = self.rawCoef[i, 0] * self.depVar_std + self.depVar_mean - NUM.dot(self.indVar_means, self.rawCoef[i, 1:])
            self.rawPred[i] = NUM.dot(rawX[i], self.rawCoef[i])

        # self.rawPred = self.mgwr.y_hat * self.depVar_std + self.depVar_mean

    def __reverseStandarizePrediction(self, predStdCoef, predRawX):
        predRevCoef = predStdCoef.copy()
        N = predStdCoef.shape[0]

        if predRawX is not None:
            for ind in range(1, self.k):
                predRevCoef[:, ind] *= (self.depVar_std / self.indVar_stds[ind - 1])
            predRawPred = NUM.zeros(N, dtype=float)
            for i in range(N):
                predRevCoef[i, 0] = predRevCoef[i, 0] * self.depVar_std + self.depVar_mean - NUM.dot(self.indVar_means, predRevCoef[i, 1:])
                predRawPred[i] = NUM.dot(predRawX[i], predRevCoef[i])
            return predRevCoef, predRawPred
        else:
            for ind in range(1, self.k):
                mask = NUM.where(predRevCoef[:, ind] != -9999.0)
                predRevCoef[:, ind][mask] *= (self.depVar_std / self.indVar_stds[ind - 1])
            for i in range(N):
                if -9999.0 in predRevCoef[i, 1:]:
                    predRevCoef[i, 0] = -9999.0
                else:
                    predRevCoef[i, 0] = predRevCoef[i, 0] * self.depVar_std + self.depVar_mean - NUM.dot(self.indVar_means, predRevCoef[i, 1:])
            return predRevCoef

    def createMGWROutputFC(self, outputFC):
        ARCPY.env.overwriteOutput = True

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)
        self.outputFC = outputFC

        #### Create/Populate Dictionary of Candidate Fields ####
        fieldOrder = []
        candidateFields = {}

        #### Add the input fields one by one since they are standardized ####
        appendFields = [self.depVarName] + self.indVarNames
        if self.standarizeInput:
            appendFields = [gwrVarScaledName.format(v) for v in appendFields]
        # appendFieldsValid = UTILS.createAppendFieldNames(appendFields, outPath)

        if self.standarizeInput:
            coefFN = gwrCoefFieldScaledName
            coefFA = gwrCoefFieldScaledAlias

            seFN = gwrSEFieldScaledName
            seFA = gwrSEFieldScaledAlias

            ttFN = gwrTTestFieldScaledName
            ttFA = gwrTTestFieldScaledAlias

            sigFN = gwrSigFieldScaledName
            sigFA = gwrSigFieldScaledAlias

            predFN = gwrPredFieldScaledName
            predFA = gwrPredFieldScaledAlias

            FCFN = gwrFCFieldScaledNames
            FCFA = gwrFCFieldScaledAlias

        else:
            coefFN = gwrCoefFieldName
            coefFA = gwrCoefFieldAlias

            seFN = gwrSEFieldName
            seFA = gwrSEFieldAlias

            ttFN = gwrTTestFieldName
            ttFA = gwrTTestFieldAlias

            sigFN = gwrSigFieldName
            sigFA = gwrSigFieldAlias

            predFN = gwrPredFieldName
            predFA = gwrPredFieldAlias

            FCFN = gwrFCFieldNames
            FCFA = gwrFCFieldAlias

        #### Start With Coefficients, SEs and pseudo-T values for the intercept ####
        appendFields.append(coefFN.format(gwrInterceptName))
        appendFields.append(seFN.format(gwrInterceptName))
        appendFields.append(ttFN.format(gwrInterceptName))
        appendFields.append(sigFN.format(gwrInterceptName))

        # indVarOut = []
        for varName in self.indVarNames:
            appendFields.append(coefFN.format(varName))
            appendFields.append(seFN.format(varName))
            appendFields.append(ttFN.format(varName))
            appendFields.append(sigFN.format(varName))

        appendFields.append(predFN)

        if self.standarizeInput:
            self.__reverseStandarize()
            appendFields.append(gwrPredFieldName)
            for varName in [gwrInterceptName] + self.indVarNames:
                appendFields.append(gwrCoefFieldReversedName.format(varName))

        appendFields += FCFN

        if self.initModelType == "GWR":
            appendFields.append(gwrLocalR2Name)

        if self.calLocalCondNums:
            appendFields.append(gwrLocalCondNumsName)

        indVarOut = UTILS.createAppendFieldNames(appendFields, outPath)

        c = 0
        for ind, varName in enumerate([self.depVarName] + self.indVarNames):
            varNameValid = indVarOut[ind]
            if ind == 0:
                data = self.y
            else:
                data = self.x[:, ind].copy()

            if self.standarizeInput:
                outAlias = gwrVarScaledAlias.format(self.ssdo.fields[varName].alias)
                candidateField = SSDO.CandidateField(varNameValid, "DOUBLE", data,
                                                     alias=outAlias)
            else:
                outAlias = self.ssdo.fields[varName].alias
                candidateField = SSDO.CandidateField(varNameValid, "DOUBLE", data,
                                                     alias=outAlias)

            if ind == 0:
                self.out_depVarName = varNameValid
                self.out_depVarAlias = outAlias
            else:
                self.out_indVarNames.append(varNameValid)
                self.out_indVarAlias.append(outAlias)

            candidateFields[varNameValid] = candidateField
            fieldOrder.append(varNameValid)
            c += 1

        coefInterceptName = indVarOut[c]
        c += 1
        coefInterceptAlias = coefFA.format(gwrInterceptAlias)
        candidateField = SSDO.CandidateField(coefInterceptName, "DOUBLE", self.mgwr.coef[:, 0],
                                             alias=coefInterceptAlias)
        candidateFields[coefInterceptName] = candidateField
        fieldOrder.append(coefInterceptName)

        seInterceptName = indVarOut[c]
        c += 1
        seInterceptAlias = seFA.format(gwrInterceptAlias)
        candidateField = SSDO.CandidateField(seInterceptName, "DOUBLE", NUM.sqrt(self.mgwr.var_coef[:, 0]),
                                             alias=seInterceptAlias)
        candidateFields[seInterceptName] = candidateField
        fieldOrder.append(seInterceptName)

        c_TInterC = self.mgwr.coef[:, 0] / NUM.sqrt(self.mgwr.var_coef[:, 0])
        ttInterceptName = indVarOut[c]
        c += 1
        ttInterceptAlias = ttFA.format(gwrInterceptAlias)
        candidateField = SSDO.CandidateField(ttInterceptName, "DOUBLE",
                                             c_TInterC,
                                             alias=ttInterceptAlias)
        candidateFields[ttInterceptName] = candidateField
        fieldOrder.append(ttInterceptName)

        sig_Inter = NUM.zeros(self.n, int)
        sig_Inter[NUM.where(NUM.abs(c_TInterC) >= self.t_critical[0])] = 1
        sigInterceptName = indVarOut[c]
        c += 1
        sigInterceptAlias = sigFA.format(gwrInterceptAlias)
        candidateField = SSDO.CandidateField(sigInterceptName, "SHORT",
                                             sig_Inter,
                                             alias=sigInterceptAlias)
        candidateFields[sigInterceptName] = candidateField
        fieldOrder.append(sigInterceptName)

        for varInd, varName in enumerate(self.indVarNames):
            #### Add Coefficient ####
            fieldName = indVarOut[c]
            coefData = self.mgwr.coef[:, varInd + 1]
            alias = coefFA.format(self.ssdo.fields[varName].alias)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", coefData,
                                                 alias=alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            #### Append the fields for later rendering ####
            self.fields2render_coef.append((
                fieldName,
                alias,
                self.mgwr.coef[:, varInd + 1].max()-self.mgwr.coef[:, varInd + 1].min(),
                self.mgwr.coef[:, varInd + 1].min()))
            c += 1

            #### Add SE ####
            fieldName = indVarOut[c]
            seData = NUM.sqrt(self.mgwr.var_coef[:, varInd + 1])
            alias = seFA.format(self.ssdo.fields[varName].alias)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", seData,
                                                 alias=alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c += 1

            #### Add T-Stats ####
            fieldName = indVarOut[c]
            alias = ttFA.format(self.ssdo.fields[varName].alias)
            ttData = NUM.where(seData==0, UTILS.shpFileNull["DOUBLE"], coefData / seData)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", ttData,
                                                 alias=alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c += 1

            #### Add Significance ####
            fieldName = indVarOut[c]
            alias = sigFA.format(self.ssdo.fields[varName].alias)
            sigData = NUM.zeros(self.n, int)
            sigData[NUM.where(NUM.abs(ttData) >= self.t_critical[varInd + 1])] = 1
            candidateField = SSDO.CandidateField(fieldName, "SHORT", sigData,
                                                 alias=alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            #### Append the fields for later rendering ####
            self.fields2render_sig.append((fieldName, alias))
            c += 1

        self.fields2render_coef.append((
            coefInterceptName,
            coefInterceptAlias,
            self.mgwr.coef[:, 0].max()-self.mgwr.coef[:, 0].min(),
            self.mgwr.coef[:, 0].min()))
        self.fields2render_sig.append((sigInterceptName, sigInterceptAlias))

        #### Add Prediction Field ####
        predFieldName = indVarOut[c]
        alias = predFA.format(self.ssdo.fields[self.depVarName].alias)
        candidateField = SSDO.CandidateField(predFieldName, "DOUBLE",
                                             self.mgwr.y_hat.ravel(),
                                             alias=alias)
        candidateFields[predFieldName] = candidateField
        fieldOrder.append(predFieldName)
        c += 1

        #### Add reverse standarized values ####
        if self.standarizeInput:
            fieldName = indVarOut[c]
            fieldData = self.rawPred
            fieldAlias = gwrPredFieldAlias.format(self.ssdo.fields[self.depVarName].alias)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE",
                                                 fieldData,
                                                 alias=fieldAlias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c += 1

            for ind, varName in enumerate([gwrInterceptName] + self.indVarNames):
                fieldName = indVarOut[c]
                fieldData = self.rawCoef[:, ind]
                if ind == 0:
                    fieldAlias = gwrCoefFieldReversedAlias.format(gwrInterceptAlias)
                else:
                    fieldAlias = gwrCoefFieldReversedAlias.format(self.ssdo.fields[varName].alias)
                candidateField = SSDO.CandidateField(fieldName, "DOUBLE",
                                                     fieldData,
                                                     alias=fieldAlias)
                candidateFields[fieldName] = candidateField
                fieldOrder.append(fieldName)
                c += 1

        #### Other Summary Vectors ####
        fieldData = [self.mgwr.residuals.ravel(), self.mgwr.std_residuals.ravel(),
                     self.mgwr.influence.ravel(), self.mgwr.cooks_d.ravel()]

        for varInd in range(len(FCFN)):
            alias = FCFA[varInd]
            varName = indVarOut[c]
            c += 1
            candidateField = SSDO.CandidateField(varName, "DOUBLE",
                                                 fieldData[varInd],
                                                 alias=alias)
            candidateFields[varName] = candidateField
            fieldOrder.append(varName)

        if self.initModelType == "GWR":
            varName = indVarOut[c]
            c += 1
            candidateField = SSDO.CandidateField(varName, "DOUBLE",
                                                 self.mgwr.local_R2.ravel(),
                                                 alias=gwrLocalR2Alias)
            candidateFields[varName] = candidateField
            fieldOrder.append(varName)

        if self.calLocalCondNums:
            varName = indVarOut[c]
            c += 1
            local_cond_nums = self.mgwr.local_cond_nums.ravel()
            candidateField = SSDO.CandidateField(varName, "DOUBLE",
                                                 self.mgwr.local_cond_nums.ravel(),
                                                 alias=gwrLocalCondNumsAlias)
            candidateFields[varName] = candidateField
            fieldOrder.append(varName)
            self.fields2render_condNum = (varName, gwrLocalCondNumsAlias)

        #### Write Data to Output Feature Class ####
        self.ssdo.output2NewFC(outputFC, candidateFields, fieldOrder=fieldOrder)

    def buildOutputGroupLayer(self, outputFC):
        """
        Build the grouplayer which contains multiple symbologies for the result output featureclass
        Parameters
        ----------
        outputFC        : str
                          path to the output featureclass
        Returns
        -------

        """
        tempCoefLayerPath = MGWR.getTempCoefLayerPath()
        tempSigLayerPath = MGWR.getTempSigLayerPath()
        tempCoefLayerPathSmallRange = None
        smallRangeThreshold = 0.0006

        if self.ssdo.shapeType.upper() == "POINT":
            if self.standarizeInput:
                layerFile_coef = "MGWR_Cofficient_Points.lyrx"
            else:
                layerFile_coef = OS.path.join(UTILS.pathLayers, "MGWR_Cofficient_Points_Uni.lyrx")
            layerFile_sig_base = "MGWR_Significance_Points.lyrx"
        else:
            if self.standarizeInput:
                layerFile_coef = "MGWR_Cofficient_Polygons.lyrx"
            else:
                layerFile_coef = OS.path.join(UTILS.pathLayers, "MGWR_Cofficient_Polygons_Uni.lyrx")

            layerFile_sig_base = "MGWR_Significance_Polygons.lyrx"

        UTILS.buildLocaleCIMLayer(layerFile_sig_base, -1, data={}, outPath=tempSigLayerPath)

        layers = []
        if self.standarizeInput:
            updateStrategy = "MAINTAIN"
            coefMinBreak = min([ele[3] for ele in self.fields2render_coef]) -1
            UTILS.buildLocaleCIMLayer(layerFile_coef, -1,
                                      data={"minimumBreak": coefMinBreak}, outPath=tempCoefLayerPath)
        else:
            updateStrategy = "UPDATE"
            tempCoefLayerPath = layerFile_coef
            smallRangeLayers = NUM.zeros(len(self.fields2render_coef), dtype=int)
            for ind, ele in enumerate(self.fields2render_coef):
                if ele[2] <= smallRangeThreshold:
                    smallRangeLayers[ind] = 1
            if NUM.any(smallRangeLayers):
                tempCoefLayerPathSmallRange = MGWR.getTempCoefLayerPathSmallRange()
                if self.ssdo.shapeType.upper() == "POINT":
                    lcf = "MGWR_Cofficient_Points_Uni.lyrx"
                else:
                    lcf = "MGWR_Cofficient_Polygons_Uni.lyrx"
                UTILS.buildLocaleCIMLayer(
                    lcf,
                    -1,
                    data={
                        "roundingOption": "esriRoundNumberOfSignificantDigits",
                        "roundingValue": 2 },
                    outPath=tempCoefLayerPathSmallRange)


        for ind in range(len(self.fields2render_coef)):
            layer_sig = ARCPY.management.MakeFeatureLayer(outputFC, self.fields2render_sig[ind][1])
            layer_sig = ARCPY.management.ApplySymbologyFromLayer(layer_sig, tempSigLayerPath, f"VALUE_FIELD SG_INTRCPT {self.fields2render_sig[ind][0]}", "MAINTAIN")
            layers.append(layer_sig)

            lp = tempCoefLayerPath
            if tempCoefLayerPathSmallRange is not None and self.fields2render_coef[ind][2] <= smallRangeThreshold:
                lp = tempCoefLayerPathSmallRange
            layer_coef = ARCPY.management.MakeFeatureLayer(outputFC, self.fields2render_coef[ind][1])
            layer_coef = ARCPY.management.ApplySymbologyFromLayer(layer_coef, lp, f"VALUE_FIELD C_INTRCPT {self.fields2render_coef[ind][0]}", updateStrategy)
            layers.append(layer_coef)

        glName = OS.path.basename(outputFC)
        if glName.lower().endswith(".shp"):
            glName = glName[: -4]
        if glName.upper().endswith("_MGWR"):
            glName = glName[: -5]
        glName += "_MGWR_Results"
        try:
            groupLayerResult = ARCPY.gp.MakeGroupLayer(glName, layers)
            group_layer = groupLayerResult.getOutput(0)
            if OS.path.exists(tempSigLayerPath):
                OS.remove(tempSigLayerPath)
            if self.standarizeInput:
                if OS.path.exists(tempCoefLayerPath):
                    OS.remove(tempCoefLayerPath)
            return group_layer
        except:
            return None

    def createVariableStatTable(self, outTable):
        if not outTable:
            return

        ARCPY.env.overwriteOutput = True

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outTable)

        #### Prepare Derived Variables for Output Feature Class ####
        fieldsInfo = [
            ("VAR_NAME", "TEXT", "Explanatory Variable Name"),
            ("VAR_ALIAS", "TEXT", "Explanatory Variable Alias"),
            ("SIG_COUNT", "LONG", "Significant Features Count"),
            ("SIG_PCT", "DOUBLE", "Significant Features Percent"),
            ("NBR_COUNT", "LONG", "Number of Neighbors"),
            ("NBR_PCT", "DOUBLE", "Number of Neighbors as Percentage"),
            ("C_MEAN", "DOUBLE", "Coefficient Mean"),
            ("C_STD", "DOUBLE", "Coefficient Std. Dev."),
            ("C_MIN", "DOUBLE", "Coefficient Min"),
            ("C_MAX", "DOUBLE", "Coefficient Max"),
            ("C_MEDIAN", "DOUBLE", "Coefficient Median"),
        ]
        if self.searchByDist:
            fieldsInfo[4] = ("DISTANCE", "DOUBLE", f"Distance ({self.userDistUnitName})")
            fieldsInfo[5] = ("DIST_PCT", "DOUBLE", "Distance as Percentage")
            bds = self.__reverseSearchDist(self.mgwr.distances_array) / self.distanceUnitConvertFactor
            denom = self.globalPossibleMaxBD
            chartYAxis = "DISTANCE"
            chartYLabel = ARCPY.GetIDMessage(84077).format(self.userDistUnitName)
        else:
            bds = self.mgwr.num_neighs_array
            denom = float(self.n)
            chartYAxis = "NBR_COUNT"
            chartYLabel = ARCPY.GetIDMessage(84362)

        inputData = []
        vars = [gwrInterceptName] + self.indVarNames
        for var_ind, varName in enumerate(vars):
            row = [varName]
            if var_ind == 0:
                row.append(gwrInterceptAlias)
            else:
                row.append(self.ssdo.fields[varName].alias)
            data = self.mgwr.coef[:, var_ind]
            row += [self.num_significant_coefs_array[var_ind],
                    self.num_significant_coefs_array[var_ind] / float(self.n) * 100.0]
            featurePercentage = bds[var_ind] / denom * 100
            if featurePercentage > 100:
                featurePercentage = 100
            row += [bds[var_ind], featurePercentage]
            row += [NUM.mean(data), NUM.std(data), NUM.min(data), NUM.max(data), NUM.median(data)]
            inputData.append(row)

        inputFields = [info[0] for info in fieldsInfo]
        inTypes = [info[1] for info in fieldsInfo]
        inputAliases = [info[2] for info in fieldsInfo]
        UTILS.createOutputTable(outTable, inputFields,
                                inTypes, inputData, aliases=inputAliases)

        chartTitle = ARCPY.GetIDMessage(220617)
        barChart = ARCPY.Chart(chartTitle)
        barChart.type = "bar"
        barChart.title = chartTitle
        barChart.xAxis.field = "VAR_ALIAS"
        barChart.xAxis.title = ARCPY.GetIDMessage(84402)
        barChart.yAxis.field = chartYAxis
        barChart.yAxis.title = chartYLabel
        # barChart.xAxis.sort = "asc"
        # barChart.bar.aggregation = "COUNT"
        # barChart.bar.splitCategory = depVarOutName
        return [barChart]

    def __buildDecStr(self, val, tarDec, minDec):
        return UTILS.formatValue(val, UTILS.getPerfectFormatDecimal(val, tarDec, minDec, True))

    def __reverseSearchDist(self, dist):
        return dist * self.coords_stdMax

    def __cal_poly_dist_function(self, KNNLowerBoundary):
        """
        Calculate the polynomial function between distances and number-of-neighbors for each feature
        Parameters
        ----------
        KNNLowerBoundary: the minimum possible neighbors for each location

        Returns
        -------

        """
        polyCoef = NUM.zeros((self.n, POLY_NUM + 1))  # af

        nbs = NUM.arange(KNNLowerBoundary, self.n)
        dimension = self.coords_scaled.shape[1]

        for n in range(self.n):
            vec = NUM.add(self.coords_scaled[n, [0]], -self.coords_scaled[:, [0]]) ** 2
            for i in range(1, dimension):
                vec += NUM.add(self.coords_scaled[n, [i]], -self.coords_scaled[:, [i]]) ** 2
            locDist = NUM.sqrt(vec).flatten()
            dists = NUM.sort(locDist)[KNNLowerBoundary:]

            polyCoef[n, :] = NUM.polyfit(nbs, dists, POLY_NUM).flatten()

        return polyCoef

    def report(self):

        #### Build the Summary Statistics of all Coefficients Table ####
        header = ARCPY.GetIDMessage(220485) #"Summary Statistics for Coefficients Estimates"
        # rows = [["Explanatory Variables", "Mean", "Standard Deviation", "Minimum", "Median", "Maximum"]]
        rows = [[ARCPY.GetIDMessage(84402), ARCPY.GetIDMessage(84261), ARCPY.GetIDMessage(220051),
                 ARCPY.GetIDMessage(84412), ARCPY.GetIDMessage(84414), ARCPY.GetIDMessage(84413)]]

        vars = [ARCPY.GetIDMessage(84064)] + self.indVarNames # the 1st is intercept
        for var_ind, varName in enumerate(vars):
            row = []
            if self.standarizeInput:
                val_template = ARCPY.GetIDMessage(220517)
            else:
                val_template = "{0}"
            if var_ind == 0:
                row.append(val_template.format(varName))
            else:
                row.append(val_template.format(self.ssdo.fields[varName].alias))
            data = self.mgwr.coef[:, var_ind]
            row.append(UTILS.formatValue(NUM.mean(data), "%0.4f"))
            row.append(UTILS.formatValue(NUM.std(data), "%0.4f"))
            row.append(UTILS.formatValue(NUM.min(data), "%0.4f"))
            row.append(UTILS.formatValue(NUM.median(data), "%0.4f"))
            row.append(UTILS.formatValue(NUM.max(data), "%0.4f"))
            rows.append(row)
        rows.append("EMPTY")
        table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                      header=header, pad=1, colPad=3,
                                      titleFillToken="-",
                                      emptyFillToken="-")
        ARCPY.AddMessage(table)

        #### Build Model Diagnostics Table ####
        header = ARCPY.GetIDMessage(84847) #"Model Diagnostics"
        rows = []
        footnote = []
        if self.initModelType == "GWR":
            row0 = [ARCPY.GetIDMessage(84806), "GWR", "MGWR"] # 1st one is Statistic
            if self.searchByDist:
                if self.searchMethod == "FIXED_DISTANCES":
                    #### The bandwidth used in GWR: %s %s (Distance). ####
                    footnote.append(ARCPY.GetIDMessage(220486).format("{0} {1} ({2})".format(
                        UTILS.formatValue(self.__reverseSearchDist(self.mgwr.optimal_init_distance) / self.distanceUnitConvertFactor, "%.2f"),
                        self.userDistUnitName,
                        ARCPY.GetIDMessage(84179))))
                else:
                    #### Optimal GWR Bandwidth: %s %s (Distance). ####
                    footnote.append(ARCPY.GetIDMessage(220487).format("{0} {1} ({2})".format(
                        UTILS.formatValue(self.__reverseSearchDist(self.mgwr.optimal_init_distance) / self.distanceUnitConvertFactor, "%.2f"),
                        self.userDistUnitName,
                        ARCPY.GetIDMessage(84179))))
            else:
                if self.searchMethod == "FIXED_NEIGHBORS":
                    #### The bandwidth used in GWR: %d (KNN). ####
                    footnote.append(ARCPY.GetIDMessage(220486).format("{0} ({1})".format(
                        self.mgwr.optimal_init_knn,
                        ARCPY.GetIDMessage(84747))))
                else:
                    #### Optimal GWR Bandwidth: %d (KNN). ####
                    footnote.append(ARCPY.GetIDMessage(220487).format("{0} ({1})".format(
                        self.mgwr.optimal_init_knn,
                        ARCPY.GetIDMessage(84747))))
        else:
            row0 = [ARCPY.GetIDMessage(84806), "MGWR"] # 1st one is Statistic
        items = ["r2", "adj_r2", "aicc", "s2", "s2_mle", "edof"]
        # labels = ["R Squared", "AdjR2", "AICc", "Sigma-Squared",
        #           "Sigma-Squared MLE", "Effective Degree of Freedom"]
        labels = [ARCPY.GetIDMessage(84826), ARCPY.GetIDMessage(84022), ARCPY.GetIDMessage(84249),
                  ARCPY.GetIDMessage(84252), ARCPY.GetIDMessage(84848), ARCPY.GetIDMessage(84849)]
        rows.append((row0))
        for ind in range(len(items)):
            if self.initModelType == "GWR":
                rows.append([labels[ind], UTILS.formatValue(self.mgwr.init_model_statistics[items[ind]], "%.4f"),
                             UTILS.formatValue(self.mgwr.mgwr_statistics[items[ind]], "%.4f")])
            else:
                rows.append([labels[ind], UTILS.formatValue(self.mgwr.mgwr_statistics[items[ind]], "%.4f")])

        rows.append("EMPTY")
        table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(row0) - 1),
                                      header=header, pad=1, colPad=3, footnote=footnote,
                                      titleFillToken="-",
                                      emptyFillToken="-")
        ARCPY.AddMessage(table)

        #### Build the table for bandwidth summarize and significant coffecient ####
        # header = "Summary of Explanatory Variables and Neighborhoods"
        header = ARCPY.GetIDMessage(220488)
        footnote = []
        if self.searchByDist:
            # rows = [[
            #     "Explanatory Variables",
            #     "Optimal Distance Bandwidth (As Percentage of extent %)",
            #     "Number of Features with Significant Coefficients (As Percentage of Features %)"]]
            rows = [[
                ARCPY.GetIDMessage(84402),
                [ARCPY.GetIDMessage(220489), UTILS.buildSuperscript(ARCPY.GetIDMessage(84080))],
                [ARCPY.GetIDMessage(220490), UTILS.buildSuperscript(ARCPY.GetIDMessage(84086))]]]
            bds = self.__reverseSearchDist(self.mgwr.distances_array) / self.distanceUnitConvertFactor
            denom = self.globalPossibleMaxBD
            template_bd = "%s (%s)"
            # footnote.append("Distance Unit: %s" % self.userDistUnitName)
            footnote.append(ARCPY.GetIDMessage(220494).format(self.userDistUnitName))
        else:
            # rows = [[
            #     "Explanatory Variables",
            #     "Optimal Numbor of Neighbors Bandwidth (As Percentage of Features %)",
            #     "Number of Features with Significant Coefficients (As Percentage of Features %)"]]
            rows = [[
                ARCPY.GetIDMessage(84402),
                [ARCPY.GetIDMessage(220491), UTILS.buildSuperscript(ARCPY.GetIDMessage(84080))],
                [ARCPY.GetIDMessage(220490), UTILS.buildSuperscript(ARCPY.GetIDMessage(84086))]]]
            bds = self.mgwr.num_neighs_array
            denom = float(self.n)
            template_bd = "%d (%s)"

        if self.standarizeInput:
            val_template = ARCPY.GetIDMessage(220517)
        else:
            val_template = "{0}"
        for ind, vn in enumerate([ARCPY.GetIDMessage(84064)] + [self.ssdo.fields[vn].alias for vn in self.indVarNames]):  # 1st one is the intercept
            featurePercentage = bds[ind] / denom * 100
            if featurePercentage > 100:
                featurePercentage = 100
            if self.searchByDist:
                bd = self.__buildDecStr(bds[ind], 2, 0)
            else:
                bd = bds[ind]
            rows.append([
                val_template.format(vn),
                template_bd % (bd, UTILS.formatValue(featurePercentage, "%.2f")),
                "%d (%s)" % (self.num_significant_coefs_array[ind],
                UTILS.formatValue(self.num_significant_coefs_array[ind] / float(self.n) * 100.0, "%.2f")),
            ])

        #### "We recommend understanding bandwidth ranging 0 - 20% as local scale, 20% - 80% as regional scale, 80% - 100% as global scale." ####
        footnote.append(ARCPY.GetIDMessage(84080) + ": " + ARCPY.GetIDMessage(220492))
        footnote.append(ARCPY.GetIDMessage(84086) + ": " + ARCPY.GetIDMessage(220501))

        rows.append("EMPTY")
        table = UTILS.outputTextTable(rows, justify=['left', 'right', 'right'],
                                      header=header, pad=1, footnote=footnote,
                                      titleFillToken="-", colPad=4,
                                      emptyFillToken="-")
        ARCPY.AddMessage(table)

        # #### Build the Optimal Bandwidth Search History Table #### todo: comment
        # header = "Optimal Bandwidths Search History"
        # rows = []
        # row0 = ["Iteration", "Intercept" + " (AICc)" if self.solveMethod == "BACK-FITTING" else ""]
        # for varName in self.indVarNames:
        #     if self.solveMethod == "BACK-FITTING":
        #         row0.append("{} (AICc)".format(self.ssdo.fields[varName].alias))
        #     else:
        #         row0.append(self.ssdo.fields[varName].alias)
        # row0.append("AICc")
        # rows.append(row0)
        # footnote = []
        #
        # if self.initModelType == "GWR":
        #     if self.solveMethod == "BACK-FITTING":
        #         if self.searchByDist:
        #             rows.append([0] + [f"{self.__buildDecStr(self.mgwr.optimal_init_distance / self.distanceUnitConvertFactor, 2, 0)} (-)"] * self.k
        #                         + ["%.4f" % self.mgwr.init_model_statistics["aicc"]])
        #         else:
        #             rows.append([0] + [f"{self.__buildDecStr(self.mgwr.optimal_init_knn, 2, 0)} (-)"] * self.k + ["%.4f" % self.mgwr.init_model_statistics["aicc"]])
        #     else:
        #         if self.searchByDist:
        #             rows.append([0] + [f"{self.__buildDecStr(self.mgwr.optimal_init_distance / self.distanceUnitConvertFactor, 2, 0)}"] * self.k
        #                         + ["%.4f" % self.mgwr.init_model_statistics["aicc"]])
        #         else:
        #             rows.append([0] + [f"{self.__buildDecStr(self.mgwr.optimal_init_knn, 2, 0)}"] * self.k + [
        #                 "%.4f" % self.mgwr.init_model_statistics["aicc"]])
        # if self.searchByDist:
        #     footnote.append("Distance Unit: %s" % self.userDistUnitName)
        #     for iter_ind, globalAicc in enumerate(self.mgwr.optimal_hist_aicc_global_array):
        #         if iter_ind == self.lowest_aicc_ind:
        #             row = [str(iter_ind + 1) + "*"]
        #         else:
        #             row = [iter_ind + 1]
        #
        #         start_ind = iter_ind * self.k
        #         for var_ind in range(self.k):
        #             if self.solveMethod == "BACK-FITTING":
        #                 row.append("%s (%.4f)" % (
        #                     self.__buildDecStr(self.mgwr.optimal_hist_bw_dist_array[start_ind + var_ind] /
        #                                        self.distanceUnitConvertFactor, 2, 0),
        #                     self.mgwr.optimal_hist_aicc_covariate_array[start_ind + var_ind]))
        #             else:
        #                 row.append("%s" % (
        #                     self.__buildDecStr(self.mgwr.optimal_hist_bw_dist_array[start_ind + var_ind] /
        #                                        self.distanceUnitConvertFactor, 2, 0)))
        #         row.append("%.4f" % self.mgwr.optimal_hist_aicc_global_array[iter_ind])
        #         rows.append(row)
        # else:
        #     for iter_ind, globalAicc in enumerate(self.mgwr.optimal_hist_aicc_global_array):
        #         if iter_ind == self.lowest_aicc_ind:
        #             row = [str(iter_ind + 1) + "*"]
        #         else:
        #             row = [iter_ind + 1]
        #
        #         start_ind = iter_ind * self.k
        #         for var_ind in range(self.k):
        #             if self.solveMethod == "BACK-FITTING":
        #                 row.append("%d (%.4f)" % (
        #                     self.mgwr.optimal_hist_bw_knn_array[start_ind + var_ind],
        #                     self.mgwr.optimal_hist_aicc_covariate_array[start_ind + var_ind]))
        #             else:
        #                 row.append("%d" % (
        #                     self.mgwr.optimal_hist_bw_knn_array[start_ind + var_ind]))
        #         row.append("%.4f" % self.mgwr.optimal_hist_aicc_global_array[iter_ind])
        #         rows.append(row)
        #
        # footnote.append(f"* The lowest AICc value was found in iteration {self.lowest_aicc_ind + 1}.")
        # table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(row0) -1 ),
        #                               header=header, pad=1, colPad=3, footnote=footnote,
        #                               titleFillToken="-",
        #                               emptyFillToken="-", boldRows=[self.lowest_aicc_ind + 2])
        # ARCPY.AddMessage(table)
        # # todo: comment

        #### Build the Optimal Bandwidth Search History Table ####
        # header = "Optimal Bandwidths Search History"
        header = ARCPY.GetIDMessage(220493)
        rows = []
        row0 = [ARCPY.GetIDMessage(84908),
                val_template.format(ARCPY.GetIDMessage(84064))]  # ["Iteration", "Intercept"]
        for varName in self.indVarNames:
            row0.append(val_template.format(self.ssdo.fields[varName].alias))
        row0.append(ARCPY.GetIDMessage(84249))  # "AICc"
        rows.append(row0)
        footnote = []

        if self.initModelType == "GWR":
            if self.searchByDist:
                rows.append([0] + [
                    self.__buildDecStr(
                        self.__reverseSearchDist(self.mgwr.optimal_init_distance) / self.distanceUnitConvertFactor, 2,
                        0)] * self.k
                            + [UTILS.formatValue(self.mgwr.init_model_statistics["aicc"], "%.4f")])
            else:
                rows.append([0] + [self.__buildDecStr(self.mgwr.optimal_init_knn, 2, 0)] * self.k +
                            [UTILS.formatValue(self.mgwr.init_model_statistics["aicc"], "%.4f")])
        if self.searchByDist:
            # footnote.append("Distance Unit: %s" % self.userDistUnitName)
            footnote.append(ARCPY.GetIDMessage(220494).format(self.userDistUnitName))
            for iter_ind, globalAicc in enumerate(self.mgwr.optimal_hist_aicc_global_array):
                if iter_ind > self.lowest_aicc_ind:
                    break
                row = [iter_ind + 1]

                start_ind = iter_ind * self.k
                for var_ind in range(self.k):
                    row.append(self.__buildDecStr(
                        self.__reverseSearchDist(self.mgwr.optimal_hist_bw_dist_array[start_ind + var_ind]) /
                        self.distanceUnitConvertFactor, 2, 0))
                row.append(UTILS.formatValue(self.mgwr.optimal_hist_aicc_global_array[iter_ind], "%.4f"))
                rows.append(row)
        else:
            for iter_ind, globalAicc in enumerate(self.mgwr.optimal_hist_aicc_global_array):
                if iter_ind > self.lowest_aicc_ind:
                    break
                row = [iter_ind + 1]

                start_ind = iter_ind * self.k
                for var_ind in range(self.k):
                    row.append(self.mgwr.optimal_hist_bw_knn_array[start_ind + var_ind])
                row.append(UTILS.formatValue(self.mgwr.optimal_hist_aicc_global_array[iter_ind], "%.4f"))
                rows.append(row)

        rows.append("EMPTY")

        if self.solveMethod == "GRADIENT":
            outputTable = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(row0) - 1),
                                                header=None, pad=1, colPad=3, footnote=footnote,
                                                titleFillToken="-",
                                                emptyFillToken="-",
                                                returnHTMLMsg=True,
                                                force2Txt=False)
            fullTable = UTILS.outputAccordion([outputTable], title=header, titleLevel=5,
                                              expand=False, returnHTMLMsg=False,
                                              force2Txt=False, titleFillToken="*")
            ARCPY.AddMessage(fullTable)
        else:

            table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(row0) - 1),
                                          header=header, pad=1, colPad=3, footnote=footnote,
                                          titleFillToken="-",
                                          emptyFillToken="-")
            ARCPY.AddMessage(table)

        #### Build the Bandwidth statistics table ####
        header = ARCPY.GetIDMessage(220495)  # "Bandwidth Statistics Summary"
        if self.standarizeInput:
            val_template = ARCPY.GetIDMessage(220517)
        else:
            val_template = "{0}"
        footnote = []

        # rows = [["Variables", "Optimal Distance Bandwidth", "Effective Number of Parameters",
        #          "Adjusted Value of Alpha", "Adjusted Critical Value of Pseudo-t Statistics"]]
        rows = [[ARCPY.GetIDMessage(84402), ARCPY.GetIDMessage(220496), ARCPY.GetIDMessage(220497),
                 ARCPY.GetIDMessage(220498), ARCPY.GetIDMessage(220499)]]

        justify = ['left', 'right', 'right', 'right', 'right']

        if self.searchByDist:
            bds = [self.__buildDecStr(bd, 2, 0) for bd in
                   self.__reverseSearchDist(self.mgwr.distances_array) / self.distanceUnitConvertFactor]
            template_bd = "%s"
            # footnote.append("Distance Unit: %s" % self.userDistUnitName)
            footnote.append(ARCPY.GetIDMessage(220494).format(self.userDistUnitName))
        else:
            rows[0][1] = ARCPY.GetIDMessage(220500)  # "Optimal Number of Neighbors"
            bds = self.mgwr.num_neighs_array
            template_bd = "%d"

        for ind, vn in enumerate([ARCPY.GetIDMessage(84064)] + [self.ssdo.fields[vn].alias for vn in
                                                                self.indVarNames]):  # 1st one: Intercept
            rows.append([
                val_template.format(vn),
                template_bd % bds[ind],
                UTILS.formatValue(self.mgwr.enps_array[ind], "%.2f"),
                UTILS.formatValue(self.adj_alphas[ind], "%.4f"),
                UTILS.formatValue(self.t_critical[ind], "%.4f")
            ])

        rows.append("EMPTY")
        table = UTILS.outputTextTable(rows, justify=justify,
                                      header=header, pad=1, footnote=footnote,
                                      titleFillToken="-",
                                      emptyFillToken="-")
        ARCPY.AddMessage(table)

        # #### Build the Performance statistics table ####
        # header = "Tool Performance Summary"
        # footnote = []
        # dbgInfo = self.mgwr.debug_info
        # if DIAGNOSTIC_CALCULATION_METHOD == 0:
        #     diag_method = "Original"
        # elif DIAGNOSTIC_CALCULATION_METHOD == 1:
        #     diag_method = "OPT For-Loop"
        # elif DIAGNOSTIC_CALCULATION_METHOD == 2:
        #     diag_method = "OPT Blaze"
        # else:
        #     diag_method = "OPT Blaze Trim"
        #
        # rows = [
        #     ["Item", "Stat"],
        #     ["Num Features", self.n],
        #     ["Num Vars", self.k],
        #     ["Num Threads", self.numThreads],
        #     ["Time GWR", "%.2f (s)" % dbgInfo["time_gwr"]],
        #     ["Time MGWR", "%.2f (s)" % dbgInfo["time_mgwr"]],
        #     ["Time Diagnostic", "%.2f (s)" % dbgInfo["time_diagnostic"]],
        #     ["Diagnostic Method", f"{diag_method}"],
        # ]
        # if self.initModelType == "GWR":
        #     rows.append(["Time Local R-square", "%.2f (s)" % dbgInfo["time_local_r2"]])
        #
        # if self.calLocalCondNums:
        #     rows.append(["Time Local Condition Nums", "%.2f (s)" % dbgInfo["time_local_cond_nums"]])
        #
        # rows.append(["CPP Time Sum", "%.2f (s)" % dbgInfo["time_total"]])
        #
        # rows.append("EMPTY")
        # table = UTILS.outputTextTable(rows, justify=justify,
        #                               header=header, pad=1, footnote=footnote,
        #                               titleFillToken="-",
        #                               emptyFillToken="-", tableSize="small")
        # ARCPY.AddMessage(table)

    def predictNewFC(self, predictInputFC, predVarNames, predictOutputFC, robust=False):
        ARCPY.env.overwriteOutput = True

        #### Create SSDataObject ####
        predSSDO = SSDO.SSDataObject(predictInputFC, explicitSpatialRef=self.ssdo.spatialRef)
        predSSDO.obtainData(predSSDO.oidName, predVarNames)

        #### Make Sure the PredictInputFC is Within the 30% extended boundary of inputFC ####
        bufferRatio = 0.3 / 2
        if self.ssdo.useChordal:
            spatialRef = self.ssdo.spatialRef
            sliceInfo = self.ssdo.sliceInfo
            bufferDistance = ((sliceInfo.bottomX + sliceInfo.topX) / 2 + sliceInfo.leftY) / 2 * bufferRatio
            bufferedBoundary = self.ssdo.extent.polygon._arc_object.bufferex(bufferDistance, 9001, 1)
            geoms = predSSDO.getShapesAsArray()
            for g in geoms:
                if bufferedBoundary.disjoint(g._arc_object):
                    ARCPY.AddIDMessage("ERROR", 110256)
                    raise SystemExit()
        else:
            extentXmin = self.ssdo.extent.XMin - self.ssdo.extent.width * bufferRatio
            extentXmax = self.ssdo.extent.XMax + self.ssdo.extent.width * bufferRatio
            extentYmin = self.ssdo.extent.YMin - self.ssdo.extent.height * bufferRatio
            extentYmax = self.ssdo.extent.YMax + self.ssdo.extent.height * bufferRatio
            geoms = predSSDO.getShapesAsArray()
            for g in geoms:
                outOfInputBuffer = False
                if g.centroid.X < extentXmin or g.centroid.X > extentXmax:
                    outOfInputBuffer = True
                if g.centroid.Y < extentYmin or g.centroid.Y > extentYmax:
                    outOfInputBuffer = True
                if outOfInputBuffer:
                    ARCPY.AddIDMessage("ERROR", 110256)
                    raise SystemExit()

        #### Create Design Matrix ####
        zeroVarFields = []
        x = NUM.ones((predSSDO.numObs, self.k), dtype=float)
        xRaw = NUM.ones((predSSDO.numObs, self.k), dtype=float)
        for column, variable in enumerate(predVarNames):
            varData = predSSDO.fields[variable].returnDouble()
            xStd = NUM.std(varData)
            if NUM.isnan(xStd) or xStd <= 0.0:
                zeroVarFields.append(variable)
            else:
                if self.standarizeInput:
                    x[:, column + 1] = (varData - NUM.mean(varData)) / xStd
                    xRaw[:, column + 1] = varData
                else:
                    x[:, column + 1] = varData

        #### Error for Constant Fields ####
        if len(zeroVarFields):
            zeroNames = ", ".join(zeroVarFields)
            ARCPY.AddIDMessage("ERROR", 1588, zeroNames)
            raise SystemExit()


        #### Create CKDTree ####
        if predSSDO.useChordal:
            #### Chordal Distance XYZ ###
            coords = predSSDO.spheroidCoords
        else:
            coords = predSSDO.xyCoords

        coords_scaled = coords
        if self.solveMethod == "GRADIENT":
            coords_scaled = coords.copy()
            dimension = self.coords.shape[1]
            for column in range(dimension):
                coords_scaled[:, column] -= self.coords_means[column]
            coords_scaled /= self.coords_stdMax

        pred_coef = self.mgwr.predict_coefficients(coords_scaled, robust)
        if pred_coef is None:
            raise SystemExit()
        yHat = (x * pred_coef).sum(1)

        predRevCoef = None
        predRawPred = None
        if self.standarizeInput:
            predRevCoef, predRawPred = self.__reverseStandarizePrediction(pred_coef, xRaw)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(predictOutputFC)

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        fieldOrder = []

        #### Add the input fields one by one since they are standardized ####
        appendFields = predVarNames.copy()
        if self.standarizeInput:
            vnFA = gwrVarScaledAlias
            appendFields = [gwrVarScaledName.format(v) for v in appendFields]
            appendFields += [gwrPredFieldScaledName, gwrPredFieldName]

            coefFN = gwrCoefFieldScaledName
            coefFA = gwrCoefFieldScaledAlias
        else:
            vnFA = "{0}"
            appendFields += [gwrPredFieldName]

            coefFN = gwrCoefFieldName
            coefFA = gwrCoefFieldAlias

        appendFields += [coefFN.format(vn) for vn in [gwrInterceptName] + predVarNames]

        if self.standarizeInput:
            appendFields += [gwrCoefFieldReversedName.format(vn) for vn in [gwrInterceptName] + predVarNames]

        appendFieldsValid = UTILS.createAppendFieldNames(appendFields, outPath)
        C = 0

        for ind, varName in enumerate(predVarNames):
            data = x[:, ind + 1].copy()
            varNameValid = appendFieldsValid[ind]
            candidateField = SSDO.CandidateField(varNameValid, "DOUBLE", data,
                                                 alias=vnFA.format(predSSDO.fields[predVarNames[ind]].alias))
            candidateFields[varNameValid] = candidateField
            fieldOrder.append(varNameValid)
            C += 1

        if self.standarizeInput:
            vn = appendFieldsValid[C]
            C += 1
            alias = gwrPredFieldScaledAlias.format(self.ssdo.fields[self.depVarName].alias)
            candidateField = SSDO.CandidateField(vn, "DOUBLE",
                                                 yHat,
                                                 alias=alias)
            candidateFields[vn] = candidateField
            fieldOrder.append(vn)

            #### Do the reverse y prediction here ####
            vn = appendFieldsValid[C]
            C += 1
            alias = gwrPredFieldAlias.format(self.ssdo.fields[self.depVarName].alias)
            candidateField = SSDO.CandidateField(vn, "DOUBLE",
                                                 predRawPred,
                                                 alias=alias)
            candidateFields[vn] = candidateField
            fieldOrder.append(vn)
        else:
            vn = appendFieldsValid[C]
            C += 1
            alias = gwrPredFieldAlias.format(self.ssdo.fields[self.depVarName].alias)
            candidateField = SSDO.CandidateField(vn, "DOUBLE",
                                                 yHat,
                                                 alias=alias)
            candidateFields[vn] = candidateField
            fieldOrder.append(vn)

        for ind in range(1 + len(predVarNames)):
            vn = appendFieldsValid[C]
            C += 1
            if ind == 0:
                alias = coefFA.format(gwrInterceptAlias)
            else:
                alias = coefFA.format(predSSDO.fields[predVarNames[ind - 1]].alias)
            data = pred_coef[:, ind]
            candidateField = SSDO.CandidateField(vn, "DOUBLE",
                                                 data,
                                                 alias=alias)
            candidateFields[vn] = candidateField
            fieldOrder.append(vn)

        if self.standarizeInput:
            for ind in range(1 + len(predVarNames)):
                vn = appendFieldsValid[C]
                C += 1
                if ind == 0:
                    alias = gwrCoefFieldReversedAlias.format(gwrInterceptAlias)
                else:
                    alias = gwrCoefFieldReversedAlias.format(predSSDO.fields[predVarNames[ind - 1]].alias)
                data = predRevCoef[:, ind]
                candidateField = SSDO.CandidateField(vn, "DOUBLE",
                                                     data,
                                                     alias=alias)
                candidateFields[vn] = candidateField
                fieldOrder.append(vn)

        #### Write Data to Output Feature Class ####
        predSSDO.output2NewFC(predictOutputFC, candidateFields, fieldOrder=fieldOrder)
        self.predSSDO = predSSDO

    def predictionCoefficientRasters(self, outputDir, outputPref=None, robust=False):
        ARCPY.env.overwriteOutput = True

        #### Check If User Has the Advanced License to Conduct This Analysis ####
        if not checkLicense() and outputDir is not None:
            ARCPY.AddIDMessage("ERROR", 110257)
            raise SystemExit()

        ssdo = self.ssdo
        try:
            cellSize = UTILS.strToFloat(ARCPY.env.cellSize)
        except:
            if ssdo.useChordal:
                envelope = UTILS.Envelope(ssdo.extent)
                maxExtent = envelope.maxExtent
                cellSize = envelope.maxExtent / 100
            else:
                cellSize = ssdo.envelope.maxExtent / 100

        #### Create Progressor (Study Area) ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84248))

        #### Get Extent Study Area ####
        if ssdo.shapeType.upper() == "POLYGON":
            polyDict, polyAreas = UTILS.readPolygonFC(ssdo.inputFC,
                                                      spatialRef=ssdo.spatialRef,
                                                      useGeodesic=ssdo.useChordal)
            extent = UTILS.getPolyExtent(polyDict)
        else:
            extent = ssdo.extent

        if self.predSSDO is not None:
            if self.predSSDO.shapeType.upper() == "POLYGON":
                polyDict, polyAreas = UTILS.readPolygonFC(self.predSSDO.inputFC,
                                                          spatialRef=ssdo.spatialRef,
                                                          useGeodesic=ssdo.useChordal)
                predExtent = UTILS.getPolyExtent(polyDict)
            else:
                predExtent = self.predSSDO.extent
            extent = combineExtets(extent, predExtent)

        envelope = UTILS.Envelope(extent)
        #### Cell Info ####
        minX = extent.XMin
        maxX = extent.XMax
        minY = extent.YMin
        maxY = extent.YMax

        #### Columns ####
        nc = NUM.floor(envelope.lenX / cellSize)
        gridWidth = nc * cellSize

        if (minX + gridWidth) < maxX:
            nc += 1.0
            gridWidth += cellSize

        #### Adjust Extent ####
        diffWidth = gridWidth - envelope.lenX
        minX = minX - (diffWidth / 2.0)

        numCols = int(nc)

        #### Rows ####
        nr = NUM.floor(envelope.lenY / cellSize)
        gridHeight = nr * cellSize

        if (maxY - gridHeight) > minY:
            nr += 1.0
            gridHeight += cellSize

        #### Adjust Extent ####
        diffHeight = gridHeight - envelope.lenY
        maxY = maxY + (diffHeight / 2.0)

        numRows = int(nr)

        #### Recalculate MaxX and MinY ####
        maxX = minX + (nc * cellSize)
        minY = maxY - (nr * cellSize)

        #### Create Cube Info Class ####
        cubeInfo = ARC._ss.CubeInfo(numRows, numCols, 1, cellSize)

        #### Get Analysis Polygon to Clip ####
        if ssdo.shapeType.upper() == "POINT":
            #### Use Convex Hull ####
            tempFC = True
            studyAreaFC = UTILS.returnScratchName("rasterBound_FC")
            UTILS.minBoundGeomPoints(ssdo.xyCoords, studyAreaFC,
                                     geomType="CONVEX_HULL",
                                     spatialRef=ssdo.spatialRef)
        else:
            tempFC = False
            studyAreaFC = ssdo.inputFC

        #### Get Analysis Mask ####
        analysisMask = cubeInfo.get_polygon_mask(studyAreaFC, minX, maxY,
                                                 ssdo.spatialRef)
        if tempFC:
            UTILS.passiveDelete(studyAreaFC)

        if self.predSSDO:
            if self.predSSDO.shapeType.upper() == "POINT":
                #### Use Convex Hull ####
                tempFC = True
                studyAreaFC = UTILS.returnScratchName("rasterBound_FC_pred")
                UTILS.minBoundGeomPoints(self.predSSDO.xyCoords, studyAreaFC,
                                         geomType="CONVEX_HULL",
                                         spatialRef=ssdo.spatialRef)
            else:
                tempFC = False
                studyAreaFC = self.predSSDO.inputFC

            #### Get Analysis Mask ####
            analysisMaskPred = cubeInfo.get_polygon_mask(studyAreaFC, minX, maxY,
                                                     ssdo.spatialRef)
            if tempFC:
                UTILS.passiveDelete(studyAreaFC)

            if analysisMask is not None and analysisMaskPred is not None:
                analysisMask = NUM.logical_or(analysisMask, analysisMaskPred)

        #### Create Count and Summary Variable Analysis Mask ####
        centroids = cubeInfo.return_centroids(minX, maxY)

        #### Convert to 3D for Chordal ####
        if ssdo.useChordal:
            centroids = ARC._ss.lonlat_to_xy(centroids, ssdo.spatialRef)

        #### Create Coefficients ####
        if analysisMask is not None:
            centroidsValid = centroids[analysisMask].copy()

        coords_scaled = centroidsValid
        if self.solveMethod == "GRADIENT":
            coords_scaled = centroidsValid.copy()
            dimension = centroidsValid.shape[1]
            for column in range(dimension):
                coords_scaled[:, column] -= self.coords_means[column]
            coords_scaled /= self.coords_stdMax

        pred_coef_valid = self.mgwr.predict_coefficients(coords_scaled, robust)
        if pred_coef_valid is None:
            raise SystemExit()
        coef = NUM.full((len(centroids), self.k), -9999.0, dtype=float)
        if analysisMask is not None:
            coef[analysisMask] = pred_coef_valid

        #### Create Output Rasters ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84798), 0,
                            self.k*2 if self.standarizeInput else self.k, 1)

        #### Try/Except/Finally for Rasters with Given Spatial Ref ####
        oldSpatialRef = ARCPY.env.outputCoordinateSystem

        #### Store Output Raster Layers ####
        outRasterLayers = []
        # if self.standarizeInput:
        #     layerFile = OS.path.join(UTILS.pathLayers, "MGWR_Cofficient_Raster.lyrx")
        # else:
        #     layerFile = OS.path.join(UTILS.pathLayers, "MGWR_Cofficient_Raster_Uni.lyrx")

        try:
            #### Set Spatial Ref ####
            ARCPY.env.outputCoordinateSystem = ssdo.spatialRef

            outRasters, layerNames, ext, delRaster = MGWR.makeDerivedRasterLayers(self.indVarNames, self.outputFC,
                                                                                  outputDir, self.standarizeInput,
                                                                                  False)

            #### Create Origin and Intercept Raster ####
            geom = ARCPY.Point(minX, minY)
            values = coef[:, 0].reshape(numRows, numCols)
            raster = ARCPY.NumPyArrayToRaster(values, geom, cellSize, cellSize, -9999.)
            outName = outRasters[0]
            if delRaster:
                UTILS.passiveDelete(outName)
            raster.save(outName)
            outRasterLayers.append(raster)

            # layer = ARCPY.MakeRasterLayer_management(raster, layerNames[0])
            # layer = ARCPY.management.ApplySymbologyFromLayer(layer, layerFile,
            #                                                  update_symbology="UPDATE")
            # outRasterLayers.append(layer)

            #### Reset Progessor ####
            ARCPY.SetProgressorPosition()

            #### Create Slope Rasters ####
            for varInd, varName in enumerate(self.indVarNames):
                values = coef[:, varInd + 1].reshape(numRows, numCols)
                raster = ARCPY.NumPyArrayToRaster(values, geom, cellSize, cellSize, -9999.)
                outName = outRasters[varInd + 1]
                if delRaster:
                    UTILS.passiveDelete(outName)
                raster.save(outName)
                outRasterLayers.append(raster)

                # layer = ARCPY.MakeRasterLayer_management(raster, layerNames[varInd + 1])
                # layer = ARCPY.management.ApplySymbologyFromLayer(layer, layerFile,
                #                                                  update_symbology="UPDATE")
                # outRasterLayers.append(layer)

                #### Reset Progessor ####
                ARCPY.SetProgressorPosition()

            #### Create the rescaled raster and save them ####
            if self.standarizeInput:
                revCoef = self.__reverseStandarizePrediction(coef, None)
                C = len(self.indVarNames) + 1
                values = revCoef[:, 0].reshape(numRows, numCols)
                raster = ARCPY.NumPyArrayToRaster(values, geom, cellSize, cellSize, -9999.)
                outName = outRasters[C]
                if delRaster:
                    UTILS.passiveDelete(outName)
                raster.save(outName)
                ARCPY.SetProgressorPosition()
                C += 1
                for varInd, varName in enumerate(self.indVarNames):
                    values = revCoef[:, varInd + 1].reshape(numRows, numCols)
                    raster = ARCPY.NumPyArrayToRaster(values, geom, cellSize, cellSize, -9999.)
                    outName = outRasters[C]
                    if delRaster:
                        UTILS.passiveDelete(outName)
                    raster.save(outName)
                    ARCPY.SetProgressorPosition()
                    C += 1

        except:
            ARCPY.AddIDMessage("ERROR", 110221)
            raise SystemExit()

        finally:
            ARCPY.env.outputCoordinateSystem = oldSpatialRef

        return outRasterLayers