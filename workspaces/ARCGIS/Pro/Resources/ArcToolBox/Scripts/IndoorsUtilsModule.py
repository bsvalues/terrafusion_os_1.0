import arcpy
import numpy as np
import os
import sys
import traceback
import requests
import urllib3
import datetime

INDOORFEATURECLASSES =["deadzones", "details","events","facilities","levels","pointsofinterest","sections","sites","trackingzones","units","zones"]
INDOORAIIMDATASETNAME = "Indoors"
INDOORNETWORKDATASETNAME = "Network"
SDEQUALIFIER = "" # default to FGDB
#New indoors dataset
INDOORFEATURES = ["Details", "Facilities", "Levels", "Sites", "Units"]
NETWORKFEATURES = ["Landmarks", "Pathways", "Transitions"]

FACILITY_ID = "FACILITY_ID"
FACILITY_NAME = "FACILITY_NAME"
LEVELS_NAME = "NAME_SHORT"
LEVEL_NUMBER = "LEVEL_NUMBER"
FACILITYFC_NAME = "NAME"
LEVEL_ID = "LEVEL_ID"
SCRATCHWKS_FACILITYID = "FACILITY_ID"
SCRATCHWKS_LEVELID = "LEVELID"
FACILITY_FLDS = ['SITE_ID', 'SITE_NAME', 'FACILITY_ID', 'FACILITY_NUMBER', 'NAME', 'NAME_LONG', 'DESCRIPTION', 'ADDRESS', 'UNIT', 'LOCALITY', 'PROVINCE', 'COUNTRY', 'POSTAL_CODE', 'DATE_BUILT', 'LEVELS_TOTAL', 'ELEVATION_RELATIVE', 'ELEVATION_ABSOLUTE', 'HEIGHT_RELATIVE', 'HEIGHT_ABSOLUTE', 'ROTATION', 'MERGE_LEVELS']
FACILITY_JN_FIELDS = ['SITE_ID', 'SITE_NAME', 'FACILITY_NUMBER', 'NAME', 'NAME_LONG', 'DESCRIPTION', 'ADDRESS', 'UNIT', 'LOCALITY', 'PROVINCE', 'COUNTRY', 'POSTAL_CODE', 'DATE_BUILT', 'LEVELS_TOTAL', 'ELEVATION_RELATIVE', 'ELEVATION_ABSOLUTE', 'HEIGHT_RELATIVE', 'HEIGHT_ABSOLUTE', 'ROTATION', 'MERGE_LEVELS']
FACILITY_LIST_FLDS = ['FACILITY_ID','MERGE_LEVELS']
#BLGD FIELDS
BLDG_FLOAT_FIELDS = ['ELEVATION_RELATIVE', 'ELEVATION_ABSOLUTE', 'HEIGHT_RELATIVE', 'HEIGHT_ABSOLUTE', 'ROTATION']
BLDG_INT_FIELDS = ['FACILITY_NUMBER', 'LEVELS_TOTAL']
BLDG_LONG_FIELDS = []
BLDG_TEXT_FIELDS = ['SITE_ID', 'SITE_NAME', 'FACILITY_ID', 'NAME', 'NAME_LONG', 'DESCRIPTION', 'ADDRESS', 'UNIT', 'LOCALITY', 'PROVINCE', 'COUNTRY', 'POSTAL_CODE', 'MERGE_LEVELS']
BLDG_DT_FIELDS = ['DATE_BUILT']
#LEVEL FIELDS
FLOOR_FIELDS = ['SOURCE_PATH', 'FACILITY_ID', 'LEVEL_ID', 'NAME_SHORT', 'NAME', 'DESCRIPTION', 'ACCESS_TYPE', 'LEVEL_NUMBER', 'VERTICAL_ORDER', 'ELEVATION_RELATIVE', 'ELEVATION_ABSOLUTE', 'HEIGHT_RELATIVE', 'HEIGHT_ABSOLUTE', 'CLOSE_DOORS', 'PROCESS']
FLOOR_JN_FIELDS = ['SOURCE_PATH', 'FACILITY_ID', 'NAME_SHORT', 'NAME', 'DESCRIPTION', 'ACCESS_TYPE', 'LEVEL_NUMBER', 'VERTICAL_ORDER', 'ELEVATION_RELATIVE', 'ELEVATION_ABSOLUTE', 'HEIGHT_RELATIVE', 'HEIGHT_ABSOLUTE', 'CLOSE_DOORS']
FLOOR_FLOAT_FIELDS = ['ELEVATION_RELATIVE', 'ELEVATION_ABSOLUTE', 'HEIGHT_RELATIVE', 'HEIGHT_ABSOLUTE']
FLOOR_INT_FIELDS = ['VERTICAL_ORDER', 'LEVEL_NUMBER']
FLOOR_TEXT_FIELDS = ['SOURCE_PATH', 'FACILITY_ID', 'LEVEL_ID', 'NAME_SHORT', 'NAME', 'DESCRIPTION', 'ACCESS_TYPE', 'CLOSE_DOORS', "PROCESS"]
#SOURCE PATHS Fields
PATHS_TEXT_FIELDS = ['SOURCE_PATH', 'LEVEL_ID']
PATH_SHEETNAME = "Source Files"
FLOOR_FIELDS_SEPERATEDPATHS = ['FACILITY_ID', 'LEVEL_ID', 'NAME_SHORT', 'NAME', 'DESCRIPTION', 'ACCESS_TYPE', 'LEVEL_NUMBER', 'VERTICAL_ORDER', 'ELEVATION_RELATIVE', 'ELEVATION_ABSOLUTE', 'HEIGHT_RELATIVE', 'HEIGHT_ABSOLUTE', 'CLOSE_DOORS', 'PROCESS']
LEVELS_REQUIRED_SEPERATEDPATHS = ['FACILITY_ID', 'LEVEL_ID', 'NAME_SHORT', 'VERTICAL_ORDER', 'ELEVATION_RELATIVE', 'HEIGHT_RELATIVE']

#Pathways fields
TRAVEL_DIRECTION = "TRAVEL_DIRECTION"
ACCESS_PEDESTRIAN = "ACCESS_PEDESTRIAN"
ACCESS_WHEELCHAIR = "ACCESS_WHEELCHAIR"
LOCATION_TYPE = "LOCATION_TYPE"
PATHWAY_RANK = "PATHWAY_RANK"
PATHWAY_TYPE = "PATHWAY_TYPE"
AIIM_UPDATE_FEATURECLASSES = {}
ADVANCEDLICENSEEXCEPTION = "This tool requires ArcGIS Desktop Advanced license."
STANDARDLICENSEEXCEPTION = "This tool requires ArcGIS Desktop Standard license."
BASICLICENSEEXCEPTION = "This tool requires ArcGIS Desktop Basic license."
CAD_COLUMNS = ['FACILITIES', 'FACILITY_LINES', 'LEVELS', 'LEVEL_LINES', 'ZONES', 'ZONE_LINES', 'ZONE_ID', 'ZONE_NAME', 'SECTIONS', 'SECTION_LINES', 'SECTION_ID', 'SECTION_NAME', 'UNITS', 'UNIT_LINES', 'UNIT_ID', 'UNIT_NAME', 'UNIT_USE_TYPE', 'DETAILS', 'OPENINGS']
CAD_REQUIRED_COLUMNS = ['FACILITIES', 'FACILITY_LINES', 'LEVELS', 'LEVEL_LINES', 'UNITS', 'UNIT_LINES', 'ZONES', 'ZONE_LINES', 'SECTIONS', 'SECTION_LINES']
CAD_SHEETNAME = "CAD Layer to FC Mapping"
CAD_SHEETNAME_UPDATED = "Layer to Feature Class"
FACILITIES_SHEETNAME = "Facility Properties"
LEVELS_SHEETNAME = "Level Properties"
ANNOTATION_SHEETNAME = "Annotation to Field"
FACILITIES_REQUIRED_COLUMNS = ['SITE_ID', 'FACILITY_ID', 'NAME', 'ELEVATION_RELATIVE', 'HEIGHT_RELATIVE']
LEVELS_REQUIRED_COLUMNS = ['SOURCE_PATH', 'FACILITY_ID', 'LEVEL_ID', 'NAME_SHORT', 'VERTICAL_ORDER', 'ELEVATION_RELATIVE', 'HEIGHT_RELATIVE']

