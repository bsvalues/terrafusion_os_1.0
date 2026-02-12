# coding: utf-8
"""
Tool Name:  Assess Sensitivity to Attribute Uncertainty
Source Name: SSAttributeUncertainty.py
Version: ArcGIS PRO 3.4
Author: ESRI
"""

################### Imports ########################
import os as OS
import sys as SYS
import numpy as NUM
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import scipy.stats as SCPYSTAT
import ErrorUtils as ERROR
import SSDataObject as SSDO
import SSUtilities as UTILS
import locale as LOCALE
import SSHelperFunctions as SSHELPER
import SSDataObject as SSDO
import arcgisscripting as ARC
LOCALE.setlocale(LOCALE.LC_ALL, '')

def getAverageNeighborSpatialAutoCorrelation(ssdo, varNames, justEvaluateSpatialAutoCorrelation = False):
    """Evaluate Spatial Autocorrelation for the given variables
    INPUT:
        ssdo (object) - Object with SSDataObject
        varNames (list/str) - Variable Names

    """
    import MoransI as MI
    numberNeighbors = 8
    if ssdo.shapeType == "Point":
        numberNeighbors = 8
        wTypeLocal = 2
    elif ssdo.shapeType == "Polygon":
        numberNeighbors = 6
        wTypeLocal = 2
    else:
        wTypeLocal = 2
    varName = None

    if type(varNames) == str:
        varName = varNames
    else:
        varName = varNames[0]

    ### Avoid Initialization of methods in the Moran's I  Instance ###
    avoidNormaMIGLobal = True
    #### Run Spatial Autocorrelation ####
    mig = MI.GlobalI(ssdo, varName, wTypeLocal, weightsFile = None,
                concept = 'EUCLIDEAN', rowStandard = "NONE",
                threshold = None, exponent = 2,
                numNeighs = numberNeighbors, enableProgress = False, silentStop = True, sensitivity=avoidNormaMIGLobal)
    
    #### Get the Neighborhood Cache ####
    neighborhoodCache = mig.getNeighborhoodCacheFromKnnUsingKDTree(numberNeighbors)
    if len(neighborhoodCache) == 0:
        ARCPY.AddError("It is not possible to calcualte neighborhoods")
        raise SystemExit

    ### Calculate the Moran's I for the variable ###
    mig.calculateUsingNeighborhoodCache(ssdo.fields[varName.upper()].data, neighborhoodCache)

    if type(varNames) == str:
        if not  hasattr(mig, "gi"):
            if not justEvaluateSpatialAutoCorrelation:
                ARCPY.AddWarning("The Neighborhood Average was not used because the Moran's I could not be calculated.")
            else:
                ARCPY.AddWarning("It is not possible to calculate the Moran's I for the variable {0}".format(ssdo.fields[varName.upper()].alias))
            return None

        if justEvaluateSpatialAutoCorrelation:
            if mig.gi > 0 and mig.pVal <= 0.005:
                ARCPY.AddWarning(fr"The variable {ssdo.fields[varName.upper()].alias} is significantly spatially autocorrelated (Moran's I: {mig.gi}, p-value = {mig.pVal}). Consider using neighborhood averages to produce more robust simulations.")
            return None
        else:
            return  mig.getSmoothY(ssdo.fields[varName.upper()].data, neighborhoodCache)
    else:
        varNamesGIForMessages = {}
        if hasattr(mig, "gi"):
            ARCPY.AddMessage(f"Moran's I for the variable {ssdo.fields[varName.upper()].alias} is {mig.gi} with a p-value of {mig.pVal}")
            if justEvaluateSpatialAutoCorrelation:
                if mig.gi > 0 and mig.pVal <= 0.005:
                    varNamesGIForMessages[varName] = (mig.gi, mig.pVal)
                    mig.gi = None
                    mig.pVal = None

        for varName in varNames[1:]:
            gi, pVal = None, None
            mig.calculateUsingNeighborhoodCache( ssdo.fields[varName.upper()].data, neighborhoodCache)
            if hasattr(mig, "gi") and mig.gi is not None:
                gi, pVal = mig.gi, mig.pVal
                if justEvaluateSpatialAutoCorrelation:
                    if mig.gi > 0 and mig.pVal <= 0.005:
                        varNamesGIForMessages[varName] = (gi, pVal)
                        mig.gi = None
                        mig.pVal = None
            else:
                if justEvaluateSpatialAutoCorrelation:
                    ARCPY.AddWarning("It is not possible to calculate the Moran's I for the variable {0}".format(ssdo.fields[varName.upper()].alias))
                return None

        if len(varNamesGIForMessages):
            info = fr"The variables with significantly values in the Moran's I are: "
            values = []
            for varName, mig in varNamesGIForMessages.items():
                values.append(fr"[{ssdo.fields[varName.upper()].alias} (Moran's I: {mig[0]}, p-value = {mig[1]})]")
            ARCPY.AddWarning(info+ ", ".join(values)+ ". "+ "Consider using neighborhood averages to produce more robust simulations.")

    if justEvaluateSpatialAutoCorrelation:
        return None
    else:
        means = {}
        for varName in varNames:
            mean = mig.getSmoothY(ssdo.fields[varName.upper()].data, neighborhoodCache)
            means[varName] = mean
        return means

def printMessages(toolName, ssdo, parameters, varName, minValue, meanValue, maxValue):

    msg3 = (f"{ARCPY.GetIDMessage(220953)}: {toolName}\n"
            f"{ARCPY.GetIDMessage(220964)}: {varName}\n"
            f"{ARCPY.GetIDMessage(84253)}: {parameters[0].valueAsText}")
    UTILS.outputAccordion([UTILS.outputParagraph(msg3, returnHTMLMsg=True)], title=ARCPY.GetIDMessage(220956)+":")

    method = {"GAUSSIAN":ARCPY.GetIDMessage(220886), "NORMAL": ARCPY.GetIDMessage(220886), "UNIFORM": ARCPY.GetIDMessage(220957), "TRIANGULAR": ARCPY.GetIDMessage(220958)}
    msg4 =  ARCPY.GetIDMessage(220959).format(parameters[8].valueAsText,method[parameters[9].valueAsText])

    header = "NULL"
    rows = []
    footnote = []
    row0 = [ARCPY.GetIDMessage(id) for id in [220273, 220960, 84412, 220437, 220439]]

    rows.append((row0))
    vals = [varName, 
            UTILS.dataTypeLoc[ssdo.allFields[varName].type.upper()], 
            LOCALE.format_string("%0.3f",minValue),
            LOCALE.format_string("%0.3f",meanValue),
            LOCALE.format_string("%0.3f",maxValue)]
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

def addGroupLayer(objectWithSSDO, outputFC,  indexGL, fldName):
    """" Add Group Layer
    INPUT: 
        objectWithSSDO (object) - Object with SSDO
        outputFC (string) - Output Feature Class
        indexGL (int) - Index of the Group Layer
        fldName (string) - Field Name
    """

    import arcpy.management as DM
    import SSSymbology as SSS
    import tempfile as TEMP

    outputName = OS.path.basename(str(outputFC))
    if outputName.lower().endswith(".shp"):
        outputName = outputName[: -4]

    nameInesLyr = ARCPY.GetIDMessage(220893)

    percLyrDic = {"POINT":       "Instability_Points.lyrx",
                  "MULTIPOINT":  "Instability_Points.lyrx",
                  "POLYLINE":     "Instability_Lines.lyrx",
                  "POLYGON":   "Instability_Polygons.lyrx",
                  "MULTIPATCH":"Instability_Polygons.lyrx" }

    if objectWithSSDO.ssdo.shapeType.upper() not in percLyrDic:
        return

    percLyr = percLyrDic[objectWithSSDO.ssdo.shapeType.upper()]
    pathLyrPerc = OS.path.join(OS.path.normpath(UTILS.pathLayers),percLyr)
    tempFolder = OS.path.normpath(TEMP.gettempdir())

    outLayer = DM.MakeFeatureLayer(str(outputFC), nameInesLyr)
    simbBaseUniq = SSS.SymbologyBase("GRADUATED", refFile = pathLyrPerc)
    simbBaseUniq.SetField(fldName, ARCPY.GetIDMessage(220894))
    simbBaseUniq.changeLabelsBreaks({"Fewer than 80%": ARCPY.GetIDMessage(220895), "More than 80%":ARCPY.GetIDMessage(220896)})
    tempFile = OS.path.join(tempFolder,fr"{outputName}_hash.lyrx")
    simbBaseUniq.getFile(tempFile)
    outLayer = DM.ApplySymbologyFromLayer(outLayer,tempFile, update_symbology = "MAINTAIN")
    
    try:
        OS.remove(tempFile)
    except:
        pass

    groupLayerResult = ARCPY.gp.MakeGroupLayer(outputName +"_" + ARCPY.GetIDMessage(220913),[outLayer] )
    groupLayer = groupLayerResult.getOutput(0)
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220625))
    ARCPY.SetParameter(indexGL, groupLayer)

