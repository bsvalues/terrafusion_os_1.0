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
r"""The Crime Analysis and Safety toolbox contains tools that support
analytical functions to manage data, select crime incidents, conduct
tactical and strategic analysis, and investigate crime patterns."""
from __future__ import annotations

__all__ = [
    "AddDateAttributes",
    "CellPhoneRecordsToFeatureClass",
    "CellSiteRecordsToFeatureClass",
    "EightyTwentyAnalysis",
    "FeatureTo3DByTime",
    "FindSpaceTimeMatches",
    "GenerateCallLinks",
    "GenerateSectorLines",
    "JoinAttributesFromPolygon",
    "SelectLayerByDateAndTime",
    "SummarizeIncidentCount",
    "SummarizePercentChange",
    "UpdateFeaturesWithIncidentRecords",
]
__alias__ = "ca"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("AddDateAttributes_ca", None)
def AddDateAttributes(
    in_table=None,
    date_field=None,
    date_attributes=None,
) -> Result1[str | Table]:
    """AddDateAttributes_ca(in_table, date_field, {date_attributes;date_attributes...})

       Adds fields containing date or time properties from an input date
       field, for example, day full name, day of the month, month, and year.

    INPUTS:
     in_table (Table View):
         The layer or table that contains the field with the date values that
         will be extracted.
     date_field (Field):
         The date field from which data and time properties will be extracted
         to populate the new field values.
     date_attributes {Value Table}:
         The date and time properties and fields that will be added to the
         input table. Output Time Format-The date or time property that
         will be
         added to. Output Field NameOutput Field Name-The name of the
         field that will be added to the
         input table. Theoptions are as follows:        Output Time
         FormatHour-The hour value between 0 and 23.Day Full Name-The full name
         of
         the day of the week, for example,
         Wednesday.Day Numeric Value-The day of the week value between 1 and
         7.Month-The month value between 1 and 12.Day of the Month-The day of
         the month value between 1 and 31.Year-The year value in yyyy format,
         for example, 1983."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddDateAttributes_ca(*gp_fixargs((in_table, date_field, date_attributes), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("EightyTwentyAnalysis_ca", None)
def EightyTwentyAnalysis(
    in_features=None,
    out_feature_class=None,
    cluster_tolerance=None,
    out_fields=None,
    aggregation_method: Literal["POINT_CLUSTER", "CLOSEST_FEATURE"] | None = None,
    in_comparison_features=None,
) -> Result1[str]:
    """EightyTwentyAnalysis_ca(in_features, out_feature_class, {cluster_tolerance}, {out_fields;out_fields...}, {aggregation_method}, {in_comparison_features})

       Conducts an 80/20 analysis of features and creates point clusters,
       lines, or polygons based on the number of associated incidents. The
       tool calculates a cumulative percentage field to identify the
       locations where incidents are disproportionately occurring.

    INPUTS:
     in_features (Feature Layer):
         The input point features that will be used to create clusters, lines,
         or polygons.
     cluster_tolerance {Linear Unit}:
         The maximum distance separating points at which they will be
         considered part of the same cluster.If no cluster tolerance is
         specified, the tool will create a cluster
         where point features overlap.This parameter is enabled when the
         aggregation_method parameter is set
         to POINT_CLUSTER.
     out_fields {Field}:
         The fields from the input features that will be transferred to the
         output.
     aggregation_method {String}:
         Specifies how the input point features will be
         aggregated.POINT_CLUSTER-The input point features will be clustered.
         This is the
         default.CLOSEST_FEATURE-The input point features will be aggregated to
         the
         closest comparison polygon or line feature.
     in_comparison_features {Feature Layer}:
         The comparison input polygon or line feature class by which the
         in_features parameter value is aggregated.This parameter is enabled
         when the aggregation_method parameter is set
         to CLOSEST_FEATURE.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class.When the aggregation_method parameter is set
         to POINT_CLUSTER, the
         output will be a point feature class.When the aggregation_method
         parameter is set to CLOSEST_FEATURE, the
         geometry type of the output will be the same as the
         in_comparison_features parameter value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.EightyTwentyAnalysis_ca(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        cluster_tolerance,
                        out_fields,
                        aggregation_method,
                        in_comparison_features,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FeatureTo3DByTime_ca", None)
def FeatureTo3DByTime(
    in_features=None,
    out_feature_class=None,
    date_field=None,
    time_z_unit=None,
    base_z=None,
    base_date=None,
) -> Result1[str]:
    """FeatureTo3DByTime_ca(in_features, out_feature_class, date_field, {time_z_unit}, {base_z}, {base_date})

       Creates a 3D feature class using date values from input features.

    INPUTS:
     in_features (Feature Layer):
         The features used to create 3D features.
     date_field (Field):
         A date field from the input that will be used to calculate the
         extrusion of the feature..
     time_z_unit {Time Unit}:
         The time interval and unit that will be represented by one vertical
         linear unit in the output feature class.For example, if the output
         feature class has a vertical coordinate
         system based in meters and this parameter has a value of 1 second, the
         resulting feature class will have features extruded in which 1 meter
         of elevation is equal to 1 second of time.
     base_z {Long}:
         The base z-value from which the output feature will start the
         extrusion.
     base_date {Date}:
         The date and time on which the time extrusion will be based.When no
         value is specified, the minimum date value of the input will
         be used.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output z-enabled feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FeatureTo3DByTime_ca(
                *gp_fixargs((in_features, out_feature_class, date_field, time_z_unit, base_z, base_date), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FindSpaceTimeMatches_ca", None)
def FindSpaceTimeMatches(
    in_primary_features=None,
    in_comparison_features=None,
    out_primary_feature_class=None,
    out_comparison_feature_class=None,
    match_types: list[Literal["SPACE_AND_TIME", "SPACE_ONLY", "TIME_ONLY"]]
    | Literal["SPACE_AND_TIME", "SPACE_ONLY", "TIME_ONLY"]
    | str
    | None = None,
    search_radius=None,
    temporal_search_radius=None,
    primary_start_date_field=None,
    comparison_start_date_field=None,
    primary_end_date_field=None,
    comparison_end_date_field=None,
) -> Result2[str, str]:
    """FindSpaceTimeMatches_ca(in_primary_features, in_comparison_features, out_primary_feature_class, out_comparison_feature_class, match_types;match_types..., {search_radius}, {temporal_search_radius}, {primary_start_date_field}, {comparison_start_date_field}, {primary_end_date_field}, {comparison_end_date_field})

       Identifies matches between two feature classes based on proximity,
       time extent, or both.

    INPUTS:
     in_primary_features (Feature Layer):
         The primary input feature class.
     in_comparison_features (Feature Layer):
         The comparison input feature class.
     match_types (String):
         Specifies the types of matches to compare.SPACE_AND_TIME-Matches based
         on both the time extent and proximity
         defined in the temporal and spatial search radius will be compared,
         for example, 25 meters and 10 minutes.SPACE_ONLY-Matches based only on
         the proximity defined in the spatial
         search radius will be compared, for example, 25
         meters.TIME_ONLY-Matches based only on the time extent defined in the
         temporal search radius will be compared, for example, 10 minutes.
     search_radius {Linear Unit}:
         The radius used to search between input feature classes.
     temporal_search_radius {Time Unit}:
         The time extent used to search between input feature classes.
     primary_start_date_field {Field}:
         The primary start date and time field of the input primary features.
     comparison_start_date_field {Field}:
         The comparison start date and time field of the input comparison
         features.
     primary_end_date_field {Field}:
         The primary end date and time field of the input primary features.
         When specified, the time range defined by the start and end date and
         the temporal search radius will be used to search comparison features.
         The temporal search radius can be set to 0 to compare only the time
         defined by the feature's time range.
     comparison_end_date_field {Field}:
         The comparison end date and time field of the input comparison
         features. When specified, the time range defined by the start and end
         date and the temporal search radius will be used to evaluate
         relationships with primary features. The temporal search radius can be
         set to 0 to compare only the time defined by the feature's time range.

    OUTPUTS:
     out_primary_feature_class (Feature Class):
         The output feature class containing features from the input primary
         features where output match types occurred.
     out_comparison_feature_class (Feature Class):
         The output feature class containing features from input comparison
         features where output match types occurred."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindSpaceTimeMatches_ca(
                *gp_fixargs(
                    (
                        in_primary_features,
                        in_comparison_features,
                        out_primary_feature_class,
                        out_comparison_feature_class,
                        match_types,
                        search_radius,
                        temporal_search_radius,
                        primary_start_date_field,
                        comparison_start_date_field,
                        primary_end_date_field,
                        comparison_end_date_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("JoinAttributesFromPolygon_ca", None)
def JoinAttributesFromPolygon(
    target_features=None,
    in_features=None,
    fields=None,
    overwrite_option: Literal["OVERWRITE", "NO_OVERWRITE"] | None = None,
) -> Result1[str | Layer]:
    """JoinAttributesFromPolygon_ca(target_features, in_features, {fields;fields...}, {overwrite_option})

       Joins attributes from input polygon features to input point features.

    INPUTS:
     target_features (Feature Layer):
         The point features that will be updated with attributes from the
         in_features parameter value.
     in_features (Feature Layer):
         The input polygon features.
     fields {Field}:
         The fields from the input polygon features that will be appended to
         the target point features.
     overwrite_option {Boolean}:
         Specifies whether existing fields in the target_features parameter
         value that have names that match fields in the fields parameter value
         will be overwritten.OVERWRITE-The matching fields will be
         overwritten.NO_OVERWRITE-The
         existing fields will not be overwritten, and new
         fields will be generated. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.JoinAttributesFromPolygon_ca(*gp_fixargs((target_features, in_features, fields, overwrite_option), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SelectLayerByDateAndTime_ca", None)
def SelectLayerByDateAndTime(
    in_layer_or_view=None,
    selection_type: Literal["NEW_SELECTION", "ADD_TO_SELECTION", "REMOVE_FROM_SELECTION", "SUBSET_SELECTION"]
    | None = None,
    time_type: Literal["SINGLE_TIME_FIELD", "TIME_RANGE_FIELDS"] | None = None,
    date_field=None,
    start_date_field=None,
    end_date_field=None,
    selection_options: list[Literal["DATE", "TIME", "DAY_OF_WEEK", "MONTH", "YEAR"]]
    | Literal["DATE", "TIME", "DAY_OF_WEEK", "MONTH", "YEAR"]
    | str
    | None = None,
    date_selection_type: Literal["DATE_RANGE", "SINGLE_DATE", "RECENCY", "COMPARATIVE"] | None = None,
    single_date=None,
    start_date=None,
    end_date=None,
    use_system_time: Literal["SYSTEM_TIME", "NO_SYSTEM_TIME"] | None = None,
    time_slice=None,
    start_time=None,
    end_time=None,
    days_of_week: list[Literal["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]]
    | Literal["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
    | str
    | None = None,
    months: list[
        Literal[
            "JANUARY",
            "FEBRUARY",
            "MARCH",
            "APRIL",
            "MAY",
            "JUNE",
            "JULY",
            "AUGUST",
            "SEPTEMBER",
            "OCTOBER",
            "NOVEMBER",
            "DECEMBER",
        ]
    ]
    | Literal[
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER",
    ]
    | str
    | None = None,
    years=None,
) -> Result2[str | Table | Layer, str]:
    """SelectLayerByDateAndTime_ca(in_layer_or_view, selection_type, time_type, {date_field}, {start_date_field}, {end_date_field}, {selection_options;selection_options...}, {date_selection_type}, {single_date}, {start_date}, {end_date}, {use_system_time}, {time_slice}, {start_time}, {end_time}, {days_of_week;days_of_week...}, {months;months...}, {years;years...})

       Selects records based on date and time ranges or date properties, for
       example, single date, time range, time period, days of the week,
       month, or year.

    INPUTS:
     in_layer_or_view (Table View / Feature Layer):
         The data containing a date field to which the selection will be
         applied.
     selection_type (String):
         Specifies how the selection will be applied and what will occur if a
         selection already exists.NEW_SELECTION-The resulting selection will
         replace the current
         selection. This is the default.ADD_TO_SELECTION-The resulting
         selection will be added to the current
         selection if one exists. If no selection exists, this is the same as
         the new selection option.REMOVE_FROM_SELECTION-The resulting
         selection will be removed from
         the current selection. If no selection exists, this option has no
         effect.SUBSET_SELECTION-The resulting selection will be combined with
         the
         current selection. Only records that are common to both remain
         selected.
     time_type (String):
         Specifies how date and time fields will be used to select
         records.SINGLE_TIME_FIELD-Records will be selected based on a single
         time
         field on the input feature.TIME_RANGE_FIELDS-Records will be selected
         based on start and end time
         fields on the input feature.
     date_field {Field}:
         The date field from the input layer on which the selection will be
         based. This parameter is only active if the time_type parameter is set
         to SINGLE_TIME_FIELD.
     start_date_field {Field}:
         The start date field from the time range on which the selection will
         be based. This parameter is only active if the time_type parameter is
         set to TIME_RANGE_FIELDS.
     end_date_field {Field}:
         The end date field from the time range on which the selection will be
         based. This parameter is only active if the time_type parameter is set
         to TIME_RANGE_FIELDS.
     selection_options {String}:
         Specifies how date and time selections will be made.DATE-The selection
         will be by date.TIME-The selection will be by time
         of day.DAY_OF_WEEK-The selection will be by day of the week.MONTH-The
         selection will be by month.YEAR-The selection will be by year.
     date_selection_type {String}:
         Specifies whether records will be selected based on a date range,
         single date, recency period, or comparative time period.This parameter
         is only active when the selection_options parameter is
         set to DATE.DATE_RANGE-Records will be selected based on a start and
         end date
         range.SINGLE_DATE-Records will be selected based on the a single
         specified
         date.RECENCY-Records will be selected based on a time period in
         relation to
         the current date (system date and time), for example, within the last
         14 days. COMPARATIVE-Records will be selected based on the
         time period
         immediately preceding a recent time period in relation to the current
         date (system date and time). For example, if the current date is
         January 29 and the time slice is 14 days, records occurring between
         January 1 and January 14 will be selected. This option can be used in
         combination with a subsequent(RECENCY in Python) selection to compare
         record counts between two adjacent time periods (for example, the two
         14-day time periods of January 1-14 and January 15-28). By
         Recency
     single_date {Date}:
         The single date and time to be selected.This parameter is only active
         when the date_selection_type parameter
         is set to SINGLE_DATE.
     start_date {Date}:
         The start date of the date range.This parameter is only active when
         the date_selection_type parameter
         is set to DATE_RANGE.
     end_date {Date}:
         The end date of the date range.This parameter is only active when the
         date_selection_type parameter
         is set to DATE_RANGE.
     use_system_time {Boolean}:
         Specifies whether records from the current day (local system time)
         will be included in the selection if they exist in the recent time
         period.SYSTEM_TIME-Records from the current day will be included in
         the
         selection.NO_SYSTEM_TIME-Records from the current day will not be
         included in
         the selection. This is the default.For example, the time slice
         specified is 14 days, the local system
         time is 5:00 p.m. on January 15 when the tool runs, the recency time
         period includes all records between 5:00 p.m. on the date 14 days ago
         and 5:00 p.m. on the day the tool runs, and SYSTEM_TIME is selected.
         In this example, the selection will be January 1, 2017 5:00:00 PM to
         January 15, 2017 5:00:00 PM. Using this same example with
         NO_SYSTEM_TIME selected, the recent period uses the beginning of the
         current day as the end time (based on local system time). In this
         case, the selection will be January 1, 2017 12:00:00 AM to January 15,
         12:00:00 AM for the 14-day time slice.This parameter is only active
         when the date_selection_type parameter
         is set to COMPARATIVE or RECENCY.
     time_slice {Time Unit}:
         The number of time units (minutes, hours, days, weeks, months, or
         years) defining the recent time period on which the selection will be
         based, for example, events within the last 14 days.This parameter is
         only active when the date_selection_type parameter
         is set to COMPARATIVE or RECENCY.
     start_time {Date}:
         The start time of the time range.This parameter is only active when
         the selection_options parameter is
         set to TIME.
     end_time {Date}:
         The end time of the time range.This parameter is only active when the
         selection_options parameter is
         set to TIME.
     days_of_week {String}:
         Specifies the day or days of the week that will be used to select
         records.MONDAY-Records occurring on Monday will be
         selected.TUESDAY-Records
         occurring on Tuesday will be selected.WEDNESDAY-Records occurring on
         Wednesday will be selected.THURSDAY-Records occurring on Thursday will
         be selected.FRIDAY-Records occurring on Friday will be
         selected.SATURDAY-Records occurring on Saturday will be
         selected.SUNDAY-Records occurring on Sunday will be selected.This
         parameter is only active when the selection_options parameter is
         set to DAY_OF_WEEK.
     months {String}:
         Specifies the month or months that will be used to select
         records.JANUARY-Records occurring in January will be
         selected.FEBRUARY-Records
         occurring in February will be selected.MARCH-Records occurring in
         March will be selected.APRIL-Records occurring in April will be
         selected.MAY-Records occurring in May will be selected.JUNE-Records
         occurring in June will be selected.JULY-Records occurring in July will
         be selected.AUGUST-Records occurring in August will be
         selected.SEPTEMBER-Records occurring in September will be
         selected.OCTOBER-Records occurring in October will be
         selected.NOVEMBER-Records occurring in November will be
         selected.DECEMBER-Records occurring in December will be selected.This
         parameter is only active when the selection_options parameter is
         set to MONTH.
     years {Long}:
         The year or years that will be used to select records.This parameter
         is only active when the selection_options parameter is
         set to YEAR."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SelectLayerByDateAndTime_ca(
                *gp_fixargs(
                    (
                        in_layer_or_view,
                        selection_type,
                        time_type,
                        date_field,
                        start_date_field,
                        end_date_field,
                        selection_options,
                        date_selection_type,
                        single_date,
                        start_date,
                        end_date,
                        use_system_time,
                        time_slice,
                        start_time,
                        end_time,
                        days_of_week,
                        months,
                        years,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SummarizeIncidentCount_ca", None)
def SummarizeIncidentCount(
    in_features=None,
    in_sum_features=None,
    out_feature_class=None,
    search_radius=None,
    group_field=None,
) -> Result1[str]:
    """SummarizeIncidentCount_ca(in_features, in_sum_features, out_feature_class, {search_radius}, {group_field})

       Creates a feature class with coincident point counts. Coincident point
       counts for line and point features are determined by a specified
       maximum distance. Point counts for polygon features are determine by
       whether point features or portions of features overlap with the
       polygon feature.

    INPUTS:
     in_features (Feature Layer):
         The input features to which coincident point counts will be
         calculated.
     in_sum_features (Feature Layer):
         The point features coincident with the input features.
     search_radius {Linear Unit}:
         The maximum distance from anpoint or line that a point feature
         will be considered coincident. Input Features        This
         parameter is not active when theis a polygon.
         Input Features
     group_field {Field}:
         A field containing the value used to split point counts. Additional
         fields containing counts for each unique value in the group field will
         be generated.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output choropleth count feature class, symbolized by total count."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SummarizeIncidentCount_ca(
                *gp_fixargs((in_features, in_sum_features, out_feature_class, search_radius, group_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SummarizePercentChange_ca", None)
def SummarizePercentChange(
    in_features=None,
    in_current_features=None,
    in_previous_features=None,
    out_feature_class=None,
    search_radius=None,
) -> Result1[str]:
    """SummarizePercentChange_ca(in_features, in_current_features, in_previous_features, out_feature_class, {search_radius})

       Calculates the percent change for features that correspond with point
       features representing two equal comparison time periods.

    INPUTS:
     in_features (Feature Layer):
         The coincident features from which comparison time periods will be
         counted and compared.
     in_current_features (Feature Layer):
         The point features filtered to the most recent comparison time
         period.For example, you can filter for crimes from the previous 14
         days.
     in_previous_features (Feature Layer):
         The point features filtered to the time period immediately preceding
         the current period. This time period must be of equal length to the
         current period to provide an accurate comparison.For example, if the
         current period contains features from January 15
         to January 28, the previous period contains features from January 1 to
         January 14.
     search_radius {Linear Unit}:
         The maximum distance from the in_features parameter value that a point
         feature will be considered coincident.This parameter is only enabled
         when point or line features are used as
         the input features.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing difference counts and percent
         change calculations for the time period comparison."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SummarizePercentChange_ca(
                *gp_fixargs(
                    (in_features, in_current_features, in_previous_features, out_feature_class, search_radius), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateFeaturesWithIncidentRecords_ca", None)
def UpdateFeaturesWithIncidentRecords(
    in_table=None,
    target_features=None,
    location_type: Literal["COORDINATES", "ADDRESSES"] | None = None,
    x_field=None,
    y_field=None,
    coordinate_system=None,
    address_locator=None,
    address_type: Literal["SINGLE_FIELD_ADDRESS", "MULTI_FIELD_ADDRESS"] | None = None,
    address_fields=None,
    invalid_records_table=None,
    where_clause=None,
    update_target: Literal["UPDATE", "APPEND"] | None = None,
    match_fields=None,
    in_date_field=None,
    target_date_field=None,
    update_matching: Literal["UPDATE_MATCHING_ONLY", "UPSERT"] | None = None,
    update_geometry: Literal["UPDATE_GEOMETRY", "KEEP_GEOMETRY"] | None = None,
    field_matching_type: Literal["AUTOMATIC", "FIELD_MAP"] | None = None,
    field_mapping=None,
    time_format=None,
    convert_local_time: Literal["CONVERT", "NO_CONVERT"] | None = None,
) -> Result2[str, str | Table | Layer]:
    """UpdateFeaturesWithIncidentRecords_ca(in_table, target_features, {location_type}, {x_field}, {y_field}, {coordinate_system}, {address_locator}, {address_type}, {address_fields;address_fields...}, {invalid_records_table}, {where_clause}, {update_target}, {match_fields;match_fields...}, {in_date_field}, {target_date_field}, {update_matching}, {update_geometry}, {field_matching_type}, {field_mapping}, {time_format}, {convert_local_time})

       Updates an existing table or converts a nonspatial table to point
       features based on x,y-coordinates or street addresses and updates an
       existing dataset with the new or updated record information from the
       table.

    INPUTS:
     in_table (Table View):
         The nonspatial table or table containing the x- and y-coordinates or
         addresses that define the locations of the records.
     target_features (Feature Layer / Table View):
         The point feature class, point feature layer, or table that will be
         updated.
     location_type {String}:
         Specifies whether features will be created using x,y-coordinates or
         addresses.COORDINATES-Features will be created using the
         x,y-coordinates of the
         input record.ADDRESSES-Features will be created using the address of
         the input
         record using a locator.This parameter is only enabled when the
         target_features parameter
         value is a feature class or layer.
     x_field {Field}:
         The field in the input table that contains the x-coordinates (or
         longitude).This parameter is only enabled when the location_type
         parameter is set
         to COORDINATES and the target_features parameter value is a feature
         class or layer.
     y_field {Field}:
         The field in the input table that contains the y-coordinates (or
         latitude).This parameter is only enabled when the location_type
         parameter is set
         to COORDINATES and the target_features parameter value is a feature
         class or layer.
     coordinate_system {Coordinate System}:
         The coordinate system of the x- and y-coordinates.This parameter is
         only enabled when the location_type parameter is set
         to COORDINATES and the target_features parameter value is a feature
         class or layer.
     address_locator {Address Locator}:
         The address locator that will be used to geocode the table of
         addresses.When this parameter is set to use ArcGIS World Geocoding
         Service, this
         operation may consume credits.When using a local address locator,
         adding the .loc extension after
         the locator name at the end of the locator path is optional.This
         parameter is only enabled when the location_type parameter is set
         to ADDRESSES and the target_features parameter value is a feature
         class or layer.
     address_type {String}:
         Specifies how address fields used by the address locator will be
         mapped to fields in the input table of
         addresses.MULTI_FIELD_ADDRESS-Addresses will be divided into multiple
         fields.SINGLE_FIELD_ADDRESS-Addresses will be contained in one
         field.Specify SINGLE_FIELD_ADDRESS if the complete address is stored
         in one
         field in the input table, for example, 303 Peachtree St NE, Atlanta,
         GA 30308. Specify MULTI_FIELD_ADDRESS if the input addresses are
         divided into multiple fields such as Address, City, State, and ZIP for
         a general United States address.This parameter is only enabled when
         the location_type parameter is set
         to ADDRESSES and the target_features parameter value is a feature
         class or layer.
     address_fields {Value Table}:
         The input table fields that correspond to the locator address fields
         of the address locator. Some locators support multiple input
         address fields, such as,,
         and. In this case, the address component can be separated into
         multiple fields, and the address fields will be concatenated at the
         time of geocoding. For example, 100, Main st, and Apt 140 across three
         fields or 100 Main st and Apt 140 across two fields, both become 100
         Main st Apt 140 when geocoding. AddressAddress2Address3If you
         do not map an optional input address field used by the address
         locator to a field in the input table of addresses, specify that there
         is no mapping by leaving the field name blank.This parameter is only
         enabled when the location_type parameter is set
         to ADDRESSES.
     where_clause {SQL Expression}:
         The SQL expression that will be used to select a subset of the input
         datasets' records. If multiple input datasets are specified, they will
         all be evaluated using the expression. If no records match the
         expression for an input dataset, no records from that dataset will be
         appended to the target.For more information about SQL syntax, see SQL
         reference for query
         expressions used in ArcGIS.
     update_target {Boolean}:
         Specifies whether existing records will be updated in the
         target_features parameter value.UPDATE-Records from the in_table
         parameter value will be updated in
         the target_features parameter value if they exist there.APPEND-Records
         from the in_table parameter value will be appended to
         the target_features parameter value. This is the default.
     match_fields {Value Table}:
         The ID field or fields that will be used to determine matches between
         the in_table values and the target_features values.This parameter is
         only enabled when the update_target parameter is set
         to UPDATE.
     in_date_field {Field}:
         The field containing the last modified date of the in_table
         records.Date and string field types are supported.This parameter is
         only enabled when the update_target parameter is set
         to UPDATE.
     target_date_field {Field}:
         The field containing the last modified date of the target_features
         records.This field must be a date field type.This parameter is only
         enabled when the update_target parameter is set
         to UPDATE.
     update_matching {Boolean}:
         Specifies whether only existing records will be updated or existing
         records will be updated and new records will be
         added.UPDATE_MATCHING_ONLY-Only existing records will be
         updated.UPSERT-Existing records will be updated and new records will
         be added.
         This is the default.This parameter is only enabled when the
         update_target parameter is set
         to UPDATE.
     update_geometry {Boolean}:
         Specifies whether the geometry of existing features will be
         updated.UPDATE_GEOMETRY-The geometry of existing records will be
         updated when
         the geometry information from the in_table parameter value is
         different than the geometry of the target_features parameter value.
         This is the default.KEEP_GEOMETRY-The geometry of existing records
         will not be updated.This parameter is only enabled when the
         update_target parameter is set
         to UPDATE and the target_features parameter value is a feature class
         or layer.
     field_matching_type {String}:
         Specifies whether the fields of the input table must match the fields
         of the target features for data to be appended.AUTOMATIC-Fields from
         the input dataset match the fields of the target
         dataset. Fields that do not match will be ignored. This is the default
         FIELD_MAP-Fields from the input dataset do not need to match
         the fields of the target dataset. Fields from the input dataset that
         do not match the fields of the target dataset will not be mapped to
         the target dataset unless the mapping is explicitly set in
         theparameter. Field Map
     field_mapping {Field Mappings}:
         Controls how the attribute fields from the input table will be
         transferred or mapped to the target features.This parameter is only
         enabled if the field_matching_type parameter is
         set to FIELD_MAP.Because the input table values are appended to an
         existing target
         feature that has predefined fields, you cannot add, remove, or change
         the type of the fields in the field map. You can, however, set merge
         rules for each output field.The field map can also be used to combine
         values from two or more
         input fields into a single output field.In Python, use the
         FieldMappings class to define this parameter.
     time_format {String}:
         The format of the input field containing the time values. The
         type can be short, long, float, double, text, or date. You can either
         choose a standard time format from the drop-down list or provide a
         custom format. The format strings are case sensitive.If the
         data type of the time field is date, date only, or timestamp
         offset, no time format is required.If the data type of the time field
         is numeric (short, long, float,
         double, or big integer), a list of standard numeric time formats is
         provided in the drop-down list.If the data type of the time field is
         string, a list of standard
         string time formats is provided in the drop-down list. For string
         fields, you can also specify a custom time format. For example, the
         time values may have been stored in a string field in one of the
         standard formats such as yyyy/MM/dd HH:mm:ss or in a custom format
         such as dd/MM/yyyy HH:mm:ss. For the custom format, you can also
         specify the a.m. or p.m. designator.For ISO-8601 compliant strings,
         use yyyy-MM-ddTHH:mm:ss.s as the input
         format. This input selection can handle inputs that use either a UTC
         designator (Z) or UTC offsets (±hh:mm). Commonly used formats
         are listed below:          yyyy-Year
         represented by four digitsMM-Month as digits with leading
         zero for single-digit monthsMMM-Month as a three-letter
         abbreviationdd-Day of month as digits with leading zero for single-
         digit daysddd-Day of week as a three-letter abbreviationhh-Hours with
         leading zero for single-digit hours and a 12-hour clockHH-Hours with
         leading zero for single-digit hours and a 24-hour clockmm-Minutes with
         leading zero for single-digit minutesss-Seconds with leading zero for
         single-digit secondst-One character time marker string, such as A or
         Ptt-Multicharacter time marker string, such as AM or PMunix_us-UNIX
         time in microsecondsunix_ms-UNIX time in millisecondsunix_s-UNIX time
         in secondsunix_hex-UNIX time in hexadecimalThis parameter is only
         enabled when the in_date_field parameter value
         is a text field and the target_date_field parameter value is a date
         field, or the field_mapping parameter input value is a text field and
         the output value is a date fieldThis parameter is only enabled when
         the update_target parameter is set
         to UPDATE.
     convert_local_time {Boolean}:
         Specifies whether the date values of the input records will be
         converted from the time zone of the local system to coordinated
         universal time (UTC).CONVERT-The date values of the input records will
         be converted from
         the time zone of the local system to UTC. This is the
         default.NO_CONVERT-The date values of the input records will remain in
         the
         time zone of the local system.This parameter is only active when the
         target_features parameter value
         is a feature service layer.

    OUTPUTS:
     invalid_records_table {Table}:
         The output table containing a list of invalid records and associated
         invalidation codes."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateFeaturesWithIncidentRecords_ca(
                *gp_fixargs(
                    (
                        in_table,
                        target_features,
                        location_type,
                        x_field,
                        y_field,
                        coordinate_system,
                        address_locator,
                        address_type,
                        address_fields,
                        invalid_records_table,
                        where_clause,
                        update_target,
                        match_fields,
                        in_date_field,
                        target_date_field,
                        update_matching,
                        update_geometry,
                        field_matching_type,
                        field_mapping,
                        time_format,
                        convert_local_time,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Cell Phone Analysis toolset
@gptooldoc("CellPhoneRecordsToFeatureClass_ca", None)
def CellPhoneRecordsToFeatureClass(
    in_table=None,
    in_site_features=None,
    in_sector_features=None,
    out_site_feature_class=None,
    out_sector_feature_class=None,
    id_fields=None,
    subscriber_field=None,
    destination_field=None,
    additional_id_fields=None,
    start_time_field=None,
    duration_field=None,
    end_time_field=None,
    convert_utc: Literal["CONVERT", "NO_CONVERT"] | None = None,
    location_x_field=None,
    location_y_field=None,
    location_coordinate_system=None,
    out_call_points=None,
    start_timing_distance_field=None,
    end_timing_distance_field=None,
    timing_advance_unit: Literal["KILOMETERS", "METERS", "MILESINT", "YARDSINT", "FEETINT", "MILES", "YARDS", "FEET"]
    | None = None,
    timing_band_width=None,
    out_timing_advance_bands=None,
) -> Result:
    """CellPhoneRecordsToFeatureClass_ca(in_table, in_site_features, in_sector_features, out_site_feature_class, out_sector_feature_class, id_fields;id_fields..., subscriber_field, {destination_field}, {additional_id_fields;additional_id_fields...}, {start_time_field}, {duration_field}, {end_time_field}, {convert_utc}, {location_x_field}, {location_y_field}, {location_coordinate_system}, {out_call_points}, {start_timing_distance_field}, {end_timing_distance_field}, {timing_advance_unit}, {timing_band_width}, {out_timing_advance_bands})

       Imports cell phone records from wireless network providers and
       associates those records with a cell site and sector feature classes
       as generated by the Cell Site Records To Feature Class tool based on
       identifier fields.

    INPUTS:
     in_table (Table View):
         The input table containing call records or phone data event records
         provided by the wireless network provider.
     in_site_features (Feature Layer):
         The feature class containing cell site points generated by the Cell
         Site Records to Feature Class tool.
     in_sector_features (Feature Layer):
         The feature class containing cell site sectors generated by the Cell
         Site Records to Feature Class tool.
     id_fields (Value Table):
         Specifies the unique ID field type and the fields that will be added
         to the output feature. Use thetype when theparameter value has
         a unique identifier
         for all cell sector antennas. Use a combination of othervalues when
         theparameter value does not contain a universal unique identifier for
         all cell sector antennas. Unique IDInput Phone Records TableID
         TypeInput Phone Records TableID Type-The field name to be included in
         the output feature
         classes.Field-The name of the fields that uniquely identify the cell
         sector
         antennas. These will be added to the output feature class.
         options are as follows:        ID TypeUnique ID-Uniquely identifies a
         cell sector antennaSite ID-Uniquely
         identifies a cell siteSector ID-Uniquely identifies a cell
         sectorSwitch ID-Uniquely identifies a wireless network switchLAC
         ID-Uniquely identifies the Location Area CodeCascade ID-Uniquely
         identifies the sector in the wireless network
         cascadeCell ID-Identifies the sector within an Location Area Code
     subscriber_field (Field):
         The field in the input table that contains the phone number or
         identifier of the subscriber.
     destination_field {Field}:
         The field in the input table that contains the phone number or
         identifier of the callee.
     additional_id_fields {Value Table}:
         Specifies the additional unique ID field type and the fields that will
         be added to the output feature. Use thetype when theparameter
         value has a unique identifier
         for all cell sector antennas. Use a combination of othervalues when
         theparameter value does not contain a universal unique identifier for
         all cell sector antennas. Unique IDInput Phone Records TableID
         TypeInput Phone Records TableID Type-The field name to be included in
         the output feature
         classes.Field-The name of the fields that uniquely identify the cell
         sector
         antennas. These will be added to the output feature class.
         options are as follows:        ID TypeUnique ID-Uniquely identifies a
         cell sector antennaSite ID-Uniquely
         identifies a cell siteSector ID-Uniquely identifies a cell
         sectorSwitch ID-Uniquely identifies a wireless network switchLAC
         ID-Uniquely identifies the Location Area CodeCascade ID-Uniquely
         identifies the sector in the wireless network
         cascadeCell ID-Identifies the sector within an Location Area Code
     start_time_field {Field}:
         The field in the input table that contains the start date and time
         field of the phone call or data event.
     duration_field {Field}:
         The field in the input table that contains the duration of the phone
         call in seconds.
     end_time_field {Field}:
         The field in the input table that contains the end date and time of
         the phone call or data event.
     convert_utc {Boolean}:
         Specifies whether the start and end date and time of the input records
         will be converted to the time zone of the local system or will remain
         in coordinated universal time (UTC).CONVERT-The start and end date and
         time of the input records will be
         converted from UTC to the time zone of the local system.NO_CONVERT-The
         start and end date and time of the input records will
         not be converted. This is the default.
     location_x_field {Field}:
         The field in the input table that contains the x-coordinate of the
         estimated phone location as provided by the wireless network provider.
     location_y_field {Field}:
         The field in the input table that contains the y-coordinate of the
         estimated phone location as provided by the wireless network provider.
     location_coordinate_system {Coordinate System}:
         The estimated phone location coordinate system of the x,y-coordinates.
         The default coordinate system is WGS84.
     start_timing_distance_field {Field}:
         The field in the input table that contains the timing advance distance
         at the start of the call.
     end_timing_distance_field {Field}:
         The field in the input table that contains the timing advance distance
         at the end of the call.
     timing_advance_unit {String}:
         Specifies the linear unit of measurement that will be used for
         the start_timing_distance_field andparameter values. End Timing
         Advance Distance FieldKILOMETERS-The unit will be
         kilometers.METERS-The unit will be
         meters.MILESINT-The unit will be statute miles.YARDSINT-The unit will
         be international yards.FEETINT-The unit will be international
         feet.MILES-The unit will be US Survey miles. This is the
         default.YARDS-The unit will be US Survey yards.FEET-The unit will be
         US Survey feet.
     timing_band_width {Linear Unit}:
         The full width of the timing advance band.The default is 78.07 meters.

    OUTPUTS:
     out_site_feature_class (Feature Class):
         The point feature class containing phone record site points.One point
         will be generated per phone record linked to cell site
         points.
     out_sector_feature_class (Feature Class):
         The polygon feature class containing phone record sectors.One sector
         polygon will be generated per phone record linked to cell
         site sectors.
     out_call_points {Feature Class}:
         The point feature class containing the estimated call locations as
         provided by the wireless network provider.
     out_timing_advance_bands {Feature Class}:
         The polygon feature class that will contain the timing advance bands
         as provided by the wireless network provider."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CellPhoneRecordsToFeatureClass_ca(
                *gp_fixargs(
                    (
                        in_table,
                        in_site_features,
                        in_sector_features,
                        out_site_feature_class,
                        out_sector_feature_class,
                        id_fields,
                        subscriber_field,
                        destination_field,
                        additional_id_fields,
                        start_time_field,
                        duration_field,
                        end_time_field,
                        convert_utc,
                        location_x_field,
                        location_y_field,
                        location_coordinate_system,
                        out_call_points,
                        start_timing_distance_field,
                        end_timing_distance_field,
                        timing_advance_unit,
                        timing_band_width,
                        out_timing_advance_bands,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CellSiteRecordsToFeatureClass_ca", None)
def CellSiteRecordsToFeatureClass(
    in_table=None,
    out_site_feature_class=None,
    out_sector_feature_class=None,
    id_fields=None,
    x_field=None,
    y_field=None,
    in_coordinate_system=None,
    out_coordinate_system=None,
    azimuth_field=None,
    default_azimuth=None,
    beamwidth_field=None,
    beamwidth_type: Literal["FULL_BEAMWIDTH", "HALF_BEAMWIDTH"] | None = None,
    default_beamwidth=None,
    radius_field=None,
    radius_unit: Literal["KILOMETERS", "METERS", "MILESINT", "YARDSINT", "FEETINT", "MILES", "YARDS", "FEET"]
    | None = None,
    default_radius_length=None,
) -> Result2[str, str]:
    """CellSiteRecordsToFeatureClass_ca(in_table, out_site_feature_class, out_sector_feature_class, id_fields;id_fields..., x_field, y_field, in_coordinate_system, out_coordinate_system, {azimuth_field}, {default_azimuth}, {beamwidth_field}, {beamwidth_type}, {default_beamwidth}, {radius_field}, {radius_unit}, {default_radius_length})

       Creates cell site points and sector polygons based on input latitude,
       longitude, azimuth, beamwidth, and radius information from a cell site
       table.

    INPUTS:
     in_table (Table View):
         The input table containing cell site information provided by the
         wireless network provider.
     id_fields (Value Table):
         Specifies the unique ID field type and the fields that will be added
         to the output feature. Use thevalue when theparameter has a
         unique identifier for all
         cell sector antennas. Use a combination of othervalues when
         theparameter does not contain a universal unique identifier for all
         cell sector antennas. Unique IDInput Cell Site TableID
         TypeInput Cell Site TableID Type-The field name to be included in the
         output feature
         classes.Field-The name of the fields that uniquely identify the cell
         sector
         antennas. These will be added to the output feature class.
         options are as follows:        ID TypeUnique ID-Uniquely identifies a
         cell sector antennaSite ID-Uniquely
         identifies a cell siteSector ID-Uniquely identifies a cell
         sectorSwitch ID-Uniquely identifies a wireless network switchLAC
         ID-Uniquely identifies the Location Area CodeCascade ID-Uniquely
         identifies the sector in the wireless network
         cascadeCell ID-Identifies the sector within an Location Area Code
     x_field (Field):
         The field in the input table that contains the x-coordinate of the
         cell site.
     y_field (Field):
         The field in the input table that contains the y-coordinate of the
         cell site.
     in_coordinate_system (Coordinate System):
         The coordinate system of the coordinates specified in
         theandparameters. X FieldY Field
     out_coordinate_system (Coordinate System):
         The projected coordinate system of the output sites and sectors.
     azimuth_field {Field}:
         The field in the input table that contains the direction of the
         antenna signal (cell sector).The azimuth field values must be
         expressed in positive degrees from 0
         to 360, measured clockwise from north.
     default_azimuth {Double}:
         The starting azimuth value of the antenna signals (cell sectors) that
         will be used when the azimuth field is not specified.For example,
         three cell sectors exist at the same location and this
         parameter is set to 0 degrees. The first sector is generated with an
         azimuth of 0 degrees, the second sector is generated with an azimuth
         of 120 degrees, and the third sector is generated with an azimuth of
         240 degrees.This parameter is used when the azimuth field is not
         specified.The azimuth value must be expressed in positive degrees from
         0 to 360.
         The default is 0.
     beamwidth_field {Field}:
         The field in the input table containing the full or half beamwidth
         value (angle) of the antenna signal (cell sector).The beamwidth must
         be expressed in positive degrees from 0 to 360. Use
         360 for omnidirectional antennas.
     beamwidth_type {String}:
         Specifies the type of beamwidth value represented in the input cell
         type table.FULL_BEAMWIDTH-Full beamwidth is represented in the input.
         This is the
         default.HALF_BEAMWIDTH-Half beamwidth is represented in the input
     default_beamwidth {Double}:
         The beamwidth (in degrees) of the antenna signal (cell sector) that
         will be used when the beamwidth field is not specified.The default is
         90 degrees.
     radius_field {Field}:
         The field in the input table that contains the radial length (signal
         distance) of the antenna signal (cell sector).
     radius_unit {String}:
         Specifies the linear unit that will be used with the radius
         field.KILOMETERS-The unit will be kilometers.METERS-The unit will be
         meters.MILESINT-The unit will be statute miles.YARDSINT-The unit will
         be international yards.FEETINT-The unit will be international
         feet.MILES-The unit will be US Survey miles. This is the
         default.YARDS-The unit will be US Survey yards.FEET-The unit will be
         US Survey feet.
     default_radius_length {Double}:
         The radius length (signal distance) of the antenna signal (cell
         sector) that will be used when the radial field is not specified.The
         default is 2.

    OUTPUTS:
     out_site_feature_class (Feature Class):
         The feature class containing the output cell site points.
     out_sector_feature_class (Feature Class):
         The feature class containing the output cell site sectors."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CellSiteRecordsToFeatureClass_ca(
                *gp_fixargs(
                    (
                        in_table,
                        out_site_feature_class,
                        out_sector_feature_class,
                        id_fields,
                        x_field,
                        y_field,
                        in_coordinate_system,
                        out_coordinate_system,
                        azimuth_field,
                        default_azimuth,
                        beamwidth_field,
                        beamwidth_type,
                        default_beamwidth,
                        radius_field,
                        radius_unit,
                        default_radius_length,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateCallLinks_ca", None)
def GenerateCallLinks(
    in_primary_features=None,
    in_secondary_features=None,
    out_feature_class=None,
    output_type: Literal["SUMMARY", "DETAIL"] | None = None,
    primary_subscriber_field=None,
    primary_destination_field=None,
    primary_start_time_field=None,
    secondary_subscriber_field=None,
    secondary_destination_field=None,
    secondary_start_time_field=None,
) -> Result1[str]:
    """GenerateCallLinks_ca(in_primary_features, in_secondary_features, out_feature_class, {output_type}, {primary_subscriber_field}, {primary_destination_field}, {primary_start_time_field}, {secondary_subscriber_field}, {secondary_destination_field}, {secondary_start_time_field})

       Creates line features that represent the call links between phones,
       using cell site points or cell site antenna sectors, based on the
       start date and time of the call.

    INPUTS:
     in_primary_features (Feature Layer):
         The point feature class for the primary phone or sector derived from
         the Cell Phone Records To Feature Class tool.
     in_secondary_features (Feature Layer):
         The point feature class for the secondary phone or sector derived from
         the Cell Phone Records To Feature Class tool.
     output_type {String}:
         Specifies how the relationship of calls between two phones will be
         analyzed and symbolized.SUMMARY-A summary record of the total number
         of calls between two
         phones at various locations will be created. This is the
         default.DETAIL-An individual record of each call between two phones at
         various
         locations will be created.
     primary_subscriber_field {Field}:
         The unique ID field for the primary phone subscriber, usually a phone
         number.
     primary_destination_field {Field}:
         The field containing the phone number of the secondary phone.
     primary_start_time_field {Field}:
         The start date and time field of the primary phone records.
     secondary_subscriber_field {Field}:
         The unique ID field for the secondary phone subscriber, usually a
         phone number.
     secondary_destination_field {Field}:
         The field containing the phone number of the primary phone.
     secondary_start_time_field {Field}:
         The start date and time field of the secondary phone records.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output line features representing the call links between two
         phones at various locations."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateCallLinks_ca(
                *gp_fixargs(
                    (
                        in_primary_features,
                        in_secondary_features,
                        out_feature_class,
                        output_type,
                        primary_subscriber_field,
                        primary_destination_field,
                        primary_start_time_field,
                        secondary_subscriber_field,
                        secondary_destination_field,
                        secondary_start_time_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateSectorLines_ca", None)
def GenerateSectorLines(
    in_site_features=None,
    out_feature_class=None,
) -> Result1[str]:
    """GenerateSectorLines_ca(in_site_features, out_feature_class)

       Creates line features that represent the extent of cell site antenna
       sectors.

    INPUTS:
     in_site_features (Feature Layer):
         The point feature class derived from the Cell Site Records to Feature
         Class or Cell Phone Records to Feature Class tool.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class containing the sector lines."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateSectorLines_ca(*gp_fixargs((in_site_features, out_feature_class), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
