# -*- coding: utf-8 -*-
from __future__ import print_function
import arcpy
import os
import time
import IndoorsUtilsModule
import uuid
import collections
import math


class LicenseError(Exception):
    pass


def ERROR(self):
    pass

class GenerateFloorTransitions(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""

        # Constants: error handling
        self.NON_GP = "non-gp"
        self.ERROR = "error"
        self.WARNING = "warning"

        # PrelimPathways
        self.FROM_HEIGHT = "HEIGHT_FROM"
        self.TO_HEIGHT = "HEIGHT_TO"
        self.FROM_FLOOR = "LEVEL_NAME_FROM"
        self.TO_FLOOR = "LEVEL_NAME_TO"
        self.VERTICAL_ORDER = "VERTICAL_ORDER"
        self.LENGTH_3D = "LENGTH_3D"
        self.BUILDING_ID = "FACILITY_ID"
        self.DELAY = "DELAY"

        self.WALL_DISTANCE = "Pathway_to_Edge_Distance"
        self.AIIMFDS = "Indoors"
        self.PRELIMFDS = "PrelimNetwork"
        self.PRELIMNETWORK = "PrelimNetwork_ND"
        self.FDS = "Network"
        self.PATHWAYS_FC_NAME = "PrelimPathways"
        self.TRANSITIONS_FC_NAME = "PrelimTransitions"
        self.THINPATHWAYS_FC_NAME = "Pathways"
        # Facilities
        self.Facilities = "Facilities"
        self.Facilities_F8_FACILITYID = "FACILITY_ID"
        self.Facilities_ROTATION = "ROTATION"
        self.Facilities_F8_FACILITY_NAME = "NAME"
        #Levels
        self.Levels = "Levels"
        self.Levels_F8_FACILITYID = "FACILITY_ID"
        self.Levels_F9_LEVELID = "LEVEL_ID"
        self.Levels_BASE_ELEVATION = "ELEVATION_RELATIVE"
        self.Levels_VERTICALORDER = "VERTICAL_ORDER"
        ## Units
        self.Units = "Units"
        self.Units_F8_FACILITYID = "FACILITY_ID"
        self.Units_F9_LEVELID = "LEVEL_ID"
        self.Units_VERTICALORDER = "VERTICAL_ORDER"
        self.Units_ELEVATION_RELATIVE = "ELEVATION_RELATIVE"
        self.Units_LEVEL_NAME = "LEVEL_NAME"
        self.Units_FACILITY_NAME = "FACILITY_NAME"
        self.Units_UID = "UNIT_ID"
        #Details
        self.Details = "Details"
        self.Details_F8_FACILITYID = "FACILITY_ID"
        self.Details_F9_LEVELID = "LEVEL_ID"
        self.Details_NAME = "USE_TYPE"
        # Pathways
        self.PATHWAYS_FACILITYID = "FACILITY_ID"
        self.PATHWAYS_VERTICALORDER = "VERTICAL_ORDER"
        self.PATHWAYS_F9_LEVELID = "LEVEL_ID"
        #Levels
        self.LEVEL_NAME_SHORT = "NAME_SHORT"
        self.IN_MEMORY = "in_memory"
        #Transitions
        self.Trans_TRANSITION_TYPE = "TRANSITION_TYPE"
        self.Trans_TRAVEL_DIRECTION = "TRAVEL_DIRECTION"
        self.Trans_TRANSITION_RANK = "TRANSITION_RANK"
        self.Trans_LENGTH_3D = "LENGTH_3D"
        self.Trans_HEIGHT_FROM = "HEIGHT_FROM"
        self.Trans_HEIGHT_TO = "HEIGHT_TO"
        self.Trans_LEVEL_NAME_FROM = "LEVEL_NAME_FROM"
        self.Trans_LEVEL_NAME_TO = "LEVEL_NAME_TO"
        self.Trans_VERTICAL_ORDER_FROM = "VERTICAL_ORDER_FROM"
        self.Trans_VERTICAL_ORDER_TO = "VERTICAL_ORDER_TO"
        self.Trans_FACILITY_ID = "FACILITY_ID"
        self.Trans_FACILITY_NAME = "FACILITY_NAME"

        self.elevator = "ELEVATOR"
        self.stairway = "STAIRWAY"

        self.isLevelIdExistsInPathways = False
        self.levels_dict = collections.defaultdict(dict)

        self.execute()

    def deleteFC(self, fc):
        if arcpy.Exists(fc):
            result_del = arcpy.Delete_management(fc)
            while result_del.status < 4:
                time.sleep(0.2)

    def getLevelShortName(self, units_fc, facilityID):
        levelNameDict = {}
        whereClause = self.Units_F8_FACILITYID + "='" + facilityID + "'"
        with arcpy.da.SearchCursor(units_fc, [self.Units_F9_LEVELID, self.Units_LEVEL_NAME],whereClause) as cursor:
            for row in cursor:
                levelNameDict[row[0]] = row[1]
        return levelNameDict

    def getLevelsDict(self):
        try:
            if arcpy.Exists(self.Levels) == False:
                return collections.defaultdict(dict)
            
            levels_dict = collections.defaultdict(dict)
            with arcpy.da.SearchCursor(self.Levels, [self.Levels_F9_LEVELID, self.Levels_VERTICALORDER, self.Levels_F8_FACILITYID]) as cur:
                for row in cur:
                    level_id = row[0]
                    vo = row[1]
                    facility_id = row[2]
                    if level_id and facility_id:
                        if vo not in levels_dict[facility_id]:
                            levels_dict[facility_id][vo] = level_id

            return levels_dict
        except:
            return collections.defaultdict(dict)
        
    def createTransitionLines(self, facility_id, facility_fc, room_f, whereclause, transition_type,
                              pathways_fc, floor_transitions_fc, indoors_gdb, sdeQualifier):
        # Use the latest data model to generate transition lines
        try:
            #scratchGDB = arcpy.env.scratchGDB
            scratchGDB = "in_memory"
            if facility_id is None:
                arcpy.AddIDMessage("WARNING",180296)
                return False
            if not self.isLegacyDataset:
                room_f = self.updateFieldsUnits(room_f, facility_fc, facility_id, pathways_fc, whereclause)

            # Step 1: Get all elevator spaces
            room_fc = "units" + str(uuid.uuid4()).replace("-","")
            arcpy.MakeFeatureLayer_management(room_f, room_fc)
            initial_wc = whereclause #transition clause
            whereclause = self.Units_F8_FACILITYID + " = '" + facility_id + "'"
            arcpy.SelectLayerByAttribute_management(room_fc, 'NEW_SELECTION', whereclause)
            arcpy.SelectLayerByAttribute_management(room_fc, 'SUBSET_SELECTION', initial_wc)
            feat_ct = int(arcpy.GetCount_management(room_fc).getOutput(0))
            if feat_ct == 0:
                arcpy.AddIDMessage("WARNING",180276)
                return False

            # Step 2: Create centroid feature class
            centroid_fc_name = os.path.join(scratchGDB, "centroids")
            self.deleteFC(centroid_fc_name)
            #self.deleteFC("in_memory/centroids")
            d = arcpy.Describe(room_fc)
            sr = d.spatialReference
            arcpy.CreateFeatureclass_management(scratchGDB, "centroids", 'POINT', room_fc, None,
                                                             'ENABLED',
                                                             sr)
            centroidfc = centroid_fc_name
            # Step 3: Get centroid of all elevator spaces and store them in pointArray[]
            pointArray = []
            rowvalues = []
            shaft_rowvalues = []
            shafts = {}
            elevator_oids = []

            for row in arcpy.da.SearchCursor(room_fc, ["SHAPE@", "OID@", self.Units_F8_FACILITYID, self.Units_F9_LEVELID, self.Units_VERTICALORDER,self.Units_ELEVATION_RELATIVE, self.Units_LEVEL_NAME, self.Units_FACILITY_NAME, self.Units_UID]):
                pointArray.append(row[0].centroid)
                rowvalue = [row[0].centroid, row[2], row[3], row[4], row[5], row[6], row[7], row[8]]
                shaft_rowvalue = [row[0].centroid, row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7],
                                  row[8]]
                rowvalues.append(tuple(rowvalue))
                shaft_rowvalues.append(tuple(shaft_rowvalue))
                elevator_oids.append(row[1])
                #get shafts
                vertical_order = row[4]
            del row
            if len(elevator_oids) < 2:
                arcpy.AddIDMessage("WARNING", 180297)
                return False
            levelNameDict = self.getLevelShortName(room_fc, facility_id)
            if len(levelNameDict.keys()) == 0:
                arcpy.AddIDMessage("ERROR", 180304)
                return False
            # Step 4: add centroid points to centroid feature class
            with arcpy.da.InsertCursor(centroidfc, ["SHAPE@", self.Units_F8_FACILITYID, self.Units_F9_LEVELID,
                                                        self.Units_VERTICALORDER, self.Units_ELEVATION_RELATIVE,
                                                        self.Units_LEVEL_NAME, self.Units_FACILITY_NAME,
                                                        self.Units_UID]) as cursor:
                for rowvalue in rowvalues:
                    cursor.insertRow(rowvalue)


            # Elevator shaft - a spatial approach is used to handle elevator shafts starting at different levels of buildings
            shafts1 = {}
            centroid_layer = "centroid" + str(uuid.uuid4()).replace("-","")
            arcpy.MakeFeatureLayer_management(centroidfc, centroid_layer)
            oid_fieldname = arcpy.Describe(centroid_layer).OIDFieldName

            center_rows = []
            with arcpy.da.SearchCursor(centroid_layer, ["OID@", "UNIT_ID"]) as cursor:  # self.Units_UID
                for row in cursor:
                    a = [row[0], row[1]]
                    center_rows.append(a)

            for row1 in center_rows:
                if len(elevator_oids) == 0:
                    break
                whereclause = oid_fieldname + " = " + str(
                    row1[0]) + " and " + self.Units_F8_FACILITYID + " = '" + facility_id + "'"

                arcpy.SelectLayerByAttribute_management(centroid_layer, 'NEW_SELECTION', whereclause)
                arcpy.SelectLayerByLocation_management(room_fc, 'INTERSECT', centroid_layer)
                arcpy.SelectLayerByAttribute_management(room_fc, 'SUBSET_SELECTION', initial_wc)

                levelmin = 9999
                shaft_name = ""
                shaft_rowvalues1 = []
                with arcpy.da.SearchCursor(room_fc,
                                               ["SHAPE@", "OID@", self.Units_F8_FACILITYID, self.Units_F9_LEVELID,
                                                self.Units_VERTICALORDER, self.Units_ELEVATION_RELATIVE,
                                                self.Units_LEVEL_NAME, self.Units_FACILITY_NAME, self.Units_UID]) as roomcursor:
                    for r in roomcursor:
                        shaft_rowvalue1 = [r[0].centroid, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]]
                        shaft_rowvalues1.append(shaft_rowvalue1)
                        oid = r[1] #oid of room
                        if oid in elevator_oids:
                            elevator_oids.remove(oid)
                        level = r[4]  # vertical order
                        if level is None:
                            arcpy.AddIDMessage("ERROR", 180305)
                            return False
                        if level < levelmin:
                            levelmin = level
                            shaft_name = r[8]  # Units_UID
                    shafts1[shaft_name] = shaft_rowvalues1

            elevatorshaft_points = shafts1
            # Cycle through each elevator shaft
            centroid_layer = arcpy.MakeFeatureLayer_management(centroidfc)
            pathways_layer = arcpy.MakeFeatureLayer_management(pathways_fc)

            for shaftkey in elevatorshaft_points.keys():
                arcpy.AddIDMessage("INFORMATIVE",180277, str(shaftkey))
                elevatorLevelPoints = elevatorshaft_points[shaftkey]
                if len(elevatorLevelPoints) < 2:
                    arcpy.AddIDMessage("WARNING", 180298, str(shaftkey))
                    continue
                # {key: [[level1data], [level2data], [level3data]]
                level_nearestPathway = {}
                level_elevation = {}
                level_shaft = {}
                level_rowvalues = {}
                shaft_units = []
                for elevatorLevel in elevatorLevelPoints:
                    unitfc_oid = elevatorLevel[2]
                    facilityId = str(elevatorLevel[3])
                    elevatorLevelid = str(elevatorLevel[4])
                    level = elevatorLevel[5]  # VERTICALORDER
                    base_elevation = elevatorLevel[6]
                    f9_levelname = levelNameDict.get(str(elevatorLevel[4]))
                    f8_facilityname = elevatorLevel[8]
                    unit_name = elevatorLevel[9]
                    level_rowvalues[level] = elevatorLevel

                    unit_attributes = {
                        self.Units_F8_FACILITYID: facilityId,
                        self.Units_F9_LEVELID: elevatorLevelid,
                        self.Units_VERTICALORDER: level,
                        self.Units_ELEVATION_RELATIVE: base_elevation,
                        self.Units_LEVEL_NAME: f9_levelname,
                        self.Units_FACILITY_NAME: f8_facilityname,
                        self.Units_UID: unit_name
                    }
                    for fieldName,attributeValue in unit_attributes.items():
                        if attributeValue is None:
                            arcpy.AddIDMessage("ERROR", 180306, fieldName)
                            return False

                    # Find pathway feature Near to centroid
                    whereclause1 = self.Units_VERTICALORDER + " = " + str(
                        level) + " AND " + self.Units_UID + " = '" + unit_name + "'" + " and " + self.Units_F8_FACILITYID + " = '" + facility_id + "'"
                    arcpy.SelectLayerByAttribute_management(centroid_layer, 'NEW_SELECTION', whereclause1)

                    whereclause2 = self.Units_VERTICALORDER + " = " + str(
                        level) + " AND " + self.Units_F8_FACILITYID + " = '" + facilityId + "'"

                    arcpy.SelectLayerByAttribute_management(pathways_layer, 'NEW_SELECTION', whereclause2)
                    arcpy.analysis.Near(centroid_layer, pathways_layer, "2 Meters", "LOCATION", "NO_ANGLE", "PLANAR")
                    with arcpy.da.UpdateCursor(centroidfc,
                                                   ["NEAR_FID", self.Units_ELEVATION_RELATIVE, self.Units_F8_FACILITYID,
                                                    self.Units_F9_LEVELID, self.Units_UID],
                                                   whereclause1) as cursor:
                        # Circumvent the bug where Near does not honor selections and clears values for unselected features
                        for row in cursor:
                            level_nearestPathway[int(level)] = row[0]
                            level_elevation[int(level)] = row[1]
                            unit_name = str(row[4])
                            level_shaft[unit_name] = [row[0], row[1], row[2], row[3], row[4]]
                            shaft_units.append("'" + str(row[4]) + "'")

                # Update centroid layer with correct near_fid values using level_shaft dictionary
                oidlist = ",".join([str(x) for x in shaft_units])
                wclause = self.Units_UID + " IN (" + oidlist + ")" + " and " + self.Units_F8_FACILITYID + " = '" + facility_id + "'"
                arcpy.SelectLayerByAttribute_management(centroid_layer, "CLEAR_SELECTION")
                with arcpy.da.UpdateCursor(centroidfc, [self.Units_UID, "NEAR_FID"], wclause) as cursor:
                    near_fid_list = []

                    # Fix the value of near_fid in centroid FC, and get a list of near_fid values for this elevator shaft
                    for row in cursor:
                        unit_name = row[0]
                        rowval = level_shaft[unit_name]
                        near_fid = rowval[0]
                        near_fid_list.append(str(near_fid))
                        rowvalue = (unit_name, near_fid)
                        cursor.updateRow(rowvalue)

                point_vo_levelname = {}
                pointlevel = {}
                oidlist = b = ",".join([str(x) for x in near_fid_list])
                objectid = arcpy.Describe(pathways_fc).OIDFieldName
                whereclause = objectid + " in (" + oidlist + ")" + " and " + self.Units_F8_FACILITYID + " = '" + facility_id + "'"
                with arcpy.da.SearchCursor(pathways_fc, ['SHAPE@', self.VERTICAL_ORDER, self.FROM_FLOOR], whereclause) as pathcur:
                    count = 0
                    fnode = None
                    for row in pathcur:
                        count += 1
                        shape = row[0]
                        level = int(row[1])
                        if count == 1:
                            fnode = shape.firstPoint
                            pointlevel[level] = fnode
                            point_vo_levelname[level] = row[2]
                        else:
                            # Reuse the previous point so the elevator line is straight
                            point_elev = arcpy.Point(fnode.X, fnode.Y, shape.firstPoint.Z)
                            pointlevel[level] = point_elev
                            point_vo_levelname[level] = row[2]
                        pt = pointlevel[level]
                #del pathcur
                if count < 2:   #need at least 2 points to generate a line
                    arcpy.AddIDMessage("WARNING", 180298,str(shaftkey))
                    continue
                else:
                    # Use these points to create floor transition lines from bottom floor to the top floor
                    elevator_level_names = []
                    elevator_points = []
                    level_values = []
                    for levelkey in sorted(pointlevel.keys()):
                        # levelkey = vertical order
                        # for the given vertical order, get the list of values for unit polygon
                        level_value = level_rowvalues[levelkey]
                        level_values.append(level_value)
                        pt = pointlevel[levelkey]
                        elevator_points.append(pt)
                        elevator_level_names.append(point_vo_levelname[levelkey])
                        if len(elevator_points) == 2:
                            # Get height
                            length3D = elevator_points[1].Z - elevator_points[0].Z
                            # create line
                            with arcpy.da.InsertCursor(floor_transitions_fc,
                                                           ["SHAPE@", self.Trans_TRANSITION_TYPE,
                                                            self.Trans_TRAVEL_DIRECTION,
                                                            self.Trans_TRANSITION_RANK, self.Trans_LENGTH_3D,
                                                            self.Trans_HEIGHT_FROM, self.Trans_HEIGHT_TO,
                                                            self.Trans_LEVEL_NAME_FROM, self.Trans_LEVEL_NAME_TO,
                                                            self.Trans_VERTICAL_ORDER_FROM,
                                                            self.Trans_VERTICAL_ORDER_TO, self.Trans_FACILITY_ID,
                                                            self.Trans_FACILITY_NAME]) as cursor:
                                array = arcpy.Array(elevator_points)
                                polyline = arcpy.Polyline(array, sr, True)
                                # base_elevation, base_elevation, f9_levelname, f9_levelname, levelkey, levelkey, facilityId, f8_facilityname
                                level_value_lower = level_values[0]
                                level_value_upper = level_values[1]
                                # Default values for elevator. Change it for other transition mode such as stairway
                                #access_pedestrian = True
                                #access_wheelchair = True
                                transition_type_value = 4  # default for elevator
                                if transition_type == "STAIRWAY":
                                    #access_pedestrian = True
                                    #access_wheelchair = False
                                    transition_type_value = 2
                                    length3D = 3 * length3D
                                vo_lower = level_value_lower[5]
                                vo_upper = level_value_upper[5]
                                cursor.insertRow([
                                    polyline, transition_type_value, "1", 1, length3D,
                                    level_value_lower[6], level_value_upper[6], point_vo_levelname[vo_lower], point_vo_levelname[vo_upper],
                                    level_value_lower[5], level_value_upper[5],level_value_lower[3],level_value_lower[8]])
                            #del cursor
                            elevator_points = [elevator_points[1]]  #initialize for the next floor
                            level_values = [level_values[1]]        #initialize for the next floor
                            if transition_type_value == 2:
                                arcpy.AddIDMessage("INFORMATIVE",180278,str(shaftkey),str(level_value_lower[7]))
                            elif transition_type_value == 4:
                                arcpy.AddIDMessage("INFORMATIVE",180279,shaftkey,str(level_value_lower[7]) )

            self.deleteFC(centroid_fc_name)
            return True
        except Exception as e:
           arcpy.AddIDMessage("WARNING", 180299)
           return False


    def validateInputsForFeatureCount(self,fc, test_field_list, has_features_test, check_level_id_field=False):
        #fc is full path to feature class or table
        #Check if the feature class exists

        if arcpy.Exists(fc) == False:
            #desc = arcpy.Describe(fc)
            arcpy.AddIDMessage("ERROR", 180307,fc)
            return False


        #Check if there are features
        if has_features_test:
            feat_ct = int(arcpy.GetCount_management(fc).getOutput(0))
            if feat_ct == 0:
                arcpy.AddIDMessage("ERROR", 180308, fc)
                return False

        #Check if the feature class/table has required fields
        if test_field_list is not None or check_level_id_field:
            fields = arcpy.ListFields(fc)
            field_names = [field.name.upper() for field in fields]

            if test_field_list is not None:
                for test_field_name in test_field_list:
                    if test_field_name not in field_names:
                        arcpy.AddIDMessage("ERROR", 180309, test_field_name,fc)
                        return False
                
            if check_level_id_field:
                self.isLevelIdExistsInPathways = True if self.PATHWAYS_F9_LEVELID.upper() in field_names else False
    
        return True

    def isNetworkDataset(self, indoors_gdb_path):
        if self.isLegacyDataset:
            networkDatasetName = self.PRELIMFDS
        else:
            networkDatasetName = self.prelimDatasetName
        network_ds = os.path.join(indoors_gdb_path, self.sdeQualifier + networkDatasetName) #FDS = PrelimNetwork
        network_path = os.path.join(network_ds, self.sdeQualifier + self.PRELIMNETWORK) #PrelimNetwork_ND
        is_exists = arcpy.Exists(network_path)
        if is_exists == True:
            arcpy.AddIDMessage("INFORMATIVE",180280,network_path)
        return {'is_exists':is_exists, 'network_path':network_path}

    def execute(self):
        try:
            # You must have an Advanced License to run this tool.
            minimum_advanced_license = ["ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_advanced_license:
                raise LicenseError

            parameters = arcpy.GetParameterInfo()
            arcpy.env.overwriteOutput = True

            #tbx tool
            building_fc = parameters[0].value
            room_fc = parameters[1].value
            pathways_fc = parameters[2].value
            floor_transitions_fc = parameters[3].value
            elevator_delay = parameters[4].value
            del_features = parameters[5].value
            stairway_expression = parameters[6].valueAsText
            elevator_expression = parameters[7].valueAsText

            if elevator_expression == None and stairway_expression == None:
                arcpy.AddIDMessage("ERROR", 180310)
                return
            if parameters[4].value and parameters[7].value == None:
                arcpy.AddIDMessage("WARNING", 180300)

            if elevator_expression is not None and elevator_expression not in ('', ' ', '#'):
                try:
                    arcpy.management.MakeFeatureLayer(room_fc, "ElevatorLayer", elevator_expression)
                except Exception as e:
                    arcpy.AddIDMessage("ERROR", 358)
                    return

            if stairway_expression is not None and stairway_expression not in ('', ' ', '#'):
                try:
                    arcpy.management.MakeFeatureLayer(room_fc, "StairwayLayer", stairway_expression)
                except Exception as e:
                    arcpy.AddIDMessage("ERROR", 358)
                    return

            databaseProperties = self.getDatabasePropertiesUsingUnitssFeatureClass(room_fc, pathways_fc)
            self.isLegacyDataset = databaseProperties["isLegacyDataset"]
            self.indoorsDatasetName = databaseProperties["indoorsDatasetName"]
            self.prelimDatasetName = databaseProperties["prelimDatasetName"]
            self.sdeQualifier = databaseProperties["sdeQualifier"]

            #if this is a feature layer
            building_dict = {row[0]: row[1] for row in arcpy.da.SearchCursor(building_fc,
                                                                             [self.Facilities_F8_FACILITYID,
                                                                              self.Facilities_F8_FACILITY_NAME])}
            building_id_values = list(building_dict.keys())
            indoors_gdb = self.getWorkspace(pathways_fc)
            arcpy.env.workspace = indoors_gdb
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(indoors_gdb)
            result = self.isNetworkDataset(indoors_gdb) #returns a dictionary
            is_exists = result["is_exists"]
            #network_path = result["network_path"]
            if is_exists == True:
                arcpy.AddIDMessage("ERROR", 180311)
                return

            #Validate inputs for feature count. If no features are found, exit
            if self.isLegacyDataset:
                room_fc_fields = [self.Units_F8_FACILITYID, self.Units_F9_LEVELID, self.Units_VERTICALORDER, self.Units_ELEVATION_RELATIVE, self.Units_LEVEL_NAME, self.Units_FACILITY_NAME, self.Units_UID]
                buildings_fc_fields = [self.Facilities_F8_FACILITYID, self.Facilities_ROTATION, self.Facilities_F8_FACILITY_NAME]
            else:
                room_fc_fields = ["UNIT_ID", "USE_TYPE", "NAME", "NAME_LONG", "LEVEL_ID", "AREA_GROSS", "HEIGHT_RELATIVE"]
                buildings_fc_fields = ["FACILITY_ID", "NAME", "NAME_LONG", "SITE_ID", "HEIGHT_RELATIVE"]
            pathways_fc_fields = [self.FROM_FLOOR, self.TO_FLOOR, self.VERTICAL_ORDER, self.LENGTH_3D, self.BUILDING_ID]
            transitions_fc_fields = [self.Trans_TRANSITION_TYPE,self.Trans_TRAVEL_DIRECTION,
                                     self.Trans_TRANSITION_RANK,self.Trans_LENGTH_3D,self.Trans_HEIGHT_FROM,self.Trans_HEIGHT_TO,
                                     self.Trans_LEVEL_NAME_FROM,self.Trans_LEVEL_NAME_TO,self.Trans_VERTICAL_ORDER_FROM,self.Trans_VERTICAL_ORDER_TO,
                                     self.Trans_FACILITY_ID,self.Trans_FACILITY_NAME]

            if self.validateInputsForFeatureCount(room_fc, room_fc_fields, True) == False:
                return
            if self.validateInputsForFeatureCount(building_fc, buildings_fc_fields, True) == False:
                return
            if self.validateInputsForFeatureCount(pathways_fc, pathways_fc_fields, True, check_level_id_field=True) == False:
                return
            if self.validateInputsForFeatureCount(floor_transitions_fc, transitions_fc_fields, False) == False:
                return

            #Validate Unit's data
            if self.isLegacyDataset:
                isValid = self.validateUnitsData(room_fc)
                if isValid == False:
                    return
            isValid = self.validatePathwaysData(pathways_fc)
            if isValid == False:
                return
            
            self.levels_dict = self.getLevelsDict()

            if arcpy.IsBeingEdited(floor_transitions_fc):
                arcpy.AddIDMessage("WARNING",1950)
                return

            building_id_values = [x for x in building_id_values]
            building_id_values.sort()
            for facility_id in building_id_values:
                facility_name = building_dict[facility_id]
                arcpy.AddIDMessage("INFORMATIVE",180281,str(facility_name))

                # Elevators
                oids = [] #Objectid of existing transition features
                createdTransitions = False
                if elevator_expression:
                    if del_features == True:
                        oids = self.GetExistingTransitionFeatures(facility_name, facility_id, room_fc, floor_transitions_fc, elevator_expression, None)
                    arcpy.AddIDMessage("INFORMATIVE",180282,str(facility_name))

                    createdTransitions = self.createTransitionLines(facility_id, building_fc, room_fc,
                                             elevator_expression, self.elevator,
                                             pathways_fc, floor_transitions_fc, indoors_gdb, sdeQualifier)
                    if createdTransitions and del_features == True:
                        self.DeleteTransitionFeatures(facility_name, floor_transitions_fc, oids)
                        #select prelim pathways and remove delays assigned to them
                        self.RemoveElevatorDelay(room_fc, pathways_fc, facility_id, elevator_expression)

                #Elevator delay
                if (createdTransitions) and (elevator_delay is not None) and elevator_expression:
                    arcpy.AddIDMessage("INFORMATIVE",180283, str(facility_name))
                    self.AddElevatorDelay(elevator_delay, room_fc, pathways_fc, facility_id, elevator_expression)

                    # Stairway
                if stairway_expression:
                    if del_features == True:
                        oids = self.GetExistingTransitionFeatures(facility_name, facility_id, room_fc,
                                                                  floor_transitions_fc, None, stairway_expression)
                    arcpy.AddIDMessage("INFORMATIVE", 180284, str(facility_name))

                    createdTransitions = self.createTransitionLines(facility_id, building_fc, room_fc,
                                                                    stairway_expression, self.stairway,
                                                                    pathways_fc, floor_transitions_fc, indoors_gdb,
                                                                    sdeQualifier)
                    if createdTransitions and del_features == True:
                        self.DeleteTransitionFeatures(facility_name, floor_transitions_fc, oids)

        except LicenseError:
            # You must have an Advanced License to run this tool.
            arcpy.AddIDMessage("ERROR", 180002)
        except Exception as e:
            failed = True
            arcpy.AddIDMessage("ERROR",180317)
            arcpy.AddError("{0}".format(e))
            raise
        finally:
            arcpy.CheckInExtension("Indoors")
        return

    def GetExistingTransitionFeatures(self, facility_name, facility_id, room_fc, floor_transitions_fc, elevator_expression, stairway_expression):
        #Get OIDs of existing transition features
        transitions_layer = "transitionslayer"
        room_fc_layer = "room_fc_layer"
        arcpy.MakeFeatureLayer_management(room_fc, room_fc_layer)
        arcpy.MakeFeatureLayer_management(floor_transitions_fc, transitions_layer)
        oidfieldname = arcpy.Describe(floor_transitions_fc).OIDFieldName
        if elevator_expression:
            whereclause = self.Units_F8_FACILITYID + " = '" + facility_id + "'" + " and " + self.Trans_TRANSITION_TYPE + " = 4"
            arcpy.SelectLayerByAttribute_management(transitions_layer, "NEW_SELECTION", whereclause)
            selected_oids = []
            with arcpy.da.SearchCursor(transitions_layer, [oidfieldname]) as cursor:
                for row in cursor:
                    selected_oids.append(row[0])
            return selected_oids

        if stairway_expression:
            whereclause = self.Units_F8_FACILITYID + " = '" + facility_id + "'" + " and " + self.Trans_TRANSITION_TYPE + " = 2"
            arcpy.SelectLayerByAttribute_management(transitions_layer, "NEW_SELECTION", whereclause)
            selected_oids = []
            with arcpy.da.SearchCursor(transitions_layer, [oidfieldname]) as cursor:
                for row in cursor:
                    selected_oids.append(row[0])
            return selected_oids

    def DeleteTransitionFeatures(self, facility_name, floor_transitions_fc, oids):
        if len(oids) == 0:
            return
        transitions_layer = "transitionslayer"
        arcpy.MakeFeatureLayer_management(floor_transitions_fc, transitions_layer)
        oidfieldname = arcpy.Describe(floor_transitions_fc).OIDFieldName
        whereclause = oidfieldname + " IN " + "(" + str(oids)[1:-1] + ")"
        arcpy.SelectLayerByAttribute_management(transitions_layer, "NEW_SELECTION", whereclause)
        arcpy.DeleteFeatures_management(transitions_layer)

    def generateLevelName(self, level_number):
        # Generate level_number suffix to generate intermediate feature class or table names
        # The positive levels are given a prefix P and negative levels are given a prefix N followed by level numbers
        level_name = None
        if level_number < 0:
            level_name = "N" + str(abs(level_number))
        else:
            level_name = "P" + str(abs(level_number))
        return level_name

    def RemoveElevatorDelay(self, room_fc, pathways_fc, facility_id, elevator_expression):
        # When deleting elevator transitions, remove delay from pathways intersecting elevator space
        if not self.isLegacyDataset:
            room_fc = self.temp_room_fc #Updated units FC in updateFieldsUnits function
        # Backward compatibility - Check if DELAY field exists in PRELIMPATHWAYS, else exit
        fields = arcpy.ListFields(pathways_fc)
        field_names = [field.name.upper() for field in fields]
        if not self.DELAY.upper() in field_names:
            return

        whereclause = self.PATHWAYS_FACILITYID + " = " + "'" + str(facility_id) + "'"
        vertical_orders = [(row[0]) for row in
                           arcpy.da.SearchCursor(room_fc, [self.Units_VERTICALORDER], whereclause)]
        set_vo = set(vertical_orders)
        facility_vertical_orders = list(set_vo)
        pathways_layer = "pathways_layer"
        room_layer = "room_layer"
        arcpy.MakeFeatureLayer_management(pathways_fc, pathways_layer)
        arcpy.MakeFeatureLayer_management(room_fc, room_layer)

        for vo in facility_vertical_orders:
            wclause_room = (self.Units_VERTICALORDER + " = " + str(vo)
                            + " AND " + self.Units_F8_FACILITYID + " = " + "'" + str(facility_id) + "'"
                            + " AND " + elevator_expression)
            arcpy.SelectLayerByAttribute_management(room_layer, 'NEW_SELECTION', wclause_room)
            # Pathways layer
            wc_pathways = self.PATHWAYS_VERTICALORDER + " = " + str(vo) \
                          + " AND " + self.PATHWAYS_FACILITYID + " = " + "'" + str(facility_id) + "'"
            arcpy.SelectLayerByAttribute_management(pathways_layer, 'NEW_SELECTION', wc_pathways)

            arcpy.CalculateField_management(pathways_layer, self.DELAY, "None")

    def AddElevatorDelay(self, elevator_delay_value, room_fc, pathways_fc,
                         facility_id, elevator_expression):
        # Select pathways intersecting elevator space
        # Calculate field on pathways delay=-1 this identifies the features that are being split in the next step
        # Identity on selected pathways and unit space=elevator
        # You will get pathways inside elevator and outside of item
        # Select pathways inside elevator and run field calculator DELAY=value
        # Copy identity pathways to pathways
        # Delete pathways where DELAY = -1
        # Done
        if not self.isLegacyDataset:
            room_fc = self.temp_room_fc #Updated units FC in updateFieldsUnits function
        # Backward compatibility - Check if DELAY field exists in PRELIMPATHWAYS, else exit
        fields = arcpy.ListFields(pathways_fc)
        field_names = [field.name.upper() for field in fields]
        if not self.DELAY.upper() in field_names:
            arcpy.AddIDMessage("WARNING", 180301,self.DELAY)
            return

        whereclause = self.PATHWAYS_FACILITYID + " = " + "'" + str(facility_id) + "'"
        pathways_layer = "pathways_layer"
        room_layer = "room_layer"
        arcpy.MakeFeatureLayer_management(pathways_fc, pathways_layer)
        arcpy.MakeFeatureLayer_management(room_fc, room_layer)
        arcpy.management.SelectLayerByAttribute(room_layer, "CLEAR_SELECTION")

        vertical_orders = [(row[0]) for row in
                           arcpy.da.SearchCursor(room_layer, [self.Units_VERTICALORDER], whereclause)]
        set_vo = set(vertical_orders)

        facility_vertical_orders = list(set_vo)
        for vo in facility_vertical_orders:
            arcpy.AddIDMessage("INFORMATIVE",180285,str(vo))
            vo_name = self.generateLevelName(vo)
            wclause_room = (self.Units_VERTICALORDER + " = " + str(vo)
                            + " AND " + self.Units_F8_FACILITYID + " = " + "'" + str(facility_id) + "'"
                            + " AND " + elevator_expression)
            arcpy.SelectLayerByAttribute_management(room_layer, 'NEW_SELECTION', wclause_room)
            # Pathways layer
            wc_pathways = self.PATHWAYS_VERTICALORDER + " = " + str(vo) \
                          + " AND " + self.PATHWAYS_FACILITYID + " = " + "'" + str(facility_id) + "'"

            arcpy.SelectLayerByAttribute_management(pathways_layer, 'NEW_SELECTION', wc_pathways)

            #INTERSECT = CROSSES + TOUCHES
            arcpy.SelectLayerByLocation_management(pathways_layer, 'INTERSECT', room_layer, None, "SUBSET_SELECTION")
            arcpy.SelectLayerByLocation_management(pathways_layer, "COMPLETELY_WITHIN", room_layer, None, "REMOVE_FROM_SELECTION")
            feat_ct = int(arcpy.GetCount_management(pathways_layer).getOutput(0))
            arcpy.AddIDMessage("INFORMATIVE",180286,str(feat_ct))
            # Calculate delay value for crossing prelim pathways
            arcpy.CalculateField_management(pathways_layer, self.DELAY, elevator_delay_value)


    def validateUnitsData(self, room_fc):
        desc = arcpy.Describe(room_fc)
        room_fc = desc.catalogPath #need to validate the feature class
        vertical_order_list = []
        elevation_relative_list = []
        level_name_list = []
        unit_tuple = tuple([(row[0], row[1], row[2]) for row in arcpy.da.SearchCursor(room_fc,
                                                                                      [self.Units_VERTICALORDER,
                                                                                       self.Units_ELEVATION_RELATIVE,
                                                                                       self.Units_LEVEL_NAME])])
        for t in unit_tuple:
            vertical_order_list.append(t[0])
            elevation_relative_list.append(t[1])
            level_name_list.append(t[2])
        set_vo = set(vertical_order_list)
        list_vo = list(set_vo)
        if len(list_vo) <= 1:
            arcpy.AddIDMessage("ERROR", 180313)
            return False
        set_vo = set(elevation_relative_list)
        list_vo = list(set_vo)
        if len(list_vo) <= 1:
            arcpy.AddIDMessage("ERROR", 180314)
            return False
        set_vo = set(level_name_list)
        list_vo = list(set_vo)
        if len(list_vo) <= 1:
            arcpy.AddIDMessage("ERROR", 180315)
            return False

    def validatePathwaysData(self, pathways_fc):
        # self.VERTICAL_ORDER = "VERTICAL_ORDER"
        desc = arcpy.Describe(pathways_fc)
        pathways_fc = desc.catalogPath #need to validate the feature class
        vertical_order_list = [(row[0]) for row in arcpy.da.SearchCursor(pathways_fc, [self.VERTICAL_ORDER])]
        set_vo = set(vertical_order_list)
        list_vo = list(set_vo)
        if len(list_vo) <= 1:
            arcpy.AddIDMessage("ERROR", 180316)
            return False

    def getWorkspace(self, room_fc):
        dirname = os.path.dirname(arcpy.Describe(room_fc).catalogPath)
        desc = arcpy.Describe(dirname)
        if hasattr(desc, "datasetType") and desc.datasetType == 'FeatureDataset':
            dirname = os.path.dirname(dirname)
        return dirname

    def getDatabasePropertiesUsingUnitssFeatureClass(self, unitsFC, prelimPathwaysFC):
        try:
            legacyFieldNames = [self.Units_F8_FACILITYID, self.Units_F9_LEVELID, self.Units_VERTICALORDER, self.Units_ELEVATION_RELATIVE,
                                self.Units_LEVEL_NAME, self.Units_FACILITY_NAME, self.Units_UID]

            fields = arcpy.ListFields(unitsFC)
            names = [field.name.upper() for field in fields]
            if len(set(legacyFieldNames) - set(names)) == 0:
                isLegacyDataset = True
            else:
                isLegacyDataset = False
            #Indoor dataset
            levelPath = arcpy.Describe(unitsFC).catalogPath
            array = levelPath.split("\\")  # ['Database Connections', 'agitest1.AGI.IndoorSQL01', 'agitest1.AGI.Levels']
            qualifiedDataset = array[-2]
            datasetSplit = qualifiedDataset.split(".")
            indoorsDatasetName = datasetSplit[-1]
            #Prelim ptahways
            prelimPathwaysPath = arcpy.Describe(prelimPathwaysFC).catalogPath
            array = prelimPathwaysPath.split("\\")  # ['Database Connections', 'agitest1.AGI.IndoorSQL01', 'agitest1.AGI.Levels']
            qualifiedDataset = array[-2]
            datasetSplit = qualifiedDataset.split(".")
            prelimDatasetName = datasetSplit[-1]

            if len(datasetSplit) > 1:
                sdeQualifier = ".".join(datasetSplit[:-1]) + "."
            else:
                sdeQualifier = ""
            databaseProps = {"isLegacyDataset": isLegacyDataset,
                             "indoorsDatasetName": indoorsDatasetName,
                             "prelimDatasetName": prelimDatasetName,
                             "sdeQualifier": sdeQualifier}
            return databaseProps

        except:
            return None


    def getRelativeElevationFromUnits(self, units_fc):
        try:
            # Get levelID, relative elevation from levels feature class
            levelidElevation = {}
            with arcpy.da.SearchCursor(units_fc, ["OID@", "SHAPE@", "LEVEL_ID"]) as cur:
                for row in cur:
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


    def updateFieldsUnits(self, room_fc, facility_fc, facility_id, pathways_layer, transition_wc):
        try:
            # Update/add fields to temp units feature class
            if self.isLegacyDataset:
                return

            d = arcpy.Describe(room_fc)
            sr = d.spatialReference
            ztolerance = sr.ZTolerance

            # Make a copy of units and facilities FC and add all needed fields that existed in legacy datamodel. Populate those values, and work it off.
            scratchgdb = "in_memory"
            #scratchgdb = arcpy.env.scratchGDB
            room_fc_copy = os.path.join(scratchgdb, "units" + str(uuid.uuid4()).replace("-", ""))
            room_source = "room_source"
            arcpy.MakeFeatureLayer_management(room_fc, room_source)
            arcpy.SelectLayerByAttribute_management(room_source, 'NEW_SELECTION', transition_wc)

            arcpy.CopyFeatures_management(room_source, room_fc_copy)

            levelidElevation = self.getRelativeElevationFromUnits(room_fc_copy)

            # Add all needed fields from legacy units fc
            arcpy.AddField_management(room_fc_copy, self.Units_F8_FACILITYID, "TEXT")
            arcpy.AddField_management(room_fc_copy, self.Units_VERTICALORDER, "INTEGER")
            arcpy.AddField_management(room_fc_copy, self.Units_ELEVATION_RELATIVE, "DOUBLE")
            arcpy.AddField_management(room_fc_copy, self.Units_LEVEL_NAME, "TEXT")
            arcpy.AddField_management(room_fc_copy, self.Units_FACILITY_NAME, "TEXT")
            # Populate values
            room_layer = "room_layer"
            facility_layer = "facility_layer"
            prelim_pathways_layer = "prelim_pathways_layer"
            arcpy.MakeFeatureLayer_management(room_fc_copy, room_layer)
            arcpy.MakeFeatureLayer_management(pathways_layer, prelim_pathways_layer)

            #create levelid for pathways = facility_id + level_name_from. create dict {level_id: vertical_order}
            #use dict above to assign vertical order to units using its level_id
            arcpy.management.SelectLayerByLocation(prelim_pathways_layer, "INTERSECT", room_layer, None, "NEW_SELECTION", "NOT_INVERT")

            isUseLevelId = self.isLevelIdExistsInPathways or len(self.levels_dict[facility_id]) > 0
            pathways_vo_name = {}
            pathways_wc = "FACILITY_ID = '" + facility_id + "'"
            pathwaysFields = ["SHAPE@", "VERTICAL_ORDER", "LEVEL_NAME_FROM"]
            if self.isLevelIdExistsInPathways:
                pathwaysFields.append(self.PATHWAYS_F9_LEVELID)

            with arcpy.da.SearchCursor(prelim_pathways_layer, pathwaysFields, pathways_wc) as cur:
                for row in cur:
                    vo, levelname = row[1], row[2]

                    if isUseLevelId:
                        # break if all necessary level_ids in pathways_vo_name has been filled up
                        if len(self.levels_dict[facility_id]) == len(pathways_vo_name):
                            break
                        
                        levelid = None

                        if self.isLevelIdExistsInPathways:
                            levelid = row[3]
                        else:
                            if vo in self.levels_dict[facility_id]:
                                levelid = self.levels_dict[facility_id][vo]

                        if levelid is not None and levelid not in pathways_vo_name:
                            pathways_vo_name[levelid] = (vo, levelname)
                    else:
                        #Calc z or relative elevation
                        zvalue = None
                        for part in row[0]:
                            for pnt in part:
                                if pnt:
                                    zvalue = pnt.Z
                                    break
                            if zvalue: break

                        if zvalue is not None and vo not in pathways_vo_name:
                            pathways_vo_name[vo] = (zvalue, levelname)
                                
            wc = "FACILITY_ID = '" + facility_id + "'"
            arcpy.MakeFeatureLayer_management(facility_fc, facility_layer, wc)
            facilityid_name = {}
            with arcpy.da.SearchCursor(facility_layer, ["FACILITY_ID", "NAME"]) as cur:
                for row in cur:
                    facilityid_name[row[0]] = row[1]

            arcpy.management.SelectLayerByLocation(room_layer, "INTERSECT", facility_layer, None, "NEW_SELECTION", "NOT_INVERT")
            unitsFields = [self.Units_F8_FACILITYID, self.Units_FACILITY_NAME, self.Units_LEVEL_NAME, self.Units_VERTICALORDER,
                           self.Units_ELEVATION_RELATIVE, self.Units_F9_LEVELID]
            with arcpy.da.UpdateCursor(room_layer, unitsFields) as cursor:
                for row in cursor:
                    row[0] = facility_id
                    row[1] = facilityid_name[facility_id]
                    levelid = row[5]
                    relative_elevation = levelidElevation[levelid]
                    row[4] = relative_elevation

                    vo_levelname = None
                    if isUseLevelId:
                        if levelid in pathways_vo_name:
                            vo_levelname = pathways_vo_name[levelid]
                    else:
                        for vo, (zvalue, levelname) in pathways_vo_name.items():
                            if math.isclose(relative_elevation, zvalue, rel_tol=0.0, abs_tol=ztolerance):
                                vo_levelname = (vo, levelname)
                                break

                    if vo_levelname is None:
                        continue
                    
                    vo = vo_levelname[0]
                    level = vo_levelname[1]
                    row[2] = level
                    row[3] = vo
                    cursor.updateRow(row)
            self.temp_room_fc = room_layer
            return room_layer
        except:
            return None

if __name__ == '__main__':
    GenerateFloorTransitions()