def getFieldNamesFromAliases(inputFC, filter, listAliases):
    """Get the field names from the fields object"""
    try:
        fields = ARCPY.ListFields(inputFC)
    except:
        return []

    fldAliasAndFieldNames = {}
    for fld in fields:
        if fld.type in filter:
            fldAliasAndFieldNames[fld.aliasName] = fld.name
            fldAliasAndFieldNames[fld.name] = fld.name
    lstFld = [fldAliasAndFieldNames[fld] for fld in listAliases if fld in fldAliasAndFieldNames]

    if len(lstFld) != len(listAliases):
        ARCPY.AddError("Field")
        return []
    return lstFld

def allFieldsAndAliases(inputFC ):
    """Get a dictionary of all field names and aliases from the fields object"""
    try:
        fields = ARCPY.ListFields(inputFC)
    except:
        return {}

    fldAliasAndFieldNames = {}
    for fld in fields:
        fldAliasAndFieldNames[fld.aliasName] = fld.name
        fldAliasAndFieldNames[fld.name] = fld.name
    return fldAliasAndFieldNames

def getMetadata(parameters, idResult):
    map = None
    checkLayer = True
    project = None
    try:
        project = ARCPY.mp.ArcGISProject('current')
    except:
        checkLayer = False
        pass
    if project is None:
        checkLayer = False
    else:
        map = project.activeMap
    
    if checkLayer and  map is None:
        checkLayer = False

    layer_metadata = None
    lyrSelected = None

    #### Get Current Layer ####
    if checkLayer and map is not None:
        path, name = OS.path.split(parameters[idResult].valueAsText)
        lyrs = map.listLayers("*"+name)
        lyrParam = parameters[idResult].value

        try:
            n = len(lyrs)
            if n > 0:
                if n == 1:
                    parVal = parameters[idResult].valueAsText
                    if parVal == lyrs[0].name or \
                        (len(parVal) != len(lyrs[0].name) and  parVal.endswith(lyrs[0].name)):
                        lyrSelected = lyrs[0]
                else:
                    for lyr in lyrs:
                        if lyr.URI.upper() == lyrParam.URI.upper():
                            lyrSelected = lyr
                            break
        except:
            pass

    #### Obtain the metadata ####
    try:
        if lyrSelected is not None:
            layer_metadata = lyrSelected.metadata
        else:
            layer_metadata = ARCPY.metadata.Metadata(parameters[idResult].value)
    except:
        ARCPY.AddError("Could not obtain metadata")
        raise SystemExit
    return layer_metadata

def useSameFeaturesToAnalysis(parameters, idResult, idInput, tool_name):
    if tool_name == "SpatialAutocorrelation":
        return
    result = None
    input = None
    if ARCPY.Exists(parameters[idResult].valueAsText):
        result = ARCPY.da.Describe(parameters[idResult].valueAsText)

    if ARCPY.Exists(parameters[idInput].valueAsText):
        input = ARCPY.da.Describe(parameters[idInput].valueAsText)

    if result is None or input is None or "shapeType" not in result  or  "shapeType" not in input \
      or 'Null' in result['shapeType'] or 'Null' in input['shapeType']:
        #### The Analysis Result or Analysis Input is valid. ####
        ARCPY.AddIDMessage("ERROR", 110578 )
        raise SystemExit

    if input["shapeType"] != result["shapeType"]:
        #### The Analysis Result and the Analysis Input have different shape type. ####
        ARCPY.AddIDMessage("ERROR",110597 )
        raise SystemExit

    nFeatureResult =  UTILS.getCount(result["catalogPath"])
    nFeatureInput = UTILS.getCount(parameters[idInput].valueAsText)

    if nFeatureResult != nFeatureInput :
        #### The Analysis Result and the Analysis Input contain different number of features. ####
        ARCPY.AddIDMessage("WARNING", 110594)
        return

    if nFeatureResult == nFeatureInput and input["FIDSet"] is not None:
        checkInputs(parameters, idInput, idResult)
        return

    if input["FIDSet"] is not None and result["FIDSet"] is not None:
        if len(input["FIDSet"]) != len(result["FIDSet"]):
            ### The Analysis Result and the Analysis Input have different features. ####
            ARCPY.AddIDMessage("ERROR", 110595)
            raise SystemExit
        checkInputs(parameters, idInput, idResult)

def checkInputs(parameters, idInput, idResult):
    ssdoInput = SSDO.SSDataObject(parameters[idInput].valueAsText, 
                                silentErrors=True, 
                                displayProjectionWarning=False,
                                useChordal = True)
    ssdoInput.obtainData()
    ssdoResult = SSDO.SSDataObject(parameters[idResult].valueAsText, 
                                silentErrors=True, 
                                displayProjectionWarning=False,
                                useChordal = True,
                                explicitSpatialRef=ssdoInput.spatialRef)
    ssdoResult.obtainData()
    if not NUM.allclose(ssdoInput.xyCoords, ssdoResult.xyCoords):
        ### The Analysis Result and the Analysis Input have different features. ####
        ARCPY.AddIDMessage("ERROR", 110595)
        raise SystemExit

