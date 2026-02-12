from typing import Optional
import shutil
import arcpy
from pathlib import Path
import uuid
import errno
import os
import json
import copy
import tempfile
from arcgis.gis import GIS, Item
from arcgis.features import FeatureLayerCollection


OI_LAYER_DEF = {
    "drawingInfo": {
        "renderer": {
            "symbol": {
                "outline": {
                    "color": [0, 255, 0, 255],
                    "width": 0,
                },
                "color": [0, 255, 0, 255],
                "size": 7,
                "yoffset": 0,
                "xoffset": 0,
                "angle": 0,
                "style": "esriSMSCircle",
                "type": "esriSMS",
            },
            "type": "simple",
        },
        "scaleSymbols": True,
        "transparency": 0,
        "labelingInfo": None,
    }
}

FP_LAYER_DEF = {
    "drawingInfo": {
        "renderer": {
            "symbol": {
                "outline": {
                    "color": [56, 168, 0, 114],
                    "width": 0,
                    "style": "esriSLSSolid",
                    "type": "esriSLS",
                },
                "color": [56, 168, 0, 114],
                "style": "esriSFSSolid",
                "type": "esriSFS",
            },
            "type": "simple",
        },
        "scaleSymbols": True,
        "transparency": 0,
        "labelingInfo": None,
    }
}


class ToolError(Exception):
    """Base class for exceptions in this tool"""

    def __init__(self, message_id, *args) -> None:
        """
        Args:
            message_id (int): GP message ID
            *args: Error message arguments
        """
        self.message_id = message_id
        self.args = args


def GPMessage(message_id: int, *args) -> str:
    """
    Get the formatted message from the GP message ID and arguments.

    Args:
        message_id (int): GP message ID
        *args: Message arguments

    Returns:
        str: The formatted message
    """
    message = arcpy.GetIDMessage(message_id)
    for arg in args:
        message = message.replace("%s", str(arg), 1)
    return message


def execute() -> None:
    """
    This is the source code of the tool.
    """

    # get the input parameters
    in_oriented_imagery_dataset = arcpy.GetParameter(0)
    service_name = arcpy.GetParameterAsText(1).strip()
    portal_folder = arcpy.GetParameterAsText(2).strip()
    share_with = arcpy.GetParameterAsText(3).strip()
    add_footprint = arcpy.GetParameter(4)
    attach_images = arcpy.GetParameter(5)
    tags = arcpy.GetParameterAsText(6).strip()
    summary = arcpy.GetParameterAsText(7).strip()

    if isinstance(in_oriented_imagery_dataset, str):
        in_oriented_imagery_dataset = in_oriented_imagery_dataset.strip()

    # test schema lock
    if not arcpy.TestSchemaLock(in_oriented_imagery_dataset):
        raise ToolError(464)

    arcpy.AddIDMessage("INFORMATIVE", 1281)
    arcpy.SetProgressorLabel(GPMessage(1281))
    # get the datasets and layers
    try:
        oi_dataset, oi_layer, fp_dataset, fp_layer = _get_datasets_and_layers(
            in_oriented_imagery_dataset, add_footprint
        )
    except Exception as error:
        raise ToolError(121) from error

    # get the attachments
    try:
        attachments = _get_attachments(oi_dataset, attach_images)
    except arcpy.ExecuteError:
        raise
    except ValueError as error:
        if str(error) == "attachment required":
            raise ToolError(3893) from error
        raise ToolError(121) from error
    except FileNotFoundError as error:
        raise ToolError(1109, error.filename) from error
    except Exception as error:
        raise ToolError(121) from error

    # get the layer definitions and oriented imagery properties
    try:
        oi_layer_def, fp_layer_def = _get_layer_definition(
            add_footprint,
            oi_layer,
            fp_layer,
        )
        oi_properties = _get_oi_properties(attach_images, oi_dataset)
        dataset_wkid: int = arcpy.Describe(oi_dataset).spatialReference.factoryCode
    except Exception:
        oi_layer_def = {}
        fp_layer_def = {}
        oi_properties = {}

    # create a shareable geodatabase and share it as a service
    try:
        gdb = _create_shareable_geodatabase(attach_images, oi_dataset, fp_dataset)
        arcpy.AddIDMessage("INFORMATIVE", 3921)
        arcpy.SetProgressorLabel(GPMessage(3921))
        arcpy.SetProgressor("default")
        gis = GIS("home")
        item, published_item = _share_geodatabase(
            gis,
            gdb,
            service_name,
            portal_folder,
            share_with,
            tags,
            summary,
            wkid=dataset_wkid,
        )
    except arcpy.ExecuteError:
        raise
    except Exception as error:
        raise ToolError(1369) from error

    # set the layer definitions
    try:
        _set_layer_definitions(
            published_item,
            oi_layer_def,
            oi_properties,
            attach_images,
            fp_layer_def,
        )
    except Exception:
        pass

    # add attachments to the published oriented imagery layer
    try:
        _add_attachments(published_item, attachments)
    except Exception as error:
        item.delete()
        published_item.delete()
        raise ToolError(3924, service_name) from error

    # set the output parameter as item url
    item.delete()
    item_url = gis.url + "home/item.html?id=" + published_item.id
    arcpy.SetParameterAsText("out_service_item", item_url)


