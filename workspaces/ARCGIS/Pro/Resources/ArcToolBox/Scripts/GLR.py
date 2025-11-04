# coding: utf-8
"""
Tool Name:     GLR (Generalized Linear Regression)
Source Name:   GLR.py
Version:       ArcGIS Pro 2.3
Author:        Environmental Systems Research Institute Inc.
Description:   Runs Generalized Linear Regression and produces standard output.
"""

################ Imports ####################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.linalg as LA
import arcpy as ARCPY
import arcgisscripting as ARC
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import Stats as STATS
import locale as LOCALE
import WeightsUtilities as WU
from SSHelperFunctions import *
import arcpy.management as DM
import tempfile as TEMPFILE
LOCALE.setlocale(LOCALE.LC_ALL, '')
################ Constants ##################
CREATE_OUTPUT_ARRAYS = False

################ Output Field Names #################
glrFCFieldNames = ["RESIDUAL", "STDRESID"]
glrFCFieldAlias = ["Residual", "Std Residual"]
glrPredFieldName = "PREDICTED"
glrPredFieldAlias = "Predicted ({0})"

glrProbFieldName = "PROB_1"
glrProbFieldAlias = "Probability of Being 1 ({0})"

glrRawFieldName = "RAW_PRED"
glrRawFieldAlias = "Raw Predicted ({0})"

glrFCFieldNames = ["DEV_RESID"]
glrFCFieldAlias = ["Deviance Residual"]

################# Global Variables ###################
glrFamilyTypes = ["POISSON", "LOGIT", "NEGATIVEBINOMIAL"]

def execute(parameters, messages):

    ### Get parameter values ####
    ARCPY.env.overwriteOutput = True
    inputFC = UTILS.getTextParameter(0, parameters)
    depVarName = UTILS.getTextParameter(1, parameters).upper()
    modelType = UTILS.getTextParameter(2, parameters).upper()
    indVarNames = UTILS.getTextParameter(4, parameters)
    if indVarNames:
        indVarNames = indVarNames.upper().split(";")
    else:
        indVarNames = []
    outputFC = UTILS.getTextParameter(3, parameters)
    outPath, outName = OS.path.split(outputFC)
    distanceFeatures = UTILS.getTextParameter(5, parameters)
    if len(indVarNames) == 0 and distanceFeatures is None:
        ARCPY.AddIDMessage("ERROR", 110254)
        raise SystemExit()

    predictInputFC = UTILS.getTextParameter(6, parameters)
    predictVT = parameters[7].value
    matchDistances = UTILS.getTextParameterMatch(8, parameters, 
                                ["MappingLayerObject","mp.Layer"])
    predictOutputFC = UTILS.getTextParameter(9, parameters)

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC)
    allVars = [depVarName] + indVarNames
    ssdo.obtainData(ssdo.oidName, allVars, minNumObs = 5)

    #### Get Family ####
    family = convertFamilyType[modelType]

    #### Prepare Derived Distance Variables for Output Feature Class ####
    outPath, outName = OS.path.split(outputFC)
    outDistNames = []
    unit = None

    #### Get Distance Features ####
    if distanceFeatures is not None:
        unit = UTILS.getDistanceUnit(ssdo)
        df = WU.DistanceFeatures(ssdo, unit, forceNear = True)
        fcList = distanceFeatures.split(";")
        for fc in fcList:
            df.addFeatures(fc.replace("'", ""))

        outDistNames = df.getOutputFieldNames(outPath)

    else:
        df = None

    #### GLR ####
    glr = GLR(ssdo, depVarName, indVarNames, family = family, distanceFeatures = df)

    #### Generate warning if the projection unit is not supported in Near ###
    if outDistNames is not None:
        UTILS.getDistanceUnit(ssdo, True)

    #### Store Model ####
    modelOutput = UTILS.getTextParameter(10, parameters)
    if modelOutput is not None:
        glr.saveModel(modelOutput, outDistNames)

    #### Report ####
    glr.getReport()

    #### Create Output ####
    createGLROutputFC(glr, outputFC)

    #### Render Results ####
    if glr.family != "GAUSSIAN":
        if ssdo.shapeType.upper() == "POINT":
            UTILS.buildLocaleCIMLayer("GGWR_Points.lyrx", 3)
        else:
            UTILS.buildLocaleCIMLayer("GGWR_Polygons.lyrx", 3)
    else:
        if ssdo.shapeType.upper() == "POINT":
            UTILS.buildLocaleCIMLayer("GWR_Points.lyrx", 3)
        else:
            UTILS.buildLocaleCIMLayer("GWR_Polygons.lyrx", 3)

    #### Prediction ####
    if predictInputFC is not None:
        #### Parse Matching Field Names ####
        predVarNames = []
        if predictVT is not None:
            varEntry = [vRow[0].value for vRow in predictVT]
            predVarNames = [i.upper() for i in varEntry]

        #### Create Prediction SSDataObject ####
        ssdoPred = SSDO.SSDataObject(predictInputFC,
                                        explicitSpatialRef = ssdo.spatialRef)
        ssdoPred.obtainData(ssdoPred.oidName, predVarNames)

        #### Get Matching Distance Features ####
        if matchDistances is not None:
            distEntry = [f[0] for f in matchDistances]
            dfPred = WU.DistanceFeatures(ssdoPred, unit, forceNear = True)
            for fc in distEntry:
                dfPred.addFeatures(fc)
        else:
            dfPred = None

        predictGLR = PredictGLR(glr)
        predictGLR.createPredictionFC(ssdoPred, predictOutputFC, 
                                        indVarNames = predVarNames,
                                        distanceFeatures = dfPred)

        #### Render Predictions ####
        if glr.family == "LOGIT":
            if ssdoPred.shapeType.upper() == "POINT":
                predLYR = "GWR_Predict_Points_Binary.lyrx"
            else:
                predLYR = "GWR_Predict_Polygons_Binary.lyrx"
        elif glr.family == "POISSON":
            if ssdoPred.shapeType.upper() == "POINT":
                predLYR = "GWR_Predict_Points_Count.lyrx"
            else:
                predLYR = "GWR_Predict_Polygons_Count.lyrx"
        else:
            if ssdoPred.shapeType.upper() == "POINT":
                predLYR = "GWR_Predict_Points.lyrx"
            else:
                predLYR = "GWR_Predict_Polygons.lyrx"

        parameters[9].symbology = OS.path.join(fullLayerPath, 
                                                predLYR)
    else:
        predictGWR = None

    #### Add Charts To The Results ####
    chartList = list()
    depVarOutName = ssdo.in2OutFieldMap[depVarName]
    indVarOutNames = [ ssdo.in2OutFieldMap[i] for i in indVarNames ]
    if df:
        indVarOutNames += outDistNames 
    chartTitle = ""

    #### Create Scatter Plot Matrix for Xs and Y ####
    smChartFields = []
    smChartFieldsIn = []
    if modelType == 'CONTINUOUS' or modelType == 'COUNT':
        smChartFields = [depVarOutName]
        smChartFieldsIn = [depVarName]
    smChartFields.extend(indVarOutNames)
    smChartFieldsIn.extend(indVarNames)

    if len(smChartFields) < 3:
        if len(smChartFields) == 2:
            chartTitle = ARCPY.GetIDMessage(84888).format(ARCPY.GetIDMessage(220641))
            sChart1 = ARCPY.Chart(chartTitle)
            sChart1.type = 'scatter'
            sChart1.title = chartTitle
            sChart1.xAxis.field = smChartFields[1]
            sChart1.yAxis.field = [smChartFields[0]]
            if not df:
                #### Only Set Alias if not Single Distance Feature ####
                sChart1.xAxis.title = ssdo.fields[smChartFieldsIn[1]].alias
            sChart1.yAxis.title = ssdo.fields[smChartFieldsIn[0]].alias
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

    if modelType == 'BINARY':
        #### Create Box Plot for Xs split By Y####
        chartTitle = ARCPY.GetIDMessage(84896)
        bpChart = ARCPY.Chart(ARCPY.GetIDMessage(84896))
        bpChart.type = 'boxPlot'
        bpChart.title = chartTitle
        # bpChart.description = 'desc'
        bpChart.xAxis.field = ""
        bpChart.yAxis.field = indVarOutNames
        # bpChart.xAxis.title = 'Predicted'
        bpChart.yAxis.title = ARCPY.GetIDMessage(84897)
        #### Set Box Plot Properties ####
        bpChart.boxPlot.splitCategory = depVarOutName
        bpChart.boxPlot.splitCategoryAsMeanLine = False
        bpChart.boxPlot.standardizeValues = True
        chartList.append(bpChart)

    #### Create Histograms for Residuals/Deviance Residuals ####
    histChartShowComparisonDistribution = True
    histChartShowMean = True
    histChartXfield = ''
    histChartXTitle = ''
    if modelType == 'CONTINUOUS':
        chartTitle = ARCPY.GetIDMessage(84889)
        histChartXfield = 'STDRESID'
        histChartXTitle = ARCPY.GetIDMessage(84891)
        histChartShowComparisonDistribution = True
        histChartShowMean = True
    elif modelType == 'COUNT':
        chartTitle = ARCPY.GetIDMessage(84890)
        histChartXfield = 'DEV_RESID'
        histChartXTitle = ARCPY.GetIDMessage(84892)
        histChartShowComparisonDistribution = True
        histChartShowMean = True
    elif modelType == 'BINARY':
        chartTitle = ARCPY.GetIDMessage(84890)
        histChartXfield = 'DEV_RESID'
        histChartXTitle = ARCPY.GetIDMessage(84892)
        histChartShowComparisonDistribution = False
        histChartShowMean = False

    histChart = ARCPY.Chart(chartTitle)
    histChart.type = 'histogram'
    histChart.title = chartTitle
    histChart.xAxis.field = histChartXfield
    histChart.xAxis.title = histChartXTitle
    histChart.histogram.showComparisonDistribution = histChartShowComparisonDistribution
    histChart.histogram.showMean = histChartShowMean
    chartList.append(histChart)

    if modelType == 'CONTINUOUS' or modelType == 'COUNT':
        #### Create Scatter Plot for Residuals in CONTINUOUS and COUNT Model ####
        yAxisField = []
        yAxisTitle = ''
        if modelType == 'CONTINUOUS':
            chartTitle = ARCPY.GetIDMessage(84893)
            yAxisField = ['STDRESID']
            yAxisTitle = ARCPY.GetIDMessage(84891)
        elif modelType == 'COUNT':
            chartTitle = ARCPY.GetIDMessage(84894)
            yAxisField = ['DEV_RESID']
            yAxisTitle = ARCPY.GetIDMessage(84892)
        sChart = ARCPY.Chart(chartTitle)
        sChart.type = 'scatter'
        sChart.title = chartTitle
        # sChart.description = 'desc'
        sChart.xAxis.field = 'PREDICTED'
        sChart.yAxis.field = yAxisField
        sChart.xAxis.title = ARCPY.GetIDMessage(84895)
        sChart.yAxis.title = yAxisTitle
        sChart.scatter.showTrendLine = False
        chartList.append(sChart)
    elif modelType == 'BINARY':
        #### Create Bar Chart for Y and Predicted Y ####
        chartTitle = ARCPY.GetIDMessage(84898)
        barChart = ARCPY.Chart(chartTitle)
        barChart.type = "bar"
        barChart.title = chartTitle
        barChart.xAxis.field = "PREDICTED"
        barChart.yAxis.field = ""
        barChart.yAxis.title = ARCPY.GetIDMessage(84785)
        barChart.xAxis.sort = "asc"
        barChart.bar.aggregation = "COUNT"
        barChart.bar.splitCategory = depVarOutName
        barChart.bar.multiSeriesDisplay = "stacked"
        barChart.legend.title = ssdo.fields[depVarName].alias
        chartList.append(barChart)

    parameters[3].charts = chartList