def execute(parameters, messages):
    ### Parameters Index ###
    idResult = 0
    idOutput = 1
    idSimTable = 2
    idInput = 3
    idType = 4
    idMOE = 5
    idConf = 6
    idPct = 7
    idSim = 8
    idSimMethod = 9
    idWS = 10
    idSimLimits = 11
    idMOEConf = 12
    idNeighAvg = 13
    idGL = 14

    layer_metadata = getMetadata(parameters, idResult)

    #### Extract the tool information ####
    root = SSHELPER.XMLFromString(layer_metadata.xml)
    process_elements = root.findall(".//Process[@ToolSource]")
    
    # Extracted elements as string
    extracted_elements = [SSHELPER.XMLToString(elem, encoding='unicode') for elem in process_elements]
    tool_name, datetime_str, latest_FC, analysis_vars, cmd = SSHELPER.extract_tool_info(extracted_elements)
    aliasFieldsDict = allFieldsAndAliases(latest_FC)
    sensitivity = {}
    id = 2
    dataTypeSupported = ["Double","Integer", "Single"]

    #### Parse the parameters ####
    while id < len(parameters):
        if parameters[id].value is not None:
            sensitivity[parameters[id].name] = parameters[id].valueAsText
        else:
            sensitivity[parameters[id].name] = None
        id += 1

    sensitivity["use_neighborhood_average"] = False

    if parameters[idInput].value is None:
        ARCPY.AddIDMessage("ERROR", 4010 ,parameters[idInput].displayName, ARCPY.GetIDMessage(110528))
        raise SystemExit 

    ### Check if the input exists ###
    if not ARCPY.Exists(parameters[idInput].valueAsText):
        #### does not exist ####
        ARCPY.AddIDMessage("ERROR", 110 ,parameters[idInput].valueAsText)
        raise SystemExit 

    def ch(value):
        return None if value == "#" else value
    
    #### Evaluate Selection and Number of Features ####
    useSameFeaturesToAnalysis(parameters, idResult, idInput, tool_name)

    if tool_name == 'HotSpots':
        ### Import Gi module ###
        import Gi as GI

        ### Dictionary to convert the values from the tool signature to the values in the tool ###
        distance = {"Euclidean":"EUCLIDEAN_DISTANCE", 
                    "Manhattan":"MANHATTAN_DISTANCE",
                    ARCPY.GetIDMessage(220897):"EUCLIDEAN_DISTANCE", 
                    ARCPY.GetIDMessage(220898):"MANHATTAN_DISTANCE",
                    "EUCLIDEAN_DISTANCE" : "EUCLIDEAN_DISTANCE",
                    "MANHATTAN_DISTANCE" : "MANHATTAN_DISTANCE"
                    }
        typeStd  = {"Row":"ROW",
                    "None":"NONE", 
                    ARCPY.GetIDMessage(220899):"ROW",
                    ARCPY.GetIDMessage(220900):"NONE",
                    "ROW":"ROW",
                    "NONE":"NONE"}
        #### Orignal Input in the metadata ####
        cmd[1] = cmd[1].replace('"', "").replace("'", "")

        ### Check if the input exists ###
        if not ARCPY.Exists(parameters[idInput].valueAsText):
            ARCPY.AddError(fr"{parameters[idInput].valueAsText} does not exist")
            raise SystemExit

        #  0            1         2            3            4                      5            6     7     8    9   10           11
        #['HotSpots', 'test1', 'SOURCE_ID', 'Output_Path', 'FIXED_DISTANCE_BAND', 'Euclidean', 'Row', '#', '#', '#', 'APPLY_FDR', '#']
        giSens = GI.LocalGSensitivity()
        ### Execute new sensitivity method in the GI module ###
        giSens.execute(
            Input_Feature_Class = parameters[idInput].valueAsText,
            Input_Field= ch(cmd[2]),
            Output_Feature_Class=parameters[1].valueAsText,
            Conceptualization_of_Spatial_Relationships=cmd[4],
            Distance_Method=distance[cmd[5]],
            Standardization=typeStd[cmd[6]],
            Distance_Band_or_Threshold_Distance=ch(cmd[7]),
            Self_Potential_Field=ch(cmd[8]),
            Weights_Matrix_File=ch(cmd[9].replace('"', '')),
            Apply_False_Discovery_Rate__FDR__Correction=ch(cmd[10]),
            number_of_neighbors=ch(cmd[11]),
            sensitivity_info = sensitivity, 
            parameters = parameters
        )

    if tool_name == 'ClustersOutliers':
        import LocalMoran as LM

        ### Check if the input exists ###
        if not ARCPY.Exists(parameters[idInput].valueAsText):
            #### does not exist ####
            ARCPY.AddIDMessage("ERROR", 110 ,parameters[idInput].valueAsText)
            raise SystemExit 

        ### Dictionary to convert the values from the tool signature to the values in the tool ###
        distance = {"Euclidean":"EUCLIDEAN_DISTANCE", 
                    "Manhattan":"MANHATTAN_DISTANCE",
                    ARCPY.GetIDMessage(220897):"EUCLIDEAN_DISTANCE", 
                    ARCPY.GetIDMessage(220898):"MANHATTAN_DISTANCE",
                    "EUCLIDEAN_DISTANCE" : "EUCLIDEAN_DISTANCE",
                    "MANHATTAN_DISTANCE" : "MANHATTAN_DISTANCE"
                    }

        typeStd  = {"Row":"ROW",
                    "None":"NONE", 
                    ARCPY.GetIDMessage(220899):"ROW",
                    ARCPY.GetIDMessage(220900):"NONE",
                    "ROW":"ROW",
                    "NONE":"NONE"}

        ssdo = SSDO.SSDataObject(parameters[idResult].valueAsText, 
                                 ignoreDateHighPrecision=True, 
                                 displayProjectionWarning=False,
                                 silentErrors=True,silentWarnings=True)

        liFieldNames = ["SOURCE_ID", "LMiIndex", "LMiZScore", "LMiPValue", 
                        "ZTransform", "SpatialLag", "NNeighbors", "COType"] 
        ### Check if Fields exist in the output ###
        for fld in liFieldNames:
            if fld.upper() not in ssdo.allFields:
                ssdo = None
                ARCPY.AddIDMessage("WARNING", 110600, fld)
                break

        if ssdo is not None:
            ssdo.obtainData(masterField = "SOURCE_ID", fields= [fld.upper() for fld in liFieldNames])

        #  0              1         2            3                4         5         6     7     8    9      10   11
        #ClustersOutliers 'fc'    B01001_001E    outputddd INVERSE_DISTANCE Euclidean Row   #     #    NO_FDR 499   #
        lmSens = LM.LocalMoranSensitivity()
        ### Execute new sensitivity method in the GI module ###
        lmSens.execute(
            Input_Feature_Class = parameters[idInput].valueAsText,
            Input_Field= ch(cmd[2]),
            Output_Feature_Class=parameters[1].valueAsText,
            Conceptualization_of_Spatial_Relationships=cmd[4],
            Distance_Method=distance[cmd[5]],
            Standardization=typeStd[cmd[6]],
            Distance_Band_or_Threshold_Distance=ch(cmd[7]),
            Weights_Matrix_File=ch(cmd[8].replace('"', '')),
            Apply_False_Discovery_Rate__FDR__Correction=ch(cmd[9]),
            Number_of_Permutations = ch(cmd[10]),
            number_of_neighbors=ch(cmd[11]),
            sensitivity_info = sensitivity, 
            parameters = parameters,
            resultSSDO = ssdo
        )
    
    if tool_name == 'GeneralizedLinearRegression':
        import GLR

        modelTypes = {fr'"Continuous (Gaussian)"': 'CONTINUOUS',
                      fr'"Binary (Logistic)"': 'BINARY',
                      fr'"Count (Poisson)"': 'COUNT',
                      fr'"{ARCPY.GetIDMessage(220992)}"': 'CONTINUOUS',
                      fr'"{ARCPY.GetIDMessage(220993)}"': 'BINARY',
                      fr'"{ARCPY.GetIDMessage(220994)}"': 'COUNT',
                      fr'CONTINUOUS': 'CONTINUOUS',
                      fr'BINARY': 'BINARY',
                      fr'COUNT':'COUNT'
                      }
        # 0                                1        2              3                        4             5         6   7    8    9    10   11
        #['GeneralizedLinearRegression', 'svi', 'E_TOTPOP', '"Continuous (Gaussian)"', '"Path.."', 'E_HH;E_UNEMP', '#', '#', '#', '#', '#', '#']
        GLRSense = GLR.LocalGLRSensitivity(in_feature = parameters[idInput].valueAsText,
            dependent_variable=ch(cmd[2]),
            model_type=modelTypes[cmd[3]],
            out_simulation_table=parameters[idSimTable].valueAsText,
            output_features=parameters[1].valueAsText,
            explanatory_variables= None if cmd[5] in ["#", "", None] else ch(cmd[5]).split(';'),
            distance_features=ch(cmd[6]),
            prediction_locations=ch(cmd[7]),
            explanatory_variables_to_match=ch(cmd[8]),
            explanatory_distance_matching=ch(cmd[9]),
            output_predicted_features=ch(cmd[10]),
            output_trained_model=ch(cmd[11]),
            sensitivity_info = sensitivity,
            parameters=parameters)
        GLRSense.execute()

    if tool_name == 'SpatialAutocorrelation':
        import MoransI as MI

        ### Check if the input exists ###
        if not ARCPY.Exists(parameters[idInput].valueAsText):
            #### does not exist ####
            ARCPY.AddIDMessage("ERROR", 110 ,parameters[idInput].valueAsText)
            raise SystemExit 
        #                    0     1      2      3             4            5                    6      7       8     9
        #SpatialAutocorrelation  'fc' "field",  None, "INVERSE_DISTANCE", "EUCLIDEAN_DISTANCE", "ROW", 200000, None, None
        miSens = MI.GlobalISensitivity()
        ### Execute new sensitivity method in the GI module ###
        miSens.execute( 
            Input_Feature_Class=parameters[idInput].valueAsText,
            Input_Field=ch(cmd[2]),
            Generate_Report=False,
            Conceptualization_of_Spatial_Relationships=cmd[4].upper(),
            Distance_Method=cmd[5].upper(),
            Standardization=cmd[6].upper(),
            Distance_Band_or_Threshold_Distance=ch(cmd[7]),
            Weights_Matrix_File=ch(cmd[8].replace('"', '')),
            number_of_neighbors=ch(cmd[9]),
            sensitivity_info = sensitivity, 
            parameters = parameters
        )

    if tool_name == 'OptimizedHotSpotAnalysis':
        import OptimizedHotSpotAnalysis as OHSA
        #                         0     1         2        3            4                                 5    6    7    8    9
        #['OptimizedHotSpotAnalysis', 'svi', '"Ouput"', 'E_HH', '"Count incidents within fishnet grid"', '#', '#', '#', '#', '#']
        ohsaSens = OHSA.OptHotSpotSensitivity(Input_Features=parameters[idInput].valueAsText,
                                                Output_Features=parameters[1].valueAsText,
                                                Analysis_Field=cmd[3],
                                                Incident_Data_Aggregation_Method=ch(cmd[4]),
                                                Bounding_Polygons_Defining_Where_Incidents_Are_Possible=ch(cmd[5]),
                                                Polygons_For_Aggregating_Incidents_Into_Counts=ch(cmd[6]),
                                                Density_Surface=ch(cmd[7]),
                                                Cell_Size=ch(cmd[8]),
                                                Distance_Band=ch(cmd[9]),
                                                sensitivity_info=sensitivity,
                                                parameters=parameters
                                                )
        ohsaSens.execute()

    if tool_name == "OptimizedOutlierAnalysis":
        import OptimizedOutlierAnalysis as OOA

        if ch(cmd[4]) is None:
            #### The tool does not support analysis with aggregated data. ####
            ARCPY.AddIDMessage("ERROR", 110583)
            raise SystemExit()

        ssdo = SSDO.SSDataObject(parameters[idResult].valueAsText, 
                                 ignoreDateHighPrecision=True, 
                                 displayProjectionWarning=False,
                                 silentErrors=True,silentWarnings=True)

        liFieldNames = ["SOURCE_ID", "LMiIndex", "LMiZScore", "LMiPValue", 
                        "ZTransform", "SpatialLag", "NNeighbors", "COType"]

        ### Check if Fields exist in the output ###
        for fld in liFieldNames:
            if fld.upper() not in ssdo.allFields:
                ssdo = None
                ARCPY.AddIDMessage("WARNING", 110600, fld)
                break

        if ssdo is not None:
            ssdo.obtainData(masterField = "SOURCE_ID", fields= [fld.upper() for fld in liFieldNames])

        ooaSens = OOA.OptOutlierSensitivity(
            Input_Features=parameters[idInput].valueAsText,
            Output_Features=parameters[idOutput].valueAsText,
            Analysis_Field=ch(cmd[3]),
            Incident_Data_Aggregation_Method=ch(cmd[4]),
            Bounding_Polygons_Defining_Where_Incidents_Are_Possible=ch(cmd[5]),
            Polygons_For_Aggregating_Incidents_Into_Counts=ch(cmd[6]),
            Performance_Adjustment=ch(cmd[7]),
            Cell_Size=ch(cmd[8]),
            Distance_Band=ch(cmd[9]),
            sensitivity_info=sensitivity,
            parameters=parameters,
            resultSSDO = ssdo
        )

        ooaSens.execute()

