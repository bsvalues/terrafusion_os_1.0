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
r"""The Bathymetry toolbox contains tools that manage bathymetric data."""
from __future__ import annotations

__all__ = [
    "AddDataToBIS",
    "AddPointDataToBIS",
    "AnalyzeBIS",
    "BISToMosaicDataset",
    "CreateBIS",
    "ReducePointDensity",
    "RemoveDataFromBIS",
    "SmoothBathymetricTIN",
]
__alias__ = "bathymetry"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# BIS Data toolset
@gptooldoc("BISToMosaicDataset_bathymetry", None)
def BISToMosaicDataset(
    in_bis_workspace=None,
    out_mosaic=None,
    coordinate_system=None,
    in_query_file=None,
    create_overviews: Literal["CREATE_OVERVIEWS", "NO_OVERVIEWS"] | None = None,
    force_overview_tiles: Literal["FORCE_OVERVIEW_TILES", "NO_FORCE_OVERVIEW_TILES"] | None = None,
) -> Result1[str]:
    """BISToMosaicDataset_bathymetry(in_bis_workspace, out_mosaic, {coordinate_system}, {in_query_file}, {create_overviews}, {force_overview_tiles})

       Creates a mosaic dataset from a Bathymetric Information System (BIS).

    INPUTS:
     in_bis_workspace (Workspace):
         The enterprise or file geodatabase where the BIS workspace is located.
     coordinate_system {Coordinate System}:
         The coordinate system that will be used for all items in the mosaic
         dataset.If no coordinate system is provided, WGS84 Web Mercator
         (auxiliary
         sphere) will be used by default.
     in_query_file {File}:
         The model or rule file that defines the datasets and sorting order
         that will be applied to the rasters included in the output mosaic
         dataset.Model file (*.model)-Defines the data to be exported from the
         BIS.
         Only the specified rasters will be exported to the mosaic dataset.Rule
         file (*.rule)-Defines the sorting order rules for the output
         data. All rasters in the BIS will be exported to the mosaic dataset.If
         no query file is provided, all rasters in the BIS will be exported.
     create_overviews {Boolean}:
         Specifies whether overviews for a mosaic dataset will be defined and
         generated.CREATE_OVERVIEWS-Overviews will be defined and
         generated.NO_OVERVIEWS-Overviews will not be defined or generated.
         This is the
         default.
     force_overview_tiles {Boolean}:
         Specifies whether overviews will be created at all levels or only
         above existing pyramid levels.FORCE_OVERVIEW_TILES-Overviews will be
         created at all
         levels.NO_FORCE_OVERVIEW_TILES-Overviews will only be created above
         the
         raster pyramid levels. This is the default.

    OUTPUTS:
     out_mosaic (Mosaic Dataset):
         The output mosaic dataset."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BISToMosaicDataset_bathymetry(
                *gp_fixargs(
                    (
                        in_bis_workspace,
                        out_mosaic,
                        coordinate_system,
                        in_query_file,
                        create_overviews,
                        force_overview_tiles,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# BIS Management toolset
@gptooldoc("AddDataToBIS_bathymetry", None)
def AddDataToBIS(
    target_workspace=None,
    in_data=None,
    input_types: list[
        Literal[
            "FEATURE_CLASS",
            "FEATURE_SERVICE",
            "IMAGE_SERVICE",
            "LAYER_FILE",
            "MAP_SERVICE",
            "MOSAIC_DATASET",
            "RASTER_DATASET",
            "SCENE_LAYER_PACKAGE",
            "TIN",
        ]
    ]
    | Literal[
        "FEATURE_CLASS",
        "FEATURE_SERVICE",
        "IMAGE_SERVICE",
        "LAYER_FILE",
        "MAP_SERVICE",
        "MOSAIC_DATASET",
        "RASTER_DATASET",
        "SCENE_LAYER_PACKAGE",
        "TIN",
    ]
    | str
    | None = None,
    include_subfolders: Literal["INCLUDE_SUBFOLDERS", "NOT_INCLUDE_SUBFOLDERS"] | None = None,
    footprint_type: Literal["ENVELOPE", "PRECISE_DOMAIN"] | None = None,
    vertical_units: Literal["METERS", "FEET", "FEET_US", "FATHOMS"] | None = None,
    directionality: Literal["POSITIVE_UP", "POSITIVE_DOWN"] | None = None,
    in_bag_metadata_mapping_file=None,
    update_overviews: Literal["UPDATE_OVERVIEWS", "NOT_UPDATE_OVERVIEWS"] | None = None,
) -> Result1[str]:
    """AddDataToBIS_bathymetry(target_workspace, in_data;in_data..., {input_types;input_types...}, {include_subfolders}, {footprint_type}, {vertical_units}, {directionality}, {in_bag_metadata_mapping_file}, {update_overviews})

       Registers raster and feature class data to a Bathymetric Information
       System (BIS).

    INPUTS:
     target_workspace (Workspace):
         The enterprise or file geodatabase where the BIS is located.
     in_data (Workspace / Feature Layer / Image Service / Raster Layer / Mosaic Layer / Layer File / ServerConnection / TIN Layer):
         The input workspaces, datasets, layers, or feature classes that
         contain the data that will be added to the target BIS.
     input_types {String}:
         Specifies the types of data that will be included from any workspaces
         provided in the in_data parameter. All data types are included by
         default.FEATURE_CLASS-Feature classes will be
         included.FEATURE_SERVICE-Feature
         services will be included.IMAGE_SERVICE-Image services will be
         included.LAYER_FILE-Layer files will be included.MAP_SERVICE-Map
         services will be included.MOSAIC_DATASET-Mosaic datasets will be
         included.RASTER_DATASET-Raster datasets will be
         included.SCENE_LAYER_PACKAGE-Scene layer packages will be
         included.TIN-TIN datasets will be included.
     include_subfolders {Boolean}:
         Specifies whether the contents of a workspace subfolder will be added
         to the BIS. This parameter is not applicable to file or enterprise
         geodatabases.INCLUDE_SUBFOLDERS-Valid data found in the subfolders
         will be added to
         the BIS.NOT_INCLUDE_SUBFOLDERS-Subfolder contents will not be added
         to the
         BIS. This is the default.
     footprint_type {String}:
         Specifies whether the footprint will be the full extent of the dataset
         or a precise domain representing the approximate boundary of the input
         dataset.ENVELOPE-The footprint will be the full extent of the
         dataset. This
         is the default.PRECISE_DOMAIN-The footprint will be a polygon that is
         the approximate
         boundary of the input dataset.
     vertical_units {String}:
         Specifies the vertical units that will be used for the depth
         data.METERS-The vertical units will be meters.FEET-The vertical
         units
         will be feet.FEET_US-The vertical units will be U.S. Survey
         feet.FATHOMS-The vertical units will be fathoms.
     directionality {String}:
         Specifies the directionality of the elevation data.POSITIVE_UP-The
         directionality of the elevation data will be positive
         up.POSITIVE_DOWN-The directionality of the elevation data will be
         positive down.
     in_bag_metadata_mapping_file {File}:
         The metadata mapping file that contains the XML element tree mapping
         information for Bathymetric Attributed Grid (BAG) internal metadata.
         This metadata mapping file can be used if the BisCatalog includes the
         fields listed in the BAG metadata mapping file. The mapping file is
         provided in the ArcGIS Bathymetry product data files at <installation
         location>\\ArcGIS Bathymetry\\Product
         Files\\<version>\\bag_metadata_mapping.txt. The tool will automatically
         populate this location; however, the parameter value can be edited if
         the file has been installed in a different location. If the BAG
         metadata mapping file is used, internal BAG metadata will be extracted
         from input BAGs and the values will be populated in the BisCatalog.
     update_overviews {Boolean}:
         Specifies whether overviews and statistics for a mosaic dataset will
         be calculated and updated.UPDATE_OVERVIEWS-Overviews and statistics
         will be calculated and
         updated. This is the default.NOT_UPDATE_OVERVIEWS-Overviews and
         statistics will not be calculated
         and updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddDataToBIS_bathymetry(
                *gp_fixargs(
                    (
                        target_workspace,
                        in_data,
                        input_types,
                        include_subfolders,
                        footprint_type,
                        vertical_units,
                        directionality,
                        in_bag_metadata_mapping_file,
                        update_overviews,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddPointDataToBIS_bathymetry", None)
def AddPointDataToBIS(
    target_workspace=None,
    in_data=None,
    vertical_units: Literal["METERS", "FEET", "FEET_US", "FATHOMS"] | None = None,
    directionality: Literal["POSITIVE_UP", "POSITIVE_DOWN"] | None = None,
    depth_field=None,
    footprint_type: Literal["ENVELOPE", "CONVEX_HULL", "PRECISE_DOMAIN"] | None = None,
    cell_size=None,
    update_overviews: Literal["UPDATE_OVERVIEWS", "NOT_UPDATE_OVERVIEWS"] | None = None,
) -> Result1[str]:
    """AddPointDataToBIS_bathymetry(target_workspace, in_data;in_data..., vertical_units, directionality, {depth_field}, {footprint_type}, {cell_size}, {update_overviews})

       Registers point cloud or elevation point data to a Bathymetric
       Information System (BIS).

    INPUTS:
     target_workspace (Workspace):
         The enterprise or file geodatabase where the BIS is located.
     in_data (LAS Dataset Layer / Feature Layer):
         The input LAS, LASD, point feature class (z-enabled and not
         z-enabled), shapefile, or multipoint features that will be added to
         the target workspace.
     vertical_units (String):
         Specifies the vertical units that will be used for the depth
         data.METERS-The vertical units will be meters.FEET-The vertical
         units
         will be feet.FEET_US-The vertical units will be U.S. Survey
         feet.FATHOMS-The vertical units will be fathoms.
     directionality (String):
         Specifies the directionality of the elevation data.POSITIVE_UP-The
         directionality of the elevation data will be positive
         up.POSITIVE_DOWN-The directionality of the elevation data will be
         positive down.
     depth_field {String}:
         The field where the depth is stored. It is either a numeric field or
         the shape field specified in the in_data parameter value.
     footprint_type {String}:
         Specifies whether the footprint will be the full extent of the
         dataset, a convex hull representing the minimum bounding box for all
         features, or a precise domain representing the approximate boundary of
         the input dataset.ENVELOPE-The footprint will be the full extent of
         the dataset. This
         is the default.CONVEX_HULL-The footprint will be a convex polygon
         representing the
         minimum bounding box for all features.PRECISE_DOMAIN-The footprint
         will be a polygon that is the approximate
         boundary of the input dataset.
     cell_size {Double}:
         The cell size of the proxy raster. The horizontal unit is the same as
         that of the input datasets.If no cell size is specified, additional
         rules will be used to
         calculate it from the other inputs.
     update_overviews {Boolean}:
         Specifies whether overviews and statistics for a mosaic dataset will
         be calculated and updated.UPDATE_OVERVIEWS-Overviews and statistics
         will be calculated and
         updated. This is the default.NOT_UPDATE_OVERVIEWS-Overviews and
         statistics will not be calculated
         and updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddPointDataToBIS_bathymetry(
                *gp_fixargs(
                    (
                        target_workspace,
                        in_data,
                        vertical_units,
                        directionality,
                        depth_field,
                        footprint_type,
                        cell_size,
                        update_overviews,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AnalyzeBIS_bathymetry", None)
def AnalyzeBIS(
    in_bis=None,
    bis_checks: list[
        Literal["BIS_STRUCTURE", "BISCATALOG_LINKS", "BISBDI_LINKS", "BISCATALOG_BISBDI_SYNC", "PROXY_RASTER_CHECK"]
    ]
    | Literal["BIS_STRUCTURE", "BISCATALOG_LINKS", "BISBDI_LINKS", "BISCATALOG_BISBDI_SYNC", "PROXY_RASTER_CHECK"]
    | str
    | None = None,
    repair_operations: list[Literal["REMOVE_EXCESS_PROXY_RASTERS", "REGENERATE_BISBDI", "UPDATE_OVERVIEWS"]]
    | Literal["REMOVE_EXCESS_PROXY_RASTERS", "REGENERATE_BISBDI", "UPDATE_OVERVIEWS"]
    | str
    | None = None,
) -> Result1[str]:
    """AnalyzeBIS_bathymetry(in_bis, {bis_checks;bis_checks...}, {repair_operations;repair_operations...})

       Analyzes a Bathymetric Information System (BIS).

    INPUTS:
     in_bis (Workspace):
         The input BIS.
     bis_checks {String}:
         Specifies the checks that will be performed on the
         BIS.BIS_STRUCTURE-The structure of the BIS will be analyzed to ensure
         it
         is a valid BIS.BISCATALOG_LINKS-The BisCatalog will be analyzed for
         broken links.BISBDI_LINKS-The BisBDI will be analyzed for broken
         links.BISCATALOG_BISBDI_SYNC-The catalog dataset will be compared to
         the
         mosaic dataset to detect entries that do not
         match.PROXY_RASTER_CHECK-Proxy raster problems will be identified.
     repair_operations {String}:
         Specifies the repair operations that will be
         performed.REMOVE_EXCESS_PROXY_RASTERS-Unused proxy rasters will be
         deleted.
         REGENERATE_BISBDI-The new BisBDI will be created with the
         rasters and proxy rasters from the BisCatalog. The rasters and proxy
         rasters will be added with default values. This operation modifies the
         schema of the BIS. Any existing BisBDI must be deleted before
         performing this operation. Use the Delete Mosaic Dataset tool to
         remove the existing BisBDI and verify that the mosaic dataset was
         deleted before attempting to regenerate the BisBDI. You must
         be the owner of the database to perform this repair
         operation.UPDATE_OVERVIEWS-The overviews and statistics for the BisBDI
         mosaic
         dataset will be calculated and updated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeBIS_bathymetry(*gp_fixargs((in_bis, bis_checks, repair_operations), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateBIS_bathymetry", None)
def CreateBIS(
    in_workspace=None,
    in_template=None,
    in_proxy_raster_location=None,
    coordinate_system=None,
    config_keyword=None,
) -> Result1[str]:
    """CreateBIS_bathymetry(in_workspace, in_template, in_proxy_raster_location, {coordinate_system}, {config_keyword})

       Creates a Bathymetric Information System (BIS) in a designated
       geodatabase workspace.

    INPUTS:
     in_workspace (Workspace):
         The enterprise or file geodatabase in which the output BIS will be
         created.
     in_template (Table View):
         The schema template that will be used to define the attribute fields
         of the BIS. There are four schema templates included in the
         BisCatalog_schema_MGDB.geodatabase file: the basic BIS, Bathymetric
         Attributed Grid (BAG), S-102, and combined BAG plus S-102. The file is
         located at <installation location>\\ArcGIS\\Pro\\Resources\\Bathymetry.
     in_proxy_raster_location (Folder):
         The specified proxy raster location that will be saved to the
         BISDetails table. You must have read and write access to the proxy
         raster location. This location is used by the Add Point Data To BIS
         tool to store proxy rasters.
     coordinate_system {Coordinate System}:
         The spatial reference of the BIS workspace. If no coordinate system is
         provided, WGS84 will be used by default.
     config_keyword {String}:
         The configuration keyword applies to enterprise geodatabase data only.
         It determines the storage parameters of the database table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateBIS_bathymetry(
                *gp_fixargs(
                    (in_workspace, in_template, in_proxy_raster_location, coordinate_system, config_keyword), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveDataFromBIS_bathymetry", None)
def RemoveDataFromBIS(
    target_biscatalog=None,
    where_clause=None,
    delete_overview_images: Literal["DELETE_OVERVIEW_IMAGES", "NO_DELETE_OVERVIEW_IMAGES"] | None = None,
    update_overviews: Literal["UPDATE_OVERVIEWS", "NO_UPDATE_OVERVIEWS"] | None = None,
) -> Result2[str, str | Layer]:
    """RemoveDataFromBIS_bathymetry(target_biscatalog, {where_clause}, {delete_overview_images}, {update_overviews})

       Removes data from a Bathymetric Information System (BIS) geodatabase.

    INPUTS:
     target_biscatalog (Feature Layer):
         The catalog dataset in the BIS workspace.
     where_clause {SQL Expression}:
         An SQL expression to select the datasets that will be removed from the
         BIS.If no datasets are selected, either from the BisCatalog attributes
         table or through a definition query, a warning is generated. To delete
         all records from a BIS, specify a query that selects all datasets; for
         example, OBJECTID >= 0.
     delete_overview_images {Boolean}:
         Specifies whether the overviews associated with the selected rasters
         will be deleted.DELETE_OVERVIEW_IMAGES-The overviews will be deleted.
         This is the
         default.NO_DELETE_OVERVIEW_IMAGES-The overviews will not be deleted.
     update_overviews {Boolean}:
         Specifies whether the overviews and statistics will be
         updated.UPDATE_OVERVIEWS-The overviews and statistics for a mosaic
         dataset
         will be updated.NO_UPDATE_OVERVIEWS-The overviews and statistics for a
         mosaic dataset
         will not be updated. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveDataFromBIS_bathymetry(
                *gp_fixargs((target_biscatalog, where_clause, delete_overview_images, update_overviews), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Utilities toolset
@gptooldoc("ReducePointDensity_bathymetry", None)
def ReducePointDensity(
    in_features=None,
    out_feature_class=None,
    depth_field=None,
    depth_direction: Literal["POSITIVE_UP", "POSITIVE_DOWN"] | None = None,
    depth_bias: Literal["SHALLOW_BIASED", "DEEP_BIASED"] | None = None,
    radius_unit: Literal[
        "KILOMETERS",
        "METERS",
        "DECIMETERS",
        "CENTIMETERS",
        "MILLIMETERS",
        "NAUTICAL_MILES",
        "MILES",
        "YARDS",
        "FEET",
        "INCHES",
        "DECIMAL_DEGREES",
        "POINTS",
    ]
    | None = None,
    start_thinning_radius=None,
    end_thinning_radius=None,
    start_depth=None,
    end_depth=None,
) -> Result1[str]:
    """ReducePointDensity_bathymetry(in_features, out_feature_class, depth_field, depth_direction, depth_bias, radius_unit, start_thinning_radius, {end_thinning_radius}, {start_depth}, {end_depth})

       Thins points from a point or multipoint feature class.

    INPUTS:
     in_features (Feature Layer):
         The input point or multipoint features.
     depth_field (Field):
         The field where the depth is stored. It is either a numeric
         field or the shape field specified in in_features. For
         multipoint features, this must be the shape field.
     depth_direction (String):
         Specifies how the depth value will be captured in the depth field of
         the input features.POSITIVE_UP-Depth values will be positive above the
         surface and
         negative below the surface. This is default.POSITIVE_DOWN-Depth values
         will be positive below the surface and
         negative above the surface.
     depth_bias (String):
         Specifies the bias that will be used to select the depths to be
         retained.SHALLOW_BIASED-Shallow bias will be used for depth. This is
         default.DEEP_BIASED-Deep bias will be used for depth.
     radius_unit (String):
         Specifies the unit of measure that will be used by the
         start_thinning_radius and end_thinning_radius
         parameters.KILOMETERS-The radius unit will be kilometers.METERS-The
         radius unit
         will be meters. This is default.DECIMETERS-The radius unit will be
         decimeters.CENTIMETERS-The radius unit will be
         centimeters.MILLIMETERS-The radius unit will be
         millimeters.NAUTICAL_MILES-The radius unit will be nautical
         miles.MILES-The radius unit will be miles.YARDS-The radius unit will
         be yards.FEET-The radius unit will be feet.INCHES-The radius unit will
         be inches.DECIMAL_DEGREES-The radius unit will be decimal
         degrees.POINTS-The radius unit will be points.
     start_thinning_radius (Double):
         The beginning radius that will be used to remove or thin points
         relative to each other.
     end_thinning_radius {Double}:
         The end radius that will be used to remove or thin points relative to
         each other. The thinning radius will dynamically change as the
         algorithm progresses through the range of depth values.
     start_depth {Double}:
         The depth that will be used to begin the thinning algorithm. Depth
         values that appear before this depth based on the depth_direction
         parameter value will be ignored.
     end_depth {Double}:
         The depth that will be used to end the thinning algorithm. Depth
         values that appear after this depth based on the depth_direction
         parameter value will be ignored.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReducePointDensity_bathymetry(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        depth_field,
                        depth_direction,
                        depth_bias,
                        radius_unit,
                        start_thinning_radius,
                        end_thinning_radius,
                        start_depth,
                        end_depth,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SmoothBathymetricTIN_bathymetry", None)
def SmoothBathymetricTIN(
    in_tin=None,
    out_tin=None,
    depth_direction: Literal["POSITIVE_UP", "POSITIVE_DOWN"] | None = None,
    smoothing_iterations=None,
) -> Result1[str]:
    """SmoothBathymetricTIN_bathymetry(in_tin, out_tin, depth_direction, smoothing_iterations)

       Smooths a triangulated irregular network (TIN) dataset in a manner
       that strictly preserves a shallow bias.

    INPUTS:
     in_tin (TIN Layer):
         The input TIN that will be smoothed with a shallow bias.
     depth_direction (String):
         Specifies how the depth will be captured in the input
         TIN.POSITIVE_UP-The depth will be captured in the input TIN. This is
         default.POSITIVE_DOWN-The downward depth will be captured in the input
         TIN.
     smoothing_iterations (Long):
         The number of smoothing passes that will be performed over the TIN.

    OUTPUTS:
     out_tin (TIN):
         The output smoothed TIN."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SmoothBathymetricTIN_bathymetry(
                *gp_fixargs((in_tin, out_tin, depth_direction, smoothing_iterations), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