def createGLROutputFC(glr, outputFC, newFields=None, listFieldsToAddFromSource=None, ouputPathInWorkspace=None, copySourceFields = True):
    """Core Function for Writing GLR Output.

    INPUTS:
    glr (obj): instance of GLR Class
    outputFC (str): path to output feature class
    newFilds (list): new fields added from sensitivity analysis
    listFieldsToAddFromSource (list): list of fields from the source
    outputInWorkspace (str): path to output feature class in workspace
    copySourceFields (bool): copy source fields to output feature class
    """

    ARCPY.env.overwriteOutput = True

    #### Prepare Derived Variables for Output Feature Class ####
    if ouputPathInWorkspace is not None:
        outPath, outName = OS.path.split(ouputPathInWorkspace)
        outputFC = ouputPathInWorkspace
    else:
        outPath, outName = OS.path.split(outputFC)
    # outPath, outName = OS.path.split(outputFC)

    #### Create/Populate Dictionary of Candidate Fields ####
    fieldOrder = []
    candidateFields = {}

    #### Start With Distance Features ####
    if glr.hasDistanceFeatures:

        #### Let Class Obtain Output Field Append Names ####
        outDistNames = glr.distanceFeatures.getOutputFieldNames(outPath)

        for distInd, distName in enumerate(glr.distanceFeatures.names):
            outName = outDistNames[distInd]
            distances = glr.distanceFeatures.distances[distName]
            candidateField = SSDO.CandidateField(outName, "DOUBLE", 
                                                 distances,
                                                 alias = distName)
            candidateFields[outName] = candidateField
            fieldOrder.append(outName)

    if glr.continuous:
        #### Add Prediction Field ####
        alias = glrPredFieldAlias.format(glr.depVarName)
        candidateField = SSDO.CandidateField(glrPredFieldName, "DOUBLE", 
                                             glr.yHat.ravel(),
                                             alias = alias)
        candidateFields[glrPredFieldName] = candidateField
        fieldOrder.append(glrPredFieldName)

        #### Other Summary Vectors ####
        candidateField = SSDO.CandidateField("RESIDUAL", "DOUBLE", 
                                             glr.residuals.ravel(),
                                             alias = "Residual")
        candidateFields["RESIDUAL"] = candidateField
        fieldOrder.append("RESIDUAL")

        candidateField = SSDO.CandidateField("STDRESID", "DOUBLE", 
                                             glr.stdResiduals.ravel(),
                                             alias = "Std Residual")
        candidateFields["STDRESID"] = candidateField
        fieldOrder.append("STDRESID")
    else:
        #### Add Prediction Fields ####
        fieldData = [glr.yPredicted.ravel(), glr.yPredictedValue.ravel()]
        if glr.family == "LOGIT":
            fieldNames = [glrProbFieldName]
            aliasNames = [glrProbFieldAlias]
            fieldTypes = ["DOUBLE", "LONG"]
        else:
            fieldNames = [glrRawFieldName]
            aliasNames = [glrRawFieldAlias]
            fieldTypes = ["DOUBLE", "DOUBLE"]
        
        fieldNames.append(glrPredFieldName)
        aliasNames.append(glrPredFieldAlias)

        for fieldInd, fieldName in enumerate(fieldNames):
            alias = aliasNames[fieldInd].format(glr.depVarName)
            candidateField = SSDO.CandidateField(fieldName, fieldTypes[fieldInd], 
                                                 fieldData[fieldInd],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Other Summary Vectors ####
        candidateField = SSDO.CandidateField("DEV_RESID", "DOUBLE", 
                                             glr.devResiduals.ravel(),
                                             alias = "Deviance Residual")
        candidateFields["DEV_RESID"] = candidateField
        fieldOrder.append("DEV_RESID")

    if newFields is not None:
        for field in newFields:
            fieldOrder.append(field.name)
            candidateFields[field.name] = field

    #### Write Data to Output Feature Class ####
    glr.indVarNames = [fld.upper() for fld in glr.indVarNames]
    appendFields = [glr.depVarName] + glr.indVarNames

    #### Avoid to add the original fields to the output feature class ####
    if not copySourceFields:
        appendFields = []

    if listFieldsToAddFromSource is not None:
        appendFields.extend([i for i in listFieldsToAddFromSource])

    glr.ssdo.output2NewFC(outputFC, candidateFields, appendFields = appendFields,
                          fieldOrder = fieldOrder)

class PredictGLR(object):
    """Predicts Output Features based on GLR Results.

    INPUTS:
    glr (obj): instance of GLR Class
    candidateFields (dict): instances of output fields

    ATTRIBUTES:

    METHODS:
    __getLogitPredictionFields
    getPredictionFields
    createPredictionFC
    """

    def __init__(self, glr):
        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

    def __getGGLRPredictionFields(self, yPredicted):

        #### Add Prediction Field ####
        yPredictedValue = NUM.array(NUM.round(yPredicted),
                                    dtype = float)
        fieldData = [yPredicted.ravel(), yPredictedValue.ravel()]
        if self.glr.family == "LOGIT":
            fieldNames = [glrProbFieldName]
            aliasNames = [glrProbFieldAlias]
            fieldTypes = ["DOUBLE", "LONG"]
        else:
            fieldNames = [glrRawFieldName]
            aliasNames = [glrRawFieldAlias]
            fieldTypes = ["DOUBLE", "DOUBLE"]
        
        fieldNames.append(glrPredFieldName)
        aliasNames.append(glrPredFieldAlias)

        for fieldInd, fieldName in enumerate(fieldNames):
            alias = aliasNames[fieldInd].format(self.glr.depVarName)
            candidateField = SSDO.CandidateField(fieldName, fieldTypes[fieldInd], 
                                                 fieldData[fieldInd],
                                                 alias = alias)
            self.candidateFields[fieldName] = candidateField
            self.fieldOrder.append(fieldName)

    def getPredictionFields(self, yHat):
        #### GGWR Options ####
        if not self.glr.continuous:
            family = ARC._ss.GLR_Family(family = self.glr.family)
            yPredicted = family.inv_link(yHat)
            self.__getGGLRPredictionFields(yPredicted)

        else:
            alias = glrPredFieldAlias.format(self.glr.depVarName)
            candidateField = SSDO.CandidateField(glrPredFieldName, "DOUBLE",
                                                 yHat.ravel(),
                                                 alias = alias)
            self.candidateFields[glrPredFieldName] = candidateField
            self.fieldOrder.append(glrPredFieldName)

    def createPredictionFC(self, ssdo, outputFC, indVarNames = None,
                           distanceFeatures = None):
        """Creates Output Prediction Feature Class for GLR.

        INPUTS:
        ssdo (str): instance of SSDO for Prediction Features
        outputFC (str): path to output feature class
        indVarNames {list, None}: list of explanatory field names (1)
        distanceFeatures {obj, None}: instance of DistanceFeatures

        NOTES:
        (1) Assumes same field names as input if left empty
        """

        ARCPY.env.overwriteOutput = True

        #### Create Default Field Mapper ####
        if indVarNames is None:
            indVarNames = self.glr.indVarNames

        #### Create Design Matrix ####
        x = NUM.ones((ssdo.numObs, self.glr.k), dtype = float)
        for column, variable in enumerate(indVarNames):
            x[:,column + 1] = ssdo.fields[variable].data

        #### Add Distance Features ####
        if self.glr.hasDistanceFeatures:
            ind = len(indVarNames) + 1
            for distName in distanceFeatures.names:
                x[:, ind] = distanceFeatures.distances[distName]
                ind += 1

        #### Do Prediction ####
        yHat = NUM.dot(x, self.glr.coef)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        #### Add Distance Features ####
        self.candidateFields = {}
        self.fieldOrder = []
        if self.glr.hasDistanceFeatures:

            #### Let Class Obtain Output Field Append Names ####
            outDistNames = distanceFeatures.getOutputFieldNames(outPath)

            for distInd, distName in enumerate(distanceFeatures.names):
                outName = outDistNames[distInd]
                distances = distanceFeatures.distances[distName]
                candidateField = SSDO.CandidateField(outName, "DOUBLE", 
                                                     distances,
                                                     alias = distName)
                self.candidateFields[outName] = candidateField
                self.fieldOrder.append(outName)

        #### Create/Populate Dictionary of Candidate Fields ####
        self.getPredictionFields(yHat.ravel())

        #### Write Data to Output Feature Class ####
        ssdo.output2NewFC(outputFC, self.candidateFields,
                          appendFields = indVarNames,
                          fieldOrder = self.fieldOrder)

class GLR(object):
    """Core Class for Generalized Linear Regression.

    INPUTS:
    ssdo (obj): instance of SSDataObject
    depVarName (str): name of dependent variable field
    indVarNames (list): name of independent variable field(s)
    family {str, GAUSSIAN}: GAUSSIAN, POISSON, LOGIT, NEGATIVEBINOMIAL
    distanceFeatures {obj, None}: instance of DistanceFeatures
    initBasicObject {obj}: create an instance of GLR from model values

    ATTRIBUTES:
    n (int): # of observations
    k (int): # of independent variables
    q (int): # of restrictions (k - 1)
    dof (int): degrees of freedom (n - k)
    y (array): nx1 array of dependent variable values
    x (array): nxk array of independent variable values
    coef (array): kx1 vector of beta coefficients
    yHat (array): nx1 predicted dependent variables
    yBar (float): mean of dependent variable
    residuals (array): nx1 vector of regression residuals
    edof (float): effective degrees of freedom
    s2 (float): normalized residual sum of squares
    ess (float): Error Sum of Squares
    tss (float): Total Sum of Squares
    varCoef (array): (nxk) Variance-Covariance Matrix
    seCoef (array): (nxk) Standard Errors for Coeffs

    METHODS:
    initialize
    initializeSearch
    calculate
    report
    """

    def __init__(self, ssdo, depVarName, indVarNames = None,
                 family = "GAUSSIAN", 
                 distanceFeatures = None, initBasicObject = None,
                 sensitivity = None):

        if initBasicObject is not None:
            self.__initModelObj(initBasicObject)
            return

        #### check if GLR is supported for current shipset ####
        if not hasattr(ARC._ss, "GLR"):
            ARCPY.AddIDMessage("ERROR", 110472)
            raise SystemExit()

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.warnedTProb = False

        #### Set Family Flag ####
        self.continuous = self.family == "GAUSSIAN"

        if sensitivity is None:
            #### Initialize Data ####
            self.initialize()

            #### Do Calculation ####
            self.calculate()

    def initialize(self, yDataRealized=None, XDataRealized=None):
        """Performs additional validation and populates the
        SSDataObject."""

        #### Check if user has advanced license ####
        if self.indVarNames is None:
            self.indVarNames = []
        self.hasDistanceFeatures = self.distanceFeatures is not None

        #### For User With Advanced License, Raise Error If No Independent Vars or distance features is provided ####
        if len(self.indVarNames) == 0 and not self.hasDistanceFeatures:
            ARCPY.AddIDMessage("ERROR", 110254)
            raise SystemExit()

        #### Shorthand Attributes ####
        ssdo = self.ssdo

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
            ARCPY.AddIDMessage("WARNING", 850, self.depVarName)

        #### Set All Vars List ####
        self.allVars = [self.depVarName] + self.indVarNames
        if self.hasDistanceFeatures:
            self.allVars += self.distanceFeatures.names

        #### Create Dependent Variable ####
        yData = ssdo.fields[self.depVarName].returnDouble()

        #### Round Data and Check Negative ####
        if self.family == "LOGIT":
            yData = UTILS.createBinaryVariable(yData)
        if self.family == "POISSON":
            yData = UTILS.createCountVariable(yData)

        self.n = ssdo.numObs
        self.ids = NUM.arange(self.n, dtype = NUM.int32)
        self.y = NUM.empty((self.n, 1), dtype = float)
        if yDataRealized is None:
            self.y[:,0] = yData
        else:
            self.y[:, 0] = yDataRealized

        #### Assure that Variance is Larger than Zero ####
        zeroVarFields = []
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            zeroVarFields.append(self.depVarName)

        #### Create Design Matrix ####
        self.k = len(self.allVars)
        self.x = NUM.ones((self.n, self.k), dtype = float)
        for column, variable in enumerate(self.indVarNames):
            if XDataRealized is None:
                varData = ssdo.fields[variable].data
            else:
                varData = XDataRealized[:, column]
            self.x[:,column + 1] = varData
            if varData.var() <= 0.0:
                zeroVarFields.append(variable)

        #### Add Distance Features ####
        self.varLabels = [ARCPY.GetIDMessage(84064)] + self.indVarNames
        if self.hasDistanceFeatures:
            ind = len(self.indVarNames) + 1
            for distName in self.distanceFeatures.names:
                distData = self.distanceFeatures.distances[distName]
                self.x[:, ind] = distData
                ind += 1
                self.varLabels.append(distName)
                if distData.var() <= 0.0:
                    zeroVarFields.append(distName)

        #### Error for Constant Fields ####
        if len(zeroVarFields):
            zeroNames = ", ".join(zeroVarFields)
            ARCPY.AddIDMessage("ERROR", 1588, zeroNames)
            raise SystemExit()

        ##### Check for Near Perfect Global Multicollinearity ####
        can_invert = ARC._ss.global_invert_check(self.x)
        if not can_invert:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

    def calculate(self):
        """Core Calculation Decision."""
        if self.continuous:
            self.__calculateOLS()
        else:
            self.__calculateGLM()

    def __calculateOLS(self):
        #### Shorthand Attributes ####
        ssdo = self.ssdo
        x = self.x
        y = self.y
        n = self.n
        k = self.k

        #### General Information ####
        fn = n * 1.0
        dof = n - k

        #### Assure DOF is Larger than 1 ####
        if dof <= 2:
            ARCPY.AddIDMessage("ERROR", 1128, 2)
            raise SystemExit()

        fdof = dof * 1.0
        xt = x.T
        yt = y.T
        xx = NUM.dot(xt, x)

        try:
            xxi = LA.inv(xx)
        except:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        #### Compute Coefficients ####
        xy = NUM.dot(xt, y)
        coef = NUM.dot(xxi, xy)

        #### Compute Standardized Coefficients ####
        ySTD = y.std()
        xSTD = x.std(0)
        stdRatio = xSTD / ySTD
        self.coefSTD = stdRatio * coef.flatten()

        #### Residuals, Sum Of Squares, R2, Etc. ####
        yHat = NUM.dot(x, coef)
        yBar = (y.sum())/fn
        e = y - yHat
        ess = ( NUM.dot(e.T, e) )[0][0]
        s2 = (ess / fdof)
        s2mle = (ess / fn)
        seResiduals = NUM.sqrt(s2)
        ss = y - yBar
        tss = ( NUM.dot(ss.T, ss) )[0][0]
        r2 = 1.0 - (ess/tss)
        r2Adj =  1.0 - ( (ess / (fdof)) / (tss / (fn-1)) )
        u2 = e * e

        #### Hard Coded Error For Perfect Model Explanation ####
        if r2 >= 1.0:
            ARCPY.AddIDMessage("ERROR", 110264)
            raise SystemExit()

        #### Variance-Covariance for Coefficients ####
        varBeta = xxi * s2

        #### Standard Errors / t-Statistics ####
        diagVarBeta = varBeta.diagonal()
        if (diagVarBeta < 0).sum() != 0:
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        seBeta = NUM.sqrt(diagVarBeta)
        tStat = (coef.T / seBeta).flatten()

        #### Bad Probabilities - Near Multicollinearity ####
        badProbs = NUM.isnan(seBeta).sum() != 0

        #### White's Robust Standard Errors ####
        dofScale =  (int( n / (n - k) )) * 1.0
        sHat = NUM.dot((u2 * x).T, x) * dofScale
        varBetaRob = NUM.dot(NUM.dot(xxi, sHat), xxi)
        diagVarBeta = varBetaRob.diagonal()
   
        if (diagVarBeta < 0).sum() != 0:
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        seBetaRob =  NUM.sqrt(diagVarBeta)
        tStatRob = (coef.T / seBetaRob).flatten()
        badRobProbs = NUM.isnan(seBetaRob).sum() != 0

        #### Fail For Invalid SQRT of Beta Var ####
        if badProbs or badRobProbs:
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        #### DOF Warning Once for t-Stats ####
        silentVector = [ True for i in range(k) ]
        if (2 <= dof <= 4) and not self.warnedTProb:
            silentVector[0] = False
            self.warnedTProb = True

        #### Coefficient t-Tests ####
        pVals = NUM.empty((k,), float)
        pValsRob = NUM.empty((k,), float)
        for varInd in UTILS.ssRange(k):
            #### General ####
            try:
                p = STATS.tProb(tStat[varInd], dof, type = 2,
                                silent = silentVector[varInd])
            except:
                p =  NUM.nan
                badProbs = True
            pVals[varInd] = p

            #### Robust ####
            try:
                p = STATS.tProb(tStatRob[varInd], dof, type = 2,
                                silent = True)
            except:
                p =  NUM.nan
                badProbs = True
            pValsRob[varInd] = p

        #### Jarque-Bera Test For Normality of the Residuals ####
        muE = (e.sum()) / fn
        devE = e - muE
        u3 = (devE**3.0).sum() / fn
        u4 = (devE**4.0).sum() / fn
        denomS = s2mle**1.5
        denomK = s2mle**2.0
        skew = u3 / denomS
        kurt = u4 / denomK
        self.JB = (n/6.) * ( skew**2. + ( (kurt - 3.)**2. / 4. ))
        if self.JB >= 0.0:
            self.JBProb = STATS.chiProb(self.JB, 2, type = 1)
        else:
            self.JBProb = NUM.nan
            badProbs = True

        #### Breusch-Pagan Test for Heteroskedasticity ####
        u2y = NUM.dot(xt, u2)
        bpCoef = NUM.dot(xxi, u2y)
        u2Hat = NUM.dot(x, bpCoef)
        eU = u2 - u2Hat
        essU = NUM.dot(eU.T, eU)
        u2Bar = (u2.sum()) / fn
        ssU = u2 - u2Bar
        tssU = NUM.dot(ssU.T, ssU)
        r2U = 1.0 - (essU/tssU)
        self.BP = (fn * r2U)[0][0]
        if self.BP >= 0.0:
            self.BPProb = STATS.chiProb(self.BP, (k-1), type = 1)
        else:
            self.BPProb = NUM.nan
            badProbs = True

        #### Classic Joint-Hypothesis F-Test ####
        q = k - 1
        fq = q * 1.0
        self.fStat = (r2/fq) / ((1 - r2) / (fn - k))

        if  self.fStat < 0:
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        try:
            self.fProb = abs(STATS.fProb(self.fStat, q,
                                      (n-k), type = 1))
        except:
            self.fProb = NUM.nan
            badProbs = True

        #### Wald Robust Joint Hypothesis Test ####
        R = NUM.zeros((q,k))
        R[0:,1:] = NUM.eye(q)
        Rb = NUM.dot(R, coef)

        try:
            invRbR = LA.inv( NUM.dot(NUM.dot(R, varBetaRob), R.T) )
        except:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        self.waldStat = ( NUM.dot(NUM.dot(Rb.T, invRbR), Rb) )[0][0]
        if self.waldStat >= 0.0:
            self.waldProb = STATS.chiProb(self.waldStat, q, type = 1)
        else:
            self.waldProb = NUM.nan
            badProbs = True

        #### Log-Likelihood ####
        self.logLik = -(n / 2.) * (1. + NUM.log(2. * NUM.pi)) - \
                       (n / 2.) * NUM.log(s2mle)

        #### AIC/AICc ####
        k1 = k + 1
        self.aic = -2. * self.logLik + 2. * k1
        self.aicc = -2. * self.logLik + 2. * k1 * (fn / (fn - k1 - 1))

        #### Set VIF ####
        self.__setVIF()

        #### Set Attributes ####
        self.dof = dof
        self.coef = coef
        self.yHat = yHat
        self.yBar = yBar
        self.residuals = e
        self.seResiduals = seResiduals
        self.stdResiduals = e / self.seResiduals
        self.ess = ess
        self.tss = tss
        self.varCoef = varBeta
        self.seCoef = seBeta
        self.tStats = tStat
        self.pVals = pVals
        self.varCoefRob = varBetaRob
        self.seCoefRob = seBetaRob
        self.tStatsRob = tStatRob
        self.pValsRob = pValsRob
        self.r2 = r2
        self.r2Adj = r2Adj
        self.s2 = s2
        self.s2mle = s2mle
        self.q = q
        self.badProbs = badProbs

    def __calculateGLM(self):
        xx = NUM.dot(self.x.T, self.x)

        try:
            xxi = LA.inv(xx)
        except:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        glr = ARC._ss.GLR(self.y, self.x, self.family)
        if not glr.can_global_invert:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        self.coef = glr.coef
        self.varCoef = glr.var_coef
        self.seCoef = NUM.sqrt(self.varCoef)
        self.globalDeviance = glr.global_deviance
        self.nullDeviance = glr.null_deviance
        self.globalNullPDev = 1.0 - (self.globalDeviance / self.nullDeviance)
        self.edof = glr.edof 
        self.v1 = glr.v1
        self.v2 = glr.v2
        self.influence = glr.influence
        self.yHat = glr.y_hat
        self.nullYHat = glr.null_y_hat
        self.yBar = glr.y_bar
        self.yPredicted = glr.y_predicted 
        self.nullPredicted = glr.null_predicted
        self.residuals = glr.residuals
        self.devResiduals = glr.dev_residuals
        self.ess = glr.ess

        #### Set Predicted Output ####
        self.yPredictedValue = NUM.array(NUM.round(self.yPredicted),
                                         dtype = float)

        #### Set Stats ####
        if self.family == "LOGIT":
            self.__setLogitStats()
        elif self.family == "POISSON":
            self.__setPoissonStats()

    def __setLogitStats(self):
        #### Get Confusion Matrix ####
        yr = self.y.ravel()
        onesBool = yr == 1.0
        predOnesBool = self.yPredictedValue == 1.0
        self.numOnes = onesBool.sum()
        self.numZeros = self.n - self.numOnes
        self.predOnes = predOnesBool.sum()
        self.predZeros = self.n - self.predOnes
        self.confusionMatrix = NUM.zeros((2,2), dtype = NUM.int32)
        self.confusionMatrix[0,0] = (~onesBool & ~predOnesBool).sum()
        self.confusionMatrix[1,0] = (onesBool & ~predOnesBool).sum()
        self.confusionMatrix[0,1] = (~onesBool & predOnesBool).sum()
        self.confusionMatrix[1,1] = (onesBool & predOnesBool).sum()

        #### Bad Probabilities - Near Multicollinearity ####
        badProbs = NUM.isnan(self.seCoef).sum() != 0

        #### Set Coef Z Values and P Values ####
        self.zStats = self.coef / self.seCoef

        #### Coefficient z-Tests and Odds Intervals ####
        self.pVals = NUM.empty((self.k,), float)
        self.oddsIntervals = NUM.empty((self.k,2), float)
        for varInd in UTILS.ssRange(self.k):
            #### General ####
            try:
                p = STATS.zProb(self.zStats[varInd], type = 2)
                interval = self.seCoef[varInd] * 1.96
                oddsUpper = NUM.exp(self.coef[varInd] + interval)
                oddsLower = NUM.exp(self.coef[varInd] - interval)
            except:
                p =  NUM.nan
                oddsUpper = NUM.nan
                oddsLower = NUM.nan
                badProbs = True
            self.pVals[varInd] = p
            self.oddsIntervals[varInd,0] = oddsLower
            self.oddsIntervals[varInd,1] = oddsUpper

        #### Set Odds Ratio ####
        self.oddsRatio = NUM.exp(self.coef)

        #### Set VIF ####
        self.__setVIF()

        #### Log Like Functions ####
        self.logLik = (yr * NUM.log(self.yPredicted) + ((1-yr)*NUM.log(1 - self.yPredicted))).sum()
        self.nullLogLik = (yr * NUM.log(self.nullPredicted) + ((1-yr)*NUM.log(1 - self.nullPredicted))).sum()

        #### Calculate Fit Stats ####
        self.__setGLMFitStats()

        #### AIC/AICc ####
        kn = self.k * 1.0
        fn = self.n + 1.0
        self.aic = -2. * self.logLik + 2. * kn
        self.aicc = -2. * self.logLik + 2. * kn * (fn / (fn - kn - 1))

        self.badProbs = badProbs

    def __setPoissonStats(self):
        """ Sets Poisson Specific Stats """

        #### Bad Probabilities - Near Multicollinearity ####
        badProbs = NUM.isnan(self.seCoef).sum() != 0

        #### Set Coef Z Values and P Values ####
        self.zStats = self.coef / self.seCoef

        #### Coefficient z-Tests and Odds Intervals ####
        self.pVals = NUM.empty((self.k,), float)
        for varInd in UTILS.ssRange(self.k):
            #### General ####
            try:
                p = STATS.zProb(self.zStats[varInd], type = 2)
            except:
                p =  NUM.nan
                badProbs = True
            self.pVals[varInd] = p

        #### Set VIF ####
        self.__setVIF()

        #### Log Like Functions ####
        self.logLik = 0.0
        self.nullLogLik = 0.0
        yr = self.y.ravel()
        for i in range(self.n):
            logFact = ARC._ss.log_factorial(int(yr[i]))
            self.logLik += ((yr[i] * self.yHat[i]) - self.yPredicted[i] - logFact)
            self.nullLogLik += ((yr[i] * self.nullYHat[i]) - self.nullPredicted[i] - logFact)

        #### Calculate Fit Stats ####
        self.__setGLMFitStats()

        #### AIC/AICc ####
        kn = self.k * 1.0
        fn = self.n + 1.0
        self.aic = int(-2. * self.logLik + 2. * kn)
        self.aicc = int(-2. * self.logLik + 2. * kn * (fn / (fn - kn - 1)))

        self.badProbs = badProbs

    def __setGLMFitStats(self):
        """Calculates LR and Wald Tests"""

        #### DOF for Fit Tests ####
        self.q = self.k - 1

        #### LR Test ####
        self.lrStat = 2 * (self.logLik - self.nullLogLik)
        if self.lrStat < 0.0:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        self.lrProb = STATS.chiProb(self.lrStat, self.q, type = 1)

        #### Wald Test ####
        self.waldStat = self.nullDeviance - self.globalDeviance
        if self.waldStat < 0.0:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()
        self.waldProb = STATS.chiProb(self.waldStat, self.q, type = 1)

    def __setVIF(self):
        """ Calculate the Variance Inflation Factor """
        if self.k <= 2:
            self.vifVal = ARCPY.GetIDMessage(84090)
            self.vif = False
        else:
            xTemp = self.x.T[1:]
            corX = NUM.corrcoef(xTemp)

            try:
                ic = LA.inv(corX)
            except:
                #### Perfect multicollinearity, cannot proceed ####
                ARCPY.AddIDMessage("ERROR", 639)
                raise SystemExit()

            self.vifVal = ic.diagonal()
            self.vif = True

    def getReport(self):
        """Generate Text and Graphical Output."""

        if self.family == "GAUSSIAN":
            self.__gaussianReport()
        elif self.family == "POISSON":
            self.__poissonReport()
        else:
            self.__logitReport()

        ARCPY.AddMessage(self.coefTable)
        ARCPY.AddMessage(self.diagTable)
        if self.family == "LOGIT":
            ARCPY.AddMessage(self.confusionTable)
        ARCPY.AddMessage(self.interpretTable)

        #### Report if Bad Probabilities Found ####
        if self.badProbs:
            ARCPY.AddIDMessage("WARNING", 738)

    def __gaussianReport(self):
        """Creates a formatted summary tables for OLS."""

        self.__gaussianCoefficientReport()
        self.__gaussianDiagnosticReport()
        self.__gaussianInterpretReport()

    def __poissonReport(self):
        """Creates a formatted summary table for Poisson."""

        self.__poissonCoefficientReport()
        self.__poissonDiagnosticReport()
        self.__poissonInterpretReport()

    def __logitReport(self):
        """Creates a formatted summary table for Poisson."""

        self.__logitCoefficientReport()
        self.__logitDiagnosticReport()
        self.__logitConfusionMatrix()
        self.__logitInterpretReport()

    def __gaussianCoefficientReport(self):
        """Creates a formatted summary table of the OLS
        coefficients."""

        #### Table Title ####
        header =  ARCPY.GetIDMessage(84867).format(ARCPY.GetIDMessage(84868))
        aFoot = ARCPY.GetIDMessage(84080)
        bFoot = ARCPY.GetIDMessage(84086)
        cFoot = ARCPY.GetIDMessage(84103)
        coefColLab = [ARCPY.GetIDMessage(84049), UTILS.buildSuperscript(aFoot)]
        probColLab = [ARCPY.GetIDMessage(84055), UTILS.buildSuperscript(bFoot)]
        robColLab = [ARCPY.GetIDMessage(84102), UTILS.buildSuperscript(bFoot)]
        vifColLab = [ARCPY.GetIDMessage(84284), UTILS.buildSuperscript(cFoot)]

        #### Column Labels ####
        total = []
        total.append("EMPTY")
        total.append([ARCPY.GetIDMessage(84068), coefColLab,
                  ARCPY.GetIDMessage(84051), ARCPY.GetIDMessage(84053),
                  probColLab, ARCPY.GetIDMessage(84097),
                  ARCPY.GetIDMessage(84101), robColLab])

        if self.vif:
            total[1].append(vifColLab)

        #### Loop Through Explanatory Variables ####
        for row in UTILS.ssRange(self.k):
            #### Variable Name ####
            rowVals = [self.varLabels[row]]

            #### Standard Values ####
            rowVals.append(UTILS.formatValue(self.coef[row, 0]))
            rowVals.append(UTILS.formatValue(self.seCoef[row]))
            rowVals.append(UTILS.formatValue(self.tStats[row]))
            rowVals.append(UTILS.writePVal(self.pVals[row], padNonSig = True, returnHTMLElement=True))

            #### Robust Values ####
            rowVals.append(UTILS.formatValue(self.seCoefRob[row]))
            rowVals.append(UTILS.formatValue(self.tStatsRob[row]))
            rowVals.append(UTILS.writePVal(self.pValsRob[row],
                                           padNonSig = True, returnHTMLElement=True))

            #### VIF ####
            if self.vif:
                if row == 0:
                    rowVIF = ARCPY.GetIDMessage(84092)
                else:
                    rowVIF = self.vifVal[(row - 1)]
                    if abs(rowVIF) > 1000:
                        rowVIF = "> 1000.0"
                    else:
                        rowVIF = LOCALE.format_string("%0.6f", rowVIF)
                rowVals.append(rowVIF)

            #### Append Row to Result List ####
            total.append(rowVals)

        total.append("EMPTY")

        #### Finalize Coefficient Table ####
        self.coefTable = UTILS.outputTextTable(total, header = header,
                                               pad = 1, justify = "right",
                                               titleFillToken = "-",
                                               emptyFillToken = "-", returnHTMLMsg=True,
                                               force2Txt=False)

    def __poissonCoefficientReport(self):
        """Creates a formatted summary table of the OLS
        coefficients."""

        #### Table Title ####
        header =  ARCPY.GetIDMessage(84867).format(ARCPY.GetIDMessage(84870))
        aFoot = ARCPY.GetIDMessage(84080)
        bFoot = ARCPY.GetIDMessage(84086)
        cFoot = ARCPY.GetIDMessage(84103)
        coefColLab = [ARCPY.GetIDMessage(84049), UTILS.buildSuperscript(aFoot)]
        probColLab = [ARCPY.GetIDMessage(84055), UTILS.buildSuperscript(bFoot)]
        vifColLab = [ARCPY.GetIDMessage(84284), UTILS.buildSuperscript(cFoot)]

        #### Column Labels ####
        total = []
        total.append("EMPTY")
        total.append([ARCPY.GetIDMessage(84068), coefColLab,
                  ARCPY.GetIDMessage(84051), ARCPY.GetIDMessage(84871),
                  probColLab])

        if self.vif:
            total[1].append(vifColLab)

        #### Loop Through Explanatory Variables ####
        for row in UTILS.ssRange(self.k):
            #### Variable Name ####
            rowVals = [self.varLabels[row]]

            #### Standard Values ####
            rowVals.append(UTILS.formatValue(self.coef[row]))
            rowVals.append(UTILS.formatValue(self.seCoef[row]))
            rowVals.append(UTILS.formatValue(self.zStats[row]))
            rowVals.append(UTILS.writePVal(self.pVals[row], padNonSig = True, returnHTMLElement=True))

            #### VIF ####
            if self.vif:
                if row == 0:
                    rowVIF = ARCPY.GetIDMessage(84092)
                else:
                    rowVIF = self.vifVal[(row - 1)]
                    if abs(rowVIF) > 1000:
                        rowVIF = "> 1000.0"
                    else:
                        rowVIF = LOCALE.format_string("%0.6f", rowVIF)
                rowVals.append(rowVIF)

            #### Append Row to Result List ####
            total.append(rowVals)

        total.append("EMPTY")

        #### Finalize Coefficient Table ####
        self.coefTable = UTILS.outputTextTable(total, header = header,
                                               pad = 1, justify = "right",
                                               titleFillToken = "-",
                                               emptyFillToken = "-", returnHTMLMsg=True,
                                               force2Txt=False)

    def __logitCoefficientReport(self):
        """Creates a formatted summary table of the OLS
        coefficients."""

        #### Table Title ####
        header =  ARCPY.GetIDMessage(84867).format(ARCPY.GetIDMessage(84869))
        aFoot = ARCPY.GetIDMessage(84080)
        bFoot = ARCPY.GetIDMessage(84086)
        cFoot = ARCPY.GetIDMessage(84103)
        dFoot = ARCPY.GetIDMessage(84104)
        eFoot = ARCPY.GetIDMessage(84105)
        coefColLab = [ARCPY.GetIDMessage(84049), UTILS.buildSuperscript(aFoot)]
        probColLab = [ARCPY.GetIDMessage(84055), UTILS.buildSuperscript(bFoot)]
        oddsColLab = [ARCPY.GetIDMessage(84872), UTILS.buildSuperscript(cFoot)]
        lowColLab = [ARCPY.GetIDMessage(84873), UTILS.buildSuperscript(dFoot)]
        highColLab = [ARCPY.GetIDMessage(84874), UTILS.buildSuperscript(dFoot)]
        vifColLab = [ARCPY.GetIDMessage(84284), UTILS.buildSuperscript(eFoot)]

        #### Column Labels ####
        total = []
        total.append("EMPTY")
        total.append([ARCPY.GetIDMessage(84068), coefColLab,
                      ARCPY.GetIDMessage(84051), ARCPY.GetIDMessage(84871),
                      probColLab, oddsColLab, lowColLab, highColLab])

        if self.vif:
            total[1].append(vifColLab)

        #### Loop Through Explanatory Variables ####
        for row in UTILS.ssRange(self.k):
            #### Variable Name ####
            rowVals = [self.varLabels[row]]

            #### Standard Values ####
            rowVals.append(UTILS.formatValue(self.coef[row]))
            rowVals.append(UTILS.formatValue(self.seCoef[row]))
            rowVals.append(UTILS.formatValue(self.zStats[row]))
            rowVals.append(UTILS.writePVal(self.pVals[row], padNonSig = True, returnHTMLElement=True))

            #### Odds Values ####
            rowVals.append(UTILS.formatValue(self.oddsRatio[row]))
            rowVals.append(UTILS.formatValue(self.oddsIntervals[row,0]))
            rowVals.append(UTILS.formatValue(self.oddsIntervals[row,1]))

            #### VIF ####
            if self.vif:
                if row == 0:
                    rowVIF = ARCPY.GetIDMessage(84092)
                else:
                    rowVIF = self.vifVal[(row - 1)]
                    if abs(rowVIF) > 1000:
                        rowVIF = "> 1000.0"
                    else:
                        rowVIF = LOCALE.format_string("%0.6f", rowVIF)
                rowVals.append(rowVIF)

            #### Append Row to Result List ####
            total.append(rowVals)

        total.append("EMPTY")

        #### Finalize Coefficient Table ####
        self.coefTable = UTILS.outputTextTable(total, header = header,
                                               pad = 1, justify = "right",
                                               titleFillToken = "-",
                                               emptyFillToken = "-", returnHTMLMsg=True,
                                               force2Txt=False)

    def __gaussianDiagnosticReport(self):
        """Creates a formatted summary table of the OLS
        diagnostics."""

        #### Create PValue Array ####
        allPVals = NUM.array( [self.fProb, self.waldProb,
                               self.BPProb, self.JBProb] )

        #### Check For Any Significance for Extra Padding ####
        signFlag = NUM.any(allPVals <= 0.05)

        #### Table Title ####
        header = ARCPY.GetIDMessage(84885)
        feet = [84104, 84105, 84106, 84107]
        feet = [ ARCPY.GetIDMessage(i) for i in feet ]
        dFoot, eFoot, fFoot, gFoot = feet
        dFoot = ARCPY.GetIDMessage(84104)

        row1 = [ARCPY.GetIDMessage(84253),
                self.ssdo.inName,
                '  ' + ARCPY.GetIDMessage(84254),
                UTILS.padValue(self.depVarName, significant = signFlag)]

        aiccLab = ['  ' + ARCPY.GetIDMessage(84251), UTILS.buildSuperscript(dFoot)]
        row2 = [ARCPY.GetIDMessage(84093),
                str(self.n), aiccLab,
                UTILS.padValue(UTILS.formatValue(self.aicc),
                               significant = signFlag)]

        r2Lab = [ARCPY.GetIDMessage(84019), UTILS.buildSuperscript(dFoot)]
        adjR2Lab = ['  ' + ARCPY.GetIDMessage(84022), UTILS.buildSuperscript(dFoot)]
        row3 = [r2Lab, UTILS.formatValue(self.r2),
                adjR2Lab,
                UTILS.padValue(UTILS.formatValue(self.r2Adj),
                               significant = signFlag)]

        fdofLab = ARCPY.GetIDMessage(84028)
        fLab = [ARCPY.GetIDMessage(84025), UTILS.buildSuperscript(eFoot)]
        row4 = [fLab, UTILS.formatValue(self.fStat),
                "  " + fdofLab.format(self.q, self.dof),
                UTILS.writePVal(self.fProb, padNonSig = True, returnHTMLElement=True)]

        chiMess = ARCPY.GetIDMessage(84034)
        wLab = [ARCPY.GetIDMessage(84031), UTILS.buildSuperscript(eFoot)]
        row5 = [wLab, UTILS.formatValue(self.waldStat),
                "  " + chiMess.format(self.q),
                UTILS.writePVal(self.waldProb, padNonSig = True, returnHTMLElement=True)]

        kLab = [ARCPY.GetIDMessage(84037), UTILS.buildSuperscript(fFoot)]
        row6 = [kLab, UTILS.formatValue(self.BP),
                '  '+ chiMess.format(self.q),
                UTILS.writePVal(self.BPProb, padNonSig = True, returnHTMLElement=True)]

        jbLab = [ARCPY.GetIDMessage(84043), UTILS.buildSuperscript(gFoot)]
        row7 = [jbLab, UTILS.formatValue(self.JB),
                '  '+ chiMess.format(2),
                UTILS.writePVal(self.JBProb, padNonSig = True, returnHTMLElement=True)]

        #### Finalize Diagnostic Table ####
        diagTotal = [ "EMPTY", row1, row2, row3, row4, row5, row6, row7, "EMPTY" ]
        diagJustify = ["left", "right", "left", "right"]

        self.diagTable = UTILS.outputTextTable(diagTotal,
                                header = header, pad = 1,
                                justify = diagJustify,
                                titleFillToken = "-", emphasizeHeadRow=False,
                                emptyFillToken = "-", returnHTMLMsg=True, force2Txt=False)

    def __poissonDiagnosticReport(self):
        """Creates a formatted summary table of the GLR Poisson
        diagnostics."""

        #### Check For Any Significance for Extra Padding ####
        signFlag = self.waldProb <= 0.05

        #### Table Title ####
        header = ARCPY.GetIDMessage(84885)
        feet = [84104, 84105, 84106]
        feet = [ ARCPY.GetIDMessage(i) for i in feet ]
        dFoot, eFoot, fFoot = feet

        row1 = [ARCPY.GetIDMessage(84253),
                self.ssdo.inName,
                '  ' + ARCPY.GetIDMessage(84254),
                UTILS.padValue(self.depVarName, significant = signFlag)]

        aiccLab = ['  ' + ARCPY.GetIDMessage(84251), UTILS.buildSuperscript(dFoot)]
        row2 = [ARCPY.GetIDMessage(84093),
                str(self.n), aiccLab,
                UTILS.padValue(UTILS.formatValue(self.aicc),
                               significant = signFlag)]

        meansLab = ARCPY.GetIDMessage(84878)
        pDevLab = ['  ' + ARCPY.GetIDMessage(84877), UTILS.buildSuperscript(eFoot)]
        row3 = [meansLab, UTILS.formatValue(self.yBar),
                pDevLab,
                UTILS.padValue(UTILS.formatValue(self.globalNullPDev),
                               significant = signFlag)]

        chiMess = ARCPY.GetIDMessage(84034)
        wLab = [ARCPY.GetIDMessage(84031), UTILS.buildSuperscript(fFoot)]
        row4 = [wLab, UTILS.formatValue(self.waldStat),
                "  " + chiMess.format(self.q),
                UTILS.writePVal(self.waldProb, padNonSig = True, returnHTMLElement=True)]

        #### Finalize Diagnostic Table ####
        diagTotal = [ "EMPTY", row1, row2, row3, row4, "EMPTY" ]
        diagJustify = ["left", "right", "left", "right"]

        self.diagTable = UTILS.outputTextTable(diagTotal,
                                header = header, pad = 1,
                                justify = diagJustify,
                                titleFillToken = "-", emphasizeHeadRow=False,
                                emptyFillToken = "-", returnHTMLMsg=True, force2Txt=False)

    def __logitDiagnosticReport(self):
        """Creates a formatted summary table of the GLR Poisson
        diagnostics."""

        #### Check For Any Significance for Extra Padding ####
        signFlag = self.waldProb <= 0.05

        #### Table Title ####
        header = ARCPY.GetIDMessage(84885)
        feet = [84106, 84107, 84875]
        feet = [ ARCPY.GetIDMessage(i) for i in feet ]
        fFoot, gFoot, hFoot = feet

        row1 = [ARCPY.GetIDMessage(84253),
                self.ssdo.inName,
                '  ' + ARCPY.GetIDMessage(84254),
                UTILS.padValue(self.depVarName, significant = signFlag)]

        aiccLab = ['  ' + ARCPY.GetIDMessage(84251), UTILS.buildSuperscript(fFoot)]
        row2 = [ARCPY.GetIDMessage(84093),
                str(self.n), aiccLab,
                UTILS.padValue(UTILS.formatValue(self.aicc),
                               significant = signFlag)]

        onesLab = ARCPY.GetIDMessage(84876)
        pDevLab = ['  ' + ARCPY.GetIDMessage(84877), UTILS.buildSuperscript(gFoot)]
        row3 = [onesLab, UTILS.formatValue(self.numOnes, "%i"),
                pDevLab,
                UTILS.padValue(UTILS.formatValue(self.globalNullPDev),
                               significant = signFlag)]

        chiMess = ARCPY.GetIDMessage(84034)
        wLab = [ARCPY.GetIDMessage(84031), UTILS.buildSuperscript(hFoot)]
        row4 = [wLab, UTILS.formatValue(self.waldStat),
                "  " + chiMess.format(self.q),
                UTILS.writePVal(self.waldProb, padNonSig = True, returnHTMLElement=True)]

        #### Finalize Diagnostic Table ####
        diagTotal = ["EMPTY", row1, row2, row3, row4, "EMPTY"]
        diagJustify = ["left", "right", "left", "right"]

        self.diagTable = UTILS.outputTextTable(diagTotal,
                                header = header, pad = 1,
                                justify = diagJustify,
                                titleFillToken = "-", emphasizeHeadRow=False,
                                emptyFillToken = "-", returnHTMLMsg=True, force2Txt=False)

    def __logitConfusionMatrix(self):
        """Creates Logit Confusion Matrix."""

        header = ARCPY.GetIDMessage(84887)
        values = ["%i"%i for i in self.confusionMatrix.ravel()]
        rows = ["EMPTY"]
        rows.append([UTILS.buildTableCell("", rowSpan=2, colSpan=2), "@@none",
                     UTILS.buildTableCell(ARCPY.GetIDMessage(84338), colSpan=2, bold=True), "@@none"])
        rows.append(["@@none", "@@none", "0", "1"])
        rows.append([UTILS.buildTableCell(ARCPY.GetIDMessage(84886), rowSpan=2, bold=True), "0", values[0], values[1]])
        rows.append(["@@none", "1", values[2], values[3]])
        rows.append("EMPTY")

        self.confusionTable = UTILS.outputTextTable(rows,
                                header = header, pad = 1,
                                justify = "center",
                                titleFillToken = "-",
                                emptyFillToken = "-", emphasizeHeadRow=False,
                                tableSize="small", returnHTMLMsg=True)

    def __gaussianInterpretReport(self):
        """Creates the interpretation table for OLS."""

        #### Generate Interpretation Table #####
        header =  ARCPY.GetIDMessage(84081)

        #### Set up Rows in Tables ####
        decimalSep = UTILS.returnDecimalChar()
        if decimalSep == ".":
            pValue = "0.01"
            VIF = "7.5"
        else:
            pValue = "0,01"
            VIF = "7,5"

        significance = [ARCPY.GetIDMessage(84111), ARCPY.GetIDMessage(84082).format(pValue)]
        coefficient = [ARCPY.GetIDMessage(84080), ARCPY.GetIDMessage(84349)]
        probs = [ARCPY.GetIDMessage(84086), ARCPY.GetIDMessage(84350).format(pValue)]
        multicoll = [ARCPY.GetIDMessage(84103), ARCPY.GetIDMessage(84083).format(VIF)]
        rSquared = [ARCPY.GetIDMessage(84104), ARCPY.GetIDMessage(84084)]
        jointFW = [ARCPY.GetIDMessage(84105), ARCPY.GetIDMessage(84085).format(pValue)]
        bpRow = [ARCPY.GetIDMessage(84106), ARCPY.GetIDMessage(84087).format(pValue)]
        jbRow = [ARCPY.GetIDMessage(84107), ARCPY.GetIDMessage(84088).format(pValue)]

        #### Finalize Interpretation Table ####
        intTotal = [significance, coefficient, probs, multicoll,
                    rSquared, jointFW, bpRow, jbRow]

        self.interpretTable = UTILS.outputTextTable(intTotal, pad = 1, header=header,
                                                    titleFillToken="-",  emphasizeHeadRow=False,
                                                    justify = ["center", "left"], returnHTMLMsg=True, force2Txt=False)

    def __poissonInterpretReport(self):
        """Creates the interpretation table for OLS."""

        #### Generate Interpretation Table #####
        header =  ARCPY.GetIDMessage(84081)

        #### Set up Rows in Tables ####
        decimalSep = UTILS.returnDecimalChar()
        if decimalSep == ".":
            pValue = "0.01"
            VIF = "7.5"
        else:
            pValue = "0,01"
            VIF = "7,5"

        significance = [ARCPY.GetIDMessage(84111), ARCPY.GetIDMessage(84082).format(pValue)]
        coefficient = [ARCPY.GetIDMessage(84080), ARCPY.GetIDMessage(84349)]
        probs = [ARCPY.GetIDMessage(84086), ARCPY.GetIDMessage(84882).format(pValue)]
        multicoll = [ARCPY.GetIDMessage(84103), ARCPY.GetIDMessage(84083).format(VIF)]
        aicc = [ARCPY.GetIDMessage(84104), ARCPY.GetIDMessage(84883)]
        dev = [ARCPY.GetIDMessage(84105), ARCPY.GetIDMessage(84881)]
        wald = [ARCPY.GetIDMessage(84106), ARCPY.GetIDMessage(84884).format(pValue)]

        #### Finalize Interpretation Table ####
        intTotal = [significance, coefficient, probs, multicoll, aicc, dev, wald]

        self.interpretTable = UTILS.outputTextTable(intTotal, pad = 1, header=header,
                                                    titleFillToken="-", emphasizeHeadRow=False,
                                                    justify = ["center", "left"], returnHTMLMsg=True, force2Txt=False)

    def __logitInterpretReport(self):
        """Creates the interpretation table for OLS."""

        #### Generate Interpretation Table #####
        header =  ARCPY.GetIDMessage(84081)

        #### Set up Rows in Tables ####
        decimalSep = UTILS.returnDecimalChar()
        if decimalSep == ".":
            pValue = "0.01"
            VIF = "7.5"
        else:
            pValue = "0,01"
            VIF = "7,5"

        significance = [ARCPY.GetIDMessage(84111), ARCPY.GetIDMessage(84082).format(pValue)]
        coefficient = [ARCPY.GetIDMessage(84080), ARCPY.GetIDMessage(84349)]
        probs = [ARCPY.GetIDMessage(84086), ARCPY.GetIDMessage(84882).format(pValue)]
        odds = [ARCPY.GetIDMessage(84103), ARCPY.GetIDMessage(84879)]
        inter = [ARCPY.GetIDMessage(84104), ARCPY.GetIDMessage(84880)]
        multicoll = [ARCPY.GetIDMessage(84105), ARCPY.GetIDMessage(84083).format(VIF)]
        aicc = [ARCPY.GetIDMessage(84106), ARCPY.GetIDMessage(84883)]
        dev = [ARCPY.GetIDMessage(84107), ARCPY.GetIDMessage(84881)]
        wald = [ARCPY.GetIDMessage(84875), ARCPY.GetIDMessage(84884).format(pValue)]

        #### Finalize Interpretation Table ####
        intTotal = [significance, coefficient, probs, odds, inter, multicoll, aicc, dev, wald]

        self.interpretTable = UTILS.outputTextTable(intTotal, pad = 1, header=header,
                                                    titleFillToken="-", emphasizeHeadRow=False,
                                                    justify = ["center", "left"], returnHTMLMsg=True, force2Txt=False)

    def getGLRInfo(self, storeStats = True):
        """ Create a basic copy of GLR """

        listVariables = ["family","coef","k", "vif", "seCoef", "tStats","fStat","dof",
                        "pVals","seCoefRob","tStatsRob","pValsRob",
                        "vifVal","fProb","waldProb","BPProb","JBProb",
                        "aicc","r2","r2Adj","fStat""fProb","waldStat",
                        "q","waldProb","BP","JB","zStats","oddsRatio",
                        "oddsIntervals","yBar","globalNullPDev","numOnes",
                        "confusionMatrix","n","varLabels","depVarName"]

        if not storeStats:
            listVariables = ["family","coef","k"]

        values = {}
        for var in listVariables:
            if hasattr(self, var):
                values[fr"GLR_{var}"] = eval(fr"self.{var}")

        return values

    def __initModelObj(self, initBasicObject):
        """ Initialize GLR object from a dictionary """

        ### These variables are used to recreate the GLR object ###
        depVarName = initBasicObject.yField.name
        indVarNames = initBasicObject.getVariablesByType(attr = "variableType", valueToFind = "Numeric", getObj = False, source = "FC")
        dist = initBasicObject.getVariablesByType(attr = "source", valueToFind = "DIST", getObj = False)
        hasDistanceFeatures = len(dist) > 0

        ### required for printing report using GLR class ###
        fakeSSDO = UTILS.DictToClass({"inName":"---"})
        setattr(self, "ssdo", fakeSSDO)

        setattr(self, "depVarName", depVarName)
        setattr(self, "indVarNames", indVarNames)
        setattr(self, "hasDistanceFeatures", hasDistanceFeatures)

        for ele in initBasicObject.otherAttr:
            setattr(self, ele.replace("GLR_",""), initBasicObject.otherAttr[ele])
            if ele == "GLR_family":
                if initBasicObject.otherAttr[ele] == "GAUSSIAN":
                    setattr(self, "continuous", True)
                else:
                    setattr(self, "continuous", False)

    def saveModel(self, modelOutput, outDistNames = None):
        """ Save GLR model 
        INPUT:
            modelOutput {str} : model file output
            outDistNames {list (str) / None}: List of distances Features names
        """
        UTILS.checkOutputPath(modelOutput, "FILE", ["SSM"])

        yf = UTILS.ModelVariable()
        yField = self.ssdo.fields[self.depVarName.upper()]
        yf.name = self.depVarName
        yf.alias= yField.alias
        yf.source = "FC"
        yf.fieldType = yField.type
        yf.info= ""
        yf.index = -1

        if self.family == "GAUSSIAN":
            yf.rfType = "Numeric"
        if self.family in ["LOGIT","POISSON"] :
            yf.rfType = "Categorical"
            if yf.fieldType.upper() in ["LONG", "SHORT", "SMALLINTEGER", "INTEGER"]:
                yf.info = [int(e) for e in NUM.unique(yField.data)]
            if yf.fieldType.upper() in ["FLOAT", "SINGLE", "DOUBLE"]:
                yf.info = [float(e) for e in NUM.unique(yField.data)]
        if self.family in ["POISSON"]:
             yf.rfType = "Numeric"

        fields = []
        cnt = 0
        for fieldName in self.indVarNames:
            xf = UTILS.ModelVariable()
            xField = self.ssdo.fields[fieldName.upper()]
            xf.name = fieldName
            xf.alias= xField.alias
            xf.source = "FC"
            xf.fieldType = xField.type
            xf.rfType = "Numeric"
            xf.index = cnt
            xf.info= ""
            fields.append(xf)
        unit = None
        if outDistNames is not None:
            unit = UTILS.getDistanceUnit(self.ssdo, False)
            for fieldName in outDistNames:
                xf = UTILS.ModelVariable()
                xf.name = fieldName
                xf.alias= fieldName
                xf.source = "DIST"
                xf.fieldType = "DOUBLE"
                xf.rfType = "Numeric"
                xf.index = cnt
                xf.info= ""
                xf.unit = unit
                fields.append(xf)

        modelOut = UTILS.ModelMetadata()
        modelOut.fields = fields
        modelOut.yField = yf
        modelOut.modelType = "GLR"
        modelOut.otherAttr = self.getGLRInfo()

        if outDistNames is not None: 
            modelOut.distanceUnit = unit

        modelOut.saveInfo(modelOutput, modelType = "GLR")

def predictFromModel(trainedModelVariables, parameters, justDescribe = False):
    """
    Predict features From Model File
    INPUT:
        trainedModelVariables {instance of ModelMetadata}: Model Information
        parameters {list of parameters}: List of parameter from Model to predict tool
    Return:
        None
    """
    ### Create an instance of GLR object using the model varibles ####
    glr = GLR(None, None, None, None, None, trainedModelVariables)
    glr.badProbs = False
    glr.getReport()

    ### Only describe the model ####
    if justDescribe:
        return

    predictInputFC = UTILS.getTextParameter(2, parameters)
    predictVT = parameters[5].value
    matchDistances = UTILS.getTextParameterMatch(6, parameters, 
                              ["MappingLayerObject","mp.Layer"])
    predictOutputFC = UTILS.getTextParameter(3, parameters)


    #### Parse Matching Field Names ####
    predVarNames = []
    if predictVT is not None:
        varEntry = [ vRow[0] if not hasattr(vRow[0],"value") else vRow[0].value for vRow in predictVT]
        predVarNames = [i.upper() for i in varEntry]

    #### New Field Type Checker ####
    checker = UTILS.ExecuteNewFieldTypeChecker(predictInputFC, predictOutputFC, fields = predVarNames)

    #### Create Prediction SSDataObject ####
    ssdoPred = SSDO.SSDataObject(predictInputFC)
    ssdoPred.obtainData(ssdoPred.oidName, predVarNames)

    #### Get Matching Distance Features ####
    if matchDistances is not None:
        distEntry = [f[0] for f in matchDistances]
        dfPred = WU.DistanceFeatures(ssdoPred, trainedModelVariables.distanceUnit, forceNear = True)
        for fc in distEntry:
            dfPred.addFeatures(fc)
    else:
        dfPred = None

    predictGLR = PredictGLR(glr)
    predictGLR.createPredictionFC(ssdoPred, predictOutputFC, 
                                  indVarNames = predVarNames,
                                  distanceFeatures = dfPred)

    fullLayerPath = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], 
                             "Resources", "ArcToolbox", "Templates", "Layers")

    #### Render Predictions ####
    if glr.family == "LOGIT":
        if ssdoPred.shapeType.upper() == "POINT":
            predLYR = "GWR_Predict_Points_Binary.lyrx"
        else:
            predLYR = "GWR_Predict_Polygons_Binary.lyrx"
    elif glr.family == "POISSON":
        if ssdoPred.shapeType.upper() == "POINT":
            predLYR = "GWR_Predict_Points_Count.lyrx"
        else:
            predLYR = "GWR_Predict_Polygons_Count.lyrx"
    else:
        if ssdoPred.shapeType.upper() == "POINT":
            predLYR = "GWR_Predict_Points.lyrx"
        else:
            predLYR = "GWR_Predict_Polygons.lyrx"

    parameters[3].symbology = OS.path.join(fullLayerPath, 
                                            predLYR)

