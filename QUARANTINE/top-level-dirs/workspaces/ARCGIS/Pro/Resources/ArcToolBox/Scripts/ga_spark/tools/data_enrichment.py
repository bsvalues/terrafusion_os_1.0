from ._base import *


class CalculateMotionStatistics(BaseTool):

    def __init__(self):
        super().__init__('CalculateMotionStatistics')

    def setTrackFields(self, *track_fields):
        """

        :param track_fields
        :type track_fields: List[str]
        """
        super()._set_builder_args('trackFields', [*track_fields])
        return self

    def setTrackHistoryWindow(self, track_history_window):
        """

        :param track_history_window
        :type track_history_window: int
        """
        super()._set_builder_args('trackHistoryWindow', [track_history_window])
        return self

    def setMotionStatistics(self, *motion_statistics):
        """

        :param motion_statistics
        :type motion_statistics: List[str]
        """
        super()._set_builder_args('motionStatistics', [*motion_statistics])
        return self

    def setIdleTolerance(self, distance_tolerance, distance_tolerance_unit, time_tolerance, time_tolerance_unit):
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
        super()._set_builder_args('idleDistanceTolerance', [distance_tolerance, distance_tolerance_unit])
        super()._set_builder_args('idleTimeTolerance', [time_tolerance, time_tolerance_unit])
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

    def setDistanceMethod(self, distance_method):
        """

        :param distance_method
        :type distance_method: str
        """
        super()._set_builder_args('distanceMethod', [distance_method])
        return self

    def setStatisticUnits(self,
                          distance_unit='Meters',
                          duration_unit='Seconds',
                          speed_unit='MetersPerSecond',
                          acceleration_unit='MetersPerSecondSquared',
                          elevation_unit='Meters'):
        """

        :param distance_unit
        :type distance_unit: str
        :param duration_unit
        :type duration_unit: str
        :param speed_unit
        :type speed_unit: str
        :param acceleration_unit
        :type acceleration_unit: str
        :param elevation_unit
        :type elevation_unit: str
        """
        super()._set_builder_args('distanceUnit', [distance_unit])
        super()._set_builder_args('durationUnit', [duration_unit])
        super()._set_builder_args('speedUnit', [speed_unit])
        super()._set_builder_args('accelerationUnit', [acceleration_unit])
        super()._set_builder_args('elevationUnit', [elevation_unit])
        return self

    def run(self, dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        result = super()._exec_tool(['output'])
        return result['output']
