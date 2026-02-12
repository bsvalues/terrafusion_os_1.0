# coding: utf-8
"""
Source Name:   SSRates.py
Version:       ArcGIS  PRO 3.3
Author:        Environmental Systems Research Institute Inc.
Description:   Calculate Rates tool script.
"""

from math import e
import os as OS
import arcpy as ARCPY
import arcgisscripting as ARC
import SSUtilities as UTILS
import numpy as NUM
import SSDataObject as SSDO
import SSUtilities as UTILS
import WeightsUtilities as WU
import arcpy.management as DM
import Stats as STATS
from numpy.core.numeric import ones
import scipy.spatial as SCPS
import locale as LOCALE
import SSReclassifyField as SSRF
import SSHelperFunctions as SSHF
import re as REGEX

LOCALE.setlocale(LOCALE.LC_ALL, '')

supportedSpatialRelation = {1: 'FIXED_DISTANCE',
                            2: 'K_NEAREST_NEIGHBORS',
                            3: 'DELAUNAY_TRIANGULATION',
                            4: 'CONTIGUITY_EDGES_ONLY',
                            5: 'CONTIGUITY_EDGES_CORNERS',
                            8: 'GET_SPATIAL_WEIGHTS_FROM_FILE'}

supportedWeightSchema = {'UNWEIGHTED': 0,
                         'BISQUARE': 1,
                         'GAUSSIAN': 2}

typesThatNeedFamily = ["GLOBAL_EMPIRICAL_BAYES", "LOCAL_EMPIRICAL_BAYES"]
typesThatNeedSpace = ["LOCALLY_WEIGHTED_AVERAGE", "LOCALLY_WEIGHTED_MEDIAN", "LOCAL_EMPIRICAL_BAYES"]

supportedRateTypes = {"CRUDE_RATE": 0,
                      "GLOBAL_EMPIRICAL_BAYES": 1, 
                      "LOCAL_EMPIRICAL_BAYES": 2,
                      "LOCALLY_WEIGHTED_AVERAGE": 3, 
                      "LOCALLY_WEIGHTED_MEDIAN": 4}

MAX_NUM_NEIGHS = 1000


rateTypeLabel = {"CRUDE_RATE": ARCPY.GetIDMessage(220827),
                "GLOBAL_EMPIRICAL_BAYES": ARCPY.GetIDMessage(220822), 
                "LOCAL_EMPIRICAL_BAYES": ARCPY.GetIDMessage(220823),
                "LOCALLY_WEIGHTED_AVERAGE": ARCPY.GetIDMessage(220824), 
                "LOCALLY_WEIGHTED_MEDIAN": ARCPY.GetIDMessage(220825)}

RateText = ARCPY.GetIDMessage(220826) + " {}: " #Rate {}:
    
baseRateField = "R{}"
baseRateAlias = RateText + "{} {}" #Rate {}: {} {}
perText = ARCPY.GetIDMessage(220836).replace("%1","{}")
baseRateAliasPer = baseRateAlias +" "+ perText #Rate {}: {} {} per {}
    
crudeRateField = "R{}_cr"
crudeRateAlias = RateText+ ARCPY.GetIDMessage(220827) #Rate {}: Crude Rate

excessRateField = "R{}_xs"
excessRateAlias = RateText+ ARCPY.GetIDMessage(220828) #Rate {}: Excess Rate
 
standardizedRateField = "R{}_sd"
standardizedRateAlias = RateText+ ARCPY.GetIDMessage(220829) #Rate {}: Standardized Rate
    
confidenceLowField = "R{}_l95"
confidenceLowAlias = RateText+ ARCPY.GetIDMessage(220830) #Rate {}: Confidence Interval - lower 95%

confidenceHighField = "R{}_u95"
confidenceHighAlias = RateText+ ARCPY.GetIDMessage(220831) #Rate {}: Confidence Interval - upper 95%
    
numberNonNullNeighField = "R{}_nn"
numberNonNullNeighAlias = RateText+ ARCPY.GetIDMessage(220832) #Rate {}: Number of non-null neighbors
    
fillMissingValuesField = "R{}_fmv"
fillMissingValuesAlias = RateText+ ARCPY.GetIDMessage(220833) #Rate {}: Fill Missing Value
    
reliableField = "R{}_rel"
reliableAlias = RateText+ ARCPY.GetIDMessage(220834) #Rate {}: Reliable

cimBreaks = {}

def globalRatesCoincidentPointChecker(ssdo):
    try:
        maxCoin = ssdo.counts.max()
        if maxCoin >= MAX_NUM_NEIGHS or maxCoin == ssdo.numObs:
            ARCPY.AddIDMessage("ERROR", 110246, str(maxCoin), str(ssdo.numObs))
            raise SystemExit()
    except:
        return
        



