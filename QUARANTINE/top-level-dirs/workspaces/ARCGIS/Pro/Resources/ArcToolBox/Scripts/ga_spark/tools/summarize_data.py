from ._base import *
from collections import namedtuple

class AggregatePoints(BaseTool):

    def __init__(self):
        super().__init__('AggregatePoints')
        self._summary_fields = []

    def setBins(self, bin_size, bin_size_unit, bin_type="square"):
        """

        :param bin_size
        :type bin_size: float
        :param bin_size_unit
        :type bin_size_unit: str
        :param bin_type
        :type bin_type: str
        """
        check_size(bin_size, bin_size_unit, "bin_size")
        super()._set_builder_args('binSize', [bin_size, bin_size_unit])
        super()._set_builder_args('binType', [bin_type])
        return self

    def setPolygons(self, polygons):
        """

        :param polygons
        :type polygons: pyspark.sql.DataFrame
        """
        super()._set_builder_args('polygonLayer', [polygons])
        return self

    def setTimeStep(self, interval_duration, interval_unit, repeat_duration=None, repeat_unit=None, reference_time=None):
        """

        :param interval_duration
        :type interval_duration: Any
        :param interval_unit
        :type interval_unit: Any
        :param repeat_duration
        :type repeat_duration: Any
        :param repeat_unit
        :type repeat_unit: Any
        :param reference_time
        :type reference_time: Any
        """
        check_duration(interval_duration, interval_unit, "interval")
        check_duration(repeat_duration, repeat_unit, "repeat")
        super()._set_builder_args('timeStep', [interval_duration, interval_unit, repeat_duration, repeat_unit, reference_time])
        return self

    def addSummaryField(self, summary_field, statistic, alias=None):
        """

        :param summary_field: 
        :type summary_field: str
        :param statistic: 
        :type statistic: str
        :param alias: 
        :type alias: str
        """
        self._summary_fields.append(mk_stat_dict(summary_field, statistic, alias))
        return self

    def setSummaryFields(self, summary_fields):
        """

        :param summary_fields
        :type summary_fields: List[tuple]
        """
        self._summary_fields = mk_stats_from_list(summary_fields)
        return self

    def run(self, dataframe):
        super()._set_builder_args('pointLayer', [dataframe])
        super()._set_builder_args('summaryFields', [self._summary_fields])
        result = super()._exec_tool(['output'])
        return result['output']


class SpatiotemporalJoin(BaseTool):

    def __init__(self):
        super().__init__('JoinFeatures')
        self._summary_fields = []

    def setJoinOneToOne(self):
        super()._set_builder_args('joinOperation', ["JoinOneToOne"])
        return self

    def setJoinOneToMany(self):
        super()._set_builder_args('joinOperation', ["JoinOneToMany"])
        return self

    def setLeftJoin(self):
        super()._set_builder_args('keepAllTargetFeatures', [True])
        return self

    def setJoinFields(self, *join_fields):
        """

        :param join_fields
        :type join_fields: *str
        """
        super()._set_builder_args('joinFields', [join_fields])
        return self

    def addSummaryField(self, summary_field, statistic, alias=None):
        """

        :param summary_field: 
        :type summary_field: str
        :param statistic: 
        :type statistic: str
        :param alias: 
        :type alias: str
        """
        self._summary_fields.append(mk_stat_dict(summary_field, statistic, alias))
        return self

    def setSummaryFields(self, summary_fields):
        """

        :param summary_fields
        :type summary_fields: List[tuple]
        """
        self._summary_fields = mk_stats_from_list(summary_fields)
        return self

    def setSpatialRelationship(self, spatial_relationship, near_distance=None, near_distance_unit=None):
        """

        :param spatial_relationship
        :type spatial_relationship: str
        :param near_distance
        :type near_distance: float
        :param near_distance_unit
        :type near_distance_unit: str
        """
        super()._set_builder_args('spatialRelationship', [spatial_relationship])
        check_distance(near_distance, near_distance_unit, "near_distance")
        super()._set_builder_args('spatialNearDistance', [near_distance, near_distance_unit])
        return self


    def setTemporalRelationship(self, temporal_relationship, near_duration=None, near_duration_unit=None):
        """

        :param temporal_relationship
        :type temporal_relationship: str
        :param near_duration
        :type near_duration: int
        :param near_duration_unit
        :type near_duration_unit: str
        """
        super()._set_builder_args('temporalRelationship', [temporal_relationship])
        check_duration(near_duration, near_duration_unit, "temporal_near_distance")
        super()._set_builder_args('temporalNearDistance', [near_duration, near_duration_unit])
        return self

    def setAttributeRelationship(self, attribute_relationship):
        """

        :param attribute_relationship
        :type attribute_relationship: str
        """
        super()._set_builder_args('attributeRelationship', [attribute_relationship])
        return self

    def setJoinCondition(self, join_condition):
        """

        :param join_condition
        :type join_condition: str
        """
        super()._set_builder_args('joinCondition', [join_condition])
        return self

    def run(self, dataframe, join_dataframe):
        super()._set_builder_args('targetLayer', [dataframe])
        super()._set_builder_args('joinLayer', [join_dataframe])
        super()._set_builder_args('summaryFields', [self._summary_fields])
        result = super()._exec_tool(['output'])
        return result['output']