####### Methods for Post Execute #######

def getOutputLayer(parameters, idOutput):
    datasetBase = None
    if parameters[idOutput].value is not None:
        datasetBase = UTILS.getTextParameter(idOutput, parameters)
    else:
        return None, None
    
    project = ARCPY.mp.ArcGISProject('CURRENT')
    mapFrame = project.activeMap
    layerMainName = OS.path.basename(datasetBase)
    isSHP = layerMainName.lower().endswith(".shp") or layerMainName.lower().endswith(".dbf")

    if isSHP:
        layerMainName = layerMainName[0: -4]

    outputLayer = None
    layerNames = mapFrame.listLayers("*"+layerMainName)

    if len(layerNames):
        _datasetBase = datasetBase
        if isSHP:
            _datasetBase= datasetBase[0:-4]

        for lyr in layerNames:
            source = lyr.dataSource
            _lyr = source.lower()
            isShpSource =  _lyr.endswith(".shp") or _lyr.endswith(".dbf")

            if isShpSource:
                source = source[0:-4]

            if OS.path.normpath(_datasetBase).lower() == OS.path.normpath(source).lower():
                outputLayer = lyr
                break

            outputLayer = UTILS.IsSQLOutput(lyr, _datasetBase, source)
            if outputLayer is not None:
                break     
    return outputLayer, mapFrame

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

def replaceStringByDictLocalization(expressionStr, pop1Dict):
    """ Replace the string by the dictionary"""
    for key, value in pop1Dict.items():
        expressionStr = expressionStr.replace(key, value)
    return expressionStr

def createPopup(expression):
    """ Create a popup with the expression and the media"""
    popupInfo = ARCPY.cim.CreateCIMObjectFromClassName("CIMPopupInfo", "V3")

    media1 = ARCPY.cim.CreateCIMObjectFromClassName("CIMExpressionMediaInfo", "V3")
    media1.expression = ARCPY.cim.CreateCIMObjectFromClassName("CIMExpressionInfo", "V3")
    media1.expression.title = "Custom"
    media1.expression.expression = expression
    media1.expression.returnType = "Default"
    popupInfo.mediaInfos = [media1]
    return popupInfo

def getStringForPopupToDisplay(parameters):
    """ Get the string to display in the popup
    INPUT:
        parameters (list) - List of parameters
    OUTPUT:
        part (string) - String to display in the popup
    """
    idOutput = 1
    idType = 4
    idMOE = 5
    idConf = 6
    idPct = 7
    part = ""

    fieldsInput = idMOE
    if parameters[idType].valueAsText == "CONFIDENCE_BOUNDS":
        fieldsInput = idConf
    if parameters[idType].valueAsText == "PERCENTAGE":
        fieldsInput = idPct

    if parameters[idType].valueAsText == "PERCENTAGE":
        fieldsToDisplay = [parameters[fieldsInput].valueAsText.split(" ")[0]]
    else:
        fieldsToDisplay = parameters[fieldsInput].valueAsText.split(" ")

    fields = ARCPY.ListFields(parameters[idOutput].valueAsText)
    if fields is not None:
        fields =  {fld.name: fld.aliasName for fld in fields}
        for fld in fieldsToDisplay:
            if fld in fields:
                style = '"line-height: 1.5;"'
                part += f"{fields[fld]}: <span style={style}>' +Round($feature.{fld},3) + '</span><br>"
            else:
                return None

        return f"var infoField = '<div>{part}<div>';\n"
    return None