def executeRates(parameters, messages):
    ARCPY.env.overwriteOutput = True

    #### Input Info ####
    inputFC = UTILS.getInputAppendParameter(0, parameters)


    fieldInfo = [(row[0], row[1]) for row in parameters[1].value]
    countFields = []
    popFields = []
    for value in fieldInfo:
        #### Count Field In First Column ####
        countName = value[0]
        if hasattr(value[0],"value"):
            countName = value[0].value
        countFields.append(str(countName).upper())

        #### Pop Field In Second Column ####
        popName = value[1]
        if hasattr(value[1],"value"):
            popName = value[1].value
        popFields.append(str(popName).upper())

    uniqueCountFields = CalculateRates.getUniqueFieldNames(countFields)
    uniquePopFields = CalculateRates.getUniqueFieldNames(popFields)
    analysisFields = list(set(uniqueCountFields + uniquePopFields))

    ### Setup Output ###
    appendToInput = parameters[2].value
    outputFC = None
    if not appendToInput:
        outputFC = UTILS.getTextParameter(3, parameters)

    #### Rate Info ####
    rateType = UTILS.getTextParameter(4, parameters).upper()
    family = None
    if rateType in typesThatNeedFamily:
        family = UTILS.getTextParameter(5, parameters).upper()
        
        ####TODO: Implement AUTO family.  Defaults now to Binomial ####
        if family == "AUTO":
            family = "BINOMIAL"

    #### Spatial Info ####
    wType = None
    threshold = None 
    weightsFile = None
    numNeighs = None
    weightSchema = 'UNWEIGHTED'
    kernelBand = None
    if rateType in typesThatNeedSpace:
        spaceConcept = UTILS.getTextParameter(6, parameters)

        #### Check Advanced License for Delaunay ####
        #if spaceConcept == 'DELAUNAY_TRIANGULATION':
        #    if not checkLicense():
        #        ARCPY.AddIDMessage("ERROR", 110463)
        #        raise SystemExit

        if spaceConcept == 'DISTANCE_BAND':
            spaceConcept = 'FIXED_DISTANCE'

        elif spaceConcept == 'NUMBER_OF_NEIGHBORS':
            spaceConcept = 'K_NEAREST_NEIGHBORS'

        try:
            wType = WU.weightDispatch[spaceConcept]
        except:
            ARCPY.AddIDMessage("Error", 723)
            raise SystemExit()

        if wType == 1:
            #### Distance Band ####
            threshold = UTILS.getTextParameter(7, parameters)

        if wType == 2:
            #### KNN ####
            numNeighs = UTILS.getNumericParameter(8, parameters)

        if wType == 8:
            #### SWM ####
            weightsFile = UTILS.getTextParameter(9, parameters)

        if wType in [1,2]:
            #### Kernel (Distance-Based Types) ####
            weightSchema = UTILS.getTextParameter(10, parameters)

            if weightSchema in ['BISQUARE', 'GAUSSIAN']:
                kernelBand = UTILS.getTextParameter(11, parameters)

    aliasMap = CalculateRates.GetAliasMap(inputFC, countFields, popFields)

    #### Apply Exec New Field Checker ####
    if outputFC is not None:
        check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields = analysisFields, 
                                                 weightsFile = weightsFile)

    #### Create SSDO ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC)
    outPath = None
    shapeOut = None
    if appendToInput:
        outPath = ssdo.inPath
        baseType = ARCPY.Describe(inputFC).DataType
        shapeOut = UTILS.isShapeFile(ssdo.catPath)
    elif outputFC is not None:
        outPath, outName = OS.path.split(outputFC.lower())
        baseType = ARCPY.Describe(outPath).DataType
        shapeOut = UTILS.isShapeFile(outputFC)
            

    masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)
    ssdo.obtainData(masterField, analysisFields, minNumObs = 3 if rateType in typesThatNeedSpace else 1, useNullinFields = analysisFields)


    #### Global Coincident Point Checker for All Except SWM ####
    #### Max Coincident <= Num Features and Max Num Neighs (1000) ####
    if wType != 8:
        globalRatesCoincidentPointChecker(ssdo)

    #### Make Sure the Number of Neighbors is less Than the Total Number of Features ####
    if numNeighs is not None:
        maxCoin = ssdo.counts.max()
        if numNeighs >= ssdo.numObs:
            ARCPY.AddIDMessage("ERROR", 110265)
            raise SystemExit()
        elif maxCoin >= numNeighs:
            ARCPY.AddIDMessage("ERROR", 110286, str(maxCoin), str(numNeighs))
            raise SystemExit()

    #### Core Class ####
    cr = CalculateRates(ssdo, countFields, popFields, rateType = rateType, family = family, 
                        wType = wType, threshold = threshold, numNeighs = numNeighs, weightsFile = weightsFile,
                            weightSchema = weightSchema, kernelBand = kernelBand)
    
    rateMultiplier = UTILS.getNumericParameter(12, parameters)
    
    #### Symbology Selection #### 
    #### Left open for expansion, funciton for calcSymBreaks ####
    #### Must return the symbology breaks and labels ####
    symSelection = "STANDARD_NON_OUTLIER"
    if symSelection == "STANDARD_NON_OUTLIER":
        calcSymBreaks = stdDevWithoutOutliers

    if rateType in typesThatNeedSpace:
        if wType == 1:
            NeighborHoodTableHeader = ("{} - {}".format(ARCPY.GetIDMessage(84746) , cr.distanceBandStr if cr.distanceBand is not None else "")).strip()
        elif wType == 2:
            NeighborHoodTableHeader = "{} - {}".format(ARCPY.GetIDMessage(84747), numNeighs)
        elif wType == 3:
            NeighborHoodTableHeader = ARCPY.GetIDMessage(220837) #Delaunay Triangulation 
        elif wType == 4:
            NeighborHoodTableHeader = ARCPY.GetIDMessage(84748)
        elif wType == 5:
            NeighborHoodTableHeader = ARCPY.GetIDMessage(84749)
        else:
            NeighborHoodTableHeader = ARCPY.GetIDMessage(220838) #Spatial Weights File 

    candidateFields = {}
    fieldOrder = []
    existingFields = []
    if outputFC is None:
        existingFields = list(ssdo.allFields.keys())
    else:
        existingFields = list(analysisFields)


   
    global cimBreaks
    cimBreaks = {}

    outputNumber = CalculateRates.getLowestStartingOutputNumber(existingFields)
    outputLayerNumber = 0
    nullVal = -2147483648
    groupLayerNames = []

    for name in cr.getResultsKeys():
        rates, excessRate, stdRate, fillVal, numNeighs, low95, upper95, reliable, crudeRates = cr.returnOutputFields(name)

        if rateMultiplier:
            rates = rates*rateMultiplier
            if low95 is not None:
                low95 = low95*rateMultiplier
            if upper95 is not None:
                upper95 = upper95*rateMultiplier
            if crudeRates is not None:
                crudeRates = crudeRates*rateMultiplier
            
            
        #### Rates ####

        ratesFieldName = CalculateRates.GenerateUniqueFieldName(baseType, baseRateField.format(outputNumber), outPath, existingFields) 
        existingFields.append(ratesFieldName)
        ratesAlias = baseRateAliasPer.format(outputNumber,rateTypeLabel[rateType.upper()], aliasMap[name] if name in aliasMap else name, rateMultiplier) if rateMultiplier and rateMultiplier !=1 else baseRateAlias.format(outputNumber,rateTypeLabel[rateType.upper()], aliasMap[name] if name in aliasMap else name)
        candidateFields[ratesFieldName] = SSDO.CandidateField(ratesFieldName, type="DOUBLE",data= rates, alias=ratesAlias, checkNullValues=True) 
        
        if not appendToInput:
            cimBreaks["R{}".format(outputLayerNumber)] = []
            cimBreaks["R{}".format(outputLayerNumber)].append(rateTypeLabel[rateType])  #Title
            cimBreaks["R{}".format(outputLayerNumber)].append(ratesFieldName) #Field
            h = calcSymBreaks(rates)
            cimBreaks["R{}".format(outputLayerNumber)].append(h[0]) #Breaks
            cimBreaks["R{}".format(outputLayerNumber)].append(h[1]) #Labels
             
        if shapeOut:
            groupLayerNames.append(ratesFieldName)
        else:
            groupLayerNames.append(ratesAlias)

        #### Crude Rates ####
        if crudeRates is not None:
            fieldName = CalculateRates.GenerateUniqueFieldName(baseType, crudeRateField.format(outputNumber), outPath, existingFields) 
            existingFields.append(fieldName)
            candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="DOUBLE",data= crudeRates, alias=crudeRateAlias.format(outputNumber), checkNullValues=True) 

        if not appendToInput:
            #### Excess Risk ####
            fieldName = CalculateRates.GenerateUniqueFieldName(baseType, excessRateField.format(outputNumber), outPath, existingFields) 
            existingFields.append(fieldName)
            candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="DOUBLE",data= excessRate, alias=excessRateAlias.format(outputNumber), checkNullValues=True) 


            #### Standard Risk ####
            fieldName = CalculateRates.GenerateUniqueFieldName(baseType, standardizedRateField.format(outputNumber), outPath, existingFields) 
            existingFields.append(fieldName)
            candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="DOUBLE",data= stdRate, alias=standardizedRateAlias.format(outputNumber), checkNullValues=True) 

            #### Confidence Interval Lower 95 ####
            if low95 is not None:
                fieldName = CalculateRates.GenerateUniqueFieldName(baseType, confidenceLowField.format(outputNumber), outPath, existingFields) 
                existingFields.append(fieldName)
                candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="DOUBLE",data= low95, alias=confidenceLowAlias.format(outputNumber), checkNullValues=True) 

            #### Confidence Interval Upper 95 ####
            if upper95 is not None:
                fieldName = CalculateRates.GenerateUniqueFieldName(baseType, confidenceHighField.format(outputNumber), outPath, existingFields) 
                existingFields.append(fieldName)
                candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="DOUBLE",data= upper95, alias=confidenceHighAlias.format(outputNumber), checkNullValues=True)

            #### Number of Non-null Neighbors ####
            if numNeighs is not None:
                fieldName = CalculateRates.GenerateUniqueFieldName(baseType, numberNonNullNeighField.format(outputNumber), outPath, existingFields) 
                existingFields.append(fieldName)
                numNeighs[NUM.isnan(numNeighs)] = nullVal
                numNeighs = NUM.asarray(numNeighs, dtype = NUM.int32)

                candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="Integer",data= numNeighs, alias=numberNonNullNeighAlias.format(outputNumber), checkNullValues=True, int_min_as_null=nullVal) 
                
            #### Produced Rate is Filled Value ####
            if fillVal is not None:
                fieldName = CalculateRates.GenerateUniqueFieldName(baseType, fillMissingValuesField.format(outputNumber), outPath, existingFields) 
                existingFields.append(fieldName)

                fillVal = NUM.asarray(fillVal, dtype = '<U5')
                candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="TEXT",data= fillVal, alias=fillMissingValuesAlias.format(outputNumber), checkNullValues=True) 

            if reliable is not None:
                #### Rate Reliability ####
                fieldName = CalculateRates.GenerateUniqueFieldName(baseType, reliableField.format(outputNumber), outPath, existingFields) 
                existingFields.append(fieldName)
                candidateFields[fieldName] = SSDO.CandidateField(fieldName, type="DOUBLE",data= reliable, alias=reliableAlias.format(outputNumber), checkNullValues=True, int_min_as_null=nullVal) 
            
        
        #### Generate Output Tables ####
        nonNullRates = rates[~NUM.isnan(rates)]
        nullRates = rates[NUM.isnan(rates)]
        footnote = None
        minPower = FormatSymLabelBaseOnValue(nonNullRates.min(), returnPower = True)
        if crudeRates is not None:
            nonNullcrudeRates = crudeRates[~NUM.isnan(crudeRates)]
            nullcrudeRates = crudeRates[NUM.isnan(crudeRates)]
            crudePower = FormatSymLabelBaseOnValue(nonNullcrudeRates.min(), returnPower = True)
            rows = [["", rateTypeLabel[rateType.upper()],rateTypeLabel["CRUDE_RATE"]],
                    [ARCPY.GetIDMessage(84412), FormatSymLabelBaseOnValue(nonNullRates.min(),minPower), FormatSymLabelBaseOnValue(nonNullcrudeRates.min(),crudePower)],
                    [ARCPY.GetIDMessage(84413), FormatSymLabelBaseOnValue(nonNullRates.max(),minPower), FormatSymLabelBaseOnValue(nonNullcrudeRates.max(),crudePower)],
                    [ARCPY.GetIDMessage(84414), FormatSymLabelBaseOnValue(NUM.median(nonNullRates),minPower), FormatSymLabelBaseOnValue(NUM.median(nonNullcrudeRates),crudePower)],
                    [ARCPY.GetIDMessage(84261), FormatSymLabelBaseOnValue(NUM.mean(nonNullRates),minPower), FormatSymLabelBaseOnValue(NUM.mean(nonNullcrudeRates),crudePower)],
                    [ARCPY.GetIDMessage(220051), FormatSymLabelBaseOnValue(NUM.std(nonNullRates,ddof=1),minPower), FormatSymLabelBaseOnValue(NUM.std(nonNullcrudeRates,ddof=1),crudePower)],
                    [ARCPY.GetIDMessage(220839), len(nullRates), len(nullcrudeRates)]] #Features with Null Rate Value
            
            if fillVal is not None:
                    rows.append([ARCPY.GetIDMessage(220840)+"*", len(fillVal[fillVal == "True"]), "-"])  #Features with Filled Values
                    footnote = ["*" + ARCPY.GetIDMessage(220841)] #Features where the input values were null and a rate was imputed based on neighborhood rates.
                    
            rows.append([ARCPY.GetIDMessage(220842), len(rates), len(crudeRates)]) #Total Features
        else:
            rows = [["",rateTypeLabel[rateType.upper()]],
                    [ARCPY.GetIDMessage(84412), FormatSymLabelBaseOnValue(nonNullRates.min(),minPower)],        #Minimum
                    [ARCPY.GetIDMessage(84413), FormatSymLabelBaseOnValue(nonNullRates.max(),minPower)],        #Maximum
                    [ARCPY.GetIDMessage(84414), FormatSymLabelBaseOnValue(NUM.median(nonNullRates),minPower)],  #Median
                    [ARCPY.GetIDMessage(84261), FormatSymLabelBaseOnValue(NUM.mean(nonNullRates),minPower)],    #Mean
                    [ARCPY.GetIDMessage(220051), FormatSymLabelBaseOnValue(NUM.std(nonNullRates,ddof=1),minPower)],    #Std Dev
                    [ARCPY.GetIDMessage(220839), len(nullRates)]]                                          #Features with Null Rate Value
            if fillVal is not None:
                    rows.append([ARCPY.GetIDMessage(220840)+"*", len(fillVal[fillVal == "True"]), "-"])#Features with Filled Values
                    footnote = ["*" + ARCPY.GetIDMessage(220841)]#Features where the input values were null and a rate was imputed based on neighborhood rates.
            
            rows.append([ARCPY.GetIDMessage(220842), len(rates)])            #Total Features

        tables=[]
        tables.append(UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                      header= ARCPY.GetIDMessage(220843), #Summary of Rates
                                      pad=1, colPad=3,
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      emphasizeHeadRow=True,
                                      returnHTMLMsg=True, footnote=footnote))
            

        if numNeighs is not None:
            nonNullNeighs = numNeighs[numNeighs!=nullVal]
            nonNullNeighs = nonNullNeighs[~NUM.isnan(nonNullNeighs)]
            rows = [["", NeighborHoodTableHeader],
                    [ARCPY.GetIDMessage(84412), nonNullNeighs.min()],                                   #Minimum
                    [ARCPY.GetIDMessage(84413), nonNullNeighs.max()],                                   #Maximum
                    [ARCPY.GetIDMessage(84261), UTILS.formatValue(NUM.mean(nonNullNeighs), UTILS.getPerfectFormatDecimal(NUM.mean(nonNullNeighs), 3, 0, returnFormatStr=True))],    #Mean
                    [ARCPY.GetIDMessage(84414), UTILS.formatValue(NUM.median(nonNullNeighs), UTILS.getPerfectFormatDecimal(NUM.median(nonNullNeighs), 3, 0, returnFormatStr=True))],  #Median
                    [ARCPY.GetIDMessage(220844), len(nonNullNeighs[nonNullNeighs==1])]]               #Features Without Neighbors
            tables.append(UTILS.outputTextTable(rows, justify=['left'] + ['right'] * (len(rows[0]) - 1),
                                      header= ARCPY.GetIDMessage(220845) , pad=1, colPad=3,   #Summary of Neighborhood Counts
                                      titleFillToken="-",
                                      emptyFillToken="-",
                                      emphasizeHeadRow=True,
                                      returnHTMLMsg=True))

        accordion = UTILS.outputAccordion(tables, title= ratesFieldName if shapeOut else ratesAlias, titleLevel=5,
                                          expand=outputNumber==1, titleFillToken="*")
        ARCPY.AddMessage(accordion)
        

        outputNumber += 1
        outputLayerNumber += 1


    if outputFC is None:
        cimBreaks = {}
        ssdo.addFields2FC(candidateFields)
        cimBreaks = {}
    else:
        ssdo.output2NewFC(outputFC,candidateFields, appendFields=analysisFields)
        
        if UTILS.hasActiveMap() and not ssdo.isTable:
            if ssdo.shapeType.upper() == "POINT":
                lyrx = "Rates_Point.lyrx"
            elif ssdo.shapeType.upper() == "POLYGON":
                lyrx = "Rates_Poly.lyrx"
            else:
                lyrx = "Rates_Lines.lyrx"
           
            layers = []
            for ind, name in enumerate(cr.getResultsKeys()):
                layerName = groupLayerNames[ind]
                outLayer = DM.MakeFeatureLayer(outputFC, layerName)
                key = "R{}".format(ind)
                if key in cimBreaks and len(cimBreaks[key])>=3 and cimBreaks[key][2] is not None:
                    outLayer = DM.ApplySymbologyFromLayer(outLayer, OS.path.join(UTILS.pathLayers, lyrx))

                layers.append(outLayer)
            
            outputName = OS.path.basename(outputFC)
            if outputName.lower().endswith(".shp"):
                outputName = outputName[: -4]
            groupLayerResult = ARCPY.gp.MakeGroupLayer(outputName, layers)
            groupLayer = groupLayerResult.getOutput(0)
            ARCPY.SetParameter(14, groupLayer)
        else:
            cimbreaks = {}

