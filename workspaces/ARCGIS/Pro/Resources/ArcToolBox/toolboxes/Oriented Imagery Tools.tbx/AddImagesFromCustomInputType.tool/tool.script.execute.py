import sys
import re
import importlib.util
from pathlib import Path
import arcpy


TABLE_FIELDS = {
    "SRS": "TEXT",
    "ImagePath": "TEXT",
    "Name": "TEXT",
    "AcquisitionDate": "DATE",
    "CameraHeading": "DOUBLE",
    "CameraPitch": "DOUBLE",
    "CameraRoll": "DOUBLE",
    "CameraHeight": "DOUBLE",
    "HorizontalFieldOfView": "DOUBLE",
    "VerticalFieldOfView": "DOUBLE",
    "NearDistance": "DOUBLE",
    "FarDistance": "DOUBLE",
    "OrientedImageryType": "TEXT",
    "ImageRotation": "DOUBLE",
    "CameraOrientation": "TEXT",
    "Matrix": "TEXT",
    "FocalLength": "DOUBLE",
    "PrincipalX": "DOUBLE",
    "PrincipalY": "DOUBLE",
    "Radial": "TEXT",
    "Tangential": "TEXT",
    "A0": "DOUBLE",
    "A1": "DOUBLE",
    "A2": "DOUBLE",
    "B0": "DOUBLE",
    "B1": "DOUBLE",
    "B2": "DOUBLE",
}