def _get_datasets_and_layers(
    param, add_footprint: bool
) -> tuple[str, object, Optional[str], object]:
    """
    Get the oriented imagery dataset, oriented imagery layer, footprint dataset, and footprint layer from the input parameter.

    Args:
        param (object): The input parameter
        add_footprint (bool): Whether to add the footprint dataset

    Returns:
        tuple[str, object, Optional[str], object]: The oriented imagery dataset, oriented imagery layer, footprint dataset, and footprint layer
    """
    oi_dataset = None
    oi_layer = None
    fp_dataset = None
    fp_layer = None
    param_desc = arcpy.Describe(param)

    if param_desc.dataType == "OrientedImageryLayer":
        oi_dataset = param_desc.catalogPath
        oi_layer = param
        if add_footprint:
            footprint_name = param_desc.extensionProperties.footprintItem
            fp_dataset = str(Path(oi_dataset).parent / footprint_name)
            active_project = arcpy.mp.ArcGISProject("CURRENT")
            active_map = active_project.activeMap
            for layer in active_map.listLayers():
                if layer.URI.endswith(f"{footprint_name.lower()}.json"):
                    fp_layer = layer
                    break
    elif param_desc.featureType == "OrientedImageryDatasetItem":
        oi_dataset = param_desc.catalogPath
        if add_footprint:
            footprint_name = param_desc.extensionProperties.footprintItem
            fp_dataset = str(Path(oi_dataset).parent / footprint_name)

    return oi_dataset, oi_layer, fp_dataset, fp_layer


def _get_attachments(oi_dataset: str, attach_images: bool) -> dict:
    """
    Analyze the input oriented imagery dataset, footprint dataset and return attachments.

    Args:
        oi_dataset (str): The oriented imagery dataset
        attach_images (bool): Whether to attach images

    Returns:
        dict: The attachments with object IDs as keys and image paths as values
    """
    attachments = {}
    oi_desc = arcpy.da.Describe(oi_dataset)
    fields = oi_desc["fields"]
    objectid_field_name = next(field.name for field in fields if field.type == "OID")
    imagepath_field_name = next(
        field.name for field in fields if field.name.lower() == "imagepath"
    )
    image_path_prefix = oi_desc["extensionProperties"]["imagePathPrefix"]
    image_path_suffix = oi_desc["extensionProperties"]["imagePathSuffix"]

    with arcpy.da.SearchCursor(
        oi_dataset, [objectid_field_name, imagepath_field_name]
    ) as cursor:
        for object_id, image_path_value in cursor:
            image_path = Path(image_path_prefix + image_path_value + image_path_suffix)
            if attach_images:
                if not image_path.exists():
                    raise FileNotFoundError(
                        errno.ENOENT, os.strerror(errno.ENOENT), image_path
                    )
                attachments[object_id] = image_path
            else:
                if image_path.exists():
                    raise ValueError("attachment required")

    return attachments


