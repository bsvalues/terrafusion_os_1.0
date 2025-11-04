# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
PointToTrackSegmentsLogic.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 3/26/2017 - phill - original writeup
* 2019-05-05 - mfunk - move timezone.shp to data folder
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2019-10-14 - mfunk - fix import references for performance
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-03-17 - mfunk - add output points, update symbology, option velocity
* 2020-04-13 - mfunk - move arcgis api import into __init__ Python issue 1197
* 2020-09-04 - mfunk - process lines and points within pandas dataframes
* 2020-12-15 - mfunk - fix FD outputs #2439
* 2021-02-09 - mfunk - fix #2483 and #2481
* 2021-05-21 - mfunk - fixes for issue 1535
* 2021-07-08 - mfunk - fix for issue 2690
* 2021-07-08 - mfunk - Add error decorator
* 2022-02-08 - mfunk - Issues 2822 and 2902, add error_on_duplicate_timestamps
                       and keep_input_fields.
* 2022-03-08 - mfunk - Optimizing Points To Track Segments based on memory
                       consumption.
* 2022-12-20 - mfunk - Issue 3298: fix for null value in track group field
------------------------------------------------------------------------------
'''
from __future__ import annotations
import arcpy
import os
import sys
import traceback
from dataclasses import dataclass
from arcpy.arcobjects.arcobjects import Point
import pandas as pd
import numpy as np
import json
from datetime import datetime
from copy import deepcopy
from typing import List, Dict, Optional, Any
import logging
from intel.errors import DuplicateDates
from intel.utilities import DEBUG, \
                            MsgType, \
                            create_scratch_geodatabase, \
                            create_temp_table_name, \
                            Logger
from intel.enumerations import WorkspaceFactoryEnum
from intel.enumerations import PointsToTrackSegmentsFieldNames
from intel.utilities.ErrorHandlers import general_error_logger


@dataclass(frozen=True)
class Color:
    red: int
    green: int
    blue: int
    alpha: int


class RandomColor(object):

    def __init__(self):
        import random
        self._base_color = Color
        self._base_color.alpha = 60
        self._base_color.red = random.randint(0, 255)
        self._base_color.green = random.randint(0, 255)
        self._base_color.blue = random.randint(0, 255)

    @property
    def red(self) -> int:
        return self._base_color.red

    @property
    def green(self) -> int:
        return self._base_color.green

    @property
    def blue(self) -> int:
        return self._base_color.blue

    def color(self) -> List[int]:
        return [self._base_color.red,
                self._base_color.green,
                self._base_color.blue,
                self._base_color.alpha]


class ColorSet(object):

    def __init__(self, id_list: Optional[List[Any]] = None):

        self._color_list: Dict[Any, List[int]] = {}
        self.default_yellow: Dict[str, List[int]] = {"default": [255, 217, 56, 60]}
        if id_list is None:
            self._color_list = self.default_yellow
        else:
            for i in id_list:
                self._color_list[i] = list(RandomColor().color())

    @property
    def asDict(self) -> Dict[Any, List[int]]:
        return self._color_list


class SymbolFiles(object):
    def __init__(self):

        self._dir_path = os.path.dirname(os.path.realpath(__file__))
        self._style_path = os.path.join(self._dir_path, "styles")

        # track files
        self._track_group_26 = "track_groups_cim_26.json"
        self._track_no_group_26 = "track_no_groups_cim_26.json"
        self._track_symbology_26 = "track_symbology_class_cim_26.json"

        # point files
        self._point_group_26 = "point_groups_cim_26.json"
        self._point_no_group_26 = "point_no_group_cim_26.json"
        self._point_symbology_26 = "point_symbology_class_cim_26.json"

    @property
    def base_track_file(self):
        return os.path.join(self._style_path, self._track_symbology_26)

    @property
    def base_point_file(self):
        return os.path.join(self._style_path, self._point_symbology_26)

    @general_error_logger
    def getFile(self, version: str | None, is_group: bool) -> List[str, str]:
        track_file: str
        point_file: str
        if version == "2.6.0":
            if is_group:
                track_file: str = os.path.join(self._style_path, self._track_group_26)
                point_file: str = os.path.join(self._style_path, self._point_group_26)
            else:
                track_file: str = os.path.join(self._style_path, self._track_no_group_26)
                point_file: str = os.path.join(self._style_path, self._point_no_group_26)
        else:
            if is_group:
                track_file: str = os.path.join(self._style_path, self._track_group_26)
                point_file: str = os.path.join(self._style_path, self._point_group_26)
            else:
                track_file: str = os.path.join(self._style_path, self._track_no_group_26)
                point_file: str = os.path.join(self._style_path, self._point_no_group_26)

        # Check that the files exist
        msg: str = str(arcpy.GetIDMessage(86287))
        if not os.path.exists(track_file):
            arcpy.AddError(f"{msg}: {track_file}")
            raise FileNotFoundError
        if not os.path.exists(point_file):
            arcpy.AddError(f"{msg}: {point_file}")
            raise FileNotFoundError

        if DEBUG:
            arcpy.AddMessage(f"Getting track json file: {track_file}")
            arcpy.AddMessage(f"Getting point json file: {point_file}")

        return [track_file, point_file]


class BaseLYRX(object):
    def __init__(self, current_map: Optional[arcpy.Map] = None):
        self._active_map = current_map

    @general_error_logger
    def getWorkspaceFactory(self, workspace: str) -> List[str | None]:

        @general_error_logger
        def getWSFType(progID: str) -> Optional[str]:
            '''
            Return a CIM WorkspaceFactory enum for the workspace based on the input progID
            https://github.com/Esri/cim-spec/blob/master/docs/v2/CIMVectorLayers.md#cimworkspaceconnection
            '''
            if progID.startswith("esriDataSourcesGDB.FileGDBWorkspaceFactory"):
                return WorkspaceFactoryEnum.FileGDB.value  # "FileGDB"
            elif progID.startswith("esriDataSourcesGDB.SdeWorkspaceFactory"):
                return WorkspaceFactoryEnum.SDE.value  # "SDE"
            elif progID.startswith("esriDataSourcesGDB.AccessWorkspaceFactory"):
                # Personal Geodatabases are not supported!
                return WorkspaceFactoryEnum.Access.value  # "Access"
            elif progID.startswith("esriDataSourcesGDB.MemoryWorkspaceFactory"):
                return WorkspaceFactoryEnum.Memory.value  # "Memory"
            elif progID.startswith("esriDataSourcesGDB.InMemoryWorkspaceFactory"):
                return WorkspaceFactoryEnum.InMemoryDB.value  # "InMemoryDB"
            elif progID.startswith("esriDataSourcesGDB.SqliteWorkspaceFactory"):
                # Mobile Geodatabase
                return WorkspaceFactoryEnum.Sqlite.value  # "SqlLite"
            elif progID == "":
                # Assume Shapefile for output into folder
                return WorkspaceFactoryEnum.Shapefile.value  # "Shapefile"
            else:
                return None

        workspace_factory: Optional[str] = None
        workingWS: str = workspace
        originalWorkspaceDescribe: Any = arcpy.Describe(workingWS)

        # first check if the path is a workspace, in that it has a ProgID property
        if hasattr(originalWorkspaceDescribe, 'workspaceFactoryProgID'):
            workspace_factory_progid: str = originalWorkspaceDescribe.workspaceFactoryProgID
            workspace_factory = getWSFType(workspace_factory_progid)

        # if no, then is it a path to a feature dataset in a GDB?
        elif hasattr(originalWorkspaceDescribe, 'datasetType'):
            if originalWorkspaceDescribe.datasetType == 'FeatureDataset':
                # if it is a Feature Datset we need to go up one level for workspace type
                workingWS: str = os.path.dirname(workspace)
                workingDescribe: Any = arcpy.Describe(workingWS)
                workspace_factory_progid: str = workingDescribe.workspaceFactoryProgID
                workspace_factory = getWSFType(workspace_factory_progid)
                workspace = workingWS
        else:
            workspace_factory = None

        return [workspace_factory, workspace]

    @general_error_logger
    def getLYRXPath(self, output_features: str) -> List[str | bool]:

        # check workspace
        folder_path: str | None = None
        layer_name: str | None = None

        # Get correct workspace
        initial_workspace: str = os.path.dirname(output_features)
        initial_describe: Any = arcpy.Describe(initial_workspace)
        corrected_workspace: str = initial_workspace
        workspace_type: str | None = None
        has_feature_dataset: bool = False
        if hasattr(initial_describe, 'workspaceType'):
            # get workspace type
            workspace_type = str(arcpy.Describe(os.path.dirname(output_features)).workspaceType)
        elif hasattr(initial_describe, 'datasetType'):
            if initial_describe.datasetType == 'FeatureDataset':
                corrected_workspace = os.path.dirname(initial_workspace)
                workspace_type = str(arcpy.Describe(corrected_workspace).workspaceType)
                has_feature_dataset = True
        else:
            pass

        # for FGDB set layer and path
        if workspace_type == 'LocalDatabase':
            layer_name = os.path.basename(output_features)  # assume no extension for db features
            if has_feature_dataset:
                folder_path = os.path.dirname(os.path.dirname(os.path.dirname(output_features)))
            else:
                folder_path = os.path.dirname(os.path.dirname(output_features))
        # for shapefiles, set layer and path
        elif workspace_type == 'FileSystem':
            # check extension is shapefile
            if os.path.splitext(output_features)[1] == '.shp':
                layer_name = os.path.splitext(os.path.basename(output_features))[0]
                folder_path = os.path.dirname(output_features)
            # some other file system that isn't shapefile
            else:
                # if DEBUG:
                #     self._logger.debug(f"WARNING: {workspace_type} but not Shapefile")
                layer_name = os.path.basename(output_features)
                folder_path = str(arcpy.env.scratchFolder)
        # for SDE
        elif workspace_type == 'RemoteDatabase':
            layer_name = os.path.basename(output_features)
            folder_path = str(arcpy.env.scratchFolder)
        else:
            # if not LocalDatabase, RemoteDatabase, or FileSystem
            # if DEBUG:
            #     self._logger.debug(f"Other workspace type: {workspace_type}")
            layer_name = os.path.basename(output_features)
            folder_path = str(arcpy.env.scratchFolder)

        layer_file: str = f"{layer_name}.lyrx"
        lyrx_path: str = os.path.join(folder_path, layer_file)

        return [lyrx_path, has_feature_dataset]

    @staticmethod
    @general_error_logger
    def _getTimeScale(start_time: datetime.datetime,
                      end_time: datetime.datetime) -> str:
        """_getTimeScale Find correct time scale for start and end times

        get appropriate time scale based on start/end time

        Pro SDK Time Units enumeration doc
        https://pro.arcgis.com/en/pro-app/sdk/api-reference/#topic118.html

        :param start_time: starting time
        :type start_time: datetime.datetime
        :param end_time: ending time
        :type end_time: datetime.datetime
        :return: time scale enum
        :rtype: str
        """
        time_difference: datetime.timedelta = end_time - start_time
        days_between: int = time_difference.days
        seconds_between: int = time_difference.seconds
        scale: str
        if days_between > 40000:
            scale = "esriTimeUnitsCenturies"
        elif days_between > 5000 and days_between <= 40000:
            scale = "esriTimeUnitsDecades"
        elif days_between > 1000 and days_between <= 5000:
            scale = "esriTimeUnitsYears"
        elif days_between > 90 and days_between <= 1000:
            scale = "esriTimeUnitsMonths"
        elif days_between > 15 and days_between <= 90:
            scale = "esriTimeUnitsWeeks"
        elif days_between > 3 and days_between <= 15:
            scale = "esriTimeUnitsDays"
        elif days_between >= 0 and days_between <= 3 and seconds_between >= 3500:
            scale = "esriTimeUnitsHours"
        elif days_between == 0 and (seconds_between > 0 and seconds_between < 3500):
            scale = "esriTimeUnitsMinutes"
        else:
            scale = "esriTimeUnitsUnknown"
        return scale

    # @general_error_logger
    def getCurrentMap(self) -> Any:
        """_getCurrentMap get current active map

        get active map in Pro, otherwise return None

        :return: Return current map, otherwise None
        :rtype: Any (arcpy Map)
        """
        current_map = None
        try:
            import arcpy.mp
            aprx = arcpy.mp.ArcGISProject("CURRENT")
            current_map = aprx.activeMap
        except Exception:
            arcpy.AddIDMessage(MsgType.INF, 190194)
        return current_map


class TrackLYRX(BaseLYRX):

    def __init__(self,
                 line_features: str,
                 track_id_field: Optional[str] = None,
                 track_id_list: Optional[List[Any]] = None,
                 color_set: Optional[ColorSet] = None):

        self._line_features = line_features
        self._feature_describe = arcpy.Describe(self._line_features)
        self._track_id_field = track_id_field
        self._track_id_list = track_id_list
        self._color_set = color_set

        self._sf: SymbolFiles = SymbolFiles()

        # if we don't have a track id field then these need
        # to be None as well.
        if self._track_id_field is None:
            self._track_id_list = None
            self._color_set = None

        self._active_map = self.getCurrentMap()

    @property
    def line_features(self) -> str:
        return self._line_features

    @property
    def track_id_field(self) -> str | None:
        return self._track_id_field

    @property
    def track_id_list(self) -> List[Any] | None:
        return self._track_id_list

    @property
    def track_id_count(self) -> int | None:
        if self._track_id_list:
            return len(self._track_id_list)
        else:
            return None

    @property
    def color_set(self) -> ColorSet | None:
        return self._color_set

    @general_error_logger
    def _get_track_file(self, version_number: str | None = None) -> Dict[Any, Any] | None:
        data: Dict[Any, Any] | None = None
        file: str

        # check version number or not
        if version_number:
            file = self._sf.getFile("2.6.0", bool(self.track_id_field))[0]
        else:
            file = self._sf.getFile(None, bool(self.track_id_field))[0]

        # Open file and get JSON as sict
        with open(file, 'r') as json_file:
            data = json.load(json_file)

        return data

    @general_error_logger
    def make_LYRX(self,
                  output_features: str,
                  start_time_field_name: str,
                  end_time_field_name: str) -> str | None:

        # https://developers.arcgis.com/net/10-2/desktop/api-reference/html/T_Esri_ArcGISRuntime_LocalServices_WorkspaceFactoryType.htm

        # get the name of the feature class
        feature_class_name: str = self._feature_describe.baseName

        # get the output workspace
        workspace = os.path.dirname(output_features)  # initial workspace
        workspace_factory, workspace = self.getWorkspaceFactory(workspace)
        self._out_track_workspace_path = workspace
        self._out_track_workspace_connection_string = arcpy.Describe(workspace).connectionString

        # get the path to the (future) output LYRX file
        trackFile = self.getLYRXPath(output_features)
        out_track_LYRX: str = str(trackFile[0])
        track_has_feature_dataset: bool = bool(trackFile[1])

        # get some platform info
        layer_name: str = feature_class_name
        # layer_description = 'Track Segments by group.'... for L10N
        layer_description: str = str(arcpy.GetIDMessage(190200))

        earliest_time: datetime.datetime | None = None
        latest_time: datetime.datetime | None = None
        start_time: datetime.datetime | None = None
        end_time: datetime.datetime | None = None

        # get max start and end times from field
        if start_time_field_name is not None or end_time_field_name is not None:
            # get a list of times from the starting field
            start_times: List[datetime.datetime] = [t[0] for t in arcpy.da.SearchCursor(output_features, [start_time_field_name]) if t[0] is not None]
            # get a list of times from the ending field
            end_times: List[datetime.datetime] = [t[0] for t in arcpy.da.SearchCursor(output_features, [end_time_field_name]) if t[0] is not None]
            # combine the lists together
            combined_times: List[datetime.datetime] = start_times + end_times
            # sort the combined list
            combined_times.sort()
            # get the earliest time - first in the list
            start_time = combined_times[0]
            # get the latest time - last in the list
            end_time = combined_times[-1]
            # convert both to datetime nanoseconds
            earliest_time = pd.to_datetime(start_time, unit='ns')
            latest_time = pd.to_datetime(end_time, unit='ns')

        # load the JSON from file
        data: Dict[Any, Any] = self._get_track_file("2.6.0")

        # Change the path info for CIM
        layer_xml: str = os.path.basename(out_track_LYRX.replace(".lyrx", ".xml"))
        # CIMPATH should be <mapname>/<layername>, but if no map, then <layername>?

        cim_path: str | None = None
        if self._active_map:
            cim_path = "CIMPATH={0}/{1}".format(self._active_map.name, layer_xml)
        else:
            cim_path = "CIMPATH={0}".format(layer_xml)
        data["layers"][0] = str(cim_path)
        data["layerDefinitions"][0]["uRI"] = str(cim_path)

        # Change name and description
        data["layerDefinitions"][0]["name"] = str(layer_name)
        data["layerDefinitions"][0]["description"] = str(layer_description)

        time_scale: Any
        # set the start and end times, scale, etc.
        if start_time_field_name is not None or end_time_field_name is not None:
            # Change the time field names
            data["layerDefinitions"][0]["featureTable"]["timeFields"]["startTimeField"] = str(start_time_field_name)
            data["layerDefinitions"][0]["featureTable"]["timeFields"]["endTimeField"] = str(end_time_field_name)

            # change the start and end times
            data["layerDefinitions"][0]["featureTable"]["timeDefinition"]["customTimeExtent"]["start"] = str(earliest_time)
            data["layerDefinitions"][0]["featureTable"]["timeDefinition"]["customTimeExtent"]["end"] = str(latest_time)

            # change the time display definition
            # https://pro.arcgis.com/en/pro-app/sdk/api-reference/index.html#topic118.html
            time_scale = self._getTimeScale(start_time, end_time)
            data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeInterval"] = int(1)  # numeric value
            data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeIntervalUnits"] = str(time_scale)  # "esriTimeUnitsUnknown"
            data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeOffsetUnits"] = str(time_scale)  # "esriTimeUnitDays"

        # point to the output features and correct workspace type
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceConnectionString"] = str("DATABASE={0}".format(workspace))
        if track_has_feature_dataset:
            data["layerDefinitions"][0]["featureTable"]["dataConnection"]["featureDataset"] = str(os.path.basename(os.path.dirname(outputfeatures)))
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceFactory"] = str(workspace_factory)
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["dataset"] = str(feature_class_name)
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["datasetType"] = str("esriDTFeatureClass")

        # if we have to build unique symbols for tracks in the track_id field
        if self._track_id_field:
            # symbolizing tracks
            data['layerDefinitions'][0]['featureTable']['displayField'] = PointsToTrackSegmentsFieldNames.GROUP_ID.value
            data['layerDefinitions'][0]['renderer']['fields'] = [PointsToTrackSegmentsFieldNames.GROUP_ID.value]
            # data['layerDefinitions'][0]['renderer']['groups'][0]['heading'] = self._track_id_field_alias
            data['layerDefinitions'][0]['renderer']['groups'][0]['heading'] = self._track_id_field

            # generate symbol classes for each unique track id
            classes: List[Any] = []
            color: Any = None

            # get base track symbol from JSON file
            file: str = self._sf.base_track_file
            with open(file, 'r') as jsonfile:
                symclass = json.load(jsonfile)

            # get color_set as dictionary of ids and colors
            color_dict: Dict[Any, List[int]] = self._color_set.asDict

            if self._track_id_list:
                for t in self._track_id_list:

                    # get base CIM to modify for each class
                    classdata = deepcopy(symclass)
                    classdata['label'] = str(t)

                    # Get colors for pre-defined colors for the current track id
                    color = list(color_dict.get(t))
                    if DEBUG:
                        arcpy.AddMessage(f"color for {t}: {color}")

                    classdata['symbol']['symbol']['symbolLayers'][0]['color']['values'] = color
                    classdata['values'][0]['fieldValues'] = [t]
                    classes.append(classdata)

            # set symbol classes into JSON
            data['layerDefinitions'][0]['renderer']['groups'][0]['classes'] = classes

        # remove exisiting layer file if it exists
        if os.path.exists(out_track_LYRX):
            msg: str = str(arcpy.GetIDMessage(190195))
            arcpy.AddMessage(msg.format(out_track_LYRX))
            os.remove(out_track_LYRX)

        # write out new layer file
        with open(out_track_LYRX, 'w') as f:
            f.write(json.dumps(data))

        return out_track_LYRX


class PointLYRX(BaseLYRX):
    def __init__(self,
                 point_features: str,
                 track_id_field: Optional[str] = None,
                 track_id_list: Optional[List[Any]] = None,
                 color_set: Optional[ColorSet] = None):

        self._point_features = point_features
        self._feature_describe = arcpy.Describe(self._point_features)
        self._track_id_field = track_id_field
        self._track_id_list = track_id_list
        self._color_set = color_set

        self._sf: SymbolFiles = SymbolFiles()

        # if we don't have a track id field then these need
        # to be None as well.
        if self._track_id_field is None:
            self._track_id_list = None
            self._color_set = None

        self._active_map = self.getCurrentMap()

    @property
    def point_features(self) -> str:
        return self._point_features

    @property
    def track_id_field(self) -> str | None:
        return self._track_id_field

    @property
    def track_id_list(self) -> List[Any] | None:
        return self._track_id_list

    @property
    def track_id_count(self) -> int | None:
        if self._track_id_list:
            return len(self._track_id_list)
        else:
            return None

    @property
    def color_set(self) -> ColorSet | None:
        return self._color_set

    @general_error_logger
    def _get_point_file(self, version_number: str | None = None) -> Dict[Any, Any] | None:
        data: Dict[Any, Any] | None = None
        file: str

        # check version number or not
        if version_number:
            file = self._sf.getFile("2.6.0", bool(self.track_id_field))[1]
        else:
            file = self._sf.getFile(None, bool(self.track_id_field))[1]

        # Open file and get JSON as sict
        with open(file, 'r') as json_file:
            data = json.load(json_file)

        return data

    @general_error_logger
    def make_LYRX(self,
                  output_features: str,
                  start_time_field_name: str,
                  end_time_field_name: str) -> str | None:

        feature_class_name: str = self._feature_describe.baseName

        # get workspace and workspace type
        workspace = os.path.dirname(output_features)  # initial workspace
        workspace_factory, workspace = self.getWorkspaceFactory(workspace)
        self._out_point_workspace_path = workspace
        self._out_point_workspace_connection_string = arcpy.Describe(workspace).connectionString

        # get path to output LYRX file on disk
        pointFile = self.getLYRXPath(output_features)
        out_point_LYRX: str = pointFile[0]
        point_has_feature_dataset: bool = pointFile[1]

        # get some platform info
        layer_name: str = os.path.basename(output_features)
        # layer_description = 'Point Sequence'
        layer_description: str = str(arcpy.GetIDMessage(190201))

        # load the JSON from string
        data: Dict[Any, Any] = self._get_point_file("2.6.0")

        # Change the path info
        layer_xml = os.path.basename(out_point_LYRX.replace(".lyrx", ".xml"))
        # CIMPATH should be <mapname>/<layername>, but if no map, then <layername>?
        current_map: arcpy.Map = self._active_map
        cim_path = None
        if current_map:
            cim_path = "CIMPATH={0}/{1}".format(current_map.name, layer_xml)
        else:
            cim_path = "CIMPATH={0}".format(layer_xml)

        data["layers"][0] = str(cim_path)
        data["layerDefinitions"][0]["uRI"] = str(cim_path)

        # Change name and description
        data["layerDefinitions"][0]["name"] = str(layer_name)
        data["layerDefinitions"][0]["description"] = layer_description

        # Change the time field name
        data["layerDefinitions"][0]["featureTable"]["timeFields"]["startTimeField"] = str(PointsToTrackSegmentsFieldNames.DATE.value)

        # make a list of all of the times
        start_times: List[datetime.datetime] = [t[0] for t in arcpy.da.SearchCursor(output_features, [PointsToTrackSegmentsFieldNames.DATE.value]) if t[0] is not None]
        # sort the list
        start_times.sort()

        # find the earliest time -- first in the list
        start_time = start_times[0]

        # find the latest time -- last in the list
        end_time = start_times[-1]
        # convert to correct format
        earliest_time = pd.to_datetime(start_time, unit='ns')
        latest_time = pd.to_datetime(end_time, unit='ns')
        # set the earliest/latest to time-enable the layer
        data["layerDefinitions"][0]["featureTable"]["timeDefinition"]["customTimeExtent"]["start"] = str(earliest_time)
        data["layerDefinitions"][0]["featureTable"]["timeDefinition"]["customTimeExtent"]["end"] = str(latest_time)

        # change the time display definition
        # https://pro.arcgis.com/en/pro-app/sdk/api-reference/index.html#topic118.html
        time_scale = self._getTimeScale(start_time, end_time)
        data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeInterval"] = int(1)
        data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeIntervalUnits"] = str(time_scale)  # "esriTimeUnitsUnknown"
        data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeOffsetUnits"] = str(time_scale)  # "esriTimeUnitDays"

        # point to the output features
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceConnectionString"] = str("DATABASE={0}".format(workspace))
        if point_has_feature_dataset:
            data["layerDefinitions"][0]["featureTable"]["dataConnection"]["featureDataset"] = str(os.path.basename(os.path.dirname(output_features)))
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceFactory"] = str(workspace_factory)
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["dataset"] = str(feature_class_name)
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["datasetType"] = str("esriDTFeatureClass")

        if self._track_id_field is not None:

            data['layerDefinitions'][0]['featureTable']['displayField'] = PointsToTrackSegmentsFieldNames.GROUP_ID.value
            data['layerDefinitions'][0]['renderer']['fields'] = [PointsToTrackSegmentsFieldNames.GROUP_ID.value]
            data['layerDefinitions'][0]['renderer']['groups'][0]['heading'] = self._track_id_field

            # generate symbol classes for each unique track id
            classes: List[Any] = []
            color: Any = None

            # get base track symbol from JSON file
            file: str = self._sf.base_point_file
            with open(file, 'r') as jsonfile:
                symclass = json.load(jsonfile)

            # get color_set as dictionary of ids and colors
            color_dict: Dict[Any, List[int]] = self._color_set.asDict

            if self._track_id_list:
                for t in self._track_id_list:

                    classdata = deepcopy(symclass)
                    classdata['label'] = str(t)

                    # Get colors for pre-defined colors for the current track id
                    color = list(color_dict.get(t))
                    if DEBUG:
                        arcpy.AddMessage(f"color for {t}: {color}")

                    classdata['symbol']['symbol']['symbolLayers'][0]['markerGraphics'][1]['symbol']['symbolLayers'][0]['color']['values'] = color
                    classdata['values'][0]['fieldValues'] = [t]

                    classes.append(classdata)

            data['layerDefinitions'][0]['renderer']['groups'][0]['classes'] = classes

        # remove any exisiting LYRX
        if os.path.exists(out_point_LYRX):
            arcpy.AddMessage(arcpy.GetIDMessage(190195).format(out_point_LYRX))
            os.remove(out_point_LYRX)

        # dump output to file
        with open(out_point_LYRX, 'w') as f:
            f.write(json.dumps(data))

        return out_point_LYRX


class PointsToTrackSegmentsLogic(object):
    """PointsToTrackSegments Create track lines between input points with timestamps

    Generate line features between input point features with timestamp field. Individual
    polyline features will be created between sequential points with distance, time, and
    optionally speed values.

    Also, user can create sequence point features identifying the order in which the points
    occur based on the input datetime timestamp field.
    """

    # class level variable for logger
    _logger: Logger

    def __init__(self,
                 inputfeatures: str,
                 datefield: str,
                 output_features: str,
                 trackid: Optional[str] = None,
                 include_velocity: bool = True,
                 out_point_features: Optional[str] = None,
                 error_on_duplicate_timestamps: bool = True,
                 keep_input_fields: bool = False):
        """__init__ Constructor

        Sets inputs for PointsToTrackSegments class.
        Use generate method to create output.

        :param inputfeatures: Path to input point features
        :type inputfeatures: str
        :param datefield: Field name of timestamp in inputfeatures
        :type datefield: str
        :param output_features: Path to output track lines to be created
        :type output_features: str
        :param trackid: Field name of track groups, defaults to None
        :type trackid: Optional[str], optional
        :param include_velocity: True if user wants speed values added to tracks, defaults to True
        :type include_velocity: bool, optional
        :param out_point_features: Path to output point sequence features to be created, defaults to None
        :type out_point_features: Optional[str], optional
        :param error_on_duplicate_timestamps: Raise DuplicateDates error if duplicate timestamps are found in the datefield
        :type error_on_duplicate_timestamps: bool, optional
        :param keep_input_fields: Add fields from inputfeatures to out_point_features, if out_point_features is specified
        :type keep_input_fields: bool, optional
        """

        # Import here, not in module -- Python issue #1197
        from arcgis.features import GeoAccessor, GeoSeriesAccessor       

        # # ===========================================
        # # This only works inside methods
        # # it does NOT work on decorators
        self._logger = Logger()
        self._logger.create_logger(self.__class__.__name__)
        if DEBUG:
            self._logger.debug(f"DEBUG is {DEBUG}")
        # # ===========================================

        self._inputfeatures = inputfeatures
        self._inputfeat_describe = arcpy.Describe(self._inputfeatures)
        self._trackid = trackid
        self._datefield = datefield
        self._outputfeatures = output_features
        self._include_velocity = include_velocity
        self._out_point_features = out_point_features
        self._error_on_duplicate_timestamps = error_on_duplicate_timestamps
        self._keep_input_fields = keep_input_fields

        # Set the track id list if a field is set
        self._track_id_field_alias = None
        self._track_id_list = None
        self._track_id_type = None
        self._track_id_text_length = None
        self._track_id_contains_null = False
        is_track_id_set = self._setTrackIDProperties()

        # output point workspace and layer file
        self._point_has_feature_dataset: bool = False
        self._out_point_workspace_path: Optional[str] = None
        self._out_point_workspace_connection_string: str = ""
        self._out_point_LYRX: Optional[str] = None

        # output track workspace and layer file
        self._track_has_feature_dataset: bool = False
        self._out_track_workspace_path: str = ""
        self._out_track_workspace_connection_string: str = ""
        self._out_track_LYRX: str = ""

        # Using this to share color list between output points and lines
        self._color_set_for_point_and_lines = None

        # default alpha channel for all colors (right now 155 ~ 40% transparent, range is 0 to 255)
        self._color_alpha = 60  # 155

        self.BASIC_LOCAL_TIME_FORMAT = r'%Y-%m-%d %I:%M:%S %p'  # yyyy-mm-dd hh:mm:ss AM/PM

        # store temp datasets for removal
        self._delete_intermediate = []
        self._delete_temp_scratch_flag = False
        self._temp_scratch = None

        # used for determining emtpy JSON geometries
        self._empty_dict: Dict[Any, Any] = {}

        # Get field aliases for output features
        self.fieldAliases = self._getFieldAliasTranslations()

    def __del__(self):
        """__del__ Destructor

        Destructor - calls cleanup of temp datasets
        """
        self._cleanup()

    @property
    def inputfeatures(self):
        return self._inputfeatures

    @inputfeatures.setter
    def inputfeatures(self, value):
        self._inputfeatures = value
        self._inputfeat_describe = arcpy.Describe(self._inputfeatures)

    @property
    def trackid(self):
        return self._trackid

    @trackid.setter
    def trackid(self, value):
        self._trackid = value

    @property
    def datefield(self):
        return self._datefield

    @datefield.setter
    def datefield(self, value):
        self._datefield = value

    @property
    def output_features(self):
        return self._outputfeatures

    @output_features.setter
    def output_features(self, value):
        self._outputfeatures = value

    @property
    def include_velocity(self):
        return self._include_velocity

    @include_velocity.setter
    def include_velocity(self, value):
        self._include_velocity = value

    @property
    def out_point_features(self):
        return self._out_point_features

    @out_point_features.setter
    def out_point_features(self, value):
        self._out_point_features = value

    @property
    def error_on_duplicate_timestamps(self):
        return self._error_on_duplicate_timestamps

    @error_on_duplicate_timestamps.setter
    def error_on_duplicate_timestamps(self, value: bool):
        self._error_on_duplicate_timestamps = value

    @property
    def keep_input_fields(self):
        return self._keep_input_fields

    @keep_input_fields.setter
    def keep_input_fields(self, value: bool):
        self._keep_input_fields = value

    @general_error_logger
    def _getFieldAliasTranslations(self) -> Dict[str, str]:
        """_getFieldAliasTranslations get translated field aliases

        get a dictionary of field alises from L10N translation.

        :return: translated field aliases by field name enumeration
        :rtype: dict
        """
        fieldAliases: Dict[str, str] = {}

        fieldAliases[PointsToTrackSegmentsFieldNames.GROUP_ID.value] = str(arcpy.GetIDMessage(190355))

        fieldAliases[PointsToTrackSegmentsFieldNames.SEQUENCE.value] = str(arcpy.GetIDMessage(190210))

        fieldAliases[PointsToTrackSegmentsFieldNames.DATE.value] = str(arcpy.GetIDMessage(190354))
        fieldAliases[PointsToTrackSegmentsFieldNames.DATE_STR.value] = str(arcpy.GetIDMessage(190351))
        fieldAliases[PointsToTrackSegmentsFieldNames.DATE_START.value] = str(arcpy.GetIDMessage(190018))
        fieldAliases[PointsToTrackSegmentsFieldNames.DATE_START_STR.value] = str(arcpy.GetIDMessage(190352))
        fieldAliases[PointsToTrackSegmentsFieldNames.DATE_END.value] = str(arcpy.GetIDMessage(190019))
        fieldAliases[PointsToTrackSegmentsFieldNames.DATE_END_STR.value] = str(arcpy.GetIDMessage(190353))

        fieldAliases[PointsToTrackSegmentsFieldNames.DISTANCE.value] = str(arcpy.GetIDMessage(190203))
        fieldAliases[PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value] = str(arcpy.GetIDMessage(190204))
        fieldAliases[PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value] = str(arcpy.GetIDMessage(190205))

        fieldAliases[PointsToTrackSegmentsFieldNames.SPEED_MPS.value] = str(arcpy.GetIDMessage(190206))
        fieldAliases[PointsToTrackSegmentsFieldNames.SPEED_MPH.value] = str(arcpy.GetIDMessage(190207))
        fieldAliases[PointsToTrackSegmentsFieldNames.SPEED_KPH.value] = str(arcpy.GetIDMessage(190208))
        fieldAliases[PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value] = str(arcpy.GetIDMessage(190209))

        fieldAliases[PointsToTrackSegmentsFieldNames.START_OID.value] = str(arcpy.GetIDMessage(190201))
        fieldAliases[PointsToTrackSegmentsFieldNames.END_OID.value] = str(arcpy.GetIDMessage(190202))
        fieldAliases[PointsToTrackSegmentsFieldNames.ORIG_OID.value] = str(arcpy.GetIDMessage(190350))

        return fieldAliases

    @general_error_logger
    def _setTrackIDProperties(self) -> bool:
        """_setTrackIDProperties Set track id listing

        Get a list of track groups and track field type.

        :return: track listing is set
        :rtype: bool
        """
        if self._trackid is not None:

            # set the track field alias, and field type
            for f in self._inputfeat_describe.fields:
                if f.name == self._trackid:
                    self._track_id_field_alias = f.aliasName
                    self._track_id_type = f.type
                    # get text field's length
                    if self._track_id_type == "String":
                        self._track_id_text_length = f.length

            if DEBUG:
                self._logger.debug(f"Using track field: {self._trackid}, of type {self._track_id_type}")

            # make a unique list track ids
            # # ... using Pandas -- this is actually slower
            #
            # sdf = pd.DataFrame.spatial.from_featureclass(self._inputfeatures)
            # self._track_id_list = sdf[self._trackid].dropna().unique().tolist()
            # del sdf

            # ... using ArcPy -- faster
            track_result: List[Any]
            track_result = [row[0] for row in arcpy.da.SearchCursor(self._inputfeatures, [self._trackid])]
            track_result = list(set(track_result))
            if DEBUG:
                self._logger.debug(f"track_result: {track_result}")

            if None in track_result:
                if DEBUG:
                    self._logger.warning(f"Null value in group field ({self._trackid}).")
                # Warning: Null values found in group field {}. These rows will be ignored.
                arcpy.AddWarning(arcpy.GetIDMessage(190602).format(self._trackid))
                self._track_id_contains_null = True
                track_result.remove(None)
            # if .sort() is used on list(set()) in the previous line it
            #     returns None for some reason
            # 3298 Sort is failing when mixed group types (e.g. str and None, 
            #     or str and int, or int and None, etc.)
            track_result.sort()

            self._track_id_list = track_result
            if DEBUG:
                self._logger.debug(f"track_result: {track_result}")
                self._logger.debug(f"setting track id list: {self._track_id_list}")

            return True
        else:
            return False

    @staticmethod
    @general_error_logger
    def _getTimeScale(start_time: datetime.datetime,
                      end_time: datetime.datetime) -> str:
        """_getTimeScale Find correct time scale for start and end times

        get appropriate time scale based on start/end time

        Pro SDK Time Units enumeration doc
        https://pro.arcgis.com/en/pro-app/sdk/api-reference/#topic118.html

        :param start_time: starting time
        :type start_time: datetime.datetime
        :param end_time: ending time
        :type end_time: datetime.datetime
        :return: time scale enum
        :rtype: str
        """
        time_difference = end_time - start_time
        days_between = time_difference.days
        seconds_between = time_difference.seconds

        if days_between > 40000:
            return "esriTimeUnitsCenturies"
        elif days_between > 5000 and days_between <= 40000:
            return "esriTimeUnitsDecades"
        elif days_between > 1000 and days_between <= 5000:
            return "esriTimeUnitsYears"
        elif days_between > 365 and days_between <= 1000:
            return "esriTimeUnitsMonths"
        elif days_between > 60 and days_between <= 365:
            return "esriTimeUnitsWeeks"
        elif days_between > 5 and days_between <= 60:
            return "esriTimeUnitsDays"
        elif days_between == 0 and days_between <= 5:
            return "esriTimeUnitsHours"
        elif days_between == 0 and seconds_between > 0:
            return "esriTimeUnitsMinutes"
        else:
            return "esriTimeUnitsUnknown"

    @general_error_logger
    def _getCurrentMap(self) -> Any:
        """_getCurrentMap get current active map

        get active map in Pro, otherwise return None

        :return: Return current map, otherwise None
        :rtype: Any (arcpy Map)
        """
        current_map = None
        try:
            import arcpy.mp
            aprx = arcpy.mp.ArcGISProject("CURRENT")
            current_map = aprx.activeMap
        except Exception:
            arcpy.AddIDMessage(MsgType.INF, 190194)
            if DEBUG:
                self._logger.debug("No current map.")
        return current_map

    @staticmethod
    @general_error_logger
    def _findcentroid(extent: arcpy.Extent) -> arcpy.Point:
        """findcentroid Get the center point of an extent object

        Return centroid Point of the input extent object.

        :param extent: Input arcpy.Extent object
        :type extent: arcpy.Extent
        :return: resulting arcpy.Point centroid of input extent
        :rtype: arcpy.Point
        """

        # Do not need to do any math to figure out the centroid
        # Extent already has access to a Point object.
        # shiftx = (extent.XMax - extent.XMin)/2
        # shifty = (extent.YMax - extent.YMin)/2
        # centerx = extent.XMin + shiftx
        # centery = extent.YMin + shifty
        # center = arcpy.Point(centerx, centery)
        # return center
        return extent.polygon.centroid

    @general_error_logger
    def _checkDuplicateDates(self,
                             inputfeatures: str,
                             datefield: str,
                             trackidfield: Optional[str] = None) -> bool:
        """checkDuplicateDates check datefield in inputfeatures for duplicate dates

        Check the datefield in inputfeatures

        :param inputfeatures: input features
        :type inputfeatures: str
        :param datefield: datetime field in inputfeatures
        :type datefield: str
        :param trackidfield: group field, defaults to None
        :type trackidfield: Optional[str], optional
        :raises DuplicateDates: duplicate date exception
        :return: return false if no duplicates, true if duplicates
        :rtype: bool
        """
        try:
            from arcgis import GeoAccessor, GeoSeriesAccessor  # need access to the spatially enabled data frame

            sdf = pd.DataFrame.spatial.from_featureclass(inputfeatures)
            oid_field_name = arcpy.Describe(inputfeatures).oidFieldName

            if trackidfield:
                date_unique = sdf.groupby(trackidfield)[datefield].nunique(datefield)
                group_count = sdf.groupby(trackidfield)[datefield].count()
                diff = (group_count - date_unique)
                if diff.gt(0).any():
                    dup_groups = [index for index, value in diff.gt(0).items() if value is True]
                    # Group {} has time stamps that are equal.
                    err: str = arcpy.GetIDMessage(190191).format(dup_groups)
                    if DEBUG:
                        self._logger.error(err)
                    arcpy.AddError(err)
                    raise DuplicateDates
                    return True
                else:
                    return False

            else:
                # compare length of datefield vs length of unique datetime values in the datefield
                # if the two are equal all datetimes are unqiue
                # if different there are duplicates .. or erroneous data
                if len(sdf[datefield]) != len(sdf[datefield].unique()):
                    # Group {} has time stamps that are equal.
                    err: str = arcpy.GetIDMessage(190191).format("<None>")
                    if DEBUG:
                        self._logger.error(err)
                    arcpy.AddError(err)
                    raise DuplicateDates
                    return True

        except DuplicateDates:
            sys.exit(1)

    @general_error_logger
    def _alterOutputFields(self, input_table: str) -> str:
        """_alterOutputFields Updates the field aliases for output track/point data

        Internal method to modify the fields in the input_table if field is present.
        - distance: add field alias
        - dt_sec: add field alias
        - dt_min: add field alias
        - d_start: calculate datetime from string and add alias
        - d_end: calculate datetime from string and add alias
        - speed_mps: add field alias
        - speed_mph: add field alias
        - speed_kph: add field alias
        - speed_kts: add field alias
        - <track id field>: if a track id field was provided, update field name and alias

        :param input_table: Input table to modify track field data
        :type input_table: str
        :return: Modified table with track field data updated
        :rtype: str
        """
        input_time_format = 'yyyy-MM-dd hh:mm:ss tt'

        # if input table is a shapefile, we cannot use AlterFields
        if DEBUG:
            self._logger.debug(f"_alterOutputFields -- input_table: {input_table}")
            self._logger.debug(f"splitext is: {os.path.splitext(input_table)}")
        if os.path.splitext(input_table)[1].upper() == r".SHP".upper():
            if DEBUG:
                self._logger.debug(f"splitext is: {os.path.splitext(input_table)}")
            return input_table
        else:
            if DEBUG:
                self._logger.debug(f"Modifying fields for non-Shapefile in ...")
            # get a list of the field names in the input_table. Use this to check if the fields are present or not
            field_list = [f.name for f in arcpy.ListFields(input_table)]

            # iterate over field name enumeration and alter field if it's in the table
            for check_field in PointsToTrackSegmentsFieldNames:
                    if check_field.value in field_list:
                        arcpy.management.AlterField(input_table,
                                                    check_field.value,
                                                    new_field_alias=self.fieldAliases.get(check_field.value,
                                                                                            check_field.value))

            # update the track id field -- if there is one
            if self._trackid is not None:
                if self._trackid in field_list:
                    arcpy.management.AlterField(input_table, 
                                                self._trackid, 
                                                self._trackid, 
                                                self._track_id_field_alias)
            return input_table

    @general_error_logger
    def _dataframeToTrackFeatureClass(self,
                                df: pd.DataFrame, 
                                output_features: str,
                                sr: arcpy.SpatialReference,
                                group_field: Optional[str] = None) -> str:
        """_dataframeToTrackFeatureClass [summary]

        [extended_summary]

        :param df: [description]
        :type df: pd.DataFrame
        :param output_features: [description]
        :type output_features: str
        :param sr: [description]
        :type sr: arcpy.SpatialReference
        :param group_field: [description], defaults to None
        :type group_field: Optional[str], optional
        :return: [description]
        :rtype: str
        """

        #     C:\Program Files\ArcGIS\Pro\bin\Python\envs\arcgispro-py3\lib\site-packages\arcgis\features\geo\_io\fileops.py in to_featureclass(geo, location, overwrite, validate, sanitize_columns, has_m, has_z)
        #         605         notnull = geo._data[geo._name].notnull()
        #         606         idx = geo._data[geo._name][notnull].first_valid_index()
        #     --> 607         sr = geo._data[geo._name][idx]['spatialReference']
        #         608         gt = geo._data[geo._name][idx].geometry_type.upper()
        #         609         null_geom = {
        #     TypeError: string indices must be integers
            
        # df.spatial.to_featureclass(output_features, overwrite=False, has_z=True, has_m=False)
            
        output_z = 'DISABLED'
        if self._inputfeat_describe.hasZ:
            output_z = 'ENABLED'

        # Create the feature class
        arcpy.management.CreateFeatureclass(os.path.dirname(output_features),
                                            os.path.basename(output_features),
                                            "POLYLINE",
                                            template=None,
                                            has_m='DISABLED',
                                            has_z=output_z,
                                            spatial_reference=sr)
            
        fields_to_add = [[PointsToTrackSegmentsFieldNames.DATE_START.value,
                            'DATE',
                            self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DATE_START.value,
                                                PointsToTrackSegmentsFieldNames.DATE_START.value)],
                            [PointsToTrackSegmentsFieldNames.DATE_START_STR.value,
                            'TEXT',
                            self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DATE_START_STR.value,
                                                PointsToTrackSegmentsFieldNames.DATE_START_STR.value)],
                            [PointsToTrackSegmentsFieldNames.DATE_END.value,
                            'DATE',
                            self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DATE_END.value,
                                                PointsToTrackSegmentsFieldNames.DATE_END.value)],
                            [PointsToTrackSegmentsFieldNames.DATE_END_STR.value,
                            'TEXT',
                            self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DATE_END_STR.value,
                                                PointsToTrackSegmentsFieldNames.DATE_END_STR.value)],
                            [PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value,
                            'DOUBLE',
                            self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value,
                                                PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value)],
                            [PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value,
                            'DOUBLE'
                            ,self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value,
                                                PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value)],
                            [PointsToTrackSegmentsFieldNames.DISTANCE.value,
                            'DOUBLE'
                            ,self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DISTANCE.value,
                                                PointsToTrackSegmentsFieldNames.DISTANCE.value)],
                            [PointsToTrackSegmentsFieldNames.START_OID.value,
                            'LONG'
                            ,self.fieldAliases.get(PointsToTrackSegmentsFieldNames.START_OID.value,
                                                PointsToTrackSegmentsFieldNames.START_OID.value)],
                            [PointsToTrackSegmentsFieldNames.END_OID.value,
                            'LONG'
                            ,self.fieldAliases.get(PointsToTrackSegmentsFieldNames.END_OID.value,
                                                PointsToTrackSegmentsFieldNames.END_OID.value)],
                        ]

        if self._include_velocity:
            velocity_fields = [[PointsToTrackSegmentsFieldNames.SPEED_MPS.value,
                                'DOUBLE',
                                self.fieldAliases.get(PointsToTrackSegmentsFieldNames.SPEED_MPS.value,
                                                        PointsToTrackSegmentsFieldNames.SPEED_MPS.value)],
                                [PointsToTrackSegmentsFieldNames.SPEED_MPH.value,
                                'DOUBLE',
                                self.fieldAliases.get(PointsToTrackSegmentsFieldNames.SPEED_MPH.value,
                                                        PointsToTrackSegmentsFieldNames.SPEED_MPH.value)],
                                [PointsToTrackSegmentsFieldNames.SPEED_KPH.value,
                                'DOUBLE',
                                self.fieldAliases.get(PointsToTrackSegmentsFieldNames.SPEED_KPH.value,
                                                        PointsToTrackSegmentsFieldNames.SPEED_KPH.value)],
                                [PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value,
                                'DOUBLE',
                                self.fieldAliases.get(PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value,
                                                        PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value)],
                                ]
            fields_to_add += velocity_fields

        # Add the fields
        if DEBUG:
            self._logger.debug(f"adding track fields to {output_features}...\n{fields_to_add}")
        arcpy.management.AddFields(output_features, fields_to_add)
            
        cursor_fields = ['SHAPE@',
                            PointsToTrackSegmentsFieldNames.DATE_START.value,
                            PointsToTrackSegmentsFieldNames.DATE_START_STR.value,
                            PointsToTrackSegmentsFieldNames.DATE_END.value,
                            PointsToTrackSegmentsFieldNames.DATE_END_STR.value,
                            PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value,
                            PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value,
                            PointsToTrackSegmentsFieldNames.DISTANCE.value,
                            PointsToTrackSegmentsFieldNames.START_OID.value,
                            PointsToTrackSegmentsFieldNames.END_OID.value,
                            ]
        if self._include_velocity:
            cursor_fields += [PointsToTrackSegmentsFieldNames.SPEED_MPS.value,
                                PointsToTrackSegmentsFieldNames.SPEED_MPH.value,
                                PointsToTrackSegmentsFieldNames.SPEED_KPH.value,
                                PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value]
            
        if group_field:
            arcpy.management.AddField(output_features,
                                        PointsToTrackSegmentsFieldNames.GROUP_ID.value,
                                        self._track_id_type,
                                        field_alias=self.fieldAliases.get(PointsToTrackSegmentsFieldNames.GROUP_ID.value,
                                                                        PointsToTrackSegmentsFieldNames.GROUP_ID.value))
            cursor_fields += [PointsToTrackSegmentsFieldNames.GROUP_ID.value]

        # create the cursor
        insert_cursor = arcpy.da.InsertCursor(output_features, cursor_fields)
            
        # iterate through the dataframe rows
        for index, df_row in df.iterrows():
            
            # set the values for each field
            insert_row = [arcpy.AsShape(df_row['SHAPE'], True), 
                            datetime.fromisoformat(str(df_row[PointsToTrackSegmentsFieldNames.DATE_START.value])),
                            df_row[PointsToTrackSegmentsFieldNames.DATE_START_STR.value],
                            datetime.fromisoformat(str(df_row[PointsToTrackSegmentsFieldNames.DATE_END.value])),
                            df_row[PointsToTrackSegmentsFieldNames.DATE_END_STR.value],
                            df_row[PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value], 
                            df_row[PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value],
                            df_row[PointsToTrackSegmentsFieldNames.DISTANCE.value],
                            df_row[PointsToTrackSegmentsFieldNames.START_OID.value],
                            df_row[PointsToTrackSegmentsFieldNames.END_OID.value],
                            ]
            if DEBUG:
                self._logger.debug(f"inserting row: {insert_row}")

            if self._include_velocity:
                insert_row += [df_row[PointsToTrackSegmentsFieldNames.SPEED_MPS.value],
                                df_row[PointsToTrackSegmentsFieldNames.SPEED_MPH.value],
                                df_row[PointsToTrackSegmentsFieldNames.SPEED_KPH.value],
                                df_row[PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value]]

            # add the group value if user specified one
            if group_field:
                insert_row.append(df_row[PointsToTrackSegmentsFieldNames.GROUP_ID.value])
            # insert the row into the feature cursor
            insert_cursor.insertRow(insert_row)
            
        # close up everything
        del insert_cursor
    
        return output_features

    @general_error_logger
    def _dataframeToPointFeatureClass(self,
                                      df: pd.DataFrame, 
                                      output_features: str,
                                      sr: arcpy.SpatialReference,
                                      group_field: Optional[str] = None) -> str:
        """_dataframeToPointFeatureClass [summary]

        [extended_summary]

        :param df: [description]
        :type df: pd.DataFrame
        :param output_features: [description]
        :type output_features: str
        :param sr: [description]
        :type sr: arcpy.SpatialReference
        :param group_field: [description], defaults to None
        :type group_field: Optional[str], optional
        :return: [description]
        :rtype: str
        """

        output_sr: arcpy.SpatialReference = sr  # self._inputfeat_describe.spatialReference

        output_z: str = 'DISABLED'
        if self._inputfeat_describe.hasZ:
            output_z = 'ENABLED'
        
        output_m: str = 'DISABLED'
        if self._inputfeat_describe.hasM:
            output_m = 'ENABLED'

        arcpy.management.CreateFeatureclass(os.path.dirname(output_features),
                                            os.path.basename(output_features),
                                            "POINT",
                                            template=None,
                                            has_m=output_m,
                                            has_z=output_z,
                                            spatial_reference=output_sr)

        # Add the fields
        date_field_alias: str = arcpy.ListFields(self._inputfeatures, self._datefield)[0].aliasName
        fields_to_add = [[PointsToTrackSegmentsFieldNames.SEQUENCE.value,
                          'LONG',
                          self.fieldAliases.get(PointsToTrackSegmentsFieldNames.SEQUENCE.value,
                                                PointsToTrackSegmentsFieldNames.SEQUENCE.value)],
                         [PointsToTrackSegmentsFieldNames.DATE.value,
                          'DATE',
                          self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DATE.value,
                                                PointsToTrackSegmentsFieldNames.DATE.value)],
                         [PointsToTrackSegmentsFieldNames.DATE_STR.value,
                          'TEXT',
                          self.fieldAliases.get(PointsToTrackSegmentsFieldNames.DATE_STR.value,
                                                PointsToTrackSegmentsFieldNames.DATE_STR.value)],
                         [PointsToTrackSegmentsFieldNames.ORIG_OID.value,
                          'LONG',
                          self.fieldAliases.get(PointsToTrackSegmentsFieldNames.ORIG_OID.value,
                                                PointsToTrackSegmentsFieldNames.ORIG_OID.value)],
                        ]
            
        cursor_fields = ['SHAPE@',
                          PointsToTrackSegmentsFieldNames.SEQUENCE.value,
                          PointsToTrackSegmentsFieldNames.DATE.value,
                          PointsToTrackSegmentsFieldNames.DATE_STR.value,
                          PointsToTrackSegmentsFieldNames.ORIG_OID.value,
                          ]

        arcpy.management.AddFields(output_features,
                                   fields_to_add)

        if group_field:
            arcpy.management.AddField(output_features,
                                      PointsToTrackSegmentsFieldNames.GROUP_ID.value,
                                      self._track_id_type,
                                      field_alias=self.fieldAliases.get(PointsToTrackSegmentsFieldNames.GROUP_ID.value,
                                                                        PointsToTrackSegmentsFieldNames.GROUP_ID.value))
            cursor_fields += [PointsToTrackSegmentsFieldNames.GROUP_ID.value]

        if DEBUG:
            self._logger.debug(f"dataframeToPointFC -- cursor_fields: {cursor_fields}")

        # create the cursor
        insert_cursor = arcpy.da.InsertCursor(output_features, cursor_fields)
        # iterate through the dataframe rows
        for index, df_row in df.iterrows():
            # set the values for each field
            insert_row = [arcpy.AsShape(df_row['SHAPE'], True), 
                          df_row[PointsToTrackSegmentsFieldNames.SEQUENCE.value],
                          datetime.fromisoformat(str(df_row[PointsToTrackSegmentsFieldNames.DATE.value])),
                          df_row[PointsToTrackSegmentsFieldNames.DATE_STR.value],
                          df_row[PointsToTrackSegmentsFieldNames.ORIG_OID.value],
                          ]
                
            # add the group value if user specified one
            if group_field:
                insert_row.append(df_row[PointsToTrackSegmentsFieldNames.GROUP_ID.value])

            # insert the row into the feature cursor
            insert_cursor.insertRow(insert_row)
            
        # close up everything
        del insert_cursor

        if self._keep_input_fields:
            if DEBUG:
                self._logger.debug("Joining input fields to output sequence points...")
            arcpy.JoinField_management(output_features,
                                       PointsToTrackSegmentsFieldNames.ORIG_OID.value,
                                       self._inputfeatures,
                                       self._inputfeat_describe.OIDFieldName)
    
        return output_features

    @staticmethod
    @general_error_logger
    def _duration(dt1: datetime, dt2: datetime) -> float:
        """_duration Time difference in seconds

        Time difference in seconds between two datetime objects

        :param dt1: starting datetime
        :type dt1: datetime
        :param dt2: ending datetime
        :type dt2: datetime
        :return: seconds between dt1 and dt2
        :rtype: float
        """
        if dt2 is None or dt2 == '' or dt2 == np.nan:
            return None

        duration_seconds = 0
        # class datetime.timedelta(days=0, seconds=0, microseconds=0, milliseconds=0, minutes=0, hours=0, weeks=0)
        # get timedelta from the two dates
        td = (dt2 - dt1)

        # timedelta has these attributes, but we will skip microseconds for now
        td_days = td.days
        td_seconds = td.seconds
        td_microseconds = td.microseconds

        # there are 24*3600 seconds in a day
        if td_days != 0:
            duration_seconds += (td_days * 24 * 3600)

        # add seconds directly
        if td_seconds != 0:
            duration_seconds += td_seconds

        return duration_seconds

    @general_error_logger
    def _makePointGeom(self, pJSON: str) -> Optional[arcpy.PointGeometry]:
        """_makePointGeom Generate Point Geometry from Esri JSON

        Generage PointGeometry from Esri JSON string. Returns None
        if geometry is empty.

        :param pJSON: input Esri JSON
        :type pJSON: str
        :return: output PointGeometry object
        :rtype: Optional[arcpy.PointGeometry]
        """        
        if pJSON is None or pJSON == self._empty_dict:
            return None
        return arcpy.AsShape(pJSON, True)

    @general_error_logger
    def _makePoint(self, pJSON: str) -> Optional[arcpy.Point]:
        """_makePoint Generate Point object from Esri JSON

        Generates a Point object from Esri JSON string. Returns
        None if input is empty.

        :param pJSON: Input Esri JSON
        :type pJSON: str
        :return: Output Point object
        :rtype: Optional[arcpy.Point]
        """        
        if pJSON is None or pJSON == self._empty_dict:
            return None
        shp = arcpy.AsShape(pJSON, True)
        return shp.firstPoint

    @general_error_logger
    def _makePolyline(self, pt1: str, pt2: str, sr: arcpy.SpatialReference, oid: int) -> str:
        """_makePolyline Generate path from input points

        Generate an Esri JSON path object from input Esri JSON point objects
        and spatial reference. If either point is empty, output line will be None

        :param pt1: start point
        :type pt1: str
        :param pt2: end point
        :type pt2: str
        :param sr: Spatial Reference of both points
        :type sr: arcpy.SpatialReference
        :return: Output path object between pt1 and pt2
        :rtype: str
        """

        # # DO NOT USE --- KEEP THIS IN FOR FUTURE DOCUMENTATION
        # def _arcgisPolylineMethod(pt1, pt2, sr):
        #     if pt2 == empty_dict or pt2 is None:
        #         return None
        #     paths: list
        #     if 'z' in pt1.keys():
        #         paths = [[[pt1['x'], pt1['y'], pt1['z']],
        #                 [pt2['x'], pt2['y'], pt2['z']]]]
        #     else:
        #         paths = [[[pt1['x'], pt1['y']],
        #                 [pt2['x'], pt2['y']]]]
        #     line = {"paths" : paths,
        #             "spatialReference" : pt1['spatialReference']}
        #     return arcgis.geometry.Polyline(line)
            
        # Using arcpy method as it is MUCH faster

        p1: Optional[arcpy.Point] = self._makePoint(pt1)
        p2: Optional[arcpy.Point] = self._makePoint(pt2)
        # Exit if we hit a null geometry
        if p1 is None or p2 is None:
            if DEBUG:
                self._logger.warning(f"Null point found making line for object id: {oid}")
            # Issue 2822 - messaging too chatty and confusing as all tracks will have at least
            #              one null point in the last segment.
            # arcpy.AddWarning(arcpy.GetIDMessage(190600).format(oid))
            return None
        # polylines cannot be created for coincident points
        # so we offset the Y values by 1 mm so they are not coincident
        if p1.X == p2.X and p1.Y == p2.Y:
            p2.Y += 0.01
            if DEBUG:
                self._logger.warning(f"Offsetting Point2 Y coordinate by 1mm for for object id: {oid}")

        pt_arr: arcpy.Array = arcpy.Array([p1, p2])
        point_has_z: bool = self._inputfeat_describe.hasZ
        line: arcpy.Polyline = arcpy.Polyline(pt_arr,
                                              sr,
                                              point_has_z,
                                              False)
        return line.JSON

    @general_error_logger
    def _geodesicDistanceBetween(self, pt1: str, pt2: str, oid: int) -> Optional[float]:
        """_geodesicDistanceBetween Find geodesic distance between points

        Find geodesic distance between pt1 and pt2. Output is None if either
        pt1 or pt2 is empty.

        :param pt1: start point
        :type pt1: str
        :param pt2: end point
        :type pt2: str
        :return: geodesic distance between pt1 and pt2
        :rtype: Optional[float]
        """        
        pg1: Optional[arcpy.PointGeometry] = self._makePointGeom(pt1)
        pg2: Optional[arcpy.PointGeometry] = self._makePointGeom(pt2)
        if pg1 is None or pg2 is None:
            if DEBUG:
                self._logger.warning(f"Null point found calculating distance for object id: {oid}")
            # Issue 2822 - messaging too chatty and confusing as all tracks will have at least
            #              one null point in the last segment.
            # arcpy.AddWarning(arcpy.GetIDMessage(190601).format(oid))
            return None
        return pg1.angleAndDistanceTo(pg2, "GEODESIC")[1]

    @general_error_logger
    def _validateFieldNames(self, input_field_names: list[str]) -> dict[str, str]:
        """_validateFieldNames validate input field names 

        Validate inputfeatures field names against the out_point_features workspace type.
        For shapefiles this could mean field names are truncated as they only support 10
        character field names.
        Uses arcpy.ValidateFieldNames tool to give a validated field name.

        :return: Dictionary of original input field name (key) and validated output field name (value)
        :rtype: dict
        """        
        output_names: dict[str, str] = {}
        if self._keep_input_fields is True and self.out_point_features is not None:
            workspace: str = os.path.dirname(self.out_point_features)
            for name in input_field_names:
                new_name: str = arcpy.ValidateFieldName(name, workspace)
                if new_name != name:
                    output_names[name] = new_name
            if DEBUG:
                self._logger.debug(f"validated field names as: {output_names}")
        else:
            pass  # return empty dict if not keeping fields
        return output_names

    @general_error_logger
    def generate(self) -> List[str | None]:
        """generate Generate a set of line 'tracks' for sequences of input points.

        Generate a set of line 'tracks' for sequences of input points.
        
        Optionally generates as set of sequence points for each input track.

        :return: output track dataset path, and (optional) output point sequence
        :rtype: list
        """ 

        # Find  current project if there is one
        project: Optional[arcpy.mp.ArcGISProject] = None
        activeMap: Optional[arcpy.Map] = None
        try:
            project = arcpy.mp.ArcGISProject('CURRENT')
            if project:
                activeMap = project.activeMap
        except:
            # No current project or map.
            project = None
            arcpy.AddMessage(arcpy.GetIDMessage(190194))


        if arcpy.env.scratchGDB is None:
            self._temp_scratch = create_scratch_geodatabase()
            arcpy.env.scratchGDB = self._temp_scratch
            self._delete_temp_scratch_flag = True
        if DEBUG:
            self._logger.debug(f"scratchGDB: {arcpy.env.scratchGDB}")

        # Get describe once so we don't have to call repeatedly
        input_point_describe: arcpy.Describe = self._inputfeat_describe
        input_oid_field_name: str = input_point_describe.oidFieldName
        input_shape_field_name: str = input_point_describe.shapeFieldName

        # Get a list of field names in the input points
        input_point_fields: List[str] = [f.name for f in input_point_describe.fields]

        # Make a list of fields to keep when creating the data frame.
        # Initially due to Issue 2483 we dropped all input fields from output points.
        # But later in Issue 2902 customer wanted to keep all output fields in points.
        # Intitially we only want to keep:
        #   - object id field
        #   - shape field
        #   - date/time field
        #   - (optionally) group field
        # Issue 2902 - Keep input fields in the output sequence points, modify field names
        #              if output is shapefile. 
        input_keep_fields: List[str]
        minimum_keep_fields: List[str] = [input_oid_field_name,
                                          input_shape_field_name,
                                          self._datefield]
        if self._trackid:
            minimum_keep_fields.append(self._trackid)

        if self._keep_input_fields is True and self._out_point_features is not None:
            input_keep_fields = input_point_fields
            if DEBUG:
                self._logger.debug("Keeping all input fields")
        else:
            input_keep_fields = minimum_keep_fields
            if DEBUG:
                self._logger.debug("Keeping minmum fields from input")

        if DEBUG:
            self._logger.debug(f"input fields used: {input_keep_fields}")

        # Get initial/user z flag setting
        user_Z_setting: str = arcpy.env.outputZFlag
        inputfeatures_hasZ: bool = input_point_describe.hasZ
        if inputfeatures_hasZ:
            arcpy.env.outputZFlag = "Enabled"
        else:
            arcpy.env.outputZFlag = "Disabled"

        # Check the datefield for duplicates
        # If input has duplicate dates in dataset or in groups the
        # tool will fail at this point.
        date_check: bool = False
        if self._error_on_duplicate_timestamps:
            if DEBUG:
                self._logger.debug(f"Checking for duplicate timestamps in input features.")
            date_check = self._checkDuplicateDates(self._inputfeatures,  
                                                   self._datefield,
                                                   self._trackid)
        else:
            if DEBUG:
                self._logger.debug(f"Allowing duplicate timestamps in input features.")
            date_check = False

        # get spatial reference of input features
        input_spatial_reference: arcpy.SpatialReference = input_point_describe.spatialReference

        # Project input dataset
        input_feature_extent: arcpy.Extent = input_point_describe.extent
        input_sr_type: str = input_spatial_reference.type
        input_extent_centroid: arcpy.Point = self._findcentroid(input_feature_extent)
        input_temp_features: str
        output_spatial_reference: arcpy.SpatialReference
        if input_sr_type == "Geographic":
            # Why Web Mercator, better options for analysis....
            # web_mercator_sr = arcpy.SpatialReference(102100)

            # UTM works for areas within one zone but not global...
            # local_utm_sr = selectUTMZone(input_extent_centroid.X,
            #                              input_extent_centroid.Y)

            # World Azimuthal Equidistant works for global.... but currently isn't accepting 
            # latitudeOfOrigin... which it should.
            # local_utm_sr = generateCenteredWorldAzimuthalEquidistant(input_extent_centroid.X,
            #                                                          input_extent_centroid.Y)

            # so lets just use default WAZED:
            local_utm_sr = arcpy.SpatialReference(54032)

            if DEBUG:
                self._logger.debug(f"Output spatial ref is now: {local_utm_sr.name}")

            projected_temp = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(projected_temp):
                arcpy.management.Delete(projected_temp)

            arcpy.management.Project(self._inputfeatures, 
                                        projected_temp, 
                                        local_utm_sr)
            input_temp_features = projected_temp
            output_spatial_reference = local_utm_sr
            self._delete_intermediate.append(projected_temp)
        else:
            # Use the input features and their spatial reference directly
            input_temp_features = self._inputfeatures
            output_spatial_reference = input_spatial_reference
        arcpy.env.outputCoordinateSystem = output_spatial_reference

        # Issue 2797 - wipe out bogus % progressor message shown by Project
        arcpy.SetProgressor("default", message="")

        # Create spatial data frame from input features, using input_keep_fields
        point_df: pd.DataFrame = pd.DataFrame.spatial.from_featureclass(input_temp_features,
                                                                       fields=input_keep_fields)

        # Drop rows with NULL in group field self._trackid
        if self._track_id_contains_null:
            if DEBUG:
                self._logger.debug(f"Dropping rows with null values in track id group field ({self._trackid})...")
            point_df = point_df.dropna(axis='rows', subset=[self._trackid])

        # Drop rows with NULL self._datefield before we do any processing
        if DEBUG:
            self._logger.debug(f"Dropping rows with null values in {self._datefield}...")
        point_df = point_df.dropna(axis='rows', subset=[self._datefield])

        # make a list of original columns to remove from output tracks
        # original_columns = list(point_df.columns)
        # if self._trackid:
        #     original_columns.remove(self._trackid)

        # rename the self._datefield to PointsToTrackSegemntsFieldNames.DATE
        dataframe_column_rename: dict[str, str] = {self._datefield : PointsToTrackSegmentsFieldNames.DATE.value}
            
        # rename the self._trackid to PointsToTrackSegmentsFieldNames.GROUP_ID
        if self._trackid:
            dataframe_column_rename[self._trackid] = PointsToTrackSegmentsFieldNames.GROUP_ID.value
        point_df.rename(columns=dataframe_column_rename, inplace=True)

        # add the DATE_STR column from DATE
        point_df[PointsToTrackSegmentsFieldNames.DATE_STR.value] = point_df[PointsToTrackSegmentsFieldNames.DATE.value].dt.strftime(self.BASIC_LOCAL_TIME_FORMAT)
        # Add the DATE_START column from DATE
        point_df[PointsToTrackSegmentsFieldNames.DATE_START.value] = point_df[PointsToTrackSegmentsFieldNames.DATE.value]
        # Add the DATE_START_STRING column from DATE_START
        point_df[PointsToTrackSegmentsFieldNames.DATE_START_STR.value] = point_df[PointsToTrackSegmentsFieldNames.DATE.value].dt.strftime(self.BASIC_LOCAL_TIME_FORMAT)
        # Add the ORIG_OID column from input oid column
        point_df[PointsToTrackSegmentsFieldNames.ORIG_OID.value] = point_df[input_oid_field_name]
        # Add the OID_START column from input oid column
        point_df[PointsToTrackSegmentsFieldNames.START_OID.value] = point_df[input_oid_field_name]

        # If the user defined a group field use that to sort, add sequence number, shape and ending time
        if self._trackid:
            # Sort by time within the groups
            point_df.sort_values([PointsToTrackSegmentsFieldNames.DATE_START.value, PointsToTrackSegmentsFieldNames.GROUP_ID.value], ascending=True, inplace=True)

            # Add sequence for each group
            point_df[PointsToTrackSegmentsFieldNames.SEQUENCE.value] = point_df.groupby(PointsToTrackSegmentsFieldNames.GROUP_ID.value).cumcount() + 1

            # add point shape and timestamp from next row in group
            point_df['SHAPE2'] = point_df.groupby(PointsToTrackSegmentsFieldNames.GROUP_ID.value).SHAPE.shift(-1)
                
            # Add DATE_END by shifting DATE_START on previous row
            # IMPORTANT: index "d_start" is tied to the PointsToTrackSegmentsFieldNames.DATE_START.value
            point_df[PointsToTrackSegmentsFieldNames.DATE_END.value] = point_df.groupby(PointsToTrackSegmentsFieldNames.GROUP_ID.value).d_start.shift(-1)
            # Add DATE_END_STR from DATE_END
            point_df[PointsToTrackSegmentsFieldNames.DATE_END_STR.value] = point_df[PointsToTrackSegmentsFieldNames.DATE_END.value].dt.strftime(self.BASIC_LOCAL_TIME_FORMAT)
            # Add END_OID by shifting START_OID (oid_start) on previous row
            # IMPORTANT index "oid_start" is tied to the PointsToTrackSegmentsFieldNames.END_OID.value
            point_df[PointsToTrackSegmentsFieldNames.END_OID.value] = point_df.groupby(PointsToTrackSegmentsFieldNames.GROUP_ID.value).oid_start.shift(-1)

        # if no group field, sort entire dataframe, add sequence number, second shpae and ending time
        else:
            # sort the whole dataframe
            point_df.sort_values(PointsToTrackSegmentsFieldNames.DATE_START.value, ascending=True, inplace=True)

            # reset index after sort and before sequence - Issue 2437
            point_df.reset_index(inplace=True)

            # add sequence field to whole dataframe                
            point_df[PointsToTrackSegmentsFieldNames.SEQUENCE.value] = point_df.index + 1
            # add point shape and timestamp from next row
            point_df['SHAPE2'] = point_df.SHAPE.shift(-1)

            # Add DATE_END by shifting DATE_START from previous row
            # IMPORTANT: index "d_start" is tied to the PointsToTrackSegmentsFieldNames.DATE_START.value 
            point_df[PointsToTrackSegmentsFieldNames.DATE_END.value] = point_df.d_start.shift(-1)
            # Add DATE_END_STR from DATE_END
            point_df[PointsToTrackSegmentsFieldNames.DATE_END_STR.value] = point_df[PointsToTrackSegmentsFieldNames.DATE_END.value].dt.strftime(self.BASIC_LOCAL_TIME_FORMAT)
            # Add END_OID by shifting START_OID (oid_start) on previous row
            # IMPORTANT index "oid_start" is tied to the PointsToTrackSegmentsFieldNames.END_OID.value
            point_df[PointsToTrackSegmentsFieldNames.END_OID.value] = point_df.oid_start.shift(-1)

        # deteremine time duration between points
        if DEBUG:
            self._logger.debug(f"Calculating time duration between points...")
        point_df[PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value] = point_df.apply(lambda x: self._duration(x[PointsToTrackSegmentsFieldNames.DATE_START.value], 
                                                                                x[PointsToTrackSegmentsFieldNames.DATE_END.value]), 
                                                        axis=1)
        point_df[PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value] = point_df[PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value] * 0.016666666666667

        # Add polyline geometry to LINE column
        if DEBUG:
            self._logger.debug(f"Generating polyline between points...")
        point_df['LINE'] = point_df.apply(lambda x: self._makePolyline(x['SHAPE'],
                                                                        x['SHAPE2'],
                                                                        output_spatial_reference,
                                                                        x[input_oid_field_name]),
                                            axis=1)

        # Add geodesic distance column
        if DEBUG:
            self._logger.debug(f"Calculating geodesic distance between points...")
        point_df[PointsToTrackSegmentsFieldNames.DISTANCE.value] = point_df.apply(lambda x: self._geodesicDistanceBetween(x['SHAPE'], 
                                                                                        x['SHAPE2'],
                                                                                        x[input_oid_field_name]),
                                                axis=1)

        if DEBUG:
            self._logger.debug(f" distance field values: {point_df[PointsToTrackSegmentsFieldNames.DISTANCE.value].tolist()}")
                                    
        # deteremine speed values if user wants them
        if self._include_velocity:
            if DEBUG:
                self._logger.debug(f"Calculating velocity measures...")
            # TODO: What if the time difference is zero? Speed goes to infinity.
            point_df[PointsToTrackSegmentsFieldNames.SPEED_MPS.value] = point_df[PointsToTrackSegmentsFieldNames.DISTANCE.value] / point_df[PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value]  # meters per second
            point_df[PointsToTrackSegmentsFieldNames.SPEED_MPH.value] = point_df[PointsToTrackSegmentsFieldNames.SPEED_MPS.value] * 2.23694  # miles per hour
            point_df[PointsToTrackSegmentsFieldNames.SPEED_KPH.value] = point_df[PointsToTrackSegmentsFieldNames.SPEED_MPS.value] * 3.6  # kilometers per hour
            point_df[PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value] = point_df[PointsToTrackSegmentsFieldNames.SPEED_MPS.value] * 1.94384  # knots

        if DEBUG:
            self._logger.debug(f"point_df shape: {str(point_df.shape)}")

        # create new track dataframe and clean up for export to features
        track_df = point_df.copy()
            
        # drop all rows where distance is emtpy (this will be the last row or
        # last row in each group)
        track_df = track_df[track_df.distance_m.notnull()]
        if DEBUG:
            self._logger.debug(f"tracks_df shape: {str(track_df.shape)}")
            
        # cannot store duplicate fields for both points, drop point-only fields
        track_drop_columns = ['SHAPE',
                                'SHAPE2',
                                PointsToTrackSegmentsFieldNames.SEQUENCE.value,
                                PointsToTrackSegmentsFieldNames.DATE.value,
                                PointsToTrackSegmentsFieldNames.DATE_STR.value,
                                PointsToTrackSegmentsFieldNames.ORIG_OID.value]
        track_df.drop(columns=track_drop_columns, inplace=True)
        track_df.reset_index()

        # reset the shape fields from LINE, then drop LINE
        track_df['SHAPE'] = track_df['LINE']
        track_df.drop(columns=['LINE'], inplace=True)
            
        # Set geometry column for tracks
        track_df.spatial.set_geometry('SHAPE', sr=output_spatial_reference)

        #write out track line feature class
        output_tracks = self._dataframeToTrackFeatureClass(track_df,
                                                           self._outputfeatures,
                                                           output_spatial_reference,
                                                           group_field=self._trackid)
            
        # if DEBUG: arcpy.AddMessage(f"tracks_df shape: {str(track_df.shape)}")
        # track_df.spatial.to_featureclass(self._outputfeatures,
        #                                  overwrite=True,
        #                                  has_z=self._inputfeat_describe.hasZ,
        #                                  has_m=False)

        output_tracks = self._alterOutputFields(self._outputfeatures)

        # generate a dictionary of common colors by track id
        if self._color_set_for_point_and_lines is None:
            self._color_set_for_point_and_lines = ColorSet(self._track_id_list)
            if DEBUG:
                self._logger.debug(f"Making colorset: {self._color_set_for_point_and_lines}")
                self._logger.debug(f"colorset asDict: {self._color_set_for_point_and_lines.asDict}")

        # Create LYRX for output track polyline
        if DEBUG:
            self._logger.debug(f"Making track LYRX...")
        track_lyrx: TrackLYRX = TrackLYRX(output_tracks,
                                          track_id_field=self._trackid,
                                          track_id_list=self._track_id_list,
                                          color_set=self._color_set_for_point_and_lines)

        outlayer = track_lyrx.make_LYRX(self._outputfeatures,
                                        PointsToTrackSegmentsFieldNames.DATE_START.value,
                                        PointsToTrackSegmentsFieldNames.DATE_END.value)

        # placeholder for point layerfile if there is one
        point_layer: str | None = None
        if self._out_point_features is not None:
            if DEBUG:self._logger.debug(f"creating output point features...")

            # Drop null columns
            if DEBUG:
                self._logger.debug(f"point_df shape: {point_df.shape}")
                self._logger.debug(f"point_df end columns: {point_df.columns}")
            # TODO: occasionally dropping SHAPE field for points here...
            new_point_df = point_df.dropna(axis='columns', inplace=False).copy()

            if DEBUG:
                self._logger.debug(f"new_point_df shape: {new_point_df.shape}")
                self._logger.debug(f"new_point_df start columns: {new_point_df.columns}")
                
            # Drop columns not needed for sequence point features
            point_drop_columns = ['SHAPE2',
                                  PointsToTrackSegmentsFieldNames.DATE_START.value,
                                  PointsToTrackSegmentsFieldNames.DATE_START_STR.value,
                                  PointsToTrackSegmentsFieldNames.DATE_END.value,
                                  PointsToTrackSegmentsFieldNames.DATE_END_STR.value,
                                  PointsToTrackSegmentsFieldNames.DISTANCE.value,
                                  PointsToTrackSegmentsFieldNames.DELTA_SECONDS.value,
                                  PointsToTrackSegmentsFieldNames.DELTA_MINUTES.value]
            if self._include_velocity:
                point_drop_columns += [PointsToTrackSegmentsFieldNames.SPEED_MPS.value,
                                       PointsToTrackSegmentsFieldNames.SPEED_MPH.value,
                                       PointsToTrackSegmentsFieldNames.SPEED_KPH.value,
                                       PointsToTrackSegmentsFieldNames.SPEED_KNOTS.value]
            # lets make sure they are actually in the DF before we try to drop them
            point_drop_columns = [c for c in point_drop_columns if c in new_point_df.columns]
            if DEBUG:
                self._logger.debug(f"dropping {point_drop_columns} from new_point_df")
            new_point_df.drop(columns=point_drop_columns, inplace=True)
            if DEBUG:
                self._logger.debug(f"new_point_df shape: {new_point_df.shape}")
                self._logger.debug(f"new_point_df start columns: {new_point_df.columns}")

            # Saving point sequence to {out_points}
            if DEBUG:
                self._logger.debug(f"saving points to {self._out_point_features}...")
            
            # if output points are shapefile, rename columns
            if os.path.splitext(self._out_point_features)[1].lower() == ".shp":
                new_field_names: Dict[str, str] = self._validateFieldNames(input_keep_fields)
                point_df.rename(columns=new_field_names, inplace=True)
                if DEBUG:
                    self._logger.debug(f"Renaming columns ({new_field_names}) for output shapefile: {self._out_point_features}")
            
            # TODO: these options not yet available in early 2.7 builds
            # TypeError: set_geometry() got an unexpected keyword argument 'drop'
            # point_df.spatial.set_geometry(['SHAPE'], drop=False, inplace=True, sr=sr)
            # TypeError: set_geometry() got an unexpected keyword argument 'inplace'
            # point_df.spatial.set_geometry(['SHAPE'], inplace=True, sr=sr)
            # Set geometry column
            # new_point_df.spatial.set_geometry('SHAPE', 
            #                                   sr=output_spatial_reference)
            # Geosaurus #4741 - column names change in output features
            # new_point_df.spatial.to_featureclass(self._out_point_features, 
            #                                      overwrite=False, 
            #                                      has_z=self._inputfeat_describe.hasZ, 
            #                                      has_m=False)
            output_points: str = self._dataframeToPointFeatureClass(new_point_df,
                                                                    output_features=self._out_point_features,
                                                                    sr=output_spatial_reference,
                                                                    group_field=self._trackid)
                
            # update the field aliases
            self._alterOutputFields(self._out_point_features)

            # make a layer file for point sequence features
            if DEBUG:
                self._logger.debug(f"Making track LYRX...")
            point_lyrx: PointLYRX = PointLYRX(output_points,
                                              track_id_field=self._trackid,
                                              track_id_list=self._track_id_list,
                                              color_set=self._color_set_for_point_and_lines)

            point_layer = point_lyrx.make_LYRX(self._out_point_features,
                                               PointsToTrackSegmentsFieldNames.DATE_START.value,
                                               PointsToTrackSegmentsFieldNames.DATE_END.value)
            
        # Add layers to current map if there is one
        if activeMap:
            activeMap.addLayer(arcpy.mp.LayerFile(outlayer), "TOP")

            # Add the point layer to the map if point layer exists
            if point_layer is not None:
                activeMap.addLayer(arcpy.mp.LayerFile(point_layer), "TOP")

        # reset initial/user z flag setting
        arcpy.env.outputZFlag = user_Z_setting

        # set the output features
        return [self._outputfeatures, self._out_point_features]

    @general_error_logger
    def _cleanup(self):
        """_cleanup Clean up and remove temp dataset

        Clean up and remove temp datasets
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190012))
        if DEBUG:
            self._logger.debug(r"Removing intermedate datasets... ")
        for i in self._delete_intermediate:
            if arcpy.Exists(i):
                arcpy.management.Delete(i)
                if DEBUG:
                    self._logger.debug(f"...{i}")

        # Remove temp folder and geodatabase if it was created
        if self._delete_temp_scratch_flag is True:
            if self._temp_scratch is not None:
                if DEBUG:
                    self._logger.debug(f"Removing: {self._temp_scratch}")
                arcpy.management.Delete(self._temp_scratch)
                arcpy.management.Delete(os.path.dirname(self._temp_scratch))
                self._temp_scratch = None
