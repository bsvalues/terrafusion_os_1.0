################### Imports ########################
import os as OS
import locale as LOCALE
import numpy as NUM
import arcgisscripting as ARC
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.analysis as ANA
import SSUtilities as UTILS
import SSDataObject as SSDO
import math as MATH
import tempfile as TEMPFILE

SUPPORTED_FIELD_TYPES = ['INTEGER', 'SMALLINTEGER', 'SHORT', 'LONG', 'TEXT', 'STRING', 'BIGINTEGER']
SUPPORTED_PIXEL_TYPES = ['U1', 'U2', 'U4', 'U8', 'S8', 'U16', 'S16', 'U32', 'S32']
SUPPORTED_DATA_TYPES = ["POLYGON", "RASTER"]
MESSAGE_DICT = {
    "BOTH LOW": ARCPY.GetIDMessage(220134),
    "BOTH HIGH": ARCPY.GetIDMessage(220135),
    "LOW - LOW": ARCPY.GetIDMessage(220136),
    "LOW - MEDIUM": ARCPY.GetIDMessage(220137),
    "LOW - HIGH": ARCPY.GetIDMessage(220138),
    "MEDIUM - LOW": ARCPY.GetIDMessage(220139),
    "MEDIUM - MEDIUM": ARCPY.GetIDMessage(220140),
    "MEDIUM - HIGH": ARCPY.GetIDMessage(220141),
    "HIGH - LOW": ARCPY.GetIDMessage(220142),
    "HIGH - MEDIUM": ARCPY.GetIDMessage(220143),
    "HIGH - HIGH": ARCPY.GetIDMessage(220144)
}

def getInputDataType(paramDS):
    if not paramDS.value:
        return None, None

    inputDAPath = paramDS.valueAsText
    if not ARCPY.Exists(inputDAPath):
        return None, None
    try:
        desc = ARCPY.Describe(inputDAPath)
        dataType = desc.dataType.upper()
        if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
            return "POLYGON", None
        elif dataType in ['RASTERDATASET', 'RASTERBAND', 'RASTERLAYER', 'IMAGESERVER']:
            fieldCandidates = []
            if len(desc.children) > 1:
                desc = desc.children[0]
            for f in desc.fields:
                if f.type.upper() in SUPPORTED_FIELD_TYPES:
                    fieldCandidates.append(f.name)
            if len(fieldCandidates) == 1:
                return "RASTER", fieldCandidates[0]
            else:
                return "RASTER", None
        else:
            return None, None
    except:
        return None, None


def execute(parameters, messages):
    ARCPY.env.overwriteOutput = True
    varNameRef = UTILS.getTextParameter(1, parameters)
    varNameTar = UTILS.getTextParameter(3, parameters)

    generalDTRef, defaultRasterField = getInputDataType(parameters[0])
    inputDataRef = parameters[0].valueAsText
    if generalDTRef == "RASTER":
        inputDataRef = ARCPY.Raster(inputDataRef)
        if inputDataRef.bandCount > 1:
            inputDataRef = ARCPY.Raster(inputDataRef.getRasterBands()[0])

    generalDTTar, defaultRasterField = getInputDataType(parameters[2])
    inputDataTar = parameters[2].valueAsText
    if generalDTTar == "RASTER":
        inputDataTar = ARCPY.Raster(inputDataTar)
        if inputDataTar.bandCount > 1:
            inputDataTar = ARCPY.Raster(inputDataTar.getRasterBands()[0])

    outputFC = None
    if parameters[4].enabled:
        outputFC = UTILS.getTextParameter(4, parameters)
    outputRaster = None
    if parameters[5].enabled:
        outputRaster = UTILS.getTextParameter(5, parameters)

    outFCRef = None
    outFCTar = None

    if parameters[6].enabled:
        outFCRef = UTILS.getTextParameter(6, parameters)
        outFCTar = UTILS.getTextParameter(7, parameters)

    #### Analysis ####
    sb = SABREMain(inputDataRef, varNameRef, generalDTRef, inputDataTar, varNameTar, generalDTTar,
                   outFC=outputFC, outSubFCRef=outFCRef, outSubFCTar=outFCTar, outRaster=outputRaster)

    if outputFC:
        sb.createLocalInHomogentitySymologyVector(4)

    if outputRaster:
        sb.rebuildRasterBivariateColorSymbol(5)

    if outFCRef is not None:
        symbolStr = sb.exportSubResult(outFCRef, "REF")
        if symbolStr is not None:
            ARCPY.gp.SetParameterSymbology(6, symbolStr)
    if outFCTar is not None:
        symbolStr = sb.exportSubResult(outFCTar, "TAR")
        if symbolStr is not None:
            ARCPY.gp.SetParameterSymbology(7, symbolStr)
    sb.report()
    parameters[8].value = sb.sbObj.vm.calVMeasure(1)
    parameters[9].value = sb.sbObj.vm.getHomogentity()
    parameters[10].value = sb.sbObj.vm.getCompleteness()

    #### Create Bar Chart for Tar and Ref Categories ####
    if outputFC or outputRaster:
        if outputFC:
            resParam = parameters[4]
            numField = getPreservedAreaFieldName(outputFC)
            if not numField:
                return
            yTitle = ARCPY.GetIDMessage(220097)
        else:
            resParam = parameters[5]
            numField = "Count"
            yTitle = ARCPY.GetIDMessage(220098)

        chartList = []

        chartTitle = ARCPY.GetIDMessage(220099)
        barChart = ARCPY.Chart(chartTitle)
        barChart.type = "bar"
        barChart.title = chartTitle
        barChart.xAxis.field = "CAT_IN"
        barChart.xAxis.title = sb.outCatFieldAliasRef
        barChart.yAxis.field = numField
        barChart.yAxis.title = yTitle
        barChart.xAxis.sort = "asc"
        barChart.legend.title = sb.outCatFieldAliasTar
        barChart.bar.aggregation = "SUM"
        barChart.bar.splitCategory = "CAT_OVL"
        chartList.append(barChart)

        chartTitle = ARCPY.GetIDMessage(220100)
        barChart = ARCPY.Chart(chartTitle)
        barChart.type = "bar"
        barChart.title = chartTitle
        barChart.xAxis.field = "CAT_OVL"
        barChart.xAxis.title = sb.outCatFieldAliasTar
        barChart.yAxis.field = numField
        barChart.yAxis.title = yTitle
        barChart.xAxis.sort = "asc"
        barChart.legend.title = sb.outCatFieldAliasRef
        barChart.bar.aggregation = "SUM"
        barChart.bar.splitCategory = "CAT_IN"
        chartList.append(barChart)
        resParam.charts = chartList