def _get_layer_definition(
    add_footprint: bool, oi_layer: object, fp_layer: object
) -> tuple[dict, dict]:
    """
    Returns the layer definition of the oriented imagery layer and the footprint layer.

    Args:
        add_footprint (bool): Whether to add the footprint layer
        oi_layer (object): The oriented imagery layer
        fp_layer (object): The footprint layer

    Returns:
        tuple[dict, dict]: The oriented imagery layer definition and the footprint layer definition
    """
    oi_layer_def = copy.deepcopy(OI_LAYER_DEF)
    fp_layer_def = None

    if oi_layer:
        pro_symbol = oi_layer.symbology.renderer.symbol
        web_symbol = oi_layer_def["drawingInfo"]["renderer"]["symbol"]
        web_symbol["angle"] = pro_symbol.angle
        web_symbol["color"] = pro_symbol.color["RGB"]
        web_symbol["color"][3] = round(pro_symbol.color["RGB"][3] * 2.55, 0)
        web_symbol["outline"]["color"] = pro_symbol.outlineColor["RGB"]
        web_symbol["outline"]["color"][3] = round(
            pro_symbol.outlineColor["RGB"][3] * 2.55, 0
        )
        web_symbol["outline"]["width"] = pro_symbol.outlineWidth
        web_symbol["size"] = pro_symbol.size

    if add_footprint:
        fp_layer_def = copy.deepcopy(FP_LAYER_DEF)
        if fp_layer:
            pro_symbol = fp_layer.symbology.renderer.symbol
            web_symbol = fp_layer_def["drawingInfo"]["renderer"]["symbol"]
            web_symbol["angle"] = pro_symbol.angle
            web_symbol["color"] = pro_symbol.color["RGB"]
            web_symbol["color"][3] = round(pro_symbol.color["RGB"][3] * 2.55, 0)
            web_symbol["outline"]["color"] = pro_symbol.outlineColor["RGB"]
            web_symbol["outline"]["color"][3] = round(
                pro_symbol.outlineColor["RGB"][3] * 2.55, 0
            )
            web_symbol["outline"]["width"] = pro_symbol.outlineWidth
            web_symbol["size"] = pro_symbol.size

    return oi_layer_def, fp_layer_def


def _get_oi_properties(attach_images: bool, oi_dataset: str) -> dict:
    """
    Get the oriented imagery properties from the oriented imagery dataset.

    Args:
        attach_images (bool): Whether to attach images
        oi_dataset (str): The oriented imagery dataset

    Returns:
        dict: The oriented imagery properties
    """
    oriented_imagery_properties = arcpy.da.Describe(oi_dataset)["extensionProperties"]
    oriented_imagery_properties.pop("footprintItem")
    elevation_source = oriented_imagery_properties["elevationSource"]
    if elevation_source == "":
        elevation_source = None
    else:
        elevation_source = json.loads(elevation_source)
    oriented_imagery_properties["elevationSource"] = elevation_source
    if attach_images:
        oriented_imagery_properties["imagePathPrefix"] = ""
        oriented_imagery_properties["imagePathSuffix"] = ""

    return oriented_imagery_properties


def _create_shareable_geodatabase(
    attach_images: bool, oi_dataset: str, fp_dataset: Optional[str] = None
) -> str:
    """
    Create a sharable file geodatabase for the oriented imagery dataset and footprint dataset.

    Args:
        oi_dataset (str): The oriented imagery dataset
        fp_dataset (Optional[str]): The footprint dataset. Defaults to None.

    Returns:
        str: The path of the zipped file geodatabase
    """
    temp_dir = Path(tempfile.gettempdir())
    shareable_gdb_name = uuid.uuid4().hex + ".gdb"
    sharable_gdb = temp_dir / shareable_gdb_name

    arcpy.management.CreateFileGDB(str(temp_dir), shareable_gdb_name)

    oi_dataset = Path(oi_dataset)
    oi_dataset_name = oi_dataset.name
    arcpy.management.Copy(str(oi_dataset), str(sharable_gdb / oi_dataset_name))

    if fp_dataset:
        fp_dataset = Path(fp_dataset)
        fp_dataset_name = fp_dataset.name
        arcpy.management.Copy(str(fp_dataset), str(sharable_gdb / fp_dataset_name))

    if attach_images:
        shareable_oi_dataset_name = oi_dataset_name.split(".")[-1]
        fields = arcpy.ListFields(str(sharable_gdb / shareable_oi_dataset_name))
        imagepath_field_name = next(
            field.name for field in fields if field.name.lower() == "imagepath"
        )
        arcpy.management.CalculateField(
            str(sharable_gdb / shareable_oi_dataset_name),
            imagepath_field_name,
            "'FA'",
            "PYTHON3",
        )
        arcpy.oi.UpdateOrientedImageryDatasetProperties(
            str(sharable_gdb / shareable_oi_dataset_name),
            image_path_prefix="None",
            image_path_suffix="None",
            footprint_item="None" if not fp_dataset else fp_dataset_name,
        )

    arcpy.management.ClearWorkspaceCache()

    zipped_gdb = shutil.make_archive(sharable_gdb, "zip", temp_dir, shareable_gdb_name)

    return zipped_gdb


