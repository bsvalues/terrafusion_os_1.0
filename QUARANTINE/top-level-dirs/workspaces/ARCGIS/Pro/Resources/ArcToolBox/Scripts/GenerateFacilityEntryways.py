# -*- coding: utf-8 -*-
from __future__ import print_function
import arcpy
import bisect
import os
import ast
import sys
import traceback
import datetime
import random
import re
import math
import re
import time
#from operator import itemgetter
#import base64
#import xml.etree.ElementTree as ET
import IndoorsUtilsModule
import uuid

def ERROR(self):
    pass

class LicenseError(Exception):
    pass


class GenerateBuildingEntryways(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class). """
        self.NON_GP = "non-gp"
        self.ERROR = "error"
        self.WARNING = "warning"
        self.Facilities = "Facilities"
        self.Details = "Details"
        self.Units = "Units"
        self.Levels = "Levels"
        self.PointsOfInterest = "PointsOfInterest"
        self.AIIMFDS = "INDOORS"
        self.Facilities_F8_FACILITY_NAME = "NAME"
        self.Facilities_F8_FACILITYID = "FACILITY_ID"
        self.Units_F8_FACILITYNAME = "FACILITY_NAME"
        self.Units_F8_FACILITYID = "FACILITY_ID"
        self.Units_F9_LEVELID = "LEVEL_ID"
        self.Units_F9_LEVELNAME = "LEVEL_NAME"
        self.Units_F9_LEVELNUMBER = "LEVEL_NUMBER"
        self.Details_F8_FACILITYNAME = "FACILITY_NAME"
        self.Details_F8_FACILITYID = "FACILITY_ID"
        self.Details_F9_LEVELID = "LEVEL_ID"
        self.Details_F9_LEVELNUMBER = "LEVEL_NUMBER"
        self.POI_LEVELNAME = "LEVEL_NAME"
        self.POI_LEVELID = "LEVEL_ID"
        self.POI_LEVELNUMBER = "LEVEL_NUMBER"
        self.POI_ELEVATION_RELATIVE = "ELEVATION_RELATIVE"

        self.POI_SOURCE_PATH = "SOURCE_PATH"
        self.POI_SOURCE_TYPE = "SOURCE_TYPE"
        self.POI_SOURCE_METHOD = "SOURCE_METHOD"
        self.POI_SOURCE_NAME = "SOURCE_NAME"
        self.POI_USE_TYPE = "USE_TYPE"

        self.Levels_NAME_SHORT = "NAME_SHORT"
        self.Levels_LEVEL_ID = "LEVEL_ID"
        self.Levels_FACILITYNAME = "FACILITY_NAME"
        self.Levels_FACILITY_ID = "FACILITY_ID"
        self.LEVELS_LEVELNUMBER = "LEVEL_NUMBER"
        self.fieldlist = ["DETAIL_ID", "SITE_ID", "SITE_NAME", "FACILITY_ID", "FACILITY_NAME", "LEVEL_ID", "LEVEL_NAME", \
                            "LEVEL_NUMBER", "ELEVATION_ABSOLUTE", "ELEVATION_RELATIVE", "HEIGHT_ABSOLUTE", \
                            "HEIGHT_RELATIVE", "VERTICAL_ORDER", "SOURCE_NAME", "SOURCE_PATH", "SOURCE_TYPE"]
        self.isLegacyDataset = None
        self.indoorsDatasetName = None
        self.sdeQualifier = None
        self.isLegacyPOI = True
        self.levelIDParam = None
        self.useTypeParam = None
        self.zValuesDict = {}
        self.execute()

    def execute(self):
        scratch_folder_gdb = None
        templist = []
        try:
            #return
            parameters = arcpy.GetParameterInfo()

            levels_fc = parameters[0].valueAsText
            room_fc = parameters[1].valueAsText
            details_fc = parameters[2].valueAsText
            poi_fc = parameters[3].valueAsText
            search_tolerance = parameters[4].value  # double
            entryway_use_type = parameters[5].valueAsText
            outside_area_wc = parameters[6].valueAsText
            delete_features = parameters[7].value
            levelid_field = parameters[9].valueAsText
            usetype_field = parameters[10].valueAsText

            # license check
            if arcpy.CheckExtension("3D") == "Available":
                arcpy.CheckOutExtension("3D")
            else:
                raise LicenseError

            # You must have an Advanced License to run this tool.
            minimum_advanced_license = ["ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_advanced_license:
                raise LicenseError

            #Get GDB
            indoors_gdb = self.getWorkspace(room_fc)

            databaseProperties =  IndoorsUtilsModule.getDatabaseProperties(indoors_gdb)
            self.isLegacyDataset = databaseProperties["isLegacyDataset"]
            self.indoorsDatasetName = databaseProperties["indoorsDatasetName"]
            self.sdeQualifier = databaseProperties["sdeQualifier"]

            if (levelid_field is not None and levelid_field != "" and levelid_field.upper() != self.Levels_LEVEL_ID) :
                self.levelIDParam = levelid_field

            if (usetype_field is not None and usetype_field != "" and usetype_field.upper() != self.POI_USE_TYPE) :
                self.useTypeParam = usetype_field

            if self.validateDetailsLayer(details_fc) == False:
                return
            desc_details = arcpy.Describe(details_fc)
            if hasattr(desc_details, "FIDSet") == False or desc_details.FIDSet.strip() == '':
                arcpy.AddIDMessage("ERROR", 180261)
                return

            if self.isLegacyDataset:
                details_oids = desc_details.FIDSet.split(";")
                oid_str = ", ".join(x for x in details_oids)
                details_doors_wc = desc_details.oidfieldname + " IN " + "(" + oid_str + ")"
            else:
                details_oids = []
                with arcpy.da.SearchCursor(details_fc, ["DETAIL_ID"]) as cursor:
                    for row in cursor:
                        if row[0] not in details_oids:
                            details_oids.append(row[0])
                oid_str = ", ".join("'" + x + "'" for x in details_oids)
                details_doors_wc = "DETAIL_ID" + " IN " + "(" + oid_str + ")"

            source_path_units = ""
            if room_fc:
                desc = arcpy.Describe(room_fc)
                source_path_units = os.path.join(desc.path, desc.name)

            search_door_tolerance = "2.0"
            search_tolerance_units = " Meters"

            #Move this to UpdateMessages
            if not float(search_tolerance) >= 0:
                arcpy.AddIDMessage("ERROR", 854, 0, 10)
                return

            #check if poi is legacy
            poiDataset = self.getWorkspace(poi_fc)#self.getDatasetWorkspace(poi_fc)
            poiDatasetProperties = IndoorsUtilsModule.getDatabaseProperties(poiDataset)
            self.isLegacyPOI = poiDatasetProperties["isLegacyDataset"]
            if self.isLegacyPOI is None or self.isLegacyPOI == False:
                self.isLegacyPOI = False
                spatial_ref_levels = arcpy.Describe(levels_fc).spatialReference
                spatial_ref_poi = arcpy.Describe(poi_fc).spatialReference
                sr1String = spatial_ref_levels.name
                sr2String = spatial_ref_poi.name
                if sr1String != sr2String:
                    arcpy.AddIDMessage("ERROR", 180368)
                    return
            if self.addFieldsTargetFC(poi_fc, levelid_field, usetype_field) == False:
                return
            arcpy.env.overwriteOutput = True
            scratch_folder_gdb = IndoorsUtilsModule.getUniqueScratchFolderGdbName() #in_memory cannot be used in all tools
            scratch_gdb = "IN_MEMORY"
            #scratch_gdb = arcpy.env.scratchGDB

            feat_count = int(arcpy.GetCount_management(levels_fc).getOutput(0))
            if feat_count == 0:
                arcpy.AddIDMessage("ERROR", 401)
                return
            feat_count = int(arcpy.GetCount_management(room_fc).getOutput(0))
            if feat_count == 0:
                arcpy.AddIDMessage("ERROR", 401)
                return
            feat_count = int(arcpy.GetCount_management(details_fc).getOutput(0))
            if feat_count == 0:
                arcpy.AddIDMessage("ERROR", 401)
                return

            Details_Single = os.path.join(scratch_gdb, "Details_Single")
            #Details_Points = os.path.join(scratch_gdb, "Details_Points")
            Units_Aggregate_Table = os.path.join(scratch_gdb, "Units_Aggregate_Table")
            Units_Aggregate = os.path.join(scratch_gdb, "Units_Aggregate")
            Units_Buffer_Outside = os.path.join(scratch_gdb, "Units_Buffer_Outside")
            Units_Buffer = os.path.join(scratch_gdb, "Units_Buffer")
            #Units_Outside = os.path.join(scratch_gdb, "Units_Outside")
            Entryways = os.path.join(scratch_gdb, "Entryways")

            #Units_Buffer_Outside_Init = Units_Buffer_Outside
            Units_Buffer_Init = Units_Buffer
            Details_Single_Init = Details_Single
            Units_Aggregate_Init = Units_Aggregate
            Units_Aggregate_Table_Init = Units_Aggregate_Table

            room_layer = "room_layer"
            details_layer = "details_layer"
            poi_layer = "poi_layer"
            levels_layer = "levels_layer"
            #building_layer = "building_layer"
            entryways_layer = "entryways_layer"

            if (self.isLegacyDataset == False):
                # remove selection and make a copy of details
                detailsfc_copy = os.path.join(scratch_gdb, "detailsfc_copy")
                arcpy.MakeFeatureLayer_management(details_fc, details_layer)
                arcpy.management.SelectLayerByAttribute(details_layer, "CLEAR_SELECTION")
                arcpy.CopyFeatures_management(details_layer, detailsfc_copy)
                #Make a copy of room
                roomfc_copy = os.path.join(scratch_gdb, "roomfc_copy")
                arcpy.CopyFeatures_management(room_fc, roomfc_copy)
                arcpy.management.JoinField(roomfc_copy, self.Levels_LEVEL_ID, levels_fc, self.Levels_LEVEL_ID, None)
                arcpy.management.JoinField(detailsfc_copy, self.Levels_LEVEL_ID, levels_fc, self.Levels_LEVEL_ID, None)
                arcpy.MakeFeatureLayer_management(roomfc_copy, room_layer)
                arcpy.MakeFeatureLayer_management(detailsfc_copy, details_layer)
            else:
                arcpy.MakeFeatureLayer_management(room_fc, room_layer)
                arcpy.MakeFeatureLayer_management(details_fc, details_layer)
            arcpy.MakeFeatureLayer_management(poi_fc, poi_layer)

            #user selects facility name on UI
            #dict_facilityname_facilityid = dict()
            #with arcpy.da.SearchCursor(levels_fc, [self.Levels_FACILITYNAME, self.Levels_FACILITY_ID]) as cursor:
            #    for row in cursor:
            #        dict_facilityname_facilityid[row[1]] = row[0]

            arcpy.MakeFeatureLayer_management(levels_fc, levels_layer) #this will honor level selected in a range it that was defined in map
            building_levels = []
            with arcpy.da.SearchCursor(levels_fc, [self.Levels_LEVEL_ID, self.LEVELS_LEVELNUMBER, "SHAPE@"]) as cur:
                for row in cur:
                    building_levels.append([row[0], row[1], self.generateFeatureClassName()])
                    if self.isLegacyPOI == False:
                        shape = row[2]
                        firstPoint = shape.firstPoint
                        if(row[0] not in self.zValuesDict):
                            self.zValuesDict[row[0]] = firstPoint.Z

            building_fc_selected_list = list(set(row[0] for row in arcpy.da.SearchCursor(levels_layer, [self.Levels_FACILITY_ID])))
            #building_name_selected_list = []
            #for (k,v) in dict_facilityname_facilityid.items():
            #    if k in building_fc_selected_list:
            #        building_name_selected_list.append(v)

            building_comma_sep_ids = IndoorsUtilsModule.handleSingleQuoteInList(building_fc_selected_list, True)

            room_wc = self.Units_F8_FACILITYID + " IN " + "(" + building_comma_sep_ids + ")"
            details_wc = details_doors_wc + " AND " + self.Details_F8_FACILITYID + " IN " + "(" + building_comma_sep_ids + ")"

            building_levels.sort()

            if len(building_levels) == 0:
                arcpy.AddIDMessage("ERROR", 180253)
                return

            details_wc_init = details_wc    #usetype=doors and buildings selected
            room_wc_init = room_wc          #buildings selected
            entryways_names = dict()
            search_tolerance_number = search_tolerance
            #search_tolerance_units = " Meters"
            search_door_tolerance_number = str(search_door_tolerance) + " " + str(search_tolerance_units)

            #scratch_entryways_fc = None #entryways that do not snap correctly to door baseline
            for level in building_levels:
                level_id = level[0]
                level_name = level[2]
                arcpy.AddIDMessage("INFORMATIVE", 180254, str(level_id))

                details_wc = details_wc_init + " AND " + self.Details_F9_LEVELID + " = '" + str(level_id) + "'"
                room_wc = room_wc_init + " AND " + self.Units_F9_LEVELID + " = '" + str(level_id) + "'"
                if outside_area_wc:
                    room_outside_wc = room_wc + " AND " + outside_area_wc
                else:
                    room_outside_wc = room_wc

                #Select details features for level and buildings
                arcpy.management.SelectLayerByAttribute(details_layer, "NEW_SELECTION", details_wc, None)
                #Select units features for level and buildings
                arcpy.management.SelectLayerByAttribute(room_layer, "NEW_SELECTION", room_wc, None)
                #Select inside area only by excluding outside area.
                if outside_area_wc:
                    arcpy.management.SelectLayerByAttribute(room_layer, "REMOVE_FROM_SELECTION", outside_area_wc)

                # Step 2: aggregate units polygon
                Units_Aggregate = Units_Aggregate_Init + "_" + str(level_name)
                Units_Aggregate_Table = Units_Aggregate_Table_Init + "_" + str(level_name)
                #scale_factor = 2.0
                search_distance = str(search_tolerance_number) + " " + search_tolerance_units
                arcpy.cartography.AggregatePolygons(room_layer,
                                                    Units_Aggregate,
                                                    "2 Meters", "15 SquareMeters", "5 SquareMeters", "ORTHOGONAL", None,
                                                    Units_Aggregate_Table)

                #Step 3: Buffer the outer units polygon
                scale_factor = 3.0
                #Units_Buffer_Line = os.path.join(scratch_gdb, "Units_Buffer_Line") + "_" + str(level_name)
                Units_Buffer_Initial = os.path.join(scratch_gdb, "Units_Buffer_Initial") + "_" + str(level_name)
                Units_Buffer_Outside = os.path.join(scratch_gdb, "Units_Buffer_Outside") + "_" + str(level_name)
                Units_Buffer_Outside_Line = os.path.join(scratch_gdb, "Units_Buffer_Outside_Line") + "_" + str(level_name)
                Units_Buffer = Units_Buffer_Init + "_" + str(level_name)
                #Units_Outside = os.path.join(scratch_gdb, "Units_Outside") + "_" + str(level_name)
                #search_distance = str(search_tolerance_number) + " " + search_tolerance_units
                arcpy.analysis.Buffer(Units_Aggregate,
                                      Units_Buffer_Initial,
                                      "0.1 Meters", "OUTSIDE_ONLY", "ROUND", "NONE", None, "PLANAR")
                arcpy.management.EliminatePolygonPart(Units_Buffer_Initial,
                                                      Units_Buffer_Outside,
                                                      "AREA", "10 SquareMeters", 0, "ANY")

                search_distance = str(search_tolerance_number) + " " + search_tolerance_units
                arcpy.analysis.Buffer(Units_Buffer_Outside,
                                      Units_Buffer,
                                      search_distance, "FULL", "ROUND", "NONE", None, "PLANAR")

                #Units_Buffer_Outside_Line = Units_Buffer_Outside + "Line" + "_" + str(level_name)
                arcpy.management.FeatureToLine(Units_Buffer_Outside,
                                               Units_Buffer_Outside_Line,
                                               None, "ATTRIBUTES")
                #Step 4: Explode Details to single part feature
                Details_Single = Details_Single_Init + "_" + str(level_name)
                arcpy.management.SelectLayerByAttribute(details_layer, "NEW_SELECTION", details_wc, None)
                arcpy.management.MultipartToSinglepart(details_layer, Details_Single)

                if int(arcpy.GetCount_management(Details_Single).getOutput(0)) == 0:
                    arcpy.AddIDMessage("WARNING", 180255)
                    continue

                #Outside swinging doors
                Details_Single_layer = "Details_Single_layer"
                arcpy.MakeFeatureLayer_management(Details_Single, Details_Single_layer)

                #Account for doors opening inside the building
                Details_Vertices = os.path.join(scratch_gdb, "Details_Vertices") + "_" + str(level_name)
                arcpy.management.FeatureVerticesToPoints(Details_Single, Details_Vertices, "ALL")
                Details_Vertices_Layer = "Details_Vertices_Layer"
                arcpy.MakeFeatureLayer_management(Details_Vertices, Details_Vertices_Layer)
                #This will give us both inside and outside swinging doors
                arcpy.management.SelectLayerByLocation(Details_Vertices_Layer, "WITHIN",
                                                       Units_Buffer, None, "NEW_SELECTION",
                                                       "NOT_INVERT")
                # Select all doors that intersect door vertices selected above
                arcpy.management.SelectLayerByLocation(Details_Single_layer, "INTERSECT", Details_Vertices_Layer,
                                                       "0.1 Meters", "ADD_TO_SELECTION", "NOT_INVERT")
                count_doors = int(arcpy.GetCount_management(Details_Single_layer)[0])
                if count_doors == 0:
                    arcpy.AddIDMessage("WARNING", 180256)
                    continue

                #At this time Details_Single will have outside and inside swinging doors
                Details_InOut_Doors = os.path.join(scratch_gdb, "Details_InOut_Doors") + "_" + str(level_name)
                arcpy.management.CopyFeatures(Details_Single_layer, Details_InOut_Doors, '', None, None, None)

                Details_Single_Envelope = os.path.join(scratch_folder_gdb, "Details_Single" + "_Envelope" + "_" + str(level_name))
                arcpy.management.MinimumBoundingGeometry(Details_InOut_Doors,
                                                     Details_Single_Envelope,
                                                     "ENVELOPE", "NONE", None, "NO_MBG_FIELDS")
                entryways_name = Entryways + "_" + str(level_name)

                desc_env = arcpy.Describe(Details_Single_Envelope)
                shape_area_field = desc_env.areafieldname
                wc_env = shape_area_field + " > 0.2"
                Details_Single_Envelope_Layer = "Details_Single_Envelope_Layer"
                arcpy.MakeFeatureLayer_management(Details_Single_Envelope, Details_Single_Envelope_Layer, wc_env)
                count_doors = int(arcpy.GetCount_management(Details_Single_Envelope_Layer)[0])
                if count_doors == 0:
                    arcpy.AddIDMessage("WARNING", 180256)
                    continue

                Details_Single_Envelope_Agg = Details_Single_Envelope + "_Agg" + "_" + str(level_name)

                #rasterize and then find domain of raster
                details_raster = os.path.join(scratch_folder_gdb, "Details_Raster") + "_" + str(level_name)
                details_raster_polygon = os.path.join(scratch_folder_gdb, "Details_Raster_Polygon") + "_" + str(level_name)
                arcpy.conversion.FeatureToRaster(Details_Single_Envelope, "VERTICAL_ORDER", details_raster, 0.1)
                arcpy.ddd.RasterDomain(details_raster, Details_Single_Envelope_Agg, "POLYGON")
                arcpy.management.MultipartToSinglepart(Details_Single_Envelope_Agg, details_raster_polygon)

                Details_Single_Envelope_Agg_Layer = "Details_Single_Envelope_Agg_Layer"
                arcpy.MakeFeatureLayer_management(details_raster_polygon, Details_Single_Envelope_Agg_Layer)
                wc_env = shape_area_field + " > 0.2"
                arcpy.management.SelectLayerByAttribute(Details_Single_Envelope_Agg_Layer, "NEW_SELECTION", wc_env)

                #Get door feature upon dissolve
                details_doors_dissolve = os.path.join(scratch_folder_gdb, "Details_Doors_Dissolve") + "_" + str(level_name)
                arcpy.analysis.Near(Details_InOut_Doors, Details_Single_Envelope_Agg_Layer, search_door_tolerance_number, "LOCATION", "NO_ANGLE", "PLANAR")
                Details_InOut_Doors_Layer = "Details_InOut_Doors_Layer"
                arcpy.MakeFeatureLayer_management(Details_InOut_Doors, Details_InOut_Doors_Layer)
                arcpy.management.SelectLayerByAttribute(Details_InOut_Doors_Layer, "NEW_SELECTION", "NEAR_FID > 0", None)
                arcpy.management.Dissolve(Details_InOut_Doors_Layer, details_doors_dissolve, "NEAR_FID", None,
                                          "MULTI_PART", "DISSOLVE_LINES")
                Details_Single_Poly_Centroid = os.path.join(scratch_gdb, "Details_Centroid") + "_" + str(level_name)
                details_doors_mbr = os.path.join(scratch_gdb, "Details_Doors_MBR") + "_" + str(level_name)
                arcpy.management.MinimumBoundingGeometry(details_doors_dissolve, details_doors_mbr,
                                                         "RECTANGLE_BY_AREA", "NONE", None, "NO_MBG_FIELDS")
                arcpy.management.FeatureToPoint(details_doors_mbr, Details_Single_Poly_Centroid, "CENTROID")

                #validate entryways
                Units_Buffer_Outside = os.path.join(scratch_gdb, "Units_Buffer_Outside") + "_" + str(level_name)
                Units_Buffer_Line = os.path.join(scratch_gdb, "Units_Buffer_Line") + "_" + str(level_name)
                Units_Buffer_Point = os.path.join(scratch_gdb, "Units_Buffer_Point") + "_" + str(level_name)
                Units_Buffer_HitTest_Line = os.path.join(scratch_gdb, "Units_Buffer_HitTest_Line") + "_" + str(level_name)
                entryways_invalid = os.path.join(scratch_folder_gdb, "Entryways_Invalid") + "_" + str(level_name)
                spatial_ref = arcpy.Describe(Details_Single_Poly_Centroid).spatialReference

                arcpy.analysis.Buffer(Units_Buffer, Units_Buffer_Outside, "1 Meters", "FULL", "ROUND", "ALL", None, "PLANAR")
                arcpy.management.FeatureToLine(Units_Buffer_Outside, Units_Buffer_Line, None, "ATTRIBUTES")
                Units_Buffer_Line_Layer = "Units_Buffer_Line_Layer"
                arcpy.MakeFeatureLayer_management(Units_Buffer_Line, Units_Buffer_Line_Layer)
                Units_Aggregate_Layer = "Units_Aggregate_Layer"
                arcpy.MakeFeatureLayer_management(Units_Aggregate, Units_Aggregate_Layer)
                arcpy.management.SelectLayerByLocation(Units_Buffer_Line_Layer, "INTERSECT", Units_Aggregate_Layer, None, "NEW_SELECTION", "NOT_INVERT")
                arcpy.management.DeleteFeatures(Units_Buffer_Line_Layer)
                arcpy.analysis.Near(Details_Single_Poly_Centroid, Units_Buffer_Line, None, "LOCATION", "ANGLE", "PLANAR")
                arcpy.management.XYTableToPoint(Details_Single_Poly_Centroid,
                                                Units_Buffer_Point, "NEAR_X", "NEAR_Y", None, spatial_ref)
                arcpy.management.Append(Details_Single_Poly_Centroid, Units_Buffer_Point, "NO_TEST")
                arcpy.management.PointsToLine(Units_Buffer_Point,
                                              Units_Buffer_HitTest_Line, "ORIG_FID", None, "NO_CLOSE")
                Details_Single_Poly_Centroid_Layer = "Details_Single_Poly_Centroid_Layer"
                Units_Buffer_HitTest_Line_Layer = "Units_Buffer_HitTest_Line_Layer"
                arcpy.MakeFeatureLayer_management(Details_Single_Poly_Centroid, Details_Single_Poly_Centroid_Layer)
                arcpy.MakeFeatureLayer_management(Units_Buffer_HitTest_Line, Units_Buffer_HitTest_Line_Layer)
                details_walls_wc = self.Details_F8_FACILITYID + " IN " + "(" + str(building_fc_selected_list)[1:-1] + ")"
                details_walls_wc = details_walls_wc + " AND " + self.Details_F9_LEVELID + " = '" + str(level_id) + "'"

                #whereclause to select doors
                details_select_doors_wc = details_walls_wc + " AND " +  details_doors_wc

                #Centroid test
                arcpy.management.SelectLayerByAttribute(Units_Buffer_HitTest_Line_Layer, "CLEAR_SELECTION")
                #Intersect hittest line with details layer, and add them to the list of valid hottest lines
                #select doors
                arcpy.management.SelectLayerByAttribute(details_layer, "NEW_SELECTION",
                                                        details_select_doors_wc,
                                                        "NON_INVERT")
                arcpy.management.SelectLayerByLocation(Units_Buffer_HitTest_Line_Layer, "INTERSECT",
                                                       details_layer, "0.2 Meters",
                                                       "NEW_SELECTION", "NOT_INVERT")

                arcpy.management.SelectLayerByAttribute(details_layer, "NEW_SELECTION",
                                                        details_walls_wc,
                                                        "NON_INVERT") #select building and level
                arcpy.management.SelectLayerByAttribute(details_layer, "REMOVE_FROM_SELECTION",
                                                        details_doors_wc,
                                                        "NON_INVERT") #remove details lines that are not doors, so these are non-doors or likely walls
                arcpy.management.SelectLayerByLocation(Units_Buffer_HitTest_Line_Layer, "INTERSECT", details_layer, None,
                                                       "REMOVE_FROM_SELECTION", "NOT_INVERT")

                #Exception 1 - If hittest lines does not intersect anything - neither door or walls, use them
                arcpy.management.SelectLayerByAttribute(details_layer, "NEW_SELECTION",
                                                        details_walls_wc,
                                                        "NON_INVERT")
                arcpy.management.SelectLayerByLocation(Units_Buffer_HitTest_Line_Layer, "INTERSECT",
                                                       details_layer, None,
                                                       "ADD_TO_SELECTION", "INVERT")

                #Exception 2 - If hittest lines intersects units outside only and not inside, consider them as valid
                Units_Buffer_HitTest_Line_Layer_X = "Units_Buffer_HitTest_Line_Layer_X"
                arcpy.MakeFeatureLayer_management(Units_Buffer_HitTest_Line, Units_Buffer_HitTest_Line_Layer_X)
                arcpy.management.SelectLayerByAttribute(room_layer, "NEW_SELECTION",
                                                        room_outside_wc,
                                                        "NON_INVERT")
                arcpy.management.SelectLayerByLocation(Units_Buffer_HitTest_Line_Layer_X, "INTERSECT",
                                                       room_layer, None,
                                                       "NEW_SELECTION", "NOT_INVERT")

                #Fix for SDE SQL error
                arcpy.management.SelectLayerByAttribute(room_layer, "NEW_SELECTION", room_wc, None)
                if outside_area_wc:
                    arcpy.management.SelectLayerByAttribute(room_layer, "REMOVE_FROM_SELECTION", outside_area_wc)

                arcpy.management.SelectLayerByLocation(Units_Buffer_HitTest_Line_Layer_X, "INTERSECT",
                                                       room_layer, None,
                                                       "REMOVE_FROM_SELECTION", "NOT_INVERT")

                #Exception 2 ends

                #Select centroids near the hittest line
                arcpy.management.SelectLayerByLocation(Details_Single_Poly_Centroid_Layer, "INTERSECT",
                                                       Units_Buffer_HitTest_Line_Layer, "1 Meters", "NEW_SELECTION", "NOT_INVERT")
                arcpy.management.SelectLayerByLocation(Details_Single_Poly_Centroid_Layer, "INTERSECT",
                                                       Units_Buffer_HitTest_Line_Layer_X, "1 Meters", "ADD_TO_SELECTION", "NOT_INVERT")

                # Centroid offset line
                details_doors_envelope = os.path.join(scratch_gdb, "Details_Doors_Envelope") + "_" + str(level_name)
                #details_doors_center = os.path.join(scratch_gdb, "Details_Doors_Center") + "_" + str(level_name)
                offset_points = os.path.join(scratch_gdb, "Offset_Points") + "_" + str(level_name)
                offset_points_outside = os.path.join(scratch_gdb, "Offset_Points_Outside") + "_" + str(level_name)
                offset_line = os.path.join(scratch_gdb, "Offset_Line") + "_" + str(level_name)

                arcpy.management.MinimumBoundingGeometry(details_doors_dissolve, details_doors_envelope,
                                                         "ENVELOPE", "NONE", None, "NO_MBG_FIELDS")
                arcpy.management.AddField(details_doors_envelope, "x", "DOUBLE")
                arcpy.management.AddField(details_doors_envelope, "y", "DOUBLE")
                with arcpy.da.UpdateCursor(details_doors_envelope, ["SHAPE@", "x", "y"]) as cursor:
                    for row in cursor:
                        geom = row[0]
                        extent = geom.extent
                        row[1] = extent.XMin + ((extent.XMax - extent.XMin) / 4)
                        row[2] = extent.YMin + ((extent.YMax - extent.YMin) / 2)
                        cursor.updateRow(row)
                spatial_ref = arcpy.Describe(details_doors_envelope).spatialReference
                arcpy.management.XYTableToPoint(details_doors_envelope, offset_points, "x", "y", None, spatial_ref)
                arcpy.analysis.Near(offset_points, Units_Buffer_Line, None, "LOCATION", "ANGLE", "PLANAR")
                arcpy.management.XYTableToPoint(offset_points, offset_points_outside, "NEAR_X", "NEAR_Y", None, spatial_ref)
                arcpy.management.Append(offset_points_outside, offset_points, "NO_TEST")
                arcpy.management.PointsToLine(offset_points, offset_line, "ORIG_FID", None, "NO_CLOSE")
                offset_line_Layer = "offset_line_Layer"
                offset_points_Layer = "offset_points_Layer"
                arcpy.MakeFeatureLayer_management(offset_line, offset_line_Layer)
                arcpy.MakeFeatureLayer_management(offset_points, offset_points_Layer)
                # Centroid offset point test
                # Clear selection on details layer. Intersect hittest line with details layer, and add them to the list of valid hottest lines
                arcpy.management.SelectLayerByAttribute(details_layer, "NEW_SELECTION",
                                                        details_select_doors_wc,
                                                        "NON_INVERT")
                arcpy.management.SelectLayerByLocation(offset_line_Layer, "INTERSECT", details_layer, "0.2 Meters",
                                                       "ADD_TO_SELECTION", "NOT_INVERT")

                arcpy.management.SelectLayerByAttribute(details_layer, "NEW_SELECTION",
                                                        details_walls_wc,
                                                        "NON_INVERT") #select building and level
                arcpy.management.SelectLayerByAttribute(details_layer, "REMOVE_FROM_SELECTION",
                                                        details_doors_wc,
                                                        "NON_INVERT") #remove details lines that are not doors, so these are non-doors or likely walls

                arcpy.management.SelectLayerByLocation(offset_line_Layer, "INTERSECT", details_layer, None,
                                                       "REMOVE_FROM_SELECTION", "NOT_INVERT")
                #Select offset points intersecting offset lines selected
                arcpy.management.SelectLayerByLocation(offset_points_Layer, "INTERSECT",
                                                       offset_line_Layer, None, "NEW_SELECTION", "NOT_INVERT")
                #Select door centroids within 2 m distance of selected offset points, and add it to current selection of centroids
                arcpy.management.SelectLayerByLocation(Details_Single_Poly_Centroid_Layer, "WITHIN_A_DISTANCE",
                                                       offset_points_Layer, search_door_tolerance_number, "ADD_To_SELECTION", "NOT_INVERT")

                arcpy.analysis.Near(Details_Single_Poly_Centroid, Details_Single_layer, None, "LOCATION", "NO_ANGLE", "PLANAR")
                oid_field = arcpy.Describe(Details_Single).OIDFieldName
                arcpy.management.AddJoin(Details_Single_Poly_Centroid_Layer, "NEAR_FID", Details_Single_layer, oid_field, "KEEP_ALL")
                arcpy.env.qualifiedFieldNames = False #fields without FC name to be exported
                arcpy.management.CopyFeatures(Details_Single_Poly_Centroid_Layer, entryways_name)
                arcpy.MakeFeatureLayer_management(entryways_name, entryways_layer)
                count_all_entryways = int(arcpy.GetCount_management(entryways_layer)[0])
                if count_all_entryways == 0:
                    arcpy.AddIDMessage("WARNING", 180256)
                    continue

                #Now adjust the geometry of door points so it snaps to the outline
                search_distance = str(search_door_tolerance) + " " + search_tolerance_units
                #snapEnv = [Units_Buffer_Outside_Line, "EDGE", search_distance]
                snapEnv = [room_layer, "EDGE", search_distance]
                arcpy.edit.Snap(entryways_name, [snapEnv])

                entryways_names[level_id] = entryways_name

                arcpy.AddIDMessage("INFORMATIVE", 180257)

                templist.append(Details_Single_layer)
                templist.append(Details_Single_Envelope_Layer)
                templist.append(Details_InOut_Doors_Layer)
                templist.append(Units_Buffer_Line_Layer)
                templist.append(Units_Aggregate_Layer)
                templist.append(Details_Single_Poly_Centroid_Layer)
                templist.append(Units_Buffer_HitTest_Line_Layer)
                templist.append(Units_Buffer_HitTest_Line_Layer_X)
                templist.append(offset_line_Layer)
                templist.append(offset_points_Layer)
                templist.append(entryways_layer)

            #End of loop for level_number (for level_number in building_levels:)

            if delete_features:
                arcpy.AddIDMessage("INFORMATIVE", 180258)
                entryway_use_type_query = IndoorsUtilsModule.handleSingleQuoteForQuery(entryway_use_type)
                if (entryway_use_type_query != None and entryway_use_type_query != ""):
                    if self.useTypeParam == None:
                        poi_wc_1 = "USE_TYPE = " + entryway_use_type_query
                    elif self.useTypeParam != None:
                        poi_wc_1 = self.useTypeParam + " = " + entryway_use_type_query
                    poi_wc_2 = self.Details_F8_FACILITYID + " IN " + "(" + str(building_fc_selected_list)[1:-1] + ")"
                    levels_list = ""
                    for level in building_levels:
                        levels_list = "{0},'{1}'".format(levels_list, level[0])
                    levels_list = levels_list.lstrip(',')
                    if self.isLegacyPOI or self.levelIDParam == None:
                        poi_wc_3 = self.POI_LEVELID + " IN " + "(" + levels_list + ")"
                    else:
                        poi_wc_3 = self.levelIDParam + " IN " + "(" + levels_list + ")"
                    if self.isLegacyPOI:
                        poi_wc = poi_wc_1 + " AND " + poi_wc_2 + " AND " + poi_wc_3
                    else:
                        poi_wc = poi_wc_1 + " AND " + poi_wc_3
                    arcpy.management.SelectLayerByAttribute(poi_layer, "NEW_SELECTION", poi_wc, None)
                    poi_count_deleted = int(arcpy.GetCount_management(poi_layer)[0])
                    if poi_count_deleted > 0:
                        arcpy.DeleteFeatures_management(poi_layer)
                    else:
                        arcpy.AddIDMessage("WARNING", 180259)
                else:
                    arcpy.AddIDMessage("WARNING", 180259)

            delimiter = self.getdelimiter(room_fc)

            for level in building_levels:
                level_id = level[0]
                entryways_name = self.getLevel(entryways_names, level_id)
                if entryways_name == None:
                    continue
                #Step 10: Select POI features in selected building and levels and delete and then copy to POI
                if self.isLegacyPOI:
                    poi_wc = self.Details_F8_FACILITYID + " IN " + "(" + str(building_fc_selected_list)[1:-1] + ")" + " AND " + self.Details_F9_LEVELID + " = '" + str(level_id) + "'"
                    arcpy.management.SelectLayerByAttribute(poi_layer, "NEW_SELECTION", poi_wc, None)
                    #Compute it from POI FC
                    #Append entryways attributes to POI - use SOURCE_NAME to identify updated features
                    arcpy.management.CalculateField(entryways_name, "SOURCE_NAME", "'NEW_FEATURE'", "PYTHON3", '')
                self.appendPoiFeatures(entryways_name, poi_layer, self.fieldlist, entryway_use_type)
                #Calculate category_type, category_subtype, location-type, use-type
                if self.isLegacyPOI:
                    arcpy.management.SelectLayerByAttribute(poi_layer, "NEW_SELECTION", "SOURCE_NAME = 'NEW_FEATURE'", None)

                    oid_fieldname = arcpy.Describe(poi_fc).OIDFieldName
                    func = 'func(!' + 'LEVEL_ID' + '!, !' + oid_fieldname + '!' + ', ' + "'" + delimiter + "'" + ')'
                    arcpy.management.CalculateField(poi_layer, "POINT_OF_INTEREST_ID",
                                                func, "PYTHON3",
                                                "def func(x,y, delimiter):\n    val = str(x) + str(delimiter) + str(y)\n    return val")
                    #For calc field, single quote need to handled in a special way
                    if entryway_use_type and self.useTypeParam == None:
                        entryway_use_type_calc = IndoorsUtilsModule.handleSingleQuoteForCalcField(entryway_use_type)
                        arcpy.management.CalculateField(poi_layer, "USE_TYPE", entryway_use_type_calc, "PYTHON3", '')
                if self.isLegacyDataset and self.isLegacyPOI == True:
                    arcpy.management.CalculateField(poi_layer, self.POI_SOURCE_PATH, repr(source_path_units) , "PYTHON3", '')
                    arcpy.management.CalculateField(poi_layer, self.POI_SOURCE_TYPE, "'" + "Indoors" + "'", "PYTHON3", '')
                    arcpy.management.CalculateField(poi_layer, self.POI_SOURCE_METHOD, "'" + "Generate Building Entryways tool" + "'", "PYTHON3", '')
                    arcpy.management.CalculateField(poi_layer, self.POI_SOURCE_NAME, "'" + "ArcGIS" + "'", "PYTHON3", '')
                    #Apply z values
                    with arcpy.da.UpdateCursor(poi_layer, ["SHAPE@Z", self.POI_ELEVATION_RELATIVE]) as updateRows:
                        for row in updateRows:
                            row[0] = row[1]
                            updateRows.updateRow(row)

                arcpy.AddIDMessage("INFORMATIVE", 180260, level_id)
            #End of for loop

            self.addLayerToMap(indoors_gdb, poi_fc)
        except LicenseError as e:
            # You must have an Advanced license and a 3D Analyst license to run this tool.
            arcpy.AddIDMessage("ERROR", 180003)
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
        finally:
            arcpy.CheckInExtension("3D")
            arcpy.CheckInExtension("Indoors")
        if scratch_folder_gdb:
            try:
                self.deleteTempData(scratch_folder_gdb, templist)
            except:
                pass
            return

    def addFieldsTargetFC(self, poiFC, levelIDField, useTypeField):
        try:
            if levelIDField is None:
                levelIDField = self.Levels_LEVEL_ID
            if useTypeField is None:
                useTypeField = self.POI_USE_TYPE

            field_names = [field.name.upper() for field in arcpy.ListFields(poiFC)]
            if levelIDField.upper() not in field_names:
                if levelIDField == self.Levels_LEVEL_ID:
                    arcpy.management.AddField(poiFC, self.Levels_LEVEL_ID, "TEXT", None, None, 255, "Level ID",
                                          "NULLABLE", "NON_REQUIRED", '')
                else:
                    arcpy.management.AddField(poiFC,levelIDField, "TEXT", None, None, 255, levelIDField,
                                              "NULLABLE", "NON_REQUIRED", '')
            else:
                #check if the field name is text and length is 255
                for field in arcpy.ListFields(poiFC):
                    if field.name.upper() == levelIDField.upper():
                        if field.type != "String" or field.length != 255:
                            arcpy.AddIDMessage("ERROR", 180263, levelIDField, "255")
                            return False


            if useTypeField.upper() not in field_names:
                if useTypeField == self.POI_USE_TYPE:
                    arcpy.management.AddField(poiFC, self.POI_USE_TYPE, "TEXT", None, None, 50, "Use Type",
                                          "NULLABLE", "NON_REQUIRED", '')
                else:
                    arcpy.management.AddField(poiFC, useTypeField, "TEXT", None, None, 50, useTypeField,
                                              "NULLABLE", "NON_REQUIRED", '')
            else:
                #check if the field name is text and length is 50
                for field in arcpy.ListFields(poiFC):
                    if field.name.upper() == useTypeField.upper():
                        if field.type != "String" or field.length != 50:
                            arcpy.AddIDMessage("ERROR", 180263, useTypeField, "50")
                            return False
            return True
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
            return False

    def validateDetailsLayer(self, details_fc):
        try:
            # if details_fc is a string pointing to feature class, exit. We need a feature layer with selection for doors
            details_fc_desc = arcpy.Describe(details_fc)
            if hasattr(details_fc_desc, "isFeatureLayer"):
                if details_fc.isFeatureLayer == False:
                    arcpy.AddIDMessage("ERROR", 180261)
                    return False
            # else:
            #      arcpy.AddIDMessage("ERROR", 180261)
            #      return False
            details_fields = ["FACILITY_NAME", "FACILITY_ID", "LEVEL_ID", "LEVEL_NUMBER"]
            details_fields_new = ["LEVEL_ID"]

            if self.isLegacyDataset:
                fieldsToValidate = details_fields
            else:
                fieldsToValidate = details_fields_new
            field_names = [field.name.upper() for field in arcpy.ListFields(details_fc)]
            for field in fieldsToValidate:
                if field.upper() not in field_names:
                    arcpy.AddIDMessage("ERROR", 180251)
                    return False
            return True
        except:
            return False

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
                        activemap.addDataFromPath(fullpath)
        except:
            pass
        return

    def getSdeLayerPath(self, indoors_gdb, layer):
        #Get fullpath for SDE layer or FGDB layer for comparison
        try:
            desc = arcpy.Describe(indoors_gdb)
            if desc.workspaceType == 'RemoteDatabase':
                datasource = layer.dataSource
                ds = datasource.split(",")
                d = {}
                for item in ds:
                    dssplit = item.split("=")
                    d[dssplit[0]] = dssplit[1]
                fds = d["Feature Dataset"]
                layername = d["Dataset"]
                layer_fullpath = os.path.join(indoors_gdb, fds, layername)
            else:
                layer_fullpath = layer.dataSource
            return layer_fullpath
        except:
            return  None

    def getFacilityLevels(self, facilityFC, levelFC, buildingName):
        try:
            buildingName = IndoorsUtilsModule.handleSingleQuoteForQuery(buildingName)
            whereclause = self.Facilities_F8_FACILITY_NAME + " = " + buildingName
            buildingID = ""
            with arcpy.da.SearchCursor(facilityFC, [self.Facilities_F8_FACILITYID], whereclause) as cursor:
                for row in cursor:
                    buildingID = row[0]
                    break
            buildingID = IndoorsUtilsModule.handleSingleQuoteForQuery(buildingID)
            if buildingID is None:
                return None
            whereClause = self.Levels_FACILITY_ID + " = " + buildingID
            with arcpy.da.SearchCursor(levelFC, [self.Levels_NAME_SHORT], whereClause) as cursor:
                return sorted({row[0] for row in cursor})
        except:
            return None

    def getUsetypeQuery(self, details_fc, details_fc_field, details_fc_field_list):
        try:
            fieldtype = None
            queryvalue = None
            fields = arcpy.ListFields(details_fc)
            for field in fields:
                if field.name.lower() == details_fc_field.lower():
                    fieldtype = field.type
                    break
            if fieldtype in ["Integer", "SmallInteger"]:
                queryvalue = [int(item) for item in details_fc_field_list]
            elif fieldtype in ["Single", "Double"]:
                queryvalue = [float(item) for item in details_fc_field_list]
            elif fieldtype in ["String"]:
                queryvalue = [item.strip("'") for item in details_fc_field_list]
            return queryvalue
        except:
            return None

    def getdelimiter(self, room_fc):
        try:
            # Get delimiter for POI ID
            delimiter = ""
            with arcpy.da.SearchCursor(room_fc, [self.Units_F9_LEVELID]) as cursor:
                for row in cursor:
                    s = row[0]
                    if s.find(".") > 0:
                        delimiter = "."
                    elif s.find("-") > 0:
                        delimiter = "-"
                    elif s.find("_") > 0:
                        delimiter = "_"
                    else:
                        pass
                    break
            return delimiter
        except:
            return delimiter

    def getLevel(self, entryways_names, level_number):
        try:
            return entryways_names[level_number]
        except:
            return None

    def generateFeatureClassName(self):
        digits = '0123456789'
        letters = 'abcdef'
        all_chars = digits + letters
        length = 6

        # find how many valid strings there are with their first letter in position i
        pos_weights = [10 ** i * 6 * 16 ** (length - 1 - i) for i in range(length)]
        pos_c_weights = [sum(pos_weights[0:i + 1]) for i in range(length + 1)]

        # choose a random slot among all the allowed strings
        r = random.randint(0, pos_c_weights[-1])

        # find the position for the first letter in the string
        first_letter = bisect.bisect_left(pos_c_weights, r) - 1

        # choose the corresponding string from among all that fit this pattern
        offset = r - pos_c_weights[first_letter]
        val = ''
        # convert the offset to a collection of indexes within the allowed strings
        # the space of allowed strings has dimensions
        # 10 x 10 x ... (for digits) x 6 (for first letter) x 16 x 16 x ... (for later chars)
        # so we can index across it by dividing into appropriate-sized slices
        for i in range(length):
            if i < first_letter:
                offset, v = divmod(offset, 10)
                val += digits[v]
            elif i == first_letter:
                offset, v = divmod(offset, 6)
                val += letters[v]
            else:
                offset, v = divmod(offset, 16)
                val += all_chars[v]

        val = 'T_' + val
        return val

    def createDissolvedDoorFC(self, out_path, out_name, geometry_type, templateFC, has_m, has_z):
        spatial_ref = arcpy.Describe(templateFC).spatialReference
        arcpy.CreateFeatureclass_management(out_path, out_name, geometry_type, templateFC,
                                            has_m, has_z, spatial_ref)
        return

    def appendPoiFeatures(self, source_fc, target_fc, fieldlist, entryway_use_type):
        #self.appendFeatures(entryways_name, poi_layer, fieldlist)
        try:
            source_fields = arcpy.ListFields(source_fc)
            target_fields = arcpy.ListFields(target_fc)
            oid_fieldname = arcpy.Describe(source_fc).OIDFieldName
            fieldMappings = arcpy.FieldMappings()
            fieldlist_upper = [x.upper() for x in fieldlist]
            targetFieldList = [x.name.upper() for x in target_fields]
            sourceFieldNames = []
            for sf in source_fields:
                if str(sf.name).upper() in fieldlist_upper and str(sf.name).upper() in targetFieldList:
                    fldMap = arcpy.FieldMap()
                    fldMap.addInputField(source_fc, sf.name)  # Source feature class
                    out_field = fldMap.outputField
                    out_field.name, out_field.aliasName, out_field.type = sf.name, sf.aliasName, sf.type
                    #if str(sf.name).upper() == "DETAIL_ID":
                    #    out_field.name, out_field.aliasName, out_field.type = "POINT_OF_INTEREST_ID", "Point Of Interest ID", "TEXT"
                    #else:
                    #    out_field.name, out_field.aliasName, out_field.type = sf.name, sf.aliasName, sf.type
                    fldMap.outputField = out_field
                    fieldMappings.addFieldMap(fldMap)
                sourceFieldNames.append(sf.name.lower())
            if self.levelIDParam:
                fMap = arcpy.FieldMap()
                if self.levelIDParam.lower() != self.Levels_LEVEL_ID.lower() and self.levelIDParam.lower() not in sourceFieldNames:
                    arcpy.management.AddField(source_fc, self.levelIDParam, "TEXT", None, None, 255, self.levelIDParam, "NULLABLE", "NON_REQUIRED", '')
                    updateFieldsList = [self.Levels_LEVEL_ID, self.levelIDParam]
                    with arcpy.da.UpdateCursor(source_fc, updateFieldsList) as updateRows:
                        for updateRow in updateRows:
                            updateRow[1] = updateRow[0]
                            updateRows.updateRow(updateRow)
                    fMap.addInputField(source_fc, self.levelIDParam)
                else:
                    fMap.addInputField(source_fc, self.Levels_LEVEL_ID)
                outField = fMap.outputField
                outField.name = self.levelIDParam
                fMap.outputField = outField
                fieldMappings.addFieldMap(fMap)
            if self.useTypeParam and entryway_use_type != None and entryway_use_type != "":
                arcpy.management.AddField(source_fc, self.useTypeParam, "TEXT", None, None, 50, self.useTypeParam,
                                          "NULLABLE", "NON_REQUIRED", '')
                entryway_use_type_calc = IndoorsUtilsModule.handleSingleQuoteForCalcField(entryway_use_type)
                arcpy.management.CalculateField(source_fc, self.useTypeParam, entryway_use_type_calc, "PYTHON3", '')
                fMap = arcpy.FieldMap()
                fMap.addInputField(source_fc, self.useTypeParam)
                outField = fMap.outputField
                outField.name = self.useTypeParam
                fMap.outputField = outField
                fieldMappings.addFieldMap(fMap)
            elif self.useTypeParam == None and entryway_use_type != None and entryway_use_type != "":
                arcpy.management.AddField(source_fc, self.POI_USE_TYPE, "TEXT", None, None, 50, self.POI_USE_TYPE,
                                          "NULLABLE", "NON_REQUIRED", '')
                entryway_use_type_calc = IndoorsUtilsModule.handleSingleQuoteForCalcField(entryway_use_type)
                arcpy.management.CalculateField(source_fc, "USE_TYPE", entryway_use_type_calc, "PYTHON3", '')
                fMap = arcpy.FieldMap()
                fMap.addInputField(source_fc, self.POI_USE_TYPE)
                outField = fMap.outputField
                outField.name = self.POI_USE_TYPE
                fMap.outputField = outField
                fieldMappings.addFieldMap(fMap)

            if self.isLegacyPOI == False:
                fieldNames = ["SHAPE@Z", self.Levels_LEVEL_ID]
                with arcpy.da.UpdateCursor(source_fc, fieldNames) as updateCursor:
                    for row in updateCursor:
                        if row[1] in self.zValuesDict:
                            zValue = self.zValuesDict[row[1]]
                            row[0] = zValue
                            updateCursor.updateRow(row)
            arcpy.Append_management(source_fc, target_fc, "NO_TEST", fieldMappings, None)
            return True
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180252, target_fc)
            arcpy.AddError(arcpy.GetMessages(2))
            return False
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180252, target_fc)
            arcpy.AddError("{0}".format(e))
            return False

    def getWorkspace(self, room_fc):
        dirname = os.path.dirname(arcpy.Describe(room_fc).catalogPath)
        desc = arcpy.Describe(dirname)
        if hasattr(desc, "datasetType") and desc.datasetType == 'FeatureDataset':
            dirname = os.path.dirname(dirname)
        return dirname

    def getDatasetWorkspace(self, infc):
        workspace = os.path.dirname(arcpy.Describe(infc).catalogPath)
        if arcpy.Describe(workspace).datatype.lower() == "featuredataset":
            return os.path.dirname(workspace)
        else:
            return workspace
    def deleteTempData(self, scratch_folder_gdb, templist):
        try:
            for item in templist:
                if item:
                    arcpy.management.Delete(item)
            if scratch_folder_gdb is None:
                return
            arcpy.env.workspace = scratch_folder_gdb
            try:
                fc_list = arcpy.ListFeatureClasses("*")
                for item in fc_list:
                    arcpy.management.Delete(item)
            except:
                pass
            try:
                raster_list = arcpy.ListRasters()
                for item in raster_list:
                    arcpy.management.Delete(item)
            except:
                pass
            arcpy.management.Delete(scratch_folder_gdb)
            if len(os.listdir(arcpy.env.scratchFolder)) == 0:
                arcpy.management.Delete(arcpy.env.scratchFolder)
        except:
            pass

if __name__ == '__main__':
    GenerateBuildingEntryways()