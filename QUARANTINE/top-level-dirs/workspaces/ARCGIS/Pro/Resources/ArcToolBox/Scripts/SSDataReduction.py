# coding: utf-8
"""
Source Name:   SSDataReduction.py
Version:       ArcGIS Pro 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   Data Reduction techniques
"""

################### Imports ########################
import sys as SYS
import os as OS
import locale as LOCALE
import numpy as NUM
import numpy.random as RAND
import arcpy as ARCPY
import arcgisscripting as ARC
import SSDataObject as SSDO
import ErrorUtils as ERROR
import SSUtilities as UTILS
from scipy import linalg as LA
from scipy.stats import chi2 as CHI2
LOCALE.setlocale(LOCALE.LC_ALL, '')

EIGENMIN = 1e-25

def execute(parameters, messages):
    #### User Defined Inputs ####
    inputFC = UTILS.getInputAppendParameter(0, parameters)
    outputFC = parameters[1].valueAsText

    #### Analysis Fields ####
    analysisFields = parameters[2].valueAsText
    analysisFields = analysisFields.split(";")
    fieldList = [ i for i in analysisFields ]
    analysisFields = [ i.upper() for i in analysisFields ]
    scaleInput = parameters[4].value
    method = parameters[3].valueAsText
    categoryField = parameters[5].valueAsText
    numberOfComponents = UTILS.getNumericParameter(7, parameters)
    variability = UTILS.getNumericParameter(6, parameters)

    appendFields = "NEW_DATASET_COPY_ALL" if parameters[8].value else \
                    "NEW_DATASET_JUST_NEW_FIELDS"
    appendFields = "APPEND_FIELDS_INPUT" if parameters[12].value else appendFields
    outputTable = parameters[9].valueAsText
    outputVectorTable = parameters[10].valueAsText
    numPemutation = parameters[11].value
    appendFieldsToInput = parameters[12]

    ##### Method to select the number of components ####
    methodEst = None
    if method == "PCA":
        if parameters[11].value is not None and  parameters[11].value > 0:
            methodEst = "PERMUTATION"
        else:
            methodEst = "BROKEN-STICK"
            numPemutation = 0

    if outputVectorTable in ["", None, "#"]:
        outputVectorTable = None
    else:
        UTILS.checkOutputPath(outputVectorTable, "TABLE")

    if outputTable in ["", None, "#"]:
        outputTable = None
    else:
        UTILS.checkOutputPath(outputTable, "TABLE")

    #### Outputs ####
    UTILS.checkOutputPath(outputFC, "FC")

    if numberOfComponents is not None and numberOfComponents > len(fieldList):
        ARCPY.AddError("The number of components should be less than the number of fields.")
        raise SystemExit

    if scaleInput is None:
        scaleInput = True

    if variability is not None:
        variability /= 100.0

    fields2Check = [i.upper() for i in analysisFields]
    listFields2Use = [analysisFields]
    blockType = ["float"]

    if method == "LDA":
        #### Check Categorical Field ####
        if not  categoryField in ["", None]:
            listFields2Use.append([categoryField.upper()])
            fields2Check.append(categoryField.upper())
            blockType.append("auto")
    else:
        categoryField = None

    #### Check New Field Types If Going to New Output FC ####
    if not appendFieldsToInput.value:
        checker = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields = fields2Check)

    #### Read data in blocks ####
    reader = UTILS.GenericReader(inputFC, listFields2Use, blockType = blockType,
                outputOption = appendFields, supportJoin = True)

    #### Define Data Reduction Object ####
    dr = DataReduction(reader, fieldList, categoryField, outputTable, 
                       scaleInput = scaleInput, 
                       outputTableVectors = outputVectorTable,
                       appendFieldsToInput = appendFieldsToInput)

    if method == "PCA":
        dr.PCA(variability, numberOfComponents, False, methodEst, numPemutation)

    if method == "LDA":
        dr.LDA(variability, numberOfComponents)

        if dr.LDAChart is not None:
            ### Add Chart ###
            parameters[1].charts = dr.LDAChart

        if not reader.isTable:
            try:
                ARCPY.SetParameterSymbology(1, dr.SymbologyPathLDA)
            except:
                pass

    if not appendFieldsToInput.value:
        dr.output(outputFC)
    else:
        dr.output(inputFC)

    if method == "LDA":
        if dr.LDAChart is not None:
            ### Add Chart ###
            parameters[1].charts = dr.LDAChart

        if not reader.isTable:
            try:
                ARCPY.SetParameterSymbology(1, dr.SymbologyPathLDA)
            except:
                pass

    if parameters[9].value:
        parameters[9].charts = dr.eigenCharts

    for message in dr.outputMessage:
        ARCPY.AddMessage(message)

    if parameters[10].value:
        parameters[10].charts = dr.eigenVectorCharts