def FormatSymLabelBaseOnValue(value, power = None, returnPower = False):
    scientific = "{0:.{1:d}e}".format(value, 2)
    if not power:
        power = int(scientific.split('e')[1])
        if power >= 0:
            power = 3
        else:
            power = abs(power)+1
            
    if returnPower:
        return power
    decimalFormating = "%."+str(power)+"f"
    return UTILS.formatValue(value, decimalFormating)

            




def stdDevWithoutOutliers(rates):
    if rates is None:
        return None, None

    nonNullRates = rates[~NUM.isnan(rates)]
    if len(nonNullRates) == 0:
        return None, None
    
    try:

        rfQuant = SSRF.ReclassifyField(4,"QUANTILE", nonNullRates)
        rfQuant.processClasses(None)
        rfQuant.applyClasses(True, printTable=False)
        rfQuantClasses = rfQuant.classes

        if len(rfQuantClasses)>= 4:
            IQR = rfQuantClasses[3][0] - rfQuantClasses[0][1]
            if IQR <0:
                return None, None
            
            nonOutlierRates = nonNullRates[nonNullRates <= rfQuantClasses[3][0] + 1.5*IQR]
            nonOutlierRates = nonOutlierRates[nonOutlierRates >= rfQuantClasses[0][1] - 1.5*IQR]
        else:
            nonOutlierRates = nonNullRates

        

        stdRates = NUM.std(nonOutlierRates)
        meanRates = NUM.mean(nonOutlierRates)
        
        stdDevs = NUM.array([-3.5,-2.5,-1.5,-0.5,0.5,1.5,2.5,3.5])*stdRates+meanRates
        
        if stdDevs[0] > nonNullRates.min():
            stdDevs[0] =  nonNullRates.min()
        if stdDevs[len(stdDevs)-1] < nonNullRates.max():
            stdDevs[len(stdDevs)-1] = nonNullRates.max()
        
        power = FormatSymLabelBaseOnValue(stdDevs[0], returnPower=True)

        classes = []
        labels = []
        stdDevText = ARCPY.GetIDMessage(84262) # "Std. Dev
        
        maxDev = -2.5
        for ind, val in enumerate(stdDevs):
            if(ind == 0):
                continue
            classes.append([stdDevs[ind-1], stdDevs[ind]])
            
            minText = FormatSymLabelBaseOnValue( stdDevs[ind-1],power)
            maxText = FormatSymLabelBaseOnValue( stdDevs[ind], power)
            
            if ind ==1:
                firstLabel = "< {} {}".format(maxDev, stdDevText)
            elif ind == len(stdDevs)-1:
                firstLabel = "> {} {}".format(maxDev-1, stdDevText)
            else:
                firstLabel = "{} - {} {}".format(maxDev -1, maxDev, stdDevText)
            
            if ind == len(stdDevs)-1:
                secondLabel = " (> {})".format(minText)
            elif stdDevs[ind] <= 0 and stdDevs[ind-1] <= 0 :
                secondLabel = ""
            elif stdDevs[ind-1] <= 0 or ind == 1:
                secondLabel = " (< {})".format(maxText)
            else:
                secondLabel = " ({} - {})".format(minText, maxText)
                

            labels.append(firstLabel + secondLabel)
            maxDev +=1
        
        
        

        return NUM.array(classes, dtype=float), labels        

    except :
        return None, None
   
