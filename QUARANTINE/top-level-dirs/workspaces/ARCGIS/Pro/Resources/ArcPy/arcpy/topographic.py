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
r"""Topographic Production toolbox contains tools that are used in
topographic production."""
from __future__ import annotations

__all__ = [
    "ApplyBuildingOffsets",
    "ApplyFeatureLevelMetadata",
    "ApplyMasksFromRules",
    "ApplyVisualSpecificationToMap",
    "CalculateBridgeOffsets",
    "CalculateDefaultValues",
    "CalculateMagneticComponents",
    "CalculateMEF",
    "CalculateMetrics",
    "CancelRemainingTasks",
    "CopyExtendedProperties",
    "CopyJobFiles",
    "CreateCrossReferenceGeodatabase",
    "CreateJobForTask",
    "CreateTaskGroupJobs",
    "EliminatePolygon",
    "ExportGeneralizedData",
    "ExportMetadata",
    "ExportTopology",
    "ExtractDataByFeature",
    "FillGaps",
    "GAIT",
    "GenerateAdjoiningSheetsFeatures",
    "GenerateElevationBands",
    "GenerateElevationBandsFromFeatures",
    "GenerateElevationGuideFeatures",
    "GenerateExcelFromGeodatabase",
    "GenerateGeodatabaseFromExcel",
    "GenerateIsogonicLines",
    "GenerateLocationDiagramFeatures",
    "GenerateProductLayout",
    "GenerateSpotHeights",
    "GenerateTopographicContours",
    "GeodatabaseToShape",
    "GeoNamesToGeodatabase",
    "GetFeaturesByJobAOI",
    "IdentifyContours",
    "IdentifyNarrowPolygons",
    "ImportGeneralizationData",
    "ImportMetadata",
    "ImportTopology",
    "InsertTaskGroup",
    "LoadData",
    "MakeGridsAndGraticulesLayer",
    "MakeMasksFromRules",
    "MergeLinesByPseudoNode",
    "PolygonToCenterline",
    "PopulateMapSheetInfo",
    "RemoveCutbackVertices",
    "RemoveSmallLines",
    "RepairSelfIntersection",
    "SetDataWorkspace",
    "SetLineDirection",
    "SetNextTask",
    "SetProductionProperties",
    "SetTaskGroupDependencies",
    "SetTaskList",
    "SetTaskStatus",
    "SplitFeatures",
    "ThinHydrologyLines",
    "ThinSpotHeights",
    "UnzipCellAndImport",
    "UpdateExtendedProperty",
    "UpdateGeoNames",
    "UpdatePropertyCount",
    "UpdateTaskGroupMetrics",
    "ValidateSpotHeights",
]
__alias__ = "topographic"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Cartography\Banding toolset
@gptooldoc("GenerateElevationBands_topographic", None)
def GenerateElevationBands(
    in_raster=None,
    in_aoi=None,
    out_feature_class=None,
    contour_interval: Literal["10", "20", "40", "80"] | None = None,
    min_area=None,
    smooth_tolerance=None,
    in_hydro_features=None,
    number_of_bands: Literal["1", "2", "3", "4"] | None = None,
) -> Result1[str]:
    """GenerateElevationBands_topographic(in_raster;in_raster..., in_aoi, out_feature_class, contour_interval, min_area, smooth_tolerance, {in_hydro_features}, {number_of_bands})

       Creates an elevation bands feature class from a digital elevation
       model (DEM).

    INPUTS:
     in_raster (Raster Layer / Mosaic Layer):
         The rasters that will be used to create elevation bands.
     in_aoi (Feature Layer):
         The layer that will define the processing extent.
     contour_interval (Long):
         Specifies the contour interval that will be used to determine the
         closest available contour when calculating the elevation band
         area.10-A contour interval of 10 will be used.20-A contour interval of
         20
         will be used. This is the default.40-A contour interval of 40 will be
         used.80-A contour interval of 80 will be used.
     min_area (Double):
         The minimum area of the output polygons. Features smaller than
         this value will be removed. The default is 0.00016 square decimal
         degrees. If you're creating an output dataset with a projected
         coordinate
         system, ensure that this value reflects the square units of that
         coordinate system-for example, square meters for a UTM dataset.
         Otherwise, the default value may result in an empty output dataset.
     smooth_tolerance (Linear Unit):
         The tolerance that will be used by the smoothing algorithm. The larger
         the value, the more generalized the output band features. The default
         is 0.002 decimal degrees.
     in_hydro_features {Feature Layer}:
         The bodies of water that will be excluded when calculating the
         elevation band area.
     number_of_bands {Long}:
         Specifies the number of elevation bands that will be generated.1-One
         elevation band will be generated.2-Two elevation bands will be
         generated.3-Three elevation bands will be generated.4-Four elevation
         bands will be generated.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output elevation band features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateElevationBands_topographic(
                *gp_fixargs(
                    (
                        in_raster,
                        in_aoi,
                        out_feature_class,
                        contour_interval,
                        min_area,
                        smooth_tolerance,
                        in_hydro_features,
                        number_of_bands,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateElevationBandsFromFeatures_topographic", None)
def GenerateElevationBandsFromFeatures(
    contour_features=None,
    elevation_field=None,
    area_of_interest=None,
    out_feature_class=None,
    exclusion_features=None,
    product=None,
    band_interval=None,
    band_values=None,
) -> Result1[str]:
    """GenerateElevationBandsFromFeatures_topographic(contour_features, elevation_field, area_of_interest, out_feature_class, {exclusion_features;exclusion_features...}, {product}, {band_interval}, {band_values;band_values...})

       Generates band features that represent elevation levels on a map
       product. The tool can be run with set values from standardized product
       specifications or with custom-defined values.

    INPUTS:
     contour_features (Feature Layer):
         The polyline feature layer that contains the contours. The information
         for the output bands will be derived from these features.
     elevation_field (Field):
         The field in the contour_features feature layer from which the
         elevation values will be derived.
     area_of_interest (Feature Layer):
         The AOI for the area where the elevation bands will be created. The
         AOI is typically stored in an index feature class that contains the
         extents for standard map sheets. A single feature must be selected on
         the feature class that is specified.
     exclusion_features {Feature Layer}:
         The feature layers that define areas where bands will not be created.
     product {String}:
         A supported map product, which determines the values for the
         band_values parameter unless Custom is specified for this parameter.
         If left blank, at least one pair of Low and High values is required
         for the band_values parameter.JOG-A-The Joint Operations Graphic-Air
         productONC-The Operational
         Navigation Chart productTPC-The Tactical Pilotage Chart
         productCustom-A custom product
     band_interval {Long}:
         The interval specified when the band interval type is regular. This
         parameter is only available when Custom is specified as the product
         parameter value.
     band_values {Value Table}:
         The low and high values in the bands that will be created. These
         values will be populated automatically from an .xml file if a
         particular product is specified for the product parameter value;
         however, these values must be provided manually if Custom is specified
         for the product parameter value and at least one pair of Low and High
         values is required. If no product is specified, at least one pair of
         Low and High values is still required.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will contain the banding features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateElevationBandsFromFeatures_topographic(
                *gp_fixargs(
                    (
                        contour_features,
                        elevation_field,
                        area_of_interest,
                        out_feature_class,
                        exclusion_features,
                        product,
                        band_interval,
                        band_values,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Cartography\Cartographic Refinement toolset
@gptooldoc("ApplyBuildingOffsets_topographic", None)
def ApplyBuildingOffsets(
    in_map: Literal["Internal_Map"] | None = None,
    rule_file=None,
) -> Result1[str]:
    """ApplyBuildingOffsets_topographic(in_map, rule_file)

       Aligns, moves, and hides building or bridge marker symbols based on
       product specification rules defined in an .xml file.

    INPUTS:
     in_map (Map):
         The map that contains the layers with proper symbology. This can be a
         map in the application or an .mapx file on disk.
     rule_file (File):
         An .xml file containing the offset rules that define how features will
         be aligned and refined in case of any conflict."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyBuildingOffsets_topographic(*gp_fixargs((in_map, rule_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyMasksFromRules_topographic", None)
def ApplyMasksFromRules(
    in_map: Literal["Internal_Map"] | None = None,
    rule_file=None,
    in_feature_dataset=None,
) -> Result1[str]:
    """ApplyMasksFromRules_topographic(in_map, rule_file, in_feature_dataset)

       Applies symbol layer masking to feature layers in a map based on an
       XML rule file and mask features created by the Make Mask From Rules
       tool.

    INPUTS:
     in_map (Map):
         The input map containing symbolized features such as a map in a
         project or a MAPX file on disk.
     rule_file (File):
         The XML file containing rules to define how features should be masked
         based on colors and symbol parts.
     in_feature_dataset (Feature Dataset):
         The feature dataset containing the masking polygon feature classes
         created by the Make Mask From Rules tool."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyMasksFromRules_topographic(*gp_fixargs((in_map, rule_file, in_feature_dataset), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ApplyVisualSpecificationToMap_topographic", None)
def ApplyVisualSpecificationToMap(
    in_map: Literal["Internal_Map"] | None = None,
    vs_workspace=None,
    specification=None,
    in_style_file=None,
) -> Result1[str]:
    """ApplyVisualSpecificationToMap_topographic(in_map, vs_workspace, specification, {in_style_file})

       Applies symbols and Arcade expressions to layers in a map based on the
       symbols and rules defined in a visual specification database.

    INPUTS:
     in_map (Map):
         The map containing layers to which symbols and Arcade expressions will
         be applied.
     vs_workspace (Workspace):
         The database containing the visual specification rules.
     specification (String):
         The specification rules that will be converted to Arcade and applied
         to the map layers.
     in_style_file {String}:
         The style file (.stylx) that contains the symbols defined in the
         visual specification rules."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyVisualSpecificationToMap_topographic(
                *gp_fixargs((in_map, vs_workspace, specification, in_style_file), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateBridgeOffsets_topographic", None)
def CalculateBridgeOffsets(
    in_bridge_features=None,
    in_overpassing_features=None,
    reference_scale=None,
    search_distance=None,
    expand: Literal["EXPAND", "NO_EXPAND"] | None = None,
    offset=None,
    min_length=None,
    bridge_subtype=None,
    overpassing_subtype=None,
) -> Result1[str | Layer]:
    """CalculateBridgeOffsets_topographic(in_bridge_features, in_overpassing_features, reference_scale, {search_distance}, {expand}, {offset}, {min_length}, {bridge_subtype}, {overpassing_subtype})

       Calculates the offsets necessary to properly display bridges at a
       given location.

    INPUTS:
     in_bridge_features (Layer):
         The feature layer that contains bridge features for which symbol
         offsets will be updated. Symbolize the bridge features layer with
         proper bridge features and enable attribute-driven symbology on it.
     in_overpassing_features (Layer):
         The feature layer that contains the features overpassing the bridges.
     reference_scale (Long):
         The scale at which symbols appear at their intended size.
     search_distance {Linear Unit}:
         The distance, calculated in map units, by which this tool will buffer
         point bridge features when identifying the overpassing features. This
         parameter is only available for point bridges. The default is 0
         meters.
     expand {Boolean}:
         Specifies whether marker layers on overpassing symbols will be
         included when analyzing widths.EXPAND-Marker layers on overpassing
         symbols will be included when
         analyzing widths.NO_EXPAND-Marker layers on overpassing symbols will
         not be included.
         This is the default.
     offset {Linear Unit}:
         An offset added to the bridge width. The default is 0 points.
     min_length {Linear Unit}:
         The minimum length of a line bridge. The default is 1.35
         millimeters.If the length of the bridge is less than the minimum
         length, it will
         be expanded to minimum length.
     bridge_subtype {String}:
         The subtype of the feature class from the in_bridge_features parameter
         that will be modified by this operation.
     overpassing_subtype {String}:
         The subtype of the feature class in the in_overpassing_features
         parameter that will be used in this operation."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateBridgeOffsets_topographic(
                *gp_fixargs(
                    (
                        in_bridge_features,
                        in_overpassing_features,
                        reference_scale,
                        search_distance,
                        expand,
                        offset,
                        min_length,
                        bridge_subtype,
                        overpassing_subtype,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeMasksFromRules_topographic", None)
def MakeMasksFromRules(
    in_map: Literal["Internal_Map"] | None = None,
    rule_file=None,
    out_feature_dataset=None,
) -> Result1[str]:
    """MakeMasksFromRules_topographic(in_map, rule_file, out_feature_dataset)

       Creates polygon masks for features based on color rules.

    INPUTS:
     in_map (Map):
         The map containing symbolized features.
     rule_file (File):
         The .xml file containing rules that define how features will be masked
         based on colors and symbol parts.

    OUTPUTS:
     out_feature_dataset (Feature Dataset):
         The output feature dataset. The tool will create a feature dataset
         containing polygon feature classes that will be used for masking. The
         spatial reference for the feature dataset will be taken from the map
         for which masks are generated."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeMasksFromRules_topographic(*gp_fixargs((in_map, rule_file, out_feature_dataset), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ThinSpotHeights_topographic", None)
def ThinSpotHeights(
    in_features=None,
    area_of_interest=None,
    elevation_field=None,
    invisibility_field=None,
    high_low_spots=None,
    search_distance=None,
    max_spots=None,
    input_contours=None,
    contour_code_field=None,
    depression_code_value=None,
) -> Result1[str | Layer]:
    """ThinSpotHeights_topographic(in_features, area_of_interest, elevation_field, invisibility_field, {high_low_spots}, {search_distance}, {max_spots}, {input_contours}, {contour_code_field}, {depression_code_value;depression_code_value...})

       Generalizes spot heights for a given area of interest (AOI) in
       accordance with product specifications.

    INPUTS:
     in_features (Feature Layer):
         A point feature layer or feature class representing the spot heights
         for a given AOI.
     area_of_interest (Feature Layer):
         The feature in the AOI that will be used to identify input features to
         process. Provide only one feature from the AOI.
     elevation_field (Field):
         The elevation field in the in_features parameter value that will be
         used for the spot height.
     invisibility_field (Field):
         The field where the visibility attribute will be written.
     high_low_spots {Field}:
         The field that will be used to identify the highest and lowest spots.
     search_distance {Linear Unit}:
         The minimum distance between spot heights. For example, if the search
         distance is 3,000 meters, there will be at least 3,000 meters between
         a chosen spot height and the next chosen spot height. The default
         value is 1,300 meters, as this is the optimal value for 50K sheets.
     max_spots {Long}:
         The maximum number of spot heights that will be processed.
     input_contours {Feature Layer}:
         The input contours that will be used to identify whether point
         features are in depressions or tops.
     contour_code_field {Field}:
         The field in the database that contains the domain value for
         index contour, intermediate contour, depression contour, and
         depression intermediate contour. It is a string value of the field,
         such as. HQC
     depression_code_value {Long}:
         The depression code values. A depression refers to an elevation
         completely surrounded by higher-elevation contour lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ThinSpotHeights_topographic(
                *gp_fixargs(
                    (
                        in_features,
                        area_of_interest,
                        elevation_field,
                        invisibility_field,
                        high_low_spots,
                        search_distance,
                        max_spots,
                        input_contours,
                        contour_code_field,
                        depression_code_value,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Cartography\Features toolset
@gptooldoc("CalculateMEF_topographic", None)
def CalculateMEF(
    target_mef_features=None,
    in_terrain=None,
    obstruction_features=None,
    mef_field=None,
    max_vo_field=None,
    max_terrain_field=None,
    specification: Literal["JOG_MIL_J_89100", "ONC_MIL_O_89102", "TPC_MIL_T_89101", "STANAG_3591_ED6"] | None = None,
    terrain_elev_field=None,
    vo_allowance=None,
    vo_accuracy=None,
    terrain_accuracy=None,
) -> Result1[str | Layer]:
    """CalculateMEF_topographic(target_mef_features, in_terrain;in_terrain..., obstruction_features;obstruction_features..., mef_field, max_vo_field, max_terrain_field, specification, {terrain_elev_field}, {vo_allowance}, {vo_accuracy}, {terrain_accuracy})

       Calculates the maximum elevation figures (MEF) for each polygon cell
       or quadrangle in a polygon layer. These values are used as labels for
       the MEF feature layer.

    INPUTS:
     target_mef_features (Feature Layer):
         The input polygon features representing the quadrangle or cell that
         will be updated with MEF values.
     in_terrain (Raster Layer / Mosaic Layer / Feature Layer):
         The input terrain that will be used to determine elevation values in
         an MEF feature cell. If a point feature layer is used, elevation
         values are obtained from the field defined in the terrain_elev_field
         parameter.
     obstruction_features (Value Table):
         The layers that will be used to identify the highest human-made
         structure in a cell. This is a value table defining features,
         elevation fields, and elevation units.
     mef_field (Field):
         The existing field in the target_mef_features layer where the maximum
         elevation figure value will be stored.
     max_vo_field (Field):
         The field in the target_mef_features layer where the maximum vertical
         obstruction value will be stored.
     max_terrain_field (Field):
         The field in the target_mef_features layer where the maximum elevation
         values from the terrain layer will be stored.
     specification (String):
         Specifies the specification that will be used to calculate maximum
         elevation figures.JOG_MIL_J_89100-The Joint Operations Graphic
         specification will be
         used.ONC_MIL_O_89102-The Operational Navigation Chart specification
         will be
         used.TPC_MIL_T_89101-The Tactical Pilotage Chart will be
         used.STANAG_3591_ED6-The NATO Standard Agreement will be used.
     terrain_elev_field {Field}:
         A field in the in_terrain parameter value that represents the
         elevation values for each feature. If a point feature layer is used
         for the in_terrain value, this parameter is required. This parameter
         is unavailable if a raster or mosaic layer is used as input for the
         in_terrain parameter.
     vo_allowance {Linear Unit}:
         A vertical allowance value that will be added to each calculated MEF
         value. The value accounts for nonrepresented natural or manufactured
         features. The default is 150 feet.
     vo_accuracy {Linear Unit}:
         The accuracy of the vertical obstruction feature layer within a
         specified number of units. The default is 20 meters.
     terrain_accuracy {Linear Unit}:
         The accuracy of the terrain layer within a specified number of units.
         The default is 20 meters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateMEF_topographic(
                *gp_fixargs(
                    (
                        target_mef_features,
                        in_terrain,
                        obstruction_features,
                        mef_field,
                        max_vo_field,
                        max_terrain_field,
                        specification,
                        terrain_elev_field,
                        vo_allowance,
                        vo_accuracy,
                        terrain_accuracy,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateMagneticComponents_topographic", None)
def CalculateMagneticComponents(
    in_features=None,
    altitude=None,
    date=None,
    magnetic_component=None,
) -> Result1[str | Layer]:
    """CalculateMagneticComponents_topographic(in_features, altitude, date, magnetic_component;magnetic_component...)

       Calculates the magnetic field at point locations for given date and
       altitude.

    INPUTS:
     in_features (Feature Layer):
         The point features for which magnetic field values will be calculated.
     altitude (Linear Unit):
         The elevation of the in_features value including the linear unit. Do
         not use decimal degrees or unknown units. The default is 0 meters.
     date (Date):
         The date for which magnetic field values will be calculated. The date
         must be valid for the specified World Magnetic Model. The format must
         use two digits for the month, two digits for the day, and four digits
         for the year. The default is the system current date.
     magnetic_component (Value Table):
         The magnetic component that will be calculated and the field to which
         the values will be written. Component-The magnetic component
         to calculate.
         DECLINATION-The angle between magnetic north and true north. This
         value varies by location on the globe.ANNUAL_DRIFT-The annual rate of
         change in magnetic declination. This
         value varies by location on the globe.INCLINATION-The angle between a
         compass needle and the plane of the
         horizon. Inclination is also known as magnetic dip or the dip of the
         compass needle. This value varies by latitude.HORIZONTAL-This value is
         calculated using north and east components.
         Horizontal is also known as Horizontal intensity, or H. This value
         varies by location on the globe.EAST_COMPONENT-The easterly intensity
         of the geomagnetic field. East
         component is also known as Y. This value varies by location on the
         globe.NORTH_COMPONENT-The northerly intensity of the geomagnetic
         field.
         North component is also known as X. This value varies by location on
         the globe.VERTICAL_INTENSITY-The vertical intensity of the geomagnetic
         field.
         Vertical intensity is also known as Z. This value varies by location
         on the globe.TOTAL_INTENSITY-This value is calculated using horizontal
         and vertical
         components. Total intensity is also known as F. This value varies by
         location on the globe.GRID_VARIATION-The angle between magnetic north
         and grid north. You
         must use the Lambert conformal conic projected coordinate system in
         the map frame, in the geoprocessing environment, or in the input point
         data.Field-The field to which calculated results will be written."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateMagneticComponents_topographic(
                *gp_fixargs((in_features, altitude, date, magnetic_component), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateAdjoiningSheetsFeatures_topographic", None)
def GenerateAdjoiningSheetsFeatures(
    in_feature_dataset=None,
    area_of_interest=None,
    land_features=None,
    scale: Literal["None", "1:25000", "1:50000", "1:100000"] | None = None,
    clip_aoi_to_sheets: Literal["CLIP_AOI", "DONT_CLIP_AOI"] | None = None,
    buffer_size=None,
) -> Result1[str]:
    """GenerateAdjoiningSheetsFeatures_topographic(in_feature_dataset, area_of_interest, {land_features}, {scale}, {clip_aoi_to_sheets}, {buffer_size})

       Generates the features necessary for display in an adjoining sheets
       diagram on a specification-driven topographic map.

    INPUTS:
     in_feature_dataset (Feature Dataset):
         An existing feature dataset that will contain the ASG_ feature
         classes. The feature classes will be created if they do not exist.
     area_of_interest (Feature Layer):
         A feature layer with a single selected feature that will be used to
         identify the center and surrounding AOIs. Adjoining sheets features
         will be created from the selected AOI and the intersecting AOIs as
         required.
     land_features {Feature Layer}:
         Land features that will be used to generate adjoining sheets features
         in the ASG_COAST_A and ASG_COAST_L feature classes in the target
         feature dataset.
     scale {String}:
         Specifies the factor by which the extent of the area_of_interest
         parameter value will be expanded. The expanded extent will be used to
         select adjoining areas of interest. Data from the adjoining AOIs will
         be included in the adjoining sheets diagram.1:25000-The specification
         MIL-T-89301A will be used as a guide to
         determine how to expand the width and height of the extent of the
         area_of_interest parameter value.1:50000-The specification
         MIL-T-89301A will be used to determine how
         to expand the width and height of the extent of the area_of_interest
         parameter value. This is the default.1:100000-The specification
         MIL-T-89306 will be used to determine how
         to expand the width and height of the extent of the area_of_interest
         parameter value.None-No guide will be used to determine how to expand
         the width and
         height of the extent of the area_of_interest parameter value. Instead,
         the buffer_size parameter will become available to define the
         expansion.
     clip_aoi_to_sheets {Boolean}:
         Specifies whether the AOI created for the extent of the adjoining
         sheets diagram will be clipped to the extents of the sheets to be
         displayed.CLIP_AOI-The AOI feature will be clipped by the sheets to be
         displayed
         in the adjoining sheet diagram and may have an irregular shape. This
         is the default.DONT_CLIP_AOI-The AOI feature will not be clipped and
         will retain its
         originally calculated rectangular shape. This may result in partial
         sheets being displayed in the adjoining sheets diagram.
     buffer_size {Linear Unit}:
         The size of the buffer that will be used to select sheets over a
         custom AOI.This parameter is active when the Scale parameter is set to
         None."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateAdjoiningSheetsFeatures_topographic(
                *gp_fixargs(
                    (in_feature_dataset, area_of_interest, land_features, scale, clip_aoi_to_sheets, buffer_size), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateElevationGuideFeatures_topographic", None)
def GenerateElevationGuideFeatures(
    in_feature_dataset=None,
    area_of_interest=None,
    in_rasters=None,
    hydro_exclusion_features=None,
    spot_height_features=None,
    hydro_line_features=None,
    hydro_area_features=None,
    contour_interval: Literal["10", "20", "40", "80"] | None = None,
    bands_minarea=None,
    smooth_tolerance=None,
    number_of_bands: Literal["1", "2", "3", "4"] | None = None,
    height_field=None,
    search_distance=None,
    hydroline_minlength=None,
    hydroline_minspacing=None,
    hydroarea_minlength=None,
    hydroarea_minwidth=None,
    min_island_area=None,
) -> Result1[str]:
    """GenerateElevationGuideFeatures_topographic(in_feature_dataset, area_of_interest, in_rasters;in_rasters..., {hydro_exclusion_features}, {spot_height_features}, {hydro_line_features;hydro_line_features...}, {hydro_area_features;hydro_area_features...}, {contour_interval}, {bands_minarea}, {smooth_tolerance}, {number_of_bands}, {height_field}, {search_distance}, {hydroline_minlength}, {hydroline_minspacing}, {hydroarea_minlength}, {hydroarea_minwidth}, {min_island_area})

       Creates data required for an elevation guide diagram surround element
       as required by various supported map product specifications. This tool
       uses existing banding and thinning parameters to generate output
       elevation band features, spot height features, and hydrology features.

    INPUTS:
     in_feature_dataset (Feature Dataset):
         An existing feature dataset that will contain the EGB feature classes.
         Data created for the elevation guide box is maintained in these
         feature classes in this feature dataset.
     area_of_interest (Feature Layer):
         A feature layer with a single selected feature that will define the
         processing extent for banding operations and a clipping extent for
         spot heights, and input hydrology areas and lines.
     in_rasters (Raster Layer / Mosaic Layer):
         One or more rasters that will be used to create elevation bands and
         supply elevation values to the created features.
     hydro_exclusion_features {Feature Layer}:
         A feature layer that defines a large water body area that will be
         excluded from the elevation band area computation.
     spot_height_features {Feature Layer}:
         A feature layer or class that contains spot heights.
     hydro_line_features {Feature Layer}:
         Hydrology line features that will be used to generate the output of a
         thinned hydrology dataset. Only the output features will be
         generalized through this thinning process.
     hydro_area_features {Feature Layer}:
         Hydrology area features that will be used to generate the thinned
         hydrology dataset. Only the output features will be generalized
         through this thinning process.
     contour_interval {Long}:
         Specifies the contour interval that will be used to determine the
         closest available contour when calculating the elevation band area.
         Elevation bands are created with their limits aligned to the specified
         contour interval, except low and high values, which will represent
         their actual calculated values.10-A contour interval of 10 will be
         used.20-A contour interval of 20
         will be used. This is the default.40-A contour interval of 40 will be
         used.80-A contour interval of 80 will be used.
     bands_minarea {Double}:
         The minimum area for output polygons. Features smaller than
         this value will be removed. The default is 0.00016 square decimal
         degrees. If you are creating an output dataset with a projected
         coordinate
         system, ensure that this value reflects the square units of that
         coordinate system-for example, square meters for a UTM dataset.
         Otherwise, the default value may result in an empty output dataset.
     smooth_tolerance {Linear Unit}:
         The tolerance that will be used by the smoothing algorithm. The larger
         the value, the more generalized the output band features. The default
         is 0.002 decimal degrees.
     number_of_bands {Long}:
         Specifies the number of elevation bands that will be generated.1-One
         elevation band will be generated.2-Two elevation bands will be
         generated.3-Three elevation bands will be generated.4-Four elevation
         bands will be generated.
     height_field {Field}:
         The field that identifies the elevation values of the spot height
         features. These values will be evaluated during the thinning process.
     search_distance {Linear Unit}:
         The minimum distance between spot heights. The default is 0 meters.
     hydroline_minlength {Linear Unit}:
         The minimum length that will be used to eliminate hydrology features.
         Hydrology features that have a length less than this value will be
         thinned. This value is used when generalizing input hydro lines and
         areas.
     hydroline_minspacing {Linear Unit}:
         The shortest distance between hydrographic segments that will display
         at the output scale. If the spacing between two parallel trending
         features is smaller than this value, one of the features will be
         hidden. This parameter defines the density of the resulting thinned
         hydrography. It should correspond to the distance between two parallel
         trending features that is visually significant to include at the final
         scale. When the density of features is too high (that is, the features
         are too closely spaced), at least one feature will be hidden. This can
         result in important features or features longer than the
         hydroline_minlength value being hidden.
     hydroarea_minlength {Linear Unit}:
         The length that will be used to split and classify hydrographic
         polygons as short or long. Polygons will be split at any location
         where the edge-to-edge distance is equal to the this value.
     hydroarea_minwidth {Linear Unit}:
         The width that will be used to split and classify hydrographic
         polygons as narrow or wide. Polygons will be split at any location
         where the edge-to-edge distance is equal to this value.
     min_island_area {Areal Unit}:
         The minimum area necessary for an island or hole to be included in the
         resulting features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateElevationGuideFeatures_topographic(
                *gp_fixargs(
                    (
                        in_feature_dataset,
                        area_of_interest,
                        in_rasters,
                        hydro_exclusion_features,
                        spot_height_features,
                        hydro_line_features,
                        hydro_area_features,
                        contour_interval,
                        bands_minarea,
                        smooth_tolerance,
                        number_of_bands,
                        height_field,
                        search_distance,
                        hydroline_minlength,
                        hydroline_minspacing,
                        hydroarea_minlength,
                        hydroarea_minwidth,
                        min_island_area,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateIsogonicLines_topographic", None)
def GenerateIsogonicLines(
    extent_features=None,
    altitude=None,
    date=None,
    interval=None,
    base=None,
    target_isogonic_features=None,
    magnetic_field=None,
    subtype=None,
    annual_drift: Literal["ANNUAL_DRIFT", "NO_ANNUAL_DRIFT"] | None = None,
    annual_drift_field=None,
) -> Result1[str | Layer]:
    """GenerateIsogonicLines_topographic(extent_features, altitude, date, interval, base, target_isogonic_features, magnetic_field, {subtype}, {annual_drift}, {annual_drift_field})

       Generates isomagnetic lines based on the World Magnetic Model.

    INPUTS:
     extent_features (Feature Layer):
         The area of interest where the lines will be created.
     altitude (Linear Unit):
         The elevation of the extent_features parameter value including the
         linear unit. The default is 0 meters.
     date (Date):
         The date for which the magnetic field values will be calculated. The
         default is the system's current date.
     interval (Double):
         The interval or distance between lines in degrees. The value can be
         any positive number. The default is 1.
     base (Double):
         The amount that isogonic lines will be generated above and below to
         cover the input value range.
     target_isogonic_features (Feature Layer):
         An existing feature class to which the isogonic lines will be
         appended.
     magnetic_field (Field):
         The field from the target_isogonic_features parameter value that will
         store magnetic variance values.
     subtype {String}:
         The subtype where isogonic lines will be written if the
         target_isogonic_features parameter value has subtypes.
     annual_drift {Boolean}:
         Specifies whether annual drift will be calculated. Annual drift is
         used in maritime workflows.ANNUAL_DRIFT-The annual drift will be
         calculated.NO_ANNUAL_DRIFT-The
         annual drift will not be calculated. This is the
         default.
     annual_drift_field {Field}:
         A field in the target_isogonic_features parameter value that will
         store the calculated annual drift values. The parameter accepts fields
         that have a Text, Double, or Float data type.This parameter is active
         when the annual_drift parameter is set to
         ANNUAL_DRIFT."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateIsogonicLines_topographic(
                *gp_fixargs(
                    (
                        extent_features,
                        altitude,
                        date,
                        interval,
                        base,
                        target_isogonic_features,
                        magnetic_field,
                        subtype,
                        annual_drift,
                        annual_drift_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateLocationDiagramFeatures_topographic", None)
def GenerateLocationDiagramFeatures(
    in_feature_dataset=None,
    area_of_interest=None,
    sheet_id_field=None,
    wac_features=None,
    onc_features=None,
    land_features=None,
    specification: Literal["JOG", "ONC", "TPC"] | None = None,
    tpc_features=None,
    smooth_tolerance=None,
    hydro_line_features=None,
    hydro_area_features=None,
    hydroline_minlength=None,
    hydroline_minspacing=None,
    hydroarea_minlength=None,
    hydroarea_minwidth=None,
    min_island_area=None,
) -> Result1[str]:
    """GenerateLocationDiagramFeatures_topographic(in_feature_dataset, area_of_interest, sheet_id_field, wac_features, onc_features, land_features, {specification}, {tpc_features}, {smooth_tolerance}, {hydro_line_features;hydro_line_features...}, {hydro_area_features;hydro_area_features...}, {hydroline_minlength}, {hydroline_minspacing}, {hydroarea_minlength}, {hydroarea_minwidth}, {min_island_area})

       Generates location diagram features for a Joint Operations Graphic
       (JOG), Operational Navigation Chart (ONC), or Tactical Pilotage Chart
       (TPC) map sheet. The location diagram must include JOG_Index features,
       WAC_Index features, ONC_Index features, or LandPoly features for the
       area surrounding the processed sheet.

    INPUTS:
     in_feature_dataset (Feature Dataset):
         The feature dataset that will contain the location diagram feature
         classes. The tool will create these features classes if they do not
         exist.
     area_of_interest (Feature Layer):
         A polygon feature layer with a single selected feature that will be
         used to identify the center and surrounding areas of interest.
     sheet_id_field (Field):
         An attribute field that will be used to identify the generated
         sheet features. You can use thefield as the value for this parameter
         if the field is present in the layer specified by the area_of_interest
         parameter value. JOG_SHEET
     wac_features (Feature Layer):
         The World Aeronautical Chart features that will be used to generate
         the location diagram feature classes in the input geodatabase. The
         default path is specified for this parameter if the Defense Mapping
         product files are installed.
     onc_features (Feature Layer):
         The ONC features that will be used to generate the location diagram
         feature classes in the input geodatabase. The default path is
         specified for this parameter if the Defense Mapping product files are
         installed.
     land_features (Feature Layer):
         The land features that will be used to generate the location diagram
         feature classes in the input geodatabase. The default path is
         specified for this parameter if the Defense Mapping product files are
         installed.
     specification {String}:
         Specifies the type of map product for which the location diagram
         features will be generated.JOG-The location diagram features for a
         Joint Operations Graphic will
         be generated. This is the default.ONC-The location diagram features
         for an Operational Navigation Chart
         will be generated. This option activates the following additional
         parameters: tpc_features, smooth_tolerance, hydro_line_features,
         hydro_area_features, hydroline_minlength, hydroline_minspacing,
         hydroarea_minlength, and hydroarea_minwidth.TPC-The location diagram
         features for a Tactical Pilotage Chart will
         be generated. This option activates the following additional
         parameters: smooth_tolerance, hydro_line_features,
         hydro_area_features, hydroline_minlength, hydroline_minspacing,
         hydroarea_minlength, and hydroarea_minwidth.
     tpc_features {Feature Layer}:
         The TPC features that will be used to generate the location diagram
         feature classes in the input geodatabase. This parameter is available
         when generating location diagram features for an ONC map product.
     smooth_tolerance {Linear Unit}:
         The tolerance that will be used by the smoothing algorithm. The larger
         the value, the more generalized the output location diagram features.
         This parameter is available when generating location diagram features
         for ONC or TPC map products. The default is 0.002 decimal degrees.
     hydro_line_features {Feature Layer}:
         The hydrology line features that will be used to generate the output
         of a thinned hydrology dataset. Only the output features will be
         generalized through this thinning process. This parameter is available
         when generating location diagram features for ONC or TPC map products.
     hydro_area_features {Feature Layer}:
         The hydrology area features that will be used to generate the thinned
         hydrology dataset. Only the output features will be generalized
         through this thinning process. This parameter is available when
         generating location diagram features for ONC or TPC map products.
     hydroline_minlength {Linear Unit}:
         The minimum length that will be used to eliminate hydrology features.
         The tool will thin hydrology features that have a length less than
         this value. This value will be used when generalizing input hydro
         lines and areas. This parameter is available when generating location
         diagram features for ONC or TPC map products.
     hydroline_minspacing {Linear Unit}:
         The shortest distance between hydrographic segments that will display
         at the output scale. If the spacing between two parallel trending
         features is smaller than this value, one of the features will be
         hidden. This parameter defines the density of the resulting thinned
         hydrography. It should correspond to the distance between two parallel
         trending features that is visually significant to include at the final
         scale. When the density of features is too high (that is, the features
         are too closely spaced), at least one feature will be hidden. This can
         result in important features or features longer than the
         hydroline_minlength value being hidden. This parameter is available
         when generating location diagram features for ONC or TPC map products.
     hydroarea_minlength {Linear Unit}:
         The length that will be used to split and classify hydrographic
         polygons as short or long. Polygons will be split at any location
         where the edge-to-edge distance is equal to this value. This parameter
         is available when generating location diagram features for ONC or TPC
         map products.
     hydroarea_minwidth {Linear Unit}:
         The width that will be used to split and classify hydrographic
         polygons as narrow or wide. Polygons will be split at any location
         where the edge-to-edge distance is equal to this value. This parameter
         is available when generating location diagram features for ONC or TPC
         map products.
     min_island_area {Areal Unit}:
         The minimum area necessary for an island or hole to be included in the
         resulting features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateLocationDiagramFeatures_topographic(
                *gp_fixargs(
                    (
                        in_feature_dataset,
                        area_of_interest,
                        sheet_id_field,
                        wac_features,
                        onc_features,
                        land_features,
                        specification,
                        tpc_features,
                        smooth_tolerance,
                        hydro_line_features,
                        hydro_area_features,
                        hydroline_minlength,
                        hydroline_minspacing,
                        hydroarea_minlength,
                        hydroarea_minwidth,
                        min_island_area,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateSpotHeights_topographic", None)
def GenerateSpotHeights(
    in_contour_features=None,
    in_raster=None,
    target_spot_features=None,
    contour_height_field=None,
    spot_height_field=None,
    spot_height_subtype=None,
    area_of_interest=None,
    scale: Literal[
        "1:5,000", "1:10,000", "1:12,500", "1:25,000", "1:50,000", "1:100,000", "1:250,000", "1:500,000", "1:1,000,000"
    ]
    | None = None,
    z_factor=None,
) -> Result1[str | Layer]:
    """GenerateSpotHeights_topographic(in_contour_features, in_raster;in_raster..., target_spot_features, contour_height_field, spot_height_field, {spot_height_subtype}, {area_of_interest}, {scale}, {z_factor})

       Creates elevation point features based on contour tops and
       depressions. Elevation points are created in each top and depression.
       Point height values are populated based on a digital elevation model.

    INPUTS:
     in_contour_features (Feature Layer):
         The contours from which spot heights will be computed.
     in_raster (Raster Layer / Mosaic Layer):
         The rasters used to derive the highest or lowest elevations in contour
         tops or depressions.
     target_spot_features (Feature Layer):
         An existing point feature layer or feature class in which spot heights
         will be created.
     contour_height_field (Field):
         The field in the input contours that contains elevation values. The
         field type must be numeric.
     spot_height_field (Field):
         The field in the output spot heights where elevation values will be
         written.
     spot_height_subtype {String}:
         The spot height subtype value that will be assigned to new spot height
         features.
     area_of_interest {Feature Layer}:
         The polygon features that represent the extent of the region where
         spot heights will be created. The tool uses the outer extent of the
         selected polygon features within the area_of_interest parameter value.
         If this parameter is left blank, the tool uses the outer extent of the
         selected contour features within the in_contour_features parameter
         value. If this parameter is left blank and no contour features are
         selected, the tool uses the extent of the raster.
     scale {String}:
         Specifies the scale that will be used to optimize spot heights (the
         scale of the cartographic product that will be printed). Setting a
         scale will set the default of the z_factor parameter to a value that
         is appropriate for the scale value.1:5,000-The 1:5,000 cartographic
         product scale will be
         used.1:10,000-The 1:10,000 cartographic product scale will be
         used.1:12,500-The 1:12,500 cartographic product scale will be
         used.1:25,000-The 1:25,000 cartographic product scale will be
         used.1:50,000-The 1:50,000 cartographic product scale will be used.
         This is
         the default.1:100,000-The 1:100,000 cartographic product scale will be
         used.1:250,000-The 1:250,000 cartographic product scale will be
         used.1:500,000-The 1:500,000 cartographic product scale will be
         used.1:1,000,000-The 1:1,000,000 cartographic product scale will be
         used.
     z_factor {Double}:
         The unit conversion factor that will be used when generating spot
         heights. The default is 1.The spot heights are generated based on the
         z-values in the input
         raster, which are often measured in units of meters or feet. With the
         default value of 1, the spot heights will be in the same units as the
         z-values of the input raster. To create spot heights in a unit other
         than that of the z-values, set an appropriate value for the z-factor.
         It is not necessary that the ground x,y and surface z-units be
         consistent for this tool.For example, if the elevation values in the
         input raster are in feet,
         but you want the spot heights to be generated in meters, set the
         z-factor to 0.3048 (1 foot = 0.3048 meters)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateSpotHeights_topographic(
                *gp_fixargs(
                    (
                        in_contour_features,
                        in_raster,
                        target_spot_features,
                        contour_height_field,
                        spot_height_field,
                        spot_height_subtype,
                        area_of_interest,
                        scale,
                        z_factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateTopographicContours_topographic", None)
def GenerateTopographicContours(
    in_rasters=None,
    area_of_interest=None,
    contour_features=None,
    elevation_field=None,
    contour_subtype=None,
    scale: Literal[
        " ",
        "1:5,000",
        "1:10,000",
        "1:12,500",
        "1:25,000",
        "1:50,000",
        "1:100,000",
        "1:250,000",
        "1:500,000",
        "1:1,000,000",
    ]
    | None = None,
    resample_raster: Literal["RESAMPLE_RASTER", "NO_RESAMPLE_RASTER"] | None = None,
    contour_interval=None,
    base_contour=None,
    z_factor=None,
    zero_contour: Literal["ZERO_CONTOUR", "NO_ZERO_CONTOUR"] | None = None,
    code_field=None,
    index_interval=None,
    index_code=None,
    intermediate_code=None,
    depression_code=None,
    depression_intermediate_code=None,
    raster_smooth_tolerance=None,
    minimum_length=None,
    contour_smooth_tolerance=None,
    supplemental_contours: Literal["NONE", "HALF_AUXILIARY", "QUARTER_AUXILIARY"] | None = None,
    half_auxiliary_code=None,
    quarter_auxiliary_code=None,
    depression_auxiliary_code=None,
) -> Result1[str | Layer]:
    """GenerateTopographicContours_topographic(in_rasters;in_rasters..., area_of_interest, contour_features, elevation_field, {contour_subtype}, {scale}, {resample_raster}, {contour_interval}, {base_contour}, {z_factor}, {zero_contour}, {code_field}, {index_interval}, {index_code}, {intermediate_code}, {depression_code}, {depression_intermediate_code}, {raster_smooth_tolerance}, {minimum_length}, {contour_smooth_tolerance}, {supplemental_contours}, {half_auxiliary_code}, {quarter_auxiliary_code}, {depression_auxiliary_code})

       Creates and smooths contours from an input raster.

    INPUTS:
     in_rasters (Raster Layer / Mosaic Layer):
         The input raster layers that will be used to derive the contour lines.
     area_of_interest (Feature Layer):
         A feature layer that will be used to clip the input raster before
         processing. A buffer is created before clipping the raster, which
         results in larger output contours that extend beyond the selected area
         of interest. The feature layer must have only one selected feature.
     contour_features (Feature Layer):
         An existing line feature class or feature layer. Contours will be
         appended to this feature class.
     elevation_field (Field):
         The field from the input contours that will store the contour
         elevation value. This field defaults toorif a field with either of
         those names exists in the contour feature class. ZV2ZVH
     contour_subtype {String}:
         The subtype to which contours will be written if the input contours
         have subtypes.
     scale {String}:
         Specifies the scale that will be used to optimize contours. This is
         the scale of the cartographic product that will be printed. Specifying
         the scale will set the defaults of other parameters to values that are
         appropriate for the output scale. The default is 1:50,000.1:5,000-The
         1:5,000 cartographic product scale will be
         used.1:10,000-The 1:10,000 cartographic product scale will be
         used.1:12,500-The 1:12,500 cartographic product scale will be
         used.1:25,000-The 1:25,000 cartographic product scale will be
         used.1:50,000-The 1:50,000 cartographic product scale will be used.
         This is
         the default.1:100,000-The 1:100,000 cartographic product scale will be
         used.1:250,000-The 1:250,000 cartographic product scale will be
         used.1:500,000-The 1:500,000 cartographic product scale will be
         used.1:1,000,000-The 1:1,000,000 cartographic product scale will be
         used.
     resample_raster {Boolean}:
         Specifies whether the input raster will be resampled before creating
         contours.RESAMPLE_RASTER-The input raster will be resampled before
         creating
         contours.NO_RESAMPLE_RASTER-The input raster will not be resampled
         when
         creating contours. This is the default.
     contour_interval {Double}:
         The interval, or distance, between contour lines. This can be any
         positive number. The default is set by the scale value. If this
         parameter is left blank, the default scale value will be used.
     base_contour {Double}:
         The value that contours will be generated above and below to cover the
         entire value range of the input raster. The default is 0.
     z_factor {Double}:
         The unit conversion factor that will be used when generating contours.
         The default is 1.The contour lines are generated based on the z-values
         in the input
         raster, which are often measured in units of meters or feet. With the
         default value of 1, the contours will be in the same units as the
         z-values of the input raster. To create contours in a unit other than
         that of the z-values, set an appropriate value for the z-factor. It is
         not necessary that the ground x,y and surface z-units be consistent
         for this tool.For example, if the elevation values in the input raster
         are in meters
         but you want the contours to be generated in feet, set the z-factor to
         3.28084 (1 meter = 3.28084 feet).
     zero_contour {Boolean}:
         Specifies whether a zero contour will be created. A zero contour
         represents sea level. Zero contours, when generated along a coastline,
         can be created inside a water body. Specify ZERO_CONTOUR if you want
         contours generated on land areas that are at or below sea
         level.ZERO_CONTOUR-A zero contour will be created.NO_ZERO_CONTOUR-A
         zero
         contour will not be created. This is the
         default.
     code_field {Field}:
         The field from the input contour feature class where the
         appropriate code will be stored. The default field isif it exists in
         the input contour feature class. HQC
     index_interval {Long}:
         The interval, or distance, between index contour lines. For example,
         if the contour interval is 20 meters and you want index contours every
         100 meters, specify 100. The default is set by the scale value.
     index_code {String}:
         The code value that will be stored in the code_field parameter
         value when an index contour is identified. The default code is 1 if
         thefield exists in the input contour feature class. HQC
     intermediate_code {String}:
         The code value that will be stored in the code_field parameter
         value when an intermediate contour is identified. The default code is
         2 if thefield exists in the input contour feature class. HQC
     depression_code {String}:
         The code value that will be stored in the code_field parameter
         value when a depression contour is identified. The default code is 5
         if thefield exists in the input contour feature class. HQC
     depression_intermediate_code {String}:
         The code value that will be stored in the code_field parameter
         value when a depression intermediate contour is identified. The
         default code is 6 if thefield exists in the input contour feature
         class. HQC
     raster_smooth_tolerance {Double}:
         The amount of smoothing that will be applied to the input raster
         before creating the contour lines.
     minimum_length {Linear Unit}:
         The minimum length that will be used for an individual contour line.
         The default is set by the scale value. If the value is set to 0 or
         left blank, no contours will be deleted from the output contours based
         on their short length.
     contour_smooth_tolerance {Linear Unit}:
         The amount of smoothing that will be applied to the contour lines. The
         larger the value, the more generalized the contours. The default is
         set by the scale value. If this parameter is set to 0 or left blank,
         no smoothing will be applied to the output contours.
     supplemental_contours {String}:
         Specifies the interval at which a contour line will be placed between
         regularly spaced contours. This is used when the terrain change is not
         large enough to be depicted with consistent contour intervals.NONE-No
         supplemental contours will be created. This is the
         default.HALF_AUXILIARY-Supplemental contours will be created at one-
         half the
         contour interval.QUARTER_AUXILIARY-Supplemental contours will be
         created at one-quarter
         the contour interval.
     half_auxiliary_code {String}:
         The code value that will be stored in the code_field parameter
         value when a half auxiliary contour is identified. The default code is
         3 if thefield exists in the input contour feature class. HQC
     quarter_auxiliary_code {String}:
         The code value that will be stored in the code_field parameter
         value when a quarter auxiliary contour is identified. The default code
         is 14 if thefield exists in the input contour feature class.
         HQC
     depression_auxiliary_code {String}:
         The code value that will be stored in the code_field parameter
         value when a depression auxiliary contour is identified. The default
         code is 22 if thefield exists in the input contour feature class.
         HQC"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateTopographicContours_topographic(
                *gp_fixargs(
                    (
                        in_rasters,
                        area_of_interest,
                        contour_features,
                        elevation_field,
                        contour_subtype,
                        scale,
                        resample_raster,
                        contour_interval,
                        base_contour,
                        z_factor,
                        zero_contour,
                        code_field,
                        index_interval,
                        index_code,
                        intermediate_code,
                        depression_code,
                        depression_intermediate_code,
                        raster_smooth_tolerance,
                        minimum_length,
                        contour_smooth_tolerance,
                        supplemental_contours,
                        half_auxiliary_code,
                        quarter_auxiliary_code,
                        depression_auxiliary_code,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("IdentifyContours_topographic", None)
def IdentifyContours(
    in_contour_features=None,
    in_rasters=None,
    contour_height_field=None,
    contour_code_field=None,
    contour_index_interval=None,
    index_code=None,
    intermediate_code=None,
    depression_code=None,
    depression_intermediate_code=None,
    depression_contours_count=None,
    area_of_interest=None,
    z_factor=None,
    supplemental_contours: Literal["NONE", "HALF_AUXILIARY", "QUARTER_AUXILIARY"] | None = None,
    half_auxiliary_code=None,
    quarter_auxiliary_code=None,
    depression_auxiliary_code=None,
    contour_interval=None,
    base_contour=None,
) -> Result1[str | Layer]:
    """IdentifyContours_topographic(in_contour_features, in_rasters;in_rasters..., contour_height_field, contour_code_field, {contour_index_interval}, {index_code}, {intermediate_code}, {depression_code}, {depression_intermediate_code}, {depression_contours_count}, {area_of_interest}, {z_factor}, {supplemental_contours}, {half_auxiliary_code}, {quarter_auxiliary_code}, {depression_auxiliary_code}, {contour_interval}, {base_contour})

       Identifies types of contours and applies hypsographic codes to input
       features.

    INPUTS:
     in_contour_features (Feature Layer):
         The input contours that will be updated with the specified contour
         codes.
     in_rasters (Raster Layer / Mosaic Layer):
         The rasters that will be used to derive elevations of points inside
         contours to correctly identify the types of contours.
     contour_height_field (Field):
         The field in the input contour feature class that contains elevation
         values. This field type must be numeric.
     contour_code_field (Field):
         The field in the input contour feature class that will be updated with
         the appropriate domain code.
     contour_index_interval {Long}:
         The interval, or distance, between index contour lines. The default is
         100.
     index_code {String}:
         The value that will be used to populate the contour_code_field
         parameter value when index contours are identified. The default is 1.
     intermediate_code {String}:
         The value that will be used to populate the contour_code_field
         parameter value when intermediate contours are identified. The default
         is 2.
     depression_code {String}:
         The value that will be used to populate the contour_code_field
         parameter value when depression contours are identified. The default
         is 5.
     depression_intermediate_code {String}:
         The value that will be used to populate the contour_code_field
         parameter value when depression intermediate contours are identified.
         The default is 6.
     depression_contours_count {Long}:
         The number of contours in a depression that will be coded as
         depressions. The value provided must be greater than zero. If no value
         is provided, all of the contours in the depression will be coded as
         depressions.
     area_of_interest {Feature Layer}:
         The layer that defines the processing extent. The layer must have only
         one selected feature.
     z_factor {Double}:
         The conversion factor that will be used to convert the contour
         elevation value unit of measurement to match the raster's unit of
         measurement. The default is 1.For example, if the elevation values in
         the input raster are in meters
         but the contours are in feet, set the z-factor to 3.28084 (1 meter =
         3.28084 feet).
     supplemental_contours {String}:
         Specifies the interval at which supplemental contours will be created.
         Supplemental contours are used when the terrain change is not large
         enough to be depicted with consistent contour intervals.NONE-No
         supplemental contours will be created. This is the
         default.HALF_AUXILIARY-Supplemental contours will be created at one-
         half the
         contour interval.QUARTER_AUXILIARY-Supplemental contours will be
         created at one-quarter
         the contour interval.
     half_auxiliary_code {String}:
         The code value that will be stored in the contour_code_field
         parameter value when a half auxiliary contour is identified. The
         default code will be 3 if thefield exists in the input contour feature
         class. HQC
     quarter_auxiliary_code {String}:
         The code value that will be stored in the contour_code_field
         parameter value when a quarter auxiliary contour is identified. The
         default code will be 14 if thefield exists in the input contour
         feature class. HQC
     depression_auxiliary_code {String}:
         The code value that will be stored in the contour_code_field
         parameter value when a depression auxiliary contour is identified. The
         default code will be 22 if thefield exists in the input contour
         feature class. HQC
     contour_interval {Double}:
         The interval, or distance, between contour lines. This can be any
         positive number. The default is 20.
     base_contour {Double}:
         The value that contours will be generated above and below to cover the
         entire value range of the input raster. The default is 0."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.IdentifyContours_topographic(
                *gp_fixargs(
                    (
                        in_contour_features,
                        in_rasters,
                        contour_height_field,
                        contour_code_field,
                        contour_index_interval,
                        index_code,
                        intermediate_code,
                        depression_code,
                        depression_intermediate_code,
                        depression_contours_count,
                        area_of_interest,
                        z_factor,
                        supplemental_contours,
                        half_auxiliary_code,
                        quarter_auxiliary_code,
                        depression_auxiliary_code,
                        contour_interval,
                        base_contour,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ValidateSpotHeights_topographic", None)
def ValidateSpotHeights(
    in_contour_features=None,
    contour_height_field=None,
    contour_interval=None,
    in_rasters=None,
    in_spot_features=None,
    spot_height_field=None,
    area_of_interest=None,
    z_factor=None,
    use_rasters: Literal["USE_RASTERS", "NO_USE_RASTERS"] | None = None,
) -> Result1[str | Layer]:
    """ValidateSpotHeights_topographic(in_contour_features, contour_height_field, contour_interval, in_rasters;in_rasters..., in_spot_features, spot_height_field, {area_of_interest}, {z_factor}, {use_rasters})

       Validates that spot heights are higher than or equal to their
       respective contour top, and based on the contour interval, that a
       contour top is not missing a contour line between it and a spot
       height.

    INPUTS:
     in_contour_features (Feature Layer):
         The contour features that will be used to validate the spot heights.
     contour_height_field (Field):
         The field that contains elevation values for the in_contour_features
         parameter value. The field type must be numeric.
     contour_interval (Long):
         The interval, or distance, between contour lines. The value can be any
         positive number. The default is 20.
     in_rasters (Raster Layer / Mosaic Layer):
         The rasters that will be used to derive elevations of points inside
         contours.
     in_spot_features (Feature Layer):
         An existing point feature layer that contains spot heights that will
         be validated.
     spot_height_field (Field):
         The field that contains elevation values for the in_spot_features
         parameter value.
     area_of_interest {Feature Layer}:
         The extent that contains the spot heights that will be validated. This
         parameter does not accept point layers as valid input and must have
         only one selected feature.
     z_factor {Double}:
         The unit conversion factor that will be used when validating spot
         heights to convert the contour elevation value unit of measurement to
         match the raster's unit of measurement. The default is 1.For example,
         if the input raster's elevation values are in meters but
         the contours are in feet, set the z-factor to 3.28084 (1 meter =
         3.28084 feet).
     use_rasters {Boolean}:
         Specifies whether the rasters provided will be used to validate the
         spot heights.USE_RASTERS-The in_rasters parameter value will be used
         to validate
         the spot heights. This is the default.NO_USE_RASTERS-The in_rasters
         parameter value will not be used to
         validate the spot heights."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ValidateSpotHeights_topographic(
                *gp_fixargs(
                    (
                        in_contour_features,
                        contour_height_field,
                        contour_interval,
                        in_rasters,
                        in_spot_features,
                        spot_height_field,
                        area_of_interest,
                        z_factor,
                        use_rasters,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Cartography\Layout toolset
@gptooldoc("GenerateProductLayout_topographic", None)
def GenerateProductLayout(
    geodatabase=None,
    aoi_layer=None,
    product=None,
    version=None,
    output_location=None,
    rasters=None,
    template=None,
    output_type: Literal["PAGX", "APRX", "PDF", "TIFF", "PPKX"] | None = None,
    export_file=None,
) -> Result1[str]:
    """GenerateProductLayout_topographic(geodatabase, aoi_layer, product, version, output_location, {rasters;rasters...}, {template}, {output_type}, {export_file})

       Automates the process of producing a layout or map based on a standard
       specification.

    INPUTS:
     geodatabase (Workspace):
         The input geodatabase that contains the features for the final map
         product. The schema of the workspace must match the schema of the
         product selected.
     aoi_layer (Feature Layer):
         A polygon feature layer that describes the processing extent. The
         feature layer must have only one feature selected or must be a feature
         class with only one feature.
     product (String):
         Specifies the supported map product that will be used.MTM50-An MGCP
         Topographic Map at 1:50,000 cartographic product scale
         will be used.MTM100-A MGCP Topographic Map at 1:100,000 cartographic
         product scale
         will be used.TM25-A Topographic Map at 1:25,000 cartographic product
         scale will be
         used.TM50-A Topographic Map at 1:50,000 cartographic product scale
         will be
         used.TM100-A Topographic Map at 1:100,000 cartographic product scale
         will
         be used.JOGA-A Joint Operations Graphic at 1:250,000 cartographic
         product
         scale will be used.CTM50-A Civilian Topographic map at 1:50,000
         cartographic product
         scale will be used.
     version (String):
         The supported versions of the selected product.
     output_location (Folder):
         The folder path to which the output file will be written.
     rasters {Raster Layer / Mosaic Layer}:
         The input rasters used if the product requires an elevation guide
         surround element to calculate the elevation bands and spot height
         features. If you specify more than one raster, the rasters must have
         the same cell size, band number, and pixel type. If no raster is
         specified, the elevation guide data frame will not be processed and a
         warning will appear.
     template {Layout}:
         The layout template to be used. If no layout template is specified,
         the default layout template for the product will be used.
     output_type {String}:
         Specifies the type of output.PAGX-A layout file will be created. This
         is the default.APRX-An ArcGIS
         Pro project file will be created.PDF-A .pdf file will be
         created.TIFF-A .tiff file will be created.PPKX-An ArcGIS Pro packaged
         project file will be created.
     export_file {File}:
         A file that defines a set of parameter values for the specified
         output_type parameter value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateProductLayout_topographic(
                *gp_fixargs(
                    (
                        geodatabase,
                        aoi_layer,
                        product,
                        version,
                        output_location,
                        rasters,
                        template,
                        output_type,
                        export_file,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeGridsAndGraticulesLayer_topographic", None)
def MakeGridsAndGraticulesLayer(
    in_grid_xml=None,
    area_of_interest=None,
    target_feature_dataset=None,
    out_layer_name=None,
    grid_name=None,
    configure_layout: Literal["CONFIGURE_LAYOUT", "NO_CONFIGURE_LAYOUT"] | None = None,
    layout=None,
    map_frame=None,
    reference_scale=None,
    rotation=None,
    mask_size=None,
    xy_tolerance=None,
    primary_coordinate_system=None,
    ancillary_coordinate_system_1=None,
    ancillary_coordinate_system_2=None,
    ancillary_coordinate_system_3=None,
    ancillary_coordinate_system_4=None,
) -> Result1[str | Layer]:
    """MakeGridsAndGraticulesLayer_topographic(in_grid_xml, area_of_interest, target_feature_dataset, out_layer_name, {grid_name}, {configure_layout}, {layout}, {map_frame}, {reference_scale}, {rotation}, {mask_size}, {xy_tolerance}, {primary_coordinate_system}, {ancillary_coordinate_system_1}, {ancillary_coordinate_system_2}, {ancillary_coordinate_system_3}, {ancillary_coordinate_system_4})

       Creates a grouped layer of feature classes depicting grid, graticule,
       and border features using predefined cartographic specifications. Grid
       layers are ideal for advanced grid definitions that are scale and
       extent specific.

    INPUTS:
     in_grid_xml (File):
         The XML grid definition template that stores the specification's
         graphic properties for each grid layer. In addition to the graphic
         properties, which cannot be altered before execution, the definition
         has specific default values, exposed as parameters, that can be
         modified before execution.
     area_of_interest (Feature Layer / Extent):
         The polygon feature layer or geographic extent used to determine the
         area over which the grid features are created.
     target_feature_dataset (Feature Dataset):
         The feature dataset that will store the grid features. Grid-specific
         feature classes will be created if they do not already exist. If they
         already exist, and a grid with the same name and type as the one being
         created also exists, it will be overwritten.
     grid_name {String / Field}:
         The name used to uniquely identify the grid. You can use a unique name
         for the grid or choose a field from the input area of interest feature
         layer.
     configure_layout {Boolean}:
         Adjusts the map, map frame, and layout settings to ensure they match
         the grid layer. The map's coordinate system as well as the map frame's
         scale, rotation, size, and extent can be altered to enforce
         consistency. This setting requires that a map frame is chosen from the
         map_frame parameter.CONFIGURE_LAYOUT-The data frame and layout are
         configured using grid
         settings.NO_CONFIGURE_LAYOUT-The data frame and layout are not
         configured. This
         is the default.
     layout {Layout}:
         The layout that contains the map frame to which the grid will be added
         when the configure_layout parameter is enabled. The layout can be in
         the active project or from an existing layout file.
     map_frame {String}:
         The map frame that will be updated. The map associated with the map
         frame can also be updated.
     reference_scale {Double}:
         The scale at which the grid is created and should be viewed.
         When the reference scale from the XML grid definition file is defined
         as Use Environment, the reference scale is derived in the following
         order:        The geoprocessing Reference Scale environment settingThe
         active data
         frame's reference scaleThe active data frame's scaleThe value from the
         XML grid definition file
     rotation {Double}:
         The rotation angle for the grid components. Rotation is used
         to create annotation features that are aligned with the page. Unless
         otherwise specified, rotation is calculated using the area of interest
         feature. When the rotation type from the XML grid definition file is
         defined as Use Environment, the rotation is derived in the following
         order:        The active data frame's rotationThe value from the XML
         grid definition
         file
     mask_size {Linear Unit}:
         The mask is a polygon feature that forms an outer ring around the
         extent of the neatline and is used to mask data that falls in the area
         reserved for coordinate labels. Mask size defines the width of the
         polygon mask feature in map or page units. The data frame may need to
         be resized to fit around the edge of the mask while including the
         coordinate labels.
     xy_tolerance {Linear Unit}:
         The minimum distance between geodatabase features, expressed in linear
         units. This value defaults to the value set in the grid XML. You can
         set higher values for data with less coordinate accuracy and lower
         values for data with extremely high accuracy. Features that fall
         within the set x,y tolerance will be considered coincident.
     primary_coordinate_system {Spatial Reference}:
         The primary coordinate system used to create grid features. The final
         product or data frame should use the same coordinate system. This
         coordinate system must be a projected coordinate system. When
         the primary coordinate system in the XML grid definition
         file is defined as Use Environment, the default primary coordinate
         system is derived in the following order:        The geoprocessing
         Cartographic Coordinate System environment
         settingThe active data frame's coordinate system if it is a projected
         coordinate systemThe Fixed value from the XML grid definition file
     ancillary_coordinate_system_1 {Spatial Reference}:
         The first of up to four ancillary coordinate systems used to create
         grid features. The grid template XML file specifies the number of
         ancillary grids.
     ancillary_coordinate_system_2 {Spatial Reference}:
         The second of up to four ancillary coordinate systems used to create
         grid features. The grid template XML file specifies the number of
         ancillary grids.
     ancillary_coordinate_system_3 {Spatial Reference}:
         The third of up to four ancillary coordinate systems used to create
         grid features. The grid template XML file specifies the number of
         ancillary grids.
     ancillary_coordinate_system_4 {Spatial Reference}:
         The fourth of up to four ancillary coordinate systems used to create
         grid features. The grid template XML file specifies the number of
         ancillary grids.

    OUTPUTS:
     out_layer_name (Group Layer):
         The name of the group layer that will be created to contain
         the symbolized grid and graticule feature classes. The group layer can
         be composed of the following layers for grid elements:        Mask
         (polygon)Clip (polygon)Segments (line)Gridlines (line)Ticks
         (line)Endpoints (point)Points (point)AnnotationThis is a temporary
         layer that you must save in the project or as a
         layer file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeGridsAndGraticulesLayer_topographic(
                *gp_fixargs(
                    (
                        in_grid_xml,
                        area_of_interest,
                        target_feature_dataset,
                        out_layer_name,
                        grid_name,
                        configure_layout,
                        layout,
                        map_frame,
                        reference_scale,
                        rotation,
                        mask_size,
                        xy_tolerance,
                        primary_coordinate_system,
                        ancillary_coordinate_system_1,
                        ancillary_coordinate_system_2,
                        ancillary_coordinate_system_3,
                        ancillary_coordinate_system_4,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PopulateMapSheetInfo_topographic", None)
def PopulateMapSheetInfo(
    in_layout=None,
    area_of_interest=None,
    lookup_table=None,
) -> Result1[str]:
    """PopulateMapSheetInfo_topographic(in_layout, area_of_interest, lookup_table)

       Populates text in graphic elements on a map layout.

    INPUTS:
     in_layout (Layout):
         The input layout that contains graphic elements with tagged text
         strings to be updated.
     area_of_interest (Feature Layer):
         A feature layer with a selection set containing one AOI feature. This
         parameter only accepts only polygon features. The tool writes
         attribute values from this feature to tagged text strings in defense-
         specific graphic elements.
     lookup_table (Table View):
         An input table that contains theandfields.
         Field_NameDM_Tag"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PopulateMapSheetInfo_topographic(*gp_fixargs((in_layout, area_of_interest, lookup_table), True))
        )
        return retval
    except Exception as e:
        raise e


# Data Management\Features toolset
@gptooldoc("ApplyFeatureLevelMetadata_topographic", None)
def ApplyFeatureLevelMetadata(
    in_features=None,
    in_metadata_table=None,
    metadata_favorite=None,
) -> Result1[str | Layer]:
    """ApplyFeatureLevelMetadata_topographic(in_features;in_features..., in_metadata_table, metadata_favorite)

       Applies values from a metadata record in the FeatureLevelMetadata
       table to selected features that have matching attribute fields.

    INPUTS:
     in_features (Feature Layer):
         The inputs to which the metadata_favorite parameter value will be
         applied.
     in_metadata_table (Table View):
         The path to the metadata table containing the records that will be
         used to populate attributes.
     metadata_favorite (String):
         The record that will be used to populate attributes. The available
         options depend on the records available in the metadata table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ApplyFeatureLevelMetadata_topographic(
                *gp_fixargs((in_features, in_metadata_table, metadata_favorite), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateDefaultValues_topographic", None)
def CalculateDefaultValues(
    in_datasets=None,
) -> Result1[str | Table | Layer]:
    """CalculateDefaultValues_topographic(in_datasets;in_datasets...)

       Replaces null values in a feature class or table with the default
       values from the geodatabase feature class.

    INPUTS:
     in_datasets (Table View / Feature Layer / Dataset):
         The feature classes and/or tables whose null values will be replaced
         with the default values from the data model."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateDefaultValues_topographic(*gp_fixargs((in_datasets,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateMetrics_topographic", None)
def CalculateMetrics(
    in_features=None,
    in_metric_types: list[Literal["LENGTH", "WIDTH", "AREA", "ANGLE_OF_ORIENTATION", "ELEVATION", "MGRS"]]
    | Literal["LENGTH", "WIDTH", "AREA", "ANGLE_OF_ORIENTATION", "ELEVATION", "MGRS"]
    | str
    | None = None,
    in_length_attributes=None,
    in_width_attributes=None,
    in_area_attributes=None,
    in_angle_attributes=None,
    in_elevation_attributes=None,
    in_precision=None,
    mgrs_attributes=None,
    mgrs_precision: Literal[
        "6x8 (4Q)",
        "100km (4QFJ)",
        "10km (4QFJ16)",
        "1km (4QFJ1267)",
        "100m (4QFJ123678)",
        "10m (4QFJ12346789)",
        "1m (4QFJ1234567890)",
        "Image City Map (1234)",
    ]
    | None = None,
    elevation_raster=None,
    only_populate_null_values: Literal["ONLYPOPNULLVALS", "NO_ONLYPOPNULLVALS"] | None = None,
) -> Result1[str | Layer]:
    """CalculateMetrics_topographic(in_features;in_features..., in_metric_types;in_metric_types..., {in_length_attributes}, {in_width_attributes}, {in_area_attributes}, {in_angle_attributes}, {in_elevation_attributes}, {in_precision}, {mgrs_attributes}, {mgrs_precision}, {elevation_raster}, {only_populate_null_values})

       Populates metrics for features in a geodatabase. Metrics include
       length, width, area, and elevation attributes.

    INPUTS:
     in_features (Feature Layer):
         The features for which metrics will be calculated.
     in_metric_types (String):
         Specifies the types of metrics that will be calculated.The Spatial
         Analyst extension is required when using an elevation
         raster and the ANGLE_OF_ORIENTATION option to rotate point features so
         that they face downhill.LENGTH-Length metrics will be
         calculated.WIDTH-Width metrics will be
         calculated.AREA-Area metrics will be
         calculated.ANGLE_OF_ORIENTATION-Angle of orientation metrics will be
         calculated.ELEVATION-Elevation metrics will be
         calculated.MGRS-Military Grid Reference System coordinates will be
         calculated.
     in_length_attributes {String}:
         A comma-delimited string of field names from which the length metrics
         will be calculated. The default is LEG,LEN,LEN_,LGN,LZN. You can add
         the names of other length metric fields; if the fields exist in the
         in_features value, they will be computed.
     in_width_attributes {String}:
         A comma-delimited string of field names from which the width metrics
         will be calculated. The default is WID,WID_,WGP. You can add the names
         of other width metric fields; if the fields exist in the in_features
         value, they will be computed.
     in_area_attributes {String}:
         A comma-delimited string of field names from which the area metrics
         will be calculated. The default is ARA,ARE,ARE_. You can add the names
         of other area metric fields; if the fields exist in the in_features
         value, they will be computed.
     in_angle_attributes {String}:
         A comma-delimited string of field names from which the angle of
         orientation metrics will be calculated. The default is AOO,DOF,FEO.
         You can add the names of other angle of orientation metric fields; if
         the fields exist in the in_features value, they will be computed.
     in_elevation_attributes {String}:
         A comma-delimited string of field names from which the elevation
         metrics will be calculated. The default is ZV2,ZVH. You can add the
         names of other elevation metric fields; if the fields exist in the
         in_features value, they will be computed.
     in_precision {Long}:
         The precision of the metrics written to the target attributes.
     mgrs_attributes {String}:
         A comma-delimited string of field names from which the MGRS
         coordinates will be calculated. The default is MGRSValue,MGRS. You can
         add the names of other MGRS fields; if the fields exist in the
         in_features value, they will be computed. The fields must have a
         String field type and a field length greater than the largest possible
         MGRS coordinate value.
     mgrs_precision {String}:
         Specifies the precision of the coordinates that will be calculated for
         the target attributes.6x8 (4Q)-The precision will be calculated at
         grid-level precision,
         typically the polygon formed by a 6-degree wide UTM zone and 8-degree
         high latitude bands.100km (4QFJ)-The precision will be calculated at
         100,000 meters
         squared.10km (4QFJ16)-The precision will be calculated at 10,000
         meters
         squared.1km (4QFJ1267)-The precision will be calculated at 1,000
         meters
         squared.100m (4QFJ123678)-The precision will be calculated at 100
         meters
         squared.10m (4QFJ12346789)-The precision will be calculated at 10
         meters
         squared.1m (4QFJ1234567890)-The precision will be calculated at 1
         meter
         squared.Image City Map (1234)-The precision will be calculated at the
         level of
         an Image City Map (ICM). This is the default.
     elevation_raster {Raster Layer / Mosaic Layer}:
         The raster file from which the elevation metrics will be derived.
         Elevation metrics derived from a raster file specified here will
         overwrite existing elevation data.The Spatial Analyst extension is
         required when using an elevation
         raster and the angle of orientation to rotate point features so that
         they face downhill.
     only_populate_null_values {Boolean}:
         Specifies whether only null metric values will be
         calculated.ONLYPOPNULLVALS-Only null values will be
         calculated.NO_ONLYPOPNULLVALS-All values will be calculated. This
         option will
         overwrite the existing values for the specified input attribute fields
         of the in_features parameter value. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateMetrics_topographic(
                *gp_fixargs(
                    (
                        in_features,
                        in_metric_types,
                        in_length_attributes,
                        in_width_attributes,
                        in_area_attributes,
                        in_angle_attributes,
                        in_elevation_attributes,
                        in_precision,
                        mgrs_attributes,
                        mgrs_precision,
                        elevation_raster,
                        only_populate_null_values,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MergeLinesByPseudoNode_topographic", None)
def MergeLinesByPseudoNode(
    input_features=None,
    merge_fields=None,
    aggregate_operations=None,
    merge_feature_rule: Literal["FIRST", "LAST", "BY_LENGTH", "USE_DEFAULTS"] | None = None,
) -> Result1[str | Layer]:
    """MergeLinesByPseudoNode_topographic(input_features, {merge_fields;merge_fields...}, {aggregate_operations;aggregate_operations...}, {merge_feature_rule})

       Dissolves features where pseudo nodes occur.

    INPUTS:
     input_features (Feature Layer):
         The line features from which pseudo nodes will be removed.
     merge_fields {Field}:
         The field or fields on which features will be merged.
     aggregate_operations {Value Table}:
         Specifies the fields that will be used to calculate the specified
         statistic. Multiple statistic and field combinations can be specified.
         Null values are excluded from all statistical calculations.Text
         attribute fields can be summarized using first and last
         statistics. Numeric attribute fields can be summarized using any
         statistic.Available statistic types are as follows:SUM-The total value
         for the specified field will be
         calculated.MEAN-The average for the specified field will be
         calculated.MIN-The smallest value for all records of the specified
         field will be
         found.MAX-The largest value for all records of the specified field
         will be
         found.RANGE-The range of values (maximum minus minimum) for the
         specified
         field will be calculated.STD-The standard deviation of values in the
         specified field will be
         calculated.COUNT-The number of values included in statistical
         calculations will
         be found. Each value will be counted except null values. To determine
         the number of null values in a field, create a count on the field in
         question, create a count on a different field that does not contain
         null values (for example, the OID if present), and subtract the two
         values.FIRST-The value of the first record in the input will be
         used.LAST-The value of the last record in the input will be
         used.MEDIAN-The median for all records of the specified field will be
         calculated.VARIANCE-The variance for all records of the specified
         field will be
         calculated.UNIQUE-The number of unique values of the specified field
         will be
         counted.
     merge_feature_rule {String}:
         Specifies which feature's attributes will be maintained when two
         features are merged at a pseudo node.FIRST-The feature with the lowest
         ObjectID and its attributes will be
         maintained while merging. The value for the fields with a specified
         aggregation operation will be updated with the calculated
         value.LAST-The feature with the highest ObjectID and its attributes
         will be
         maintained while merging. The value for the fields with a specified
         aggregation operation will be updated with the calculated
         value.BY_LENGTH-The feature with the longest length and its attributes
         will
         be maintained while merging. The value for the fields with a specified
         aggregation operation will be updated with the calculated
         value.USE_DEFAULTS-The feature with the lowest ObjectID will be
         maintained
         while merging. The value for the fields with a specified aggregation
         operation will be updated with the calculated value. The value for
         fields that are not merge fields or calculated with an aggregation
         operation will have the value assigned with the default value from the
         field or subtype when applicable."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MergeLinesByPseudoNode_topographic(
                *gp_fixargs((input_features, merge_fields, aggregate_operations, merge_feature_rule), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveCutbackVertices_topographic", None)
def RemoveCutbackVertices(
    in_features=None,
    minimum_angle=None,
    removal_method: Literal["SEQUENTIAL", "ALL"] | None = None,
    skip_coincident_vertices: Literal["SKIP_COINCIDENT", "REMOVE_COINCIDENT"] | None = None,
) -> Result1[str | Layer]:
    """RemoveCutbackVertices_topographic(in_features, minimum_angle, {removal_method}, {skip_coincident_vertices})

       Removes unwanted cutbacks from polyline and polygon features.

    INPUTS:
     in_features (Feature Layer):
         The polyline or polygon feature class from which cutback vertices will
         be removed. This feature class (or layer) will be modified.
     minimum_angle (Double):
         The minimum angle threshold value in degrees. The angle value should
         be within the range of 0-180. If the angle formed by a vertex and its
         two neighboring points is smaller than the specified minimum angle,
         the vertex is a candidate for cutback removal.
     removal_method {String}:
         Specifies whether cutbacks will be removed sequentially (individually)
         or all at once.SEQUENTIAL-Cutbacks will be removed sequentially for a
         feature. After
         a cutback is removed, the change in geometry is considered when
         determining cutbacks to the remaining vertices of a feature. This is
         the default.ALL-Cutbacks will be removed for all vertices at once.
     skip_coincident_vertices {Boolean}:
         Specifies whether cutback vertices will be removed when the vertex is
         snapped to another feature in the same feature
         class.SKIP_COINCIDENT-Cutback vertices with angles less than the
         minimum_angle value will not be removed from the feature geometry if
         they are snapped to other features.REMOVE_COINCIDENT-Cutback vertices
         will be removed without considering
         whether they are snapped to other features. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveCutbackVertices_topographic(
                *gp_fixargs((in_features, minimum_angle, removal_method, skip_coincident_vertices), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RepairSelfIntersection_topographic", None)
def RepairSelfIntersection(
    in_features=None,
    repair_type: Literal["DELETE", "SPLIT"] | None = None,
    max_length=None,
    repair_at_end_point: Literal["REPAIR_ENDS", "IGNORE_ENDS"] | None = None,
) -> Result1[str | Layer]:
    """RepairSelfIntersection_topographic(in_features, repair_type, {max_length}, {repair_at_end_point})

       Repairs self-intersecting line or polygon features. The portion
       between the feature and the intersection points are either deleted or
       split into a new feature.

    INPUTS:
     in_features (Feature Layer):
         The polyline or polygon feature class with the self-intersections that
         will be repaired.
     repair_type (String):
         Specifies whether self-intersections will be deleted or
         split.DELETE-Self-intersections will be deleted. This is the
         default.SPLIT-Self-intersections will be split at the intersection
         point and
         retained.
     max_length {Linear Unit}:
         The maximum length of the segment between the points of self-
         intersection. Only segments shorter than the specified maximum length
         will be removed.
     repair_at_end_point {Boolean}:
         Specifies whether self-intersections with an end point that snaps to
         itself will be removed.REPAIR_ENDS-Self-intersections with an end
         point that snaps to itself
         will be removed.IGNORE_ENDS-Self-intersections with an end point that
         snaps to itself
         (such as a cul-de-sac) will not be removed. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RepairSelfIntersection_topographic(
                *gp_fixargs((in_features, repair_type, max_length, repair_at_end_point), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SplitFeatures_topographic", None)
def SplitFeatures(
    cutting_features=None,
    target_features=None,
    use_target_z: Literal["USE_TARGET_Z", "DONT_USE_TARGET_Z"] | None = None,
) -> Result1[str | Layer]:
    """SplitFeatures_topographic(cutting_features, target_features;target_features..., use_target_z)

       Splits features on input feature classes for any number of polyline or
       polygon target feature classes using the cutting features, and inserts
       points on the cutting feature.

    INPUTS:
     cutting_features (Feature Layer):
         The cutting features that will be used to split the target features
         where they intersect the target feature class geometries.
     target_features (Feature Layer):
         The features that will be divided by the cutting features.
     use_target_z (Boolean):
         Specifies whether the z-value from the source or target will be
         used.USE_TARGET_Z-The z-value from the source or target will be
         used.DONT_USE_TARGET_Z-The z-value from the source or target will not
         be
         used. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SplitFeatures_topographic(*gp_fixargs((cutting_features, target_features, use_target_z), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateGeoNames_topographic", None)
def UpdateGeoNames(
    in_features=None,
    in_geonames_features=None,
    in_geonames_table=None,
    named_feature_id_field=None,
    name_id_field=None,
    name_field=None,
) -> Result1[str | Layer]:
    """UpdateGeoNames_topographic(in_features;in_features..., in_geonames_features, in_geonames_table, named_feature_id_field, name_id_field, name_field)

       Updates the name field on input features based on the information from
       GeoNames_FeaturesP and GEONAMES_TABLE.

    INPUTS:
     in_features (Feature Layer):
         The input features that will be updated. Each in_features value should
         have field names matching the values specified for the
         named_feature_id_field, name_id_field, and name_field parameters.
     in_geonames_features (Feature Layer):
         The input GeoNames features that identify unique named feature
         locations.
     in_geonames_table (Table View):
         A table containing name records related to the input GeoNames
         features.
     named_feature_id_field (Field):
         The field storing GeoNames named feature identifier values. These
         values should not be null or empty on the input features.
     name_id_field (Field):
         The field to store GeoNames name identifier values.
     name_field (Field):
         The field to store GeoNames name values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateGeoNames_topographic(
                *gp_fixargs(
                    (
                        in_features,
                        in_geonames_features,
                        in_geonames_table,
                        named_feature_id_field,
                        name_id_field,
                        name_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Data Management\Generalization toolset
@gptooldoc("EliminatePolygon_topographic", None)
def EliminatePolygon(
    in_features=None,
    surrounding_features=None,
    min_area=None,
) -> Result1[str | Layer]:
    """EliminatePolygon_topographic(in_features, surrounding_features;surrounding_features..., {min_area})

       Eliminates a polygon by merging it with the polygon from the
       surrounding features that it shares the longest boundary with.

    INPUTS:
     in_features (Feature Layer):
         The feature layers that contain the polygons to be deleted.
     surrounding_features (Feature Layer):
         The polygon features that theare compared against. If the
         feature is smaller than the, it becomes part of the input features.
         Input FeaturesMinimum Area
     min_area {Areal Unit}:
         Polygons smaller than thewill be deleted. If theis left blank,
         all features or a selection set from thewill be considered for
         elimination. Minimum AreaMinimum AreaInput Features"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EliminatePolygon_topographic(*gp_fixargs((in_features, surrounding_features, min_area), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportGeneralizedData_topographic", None)
def ExportGeneralizedData(
    input_geodatabase=None,
    target_geodatabase=None,
    rule_file=None,
    data_theme=None,
    export_visible_features: Literal["EXPORT_VISIBLE", "EXPORT_ALL"] | None = None,
) -> Result1[str]:
    """ExportGeneralizedData_topographic(input_geodatabase, target_geodatabase, rule_file, data_theme, {export_visible_features})

       Exports data generalized by the ArcGIS Production Mapping theme-based
       generalization models into a production schema using generalization
       rules defined in a Microsoft Excel spreadsheet.

    INPUTS:
     input_geodatabase (Workspace):
         The geodatabase containing data in the generalization schema.
     target_geodatabase (Workspace):
         The geodatabase where the generalized data will be loaded.
     rule_file (File):
         The Excel file containing the generalization rules. This file defines
         features participating in the generalization process and determines
         the data that will be loaded and how it is organized. An example rule
         file is provided in the product file downloads for Defense Mapping and
         Production Mapping.
     data_theme (String):
         A theme that specifies the type of data to be generalized.
         Available themes are automatically populated from theparameter. The
         values provided in the example rule file are as follows:
         Generalization Rule FileTRANS-A data theme that groups features in a
         transportation network
         such as roads and railways.STRUCTURE-A data theme that groups
         structural features such as
         buildings.HYDRO-A data theme that groups water features such as lakes
         and
         rivers.SOE-A skin of the earth data theme that groups polygon features
         that
         cover the entire surface of the earth with no holes or gaps. It can
         consist of water, vegetation, land, and artificial features.GENERAL-A
         data theme that groups features other than those defined by
         another theme.
     export_visible_features {Boolean}:
         Specifies whether features with a value of 1 in the visibility field
         will be exported to the target database.EXPORT_VISIBLE-Features with
         the visibility field set to 1 will not be
         exported.EXPORT_ALL-All features will be exported, regardless of the
         value in
         the visibility field. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportGeneralizedData_topographic(
                *gp_fixargs(
                    (input_geodatabase, target_geodatabase, rule_file, data_theme, export_visible_features), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FillGaps_topographic", None)
def FillGaps(
    input_features=None,
    max_gap_area=None,
    fill_option: Literal["FILL_BY_LENGTH", "FILL_BY_ORDER"] | None = None,
    fill_unenclosed_gaps: Literal["SKIP_UNENCLOSED_GAPS", "FILL_ALL"] | None = None,
    max_gap_distance=None,
) -> Result1[str | Layer]:
    """FillGaps_topographic(input_features;input_features..., max_gap_area, {fill_option}, {fill_unenclosed_gaps}, {max_gap_distance})

       Fills gaps between polygon features that participate in a topology
       where the coincident boundaries are evident.

    INPUTS:
     input_features (Feature Layer):
         A list of input polygon feature classes or layers to be analyzed for
         gaps.
     max_gap_area (Areal Unit):
         The maximum area that can be considered a gap. Areas larger than this
         threshold are not filled.
     fill_option {String}:
         Specifies how enclosed and unenclosed gaps are
         filled.FILL_BY_LENGTH-Gaps are filled by adding a gap's geometry to
         the
         polygon with the longest shared edge. This is the
         default.FILL_BY_ORDER-Gaps are filled sequentially according to the
         order of
         the input polygon features list.
     fill_unenclosed_gaps {Boolean}:
         Specifies whether the tool fills unenclosed
         gaps.SKIP_UNENCLOSED_GAPS-Only enclosed gaps are filled. Unenclosed
         gap are
         skipped. This is the default.FILL_ALL-Both enclosed and unenclosed
         gaps are filled.
     max_gap_distance {Linear Unit}:
         The maximum distance between features in which a gap can be filled.
         This parameter is used only when the fill_unenclosed_gaps parameter is
         set to FILL_ALL."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FillGaps_topographic(
                *gp_fixargs((input_features, max_gap_area, fill_option, fill_unenclosed_gaps, max_gap_distance), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("IdentifyNarrowPolygons_topographic", None)
def IdentifyNarrowPolygons(
    in_features=None,
    out_feature_class=None,
    min_width=None,
    min_length=None,
    taper_length=None,
    connecting_features=None,
) -> Result1[str]:
    """IdentifyNarrowPolygons_topographic(in_features, out_feature_class, min_width, min_length, {taper_length}, {connecting_features;connecting_features...})

       Splits a polygon based on its width and classifies each portion as
       narrow or wide based on its width and length.

    INPUTS:
     in_features (Feature Layer):
         The features to be split.
     min_width (Linear Unit):
         The width used to split and classify polygons as narrow or
         wide. Polygons will be split at any location where the edge-to-edge
         distance is equal to the. Minimum Width
     min_length (Linear Unit):
         The length used to classify the split polygons as short or long.
     taper_length {Linear Unit}:
         The distance the end of the split feature will extend to provide a
         more natural break.
     connecting_features {Feature Layer}:
         The features that will be used to refine the tapering of wide areas.
         The polygons will be tapered toward the touch point or the shared
         boundary of a connecting feature.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.IdentifyNarrowPolygons_topographic(
                *gp_fixargs(
                    (in_features, out_feature_class, min_width, min_length, taper_length, connecting_features), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportGeneralizationData_topographic", None)
def ImportGeneralizationData(
    input_geodatabase=None,
    target_geodatabase=None,
    rule_file=None,
    data_theme=None,
) -> Result1[str]:
    """ImportGeneralizationData_topographic(input_geodatabase, target_geodatabase, rule_file, data_theme)

       Imports data from a production schema to a themed generalization
       database using generalization rules defined in a Microsoft Excel
       spreadsheet.

    INPUTS:
     input_geodatabase (Workspace):
         The geodatabase containing data in a production schema.
     target_geodatabase (Workspace):
         The target geodatabase where the data optimized for generalization
         will be loaded.
     rule_file (File):
         The Excel file containing the generalization rules. This file defines
         features participating in the generalization process and determines
         the data that will be loaded and how it is organized. An example rule
         file is provided in the product file downloads for Defense Mapping and
         Production Mapping.
     data_theme (String):
         A theme that specifies the type of data to be generalized.
         Available themes are automatically populated from theparameter. The
         values provided in the example rule file are as follows:
         Generalization Rule FileTRANS-A data theme that groups features in a
         transportation network
         such as roads and railways.STRUCTURE-A data theme that groups
         structural features such as
         buildings.HYDRO-A data theme that groups water features such as lakes
         and
         rivers.SOE-A skin of the earth data theme that groups polygon features
         that
         cover the entire surface of the earth with no holes or gaps. It can
         consist of water, vegetation, land, and artificial features.GENERAL-A
         data theme that groups features other than those defined by
         another theme."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportGeneralizationData_topographic(
                *gp_fixargs((input_geodatabase, target_geodatabase, rule_file, data_theme), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PolygonToCenterline_topographic", None)
def PolygonToCenterline(
    in_features=None,
    out_feature_class=None,
    connecting_features=None,
) -> Result1[str]:
    """PolygonToCenterline_topographic(in_features, out_feature_class, {connecting_features;connecting_features...})

       Creates centerlines from polygon features. This tool is useful for
       creating centerlines from hydrographic polygons for use at smaller
       scales.

    INPUTS:
     in_features (Feature Layer):
         The polygon features that will be used to create the centerline.
     connecting_features {Feature Layer}:
         The features that will be used to ensure connectivity of the
         centerline with other features in a network. The centerline will link
         to the point or the shared boundary wherever a feature from a
         connecting feature class touches the input feature.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class for the centerlines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PolygonToCenterline_topographic(*gp_fixargs((in_features, out_feature_class, connecting_features), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveSmallLines_topographic", None)
def RemoveSmallLines(
    in_features=None,
    minimum_length=None,
    maximum_angle=None,
    in_intersecting_features=None,
    recursive: Literal["RECURSIVE", "NON_RECURSIVE"] | None = None,
    split_input_lines: Literal["SPLIT", "NO_SPLIT"] | None = None,
) -> Result1[str | Layer]:
    """RemoveSmallLines_topographic(in_features, minimum_length, {maximum_angle}, {in_intersecting_features;in_intersecting_features...}, {recursive}, {split_input_lines})

       Removes lines that are shorter than a specified minimum length and do
       not connect to other features on one end.

    INPUTS:
     in_features (Feature Layer):
         The features that will have small lines removed.
     minimum_length (Linear Unit):
         The minimum length for input lines. Features shorter than this
         distance will be removed.
     maximum_angle {Long}:
         Any line below the minimum length that is within the defined angle of
         a consecutive line segment will be kept. The angle value must be
         within the range of 0-180.
     in_intersecting_features {Feature Layer}:
         Additional intersecting features that the input features can be
         compared to when determining whether the feature is a small line.
     recursive {Boolean}:
         Specifies whether small lines on the line features will be
         removed.NON_RECURSIVE-All the small lines on line features will be
         removed.
         The remaining lines will not be analyzed to determine whether they are
         small lines. This is the default.RECURSIVE-The small lines will be
         removed from the line features and
         the remaining lines will be analyzed to determine whether they are
         small lines. If they do not meet the minimum_length value, they will
         be identified as small lines and removed.
     split_input_lines {Boolean}:
         Specifies whether the input line features will be split at all
         intersections before determining the small lines to remove.SPLIT-All
         lines in the input feature class will be split at
         intersections to ensure topological integrity. The length of the split
         features, not the original feature geometries, will be used when
         applying the minimum length value to determine small lines. This is
         the default.NO_SPLIT-The lines will not be split before determining
         the lines to
         remove. The length of the input feature geometries will be used when
         applying the minimum length value to determine small lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveSmallLines_topographic(
                *gp_fixargs(
                    (
                        in_features,
                        minimum_length,
                        maximum_angle,
                        in_intersecting_features,
                        recursive,
                        split_input_lines,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetLineDirection_topographic", None)
def SetLineDirection(
    in_line_features=None,
    digital_elevation_model=None,
    line_direction: Literal["DOWNHILL", "DOWNHILL_FLOW", "DOWNHILL_SPLIT_FLOW"] | None = None,
    reverse_direction: Literal["REVERSE_DIRECTION", "KEEP_DIRECTION"] | None = None,
    vertical_tolerance=None,
) -> Result1[str | Layer]:
    """SetLineDirection_topographic(in_line_features, digital_elevation_model, {line_direction}, {reverse_direction}, {vertical_tolerance})

       Sets the direction of line segments to match the slope direction of
       underlying elevation features. The direction of a line is used by some
       of the generalization and cartography tools.

    INPUTS:
     in_line_features (Feature Layer):
         The line features that will be modified.
     digital_elevation_model (Raster Layer / Mosaic Layer):
         The input elevation surface that will be used to evaluate the
         in_line_features parameter value.
     line_direction {String}:
         Specifies how the direction of the line segments will be
         set.DOWNHILL-The line segment direction will be
         downhill.DOWNHILL_FLOW-The
         line segment direction will use a flow network
         created by the input line features and adopt the direction from high
         values to low values. This is the default.DOWNHILL_SPLIT_FLOW-The same
         as Downhill Flow, except that the line
         features may split at hill tops or junctions to ensure the direction
         of flow with regard to vertical tolerance. This option may create new
         features.
     reverse_direction {Boolean}:
         Specifies whether the line features will be reversed along the flow
         direction.KEEP_DIRECTION-The line direction will be maintained. This
         is the
         default.REVERSE_DIRECTION-The line direction will be reversed.
     vertical_tolerance {Linear Unit}:
         The minimum difference in elevation between raster values before they
         are considered equal. The default is 0 meters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetLineDirection_topographic(
                *gp_fixargs(
                    (in_line_features, digital_elevation_model, line_direction, reverse_direction, vertical_tolerance),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ThinHydrologyLines_topographic", None)
def ThinHydrologyLines(
    in_features=None,
    invisibility_field=None,
    min_length=None,
    min_spacing=None,
    hierarchy_field=None,
    intersecting_features=None,
    unsplit_lines: Literal["UNSPLIT_LINES", "NO_UNSPLIT_LINES"] | None = None,
    use_angles: Literal["USE_ANGLES", "NO_USE_ANGLES"] | None = None,
) -> Result1[str | Layer]:
    """ThinHydrologyLines_topographic(in_features, invisibility_field, min_length, {min_spacing}, {hierarchy_field}, {intersecting_features;intersecting_features...}, {unsplit_lines}, {use_angles})

       Generates a simplified hydrographic line network for display at a
       smaller scale. The resulting hydrographic network maintains the main
       arteries while thinning less significant features based on hierarchy,
       length, and spacing between features.

    INPUTS:
     in_features (Feature Layer):
         The hydrography line feature to be thinned.
     invisibility_field (Field):
         Features that participate in the thinned hydrography collection will
         have a value of 0. Those that are extraneous have a value of 1. A
         layer definition query can be used to display the results.
     min_length (Linear Unit):
         An indication of the shortest hydrographic segment that is sensible to
         display at the output scale. It defines a sense of the resolution or
         granularity of the resulting thinned hydrography. It should correspond
         to a length that is visually significant to include at the final
         scale. The results of this tool are a balanced compromise between the
         requirements posed by hierarchy, minimum length, minimum spacing,
         angle of connecting features, and directionality of the hydro
         geometry. Therefore, the minimum length value cannot necessarily be
         measured directly in the resulting feature set.
     min_spacing {Linear Unit}:
         An indication of the shortest distance between a hydrographic segment
         that is sensible to display at the output scale. If the spacing
         between two parallel trending features is smaller than this value, one
         of the features will be set as invisible. It defines a sense of the
         density of the resulting thinned hydrography. It should correspond to
         the distance between two parallel trending features that is visually
         significant to include at the final scale. When the density of
         features is too high (that is, the features are too closely spaced),
         at least one feature will be hidden. This can result in important
         features or features longer than the min_length being hidden.
         An indication of the shortest distance between a hydrographic
         segment that is sensible to display at the output scale. If the
         spacing between two parallel trending features is smaller than this
         value, one of the features will be set as invisible. It defines a
         sense of the density of the resulting thinned hydrography. It should
         correspond to the distance between two parallel trending features that
         is visually significant to include at the final scale. When the
         density of features is too high (that is, the features are too closely
         spaced), at least one feature will be hidden. This can result in
         important features or features longer than thebeing hidden.
         Minimum Length
     hierarchy_field {Field}:
         This field contains the hierarchical ranking of feature importance,
         where 1 is very important, and larger integers reflect decreasing
         importance. A value of 0 forces the feature to remain visible in the
         final results. It identifies the relative importance of features to
         help establish which features are significant. For optimal results,
         use no more than five levels of hierarchy. Input features with
         Hierarchy = 0 are considered locked and will remain visible, along
         with adjacent features necessary for connectivity.
     intersecting_features {Feature Layer}:
         If a segment is snapped to features in the provided layers, it will
         not be removed. An example would be a small river segment snapped to a
         lake. Even if the segment is under the min_length, it would need to
         remain to ensure that it remains connected to the water body into
         which it flows.
     unsplit_lines {Boolean}:
         This will merge any split features in the in_features to help ensure
         that the main waterway is preserved. If set to NO_UNSPLIT_LINES, the
         ends of the waterway may be removed due to them being under the
         min_length.UNSPLIT_LINES-Features that are closed on both end points
         will be
         merged before thinning to preserve main hydrographic arteries that
         traverse a long distance. This is the
         default.NO_UNSPLIT_LINES-Features will remain split before the
         thinning
         process.
     use_angles {Boolean}:
         If set to USE_ANGLES, the angles between waterway branches will be
         used to help determine the main waterway; the highest angle will be
         used. If disabled, the longest branch will be considered part of the
         main waterway.USE_ANGLES-In junctions with 3 or more waterways,
         features that are
         closer together in angle will be kept.NO_USE_ANGLES-In junctions with
         3 or more waterways, features that are
         longer will be kept. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ThinHydrologyLines_topographic(
                *gp_fixargs(
                    (
                        in_features,
                        invisibility_field,
                        min_length,
                        min_spacing,
                        hierarchy_field,
                        intersecting_features,
                        unsplit_lines,
                        use_angles,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Data Management\Geodatabase toolset
@gptooldoc("CreateCrossReferenceGeodatabase_topographic", None)
def CreateCrossReferenceGeodatabase(
    source_workspace=None,
    target_database=None,
    out_database=None,
    mapping_file=None,
) -> Result1[str]:
    """CreateCrossReferenceGeodatabase_topographic(source_workspace, target_database, out_database, {mapping_file})

       Creates a cross-reference geodatabase that the Load Data tool uses to
       map source data to target data when loading batch data.

    INPUTS:
     source_workspace (LocalDatabase|RemoteDatabase|FileSystem):
         The workspace, either a geodatabase or shapefile directory, that
         contains the schema of data that will be mapped to the target
         workspace.
     target_database (Workspace):
         The geodatabase that contains the schema of the database to which the
         source will be mapped.
     mapping_file {File}:
         An Excel spreadsheet that contains information on how the source
         features, fields, and attribute value will be mapped to the
         target_database parameter value.

    OUTPUTS:
     out_database (Workspace):
         The file geodatabase that will be created containing the mapping from
         the source_workspace parameter value to the target_database parameter
         value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateCrossReferenceGeodatabase_topographic(
                *gp_fixargs((source_workspace, target_database, out_database, mapping_file), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportMetadata_topographic", None)
def ExportMetadata(
    in_cell_features=None,
    export_location=None,
    metadata_type: Literal["MGCP", "MUVD"] | None = None,
) -> Result1[str]:
    """ExportMetadata_topographic(in_cell_features, export_location, {metadata_type})

       Exports a Multinational Geospatial Co-production Program (MGCP) or
       MGCP Urban Vector Data (MUVD) metadata dataset (Cell or ResourceSrf,
       Subregion, and Source feature classes) to an .xml file.

    INPUTS:
     in_cell_features (Feature Layer):
         The MGCP Cell or ResourceSrf feature layer that will be exported.
     export_location (Folder):
         The directory where the metadata .xml files will be created.
     metadata_type {String}:
         Specifies the type of metadata that will be
         exported.MGCP-Multinational Geospatial Co-production Program metadata
         will be
         exported. This is the default.MUVD-MGCP Urban Vector Data metadata
         will be exported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportMetadata_topographic(*gp_fixargs((in_cell_features, export_location, metadata_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractDataByFeature_topographic", None)
def ExtractDataByFeature(
    in_datasets=None,
    target_gdb=None,
    reuse_schema: Literal["REUSE", "DO_NOT_REUSE"] | None = None,
    filter_feature=None,
    filter_type: Literal["INTERSECTS", "CONTAINS", "CLIP"] | None = None,
    checkout_replica: Literal["CHECKOUT_REPLICA", "DO_NOT_CHECKOUT_REPLICA"] | None = None,
    replica_name=None,
    expand_feature_classes_and_tables: Literal["USE_DEFAULTS", "ADD_WITH_SCHEMA_ONLY", "ALL_ROWS", "DO_NOT_ADD"]
    | None = None,
    get_related_data: Literal["GET_RELATED", "DO_NOT_GET_RELATED"] | None = None,
    excluded_rel_classes=None,
    where_clause=None,
) -> Result1[str]:
    """ExtractDataByFeature_topographic(in_datasets;in_datasets..., target_gdb, {reuse_schema}, {filter_feature}, {filter_type}, {checkout_replica}, {replica_name}, {expand_feature_classes_and_tables}, {get_related_data}, {excluded_rel_classes;excluded_rel_classes...}, {where_clause})

       Extracts features from multiple input feature classes into a target
       database.

    INPUTS:
     in_datasets (Value Table):
         A value table of rows that contain a dataset to extract and a filter
         option for that dataset. Specifying a filter option allows you to
         control how rows are replicated in each dataset. The following are the
         filter options:Dataset-The schema of the dataset will be extracted to
         the child
         workspace. Rows option-Specifies whether all rows, only the
         schema, or
         features that match filter criteria will be extracted.
         ALL_ROWS-All rows of the dataset will be extracted to the child
         workspace.SCHEMA_ONLY-Only the schema of the dataset will be extracted
         to the
         child workspace.USE_FILTERS-If a feature layer is specified for the
         filter_feature
         parameter, features that either intersect or are contained by features
         in the filter_feature parameter value will be extracted.
     target_gdb (Workspace / GeoDataServer):
         The workspace into which data will be extracted.
     reuse_schema {Boolean}:
         Specifies whether the schema of the data that will be extracted will
         be reused. This reduces the amount of time required to extract the
         data. This parameter is only supported for file geodatabases.REUSE-The
         schema will be reused.DO_NOT_REUSE-The schema will not be
         reused. This is the default.
     filter_feature {Layer}:
         A feature layer with one selected feature that will be used to limit
         the extent of the extracted data.
     filter_type {String}:
         Specifies the spatial relationship between the filter_feature and
         in_datasets parameter values and how that relationship will be
         filtered. The spatial relationship is applied to data in an extent
         defined by the area of interest (AOI) specified in the filter_feature
         parameter.INTERSECTS-Features in the in_datasets parameter value that
         intersect
         features in the filter_feature parameter value will be
         extracted.CONTAINS-Features in the in_datasets parameter value that
         are
         contained by the selected feature in the filter_feature parameter
         value will be extracted.CLIP-Features in the in_datasets parameter
         value that intersect
         features in the filter_feature parameter value will be extracted, the
         features will be split at the AOI boundary, and only the features
         within the AOI will be kept.
     checkout_replica {Boolean}:
         Specifies whether the replica will be checked out, replicated, edited,
         and checked back in one time.CHECKOUT_REPLICA-The replica will be
         checked
         out.DO_NOT_CHECKOUT_REPLICA-The replica will not be checked out. This
         is
         the default.
     replica_name {String}:
         The name of the replica that will be checked out.
     expand_feature_classes_and_tables {String}:
         Specifies whether expanded feature classes and tables-such as those in
         networks, topologies, or relationship classes-will be
         added.USE_DEFAULTS-The expanded feature classes and tables related to
         the
         feature classes and tables in the replica will be added. The default
         for feature classes is to replicate all features intersecting the
         spatial filter. If no spatial filter has been provided, all features
         are included. The default for tables is to replicate only the
         schema.ADD_WITH_SCHEMA_ONLY-Only the schema for the expanded feature
         classes
         and tables will be added.ALL_ROWS-All rows for expanded feature
         classes and tables will be
         added.DO_NOT_ADD-No expanded feature classes and tables will be added.
         This
         is the default.
     get_related_data {Boolean}:
         Specifies whether rows related to existing rows in the replica will be
         replicated. For example, consider a feature (f1) inside the
         replication filter and a related feature (f2) from another class
         outside the filter. Feature f2 will be included in the replica if you
         choose to get related data.DO_NOT_GET_RELATED-Related data will not be
         replicated. This is the
         default.GET_RELATED-Related data will be replicated.
     excluded_rel_classes {Relationship Class}:
         The relationship classes with the relationships to exclude from
         extraction. The relationship classes will still be included if both
         datasets that participate are present, but the related objects are not
         extracted.
     where_clause {SQL Expression}:
         An SQL expression that is used to further refine results from the AOI
         extraction."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractDataByFeature_topographic(
                *gp_fixargs(
                    (
                        in_datasets,
                        target_gdb,
                        reuse_schema,
                        filter_feature,
                        filter_type,
                        checkout_replica,
                        replica_name,
                        expand_feature_classes_and_tables,
                        get_related_data,
                        excluded_rel_classes,
                        where_clause,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateExcelFromGeodatabase_topographic", None)
def GenerateExcelFromGeodatabase(
    in_geodatabase=None,
    out_excel_file=None,
) -> Result1[str]:
    """GenerateExcelFromGeodatabase_topographic(in_geodatabase, out_excel_file)

       Creates a Microsoft Excel file (.xls or .xlsx) from the contents of a
       geodatabase.

    INPUTS:
     in_geodatabase (Workspace):
         The geodatabase that will be used to create the Excel spreadsheet.

    OUTPUTS:
     out_excel_file (File):
         The Excel file that will be created from the geodatabase."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateExcelFromGeodatabase_topographic(*gp_fixargs((in_geodatabase, out_excel_file), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateGeodatabaseFromExcel_topographic", None)
def GenerateGeodatabaseFromExcel(
    in_excel_file=None,
    out_geodatabase=None,
) -> Result1[str]:
    """GenerateGeodatabaseFromExcel_topographic(in_excel_file, out_geodatabase)

       Creates a geodatabase from the contents of a Microsoft Excel file
       (.xls or .xlsx).

    INPUTS:
     in_excel_file (File):
         The Excel file that will be used to generate the geodatabase.
     out_geodatabase (Workspace):
         The geodatabase that will be generated from the Excel file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateGeodatabaseFromExcel_topographic(*gp_fixargs((in_excel_file, out_geodatabase), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GeoNamesToGeodatabase_topographic", None)
def GeoNamesToGeodatabase(
    in_source=None,
    in_feature_class=None,
    in_allow_duplicates: Literal["ALLOW_DUPLICATES", "DON'T_ALLOW_DUPLICATES"] | None = None,
    in_table=None,
    match_fields=None,
) -> Result2[str, str]:
    """GeoNamesToGeodatabase_topographic(in_source, in_feature_class, in_allow_duplicates, in_table, {match_fields;match_fields...})

       Loads GeoNames data into a feature class and table. The feature class
       is composed of point features, and the table contains fields with
       information concerning the naming conventions used for the features.
       The feature class contains the Unique Feature Identifier (UFI) and
       Unique Name Identifier (UNI) fields, which match the same fields in
       the GeoNames table.

    INPUTS:
     in_source (Text File / Shapefile):
         The path to the source file containing the GeoNames information. This
         must be a properly formatted GeoNames file.
     in_feature_class (Feature Class):
         The GeoNames feature class. This feature class is in the working
         database.
     in_allow_duplicates (Boolean):
         Specifies whether duplicate features will be imported to the GeoNames
         feature class.ALLOW_DUPLICATES-Features with the same geometry and
         attributes will
         be imported.DON'T_ALLOW_DUPLICATES-Features with the same geometry and
         attributes
         will not be imported. This is the default.
     in_table (Table):
         The GeoNames table. This table is in the working database.
     match_fields {Value Table}:
         Specific fields in the GeoNames source file that will be mapped to
         fields in the GeoNames feature class and table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeoNamesToGeodatabase_topographic(
                *gp_fixargs((in_source, in_feature_class, in_allow_duplicates, in_table, match_fields), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GeodatabaseToShape_topographic", None)
def GeodatabaseToShape(
    in_features=None,
    output_folder=None,
    coded_value_domain_export_mode: Literal["VALUES", "DESCRIPTIONS", "VALUES_AND_DESCRIPTIONS"] | None = None,
    conversion_method: Literal[
        "DEFENSE_BY_FEATURECLASS", "DEFENSE_BY_SUBTYPE", "GENERIC_BY_FEATURECLASS", "GENERIC_BY_SUBTYPE", "MGCP", "MUVD"
    ]
    | None = None,
    create_empties: Literal["NO_CREATE_EMPTIES", "CREATE_EMPTIES"] | None = None,
) -> Result1[str]:
    """GeodatabaseToShape_topographic(in_features;in_features..., output_folder, coded_value_domain_export_mode, conversion_method, create_empties)

       Exports one or more feature classes in a geodatabase to shapefiles
       using one of three modes: defense, generic, and Multinational
       Geospatial Co-Production Program (MGCP).

    INPUTS:
     in_features (Feature Layer):
         The features used to create the shapefiles.
     output_folder (Folder):
         The folder that will contain the output shapefiles.
     coded_value_domain_export_mode (String):
         Specifies the method that will be used to export coded domain
         values.DESCRIPTIONS-Coded domain values will be exported using their
         descriptions rather than raw values.VALUES-Coded domain values will be
         exported as raw values. This is the
         default.VALUES_AND_DESCRIPTIONS-Coded domain values will be exported
         as raw
         values and string descriptions
     conversion_method (String):
         Specifies the conversion method that will be
         applied.DEFENSE_BY_FEATURECLASS-A shapefile will be created based on
         the
         feature class name and trailing underscores will be removed from
         fields.DEFENSE_BY_SUBTYPE-A shapefile will be created based on the
         subtype
         name, attributes applicable to that subtype will be exported, and
         trailing underscores will be removed from fields. This is the
         default.GENERIC_BY_FEATURECLASS-A shapefile will be created for each
         feature
         class selected. The shapefile name must match the feature class
         name.GENERIC_BY_SUBTYPE-A shapefile will be created for each subtype
         of the
         feature class selected. The shapefile name must match the subtype
         name.MGCP-A shapefile will be created based on the feature class
         subtype.
         The exported shapefile will be named using the geometry type prefix,
         for example, S for surface features, L for line features, P for point
         features, and the feature code. For example, the river subtype BH140
         in the WatrcrsL feature class would be exported to a shapefile named
         LBH140.MUVD-A shapefile will be created based on the feature class
         subtype.
         The exported shapefile will be named using the geometry type prefix,
         for example, S for surface features, C for curve features, P for point
         features, and the feature code. For example, the river subtype BH140
         in the WatercrsL feature class would be exported to a shapefile named
         CBH140.
     create_empties (Boolean):
         Specifies whether empty shapefiles will be created if the input
         feature classes are empty.CREATE_EMPTIES-Empty shapefiles will be
         created if the corresponding
         input feature classes are empty.NO_CREATE_EMPTIES-Empty shapefiles
         will not be created if the
         corresponding input feature classes are empty. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeodatabaseToShape_topographic(
                *gp_fixargs(
                    (in_features, output_folder, coded_value_domain_export_mode, conversion_method, create_empties),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportMetadata_topographic", None)
def ImportMetadata(
    files=None,
    in_cell_features=None,
    metadata_type: Literal["MGCP", "MUVD"] | None = None,
) -> Result1[str | Layer]:
    """ImportMetadata_topographic(files;files..., in_cell_features, {metadata_type})

       Imports Multinational Geospatial Co-production Program (MGCP) or MGCP
       Urban Vector Data (MUVD) metadata to an MGCP or MUVD database.

    INPUTS:
     files (File):
         The .xml files that contain the metadata that will be imported.
     in_cell_features (Feature Layer):
         The Cell or ResourceSrf feature class where the metadata will be
         imported.
     metadata_type {String}:
         Specifies the type of metadata that will be
         imported.MGCP-Multinational Geospatial Co-production Program metadata
         will be
         imported. This is the default.MUVD-MGCP Urban Vector Data metadata
         will be imported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportMetadata_topographic(*gp_fixargs((files, in_cell_features, metadata_type), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LoadData_topographic", None)
def LoadData(
    in_cross_reference=None,
    in_sources=None,
    in_target=None,
    in_dataset_map_defs=None,
    row_level_errors: Literal["ROW_LEVEL_ERROR_LOGGING", "NO_ROW_LEVEL_ERROR_LOGGING"] | None = None,
) -> Result1[str]:
    """LoadData_topographic(in_cross_reference, in_sources;in_sources..., in_target, {in_dataset_map_defs;in_dataset_map_defs...}, {row_level_errors})

       Moves features from one schema to another by loading data from a
       source to a target workspace. Data mapping rules described in a
       cross-reference database are applied during loading.

    INPUTS:
     in_cross_reference (Workspace):
         The path to a cross-reference database.
     in_sources (Workspace):
         A list of workspaces that contain the source features that will be
         loaded into the target workspace.
     in_target (Workspace):
         The target workspace that contains the schema referenced in the cross-
         reference database. Source features are loaded into this workspace.
     in_dataset_map_defs {String}:
         The source to target feature class mapping list. The format of this
         string is id | SourceDataset | TargetDataset | WhereClause | Subtype.
     row_level_errors {Boolean}:
         Specifies whether the tool will log errors that occur while inserting
         new rows into feature classes and tables in the in_target
         parameter.ROW_LEVEL_ERROR_LOGGING-Errors that occur during individual
         row-level
         inserts will be logged. This is the
         default.NO_ROW_LEVEL_ERROR_LOGGING-Errors that occur during individual
         row-
         level inserts will not be logged."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LoadData_topographic(
                *gp_fixargs((in_cross_reference, in_sources, in_target, in_dataset_map_defs, row_level_errors), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UnzipCellAndImport_topographic", None)
def UnzipCellAndImport(
    Root_Folder=None,
    Target_Geodatabase=None,
) -> Result1[str]:
    """UnzipCellAndImport_topographic(Root_Folder, Target_Geodatabase)

       Unzips and imports compressed Multinational Geospatial Co-production
       Program (MGCP) 1-degree-by-1-degree cell packages (*.zip) into a
       target geodatabase.

    INPUTS:
     Root_Folder (Folder):
         The root folder that contains one or more compressed shapefile cell
         packages in a .zip file.
     Target_Geodatabase (Workspace):
         The geodatabase where the unzipped shapefiles will be imported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UnzipCellAndImport_topographic(*gp_fixargs((Root_Folder, Target_Geodatabase), True))
        )
        return retval
    except Exception as e:
        raise e


# Data Management\Topology toolset
@gptooldoc("ExportTopology_topographic", None)
def ExportTopology(
    topology=None,
    location=None,
    file_name=None,
) -> Result1[str]:
    """ExportTopology_topographic(topology, location, file_name)

       Exports a topology from a geodatabase to an .xml file.

    INPUTS:
     topology (Topology / Topology Layer):
         An existing topology in a geodatabase. All feature classes that
         participate in this topology will be listed in the output .xml file.
     location (Folder):
         The folder in which the .xml file will be written.
     file_name (String):
         The name of the topology .xml file that will be created by the tool."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportTopology_topographic(*gp_fixargs((topology, location, file_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportTopology_topographic", None)
def ImportTopology(
    in_feature_dataset=None,
    topology_definition_file=None,
) -> Result1[str]:
    """ImportTopology_topographic(in_feature_dataset, topology_definition_file)

       Creates a geodatabase topology from a definition .xml file generated
       by the Export Topology tool in the Topographic Production toolbox.

    INPUTS:
     in_feature_dataset (Feature Dataset):
         The feature dataset in which the topology will be created. The feature
         dataset must contain the feature classes listed in the
         topology_definition_file.
     topology_definition_file (File):
         The .xml file that contains the topology definition."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportTopology_topographic(*gp_fixargs((in_feature_dataset, topology_definition_file), True))
        )
        return retval
    except Exception as e:
        raise e


# Data Management\Validation toolset
@gptooldoc("GAIT_topographic", None)
def GAIT(
    in_features=None,
    gait_exe=None,
    folder=None,
    schema=None,
    project=None,
    format=None,
    metadata: Literal["META_ESRI", "META_INGR", "META_MGCPNGA"] | None = None,
    silent: Literal["SILENT", "VERBOSE"] | None = None,
    reviewer_workspace=None,
    specfile=None,
) -> Result1[str | Table | Layer]:
    """GAIT_topographic(in_features;in_features..., gait_exe, folder, schema, project, format, metadata, silent, {reviewer_workspace}, {specfile})

       Validates data using the Geospatial Analysis Integrity Tool (GAIT),
       checking geometry, feature codes, attribute values and domains, and
       metadata.

    INPUTS:
     in_features (Table View / Feature Layer):
         The features to validate.
     gait_exe (File):
         The path to the GAIT executable file.
     folder (Folder):
         The shapefile export directory.
     schema (String):
         The data model that corresponds to the data displayed in the input
         feature layer.
     project (String):
         The name of the project. The project contains validation information,
         such as the checks run on the data and the results.
     format (String):
         The set of checks to run on the data. This is specific to the data
         model listed in the attribution schema.
     metadata (String):
         The metadata mapping table that corresponds to the data model of the
         input feature layer and the attribution schema.META_ESRI-Esri
         metadataMETA_INGR-Intergraph metadataMETA_MGCPNGA-MGCP
         NGA metadata
     silent (Boolean):
         Indicates the amount of output messages to return from
         GAIT.exe.SILENT-Limit messaging from GAIT.exe. This is the
         default.VERBOSE-Run
         GAIT.exe in verbose mode.
     reviewer_workspace {Workspace}:
         The workspace to write the output features. Each shapefile result
         record is written to the reviewer table in this workspace.
     specfile {File}:
         A file that defines custom checks."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GAIT_topographic(
                *gp_fixargs(
                    (
                        in_features,
                        gait_exe,
                        folder,
                        schema,
                        project,
                        format,
                        metadata,
                        silent,
                        reviewer_workspace,
                        specfile,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Workflow\Data Management toolset
@gptooldoc("CopyJobFiles_topographic", None)
def CopyJobFiles(
    job_id=None,
    source_path=None,
    target_path=None,
    archive_source: Literal["ARCHIVE", "NO_ARCHIVE"] | None = None,
    delete_source: Literal["DELETE_SOURCE", "NO_DELETE_SOURCE"] | None = None,
    create_job_folder: Literal["CREATE_JOB_FOLDER", "NO_CREATE_JOB_FOLDER"] | None = None,
    database_path=None,
) -> Result1[str]:
    """CopyJobFiles_topographic(job_id, source_path, target_path, {archive_source}, {delete_source}, {create_job_folder}, {database_path})

       Copies Workflow Manager (Classic) job files to and from a local
       machine and a shared directory for processing.

    INPUTS:
     job_id (Long):
         The Job ID of the Workflow Manager (Classic) job that will be updated.
     source_path (Folder):
         The path to the folder containing the files to be copied.
     target_path (Folder):
         The path to the location where the files will be copied.
     archive_source {Boolean}:
         Specifies whether the files in the source path will be zipped before
         copying to the target location.ARCHIVE-A .zip file with the contents
         of the source directory will be
         created and copied to the target location.NO_ARCHIVE-The contents of
         the source directory will be copied
         directly to the target location. This is the default.
     delete_source {Boolean}:
         Specifies whether the files in the source path will be deleted after
         the files are copied to the target location.DELETE_SOURCE-The source
         directory and all its contents will be
         deleted after the files are copied.NO_DELETE_SOURCE-The source
         directory will not be deleted after the
         files are copied. This is the default.
     create_job_folder {Boolean}:
         Specifies whether a folder will be created in the target path for
         containing the copied files.CREATE_JOB_FOLDER-A folder will be created
         in the target path with the
         name of the chosen job. Files are copied from the source path to this
         new folder.NO_CREATE_JOB_FOLDER-A folder will not be created, and
         files from the
         source path will be copied directly to the target path. This is the
         default.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CopyJobFiles_topographic(
                *gp_fixargs(
                    (job_id, source_path, target_path, archive_source, delete_source, create_job_folder, database_path),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTaskGroupJobs_topographic", None)
def CreateTaskGroupJobs(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """CreateTaskGroupJobs_topographic(job_id, {database_path})

       Creates task group jobs based on the properties of an existing job.

    INPUTS:
     job_id (Long):
         The job ID of the ArcGIS Workflow Manager (Classic) job that will have
         dependencies set.
     database_path {File}:
         The Workflow Manager (Classic) database connection file that contains
         the job information. If no connection file is specified, the default
         Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateTaskGroupJobs_topographic(*gp_fixargs((job_id, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GetFeaturesByJobAOI_topographic", None)
def GetFeaturesByJobAOI(
    job_id=None,
    source_database=None,
    target_database=None,
    extract_operation: Literal["EXTRACT_DATA", "REPLICATE_DATA"] | None = None,
    filter_feature=None,
    filter_type: Literal["INTERSECTS", "CONTAINS", "CLIP"] | None = None,
    replica_type: Literal["TWO_WAY_REPLICA", "ONE_WAY_REPLICA", "CHECK_OUT", "ONE_WAY_CHILD_TO_PARENT_REPLICA"]
    | None = None,
    database_path=None,
) -> Result1[str]:
    """GetFeaturesByJobAOI_topographic(job_id, source_database, target_database, extract_operation, {filter_feature}, {filter_type}, {replica_type}, {database_path})

       Extracts features from a source geodatabase to a target geodatabase
       based on the Filter Feature Layer parameter value (or job AOI).

    INPUTS:
     job_id (Long):
         The job ID of the Workflow Manager (Classic) job that will be updated.
         The default area over which features will be extracted or replicated
         is also determined.
     source_database (Workspace):
         The path to the source database containing features to extract.
     target_database (Workspace):
         The database from which features will be extracted.
     extract_operation (String):
         Specifies whether the data will be copied to the target database or
         replicated to the target database.EXTRACT_DATA-A copy of the features
         will be extracted to the target
         database. This is the default.REPLICATE_DATA-The features will be
         extracted as a replica.
     filter_feature {Feature Layer}:
         A feature layer with one selected feature that will be used to limit
         the extent of the data that will be extracted. If no filter feature is
         specified, the job AOI will be used.
     filter_type {String}:
         Specifies the spatial relationship between the source_database and
         filter_feature parameter values. This parameter is only used if the
         extract_operation parameter is set to EXTRACT_DATA.INTERSECTS-Features
         from the source_database parameter value that
         intersect features in the filter_feature parameter value will be
         extracted. This is the default.CONTAINS-Features from the
         source_database parameter value that are
         contained in the selected feature in the filter_feature parameter
         value will be extracted.CLIP-Features from the source_database
         parameter value that intersect
         features in the filter_feature parameter value will be extracted.
         Features are then split at the AOI boundary and only those within the
         AOI boundary will be kept.
     replica_type {String}:
         Specifies the type of replica that will be created. This parameter is
         only used if the extract_operation parameter is set to
         REPLICATE_DATA.TWO_WAY_REPLICA-Changes will be sent between child and
         parent replicas
         in both directions.ONE_WAY_REPLICA-Changes will be sent from the
         parent replica to the
         child replica only.CHECK_OUT-Data will be replicated, edited, and
         checked back in one
         time. This is the default.ONE_WAY_CHILD_TO_PARENT_REPLICA-Changes will
         be sent from the child
         replica to the parent replica only.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GetFeaturesByJobAOI_topographic(
                *gp_fixargs(
                    (
                        job_id,
                        source_database,
                        target_database,
                        extract_operation,
                        filter_feature,
                        filter_type,
                        replica_type,
                        database_path,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTaskGroupDependencies_topographic", None)
def SetTaskGroupDependencies(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """SetTaskGroupDependencies_topographic(job_id, {database_path})

       Creates dependencies between a job and other existing Task Group jobs
       based on the criteria defined in the extended properties.

    INPUTS:
     job_id (Long):
         The job ID of the Workflow Manager (Classic) job that will have
         dependencies set.
     database_path {File}:
         The Workflow Manager (Classic) database connection file that contains
         the job information. If no connection file is specified, the current
         default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetTaskGroupDependencies_topographic(*gp_fixargs((job_id, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateTaskGroupMetrics_topographic", None)
def UpdateTaskGroupMetrics(
    job_id=None,
    status_layer=None,
    status_field=None,
    database_path=None,
) -> Result2[str, str | Layer]:
    """UpdateTaskGroupMetrics_topographic(job_id, {status_layer}, {status_field}, {database_path})

       Updates and summarizes task group metrics that are part of the
       standard Topographic Workflow deployment of Workflow Manager
       (Classic).

    INPUTS:
     job_id (Long):
         The job ID of the job that will be updated.
     status_layer {Feature Layer}:
         The feature class containing status polygons that keep track of the
         last time work occurred over an extent. Only use this parameter to
         update a polygon feature class that is not the standard status
         polygons created by the Topographic Workflow.
     status_field {Field}:
         The text or date field in which the last modified date will be
         stored. This parameter is enabled if aparameter value is defined.
         Status Layer
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateTaskGroupMetrics_topographic(
                *gp_fixargs((job_id, status_layer, status_field, database_path), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Workflow\Properties toolset
@gptooldoc("CopyExtendedProperties_topographic", None)
def CopyExtendedProperties(
    source_job_id=None,
    target_job_id=None,
    property_table_name=None,
    property_fields=None,
    database_path=None,
) -> Result1[str]:
    """CopyExtendedProperties_topographic(source_job_id, target_job_id, property_table_name, property_fields;property_fields..., {database_path})

       Copies extended property values from one job to another job in the
       same Workflow Manager (Classic) repository.

    INPUTS:
     source_job_id (Long):
         The Job ID of the Workflow Manager (Classic) job that contains the
         properties to copy.
     target_job_id (Long):
         The Job ID of the target job that will have its properties updated.
     property_table_name (String):
         The name of the extended properties table that will be updated.
     property_fields (String):
         The properties to be copied from the source job to the target job.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CopyExtendedProperties_topographic(
                *gp_fixargs((source_job_id, target_job_id, property_table_name, property_fields, database_path), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetDataWorkspace_topographic", None)
def SetDataWorkspace(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """SetDataWorkspace_topographic(job_id, {database_path})

       Sets the data workspace for the chosen job to the appropriate database
       based on the production type of the job.

    INPUTS:
     job_id (Long):
         The job ID of the Workflow Manager (Classic) job that will be updated.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetDataWorkspace_topographic(*gp_fixargs((job_id, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetProductionProperties_topographic", None)
def SetProductionProperties(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """SetProductionProperties_topographic(job_id, {database_path})

       Updates the production properties extended properties table of a
       Workflow Manager (Classic) job based on its production type to ensure
       that the job and any associated tasks use the correct data and maps.

    INPUTS:
     job_id (Long):
         The ID of the Workflow Manager (Classic) job that will be updated.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetProductionProperties_topographic(*gp_fixargs((job_id, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateExtendedProperty_topographic", None)
def UpdateExtendedProperty(
    job_id=None,
    properties_table_name=None,
    property_field=None,
    value=None,
    increment_value: Literal["INCREMENT", "REPLACE"] | None = None,
    database_path=None,
) -> Result1[str]:
    """UpdateExtendedProperty_topographic(job_id, properties_table_name, property_field, value, {increment_value}, {database_path})

       Updates an extended property in the identified properties table for
       the chosen job.

    INPUTS:
     job_id (Long):
         The Job ID of the Workflow Manager (Classic) job that will be updated.
     properties_table_name (String):
         The name of the extended properties table that will be updated.
     property_field (String):
         The property to be updated in the extended properties table.
     value (String):
         The value that will be set for the extended property.
     increment_value {Boolean}:
         If a value already exists for the chosen property, this parameter
         specifies whether the increment value will be added to the current
         value or will replace the current value.INCREMENT-The specified value
         will be added to any existing value for
         the property.REPLACE-The specified value will replace the existing
         value for the
         property.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateExtendedProperty_topographic(
                *gp_fixargs(
                    (job_id, properties_table_name, property_field, value, increment_value, database_path), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdatePropertyCount_topographic", None)
def UpdatePropertyCount(
    job_id=None,
    properties_table_name=None,
    property_field=None,
    update_value=None,
    database_path=None,
) -> Result1[str]:
    """UpdatePropertyCount_topographic(job_id, properties_table_name, property_field, update_value, {database_path})

       Increases the value in an extended property by the update value each
       time the tool is run so that metrics are recorded.

    INPUTS:
     job_id (Long):
         The ID of the Workflow Manager (Classic) job that will be updated.
     properties_table_name (String):
         The name of the extended properties table that will be updated.
     property_field (String):
         The property to be updated in the selected extended properties table.
     update_value (Long):
         The value by which the selected extended property will be increased.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdatePropertyCount_topographic(
                *gp_fixargs((job_id, properties_table_name, property_field, update_value, database_path), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Workflow\Tasks toolset
@gptooldoc("CancelRemainingTasks_topographic", None)
def CancelRemainingTasks(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """CancelRemainingTasks_topographic(job_id, {database_path})

       Prevents the remaining tasks in a job from starting or being created.
       The active task and its task group job will still complete.

    INPUTS:
     job_id (Long):
         The job ID of the parent ArcGIS Workflow Manager (Classic) task group
         job that contains the task list derived from the Set Task List tool.
     database_path {File}:
         The ArcGIS Workflow Manager (Classic) database connection file that
         contains the job information. If a connection is not specified, the
         current default ArcGIS Workflow Manager (Classic) database will be
         used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CancelRemainingTasks_topographic(*gp_fixargs((job_id, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateJobForTask_topographic", None)
def CreateJobForTask(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """CreateJobForTask_topographic(job_id, {database_path})

       Automatically creates a Workflow Manager (Classic) job for a task.

    INPUTS:
     job_id (Long):
         The job ID of the Workflow Manager (Classic) job that will be the
         parent to the newly created child job. The Current Task extended
         property value for this job will be used to determine the type of task
         job that will be created.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateJobForTask_topographic(*gp_fixargs((job_id, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("InsertTaskGroup_topographic", None)
def InsertTaskGroup(
    job_id=None,
    task_group_id=None,
    database_path=None,
) -> Result1[str]:
    """InsertTaskGroup_topographic(job_id, task_group_id, {database_path})

       Adds tasks from the chosen task group to a job when required by
       workflow execution.

    INPUTS:
     job_id (Long):
         The ID of the Workflow Manager (Classic) job that will be updated.
         This is the ID for the parent task group job, not the task job.
     task_group_id (Long):
         The ID of the task group that defines the tasks that will be inserted
         into the selected job's task list.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.InsertTaskGroup_topographic(*gp_fixargs((job_id, task_group_id, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetNextTask_topographic", None)
def SetNextTask(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """SetNextTask_topographic(job_id, {database_path})

       Sets the next task in a workflow from the task list.

    INPUTS:
     job_id (Long):
         The ID of the Workflow Manager (Classic) job that will be updated.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.SetNextTask_topographic(*gp_fixargs((job_id, database_path), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTaskList_topographic", None)
def SetTaskList(
    job_id=None,
    database_path=None,
) -> Result1[str]:
    """SetTaskList_topographic(job_id, {database_path})

       Populates the list of expected tasks for a job based on the selected
       task group.

    INPUTS:
     job_id (Long):
         The ID of the Workflow Manager (Classic) job that will be updated.
     database_path {File}:
         The Workflow Manager (Classic) database connection file (.jtc) that
         contains the job information. If no connection file is specified, the
         current default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.SetTaskList_topographic(*gp_fixargs((job_id, database_path), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTaskStatus_topographic", None)
def SetTaskStatus(
    job_id=None,
    parent_id=None,
    status: Literal["WORKING", "RESTART", "COMPLETE"] | None = None,
    database_path=None,
) -> Result1[str]:
    """SetTaskStatus_topographic(job_id, parent_id, status, {database_path})

       Updates the status of a task based on the state of the Workflow
       Manager (Classic) job created for the task.

    INPUTS:
     job_id (Long):
         The job ID of the task job that has a change in status.
     parent_id (Long):
         The job ID of the task group job that is the parent to the task job.
     status (String):
         Specifies the status of the selected task.WORKING-Work has begun for
         the task.COMPLETE-Work has been completed
         for the task.RESTART-Work will be restarted by creating a new job of
         the same type.
     database_path {File}:
         The Workflow Manager (Classic) database connection file that contains
         the job information. If no connection file is specified, the current
         default Workflow Manager (Classic) database will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetTaskStatus_topographic(*gp_fixargs((job_id, parent_id, status, database_path), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
