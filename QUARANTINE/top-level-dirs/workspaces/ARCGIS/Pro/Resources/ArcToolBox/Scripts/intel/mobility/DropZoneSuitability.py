# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
DropZoneSuitability.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2018-07-20 - phill - inital commits
* 2018-07-23 - phill - updates
* 2018-07-24 - phill - remove obstacles
* 2019-05-09 - mfunk - rename and conda packaging move
* 2019-08-14 - mfunk - Paramter/tool fixes for Pro integration
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2019-10-14 - mfunk - move imports into methods
* 2020-01-13 - mfunk - module rename for 'intel'
* 2020-04-23 - mfunk - handle non-Pro (empty) scratchWorkspace for Intel #2027
* 2020-08-10 - mfunk - refactor tool and add type hinting
* 2021-05-24 - mfunk - fixes for issue 1535
* 2021-07-28 - mfunk - fixes for 2774, add error decorator and logging
------------------------------------------------------------------------------
'''

import arcpy
import os
import sys
import traceback
import logging

from typing import Any, Optional, List, Union
from intel.utilities import DEBUG, \
                            create_scratch_geodatabase, \
                            create_temp_table_name, \
                            Logger

from intel.enumerations import WorkspaceFactoryEnum
from intel.utilities.ErrorHandlers import general_error_logger


class FindDropZones(object):

    # class level variable for logger
    _logger: Logger

    @general_error_logger
    def __init__(self,
                 input_slope: str,
                 input_vegetation: str,
                 input_aoi: str,
                 output_drop_zones: str):
        """__init__ Initialize FindDropZones

        Constructor

        :param input_slope: Path to input slope raster
        :type input_slope: str
        :param input_vegetation: Path to input vegetation polygons
        :type input_vegetation: str
        :param input_aoi: Path to input area polygon
        :type input_aoi: str
        :param output_drop_zones: Path to output drop zone features
        :type output_drop_zones: str
        """

        self._logger = Logger()
        self._logger.create_logger(self.__class__.__name__)
        if DEBUG:
            self._logger.debug(f"DEBUG is {DEBUG}")

        self._inputSlope = input_slope
        self._inputVegetation = input_vegetation
        self._inputAOI = input_aoi

        # self.inputObstructions = inputObstructions
        self._outputDropZones = output_drop_zones

        # list of temp datasets to be deleted
        self._delete_intermediate: list = []

        # if we create a temp workspace
        self._delete_temp_scratch_flag: bool = False
        self._temp_scratch: Optional[str] = None

        # get the current map if there is one.
        self._map: arcpy.mp.Map = self._getCurrentMap()

        # check out spatial analyst license
        arcpy.CheckOutExtension("Spatial")

    @property
    def inputAOI(self) -> str:
        return self._inputAOI

    @inputAOI.setter
    def inputAOI(self, value):
        self._inputAOI = value

    @property
    def inputSlope(self) -> str:
        return self._inputSlope

    @inputSlope.setter
    def inputSlope(self, value):
        self._inputSlope = value

    @property
    def inputVegetation(self) -> str:
        return self._inputVegetation

    @inputVegetation.setter
    def inputVegetation(self, value):
        self._inputVegetation = value

    @property
    def outputDropZones(self) -> str:
        return self._outputDropZones

    @outputDropZones.setter
    def outputDropZones(self, value):
        self._outputDropZones = value

    @general_error_logger
    def __del__(self):
        # check in spatial analyst license
        arcpy.CheckInExtension("Spatial")

        # cleanup intermediate datasets
        self._cleanup()

    @general_error_logger
    def _lyrxFilePath(self, out_features: str):
        """
        _lyrxFilePath Get a path for output LYRX

        Bet a path for the output LYRX file based on the target
        output features. This will be the parent folder for
        most datasets.

        This method is also called in intelDropZoneToolClasses' updateMessages.

        :param out_features: Path to output features
        :type out_features: str
        :return: path to output LYRX
        :rtype: str
        """
        # check workspace
        folder_path: str
        layer_name: str

        # Get correct workspace
        initial_workspace: str = os.path.dirname(out_features)
        initial_describe: Any = arcpy.Describe(initial_workspace)
        corrected_workspace: str = initial_workspace
        workspace_type: Any = None
        has_feature_dataset: bool = False
        if hasattr(initial_describe, 'workspaceType'):
            # get workspace type
            workspace_type = arcpy.Describe(os.path.dirname(out_features)).workspaceType
        elif hasattr(initial_describe, 'datasetType'):
            if initial_describe.datasetType == 'FeatureDataset':
                corrected_workspace = os.path.dirname(initial_workspace)
                workspace_type = arcpy.Describe(corrected_workspace).workspaceType
                has_feature_dataset = True
        else:
            pass

        # Determine layer name and folder path from workspace type
        if workspace_type == 'LocalDatabase':
            layer_name = os.path.basename(out_features)  # assume no extension for db features
            if has_feature_dataset:
                folder_path = os.path.dirname(os.path.dirname(os.path.dirname(out_features)))
            else:
                folder_path = os.path.dirname(os.path.dirname(out_features))

        elif workspace_type == 'FileSystem':
            # check extension
            file_ext: str = os.path.splitext(out_features)[1]
            if file_ext == '.shp':
                layer_name = os.path.splitext(os.path.basename(out_features))[0]
                folder_path = os.path.dirname(out_features)
            else:
                if DEBUG:
                    self._logger.debug(f"have some other extension: {file_ext}")

        # for SDE
        elif workspace_type == 'RemoteDatabase':
            layer_name = os.path.basename(out_features)
            folder_path = arcpy.env.scratchFolder

        else:
            # if not LocalDatabase, RemoteDatabase, or FileSystem
            if DEBUG:
                self._logger.debug(f"Other workspace type: {workspace_type}")
            layer_name = os.path.basename(out_features)
            folder_path = arcpy.env.scratchFolder

        lyrx_path: str = os.path.join(folder_path, f"{layer_name}.lyrx")

        return [lyrx_path, has_feature_dataset]

    @staticmethod
    def _getCurrentMap() -> Any:
        """
        _getCurrentMap Return current map if there is one

        Return current map object if there is one, if not
        return None.

        :return: current map
        :rtype: arcpy Map object
        """
        current_map: Optional[arcpy._map.Map] = None
        try:
            import arcpy.mp
            aprx = arcpy.mp.ArcGISProject("CURRENT")
            current_map = aprx.activeMap
        # NOTE: do not use general error handler here as 
        # the method is expected to error if there is 
        # no active map in the project
        except Exception:
            arcpy.AddMessage(arcpy.GetIDMessage(190071))
        return current_map

    @staticmethod
    @general_error_logger
    def _getWorkspaceFactory(workspace: str) -> List[Optional[str]]:
        """
        _getWorkspaceFactory Get workspace enum type

        Get CIM WorkspaceFactory enum type from the workspace ProgID

        :param workspace: path to workspace
        :type workspace: string
        :return: workspacefactory enum
        :rtype: str
        """

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
                # Mobile Geodatabase -- not fully working yet???
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
            workspace_factory_progid = originalWorkspaceDescribe.workspaceFactoryProgID
            workspace_factory = getWSFType(workspace_factory_progid)

        # if no, then is it a path to a feature dataset in a GDB?
        elif hasattr(originalWorkspaceDescribe, 'datasetType'):
            if originalWorkspaceDescribe.datasetType == 'FeatureDataset':
                # if it is a Feature Datset we need to go up one level for workspace type
                workingWS: str = os.path.dirname(workspace)
                workingDescribe: Any = arcpy.Describe(workingWS)
                workspace_factory_progid: str = workingDescribe.workspaceFactoryProgID
                workspace_factory: Optional[str] = getWSFType(workspace_factory_progid)
                workspace = workingWS
        else:
            workspace_factory = None

        return [workspace_factory, workspace]

    @staticmethod
    @general_error_logger
    def _baseDZSymbologyJSON() -> str:
        """_baseDZSymbologyJSON Symbology JSON for LYRX

        CIM definition of DZ layer. Used as the base
        JSON string to create the LYRX file.

        :return: DZ content JSON string
        :rtype: str
        """
        return r'{"binaryReferences":[{"data":"<?xml version=\"1.0\"?>\r\n<metadata xml:lang=\"en\"><Esri><CreaDate>20190329<\/CreaDate><CreaTime>14130200<\/CreaTime><ArcGISFormat>1.0<\/ArcGISFormat><SyncOnce>TRUE<\/SyncOnce><\/Esri><\/metadata>\r\n","type":"CIMBinaryReference","uRI":"CIMPATH=Metadata/8114a0ff0b22e743a56e1df79d7635ef.xml"}],"build":15769,"layers":["CIMPATH=map/dropzones.xml"],"layerDefinitions":[{"featureElevationExpression":"Shape.Z","renderer":{"defaultSymbolPatch":"Default","colorRamp":{"colorSpace":{"type":"CIMICCColorSpace","url":"Default RGB"},"maxV":100,"minS":15,"maxAlpha":100,"minAlpha":100,"maxH":360,"minV":99,"type":"CIMRandomHSVColorRamp","maxS":30},"defaultSymbol":{"symbol":{"symbolLayers":[{"lineStyle3D":"Strip","joinStyle":"Round","color":{"values":[110,110,110,100],"type":"CIMRGBColor"},"enable":true,"capStyle":"Round","width":0.7,"miterLimit":10,"type":"CIMSolidStroke"},{"color":{"values":[130,130,130,100],"type":"CIMRGBColor"},"enable":true,"type":"CIMSolidFill"}],"type":"CIMPolygonSymbol"},"type":"CIMSymbolReference"},"groups":[{"heading":"Slope Category Description","classes":[{"patch":"AreaHydroPoly","symbol":{"symbol":{"symbolLayers":[{"lineStyle3D":"Strip","joinStyle":"Round","color":{"values":[110,110,110,100],"type":"CIMRGBColor"},"enable":true,"capStyle":"Round","width":0.7,"miterLimit":10,"type":"CIMSolidStroke"},{"color":{"values":[76,230,0,100],"type":"CIMRGBColor"},"enable":true,"type":"CIMSolidFill"}],"type":"CIMPolygonSymbol"},"type":"CIMSymbolReference"},"visible":true,"values":[{"fieldValues":["Less than 10% slope (personnel)"],"type":"CIMUniqueValue"}],"label":"Less than 10% slope (personnel)","type":"CIMUniqueValueClass"},{"patch":"AreaHydroPoly","symbol":{"symbol":{"symbolLayers":[{"lineStyle3D":"Strip","joinStyle":"Round","color":{"values":[110,110,110,100],"type":"CIMRGBColor"},"enable":true,"capStyle":"Round","width":0.7,"miterLimit":10,"type":"CIMSolidStroke"},{"color":{"values":[255,255,0,100],"type":"CIMRGBColor"},"enable":true,"type":"CIMSolidFill"}],"type":"CIMPolygonSymbol"},"type":"CIMSymbolReference"},"visible":true,"values":[{"fieldValues":["Between 10% and 30% slope (supply drops only)"],"type":"CIMUniqueValue"}],"label":"Between 10% and 30% slope (supply drops only)","type":"CIMUniqueValueClass"}],"type":"CIMUniqueValueGroup"}],"polygonSymbolColorTarget":"Fill","defaultLabel":"<all other values>","type":"CIMUniqueValueRenderer","fields":["slopedesc"]},"htmlPopupEnabled":true,"layerElevation":{"type":"CIMLayerElevationSurface"},"selectable":true,"description":"DropZones","serviceLayerID":7,"featureTemplates":[{"name":"Less than 10% slope (personnel)","toolProgID":"8f79967b-66a0-4a1c-b884-f44bc7e26921","defaultValues":{"propertySetItems":["slopedesc","Less than 10% slope (personnel)","fcsubtype",100380],"type":"PropertySet"},"type":"CIMFeatureTemplate","tags":"Polygon"},{"name":"Between 10% and 30% slope (supply drops only)","toolProgID":"8f79967b-66a0-4a1c-b884-f44bc7e26921","defaultValues":{"propertySetItems":["slopedesc","Between 10% and 30% slope (supply drops only)","fcsubtype",100380],"type":"PropertySet"},"type":"CIMFeatureTemplate","tags":"Polygon"}],"displayCacheType":"Permanent","featureCacheType":"Session","type":"CIMFeatureLayer","metadataURI":"CIMPATH=Metadata/8114a0ff0b22e743a56e1df79d7635ef.xml","expanded":true,"layer3DProperties":{"isLayerLit":true,"verticalUnit":{"uwkid":9003},"verticalExaggeration":1,"layerFaceCulling":"None","maxDistance":-1,"preloadTextureCutoffHigh":0,"type":"CIM3DLayerProperties","lighting":"OneSideDataNormal","useCompressedTextures":true,"textureCutoffLow":1,"minDistance":-1,"textureCutoffHigh":0.25,"preloadTextureCutoffLow":0.25,"castShadows":true},"refreshRate":-1,"featureTable":{"studyAreaSpatialRel":"esriSpatialRelUndefined","editable":true,"displayField":"FID_suitableveg","type":"CIMFeatureTable","dataConnection":{"workspaceConnectionString":"DATABASE=*.gdb","type":"CIMStandardDataConnection","workspaceFactory":"FileGDB","datasetType":"esriDTFeatureClass","dataset":"DropZones"},"searchOrder":"esriSearchOrderSpatial"},"labelClasses":[{"textSymbol":{"symbol":{"symbol":{"symbolLayers":[{"color":{"values":[0,0,0,100],"type":"CIMRGBColor"},"enable":true,"type":"CIMSolidFill"}],"type":"CIMPolygonSymbol"},"fontType":"Unspecified","hinting":"Default","kerning":true,"fontEffects":"Normal","wordSpacing":100,"type":"CIMTextSymbol","extrapolateBaselines":true,"lineGapType":"ExtraLeading","textDirection":"LTR","fontFamilyName":"Tahoma","horizontalAlignment":"Left","ligatures":true,"verticalGlyphOrientation":"Right","billboardMode3D":"FaceNearPlane","blockProgression":"TTB","haloSize":1,"letterWidth":100,"textCase":"Normal","fontEncoding":"Unicode","fontStyleName":"Regular","depth3D":1,"verticalAlignment":"Bottom","height":10},"type":"CIMSymbolReference"},"expression":"$feature.Name","visibility":true,"standardLabelPlacementProperties":{"numLabelsOption":"OneLabelPerName","labelWeight":"High","lineLabelPosition":{"parallel":true,"inLine":true,"above":true,"type":"CIMStandardLineLabelPosition"},"pointPlacementMethod":"AroundPoint","pointPlacementPriorities":{"aboveLeft":2,"centerLeft":3,"belowCenter":3,"aboveRight":1,"aboveCenter":2,"centerRight":2,"type":"CIMStandardPointPlacementPriorities","belowLeft":3,"belowRight":2},"featureType":"Line","lineLabelPriorities":{"aboveEnd":3,"centerAlong":3,"centerEnd":3,"aboveAlong":3,"belowStart":3,"belowAlong":3,"type":"CIMStandardLineLabelPriorities","aboveStart":3,"centerStart":3,"belowEnd":3},"rotationType":"Arithmetic","type":"CIMStandardLabelPlacementProperties","featureWeight":"Low","polygonPlacementMethod":"AlwaysHorizontal"},"useCodedValue":true,"featuresToLabel":"AllVisibleFeatures","name":"Class 1","iD":-1,"type":"CIMLabelClass","expressionEngine":"Arcade","maplexLabelPlacementProperties":{"removeExtraWhiteSpace":true,"repetitionIntervalUnit":"Map","contourLadderType":"Straight","contourMaximumAngle":90,"graticuleAlignmentType":"Straight","polygonAnchorPointType":"GeometricCenter","enableConnection":true,"type":"CIMMaplexLabelPlacementProperties","connectionType":"Unambiguous","primaryOffset":1,"canPlaceLabelOutsidePolygon":true,"polygonExternalZones":{"aboveLeft":4,"belowCenter":7,"centerLeft":6,"aboveRight":1,"aboveCenter":2,"centerRight":3,"type":"CIMMaplexExternalZonePriorities","belowLeft":8,"belowRight":5},"avoidPolygonHoles":true,"pointPlacementMethod":"AroundPoint","polygonInternalZones":{"center":1,"type":"CIMMaplexInternalZonePriorities"},"canRemoveOverlappingLabel":true,"constrainOffset":"NoConstraint","fontHeightReductionLimit":4,"offsetAlongLineProperties":{"placementMethod":"BestPositionAlongLine","distanceUnit":"Percentage","labelAnchorPoint":"CenterOfLabel","useLineDirection":true,"type":"CIMMaplexOffsetAlongLineProperties"},"canOverrunFeature":true,"polygonBoundaryWeight":0,"polygonFeatureType":"General","truncationMarkerCharacter":".","rotationProperties":{"alignmentType":"Straight","rotationType":"Arithmetic","type":"CIMMaplexRotationProperties"},"contourAlignmentType":"Page","featureType":"Polygon","truncationMinimumLength":1,"featureWeight":0,"primaryOffsetUnit":"Point","pointExternalZonePriorities":{"aboveLeft":4,"belowCenter":7,"centerLeft":6,"aboveRight":1,"aboveCenter":2,"centerRight":3,"type":"CIMMaplexExternalZonePriorities","belowLeft":8,"belowRight":5},"fontHeightReductionStep":0.5,"lineFeatureType":"General","canStackLabel":true,"maximumLabelOverrun":80,"minimumFeatureSizeUnit":"Map","labelPriority":-1,"multiPartOption":"OneLabelPerPart","truncationPreferredCharacters":"aeiou","fontWidthReductionLimit":90,"linePlacementMethod":"OffsetCurvedFromLine","strategyPriorities":{"fontCompression":3,"overrun":2,"type":"CIMMaplexStrategyPriorities","abbreviation":5,"fontReduction":4,"stacking":1},"labelBuffer":15,"keyNumberGroupName":"Default","polygonPlacementMethod":"HorizontalInPolygon","labelStackingProperties":{"minimumNumberOfCharsPerLine":3,"maximumNumberOfCharsPerLine":24,"type":"CIMMaplexLabelStackingProperties","separators":[{"splitAfter":true,"type":"CIMMaplexStackingSeparator","separator":" "},{"visible":true,"splitAfter":true,"type":"CIMMaplexStackingSeparator","separator":","}],"stackAlignment":"ChooseBest","maximumNumberOfLines":3},"thinningDistanceUnit":"Point","fontWidthReductionStep":5,"maximumLabelOverrunUnit":"Point","labelLargestPolygon":false,"secondaryOffset":100},"priority":-1}],"layerType":"Operational","maxDisplayCacheAge":5,"showPopups":true,"visibility":true,"scaleSymbols":true,"uRI":"CIMPATH=map/dropzones.xml","refreshRateUnit":"esriTimeUnitsSeconds","autoGenerateFeatureTemplates":true,"showLegends":true,"snappable":true,"transparency":50,"name":"% Slope Drop Zone Suitability","symbolLayerDrawing":{"type":"CIMSymbolLayerDrawing"},"sourceModifiedTime":{"start":978307200000,"type":"TimeInstant"},"useSourceMetadata":true}],"type":"CIMLayerDocument","version":"2.3.0"}'

    @general_error_logger
    def _makeDropZoneLYRX(self, output_features: str) -> str:
        """_makeDropZoneLYRX Create the LYRX for output features

        Create the output LYRX file and insert the symbology
        based on the output features.

        :param out_features: path to output drop zone features
        :type out_features: str
        :return: path to new LYRX
        :rtype: str
        """
        import json
        # https://developers.arcgis.com/net/10-2/desktop/api-reference/html/T_Esri_ArcGISRuntime_LocalServices_WorkspaceFactoryType.htm

        feature_class_name: str = os.path.basename(output_features)

        # get the path and name to the output LYRX
        output_layer_name: str = ""
        has_feature_dataset: bool = False

        output_layer_name, has_feature_dataset = self._lyrxFilePath(output_features) 

        workspace: str
        workspace_factory: str
        # workspace_factory_progid = arcpy.Describe(workspace).workspaceFactoryProgID

        # if workspace_factory_progid.startswith("esriDataSourcesGDB.FileGDBWorkspaceFactory"):
        #     workspace_factory = "FileGDB"
        # # We are not supporting Personal GDBs, just File GDBs.
        # # elif workspace_factory_progid.startswith("esriDataSourcesGDB.AccessWorkspaceFactory"):
        # #    workspace_factory = ""
        # elif workspace_factory_progid.startswith("esriDataSourcesGDB.SdeWorkspaceFactory"):
        #     workspace_factory = "SDE"
        # else:
        #     workspace_factory = "Shapefile"
        workspace_factory, workspace = self._getWorkspaceFactory(os.path.dirname(output_features))

        # get some platform info
        layer_name: str = feature_class_name
        # Get translated layer description: Drop Zones show suitable personnel and supply drop areas.
        layer_description: str = arcpy.GetIDMessage(190080)

        # load the JSON from string
        data = json.loads(self._baseDZSymbologyJSON())

        # Don't update version or build numbers; issue #1600
        # data["version"] = str(product_version)
        # data["build"] = str(build_number)

        # Change the path to LYRX in the CIM
        layer_xml: str = os.path.basename(output_layer_name.replace(".lyrx", ".xml"))
        # CIMPATH should be <mapname>/<layername>, but if no map, then <layername>?

        cim_path: str
        if self._map:
            cim_path = "CIMPATH={0}/{1}".format(self._map.name, layer_xml)
        else:
            cim_path = "CIMPATH={0}".format(layer_xml)

        data["layers"][0] = str(cim_path)
        data["layerDefinitions"][0]["uRI"] = str(cim_path)

        # Change name and description
        data["layerDefinitions"][0]["name"] = str(layer_name)
        data["layerDefinitions"][0]["description"] = str(layer_description)

        # point to the output features
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceConnectionString"] = str("DATABASE={0}".format(workspace))
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["workspaceFactory"] = str(workspace_factory)
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["dataset"] = str(feature_class_name)
        data["layerDefinitions"][0]["featureTable"]["dataConnection"]["datasetType"] = str("esriDTFeatureClass")

        # if there is an existing LYRX
        if os.path.exists(output_layer_name):
            arcpy.AddMessage(arcpy.GetIDMessage(190072).format(output_layer_name))
            os.remove(output_layer_name)

        # write out the LYRX file
        with open(output_layer_name, 'w') as f:
            f.write(json.dumps(data))

        return output_layer_name

    @staticmethod
    @general_error_logger
    def _fieldInfo() -> str:
        """_fieldInfo Generate field info string

        Generate field info string for vegetation make feature layer

        :return: Output field info string
        :rtype: str
        """
        field_names = ['OBJECTID', 'fcsubtype', 'f_code', 'ara', 'bmc',
                       'bmc2', 'bmc3', 'boc', 'dmbc', 'dmbl', 'dmbu', 'dmt', 'ffn', 'ffn2',
                       'ffn3', 'hgt', 'hyp', 'lmc', 'lzn', 'oth', 'pvh', 'sbc', 'sdsc',
                       'sdsl', 'sdsu', 'tid', 'tre', 'tscc', 'tscl', 'tscu', 'ufi', 'veg',
                       'vsp', 'vsp2', 'vsp3', 'wid', 'zi004_rcg', 'zi005_fna', 'zi005_nfn',
                       'zi006_mem', 'zsax_rs0', 'zsax_rx3', 'zsax_rx4', 'zvh', 'adr', 'bac',
                       'caa', 'hhd', 'pcf', 'stl', 'stl2', 'stl3', 'wpi', 'zi005_fna1',
                       'zi005_fna2', 'zi005_nfn1', 'zi005_nfn2', 'ama', 'awp', 'cct', 'ssr',
                       'ssr2', 'ssr3', 'vlm', 'voi', 'aoo', 'atb', 'ppo', 'ppo2', 'ppo3',
                       'tos', 'vcm', 'vcm2', 'vcm3', 'zi013_csp', 'zi013_csp2', 'zi013_csp3',
                       'zi013_ffp', 'zi013_ffp2', 'zi013_ffp3', 'zi013_fmm', 'zi013_fmm2',
                       'zi013_fmm3', 'zi013_irg', 'zi014_ppo', 'zi014_ppo2', 'zi014_ppo3',
                       'zi018_wit', 'shape', 'st_area_shape_', 'st_length_shape_',
                       'shape_length', 'shape_area']

        # field info pattern for each field name:
        # <field_name> <field_name> VISIBLE NONE;
        field_info_map: str = ""
        for v in field_names:
            field_info_map += f"{v} {v} VISIBLE NONE;"
        return field_info_map

    @general_error_logger
    def _cleanup(self):
        """_cleanup object cleanup method

        Cleanup for delete.
        Remove temporary features.

        :param data_to_delete: List of datasets to delete
        :type data_to_delete: list
        """
        # Remove all temp datasets

        # "Removing intermedate datasets... "
        arcpy.AddMessage(arcpy.GetIDMessage(190012))
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

        return True

    @general_error_logger
    def find_drop_zones(self) -> str:
        """
        find_drop_zones Generate drop zone features

        generate drop zones for an area based on input
        slope and vegetation values.

        :return: path to output drop zone features
        :rtype: str
        """
        from arcpy import env
        from arcpy import sa

        # Intel #2027
        # If we run outside Pro then scratchWorkspace will be None
        # make a temp dir, and temp GDB for this
        # however we need to delete these during cleanup
        if env.scratchGDB is None:
            self._temp_scratch = create_scratch_geodatabase()
            env.scratchGDB = self._temp_scratch
            self.delete_temp_scratch_flag = True

        # Configure the Environment
        arcpy.AddMessage(arcpy.GetIDMessage(190073))
        env.extent = self._inputAOI
        env.mask = self._inputAOI
        env.snapRaster = self._inputSlope
        env.resamplingMethod = "NEAREST"
        env.compression = "LZ77"
        env.rasterStatistics = 'STATISTICS'

        # Determine input slope spatial reference and set as default output
        input_slope_sr: arcpy.SpatialReference = arcpy.Describe(self._inputSlope).spatialReference
        env.outputCoordinateSystem = input_slope_sr
        arcpy.AddMessage(arcpy.GetIDMessage(190074).format(input_slope_sr.name))

        # Select acceptable input vegetation values from 'fcode'
        arcpy.AddMessage(arcpy.GetIDMessage(190075))
        Clipped_Veg_Layer: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        if arcpy.Exists(Clipped_Veg_Layer):
            arcpy.management.delete(Clipped_Veg_Layer)
        arcpy.management.MakeFeatureLayer(self._inputVegetation,
                                          Clipped_Veg_Layer,
                                          "",
                                          "",
                                          self._fieldInfo())
        self._delete_intermediate.append(Clipped_Veg_Layer)

        # Acceptable vegetation fcodes
        veg_select_expr: str = "f_code = 'BH135' OR f_code = 'DA020' OR \
        f_code = 'EA010' OR f_code = 'EB010' OR f_code = 'EB015' OR \
        f_code = 'EB020' OR f_code = 'EC040' OR f_code = 'EE020' OR \
        f_code = 'BH150' OR f_code = 'BJ030' OR f_code = 'BJ100' OR \
        f_code = 'BJ110' OR f_code = 'GB055' OR f_code = 'GB075' OR \
        f_code = 'AK160' OR f_code = 'AK120' OR f_code = 'AK040' OR \
        f_code = 'AK100' OR f_code = 'AK101' OR f_code = 'AK090'"
        arcpy.management.SelectLayerByAttribute(Clipped_Veg_Layer,
                                                "NEW_SELECTION",
                                                veg_select_expr)

        # Copy selection to new featureclass
        suitableveg: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        if arcpy.Exists(suitableveg):
            arcpy.management.Delete(suitableveg)
        arcpy.management.CopyFeatures(Clipped_Veg_Layer, suitableveg, "", "0", "0", "0")
        self._delete_intermediate.append(suitableveg)

        # Remove all slope values greater than 30.0
        arcpy.AddMessage(arcpy.GetIDMessage(190076))
        slope30out = sa.SetNull(self._inputSlope, self._inputSlope, r'"VALUE" > 30.0')
        slope30: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        if arcpy.Exists(slope30):
            arcpy.management.Delete(slope30)
        slope30out.save(slope30)
        self._delete_intermediate.append(slope30)

        # Reclassify suitable slope values
        # 0 to 10 -> 2 acceptable
        # 10 to 30 -> 1 acceptable with caution
        arcpy.AddMessage(arcpy.GetIDMessage(190077))
        reclass: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        if arcpy.Exists(reclass):
            arcpy.management.Delete(reclass)
        reclassifyOut: Any = sa.Reclassify(slope30, "Value", sa.RemapRange([[0, 10, 2],
                                                                            [10, 30, 1]]))
        reclassifyOut.save(reclass)
        self._delete_intermediate.append(reclass)

        # Convert the reclassified areas to polygons
        arcpy.AddMessage(arcpy.GetIDMessage(190078))
        slopepoly: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        if arcpy.Exists(slopepoly):
            arcpy.management.Delete(slopepoly)
        arcpy.conversion.RasterToPolygon(reclass, slopepoly, "SIMPLIFY", "VALUE")
        self._delete_intermediate.append(slopepoly)

        # Add slope description fields to the slope polygons
        arcpy.management.AddField(slopepoly, "slopecode", "SHORT", "", "", "", "Slope Category Code", "NULLABLE", "NON_REQUIRED", "")
        arcpy.management.CalculateField(slopepoly, "slopecode", "!gridcode!", "PYTHON")

        arcpy.management.AddField(slopepoly, "slopedesc", "TEXT", "", "", "50", "Slope Category Description", "NULLABLE", "NON_REQUIRED", "")
        exp: str = str("def SlopeCat(catval):\n   if catval == 2: return 'Less than 10% slope (personnel)'\n   if catval == 1: return 'Between 10% and 30% slope (supply drops only)'")
        arcpy.management.CalculateField(slopepoly, "slopedesc", "SlopeCat(!gridcode!)", "PYTHON", exp)

        # Drop unnecessary fields from slopepoly
        drop_fields: list[str] = []
        slopepoly_fields: list[str] = [f.name for f in arcpy.Describe(slopepoly).fields]
        if DEBUG:
            self._logger.debug(f"slopepoly fields: {slopepoly_fields}")
        if "Id" in slopepoly_fields:
            drop_fields.append("ID")
        if "gridcode" in slopepoly_fields:
            drop_fields.append("gridcode")
        if len(drop_fields) > 0:
            if DEBUG:
                self._logger.debug(f"Dropping slope poly fields: {drop_fields}")
            arcpy.management.DeleteField(slopepoly, drop_fields)

        # Intersect the slope polygons with the vegetation polygons
        arcpy.AddMessage(arcpy.GetIDMessage(190079))
        # For these inputs only uses Pro Basic.
        intersected: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
        if arcpy.Exists(intersected):
            arcpy.management.Delete(intersected)
        arcpy.analysis.Intersect([suitableveg, slopepoly], intersected, "ALL", "", "INPUT")
        self._delete_intermediate.append(intersected)

        # Handle the optional obstruction feature classes
        # TODO: for future inclusion
        '''if self.inputObstructions != "" and numFC > 0:

            arcpy.AddMessage( str(numFC) + " feature class(es) provided")
            # create a value table
            vtab = arcpy.ValueTable(2)
            vtab.loadFromString(self.inputObstructions)

            # union
            arcpy.AddMessage("unionedFeatureClass: " + unionedFeatureClass)
            unionedFeatureClass = ocreate_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(unionedFeatureClass):
                arcpy.management.Delete(unionedFeatureClass)
            arcpy.analysis.Union(vtab, unionedFeatureClass)
            self._delete_intermediate.append(unionedFeatureClass)

            # Erase
            eraseOutputFeatureClass = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if arcpy.Exists(eraseOutputFeatureClass):
                arcpy.management.Delete(eraseOutputFeatureClass)
            arcpy.analysis.Erase(projected, unionedFeatureClass, eraseOutputFeatureClass)
            self._delete_intermediate.append(eraseOutputFeatureClass)
            arcpy.management.CopyFeatures(eraseOutputFeatureClass, self.outputDropZones)
            arcpy.AddMessage("Features copied from union to template")
        else:
            # No obstructions, just copy the projected features to the output
            #arcpy.AddMessage("No obstructions, returning base feature class.")
        '''

        drop_fields = [f"FID_{os.path.basename(slopepoly)}",
                       f"FID_{os.path.basename(suitableveg)}"]
        arcpy.management.DeleteField(intersected, drop_fields)

        # copy the results to the output features
        arcpy.management.CopyFeatures(intersected,
                                      self._outputDropZones,
                                      "",
                                      "0",
                                      "0",
                                      "0")

        # make a LYRX with correct symbology
        outlayer: str = self._makeDropZoneLYRX(self._outputDropZones)

        # If we are in a Pro with a map, add output layer to map
        if self._map:
            self._map.addLayer(arcpy.mp.LayerFile(outlayer), "TOP")

        return self._outputDropZones