def postExecute(parameters):
    
    outputFC = UTILS.getTextParameter(3, parameters)
    global cimBreaks


    if cimBreaks:
        project = ARCPY.mp.ArcGISProject('CURRENT')
        mapObj = project.activeMap
        
        layers2Delete = []
        layerMainName = OS.path.basename(outputFC)
        isSHP = layerMainName.lower().endswith(".shp")
        if isSHP:
            layerMainName = layerMainName[0: -4]
        
        layerNames = mapObj.listLayers(layerMainName)
        mainOutputFound = False
        for layer in layerNames:
            if not layer.isGroupLayer:
                mainOutputFound = True
                layers2Delete.append(layer)
        if not mainOutputFound:  # Try to find in ModelBuilder GroupLayer
            layerNames = mapObj.listLayers(f"*:{layerMainName}")
            for layer in layerNames:
                if not layer.isGroupLayer:
                    layers2Delete.append(layer)
        try:
            #### Remove Empty Group Layer ####
            for layer in mapObj.listLayers(UTILS.getTextParameter(14, parameters)):
                if layer.isGroupLayer:
                    layerList = layer.listLayers()
                    if not len(layerList):
                        layers2Delete.append(layer)
                    else: 
                        rateType = UTILS.getTextParameter(4, parameters).upper()
                    
                        lyrNum = 0
                        for lyr in layerList:

                            g = cimBreaks["R{}".format(lyrNum)]
                            if g is None:
                                continue
                            symbologyRendererName = g[0]
                            classes = g[2]
                            labels = g[3]
                            newMinimum = classes[0][0]
                            newBreaks = [x[1] for x in classes]
                        
                            # #### Get CIM to Change Properties ####
                            cim = lyr.getDefinition('V3')

                            cim.visibility = True
                            # lyr.setDefinition(cim)
                            cim.renderer.heading = symbologyRendererName
                            cim.renderer.defaultLabel = ARCPY.GetIDMessage(220846) #Null
                            cim.renderer.minimumBreak = classes[0][0]
                            cim.renderer.field = g[1] 
                            prevMin = classes[0][0]                   
                        
                        
                            for ind in range(len(cim.renderer.breaks)):

                                cim.renderer.breaks[ind].upperBound = newBreaks[ind]
                                cim.renderer.breaks[ind].label = labels[ind]


                            if lyrNum == 0:
                                cim.expanded = True
                                cim.visibility = True
                            else:
                                cim.expanded = False
                                cim.visibility = False
                            lyr.setDefinition(cim)

                            lyrNum+=1
        finally:
            for layer in layers2Delete:
                mapObj.removeLayer(layer)
    
    cimBreaks ={}

class KDNeighborSearch(object):
    """cKDTree specific for use in the Neighborhood Summary Statistics Class."""

    def __init__(self, ssdo, concept = "EUCLIDEAN"):
        self.ssdo = ssdo

        if concept.upper() == "MANHATTAN":
            self.p = 1
            self.concept = concept.upper()
        else:
            self.p = 2
            self.concept = "EUCLIDEAN"

        self.numLocations = self.ssdo.numObs

        self.hasZ = False
        if self.ssdo.useChordal:
            self.coords = self.ssdo.spheroidCoords
        else:
            #### Uncomment If When We Want To Honor Z Coords ####
            #if self.ssdo.zCoords is not None:
            #    self.hasZ = True
            #    self.coords = NUM.empty((self.numLocations, 3), dtype = float)
            #    self.coords[:,0:2] = self.ssdo.xyCoords
            #    self.coords[:,-1] = self.ssdo.zCoords
            #else:
            self.coords = self.ssdo.xyCoords

        self.kdTree = SCPS.cKDTree(self.coords)

    def setKNN(self, numNeighs):
        self.numNeighs = numNeighs
        self.k = numNeighs + 1
        self.getNeighbors = self.__getKNNSpatial

    def __getKNNSpatial(self, orderID, useMax = False):
        coordinates = self.coords[orderID]
        if useMax:
            info = self.kdTree.query(coordinates, k = MAX_NUM_NEIGHS, p = self.p)
        else:
            info = self.kdTree.query(coordinates, k = self.k, p = self.p)

        neighs = info[1]
        w = NUM.where(NUM.array(info[1]) == orderID)
        if not len(w[0]):
            #### self not in neighbors, coincident point ####
            neighs[0] = orderID
            index = 0
        else:
            index = w[0][0]

        return index, neighs

    def setDistance(self, distanceBand):
        self.distanceBand = distanceBand
        self.getNeighbors = self.__getDistanceSpatial

    def __getDistanceSpatial(self, orderID):
        coordinates = self.coords[orderID]
        neighs = self.kdTree.query_ball_point(coordinates, 
                                              r = self.distanceBand, 
                                              p = self.p,) 

        if len(neighs) >= MAX_NUM_NEIGHS:
            return self.__getKNNSpatial(orderID, useMax = True)

        else:
            index = NUM.where(NUM.array(neighs) == orderID)[0][0]
            return index, NUM.asarray(neighs, dtype = NUM.int32)

    def createThresholdDist(self, silentWarning = True):
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84144), 0, self.numLocations, 1)
        threshold = 0.0
        sumDist = 0.0 
        for orderID in range(self.numLocations):
            coord = self.coords[orderID]
            distances, ids = self.kdTree.query(coord, k = 2, p = self.p)
            maxDist = distances[-1]
            if maxDist > threshold:
                threshold = maxDist
            sumDist += maxDist

            ARCPY.SetProgressorPosition()

        #### Increase For Rounding Error ####
        threshold = threshold * 1.0001
        avgDist = sumDist / self.numLocations

        #### Add Linear/Angular Units ####
        if not silentWarning:
            thresholdStr = self.ssdo.distanceInfo.printDistance(threshold)
            ARCPY.AddIDMessage("Warning", 853, thresholdStr)

        #### Chordal Default Check ####
        if self.ssdo.useChordal:
            hardMaxExtent = ARC._ss.get_max_gcs_distance(self.ssdo.spatialRef)
            if threshold > hardMaxExtent:
                ARCPY.AddIDMessage("ERROR", 1609)
                raise SystemExit()

        return threshold, avgDist

