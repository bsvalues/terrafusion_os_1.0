# publish output as hosted feature service
from typing import Dict, Optional, Tuple
import json
import os

import arcpy

from common import (LogUtils, ToolExit, PAOutputFeatureLayer, SimpleRenderer,
                    PortalUtils, LogExecutionTime)

LOGGER = LogUtils.setup_logger(__name__)

__all__ = ["MBPublisher"]

MD_KEY = "metadata"
PD_KEY = "publishDescription"
CHT_KEY = "chartDescription"
L2P_KEY = "layersToPublish"
CLPATH_KEY = "catalogPath"
CPY_DS_KEY = "copyToManagedDS"
POS_KEY = "position"
DT_KEY = "dataType"
CDS_KEY = "copyToManagedDS"
ITEMID = "itemId"
OP_PARAM_KEY = "outputName"
PI_KEY = "processInfo"


class MBPublisher:

    def __init__(self, output_name: Dict, data_to_publish: Dict,
                 task_name: Optional[str]):
        """Initialize properties of model builder publisher.

        Args:
            output_name (Dict): dictionary specifies the output properties (i.e., serviceProperties,
            itemProperties...). 
            data_to_publish (List[Dict]): a ditionary specifieds the data to publish 
            {
                "metadata": {
                    "publishDescription": "...\\<jobID>\\publishDescription.json",
                    "chartDescription": "...\\<jobID>\\chartDescription.json",
                },
                "layersToPublish": [
                    {
                        "catalogPath": "...\\<jobID>\\output",
                        "layerIndex": 0
                    },
                    ...
                ]
                
            }
            tool_name (Optional[str]): name of the tool where the output is derived from.
        """
        self.output_name = output_name
        self.data_to_publish = data_to_publish
        self.task_name = task_name
        self.created_item_id = None
        self.process_info = None
    
    def create_publish_desc(self) -> Tuple[Dict, Dict]:
        """create a json with description for publishing a hosted feature service.

        Raises:
            ToolExit: exception happened in creating the publish description json.

        Returns:
            Dict: a json in the schema of {"layers": [...]} specifying the publish
            description.
        """        
        fs_desc = {}
        local_info = {}
        # if publishDescription is not provided from metadata, just add default
        # simple renderer.
        if (
            MD_KEY not in self.data_to_publish
            or PD_KEY not in self.data_to_publish[MD_KEY]
        ):
            LOGGER.debug("No predefined feature service description.")
            lyrs_to_pub = self.data_to_publish[L2P_KEY]
            lyrs_desc = []

            for i, lyr2p in enumerate(lyrs_to_pub):
                idx = lyr2p["layerIndex"] if "layerIndex" in lyr2p else i
                if CLPATH_KEY not in lyr2p:
                    LOGGER.debug("catalogPath is missing.")
                    raise ToolExit

                if arcpy.Exists(lyr2p[CLPATH_KEY]):
                    tmp_lyr = PAOutputFeatureLayer(lyr2p[CLPATH_KEY])
                    task_name = self.task_name if self.task_name is not None else ""
                    renderer = SimpleRenderer(tmp_lyr, task_name)
                    tmp_lyr.set_drawing(renderer)
                    lyrs_desc.append(tmp_lyr.get_publish_json(idx, os.path.basename(tmp_lyr.data),
                                                              idx, True))
                else:
                    LOGGER.debug(f"{lyr2p[CLPATH_KEY]} does not exist or is inaccessible.")
                    raise ToolExit
                fs_desc = {"layers": lyrs_desc}
        else:
            metadata = self.data_to_publish[MD_KEY]
            fs_desc_file = metadata[PD_KEY]
            if os.path.exists(fs_desc_file):
                with open(fs_desc_file) as fobj:
                    fs_desc = json.load(fobj)
            else:
                LOGGER.debug(f"Unable to find the description file at {fs_desc_file}.")
                raise ToolExit

            lyrs_desc = fs_desc.get("layers", [])
            LOGGER.debug(f"{self.data_to_publish=}")
            lyrs_to_pub = self.data_to_publish.get(L2P_KEY, [])
            if OP_PARAM_KEY in fs_desc:
                LOGGER.debug(f"Reset the outputName from {self.output_name} to {fs_desc[OP_PARAM_KEY]}")
                self.output_name = fs_desc[OP_PARAM_KEY]
            if PI_KEY in fs_desc:
                LOGGER.debug(f"{PI_KEY} included in publish description.")
                self.process_info = fs_desc[PI_KEY]
            if lyrs_to_pub:
                for i, lyr2p in enumerate(lyrs_to_pub):
                    idx = lyr2p["layerIndex"] if "layerIndex" in lyr2p else i
                    lyr_prop = lyrs_desc[idx]
                    pos = lyr_prop[POS_KEY]
                    if CLPATH_KEY not in lyr2p:
                        LOGGER.debug("catalogPath is missing.")
                        raise ToolExit

                    if arcpy.Exists(lyr2p[CLPATH_KEY]):
                        lyr_prop[CLPATH_KEY] = lyr2p[CLPATH_KEY]
                        # Should always copy the local data
                        if not lyr_prop[CPY_DS_KEY]:
                            lyr_prop[CPY_DS_KEY] = True
                        desc = arcpy.Describe(lyr2p[CLPATH_KEY])
                        dtype = "GPFeatureRecordSetLayer" if hasattr(desc, "featureType") else "GPRecordSet"
                        local_info[pos] = {CLPATH_KEY: lyr2p[CLPATH_KEY],
                                        DT_KEY: dtype}
                    else:
                        LOGGER.debug(f"{lyr2p[CLPATH_KEY]} does not exist or is inaccessible.")
                        raise ToolExit

                    if "name" in lyr2p:
                        lyr_prop["name"] = lyr2p["name"]
            # Peel off the information from publish description
            else:
                for linfo in lyrs_desc:
                    pos = linfo.get(POS_KEY)
                    linfo[CDS_KEY] = True
                    if not pos:
                        LOGGER.debug(f"Missing {POS_KEY} for {linfo}")
                        raise ToolExit
                    ctg_path = linfo.get(CLPATH_KEY)
                    if (
                        not ctg_path
                        or not arcpy.Exists(ctg_path)
                    ):
                        LOGGER.debug(f"{CLPATH_KEY} is missing or unable to find the {ctg_path}")
                        raise ToolExit
                    else:
                        desc = arcpy.Describe(ctg_path)
                        dtype = "GPFeatureRecordSetLayer" if hasattr(desc, "featureType") else "GPRecordSet"
                        local_info[pos] = {CLPATH_KEY: ctg_path,
                                           DT_KEY: dtype}
            
        return (fs_desc, local_info)

    def del_created_item(self):
        if self.created_item_id:
            PortalUtils.delete_portal_item(self.created_item_id, {"permanentDelete": True})
            LOGGER.debug(f"Delete {self.created_item_id} successfully.")
        else:
            LOGGER.debug("Output has not been created yet. No need to delete.")
    
    def publish(self):
        """publish local data as hosted feature service.

        Raises:
            ToolExit: Exception happened during publishing.

        """
        with LogExecutionTime("Publish", [self.del_created_item]):
            if not self.data_to_publish:
                LOGGER.debug("No data to publish.")
                raise ToolExit
            (fs_desc, local_info) = self.create_publish_desc()
            LOGGER.debug("About to publish.")
            out_fs_res = arcpy.gp.createFeatureService(json.dumps(self.output_name, ensure_ascii=False),  # type: ignore
                                                    json.dumps(fs_desc, ensure_ascii=False))
            out_fs_json = json.loads(out_fs_res)
            if "token" in out_fs_json:
                out_fs_json.pop("token")
            if "referer" in out_fs_json:
                out_fs_json.pop("referer")
            self.created_item_id = out_fs_json.get(ITEMID)
            LOGGER.debug(f"itemId of the created output: {self.created_item_id}")

            for lyr in out_fs_json.get("layers", []):
                if lyr.get(POS_KEY) in local_info:
                    lyr[CLPATH_KEY] = local_info[lyr[POS_KEY]][CLPATH_KEY]
                    lyr[DT_KEY] = local_info[lyr[POS_KEY]][DT_KEY]

            if (
                out_fs_json.get(ITEMID)
                and (self.data_to_publish.get(MD_KEY, {}).get(CHT_KEY)
                     or self.process_info)
            ):
                update_item_properties = {}
                if self.data_to_publish.get(MD_KEY, {}).get(CHT_KEY):
                    cht_desc_file = self.data_to_publish[MD_KEY][CHT_KEY]
                    if os.path.exists(cht_desc_file):
                        with open(cht_desc_file) as fobj:
                            cht_desc = json.load(fobj)
                            update_item_properties = cht_desc
                    else:
                        LOGGER.debug(f"{cht_desc_file} does not exist.")
                if self.process_info:
                    update_item_properties["description"] = json.dumps(self.process_info, ensure_ascii=False)
                if update_item_properties:
                    LOGGER.debug(PortalUtils.update_portal_item(out_fs_json[ITEMID], update_item_properties))

            return out_fs_json