class DataReduction():
    """
    This Class allows to reduce the number of fields using the following techniques:
    PCA (Principal Components Analysis), LDA (Linear Discriminant Analysis)

    INPUT:
        inputData (GenericReader): Generic Reader instance 
        fieldList (list): list of fields 
        categoryField {str}: Categorical Field (only for LDA)

    METHODS:
        LDA(): Linear Discriminant Analysis
        PCA(): Principal Component Analysis
        output(string): Generate new feature class
    """


    def __init__(self, reader, fieldList, categoryField = None, outputTable = None, scaleInput = True, outputTableVectors = None, appendFieldsToInput = False):
        #### Input Data ####
        self.reader = reader
        self.inputData = reader.inputData
        self.numericFields  = [i.upper() for i in fieldList]
        self.numFields = len(fieldList)
        self.originalFieldNames = fieldList
        self.categoryField = categoryField
        self.outputTable = outputTable
        self.outputTableVectors = outputTableVectors
        self.scaleInput = scaleInput
        self.stop = False
        self.appendFieldsToInput = appendFieldsToInput

        self.numComponents = len(self.numericFields)
        if categoryField is not None:
            self.categoryField = categoryField.upper()
            self.originalCatFieldName = categoryField

        #### This variable contains the block of data ####
        self.data = self.reader.data[0]

        oldSettings = NUM.seterr(all='ignore')
        mean = self.data.mean(0)
        NUM.seterr(**oldSettings)

        #### Check Inf Values ####
        for i in NUM.arange(len(mean)):
            if NUM.inf == mean[i]:
                maxV = self.data.T[i].max()
                ARCPY.AddIDMessage("ERROR", 192, "({0} {1})".format(fieldList[i],maxV))
                raise SystemExit

        #### Scale Data ####
        if self.scaleInput and categoryField in ["", None]:

            stdDevValues = NUM.sqrt(self.data.var(0))

            if (stdDevValues==0).sum() > 0:
                self.stop = True
            else:
                oldSettings = NUM.seterr(all='ignore')
                self.data = (self.data - mean)/stdDevValues
                NUM.seterr(**oldSettings)


        self.orgCategoriesArr = None
        self.categories = None

        #### Categorical Data ####
        if not categoryField in ["", None]:
            self.orgCategoriesArr = self.reader.data[1]

        #### Categories ###
        if self.orgCategoriesArr is not None:
            self.categories = NUM.unique(self.orgCategoriesArr)

        self.outputData = None
        self.fieldNames = None
        self.aliasFieldNames = None
        self.SymbologyPathLDA = None
        self.LDAChart = None

    def __outputEigenTable(self):
        """ This Method creates a table of eigenvalues and adds 
            the eigenvalues Chart
        """
        if self.outputTable not in ["", None]:

            strKG = ARCPY.GetIDMessage(220123)
            strBS = ARCPY.GetIDMessage(220122)
            strEvsd = ARCPY.GetIDMessage(220052)
            strEv = ARCPY.GetIDMessage(220053)
            strCom = ARCPY.GetIDMessage(220055)
            strAcc = ARCPY.GetIDMessage(220054)

            strKGV = strKG + " (" + str(self.outputEigenOptions[strKG][0]) + ")"
            strBSV = strBS +" (" + str(self.outputEigenOptions[strBS][0])+ ")"
            strVar = self.strVar + "% (" +str(self.outputEigenOptions[self.strVar][0])+ ")"

            fieldNames = ["ID", "PCTVAR","CUMPCTVAR", "EIGVALUE", 
                           "BROKENSTCK"]

            fieldDict= [strCom, strEvsd, strAcc, strEv, strBS  ]
            fieldAlias= [strCom, strEvsd, strAcc, strEv,strBSV ]

            typeField = ["LONG", "DOUBLE", "DOUBLE", "DOUBLE",
                         "DOUBLE"]
            yMax  = max(NUM.max(self.outputEigenOptions[strBS][1]),
                        NUM.max(self.outputEigenOptions[strEvsd][1]))
            factor = 0.1
            yMax = yMax + factor -(yMax%factor)+0.1

            varValue = NUM.max(self.outputEigenOptions[self.strVar][1]*100)
            kaiser = NUM.max(self.outputEigenOptions[strKG][1])
            n = len(self.outputEigenOptions[strBS][1])

            fields = []
            for id, fieldName in enumerate(fieldNames):

                data = None
                if typeField[id] == "LONG":
                    data = NUM.array(self.outputEigenOptions[fieldDict[id]][1], dtype = NUM.int32)
                else:
                    perc = 100.0
                    if fieldName  == "EIGVALUE":
                        perc = 1.0
                    data = NUM.array(self.outputEigenOptions[fieldDict[id]][1], dtype = float)*perc

                field = SSDO.CandidateField( name  = fieldName,
                                             type = typeField[id],
                                             alias = fieldAlias[id],
                                             data = data)
                fields.append(field)

            #### Create Output ####
            container = UTILS.DataContainer()
            container.generateOutput(self.outputTable , fields)

            chart = ARCPY.Chart(ARCPY.GetIDMessage(220072))
            chart.type = "line"
            chart.title = ARCPY.GetIDMessage(220072)

            #### Assign Y Axis Field ####
            chart.yAxis.field = ["PCTVAR","BROKENSTCK"]
            chart.yAxis.title = strEvsd
            chart.color = ["#A80000", "#0070E1"]
            #### Assign X Axis Field ####
            chart.xAxis.field = "ID"
            chart.xAxis.title = ARCPY.GetIDMessage(220055)
            chart.legend.visible = True

            start = 0
            if self.outputEigenOptions[self.strVar][0] > 1:
                start = 1

            chart.xAxis.minimum = start
            chart.xAxis.maximum = n
            chart.yAxis.minimum = 0
            chart.yAxis.maximum = yMax*100
            #chart.yAxis.guides.new("y", kaiser*100, None,strKG)
            msg = ARCPY.GetIDMessage(220128)
            msg = msg.format(self.strVarianceCum)
            chart.xAxis.guides.new("x", self.outputEigenOptions[self.strVar][0], None,msg)
            self.eigenCharts = [chart]


    def __createSymbology(self, dataLabels):
        """ Add symbology in LDA layers
        INPUT:
            dataLables (1d array): Categories in LDA
        """
        if not self.reader.isTable:
            strInfo = createJSONCIM(self.reader.ssdo.shapeType,
                      self.originalCatFieldName,
                      self.originalCatFieldName,
                      dataLabels,
                      genColor(len(dataLabels)))
            self.SymbologyPathLDA = strInfo

    def __createScatterPlotLDA(self, dataComponents, componentsNames, dataLabels):
        """ Create a chart with the first two components of LDA """

        #### Symbology is created only if Scatterplot is created ####
        self.__createSymbology(NUM.unique(dataLabels))

        scatter = ARCPY.Chart(ARCPY.GetIDMessage(220056))
        scatter.type = "scatter"
        scatter.title = ARCPY.GetIDMessage(220056)
        scatter.scatter.showTrendLine = False
        #### Assign Y Axis Field ####
        scatter.yAxis.field = componentsNames[1]
        scatter.yAxis.title = ARCPY.GetIDMessage(220057)

        #### Assign X Axis Field ####
        scatter.xAxis.field = componentsNames[0]
        scatter.xAxis.title = ARCPY.GetIDMessage(220058)

        #### Assing Square Min/Max Axis Extents ####
        minX, maxX = NUM.nanmin(dataComponents[0]), NUM.nanmax(dataComponents[0])
        minY, maxY = NUM.nanmin(dataComponents[1]), NUM.nanmax(dataComponents[1])

        scatter.xAxis.minimum = minX
        scatter.yAxis.minimum = minY
        scatter.xAxis.maximum = maxX
        scatter.yAxis.maximum = maxY
        scatter.xAxis.guides.new("x", 0, None,"")
        scatter.yAxis.guides.new("y", 0, None,"")
        self.LDAChart = [scatter]
        pass

    def __sphericityMessageTable(self,n, eigValue):
        """ Geneate Sphericity Table 
        INPUT:
            n (int): Number of features
            eigValue (1d Array): Eigenvalues
        RETURN:
            Number componenter significant (int/String)
            Output table (string)
        """

        if len(eigValue) <= 2:
            outputComponentMsg = ARCPY.GetIDMessage(220065)
            return ARCPY.GetIDMessage(220114), ""
        else:
            info = self.__testBartlettSphericity(n,eigValue)

            if info is None:
                outputComponentMsg = ARCPY.GetIDMessage(220065)
                return "N/A", ""
            else:
                header =  ARCPY.GetIDMessage(220062)
                justifyArray =   ["left", "right", "right","right"]

                addSterisk = ""

                data = [[ARCPY.GetIDMessage(220055), ARCPY.GetIDMessage(220063), ARCPY.GetIDMessage(84095),ARCPY.GetIDMessage(84807) ]]
                numComponents = 0
                for id in NUM.arange(len(info[0])):
                    stPv = UTILS.formatValue(info[2][id], "%0.3f")

                    if info[2][id] < 0.05:
                        stPv += "*"
                        data.append([int(id+1), UTILS.formatValue(info[0][id], "%0.3f"), int(info[1][id]), stPv])
                        numComponents = id+1

                pvalues = info[2]
                conclusion = ""
                if pvalues[0] > 0.05:
                    conclusion = ARCPY.GetIDMessage(220074)
                else:
                    msgA = ARCPY.GetIDMessage(84082)
                    conclusion =  msgA.format(UTILS.formatValue(0.05, "%0.2f"))

                msg = conclusion + "\n" 

                outputComponentMsg = UTILS.outputTextTable(data, header = header,
                                                justify = justifyArray, pad = 1, colPad = 3,
                                                titleFillToken = "-", footnote=[msg], force2Txt=False, returnHTMLMsg=True)

                if len(data) == 1:
                    outputComponentMsg = ""
                    return "Non-Significant Found", ""
                else:
                    return numComponents, outputComponentMsg



    def __getNumberOfComponentsReport(self, eigValue, n,  brokenStickComp, varianceSelected, reporBartlett):

        self.outputEigenOptions = {}

        stringFormat = "%0.1f"
        header = ARCPY.GetIDMessage(220059)
        method  = ARCPY.GetIDMessage(220060)
        numComponents  = ARCPY.GetIDMessage(220061)
        strKG = ARCPY.GetIDMessage(220123)
        strBS = ARCPY.GetIDMessage(220122)
        strVar = ARCPY.GetIDMessage(220073) #Variance Explained
        strEvsd = ARCPY.GetIDMessage(220052) #Percent of Variance Explained
        strEv = ARCPY.GetIDMessage(220053) #Eigenvalues
        strCom = ARCPY.GetIDMessage(220055) #Component ID
        strAcc = ARCPY.GetIDMessage(220054) #Cumulative Percent of Variance Explained
        methods = [ strKG, strBS, strVar]

        headerColumns = [method, numComponents]
        justifyArray =   ["left", "right"]
        listTable = [headerColumns]
        strVariance = LOCALE.format_string(stringFormat,varianceSelected*100)
        self.strVarianceCum = strVariance
        strVar += " " + strVariance
        self.strVar = strVar
        v = brokenStickComp
        arr, cmp = self.__brokenStick(eigValue**2)

        self.outputEigenOptions[methods[0]]= self.__kaiserGuttman(eigValue**2)
        self.outputEigenOptions[methods[1]] = v, cmp
        self.outputEigenOptions[self.strVar]= self.__retainVariance(eigValue**2, varianceSelected)
        self.outputEigenOptions[strEv] = n, eigValue
        self.outputEigenOptions[strEvsd] = n, (eigValue**2)/NUM.sum(eigValue**2)
        self.outputEigenOptions[strAcc] = n, NUM.cumsum(self.outputEigenOptions[strEvsd][1])
        self.outputEigenOptions[strCom] = n, NUM.arange(len(eigValue))+1

        listToMethods = {"USER_SPECIFIED": (self.nComUserSpecified,  ARCPY.GetIDMessage(220089)),
                         "PERMUTATION":(self.nComRandomTest,ARCPY.GetIDMessage(220090) ),
                         "BROKEN_STICK": (self.nComBrokenStick, ARCPY.GetIDMessage(220122)),
                         "BARTLETT":(self.nComBartlettTest, ARCPY.GetIDMessage(220062))}

        for e in listToMethods:
            method = listToMethods[e][1]
            if e == self.methodSelected:
                method = [method, UTILS.buildSuperscript("*")]
            listTable.append([method, listToMethods[e][0]])


        outputReport = UTILS.outputTextTable(listTable, header = header,
                                             justify = justifyArray, pad = 1, colPad = 12,
                                             titleFillToken = "-", footnote=["* " + ARCPY.GetIDMessage(220064)],
                                             force2Txt=False)
        #### Create Output Table ###
        self.__outputEigenTable()

        return outputReport

    def __checkTotalVarianceAndNumberOfComponents(self, totalVariance = None, numberOfComponents = None,
                                                  eigValues = None, nElements = None, covariance = None,
                                                  methodEst = None, numPemutations = None):
        """ Check Number of Components and explained variance requested """
        self.nComUserSpecified = ARCPY.GetIDMessage(220075)
        self.nComRandomTest = ARCPY.GetIDMessage(220091)
        self.nComBrokenStick = None
        self.nComBartlettTest = None
        self.selectNumberComponentsMethod = None

        eigValues[eigValues<0] = EIGENMIN
        defaultNumComp = 1
        brokenStick, _ = self.__brokenStick(eigValues**2)
        defaultNumComp = brokenStick

        if methodEst is not None:
            if methodEst == "PERMUTATION":
                #### Components, table permutation test ####
                defaultNumComp, strMsg = self.__permutationTest(self.data, numPermutations = numPemutations)

                if defaultNumComp == -1:

                    self.nComRandomTest = ARCPY.GetIDMessage(220114)
                    ARCPY.AddIDMessage("WARNING", 110351)

                    self.nComBrokenStick = brokenStick
                    defaultNumComp = brokenStick
                    self.selectNumberComponentsMethod = "BROKEN_STICK"
                else:
                    self.selectNumberComponentsMethod = "PERMUTATION"
                    self.nComRandomTest = defaultNumComp
                    self.nComBrokenStick = brokenStick
                    ARCPY.AddMessage(strMsg)
                self.currentPemutationValue = defaultNumComp
            else:
                self.nComRandomTest = ARCPY.GetIDMessage(220091)
                self.nComBrokenStick = brokenStick
                self.selectNumberComponentsMethod = "BROKEN_STICK"
        else:
            defaultNumComp = brokenStick
            self.nComBrokenStick = brokenStick

        eigenValuesVE = eigValues**2 / NUM.sum(eigValues**2)
        accumEigenValues = NUM.cumsum(eigenValuesVE)/NUM.sum(eigenValuesVE)

        self.nComBartlettTest, reporBartlett = self.__sphericityMessageTable(nElements, eigValues)
        self.reporBartlett = reporBartlett

        numComponents = 0

        if totalVariance is not None and numberOfComponents is not None:
            self.selectNumberComponentsMethod = "USER_SPECIFIED"
            for id, eigAcc in enumerate(accumEigenValues):
                if eigAcc >= totalVariance and  (id+1) >= numberOfComponents:
                    ARCPY.AddIDMessage("WARNING",110350, NUM.round(eigAcc,2)*100,id+1)
                    numComponents = id+1
                    break
            self.nComUserSpecified = numComponents

        elif totalVariance is not None and numberOfComponents is None:
            self.selectNumberComponentsMethod = "USER_SPECIFIED"

            for id, eigAcc in enumerate(accumEigenValues):
                if eigAcc >= totalVariance:
                    numComponents = id+1
                    break
            self.nComUserSpecified = numComponents

        elif totalVariance is None and numberOfComponents is not None:
            self.selectNumberComponentsMethod = "USER_SPECIFIED"
            numComponents = numberOfComponents
            self.nComUserSpecified = numComponents
        else:
            self.selectNumberComponentsMethod = "BROKEN_STICK"
            numComponents = self.nComBrokenStick
            try:
                if self.nComBrokenStick < self.nComBartlettTest:
                    self.selectNumberComponentsMethod = "BARTLETT"
                    numComponents = self.nComBartlettTest
            except:
                pass

        if len(eigValues) < numComponents:
            ARCPY.AddIDMessage("WARNING", 110352, str(len(eigValues)))
            numComponents = len(eigValues)

        if numComponents == self.data.shape[1]:
            ARCPY.AddIDMessage("WARNING", 110353)

        self.methodSelected = self.selectNumberComponentsMethod

        #### Decision PCA output number of components ####
        if self.categoryField is None:
            listToCompare ={}
            if self.selectNumberComponentsMethod in ["PERMUTATION", "BROKEN_STICK", "USER_SPECIFIED"]:
                if self.selectNumberComponentsMethod  == "PERMUTATION":
                    listToCompare = {"PERMUTATION":self.nComRandomTest,
                                     "BROKEN_STICK": self.nComBrokenStick,
                                     "BARTLETT":self.nComBartlettTest}
                elif self.selectNumberComponentsMethod  == "BROKEN_STICK":
                    listToCompare = { "BROKEN_STICK": self.nComBrokenStick,
                                      "BARTLETT":self.nComBartlettTest}
                else:
                    listToCompare = []

                maxComp = -1
                for e in  listToCompare:
                    if type(listToCompare[e]) != str:
                        if listToCompare[e] > maxComp:
                            maxComp = listToCompare[e]
                            self.methodSelected =  e
                if maxComp != -1:
                    numComponents  = maxComp
                else:
                    self.methodSelected = "USER_SPECIFIED"
                    numComponents = self.nComUserSpecified

        #### Evaluate the differenct methods
        report = self.__getNumberOfComponentsReport(eigValues, nElements, brokenStick, accumEigenValues[numComponents-1], reporBartlett )
        return report, numComponents

    def __checkVariance(self):
        """ Check Variance """

        noVariance = []
        for id in NUM.arange(self.data.shape[1]):
            if NUM.isclose(NUM.var(self.data.T[id]), 0.0):
                noVariance.append(self.numericFields[id])

        if len(noVariance) > 0  and len(noVariance) < self.data.shape[1]:
            ARCPY.AddIDMessage("ERROR", 110355,",".join(noVariance))
            raise SystemExit

        if len(noVariance) > 0  and len(noVariance) == self.data.shape[1]:
            ARCPY.AddIDMessage("ERROR", 110354)
            raise SystemExit

    def __reportEigenValues(self, eigValues, percentageExplained, compOutput, report = ""):
        """ Generate Table with Eigen Values Output """

        header = ARCPY.GetIDMessage(220053)
        component  = ARCPY.GetIDMessage(220066)
        eigenValue  = ARCPY.GetIDMessage(220052)
        eigenValueAcc  = ARCPY.GetIDMessage(220054)
        outputComponentMsg = ARCPY.GetIDMessage(220067)
        headerColumns = [component, eigenValue, eigenValueAcc ]
        justifyArray =   ["left", "left", "left"]
        listTable = [headerColumns]
        accum = 0
        eigValues[eigValues<0] = EIGENMIN
        eigValues = eigValues**2 /NUM.sum(eigValues**2)

        for i, typeVar in enumerate(eigValues):
            accum += eigValues[i]
            id = "{0}".format(i+1)

            if i <= compOutput:
                id = [str(i+1), UTILS.buildSuperscript("*")]

            listTable.append([id, 
                              UTILS.formatValue(eigValues[i]*100, "%0.2f"), 
                              UTILS.formatValue(accum*100, "%0.2f")])

        outputReport = UTILS.outputTextTable(listTable, header = header,
                                            justify = justifyArray, pad = 1, colPad = 3,
                                            titleFillToken = "-", force2Txt=False, returnHTMLMsg=True, footnote=[outputComponentMsg])

        self.outputMessage = [report, outputReport, self.reporBartlett]

    def __createVectorTable(self, n, vectorData, numComponents, transpose = False):
        """Create Eigenvector table """

        dictFieldNameAlias = {field.name.upper():field.aliasName for field in self.reader.ssdo.info.fields}
        fieldAliases = [dictFieldNameAlias[f] for f in  self.reader.fields[0]]
        datVect = [NUM.array(fieldAliases)]
        fieldStr = ARCPY.GetIDMessage(220119)
        eigVectStr = ARCPY.GetIDMessage(220120)
        names = [fieldStr]
        alias = [fieldStr]
        maxNumber = 20
        nComp = min(maxNumber, numComponents)

        for i in NUM.arange(numComponents):
            if transpose:
                datVect.append(vectorData.T[i].copy())
            else:
                datVect.append(vectorData[i].copy())

            names.append("EIGVECT"+str((int(i)+1)))
            alias.append(eigVectStr.format(str((int(i)+1))))

        container = UTILS.DataContainer()
        container.generateOutput(self.outputTableVectors, datVect, names = names, alias = alias)

        eigVChart = ARCPY.Chart(ARCPY.GetIDMessage(220121))
        eigVChart.title = ARCPY.GetIDMessage(220121)
        eigVChart.type = "bar"
        eigVChart.xAxis.field = fieldStr
        eigVChart.xAxis.title = fieldStr
        eigVChart.yAxis.field = [n for id, n in enumerate(names) if  id < nComp+1 and n != fieldStr]
        eigVChart.yAxis.title  = ARCPY.GetIDMessage(84974)
        eigVChart.bar.rotated = False
        eigVChart.bar.multiSeriesDisplay = "stacked"
        self.eigenVectorCharts = [eigVChart]

    def PCA(self, totalVariance = None, 
            numberOfComponents = None, 
            useCovariance = False, 
            methodEst = "BROKEN_STICK",
            numPemutation = 0):

        self.currentPemutationValue = None

        """ Principal Component Analysis """ 

        #### Check Variance ####
        self.__checkVariance()

        n = len(self.data)
        
        if numberOfComponents is not None:
            if numberOfComponents > n:
                ARCPY.AddIDMessage("ERROR", 110457)
                raise SystemExit          

        totalVar = NUM.var(self.data, ddof=1, axis=0)
        singularValues = None

        oldSettings = NUM.seterr(all='ignore')
        self.meanValues = NUM.mean(self.data, axis = 0)
        self.data -= self.meanValues
        NUM.seterr(**oldSettings)
        eigenValues = None
        eigenVectors = None
        a = None
        covariance = None
        numComponents = 0

        if useCovariance:
            ### Using Covariance ####
            cov = NUM.cov(self.data, rowvar = False)
            covariance = cov
            eigenValues , eigenVectors = LA.eigh(cov)
            idx = NUM.argsort(eigenValues)[::-1]
            eigenVectors = eigenVectors[:,idx]
            eigenValues = eigenValues[idx]
            eigenValues1 = eigenValues.copy()
            eigenValues1 = eigenValues / eigenValues.sum()

            #### Check input / Generate Report####
            report, numComponents = self.__checkTotalVarianceAndNumberOfComponents(totalVariance, 
                                                                                   numberOfComponents, 
                                                                                   eigenValues, 
                                                                                   n, 
                                                                                   covariance,
                                                                                   methodEst,
                                                                                   numPemutation)

            sumPer = 0
            id = 0
            for id in NUM.arange(numComponents):
                sumPer += eigenValues1[id]

            #### Create EigenVector Table ####
            if self.outputTableVectors is not None:
                self.__createVectorTable(len(eigenVectors), eigenVectors, numComponents, transpose = True)

            eigenVectors = eigenVectors[:,0:id+1]
            a = NUM.dot(self.data, eigenVectors)

        else:
            U = S = V = None
            try:
                U, S, V = LA.svd(self.data, full_matrices=False)
            except:
                ARCPY.AddIDMessage("ERROR", 110357)
                raise SystemExit

            orgV = V
            maxAbsCols = NUM.argmax(NUM.abs(U), axis=0)
            signsValues = NUM.sign(U[maxAbsCols, range(U.shape[1])])
            U *= signsValues
            V *= signsValues[:, NUM.newaxis]
            singularValues = S.copy()
            explVariance = (S ** 2) / (self.data.shape[0] - 1)
            totalVar = explVariance.sum()
            explVarianceRatio = explVariance / totalVar

            idx = NUM.argsort(S)[::-1]
            eigenValues = S[idx]
            eigenValues1 = S.copy()
            eigenValues1 = eigenValues**2 / NUM.sum(eigenValues**2)

            #### Check input / Generate Report####
            report, numComponents = self.__checkTotalVarianceAndNumberOfComponents(totalVariance, 
                                                                                   numberOfComponents, 
                                                                                   eigenValues, 
                                                                                   n, 
                                                                                   covariance,
                                                                                   methodEst,
                                                                                   numPemutation)
            sumPer = 0
            id = 0
            for id in NUM.arange(numComponents):
                sumPer += eigenValues1[id]

            #### Create EigenVector Table ####
            if self.outputTableVectors is not None:
                self.__createVectorTable(len(orgV), orgV, numComponents, transpose = False)

            S = S[0:id+1]

            U = U[:, :id+1]

            U *= S 
            a = U

        outputData = []
        fieldNames = []
        aliasFieldNames = []

        #### Only when new dataset is created ####
        if self.reader.outputOption == "NEW_DATASET_JUST_NEW_FIELDS":
            outputData = [self.reader.oidFieldData] + [self.reader.getData(i) for i in self.originalFieldNames ]
            fieldNames = ["SOURCE_ID"] + self.originalFieldNames
            aliasFieldNames = ["Source ID"] + [self.reader.dictFields[i] for i in self.originalFieldNames ]
            fieldNames = self.__handleUnsupportedFieldNames(fieldNames)

        sumPer = 0
        for id in NUM.arange(numComponents):
            sumPer += eigenValues1[id]
            outputData.append(a.T[id].real.copy())
            fieldNames.append("PCA{0}".format(id+1))
            aliasFieldNames.append("Component {0}".format(id+1))

        self.__reportEigenValues(eigenValues, sumPer, id, report )

        self.outputData = outputData
        self.fieldNames = fieldNames
        self.aliasFieldNames = aliasFieldNames

    def __handleUnsupportedFieldNames(self, listFieldNames):
        """ Handle field names """
        listUnSupportted = {"OBJECTID":"OBJECTID_1"}
        lst = []
        for e in listFieldNames:
            if e in listUnSupportted:
                lst.append(listUnSupportted[e])
            else:
                lst.append(e)
        return lst

    def __classCovariance(self, data, y, weights):
        cov = NUM.zeros(shape=(data.shape[1], data.shape[1]))
        for idx, group in enumerate(self.categories):
            groudData = data[y == group]
            cov += weights[idx] * NUM.atleast_2d(NUM.cov(groudData.T, bias = 1))
        return cov

    def LDA(self, totalVariance = None, numberOfComponents = None, plt = False, option = 1):
        """ Linear Discriminant Analysis """
        self.currentPemutationValue = None

        #### Check Variance ####
        self.__checkVariance()

        scatMat = []
        means = []
        nElem = []
        n = len(self.data)
        nCats = len(self.categories)

        self.meanValues = NUM.mean(self.data, axis = 0)
        self.dataBase = self.data.copy()
        rav = self.orgCategoriesArr.ravel()
        numElem = float(len(rav))
        evals, evecs = None, None
        tolerance = 1.0e-4

        #### Use covariance with datasets with less than 10000 records ####
        covariance = None

        #### Check the number of categories ####
        if len(self.categories) <= 1:
            ARCPY.AddIDMessage("ERROR", 110356)
            raise SystemExit

        #### Check the number of categories ####
        unq, counts  = NUM.unique(rav, return_counts = True)
        if len(self.categories) ==  n or NUM.sum(counts==1):
            ARCPY.AddIDMessage("ERROR", 110368)
            raise SystemExit

        if option == 2:
            covariancPerClass = []
            for cat in self.categories:
                mask =  rav == cat
                data = self.data[mask]
                nElem.append(mask.sum())
                covariancPerClass.append(NUM.cov(data.T, bias=1))

            weights = NUM.array(nElem)/numElem
            SW = NUM.average(covariancPerClass, axis=0, weights= weights)

            totalScatter = NUM.cov(self.data.T, bias=1)
            covariance = totalScatter
            SB = totalScatter - SW
            evals, evecs = None, None

            try:
                evals, evecs =  LA.eigh(SB, SW)
            except:
                ARCPY.AddError("It not possible to solve the linear system.")
                raise SystemExit

            varExpl = evals / NUM.sum(evals)

        if option == 1:
            means = []

            for cat in self.categories:
                mask =  rav == cat
                nElem.append(mask.sum())
                data = self.data[mask]
                mean = data.mean(0)
                means.append(mean)

            weights = NUM.array(nElem)/numElem
            means = NUM.array(means)
            #coraviance = self.__classCovariance(self.data, rav, weights)

            dataCov = []
            for idx, cat in enumerate(self.categories):
                dataCat = self.data[rav == cat, :]
                dataCov.append(dataCat - means[idx])

            meansByWeight = NUM.dot(weights, means)
            dataCov = NUM.concatenate(dataCov, axis=0)

            refactData = dataCov
            scalings = None
            stdCov = dataCov.std(axis=0)
            stdCov[stdCov == 0] = 1.
            fac = 1. / (n - nCats)
            U = None 
            S = None
            V = None
            rank = None
            if self.scaleInput:

                refactData = NUM.sqrt(fac) * (dataCov / stdCov)

                try:
                    U, S, V = LA.svd(refactData, full_matrices=False)
                except:
                    ARCPY.AddIDMessage("ERROR", 110357)
                    raise SystemExit

                rank = NUM.sum(S > tolerance)
                scalings = (V[:rank] / stdCov).T / S[:rank]
                refactData= NUM.dot(((NUM.sqrt((n * weights) * fac)) *
                            (means - meansByWeight).T).T, scalings)

            try:
                _, S, V = LA.svd(refactData, full_matrices=0)
            except:
                ARCPY.AddIDMessage("ERROR", 110357)
                raise SystemExit

            rank = NUM.sum(S > tolerance)

            evals =  S

            if not self.scaleInput:
                scalings = (V[:rank]).T / S[:rank]
            else:
                scalings = NUM.dot(scalings, V.T[:, :rank])
            evecs = scalings

        #### Sort Eigen Values Index ####
        idx = NUM.argsort(evals[:rank])[::-1]
        evecs = evecs[:,idx]
        evals = evals[idx]
        evalSource= evals.real.copy()

        a = NUM.dot(self.dataBase , evecs.real)

        #### Eigen Values in percentage ####
        if not NUM.allclose(NUM.sum(evals),0):
            #### Check input / Generate Report####
            report, numComponents = self.__checkTotalVarianceAndNumberOfComponents(totalVariance, numberOfComponents, evals, n, covariance)
        else:
            ARCPY.AddIDMessage("WARNING",110373)
            report = ""
            numComponents = len(evalSource)

        #### Create EigenVector Table ####
        if self.outputTableVectors is not None:
            self.__createVectorTable(evecs.shape[1], evecs, numComponents, transpose = True)

        sumPer = 0
        id = 0
        for id in NUM.arange(numComponents):
            sumPer += evalSource[id]

        if plt:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            plt.scatter(a.T[0],a.T[1] )
            plt.title(str(evecs.real))
            plt.show()

        outputData = []
        fieldNames = []
        aliasFieldNames = []

        #### Copy only used data ####
        if self.reader.outputOption == "NEW_DATASET_JUST_NEW_FIELDS":
            outputData = [self.reader.oidFieldData] + [self.reader.getData(i) for i in self.originalFieldNames ] + [rav]
            fieldNames = ["SOURCE_ID"] + self.originalFieldNames + [self.originalCatFieldName]
            aliasFieldNames = ["Source ID"] + [self.reader.dictFields[i] for i in self.originalFieldNames +[self.originalCatFieldName] ]
            fieldNames = self.__handleUnsupportedFieldNames(fieldNames)            

        sumPer = 0
        id = 0
        LDAComp = []
        for id in NUM.arange(numComponents):
            sumPer += evalSource[id]
            comp = a.T[id].real.copy()
            outputData.append(comp)
            LDAComp.append(comp)
            fieldNames.append("LDA{0}".format(id+1))
            aliasFieldNames.append("Component {0}".format(id+1))

        self.__reportEigenValues(evalSource.real, sumPer, id, report )

        #### Generate Chart ####
        if len(LDAComp) >=2:
            self.__createScatterPlotLDA(LDAComp, ["LDA1", "LDA2"], rav) 

        self.outputData = outputData
        self.fieldNames = fieldNames
        self.aliasFieldNames = aliasFieldNames

    def __kaiserGuttman(self, eigValue):
        """ 
        Get Number of Components using Kaiser Guttman
        INPUT:
            eigValue (1d Array): Original Eigenvalues
        RETURN:
            (int, 1D array) : Number of Components Obtained, 
                              Array (length Eigenvalues) with  repeating the
                              selected variance
        """
        info = eigValue/NUM.sum(eigValue)
        value = NUM.where(eigValue > eigValue.mean())[0][::-1]
        if len(value):
            return  value[0] + 1, [info.mean()]*len(eigValue)
        else:
            return 0, [info.mean()]*len(eigValue)

    def __brokenStick(self, eigValue):
        """ 
        Get Number of Components using Broken Stick
        INPUT:
            eigValues (1d Array): Original Eigenvalues
        RETURN:
            (int, 1D array) : Number of Components Obtained, 
                              Array (length Eigenvalues) with  repeating the
                              selected variance
        """
        bComp = [1/(x+1) for x in range(0, self.numComponents)]
        total = NUM.full(len(eigValue), NUM.sum(bComp))
        bComp.pop()
        subs = NUM.cumsum(NUM.array([0] + bComp))[0:len(eigValue)]
        bEig = (total - subs)/self.numComponents
        accumEigenValues = eigValue/NUM.sum(eigValue)
        idBroken = NUM.where(accumEigenValues - bEig < 0)[0]

        #### Check Ids ####
        if len(idBroken):
            idBroken = idBroken[0]
        else:
            idBroken = 0

        #### Set at least one component ####
        if idBroken == 0:
            idBroken = 1

        return idBroken, bEig[0:len(eigValue)]

    def __retainVariance(self, eigValue, val):
        """ 
        Get Number of Components that contains at least the variance provided
        INPUT:
            eigValue (1d Array): Original Eigenvalues
            val (double): Threshold
        RETURN:
            (int, 1D array) : Number of Components Obtained, 
                              Array (length Eigenvalues) with  repeating the
                              selected variance
        """
        infoR = eigValue/NUM.sum(eigValue)
        info = NUM.cumsum(eigValue)/NUM.sum(eigValue)
        
        for id, eigAcc in enumerate(info):
            if eigAcc >= val:
                return id+1, [infoR[id]]*len(eigValue)

        return 1 , [infoR[0]]*len(eigValue)

    def __getEigenvalues(self, X):
        """ 
        Get Eigenvalues 
        INPUT:
            X (2d Array): data
        RETURN:
            eigenvalues (1D/None): eigenvalues
        """
        S = None
        try:
            #### Return only SV ####
            S = NUM.linalg.svd(X, full_matrices=False, compute_uv=False)
            S = S[NUM.argsort(S)[::-1]]
        except:
            S = None
        return S

    def __getRndF(self, ev):
        """ Random Method in Permutation Test """
        flipCumSum = NUM.cumsum(ev)[::-1] - ev
        rndF = NUM.divide(ev[:-1], flipCumSum[:-1])
        return rndF

    def __permutationTest(self, data, numPermutations, significance = 0.05):
        """ 
        Get Number of Components using permutation test  getRndF
        INPUT:
            data (2d Array): data
            numPermutations (int): Number of Permutations

            significance {float}:
        RETURN:
            Number of Components (int): -1 if not detected
        """
        seed = UTILS.getRandomSeed()

        #### Avoid alter original data ####
        x = data.copy()
        s = self.__getEigenvalues(x)
        if s is None:
            return -1, ""

        obs = self.__getRndF(s)
        NUM.random.seed(seed)
        msg = ARCPY.GetIDMessage(84184)
        ARCPY.SetProgressor("step",msg.format(1,numPermutations), 0, numPermutations, 1)
        rndS = []
        for i in NUM.arange(numPermutations):
            S = None
            #### Shuffle Columns ####
            for icol in NUM.arange(x.shape[1]):
                NUM.random.shuffle(x.T[icol])

            ### Get Eigenvalue from 
            S = self.__getEigenvalues(x)
            if S is not None:
                ### Get RndF value ###
                rndF = self.__getRndF(S)
                rndS.append(rndF)

            ARCPY.SetProgressorPosition()

        rndS = NUM.asarray(rndS)
        pValues = (NUM.sum( rndS > obs , axis = 0 ) + 1) / (numPermutations + 1)

        header = ARCPY.GetIDMessage(220090)
        listTable = [[ARCPY.GetIDMessage(220055), ARCPY.GetIDMessage(84807)]]
        justifyArray = ["left", "right"]
        #### Stop when value is not significant ####
        for id, pv in enumerate(pValues):
            if pv > significance:
                if id == 0:
                    return -1, ""
                else:
                    listTable.append([id+1, UTILS.formatValue( pv, "%0.3f")])
                    outputReport = UTILS.outputTextTable(listTable, header = header,
                                                        justify = justifyArray, pad = 1, colPad = 20,
                                                        titleFillToken = "-")
                    return id, ""
            else:
                listTable.append([id+1, UTILS.formatValue( pv, "%0.3f")+"*"])

        outputReport = UTILS.outputTextTable(listTable, header = header,
                                            justify = justifyArray, pad = 1, colPad = 20,
                                            titleFillToken = "-")

        return id, ""


    def __testBartlettEquality(self, n, eigValue, covariance = None):
        """
        Bartlett's Equality Test
        
        INPUT:
            n (int): Number of records
            eigValue (1D array): Eigenvalues
            covariance {2D Array}: Covariance matrix
        RETURN:
            Chi2 test value, Degree of Freedom, Pvalue
        """

        #### Bartlett's Equality Test ###
        p = len(eigValue)
        if covariance is not None:
            R = self.__correlation(covariance)
            NUM.fill_diagonal(R,1)
            det = LA.det(R)
        else:
            det = NUM.prod(eigValue)

        if det == 0:
            return None

        x2 = -NUM.log(det) * ((n-1-(2*p+5)/6))
        ddof = p*(p-1)/2
        p = CHI2.pdf(x = x2, df = ddof)

        return x2, ddof, p

    def __testBartlettSphericity(self, n, eigValue):
        """
        Bartlett's Sphericity Test

        INPUT:
            n (int): Number of records
            eigValue (1D array): Eigenvalues
            covariance {2D Array}: Covariance matrix
        RETURN:
            lists of Chi2 test value, Degree of Freedom, Pvalue

        reference:
            Peres-Neto, Pedro R., Donald A. Jackson, and Keith M. Somers. "How many principal components? Stopping rules for determining the number of non-trivial axes revisited." Computational Statistics & Data Analysis 49.4 (2005): 974-997.
            Grossman, Gary D., David M. Nickerson, and Mary C. Freeman. "Principal component analyses of assemblage structure data: utility of tests based on eigenvalues." Ecology 72.1 (1991): 341-347.
        """

        kComp = len(eigValue)
        kmain = NUM.arange(1, kComp)
        kleft = kComp - NUM.arange(1, kComp)

        sumEigenleft = NUM.sum(eigValue) - NUM.cumsum(eigValue)
        sumEigenleft = sumEigenleft[:-1]

        meanEigenleft = sumEigenleft / kleft

        prodEigenleft = NUM.cumprod(eigValue[::-1])
        prodEigenleft = prodEigenleft[-2::-1]

        item1 = []
        for ii in range(kComp - 1):  ## TODO some overflow problem here
            item1_temp1 = NUM.power(NUM.divide(1., eigValue[:(ii+1)] - meanEigenleft[ii]), 2)
            item1_temp1 = NUM.nan_to_num(item1_temp1)
            item1_temp2 = NUM.multiply(meanEigenleft[ii] ** 2, NUM.sum(item1_temp1))
            item1_temp2 = NUM.nan_to_num(item1_temp2)
            item1.append(item1_temp2)

        item1 = NUM.asarray(item1)
        item2 = n - kmain - (2 * kleft + 7 + 2 / kleft) / 6.
        itme3 = None

        if NUM.sum(prodEigenleft <= 0) > 0  or NUM.sum(meanEigenleft <= 0) > 0:
            return None

        item3 = - NUM.log(prodEigenleft) + kleft * NUM.log(meanEigenleft)
        x2 = NUM.multiply(item2 + item1, item3)

        dof = 0.5 * (kleft - 1) * (kleft + 2)
        dof = dof.astype(int)

        p = 1 - CHI2.cdf(x=x2, df=dof)
        return x2[:-1], dof[:-1], p[:-1]

    def __correlation(self, c):
        #### Calculate Correlation ####
        d = None
        try:
            d = NUM.diag(c)
        except:
            return c / c

        stddev = NUM.sqrt(d.real)
        c /= stddev[:, None]
        c /= stddev[None, :]
        NUM.clip(c.real, -1, 1, out=c.real)
        if NUM.iscomplexobj(c):
            NUM.clip(c.imag, -1, 1, out=c.imag)
        return c

    def output(self, outputFC):
        """ Generate Output Feature Class """
        
        ### Special case for PCA, because it supports whatever shape type ####
        self.reader.honorM = True

        self.reader.output(outputFC, self.outputData, self.fieldNames, self.aliasFieldNames, adjustTexFields = True)



