from __future__ import print_function
import arcpy
import os
import pandas as pd
import numpy as np
import ast
import sys
import datetime
import uuid
from collections import defaultdict
import IndoorsUtilsModule
import requests

class LicenseError(Exception):
    pass


class ImportFloorplansToIndoorsGDB(object):
    isLegacyDataset = None
    indoorsDatasetName = None
    sdeQualifier = None
    onlineLayer = False

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.execute()

    def createWorkingGeodatabases(self, now_stamp, today_stamp):
        # Establish Source + Target Data
        #Creating folder with UUID name so multiple instances of the script can run on the same machine at the same time
        uniqueFolder = str(uuid.uuid4()).replace("-", "")
        workingFolder = os.path.join(arcpy.env.scratchFolder, uniqueFolder)
        os.mkdir(workingFolder)

        # Set as Folder in Toolbox Parameter configuration or "C:\ArcGIS\Projects\Facilities_Indoors_Test"
        workingGDBFolder = os.path.join(workingFolder, "Working")
        if arcpy.Exists(workingGDBFolder):
            arcpy.Delete_management(workingGDBFolder)
            # Clean up from last run
            # #Can not delete at end because of lock from query table
        if not arcpy.Exists(workingGDBFolder):
            arcpy.CreateFolder_management(workingFolder, "Working")
            # Check for Working Folder
            # If it doesn't exist, create it

        consolidatedGDBFolder = os.path.join(workingFolder, "Consolidated")
        consolidatedGDBName = "Indoors_Consolidated_" + now_stamp
        consolidatedGDB = os.path.join(consolidatedGDBFolder, consolidatedGDBName + ".gdb")
        if not arcpy.Exists(consolidatedGDBFolder):
            arcpy.CreateFolder_management(workingFolder,"Consolidated")
            # Check for Working Folder
            # If it doesn't exist, create it
            # Also create Consolidated Database
            arcpy.CreateFileGDB_management(consolidatedGDBFolder, consolidatedGDBName, "CURRENT")

        if arcpy.Exists(consolidatedGDBFolder):
            # If it exists, empty the existing database
            QA_fc_templist = arcpy.ListFeatureClasses(consolidatedGDB)  # Delete any existing feature classes in the
            # QA Database
            for x in QA_fc_templist:
                if arcpy.Exists(x):
                    del x
                else:
                    pass
            QA_tbl_templist = arcpy.ListTables(consolidatedGDB)  # Delete any existing tables in the QA Database
            for x in QA_tbl_templist:
                if arcpy.Exists(x):
                    del x
                else:
                    pass

        if not arcpy.Exists(consolidatedGDB):
            arcpy.CreateFileGDB_management(consolidatedGDBFolder, consolidatedGDBName, "CURRENT")

        #  CREATE QA FOLDER AND DATABASE
        QAGDBFolder = os.path.join(workingFolder, "Review")
        QA_GDB_Name = "QA_" + today_stamp
        QA_GDB = os.path.join(QAGDBFolder, QA_GDB_Name + ".gdb")
        if not arcpy.Exists(QAGDBFolder):
            # Check for Review Folder
            # If it doesn't exist, create it
            # Also create QA database
            arcpy.CreateFolder_management(workingFolder, "Review")
            arcpy.CreateFileGDB_management(QAGDBFolder, QA_GDB_Name, "CURRENT")

        if arcpy.Exists(QAGDBFolder):
            # If it exists, empty the existing database
            QA_fc_templist = arcpy.ListFeatureClasses(QA_GDB)  # Delete any existing feature classes in the QA Database
            for x in QA_fc_templist:
                if arcpy.Exists(x):
                    del x
                else:
                    pass
            QA_tbl_templist = arcpy.ListTables(QA_GDB)  # Delete any existing tables in the QA Database
            for x in QA_tbl_templist:
                if arcpy.Exists(x):
                    del x
                else:
                    pass

        if not arcpy.Exists(QA_GDB):
            arcpy.CreateFileGDB_management(QAGDBFolder, QA_GDB_Name, "CURRENT")
        OutputGDB = os.path.join(workingFolder, "SharedOutput.gdb")
        if not arcpy.Exists(OutputGDB): arcpy.CreateFileGDB_management(workingFolder, "SharedOutput","CURRENT")  # Check for CADScratch GDB.  If it doesn't exist, create it.
        return OutputGDB, workingGDBFolder, consolidatedGDB, QA_GDB

    def validateColumnNames(self, excelColumns, requiredColumns, excelFileName, sheetName):
        try:
            columns_valid = False
            invalid_column = False
            arcpy.AddIDMessage("INFORMATIVE", 180129, sheetName)
            for item in requiredColumns:
                if not item in excelColumns:
                    arcpy.AddIDMessage("ERROR", 180130, item, sheetName)
                    invalid_column = True
            if not invalid_column:
                columns_valid = True
            return columns_valid
        except Exception as e:
            arcpy.AddError("{0}".format(e))
            return False

    def validateCADMappingInputs(self, mappingTable, excelFileName):
        try:
            inputs_valid = False
            #validate columns after export to table
            invalid_column = False
            for field in IndoorsUtilsModule.CAD_COLUMNS:
                if len(arcpy.ListFields(mappingTable, field)) == 0:
                    arcpy.AddIDMessage("ERROR", 180131, field, mappingTable)
                    invalid_column = True
            if invalid_column:
                return False
            #validate required fields
            invalid_inputs = False
            emptyLayer = "Layer IN ('')"
            requiredColumns = IndoorsUtilsModule.CAD_REQUIRED_COLUMNS
            with arcpy.da.SearchCursor(mappingTable, requiredColumns) as cursor:
                for row in cursor:
                    facilities = row[0]
                    facilityLines = row[1]
                    levels = row[2]
                    levelLines = row[3]
                    units = row[4]
                    unitLines = row[5]
                    if facilities == emptyLayer and facilityLines == emptyLayer:
                        arcpy.AddIDMessage("ERROR", 180132, requiredColumns[0], requiredColumns[1])
                        invalid_inputs = True
                    if levels == emptyLayer and levelLines == emptyLayer:
                        arcpy.AddIDMessage("ERROR", 180132, requiredColumns[2], requiredColumns[3])
                        invalid_inputs = True
                    if (units == emptyLayer and unitLines == emptyLayer):
                        arcpy.AddIDMessage("ERROR", 180132, requiredColumns[4], requiredColumns[5])
                        invalid_inputs = True
            if not invalid_inputs:
                inputs_valid = True
            return inputs_valid
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
            return False
        except Exception as e:
            arcpy.AddError("{0}".format(e))
            return False

    def validateFacilitiesColumns(self, table, excelFileName):
        columns_valid = False
        try:
            invalid_columns = False
            sheetName = IndoorsUtilsModule.FACILITIES_SHEETNAME
            requiredColumns = IndoorsUtilsModule.FACILITIES_REQUIRED_COLUMNS
            colNames = IndoorsUtilsModule.FACILITY_FLDS
            with arcpy.da.SearchCursor(table, colNames) as cursor:
                for row in cursor:
                    siteId = row[0]
                    facilityID = row[2]
                    name = row[4]
                    dateBuild = row[13]
                    elevRalative = row[15]
                    heightRelative = row[17]

                    #required fields check
                    if siteId == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, requiredColumns[0], sheetName)
                        invalid_columns = True
                    if facilityID  == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, requiredColumns[1], sheetName)
                        invalid_columns = True
                    if name  == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, requiredColumns[2], sheetName)
                        invalid_columns = True
                    if elevRalative is None:
                        arcpy.AddIDMessage("ERROR", 180135, requiredColumns[3], sheetName)
                        invalid_columns = True
                    if heightRelative is None:
                        arcpy.AddIDMessage("ERROR", 180135, requiredColumns[4], sheetName)
                        invalid_columns = True

                    #fields check
                    floatFields = IndoorsUtilsModule.BLDG_FLOAT_FIELDS
                    facilityNumber = row[3]
                    levelNumber = row[14]
                    elevAbsolute = row[16]
                    heightAbsolute = row[18]
                    rotation = row[19]
                    if facilityNumber and isinstance(facilityNumber, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, IndoorsUtilsModule.BLDG_INT_FIELDS[0], "Int")
                        invalid_columns = True
                    if levelNumber and isinstance(levelNumber, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, IndoorsUtilsModule.BLDG_INT_FIELDS[1], "Int")
                        invalid_columns = True
                    if dateBuild and isinstance(dateBuild, datetime.date) == False:
                        arcpy.AddIDMessage("ERROR", 180136, IndoorsUtilsModule.BLDG_DT_FIELDS[0], "Date")
                        invalid_columns = True
                    if isinstance(elevRalative, float) == False and isinstance(elevRalative, int) == False and self.isLegacyDataset:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[0], "Float")
                        invalid_columns = True
                    if isinstance(heightRelative, float) == False and isinstance(heightRelative, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[2], "Float")
                        invalid_columns = True
                    if elevAbsolute and isinstance(elevAbsolute, float) == False and isinstance(elevAbsolute, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[1], "Float")
                        invalid_columns = True
                    if heightAbsolute and isinstance(heightAbsolute, float) == False and isinstance(heightAbsolute, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[3], "Float")
                        invalid_columns = True
                    if rotation and isinstance(rotation, float) == False and isinstance(rotation, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[4], "Float")
                        invalid_columns = True
                    mergeLevels = row[20]
                    if mergeLevels == "" or ( mergeLevels.upper() != "Y" and mergeLevels.upper() != "N"):
                        arcpy.AddIDMessage("ERROR", 180137, colNames[20], sheetName)
                        invalid_columns = True
            if not invalid_columns:
                columns_valid = True
            return columns_valid
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
            return False
        except Exception as e:
            arcpy.AddError("{0}".format(e))
            return False

    def validateLevelsColumns(self, table, PathTable, excelFileName):
        columns_valid = False
        try:
            invalid_columns = False
            sheetName = IndoorsUtilsModule.LEVELS_SHEETNAME
            if arcpy.Exists(PathTable):
                requiredColumns = IndoorsUtilsModule.LEVELS_REQUIRED_SEPERATEDPATHS
                colNames = IndoorsUtilsModule.FLOOR_FIELDS_SEPERATEDPATHS
                field_names = [f.name for f in arcpy.ListFields(table)]
                if ("SOURCE_PATH" in field_names):
                    arcpy.AddIDMessage("ERROR", 180161)
                    return False
            else:
                requiredColumns = IndoorsUtilsModule.LEVELS_REQUIRED_COLUMNS
                colNames = IndoorsUtilsModule.FLOOR_FIELDS
            floatFields = IndoorsUtilsModule.FLOOR_FLOAT_FIELDS
            levelCount = 0
            #validate ony rows that have Process set to Y
            with arcpy.da.SearchCursor(table, colNames, "PROCESS='Y'") as cursor:
                for row in cursor:
                    if arcpy.Exists(PathTable):
                        facilityID = row[0]
                        levelID = row[1]
                        nameShort = row[2]
                        levelNumber = row[6]
                        verticalOrder = row[7]
                        elevRelative = row[8]
                        heightRelative = row[10]
                        elevAbsolute = row[9]
                        heightAbsolute = row[11]
                    else:
                        sourcePath = row[0]
                        facilityID = row[1]
                        levelID = row[2]
                        nameShort = row[3]
                        levelNumber = row[7]
                        verticalOrder = row[8]
                        elevRelative = row[9]
                        heightRelative = row[11]
                        elevAbsolute = row[10]
                        heightAbsolute = row[12]
                        if sourcePath == "nan" or arcpy.Exists(sourcePath) == False:
                            arcpy.AddIDMessage("WARNING", 180159, levelID, "SOURCE_PATH")
                        #else:
                    if facilityID == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, "FACILITY_ID", sheetName)
                        invalid_columns = True
                    if levelID == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, "LEVEL_ID", sheetName)
                        invalid_columns = True
                    if nameShort == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, "NAME_SHORT", sheetName)
                        invalid_columns = True
                    if len(nameShort) > 4:
                        arcpy.AddIDMessage("ERROR", 180139, "NAME_SHORT", sheetName)
                        invalid_columns = True
                    if verticalOrder is None:
                        arcpy.AddIDMessage("ERROR", 180135, "VERTICAL_ORDER", sheetName)
                        invalid_columns = True
                    if elevRelative is None:
                        arcpy.AddIDMessage("ERROR", 180135, "ELEVATION_RELATIVE", sheetName)
                        invalid_columns = True
                    if heightRelative is None:
                        arcpy.AddIDMessage("ERROR", 180135, "HEIGHT_RELATIVE", sheetName)
                        invalid_columns = True
                    if levelNumber and isinstance(levelNumber, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, IndoorsUtilsModule.FLOOR_INT_FIELDS[1], "Int")
                        invalid_columns = True
                    if verticalOrder and isinstance(verticalOrder, int) == False:
                        arcpy.AddIDMessage("ERROR", 180136, IndoorsUtilsModule.FLOOR_INT_FIELDS[0], "Int")
                        invalid_columns = True
                    if isinstance(elevRelative, float) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[0], "Float")
                        invalid_columns = True
                    if isinstance(heightRelative, float) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[2], "Float")
                        invalid_columns = True
                    if elevAbsolute and isinstance(elevAbsolute, float) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[1], "Float")
                        invalid_columns = True
                    if heightAbsolute and isinstance(heightAbsolute, float) == False:
                        arcpy.AddIDMessage("ERROR", 180136, floatFields[3], "Float")
                        invalid_columns = True
                    if arcpy.Exists(PathTable):
                        closeDoors = row[12]
                        process_field = row[13]
                    else:
                        closeDoors = row[13]
                        process_field = row[14]
                    if closeDoors == "" or (closeDoors.upper() != "Y" and closeDoors.upper() != "N"):
                        arcpy.AddIDMessage("ERROR", 180137, colNames[13], sheetName)
                        invalid_columns = True

            #validate process column
            with arcpy.da.SearchCursor(table, "PROCESS") as cursor:
                for row in cursor:
                    process = row[0]
                    if process == "" or (process.upper() != "Y" and process.upper() != "N"):
                        arcpy.AddIDMessage("ERROR", 180137, "PROCESS", sheetName)
                        invalid_columns = True
                    if process.upper() == "Y":
                        levelCount+=1
            if not invalid_columns and levelCount > 0:
                columns_valid = True
            return columns_valid
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
            return False
        except Exception as e:
            arcpy.AddError("{0}".format(e))
            return False

    def validateCADSourceSheetValues(self, df):
        # Validate values in spreadsheet
        pathmatrix = df.values
        fac_tdf = [tuple(x) for x in pathmatrix]
        for row in fac_tdf:
            # If both are non-NAN value, do the comparison, else one is NAN, we can forgo the comparison
            if ((str(row[0]) != "nan") and (str(row[1]) != str("nan"))) and (str(row[0]) == str(row[1])):
                arcpy.AddIDMessage("ERROR", 180132, "FACILITIES", "FACILITY_LINES")
                return False
            if ((str(row[2]) != "nan") and (str(row[3]) != str("nan"))) and (str(row[2]) == str(row[3])):
                arcpy.AddIDMessage("ERROR", 180132, "LEVELS", "LEVEL_LINES")
                return False
            if ((str(row[12]) != "nan") and (str(row[13]) != str("nan"))) and (str(row[12]) == str(row[13])):
                arcpy.AddIDMessage("ERROR", 180132, "UNITS", "UNIT_LINES")
                return False
        return True

    def validateUnitLines(self, mydict):

        #This function executes if the units_lines has valid value

        # User has specified close_doors = Y, but has not provided correct data for openings
        # If openings was provided, the corresponding CAD layer does not exist
        # Warn the user and continue
        try:
            details_col_data = mydict['DETAILS']
            openings_col_data = mydict['OPENINGS'] #if no OPENINGS is defined, this will be [''].
            if (len(openings_col_data) == 1 and openings_col_data[0].strip() == '') or (len(openings_col_data) == 0):
                arcpy.AddIDMessage("WARNING", 180162, "any")
                return False
            else:
                for opening in openings_col_data:
                    if not opening in details_col_data:
                        arcpy.AddIDMessage("WARNING", 180162, "correct")
                        return False
            return True
        except:
            return False

    def validateUnitPolygons(self, mydict, close_doors):
        # This function executes if the units (polygons) has valid value
        # If units are being generated from polygons (UNIT column) and CLOSE_DOORS = Y, report warning 180163 to user.
        # User has specified close_doors = Y or N
        # If the user is importing Units from CAD polygon data (via the UNITS column),
        # AND ((OPENINGS column is not empty) OR (CLOSE_DOORS is not empty))
        # Warn the user and continue
        try:
            units_col_data = mydict['UNIT']  # list is returned, emoty will be ['']
            openings_col_data = mydict['OPENINGS']

            units_empty = len(units_col_data) == 1 and len(units_col_data[0].strip()) == 0 #if empty, this will return false
            openings_empty = len(openings_col_data) == 1 and len(openings_col_data[0].strip()) == 0 #if empty, this will return false
            if (close_doors and not units_empty and not openings_empty) or (close_doors == "Y" and not units_empty):
                arcpy.AddIDMessage("WARNING", 180163) #Units were imported in GDB, but units and openings values in excel were ignored
                return False
            return True
        except:
            return False


    def updatePathColumns(self, PathProperties, LevelProperties):
        sheetName = IndoorsUtilsModule.PATH_SHEETNAME
        colNames = IndoorsUtilsModule.PATHS_TEXT_FIELDS

        levlColNames = IndoorsUtilsModule.FLOOR_FIELDS_SEPERATEDPATHS
        # validate ony rows that have Process set to Y
        keyDict = {}
        pathDict = {}
        isPathSheetValid = False
        arcpy.AddIDMessage("INFORMATIVE", 180129, sheetName)
        try:
            count = int(arcpy.GetCount_management(PathProperties).getOutput(0))

            if (count == 0):
                # there is no source paths to process.
                isPathSheetValid = False
            else:
                val_res = arcpy.ValidateJoin_management(PathProperties, "LEVEL_ID", LevelProperties, "LEVEL_ID",
                                                        "KEEP_ALL")
                row_count = int(val_res[1])
                # update floor properties as before
                if row_count >= 1:
                    arcpy.AddField_management(LevelProperties, "SOURCE_PATH", "TEXT", None, None, None, "SOURCE_PATH",
                                              "NULLABLE", "NON_REQUIRED", None)

                    with arcpy.da.SearchCursor(LevelProperties, "LEVEL_ID", "PROCESS='Y'") as cursor:
                        for row in cursor:
                            #get unique levels and path from path table
                            whereClause = "LEVEL_ID='" + row[0] + "'"
                            with arcpy.da.SearchCursor(PathProperties, "SOURCE_PATH", whereClause) as pathscursor:
                                for pathrow in pathscursor:
                                    if row[0] not in keyDict:
                                        keyDict[row[0]] = pathrow[0]

                    with arcpy.da.UpdateCursor(LevelProperties, ["SOURCE_PATH","LEVEL_ID"], "PROCESS='Y'") as ucursor:
                        for row in ucursor:
                            if (row[1] in keyDict):
                                row[0] = keyDict[row[1]]
                                ucursor.updateRow(row)
                    del ucursor
                    isPathSheetValid = True
                else:
                    isPathSheetValid = False
            return isPathSheetValid
        except arcpy.ExecuteError:
            return False
        except Exception as e:
            return False

    def transposeRequiredFields(self, mydfnonan, ExcelTemplate, customAnnotationSheetName):
        #This function will take required fields from the custom annotation sheet and populate the Layer to Feature Class sheet
        # this will also preserve the backward compatibility
        if not customAnnotationSheetName:
            return mydfnonan
        CADLayerMerge_flds = ["SOURCE_ANNOTATION", "TARGET_FEATURE_CLASS", "TARGET_FIELD_NAME"]
        convdict = {}
        for item in CADLayerMerge_flds:
            thisdict = {item: str}
            convdict.update(thisdict)
        df = pd.read_excel(ExcelTemplate, sheet_name=customAnnotationSheetName, header=0, converters=convdict, na_values='')
        existingCols = set(df.columns)
        reqdCols = set(CADLayerMerge_flds)
        missingCols = reqdCols - existingCols
        if len(missingCols) > 0:
            arcpy.AddIDMessage("ERROR", 180134, "".join(missingCols), customAnnotationSheetName)
            return None
        dflist = df.values.tolist()
        unitIDFieldIndex = 0
        unitNameFieldIndex = 0
        unitTypeFieldIndex = 0
        for idx, item in enumerate(dflist):
            #6,7 - zones
            anno = item[0]
            fc = item[1]
            fieldname = item[2]
            if anno and anno != "nan":
                if fieldname == "ZONE_ID" and fc == "ZONES":
                    mydfnonan.iloc[0,6] = anno
                if fieldname == "NAME" and fc == "ZONES":
                    mydfnonan.iloc[0, 7] = anno
                #10,11 - sections
                if fieldname == "SECTION_ID" and fc == "SECTIONS":
                    mydfnonan.iloc[0, 10] = anno
                if fieldname == "NAME"  and fc == "SECTIONS":
                    mydfnonan.iloc[0, 11] = anno
                #14,15,16 - units
                if fieldname == "UNIT_ID" and fc == "UNITS":
                    mydfnonan.iloc[unitIDFieldIndex, 14] = anno
                    unitIDFieldIndex += 1
                if fieldname == "NAME" and fc == "UNITS":
                    mydfnonan.iloc[unitNameFieldIndex, 15] = anno
                    unitNameFieldIndex += 1
                if fieldname == "USE_TYPE" and fc == "UNITS":
                    mydfnonan.iloc[unitTypeFieldIndex, 16] = anno
                    unitTypeFieldIndex += 1
        mydfnonan = mydfnonan.fillna('')
        return mydfnonan

    def handleMultipleCadFiles(self, floorPropertiesTable, PathPropertiesTable):
        try:
            # For each level_id, get all source paths from PathProperties table
            floorPropertiesTableCopy = floorPropertiesTable + "Copy"
            floorTableView = "floorTableView"
            arcpy.MakeTableView_management(floorPropertiesTable, floorTableView)
            sourcePathTableView = "sourcePathTableView"
            arcpy.MakeTableView_management(PathPropertiesTable, sourcePathTableView)
            arcpy.management.AddJoin(floorTableView, "LEVEL_ID", sourcePathTableView, "LEVEL_ID", "KEEP_ALL")
            countSourcepath = int(arcpy.GetCount_management(floorTableView)[0])
            arcpy.env.qualifiedFieldNames = False
            arcpy.management.CopyRows(floorTableView, floorPropertiesTableCopy)
            # SOURCE_PATH = SOURCE_PATH_1
            arcpy.management.CalculateField(floorPropertiesTableCopy, "SOURCE_PATH", "!SOURCE_PATH_1!", "PYTHON3", '', "TEXT", "NO_ENFORCE_DOMAINS")
            arcpy.RemoveJoin_management(floorTableView)
            return floorPropertiesTableCopy
        except:
            return floorPropertiesTable

    def customAttributeAnnotation(self, floorPropertiesTable, PathPropertiesTable, sdeQualifier, workspace, indoorDataset, sharedOutputWorkspace, ExcelTemplate, customAnnotationSheetName):
        try:
            xfieldsIndoorsLayers = {"UNITS": ['unit_id','access_type','use_type','name','name_long','name_subtitle','description','image_url','site_id','site_name','facility_id','facility_name','level_id','level_name','level_number','section_id','section_name','contact_email','contact_extension','contact_name','contact_phone','contact_url','schedule_email','capacity','utilization','area_id','assignment_type','area_gross','area_net','area_um','elevation_absolute','elevation_relative','height_absolute','height_relative','vertical_order','source_name','source_path','source_type','source_method'],
                            "ZONES": ['zone_id','access_type','name','name_long','name_subtitle','description','image_url','site_id','site_name','facility_id','facility_name','level_id','level_name','level_number','area_gross','area_net','area_um','elevation_absolute','elevation_relative','height_absolute','height_relative','vertical_order','source_name','source_path','source_type','source_method'],
                            "SECTIONS": ['section_id','access_type','name','name_long','name_subtitle','description','image_url','site_id','site_name','facility_id','facility_name','level_id','level_name','level_number','area_gross','area_net','area_um','elevation_absolute','elevation_relative','height_absolute','height_relative','vertical_order','source_name','source_path','source_type','source_method'],
                            "SITES": ['site_id','name','name_long','name_subtitle','address','unit','locality','province','country','postal_code','description','image_url','contact_email','contact_extension','contact_name','contact_phone','contact_url','area_gross','area_um','source_name','source_path','source_type','source_method'],
                            "FACILITIES": ['facility_id','access_type','use_type','name','name_long','name_subtitle','address','unit','locality','province','country','postal_code','facility_number','date_built','description','image_url','site_id','site_name','contact_email','contact_extension','contact_name','contact_phone','contact_url','area_gross','area_net','area_um','elevation_absolute','elevation_relative','height_absolute','height_relative','levels_above_ground','levels_total','rotation','source_name','source_path','source_type','source_method'],
                            "LEVELS": ['level_id','access_type','name','name_short','name_subtitle','level_number','description','image_url','site_id','site_name','facility_id','facility_name','area_gross','area_net','area_um','elevation_absolute','elevation_relative','height_absolute','height_relative','vertical_order','source_name','source_path','source_type','source_method'],
                            "DETAILS": ['detail_id','use_type','description','image_url','site_id','site_name','facility_id','facility_name','level_id','level_name','level_number','elevation_absolute','elevation_relative','height_absolute','height_relative','vertical_order','source_name','source_path','source_type','source_method']}
            allowedIndoorsFeatureClasses = ["UNITS", "DETAILS", "ZONES", "SECTIONS", "LEVELS", "SITES", "FACILITIES"]
            #This function will take required fields from the custom annotation sheet and populate the Layer to Feature Class sheet
            # this will also preserve the backward compatibility
            if not customAnnotationSheetName:
                return
            CADLayerMerge_flds = ["SOURCE_ANNOTATION", "TARGET_FEATURE_CLASS", "TARGET_FIELD_NAME"]
            convdict = {}
            for item in CADLayerMerge_flds:
                thisdict = {item: str}
                convdict.update(thisdict)
            df = pd.read_excel(ExcelTemplate, sheet_name=customAnnotationSheetName, header=0, converters=convdict, na_values='')
            dflist = df.values.tolist()
            zonesFields =["ZONE_ID", "NAME"]
            sectionsFields = ["SECTION_ID", "NAME"]
            unitsFields = ["UNIT_ID", "NAME", "USE_TYPE"]
            annoFieldMapping = defaultdict(list)
            for idx, item in enumerate(dflist):
                annoFeatClass = item[0]
                targetFeatClass = item[1]
                targetField = item[2]
                if str(annoFeatClass) != "nan":
                    if targetFeatClass.upper() == "ZONES" and targetField.upper() not in zonesFields:
                        annoFieldMapping[targetFeatClass].append(item)
                    elif targetFeatClass.upper() == "SECTIONS" and targetField.upper() not in sectionsFields:
                        annoFieldMapping[targetFeatClass].append(item)
                    elif targetFeatClass.upper() == "UNITS" and targetField.upper() not in unitsFields:
                        annoFieldMapping[targetFeatClass].append(item)
                    elif targetFeatClass.upper() in ["DETAILS", "LEVELS", "SITES", "FACILITIES"]:
                        annoFieldMapping[targetFeatClass].append(item)
                    elif targetFeatClass.upper() in ["UNITS", "ZONES", "SECTIONS"] and self.isValueBLockAnnotation(str(annoFeatClass)):
                        # targeting units, zones, or sections, but the target field *is* in the list of fields.
                        # check if parsing block annotation and add to annoFieldMapping if so...
                        annoFieldMapping[targetFeatClass].append(item)

                if targetFeatClass.upper() not in allowedIndoorsFeatureClasses:
                    arcpy.AddIDMessage("WARNING", 180170, targetFeatClass, customAnnotationSheetName)

            # this function will be called at the end when all features have been created
            # It will add fields for custom attributes in the Excel sheet
            # Do a spatial join between annotation FC and Indoors FC (Units, Sections, Zones), and get the TEXT field value as the custom field's value
            # uniqueIdDict = {"UNITS": "UNIT_ID", "ZONES": "ZONE_ID", "SECTIONS": "SECTION_ID", "SITES": "SITE_ID",
            #             "FACILITIES": "FACILITY_ID", "LEVELS": "LEVEL_ID", "DETAILS": "DETAIL_ID"}
            indoorsLayer = "indoorsLayer"
            annoFC, customField = None, None
            invalidValuesFound = False

            floorPropertiesTable = self.handleMultipleCadFiles(floorPropertiesTable, PathPropertiesTable)
            with arcpy.da.SearchCursor(floorPropertiesTable, ["SOURCE_PATH", "LEVEL_ID", "PROCESS"]) as cursor:
                for row in cursor:
                    sourcePath = row[0]
                    levelid = row[1]
                    process = row[2]
                    if process == "Y":
                        for indoorsFeatClass in annoFieldMapping:
                            #indoorsfeatClassPath = os.path.join(workspace, sdeQualifier + indoorDataset, sdeQualifier + indoorsFeatClass)
                            if self.onlineLayer:
                                if indoorsFeatClass.upper() not in workspace.keys():
                                    continue
                                indoorsfeatClassPath = workspace[indoorsFeatClass.upper()]
                            else:
                                indoorsfeatClassPath = os.path.join(workspace, sdeQualifier + indoorDataset, sdeQualifier + indoorsFeatClass)
                            if indoorsFeatClass.upper() not in allowedIndoorsFeatureClasses:
                                arcpy.AddIDMessage("WARNING", 180170, indoorsFeatClass, customAnnotationSheetName)
                                continue
                            if not arcpy.Exists(indoorsfeatClassPath):
                                arcpy.AddIDMessage("WARNING", 180134, indoorsFeatClass, customAnnotationSheetName)
                                continue
                            # Annotation to Field sheet columns: annoFCListExcel = SOURCE_ANNOTATION, TARGET_FEATURE_CLASS, TARGET_FIELD_NAME
                            annoFCListExcel = annoFieldMapping[indoorsFeatClass] # ['A-AREA-TYPE', 'UNITS', 'UNIT_CUSTOM_1'], ['A-AREA-TYPE', 'UNITS', 'UNIT_CUSTOM_2']
                            arcpy.MakeFeatureLayer_management(indoorsfeatClassPath, indoorsLayer)
                            if indoorsFeatClass.upper() in allowedIndoorsFeatureClasses: # we need LEVEL_ID field for query
                                annotationField = "TEXT" # default field
                                for item in annoFCListExcel: #['A-AREA-TYPE', 'UNITS', 'UNIT_CUSTOM_1']
                                    if len(item) != 3:
                                        continue
                                    annoPart = item[0] #A-ANNO-DELIM-PERIOD|3|-
                                    #item[1] is indoorsFeatClass which is also the key, so no need to get it here
                                    customField = item[2]
                                    # Check if this is block annotation
                                    isBlockAnnotation = self.isValueBLockAnnotation(annoPart)

                                    arr = annoPart.split("|") # A-AREA-IDEN OR A-ANNO-DELIM-PERIOD|3|-
                                    annoFC = arr[0]
                                    indexPositionForAnnoValue = None
                                    delimiterToExtractAnnoValue = None
                                    if len(arr) > 1:
                                        if not arr[1] or not arr[1].strip('-').isnumeric():
                                            arcpy.AddIDMessage("WARNING", 180134, customField, customAnnotationSheetName)
                                            continue
                                        indexPositionForAnnoValue = int(arr[1]) - 1 #The index on annotation in Excel is 1-based but we need it to be zero based index
                                        if indexPositionForAnnoValue < 0:
                                            arcpy.AddIDMessage("WARNING", 180134, customField, customAnnotationSheetName)
                                            continue
                                        delimiterToExtractAnnoValue = arr[2].strip()  # only for regular annotation (not for block anno)
                                    annotationField = "TEXT"
                                    annotationGroupLayer = "TextPoint"
                                    if isBlockAnnotation:
                                        thirdPart = arr[2] # annoPart = A-ANNO-DELIM-PARA|1|{MYTESTANNO}
                                        annotationField = thirdPart[1:len(thirdPart)-1]
                                        annotationGroupLayer = "Point"

                                    fields = [field for field in arcpy.ListFields(indoorsLayer) if field.name.upper() == customField.upper()]
                                    if len(fields) == 0:
                                        arcpy.AddIDMessage("WARNING", 180165, customField)
                                        continue
                                    field = fields[0]
                                    desc = arcpy.Describe(indoorsfeatClassPath)
                                    shapeAreaFieldName, shapeLengthFieldName = desc.areaFieldName.upper(), desc.lengthFieldName.upper()
                                    if field.type not in ["Double", "Integer", "Single", "SmallInteger", "String"] or field.name.upper() in [shapeLengthFieldName, shapeAreaFieldName]:
                                        arcpy.AddIDMessage("WARNING", 180175, customField, customAnnotationSheetName) #tested
                                        continue
                                    xfields = xfieldsIndoorsLayers[indoorsFeatClass.upper()] #list of fields

                                    #Custom field cannot be uniqueID field
                                    if (not isBlockAnnotation) and (customField.lower() in xfields):
                                        arcpy.AddIDMessage("WARNING", 180165, customField)
                                        continue

                                    arcpy.AddIDMessage("INFORMATIVE", 180166, levelid, customField)
                                    outputAnnoFC = annoFC.replace("-", "") + "_" + levelid.replace("-","").replace(".","").replace("_","")
                                    outputAnnoFCPath = os.path.join(sharedOutputWorkspace, outputAnnoFC)
                                    layerClause = "Layer = '" + annoFC + "'"
                                    sourceAnnoGroupLayer = os.path.join(sourcePath, annotationGroupLayer)
                                    arcpy.conversion.ExportFeatures(sourceAnnoGroupLayer, outputAnnoFCPath, layerClause)
                                    outputAnnotationFC = os.path.join(sharedOutputWorkspace, outputAnnoFC)
                                    if arcpy.Exists(outputAnnotationFC) and int(arcpy.GetCount_management(outputAnnotationFC)[0]) == 0:
                                        arcpy.AddIDMessage("WARNING", 180164, annoPart) #Tested
                                        continue
                                    annoFields = [field.name.lower() for field in arcpy.ListFields(outputAnnotationFC)]
                                    if isBlockAnnotation:
                                        if not annotationField.lower() in annoFields:
                                            arcpy.AddIDMessage("WARNING", 180167, annotationField, annoFC)
                                            continue
                                    else:
                                        if not annotationField.lower() in annoFields:
                                            arcpy.AddIDMessage("WARNING", 180172, annoFC)
                                            continue
                                    if indoorsFeatClass.upper() not in ["SITES", "FACILITIES"]:
                                        unitsClause = "LEVEL_ID = '" + levelid + "'"
                                        arcpy.SelectLayerByAttribute_management(indoorsLayer, 'NEW_SELECTION', unitsClause)

                                    outputIndoorsFeatureClass = os.path.join(sharedOutputWorkspace, indoorsFeatClass+outputAnnoFC)
                                    arcpy.SpatialJoin_analysis(indoorsLayer, outputAnnoFCPath, outputIndoorsFeatureClass, "JOIN_ONE_TO_ONE", "KEEP_ALL")
                                    #Create a cursor and store [ID, tuple of attribute] - keep iterating through all annotations for this feature class

                                    featidAnnoDict = {}
                                    uniqueId = xfields[0] #first item is layer ID in the field name list
                                    if isBlockAnnotation:
                                        with arcpy.da.SearchCursor(outputIndoorsFeatureClass, [uniqueId, annotationField]) as cursor1:
                                            for row1 in cursor1:
                                                featidAnnoDict[row1[0]] = row1[1]
                                    else:
                                        delimiterFound = True
                                        indexFound = True
                                        with arcpy.da.SearchCursor(outputIndoorsFeatureClass, [uniqueId, annotationField]) as cursor1:
                                            for row1 in cursor1:
                                                try:
                                                    annoValue = row1[1] # field value = A.B.C ['A-ANNO-DELIM-PERIOD', '3', '-']
                                                    if not annoValue or len(annoValue) == 0:
                                                        continue
                                                    if delimiterToExtractAnnoValue:
                                                        if delimiterToExtractAnnoValue in ["\P", "\n", "\r\n", "\r"]:
                                                            arr1 = annoValue.splitlines()
                                                        else:
                                                            arr1 = annoValue.split(delimiterToExtractAnnoValue)
                                                            if arr1[0] == annoValue:
                                                                delimiterFound = False  #split did not happen due to missing delimiter
                                                            else:
                                                                delimiterFound = True
                                                        if 0 <= indexPositionForAnnoValue < len(arr1):
                                                            featidAnnoDict[row1[0]] = arr1[indexPositionForAnnoValue] #indexposition=2, meaans, it will extract the value B from A.B.C
                                                            indexFound = True
                                                        else:
                                                            #index position is more than the length or is negative
                                                            indexFound = False
                                                            #arcpy.AddIDMessage("WARNING", 180168, str(annoPart))
                                                            featidAnnoDict[row1[0]] = None
                                                    else:
                                                        # A-ANNO-DELIM-PERIOD UNITS CUSTOM_TEXT1
                                                        featidAnnoDict[row1[0]] = annoValue
                                                except:
                                                    invalidValuesFound = True
                                                    continue
                                        if not delimiterFound: #delimiter was not found for any record
                                            arcpy.AddIDMessage("WARNING", 180173, annoPart)
                                        if delimiterFound and not indexFound: #indexFound was not found for any record
                                            arcpy.AddIDMessage("WARNING", 180174, annoPart)
                                    # Add field - user will create field
                                    #Assign attribute
                                    with arcpy.da.UpdateCursor(indoorsLayer, [uniqueId, customField]) as cursor2:
                                        for row2 in cursor2:
                                            uniqueValue = row2[0]
                                            if uniqueValue in featidAnnoDict.keys() and featidAnnoDict[uniqueValue]:
                                                try:
                                                    value = featidAnnoDict[uniqueValue]
                                                    row2[1] = value
                                                    cursor2.updateRow(row2)
                                                except:
                                                    invalidValuesFound = True
                                                    continue

                                    if invalidValuesFound and annoFC and customField:
                                        arcpy.AddIDMessage("WARNING", 180171, annoFC, customField)

            return True
        except Exception as e:
            #arcpy.AddError("{0}".format(e))
            return False

    def isValueBLockAnnotation(self, annoValue):
        if "|" not in annoValue:
            return False #wrong value, it must have |
        arr = annoValue.split("|")
        if len(arr) > 1:  # this has fieldname as delimiter
            part = arr[2].strip()
            if "{" in part and "}" in part:
                return True
        return False

    def isLayerOnline(self, fc):
        isOnline = False
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
            isOnline = re.search(p, urlPath)
            if isOnline:
                #string matched the url pattern
                urlArray = urlPath.split("\\")
                #if len of urlArray is 2 then we have a faulty url that needs to be updated to match
                #  the direction of rest of the url seperators in the url path string
                if len(urlArray) == 2:
                    urlPath = urlArray[0] + "/" + urlArray[1]
                response = requests.get(urlPath)
                if response and response.status_code == 200 and (desc.dataType == "FeatureLayer" or desc.dataType == "FeatureClass"):
                    return True
            return False
        except:
            return isOnline

    def areLayersInSameFeatureContainer(self, featureLayers):
        if len(featureLayers) == 0:
            return False
        desc = arcpy.Describe(featureLayers[0])
        catpath = desc.catalogPath
        catpath = catpath.replace("\\", "/")
        arr = catpath.split("/")
        baseFeatureContainer = "/".join(arr[:-1])

        for idx in range(1, len(featureLayers)):
            flayer = featureLayers[idx]
            if flayer:
                desc = arcpy.Describe(flayer)
                catpath = desc.catalogPath
                catpath = catpath.replace("\\", "/")
                arr = catpath.split("/")
                featureContainer = "/".join(arr[:-1])
                if featureContainer.lower() != baseFeatureContainer.lower():
                    return False
        return True

    def execute(self):
        """The source code of the tool."""
        env_workspace = arcpy.env.workspace #use this to reset in Finally block
        AIIMGDB = ""
        inValidIndoorsDataset = False
        try:
            # You must have an Advanced License to run this tool.
            minimum_advanced_license = ["ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_advanced_license:
                raise LicenseError

            arcpy.env.overwriteOutput = True
            #parameters
            parameters = arcpy.GetParameterInfo()

            #  SCRIPT PATH
            useSheetName = True
            __location__ = os.path.realpath(
                os.path.join(os.getcwd(), os.path.dirname(__file__)))

            #  DATE + TIME STAMPS
            today = datetime.date.today()
            today_stamp = '{:%Y_%m_%d}'.format(today)
            now = datetime.datetime.now()
            now_stamp = '{:%Y_%m_%d_%H%M%S}'.format(now)

            #AIIMGDB = parameters[0].valueAsText
            units_fc = parameters[0].valueAsText
            details_fc = parameters[1].valueAsText
            level_fc = parameters[2].valueAsText
            facility_fc = parameters[3].valueAsText
            section_fc = parameters[10].valueAsText
            zone_fc = parameters[11].valueAsText

            AIIMGDB = ""
            if self.isLayerOnline(units_fc):
                self.onlineLayer = True
            else:
                self.onlineLayer = False
                AIIMGDB = IndoorsUtilsModule.getWorkspacePath(units_fc) #GDB available

            #Validate database and get properties
            if not self.onlineLayer and not AIIMGDB and arcpy.Exists(AIIMGDB) == False:
                arcpy.AddIDMessage("ERROR", 180478, AIIMGDB)
                return
            #isLegacyDataset = true means valid AIIM or Indoors dataset
            databaseProperties = None
            if not self.onlineLayer:
                databaseProperties = IndoorsUtilsModule.getDatabaseProperties(AIIMGDB)
                self.isLegacyDataset = databaseProperties["isLegacyDataset"]
                self.indoorsDatasetName = databaseProperties["indoorsDatasetName"]
                self.sdeQualifier = databaseProperties["sdeQualifier"]
                IndoorsUtilsModule.INDOORAIIMDATASETNAME = self.indoorsDatasetName
                sdeQualifier = self.sdeQualifier
            else:
                self.sdeQualifier = ""
                sdeQualifier = self.sdeQualifier
                databaseProperties = None


            layerList = [units_fc, details_fc, level_fc, facility_fc, section_fc, zone_fc]
            indoorFC, missingFields = IndoorsUtilsModule.validateIndoorFields(AIIMGDB, databaseProperties, self.onlineLayer, layerList)
            failed = False
            if indoorFC != "" and len(missingFields)>0:
                for field in missingFields:
                    arcpy.AddIDMessage("ERROR", 1000, indoorFC, field)
                    failed = True
            # Validate fields
            if failed:
                return
            #Are layers in one container
            oneContainer = self.areLayersInSameFeatureContainer(layerList)
            if not oneContainer:
                arcpy.AddIDMessage ("ERROR", 180429)
                failed = True
                return

            # Source CAD
            ExcelTemplate = parameters[4].valueAsText
            excelFileName = os.path.basename(ExcelTemplate)
            #AIIMDatasetPath = IndoorsUtilsModule.getQualifiedNameDataset(AIIMGDB, IndoorsUtilsModule.INDOORAIIMDATASETNAME)
            if not self.onlineLayer:
                AIIMDatasetPath = os.path.join(AIIMGDB, sdeQualifier + IndoorsUtilsModule.INDOORAIIMDATASETNAME)
                if (AIIMDatasetPath == ""):
                    arcpy.AddIDMessage ("ERROR", 160354, AIIMGDB)
                    return
                CoordinateSys = arcpy.Describe(os.path.join(AIIMGDB, AIIMDatasetPath)).spatialReference
                #  Set as Coordinate System in Toolbox Parameter configuration.... eg "WGS_1984_Web_Mercator_Auxiliary_Sphere"
            else:
                CoordinateSys = arcpy.Describe(units_fc).spatialReference

            # If the spatial reference is unknown
            if CoordinateSys.name == "Unknown":
                arcpy.AddIDMessage("ERROR", 522, AIIMGDB)
                return

            # UniqueID Delimiter for Site | Building | Floor | Unit
            UniqueID_delimiter = parameters[5].valueAsText
            #"PERIOD", "HYPHEN", and "UNDERSCORE".
            if UniqueID_delimiter == "PERIOD":
                UniqueID_delimiter = "."
            elif UniqueID_delimiter == "HYPHEN":
                UniqueID_delimiter = "-"
            elif UniqueID_delimiter == "UNDERSCORE":
                UniqueID_delimiter = "_"

            # Set QA Threshold for Slivers Generated by Creating Unit Polygons from Lines
            Sliver_Threshold = parameters[6].valueAsText

            # Set Door buffer distance for closing doors
            Door_buffer_distance = parameters[7].valueAsText

            #Get unit of measurement for area
            #IndoorsUtilsModule
            area_measure_units = parameters[8].valueAsText
            calculation_method = parameters[9].valueAsText


            if calculation_method == "":
                calculation_method = "GEODESIC"
            calculation_method = calculation_method.upper()
            area_units_dict = IndoorsUtilsModule.AREA_UNITS_DICT #{"SQUARE_FEET": 6, "SQUARE_METERS": 8}
            area_unit_type = IndoorsUtilsModule.AREA_UNIT_TYPE #{"SQUARE_FEET": "AREA_SQFT", "SQUARE_METERS": "AREA_SQMT"}
            area_unit_sqft = IndoorsUtilsModule.AREA_UNIT_SQFT #"SQUARE_FEET"
            area_unit_sqmt = IndoorsUtilsModule.AREA_UNIT_SQMT #"SQUARE_METERS"
            #area_unit_type[area_measure_units] will give AREA_SQMT or AREA_SQFT
            # CHOOSE WHICH FEATURES TO PROCESS
            process_fixtures = "false"

            # Get updated feature class name consistent with new indoors data model
            indoorsDataset = IndoorsUtilsModule.INDOORAIIMDATASETNAME
            if self.onlineLayer:
                AIIMGDB = defaultdict()
                AIIMGDB["FACILITIES"] = facility_fc
                AIIMGDB["LEVELS"] = level_fc
                AIIMGDB["DETAILS"] = details_fc
                AIIMGDB["UNITS"] = units_fc
                AIIMGDB["ZONES"] = zone_fc
                AIIMGDB["SECTIONS"] = section_fc

            facilitiesPath = facility_fc
            levelsPath = level_fc
            detailsPath = details_fc
            unitsPath = units_fc
            zonesPath = zone_fc
            sectionsPath = section_fc

            area_unit_type = IndoorsUtilsModule.AREA_UNIT_TYPE  # {"SQUARE_FEET": "AREA_SQFT", "SQUARE_METERS": "AREA_SQMT"}

            area_unit_type_value = area_unit_type[area_measure_units] #unit

            process_opening = "false"
            failed = False
            sharedOutputGDB, workingGDBFolder, consolidatedGDB, qa_GDB  = self.createWorkingGeodatabases(now_stamp, today_stamp)

            CADFloorLayerMapping = os.path.join(sharedOutputGDB, "CAD_Layer_to_FC_Mapping")  # Set Location for CAD Layer Mapping Table
            BuildingProperties = os.path.join(sharedOutputGDB, "Building_Properties")  # Set Location for Building Properties Table

            # Set Location for Floor Properties Table
            FloorProperties = os.path.join(sharedOutputGDB, "Floor_Properties")
            PathProperties = os.path.join(sharedOutputGDB, "Path_Properties")
            CADLayerMerge_out = os.path.join(sharedOutputGDB, "CAD_Layer_to_FC_Map_MERGE")
            CADLayerMerge_flds = ['FACILITIES', 'FACILITY_LINES', 'LEVELS', 'LEVEL_LINES', 'ZONES', 'ZONE_LINES', 'ZONE_ID', 'ZONE_NAME', 'SECTIONS', 'SECTION_LINES', 'SECTION_ID', 'SECTION_NAME', 'UNITS', 'UNIT_LINES', 'UNIT_ID', 'UNIT_NAME', 'UNIT_USE_TYPE', 'DETAILS', 'OPENINGS']
            CADLayerMerge_tuple = tuple(CADLayerMerge_flds)

            UnitID_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB, "UNITIDLayerMappingSummary")
            UnitName_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB, "UNITNAMELayerMappingSummary")
            UnitUse_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB, "UNITUSETYPELayerMappingSummary")
            UnitDepartment_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB + "UNITDEPARTMENTLayerMappingSummary")
            UnitEmployee_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB + "UNITEMPLOYEELayerMappingSummary")
            zoneID_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB, "ZONEIDLayerMappingSummary")
            zonename_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB, "ZONENAMELayerMappingSummary")
            sectionID_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB, "SECTIONIDLayerMappingSummary")
            sectionname_layer_mapping_summary_tbl = os.path.join(sharedOutputGDB, "SECTIONNAMELayerMappingSummary")

            #Get sheets in Excel
            excelFile = pd.ExcelFile(ExcelTemplate)
            sheets = [sheet.upper() for sheet in excelFile.sheet_names]

            annotationCutomFieldSheet = IndoorsUtilsModule.ANNOTATION_SHEETNAME
            self.isannotationCutomFieldSheet = False #legacy sheets
            if annotationCutomFieldSheet.upper() in sheets:
                self.isannotationCutomFieldSheet = True
            if "CAD Layer to FC Mapping".upper() in sheets and "Layer to Feature Class".upper() in sheets:
                arcpy.AddIDMessage("ERROR", 180169)
                return
            if "CAD Layer to FC Mapping".upper() in sheets:
                sheet_name_CadToFeature = IndoorsUtilsModule.CAD_SHEETNAME
            elif "Layer to Feature Class".upper() in sheets:
                sheet_name_CadToFeature = IndoorsUtilsModule.CAD_SHEETNAME_UPDATED
            else:
                if not self.isannotationCutomFieldSheet:
                    arcpy.AddIDMessage("ERROR", 180127, IndoorsUtilsModule.CAD_SHEETNAME, IndoorsUtilsModule.CAD_SHEETNAME)
                    return
                if self.isannotationCutomFieldSheet:
                    arcpy.AddIDMessage("ERROR", 180127, IndoorsUtilsModule.CAD_SHEETNAME_UPDATED, IndoorsUtilsModule.CAD_SHEETNAME_UPDATED)
                    return

            # PROCESS EXCEL TEMPLATE -- FLATTEN EXCEL  TEMPLATE INTO SQL STATEMENTS
            #pd.set_option("display.max_rows", None, "display.max_columns", None)  # If you want to print all columns for debugging
            anno_list = ['ZONE_ID', 'ZONE_NAME', 'SECTION_ID', 'SECTION_NAME', 'UNIT_ID', 'UNIT_NAME', 'UNIT_USE_TYPE']
            # Get Excel Data
            arcpy.AddIDMessage("INFORMATIVE", 180128)
            convdict = {}
            for item in CADLayerMerge_flds:
                thisdict = {item: str}
                convdict.update(thisdict)
            try:
                mydf = pd.read_excel(ExcelTemplate, sheet_name=sheet_name_CadToFeature, header=0, converters=convdict, na_values='')
                if sheet_name_CadToFeature.upper() == IndoorsUtilsModule.CAD_SHEETNAME_UPDATED.upper():
                    #update the data frame to contain legacy excel sheet columns, so we can use the same code
                    #The data will be copied from Annotation to fields sheet layer in another function named transposeRequiredFields()
                    if 'ZONE_ID' not in mydf.columns: mydf.insert(6, "ZONE_ID", '')
                    if 'ZONE_NAME' not in mydf.columns: mydf.insert(7, "ZONE_NAME", '')
                    if 'SECTION_ID' not in mydf.columns: mydf.insert(10, "SECTION_ID", '')
                    if 'SECTION_NAME' not in mydf.columns: mydf.insert(11, "SECTION_NAME", '')
                    if 'UNIT_ID' not in mydf.columns: mydf.insert(14, "UNIT_ID", '')
                    if 'UNIT_NAME' not in mydf.columns: mydf.insert(15, "UNIT_NAME", '')
                    if 'UNIT_USE_TYPE' not in mydf.columns: mydf.insert(16, "UNIT_USE_TYPE", '')
                mydfnonan = mydf.fillna('')

            except Exception as e:
                arcpy.AddIDMessage("ERROR", 180127, IndoorsUtilsModule.CAD_SHEETNAME, IndoorsUtilsModule.CAD_SHEETNAME)
                return
            if not self.isannotationCutomFieldSheet and not self.validateColumnNames(mydfnonan, IndoorsUtilsModule.CAD_COLUMNS, excelFileName, sheet_name_CadToFeature):
                return
            if self.validateCADSourceSheetValues(mydf) == False:
                return


            # If values in the custom field (CAD Annotation to Field Mapping) sheet exist, use the to populate the values here, so it continues to behave as before
            # write a function that takes in mydfnonan and excel sheet, and return a modified mydfnonan with updated attribute values from custom sheet
            currentAnnoSheet = sheet_name_CadToFeature
            annotationCutomFieldSheet = IndoorsUtilsModule.ANNOTATION_SHEETNAME
            if annotationCutomFieldSheet.upper() in sheets:
                #pd.set_option("display.max_rows", None, "display.max_columns", None) #If you want to print all columns for debugging
                currentAnnoSheet = IndoorsUtilsModule.ANNOTATION_SHEETNAME
                mydfnonan = self.transposeRequiredFields(mydfnonan, ExcelTemplate, annotationCutomFieldSheet)
            # DF Column Values to List
            mymergedict = {}
            # To check the error condition if openings are not specified but CLOSE_DOORS =Y meaning create door lines.
            mydict = defaultdict(lambda: '') #for non-existing key, this will return ''
            for item in CADLayerMerge_flds:
                fld = item
                a = list(set((mydfnonan[fld].tolist())))
                b = [x.split("|")[0].strip() if str.find(x, "|") != -1 else x for x in a]
                c = [x for x in b if x != '']
                if len(c) == 0:
                    c.insert(0, '')
                d = "', '".join(c)
                e = 'Layer IN ({0}{1}{0})'.format("'", d)
                rawdata = {fld : e}
                mymergedict.update(rawdata)
                mydict[fld] = c

            # Create DataFrame from List values and export to ArcGIS Table
            merge_df = pd.DataFrame(mymergedict, index=[0])
            merge_df_ordered = merge_df[CADLayerMerge_flds]
            t_merge_df = [tuple(x) for x in merge_df_ordered.values]

            np_formats1 = []
            for item in CADLayerMerge_tuple:
                a = (item, np.unicode_, 2000)
                np_formats1.append(a)

            np_template = np.zeros(1, dtype=np_formats1)
            out_np_matrix = np.array(t_merge_df, np_template.dtype)

            if arcpy.Exists(CADLayerMerge_out):
                arcpy.Delete_management(CADLayerMerge_out)
                arcpy.da.NumPyArrayToTable(out_np_matrix, CADLayerMerge_out)
            else:
                arcpy.da.NumPyArrayToTable(out_np_matrix, CADLayerMerge_out)

            #validate cad inputs
            if not self.validateCADMappingInputs(CADLayerMerge_out, excelFileName):
                return
            used_flds = []
            for item in anno_list: # if item in id_list or anno_list
                fld = item
                anno_aa = list(set((mydfnonan[fld].tolist())))
                anno_bb = list(set([x for x in anno_aa if x != '']))

                # Set Keys
                raw_k = '{0}_Raw'.format(fld)
                delimiter_k = '{0}_Delimiter'.format(fld)
                line_k = '{0}_Line'.format(fld)

                # Set Out Table & Column Formats  for pd DataFrame and np Array
                outtbl_anno = os.path.join(sharedOutputGDB, str(fld).replace("_", "") + "LayerMappingSummary")
                np_formats = [(fld, np.unicode_, 55), (raw_k, np.unicode_, 55), (line_k, np.int32), (delimiter_k, np.unicode_, 55)]

                if len(anno_bb) == 0:
                    used_flds.append(fld)
                    out_matrix = np.empty((0,4),dtype=np_formats)
                    if arcpy.Exists(outtbl_anno):
                        arcpy.Delete_management(outtbl_anno)
                        arcpy.da.NumPyArrayToTable(out_matrix,outtbl_anno)
                        arcpy.DeleteRows_management(outtbl_anno)
                    else:
                        arcpy.da.NumPyArrayToTable(out_matrix,outtbl_anno)
                        arcpy.DeleteRows_management(outtbl_anno)

                if len(anno_bb) != 0:
                    # Loop through list of column values
                    used_flds.append(fld)
                    anno_values_list = []
                    for item in anno_bb:
                        df_formats = {fld: 'object', raw_k: 'object', line_k: 'int64', delimiter_k: 'object'}
                        # Set Values and Find column values  with '|' delimiter
                        raw_v = '{0}'.format(item.split("|")[0].strip()) if '|'in str(anno_bb) else item
                        if ("|" in item and len(item.split('|')) > 1):
                            delimiter_v = '{0}'.format(item.split("|")[2].strip()) if '|' in str(anno_bb) else ''
                            line_v = '{0}'.format(item.split("|")[1].strip()) if '|' in str(anno_bb) else 9999
                        else:
                            delimiter_v = ''
                            line_v = 9999
                        # Get Key - Value Pairs + Create pd DataFrame
                        anno_dict = {fld: item, raw_k: raw_v, line_k: line_v, delimiter_k: delimiter_v}
                        anno_df = pd.DataFrame(anno_dict,index=[0])
                        anno_df_fld_list =[fld,raw_k,line_k,delimiter_k]
                        anno_df_ordered = anno_df[anno_df_fld_list]
                        # Update dtype in pd  DataFrame
                        for k, v in df_formats.items():
                            if k == line_k: #testing for datatypee int64
                                val_index = anno_df_ordered[k][0]
                                if not val_index or not str(val_index).isnumeric() or int(val_index) < 0:
                                    arcpy.AddIDMessage("ERROR", 180134, item, currentAnnoSheet)
                                    return
                                anno_df_ordered[k] = anno_df_ordered[k].astype(v)
                        # Create np Maxtrix from pd Dataframe
                        tdf = [tuple(x) for x in anno_df_ordered.values]
                        anno_values_list.append(tdf[0])
                    # Create template np.matrix
                    np_matrix_template = np.zeros(1, dtype=np_formats)
                    # Create empty output np.matrix
                    np_matrix_anno_out = np.zeros(1, dtype=np_formats)
                    out_matrix = np.array(anno_values_list, np_matrix_template.dtype)

                    if arcpy.Exists(outtbl_anno):
                        arcpy.Delete_management(outtbl_anno)
                        arcpy.da.NumPyArrayToTable(out_matrix,outtbl_anno)
                        arcpy.CalculateField_management(outtbl_anno, "{}".format(line_k), "var(!{}!)".format(line_k), "PYTHON3", "def var(l):\n    if l == 9999:\n        return None\n    else:\n        return l")
                        arcpy.CalculateField_management(outtbl_anno, "{}".format(delimiter_k), "var(!{}!)".format(delimiter_k), "PYTHON3", "def var(l):\n    if l == '':\n        return None\n    else:\n        return l")
                    else:
                        arcpy.da.NumPyArrayToTable(out_matrix,outtbl_anno)
                        arcpy.CalculateField_management(outtbl_anno, "{}".format(line_k), "var(!{}!)".format(line_k), "PYTHON3", "def var(l):\n    if l == 9999:\n        return None\n    else:\n        return l")
                        arcpy.CalculateField_management(outtbl_anno, "{}".format(delimiter_k), "var(!{}!)".format(delimiter_k), "PYTHON3", "def var(l):\n    if l == '':\n        return None\n    else:\n        return l")
                else:
                    pass

            # IMPORT BUILDING PROPERTIES TABLE
            # Parameters and Variables
            # read  from excel file
            arcpy.AddIDMessage("INFORMATIVE", 180133)
            facconvdict = {}
            factypelist = []
            facvalueslist = []
            for item in IndoorsUtilsModule.FACILITY_FLDS:
                if item in IndoorsUtilsModule.BLDG_TEXT_FIELDS:
                    thisdict = {item: str}
                    thistple = (item,'U255')
                    facconvdict.update(thisdict)
                    factypelist.append(thistple)
                if item in IndoorsUtilsModule.BLDG_DT_FIELDS:
                    thisdict = {item: str} #important to deal with dates prior to 1/1/1900
                    thistple = (item,'<M8[us]')
                    facconvdict.update(thisdict)
                    factypelist.append(thistple)
                if item in IndoorsUtilsModule.BLDG_FLOAT_FIELDS:
                    thisdict = {item: np.float64}
                    thistple = (item,np.float64)
                    facconvdict.update(thisdict)
                    factypelist.append(thistple)
                if item in IndoorsUtilsModule.BLDG_LONG_FIELDS:
                    thisdict = {item:np.int32}
                    thistple = (item,np.int32)
                    facconvdict.update(thisdict)
                    factypelist.append(thistple)
                if item in IndoorsUtilsModule.BLDG_INT_FIELDS:
                    thisdict = {item:np.int16}
                    thistple = (item,np.int16)
                    facconvdict.update(thisdict)
                    factypelist.append(thistple)
            try:
                if (useSheetName == True):
                    facdf = pd.read_excel(ExcelTemplate, sheet_name='Facility Properties', header=0, converters=facconvdict,na_values='')
                else:
                    facdf = pd.read_excel(ExcelTemplate, sheetname='Facility Properties', header=0, converters=facconvdict,na_values='')
            except Exception as e:
                arcpy.AddIDMessage("ERROR", 180134, str(e), IndoorsUtilsModule.FACILITIES_SHEETNAME)
                return

            facdf['DATE_BUILT'] = pd.to_datetime(facdf['DATE_BUILT'], errors='coerce')
            facdf['DATE_BUILT']  = facdf['DATE_BUILT'].fillna(value=0)
            facdf['DATE_BUILT'] = facdf['DATE_BUILT'].astype('datetime64[ns]')  #important to deal with dates prior to 1/1/1900

            if not self.validateColumnNames(facdf, IndoorsUtilsModule.FACILITY_FLDS, excelFileName, IndoorsUtilsModule.FACILITIES_SHEETNAME):
                return
            if IndoorsUtilsModule.applyValuesProperty():
                facmatrix = facdf.values
            else:
                facmatrix = facdf.as_matrix()
            self.handleNullValuesInExcel(facmatrix, factypelist, "FacilityPropertiesSheet")
            fac_tdf = [tuple(x) for x in facmatrix]

            for row in fac_tdf:
                if str(row[11]) != 'nan' and row[11] and len(str(row[11])) and len(str(row[11])) > 2:
                    arcpy.AddIDMessage("ERROR", 180530, "COUNTRY", IndoorsUtilsModule.FACILITIES_SHEETNAME)
                    return
            fac_out_matrix = np.array(fac_tdf,factypelist)

            if arcpy.Exists(BuildingProperties):
                arcpy.Delete_management(BuildingProperties)
                try:
                    arcpy.da.NumPyArrayToTable(fac_out_matrix, BuildingProperties)
                except arcpy.ExecuteError:
                    arcpy.AddError(arcpy.GetMessages(2))
                    return
                except Exception as e:
                    arcpy.AddError("{0}".format(e))
                    return
            else:
                arcpy.da.NumPyArrayToTable(fac_out_matrix, BuildingProperties)
            if arcpy.Exists(BuildingProperties):
                if not self.validateFacilitiesColumns(BuildingProperties, excelFileName):
                    return
            # Correct for np.NaN values in the output table
            with arcpy.da.UpdateCursor(BuildingProperties, IndoorsUtilsModule.BLDG_TEXT_FIELDS) as cur:
                for row in cur:
                    corrected = False
                    i = 0
                    while i < len(row):
                        if row[i] == 'nan':
                            row[i] = None
                            corrected = True
                        i += 1
                    if corrected:
                        cur.updateRow(row)

            #IMPORT SOURCE PATH TABLE
            try:
                pathconvdict = {}
                pathtypelist = []
                pathvalueslist = []
                for item in IndoorsUtilsModule.PATHS_TEXT_FIELDS:
                    thisdict = {item: str}
                    thistple = (item, 'U255')
                    pathconvdict.update(thisdict)
                    pathtypelist.append(thistple)
                additionalPaths = pd.read_excel(ExcelTemplate, sheet_name='Source Files', header=0, converters=pathconvdict, na_values='')
                #validate for fields and if facility names and level names and paths exist
                pathmatrix = additionalPaths.values
                sourcecolslist = ["SOURCE_PATH", "LEVEL_ID"]
                isValueNull = self.checkullValuesInExcelSheet(pathmatrix, sourcecolslist, "SourcePathPropertiesSheet")
                if isValueNull:
                    return
                fac_tdf = [tuple(x) for x in pathmatrix]
                path_out_matrix = np.array(fac_tdf, pathtypelist)
                if arcpy.Exists(PathProperties):
                    arcpy.Delete_management(PathProperties)
                    try:
                        arcpy.da.NumPyArrayToTable(path_out_matrix, PathProperties)
                    except arcpy.ExecuteError:
                        arcpy.AddError(arcpy.GetMessages(2))
                        return
                    except Exception as e:
                        arcpy.AddError("{0}".format(e))
                        return
                else:
                    arcpy.da.NumPyArrayToTable(path_out_matrix, PathProperties)
                #isPathSheetValid = self.validatePathColumns(PathProperties, FloorProperties)
                #if isPathSheetValid == False:
                #    arcpy.AddIDMessage("WARNING", 180160, IndoorsUtilsModule.ADDITIONAL_PATH_SHEETNAME)
            except Exception as e:
                pass

            if arcpy.Exists(PathProperties):
                levelColumns = IndoorsUtilsModule.FLOOR_FIELDS_SEPERATEDPATHS
            else:
                levelColumns = IndoorsUtilsModule.FLOOR_FIELDS
            # IMPORT EXCEL FLOOR PROPERTIES TABLE
            # Parameters and Variables
            arcpy.AddIDMessage("INFORMATIVE", 180138)
            floorconvdict = {}
            floortypelist = []
            floorvalueslist = []
            for item in levelColumns:
                if item == 'SOURCE_PATH':
                    thisdict = {item: str}
                    thistple = (item,'U2000')
                    floorconvdict.update(thisdict)
                    floortypelist.append(thistple)
                if item in IndoorsUtilsModule.FLOOR_TEXT_FIELDS and item != 'SOURCE_PATH':
                    thisdict = {item: str}
                    thistple = (item,'U255')
                    floorconvdict.update(thisdict)
                    floortypelist.append(thistple)
                if item in IndoorsUtilsModule.FLOOR_FLOAT_FIELDS:
                    thisdict = {item: np.float64}
                    thistple = (item,np.float64)
                    floorconvdict.update(thisdict)
                    floortypelist.append(thistple)
                if item in IndoorsUtilsModule.FLOOR_INT_FIELDS:
                    thisdict = {item:np.int32}
                    thistple = (item,np.int32)
                    floorconvdict.update(thisdict)
                    floortypelist.append(thistple)
            try:
                if (useSheetName == True):
                    floordf = pd.read_excel(ExcelTemplate, sheet_name='Level Properties', header=0, converters=floorconvdict, na_values='')
                else:
                    floordf = pd.read_excel(ExcelTemplate, sheetname='Level Properties', header=0, converters=floorconvdict, na_values='')
            except Exception as e:
                arcpy.AddIDMessage("ERROR", 180134, str(e), IndoorsUtilsModule.LEVELS_SHEETNAME)
                return

            if not self.validateColumnNames(floordf, levelColumns, excelFileName, IndoorsUtilsModule.LEVELS_SHEETNAME):
                return
            #Validate for null in Merge columns

            floordfordered = floordf[levelColumns]
            if IndoorsUtilsModule.applyValuesProperty():
                floormatrix = floordfordered.values
            else:
                floormatrix = floordfordered.as_matrix()
            isValueNull = self.checkullValuesInExcelSheet(floormatrix, floortypelist, "LevelPropertiesSheet")
            if isValueNull:
                return
            if floordf['CLOSE_DOORS'].isnull().sum() > 0 :
                arcpy.AddIDMessage("ERROR", 180137, 'CLOSE_DOORS', IndoorsUtilsModule.LEVELS_SHEETNAME)
                return
            self.handleNullValuesInExcel(floormatrix, floortypelist, "LevelPropertiesSheet")


            floor_tdf = [tuple(x) for x in floormatrix]
            floor_out_matrix = np.array(floor_tdf, floortypelist)
            if arcpy.Exists(FloorProperties):
                arcpy.Delete_management(FloorProperties)
                try:
                    arcpy.da.NumPyArrayToTable(floor_out_matrix, FloorProperties)
                except arcpy.ExecuteError:
                    arcpy.AddError(arcpy.GetMessages(2))
                    return
                except Exception as e:
                    arcpy.AddError("{0}".format(e))
                    return
            else:
                arcpy.da.NumPyArrayToTable(floor_out_matrix, FloorProperties)

            if not self.validateLevelsColumns(FloorProperties,PathProperties, excelFileName):
                return
            if arcpy.Exists(PathProperties):
                isUpdated = self.updatePathColumns(PathProperties, FloorProperties)
                if isUpdated == False:
                    arcpy.AddIDMessage("ERROR", 180161)
                    return
            # Correct for np.NaN values in the output table
            with arcpy.da.UpdateCursor(FloorProperties, IndoorsUtilsModule.FLOOR_TEXT_FIELDS) as cur:
                for row in cur:
                    corrected = False
                    i = 0
                    while i < len(row):
                        if row[i] == 'nan':
                            row[i] = None
                            corrected = True
                        i += 1
                    if corrected:
                        cur.updateRow(row)

            # VALIDATE BUILDINGS AND FLOORS
            val_facility_flds = ['FACILITY_ID']
            facility_list = [BuildingProperties, val_facility_flds]

            # Set Location for Floor Properties Table
            FloorProperties = os.path.join(sharedOutputGDB, "Floor_Properties")
            val_floor_flds = ['FACILITY_ID','LEVEL_ID']
            floor_list = [FloorProperties, val_floor_flds]

            myBuildings = []
            myfloor_buildings = []
            myvalidator = []
            myvalidator2 = []

            with arcpy.da.SearchCursor(BuildingProperties, val_facility_flds) as b_cursor:
                for row in b_cursor:
                    # Create list from row values
                    myBuildings.append(row[0])
                    # Get unique values
                    myBuildings_unique = set(myBuildings)
                    # Convert this to a list
                    myBuildings_list = list(myBuildings_unique)

                with arcpy.da.SearchCursor(FloorProperties, val_floor_flds) as f_cursor:
                    for row in f_cursor:
                        myfloor_buildings.append(row[0])
                        myfloor_buildings_unique = set(myfloor_buildings)
                        if str(row[0]) not in myBuildings_list:
                            myvalidator.append('N')
                            arcpy.AddIDMessage("ERROR", 180140, row[0])
                        else:
                            myvalidator.append('Y')

                for item in myBuildings_list:
                    if item not in myfloor_buildings_unique:
                        myvalidator2.append("N")
                        arcpy.AddIDMessage("ERROR", 180158, str(item))
                    else:
                        myvalidator2.append("Y")

            if 'N' in myvalidator2:
                return
            if 'N' in myvalidator:
                return

            with arcpy.da.SearchCursor(CADLayerMerge_out, CADLayerMerge_flds) as SC_MergeFlds:
                row = SC_MergeFlds.next()
                myFacilityExpression = row[CADLayerMerge_flds.index('FACILITIES')]
                myFacilityPolylineExpression = row[CADLayerMerge_flds.index('FACILITY_LINES')]
                myLevelExpression = row[CADLayerMerge_flds.index('LEVELS')]
                myLevelPolylineExpression = row[CADLayerMerge_flds.index('LEVEL_LINES')]
                myZoneExpression = row[CADLayerMerge_flds.index('ZONES')]
                myZoneLineExpression = row[CADLayerMerge_flds.index('ZONE_LINES')]
                myZoneIDExpression = row[CADLayerMerge_flds.index('ZONE_ID')]
                myZoneNameExpression = row[CADLayerMerge_flds.index('ZONE_NAME')]
                mySectionExpression = row[CADLayerMerge_flds.index('SECTIONS')]
                mySectionLineExpression = row[CADLayerMerge_flds.index('SECTION_LINES')]
                mySectionIDExpression = row[CADLayerMerge_flds.index('SECTION_ID')]
                mySectionNameExpression = row[CADLayerMerge_flds.index('SECTION_NAME')]
                myUnitExpression = row[CADLayerMerge_flds.index('UNITS')]
                myUnitPolylineExpression = row[CADLayerMerge_flds.index('UNIT_LINES')]
                myUnitIDExpression = row[CADLayerMerge_flds.index('UNIT_ID')]
                myUnitNameExpression = row[CADLayerMerge_flds.index('UNIT_NAME')]
                myUnitUseExpression = row[CADLayerMerge_flds.index('UNIT_USE_TYPE')]
                #myFixtureExpression = row[CADLayerMerge_flds.index('FIXTURE')]
                myDetailExpression = row[CADLayerMerge_flds.index('DETAILS')]
                myOpeningExpression = row[CADLayerMerge_flds.index('OPENINGS')]
                myOpeningExpression_reverse_unit_line = row[CADLayerMerge_flds.index('OPENINGS')].replace("Layer IN", "UnitPolyline_Layer NOT IN")

            with arcpy.da.SearchCursor(BuildingProperties,IndoorsUtilsModule.FACILITY_LIST_FLDS) as SC_facilities:
                for row in SC_facilities:
                    unique_facilities = row[IndoorsUtilsModule.FACILITY_LIST_FLDS.index('FACILITY_ID')] #row[0]
                    merge_levels = row[IndoorsUtilsModule.FACILITY_LIST_FLDS.index('MERGE_LEVELS')] #row[1]
                    out_gdb_name = "Facility_" + str.strip(str.replace(str.replace(str.replace(unique_facilities,".","_"),"-","_")," ","_")) + ".gdb"
                    out_CAD_gdb = os.path.join(workingGDBFolder, out_gdb_name)
                    if arcpy.Exists(out_CAD_gdb):
                        arcpy.Delete_management(out_CAD_gdb)
                        #  Clean up from last run
                        # Can not delete at end because of lock from query table
                    if not arcpy.Exists(out_CAD_gdb):
                        arcpy.CreateFileGDB_management(workingGDBFolder, out_gdb_name, "CURRENT")
                        #  Check for output CAD GDB.
                        # If it doesn't exist, create it.

                    facilityQuery = "FACILITY_ID='" + unique_facilities + "'"
                    with arcpy.da.SearchCursor(FloorProperties,IndoorsUtilsModule.FLOOR_FIELDS,  facilityQuery) as SC:
                        # ['SOURCEPATH', 'FACILITYID', 'LEVELID', 'NAME', 'LONGNAME', 'DESCRIPTION', 'ACCESSTYPE', 'LEVELNUMBER', 'VERTICALORDER', 'RELATIVE_ELEVATION', 'ABSOLUTE_ELEVATION', 'RELATIVE_HEIGHT', 'ABSOLUTE_HEIGHT', 'MERGE_FACILITY_LINES', 'MERGE_LEVEL_LINES', 'MERGE_UNIT_LINES', 'MERGE_UNITS', 'MERGE_ZONE_LINES', 'MERGE_SECTION_LINES', 'CLOSE_DOORS']
                        for row in SC:
                            processData = row[IndoorsUtilsModule.FLOOR_FIELDS.index('PROCESS')].strip().upper()
                            FloorID = row[IndoorsUtilsModule.FLOOR_FIELDS.index('LEVEL_ID')]  # row[2]
                            if processData == "Y":
                                CADsource = row[IndoorsUtilsModule.FLOOR_FIELDS.index('SOURCE_PATH')]
                                if CADsource == "nan" or str(CADsource) == "None" or arcpy.Exists(CADsource) == False:
                                    continue
                                CADPolylineArray = []
                                CADPolyline = os.path.join(out_CAD_gdb, "CADPolyline")
                                if arcpy.Exists(PathProperties) == False:
                                    CADPoly = os.path.join(CADsource, "Polygon")
                                    CADPolylineArray.append(os.path.join(CADsource, "Polyline"))
                                    CADPoint = os.path.join(CADsource, "Point")
                                    CADAnno = os.path.join(CADsource, "TextPoint")
                                    CADBlock =  os.path.join(CADsource, "Point")
                                    CADMulti = os.path.join(CADsource, "Multipatch")
                                else:
                                    additionalPathQuery = "LEVEL_ID='" + FloorID + "'"
                                    CADPolyArray = []
                                    CADAnnoArray = []
                                    CADBlockArray = []
                                    with arcpy.da.SearchCursor(PathProperties, IndoorsUtilsModule.PATHS_TEXT_FIELDS, additionalPathQuery) as sc_paths:
                                        for pathrow in sc_paths:
                                            path = pathrow[0]
                                            CADPolyArray.append(os.path.join(path, "Polygon"))
                                            CADPolylineArray.append(os.path.join(path, "Polyline"))
                                            CADAnnoArray.append(os.path.join(path, "TextPoint"))
                                            CADBlockArray.append(os.path.join(path, "Point"))
                                        if (len(CADPolyArray)) > 0:
                                            CADPoly = os.path.join(out_CAD_gdb, "CADPoly")
                                            CADAnno = os.path.join(out_CAD_gdb, "CADAnno")
                                            CADBlock = os.path.join(out_CAD_gdb, "CADBlock")
                                            arcpy.Merge_management(CADPolyArray, CADPoly)
                                            arcpy.Merge_management(CADAnnoArray, CADAnno)
                                            arcpy.Merge_management(CADBlockArray, CADBlock)

                                if (len(CADPolylineArray)) > 0:
                                    with arcpy.EnvManager(XYTolerance="1 Millimeters"):
                                        arcpy.Merge_management(CADPolylineArray, CADPolyline)

                                FacilityID = row[IndoorsUtilsModule.FLOOR_FIELDS.index('FACILITY_ID')]  # row[1]
                                FloorID_name = str.replace(str.replace(str.replace(FloorID, ".", "_"),"-","_")," ","_")
                                Close_Doors = row[IndoorsUtilsModule.FLOOR_FIELDS.index('CLOSE_DOORS')].strip().upper()
                                arcpy.env.outputCoordinateSystem = CoordinateSys
                                # Set the outputZFlag environment to Enabled
                                arcpy.env.outputZFlag = "Disabled"
                                # Set the outputMFlag environment to Disabled
                                arcpy.env.outputMFlag = "Disabled"
                                arcpy.AddIDMessage("INFORMATIVE", 180145, FloorID, FacilityID)
                                out_gdb_name = "Facility_" + str.replace(str.replace(str.replace(FacilityID,".","_"),"-","_")," ","_") + ".gdb"
                                out_CAD_gdb = os.path.join(workingGDBFolder, out_gdb_name)
                                out_workspace_name = "Floor_" + FloorID_name
                                cad_attr_list = ['Layer', 'RefName', 'DocName', 'DocPath', 'DocType', 'DocVer']
                                cad_anno_attr_list = ['Layer', 'Text', 'RefName', 'DocName', 'DocPath', 'DocType', 'DocVer']

                                #  No layers is source CAD
                                nolyrs = """Layer IN('')"""

                                if unique_facilities == FacilityID:
                                    #  DETAIL LINES
                                    arcpy.AddIDMessage("INFORMATIVE", 180141, "DETAILS")
                                    out_CADDetailPolyline = out_workspace_name + "_detail_line_fc"
                                    detail_polyline = os.path.join(consolidatedGDB,out_CADDetailPolyline)
                                    detail_polyline_lyr = arcpy.TableSelect_analysis(CADPolyline, os.path.join(out_CAD_gdb,out_CADDetailPolyline +"_tbl"), myDetailExpression)
                                    detail_polyline_lyr_count = int(arcpy.GetCount_management(detail_polyline_lyr).getOutput(0))

                                    # if table has no data the import for Detail Lines is skipped
                                    if myDetailExpression == nolyrs or detail_polyline_lyr_count == 0:
                                        if myDetailExpression != nolyrs and detail_polyline_lyr_count == 0:
                                            arcpy.AddIDMessage("WARNING", 180142)
                                        pass
                                    if (Close_Doors == "Y" or myDetailExpression != nolyrs or detail_polyline_lyr_count != 0):
                                        arcpy.conversion.ExportFeatures(CADPolyline, detail_polyline, myDetailExpression, False, r'Detail_Layer "Detail_Layer" true true false 255 Text 0 0,First,#,' + CADPolyline + r',Layer,0,255;Detail_RefName "Detail_RefName" true true false 255 Text 0 0,First,#,' + CADPolyline + r',RefName,0,255;Detail_DocName "Detail_DocName" true true false 255 Text 0 0,First,#,' + CADPolyline + r',DocName,0,255;Detail_DocPath "Detail_DocPath" true true false 4096 Text 0 0,First,#,' + CADPolyline + r',DocPath,0,4096;Detail_DocType "Detail_DocType" true true false 32 Text 0 0,First,#,' + CADPolyline + r',DocType,0,32;Detail_DocVer "Detail_DocVer" true true false 16 Text 0 0,First,#,' + CADPolyline + r',DocVer,0,16')
                                        arcpy.RepairGeometry_management(detail_polyline, "DELETE_NULL", "ESRI")
                                        arcpy.DeleteIdentical_management(detail_polyline, "Shape", None, 0)
                                        arcpy.Densify_edit(detail_polyline, "ANGLE", "10 Meters", "0.1 Meters", 10)
                                        arcpy.AddField_management(detail_polyline, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(detail_polyline, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(detail_polyline, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                    #  OPENINGS
                                    arcpy.AddIDMessage("INFORMATIVE", 180141, "OPENINGS")
                                    out_CADDoor = out_workspace_name + "_door_line_fc"
                                    out_CADDoorBuffered = out_workspace_name + "_door_line_fc_buffered"
                                    out_CADDoor_Buff = out_workspace_name + "_door_line_buffer_fc"
                                    out_CADDoor_dissolve = out_workspace_name + "_door_line_dissolve_fc"
                                    out_CADDoor_intersect = out_workspace_name + "_door_line_intersect_fc"
                                    out_CADDoor_singlepart = out_workspace_name + "_door_point_singlepart_fc"
                                    out_CADDetailPolyline_no_doors = out_workspace_name + "_detail_line_no_doors_fc"
                                    out_CADDoor_closed = out_workspace_name + "_door_line_closed_fc"
                                    out_CADDoor_pt = out_workspace_name + "_door_pt_fc"

                                    door_polyline_lyr = arcpy.TableSelect_analysis(CADPolyline, os.path.join(out_CAD_gdb,out_CADDoor+"_tbl"), myOpeningExpression)
                                    door_polyline_lyr_count = int(arcpy.GetCount_management(door_polyline_lyr).getOutput(0))
                                    detail_fc_line = detail_polyline
                                    detail_fc_line_out = os.path.join(out_CAD_gdb, out_CADDetailPolyline_no_doors)
                                    door_output = os.path.join(out_CAD_gdb, out_CADDoor)
                                    door_open = os.path.join(consolidatedGDB, out_CADDoor)
                                    door_buff = os.path.join(out_CAD_gdb, out_CADDoor_Buff)
                                    door_dissolve = os.path.join(out_CAD_gdb, out_CADDoor_dissolve)
                                    door_closed = os.path.join(consolidatedGDB, out_CADDoor_closed)
                                    door_pt = os.path.join(out_CAD_gdb, out_CADDoor_pt)
                                    door_pt_out = os.path.join(consolidatedGDB, out_CADDoor_pt)
                                    door_int_points = os.path.join(out_CAD_gdb, out_CADDoor_intersect)
                                    door_int_pts_singlepart = os.path.join(out_CAD_gdb, out_CADDoor_singlepart)
                                    door_closed_facility = os.path.join(consolidatedGDB, out_CADDoor_closed + "_facility")

                                    # if table has no data the import for Door Lines is skipped
                                    #if Close_Doors == "N" or process_opening == 'false' or myOpeningExpression == nolyrs or door_polyline_lyr_count == 0:
                                    if Close_Doors == "N" or myOpeningExpression == nolyrs:
                                        # check if close doors = N, or no openings CAD layer specified
                                        arcpy.AddIDMessage("WARNING", 180144)
                                    units_polygons_valid = len(mydict['UNITS']) > 0 and len(mydict['UNITS'][0].strip()) > 0
                                    units_lines_valid = len(mydict['UNIT_LINES']) > 0 and len(mydict['UNIT_LINES'][0].strip()) > 0
                                    if units_polygons_valid and units_lines_valid:
                                        arcpy.AddIDMessage("ERROR", 180132, "UNITS",  "UNIT_LINES")
                                        return
                                    if Close_Doors and units_polygons_valid:
                                        self.validateUnitPolygons(mydict, Close_Doors)
                                    if Close_Doors == "Y" and units_lines_valid:
                                        if myOpeningExpression != nolyrs:
                                            # check if close doors = Y, openings CAD layer specified but is wrong, so warn the user and proceed
                                            self.validateUnitLines(mydict)
                                        elif door_polyline_lyr_count == 0:  #No features found in specified CAD OPENINGS layer
                                            arcpy.AddIDMessage("INFORMATIVE", 180308, "OPENINGS layer")
                                    if (Close_Doors == "Y" or process_opening == 'true') and (myOpeningExpression != nolyrs or door_polyline_lyr_count != 0):
                                        arcpy.env.outputZFlag = "Disabled"
                                        arcpy.conversion.ExportFeatures(CADPolyline, door_output, myOpeningExpression, False, r'Doors_Layer "Doors_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;Doors_RefName "Doors_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;Doors_DocName "Doors_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;Doors_DocPath "Doors_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Doors_DocType "Doors_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;Doors_DocVer "Doors_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPolyline))
                                        arcpy.RepairGeometry_management(os.path.join(out_CAD_gdb, out_CADDoor), "DELETE_NULL", "ESRI")
                                        try:
                                            arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADDoor), "Shape", None, 0)
                                        except arcpy.ExecuteError:
                                            arcpy.AddError(arcpy.GetMessages(2))
                                        except Exception as e:
                                            arcpy.AddError("{0}".format(e))

                                        if Door_buffer_distance != "0":
                                            arcpy.GraphicBuffer_analysis(door_output, r"{0}".format(door_buff), "{0} Inches".format(Door_buffer_distance), "SQUARE", "MITER", 10, "0 Meters")
                                            arcpy.Dissolve_management(door_buff, door_dissolve, "Doors_DocName;Doors_DocPath;Doors_DocType;Doors_DocVer", "Doors_Layer First; Doors_RefName First", "SINGLE_PART", "UNSPLIT_LINES")
                                            arcpy.AddField_management(door_dissolve, "Doors_Layer", "TEXT", None, None, None, "Doors Layer", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.AddField_management(door_dissolve, "Doors_RefName", "TEXT", None, None, None, "Doors RefName", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(door_dissolve, "Doors_Layer", "!FIRST_Doors_Layer!", "PYTHON3", None)
                                            arcpy.CalculateField_management(door_dissolve, "Doors_RefName", "!FIRST_Doors_RefName!", "PYTHON3", None)
                                        else:
                                            arcpy.Buffer_analysis(os.path.join(out_CAD_gdb, out_CADDoor), os.path.join(out_CAD_gdb, out_CADDoorBuffered), "0.55 Inches", "FULL", "ROUND", "NONE", None, "PLANAR")
                                            arcpy.Dissolve_management(
                                                os.path.join(out_CAD_gdb, out_CADDoorBuffered),
                                                door_dissolve, "Doors_DocName;Doors_DocPath;Doors_DocType;Doors_DocVer",
                                                "Doors_Layer First; Doors_RefName First", "SINGLE_PART",
                                                "UNSPLIT_LINES")
                                            arcpy.AddField_management(door_dissolve, "Doors_Layer", "TEXT", None, None, None, "Doors Layer", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.AddField_management(door_dissolve, "Doors_RefName", "TEXT", None, None, None, "Doors RefName", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(door_dissolve, "Doors_Layer", "!FIRST_Doors_Layer!", "PYTHON3", None)
                                            arcpy.CalculateField_management(door_dissolve, "Doors_RefName", "!FIRST_Doors_RefName!", "PYTHON3", None)

                                        # Create Door Points
                                        arcpy.FeatureToPoint_management(door_dissolve, door_pt_out,"INSIDE")
                                        ### Add Floor Fields to Door Points
                                        arcpy.AddField_management(door_pt_out, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(door_pt_out, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(door_pt_out, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                        ###

                                        arcpy.Select_analysis(detail_fc_line,detail_fc_line_out,"{0}".format(myOpeningExpression.replace("Layer IN","Detail_Layer NOT IN")))

                                        inputfeatures = [[door_dissolve,1],[detail_fc_line_out,10]]
                                        arcpy.Intersect_analysis(inputfeatures, door_int_points, "ALL", None, "POINT")
                                        if int(arcpy.GetCount_management(door_int_points).getOutput(0)) > 0:
                                            arcpy.MultipartToSinglepart_management(door_int_points, door_int_pts_singlepart)
                                            arcpy.PointsToLine_management(door_int_pts_singlepart, door_closed, "FID_" + out_CADDoor_dissolve, None, "NO_CLOSE")

                                            arcpy.JoinField_management(door_closed, "FID_" + out_CADDoor_dissolve, door_int_pts_singlepart, "FID_" + out_CADDoor_dissolve, "Doors_DocName;Doors_DocPath;Doors_DocType;Doors_DocVer;Doors_Layer;Doors_RefName")
                                            arcpy.DeleteField_management(door_closed, "FID_" + out_CADDoor_dissolve)
                                            arcpy.CopyFeatures_management(door_closed,door_closed_facility)

                                            # Add Facility Fields
                                            arcpy.AddField_management(door_closed_facility, "FACILITY_ID", "TEXT", None, None, None, "FACILITY ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(door_closed_facility, "FACILITY_ID", "'" + FacilityID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(door_closed_facility, "FACILITY_ID", BuildingProperties, "FACILITY_ID", IndoorsUtilsModule.FACILITY_JN_FIELDS)

                                            # Add Floor Fields
                                            arcpy.AddField_management(door_closed, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(door_closed, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(door_closed, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                            arcpy.AddField_management(door_output, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(door_output, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(door_output, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                            arcpy.CopyFeatures_management(door_output,door_open)
                                    else:
                                        pass

                                    #  FACILITIES
                                    arcpy.AddIDMessage("INFORMATIVE", 180141, "FACILITIES")
                                    if merge_levels == 'Y':
                                        arcpy.AddIDMessage("INFORMATIVE", 180143)
                                    else:
                                        out_CADFacilityPoly = out_workspace_name + "_facility_poly_fc"
                                        facility_poly = os.path.join(out_CAD_gdb,out_CADFacilityPoly)
                                        facility_poly_lyr = arcpy.TableSelect_analysis(CADPoly, os.path.join(out_CAD_gdb,out_CADFacilityPoly+"_tbl"), myFacilityExpression)
                                        facility_poly_lyr_count = int(arcpy.GetCount_management(facility_poly_lyr).getOutput(0))

                                        if myFacilityExpression == nolyrs or facility_poly_lyr_count == 0:
                                            if myFacilityExpression != nolyrs and facility_poly_lyr_count == 0:
                                                arcpy.AddIDMessage("WARNING", 180147, "FACILITIES")
                                            pass
                                        else:
                                            arcpy.conversion.ExportFeatures(CADPoly, facility_poly, myFacilityExpression, False, r'Facility_Layer "Facility_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;Facility_RefName "Facility_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;Facility_DocName "Facility_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;Facility_DocPath "Facility_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Facility_DocType "Facility_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;Facility_DocVer "Facility_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPoly))
                                            arcpy.RepairGeometry_management(facility_poly, "DELETE_NULL", "ESRI")
                                            try:
                                                arcpy.DeleteIdentical_management(facility_poly, "Shape", None, 0)
                                            except arcpy.ExecuteError:
                                                arcpy.AddError(arcpy.GetMessages(2))
                                            except Exception as e:
                                                arcpy.AddError("{0}".format(e))
                                            arcpy.AddField_management(facility_poly, "FACILITY_ID", "TEXT", None, None, None, "FACILITY ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(facility_poly, "FACILITY_ID", "'" + FacilityID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(facility_poly, "FACILITY_ID", BuildingProperties, "FACILITY_ID", IndoorsUtilsModule.FACILITY_JN_FIELDS)

                                        #  FACILITY LINES
                                        out_CADFacilityPolyline_tmp = out_workspace_name + "_facility_line_tmp_fc"
                                        out_CADFacilityPolyline = out_workspace_name + "_facility_line_fc"
                                        facility_line = os.path.join(out_CAD_gdb, out_CADFacilityPolyline_tmp)
                                        facility_polyline_lyr = arcpy.TableSelect_analysis(CADPolyline, os.path.join(out_CAD_gdb,out_CADFacilityPolyline+"_tbl"), myFacilityPolylineExpression)
                                        facility_polyline_lyr_count = int(arcpy.GetCount_management(facility_polyline_lyr).getOutput(0))

                                        # if table has no data the import for Building Lines is skipped
                                        if myFacilityPolylineExpression == nolyrs or facility_polyline_lyr_count == 0:
                                            if myFacilityPolylineExpression != nolyrs and facility_polyline_lyr_count == 0:
                                                arcpy.AddIDMessage("WARNING", 180147, "FACILITY_LINES")
                                            pass
                                        else:
                                            arcpy.env.outputMFlag = "Disabled"
                                            arcpy.conversion.ExportFeatures(CADPolyline, facility_line, myFacilityPolylineExpression, False, r'FacilityPolyline_Layer "FacilityPolyline_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;FacilityPolyline_RefName "FacilityPolyline_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;FacilityPolyline_DocName "FacilityPolyline_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;FacilityPolyline_DocPath "FacilityPolyline_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;FacilityPolyline_DocType "FacilityPolyline_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;FacilityPolyline_DocVer "FacilityPolyline_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPolyline))
                                            arcpy.RepairGeometry_management(facility_line, "DELETE_NULL", "ESRI")
                                            arcpy.DeleteIdentical_management(facility_line, "Shape", None, 0)
                                            arcpy.AddField_management(facility_line, "FACILITY_ID", "TEXT", None, None, None, "FACILITY ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(facility_line, "FACILITY_ID", "'" + FacilityID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(facility_line, "FACILITY_ID", BuildingProperties, "FACILITY_ID", IndoorsUtilsModule.FACILITY_JN_FIELDS)

                                            #  TURN LINES TO POLYGONS AND ADD BUILDING FIELDS
                                            fc_line = os.path.join(out_CAD_gdb, out_CADFacilityPolyline_tmp)
                                            fc_line_out = os.path.join(out_CAD_gdb, out_CADFacilityPolyline)

                                            exclude_types = ['OID','Geometry']
                                            other_types = ['shape_area','shape_length']
                                            field_names = [f.name for f in arcpy.ListFields(fc_line)
                                                           if f.type not in exclude_types
                                                           and f.name.lower() not in other_types]
                                            field_names.remove('FACILITY_ID')

                                            out_CADFacilityPoly_tmp = out_workspace_name + "_facility_poly_tmp_fc"
                                            out_CADFacilityPoly_agg_tmp = out_workspace_name + "_facility_poly_tmp_agg_fc"

                                            out_CADFacilityPoly_tmp_renamed = out_workspace_name + "_facility_poly_tmp_renamed_fc"
                                            out_CADFacilityPoly_tmp_merge = out_workspace_name + "_facility_poly_tmp_merge_fc"
                                            facility_polytmp_tbl = os.path.join(out_CAD_gdb, out_CADFacilityPoly_tmp)
                                            facility_polytmp_tbl_agg = os.path.join(out_CAD_gdb, out_CADFacilityPoly_agg_tmp)
                                            facility_polytmp_renamed = os.path.join(out_CAD_gdb, out_CADFacilityPoly_tmp_renamed)
                                            facility_polytmp_merge = os.path.join(out_CAD_gdb, out_CADFacilityPoly_tmp_merge)

                                            #  Turn lines to Polygon and add Facility fields
                                            if Close_Doors == "Y" and door_polyline_lyr_count != 0 and arcpy.Exists(door_closed_facility):
                                                arcpy.Select_analysis(fc_line,fc_line_out,"{0}".format(myOpeningExpression.replace("Layer IN","FacilityPolyline_Layer NOT IN")))
                                                arcpy.Append_management(door_closed_facility, fc_line_out, "NO_TEST", r'FacilityPolyline_Layer "FacilityPolyline_Layer" true true false 255 Text 0 0,First,#,{0},Doors_Layer,0,255;FacilityPolyline_RefName "FacilityPolyline_RefName" true true false 255 Text 0 0,First,#,{0},Doors_RefName,0,255;FacilityPolyline_DocName "FacilityPolyline_DocName" true true false 255 Text 0 0,First,#,{0},Doors_DocName,0,255;FacilityPolyline_DocPath "FacilityPolyline_DocPath" true true false 4096 Text 0 0,First,#,{0},Doors_DocPath,0,4096;FacilityPolyline_DocType "FacilityPolyline_DocType" true true false 32 Text 0 0,First,#,{0},Doors_DocType,0,32;FacilityPolyline_DocVer "FacilityPolyline_DocVer" true true false 16 Text 0 0,First,#,{0},Doors_DocVer,0,16;SITE_ID "SITE_ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,255;SITE_NAME "SITE_NAME" true true false 255 Text 0 0,First,#,{0},SITE_NAME,0,255;FACILITY_ID "FACILITYID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;FACILITY_NUMBER "FACILITYNUMBER" true true false 2 Short 0 0,First,#,{0},FACILITY_NUMBER,-1,-1;NAME "NAME" true true false 255 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "NAME_LONG" true true false 255 Text 0 0,First,#,{0},NAME_LONG,0,255;DESCRIPTION "DESCRIPTION" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ADDRESS "ADDRESS" true true false 255 Text 0 0,First,#,{0},ADDRESS,0,255;UNIT "UNIT" true true false 255 Text 0 0,First,#,{0},UNIT,0,255;LOCALITY "LOCALITY" true true false 255 Text 0 0,First,#,{0},LOCALITY,0,255;PROVINCE "PROVINCE" true true false 255 Text 0 0,First,#,{0},PROVINCE,0,255;COUNTRY "COUNTRY" true true false 255 Text 0 0,First,#,{0},COUNTRY,0,255;POSTAL_CODE "POSTAL_CODE" true true false 255 Text 0 0,First,#,{0},POSTAL_CODE,0,255;DATE_BUILT "DATE_BUILT" true true false 8 Date 0 0,First,#,{0},DATE_BUILT,-1,-1;LEVELS_TOTAL "LEVELS_TOTAL" true true false 2 Short 0 0,First,#,{0},LEVELS_TOTAL,-1,-1;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;ROTATION "ROTATION" true true false 8 Double 0 0,First,#,{0},ROTATION,-1,-1;MERGE_LEVELS "MERGE_FLOORS" true true false 255 Text 0 0,First,#,{0},MERGE_LEVELS,0,255'.format(door_closed_facility), None)
                                            else:
                                                arcpy.CopyFeatures_management(fc_line,fc_line_out)

                                            arcpy.FeatureToPolygon_management(fc_line_out,facility_polytmp_tbl, "0.1 Feet", "NO_ATTRIBUTES", None)
                                            arcpy.management.Dissolve(facility_polytmp_tbl, facility_polytmp_tbl_agg, None, None, "MULTI_PART", "DISSOLVE_LINES")
                                            arcpy.RepairGeometry_management(facility_polytmp_tbl_agg, "DELETE_NULL", "ESRI")
                                            try:
                                                arcpy.DeleteIdentical_management(facility_polytmp_tbl_agg, "Shape", None, 0)
                                            except arcpy.ExecuteError:
                                                arcpy.AddError(arcpy.GetMessages(2))
                                            except Exception as e:
                                                arcpy.AddError("{0}".format(e))

                                            arcpy.AddField_management(facility_polytmp_tbl_agg, "FACILITY_ID", "TEXT", None, None, None, "FACILITY ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(facility_polytmp_tbl_agg, "FACILITY_ID", "'" + FacilityID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(facility_polytmp_tbl_agg, "FACILITY_ID", fc_line, "FACILITY_ID", field_names)
                                            # Update Attribute Names from Polyline to ""
                                            field_names = [f.name for f in arcpy.ListFields(facility_polytmp_tbl_agg)
                                                            if f.type not in exclude_types
                                                            and f.name.lower() not in other_types]
                                            arcpy.conversion.ExportFeatures(facility_polytmp_tbl_agg, facility_polytmp_renamed, None, False, 'FACILITY_ID "FACILITY ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;Facility_Layer "Facility_Layer" true true false 255 Text 0 0,First,#,{0},FacilityPolyline_Layer,0,255;Facility_RefName "Facility_RefName" true true false 255 Text 0 0,First,#,{0},FacilityPolyline_RefName,0,255;Facility_DocName "Facility_DocName" true true false 255 Text 0 0,First,#,{0},FacilityPolyline_DocName,0,255;Facility_DocPath "Facility_DocPath" true true false 4096 Text 0 0,First,#,{0},FacilityPolyline_DocPath,0,4096;Facility_DocType "Facility_DocType" true true false 32 Text 0 0,First,#,{0},FacilityPolyline_DocType,0,32;Facility_DocVer "Facility_DocVer" true true false 16 Text 0 0,First,#,{0},FacilityPolyline_DocVer,0,16;SITE_ID "SITE_ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,255;SITE_NAME "SITE_NAME" true true false 255 Text 0 0,First,#,{0},SITE_NAME,0,255;FACILITY_NUMBER "FACILITYNUMBER" true true false 2 Short 0 0,First,#,{0},FACILITY_NUMBER,-1,-1;NAME "NAME" true true false 255 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "NAME_LONG" true true false 255 Text 0 0,First,#,{0},NAME_LONG,0,255;DESCRIPTION "DESCRIPTION" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ADDRESS "ADDRESS" true true false 255 Text 0 0,First,#,{0},ADDRESS,0,255;UNIT "UNIT" true true false 255 Text 0 0,First,#,{0},UNIT,0,255;LOCALITY "LOCALITY" true true false 255 Text 0 0,First,#,{0},LOCALITY,0,255;PROVINCE "PROVINCE" true true false 255 Text 0 0,First,#,{0},PROVINCE,0,255;COUNTRY "COUNTRY" true true false 255 Text 0 0,First,#,{0},COUNTRY,0,255;POSTAL_CODE "POSTAL_CODE" true true false 255 Text 0 0,First,#,{0},POSTAL_CODE,0,255;DATE_BUILT "DATE_BUILT" true true false 8 Date 0 0,First,#,{0},DATE_BUILT,-1,-1;LEVELS_TOTAL "LEVELS_TOTAL" true true false 2 Short 0 0,First,#,{0},LEVELS_TOTAL,-1,-1;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;ROTATION "ROTATION" true true false 8 Double 0 0,First,#,{0},ROTATION,-1,-1;MERGE_LEVELS "MERGE_FLOORS" true true false 255 Text 0 0,First,#,{0},MERGE_LEVELS,0,255'.format(facility_polytmp_tbl_agg))
                                            if facility_poly_lyr_count == 0:
                                                 arcpy.CopyFeatures_management(facility_polytmp_renamed, facility_poly, None, None, None, None)
                                            else:
                                                arcpy.Merge_management([facility_polytmp_renamed,facility_poly],facility_polytmp_merge)
                                                arcpy.management.Dissolve(facility_polytmp_merge, facility_poly, "FACILITY_ID;Facility_Layer;Facility_RefName;Facility_DocName;Facility_DocPath;Facility_DocType;Facility_DocVer;SITE_ID;SITE_NAME;NAME;NAME_LONG;DESCRIPTION;ADDRESS;UNIT;LOCALITY;PROVINCE;COUNTRY;POSTAL_CODE;DATE_BUILT;LEVELS_TOTAL;ELEVATION_RELATIVE;ELEVATION_ABSOLUTE;HEIGHT_RELATIVE;HEIGHT_ABSOLUTE;ROTATION;MERGE_LEVELS", None, "MULTI_PART", "DISSOLVE_LINES")

                                    #  FLOOR POLYGONS
                                    arcpy.AddIDMessage("INFORMATIVE", 180141, "LEVELS")
                                    out_CADLevelPoly = out_workspace_name + "_level_poly_fc"
                                    level_poly = os.path.join(consolidatedGDB,out_CADLevelPoly)
                                    level_poly_dissolve = os.path.join(out_CAD_gdb,out_CADLevelPoly)
                                    level_poly_lyr = arcpy.TableSelect_analysis(CADPoly, os.path.join(out_CAD_gdb,out_CADLevelPoly+"_tbl"), myLevelExpression)
                                    level_poly_lyr_count = int(arcpy.GetCount_management(level_poly_lyr).getOutput(0))

                                    #  if table has no data the import for Floors is skipped
                                    if myLevelExpression == nolyrs or level_poly_lyr_count == 0:
                                        if myLevelExpression != nolyrs and level_poly_lyr_count == 0:
                                            arcpy.AddIDMessage("WARNING", 180147, "LEVELS")
                                        pass
                                    else:
                                        arcpy.conversion.ExportFeatures(CADPoly, level_poly, myLevelExpression, False) #, r'Level_Layer "Level_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;Level_RefName "Level_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;Level_DocName "Level_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;Level_DocPath "Level_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Level_DocType "Level_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;Level_DocVer "Level_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPoly))
                                        arcpy.RepairGeometry_management(level_poly, "DELETE_NULL", "ESRI")
                                        arcpy.DeleteIdentical_management(level_poly, "Shape", None, 0)
                                        arcpy.AddField_management(level_poly, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(level_poly, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(level_poly, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                        arcpy.Dissolve_management(level_poly, level_poly_dissolve, "SOURCE_PATH;FACILITY_ID;LEVELID;NAME_SHORT;NAME;DESCRIPTION;ACCESS_TYPE;LEVEL_NUMBER;CLOSE_DOORS;ELEVATION_ABSOLUTE;HEIGHT_ABSOLUTE;ELEVATION_RELATIVE;HEIGHT_RELATIVE;VERTICAL_ORDER", "Layer FIRST;RefName FIRST;DocVer FIRST;DocType FIRST", "MULTI_PART", "DISSOLVE_LINES")
                                        arcpy.AddField_management(level_poly_dissolve, "Level_Layer", "TEXT", None, None, None, "Layer", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(level_poly_dissolve, "Level_Layer", "!FIRST_Layer!", "PYTHON3", None)
                                        #arcpy.DeleteField_management(level_poly_dissolve, "FIRST_Level_Layer")
                                        arcpy.AddField_management(level_poly_dissolve, "Level_RefName", "TEXT", None, None, None, "RefName", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(level_poly_dissolve, "Level_RefName", "!FIRST_RefName!", "PYTHON3", None)
                                        #arcpy.DeleteField_management(level_poly_dissolve, "FIRST_Level_RefName")
                                        arcpy.AddField_management(level_poly_dissolve, "Level_DocVer", "TEXT", None, None, None, "Doc Version", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(level_poly_dissolve, "Level_DocVer", "!FIRST_DocVer!", "PYTHON3", None)
                                        arcpy.AddField_management(level_poly_dissolve, "Level_DocType", "TEXT", None, None, None, "Doc Type", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(level_poly_dissolve, "Level_DocType", "!FIRST_DocType!", "PYTHON3", None)
                                        arcpy.DeleteField_management(level_poly_dissolve, "FIRST_Level_DocVer;FIRST_RefName;FIRST_Layer")
                                        arcpy.CopyFeatures_management(level_poly_dissolve,level_poly)

                                    #  FLOOR POLYLINES
                                    out_CADLevelPolyline = out_workspace_name + "_level_line_fc"
                                    out_CADLevelPolyline_tmp = out_workspace_name + "_level_line_tmp_fc"
                                    level_polyline = os.path.join(out_CAD_gdb,out_CADLevelPolyline_tmp)
                                    level_polyline_tmp = os.path.join(out_CAD_gdb,out_CADLevelPolyline)
                                    level_polyline_lyr = os.path.join(out_CAD_gdb,out_CADLevelPolyline+"_tbl")
                                    arcpy.TableSelect_analysis(CADPolyline, level_polyline_lyr, myLevelPolylineExpression)
                                    level_polyline_lyr_count = int(arcpy.GetCount_management(level_polyline_lyr).getOutput(0))

                                    #  if table has no data the import for Floor Lines is skipped
                                    if myLevelPolylineExpression == nolyrs or level_polyline_lyr_count == 0:
                                        if myLevelPolylineExpression != nolyrs and level_polyline_lyr_count == 0:
                                            arcpy.AddIDMessage("WARNING", 180147, "LEVEL_LINES")
                                        pass
                                    else:
                                        arcpy.conversion.ExportFeatures(CADPolyline, level_polyline, myLevelPolylineExpression, False, r'LevelPolyline_Layer "LevelPolyline_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;LevelPolyline_RefName "LevelPolyline_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;LevelPolyline_DocName "LevelPolyline_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;LevelPolyline_DocPath "LevelPolyline_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Level_DocType "LevelPolyline_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;LevelPolyline_DocVer "Level_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPolyline))
                                        arcpy.RepairGeometry_management(level_polyline, "DELETE_NULL", "ESRI")
                                        try:
                                            arcpy.DeleteIdentical_management(level_polyline, "Shape", None, 0)
                                        except arcpy.ExecuteError:
                                            arcpy.AddError(arcpy.GetMessages(2))
                                            continue
                                        except Exception as e:
                                            arcpy.AddError("{0}".format(e))
                                            continue
                                        arcpy.AddField_management(level_polyline, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(level_polyline, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(level_polyline, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                        #  TURN LINES TO POLYGONS AND ADD FLOOR FIELDS
                                        fc_line = level_polyline
                                        fc_line_out = level_polyline_tmp

                                        exclude_types = ['OID', 'Geometry']
                                        other_types = ['shape_area', 'shape_length']
                                        field_names = [f.name for f in arcpy.ListFields(fc_line)
                                                       if f.type not in exclude_types
                                                       and f.name.lower() not in other_types]
                                        field_names.remove('LEVELID')

                                        #  Turn lines to Polygon and add Floor fields
                                        out_CADLevelPoly_tmp = out_workspace_name + "_level_poly_tmp_fc"
                                        out_CADLevelPoly_tmp_renamed = out_workspace_name + "_level_poly_tmp_renamed_fc"
                                        out_CADLevelPoly_tmp_merge = out_workspace_name + "_level_poly_tmp_merge_fc"
                                        level_polytmp_merge = os.path.join(out_CAD_gdb, out_CADLevelPoly_tmp_merge)
                                        level_polytmp_tbl = os.path.join(out_CAD_gdb, out_CADLevelPoly_tmp)
                                        level_polytmp_tbl_agg = os.path.join(out_CAD_gdb, out_CADLevelPoly_tmp + "_agg")
                                        level_polytmp_renamed = os.path.join(out_CAD_gdb, out_CADLevelPoly_tmp_renamed)

                                        #  Turn lines to Polygon and add Level fields
                                        if Close_Doors == "Y" and door_polyline_lyr_count != 0 and arcpy.Exists(door_closed):
                                            arcpy.Select_analysis(fc_line,fc_line_out,"{0}".format(myOpeningExpression.replace("Layer IN","LevelPolyline_Layer NOT IN")))
                                            arcpy.Append_management(door_closed, fc_line_out, "NO_TEST", 'LevelPolyline_Layer "LevelPolyline_Layer" true true false 255 Text 0 0,First,#,{0},Doors_Layer,0,255;LevelPolyline_RefName "LevelPolyline_RefName" true true false 255 Text 0 0,First,#,{0},Doors_RefName,0,255;LevelPolyline_DocName "LevelPolyline_DocName" true true false 255 Text 0 0,First,#,{0},Doors_DocName,0,255;LevelPolyline_DocPath "LevelPolyline_DocPath" true true false 4096 Text 0 0,First,#,{0},Doors_DocPath,0,4096;LevelPolyline_DocType "LevelPolyline_DocType" true true false 32 Text 0 0,First,#,{0},Doors_DocType,0,32;LevelPolyline_DocVer "LevelPolyline_DocVer" true true false 16 Text 0 0,First,#,{0},Doors_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "NAME" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE  "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE ,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(door_closed_facility), None)
                                        else:
                                            arcpy.CopyFeatures_management(fc_line,fc_line_out)

                                        arcpy.FeatureToPolygon_management(fc_line_out, level_polytmp_tbl, "0.1 Feet", "NO_ATTRIBUTES", None)
                                        arcpy.management.Dissolve(level_polytmp_tbl, level_polytmp_tbl_agg, None, None, "MULTI_PART", "DISSOLVE_LINES")
                                        arcpy.RepairGeometry_management(level_polytmp_tbl_agg, "DELETE_NULL", "ESRI")
                                        try:
                                            arcpy.DeleteIdentical_management(level_polytmp_tbl_agg, "Shape", None, 0)
                                        except arcpy.ExecuteError:
                                            arcpy.AddError(arcpy.GetMessages(2))
                                            continue
                                        except Exception as e:
                                            arcpy.AddError("{0}".format(e))
                                            continue

                                        arcpy.AddField_management(level_polytmp_tbl_agg, "LEVELID", "TEXT", None, None, None, "LEVEL ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(level_polytmp_tbl_agg, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(level_polytmp_tbl_agg, "LEVELID", fc_line, "LEVELID", field_names)

                                        # Update Attribute Names from Polyline to ""
                                        field_names = [f.name for f in arcpy.ListFields(level_polytmp_tbl_agg)
                                                       if f.type not in exclude_types
                                                       and f.name.lower() not in other_types]
                                        arcpy.conversion.ExportFeatures(level_polytmp_tbl_agg, level_polytmp_renamed, None, False, 'Level_Layer "Level_Layer" true true false 255 Text 0 0,First,#,{0},LevelPolyline_Layer,0,255;Level_RefName "Level_RefName" true true false 255 Text 0 0,First,#,{0},LevelPolyline_RefName,0,255;Level_DocName "Level_DocName" true true false 255 Text 0 0,First,#,{0},LevelPolyline_DocName,0,255;Level_DocPath "Level_DocPath" true true false 4096 Text 0 0,First,#,{0},LevelPolyline_DocPath,0,4096;Level_DocType "Level_DocType" true true false 32 Text 0 0,First,#,{0},LevelPolyline_DocType,0,32;Level_DocVer "Level_DocVer" true true false 16 Text 0 0,First,#,{0},LevelPolyline_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "NAME" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE  "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(level_polytmp_renamed))
                                        if level_poly_lyr_count == 0:
                                            arcpy.Dissolve_management(level_polytmp_renamed, level_poly, "SOURCE_PATH;FACILITY_ID;LEVELID;NAME_SHORT;NAME;DESCRIPTION;ACCESS_TYPE;LEVEL_NUMBER;VERTICAL_ORDER;ELEVATION_RELATIVE;ELEVATION_ABSOLUTE;HEIGHT_RELATIVE;HEIGHT_ABSOLUTE;CLOSE_DOORS", None, "MULTI_PART", "DISSOLVE_LINES")
                                            arcpy.CopyFeatures_management(level_poly,os.path.join(out_CAD_gdb,out_CADLevelPoly))
                                            # arcpy.CopyFeatures_management(level_polytmp_renamed, level_poly, None, None, None, None)
                                        else:
                                            # arcpy.Append_management(level_polytmp_renamed, level_poly, "TEST", None, None)
                                            arcpy.Merge_management([level_polytmp_renamed,level_poly],level_polytmp_merge)
                                            arcpy.Dissolve_management(level_polytmp_merge, level_poly, "SOURCE_PATH;FACILITY_ID;LEVELID;NAME_SHORT;NAME;DESCRIPTION;ACCESS_TYPE;LEVEL_NUMBER;VERTICAL_ORDER;ELEVATION_RELATIVE;ELEVATION_ABSOLUTE;HEIGHT_RELATIVE;HEIGHT_ABSOLUTE;CLOSE_DOORS", None, "MULTI_PART", "DISSOLVE_LINES")
                                            arcpy.CopyFeatures_management(level_poly, os.path.join(out_CAD_gdb, out_CADLevelPoly))

                                    #  ZONES
                                    if zone_fc:
                                        arcpy.AddIDMessage("INFORMATIVE", 180141, "ZONES")
                                        out_CADZonePoly = out_workspace_name + "_zone_poly_fc"
                                        zone_poly = os.path.join(consolidatedGDB,out_CADZonePoly)
                                        zone_poly_lyr = arcpy.TableSelect_analysis(CADPoly, os.path.join(out_CAD_gdb,out_CADZonePoly+"_tbl"), myZoneExpression)
                                        zone_poly_lyr_count = int(arcpy.GetCount_management(zone_poly_lyr).getOutput(0))

                                        # if table has no data the import for Buildings is skipped
                                        if myZoneExpression == nolyrs or zone_poly_lyr_count == 0:
                                            if myZoneExpression != nolyrs and zone_poly_lyr_count == 0:
                                                arcpy.AddIDMessage("WARNING", 180147, "ZONES")
                                            pass
                                        else:
                                            arcpy.conversion.ExportFeatures(CADPoly, zone_poly, myZoneExpression, False, r'Zone_Layer "Zone_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;Zone_RefName "Zone_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;Zone_DocName "Zone_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;Zone_DocPath "Zone_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Zone_DocType "Zone_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;Zone_DocVer "Zone_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPoly))
                                            arcpy.RepairGeometry_management(zone_poly, "DELETE_NULL", "ESRI")
                                            arcpy.DeleteIdentical_management(zone_poly, "Shape", None, 0)
                                            arcpy.AddField_management(zone_poly, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(zone_poly, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(zone_poly, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                        #  ZONE POLYLINES
                                        out_CADZonePolyline = out_workspace_name + "_zone_line_fc"
                                        zone_polyline = os.path.join(out_CAD_gdb,out_CADZonePolyline)
                                        zone_polyline_lyr = os.path.join(out_CAD_gdb,out_CADZonePolyline+"_tbl")
                                        arcpy.TableSelect_analysis(CADPolyline, zone_polyline_lyr, myZoneLineExpression)
                                        zone_polyline_lyr_count = int(arcpy.GetCount_management(zone_polyline_lyr).getOutput(0))
                                        #  if table has no data the import for Zone Lines is skipped
                                        if myZoneLineExpression == nolyrs or zone_polyline_lyr_count == 0:
                                            if myZoneLineExpression != nolyrs and zone_polyline_lyr_count == 0:
                                                arcpy.AddIDMessage("WARNING", 180147, "ZONE_LINES")
                                            pass
                                        else:
                                            arcpy.conversion.ExportFeatures(CADPolyline, zone_polyline, myZoneLineExpression, False,  r'ZonePolyline_Layer "ZonePolyline_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;ZonePolyline_RefName "ZonePolyline_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;ZonePolyline_DocName "ZonePolyline_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;ZonePolyline_DocPath "ZonePolyline_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Zone_DocType "ZonePolyline_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;ZonePolyline_DocVer "Zone_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPolyline))
                                            arcpy.RepairGeometry_management(zone_polyline, "DELETE_NULL", "ESRI")
                                            arcpy.DeleteIdentical_management(zone_polyline, "Shape", None, 0)
                                            arcpy.AddField_management(zone_polyline, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(zone_polyline, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(zone_polyline, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                            fc_line = zone_polyline
                                            exclude_types = ['OID', 'Geometry']
                                            other_types = ['shape_area', 'shape_length']
                                            field_names = [f.name for f in arcpy.ListFields(fc_line)
                                                           if f.type not in exclude_types
                                                           and f.name.lower() not in other_types]
                                            field_names.remove('LEVELID')

                                            #  Turn lines to Polygon and add Floor fields
                                            out_CADZonePoly_tmp = out_workspace_name + "_zone_poly_tmp_fc"
                                            out_CADZonePoly_tmp_renamed = out_workspace_name + "_zone_poly_tmp_renamed_fc"
                                            zone_polytmp_tbl = os.path.join(out_CAD_gdb,out_CADZonePoly_tmp)
                                            zone_polytmp_renamed = os.path.join(out_CAD_gdb,out_CADZonePoly_tmp_renamed)
                                            # Set the outputMFlag environment to Enabled
                                            arcpy.env.outputMFlag = "Disabled"
                                            arcpy.FeatureToPolygon_management(fc_line, zone_polytmp_tbl, "0.1 Feet", "NO_ATTRIBUTES", None)
                                            arcpy.RepairGeometry_management(zone_polytmp_tbl, "DELETE_NULL", "ESRI")
                                            arcpy.DeleteIdentical_management(zone_polytmp_tbl, "Shape", None, 0)
                                            arcpy.AddField_management(zone_polytmp_tbl, "LEVELID", "TEXT", None, None, None, "LEVEL ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(zone_polytmp_tbl, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(zone_polytmp_tbl, "LEVELID", fc_line, "LEVELID", field_names)
                                            # Update Attribute Names from Polyline to ""
                                            field_names = [f.name for f in arcpy.ListFields(zone_polytmp_tbl)
                                                           if f.type not in exclude_types
                                                           and f.name.lower() not in other_types]
                                            arcpy.conversion.ExportFeatures(zone_polytmp_tbl, zone_polytmp_renamed, None, False, 'Zone_Layer "Zone_Layer" true true false 255 Text 0 0,First,#,{0},ZonePolyline_Layer,0,255;Zone_RefName "Zone_RefName" true true false 255 Text 0 0,First,#,{0},ZonePolyline_RefName,0,255;Zone_DocName "Zone_DocName" true true false 255 Text 0 0,First,#,{0},ZonePolyline_DocName,0,255;Zone_DocPath "Zone_DocPath" true true false 4096 Text 0 0,First,#,{0},ZonePolyline_DocPath,0,4096;Zone_DocType "Zone_DocType" true true false 32 Text 0 0,First,#,{0},ZonePolyline_DocType,0,32;Zone_DocVer "Zone_DocVer" true true false 16 Text 0 0,First,#,{0},ZonePolyline_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(zone_polytmp_renamed))
                                            if zone_poly_lyr_count == 0:
                                                arcpy.CopyFeatures_management(zone_polytmp_renamed, zone_poly, None, None, None, None)
                                            else:
                                                arcpy.Append_management(zone_polytmp_renamed, zone_poly, "NO_TEST", 'Zone_Layer "Zone_Layer" true true false 255 Text 0 0,First,#,{0},Zone_Layer,0,255;Zone_RefName "Zone_RefName" true true false 255 Text 0 0,First,#,{0},Zone_RefName,0,255;Zone_DocName "Zone_DocName" true true false 255 Text 0 0,First,#,{0},Zone_DocName,0,255;Zone_DocPath "Zone_DocPath" true true false 4096 Text 0 0,First,#,{0},Zone_DocPath,0,4096;Zone_DocType "Zone_DocType" true true false 32 Text 0 0,First,#,{0},Zone_DocType,0,32;Zone_DocVer "Zone_DocVer" true true false 16 Text 0 0,First,#,{0},Zone_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(zone_polytmp_renamed), None)

                                    #  SECTIONS
                                    if section_fc:
                                        arcpy.AddIDMessage("INFORMATIVE", 180141, "SECTIONS")
                                        out_CADSectionPoly = out_workspace_name + "_section_poly_fc"
                                        section_poly = os.path.join(consolidatedGDB,out_CADSectionPoly)
                                        section_poly_lyr = arcpy.TableSelect_analysis(CADPoly, os.path.join(out_CAD_gdb,out_CADSectionPoly+"_tbl"), mySectionExpression)
                                        section_poly_lyr_count = int(arcpy.GetCount_management(section_poly_lyr).getOutput(0))

                                        # if table has no data the import for Buildings is skipped
                                        if mySectionExpression == nolyrs or section_poly_lyr_count == 0:
                                            if mySectionExpression != nolyrs and section_poly_lyr_count == 0:
                                                arcpy.AddIDMessage("WARNING", 180147, "SECTIONS")
                                            pass
                                        else:
                                            arcpy.conversion.ExportFeatures(CADPoly, section_poly, mySectionExpression, False, r'Section_Layer "Section_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;Section_RefName "Section_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;Section_DocName "Section_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;Section_DocPath "Section_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Section_DocType "Section_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;Section_DocVer "Section_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPoly))
                                            arcpy.RepairGeometry_management(section_poly, "DELETE_NULL", "ESRI")
                                            arcpy.DeleteIdentical_management(section_poly, "Shape", None, 0)
                                            arcpy.AddField_management(section_poly, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(section_poly, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(section_poly, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                        #  SECTION POLYLINES
                                        out_CADSectionPolyline = out_workspace_name + "_section_line_fc"
                                        section_polyline = os.path.join(out_CAD_gdb,out_CADSectionPolyline)
                                        section_polyline_lyr = os.path.join(out_CAD_gdb,out_CADSectionPolyline+"_tbl")
                                        arcpy.TableSelect_analysis(CADPolyline, section_polyline_lyr, mySectionLineExpression)
                                        section_polyline_lyr_count = int(arcpy.GetCount_management(section_polyline_lyr).getOutput(0))
                                        #  if table has no data the import for Section Lines is skipped
                                        if mySectionLineExpression == nolyrs or section_polyline_lyr_count == 0:
                                            if mySectionLineExpression != nolyrs and section_polyline_lyr_count == 0:
                                                arcpy.AddIDMessage("WARNING", 180147, "SECTION_LINES")
                                            pass
                                        else:
                                            arcpy.conversion.ExportFeatures(CADPolyline, section_poly, mySectionLineExpression, False, r'SectionPolyline_Layer "SectionPolyline_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;SectionPolyline_RefName "SectionPolyline_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;SectionPolyline_DocName "SectionPolyline_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;SectionPolyline_DocPath "SectionPolyline_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Section_DocType "SectionPolyline_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;SectionPolyline_DocVer "Section_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPolyline))
                                            arcpy.RepairGeometry_management(section_polyline, "DELETE_NULL", "ESRI")
                                            arcpy.DeleteIdentical_management(section_polyline, "Shape", None, 0)
                                            arcpy.AddField_management(section_polyline, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(section_polyline, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(section_polyline, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                            fc_line = section_polyline
                                            exclude_types = ['OID', 'Geometry']
                                            other_types = ['shape_area', 'shape_length']
                                            field_names = [f.name for f in arcpy.ListFields(fc_line)
                                                           if f.type not in exclude_types
                                                           and f.name.lower() not in other_types]
                                            field_names.remove('LEVELID')

                                            #  Turn lines to Polygon and add Floor fields
                                            out_CADSectionPoly_tmp = out_workspace_name + "_section_poly_tmp_fc"
                                            out_CADSectionPoly_tmp_renamed = out_workspace_name + "_section_poly_tmp_renamed_fc"
                                            section_polytmp_tbl = os.path.join(out_CAD_gdb,out_CADSectionPoly_tmp)
                                            section_polytmp_renamed = os.path.join(out_CAD_gdb,out_CADSectionPoly_tmp_renamed)
                                            arcpy.FeatureToPolygon_management(fc_line, section_polytmp_tbl, "0.1 Feet", "NO_ATTRIBUTES", None)
                                            arcpy.RepairGeometry_management(section_polytmp_tbl, "DELETE_NULL", "ESRI")
                                            arcpy.DeleteIdentical_management(section_polytmp_tbl, "Shape", None, 0)
                                            arcpy.AddField_management(section_polytmp_tbl, "LEVELID", "TEXT", None, None, None, "LEVEL ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(section_polytmp_tbl, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(section_polytmp_tbl, "LEVELID", fc_line, "LEVELID", field_names)
                                            # Update Attribute Names from Polyline to ""
                                            field_names = [f.name for f in arcpy.ListFields(section_polytmp_tbl)
                                                           if f.type not in exclude_types
                                                           and f.name.lower() not in other_types]
                                            arcpy.conversion.ExportFeatures(section_polytmp_tbl, section_polytmp_renamed, None, False, 'Section_Layer "Section_Layer" true true false 255 Text 0 0,First,#,{0},SectionPolyline_Layer,0,255;Section_RefName "Section_RefName" true true false 255 Text 0 0,First,#,{0},SectionPolyline_RefName,0,255;Section_DocName "Section_DocName" true true false 255 Text 0 0,First,#,{0},SectionPolyline_DocName,0,255;Section_DocPath "Section_DocPath" true true false 4096 Text 0 0,First,#,{0},SectionPolyline_DocPath,0,4096;Section_DocType "Section_DocType" true true false 32 Text 0 0,First,#,{0},SectionPolyline_DocType,0,32;Section_DocVer "Section_DocVer" true true false 16 Text 0 0,First,#,{0},SectionPolyline_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "NAME" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(section_polytmp_renamed))
                                            if section_poly_lyr_count == 0:
                                                arcpy.CopyFeatures_management(section_polytmp_renamed, section_poly, None, None, None, None)
                                            else:
                                                arcpy.Append_management(section_polytmp_renamed, section_poly, "NO_TEST", 'Section_Layer "Section_Layer" true true false 255 Text 0 0,First,#,{0},Section_Layer,0,255;Section_RefName "Section_RefName" true true false 255 Text 0 0,First,#,{0},Section_RefName,0,255;Section_DocName "Section_DocName" true true false 255 Text 0 0,First,#,{0},Section_DocName,0,255;Section_DocPath "Section_DocPath" true true false 4096 Text 0 0,First,#,{0},Section_DocPath,0,4096;Section_DocType "Section_DocType" true true false 32 Text 0 0,First,#,{0},Section_DocType,0,32;Section_DocVer "Section_DocVer" true true false 16 Text 0 0,First,#,{0},Section_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(section_polytmp_renamed), None)

                                    #  UNITS
                                    arcpy.AddIDMessage("INFORMATIVE", 180141, "UNITS")
                                    out_CADUnitPoly = out_workspace_name + "_unit_poly_fc"
                                    unit_poly = os.path.join(consolidatedGDB,out_CADUnitPoly)
                                    unit_poly_lyr = arcpy.TableSelect_analysis(CADPoly, os.path.join(out_CAD_gdb,out_CADUnitPoly+"_tbl"), myUnitExpression)
                                    unit_poly_lyr_count = int(arcpy.GetCount_management(unit_poly_lyr).getOutput(0))

                                    #  if table has no data the import for Units is skipped
                                    if unit_poly_lyr_count == 0 or myUnitExpression == nolyrs:
                                        if myUnitExpression != nolyrs and unit_poly_lyr_count == 0:
                                            arcpy.AddIDMessage("WARNING", 180147, "UNITS")
                                        pass
                                    else:
                                        arcpy.conversion.ExportFeatures(CADPoly,unit_poly, myUnitExpression, False,  r'Unit_Layer "Unit_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;Unit_RefName "Unit_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;Unit_DocName "Unit_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;Unit_DocPath "Unit_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;Unit_DocType "Unit_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;Unit_DocVer "Unit_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPoly))
                                        arcpy.RepairGeometry_management(unit_poly, "DELETE_NULL", "ESRI")
                                        arcpy.DeleteIdentical_management(unit_poly, "Shape", None, 0)
                                        arcpy.AddField_management(unit_poly, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(unit_poly, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(unit_poly, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                    #  UNITS POLYLINE
                                    out_CADUnitPolyline = out_workspace_name + "_unit_line_fc"
                                    out_CADUnitPoly_tmp = out_workspace_name + "_unit_poly_tmp_fc"
                                    out_CADUnitPoly_tmp_renamed = out_workspace_name + "_unit_poly_tmp_renamed_fc"
                                    out_CADUnitPolyline_tmp_renamed = out_workspace_name + "_unit_line_tmp_renamed_fc"
                                    unit_polyline_lyr = arcpy.TableSelect_analysis(CADPolyline, os.path.join(out_CAD_gdb,out_CADUnitPolyline+"_tbl"), myUnitPolylineExpression)
                                    unit_polyline_lyr_count = int(arcpy.GetCount_management(unit_polyline_lyr).getOutput(0))
                                    out_CADUnitPolyline_tmp = out_workspace_name + "_unit_line_tmp_fc"
                                    fc_line = os.path.join(out_CAD_gdb, out_CADUnitPolyline_tmp)
                                    fc_line_out = os.path.join(out_CAD_gdb, out_CADUnitPolyline)

                                    if unit_polyline_lyr_count == 0 or myUnitPolylineExpression == nolyrs:
                                        if myUnitPolylineExpression != nolyrs and unit_polyline_lyr_count == 0:
                                            arcpy.AddIDMessage("WARNING", 180147, "UNIT_LINES")
                                        pass
                                    else:
                                        arcpy.conversion.ExportFeatures(CADPolyline,fc_line, myUnitPolylineExpression, False, r'UnitPolyline_Layer "UnitPolyline_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;UnitPolyline_RefName "UnitPolyline_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;UnitPolyline_DocName "UnitPolyline_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;UnitPolyline_DocPath "UnitPolyline_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;UnitPolyline_DocType "UnitPolyline_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;UnitPolyline_DocVer "UnitPolyline_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADPolyline))
                                        arcpy.RepairGeometry_management(fc_line, "DELETE_NULL", "ESRI")
                                        try:
                                            arcpy.DeleteIdentical_management(fc_line, "Shape", None, 0)
                                        except Exception as e:
                                            pass
                                        arcpy.AddField_management(fc_line, "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(fc_line, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(fc_line, "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)

                                        #  TURN LINES TO POLYGONS AND ADD LEVEL FIELDS
                                        exclude_types = ['OID', 'Geometry']
                                        other_types = ['shape_area', 'shape_length']
                                        unit_line_field_names = [f.name for f in arcpy.ListFields(fc_line)
                                                       if f.type not in exclude_types
                                                       and f.name.lower() not in other_types]
                                        unit_line_field_names.remove('LEVELID')

                                        #  Turn lines to Polygon and add Floor fields
                                        if Close_Doors == "Y" and arcpy.Exists(door_closed):
                                            arcpy.Select_analysis(fc_line,fc_line_out,"{0}".format(myOpeningExpression.replace("Layer IN","UnitPolyline_Layer NOT IN")))
                                            arcpy.Append_management(door_closed, fc_line_out, "NO_TEST", r'UnitPolyline_Layer "Unit_Layer" true true false 255 Text 0 0,First,#,{0},Doors_Layer,0,255;UnitPolyline_RefName "Unit_RefName" true true false 255 Text 0 0,First,#,{0},Doors_RefName,0,255;UnitPolyline_DocName "Unit_DocName" true true false 255 Text 0 0,First,#,{0},Doors_DocName,0,255;UnitPolyline_DocPath "Unit_DocPath" true true false 4096 Text 0 0,First,#,{0},Doors_DocPath,0,4096;UnitPolyline_DocType "Unit_DocType" true true false 32 Text 0 0,First,#,{0},Doors_DocType,0,32;UnitPolyline_DocVer "Unit_DocVer" true true false 16 Text 0 0,First,#,{0},Doors_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(door_closed), None)
                                        else:
                                            arcpy.CopyFeatures_management(fc_line,fc_line_out)
                                        exclude_types = ['OID', 'Geometry']
                                        other_types = ['shape_area', 'shape_length']
                                        field_names = [f.name for f in arcpy.ListFields(fc_line_out)
                                                       if f.type not in exclude_types
                                                       and f.name.lower() not in other_types]
                                        unit_polytmp_tbl = os.path.join(out_CAD_gdb, out_CADUnitPolyline_tmp)
                                        out_CADUnitPolyline_no_slivers_tmp = out_workspace_name + "_unit_line_tmp_no_slivers_fc"
                                        out_CADUnitPolyline_no_slivers_tmp_renamed = out_workspace_name + "_unit_line_tmp_no_slivers_renamed_fc"
                                        unit_polytmp_no_slivers = os.path.join(out_CAD_gdb, out_CADUnitPolyline_no_slivers_tmp)
                                        unit_polytmp_no_slivers_renamed = os.path.join(out_CAD_gdb, out_CADUnitPolyline_no_slivers_tmp_renamed)
                                        unit_polytmp_slivers = os.path.join(qa_GDB, out_workspace_name + "line_to_unit_slivers")
                                        arcpy.FeatureToPolygon_management(fc_line_out, unit_polytmp_tbl, None, "NO_ATTRIBUTES", None)
                                        arcpy.RepairGeometry_management(unit_polytmp_tbl, "DELETE_NULL", "ESRI")
                                        try:
                                            arcpy.DeleteIdentical_management(unit_polytmp_tbl, "Shape", None, 0)
                                        except Exception as e:
                                            pass
                                        arcpy.Select_analysis(unit_polytmp_tbl,unit_polytmp_no_slivers,r"Shape_Length < (Shape_Area*{0})".format(int(Sliver_Threshold)))
                                        arcpy.Select_analysis(unit_polytmp_tbl,unit_polytmp_slivers,r"Shape_Length > (Shape_Area*{0})".format(int(Sliver_Threshold)))
                                        # Add Floor Information to Units Created from Lines
                                        arcpy.AddField_management(unit_polytmp_no_slivers, "LEVELID", "TEXT", None, None, None, "LEVEL ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(unit_polytmp_no_slivers, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(unit_polytmp_no_slivers, "LEVELID", fc_line_out, "LEVELID", field_names)
                                        # Add Floor Information to Sliver Polygons
                                        arcpy.AddField_management(unit_polytmp_slivers, "Layer", "TEXT", None, None, None, "Layer", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(unit_polytmp_slivers, "Layer", "'A-WALL-OTLN-DERIVED'", "PYTHON3", None)
                                        arcpy.AddField_management(unit_polytmp_slivers, "LEVELID", "TEXT", None, None, None, "LEVEL ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(unit_polytmp_slivers, "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(unit_polytmp_slivers, "LEVELID", fc_line_out, "LEVELID", field_names)

                                        # Update Attribute Names from Polyline to ""
                                        unit_poly_field_names = [f.name for f in arcpy.ListFields(unit_polytmp_no_slivers)
                                                       if f.type not in exclude_types
                                                       and f.name.lower() not in other_types]
                                        arcpy.conversion.ExportFeatures(unit_polytmp_no_slivers,unit_polytmp_no_slivers_renamed, None, False, 'Unit_Layer "Unit_Layer" true true false 255 Text 0 0,First,#,{0},UnitPolyline_Layer,0,255;Unit_RefName "Unit_RefName" true true false 255 Text 0 0,First,#,{0},UnitPolyline_RefName,0,255;Unit_DocName "Unit_DocName" true true false 255 Text 0 0,First,#,{0},UnitPolyline_DocName,0,255;Unit_DocPath "Unit_DocPath" true true false 4096 Text 0 0,First,#,{0},UnitPolyline_DocPath,0,4096;Unit_DocType "Unit_DocType" true true false 32 Text 0 0,First,#,{0},UnitPolyline_DocType,0,32;Unit_DocVer "Unit_DocVer" true true false 16 Text 0 0,First,#,{0},UnitPolyline_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(unit_polytmp_no_slivers_renamed))

                                        # Update Attribute Names from Polyline to ""
                                        sliver_poly_field_names = [f.name for f in arcpy.ListFields(unit_polytmp_slivers)
                                                       if f.type not in exclude_types
                                                       and f.name.lower() not in other_types]
                                        for field in sliver_poly_field_names:
                                            arcpy.AlterField_management(unit_polytmp_slivers, field, str.replace(field, "Polyline", ""))

                                        #  MERGE UNITS FROM LINES WITH UNITS FROM POLYS
                                        if unit_poly_lyr_count == 0:
                                            arcpy.CopyFeatures_management(unit_polytmp_no_slivers_renamed, unit_poly, None, None, None, None)
                                            # arcpy.CopyFeatures_management(unit_poly,os.path.join(consolidatedGDB,out_CADUnitPoly),None, None, None, None)
                                        else:
                                            arcpy.Append_management(unit_polytmp_no_slivers_renamed, unit_poly, "NO_TEST", 'Unit_Layer "Unit_Layer" true true false 255 Text 0 0,First,#,{0},Unit_Layer,0,255;Unit_RefName "Unit_RefName" true true false 255 Text 0 0,First,#,{0},Unit_RefName,0,255;Unit_DocName "Unit_DocName" true true false 255 Text 0 0,First,#,{0},Unit_DocName,0,255;Unit_DocPath "Unit_DocPath" true true false 4096 Text 0 0,First,#,{0},Unit_DocPath,0,4096;Unit_DocType "Unit_DocType" true true false 32 Text 0 0,First,#,{0},Unit_DocType,0,32;Unit_DocVer "Unit_DocVer" true true false 16 Text 0 0,First,#,{0},Unit_DocVer,0,16;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "Floor Name" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "Name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255'.format(unit_polytmp_no_slivers_renamed), None)

                                    #  MERGE SPACE ANNOTATION Variables
                                    arcpy.AddIDMessage("INFORMATIVE", 180148, "UNITS")
                                    out_CADSpaceID_Annotation = out_workspace_name + "_unitID_anno_fc"
                                    out_CADSpaceName_Annotation = out_workspace_name + "_unit_Name_anno_fc"
                                    out_CADSpaceUse_Annotation = out_workspace_name + "_unit_Use_anno_fc"
                                    out_CADSpaceDepartment_Annotation = out_workspace_name + "_unit_Department_anno_fc"
                                    out_CADSpaceEmployee_Annotation = out_workspace_name + "_unit_Employee_anno_fc"
                                    out_CADSpace_Anno_merge = out_workspace_name + "_unit_anno_fc_merge"
                                    anno_id_fcnm =  out_CADSpaceID_Annotation
                                    anno_name_fcnm = out_CADSpaceName_Annotation
                                    anno_use_fcnm = out_CADSpaceUse_Annotation
                                    anno_dept_fcnm = out_CADSpaceDepartment_Annotation
                                    anno_emp_fcnm = out_CADSpaceEmployee_Annotation

                                    anno_id_fc =  os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation)
                                    anno_name_fc = os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation)
                                    anno_use_fc = os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation)
                                    anno_dept_fc = os.path.join(out_CAD_gdb, out_CADSpaceDepartment_Annotation)
                                    anno_emp_fc = os.path.join(out_CAD_gdb, out_CADSpaceEmployee_Annotation)

                                    target_fc = os.path.join(out_CAD_gdb, out_CADSpace_Anno_merge)

                                    ID_txt = "UNIT_ID"
                                    Name_txt = "UNIT_NAME"
                                    Use_txt = "UNIT_USE_TYPE"

                                    #  BLOCK VARIABLES
                                    processUnitIDAnnoType = [] ## ['none','annotation','blocks','multiline']
                                    processUnitIDAnnoType.clear()
                                    blockUnitIDfield = []
                                    blockUnitIDfield.clear()

                                    with arcpy.da.SearchCursor(UnitID_layer_mapping_summary_tbl,['UNIT_ID','UNIT_ID_Raw','UNIT_ID_Line','UNIT_ID_Delimiter']) as blockCursor:
                                        for row in blockCursor:
                                            try:
                                                cadLayer = row[1]
                                                textLine = row[2]
                                                delimiter = row[3]
                                                if delimiter == None:
                                                    if cadLayer == None:
                                                        processUnitIDAnnoType.append('none')
                                                    else:
                                                        processUnitIDAnnoType.append('annotation')
                                                elif delimiter[:1] == '{' and delimiter[-1:] == '}':
                                                    processUnitIDAnnoType.append('blocks')
                                                    blockUnitIDfield.append(delimiter[1:-1])
                                                else:
                                                    processUnitIDAnnoType.append('multiline')
                                            except:
                                                processUnitIDAnnoType.append('none')
                                        else:
                                            processUnitIDAnnoType.append('none')

                                    if processUnitIDAnnoType[0] == 'none':
                                        arcpy.AddIDMessage("WARNING", 180149, "UNIT_ID", "UNIT_ID")
                                    elif processUnitIDAnnoType[0] == 'annotation':
                                        arcpy.AddIDMessage("INFORMATIVE", 180150, "UNIT_ID")
                                    elif processUnitIDAnnoType[0] == 'blocks':
                                        arcpy.AddIDMessage("INFORMATIVE", 180151, "UNIT_ID")
                                    else:
                                        arcpy.AddIDMessage("INFORMATIVE", 180152, "UNIT_ID")

                                    #  SPACE ID ANNOTATION
                                    if processUnitIDAnnoType[0] != 'blocks':
                                        space_id_lyr = arcpy.TableSelect_analysis(CADAnno, os.path.join(out_CAD_gdb,out_CADSpaceID_Annotation+"_tbl"), myUnitIDExpression)
                                    else:
                                        space_id_lyr = arcpy.TableSelect_analysis(CADBlock, os.path.join(out_CAD_gdb,out_CADSpaceID_Annotation+"_tbl"), myUnitIDExpression)
                                    space_id_lyr_count = int(arcpy.GetCount_management(space_id_lyr).getOutput(0))
                                    spaceID_codeblock = "'{0}{1}'+!UNIT_NUMBER!".format(FloorID, UniqueID_delimiter)
                                    #  string format like "'{0}' + str(!OBJECTID!)".format(prefix)

                                    #  if table has no data the import for Space ID generates on the fly values from the unit geometry
                                    if not arcpy.Exists(unit_poly):
                                        pass

                                    if arcpy.Exists(unit_poly) and space_id_lyr_count == 0:
                                        arcpy.FeatureToPoint_management(unit_poly,anno_id_fc,'INSIDE')
                                        arcpy.AddField_management(anno_id_fc, "UNIT_NUMBER", "TEXT", None, None, None, "Unit Number (Text)", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.AddField_management(anno_id_fc, "UNIT_ID", "TEXT", None, None, None, "Unit ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(anno_id_fc, "UNIT_NUMBER", "str(!VERTICAL_ORDER!+1) + str(!OBJECTID!)", "PYTHON3", None)
                                        arcpy.CalculateField_management(anno_id_fc, "UNIT_ID", spaceID_codeblock, "PYTHON3", None)
                                        arcpy.CopyFeatures_management("{0}".format(anno_id_fc), r"{}".format(target_fc), None, None, None, None)
                                        arcpy.DeleteField_management("{0}".format(target_fc), "{0}_DocVer;{0}_DocType;{0}_DocPath;{0}_DocName;{0}_RefName;{0}_Layer;MERGE_ZONES;CLOSE_DOORS".format('Unit'))
                                        arcpy.AddField_management(target_fc, "UNIT_NAME", "TEXT", None, None, None, "Unit Name", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.AddField_management(target_fc, "UNIT_USE", "TEXT", None, None, None, "Unit Use", "NULLABLE", "NON_REQUIRED", None)

                                    if space_id_lyr_count > 0 and myUnitIDExpression != nolyrs:
                                        if processUnitIDAnnoType[0] != 'blocks':
                                            anno_id_fc_type = anno_id_fc + "_type"
                                            arcpy.conversion.ExportFeatures(CADAnno, anno_id_fc_type, myUnitIDExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},Text,0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADAnno,ID_txt))
                                            arcpy.FeatureToPoint_management(anno_id_fc_type, anno_id_fc,'INSIDE')
                                        else:
                                            arcpy.conversion.ExportFeatures(CADBlock, anno_id_fc, myUnitIDExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},{2},0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADBlock,ID_txt,blockUnitIDfield[0]))

                                        arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "Shape", None, 0)
                                        arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                        arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "{0}_Anno_Layer".format(ID_txt), UnitID_layer_mapping_summary_tbl, "{0}_Raw".format(ID_txt), "{0}_Line;{0}_Delimiter".format(ID_txt))
                                        arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "UNIT_NUMBER", "TEXT", None, None, None, "Unit Number (Text)", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "UNIT_ID", "TEXT", None, None, None, "Unit ID", "NULLABLE", "NON_REQUIRED", None)

                                        if processUnitIDAnnoType[0] != 'blocks':
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "UNIT_NUMBER", "var(!OBJECTID!,!{0}_Anno_Text!.strip(),!{0}_Anno_RefName!,!{0}_Delimiter!,!{0}_Line!)".format(ID_txt), "PYTHON3", "def var(oid,text,id,delim,line):\n    if delim is None:\n        if text is None or text == '':\n            return str(oid)\n        elif text.isdigit():\n            return text\n        else:\n            return text.replace(' ','')[:20]\n    elif line is None:\n        if id is None or id == '':\n            return str(oid)\n        if id.isdigit():\n            return id\n        else:\n            return id.replace(' ','')[:20]\n    elif id.count(delim)+1 < int(line):\n        return id.split(delim)[(id.count(delim)+1)-1].strip()\n    else:\n        return id.split(delim)[int(line)-1].strip()")
                                        else:
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "UNIT_NUMBER","!{}_Anno_Text!".format(ID_txt), "PYTHON3", None)
                                        arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceID_Annotation), "UNIT_ID", spaceID_codeblock, "PYTHON3", None)

                                        arcpy.CopyFeatures_management("{0}".format(anno_id_fc,anno_name_fc,anno_use_fc,anno_dept_fc,anno_emp_fc), r"{}".format(target_fc), None, None, None, None)
                                        arcpy.DeleteField_management("{0}".format(target_fc), "{0}_Anno_DocVer;{0}_Anno_DocType;{0}_Anno_DocPath;{0}_Anno_DocName;{0}_Anno_RefName;{0}_Anno_Text;{0}_Anno_Layer;CLOSE_DOORS;{0}_Line;{0}_Delimiter".format(ID_txt,Name_txt,Use_txt))
                                        arcpy.management.AddField(target_fc, "UNIT_NAME", "TEXT", None, None, None, "Unit Name", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.management.AddField(target_fc, "UNIT_USE", "TEXT", None, None, None, "Unit Use", "NULLABLE", "NON_REQUIRED", None)
                                    else:
                                        pass

                                    # SPACE NAME ANNOTATION
                                    #  BLOCK VARIABLES
                                    processUnitNameAnnoType = [] ## ['none','annotation','blocks','multiline']
                                    processUnitNameAnnoType.clear()
                                    blockUnitNamefield = []
                                    blockUnitNamefield.clear()

                                    with arcpy.da.SearchCursor(UnitName_layer_mapping_summary_tbl,['UNIT_NAME','UNIT_NAME_Raw','UNIT_NAME_Line','UNIT_NAME_Delimiter']) as blockCursor:
                                        for row in blockCursor:
                                            try:
                                                cadLayer = row[1]
                                                textLine = row[2]
                                                delimiter = row[3]
                                                if delimiter == None:
                                                    if cadLayer == None:
                                                        processUnitNameAnnoType.append('none')
                                                    else:
                                                        processUnitNameAnnoType.append('annotation')
                                                elif delimiter[:1] == '{' and delimiter[-1:] == '}':
                                                    processUnitNameAnnoType.append('blocks')
                                                    blockUnitNamefield.append(delimiter[1:-1])
                                                else:
                                                    processUnitNameAnnoType.append('multiline')
                                            except:
                                                processUnitNameAnnoType.append('none')
                                        else:
                                            processUnitNameAnnoType.append('none')

                                    if processUnitNameAnnoType[0] == 'none':
                                        arcpy.AddIDMessage("WARNING", 180149, "UNIT_NAME", "UNIT_NAME")
                                    elif processUnitNameAnnoType[0] == 'annotation':
                                        arcpy.AddIDMessage("INFORMATIVE", 180150, "UNIT_NAME")
                                    elif processUnitNameAnnoType[0] == 'blocks':
                                        arcpy.AddIDMessage("INFORMATIVE", 180151, "UNIT_NAME")
                                    else:
                                        arcpy.AddIDMessage("INFORMATIVE", 180152, "UNIT_NAME")

                                    ##########

                                    if processUnitNameAnnoType[0] != 'blocks':
                                        space_nm_lyr = arcpy.TableSelect_analysis(CADAnno, os.path.join(out_CAD_gdb,out_CADSpaceName_Annotation+"_tbl"), myUnitNameExpression)
                                    else:
                                        space_nm_lyr = arcpy.TableSelect_analysis(CADBlock, os.path.join(out_CAD_gdb,out_CADSpaceName_Annotation+"_tbl"), myUnitNameExpression)

                                    space_nm_lyr_count = int(arcpy.GetCount_management(space_nm_lyr).getOutput(0))

                                    #  if table has no data the import for Space ID is skipped
                                    if not arcpy.Exists(unit_poly) or space_nm_lyr_count == 0 or myUnitNameExpression == nolyrs:
                                        pass
                                    else:
                                        if processUnitNameAnnoType[0] != 'blocks':
                                            anno_name_fc_type = anno_name_fc + "type"
                                            arcpy.conversion.ExportFeatures(CADAnno, anno_name_fc_type, myUnitNameExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},Text,0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADAnno,Name_txt))
                                            arcpy.FeatureToPoint_management(anno_name_fc_type, anno_name_fc, 'INSIDE')
                                        else:
                                            arcpy.conversion.ExportFeatures(CADBlock, anno_name_fc, myUnitNameExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},{2},0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADBlock,Name_txt,blockUnitNamefield[0]))

                                        arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "Shape", None, 0)
                                        arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                        arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "{0}_Anno_Layer".format(Name_txt), UnitName_layer_mapping_summary_tbl, "{0}_Raw".format(Name_txt), "{0}_Line;{0}_Delimiter".format(Name_txt))
                                        arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "UNIT_NAME", "TEXT", None, None, None, "Unit Name (Text)", "NULLABLE", "NON_REQUIRED", None)

                                        if processUnitNameAnnoType[0] != 'blocks':
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "UNIT_NAME", "var(!{0}_Anno_Text!.strip(),!{0}_Anno_RefName!,!{0}_Delimiter!,!{0}_Line!)".format(Name_txt), "PYTHON3", "def var(text,id,delim,line):\n    if delim is None:\n        return text\n    if line is None:\n        return id\n    if id.count(delim)+1 < int(line):\n        return id.split(delim)[(id.count(delim)+1)-1].strip()\n    else:\n        return id.split(delim)[int(line)-1].strip()")
                                        else:
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceName_Annotation), "UNIT_NAME","!{}_Anno_Text!".format(Name_txt), "PYTHON3", None)
                                        anno_merge_full = os.path.join(out_CAD_gdb, "Floor_" + FloorID_name + "_anno_fc_merge")

                                        if not arcpy.Exists(anno_id_fc):
                                            arcpy.CopyFeatures_management("{1}".format(anno_id_fc,anno_name_fc,anno_use_fc,anno_dept_fc,anno_emp_fc), r"{0}".format(target_fc), None, None, None, None)
                                            arcpy.DeleteField_management("{0}".format(target_fc), "{1}_Anno_DocVer;{1}_Anno_DocType;{1}_Anno_DocPath;{1}_Anno_DocName;{1}_Anno_RefName;{1}_Anno_Text;{1}_Anno_Layer;CLOSE_DOORS;{1}_Line;{1}_Delimiter".format(ID_txt,Name_txt,Use_txt))
                                            arcpy.AddField_management(target_fc, "UNIT_ID", "TEXT", None, None, None, "Unit ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.AddField_management(target_fc, "UNIT_USE", "TEXT", None, None, None, "Unit Use", "NULLABLE", "NON_REQUIRED", None)
                                        if arcpy.Exists(anno_id_fc):
                                            arcpy.Append_management(r"{1}".format(anno_id_fc,anno_name_fc,anno_use_fc,anno_dept_fc,anno_emp_fc), "{0}".format(target_fc), "NO_TEST", r'LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{1},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{1},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{1},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{1},FACILITY_ID,0,255;NAME "Name" true true false 255 Text 0 0,First,#,{1},NAME,0,255;NAME_LONG "NAME_LONG" true true false 255 Text 0 0,First,#,{1},NAME_LONG,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{1},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{1},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{1},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{1},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{1},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{1},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{1},ACCESS_TYPE,0,255;UNIT_NAME "Unit Name" true true false 255 Text 0 0,First,#,{1},UNIT_NAME,0,255'.format(anno_id_fc,anno_name_fc,anno_use_fc,anno_dept_fc,anno_emp_fc), None)

                                    # SPACE USE ANNOTATION
                                    #  BLOCK VARIABLES
                                    processUnitUseAnnoType = [] ## ['none','annotation','blocks','multiline']
                                    processUnitUseAnnoType.clear()
                                    blockUnitUsefield = []
                                    blockUnitUsefield.clear()

                                    with arcpy.da.SearchCursor(UnitUse_layer_mapping_summary_tbl,['UNIT_USE_TYPE','UNIT_USE_TYPE_Raw','UNIT_USE_TYPE_Line','UNIT_USE_TYPE_Delimiter']) as blockCursor:
                                        for row in blockCursor:
                                            try:
                                                cadLayer = row[1]
                                                textLine = row[2]
                                                delimiter = row[3]
                                                if delimiter == None:
                                                    if cadLayer == None:
                                                        processUnitUseAnnoType.append('none')
                                                    else:
                                                        processUnitUseAnnoType.append('annotation')
                                                elif delimiter[:1] == '{' and delimiter[-1:] == '}':
                                                    processUnitUseAnnoType.append('blocks')
                                                    blockUnitUsefield.append(delimiter[1:-1])
                                                else:
                                                    processUnitUseAnnoType.append('multiline')
                                            except:
                                                processUnitUseAnnoType.append('none')
                                        else:
                                            processUnitUseAnnoType.append('none')

                                    if processUnitUseAnnoType[0] == 'none':
                                        arcpy.AddIDMessage("WARNING", 180153)
                                    elif processUnitUseAnnoType[0] == 'annotation':
                                        arcpy.AddIDMessage("INFORMATIVE", 180150, "UNIT_USE_TYPE")
                                    elif processUnitUseAnnoType[0] == 'blocks':
                                        arcpy.AddIDMessage("INFORMATIVE", 180151, "UNIT_USE_TYPE")
                                    else:
                                        arcpy.AddIDMessage("INFORMATIVE", 180152, "UNIT_USE_TYPE")

                                    ##########

                                    if processUnitUseAnnoType[0] != 'blocks':
                                        space_use_lyr = arcpy.TableSelect_analysis(CADAnno, os.path.join(out_CAD_gdb,out_CADSpaceUse_Annotation+"_tbl"), myUnitUseExpression)
                                    else:
                                        space_use_lyr = arcpy.TableSelect_analysis(CADBlock, os.path.join(out_CAD_gdb,out_CADSpaceUse_Annotation+"_tbl"), myUnitUseExpression)

                                    space_use_lyr_count = int(arcpy.GetCount_management(space_use_lyr).getOutput(0))

                                    #  if table has no data the import for Space ID is skipped
                                    if not arcpy.Exists(unit_poly) or space_use_lyr_count == 0 or myUnitUseExpression == nolyrs:
                                        pass
                                    else:
                                        if processUnitUseAnnoType[0] != 'blocks':
                                            anno_use_fc_type = anno_name_fc + "_type"
                                            arcpy.conversion.ExportFeatures(CADAnno, anno_use_fc_type, myUnitUseExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},Text,0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADAnno,Use_txt))
                                            arcpy.FeatureToPoint_management(anno_use_fc_type, anno_use_fc, 'INSIDE')
                                        else:
                                            arcpy.conversion.ExportFeatures(CADBlock, anno_use_fc, myUnitUseExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},{2},0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADBlock,Use_txt,blockUnitUsefield[0]))

                                        arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "Shape", None, 0)
                                        arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                        arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                        arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                        arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "{0}_Anno_Layer".format(Use_txt), UnitUse_layer_mapping_summary_tbl, "{0}_Raw".format(Use_txt), "{0}_Line;{0}_Delimiter".format(Use_txt))
                                        arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "UNIT_USE", "TEXT", None, None, None, "Unit Use (Text)", "NULLABLE", "NON_REQUIRED", None)
                                        if processUnitUseAnnoType[0] != 'blocks':
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "UNIT_USE", "var(!{0}_Anno_Text!,!{0}_Anno_RefName!,!{0}_Delimiter!,!{0}_Line!)".format(Use_txt), "PYTHON3", "def var(text,id,delim,line):\n    if delim is None:\n        return text\n    if line is None:\n        return id\n    if id.count(delim)+1 < int(line):\n        return id.split(delim)[(id.count(delim)+1)-1]\n    else:\n        return id.split(delim)[int(line)-1]")
                                        else:
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSpaceUse_Annotation), "UNIT_USE","!{}_Anno_Text!".format(Use_txt), "PYTHON3", None)

                                        if not arcpy.Exists(anno_id_fc) and not arcpy.Exists(anno_name_fc):
                                            arcpy.CopyFeatures_management("{2}".format(anno_id_fc,anno_name_fc,anno_use_fc,anno_dept_fc,anno_emp_fc), r"{0}".format(target_fc), None, None, None, None)
                                            arcpy.DeleteField_management("{0}".format(target_fc), "{2}_Anno_DocVer;{2}_Anno_DocType;{2}_Anno_DocPath;{2}_Anno_DocName;{2}_Anno_RefName;{2}_Anno_Text;{2}_Anno_Layer;CLOSE_DOORS;{2}_Line;{2}_Delimiter".format(ID_txt,Name_txt,Use_txt))
                                            arcpy.AddField_management(target_fc, "UNIT_ID", "TEXT", None, None, None, "Unit ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.AddField_management(target_fc, "UNIT_NAME", "TEXT", None, None, None, "Unit Name", "NULLABLE", "NON_REQUIRED", None)
                                        if arcpy.Exists(anno_id_fc) or arcpy.Exists(anno_name_fc):
                                            arcpy.Append_management(r"{2}".format(anno_id_fc,anno_name_fc,anno_use_fc,anno_dept_fc,anno_emp_fc), "{0}".format(target_fc), "NO_TEST", r'LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{2},LEVEL_ID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{2},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{2},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{2},FACILITY_ID,0,255;NAME_SHORT "NAME_SHORT" true true false 255 Text 0 0,First,#,{2},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{2},NAME_LONG,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{2},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{2},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{2},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{2},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{2},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{2},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{2},ACCESS_TYPE,0,255;UNIT_USE "Unit Use" true true false 255 Text 0 0,First,#,{2},UNIT_USE,0,255'.format(anno_id_fc,anno_name_fc,anno_use_fc,anno_dept_fc,anno_emp_fc), None)

                                    #  JOIN ANNOTATION TO SPACES
                                    join_anno = os.path.join(out_CAD_gdb, out_CADSpace_Anno_merge)
                                    input_units_fc = os.path.join(consolidatedGDB, out_CADUnitPoly)
                                    target_fc = os.path.join(consolidatedGDB, out_workspace_name + "_unit_poly_anno_fc")
                                    if not arcpy.Exists(join_anno) or not arcpy.Exists(input_units_fc):
                                        pass
                                    if arcpy.Exists(join_anno) and arcpy.Exists(input_units_fc):
                                        if processUnitUseAnnoType[0] != 'blocks':
                                            arcpy.SpatialJoin_analysis(r"{0}".format(input_units_fc), "{0}".format(join_anno), r"{0}".format(target_fc), "JOIN_ONE_TO_ONE", "KEEP_ALL", r'Unit_Layer "Unit_Layer" true true false 255 Text 0 0,First,#,{0},Unit_Layer,0,255;Unit_RefName "Unit_RefName" true true false 255 Text 0 0,First,#,{0},Unit_RefName,0,255;Unit_DocName "Unit_DocName" true true false 255 Text 0 0,First,#,{0},Unit_DocName,0,255;Unit_DocPath "Unit_DocPath" true true false 4096 Text 0 0,First,#,{0},Unit_DocPath,0,4096;Unit_DocType "Unit_DocType" true true false 32 Text 0 0,First,#,{0},Unit_DocType,0,32;Unit_DocVer "Unit_DocVer" true true false 16 Text 0 0,First,#,{0},Unit_DocVer,0,16;Shape_Length "Shape_Length" false true true 8 Double 0 0,First,#,{0},Shape_Length,-1,-1;Shape_Area "Shape_Area" false true true 8 Double 0 0,First,#,{0},Shape_Area,-1,-1;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "NAME_SHORT" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "NAME" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255;UNIT_NUMBER "Unit Number (Text)" true true false 255 Text 0 0,First,#,{1},UNIT_NUMBER,0,255;UNIT_ID "Unit ID" true true false 255 Text 0 0,First,#,{1},UNIT_ID,0,255;UNIT_NAME "Unit Name" true true false 255 Text 0 0,First,#,{1},UNIT_NAME,0,255;UNIT_USE "Unit Use" true true false 255 Text 0 0,First,#,{1},UNIT_USE,0,255;'.format( input_units_fc, join_anno), "INTERSECT", None, None)
                                        else:
                                            arcpy.SpatialJoin_analysis(r"{0}".format(input_units_fc), "{0}".format(join_anno), r"{0}".format(target_fc), "JOIN_ONE_TO_ONE", "KEEP_ALL", r'Unit_Layer "Unit_Layer" true true false 255 Text 0 0,First,#,{0},Unit_Layer,0,255;Unit_RefName "Unit_RefName" true true false 255 Text 0 0,First,#,{0},Unit_RefName,0,255;Unit_DocName "Unit_DocName" true true false 255 Text 0 0,First,#,{0},Unit_DocName,0,255;Unit_DocPath "Unit_DocPath" true true false 4096 Text 0 0,First,#,{0},Unit_DocPath,0,4096;Unit_DocType "Unit_DocType" true true false 32 Text 0 0,First,#,{0},Unit_DocType,0,32;Unit_DocVer "Unit_DocVer" true true false 16 Text 0 0,First,#,{0},Unit_DocVer,0,16;Shape_Length "Shape_Length" false true true 8 Double 0 0,First,#,{0},Shape_Length,-1,-1;Shape_Area "Shape_Area" false true true 8 Double 0 0,First,#,{0},Shape_Area,-1,-1;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "NAME_SHORT" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "NAME" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255;UNIT_NUMBER "Unit Number (Text)" true true false 255 Text 0 0,First,#,{1},UNIT_NUMBER,0,255;UNIT_ID "Unit ID" true true false 255 Text 0 0,First,#,{1},UNIT_ID,0,255;UNIT_NAME "Unit Name" true true false 255 Text 0 0,First,#,{1},UNIT_NAME,0,255;UNIT_USE "Unit Use" true true false 255 Text 0 0,First,#,{1},UNIT_USE,0,255;'.format(input_units_fc,join_anno), "INTERSECT", None, None)

                                    #  MERGE ZONE ANNOTATION Variables
                                    if zone_fc:
                                        out_CADZoneName_Annotation = out_workspace_name + "_zoneName_anno_fc"
                                        out_CADZoneID_Annotation = out_workspace_name + "_zoneID_anno_fc"
                                        out_CADZone_Anno_merge = out_workspace_name + "_zone_anno_fc_merge"
                                        anno_id_fcnm =  out_CADZoneID_Annotation
                                        anno_name_fcnm = out_CADZoneName_Annotation
                                        anno_id_fc =  os.path.join(out_CAD_gdb, out_CADZoneID_Annotation)
                                        anno_name_fc = os.path.join(out_CAD_gdb, out_CADZoneName_Annotation)
                                        target_fc = os.path.join(out_CAD_gdb, out_CADZone_Anno_merge)
                                        ID_txt = "ZONE_ID"
                                        Name_txt = "ZONE_NAME"

                                        #  ZONE ID ANNOTATION
                                        #  BLOCK VARIABLES
                                        arcpy.AddIDMessage("INFORMATIVE", 180148, "ZONES")
                                        processZoneIDAnnoType = [] ## ['none','annotation','blocks','multiline']
                                        processZoneIDAnnoType.clear()
                                        blockZoneIDfield = []
                                        #blockZoneIDfield.clear()

                                        with arcpy.da.SearchCursor(zoneID_layer_mapping_summary_tbl,['ZONE_ID','ZONE_ID_Raw','ZONE_ID_Line','ZONE_ID_Delimiter']) as blockCursor:
                                            for row in blockCursor:
                                                try:
                                                    cadLayer = row[1]
                                                    textLine = row[2]
                                                    delimiter = row[3]
                                                    if delimiter == None:
                                                        if cadLayer == None:
                                                            processZoneIDAnnoType.append('none')
                                                        else:
                                                            processZoneIDAnnoType.append('annotation')
                                                    elif delimiter[:1] == '{' and delimiter[-1:] == '}':
                                                        processZoneIDAnnoType.append('blocks')
                                                        blockZoneIDfield.append(delimiter[1:-1])
                                                    else:
                                                        processZoneIDAnnoType.append('multiline')
                                                except:
                                                    processZoneIDAnnoType.append('none')
                                            else:
                                                processZoneIDAnnoType.append('none')

                                        if processZoneIDAnnoType[0] == 'none':
                                            arcpy.AddIDMessage("WARNING", 180149, "ZONE_ID", "ZONE_ID")
                                        elif processZoneIDAnnoType[0] == 'annotation':
                                            arcpy.AddIDMessage("INFORMATIVE", 180150, "ZONE_ID")
                                        elif processZoneIDAnnoType[0] == 'blocks':
                                            arcpy.AddIDMessage("INFORMATIVE", 180151, "ZONE_ID")
                                        else:
                                            arcpy.AddIDMessage("INFORMATIVE", 180152, "ZONE_ID")

                                        ##########
                                        if processZoneIDAnnoType[0] != 'blocks':
                                            zone_id_lyr = arcpy.TableSelect_analysis(CADAnno, os.path.join(out_CAD_gdb,out_CADZoneID_Annotation+"_tbl"), myZoneIDExpression)
                                        else:
                                            zone_id_lyr = arcpy.TableSelect_analysis(CADBlock, os.path.join(out_CAD_gdb,out_CADZoneID_Annotation+"_tbl"), myZoneIDExpression)

                                        zone_id_lyr_count = int(arcpy.GetCount_management(zone_id_lyr).getOutput(0))
                                        zoneID_codeblock = "'{0}{1}Z{1}'+!ZONE_NUMBER!".format(FloorID, UniqueID_delimiter)

                                        #  if table has no data the import for Zone ID is skipped
                                        if not arcpy.Exists(zone_poly) or zone_id_lyr_count == 0 or myZoneIDExpression == nolyrs:
                                            pass

                                        if zone_id_lyr_count == 0 or myZoneIDExpression == nolyrs:
                                            if (zone_poly_lyr_count != 0 or zone_polyline_lyr_count !=0):
                                                arcpy.FeatureToPoint_management(zone_poly,anno_id_fc,'INSIDE')
                                                arcpy.AddField_management(anno_id_fc, "ZONE_NUMBER", "TEXT", None, None, None, "Zone Number (Text)", "NULLABLE", "NON_REQUIRED", None)
                                                arcpy.AddField_management(anno_id_fc, "ZONE_ID", "TEXT", None, None, None, "Zone ID", "NULLABLE", "NON_REQUIRED", None)
                                                arcpy.CalculateField_management(anno_id_fc, "ZONE_NUMBER", "str(!VERTICAL_ORDER!+1) + str(!OBJECTID!)", "PYTHON3", None)
                                                arcpy.CalculateField_management(anno_id_fc, "ZONE_ID", zoneID_codeblock, "PYTHON3", None)
                                                arcpy.CopyFeatures_management("{0}".format(anno_id_fc), r"{}".format(target_fc), None, None, None, None)
                                                arcpy.DeleteField_management("{0}".format(target_fc), "{0}_DocVer;{0}_DocType;{0}_DocPath;{0}_DocName;{0}_RefName;{0}_Layer;MERGE_ZONES;CLOSE_DOORS".format('Zone'))
                                                arcpy.AddField_management(target_fc, "ZONE_NAME", "TEXT", None, None, None, "Zone Name", "NULLABLE", "NON_REQUIRED", None)
                                            else:
                                                pass

                                        if zone_id_lyr_count > 0 and myZoneIDExpression != nolyrs:

                                            if processZoneIDAnnoType[0] != 'blocks':
                                                anno_id_fc_type = anno_id_fc + "_type"
                                                arcpy.conversion.ExportFeatures(CADAnno, anno_id_fc_type, myZoneIDExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},Text,0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADAnno,ID_txt))
                                                arcpy.FeatureToPoint_management(anno_id_fc_type, anno_id_fc, 'INSIDE')
                                            else:
                                                arcpy.conversion.ExportFeatures(CADBlock, anno_id_fc, myZoneIDExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},{2},0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADBlock,ID_txt,blockZoneIDfield[0]))
                                            arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "Shape", None, 0)
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "{0}_Anno_Layer".format(ID_txt), zoneID_layer_mapping_summary_tbl, "{0}_Raw".format(ID_txt), "{0}_Line;{0}_Delimiter".format(ID_txt))
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "ZONE_NUMBER", "TEXT", None, None, None, "Zone Number (Text)", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "ZONE_ID", "TEXT", None, None, None, "Zone ID", "NULLABLE", "NON_REQUIRED", None)
                                            if processZoneIDAnnoType[0] != 'blocks':
                                                arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "ZONE_NUMBER", "var(!{0}_Anno_Text!.strip(),!{0}_Anno_RefName!,!{0}_Delimiter!,!{0}_Line!)".format(ID_txt), "PYTHON3", "def var(text,id,delim,line):\n    if delim is None:\n        return text\n    if line is None:\n        return id\n    if id.count(delim)+1 < int(line):\n        return id.split(delim)[(id.count(delim)+1)-1].strip()\n    else:\n        return id.split(delim)[int(line)-1].strip()")
                                            else:
                                                arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "ZONE_NUMBER","!{}_Anno_Text!".format(ID_txt), "PYTHON3", None)
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADZoneID_Annotation), "ZONE_ID", zoneID_codeblock, "PYTHON3", None)
                                            arcpy.CopyFeatures_management("{0}".format(anno_id_fc,anno_name_fc), r"{}".format(target_fc), None, None, None, None)
                                            arcpy.DeleteField_management("{0}".format(target_fc), "{0}_Anno_DocVer;{0}_Anno_DocType;{0}_Anno_DocPath;{0}_Anno_DocName;{0}_Anno_Text;{0}_Anno_Layer;MERGE_ZONES;CLOSE_DOORS;{0}_Line;{0}_Delimiter".format(ID_txt))
                                            arcpy.AddField_management(target_fc, "ZONE_NAME", "TEXT", None, None, None, "Zone Name", "NULLABLE", "NON_REQUIRED", None)
                                        else:
                                            pass

                                        # ZONE NAME ANNOTATION
                                        #  BLOCK VARIABLES
                                        processZoneNameAnnoType = [] ## ['none','annotation','blocks','multiline']
                                        processZoneNameAnnoType.clear()
                                        blockZoneNamefield = []
                                        blockZoneNamefield.clear()

                                        with arcpy.da.SearchCursor(zonename_layer_mapping_summary_tbl,['ZONE_NAME','ZONE_NAME_Raw','ZONE_NAME_Line','ZONE_NAME_Delimiter']) as blockCursor:
                                            for row in blockCursor:
                                                try:
                                                    cadLayer = row[1]
                                                    textLine = row[2]
                                                    delimiter = row[3]
                                                    if delimiter == None:
                                                        if cadLayer == None:
                                                            processZoneNameAnnoType.append('none')
                                                        else:
                                                            processZoneNameAnnoType.append('annotation')
                                                    elif delimiter[:1] == '{' and delimiter[-1:] == '}':
                                                        processZoneNameAnnoType.append('blocks')
                                                        blockZoneNamefield.append(delimiter[1:-1])
                                                    else:
                                                        processZoneNameAnnoType.append('multiline')
                                                except:
                                                    processZoneNameAnnoType.append('none')
                                            else:
                                                processZoneNameAnnoType.append('none')

                                        if processZoneNameAnnoType[0] == 'none':
                                            arcpy.AddIDMessage("WARNING", 180157)
                                        elif processZoneNameAnnoType[0] == 'annotation':
                                            arcpy.AddIDMessage("INFORMATIVE", 180150, "ZONE_NAME")
                                        elif processZoneNameAnnoType[0] == 'blocks':
                                            arcpy.AddIDMessage("INFORMATIVE", 180151, "ZONE_NAME")
                                        else:
                                            arcpy.AddIDMessage("INFORMATIVE", 180152, "ZONE_NAME")

                                        ##########

                                        if processZoneNameAnnoType[0] != 'blocks':
                                            zone_name_lyr = arcpy.TableSelect_analysis(CADAnno, os.path.join(out_CAD_gdb,out_CADZoneName_Annotation+"_tbl"), myZoneNameExpression)
                                        else:
                                            zone_name_lyr = arcpy.TableSelect_analysis(CADBlock, os.path.join(out_CAD_gdb,out_CADZoneName_Annotation+"_tbl"), myZoneNameExpression)
                                        zone_name_lyr_count = int(arcpy.GetCount_management(zone_name_lyr).getOutput(0))

                                        #  if table has no data the import for Zone Name is skipped
                                        if not arcpy.Exists(zone_poly) or zone_name_lyr_count == 0 or myZoneNameExpression == nolyrs:
                                            pass
                                        else:
                                            if processZoneNameAnnoType[0] != 'blocks':
                                                anno_name_fc_type = anno_name_fc + "_type"
                                                arcpy.conversion.ExportFeatures(CADAnno, anno_name_fc_type, myZoneNameExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},Text,0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADAnno,Name_txt))
                                                arcpy.FeatureToPoint_management(anno_name_fc_type, anno_name_fc, 'INSIDE')
                                            else:
                                                arcpy.conversion.ExportFeatures(CADBlock, anno_name_fc, myZoneNameExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},{2},0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADBlock,Name_txt,blockZoneNamefield[0]))
                                            arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "Shape", None, 0)
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "{0}_Anno_Layer".format(Name_txt), zonename_layer_mapping_summary_tbl, "{0}_Raw".format(Name_txt), "{0}_Line;{0}_Delimiter".format(Name_txt))
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "ZONE_NAME", "TEXT", None, None, None, "Zone Name (Text)", "NULLABLE", "NON_REQUIRED", None)
                                            if processZoneNameAnnoType[0] != 'blocks':
                                                arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "ZONE_NAME", "var(!{0}_Anno_Text!.strip(),!{0}_Anno_RefName!,!{0}_Delimiter!,!{0}_Line!)".format(Name_txt), "PYTHON3", "def var(text,id,delim,line):\n    if delim is None:\n        return text\n    if line is None:\n        return id\n    if id.count(delim)+1 < int(line):\n        return id.split(delim)[(id.count(delim)+1)-1].strip()\n    else:\n        return id.split(delim)[int(line)-1].strip()")
                                            else:
                                                 arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADZoneName_Annotation), "ZONE_NAME","!{}_Anno_Text!".format(Name_txt), "PYTHON3", None)
                                            if not arcpy.Exists(anno_id_fc):
                                                arcpy.CopyFeatures_management("{1}".format(anno_id_fc,anno_name_fc), r"{0}".format(target_fc), None, None, None, None)
                                                arcpy.DeleteField_management("{0}".format(target_fc), "{0}_Anno_DocVer;{0}_Anno_DocType;{0}_Anno_DocPath;{0}_Anno_DocName;{0}_Anno_RefName;{0}_Anno_Text;{0}_Anno_Layer;CLOSE_DOORS;{0}_Line;{0}_Delimiter".format(Name_txt))
                                                arcpy.AddField_management(target_fc, "ZONE_ID", "TEXT", None, None, None, "Zone ID", "NULLABLE", "NON_REQUIRED", None)
                                            if arcpy.Exists(anno_id_fc):
                                                arcpy.Append_management(r"{1}".format(anno_id_fc,anno_name_fc), "{0}".format(target_fc), "NO_TEST", r'LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{1},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{1},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{1},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{1},FACILITY_ID,0,255;NAME_SHORT "NAME_SHORT" true true false 255 Text 0 0,First,#,{1},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{1},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{1},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{1},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{1},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{1},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{1},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{1},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{1},ACCESS_TYPE,0,255;ZONE_NAME "Zone Name" true true false 255 Text 0 0,First,#,{1},ZONE_NAME,0,255'.format(anno_id_fc,anno_name_fc), None)

                                        #  JOIN ANNOTATION TO ZONES
                                        join_anno = os.path.join(out_CAD_gdb, out_CADZone_Anno_merge)
                                        input_zones_fc = os.path.join(consolidatedGDB, out_CADZonePoly)
                                        target_fc = os.path.join(consolidatedGDB, out_workspace_name + "_zone_poly_anno_fc")

                                        if not arcpy.Exists(join_anno) or not arcpy.Exists(input_zones_fc):
                                            pass
                                        if arcpy.Exists(join_anno) and arcpy.Exists(input_zones_fc):
                                            arcpy.SpatialJoin_analysis(r"{0}".format(input_zones_fc), "{0}".format(join_anno), r"{0}".format(target_fc), "JOIN_ONE_TO_ONE", "KEEP_ALL", r'Zone_Layer "Zone_Layer" true true false 255 Text 0 0,First,#,{0},Zone_Layer,0,255;Zone_RefName "Zone_RefName" true true false 255 Text 0 0,First,#,{0},Zone_RefName,0,255;Zone_DocName "Zone_DocName" true true false 255 Text 0 0,First,#,{0},Zone_DocName,0,255;Zone_DocPath "Zone_DocPath" true true false 4096 Text 0 0,First,#,{0},Zone_DocPath,0,4096;Zone_DocType "Zone_DocType" true true false 32 Text 0 0,First,#,{0},Zone_DocType,0,32;Zone_DocVer "Zone_DocVer" true true false 16 Text 0 0,First,#,{0},Zone_DocVer,0,16;Shape_Length "Shape_Length" false true true 8 Double 0 0,First,#,{0},Shape_Length,-1,-1;Shape_Area "Shape_Area" false true true 8 Double 0 0,First,#,{0},Shape_Area,-1,-1;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "NAME_SHORT" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255;ZONE_NUMBER "Zone Number (Text)" true true false 255 Text 0 0,First,#,{1},ZONE_NUMBER,0,255;ZONE_ID "Zone ID" true true false 255 Text 0 0,First,#,{1},ZONE_ID,0,255;ZONE_NAME "Zone Name" true true false 255 Text 0 0,First,#,{1},ZONE_NAME,0,255'.format(input_zones_fc,join_anno), "INTERSECT", None, None)

                                    #  MERGE SECTION ANNOTATION Variables
                                    if section_fc:
                                        out_CADSectionName_Annotation = out_workspace_name + "_sectionName_anno_fc"
                                        out_CADSectionID_Annotation = out_workspace_name + "_sectionID_anno_fc"
                                        out_CADSection_Anno_merge = out_workspace_name + "_section_anno_fc_merge"
                                        anno_id_fcnm =  out_CADSectionID_Annotation
                                        anno_name_fcnm = out_CADSectionName_Annotation
                                        anno_id_fc =  os.path.join(out_CAD_gdb, out_CADSectionID_Annotation)
                                        anno_name_fc = os.path.join(out_CAD_gdb, out_CADSectionName_Annotation)
                                        target_fc = os.path.join(out_CAD_gdb, out_CADSection_Anno_merge)
                                        ID_txt = "SECTION_ID"
                                        Name_txt = "SECTION_NAME"

                                        #  SECTION ID ANNOTATION
                                        #  BLOCK VARIABLES
                                        arcpy.AddIDMessage("INFORMATIVE", 180148, "SECTIONS")
                                        processSectionIDAnnoType = [] ## ['none','annotation','blocks','multiline']
                                        processSectionIDAnnoType.clear()
                                        blockSectionIDfield = []
                                        #blockZoneIDfield.clear()

                                        with arcpy.da.SearchCursor(sectionID_layer_mapping_summary_tbl,['SECTION_ID','SECTION_ID_Raw','SECTION_ID_Line','SECTION_ID_Delimiter']) as blockCursor:
                                            for row in blockCursor:
                                                try:
                                                    cadLayer = row[1]
                                                    textLine = row[2]
                                                    delimiter = row[3]
                                                    if delimiter == None:
                                                        if cadLayer == None:
                                                            processSectionIDAnnoType.append('none')
                                                        else:
                                                            processSectionIDAnnoType.append('annotation')
                                                    elif delimiter[:1] == '{' and delimiter[-1:] == '}':
                                                        processSectionIDAnnoType.append('blocks')
                                                        blockSectionIDfield.append(delimiter[1:-1])
                                                    else:
                                                        processSectionIDAnnoType.append('multiline')
                                                except:
                                                    processSectionIDAnnoType.append('none')
                                            else:
                                                processSectionIDAnnoType.append('none')

                                        if processSectionIDAnnoType[0] == 'none':
                                            arcpy.AddIDMessage("WARNING", 180149, "SECTION_ID", "SECTION_ID")
                                        elif processSectionIDAnnoType[0] == 'annotation':
                                            arcpy.AddIDMessage("INFORMATIVE", 180150, "SECTION_ID")
                                        elif processSectionIDAnnoType[0] == 'blocks':
                                            arcpy.AddIDMessage("INFORMATIVE", 180151, "SECTION_ID")
                                        else:
                                            arcpy.AddIDMessage("INFORMATIVE", 180152, "SECTION_ID")

                                        ##########
                                        if processSectionIDAnnoType[0] != 'blocks':
                                            section_id_lyr = arcpy.TableSelect_analysis(CADAnno, os.path.join(out_CAD_gdb,out_CADSectionID_Annotation + "_tbl"),mySectionIDExpression)
                                        else:
                                            section_id_lyr = arcpy.TableSelect_analysis(CADBlock, os.path.join(out_CAD_gdb,out_CADSectionID_Annotation+"_tbl"), mySectionIDExpression)
                                        section_id_lyr_count = int(arcpy.GetCount_management(section_id_lyr).getOutput(0))
                                        sectionID_codeblock = "'{0}{1}S{1}'+!SECTION_NUMBER!".format(FloorID, UniqueID_delimiter)

                                        #  if table has no data the import for Section ID is skipped
                                        if arcpy.Exists(section_poly) == "False" or section_id_lyr_count == 0 or mySectionIDExpression == nolyrs:
                                            pass

                                        if section_id_lyr_count == 0 or mySectionIDExpression == nolyrs:
                                            if (section_poly_lyr_count != 0 or section_polyline_lyr_count !=0):
                                                arcpy.FeatureToPoint_management(section_poly,anno_id_fc,'INSIDE')
                                                arcpy.AddField_management(anno_id_fc, "SECTION_NUMBER", "TEXT", None, None, None, "Section Number (Text)", "NULLABLE", "NON_REQUIRED", None)
                                                arcpy.AddField_management(anno_id_fc, "SECTION_ID", "TEXT", None, None, None, "Section ID", "NULLABLE", "NON_REQUIRED", None)
                                                arcpy.CalculateField_management(anno_id_fc, "SECTION_NUMBER", "str(!VERTICAL_ORDER!+1) + str(!OBJECTID!)", "PYTHON3", None)
                                                arcpy.CalculateField_management(anno_id_fc, "SECTION_ID", sectionID_codeblock, "PYTHON3", None)
                                                arcpy.CopyFeatures_management("{0}".format(anno_id_fc), r"{}".format(target_fc), None, None, None, None)
                                                arcpy.DeleteField_management("{0}".format(target_fc), "{0}_DocVer;{0}_DocType;{0}_DocPath;{0}_DocName;{0}_RefName;{0}_Layer;MERGE_ZONES;CLOSE_DOORS".format('Section'))
                                                arcpy.AddField_management(target_fc, "SECTION_NAME", "TEXT", None, None, None, "Zone Name", "NULLABLE", "NON_REQUIRED", None)
                                            else:
                                                pass

                                        if section_id_lyr_count > 0 and mySectionIDExpression != nolyrs:
                                            if processSectionIDAnnoType[0] != 'blocks':
                                                anno_id_fc_type = anno_id_fc + "_type"
                                                arcpy.conversion.ExportFeatures(CADAnno, anno_id_fc_type, mySectionIDExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},Text,0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADAnno, ID_txt))
                                                arcpy.FeatureToPoint_management(anno_id_fc_type, anno_id_fc, 'INSIDE')
                                            else:
                                                arcpy.conversion.ExportFeatures(CADBlock, anno_id_fc, mySectionIDExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},{2},0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADBlock,ID_txt,blockSectionIDfield[0]))
                                            arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "Shape", None, 0)
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "{0}_Anno_Layer".format(ID_txt), sectionID_layer_mapping_summary_tbl, "{0}_Raw".format(ID_txt), "{0}_Line;{0}_Delimiter".format(ID_txt))
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "SECTION_NUMBER", "TEXT", None, None, None, "Section Number (Text)", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "SECTION_ID", "TEXT", None, None, None, "Section ID", "NULLABLE", "NON_REQUIRED", None)
                                            if processSectionIDAnnoType[0] != 'blocks':
                                                arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation),"SECTION_NUMBER", "var(!{0}_Anno_Text!.strip(),!{0}_Anno_RefName!,!{0}_Delimiter!,!{0}_Line!)".format(ID_txt), "PYTHON3","def var(text,id,delim,line):\n    if delim is None:\n        return text\n    if line is None:\n        return id\n    if id.count(delim)+1 < int(line):\n        return id.split(delim)[(id.count(delim)+1)-1].strip()\n    else:\n        return id.split(delim)[int(line)-1].strip()")
                                            else:
                                                arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "SECTION_NUMBER","!{}_Anno_Text!".format(ID_txt), "PYTHON3", None)

                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSectionID_Annotation), "SECTION_ID", sectionID_codeblock, "PYTHON3", None)
                                            arcpy.CopyFeatures_management("{0}".format(anno_id_fc,anno_name_fc), r"{}".format(target_fc), None, None, None, None)
                                            arcpy.DeleteField_management("{0}".format(target_fc), "{0}_Anno_DocVer;{0}_Anno_DocType;{0}_Anno_DocPath;{0}_Anno_DocName;{0}_Anno_RefName;{0}_Anno_Text;{0}_Anno_Layer;MERGE_SECTIONS;CLOSE_DOORS;{0}_Line;{0}_Delimiter".format(ID_txt,Name_txt))
                                            arcpy.AddField_management(target_fc, "SECTION_NAME", "TEXT", None, None, None, "Section Name", "NULLABLE", "NON_REQUIRED", None)
                                        else:
                                            pass

                                        # SECTION NAME ANNOTATION
                                        processSectionNameAnnoType = [] ## ['none','annotation','blocks','multiline']
                                        processSectionNameAnnoType.clear()
                                        blockSectionNamefield = []
                                        blockSectionNamefield.clear()

                                        with arcpy.da.SearchCursor(sectionname_layer_mapping_summary_tbl,['SECTION_NAME','SECTION_NAME_Raw','SECTION_NAME_Line','SECTION_NAME_Delimiter']) as blockCursor:
                                            for row in blockCursor:
                                                try:
                                                    cadLayer = row[1]
                                                    textLine = row[2]
                                                    delimiter = row[3]
                                                    if delimiter == None:
                                                        if cadLayer == None:
                                                            processSectionNameAnnoType.append('none')
                                                        else:
                                                            processSectionNameAnnoType.append('annotation')
                                                    elif delimiter[:1] == '{' and delimiter[-1:] == '}':
                                                        processSectionNameAnnoType.append('blocks')
                                                        blockSectionNamefield.append(delimiter[1:-1])
                                                    else:
                                                        processSectionNameAnnoType.append('multiline')
                                                except:
                                                    processSectionNameAnnoType.append('none')
                                            else:
                                                processSectionNameAnnoType.append('none')

                                        if processSectionNameAnnoType[0] == 'none':
                                            arcpy.AddIDMessage("WARNING", 180157)
                                        elif processSectionNameAnnoType[0] == 'annotation':
                                            arcpy.AddIDMessage("INFORMATIVE", 180150, "SECTION_NAME")
                                        elif processSectionNameAnnoType[0] == 'blocks':
                                            arcpy.AddIDMessage("INFORMATIVE", 180151, "SECTION_NAME")
                                        else:
                                            arcpy.AddIDMessage("INFORMATIVE", 180152, "SECTION_NAME")

                                        ##########

                                        if processSectionNameAnnoType[0] != 'blocks':
                                            section_name_lyr = arcpy.TableSelect_analysis(CADAnno, os.path.join(out_CAD_gdb,out_CADSectionName_Annotation + "_tbl"), mySectionNameExpression)
                                        else:
                                            section_name_lyr = arcpy.TableSelect_analysis(CADBlock, os.path.join(out_CAD_gdb,out_CADSectionName_Annotation+"_tbl"), mySectionNameExpression)
                                        section_name_lyr_count = int(arcpy.GetCount_management(section_name_lyr).getOutput(0))

                                        #  if table has no data the import for Section ID is skipped
                                        if not arcpy.Exists(section_poly) or section_name_lyr_count == 0 or mySectionNameExpression == nolyrs:
                                            pass
                                        else:
                                            if processSectionNameAnnoType[0] != 'blocks':
                                                anno_name_fc_type = anno_name_fc + "_type"
                                                arcpy.conversion.ExportFeatures(CADAnno, anno_name_fc_type, mySectionNameExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},Text,0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADAnno, Name_txt))
                                                arcpy.FeatureToPoint_management(anno_name_fc_type, anno_name_fc, 'INSIDE')
                                            else:
                                                arcpy.conversion.ExportFeatures(CADBlock, anno_name_fc, mySectionNameExpression, False, r'{1}_Anno_Layer "{1}_Anno_Layer" true true false 255 Text 0 0,First,#,{0},Layer,0,255;{1}_Anno_Text "{1}_Anno_Text" true true false 255 Text 0 0,First,#,{0},{2},0,255;{1}_Anno_RefName "{1}_Anno_RefName" true true false 255 Text 0 0,First,#,{0},RefName,0,255;{1}_Anno_DocName "{1}_Anno_DocName" true true false 255 Text 0 0,First,#,{0},DocName,0,255;{1}_Anno_DocPath "{1}_Anno_DocPath" true true false 4096 Text 0 0,First,#,{0},DocPath,0,4096;{1}_Anno_DocType "{1}_Anno_DocType" true true false 32 Text 0 0,First,#,{0},DocType,0,32;{1}_Anno_DocVer "{1}_Anno_DocVer" true true false 16 Text 0 0,First,#,{0},DocVer,0,16'.format(CADBlock, Name_txt,blockSectionNamefield[0]))
                                            arcpy.DeleteIdentical_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation), "Shape", None, 0)
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation), "LEVELID", "TEXT", None, None, None, "Floor ID", "NULLABLE", "NON_REQUIRED", None)
                                            arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation), "LEVELID", "'" + FloorID + "'", "PYTHON3", None)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation), "LEVELID", FloorProperties, "LEVEL_ID", IndoorsUtilsModule.FLOOR_JN_FIELDS)
                                            arcpy.JoinField_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation), "{0}_Anno_Layer".format(Name_txt), sectionname_layer_mapping_summary_tbl, "{0}_Raw".format(Name_txt), "{0}_Line;{0}_Delimiter".format(Name_txt))
                                            arcpy.AddField_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation), "SECTION_NAME", "TEXT", None, None, None, "Section Name (Text)", "NULLABLE", "NON_REQUIRED", None)
                                            if processSectionNameAnnoType[0] != 'blocks':
                                                arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation),"SECTION_NAME", "var(!{0}_Anno_Text!.strip(),!{0}_Anno_RefName!,!{0}_Delimiter!,!{0}_Line!)".format(Name_txt), "PYTHON3","def var(text,id,delim,line):\n    if delim is None:\n        return text\n    if line is None:\n        return id\n    if id.count(delim)+1 < int(line):\n        return id.split(delim)[(id.count(delim)+1)-1].strip()\n    else:\n        return id.split(delim)[int(line)-1].strip()")
                                            else:
                                                arcpy.CalculateField_management(os.path.join(out_CAD_gdb, out_CADSectionName_Annotation), "SECTION_NAME","!{}_Anno_Text!".format(Name_txt), "PYTHON3", None)

                                            if not arcpy.Exists(anno_id_fc):
                                                arcpy.CopyFeatures_management("{1}".format(anno_id_fc,anno_name_fc), r"{0}".format(target_fc), None, None, None, None)
                                                arcpy.DeleteField_management("{0}".format(target_fc), "{1}_Anno_DocVer;{1}_Anno_DocType;{1}_Anno_DocPath;{1}_Anno_DocName;{1}_Anno_RefName;{1}_Anno_Text;{1}_Anno_Layer;CLOSE_DOORS;{0}_Line;{0}_Delimiter".format(ID_txt,Name_txt))
                                                arcpy.AddField_management(target_fc, "SECTION_ID", "TEXT", None, None, None, "Section ID", "NULLABLE", "NON_REQUIRED", None)
                                            if arcpy.Exists(anno_id_fc):
                                                arcpy.Append_management(r"{1}".format(anno_id_fc,anno_name_fc), "{0}".format(target_fc), "NO_TEST", 'LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{1},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{1},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{1},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{1},FACILITY_ID,0,255;NAME_SHORT "NAME_SHORT" true true false 255 Text 0 0,First,#,{1},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{1},NAME_SHORT,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{1},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{1},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{1},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{1},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{1},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{1},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{1},ACCESS_TYPE,0,255;SECTION_NAME "Section Name" true true false 255 Text 0 0,First,#,{1},SECTION_NAME,0,255'.format(anno_id_fc,anno_name_fc), None)

                                        #  JOIN ANNOTATION TO SECTIONS
                                        join_anno = os.path.join(out_CAD_gdb, out_CADSection_Anno_merge)
                                        input_sections_fc = os.path.join(consolidatedGDB, out_CADSectionPoly)
                                        target_fc = os.path.join(consolidatedGDB, out_workspace_name + "_section_poly_anno_fc")

                                        if not arcpy.Exists(join_anno) or not arcpy.Exists(input_sections_fc):
                                            pass
                                        if arcpy.Exists(join_anno) and arcpy.Exists(input_sections_fc):
                                            arcpy.SpatialJoin_analysis(r"{0}".format(input_sections_fc), "{0}".format(join_anno), r"{0}".format(target_fc), "JOIN_ONE_TO_ONE", "KEEP_ALL", r'Section_Layer "Section_Layer" true true false 255 Text 0 0,First,#,{0},Section_Layer,0,255;Section_RefName "Section_RefName" true true false 255 Text 0 0,First,#,{0},Section_RefName,0,255;Section_DocName "Section_DocName" true true false 255 Text 0 0,First,#,{0},Section_DocName,0,255;Section_DocPath "Section_DocPath" true true false 4096 Text 0 0,First,#,{0},Section_DocPath,0,4096;Section_DocType "Section_DocType" true true false 32 Text 0 0,First,#,{0},Section_DocType,0,32;Section_DocVer "Section_DocVer" true true false 16 Text 0 0,First,#,{0},Section_DocVer,0,16;Shape_Length "Shape_Length" false true true 8 Double 0 0,First,#,{0},Shape_Length,-1,-1;Shape_Area "Shape_Area" false true true 8 Double 0 0,First,#,{0},Shape_Area,-1,-1;LEVELID "Floor ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,255;SOURCE_PATH "SOURCE PATH" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;LEVEL_NUMBER "Floor Number" true true false 255 Text 0 0,First,#,{0},LEVEL_NUMBER,0,255;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;NAME_SHORT "NAME_SHORT" true true false 255 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Floor Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ELEVATION_RELATIVE "RELATIVE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "ABSOLUTE_ELEVATION" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "RELATIVE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "ABSOLUTE_HEIGHT" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;VERTICAL_ORDER "VERTICALORDER" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;ACCESS_TYPE "Access Type" true true false 255 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;CLOSE_DOORS "CLOSE_DOORS" true true false 255 Text 0 0,First,#,{0},CLOSE_DOORS,0,255;SECTION_NUMBER "Section Number (Text)" true true false 255 Text 0 0,First,#,{1},SECTION_NUMBER,0,255;SECTION_ID "Section ID" true true false 255 Text 0 0,First,#,{1},SECTION_ID,0,255;SECTION_NAME "Section Name" true true false 255 Text 0 0,First,#,{1},SECTION_NAME,0,255'.format(input_sections_fc,join_anno), "INTERSECT", None, None)
                                else:
                                    pass
                            else:
                                arcpy.AddIDMessage("INFORMATIVE", 180146, FloorID)

            #  DISSOLVE FACILITY POLY
            mergedLevelsUpdated = False
            facilityRotation = []
            with arcpy.da.SearchCursor(BuildingProperties,IndoorsUtilsModule.FACILITY_FLDS) as SC_facilities_2:
                for row in SC_facilities_2:
                    facilityID = row[2]
                    merge_levels = row[20]
                    rotation = row[19]
                    facilityID_clean = str.strip(str.replace(str.replace(str.replace(facilityID,".","_"),"-","_")," ","_"))
                    out_ffc_name = 'Facility_{0}_facility_poly_fc'.format(facilityID_clean)
                    out_gdb_name = "Facility_" + facilityID_clean + ".gdb"
                    out_CAD_gdb = os.path.join(workingGDBFolder, out_gdb_name)
                    mylayers = [out_ffc_name]
                    gdb = r"{0}".format(out_CAD_gdb)

                    if merge_levels == 'N':
                        myfcs = ['*facility_poly_fc']
                        myindoorfc = myfcs[0]
                        fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
                        out_fc = os.path.join(gdb, mylayers[0]+"_merged")
                        out_fc_dissolve = os.path.join(gdb, mylayers[0]+"_dissolve")
                        out_fc_copy = os.path.join(consolidatedGDB, mylayers[0])
                        if len(fcs) == 1:
                            arcpy.CopyFeatures_management(os.path.join(gdb, fcs[0]), out_fc_copy)
                            IndoorsUtilsModule.calcArea(out_fc_copy, calculation_method)
                            if rotation is None or rotation == "" and facilityID not in facilityRotation:
                                facilityRotation.append(facilityID)
                            else:
                                arcpy.CalculateField_management(out_fc_copy, 'ROTATION', rotation, "PYTHON3", None)
                        if len(fcs) >= 2:
                            arcpy.Merge_management(fcs, out_fc)
                            IndoorsUtilsModule.calcArea(out_fc, calculation_method)
                            arcpy.Dissolve_management(out_fc, out_fc_dissolve, "FACILITY_ID;FACILITY_NUMBER;NAME;NAME_LONG;DESCRIPTION;ADDRESS;UNIT;LOCALITY;PROVINCE;COUNTRY;POSTAL_CODE;DATE_BUILT;LEVELS_TOTAL;ELEVATION_RELATIVE;ELEVATION_ABSOLUTE;HEIGHT_RELATIVE;HEIGHT_ABSOLUTE;MERGE_LEVELS", "Facility_Layer FIRST;Facility_RefName FIRST;Facility_DocName FIRST;Facility_DocPath FIRST;Facility_DocVer FIRST;Facility_DocType FIRST;AREA_SQFT SUM;AREA_SQMT SUM", "MULTI_PART", "DISSOLVE_LINES")
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_layer','Facility_Layer')
                            arcpy.AlterField_management(out_fc_dissolve, 'FIRST_Facility_RefName', 'Facility_RefName')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocName','Facility_DocName')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocPath','Facility_DocPath')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocVer','Facility_DocVer')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocType','Facility_DocType')
                            arcpy.AlterField_management(out_fc_dissolve,'SUM_AREA_SQFT','AREA_SQFT')
                            arcpy.AlterField_management(out_fc_dissolve,'SUM_AREA_SQMT','AREA_SQMT')
                            arcpy.AddField_management(out_fc_dissolve, "ROTATION", "DOUBLE", None, None, None, "Rotation", "NULLABLE", "NON_REQUIRED", None)
                            if rotation is None or rotation == "" and facilityID not in facilityRotation:
                                facilityRotation.append(facilityID)
                                #IndoorsUtilsModule.calcRotation(out_fc_dissolve)
                            else:
                                arcpy.CalculateField_management(out_fc_dissolve, 'ROTATION', rotation, "PYTHON3", None)
                            arcpy.CopyFeatures_management(out_fc_dissolve, out_fc_copy)
                        else:
                            pass

                    if merge_levels == 'Y':
                        arcpy.AddIDMessage("INFORMATIVE", 180154)
                        myfcs = ['*level_poly_fc']
                        myindoorfc = myfcs[0]
                        fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
                        out_fc = os.path.join(gdb, mylayers[0]+"_merged")
                        out_fc_dissolve = os.path.join(gdb, mylayers[0]+"_dissolve")

                        out_fc_edit = os.path.join(gdb, mylayers[0]+"_edit")
                        out_fc_join = os.path.join(gdb, mylayers[0]+"_join")
                        out_fc_copy = os.path.join(consolidatedGDB, mylayers[0])
                        try:
                            if len(fcs) == 1:
                                arcpy.CopyFeatures_management(os.path.join(gdb, fcs[0]), out_fc_edit)
                                arcpy.DeleteField_management(out_fc_edit, "NAME_SHORT;NAME;DESCRIPTION;LEVELID;LEVEL_NUMBER;VERTICAL_ORDER;ELEVATION_RELATIVE;ACCESS_TYPE;ELEVATION_ABSOLUTE;SOURCE_PATH;HEIGHT_ABSOLUTE;CLOSE_DOORS")
                                arcpy.conversion.ExportFeatures(out_fc_edit, os.path.join(gdb,mylayers[0] + "_join"), None, False, 'FACILITY_ID "FACILITYID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;Facility_Layer "Facility_Layer" true true false 255 Text 0 0,First,#,{0},Level_Layer,0,255;Facility_RefName "Facility_RefName" true true false 255 Text 0 0,First,#,{0},Level_RefName,0,255;Facility_DocName "Facility_DocName" true true false 255 Text 0 0,First,#,{0},Level_DocName,0,255;Facility_DocPath "Facility_DocPath" true true false 4096 Text 0 0,First,#,{0},Level_DocPath,0,4096;Facility_DocType "Facility_DocType" true true false 32 Text 0 0,First,#,{0},Level_DocType,0,32;Facility_DocVer "Facility_DocVer" true true false 255 Text 0 0,First,#,{0},Level_DocVer,0,255'.format(out_fc_edit))
                                arcpy.JoinField_management(out_fc_join, "FACILITY_ID",BuildingProperties, "FACILITY_ID", IndoorsUtilsModule.FACILITY_JN_FIELDS)
                                IndoorsUtilsModule.calcArea(out_fc_join, calculation_method)
                                if rotation is None or rotation == "" and facilityID not in facilityRotation:
                                    facilityRotation.append(facilityID)
                                else:
                                    arcpy.CalculateField_management(out_fc_join, 'ROTATION', rotation, "PYTHON3", None)
                                arcpy.CopyFeatures_management(out_fc_join,out_fc_copy)
                        except arcpy.ExecuteError:
                            arcpy.AddError(arcpy.GetMessages(2))
                        except Exception as e:
                            arcpy.AddError("{0}".format(e))

                        if len(fcs) >= 2:
                            arcpy.Merge_management(fcs, out_fc)
                            arcpy.DeleteField_management(out_fc, "SOURCE_PATH;NAME_SHORT;NAME;DESCRIPTION;LEVELID;LEVEL_NUMBER;VERTICAL_ORDER;ELEVATION_RELATIVE;HEIGHT_RELATIVE;HEIGHT_ABSOLUTE;ELEVATION_ABSOLUTE;ACCESS_TYPE;CLOSE_DOORS")
                            arcpy.conversion.ExportFeatures(out_fc, os.path.join(gdb, mylayers[0] + "_join"), None, False, 'FACILITY_ID "FACILITYID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,255;Facility_Layer "Facility_Layer" true true false 255 Text 0 0,First,#,{0},Level_Layer,0,255;Facility_RefName "Facility_RefName" true true false 255 Text 0 0,First,#,{0},Level_RefName,0,255;Facility_DocName "Facility_DocName" true true false 255 Text 0 0,First,#,{0},Level_DocName,0,255;Facility_DocPath "Facility_DocPath" true true false 4096 Text 0 0,First,#,{0},Level_DocPath,0,4096;Facility_DocType "Facility_DocType" true true false 32 Text 0 0,First,#,{0},Level_DocType,0,32;Facility_DocVer "Facility_DocVer" true true false 255 Text 0 0,First,#,{0},Level_DocVer,0,255'.format(out_fc))
                            IndoorsUtilsModule.calcArea(out_fc_join, calculation_method)
                            arcpy.Dissolve_management(out_fc_join, out_fc_dissolve, "FACILITY_ID", "Facility_Layer FIRST;Facility_RefName FIRST;Facility_DocName FIRST;Facility_DocPath FIRST;Facility_DocType FIRST;Facility_DocVer FIRST;AREA_SQFT SUM;AREA_SQMT SUM", "MULTI_PART", "DISSOLVE_LINES")
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_layer','Facility_Layer')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocName','Facility_DocName')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_RefName','Facility_RefName')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocPath','Facility_DocPath')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocVer','Facility_DocVer')
                            arcpy.AlterField_management(out_fc_dissolve,'FIRST_Facility_DocType','Facility_DocType')
                            arcpy.AlterField_management(out_fc_dissolve,'SUM_AREA_SQFT','AREA_SQFT')
                            arcpy.AlterField_management(out_fc_dissolve,'SUM_AREA_SQMT','AREA_SQMT')
                            arcpy.JoinField_management(out_fc_dissolve, "FACILITY_ID", BuildingProperties, "FACILITY_ID", IndoorsUtilsModule.FACILITY_JN_FIELDS)
                            arcpy.AddField_management(out_fc_dissolve, "ROTATION", "DOUBLE", None, None, None, "ROTATION", "NULLABLE", "NON_REQUIRED", None)
                            if rotation is None or rotation == "" and facilityID not in facilityRotation:
                                facilityRotation.append(facilityID)
                            else:
                                arcpy.CalculateField_management(out_fc_dissolve, 'ROTATION', rotation, "PYTHON3", None)
                            arcpy.CopyFeatures_management(out_fc_dissolve, out_fc_copy)
                        else:
                            pass

            #  MERGE FEATURES TO CONSOLIDATED GDB
            mylayers = ['facility','level','fixtures','details','doors','doors_closed','units_raw','units','zones_raw','zones','sections_raw','sections','door_pt']
            myfcs = ['*facility_poly_fc','*level_poly_fc','*detail_poly_fc','*detail_line_fc','*door_line_fc','*door_line_closed_fc','*unit_poly_fc','*unit_poly_anno_fc','*zone_poly_fc','*zone_poly_anno_fc','*section_poly_fc','*section_poly_anno_fc','*door_pt_fc']
            gdb = r"{0}".format(consolidatedGDB)
            facility_flds_jn = ['SITE_ID', 'SITE_NAME', 'NAME', 'ADDRESS', 'UNIT', 'LOCALITY', 'PROVINCE', 'COUNTRY',
                                'POSTAL_CODE', 'DATE_BUILT']
            leveldeleteflds = ['CLOSE_DOORS']



            area_unit_type_value = area_unit_type[area_measure_units] #unit

            # MERGE FACILITIES
            myindoorfc = myfcs[0]
            fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
            out_fc = os.path.join(gdb, mylayers[0]+"_merged")
            if len(fcs) == 0:
                arcpy.AddIDMessage("WARNING", 180156, "Facilities")
                pass
            else:
                arcpy.Merge_management(fcs, out_fc)

                arcpy.FeatureTo3DByAttribute_3d(out_fc, out_fc + "_3d","ELEVATION_RELATIVE", None)
                out_fc = out_fc + "_3d"

                arcpy.AddField_management(out_fc, "AREA_UM", "LONG", None, None, None, "AREA_UM", "NULLABLE", "NON_REQUIRED", None)
                arcpy.AddField_management(out_fc,'SOURCE_METHOD',"TEXT",None,None,255,'SOURCE_METHOD','NULLABLE','NON_REQUIRED',None)
                arcpy.CalculateField_management(out_fc, 'AREA_UM', area_units_dict[area_measure_units], "PYTHON3", None)
                arcpy.CalculateField_management(out_fc, 'SOURCE_METHOD','"Import Floorplans To Indoors Geodatabase tool"', "PYTHON3", None)
                IndoorsUtilsModule.updateFacilities(AIIMGDB, out_fc, facilitiesPath, gdb, FloorProperties, area_measure_units, self.isLegacyDataset, calculation_method)

                #if arcpy.Exists(PathProperties):
                if self.onlineLayer:
                    faciltiesFCPath = AIIMGDB["FACILITIES"]
                else:
                    faciltiesFCPath = IndoorsUtilsModule.getQualifiedNameFC(AIIMGDB, facilitiesPath, IndoorsUtilsModule.INDOORAIIMDATASETNAME)
                arcpy.management.DeleteIdentical(faciltiesFCPath, "FACILITY_ID;SHAPE", None, 0)
                arcpy.AddIDMessage("INFORMATIVE", 180155, "Facilities")

            # MERGE LEVELS
            myindoorfc = myfcs[1]
            fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
            out_fc = os.path.join(gdb, mylayers[1]+"_merged")

            if len(fcs) == 0:
                arcpy.AddIDMessage("WARNING", 180156, "Levels")
            else:
                arcpy.Merge_management(fcs, out_fc)
                arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                if (fieldExist == True):
                    arcpy.DeleteField_management(out_fc,fieldsToDelete)
                arcpy.AlterField_management(out_fc,'NAME_1','FACILITYNAME','Facility Name')
                arcpy.AddField_management(out_fc, "AREA_UM", "LONG", None, None, None, "AREA_UM", "NULLABLE","NON_REQUIRED", None)
                arcpy.AddField_management(out_fc,'SOURCE_METHOD',"TEXT",None,None,255,'SOURCE_METHOD','NULLABLE','NON_REQUIRED',None)

                arcpy.CalculateField_management(out_fc, 'AREA_UM', area_units_dict[area_measure_units], "PYTHON3", None)
                arcpy.CalculateField_management(out_fc, 'SOURCE_METHOD','"Import Floorplans To Indoors Geodatabase tool"', "PYTHON3", None)
                IndoorsUtilsModule.calcArea(out_fc, calculation_method)


                arcpy.FeatureTo3DByAttribute_3d(out_fc, out_fc + "_3d","ELEVATION_RELATIVE", None)
                out_fc = out_fc + "_3d"

                if self.onlineLayer:
                    levelsFCPath = AIIMGDB["LEVELS"]
                else:
                    levelsFCPath = IndoorsUtilsModule.getQualifiedNameFC(AIIMGDB, levelsPath, IndoorsUtilsModule.INDOORAIIMDATASETNAME)

                ### Update Levels
                existingIds, commonIds, missingIds, newlyCreatedIds = self.getFeatureIds(levelsFCPath, out_fc, "level_id", "levelid")
                updateLevelFeatures = True if len(existingIds) > 0 else False

                if updateLevelFeatures:
                    out_fc = self.updateIndoorFeatureClass("level_id", levelsFCPath, out_fc, existingIds, commonIds, missingIds, newlyCreatedIds, area_unit_type_value, True)
                else:
                    # OLD code - make sure this is execute when no features exist in the database - this is like importing for the first time
                    IndoorsUtilsModule.appendIndoorFeatureClasses(out_fc, levelsFCPath, self.isLegacyDataset)
                appendfields = 'LEVEL_ID "Level ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,254;NAME_SHORT "Short Name" true true false 100 Text 0 0,First,#,{0},NAME_SHORT,0,255;NAME "Name" true true false 255 Text 0 0,First,#,{0},NAME,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,50;FACILITY_NAME "Facility Name" true true false 100 Text 0 0,First,#,{0},FACILITYNAME,0,100;LEVEL_ID "Level ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,50;LEVEL_NAME "Level Name" true true false 100 Text 0 0,First,#,{0},LEVEL_NAME,0,100;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Level_Layer,0,60;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Level_DocType,0,50'
                if len(newlyCreatedIds) > 0:
                    arcpy.Append_management(out_fc, levelsFCPath, "NO_TEST", appendfields.format(out_fc, AREA_UNIT_MEASURE=area_unit_type[area_measure_units]), None)
                if len(facilityRotation) > 0:
                    IndoorsUtilsModule.calcRotation(levelsFCPath, facilitiesPath, facilityRotation)
                #if arcpy.Exists(PathProperties):
                arcpy.management.DeleteIdentical(levelsFCPath, "FACILITY_ID;LEVEL_ID;SHAPE", None, 0)
                arcpy.AddIDMessage("INFORMATIVE", 180155, "Levels")

            # MERGE DETAILS
            myindoorfc = myfcs[3]
            fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
            out_fc = os.path.join(gdb, mylayers[3]+"_merged")

            if len(fcs) == 0:
                arcpy.AddIDMessage("WARNING", 180156, "Details")
            else:
                arcpy.Merge_management(fcs, out_fc)
                arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                if (fieldExist == True):
                    arcpy.DeleteField_management(out_fc,fieldsToDelete)
                arcpy.AlterField_management(out_fc,'NAME_1','FACILITYNAME','Facility Name')
                arcpy.AlterField_management(out_fc,'NAME_SHORT','LEVEL_NAME','Level Name')
                arcpy.AddField_management(out_fc,'IUID',"TEXT",None,None,255,'Item ID','NULLABLE','NON_REQUIRED',None)
                arcpy.AddField_management(out_fc,'SOURCE_METHOD',"TEXT",None,None,255,'SOURCE_METHOD','NULLABLE','NON_REQUIRED',None)
                arcpy.CalculateField_management(out_fc,'IUID','!LEVELID! + "{0}Details{0}" + str(!OBJECTID!)'.format(UniqueID_delimiter),"PYTHON3",None)
                arcpy.CalculateField_management(out_fc, 'SOURCE_METHOD','"Import Floorplans To Indoors Geodatabase tool"', "PYTHON3", None)
                IndoorsUtilsModule.calcLength(out_fc)

                arcpy.FeatureTo3DByAttribute_3d(out_fc, out_fc + "_3d", "ELEVATION_RELATIVE", None)
                out_fc = out_fc + "_3d"

                if self.onlineLayer:
                    detailsFCPath = AIIMGDB["DETAILS"]
                else:
                    detailsFCPath = IndoorsUtilsModule.getQualifiedNameFC(AIIMGDB, detailsPath, IndoorsUtilsModule.INDOORAIIMDATASETNAME)
                ### Update Details
                # Delete existing details features for the selected levels and facilities
                self.deleteExistingDetailFeatures(detailsFCPath, out_fc, "detail_id", "IUID")

                #existingIds, commonIds, missingIds, newlyCreatedIds = self.getFeatureIds(detailsFCPath, out_fc, "detail_id", "IUID")
                #updateDetailsFeatures = True if len(existingIds) > 0 else False

                # if updateDetailsFeatures:
                #     out_fc = self.updateIndoorFeatureClass("detail_id", detailsFCPath, out_fc, existingIds, commonIds, missingIds, newlyCreatedIds, area_unit_type_value)
                # else:
                #     IndoorsUtilsModule.appendIndoorFeatureClasses(out_fc, detailsFCPath, self.isLegacyDataset)
                # if len(newlyCreatedIds) > 0:
                arcpy.Append_management(out_fc, detailsFCPath, "NO_TEST",'DETAIL_ID "Detail ID" true true false 255 Text 0 0,First,#,{0},IUID,0,254;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},Detail_Layer,0,255;USE_TYPE "Use Type" true true false 50 Text 0 0,First,#,{0},UNIT_USE,0,254;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,50;FACILITY_NAME "Facility Name" true true false 100 Text 0 0,First,#,{0},FACILITYNAME,0,100;LEVEL_ID "Level ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,50;LEVEL_NAME "Level Name" true true false 100 Text 0 0,First,#,{0},NAME,0,100;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Detail_Layer,0,60;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Detail_DocType,0,50;USE_TYPE "Use Type" true true false 50 Text 0 0,First,#,{0},Detail_Layer,0,255'.format(out_fc),None)
                indoorDetailsFields = [field.name.lower() for field in arcpy.ListFields(detailsFCPath)]
                detail_fields = ""
                if ("facility_id" in indoorDetailsFields):
                    detail_fields = "FACILITY_ID;LEVEL_ID;SHAPE"
                else:
                    detail_fields = "LEVEL_ID;SHAPE"
                arcpy.management.DeleteIdentical(detailsFCPath, detail_fields, None, 0)
                arcpy.AddIDMessage("INFORMATIVE", 180155, "Details")

            myindoorfc = myfcs[6]
            fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
            out_fc = os.path.join(gdb, mylayers[6]+"_merged")

            if len(fcs) == 0:
                pass
            else:
                arcpy.Merge_management(fcs, out_fc)
                arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                if (fieldExist == True):
                    arcpy.DeleteField_management(out_fc,fieldsToDelete)
                arcpy.AlterField_management(out_fc,'NAME_1','FACILITYNAME','Facility Name')
                IndoorsUtilsModule.calcArea(out_fc, calculation_method)

            # MERGE UNITS
            myindoorfc = myfcs[7]
            fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
            out_fc = os.path.join(gdb, mylayers[7]+"_merged")

            if len(fcs) > 0:
                arcpy.Merge_management(fcs, out_fc)
                arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                if (fieldExist == True):
                    arcpy.DeleteField_management(out_fc,fieldsToDelete)
                arcpy.AlterField_management(out_fc,'NAME_1','FACILITY_NAME','Facility Name')
                arcpy.AlterField_management(out_fc,'NAME_SHORT','LEVEL_NAME','Level Name')
                arcpy.AlterField_management(out_fc,'NAME','LEVELLONGNAME','Level Longname')
                arcpy.AlterField_management(out_fc,'DESCRIPTION','LEVELDESCRIPTION','Level Description')
                arcpy.AddField_management(out_fc,'NAME',"TEXT",None,None,255,'Name','NULLABLE','NON_REQUIRED',None)
                arcpy.AddField_management(out_fc,'LONGNAME',"TEXT",None,None,255,'Longname','NULLABLE','NON_REQUIRED',None)
                arcpy.AddField_management(out_fc,'DESCRIPTION',"TEXT",None,None,255,'Description','NULLABLE','NON_REQUIRED',None)
                #arcpy.AddField_management(out_fc, "FACILITYNUMBER", "LONG", None, None, None, "FACILITYNUMBER", "NULLABLE", "NON_REQUIRED", None)
                arcpy.AddField_management(out_fc,'IUID',"TEXT",None,None,255,'Item ID','NULLABLE','NON_REQUIRED',None)
                #arcpy.AddField_management(out_fc,'NOTES',"TEXT",None,None,2000,'NOTES','NULLABLE','NON_REQUIRED',None)
                arcpy.AddField_management(out_fc, "AREA_UM", "LONG", None, None, None, "AREA_UM", "NULLABLE",
                                              "NON_REQUIRED", None)
                arcpy.AddField_management(out_fc,'SOURCE_METHOD',"TEXT",None,None,255,'SOURCE_METHOD','NULLABLE','NON_REQUIRED',None)
                arcpy.CalculateField_management(out_fc, "IUID", "var(!OBJECTID!,!UNIT_ID!,!LEVELID!,!VERTICAL_ORDER!)", "PYTHON3",'def var(oid,unitid,levelid,floor):\n    if unitid == None:\n        return levelid + "{0}" + str(floor+1) + str(oid)\n    else:\n        return unitid'.format(UniqueID_delimiter))
                arcpy.CalculateField_management(out_fc, "NAME", "var(!OBJECTID!,!UNIT_NUMBER!,!UNIT_NAME!,!LEVELID!,!VERTICAL_ORDER!)", "PYTHON3", 'def var(oid,unitid,unitnm,levelid,floor):\n    if unitnm == None and unitid == None:\n        return str(floor+1) + str(oid)\n    elif unitnm == "" and unitid == None:\n        return str(floor+1) + str(oid)\n    elif unitnm == None and unitid != None:\n        return unitid\n    elif unitnm == "" and unitid != None:\n        return unitid\n    else:\n        if len(unitnm)<=100:\n            return unitnm\n        else:\n            return unitnm[:97] + "..."')
                arcpy.CalculateField_management(out_fc, 'LONGNAME', '!NAME! + ", " +!LEVEL_NAME! ', 'PYTHON3', None)
                arcpy.CalculateField_management(out_fc, 'DESCRIPTION', '!NAME! + ", " +!LEVELLONGNAME!', 'PYTHON3', None)
                #arcpy.CalculateField_management(out_fc, "FACILITYNUMBER", 'str(!FACILITYNUMBER!)', "PYTHON3", None)
                #arcpy.CalculateField_management(out_fc, 'NOTES', '"Nbr:" + str(!NUMBER!)  + "|ID:" + !IUID! + "| Name:" + !NAME! + "| Use:" +str(!UNIT_USE!)+ "|Dept:" + str( !UNIT_DEPARTMENT!) + "|Emp:" + str(!UNIT_EMPLOYEE!)', "PYTHON3", None)
                arcpy.CalculateField_management(out_fc, 'AREA_UM', area_units_dict[area_measure_units], "PYTHON3", None)
                arcpy.CalculateField_management(out_fc, 'SOURCE_METHOD',
                                                                        '"Import Floorplans To Indoors Geodatabase tool"', "PYTHON3", None)
                IndoorsUtilsModule.calcArea(out_fc, calculation_method)
                arcpy.FeatureTo3DByAttribute_3d(out_fc, out_fc + "_3d","ELEVATION_RELATIVE", None)
                out_fc = out_fc + "_3d"
                if self.onlineLayer:
                    unitsFCPath = AIIMGDB["UNITS"]
                else:
                    unitsFCPath = IndoorsUtilsModule.getQualifiedNameFC(AIIMGDB, unitsPath, IndoorsUtilsModule.INDOORAIIMDATASETNAME)

                ### CHANGE STARTS
                existingIds, commonIds, missingIds, newlyCreatedIds = self.getFeatureIds(unitsFCPath, out_fc, "unit_id", "IUID")
                updateUnitsFeatures = True if len(existingIds) > 0 else False

                if updateUnitsFeatures:
                    out_fc = self.updateIndoorFeatureClass("unit_id", unitsFCPath, out_fc, existingIds, commonIds, missingIds, newlyCreatedIds, area_unit_type_value)
                else:
                    IndoorsUtilsModule.appendIndoorFeatureClasses(out_fc, unitsFCPath, self.isLegacyDataset)
                appendfields = 'UNIT_ID "UNIT ID" true true false 255 Text 0 0,First,#,{0},IUID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},LONGNAME,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},LONGNAME,0,255;USE_TYPE "Use Type" true true false 50 Text 0 0,First,#,{0},UNIT_USE,0,254;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,50;FACILITY_NAME "Facility Name" true true false 100 Text 0 0,First,#,{0},FACILITY_NAME,0,100;LEVEL_ID "Level ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,50;LEVEL_NAME "Level Name" true true false 100 Text 0 0,First,#,{0},LEVELLONGNAME,0,100;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Unit_Layer,0,60;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Unit_DocType,0,50'
                if len(newlyCreatedIds) > 0:
                    arcpy.Append_management(out_fc, unitsFCPath, "NO_TEST", appendfields.format(out_fc, AREA_UNIT_MEASURE=area_unit_type[area_measure_units]), None)
                arcpy.management.DeleteIdentical(unitsFCPath, "FACILITY_ID;LEVEL_ID;SHAPE", None, 0)
                arcpy.AddIDMessage("INFORMATIVE", 180155, "Units")
            else:
                arcpy.AddIDMessage("WARNING", 180156, "Units")
                pass

            # MERGE ZONES RAW
            if zone_fc:
                if self.onlineLayer:
                    zonesFCPath = AIIMGDB["ZONES"]
                else:
                    desc = arcpy.Describe(zone_fc)
                    zonesFCPath = desc.catalogPath

                myindoorfc = myfcs[8]
                fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
                out_fc = os.path.join(gdb, mylayers[8]+"_merged")

                if len(fcs) == 0:
                    pass
                elif zonesFCPath and arcpy.Exists(zonesFCPath):
                    arcpy.Merge_management(fcs, out_fc)
                    arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                    fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                    if (fieldExist == True):
                        arcpy.DeleteField_management(out_fc,fieldsToDelete)
                    arcpy.AlterField_management(out_fc,'NAME_1','FACILITY_NAME','Facility Name')
                    IndoorsUtilsModule.calcArea(out_fc, calculation_method)


                # MERGE ZONES
                myindoorfc = myfcs[9]
                fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
                out_fc = os.path.join(gdb, mylayers[9]+"_merged")

                if len(fcs) == 0:
                    arcpy.AddIDMessage("WARNING", 180156, "Zones")
                elif zonesFCPath and arcpy.Exists(zonesFCPath):
                    arcpy.Merge_management(fcs, out_fc)
                    arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                    fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                    if (fieldExist == True):
                        arcpy.DeleteField_management(out_fc,fieldsToDelete)
                    arcpy.AlterField_management(out_fc,'NAME_1','FACILITY_NAME','Facility Name')
                    arcpy.AlterField_management(out_fc,'NAME_SHORT','LEVEL_NAME','Level Name')
                    arcpy.AlterField_management(out_fc,'NAME','LEVELLONGNAME','Level Longname')
                    arcpy.AlterField_management(out_fc,'DESCRIPTION','LEVELDESCRIPTION','Level Description')
                    arcpy.AddField_management(out_fc,'NAME',"TEXT",None,None,255,'Name','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc,'LONGNAME',"TEXT",None,None,255,'Longname','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc,'DESCRIPTION',"TEXT",None,None,255,'Description','NULLABLE','NON_REQUIRED',None)
                    #arcpy.AddField_management(out_fc, "NUMBER", "LONG", None, None, None, "NUMBER", "NULLABLE", "NON_REQUIRED", None)
                    arcpy.AddField_management(out_fc,'IUID',"TEXT",None,None,255,'Item ID','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc,'NOTES',"TEXT",None,None,2000,'NOTES','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc, "AREA_UM", "LONG", None, None, None, "AREA_UM", "NULLABLE",
                                              "NON_REQUIRED", None)
                    arcpy.AddField_management(out_fc,'SOURCE_METHOD',"TEXT",None,None,255,'SOURCE_METHOD','NULLABLE','NON_REQUIRED',None)
                    arcpy.CalculateField_management(out_fc, "IUID", "var(!OBJECTID!,!ZONE_ID!,!LEVELID!,!VERTICAL_ORDER!)", "PYTHON3",'def var(oid,zoneid,levelid,floor):\n    if zoneid == None:\n        return levelid + "{0}" + str(floor+1) + str(oid)\n    else:\n        return zoneid'.format(UniqueID_delimiter))
                    arcpy.CalculateField_management(out_fc, "NAME", "var(!OBJECTID!,!ZONE_NUMBER!,!ZONE_NAME!,!LEVELID!,!VERTICAL_ORDER!)", "PYTHON3", 'def var(oid,zoneid,zonenm,levelid,floor):\n    if zonenm == None and zoneid == None:\n        return str(floor+1) + str(oid)\n    elif zonenm == "" and zoneid == None:\n        return str(floor+1) + str(oid)\n    elif zonenm == None and zoneid != None:\n        return zoneid\n    elif zonenm == "" and zoneid != None:\n        return zoneid\n    else:\n        if len(zonenm)<=100:\n            return zonenm\n        else:\n            return zonenm[:97] + "..."')
                    arcpy.CalculateField_management(out_fc, 'LONGNAME', '!NAME! + ", " +!LEVEL_NAME! ', 'PYTHON3', None)
                    arcpy.CalculateField_management(out_fc, 'DESCRIPTION', '!NAME! + ", " +!LEVELLONGNAME!', 'PYTHON3', None)
                    #arcpy.CalculateField_management(out_fc, "NUMBER", "var(!OBJECTID!,!ZONE_NUMBER!,!VERTICALORDER!)", "PYTHON3", "def var(oid,zonenbrstr,vertorder):\n    if zonenbrstr == None:\n        return int(str(vertorder+1) + str(oid))\n    elif (''.join(filter(lambda x: x.isdigit(), zonenbrstr))).isdigit() == 'False':\n        return int(str(vertorder+1) + str(oid))\n    elif zonenbrstr == '':\n        return int(str(vertorder+1) + str(oid))\n    elif (''.join(filter(lambda x: x.isdigit(), zonenbrstr))).isdigit() == 'False':\n        return  int(str(vertorder+1) + str(oid))\n    else:\n        try:\n            return int(''.join(filter(lambda x: x.isdigit(), zonenbrstr)))\n        except:\n            return int(str(vertorder+1) + str(oid))")
                    #arcpy.CalculateField_management(out_fc, 'NOTES', '"Nbr:" + str(!NUMBER!)  + "|ID:" + !IUID! + "| Name:" + !NAME!', "PYTHON3", None)
                    arcpy.CalculateField_management(out_fc, 'AREA_UM', area_units_dict[area_measure_units], "PYTHON3", None)
                    arcpy.CalculateField_management(out_fc, 'SOURCE_METHOD','"Import Floorplans To Indoors Geodatabase tool"', "PYTHON3", None)
                    IndoorsUtilsModule.calcArea(out_fc, calculation_method)
                    arcpy.FeatureTo3DByAttribute_3d(out_fc, out_fc + "_3d","ELEVATION_RELATIVE", None)
                    out_fc = out_fc + "_3d"
                    #zonesFCPath = IndoorsUtilsModule.getQualifiedNameFC(AIIMGDB, zonesPath, IndoorsUtilsModule.INDOORAIIMDATASETNAME)

                    ### CHANGE STARTS
                    existingIds, commonIds, missingIds, newlyCreatedIds = self.getFeatureIds(zonesFCPath, out_fc, "zone_id", "IUID")
                    updateZonesFeatures = True if len(existingIds) > 0 else False

                    if updateZonesFeatures:
                        out_fc = self.updateIndoorFeatureClass("zone_id", zonesFCPath, out_fc, existingIds, commonIds, missingIds, newlyCreatedIds, area_unit_type_value)
                    else:
                        IndoorsUtilsModule.appendIndoorFeatureClasses(out_fc, zonesFCPath, self.isLegacyDataset)
                    appendfields = 'ZONE_ID "Zone ID" true true false 255 Text 0 0,First,#,{0},IUID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},LONGNAME,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,50;FACILITY_NAME "Facility Name" true true false 100 Text 0 0,First,#,{0},FACILITY_NAME,0,100;LEVEL_ID "Level ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,50;LEVEL_NAME "Level Name" true true false 100 Text 0 0,First,#,{0},LEVELLONGNAME,0,100;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Zone_Layer,0,60;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Zone_DocType,0,50'
                    if len(newlyCreatedIds) > 0:
                        arcpy.Append_management(out_fc, zonesFCPath, "NO_TEST", appendfields.format(out_fc, AREA_UNIT_MEASURE=area_unit_type[area_measure_units]), None)

                    #if arcpy.Exists(PathProperties):
                    arcpy.management.DeleteIdentical(zonesFCPath, "FACILITY_ID;LEVEL_ID;SHAPE", None, 0)
                    arcpy.AddIDMessage("INFORMATIVE", 180155, "Zones")

            # MERGE SECTIONS RAW
            if section_fc:
                if self.onlineLayer:
                    sectionsFCPath = AIIMGDB["SECTIONS"]
                else:
                    desc = arcpy.Describe(section_fc)
                    sectionsFCPath = desc.catalogPath

                myindoorfc = myfcs[10]
                fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
                out_fc = os.path.join(gdb, mylayers[10]+"_merged")

                if len(fcs) == 0:
                    pass
                elif sectionsFCPath and arcpy.Exists(sectionsFCPath):
                    arcpy.Merge_management(fcs, out_fc)
                    arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                    fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                    if (fieldExist == True):
                        arcpy.DeleteField_management(out_fc,fieldsToDelete)
                    arcpy.AlterField_management(out_fc,'NAME_1','FACILITY_NAME','Facility Name')
                    IndoorsUtilsModule.calcArea(out_fc, calculation_method)


                # MERGE SECTIONS
                myindoorfc = myfcs[11]
                fcs = IndoorsUtilsModule.listFcsInGDB(gdb, myindoorfc)
                out_fc = os.path.join(gdb, mylayers[11]+"_merged")

                if len(fcs) == 0:
                    arcpy.AddIDMessage("WARNING", 180156, "Sections")
                elif sectionsFCPath and arcpy.Exists(sectionsFCPath):
                    arcpy.Merge_management(fcs, out_fc)
                    arcpy.JoinField_management(out_fc,"FACILITY_ID",BuildingProperties,"FACILITY_ID",facility_flds_jn)
                    fieldExist, fieldsToDelete = IndoorsUtilsModule.validateFields(out_fc, leveldeleteflds)
                    if (fieldExist == True):
                        arcpy.DeleteField_management(out_fc,fieldsToDelete)
                    arcpy.AlterField_management(out_fc,'NAME_1','FACILITY_NAME','Facility Name')
                    arcpy.AlterField_management(out_fc,'NAME_SHORT','LEVEL_NAME','Level Name')
                    arcpy.AlterField_management(out_fc,'NAME','LEVELLONGNAME','Level Longname')
                    arcpy.AlterField_management(out_fc,'DESCRIPTION','LEVELDESCRIPTION','Level Description')
                    arcpy.AddField_management(out_fc,'NAME',"TEXT",None,None,255,'Name','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc,'LONGNAME',"TEXT",None,None,255,'Longname','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc,'DESCRIPTION',"TEXT",None,None,255,'Description','NULLABLE','NON_REQUIRED',None)
                    #arcpy.AddField_management(out_fc, "NUMBER", "LONG", None, None, None, "NUMBER", "NULLABLE", "NON_REQUIRED", None)
                    arcpy.AddField_management(out_fc,'IUID',"TEXT",None,None,255,'Item ID','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc,'NOTES',"TEXT",None,None,2000,'NOTES','NULLABLE','NON_REQUIRED',None)
                    arcpy.AddField_management(out_fc, "AREA_UM", "LONG", None, None, None, "AREA_UM", "NULLABLE",
                                              "NON_REQUIRED", None)
                    arcpy.AddField_management(out_fc,'SOURCE_METHOD',"TEXT",None,None,255,'SOURCE_METHOD','NULLABLE','NON_REQUIRED',None)
                    arcpy.CalculateField_management(out_fc, "IUID", "var(!OBJECTID!,!SECTION_ID!,!LEVELID!,!VERTICAL_ORDER!)", "PYTHON3",'def var(oid,sectionid,levelid,floor):\n    if sectionid == None:\n        return levelid + "{0}" + str(floor+1) + str(oid)\n    else:\n        return sectionid'.format(UniqueID_delimiter))
                    arcpy.CalculateField_management(out_fc, "NAME", "var(!OBJECTID!,!SECTION_NUMBER!,!SECTION_NAME!,!LEVELID!,!VERTICAL_ORDER!)", "PYTHON3", 'def var(oid,sectionid,sectionnm,levelid,floor):\n    if sectionnm == None and sectionid == None:\n        return str(floor+1) + str(oid)\n    elif sectionnm == "" and sectionid == None:\n        return str(floor+1) + str(oid)\n    elif sectionnm == None and sectionid != None:\n        return sectionid\n    elif sectionnm == "" and sectionid != None:\n        return sectionid\n    else:\n        if len(sectionnm)<=100:\n            return sectionnm\n        else:\n            return sectionnm[:97] + "..."')
                    arcpy.CalculateField_management(out_fc, 'LONGNAME', '!NAME! + ", " +!LEVEL_NAME! ', 'PYTHON3', None)
                    arcpy.CalculateField_management(out_fc, 'DESCRIPTION', '!NAME! + ", " +!LEVELLONGNAME!', 'PYTHON3', None)
                    #arcpy.CalculateField_management(out_fc, "NUMBER", "var(!OBJECTID!,!SECTION_NUMBER!,!VERTICALORDER!)", "PYTHON3", "def var(oid,sectionnbrstr,vertorder):\n    if sectionnbrstr == None:\n        return int(str(vertorder+1) + str(oid))\n    elif (''.join(filter(lambda x: x.isdigit(), sectionnbrstr))).isdigit() == 'False':\n        return int(str(vertorder+1) + str(oid))\n    elif sectionnbrstr == '':\n        return int(str(vertorder+1) + str(oid))\n    elif (''.join(filter(lambda x: x.isdigit(), sectionnbrstr))).isdigit() == 'False':\n        return  int(str(vertorder+1) + str(oid))\n    else:\n        try:\n            return int(''.join(filter(lambda x: x.isdigit(), sectionnbrstr)))\n        except:\n            return int(str(vertorder+1) + str(oid))")
                    #arcpy.CalculateField_management(out_fc, 'NOTES', '"Nbr:" + str(!NUMBER!)  + "|ID:" + !IUID! + "| Name:" + !NAME!', "PYTHON3", None)
                    arcpy.CalculateField_management(out_fc, 'AREA_UM', area_units_dict[area_measure_units], "PYTHON3", None)
                    arcpy.CalculateField_management(out_fc, 'SOURCE_METHOD',
                                                                        '"Import Floorplans To Indoors Geodatabase tool"', "PYTHON3", None)

                    IndoorsUtilsModule.calcArea(out_fc, calculation_method)

                    arcpy.FeatureTo3DByAttribute_3d(out_fc, out_fc + "_3d","ELEVATION_RELATIVE", None)
                    out_fc = out_fc + "_3d"

                    ### CHANGE STARTS
                    existingIds, commonIds, missingIds, newlyCreatedIds = self.getFeatureIds(sectionsFCPath, out_fc, "section_id", "IUID")
                    updateSectionsFeatures = True if len(existingIds) > 0 else False

                    if updateSectionsFeatures:
                        out_fc = self.updateIndoorFeatureClass("section_id", sectionsFCPath, out_fc, existingIds, commonIds, missingIds, newlyCreatedIds, area_unit_type_value)
                    else:
                        IndoorsUtilsModule.appendIndoorFeatureClasses(out_fc, sectionsFCPath, self.isLegacyDataset)
                    appendfields = 'SECTION_ID "Section ID" true true false 255 Text 0 0,First,#,{0},IUID,0,254;NAME "Name" true true false 100 Text 0 0,First,#,{0},NAME,0,255;NAME_LONG "Long Name" true true false 255 Text 0 0,First,#,{0},LONGNAME,0,255;DESCRIPTION "Description" true true false 255 Text 0 0,First,#,{0},DESCRIPTION,0,255;ACCESS_TYPE "Access Type" true true false 50 Text 0 0,First,#,{0},ACCESS_TYPE,0,255;SITE_ID "Site ID" true true false 255 Text 0 0,First,#,{0},SITE_ID,0,50;SITE_NAME "Site Name" true true false 100 Text 0 0,First,#,{0},SITE_NAME,0,50;FACILITY_ID "Facility ID" true true false 255 Text 0 0,First,#,{0},FACILITY_ID,0,50;FACILITY_NAME "Facility Name" true true false 100 Text 0 0,First,#,{0},FACILITY_NAME,0,100;LEVEL_ID "Level ID" true true false 255 Text 0 0,First,#,{0},LEVELID,0,50;LEVEL_NAME "Level Name" true true false 100 Text 0 0,First,#,{0},LEVELLONGNAME,0,100;VERTICAL_ORDER "Vertical Order" true true false 2 Short 0 0,First,#,{0},VERTICAL_ORDER,-1,-1;LEVEL_NUMBER "Level Number" true true false 4 Long 0 0,First,#,{0},LEVEL_NUMBER,-1,-1;AREA_UM "Area Unit of Measure" true true false 4 Long 0 0,First,#,{0},AREA_UM,-1,-1;ELEVATION_RELATIVE "Relative Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_RELATIVE,-1,-1;ELEVATION_ABSOLUTE "Absolute Elevation" true true false 8 Double 0 0,First,#,{0},ELEVATION_ABSOLUTE,-1,-1;HEIGHT_RELATIVE "Relative Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_RELATIVE,-1,-1;HEIGHT_ABSOLUTE "Absolute Height" true true false 8 Double 0 0,First,#,{0},HEIGHT_ABSOLUTE,-1,-1;AREA_NET "Net Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;AREA_GROSS "Gross Area" true true false 8 Double 0 0,First,#,{0},{AREA_UNIT_MEASURE},-1,-1;SOURCE_NAME "Source Name" true true false 50 Text 0 0,First,#,{0},Section_Layer,0,60;SOURCE_PATH "Source Path" true true false 255 Text 0 0,First,#,{0},SOURCE_PATH,0,255;SOURCE_METHOD "Source Method" true true false 255 Text 0 0,First,#,{0},SOURCE_METHOD,0,255;SOURCE_TYPE "Source Type" true true false 50 Text 0 0,First,#,{0},Section_DocType,0,50'
                    if len(newlyCreatedIds) > 0:
                        arcpy.Append_management(out_fc, sectionsFCPath, "NO_TEST", appendfields.format(out_fc, AREA_UNIT_MEASURE=area_unit_type[area_measure_units]), None)

                    arcpy.management.DeleteIdentical(sectionsFCPath, "FACILITY_ID;LEVEL_ID;SHAPE", None, 0)
                    arcpy.AddIDMessage("INFORMATIVE", 180155, "Sections")

            #Update Reservations
            #self.updateReservations(AIIMGDB)

            #Assign custom annotation
            self.customAttributeAnnotation(FloorProperties, PathProperties, sdeQualifier, AIIMGDB,
                                            IndoorsUtilsModule.INDOORAIIMDATASETNAME, sharedOutputGDB,
                                            ExcelTemplate, annotationCutomFieldSheet)
            # Calculate gross and net area for facility as sum of those areas for levels
            self.calculateFacilityArea(AIIMGDB)

        except LicenseError:
            # You must have an Advanced License to run this tool.
            arcpy.AddIDMessage("ERROR", 180002)

        except Exception as e:
            failed = True
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
        finally:
            arcpy.CheckInExtension("Indoors")
            arcpy.env.workspace = env_workspace
            if inValidIndoorsDataset:
                return
            if failed == True:
                #restore the data that was deleteD as duplicate
                if IndoorsUtilsModule.AIIM_UPDATE_FEATURECLASSES:
                    for layer in IndoorsUtilsModule.AIIM_UPDATE_FEATURECLASSES:
                        AIIMfcName = IndoorsUtilsModule.AIIM_UPDATE_FEATURECLASSES[layer]
                        if arcpy.Exists(layer) and arcpy.Exists(AIIMfcName):
                            arcpy.Append_management(layer, AIIMfcName, "NO_TEST", None, None, None)
            # delete temp layers after restoring data
            if IndoorsUtilsModule.AIIM_UPDATE_FEATURECLASSES:
                for layer in IndoorsUtilsModule.AIIM_UPDATE_FEATURECLASSES:
                    arcpy.Delete_management(layer)
            if not self.onlineLayer and arcpy.Exists(AIIMGDB):
                keepall_path = os.path.join(AIIMGDB,"KEEP_ALL")
                if arcpy.Exists(keepall_path):
                    arcpy.Delete_management(keepall_path)
            return

    def updateReservations(self, AIIMGDB):
        # get set of unit_id from reservations
        # Get unique level_id from reservations. Create a query.
        # get set of unit_id from units fc for the above query

        sdeQualifier = self.sdeQualifier
        reservationsFCStandalone = os.path.join(AIIMGDB, self.sdeQualifier + "reservations")
        if arcpy.Exists(reservationsFCStandalone):
            reservationsFC = reservationsFCStandalone
        else:
            reservationsFC = os.path.join(AIIMGDB, self.sdeQualifier + IndoorsUtilsModule.INDOORAIIMDATASETNAME,self.sdeQualifier + "reservations")
        unitsFC = os.path.join(AIIMGDB, self.sdeQualifier + IndoorsUtilsModule.INDOORAIIMDATASETNAME, self.sdeQualifier + "units")
        if not arcpy.Exists(reservationsFC) or not arcpy.Exists(unitsFC):
            return
        unitIdsReservations = IndoorsUtilsModule.getUniqueValues(reservationsFC, "unit_id")
        levelIdsReservations = IndoorsUtilsModule.getUniqueValues(reservationsFC, "level_id")
        if len(unitIdsReservations) == 0 or len(levelIdsReservations) == 0:
            return
        levelIdsReservationsStr = ', '.join(f"'{id}'" for id in list(levelIdsReservations))
        uniqueLevelIdsQuery = "LEVEL_ID IN " + "(" + levelIdsReservationsStr + ")"
        unitIdsUnits = set()
        with arcpy.da.SearchCursor(unitsFC, ["unit_id"], uniqueLevelIdsQuery) as cursor:
            for row in cursor:
                unitIdsUnits.add(row[0])
        missingUnitIds = set(unitIdsReservations) - unitIdsUnits
        if len(missingUnitIds) == 0:
            return
        missingUnitIdsStr = ', '.join(f"'{id}'" for id in list(missingUnitIds))
        missingUnitIdsQuery = "unit_id IN " + "(" + missingUnitIdsStr + ")"

        reservationsLayer = "reservationsLayer"
        arcpy.MakeFeatureLayer_management(reservationsFC, reservationsLayer)
        arcpy.management.SelectLayerByAttribute(reservationsLayer, "NEW_SELECTION", missingUnitIdsQuery, "NON_INVERT")
        #Set the reservation state to cancelled = 3 domain value
        arcpy.management.CalculateField(reservationsLayer, "STATE", 3)
        #arcpy.management.DeleteFeatures(reservationsLayer)

    def deleteExistingDetailFeatures(self, indoorFC, out_fc, indoorIdField, outFCIdField):
        #Delete existing details feeaturees
        if not indoorFC or not out_fc or not indoorIdField or not outFCIdField:
            return
        indoorIdField = indoorIdField.lower()
        # Get unique list of facility and level Ids
        uniqueFacilityIds = IndoorsUtilsModule.getUniqueValues(out_fc, IndoorsUtilsModule.SCRATCHWKS_FACILITYID)
        uniqueLevelIds = IndoorsUtilsModule.getUniqueValues(out_fc, IndoorsUtilsModule.SCRATCHWKS_LEVELID)
        uniqueFacilityIdsStr = ', '.join(f"'{id}'" for id in list(uniqueFacilityIds))
        uniqueLevelIdsStr = ', '.join(f"'{id}'" for id in list(uniqueLevelIds))
        uniqueFacilityIdsQuery = "facility_id IN " + "(" + uniqueFacilityIdsStr + ")"
        uniqueLevelIdsQuery = "levelid IN " + "(" + uniqueLevelIdsStr + ")"
        uniqueLevelIdsQuery1 = "level_id IN " + "(" + uniqueLevelIdsStr + ")"
        if self.isLegacyDataset:
            facilityLevelIndoorsFCQuery = uniqueFacilityIdsQuery + " AND " + uniqueLevelIdsQuery1  # indoors fc
        else:
            facilityLevelIndoorsFCQuery = uniqueLevelIdsQuery1  # indoors fc
        # Delete details features
        if indoorIdField == "detail_id":
            detailsLayer = "detailsLayer"
            arcpy.MakeFeatureLayer_management(indoorFC, detailsLayer)
            arcpy.management.SelectLayerByAttribute(detailsLayer, "NEW_SELECTION", facilityLevelIndoorsFCQuery, "NON_INVERT")
            #count = int(arcpy.GetCount_management(detailsLayer)[0])
            arcpy.management.DeleteFeatures(detailsLayer)
        return

    def getFeatureIds(self, indoorFC, out_fc, indoorIdField, outFCIdField):
        # out_fc = temp FC in scratch workspace
        '''
        indoorID, tempID
        Facility_ID, Facility_ID
        DETAIL_ID, IUID, LEVELID
        UNIT_ID, UNIT_ID, LEVELID
        '''

        indoorIdField = indoorIdField.lower()
        outFCIdField = outFCIdField.lower()
        # Get unique list of facility and level Ids
        uniqueFacilityIds = IndoorsUtilsModule.getUniqueValues(out_fc, IndoorsUtilsModule.SCRATCHWKS_FACILITYID)
        uniqueLevelIds = IndoorsUtilsModule.getUniqueValues(out_fc, IndoorsUtilsModule.SCRATCHWKS_LEVELID)
        existingIds = set()
        commonIds = set()
        missingIds = set()
        newlyCreatedIds = set()
        if (len(uniqueLevelIds)) > 0 :
            uniqueFacilityIdsStr = ', '.join(f"'{id}'" for id in list(uniqueFacilityIds))
            uniqueLevelIdsStr = ', '.join(f"'{id}'" for id in list(uniqueLevelIds))
            uniqueFacilityIdsQuery = "facility_id IN " + "(" + uniqueFacilityIdsStr + ")"
            uniqueLevelIdsQuery = "levelid IN " + "(" + uniqueLevelIdsStr + ")"
            facilityLevelProcessedTempQuery = uniqueFacilityIdsQuery + " AND " + uniqueLevelIdsQuery #out_fc
            uniqueLevelIdsQuery1 = "level_id IN " + "(" + uniqueLevelIdsStr + ")"
            if self.isLegacyDataset:
                facilityLevelIndoorsFCQuery = uniqueFacilityIdsQuery + " AND " + uniqueLevelIdsQuery1 #indoors fc
            else:
                facilityLevelIndoorsFCQuery = uniqueLevelIdsQuery1  # indoors fc

            # Get ID of existing FC - existingIds

            #with arcpy.da.SearchCursor(levelsFCPath, ["LEVEL_ID"], facilityLevelProcessedQuery) as cursor:  # check if facilityLevelQuery can be used
            with arcpy.da.SearchCursor(indoorFC, [indoorIdField], facilityLevelIndoorsFCQuery) as cursor:  # check if facilityLevelQuery can be used
                for row in cursor:
                    existingIds.add(row[0])
            if 'None' in existingIds:
                existingIds.remove('None')

            # Get ID of newly created FC - newIds
            newIds = set()
            with arcpy.da.SearchCursor(out_fc, [outFCIdField], facilityLevelProcessedTempQuery) as cursor:
                for row in cursor:
                    newIds.add(row[0])
            if 'None' in newIds:
                newIds.remove('None')
            # commonIds = existingIds.intersection(newIds) - need to maintain
            commonIds = existingIds.intersection(newIds)
            # missingIds = existingIds - newIds - remove these features
            missingIds = existingIds - newIds
            # newlyCreatedIds = newIds - existingIds - copy these features
            newlyCreatedIds = newIds - existingIds
        return existingIds, commonIds, missingIds, newlyCreatedIds

    def updateIndoorFeatureClass(self, uniqueIDFieldName, indoorFCPath, out_fc, existingIds, commonIds, missingIds, newlyCreatedIds, area_unit_type_value, isLevels=False):

        '''
        indoorID, tempID
        Facility_ID, Facility_ID
        DETAIL_ID, IUID, LEVELID
        UNIT_ID, UNIT_ID, LEVELID
        '''
        #indoorFeatures = self.createScratchTableForIndoorIds(out_fc)
        count = int(arcpy.GetCount_management(indoorFCPath)[0])

        # Step 1 - preprocess data
        # Preprocesing to deterime IDs of features to be updated, deleted, and created
        try:
            uniqueIDFieldName = uniqueIDFieldName.lower()
            descIndoorFC = arcpy.Describe(indoorFCPath)
            if self.onlineLayer:
                # descIndoorFC.name gives the index of layer as 1 or2, not the name which we need here
                indoorFCPathLayerName = indoorFCPath.split("\\")[-1]
            else:
                indoorFCPathLayerName = descIndoorFC.name

            descOutFC = arcpy.Describe(out_fc)
            outFCName = descOutFC.name

            indoorFieldsOrig = [field.name.lower() for field in arcpy.ListFields(indoorFCPath)]

            # Get unique ID in out_fc (For Levels it is LEVELID, and for other it is IUID)
            if isLevels: #will handle sde as well
                iuidFieldName = "levelid"
            else:
                iuidFieldName = "iuid"
            count = int(arcpy.GetCount_management(indoorFCPath)[0])

            # Check for SDE - does this name hold there
            indoorFCPathLayer = "indoorFCPathLayer"
            arcpy.MakeFeatureLayer_management(indoorFCPath, indoorFCPathLayer)
            outFCLayer = "outFCLayer"

            arcpy.MakeFeatureLayer_management(out_fc, outFCLayer)
            arcpy.management.AddJoin(indoorFCPathLayer, uniqueIDFieldName, outFCLayer, iuidFieldName, "KEEP_COMMON")
            countCommonFeatures = int(arcpy.GetCount_management(indoorFCPathLayer)[0])
            updateFeatures = True
            if countCommonFeatures == 0:
                updateFeatures = False
            # Step 2 - update
            count = int(arcpy.GetCount_management(indoorFCPathLayer)[0])
            updatedIDShape = defaultdict()

            if updateFeatures and len(existingIds) > 0:
                existingIdStr = ""
                for idx, idStr in enumerate(existingIds):
                    existingIdStr += "'" + idStr.replace("'", "''") + "'"
                    if idx < len(existingIds)-1:
                        existingIdStr += ", "
                existingIndoorLayer_wc = iuidFieldName + " IN " + "(" + existingIdStr + ")"
                f = [field.name for field in arcpy.ListFields(out_fc)]
                with arcpy.da.SearchCursor(out_fc, [iuidFieldName, "SHAPE@"],
                                           existingIndoorLayer_wc) as cursor:  # for out_fc, IUID is the unique ID field
                    for row in cursor:
                        updatedIDShape[row[0]] = row[1]

            # Step 1: update attributes
            indoorFields = [field.name.lower() for field in arcpy.ListFields(indoorFCPathLayer)]
            calcFieldParams = []
            # targetField = field to be updated in Indoor features
            oidFieldName = descIndoorFC.OIDFieldName.lower()
            shapeFieldName = descIndoorFC.shapeFieldName.lower()
            areaFieldName = descIndoorFC.areaFieldName.lower()
            lengthFieldName = descIndoorFC.lengthFieldName.lower()
            if uniqueIDFieldName == "unit_id": # implies that this is units fc
                xFields = [oidFieldName, shapeFieldName, areaFieldName, lengthFieldName, 'assignment_type',
                           'reservation_method', "area_id", "capacity", "schedule_email"]
            else:
                xFields = [oidFieldName, shapeFieldName, areaFieldName, lengthFieldName]
            # For online layer, layer name is auto-generated
            firstField = indoorFields[0]  # get the first field
            arr = firstField.split(".")
            if self.onlineLayer:
                layerNameUsedInJoin = arr[0] #this can be anything - not necessarily units, levels etc.
            else:
                layerNameUsedInJoin = indoorFCPathLayerName  # GIS.Units (SDE) or Units (FGDB)
            if uniqueIDFieldName == "unit_id":
                unitFCName = layerNameUsedInJoin  # this will be like units or gis.units or u3 (it is online)
            for targetField in indoorFields:
                arr = targetField.split(".")
                if self.onlineLayer:
                    layerName = arr[0]
                else:
                    if self.sdeQualifier:
                        layerName = arr[0] + "." + arr[1]
                    else:
                        layerName = arr[0]
                    # layerName = indoorFCPathLayerName
                if layerName.lower() == layerNameUsedInJoin.lower():
                    fieldName = arr[-1]
                    sourceFieldName = outFCName + "." + fieldName
                    if sourceFieldName.lower() in indoorFields and fieldName.lower() not in xFields:
                        if fieldName.lower() == uniqueIDFieldName.lower():
                            sourceFieldName = outFCName + "." + iuidFieldName
                        calcFieldParams.append([targetField, "!" + sourceFieldName + "!"])
            # Exceptions for cases where field name in indoors fc and temp fc do not match but should be mapped
            if uniqueIDFieldName == "unit_id":
                sourceFieldName = outFCName + "." + "UNIT_USE"
                targetField = layerNameUsedInJoin + "." + "use_type"
                calcFieldParams.append([targetField, "!" + sourceFieldName + "!"])
                if "area_net" in indoorFieldsOrig:
                    targetField = layerNameUsedInJoin + "." + "area_net"
                    calcFieldParams.append([targetField, "!" + outFCName + "." + area_unit_type_value + "!"])
                if "area_gross" in indoorFieldsOrig:
                    targetField = layerNameUsedInJoin + "." + "area_gross"
                    calcFieldParams.append([targetField, "!" + outFCName + "." + area_unit_type_value + "!"])

                # use IUID for UNIT_ID
                if (len(calcFieldParams)) > 0:
                    arcpy.CalculateFields_management(indoorFCPathLayer, "PYTHON3", calcFieldParams)
                # remove join
                try:
                    arcpy.RemoveJoin_management(indoorFCPathLayer)
                except:
                    pass  # there does not seem to be a reasonable way to do it if the layer is online

                # Step 3: update shape - separate process where we update shape
                # search cursor - create a dictionary {ID, shape} for out_fc
                # update cursor to update values in indoors fc
                # step 2: Update geometry
                if len(updatedIDShape) > 0:
                    with arcpy.da.UpdateCursor(indoorFCPathLayer, [uniqueIDFieldName, "SHAPE@"]) as updateRows:
                        for row in updateRows:
                            levelId = row[0]
                            if levelId in updatedIDShape:
                                newGeom = updatedIDShape[levelId]
                                row[1] = newGeom
                                updateRows.updateRow(row)
            arcpy.AddIDMessage("INFORMATIVE", 180528, countCommonFeatures, indoorFCPathLayerName)
            # end of block - if updateLevelFeatures:

            # Step 3 - delete
            # delete features that do not exist anymore
            missingList = list(missingIds)[:10]
            if len(missingIds) > 0:
                for id in missingList:
                    arcpy.AddIDMessage("INFORMATIVE", 180529, id)
                missingIdStr = ', '.join(f"'{id}'" for id in list(missingIds))
                indoorFCPathLayerDelete_wc = uniqueIDFieldName + " IN " + "(" + missingIdStr + ")"
                arcpy.MakeFeatureLayer_management(indoorFCPath, indoorFCPathLayer)
                arcpy.management.SelectLayerByAttribute(indoorFCPathLayer, "NEW_SELECTION", indoorFCPathLayerDelete_wc,
                                                        "NON_INVERT")
                arcpy.management.DeleteFeatures(indoorFCPathLayer)
                arcpy.AddIDMessage("INFORMATIVE", 180526, len(missingIds), indoorFCPathLayerName)
                #Create a new FC and write out all removed ids
                #self.writeIndoorFeatureIds(indoorFeatures, indoorFCPathLayerName, missingIds, "Removed")

            # Step 4
            # Copy features that are new
            if len(newlyCreatedIds) > 0:
                arcpy.AddIDMessage("INFORMATIVE", 180527, len(newlyCreatedIds), indoorFCPathLayerName)
                newlyCreatedIdsStr = ', '.join(f"'{id}'" for id in list(newlyCreatedIds))
                newId_wc = iuidFieldName + " IN " + "(" + newlyCreatedIdsStr + ")"  # notice the ID in out_fc is LEVELID (NOT LEVEL_ID)
                arcpy.management.SelectLayerByAttribute(outFCLayer, "NEW_SELECTION", newId_wc, "NON_INVERT")
            return outFCLayer
        except Exception as e:
            return ""

    def createScratchTableForIndoorIds(self, fcpath):
        try:
            if not fcpath or not arcpy.Exists(fcpath):
                return
            workspace = IndoorsUtilsModule.getWorkspacePath(fcpath)
            indoorFeatures = os.path.join(workspace, "IndoorFeatures")
            if not arcpy.Exists(indoorFeatures):
                arcpy.management.CreateTable(workspace, "IndoorFeatures", None)
            arcpy.management.AddField(indoorFeatures, "INDOOR_FEATURES", "TEXT", None, None, 100, "Indoor Features", "NULLABLE", "NON_REQUIRED", '')
            arcpy.management.AddField(indoorFeatures, "UNIQUE_ID", "TEXT", None, None, 100, "Unique ID", "NULLABLE", "NON_REQUIRED", '')
            arcpy.management.AddField(indoorFeatures, "STATUS", "TEXT", None, None, 20, "Status", "NULLABLE", "NON_REQUIRED", '')
            return indoorFeatures
        except:
            return ""

    def writeIndoorFeatureIds(self, indoorFeatures, fcName, featureIds, status):
        #status = removed, updated, new
        try:
            if not indoorFeatures or not arcpy.Exists(indoorFeatures) or len(featureIds) == 0:
                return
            with arcpy.da.InsertCursor(indoorFeatures, ["INDOOR_FEATURES", "UNIQUE_ID", "STATUS"]) as cursor:
                for id in featureIds:
                    cursor.insertRow([fcName, str(id), status])
            return True
        except:
            return False

    def calculateField(self, layer, sourceFieldName, targetFieldName):
        try:
            arcpy.management.CalculateField(layer, sourceFieldName, "!" + targetFieldName + "!", "PYTHON3")
            return True
        except:
            return False

    def checkullValuesInExcelSheet(self, floormatrix, sheetColumnList, sheetName):
        isValueNull = False
        if sheetName == "LevelPropertiesSheet":
            columns = [x[0].upper() for x in sheetColumnList]
            sheet_fields = ["NAME", "LEVEL_NUMBER", "VERTICAL_ORDER", "ELEVATION_RELATIVE", "HEIGHT_RELATIVE", "CLOSE_DOORS"]
            for idx, row in enumerate(floormatrix):
                for idy, col in enumerate(row):
                    colname = columns[idy]
                    if colname in sheet_fields and str(floormatrix[idx][idy]) == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, colname, sheetName)
                        isValueNull = True

        if sheetName == "SourcePathPropertiesSheet":
            columns = [x.upper() for x in sheetColumnList]
            sheet_fields = ["SOURCE_PATH", "LEVEL_ID"]
            for idx, row in enumerate(floormatrix):
                for idy, col in enumerate(row):
                    colname = columns[idy]
                    if colname == "SOURCE_PATH":
                        sourcePath = str(floormatrix[idx][idy])
                        if str(floormatrix[idx][idy]) == "nan" or not arcpy.Exists(sourcePath):
                            levelid = floormatrix[idx][1]
                            arcpy.AddIDMessage("WARNING", 180159, levelid, "SOURCE_PATH")
                            isValueNull = False
                    if colname == "LEVEL_ID" and str(floormatrix[idx][idy]) == "nan":
                        arcpy.AddIDMessage("ERROR", 180135, colname, sheetName)
                        isValueNull = True
        return isValueNull

    def handleNullValuesInExcel(self, floormatrix, sheetColumnList, sheetName):
        #These fields are not required in the latest data model
        # {index of column:column name} in excel sheet
        columns = [x[0].upper() for x in sheetColumnList]
        numericFields = []
        if sheetName == "LevelPropertiesSheet":
            idx1 = columns.index('ELEVATION_RELATIVE') if 'ELEVATION_RELATIVE' in columns  else -1
            idx2 = columns.index('ELEVATION_ABSOLUTE') if 'ELEVATION_ABSOLUTE' in columns  else -1
            idx3 = columns.index('HEIGHT_RELATIVE') if 'HEIGHT_RELATIVE' in columns  else -1
            idx4 = columns.index('HEIGHT_ABSOLUTE') if 'HEIGHT_ABSOLUTE' in columns  else -1
            numericFields = [idx1, idx2, idx3, idx4]
        elif sheetName == "FacilityPropertiesSheet":
            idx1 = columns.index('FACILITY_NUMBER') if 'FACILITY_NUMBER' in columns  else -1
            idx2 = columns.index('LEVELS_TOTAL') if 'LEVELS_TOTAL' in columns  else -1
            idx3 = columns.index('ELEVATION_RELATIVE') if 'ELEVATION_RELATIVE' in columns else -1 #assign default value of zero
            numericFields = [idx1, idx2,idx3]
        if len(numericFields) == 0: return #will happen if sheetname is not either of tho above

        for idx, row in enumerate(floormatrix):
            for idy, col in enumerate(row):
                if idy in numericFields and math.isnan(col):
                    # any value is fine, we are not using them. if these are not handled, numpy will fail later.
                    floormatrix[idx][idy] = 0.0

    def calculateFacilityArea(self, indoors_gdb):
        try:
            fields = ["FACILITY_ID", "AREA_NET", "AREA_GROSS"]
            #sdeQualifier = IndoorsUtilsModule.getSDEQualifier(indoors_gdb)
            sdeQualifier = self.sdeQualifier
            facilityPath = os.path.join(os.path.join(indoors_gdb, sdeQualifier + IndoorsUtilsModule.INDOORAIIMDATASETNAME), sdeQualifier + "Facilities")
            levelsPath = os.path.join(os.path.join(indoors_gdb, sdeQualifier + IndoorsUtilsModule.INDOORAIIMDATASETNAME), sdeQualifier + "Levels")
            with arcpy.da.UpdateCursor(facilityPath, fields) as facilityCursor:
                for facilityRow in facilityCursor:
                    facilityID = facilityRow[0]
                    #Select levels for this facility, and sum up the area_net and area_gross
                    whereClause = "FACILITY_ID = '" + facilityID + "'"
                    sumAreaNet = sumAreaGross = 0
                    with arcpy.da.SearchCursor(levelsPath, fields, whereClause) as levelCursor:
                        for levelRow in levelCursor:
                            sumAreaNet += levelRow[1]
                            sumAreaGross += levelRow[2]
                    facilityRow[1] = sumAreaNet
                    facilityRow[2] = sumAreaGross
                    facilityCursor.updateRow(facilityRow)
        except Exception:
            return None

if __name__ == '__main__':
    ImportFloorplansToIndoorsGDB()