def buildOutputFCSchema(paramFCRef, paramVarRef, paramFCTar, paramVarTar, paramOutMain, paramOutIO, paramOutOI):
    # try:
    fieldRef = None
    fieldTar = None

    if ARCPY.Exists(paramFCRef.valueAsText):
        fields = ARCPY.ListFields(paramFCRef.valueAsText)
        for f in fields:
            if f.name.upper() == paramVarRef.valueAsText.upper():
                fieldRef = f
                break

    if ARCPY.Exists(paramFCTar.valueAsText):
        fields = ARCPY.ListFields(paramFCTar.valueAsText)
        for f in fields:
            if f.name.upper() == paramVarTar.valueAsText.upper():
                fieldTar = f
                break

    if fieldRef is None:
        fieldRef = ARCPY.Field()
        fieldRef.name = paramVarRef.valueAsText
    if fieldTar is None:
        fieldTar = ARCPY.Field()
        fieldTar.name = paramVarTar.valueAsText

    if paramOutMain.enabled and paramOutMain.value and not paramOutMain.hasError():
        fieldCandMain = []

        newField = ARCPY.Field()
        newField.name = "CAT_IN"
        newField.aliasName = fieldRef.aliasName
        newField.type = fieldRef.type
        fieldCandMain.append(newField)

        newField = ARCPY.Field()
        newField.name = "CAT_OVL"
        newField.aliasName = fieldTar.aliasName
        newField.type = fieldTar.type
        fieldCandMain.append(newField)

        if fieldRef.aliasName == fieldTar.aliasName:
            fieldRef.aliasName += " (Input)"
            fieldTar.aliasName += " (Overlay)"

        newField = ARCPY.Field()
        newField.name = "CRSPDNC_IO"
        newField.aliasName = ARCPY.GetIDMessage(220129).format(fieldRef.aliasName, fieldTar.aliasName)
        newField.type = "Double"
        fieldCandMain.append(newField)

        newField = ARCPY.Field()
        newField.name = "CRSPDNC_OI"
        newField.aliasName = ARCPY.GetIDMessage(220129).format(fieldTar.aliasName, fieldRef.aliasName)
        newField.type = "Double"
        fieldCandMain.append(newField)

        if UTILS.isShapeFile(paramOutMain.valueAsText):
            for f in fieldCandMain:
                f.aliasName = f.name
        paramOutMain.schema.additionalFields = fieldCandMain
        paramOutMain.schema.geometryType = "Polygon"

    if paramOutIO.enabled and paramOutIO.value and not paramOutIO.hasError():
        fieldCandIO = []

        newField = ARCPY.Field()
        newField.name = fieldRef.name
        newField.aliasName = fieldRef.aliasName
        newField.type = fieldRef.type
        fieldCandIO.append(newField)

        newField = ARCPY.Field()
        newField.name = "CRSPDNC_IO"
        newField.aliasName = ARCPY.GetIDMessage(220129).format(fieldRef.aliasName, fieldTar.aliasName)
        newField.type = "Double"
        fieldCandIO.append(newField)

        if UTILS.isShapeFile(paramOutIO.valueAsText):
            for f in fieldCandIO:
                f.aliasName = f.name
        paramOutIO.schema.additionalFields = fieldCandIO
        paramOutIO.schema.geometryType = "Polygon"

    if paramOutOI.enabled and paramOutOI.value and not paramOutOI.hasError():
        fieldCandOI = []

        newField = ARCPY.Field()
        newField.name = fieldTar.name
        newField.aliasName = fieldTar.aliasName
        newField.type = fieldTar.type
        fieldCandOI.append(newField)

        newField = ARCPY.Field()
        newField.name = "CRSPDNC_IO"
        newField.aliasName = ARCPY.GetIDMessage(220129).format(fieldTar.aliasName, fieldRef.aliasName)
        newField.type = "Double"
        fieldCandOI.append(newField)

        if UTILS.isShapeFile(paramOutOI.valueAsText):
            for f in fieldCandOI:
                f.aliasName = f.name
        paramOutOI.schema.additionalFields = fieldCandOI
        paramOutOI.schema.geometryType = "Polygon"

    # except:
    #     return

def getPreservedAreaFieldName(outputFC):
    if UTILS.isShapeFile(outputFC):
        return "AREA"
    else:
        if ".SDE" in outputFC.upper():
            try:
                for field in ARCPY.ListFields(outputFC):
                    if field.editable == False and field.name.lower().find("area") >= 0:
                        return field.name
            except:
                return None
            return None
        else:
            return "Shape_Area"


class VMeasure:
    """
    This class is used to calculate the VMeasure of given regionalizations/partition of the study area
    """
    def __init__(self):
        self.staHomo = {}
        self.staComp = {}
        self.areaTotal = 0
        self.areaTar = {}
        self.areaRef = {}

        self._h = -1
        self._c = -1
        self._hLocal = {}
        self._cLocal = {}

    def append(self, refCat, tarCat, area):
        """
        Append a new record to the VMeasure
        Parameters
        ----------
        refCat:     object
                    the category code of the reference regionalizations
        tarCat:     object
                    the category code of the target  partitions
        area:       float
                    the value of area

        Returns
        -------
        None
        """
        if refCat not in self.staHomo:
            self.staHomo[refCat] = {}
            self.areaRef[refCat] = 0
        if tarCat not in self.staHomo[refCat]:
            self.staHomo[refCat][tarCat] = 0
        self.staHomo[refCat][tarCat] += area
        self.areaRef[refCat] += area

        if tarCat not in self.staComp:
            self.staComp[tarCat] = {}
            self.areaTar[tarCat] = 0
        if refCat not in self.staComp[tarCat]:
            self.staComp[tarCat][refCat] = 0
        self.staComp[tarCat][refCat] += area
        self.areaTar[tarCat] += area

        self._h = -1
        self._c = -1
        self.areaTotal += area

    def _calIndex(self):
        """
        After all the values are added, use this function to calculate the V-Measures

        Returns
        -------
        None
        """
        if self._h != -1 and self._c != -1:
            return
        ALOGA = self.areaTotal * MATH.log10(self.areaTotal)

        if len(self.areaRef) == 1:
            ARCPY.AddIDMessage("ERROR", 110374)
            raise SystemExit()
        elif len(self.areaTar) == 1:
            ARCPY.AddIDMessage("ERROR", 110375)
            raise SystemExit()

        areaLogSumTar = 0
        areaLogSumRef = 0
        areaLogSumGlobal = 0

        areaLogAreaTar = {}
        areaLogAreaRef = {}

        for key, v in self.areaTar.items():
            if v > 0:
                vLogV = v * MATH.log10(v)
            else:
                vLogV = 0
            areaLogAreaTar[key] = vLogV
            areaLogSumTar += vLogV

        for key, v in self.areaRef.items():
            if v > 0:
                vLogV = v * MATH.log10(v)
            else:
                vLogV = 0
            areaLogAreaRef[key] = vLogV
            areaLogSumRef += vLogV


        #### calculate the local measure of Homogentity ####
        for refCat, parts in self.staHomo.items():
            aIJLogLocal = 0
            for v in parts.values():
                if v > 0:
                    aIJLogLocal += v*MATH.log10(v)
            areaLogSumGlobal += aIJLogLocal
            res = NUM.round(self.areaTotal / self.areaRef[refCat] * (aIJLogLocal - areaLogAreaRef[refCat]) / (areaLogSumTar - ALOGA), 6)
            self._cLocal[refCat] = res

        #### calculate the local measure of Completeness ####
        for tarCat, parts in self.staComp.items():
            aIJLogLocal = 0
            for v in parts.values():
                if v > 0:
                    aIJLogLocal += v * MATH.log10(v)
            res = NUM.round(self.areaTotal/self.areaTar[tarCat] * (aIJLogLocal - areaLogAreaTar[tarCat]) / (areaLogSumRef - ALOGA), 6)
            self._hLocal[tarCat] = res

        #### calculate the global measure of Homogentity and Completeness####
        inComp = (areaLogSumGlobal - areaLogSumRef) / (areaLogSumTar - ALOGA)
        inHomo = (areaLogSumGlobal - areaLogSumTar) / (areaLogSumRef - ALOGA)

        self._h = NUM.round(1 - inHomo, 6)
        self._c = NUM.round(1 - inComp, 6)
        if abs(self._h) < 1e-10:
            self._h = 0

        if abs(self._c) < 1e-10:
            self._c = 0

    def getHomogentity(self):
        if self._h == -1:
            self._calIndex()
        return self._h

    def getCompleteness(self):
        if self._c == -1:
            self._calIndex()
        return self._c

    def getLocalInHomogentity(self):
        if len(self._hLocal) == 0:
            self._calIndex()
        return self._hLocal

    def getLocalInCompleteness(self):
        if len(self._cLocal) == 0:
            self._calIndex()
        return self._cLocal

    def calVMeasure(self, beta):
        if beta < 0:
            beta = 0
        if self._h == -1:
            self._calIndex()

        if self._h == 0 and self._c == 0:
            return 0
        else:
            return (1 + beta) * self._h * self._c / (beta * self._h + self._c)