AREA_UNITS_DICT = {"SQUARE_FEET": 6, "SQUARE_METERS": 8}
AREA_UNIT_TYPE = {"SQUARE_FEET": "AREA_SQFT", "SQUARE_METERS": "AREA_SQMT"}
AREA_UNIT_SQFT = "SQUARE_FEET"
AREA_UNIT_SQMT = "SQUARE_METERS"

def validateFields(featureClass, fieldList):
    try:
        isFieldsValid = False
        existingFields = [] # empty list
        duplicateFields = []
        for field in arcpy.ListFields(featureClass): # iterate over fields
            existingFields.append(field.name)
        duplicateFields = set(existingFields) & set(fieldList)
        if (len(duplicateFields) == 0):
            isFieldsValid = False
        else:
            isFieldsValid = True
        return isFieldsValid, list(duplicateFields)
    except:
        return False,[]

def validateSheetName():
    useUpdatedSheetName = True
    proVersionName = str(arcpy.GetInstallInfo()['Version'])
    try:
        proVersionItem = proVersionName.split(".")[0:2]
        for idx, level in enumerate(proVersionItem):
            if idx == 0:
                proVersion = level + "."
            if idx == 1:
                proVersion += level

        pro = float(proVersion)
        if (pro >= 2.2):
            useUpdatedSheetName = True
        else:
            useUpdatedSheetName = False
        return useUpdatedSheetName
    except:
        #fall back. Check for pro versions 2.2,2.3, 2.4
        if (proVersionName.find("2.2") != -1 or proVersionName.find("2.3") != -1 or proVersionName.find("2.4") != -1):
            return True
        else:
            return False
    return
def applyValuesProperty():
    applyValues = True
    proVersionName = str(arcpy.GetInstallInfo()['Version'])
    try:
        proVersionItem = proVersionName.split(".")[0:2]
        for idx, level in enumerate(proVersionItem):
            if idx == 0:
                proVersion = level + "."
            if idx == 1:
                proVersion += level

        pro = float(proVersion)
        if (pro >= 2.3):
            applyValues = True
        else:
            applyValues = False
        return applyValues
    except:
        #fall back. Check for pro versions 2.3, 2.4
        if (proVersionName.find("2.3") != -1 or proVersionName.find("2.4") != -1):
            return True
        else:
            return False

def getDatabaseProperties(inputWorkspace):
    #Returns dictionary {isLegacyDatabase, indoorDatasetName, sdeQualifier}
    # For agidev1.AGI.Indoor, SDE qualifier = "agidev1.AGI", and dataset = Indoor. For feature class agidev1.AGI.Details, sdequaifier = agidev1.AGI
    try:
        arcpy.env.workspace = inputWorkspace

        isLegacyDataset = None
        indoorsDatasetName = None
        sdeQualifier = None

        legacyFeatures = [x.lower() for x in INDOORFEATURECLASSES]
        latestFeatures = [x.lower() for x in INDOORFEATURES]
        datasetList = arcpy.ListDatasets("*", "Feature")

        fcArr = []
        featuresLatestDataset = []
        if datasetList:
            for dataset in datasetList:
                datasetSplit = dataset.split(".")
                indoorsDatasetName = datasetSplit[-1]
                if len(datasetSplit) > 1:
                    sdeQualifier = ".".join(datasetSplit[:-1]) + "."
                else:
                    sdeQualifier = ""
                fcList = arcpy.ListFeatureClasses("*","",dataset)
                for fc in fcList:
                    fcNameArr = fc.split('.')
                    fcName = fcNameArr[len(fcNameArr) - 1]
                    if fcName.lower() in legacyFeatures:
                        fcArr.append(fcName.lower())
                    if fcName.lower() in latestFeatures:
                        featuresLatestDataset.append(fcName.lower())
                #Test if legacy dataset
                if len(set(legacyFeatures) - set(fcArr)) == 0:
                    isLegacyDataset = True
                    break
                #Test if non-legacy or latest dataset
                if len(set(latestFeatures) - set(featuresLatestDataset)) == 0:
                    isLegacyDataset = False
                    break

        return {"isLegacyDataset":isLegacyDataset, "indoorsDatasetName": indoorsDatasetName, "sdeQualifier": sdeQualifier}
    except:
        return None

def validateIndoorsWorkspace(inputWorkspace):
    #If this is a legacy dataset AIIM or INDOORS
    errorMessage = ""
    isDatabaseValid = False
    if inputWorkspace is None or arcpy.Exists(inputWorkspace) == False:
        errorMessage = "Input Workspace does not exist."
        isDatabaseValid = False
        return isDatabaseValid, errorMessage

    arcpy.env.workspace = inputWorkspace

    datasetList = arcpy.ListDatasets("*", "Feature")

    isAIIMDatasetExist = False
    fcArr = []
    if datasetList:
        for dataset in datasetList:
            if "AIIM" in dataset or "Indoors" in dataset:
                isAIIMDatasetExist = True
                fcList = arcpy.ListFeatureClasses("*","",dataset)
                for fc in fcList:
                    fcNameArr = fc.split('.')
                    fcName = fcNameArr[len(fcNameArr) - 1]
                    if fcName.lower() in INDOORFEATURECLASSES:
                        fcArr.append(fcName.lower())
                if fcList is None or len(fcList) == 0:
                    errorMessage = "Supplied Workspace is missing the Indoors feature classes."

    else:
        errorMessage = "Supplied Workspace is missing the Indoors feature datasets"

    if len(set(INDOORFEATURECLASSES) ^ set(fcArr)) == 0:
        isDatabaseValid = True
    else:
        errorMessage = ", ".join(list((set(INDOORFEATURECLASSES) ^ set(fcArr)))) + " feature class not found"
    return isDatabaseValid, errorMessage

