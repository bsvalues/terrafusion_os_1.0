from ._base import *


class DetectIncidents(BaseTool):

    def __init__(self):
        super().__init__('DetectIncidents')

    def setTrackFields(self, *track_fields):
        """

        :param track_fields
        :type track_fields: List[str]
        """
        super()._set_builder_args('trackFields', [*track_fields])
        return self

    def setStartConditionExpression(self, start_condition_expression):
        """

        :param start_condition_expression
        :type start_condition_expression: str
        """
        super()._set_builder_args('startConditionExpression', [start_condition_expression])
        return self

    def setEndConditionExpression(self, end_condition_expression):
        """

        :param end_condition_expression
        :type end_condition_expression: str
        """
        super()._set_builder_args('endConditionExpression', [end_condition_expression])
        return self

    def setOutputMode(self, output_mode):
        """

        :param output_mode
        :type output_mode: str
        """
        super()._set_builder_args('outputMode', [output_mode])
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

    def run(self, dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        result = super()._exec_tool(['output'])
        return result['output']


class FindDwellLocations(BaseTool):

    def __init__(self):
        super().__init__('FindDwellLocations')

    def setTrackFields(self, *track_fields):
        """

        :param track_fields
        :type track_fields: List[str]
        """
        super()._set_builder_args('trackFields', [*track_fields])
        return self

    def setDistanceMethod(self, distance_method):
        """

        :param distance_method
        :type distance_method: str
        """
        super()._set_builder_args('distanceMethod', [distance_method])
        return self

    def setTolerance(self, distance_tolerance, distance_tolerance_unit, time_tolerance, time_tolerance_unit):
        """

        :param distance_tolerance
        :type distance_tolerance: float
        :param distance_tolerance_unit
        :type distance_tolerance_unit: str
        :param time_tolerance
        :type time_tolerance: int
        :param time_tolerance_unit
        :type time_tolerance_unit: str
        """
        super()._set_builder_args('distanceTolerance', [distance_tolerance, distance_tolerance_unit])
        super()._set_builder_args('timeTolerance', [time_tolerance, time_tolerance_unit])
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

    def setSummaryFields(self, *summary_fields):
        """

        :param summary_fields
        :type summary_fields: List[tuple]
        """
        super()._set_builder_args('summaryFields', [*summary_fields])
        return self

    def run(self, dataframe, output_type):
        super()._set_builder_args('inputLayer', [dataframe])
        super()._set_builder_args('outputType', [output_type])
        result = super()._exec_tool(['output'])
        return result['output']


class FindSimilarLocations(BaseTool):

    def __init__(self):
        super().__init__('FindSimilarLocations')

    def setAnalysisFields(self, *analysis_fields):
        """

        :param analysis_fields
        :type analysis_fields: List[str]
        """
        super()._set_builder_args('analysisFields', [*analysis_fields])
        return self

    def setMostOrLeastSimilar(self, most_or_least_similar):
        """

        :param most_or_least_similar
        :type most_or_least_similar: str
        """
        super()._set_builder_args('mostOrLeastSimilar', [most_or_least_similar])
        return self

    def setMatchMethod(self, match_method):
        """

        :param match_method
        :type match_method: str
        """
        super()._set_builder_args('matchMethod', [match_method])
        return self

    def setNumberOfResults(self, number_of_results):
        """

        :param number_of_results
        :type number_of_results: int
        """
        super()._set_builder_args('numberOfResults', [number_of_results])
        return self

    def setAppendFields(self, *append_fields):
        """

        :param append_fields
        :type append_fields: List[str]
        """
        super()._set_builder_args('appendFields', [*append_fields])
        return self

    def run(self, dataframe, search_dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        super()._set_builder_args('searchLayer', [search_dataframe])
        result = super()._exec_tool(['output'])
        return result