def getPopupHotSpots(inputDataString = None ):
    import Gi as GI
    cvDomain = GI.cvDomain
    cvDomainShort = GI.cvDomainShort
    if inputDataString is None:
       inputDataString =  f"var infoField = '';\n"

    hotSpotsExpression = inputDataString + "var total_sims = $feature.NumSimC99 + $feature.NumSimC95 + $feature.NumSimC90 + $feature.NumSimNS + $feature.NumSimH90 + $feature.NumSimH95 + $feature.NumSimH99;\n\n// Define the colors for each category using a dictionary\nvar categoryColors = {\n    'Cold Spot 99%': 'rgb(69,117,181)',\n    'Cold Spot 95%': 'rgb(132,158,186)',\n    'Cold Spot 90%': 'rgb(192,204,190)',\n    'Not Significant': 'rgb(200,200,200)',\n    'Hot Spot 90%': 'rgb(250,185,132)',\n    'Hot Spot 95%': 'rgb(237,117,81)',\n    'Hot Spot 99%': 'rgb(214,47,39)'\n};\n\n// Accessing the color from the dictionary\nvar origColor = DefaultValue(categoryColors[$feature.GIBIN_CAT], \"black\"); \nvar predColor = DefaultValue(categoryColors[$feature.PredCat], \"black\"); \nvar origcat = 'Original : <span style=\"color:' + origColor + '; opacity: 1;\">' + $feature.GIBIN_CAT + '</span>'; \nvar predcat = 'AAA ' + total_sims + ' SSM: <span style=\"color:' + predColor + '; opacity: 1;\">' + $feature.PredCat + '</span>'; \nvar all  = '<div><p>' + Concatenate([origcat, predcat], '</p><p>') + '</p></div>'; \n\n// Define the values and labels\nvar values = [$feature.NumSimH99, $feature.NumSimH95, $feature.NumSimH90, $feature.NumSimNS, $feature.NumSimC90, $feature.NumSimC95, $feature.NumSimC99];\nvar labels = [\"Hot Spot 99%\", \"Hot Spot 95%\", \"Hot Spot 90%\", \"Not Significant\", \"Cold Spot 90%\", \"Cold Spot 95%\", \"Cold Spot 99%\"];\n\n// Define the colors for each category\nvar colors = [\n    \"rgb(214,47,39)\", // Hot 99\n    \"rgb(237,117,81)\", // Hot 95\n    \"rgb(250,185,132)\", // Hot 90\n    \"rgb(200,200,200)\", // Not Significant \n    \"rgb(192,204,190)\", // Cold 90\n    \"rgb(132,158,186)\", // Cold 95\n    \"rgb(69,117,181)\" // Cold 99\n];\n\n// Find the maximum value to scale the widths\nvar maxValue = Max(values);\n\n// Create the bar chart with axes and labels\nvar barChart = \"<div style='font-family: Arial, sans-serif; font-size: 10pt;'>\";\nbarChart += \"<div style='text-align: center; margin-bottom: 10px;'>Distribution</div>\";\nbarChart += \"<table style='width: 100%; border-collapse: collapse;'>\";\n\n// Add bars with labels and corresponding colors\nbarChart += \"<tbody>\";\nfor (var i = 0; i < 7; i++) {\n    var width = (values[i] / maxValue) * 100;\n    barChart += \"<tr style='height: 25px;'>\"; \n    barChart += \"<td style='width: 20%; padding-right: 5px; text-align: right; border-right: 1px solid #ccc;'>\" + labels[i] + \"</td>\";\n    // Use the colors array to set the background color for each bar\n    barChart += \"<td style='width: 80%; padding-left: 5px;'><div style='width: \" + width + \"%; height: 100%; background-color: \" + colors[i] + \"; color: rgba(0, 0, 0, 0); border-bottom: 1px solid #ccc;'>\" + values[i] + \"</div></td>\";\n    barChart += \"</tr>\";\n}\nbarChart += \"</tbody>\";\n\n// Adjust the bottom axis labels row to start under the bars\nbarChart += \"<tfoot><tr>\";\nbarChart += \"<td></td>\"; \nbarChart += \"<td style='border-top: 1px solid #ccc;'></td>\"; \nbarChart += \"</tr>\";\n\n// Correctly distribute the bottom axis labels as integers\nbarChart += \"<tr>\";\nbarChart += \"<td></td>\"; \n// Span the entire width for the labels, ensuring even distribution\nbarChart += \"<td colspan='5' style='text-align: left;'>\";\nbarChart += \"<div style='display: flex; justify-content: space-between;'>\";\nbarChart += \"<span>0</span>\"; // First label at the start\nfor (var i = 1; i <= 4; i++) { // Intermediate labels as integers\n    barChart += \"<span>\" + Round(i * maxValue / 4, 0) + \"</span>\";\n}\nbarChart += \"</div>\";\nbarChart += \"</td>\";\nbarChart += \"</tr>\";\nbarChart += \"</tfoot>\";\n\nbarChart += \"</table>\";\nbarChart += \"</div>\";\n\n// Return the bar chart as a text element\nvar hot_99_txt = $feature.NumSimH99 + \" (\" + Round(($feature.NumSimH99/total_sims)*100, 1) + \"%)\"\nvar hot_95_txt = $feature.NumSimH95 + \" (\" + Round(($feature.NumSimH95/total_sims)*100, 1) + \"%)\"\nvar hot_90_txt = $feature.NumSimH90 + \" (\" + Round(($feature.NumSimH90/total_sims)*100, 1) + \"%)\"\nvar non_sig_txt = $feature.NumSimNS + \" (\" + Round(($feature.NumSimNS/total_sims)*100, 1) + \"%)\"\nvar cold_99_txt = $feature.NumSimC99 + \" (\" + Round(($feature.NumSimC99/total_sims)*100, 1) + \"%)\"\nvar cold_95_txt = $feature.NumSimC95 + \" (\" + Round(($feature.NumSimC95/total_sims)*100, 1) + \"%)\"\nvar cold_90_txt = $feature.NumSimC90 + \" (\" + Round(($feature.NumSimC90/total_sims)*100, 1) + \"%)\"\n\nvar cssGray = \"style='background-color:#C4DCEC;'\";\nvar cssBorder = \"style='border: 1px solid black; padding: 8px; text-align: left;'\";\nvar cssCenter = \"style='border: 1px solid black; padding: 8px; text-align: center; background-color:#C4DCEC; font-size: 12px;'\";\nvar table = \"<p><table style='margin-left: auto; margin-right:auto; border-collapse: collapse; width: 80%; border: 1px solid black; font-size: 12px;'>\";\ntable += \"<tr \" + cssCenter + \">\";\ntable += \"<th \" + cssBorder + \">Category</th>\";\ntable += \"<th \" + cssBorder + \">Counts (Percentages)</th>\";\ntable += \"</tr>\";\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Hot Spot 99%</td>\";\ntable += \"<td \" + cssBorder + \">\" + hot_99_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr \" + cssGray + \">\";\ntable += \"<td \" + cssBorder + \">Hot Spot 95%</td>\";\ntable += \"<td \" + cssBorder + \">\" + hot_95_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Hot Spot 90%</td>\";\ntable += \"<td \" + cssBorder + \">\" + hot_90_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr \" + cssGray + \">\";\ntable += \"<td \" + cssBorder + \">Not Significant</td>\";\ntable += \"<td \" + cssBorder + \">\" + non_sig_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Cold Spot 90%</td>\";\ntable += \"<td \" + cssBorder + \">\" + cold_90_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr \" + cssGray + \">\";\ntable += \"<td \" + cssBorder + \">Cold Spot 95%</td>\";\ntable += \"<td \" + cssBorder + \">\" + cold_95_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Cold Spot 99%</td>\";\ntable += \"<td \" + cssBorder + \">\" + cold_99_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"</table>\";\n// Return the table as a text element\nvar output = infoField + all + barChart+table;  \nreturn {\n        type: \"text\",\n        text: output\n    };"
    hotSpotLocalizationDict ={
    'Cold Spot with 99% Confidence': cvDomain[-3],
    'Cold Spot with 95% Confidence': cvDomain[-2],
    'Cold Spot with 90% Confidence': cvDomain[-1],
    'Not Significant': cvDomain[0],
    'Hot Spot with 90% Confidence': cvDomain[1],
    'Hot Spot with 95% Confidence': cvDomain[2],
    'Hot Spot with 99% Confidence': cvDomain[3],
    'SSM': ARCPY.GetIDMessage(220904),
    'Cold Spot 99%': cvDomainShort[-3],
    'Cold Spot 95%': cvDomainShort[-2],
    'Cold Spot 90%': cvDomainShort[-1],
    'Hot Spot 90%': cvDomainShort[1],
    'Hot Spot 95%': cvDomainShort[2],
    'Hot Spot 99%': cvDomainShort[3],
    'Category': ARCPY.GetIDMessage(84825),
    'Original': ARCPY.GetIDMessage(220905),
    'Distribution':  ARCPY.GetIDMessage(220908),
    'Counts (Percentages)':ARCPY.GetIDMessage(220906),
    'AAA': ARCPY.GetIDMessage(220907)
    }
    hotSpotsExpression = replaceStringByDictLocalization(hotSpotsExpression, hotSpotLocalizationDict)
    return createPopup(hotSpotsExpression)