def validateIndoorFields(inputWorkspace, databaseProperties, onlineLayer = False, inputLayersList = None):
    facilitiesRequiredFieldsLegacy = ["ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "FACILITY_ID", "HEIGHT_ABSOLUTE", "HEIGHT_RELATIVE", "ROTATION", "IMAGE_URL", "NAME", "NAME_LONG", "NAME_SUBTITLE", "SITE_ID", "USE_TYPE"]
    if not onlineLayer:
        arcpy.env.workspace = inputWorkspace
        isIndoorsLegacyDataset = databaseProperties["isLegacyDataset"]
        indoorsDatasetName = databaseProperties["indoorsDatasetName"]
        sdeQualifier = databaseProperties["sdeQualifier"]
    else:
        #layerList = [units_fc, details_fc, level_fc, facility_fc, section_fc, zone_fc]
        facility_fc = inputLayersList[3]
        fieldsFacility = [field.name.lower() for field in arcpy.ListFields(facility_fc)]
        isIndoorsLegacyDataset = True
        for fieldName in facilitiesRequiredFieldsLegacy:
            if fieldName.upper() not in fieldsFacility:
                isIndoorsLegacyDataset = False
                break

    # if  customDatasetName == aiimDataset or customDatasetName == indoorsDataset:
    if isIndoorsLegacyDataset:
        facilitiesRequiredFields = facilitiesRequiredFieldsLegacy
        levelsRequiredFields = ["ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "FACILITY_ID", "FACILITY_NAME",
                                "HEIGHT_ABSOLUTE", "HEIGHT_RELATIVE", "LEVEL_ID", "LEVEL_NUMBER", "NAME", "NAME_SHORT",
                                "NAME_SUBTITLE", "SITE_ID", "SITE_NAME", "VERTICAL_ORDER"]
        detailsRequiredFields = ["DETAIL_ID", "ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "FACILITY_ID",
                                 "FACILITY_NAME", "HEIGHT_ABSOLUTE", "HEIGHT_RELATIVE", "LEVEL_ID", "LEVEL_NAME",
                                 "LEVEL_NUMBER", "USE_TYPE", "VERTICAL_ORDER"]
        unitsRequiredFields = ["ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "FACILITY_ID", "FACILITY_NAME",
                               "HEIGHT_ABSOLUTE", "HEIGHT_RELATIVE", "LEVEL_ID", "LEVEL_NAME", "LEVEL_NUMBER", "NAME",
                               "NAME_LONG", "NAME_SUBTITLE", "SECTION_ID", "SECTION_NAME", "SITE_ID",
                               "SITE_NAME", "UNIT_ID", "USE_TYPE", "VERTICAL_ORDER"]
        sectionsRequiredFields = ["ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "FACILITY_ID", "FACILITY_NAME",
                                  "HEIGHT_ABSOLUTE", "HEIGHT_RELATIVE", "LEVEL_ID", "LEVEL_NAME", "LEVEL_NUMBER",
                                  "NAME","NAME_LONG", "NAME_SUBTITLE", "SECTION_ID", "SITE_ID", "SITE_NAME",
                                  "VERTICAL_ORDER"]
        zonesRequiredFields = ["ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "FACILITY_ID", "FACILITY_NAME",
                               "HEIGHT_ABSOLUTE", "HEIGHT_RELATIVE", "LEVEL_ID", "LEVEL_NAME", "LEVEL_NUMBER", "NAME",
                               "NAME_LONG", "NAME_SUBTITLE", "SITE_ID", "SITE_NAME", "VERTICAL_ORDER", "ZONE_ID"]
    else:
        facilitiesRequiredFields = ["FACILITY_ID", "NAME", "NAME_LONG", "SITE_ID", "HEIGHT_RELATIVE"]
        levelsRequiredFields = ["LEVEL_ID", "NAME", "NAME_SHORT", "LEVEL_NUMBER", "FACILITY_ID", "AREA_GROSS", "HEIGHT_RELATIVE", "VERTICAL_ORDER"]
        detailsRequiredFields = ["DETAIL_ID", "USE_TYPE", "LEVEL_ID", "HEIGHT_RELATIVE"]
        unitsRequiredFields = ["UNIT_ID", "USE_TYPE", "NAME", "NAME_LONG", "LEVEL_ID", "AREA_GROSS", "HEIGHT_RELATIVE"]
        sitesRequiredFields = ["SITE_ID", "NAME", "NAME_LONG"]
        sectionsRequiredFields = ["LEVEL_ID", "NAME", "NAME_LONG","SECTION_ID"]
        zonesRequiredFields = ["LEVEL_ID", "NAME","NAME_LONG", "ZONE_ID"]

    isValidGDB = True
    missingFields = []
    unitsfc = inputLayersList[0]
    detailsfc = inputLayersList[1]
    levelsfc = inputLayersList[2]
    facilitiesfc = inputLayersList[3]
    sectionsfc = inputLayersList[4]
    zonesfc = inputLayersList[5]

    #facilities
    fcNameArr = facilitiesfc.split('.')
    fcName = fcNameArr[len(fcNameArr) - 1]
    missingFields = findFields(facilitiesfc, facilitiesRequiredFields)
    if (len(missingFields)) > 0:
        return fcName, missingFields

    #levels
    fcNameArr = levelsfc.split('.')
    fcName = fcNameArr[len(fcNameArr) - 1]
    missingFields = findFields(levelsfc, levelsRequiredFields)
    if (len(missingFields)) > 0:
        if len(missingFields) == 1 and (
                missingFields[0] == "NAME" or missingFields[0] == "NAME_SHORT"):
            isValidGDB = True
        else:
            isValidGDB = False
        if not isValidGDB:
            isValidGDB = False
            if ("NAME" in missingFields and "NAME_SHORT" in missingFields):
                missingFields.remove("NAME_SHORT")
            elif ("NAME" in missingFields and "NAME_SHORT" not in missingFields):
                missingFields.remove("NAME")
            elif ("NAME_SHORT") in missingFields and "NAME" not in missingFields:
                missingFields.remove("NAME_SHORT")
            return fcName, missingFields

    #details
    fcNameArr = detailsfc.split('.')
    fcName = fcNameArr[len(fcNameArr) - 1]
    missingFields = findFields(detailsfc, detailsRequiredFields)
    if (len(missingFields)) > 0:
        return fcName, missingFields

    #units
    fcNameArr = unitsfc.split('.')
    fcName = fcNameArr[len(fcNameArr) - 1]
    missingFields = findFields(unitsfc, unitsRequiredFields)
    if (len(missingFields)) > 0:
        return fcName, missingFields

    #sections
    if (sectionsfc and arcpy.Exists(sectionsfc)):
        fcNameArr = sectionsfc.split('.')
        fcName = fcNameArr[len(fcNameArr) - 1]
        missingFields = findFields(sectionsfc, sectionsRequiredFields)
        if (len(missingFields)) > 0:
            return fcName, missingFields
    #zones
    if (zonesfc and arcpy.Exists(zonesfc)):
        fcNameArr = zonesfc.split('.')
        fcName = fcNameArr[len(fcNameArr) - 1]
        missingFields = findFields(zonesfc, zonesRequiredFields)
        if (len(missingFields)) > 0:
            return fcName, missingFields

    return "", missingFields


def calcArea(fc, method="GEODESIC"):
    # Calculate SQ FT
    if len(arcpy.ListFields(fc,"AREA_SQFT"))== 0:
        arcpy.AddField_management(fc, "AREA_SQFT", "DOUBLE", None, None, None, "Area (SF)", "NULLABLE", "NON_REQUIRED", None)
    if method == 'GEODESIC':
        arcpy.CalculateField_management(fc, "AREA_SQFT", "!Shape!.getArea('GEODESIC', 'squarefeet')", "PYTHON3")
    else:
        arcpy.CalculateField_management(fc, "AREA_SQFT", "!shape.area@squarefeet!", "PYTHON3")

    # Calculate SQ MT
    if len(arcpy.ListFields(fc, "AREA_SQMT")) == 0:
        arcpy.AddField_management(fc, "AREA_SQMT", "DOUBLE", None, None, None, "Area (SM)", "NULLABLE", "NON_REQUIRED", None)

    if method == 'GEODESIC':
        arcpy.CalculateField_management(fc, "AREA_SQMT", "!Shape!.getArea('GEODESIC', 'squaremeters')", "PYTHON3")
    else:
        arcpy.CalculateField_management(fc, "AREA_SQMT", "!shape.area@squaremeters!", "PYTHON3")
    return

def updateAreaFields(fc, area_units = 'Square Feet', method='GEODESIC'):
    # Calculate SQ FT
    if len(arcpy.ListFields(fc,"AREA_NET")) == 0 and len(arcpy.ListFields(fc,"AREA_GROSS")) == 0:
        return
    else:
        if area_units == AREA_UNIT_SQFT:
            if method == 'GEODESIC':
                arcpy.CalculateField_management(fc, "AREA_NET", "!Shape!.getArea('GEODESIC', 'squarefeet')", "PYTHON3")
                arcpy.CalculateField_management(fc, "AREA_GROSS", "!Shape!.getArea('GEODESIC', 'squarefeet')", "PYTHON3")
            else:
                arcpy.CalculateField_management(fc, "AREA_NET", "!shape.area@squarefeet!", "PYTHON3")
                arcpy.CalculateField_management(fc, "AREA_GROSS", "!shape.area@squarefeet!", "PYTHON3")
        elif area_units == AREA_UNIT_SQMT:
            if method == 'GEODESIC':
                arcpy.CalculateField_management(fc, "AREA_NET", "!Shape!.getArea('GEODESIC', 'squaremeters')", "PYTHON3")
                arcpy.CalculateField_management(fc, "AREA_GROSS", "!Shape!.getArea('GEODESIC', 'squaremeters')", "PYTHON3")
            else:
                arcpy.CalculateField_management(fc, "AREA_NET", "!shape.area@squaremeters!", "PYTHON3")
                arcpy.CalculateField_management(fc, "AREA_GROSS", "!shape.area@squaremeters!", "PYTHON3")
    return

def calcLength(fc):
    # Calculate FT
    if len(arcpy.ListFields(fc,"LENGTH_FT"))== 0:
        arcpy.AddField_management(fc, "LENGTH_FT", "DOUBLE", None, None, None, "Length (FT)", "NULLABLE", "NON_REQUIRED", None)
        arcpy.CalculateField_management(fc, "LENGTH_FT", "!shape.length@feet!", "PYTHON3")
    else:
        arcpy.CalculateField_management(fc, "LENGTH_FT", "!shape.length@feet!", "PYTHON3")

    # Calculate MT
    if len(arcpy.ListFields(fc,"LENGTH_MT"))== 0:
        arcpy.AddField_management(fc, "LENGTH_MT", "DOUBLE", None, None, None, "Length (MT)", "NULLABLE", "NON_REQUIRED", None)
        arcpy.CalculateField_management(fc, "LENGTH_MT", "!shape.length@meters!", "PYTHON3")
    else:
        arcpy.CalculateField_management(fc, "LENGTH_MT", "!shape.length@meters!", "PYTHON3")

    return

def calcRotation(levelsFC, facilitiesFC, facilityList):
    #calculate facility rotation
    orientation = {}
    idx = 0
    try:
        #Get unique facilities
        #facilityList = self.getUniqueValues(facilitiesFC, FACILITY_ID)
        facilityFields = arcpy.ListFields(facilitiesFC)
        field_names = [field.name.upper() for field in facilityFields]
        if "ROTATION" not in field_names:
            return
        for facility in facilityList:
            whereClause = FACILITY_ID + "='" + facility + "'"
            tempLyr = os.path.join("in_memory", "tempLevelLayer" + str(idx))
            mergedLevels = os.path.join("in_memory", "mergedLevels" + str(idx))
            arcpy.MakeFeatureLayer_management(levelsFC, tempLyr, whereClause)
            arcpy.Dissolve_management(tempLyr, mergedLevels, FACILITY_ID, None, "MULTI_PART", "DISSOLVE_LINES")
            minBGFCPath = os.path.join("in_memory", "mergedLevelMBG" + str(idx))
            arcpy.MinimumBoundingGeometry_management(mergedLevels, minBGFCPath , "RECTANGLE_BY_AREA", "NONE", None, "MBG_FIELDS")
            #get mbg orientation
            with arcpy.da.SearchCursor(minBGFCPath, ["FACILITY_ID","MBG_Orientation"]) as cursor:
                for row in cursor:
                    orientation[row[0]] = round(row[1],2)
            del cursor
        #update fc Rotation field
        with arcpy.da.UpdateCursor(facilitiesFC, [FACILITY_ID, "ROTATION"]) as uCursor:
            for row in uCursor:
                if row[0] in orientation.keys():
                    row[1] = orientation[row[0]]
                    uCursor.updateRow(row)
        del uCursor
    except Exception:
        return
    return

def calcElevation(featClass, fieldName):
    try:
        #"HEIGHT_RELATIVE"
        fields = arcpy.ListFields(featClass)
        field_names = [field.name.upper() for field in fields]
        if fieldName.upper() not in field_names:
            return
        with arcpy.da.UpdateCursor(featClass, ["SHAPE@Z", fieldName]) as updateCursor:
            for row in updateCursor:
                row[0] = row[1]
                updateCursor.updateRow(row)
    except Exception:
        return False


def listFcsInGDB(gdb, myindoorfc):
    ''' list all Feature Classes in a geodatabase, including inside Feature Datasets '''
    arcpy.env.workspace = gdb
    fcsArr = []
    for fds in arcpy.ListDatasets('','feature') + ['']:
        for fc in arcpy.ListFeatureClasses('{0}'.format(myindoorfc),'',fds):
            #yield os.path.join(fds, fc)
            fcsArr.append(os.path.join(fds, fc))
    return fcsArr

def getUniqueValues(table, field):
    try:
        with arcpy.da.SearchCursor(table, [field]) as cursor:
            return {row[0] for row in cursor}
    except:
        return []
def getFacilityLevels(facilityFC, levelFC, buildingName ):
    #Get building Id
    buildingName = str(buildingName).strip("'")
    whereclause = FACILITYFC_NAME + "= '" + buildingName + "'"
    buildingID = ""
    with arcpy.da.SearchCursor(facilityFC, [FACILITY_ID], whereclause) as cursor:
        for row in cursor:
            buildingID = row[0]
            break
    buildingID = str(buildingID).strip("'")
    whereClause = FACILITY_ID + "='" + str(buildingID) + "'"
    with arcpy.da.SearchCursor(levelFC, [LEVELS_NAME], whereClause) as cursor:
        return sorted({row[0] for row in cursor})

def getFacilityLevelNumbers(facilityFC, levelFC, buildingName ):
    #Get building Id
    whereclause = FACILITYFC_NAME + "= '" + buildingName + "'"
    buildingID = ""
    with arcpy.da.SearchCursor(facilityFC, [FACILITY_ID], whereclause) as cursor:
        for row in cursor:
            buildingID = row[0]
            break

    whereClause = FACILITY_ID + "='" + str(buildingID) + "'"
    with arcpy.da.SearchCursor(levelFC, [LEVEL_NUMBER], whereClause) as cursor:
        return sorted({row[0] for row in cursor})

def getFacilityLevelID(levelFC, facilityFC, facilityName, levelName):
    floorIDlist = []
    buildingID = ""
    #Get building Id
    if facilityName is not None:
        whereclause = FACILITYFC_NAME + "= '" + facilityName + "'"
        with arcpy.da.SearchCursor(facilityFC, [FACILITY_ID], whereclause) as cursor:
            for row in cursor:
                buildingID = row[0]
                break
    if (levelName is not None):
        whereClause = FACILITY_ID + "='" + str(buildingID) + "' AND " + LEVELS_NAME + " in ("
        levelName = levelName.split(";")
        for i, name in enumerate(levelName):
            whereClause = whereClause + "'" + name + "'"
            if (i < len(levelName) - 1):
                whereClause = whereClause + ", "
        whereClause = whereClause + ')'
    else:
        whereClause = "1 = 1"
    with arcpy.da.SearchCursor(levelFC, [LEVEL_ID], whereClause) as sCursor:
        for row in sCursor:
            if row[0] not in floorIDlist:
                floorIDlist.append(row[0])
    return floorIDlist

def getFacilityID(facilityFC, selectedName):
    buildingIDlist = []
    if (selectedName is not None):
        whereClause = FACILITYFC_NAME + " in ("
        selectedName = selectedName.split(";")
        for i, name in enumerate(selectedName):
            whereClause = whereClause + "'" + name + "'"
            if (i < len(selectedName) - 1):
                whereClause = whereClause + ", "
        whereClause = whereClause + ')'
    else:
        whereClause = "1 = 1"
    with arcpy.da.SearchCursor(facilityFC, [FACILITY_ID], whereClause) as sCursor:
        for row in sCursor:
            if row[0] not in buildingIDlist:
                buildingIDlist.append(row[0])

    return buildingIDlist

#Refactor later. Right now, created for Thin pathways fix
def getFacilityID_1(facilityFC, selectedName):
    buildingIDlist = []
    if (selectedName is not None):
        selectedNamelist = selectedName.split(";")
        s = handleSingleQuoteInList(selectedNamelist, True)
        whereClause = FACILITYFC_NAME + " IN " + "(" + s + ")"
    else:
        whereClause = "1 = 1"
    with arcpy.da.SearchCursor(facilityFC, [FACILITY_ID], whereClause) as sCursor:
        for row in sCursor:
            if row[0] not in buildingIDlist:
                buildingIDlist.append(row[0])
    return buildingIDlist

def getWorkspacePath(fc):
    dirname = os.path.dirname(arcpy.Describe(fc).catalogPath)
    desc = arcpy.Describe(dirname)
    if hasattr(desc, "datasetType") and desc.datasetType == 'FeatureDataset':
        dirname = os.path.dirname(dirname)
    return dirname

def isArcGISPro():
    #Useful if the tool is not launched from Pro UI
    try:
        aprx = arcpy.mp.ArcGISProject("CURRENT")
        if aprx:
            return True
    except Exception as e:
        return False

def addLayerToMap(fc_full_path):
    is_proUI = isArcGISPro()
    if is_proUI == False:
        return
    aprx = arcpy.mp.ArcGISProject("CURRENT")
    if aprx:
        activemap = aprx.activeMap
        layers = activemap.listLayers("*")
        myLayer = None
        for layer in layers:
            if layer.dataSource == fc_full_path:
                myLayer = layer
                return
        if myLayer == None:
            activemap.addDataFromPath(fc_full_path)
    return

def getQueryExpressionProcessedFeatures(featureClass, facilityIdField, levelIdField, isLegacyDataset=True):
    expression = facilityIdField + " in ("
    andExpression = levelIdField + " in ("

    uniqueFacilityIDs = getUniqueValues(featureClass, facilityIdField)
    if uniqueFacilityIDs is None or len(uniqueFacilityIDs) == 0:
        return
    for i, facilityID in enumerate(uniqueFacilityIDs):
        expression = expression + "'" + facilityID + "'"
        if (i < (len(uniqueFacilityIDs) -1 )):
            expression = expression + ", "

    uniqueLevelIDs = getUniqueValues(featureClass, levelIdField)
    if uniqueFacilityIDs is None or len(uniqueFacilityIDs) == 0:
        return
    for i, levelID in enumerate(uniqueLevelIDs):
        andExpression = andExpression + "'" + levelID + "'"
        if (i < (len(uniqueLevelIDs) -1 )):
            andExpression = andExpression + ", "

    if isLegacyDataset:
        expression = expression + ')' + " and " + andExpression + ")"
    else:
        expression = andExpression + ")"
    return expression

def appendIndoorFeatureClasses(featureClass, AIIMFeatureClass, isLegacyDataset=True):
    try:
        expression = ""
        featureCount = int(arcpy.GetCount_management(featureClass).getOutput(0))
        idx = 0
        dataExists = False
        expression = FACILITY_ID + " in ("
        andExpression = LEVEL_ID + " in ("

        uniqueFacilityIDs = getUniqueValues(featureClass, SCRATCHWKS_FACILITYID)
        if uniqueFacilityIDs is None or len(uniqueFacilityIDs) == 0:
            return False
        else:
            dataExists = True
        for i, facilityID in enumerate(uniqueFacilityIDs):
            expression = expression + "'" + facilityID + "'"
            if (i < (len(uniqueFacilityIDs) -1 )):
                expression = expression + ", "

        uniqueLevelIDs = getUniqueValues(featureClass, SCRATCHWKS_LEVELID)
        if uniqueFacilityIDs is None or len(uniqueFacilityIDs) == 0:
            return False
        else:
            dataExists = True
        for i, levelID in enumerate(uniqueLevelIDs):
            andExpression = andExpression + "'" + levelID + "'"
            if (i < (len(uniqueLevelIDs) -1 )):
                andExpression = andExpression + ", "

        expression = andExpression + ")"

        if dataExists == True:
            if deleteExistingData(featureClass, AIIMFeatureClass, expression) == False:
                return False
        return True
    except Exception:
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "PYTHON ERRORS:\nTraceback info:\n" + tbinfo + "\nError Info:\n" + str(sys.exc_info()[1])
        arcpy.AddError(pymsg)
        sys.exit(0)
        return

def getFacilitiesToUpdate(floorProperties):
    facilities = []
    facilityId = ""
    try:
        facilityIds = getUniqueValues(floorProperties, SCRATCHWKS_FACILITYID)
        for facilityId in facilityIds:
            expression = SCRATCHWKS_FACILITYID + "='" + facilityId + "'"
            with arcpy.da.SearchCursor(floorProperties, [SCRATCHWKS_FACILITYID, "PROCESS"], expression) as b_cursor:
                for row in b_cursor:
                    if row[1] == "N":
                        if row[0] in facilities:
                            facilities.remove(row[0])
                        break
                    elif row[1] == "Y" and row[0] not in facilities:
                        facilities.append(row[0])
            del b_cursor
    except:
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "PYTHON ERRORS:\nTraceback info:\n" + tbinfo + "\nError Info:\n" + str(sys.exc_info()[1])
        arcpy.AddError(pymsg)
        sys.exit(0)
        return
    finally:
        return facilities

def updateFacilities(AIIMGDB,featureClass, AIIMFeatureClass, scratchGDB, floorProperties, area_units = AREA_UNIT_SQFT, isLegacyDatabase = True, method = "GEODESIC"):
    try:
        if isinstance(AIIMGDB, dict): # True if the feature layer is online
            AIIMFeatureClassPath = AIIMGDB["FACILITIES"]
        else:
            AIIMFeatureClassPath = getQualifiedNameFC(AIIMGDB,AIIMFeatureClass, INDOORAIIMDATASETNAME)
        updatedFacilitiesCount = int(arcpy.GetCount_management(featureClass).getOutput(0))
        aiimFacilitiesCount = int(arcpy.GetCount_management(AIIMFeatureClassPath).getOutput(0))
        #
        if (aiimFacilitiesCount > 0):
            #at this point maybe an update or may not be an update
            #get unique values for featureclass
            fcUniqueValues = getUniqueValues(featureClass, SCRATCHWKS_FACILITYID)
            #get unique values for aiim
            aiimFacilities = getUniqueValues(AIIMFeatureClassPath, FACILITY_ID)
            commonFacilities = set(fcUniqueValues).intersection(aiimFacilities)#np.intersect1d(fcUniqueValues, aiimFacilities)
            if len(commonFacilities) > 0:
                #another check herhe. If process is set to y for all levels in a facility then just update the shape from feature class
                idsToUpdate = getFacilitiesToUpdate(floorProperties)
                #there are common facilities. need to update
                idsToMerge = []

                for id in commonFacilities:
                    fid = str(id).replace("{'", '')
                    fid = fid.replace("'}", '')
                    if fid not in idsToUpdate:
                        idsToMerge.append(fid)

                if len(idsToMerge) > 0:
                    facilityToUpdateLayer = "facilityToUpdateLayer"
                    expression = createExpressionFromValues(FACILITY_ID, list(idsToMerge))
                    arcpy.MakeFeatureLayer_management(AIIMFeatureClassPath, facilityToUpdateLayer, expression)
                    tempFacilities = "{0}\AIIM_Facilities".format(scratchGDB)
                    arcpy.management.CreateFeatureclass(scratchGDB, "AIIM_Facilities", "POLYGON", AIIMFeatureClassPath)
                    appendfields = 'FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},NAME_LONG,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_NUMBER "Facility Number" true true false 4 Short 0 0,First,#,{0},FACILITY_NUMBER,-1,-1;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1 ;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Facility_Layer,0,60;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},Facility_DocPath,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Facility_DocType,0,50;ADDRESS "Address" true true false 255 Text 0 0,First,#,{0},ADDRESS,0,255;UNIT "UNIT" true true false 10 Text 0 0,First,#,{0},UNIT,0,255;LOCALITY "LOCALITY" true true false 100 Text 0 0,First,#,{0},LOCALITY,0,255;PROVINCE "PROVINCE" true true false 50 Text 0 0,First,#,{0},PROVINCE,0,255;COUNTRY "COUNTRY" true true false 2 Text 0 0,First,#,{0},COUNTRY,0,255;POSTAL_CODE "POSTAL_CODE" true true false 50 Text 0 0,First,#,{0},POSTAL_CODE,0,255;DATE_BUILT "Date Built" true true false 8 Date 0 0,First,#,{0},BUILTDATE,-1,-1;LEVELS_TOTAL "Levels Total" true true false 4 Long 0 0,First,#,{0},LEVELS_TOTAL,-1,-1;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;ROTATION "Rotation" true true false 8 Double 0 0,First,#,{0},ROTATION,-1,-1'
                    arcpy.Append_management(featureClass, tempFacilities, "NO_TEST",
                                            appendfields.format(featureClass, AREA_UNIT_MEASURE=AREA_UNIT_TYPE[area_units]),
                                            None)
                    mergedFC = "{0}_merged".format(tempFacilities)
                    dissolvedFC = "{0}_dissolved".format(tempFacilities)
                    arcpy.Merge_management([tempFacilities,facilityToUpdateLayer], mergedFC)
                    arcpy.Dissolve_management(mergedFC, dissolvedFC, FACILITY_ID, None, "MULTI_PART", "DISSOLVE_LINES")
                    finalFacilitiesCount = int(arcpy.GetCount_management(dissolvedFC).getOutput(0))
                    if finalFacilitiesCount > 0:
                        shapeDictionary = {}
                        with arcpy.da.SearchCursor(dissolvedFC, [FACILITY_ID, "SHAPE@"]) as b_cursor:
                            for row in b_cursor:
                                shapeDictionary[row[0]] = row[1]
                    fields = arcpy.ListFields(AIIMFeatureClassPath)
                    field_names = [field.name.upper() for field in fields]
                    if "AREA_UM" in field_names and FACILITY_ID in field_names:
                        if (".gdb" in AIIMGDB):
                            with arcpy.da.Editor(str(AIIMGDB)):
                                with arcpy.da.UpdateCursor(AIIMFeatureClassPath, [FACILITY_ID, "SHAPE@", "AREA_UM"], expression) as uCursor:
                                    for row in uCursor:
                                        if area_units == AREA_UNIT_SQFT:
                                            row[2] = 6
                                        elif area_units == AREA_UNIT_SQMT:
                                            row[2] = 8
                                        facilityId = row[0]
                                        if facilityId in fcUniqueValues and facilityId in shapeDictionary:
                                            row[1] = shapeDictionary[facilityId]
                                            uCursor.updateRow(row)
                                            if facilityId in fcUniqueValues:
                                                fcUniqueValues.remove(facilityId)
                        else:
                            with arcpy.da.UpdateCursor(AIIMFeatureClassPath, [FACILITY_ID, "SHAPE@", "AREA_UM"],
                                                       expression) as uCursor:
                                for row in uCursor:
                                    if area_units == AREA_UNIT_SQFT:
                                        row[2] = 6
                                    elif area_units == AREA_UNIT_SQMT:
                                        row[2] = 8
                                    facilityId = row[0]
                                    if facilityId in fcUniqueValues and facilityId in shapeDictionary:
                                        row[1] = shapeDictionary[facilityId]
                                        uCursor.updateRow(row)
                                        if facilityId in fcUniqueValues:
                                            fcUniqueValues.remove(facilityId)
                        del uCursor
                    updateAreaFields(AIIMFeatureClassPath, area_units, method)
                if len(idsToUpdate) > 0:
                    tempFacilities = "{0}\AIIM_Facilities_Update".format(scratchGDB)
                    arcpy.management.CreateFeatureclass(scratchGDB, "AIIM_Facilities_Update", "POLYGON", AIIMFeatureClassPath)
                    appendfields = 'FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},NAME_LONG,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_NUMBER "Facility Number" true true false 4 Short 0 0,First,#,{0},FACILITY_NUMBER,-1,-1;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1 ;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Facility_Layer,0,60;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},Facility_DocPath,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Facility_DocType,0,50;ADDRESS "Address" true true false 255 Text 0 0,First,#,{0},ADDRESS,0,255;UNIT "UNIT" true true false 10 Text 0 0,First,#,{0},UNIT,0,255;LOCALITY "LOCALITY" true true false 100 Text 0 0,First,#,{0},LOCALITY,0,255;PROVINCE "PROVINCE" true true false 50 Text 0 0,First,#,{0},PROVINCE,0,255;COUNTRY "COUNTRY" true true false 2 Text 0 0,First,#,{0},COUNTRY,0,255;POSTAL_CODE "POSTAL_CODE" true true false 50 Text 0 0,First,#,{0},POSTAL_CODE,0,255;DATE_BUILT "Date Built" true true false 8 Date 0 0,First,#,{0},DATE_BUILT,-1,-1;LEVELS_TOTAL "Levels Total" true true false 4 Long 0 0,First,#,{0},LEVELS_TOTAL,-1,-1;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;ROTATION "Rotation" true true false 8 Double 0 0,First,#,{0},ROTATION,-1,-1'
                    arcpy.Append_management(featureClass, tempFacilities, "NO_TEST",
                                            appendfields.format(featureClass, AREA_UNIT_MEASURE=AREA_UNIT_TYPE[area_units]),
                                            None)
                    shapeDictionary = {}
                    expression = createExpressionFromValues(FACILITY_ID, idsToUpdate)
                    with arcpy.da.SearchCursor(tempFacilities, [FACILITY_ID, "SHAPE@"]) as b_cursor:
                        for row in b_cursor:
                            shapeDictionary[row[0]] = row[1]
                    if (".gdb" in AIIMGDB):
                        with arcpy.da.Editor(str(AIIMGDB)):
                            with arcpy.da.UpdateCursor(AIIMFeatureClassPath, [FACILITY_ID, "SHAPE@"], expression) as uCursor:
                                for row in uCursor:
                                    facilityId = row[0]
                                    if facilityId in idsToUpdate and facilityId in shapeDictionary:
                                        row[1] = shapeDictionary[facilityId]
                                        uCursor.updateRow(row)
                                        if facilityId in fcUniqueValues:
                                            fcUniqueValues.remove(facilityId)
                    else:
                        with arcpy.da.UpdateCursor(AIIMFeatureClassPath, [FACILITY_ID, "SHAPE@"], expression) as uCursor:
                            for row in uCursor:
                                facilityId = row[0]
                                if facilityId in idsToUpdate and facilityId in shapeDictionary:
                                    row[1] = shapeDictionary[facilityId]
                                    uCursor.updateRow(row)
                                    if facilityId in fcUniqueValues:
                                        fcUniqueValues.remove(facilityId)
                    del uCursor
                    updateAreaFields(AIIMFeatureClassPath, area_units, method)
                #update rest of the facilities in aiim
                if len(fcUniqueValues) > 0:
                    # need to check if fcUniqueValues are already in facilties. if yes exclude them
                    expression = createExpressionFromValues(FACILITY_ID, fcUniqueValues)
                    with arcpy.da.SearchCursor(AIIMFeatureClassPath, [FACILITY_ID], expression) as fcursor:
                        for row in fcursor:
                            existingFacilityId = row[0]
                            fcUniqueValues.remove(existingFacilityId)
                    # If there are some values still left then these are new facilities
                    if len(fcUniqueValues) > 0:
                        expression = createExpressionFromValues(FACILITY_ID, fcUniqueValues)

                        if isLegacyDatabase:
                            appendfields = 'FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},NAME_LONG,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_NUMBER "Facility Number" true true false 4 Short 0 0,First,#,{0},FACILITY_NUMBER,-1,-1;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1 ;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Facility_Layer,0,60;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},Facility_DocPath,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Facility_DocType,0,50;ADDRESS "Address" true true false 255 Text 0 0,First,#,{0},ADDRESS,0,255;UNIT "UNIT" true true false 10 Text 0 0,First,#,{0},UNIT,0,255;LOCALITY "LOCALITY" true true false 100 Text 0 0,First,#,{0},LOCALITY,0,255;PROVINCE "PROVINCE" true true false 50 Text 0 0,First,#,{0},PROVINCE,0,255;COUNTRY "COUNTRY" true true false 2 Text 0 0,First,#,{0},COUNTRY,0,255;POSTAL_CODE "POSTAL_CODE" true true false 50 Text 0 0,First,#,{0},POSTAL_CODE,0,255;DATE_BUILT "Date Built" true true false 8 Date 0 0,First,#,{0},DATE_BUILT,-1,-1;LEVELS_TOTAL "Levels Total" true true false 4 Long 0 0,First,#,{0},LEVELS_TOTAL,-1,-1;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;ROTATION "Rotation" true true false 8 Double 0 0,First,#,{0},ROTATION,-1,-1'
                            arcpy.Append_management(featureClass, AIIMFeatureClassPath, "NO_TEST",
                                                appendfields.format(featureClass, AREA_UNIT_MEASURE=AREA_UNIT_TYPE[area_units]),
                                                expression)
                        else:
                            appendfields = 'FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},NAME_LONG,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1'
                            arcpy.Append_management(featureClass, AIIMFeatureClassPath, "NO_TEST",
                                                appendfields.format(featureClass),
                                                expression)
            else:
                #no common facilities. should leave aiim alone and append whats in featureclass
                appendFacilities(featureClass,AIIMFeatureClassPath)
        else:
            #no facilities exist straight append
            appendFacilities(featureClass, AIIMFeatureClassPath, area_units)

        #return True
    except Exception:
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "PYTHON ERRORS:\nTraceback info:\n" + tbinfo + "\nError Info:\n" + str(sys.exc_info()[1])
        arcpy.AddError(pymsg)
        sys.exit(0)
        return
def createExpressionFromValues(field, uniqueValues):
    try:
        expression = ""
        if len(uniqueValues) > 0:
            expression = field + " in ("
            for i, value in enumerate(uniqueValues):
                expression = expression + "'" + str(value) + "'"
                if (i < (len(uniqueValues) -1 )):
                    expression = expression + ", "
            expression = expression +  ")"
        return expression
    except:
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "PYTHON ERRORS:\nTraceback info:\n" + tbinfo + "\nError Info:\n" + str(sys.exc_info()[1])
        arcpy.AddError(pymsg)
        sys.exit(0)
        return

def appendFacilities(featureClass, AIIMFeatureClass, area_units = AREA_UNIT_SQFT):
    appendfields = 'FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},NAME_LONG,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_NUMBER "Facility Number" true true false 4 Short 0 0,First,#,{0},FACILITY_NUMBER,-1,-1;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1 ;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Facility_Layer,0,60;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},Facility_DocPath,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Facility_DocType,0,50;ADDRESS "Address" true true false 255 Text 0 0,First,#,{0},ADDRESS,0,255;UNIT "UNIT" true true false 10 Text 0 0,First,#,{0},UNIT,0,255;LOCALITY "LOCALITY" true true false 100 Text 0 0,First,#,{0},LOCALITY,0,255;PROVINCE "PROVINCE" true true false 50 Text 0 0,First,#,{0},PROVINCE,0,255;COUNTRY "COUNTRY" true true false 2 Text 0 0,First,#,{0},COUNTRY,0,255;POSTAL_CODE "POSTAL_CODE" true true false 50 Text 0 0,First,#,{0},POSTAL_CODE,0,255;DATE_BUILT "Date Built" true true false 8 Date 0 0,First,#,{0},DATE_BUILT,-1,-1;LEVELS_TOTAL "Levels Total" true true false 4 Long 0 0,First,#,{0},LEVELS_TOTAL,-1,-1;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;ROTATION "Rotation" true true false 8 Double 0 0,First,#,{0},ROTATION,-1,-1'
    arcpy.Append_management(featureClass, AIIMFeatureClass, "NO_TEST",
                            appendfields.format(featureClass, AREA_UNIT_MEASURE=AREA_UNIT_TYPE[area_units]), None)

# def deleteExistingData_OLD(tempLayer, featureClass, expression):
#     try:
#         # Execute SelectLayerByAttribute to determine which features to delete
#         if arcpy.Exists(featureClass) == False:
#             return True
#         selectedFeatures = arcpy.SelectLayerByAttribute_management(featureClass, "NEW_SELECTION",expression)
#         if int(arcpy.GetCount_management(selectedFeatures).getOutput(0)) > 0:
#             lyrName = tempLayer + "_featurelyr"
#             outFeatures = tempLayer + "_lyr"
#             arcpy.MakeFeatureLayer_management (featureClass, lyrName, expression)
#             arcpy.CopyFeatures_management(lyrName,outFeatures )
#             arcpy.DeleteFeatures_management(selectedFeatures)
#             AIIM_UPDATE_FEATURECLASSES[outFeatures] = featureClass
#
#         return True
#     except Exception:
#         tb = sys.exc_info()[2]
#         tbinfo = traceback.format_tb(tb)[0]
#         pymsg = "PYTHON ERRORS:\nTraceback info:\n" + tbinfo + "\nError Info:\n" + str(sys.exc_info()[1])
#         arcpy.AddError(pymsg)
#         sys.exit(0)
#         return

#                         out_fc    Levels
def deleteExistingData(tempLayer, featureClass, expression):
    try:
        lyrName = "AIIM_featurelyr"
        outFeatures = tempLayer + "_lyr"
        arcpy.MakeFeatureLayer_management(featureClass, lyrName, expression)
        arcpy.SelectLayerByAttribute_management(lyrName, "NEW_SELECTION", expression)
        if int(arcpy.GetCount_management(lyrName).getOutput(0)) > 0:
            arcpy.CopyFeatures_management(lyrName,outFeatures)
            arcpy.DeleteFeatures_management(lyrName)
            AIIM_UPDATE_FEATURECLASSES[outFeatures] = featureClass
        return True
    except Exception:
        return


def getSDEQualifier(inputWorkspace):
    try:
        if not inputWorkspace:
            return
        arcpy.env.workspace = inputWorkspace
        databaseProperties = getDatabaseProperties(inputWorkspace)
        sdeQualifier = databaseProperties["sdeQualifier"]
        return sdeQualifier

    except Exception as e:
        return None

def getQualifiedNameDataset(inputWorkspace, datasetName):
    try:
        dataset = ""
        arcpy.env.workspace = inputWorkspace
        datasetList = arcpy.ListDatasets("*", "Feature")
        for dataset in datasetList:
            if (datasetName in dataset):
                dataset = dataset
                break
        return dataset
    except Exception:
        return ""

def getQualifiedNameFC(inputWorkspace, fcName, datasetName):
    try:
        fcPath = ""
        desc = arcpy.Describe(inputWorkspace)
        if hasattr(desc, 'workspaceType'):
            if desc.workspaceType == 'LocalDatabase':
                return fcName
        fcName = fcName.split("\\")[-1:]
        arcpy.env.workspace = inputWorkspace
        datasetList = arcpy.ListDatasets("*", "Feature")
        for dataset in datasetList:
            if (datasetName in dataset):
                fcsArray = arcpy.ListFeatureClasses("*", None, dataset)
                for fc in fcsArray:
                    if (fcName[0].lower() in fc.lower()):
                        fcPath = str(fc)
                        return fcPath
        if fcPath == "":
            fcPath = fcName
        return fcPath
    except Exception:
        return ""

def getQualifiedNameTable(inputWorkspace, tableName):
    qualifiedTableName = ""
    try:
        desc = arcpy.Describe(inputWorkspace)
        if hasattr(desc, 'workspaceType'):
            if desc.workspaceType == 'LocalDatabase':
                qualifiedTableName = os.path.join(inputWorkspace, tableName)
                if arcpy.Exists(qualifiedTableName):
                    return qualifiedTableName
                else:
                    return ""
        arcpy.env.workspace = inputWorkspace
        tables = arcpy.ListTables()
        for table in tables:
            if tableName in table:
                qualifiedTableName = os.path.join(inputWorkspace, table)
                return qualifiedTableName
        return ""
    except Exception:
        return ""

def getOrganizationID(url, token):
    orgId = ""
    try:
        portalSelfUrl = "{0}{1}".format(url, "sharing/rest/portals/self")
        params = {'f' : 'json', 'token' : token}
        response = requests.post(portalSelfUrl, params = params,verify = False)
        responseJson = response.json()
        for key in responseJson:
            if key == "id":
                orgId = responseJson[key]
                break
        return orgId
    except:
        return orgId

def fieldsExist(fc, test_field_list, parameterIndexErrorMessage):
    #Check if the feature class/table has required fields
    if test_field_list is not None:
        fields = arcpy.ListFields(fc)
        field_names = [field.name for field in fields]
        for test_field_name in test_field_list:
            if test_field_name not in field_names:
                #arcpy.AddError("{0} field not found in {1}.".format(test_field_name, fc))
                parameterIndexErrorMessage.setErrorMessage("{0} field not found in {1}.".format(test_field_name, fc))
                return False

def listFeatureClasses(workspace):
    arcpy.env.workspace = workspace

    datasets = arcpy.ListDatasets(feature_type='feature')
    datasets = [''] + datasets if datasets is not None else []
    fclist = []
    for ds in datasets:
        for fc in arcpy.ListFeatureClasses(feature_dataset=ds):
            path = os.path.join(arcpy.env.workspace, ds, fc)
            fclist.append(path)
    return fclist

def listTables(workspace):
    tableslist = []
    tables = arcpy.ListTables()
    for table in tables:
        tableslist.append(table)
    return tableslist

def getUniqueScratchFolderGdbName():
    now = datetime.datetime.now()
    now_stamp = '{:%Y_%m_%d_%H%M%S}'.format(now)
    gdb_short_name = 'scratch{}.gdb'.format(now_stamp)
    gdb_name = os.path.join(arcpy.env.scratchFolder, gdb_short_name)
    arcpy.CreateFileGDB_management(arcpy.env.scratchFolder, gdb_short_name)
    return gdb_name

def generateLevelName(level_number):
    #Generate level_number suffix to generate intermediate feature class or table names
    #The positive levels are given a prefix P and negative levels are given a prefix N followed by level numbers
    level_name = None
    if level_number < 0:
        level_name = "N" + str(abs(level_number))
    else:
        level_name = "P" + str(abs(level_number))
    return level_name

def getBuildingLevels(facilityFC, levelFC, buildingName):
    Facilities_F8_FACILITY_NAME = "NAME"
    Facilities_F8_FACILITYID = "FACILITY_ID"
    Levels_FACILITY_ID = "FACILITY_ID"
    Levels_NAME_SHORT = "NAME_SHORT"
    try:
        buildingName = handleSingleQuoteForQuery(buildingName)
        whereclause = Facilities_F8_FACILITY_NAME + " = " + buildingName
        buildingID = ""
        with arcpy.da.SearchCursor(facilityFC, [Facilities_F8_FACILITYID], whereclause) as cursor:
            for row in cursor:
                buildingID = row[0]
                break
        buildingID = handleSingleQuoteForQuery(buildingID)
        if buildingID is None:
            return None
        whereClause = Levels_FACILITY_ID + " = " + buildingID
        with arcpy.da.SearchCursor(levelFC, [Levels_NAME_SHORT], whereClause) as cursor:
            return sorted({row[0] for row in cursor})
    except:
        return None

def handleSingleQuoteForQuery(item):
    try:
        # Get rid of double quote at beginning and end of string
        if item[0] == "\"" and item[-1] == "\"":
            item = item.replace('"', "'")
        if item[0] == "'" and item[-1] == "'":
            item = item[1:-1]
        item = item.replace("'", "''")
        item = "'" + item + "'"
        return item
    except:
        return None

def handleSingleQuoteForCalcField(item):
    try:
        q = ""
        if "'" in item:
            parts = item.split("'")
            for part in parts:
                if len(q) == 0:
                    q = part
                else:
                    q = q + "'" + part
            item = q
        item = '"' + item + '"'
        return item
    except:
        return None

def handleSingleQuoteInList(valuelist, addQuote):
    #Takes a list of values, and returns comma separated values that can be used in a query
    #Use addQuote = True to create query such as Field1 IN (comma_separated_vvalues)
    #Otherwise, use addQuote = False
    try:
        q1 = ""
        for item in valuelist:
            item1 = ""
            #Get rid of double quote at beginning and end of string
            if item[0] == "\"" and item[-1] == "\"":
                item = item.replace('"',"'")
            #Prepare for query
            if item[0] == "'" and item[-1] == "'":
                item = item[1:-1]
                item = item.replace("'", "''")
                if addQuote:
                    item1 = "'" + item + "'"
                else:
                    item1 = item
            else:
                item = item.replace("'", "''") #mostly will not execute, playing safe
                if addQuote:
                    item1 = "'" + item + "'"
                else:
                    item1 = item
            if len(q1) == 0:
                q1 = item1
            else:
                q1 = q1 + "," + item1
        return q1
    except:
        return q1

def findFields(fc, fn_list):
    try:
        field_names = [field.name.upper() for field in arcpy.ListFields(fc)]
        missing_fields = []
        for fn in fn_list:
            if fn.upper() not in field_names:
                missing_fields.append(fn)

        return missing_fields
    except arcpy.ExecuteError:
        arcpy.AddIDMessage("ERROR", 180051)
        arcpy.AddError(arcpy.GetMessages(2))
        return None
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 180051)
        arcpy.AddError("{0}".format(e))
        return None

