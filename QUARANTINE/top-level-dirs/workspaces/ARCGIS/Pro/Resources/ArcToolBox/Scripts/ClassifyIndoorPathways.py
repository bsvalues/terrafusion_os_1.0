# -*- coding: utf-8 -*-
from __future__ import print_function
import arcpy
import os
import IndoorsUtilsModule
import uuid

def ERROR(self):
    pass

class LicenseError(Exception):
    pass

class ClassifyIndoorsPathways(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.AIIMFDS = "Indoors"
        self.FDS = "Network"
        self.PREFDS = "PrelimNetwork"
        self.NETWORK = "Network_ND"
        self.PATHWAYS_FC_NAME = "Pathways"
        self.TRANSITIONS_FC_NAME = "Transitions"
        self.IN_MEMORY = "in_memory"

        self.Units = "Units"
        self.Units_F8_FACILITYNAME = "FACILITY_NAME"
        self.Units_F8_FACILITYID = "FACILITY_ID"
        self.Units_F9_LEVELID = "LEVEL_ID"
        self.Levels_SHORT_NAME = "NAME_SHORT"
        self.Units_LEVEL = "LEVEL_NUMBER"

        self.pathway_rank_field = "PATHWAY_RANK"
        #self.units_facilityid_field = "FACILITY_ID"
        self.pathways_FACILITY_ID = "FACILITY_ID"
        self.pathways_FACILITY_NAME = "FACILITY_NAME"
        self.pathways_LENGTH_3D = "LENGTH_3D"
        self.VERTICAL_ORDER = "VERTICAL_ORDER"

        self.execute()

    def execute(self):
        try:
            # You must have an Advanced License to run this tool.
            minimum_advanced_license = ["ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_advanced_license:
                raise LicenseError

            parameters = arcpy.GetParameterInfo()
            room_fc = parameters[0].value
            pathways_fc = parameters[1].value

            if room_fc:
                feat_count = int(arcpy.GetCount_management(room_fc).getOutput(0))
                if feat_count == 0:
                    arcpy.AddIDMessage("ERROR", 180308, "Units")
                    return
            if pathways_fc:
                feat_count = int(arcpy.GetCount_management(pathways_fc).getOutput(0))
                if feat_count == 0:
                    arcpy.AddIDMessage("ERROR", 180308, "Pathways")
                    return

            indoors_gdb = IndoorsUtilsModule.getWorkspacePath(room_fc)

            databaseProperties = IndoorsUtilsModule.getDatabaseProperties(indoors_gdb)
            self.isLegacyDataset = databaseProperties["isLegacyDataset"]
            self.indoorsDatasetName = databaseProperties["indoorsDatasetName"]
            self.sdeQualifier = databaseProperties["sdeQualifier"]

            if self.isLegacyDataset == False:
                scratchgdb = "in_memory"
                #scratchgdb = arcpy.env.scratchGDB

                levels_fc = os.path.join(indoors_gdb, self.sdeQualifier + self.indoorsDatasetName, self.sdeQualifier + "levels")
                facilities_fc = os.path.join(indoors_gdb, self.sdeQualifier + self.indoorsDatasetName, self.sdeQualifier + "facilities")

                if arcpy.Exists(levels_fc) == False:
                    arcpy.AddIDMessage("ERROR", 180307, "Levels")
                if arcpy.Exists(facilities_fc) == False:
                    arcpy.AddIDMessage("ERROR", 180307, "Facilities")
                if levels_fc:
                    feat_count = int(arcpy.GetCount_management(levels_fc).getOutput(0))
                    if feat_count == 0:
                        arcpy.AddIDMessage("ERROR", 180308, "Levels")
                        return
                if facilities_fc:
                    feat_count = int(arcpy.GetCount_management(facilities_fc).getOutput(0))
                    if feat_count == 0:
                        arcpy.AddIDMessage("ERROR", 180308, "Facilities")
                        return

                if self.validateFields(levels_fc, facilities_fc) == False:
                    return

                room_layer = "room_layer"
                arcpy.MakeFeatureLayer_management(room_fc, room_layer)
                levels_layer = "levels_layer"
                arcpy.MakeFeatureLayer_management(levels_fc, levels_layer)

                room_fc_selected = os.path.join(scratchgdb, "units_" + str(uuid.uuid4()).replace("-", ""))
                levels_fc_copy = os.path.join(scratchgdb, "levels_" + str(uuid.uuid4()).replace("-", ""))
                facilities_fc_copy = os.path.join(scratchgdb, "facilities_" + str(uuid.uuid4()).replace("-", ""))

                arcpy.management.CopyFeatures(room_layer, room_fc_selected)
                arcpy.management.CopyFeatures(levels_fc, levels_fc_copy)
                arcpy.management.CopyFeatures(facilities_fc, facilities_fc_copy)

                facilityid_name_dict = self.createDictionary(facilities_fc_copy, "facility_id", "name")

                room_fc_copy = os.path.join(scratchgdb, "unitsfinal_"+ str(uuid.uuid4()).replace("-", ""))

                levels_layer_final = "levels_layer_final"
                arcpy.MakeFeatureLayer_management(levels_fc_copy, levels_layer_final)
                units_layer_final = "units_layer_final"
                arcpy.MakeFeatureLayer_management(room_fc_selected, units_layer_final)

                arcpy.management.AddJoin(units_layer_final, "level_id", levels_layer_final, "level_id", "KEEP_ALL")
                arcpy.env.qualifiedFieldNames = False #fields without FC name to be exported
                arcpy.management.CopyFeatures(units_layer_final, room_fc_copy)

                arcpy.AddField_management(room_fc_copy, "FACILITY_NAME", 'TEXT')
                with arcpy.da.UpdateCursor(room_fc_copy, ["FACILITY_ID", "FACILITY_NAME"]) as cursor:
                    for row in cursor:
                        facilityid = row[0]
                        if facilityid:
                            row[1] = facilityid_name_dict[facilityid]
                            cursor.updateRow(row)
                room_fc = room_fc_copy

            building_id_names = {}
            with arcpy.da.SearchCursor(room_fc, [self.Units_F8_FACILITYID, self.Units_F8_FACILITYNAME]) as cursor:
                for row in cursor:
                    if row[0]:
                        building_id_names[row[0]] = row[1]

            building_ids = building_id_names.keys()
            building_ids = [x for x in building_ids]
            if len(building_ids) == 0:
                arcpy.AddIDMessage("WARNING", 180325)
                return
            building_ids.sort()
            bldg_count = 0 #used to generate temp FC
            scratchFolderGdb = "in_memory"
            for facility_id in building_ids:
                bldg_count = bldg_count + 1
                arcpy.AddIDMessage("INFORMATIVE", 180326, str(building_id_names[facility_id]))
                status = self.assignNetworkHierarchy(facility_id, room_fc, pathways_fc, bldg_count, scratchFolderGdb)
                if status == False:
                    arcpy.AddIDMessage("WARNING", 180333, str(building_id_names[facility_id]))

        except LicenseError:
            # You must have an Advanced License to run this tool.
            arcpy.AddIDMessage("ERROR", 180002)
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            failed = True
        finally:
            arcpy.CheckInExtension("Indoors")

    def assignNetworkHierarchy(self, facility_id, room_f, pathways_f, bldg_count, scratchFolderGdb):
        try:
            arcpy.env.overwriteOutput = True
            levelid_name = self.getLevels(facility_id, room_f)

            desc_room = arcpy.Describe(room_f)

            if self.isLegacyDataset:
                oids = desc_room.FIDSet.split(";")
                oid_str = ", ".join(x for x in oids)
            else:
                oids = []
                with arcpy.da.SearchCursor(room_f, [desc_room.oidfieldname]) as cursor:
                    for row in cursor:
                        oids.append(str(row[0]))
                oid_str = ", ".join(x for x in oids)

            room_wc_initial = self.Units_F8_FACILITYID + " = '" + facility_id + "' AND " + desc_room.oidfieldname + " IN " + "(" + oid_str + ")"
            pathways_wc_initial = self.pathways_FACILITY_ID + " = '" + facility_id + "'"

            room_layer = "room_layer"
            pathways_layer = "pathways_layer"
            pathway_split_layer = "pathway_split_layer"
            arcpy.MakeFeatureLayer_management(room_f, room_layer)
            arcpy.MakeFeatureLayer_management(pathways_f, pathways_layer)
            pathways_temp = []
            count = 0

            level_keys = levelid_name.keys()
            level_ids = level_keys
            level_ids = [levelid for levelid in level_ids]
            if len(level_ids) == 0:
                arcpy.AddIDMessage("WARNING", 180327)
                return False
            level_ids.sort()
            for key in level_ids:
                count += 1
                arcpy.AddIDMessage("INFORMATIVE", 180328, str(key))

                wc_units = room_wc_initial + " AND " + self.Units_F9_LEVELID + " = '" + key + "'"
                wc_pathways = pathways_wc_initial + " AND " + self.VERTICAL_ORDER + " = " + str(levelid_name[key])

                arcpy.SelectLayerByAttribute_management(room_layer, 'NEW_SELECTION', wc_units)
                arcpy.SelectLayerByAttribute_management(pathways_layer, 'NEW_SELECTION', wc_pathways)

                arcpy.management.SelectLayerByLocation(pathways_layer, "INTERSECT", room_layer, None, "SUBSET_SELECTION", "NOT_INVERT")
                feat_count = int(arcpy.GetCount_management(pathways_layer).getOutput(0))
                if feat_count == 0:
                    arcpy.AddIDMessage("WARNING", 180329)
                    continue

                #Split pathways in secondary spaces
                pathway_split_f_1 = os.path.join(scratchFolderGdb, "pathways" + "_" + str(bldg_count) + "_" + str(count) + "_1")
                pathway_split_f = os.path.join(scratchFolderGdb, "pathways" + "_" + str(bldg_count) + "_" + str(count))
                pathways_temp.append(pathway_split_f)
                arcpy.Identity_analysis(pathways_layer, room_layer, pathway_split_f_1, "ONLY_FID", None, "NO_RELATIONSHIPS")

                # Convert to single part feature because multiple part will fail the network routing
                arcpy.management.MultipartToSinglepart(pathway_split_f_1, pathway_split_f)

                #Delete identical pathways
                arcpy.MakeFeatureLayer_management(pathway_split_f, pathway_split_layer)
                desc_pathways = arcpy.Describe(pathway_split_layer)
                arcpy.management.DeleteIdentical(pathway_split_layer, desc_pathways.shapeFieldName, None, 0)

                #select pathways in non-inersecting spaces that are inside the secondary space
                arcpy.management.SelectLayerByLocation(pathway_split_layer, "WITHIN",
                                                                            room_layer, None,
                                                                            "NEW_SELECTION", "NOT_INVERT")
                arcpy.CalculateField_management(pathway_split_layer, self.pathway_rank_field, 2)

                #Recalculate length
                arcpy.SelectLayerByAttribute_management(pathway_split_layer, 'CLEAR_SELECTION')
                arcpy.management.CalculateGeometryAttributes(pathway_split_layer, self.pathways_LENGTH_3D + " LENGTH_3D", '', '', None, "SAME_AS_INPUT")
            #END OF LOOP


            if len(pathways_temp) == 0:
                return False

            #Delete pathways features that were split
            for key in level_ids:
                wc_units = room_wc_initial + " AND " + self.Units_F9_LEVELID + " = '" + key + "'"
                wc_pathways = pathways_wc_initial + " AND " + self.VERTICAL_ORDER + " = " + str(levelid_name[key])
                arcpy.SelectLayerByAttribute_management(room_layer, 'NEW_SELECTION', wc_units)
                arcpy.SelectLayerByAttribute_management(pathways_layer, 'NEW_SELECTION', wc_pathways)
                arcpy.management.SelectLayerByLocation(pathways_layer, "INTERSECT", room_layer, None, "SUBSET_SELECTION", "NOT_INVERT")
                feat_count = int(arcpy.GetCount_management(pathways_layer).getOutput(0))
                if feat_count > 0:
                    arcpy.DeleteFeatures_management(pathways_layer)

            arcpy.SelectLayerByAttribute_management(pathways_layer, 'CLEAR_SELECTION')
            fieldlist = self.getappendFieldsPathwaysLayer(pathways_layer)
            for pathways_output in pathways_temp:
                is_appended = self.appendPathways(pathways_output, pathways_layer, fieldlist)
                if is_appended == False:
                    arcpy.AddIDMessage("ERROR", 180334)
                    return

            return True
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            return False

    def validateFields(self, levels_fc, facilities_fc):
        # Validate fields in Levels and Facilities FC
        # Levels: FACILITY_ID, NAME
        # Facilities: LEVEL_ID , FACILITY_ID , VERTICAL_ORDER
        if facilities_fc and arcpy.Exists(facilities_fc):
            desc = arcpy.Describe(facilities_fc)
            fieldnames = [field.name.lower() for field in arcpy.ListFields(facilities_fc)]
            if not "facility_id" in fieldnames:
                arcpy.AddIDMessage("ERROR", 180309, "FACILITY_ID", desc.name.upper())
                return False
            if not "name" in fieldnames:
                arcpy.AddIDMessage("ERROR", 180309, "NAME", desc.name.upper())
                return False

        if levels_fc and arcpy.Exists(levels_fc):
            desc = arcpy.Describe(levels_fc)
            fieldnames = [field.name.lower() for field in arcpy.ListFields(levels_fc)]
            if not "facility_id" in fieldnames:
                arcpy.AddIDMessage("ERROR", 180309, "FACILITY_ID", desc.name.upper())
                return False
            if not "level_id" in fieldnames:
                arcpy.AddIDMessage("ERROR", 180309, "LEVEL_ID", desc.name.upper())
                return False
            if not "vertical_order" in fieldnames:
                arcpy.AddIDMessage("ERROR", 180309, "VERTICAL_ORDER", desc.name.upper())
                return False
        return True

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

    def getLevels(self, facility_id, room_f):
        try:
            levelid_name = {}
            wc = self.Units_F8_FACILITYID + " = '" + facility_id + "'"
            with arcpy.da.SearchCursor(room_f, [self.Units_F9_LEVELID, self.VERTICAL_ORDER], wc) as cursor:
                for row in cursor:
                    levelid_name[row[0]] = row[1]
            return levelid_name
        except:
            return levelid_name

    def addLayerToMap(self, indoors_gdb, poi_fc):
        try:
            is_proUI = IndoorsUtilsModule.isArcGISPro()
            if is_proUI == False:
                return
            aprx = arcpy.mp.ArcGISProject("CURRENT")
            if aprx:
                activemap = aprx.activeMap
                if activemap:
                    desc = arcpy.Describe(poi_fc)
                    fullpath = desc.catalogPath
                    layers = activemap.listLayers("*")
                    myLayer = None
                    for layer in layers:
                        if layer.isGroupLayer == True:
                            glayers = layer.listLayers()
                            for glayer in glayers:
                                layer_fullpath = self.getSdeLayerPath(indoors_gdb, glayer)
                                if layer_fullpath:
                                    if layer_fullpath.lower() == fullpath.lower():
                                        myLayer = glayer
                                        break
                        else:
                            layer_fullpath = self.getSdeLayerPath(indoors_gdb, layer)
                            if layer_fullpath:
                                if layer_fullpath.lower() == fullpath.lower():
                                    myLayer = layer
                                    break
                    if myLayer == None:
                        arcpy.AddIDMessage("INFORMATIVE", 180330, fullpath)
                        activemap.addDataFromPath(fullpath)

        except:
            pass
        return

    def getWorkspace(self, room_fc):
        dirname = os.path.dirname(arcpy.Describe(room_fc).catalogPath)
        desc = arcpy.Describe(dirname)
        if hasattr(desc, "datasetType") and desc.datasetType == 'FeatureDataset':
            dirname = os.path.dirname(dirname)
        return dirname

    def isNetworkDataset(self, indoors_gdb_path):
        try:
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(indoors_gdb_path)
            #Check for PrelimNetwork
            network_ds = os.path.join(indoors_gdb_path, sdeQualifier+self.PREFDS)
            network_path = os.path.join(network_ds, sdeQualifier+self.NETWORK)
            is_exists = arcpy.Exists(network_path)
            if is_exists:
                return True
            # Check for Network
            network_ds = os.path.join(indoors_gdb_path, sdeQualifier+self.FDS)
            network_path = os.path.join(network_ds, sdeQualifier+self.NETWORK)
            is_exists = arcpy.Exists(network_path)
            if is_exists:
                return True
            return False
        except:
            return None

    def getappendFieldsPathwaysLayer(self, pathways_layer):
        try:
            fieldlist = [x.name.lower() for x in pathways_layer.fields]
            f1 = arcpy.Describe(pathways_layer).OIDFieldName.lower()
            if f1 in fieldlist:
                fieldlist.remove(f1)
            f1 = arcpy.Describe(pathways_layer).shapeFieldName.lower()
            if f1 in fieldlist:
                fieldlist.remove(f1)
            f1 = "shape_length"
            if f1 in fieldlist:
                fieldlist.remove(f1)
            return fieldlist
        except:
            return []

    def appendPathways(self, source_fc, target_fc, fieldlist):
        try:
            source_fields = arcpy.ListFields(source_fc)
            target_fields = arcpy.ListFields(target_fc)
            oid_fieldname = arcpy.Describe(source_fc).OIDFieldName
            fieldMappings = arcpy.FieldMappings()
            fieldMappings.addTable(target_fc)  # target feature class (SDE)
            fieldlist_upper = [x.upper() for x in fieldlist]
            for sf in source_fields:
                if str(sf.name).upper() in fieldlist_upper:
                    fldMap = arcpy.FieldMap()
                    fldMap.addInputField(source_fc, sf.name)  # Source feature class
                    out_field = fldMap.outputField
                    out_field.name, out_field.aliasName, out_field.type = sf.name, sf.aliasName, sf.type
                    fldMap.outputField = out_field
                    fieldMappings.addFieldMap(fldMap)
            #print(fieldMappings)
            arcpy.Append_management(source_fc, target_fc, "NO_TEST", fieldMappings, None)
            return True
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180335)
            return False

if __name__ == '__main__':
    ClassifyIndoorsPathways()