class CalculateRates(object):
    """
    This class provides the functions used for the tool Calculate Rates
    """

    def __init__(self, ssdo, countFields, popFields, rateType = "CRUDE_RATE", family = None,
                 wType = 2, threshold = None, numNeighs = None, weightsFile = None, 
                 weightSchema = 'UNWEIGHTED', kernelBand = None):
        cimInfo ={}
        UTILS.assignClassAttr(self, locals())

        #### Assure Pop Fields is of Same Length as Counts ####
        #### Will Append 1st Pop Field Over and Over Again ####
        while len(self.countFields) > len(self.popFields):
            self.popFields.append(self.popFields[0])

        self.uniqueCountFields = CalculateRates.getUniqueFieldNames(self.countFields)
        self.uniquePopFields = CalculateRates.getUniqueFieldNames(self.popFields)
        self.varNames = self.uniqueCountFields + self.uniquePopFields

        #### Set Default Family ####
        if self.rateType in typesThatNeedFamily and self.family is None:
            self.family = "POISSON"

        self.varDim = len(self.countFields)

        self.ignoreNulls = True

        #### Set Rate Function Pointer ####
        self.rateTypeInt = supportedRateTypes[rateType.upper()]
        if self.rateTypeInt in [0,1]:
            self.__calculate_rates = self.__calculate_rates_global
            if self.rateTypeInt == 0:
                self.__calculate_rate = self.__calculate_rate_crude
            else:
                self.__calculate_rate = self.__calculate_rate_eb_global
        else:
            self.__calculate_rates = self.__calculate_rates_local
            if self.rateTypeInt == 2:
                self.__calculate_rate = self.__calculate_rate_eb_local
            elif self.rateTypeInt == 3:
                self.__calculate_rate = self.__calculate_rate_avg_local
            else:
                self.__calculate_rate = self.__calculate_rate_med_local

            #### Set Neighborhood Type Int ####
            if self.wType not in supportedSpatialRelation:
                ARCPY.AddIDMessage("ERROR", 723)
                raise SystemExit()

        #### Only Use Euclidean ####
        self.concept = "euclidean"

        #### Set Weighting Schema ####
        if self.wType not in [1, 2, 3]:
            self.weightSchema = 0
        else:
            if weightSchema.upper() not in supportedWeightSchema:
                ARCPY.AddIDMessage("ERROR",110552,weightSchema.upper()) ####The Local Weight Schema {} is not supported.####
                raise SystemExit()
            self.weightSchema = supportedWeightSchema[weightSchema.upper()]
        self.isUnweighted = self.weightSchema == 0

        #### Assign Weights File Info ####
        self.weightsFile = weightsFile
        self.swmFileBool = False
        if weightsFile:
            weightSuffix = weightsFile.split(".")[-1].lower()
            self.swmFileBool = (weightSuffix == "swm")

        self.numObs = self.ssdo.numObs
        #### Prepare Data ####
        self.__prepare_data()
        

        for ind, val in enumerate(self.countFields):
            popField = self.popFields[ind]
            counts = self.counts[:,ind]
            pops = self.pops[:,ind]
            rates = counts/pops       
            nonNullRate = rates[~NUM.isnan(rates)]    

            if self.rateType in typesThatNeedSpace and len(nonNullRate) < 3:
                ARCPY.AddIDMessage("ERROR", 641, 3)
                raise SystemExit()
            if self.rateType not in typesThatNeedSpace and len(nonNullRate) < 1:
                ARCPY.AddIDMessage("ERROR", 641, 1)
                raise SystemExit()
                
            if self.rateType in typesThatNeedFamily and self.family.upper() == "BINOMIAL":
                if NUM.any(rates > 1):
                    ARCPY.AddIDMessage("ERROR", 110556, val, popField)
                    raise SystemExit()
            

        if self.rateTypeInt not in [0,1]:
            if self.ssdo.isTable:
                ARCPY.AddIDMessage("ERROR",110553,rateType.upper())  ####Rate Type {} not supported for Input Tables####
                raise SystemExit()

            if ssdo.useChordal:
                #### Chordal Distance XYZ ###
                self.coordinates = ssdo.spheroidCoords
            else:
                self.coordinates = ssdo.xyCoords
            
            #### Create KDTree Neighbor Search Class for KNN or Fixed Distance ####
            self.neighSearch = None
            if self.wType in [1,2]:
                self.neighSearch = KDNeighborSearch(self.ssdo)
            
            #### Set Linear Unit Info ####
            self.threshold = threshold
            self.kernelBand = kernelBand
            self.__setLinearUnitInfo()


            #### Finalize KDTree Search Info/Method ####
            if self.wType == 1:
                self.neighSearch.setDistance(self.distanceBand)
            if self.wType == 2:
                #### Check Number of Neighbors Parameter ####
                self.numNeighs = WU.getValidNumNeighs(self.numNeighs, self.ssdo.numObs, self.wType)
                self.numNeighs = min(self.numNeighs, MAX_NUM_NEIGHS)
                self.neighSearch.setKNN(self.numNeighs)

        #### Create Results Array ####
        self.resultBlockSize = 1

        #### Multi output for each Count, Population combo ####
        #### 0) Rate ####
        #### 1) Excess Rate, i.e. Rate/Average of all produced Rates ####
        #### 2) Standard Rate, i.e. (Rate - Average of all produced Rates)/Standard Deviation of all produced rates ####
        #### 3) Filled Mising value, i.e. Crude Rate is null, but calculated rate isn't ####
        #### 4) # of non-null neighbors, including self (only for local methods) ####
        #### 5) 95% Confidece Interval - Lower (Crude Rate only) ####
        #### 6) 95% Confidece Interval - Upper (Crude Rate only) ####
        #### 7) Reliability (Crude Rate only) ####
        #### 8) Crude Rate (included as extra if Rate Type is not Crude)####
        self.results = {}
        for varInd, countName in enumerate(self.countFields):
            popName = self.popFields[varInd]
            resultName = CalculateRates.genFieldKey(countName, popName)
            self.results[resultName] = NUM.zeros((self.numObs, 9), dtype=float)*NUM.nan

        self.resultNNeighbors = NUM.zeros((self.numObs, self.varDim), dtype=NUM.int32)

        #### Keep Track of Bad Records ####
        self.badRecords = set([])
        self.beyondBandRecords = set([])
        self.filledRecords = set([])

        #### Calculate Rates ####
        self.__calculate_rates()
        
        if rateType in [2,3,4]:
            #### Run Crude Rate Calc for non global methods ####
            self.__calculate_rates_global()

        self.__calculateAdditionalOutputs()

        #### Report Distance Larger than Band Records ####
        self.__reportBeyondBandwidthRecords()

        #### Calculate and Report Features w/ NULL Outputs ####
        self.__identifyNullRecords()

        #### Check Filled Rates ####
        self.__checkFilledValues()

    def getResultsKeys(self):
        return self.results.keys()

    def returnOutputFields(self, field):
        #### Return generated rates, if crude rate is null for focal feature, and number of neighbors used in smoothing
        if field not in self.results.keys():
            return None, None, None, None, None, None, None, None

        FilledMissingText = self.results[field][:,3].ravel()
        FilledMissingText = NUM.array(["False" if NUM.isnan(x) or x==0 else "True" for x in FilledMissingText])
        
        Rates =  self.results[field][:,0].ravel()
        ExcessRates = self.results[field][:,1].ravel()
        StandardRates = self.results[field][:,2].ravel()
        FMV = FilledMissingText if self.rateTypeInt in [3,4] else None
        NumOfNeigh = self.results[field][:,4].ravel()if self.rateTypeInt in [2,3,4] else None
        Low95 = self.results[field][:,5].ravel() if self.rateTypeInt in [0] else None
        High95 = self.results[field][:,6].ravel() if self.rateTypeInt in [0] else None
        Reliability = self.results[field][:,7].ravel() if self.rateTypeInt in [0] else None
        CrudeRates = self.results[field][:,8].ravel() if self.rateTypeInt not in [0] else None
        
        return (Rates,ExcessRates,StandardRates,FMV,NumOfNeigh,Low95,High95,Reliability, CrudeRates)
        


    def __reportBeyondBandwidthRecords(self):
        """Report Distance Larger than Band Records."""

        numBad = len(self.beyondBandRecords)
        if numBad:
            #### Sort and Report Records with Zero Weights Because Dist >= Bandwidth ####
            uniqueField = "SOURCE_ID"
            sortBad = NUM.sort([ self.ssdo.order2Master[i] for i in self.beyondBandRecords ])
            firstBad = [str(i) for i in sortBad[0:30]]
            firstBad = ", ".join(firstBad)
            ARCPY.AddIDMessage("WARNING", 110382, numBad, self.ssdo.numObs)
            ARCPY.AddIDMessage("WARNING", 110383, uniqueField, firstBad)

    def __identifyNullRecords(self):
        """Calculate and Report Features w/ NULL Outputs."""

        for orderID in range(self.ssdo.numObs):
            for varInd, countName in enumerate(self.countFields):
                popName = self.popFields[varInd]    
                resultName = CalculateRates.genFieldKey(countName, popName)
                #### Check Calculated Rate, index 0, for nulls ####
                if NUM.isnan(self.results[resultName][orderID][0]).sum() > 0:   
                    self.badRecords.add(orderID)

        #### Report Bad Records ####
        numBad = len(self.badRecords)
        if numBad:
            if self.wType == 8:
                uniqueField = self.ssdo.masterField
            else:
                #### Likely Have to Add Whether to Append To Input ####
                #### Use OID Name ####
                uniqueField = "SOURCE_ID"

            #### Sort and Report Records with NULL Values ####
            sortBad = NUM.sort([ self.ssdo.order2Master[i] for i in self.badRecords ])
            firstBad = [str(i) for i in sortBad[0:30]]
            firstBad = ", ".join(firstBad)
            ARCPY.AddIDMessage("WARNING", 110550, numBad, self.ssdo.numObs)
            ARCPY.AddIDMessage("WARNING", 110551, uniqueField, firstBad)
    
    def __checkFilledValues(self):
        """Identify Filled Values for Locally Weighted Average or Locally Weighted Median"""
        if self.rateTypeInt not in [3,4]:
            return
        
        for orderID in range(self.ssdo.numObs):
            for countPopCombo in self.results.keys():
                if not NUM.isnan(self.results[countPopCombo][orderID][3]) and self.results[countPopCombo][orderID][3]:
                    self.filledRecords.add(orderID)
        
        if len(self.filledRecords) > 0:
            if self.wType == 8:
                uniqueField = self.ssdo.masterField
            else:
                #### Likely Have to Add Whether to Append To Input ####
                #### Use OID Name ####
                uniqueField = "SOURCE_ID"

            sortBad = NUM.sort([ self.ssdo.order2Master[i] for i in self.filledRecords ])
            firstBad = [str(i) for i in sortBad[0:30]]
            firstBad = ", ".join(firstBad)
            ARCPY.AddIDMessage("WARNING", 110554, uniqueField, firstBad)

    def __assignLinearUnitInfo(self, linearUnit, overwriteLinearUnit = None):
        """Assigns Linear Unit Information."""

        ssdo = self.ssdo
        inputUnitName = ssdo.distanceInfo.name
        isFloat = UTILS.isNumeric(linearUnit)

        if overwriteLinearUnit is not None:
            #### When Overwrite is Called the linearUnit is always a float (empty/default) ####
            info = ssdo.distanceInfo.getUserLinearUnitInfo(overwriteLinearUnit)
            linearValue, overwriteUnitName = info
            userValue = ssdo.distanceInfo.convertInputLinearUnit(linearValue, overwriteUnitName)
            return linearUnit, inputUnitName, userValue, overwriteUnitName

        if isFloat:
            #### Input/User Linear Unit all in Output Coord System ####
            return linearUnit, inputUnitName, linearUnit, inputUnitName

        else:
            #### Linear Unit Passed In ####
            info = ssdo.distanceInfo.getUserLinearUnitInfo(linearUnit)
            linearValue, userUnitName = info
            userValue = ssdo.distanceInfo.convertInputLinearUnit(linearValue, userUnitName)

            return linearValue, inputUnitName, userValue, userUnitName

    def __setLinearUnitInfo(self):
        """Assigns Linear Unit Information."""

        ssdo = self.ssdo
        bothDefault = self.threshold is None and self.kernelBand is None
        threshDefault = self.threshold is None
        bandwidthDefault = self.kernelBand is None
        self.distanceBand = None
        self.bandwidth = None
        if self.wType == 1:
            if self.isUnweighted:
                #### Fixed Distance - No Bandwidth ####
                if threshDefault:
                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                info = self.__assignLinearUnitInfo(self.threshold)
                self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
            else:
                #### Fixed Distance - Using Bandwidth ####

                if bothDefault:
                    #### Both Defaults - Data Generated Floats in Output Coord Linear Units (Report Both) ####
                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                    self.kernelBand = STATS.spatialBandwidth(self.coordinates)
                    info = self.__assignLinearUnitInfo(self.kernelBand)

                if threshDefault and not bandwidthDefault:
                    #### Bandwidth Given - Distance Band Default (Report Distance Band in Bandwidth Units) ####
                    info = self.__assignLinearUnitInfo(self.kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(self.threshold, overwriteLinearUnit = self.kernelBand)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                if bandwidthDefault and not threshDefault:
                    #### Distance Band Given - Bandwidth Default (Report Bandwidth in Distance Band Units) ####
                    self.threshold, avgDist = self.neighSearch.createThresholdDist()
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                    self.kernelBand = STATS.spatialBandwidth(self.coordinates)
                    info = self.__assignLinearUnitInfo(self.kernelBand, self.threshold)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

                if not threshDefault and not bandwidthDefault:
                    #### Distance Band and Kerenl Bandwidth Given by User (Don't Report) ####
                    info = self.__assignLinearUnitInfo(self.threshold)
                    self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

                    info = self.__assignLinearUnitInfo(self.kernelBand)
                    self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

        if self.wType in [2,3] and not self.isUnweighted:
            if bandwidthDefault:
                self.kernelBand = STATS.spatialBandwidth(self.coordinates)
            info = self.__assignLinearUnitInfo(self.kernelBand)
            self.bandwidth, self.bandwidthUnit, self.userBandwidth, self.userBandwidthUnit = info

        #### Check/Set Output Distance Band Linear Unit Info ####
        if self.distanceBand is not None:

            #### Assures that the Threshold is Appropriate ####
            threshold, maxSet = WU.checkDistanceThreshold(ssdo, self.distanceBand, weightType=self.wType)

            #### If the Threshold is Set to the Max ####
            #### Set to Zero for Script Logic ####
            if maxSet:
                #### All Locations are Related ####
                if self.numObs > 500:
                    ARCPY.AddIDMessage("Warning", 717)

            if threshold != self.distanceBand:
                #### Recreate Distance Band Info ####
                info = self.__assignLinearUnitInfo(threshold, self.userDistanceBandUnit)
                self.distanceBand, self.distanceBandUnit, self.userDistanceBand, self.userDistanceBandUnit = info

            #### Create and Report Default Threshold String ####
            self.distanceBandStr = ssdo.distanceInfo.createOutputLinearUnit(self.distanceBand, self.userDistanceBandUnit)
            if threshDefault:
                ARCPY.AddIDMessage("WARNING", 110362, self.distanceBandStr)

        #### Set Output Linear Unit Strings ####
        if self.bandwidth is not None:
            self.bandwidthStr = ssdo.distanceInfo.createOutputLinearUnit(self.bandwidth, self.userBandwidthUnit)
            if bandwidthDefault:
                ARCPY.AddIDMessage("WARNING", 110363, self.bandwidthStr)

    def __prepare_data(self):
        self.counts = NUM.zeros((self.numObs, self.varDim), dtype=float)
        self.pops = NUM.zeros((self.numObs, self.varDim), dtype=float)
        for ind, countName in enumerate(self.countFields):
            field = self.ssdo.fields[countName]
            pop = self.ssdo.fields[self.popFields[ind]]
            self.counts[:, ind] = field.returnDouble(replaceNullInts = True)
            self.pops[:, ind] = pop.returnDouble(replaceNullInts = True)

        self.counts[self.counts<0] = NUM.nan
        self.pops[self.pops<=0] = NUM.nan

        #### Set Attributes ####
        self.master2Order = self.ssdo.master2Order

    def __calculate_rates_local(self):
        """
        Constructs the neighborhood structure for each feature and
        dispatches the appropriate values for the calculation of the
        statistic.
        Returns
        -------

        """
        ssdo = self.ssdo
        if self.weightsFile:

            #### Open Spatial Weights and Obtain Chars ####
            swm = WU.SWMReader(self.weightsFile)
            N = swm.numObs
            rowStandard = swm.rowStandard

            #### Check to Assure Complete Set of Weights ####
            if ssdo.numObs > N:
                ARCPY.AddIDMessage("ERROR", 842, ssdo.numObs, N)
                raise SystemExit()
                
            #### Check if Selection Set ####
            isSubSet = False
            if ssdo.numObs < N:
                isSubSet = True
            iterVals = UTILS.ssRange(N)

            for i in iterVals:
                #### Using SWM File ####
                info = swm.swm.readEntry()
                masterID, nn, nhsTemp, weightsTemp, sumUnstandard = info
                if masterID in ssdo.master2Order:
                    if nn > 0:
                        nhs = [masterID] + nhsTemp.tolist()
                        if swm.rowStandard:
                            weights = [1.0] + [j * sumUnstandard[0] for j in weightsTemp]
                        else:
                            weights = [1.0] + weightsTemp.tolist()
                    else:
                        nhs = [masterID]
                        weights = [1.0]
                    weights = NUM.array(weights) 
                    weights = weights/weights.sum()
                    includeIt = True
                else:
                    includeIt = False

                #### Subset Boolean for SWM File ####
                if includeIt:
                    #### Parse Row Info ####
                    orderID = ssdo.master2Order[masterID]
                    nhs = [ssdo.master2Order[nh] for nh in nhs]

                    #### Assure Neighbors Exist After Selection ####
                    nn = len(nhs)

                    if nn:
                        #### Calculate Local Stats ####
                        countValues = self.counts[nhs]
                        popValues = self.pops[nhs]
                        index = 0
                        self.__local_calculation(index, orderID, countValues, popValues, weights)

                    ARCPY.SetProgressorPosition()

            if self.swmFileBool:
                swm.close()
            ARCPY.ResetProgressor()

        ### Clipped Delaunay Triangulation ###
        elif self.wType == 3:
            #### Check/Warn/Report/Map Coincident Points ####
            numCoincident = self.ssdo.numObs - self.ssdo.numUnique

            if numCoincident:
                #### Warning ####
                coinSum = (self.ssdo.counts != 1).sum()
                ARCPY.AddIDMessage("WARNING", 110124, str(coinSum), str(self.ssdo.numObs))

                #### Report ####
                ARCPY.AddMessage(self.ssdo.createCoincidentReport())

                #### Get Coincident Point Mapping ####
                coinKeys, coinMap = STATS.mapFromUniqueCounts(self.ssdo.xyCoords, 
                                                              self.ssdo.counts)

                #### Pass In Unique XY Only ####

            else:
                coinKeys = None
                coinMap = None

            #### Get Neighborhood ####
            trimDel = ARC._ss.delaunay_point_neighbors(self.ssdo.xyCoords, 
                                                       self.ssdo.spatialRef,
                                                       coinKeys, coinMap)

            #### Check/Add for No Neighs ####
            trimDel = WU.addNoNeighs2Delaunay(self.ssdo.xyCoords, self.ssdo.uniqueXY,
                                              trimDel)

            #### Find Fixed Distance Neighbors ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84756), 
                                0, self.ssdo.numObs, 1)

            for orderID in UTILS.ssRange(self.ssdo.numObs):
                nhs = trimDel[orderID]
                nhs = [orderID] + [n for n in nhs]
                #### Focal Feature is first in list ####
                index = 0
                countValues = self.counts[nhs]
                popValues = self.pops[nhs]
                weights = NUM.ones(len(nhs), dtype=float)/len(nhs)
                self.__local_calculation(index, orderID, countValues, popValues, weights)

        ### Contiguity ###
        elif self.wType in [4, 5]:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84129))
            #### Polygon Contiguity ####
            if self.wType == 4:
                contiguityType = "ROOK"
            else:
                contiguityType = "QUEEN"
            clearExtentPolyNeighs = UTILS.clearExtent(WU.polygonNeighborDict)
            contDict = clearExtentPolyNeighs(self.ssdo.inputFC, self.ssdo.masterField,
                                             contiguityType=contiguityType)

            ARCPY.ResetProgressor()
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220835), 0, len(self.master2Order), 1)
            for masterID in self.master2Order.keys():
                orderID, yiVal, nhIDs, nhVals, weights = WU.getWeightsValuesCont(masterID, self.master2Order,
                                                                                 contDict, self.counts,
                                                                                 rowStandard=False)

                #### Calculate Local Stats ####
                nhs = [orderID] + nhIDs
                #### Focal Feature is first in list ####
                index = 0
                countValues = self.counts[nhs]
                popValues = self.pops[nhs]
                weights = NUM.ones(len(nhs), dtype = float)/len(nhs)
                self.__local_calculation(index, orderID, countValues, popValues, weights)

                ARCPY.SetProgressorPosition()
            ARCPY.ResetProgressor()

        else:
            #### Fixed Distance or KNN Using KD Tree ####
            ARCPY.SetProgressor("step", ARCPY.GetIDMessage(220835), 0, self.numObs, 1)
            for orderID in range(self.numObs):
                #### Neighbor Info ####
                index, nhIDs = self.neighSearch.getNeighbors(orderID)

                #### Calculate Local Stats ####
                nhs = nhIDs
                countValues = self.counts[nhs]
                popValues = self.pops[nhs]
                if self.weightSchema != 0:
                    weights = self.__genLocalWeights(orderID, nhIDs=nhs)
                else:
                    weights = NUM.ones(len(nhs), dtype = float)
                
                weights = weights/len(weights)
                self.__local_calculation(index, orderID, countValues, popValues, weights)

                ARCPY.SetProgressorPosition()

    def __genLocalWeights(self, targetID, nhIDs):
        weights = NUM.full(len(nhIDs), 1.0, dtype=float)

        if self.weightSchema == 0:
            return weights
        elif self.weightSchema == 1:
            #### BISQUARE ####
            for ind, nhId in enumerate(nhIDs):
                dist = self.__dist(targetID, nhId)
                if dist < self.bandwidth:
                    weights[ind] = (1 - (dist / self.bandwidth) ** 2) ** 2
                else:
                    self.beyondBandRecords.add(targetID)
                    weights[ind] = 0

        elif self.weightSchema == 2:
            #### GAUSSIAN ####
            for ind, nhId in enumerate(nhIDs):
                dist = self.__dist(targetID, nhId)
                weights[ind] = NUM.exp(-0.5 * ((dist / self.bandwidth) ** 2.0))

        return weights

    def __dist(self, id1, id2):
        return ((self.coordinates[id1] - self.coordinates[id2]) ** 2).sum() ** 0.5

    def __local_calculation(self, index, orderID, countValues, popValues, weights):
        #### Get Number of Neighs, Fields and NaN Info ####
        numNeighs, numAttrs, nanInfo, hasNans, zeroWeights = self.__setNumNeighStats(orderID, countValues, popValues, weights)


        for ind_var in range(numAttrs):
            resultName = CalculateRates.genFieldKey(self.countFields[ind_var], self.popFields[ind_var])
            
            #### Index may have updated on previous loop, reset it ####
            indexForThisOutput = index           

            #### Return All Nulls for Given Field if No Valid Weights ####
            if zeroWeights[ind_var]:
                self.results[resultName][orderID] = NUM.nan
                return 

            if not self.ignoreNulls and hasNans[ind_var]:
                self.results[resultName][orderID] = NUM.nan
                return 

            self.results[resultName][orderID][4] = self.resultNNeighbors[orderID][0]

            #### Get Valid Values ####
            countVals = countValues[:, ind_var]
            popVals = popValues[:, ind_var]
            varWeights = weights

            #### For Local Empirical Bayes, Check to see if focal feature is null ####
            if  NUM.logical_or(NUM.logical_or(NUM.isnan(countVals[indexForThisOutput]), NUM.isnan(popVals[indexForThisOutput])), popVals[indexForThisOutput] == 0):
                #### Focal Feature Crude Rate is Null ####
                self.results[resultName][orderID][8] = NUM.nan
                self.results[resultName][orderID][3] = True
                
                if self.rateTypeInt == 2:
                    self.results[resultName][orderID][3] = False
                    self.results[resultName][orderID][0] = NUM.nan
                    return
            else:
                self.results[resultName][orderID][3] = False
                self.results[resultName][orderID][8] = countVals[indexForThisOutput]/popVals[indexForThisOutput]
            

            if hasNans[ind_var]:
                goodValues = ~nanInfo[ind_var]
                newIndWhere = NUM.where(NUM.array(range(len(countVals)))[goodValues]==indexForThisOutput)[0]
                
                #### Correction for new index after list filtering ### 
                #### If previous index did not persist after filtering, reset to first in list #### 
                if len(newIndWhere):
                    indexForThisOutput = newIndWhere[0]
                else:
                    indexForThisOutput = 0 

                countVals = countVals[goodValues]
                popVals = popVals[goodValues]
                varWeights = weights[goodValues]
                
            if len(countVals) == 1:
                self.results[resultName][orderID][0] = countVals[0]/popVals[0] 
            else:
                self.results[resultName][orderID][0] = self.__calculate_rate(indexForThisOutput, countVals, popVals, varWeights)
           
            #### Value Filled if self was null and produced rate is not ####
            self.results[resultName][orderID][3] = self.results[resultName][orderID][3] and ~NUM.isnan(self.results[resultName][orderID][0])

    def __calculate_rates_global(self):
        #### Get Number of Neighs, Fields and NaN Info ####
        numNeighs = self.counts.shape[0]
        numAttrs = self.counts.shape[1]
        nanInfo = {}
        hasNans = NUM.zeros(numAttrs, dtype = bool)
        zeroWeights = NUM.zeros(numAttrs, dtype = bool)
        for i in range(numAttrs):
            isNan = NUM.logical_or(NUM.logical_or(NUM.isnan(self.counts[:, i]), NUM.isnan(self.pops[:, i])), self.pops[:,i]<=0)
            nanInfo[i] = isNan
            numNans = isNan.sum()
            hasNans[i] = numNans > 0


        for ind_var in range(numAttrs):

            #### Get Valid Values ####
            countVals = self.counts[:, ind_var]
            popVals = self.pops[:, ind_var]
            goodValues = NUM.ones(numNeighs, dtype=bool)
            if hasNans[ind_var]:
                goodValues = ~nanInfo[ind_var]
                countVals = countVals[goodValues]
                popVals = popVals[goodValues]

            resultName = CalculateRates.genFieldKey(self.countFields[ind_var], self.popFields[ind_var])
            self.results[resultName][goodValues,0] = self.__calculate_rate(countVals, popVals)
                
            if self.rateTypeInt == 1:
                self.results[resultName][goodValues,8] = self.__calculate_rate_crude(countVals, popVals)


    def __setNumNeighStats(self, orderID, countValues, popValues, weights):
        """Assesses attribute value NULLs and valid weight info."""

        numNeighs = countValues.shape[0]
        numAttrs = countValues.shape[1]
        nanInfo = {}
        hasNans = NUM.zeros(numAttrs, dtype = bool)
        zeroWeights = NUM.zeros(numAttrs, dtype = bool)
        for i in range(numAttrs):
            isNan = NUM.logical_or(NUM.logical_or(NUM.isnan(countValues[:, i]), NUM.isnan(popValues[:, i])), popValues[:,i]<=0)
            nanInfo[i] = isNan
            numNans = isNan.sum()
            hasNans[i] = numNans > 0

            subsetWeights = weights[~isNan]
            noValidRecords = len(subsetWeights) == 0
            if not noValidRecords:
                noValidRecords = UTILS.compareFloat(0.0, subsetWeights.sum())
            if noValidRecords:
                #### Not Valid Weights ####
                self.resultNNeighbors[orderID, i] = 0
                zeroWeights[i] = True
            else:
                if self.ignoreNulls:
                    self.resultNNeighbors[orderID, i] = numNeighs - numNans
                else:
                    self.resultNNeighbors[orderID, i] = numNeighs

        return numNeighs, numAttrs, nanInfo, hasNans, zeroWeights


    def __calculate_rate_crude(self, counts, pops):
        return counts / pops

    def __calculate_rate_eb_global(self, counts, pops):
        eb = STATS.EmpiricalBayesRates(counts, pops, family = self.family)
        return eb.getEstimatedRate()

    def __calculate_rate_eb_local(self, index, counts, pops, weights):
        if self.isUnweighted:
            eb = STATS.EmpiricalBayesRates(counts, pops, family = self.family)
        else:
            eb = STATS.EmpiricalBayesRates(counts, pops, weights = weights, family = self.family)

        rates = eb.getEstimatedRate()

        return rates[index]

    def __calculate_rate_avg_local(self, index, counts, pops, weights):
        return ((counts / pops) * weights).sum() / weights.sum()
    
    def __calculate_rate_med_local(self, index, counts, pops, weights):
        return STATS.median(counts / pops, weights)


    def __calculateAdditionalOutputs(self):
        #### Called after Rates have been made ####
        #### Will produce Excess Rate, Standard Rate, Confidence Intervals, and Reliability ####
        for ind, key in enumerate(self.results):
            rates = self.results[key][:,0].ravel()
            nonNullRatesInd = ~NUM.isnan(rates)
            
            rates = rates[nonNullRatesInd]
            counts = self.counts[nonNullRatesInd,ind]
            pops = self.pops[nonNullRatesInd,ind]
            
            #### Excess Rate ####
            self.results[key][nonNullRatesInd,1] = rates/rates.mean() if rates.mean() != 0 else None
            
            #### Standard Rate ####
            self.results[key][nonNullRatesInd,2] = (rates - rates.mean())/NUM.std(rates,ddof=1) if NUM.std(rates,ddof=1) != 0 else None

            if self.rateTypeInt == 0:

                #### Confidence Intervals (Crude Rate) ####
                low, high = self.__calculate_crude_confidenceInterval(counts, pops)
                
                self.results[key][nonNullRatesInd,5] = low.ravel()
                self.results[key][nonNullRatesInd,6] = high.ravel()
                
                #### Reliability (Crude Rate) ####
                self.results[key][nonNullRatesInd,7] = self.__reliabilityOfRates(counts).ravel()
            

    def __calculate_crude_confidenceInterval(self, counts, pops):
        import scipy.stats as SCSTATS
        
        r = counts/pops
        interval = 1.96*r/pow(counts,.5)      

        low = r - interval
        high = r + interval

        lowCount = counts < 100
        low[lowCount] = SCSTATS.gamma.ppf(.025, counts[lowCount])/pops[lowCount]
        high[lowCount] = SCSTATS.gamma.ppf(.975, counts[lowCount]+1)/pops[lowCount]

        low[counts == 0] = 0
        
        return [low,high]

    def __reliabilityOfRates(self, counts):
        ret = 100/pow(counts, .5)
        
        ret[ret>100] = 100.0
        return ret

    @staticmethod
    def genFieldKey(countName, popName):
        return "{0} {1}".format(countName.lower(), popName.lower())
    
    @staticmethod
    def GenerateUniqueFieldName(baseType, newName, outPath=None,existingFields=[]):

        if outPath == "in_memory":
            maxLen = 64
        else:
            isShapeFile = baseType.upper() == "FOLDER"
            if isShapeFile:
                maxLen = 10
            else:
                maxLen = 64

        #### Validate Field Names ####
        newName = ARCPY.ValidateFieldName(newName, outPath).upper()[:maxLen]
        origName = newName

        idx = 1
        while newName in existingFields:
            suffix = "_%i" % idx
            lenSuff = len(suffix)
            newName = origName[:(maxLen - lenSuff)] + suffix
            idx += 1

        return newName
    
    @staticmethod
    def getUniqueFieldNames(fieldNames):
        uniqueNames = []
        for i in fieldNames:
            upperName = i.upper()
            if upperName not in uniqueNames:
                uniqueNames.append(upperName)

        return uniqueNames
    

    @staticmethod
    def GetAliasMap(inputFC, countFields, popFields):
        if not ARCPY.Exists(inputFC):
            return {}
        
        aliasMap = {}
        countFields = [x.lower() for x in countFields]
        popFields = [x.lower() for x in popFields]
        for ind, val in enumerate(ARCPY.ListFields(inputFC)):
            if val.name.lower() in countFields or val.name.lower() in popFields:
                aliasMap[val.name.lower()] = val.name.lower()

                try:
                    aliasMap[val.name.lower()] = val.aliasName
                except:
                    continue
        
        nameMap = {}
        for ind, countField in enumerate(countFields):
            popField = popFields[ind]
            nameMap[CalculateRates.genFieldKey(countField, popField)] = CalculateRates.genFieldKey(countField, popField)
            
            try:
                nameMap[CalculateRates.genFieldKey(countField, popField)] = "{0} {1}".format(aliasMap[countField.lower()], aliasMap[popField.lower()])
            except:
                continue
        return nameMap
            

    @staticmethod
    def getLowestStartingOutputNumber(existingFields=[]):
        maxOutputNumber = 0 
        pattern = REGEX.compile(r"^R(\d+)$|^R(\d+)_")
        for ind, val in enumerate(existingFields):
            regMatch = pattern.match(val)
            if regMatch:
                if regMatch.groups()[0] is not None:
                    thisOutputNumber = int(regMatch.groups()[0])
                else:
                    thisOutputNumber = int(regMatch.groups()[1])
                
                if thisOutputNumber > maxOutputNumber:
                    maxOutputNumber = thisOutputNumber
    
        return maxOutputNumber+1