def checkFieldTypeMatch(fc, field_list):
    try:
        problem_fields = []
        for field_info in field_list:
            field = field_info[0]
            f_type = field_info[1]
            for f in arcpy.ListFields(fc):
                if f.baseName == field:
                    if (f_type in ("Integer", "Long") and f.type not in ("Integer", "Long")) or \
                            (f_type in ("Float", "Double") and f.type not in ("Float", "Double")) or \
                            f_type == "String" and f.type != "String" or \
                            f_type not in ("Integer", "Long", "Float", "Double", "String"):
                        problem_fields.append([field, f_type])
        return problem_fields
    except arcpy.ExecuteError:
        arcpy.AddIDMessage("ERROR", 180052)
        arcpy.AddError(arcpy.GetMessages(2))
        return None
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 180052)
        arcpy.AddError("{0}".format(e))
        return None


def getValidIndoorFeatureClass(gdb, inputDataset, featureClassName):
    # inputDataset = sde qualified name
    sdeQualifier = getSDEQualifier(gdb)
    indoorsPath = os.path.join(gdb, inputDataset, sdeQualifier + featureClassName)
    try:
        if arcpy.Exists(indoorsPath):
            return indoorsPath
        else:
            temp = arcpy.env.workspace
            arcpy.env.workspace = inputWorkspace
            datasetList = arcpy.ListDatasets("*", "Feature")
            if datasetList:
                for dataset in datasetList:
                    fcList = arcpy.ListFeatureClasses("*", "", dataset)
                    for fc in fcList:
                        fcNameArr = fc.split('.')
                        fcName = fcNameArr[len(fcNameArr) - 1]
                        if fcName.lower() == featureClassName.lower():
                            return os.path.join(gdb, dataset, sdeQualifier + featureClassName)
            arcpy.env.workspace = temp
    except Exception as e:
        return None