class LocalGLRSensitivity():
    def __init__(self, in_feature,
            dependent_variable,
            model_type,
            # org_glr_output,
            out_simulation_table,
            output_features,
            explanatory_variables,
            distance_features,
            prediction_locations,
            explanatory_variables_to_match,
            explanatory_distance_matching,
            output_predicted_features,
            output_trained_model,
            sensitivity_info,
            parameters):
        
        self.inputFC = in_feature
        self.dependentVar = dependent_variable
        self.modelType = model_type
        self.outSimTable = out_simulation_table
        self.outputFC = output_features
        self.expVars = explanatory_variables

        if self.expVars is None:
            self.expVars = []

        self.distFeatures = distance_features
        # self.predLocs = prediction_locations
        # self.expVarToMatch = explanatory_variables_to_match
        self.sensitivityInfo = sensitivity_info
        self.parameters = parameters
        self.ssdo = None
        # self.glr = None

    def execute(self):
        import SSAttributeUncertainty as SSU
        import scipy.stats as SPSTAT

        inputFC = self.inputFC
        dependent_variable = self.dependentVar.upper()
        fields = set()
        fields.add(dependent_variable)
        for exp_var in self.expVars:
            fields.add(exp_var.upper())

        simulatedFields = []
        if self.sensitivityInfo['uncertainty_measure'] == "MOE":
            senFields = self.sensitivityInfo['moe_field'].split(";")
            moeFields = []
            dictFlds = {}
            for f in senFields:
                parts = f.split(" ")
                moe = parts[1]
                if moe not in ['',' ', None, '#']:
                    moeFields.append(moe.upper())
                    dictFlds[parts[0].upper()] = moe.upper()
                    simulatedFields.append(parts[0].upper())
                else:
                    moeFields.append("")
            sensitivity = {"MOE": moeFields}
            sensitivity["MOE_DICT"] = dictFlds

            for field in moeFields:
                if field != "":
                    fields.add(field.upper())

        if self.sensitivityInfo['uncertainty_measure'] == "CONFIDENCE_BOUNDS":
            senFields = self.sensitivityInfo['confidence_bound_field'].split(";")
            lowerBounds = []
            upperBounds = []
            dictFlds = {}
            for i in range(len(senFields)):
                senFieldList = senFields[i].split(" ")
                lowBound = senFieldList[1] if senFieldList[1] not in [' ', None, '#'] else ''
                upBound = senFieldList[2] if senFieldList[2] not in [' ', None, '#'] else ''
                if lowBound == '' and upBound == '': 
                    continue

                dictFlds[senFieldList[0].upper()] = (lowBound.upper(), upBound.upper()) 
                lowerBounds.append(lowBound)
                upperBounds.append(upBound)
                simulatedFields.append(senFieldList[0].upper())
            sensitivity = {"lowField": lowerBounds, "highField": upperBounds}
            sensitivity["CONFIDENCE_BOUNDS_DICT"] = dictFlds

            for lowField, upField in zip(lowerBounds, upperBounds):
                if lowField != "":
                    fields.add(lowField.upper())
                if upField != "":
                    fields.add(upField.upper())

        if self.sensitivityInfo['uncertainty_measure'] == "PERCENTAGE":
            senFields = self.sensitivityInfo['randomize_pct'].split(";")
            percentBelow = [UTILS.strToFloat(f.split(" ")[1]) for f in senFields]
            percentAbove = [UTILS.strToFloat(f.split(" ")[2]) for f in senFields]
            sensitivity = {"percentageLow": percentBelow, "percentageHigh": percentAbove}
            sensitivity["PERCENTAGE_DICT"] = {f.split(" ")[0].upper(): (UTILS.strToFloat(f.split(" ")[1]), UTILS.strToFloat(f.split(" ")[2])) for f in senFields}
            simulatedFields = [f.split(" ")[0].upper() for f in senFields]

        sensitivity['SIMULATED_FIELDS'] = simulatedFields
        sensitivity.update(self.sensitivityInfo)
        varNameList = list(fields)
        outputFC = self.outputFC

        #### Create SSDataObject ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC=outputFC)
        allVars = varNameList # [dependent_variable] + explanatory_variables
        ssdo.obtainData(ssdo.oidName, allVars, minNumObs=5)
        self.ssdo = ssdo

        #### Get Family ####
        family = convertFamilyType[self.modelType]

        #### Get Distance Features ####
        if self.distFeatures is not None:
            unit = UTILS.getDistanceUnit(ssdo)
            df = WU.DistanceFeatures(ssdo, unit, forceNear = True)
            fcList = self.distFeatures.split(";")
            for fc in fcList:
                df.addFeatures(fc.replace("'", ""))
        else:
            df = None

        #### Obtain Random Seed from Environment ####
        seed = UTILS.getRandomSeed()

        #### Generate Seed if It is not Provided ####
        if seed == 0:
            seed = int(NUM.random.randint(1000000))

        msg = ARCPY.GetIDMessage(84821)
        ARCPY.AddMessage(msg.format(seed))

        NUM.random.seed(seed)

        numSimulations = int(self.sensitivityInfo["num_simulations"])
        seeds = NUM.arange(numSimulations * 5000)

        NUM.random.shuffle(seeds)
        seeds = seeds[0:numSimulations]
        self.orgSens = 0
        self.orgAcc = 0
        self.orgDev = 0
        if self.modelType in ["CONTINUOUS", "BINARY", "COUNT"]:
            expVarUpper = [expVar.upper() for expVar in self.expVars]
            glr = GLR(ssdo, dependent_variable, expVarUpper, family=family, distanceFeatures=df)
            glr.initialize()
            glr.calculate()
            if self.modelType == "BINARY":
                countOne = glr.yPredictedValue.ravel().astype('int32')
                yData = ssdo.fields[dependent_variable].returnDouble()
                self.orgAcc = (countOne == yData).sum() / len(yData)

                TP = ((countOne == 1) & (yData == 1)).sum()
                FN = ((countOne == 0) & (yData == 1)).sum()
                self.orgSens = TP / (TP + FN)
            elif self.modelType == "COUNT":
                self.orgDev = glr.globalNullPDev
            else:
                self.orgR2val = glr.r2
        # output candidate fields
        simMinY = SSDO.CandidateField("SimMinY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                      dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220936)))
        simMaxY = SSDO.CandidateField("SimMaxY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                      dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220934)))
        simMedY = SSDO.CandidateField("SimMedY", "Double", NUM.zeros(ssdo.numObs), 
                                      dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220937)))
        if self.modelType == "CONTINUOUS":
            simMinPrY = SSDO.CandidateField("SimMinPrY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias="{0} ({1}) ({2})".format(ARCPY.GetIDMessage(220950),dependent_variable, ARCPY.GetIDMessage(220936)))
            simMaxPrY = SSDO.CandidateField("SimMaxPrY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias="{0} ({1}) ({2})".format(ARCPY.GetIDMessage(220950),dependent_variable, ARCPY.GetIDMessage(220934)))
            simMedPrY = SSDO.CandidateField("SimMedPrY", "Double", NUM.zeros(ssdo.numObs), 
                                        alias="{0} ({1}) ({2})".format(ARCPY.GetIDMessage(220950),dependent_variable, ARCPY.GetIDMessage(220937)))
            simMinRes = SSDO.CandidateField("SimMinRes", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220911),ARCPY.GetIDMessage(220936)))
            simMaxRes = SSDO.CandidateField("SimMaxRes", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220911),ARCPY.GetIDMessage(220934)))
            simMedRes = SSDO.CandidateField("SimMedRes", "Double", NUM.zeros(ssdo.numObs), 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220911),ARCPY.GetIDMessage(220937)))
            simMinStd = SSDO.CandidateField("SimMinStd", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220949),ARCPY.GetIDMessage(220936)))
            simMaxStd = SSDO.CandidateField("SimMaxStd", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220949),ARCPY.GetIDMessage(220934)))
            simMedStd = SSDO.CandidateField("SimMedStd", "Double", NUM.zeros(ssdo.numObs), 
                                        alias="{0} - {1}".format(ARCPY.GetIDMessage(220949),ARCPY.GetIDMessage(220937)))
        elif self.modelType == "BINARY":
            simMinPr1 = SSDO.CandidateField("SimMinPr1", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias=ARCPY.GetIDMessage(220947))
            simMaxPr1 = SSDO.CandidateField("SimMaxPr1", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias=ARCPY.GetIDMessage(220946))
            simMedPr1 = SSDO.CandidateField("SimMedPr1", "Double", NUM.zeros(ssdo.numObs), 
                                        alias=ARCPY.GetIDMessage(220945))
            simCt0 = SSDO.CandidateField("SimCt0", "LONG", NUM.zeros(ssdo.numObs),
                                         alias=ARCPY.GetIDMessage(220944).format(0))
            simCt1 = SSDO.CandidateField("SimCt1", "LONG", NUM.zeros(ssdo.numObs),
                                         alias=ARCPY.GetIDMessage(220944).format(0))
            simPcnt0 = SSDO.CandidateField("SimPcnt0", "Double", NUM.zeros(ssdo.numObs),
                                         alias=ARCPY.GetIDMessage(220943).format(0))
            simPcnt1 = SSDO.CandidateField("SimPcnt1", "Double", NUM.zeros(ssdo.numObs),
                                         alias=ARCPY.GetIDMessage(220943).format(1))
            simMinDR = SSDO.CandidateField("SimMinDR", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220936)))
            simMaxDR = SSDO.CandidateField("SimMaxDR", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220934)))
            simMedDR = SSDO.CandidateField("SimMedDR", "Double", NUM.zeros(ssdo.numObs), 
                                        alias=ARCPY.GetIDMessage(220933))

        elif self.modelType == "COUNT":
            simMinRY = SSDO.CandidateField("SimMinRY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias=dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220936)))
            simMaxRY = SSDO.CandidateField("SimMaxRY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias=dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220934)))
            simMedRY = SSDO.CandidateField("SimMedRY", "Double", NUM.zeros(ssdo.numObs), 
                                        alias=dependent_variable + " ({0})".format(ARCPY.GetIDMessage(220937)))
            simMinPrY = SSDO.CandidateField("SimMinPrY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias="{0} ({1}) - {2}".format(ARCPY.GetIDMessage(220939), dependent_variable, ARCPY.GetIDMessage(220938)))
            simMaxPrY = SSDO.CandidateField("SimMaxPrY", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias="{0} ({1}) - {2}".format(ARCPY.GetIDMessage(84895), dependent_variable,ARCPY.GetIDMessage(220940)))
            simMedPrY = SSDO.CandidateField("SimMedPrY", "Double", NUM.zeros(ssdo.numObs), 
                                        alias="{0} ({1}) - {2}".format(ARCPY.GetIDMessage(84895), dependent_variable,ARCPY.GetIDMessage(220941)))
            simMinDR = SSDO.CandidateField("SimMinDR", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).max, dtype=float), 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220936)))
            simMaxDR = SSDO.CandidateField("SimMaxDR", "Double", NUM.full(ssdo.numObs, NUM.finfo(NUM.float64).min, dtype=float), 
                                        alias=ARCPY.GetIDMessage(220935).format(ARCPY.GetIDMessage(220934)))
            simMedDR = SSDO.CandidateField("SimMedDR", "Double", NUM.zeros(ssdo.numObs), 
                                        alias=ARCPY.GetIDMessage(220933))

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220942))
        allYData = []
        allYPredData = []
        predResiduals = []
        predResidualSTDs = []
        probOfBeingOnes = []
        rawPredictions = []
        predictions = []
        devianceResiduals = []
        RSquareds = NUM.zeros(numSimulations, dtype=float)
        adjRSquareds = NUM.zeros(numSimulations, dtype=float)
        JBPVals = NUM.zeros(numSimulations, dtype=float)
        devExps = NUM.zeros(numSimulations, dtype=float)
        accuracies = NUM.zeros(numSimulations, dtype=float)
        sens = NUM.zeros(numSimulations, dtype=float)


        #### Obtain Z Factor ####
        confidenceLevelValue = int(sensitivity["moe_conf_level"])/100
        zFactor = SPSTAT.norm.ppf(1.0- (1-confidenceLevelValue)/2)

        smoothValuesDict = {name.upper():None for name in sensitivity['SIMULATED_FIELDS']}
        useSmoothValues = False

        #### Create an instance of GLR with sensitivity ####
        glr = GLR(ssdo, dependent_variable.upper(), [v.upper() for v in self.expVars], family=family, distanceFeatures=df, sensitivity=sensitivity)

        numberOfVariables = len(self.expVars)
        if df is not None:
            numberOfVariables += len(df.names)

        if self.outSimTable:
            stdCoeffs = NUM.zeros((numSimulations, numberOfVariables))
            stdErrs = NUM.zeros((numSimulations, numberOfVariables))
            pVals = NUM.zeros((numSimulations, numberOfVariables))

        n = ssdo.numObs
        correlation = None
        moeFields = []
        orgFields = []
        includeDependentVariable = False

        APPLY_MULTIVARIATE = False
        if sensitivity["simulation_method"] == "NORMAL":
            if self.modelType != "CONTINUOUS" or   "MOE" in sensitivity and len(sensitivity['MOE']) < 2:
                APPLY_MULTIVARIATE = False
            if self.modelType == "CONTINUOUS" and "MOE" in sensitivity and len(sensitivity['MOE']) >= 2:
                #### Simulation Data Limits are not honored for multivariable normal simulation method ####
                sensitivity["sim_data_limits"] = None
                ARCPY.AddIDMessage("WARNING", 110598)
                APPLY_MULTIVARIATE = True

        if APPLY_MULTIVARIATE and self.modelType == "CONTINUOUS" and \
           "MOE" in sensitivity and len(sensitivity['MOE']) >= 2:

            senFields = sensitivity['moe_field'].split(";")
            for f in senFields:
                values = f.split(" ")
                moe = values[1]
                if moe not in [' ', None, '#', '']:
                    moeFields.append(moe.upper())
                    orgFields.append(values[0].upper())

            orgXData = NUM.ndarray(shape=(n, len(orgFields)))
            for i in range(len(orgFields)):
                varName = orgFields[i].upper()
                if varName  == dependent_variable.upper():
                    includeDependentVariable = True
                if useSmoothValues:
                    orgXData[:, i] = ssdo.fields[varName].returnDouble() - smoothValuesDict[varName]
                else:
                    orgXData[:, i] = ssdo.fields[varName].returnDouble()

            correlation = NUM.corrcoef(orgXData, rowvar=False)
            #UTILS.dbg("Original Correlation: ",correlation.ravel())

        meanYValue = 0
        meanXValue = [0 for _ in range(len(self.expVars))]
        minXValue = [NUM.finfo(NUM.float64).max for _ in range(len(self.expVars))]
        maxXValue = [NUM.finfo(NUM.float64).min for _ in range(len(self.expVars))]

        pathWS = UTILS.getOutputSimulation(self.parameters[10], self.parameters[0])

        for sim in NUM.arange(numSimulations):

            #### Check for Cancel ####
            if ARCPY.env.isCancelled:
                raise SystemExit()

            NUM.random.seed(seeds[sim])
            if APPLY_MULTIVARIATE and  self.modelType == "CONTINUOUS"  and \
                   "MOE" in sensitivity and len(sensitivity['MOE_DICT']) > 2:
                ### Get the realization of the MOEs using the multivariate correlation ###
                ### Create the matrix of MOEs and the diagonal matrix of MOEs of the selected fields ###
                XDataM = NUM.ndarray(shape=(n, len(moeFields)))
                XData = NUM.ndarray(shape=(n, len(orgFields)))
                realization  = NUM.ndarray(shape=(n, len(moeFields)))

                for i in range(len(moeFields)):
                    varNameMoe = moeFields[i].upper()
                    XDataM[:, i] = ssdo.fields[varNameMoe.upper()].returnDouble()
                    if useSmoothValues:
                        XData[:, i] = smoothValuesDict[orgFields[i].upper()]
                    else:
                        XData[:, i] = ssdo.fields[orgFields[i].upper()].returnDouble()

                for i in range(n):
                    moes = XDataM[i]/zFactor
                    diagMoes = NUM.zeros(shape=(len(orgFields), len(orgFields)), dtype = float)
                    for j in range(len(orgFields)):
                        diagMoes[j,j] = moes[j]

                    meansI = XData[i]
                    newCorrelation = NUM.matmul(diagMoes, correlation)
                    newCorrelation = NUM.matmul(newCorrelation, diagMoes)
                    realization[i] = NUM.random.multivariate_normal(meansI, newCorrelation, 1).ravel()

                newCorrelation = NUM.corrcoef(realization, rowvar=False)
                #UTILS.dbg(fr"New Correlation {sim}: ", newCorrelation.ravel())

                #### Populate the original XData required for GLR ####
                XData = NUM.ndarray(shape=(n, len(self.expVars)))

                for i in range(len(self.expVars)):
                    varName = self.expVars[i].upper()
                    if not varName in sensitivity['MOE_DICT'] and orgFields.count(varName) == 0:
                        XData[:, i] = ssdo.fields[varName].returnDouble()
                    else:
                        if varName in orgFields:
                            XData[:, i] = realization[:, orgFields.index(varName)]

                if includeDependentVariable:
                    indexDependent = orgFields.index(dependent_variable)
                    yData = realization[:, indexDependent]
                else:
                    yData = ssdo.fields[dependent_variable].returnDouble()

                meanYValue += yData.sum() / (ssdo.numObs * numSimulations)
                meanXValue += XData.sum(axis=0) / (ssdo.numObs * numSimulations)
                allYData.append(yData)
                simMinY.data = NUM.minimum(simMinY.data, yData)
                simMaxY.data = NUM.maximum(simMaxY.data, yData)

                glr.initialize(yDataRealized=yData, XDataRealized=XData)
                glr.calculate()

            else:
                seedInfo = NUM.random.randint(0,1000000,len(self.expVars)+1)
                if self.modelType == "BINARY" :
                    yData = ssdo.fields[dependent_variable].returnDouble()
                else:
                    if dependent_variable in smoothValuesDict:
                        yData = STATS.getRealization(ssdo, dependent_variable, sensitivity, seedInfo[len(self.expVars)], smoothValuesDict[dependent_variable], zFactor) 
                        if self.modelType == "COUNT":
                            if NUM.sum(yData < 0) > 0:
                                ARCPY.AddError("Simulated data goes below 0, please set a lower data limit")
                                raise SystemExit()
                    else:
                        yData = ssdo.fields[dependent_variable].returnDouble()

                meanYValue += yData.sum() / (ssdo.numObs * numSimulations)

                allYData.append(yData)
                simMinY.data = NUM.minimum(simMinY.data, yData)
                simMaxY.data = NUM.maximum(simMaxY.data, yData)

                XData = NUM.ndarray(shape=(len(yData), len(self.expVars)))
                for i in range(len(self.expVars)):
                    varName = self.expVars[i].upper()
                    if not varName in sensitivity['SIMULATED_FIELDS']:
                        XData[:, i] = ssdo.fields[varName].returnDouble()
                    else:
                        XData[:, i] = STATS.getRealization(ssdo, varName, sensitivity, seedInfo[i], smoothValuesDict[varName], zFactor)

                meanXValue += XData.sum(axis=0) / (ssdo.numObs * numSimulations)

                glr.initialize(yDataRealized=yData, XDataRealized=XData)
                glr.calculate()

            if CREATE_OUTPUT_ARRAYS:
                NUM.save(fr"c:\temp\yData_{sim}.npy", yData)
                NUM.save(fr"c:\temp\XData_{sim}.npy", XData)

            minXValue = NUM.minimum(XData.min(axis=0), minXValue)
            maxXValue = NUM.maximum(XData.max(axis=0), maxXValue)

            if self.modelType == "CONTINUOUS":
                #### get pred vals ####
                yHat = glr.yHat.ravel()
                simMinPrY.data = NUM.minimum(simMinPrY.data, yHat)
                simMaxPrY.data = NUM.maximum(simMaxPrY.data, yHat)
                allYPredData.append(yHat)

                #### get residual vals ####
                residuals = glr.residuals.ravel()
                simMinRes.data = NUM.minimum(simMinRes.data, residuals)
                simMaxRes.data = NUM.maximum(simMaxRes.data, residuals)
                predResiduals.append(residuals)

                #### get residual std vals ####
                residualSTD = glr.stdResiduals.ravel()
                simMinStd.data = NUM.minimum(simMinStd.data, residualSTD)
                simMaxStd.data = NUM.maximum(simMaxStd.data, residualSTD)
                predResidualSTDs.append(residualSTD)
            elif self.modelType == "BINARY":
                #### get probability of being 1 ####
                probOfOne = glr.yPredicted.ravel()
                simMinPr1.data = NUM.minimum(simMinPr1.data, probOfOne)
                simMaxPr1.data = NUM.maximum(simMaxPr1.data, probOfOne)
                probOfBeingOnes.append(probOfOne)

                #### get cout of 0 across simulatinos ####
                countOne = glr.yPredictedValue.ravel().astype('int32')
                simCt1.data += countOne

                #### get deviance residuals ####
                devRes = glr.devResiduals.ravel()
                simMinDR.data = NUM.minimum(simMinDR.data, devRes)
                simMaxDR.data = NUM.minimum(simMaxDR.data, devRes)
                devianceResiduals.append(devRes)
            elif self.modelType == "COUNT":
                #### get raw predictions ####
                rawPreds = glr.yPredicted.ravel()
                simMinRY.data = NUM.minimum(simMinRY.data, rawPreds)
                simMaxRY.data = NUM.minimum(simMaxRY.data, rawPreds)
                rawPredictions.append(rawPreds)

                #### get predicted values ####
                preds = glr.yPredictedValue.ravel()
                simMinPrY.data = NUM.minimum(simMinPrY.data, preds)
                simMaxPrY.data = NUM.minimum(simMaxPrY.data, preds)
                predictions.append(preds)

                #### get deviance residuals ####
                devRes = glr.devResiduals.ravel()
                simMinDR.data = NUM.minimum(simMinDR.data, devRes)
                simMaxDR.data = NUM.minimum(simMaxDR.data, devRes)
                devianceResiduals.append(devRes)

            #### if output simulation table is provided ####
            if self.outSimTable:

                stdCoeffs[sim] = glr.coefSTD[1:] if self.modelType == "CONTINUOUS" else glr.coef[1:]
                stdErrs[sim] = glr.seCoef[1:]
                pVals[sim] = glr.pVals[1:]
                if self.modelType == "CONTINUOUS":
                    RSquareds[sim] = glr.r2
                    adjRSquareds[sim] = glr.r2Adj
                    JBPVals[sim] = glr.JBProb
                elif self.modelType == "BINARY":
                    accuracies[sim] = (countOne == yData).sum() / len(countOne)
                    TP = ((countOne == 1) & (yData == 1)).sum()
                    FN = ((countOne == 0) & (yData == 1)).sum()
                    sens[sim] = TP / (TP + FN)
                elif self.modelType == "COUNT":
                    devExps[sim] = glr.globalNullPDev

            if pathWS is not None:
                shortName = False
                varNameOutput = self.dependentVar.upper()
                if ".shp" in pathWS.lower():
                    varNameOutput = self.dependentVar.upper()[0:10]
                    shortName = True

                candidateFieldSim = SSDO.CandidateField(varNameOutput, "DOUBLE", yData, alias = ssdo.fields[self.dependentVar.upper()].alias)
                newFields = [candidateFieldSim]
                for i in range(len(self.expVars)):
                    varNameN = self.expVars[i].upper()
                    if shortName:
                        varNameN = varNameN[0:10]
                    candFieldSimX = SSDO.CandidateField(varNameN, "DOUBLE", XData[:, i], alias = ssdo.fields[self.expVars[i].upper()].alias)
                    newFields.append(candFieldSimX)

                createGLROutputFC(glr, self.outputFC, newFields=newFields, ouputPathInWorkspace=pathWS.format(f'{sim:03}'), copySourceFields=False )


            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220948).format(sim))

        if self.modelType == "CONTINUOUS":
            simMedY.data = NUM.median(allYData, axis=0)
            simMedPrY.data = NUM.median(allYPredData, axis=0)
            simMedRes.data = NUM.median(predResiduals, axis=0)
            simMedStd.data = NUM.median(predResidualSTDs, axis=0)
        elif self.modelType == "BINARY":
            simMedPr1.data = NUM.median(probOfBeingOnes, axis=0)
            simCt0.data = numSimulations - simCt1.data
            simPcnt0.data = (simCt0.data / numSimulations) * 100.0
            simPcnt1.data = (simCt1.data / numSimulations) * 100.0
        elif self.modelType == "COUNT":
            simMedY.data = NUM.median(allYData, axis=0)
            simMedRY.data = NUM.median(rawPredictions, axis=0)
            simMedPrY.data = NUM.median(predictions, axis=0)
            simMedDR.data = NUM.median(devianceResiduals, axis=0)

        candidateFields = []
        if self.modelType == "CONTINUOUS":
            candidateFields.extend([simMinY, simMaxY, simMedY, simMinPrY, simMaxPrY, simMedPrY, 
                                    simMinStd, simMaxStd, simMedStd])
        elif self.modelType == "BINARY":
            candidateFields.extend([simMinPr1, simMaxPr1, simMedPr1, simCt0, simCt1, simPcnt0,
                                    simPcnt1, simMinDR, simMaxDR, simMedDR])
        elif self.modelType == "COUNT":
            candidateFields.extend([simMinY, simMaxY, simMedY, simMinRY, simMaxRY, simMedRY, simMinPrY,
                                    simMaxPrY, simMedPrY, simMinDR, simMaxDR, simMedDR])

        listFieldsToAddFromSource = []
        if "MOE" in  sensitivity:
            # listFieldsToAddFromSource.append(sensitivity["MOE"].upper())
            for moeField in sensitivity["MOE"]:
                if moeField != "":
                    listFieldsToAddFromSource.append(moeField.upper())
        if "lowField"  in sensitivity:
            for i in range(len(sensitivity["lowField"])):
                lowField = sensitivity["lowField"][i].upper()
                highField = sensitivity["highField"][i].upper()
                if lowField != '':
                    listFieldsToAddFromSource.append(sensitivity["lowField"][i].upper())
                if highField != '':
                    listFieldsToAddFromSource.append(sensitivity["highField"][i].upper())

        #### Recalculate GLR with original data ####
        glr.initialize()
        glr.calculate()

        createGLROutputFC(glr, self.outputFC, newFields=candidateFields, listFieldsToAddFromSource=listFieldsToAddFromSource)

        #### Render Results ####
        symbLayer = None
        if glr.family != "GAUSSIAN":
            if ssdo.shapeType.upper() == "POINT":
                UTILS.buildLocaleCIMLayer("GGWR_Points.lyrx", 1)
                symbLayer = "GGWR_Points.lyrx"
            else:
                UTILS.buildLocaleCIMLayer("GGWR_Polygons.lyrx", 1)
                symbLayer = "GGWR_Polygons.lyrx"
        else:
            if ssdo.shapeType.upper() == "POINT":
                UTILS.buildLocaleCIMLayer("GWR_Points.lyrx", 1)
                symbLayer = "GWR_Points.lyrx"
            else:
                UTILS.buildLocaleCIMLayer("GWR_Polygons.lyrx", 1)
                symbLayer = "GWR_Polygons.lyrx"

        ### Create output Simulatino table ###
        # if self.outSimTable is not None:
        sim_id = NUM.arange(1, numSimulations + 1)
        outTableCandidates = []
        #### Add simulatino ID ###
        simIDCandidate = SSDO.CandidateField("SIM_ID", "LONG", sim_id, alias=ARCPY.GetIDMessage(220932))
        outTableCandidates.append(simIDCandidate)

        #### Add std coeffs, std errors, and pvals ####
        allVars = glr.allVars.copy()
        allVars.remove(glr.depVarName)

        for i in range(len(allVars)):
            #### std coeff
            fieldName = "StdCoef" + str(i)
            data = stdCoeffs[:, i]
            alias = ARCPY.GetIDMessage(220931) +" (" + allVars[i] + ")"
            stdCoeffCand = SSDO.CandidateField(fieldName, "Double", data, alias)
            outTableCandidates.append(stdCoeffCand)

            #### std errors
            fieldName = "StdErr" + str(i)
            data = stdErrs[:, i]
            alias = ARCPY.GetIDMessage(220930)+" (" + allVars[i] + ")"
            stdErrCand = SSDO.CandidateField(fieldName, "Double", data, alias)
            outTableCandidates.append(stdErrCand)

            #### pvals
            fieldName = "Pval" + str(i)
            data = pVals[:, i]
            alias = ARCPY.GetIDMessage(220866)+" (" + allVars[i] + ")"
            pvalsCand = SSDO.CandidateField(fieldName, "Double", data, alias)
            outTableCandidates.append(pvalsCand)

        if self.modelType == "CONTINUOUS":
            r2Cand = SSDO.CandidateField("RSquared", "Double", RSquareds, ARCPY.GetIDMessage(220929))
            outTableCandidates.append(r2Cand)

            adjR2Cand = SSDO.CandidateField("Adj_RSq", "Double", adjRSquareds, ARCPY.GetIDMessage(220928))
            outTableCandidates.append(adjR2Cand)

            JBPValCand = SSDO.CandidateField("JBPVal", "Double", JBPVals, ARCPY.GetIDMessage(220927))
            outTableCandidates.append(JBPValCand)
        elif self.modelType == "COUNT":
            devExpCand = SSDO.CandidateField("DevExp", "Double", devExps, ARCPY.GetIDMessage(220926))
            outTableCandidates.append(devExpCand)
        elif self.modelType == "BINARY":
            accCand = SSDO.CandidateField("Acc", "Double", accuracies, ARCPY.GetIDMessage(220925))
            outTableCandidates.append(accCand)

            sensCand = SSDO.CandidateField("Sens", "Double", sens, ARCPY.GetIDMessage(220924))
            outTableCandidates.append(sensCand)

        container = UTILS.DataContainer()
        container.generateOutput(self.outSimTable, outTableCandidates)


        if UTILS.isPRO():
            self.createOutputCharts(allVars,RSquareds,sens,accuracies, devExps)
            outputName = OS.path.basename(str(self.outputFC))
            if outputName.lower().endswith(".shp"):
                outputName = outputName[: -4]

            outLayer = DM.MakeFeatureLayer(str(self.outputFC), outputName)
            groupLayer = ARCPY.gp.MakeGroupLayer(outputName + "_" + ARCPY.GetIDMessage(220913), [outLayer]).getOutput(0)

            ARCPY.SetParameter(13, groupLayer)

        # print messages
        minYValue = simMinY.data.min()
        maxYValue = simMaxY.data.max()
        self.printMessages(ssdo, self.parameters, minYValue, minXValue, meanYValue, meanXValue, maxYValue, maxXValue, allVars, sensitivity)

    def reCalculateChartExtent(self, histChart, values, referenceLineValue):
        """ Recalculate the chart extent 
        INPUT:
            histChart (arcpy.charts.Histogram): histogram chart
            values (numpy.ndarray): values to be plotted
            referenceLineValue (float): reference line value
        """
        histChart.xAxis.minimum = min(values.min(), referenceLineValue)
        histChart.xAxis.maximum = max(values.max(), referenceLineValue)
        diff = (histChart.xAxis.maximum - histChart.xAxis.minimum)*0.1
        if histChart.xAxis.minimum == referenceLineValue:
            histChart.xAxis.minimum = histChart.xAxis.minimum - diff
        if histChart.xAxis.maximum == referenceLineValue:
            histChart.xAxis.maximum = histChart.xAxis.maximum + diff

    def createHistogram(self, name, field,  title, xAxisTitle, guideLabel= None, 
                        values = None, referenceLineValue= None):
        """ Create histogram chart
        INPUT:
            name (str): chart name
            field (str): field name
            title (str): chart title
            xAxisTitle (str): x axis title
            guideLabel (str): guide label
            values (numpy.ndarray): values to be plotted
            referenceLineValue (float): reference line value
        """
        histChart = ARCPY.Chart(name)
        histChart.type = "histogram"
        histChart.title =  title
        histChart.xAxis.field = field
        histChart.xAxis.title = xAxisTitle

        if values is not None:
            histChart.xAxis.guides.new("x", referenceLineValue, None,guideLabel)
            self.reCalculateChartExtent(histChart, values, referenceLineValue)
        return histChart

    def createOutputCharts(self, allVars, RSquareds, sens, accuracies, devExps):
        """ Create output charts
        INPUT:
            allVars (list): list of independent variables
            RSquareds (numpy.ndarray): R squared values
            sens (numpy.ndarray): sensitivity values
            accuracies (numpy.ndarray): accuracies
            devExps (numpy.ndarray): deviance explained values
        """
        charts = []

        if self.modelType == "CONTINUOUS":

            histChart = self.createHistogram(name = ARCPY.GetIDMessage(220914),
                                            field="RSquared",
                                            title = ARCPY.GetIDMessage(220914),
                                            xAxisTitle = ARCPY.GetIDMessage(84826),
                                            guideLabel = ARCPY.GetIDMessage(220916),
                                            values = RSquareds,
                                            referenceLineValue = self.orgR2val)
            charts.append(histChart)

            ### JB chart
            JBChart = self.createHistogram(name = ARCPY.GetIDMessage(220917),
                                            field="JBPVal",
                                            title = ARCPY.GetIDMessage(220917),
                                            xAxisTitle = ARCPY.GetIDMessage(220915))

            charts.append(JBChart)
        elif self.modelType == "BINARY":
            histChartAcc = self.createHistogram(name = ARCPY.GetIDMessage(220918),
                                            field="Acc",
                                            title = ARCPY.GetIDMessage(220918),
                                            xAxisTitle = ARCPY.GetIDMessage(84827),
                                            guideLabel = ARCPY.GetIDMessage(220919),
                                            values = accuracies,
                                            referenceLineValue = self.orgAcc)

            self.reCalculateChartExtent(histChartAcc, accuracies, self.orgAcc)  
            charts.append(histChartAcc)

            histChartSens = self.createHistogram(name = ARCPY.GetIDMessage(220920),
                                            field="Sens",
                                            title = ARCPY.GetIDMessage(220920),
                                            xAxisTitle = ARCPY.GetIDMessage(84843),
                                            guideLabel = ARCPY.GetIDMessage(220921),
                                            values = sens,
                                            referenceLineValue = self.orgSens)

            charts.append(histChartSens)
        elif self.modelType == "COUNT":
            histChart = self.createHistogram(name = ARCPY.GetIDMessage(220922),
                                            field="DevExp",
                                            title = ARCPY.GetIDMessage(220922),
                                            xAxisTitle = ARCPY.GetIDMessage(221005),
                                            guideLabel = ARCPY.GetIDMessage(221005),
                                            values = devExps,
                                            referenceLineValue = self.orgDev)

            charts.append(histChart)



        y = ["StdCoef" + str(i) for i in range(len(allVars))]

        varDistChart = ARCPY.Chart(ARCPY.GetIDMessage(220923))
        varDistChart.type = "boxPlot"
        varDistChart.title =ARCPY.GetIDMessage(220923)
        varDistChart.yAxis.field = y
        varDistChart.yAxis.title = ARCPY.GetIDMessage(84974)
        varDistChart.boxPlot.showOutliers = True
        charts.append(varDistChart)
        self.parameters[2].charts = charts


    def printMessages(self, ssdo, parameters, minYValue, minXValue, meanYValue, meanXValue, maxYValue, maxXValue, allVars, sensitivity):
        modelType = {"CONTINUOUS": ARCPY.GetIDMessage(220951), "BINARY":  ARCPY.GetIDMessage(220401), "COUNT": ARCPY.GetIDMessage(220952)}
        
        _, outTableName = OS.path.split(parameters[2].valueAsText)

        expVarNoBracket = (', '.join(allVars))

        msg3 = (f"{ARCPY.GetIDMessage(220953)}: {ARCPY.GetIDMessage(220954)}\n"
                f"{ARCPY.GetIDMessage(220955)}: {modelType[self.modelType]}\n"
                f"{ARCPY.GetIDMessage(120349)}: {self.dependentVar}\n"
                f"{ARCPY.GetIDMessage(120348)}: {expVarNoBracket}\n"
                f"{ARCPY.GetIDMessage(84253)}: {parameters[0].valueAsText}")

        UTILS.outputAccordion([UTILS.outputParagraph(msg3, returnHTMLMsg=True)], title=ARCPY.GetIDMessage(220956)+":")
        method = {"GAUSSIAN":ARCPY.GetIDMessage(220886), "NORMAL": ARCPY.GetIDMessage(220886), "UNIFORM": ARCPY.GetIDMessage(220957), "TRIANGULAR": ARCPY.GetIDMessage(220958)}
        msg4 =  ARCPY.GetIDMessage(220959).format(parameters[8].valueAsText,method[parameters[9].valueAsText])

        header = "NULL"
        rows = []
        footnote = []
        row0 = [ARCPY.GetIDMessage(id) for id in [220273, 220960, 84412, 220437, 220439]]
        
        rows.append((row0))
        
        if self.modelType == "CONTINUOUS":
            vals = [self.dependentVar, ARCPY.GetIDMessage(84936),  
                    LOCALE.format_string("%0.3f",minYValue), 
                    LOCALE.format_string("%0.3f",meanYValue), 
                    LOCALE.format_string("%0.3f",maxYValue)]
            rows.append(vals)

        for i in range(len(self.expVars)):
            if self.expVars[i].upper() in sensitivity['SIMULATED_FIELDS']:
                vals = [self.expVars[i], 
                            ARCPY.GetIDMessage(84935), 
                            LOCALE.format_string("%0.3f",minXValue[i]),
                            LOCALE.format_string("%0.3f",meanXValue[i]),
                            LOCALE.format_string("%0.3f",maxXValue[i])]

                rows.append(vals)

        table = UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(row0) - 1),
                                      header=header, pad=1, colPad=3, footnote=footnote,
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      returnHTMLMsg=True)
        if parameters[10].value:
            msg5 = ARCPY.GetIDMessage(220961).format(parameters[10].valueAsText)
            UTILS.outputAccordion([UTILS.outputParagraph(msg4, returnHTMLMsg=True), table, UTILS.outputParagraph(msg5, returnHTMLMsg=True)], title=ARCPY.GetIDMessage(220962)+":")
        else:
            UTILS.outputAccordion([UTILS.outputParagraph(msg4, returnHTMLMsg=True), table], title=ARCPY.GetIDMessage(220962)+":")