#### Layer Info ####

def genColor(nColors, base = "100"):
    """
    Generate Random Colors
    """
    diff = 100
    NUM.random.seed(50)

    dictC = []
    lastC = None
    while len(dictC) < nColors:
        cols = NUM.random.randint(60, 240, 500)
        c = 0
        t = []
        for i in cols:
            t.append(i)
            if len(t) == 3:
                col =",".join([str(i) for i in t])
                if col not in dictC:
                    if lastC is not None:
                        v = NUM.sqrt(((NUM.array(lastC)-NUM.array(t))**2).sum())
                        if v > diff:
                            dictC.append(col)
                            lastC = t
                    else:
                        dictC.append(col+","+base)
                        lastC = t

                    if len(dictC) == nColors:
                        return dictC
                    t = []

def createJSONCIM(shapeType, fieldName,  heading, categories, colors, changeClasses= True):
    import json
    from arcpy.cim.cimloader import GetJSONTypeOBJ
    from arcpy.cim.cimloader import  CimJsonEncoder
    #minValueLabel = UTILS.formatValue(minValue,"%0.4f" )
    #maxValueLabel = UTILS.formatValue(maxValue,"%0.4f" )
    layerDict = {"Polygon": ("RFPolygonClassification.lyrx", 8,337),
                 "Polyline":("DimensionReductionPolyline.lyrx", 8,368),
                 "Point": ("RFPointClassification.lyrx",8,390)}

    pathLayer = OS.path.join(UTILS.pathLayers,layerDict[shapeType][0])

    #### Read layer template ####
    lyrxFile = open(pathLayer, 'r') 
    startLayerJsong = layerDict[shapeType][1]
    endLayerJsong = layerDict[shapeType][2]
    jsonRasterCIM =""
    for count in NUM.arange(endLayerJsong):
        line = lyrxFile.readline() 
        if count >= startLayerJsong and count<=endLayerJsong:
            #### Fix scape layer ####
            if "workspaceConnectionString" in line:
                line = '"workspaceConnectionString" : "DATABASE=rrerr.gdb",\n'
            jsonRasterCIM += line
    lyrxFile.close()

    if changeClasses:
        #### Get Layer CIM to Change Layer Properties ####
        layerCIMFeature = GetJSONTypeOBJ(json.loads(jsonRasterCIM))
        layerCIMFeature.renderer.fields = [fieldName]
        layerCIMFeature.renderer.groups[0].heading = heading
        classBaseObj = layerCIMFeature.renderer.groups[0].classes[0]
        classBaseObjStr = json.dumps(classBaseObj, cls=CimJsonEncoder)
        listClasses = []
        for id, cat in enumerate(categories):
            newClassObj = GetJSONTypeOBJ(json.loads(classBaseObjStr))
            newClassObj.label = str(cat)
            if type(cat) in [NUM.int32, NUM.int64]:
                newClassObj.values[0].fieldValues = [int(cat)]
            else:
                newClassObj.values[0].fieldValues = [cat]
            color = [int(v) for v in colors[id].split(",")]
            if len(color) == 3:
                color.append(100)

            if shapeType == "Point":
                newClassObj.symbol.symbol.symbolLayers[0].markerGraphics[0].symbol.symbolLayers[1].color.values = color
            if shapeType == "Polygon":
                newClassObj.symbol.symbol.symbolLayers[1].color.values = color
            if shapeType == "Polyline":
                newClassObj.symbol.symbol.symbolLayers[0].color.values = color
            listClasses.append(newClassObj)

        layerCIMFeature.renderer.groups[0].classes = listClasses
        layerCIMFeature.renderer.useDefaultSymbol = False

        #### Get Back JSON String ####
        jsonData = json.dumps(layerCIMFeature, cls=CimJsonEncoder)
        return  "JSONCIMDEF="+jsonData
    else:
        return "JSONCIMDEF="+jsonRasterCIM


