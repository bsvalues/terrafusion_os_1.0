# coding: utf-8
'''
------------------------------------------------------------------------------
GenerateBlindSpot.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2018-12-18 - phill - original writeup
* 2018-12-19 - phill - remove map extent & unused methods
* 2019-01-09 - phill - fix union, support for true curves
* 2019-08-30 - mfunk - Updates for inclusion in Pro 2.5
* 2019-09-12 - mfunk - Update messaging and execption handling
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
* 2020-12-22 - mfunk - refactor blind spot
* 2021-04-01 - mfunk - fixes for 2621 and 2632
* 2021-05-21 - mfunk - fixes for issue 1535
* 2022-11-01 - mfunk - Change arcpy.edit.Densify for arcpy.management.GeodeticDensify
------------------------------------------------------------------------------
'''

import arcpy
import os
import sys
import traceback
import datetime
import pandas as pd
from typing import Optional, Any, List

from intel.utilities import DEBUG, \
                            create_scratch_geodatabase, \
                            create_temp_table_name, \
                            selectUTMZone
from intel.enumerations import WorkspaceFactoryEnum
from intel.enumerations import esriTimeUnits


class BlindSpotAreas():

    def __init__(self,
                 input_features: str,
                 output_features: str,
                 input_area_feature: Optional[str] = None,
                 start: Optional[str] = None,
                 end: Optional[str] = None):
        """__init__ Initialize Blind Spot Areas

        Initialize Blind Spot Areas with input coverage features,
        path to output blind spot features, and input area mask, and
        starting and ending times.

        :param input_features: Path to input coverage area features
        :type input_features: str
        :param output_features: Path where output blind spot features are created
        :type output_features: str
        :param input_area_feature: Path to input mask features, defaults to None
        :type input_area_feature: Optional[str], optional
        :param start: start time field from input_features, defaults to None
        :type start: Optional[str], optional
        :param end: end time field from input_features, defaults to None
        :type end: Optional[str], optional
        """
        self._input_features = input_features
        self._start = start
        self._end = end
        self._input_area_feature = input_area_feature
        self._output_features = output_features
        self._current_map = self._getCurrentMap()

        self._delete_temp_scratch_flag = False
        self._temp_scratch = None
        self._delete_intermediate = []

        self._startDateFieldName = "blindspot_start"
        self._endDateFieldName = "blindspot_end"
        self._pctVisibleFieldName = "percentvisible"
        self._pctBlindFieldName = "percentblind"

    def __del__(self):
        """__del__ Blind Spot Area class destructor

        Cleanup after class is deleted.
        """
        self._cleanup()

    @property
    def input_features(self):
        return self._input_features

    @input_features.setter
    def input_features(self, value):
        self._input_features = value

    @property
    def output_features(self):
        return self._output_features

    @output_features.setter
    def output_features(self, value):
        self._output_features = value

    @property
    def input_area_feature(self):
        return self._input_area_feature

    @input_area_feature.setter
    def input_area_feature(self, value):
        self._input_area_feature = value

    @property
    def start(self):
        return self._start

    @start.setter
    def start(self, value):
        self._start = value

    @property
    def end(self):
        return self._end

    @end.setter
    def end(self, value):
        self._end = value

    def _cleanup(self) -> bool:
        """_cleanup remove temporary data and workspace

        _cleanup is an internal method to cleanup temporary data and
        workspaced generated while running the tool.
        1) Remove all temporary datas listed in self._delete_intermediate.
        2) Remove self._temp_scratch if it was created during processing


        :return: cleanup completed
        :rtype: bool
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190012))
        for i in self._delete_intermediate:
            # "Removing intermedate datasets... "
            if arcpy.Exists(i):
                arcpy.management.Delete(i)
                if DEBUG:
                    arcpy.AddMessage(f"...{i}")

        # Remove temp folder and geodatabase if it was created
        if self._delete_temp_scratch_flag is True:
            if self._temp_scratch is not None:
                if DEBUG:
                    arcpy.AddMessage(f"Removing: {self._temp_scratch}")
                arcpy.management.Delete(self._temp_scratch)
                arcpy.management.Delete(os.path.dirname(self._temp_scratch))
                self._temp_scratch = None
        return True

    @staticmethod
    def _getTimeScale(start_time: datetime.datetime,
                      end_time: datetime.datetime) -> str:
        """_getTimeScale Get time scale of start and end times.

        Get appropriate time scale based on start/end time.

        Pro SDK Time Units enumeration doc
        https://pro.arcgis.com/en/pro-app/sdk/api-reference/#topic118.html

        :param start_time: starting (earliest) time
        :type start_time: datetime.datetime
        :param end_time: ending (latest) time
        :type end_time: datetime.datetime
        :return: time scale name
        :rtype: str
        """
        time_difference = end_time - start_time
        days_between = time_difference.days
        seconds_between = time_difference.seconds

        unit: str = ""
        if days_between > 40000:
            unit = esriTimeUnits.Centuries.value
        elif days_between > 5000 and days_between <= 40000:
            unit = esriTimeUnits.Decades.value
        elif days_between > 1000 and days_between <= 5000:
            unit = esriTimeUnits.Years.value
        elif days_between > 365 and days_between <= 1000:
            unit = esriTimeUnits.Months.value
        elif days_between > 60 and days_between <= 365:
            unit = esriTimeUnits.Weeks.value
        elif days_between > 5 and days_between <= 60:
            unit = esriTimeUnits.Days.value
        elif days_between == 0 and days_between <= 5:
            unit = esriTimeUnits.Hours.value
        elif days_between == 0 and seconds_between > 0:
            unit = esriTimeUnits.Minutes.value
        else:
            unit = esriTimeUnits.Unknown.value
        return unit

    def _makeLayerFile(self, output_features: str) -> str:
        """_makeLayerFile return path for .LYRX based on input feature path

        return path for .LYRX based on input feature path

        :param output_features: features to create LYRX for
        :type output_features: str
        :return: path for LYRX
        :rtype: str
        """
        # check workspace
        try:
            folder_path: str = None
            layer_name: str = None

            # Get correct workspace
            initial_workspace = os.path.dirname(output_features)
            initial_describe = arcpy.Describe(initial_workspace)
            corrected_workspace = initial_workspace
            workspace_type: str = None
            has_feature_dataset: bool = False
            if hasattr(initial_describe, 'workspaceType'):
                # get workspace type
                workspace_type = arcpy.Describe(os.path.dirname(output_features)).workspaceType
            elif hasattr(initial_describe, 'datasetType'):
                if initial_describe.datasetType == 'FeatureDataset':
                    corrected_workspace = os.path.dirname(initial_workspace)
                    workspace_type = arcpy.Describe(corrected_workspace).workspaceType
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
                    if DEBUG:
                        arcpy.AddMessage(f"{workspace_type} but not Shapefile")
                    layer_name = os.path.basename(output_features)
                    folder_path = arcpy.env.scratchFolder
            # for SDE
            elif workspace_type == 'RemoteDatabase':
                layer_name = os.path.basename(output_features)
                folder_path = arcpy.env.scratchFolder
            else:
                # if not LocalDatabase, RemoteDatabase, or FileSystem
                if DEBUG:
                    arcpy.AddMessage(f"Other workspace type: {workspace_type}")
                layer_name = os.path.basename(output_features)
                folder_path = arcpy.env.scratchFolder

            layer_file = f"{layer_name}.lyrx"
            lyrx_path = os.path.join(folder_path, layer_file)

            return [lyrx_path, has_feature_dataset]

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}'.format(tbinfo,
                                        str(sys.exc_info()[1]),
                                        arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    @staticmethod
    def _getCurrentMap() -> arcpy._mp.Map:
        """_getCurrentMap Get current active map

        Get the Pro active map from current project,
        otherwise return None

        :return: current map or None
        :rtype: arcpy._mp.Map
        """
        current_map = None
        try:
            import arcpy.mp
            aprx = arcpy.mp.ArcGISProject("CURRENT")
            current_map = aprx.activeMap
        except Exception:
            # "No current project or map."
            arcpy.AddMessage(arcpy.GetIDMessage(190194))
        return current_map

    @staticmethod
    def _getWorkspaceFactory(workspace) -> str:
        """
        _getWorkspaceFactory Get workspace enum type

        Get CIM WorkspaceFactory enum type from the workspace ProgID

        :param workspace: path to workspace
        :type workspace: string
        :return: workspacefactory enum
        :rtype: str
        """

        def getWSFType(progID):
            '''
            Return a CIM WorkspaceFactory enum for the workspace based on the input progID
            https://github.com/Esri/cim-spec/blob/master/docs/v2/CIMVectorLayers.md#cimworkspaceconnection
            '''
            if workspace_factory_progid.startswith("esriDataSourcesGDB.FileGDBWorkspaceFactory"):
                return WorkspaceFactoryEnum.FileGDB.value  # "FileGDB"
            elif workspace_factory_progid.startswith("esriDataSourcesGDB.SdeWorkspaceFactory"):
                return WorkspaceFactoryEnum.SDE.value  # "SDE"
            elif workspace_factory_progid.startswith("esriDataSourcesGDB.AccessWorkspaceFactory"):
                # Personal Geodatabases are not supported!
                return WorkspaceFactoryEnum.Access.value  # "Access"
            elif workspace_factory_progid.startswith("esriDataSourcesGDB.MemoryWorkspaceFactory"):
                return WorkspaceFactoryEnum.Memory.value  # "Memory"
            elif workspace_factory_progid.startswith("esriDataSourcesGDB.InMemoryWorkspaceFactory"):
                return WorkspaceFactoryEnum.InMemoryDB  # "InMemoryDB"
            elif workspace_factory_progid.startswith("esriDataSourcesGDB.SqliteWorkspaceFactory"):
                # Mobile Geodatabase -- not fully working yet???
                return WorkspaceFactoryEnum.Sqlite.value  # "SqlLite"
            elif workspace_factory_progid == "":
                # Assume Shapefile for output into folder
                return WorkspaceFactoryEnum.Shapefile.value  # "Shapefile"
            else:
                return None

        workspace_factory = None
        workingWS = workspace
        originalWorkspaceDescribe = arcpy.Describe(workingWS)

        # first check if the path is a workspace, in that it has a ProgID property
        if hasattr(originalWorkspaceDescribe, 'workspaceFactoryProgID'):
            workspace_factory_progid = originalWorkspaceDescribe.workspaceFactoryProgID
            workspace_factory = getWSFType(workspace_factory_progid)

        # if no, then is it a path to a feature dataset in a GDB?
        elif hasattr(originalWorkspaceDescribe, 'datasetType'):
            if originalWorkspaceDescribe.datasetType == 'FeatureDataset':
                # if it is a Feature Datset we need to go up one level for workspace type
                workingWS = os.path.dirname(workspace)
                workingDescribe = arcpy.Describe(workingWS)
                workspace_factory_progid = workingDescribe.workspaceFactoryProgID
                workspace_factory = getWSFType(workspace_factory_progid)
                workspace = workingWS
        else:
            workspace_factory = None

        return [workspace_factory, workspace]

    @staticmethod
    def _symJSON_WithoutTimeFields(version: Optional[str] = None) -> str:
        return r'{"type":"CIMLayerDocument","version":"2.8.0","build":29660,"layers":["CIMPATH=BlindSpot.xml"],"layerDefinitions":[{"type":"CIMFeatureLayer","name":"BlindSpotLayer","uRI":"CIMPATH=BlindSpot.xml","sourceModifiedTime":{"type":"TimeInstant","start":978307200000},"metadataURI":"CIMPATH=Metadata/d5d963aaec841ab7c62b4ff4cfc3dc6c.xml","useSourceMetadata":true,"description":"Blind Spot shows incomplete coverage area of assets by time.","layerElevation":{"type":"CIMLayerElevationSurface","mapElevationID":"{99F92202-9148-4537-834C-B6AB120E27C8}"},"expanded":true,"layerType":"Operational","showLegends":true,"transparency":50,"visibility":true,"displayCacheType":"Permanent","maxDisplayCacheAge":5,"showPopups":true,"serviceLayerID":2,"refreshRate":-1,"refreshRateUnit":"esriTimeUnitsSeconds","blendingMode":"Alpha","allowDrapingOnIntegratedMesh":true,"autoGenerateFeatureTemplates":true,"featureElevationExpression":"0","featureTable":{"type":"CIMFeatureTable","displayField":"Shape_Length","editable":true,"dataConnection":{"type":"CIMStandardDataConnection","workspaceConnectionString":"DATABASE=.\\GenerateBlindSpotAreas2621.gdb","workspaceFactory":"FileGDB","dataset":"input_sensors_buffer_GenerateBlindSpotAreas4","datasetType":"esriDTFeatureClass"},"studyAreaSpatialRel":"esriSpatialRelUndefined","searchOrder":"esriSearchOrderSpatial"},"featureTemplates":[{"type":"CIMFeatureTemplate","name":"input_sensors_buffer_GenerateBlindSpotAreas4","tags":"Polygon","toolProgID":"8f79967b-66a0-4a1c-b884-f44bc7e26921","toolFilter":["6c6970a7-5ca9-448c-9c7d-0d716cd2ac64","a281e635-0f22-47d4-a438-e4d29b920e22","d304243a-5c3a-4ccc-b98b-93684b15fd83"]}],"htmlPopupEnabled":true,"selectable":true,"featureCacheType":"Session","displayFiltersType":"ByScale","featureBlendingMode":"Alpha","labelClasses":[{"type":"CIMLabelClass","expression":"$feature.Shape_Length","expressionEngine":"Arcade","featuresToLabel":"AllVisibleFeatures","maplexLabelPlacementProperties":{"type":"CIMMaplexLabelPlacementProperties","featureType":"Polygon","avoidPolygonHoles":true,"canOverrunFeature":true,"canPlaceLabelOutsidePolygon":true,"canRemoveOverlappingLabel":true,"canStackLabel":true,"connectionType":"Unambiguous","constrainOffset":"NoConstraint","contourAlignmentType":"Page","contourLadderType":"Straight","contourMaximumAngle":90,"enableConnection":true,"featureWeight":0,"fontHeightReductionLimit":4,"fontHeightReductionStep":0.5,"fontWidthReductionLimit":90,"fontWidthReductionStep":5,"graticuleAlignmentType":"Straight","keyNumberGroupName":"Default","labelBuffer":15,"labelLargestPolygon":false,"labelPriority":-1,"labelStackingProperties":{"type":"CIMMaplexLabelStackingProperties","stackAlignment":"ChooseBest","maximumNumberOfLines":3,"minimumNumberOfCharsPerLine":3,"maximumNumberOfCharsPerLine":24,"separators":[{"type":"CIMMaplexStackingSeparator","splitAfter":true},{"type":"CIMMaplexStackingSeparator","separator":",","visible":true,"splitAfter":true}],"trimStackingSeparators":true},"lineFeatureType":"General","linePlacementMethod":"OffsetCurvedFromLine","maximumLabelOverrun":80,"maximumLabelOverrunUnit":"Point","minimumFeatureSizeUnit":"Map","multiPartOption":"OneLabelPerPart","offsetAlongLineProperties":{"type":"CIMMaplexOffsetAlongLineProperties","placementMethod":"BestPositionAlongLine","labelAnchorPoint":"CenterOfLabel","distanceUnit":"Percentage","useLineDirection":true},"pointExternalZonePriorities":{"type":"CIMMaplexExternalZonePriorities","aboveLeft":4,"aboveCenter":2,"aboveRight":1,"centerRight":3,"belowRight":5,"belowCenter":7,"belowLeft":8,"centerLeft":6},"pointPlacementMethod":"AroundPoint","polygonAnchorPointType":"GeometricCenter","polygonBoundaryWeight":0,"polygonExternalZones":{"type":"CIMMaplexExternalZonePriorities","aboveLeft":4,"aboveCenter":2,"aboveRight":1,"centerRight":3,"belowRight":5,"belowCenter":7,"belowLeft":8,"centerLeft":6},"polygonFeatureType":"General","polygonInternalZones":{"type":"CIMMaplexInternalZonePriorities","center":1},"polygonPlacementMethod":"HorizontalInPolygon","primaryOffset":1,"primaryOffsetUnit":"Point","removeExtraWhiteSpace":true,"repetitionIntervalUnit":"Map","rotationProperties":{"type":"CIMMaplexRotationProperties","rotationType":"Arithmetic","alignmentType":"Straight"},"secondaryOffset":100,"strategyPriorities":{"type":"CIMMaplexStrategyPriorities","stacking":1,"overrun":2,"fontCompression":3,"fontReduction":4,"abbreviation":5},"thinningDistanceUnit":"Point","truncationMarkerCharacter":".","truncationMinimumLength":1,"truncationPreferredCharacters":"aeiou","polygonAnchorPointPerimeterInsetUnit":"Point"},"name":"Class1","priority":-1,"standardLabelPlacementProperties":{"type":"CIMStandardLabelPlacementProperties","featureType":"Line","featureWeight":"None","labelWeight":"High","numLabelsOption":"OneLabelPerName","lineLabelPosition":{"type":"CIMStandardLineLabelPosition","above":true,"inLine":true,"parallel":true},"lineLabelPriorities":{"type":"CIMStandardLineLabelPriorities","aboveStart":3,"aboveAlong":3,"aboveEnd":3,"centerStart":3,"centerAlong":3,"centerEnd":3,"belowStart":3,"belowAlong":3,"belowEnd":3},"pointPlacementMethod":"AroundPoint","pointPlacementPriorities":{"type":"CIMStandardPointPlacementPriorities","aboveLeft":2,"aboveCenter":2,"aboveRight":1,"centerLeft":3,"centerRight":2,"belowLeft":3,"belowCenter":3,"belowRight":2},"rotationType":"Arithmetic","polygonPlacementMethod":"AlwaysHorizontal"},"textSymbol":{"type":"CIMSymbolReference","symbol":{"type":"CIMTextSymbol","blockProgression":"TTB","depth3D":1,"extrapolateBaselines":true,"fontEffects":"Normal","fontEncoding":"Unicode","fontFamilyName":"Tahoma","fontStyleName":"Regular","fontType":"Unspecified","haloSize":1,"height":10,"hinting":"Default","horizontalAlignment":"Left","kerning":true,"letterWidth":100,"ligatures":true,"lineGapType":"ExtraLeading","symbol":{"type":"CIMPolygonSymbol","symbolLayers":[{"type":"CIMSolidFill","enable":true,"color":{"type":"CIMRGBColor","values":[0,0,0,100]}}]},"textCase":"Normal","textDirection":"LTR","verticalAlignment":"Bottom","verticalGlyphOrientation":"Right","wordSpacing":100,"billboardMode3D":"FaceNearPlane"}},"useCodedValue":true,"visibility":true,"iD":-1}],"renderer":{"type":"CIMSimpleRenderer","patch":"Default","symbol":{"type":"CIMSymbolReference","symbol":{"type":"CIMPolygonSymbol","symbolLayers":[{"type":"CIMSolidStroke","enable":true,"capStyle":"Round","joinStyle":"Round","lineStyle3D":"Strip","miterLimit":10,"width":0.69999999999999996,"color":{"type":"CIMRGBColor","values":[110,110,110,100]}},{"type":"CIMSolidFill","enable":true,"color":{"type":"CIMRGBColor","values":[178,178,178,100]}}]}}},"scaleSymbols":false,"snappable":true}],"binaryReferences":[{"type":"CIMBinaryReference","uRI":"CIMPATH=Metadata/d5d963aaec841ab7c62b4ff4cfc3dc6c.xml","data":"<?xml version=\"1.0\"?>\r\n<metadata xml:lang=\"en\"><Esri><CreaDate>20210329</CreaDate><CreaTime>10071200</CreaTime><ArcGISFormat>1.0</ArcGISFormat><SyncOnce>TRUE</SyncOnce></Esri></metadata>\r\n"}],"elevationSurfaces":[{"type":"CIMMapElevationSurface","elevationMode":"BaseGlobeSurface","name":"Ground","verticalExaggeration":1,"mapElevationID":"{99F92202-9148-4537-834C-B6AB120E27C8}","color":{"type":"CIMRGBColor","values":[255,255,255,100]},"surfaceTINShadingMode":"Smooth","visibility":true,"expanded":true}],"rGBColorProfile":"sRGB IEC61966-2.1","cMYKColorProfile":"U.S. Web Coated (SWOP) v2"}'

    @staticmethod
    def _symJSON_WithTimeFields(version: Optional[str] = None) -> str:
        return r'{"type":"CIMLayerDocument","version":"2.8.0","build":29660,"layers":["CIMPATH=BlindSpot.xml"],"layerDefinitions":[{"type":"CIMFeatureLayer","name":"BlindSpotLayer","uRI":"CIMPATH=BlindSpot.xml","sourceModifiedTime":{"type":"TimeInstant","start":978307200000},"metadataURI":"CIMPATH=Metadata/8d98840f2d603aa23f52dd5e49641b52.xml","useSourceMetadata":true,"description":"Blind Spot shows incomplete coverage area of assets by time.","layerElevation":{"type":"CIMLayerElevationSurface","mapElevationID":"{99F92202-9148-4537-834C-B6AB120E27C8}"},"expanded":true,"layerType":"Operational","showLegends":true,"transparency":50,"visibility":true,"displayCacheType":"Permanent","maxDisplayCacheAge":5,"showPopups":true,"serviceLayerID":2,"refreshRate":-1,"refreshRateUnit":"esriTimeUnitsSeconds","blendingMode":"Alpha","allowDrapingOnIntegratedMesh":true,"autoGenerateFeatureTemplates":true,"featureElevationExpression":"0","featureTable":{"type":"CIMFeatureTable","displayField":"Shape_Length","editable":true,"timeFields":{"type":"CIMTimeTableDefinition","startTimeField":"blindspot_start","endTimeField":"blindspot_end"},"timeDefinition":{"type":"CIMTimeDataDefinition","useTime":true,"customTimeExtent":{"type":"TimeExtent","start":1406444400000,"end":1420012800000,"empty":false}},"timeDisplayDefinition":{"type":"CIMTimeDisplayDefinition","timeInterval":1,"timeIntervalUnits":"esriTimeUnitsWeeks","timeOffsetUnits":"esriTimeUnitsWeeks"},"timeDimensionFields":{"type":"CIMTimeDimensionDefinition"},"dataConnection":{"type":"CIMStandardDataConnection","workspaceConnectionString":"DATABASE=.\\GenerateBlindSpotAreas2621.gdb","workspaceFactory":"FileGDB","dataset":"input_sensors_buffer_GenerateBlindSpotAreas4","datasetType":"esriDTFeatureClass"},"studyAreaSpatialRel":"esriSpatialRelUndefined","searchOrder":"esriSearchOrderSpatial"},"featureTemplates":[{"type":"CIMFeatureTemplate","name":"input_sensors_buffer_GenerateBlindSpotAreas4","tags":"Polygon","toolProgID":"8f79967b-66a0-4a1c-b884-f44bc7e26921","toolFilter":["6c6970a7-5ca9-448c-9c7d-0d716cd2ac64","a281e635-0f22-47d4-a438-e4d29b920e22","d304243a-5c3a-4ccc-b98b-93684b15fd83"]}],"htmlPopupEnabled":true,"selectable":true,"featureCacheType":"Session","displayFiltersType":"ByScale","featureBlendingMode":"Alpha","labelClasses":[{"type":"CIMLabelClass","expression":"$feature.Shape_Length","expressionEngine":"Arcade","featuresToLabel":"AllVisibleFeatures","maplexLabelPlacementProperties":{"type":"CIMMaplexLabelPlacementProperties","featureType":"Polygon","avoidPolygonHoles":true,"canOverrunFeature":true,"canPlaceLabelOutsidePolygon":true,"canRemoveOverlappingLabel":true,"canStackLabel":true,"connectionType":"Unambiguous","constrainOffset":"NoConstraint","contourAlignmentType":"Page","contourLadderType":"Straight","contourMaximumAngle":90,"enableConnection":true,"featureWeight":0,"fontHeightReductionLimit":4,"fontHeightReductionStep":0.5,"fontWidthReductionLimit":90,"fontWidthReductionStep":5,"graticuleAlignmentType":"Straight","keyNumberGroupName":"Default","labelBuffer":15,"labelLargestPolygon":false,"labelPriority":-1,"labelStackingProperties":{"type":"CIMMaplexLabelStackingProperties","stackAlignment":"ChooseBest","maximumNumberOfLines":3,"minimumNumberOfCharsPerLine":3,"maximumNumberOfCharsPerLine":24,"separators":[{"type":"CIMMaplexStackingSeparator","splitAfter":true},{"type":"CIMMaplexStackingSeparator","separator":",","visible":true,"splitAfter":true}],"trimStackingSeparators":true},"lineFeatureType":"General","linePlacementMethod":"OffsetCurvedFromLine","maximumLabelOverrun":80,"maximumLabelOverrunUnit":"Point","minimumFeatureSizeUnit":"Map","multiPartOption":"OneLabelPerPart","offsetAlongLineProperties":{"type":"CIMMaplexOffsetAlongLineProperties","placementMethod":"BestPositionAlongLine","labelAnchorPoint":"CenterOfLabel","distanceUnit":"Percentage","useLineDirection":true},"pointExternalZonePriorities":{"type":"CIMMaplexExternalZonePriorities","aboveLeft":4,"aboveCenter":2,"aboveRight":1,"centerRight":3,"belowRight":5,"belowCenter":7,"belowLeft":8,"centerLeft":6},"pointPlacementMethod":"AroundPoint","polygonAnchorPointType":"GeometricCenter","polygonBoundaryWeight":0,"polygonExternalZones":{"type":"CIMMaplexExternalZonePriorities","aboveLeft":4,"aboveCenter":2,"aboveRight":1,"centerRight":3,"belowRight":5,"belowCenter":7,"belowLeft":8,"centerLeft":6},"polygonFeatureType":"General","polygonInternalZones":{"type":"CIMMaplexInternalZonePriorities","center":1},"polygonPlacementMethod":"HorizontalInPolygon","primaryOffset":1,"primaryOffsetUnit":"Point","removeExtraWhiteSpace":true,"repetitionIntervalUnit":"Map","rotationProperties":{"type":"CIMMaplexRotationProperties","rotationType":"Arithmetic","alignmentType":"Straight"},"secondaryOffset":100,"strategyPriorities":{"type":"CIMMaplexStrategyPriorities","stacking":1,"overrun":2,"fontCompression":3,"fontReduction":4,"abbreviation":5},"thinningDistanceUnit":"Point","truncationMarkerCharacter":".","truncationMinimumLength":1,"truncationPreferredCharacters":"aeiou","polygonAnchorPointPerimeterInsetUnit":"Point"},"name":"Class1","priority":-1,"standardLabelPlacementProperties":{"type":"CIMStandardLabelPlacementProperties","featureType":"Line","featureWeight":"None","labelWeight":"High","numLabelsOption":"OneLabelPerName","lineLabelPosition":{"type":"CIMStandardLineLabelPosition","above":true,"inLine":true,"parallel":true},"lineLabelPriorities":{"type":"CIMStandardLineLabelPriorities","aboveStart":3,"aboveAlong":3,"aboveEnd":3,"centerStart":3,"centerAlong":3,"centerEnd":3,"belowStart":3,"belowAlong":3,"belowEnd":3},"pointPlacementMethod":"AroundPoint","pointPlacementPriorities":{"type":"CIMStandardPointPlacementPriorities","aboveLeft":2,"aboveCenter":2,"aboveRight":1,"centerLeft":3,"centerRight":2,"belowLeft":3,"belowCenter":3,"belowRight":2},"rotationType":"Arithmetic","polygonPlacementMethod":"AlwaysHorizontal"},"textSymbol":{"type":"CIMSymbolReference","symbol":{"type":"CIMTextSymbol","blockProgression":"TTB","depth3D":1,"extrapolateBaselines":true,"fontEffects":"Normal","fontEncoding":"Unicode","fontFamilyName":"Tahoma","fontStyleName":"Regular","fontType":"Unspecified","haloSize":1,"height":10,"hinting":"Default","horizontalAlignment":"Left","kerning":true,"letterWidth":100,"ligatures":true,"lineGapType":"ExtraLeading","symbol":{"type":"CIMPolygonSymbol","symbolLayers":[{"type":"CIMSolidFill","enable":true,"color":{"type":"CIMRGBColor","values":[0,0,0,100]}}]},"textCase":"Normal","textDirection":"LTR","verticalAlignment":"Bottom","verticalGlyphOrientation":"Right","wordSpacing":100,"billboardMode3D":"FaceNearPlane"}},"useCodedValue":true,"visibility":true,"iD":-1}],"renderer":{"type":"CIMSimpleRenderer","patch":"Default","symbol":{"type":"CIMSymbolReference","symbol":{"type":"CIMPolygonSymbol","symbolLayers":[{"type":"CIMSolidStroke","enable":true,"capStyle":"Round","joinStyle":"Round","lineStyle3D":"Strip","miterLimit":10,"width":0.69999999999999996,"color":{"type":"CIMRGBColor","values":[110,110,110,100]}},{"type":"CIMSolidFill","enable":true,"color":{"type":"CIMRGBColor","values":[178,178,178,100]}}]}}},"scaleSymbols":false,"snappable":true}],"binaryReferences":[{"type":"CIMBinaryReference","uRI":"CIMPATH=Metadata/8d98840f2d603aa23f52dd5e49641b52.xml"}],"elevationSurfaces":[{"type":"CIMMapElevationSurface","elevationMode":"BaseGlobeSurface","name":"Ground","verticalExaggeration":1,"mapElevationID":"{99F92202-9148-4537-834C-B6AB120E27C8}","color":{"type":"CIMRGBColor","values":[255,255,255,100]},"surfaceTINShadingMode":"Smooth","visibility":true,"expanded":true}],"rGBColorProfile":"sRGB IEC61966-2.1","cMYKColorProfile":"U.S. Web Coated (SWOP) v2"}'

    def _makeBlindSpotLYRX(self,
                           output_features: str,
                           start_time_field_name: Optional[str] = None,
                           end_time_field_name: Optional[str] = None) -> str:
        """_makeBlindSpotLYRX Generate LYRX file for output blind spot features.

        Create a new LYRX file for the output_features, which will include
        correct transparency (~50%) and color (~50% gray).

        If start_time_field_name and end_time_field_name are used the output LYRX
        will be time-enabled with the earliest and latest times in both field.
        Both fields must be set the same with both as a field name, or both as
        None. They cannot be split one with a field and one with None.

        :param output_features: path to output blind spot features
        :type output_features: str
        :param start_time_field_name: starting time field in output_features, defaults to None
        :type start_time_field_name: Optional[str], optional
        :param end_time_field_name: ending time field in output_features, defaults to None
        :type end_time_field_name: Optional[str], optional
        :return: path to the newly created LYRX file
        :rtype: str
        """

        import json
        # https://developers.arcgis.com/net/10-2/desktop/api-reference/html/T_Esri_ArcGISRuntime_LocalServices_WorkspaceFactoryType.htm
        try:
            if DEBUG:
                arcpy.AddMessage(f"output_features: {output_features}")
                arcpy.AddMessage(f"start: {start_time_field_name}, end: {end_time_field_name}")

            feature_class_name: str = os.path.basename(output_features)
            workspace_factory, workspace = self._getWorkspaceFactory(os.path.dirname(output_features))

            # # TODO: Need to redo for output in Feature Dataset, output in SDE, etc.
            # # Review work done in Points to Track Segments
            # workspace: str = os.path.dirname(output_features)
            # if not workspace:
            #     if DEBUG:
            #         arcpy.AddMessage(f"No output workspace, defaulting to {arcpy.env.workspace}")
            #     workspace = arcpy.env.workspace
            # workspace_factory: str = ""
            # workspace_factory_progid = arcpy.Describe(workspace).workspaceFactoryProgID
            # if workspace_factory_progid.startswith("esriDataSourcesGDB.FileGDBWorkspaceFactory"):
            #     workspace_factory = "FileGDB"
            # # elif workspace_factory_progid.startswith("esriDataSourcesGDB.AccessWorkspaceFactory"):
            # #    workspace_factory = ""
            # elif workspace_factory_progid.startswith("esriDataSourcesGDB.SdeWorkspaceFactory"):
            #     workspace_factory = "SDE"
            # else:
            #     workspace_factory = "Shapefile"
            #     # Keep in mind that Shapefiles only store DATES and not TIMES so nothing less than DAYS

            output_layer_name: str = self._makeLayerFile(output_features)[0]
            # "Blind Spot shows incomplete coverage area of assets by time."
            layer_description = arcpy.GetIDMessage(190017)

            # get max start and end times from field
            start_time: datetime.datetime
            start_time_ms: int
            end_time: datetime.datetime
            end_time_ms: int
            if start_time_field_name is not None and end_time_field_name is not None:
                start_times = [t[0] for t in arcpy.da.SearchCursor(output_features, [start_time_field_name]) if t[0] is not None]
                if DEBUG:
                    arcpy.AddMessage(f"found {len(start_times)} start times...")
                end_times = [t[0] for t in arcpy.da.SearchCursor(output_features, [end_time_field_name]) if t[0] is not None]
                if DEBUG:
                    arcpy.AddMessage(f"found {len(end_times)} end times...")
                combined_times = start_times + end_times
                if DEBUG:
                    arcpy.AddMessage(f"found {len(combined_times)} combined times...")
                combined_times.sort()
                start_time = combined_times[0]
                start_time_ms = int(start_time.timestamp() * 1000.0)
                end_time = combined_times[-1]
                end_time_ms = int(end_time.timestamp() * 1000.0)

            _SYM_JSON: str
            if start_time_field_name is None or end_time_field_name is None:
                if DEBUG:
                    arcpy.AddMessage(f"Using JSON without time ...")
                _SYM_JSON = self._symJSON_WithoutTimeFields()
            else:
                if DEBUG:
                    arcpy.AddMessage(f"Time fields using JSON with time ... {start_time_field_name}, {end_time_field_name}")
                _SYM_JSON = self._symJSON_WithTimeFields()
            # load the JSON from string
            data: str = json.loads(_SYM_JSON)
            # Change the version info
            # Don't update version or build numbers; issue #1600
            # data["version"] = str(product_version)
            # data["build"] = str(build_number)

            # Change the path info
            layer_xml: str = os.path.basename(output_layer_name.replace(".lyrx", ".xml"))
            # CIMPATH should be <mapname>/<layername>, but if no map, then <layername>?

            cim_path: str
            if self._current_map:
                cim_path = f"CIMPATH={self._current_map.name}/{layer_xml}"
            else:
                cim_path = f"CIMPATH={layer_xml}"

            data["layers"][0] = str(cim_path)
            data["layerDefinitions"][0]["uRI"] = str(cim_path)

            # Change name and description
            data["layerDefinitions"][0]["name"] = str(feature_class_name)
            data["layerDefinitions"][0]["description"] = str(layer_description)
            if start_time_field_name is not None or end_time_field_name is not None:
                # Change the time field names
                data["layerDefinitions"][0]["featureTable"]["timeFields"]["startTimeField"] = str(start_time_field_name)
                data["layerDefinitions"][0]["featureTable"]["timeFields"]["endTimeField"] = str(end_time_field_name)

                # change the start and end times
                data["layerDefinitions"][0]["featureTable"]["timeDefinition"]["customTimeExtent"]["start"] = str(start_time_ms)
                data["layerDefinitions"][0]["featureTable"]["timeDefinition"]["customTimeExtent"]["end"] = str(end_time_ms)

                # change the time display definition
                # https://pro.arcgis.com/en/pro-app/sdk/api-reference/index.html#topic118.html
                time_scale = self._getTimeScale(start_time, end_time)
                data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeInterval"] = int(1)  # numeric value
                data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeIntervalUnits"] = str(time_scale)  # "esriTimeUnitsUnknown"
                data["layerDefinitions"][0]["featureTable"]["timeDisplayDefinition"]["timeOffsetUnits"] = str(time_scale)  # "esriTimeUnitDays"

            # point to the output features
            data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceConnectionString"] = str("DATABASE={0}".format(workspace))
            data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceFactory"] = str(workspace_factory)
            data["layerDefinitions"][0]["featureTable"]["dataConnection"]["dataset"] = str(feature_class_name)
            data["layerDefinitions"][0]["featureTable"]["dataConnection"]["datasetType"] = str("esriDTFeatureClass")

            if os.path.exists(output_layer_name):
                # arcpy.AddMessage("Output layerfile exists {}. Removing...".format(output_layer_name))
                arcpy.AddMessage(arcpy.GetIDMessage(190011).format(output_layer_name))
                os.remove(output_layer_name)
            f = open(output_layer_name, 'w')
            f.write(json.dumps(data))
            f.close()
            return output_layer_name

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    @staticmethod
    def _createMaskFeature(inputfeatures: str) -> arcpy.Polygon:
        """_createMaskFeature create mask polygon from input features

        Creates a single polygon from all input polygons using
        arcpy.Polygon.union method.

        :param inputfeatures: input polygon features
        :type inputfeatures: str
        :return: unioned polygon feature
        :rtype: arcpy.Polygon
        """
        try:
            if DEBUG:
                arcpy.AddMessage(f"_createMaskFeature with: {inputfeatures}")
            union: Optional[arcpy.Polygon] = None
            with arcpy.da.SearchCursor(inputfeatures, ['SHAPE@']) as cursor:
                for count, row in enumerate(cursor):
                    if count == 0:
                        union = row[0]
                    else:
                        union = union.union(row[0])
            if DEBUG:
                arcpy.AddMessage(f"... returning: {union} as {union.type}")
            return union
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    @staticmethod
    def _unionGeometry(geometries: arcpy.Geometry) -> arcpy.Geometry:
        """_unionGeometry union the input geometry

        Input geometry are combined using the
        arcpy.Geometry.union method.

        :param geometries: Input geometries
        :type geometries: arcpy.Geometry
        :return: Output single geometry
        :rtype: arcpy.Geometry
        """
        try:
            outGeom: Optional[arcpy.Geometry] = None
            if len(geometries) == 1:
                outGeom = geometries[0]
            else:
                newgeo: Optional[arcpy.Geometry] = None
                for count, g in enumerate(geometries):
                    # problems in union and densify methods fail here
                    # densify should be completed on input areas before makefoglayer or makefoglayer2 is called
                    # g = self._densify_shape(g, method='GEODESIC')
                    if count == 0:
                        newgeo = g
                    else:
                        newgeo = newgeo.union(g)
                outGeom = newgeo
            return outGeom
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    @staticmethod
    def _getSortedTimesFromDataframe(df: pd.DataFrame,
                                     start: str,
                                     end: str) -> List[datetime.datetime]:
        """getSortedTimesFromDataframe Get sorted list of start/end times

        Return a sorted list of combined starting and ending time columns
        from input dataframe.

        :param df: Input datafame
        :type df: pd.DataFrame
        :param start: starting column name
        :type start: str
        :param end: ending column name
        :type end: str
        :return: sorted list of datetimes
        :rtype: List[datetime.datetime]
        """
        try:
            # Get sorted list of starting and ending times
            times: List[datetime.datetime] = []
            times = df[start].tolist()
            times.extend(df[end].tolist())
            times.sort()
            if DEBUG:
                arcpy.AddMessage(f"After sort, have {len(times)} in times list")
            # Remove "NaT" times from times list
            times2: List[datetime.datetime] = []
            for t in times:
                if t not in times2:
                    if t == 'NaT':
                        continue
                    else:
                        times2.append(t)
            times = times2
            del times2
            return times
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _makeBlindSpotFeatures(self,
                               fc: str,
                               outputfeatures: str,
                               mask: Optional[str] = None,
                               start: Optional[str] = None,
                               end: Optional[str] = None,
                               ) -> str:
        """_makeBlindSpotFeatures Create features showing blind spots in ISR coverage

        Create output feature class of polygons showing where ISR assets
        do not have sensor coverage in space and time. If star and end times are
        not set then all of the input coverage features are merged together and
        are treated as one single surface.

        The output features are the inverse of the covered input areas, showing
        where assests are NOT covering within the mask area.

        If no mask is set then the extent of the union of all input features
        is used.

        :param fc: input asset coverage features
        :type fc: str
        :param outputfeatures: output blind spot feature path to be created
        :type outputfeatures: str
        :param mask: Area of interest masking features, defaults to None
        :type mask: Optional[str], optional
        :param start: start time field name, defaults to None
        :type start: Optional[str], optional
        :param end: end time field name, defaults to None
        :type end: Optional[str], optional
        :return: Path to output features
        :rtype: str
        """
        import math
        try:
            if DEBUG:
                arcpy.AddMessage(f"fc: {fc}\nstart: {start}\nend: {end}\nmask: {mask}\
                    \noutputfeatures: {outputfeatures}")

            fcDescribe = arcpy.Describe(fc)
            infeatures = 'infeatures'
            arcpy.management.MakeFeatureLayer(fc, infeatures)
            oidname = fcDescribe.OIDFieldName
            shapename = fcDescribe.shapeFieldName

            # Create dataframe
            data: List[Any]
            df1: pd.DataFrame
            if start and end:
                data = [row for row in arcpy.da.SearchCursor(infeatures, ["OID@", "SHAPE@", start, end])]
                df1 = pd.DataFrame(data, columns=[oidname, shapename, start, end])
            else:
                data = [row for row in arcpy.da.SearchCursor(infeatures, ["SHAPE@"])]
                df1 = pd.DataFrame(data, columns=[shapename])

            if DEBUG:
                arcpy.AddMessage(f"after create, dataframe.shape is\n{df1.shape}")

            # Drop all null rows from dataframe
            df1.dropna(axis=0, inplace=True)
            if DEBUG:
                arcpy.AddMessage(f"after dropna, dataframe.shape is\n{df1.shape}")

            # Get sorted list of starting and ending times from the dataframe columns
            times: Optional[List[datetime.datetime]] = None
            timesSize: Optional[int] = None
            period: Optional[int] = None

            if start is not None and end is not None:
                times = self._getSortedTimesFromDataframe(df1, start, end)
                timesSize = len(times)
                # Set time period for time period processing message
                period = 1000
                if timesSize < 3000:
                    period = 100

            # fix for 1303
            sr = fcDescribe.spatialReference
            # Create output features
            fog = os.path.join('memory', 'tempBlindSpot')
            arcpy.management.CreateFeatureclass(os.path.dirname(fog),
                                                os.path.basename(fog),
                                                'POLYGON',
                                                spatial_reference=sr)
            self._delete_intermediate.append(fog)

            # 190018 = Start Date
            # 190019 = End Date
            # 190020 = Percent Visible
            # 190021 = Percent Blind
            if DEBUG:
                arcpy.AddMessage("Adding fields to fog...")
            fieldsToAdd: List[Any]
            if start is not None and end is not None:
                if DEBUG:
                    arcpy.AddMessage(".... all four: dates and visibility")
                fieldsToAdd = [[self._startDateFieldName, "DATE", arcpy.GetIDMessage(190018)],
                               [self._endDateFieldName, "DATE", arcpy.GetIDMessage(190019)],
                               [self._pctVisibleFieldName, "DOUBLE", arcpy.GetIDMessage(190020)],
                               [self._pctBlindFieldName, "DOUBLE", arcpy.GetIDMessage(190021)],
                               ]
            else:
                if DEBUG:
                    arcpy.AddMessage(".... just visibility fields.")
                fieldsToAdd = [[self._pctVisibleFieldName, "DOUBLE", arcpy.GetIDMessage(190020)],
                               [self._pctBlindFieldName, "DOUBLE", arcpy.GetIDMessage(190021)],
                               ]
            arcpy.management.AddFields(fog, fieldsToAdd)

            if times is not None:
                # Create a blind spot geometry and attribues for each time range

                cursorFieldList = [self._startDateFieldName,
                                   self._endDateFieldName,
                                   self._pctVisibleFieldName,
                                   self._pctBlindFieldName,
                                   'SHAPE@']
                if DEBUG:
                    arcpy.AddMessage(f"Starting insert cursor with {len(times)} \
                        in time list...")
                with arcpy.da.InsertCursor(fog, cursorFieldList) as insert:

                    # Step through each time range in the list
                    for t2_count, t2 in enumerate(times):

                        # tell user where we are at in processing
                        if math.fmod(t2_count, period) == 0:
                            timestamp = datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S %p")
                            # "Time period {0} of {1} ({2})..."
                            arcpy.AddMessage(arcpy.GetIDMessage(190013).format(t2_count,
                                                                               timesSize,
                                                                               timestamp))

                        # get the start and end times for this range period
                        i = times.index(t2)
                        if i + 1 == timesSize:  # If we reach the last time break out of the for loop
                            break
                        firstTime = times[i]
                        nextTime = times[i + 1]

                        # expression = start + " <= '" + str(times[i]) + "' and " + end + " >= '" + str(times[i+1])+ "'"
                        expression = f"{start} <= '{firstTime}' and {end} >= '{nextTime}'"
                        if DEBUG:
                            arcpy.AddMessage(f"expression: {expression}")

                        # Make the geometry and area percentages
                        geolist = df1.query(expression)[shapename].tolist()
                        if DEBUG:
                            arcpy.AddMessage(f"geolist: {geolist}")
                        cursorPctVisible = 0.0
                        cursorPctBlind = 100.0
                        cursorShape = mask
                        if len(geolist) > 0:  # If there are any geometries in selected time range
                            cursorShape = mask.difference(self._unionGeometry(geolist))
                            cursorPctBlind = float((cursorShape.area / mask.area) * 100.0)
                            cursorPctVisible = 100.0 - cursorPctBlind

                        # Add the data to a new row in the output features
                        insert.insertRow([firstTime, nextTime, cursorPctVisible, cursorPctBlind, cursorShape])
            else:
                # Create a blind spot geometry for all features
                cursorFieldList = [self._pctVisibleFieldName,
                                   self._pctBlindFieldName,
                                   'SHAPE@']
                if DEBUG:
                    arcpy.AddMessage(r"Starting insert cursor with no start/end time...")
                geometries = df1[shapename].tolist()
                union = self._unionGeometry(geometries)
                finalgeometry = mask.difference(union)
                with arcpy.da.InsertCursor(fog, cursorFieldList) as insert:
                    cursorPctBlind = float((finalgeometry.area / mask.area) * 100.0)
                    cursorPctVisible = 100.0 - cursorPctBlind
                    insert.insertRow([cursorPctVisible, cursorPctBlind, finalgeometry])

            if DEBUG:
                arcpy.AddMessage(f"fog has {arcpy.management.GetCount(fog)[0]} features...")

            arcpy.CopyFeatures_management(fog, outputfeatures)
            return outputfeatures

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def generate_areas(self):
        """generate_areas Create blind spot features

        Create new blind spot features from input ISR coverage areas set in the
        BlindSpotAreas initalization.

        :return: Output blind spot features and associated LYRX file
        :rtype: List
        """

        # Intel #2026
        # If we run outside Pro then scratchWorkspace will be None
        # make a temp dir, and temp GDB for this
        # however we need to delete these
        if arcpy.env.scratchGDB is None:
            self._temp_scratch = create_scratch_geodatabase()
            arcpy.env.scratchGDB = self._temp_scratch
            self._delete_temp_scratch_flag = True

        try:
            inputFeatureDescribe = arcpy.Describe(self._input_features)
            mapSR: Optional[arcpy.SpatialReference] = None
            if self._current_map:
                defCamera = self._current_map.defaultCamera
                cameraExtent = defCamera.getExtent()
                mapSR = cameraExtent.spatialReference
                if DEBUG:
                    arcpy.AddMessage(f"Active map spatial reference is {mapSR.name}")

            inputSR = inputFeatureDescribe.spatialReference
            inputfeatures = 'inputfeatures'
            arcpy.management.MakeFeatureLayer(self._input_features,
                                              inputfeatures)

            # Clear selection on inputfeatures
            arcpy.management.SelectLayerByAttribute(inputfeatures,
                                                    "CLEAR_SELECTION")

            # If input is projected SR, then use that as output SR
            # If input is geographic SR and there is an active map with projected SR, then use map SR as output SR
            # If input is geographic SR and there is no active map, or map is geographic SR then select a UTM zone
            mustProjectInput: bool = False
            if inputSR.type == 'Projected':
                arcpy.env.outputCoordinateSystem = inputSR
                if DEBUG:
                    arcpy.AddMessage("input is projected... continuing...")
            elif inputSR.type == 'Geographic' and mapSR:
                if mapSR.type == 'Projected':
                    arcpy.env.outputCoordinateSystem = mapSR
                    mustProjectInput = True
                if DEBUG:
                    arcpy.AddMessage(f"input geographic, map projected, projecting to map SR: {mapSR.name}")
                else:
                    centroid = inputFeatureDescribe.extent.polygon.centroid
                    utmSR = selectUTMZone(centroid.X, centroid.Y)
                    arcpy.env.outputCoordinateSystem = utmSR
                    mustProjectInput = True
                    if DEBUG:
                        arcpy.AddMessage(f"input geographic, map geographic, using UTM: {utmSR.name}")
            else:
                centroid = inputFeatureDescribe.extent.polygon.centroid
                utmSR = selectUTMZone(centroid.X, centroid.Y)
                arcpy.env.outputCoordinateSystem = utmSR
                mustProjectInput = True
                if DEBUG:
                    arcpy.AddMessage("input geographic, no map, using UTM: {utmSR.name}")

            # Project inputs if needed
            inputf: str = inputfeatures
            workingInputFeatures: Optional[str] = None
            if mustProjectInput:
                if DEBUG:
                    arcpy.AddMessage(f"projecting input features to {arcpy.env.outputCoordinateSystem.name}")
                workingInputFeatures = create_temp_table_name(workspace=arcpy.env.scratchGDB)
                if arcpy.Exists(workingInputFeatures):
                    arcpy.management.Delete(workingInputFeatures)
                arcpy.management.Project(inputfeatures,
                                         workingInputFeatures,
                                         arcpy.env.outputCoordinateSystem)
                self._delete_intermediate.append(workingInputFeatures)
                arcpy.management.MakeFeatureLayer(workingInputFeatures,
                                                  inputfeatures)

            # Clear selection on inputf features
            arcpy.management.SelectLayerByAttribute(inputf,
                                                    "CLEAR_SELECTION")

            # Handling an input mask feature or using input features
            # extents as a mask.
            mask: Optional[arcpy.Polygon] = None
            if self._input_area_feature is None:
                extent = arcpy.Describe(inputf).extent
                mask = extent.polygon
            else:
                areafeature = 'areafeature'
                arcpy.management.MakeFeatureLayer(self._input_area_feature,
                                                  areafeature)
                arcpy.management.SelectLayerByLocation(inputf,
                                                       'WITHIN_A_DISTANCE_GEODESIC',
                                                       areafeature,
                                                       None,
                                                       "NEW_SELECTION")
                mask = self._createMaskFeature(areafeature)
            if DEBUG:
                arcpy.AddMessage(f"Done handling mask: {mask}")


            # Work around for densify method issues
            densify_linear_unit: str = "0.1 Meters"
            densify_method: str = "GEODESIC"
            # "Densifying input {} using {} by {}..."
            arcpy.AddMessage(arcpy.GetIDMessage(190014).format(inputf,
                                                               densify_method,
                                                               densify_linear_unit))
            densified_buffers: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(densified_buffers):
                arcpy.management.Delete(densified_buffers)
            self._delete_intermediate.append(densified_buffers)
            arcpy.management.GeodeticDensify(inputf,
                                             densified_buffers,
                                             densify_method,
                                             distance=densify_linear_unit)


            # Make the blind spot area feature classes
            out_features: Optional[str] = None
            if DEBUG:
                arcpy.AddMessage(f"self._start is {self._start}, and self._end is {self._end}")
            if self._start is None and self._end is None:
                out_features = self._makeBlindSpotFeatures(densified_buffers,
                                                           self._output_features,
                                                           mask=mask,
                                                           )
            else:
                out_features = self._makeBlindSpotFeatures(densified_buffers,
                                                           self._output_features,
                                                           mask=mask,
                                                           start=self._start,
                                                           end=self._end,
                                                           )
            if DEBUG:
                arcpy.AddMessage(f"out_features contains {arcpy.management.GetCount(out_features)[0]} features.")

            # Add Symbology to output features
            outLYRX: str
            if self._start is not None and self._end is not None:
                outLYRX = self._makeBlindSpotLYRX(self._output_features,
                                                  start_time_field_name=self._startDateFieldName,
                                                  end_time_field_name=self._endDateFieldName)
            else:
                outLYRX = self._makeBlindSpotLYRX(self._output_features,
                                                  start_time_field_name=None,
                                                  end_time_field_name=None)

            # return self._output_features
            return [self._output_features, outLYRX]

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)