def getPopupClusterOutlier(inputDataString = None ):

    if inputDataString is None:
       inputDataString =  f"var infoField = '';\n"

    clusterOutlierExpression = inputDataString + "var total_sims = $feature.NumSimHH + $feature.NumSimHL + $feature.NumSimLH + $feature.NumSimLL + $feature.NumSimNS + $feature.NumSimNN;\n\n// Define the colors for each category using a dictionary\nvar categoryColors = {\n    'High-High cluster': 'rgb(250,185,132)',\n    'High-Low outlier': 'rgb(214,47,39)',\n    'Low-High outlier': 'rgb(69,117,181)',\n    'Low-Low cluster': 'rgb(132,158,186)',\n    'Not significant': 'rgb(200,200,200)',\n    'No neighbors': 'rgb(105,105,105)' \n};\n\n// Accessing the color from the dictionary\nvar origColor = DefaultValue(categoryColors[$feature.COTypeCat], \"black\"); \nvar predColor = DefaultValue(categoryColors[$feature.PredCat], \"black\"); \n\nvar origcat = 'Original: <span style=\"color:' + origColor + '; opacity: 1;\">' +  $feature.COTypeCat + '</span>'; \nvar predcat = 'AAA ' + total_sims + ' SSS: <span style=\"color:' + predColor + '; opacity: 1;\">' + $feature.PredCat + '</span>'; \n\nvar all = '<div style=\"line-height: 1.5;\">' + origcat + '<br>' + predcat + '</div>';\n\n// Define the values and labels\nvar values = [$feature.NumSimHH, $feature.NumSimHL, $feature.NumSimLH, $feature.NumSimLL, $feature.NumSimNS, $feature.NumSimNN];\nvar labels = [\"High-High cluster\", \"High-Low outlier\", \"Low-High outlier\", \"Low-Low cluster\", \"Not significant\", \"No neighbors\"];\n\n// Define the colors for each category using arrays\nvar colors = [\"rgb(240,184,177)\", \"rgb(214,47,39)\", \"rgb(69,117,181)\", \"rgb(132,158,186)\", \"rgb(200,200,200)\", \"rgb(105,105,105)\"];\n\n// Find the maximum value to scale the widths\nvar maxValue = Max(values);\n\n// Create the bar chart with axes and labels\nvar barChart = \"<p><div style='font-family: Arial, sans-serif; font-size: 10pt;'>\";\nbarChart += \"<div style='text-align: center; margin-bottom: 10px;'>Distribution</div>\";\nbarChart += \"<table style='margin-left: auto; margin-right: auto;width: 100%; border-collapse: collapse;'>\";\n\n// Add bars with labels and corresponding colors\nbarChart += \"<tbody>\";\nfor (var i = 0; i < 6; i++) {\n    var width = (values[i] / maxValue) * 100;\n    barChart += \"<tr style='height: 25px;'>\"; \n    barChart += \"<td style='width: 10%; padding-right: 5px; text-align: right; border-right: 1px solid #ccc;'>\" + labels[i] + \"</td>\";\n    // Use the colors array to set the background color for each bar\n    barChart += \"<td style='width: 80%; padding-left: 5px;'><div style='width: \" + width + \"%; height: 100%; background-color: \" + colors[i] + \"; color: rgba(0, 0, 0, 0); border-bottom: 1px solid #ccc;'>\" + values[i] + \"</div></td>\";\n    barChart += \"</tr>\";\n}\nbarChart += \"</tbody>\";\n\n// Adjust the bottom axis labels row to start under the bars\nbarChart += \"<tfoot><tr>\";\nbarChart += \"<td></td>\"; \nbarChart += \"<td style='border-top: 1px solid #ccc;'></td>\"; \nbarChart += \"</tr>\";\n\n// Correctly distribute the bottom axis labels as integers\nbarChart += \"<tr>\";\nbarChart += \"<td></td>\"; // Empty cell for the corner\n// Span the entire width for the labels, ensuring even distribution\nbarChart += \"<td colspan='5' style='text-align: left;'>\";\nbarChart += \"<div style='display: flex; justify-content: space-between;'>\";\nbarChart += \"<span>0</span>\"; // First label at the start\nfor (var i = 1; i <= 4; i++) { // Intermediate labels as integers\n    barChart += \"<span>\" + Round(i * maxValue / 4, 0) + \"</span>\";\n}\nbarChart += \"</div>\";\nbarChart += \"</td>\";\nbarChart += \"</tr>\";\nbarChart += \"</tfoot>\";\nbarChart += \"</table>\";\nbarChart += \"</div>\";\nvar hh_txt = $feature.NumSimHH + \" (\" + Round(($feature.NumSimHH / total_sims) * 100, 1) + \"%)\";\nvar hl_txt = $feature.NumSimHL + \" (\" + Round(($feature.NumSimHL / total_sims) * 100, 1) + \"%)\";\nvar lh_txt = $feature.NumSimLH + \" (\" + Round(($feature.NumSimLH / total_sims) * 100, 1) + \"%)\";\nvar ll_txt = $feature.NumSimLL + \" (\" + Round(($feature.NumSimLL / total_sims) * 100, 1) + \"%)\";\nvar non_sig_txt = $feature.NumSimNS + \" (\" + Round(($feature.NumSimNS / total_sims) * 100, 1) + \"%)\";\nvar nn_txt = $feature.NumSimNN + \" (\" + Round(($feature.NumSimNN / total_sims) * 100, 1) + \"%)\";\nvar cssGray = \"style='background-color:#C4DCEC;'\";\nvar cssBorder = \"style='border: 1px solid black; padding: 8px; text-align: left;'\";\nvar cssCenter = \"style='border: 1px solid black; padding: 8px; text-align: center; background-color:#C4DCEC; font-size: 12px;'\";\nvar table = \"<p><table style='margin-left: auto; margin-right: auto; border-collapse: collapse; width: 80%; border: 1px solid black; font-size: 12px;'>\";\n\ntable += \"<tr \" + cssCenter + \">\";\ntable += \"<th \" + cssBorder + \">Category</th>\";\ntable += \"<th \" + cssBorder + \">Counts (Percentages)</th>\";\ntable += \"</tr>\";\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">High-High cluster</td>\";\ntable += \"<td \" + cssBorder + \">\" + hh_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr \" + cssGray + \">\";\ntable += \"<td \" + cssBorder + \">High-Low outlier</td>\";\ntable += \"<td \" + cssBorder + \">\" + hl_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Low-High outlier</td>\";\ntable += \"<td \" + cssBorder + \">\" + lh_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr \" + cssGray + \">\";\ntable += \"<td \" + cssBorder + \">Low-Low cluster</td>\";\ntable += \"<td \" + cssBorder + \">\" + ll_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Not significant</td>\";\ntable += \"<td \" + cssBorder + \">\" + non_sig_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"<tr \" + cssGray + \">\";\ntable += \"<td \" + cssBorder + \">No neighbors</td>\";\ntable += \"<td \" + cssBorder + \">\" + nn_txt + \"</td>\";\ntable += \"</tr>\";\ntable += \"</table>\";\n\nvar output  = infoField + all + barChart + table\n\nreturn { \n    type: 'text', \n    text: output\n};\n"
    clusterOutlierLocalizationDict ={
    'Distribution': ARCPY.GetIDMessage(220908),
    'Category': ARCPY.GetIDMessage(84825),
    'Counts (Percentages)':ARCPY.GetIDMessage(220906),
    'High-High cluster': ARCPY.GetIDMessage(84661),
    'High-Low outlier': ARCPY.GetIDMessage(84659),
    'Low-High outlier': ARCPY.GetIDMessage(84660),
    'Low-Low cluster':  ARCPY.GetIDMessage(84662),
    'Not significant':  ARCPY.GetIDMessage(84511),
    'No neighbors': ARCPY.GetIDMessage(220682),
    'Original': ARCPY.GetIDMessage(220905),
    'AAA': ARCPY.GetIDMessage(220907),
    'SSS': ARCPY.GetIDMessage(220904)}
    
    clusterOutlierExpression = replaceStringByDictLocalization(clusterOutlierExpression, clusterOutlierLocalizationDict)
    return createPopup(clusterOutlierExpression)