def getDatabasePropertiesUsingLevelsFeatureClass(levelsFC):
        try:
            legacyFieldNames = ['LEVEL_ID', 'ACCESS_TYPE', 'NAME', 'NAME_SHORT', 'NAME_SUBTITLE', 'LEVEL_NUMBER',
                                'DESCRIPTION', 'IMAGE_URL', 'SITE_ID', 'SITE_NAME', 'FACILITY_ID', 'FACILITY_NAME',
                                'AREA_GROSS', 'AREA_NET', 'AREA_UM', 'ELEVATION_ABSOLUTE', 'ELEVATION_RELATIVE',
                                'HEIGHT_ABSOLUTE', 'HEIGHT_RELATIVE', 'VERTICAL_ORDER', 'SOURCE_NAME', 'SOURCE_PATH',
                                'SOURCE_TYPE', 'SOURCE_METHOD']
            fields = arcpy.ListFields(levelsFC)
            names = [field.name for field in fields]
            if len(set(legacyFieldNames) - set(names)) == 0:
                isLegacyDataset = True
            else:
                isLegacyDataset = False

            levelPath = arcpy.Describe(levelsFC).catalogPath
            array = levelPath.split("\\")   #['Database Connections', 'agitest1.AGI.IndoorSQL01', 'agitest1.AGI.Levels']
            qualifiedDataset = array[-2]
            datasetSplit = qualifiedDataset.split(".")

            indoorsDatasetName = datasetSplit[-1]
            if len(datasetSplit) > 1:
                sdeQualifier = ".".join(datasetSplit[:-1]) + "."
            else:
                sdeQualifier = ""
            databaseProps = {"isLegacyDataset": isLegacyDataset,
                             "indoorsDatasetName": indoorsDatasetName,
                             "sdeQualifier": sdeQualifier}
            return databaseProps

        except:
            return None

