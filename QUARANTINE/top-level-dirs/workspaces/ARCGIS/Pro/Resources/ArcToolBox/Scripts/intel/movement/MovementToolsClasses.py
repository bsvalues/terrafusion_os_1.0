# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
intelMovementToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.6, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2020-03-02 - jjones - original writeup
* 2020-04-16 - jjones - updated default output feature name for classes
* 2020-05-01 - jjones - updated default output symbology for Find Cotravelers and Find Meeting Locations
* 2020-05-13 - jjones - updated tool parameter validation to prevent use of feature services
------------------------------------------------------------------------------
'''

import arcpy
import os

from typing import List

from intel.enumerations import TOOL_CATEGORY_MOVEMENT, \
                               Movement, \
                               MovementTracks, \
                               CompareAreasEnum, \
                               FindFrequentedLocationsEnum
from intel.errors import TimeEnablementError
from intel.utilities import validate_time_enablement, ParameterValidation, LocaleValidate
from intel.movement.utils import validate_input_source, validate_desktop_output


def get_feature_count(feature_class=None):
    result = arcpy.GetCount_management(feature_class)
    return int(result[0])


class FindCotravelers:
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Find Co-Travelers"
        self.description = "Identify Co-Travelers in a series of time-enabled points"
        self.category = TOOL_CATEGORY_MOVEMENT
        self.helpContext = 73060003

    def isLicensed(self):
        '''
        Check for Advanced license
        '''
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.CheckProduct("ArcInfo") in license_available:
                return True
            else:
                return False
        except Exception:
            return False

    def getParameterInfo(self):
        """Define parameter definitions"""
        input_features = arcpy.Parameter(
            displayName="Input Features",
            name="input_features",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Input")

        input_features.filter.list = ['POINT']

        out_featureclass = arcpy.Parameter(
            displayName="Output Feature Class",
            name="out_featureclass",
            datatype="DEFeatureClass",
            parameterType="Required",
            direction="Output")

        id_field = arcpy.Parameter(
            displayName="Track Field",
            name="id_field",
            datatype="Field",
            parameterType="Required",
            direction="Input")

        id_field.parameterDependencies = [input_features.name]
        id_field.filter.list = ['Short', 'Long', 'Text']

        search_distance = arcpy.Parameter(
            displayName="Search Distance",
            name="search_distance",
            datatype="GPLinearUnit",
            parameterType="Optional",
            direction="Input")

        search_distance.value = '100 Feet'
        
        time_difference = arcpy.Parameter(
            displayName="Time Difference",
            name="time_difference",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        time_difference.filter.list = ['Seconds', 'Minutes', 'Hours', 'Days']
        time_difference.value = '10 Seconds'

        input_type = arcpy.Parameter(
            displayName="Input Type",
            name="input_type",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")

        input_type_list = [Movement.ONE_FC.value, Movement.TWO_FC.value]
        input_type.filter.type = 'ValueList'
        input_type.filter.list = input_type_list

        input_type.value = input_type_list[0]

        secondary_features = arcpy.Parameter(
            displayName="Secondary Features",
            name="secondary_features",
            datatype="GPFeatureLayer",
            parameterType="Optional",
            direction="Input")

        secondary_features.filter.list = ['POINT']

        secondary_track_field = arcpy.Parameter(
            displayName="Secondary Track Field",
            name="secondary_id_field",
            datatype="Field",
            parameterType="Optional",
            direction="Input")

        secondary_track_field.parameterDependencies = [secondary_features.name]
        secondary_track_field.filter.list = ['Short', 'Long', 'Text']

        create_summary_table = arcpy.Parameter(
            displayName="Create Summary Table",
            name="create_summary_table",
            datatype="GPBoolean",
            parameterType="Optional",
            direction='Input'
        )

        create_summary_table.filter.type = 'ValueList'
        create_summary_table.filter.list = [
            Movement.CREATE_SUMMARY_TABLE.value,
            Movement.NO_SUMMARY_TABLE.value, 
        ]
        
        out_summary_table = arcpy.Parameter(
            displayName="Output Summary Table",
            name="out_summary_table",
            datatype="DETable",
            parameterType="Optional",
            direction="Output")

        include_min_cotraveling_duration = arcpy.Parameter(
            displayName="Include Minimum Cotraveling Duration Filter",
            name="include_min_cotraveling_duration",
            datatype="GPBoolean",
            parameterType="Optional",
            direction='Input'
        )

        include_min_cotraveling_duration.filter.type = 'ValueList'
        include_min_cotraveling_duration.filter.list = [
            "MIN_COTRAVELING_DURATION",
            "NO_MIN_COTRAVELING_DURATION", 
        ]

        min_cotraveling_duration = arcpy.Parameter(
            displayName="Minimum Cotraveling Duration",
            name="min_cotraveling_duration",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        min_cotraveling_duration.filter.list = [
            'Seconds', 
            'Minutes', 
            'Hours',
        ]

        params = [
            input_features,                             # 0
            out_featureclass,                           # 1
            id_field,                                   # 2
            search_distance,                            # 3
            time_difference,                            # 4
            input_type,                                 # 5
            secondary_features,                         # 6
            secondary_track_field,                      # 7
            create_summary_table,                       # 8
            out_summary_table,                          # 9
            include_min_cotraveling_duration,           # 10
            min_cotraveling_duration,                   # 11
        ]
        return params

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        input_layer = parameters[0].value
        if input_layer:
            d = arcpy.Describe(parameters[0])

            # time validation
            if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                pass
            else:
                if not hasattr(d, 'StartTimeField') or (
                        hasattr(d, 'StartTimeField') and not d.StartTimeField):
                    parameters[0].setIDMessage('ERROR', 120028,
                                                parameters[0].displayName)
                elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                    msg = arcpy.GetIDMessage(120040) % (
                    parameters[0].displayName, "instant", "interval")
                    parameters[0].setErrorMessage(f'120040: {msg}')

            if getattr(d, 'shapetype', None) not in ['Point']:
                parameters[0].setIDMessage('ERROR', 366)

            # input validation 
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[0].setIDMessage('ERROR', valid_input[1])

        loc = LocaleValidate()
        
        # check that distance is greater than zero
        if parameters[3].altered and parameters[3].hasBeenValidated:
            if parameters[3].value:
                value = parameters[3].valueAsText
                value = loc.convert_locale_string_to_float(value)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[3].setErrorMessage(arcpy.GetIDMessage(190270))

        # check that distance is greater than zero
        if parameters[4].altered and parameters[4].hasBeenValidated:
            if parameters[4].value:
                value = parameters[4].valueAsText
                value = loc.convert_locale_string_to_float(value)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[4].setErrorMessage(arcpy.GetIDMessage(190271))

        secondary_layer = parameters[6].value
        if secondary_layer:
            d = arcpy.Describe(parameters[6])
            if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                pass
            else:
                if not hasattr(d, 'StartTimeField') or (
                        hasattr(d, 'StartTimeField') and not d.StartTimeField):
                    parameters[6].setIDMessage('ERROR', 120028,
                                                parameters[0].displayName)
                elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                    msg = arcpy.GetIDMessage(120040) % (
                    parameters[6].displayName, "instant", "interval")
                    parameters[6].setErrorMessage(f'120040: {msg}')

            if getattr(d, 'shapetype', None) not in ['Point']:
                parameters[6].setIDMessage('ERROR', 366)

            # input validation 
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[6].setIDMessage('ERROR', valid_input[1])

        if (parameters[5].altered and parameters[5].valueAsText == Movement.TWO_FC.value) and not parameters[6].altered:
            parameters[6].setErrorMessage(arcpy.GetIDMessage(581))
        
        if parameters[6].altered and parameters[7].hasBeenValidated and not parameters[7].valueAsText:
            parameters[7].setErrorMessage(arcpy.GetIDMessage(581))

        if parameters[8].altered\
            and parameters[9].hasBeenValidated\
                and not parameters[9].valueAsText:
            parameters[9].setWarningMessage(arcpy.GetIDMessage(581))

        if parameters[8].hasBeenValidated\
            and not parameters[8].valueAsText\
                or parameters[8].valueAsText == Movement.NO_SUMMARY_TABLE.value:
            parameters[9].clearMessage()

        if parameters[9].value:
            st_ws = arcpy.Describe(os.path.dirname(parameters[9].valueAsText)).workspaceType
            if st_ws == 'RemoteDatabase':
                parameters[9].setErrorMessage(arcpy.GetIDMessage(581))

        if parameters[7].altered and parameters[6] is None:
            parameters[7] = None

        if parameters[9].altered and parameters[8] is None:
            parameters[9] = None

        if parameters[9].altered:
            d = arcpy.Describe(parameters[9])
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[9].setIDMessage('ERROR', valid_input[1])

        return

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        if parameters[5].value:
            if parameters[5].value == Movement.TWO_FC.value:
                parameters[6].enabled = True
                parameters[7].enabled = True

            else:
                parameters[6].enabled = False
                parameters[7].enabled = False

        if parameters[8].value:
            parameters[9].enabled = True
        else:
            parameters[9].enabled = False

        if parameters[10].value:
            parameters[11].enabled = True
        else:
            parameters[11].enabled = False

        parameters[9].value = validate_desktop_output(parameters[9].valueAsText, True)  # output validation

        
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        from intel.movement.FindCotravelers import CotravelersLogic

        source_features = parameters[0].valueAsText
        output_point_features = parameters[1].valueAsText
        src_unique_id = parameters[2].valueAsText
        search_distance = parameters[3].valueAsText
        time_difference = parameters[4].valueAsText
        input_type = parameters[5].valueAsText
        secondary_features = parameters[6].valueAsText
        secondary_id_field = parameters[7].valueAsText
        create_summary_table = parameters[8].valueAsText
        out_summary_table = parameters[9].valueAsText
        include_min_cotraveling_duration = parameters[10].valueAsText
        min_cotraveling_duration = parameters[11].valueAsText
        
        try:
            validate_time_enablement(input_feature_class=source_features)
        except TimeEnablementError:
            arcpy.AddError(arcpy.GetIDMessage(190280))
            exit()

        cotravelers = CotravelersLogic(source_features=source_features,
                                        src_unique_id=src_unique_id,
                                        search_distance=search_distance,
                                        output_point_features=output_point_features,
                                        time_difference=time_difference,
                                        input_type=input_type,
                                        secondary_features=secondary_features,
                                        secondary_id_field=secondary_id_field,
                                        create_summary_table=create_summary_table,
                                        out_summary_table=out_summary_table,
                                        include_min_time_cotraveling=include_min_cotraveling_duration,
                                        min_time_cotraveling=min_cotraveling_duration)

        
        result = cotravelers.find_cotravelers()

        arcpy.SetParameter(1, result.features)

        if result.summary_table is not None:
            arcpy.SetParameter(9, result.summary_table)

        if result.apply_style:
            arcpy.gp.setParameterSymbology(1, f"JSONRENDERER={result.style}")
    
        return


class FindMeetingLocations(ParameterValidation):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Find Meeting Locations"
        self.description = "Find locations where two or more identifiers were within a specified time distance of each other"
        self.category = TOOL_CATEGORY_MOVEMENT
        self.helpContext = 73060001

    def getParameterInfo(self):
        """Define parameter definitions"""
        in_features = arcpy.Parameter(
            displayName="Input Features",
            name="in_features",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Input")

        in_features.filter.list = ['POINT']

        output_area_features = arcpy.Parameter(
            displayName="Output Area Features",
            name="out_area_features",
            datatype="DEFeatureClass",
            parameterType="Required",
            direction="Output")

        output_point_features = arcpy.Parameter(
            displayName="Output Point Features",
            name="out_point_features",
            datatype="DEFeatureClass",
            parameterType="Required",
            direction="Output")

        in_unique_id = arcpy.Parameter(
            displayName="In Features Name Field",
            name="unique_name_field",
            datatype="Field",
            parameterType="Required",
            direction="Input")

        in_unique_id.parameterDependencies = [in_features.name]
        in_unique_id.filter.list = ['Short', 'Long', 'Text']

        search_distance = arcpy.Parameter(
            displayName="Search Distance",
            name="search_distance",
            datatype="GPLinearUnit",
            parameterType="Optional",
            direction="Input"
        )

        search_distance.value = '100 Meters'

        minimum_loiter_time = arcpy.Parameter(
            displayName="Minimum Loiter Time",
            name="minimum_loiter_time",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        minimum_loiter_time.value = '10 Minutes'
        minimum_loiter_time.filter.list = ['Seconds', 'Minutes', 'Hours',]

        time_relationship = arcpy.Parameter(
            displayName="Temporal Relationship",
            name="temporal_relationship",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")

        time_relationships: List[str] = [
            Movement.OVERLAPS.value,
            Movement.INTERSECTS.value,
        ]

        time_relationship.filter.type = 'ValueList'
        time_relationship.filter.list = time_relationships

        time_relationship.value = time_relationships[1]

        min_meeting_duration = arcpy.Parameter(
            displayName="Minimum Meeting Duration",
            name="min_meeting_duration",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        min_meeting_duration.filter.list = ['Seconds', 'Minutes', 'Hours',]

        max_meeting_duration = arcpy.Parameter(
            displayName="Maximum Meeting Duration",
            name="max_meeting_duration",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        max_meeting_duration.filter.list = ['Seconds', 'Minutes', 'Hours',]

        params = [
            in_features,                #0
            output_area_features,       #1
            output_point_features,      #2
            in_unique_id,               #3
            search_distance,            #4
            minimum_loiter_time,        #5
            time_relationship,          #6
            min_meeting_duration,       #7
            max_meeting_duration,       #8
        ]
        
        return params

    def isLicensed(self):
        '''
        Check for Advanced license
        '''
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.CheckProduct("ArcInfo") in license_available:
                return True
            else:
                return False
        except Exception:
            return False

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        input_layer = parameters[0].value
        if input_layer:
            d = arcpy.Describe(parameters[0])

            # time validation
            if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                pass
            else:
                if not hasattr(d, 'StartTimeField') or (
                        hasattr(d, 'StartTimeField') and not d.StartTimeField):
                    parameters[0].setIDMessage('WARNING', 120028,
                                                parameters[0].displayName)
                elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                    msg = arcpy.GetIDMessage(120040) % (
                    parameters[0].displayName, "instant", "interval")
                    parameters[0].setErrorMessage(f'120040: {msg}')

            if getattr(d, 'shapetype', None) not in ['Point']:
                parameters[0].setIDMessage('ERROR', 366)

            # input validation 
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[0].setIDMessage('ERROR', valid_input[1])

        if not parameters[1].altered and parameters[0].altered:
            parameters[1].value = self.validate_output_name(f"{parameters[0].valueAsText}_MeetingAreas")

        if not parameters[2].altered and parameters[0].altered:
            parameters[2].value = self.validate_output_name(f"{parameters[0].valueAsText}_MeetingDetails")

        if parameters[1].altered:
            d = arcpy.Describe(parameters[1])
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[1].setIDMessage('ERROR', valid_input[1])

        if parameters[2].altered:
            d = arcpy.Describe(parameters[2])
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[2].setIDMessage('ERROR', valid_input[1])

        loc = LocaleValidate()
        
        # check that distance is greater than zero
        if parameters[4].altered and parameters[3].hasBeenValidated:
            if parameters[4].value:
                value_str: str = parameters[4].valueAsText
                value = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[4].setErrorMessage(arcpy.GetIDMessage(190270))

        # check that distance is greater than zero
        if parameters[5].altered and parameters[4].hasBeenValidated:
            if parameters[5].value:
                value_str: str = parameters[5].valueAsText
                value = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[5].setErrorMessage(arcpy.GetIDMessage(190272))

        # check that time is greater than zero
        if parameters[7].altered:
            if parameters[7].value:
                value_str: str = parameters[7].valueAsText
                value = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[7].setErrorMessage(arcpy.GetIDMessage(190272))

        # check that time is greater than zero
        if parameters[8].altered:
            if parameters[8].value:
                value_str: str = parameters[8].valueAsText
                value = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[8].setErrorMessage(arcpy.GetIDMessage(190272))
        return

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        from .FindMeetingLocations import MeetingLocations

        in_features: str = parameters[0].valueAsText
        output_area_features: str = parameters[1].valueAsText
        output_point_features: str = parameters[2].valueAsText
        in_unique_id: str = parameters[3].valueAsText
        search_distance: str = parameters[4].valueAsText
        temporal_distance: str = parameters[5].valueAsText
        time_relationship: str = parameters[6].valueAsText
        min_meeting_duration: str = parameters[7].valueAsText
        max_meeting_duration: str = parameters[8].valueAsText
        
        try:
            validate_time_enablement(input_feature_class=in_features)
        except TimeEnablementError:
            arcpy.AddError(arcpy.GetIDMessage(190280))
            exit()

        meeting_locations = MeetingLocations(input_features=in_features,
                                             output_area_features=output_area_features,
                                             output_point_features=output_point_features,
                                             in_unique_id=in_unique_id,
                                             search_distance=search_distance,
                                             time_difference=temporal_distance,
                                             temporal_relationship=time_relationship,
                                             min_meeting_duration=min_meeting_duration,
                                             max_meeting_duration=max_meeting_duration)

        result= meeting_locations.find()

        arcpy.SetParameter(1, result.area_features)
        arcpy.SetParameter(2, result.point_features)

        if not result.empty_output:
            if get_feature_count(feature_class=result.point_features) > 5:
                arcpy.gp.setParameterSymbology(2, "JSONRENDERER={}".format(result.point_style))
            if get_feature_count(feature_class=result.area_features) > 5:
                arcpy.gp.setParameterSymbology(1, "JSONRENDERER={}".format(result.area_style))

        del meeting_locations
    
        return


class CompareAreas:
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Compare Areas"
        self.description = "Compares movement points across known locations"
        self.category = TOOL_CATEGORY_MOVEMENT
        self.helpContext = 73060002

    def getParameterInfo(self):
        """Define parameter definitions"""
        
        in_point_features = arcpy.Parameter(
            displayName="Input Point Features",
            name="in_point_features",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Input")

        in_point_features.filter.list = ['POINT']

        in_area_features = arcpy.Parameter(
            displayName="Input Area Features",
            name="in_area_features",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Input")

        in_area_features.filter.list = ['POLYGON']

        out_featureclass = arcpy.Parameter(
            displayName="Output Feature Class",
            name="out_featureclass",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Output")

        point_id_field = arcpy.Parameter(
            displayName="Point Features Name Field",
            name="point_id_field",
            datatype="Field",
            parameterType="Required",
            direction="Input")

        point_id_field.parameterDependencies = [in_point_features.name]
        point_id_field.filter.list = ['Short', 'Long', 'Text']

        area_id_field = arcpy.Parameter(
            displayName="Area Features Name Field",
            name="area_id_field",
            datatype="Field",
            parameterType="Required",
            direction="Input")

        area_id_field.parameterDependencies = [in_area_features.name]
        area_id_field.filter.list = ['Short', 'Long', 'Text']

        relationship = arcpy.Parameter(
            displayName="Relationship",
            name="relationship",
            datatype="GPString",
            parameterType="Required",
            direction="Input")

        relationships = [
            CompareAreasEnum.LOCATION_ONLY.value, 
            CompareAreasEnum.LOCATION_TIME.value
        ]
        
        relationship.filter.type = 'ValueList'
        relationship.filter.list = relationships

        relationship.value = relationships[0]


        time_difference = arcpy.Parameter(
            displayName="Time Difference",
            name="time_difference",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        time_relationship = arcpy.Parameter(
            displayName="Time Relationship",
            name="time_relationship",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")

        relationships = [
            CompareAreasEnum.NEAR.value,
            CompareAreasEnum.NEAR_BEFORE.value,
            CompareAreasEnum.NEAR_AFTER.value,
        ]

        time_relationship.filter.type = 'ValueList'
        time_relationship.filter.list = relationships


        time_statistics = arcpy.Parameter(
            displayName="Include Time Statistics",
            name="include_time_statistics",
            datatype="GPBoolean",
            parameterType="Optional",
            direction='Input'
        )

        time_statistics.filter.type = 'ValueList'
        time_statistics.filter.list = [
            CompareAreasEnum.TIME_STATS.value,
            CompareAreasEnum.NO_TIME_STATS.value, 
        ]

        time_statistics.value = False


        params = [
            in_point_features,      #0
            in_area_features,       #1
            out_featureclass,       #2
            point_id_field,         #3
            area_id_field,          #4
            relationship,           #5
            time_difference,        #6
            time_relationship,      #7
            time_statistics,        #8
        ]
        
        return params

    def isLicensed(self):
        '''
        Check for Advanced license
        '''
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.CheckProduct("ArcInfo") in license_available:
                return True
            else:
                return False
        except Exception:
            return False

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        parameters[2].value = validate_desktop_output(parameters[2].valueAsText, False)
        
        if parameters[5].value:
            if parameters[5].value == CompareAreasEnum.LOCATION_TIME.value:
                parameters[6].enabled = True
                parameters[7].enabled = True
                if not parameters[6].altered:
                    parameters[6].value = "1 Days"
                if not parameters[7].altered:
                    parameters[7].value = CompareAreasEnum.NEAR.value

            else:
                parameters[6].enabled = False
                parameters[7].enabled = False
        
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        # check that distance is greater than zero

        input_layer = parameters[0].value
        area_layer = parameters[1].value
        
        if input_layer:
            d = arcpy.Describe(parameters[0])
            a = arcpy.Describe(parameters[1])

            # input validation 
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[0].setIDMessage('ERROR', valid_input[1])

            valid_input = validate_input_source(a)
            if not valid_input[0]:
                parameters[1].setIDMessage('ERROR', valid_input[1])

            if parameters[5].value == CompareAreasEnum.LOCATION_TIME.value:
                if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                    pass
                else:
                    if not hasattr(d, 'StartTimeField') or (
                            hasattr(d, 'StartTimeField') and not d.StartTimeField):
                        parameters[0].setIDMessage('WARNING', 120028,
                                                    parameters[0].displayName)
                    elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                        msg = arcpy.GetIDMessage(120040) % (
                        parameters[0].displayName, "instant", "interval")
                        parameters[0].setErrorMessage(f'120040: {msg}')

                if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                    pass
                else:
                    if not hasattr(d, 'StartTimeField') or (
                            hasattr(d, 'StartTimeField') and not d.StartTimeField):
                        parameters[1].setIDMessage('WARNING', 120028,
                                                    parameters[1].displayName)
                    elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                        msg = arcpy.GetIDMessage(120040) % (
                        parameters[1].displayName, "instant", "interval")
                        parameters[1].setErrorMessage(f'120040: {msg}')

            if parameters[8].value or parameters[8].value == CompareAreasEnum.TRUE.value:
                if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                    pass
                else:
                    if not hasattr(d, 'StartTimeField') or (
                            hasattr(d, 'StartTimeField') and not d.StartTimeField):
                        parameters[0].setIDMessage('ERROR', 120028,
                                                    parameters[0].displayName)
                    elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                        msg = arcpy.GetIDMessage(120040) % (
                        parameters[0].displayName, "instant", "interval")
                        parameters[0].setErrorMessage(f'120040: {msg}')

        loc = LocaleValidate()

        if parameters[6].altered and parameters[4].hasBeenValidated:
            if parameters[6].value:
                value_str: str = parameters[6].valueAsText
                value: float = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[6].setErrorMessage(arcpy.GetIDMessage(190271))

        return

    def execute(self, parameters, messages):
        from intel.movement.CompareAreas import Compare_Areas
      
        point_features: str = parameters[0].valueAsText
        area_features: str = parameters[1].valueAsText
        out_featureclass: str = parameters[2].valueAsText
        point_id_field: str = parameters[3].valueAsText
        area_id_field: str = parameters[4].valueAsText
        relationship: str = parameters[5].valueAsText
        time_difference: str = parameters[6].valueAsText
        time_relationship: str = parameters[7].valueAsText
        time_statistics: str = parameters[8].valueAsText

        if relationship == CompareAreasEnum.LOCATION_TIME.value:
            try:
                validate_time_enablement(input_feature_class=area_features)
            except TimeEnablementError:
                arcpy.AddError(arcpy.GetIDMessage(190282))
                exit()

        if relationship == CompareAreasEnum.LOCATION_TIME.value or time_statistics == CompareAreasEnum.TRUE.value:
            try:
                validate_time_enablement(input_feature_class=point_features)
            except TimeEnablementError:
                arcpy.AddError(arcpy.GetIDMessage(190281))
                exit()

        ca = Compare_Areas(input_point_features=point_features,
                           input_area_features=area_features,
                           output_featureclass=out_featureclass,
                           point_id_field=point_id_field,
                           area_id_field=area_id_field,
                           relationship=relationship,
                           time_difference=time_difference,
                           time_relationship=time_relationship,
                           time_statistics=time_statistics)

        compared_features = ca.compare()

        if compared_features:
            arcpy.SetParameter(2, compared_features)

        del ca

        return


class ClassifyMovementEvents(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Classify Movement Events"
        self.description = ""
        self.category = TOOL_CATEGORY_MOVEMENT
        self.helpContext = 73060004

    def getParameterInfo(self):
        """Define parameter definitions"""
        in_features = arcpy.Parameter(
            displayName="Input Features",
            name="in_features",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Input"
        )

        in_features.filter.list = ['POINT', 'POLYGON']
        
        id_field = arcpy.Parameter(
            displayName="ID Field",
            name="id_field",
            datatype="Field",
            parameterType="Required",
            direction="Input")

        id_field.parameterDependencies = [in_features.name]
        id_field.filter.list = ['Short', 'Long', 'Text']

        out_featureclass = arcpy.Parameter(
            displayName="Output Feature Class",
            name="out_featureclass",
            datatype="DEFeatureClass",
            parameterType="Required",
            direction="Output"
        )
        curvature = arcpy.Parameter(
            displayName="Curvature",
            name="curvature",
            datatype="GPDouble",
            parameterType="Optional",
            direction="Input"
        )
        curvature.value = 15

        number_of_points = arcpy.Parameter(
            displayName="Number Of Points",
            name="number_of_points",
            datatype="GPLong",
            parameterType="Optional",
            direction="Input"
        )
        number_of_points.value = 1

        regions_of_interest = arcpy.Parameter(
            displayName="Regions Of Interest",
            name="regions_of_interest",
            datatype="GPFeatureLayer",
            parameterType="Optional",
            direction="Input"
        )
        regions_of_interest.filter.list = ['POLYGON']

        roi_id_field = arcpy.Parameter(
            displayName="Regions Of Interest ID Field",
            name="roi_id_field",
            datatype="Field",
            parameterType="Optional",
            direction="Input")

        roi_id_field.parameterDependencies = [regions_of_interest.name]
        roi_id_field.filter.list = ['Short', 'Long', 'Text']

        turn_id_field = arcpy.Parameter(
            displayName="Create Turn Event Identifiers",
            name="include_turn_ids",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input")

        turn_id_field.filter.type = 'ValueList'
        turn_id_field.filter.list = [
            Movement.TURN_ID.value,
            Movement.NO_TURN_ID.value, 
        ]

        turn_id_field.value = Movement.NO_TURN_ID.value 

        exclude_non_turns = arcpy.Parameter(
            displayName="Exclude Non-Turn Events",
            name="exclude_non_turn_events",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input")

        exclude_non_turns.filter.type = 'ValueList'
        exclude_non_turns.filter.list = [
            Movement.TURN_EVENTS.value,
            Movement.ALL_FEATURES.value, 
        ]

        exclude_non_turns.value = Movement.ALL_FEATURES.value

        turn_events_representation = arcpy.Parameter(
            displayName="Turn Events Feature Representation",
            name="turn_events_representation",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")

        turn_events_representation.filter.type = 'ValueList'
        turn_events_representation.filter.list = [
            Movement.ALL_FEATURES.value,
            Movement.MIDPOINT.value,
        ]  

        turn_events_representation.value = Movement.ALL_FEATURES.value

        params = [
            in_features,                        #0
            id_field,                           #1
            out_featureclass,                   #2
            curvature,                          #3
            number_of_points,                   #4
            regions_of_interest,                #5
            roi_id_field,                       #6
            turn_id_field,                      #7
            exclude_non_turns,                  #8
            turn_events_representation,         #9
            ]
        
        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""  
        
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        input_layer = parameters[0].value
        if input_layer:
            d = arcpy.Describe(parameters[0])
            # time validation
            if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                pass
            else:
                if not hasattr(d, 'StartTimeField') or (
                        hasattr(d, 'StartTimeField') and not d.StartTimeField):
                    parameters[0].setIDMessage('ERROR', 120028,
                                                parameters[0].displayName)
                elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                    msg = arcpy.GetIDMessage(120040) % (
                    parameters[0].displayName, "instant", "interval")
                    parameters[0].setErrorMessage(f'120040: {msg}')

            if getattr(d, 'shapetype', None) not in ['Point']:
                parameters[0].setIDMessage('ERROR', 366)

            # input validation 
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[0].setIDMessage('ERROR', valid_input[1])

        # check that input features are projected
        if parameters[0].altered and parameters[0].hasBeenValidated:
            if arcpy.Describe(parameters[0].value).spatialReference.type != "Projected":
                parameters[0].setErrorMessage(arcpy.GetIDMessage(190291))

        if parameters[5].altered and not parameters[6].altered:
            parameters[6].setErrorMessage(arcpy.GetIDMessage(581))

        if parameters[5].altered:
            a = arcpy.Describe(parameters[5])
            valid_area = validate_input_source(a)
            if not valid_area[0]:
                parameters[5].setIDMessage('ERROR', valid_area[1])

        if parameters[2].altered:
            d = arcpy.Describe(parameters[2])
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[2].setIDMessage('ERROR', valid_input[1])
        
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""

        try:
            from intel.movement.ClassifyMovementEvents import MovementEvents
            sr: arcpy.SpatialReference = arcpy.Describe(parameters[0].valueAsText).spatialReference
            if sr.type == 'Projected':
                unit: str = sr.linearUnitName

                movement_events = MovementEvents(input_features=parameters[0].valueAsText,
                                                 id_field=parameters[1].valueAsText,
                                                 out_featureclass=parameters[2].valueAsText,
                                                 minimum_curvature=float(parameters[3].valueAsText),
                                                 num_points=int(parameters[4].valueAsText),
                                                 linear_unit=unit,
                                                 regions_of_interest=parameters[5].valueAsText,
                                                 roi_id_field=parameters[6].valueAsText,
                                                 create_turn_ids=parameters[7].valueAsText,
                                                 return_turn_events=parameters[8].valueAsText,
                                                 turn_mid_points=parameters[9].valueAsText)

                feature = movement_events.calculate()

                arcpy.SetParameter(1, feature)

                del movement_events
            else:
                arcpy.AddError(arcpy.GetIDMessage(190291))
                exit()
        except (TypeError, arcpy.ExecuteError) as e:
            arcpy.AddError(e)
            arcpy.AddError(arcpy.GetMessages(2))


class SelectMovementTracks(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Select Movement Tracks"
        self.description = """Select movement tracks that intersect an area of 
                           interest with the option of selecting portions of the 
                           track before or after the area of interest."""

        self.category = TOOL_CATEGORY_MOVEMENT
        self.helpContext = 73060005


    def getParameterInfo(self):
        """Define parameter definitions"""
        in_features = arcpy.Parameter(
            displayName = "Input Features",
            name = "in_features",
            datatype = "GPFeatureLayer",
            parameterType = "Required",
            direction = "Input")

        in_features.filter.list = ['POINT']

        track_id_field = arcpy.Parameter(
            displayName = "Track ID Field",
            name = "track_id_field",
            datatype = "Field",
            parameterType = "Required",
            direction = "Input")
        track_id_field.parameterDependencies = [in_features.name]

        updated_featureclass = arcpy.Parameter(
            displayName="Updated Features",
            name="updated_featureclass",
            datatype="GPFeatureLayer",
            parameterType="Derived",
            direction="Output")

        updated_featureclass.parameterDependencies = [in_features.name]

        aoi = arcpy.Parameter(
            displayName = "Area Of Interest",
            name = "area_of_interest",
            datatype = "GPFeatureRecordSetLayer",
            parameterType = "Required",
            direction = "Input")
        aoi.filter.list = ['Polygon']

        time_relationship = arcpy.Parameter(
            displayName="Time Relationship",
            name="time_relationship",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")

        relationships = [
            MovementTracks.BEFORE_AFTER.value, 
            MovementTracks.BEFORE.value, 
            MovementTracks.AFTER.value, 
            MovementTracks.NONE.value
        ]
        
        time_relationship.filter.type = 'ValueList'
        time_relationship.filter.list = relationships
        time_relationship.value  = MovementTracks.NONE.value

        selection_time = arcpy.Parameter(
            displayName="Selection Time",
            name="selection_time",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")
        

        params = [
            in_features,                # 0
            track_id_field,             # 1
            aoi,                        # 2
            time_relationship,          # 3
            selection_time,             # 4
            updated_featureclass        # 5
        ]
        
        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if not parameters[3].altered or parameters[3].value == MovementTracks.NONE.value:
            parameters[4].enabled = False
        else:
            parameters[4].enabled = True
            parameters[4].filter.list = ['Seconds', 'Minutes', 'Hours', 'Days']
            if not parameters[4].altered:
                parameters[4].value = '1 Hours'

        
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        input_layer = parameters[0].value

        if input_layer:
            d = arcpy.Describe(parameters[0])

            # input validation 
            valid_input = validate_input_source(d)
            if not valid_input[0]:
                parameters[0].setIDMessage('ERROR', valid_input[1])

            if parameters[3].value != "NONE":
                if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                    pass
                else:
                    if not hasattr(d, 'StartTimeField') or (
                            hasattr(d, 'StartTimeField') and not d.StartTimeField):
                        parameters[0].setIDMessage('ERROR', 120028,
                                                    parameters[0].displayName)
                    elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                        msg = arcpy.GetIDMessage(120040) % (
                        parameters[0].displayName, "instant", "interval")
                        parameters[0].setErrorMessage(f'120040: {msg}')
        
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""
        from intel.movement.SelectMovementTrack import MovementTrack

        SOURCE_FEAT_CLASS: str = parameters[0].valueAsText
        SOURCE_ID_FIELD: str = parameters[1].valueAsText
        INPUT_ROI: str = parameters[2].valueAsText
        SELECTION_TIME: str = parameters[4].valueAsText
        TIME_FRAME: str = parameters[3].valueAsText
        
        smt = MovementTrack(source_feature_class=SOURCE_FEAT_CLASS,
                            source_id_field=SOURCE_ID_FIELD,
                            input_roi=INPUT_ROI,
                            selection_time=SELECTION_TIME,
                            time_frame=TIME_FRAME)

        smt.select()


class FindFrequentedLocations(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Find Frequented Locations"
        self.description = ""
        self.category = TOOL_CATEGORY_MOVEMENT
        self.helpContext = 73060006

    def getParameterInfo(self):
        """Define parameter definitions"""
        in_features = arcpy.Parameter(
            displayName="Input Features",
            name="in_features",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Input")

        in_features.filter.list = ['POINT']

        in_unique_id = arcpy.Parameter(
            displayName="Track ID Field",
            name="track_id_field",
            datatype="Field",
            parameterType="Required",
            direction="Input")

        in_unique_id.parameterDependencies = [in_features.name]
        in_unique_id.filter.list = ['Short', 'Long', 'Text']

        out_featureclass = arcpy.Parameter(
            displayName="Output Feature Class",
            name="out_featureclass",
            datatype="DEFeatureClass",
            parameterType="Required",
            direction="Output")

        sql_query = arcpy.Parameter(
            displayName="Expression",
            name="expression",
            datatype="GPSQLExpression",
            parameterType="Optional",
            direction="Input"
        )

        sql_query.parameterDependencies = [in_features.name]

        search_distance = arcpy.Parameter(
            displayName="Search Distance",
            name="search_distance",
            datatype="GPLinearUnit",
            parameterType="Optional",
            direction="Input"
        )

        search_distance.value = '100 Meters'
        search_distance.filter.list = ["Feet", "Yards", "Miles", "NauticalMiles", "Meters", "Kilometers"]
        
        minimum_loiter_time = arcpy.Parameter(
            displayName="Minimum Loiter Time",
            name="minimum_loiter_time",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        minimum_loiter_time.value = '10 Minutes'
        minimum_loiter_time.filter.list = ['Seconds', 'Minutes', 'Hours', 'Days',]

        time_boundary = arcpy.Parameter(
            displayName="Time Boundary",
            name="time_boundary",
            datatype="GPTimeUnit",
            parameterType="Optional",
            direction="Input")

        time_boundary.value = '1 Days'
        time_boundary.filter.list = ['Seconds', 'Minutes', 'Hours', 'Days', 'Weeks']

        min_dwells = arcpy.Parameter(
            displayName="Minimum Dwells Per Locations",
            name="minimum_dwells",
            datatype="GPLong",
            parameterType="Optional",
            direction="Input")

        min_dwells.value = 1

        normalize_daily_distribution = arcpy.Parameter(
            displayName="Normalize Daily Distribution",
            name="normalize_daily_distribution",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input")

        norm_list = [
            FindFrequentedLocationsEnum.NORM.value, 
            FindFrequentedLocationsEnum.REAL.value,
        ]
                
        normalize_daily_distribution.filter.type = 'ValueList'
        normalize_daily_distribution.filter.list = norm_list 
        normalize_daily_distribution.value = norm_list[1]    

        summary_fields = arcpy.Parameter(
            displayName="Summary Fields",
            name="summary_fields",
            datatype="GPValueTable",
            parameterType="Optional",
            direction="Input")

        summary_fields.columns = [['GPString', 'Value'], ['GPString', 'Statistic Type']]
        summary_fields.filters[0].type = 'ValueList'
        summary_fields.filters[0].list = [
            FindFrequentedLocationsEnum.DD.value, 
            FindFrequentedLocationsEnum.START_TIME.value, 
            FindFrequentedLocationsEnum.END_TIME.value,
        ]
        
        summary_fields.filters[1].type = 'ValueList'
        summary_fields.filters[1].list = ['MIN', 'MAX', 'STD', 'MEAN']

        params = [
            in_features,                    #0
            in_unique_id,                   #1
            out_featureclass,              #2
            sql_query,                      #3
            search_distance,                #4
            minimum_loiter_time,            #5
            time_boundary,                  #6
            min_dwells,                     #7
            normalize_daily_distribution,        #8
            summary_fields,                 #9
        ]
        return params

    def isLicensed(self):
        '''
        Check for Advanced license
        '''
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.CheckProduct("ArcInfo") in license_available:
                return True
            else:
                return False
        except Exception:
            return False

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        input_layer = parameters[0].value
        if input_layer:
            d = arcpy.Describe(parameters[0])
            # time validation
            if d.dataType == "BDFeatureClass" or d.dataType == "BDTable":
                pass
            else:
                if not hasattr(d, 'StartTimeField') or (
                        hasattr(d, 'StartTimeField') and not d.StartTimeField):
                    parameters[0].setIDMessage('ERROR', 120028,
                                                parameters[0].displayName)
                elif hasattr(d, 'EndTimeField') and d.EndTimeField:
                    msg = arcpy.GetIDMessage(120040) % (
                    parameters[0].displayName, "instant", "interval")
                    parameters[0].setErrorMessage(f'120040: {msg}')

            if getattr(d, 'shapetype', None) not in ['Point']:
                parameters[0].setIDMessage('ERROR', 366)

        loc = LocaleValidate()
        
        # check that search distance is greater than zero
        if parameters[4].altered:
            if parameters[4].value:
                value_str: str = parameters[4].valueAsText
                value = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[4].setErrorMessage(arcpy.GetIDMessage(190270))

        # check that minimum loiter time is greater than zero
        if parameters[5].altered:
            if parameters[5].value:
                value_str: str = parameters[5].valueAsText
                value = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[5].setErrorMessage(arcpy.GetIDMessage(190272))

        # check that time boundary is greater than zero
        if parameters[6].altered:
            if parameters[6].value:
                value_str: str = parameters[6].valueAsText
                value = loc.convert_locale_string_to_float(value_str)
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[6].setErrorMessage(arcpy.GetIDMessage(190301))

        # check that minimum dwells is greater than zero
        if parameters[7].altered:
            if parameters[7].value:
                value_str: str = parameters[7].valueAsText
                value = float(value_str.split(" ")[0])
                if value <= 0:
                    # have to add this to GP intel messages, and XMetaL doc
                    parameters[7].setErrorMessage(arcpy.GetIDMessage(190302))
        
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""

        from intel.movement.FindFrequentedLocations import FrequentedLocations
        
        fl = FrequentedLocations(features=parameters[0].valueAsText,
                                 unique_id_field=parameters[1].valueAsText,
                                 out_features=parameters[2].valueAsText,
                                 expression=parameters[3].valueAsText,
                                 search_distance=parameters[4].valueAsText,
                                 loiter_time=parameters[5].valueAsText,
                                 boundary=parameters[6].valueAsText,
                                 min_dwells=parameters[7].value,
                                 norm_daily_dist=parameters[8].valueAsText,
                                 summary_fields=parameters[9].value)

        result = fl.find()

        arcpy.SetParameter(2, result)
        
        return