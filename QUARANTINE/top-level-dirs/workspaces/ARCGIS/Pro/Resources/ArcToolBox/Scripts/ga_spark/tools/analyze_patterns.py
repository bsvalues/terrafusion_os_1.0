from ._base import *


class CalculateDensity(BaseTool):

    def __init__(self):
        super().__init__('CalculateDensity')

    def setFields(self, *fields):
        """

        :param fields
        :type fields: List[str]
        """
        super()._set_builder_args('fields', [fields])
        return self

    def setWeightType(self, weight_type):
        """

        :param weight_type
        :type weight_type: str
        """
        super()._set_builder_args('weight', [weight_type])
        return self

    def setBins(self, bin_size, bin_size_unit, bin_type="square"):
        """

        :param bin_size
        :type bin_size: float
        :param bin_size_unit
        :type bin_size_unit: str
        :param bin_type
        :type bin_type: str
        """
        check_distance(bin_size, bin_size_unit, "bin_size")
        super()._set_builder_args('binSize', [bin_size, bin_size_unit])
        super()._set_builder_args('binType', [bin_type])
        return self

    def setTimeStep(self, interval_duration, interval_unit, repeat_duration=None, repeat_unit=None, reference_time=None):
        """

        :param interval_duration
        :type interval_duration: float
        :param interval_unit
        :type interval_unit: str
        :param repeat_duration
        :type repeat_duration: float
        :param repeat_unit
        :type repeat_unit: str
        :param reference_time
        :type reference_time: int/long/datetime.datetime
        """
        check_duration(interval_duration, interval_unit, "interval")
        check_duration(repeat_duration, repeat_unit, "repeat")
        super()._set_builder_args('timeStep', [interval_duration, interval_unit, repeat_duration, repeat_unit,
                                               reference_time])
        return self

    def setNeighborhood(self, distance, distance_unit):
        """

        :param distance
        :type distance: float
        :param distance_unit
        :type distance_unit: str
        """
        check_distance(distance, distance_unit, "distance")
        super()._set_builder_args('radius', [distance, distance_unit])
        return self

    def setAreaUnit(self, area_unit):
        """

        :param area_unit
        :type area_unit: str
        """
        super()._set_builder_args('areaUnits', [area_unit])
        return self

    def run(self, dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        result = super()._exec_tool(['output'])
        return result['output']


class FindPointClusters(BaseTool):

    def __init__(self):
        super().__init__('FindPointClusters')

    def setClusterMethod(self, cluster_method):
        """

        :param cluster_method
        :type cluster_method: str
        """
        super()._set_builder_args('clusterMethod', [cluster_method])
        return self

    def setTimeMethod(self, time_method):
        """

        :param time_method
        :type time_method: str
        """
        super()._set_builder_args('timeMethod', [time_method])
        return self

    def setSearchDuration(self, search_duration, search_duration_unit):
        """

        :param search_duration
        :type search_duration: int
        :param search_duration_unit
        :type search_duration_unit: str
        """
        check_duration(search_duration, search_duration_unit, "search_duration")
        super()._set_builder_args('searchDuration', [search_duration, search_duration_unit])
        return self

    def setMinPointsCluster(self, min_points_cluster):
        """

        :param min_points_cluster
        :type min_points_cluster: int
        """
        super()._set_builder_args('minFeaturesCluster', [min_points_cluster])
        return self

    def setSearchDistance(self, search_distance, search_distance_unit):
        """

        :param search_distance
        :type search_distance: float
        :param search_distance_unit
        :type search_distance_unit: str
        """
        check_distance(search_distance, search_distance_unit, "search_distance")
        super()._set_builder_args('searchDistance', [search_distance, search_distance_unit])
        return self

    def run(self, dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        result = super()._exec_tool(['output'])
        return result['output']


class FindHotSpots(BaseTool):

    def __init__(self):
        super().__init__('FindHotSpots')

    def setBins(self, bin_size, bin_size_unit):
        """

        :param bin_size
        :type bin_size: float
        :param bin_size_unit
        :type bin_size_unit: str
        """
        check_size("bin_size", bin_size, bin_size_unit)
        super()._set_builder_args('binSize', [bin_size, bin_size_unit])
        return self

    def setNeighborhood(self, distance, distance_unit):
        """

        :param distance
        :type distance: float
        :param distance_unit
        :type distance_unit: str
        """
        check_distance(distance, distance_unit, "distance")
        super()._set_builder_args('neighborhoodDistance', [distance, distance_unit])
        return self

    def setTimeStep(self, interval_duration, interval_unit, reference_time=None, alignment=None):
        """

        :param interval_duration
        :type interval_duration: int
        :param interval_unit
        :type interval_unit: str
        :param reference_time
        :type reference_time: int/long/datetime.datetime
        :param alignment
        :type alignment: str
        """
        check_duration(interval_duration, interval_unit, "interval")
        super()._set_builder_args('timeStepInterval', [interval_duration, interval_unit])
        super()._set_builder_args('timeStepReference', [reference_time])
        super()._set_builder_args('timeStepAlignment', [alignment])
        return self

    def run(self, dataframe):
        super()._set_builder_args('pointLayer', [dataframe])
        result = super()._exec_tool(['output'])
        return result['output']


class GWR(BaseTool):

    def __init__(self):
        super().__init__('GeographicallyWeightedRegression')

    def setExplanatoryVariables(self, *explanatory_variables):
        """

        :param explanatory_variables
        :type explanatory_variables: List[str]
        """
        super()._set_builder_args('explanatoryVariables', [*explanatory_variables])
        return self

    def setDependentVariable(self, dependent_variable):
        """

        :param dependent_variable
        :type dependent_variable: str
        """
        super()._set_builder_args('dependentVariable', [dependent_variable])
        return self

    def setModelType(self, model_type):
        """

        :param model_type
        :type model_type: str
        """
        super()._set_builder_args('modelType', [model_type])
        return self

    def setNeighborhood(self,
                        neighborhood_type,
                        number_of_neighbors=None,
                        selection_method="UserDefined",
                        distance_band=None,
                        distance_band_unit=None):
        """

        :param neighborhood_type
        :type neighborhood_type: str
        :param number_of_neighbors
        :type number_of_neighbors: int
        :param selection_method
        :type selection_method: str
        :param distance_band
        :type distance_band: float
        :param distance_band_unit
        :type distance_band_unit: str
        """
        super()._set_builder_args('neighborhoodType', [neighborhood_type])
        super()._set_builder_args('numberOfNeighbors', [number_of_neighbors])
        super()._set_builder_args('neighborhoodSelectionMethod', [selection_method])
        super()._set_builder_args('distanceBand', [distance_band, distance_band_unit])
        return self


    def setLocalWeightingScheme(self, local_weighting_scheme):
        """

        :param local_weighting_scheme
        :type local_weighting_scheme: str
        """
        super()._set_builder_args('localWeightingScheme', [local_weighting_scheme])
        return self

    def run(self, dataframe):
        super()._set_builder_args('inputLayer', [dataframe])
        result = super()._exec_tool(['outputTrained'])
        return result['outputTrained']