class SABREMain:
    def __init__(self, refData, refVarName, refDataType,
                 tarData, tarVarName, tarDataType,
                 outFC=None, outSubFCRef=None, outSubFCTar=None, outRaster=None):
        self.__currentFileInd = 1

        if refDataType not in SUPPORTED_DATA_TYPES or tarDataType not in SUPPORTED_DATA_TYPES:
            return
        if refDataType == "POLYGON" and tarDataType =="POLYGON":
            #### Process as Vectors ####
            refVarName = refVarName.upper()
            tarVarName = tarVarName.upper()
            #### Create SSDataObject ####
            try:
                if refData == tarData:
                    #### New Runtime Field Output Checker ####
                    if outFC is not None:
                        checker = UTILS.ExecuteNewFieldTypeChecker(refData, outFC, fields = [refVarName, tarVarName])
                    if outSubFCRef is not None:
                        checker = UTILS.ExecuteNewFieldTypeChecker(refData, outSubFCRef, fields = [refVarName])
                    if outSubFCTar is not None:
                        checker = UTILS.ExecuteNewFieldTypeChecker(refData, outSubFCTar, fields = [tarVarName])
                    ssdoRef = SSDO.SSDataObject(refData)
                    ssdoRef.obtainData(ssdoRef.oidName, [refVarName, tarVarName], requireGeometry=True)
                    ssdoTar = ssdoRef
                else:
                    #### New Runtime Field Output Checker ####
                    if outFC is not None:
                        checker = UTILS.ExecuteNewFieldTypeChecker(refData, outFC, fields = [refVarName])
                        checker = UTILS.ExecuteNewFieldTypeChecker(tarData, outFC, fields = [tarVarName])
                    if outSubFCRef is not None:
                        checker = UTILS.ExecuteNewFieldTypeChecker(refData, outSubFCRef, fields = [refVarName])
                    if outSubFCTar is not None:
                        checker = UTILS.ExecuteNewFieldTypeChecker(tarData, outSubFCTar, fields = [tarVarName])

                    ssdoRef = SSDO.SSDataObject(refData)
                    ssdoRef.obtainData(ssdoRef.oidName, [refVarName])
                    ssdoTar = SSDO.SSDataObject(tarData)
                    ssdoTar.obtainData(ssdoTar.oidName, [tarVarName])
            except:  # Canceled by user
                raise SystemExit()
            #### Analysis ####
            self.sbObj = SABREVector(ssdoRef, refVarName, ssdoTar, tarVarName, outFC, beta=1)
            self.outCatFieldAliasRef = self.sbObj.outCatFieldAliasRef
            self.outCatFieldAliasTar = self.sbObj.outCatFieldAliasTar

        else:
            #### Process as Rasters, Convert Polygon in to Raster if necessary ####
            tempResultPath = None
            inputFeatureClass = None
            inputFeatureVarAlias = None
            if outRaster is None:
                outRaster = self.__getTempRasterFilePath()
                hasOutRaster = False
            else:
                hasOutRaster = True
            if refDataType == "POLYGON":
                checker = UTILS.ExecuteNewFieldTypeChecker(refData, outRaster, fields = [refVarName], checkOID64 = False, outIsRaster = True)
                inputFeatureClass = "REF"
                fields = ARCPY.ListFields(refData)
                for f in fields:
                    if f.name.upper() == refVarName.upper():
                        inputFeatureVarAlias = f.aliasName
                        break

                tempResultPath = self.__getTempRasterFilePath()
                ARCPY.conversion.FeatureToRaster(refData, refVarName, tempResultPath)
                refData = ARCPY.Raster(tempResultPath)
                valueName = None
                varName = None
                if len(refVarName.upper())>10:
                    names2Match = [refVarName.upper(), refVarName.upper()[0: 10]]
                else:
                    names2Match = [refVarName.upper()]
                fields = ARCPY.ListFields(tempResultPath)
                for f in fields:
                    if f.name.upper() in names2Match:
                        varName = f.name
                    if f.name.upper() == "VALUE":
                        valueName = f.name
                if varName is not None:
                    refVarName = varName
                else:
                    refVarName = valueName
            elif tarDataType == "POLYGON":
                checker = UTILS.ExecuteNewFieldTypeChecker(tarData, outRaster, fields = [tarVarName], checkOID64 = False, outIsRaster = True)
                inputFeatureClass = "TAR"
                fields = ARCPY.ListFields(tarData)
                for f in fields:
                    if f.name.upper() == tarVarName.upper():
                        inputFeatureVarAlias = f.aliasName
                        break

                tempResultPath = self.__getTempRasterFilePath()
                ARCPY.conversion.FeatureToRaster(tarData, tarVarName, tempResultPath)
                tarData = ARCPY.Raster(tempResultPath)
                valueName = None
                varName = None
                if len(refVarName.upper())>10:
                    names2Match = [tarVarName.upper(), tarVarName.upper()[0: 10]]
                else:
                    names2Match = [tarVarName.upper()]
                fields = ARCPY.ListFields(tempResultPath)
                for f in fields:
                    if f.name.upper() in names2Match:
                        varName = f.name
                    if f.name.upper() == "VALUE":
                        valueName = f.name
                if varName is not None:
                    tarVarName = varName
                else:
                    tarVarName = valueName

            self.sbObj = SABRERaster(refData, refVarName, tarData, tarVarName, outRaster,
                                     hasOutRaster=hasOutRaster,
                                     inputFeatureClass=inputFeatureClass, inputFeatureVarAlias=inputFeatureVarAlias)
            self.outCatFieldAliasRef = self.sbObj.outCatFieldAliasRef
            self.outCatFieldAliasTar = self.sbObj.outCatFieldAliasTar

            if tempResultPath is not None and ARCPY.Exists(tempResultPath):
                ARCPY.Delete_management(tempResultPath)

    def __getTempRasterFilePath(self):
        tempFolder = TEMPFILE.gettempdir()
        fileTemp = 'temp_res_sabre_' + str(self.__currentFileInd) + '_{}.tif'
        self.__currentFileInd += 1
        id = 0
        while ARCPY.Exists(OS.path.join(tempFolder, fileTemp.format(id))):
            id += 1
        return OS.path.join(tempFolder, fileTemp.format(id))

    def createLocalInHomogentitySymologyVector(self, paramID):
        if isinstance(self.sbObj, SABREVector):
            self.sbObj.createLocalInHomogentitySymologyVector(paramID)

    def rebuildRasterBivariateColorSymbol(self, paramID):
        if isinstance(self.sbObj, SABRERaster):
            self.sbObj.rebuildRasterBivariateColorSymbol(paramID)

    def report(self):
        self.sbObj.report()

    def exportSubResult(self, outFC, direction="TAR"):
        if not isinstance(self.sbObj, SABREVector):
            return None
        return self.sbObj.exportSubResult(outFC, direction)


