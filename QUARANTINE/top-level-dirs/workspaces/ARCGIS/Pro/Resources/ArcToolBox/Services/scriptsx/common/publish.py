"""Module to publish output under the new framework."""
# get/set properties dynamically. pylint: disable=E0237, W0201, E0203
# pylint: disable=logging-fstring-interpolation
import json
import os
from abc import ABC, abstractmethod
from typing import Union, Optional, Dict, List, Any
import time
from copy import deepcopy

import arcpy
import arcpy.management

from .pacommon import PAOutputFeatureLayer, PAOutputName, PAEnvironment
from .palog import LogUtils, ToolExit
from .paremoteutils import PortalUtils
from .aolutils import AOLUtils

LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["PAPublisher", "FeatureServiceLayerPublisher", "FilePublisher", "FSECPublisher"]

ITEMID = "itemId"

DEFAULT_LINE_SYMBOL = {
    "type": "esriSLS",
    "style": "esriSLSSolid",
    "color": [
        156,
        156,
        156,
        255
    ],
    "width": 1
}

DEFAULT_GRID = {
    "type": "esriSLS",
    "style": "esriSLSSolid",
    "color": [
        0,
        0,
        0,
        25
    ],
    "width": 1
}

#region publisher


class PAPublisher(ABC):
    """An abstract class with interface defined for result publish."""

    @abstractmethod
    def publish(self):
        """Abstractmethod for publishing results.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        pass


class FeatureServiceLayerPublisher(PAPublisher):
    """Class module to publish layer as a feature service based on the new framework.

    Attributes
    ----------
        output_json : 'Dict'
            A json with the output description (i.e., {"serviceProperties": {"name": "xxxx"}})
        description : 'List'
            A list of description. Each item represents a description (i.e., drawingInfo, fields) on a certain layer.
        output_as_fs : 'bool'
            True if the output is going to be created as a feature service and False otherwise.

    Methods
    -------
        add_layer_to_publish(layer: 'PAOutputFeatureLayer', position: 'int', name: 'str', layer_index: 'int',
        copy_to_mds: 'bool')
            Add the information of a layer that is going to be published into description.
        publish():
            Publish a feature service based on the description json.

    """

    def __init__(self, output_name: Union[PAOutputName, Dict],
                 tool_version: float = 1.0,
                 process_info: Optional[List] = None):
        """Set the properties of the class.

        Args:
            output_name: an instance of PAOutputName or a dict with information to
            initialize a PAOutputName object.
            tool_version: version of the PATool that calls this publisher. For all
            the tools in 1.0, the output type is GPString but in 2.0 the output type
            is going to be set to the actual GP type (i.e., GPRecordSet, GPFeatureRecordSetLayer).
            process_info: Process information of a certain spatial stats tool.
        Returns:
            No return.
        Raises:
            ToolExit if hosted_featurelayers is not a list with all items as an instance of HostedFeatureLayer.

        """
        if isinstance(output_name, dict):
            output_name = PAOutputName(output_name)

        if tool_version == 1.0:
            self.handler = PortalFSHandler(output_name)
        # 1.1 is for ModelBuilder
        elif tool_version == 1.1:
            self.handler = FSGPHandler(output_name, store_description=True,
                                       hold_off_publishing=True,
                                       process_info=process_info)
        elif tool_version == 2.0:
            if (
                output_name.environment == PAEnvironment.ONLINE
                or output_name.environment == PAEnvironment.ENTERPRISE
            ):
                self.handler = FSGPHandler(output_name)
            else:
                self.handler = PortalFSHandler(output_name)
        else:
            LOGGER.error(f"FeatureServiceLayerPublisher does not support tool in version {tool_version}")
            raise ToolExit

    def add_layer_to_publish(self,
                             layer: PAOutputFeatureLayer,
                             position: int,
                             name: str = "",
                             layer_index: int = 0,
                             copy_to_mds: bool = True):
        """Add the layer for output publish.

        Args:
            layer: an instance of PAFeatureLayer.
            position: index of parameter for saving the published layer.
            name: name of the layer in the published feature service.
            layer_index: index of the layer in the published feature service.
            copy_to_mds: whether to copy the result to the managed datastore or not (default to True).
        Returns:
            No returns.
        Raises:
            ToolExit if layer is not an instance of PAFeatureLayer.

        """
        self.handler.add_layer(layer, position, name, layer_index, copy_to_mds)

    def publish(self):
        """Create the output feature service and publish the result."""
        try:
            self.handler.handle()
            if self.handler.warnings_to_raise:
                for w2r in self.handler.warnings_to_raise:
                    (warn_code, warn_params) = w2r
                    msg_extra = {"message_ID": warn_code}
                    if warn_params:
                        for pn, pv in warn_params.items():
                            msg_extra[pn] = pv

                    LOGGER.warning(warn_code, extra=msg_extra)
        except RuntimeError as err:
            try:
                err_msg = json.loads(str(err))
                if "messageCode" in err_msg:
                    msg_code = err_msg.get("messageCode", "").upper()
                    params = err_msg.get("params", {})
                    if msg_code == "GPEXT_017":
                        LOGGER.error(100372, extra={"message_ID": 100372})
                    elif msg_code == "GPEXT_008":
                        service_name = params.get("name", "")
                        LOGGER.error(110342, extra={"message_ID": 110342,
                                                    "serviceName": service_name})
                    elif msg_code == "GPEXT_003":
                        # GP will print out GPEXT_003, no need to show the message
                        # to external users since it is not helpful
                        LOGGER.error(100374, extra={"message_ID": 100374})
                    else:
                        LOGGER.warning(f"Uncaught GPEXT error of {msg_code}")
                        LOGGER.error(100322, extra={"message_ID": 100322})
                else:
                    LOGGER.debug(f"Portal error '{str(err)}' raised with no messageCode.")
                    LOGGER.error(100322, extra={"message_ID": 100322})
            # unformatted COM error
            except ValueError:
                LOGGER.debug(f"{str(err)}")
                LOGGER.error(100322, extra={"message_ID": 100322})
            raise ToolExit from err
        except Exception as err:
            LOGGER.debug(f"publish exception: {str(err)}")
            err_code = 100322
            # check if the failure is due to output contains TimestampOffset field
            if PortalUtils.is_portal_env():
                try:
                    for output_lyr in self.handler.output_layers:
                        for fld in output_lyr.fields:
                            if fld.type == "TimestampOffset":
                                err_code = 100353
                except Exception as err1:
                    LOGGER.debug(f"Unable to get the fields info due to {str(err1)}")
            LOGGER.error(err_code, extra={"message_ID": err_code})
            raise ToolExit from err


class FilePublisher(PAPublisher):
    """Class module to publish a file."""
    def __init__(self, output_name: Union[PAOutputName, Dict],
                 file_extent: Optional[arcpy.Extent],
                 file_type: str, file_path: str, output_index: int):
        """Set the properties of the class.

        Args:
            output_name: an instance of PAOutputName.
            file_extent: an instance of arcpy.Extent which will be used as the extent of the published file.
            file_type: type of the output file to publish as.
            file_path: absolute path of the file to publish.
            output_index: index of the output to post the publish result to.
        Returns:
            No return.
        Raises:
            ToolExit if hosted_featurelayers is not a list with all items as an instance of HostedFeatureLayer.

        """
        if isinstance(output_name, PAOutputName):
            self.output_json = output_name.json
            self.output_name = output_name
        else:
            self.output_json = output_name
            self.output_name = PAOutputName(output_name)

        if file_extent is None:
            self.file_extent = ""
        else:
            self.file_extent = file_extent.JSON
        self.file_type = file_type
        self.file_path = file_path
        self.output_index = output_index

    def publish(self):
        """Publish the result."""
        processed_output_info = arcpy.gp.processfileoutput(self.output_json, self.file_extent,  # type: ignore
                                                           self.file_type, self.file_path)
        try:
            processed_output_json = json.loads(processed_output_info)
            if self.output_name.created_item_id is None and processed_output_json.get(ITEMID):
                self.output_name.item_created_by_server = True
            self.output_name.created_item_id = processed_output_json.get(ITEMID)
        except ValueError:
            pass
        arcpy.SetParameterAsText(self.output_index, processed_output_info)


class FSECPublisher(FeatureServiceLayerPublisher):
    """Class module to publish layer as a feature service but copying the result outside of the
    arcpy.gp.createFeatureService function."""
    def __init__(self, output_name: Union[PAOutputName, Dict],
                 tool_version: float = 1.0,
                 process_info: Optional[List] = None):
        if isinstance(output_name, dict):
            output_name = PAOutputName(output_name)

        if tool_version == 1.0:
            self.handler = FSECHandler(output_name)
        # 1.1 for model builder
        elif tool_version == 1.1:
            # use the FSGPHandler instead of FSECGPHandler in model builder since in modelbuilder's
            # tool executeion, handler is only in charge of generating the publish description json.
            self.handler = FSGPHandler(output_name, store_description=True,
                                       hold_off_publishing=True,
                                       process_info=process_info)
        elif tool_version == 2.0:
            if (
                output_name.environment == PAEnvironment.ONLINE
                or output_name.environment == PAEnvironment.ENTERPRISE
            ):
                self.handler = FSECGPHandler(output_name)
            else:
                self.handler = FSECHandler(output_name)

        else:
            LOGGER.error(f"FSECPublisher does not support tool in version {tool_version}")
            raise ToolExit

    def add_layer_to_publish(self,
                             layer: PAOutputFeatureLayer,
                             position: int,
                             name: str = "",
                             layer_index: int = 0,
                             copy_to_mds: bool = True):
        self.handler.add_layer(layer, position, name, layer_index, copy_to_mds=False)


#endregion

#region publish handler


class PublishHandler(ABC):

    def __init__(
        self,
        output_name: PAOutputName,
        store_description: bool = False,
        hold_off_publishing: bool = False
    ):
        self.output_name = output_name
        self.output_json = output_name.json
        # output as feature service
        self.output_as_fs = output_name.create_service
        self.description = []
        self.lyr_charts = {}
        self.tbl_charts = {}
        self.output_layers = []
        self.store_description = store_description
        self.hold_off_publishing = hold_off_publishing
        # warnings should be saved in the format of (error_code, parameters)
        # use None if there is no message parameters
        self.warnings_to_raise = []
        self.pos_lyr_map = {}

    def add_layer(
        self,
        layer: PAOutputFeatureLayer,
        position: int,
        name: str = "",
        layer_index: int = 0,
        copy_to_mds: bool = True
    ):
        """Add a layer to the list of publishing.

        Args:
            layer (PAOutputFeatureLayer): a PAOutputFeatureLayer to publish.
            position (int): position on REST to host the output information.
            name (str, optional): name of the layer in feature service. Defaults to "".
            layer_index (int, optional): index of the layer in the feature service. Defaults to 0.
            copy_to_mds (bool, optional): Applies only in non-analysis studio environment.
            True to copy the data to the Portal's datastore and False otherwise. Defaults to True.
        """
        # check if the layer is publishable
        if (
            not self.output_as_fs
            and layer.count > 9999
            and self.output_name.environment != PAEnvironment.MODELBUILDER
        ):
            LOGGER.error(100291, extra={"message_ID": 100291})
            raise ToolExit
        elif self.output_as_fs and layer.fields:
            if self.output_name.environment == PAEnvironment.ONLINE and len(layer.fields) > 1023:
                LOGGER.error(100319, extra={"message_ID": 100319})
                raise ToolExit
            elif self.output_name.environment == PAEnvironment.ENTERPRISE and len(layer.fields) > 1019:
                LOGGER.error(100320, extra={"message_ID": 100320})
                raise ToolExit
    
        self.pos_lyr_map[position] = layer_index

        if not layer or layer.count == 0:
            warn2add = (100360, None)
            if warn2add not in self.warnings_to_raise:
                self.warnings_to_raise.append(warn2add)

        try:
            self._add_lyr(layer, position, name, layer_index, copy_to_mds)
            self.output_layers.append(layer)
        except Exception as err:
            error_code = 100322
            if PortalUtils.is_portal_env():
                for fld in layer.fields:
                    if fld.type == "TimestampOffset":
                        error_code = 100353
                        break
            LOGGER.debug(f"Failed to add {layer} due to {str(err)}.")
            LOGGER.error(error_code, extra={"message_ID": error_code})
            raise ToolExit from err

    @abstractmethod
    def _add_lyr(
        self,
        layer: PAOutputFeatureLayer,
        position: int,
        name: str = "",
        layer_index: int = 0,
        copy_to_mds: bool = True
    ):
        pass

    @abstractmethod
    def handle(self):
        pass

    @classmethod
    def generate_chart_description(cls, out_fs_json: Dict, pos_lyr_map: Dict, lyr_charts: Dict, tbl_charts: Dict) -> Dict:
        chart_desc = {}
        lyr_chrts = []
        tbl_chrts = []
        for layer in out_fs_json.get("layers", []):
            position = layer.get("position")
            lyr_idx = pos_lyr_map[position]

            if lyr_idx in lyr_charts:
                charts = lyr_charts.get(lyr_idx)
                from_lyr = True
            else:
                charts = tbl_charts.get(lyr_idx)
                from_lyr = False
            if charts:
                chrts_json = []
                for chart in charts:
                    chart_json = json.loads(chart._getWebSpec())
                    for ax in chart_json.get("axes", []):
                        if "lineSymbol" not in ax:
                            ax["lineSymbol"] = DEFAULT_LINE_SYMBOL
                        if "grid" not in ax:
                            ax["grid"] = DEFAULT_GRID
                    LOGGER.debug(f"{chart_json=}")
                    chrts_json.append(chart_json)
                if from_lyr:
                    lyr_chrts.append({"id": lyr_idx, "charts": chrts_json})
                else:
                    tbl_chrts.append({"id": lyr_idx, "charts": chrts_json})

        if lyr_chrts or tbl_chrts:
            chart_desc["text"] = {}
            if lyr_chrts:
                chart_desc["text"]["layers"] = lyr_chrts
            if tbl_chrts:
                chart_desc["text"]["tables"] = tbl_chrts
        return chart_desc


class PortalFSHandler(PublishHandler):

    def _add_lyr(
        self,
        layer: PAOutputFeatureLayer,
        position: int,
        name: str = "",
        layer_index: int = 0,
        copy_to_mds: bool = True
    ):
        layer_description = layer.get_publish_json(position, name, layer_index, copy_to_mds)
        self.description.append(layer_description)
        if layer.charts:
            desc = arcpy.Describe(layer.data)
            if hasattr(desc, 'featureType'):
                self.lyr_charts[layer_index] = layer.charts
            else:
                self.tbl_charts[layer_index] = layer.charts

    def handle(self):
        fs_description = {"layers": self.description}
        if self.store_description and fs_description:
            with open(os.path.join(AOLUtils.get_scratch_wkspc(False), "publishDescription.json"), "w") as outfile:
                if self.output_as_fs and self.output_name and self.output_name.json:
                    desc = deepcopy(fs_description)
                    desc["outputName"] = self.output_name.json
                else:
                    desc = fs_description
                outfile.write(json.dumps(desc))
        elif self.store_description and not fs_description:
            LOGGER.debug("No feature service publish description to save.")
        # LOGGER.debug("fs_description: {}".format(fs_description))
        out_fs_res = arcpy.gp.createFeatureService(json.dumps(self.output_json, ensure_ascii=False),  # type: ignore
                                                   json.dumps(fs_description, ensure_ascii=False))
        out_fs_json = json.loads(out_fs_res)
        # LOGGER.debug("out_fs_json: {}".format(out_fs_json))
        item = out_fs_json.get(ITEMID, "")
        # if item:
        #     LOGGER.debug(f"item info: {PortalUtils.get_item(item)}")
        for layer in out_fs_json["layers"]:
            position = layer.get("position")
            # a feature service layer is created
            if "url" in layer["output"]:
                output_content = json.dumps({"url": layer["output"]["url"],
                                             ITEMID: out_fs_json.get(ITEMID, "")})
                if self.output_name.created_item_id is None and out_fs_json.get(ITEMID):
                    self.output_name.item_created_by_server = True
                self.output_name.created_item_id = out_fs_json.get(ITEMID)
            # output as feature collection
            else:
                output_content = json.dumps(layer["output"])
            arcpy.SetParameterAsText(position, output_content)

        if self.lyr_charts or self.tbl_charts:
            chart_desc = self.generate_chart_description(out_fs_json, self.pos_lyr_map,
                                                         self.lyr_charts, self.tbl_charts)
            if self.store_description and chart_desc:
                with open(os.path.join(AOLUtils.get_scratch_wkspc(False), "chartDescription.json"), "w") as outfile:
                    outfile.write(json.dumps(chart_desc))
            if chart_desc and item:
                LOGGER.debug(PortalUtils.update_portal_item(item, chart_desc))


class CopyDataHandlerMixin:

    def copy_to_ds(
        self,
        local_path: str
    ) -> str:
        """copy analysis result in job folder to Enterprise's datastore for publishing.

        Args:
            local_path (str): the absolute path of the analysis result.

        Returns:
            str: the absolute path of the table in the datastore.
        """
        sql_server_path = PortalUtils.get_output_catalogpath(self.output_json)  # type: ignore
        LOGGER.debug(f"sql_server_path: {sql_server_path}")
        copy_res = arcpy.gp._arc_object.SimpleCopy(local_path, sql_server_path)
        if "FAILED" in copy_res:
            LOGGER.debug(f"Failed to copy {local_path} to {sql_server_path}")
            raise ToolExit
        LOGGER.debug("Copy successfully...")
        return sql_server_path

    def _delete_connection_file(self):
        """Delete the connection file in the job folder"""
        folder = AOLUtils.get_scratch_wkspc(False)
        for file in os.listdir(folder):
            if file.endswith(".sde"):
                try:
                    os.remove(os.path.join(folder, file))
                except OSError:
                    LOGGER.debug("Unable to remove the connection file")


class FieldUpdateMixin:

    def _get_changed_field_names(
        self,
        lookup_fields: List,
        ds_path: str
    ) -> Dict:
        """Get a map of the field names changed after copying to the table of the data store.

        Args:
            lookup_fields (Dict): a dictionary of the publishing properties derived from the local result (i.e.,
            [{"alias": "OBJECTID","name": "objectid"}...])
            ds_path (str): absolute path of the table in the datastore.

        Returns:
            Dict: a dictionary keyed by the field name in the local result and valued by the mapped field name in
            the table of the data store.
        """
        ds_fields = {f.name.lower(): f.name for f in AOLUtils.list_fields(ds_path)}  # type: ignore
        local_field_names = {f["name"].lower(): f["name"] for f in lookup_fields}
        changed_field_names = {}
        for dsf in ds_fields:
            if dsf in local_field_names:
                if ds_fields[dsf] != local_field_names[dsf]:
                    changed_field_names[local_field_names[dsf]] = ds_fields[dsf]
        LOGGER.debug(f"changed_field_names: {changed_field_names}")
        return changed_field_names

    def _get_cfnames_hgp(
        self,
        lookup_fields: List,
        ds_fnames: List
    ) -> Dict:
        """Get a map of the field names changed based on hostedgp simplecopy approach.

        Args:
            lookup_fields (Dict): a dictionary of the publishing properties derived
            from the local result (i.e., [{"alias": "OBJECTID","name": "objectid"}...])
            ds_path (str): absolute path of the table in the datastore.

        Returns:
            Dict: a dictionary keyed by the field name in the local result and
            valued by the mapped field name in the table of the data store.
        """
        ds_fields = {}
        for fname in ds_fnames:
            if "." in fname:
                fname = fname.split(".")[-1]
            ds_fields[fname.lower()] = fname
        local_field_names = {f["name"].lower(): f["name"] for f in lookup_fields}
        changed_field_names = {}
        for dsf in ds_fields:
            if dsf in local_field_names:
                if ds_fields[dsf] != local_field_names[dsf]:
                    changed_field_names[local_field_names[dsf]] = ds_fields[dsf]
        LOGGER.debug(f"changed_field_names: {changed_field_names}")
        return changed_field_names

    def _update_popup(
        self,
        properties: Dict,
        changed_field_names: Dict
    ):
        """Update the fieldName in the popup.

        Args:
            properties (Dict): a json with the properties of the output layer.
            changed_field_names (Dict): a dictionary keyed by the name in the local data and valued by
            the name of the field in the datastore.
        """
        field_names = [f["name"] for f in properties.get("alias", [])]
        fields_to_remove = []
        if "popupInfo" in properties:
            field_infos = properties["popupInfo"].get("fieldInfos")
            if field_infos:
                for finfo in field_infos:
                    if finfo.get("fieldName") not in field_names and not finfo.get("fieldName").startswith("relationships/"):
                        fields_to_remove.append(finfo)
                    elif finfo.get("fieldName") in changed_field_names:
                        finfo["fieldName"] = changed_field_names[finfo["fieldName"]]

            for frmv in fields_to_remove:
                field_infos.remove(frmv)

    def _update_rel_popup(
        self,
        properties: Dict,
        changed_field_names: Dict,
        rel_table_id: int
    ):
        """Update the relationship popup.

        Args:
            properties (Dict): a json with the properties of the output layer.
            changed_field_names (Dict): a dictionary keyed by the name in the local data and valued by
            the name of the field in the datastore.
            rel_table_id (int): id of the relationship table.
        """
        if "popupInfo" in properties:
            pattern = f"relationships/{rel_table_id}/"
            field_infos = properties["popupInfo"].get("fieldInfos", [])
            for finfo in field_infos:
                if finfo.get("fieldName", "").startswith(pattern):
                    curr_fn = finfo["fieldName"][len(pattern)::]
                    if curr_fn in changed_field_names:
                        finfo["fieldName"] = f"{pattern}{changed_field_names[curr_fn]}"
                        # LOGGER.debug(f"{curr_fn} has been updated to {changed_field_names[curr_fn]} in the relpopup.")
            media_infos = properties["popupInfo"].get("mediaInfos", [])
            for minfo in media_infos:
                value_fields = minfo.get("value", {}).get("fields", [])
                for i, vfield in enumerate(value_fields):
                    if vfield.startswith(pattern):
                        curr_fn = vfield[len(pattern)::]
                        if curr_fn in changed_field_names:
                            vfield = f"{pattern}{changed_field_names[curr_fn]}"
                            value_fields[i] = vfield
                tool_tip_field = minfo.get("value", {}).get("tooltipField", "")
                if tool_tip_field.startswith(pattern):
                    curr_fn = tool_tip_field[len(pattern)::]
                    if curr_fn in changed_field_names:
                        tool_tip_field = f"{pattern}{changed_field_names[curr_fn]}"
                norm_field = minfo.get("value", {}).get("normalizeField", "")
                if norm_field.startswith(pattern):
                    curr_fn = norm_field[len(pattern)::]
                    if curr_fn in changed_field_names:
                        norm_field = f"{pattern}{changed_field_names[curr_fn]}"

    def _update_relationships(
        self,
        properties: Dict,
        changed_field_names: Dict,
        ds_path: Optional[str] = None
    ):
        """Update the relationship in the output layer properties.

        Args:
            properties (Dict):  a json with the properties of the output layer.
            changed_field_names (Dict): a dictionary keyed by the name in the local data and valued by
            the name of the field in the datastore.
            ds_path (str): absolute path of the table in datastore.
        """
        if "relationships" in properties:
            for relation in properties["relationships"]:
                # Check if the keyField changed
                key_field = relation.get("keyField")
                if key_field in changed_field_names:
                    relation["keyField"] = changed_field_names[key_field]
                    # LOGGER.debug(f"keyField changed from {key_field} to {changed_field_names[key_field]}")
                related_table_id = relation.get("relatedTableId")
                role = relation.get("role")
                if related_table_id < len(self.description) and role == "esriRelRoleDestination":  # type: ignore
                    rel_properties = self.description[related_table_id].get("properties")  # type: ignore
                    if rel_properties:
                        self._update_rel_popup(rel_properties, changed_field_names, related_table_id)
            if ds_path:
                self._create_uniq_index(properties["relationships"], ds_path)

    def _create_uniq_index(
        self,
        relationships: List,
        ds_path: str
    ):
        """Create unique index for the keyField.

        Args:
            relationships (List): relationships in the output layer's properties.
            ds_path (str): absolute path of the table in datastore.
        """
        indexed_fields = []
        for relationship in relationships:
            role = relationship.get("role")
            key_field = relationship.get("keyField")
            if role == "esriRelRoleOrigin" and key_field not in indexed_fields:
                index_name = "RELIDX{}".format(int(time.time()))
                arcpy.management.AddIndex(ds_path, key_field, index_name, "UNIQUE", "ASCENDING")
                indexed_fields.append(key_field)
    
    def _update_lyr_desc(
        self,
        layer_description: Dict,
        layer: PAOutputFeatureLayer
    ) -> Optional[Dict]:
        """Update the publish description of the layer.

        Args:
            layer_description (Dict): description of a layer in publishing.
            layer (PAOutputFeatureLayer): a layer to publish.

        Returns:
            Optional[Dict]: a dictionary mapps the field name in local copy
            with the field name in published data source.
        """
        properties = layer_description.get("properties")
        if properties:
            idx_field = None
            idx_name = None
            for relship in properties.get("relationships", []):
                role = relship.get("role")
                key_field = relship.get("keyField")
                if role == "esriRelRoleOrigin":
                    idx_name = f"RELIDX{int(time.time())}"
                    idx_field = key_field
                    break
            LOGGER.debug(f"index_field: {idx_field} and index_name: {idx_name}")
            """ create the attribute index on the local copy if the
            data stores in scratchGDB since: 1) the simple copy can copy
            over the index; and 2) AddIndex does not support in_memory
            and memory workspace. """
            if (
                idx_field
                and isinstance(layer.data, str)
                and not layer.data.startswith("memory")
                and not layer.data.startswith("in_memory")
            ):
                arcpy.management.AddIndex(layer.data, [idx_field], idx_name,
                                            True, True)
                idx_field = None
                idx_name = None
            ds_output = PortalUtils.copy_data_to_sds(layer.data, None, idx_field,
                                                        idx_name, True, True)
            LOGGER.debug(f"copy ds_output: {ds_output}")
            tbl_name = ds_output["outputTableName"]
            if "." in tbl_name:
                tbl_name = tbl_name.split(".")[-1]
            LOGGER.debug(f"Truncate ds_path to {tbl_name}")
            field_alias = properties.get("alias", [])
            changed_field_names = self._get_cfnames_hgp(field_alias,
                                                        ds_output["fiedlNames"])
            if changed_field_names:
                self._update_popup(properties, changed_field_names)
                self._update_relationships(properties, changed_field_names,
                                            None)
            layer_description["catalogPath"] = tbl_name
            return changed_field_names
        return None

    def _attr_exist(self, obj: Any, prop: str) -> bool:
        """Check if a certain attribute exists. This function is used to avoid strange exception raised from hasattr function."""
        try:
            has_attr = hasattr(obj, prop)
            return has_attr
        except:
            return False
    
    def _update_chart_field(self, field_prop: Any, prop_name: str, changed_field_names: Dict[str, str]):
        """Update the field inside of the chart object."""
        try:
            field_name: str = getattr(field_prop, prop_name)
        except AttributeError:
            return
        if field_name in changed_field_names:
            LOGGER.debug(f"{prop_name} changed to {changed_field_names[field_name]}")
            setattr(field_prop, prop_name, changed_field_names[field_name])

    def _update_chart_prop(
        self,
        layer: PAOutputFeatureLayer,
        changed_field_names: Optional[Dict]
    ) -> List:
        """Update the chart properties if any of the field names changed."""
        charts = layer.charts
        if changed_field_names:
            for cht in charts:
                if self._attr_exist(cht, "xAxis") and self._attr_exist(cht.xAxis, "field"):
                    self._update_chart_field(cht.xAxis, "field", changed_field_names)
                if self._attr_exist(cht, "yAxis") and self._attr_exist(cht.yAxis, "field"):
                    self._update_chart_field(cht.yAxis, "field", changed_field_names)
                if self._attr_exist(cht, "line") and self._attr_exist(cht.line, "splitCategory"):
                    self._update_chart_field(cht.line, "splitCategory", changed_field_names)
        return charts


class WrapFCMixin:
    def wrap_fc(self, layer: PAOutputFeatureLayer, position: int):
        try:
            if layer.drawing_info:
                tmp_fs = arcpy.FeatureSet()
                if isinstance(layer.drawing_info, str):
                    drawing = layer.drawing_info
                elif isinstance(layer.drawing_info, dict):
                    drawing = json.dumps(layer.drawing_info, ensure_ascii=False)
                else:
                    LOGGER.debug(f"Invalid drawing_info with type of {type(layer.drawing_info)}.")
                    raise ToolExit
                tmp_fs.load(layer.data, None, None, drawing, True)
                self.layers_to_publish[position] = tmp_fs  # type: ignore
            else:
                self.layers_to_publish[position] = arcpy.FeatureSet(layer.data)  # type: ignore
        except (arcpy.ExecuteError, AttributeError, RuntimeError):
            try:
                self.layers_to_publish[position] = arcpy.RecordSet(layer.data)  # type: ignore
            except (arcpy.ExecuteError, AttributeError, RuntimeError) as err:
                LOGGER.debug(f"Unable to wrap {layer.data} as FeatureSet or RecordSet.")
                raise ToolExit from err


class FSECHandler(CopyDataHandlerMixin, FieldUpdateMixin, PortalFSHandler):
    """Copy the data outside of CreateFeatureService arcpy function without exposing
    .sde connection file."""

    def _add_lyr(
        self,
        layer: PAOutputFeatureLayer,
        position: int,
        name: str = "",
        layer_index: int = 0,
        copy_to_mds: bool = False
    ):
        """Add the layer for output publish.

        Args:
            layer: an instance of PAFeatureLayer.
            position: index of parameter for saving the published layer.
            name: name of the layer in the published feature service.
            layer_index: index of the layer in the published feature service.
            copy_to_mds: whether to copy the result to the managed datastore or
            not (default to True).
        Returns:
            No returns.
        Raises:
            ToolExit if layer is not an instance of PAFeatureLayer.

        """
        layer_description = layer.get_publish_json(position, name, layer_index,
                                                   copy_to_mds)
        changed_field_names = None
        if self.output_as_fs:
            changed_field_names = self._update_lyr_desc(layer_description, layer)

        if layer.charts:
            desc = arcpy.Describe(layer.data)
            charts = self._update_chart_prop(layer, changed_field_names)

            if hasattr(desc, 'featureType'):
                self.lyr_charts[layer_index] = charts
            else:
                self.tbl_charts[layer_index] = charts

        self.description.append(layer_description)


class FSGPHandler(WrapFCMixin, PublishHandler):
    """Handler of publishing output as GPFeatureRecordSet/GPRecordSet type"""

    def __init__(
        self,
        output_name: PAOutputName,
        store_description: bool = False,
        hold_off_publishing: bool = False,
        process_info: Optional[List] = None
    ):
        super(FSGPHandler, self).__init__(output_name, store_description=store_description, hold_off_publishing=hold_off_publishing)
        self.layers_to_publish = {}
        self.process_info = process_info

    def _add_lyr(
        self,
        layer: PAOutputFeatureLayer,
        position: int,
        name: str = "",
        layer_index: int = 0,
        copy_to_mds: bool = True
    ):
        if (self.output_as_fs or self.store_description) and layer.charts:
            desc = arcpy.Describe(layer.data)
            if hasattr(desc, "featureType"):
                self.lyr_charts[layer_index] = layer.charts
            else:
                self.tbl_charts[layer_index] = layer.charts

        if self.output_as_fs:
            layer_description = layer.get_publish_json(position, name, layer_index,
                                                       copy_to_mds)
            self.description.append(layer_description)
            self.layers_to_publish[position] = layer.data
        else:
            if self.store_description:
                self.description.append(layer.get_publish_json(position, name, layer_index,
                                                               copy_to_mds))

            if self.output_name.environment == PAEnvironment.MODELBUILDER:
                self.layers_to_publish[position] = layer.data
            else:
                self.wrap_fc(layer, position)

    def handle(self):
        fs_description = {"layers": self.description}
        if self.output_as_fs and not self.hold_off_publishing:
            out_fs_res = arcpy.gp.createFeatureService(json.dumps(self.output_json),  # type: ignore
                                                       json.dumps(fs_description))
            out_fs_json = json.loads(out_fs_res)
            if self.output_name.created_item_id is None and out_fs_json.get(ITEMID):
                self.output_name.item_created_by_server = True
            self.output_name.created_item_id = out_fs_json.get(ITEMID)
            for layer in out_fs_json["layers"]:
                position = layer.get("position")
                arcpy.SetParameter(position, layer["output"]["url"])
            if self.lyr_charts or self.tbl_charts:
                chart_desc = self.generate_chart_description(out_fs_json, self.pos_lyr_map,
                                                             self.lyr_charts, self.tbl_charts)
                if self.store_description and chart_desc:
                    cht_desc_path = os.path.join(AOLUtils.get_scratch_wkspc(False), "chartDescription.json")
                    with open(cht_desc_path, "w") as outfile:
                        LOGGER.debug(f"charts description saved at {cht_desc_path}")
                        outfile.write(json.dumps(chart_desc))
                if chart_desc and self.output_name.created_item_id:
                    LOGGER.debug(PortalUtils.update_portal_item(self.output_name.created_item_id, chart_desc))
        else:
            fake_out_fs_json = {"layers": []}
            for position in self.layers_to_publish:
                arcpy.SetParameter(position, self.layers_to_publish[position])
                fake_out_fs_json["layers"].append({"position": position})

            if self.store_description and (self.lyr_charts or self.tbl_charts):
                chart_desc = self.generate_chart_description(fake_out_fs_json, self.pos_lyr_map,
                                                             self.lyr_charts, self.tbl_charts)

                if chart_desc:
                    cht_desc_path = os.path.join(AOLUtils.get_scratch_wkspc(False), "chartDescription.json")
                    with open(cht_desc_path, "w") as outfile:
                        outfile.write(json.dumps(chart_desc))
                        LOGGER.debug(f"charts description saved at {cht_desc_path}")

        LOGGER.debug(f"{self.store_description=}")
        if self.store_description:
            out_desc_path = os.path.join(AOLUtils.get_scratch_wkspc(False), "publishDescription.json")
            with open(out_desc_path, "w") as outfile:
                if self.output_as_fs and self.output_name and self.output_name.json:
                    desc = deepcopy(fs_description)
                    desc["outputName"] = self.output_name.json
                else:
                    desc = fs_description
                if self.process_info:
                    desc["processInfo"] = self.process_info
                outfile.write(json.dumps(desc))
                LOGGER.debug(f"Publish description has been dumped to {out_desc_path}.")


class FSECGPHandler(FieldUpdateMixin, FSGPHandler):

    def _add_lyr(
        self,
        layer: PAOutputFeatureLayer,
        position: int,
        name: str = "",
        layer_index: int = 0,
        copy_to_mds: bool = False
    ):
        if (self.output_as_fs or self.store_description) and layer.charts:
            desc = arcpy.Describe(layer.data)
            if hasattr(desc, "featureType"):
                self.lyr_charts[layer_index] = layer.charts
            else:
                self.tbl_charts[layer_index] = layer.charts

        if self.output_as_fs:
            layer_description = layer.get_publish_json(position, name, layer_index, copy_to_mds)
            changed_field_names = None
            if self.output_as_fs:
                changed_field_names = self._update_lyr_desc(layer_description, layer)

            if layer.charts:
                desc = arcpy.Describe(layer.data)
                charts = self._update_chart_prop(layer, changed_field_names)

                if hasattr(desc, 'featureType'):
                    self.lyr_charts[layer_index] = charts
                else:
                    self.tbl_charts[layer_index] = charts

            self.description.append(layer_description)
        else:
            if self.store_description:
                layer_description = layer.get_publish_json(position, name, layer_index, copy_to_mds)
                self.description.append(layer_description)
            if self.output_name.environment == PAEnvironment.MODELBUILDER:
                self.layers_to_publish[position] = layer.data
            else:
                self.wrap_fc(layer, position)

#endregion