DATASET_PROPERTIES = {
    "maximumDistance": "maximum_distance",
    "footprintItem": "footprint_item",
    "elevationSource": "elevation_source",
    "coveragePercentage": "coverage_percentage",
    "verticalMeasurementUnit": "vertical_measurement_unit",
    "timeIntervalUnit": "time_interval_unit",
    "orientedImageryType": "oriented_imagery_type",
    "cameraHeading": "camera_heading",
    "cameraPitch": "camera_pitch",
    "cameraRoll": "camera_roll",
    "cameraHeight": "camera_height",
    "horizontalFieldOfView": "hfov",
    "verticalFieldOfView": "vfov",
    "nearDistance": "near_distance",
    "farDistance": "far_distance",
    "imageRotation": "image_rotation",
    "orientationAccuracy": "orientation_accuracy",
    "imagePathPrefix": "image_path_prefix",
    "imagePathSuffix": "image_path_suffix",
    "depthImagePathPrefix": "depth_image_path_prefix",
    "depthImagePathSuffix": "depth_image_path_suffix",
    "demPathPrefix": "dem_path_prefix",
    "demPathSuffix": "dem_path_suffix",
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


def load_module(module_folder: Path) -> object:
    """
    Load module and set input_type attribute

    Args:
        module_path (Path): Path to module
    Returns:
        object: Input type object
    """
    # load module
    module_name = module_folder.stem.strip(".")
    if str(module_folder) not in sys.path:
        sys.path.insert(0, str(module_folder))
    module = importlib.import_module(module_name)
    importlib.reload(module)

    # validate module
    type_class = getattr(module, module_name)
    type_class_methods = [
        "input_data_schema",
        "auxiliary_parameters",
        "oriented_imagery_fields",
        "oriented_imagery_properties",
        "oriented_imagery_records",
    ]
    for method in type_class_methods:
        getattr(type_class, method)

    return type_class()


def parse_valuetable(valuetable: str, input_type: object) -> dict:
    """
    Parse valuetable into dictionary

    Args:
        valuetable (str): Valuetable string
        input_type (object): Input type object

    Returns:
        dict: Valuetable dictionary
    """
    valuetable_dict = {}
    if not valuetable:
        return valuetable_dict
    for row in valuetable.split(";"):
        if "'" in row:
            key, value = [item for item in re.split("'(.*?)'", row) if item.strip()]
        else:
            key, value = row.split()
        valuetable_dict[key.strip()] = value.strip() if value.strip() != "#" else None

    input_data_schema = input_type.input_data_schema()
    for key, value in valuetable_dict.items():
        if key in input_data_schema:
            validation = input_data_schema[key]
            if validation.get("required") is True and not value:
                raise ToolError(606, key)

    return valuetable_dict


def execute() -> None:
    """
    This is the source code of the tool.
    """
    # get the input parameters
    in_oriented_imagery_dataset = arcpy.GetParameter(0)
    in_type_folder = arcpy.GetParameterAsText(2).strip()
    in_data = arcpy.GetParameterAsText(3).strip()
    auxiliary_parameters = arcpy.GetParameterAsText(4).strip()

    if isinstance(in_oriented_imagery_dataset, str):
        in_oriented_imagery_dataset = in_oriented_imagery_dataset.strip()

    if not arcpy.TestSchemaLock(in_oriented_imagery_dataset):
        raise ToolError(464)

    # load the module
    in_type_folder = Path(in_type_folder)
    try:
        input_type = load_module(in_type_folder)
    except ImportError as error:
        raise ToolError(3892, error.name) from error
    except (FileNotFoundError, AttributeError) as error:
        raise ToolError(3887) from error

    # parse valuetables
    try:
        in_data = parse_valuetable(in_data, input_type)
        auxiliary_parameters = parse_valuetable(auxiliary_parameters, input_type)
    except ToolError:
        raise
    except Exception as error:
        raise ToolError(3888, "input_data_schema") from error

    try:
        # get oriented_imagery_fields
        standard_fields, additional_fields = input_type.oriented_imagery_fields(
            in_data, auxiliary_parameters
        )

        # add fields to oriented imagery dataset
        dataset_fields = arcpy.ListFields(in_oriented_imagery_dataset)
        dataset_field_names = [field.name.lower() for field in dataset_fields]
        for field in standard_fields:
            if field.lower() not in dataset_field_names and field.lower() != "shape@":
                arcpy.AddIDMessage("INFORMATIVE", 210002, field)
                arcpy.AddField_management(
                    in_oriented_imagery_dataset,
                    field,
                    field_type=TABLE_FIELDS[field],
                    field_alias=field,
                    field_length=4096,
                )

        for field in additional_fields:
            if field["field_name"] not in dataset_field_names:
                arcpy.AddIDMessage("INFORMATIVE", 210002, field["field_name"])
                arcpy.AddField_management(
                    in_oriented_imagery_dataset,
                    field["field_name"],
                    field_type=field["field_type"],
                    field_alias=field["field_name"],
                    field_length=4096,
                )
    except arcpy.ExecuteError:
        raise
    except Exception as error:
        raise ToolError(3888, "oriented_imagery_fields") from error

    # add records into oriented imagery dataset
    dataset_fields = arcpy.ListFields(in_oriented_imagery_dataset)
    dataset_srs = arcpy.Describe(in_oriented_imagery_dataset).spatialReference
    shape_field_name = arcpy.da.Describe(in_oriented_imagery_dataset)["shapeFieldName"]
    objectid_field_name = arcpy.da.Describe(in_oriented_imagery_dataset)["OIDFieldName"]

    insert_fields_names = [field.name.lower() for field in dataset_fields]
    insert_fields_names.remove(objectid_field_name.lower())
    shape_field_index = insert_fields_names.index(shape_field_name.lower())
    insert_fields_names[shape_field_index] = shape_field_name.lower() + "@"

    try:
        with arcpy.da.InsertCursor(
            in_oriented_imagery_dataset, insert_fields_names
        ) as cursor:
            for index, record in enumerate(
                input_type.oriented_imagery_records(in_data, auxiliary_parameters)
            ):
                row = []
                for field in insert_fields_names:
                    record = {k.lower(): v for k, v in record.items()}
                    cell = record.get(field)
                    if isinstance(cell, arcpy.PointGeometry):
                        cell = cell.projectAs(dataset_srs)
                    row.append(cell)
                cursor.insertRow(row)
                if index != 0 and index % 10 == 0:
                    arcpy.AddIDMessage("INFORMATIVE", 3889, index)
    except arcpy.ExecuteError:
        raise
    except Exception as error:
        raise ToolError(3888, "oriented_imagery_records") from error

    # update dataset properties
    try:
        oriented_imagery_properties = input_type.oriented_imagery_properties(
            in_data, auxiliary_parameters
        )
        dataset_properties = {
            DATASET_PROPERTIES[key]: value
            for key, value in oriented_imagery_properties.items()
        }
        arcpy.oi.UpdateOrientedImageryDatasetProperties(
            in_oriented_imagery_dataset=in_oriented_imagery_dataset,
            **dataset_properties,
        )
    except Exception:
        arcpy.AddIDMessage("WARNING", 3721)

    # set output parameter
    arcpy.SetParameter("out_oriented_imagery_dataset", in_oriented_imagery_dataset)


if __name__ == "__main__":
    try:
        execute()
    except arcpy.ExecuteError:
        for message in range(0, arcpy.GetMessageCount()):
            arcpy.AddReturnMessage(message)
    except ToolError as error:
        arcpy.AddIDMessage("ERROR", error.message_id, *error.args)
    except Exception:
        arcpy.AddIDMessage("ERROR", 999999)