def getRelativeElevationFromLevels(levelFeatures):
    try:
        #Get levelID, relative elevation from levels feature class
        levelidElevation = {}
        for row in arcpy.da.SearchCursor(levelFeatures, ["OID@", "SHAPE@", "LEVEL_ID"]):
            zvalue = None
            for part in row[1]:
                for pnt in part:
                    if pnt:
                        zvalue = pnt.Z
                        break
                if zvalue: break
            levelidElevation[row[2]] = zvalue

        return levelidElevation
    except:
        return None

def createDictionary(fc, keyField, valueField):
    if not fc:
        return {}
    fields = arcpy.ListFields(fc)
    fieldNames = [field.name for field in fields]
    if keyField.upper() not in fieldNames or valueField.upper() not in fieldNames:
        return {}
    dict = {}
    with arcpy.da.SearchCursor(fc, [keyField, valueField]) as cursor:
        for row in cursor:
            if row[0]:
                dict[row[0]] = row[1]
    return dict

def isLayerOnline(fc):
    try:
        import re
        desc = arcpy.Describe(fc)
        urlPath = desc.catalogPath
        regex = ("((http|https)://)(www.)?" +
                 "[a-zA-Z0-9@:%._\\+~#?&//=]" +
                 "{2,256}\\.[a-z]" +
                 "{2,6}\\b([-a-zA-Z0-9@:%" +
                 "._\\+~#?&//=]*)")
        p = re.compile(regex)
        if re.search(p, urlPath):
            #string matched the url pattern
            response = requests.get(urlPath)
            if response and response.status_code == 200 and desc.dataType == "FeatureLayer":
                return True
        return False
    except:
        return False