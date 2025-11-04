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
r"""The Business Analyst toolbox contains sets of tools that perform GIS
operations fundamental to market analysis. With the tools in this
toolbox, you can perform demographic reporting, review customer and
competitor distributions, identify key trade areas, and visualize data
variables."""
from __future__ import annotations

__all__ = [
    "AddFieldBasedSuitabilityCriteria",
    "AddPointLayerBasedSuitabilityCriteria",
    "AddVariableBasedSuitabilityCriteria",
    "AnalyzeMarketAreaGap",
    "AnalyzeMarketPotential",
    "AssignCustomersByDistance",
    "CalculateMarketPenetration",
    "CalculateSuitabilityScore",
    "ColorCodedLayer",
    "CreateTargetGroup",
    "CustomerDerivedTA",
    "DesireLines",
    "EnrichLayer",
    "ExportSegmentationProfile",
    "FindNearbyLocations",
    "GenerateApproximateDriveTimes",
    "GenerateCustomerProfile",
    "GenerateDriveTimeTradeArea",
    "GenerateGeographiesFromOverlay",
    "GenerateGridsAndHexagons",
    "GenerateMarketAreaProfile",
    "GeneratePointsFromBusinessListings",
    "GenerateSDCXIndex",
    "GenerateSegmentationProfileReport",
    "GenerateSurveyReportForProfile",
    "GenerateSurveyReportForTargets",
    "GenerateTargetGroupLayer",
    "GenerateTargetLayer",
    "GenerateTargetPenetrationLayer",
    "GenerateThresholdDriveTimeTradeArea",
    "GenerateThresholdRingTradeArea",
    "GenerateTradeAreaRings",
    "HuffModel",
    "HuffModelCalibration",
    "ImportBusinessAnalystReportTemplate",
    "ImportSegmentationProfile",
    "ImportSurveyProfiles",
    "MakeSuitabilityAnalysisLayer",
    "MeasureCannibalization",
    "RemoveOverlap",
    "RemoveOverlapMultiple",
    "RemoveSuitabilityCriteria",
    "SetCriteriaProperties",
    "SetTargetSite",
    "StandardGeographyTA",
    "SummaryReports",
]
__alias__ = "ba"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Analysis toolset
@gptooldoc("CalculateMarketPenetration_ba", None)
def CalculateMarketPenetration(
    in_features=None,
    out_feature_class=None,
    id_field=None,
    market_penetration_base_field=None,
    in_customer_features=None,
    area_description_field=None,
    weight_field=None,
    create_report: Literal["CREATE_REPORT", "DO_NOT_CREATE_REPORT"] | None = None,
    store_id=None,
    link_field=None,
    report_title=None,
    report_folder=None,
    report_format=None,
) -> Result2[str, str]:
    """CalculateMarketPenetration_ba(in_features, out_feature_class, id_field, market_penetration_base_field, in_customer_features, {area_description_field}, {weight_field}, {create_report}, {store_id}, {link_field}, {report_title}, {report_folder}, {report_format;report_format...})

       Calculates the market penetration based on the number of customers
       within an area compared to a demographic variable such as total
       population.

    INPUTS:
     in_features (Feature Layer):
         The input feature class used for calculating market penetration.
     id_field (Field):
         A unique ID field in the market penetration layer.
     market_penetration_base_field (Field):
         The field containing the values used to calculate market
         penetration. This field will be used as the denominator and represents
         your market-for example,or. Total PopulationTotal Households
     in_customer_features (Feature Layer):
         The input feature class containing the points for the customer layer.
     area_description_field {Field}:
         The field used to describe each feature in the market penetration
         layer.
     weight_field {Field}:
         The field in the customer layer used as a weight to calculate market
         penetration rather than customer counts.
     create_report {Boolean}:
         Specifies whether a summary report will be created per boundary or by
         combining reports into a single report file.CREATE_REPORT-A summary
         report will be created.DO_NOT_CREATE_REPORT-A
         summary report will not be created. This is the
         default.
     store_id {Field}:
         A unique identifier associated with each store for each trade area.
     link_field {Field}:
         An ID that assigns a trade area to a customer.
     report_title {String}:
         The title of the report.
     report_folder {Folder}:
         The output directory that will contain the report.
     report_format {String}:
         Specifies one or more output report formats. The default value is PDF.
         Additional available formats: XLSX, HTML, CSV, PAGX.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that contains the calculated market
         penetration features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateMarketPenetration_ba(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        id_field,
                        market_penetration_base_field,
                        in_customer_features,
                        area_description_field,
                        weight_field,
                        create_report,
                        store_id,
                        link_field,
                        report_title,
                        report_folder,
                        report_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ColorCodedLayer_ba", None)
def ColorCodedLayer(
    classification_variable=None,
    out_layer_name=None,
    classification_method: Literal["NATURAL_BREAKS", "QUANTILE", "EQUAL_INTERVAL", "GEOMETRIC_INTERVAL", "AUTO"]
    | None = None,
    number_of_classes=None,
    area_of_interest=None,
    out_dataset_path=None,
    out_dataset_name=None,
    boundary_mode: Literal["STANDARD_GEOGRAPHIES", "H3_HEXAGONS"] | None = None,
) -> Result2[str | Layer, str]:
    """ColorCodedLayer_ba(classification_variable, out_layer_name, classification_method, number_of_classes, {area_of_interest}, {out_dataset_path}, {out_dataset_name}, {boundary_mode})

       Creates multilevel, scale-dependent choropleth layers from a variable
       describing a business, demographic, consumer, or landscape
       characteristic.

    INPUTS:
     classification_variable (String):
         A variable that will display as a color-coded map.
     out_layer_name (String):
         The name of the color-coded layer that will be added to the map.
     classification_method (String):
         Specifies the method that will be used to calculate the class
         breaks.NATURAL_BREAKS-Natural breaks classes are based on natural
         groupings
         inherent in the data. Class breaks that best group similar values and
         maximize the differences between classes will be identified. This is
         the default.QUANTILE-Each class will contain an equal number of
         features. A
         quantile classification is well suited to linearly distributed
         data.EQUAL_INTERVAL-The range of attribute values will be divided into
         equal-sized subranges. This allows you to specify the number of
         intervals and will automatically determine the class breaks based on
         the value range.GEOMETRIC_INTERVAL-Class breaks will be created based
         on class
         intervals that have a geometric series. The geometric coefficient in
         this classifier can change once (to its inverse) to optimize the class
         ranges.AUTO-Classification methods will be automatically defined using
         the
         variable metadata. This presents the recommended thematic map style
         based on the data type.
     number_of_classes (String):
         The number of data classification breaks that will appear on the map.
         The default value is 5.
     area_of_interest {Feature Layer}:
         The feature layer that will be used to determine the geographic extent
         of the analysis.
     out_dataset_path {Workspace}:
         The geodatabase in which the output feature dataset will be created.
     out_dataset_name {String}:
         The name of the feature dataset in the output geodatabase in which the
         color-coded layer feature classes will be created.
     boundary_mode {String}:
         Specifies the types of boundaries that will be used to create levels
         in the color-coded group layer.STANDARD_GEOGRAPHIES-Boundaries will be
         levels of standard
         geographies. This is the default.H3_HEXAGONS-Boundaries will be levels
         of H3 hexagons."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ColorCodedLayer_ba(
                *gp_fixargs(
                    (
                        classification_variable,
                        out_layer_name,
                        classification_method,
                        number_of_classes,
                        area_of_interest,
                        out_dataset_path,
                        out_dataset_name,
                        boundary_mode,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DesireLines_ba", None)
def DesireLines(
    in_stores_layer=None,
    in_customers_layer=None,
    out_feature_class=None,
    store_id_field=None,
    link_field=None,
    distance_type=None,
    units=None,
    cutoff=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    create_report: Literal["CREATE_REPORT", "DO_NOT_CREATE_REPORT"] | None = None,
    report_title=None,
    report_folder=None,
    report_format=None,
) -> Result2[str, str]:
    """DesireLines_ba(in_stores_layer, in_customers_layer, out_feature_class, store_id_field, link_field, {distance_type}, {units}, {cutoff}, {travel_direction}, {time_of_day}, {time_zone}, {create_report}, {report_title}, {report_folder}, {report_format;report_format...})

       Generates a series of lines from each customer to an associated store
       location. These lines are often called spider diagrams. The tool can
       also generate an optional Wind Rose report from the output.

    INPUTS:
     in_stores_layer (Feature Layer):
         The input point layer representing store or facility locations.
     in_customers_layer (Feature Layer):
         The input point layer representing customers or patrons.
     store_id_field (Field):
         A unique ID field representing a store or facility location.
     link_field (Field):
         An ID field used to assign individual customers to stores.
     distance_type {String}:
         The method of travel that will be used for distance calculation.
         Straight Line is the default value.When using Portal for ArcGIS or
         local data sources, travel mode
         options are dynamically populated.
     units {String}:
         The type of distance- or time-measuring units that will be used when
         calculating minimal distance.
     cutoff {Double}:
         The distance beyond which customers will be considered outliers and
         excluded from consideration during desire line generation.
     travel_direction {String}:
         Specifies the direction of travel that will be used between stores and
         demand points.TOWARD_STORES-The direction of travel will be from
         demand points to
         stores. This is the default.AWAY_FROM_STORES-The direction of travel
         will be from stores to demand
         points.
     time_of_day {Date}:
         The time at which travel begins.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.UTC-Coordinated universal time (UTC) will be used. Choose
         this option
         if you want to choose the best location for a specific time, such as
         now, but aren't certain in which time zone the stores or demand points
         are located.TIME_ZONE_AT_LOCATION-The time zone in which the stores or
         demand
         points are located will be used. If travel_direction is
         AWAY_FROM_STORES, this is the time zone of the stores. If
         travel_direction is TOWARD_STORES, this is the time zone of the demand
         points. This is the default.
     create_report {Boolean}:
         Specifies whether a Wind Rose report will be created.CREATE_REPORT-A
         report will be created.DO_NOT_CREATE_REPORT-A report
         will not be created. This is the
         default.
     report_title {String}:
         The title of the Wind Rose report.
     report_folder {Folder}:
         The output directory that will contain the Wind Rose report.
     report_format {String}:
         One or more output report formats. The default value is PDF.
         Additional available formats are XLSX, HTML, CSV, and PAGX.

    OUTPUTS:
     out_feature_class (Feature Class):
         The resultant feature class that will be added to thepane.
         Contents"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DesireLines_ba(
                *gp_fixargs(
                    (
                        in_stores_layer,
                        in_customers_layer,
                        out_feature_class,
                        store_id_field,
                        link_field,
                        distance_type,
                        units,
                        cutoff,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        create_report,
                        report_title,
                        report_folder,
                        report_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EnrichLayer_ba", None)
def EnrichLayer(
    in_features=None,
    out_feature_class=None,
    variables=None,
    buffer_type=None,
    distance=None,
    unit=None,
) -> Result1[str]:
    """EnrichLayer_ba(in_features, out_feature_class, {variables;variables...}, {buffer_type}, {distance}, {unit})

       Enriches data by adding demographic and landscape facts about the
       people and places that surround or are inside data locations.

    INPUTS:
     in_features (Feature Layer):
         The features that will be enriched.
     variables {String}:
         The variables that will be summarized and added to the output feature
         class.
     buffer_type {String}:
         Specifies the area that will be enriched. The default value is
         STRAIGHT_LINE_DISTANCE.Input line features can only use the
         STRAIGHT_LINE_DISTANCE distance
         option.
     distance {Double}:
         The distance or size of an area to enrich, for example, a 1-mile
         buffer or 5-minute walk time. Units correspond to the polygon type.
         The default value is 1.
     unit {String}:
         The units associated with the distance parameter. The default value is
         MILES.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output layer containing both the input attributes and user-
         selected attributes. Selected attributes are summarized from
         underlying demographic boundaries. Only the area inside the input
         boundary is considered."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EnrichLayer_ba(
                *gp_fixargs((in_features, out_feature_class, variables, buffer_type, distance, unit), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FindNearbyLocations_ba", None)
def FindNearbyLocations(
    in_features=None,
    id_field=None,
    in_location_points=None,
    out_feature_class=None,
    distance_type=None,
    units=None,
    distance_limit=None,
    number_limit=None,
    percent_limit=None,
    create_report: Literal["CREATE_REPORT", "DO_NOT_CREATE_REPORT"] | None = None,
    report_title=None,
    report_folder=None,
    report_format=None,
    report_fields=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    search_tolerance=None,
    location_name=None,
) -> Result2[str, str]:
    """FindNearbyLocations_ba(in_features, id_field, in_location_points, out_feature_class, {distance_type}, {units}, {distance_limit}, {number_limit}, {percent_limit}, {create_report}, {report_title}, {report_folder}, {report_format;report_format...}, {report_fields;report_fields...}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance}, {location_name})

       Identifies locations closest to the input features based on a selected
       distance type. The number of points in the output is defined by
       limiting the count or percentage of location points to return or by
       limiting the distance from the input points.

    INPUTS:
     in_features (Feature Layer):
         The point layer to be measured to or from the in_location_points
         parameter value.
     id_field (Field):
         A field containing unique identifiers for each input feature.
     in_location_points (Feature Layer):
         The layer that will be used to generate the output with distance and
         direction attributes to or from the in_features parameter value.
     distance_type {String}:
         The calculated distance based on the method of travel. Straight Line
         is the default value.
     units {String}:
         The measurement units, in distance or time, that will be used when
         calculating nearby locations.
     distance_limit {Double}:
         The analysis extent measured in distance or time.
     number_limit {Long}:
         The numeric limit of the in_location_points value.
     percent_limit {Double}:
         The closest points, as a percentage of the points of the
         in_location_points value.
     create_report {Boolean}:
         Specifies whether an output report will be created.CREATE_REPORT-A
         report will be created.DO_NOT_CREATE_REPORT-A report
         will not be created. This is the
         default.
     report_title {String}:
         The title of the output report.
     report_folder {Folder}:
         The directory that will contain the output report.
     report_format {String}:
         The output report formats. The default value is InfographicHTML.
         Additional available formats are PDF, XLSX, S.XLSX, HTML, S.XML, ZIP,
         CVS, PAGX, and InfographicPDF.
     report_fields {Field}:
         The additional fields that will be added to the report.
     travel_direction {String}:
         Specifies whether travel times or distances will be measured from
         location points to input features or from input features to location
         points.TOWARD_STORES-The direction of travel will be from location
         points to
         input features. This is the default.AWAY_FROM_STORES-The direction of
         travel will be from input features
         to location points.
     time_of_day {Date}:
         The time at which travel will begin.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.UTC-Coordinated universal time (UTC) will be used. Choose
         this option
         if you want the best location for a specific time, such as now, but
         aren't certain of the time zone in which the in_location_points value
         will be located.TIME_ZONE_AT_LOCATION-The time zone in which the
         in_location_points
         value is located will be used. If the travel direction is input
         features to location points, this is the time zone of the input
         features. If the travel direction is location points to input
         features, this is the time zone of the location points. This is the
         default.
     search_tolerance {Linear Unit}:
         The maximum distance that input points can be from the network. Points
         located beyond the search tolerance will be excluded from processing.
     location_name {Field}:
         A field from the input in_location_points parameter. This field
         contains the name or ID for each input point used in the Find Nearby
         Locations report.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output location point features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindNearbyLocations_ba(
                *gp_fixargs(
                    (
                        in_features,
                        id_field,
                        in_location_points,
                        out_feature_class,
                        distance_type,
                        units,
                        distance_limit,
                        number_limit,
                        percent_limit,
                        create_report,
                        report_title,
                        report_folder,
                        report_format,
                        report_fields,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                        location_name,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateGridsAndHexagons_ba", None)
def GenerateGridsAndHexagons(
    area_of_interest=None,
    out_feature_class=None,
    cell_type: Literal["SQUARE", "HEXAGON", "H3_HEXAGON"] | None = None,
    enrich_type: Literal["ENRICH_CELL", "ENRICH_BUFFER"] | None = None,
    cell_size=None,
    h3_resolution=None,
    variables=None,
    distance_type=None,
    distance=None,
    units=None,
    out_enriched_buffers=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    search_tolerance=None,
    polygon_detail: Literal["STANDARD", "GENERALIZED", "HIGH"] | None = None,
    out_centroids=None,
) -> Result3[str, str, str]:
    """GenerateGridsAndHexagons_ba(area_of_interest, out_feature_class, {cell_type}, {enrich_type}, {cell_size}, {h3_resolution}, {variables;variables...}, {distance_type}, {distance}, {units}, {out_enriched_buffers}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance}, {polygon_detail}, {out_centroids})

       Creates features with vector-based square grid cells, hexagons, or H3
       hexagons for a given area.

    INPUTS:
     area_of_interest (Feature Layer):
         The input feature class used to define the extent of the grid or
         hexagon layer.
     cell_type {String}:
         Specifies the cell type that will be created in the
         output.SQUARE-Regular four-sided polygons with equal side lengths will
         be
         created. This is the default.HEXAGON-Regular six-sided polygons with
         equal side lengths will be
         created.H3_HEXAGON-Regular six-sided polygons with equal side lengths
         based on
         Uber's hexagonal hierarchical spatial index will be created.
     enrich_type {String}:
         Specifies the method that will be used for variable
         enrichment.ENRICH_CELL-Enrichment will be performed on the cell_type
         parameter
         value.ENRICH_BUFFER-Enrichment will be performed on a buffer around
         the
         centroid of the grid or hexagon. The default distance_type parameter
         value is straight_line.
     cell_size {Areal Unit}:
         The size of the cell to generate squares or hexagons. The default
         value is 1 square mile.
     h3_resolution {Long}:
         The resolution that will be used to generate the H3 hexagons. A value
         of 15 represents the finest resolution. The default value is 7.
     variables {String}:
         A list of variables that will be appended to the output.
     distance_type {String}:
         The method of travel that will be used for the buffer calculation.
     distance {Double}:
         The distance that will be used for the buffer calculations.
     units {String}:
         The units that will be used for the distance parameter.
     travel_direction {String}:
         Specifies the direction of travel that will be used between the center
         of the cell and the buffer boundary.TOWARD_STORES-The direction of
         travel will be from location points to
         input features. This is the default.AWAY_FROM_STORES-The direction of
         travel will be from input features
         to location points.
     time_of_day {Date}:
         The time at which the travel will begin.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.UTC-Coordinated universal time (UTC) will be used. Choose
         this option
         if you want the best location for a specific time, such as now, but
         aren't certain of the time zone.TIME_ZONE_AT_LOCATION-The time zone in
         which the area_of_interest
         value is located will be used. This is the default.
     search_tolerance {Linear Unit}:
         The maximum distance that input points can be from the network. Points
         located beyond the search tolerance will be excluded from processing.
     polygon_detail {String}:
         Specifies the level of detail that will be used for the output drive
         time polygons.STANDARD-The optimal setting that combines processing
         speed with
         overall accuracy will be used. This is the default.GENERALIZED-The
         fastest method will be used.HIGH-The highest level of detail will be
         used.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will contain the grid or hexagon features.
     out_enriched_buffers {Feature Class}:
         The feature class that will contain the enriched buffers.
     out_centroids {Feature Class}:
         The feature class that will contain the cell centroids."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateGridsAndHexagons_ba(
                *gp_fixargs(
                    (
                        area_of_interest,
                        out_feature_class,
                        cell_type,
                        enrich_type,
                        cell_size,
                        h3_resolution,
                        variables,
                        distance_type,
                        distance,
                        units,
                        out_enriched_buffers,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                        polygon_detail,
                        out_centroids,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GeneratePointsFromBusinessListings_ba", None)
def GeneratePointsFromBusinessListings(
    out_feature_class=None,
    in_search_features=None,
    search_terms=None,
    exact_match: Literal["EXACT_MATCH", "PARTIAL_MATCH"] | None = None,
    match_name_only: Literal["MATCH_NAME_ONLY", "MATCH_ALL_FIELDS"] | None = None,
    filters=None,
    max_count=None,
    business_dataset=None,
    find_related_poi: Literal["FIND_RELATED_POI", "IGNORE_RELATED_POI"] | None = None,
) -> Result1[str]:
    """GeneratePointsFromBusinessListings_ba(out_feature_class, {in_search_features}, {search_terms}, {exact_match}, {match_name_only}, {filters;filters...}, {max_count}, {business_dataset}, {find_related_poi})

       Generates a point feature layer from a business point location search.

    INPUTS:
     in_search_features {Feature Layer}:
         The area that will be used to search for businesses. Selected features
         supersede the feature class and will be used as the search area.
     search_terms {String}:
         The terms that will be used to search for businesses. You can use
         terms such as business name or business type keywords. If this
         parameter is not set, all businesses from the in_search_features
         parameter value will be returned.
     exact_match {Boolean}:
         Specifies whether only the text provided for the search_terms
         parameter will be returned from the search.EXACT_MATCH-Only exact
         matches to the text provided for the
         search_terms parameter will be returned.PARTIAL_MATCH-Partial matches
         to the text provided for the
         search_terms parameter as well as exact matches will be returned. This
         is the default.
     match_name_only {Boolean}:
         Specifies whether the search will be limited to the business name
         only.MATCH_NAME_ONLY-Only exact matches to the business name provided
         for
         the search_terms parameter will be returned.MATCH_ALL_FIELDS-Partial
         matches to the business name provided for the
         search_terms parameter as well as exact matches will be returned. This
         is the default.
     filters {Value Table}:
         The filters that will be applied to the search_terms
         parameter.filter_name-Set the filter by the dataset
         field.filter_value-Set the
         filter by applying a value to the selected field.include-Set the
         filter by including or excluding field values.
     max_count {Long}:
         The limit for the number of returned features. The default value is
         1,000,000 for local data and 5,000 for online data hosted by ArcGIS
         Online.The record limit when using on-premises hosted data is set by
         your
         administrator.
     business_dataset {String}:
         The dataset that will be used in the business search.
     find_related_poi {Boolean}:
         Specifies whether semantic search will be used to find related items
         to the search terms.FIND_RELATED_POI-Semantic search will be
         used.IGNORE_RELATED_POI-Semantic search will not be used. This is the
         default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that will contain the returned businesses."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeneratePointsFromBusinessListings_ba(
                *gp_fixargs(
                    (
                        out_feature_class,
                        in_search_features,
                        search_terms,
                        exact_match,
                        match_name_only,
                        filters,
                        max_count,
                        business_dataset,
                        find_related_poi,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Modeling toolset
@gptooldoc("HuffModel_ba", None)
def HuffModel(
    in_facility_features=None,
    facility_id_field=None,
    in_candidate_features=None,
    candidate_id_field=None,
    in_sales_potential_features=None,
    sales_potential_id_field=None,
    sales_potential_field=None,
    out_feature_class=None,
    attractiveness_variables=None,
    distance_exponent=None,
    distance_type=None,
    distance_units=None,
    out_distance_matrix=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
) -> Result3[str, str, str]:
    """HuffModel_ba(in_facility_features, facility_id_field, in_candidate_features, candidate_id_field, in_sales_potential_features, sales_potential_id_field, sales_potential_field, out_feature_class, attractiveness_variables;attractiveness_variables..., distance_exponent, {distance_type}, {distance_units}, {out_distance_matrix}, {travel_direction}, {time_of_day}, {time_zone})

       Creates a probability surface to predict the sales potential of an
       area based on distance and an attractiveness factor.

    INPUTS:
     in_facility_features (Feature Layer):
         An input point feature layer representing existing facility locations.
         It is the first feature from the layer or the feature selected when a
         selection is available.
     facility_id_field (Field):
         A unique ID field for existing facilities.
     in_candidate_features (Feature Layer):
         An input point feature layer representing new candidate facility
         locations. It is the first feature from the layer or the feature
         selected when a selection is available.
     candidate_id_field (Field):
         A unique ID field for candidate facilities.
     in_sales_potential_features (Feature Layer):
         An input point or polygon feature layer used to calculate the sales
         potential. It is either all features from a layer or only selected
         features when a selection is available.
     sales_potential_id_field (Field):
         A unique ID field for sales potential features.
     sales_potential_field (Field):
         The field containing the values that will be used to calculate the
         sales potential.
     attractiveness_variables (Value Table):
         The attribute fields that indicate the attractiveness of each
         competitor. In many cases, the size of the facility is used as a
         substitute for attractiveness and will be a multivalue table.An
         additional attractiveness variable is needed. The attractiveness
         field must be present in the existing facilities (competitors) and the
         candidate facilities layer.existing_facilities_value-Numeric field in
         the in_facility_features
         parameter layer that represents
         attractiveness.candidates_location_value-Numeric field in the
         in_candidate_features
         parameter layer that matches the attractiveness value from the
         in_facility_features parameter layer. Distance does not require a
         matching field.exponent-The value that determines how much of a factor
         the variable
         is to the attractiveness value. The default value is 1.
     distance_exponent (Double):
         The distance exponent is generally a negative number because
         attractiveness decreases when distance increases. The default value is
         -1.5.
     distance_type {String}:
         The type of distance, based on method of travel, that will be used.
         The default value is Straight Line.
     distance_units {String}:
         The distance-measuring units that will be used when calculating
         distance.
     travel_direction {String}:
         Specifies the direction of travel that will be used between stores and
         sales potential features.TOWARD_STORES-The direction of travel will be
         from sales potential
         features to stores. This is the default.AWAY_FROM_STORES-The direction
         of travel will be from stores to sales
         potential features.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.TIME_ZONE_AT_LOCATION-The time zone in which the territories
         are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that will contain the tool results
         representing the probability of sales.
     out_distance_matrix {Table}:
         The name and location of the matrix table of distance calculations.
         The IDs for the in_facility_features and in_candidate_features
         parameters must be unique."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.HuffModel_ba(
                *gp_fixargs(
                    (
                        in_facility_features,
                        facility_id_field,
                        in_candidate_features,
                        candidate_id_field,
                        in_sales_potential_features,
                        sales_potential_id_field,
                        sales_potential_field,
                        out_feature_class,
                        attractiveness_variables,
                        distance_exponent,
                        distance_type,
                        distance_units,
                        out_distance_matrix,
                        travel_direction,
                        time_of_day,
                        time_zone,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("HuffModelCalibration_ba", None)
def HuffModelCalibration(
    in_facility_features=None,
    facility_id_field=None,
    in_customer_features=None,
    link_field=None,
    in_sales_potential_features=None,
    sales_potential_id_field=None,
    out_calibration=None,
    attractiveness_variables=None,
    customer_weight_field=None,
    distance_type=None,
    distance_units=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
) -> Result1[str]:
    """HuffModelCalibration_ba(in_facility_features, facility_id_field, in_customer_features, link_field, in_sales_potential_features, sales_potential_id_field, out_calibration, attractiveness_variables;attractiveness_variables..., {customer_weight_field}, {distance_type}, {distance_units}, {travel_direction}, {time_of_day}, {time_zone})

       Calculates exponent values for use in the Huff Model tool.

    INPUTS:
     in_facility_features (Feature Layer):
         The input point feature class representing competitors or existing
         stores.
     facility_id_field (Field):
         A unique ID field representing a store or facility location.
     in_customer_features (Feature Layer):
         The input point feature class representing customer locations.
     link_field (Field):
         The field that will be used as an ID to assign individual customers to
         a facility or store.
     in_sales_potential_features (Feature Layer):
         The input polygon feature class used to determine the potential sales
         market.
     sales_potential_id_field (Field):
         A unique ID field representing the sales potential area.
     attractiveness_variables (Value Table):
         The fields that will be used to determine the attractiveness of each
         competitor. In many cases, the size of the store is used as a
         substitute for attractiveness.
     customer_weight_field {Field}:
         A calculated weighted value field assigned to each customer.
     distance_type {String}:
         The method of travel that will be used to calculate distance. The
         default value is Straight Line.
     distance_units {String}:
         The distance-measuring units that will be used when calculating
         distance.
     travel_direction {String}:
         Specifies the direction of travel that will be used between stores and
         sales potential features.TOWARD_STORES-The direction of travel will be
         from sales potential
         features to stores. This is the default.AWAY_FROM_STORES-The direction
         of travel will be from stores to sales
         potential features.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.TIME_ZONE_AT_LOCATION-The time zone in which the territories
         are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.

    OUTPUTS:
     out_calibration (File):
         The output calibration file that will contain the calibrated Huff
         model results, which is the exponent values for the attractiveness
         variables and distance. The output file extension will be *.huffmodel."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.HuffModelCalibration_ba(
                *gp_fixargs(
                    (
                        in_facility_features,
                        facility_id_field,
                        in_customer_features,
                        link_field,
                        in_sales_potential_features,
                        sales_potential_id_field,
                        out_calibration,
                        attractiveness_variables,
                        customer_weight_field,
                        distance_type,
                        distance_units,
                        travel_direction,
                        time_of_day,
                        time_zone,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Reports toolset
@gptooldoc("ImportBusinessAnalystReportTemplate_ba", None)
def ImportBusinessAnalystReportTemplate(
    online_report_template_id=None,
    output_folder=None,
    dataset_id=None,
    config=None,
) -> Result1[str]:
    """ImportBusinessAnalystReportTemplate_ba(online_report_template_id, {output_folder}, {dataset_id}, {config})

       Imports an online report so that it can run locally using a locally
       installed ArcGIS Business Analyst dataset.

    INPUTS:
     online_report_template_id (String):
         The report template ID.
     output_folder {Folder}:
         The local folder where the report template items will be imported.
     dataset_id {String}:
         The dataset that will be used to populate the report variables.
     config {String}:
         A JSON string specifying where the report's SDCX variables
         will be stored. The config options are as follows:        id-The
         portal item ID of the SDCX.download-True or false. Set to true
         to download the SDCX, or set to
         false to reference an existing SDCX.path-The location of the SDCX. Use
         an empty string to use the existing
         default-for example, the report output folder location-or specify a
         new folder location or an existing folder that contains the
         SDCX.name-The name of the SDCX. Specify a new name for the SDCX or the
         name
         of an existing SDCX."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportBusinessAnalystReportTemplate_ba(
                *gp_fixargs((online_report_template_id, output_folder, dataset_id, config), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SummaryReports_ba", None)
def SummaryReports(
    in_features=None,
    report_templates=None,
    reports_folder=None,
    summarization_options: Literal["INDIVIDUAL_FEATURES", "WHOLE_LAYER", "BOTH_FEATURES_AND_LAYER"] | None = None,
    single_report: Literal["CREATE_SINGLE_REPORT", "CREATE_REPORT_PER_TEMPLATE"] | None = None,
    formats=None,
    store_id_field=None,
    store_name_field=None,
    store_address_field=None,
    store_latitude_field=None,
    store_longitude_field=None,
    ring_id_field=None,
    area_description_field=None,
    title=None,
    subtitle=None,
    report_per_feature: Literal["CREATE_REPORT_PER_FEATURE", "CREATE_SINGLE_REPORT"] | None = None,
    add_infographic_header: Literal["ENABLE_INFOGRAPHIC_HEADER", "DISABLE_INFOGRAPHIC_HEADER"] | None = None,
    add_infographic_footer: Literal["ENABLE_INFOGRAPHIC_FOOTER", "DISABLE_INFOGRAPHIC_FOOTER"] | None = None,
    add_infographic_data_source: Literal["ENABLE_INFOGRAPHIC_DATA_SOURCE", "DISABLE_INFOGRAPHIC_DATA_SOURCE"]
    | None = None,
) -> Result1[str]:
    """SummaryReports_ba(in_features, report_templates;report_templates..., reports_folder, {summarization_options}, {single_report}, {formats;formats...}, {store_id_field}, {store_name_field}, {store_address_field}, {store_latitude_field}, {store_longitude_field}, {ring_id_field}, {area_description_field}, {title}, {subtitle}, {report_per_feature}, {add_infographic_header}, {add_infographic_footer}, {add_infographic_data_source})

       Creates infographic and summary reports for a boundary layer using
       standard or custom templates.

    INPUTS:
     in_features (Feature Layer):
         The boundary layer containing one or more polygons that will be used
         to create reports.
     report_templates (String):
         One or more report templates that will be used to create the summary
         report. You must be signed in to ArcGIS Online or have Business
         Analyst Data installed.
     reports_folder (Folder):
         The output location where the summary reports will be saved.
     summarization_options {String}:
         Specifies how the data will be displayed in a
         report.INDIVIDUAL_FEATURES-Selected report templates will be returned
         for
         each individual trade area polygon. This is the
         default.WHOLE_LAYER-Selected report templates will be returned
         representing
         only the full extent of the trade
         area.BOTH_FEATURES_AND_LAYER-Selected report templates will be
         returned for
         both individual features and the whole layer.
     single_report {Boolean}:
         Specifies whether a single output will be created or a separate file
         will be created for each report.CREATE_SINGLE_REPORT-All reports will
         be combined into a single
         output.CREATE_REPORT_PER_TEMPLATE-A separate file will be created for
         each
         selected report. This is the default.
     formats {String}:
         The report output format. The default value is PDF.
     store_id_field {Field}:
         The field that will be used to group data for each site in output
         reports. These field values are not displayed in the header.
     store_name_field {Field}:
         The field values that will be displayed in the output report headers
         that identify the site corresponding to each polygon's data.
     store_address_field {Field}:
         The store address associated with each trade area.
     store_latitude_field {Field}:
         The field that will contain the latitude coordinates (y field).
     store_longitude_field {Field}:
         The field that will contain the longitude coordinates (x field).
     ring_id_field {Field}:
         The field that will control the presentation order of data for inputs
         with multiple polygons per site.
     area_description_field {Field}:
         The field that will be displayed as the output template header with
         values corresponding to each input polygon's data.
     title {String}:
         The title in the report header.
     subtitle {String}:
         The subtitle in the report header. The default value is Prepared by
         Business Analyst Pro.
     report_per_feature {Boolean}:
         Specifies whether a single report or multiple reports will be
         created.CREATE_REPORT_PER_FEATURE-A report will be created per
         feature.CREATE_SINGLE_REPORT-A single report will be created. This is
         the
         default.
     add_infographic_header {Boolean}:
         Specifies whether a header will be added to the
         infographic.ENABLE_INFOGRAPHIC_HEADER-A header will be added to the
         infographic.DISABLE_INFOGRAPHIC_HEADER-A header will not be added to
         the
         infographic. This is the default.
     add_infographic_footer {Boolean}:
         Specifies whether a footer will be added to the
         infographic.ENABLE_INFOGRAPHIC_FOOTER-A footer will be added to the
         infographic.DISABLE_INFOGRAPHIC_FOOTER-A footer will not be added to
         the
         infographic. This is the default.
     add_infographic_data_source {Boolean}:
         Specifies whether the data source will be added to the
         infographic.ENABLE_INFOGRAPHIC_DATA_SOURCE-The data source will be
         added to the
         infographic.DISABLE_INFOGRAPHIC_DATA_SOURCE-The data source will not
         be added to
         the infographic. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SummaryReports_ba(
                *gp_fixargs(
                    (
                        in_features,
                        report_templates,
                        reports_folder,
                        summarization_options,
                        single_report,
                        formats,
                        store_id_field,
                        store_name_field,
                        store_address_field,
                        store_latitude_field,
                        store_longitude_field,
                        ring_id_field,
                        area_description_field,
                        title,
                        subtitle,
                        report_per_feature,
                        add_infographic_header,
                        add_infographic_footer,
                        add_infographic_data_source,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Statistical Data Collections toolset
@gptooldoc("GenerateSDCXIndex_ba", None)
def GenerateSDCXIndex(
    sdcx_file=None,
) -> Result1[str]:
    """GenerateSDCXIndex_ba(sdcx_file)

       Creates an index for a Statistical Data Collection (SDCX). The index
       will improve performance when using the custom data in analysis tools
       such as Enrich Layer.

    INPUTS:
     sdcx_file (File):
         The input Statistical Data Collection file (.sdcx)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.GenerateSDCXIndex_ba(*gp_fixargs((sdcx_file,), True)))
        return retval
    except Exception as e:
        raise e


# Suitability Analysis toolset
@gptooldoc("AddFieldBasedSuitabilityCriteria_ba", None)
def AddFieldBasedSuitabilityCriteria(
    in_analysis_layer=None,
    fields=None,
) -> Result2[str | Layer, str]:
    """AddFieldBasedSuitabilityCriteria_ba(in_analysis_layer, fields;fields...)

       Adds criteria based on the numerical fields existing in the input
       layer.

    INPUTS:
     in_analysis_layer (Feature Layer / Group Layer):
         The Suitability Analysis layer that will be used in the analysis.
     fields (String):
         The numeric fields from which the suitability criteria will be
         determined."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddFieldBasedSuitabilityCriteria_ba(*gp_fixargs((in_analysis_layer, fields), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddPointLayerBasedSuitabilityCriteria_ba", None)
def AddPointLayerBasedSuitabilityCriteria(
    in_analysis_layer=None,
    site_layer_id_field=None,
    in_point_features=None,
    criteria_type: Literal["COUNT", "WEIGHT", "MINIMAL_DISTANCE"] | None = None,
    distance_type=None,
    units=None,
    in_site_centers_features=None,
    site_centers_id_field=None,
    weight_field=None,
    statistics_type: Literal["SUM", "AVE", "STD_DEV", "MIN", "MAX"] | None = None,
    cutoff_distance=None,
) -> Result2[str | Layer, str]:
    """AddPointLayerBasedSuitabilityCriteria_ba(in_analysis_layer, site_layer_id_field, in_point_features, criteria_type, {distance_type}, {units}, {in_site_centers_features}, {site_centers_id_field}, weight_field, {statistics_type}, {cutoff_distance})

       Adds criteria based on spatial relationships between the input layer
       and a specified point layer.

    INPUTS:
     in_analysis_layer (Feature Layer / Group Layer):
         The Suitability Analysis layer that will be used in the analysis.
     site_layer_id_field (String):
         A field containing unique values for each record in the Suitability
         Analysis layer.
     in_point_features (Feature Layer):
         The layer containing point locations that will be added as criteria
         based on the spatial relationship to the Suitability Analysis layer.
     criteria_type (String):
         Specifies the type of spatial relationship that will be used as
         criteria.COUNT-A count of points that fall within each Suitability
         Analysis
         layer polygon will be used as criteria. This is the
         default.WEIGHT-Field-weighted criteria of points that fall within each
         Suitability Analysis polygon based on the user-selected statistical
         type will be used as criteria.MINIMAL_DISTANCE-The distance from the
         closest point to each of the
         Suitability Analysis layer centroids will be used as criteria.
     distance_type {String}:
         The method of travel that will be used to calculate the minimal
         distance.
     units {String}:
         The unit of measure that will be used when calculating minimal
         distance.
     in_site_centers_features {Feature Layer}:
         The point layer that will be used as site centers. This point layer
         will replace default polygon centroids of the Suitability Analysis
         layer.
     site_centers_id_field {Field}:
         A field in the in_site_centers_features parameter value that uniquely
         identifies each record.
     weight_field (Field):
         Numeric fields that exist in a point layer that will be selected for
         weighting.
     statistics_type {String}:
         Specifies the type of statistical operation that will be applied to
         the weighted field.SUM-The total of the field values will be
         calculated for each point
         feature.AVE-The average field value will be calculated for each point
         feature.STD_DEV-The standard deviation of the field values will be
         calculated
         for each point feature.MIN-The smallest field value will be determined
         for each point
         feature.MAX-The largest field value will be determined for each point
         feature.
     cutoff_distance {Double}:
         The distance beyond which points will not be considered in the
         calculation."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddPointLayerBasedSuitabilityCriteria_ba(
                *gp_fixargs(
                    (
                        in_analysis_layer,
                        site_layer_id_field,
                        in_point_features,
                        criteria_type,
                        distance_type,
                        units,
                        in_site_centers_features,
                        site_centers_id_field,
                        weight_field,
                        statistics_type,
                        cutoff_distance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AddVariableBasedSuitabilityCriteria_ba", None)
def AddVariableBasedSuitabilityCriteria(
    in_analysis_layer=None,
    variables=None,
) -> Result2[str | Layer, str]:
    """AddVariableBasedSuitabilityCriteria_ba(in_analysis_layer, variables;variables...)

       Adds criteria based on the values calculated for the input layer using
       the Enrich Layer tool.

    INPUTS:
     in_analysis_layer (Feature Layer / Group Layer):
         The Suitability Analysis layer that will be used in the analysis.
     variables (String):
         The variables from which the suitability criteria will be determined."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddVariableBasedSuitabilityCriteria_ba(*gp_fixargs((in_analysis_layer, variables), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateSuitabilityScore_ba", None)
def CalculateSuitabilityScore(
    in_analysis_layer=None,
) -> Result1[str | Layer]:
    """CalculateSuitabilityScore_ba(in_analysis_layer)

       Calculates or recalculates a suitability score.

    INPUTS:
     in_analysis_layer (Feature Layer / Group Layer):
         The Suitability Analysis Layer that will be used in the analysis."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateSuitabilityScore_ba(*gp_fixargs((in_analysis_layer,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MakeSuitabilityAnalysisLayer_ba", None)
def MakeSuitabilityAnalysisLayer(
    in_features=None,
    layer_name=None,
    out_dataset_path=None,
    out_dataset_name=None,
) -> Result1[str | Layer]:
    """MakeSuitabilityAnalysisLayer_ba(in_features, layer_name, {out_dataset_path}, {out_dataset_name})

       Creates a Suitability Analysis group layer for an input site's
       polygonal layer.

    INPUTS:
     in_features (Feature Layer):
         The feature layer that will be used in the creation of the Suitability
         Analysis layer.
     layer_name (String):
         The name of the output Suitability Analysis layer that will be
         created.
     out_dataset_path {Workspace}:
         The geodatabase that will contain the output feature dataset.
     out_dataset_name {String}:
         The name of the output feature dataset that will contain the
         collection of suitability analysis layer feature classes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MakeSuitabilityAnalysisLayer_ba(
                *gp_fixargs((in_features, layer_name, out_dataset_path, out_dataset_name), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveSuitabilityCriteria_ba", None)
def RemoveSuitabilityCriteria(
    in_analysis_layer=None,
    drop_criteria=None,
) -> Result1[str | Layer]:
    """RemoveSuitabilityCriteria_ba(in_analysis_layer, drop_criteria;drop_criteria...)

       Removes criteria from a suitability analysis layer.

    INPUTS:
     in_analysis_layer (Feature Layer / Group Layer):
         The suitability analysis layer from which criteria will be removed.
     drop_criteria (String):
         A list of criteria to be removed from a suitability analysis layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveSuitabilityCriteria_ba(*gp_fixargs((in_analysis_layer, drop_criteria), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetCriteriaProperties_ba", None)
def SetCriteriaProperties(
    in_analysis_layer=None,
    criteria_properties=None,
    criteria_score_preset: Literal["SUM_SCALED", "GEOMEAN_SCALED", "CUSTOM"] | None = None,
    preprocessing: Literal["MINMAX", "PERCENTILE", "ZSCORE", "RAW"] | None = None,
    criteria_score_method: Literal["SUM", "MEAN", "PRODUCT", "GEOMETRIC_MEAN"] | None = None,
    final_score_method: Literal["METHOD_0_1", "METHOD_0_100", "NONE"] | None = None,
) -> Result1[str | Layer]:
    """SetCriteriaProperties_ba(in_analysis_layer, criteria_properties;criteria_properties..., {criteria_score_preset}, {preprocessing}, {criteria_score_method}, {final_score_method})

       Defines parameters for criteria.

    INPUTS:
     in_analysis_layer (Feature Layer / Group Layer):
         The Suitability Analysis layer that will be used in the analysis.
     criteria_properties (Value Table):
         The input features that will be used to set up the criteria
         properties.criterion-The field, point, or variable that will be used
         to calculate
         the suitability score.title-The name of the criteria.weight-The
         influence a criteria value has on the overall suitability
         score. The number must be greater than or equal to 0.
         influence-An example of a positive influence is as follows:
         You want a site to score higher if it has a greater number of
         households holding graduate or professional degrees. An example of an
         inverse influence is as follows: A lower median home value is more
         desirable, as it is indicative of greater home affordability. An
         example of an ideal influence is a search for areas within a range of
         values. POSITIVE-The higher the criteria value, the higher the
         suitability
         score.INVERSE-The lower the criteria value, the higher the suitability
         score.IDEAL-The closer to the ideal value, the higher the suitability
         score.TARGET-The closer to the target value, the higher the
         suitability
         score.ideal_value-The closer the criteria value is to the ideal value,
         the
         higher the suitability score.minimum_value-A numeric value that sets a
         hard limit for the criteria
         lower bound.maximum_value-A numeric value that sets a hard limit for
         the criteria
         upper bound.enabled-Use a value of true to include the criteria in the
         final
         suitability score.
     criteria_score_preset {String}:
         Specifies the preprocessing and combination method that will be used
         when calculating the final score.SUM_SCALED-The sum of scaled values
         with scores representing the
         distribution of values for each criterion will be used. This is the
         default.GEOMEAN_SCALED-The geometric mean of the scaled values will be
         used.CUSTOM-User-defined preprocessing and combination methods will be
         used.
     preprocessing {String}:
         Specifies the method that will be used to convert the input variables
         to a standardized scale.MINMAX-Variables will be scaled between 0 and
         1 using the minimum and
         maximum values of each variable. This is the default.PERCENTILE-
         Variables will be converted to percentiles between 0 and
         1.ZSCORE-Each variable will be standardized by subtracting the mean
         value and dividing by the standard deviation.RAW-The values of the
         variables will be used without change.
     criteria_score_method {String}:
         Specifies the method that will be used to combine the scaled variables
         into a single value.SUM-The values will be added. This is the
         default.MEAN-The
         arithmetic (additive) mean of the values will be calculated.
         This is the default.PRODUCT-The values will be multiplied. All scaled
         values must be
         greater than or equal to zero.GEOMETRIC_MEAN-The geometric
         (multiplicative) mean of the values will
         be calculated. All scaled values must be greater than or equal to
         zero.
     final_score_method {String}:
         Specifies the method that will be used to scale the combined score.
         This parameter will determine the final score.METHOD_0_1-The final
         score will be calculated with the lowest value of
         0 and the highest value of 1.METHOD_0_100-The final score will be
         calculated with the lowest value
         of 0 and the highest value of 100.NONE-The data will not be scaled.
         This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetCriteriaProperties_ba(
                *gp_fixargs(
                    (
                        in_analysis_layer,
                        criteria_properties,
                        criteria_score_preset,
                        preprocessing,
                        criteria_score_method,
                        final_score_method,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetTargetSite_ba", None)
def SetTargetSite(
    in_analysis_layer=None,
    target_site_layer=None,
    target_site_feature_id=None,
) -> Result1[str | Layer]:
    """SetTargetSite_ba(in_analysis_layer, {target_site_layer}, {target_site_feature_id})

       Adds a target site to a Suitability Analysis group layer.

    INPUTS:
     in_analysis_layer (Group Layer / Feature Dataset):
         The Suitability Analysis layer that will be used in the analysis.
     target_site_layer {Feature Layer}:
         The layer that contains the target site.
     target_site_feature_id {String}:
         The feature from the target site layer that will be added to the group
         layer as the target site."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetTargetSite_ba(*gp_fixargs((in_analysis_layer, target_site_layer, target_site_feature_id), True))
        )
        return retval
    except Exception as e:
        raise e


# Target Marketing toolset
@gptooldoc("AnalyzeMarketAreaGap_ba", None)
def AnalyzeMarketAreaGap(
    customer_layer=None,
    target_profile=None,
    base_profile=None,
    geography_level=None,
    out_feature_class=None,
    target_group=None,
    core_target=None,
    developmental_target=None,
    boundary_layer=None,
    create_report: Literal["CREATE_REPORT", "DO_NOT_CREATE_REPORT"] | None = None,
    report_title=None,
    report_folder=None,
    report_format=None,
) -> Result2[str, str]:
    """AnalyzeMarketAreaGap_ba(customer_layer, target_profile, base_profile, geography_level, out_feature_class, target_group, core_target, developmental_target, {boundary_layer}, {create_report}, {report_title}, {report_folder}, {report_format;report_format...})

       Generates a layer that displays the gap between total customers and
       expected customers.

    INPUTS:
     customer_layer (Feature Layer):
         A point layer representing customers.
     target_profile (File):
         A segmentation profile representing the segments to be analyzed. The
         target profile usually represents your customer segmentation profile.
     base_profile (File):
         A segmentation profile representing the base profile segments. This is
         the segmentation used for comparison. The base profile usually
         represents your market area segmentation profile.
     geography_level (String):
         The geography level that will be used to define the market area gap
         analysis layer.
     target_group (File):
         A collection of segments grouped into targets. Targets represent
         segments that are selected based on similar characteristics-for
         example, segments that have high index and percent composition.
     core_target (String):
         A group of segments that make up a large percentage of your customer
         base and have an above average index, indicating likelihood to be a
         customer.
     developmental_target (String):
         A group of segments that make up a significant percentage of your
         customers and of the market area but do not have an above average
         index.
     boundary_layer {Feature Layer}:
         The boundary that determines the layer extent. If no value is
         provided, the entire country will be used.
     create_report {Boolean}:
         Specifies whether a gap analysis report will be
         created.CREATE_REPORT-A gap analysis report will be
         created.DO_NOT_CREATE_REPORT-A gap analysis report will not be
         created. This
         is the default.
     report_title {String}:
         The title of the report.
     report_folder {Folder}:
         The output location where the report will be saved.
     report_format {String}:
         The report output format. The default value is PDF. Additional
         available formats are XLSX, HTML, CSV, and PAGX.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the market area gap analysis."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeMarketAreaGap_ba(
                *gp_fixargs(
                    (
                        customer_layer,
                        target_profile,
                        base_profile,
                        geography_level,
                        out_feature_class,
                        target_group,
                        core_target,
                        developmental_target,
                        boundary_layer,
                        create_report,
                        report_title,
                        report_folder,
                        report_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AnalyzeMarketPotential_ba", None)
def AnalyzeMarketPotential(
    target_profile=None,
    base_profile=None,
    geography_level=None,
    out_feature_class=None,
    boundary_layer=None,
    create_report: Literal["CREATE_REPORT", "DO_NOT_CREATE_REPORT"] | None = None,
    report_title=None,
    report_folder=None,
    report_format=None,
) -> Result2[str, str]:
    """AnalyzeMarketPotential_ba(target_profile, base_profile, geography_level, out_feature_class, {boundary_layer}, {create_report}, {report_title}, {report_folder}, {report_format;report_format...})

       Generates a layer that displays expected customers by a selected
       geography level.

    INPUTS:
     target_profile (File):
         A segmentation profile representing the segments to be analyzed. The
         target profile usually represents your customer segmentation profile.
     base_profile (File):
         A segmentation profile representing the base profile segments. This is
         the segmentation used for comparison. The base profile usually
         represents your market area segmentation profile.
     geography_level (String):
         The geography level that will be used to define the market potential
         layer.
     boundary_layer {Feature Layer}:
         The boundary that determines the layer extent. If no value is
         provided, the entire country will be used.
     create_report {Boolean}:
         Specifies whether a market potential report will be
         created.CREATE_REPORT-A market potential report will be
         created.DO_NOT_CREATE_REPORT-A market potential report will not be
         created.
         This is the default.
     report_title {String}:
         The title of the report.
     report_folder {Folder}:
         The output location where the report will be saved.
     report_format {String}:
         The report output format. The default value is PDF. Additional
         available formats are XLSX, HTML, CSV, and PAGX.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the market potential analysis."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeMarketPotential_ba(
                *gp_fixargs(
                    (
                        target_profile,
                        base_profile,
                        geography_level,
                        out_feature_class,
                        boundary_layer,
                        create_report,
                        report_title,
                        report_folder,
                        report_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateTargetGroup_ba", None)
def CreateTargetGroup(
    target_group=None,
    input_type=None,
) -> Result1[str]:
    """CreateTargetGroup_ba(target_group, input_type;input_type...)

       Creates a new target group. A target group is a container for targets
       that you create, name, and populate with segments from a locally
       installed Business Analyst dataset.

    INPUTS:
     input_type (Value Table):
         Specifies a list of the targets to be added to the new target
         group.name-The name of the target.segments-The segments to be added to
         the
         target.color-The color associated with the segment.

    OUTPUTS:
     target_group (File):
         The name for the output target group file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.CreateTargetGroup_ba(*gp_fixargs((target_group, input_type), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportSegmentationProfile_ba", None)
def ExportSegmentationProfile(
    in_profile=None,
    out_table_name=None,
) -> Result1[str]:
    """ExportSegmentationProfile_ba(in_profile, out_table_name)

       Exports a segmentation profile to a table.

    INPUTS:
     in_profile (File):
         The segmentation file that will be exported.

    OUTPUTS:
     out_table_name (Table):
         The name of the table that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportSegmentationProfile_ba(*gp_fixargs((in_profile, out_table_name), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateCustomerProfile_ba", None)
def GenerateCustomerProfile(
    in_customers_layer=None,
    in_segmentation_base=None,
    out_profile=None,
    in_volume_field=None,
) -> Result1[str]:
    """GenerateCustomerProfile_ba(in_customers_layer, in_segmentation_base, out_profile, {in_volume_field})

       Creates a segmentation profile with an existing customer layer.

    INPUTS:
     in_customers_layer (Feature Layer):
         The input point feature class that represents existing customers.
     in_segmentation_base (String):
         The segmentation base for the profile being created. Available options
         are provided by the segmentation dataset in use.
     in_volume_field {Field}:
         The field containing volume information from which the profile can
         optionally be created. For example, you can create a profile using the
         sales for each customer.

    OUTPUTS:
     out_profile (File):
         The name of the segmentation profile file to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateCustomerProfile_ba(
                *gp_fixargs((in_customers_layer, in_segmentation_base, out_profile, in_volume_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateMarketAreaProfile_ba", None)
def GenerateMarketAreaProfile(
    in_features=None,
    segmentation_base=None,
    out_profile=None,
) -> Result1[str]:
    """GenerateMarketAreaProfile_ba(in_features, segmentation_base, out_profile)

       Creates a segmentation profile by summarizing segments from standard
       geography boundaries within the input area.

    INPUTS:
     in_features (Feature Layer):
         The input feature class with polygon features used to create a
         segmentation area profile.
     segmentation_base (String):
         The segmentation base for the profile being created. Available options
         are provided by the segmentation dataset in use.

    OUTPUTS:
     out_profile (File):
         The name of the segmentation profile file to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateMarketAreaProfile_ba(*gp_fixargs((in_features, segmentation_base, out_profile), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateSegmentationProfileReport_ba", None)
def GenerateSegmentationProfileReport(
    target_profile=None,
    base_profile=None,
    report_title=None,
    report_folder=None,
    report_format=None,
) -> Result1[str]:
    """GenerateSegmentationProfileReport_ba(target_profile, base_profile, {report_title}, {report_folder}, {report_format;report_format...})

       Creates a report that displays segments of your customers and compares
       them to the study area (base profile).

    INPUTS:
     target_profile (File):
         A segmentation profile representing the segments to be profiled. The
         target profile usually represents your customer segmentation profile.
     base_profile (File):
         A segmentation profile representing the base profile segments. This is
         the segmentation used for comparison. The base profile usually
         represents your market area segmentation profile.
     report_title {String}:
         The title of the report.
     report_folder {Folder}:
         The output location where the report will be saved.
     report_format {String}:
         The report output format. The default value is PDF. Additional
         available formats are XLSX, HTML, CSV, and PAGX."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateSegmentationProfileReport_ba(
                *gp_fixargs((target_profile, base_profile, report_title, report_folder, report_format), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateSurveyReportForProfile_ba", None)
def GenerateSurveyReportForProfile(
    target_profile=None,
    base_profile=None,
    survey_category=None,
    report_folder=None,
    sort_column: Literal["EXPECTED_NUMBER", "INDEX"] | None = None,
    sort_order: Literal["ASCENDING", "DESCENDING"] | None = None,
    report_title=None,
    report_format=None,
) -> Result1[str]:
    """GenerateSurveyReportForProfile_ba(target_profile, base_profile, survey_category, report_folder, {sort_column}, {sort_order}, {report_title}, {report_format;report_format...})

       Displays characteristics from the consumer survey data for your target
       profile to determine customer lifestyle habits and preferences.

    INPUTS:
     target_profile (File):
         A segmentation profile representing the segments to be analyzed. The
         target profile usually represents your customer segmentation profile.
     base_profile (File):
         A segmentation profile representing the base profile segments. This is
         the segmentation used for comparison. The base profile usually
         represents your market area segmentation profile.
     survey_category (String):
         A category that contains characteristics from the consumer survey.
     report_folder (Folder):
         The output location where the report will be saved.
     sort_column {String}:
         Specifies the column to use to sort the report.EXPECTED_NUMBER-Sort is
         based on counts-for example, number of adults.
         This is the default.INDEX-Sort is based on rank.
     sort_order {String}:
         Specifies the order of the report, based on the sort column, in
         ascending or descending order.ASCENDING-Sort in ascending
         order.DESCENDING-Sort in descending order.
         This is the default.
     report_title {String}:
         The title of the report.
     report_format {String}:
         The report output format. The default value is PDF. Additional
         available formats are XLSX, HTML, CSV, and PAGX."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateSurveyReportForProfile_ba(
                *gp_fixargs(
                    (
                        target_profile,
                        base_profile,
                        survey_category,
                        report_folder,
                        sort_column,
                        sort_order,
                        report_title,
                        report_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateSurveyReportForTargets_ba", None)
def GenerateSurveyReportForTargets(
    target_profile=None,
    target_group=None,
    core_target=None,
    developmental_target=None,
    report_folder=None,
    report_type: Literal["UNDERSTANDING_YOUR_TARGET", "DEVELOPING_MARKET_STRATEGIES", "CUSTOM"] | None = None,
    survey_categories=None,
    report_title=None,
    report_format=None,
) -> Result1[str]:
    """GenerateSurveyReportForTargets_ba(target_profile, target_group, core_target, developmental_target, report_folder, {report_type}, {survey_categories;survey_categories...}, {report_title}, {report_format;report_format...})

       Displays the top characteristics, in each of the selected survey
       categories, of your Core and Developmental target groups, as well as
       your overall customer profile.

    INPUTS:
     target_profile (File):
         A segmentation profile representing the segments to be analyzed. The
         target profile usually represents your customer segmentation profile.
     target_group (File):
         A collection of segments grouped into targets. Targets represent
         segments that are selected based on similar characteristics-for
         example, segments that have high index and percent composition.
     core_target (String):
         A group of segments that make up a large percentage of your customer
         base and have an above average index, indicating likelihood to be a
         customer.
     developmental_target (String):
         A group of segments that make up a significant percentage of your
         customers and of the market area but do not have an above average
         index.
     report_folder (Folder):
         The output location where the report will be saved.
     report_type {String}:
         Specifies the survey categories to be added to the
         report.UNDERSTANDING_YOUR_TARGET-Media-related characteristics-for
         example,
         reading, watching, and listening
         related.DEVELOPING_MARKET_STRATEGIES-Leisure-related
         characteristics-for
         example, leisure, sports, and travel.CUSTOM-User-defined
         characteristics. This is the default.
     survey_categories {String}:
         A category that contains the characteristics from the consumer survey.
     report_title {String}:
         The title of the report.
     report_format {String}:
         The report output format. The default value is PDF. Additional
         available formats are XLSX, HTML, CSV, and PAGX."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateSurveyReportForTargets_ba(
                *gp_fixargs(
                    (
                        target_profile,
                        target_group,
                        core_target,
                        developmental_target,
                        report_folder,
                        report_type,
                        survey_categories,
                        report_title,
                        report_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateTargetGroupLayer_ba", None)
def GenerateTargetGroupLayer(
    geography_level=None,
    segmentation_base=None,
    out_feature_class=None,
    target_group=None,
    boundary_layer=None,
) -> Result1[str]:
    """GenerateTargetGroupLayer_ba(geography_level, segmentation_base, out_feature_class, target_group, {boundary_layer})

       Generates a layer that identifies geographies that contain selected
       segments and categorized groups based on targets.

    INPUTS:
     geography_level (String):
         The geography level that will be used to define the target layer.
     segmentation_base (String):
         The segmentation base for the profile being created. Available options
         are provided by the segmentation dataset in use.
     target_group (File):
         A user-created group of targets. This is used if the dataset supports
         target groups.
     boundary_layer {Feature Layer}:
         The boundary that determines the layer extent.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class for the target layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateTargetGroupLayer_ba(
                *gp_fixargs((geography_level, segmentation_base, out_feature_class, target_group, boundary_layer), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateTargetLayer_ba", None)
def GenerateTargetLayer(
    geography_level=None,
    segmentation_base=None,
    out_feature_class=None,
    input_type: Literal["USE_TARGET_GROUP", "SELECT_SEGMENTS"] | None = None,
    target_group=None,
    target=None,
    segments=None,
    boundary_layer=None,
) -> Result1[str]:
    """GenerateTargetLayer_ba(geography_level, segmentation_base, out_feature_class, input_type, {target_group}, {target}, {segments;segments...}, {boundary_layer})

       Creates a layer that identifies geographies that contain selected
       segments and geographies that do not contain selected segments.

    INPUTS:
     geography_level (String):
         The geography level that will be used to define the target layer.
     segmentation_base (String):
         The segmentation base for the profile being created. Available options
         are provided by the segmentation dataset in use.
     input_type (String):
         Specifies whether target groups or segments will be
         used.USE_TARGET_GROUP-A group of targets will be
         used.SELECT_SEGMENTS-Segments will be used. One or more segments can
         make
         up a target.
     target_group {File}:
         The target group, if the dataset supports target groups.
     target {String}:
         A target from the selected target_group.
     segments {String}:
         Segments from the provided dataset.
     boundary_layer {Feature Layer}:
         The boundary that determines the layer extent.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class for the target layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateTargetLayer_ba(
                *gp_fixargs(
                    (
                        geography_level,
                        segmentation_base,
                        out_feature_class,
                        input_type,
                        target_group,
                        target,
                        segments,
                        boundary_layer,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateTargetPenetrationLayer_ba", None)
def GenerateTargetPenetrationLayer(
    geography_level=None,
    segmentation_base=None,
    out_feature_class=None,
    input_type: Literal["USE_TARGET_GROUP", "SELECT_SEGMENTS"] | None = None,
    target_group=None,
    target=None,
    segments=None,
    boundary_layer=None,
) -> Result1[str]:
    """GenerateTargetPenetrationLayer_ba(geography_level, segmentation_base, out_feature_class, input_type, {target_group}, {target}, {segments;segments...}, {boundary_layer})

       Generates a layer based on the percent of penetration of selected
       segments, providing a detailed view of the concentrations of your
       target segments.

    INPUTS:
     geography_level (String):
         The geography level that will be used to define the target layer.
     segmentation_base (String):
         The segmentation base for the profile being created. Available options
         are provided by the segmentation dataset in use.
     input_type (String):
         The geographic layer containing the segmentation data or the target
         group.USE_TARGET_GROUP-A target group will be used as the input
         type.SELECT_SEGMENTS-Selected segments will be used as the input type.
         One
         or more segments can compose a target. This is the default.
     target_group {File}:
         A user-created group of targets. This parameter is used when the
         dataset supports target groups.
     target {String}:
         A target from the selected target_group.
     segments {String}:
         Segments from the provided dataset.
     boundary_layer {Feature Layer}:
         The boundary that determines the extent of the analysis.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class for the target layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateTargetPenetrationLayer_ba(
                *gp_fixargs(
                    (
                        geography_level,
                        segmentation_base,
                        out_feature_class,
                        input_type,
                        target_group,
                        target,
                        segments,
                        boundary_layer,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportSegmentationProfile_ba", None)
def ImportSegmentationProfile(
    in_table=None,
    segmentation_base=None,
    out_profile=None,
    segment_id_field=None,
    count_field=None,
    total_volume_field=None,
) -> Result1[str]:
    """ImportSegmentationProfile_ba(in_table, segmentation_base, out_profile, segment_id_field, count_field, {total_volume_field})

       Generates a segmentation profile from a table.

    INPUTS:
     in_table (Table View):
         The input table with segmentation information.
     segmentation_base (String):
         The segmentation base for the profile being created. Available options
         are provided by the segmentation dataset being used.
     segment_id_field (Field):
         A string field that contains the segmentation code.
     count_field (Field):
         A numeric field that contains segment count information.
     total_volume_field {Field}:
         A numeric field that contains volume information.

    OUTPUTS:
     out_profile (File):
         The name of the segmentation file that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportSegmentationProfile_ba(
                *gp_fixargs(
                    (in_table, segmentation_base, out_profile, segment_id_field, count_field, total_volume_field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportSurveyProfiles_ba", None)
def ImportSurveyProfiles(
    profiles=None,
    out_folder=None,
) -> Result1[str]:
    """ImportSurveyProfiles_ba(profiles;profiles..., out_folder)

       Imports segmentation profiles consisting of survey variable data.

    INPUTS:
     profiles (String):
         The categories of survey variables that can be selected for importing
         as profiles.
     out_folder (Folder):
         The folder that will contain the imported profiles."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.ImportSurveyProfiles_ba(*gp_fixargs((profiles, out_folder), True)))
        return retval
    except Exception as e:
        raise e


# Trade Areas toolset
@gptooldoc("AssignCustomersByDistance_ba", None)
def AssignCustomersByDistance(
    in_features=None,
    in_store_features=None,
    store_id_field=None,
    out_feature_class=None,
    link_field=None,
    distance_type=None,
    distance_units=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    search_tolerance=None,
) -> Result1[str]:
    """AssignCustomersByDistance_ba(in_features, in_store_features, store_id_field, out_feature_class, {link_field}, {distance_type}, {distance_units}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance})

       Assigns customers to the closest store based on a selected distance
       type.

    INPUTS:
     in_features (Feature Layer):
         The input point feature layer representing customers.
     in_store_features (Feature Layer):
         The input point feature layer representing store or facilities.
     store_id_field (Field):
         A unique ID field for in_store_features.
     link_field {String}:
         A new field that contains the assigned store or facility ID.
     distance_type {String}:
         The method of travel used to calculate the distance between customers
         and stores.
     distance_units {String}:
         The units that will be used to measure the selected distance type.
     travel_direction {String}:
         Specifies the direction of travel that will be used between stores or
         facilities and customers.TOWARD_STORES-The direction of travel will be
         from customers to
         stores. This is the default.AWAY_FROM_STORES-The direction of travel
         will be from stores to
         customers.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.TIME_ZONE_AT_LOCATION-The time zone in which the territories
         are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.
     search_tolerance {Linear Unit}:
         The maximum distance that input points can be from the network. Points
         located beyond the search tolerance will be excluded from
         processing.The parameter requires a distance value and units for the
         tolerance.
         The default value is 5000 meters.

    OUTPUTS:
     out_feature_class (Feature Class):
         A point layer containing customers with assigned store or facility and
         distance."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AssignCustomersByDistance_ba(
                *gp_fixargs(
                    (
                        in_features,
                        in_store_features,
                        store_id_field,
                        out_feature_class,
                        link_field,
                        distance_type,
                        distance_units,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CustomerDerivedTA_ba", None)
def CustomerDerivedTA(
    in_stores_layer=None,
    store_id_field=None,
    in_customers_layer=None,
    link_field=None,
    out_feature_class=None,
    method: Literal[
        "SIMPLE", "AMOEBA", "DETAILED", "DETAILED_WITH_SMOOTHING", "THRESHOLD_RINGS", "THRESHOLD_DRIVETIMES"
    ]
    | None = None,
    rings=None,
    customer_aggregation_type: Literal["COUNT", "WEIGHT"] | None = None,
    customer_weight_field=None,
    exclude_outlying_customers: Literal["EXCLUDE_OUTLIERS", "ALL_POINTS"] | None = None,
    cutoff_distance=None,
    dissolve_option: Literal["OVERLAP", "SPLIT"] | None = None,
    use_customer_centroids: Literal["USE_CENTROIDS", "USE_STORES"] | None = None,
    distance_type=None,
    units=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    search_tolerance=None,
    polygon_detail: Literal["STANDARD", "GENERALIZED", "HIGH"] | None = None,
    iterations_limit=None,
    minimum_step=None,
    target_percent_diff=None,
) -> Result1[str]:
    """CustomerDerivedTA_ba(in_stores_layer, store_id_field, in_customers_layer, link_field, out_feature_class, method, rings;rings..., customer_aggregation_type, {customer_weight_field}, {exclude_outlying_customers}, {cutoff_distance}, {dissolve_option}, {use_customer_centroids}, {distance_type}, {units}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance}, {polygon_detail}, {iterations_limit}, {minimum_step}, {target_percent_diff})

       Creates trade areas around stores based on the number of customers or
       volume attribute of each customer.

    INPUTS:
     in_stores_layer (Feature Layer):
         A point layer representing store or facility locations.
     store_id_field (Field):
         The unique ID field representing a store or facility location.
     in_customers_layer (Feature Layer):
         An input point layer representing customers or patrons.
     link_field (Field):
         An ID field that will be used to assign individual customers to
         stores.
     method (String):
         Specifies the type of customer-derived trade area that will be
         generated.SIMPLE-A generalized trade area based on the percentages of
         customers
         corresponding to each store will be generated.AMOEBA-Points
         representing the boundary of the polygon trade area will
         be connected using natural curvature.DETAILED-Points representing the
         boundary of the polygon trade area
         will be connected using straight lines.DETAILED_WITH_SMOOTHING-Points
         representing the boundary of the
         polygon trade area will be connected with smoothed curves using cubic
         splines. This method takes into account the shape and pattern of the
         customer distributions. This is the default.THRESHOLD_RINGS-
         Concentric rings that expand from input stores until
         they contain the specified threshold of customers will be
         generated.THRESHOLD_DRIVETIMES-Polygons that expand from stores along
         network
         routes until they contain the specified threshold of customers will be
         generated.
     rings (Double):
         The values that will be used to represent the percentage of customers,
         for example, total count or a customer attribute and total sales
         assigned to each store. Each value represents one trade area polygon.
     customer_aggregation_type (String):
         Specifies the type of aggregation that will be used.COUNT-Percentage-
         based trade areas will be calculated using the
         geographic locations of customers. This is the
         default.WEIGHT-Percentage-based trade areas will be calculated using a
         customer attribute, for example, sales.
     customer_weight_field {Field}:
         The field that will be used to calculate the trade areas. This is
         based on either the number of customers (count) or the calculated
         weighted value assigned to each customer.
     exclude_outlying_customers {Boolean}:
         Specifies whether outlying customers will be excluded from the trade
         area generation.EXCLUDE_OUTLIERS-Outlying customers will be
         excluded.ALL_POINTS-Outlying customers will not be excluded; all
         customers will
         be considered. This is the default.
     cutoff_distance {Linear Unit}:
         The distance beyond which customers will be considered outliers and
         excluded from consideration during trade area generation.
     dissolve_option {String}:
         Specifies whether polygons of the entire area will be created or the
         polygons will be split into individual features. When the method
         parameter is set to THRESHOLD_DRIVETIMES, the only available option is
         OVERLAP.OVERLAP-Output polygons will be generated in which each
         feature
         begins at zero and grows to satisfy the specified percentage of
         customers. For example, if you specify a trade area of 50 percent and
         70 percent of customers, one polygon will be generated to include 0 to
         50 percent and a second polygon will include all 0 to 70 percent of
         customers. This is the default.SPLIT-Output polygons will be
         generated for individual features based
         on the specified percentage breaks. For example, if you specify a
         trade area of 50 percent and 70 percent of customers, one polygon will
         be generated to include 0 to 50 percent and a second polygon will
         include 50 to 70 percent of customers.
     use_customer_centroids {Boolean}:
         Specifies whether the centroid of your customer area will be used to
         calculate trade areas outward from this point.USE_CENTROIDS-The
         centroid of customer points will be used to
         calculate trade areas.USE_STORES-The centroid of customer points will
         not used; store
         location will be used as the starting point to calculate trade areas.
         This is the default.
     distance_type {String}:
         The method of travel that will be used to calculate the distance.
     units {String}:
         The units that will be used for the distance values.
     travel_direction {String}:
         Specifies the direction of travel toward or away from
         stores.TOWARD_STORES-The direction of travel will be toward stores.
         This is
         the default.AWAY_FROM_STORES-The direction of travel will be away
         from stores.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.TIME_ZONE_AT_LOCATION-The time zone in which the territories
         are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.
     search_tolerance {Linear Unit}:
         The maximum distance that input points can be from the network. Points
         located beyond the search tolerance will be excluded from
         processing.This parameter requires a distance value and units for the
         tolerance.
     polygon_detail {String}:
         Specifies the level of detail that will be used for the output drive
         time polygons.STANDARD-Polygons with a standard level of detail will
         be created.
         This is the default.GENERALIZED-Generalized polygons will be created
         using the hierarchy
         present in the network data source to produce results quickly.HIGH-
         Polygons with a high level of detail will be created for
         applications in which precise results are important.
     iterations_limit {Long}:
         Restricts the number of drive times that can be used to find the
         optimal threshold limit.
     minimum_step {Double}:
         The minimum increment distance or time-for example, 1 mile or 1
         minute-that will be used between iterations to expand until the
         threshold is reached.
     target_percent_diff {Double}:
         The maximum percentage difference between the target value and
         threshold value that will be used when determining the threshold drive
         time, for example, 5 percent. The default value is 5.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output trade area feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CustomerDerivedTA_ba(
                *gp_fixargs(
                    (
                        in_stores_layer,
                        store_id_field,
                        in_customers_layer,
                        link_field,
                        out_feature_class,
                        method,
                        rings,
                        customer_aggregation_type,
                        customer_weight_field,
                        exclude_outlying_customers,
                        cutoff_distance,
                        dissolve_option,
                        use_customer_centroids,
                        distance_type,
                        units,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                        polygon_detail,
                        iterations_limit,
                        minimum_step,
                        target_percent_diff,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateApproximateDriveTimes_ba", None)
def GenerateApproximateDriveTimes(
    in_features=None,
    out_feature_class=None,
    distance_type=None,
    units=None,
    in_stores_layer=None,
    store_id_field=None,
    link_field=None,
    iterations_limit=None,
    minimum_step=None,
    target_percent_diff=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    search_tolerance=None,
    polygon_detail: Literal["STANDARD", "GENERALIZED", "HIGH"] | None = None,
) -> Result1[str]:
    """GenerateApproximateDriveTimes_ba(in_features, out_feature_class, distance_type, {units}, {in_stores_layer}, {store_id_field}, {link_field}, {iterations_limit}, {minimum_step}, {target_percent_diff}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance}, {polygon_detail})

       Creates trade areas that approximate the size, shape, and area of
       existing polygons using available routes from the selected distance
       type.

    INPUTS:
     in_features (Feature Layer):
         The input polygon feature layer.
     distance_type (String):
         The method of travel used to create the output polygons.
     units {String}:
         The distance units to be used with the threshold values.
     in_stores_layer {Feature Layer}:
         A point layer that will be used as the starting point for creating
         network service areas.
     store_id_field {Field}:
         The ID that uniquely identifies each in_stores_layer point.
     link_field {Field}:
         The ID that uniquely identifies each in_features point.
     iterations_limit {Long}:
         The maximum number of drive times that can be used to find the optimal
         threshold limit.
     minimum_step {Double}:
         The minimum increment distance or time-for example, 1 mile or 1
         min-that will be used between iterations to expand until the threshold
         is reached.
     target_percent_diff {Double}:
         The maximum difference between the target value and threshold value
         when determining the threshold drive time, for example, 5 percent. The
         default value is 5.
     travel_direction {String}:
         Specifies the direction of travel toward or away from
         stores.TOWARD_STORES-The direction of travel will be toward stores.
         This is
         the default.AWAY_FROM_STORES-The direction of travel will be away
         from stores.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.TIME_ZONE_AT_LOCATION-The time zone in which the territories
         are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.
     search_tolerance {Linear Unit}:
         The maximum distance that input points can be from the network.The
         default value is 5000 meters.
     polygon_detail {String}:
         Specifies the level of detail that will be used for the output drive
         time polygons.STANDARD-Polygons with a standard level of detail will
         be created.
         This is the default.GENERALIZED-Generalized polygons will be created
         using the hierarchy
         present in the network data source to produce results
         quickly.HIGH-Polygons with a high level of detail will be created for
         applications in which precise results are important.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the drive time polygons."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateApproximateDriveTimes_ba(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        distance_type,
                        units,
                        in_stores_layer,
                        store_id_field,
                        link_field,
                        iterations_limit,
                        minimum_step,
                        target_percent_diff,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                        polygon_detail,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateDriveTimeTradeArea_ba", None)
def GenerateDriveTimeTradeArea(
    in_features=None,
    out_feature_class=None,
    distance_type=None,
    distances=None,
    units=None,
    id_field=None,
    dissolve_option: Literal["OVERLAP", "SPLIT"] | None = None,
    remove_overlap: Literal["REMOVE_OVERLAP", "KEEP_OVERLAP"] | None = None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    search_tolerance=None,
    polygon_detail: Literal["STANDARD", "GENERALIZED", "HIGH"] | None = None,
    input_method: Literal["VALUES", "EXPRESSION"] | None = None,
    expression=None,
) -> Result1[str]:
    """GenerateDriveTimeTradeArea_ba(in_features, out_feature_class, distance_type, {distances;distances...}, {units}, {id_field}, {dissolve_option}, {remove_overlap}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance}, {polygon_detail}, {input_method}, {expression})

       Creates a feature class of trade areas around point features based on
       travel time and distance.

    INPUTS:
     in_features (Feature Layer):
         The input point feature layer.
     distance_type (String):
         The method of travel that will be used for drive time calculation.
     distances {Double}:
         The distances that will be used for drive time calculations.
     units {String}:
         The units that will be used for the distance values. The default value
         is miles.
     id_field {Field}:
         A unique ID field for existing facilities.
     dissolve_option {String}:
         Specifies whether overlapping or nonoverlapping service areas for a
         single location will be used when multiple distances are
         specified.OVERLAP-Each polygon will include the area reachable from
         the
         facility up to the distance value. This is the default.SPLIT-Each
         polygon will include only the area between consecutive
         distance values.
     remove_overlap {Boolean}:
         Specifies whether overlapping concentric rings will be created or
         overlap will be removed from multiple locations in relation to one
         another.REMOVE_OVERLAP-Polygons will be split and the overlap between
         output
         features will be removed.KEEP_OVERLAP-Output features will be created
         with overlap. This is the
         default.
     travel_direction {String}:
         Specifies the direction of travel toward or away from
         stores.TOWARD_STORES-The direction of travel will be toward stores.
         This is
         the default.AWAY_FROM_STORES-The direction of travel will be away
         from stores.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone that will be used for the time_of_day
         parameter.TIME_ZONE_AT_LOCATION-The time zone in which the territories
         are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.
     search_tolerance {Linear Unit}:
         The maximum distance that input points can be from the network. Points
         located beyond the search tolerance will be excluded from
         processing.This parameter requires a distance value and units for the
         tolerance.
         The default value is 5000 meters.
     polygon_detail {String}:
         Specifies the level of detail that will be used for the output drive
         time polygons.STANDARD-Polygons with a standard level of detail will
         be created.
         This is the default.GENERALIZED-Generalized polygons will be created
         using the hierarchy
         present in the network data source to produce results quickly.HIGH-
         Polygons with a high level of detail will be created for
         applications in which precise results are important.
     input_method {String}:
         Specifies the type of value that will be used for each drive
         time.VALUES-A constant value will be used (all trade areas will be the
         same
         size). This is the default.EXPRESSION-The values from a field or an
         expression will be used
         (trade areas can be different sizes).
     expression {SQL Expression}:
         A fields-based expression used to calculate drive time.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the drive time polygons."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateDriveTimeTradeArea_ba(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        distance_type,
                        distances,
                        units,
                        id_field,
                        dissolve_option,
                        remove_overlap,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                        polygon_detail,
                        input_method,
                        expression,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateGeographiesFromOverlay_ba", None)
def GenerateGeographiesFromOverlay(
    geography_level=None,
    in_features=None,
    id_field=None,
    out_feature_class=None,
    overlap_type: Literal["INTERSECT", "CENTROID_WITHIN", "COMPLETELY_WITHIN"] | None = None,
    ratios: Literal["NO_RATIOS", "AREA_ONLY", "ALL_RATIOS"] | None = None,
) -> Result1[str]:
    """GenerateGeographiesFromOverlay_ba(geography_level, in_features, id_field, out_feature_class, {overlap_type}, {ratios})

       Generates trade areas from the features of an input standard geography
       level that has a specified spatial relationship with the input.

    INPUTS:
     geography_level (String):
         The geography level that will be used to define the trade area.
     in_features (Feature Layer):
         The features that will be used to extract the standard geography level
         features by the specified spatial relationship. It can be either all
         features from the layer or only those selected once a selection is
         available.
     id_field (Field):
         The field that will be used to identify the in_features parameter
         value-for example, the IDs of drive time polygons.
     overlap_type {String}:
         Specifies how the subgeography will be selected from the boundary
         layer.INTERSECT-If any of the subgeography features touch or intersect
         the
         boundary layer, they will be included in the output layer. This is the
         default.CENTROID_WITHIN-If the centroids of any of the subgeography
         features
         are contained within the boundary layer, they will be included in the
         output layer.COMPLETELY_WITHIN-Only the features of the subgeography
         layer that are
         completely contained within the boundary layer will be included in the
         output layer.
     ratios {String}:
         Specifies the ratios that will be calculated.NO_RATIOS-No ratios will
         be calculated. This is the
         default.AREA_ONLY-Only the ratios within the portion (area) of the
         standard
         geography level that intersects an input feature will be
         calculated.ALL_RATIOS-All available ratios will be calculated. This
         option is not
         available when using online data.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature containing the trade area."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateGeographiesFromOverlay_ba(
                *gp_fixargs((geography_level, in_features, id_field, out_feature_class, overlap_type, ratios), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateThresholdDriveTimeTradeArea_ba", None)
def GenerateThresholdDriveTimeTradeArea(
    in_features=None,
    out_feature_class=None,
    threshold_variable=None,
    threshold_values=None,
    distance_type=None,
    units=None,
    id_field=None,
    travel_direction: Literal["TOWARD_STORES", "AWAY_FROM_STORES"] | None = None,
    time_of_day=None,
    time_zone: Literal["UTC", "TIME_ZONE_AT_LOCATION"] | None = None,
    search_tolerance=None,
    polygon_detail: Literal["STANDARD", "GENERALIZED", "HIGH"] | None = None,
    iterations_limit=None,
    minimum_step=None,
    target_percent_diff=None,
    input_method: Literal["VALUES", "EXPRESSION"] | None = None,
    expression=None,
) -> Result1[str]:
    """GenerateThresholdDriveTimeTradeArea_ba(in_features, out_feature_class, threshold_variable, {threshold_values;threshold_values...}, distance_type, {units}, {id_field}, {travel_direction}, {time_of_day}, {time_zone}, {search_tolerance}, {polygon_detail}, {iterations_limit}, {minimum_step}, {target_percent_diff}, {input_method}, {expression})

       Creates a feature class of network distance trade areas that expand
       around point features until criteria is reached.

    INPUTS:
     in_features (Feature Layer):
         The input point feature layer.
     threshold_variable (String):
         The selected Business Analyst dataset variable to which the threshold
         value will be applied.Threshold variables must be numeric. No other
         statistic type is
         supported.
     threshold_values {Double}:
         The threshold variable value that will determine the size of the
         output rings. The rings will expand until they contain the threshold
         value of the selected variable.
     distance_type (String):
         The method of travel that will be used to create the output polygons.
     units {String}:
         The distance units that will be used with the threshold values.
     id_field {Field}:
         The ID that uniquely identifies each input point and is included in
         the output as an attribute.
     travel_direction {String}:
         Specifies the direction of travel toward or away from
         stores.TOWARD_STORES-The direction of travel will be toward stores.
         This is
         the default.AWAY_FROM_STORES-The direction of travel will be away
         from stores.
     time_of_day {Date}:
         The time and date that will be used when calculating distance.
     time_zone {String}:
         Specifies the time zone that will be used for theparameter.
         Time of DayTIME_ZONE_AT_LOCATION-The time zone in which the
         territories are
         located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.
     search_tolerance {Linear Unit}:
         The maximum distance that input points can be from the network.The
         default value is 5,000 meters.
     polygon_detail {String}:
         Specifies the level of detail that will be used for the output drive
         time polygons.STANDARD-Polygons with a standard level of detail will
         be created.
         This is the default.GENERALIZED-Generalized polygons will be created
         using the hierarchy
         present in the network data source to produce results
         quickly.HIGH-Polygons with a high level of detail will be created for
         applications in which precise results are important.
     iterations_limit {Long}:
         Restricts the number of drive times that can be used to find the
         optimal threshold limit.
     minimum_step {Double}:
         The minimum distance between one threshold area candidate and the next
         as the model approaches the threshold value to prevent infinite
         iterations.
     target_percent_diff {Double}:
         The maximum percentage difference between the target value and
         threshold value that will be used when determining the threshold drive
         time, for example, 5 percent. The default value is 5.
     input_method {String}:
         Specifies the type of value that will be used for each drive
         time.VALUES-A constant value will be used (all trade areas will be the
         same
         size). This is the default.EXPRESSION-The values from a field or an
         expression will be used
         (trade areas can be different sizes).
     expression {SQL Expression}:
         A fields-based expression that will be used to calculate drive time.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the drive time polygons."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateThresholdDriveTimeTradeArea_ba(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        threshold_variable,
                        threshold_values,
                        distance_type,
                        units,
                        id_field,
                        travel_direction,
                        time_of_day,
                        time_zone,
                        search_tolerance,
                        polygon_detail,
                        iterations_limit,
                        minimum_step,
                        target_percent_diff,
                        input_method,
                        expression,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateThresholdRingTradeArea_ba", None)
def GenerateThresholdRingTradeArea(
    in_features=None,
    out_feature_class=None,
    threshold_variable=None,
    threshold_values=None,
    units=None,
    id_field=None,
    input_method: Literal["VALUES", "EXPRESSION"] | None = None,
    expression=None,
    minimum_step=None,
    target_percent_diff=None,
) -> Result1[str]:
    """GenerateThresholdRingTradeArea_ba(in_features, out_feature_class, threshold_variable, {threshold_values;threshold_values...}, {units}, {id_field}, {input_method}, {expression}, {minimum_step}, {target_percent_diff})

       Creates a feature class of ring trade areas that expand around point
       features until the threshold value is reached.

    INPUTS:
     in_features (Feature Layer):
         The input point feature layer.
     threshold_variable (String):
         The selected Business Analyst dataset variable to which the threshold
         value will be applied.Threshold variables must be numeric. No other
         statistic type is
         supported.
     threshold_values {Double}:
         The threshold variable value that will determine the size of the
         output rings. The rings will expand until they contain the threshold
         value of the selected variable.
     units {String}:
         The distance units that will be used with the threshold values.
     id_field {Field}:
         The ID that uniquely identifies each input point and is included in
         the output as an attribute.
     input_method {String}:
         Specifies the type of value that will be used for each drive
         time.VALUES-A constant value will be used (all trade areas will be the
         same
         size). This is the default.EXPRESSION-The values from a field or an
         expression will be used
         (trade areas can be different sizes).
     expression {SQL Expression}:
         A fields-based expression that will be used to calculate the radii.
     minimum_step {Double}:
         The minimum distance between one threshold area candidate and the next
         as the model approaches the threshold value to prevent infinite
         iterations.
     target_percent_diff {Double}:
         The maximum percentage difference between the target value and
         threshold value that will be used when determining the threshold drive
         time, for example, 5 percent. The default value is 5.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the threshold rings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateThresholdRingTradeArea_ba(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        threshold_variable,
                        threshold_values,
                        units,
                        id_field,
                        input_method,
                        expression,
                        minimum_step,
                        target_percent_diff,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateTradeAreaRings_ba", None)
def GenerateTradeAreaRings(
    in_features=None,
    out_feature_class=None,
    radii=None,
    units=None,
    id_field=None,
    remove_overlap: Literal["REMOVE_OVERLAP", "KEEP_OVERLAP"] | None = None,
    dissolve_option: Literal["OVERLAP", "SPLIT"] | None = None,
    input_method: Literal["VALUES", "EXPRESSION"] | None = None,
    expression=None,
) -> Result1[str]:
    """GenerateTradeAreaRings_ba(in_features, out_feature_class, {radii;radii...}, {units}, {id_field}, {remove_overlap}, {dissolve_option}, {input_method}, {expression})

       Creates rings around point locations.

    INPUTS:
     in_features (Feature Layer):
         The input features containing the center points for the rings.
     radii {Double}:
         The distances, in ascending size, used to create rings around the
         input features.
     units {String}:
         The linear unit to be used with the distance values.
     id_field {Field}:
         A unique ID field in the ring center layer.
     remove_overlap {Boolean}:
         Creates overlapping concentric rings or removes
         overlap.REMOVE_OVERLAP-Thiessen polygons are used to remove overlap
         between
         output ring polygons.KEEP_OVERLAP-Output ring features are created
         with overlap. This is
         the default.
     dissolve_option {String}:
         Specifies whether overlapping or nonoverlapping service areas for a
         single location will be used when multiple distances are
         specified.OVERLAP-Each polygon will include the area reachable from
         the facility
         up to the distance value. This is the default.SPLIT-Each polygon will
         include only the area between consecutive
         distance values.
     input_method {String}:
         Specifies the type of value that is to be used for each drive
         time.VALUES-Uses a constant value (all trade areas will be the same
         size).
         This is the default.EXPRESSION-The values from a field or an
         expression (trade areas can
         be a different size).
     expression {SQL Expression}:
         A fields-based expression to calculate the radii.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class that will contain the output ring features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateTradeAreaRings_ba(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        radii,
                        units,
                        id_field,
                        remove_overlap,
                        dissolve_option,
                        input_method,
                        expression,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MeasureCannibalization_ba", None)
def MeasureCannibalization(
    in_features=None,
    area_id_field=None,
    area_description_field=None,
    out_feature_class=None,
    store_id_field=None,
    create_report: Literal["CREATE_REPORT", "DO_NOT_CREATE_REPORT"] | None = None,
    report_title=None,
    report_folder=None,
    report_format=None,
    variables=None,
) -> Result2[str, str]:
    """MeasureCannibalization_ba(in_features, area_id_field, area_description_field, out_feature_class, {store_id_field}, {create_report}, {report_title}, {report_folder}, {report_format;report_format...}, {variables;variables...})

       Calculates the amount of overlap between two or more polygons. Overlap
       refers to the extent of the polygons beyond intersection.

    INPUTS:
     in_features (Feature Layer):
         The input polygon features that will be analyzed for overlap.
     area_id_field (Field):
         The field that uniquely identifies each feature in the input layer.
     area_description_field (Field):
         The field that describes each feature in the input layer.
     store_id_field {Field}:
         The unique ID that associates a store with each polygon when the
         inputs are trade areas.
     create_report {Boolean}:
         Specifies whether a report will be generated.CREATE_REPORT-A report
         will be generated.DO_NOT_CREATE_REPORT-A report
         will not be generated. This is the
         default.
     report_title {String}:
         The title of the report. The default value is Measure Cannibalization.
     report_folder {Folder}:
         The output location where the report will be saved.
     report_format {String}:
         The output format or formats of the report.
     variables {String}:
         One or more variables that will be used to calculate additional
         overlap metrics-for example, the total number of people and households
         in intersection areas, or the percentage of the total number of people
         and households in a trade area falling into overlapped area.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that will contain the areas of overlap found
         in the input layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MeasureCannibalization_ba(
                *gp_fixargs(
                    (
                        in_features,
                        area_id_field,
                        area_description_field,
                        out_feature_class,
                        store_id_field,
                        create_report,
                        report_title,
                        report_folder,
                        report_format,
                        variables,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveOverlap_ba", None)
def RemoveOverlap(
    in_features=None,
    out_feature_class=None,
    method: Literal["CENTER_LINE", "THIESSEN", "GRID"] | None = None,
    define_trade_area: Literal["DEFINE_TRADE_AREA", "DO_NOT_DEFINE_TRADE_AREA"] | None = None,
    ring_id_field=None,
    weight_field=None,
    store_id=None,
    in_stores_layer=None,
    link_field=None,
) -> Result1[str]:
    """RemoveOverlap_ba(in_features, out_feature_class, {method}, {define_trade_area}, {ring_id_field}, {weight_field}, {store_id}, {in_stores_layer}, {link_field})

       Removes overlap between two or more areas to form adjacent boundaries.

    INPUTS:
     in_features (Feature Layer):
         The input features containing the overlapping polygons.
     method {String}:
         Specifies how the overlap between trade areas will be
         removed.CENTER_LINE-Overlap will be removed by creating a border that
         evenly
         distributes the area of intersection between polygons. This is the
         default.THIESSEN-Overlap will be removed using straight lines to
         divide the
         area of intersection.GRID-Overlap will be removed by creating a grid
         of parallel lines
         used to define a natural division between polygons.
     define_trade_area {Boolean}:
         Specifies whether ring overlap in a trade area will be
         removed.DEFINE_TRADE_AREA-Overlap will only be removed between
         polygons with
         equal values in the ring_id_field
         parameter.DO_NOT_DEFINE_TRADE_AREA-Overlap will be removed from all
         intersecting
         polygons. This is the default.
     ring_id_field {Field}:
         A field from the input that defines common trade areas. Overlap
         between polygons will only be removed if their values in this field
         are equal.
     weight_field {Field}:
         A field from the input used to influence removal of overlap based on
         its values.
     store_id {Field}:
         A unique ID field in the stores feature layer.
     in_stores_layer {Feature Layer}:
         The input features containing the center points for the overlapping
         trade areas.
     link_field {Field}:
         A unique ID field representing a store or facility location.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the new trade area features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveOverlap_ba(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        method,
                        define_trade_area,
                        ring_id_field,
                        weight_field,
                        store_id,
                        in_stores_layer,
                        link_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RemoveOverlapMultiple_ba", None)
def RemoveOverlapMultiple(
    in_features=None,
    out_feature_class=None,
    method: Literal["CENTER_LINE", "THIESSEN", "GRID"] | None = None,
    join_attributes: Literal["ALL", "NO_FID", "ONLY_FID"] | None = None,
) -> Result1[str]:
    """RemoveOverlapMultiple_ba(in_features;in_features..., out_feature_class, {method}, {join_attributes})

       Removes overlap between polygons contained in multiple input layers.

    INPUTS:
     in_features (Value Table):
         The input features containing the overlapping polygons.
     method {String}:
         Specifies how the overlap between trade areas will be
         removed.CENTER_LINE-Overlap will be removed by creating a border that
         evenly
         distributes the overlapping area between polygons. This is the
         simplest method. This is the default.THIESSEN-Overlap will be removed
         using straight lines to divide the
         area of intersection. This method uses a series of geometric functions
         to create nonoverlapping trade areas.GRID-Overlap will be removed by
         creating a grid of parallel lines used
         to define a natural division between polygons.
     join_attributes {String}:
         Specifies the attributes of the input layers that will be transferred
         to the output.ALL-All attributes from the input features will be
         transferred to the
         output feature class. This is the default.NO_FID-All attributes from
         the input features, except the FID field,
         will be transferred to the output feature class.ONLY_FID-Only the FID
         field from the input features will be
         transferred to the output feature class.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the new trade area features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RemoveOverlapMultiple_ba(*gp_fixargs((in_features, out_feature_class, method, join_attributes), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("StandardGeographyTA_ba", None)
def StandardGeographyTA(
    geography_level=None,
    out_feature_class=None,
    input_type: Literal["TABLE", "LIST"] | None = None,
    in_ids_table=None,
    geography_key_field=None,
    ids_list=None,
    summarize_duplicates: Literal["SUMMARIZE_DUPLICATES", "USE_FIRST"] | None = None,
    group_field=None,
    dissolve_output: Literal["DISSOLVE", "DONT_DISSOLVE"] | None = None,
) -> Result1[str]:
    """StandardGeographyTA_ba(geography_level, out_feature_class, {input_type}, {in_ids_table}, {geography_key_field}, {ids_list}, {summarize_duplicates}, {group_field}, {dissolve_output})

       Creates trade areas based on predefined named statistical areas. This
       tool does not consume credits.

    INPUTS:
     geography_level (String):
         The geography level that will be used to define the trade area.
     input_type {String}:
         Specifies whether the geography IDs will be from a table or a
         list.TABLE-The input IDs will be from a table.LIST-The input IDs will
         be
         from a list. This is the default.
     in_ids_table {Table View}:
         The input table with IDs that will be used to select geographies that
         will define the trade area.
     geography_key_field {Field}:
         A field in the in_ids_table parameter value that identifies the
         records that will be included in the output.
     ids_list {String}:
         The input list of comma-separated geography IDs.
     summarize_duplicates {Boolean}:
         Specifies whether duplicate fields in the table containing matching
         geography IDs will be summarized.SUMMARIZE_DUPLICATES-The numeric
         fields for all duplicate records will
         be summarized.USE_FIRST-The data of the first record will be appended.
         Other records
         will be ignored. This is the default.
     group_field {Field}:
         The field that will be used to perform a group by operation.
     dissolve_output {Boolean}:
         Specifies whether the output will be dissolved based on the
         group_field parameter value.DISSOLVE-The output will be
         dissolved.DONT_DISSOLVE-The output will
         not be dissolved. This is the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature containing the trade area."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.StandardGeographyTA_ba(
                *gp_fixargs(
                    (
                        geography_level,
                        out_feature_class,
                        input_type,
                        in_ids_table,
                        geography_key_field,
                        ids_list,
                        summarize_duplicates,
                        group_field,
                        dissolve_output,
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
