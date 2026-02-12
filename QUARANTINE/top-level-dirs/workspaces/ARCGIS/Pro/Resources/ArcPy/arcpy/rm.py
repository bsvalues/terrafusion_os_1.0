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
r"""The Reality Mapping toolbox contains tools that manage and generate
true orthos, digital surface models (DSM), 2.5D and 3D meshes, and
point cloud products from adjusted imagery collected by drone and
digital aerial sensors."""
from __future__ import annotations

__all__ = [
    "AnalyzeControlPoints",
    "AppendControlPoints",
    "ApplyBlockAdjustment",
    "ComputeBlockAdjustment",
    "ComputeCameraModel",
    "ComputeControlPoints",
    "ComputeDepthMap",
    "ComputeTiePoints",
    "DetectControlPoints",
    "ExportFrameAndCameraParameters",
    "GenerateBlockAdjustmentReport",
    "MatchControlPoints",
    "ReconstructSurface",
    "RemoveDepthMap",
]
__alias__ = "rm"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("AnalyzeControlPoints_rm", None)
def AnalyzeControlPoints(
    in_mosaic_dataset=None,
    in_control_points=None,
    out_coverage_table=None,
    out_overlap_table=None,
    in_mask_dataset=None,
    minimum_area=None,
    maximum_level=None,
) -> Result2[str, str]:
    """AnalyzeControlPoints_rm(in_mosaic_dataset, in_control_points, out_coverage_table, {out_overlap_table}, {in_mask_dataset}, {minimum_area}, {maximum_level})

       Analyzes the control point coverage and identifies the areas that need
       additional control points to improve the block adjust result.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The input mosaic dataset against which to analyze the control points.
     in_control_points (Feature Layer):
         The input control point feature class.It is normally created from the
         Compute Tie Points or the Compute
         Control Points tool.
     in_mask_dataset {Feature Layer}:
         A polygon feature class used to exclude areas that you do not want in
         the analysis of the control points computation. Thefield can
         control the inclusion or exclusion of areas. A
         value of 1 indicates that the areas defined by the polygons (inside)
         will be excluded from the computation. A value of 2 indicates the
         defined polygons (inside) will be included in the computation while
         areas outside of the polygons will be excluded. mask
     minimum_area {Double}:
         Specify the minimum percent that the overlap area must be, in relation
         to the image. Areas that are lower than the specified percent
         threshold will be excluded from the analysis.Ensure that you do not
         have areas that are too small; otherwise, you
         will have small slivers being analyzed.
     maximum_level {Long}:
         The maximum number of images that can be overlapped when analyzing the
         control points. For example, if there are four images in your
         mosaic dataset,
         and a maximum overlap value of 3 was specified, then there are ten
         different combinations that will appear in the. If the four images
         were named i1, i2, i3, and i4, the ten combinations that would appear
         are [i1, i2, i3], [i1 i2 i4], [i1 i3 i4], [i2 i3 i4], [i1, i2], [i1,
         i3], [i1, i4], [i2, i3], [i2, i4], and [i3, i4]. Overlap Window

    OUTPUTS:
     out_coverage_table (Feature Class):
         A polygon feature class output that contains the control point
         coverage and the percentage of the area within the corresponding
         image.
     out_overlap_table {Feature Class}:
         A polygon feature class output that contains all the overlap areas
         between images."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeControlPoints_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        in_control_points,
                        out_coverage_table,
                        out_overlap_table,
                        in_mask_dataset,
                        minimum_area,
                        maximum_level,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AppendControlPoints_rm", None)
def AppendControlPoints(
    in_master_control_points=None,
    in_input_control_points=None,
    in_z_field=None,
    in_tag_field=None,
    in_dem=None,
    in_xy_accuracy=None,
    in_z_accuracy=None,
    Geoid: Literal["GEOID", "NONE"] | None = None,
    area_of_interest=None,
    append_option: Literal["ALL", "GCP", "GCPSET"] | None = None,
) -> Result1[str | Layer]:
    """AppendControlPoints_rm(in_master_control_points, in_input_control_points, {in_z_field}, {in_tag_field}, {in_dem}, {in_xy_accuracy}, {in_z_accuracy}, {Geoid}, {area_of_interest}, {append_option})

       Combines control points to an existing control point table.

    INPUTS:
     in_master_control_points (Feature Class / Feature Layer):
         The input control point table. This is usually the output from the
         Compute Tie Points tool.
     in_input_control_points (Feature Class / Feature Layer / File / String):
         A point feature class that stores control points. It could be the
         control point table created from the Compute Control Points tool, the
         Compute Tie Points tool, or a point feature class that has ground
         control points.
     in_z_field {Field}:
         The field that stores the control point z-values. If both
         theand theparameters are set, the Z value field is
         used. If neither thenor theparameter is set, the z-value is set to 0
         for all ground control points and check points. Z Value Field
         NameInput DEMZ Value Field NameInput DEM
     in_tag_field {Field}:
         A field in the input control point table that has a unique value. This
         field will be added to the target control point table, where the tag
         field can be used to bring in identifiers associated with ground
         control points.
     in_dem {Raster Layer / Mosaic Layer / Raster Dataset / Mosaic Dataset}:
         A DEM to use to obtain the z-value for the control points in the input
         control point table. If both theandparameters are set, the Z
         value field is used.
         If neither thenor theparameter is set, the z-value is set to 0 for all
         ground control points and check points. Z Value Field NameInput
         DEMZ Value Field NameInput DEM
     in_xy_accuracy {Double}:
         The input accuracy for the X and Y coordinates. The accuracy is in the
         same units as the in_input_control_points.This information should be
         provided by the data provider. If the
         accuracy information is not available, skip this optional parameter.
     in_z_accuracy {Double}:
         The input accuracy for the vertical coordinates. The accuracy is in
         the units of the in_input_control_points.This information should be
         provided by the data provider. If the
         accuracy information is not available, skip this optional parameter.
     Geoid {Boolean}:
         The geoid correction is required by rational polynomial coefficients
         (RPC) that reference ellipsoidal heights. Most elevation datasets are
         referenced to sea level orthometric heights, so this correction would
         be required in these cases to convert to ellipsoidal heights.NONE-No
         geoid correction is made. Use NONE only if your DEM is already
         expressed in ellipsoidal heights. This is the default.GEOID-A geoid
         correction will be made to convert orthometric heights
         to ellipsoidal heights (based on EGM96 geoid).
     area_of_interest {Envelope / Feature Layer / Feature Class}:
         Defines an area of interest extent by entering minimum and maximum x-
         and y-coordinates in the spatial reference of the input control point
         table.
     append_option {String}:
         Specifies how control points will be appended to the control point
         table.ALL-Add all points in the input control point table to the
         target
         control point table, including GCPs, check points, and all tie points.
         This is the default.GCP-Add only GCPs in the input point table to the
         target control point
         table. GCPSET-Add GCPs and tie points specifically associated
         with
         the GCPs to the target control point table. Use caution with
         this option-it is applicable only when the tie points
         in the input and target control point table have the same
         transformation. The tie points might not be in the desired positions
         if they were computed using a different adjustment process."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AppendControlPoints_rm(
                *gp_fixargs(
                    (
                        in_master_control_points,
                        in_input_control_points,
                        in_z_field,
                        in_tag_field,
                        in_dem,
                        in_xy_accuracy,
                        in_z_accuracy,
                        Geoid,
                        area_of_interest,
                        append_option,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyBlockAdjustment_rm", None)
def ApplyBlockAdjustment(
    in_mosaic_dataset=None,
    adjustment_operation: Literal["ADJUST", "RESET", "REACTIVATE"] | None = None,
    input_solution_table=None,
    pan_to_ms_scaling_factor=None,
    DEM=None,
    zoffset=None,
    control_point_table=None,
    adjust_footprints: Literal["ADJUST_FOOTPRINTS", "NO_ADJUST_FOOTPRINTS"] | None = None,
    solution_point_table=None,
    adjust_tiepoints: Literal["ADJUST_TIEPOINTS", "NO_ADJUST_TIEPOINTS"] | None = None,
) -> Result2[str | Layer, str | Table]:
    """ApplyBlockAdjustment_rm(in_mosaic_dataset, adjustment_operation, {input_solution_table}, {pan_to_ms_scaling_factor}, {DEM}, {zoffset}, {control_point_table}, {adjust_footprints}, {solution_point_table}, {adjust_tiepoints})

       Applies the geographic adjustments to the mosaic dataset items. This
       tool uses the solution table from the Compute Block Adjustments tool.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The input mosaic dataset to adjust.
     adjustment_operation (String):
         Specifies whether the mosaic dataset will be adjusted using the
         solution table or whether the mosaic dataset will be reset so there
         are no adjustments applied.ADJUST-The mosaic dataset will be adjusted
         using the input solution
         table.RESET-The mosaic dataset will be reset so there are no
         adjustments
         applied to it. REACTIVATE-Images dropped from the adjustment
         will be
         restored to active status. Images without the
         minimum number of control points required
         for adjustment are dropped from the computation in the standard
         adjustment operation, such that the images are categorized as Inactive
         in the footprints table, thevalue is set to 0, the imagery is not
         visible in the map, and the tie points statuses for the dropped images
         are disabled. This option will restore thestatus to Primary and ensure
         thevalue is resumed. Images that were included in the adjustment
         process are unaffected by this option. maxPSCategorymaxPS
     input_solution_table {Table View}:
         The solution table that will be used when adjusting the mosaic
         dataset. This is the output from the Compute Block Adjustments tool.
     pan_to_ms_scaling_factor {Double}:
         The scaling factor between the pan-sharpened resolution and the
         multispectral resolution that will be used if the mosaic dataset
         contains pan-sharpened rasters.
     DEM {Raster Dataset / Raster Layer / Mosaic Dataset / Mosaic Layer}:
         The DEM that will be used in the block adjustment. This DEM will only
         be used if it is a higher resolution than any existing DEM in the
         mosaic dataset.If this input DEM is used, the geometric function of
         the mosaic
         dataset will be updated using this input.
     zoffset {Double}:
         The vertical offset that will be used to adjust the elevation layer
         within the mosaic dataset's Geometric function.
     control_point_table {Table View}:
         The input control point table that will have the same adjustments
         applied as the solution table adjustments.
     adjust_footprints {Boolean}:
         Specifies whether the footprint geometry will be updated using the
         same transformation that will be applied to the
         image.NO_ADJUST_FOOTPRINTS-The footprint geometry will not be updated.
         This
         is the default.ADJUST_FOOTPRINTS-The footprint geometry will be
         updated. If a control
         point table is provided, it will also be transformed.
     solution_point_table {Table View}:
         The solution point table that will be used to update the status field
         for the control point table. This parameter is only used when the
         control_point_table parameter value is provided.
     adjust_tiepoints {Boolean}:
         Specifies whether the tie points will be updated when a solution point
         table is provided. This parameter is only used when the
         solution_point_table parameter value is
         provided.NO_ADJUST_TIEPOINTS-The tie points will not be updated. This
         is the
         default.ADJUST_TIEPOINTS-The tie points will be updated when a
         solution point
         table is provided."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyBlockAdjustment_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        adjustment_operation,
                        input_solution_table,
                        pan_to_ms_scaling_factor,
                        DEM,
                        zoffset,
                        control_point_table,
                        adjust_footprints,
                        solution_point_table,
                        adjust_tiepoints,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ComputeBlockAdjustment_rm", None)
def ComputeBlockAdjustment(
    in_mosaic_dataset=None,
    in_control_points=None,
    transformation_type: Literal["POLYORDER1", "POLYORDER0", "RPC", "Frame"] | None = None,
    out_solution_table=None,
    out_solution_point_table=None,
    maximum_residual_value=None,
    adjustment_options=None,
    location_accuracy: Literal["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] | None = None,
    out_quality_table=None,
    DEM=None,
    elevation_accuracy=None,
) -> Result3[str, str, str]:
    """ComputeBlockAdjustment_rm(in_mosaic_dataset, in_control_points, transformation_type, out_solution_table, {out_solution_point_table}, {maximum_residual_value}, {adjustment_options;adjustment_options...}, {location_accuracy}, {out_quality_table}, {DEM}, {elevation_accuracy})

       Computes the adjustments to the mosaic dataset. This tool will create
       a solution table that can be used to apply the actual adjustments.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The input mosaic dataset that will be adjusted.
     in_control_points (Feature Layer):
         The control point table that includes tie points and ground control
         points.This feature class is usually the output from the Compute Tie
         Points
         tool.
     transformation_type (String):
         Specifies the type of transformation that will be used when adjusting
         the mosaic dataset.POLYORDER0-A zero-order polynomial will be used in
         the block
         adjustment computation. This is commonly used when the data is in flat
         area.POLYORDER1-A first-order polynomial (affine) will be used in the
         block
         adjustment computation. This is the default. RPC-The rational
         polynomial coefficients (RPCs) will be used
         for the transformation. This is used for satellite imagery that
         contains RPC information in the metadata. This option requires
         the ArcGIS Desktop Advanced license. Frame-The Frame camera
         model will be used for the
         transformation. This is used for aerial imagery that contains the
         frame camera information in the metadata. This option requires
         the ArcGIS Desktop Advanced license.
     maximum_residual_value {Double}:
         A threshold that is used in block adjustment computation; points with
         residuals exceeding the threshold will not be used. This parameter
         applies when the transformation type is POLYORDER0, POLYORDER1, or
         Frame. If the transformation type is RPC, the proper threshold for
         eliminating invalid points will be automatically determined.When the
         transformation type is POLYORDER0 or POLYORDER1, the units
         for this parameter will be map units, and the default value will be
         2.When the transformation type is Frame, the units for this parameter
         will be pixels, and the default value will be 5.
     adjustment_options {Value Table}:
         Additional options that will be used to fine-tune the
         adjustment computation. To set an option in thepane,
         type the keyword and the
         corresponding value in the list box. Geoprocessing
         MinResidual-The minimum residual value, which is the lower
         threshold value, will be used. When the transformation type is
         POLYORDER0 or POLYORDER1, the units will be map units and the default
         minimum residual value will be 0. The minimum residual value
         and the maximum_residual_value parameter
         value are used in detecting and removing points that generate large
         errors from the block adjustment computation.
         MaxResidualFactor-The maximum residual factor will be used to
         generate the maximum (upper threshold) residual value if the
         maximum_residual-value parameter is not defined. In this case,
         MaxResidualFactor * RMS will be used to calculate the upper threshold
         value. The minimum residual value and the
         maximum_residual_factor parameter
         value are used in detecting and removing points that generate large
         errors from block adjustment computation. Additional options
         for the adjustment engine are listed below
         whenis specified for theparameter. The specifications of many of the
         options are supplied by the data provider. FrameTransformation
         Type        The options include the following:
         CalibrateF-Calibrate
         the sensor's focal length for use in the block
         adjustment. Assign a value of 1 for focal length calibration or 0 for
         no calibration. The default is 0.CalibratePP-Calibrate the principle
         point in the block adjustment.
         Assign a value of 1 for calibration or 0 for no calibration. The
         default is 0.CalibrateP-Calibrate for radial distortion parameters in
         the block
         adjustment. Assign a value of 1 for calibration or 0 for no
         calibration. The default is 0.CalibrateK-Calibrate for tangential
         distortion parameters in the block
         adjustment. Assign a value of 1 for calibration or 0 for no
         calibration. The default is 0. Calibration parameters, such as
         perspective data, are usually
         provided for most professional digital aerial cameras, such as
         UltraCam or DMC. The calibration options can be 0 if camera
         calibration parameters are prepared in the camera
         table.APrioriAccuracyX-Include the accuracy of the x-coordinate
         provided by
         the airborne Position Orientation System. The units must match
         PerspectiveX. If the value is set to 0, the x-coordinate of the image
         location is not adjusted in adjustment. This is not recommended for
         most UAV data.APrioriAccuracyY-Include the accuracy of the
         y-coordinate provided by
         the airborne Position Orientation System. The units must match
         PerspectiveY. If the value is set to 0, the y-coordinate of the image
         location is not adjusted in adjustment. This is not recommended for
         most UAV data.APrioriAccuracyZ-Include the accuracy of the
         z-coordinate provided by
         the airborne Position Orientation System. The units must match
         PerspectiveZ. If the value is set to 0, the z-coordinate of the image
         location is not adjusted in adjustment. This is not recommended for
         most UAV data.APrioriAccuracyXY-Include the accuracy of the planar
         coordinate
         provided by the metadata. The units must match PerspectiveX. If the
         value is set to 0, planar coordinates (x and y) of the image location
         are not adjusted in adjustment. This is not recommended for most UAV
         data.APrioriAccuracyXYZ-Include the accuracy of image location
         provided by
         the metadata. The units must match PerspectiveX. If the value is set
         to 0, the image location is not adjusted in adjustment. This is not
         recommended for most UAV data.APrioriAccuracyOmega-Include the
         accuracy of the Omega angle provided
         by the airborne Position Orientation System. The units are in decimal
         degrees.APrioriAccuracyPhi-Include the accuracy of the Phi angle
         provided by
         the airborne Position Orientation System. The units are in decimal
         degrees.APrioriAccuracyOmegaPhi-Include the accuracy of the Omega or
         Phi angle
         provided by the airborne Position Orientation System. The units are in
         decimal degrees.APrioriAccuracyKappa-Include the accuracy of the Kappa
         angle provided
         by the airborne Position Orientation System. The units are in decimal
         degrees.ComputeAntennaOffset-Compute the offset between GNSS antenna
         center
         and camera projection center in adjustment. Assign a value of 1 to
         compute or 0 for no computation. The default is 0.ComputeShift-Compute
         the GNSS signal shift in flights in bundle
         adjustment. Assign a value of 1 to compute or 0 for no computation.
         The default is 0.ComputeImagePosteriorStd-Compute the posterior
         standard deviation of
         image location and orientation after adjustment. Assign a value of 1
         to compute or 0 for no computation. The default is
         1.ComputeSolutionPointPosteriorStd-Compute the posterior standard
         deviation of solution points after adjustment. Assign a value of 1 to
         compute or 0 for no computation. The default is 0.rigCamera-Allow
         processing of a multiple camera rig in the block
         adjustment. Assign a value of 1 to use the rigCamera module or a value
         of 0 to not use the rigCamera module. If a value of 1 is assigned, the
         relationship of multiple cameras in the adjustment will be computed.
         The default is 0.
     location_accuracy {String}:
         Specifies the geometric accuracy level of the images.This parameter is
         only enabled if the transformation_type parameter is
         specified as RPC.HIGH-The accuracy will be 30 meters or
         less.MEDIUM-The accuracy will
         be between 31 meters and 100 meters.LOW-The accuracy will be more than
         100 meters.VERY_HIGH-The imagery was collected with a high-accuracy,
         differential
         GPS, such as RTK or PPK. This option will keep image locations fixed
         during block adjustment.If LOW is specified, the control points will
         first be improved by an
         initial triangulation; then they will be used in the block adjustment
         calculation. The medium and high accuracy options do not require
         additional estimation processing.
     DEM {Raster Dataset / Raster Layer / Mosaic Dataset / Mosaic Layer}:
         An input DEM from which elevations will be sampled as ground control
         points for refining the geometric accuracy of the image network in the
         adjustment.This parameter is only enabled when the transformation_type
         parameter
         is specified as Frame.
     elevation_accuracy {Double}:
         The elevation accuracy of the input DEM. The accuracy value will be
         used as a weight for the sampled ground control points in the
         adjustment.This parameter is only enabled when the transformation_type
         parameter
         is specified as Frame.

    OUTPUTS:
     out_solution_table (Table):
         The output solution table containing the adjustments.
     out_solution_point_table {Feature Class}:
         The output solution points table. This will be saved as a polygon
         feature class. This output can be quite large.
     out_quality_table {Table}:
         An output table used to store adjustment quality information.This
         parameter is only enabled if the transformation_type parameter is
         specified as RPC."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ComputeBlockAdjustment_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        in_control_points,
                        transformation_type,
                        out_solution_table,
                        out_solution_point_table,
                        maximum_residual_value,
                        adjustment_options,
                        location_accuracy,
                        out_quality_table,
                        DEM,
                        elevation_accuracy,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ComputeCameraModel_rm", None)
def ComputeCameraModel(
    in_mosaic_dataset=None,
    out_dsm=None,
    gps_accuracy: Literal["HIGH", "MEDIUM", "LOW", "VERY_LOW", "VERY_HIGH"] | None = None,
    estimate: Literal["ESTIMATE", "NO_ESTIMATE"] | None = None,
    refine: Literal["REFINE", "NO_REFINE"] | None = None,
    apply_adjustment: Literal["APPLY", "NO_APPLY"] | None = None,
    maximum_residual=None,
    initial_tiepoint_resolution=None,
    out_control_points=None,
    out_solution_table=None,
    out_solution_point_table=None,
    out_flight_path=None,
    maximum_overlap=None,
    minimum_coverage=None,
    remove: Literal["REMOVE", "NO_REMOVE"] | None = None,
    in_control_points=None,
    options=None,
) -> Result:
    """ComputeCameraModel_rm(in_mosaic_dataset, {out_dsm}, {gps_accuracy}, {estimate}, {refine}, {apply_adjustment}, {maximum_residual}, {initial_tiepoint_resolution}, {out_control_points}, {out_solution_table}, {out_solution_point_table}, {out_flight_path}, {maximum_overlap}, {minimum_coverage}, {remove}, {in_control_points}, {options;options...})

       Estimates the exterior camera model and interior camera model from the
       EXIF header of the raw image and refines the camera models. The model
       is then applied to the mosaic dataset with an option to use a tool-
       generated, high-resolution digital surface model (DSM) to achieve
       better orthorectification.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The mosaic dataset on which the camera model will be built and
         calculated.
     gps_accuracy {String}:
         Specifies the accuracy level of the input images. The tool will search
         for images in the neighborhood to compute matching points and
         automatically apply an adjustment strategy based on the accuracy
         level.HIGH-The GPS accuracy is 0 to 10 meters, and the tool uses a
         maximum
         of 4 by 3 images.MEDIUM-The GPS accuracy is 10 to 20 meters, and the
         tool uses a
         maximum of 4 by 6 images.LOW-The GPS accuracy is 20 to 50 meters, and
         the tool uses a maximum
         of 4 by 12 images.VERY_LOW-The GPS accuracy is more than 50 meters,
         and the tool uses a
         maximum of 4 by 20 images.VERY_HIGH-Imagery was collected with a high-
         accuracy, differential
         GPS, such as RTK or PPK. This option will hold image locations fixed
         during block adjustment.
     estimate {Boolean}:
         Specifies whether the camera model will be estimated by computing the
         adjustment based on eight times the mosaic dataset's source
         resolution. Computing the adjustment at this level will be faster but
         less accurate.ESTIMATE-The camera model will be estimated. This is the
         default.NO_ESTIMATE-The camera model will not be estimated.
     refine {Boolean}:
         Specifies whether the camera model will be refined by computing the
         adjustment at the mosaic dataset resolution. Computing the adjustment
         at this level will provide the most accurate result.REFINE-The camera
         model will be refined by computing the adjustment at
         the source resolution. This is the default.NO_REFINE-The camera model
         will not be refined. This option will be
         faster, so it is a good option when the computation does not need to
         be performed at the source resolution.
     apply_adjustment {Boolean}:
         Specifies whether the calculated adjustment will be applied to the
         input mosaic dataset.APPLY-The calculated adjustment will be applied
         to the input mosaic
         dataset. Although not required, it is recommended that you specify
         this option. This is the default.NO_APPLY-The calculated adjustment
         will not be applied to the input
         mosaic dataset.
     maximum_residual {Double}:
         The maximum residual value allowed to keep a computed control point as
         a valid control point. The default is 5.
     initial_tiepoint_resolution {Double}:
         The resolution factor at which tie points will be generated when
         estimating the camera model. The default value is 8, which means eight
         times the source pixel resolution.For images with only minor
         differentiation of features, such as
         agriculture fields, a lower value such as 2 can be used.
     maximum_overlap {Double}:
         The percentage of overlap between two images to consider them
         duplicates.For example, if the value is 0.9, it means if an image is
         90 percent
         covered by another image, it will be considered a duplicate and
         removed.
     minimum_coverage {Double}:
         The percentage indicating the control point's coverage on an image. If
         the coverage is less than the minimum percentage, the image will be
         unresolved and removed. The default is 0.
     remove {Boolean}:
         Specifies whether images will be automatically removed if they are too
         far from the flight strip.NO_REMOVE-Images will not be removed. This
         is the
         default.REMOVE-Images that are too far away from the flight strip will
         be
         removed.
     in_control_points {Feature Class}:
         The tie point table that will be used to compute the camera model. If
         no tie point table is provided, the tool will compute the tie points
         and estimate the camera model.
     options {Value Table}:
         Additional options for the adjustment engine. The specifications of
         many of the options are supplied by the data provider. The
         options include the following:        CalibrateF-The
         sensor's focal length will be calibrated for use in the
         block adjustment. Assign a value of 1 for focal length calibration, or
         0 to not calibrate. The default is 1.CalibratePP-The principle point
         in the block adjustment will be
         calibrated. Assign a value of 1 for calibration, or 0 to not
         calibrate. The default is 1.CalibrateP-Radial distortion parameters in
         the block adjustment will
         be calibrated. Assign a value of 1 for calibration, or 0 to not
         calibrate. The default is 1.CalibrateK-Tangential distortion
         parameters in the block adjustment
         will be calibrated. Assign a value of 1 for calibration, or 0 to not
         calibrate. The default is 1. EstimateOPK-The Omega, Phi, and
         Kappa angles will be
         calibrated to define the rotation between the image coordinate system
         and the projected coordinate system. Assign a value of 0 to use
         orientation angles (roll, pitch, and yaw) from UAV metadata as
         attitude initials in the block adjustment. Use a value of 1 to
         estimate orientation angles, and use estimated orientation angles as
         attitude initials in the block adjustment. The default is 1.
         For most DJI and Skydio cameras, a value of 0 is
         recommended.APrioriAccuracyX-The accuracy of the x-coordinate provided
         by the
         metadata. The units must match PerspectiveX. This option is not
         recommended for most UAV data.APrioriAccuracyY-The accuracy of the
         y-coordinate provided by the
         metadata. The units must match PerspectiveY. This option is not
         recommended for most UAV data.APrioriAccuracyZ-The accuracy of the
         z-coordinate provided by the
         metadata. The units must match PerspectiveZ. This option is not
         recommended for most UAV data.APrioriAccuracyXY-The accuracy of the
         planar coordinate provided by
         the metadata. The units must match PerspectiveX. This option is not
         recommended for most UAV data.APrioriAccuracyXYZ-The accuracy of image
         location provided by the
         metadata. The units must match PerspectiveX. This option is not
         recommended for most UAV data.APrioriAccuracyOmega-The accuracy of the
         Omega angle provided by the
         airborne Position Orientation System (POS). The units are in decimal
         degrees.APrioriAccuracyPhi-The accuracy of the Phi angle provided by
         the
         airborne Position Orientation System (POS). The units are in decimal
         degrees.APrioriAccuracyOmegaPhi-The accuracy of the Omega or Phi angle
         provided by the airborne Position Orientation System (POS). The units
         are in decimal degrees.APrioriAccuracyKappa-The accuracy of the Kappa
         angle provided by the
         airborne Position Orientation System (POS). The units are in decimal
         degrees.ComputeImagePosteriorStd-The posterior standard deviation of
         image
         location and orientation after adjustment will be computed. Assign a
         value of 1 to compute, or 0 to not compute. The default is
         1.ComputeSolutionPointPosteriorStd-The posterior standard deviation of
         solution points after adjustment will be computed. Assign a value of 1
         to compute, or 0 to not compute. The default is 0.rollingshutter-UAV
         data is processed using rolling shutter mode.
         Assign a value of 1 to process UAV data using rolling shutter mode.
         The default is 0 (do not use rolling shutter mode).

    OUTPUTS:
     out_dsm {Raster Dataset}:
         A DSM raster dataset generated from the adjusted images in the mosaic
         dataset. If apply_adjustment is set to APPLY, this DSM will replace
         the DEM in the geometric function to achieve better
         orthorectification.
     out_control_points {Feature Class}:
         The optional control points feature class.
     out_solution_table {Table}:
         The optional adjustment solution table. The solution table contains
         the root mean square (RMS) of the adjustment error and solution
         matrix.
     out_solution_point_table {Feature Class}:
         The optional solution point feature class. The solution points are the
         final controls points used to generate the adjustment solution.
     out_flight_path {Feature Class}:
         The optional flight path line feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ComputeCameraModel_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        out_dsm,
                        gps_accuracy,
                        estimate,
                        refine,
                        apply_adjustment,
                        maximum_residual,
                        initial_tiepoint_resolution,
                        out_control_points,
                        out_solution_table,
                        out_solution_point_table,
                        out_flight_path,
                        maximum_overlap,
                        minimum_coverage,
                        remove,
                        in_control_points,
                        options,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ComputeControlPoints_rm", None)
def ComputeControlPoints(
    in_mosaic_dataset=None,
    in_reference_images=None,
    out_control_points=None,
    similarity: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    out_image_feature_points=None,
    density: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    distribution: Literal["RANDOM", "REGULAR"] | None = None,
    area_of_interest=None,
    location_accuracy: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
) -> Result2[str, str]:
    """ComputeControlPoints_rm(in_mosaic_dataset, in_reference_images, out_control_points, {similarity}, {out_image_feature_points}, {density}, {distribution}, {area_of_interest}, {location_accuracy})

       Creates the control points between the mosaic dataset and the
       reference image. The control points can then be used in conjunction
       with tie points to compute the adjustments for the mosaic dataset.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The input mosaic dataset that will be used to create control points.
     in_reference_images (Raster Dataset / Image Service / Map Server / WMS Map / Raster Layer / Mosaic Layer / Internet Tiled Layer / Map Server Layer):
         The reference images that will be used to create control points for
         your mosaic dataset. If you have multiple images, create a mosaic
         dataset from the images and use the mosaic dataset as the reference.
     similarity {String}:
         Specifies the similarity level that will be used for matching tie
         points.LOW-The similarity criteria for the two matching points will be
         low.
         This option will produce the most matching points, but some of the
         matches may have a higher level of error.MEDIUM-The similarity
         criteria for the matching points will be medium.HIGH-The similarity
         criteria for the matching points will be high.
         This option will produce the fewest matching points, but each match
         will have a lower level of error.
     density {String}:
         Specifies the number of tie points to be created.LOW-The density of
         points will be low, creating the fewest number of
         tie points.MEDIUM-The density of points will be medium, creating a
         moderate
         number of points.HIGH-The density of points will be high, creating the
         highest number
         of points.
     distribution {String}:
         Specifies whether the points will have regular or random
         distribution.RANDOM-Points will be generated randomly. Randomly
         generated points
         are better for overlapping areas with irregular shapes.REGULAR-Points
         will be generated based on a fixed pattern. Points
         based on a fixed pattern use the point density to determine how
         frequently to create points.
     area_of_interest {Feature Layer}:
         Limit the area in which tie points are generated to only this polygon
         feature class.
     location_accuracy {String}:
         Specifies the keyword that describes the accuracy of the imagery.
         LOW-Images have a large shift and a large rotation (> 5
         degrees). The SIFT algorithm will be used in the point-
         matching computation. MEDIUM-Images have a medium shift and a
         small rotation (<5
         degrees). The Harris algorithm will be used in the point-
         matching computation. HIGH-Images have a small shift and a
         small rotation.
         The Harris algorithm will be used in the point-matching computation.

    OUTPUTS:
     out_control_points (Feature Class):
         The output control point table. This table will contain the control
         points that were created.
     out_image_feature_points {Feature Class}:
         The output image feature points table. This will be saved as a polygon
         feature class. This output can be quite large."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ComputeControlPoints_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        in_reference_images,
                        out_control_points,
                        similarity,
                        out_image_feature_points,
                        density,
                        distribution,
                        area_of_interest,
                        location_accuracy,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ComputeDepthMap_rm", None)
def ComputeDepthMap(
    in_mosaic_dataset=None,
    control_point_table=None,
    solution_point_table=None,
    where_clause=None,
    skip_existing: Literal["SKIP_EXISTING", "NO_SKIP_EXISTING"] | None = None,
    adjust_footprints: Literal["ADJUST_FOOTPRINTS", "NO_ADJUST_FOOTPRINTS"] | None = None,
) -> Result1[str | Layer]:
    """ComputeDepthMap_rm(in_mosaic_dataset, control_point_table, solution_point_table, {where_clause}, {skip_existing}, {adjust_footprints})

       Computes a more accurate CenterZ field value based on the depth map
       for each image comprising a mosaic dataset. Control points and
       solution points are used to compute a depth map for each image
       comprising a mosaic dataset to improve image-to-ground (map)
       transformation, especially in high oblique cases.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The block adjusted input mosaic dataset. The mosaic dataset must be
         adjusted before it is used as input for this tool. You can use an
         ortho mapping workflow in ArcGIS Pro, or a Reality for ArcGIS Pro
         workflow, to adjust the mosaic dataset.
     control_point_table (Feature Class / Feature Layer):
         The input control point feature class. This point feature class is the
         output of the Compute Camera Model tool or the Compute Tie Points
         tool.
     solution_point_table (Feature Class / Feature Layer):
         The input solution point feature class. This point feature class is
         the output of the Compute Camera Model tool or the Compute Tie Points
         tool.
     where_clause {SQL Expression}:
         An SQL expression that will be used to select items in the mosaic
         dataset to include in the depth map.
     skip_existing {Boolean}:
         Specifies whether a depth mapvalue will be computed only for
         rasters without avalue, or computed for all mosaic dataset items
         including those with an existingvalue. CenterZCenterZCenterZ
         NO_SKIP_EXISTING-A depth mapvalue will be computed for every
         mosaic dataset item, including items with an existingvalue. This is
         the default. CenterZCenterZ         SKIP_EXISTING-A depth
         mapvalue will only be computed for
         rasters that do not have avalue. CenterZCenterZ
     adjust_footprints {Boolean}:
         Specifies whether the footprint geometry will be updated using the
         same transformation that was applied to the
         image.NO_ADJUST_FOOTPRINTS-The footprint geometry will not be updated.
         This
         is the default.ADJUST_FOOTPRINTS-The footprint geometry will be
         updated to the image
         geometry."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ComputeDepthMap_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        control_point_table,
                        solution_point_table,
                        where_clause,
                        skip_existing,
                        adjust_footprints,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ComputeTiePoints_rm", None)
def ComputeTiePoints(
    in_mosaic_dataset=None,
    out_control_points=None,
    similarity: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    in_mask_dataset=None,
    out_image_features=None,
    density: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    distribution: Literal["RANDOM", "REGULAR"] | None = None,
    location_accuracy: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    options=None,
) -> Result2[str, str]:
    """ComputeTiePoints_rm(in_mosaic_dataset, out_control_points, {similarity}, {in_mask_dataset}, {out_image_features}, {density}, {distribution}, {location_accuracy}, {options;options...})

       Computes the tie points between overlapped mosaic dataset items. The
       tie points can then be used to compute the block adjustments for the
       mosaic dataset.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The input mosaic dataset that will be used to create tie points.
     similarity {String}:
         Specifies the similarity level that will be used for matching tie
         points.LOW-The similarity criteria for the two matching points will be
         low.
         This option will produce the most matching points, but some of the
         matches may have a higher level of error.MEDIUM-The similarity
         criteria for the matching points will be medium.HIGH-The similarity
         criteria for the matching points will be high.
         This option will produce the fewest matching points, but each match
         will have a lower level of error.
     in_mask_dataset {Feature Layer}:
         A polygon feature class used to exclude areas that will not be
         included in the computation of control points. Thefield can
         control the inclusion or exclusion of areas. A
         value of 1 indicates that the areas defined by the polygons (inside)
         will be excluded from the computation. A value of 2 indicates the
         defined polygons (inside) will be included in the computation while
         areas outside of the polygons will be excluded. mask
     density {String}:
         Specifies the number of tie points to be created.LOW-The density of
         points will be low, creating the fewest number of
         tie points.MEDIUM-The density of points will be medium, creating a
         moderate
         number of points.HIGH-The density of points will be high, creating the
         highest number
         of points.
     distribution {String}:
         Specifies whether the points will have regular or random
         distribution.RANDOM-Points will be generated randomly. Randomly
         generated points
         are better for overlapping areas with irregular shapes.REGULAR-Points
         will be generated based on a fixed pattern. Points
         based on a fixed pattern use the point density to determine how
         frequently to create points.
     location_accuracy {String}:
         Specifies the keyword that describes the accuracy of the imagery.
         LOW-Images have a large shift and a large rotation (> 5
         degrees). The SIFT algorithm will be used in the point-
         matching computation. MEDIUM-Images have a medium shift and a
         small rotation (<5
         degrees). The Harris algorithm will be used in the point-
         matching computation. HIGH-Images have a small shift and a
         small rotation.
         The Harris algorithm will be used in the point-matching computation.
     options {Value Table}:
         Additional options for the adjustment engine. The options are only
         used by third-party adjustment engines.

    OUTPUTS:
     out_control_points (Feature Class):
         The output control point table. The table will contain the tie points
         created by this tool.
     out_image_features {Feature Class}:
         The output image feature points table. This will be saved as a polygon
         feature class. This output can be quite large."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ComputeTiePoints_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        out_control_points,
                        similarity,
                        in_mask_dataset,
                        out_image_features,
                        density,
                        distribution,
                        location_accuracy,
                        options,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DetectControlPoints_rm", None)
def DetectControlPoints(
    in_mosaic_dataset=None,
    in_control_points=None,
    out_control_points=None,
    out_folder_image_chips=None,
    tile_size=None,
    number_tie_points_per_gcp=None,
) -> Result2[str, str]:
    """DetectControlPoints_rm(in_mosaic_dataset, in_control_points, out_control_points, {out_folder_image_chips}, {tile_size}, {number_tie_points_per_gcp})

       Detects ground control points in a mosaic dataset.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The mosaic dataset that contains the source imagery from which the
         ground control points will be created.
     in_control_points (File / Feature Class / Feature Layer / String):
         The input control point set that contains a list of ground control
         point features.
     tile_size {Long}:
         The tile size of the output image chips.The default tile size is 1024.
     number_tie_points_per_gcp {Long}:
         The number of tie points for each ground control point.The default is
         5.

    OUTPUTS:
     out_control_points (Feature Class):
         The output ground control point features.
     out_folder_image_chips {Folder}:
         The output folder of image chips."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DetectControlPoints_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        in_control_points,
                        out_control_points,
                        out_folder_image_chips,
                        tile_size,
                        number_tie_points_per_gcp,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportFrameAndCameraParameters_rm", None)
def ExportFrameAndCameraParameters(
    input_mosaic_dataset=None,
    output_file=None,
    output_format: Literal["ESRI_FRAME_AND_CAMERA_TABLE", "PIX4D_CALIBRATED_CAMERA_PARAMETERS"] | None = None,
) -> Result1[str]:
    """ExportFrameAndCameraParameters_rm(input_mosaic_dataset, output_file, {output_format})

       Exports frame and camera parameters from a mosaic dataset that
       contains frame imagery.

    INPUTS:
     input_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The input mosaic dataset.
     output_format {String}:
         Specifies the output file format for the frame and camera
         parameters.ESRI_FRAME_AND_CAMERA_TABLE-The frame and camera parameters
         will be
         exported as an Esri Frames and Camera table (.csv file). This is the
         default.PIX4D_CALIBRATED_CAMERA_PARAMETERS-The frame and camera
         parameters
         will be exported using the Pix4D calibrated camera parameters format
         (.txt file).

    OUTPUTS:
     output_file (File):
         The output file containing the frame and camera parameters. Supported
         file formats include .csv and .txt."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportFrameAndCameraParameters_rm(*gp_fixargs((input_mosaic_dataset, output_file, output_format), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateBlockAdjustmentReport_rm", None)
def GenerateBlockAdjustmentReport(
    input_mosaic_dataset=None,
    input_solution_table=None,
    input_solution_point=None,
    output_report=None,
    input_control_point_for_adjustment=None,
    report_format: Literal["HTML", "PDF", "JSON", "BRIEF JSON"] | None = None,
) -> Result1[str]:
    """GenerateBlockAdjustmentReport_rm(input_mosaic_dataset, input_solution_table, input_solution_point, output_report, {input_control_point_for_adjustment}, {report_format})

       Generates a report after performing a Reality mapping block adjustment
       on a mosaic dataset. The report is useful when evaluating the quality
       and accuracy of the Reality mapping products.

    INPUTS:
     input_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The input mosaic dataset path.
     input_solution_table (Table View):
         The associated solution point table after block adjustment.
     input_solution_point (Table View):
         The solution point feature class.
     input_control_point_for_adjustment {Table View}:
         The associated control points table, which may include tie points and
         ground control points.
     report_format {String}:
         Specifies the output format of the block adjustment report.HTML-The
         adjustment report will be created in HTML format. This is the
         default.PDF-The adjustment report will be created in PDF
         format.JSON-The adjustment report will be created in JSON format.BRIEF
         JSON-The adjustment report will be created in an abbreviated
         JSON format.

    OUTPUTS:
     output_report (File):
         The output Reality mapping report file path and name. The supported
         output format for a website is HTML."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateBlockAdjustmentReport_rm(
                *gp_fixargs(
                    (
                        input_mosaic_dataset,
                        input_solution_table,
                        input_solution_point,
                        output_report,
                        input_control_point_for_adjustment,
                        report_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MatchControlPoints_rm", None)
def MatchControlPoints(
    in_mosaic_dataset=None,
    in_control_points=None,
    out_control_points=None,
    similarity: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
) -> Result1[str]:
    """MatchControlPoints_rm(in_mosaic_dataset, in_control_points, out_control_points, {similarity})

       Creates matching tie points for a given ground control point and
       initial tie point in one of the overlapping images.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The mosaic dataset that contains the source imagery from which the tie
         points will be created.
     in_control_points (File / Feature Class / Feature Layer / String):
         The input control point set that contains a list of ground control
         point features and at least one initial tie point for each ground
         control point.
     similarity {String}:
         Specifies the similarity level that will be used for matching tie
         points.LOW-The similarity criteria for the two matching points will be
         low.
         This option will produce the most matching points, but some of the
         matches may have a higher level of error.MEDIUM-The similarity
         criteria for the matching points will be medium.HIGH-The similarity
         criteria for the matching points will be high.
         This option will produce the fewest matching points, but each match
         will have a lower level of error.

    OUTPUTS:
     out_control_points (Feature Class):
         The output control point features that contain ground control points."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MatchControlPoints_rm(
                *gp_fixargs((in_mosaic_dataset, in_control_points, out_control_points, similarity), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReconstructSurface_rm", None)
def ReconstructSurface(
    in_mosaic_dataset=None,
    recon_folder=None,
    recon_options=None,
    scenario: Literal["DRONE", "AERIAL_NADIR", "AERIAL_OBLIQUE", "SATELLITE"] | None = None,
    fwd_overlap=None,
    swd_overlap=None,
    quality: Literal["ULTRA", "HIGH"] | None = None,
    products: list[Literal["DSM", "TRUE_ORTHO", "DSM_MESH", "POINT_CLOUD", "MESH"]]
    | Literal["DSM", "TRUE_ORTHO", "DSM_MESH", "POINT_CLOUD", "MESH"]
    | str
    | None = None,
    cell_size=None,
    aoi=None,
    waterbody_features=None,
    correction_features=None,
) -> Result1[str]:
    """ReconstructSurface_rm(in_mosaic_dataset, recon_folder, {recon_options}, {scenario}, {fwd_overlap}, {swd_overlap}, {quality}, {products;products...}, {cell_size}, {aoi}, {waterbody_features}, {correction_features})

       Generates a digital surface model (DSM), true orthos, DSM meshes, 3D
       meshes, and point clouds from adjusted imagery.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The adjusted input mosaic dataset.
     recon_folder (Folder):
         The output dataset folder.
     recon_options {File / String}:
         A .json file or JSON string that specifies the values for the tool
         parameters.If this parameter value is provided, the properties of the
         .json file
         or JSON string will set the default values for the remaining optional
         parameters. See the Usages section for a list of options.
     scenario {String}:
         Specifies the type of imagery that will be used to generate the output
         products.DRONE-The input imagery will be defined as having been
         acquired with
         drones or terrestrial cameras.AERIAL_NADIR-The input imagery will be
         defined as having been acquired
         with large, photogrammetric camera systems.AERIAL_OBLIQUE-The input
         imagery will be defined as having been
         acquired with oblique camera systems.SATELLITE-The input imagery will
         be defined as having been acquired
         with a satellite.
     fwd_overlap {Long}:
         The forward (in-strip) overlap percentage that will be used between
         the images. The default is 60.This parameter is enabled when the
         scenario parameter is set to
         AERIAL_NADIR.
     swd_overlap {Long}:
         The sideward (cross-strip) overlap percentage that will be used
         between the images. The default is 30.This parameter is enabled when
         the scenario parameter is set to
         AERIAL_NADIR.
     quality {String}:
         Specifies the quality of the final product.ULTRA-The highest level of
         density point cloud will be used. Input
         images will be used at their original (full) resolution.HIGH-The high
         level of density point cloud will be used. Input images
         will be downsampled two times.
     products {String}:
         Specifies the products that will be generated.DSM-A DSM will be
         generated. This option will be specified by default
         when the scenario parameter is set to AERIAL_NADIR or
         SATELLITE.TRUE_ORTHO-The imagery will be orthorectified. This option
         will be
         specified by default when the scenario parameter is set to
         AERIAL_NADIR.DSM_MESH-A DSM mesh will be generated. This option will
         be specified
         by default when the scenario parameter is set to AERIAL_NADIR or
         SATELLITE.POINT_CLOUD-An image point cloud will be generated. This
         option will
         be specified by default when the scenario parameter is set to DRONE or
         AERIAL_OBLIQUE.MESH-A 3D mesh will be generated. This option will be
         selected by
         specified when the scenario parameter is set to DRONE or
         AERIAL_OBLIQUE.
     cell_size {Double / String}:
         The cell size of the output product.
     aoi {Feature Layer / File / String}:
         The area of interest that will be used to select images for
         processing. The area of interest can be computed automatically or
         defined using an input polygon.If the value contains 3D geometries,
         the z-component will be ignored.
         If the value includes overlapping features, the union of these
         features will be computed.
     waterbody_features {Feature Layer / File / String}:
         A polygon that will define the extent of large water bodies. The value
         must be a 3D feature.
     correction_features {Feature Layer / File / String}:
         A polygon that will define the extent of all surfaces that are not
         water bodies. The value must be a 3D feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReconstructSurface_rm(
                *gp_fixargs(
                    (
                        in_mosaic_dataset,
                        recon_folder,
                        recon_options,
                        scenario,
                        fwd_overlap,
                        swd_overlap,
                        quality,
                        products,
                        cell_size,
                        aoi,
                        waterbody_features,
                        correction_features,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveDepthMap_rm", None)
def RemoveDepthMap(
    in_mosaic_dataset=None,
    where_clause=None,
) -> Result1[str | Layer]:
    """RemoveDepthMap_rm(in_mosaic_dataset, {where_clause})

       Removes the depth map from a mosaic dataset. Other than the depth map
       removal, the tool will not update the mosaic dataset.

    INPUTS:
     in_mosaic_dataset (Mosaic Dataset / Mosaic Layer):
         The mosaic dataset that will have the depth map removed.
     where_clause {SQL Expression}:
         An SQL expression that will be used to select items in the mosaic
         dataset depth map to be removed. If not specified, all depth map
         content in the source raster's folder will be removed."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveDepthMap_rm(*gp_fixargs((in_mosaic_dataset, where_clause), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
