# COPYRIGHT 2013-2024 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com
r"""The Oriented Imagery toolbox contains tools to create, manage, and
maintain oriented imagery datasets and layers."""
from __future__ import annotations

__all__ = [
    "AddImagesFromCustomInputType",
    "AddImagesToOrientedImageryDataset",
    "BuildOrientedImageryFootprint",
    "CreateOrientedImageryDataset",
    "GenerateServiceFromOrientedImageryDataset",
    "UpdateOrientedImageryDatasetProperties",
]
__alias__ = "oi"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Authoring toolset
@gptooldoc("AddImagesFromCustomInputType_oi", None)
def AddImagesFromCustomInputType(
    in_oriented_imagery_dataset=None,
    input_type: Literal["SampleInputType", "Folder"] | None = None,
    in_type_folder=None,
    in_data=None,
    auxiliary_parameters=None,
) -> Result1[str | Layer]:
    """AddImagesFromCustomInputType_oi(in_oriented_imagery_dataset, input_type, in_type_folder, in_data;in_data..., {auxiliary_parameters;auxiliary_parameters...})

       Adds images to an oriented imagery dataset from the input data defined
       by a custom input type.

    INPUTS:
     in_oriented_imagery_dataset (Oriented Imagery Layer):
         The path and name of the oriented imagery dataset where the images
         will be added.
     input_type (String):
         The name of the custom input type.If the custom input type folder is
         not in
         [InstallDirectory]\\Resources\\OrientedImagery\\CustomInputTypes, specify
         the parameter value as Folder and provide the folder path in the
         in_type_folder parameter.
     in_type_folder (Folder):
         The path to the custom input type folder. The folder must contain a
         Python module with the same name as the folder and the required public
         functions.
     in_data (Value Table):
         The name and the path or value of the input data. The selected custom
         input type determines the available options.
     auxiliary_parameters {Value Table}:
         The names and values of any auxiliary parameters defined in the input
         type schema."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddImagesFromCustomInputType_oi(
                *gp_fixargs(
                    (in_oriented_imagery_dataset, input_type, in_type_folder, in_data, auxiliary_parameters), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddImagesToOrientedImageryDataset_oi", None)
def AddImagesToOrientedImageryDataset(
    in_oriented_imagery_dataset=None,
    imagery_category=None,
    input_data=None,
    include_sub_folders: Literal["SUBFOLDERS", "NOSUBFOLDERS"] | None = None,
    folder_filter=None,
    where_clause=None,
    include_all_fields: Literal["INCLUDE_ALL_FIELDS", "NO_INCLUDE_ALL_FIELDS"] | None = None,
) -> Result1[str | Layer]:
    """AddImagesToOrientedImageryDataset_oi(in_oriented_imagery_dataset, imagery_category, input_data;input_data..., {include_sub_folders}, {folder_filter}, {where_clause}, {include_all_fields})

       Adds images to an oriented imagery dataset from multiple input
       sources, including a file, folder, table, list of image paths, or a
       point feature layer.

    INPUTS:
     in_oriented_imagery_dataset (Oriented Imagery Layer):
         The path and name of the oriented imagery dataset where the images
         will be added.
     imagery_category (String):
         Specifies the type of input images that will be used and sets the
         default properties of the oriented imagery dataset. The default
         property will be used if the equivalent attribute is not found in the
         oriented imagery dataset attribute table.Horizontal-Images in which
         the exposure is parallel to the ground and
         looking to the horizon will be used.Oblique-Images in which the
         exposure is at an angle to the ground,
         typically at about 45 degrees so sides of objects can be seen will be
         used.Nadir-Images in which the exposure is perpendicular to the ground
         and
         looking straight down will be used. Only the top of the objects can be
         seen.360-Images taken using specialized cameras that provide
         360-degree
         spherical surround views or have been stitched together as 360-degree
         views from multiple cameras will be used.Inspection-Close-up imagery
         of assets (less than 5 meters from the
         camera) will be used.
     input_data (Folder / Oriented Imagery Layer / Table / Raster Layer / File):
         The path and name of the input data. The following are
         supported:        One or more images in JPEG format.A folder
         containing images. Only
         JPEG images will be added to the
         dataset from the folder.A .txt file containing JPEG image paths. Each
         image path must be on a
         separate line.A .csv file using the oriented imagery table schema.A
         feature layer using the oriented imagery attribute table schema.An
         oriented imagery layer.
     include_sub_folders {Boolean}:
         Specifies whether subfolders will be recursively
         explored.SUBFOLDERS-All subfolders will be recursively explored for
         data. This
         is the default.NOSUBFOLDERS-Only the top-level folder will be explored
         for data.
     folder_filter {String}:
         An expression that will be used to filter and add images in the input
         folder.For example, to add only images that contain a particular
         string, add
         percentage signs before and after the string value (%value%).
     where_clause {SQL Expression}:
         An SQL expression that will be used to select a subset of records. For
         more information about SQL syntax, see SQL reference for query
         expressions used in ArcGIS.
     include_all_fields {Boolean}:
         Specifies whether all fields from input table, apart from the required
         schema, will be added to the dataset's attribute
         table.NO_INCLUDE_ALL_FIELDS-Only oriented imagery schema-specific
         fields
         will be added to the dataset's attribute table. This is the
         default.INCLUDE_ALL_FIELDS-All fields in the input table will be added
         to the
         dataset's attribute table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddImagesToOrientedImageryDataset_oi(
                *gp_fixargs(
                    (
                        in_oriented_imagery_dataset,
                        imagery_category,
                        input_data,
                        include_sub_folders,
                        folder_filter,
                        where_clause,
                        include_all_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("BuildOrientedImageryFootprint_oi", None)
def BuildOrientedImageryFootprint(
    in_oriented_imagery_dataset=None,
    out_dataset_path=None,
    out_dataset_name=None,
    footprint_option: Literal["PER_IMAGE", "MERGE", "BUFFER", "EXTENT"] | None = None,
) -> Result1[str]:
    """BuildOrientedImageryFootprint_oi(in_oriented_imagery_dataset, out_dataset_path, out_dataset_name, footprint_option)

       Builds a footprint feature class for an oriented imagery dataset.

    INPUTS:
     in_oriented_imagery_dataset (Oriented Imagery Layer):
         The oriented imagery dataset for which the footprint will be computed.
     out_dataset_path (Workspace / Feature Dataset):
         The enterprise or file geodatabase where the output footprint feature
         class will be created.
     out_dataset_name (String):
         The name of the output footprint feature class.
     footprint_option (String):
         Specifies the method that will be used to create the
         footprint.PER_IMAGE-Polygon features will be created from each feature
         based on
         camera parameters. Use this option when there are only a few feature
         points and they are scattered over a large projected
         area.MERGE-Individual polygons will be computed and merged into a
         single
         polygon feature that is a more optimized footprint for the
         dataset.BUFFER-Each feature point will be buffered using the average
         far
         distance value of the oriented imagery dataset and merged to a single
         polygon feature. Use this option for street view imagery.EXTENT-A
         footprint will be created based on the extent of the oriented
         imagery dataset. Use this option when there are many camera points
         within a small area."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BuildOrientedImageryFootprint_oi(
                *gp_fixargs((in_oriented_imagery_dataset, out_dataset_path, out_dataset_name, footprint_option), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateOrientedImageryDataset_oi", None)
def CreateOrientedImageryDataset(
    out_dataset_path=None,
    out_dataset_name=None,
    spatial_reference=None,
    elevation_source: Literal["DEM", "CONSTANT_ELEVATION"] | None = None,
    constant_elevation=None,
    dem=None,
    lod=None,
    raster_function=None,
    template=None,
    out_dataset_alias=None,
    config_keyword=None,
    has_z: Literal["ENABLED", "DISABLED"] | None = None,
) -> Result1[str | Layer]:
    """CreateOrientedImageryDataset_oi(out_dataset_path, out_dataset_name, spatial_reference, {elevation_source}, {constant_elevation}, {dem}, {lod}, {raster_function}, {template;template...}, {out_dataset_alias}, {config_keyword}, {has_z})

       Creates an empty oriented imagery dataset in a geodatabase.

    INPUTS:
     out_dataset_path (Workspace / Feature Dataset):
         The geodatabase in which the output oriented imagery dataset will be
         created. This workspace must already exist.
     out_dataset_name (String):
         The name of the oriented imagery dataset that will be created.
     spatial_reference (Spatial Reference):
         The spatial reference of the output oriented imagery dataset.
     elevation_source {String}:
         Specifies the elevation source for the dataset.DEM-The elevation
         source will be a digital elevation model that is a
         dynamic image service or a tile image service.CONSTANT_ELEVATION-The
         elevation source will be a constant ground
         elevation value for the entire dataset.
     constant_elevation {Double}:
         The constant ground elevation value (in meters) for the entire
         dataset.This parameter is enabled when the elevation_source parameter
         value is
         specified as CONSTANT_ELEVATION.
     dem {Image Service}:
         The name of the input digital elevation model. A dynamic image service
         or a tile image service can be used as the digital elevation
         model.This parameter is enabled when the elevation_source parameter
         value is
         specified as DEM.
     lod {String}:
         The scale in a tiling schema. The scale represents the zoom level
         value. Each successive level improves resolution and map scale by
         double when compared to the previous level.This parameter is enabled
         when the dem parameter value is a tile image
         service.
     raster_function {String}:
         The raster function processing template that will be applied to the
         image service.This parameter is enabled when the dem parameter value
         is a dynamic
         image service.
     template {Table View}:
         The oriented imagery dataset or table that will be used as a template
         to define the attribute fields of the new oriented imagery dataset.
     out_dataset_alias {String}:
         The alternate name for the oriented imagery dataset that will be
         created.
     config_keyword {String}:
         The configuration keyword for the data. This parameter applies to
         enterprise data only. It determines the storage parameters of the
         database table.
     has_z {String}:
         Specifies whether the output oriented imagery dataset will have
         elevation values (z-values).DISABLED-The output oriented imagery
         dataset will not have z-values.
         This is the defaultENABLED-The output oriented imagery dataset will
         have z-values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateOrientedImageryDataset_oi(
                *gp_fixargs(
                    (
                        out_dataset_path,
                        out_dataset_name,
                        spatial_reference,
                        elevation_source,
                        constant_elevation,
                        dem,
                        lod,
                        raster_function,
                        template,
                        out_dataset_alias,
                        config_keyword,
                        has_z,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Manage toolset
@gptooldoc("GenerateServiceFromOrientedImageryDataset_oi", None)
def GenerateServiceFromOrientedImageryDataset(
    in_oriented_imagery_dataset=None,
    service_name=None,
    portal_folder=None,
    share_with: Literal["PRIVATE", "ORGANIZATION", "PUBLIC"] | None = None,
    add_footprint: Literal["FOOTPRINT", "NO_FOOTPRINT"] | None = None,
    attach_images: Literal["ATTACH", "NO_ATTACH"] | None = None,
    tags=None,
    summary=None,
) -> Result1[str]:
    """GenerateServiceFromOrientedImageryDataset_oi(in_oriented_imagery_dataset, service_name, {portal_folder}, {share_with}, {add_footprint}, {attach_images}, {tags}, {summary})

       Generates a hosted feature service with an oriented imagery layer from
       an input oriented imagery dataset.

    INPUTS:
     in_oriented_imagery_dataset (Oriented Imagery Layer):
         The input oriented imagery dataset from which the hosted feature
         service will be created.
     service_name (String):
         The name of the output feature service that will be created.
     portal_folder {String}:
         The folder in the ArcGIS Online or ArcGIS Enterprise portal where the
         service will be added.
     share_with {String}:
         Specifies the sharing level of the output service item.PRIVATE-Only
         the owner of the item will have access. This is the
         default.ORGANIZATION-All members of your organization will have
         accessPUBLIC-People outside your organization will have access
     add_footprint {Boolean}:
         Specifies whether the footprint layer will be added to the output
         service. FOOTPRINT-The feature class defined in theproperty of
         the
         dataset will be added to the service as a sublayer. This is the
         default. Footprint ItemNO_FOOTPRINT-The footprint layer will
         not be added to the service.
     attach_images {Boolean}:
         Specifies whether images will be added as attachments to the output
         service. Images can only be added as attachments when the images are
         on local disk or network storage. ATTACH-The images referenced
         in thefield of the oriented
         imagery dataset will be added to the service as attachments.
         ImagePathNO_ATTACH-The images will not be added to the service as
         attachments.
         This is the default.
     tags {String}:
         The service item tags separated by commas.
     summary {String}:
         A summary of the service item"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateServiceFromOrientedImageryDataset_oi(
                *gp_fixargs(
                    (
                        in_oriented_imagery_dataset,
                        service_name,
                        portal_folder,
                        share_with,
                        add_footprint,
                        attach_images,
                        tags,
                        summary,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateOrientedImageryDatasetProperties_oi", None)
def UpdateOrientedImageryDatasetProperties(
    in_oriented_imagery_dataset=None,
    maximum_distance=None,
    coverage_percent=None,
    footprint_item=None,
    elevation_source: Literal["DEM", "CONSTANT_ELEVATION", "NONE"] | None = None,
    constant_elevation=None,
    dem=None,
    lod=None,
    raster_function=None,
    vertical_measurement_unit: Literal["METER", "FEET"] | None = None,
    time_interval_unit: Literal["MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"] | None = None,
    oriented_imagery_type: Literal["HORIZONTAL", "OBLIQUE", "NADIR", "360", "INSPECTION", "NONE"] | None = None,
    camera_heading=None,
    camera_pitch=None,
    camera_roll=None,
    camera_height=None,
    hfov=None,
    vfov=None,
    near_distance=None,
    far_distance=None,
    image_rotation=None,
    orientation_accuracy=None,
    image_path_prefix=None,
    image_path_suffix=None,
    depth_image_path_prefix=None,
    depth_image_path_suffix=None,
    dem_path_prefix=None,
    dem_path_suffix=None,
) -> Result1[str | Layer]:
    """UpdateOrientedImageryDatasetProperties_oi(in_oriented_imagery_dataset, {maximum_distance}, {coverage_percent}, {footprint_item}, {elevation_source}, {constant_elevation}, {dem}, {lod}, {raster_function}, {vertical_measurement_unit}, {time_interval_unit}, {oriented_imagery_type}, {camera_heading}, {camera_pitch}, {camera_roll}, {camera_height}, {hfov}, {vfov}, {near_distance}, {far_distance}, {image_rotation}, {orientation_accuracy}, {image_path_prefix}, {image_path_suffix}, {depth_image_path_prefix}, {depth_image_path_suffix}, {dem_path_prefix}, {dem_path_suffix})

       Updates or modifies oriented imagery dataset properties.

    INPUTS:
     in_oriented_imagery_dataset (Oriented Imagery Layer):
         The path and name of the oriented imagery dataset.
     maximum_distance {Double}:
         The maximum search distance that will be used when querying the
         dataset features. The maximum distance cannot be less than zero. The
         unit is meters.
     coverage_percent {Double}:
         A percentage that modifies the extent of the image's ground footprint.
         The ground footprint of each image is computed to search for images
         that contain the selected location, which is identified as a red cross
         on the map.A negative percentage value reduces the size of the ground
         footprint
         and a positive percentage value increases it. This parameter can be
         used to exclude or include points on the edge of an image. For
         example, a value of -30 will reduce the size of the footprint by 30
         percent and a value of 20 will increase it by 20 percent. Valid values
         range from -50 to 50.
     footprint_item {String}:
         The name of the footprint feature class. The feature class should be
         in the same geodatabase as the oriented imagery dataset.
     elevation_source {String}:
         Specifies the elevation source that will be used.DEM-The elevation
         source will be a digital elevation model that is a
         dynamic image service or a tile image service.CONSTANT_ELEVATION-The
         elevation source will be a constant ground
         elevation value for the entire dataset.NONE-The elevation source will
         be removed.
     constant_elevation {Double}:
         The constant ground elevation value for the entire dataset. The
         vertical_measurement_unit parameter value will be used as the unit for
         constant elevation.This parameter is enabled when the elevation_source
         parameter value is
         specified as CONSTANT_ELEVATION.
     dem {Image Service}:
         The URL that references the input digital elevation model. A dynamic
         image service or a tile image service can be used as the digital
         elevation model.This parameter is enabled when the elevation_source
         parameter value is
         specified as DEM.
     lod {String}:
         The scale defined in a tiling schema. The scale represents the zoom
         level value. Each successive level improves resolution and map scale
         by double when compared to the previous level.This parameter is
         enabled when the dem parameter value is a tile image
         service.
     raster_function {String}:
         The raster function processing template that will be applied to the
         image service.This parameter is enabled when the dem parameter value
         is a dynamic
         image service.
     vertical_measurement_unit {String}:
         Specifies the unit that will be used for all vertical
         measurements.METER-Meters will be used as the unit of
         measurement.FEET-Feet will be
         used as the unit of measurement.
     time_interval_unit {String}:
         Specifies the time measurement unit that will be used to filter
         images.MINUTES-Images will be filtered by minutes.HOURS-Images will
         be
         filtered by hours.DAYS-Images will be filtered by days.WEEKS-Images
         will be filtered by weeks.MONTHS-Images will be filtered by
         months.YEARS-Images will be filtered by years.
     oriented_imagery_type {String}:
         Specifies the type of images in the dataset.HORIZONTAL-Images in
         which the exposure is parallel to the ground and
         looking to the horizon are in the dataset.OBLIQUE-Images in which the
         exposure is at an angle to the ground,
         typically at about 45 degrees, so the sides of objects can be seen are
         in the dataset.NADIR-Images in which the exposure is perpendicular to
         the ground and
         looking straight down are in the dataset. Only the top of objects can
         be seen.360-Images taken using cameras that provide 360-degree
         spherical
         surround views or have been stitched together as 360-degree views from
         multiple cameras are in the dataset.INSPECTION-Close-up images of
         assets are in the dataset.NONE-The oriented imagery type will be
         removed from the dataset.
     camera_heading {Double}:
         The camera orientation of the first rotation around the z-axis of the
         camera. The value is in degrees. The heading values are measured in
         the positive clockwise direction in which north is defined as 0
         degrees. -999 is used when the orientation is unknown.
     camera_pitch {Double}:
         The camera orientation of the second rotation around the x-axis of the
         camera in the positive counterclockwise direction. The value is in
         degrees. The pitch is 0 degrees when the camera is facing straight
         down to the ground. The valid range of pitch is from 0 to 180 degrees,
         with 180 degrees for a camera facing straight up and 90 degrees for a
         camera facing the horizon.
     camera_roll {Double}:
         The camera orientation of the final rotation around the z-axis of the
         camera in the positive clockwise direction. The value is in degrees.
         Valid values range from -90 to 90.
     camera_height {Double}:
         The height of the camera above the ground when the imagery was
         captured. The unit is meters. Camera height is used to determine the
         visible extent of the image. Large values will result in a greater
         view extent. Values should not be less than 0.
     hfov {Double}:
         The camera's scope in the horizontal direction. The value is in
         degrees. Valid values range from 0 to 360.
     vfov {Double}:
         The camera's scope in the vertical direction. The value is in degrees.
         Valid values range from 0 to 180.
     near_distance {Double}:
         The nearest usable distance of the imagery from the camera position.
         The unit is meters.
     far_distance {Double}:
         The farthest usable distance of the imagery from the camera position.
         The unit is meters. Far distances should be greater than 0.
     image_rotation {Double}:
         The orientation of the camera in degrees relative to the scene when
         the image was captured. The rotation is added in addition to the
         camera roll. Valid values range from-360 to 360.
     orientation_accuracy {String}:
         The standard deviation in accuracy values separated by
         semicolons. The standard deviation values are added in the following
         order and format:        Camera location in XY direction in
         metersCamera Height in metersCamera
         Heading in degreesCamera Pitch in degreesCamera Roll in degreesNear
         distance in metersFar distance in metersElevation in metersFor
         example, if the GPS has a +/- 10 meters RMS in x,y-coordinates and
         +/- 20 meters in height, the orientation accuracy value is 10;20.
     image_path_prefix {String}:
         The prefix that will be used to build the image path in
         conjunction with theattribute. Image
     image_path_suffix {String}:
         The suffix that will be used to build the image path in
         conjunction with theattribute. Image
     depth_image_path_prefix {String}:
         The prefix that will be used to build the depth image path in
         conjunction with theattribute. Depth Image
     depth_image_path_suffix {String}:
         The suffix that will be used to build the depth image path in
         conjunction with theattribute. Depth Image
     dem_path_prefix {String}:
         The prefix that will be used to build the DEM path in
         conjunction with theURL in the attribute. Elevation Source
     dem_path_suffix {String}:
         The suffix that will be used to build the DEM path in
         conjunction with theURL in the attribute. Elevation Source"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateOrientedImageryDatasetProperties_oi(
                *gp_fixargs(
                    (
                        in_oriented_imagery_dataset,
                        maximum_distance,
                        coverage_percent,
                        footprint_item,
                        elevation_source,
                        constant_elevation,
                        dem,
                        lod,
                        raster_function,
                        vertical_measurement_unit,
                        time_interval_unit,
                        oriented_imagery_type,
                        camera_heading,
                        camera_pitch,
                        camera_roll,
                        camera_height,
                        hfov,
                        vfov,
                        near_distance,
                        far_distance,
                        image_rotation,
                        orientation_accuracy,
                        image_path_prefix,
                        image_path_suffix,
                        depth_image_path_prefix,
                        depth_image_path_suffix,
                        dem_path_prefix,
                        dem_path_suffix,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