class SABREVector:
    """
    Calculate the Spatial Association Between REgionalizations using
    the information-theoretical V-measure
    """

    def __init__(self, ssdoRef, varNameRef, ssdoTar, varNameTar, outputFC, beta=1.0):
        #### Set Initial Attributes ####
        self.ssdoRef = ssdoRef
        self.varNameRef = varNameRef.upper()
        self.ssdoTar = ssdoTar
        self.varNameTar = varNameTar.upper()
        self.outputFC = outputFC
        self.beta = beta
        self.intersectFC = ARCPY.CreateUniqueName("SABRE_IntersectFC", ARCPY.env.scratchGDB)
        self.vm = None
        self.outCatFieldAliasRef = None
        self.outCatFieldAliasTar = None
        self.hasNoneCategories = False

        if self.beta < 0:
            self.beta = 0

        self.__validation()
        self.__calculateVMeasure()

    def __validation(self):
        #### check if all input are polygons ####
        if self.ssdoRef.shapeType.upper() != "POLYGON":
            raise SystemExit()
        if self.ssdoRef.shapeType.upper() != "POLYGON":
            raise SystemExit()

        #### Check the data type of category variable ####
        if self.ssdoRef.allFields[self.varNameRef].type.upper() not in SUPPORTED_FIELD_TYPES:
            raise SystemExit()
        if self.ssdoTar.allFields[self.varNameTar].type.upper() not in SUPPORTED_FIELD_TYPES:
            raise SystemExit()

    def __calculateVMeasure(self):
        self.vm = VMeasure()

        if self.ssdoRef == self.ssdoTar:
            ARCPY.SetProgressor("default", "Calculating Global Measure of Spatial Association....")
            #### copy over the ssdo to the in-memory FC ####
            catValuesTar = self.ssdoTar.fields[self.varNameTar].data
            catValuesRef = self.ssdoTar.fields[self.varNameRef].data
            geoms = self.ssdoTar.getShapesAsArray()
            for ind in range(self.ssdoTar.numObs):
                catTar = catValuesTar[ind]
                catRef = catValuesRef[ind]
                area = geoms[ind].area
                self.vm.append(catRef, catTar, area)

            self.vm._calIndex()

            #### Finialize the results and append them to the results ####
            if self.outputFC is not None:
                localHomoValue = NUM.zeros(self.ssdoTar.numObs, dtype=float)
                localCompValue = NUM.zeros(self.ssdoTar.numObs, dtype=float)
                LH = self.vm.getLocalInHomogentity()
                LC = self.vm.getLocalInCompleteness()
                for ind in range(self.ssdoTar.numObs):
                    catTar = catValuesTar[ind]
                    catRef = catValuesRef[ind]
                    localHomoValue[ind] = LH[catTar]
                    localCompValue[ind] = LC[catRef]

                candidateFields = {}
                dType = self.ssdoTar.fields[self.varNameRef].type.upper()
                if dType in ["STRING", "TEXT"]:
                    dType = "TEXT"
                elif dType in ["SMALLINTEGER", "INTEGER", "LONG", "SHORT"]:
                    dType = "LONG"
                fieldCatRef = SSDO.CandidateField("CAT_IN",
                                                  dType,
                                                  data=catValuesRef,
                                                  alias=self.ssdoTar.fields[self.varNameRef].alias)

                dType = self.ssdoTar.fields[self.varNameTar].type.upper()
                if dType in ["STRING", "TEXT"]:
                    dType = "TEXT"
                elif dType in ["SMALLINTEGER", "INTEGER", "LONG", "SHORT"]:
                    dType = "LONG"
                fieldCatTar = SSDO.CandidateField("CAT_OVL",
                                                  dType,
                                                  data=catValuesTar,
                                                  alias=self.ssdoTar.fields[self.varNameTar].alias)
                candidateFields["CAT_IN"] = fieldCatRef
                candidateFields["CAT_OVL"] = fieldCatTar
                candidateFields["CRSPDNC_IO"] = SSDO.CandidateField(
                    "CRSPDNC_IO", "DOUBLE",
                    data=localHomoValue,
                    alias=ARCPY.GetIDMessage(220129).format(fieldCatRef.alias, fieldCatTar.alias))
                candidateFields["CRSPDNC_OI"] = SSDO.CandidateField(
                    "CRSPDNC_OI", "DOUBLE",
                    data=localCompValue,
                    alias=ARCPY.GetIDMessage(220129).format(fieldCatTar.alias, fieldCatRef.alias))

                self.ssdoTar.output2NewFC(self.outputFC, candidateFields)
                self.outCatFieldAliasRef = fieldCatRef.alias
                self.outCatFieldAliasTar = fieldCatTar.alias
                self.localHomoValues = localHomoValue
                self.localCompValues = localCompValue

            ARCPY.ResetProgressor()

        else:
            #### Do the intersection and save result to in-memory FC ####
            with ARCPY.EnvManager(extent="Default"):
                ANA.Intersect([self.ssdoRef.inputFC, self.ssdoTar.inputFC],
                               self.intersectFC, join_attributes="ONLY_FID", output_type="INPUT")

            if ARCPY.env.isCancelled or not ARCPY.Exists(self.intersectFC):
                raise SystemExit()

            #### Migrate to 64-bit OID if Tar is 64 and Ref is 32 ####
            #### The Opposite will be Auto 64-bit OID ####
            if not self.ssdoRef.hasOID64 and self.ssdoTar.hasOID64:
                DM.MigrateObjectIDTo64Bit(in_datasets = self.intersectFC)

            #### Use List Fields and Field Order to get FID Mapped Fields ####
            descIntersect = ARCPY.Describe(self.intersectFC)
            fidNames = []
            for field in descIntersect.fields:
                upperName = field.name.upper()
                if upperName.startswith("FID_"):
                    fidNames.append(upperName)
            fidNameRef, fidNameTar = fidNames

            ssdoWork = SSDO.SSDataObject(self.intersectFC)
            ssdoWork.obtainData(ssdoWork.oidName, [fidNameRef, fidNameTar], requireGeometry=True)
            catValuesTar = self.ssdoTar.fields[self.varNameTar].data
            catValuesRef = self.ssdoRef.fields[self.varNameRef].data
            master2OrderTar = self.ssdoTar.master2Order
            master2OrderRef = self.ssdoRef.master2Order
            fidValuesTar = ssdoWork.fields[fidNameTar].data
            fidValuesRef = ssdoWork.fields[fidNameRef].data
            geoms = ssdoWork.getShapesAsArray()

            ARCPY.SetProgressor("default", "Calculating Global Measure of Spatial Association....")
            catValuesIntTar = NUM.zeros(ssdoWork.numObs, catValuesTar.dtype)
            catValuesIntRef = NUM.zeros(ssdoWork.numObs, catValuesRef.dtype)
            for ind in range(ssdoWork.numObs):
                fidTar = fidValuesTar[ind]
                fidRef = fidValuesRef[ind]
                if fidTar not in master2OrderTar or fidRef not in master2OrderRef:
                    self.hasNoneCategories = True
                    continue
                catTar = catValuesTar[master2OrderTar[fidTar]]
                catRef = catValuesRef[master2OrderRef[fidRef]]
                catValuesIntTar[ind] = catTar
                catValuesIntRef[ind] = catRef
                area = geoms[ind].area
                self.vm.append(catRef, catTar, area)

            if len(self.vm.areaTar) == 0:
                ARCPY.AddIDMessage("ERROR", 110376)
                raise SystemExit()

            self.vm._calIndex()
            ARCPY.ResetProgressor()

            #### Finialize the results and append them to the results ####
            if self.outputFC is not None:
                localHomoValue = NUM.zeros(ssdoWork.numObs, dtype=float)
                localCompValue = NUM.zeros(ssdoWork.numObs, dtype=float)
                LH = self.vm.getLocalInHomogentity()
                LC = self.vm.getLocalInCompleteness()
                if self.hasNoneCategories:
                    for ind in range(ssdoWork.numObs):
                        catTar = catValuesIntTar[ind]
                        catRef = catValuesIntRef[ind]
                        if catTar in LH:
                            localHomoValue[ind] = LH[catTar]
                        else:
                            localHomoValue[ind] = -1
                        if catRef in LC:
                            localCompValue[ind] = LC[catRef]
                        else:
                            localCompValue[ind] = -1

                else:
                    for ind in range(ssdoWork.numObs):
                        catTar = catValuesIntTar[ind]
                        catRef = catValuesIntRef[ind]
                        localHomoValue[ind] = LH[catTar]
                        localCompValue[ind] = LC[catRef]

                candidateFields = {}
                dType = self.ssdoRef.fields[self.varNameRef].type
                if dType.upper() in ["STRING", "TEXT"]:
                    dType = "TEXT"
                fieldCatRef = SSDO.CandidateField("CAT_IN",
                                                  dType,
                                                  data=catValuesIntRef,
                                                  alias=self.ssdoRef.fields[self.varNameRef].alias)

                dType = self.ssdoTar.fields[self.varNameTar].type
                if dType.upper() in ["STRING", "TEXT"]:
                    dType = "TEXT"
                fieldCatTar = SSDO.CandidateField("CAT_OVL",
                                                  dType,
                                                  data=catValuesIntTar,
                                                  alias=self.ssdoTar.fields[self.varNameTar].alias)

                if fieldCatRef.alias.upper() == fieldCatTar.alias.upper():
                    fieldCatRef.alias += ARCPY.GetIDMessage(220130)
                    fieldCatTar.alias += ARCPY.GetIDMessage(220131)

                candidateFields[fieldCatRef.name] = fieldCatRef
                candidateFields[fieldCatTar.name] = fieldCatTar
                candidateFields["CRSPDNC_IO"] = SSDO.CandidateField(
                    "CRSPDNC_IO", "DOUBLE",
                    data=localHomoValue,
                    alias=ARCPY.GetIDMessage(220129).format(fieldCatRef.alias, fieldCatTar.alias))
                candidateFields["CRSPDNC_OI"] = SSDO.CandidateField(
                    "CRSPDNC_OI", "DOUBLE",
                    data=localCompValue,
                    alias=ARCPY.GetIDMessage(220129).format(fieldCatTar.alias, fieldCatRef.alias))
                fieldOrder = [fieldCatRef.name, fieldCatTar.name, "CRSPDNC_IO", "CRSPDNC_OI"]

                try:
                    ssdoWork.output2NewFC(self.outputFC, candidateFields, fieldOrder=fieldOrder)
                except:  # canceled by user
                    raise SystemExit()

                self.outCatFieldAliasRef = fieldCatRef.alias
                self.outCatFieldAliasTar = fieldCatTar.alias
                self.localHomoValues = localHomoValue
                self.localCompValues = localCompValue
                
                if self.hasNoneCategories:
                    tempTableView = "noneValueTableView"
                    ARCPY.MakeTableView_management(self.outputFC, tempTableView)
                    ARCPY.SelectLayerByAttribute_management(
                        tempTableView, "NEW_SELECTION", "CRSPDNC_IO = -1 or CRSPDNC_OI = -1")
                    if int(ARCPY.GetCount_management(tempTableView)[0]) > 0:
                        ARCPY.DeleteRows_management(tempTableView)

            #### delete the in memory FC ####
            try:
                DM.Delete(self.intersectFC)
            except:
                pass

        if self.outputFC is not None and UTILS.isShapeFile(self.outputFC):
            try:
                ARCPY.management.AddFields(
                    self.outputFC,
                    [['AREA', 'DOUBLE', 'Area']])

                desc = ARCPY.Describe(self.outputFC)
                shapeType = desc.shapeType
                sr = desc.spatialReference
                gcsOrMercator = (sr.type == "Geographic" or
                                 ("WEB_MERCATOR" in sr.PCSName.upper()))
                if gcsOrMercator:
                    cal_field = "AREA_GEODESIC"
                else:
                    cal_field = "AREA"
                ARCPY.CalculateGeometryAttributes_management(self.outputFC,
                                                             [["AREA", cal_field]])
            except:
                pass

    def __threeStagelassify(self, data):
        """
        Classify the data into three stages
        Parameters
        ----------
        data

        Returns
        -------
        list of three values
        """
        data = data[~ (NUM.isinf(data) | NUM.isnan(data))]

        numCategory = 3
        numUniqueValue = len(NUM.unique(data))
        if numUniqueValue < numCategory:
            numCategory = numUniqueValue - 2

        minV = NUM.min(data)
        if numCategory > 1:
            uniqueValues = [cat[0] for cat in UTILS.classifyVariable(numCategory, "QUANTILE", values=data)[0]]
            uniqueValues[-1] += 0.00005
            uniqueValues = list(NUM.round(uniqueValues, 6))
        else:
            uniqueValues = [minV]

        uniqueValues[0] = NUM.round(uniqueValues[0]-0.00005, 6)
        return uniqueValues

    def createLocalInHomogentitySymologyVector(self, paramID):
        import json
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        from arcpy.cim.cimloader import CimJsonEncoder

        if self.vm is None:
            return

        if self.hasNoneCategories:
            values = self.localHomoValues
            values = values[~(values == -1)]
            breaks_IO = self.__threeStagelassify(values)

            values = self.localCompValues
            values = values[~(values == -1)]
            breaks_OI = self.__threeStagelassify(values)
        else:
            breaks_IO = self.__threeStagelassify(self.localHomoValues)
            breaks_OI = self.__threeStagelassify(self.localCompValues)

        if len(breaks_IO) < 3 or len(breaks_OI) < 3:
            sym_poly = """{
              "type": "simple",
              "symbol": {
                "type": "esriSFS",
                "style": "esriSFSSolid",
                "color": [
                  163,
                  163,
                  163,
                  255
                ],
                "outline": {
                  "type": "esriSLS",
                  "style": "esriSLSSolid",
                  "color": [
                    110,
                    110,
                    110,
                    255
                  ],
                  "width": 0.7
                }
              },
              "label": "",
              "description": "",
              "rotationType": "geographic",
              "rotationExpression": ""
            }"""
            ARCPY.SetParameterSymbology(paramID, f"JSONRENDERER={sym_poly}")
            ARCPY.AddIDMessage("WARNING", 110385)
            return

        pathTemplate = OS.path.join(UTILS.pathLayers, "Sabre_BivariateColors_Features.lyrx")

        content = ""
        if OS.path.isfile(pathTemplate):
            f = open(pathTemplate, 'r')
            content = f.read()
            f.close()
        else:
            return

        cimLayer = GetJSONTypeOBJ(json.loads(content))
        expressionTemplate =cimLayer.layerDefinitions[0].renderer.valueExpressionInfo.expression
        for i in range(3):
            expressionTemplate = expressionTemplate.replace("@@v0"+str(i), str(breaks_IO[i]))
            expressionTemplate = expressionTemplate.replace("@@v1"+str(i), str(breaks_OI[i]))
        cimLayer.layerDefinitions[0].renderer.valueExpressionInfo.expression = expressionTemplate

        cimLayer.layerDefinitions[0].renderer.authoringInfo.fieldInfos[0].upperBounds = breaks_IO
        cimLayer.layerDefinitions[0].renderer.authoringInfo.fieldInfos[0].defaultLabel = \
            ARCPY.GetIDMessage(220129).format(self.outCatFieldAliasRef, self.outCatFieldAliasTar)

        cimLayer.layerDefinitions[0].renderer.authoringInfo.fieldInfos[1].upperBounds = breaks_OI
        cimLayer.layerDefinitions[0].renderer.authoringInfo.fieldInfos[1].defaultLabel = \
            ARCPY.GetIDMessage(220129).format(self.outCatFieldAliasTar, self.outCatFieldAliasRef)

        #### Update Class Labels####
        for cla in cimLayer.layerDefinitions[0].renderer.groups[0].classes:
            if cla.label.upper() in MESSAGE_DICT:
                cla.label = MESSAGE_DICT[cla.label.upper()]

        #### Get Back JSON String ####
        jsonData = json.dumps(cimLayer.layerDefinitions[0], cls=CimJsonEncoder)
        ARCPY.gp.SetParameterSymbology(paramID, "JSONCIMDEF="+jsonData)

    def getVMeasures(self):
        if self.vm is None:
            return None, None
        betas = [0, 0.001, 0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1, 2, 3, 5, 10, 20, 100]
        if self.beta not in betas:
            betas.append(self.beta)
            betas = sorted(betas)
        betas = NUM.array(betas)
        vMeasures = NUM.array([self.vm.calVMeasure(x) for x in betas])
        return betas, vMeasures

    def createOutputTable(self, outputTable):
        if self.vm is None:
            return
        outPath, outName = OS.path.split(outputTable)

        #### Set Up Field Names and Types ####
        inputFields = UTILS.getFieldNames(["BETA", "V_MEASURE"], outPath)
        inputTypes = ["DOUBLE", "DOUBLE"]

        #### Create Box Plot Table ####
        inputData = []
        betas, vMeasures = self.getVMeasures()
        for ind in range(len(betas)):
            inputData.append((betas[ind], vMeasures[ind]))

        #### Write Coefficient Table ####
        UTILS.createOutputTable(outputTable, inputFields,
                                inputTypes, inputData, aliases=["Beta", "Measure of Spatial Association"])

    def report(self):
        import locale as LOCALE
        if self.vm is None:
            return
        header = ARCPY.GetIDMessage(84547)
        #### Column Labels ####
        total = []
        total.append([ARCPY.GetIDMessage(220101), LOCALE.format_string("%0.4f", self.vm.calVMeasure(self.beta))])
        total.append([ARCPY.GetIDMessage(220102),
                      LOCALE.format_string("%0.4f", self.vm.getHomogentity())])
        total.append([ARCPY.GetIDMessage(220103),
                      LOCALE.format_string("%0.4f", self.vm.getCompleteness())])
        total.append([ARCPY.GetIDMessage(220104), str(self.ssdoRef.numObs)])
        total.append([ARCPY.GetIDMessage(220105), str(len(self.vm.getLocalInCompleteness().keys()))])
        total.append([ARCPY.GetIDMessage(220106), self.ssdoTar.numObs])
        total.append([ARCPY.GetIDMessage(220107), str(len(self.vm.getLocalInHomogentity().keys()))])
        total.append("EMPTY")

        #### Create Output Text Table ####
        table = UTILS.outputTextTable(total, header = header,
                                                   pad = 1, colPad = 5,
                                                   justify = ["left", "right"],
                                                   titleFillToken = "-", emphasizeHeadRow=False,
                                                   emptyFillToken = "-", force2Txt=False)
        ARCPY.AddMessage(table)

    def exportSubResult(self, outFC, direction="TAR"):
        import SSCubeUtilities as CUTIL
        if self.vm is None:
            return

        alias = ARCPY.GetIDMessage(220129)
        if direction == "TAR":
            ssdo = self.ssdoTar
            appendFields = [self.varNameTar]
            catValues = self.ssdoTar.fields[self.varNameTar].data
            alias = alias.format(self.outCatFieldAliasRef, self.outCatFieldAliasTar)
            LH = self.vm.getLocalInHomogentity()
            colors = ["233, 230, 242",
                      "234, 212, 232",
                      "235, 194, 223",
                      "234, 157, 204",
                      "222, 79, 166"]
        elif direction == "REF":
            ssdo = self.ssdoRef
            appendFields = [self.varNameRef]
            catValues = self.ssdoRef.fields[self.varNameRef].data
            alias = alias.format(self.outCatFieldAliasTar, self.outCatFieldAliasRef)
            LH = self.vm.getLocalInCompleteness()
            colors = ["247, 251, 255",
                      "225, 241, 249",
                      "204, 231, 243",
                      "162, 212, 231",
                      "79, 173, 208"]
        else:
            return

        LH_data = NUM.zeros(len(catValues), dtype=float)
        valueToExclude = None
        for ind, cat in enumerate(catValues):
            if cat in LH:
                LH_data[ind] = LH[cat]
            else:
                LH_data[ind] = -1
                valueToExclude = -1
        candidateFields = {}
        candidateFields["CRSPDNC_IO"] = SSDO.CandidateField("CRSPDNC_IO", "DOUBLE",
                                                                data=LH_data,
                                                                alias=alias)
        ssdo.output2NewFC(outFC, candidateFields, appendFields=appendFields)

        #### After the feature class is generated, create the symbology file ####
        if valueToExclude == -1:
            #### Update the values in the output FC ####
            noneValue = None
            if UTILS.isShapeFile(outFC):
                noneValue = abs(UTILS.shpFileNull["FLOAT"])
            dummyUpdateCursor = ARCPY.da.UpdateCursor(outFC, ['CRSPDNC_IO'])
            for r in dummyUpdateCursor:
                if r[0] < 0:
                    r[0] = noneValue
                dummyUpdateCursor.updateRow(r)
            LH_data = LH_data[~(LH_data == -1)]
        
        symbolStr = CUTIL.generateForecatingSymbology(
            LH_data, "CRSPDNC_IO", alias, "POLYGON", colors=colors,
            labelAppendixFirst=ARCPY.GetIDMessage(220132), labelAppendixLast=ARCPY.GetIDMessage(220133))
        return symbolStr