def applyJSONLayerUsingClassDef(shapeType, 
                  fieldName, 
                  heading, 
                  categories, 
                  colors ,
                  size = 7,
                  width = 0.5,
                  defaultLabelStr = "other values",
                  fromColor = "250,110,110,250",
                  defaultAllSymbolSize = 6,
                  endColor = "110,250,110,250"):

    colorRamp="""{"type":"multipart","colorRamps":[{"type":"algorithmic","fromColor":[255,0,0,255],"toColor":[255,255,0,255],"algorithm":"esriHSVAlgorithm"},{"type":"algorithmic","fromColor":[0,255,255,255],"toColor":[0,0,255,255],"algorithm":"esriHSVAlgorithm"}]}"""
    pointBase='{"type":"esriSMS","style":"esriSMSCircle","color":[76,115,0,255],"size":7,"angle":0,"xoffset":0,"yoffset":0,"outline":{"color":[110,110,50,200],"width":0.1}}'
    lineBase='{"type":"esriSLS","style":"esriSLSDot","color":[115,76,0,255],"width":1}'
    polygonBase='{"type":"esriSFS","style":"esriSFSSolid","color":[115,76,0,255],"outline":{"type":"esriSLS","style":"esriSLSSolid","color":[110,110,110,255],"width":1}}'
    basic = '{"type":"algorithmic","fromColor":['+fromColor+'],"toColor":['+endColor+'],"algorithm":"esriCIELabAlgorithm"}'
    
    if shapeType=="Point":
        defaultSymbol=pointBase
    if shapeType=="Polyline":
        defaultSymbol=lineBase
    if shapeType=="Polygon":
        defaultSymbol=polygonBase

    info = '{"type":"uniqueValueDef","uniqueValueFields":["'+fieldName+ '"],"fieldDelimiter":",","baseSymbol":'+defaultSymbol+',"colorRamp":'+basic+'}'

    return f"JSONCLASSDEF={info}"