def getPopupGLR( ):
    GLRExpression ="// Define the values for each row\nvar actualMin = $feature.SimMinY;\nvar actualMed = $feature.SimMedY;\nvar actualMax = $feature.SimMaxY;\n\nvar predictedMin = $feature.SimMinPrY;\nvar predictedMed = $feature.SimMedPrY;\nvar predictedMax = $feature.SimMaxPrY;\n\nvar residualMin = $feature.SimMinStd;\nvar residualMed = $feature.SimMedStd;\nvar residualMax = $feature.SimMaxStd;\n\nvar cssGray = \"style='background-color:#C4DCEC;'\";\nvar cssBorder = \"style='border: 1px solid black; padding: 8px; text-align: left;'\";\nvar cssCenter = \"style='border: 1px solid black; padding: 8px; text-align: center; background-color:#C4DCEC; font-size: 12px;'\";\n\nvar table = \"<div style='font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; text-align: center; margin-bottom: 10px;'>Summary</div>\";\ntable += \"<table style='border-collapse: collapse; width: 90%; border: 1px solid black; font-size: 12px;'>\";\n\ntable += \"<tr \" + cssCenter + \">\";\ntable += \"<th \" + cssBorder + \">Variable</th>\";\ntable += \"<th \" + cssBorder + \">Minimum</th>\";\ntable += \"<th \" + cssBorder + \">Median</th>\";\ntable += \"<th \" + cssBorder + \">Maximum</th>\";\ntable += \"</tr>\";\n\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Actual Y</td>\";\ntable += \"<td \" + cssBorder + \">\" + actualMin + \"</td>\";\ntable += \"<td \" + cssBorder + \">\" + actualMed + \"</td>\";\ntable += \"<td \" + cssBorder + \">\" + actualMax + \"</td>\";\ntable += \"</tr>\";\n\ntable += \"<tr \" + cssGray + \">\";\ntable += \"<td \" + cssBorder + \">Predicted Y</td>\";\ntable += \"<td \" + cssBorder + \">\" + predictedMin + \"</td>\";\ntable += \"<td \" + cssBorder + \">\" + predictedMed + \"</td>\";\ntable += \"<td \" + cssBorder + \">\" + predictedMax + \"</td>\";\ntable += \"</tr>\";\n\ntable += \"<tr>\";\ntable += \"<td \" + cssBorder + \">Residual</td>\";\ntable += \"<td \" + cssBorder + \">\" + residualMin + \"</td>\";\ntable += \"<td \" + cssBorder + \">\" + residualMed + \"</td>\";\ntable += \"<td \" + cssBorder + \">\" + residualMax + \"</td>\";\ntable += \"</tr>\";\n\ntable += \"</table>\";\n\n// Return the table as a text element\nreturn {\n    type: \"text\",\n    text: table\n};\n"
    GLRLocalizationDict ={
    'Variable': ARCPY.GetIDMessage(84842),
    'Minimum':  ARCPY.GetIDMessage(220438),
    'Median':   ARCPY.GetIDMessage(220441), 
    'Maximum':  ARCPY.GetIDMessage(220439),
    'Actual Y': ARCPY.GetIDMessage(220909),
    'Predicted Y': ARCPY.GetIDMessage(220910),
    'Residual': ARCPY.GetIDMessage(220911),
    'Summary': ARCPY.GetIDMessage(220912)}

    clusterOutlierExpression = replaceStringByDictLocalization(GLRExpression, GLRLocalizationDict)
    return createPopup(clusterOutlierExpression)

def getNaturalBreaks( field1,field2):
    """ Get the natural breaks for the field1 and field2
    INPUTS:
        field1 (Candidate Field): The first field
        field2 (Candidate Field): The second field
    RETURNS:
        breaks (String): The breaks for the field1 and field2
    """
    orig = NUM.unique(field1.data)
    pred = NUM.unique(field2.data)
    values = []
    for i in orig:
        for j in pred:
            values.append((i,j))
    data = []
    for pair in values:
        mask1 = field1.data == pair[0]
        mask2 = field2.data == pair[1]
        mask = mask1 & mask2
        count = mask.sum()
        data.append(count)

    uniqueData, countData = NUM.unique(data, return_counts=True)
    naturalBreaksOption  = 4
    numberOfClasses = 6
    categories = ARC._ss.get_breaks(classify_method = naturalBreaksOption,
                                unique = NUM.asarray(uniqueData, float),
                                count = NUM.asarray(countData, NUM.int32),
                                num_class = numberOfClasses,
                                defined_interval_size = 0,
                                mean = 0,
                                std_dev = 0,
                                std_interval = 0)
    return ",".join([str(int(v)) for v in categories.tolist()])

def defineManualBreaks(chart, breaksInformation):
    """ Define the manual breaks for the chart
    INPUTS:
        chart (CIMChart): The chart
        breaksInformation (String): The breaks information
    """

    breaks = []
    try:
        breaks = [int(v) for v  in breaksInformation.split(",")]
    except:
        return
    
    chart.series[0].classificationMethod = "Manual"
    chart.generalProperties.gridLineSymbolProperties.width = 0.1
    color = ARCPY.cim.CreateCIMObjectFromClassName('CIMRGBColor', 'V3')
    color.values = [52, 52, 52, 100]
    chart.generalProperties.gridLineSymbolProperties.color = color
    colors = [[255, 255, 255, 100],
            [213,228,239,100],
            [169,196,222,100],
            [140,150,198,100],
            [139,93,170,100],
            [131, 32,135,100],
            [ 77, 0, 75, 100]]
    if breaks[1] == 0:
        breaks = breaks[1:]

    breaks[0] = 0

    nClasses = len(breaks)

    if nClasses == 2:
        colorList = [colors[0], colors[6]]
    if nClasses == 3:
        colorList = [colors[0],colors[4], colors[6]]
    if nClasses == 4:
        colorList = [colors[0],colors[2], colors[3], colors[6]]
    if nClasses == 5:
        colorList = [colors[0],colors[1], colors[2], colors[4], colors[6]]
    if nClasses == 6:
        colorList = [colors[0],colors[1], colors[2], colors[3], colors[4], colors[6]]
    if nClasses == 7:
        colorList = colors
    chart.series[0].breaks = breaks
    lColors = []

    chart.series[0].numClasses = nClasses
    for color in colorList:
        colorObj = ARCPY.cim.CreateCIMObjectFromClassName('CIMRGBColor', 'V3')
        colorObj.values = color
        lColors.append(colorObj)
    chart.series[0].breakColors = lColors