class SABRERaster:
    """
    Calculate the Spatial Association Between REgionalizations using
    the information-theoretical V-measure for RASTER dataset
    """
    def __init__(self, rasterRef, varNameRef, rasterTar, varNameTar, outRaster, beta=1.0,
                 hasOutRaster=True, inputFeatureClass=None, inputFeatureVarAlias=None):
        """
        Construct function for SABRERaster
        Parameters
        ----------
        rasterRef       : RasterObj
                        reference raster object
        varNameRef      : str
                        name of field of reference raster
        rasterTar       : RasterObj
                        target raster object
        varNameTar      : str
                        name of field of target raster
        outRaster       : str
                        path of result raster
        beta            : float
                        the value used for calculating the global V-Measure
        hasOutRaster    : boolean
                        indicate if user provides the output raster path
        inputFeatureClass
                        : from [None, "TAR", "REF"]
                        indicate one of the input is feature class and converted to raster before initialization
        """
        if ARCPY.env.workspace is None:
            ARCPY.env.workspace = OS.path.dirname(OS.path.abspath(__file__))
        
        #### Set Initial Attributes ####
        self.rasterRef = rasterRef
        self.varNameRef = varNameRef
        self.rasterTar = rasterTar
        self.varNameTar = varNameTar
        self.outRaster = outRaster
        self.beta = beta
        self.hasOutRaster = hasOutRaster
        self.inputFeatureClass = inputFeatureClass
        if self.inputFeatureClass is not None:
            self.inputFeatureClass = self.inputFeatureClass.upper()
        if self.inputFeatureClass not in ["REF", "TAR"]:
            self.inputFeatureClass = None
        self.inputFeatureVarAlias = inputFeatureVarAlias
        self.vm = None
        self.outCatFieldAliasRef = None
        self.outCatFieldAliasTar = None

        if self.beta < 0:
            self.beta = 0

        self.__validation()
        self.__calculateVMeasureWithCombine()


    def __validation(self):
        #### Check the data type of category variable ####

        descRaster = ARCPY.Describe(self.rasterRef)
        if descRaster.dataType.upper() != "IMAGESERVER" and descRaster.pixelType not in SUPPORTED_PIXEL_TYPES:
            ARCPY.AddIDMessage("ERROR", 110377)
            raise SystemExit()

        descRaster = ARCPY.Describe(self.rasterTar)
        if descRaster.dataType.upper() != "IMAGESERVER" and descRaster.pixelType not in SUPPORTED_PIXEL_TYPES:
            ARCPY.AddIDMessage("ERROR", 110378)
            raise SystemExit()

    def __calculateVMeasureWithCombine(self):
        valueAttrDictRef = None
        dataTypeRef = "LONG"
        valueAttrDictTar = None
        dataTypeTar = "LONG"

        #### Save Original Raster Fields ####
        fieldCatRefAlias = "Value of Input Raster"
        fieldCatTarAlias = "Value of Overlay Raster"

        fields = ARCPY.ListFields(self.rasterRef)
        for f in fields:
            if f.name == self.varNameRef:
                if f.type.upper() in ['TEXT', 'STRING']:
                    dataTypeRef = 'TEXT'
                else:
                    dataTypeRef = 'LONG'
                try:
                    fieldCatRefAlias = f.alias
                except:
                    fieldCatRefAlias = self.varNameRef
                break
        if self.varNameRef.upper() != "VALUE":
            valueAttrDictRef = dict()
            searchCursor = ARCPY.SearchCursor(self.rasterRef,
                                              fields=";".join(['Value', self.varNameRef]))
            for row in searchCursor:
                valueAttrDictRef[row.getValue('Value')] = row.getValue(self.varNameRef)
            del searchCursor

        fields = ARCPY.ListFields(self.rasterTar)
        for f in fields:
            if f.name == self.varNameTar:
                if f.type.upper() in ['TEXT', 'STRING']:
                    dataTypeTar = 'TEXT'
                else:
                    dataTypeTar = 'LONG'
                try:
                    fieldCatTarAlias = f.alias
                except:
                    fieldCatTarAlias = self.varNameTar
                break
        if self.varNameTar.upper() != "VALUE":
            valueAttrDictTar = dict()
            searchCursor = ARCPY.SearchCursor(self.rasterTar,
                                              fields=";".join(['Value', self.varNameTar]))
            for row in searchCursor:
                valueAttrDictTar[row.getValue('Value')] = row.getValue(self.varNameTar)
            del searchCursor

        if self.inputFeatureVarAlias is not None:
            if self.inputFeatureClass == "REF":
                fieldCatRefAlias = self.inputFeatureVarAlias
            elif self.inputFeatureClass == "TAR":
                fieldCatTarAlias = self.inputFeatureVarAlias

        outDir, outFileName = OS.path.split(self.outRaster)
        baseType = UTILS.getBaseWorkspaceType(outDir)
        if baseType.upper() == "FILESYSTEM":
            outFileName = OS.path.splitext(outFileName)[0] + ".tif"
        else:
            outFileName = outFileName.split(".")[0]
        self.outRasterNameFull = OS.path.join(outDir, outFileName)
        if ARCPY.Exists(self.outRasterNameFull):
            ARCPY.Delete_management(self.outRasterNameFull)

        ARCPY.SetProgressor("default", "Combining input raster datasets....")
        out_raster = None
        import warnings as WARNINGS
        with WARNINGS.catch_warnings():
            WARNINGS.simplefilter("ignore")
            try:
                #ARCPY.sa.Combine([self.rasterRef, self.rasterTar])
                out_raster = ARCPY.sa.Combine([self.rasterRef, self.rasterTar])
            except:
                pass

            #### Wrapping Messages ####
            errors = ARCPY.GetMessages(2)
            warnings = ARCPY.GetMessages(1)

            if ARCPY.env.isCancelled:
                raise SystemExit()
            if len(warnings):
                ARCPY.AddWarning(str(warnings))
            if len(errors):
                ARCPY.AddError(str(errors))
                raise SystemExit()

            out_raster.save(self.outRasterNameFull)

        #### After the combination, Calculate V-Measures ####
        ARCPY.SetProgressor("default", "Calculating Global Measure of Spatial Association....")
        fields = ARCPY.ListFields(self.outRasterNameFull)
        fieldName_refOld = fields[-2].name
        fieldName_tarOld = fields[-1].name

        self.vm = VMeasure()

        staSearchCursor = ARCPY.SearchCursor(self.outRasterNameFull,
                                  fields=";".join(['Value', 'Count', fieldName_refOld, fieldName_tarOld]))

        if valueAttrDictRef is None and valueAttrDictTar is None:
            for row in staSearchCursor:
                self.vm.append(row.getValue(fieldName_refOld), 
                               row.getValue(fieldName_tarOld), 
                               row.getValue("Count"))

        elif valueAttrDictRef is not None and valueAttrDictTar is None:
            for row in staSearchCursor:
                self.vm.append(valueAttrDictRef[row.getValue(fieldName_refOld)], 
                               row.getValue(fieldName_tarOld), 
                               row.getValue("Count"))

        elif valueAttrDictRef is None and valueAttrDictTar is not None:
            for row in staSearchCursor:
                self.vm.append(row.getValue(fieldName_refOld), 
                               valueAttrDictTar[row.getValue(fieldName_tarOld)], 
                               row.getValue("Count"))

        else:
            for row in staSearchCursor:
                self.vm.append(valueAttrDictRef[row.getValue(fieldName_refOld)],
                               valueAttrDictTar[row.getValue(fieldName_tarOld)],
                               row.getValue("Count"))

        del staSearchCursor

        if len(self.vm.areaTar) == 0:
            ARCPY.AddIDMessage("ERROR", 110376)
            raise SystemExit()

        #### Calculate Indices ####
        self.vm._calIndex()
        ARCPY.ResetProgressor()

        #### Finialize the results ####
        if self.hasOutRaster:
            #### Prepare the update cursor here ####
            fields2add = []
            if valueAttrDictRef is not None:
                fAlias = "Value of Input Raster"
                fields2add.append(["VALUE_IN", 'LONG', fAlias, None, -9999, None])
            if valueAttrDictTar is not None:
                fAlias = "Value of Overlay Raster"
                fields2add.append(["VALUE_OVL", 'LONG', fAlias, None, -9999, None])

            #### Use Actual Category Field Names ####
            fieldCatRef = "CAT_IN"
            fieldCatTar = "CAT_OVL"

            if fieldCatRefAlias.upper() == fieldCatTarAlias.upper():
                fieldCatRefAlias += ARCPY.GetIDMessage(220130)
                fieldCatTarAlias += ARCPY.GetIDMessage(220131)

            if fieldCatRefAlias.upper() == "VALUE":
                fieldCatRefAlias += ARCPY.GetIDMessage(220130)
            if fieldCatTarAlias.upper() == "VALUE":
                fieldCatTarAlias += ARCPY.GetIDMessage(220131)

            fields2add += [[fieldCatRef, dataTypeRef, fieldCatRefAlias, None, -9999, None],
                           [fieldCatTar, dataTypeTar, fieldCatTarAlias, None, -9999, None],
                           ["CRSPDNC_IO", 'FLOAT', ARCPY.GetIDMessage(220129).
                               format(fieldCatRefAlias, fieldCatTarAlias), None, -9999, None],
                           ["CRSPDNC_OI", 'FLOAT', ARCPY.GetIDMessage(220129).
                               format(fieldCatTarAlias, fieldCatRefAlias), None, -9999, None],
                           ["BIVAR_CAT", 'TEXT', ARCPY.GetIDMessage(220145), None, None, None]]

            self.outCatFieldAliasRef = fieldCatRefAlias
            self.outCatFieldAliasTar = fieldCatTarAlias

            cat_LH = self.__threeStagelassify(self.vm.getLocalInHomogentity(), self.vm.areaTar)
            cat_LC = self.__threeStagelassify(self.vm.getLocalInCompleteness(), self.vm.areaRef)
            bivariateCatDict = {
                (0, 0): "HH",
                (0, 1): "HM",
                (0, 2): "HL",
                (1, 0): "MH",
                (1, 1): "MM",
                (1, 2): "ML",
                (2, 0): "LH",
                (2, 1): "LM",
                (2, 2): "LL",
            }

            #### Finialize the results and append them to the results ####
            ARCPY.management.AddFields(self.outRasterNameFull, fields2add)

            fields2update = [fieldName_refOld, fieldName_tarOld] + [item[0] for item in fields2add]
            LH = self.vm.getLocalInHomogentity()
            LC = self.vm.getLocalInCompleteness()
            insufficientCats = False
            if len(cat_LH) < 3 or len(cat_LC) < 3:
                insufficientCats = True

            with ARCPY.da.UpdateCursor(self.outRasterNameFull, fields2update) as popupRasterUpdateCursor:
                if valueAttrDictRef is None and valueAttrDictTar is None:
                    for row in popupRasterUpdateCursor:
                        valRef = row[0]
                        valTar = row[1]
                        row[2] = valRef
                        row[3] = valTar

                        lh_Tar = LH[valTar]
                        lc_Ref = LC[valRef]

                        row[4] = lh_Tar
                        row[5] = lc_Ref
                        if insufficientCats:
                            bivCatLabel = "MM"
                        else:
                            bivCatLabel = bivariateCatDict[
                                (self.__getThreeStageCategry(cat_LH, lh_Tar),
                                    self.__getThreeStageCategry(cat_LC, lc_Ref))]
                        row[6] = bivCatLabel
                        popupRasterUpdateCursor.updateRow(row)
                elif valueAttrDictRef is not None and valueAttrDictTar is None:
                    for row in popupRasterUpdateCursor:
                        valRef = row[0]
                        valTar = row[1]
                        catRef = valueAttrDictRef[valRef]
                        row[2] = valRef
                        row[3] = catRef
                        row[4] = valTar

                        lh_Tar = LH[valTar]
                        lc_Ref = LC[catRef]

                        row[5] = lh_Tar
                        row[6] = lc_Ref
                        if insufficientCats:
                            bivCatLabel = "MM"
                        else:
                            bivCatLabel = bivariateCatDict[
                                (self.__getThreeStageCategry(cat_LH, lh_Tar),
                                 self.__getThreeStageCategry(cat_LC, lc_Ref))]
                        row[7] = bivCatLabel
                        popupRasterUpdateCursor.updateRow(row)
                elif valueAttrDictRef is None and valueAttrDictTar is not None:
                    for row in popupRasterUpdateCursor:
                        valRef = row[0]
                        valTar = row[1]
                        catTar = valueAttrDictTar[valTar]
                        row[2] = valTar
                        row[3] = valRef
                        row[4] = catTar

                        lh_Tar = LH[catTar]
                        lc_Ref = LC[valRef]

                        row[5] = lh_Tar
                        row[6] = lc_Ref
                        if insufficientCats:
                            bivCatLabel = "MM"
                        else:
                            bivCatLabel = bivariateCatDict[
                                (self.__getThreeStageCategry(cat_LH, lh_Tar),
                                 self.__getThreeStageCategry(cat_LC, lc_Ref))]
                        row[7] = bivCatLabel
                        popupRasterUpdateCursor.updateRow(row)
                else:
                    for row in popupRasterUpdateCursor:
                        valRef = row[0]
                        valTar = row[1]
                        catRef = valueAttrDictRef[valRef]
                        catTar = valueAttrDictTar[valTar]
                        row[2] = valRef
                        row[3] = valTar
                        row[4] = catRef
                        row[5] = catTar

                        lh_Tar = LH[catTar]
                        lc_Ref = LC[catRef]

                        row[6] = lh_Tar
                        row[7] = lc_Ref
                        if insufficientCats:
                            bivCatLabel = "MM"
                        else:
                            bivCatLabel = bivariateCatDict[
                                (self.__getThreeStageCategry(cat_LH, lh_Tar),
                                 self.__getThreeStageCategry(cat_LC, lc_Ref))]
                        row[8] = bivCatLabel
                        popupRasterUpdateCursor.updateRow(row)

            #### Delete the duplicated fields by the end ####
            fields2delete = [fieldName_refOld, fieldName_tarOld]
            if valueAttrDictRef is not None and self.inputFeatureClass == "REF":
                fields2delete.append('VALUE_IN')
            if valueAttrDictTar is not None and self.inputFeatureClass == "TAR":
                fields2delete.append('VALUE_OVL')
            ARCPY.DeleteField_management(self.outRasterNameFull, fields2delete)
        else:
            try:
                ARCPY.Delete_management(self.outRasterNameFull)
            except:
                pass
        return

    def __threeStagelassify(self, localSta, areaSta):
        """
        Classify the data according to the statistic info (histogram)
        Parameters
        ----------
        localSta
        areaSta

        Returns
        -------

        """
        #### prepare dataset ####
        value_count_dict = {}
        for cat, lh in localSta.items():
            count = int(areaSta[cat])
            if lh in value_count_dict:
                value_count_dict[lh] += count
            else:
                value_count_dict[lh] = count

        dataCollection = []
        for value, count in value_count_dict.items():
            dataCollection.append([value, count])
        dataCollection = sorted(dataCollection, key=lambda x: x[0])
        dataCollection = NUM.array(dataCollection)
        values = NUM.array(dataCollection[:, 0], float)
        counts = NUM.array(dataCollection[:, 1], NUM.int32)

        numCategory = 3
        numUniqueValue = len(values)
        if numUniqueValue < numCategory:
            numCategory = numUniqueValue - 2

        if numCategory > 1:
            #### Calculate the NATURAL BREAKS here ####
            applyRoundG = False
            def rValue(value, condition, size=6):
                """ Round Value """
                if applyRoundG:
                    return NUM.round(value, size) if condition else value
                else:
                    return value

            meanValue = (values * counts).sum() / counts.sum()
            stdDevValue = NUM.sqrt(((values - meanValue) ** 2).sum())

            minValue = values.min()
            maxValue = values.max()

            if NUM.isclose(minValue, maxValue):
                output = [maxValue]
            else:
                #### Fake number of categories ####
                definedInterval = 0
                categories = ARC._ss.get_breaks(classify_method=5,
                                                unique=values,
                                                count=counts,
                                                num_class=numCategory,
                                                defined_interval_size=definedInterval,
                                                mean=meanValue,
                                                std_dev=stdDevValue,
                                                std_interval=0)

                if categories is None:
                    output = [maxValue]

                else:
                    #### Compare User Input Against Original Value ####
                    output = categories[1:]
        else:
            output = [values.max()]

        return NUM.array(output)

    def __getThreeStageCategry(self, stages, value):
        cat = 2
        for ind, stage in enumerate(stages):
            if value <= stage:
                cat = ind
                break
        return cat

    def getVMeasures(self):
        if self.vm is None:
            return None, None
        betas = [0, 0.001, 0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1, 2, 3, 5, 10, 20, 100]
        if self.beta not in betas:
            betas.append(self.beta)
            betas = sorted(betas)
        betas = NUM.array(betas)
        vMeasures = NUM.array([self.vm.calVMeasure(x) for x in betas])
        return betas, vMeasures

    def rebuildRasterBivariateColorSymbol(self, paramID):
        import json
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        from arcpy.cim.cimloader import CimJsonEncoder

        pathTemplate = OS.path.join(UTILS.pathLayers, "Sabre_BivariateColors_Raster.lyrx")

        content = ""
        if OS.path.isfile(pathTemplate):
            f = open(pathTemplate, 'r')
            content = f.read()
            f.close()
        else:
            return

        cimLayer = GetJSONTypeOBJ(json.loads(content))

        cimLayer.layerDefinitions[0].colorizer.groups[0].heading = ARCPY.GetIDMessage(220145)

        #### Update Class Labels####
        for cla in cimLayer.layerDefinitions[0].colorizer.groups[0].classes:
            if cla.label.upper() in MESSAGE_DICT:
                cla.label = MESSAGE_DICT[cla.label.upper()]

        #### Get Back JSON String ####
        jsonData = json.dumps(cimLayer.layerDefinitions[0], cls=CimJsonEncoder)
        ARCPY.gp.SetParameterSymbology(paramID, "JSONCIMDEF=" + jsonData)

    def createOutputTable(self, outputTable):
        if self.vm is None:
            return
        outPath, outName = OS.path.split(outputTable)

        #### Set Up Field Names and Types ####
        inputFields = UTILS.getFieldNames(["BETA", "V_MEASURE"], outPath)
        inputTypes = ["DOUBLE", "DOUBLE"]

        #### Create Box Plot Table ####
        inputData = []
        betas, vMeasures = self.getVMeasures()
        for ind in range(len(betas)):
            inputData.append((betas[ind], vMeasures[ind]))

        #### Write Coefficient Table ####
        UTILS.createOutputTable(outputTable, inputFields,
                                inputTypes, inputData, aliases=["Beta", "Measure of Spatial Association"])

    def report(self):
        if self.vm is None:
            return
        header = ARCPY.GetIDMessage(84547)

        #### Column Labels ####
        total = []
        total.append([ARCPY.GetIDMessage(220101), LOCALE.format_string("%0.4f", self.vm.calVMeasure(self.beta))])
        total.append([ARCPY.GetIDMessage(220102),
                      LOCALE.format_string("%0.4f", self.vm.getHomogentity())])
        total.append([ARCPY.GetIDMessage(220103),
                      LOCALE.format_string("%0.4f", self.vm.getCompleteness())])
        total.append([ARCPY.GetIDMessage(220105), str(len(self.vm.getLocalInCompleteness().keys()))])
        total.append([ARCPY.GetIDMessage(220107), str(len(self.vm.getLocalInHomogentity().keys()))])
        total.append("EMPTY")

        #### Create Output Text Table ####
        table = UTILS.outputTextTable(total, header = header,
                                                   pad = 1, colPad = 5,
                                                   justify = ["left", "right"],
                                                   titleFillToken = "-", emphasizeHeadRow=False,
                                                   emptyFillToken = "-", force2Txt=False)
        ARCPY.AddMessage(table)
