# -*- coding: utf-8 -*-
from __future__ import print_function
import arcpy
import os
import IndoorsUtilsModule
import uuid


class LicenseError(Exception):
    pass


def ERROR(self):
    pass


class CreatePeoplePoints(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""

        # Constants: error handling
        self.NON_GP = "non-gp"
        self.ERROR = "error"
        self.WARNING = "warning"
        self.Facilities = "Facilities"
        self.Facilities_F8_FACILITYID = "FACILITY_ID"
        self.units_base_elevation = "ELEVATION_RELATIVE"
        self.people_pointx = 'POINT_X'
        self.people_pointy = 'POINT_Y'
        self.assignment_type = "ASSIGNMENT_TYPE"
        self.assignment_type_value = "office"
        self.unit_id = "UNIT_ID"
        self.area_id = "AREA_ID"
        self.EMAIL = "EMAIL"
        self.KNOWNAS = "KNOWNAS"
        self.NAME = "NAME"
        self.UNIT_NAME = "UNIT_NAME"
        self.CONTACT_PHONE = "CONTACT_PHONE"
        self.CONTACT_EXTENSION = "CONTACT_EXTENSION"
        self.UNIT_NAME_ALIAS = "Unit Name"
        self.unit_id_alias = "Unit ID"
        self.level_id = "LEVEL_ID"
        self.level_id_alias = "Level ID"
        self.xFields = ["ACCESS_TYPE", "USE_TYPE", "IMAGE_URL","CONTACT_EMAIL", "CONTACT_EXTENSION", "CONTACT_NAME",
                   "CONTACT_PHONE", "CONTACT_URL", "CAPACITY", "UTILIZATION", "AREA_GROSS", "AREA_NET", "AREA_UM",
                   "SOURCE_NAME", "SOURCE_PATH", "SOURCE_TYPE", "SOURCE_METHOD"]

        self.unit_fields_include_Legacy = ["UNIT_ID", "NAME", "NAME_LONG", "NAME_SUBTITLE", "DESCRIPTION", "SITE_ID", "SITE_NAME",
                            "FACILITY_ID", "FACILITY_NAME", "LEVEL_ID", "LEVEL_NAME", "LEVEL_NUMBER", "SECTION_ID",
                            "SECTION_NAME", "ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "HEIGHT_ABSOLUTE",
                            "HEIGHT_RELATIVE", "VERTICAL_ORDER", "AREA_ID"]

        self.unit_fields_include_Latest = ['UNIT_ID', 'USE_TYPE', 'NAME', 'NAME_LONG', 'LEVEL_ID', 'AREA_GROSS', 'HEIGHT_RELATIVE']

        self.execute()

    def execute(self):
        env_workspace = arcpy.env.workspace
        try:
            # You must have an Advanced License to run this tool.
            minimum_advanced_license = ["ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_advanced_license:
                raise LicenseError

            parameters = arcpy.GetParameterInfo()
            room_fc = parameters[0].value
            indoors_gdb = self.getWorkspace(room_fc)
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(indoors_gdb)
            room_fc_join_field = parameters[1].valueAsText
            if room_fc_join_field.upper() == 'SHAPE':
                arcpy.AddIDMessage("ERROR", 180226)
                return
            employee_table = parameters[2].value
            employee_table_join_field = parameters[3].valueAsText
            people_fc = parameters[4].valueAsText
            room_desc = arcpy.Describe(room_fc)
            emp_desc = arcpy.Describe(employee_table)

            feat_count = int(arcpy.GetCount_management(room_fc).getOutput(0))
            if feat_count == 0:
                arcpy.AddIDMessage ("ERROR", 590, room_fc)
                return
            feat_count = int(arcpy.GetCount_management(employee_table).getOutput(0))
            if feat_count == 0:
                arcpy.AddIDMessage("ERROR", 590, employee_table)
                return

            if arcpy.Exists(people_fc):
                try:
                    arcpy.management.Delete(people_fc)
                except:
                    arcpy.AddIDMessage("ERROR", 180227, people_fc)
                    return

            indoors_gdb = IndoorsUtilsModule.getWorkspacePath(room_fc)
            databaseProperties = IndoorsUtilsModule.getDatabaseProperties(indoors_gdb)
            self.isLegacyDataset = databaseProperties["isLegacyDataset"]
            self.indoorsDatasetName = databaseProperties["indoorsDatasetName"]
            self.sdeQualifier = databaseProperties["sdeQualifier"]

            if self.isLegacyDataset:
                self.unit_fields_include = self.unit_fields_include_Legacy
            else:
                self.unit_fields_include = self.unit_fields_include_Latest

            #Get paths to room_fc and employee_table
            desc_room_fc = arcpy.Describe(room_fc)
            room_fc = os.path.join(desc_room_fc.path, desc_room_fc.name)
            desc_employee_table = arcpy.Describe(employee_table)
            employee_table = os.path.join(desc_employee_table.path, desc_employee_table.name)
            self.createPeoplePointsFC(room_fc, room_fc_join_field, employee_table, employee_table_join_field, people_fc)
        except LicenseError:
            # You must have an Advanced License to run this tool.
            arcpy.AddIDMessage("ERROR", 180002)
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
        finally:
            arcpy.CheckInExtension("Indoors")
            arcpy.env.workspace = env_workspace
        return

    def createPeoplePointsFC(self, unit_feature_class_original, room_fc_join_field, emp_table_original, employee_table_join_field, output_fc):

        try:
            arcpy.env.overwriteOutput = True
            # This will ensure that the field names do not look like featureclassname_fieldname. They will retain original field names.
            arcpy.env.qualifiedFieldNames = False

            #Save the name
            output_fc_initial = output_fc

            #We need to ensure that all temp work is done in scratch GDB
            uniqueFolder = str(uuid.uuid4()).replace("-", "")
            workingFolder = os.path.join(arcpy.env.scratchFolder, uniqueFolder)
            os.mkdir(workingFolder)
            arcpy.management.CreateFileGDB(workingFolder, "CPP")
            scratchGDB = os.path.join(workingFolder, "CPP.gdb")
            unit_name = arcpy.Describe(unit_feature_class_original).name
            unit_list = unit_name.split(".")
            if len(unit_list) > 1: #enterprise database
                unit_shortname = unit_list[-1]
            else:
                unit_shortname = unit_name
            unit_feature_class = os.path.join(scratchGDB, unit_shortname)
            arcpy.CopyFeatures_management(unit_feature_class_original, unit_feature_class)

            #Units

            fields = arcpy.ListFields(unit_feature_class)
            field_names = [field.name.upper() for field in fields]
            for field_name in self.unit_fields_include:
                if field_name.upper() not in field_names:
                    arcpy.AddIDMessage("ERROR", 180309, field_name, unit_feature_class_original)
                    return

            # Employee table
            isExcel = False
            emp_desc = arcpy.Describe(emp_table_original)
            path = emp_desc.path
            if (str(path[-4:]).lower() == "xlsx") or (str(path[-3:]).lower() == "xls"):
                isExcel = True
            if isExcel:
                excel_file = emp_desc.path  #C:\Indoors\Network Sample AIIM GDBs\EMPLOYEEINFO_BuildingL.XLSX
                excel_spreadsheet = emp_desc.name[:-1]  #EMPLOYEEINFO_BuildingL$
                ex = excel_spreadsheet.split(".")
                if len(ex) > 1: #this is happening because we are getting the name of the excel sheet as main.sheet1$ instead of sheet1$ - is it a bug??
                    excel_spreadsheet = ex[1]
                emp_table = os.path.join(scratchGDB, "Employee")
                arcpy.ExcelToTable_conversion(excel_file, emp_table, excel_spreadsheet)

                #Calc field for join field = blank. BUG in ExcelToTable tool - workaround. Shows as NULL in table view but as empty string when converted to table.
                emp_view = "EmpTableView"
                arcpy.MakeTableView_management(emp_table, emp_view)
                wc_emp = employee_table_join_field + " = ''"
                arcpy.management.SelectLayerByAttribute(emp_view, "NEW_SELECTION", wc_emp)
                featureCount = arcpy.GetCount_management(emp_view)
                arcpy.CalculateField_management(emp_view, employee_table_join_field, "None", "PYTHON3")
                arcpy.management.SelectLayerByAttribute(emp_view, "CLEAR_SELECTION")
            else:
                emp_name = arcpy.Describe(emp_table_original).name
                emp_list = emp_name.split(".")
                if len(emp_list) > 1:
                    emp_shortname = emp_list[-1]
                else:
                    emp_shortname = emp_name
                emp_table = os.path.join(scratchGDB, emp_shortname)
                if arcpy.Exists(emp_table):
                    arcpy.Delete_management(emp_table)
                arcpy.CopyRows_management(emp_table_original, emp_table)

            #Ensure field alias in employee table title case
            self.fixFieldNamesEmployeeTable(emp_table)

            emp_field_list = [field.name for field in arcpy.Describe(emp_table).fields]
            emp_field_list_upper = [field.name.upper() for field in arcpy.Describe(emp_table).fields]
            if self.EMAIL not in emp_field_list_upper or self.KNOWNAS not in emp_field_list_upper:
                arcpy.AddIDMessage("ERROR", 180228, emp_table_original)
                return
            if self.CONTACT_PHONE not in emp_field_list_upper or self.CONTACT_EXTENSION not in emp_field_list_upper:
                arcpy.AddIDMessage("WARNING", 180229, emp_table_original)

            #Join Units and Employee table
            units_points = os.path.join(scratchGDB,"units_points")
            arcpy.FeatureToPoint_management(unit_feature_class, units_points, "INSIDE")

            #Find out if the field type is String. If they are not, do not turn them into upper case.
            emp_join_fieldtype_String = False
            unit_join_fieldtype_String = False
            field_list = [field for field in arcpy.Describe(emp_table).fields]
            for field in field_list:
                if field.name.upper() == employee_table_join_field.upper():
                    if field.type == 'String':
                        emp_join_fieldtype_String = True
                        break
            field_list = [field for field in arcpy.Describe(units_points).fields]
            field_list_units = [field.name.upper() for field in arcpy.Describe(units_points).fields]
            for field in field_list:
                if field.name.upper() == room_fc_join_field.upper():
                    if field.type == 'String':
                        unit_join_fieldtype_String = True
                        break

            #xFields = fields to delete from units_points. Exclude objectid, shape, and join field if type is int
            xFields = []
            unit_fields_for_occupants = ['UNIT_ID', 'LEVEL_ID', "NAME"]
            for field in arcpy.ListFields(units_points):
                if field.name.upper() not in unit_fields_for_occupants:
                    xFields.append(field.name)
            oid_fieldname = arcpy.Describe(units_points).OIDFieldName
            shp_field = arcpy.Describe(units_points).shapefieldname
            xFields.remove(oid_fieldname)
            xFields.remove(shp_field)
            if not emp_join_fieldtype_String: #do not delete form units_points, if join field is int etc. For string, we generate special field to handle cases.
                if room_fc_join_field in xFields:
                    xFields.remove(room_fc_join_field)

            #Copy field
            unit_temp_join_field = "UIDUPPER"
            emp_temp_join_field = "LOCATIONUPPER"
            arcpy.management.AddField(emp_table, emp_temp_join_field, "TEXT", None, None, None, None, "NULLABLE", "NON_REQUIRED", None)
            arcpy.management.AddField(units_points, unit_temp_join_field, "TEXT", None, None, None, None, "NULLABLE", "NON_REQUIRED", None)
            if emp_join_fieldtype_String:
                arcpy.management.CalculateField(emp_table, emp_temp_join_field, "!" + employee_table_join_field + "!.upper()", "PYTHON3", None)
            if unit_join_fieldtype_String:
                arcpy.management.CalculateField(units_points, unit_temp_join_field,"!" + room_fc_join_field + "!.upper()", "PYTHON3", None)

            #"Units.UID = Employee.LOCATION"
            unit_desc = arcpy.Describe(units_points)
            emp_desc = arcpy.Describe(emp_table)
            units_workspace = self.getWorkspace(units_points)
            emp_workspace = self.getWorkspace(emp_table)
            if units_workspace != emp_workspace:
                arcpy.AddIDMessage("ERROR", 180230)
                return
            if unit_join_fieldtype_String:
                wc = unit_desc.name + "." + unit_temp_join_field + " = " + emp_desc.name + "." + emp_temp_join_field
            else:
                wc = unit_desc.name + "." + room_fc_join_field + " = " + emp_desc.name + "." + employee_table_join_field

            #Remove fields not needed for people points
            try:
                arcpy.management.DeleteField(units_points, xFields)
            except:
                pass

            tablelist = [units_points,emp_table]
            units_points_layer = "units_points_layer"
            arcpy.management.MakeQueryTable(tablelist, units_points_layer, "ADD_VIRTUAL_KEY_FIELD", None, None,wc)

            emp_count = int(arcpy.GetCount_management(emp_table).getOutput(0))
            if int(emp_count) == 0:
                arcpy.AddIDMessage("WARNING", 180231)
                #return
            else:
                arcpy.AddIDMessage("INFORMATIVE", 180238, emp_count)

            feat_count = int(arcpy.GetCount_management(units_points_layer).getOutput(0))
            if int(feat_count) == 0:
                arcpy.AddIDMessage("WARNING", 180231)
                #return
            else:
                arcpy.AddIDMessage("INFORMATIVE", 180232)

            #Create a temp output fc and copy it to the output FC named on the UI
            occupant_fc = os.path.join(scratchGDB, "occupant_fc")
            output_fc = occupant_fc #Create features in this FC and at the end copy it to the output_fc_initial
            arcpy.CopyFeatures_management(units_points_layer, output_fc)

            #If UNIT_ID field exists in input table, delete it after the creation of query table. Otherwise, it will create a problem with APPEND operation later.
            empTableFieldnames = [field.name.upper() for field in  arcpy.ListFields(emp_table)]
            if "UNIT_ID" in empTableFieldnames:
                unitptFieldnames = [field.name.upper() for field in arcpy.ListFields(output_fc)]
                for fieldname in reversed(unitptFieldnames):
                    if "UNIT_ID" in fieldname.upper():
                        arcpy.management.DeleteField(output_fc, [fieldname])
                        break


            #rename 'NAME': 'UNIT_NAME'
            #make sure LEVEL_ID, UNIT_ID and UNIT NAME fields are nullable. alter field will not alter existing fields to be nullable if they have data
            field_names = [x.name.lower() for x in arcpy.ListFields(output_fc)]
            if self.UNIT_NAME.lower() not in field_names:
                #arcpy.AlterField_management(output_fc, self.NAME, self.UNIT_NAME, self.UNIT_NAME_ALIAS, "Text", 100, "NULLABLE")
                arcpy.management.AddField(output_fc, self.UNIT_NAME, "TEXT", None, None, 100, self.UNIT_NAME_ALIAS, "NULLABLE", "NON_REQUIRED", '')
                arcpy.management.CalculateField(output_fc, self.UNIT_NAME, "!NAME!", "PYTHON3", '', "TEXT", "NO_ENFORCE_DOMAINS")
                arcpy.management.DeleteField(output_fc, ["NAME"])


            if self.unit_id.lower() in field_names:
                arcpy.AlterField_management(output_fc, self.unit_id, "unit_id_temp", "unit_id_temp")
                arcpy.management.AddField(output_fc, self.unit_id, "TEXT", None, None, 255, self.unit_id_alias, "NULLABLE", "NON_REQUIRED",'')
                arcpy.management.CalculateField(output_fc, self.unit_id, "!unit_id_temp!", "PYTHON3", '', "TEXT", "NO_ENFORCE_DOMAINS")
                arcpy.management.DeleteField(output_fc, ["unit_id_temp"])

            if self.level_id.lower() in field_names:
                arcpy.AlterField_management(output_fc, self.level_id, "level_id_temp", "level_id_temp")
                arcpy.management.AddField(output_fc, self.level_id, "TEXT", None, None, 255, self.level_id_alias, "NULLABLE", "NON_REQUIRED", '')
                arcpy.management.CalculateField(output_fc, self.level_id, "!level_id_temp!", "PYTHON3", '', "TEXT", "NO_ENFORCE_DOMAINS")
                arcpy.management.DeleteField(output_fc, ["level_id_temp"])

            self.addFields(output_fc)

            arcpy.management.DeleteField(output_fc,[unit_temp_join_field, emp_temp_join_field,
                                                    'ORIG_FID', 'OBJECTID_1', 'OBJECTID_12'])
            unit_ids = []
            unit_fields = ["SHAPE@Z", self.unit_id, self.area_id, "LEVEL_ID"]

            #Get elevation fo occupants
            levelid_elevation  = self.getElevationFromUnitsFeatures(unit_feature_class_original)

            with arcpy.da.UpdateCursor(output_fc, unit_fields) as update:
                for row in update:
                    elevation = levelid_elevation[row[3]]
                    row[0] = elevation
                    unit_ids.append(row[1])
                    row[2] = None
                    update.updateRow(row)

            if self.assignment_type in field_list_units:
                assignment_fields = [self.assignment_type, self.unit_id, self.area_id]
                assignment_fields = [fieldname.lower() for fieldname in assignment_fields]
                with arcpy.da.UpdateCursor(unit_feature_class_original, assignment_fields) as update:
                    for row in update:
                        unitid = row[1]
                        if unitid in unit_ids:
                            row[0] = self.assignment_type_value
                            row[2] = None
                            update.updateRow(row)
            else:
                arcpy.AddIDMessage("WARNING", 180236)

            #Get list of employee join field values from output people points
            people_points = []
            with arcpy.da.SearchCursor(output_fc, [employee_table_join_field]) as cursor:
                for row in cursor:
                    people_points.append(row[0])

            #Report people that could not be matched with unit spaces
            #emp_list = []
            emp_oid_list = []
            #emp_oid_null_list = []
            unmatched_newgeom_oids = [] #join field val is None in emp_table
            count = 0
            with arcpy.da.SearchCursor(emp_table, ['OID@', employee_table_join_field, self.EMAIL, self.KNOWNAS]) as emp_cursor:
                for row in emp_cursor:
                    oid_val = row[0]
                    join_field_val = row[1]
                    if join_field_val is not None and join_field_val !="": #non-null
                        if join_field_val not in people_points: #non-NULL and non-matching
                            count = count + 1
                            emp_oid_list.append([join_field_val, row[2], row[3]])
                            if count < 10:
                                arcpy.AddIDMessage("WARNING", 180233, employee_table_join_field + ": " + str(join_field_val) + " EMAIL: " + str(row[2]) + " KNOWNAS: " + str(row[3]))
                    else:
                        #join field val is null, so create an empty feature
                        unmatched_newgeom_oids.append(oid_val)  # create empty geometry

            # Add unmatched occupants and assign zero geometry to them
            self.addUnmatchedOccupants(emp_table, output_fc, unmatched_newgeom_oids)
            #If emp table join field value is not null, raise warning and report it
            if len(emp_oid_list) > 0:
                arcpy.management.CreateTable(arcpy.env.scratchGDB, "Unmatched_Occupants", None, None)
                emp_table_scratch = os.path.join(arcpy.env.scratchGDB, "Unmatched_Occupants")
                arcpy.AddField_management(emp_table_scratch, employee_table_join_field, 'TEXT')
                arcpy.AddField_management(emp_table_scratch, self.EMAIL, 'TEXT')
                arcpy.AddField_management(emp_table_scratch, self.KNOWNAS, 'TEXT')
                with arcpy.da.InsertCursor(emp_table_scratch, [employee_table_join_field, self.EMAIL, self.KNOWNAS]) as cursor:
                    for item in emp_oid_list:
                       cursor.insertRow([str(item[0]), item[1], item[2]])
                arcpy.AddIDMessage("WARNING", 180235, emp_table_scratch)

            occupant_fields = arcpy.ListFields(emp_table_original)
            occupant_field_names = [field.name.upper() for field in occupant_fields]

            # Add SITE_ID field to output FC
            self.addSiteIDFieldtoOutputFC(output_fc)

            fieldType = ""
            if "TEAM" in occupant_field_names and "ORG_LEVEL_1" in occupant_field_names:
                arcpy.AddIDMessage("WARNING", 180239)
            elif "TEAM" in occupant_field_names and "ORG_LEVEL_1" not in occupant_field_names:
                for field in occupant_fields:
                    if field.name.upper() == "TEAM":
                        fieldType = field.type
                        break
                if fieldType != "" and fieldType == "String":
                    arcpy.CalculateField_management(output_fc, "ORG_LEVEL_1", "!" + "TEAM" + "!", "PYTHON3")

            if "DEPARTMENT" in occupant_field_names and "ORG_LEVEL_2" in occupant_field_names:
                arcpy.AddIDMessage("WARNING", 180240)
            elif "DEPARTMENT" in occupant_field_names and "ORG_LEVEL_2" not in occupant_field_names:
                for field in occupant_fields:
                    if field.name.upper() == "DEPARTMENT":
                        fieldType = field.type
                        break
                if fieldType != "" and fieldType == "String":
                    arcpy.CalculateField_management(output_fc, "ORG_LEVEL_2", "!" + "DEPARTMENT" + "!", "PYTHON3")

            # Applicable to latest data model for SITE_ID and SITE_NAME. In legacy data model,units has these two fields
            # For assigned occupants, the output's SITE_ID field shall be populated based on lookup of the assigned Unit's LEVEL_ID > Level's FACILITY_ID > Facility's SITE_ID.
            #unit's level_id -> site_Id
            outputFieldnames = [field.name.upper() for field in  arcpy.ListFields(output_fc)]
            if "SITE_NAME" in outputFieldnames:
                outputFields = ["UNIT_ID", "LEVEL_ID", "SITE_ID", "SITE_NAME"]
            else:
                outputFields = ["UNIT_ID", "LEVEL_ID", "SITE_ID"]
            siteNameSiteIdDict = self.getSiteNameID(unit_feature_class_original)
            levelidSiteDict = self.unitLevelIDToSiteID(unit_feature_class_original)
            with arcpy.da.UpdateCursor(output_fc, outputFields) as cursor:
                for row in cursor:
                    unitid = row[0]
                    levelid = row[1]
                    if unitid:
                        #assigned occupants
                        if levelid and levelid in levelidSiteDict.keys():
                            siteid = levelidSiteDict[levelid]
                            row[2] = siteid
                            cursor.updateRow(row)
                    else:
                        #For unassigned occupants, the output's SITE_ID field shall be populated based on lookup of the input table's SITE_NAME > Sites > SITE_ID.
                        if "SITE_NAME" in outputFields and len(siteNameSiteIdDict) > 0:
                            sitename = row[3]
                            if sitename and sitename in siteNameSiteIdDict.keys():
                                siteid = siteNameSiteIdDict[sitename]
                                row[2] = siteid
                                cursor.updateRow(row)

            #If SITE_NAME field exists in output fc with latest data model, delete it
            if not self.isLegacyDataset and "SITE_NAME" in outputFieldnames:
                arcpy.management.DeleteField(output_fc, ["SITE_NAME"])
            else:
                #Legacy database and the input table has site_name. Loop in reverse to get field name like SITE_NAME_1 which is SITE_NAME from input table
                if "SITE_NAME" in empTableFieldnames:
                    for fieldname in reversed(outputFieldnames):
                        if "SITE_NAME" in fieldname.upper():
                            arcpy.management.DeleteField(output_fc, [fieldname])
                            break

            #FInally, once the output fc is created, copy features to output fc named on the UI
            arcpy.CopyFeatures_management(output_fc, output_fc_initial)

            feat_count = int(arcpy.GetCount_management(output_fc_initial).getOutput(0))
            arcpy.AddIDMessage("INFORMATIVE", 180237, feat_count)
            #remove temporary feature class
            arcpy.Delete_management(units_points)

        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
        return


    def getElevationFromUnitsFeatures(self, units_fc):
        try:
            # Get levelID, relative elevation from levels feature class
            levelidElevation = {}
            for row in arcpy.da.SearchCursor(units_fc, ["OID@", "SHAPE@", "LEVEL_ID"]):
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

    def unitLevelIDToSiteID(self, unitsFC):
        if not unitsFC:
            return None
        # Get workspace
        indoors_gdb = self.getWorkspace(unitsFC)
        ds = self.indoorsDatasetName
        sdeQualifier = self.sdeQualifier
        facilities_fc = os.path.join(indoors_gdb, sdeQualifier + ds, sdeQualifier + "facilities")
        levels_fc = os.path.join(indoors_gdb, sdeQualifier + ds, sdeQualifier + "levels")

        levelidFacilityid = self.createDictionary(levels_fc, "level_id", "facility_id")
        facilityidSiteid = self.createDictionary(facilities_fc, "facility_id", "site_id")
        levelidSiteidDict = {}
        for item in levelidFacilityid.items():
            levelid = item[0]
            facilityid = item[1]
            siteid = facilityidSiteid[facilityid]
            levelidSiteidDict[levelid] = siteid
        return levelidSiteidDict

    def createDictionary(self, fc, keyField, valueField):
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


    def getSiteNameID(self, unitsFC):
        try:
            if not unitsFC:
                return {}
            # Get workspace
            indoors_gdb = self.getWorkspace(unitsFC)
            ds = self.indoorsDatasetName
            sdeQualifier = self.sdeQualifier
            if self.isLegacyDataset:
                fc = os.path.join(indoors_gdb, sdeQualifier + ds, sdeQualifier + "facilities")
                fields = ["SITE_ID", "SITE_NAME"]
            else:
                fc = os.path.join(indoors_gdb, sdeQualifier + ds, sdeQualifier + "sites")
                fields = ["SITE_ID", "NAME"]
            fields = [fieldname.lower() for fieldname in fields]
            siteNameID = {}
            with arcpy.da.SearchCursor(fc, fields) as cursor:
                for row in cursor:
                    if row[0]:
                        siteNameID[row[1]] = row[0]
            return siteNameID
        except:
            return {}

    def addSiteIDFieldtoOutputFC(self, output_fc):
        outputFeatureFields = arcpy.ListFields(output_fc)
        outputFieldNames = [field.name.upper() for field in outputFeatureFields]
        if "SITE_ID" not in outputFieldNames:
            arcpy.AddField_management(output_fc, "SITE_ID", 'TEXT', None, None, None, "SITE ID")

    def addUnmatchedOccupants(self, emp_table, output_fc, unmatched_oids):
        try:
            if not emp_table or not output_fc or len(unmatched_oids) == 0:
                return
            # Add unmatched people to occupant feature class
            emp_fields = arcpy.ListFields(emp_table)
            emp_field_names = [field.name for field in emp_fields if field.name.upper() not in ["LOCATIONUPPER", "OBJECTID_1", "OBJECTID_12"]]

            with arcpy.da.InsertCursor(output_fc, ["SHAPE@"] + emp_field_names) as people_cursor:
                whereclause = "OBJECTID IN (" + ",".join([str(oid) for oid in unmatched_oids]) + ")"
                new_oids = []
                with arcpy.da.SearchCursor(emp_table, emp_field_names, whereclause) as emp_cursor:
                    for row in emp_cursor:
                        field_vals = []
                        for field_name in emp_field_names:
                            field_vals.append(row[emp_field_names.index(field_name)])
                        geom = arcpy.Point(0, 0, 0)
                        field_vals = [geom] + field_vals
                        newoid = people_cursor.insertRow(field_vals)
                        new_oids.append(newoid)
            return
        except:
            return


    def getWorkspace(self, room_fc):
        if not room_fc: return
        dirname = os.path.dirname(arcpy.Describe(room_fc).catalogPath)
        desc = arcpy.Describe(dirname)
        if hasattr(desc, "datasetType") and desc.datasetType == 'FeatureDataset':
            dirname = os.path.dirname(dirname)
        return dirname

    def addFields(self, output_fc):
        fields = arcpy.ListFields(output_fc)
        field_names = [field.name.upper() for field in fields]
        if "AREA_ID" not in field_names:
            arcpy.AddField_management(output_fc, "AREA_ID", 'TEXT', None, None, None, "Area ID")
        else:
            arcpy.management.AlterField(output_fc, "AREA_ID", "AREA_ID", "Area ID")
        if "ORG_LEVEL_1" not in field_names:
            arcpy.AddField_management(output_fc, "ORG_LEVEL_1", 'TEXT', None, None, None, "Team")
        else:
            arcpy.management.AlterField(output_fc, "ORG_LEVEL_1", "ORG_LEVEL_1", "Team")
        if "ORG_LEVEL_2" not in field_names:
            arcpy.AddField_management(output_fc, "ORG_LEVEL_2", 'TEXT', None, None, None, "Department")
        else:
            arcpy.management.AlterField(output_fc, "ORG_LEVEL_2", "ORG_LEVEL_2", "Department")
        if "JOB_TITLE" not in field_names:
            arcpy.AddField_management(output_fc, "JOB_TITLE", 'TEXT', None, None, None, "Job Title")
        else:
            arcpy.management.AlterField(output_fc, "JOB_TITLE", "JOB_TITLE", "Job Title")
        if "START_DATE" not in field_names:
            arcpy.AddField_management(output_fc, "START_DATE", 'DATE', None, None, None, "Start Date")
        else:
            arcpy.management.AlterField(output_fc, "START_DATE", "START_DATE", "Start Date")

    def fixFieldNamesEmployeeTable(self, emp_table):
        try:
            emp_fields = [field for field in arcpy.Describe(emp_table).fields]
            for field in emp_fields:
                if field.type != "OID":
                    alias = field.aliasName
                    s = alias.split("_")
                    title_case_alias = s[0].title()
                    for item in s[1:]:
                        if (item != "ID"): #do not turn ID to Id
                            title_case_alias = title_case_alias + " " + item.title()
                        else:
                            title_case_alias = title_case_alias + " " + item
                    arcpy.management.AlterField(emp_table, field.name, field.name, title_case_alias)
        except Exception as e:
            return

if __name__ == '__main__':
    CreatePeoplePoints()