def postExecute(parameters):
    import json
    from arcpy.cim.cimloader import GetJSONTypeOBJ
    from arcpy.cim.cimloader import  CimJsonEncoder
    import Gi as GI
    cvDomainShort = GI.cvDomainShort
    ### Parameters Index ###
    idResult = 0
    idOutput = 1
    idSimTable = 2
    idInput = 3
    idType = 4
    idMOE = 5
    idConf = 6
    idPct = 7
    idSim = 8
    idSimMethod = 9
    idWS = 10
    idSimLimits = 11
    idMOEConf = 12
    idGL = 13
    map = None
    outputLayer, map = getOutputLayer(parameters, idOutput)
    if outputLayer is None:
        return
    
    layer_metadata = getMetadata(parameters, idResult)

    #### Extract the tool information ####
    root = SSHELPER.XMLFromString(layer_metadata.xml)
    process_elements = root.findall(".//Process[@ToolSource]")
    
    # Extracted elements as string
    extracted_elements = [SSHELPER.XMLToString(elem, encoding='unicode') for elem in process_elements]
    tool_name, datetime_str, latest_FC, analysis_vars, cmd = SSHELPER.extract_tool_info(extracted_elements)
    isSHP = False
    outputFC = parameters[idOutput].valueAsText
    outputName = OS.path.basename(str(outputFC))
    if outputName.lower().endswith(".shp"):
        outputName = outputName[: -4]
        isSHP = True

    inputFieldInfo = None
    if tool_name not in ["GeneralizedLinearRegression", "SpatialAutocorrelation", None] and not isSHP:
        inputFieldInfo = getStringForPopupToDisplay(parameters)

    try:
        if tool_name in ["GeneralizedLinearRegression", "SpatialAutocorrelation"]:
            outSimTable = parameters[idSimTable].valueAsText
            outputTableName = OS.path.basename(str(outSimTable))
            gpName = outputName + "_" + ARCPY.GetIDMessage(220913)

            gLayer = map.listLayers(gpName)[0]
            fLayerIni = gLayer.listLayers(outputName)[0]
            map.removeLayer(fLayerIni)

            fLayer = map.listLayers(outputName)[0]
            tLayer = map.listTables(outputTableName)[0]
            definition = fLayer.getDefinition('V3')
            definition.popupInfo = getPopupGLR()
            fLayer.setDefinition(definition)

            map.addTableToGroup(gLayer, tLayer)
            map.addLayerToGroup(gLayer, fLayer)
            #### Remove the dubplicates ####
            map.removeLayer(fLayer)
            map.removeTable(tLayer)

            groups2Delete = []
            for gl in map.listLayers(UTILS.getTextParameter(gpName, parameters)):
                if gl.isGroupLayer and checkEmptyGroupLayer(gl):
                    groups2Delete.append(gl)
            for gl in groups2Delete:
                map.removeLayer(gl)
        else:
            changed = False
            if outputLayer is not None:
                definition = outputLayer.getDefinition('V3')
                charts = definition.charts
                columnsGi = [cvDomainShort[-3], cvDomainShort[-2],cvDomainShort[-1],cvDomainShort[0], cvDomainShort[1], cvDomainShort[2], cvDomainShort[3]]
                rowGi =     [cvDomainShort[3],   cvDomainShort[2],cvDomainShort[1] ,cvDomainShort[0],cvDomainShort[-1],cvDomainShort[-2],cvDomainShort[-3]]
                #                    HH                  LH                        NS                       HL                        LL                         NN     
                columnMi =  [ ARCPY.GetIDMessage(84661),ARCPY.GetIDMessage(84660),ARCPY.GetIDMessage(84511),ARCPY.GetIDMessage(84659),ARCPY.GetIDMessage(84662),ARCPY.GetIDMessage(220682)]
                rowMi =     [ ARCPY.GetIDMessage(84662),ARCPY.GetIDMessage(84659),ARCPY.GetIDMessage(84511),ARCPY.GetIDMessage(84660),ARCPY.GetIDMessage(84661),ARCPY.GetIDMessage(220682)]

                isGi = False
                columns = columnMi
                rows = rowMi
                if tool_name in ["HotSpots", "OptimizedHotSpotAnalysis"]:
                    columns = columnsGi
                    rows = rowGi
                    isGi = True

                def changeInfoCharts(chart, fieldsColorName, sortedCategoryValues, maxLabel = 15):
                    chart.axes[0].labelCharacterLimit = maxLabel
                    for id,serie  in enumerate(chart.series):
                        if chart.series[id].fields[1] in fieldsColorName:
                            serie.fillSymbolProperties.color.values = fieldsColorName[chart.series[id].fields[1]][1]
                            serie.name = fieldsColorName[chart.series[id].fields[1]][0]
                            serie.sortedCategoryValues = sortedCategoryValues

                breaksInformation = ""
                try:
                    ### Obtain breaks from popupInfo ####
                    if definition.popupInfo is not None:
                        if definition.popupInfo.mediaInfos is  not None and definition.popupInfo.mediaInfos[0].expression.expression.startswith("//"):
                            breaksInformation = definition.popupInfo.mediaInfos[0].expression.expression.replace("//", "")
                except Exception as e:
                    UTILS.dbg(e)

                for chart in charts:

                    if chart.generalProperties.title == ARCPY.GetIDMessage(220891):
                        changed = True
                        chart.series[0].columnSortedCategoryValues = columns
                        chart.series[0].rowSortedCategoryValues =  rows
                        information =  """{
                                        "type" : "CIMMultipartColorRamp",
                                        "colorSpace" : {
                                        "type" : "CIMICCColorSpace",
                                        "url" : "Default RGB"
                                        },
                                        "colorRamps" : [
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                247,
                                                252,
                                                253,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                224,
                                                236,
                                                244,
                                                100
                                            ]
                                            }
                                        },
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                224,
                                                236,
                                                244,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                191,
                                                211,
                                                230,
                                                100
                                            ]
                                            }
                                        },
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                191,
                                                211,
                                                230,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                158,
                                                188,
                                                218,
                                                100
                                            ]
                                            }
                                        },
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                158,
                                                188,
                                                218,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                140,
                                                150,
                                                198,
                                                100
                                            ]
                                            }
                                        },
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                140,
                                                150,
                                                198,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                140,
                                                107,
                                                177,
                                                100
                                            ]
                                            }
                                        },
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                140,
                                                107,
                                                177,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                136,
                                                65,
                                                157,
                                                100
                                            ]
                                            }
                                        },
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                136,
                                                65,
                                                157,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                129,
                                                15,
                                                124,
                                                100
                                            ]
                                            }
                                        },
                                        {
                                            "type" : "CIMLinearContinuousColorRamp",
                                            "colorSpace" : {
                                            "type" : "CIMICCColorSpace",
                                            "url" : "Default RGB"
                                            },
                                            "fromColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                129,
                                                15,
                                                124,
                                                100
                                            ]
                                            },
                                            "toColor" : {
                                            "type" : "CIMRGBColor",
                                            "colorSpace" : {
                                                "type" : "CIMICCColorSpace",
                                                "url" : "Default RGB"
                                            },
                                            "values" : [
                                                77,
                                                0,
                                                75,
                                                100
                                            ]
                                            }
                                        }
                                        ],
                                        "weights" : [
                                        0.125,
                                        0.125,
                                        0.125,
                                        0.125,
                                        0.125,
                                        0.125,
                                        0.125,
                                        0.125
                                        ]
                                    }"""
                        colorRamp = GetJSONTypeOBJ(json.loads(information))
                        chart.series[0].colorRamp = colorRamp
                        chart.axes[0].labelCharacterLimit = 20
                        chart.axes[1].labelCharacterLimit = 20

                        #### Obtain the breaks information ####
                        if breaksInformation != "":
                            defineManualBreaks(chart, breaksInformation)

                if tool_name in ["HotSpots", "OptimizedHotSpotAnalysis"]:
                    popup = getPopupHotSpots(inputFieldInfo)
                    definition.popupInfo = popup
                if tool_name in ["ClustersOutliers", "OptimizedOutlierAnalysis"]:
                    popup = getPopupClusterOutlier(inputFieldInfo)
                    definition.popupInfo = popup

                if changed:
                    definition.charts = charts
                outputLayer.setDefinition(definition)

                gls = map.listLayers(outputName + "_" + ARCPY.GetIDMessage(220913))
                if len(gls) > 0:
                        groups2Delete = []
                        for idg in NUM.arange(len(gls)):
                            if gls[idg].isGroupLayer and len(gls[idg].listLayers()) > 0:
                                for lyr in gls[idg].listLayers():
                                    hatchLyr = lyr
                                    if hatchLyr.name  == ARCPY.GetIDMessage(220893):
                                        popup = None
                                        if isGi:
                                            popup = getPopupHotSpots(inputFieldInfo)
                                        else:
                                            popup = getPopupClusterOutlier(inputFieldInfo)

                                        definition = hatchLyr.getDefinition('V3')
                                        definition.renderer.heading = ARCPY.GetIDMessage(220894)
                                        if popup:
                                            definition.popupInfo = popup
                                        hatchLyr.setDefinition(definition)
                                        map.moveLayer(hatchLyr, outputLayer, "AFTER")
                            else:
                                groups2Delete.append(gls[idg])

                        for gl in groups2Delete:
                            map.removeLayer(gl)
                        #### It is needed to check if the hatch layer is at the top of the group layer ####
                        if hatchLyr is not None:
                            gls = map.listLayers(outputName + "_" + ARCPY.GetIDMessage(220913))
                            if len(gls) == 1:
                                lyrs = gls[0].listLayers()
                                nLyrs = len(lyrs)
                                if nLyrs == 2 and lyrs[1].name == ARCPY.GetIDMessage(220893):
                                    map.moveLayer(hatchLyr, outputLayer, "AFTER")

    except Exception as e:
        UTILS.dbg(e)
        raise SystemExit

    return


