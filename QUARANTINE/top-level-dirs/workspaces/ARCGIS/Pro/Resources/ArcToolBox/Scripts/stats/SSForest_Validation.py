from SSHelperFunctions import *

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup ARCPY and the list of tool parameters."""
        self.params = ARCPY.GetParameterInfo()
        self.shapeType = None
        self.fieldNames = None
        self.fieldAlias = None
        self.rfD = None
        self.fieldInput = {}
        self.fileExt = ".RFM"
        self.discrete = "(CAT)"
        self.continuous = "(CNT)"
        self.notDisplay = ["OID", "FID", "SHAPE", "OBJECTID", "SHAPE_LENG", "SHAPE_AREA"]
        self.noTypeDisplay = ["OID", "FID", "DATE"]
        self.varTypeRev = { "(CNT)": 'Numeric',"(DSC)":'Categorical' }
        self.typeOperationPolygon = ["AVG", "MAJORITY", "SUM"]
        self.typeOperationPoint = ["None"]
        self.isPolygon = False
        self.desc = None
        self.descF2P = None
        self.fieldAliasF2P = None
        self.fieldNamesF2P = None
        self.modelCreated = ''
        self.lic = True
        self.near = True
        self.inFields = None
        self.inFiedsF2P = None
        #### Set Default Values ####
        self.defaultIndexList = [0, 16, 19, 21, 25, 29] 
        self.defaultValueList = ["TRAIN", 100, 100, 10.0, 1, "FOREST-BASED"] 
        self.defaultIndexListXG = [0, 16, 19, 21, 25, 30, 31, 32, 33]
        self.defaultValueListXG = ["TRAIN", 100, 100, 10.0, 1, 1.0, 0.0, 0.3, 0]
        self.listAvailableXGB = ["NUM_TREES",
                                 "MAX_DEPTH", 
                                 "LEAF_SIZE", "SAMPLE_SIZE",
                                 "RANDOM_VARIABLES", 
                                 "ETA", "REG_LAMBDA", "GAMMA", "MAX_BINS"]
        self.listAvailableRF = ["NUM_TREES",
                                 "MAX_DEPTH", 
                                 "LEAF_SIZE", "SAMPLE_SIZE",
                                 "RANDOM_VARIABLES", 
                                 ]     
        self.defaultXGBStatus = [ ("REG_LAMBDA", 30, 1.0), ("GAMMA", 31, 0), ("ETA", 32,0.3),  ("MAX_BINS", 33, 0)]   
        self.defaultStatus = [ ("NUM_TREES", 16, 100), ("LEAF_SIZE", 17, None), ("MAX_DEPTH", 18, None), ("SAMPLE_SIZE", 19, 100),("RANDOM_VARIABLES", 20, None) ]
    def populateField(self):
        if self.desc is not None:
            desc = self.desc
            try:
                self.inFields = UTILS.SSFieldsInfo(self.desc)
            except:
                self.inFields = None
                return 

    def getFieldType(self, row):
        """ Overwrite Categorical option for text fields 
        INPUT:
            row (list): Information value table [(field, bool)]
        """

        dat = ([self.inFields.fieldAlias(str(row[0].value)), False], False) \
               if row[1] in [ None, False, "#"] \
               else ([self.inFields.fieldAlias(str(row[0].value)), row[1]], True)

        #### If Field is Set as Categorical ####
        if dat[1]:
            return dat[0]

        #### If Field is String Then It is Considered Categorical (True) Overwrite User ####
        row = dat[0]
        if self.inFields:
            field = self.inFields.fieldAlias(row[0].name)

            if field is not None:
                fieldType = field.ftype

                if fieldType.upper() in ["TEXT","STRING"]:
                    return [field, True]

        return row

    def fcType(self, inputFC):
        try:
            self.desc = ARCPY.Describe(inputFC)
            if "Polygon" == self.desc.shapeType:
                self.isPolygon = True
            if "Point" == self.desc.shapeType:
                self.isPolygon = False
            self.populateField()
        except:
            pass

    def getDescribeF2P(self, inputFC):
        try:
            self.descF2P = ARCPY.Describe(inputFC)
            self.inFiedsF2P = UTILS.SSFieldsInfo(self.descF2P)
        except:
            pass

    def existInF2P(self, name):
        try:
            field = self.inFiedsF2P.fieldAlias(name)
            if field is not None:
                return field.name
        except:
            pass

        return None

    def replaceE(self, value, listR):
        for ele in listR:
            index = -1*len(ele)
            info  = value[index:]
            if value[index:] == ele:
                return value[:(index-1)], info
        return value, ""

    def getValuesVT(self, parameter, infoList = None, removePart = []):
        """ Get values from a value table parameter
        """
        info = parameter.valueAsText
        info = info.split(";")
        data  = []

        if infoList is not None:
            try:
                for id, opt in enumerate(info):
                    part = []
                    count = sum(map(lambda x : 1 if "'" in x else 0, opt ))
                    if count == 2:
                        part1 = opt.split("'")[1::2]
                        part2 = opt.replace(part1[0],"").replace("'","").strip()
                        part = [part1[0], infoList[id]]
                    elif count == 4:
                        part = opt.split("'")[1::2]
                        part[1] = infoList[id]
                    else:
                        part = opt.split(" ")
                        part[1] = infoList[id]
                    data.append(part)
            finally:
                return data
            return data
        else:
            data2 = []
            try:
                for opt1 in info:
                    opt, infov = self.replaceE(opt1, removePart)
                    part = []

                    count = sum(map(lambda x : 1 if "'" in x else 0, opt ))
                    if len(removePart) == 0:
                        count = sum(map(lambda x : 1 if "'" in x else 0, opt ))

                    if count == 2:
                        part1 = opt.split("'")[1::2]
                        part2 = opt.replace(part1[0],"").replace("'","").strip()
                        data.append(part1[0])

                        if not len(removePart):
                            data2.append(part2)
                        else:
                            data2.append(infov)

                    elif count == 4:
                        part = opt.split("'")[1::2]
                        data.append(part[0])
                        data2.append(part[1])

                    else:
                        part = opt.split(" ")
                        data.append(part[0])

                        if not len(removePart):
                            data2.append(part[1])
                        else:
                            data2.append(infov)

                return data, data2
            finally:
                return data, data2
            return data, data2
        return []

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        parameters = self.params
        if ARCPY.CheckExtension("spatial") != "Available":
            self.lic = False

        if self.lic:
            parameters[0].filter.list = ["TRAIN","PREDICT_FEATURES", "PREDICT_RASTER"]
        else:
            parameters[0].filter.list = ["TRAIN","PREDICT_FEATURES"]

        return

    def checkSimilarInput(self, inputParameter, lstParameters):
        #### Check Similar Input ####
        if inputParameter.value is not None:
            for par in lstParameters:
                if par.value is not None:
                    if par.valueAsText == inputParameter.valueAsText:
                        par.setIDMessage("ERROR", 733, inputParameter.displayName, par.displayName)

    def updateParameters(self):
        parameters = self.params
        predictionType = parameters[0]
        inFeatures = parameters[1]
        variablePredict = parameters[2]
        treatVariableAsCategorical = parameters[3]
        explanatoryVariables = parameters[4]
        distanceFeatures = parameters[5]
        explanatoryRasters = parameters[6]
        featuresToPredict = parameters[7]
        outputFeatures = parameters[8]
        outputRaster = parameters[9]
        explanatoryVariableMatching = parameters[10]
        explanatoryDistanceMatching = parameters[11]
        explanatoryRastersMatching = parameters[12]
        outputTrainedFeatures = parameters[13]
        outputDiagnosticTable = parameters[14]
        useRasterValues = parameters[15]
        numberOfTrees = parameters[16]
        minimumLeafSize = parameters[17]
        maximumLevel = parameters[18]
        sampleSize = parameters[19]
        fieldsToTry = parameters[20]
        percentageForTraining = parameters[21]
        outputConfusionTable = parameters[22]
        outputCrossValidationTable = parameters[23]
        balanceTree = parameters[24]
        numberCrossValidationIterations = parameters[25]
        calculateUncertainty = parameters[26]
        modelType = parameters[29]
        lambdaValue = parameters[30]
        gammaValue = parameters[31]
        learningRate = parameters[32]
        maxBins = parameters[33]
        optimize = parameters[34]
        optimizeAlgorithm = parameters[35]
        optimizeTarget = parameters[36]
        numSearch = parameters[37]
        modelParamSetting = parameters[38]
        outputParamTunningTable = parameters[39]
        addProbabilities = parameters[40]

        isXGB = False

        if modelType.value == "FOREST-BASED":
            modelParamSetting.filters[0].list = self.listAvailableRF

        else:
            modelParamSetting.filters[0].list = self.listAvailableXGB
            isXGB =  modelType.value == "GRADIENT_BOOSTED"


        parameteOptimizationSettingSTR = modelParamSetting.valueAsText
        if parameteOptimizationSettingSTR is None:
            parameteOptimizationSettingSTR=""

        UTILS.validateOutputFile(parameters, 28, ".ssm")
        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        if ARCPY.CheckExtension("spatial") != "Available":
            self.lic = False

        self.near = True
        listAllExpVariables = []
        if predictionType.value:
            if predictionType.value == "TRAIN":
                featuresToPredict.value = None
                explanatoryVariableMatching.value = None
                explanatoryRastersMatching.value = None
                explanatoryDistanceMatching.value = None
                outputFeatures.value = None
                outputRaster.value = None

                seePar = [4]
                hidePar = [7, 8, 9, 10, 11,12]

                if self.lic:
                    seePar.append(6)
                else:
                    parameters[6].value  = None
                    hidePar.append(6)

                if self.near:
                    seePar.append(5)
                else:
                    parameters[5].value  = None
                    hidePar.append(5)

                enableParametersBy(parameters, seePar, hidePar)

            elif predictionType.value == "PREDICT_FEATURES":
                seePar = [4, 7, 8, 10]
                hidePar = [9]
                outputRaster.value = None

                if self.lic:
                    seePar.extend([6, 12])
                else:
                    hidePar.extend([6, 12])

                if self.near:
                    seePar.extend([5, 11])
                else:
                    hidePar.extend([5, 11])

                enableParametersBy(parameters, seePar, hidePar)

            elif  predictionType.value == "PREDICT_RASTER":
                featuresToPredict.value = None
                outputFeatures.value = None
                enableParametersBy(parameters, [9, 10, 11, 12], [7, 8, 4, 5, 10, 11 ])
            else:
                return

        #### Get Information of Field Aliases of Input FC ####
        if inFeatures.enabled and inFeatures.altered:
            if inFeatures.value:
                self.fcType(inFeatures.value)

        #### Verify the Type of Field to Treat Tool as Class/Regr ####
        typeVar = []
        if variablePredict.value:
            if self.desc is not None:
                try:
                    typeVar = [ (p, p.type) for p in self.desc.fields if p.name.upper() == variablePredict.value.value.upper()]
                    if len(typeVar):
                        if typeVar[0][1].upper() in ["TEXT", "STRING"]:
                            treatVariableAsCategorical.value  = True
                            if predictionType.value != "PREDICT_RASTER":
                                addProbabilities.enabled = True
                except:
                    pass

        if len(typeVar) and outputTrainedFeatures.value and variablePredict.value:
            newField = ARCPY.Field()
            newField.name = "PREDICTED"
            if typeVar[0][1].upper() in ["TEXT", "STRING"]:
                newField.type = "TEXT"
                newField.length = typeVar[0][0].length
            else:
                newField.type = "DOUBLE"
            outputTrainedFeatures.schema.additionalFields = [newField]

        if len(typeVar) and outputFeatures.value and variablePredict.value:
            newField = ARCPY.Field()
            newField.name = "PREDICTED"
            if typeVar[0][1].upper() in ["TEXT", "STRING"]:
                newField.type = "TEXT"
                newField.length = typeVar[0][0].length
            else:
                newField.type = "DOUBLE"
            outputFeatures.schema.additionalFields = [newField]

        #### If Number of Trees is Zero - Just Train Option is Enable ####
        if numberOfTrees.value == 0:
            predictionType.filter.list = ["TRAIN"]
            predictionType.value = "TRAIN"
            calculateUncertainty.enabled = False
        else:
            calculateUncertainty.enabled = True
            if self.lic:
                predictionType.filter.list = ["TRAIN","PREDICT_FEATURES", "PREDICT_RASTER"]
            else:
                predictionType.filter.list = ["TRAIN","PREDICT_FEATURES"]

        #### Balance Trees is Just Applied in Classification ####
        if treatVariableAsCategorical.value:
            balanceTree.enabled = True
            outputConfusionTable.enabled = True
            calculateUncertainty.enabled = False
            if predictionType.value != "PREDICT_RASTER":
                addProbabilities.enabled = True
        else:
            balanceTree.enabled = False
            outputConfusionTable.enabled = False
            calculateUncertainty.enabled = True
            addProbabilities.enabled = False
            addProbabilities.value = False

        #### Disable Leaf/sample size/level if Balance is enabled ####
        if balanceTree.enabled:
            if balanceTree.value:
                enableParametersBy(parameters, [18], [17, 19])
            else:
                enableParametersBy(parameters, [17, 18, 19], [])
        else:
            enableParametersBy(parameters, [17, 18, 19], [])

        #### If Number of Trees is Zero - Just Train Option is Enable ####
        if numberOfTrees.value == 0:
            predictionType.filter.list = ["TRAIN"]
            predictionType.value = "TRAIN"
            enableParametersBy(parameters, [], [14,17,18,19,20,21,22,24,25,26,34,35,36,37,38,39])
            numberCrossValidationIterations.value = 1
        else:
            predictionType.filter.list = ["TRAIN", "PREDICT_FEATURES", "PREDICT_RASTER"]
            visibleControls = None

            #### Hide Confusion Output Table ####
            if treatVariableAsCategorical.value:
                visibleControls = [14,17,18,19,20,21,22,24,25]
            else:
                visibleControls = [14,17,18,19,20,21,25,26]
                parameters[24].value  = False

            enableParametersBy(parameters, visibleControls, [])

            if balanceTree.value:
                enableParametersBy(parameters, [18], [17, 19])

        def EnableOptimizationParameter(parStr, name, parameters, index, default):
            if name in parStr :
                parameters[index].enabled = False
                parameters[index].value = default
            else:
                parameters[index].enabled = True


        #### Percentage Training ####
        if percentageForTraining.value == 0:
            outputConfusionTable.enabled = False
            outputCrossValidationTable.enabled = False
            numberCrossValidationIterations.value = 1
            numberCrossValidationIterations.enable = False
            outputCrossValidationTable.value = None

            optimize.enabled = False
            optimize.value = False
            optimizeAlgorithm.enabled = False
            optimizeTarget.enabled = False
            modelParamSetting.enabled = False
            numSearch.enabled = False
            modelParamSetting.value = None

            ### Reset original model parameters 
            for val in self.defaultStatus:
                EnableOptimizationParameter("", val[0], parameters, val[1], val[2] )
            if isXGB:
                for val in self.defaultXGBStatus:
                    EnableOptimizationParameter("", val[0], parameters, val[1], val[2] )

        else:
            optimize.enabled = True

        #### Output Cross Validation Table is Enabled When Iterations GT One ####
        if numberCrossValidationIterations.value and modelType.value == "FOREST-BASED":
            if int(numberCrossValidationIterations.value) > 1:
                outputCrossValidationTable.enabled = True
            else:
                outputCrossValidationTable.enabled = False


        #### Check Variables To Explode Polygon ####
        resolutionParameterShow  = self.isPolygon and treatVariableAsCategorical.value and predictionType.value in ["TRAIN", "PREDICT_RASTER"]

        #### Check/Update Extension of Output Table Parameters ####
        tableCheck(outputDiagnosticTable, True)
        tableCheck(outputConfusionTable, True)
        tableCheck(outputCrossValidationTable, True)

        #### Update Explanatory Variables - Using Trick To Avoid Click By Default ####
        if predictionType.value  in ["TRAIN","PREDICT_FEATURES"]:

            if explanatoryVariables.value:
                v = []
                #### Fill Exp Variables - Checking Aliases ####
                try:
                    for i in explanatoryVariables.value:
                        if i[0].value not in [None, "#", ""]:
                            valueToInsert = self.getFieldType(i)
                            v.append([valueToInsert[0].name,valueToInsert[1]])
                            listAllExpVariables.append(valueToInsert[0].name)
                except:
                    pass

                explanatoryVariables.value = v

            if featuresToPredict.altered:
                if featuresToPredict.value:
                    self.getDescribeF2P(featuresToPredict.value)

        if predictionType.value == "PREDICT_RASTER":
            explanatoryVariables.value = None
            distanceFeatures.value = None

        expRaster = None
        matchExpRaster = None

        if explanatoryRasters.altered:
            expRaster = explanatoryRasters.valueAsText
            matchExpRaster = explanatoryRastersMatching.valueAsText

        if predictionType.value == "PREDICT_FEATURES":
            if featuresToPredict.value:
                try:
                    if explanatoryVariables.value:
                        isFilled = False

                        explaVNames = []

                        for i in explanatoryVariables.value:
                            val = str(i[0].value)
                            field = self.inFields.fieldAlias(val)
                            explaVNames.append(field)

                        if explanatoryVariableMatching.value:
                            matchV = explanatoryVariableMatching.value
                            tEmptyToPredictFields = [ i  for i in  matchV if i[0] is not None]
                            isFilled = len(tEmptyToPredictFields) == len(explaVNames)

                        if not isFilled:
                            explanatoryVariableMatching.value = [[self.existInF2P(i.name), str(i)] for id, i in enumerate(explaVNames)]
                        else:
                            values = []
                            if len(explaVNames):
                                for id, i in enumerate(explaVNames):
                                    v = matchV[id]
                                    ex = self.existInF2P(v[0].value)
                                    values.append([ex.name, str(i)])
                                explanatoryVariableMatching.value = values

                except:
                    pass

        #### Clean Matching Variables ####
        if explanatoryVariables.value is None:
            explanatoryVariableMatching.value = None

        if expRaster in ["", None]:
            explanatoryRastersMatching.value = None
        if distanceFeatures.value is None:
            explanatoryDistanceMatching.value = None

        try:
            listAllExpVariables.extend([i for i in distanceFeatures.values])
        except:
            pass

        if predictionType.value in ["TRAIN", "PREDICT_FEATURES"]:
            if not distanceFeatures.hasBeenValidated or predictionType.altered:

                #### Get Current Distance Features ####
                if distanceFeatures.value :
                    distancesFCList = [pathDist.replace("'","") for pathDist in \
                                       str(distanceFeatures.value).split(";")]
                    #### Create Var to Fill Match. Dist Param ####
                    matchD = [[pathDist, pathDist] for pathDist in distancesFCList]

                    if explanatoryDistanceMatching.values is None:
                        #### Update Match Dist Par ####
                        explanatoryDistanceMatching.values = matchD
                    else:
                        #### Get Current List Matching Feature ####
                        values = explanatoryDistanceMatching.values

                        if len(values) == len(distancesFCList):
                            #### Replace New Selection ####
                            explanatoryDistanceMatching.values = self.getValuesVT(explanatoryDistanceMatching, distancesFCList)
                        else:
                            #### Update Using New List of Distance Features ###
                            matchD2 = matchD

                            if len(values) > 0:
                                #### Get List Per Colummn in Value Table ####
                                current2P, current2M = self.getValuesVT(explanatoryDistanceMatching)
                                matchD2 = []

                                #### Compare/Update With Previous Selection ####
                                for base in matchD:
                                    if base[0] in current2M:
                                        matchD2.append([current2P[current2M.index(base[0])], base[0]])
                                    else:
                                        matchD2.append([base[0], base[1]])

                            #### Replace Matching Parameter ####
                            explanatoryDistanceMatching.values = matchD2

                if distanceFeatures.value is None:
                    explanatoryDistanceMatching.value = None

            if distanceFeatures.value is None :
                explanatoryDistanceMatching.value = None

            if predictionType.value == "TRAIN":
                explanatoryDistanceMatching.value = None

        try:
            listAllExpVariables.extend([i for i in explanatoryRasters.value])
        except:
            pass

        if  predictionType.value  in ["PREDICT_FEATURES", "PREDICT_RASTER"]:
            if explanatoryRasters.altered and not explanatoryRasters.hasBeenValidated or predictionType.altered :
                try:
                    matchR = None
                    if expRaster not in ["", None]:
                        #### Get Current List Of Rasters ####
                        valueRasters, cats = self.getValuesVT(explanatoryRasters, removePart = ["#", "true", "false"])
                        #### Create Variable to Fill Match. Raster Param ####
                        matchR = [[pathR, pathR] for pathR in valueRasters]

                        if explanatoryRastersMatching.valueAsText in ["", None]:
                            #### Update Match Raster Par ####
                            explanatoryRastersMatching.values = matchR
                        else:
                            #### Get Current List Raster in the Match. Raster Parameter ####
                            values = explanatoryRastersMatching.valueAsText
                            values = values.split(";")

                            if len(values) == len(valueRasters):
                                #### Replace New Selection ####
                                explanatoryRastersMatching.values = self.getValuesVT(explanatoryRastersMatching, valueRasters)
                            else:
                                #### Update Using New Raster List ###
                                matchR2 = matchR
                                if len(values) > 0:
                                    #### Get List Per Colummn in Value Table ####
                                    current2PR, current2MR = self.getValuesVT(explanatoryRastersMatching)
                                    matchR2 = []

                                    #### Compare/Update With Previous Selection ####
                                    for base in matchR:
                                        if base[0] in current2MR:
                                            matchR2.append([current2PR[current2MR.index(base[0])], base[0]])
                                        else:
                                            matchR2.append([base[0], base[1]])
                                #### Replace Match Raster Parameter ####
                                explanatoryRastersMatching.values = matchR2

                except:
                    pass

        if explanatoryVariables.value is None and distanceFeatures.value is None \
            and expRaster is not None and predictionType.value != "PREDICT_FEATURES" and self.isPolygon:
            enableParametersBy(parameters,[15], [])
            if not resolutionParameterShow:
                enableParametersBy(parameters,[], [15])

        else:
            enableParametersBy(parameters,[], [15])

        if outputRaster.value:
            path =  str(outputRaster.value)
            if not UTILS.isGDB(path):
                outPath, outName = OS.path.split(path)
                if "." not in outName.upper():
                     outputRaster.value =  str(outputRaster.value)+ ".tif"

        if modelType is not None:
            if isXGB:
                enableParametersBy(parameters, [30,31,32,33], [24,26])
            else:
                enableParametersBy(parameters, [], [30,31,32,33])
                lambdaValue.value = None
                gammaValue.value = None
                learningRate.value = None
                maxBins.value = None

            #### Output Cross Validation Table is Enabled When Iterations GT One ####
            if isXGB:
                try:
                    numberCrossValidationIterations.enabled =  False
                    if fieldsToTry.value:
                        if fieldsToTry.value < len(listAllExpVariables):
                            numberCrossValidationIterations.enabled =  True

                    if sampleSize.value < 100 and sampleSize.value != 0 :
                        numberCrossValidationIterations.enabled =  True

                    if fieldsToTry.value is not None and (sampleSize.value < 100 or (fieldsToTry.value < len(listAllExpVariables))) and int(numberCrossValidationIterations.value) > 1:
                        outputCrossValidationTable.enabled = True
                    else:
                        outputCrossValidationTable.enabled = False

                    if percentageForTraining.value == 0:
                        outputCrossValidationTable.enabled = False
                except:
                    pass


        if modelType is not None and isXGB:
            reassignDefaults(parameters, self.defaultIndexListXG, self.defaultValueListXG)


        if fieldsToTry.value is None:
            totalVariables = len(listAllExpVariables)
            n = 1
            if treatVariableAsCategorical.value:
                ### Set Number of Fields for Permutation in classification ###
                n = int(NUM.sqrt(totalVariables))
            else:
                ### Set Number of Fields for Permutation in Regression ###
                n = int(totalVariables/3)

            #### fields_to_try Should be greater than zero ####
            fields_to_try = n

            if n == 0:
                fields_to_try = 1
                
            if totalVariables > fields_to_try:
                if percentageForTraining.value > 0:
                    numberCrossValidationIterations.enabled = True
                    optimize.enabled = True
                else:
                    numberCrossValidationIterations.enabled = False
                    optimize.enabled = False
                    optimize.value = False

        if numberCrossValidationIterations.enabled and numberCrossValidationIterations.value >1 :
            outputCrossValidationTable.enabled = True
        else:
            outputCrossValidationTable.enabled = False
            if isXGB and parameteOptimizationSettingSTR != "":
                if "SAMPLE_SIZE" in parameteOptimizationSettingSTR or "RANDOM_VARIABLES" in parameteOptimizationSettingSTR:
                    numberCrossValidationIterations.enabled = True
                    if numberCrossValidationIterations.value > 1:
                        outputCrossValidationTable.enabled = True
                    else:
                        outputCrossValidationTable.enabled = False
                        outputCrossValidationTable.value = None
            else:
                outputCrossValidationTable.enabled = False
                outputCrossValidationTable.value = None

        if optimize.value and numberOfTrees.value is not None and numberOfTrees.value != 0:

            if treatVariableAsCategorical.value:
                optimizeTarget.filter.list =["ACCURACY", "MCC", "F1-SCORE"]
                if optimizeTarget.value is None:
                    optimizeTarget.value = "ACCURACY"
            else:
                optimizeTarget.filter.list =["R2","RMSE"]
                if optimizeTarget.value is None:
                    optimizeTarget.value = "R2"

            tableCheck(outputParamTunningTable, True)

            optimizeAlgorithm.enabled = True
            optimizeTarget.enabled = True

            if optimizeAlgorithm.value is None:
                optimizeAlgorithm.value = "RANDOM"

            if optimizeAlgorithm.value in ["GRID"]:
                numSearch.enabled = False
            else:
                numSearch.enabled = True

            modelParamSetting.enabled = True
            outputParamTunningTable.enabled = True
            #enableParametersBy(parameters, [], [17,18,20])

            if parameteOptimizationSettingSTR != "":
                for val in self.defaultStatus:
                    EnableOptimizationParameter(parameteOptimizationSettingSTR, val[0], parameters, val[1], val[2] )
                if isXGB:
                    for val in self.defaultXGBStatus:
                        EnableOptimizationParameter(parameteOptimizationSettingSTR, val[0], parameters, val[1], val[2] )
            if isXGB:
                if  "RANDOM_VARIABLES" in parameteOptimizationSettingSTR or "RANDOM_VARIABLES" in parameteOptimizationSettingSTR:
                    optimizeAlgorithm.filter.list = ["RANDOM","RANDOM_ROBUST", "GRID"]
                else:
                    optimizeAlgorithm.filter.list = ["RANDOM", "GRID"]
            else:
                optimizeAlgorithm.filter.list = ["RANDOM","RANDOM_ROBUST", "GRID"]
        else:
            optimizeAlgorithm.enabled = False
            optimizeTarget.enabled = False
            numSearch.enabled = False
            modelParamSetting.enabled = False
            outputParamTunningTable.enabled = False
            optimizeAlgorithm.value = None
            optimizeTarget.value = None
            numSearch.value = None
            modelParamSetting.value = None
            outputParamTunningTable.value = None
            if isXGB:
                enableParametersBy(parameters, [16,17,18,19,20,30,31,32,33], [])
            else:
                enableParametersBy(parameters, [16,17,18,19,20], [30,31,32,33])

        if numberOfTrees.value is not None and numberOfTrees.value == 0:
            enableParametersBy(parameters, [], [17,18,19,20,21,25,30,31,32,33])
        else:
             if percentageForTraining.value > 0:
                enableParametersBy(parameters, [34], [])
        pass

    def updateMessages(self):
        parameters = self.params
        predictionType = parameters[0]
        inFeatures = parameters[1]
        variablePredict = parameters[2]
        treatVariableAsCategorical = parameters[3]
        explanatoryVariables = parameters[4]
        distanceFeatures = parameters[5]
        explanatoryRasters = parameters[6]
        featuresToPredict = parameters[7]
        outputFeatures = parameters[8]
        outputRaster = parameters[9]
        explanatoryVariableMatching = parameters[10]
        explanatoryDistanceMatching = parameters[11]
        explanatoryRastersMatching = parameters[12]
        outputTrainedFeatures = parameters[13]
        outputDiagnosticTable = parameters[14]
        useRasterValues = parameters[15]
        numberOfTrees = parameters[16]
        minimumLeafSize = parameters[17]
        maximumLevel = parameters[18]
        sampleSize = parameters[19]
        fieldsToTry = parameters[20]
        percentageForTraining = parameters[21]
        outputConfusionTable = parameters[22]
        outputCrossValidationTable = parameters[23]
        balanceTree = parameters[24]
        numberCrossValidationIterations = parameters[25]
        calculateUncertainty = parameters[26]
        ssmFile = parameters[28]
        modelType = parameters[29]
        lambdaValue = parameters[30]
        gammaValue = parameters[31]
        learningRate = parameters[32]
        maxBins = parameters[33]
        optimize = parameters[34]
        optimizeAlgorithm = parameters[35]
        optimizeTarget = parameters[36]
        numSearch = parameters[37]
        modelParamSetting = parameters[38]
        outputParamTunningTable = parameters[39]

        #### Check Similar Input ####
        self.checkSimilarInput(inFeatures, [outputRaster, outputDiagnosticTable, 
                                            outputParamTunningTable, outputConfusionTable,
                                            outputCrossValidationTable
                                            ])

        if ssmFile.value is not None:
            UTILS.checkOutputPath(ssmFile.valueAsText,"FILE",["SSM"], ssmFile)

        cleanDepthWarning = False
        if modelType and modelType.value == "GRADIENT_BOOSTED":  
            if maximumLevel.value is None:
                maximumLevel.setIDMessage("WARNING",230022)

        if fieldsToTry.value:
            if fieldsToTry.value < 1:
                fieldsToTry.setIDMessage("ERROR", 30112, fieldsToTry.displayName)

        if maximumLevel.value:
            if maximumLevel.value < 1:
                maximumLevel.setIDMessage("ERROR", 30111, maximumLevel.displayName )

        if minimumLeafSize.value:
            if minimumLeafSize.value < 1:
                minimumLeafSize.setIDMessage("ERROR", 30112, minimumLeafSize.displayName)

        if  explanatoryRasters.hasError():

            if "800" in str(explanatoryRasters.message):

                if explanatoryRasters.value:
                    for i in explanatoryRasters.value:
                        val = str(i[1]).upper()

                        if val in ["#", "NONE", "FALSE", "TRUE", "NUMERIC", "CATEGORICAL"]:
                            parameters[6].clearMessage()
                        else:
                            break

        if variablePredict.value is None:
            variablePredict.setIDMessage("ERROR", 530)

        if predictionType.value == "PREDICT_FEATURES":
            if featuresToPredict.value is None:
                featuresToPredict.setIDMessage("ERROR", 530)
            if outputFeatures.value is None:
                outputFeatures.setIDMessage("ERROR", 530)

        expRaster = None
        if predictionType.value == "PREDICT_RASTER":
            if outputRaster.value is None:
                outputRaster.setIDMessage("ERROR", 530)

        if predictionType.value in ["PREDICT_RASTER"]:
            expRaster = explanatoryRasters.value
            if expRaster is None:
                explanatoryRasters.setIDMessage("ERROR", 530)

        explVar = explanatoryVariables.value 
        if explVar:
            repeatedInItself, compareOther = checkRepeated(explVar, 0, variablePredict.value)
            if compareOther is not None:
                explanatoryVariables.setIDMessage("ERROR", 110182, compareOther )

            repeatedInItself, compareOther = checkRepeated(explVar, 0)
            if repeatedInItself is not None:
                explanatoryVariables.setIDMessage("ERROR", 110182, repeatedInItself )

            flds = []
            noFound = []
            if featuresToPredict.value is not None:
                try:
                    outpuf = ARCPY.Describe(featuresToPredict.value)
                    flds = [ f.name.upper()  for f in outpuf.fields]
                except:
                    pass
            if explanatoryVariableMatching.value:
                error = False
                for e in explanatoryVariableMatching.values:
                    e0 = e[0]
                    if hasattr(e[0],"value"):
                        e0 = e[0].value
                    if e0 in ["#", None, ""]:
                        explanatoryVariableMatching.setIDMessage("ERROR", 590, str(e[1]))
                        error = True
                        break

                if len(flds) and not error:
                    for fldinList in explanatoryVariableMatching.values:
                        if fldinList[0] not in ["#", None, ""]:
                            if str(fldinList[0]).upper() not in flds:
                                noFound.append(fldinList[0])
                    if len(noFound):
                        explanatoryVariableMatching.setIDMessage("ERROR", 544, noFound[0] )

        if distanceFeatures.value:
            repeatedInItself, compareOther = checkRepeated(distanceFeatures.value, 0)
            if repeatedInItself is not None:
                distanceFeatures.setIDMessage("ERROR", 110182, repeatedInItself )


        if explanatoryRasters.altered:
            if expRaster:
                repeatedInItself, compareOther = checkRepeated(expRaster, 0)
                if repeatedInItself is not None:
                    explanatoryRasters.setIDMessage("ERROR", 110182, repeatedInItself )

        if percentageForTraining.value == 0:
            if numberCrossValidationIterations.value:
                if numberCrossValidationIterations.value > 1 and  outputCrossValidationTable.enabled:
                    outputCrossValidationTable.setIDMessage("ERROR", 530)
        
        allowBandInVT(explanatoryRastersMatching, outputRaster is not None and predictionType.value == "PREDICT_RASTER" )

        #### Check for Unsupportd Raster Types ####
        rasterNotSupported = isImageService(explanatoryRasters)
        if rasterNotSupported:
            explanatoryRasters.setIDMessage("ERROR", 110213)

        if explanatoryRastersMatching.value is not None:
            rasterNotSupported = isImageService(explanatoryRastersMatching)
            if rasterNotSupported:
                explanatoryRastersMatching.setIDMessage("ERROR", 110213)

        numberVariables = 0
        if explanatoryVariables.value:
            numberVariables += len(explanatoryVariables.values)
        if distanceFeatures.value:
            numberVariables += len(distanceFeatures.values)
        if explanatoryRasters.value:
            numberVariables += len(explanatoryRasters.values)

        isXGB = modelType.value == "GRADIENT_BOOSTED"
        parStr = modelParamSetting.valueAsText
        dictParLabel = {}
        dictLabelPar = {}

        if modelType.value == "FOREST-BASED":
            dictParLabel = { p:l for p, l in zip(self.listAvailableRF, modelParamSetting.filters[0].list)}
            dictLabelPar = { l:p for p, l in zip(self.listAvailableRF, modelParamSetting.filters[0].list)}
        else:
            dictParLabel = { p:l for p, l in zip(self.listAvailableXGB, modelParamSetting.filters[0].list)}
            dictLabelPar = { l:p for p, l in zip(self.listAvailableXGB, modelParamSetting.filters[0].list)}
            isXGB =  True

        if isXGB:
            if learningRate.value == 0:
                learningRate.setIDMessage("ERROR", 531)
            if maxBins.value is not None and (maxBins.value < 0 or maxBins.value == 1):
                maxBins.setIDMessage("ERROR", 110529)

        if optimize.value:
            if modelParamSetting.value is None:
                modelParamSetting.setIDMessage("ERROR", 530)

            if optimizeAlgorithm.value in ["RANDOM","RANDOM_ROBUST"]:
                if numSearch.value is None:
                    numSearch.setIDMessage("ERROR", 530)
                elif numSearch.value <= 0:
                    numSearch.setIDMessage("ERROR", 531)
            allowLowZero = 1
            doNotAllowLowZero = 0
            exceptOne = -1

            keyValues = {  "NUM_TREES":(int,doNotAllowLowZero,None),
                            "MAX_DEPTH":(int,doNotAllowLowZero, None), 
                            "LEAF_SIZE":(int,doNotAllowLowZero, None),
                            "SAMPLE_SIZE":(int,doNotAllowLowZero, 100),
                            "RANDOM_VARIABLES":(int, doNotAllowLowZero, None),
                            "ETA":(float,doNotAllowLowZero, 1),
                            "REG_LAMBDA":(float,allowLowZero, None),
                            "GAMMA":(float,allowLowZero, None),
                            "MAX_BINS":(int,exceptOne, None)}
            if modelParamSetting.value is None:
                return
            
            values = modelParamSetting.value

            inval= []
            invalValueFor = []
            zeroError = []
            lowerError = []
            intvError = []
            intvTryVar = False
            skipValues = []
            fillValues = []
            exceedMax = []
            noRange = None
            nIt = 0

            def dif(low, high, intv):
                md = (high - low)%intv
                if NUM.isclose(md, intv):
                    value = False
                else:
                    value = md > 0
                return value

            def rangeValues(key, low,high,intv):
                ran = []
                skipValue =  None
                if dif(low,high,intv):
                    ran = NUM.arange(low,high,intv)
                else:
                    ran =  NUM.arange(low,high+intv,intv)

                if len(ran) and ran[-1] > high:
                    if not  NUM.isclose(ran[-1], high):
                        ran = ran[:-1]

                if key == "MAX_BINS":
                    msk = ran == 1
                    skipValue = NUM.sum(msk)
                    ran = ran[~(msk)]
                return ran, skipValue

            keys = []
            for value in values:
                if value[0] is not [None, "", "#"]:
                    keys.append(str(value[0]))

            unique, counts = NUM.unique(keys, return_counts=True)

            if len(unique):
                if (counts>1).sum() >= 1:
                    lis = unique[counts>1]
                    modelParamSetting.setIDMessage("ERROR", 110536, ", ".join(lis.tolist()))

            for value in values:
                key = value[0]
                if key not in dictParLabel:
                    if key not in dictLabelPar:
                        modelParamSetting.setIDMessage("ERROR", 800," | ".join([v for v in dictLabelPar])  )
                        break

                if key in ["MAX_DEPTH", dictParLabel["MAX_DEPTH"]]:
                    cleanDepthWarning = True

                low1 = value[1]
                high1 = value[2]
                intv1 = value[3]
                goodValues = True

                if key in [None, "#", ""]:
                    fillValues.append(key)
                    continue
                try:
                    if low1 not in ["", "#"]:
                        low1 = UTILS.strToFloat(low1)
                    else:
                        goodValues = False
                    if high1 not in ["", "#"]:
                        high1 = UTILS.strToFloat(high1)
                    else:
                        goodValues = False
                    if intv1 not in ["", "#"]:
                        intv1 = UTILS.strToFloat(intv1)
                    else:
                        goodValues = False
                except:
                    invalValueFor.append(key)
                    continue
                
                if not goodValues:
                    invalValueFor.append(key)
                    continue

                low, high, intv = list(map(keyValues[key][0],[low1, high1, intv1]))

                if keyValues[key][0] == int:
                    if (low1-low) > 0:
                        intvError.append(key)
                        continue

                if not keyValues[key][1]:
                    if low <= 0 or high <= 0  or intv <= 0:
                        zeroError.append(key)
                        continue
                else:
                    if low < 0 or high <= 0  or intv <= 0:
                        zeroError.append(key)
                        continue

                if keyValues[key][2] is not None:
                    if keyValues[key][0] == int:
                        if low1 < 1  or high1 < 1 or intv1 < 1:
                            noRange = key
                            continue

                    if high1 > keyValues[key][2]:
                        exceedMax.append(key)
                        continue

                if low > high:
                    lowerError.append(key)
                    continue
                if (low == high and intv > 0)  or  (high - low) < intv:
                    intvError.append(key)
                    continue

                nv, skipValue = rangeValues(key, low, high, intv)

                if skipValue is not None and skipValue > 0:
                    skipValues.append((key,skipValue))

                if key == "RANDOM_VARIABLES":
                    if NUM.max(nv) > numberVariables:
                        intvTryVar = True
                nIt += len(nv)

            if cleanDepthWarning:
                maximumLevel.clearMessage()
                
            if len(skipValues):
                modelParamSetting.setIDMessage("WARNING", 110534)

            if noRange:
                modelParamSetting.setIDMessage("ERROR", 854, 1, 100) 

            if len(exceedMax):
                modelParamSetting.setIDMessage("ERROR", 110533, ", ".join(exceedMax))

            if intvTryVar:
                modelParamSetting.setIDMessage("ERROR", 110530, numberVariables)

            if len(fillValues):
                modelParamSetting.setIDMessage("ERROR", 110531, ", ".join(fillValues)) 

            if len(inval):
                modelParamSetting.setIDMessage("ERROR", 556, ",".join(inval))

            if len(invalValueFor):
                modelParamSetting.setIDMessage("ERROR", 192, ",".join(invalValueFor)) 

            if len(zeroError):
                modelParamSetting.setIDMessage("ERROR", 110531,  ", ".join(zeroError)) 

            if len(lowerError):
                modelParamSetting.setIDMessage("ERROR", 110532, ",".join(lowerError))

            if len(intvError):
                modelParamSetting.setIDMessage("ERROR", 110531, ",".join(intvError))

            if optimizeAlgorithm.value in ["RANDOM", "RANDOM_ROBUST"]:
                if numSearch.value:
                    if numSearch.value > nIt:
                        numSearch.setIDMessage("ERROR", 110535, nIt ) 

        else:
            numSearch.value = None
            modelParamSetting.value = None
            outputParamTunningTable.value = None
            optimizeTarget.value = None
            optimizeAlgorithm.value = None



