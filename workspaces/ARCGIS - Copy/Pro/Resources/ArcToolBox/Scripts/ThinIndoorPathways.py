"""
COPYRIGHT 2020 ESRI

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States.

For additional information, contact:
Environmental Systems Research Institute, Inc.
Attn: Contracts Dept
380 New York Street
Redlands, California, USA 92373

email: contracts@esri.com

---------------------------------------------------------------------------
Source Name:   GenerateIndoorsPathways.py
Version:       ArcGIS Pro 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   This script generates preliminary indoors pathways based on
               the navigation restrictions imposed by the input barrier
               detail lines and restricts generation of pathways to only
               authorized areas of travel.
---------------------------------------------------------------------------
"""

import arcpy
import datetime
import os
import uuid
import IndoorsUtilsModule

class LicenseError(Exception):
    pass

class ThinIndoorPathways(object):
    def __init__(self):
        # Define input layer constants
        self.FACILITY_ID_FIELD = "FACILITY_ID"
        self.FACILITY_ID_FIELD_TYPE = "String"
        self.FACILITY_NAME_FIELD = "FACILITY_NAME"
        self.FACILITY_NAME_FIELD_TYPE = "String"
        self.LEVEL_ID_FIELD = "LEVEL_ID"
        self.LEVEL_ID_FIELD_TYPE = "String"
        self.LEVEL_NAME_FIELD = "LEVEL_NAME"
        self.LEVEL_NAME_FIELD_TYPE = "String"
        self.LEVEL_NUMBER_FIELD = "LEVEL_NUMBER"
        self.LEVEL_NUMBER_FIELD_TYPE = "Long"
        self.ELEVATION_RELATIVE_FIELD = "ELEVATION_RELATIVE"
        self.ELEVATION_RELATIVE_FIELD_TYPE = "Double"
        self.VERTICAL_ORDER_FIELD = "VERTICAL_ORDER"
        self.VERTICAL_ORDER_FIELD_TYPE = "Long"

        # Define constants unique to the levels layer
        self.LEVELS_LAYER_NAME_FIELD = "NAME"
        self.LEVELS_LAYER_NAME_FIELD_TYPE = "String"
        self.LEVELS_LAYER_SHORT_NAME_FIELD = "NAME_SHORT"
        self.LEVELS_LAYER_SHORT_NAME_FIELD_TYPE = "String"

        # Define constants for target layer
        self.FROM_HEIGHT_FIELD = "HEIGHT_FROM"
        self.FROM_HEIGHT_FIELD_TYPE = "Double"
        self.FROM_FLOOR_FIELD = "LEVEL_NAME_FROM"
        self.FROM_FLOOR_FIELD_TYPE = "String"
        self.LENGTH_3D_FIELD = "LENGTH_3D"
        self.LENGTH_3D_FIELD_TYPE = "Double"
        self.WALL_DISTANCE_FIELD = "PATH_EDGE_DISTANCE"
        self.WALL_DISTANCE_FIELD_TYPE = "Double"

        self.TRANSITIONS_FROM_FLOOR_ID = "LEVEL_NAME_FROM"
        self.TRANSITIONS_TO_FLOOR_ID = "LEVEL_NAME_TO"
        self.SOLVE_COUNT = 50
        self.SEARCH_TOLERANCE = 5
        self.LEVELSFC = ""
        self.LEVELS_NAME_TYPE = "NAME_SHORT"
        self.PATHWAYS_LENGTH_3D = "LENGTH_3D"
        self.PATHWAYS_ANGLE = "Angle"
        self.PATHWAYS_FROM_FLOOR_ID = "LEVEL_NAME_FROM"
        self.PATHWAYS_TO_FLOOR_ID = "LEVEL_NAME_TO"
        self.PATHWAYS_FROM_HEIGHT = "HEIGHT_FROM"
        self.PATHWAYS_TO_HEIGHT = "HEIGHT_TO"
        self.PATHWAYS_VERTICAL_ORDER = "VERTICAL_ORDER"
        self.THINNED_LATTICE_FC = "ThinnedLattice"
        self.PATHWAYS_TYPE = "PATHWAY_TYPE"
        self.INPUT_PATHWAYS = ""
        self.INPUT_TRANSITIONS = ""
        self.VERTICAL_ORDER_FROM = "VERTICAL_ORDER_FROM"
        self.VERTICAL_ORDER_TO = "VERTICAL_ORDER_TO"
        self.TRANSITIONS_TYPE = "TRANSITION_TYPE"
        self.TARGET_PATHWAYS = ""
        self.DELAY = "DELAY"
        self.isLegacyDataset = None
        self.indoorsDatasetName = None
        self.sdeQualifier = None
        self.isPathwaysLegacyDataset = None
        self.execute()

    def execute(self):
        validation_failed = False
        scratch_gdb = None
        thinned_lattice_fcs_list = []
        originalWorkspace = arcpy.env.workspace
        input_pathways_has_level_id = False
        try:
            # Extension license check
            if arcpy.CheckExtension("3D") == "Available" and arcpy.CheckExtension("Network") == "Available":
                arcpy.CheckOutExtension("Network")
                arcpy.CheckOutExtension("3D")
            else:
                raise LicenseError

            # You must have an Advanced License to run this tool.
            minimum_advanced_license = ["ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_advanced_license:
                raise LicenseError

            parameters = arcpy.GetParameterInfo()
            # Get and validate input parameters
            input_floors = parameters[0].valueAsText
            input_pathways = parameters[1].valueAsText
            target_pathways = parameters[4].valueAsText
            input_transitions = parameters[2].valueAsText
            target_transitions = parameters[5].valueAsText
            routable_locations = parameters[3].valueAsText.replace("'","").split(";")#parameters[5].valueAsText
            self.INPUT_PATHWAYS = input_pathways
            self.INPUT_TRANSITIONS = input_transitions

            databaseProperties =  IndoorsUtilsModule.getDatabaseProperties(self.getWorkspace(input_floors))
            self.isLegacyDataset = databaseProperties["isLegacyDataset"]
            self.indoorsDatasetName = databaseProperties["indoorsDatasetName"]
            self.sdeQualifier = databaseProperties["sdeQualifier"]
            if not self.validateNetworkFeaturesLocation(input_pathways, input_transitions, target_pathways, target_transitions):
                return

            self.LEVELSFC = input_floors
            self.TARGET_PATHWAYS = target_pathways
            self.TARGET_TRANSITIONS = target_transitions
            # Set scratch workspace
            arcpy.env.overwriteOutput = True
            scratch_gdb = arcpy.env.scratchGDB
            arcpy.AddIDMessage("INFORMATIVE", 180176)
            if scratch_gdb is not None and scratch_gdb != '' and scratch_gdb != ' ' and scratch_gdb != '#':
                if not self.verifyScratchWorkspace(scratch_gdb):
                    scratch_gdb = self.createScratchWorkspace()
            else:
                scratch_gdb = self.createScratchWorkspace()

            search_tolerance_param = parameters[6].valueAsText
            solve_count_param = parameters[7].valueAsText
            if search_tolerance_param is not None and search_tolerance_param != "":
                self.SEARCH_TOLERANCE = int(search_tolerance_param)
            if solve_count_param is not None:
                self.SOLVE_COUNT = int(solve_count_param)

            sr = None
            sr_type = None
            inputLayers = [input_floors, input_pathways, target_pathways, input_transitions, target_transitions]
            inputLayers = inputLayers + routable_locations
            for i, fc in enumerate(inputLayers):
                if fc is not None and fc not in ('', ' ', '#'):
                    sr_compare = arcpy.Describe(fc).spatialReference
                    if sr_compare.type == "Geographic":
                        sr_type = "Geographic"
                    if sr is None:
                        sr = sr_compare
                    elif sr.name != sr_compare.name:
                        arcpy.AddIDMessage("ERROR", 180368)
                        validation_failed = True
                        break

            if sr_type is not None and sr_type == "Geographic":
                arcpy.AddIDMessage("ERROR", 45063)
                validation_failed = True

            if validation_failed:
                return

            if input_floors is not None and input_floors not in ('', ' ', '#'):
                input_floors = arcpy.management.MakeFeatureLayer(input_floors, str(uuid.uuid4()))
                if not arcpy.Exists(input_floors):
                    arcpy.AddIDMessage("ERROR", 110, input_floors)
                    validation_failed = True
                elif int(arcpy.GetCount_management(input_floors).getOutput(0)) == 0:
                    arcpy.AddIDMessage("ERROR", 180308, self.LEVELSFC)
                    validation_failed = True
                else:
                    if (self.isLegacyDataset):
                        missing_fields = IndoorsUtilsModule.findFields(input_floors, [self.FACILITY_ID_FIELD,
                                                                        self.FACILITY_NAME_FIELD,
                                                                        self.LEVEL_ID_FIELD,
                                                                        self.LEVELS_LAYER_NAME_FIELD,
                                                                        self.LEVELS_LAYER_SHORT_NAME_FIELD,
                                                                        self.LEVEL_NUMBER_FIELD,
                                                                        self.ELEVATION_RELATIVE_FIELD,
                                                                        self.VERTICAL_ORDER_FIELD])

                    else:
                        missing_fields = IndoorsUtilsModule.findFields(input_floors, [self.FACILITY_ID_FIELD,
                                                                                      self.LEVEL_ID_FIELD,
                                                                                      self.LEVELS_LAYER_NAME_FIELD,
                                                                                      self.LEVELS_LAYER_SHORT_NAME_FIELD,
                                                                                      self.LEVEL_NUMBER_FIELD,
                                                                                      self.VERTICAL_ORDER_FIELD])

                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(input_floors).name, missing_field)
                            validation_failed = True
                    field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(input_floors, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                [self.LEVEL_ID_FIELD, self.LEVEL_ID_FIELD_TYPE],
                                                                                [self.LEVELS_LAYER_NAME_FIELD, self.LEVELS_LAYER_NAME_FIELD_TYPE],
                                                                                [self.LEVELS_LAYER_SHORT_NAME_FIELD, self.LEVELS_LAYER_SHORT_NAME_FIELD_TYPE],
                                                                                [self.LEVEL_NUMBER_FIELD, self.LEVEL_NUMBER_FIELD_TYPE],
                                                                                [self.ELEVATION_RELATIVE_FIELD, self.ELEVATION_RELATIVE_FIELD_TYPE],
                                                                                [self.VERTICAL_ORDER_FIELD, self.VERTICAL_ORDER_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(input_floors).name)
                            validation_failed = True


            if input_pathways is not None and input_pathways not in ('', ' ', '#'):
                desc = arcpy.Describe(input_pathways)
                input_pathways = desc.catalogPath
                if not arcpy.Exists(input_pathways):
                    arcpy.AddIDMessage("ERROR", 110, input_pathways)
                    validation_failed = True
                elif int(arcpy.GetCount_management(input_pathways).getOutput(0)) == 0:
                    arcpy.AddIDMessage("ERROR", 180308, input_pathways)
                    validation_failed = True
                elif hasattr(desc, "hasZ") and desc.hasZ == False:
                    arcpy.AddIDMessage("ERROR", 130172, input_pathways)
                    validation_failed = True
                else:
                    missing_fields = IndoorsUtilsModule.findFields(input_pathways, [self.FACILITY_ID_FIELD,
                                                                       self.FACILITY_NAME_FIELD,
                                                                       self.VERTICAL_ORDER_FIELD,
                                                                       self.FROM_FLOOR_FIELD,
                                                                       self.LENGTH_3D_FIELD,
                                                                       self.WALL_DISTANCE_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(input_pathways).name, missing_field)
                            validation_failed = True
                    field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(input_pathways, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                   [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                   [self.VERTICAL_ORDER_FIELD, self.VERTICAL_ORDER_FIELD_TYPE],
                                                                                   [self.FROM_FLOOR_FIELD, self.FROM_FLOOR_FIELD_TYPE],
                                                                                   [self.LENGTH_3D_FIELD, self.LENGTH_3D_FIELD_TYPE],
                                                                                   [self.WALL_DISTANCE_FIELD, self.WALL_DISTANCE_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(input_pathways).name, field_error[1])
                            validation_failed = True

                    # determine if the input pathways carries LEVEL_ID.
                    # if so, we'll copy the LEVEL_ID values over to the target_pathways
                    missing_input_level_id_fields = IndoorsUtilsModule.findFields(input_pathways, [self.LEVEL_ID_FIELD])
                    if len(missing_fields) == 0:
                        level_id_field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(input_pathways, [[self.LEVEL_ID_FIELD, self.LEVEL_ID_FIELD_TYPE]])
                        if len(field_type_errors) == 0:
                            input_pathways_has_level_id = True

            if target_pathways is not None and target_pathways not in ('', ' ', '#'):
                desc = arcpy.Describe(target_pathways)
                target_pathways = desc.catalogPath
                transfer_level_ids = False
                if not arcpy.Exists(target_pathways):
                    arcpy.AddIDMessage("ERROR", 110, target_pathways)
                    validation_failed = True
                elif hasattr(desc, "hasZ") and desc.hasZ == False:
                    arcpy.AddIDMessage("ERROR", 130172, target_pathways)
                    validation_failed = True
                else:
                    missing_fields = IndoorsUtilsModule.findFields(target_pathways, [self.FACILITY_ID_FIELD,
                                                                       self.FACILITY_NAME_FIELD,
                                                                       self.VERTICAL_ORDER_FIELD,
                                                                       self.FROM_FLOOR_FIELD,
                                                                       self.LENGTH_3D_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(target_pathways).name, missing_field)
                            validation_failed = True
                    field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(target_pathways, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                   [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                   [self.VERTICAL_ORDER_FIELD, self.VERTICAL_ORDER_FIELD_TYPE],
                                                                                   [self.FROM_FLOOR_FIELD, self.FROM_FLOOR_FIELD_TYPE],
                                                                                   [self.LENGTH_3D_FIELD, self.LENGTH_3D_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(target_pathways).name, field_error[1])
                            validation_failed = True

                    # if the input pathways has the LEVEL_ID field, check to see if the LEVEL_ID field 
                    # is also present in the target pathways (may not be there for older projects)?
                    if input_pathways_has_level_id:
                        missing_level_id_field = IndoorsUtilsModule.findFields(target_pathways, [self.LEVEL_ID_FIELD])
                        if len(missing_level_id_field) == 0:

                            # not missing, so check the data type
                            # only care if it's valid - in which case we'll transfer level id values to pathways.
                            # if it's not the valid data type, the tool won't care (i.e., don't fail), just don't try to transfer values
                            level_id_field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(target_pathways, [[self.LEVEL_ID_FIELD, self.LEVEL_ID_FIELD_TYPE]])
                            if len(level_id_field_type_errors) == 0:
                                # have valid LEVEL_ID field in both input and target pathways - okay to transfer values
                                transfer_level_ids = True

            pathwaysDatabaseProperties = IndoorsUtilsModule.getDatabaseProperties(self.getWorkspace(target_pathways))
            self.isPathwaysLegacyDataset = pathwaysDatabaseProperties["isLegacyDataset"]
            networkDatasetName, datasetPath = self.getFeatureDataSet(target_pathways)
            if not networkDatasetName or  not datasetPath:
                arcpy.AddIDMessage("ERROR", 180217)
                return
            if networkDatasetName == "Network" or self.isPathwaysLegacyDataset == False:
                networkDS = os.path.join(datasetPath,"Network_ND")
                if arcpy.Exists(networkDS):
                    arcpy.AddIDMessage("ERROR", 180205)
                    return
            elif self.isPathwaysLegacyDataset == True and networkDatasetName != "Network":
                arcpy.AddIDMessage("ERROR", 180206)
                return
            if input_transitions is not None and input_transitions not in ('', ' ', '#'):
                desc = arcpy.Describe(input_transitions)
                input_transitions = desc.catalogPath
                if not arcpy.Exists(input_transitions):
                    arcpy.AddIDMessage("ERROR", 110, input_transitions)
                    validation_failed = True
                elif hasattr(desc, "hasZ") and desc.hasZ == False:
                    arcpy.AddIDMessage("ERROR", 130172, input_transitions)
                    validation_failed = True
                else:
                    missing_fields = IndoorsUtilsModule.findFields(input_transitions, [self.FACILITY_ID_FIELD,
                                                                       self.FACILITY_NAME_FIELD,
                                                                       self.VERTICAL_ORDER_FROM,
                                                                        self.VERTICAL_ORDER_TO,
                                                                       self.FROM_HEIGHT_FIELD,
                                                                       self.FROM_FLOOR_FIELD,
                                                                       self.LENGTH_3D_FIELD,
                                                                       self.WALL_DISTANCE_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(input_transitions).name, missing_field)
                            validation_failed = True
                    field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(input_transitions, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                   [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                   [self.VERTICAL_ORDER_FROM, self.VERTICAL_ORDER_FIELD_TYPE],
                                                                                    [self.VERTICAL_ORDER_TO,self.VERTICAL_ORDER_FIELD_TYPE],
                                                                                   [self.FROM_HEIGHT_FIELD, self.FROM_HEIGHT_FIELD_TYPE],
                                                                                   [self.FROM_FLOOR_FIELD, self.FROM_FLOOR_FIELD_TYPE],
                                                                                   [self.LENGTH_3D_FIELD, self.LENGTH_3D_FIELD_TYPE],
                                                                                   [self.WALL_DISTANCE_FIELD, self.WALL_DISTANCE_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(input_transitions).name, field_error[1])
                            validation_failed = True

            if target_transitions is not None and target_transitions not in ('', ' ', '#'):
                desc = arcpy.Describe(target_transitions)
                target_transitions = desc.catalogPath
                if not arcpy.Exists(target_transitions):
                    arcpy.AddIDMessage("ERROR", 110, target_transitions)
                    validation_failed = True
                elif hasattr(desc, "hasZ") and desc.hasZ == False:
                    arcpy.AddIDMessage("ERROR", 130172, target_transitions)
                    validation_failed = True
                else:
                    missing_fields = IndoorsUtilsModule.findFields(target_transitions, [self.FACILITY_ID_FIELD,
                                                                       self.FACILITY_NAME_FIELD,
                                                                       self.VERTICAL_ORDER_FROM,
                                                                        self.VERTICAL_ORDER_TO,
                                                                       self.FROM_HEIGHT_FIELD,
                                                                       self.FROM_FLOOR_FIELD,
                                                                       self.LENGTH_3D_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(target_transitions).name, missing_field)
                            validation_failed = True
                    field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(target_transitions, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                   [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                   [self.VERTICAL_ORDER_FROM, self.VERTICAL_ORDER_FIELD_TYPE],
                                                                                    [self.VERTICAL_ORDER_TO,self.VERTICAL_ORDER_FIELD_TYPE],
                                                                                   [self.FROM_HEIGHT_FIELD, self.FROM_HEIGHT_FIELD_TYPE],
                                                                                   [self.FROM_FLOOR_FIELD, self.FROM_FLOOR_FIELD_TYPE],
                                                                                   [self.LENGTH_3D_FIELD, self.LENGTH_3D_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(target_transitions).name, field_error[1])
                            validation_failed = True
            # Identify levels and buildings to process
            buildings_to_process = []
            floors_to_process = []
            with arcpy.da.SearchCursor(input_floors, [self.FACILITY_ID_FIELD, self.LEVEL_ID_FIELD, 'LEVEL_NUMBER'],
                                       sql_clause=(None, 'ORDER BY FACILITY_ID, LEVEL_NUMBER')) as cur:
                for row in cur:
                    if row[0] not in buildings_to_process:
                        buildings_to_process.append(row[0])
                    floors_to_process.append([row[0], row[1]])

            routable_fields = [self.LEVEL_ID_FIELD]
            updatedPointsFC = []
            updatedRoutableLocations = []
            poiWithNoData = []
            if routable_locations is not None:
                for routable_location in routable_locations:
                    desc = arcpy.Describe(routable_location)
                    if hasattr(desc, "hasZ") and desc.hasZ == False:
                        arcpy.AddIDMessage("ERROR", 130172, routable_location)
                        validation_failed = True
                    if not arcpy.Exists(routable_location):
                        arcpy.AddIDMessage("ERROR", 110, routable_location)
                        validation_failed = True
                    elif int(arcpy.GetCount_management(routable_location).getOutput(0)) == 0:
                        arcpy.AddIDMessage("ERROR", 180308, routable_location)
                        validation_failed = True
                    else:
                        desc = arcpy.Describe(routable_location)
                        floorField = ""
                        fieldsToValidate = routable_fields
                        missing_fields = IndoorsUtilsModule.findFields(routable_location, fieldsToValidate)
                        if len(missing_fields) > 0:
                            floorField = self.getFloorAwareField(routable_location)
                            if floorField is None or floorField == "":
                                arcpy.AddIDMessage("ERROR", 180218, arcpy.Describe(routable_location).name)
                                validation_failed = True
                                break
                        else:
                            floorField = self.LEVEL_ID_FIELD
                        #check the schema req for floorField
                        field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(routable_location, [[floorField, self.LEVEL_ID_FIELD_TYPE]])
                        if len(field_type_errors) > 0:
                            for field_error in field_type_errors:
                                arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(routable_location).name, field_error[1])
                                validation_failed = True
                                break
                        else:
                            updatedPointFC = self.createRoutablePoints(routable_location, desc.shapeType,floorField, input_floors, floors_to_process, scratch_gdb)
                            if updatedPointFC == None:
                                arcpy.AddIDMessage("WARNING", 180219, arcpy.Describe(routable_location).name)
                                poiWithNoData.append(routable_location)
                            else:
                                updatedRoutableLocations.append(routable_location)
                                updatedPointsFC.append(updatedPointFC)
            if validation_failed:
                return

            if (len(poiWithNoData) > 0):
                for poi in poiWithNoData:
                    routable_locations.remove(poi)
            if (len(updatedRoutableLocations) > 0):
                for i, val in enumerate(updatedRoutableLocations):
                    routable_locations.remove(val)
                    routable_locations.append(updatedPointsFC[i])
            else:
                #there are no poi's for the levels to be processed. Relevant messages have been shown so exit
                return


            #delete prelim n/w template
            featureDatasetName, featureDatasetPath = self.getFeatureDataSet(input_pathways)
            networkDataset = os.path.join(featureDatasetPath, "PrelimNetwork" + "_ND")
            if (arcpy.Exists(featureDatasetPath)):
                if arcpy.Exists(networkDataset):
                    arcpy.Delete_management(networkDataset)

            if self.validateTransitions(buildings_to_process, scratch_gdb) == False:
                return

            network = self.load_thinning_template(input_pathways,networkDataset)
            if network is None:
                return

            #generate_transition_points + routable locations list
            points_fcs_list = routable_locations#.replace("'","").split(";")
            transition_points_fcs_list, whereClause = self.generate_transition_points(scratch_gdb,input_transitions, floors_to_process)
            if transition_points_fcs_list is None and whereClause is None:
                return
            points_fcs_list = points_fcs_list + transition_points_fcs_list


            #for every building thin lattice
            for building in buildings_to_process:
                arcpy.AddIDMessage("INFORMATIVE", 180076, building)
                # Build list of floors to process for target building
                building_floors = []
                for floor in floors_to_process:
                    if floor[0] == building:
                        building_floors.append(floor[1])

                if len(building_floors) > 0:
                    points_layers_list = []

                    for fc in points_fcs_list:
                        fc_name = arcpy.Describe(fc).baseName + '{:%Y_%m_%d_%H%M%S}'.format(datetime.datetime.now())
                        points_lyr = "points_" + fc_name
                        points_layers_list.append(points_lyr)
                        qry = self.FACILITY_ID_FIELD + " = '" + building + "'"
                        arcpy.MakeFeatureLayer_management(fc, points_lyr, qry)

                    thinnedLattice = self.thin_lattice(building,building_floors, network, points_layers_list,fc_name,scratch_gdb, transfer_level_ids)
                    if thinnedLattice is None:
                        continue
                    thinned_lattice_fcs_list.append(thinnedLattice)

            #load final n/w
            if len(thinned_lattice_fcs_list) > 0:
                self.load_final_network(scratch_gdb, thinned_lattice_fcs_list, whereClause)

            #if self.deleteTempPrelimPathways == True:
            #    self.cleanPrelimDataset(network, thinning_template, output_gdb)
            #apply elevator delay

                wkspc = self.getWorkspace(self.TARGET_PATHWAYS)
                #Insert elevator delay code here
                with arcpy.da.Editor(wkspc) as edit:
                    for building in buildings_to_process:
                        arcpy.AddIDMessage("INFORMATIVE",180177,building)
                        # Build list of floors to process for target building
                        building_floors = []
                        for floor in floors_to_process:
                            if floor[0] == building:
                                building_floors.append(floor[1])
                        self.ApplyElevatorDelay(building, building_floors, transfer_level_ids)


        except LicenseError as e:
            # You must have an Advanced license, a Network Analyst license, and a 3D Analyst license to run this tool.
            arcpy.AddIDMessage("ERROR", 180006)
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180212)
            arcpy.AddError(arcpy.GetMessages(2))
            return
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180212)
            arcpy.AddError("{0}".format(e))
            return
        finally:
            try:
                arcpy.env.workspace = originalWorkspace
                arcpy.CheckInExtension("Indoors")
                arcpy.CheckInExtension("3D")
                arcpy.CheckInExtension("Network")

                for temp_fc in thinned_lattice_fcs_list:
                    if arcpy.Exists(temp_fc):
                        arcpy.Delete_management(temp_fc)
                edit = None
            except:
                pass

    def validateNetworkFeaturesLocation(self, input_pathways, input_transitions, target_pathways, target_transitions):
        try:
            featureDatasetName, featureDatasetPath = self.getFeatureDataSet(input_pathways)
            if not featureDatasetName or not featureDatasetPath:
                arcpy.AddIDMessage("ERROR", 180216)
                return False
            networkDatasetNameTrans, datasetPathTrans = self.getFeatureDataSet(input_transitions)
            if not networkDatasetNameTrans or not datasetPathTrans:
                arcpy.AddIDMessage("ERROR", 180216)
                return False

            networkDatasetName, datasetPath = self.getFeatureDataSet(target_pathways)
            if not networkDatasetName or not datasetPath:
                arcpy.AddIDMessage("ERROR", 180217)
                return False
            networkDatasetNameTrans, datasetPathTrans = self.getFeatureDataSet(target_transitions)
            if not networkDatasetNameTrans or not datasetPathTrans:
                arcpy.AddIDMessage("ERROR", 180217)
                return False
            return True
        except:
            return False

    def getFloorAwareField(self, routable_location):
        try:
            desc = arcpy.Describe(routable_location)
            project = arcpy.mp.ArcGISProject("CURRENT")
            if (project == None):
                return None
            else:
                currentMap = project.activeMap.name
                for map in project.listMaps():
                    if (map.name == currentMap):
                        for lyr in map.listLayers():
                            layer_cim = None
                            try:
                                if hasattr(lyr, 'dataSource'):
                                    if lyr.dataSource == desc.catalogPath and lyr.isFeatureLayer:
                                        layer_cim = lyr.getDefinition('V2')
                                    elif "Dataset" in lyr.dataSource:
                                        layerSource = lyr.dataSource.split(",")
                                        datasetProps = layerSource[len(layerSource) - 1]
                                        datasetName = datasetProps.split("=")
                                        datasetName = datasetName[1]
                                        if (datasetName == desc.baseName):
                                            layer_cim = lyr.getDefinition('V2')
                                    if layer_cim is not None and layer_cim.featureTable is not None and layer_cim.featureTable.floorAwareTableProperties is not None:
                                        cimFeatureTable = layer_cim.featureTable
                                        if cimFeatureTable.floorAwareTableProperties.floorField is not None:
                                            floorAwareField = cimFeatureTable.floorAwareTableProperties.floorField
                                            return floorAwareField
                            except:
                                continue

            return None
        except Exception as e:
            return None

    def createRoutablePoints(self, routable_location, shapeType, floorField, levelsFC, floorsToProcess, scratch_gdb):
        try:
            scratchGDB = scratch_gdb#"in_memory"
            #scratchGDB = arcpy.env.scratchGDB

            pointFCName = arcpy.Describe(routable_location).baseName
            fcNameArr = pointFCName.split('.')
            pointFCName = fcNameArr[len(fcNameArr) - 1]
            unitsPoints = pointFCName + "_" + '{:%Y_%m_%d_%H%M%S}'.format(datetime.datetime.now())
            unitsPoints = os.path.join(scratchGDB, unitsPoints)
            if shapeType == "Polygon":
                arcpy.FeatureToPoint_management(routable_location, unitsPoints, "INSIDE")
                arcpy.management.JoinField(unitsPoints, floorField, levelsFC, self.LEVEL_ID_FIELD, None)
                zvaluesDict = {}
                with arcpy.da.SearchCursor(levelsFC, ["SHAPE@", self.LEVEL_ID_FIELD]) as searchCursor:
                    for row in searchCursor:
                        shape = row[0]
                        firstPoint = shape.firstPoint
                        if (firstPoint.Z not in zvaluesDict):
                            zvaluesDict[row[1]] = firstPoint.Z
                for key, value in zvaluesDict.items():
                    query = floorField + "='" + key + "'"
                    with arcpy.da.UpdateCursor(unitsPoints, ["SHAPE@Z", floorField], query) as updateCursor:
                        for row in updateCursor:
                            row[0] = value
                            updateCursor.updateRow(row)
            elif shapeType == "Point":
                poi_fields = [field.name.upper() for field in arcpy.ListFields(routable_location)]
                if self.LEVEL_ID_FIELD in poi_fields and self.FACILITY_ID_FIELD in poi_fields:
                    unitsPoints = routable_location
                else:
                    arcpy.CopyFeatures_management(routable_location, unitsPoints)
                    arcpy.management.JoinField(unitsPoints, floorField, levelsFC, self.LEVEL_ID_FIELD, None)
            if (arcpy.Exists(unitsPoints) and int(arcpy.GetCount_management(unitsPoints).getOutput(0)) > 0):
                #check if routable location has features = levels fc
                whereClause = self.LEVEL_ID_FIELD + " in ("
                i = 0
                for floor in floorsToProcess:
                    i+=1
                    whereClause = whereClause + "'" + floor[1] + "'"
                    if (i < len(floorsToProcess)):
                        whereClause = whereClause + ", "
                whereClause = whereClause + ")"
                routeLevelsFL = "routeLevels"
                arcpy.MakeFeatureLayer_management(unitsPoints, routeLevelsFL, whereClause)
                if int(arcpy.GetCount_management(routeLevelsFL).getOutput(0)) > 0:
                    return unitsPoints
            return None
        except Exception as e:
            return None

    def getWorkspace(self, infc):
        workspace = os.path.dirname(arcpy.Describe(infc).catalogPath)
        if arcpy.Describe(workspace).datatype.lower() == "featuredataset":
            return os.path.dirname(workspace)
        else:
            return workspace

    def validateTransitions(self, facilityIdList, scratch_gdb):
        deleteTempList = []
        edit = None
        transitionFCName = self.INPUT_TRANSITIONS
        prelimPathwayFC = self.INPUT_PATHWAYS
        isValidated = True
        try:


            if (int(arcpy.GetCount_management(transitionFCName).getOutput(0)) > 0):
                #check if transition exist for selected facility name
                whereClause = IndoorsUtilsModule.FACILITY_ID + " IN ("
                for i, id in enumerate(facilityIdList):
                    whereClause = whereClause + IndoorsUtilsModule.handleSingleQuoteForQuery(id)
                    if (i < len(facilityIdList) - 1):
                        whereClause = whereClause + ", "
                whereClause = whereClause + ")"

                selectedTransition = os.path.join(scratch_gdb, "Temptransition")
                deleteTempList.append(selectedTransition)
                arcpy.MakeFeatureLayer_management(transitionFCName, selectedTransition, whereClause)
                selectedPathways = os.path.join(scratch_gdb, "Temppathways")
                arcpy.MakeFeatureLayer_management(prelimPathwayFC, selectedPathways, whereClause)
                deleteTempList.append(selectedPathways)
                transitionCount = int(arcpy.GetCount_management(selectedTransition).getOutput(0))
                levelTempList = []
                if transitionCount > 0:
                    levelNames = []
                    levelNameDict = {}
                    levelNames, levelNameDict = self.getUniqueLevelsAndVO(facilityIdList)
                    isPathwayUpdated = False
                    wkspc = self.getWorkspace(prelimPathwayFC)
                    edit = arcpy.da.Editor(wkspc)
                    edit.startEditing(False, False)
                    edit.startOperation()
                    for idx, level in enumerate(levelNames):
                        levelPrelimPathways = os.path.join(scratch_gdb, "levelPathway" + "".join(c for c in level if c.isalpha()))
                        levelTempList.append(levelPrelimPathways)
                        arcpy.MakeFeatureLayer_management(selectedPathways, levelPrelimPathways, self.FROM_FLOOR_FIELD + " ='" + level + "'")
                        arcpy.SelectLayerByAttribute_management(selectedTransition, "CLEAR_SELECTION")
                        arcpy.SelectLayerByLocation_management(selectedTransition, "INTERSECT_3D", levelPrelimPathways, "0 Meters", "NEW_SELECTION", "NOT_INVERT")
                        intersectCount = int(arcpy.GetCount_management(selectedTransition).getOutput(0))
                        #if intersect count < transition count we need to find transitions that are not intersecting
                        if (intersectCount <= transitionCount):
                            arcpy.SelectLayerByAttribute_management(selectedTransition, "CLEAR_SELECTION")
                            arcpy.SelectLayerByLocation_management(selectedTransition, "INTERSECT_3D", levelPrelimPathways, "0 Meters", "NEW_SELECTION", "INVERT")
                            nonIntersectTransitions = os.path.join(scratch_gdb, "NonIntersectingTransition" + str(idx))
                            arcpy.CopyFeatures_management(selectedTransition, nonIntersectTransitions)
                            levelTempList.append(nonIntersectTransitions)
                            transitionPointCoord = None
                            transitionPointDictionary = {}
                            #get the xy of transition here
                            #transitionWhereClause = whereClause + "AND " + self.PATHWAYS_FROM_FLOOR_ID + " ='" + level + "'"
                            transitionWhereClause = ""
                            verticalOrder = levelNameDict[level]
                            if  verticalOrder == 0 or verticalOrder < max(levelNameDict.values()):
                                transitionWhereClause = self.PATHWAYS_FROM_FLOOR_ID + " ='" + level + "'"
                                arcpy.MakeFeatureLayer_management(nonIntersectTransitions, "fromTransition", transitionWhereClause)
                                fromTransitonCount = int(arcpy.GetCount_management("fromTransition").getOutput(0))
                                if fromTransitonCount == 0:
                                    transitionWhereClause = self.PATHWAYS_TO_FLOOR_ID + " ='" + level + "'"
                            else:
                                transitionWhereClause = self.PATHWAYS_TO_FLOOR_ID + " ='" + level + "'"
                            arcpy.SelectLayerByAttribute_management(nonIntersectTransitions, "CLEAR_SELECTION")
                            with arcpy.da.SearchCursor(nonIntersectTransitions, ["SHAPE@", "OID@"], transitionWhereClause) as cur:
                                for row in cur:
                                    shape = row[0]
                                    if idx == len(levelNames)-1:
                                        fnode = shape.firstPoint
                                        transitionPointCoord = arcpy.Point(fnode.X, fnode.Y, shape.firstPoint.Z)
                                    else:
                                        fnode = shape.lastPoint
                                        transitionPointCoord = arcpy.Point(fnode.X, fnode.Y, shape.lastPoint.Z)
                                    transitionPointDictionary[row[1]] = transitionPointCoord
                                    #del row
                            #get the nearest pathway to snap
                            if len(transitionPointDictionary) > 0:
                                pathwayFIDDict = {}
                                arcpy.SelectLayerByAttribute_management(levelPrelimPathways, "CLEAR_SELECTION")
                                levelTransitions = os.path.join(scratch_gdb, "levelTransitions" + "".join(c for c in level if c.isalpha()))
                                arcpy.MakeFeatureLayer_management(nonIntersectTransitions, levelTransitions, transitionWhereClause)
                                levelTempList.append(levelTransitions)
                                arcpy.analysis.Near(levelTransitions, levelPrelimPathways, "4 Meters", "LOCATION", "NO_ANGLE", "PLANAR")
                                cursor = arcpy.da.SearchCursor(levelTransitions,["SHAPE@","NEAR_FID", "OID@"])
                                #then get near pathway fid
                                for row in cursor:
                                    if row[1] != -1:
                                        pathwayFID = row[1]
                                        pathwayFIDDict[row[2]] = pathwayFID
                                del cursor

                                #we have the pathway id and transition point coord
                                #need to add path to the line segment connecting to transition
                                if len(pathwayFIDDict) > 0:

                                    for key, value in pathwayFIDDict.items():
                                        pathwayWhereClause = "ObjectId =" + str(value)
                                        transitionPoint = transitionPointDictionary[key]
                                        updateZDict = {}
                                        with arcpy.da.UpdateCursor(prelimPathwayFC, ["SHAPE@", "OID@"], pathwayWhereClause) as sc:
                                            for row in sc:
                                               shp = row[0]
                                               firstPoint = shp.firstPoint
                                               lastPoint = shp.lastPoint
                                               # handle individual vertices
                                               p0 = firstPoint
                                               p1 = lastPoint
                                               x1,y1,z1 = (transitionPoint.X, transitionPoint.Y, lastPoint.Z)
                                               p2 = arcpy.Point(x1, y1, z1)
                                               # create new feature and store it
                                               new_geometry = arcpy.Polyline(arcpy.Array([p0, p2, p1]))
                                               new_row = [new_geometry, row[1]]
                                               updateZDict[row[1]] = lastPoint.Z
                                               sc.updateRow(new_row)
                                               arcpy.AddIDMessage("INFORMATIVE",180178)
                                        del sc

                                        #update z values of pathways
                                        with arcpy.da.UpdateCursor(prelimPathwayFC, ["SHAPE@Z", "OID@"], pathwayWhereClause, explode_to_points=True) as cursor:
                                            for row in cursor:
                                                row[0] = updateZDict[row[1]]
                                                isPathwayUpdated = True
                                                cursor.updateRow(row)
                                        del cursor


                    edit.stopOperation()
                    edit.stopEditing(True)

                    for temp_fc in levelTempList:
                        if arcpy.Exists(temp_fc):
                            arcpy.Delete_management(temp_fc)

                    if isPathwayUpdated:
                        arcpy.CalculateField_management(prelimPathwayFC, self.PATHWAYS_LENGTH_3D,"!SHAPE!.length3D", "PYTHON3")
        except arcpy.ExecuteError:
            if 'edit' in locals():
                if edit.isEditing:
                    edit.stopOperation()
                    edit.stopEditing(False)

            arcpy.AddError(arcpy.GetMessages(2))
            isValidated = False
        except Exception as e:
            if 'edit' in locals():
                if edit.isEditing:
                    edit.stopOperation()
                    edit.stopEditing(False)
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
            isValidated = False
        finally:
            for temp_fc in deleteTempList:
                if arcpy.Exists(temp_fc):
                    arcpy.Delete_management(temp_fc)
            return isValidated

    def getUniqueLevelsAndVO(self, facilityIdList):
        levelNames = []
        levelNameDict = {}
        levelsfc = self.LEVELSFC
        qry = IndoorsUtilsModule.FACILITY_ID + " IN ("
        for i, id in enumerate(facilityIdList):
            qry = qry + IndoorsUtilsModule.handleSingleQuoteForQuery(id)
            if (i < len(facilityIdList) - 1):
                qry = qry + ", "
        qry = qry + ")"
        with arcpy.da.SearchCursor(levelsfc, [self.LEVELS_LAYER_SHORT_NAME_FIELD, self.VERTICAL_ORDER_FIELD], qry) as sCursor:
            for row in sCursor:
                levelNames.append(row[0])
                levelNameDict[row[0]] = row[1]

        return levelNames, levelNameDict

    def ApplyElevatorDelay(self, facility_id, levelid_facility, transfer_level_ids):
        try:
            workspace = self.getWorkspace(self.LEVELSFC)
            #originalEnv = arcpy.env.workspace
            arcpy.env.workspace = workspace
            #TODO : This needs a new storu to be fixed. It needs to be a parameter on the GP UI.
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(workspace)
            if self.isLegacyDataset:
                unitsFC = os.path.join(os.path.join(workspace, sdeQualifier + "Indoors"), sdeQualifier + "Units")
                if arcpy.Exists(unitsFC) == False:
                    unitsFC = os.path.join(os.path.join(workspace, sdeQualifier + "AIIM"), sdeQualifier + "Units")
            else:
                unitsFC = os.path.join(os.path.join(workspace, sdeQualifier + self.indoorsDatasetName), sdeQualifier + "Units")

            if unitsFC is not None and arcpy.Exists(unitsFC):
                self.AddElevatorDelayToThinnedPathways(unitsFC, facility_id,levelid_facility, transfer_level_ids)
            else:
                arcpy.AddIDMessage("INFORMATIVE",180213)

        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180208)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180208)
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
            return None

    def AddElevatorDelayToThinnedPathways(self, room_fc, facility_id, levelid_facility, transfer_level_ids):
        try:
            # Backward compatibility - Check if DELAY field exists in thinned PATHWAYS, else exit
            thin_pathways_fc = self.TARGET_PATHWAYS
            pathways_fc = self.INPUT_PATHWAYS
            levels_fc = self.LEVELSFC
            floor_transitions_fc =self.INPUT_TRANSITIONS
            fields = arcpy.ListFields(thin_pathways_fc)
            field_names = [field.name.upper() for field in fields]
            if not self.DELAY.upper() in field_names:
                arcpy.AddIDMessage("WARNING", 180199, self.DELAY)
                return
            catalogPath = arcpy.Describe(pathways_fc).catalogPath   # circumventing a potential bug in GP core
            fields = arcpy.ListFields(catalogPath)
            field_names = [field.name.upper() for field in fields]
            if not self.DELAY.upper() in field_names:
                arcpy.AddIDMessage("WARNING", 180200,self.DELAY)
                return
            #Handle floor selection.
            facility_vertical_orders = []
            vo_levelid_dict = {}
            levelid_list = levelid_facility
            if len(levelid_list) > 0:
                # means one building was selected and some floors were selected for it
                whereclause = self.FACILITY_ID_FIELD + " = " + "'" + str(facility_id) + "'"
                if len(levelid_list) > 0:
                    vo_levelid_dict = {row[0]:row[1] for row in
                                       arcpy.da.SearchCursor(levels_fc, [self.LEVEL_ID_FIELD,self.VERTICAL_ORDER_FIELD], whereclause)}
                    if len(vo_levelid_dict) > 1:
                        for floor_id in levelid_list:
                            v = vo_levelid_dict[floor_id]
                            facility_vertical_orders.append(v)

            #prelim pathways and prelim transitions
            prelim_pathways_layer = "prelim_pathways_layer"
            transitions_layer = "transitions_layer"
            arcpy.MakeFeatureLayer_management(pathways_fc, prelim_pathways_layer)
            arcpy.MakeFeatureLayer_management(floor_transitions_fc, transitions_layer)
            #Loop through levels of current building and split thinned pathways at elevator space boundary
            if len(facility_vertical_orders) == 0:
                whereclause = self.FACILITY_ID_FIELD + " = " + "'" + str(facility_id) + "'"
                vertical_orders = [(row[0]) for row in
                                   arcpy.da.SearchCursor(thin_pathways_fc, [self.VERTICAL_ORDER_FIELD], whereclause)]
                set_vo = set(vertical_orders)
                facility_vertical_orders = list(set_vo) #this needs to be updated when it is called from ThinPathways
            thin_pathways_layer = "thin_pathways_layer"
            room_layer = "room_layer"
            arcpy.MakeFeatureLayer_management(thin_pathways_fc, thin_pathways_layer)
            arcpy.MakeFeatureLayer_management(room_fc, room_layer)
            pathways_split_layer = "pathways_split_layer"

            #Select units polygons intersecting transitions in current facility. TRANSITION_TYPE = 4 for elevator
            wc_transitions = self.FACILITY_ID_FIELD + " = " + "'" + str(facility_id) + "'" + " AND " + self.TRANSITIONS_TYPE + " = 4"
            arcpy.SelectLayerByAttribute_management(transitions_layer, 'NEW_SELECTION', wc_transitions)
            feat_ct = int(arcpy.GetCount_management(transitions_layer).getOutput(0))
            arcpy.AddIDMessage("INFORMATIVE",180179,str(feat_ct))

            levelid_list = list(vo_levelid_dict.keys())
            vo_list = list(vo_levelid_dict.values())
            #Loop through levels of current building and split thinned pathways at elevator space boundary
            for vo in facility_vertical_orders:
                arcpy.AddIDMessage("INFORMATIVE",180180,str(vo))
                vo_name = self.generateLevelName(vo)

                #Select rooms intersecting transitions for this facility and level
                arcpy.SelectLayerByAttribute_management(room_layer, 'CLEAR_SELECTION')
                arcpy.SelectLayerByLocation_management(room_layer, "INTERSECT", transitions_layer, None, "NEW_SELECTION")
                if (vo in vo_list):
                    vo_index = vo_list.index(vo)
                    wclause_room = self.LEVEL_ID_FIELD + " = '" + str(levelid_list[vo_index]) + "'"
                    arcpy.SelectLayerByAttribute_management(room_layer, 'SUBSET_SELECTION', wclause_room)
                    feat_ct = int(arcpy.GetCount_management(room_layer).getOutput(0))
                else:
                    feat_ct = 0
                arcpy.AddIDMessage("INFORMATIVE",180181,str(feat_ct))

                #Select prelim pathways intersecting selected rooms
                wc_pathways = self.VERTICAL_ORDER_FIELD + " = " + str(vo) + " AND " + self.FACILITY_ID_FIELD + " = " + "'" + str(facility_id) + "'"
                arcpy.SelectLayerByAttribute_management(prelim_pathways_layer, 'NEW_SELECTION', wc_pathways)
                #INTERSECT = CROSSES + TOUCHES
                arcpy.SelectLayerByLocation_management(prelim_pathways_layer, "INTERSECT", room_layer, None, "SUBSET_SELECTION")
                arcpy.SelectLayerByLocation_management(prelim_pathways_layer, "COMPLETELY_WITHIN", room_layer, None, "REMOVE_FROM_SELECTION")

                #Get elevator delay value from prelim pathways
                elevator_delay_value = None
                with arcpy.da.SearchCursor(prelim_pathways_layer, [self.DELAY]) as cur:
                    for row in cur:
                        if row[0] is not None:
                            elevator_delay_value = row[0]
                            break
                if elevator_delay_value is None:
                    arcpy.AddIDMessage("WARNING",180182)
                    return
                arcpy.AddIDMessage("INFORMATIVE",180183,str(elevator_delay_value))

                #Split thinned pathways intersecting elevator spaces
                arcpy.SelectLayerByAttribute_management(thin_pathways_layer, 'NEW_SELECTION', wc_pathways)
                # Select pathways intersecting elevator space
                arcpy.SelectLayerByLocation_management(thin_pathways_layer, 'CROSSED_BY_THE_OUTLINE_OF', room_layer, "", "SUBSET_SELECTION")
                feat_ct = int(arcpy.GetCount_management(thin_pathways_layer).getOutput(0))
                arcpy.AddIDMessage("INFORMATIVE",180184,str(feat_ct))
                # Calculate field on pathways delay=-1
                arcpy.CalculateField_management(thin_pathways_layer, self.DELAY, -1)  # Delete these features later
                # Identity on selected pathways and unit space=elevator
                pathways_split_fc = os.path.join("IN_MEMORY", "pathways_split_fc" + "_" + str(vo_name))
                arcpy.Identity_analysis(thin_pathways_layer, room_layer, pathways_split_fc, "ONLY_FID", None, "NO_RELATIONSHIPS")
                desc_pathways = arcpy.Describe(pathways_split_fc)
                arcpy.management.DeleteIdentical(pathways_split_fc, desc_pathways.shapeFieldName, None, 0)

                # Add LEVEL_ID field for in memory pathways_split_fc if we're setting LEVEL_ID values for the Pathways
                if transfer_level_ids:
                    split_pathways_missing_level_id_field = IndoorsUtilsModule.findFields(pathways_split_fc, [self.LEVEL_ID_FIELD])
                    if len(split_pathways_missing_level_id_field) > 0:
                        arcpy.AddField_management(pathways_split_fc, self.LEVEL_ID_FIELD, "TEXT", "", "", 255)

                # Pathways layer with split features intersecting elevator space
                arcpy.MakeFeatureLayer_management(pathways_split_fc, pathways_split_layer)

                # Select pathways split features within the elevator space and calculate field
                arcpy.management.SelectLayerByLocation(pathways_split_layer, "BOUNDARY_TOUCHES", room_layer, None, "NEW_SELECTION", "NOT_INVERT")
                arcpy.SelectLayerByLocation_management(pathways_split_layer, 'WITHIN', room_layer, None, "SUBSET_SELECTION", "NOT_INVERT")
                arcpy.CalculateField_management(pathways_split_layer, self.DELAY, elevator_delay_value, "PYTHON3")
                arcpy.CalculateField_management(pathways_split_layer, self.PATHWAYS_LENGTH_3D, "!SHAPE!.length3D", "PYTHON3")

                # Pathways split but outside the elevator space have delay set to None
                arcpy.management.SelectLayerByLocation(pathways_split_layer, "BOUNDARY_TOUCHES", room_layer, None, "NEW_SELECTION", "NOT_INVERT")
                arcpy.SelectLayerByLocation_management(pathways_split_layer, 'WITHIN', room_layer, None, "SUBSET_SELECTION", "INVERT")
                #arcpy.SelectLayerByLocation_management(pathways_split_layer, 'WITHIN', room_layer, "", "NEW_SELECTION", "INVERT")
                arcpy.CalculateField_management(pathways_split_layer, self.DELAY, "None", "PYTHON3")
                arcpy.CalculateField_management(pathways_split_layer, self.PATHWAYS_LENGTH_3D, "!SHAPE!.length3D", "PYTHON3")

                if transfer_level_ids:
                    arcpy.CalculateField_management(pathways_split_layer, self.LEVEL_ID_FIELD, '"' + str(levelid_list[vo_index]) + '"', "PYTHON3")
                    
                # Append split features to prelim pathways fc
                arcpy.SelectLayerByAttribute_management(pathways_split_layer, 'CLEAR_SELECTION')
                fieldlist = ["FACILITY_ID", "FACILITY_NAME",
                             "LENGTH_3D", "LEVEL_NAME_FROM", "LEVEL_NAME_TO", "PATHWAY_RANK",
                             "PATHWAY_TYPE", "TRAVEL_DIRECTION", "VERTICAL_ORDER", "LEVEL_ID", self.DELAY]
                is_appended = self.appendPathways(pathways_split_fc, thin_pathways_fc, fieldlist)
                # Delete prelim pathways where DELAY=-1 as these features have been split and copied
                arcpy.DeleteFeatures_management(thin_pathways_layer)
                #end - for vo in facility_vertical_orders:
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180208)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180208)
            arcpy.AddError("{0}".format(e))
            return None

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
            # print(fieldMappings)
            arcpy.Append_management(source_fc, target_fc, "NO_TEST", fieldMappings, None)
            return True
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180209)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180209)
            arcpy.AddError("{0}".format(e))
            return None

    def generateLevelName(self, level_number):
        # Generate level_number suffix to generate intermediate feature class or table names
        # The positive levels are given a prefix P and negative levels are given a prefix N followed by level numbers
        level_name = None
        if level_number < 0:
            level_name = "N" + str(abs(level_number))
        else:
            level_name = "P" + str(abs(level_number))
        return level_name

    def getSelectedLevelsFacility(self):
        try:
            vertical_orders_selected = []
            facilityids_selected = []
            with arcpy.da.SearchCursor(self.LEVELSFC, [self.FACILITY_ID_FIELD, self.VERTICAL_ORDER_FIELD]) as cursor:
                for row in cursor:
                    vertical_orders_selected.append(str(row[1]))
                    facilityids_selected.append(row[0])
            whereClause = self.FACILITY_ID_FIELD + " IN (" + ','.join("'{0}'".format(facilityid) for facilityid in facilityids_selected) + ")"
            whereClause += " AND " + self.VERTICAL_ORDER_FIELD +  " IN (" + ",".join(vertical_orders_selected) + ")"
            return whereClause
        except:
            return None

    def load_final_network(self,scratch_gdb,thinned_lattice_fcs_list, whereClause):

        try:
            arcpy.AddIDMessage("INFORMATIVE",180185)
            workspace_orig = arcpy.env.workspace
            arcpy.env.workspace = scratch_gdb
            target_pathways = arcpy.Describe(self.TARGET_PATHWAYS).catalogPath

            pathwaysCount = int(arcpy.GetCount_management(target_pathways).getOutput(0))
            if pathwaysCount > 0:
                wc = self.getSelectedLevelsFacility()
                self.deleteExistingData(target_pathways, wc)

            thinnedLatticeFeatureClasses = []
            for fcs in thinned_lattice_fcs_list:
                fcPath = os.path.join(scratch_gdb, fcs)
                arcpy.management.AddField(fcPath, IndoorsUtilsModule.PATHWAY_RANK , "LONG", 10, None, None, IndoorsUtilsModule.PATHWAY_RANK, "NULLABLE", "NON_REQUIRED", None)
                arcpy.management.CalculateField(fcPath, IndoorsUtilsModule.PATHWAY_RANK, 1, "PYTHON3", None)

                #arcpy.management.AddField(fcPath, IndoorsUtilsModule.LOCATION_TYPE , "LONG", 10, None, None, IndoorsUtilsModule.LOCATION_TYPE, "NULLABLE", "NON_REQUIRED", None)
                #arcpy.management.CalculateField(fcPath, IndoorsUtilsModule.LOCATION_TYPE, 1, "PYTHON3", None)

                #arcpy.management.AddField(fcPath, IndoorsUtilsModule.ACCESS_PEDESTRIAN , "LONG", 10, None, None, IndoorsUtilsModule.ACCESS_PEDESTRIAN, "NULLABLE", "NON_REQUIRED", None)
                #arcpy.management.CalculateField(fcPath, IndoorsUtilsModule.ACCESS_PEDESTRIAN, 1, "PYTHON3", None)

                arcpy.management.AddField(fcPath, IndoorsUtilsModule.PATHWAY_TYPE , "LONG", 10, None, None, IndoorsUtilsModule.PATHWAY_TYPE, "NULLABLE", "NON_REQUIRED", None)
                arcpy.management.CalculateField(fcPath, IndoorsUtilsModule.PATHWAY_TYPE, 1, "PYTHON3", None)

                arcpy.management.AddField(fcPath, IndoorsUtilsModule.TRAVEL_DIRECTION , "LONG", 10, None, None, IndoorsUtilsModule.TRAVEL_DIRECTION, "NULLABLE", "NON_REQUIRED", None)
                arcpy.management.CalculateField(fcPath, IndoorsUtilsModule.TRAVEL_DIRECTION, 1, "PYTHON3", None)

                #arcpy.management.AddField(fcPath, IndoorsUtilsModule.ACCESS_WHEELCHAIR , "LONG", 10, None, None, IndoorsUtilsModule.ACCESS_WHEELCHAIR, "NULLABLE", "NON_REQUIRED", None)
                #arcpy.management.CalculateField(fcPath, IndoorsUtilsModule.ACCESS_WHEELCHAIR, 1, "PYTHON3", None)

                thinnedLatticeFeatureClasses.append(fcPath)

            arcpy.Append_management(thinnedLatticeFeatureClasses, target_pathways, "NO_TEST")

            target_transitions = arcpy.Describe(self.TARGET_TRANSITIONS).catalogPath
            transitionsCount = int(arcpy.GetCount_management(target_transitions).getOutput(0))
            if transitionsCount > 0:
                self.deleteExistingData(target_transitions, whereClause)

            arcpy.MakeFeatureLayer_management(self.INPUT_TRANSITIONS,"transitionlayer",whereClause)
            result = arcpy.GetCount_management("transitionlayer")
            count = int(result.getOutput(0))
            if count >= 1:
                arcpy.Append_management("transitionlayer", target_transitions, "NO_TEST")

            arcpy.env.workspace = workspace_orig

            failed = False

        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180210)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180210)
            arcpy.AddError("{0}".format(e))
            return None
        finally:
            for fds in arcpy.ListDatasets('','feature'):
                if ("ClosestFacility" in fds or "Route" in fds):
                   arcpy.Delete_management(fds)

    def deleteExistingData(self, target_fc, whereClause):
        try:
            if whereClause != "":
                select_lyr = arcpy.SelectLayerByAttribute_management(target_fc, 'NEW_SELECTION', whereClause)
            else:
                select_lyr = arcpy.SelectLayerByAttribute_management(target_fc, 'NEW_SELECTION')

            feat_ct = int(arcpy.GetCount_management(select_lyr).getOutput(0))
            if (feat_ct > 0):
                arcpy.DeleteFeatures_management(select_lyr)
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180211)
            arcpy.AddError(arcpy.GetMessages(2))
            return None

        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180211)
            arcpy.AddError("{0}".format(e))
            return None

    def thin_lattice(self,building,floor_id_list,  network,
                                points_fcs_list,fc_name,
                                scratch_gdb, transfer_level_ids):

        use_calculated_locations = False

        try:
            levelNameDict = self.getLevelsName(building)
            # Prepare the restrictions argument for MakeClosestFacilityLayer
            restriction_argument = []
            restriction_argument.append("Hallways: Avoid Walls")
            restriction_argument.append("Hallways: Prefer Center High")
            restriction_argument.append("Hallways: Prefer Middle Med")
            # Prepare search_criteria argument for AddLocations
            pathways_fcs_names = arcpy.Describe(self.INPUT_PATHWAYS).name # get list of FC/layer names
            criteria = []

            network_dataset_sources = arcpy.Describe(network).sources
            for source in network_dataset_sources: # get list of other sources to which points shouldn't be snapped
                if ("ND_Junctions" in source.name):
                    criteria.append([source.name, "NONE"])
                else:
                    criteria.append([source.name, "SHAPE"])


            # Misc preparation
            calculate_locations_fields = ["SourceID", "SourceOID", "PosAlong", "SideOfEdge", "SnapX", "SnapY", "Distance", "SnapZ"]
            lattice_thinned_fcs = []
            delete_fcs = []

            # This loop creates a new MakeClosestFacilityLayer for each iteration (floor), adds that floor's origin/destination locations, then
            # solves the layer to create the thinned pathways geometry for that floor.  Invalid and duplicate geometries are then removed.
            if len(floor_id_list) > 0:  # Whether a building is processed is based on whether there are points for that building.  If there aren't, floor_id_list
                #will contain no entries, and the tool should move on to the next building.

                for j, floor in enumerate(floor_id_list):
                    if (floor not in levelNameDict.keys()):
                        continue
                    arcpy.AddIDMessage("INFORMATIVE",180186,str(levelNameDict[floor]))

                    # Prepare the search_query argument for AddLocations, controlling which pathway features points can be snapped to if Calculate Locations
                    # has yet to be run on the points.
                    search_query = "#"
                    if not use_calculated_locations:
                        search_query = []
                        search_query.append([pathways_fcs_names, self.FROM_FLOOR_FIELD + " = " + IndoorsUtilsModule.handleSingleQuoteForQuery(levelNameDict[floor])])

                    appendValue = "CLEAR" # or each floor, flag addLocations to clear the previous locations
                    floorID = "Hallways_{}".format(j)
                    arcpy.env.workspace = scratch_gdb
                    #NAResultObject = arcpy.na.MakeClosestFacilityLayer(network, floorID, "WalkTime", "TRAVEL_TO", default_number_facilities_to_find=facility_solve_count,output_path_shape="TRUE_LINES_WITHOUT_MEASURES", restriction_attribute_name=restriction_argument)
                    NAResultObject = arcpy.na.MakeClosestFacilityAnalysisLayer(network, floorID, "Thinning", "TO_FACILITIES", None, self.SOLVE_COUNT, None, "LOCAL_TIME_AT_LOCATIONS", "START_TIME", "ALONG_NETWORK", None, "NO_DIRECTIONS", "SKIP")
                    cf_layer = NAResultObject.getOutput(0)
                    sublayerNames = arcpy.na.GetNAClassNames(cf_layer)
                    facilitiesLayerName = sublayerNames["Facilities"]
                    incidentsLayerName = sublayerNames["Incidents"]
                    routesLayerName = sublayerNames["CFRoutes"]
                    #...load features from each feature class.
                    for i, fc in enumerate(points_fcs_list):
                        t0 = time.process_time()
                        arcpy.AddIDMessage("INFORMATIVE",180187,str(arcpy.Describe(fc).baseName))

                        # Filter for the point records for this floor
                        point_layer = "point_layer"

                        arcpy.MakeFeatureLayer_management(fc, point_layer, self.LEVEL_ID_FIELD + "=" + IndoorsUtilsModule.handleSingleQuoteForQuery(floor))

                        # If using pre-calculated locations, there's no need for search_tolerance or search_criteria parameters
                        # since the locations are already placed along the network
                        if use_calculated_locations:
                            tolerance_facilities = ""
                            tolerance_incidents = ""
                            list_candidate_fields = arcpy.ListFields(fc)
                            fld_mappings_facilities = arcpy.na.NAClassFieldMappings(cf_layer, facilitiesLayerName, True, list_candidate_fields)
                            fld_mappings_incidents = arcpy.na.NAClassFieldMappings(cf_layer, incidentsLayerName, True, list_candidate_fields)
                        else:
                            tolerance_facilities = self.SEARCH_TOLERANCE
                            tolerance_incidents = self.SEARCH_TOLERANCE
                            fld_mappings_facilities =  ""
                            fld_mappings_incidents = ""

                        arcpy.na.AddLocations(cf_layer, facilitiesLayerName, point_layer, field_mappings = fld_mappings_facilities, search_tolerance = tolerance_facilities, search_criteria = criteria, append = appendValue, search_query = search_query) #Need to remove Doors from network.

                        arcpy.na.AddLocations(cf_layer, incidentsLayerName, point_layer, field_mappings = fld_mappings_incidents, search_tolerance = tolerance_incidents, search_criteria = criteria, append = appendValue, search_query = search_query) #Need to remove Doors from network.
                        appendValue = "APPEND" #Make sure that subsequent loads on this floor are appended.


                    t0 = time.process_time()
                    arcpy.AddIDMessage("INFORMATIVE",180188,str(floor))

                    try:
                        arcpy.na.Solve(cf_layer)
                    except:
                        arcpy.AddIDMessage("WARNING",180201,building, floor)
                        arcpy.AddWarning(arcpy.GetMessages(0))
                        continue

                    arcpy.AddIDMessage("INFORMATIVE", 180189, (str(round(time.process_time() - t0, 2))))
                    arcpy.AddIDMessage("INFORMATIVE", 180190)
                    arcpy.na.CopyTraversedSourceFeatures(cf_layer, scratch_gdb, "Lines_Floor_" + str(j), "junctions", "turns")

                    out_floor_lines = os.path.join(scratch_gdb, "Lines_Floor_" + str(j))
                    out_floor_lines_f2l = os.path.join(scratch_gdb, "Lines_Floor_" + str(j) + "_F2L")
                    delete_fcs.append(out_floor_lines)
                    delete_fcs.append(out_floor_lines_f2l)

                    lattice_thinned_fcs.append(out_floor_lines_f2l)

                    arcpy.AddIDMessage("INFORMATIVE", 180191)
                    arcpy.management.DeleteIdentical(out_floor_lines, ["Shape"])
                    arcpy.management.RepairGeometry(out_floor_lines, "DELETE_NULL")
                    arcpy.management.FeatureToLine(out_floor_lines, out_floor_lines_f2l)
                    arcpy.management.DeleteIdentical(out_floor_lines_f2l, ["Shape"])
                    arcpy.management.RepairGeometry(out_floor_lines_f2l, "DELETE_NULL")

                    # set the LEVEL_ID value to the floor (which actually is the LEVEL_ID value) for each row in out_floor_lines_f2l 
                    f2l_missing_level_id_field = IndoorsUtilsModule.findFields(out_floor_lines_f2l, [self.LEVEL_ID_FIELD])
                    if len(f2l_missing_level_id_field) > 0:
                        arcpy.AddField_management(out_floor_lines_f2l, self.LEVEL_ID_FIELD, "TEXT", "", "", 255)
                    arcpy.CalculateField_management(out_floor_lines_f2l, self.LEVEL_ID_FIELD, '"' + floor + '"', "PYTHON3")

                    arcpy.management.Delete(NAResultObject)
                    arcpy.management.Delete(cf_layer)

                arcpy.AddIDMessage("INFORMATIVE",180192)
                
                arcpy.Delete_management(point_layer)
                arcpy.Delete_management(os.path.join(scratch_gdb, "junctions"))
                arcpy.Delete_management(os.path.join(scratch_gdb, "turns"))

                lattice_thinned = os.path.join(scratch_gdb, self.THINNED_LATTICE_FC + "_" + fc_name + "_Temp")

                if len(lattice_thinned_fcs)>0:
                    arcpy.Merge_management(lattice_thinned_fcs, lattice_thinned)  # TO DO: instead of merging, just load directly into the final network dataset's Pathways FC?

                    for fc in delete_fcs:
                        arcpy.Delete_management(fc)

                    network_path = os.path.dirname(arcpy.Describe(network).catalogPath)

                    # Join back floor and elevation fields to the output
                    #crashes here
                    arcpy.AddIDMessage("INFORMATIVE", 180202)
                    arcpy.AddField_management(lattice_thinned, self.PATHWAYS_FROM_HEIGHT, "DOUBLE")
                    arcpy.AddField_management(lattice_thinned, self.PATHWAYS_FROM_FLOOR_ID, "TEXT", "", "", 50)
                    arcpy.AddField_management(lattice_thinned, self.VERTICAL_ORDER_FIELD, "LONG")
                    arcpy.AddField_management(lattice_thinned, self.PATHWAYS_TYPE, "SHORT")
                    arcpy.AddField_management(lattice_thinned, self.FACILITY_ID_FIELD, "TEXT", "", "", 50)
                    arcpy.AddField_management(lattice_thinned, self.FACILITY_NAME_FIELD, "TEXT", "", "", 50)
                    arcpy.AddField_management(lattice_thinned, self.PATHWAYS_ANGLE, "SHORT")

                    if transfer_level_ids:
                        lattice_thinned_missing_level_id_field = IndoorsUtilsModule.findFields(lattice_thinned, [self.LEVEL_ID_FIELD])
                        if len(lattice_thinned_missing_level_id_field) > 0:
                            arcpy.AddField_management(lattice_thinned, self.LEVEL_ID_FIELD, "TEXT", "", "", 255)

                    # To join back original fields from edge sources, need to get names of edge sources
                    edge_sources = arcpy.Describe(network).edgeSources
                    transitionsName = arcpy.Describe(self.INPUT_TRANSITIONS).name
                    for fc in edge_sources:
                        src_fc_name = fc.name
                        lattice_thinned_lyr = self.THINNED_LATTICE_FC + "_" + src_fc_name
                        arcpy.MakeFeatureLayer_management(lattice_thinned, lattice_thinned_lyr, "SourceName = '" + src_fc_name + "'")
                        result = arcpy.GetCount_management(lattice_thinned_lyr)
                        count = int(result.getOutput(0))
                        if count > 0:
                            src_full = os.path.join(network_path, src_fc_name)
                            oid_field = arcpy.Describe(src_full).OIDFieldName
                            joinFC = arcpy.AddJoin_management(lattice_thinned_lyr, "SourceOID", src_full, oid_field)
                            joinFCName = arcpy.Describe(joinFC).name
                            #arcpy.CalculateField_management(joinFC, joinFCName + "." + self.PATHWAYS_FROM_HEIGHT, "!" + src_fc_name + "." + self.PATHWAYS_FROM_HEIGHT + "!", "PYTHON3")
                            arcpy.CalculateField_management(joinFC, joinFCName + "." + self.PATHWAYS_FROM_FLOOR_ID, "!" + src_fc_name + "." + self.PATHWAYS_FROM_FLOOR_ID + "!", "PYTHON3")
                            if (pathways_fcs_names in src_fc_name):
                                arcpy.CalculateField_management(joinFC, joinFCName + "." + self.VERTICAL_ORDER_FIELD, "!" + src_fc_name + "." + self.VERTICAL_ORDER_FIELD + "!", "PYTHON3")
                                arcpy.CalculateField_management(joinFC, joinFCName + "." + self.PATHWAYS_TYPE, "!" + src_fc_name + "." + self.PATHWAYS_TYPE + "!", "PYTHON3")
                            if (transitionsName in src_fc_name):
                                arcpy.CalculateField_management(joinFC, joinFCName + "." + self.VERTICAL_ORDER_FIELD, "!" + src_fc_name + "." + self.VERTICAL_ORDER_FROM + "!", "PYTHON3")
                                arcpy.CalculateField_management(joinFC, joinFCName + "." + self.PATHWAYS_TYPE, "!" + src_fc_name + "." + self.TRANSITIONS_TYPE + "!", "PYTHON3")

                            if transfer_level_ids and transitionsName not in src_fc_name:
                                arcpy.CalculateField_management(joinFC, joinFCName + "." + self.LEVEL_ID_FIELD, "!" + src_fc_name + "." + self.LEVEL_ID_FIELD + "!", "PYTHON3")

                            arcpy.CalculateField_management(joinFC, joinFCName + "." + self.FACILITY_ID_FIELD, "!" + src_fc_name + "." + self.FACILITY_ID_FIELD + "!", "PYTHON3")
                            arcpy.CalculateField_management(joinFC, joinFCName + "." + self.FACILITY_NAME_FIELD, "!" + src_fc_name + "." + self.FACILITY_NAME_FIELD + "!", "PYTHON3")
                            arcpy.RemoveJoin_management(lattice_thinned_lyr)

                            arcpy.Delete_management(joinFC)

                        arcpy.Delete_management(lattice_thinned_lyr)

                    # Delete any records coming from the transitions -- all transitions will be loaded in the final network dataset, the ones in the thinned output
                    #   are redundant and could cause problems.
                    with arcpy.da.UpdateCursor(lattice_thinned, self.FACILITY_ID_FIELD, self.PATHWAYS_TYPE + " IN (2, 4)") as cursor:
                        for row in cursor:
                            cursor.deleteRow()

                    lattice_dissolved = self.dissolve_by_angle(building, lattice_thinned, fc_name, scratch_gdb)

                    # Add and calculate additional fields
                    #arcpy.AddField_management(lattice_dissolved, self.PATHWAYS_TO_HEIGHT, "DOUBLE")
                    arcpy.AddField_management(lattice_dissolved, self.PATHWAYS_TO_FLOOR_ID, "TEXT", "", "", 50)
                    arcpy.AddField_management(lattice_dissolved, self.PATHWAYS_LENGTH_3D, "DOUBLE")

                    arcpy.CalculateField_management(lattice_dissolved, self.PATHWAYS_TO_FLOOR_ID, "!" + self.PATHWAYS_FROM_FLOOR_ID + "!", "PYTHON3")
                    arcpy.CalculateField_management(lattice_dissolved, self.PATHWAYS_LENGTH_3D, "!SHAPE!.length3D", "PYTHON3")

                    return lattice_dissolved
                else:
                    return None
            else:
                arcpy.AddIDMessage("INFORMATIVE", 180193,building)

            arcpy.AddIDMessage("INFORMATIVE", 180194)
            failed = False
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180212)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180212)
            arcpy.AddError("{0}".format(e))
            return None
        finally:
            for fds in arcpy.ListDatasets('','feature'):
                if ("ClosestFacility" in fds or "Route" in fds):
                   arcpy.Delete_management(fds)

    def dissolve_by_angle(self, facilityID, lattice_fc, fc_name, scratch_gdb):
        """
        Reduces the number of pathway features by creating an angle field,
        calculating the angle of the particular lattice line,
        then dissolving on the angle and the lattice FC's floor and from-height
        fields.  This reduces the total number of features, which reduces the
        time it takes Network Analyst to solve a route on this network.
        Inputs:
           lattice_fc: the network dataset 'pathways' feature class
           floor_field: the field in lattice_fc giving the floor id
           from_height_field:  the field in lattice_fc giving the z value of the feature
           output_gdb: the file geodatabase to which output is written
        Ouput:
           The lattice FC dissolved by the fields mentioned above
        """
        arcpy.AddIDMessage("INFORMATIVE", 180195)
        code_block = """def GetAzimuthPolyline(shape):
          numerator = shape.lastpoint.x - shape.firstpoint.x
          denominator = shape.lastpoint.y - shape.firstpoint.y
          if denominator == 0:
            degrees = 90
          else:
            radian = math.atan(numerator / denominator)
            degrees = radian * 180 / math.pi
            if degrees < 0:
              degrees= degrees + 180
          return degrees"""

        exp = "GetAzimuthPolyline(!SHAPE!)"
        #arcpy.AddMessage(lattice_fc)
        arcpy.CalculateField_management(lattice_fc, self.PATHWAYS_ANGLE, exp, "PYTHON_3", code_block)
        #Add HEIGHT_FROM field and populate it
        self.addHeightToTempPathways(lattice_fc, facilityID)

        # disable the z output flag environment variable -- causes Dissolve to fail
        original_env_setting = arcpy.env.outputZFlag
        arcpy.env.outputZFlag = "Disabled"
        dissolve_fields = [self.PATHWAYS_FROM_FLOOR_ID, self.PATHWAYS_FROM_HEIGHT,
                            self.VERTICAL_ORDER_FIELD, self.FACILITY_ID_FIELD,self.FACILITY_NAME_FIELD, self.LEVEL_ID_FIELD, self.PATHWAYS_ANGLE]
        dissolve_output = os.path.join(scratch_gdb, "Lattice_Thinned_Dissolved")

        arcpy.Dissolve_management(lattice_fc, dissolve_output, dissolve_fields, "", "SINGLE_PART", "UNSPLIT_LINES")
        arcpy.env.outputZFlag = original_env_setting

        # Apply z-values to DissolveOutput
        arcpy.AddIDMessage("INFORMATIVE", 180196)
        dissolve_output_z = os.path.join(scratch_gdb, "Lattice_Thinned_" + fc_name)
        arcpy.FeatureTo3DByAttribute_3d(dissolve_output, dissolve_output_z, self.PATHWAYS_FROM_HEIGHT)

        # Delete FCs
        arcpy.Delete_management(lattice_fc)
        arcpy.Delete_management(dissolve_output)

        return dissolve_output_z

    def addHeightToTempPathways(self, feature_class, facilityID):
        try:
            # (1) add height_from field to FC (2) populate it with height from levels FC
            # Add a field to dissolve_output (FACILITY_D, LEVEL_NAME_FROM, FROM_HEIGHT)
            if not self.PATHWAYS_FROM_HEIGHT in [field.name for field in arcpy.ListFields(feature_class)]:
                arcpy.AddField_management(feature_class, self.PATHWAYS_FROM_HEIGHT, "DOUBLE")   #"HEIGHT_FROM"

            #Create a levels_short_name, height_relative dictionary for this facility LEVELS.SHORT_NAME = DISSOLVED_OUTPUT.LEVEL_NAME_FROM
            verticalOrder = []
            level_shortname_heightrelative = {}
            whereClause = self.FACILITY_ID_FIELD + " = " + IndoorsUtilsModule.handleSingleQuoteForQuery(facilityID)
            #"NAME_SHORT", "ELEVATION_RELATIVE"
            if self.isPathwaysLegacyDataset and self.isLegacyDataset:
                with arcpy.da.SearchCursor(self.LEVELSFC, [self.LEVELS_LAYER_SHORT_NAME_FIELD, self.ELEVATION_RELATIVE_FIELD, self.VERTICAL_ORDER_FIELD], whereClause) as sCursor:
                    for row in sCursor:
                        level_shortname_heightrelative[row[0]] = row[1]
                        verticalOrder.append(row[2])
                verticalOrderString = ",".join([str(vo) for vo in verticalOrder])
                whereClause += " AND " + self.VERTICAL_ORDER_FIELD + " IN (" + verticalOrderString + ")"
                # Assign relative height value from levels feature class: "LEVEL_NAME_FROM", "HEIGHT_FROM"
                with arcpy.da.UpdateCursor(feature_class, [self.FROM_FLOOR_FIELD, self.PATHWAYS_FROM_HEIGHT], whereClause ) as cursor:
                    for row in cursor:
                        level_name_from = row[0]
                        if level_name_from  in level_shortname_heightrelative:
                            row[1] = level_shortname_heightrelative[level_name_from]
                            cursor.updateRow(row)
            else:
                zvaluesDict = {}
                with arcpy.da.SearchCursor(self.LEVELSFC, ["SHAPE@", self.LEVEL_ID_FIELD, self.VERTICAL_ORDER_FIELD], whereClause) as searchCursor:
                    for row in searchCursor:
                        shape = row[0]
                        firstPoint = shape.firstPoint
                        zvaluesDict[row[2]] = firstPoint.Z

                for key, value in zvaluesDict.items():
                    query = self.FACILITY_ID_FIELD + " = " + IndoorsUtilsModule.handleSingleQuoteForQuery(facilityID)
                    query+= " AND " + self.VERTICAL_ORDER_FIELD + "=" + str(key)
                    with arcpy.da.UpdateCursor(feature_class, ["SHAPE@Z",self.PATHWAYS_FROM_HEIGHT], query) as updateCursor:
                        for row in updateCursor:
                            row[0] = value
                            row[1] = value
                            updateCursor.updateRow(row)
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages())

    def generate_transition_points(self, scratchGDB, transitions_fcs, building_floors):
        failed = False
        try:
            arcpy.AddIDMessage("INFORMATIVE", 180197)
            transition_points_fcs_list = []
            whereClause = ""
            fc_name = "PrelimTransitions"
            transition_points_start = os.path.join(scratchGDB,fc_name + "_Points_Start")
            transition_points_fcs_list.append(transition_points_start)
            arcpy.FeatureVerticesToPoints_management(transitions_fcs, transition_points_start, "START")

            transition_points_end = os.path.join(scratchGDB, fc_name + "_Points_End")
            transition_points_fcs_list.append(transition_points_end)
            arcpy.FeatureVerticesToPoints_management(transitions_fcs, transition_points_end, "END")
            arcpy.CalculateField_management(transition_points_end, self.TRANSITIONS_FROM_FLOOR_ID, "!" + self.TRANSITIONS_FROM_FLOOR_ID + "!", "PYTHON3")
            arcpy.CalculateField_management(transition_points_end, self.TRANSITIONS_TO_FLOOR_ID, "!" + self.TRANSITIONS_TO_FLOOR_ID + "!", "PYTHON3")

            # To bring transition points FC schema in line with the other point FCs,
            # add the point FCs' building ID/floor ID fields to transition points FCs.
            field_list = [field.baseName.upper() for field in arcpy.ListFields(transitions_fcs)]

            if self.FACILITY_ID_FIELD not in field_list:
                arcpy.AddField_management(transition_points_start, self.FACILITY_ID_FIELD, "TEXT", "", "", 50)
                arcpy.AddField_management(transition_points_end, self.FACILITY_ID_FIELD, "TEXT", "", "", 50)
            arcpy.CalculateField_management(transition_points_start, self.FACILITY_ID_FIELD, "!" + self.FACILITY_ID_FIELD + "!", "PYTHON3")
            arcpy.CalculateField_management(transition_points_end, self.FACILITY_ID_FIELD, "!" + self.FACILITY_ID_FIELD + "!", "PYTHON3")

            if self.LEVEL_ID_FIELD not in field_list:
                arcpy.AddField_management(transition_points_start, self.LEVEL_ID_FIELD, "TEXT", "", "", 255)
                arcpy.AddField_management(transition_points_end, self.LEVEL_ID_FIELD, "TEXT", "", "", 255)

            # we need to fill level id field here

            #get level id
            levelNames = []
            count = int(arcpy.GetCount_management(transitions_fcs).getOutput(0))
            idx = 0
            fromlevelNames = IndoorsUtilsModule.getUniqueValues(transitions_fcs,self.TRANSITIONS_FROM_FLOOR_ID)
            toLevelNames = IndoorsUtilsModule.getUniqueValues(transitions_fcs,self.TRANSITIONS_TO_FLOOR_ID)
            levelNames = list(fromlevelNames)

            for lName in toLevelNames:
                if lName not in levelNames:
                    levelNames.append(lName)
            if len(levelNames)>0:
                #Try with short name first. if no results try Name field
                qry = self.LEVELS_LAYER_SHORT_NAME_FIELD + " IN ("
                #'" + facilityName + "') AND " + self.LEVELS_NAME_SHORT + " IN ("
                for i, name in enumerate(levelNames):
                    qry = qry + "'" + name + "'"
                    if (i < len(levelNames) - 1):
                        qry = qry + ", "
                qry = qry + ")"

                levelNamesDict = {}

                with arcpy.da.SearchCursor(self.LEVELSFC, [self.LEVEL_ID_FIELD,self.LEVELS_LAYER_SHORT_NAME_FIELD, self.FACILITY_ID_FIELD], qry) as cursor:
                    for row in cursor:
                        levelNamesDict[row[0] + "," + row[2]] = row[1]
                        self.LEVELS_NAME_TYPE = self.LEVELS_LAYER_SHORT_NAME_FIELD

                if len(levelNamesDict) == 0:
                    qry = self.LEVELS_LAYER_NAME_FIELD + " IN ("
                    #'" + facilityName + "') AND " + self.LEVELS_NAME_SHORT + " IN ("
                    for i, name in enumerate(levelNames):
                        qry = qry + "'" + name + "'"
                        if (i < len(levelNames) - 1):
                            qry = qry + ", "
                    qry = qry + ")"

                    with arcpy.da.SearchCursor(self.LEVELSFC, [self.LEVEL_ID_FIELD,self.LEVELS_LAYER_NAME_FIELD, self.FACILITY_ID_FIELD], qry) as cursor:
                        for row in cursor:
                            levelNamesDict[row[0] + "," + row[2]] = row[1]
                            self.LEVELS_NAME_TYPE = self.LEVELS_LAYER_NAME_FIELD

                if len(levelNamesDict) > 0:
                    dictValues = levelNamesDict.values()
                    noDuplicates = []
                    [noDuplicates.append(x) for x in dictValues if x not in noDuplicates]
                    whereClause = self.TRANSITIONS_FROM_FLOOR_ID + " in ("
                    appendWhereClause = self.TRANSITIONS_TO_FLOOR_ID + " in ("
                    for i, value in enumerate(noDuplicates):
                        whereClause = whereClause + "'" + value + "'"
                        appendWhereClause = appendWhereClause + "'" + value + "'"
                        if (i < len(noDuplicates) - 1):
                            whereClause = whereClause + ", "
                            appendWhereClause = appendWhereClause + ", "
                    whereClause = whereClause + ")"
                    appendWhereClause = appendWhereClause + ")"
                    whereClause = whereClause + " or " + appendWhereClause

                with arcpy.da.UpdateCursor(transition_points_start, [self.LEVEL_ID_FIELD,self.TRANSITIONS_FROM_FLOOR_ID, self.FACILITY_ID_FIELD]) as cursor:
                    for row in cursor:
                        if row[1] in levelNamesDict.values():
                            for key, value in levelNamesDict.items():
                                if row[1] == value:
                                    fid = key.split(',')[1]
                                    if fid == row[2]:
                                        levelId = key.split(',')[0]
                                        new_row = [levelId, row[1], row[2]]
                                        cursor.updateRow(new_row)
                del cursor
                with arcpy.da.UpdateCursor(transition_points_end, [self.LEVEL_ID_FIELD,self.TRANSITIONS_TO_FLOOR_ID, self.FACILITY_ID_FIELD]) as cursor:
                    for row in cursor:
                        if row[1] in levelNamesDict.values():
                            for key, value in levelNamesDict.items():
                                if row[1] == value:
                                    fid = key.split(',')[1]
                                    if fid == row[2]:
                                        levelId = key.split(',')[0]
                                        new_row = [levelId, row[1], row[2]]
                                        cursor.updateRow(new_row)
                #shal we only have transitions where level id is not null??

                failed = False

            return transition_points_fcs_list, whereClause
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddError("{0}".format(e))
        finally:
            if failed:
                arcpy.AddIDMessage("ERROR",180203)
                return None, None

    def load_thinning_template(self, input_pathways, networkDataset):
        try:
            featureDatasetName,featureDatasetPath = self.getFeatureDataSet(input_pathways)
            scriptdir_path = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
            arctoolbox_path = os.path.abspath(os.path.join(scriptdir_path, os.pardir))
            resources_path = os.path.abspath(os.path.join(arctoolbox_path, os.pardir))
            __location__ = os.path.join(resources_path,"Indoors")
            prelimNetworkTempatePath = os.path.join(os.path.join(__location__, 'NetworkTemplates'), 'PrelimNetworkTemplate_Meters.xml')
            outputNDataset = arcpy.CreateNetworkDatasetFromTemplate_na(prelimNetworkTempatePath, featureDatasetPath)
            network_dataset = arcpy.Describe(outputNDataset).catalogPath
            arcpy.BuildNetwork_na(networkDataset)
            arcpy.AddIDMessage("INFORMATIVE", 180198)
            arcpy.AddMessage(arcpy.GetMessages())
            return networkDataset
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180204)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180204)
            arcpy.AddError("{0}".format(e))
            return None



    def getFeatureDataSet(self, fc):
      # get the path to the feature class
      fcPath = arcpy.Describe(fc).catalogPath
      fcContainer = os.path.dirname(fcPath)
      if arcpy.Describe(fcContainer).dataType == "FeatureDataset":
        desc = arcpy.Describe(fcContainer)
        fdsPath = desc.catalogPath
        fdsName = desc.name
        datasetName = fdsName.split('.')
        fdsName = datasetName[len(datasetName)-1]
        return fdsName,fdsPath
      else:
        return None, None

    def getLevelsName(self, facilityID):
        levelSNameDict = {}
        try:
            qry = self.FACILITY_ID_FIELD + " = " + IndoorsUtilsModule.handleSingleQuoteForQuery(facilityID)
            with arcpy.da.SearchCursor(self.LEVELSFC, [self.LEVEL_ID_FIELD, self.LEVELS_NAME_TYPE] , qry) as sCursor:
                for row in sCursor:
                    levelSNameDict[row[0]] = row[1]
            #return levelNameDict,levelSNameDict
            return levelSNameDict
        except:
            return levelSNameDict

    def verifyScratchWorkspace(self, scratch_gdb):
        verified = True
        try:
            test_table = arcpy.management.CreateTable(scratch_gdb, 'TEST_{}'.format(str(uuid.uuid4()).replace('-','_'))).getOutput(0)
            arcpy.management.Delete(test_table)
        except:
            verified = False
        finally:
            return verified

    def createScratchWorkspace(self):
        scratch_gdb = None
        try:
            temp_workspace = arcpy.env.scratchGDB
            path, file_name = os.path.split(temp_workspace)
            gdb_name = file_name.split('.')[0] + '{:%Y_%m_%d_%H%M%S}'.format(datetime.datetime.now())
            scratch_gdb = arcpy.management.CreateFileGDB(path, gdb_name).getOutput(0)
            if not self.verifyScratchWorkspace(scratch_gdb):
                arcpy.AddIDMessage("ERROR", 180053)
                return None

            return scratch_gdb
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180054)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180054)
            arcpy.AddError("{0}".format(e))
            return None



if __name__ == '__main__':
    ThinIndoorPathways()