class ReconstructTracks(BaseTool):

    def __init__(self):
        super().__init__('ReconstructTracks')
        self._summary_fields = []

    def setTrackFields(self, *track_fields):
        """

        :param track_fields
        :type track_fields: *str
        """
        super()._set_builder_args('trackFields', [*track_fields])
        return self

    def setMethod(self, method):
        """

        :param method
        :type method: str
        """
        super()._set_builder_args('method', [method])
        return self

    def setBufferField(self, buffer_field):
        """

        :param buffer_field
        :type buffer_field: str
        """
        super()._set_builder_args('bufferField', [buffer_field])
        return self

    def addSummaryField(self, summary_field, statistic, alias=None):
        """

        :param summary_field: 
        :type summary_field: str
        :param statistic: 
        :type statistic: str
        :param alias: 
        :type alias: str
        """
        self._summary_fields.append(mk_stat_dict(summary_field, statistic, alias))
        return self

    def setSummaryFields(self, summary_fields):
        """

        :param summary_fields
        :type summary_fields: List[tuple]
        """
        self._summary_fields = mk_stats_from_list(summary_fields)
        return self

    def setTimeSplit(self, time_split, time_split_unit):
        """

        :param time_split
        :type time_split: int
        :param time_split_unit
        :type time_split_unit: str
        """
        check_duration(time_split, time_split_unit, "time_split")
        super()._set_builder_args('timeSplit', [time_split, time_split_unit])
        return self

    def setDistanceSplit(self, distance_split, distance_split_unit):
        """

        :param distance_split
        :type distance_split: float
        :param distance_split_unit
        :type distance_split_unit: str
        """
        check_distance(distance_split, distance_split_unit, "distance_split")
        super()._set_builder_args('distanceSplit', [distance_split, distance_split_unit])
        return self

    def setTimeBoundarySplit(self, time_boundary_split, time_boundary_split_unit, time_boundary_reference=None):
        """

        :param time_boundary_split
        :type time_boundary_split: int
        :param time_boundary_split_unit
        :type time_boundary_split_unit: str
        :param time_boundary_reference
        :type time_boundary_reference: int/long/datetime.datetime
        """
        check_duration(time_boundary_split, time_boundary_split_unit, "time_boundary_split")
        super()._set_builder_args('timeBoundarySplit', [time_boundary_split, time_boundary_split_unit])
        if time_boundary_reference:
            super()._set_builder_args('timeBoundaryReference', [time_boundary_reference])
        return self

    def setArcadeSplit(self, arcade_split):
        """

        :param arcade_split
        :type arcade_split: str
        """
        super()._set_builder_args('arcadeSplit', [arcade_split])
        return self

    def setSplitBoundaryOption(self, split_boundary_option):
        """

        :param split_boundary_option
        :type split_boundary_option: str
        """
        super()._set_builder_args('splitBoundaryOption', [split_boundary_option])
        return self

    def run(self, dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        super()._set_builder_args('summaryFields', [self._summary_fields])
        result = super()._exec_tool(['output'])
        return result['output']


class SummarizeWithin(BaseTool):

    Result = namedtuple('SummarizeWithinResult', ['output', 'groupBySummary'])

    def __init__(self):
        super().__init__('SummarizeWithin')
        self._standard_summary_fields = []
        self._weighted_summary_fields = []

    def setSummaryPolygons(self, summary_polygons):
        """

        :param summary_polygons
        :type summary_polygons: pyspark.sql.DataFrame
        """
        super()._set_builder_args('summaryPolygons', [summary_polygons])
        return self

    def setSummaryBins(self, bin_size, bin_size_unit, bin_type="square"):
        """

        :param bin_size
        :type bin_size: float
        :param bin_size_unit
        :type bin_size_unit: str
        :param bin_type
        :type bin_type: str
        """
        check_size(bin_size, bin_size_unit, "bin_size")
        super()._set_builder_args('binSize', [bin_size, bin_size_unit])
        super()._set_builder_args('binType', [bin_type])
        return self

    def addSummaryField(self, summary_field, statistic, alias=None, weighted=False):
        """
        
        :param summary_field: 
        :type summary_field: str
        :param statistic: 
        :type statistic: str
        :param alias: 
        :type alias: str
        :param weighted:
        :type weighted: bool 
        """
        summary_stat = mk_stat_dict(summary_field, statistic, alias)
        if (weighted):
            self._weighted_summary_fields.append(summary_stat)
        else:
            self._standard_summary_fields.append(summary_stat)
        return self

    def setSummaryFields(self, *summary_fields, weighted=False):
        """

        :param summary_fields
        :type summary_fields: List[tuple]
        :param weighted
        :type weighted: bool
        """
        if weighted:
            self._weighted_summary_fields = mk_stats_from_list(summary_fields)
        else:
            self._standard_summary_fields = mk_stats_from_list(summary_fields)
        return self

    def setGroupBy(self, group_by_field, include_minor_major_fields=True, include_group_percentages=True):
        """

        :param group_by_field
        :type group_by_field: str
        :param include_minor_major_fields
        :type include_minor_major_fields: bool
        :param include_group_percentages
        :type include_group_percentages:bool
        """
        super()._set_builder_args('groupByField', [group_by_field])
        super()._set_builder_args('minorityMajority', [include_minor_major_fields])
        super()._set_builder_args('percentShape', [include_group_percentages])
        return self

    def includeShapeSummary(self, include=True, units=None):
        """

        :param include
        :type include: bool
        :param units
        :type units: str
        """
        super()._set_builder_args('sumShape', [include])
        if units:
            super()._set_builder_args('shapeUnits', [units])
        return self

    def run(self, dataframe):
        super()._set_builder_args('summarizedLayer', [dataframe])

        super()._set_builder_args('standardSummaryFields', [self._standard_summary_fields])
        super()._set_builder_args('weightedSummaryFields', [self._weighted_summary_fields])

        result = super()._exec_tool(['output', 'groupBySummary'])
        return self.Result(result["output"], result.get("groupBySummary"))