def _share_geodatabase(
    gis: GIS,
    gdb: str,
    service_name: str,
    portal_folder: str,
    share_with: str,
    tags: str,
    summary: str,
    wkid: int,
) -> tuple[Item, Item]:
    """
    Share the file geodatabase as a service on the portal.

    Args:
        gis (GIS): The GIS object
        gdb (str): The path of the zipped file geodatabase
        service_name (str): The name of the service
        portal_folder (str): The portal folder
        share_with (str): The sharing level
        tags (str): The tags
        summary (str): The summary

    Returns:
        tuple[Item, Item]: The item and the published item
    """
    if portal_folder:
        gis.content.create_folder(portal_folder)

    item = gis.content.add(
        item_properties={
            "item_type": "File Geodatabase",
            "title": service_name,
            "snippet": summary,
            "tags": tags,
        },
        data=gdb,
        folder=portal_folder,
    )
    published_item = item.publish(
        publish_parameters={
            "hasStaticData": True,
            "name": service_name,
            "targetSR": {"wkid": wkid},
            "maxRecordCount": 2000,
            "layerInfo": {"capabilities": "Query"},
        }
    )
    published_item.share(
        everyone=share_with == "PUBLIC",
        org=share_with == "ORGANIZATION",
    )

    return item, published_item


def _set_layer_definitions(
    published_item: Item,
    oi_layer_def: dict,
    oi_properties: dict,
    attach_images: bool,
    fp_layer_def: Optional[dict] = None,
) -> None:
    """
    Set the layer definitions of the published layers.

    Args:
        published_item (Item): The published item
        oi_layer_def (dict): The oriented imagery layer definition
        oi_properties (dict): The oriented imagery properties
        fp_layer_def (Optional[dict]): The footprint layer definition. Defaults to None.
        attach_images (bool): Whether to attach images
    """
    if not (oi_layer_def and oi_properties):
        raise ValueError("No layer definition or oriented imagery properties")

    flc = FeatureLayerCollection.fromitem(published_item)

    oi_layer = flc.layers[0]
    if not hasattr(oi_layer.properties, "orientedImageryInfo"):
        oi_layer_def["orientedImageryInfo"] = {
            "orientedImageryProperties": oi_properties,
        }
    if attach_images:
        oi_layer_def["hasAttachments"] = True
    oi_layer.manager.update_definition(oi_layer_def)

    if fp_layer_def:
        fp_layer = flc.layers[1]
        fp_layer.manager.update_definition(fp_layer_def)


def _add_attachments(published_item: Item, attachments: dict) -> None:
    """
    Add attachments to the published oriented imagery layer

    Args:
        published_item (Item): The published item
        attachments (dict): The attachments with object IDs as keys and image paths as values
    """
    if not attachments:
        return None

    flc = FeatureLayerCollection.fromitem(published_item)
    flc.manager.update_definition({"capabilities": "Query,Uploads"})
    oi_layer = flc.layers[0]
    num_attachments = len(attachments)
    arcpy.SetProgressor("step", GPMessage(3921), 0, num_attachments, 1)

    for count, object_id in enumerate(attachments, start=1):
        try:
            oi_layer.attachments.add(object_id, attachments[object_id])
        except Exception as error:
            if "Error in deleting Item" not in str(error):
                arcpy.AddIDMessage(
                    "WARNING",
                    3919,
                    f"Object ID: {object_id}",
                    oi_layer.properties.name,
                )
        else:
            arcpy.AddIDMessage("INFORMATIVE", 3926, count, num_attachments)
        finally:
            arcpy.SetProgressorPosition(count)


if __name__ == "__main__":
    try:
        execute()
    except arcpy.ExecuteError:
        for message in range(0, arcpy.GetMessageCount()):
            if arcpy.GetSeverity(message) == 2:
                arcpy.AddReturnMessage(message)
    except ToolError as error:
        arcpy.AddIDMessage("ERROR", error.message_id, *error.args)
    except Exception:
        arcpy.AddIDMessage("ERROR", 999999)
