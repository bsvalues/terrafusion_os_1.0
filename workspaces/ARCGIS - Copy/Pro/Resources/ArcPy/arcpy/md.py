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
r"""The Multidimension toolbox contains tools that are used to create and
manage netCDF, GRIB, HDF, OPeNDAP, Esri's CRF, multidimensional mosaic
datasets, and multidimensional image services. You can use these tools
to generate multidimensional metadata; create a multidimensional
raster or feature layer (from netCDF files only), or table view (from
netCDF files only); select a specific slice from a multidimensional
dataset; or create a subset of a multidimensional raster dataset."""
from __future__ import annotations

__all__ = [
    "BuildMultidimensionalInfo",
    "BuildMultidimensionalTranspose",
    "DescribeNetCDFFile",
    "FeatureToNetCDF",
    "MakeMultidimensionalRasterLayer",
    "MakeMultidimensionalVoxelLayer",
    "MakeNetCDFFeatureLayer",
    "MakeNetCDFRasterLayer",
    "MakeNetCDFTableView",
    "MakeOPeNDAPRasterLayer",
    "ManageMultidimensionalRaster",
    "MergeMultidimensionalRasters",
    "NetCDFPointsToFeatureClass",
    "NetCDFProfilesToFeatureClass",
    "NetCDFTimeSeriesToFeatureClass",
    "NetCDFTrajectoriesToFeatureClass",
    "RasterToNetCDF",
    "SelectByDimension",
    "SubsetMultidimensionalRaster",
    "TableToNetCDF",
]
__alias__ = "md"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("BuildMultidimensionalInfo_md", None)
def BuildMultidimensionalInfo(
    in_mosaic_dataset=None,
    variable_field=None,
    dimension_fields=None,
    variable_desc_units=None,
    delete_multidimensional_info: Literal["DELETE_MULTIDIMENSIONAL_INFO", "NO_DELETE_MULTIDIMENSIONAL_INFO"]
    | None = None,
) -> Result1[str | Layer]:
    """BuildMultidimensionalInfo_md(in_mosaic_dataset, {variable_field}, {dimension_fields;dimension_fields...}, {variable_desc_units;variable_desc_units...}, {delete_multidimensional_info})

       Generates multidimensional metadata in the mosaic dataset, including
       information regarding variables and dimensions.

    INPUTS:
     in_mosaic_dataset (Mosaic Layer):
         The input multidimensional mosaic dataset.
     variable_field {String}:
         The field in the mosaic dataset that stores the variable names
         and is used to populate a new field named. If all rasters in the
         mosaic dataset represent the same variable, type the name of the
         variable, for example, Temperature. Variable        If thefield
         does not already exist, an existing field or
         string value must be specified. If thefield exists, the tool will
         update the multidimensional information only. VariableVariable
     dimension_fields {Value Table}:
         The fields in the mosaic dataset that store the dimension
         information and are used to populate a new field named.
         Dimensions        If thefield already exists, the tool will update the
         multidimensional information only. Dimensions
     variable_desc_units {Value Table}:
         Specify additional information about thefield. Variable
     delete_multidimensional_info {Boolean}:
         Specifies whether existing multidimensional information will be
         deleted.DELETE_MULTIDIMENSIONAL_INFO-If multidimensional information
         exists in
         the mosaic dataset, it will be
         deleted.NO_DELETE_MULTIDIMENSIONAL_INFO-If multidimensional
         information exists
         in the mosaic dataset, it will not be delete. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BuildMultidimensionalInfo_md(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        variable_field,
                        dimension_fields,
                        variable_desc_units,
                        delete_multidimensional_info,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("BuildMultidimensionalTranspose_md", None)
def BuildMultidimensionalTranspose(
    in_multidimensional_raster=None,
    delete_transpose: Literal["DELETE_TRANSPOSE", "NO_DELETE_TRANSPOSE"] | None = None,
) -> Result1[str]:
    """BuildMultidimensionalTranspose_md(in_multidimensional_raster, {delete_transpose})

       Transposes a multidimensional raster dataset, which divides the
       multidimensional data along each dimension to optimize performance
       when accessing pixel values across all slices.

    INPUTS:
     in_multidimensional_raster (Raster Layer):
         The input CRF multidimensional raster dataset.
     delete_transpose {Boolean}:
         Specifies whether an existing transpose will be
         deleted.DELETE_TRANSPOSE-If a transpose exists, it will be deleted and
         no new
         transpose will be built.NO_DELETE_TRANSPOSE-If a transpose exists, it
         will be overwritten by
         the newly built transpose. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BuildMultidimensionalTranspose_md(*gp_fixargs((in_multidimensional_raster, delete_transpose), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeMultidimensionalRasterLayer_md", None)
def MakeMultidimensionalRasterLayer(
    in_multidimensional_raster=None,
    out_multidimensional_raster_layer=None,
    variables=None,
    dimension_def: Literal["ALL", "BY_VALUE", "BY_RANGES", "BY_ITERATION"] | None = None,
    dimension_ranges=None,
    dimension_values=None,
    dimension=None,
    start_of_first_iteration=None,
    end_of_first_iteration=None,
    iteration_step=None,
    iteration_unit: Literal["HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"] | None = None,
    template=None,
    dimensionless: Literal["NO_DIMENSIONS", "DIMENSIONS"] | None = None,
    spatial_reference=None,
) -> Result1[str | Layer]:
    """MakeMultidimensionalRasterLayer_md(in_multidimensional_raster, out_multidimensional_raster_layer, {variables;variables...}, {dimension_def}, {dimension_ranges;dimension_ranges...}, {dimension_values;dimension_values...}, {dimension}, {start_of_first_iteration}, {end_of_first_iteration}, {iteration_step}, {iteration_unit}, {template}, {dimensionless}, {spatial_reference})

       Creates a raster layer from a multidimensional raster dataset or a
       multidimensional raster layer by slicing data along defined variables
       and dimensions.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster dataset. Supported inputs are
         netCDF, GRIB, HDF, CRF, and Zarr files, a
         multidimensional mosaic dataset, a multidimensional image service, an
         OPeNDAP URL, or a multidimensional raster layer. A Zarr file
         must have an extension of .zarr and a .zgroup file in the
         folder.
     variables {String}:
         The variables that will be included in the output multidimensional
         raster layer. If no variable is specified, the first variable will be
         used.
     dimension_def {String}:
         Specifies the method that will be used to slice the dimension.ALL-The
         full range for each dimension will be used. This is the
         default.BY_RANGES-The dimension will be sliced using a range or a list
         of
         ranges.BY_ITERATION-The dimension will be sliced over a specified
         interval
         size.BY_VALUE-The dimension will be sliced using a list of dimension
         values.
     dimension_ranges {Value Table}:
         The range or list of ranges for the specified dimension.The data will
         be sliced based on the dimension name and the minimum
         and maximum values for the range. This parameter is required when the
         dimension_def parameter is set to BY_RANGES.
     dimension_values {Value Table}:
         A list of values for the specified dimension. This parameter is
         required when the dimension_def parameter is set to BY_VALUE.
     dimension {String}:
         The dimension along which the variables will be sliced. This parameter
         is required when the dimension_def parameter is set to BY_ITERATION.
     start_of_first_iteration {String}:
         The beginning of the first interval. This interval will be used to
         iterate through the dataset. This parameter is required when the
         dimension_def parameter is set to BY_ITERATION.
     end_of_first_iteration {String}:
         The end of the first interval. This interval will be used to iterate
         through the dataset. This parameter is required when the dimension_def
         parameter is set to BY_ITERATION.
     iteration_step {Double}:
         The frequency with which the data will be sliced. This parameter is
         required when the dimension_def parameter is set to BY_ITERATION.
     iteration_unit {String}:
         Specifies the iteration unit that will be used. This parameter is
         required when the dimension_def parameter is set to BY_ITERATION and
         the dimension parameter is set to StdTime.HOURS-The specified unit of
         time will be hours.DAYS-The specified unit
         of time will be days.WEEKS-The specified unit of time will be
         weeks.MONTHS-The specified unit of time will be months.YEARS-The
         specified unit of time will be years.
     template {Extent}:
         The extent (bounding box) of the layer. Choose the
         appropriateoption for the layer. ExtentMAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     dimensionless {Boolean}:
         Specifies whether the layer will have dimension values. This parameter
         is only enabled if a single slice is selected to create a
         layer.NO_DIMENSIONS-The layer will not have dimension
         values.DIMENSIONS-The
         layer will have dimension values. This is the default.
     spatial_reference {Coordinate System}:
         The coordinate system for the out_multidimensional_raster_layer
         parameter value. This parameter only applies when the
         in_multidimensional_raster parameter value is in Zarr format. Use this
         parameter to define the spatial reference if it is missing in the
         data.

    OUTPUTS:
     out_multidimensional_raster_layer (Raster Layer):
         The output multidimensional raster layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeMultidimensionalRasterLayer_md(
                *gp_fixargs(
                    (
                        in_multidimensional_raster,
                        out_multidimensional_raster_layer,
                        variables,
                        dimension_def,
                        dimension_ranges,
                        dimension_values,
                        dimension,
                        start_of_first_iteration,
                        end_of_first_iteration,
                        iteration_step,
                        iteration_unit,
                        template,
                        dimensionless,
                        spatial_reference,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeMultidimensionalVoxelLayer_md", None)
def MakeMultidimensionalVoxelLayer(
    in_dataset=None,
    out_layer=None,
    variables=None,
    voxel_position: Literal["CENTER", "ORIGIN"] | None = None,
    exaggeration_mode: Literal["Z-COORDINATES", "FROM_VOXEL_DATASET_ORIGIN"] | None = None,
    exaggeration=None,
    offset=None,
    optimize_performance: Literal["OPTIMIZED", "NOT_OPTIMIZED"] | None = None,
) -> Result1[str | Layer]:
    """MakeMultidimensionalVoxelLayer_md(in_dataset, out_layer, {variables;variables...}, {voxel_position}, {exaggeration_mode}, {exaggeration}, {offset}, {optimize_performance})

       Creates a voxel layer from a multidimensional voxel dataset. Voxel
       datasets with a netCDF source are the only supported inputs.

    INPUTS:
     in_dataset (File):
         The input voxel dataset. Supported voxel datasets include netCDF
         files.
     variables {Value Table}:
         Specifies the names of the variables that will be output to
         the voxel layer and whether they are discrete or continuous. If no
         variables are specified, all variables from the voxel dataset will be
         used with the data types based on the type specified in the voxel
         dataset. For example, an integer will be assumed discrete and a double
         will be assumed continuous. Uncheck thecolumn value to remove the
         variable from the output layer. UseAvailable data types are as
         follows:CONTINUOUS-Use for floating-point values.DISCRETE-Use for
         nonfloating
         point values.
     voxel_position {String}:
         Specifies whether the voxel value will represent the values at the
         center or the origin of a voxel cube.CENTER-The voxel value will
         represent the center of the voxel cube.
         This is the default.ORIGIN-The voxel value will represent the origin
         of the voxel cube.
     exaggeration_mode {String}:
         Specifies the exaggeration mode that will be used for the voxel
         layer.FROM_VOXEL_DATASET_ORIGIN-Only the voxels will be scaled. This
         is the
         default.Z-COORDINATES-All z-positions will be multiplied by the
         exaggeration
         value. Use this option when exaggerating other 3D data with the voxel
         layer.
     exaggeration {Double}:
         The vertical exaggeration of the voxel layer. The default value is
         proportional to the x,y extent of the layer.
     offset {Double}:
         An offset that will be used to raise or lower the voxel layer in the
         z-dimension.
     optimize_performance {Boolean}:
         Specifies whether a .vxc1 file will be created to enhance the display
         performance of the voxel layer. The file will be created in the same
         folder as the netCDF file.OPTIMIZED-A .vxc1 file will be created. This
         is the
         default.NOT_OPTIMIZED-A .vxc1 file will not be created.

    OUTPUTS:
     out_layer (Voxel Layer):
         The output voxel layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeMultidimensionalVoxelLayer_md(
                *gp_fixargs(
                    (
                        in_dataset,
                        out_layer,
                        variables,
                        voxel_position,
                        exaggeration_mode,
                        exaggeration,
                        offset,
                        optimize_performance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeOPeNDAPRasterLayer_md", None)
def MakeOPeNDAPRasterLayer(
    in_opendap_URL=None,
    variable=None,
    x_dimension=None,
    y_dimension=None,
    out_raster_layer=None,
    extent=None,
    dimension_values=None,
    value_selection_method: Literal["BY_INDEX", "BY_VALUE"] | None = None,
    cell_registration: Literal["CENTER", "LOWER_LEFT", "UPPER_LEFT"] | None = None,
) -> Result1[str | Layer]:
    """MakeOPeNDAPRasterLayer_md(in_opendap_URL, variable, x_dimension, y_dimension, out_raster_layer, {extent}, {dimension_values;dimension_values...}, {value_selection_method}, {cell_registration})

       Creates a raster layer from data stored on an OPeNDAP server.

    INPUTS:
     in_opendap_URL (File / String):
         The URL that references the remote OPeNDAP dataset. The URL should
         resolve to the dataset level (for example, file name), not a directory
         name.
     variable (String):
         The variable from the OPeNDAP dataset that will be used to create the
         raster layer.
     x_dimension (String):
         The dimension of the OPeNDAP dataset used to define the x, or
         longitude, coordinates of the output raster layer.
     y_dimension (String):
         The dimension of the OPeNDAP dataset used to define the y, or
         latitude, coordinates of the output raster layer.
     extent {Envelope}:
         The output extent of the raster layer. Specify the extent coordinates
         in the units of the OPeNDAP data source (these could be latitude-
         longitude, projected coordinates, or some arbitrary grid coordinates).
         The purpose of this parameter is to allow subsetting to an area of
         interest or to reduce the size of the data that is transferred.
     dimension_values {Value Table}:
         The starting and ending values of the dimensions or dimensions used to
         constrain which data will be extracted from the remote OPeNDAP server.
         By default, the minimum and maximum values of the dimension or
         dimensions will be used.dimension-A netCDF dimension.{start_value}-The
         start value to use for
         the specified dimension.{end_value}-The end value to use.
     value_selection_method {String}:
         Specifies the dimension value selection method that will be
         used.BY_VALUE-The input value will be matched with the actual
         dimension
         value.BY_INDEX-The input value will be matched with the position or
         index of
         a dimension value. The index is 0 based; that is, the position starts
         at 0.
     cell_registration {String}:
         Specifies how the cells will be registered with respect to the x,y
         coordinate.CENTER-The x,y coordinate represents the center of the
         cell. This is
         the default.LOWER_LEFT-The x,y coordinate represents the lower left of
         the cell.UPPER_LEFT-The x,y coordinate represents the upper left of
         the cell.

    OUTPUTS:
     out_raster_layer (Raster Layer):
         The name of the output raster layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeOPeNDAPRasterLayer_md(
                *gp_fixargs(
                    (
                        in_opendap_URL,
                        variable,
                        x_dimension,
                        y_dimension,
                        out_raster_layer,
                        extent,
                        dimension_values,
                        value_selection_method,
                        cell_registration,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ManageMultidimensionalRaster_md", None)
def ManageMultidimensionalRaster(
    target_multidimensional_raster=None,
    manage_mode: Literal[
        "APPEND_SLICES", "REPLACE_SLICES", "APPEND_VARIABLES", "DELETE_VARIABLES", "ADD_DIMENSION", "REMOVE_DIMENSION"
    ]
    | None = None,
    variables=None,
    in_multidimensional_rasters=None,
    dimension_name=None,
    dimension_value=None,
    dimension_description=None,
    dimension_unit=None,
    update_statistics: Literal["UPDATE_STATISTICS", "NO_UPDATE_STATISTICS"] | None = None,
    update_transpose: Literal["UPDATE_TRANSPOSE", "NO_UPDATE_TRANSPOSE"] | None = None,
) -> Result1[str | Layer]:
    """ManageMultidimensionalRaster_md(target_multidimensional_raster, {manage_mode}, {variables;variables...}, {in_multidimensional_rasters;in_multidimensional_rasters...}, {dimension_name}, {dimension_value}, {dimension_description}, {dimension_unit}, {update_statistics}, {update_transpose})

       Edits a multidimensional raster by adding or deleting variables or
       dimensions.

    INPUTS:
     target_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The multidimensional raster in CRF to modify.
     manage_mode {String}:
         Specifies the type of modification that will be performed on the
         target raster.ADD_DIMENSION-A dimension will be added to the input
         multidimensional
         raster.APPEND_SLICES-Slices from the input multidimensional rasters
         will be
         added to the end of the slices for a dimension. This is the
         default.APPEND_VARIABLES-The variables from the input multidimensional
         rasters
         will be added.REPLACE_SLICES-Existing slices will be replaced by
         slices from another
         multidimensional raster, at specific dimension
         values.DELETE_VARIABLES-One or more variables will be deleted from the
         multidimensional raster.REMOVE_DIMENSION-A single slice
         multidimensional raster will be
         converted to a dimensionless raster.
     variables {String}:
         The variable or variables that will be modified in the target
         multidimensional raster. This parameter is required if the operation
         being performed is a modification of an existing variable.If no
         variable is specified, the first variable in the target
         multidimensional raster will be modified.
     in_multidimensional_rasters {Raster Layer / Image Service}:
         The multidimensional raster datasets that contain the slices or
         variables to be added to the target multidimensional raster. This
         parameter is required when the manage_mode parameter is set to
         APPEND_SLICES, REPLACE_SLICES, or APPEND_VARIABLES.
     dimension_name {String}:
         The name of the dimension to be added to or removed from the raster
         properties. This parameter is required when the manage_mode is set to
         ADD_DIMENSION. If the manage_mode parameter is set to
         REMOVE_DIMENSION, the specified dimension can only contain a single
         value. If the dimension_name parameter is not specified and the input
         only contains a single slice, all dimensions will be removed.
     dimension_value {String}:
         The value of the dimension to be added. The value can be a single
         value or a range of values. For a range of values, provide the minimum
         and maximum values separated by a comma. For example, for a new height
         dimension, enter 0,10 to generate a dimension in which the first slice
         contains information for the first 10 meters of height.This parameter
         is required when the manage_mode parameter is set to
         ADD_DIMENSION.
     dimension_description {String}:
         The description of the new dimension to be added to the raster
         properties for metadata purposes. This parameter is enabled when the
         manage_mode parameter is set to ADD_DIMENSION.
     dimension_unit {String}:
         The unit of the new dimension to be added to the raster properties for
         metadata purposes. This parameter is enabled when the manage_mode
         parameter is set to ADD_DIMENSION.
     update_statistics {Boolean}:
         Specifies whether the statistics will be recalculated for the
         multidimensional raster dataset.UPDATE_STATISTICS-Statistics will be
         recalculated. This is the
         default.NO_UPDATE_STATISTICS-Statistics will not be recalculated.
     update_transpose {Boolean}:
         Specifies whether the transpose will be rebuilt for the
         multidimensional raster dataset.UPDATE_TRANSPOSE-The transpose will be
         rebuilt. If no transpose
         exists, a new transpose will be built. This is the
         default.NO_UPDATE_TRANSPOSE-The transpose will not be rebuilt."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ManageMultidimensionalRaster_md(
                *gp_fixargs(
                    (
                        target_multidimensional_raster,
                        manage_mode,
                        variables,
                        in_multidimensional_rasters,
                        dimension_name,
                        dimension_value,
                        dimension_description,
                        dimension_unit,
                        update_statistics,
                        update_transpose,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MergeMultidimensionalRasters_md", None)
def MergeMultidimensionalRasters(
    in_multidimensional_rasters=None,
    out_raster=None,
    resolve_overlap_method: Literal["FIRST", "LAST", "MIN", "MAX", "MEAN", "SUM"] | None = None,
) -> Result1[str]:
    """MergeMultidimensionalRasters_md(in_multidimensional_rasters;in_multidimensional_rasters..., out_raster, {resolve_overlap_method})

       Combines multiple multidimensional raster datasets spatially or across
       variables and dimensions.

    INPUTS:
     in_multidimensional_rasters (Raster Layer / Mosaic Layer / Raster Dataset / Mosaic Dataset / Image Service / File):
         The input multidimensional rasters to be combined.
     resolve_overlap_method {String}:
         Specifies the method that will be used to resolve overlapping pixels
         in the combined datasets.FIRST-The pixel value in the overlapping
         areas will be the value from
         the first raster in the list of input rasters. This is the
         default.LAST-The pixel value in the overlapping areas will be the
         value from
         the last raster in the list of input rasters.MIN-The pixel value in
         the overlapping areas will be the minimum value
         of the overlapping pixels.MAX-The pixel value in the overlapping areas
         will be the maximum value
         of the overlapping pixels.MEAN-The pixel value in the overlapping
         areas will be the average of
         the overlapping pixels.SUM-The pixel value in the overlapping areas
         will be the total sum of
         the overlapping pixels.

    OUTPUTS:
     out_raster (Raster Dataset):
         The merged multidimensional raster dataset in Cloud Raster Format (a
         .crf file) or NetCDF format (an .nc file)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MergeMultidimensionalRasters_md(
                *gp_fixargs((in_multidimensional_rasters, out_raster, resolve_overlap_method), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SelectByDimension_md", None)
def SelectByDimension(
    in_layer_or_table=None,
    dimension_values=None,
    value_selection_method: Literal["BY_INDEX", "BY_VALUE"] | None = None,
) -> Result1[str | Table | Layer]:
    """SelectByDimension_md(in_layer_or_table, {dimension_values;dimension_values...}, {value_selection_method})

       Updates the netCDF layer display or netCDF table view based on the
       dimension value.

    INPUTS:
     in_layer_or_table (Raster Layer / Feature Layer / Table View / Mosaic Layer):
         The input netCDF raster layer, netCDF feature layer, netCDF table
         view, or mosaic layer. If the input is a mosaic layer, it must be
         multidimensional.
     dimension_values {Value Table}:
         A set of dimension-value pairs used to specify a slice of a
         multidimensional variable.dimension-A netCDF dimension.{value}-A
         dimension value that specifies
         a slice of a multidimensional
         variable.
     value_selection_method {String}:
         Specifies the dimension value selection method that will be
         used.BY_VALUE-The input value will be matched with the actual
         dimension
         value.BY_INDEX-The input value will be matched with the position or
         index of
         a dimension value. The index is 0 based; that is, the position starts
         at 0."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SelectByDimension_md(*gp_fixargs((in_layer_or_table, dimension_values, value_selection_method), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SubsetMultidimensionalRaster_md", None)
def SubsetMultidimensionalRaster(
    in_multidimensional_raster=None,
    out_multidimensional_raster=None,
    variables=None,
    dimension_def: Literal["ALL", "BY_VALUE", "BY_RANGES", "BY_ITERATION"] | None = None,
    dimension_ranges=None,
    dimension_values=None,
    dimension=None,
    start_of_first_iteration=None,
    end_of_first_iteration=None,
    iteration_step=None,
    iteration_unit: Literal["HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"] | None = None,
) -> Result1[str]:
    """SubsetMultidimensionalRaster_md(in_multidimensional_raster, out_multidimensional_raster, {variables;variables...}, {dimension_def}, {dimension_ranges;dimension_ranges...}, {dimension_values;dimension_values...}, {dimension}, {start_of_first_iteration}, {end_of_first_iteration}, {iteration_step}, {iteration_unit})

       Creates a subset of a multidimensional raster by slicing data along
       defined variables and dimensions.

    INPUTS:
     in_multidimensional_raster (Raster Dataset / Mosaic Dataset / Raster Layer / Mosaic Layer / Image Service / File):
         The input multidimensional raster dataset.Supported inputs include
         netCDF, GRIB, HDF or CRF files, a
         multidimensional mosaic dataset, or a multidimensional raster layer.
     variables {String}:
         The variables that will be included in the output multidimensional
         raster. If no variable is specified, all of the variables will be
         used.
     dimension_def {String}:
         Specifies the method that will be used to slice the dimension.ALL-The
         full range for each dimension will be used. This is the
         default.BY_RANGES-The dimension will be sliced using a range or a list
         of
         ranges.BY_ITERATION-The dimension will be sliced over a specified
         interval
         size.BY_VALUE-The dimension will be sliced using a list of dimension
         values.
     dimension_ranges {Value Table}:
         The range or list of ranges for the specified dimension.The data will
         be sliced based on the dimension name and the minimum
         and maximum values for the range. This parameter is required when the
         dimension_def parameter is set to BY_RANGES.
     dimension_values {Value Table}:
         A list of values for the specified dimension. This parameter is
         required when the dimension_def parameter is set to BY_VALUE.
     dimension {String}:
         The dimension along which the variables will be sliced. This parameter
         is required when the dimension_def parameter is set to BY_ITERATION.
     start_of_first_iteration {String}:
         The beginning of the first interval. This interval will be used to
         iterate through the dataset. This parameter is required when the
         dimension_def parameter is set to BY_ITERATION.
     end_of_first_iteration {String}:
         The end of the first interval. This interval will be used to iterate
         through the dataset. This parameter is required when the dimension_def
         parameter is set to BY_ITERATION.
     iteration_step {Double}:
         The frequency with which the data will be sliced. This parameter is
         required when the dimension_def parameter is set to BY_ITERATION.
     iteration_unit {String}:
         Specifies the iteration unit that will be used. This parameter is
         required when the dimension_def parameter is set to BY_ITERATION and
         the dimension parameter is set to StdTime.HOURS-The specified unit of
         time will be hours.DAYS-The specified unit
         of time will be days.WEEKS-The specified unit of time will be
         weeks.MONTHS-The specified unit of time will be months.YEARS-The
         specified unit of time will be years.

    OUTPUTS:
     out_multidimensional_raster (Raster Dataset):
         The output multidimensional raster dataset."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SubsetMultidimensionalRaster_md(
                *gp_fixargs(
                    (
                        in_multidimensional_raster,
                        out_multidimensional_raster,
                        variables,
                        dimension_def,
                        dimension_ranges,
                        dimension_values,
                        dimension,
                        start_of_first_iteration,
                        end_of_first_iteration,
                        iteration_step,
                        iteration_unit,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# NetCDF toolset
@gptooldoc("DescribeNetCDFFile_md", None)
def DescribeNetCDFFile(
    in_netCDF_file=None,
    out_file=None,
) -> Result1[str]:
    """DescribeNetCDFFile_md(in_netCDF_file, {out_file})

       Describes the nature and content of an input netCDF dataset. List all
       the variables along with their dimensions and their attributes.

    INPUTS:
     in_netCDF_file (File):
         The input netCDF file that will be described.

    OUTPUTS:
     out_file {File}:
         The name of the output description markdown file that will contain
         summary information about the input netCDF file. Specify the file name
         with the .md extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.DescribeNetCDFFile_md(*gp_fixargs((in_netCDF_file, out_file), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureToNetCDF_md", None)
def FeatureToNetCDF(
    in_features=None,
    fields_to_variables=None,
    out_netCDF_file=None,
    fields_to_dimensions=None,
) -> Result1[str]:
    """FeatureToNetCDF_md(in_features, fields_to_variables;fields_to_variables..., out_netCDF_file, {fields_to_dimensions;fields_to_dimensions...})

       Converts point features to a netCDF file.

    INPUTS:
     in_features (Feature Layer):
         The input point features.
     fields_to_variables (Value Table):
         The field or fields that will be used to create variables in the
         netCDF file.Four special fields-Shape.X, Shape.Y, Shape.Z, and
         Shape.M-can be used
         for exporting x-coordinates or longitude, y-coordinates or latitude,
         z-values, and m-values of input features, respectively.field-A field
         in the input feature attribute table.{variable}-The
         netCDF variable name{units}-The units of the data represented by the
         field
     fields_to_dimensions {Value Table}:
         The field or fields that will be used to create dimensions in the
         netCDF file.field-A field in the input feature attribute
         table.{dimension}-The
         netCDF dimension name{units}-The units of the data represented by the
         field

    OUTPUTS:
     out_netCDF_file (File):
         The output netCDF file. The file name must have an .nc extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureToNetCDF_md(
                *gp_fixargs((in_features, fields_to_variables, out_netCDF_file, fields_to_dimensions), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeNetCDFFeatureLayer_md", None)
def MakeNetCDFFeatureLayer(
    in_netCDF_file=None,
    variable=None,
    x_variable=None,
    y_variable=None,
    out_feature_layer=None,
    row_dimension=None,
    z_variable=None,
    m_variable=None,
    dimension_values=None,
    value_selection_method: Literal["BY_INDEX", "BY_VALUE"] | None = None,
) -> Result1[str | Layer]:
    """MakeNetCDFFeatureLayer_md(in_netCDF_file, variable;variable..., x_variable, y_variable, out_feature_layer, {row_dimension;row_dimension...}, {z_variable}, {m_variable}, {dimension_values;dimension_values...}, {value_selection_method})

       Makes a feature layer from a netCDF file.

    INPUTS:
     in_netCDF_file (File):
         The input netCDF file.
     variable (String):
         The netCDF variable, or variables, that will be added as fields in the
         feature attribute table.
     x_variable (String):
         A netCDF coordinate variable used to define the x, or longitude,
         coordinates of the output layer.
     y_variable (String):
         A netCDF coordinate variable used to define the y, or latitude,
         coordinates of the output layer.
     row_dimension {String}:
         The netCDF dimension, or dimensions, used to create features with
         unique values in the feature layer. The dimension or dimensions set
         here determine the number of features in the feature layer and the
         fields that will be presented in the feature layer's attribute
         table.For instance, if StationID is a dimension in the netCDF file and
         has
         10 values, by setting StationID as the dimension to use, 10 features
         will be created (10 rows will be created in the feature layer's
         attribute table). If StationID and time are used, and there are 3 time
         slices, 30 features will be created (30 rows will be created in the
         feature layer's attribute table). If you will be animating the netCDF
         feature layer, it is recommended, for efficiency reasons, to not set
         time as a row dimension. Time will still be available as a dimension
         that you can set to animate through, but the attribute table will not
         store this information.
     z_variable {String}:
         A netCDF variable used to specify elevation values (z-values) for
         features.
     m_variable {String}:
         A netCDF variable used to specify linear measurement values (m-values)
         for features.
     dimension_values {Value Table}:
         The value (such as 01/30/05) of the dimension (such as time) or
         dimensions to use when displaying the variable in the output layer. By
         default, the first value of the dimension or dimensions will be
         used.dimension-A netCDF dimension.{value}-The dimension value to use.
     value_selection_method {String}:
         Specifies the dimension value selection method that will be
         used.BY_VALUE-The input value will be matched with the actual
         dimension
         value.BY_INDEX-The input value will be matched with the position or
         index of
         a dimension value. The index is 0 based; that is, the position starts
         at 0.

    OUTPUTS:
     out_feature_layer (Feature Layer):
         The name of the output feature layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeNetCDFFeatureLayer_md(
                *gp_fixargs(
                    (
                        in_netCDF_file,
                        variable,
                        x_variable,
                        y_variable,
                        out_feature_layer,
                        row_dimension,
                        z_variable,
                        m_variable,
                        dimension_values,
                        value_selection_method,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeNetCDFRasterLayer_md", None)
def MakeNetCDFRasterLayer(
    in_netCDF_file=None,
    variable=None,
    x_dimension=None,
    y_dimension=None,
    out_raster_layer=None,
    band_dimension=None,
    dimension_values=None,
    value_selection_method: Literal["BY_INDEX", "BY_VALUE"] | None = None,
    cell_registration: Literal["CENTER", "LOWER_LEFT", "UPPER_LEFT"] | None = None,
) -> Result1[str | Layer]:
    """MakeNetCDFRasterLayer_md(in_netCDF_file, variable, x_dimension, y_dimension, out_raster_layer, {band_dimension}, {dimension_values;dimension_values...}, {value_selection_method}, {cell_registration})

       Makes a raster layer from a netCDF file.

    INPUTS:
     in_netCDF_file (File):
         The input netCDF file.
     variable (String):
         The variable of the netCDF file used to assign cell values to the
         output raster. This is the variable that will be displayed, such as
         temperature or rainfall.
     x_dimension (String):
         A netCDF dimension used to define the x, or longitude, coordinates of
         the output layer.
     y_dimension (String):
         A netCDF dimension used to define the y, or latitude, coordinates of
         the output layer.
     band_dimension {String}:
         A netCDF dimension used to create bands in the output raster. Set this
         dimension if a multiband raster layer is required. For instance,
         altitude might be set as the band dimension to create a multiband
         raster where each band represents temperature at that altitude.
     dimension_values {Value Table}:
         The value (such as 01/30/05) of the dimension (such as time) or
         dimensions to use when displaying the variable in the output layer. By
         default, the first value of the dimension or dimensions will be
         used.dimension-A netCDF dimension.{value}-The dimension value to use.
     value_selection_method {String}:
         Specifies the dimension value selection method that will be
         used.BY_VALUE-The input value will be matched with the actual
         dimension
         value.BY_INDEX-The input value will be matched with the position or
         index of
         a dimension value. The index is 0 based; that is, the position starts
         at 0.
     cell_registration {String}:
         Specifies the location of the cell registration.CENTER-Cell
         registration at the center of the cell. This is the
         default.LOWER_LEFT-Cell registration at the lower left of the
         cell.UPPER_LEFT-Cell registration at the upper left of the cell.

    OUTPUTS:
     out_raster_layer (Raster Layer):
         The name of the output raster layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeNetCDFRasterLayer_md(
                *gp_fixargs(
                    (
                        in_netCDF_file,
                        variable,
                        x_dimension,
                        y_dimension,
                        out_raster_layer,
                        band_dimension,
                        dimension_values,
                        value_selection_method,
                        cell_registration,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeNetCDFTableView_md", None)
def MakeNetCDFTableView(
    in_netCDF_file=None,
    variable=None,
    out_table_view=None,
    row_dimension=None,
    dimension_values=None,
    value_selection_method: Literal["BY_INDEX", "BY_VALUE"] | None = None,
) -> Result1[str | Table]:
    """MakeNetCDFTableView_md(in_netCDF_file, variable;variable..., out_table_view, {row_dimension;row_dimension...}, {dimension_values;dimension_values...}, {value_selection_method})

       Makes a table view from a netCDF file.

    INPUTS:
     in_netCDF_file (File):
         The input netCDF file.
     variable (String):
         The netCDF variable, or variables, used to create fields in the table
         view.
     row_dimension {String}:
         The netCDF dimension, or dimensions, used to create fields populated
         with unique values in the table view. The dimension, or dimensions,
         set here determine the number of rows in the table view and the fields
         that will be present.For instance, if stationID is a dimension in the
         netCDF file and has
         10 values, by setting stationID as the dimension to use, 10 rows will
         be created in the table view. If stationID and time are used and there
         are 3 time slices, 30 rows will be created in the table view.
     dimension_values {Value Table}:
         A set of dimension-value pairs used to specify a slice of a
         multidimensional variable.dimension-A netCDF dimension.{value}-The
         dimension value to use.
     value_selection_method {String}:
         Specifies the dimension value selection method that will be
         used.BY_VALUE-The input value will be matched with the actual
         dimension
         value.BY_INDEX-The input value will be matched with the position or
         index of
         a dimension value. The index is 0 based; that is, the position starts
         at 0.

    OUTPUTS:
     out_table_view (Table View):
         The name of the output table view."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeNetCDFTableView_md(
                *gp_fixargs(
                    (in_netCDF_file, variable, out_table_view, row_dimension, dimension_values, value_selection_method),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NetCDFPointsToFeatureClass_md", None)
def NetCDFPointsToFeatureClass(
    in_files_or_folders=None,
    target_workspace=None,
    out_point_name=None,
    instance_variables=None,
    include_subdirectories: Literal["INCLUDE_SUBDIRECTORIES", "DO_NOT_INCLUDE_SUBDIRECTORIES"] | None = None,
    in_cf_metadata=None,
    analysis_extent=None,
) -> Result1[str]:
    """NetCDFPointsToFeatureClass_md(in_files_or_folders;in_files_or_folders..., target_workspace, out_point_name, {instance_variables;instance_variables...}, {include_subdirectories}, {in_cf_metadata}, {analysis_extent})

       Creates a feature class from points in netCDF files. In the Climate
       and Forecast (CF) metadata convention, a point is a type of discrete
       sampling geometry (DSG).

    INPUTS:
     in_files_or_folders (Folder / File):
         The input netCDF files that will be used to create a feature class.
         Individual netCDF files, as well as folders that contain multiple
         netCDF files, can be used.The input netCDF files must have the same
         DSG feature type and schema.
     target_workspace (Workspace):
         The enterprise or file geodatabase in which the output feature class
         and table will be created. This must be an existing workspace.
     out_point_name (String):
         The name of the feature class that will contain the locations from the
         netCDF variables. These variables will be added as fields from the
         instance_variables parameter.
     instance_variables {String}:
         The netCDF variables that differentiate individual features and
         represent the locations where observations are made. These variables
         will be added as fields to the output feature class.
     include_subdirectories {Boolean}:
         Specifies whether the files residing in the subdirectories of an input
         folder will be used.INCLUDE_SUBDIRECTORIES-All netCDF files in all
         subdirectories will be
         used.DO_NOT_INCLUDE_SUBDIRECTORIES-Only files in the input folder will
         be
         used. This is the default.
     in_cf_metadata {File}:
         The XML format file with an .ncml extension that will supply missing
         or altered CF information for the input netCDF files.
     analysis_extent {Extent}:
         The Extent class determines the extent for the output raster dataset.
         The form of the Extent class is as follows:
         Extent (XMin, YMin, XMax, YMax)                     where:
         XMin-The extent XMin valueYMin-The extent
         YMin valueXMax-The extent
         XMax valueYMax-The extent YMax value"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NetCDFPointsToFeatureClass_md(
                *gp_fixargs(
                    (
                        in_files_or_folders,
                        target_workspace,
                        out_point_name,
                        instance_variables,
                        include_subdirectories,
                        in_cf_metadata,
                        analysis_extent,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NetCDFProfilesToFeatureClass_md", None)
def NetCDFProfilesToFeatureClass(
    in_files_or_folders=None,
    target_workspace=None,
    out_point_or_polyline_name=None,
    observation_variables=None,
    out_table_name=None,
    instance_variables=None,
    out_schema: Literal["INSTANCE_AND_OBSERVATION", "POINT_3D", "ROUTE_AND_EVENT"] | None = None,
    include_subdirectories: Literal["INCLUDE_SUBDIRECTORIES", "DO_NOT_INCLUDE_SUBDIRECTORIES"] | None = None,
    in_cf_metadata=None,
    analysis_extent=None,
    out_join_layer=None,
) -> Result3[str | Layer, str, str]:
    """NetCDFProfilesToFeatureClass_md(in_files_or_folders;in_files_or_folders..., target_workspace, out_point_or_polyline_name, {observation_variables;observation_variables...}, {out_table_name}, {instance_variables;instance_variables...}, {out_schema}, {include_subdirectories}, {in_cf_metadata}, {analysis_extent}, {out_join_layer})

       Creates a feature class from profiles in netCDF files. In the Climate
       and Forecast (CF) metadata convention, a profile is a type of discrete
       sampling geometry (DSG).

    INPUTS:
     in_files_or_folders (Folder / File):
         The input netCDF files that will be used to create a feature class.
         Individual netCDF files, as well as folders that contain multiple
         netCDF files, can be used.The input netCDF files must have the same
         DSG feature type and schema.
     target_workspace (Workspace):
         The enterprise or file geodatabase in which the output feature class
         and table will be created. This must be an existing workspace.
     out_point_or_polyline_name (String):
         The name of the feature class that will contain the locations from the
         netCDF variables. These variables will be added as fields from the
         instance_variables parameter.
     observation_variables {String}:
         The netCDF variables that contain all the observation values at each
         location and each vertical level. These will be added as fields to the
         output table
     out_table_name {String}:
         The name of the output table that will contain all the records from
         the observation variables.
     instance_variables {String}:
         The netCDF variables that differentiate individual features and
         represent the locations where observations are made. These variables
         will be added as fields to the output feature class.
     out_schema {String}:
         Specifies the output feature class type that will be
         created.INSTANCE_AND_OBSERVATION-A feature class containing 2D points
         that
         contain the location of each instance and a related table containing
         all the observation variables will be created. This is the
         default..ROUTE_AND_EVENT-A vertical polyline feature class with 3D
         vertexes and
         a linear event table for the observation variables will be
         created.POINT_3D-A 3D feature class with all instances at all vertical
         levels
         will be created.
     include_subdirectories {Boolean}:
         Specifies whether the files residing in the subdirectories of an input
         folder will be used.INCLUDE_SUBDIRECTORIES-All netCDF files in all
         subdirectories will be
         used.DO_NOT_INCLUDE_SUBDIRECTORIES-Only files in the input folder will
         be
         used. This is the default.
     in_cf_metadata {File}:
         The XML format file with an .ncml extension that will supply missing
         or altered CF information for the input netCDF files.
     analysis_extent {Extent}:
         The Extent class determines the extent for the output raster dataset.
         The form of the Extent class is as follows:
         Extent (XMin, YMin, XMax, YMax)                     where:
         XMin-The extent XMin valueYMin-The extent
         YMin valueXMax-The extent
         XMax valueYMax-The extent YMax value

    OUTPUTS:
     out_join_layer {Feature Layer}:
         The output layer that will be created by joining the output table to
         the output feature class. This is an optional output and is only
         available when the INSTANCE_AND_OBSERVATION option is specified for
         the out_schema parameter."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NetCDFProfilesToFeatureClass_md(
                *gp_fixargs(
                    (
                        in_files_or_folders,
                        target_workspace,
                        out_point_or_polyline_name,
                        observation_variables,
                        out_table_name,
                        instance_variables,
                        out_schema,
                        include_subdirectories,
                        in_cf_metadata,
                        analysis_extent,
                        out_join_layer,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NetCDFTimeSeriesToFeatureClass_md", None)
def NetCDFTimeSeriesToFeatureClass(
    in_files_or_folders=None,
    target_workspace=None,
    out_point_name=None,
    observation_variables=None,
    out_table_name=None,
    instance_variables=None,
    include_subdirectories: Literal["INCLUDE_SUBDIRECTORIES", "DO_NOT_INCLUDE_SUBDIRECTORIES"] | None = None,
    in_cf_metadata=None,
    analysis_extent=None,
    out_join_layer=None,
) -> Result3[str | Layer, str, str]:
    """NetCDFTimeSeriesToFeatureClass_md(in_files_or_folders;in_files_or_folders..., target_workspace, out_point_name, {observation_variables;observation_variables...}, {out_table_name}, {instance_variables;instance_variables...}, {include_subdirectories}, {in_cf_metadata}, {analysis_extent}, {out_join_layer})

       Creates a feature class from timeseries in netCDF files. In the
       Climate and Forecast (CF) metadata convention, a timeseries is a type
       of discrete sampling geometry (DSG).

    INPUTS:
     in_files_or_folders (Folder / File):
         The input netCDF files that will be used to create a feature class.
         Individual netCDF files, as well as folders that contain multiple
         netCDF files, can be used.The input netCDF files must have the same
         DSG feature type and schema.
     target_workspace (Workspace):
         The enterprise or file geodatabase in which the output feature class
         and table will be created. This must be an existing workspace.
     out_point_name (String):
         The name of the feature class that will contain the locations from the
         netCDF variables. These variables will be added as fields from the
         instance_variables parameter.
     observation_variables {String}:
         The netCDF variables that contain all the observation values at each
         location and each vertical level. These will be added as fields to the
         output table
     out_table_name {String}:
         The name of the output table that will contain all the records from
         the observation_variables parameter.
     instance_variables {String}:
         The netCDF variables that differentiate individual features and
         represent the locations where observations are made. These variables
         will be added as fields to the output feature class.
     include_subdirectories {Boolean}:
         Specifies whether the files residing in the subdirectories of an input
         folder will be used.INCLUDE_SUBDIRECTORIES-All netCDF files in all
         subdirectories will be
         used.DO_NOT_INCLUDE_SUBDIRECTORIES-Only files in the input folder will
         be
         used. This is the default.
     in_cf_metadata {File}:
         The XML format file with an .ncml extension that will supply missing
         or altered CF information for the input netCDF files.
     analysis_extent {Extent}:
         The Extent class determines the extent for the output raster dataset.
         The form of the Extent class is as follows:
         Extent (XMin, YMin, XMax, YMax)                     where:
         XMin-The extent XMin valueYMin-The extent
         YMin valueXMax-The extent
         XMax valueYMax-The extent YMax value

    OUTPUTS:
     out_join_layer {Feature Layer}:
         The output layer that will be created by joining the output table to
         the output feature class. This is an optional output."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NetCDFTimeSeriesToFeatureClass_md(
                *gp_fixargs(
                    (
                        in_files_or_folders,
                        target_workspace,
                        out_point_name,
                        observation_variables,
                        out_table_name,
                        instance_variables,
                        include_subdirectories,
                        in_cf_metadata,
                        analysis_extent,
                        out_join_layer,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NetCDFTrajectoriesToFeatureClass_md", None)
def NetCDFTrajectoriesToFeatureClass(
    in_files_or_folders=None,
    target_workspace=None,
    out_point_or_polyline_name=None,
    observation_variables=None,
    out_table_name=None,
    instance_variables=None,
    out_schema: Literal["ROUTE_AND_EVENT", "POINT"] | None = None,
    include_subdirectories: Literal["INCLUDE_SUBDIRECTORIES", "DO_NOT_INCLUDE_SUBDIRECTORIES"] | None = None,
    in_cf_metadata=None,
    analysis_extent=None,
) -> Result2[str, str]:
    """NetCDFTrajectoriesToFeatureClass_md(in_files_or_folders;in_files_or_folders..., target_workspace, out_point_or_polyline_name, {observation_variables;observation_variables...}, {out_table_name}, {instance_variables;instance_variables...}, {out_schema}, {include_subdirectories}, {in_cf_metadata}, {analysis_extent})

       Creates a feature class from trajectories in netCDF files. In the
       Climate and Forecast (CF) metadata convention, a trajectory is a type
       of discrete sampling geometry (DSG).

    INPUTS:
     in_files_or_folders (Folder / File):
         The input netCDF files that will be used to create a feature class.
         Individual netCDF files, as well as folders that contain multiple
         netCDF files, can be used.The input netCDF files must have the same
         DSG feature type and schema.
     target_workspace (Workspace):
         The enterprise or file geodatabase in which the output feature class
         and table will be created. This must be an existing workspace.
     out_point_or_polyline_name (String):
         The name of the feature class that will contain the locations from the
         netCDF variables. These variables will be added as fields from the
         instance_variables parameter.
     observation_variables {String}:
         The netCDF variables that contain all the observation values at each
         location and each vertical level. These will be added as fields to the
         output table
     out_table_name {String}:
         The name of the output table that will contain all the records from
         the observation variables.
     instance_variables {String}:
         The netCDF variables that differentiate individual features and
         represent the locations where observations are made. These variables
         will be added as fields to the output feature class.
     out_schema {String}:
         Specifies the output feature class type that will be
         created.ROUTE_AND_EVENT-A 2D or 3D polyline feature class will be
         created
         showing the path information.POINT-A 2D or 3D feature class will be
         created showing all locations
         where observations are made.
     include_subdirectories {Boolean}:
         Specifies whether the files residing in the subdirectories of an input
         folder will be used.INCLUDE_SUBDIRECTORIES-All netCDF files in all
         subdirectories will be
         used.DO_NOT_INCLUDE_SUBDIRECTORIES-Only files in the input folder will
         be
         used. This is the default.
     in_cf_metadata {File}:
         The XML format file with an .ncml extension that will supply missing
         or altered CF information for the input netCDF files.
     analysis_extent {Extent}:
         The Extent class determines the extent for the output raster dataset.
         The form of the Extent class is as follows:
         Extent (XMin, YMin, XMax, YMax)                     where:
         XMin-The extent XMin valueYMin-The extent
         YMin valueXMax-The extent
         XMax valueYMax-The extent YMax value"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NetCDFTrajectoriesToFeatureClass_md(
                *gp_fixargs(
                    (
                        in_files_or_folders,
                        target_workspace,
                        out_point_or_polyline_name,
                        observation_variables,
                        out_table_name,
                        instance_variables,
                        out_schema,
                        include_subdirectories,
                        in_cf_metadata,
                        analysis_extent,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RasterToNetCDF_md", None)
def RasterToNetCDF(
    in_raster=None,
    out_netCDF_file=None,
    variable=None,
    variable_units=None,
    x_dimension=None,
    y_dimension=None,
    band_dimension=None,
    fields_to_dimensions=None,
    compression_level: Literal["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] | None = None,
) -> Result1[str]:
    """RasterToNetCDF_md(in_raster, out_netCDF_file, {variable}, {variable_units}, {x_dimension}, {y_dimension}, {band_dimension}, {fields_to_dimensions;fields_to_dimensions...}, {compression_level})

       Converts a raster dataset to a netCDF file.

    INPUTS:
     in_raster (Raster Layer):
         The input raster dataset.
     variable {String}:
         The netCDF variable name that will be used in the output netCDF file.
         This variable will contain the values of cells in the input raster.
     variable_units {String}:
         The units of the data contained within the variable. The
         variable name is specified in theparameter. Variable
     x_dimension {String}:
         The netCDF dimension name that will be used to specify x, or
         longitude, coordinates.
     y_dimension {String}:
         The netCDF dimension name that will be used to specify y, or latitude,
         coordinates.
     band_dimension {String}:
         The netCDF dimension name that will be used to specify bands.
     fields_to_dimensions {Value Table}:
         The field or fields that will be used to create dimensions in the
         netCDF file.field-A field in the input raster attribute
         table.{dimension}-The
         netCDF dimension name{units}-The units of the data represented by the
         field
     compression_level {Long}:
         The level at which the output netCDF file will be compressed. The
         default value is 0, which implies no compression. A value of 9
         represents maximum compression.

    OUTPUTS:
     out_netCDF_file (File):
         The output netCDF file. The file name must have an .nc extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RasterToNetCDF_md(
                *gp_fixargs(
                    (
                        in_raster,
                        out_netCDF_file,
                        variable,
                        variable_units,
                        x_dimension,
                        y_dimension,
                        band_dimension,
                        fields_to_dimensions,
                        compression_level,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TableToNetCDF_md", None)
def TableToNetCDF(
    in_table=None,
    fields_to_variables=None,
    out_netCDF_file=None,
    fields_to_dimensions=None,
) -> Result1[str]:
    """TableToNetCDF_md(in_table, fields_to_variables;fields_to_variables..., out_netCDF_file, {fields_to_dimensions;fields_to_dimensions...})

       Converts a table to a netCDF file.

    INPUTS:
     in_table (Table View):
         The input table.
     fields_to_variables (Value Table):
         The field or fields that will be used to create variables in the
         netCDF file.field-A field in the input feature attribute
         table.{variable}-The
         netCDF variable name{units}-The units of the data represented by the
         field
     fields_to_dimensions {Value Table}:
         The field or fields that will be used to create dimensions in the
         netCDF file.field-A field in the input table.{dimension}-The netCDF
         dimension
         name{units}-The units of the data represented by the field

    OUTPUTS:
     out_netCDF_file (File):
         The output netCDF file. The file name must have an .nc extension."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TableToNetCDF_md(
                *gp_fixargs((in_table, fields_to_variables, out_netCDF_file, fields_to_dimensions), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