def getOutputFCFields(parameters, outPath, baseType):
        
    try:
        #### Input Info ####
        inputFC = UTILS.getInputAppendParameter(0, parameters)
        if not ARCPY.Exists(inputFC) or outPath is None or baseType is None:
            return []
        

        fieldInfo = [(row[0], row[1]) for row in parameters[1].value]
        countFields = []
        popFields = []
        for value in fieldInfo:
            #### Count Field In First Column ####
            countName = value[0]
            if hasattr(value[0],"value"):
                countName = value[0].value
            countFields.append(str(countName).upper())

            #### Pop Field In Second Column ####
            popName = value[1]
            if hasattr(value[1],"value"):
                popName = value[1].value
            popFields.append(str(popName).upper())
        if len(countFields)== 0 or len(popFields) == 0:
            return []

        aliasMap = CalculateRates.GetAliasMap(inputFC, countFields, popFields)

        appendToInput = parameters[2].value

        rateType = UTILS.getTextParameter(4, parameters).upper()
        rateTypeInt = supportedRateTypes[rateType.upper()]

        uniqueCountFields = CalculateRates.getUniqueFieldNames(countFields)
        uniquePopFields = CalculateRates.getUniqueFieldNames(popFields)
        analysisFields = list(set(uniqueCountFields + uniquePopFields))
        
        rateMultiplier = UTILS.getNumericParameter(12, parameters)

        existingFields = ARCPY.ListFields(inputFC)
        
        inParam = parameters[0]
        outParam = parameters[3]
        updatedTableParam = parameters[13]
        uissdo = SSHF.UI_SSDataObject(inParam, updatedTableParam if appendToInput else outParam, "*")


        #### Existing Fields #### 
        appendList = []

        for field in existingFields:
            if appendToInput or  field.name.upper() in analysisFields or field.name.upper() == uissdo.ssdo.oidName:
                x = ARCPY.Field()
                x.name = field.name
                x.aliasName = field.aliasName
                x.type = field.type
                appendList.append(x)

        fieldNames= [x.name for s in appendList]
        lowestOut = CalculateRates.getLowestStartingOutputNumber(fieldNames)

        for x in range(len(countFields)):
            count = countFields[x]
            pop = popFields[x]
            
            name = CalculateRates.genFieldKey(count, pop)
            x = ARCPY.Field()
            x.name = CalculateRates.GenerateUniqueFieldName(baseType, baseRateField.format(lowestOut), outPath, fieldNames) 
            fieldNames.append(x.name)
            x.aliasName = baseRateAliasPer.format(lowestOut,rateTypeLabel[rateType.upper()], aliasMap[name] if name in aliasMap else name, rateMultiplier) if rateMultiplier and rateMultiplier !=1 else baseRateAlias.format(lowestOut,rateTypeLabel[rateType.upper()], aliasMap[name] if name in aliasMap else name)
            x.type = "DOUBLE"
            appendList.append(x)
            
            if rateTypeInt != 0:
                x = ARCPY.Field()
                x.name = CalculateRates.GenerateUniqueFieldName(baseType, crudeRateField.format(lowestOut), outPath, fieldNames) 
                fieldNames.append(x.name)
                x.aliasName = crudeRateAlias.format(lowestOut)
                x.type = "DOUBLE"
                appendList.append(x)

            if not appendToInput:
                x = ARCPY.Field()
                x.name = CalculateRates.GenerateUniqueFieldName(baseType, excessRateField.format(lowestOut), outPath, fieldNames) 
                fieldNames.append(x.name)
                x.aliasName = excessRateAlias.format(lowestOut)
                x.type = "DOUBLE"
                appendList.append(x)
                
                x = ARCPY.Field()
                x.name = CalculateRates.GenerateUniqueFieldName(baseType, standardizedRateField.format(lowestOut), outPath, fieldNames) 
                fieldNames.append(x.name)
                x.aliasName = standardizedRateAlias.format(lowestOut)
                x.type = "DOUBLE"
                appendList.append(x)
    
                if rateTypeInt == 0:
                    x = ARCPY.Field()
                    x.name = CalculateRates.GenerateUniqueFieldName(baseType, confidenceLowField.format(lowestOut), outPath, fieldNames)
                    fieldNames.append(x.name) 
                    x.aliasName = confidenceLowAlias.format(lowestOut)
                    x.type = "DOUBLE"
                    appendList.append(x)

                    x = ARCPY.Field()
                    x.name = CalculateRates.GenerateUniqueFieldName(baseType, confidenceHighField.format(lowestOut), outPath, fieldNames) 
                    fieldNames.append(x.name)
                    x.aliasName = confidenceHighAlias.format(lowestOut)
                    x.type = "DOUBLE"
                    appendList.append(x)
    
                if rateTypeInt in [2,3,4]:
                    x = ARCPY.Field()
                    x.name = CalculateRates.GenerateUniqueFieldName(baseType, numberNonNullNeighField.format(lowestOut), outPath, fieldNames) 
                    fieldNames.append(x.name)
                    x.aliasName = numberNonNullNeighAlias.format(lowestOut)
                    x.type = "Integer"
                    appendList.append(x)
                    
                if rateTypeInt in [3,4]:
                    x = ARCPY.Field()
                    x.name = CalculateRates.GenerateUniqueFieldName(baseType, fillMissingValuesField.format(lowestOut), outPath,fieldNames) 
                    fieldNames.append(x.name)
                    x.aliasName = fillMissingValuesField.format(lowestOut)
                    x.type = "DOUBLE"
                    appendList.append(x)
                
                if rateTypeInt == 0:
                    x = ARCPY.Field()
                    x.name = CalculateRates.GenerateUniqueFieldName(baseType, reliableField.format(lowestOut), outPath, fieldNames) 
                    x.aliasName = reliableAlias.format(lowestOut)
                    x.type = "TEXT"
                    appendList.append(x)
                    
            lowestOut+=1
        
        return appendList
    except Exception as e:
        return []