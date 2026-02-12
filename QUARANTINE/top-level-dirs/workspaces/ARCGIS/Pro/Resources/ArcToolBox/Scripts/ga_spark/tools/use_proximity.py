from ._base import *
import json

class TraceProximityEvents(BaseTool):

    def __init__(self):
        super().__init__('TraceProximityEvents')

    def setEntityIdField(self, entity_id_field):
        """

        :param entity_id_field
        :type entity_id_field: str
        """
        super()._set_builder_args('entityIdField', [entity_id_field])
        return self

    def setEntitiesOfInterestIds(self, entities_of_interest_ids):
        """

        :param entities_of_interest_ids
        :type entities_of_interest_ids: str
        """
        super()._set_builder_args('entitiesOfInterestIds', [entities_of_interest_ids])
        return self

    def setDistanceMethod(self, distance_method):
        """

        :param distance_method
        :type distance_method: str
        """
        super()._set_builder_args('distanceMethod', [distance_method])
        return self

    def setSearchDistance(self, search_distance, search_distance_unit):
        """

        :param search_distance
        :type search_distance: float
        :param search_distance_unit
        :type search_distance_unit: str
        """
        super()._set_builder_args('spatialSearchDistance', [search_distance, search_distance_unit])
        return self

    def setSearchDuration(self, search_duration, search_duration_unit):
        """

        :param search_duration:
        :type search_duration: int
        :param search_duration_unit:
        :type search_duration_unit: str
        """
        super()._set_builder_args('temporalSearchDistance', [search_duration, search_duration_unit])
        return self

    def setMaxTraceDepth(self, max_trace_depth):
        """

        :param max_trace_depth
        :type max_trace_depth: int
        """
        super()._set_builder_args('maxTraceDepth', [max_trace_depth])
        return self

    def setAttributeMatchCriteria(self, attribute_match_criteria):
        """

        :param attribute_match_criteria
        :type attribute_match_criteria: List[str]
        """
        super()._set_builder_args('attributeMatchCriteria', [attribute_match_criteria])
        return self

    def run(self, dataframe, tracks=False):
        super()._set_builder_args('inputPoints', [dataframe])
        if tracks:
            super()._set_builder_args('tracksLayer', [tracks])
        result = super()._exec_tool(['output', 'tracksLayer'])
        return result


class SnapToNetwork(BaseTool):

    def __init__(self):
        super().__init__('SnapToNetwork')
        self._direction = None

    def setTrackFields(self, *track_fields):
        """

        :param track_fields
        :type track_fields: List[str]
        """
        super()._set_builder_args('trackFields', [track_fields])
        return self

    def setConnectivityFields(self, line_id, from_node, to_node):
        """

        :param line_id
        :type line_id: str
        :param from_node
        :type from_node: str
        :param to_node
        :type to_node: str
        """
        self._line_id = line_id
        self._from_node = from_node
        self._to_node = to_node
        return self

    def setDirectionFieldMatching(self, direction_field, forward_value, backward_value, both_value, none_value):
        """

        :param direction_field
        :type direction_field: str
        :param forward_value
        :type forward_value: str
        :param backward_value
        :type backward_value: str
        :param both_value
        :type both_value: str
        :param none_value
        :type none_value: str
        """
        self._direction = direction_field
        
        direction_value_matching = json.dumps([
            {"direction":"Forward", "value":forward_value},
            {"direction":"Backward", "value":backward_value},
            {"direction":"Both", "value":both_value},
            {"direction":"None", "value":none_value}
        ])
        
        super()._set_builder_args('directionValueMatching', [direction_value_matching])
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

    def setDistanceMethod(self, distance_method):
        """

        :param distance_method
        :type distance_method: str
        """
        super()._set_builder_args('distanceMethod', [distance_method])
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

    def setNetworkLayer(self, network_layer):
        super()._set_builder_args('networkPolylineLayer', [network_layer])
        return self

    def run(self, point_layer):
        super()._set_builder_args('pointLayer', [point_layer])

        # TODO this will change when the network attributes are simplified: WebGIS/arcgis-geoanalytics-extension#4045
        network_attribute_matching = json.dumps([
            {"routingAttribute": "FromJunctionId", "fieldName": self._from_node},
            {"routingAttribute": "ToJunctionId", "fieldName": self._to_node},
            {"routingAttribute": "Direction", "fieldName": self._direction},
            {"routingAttribute": "RoadId", "fieldName": self._line_id}
        ])

        super()._set_builder_args('networkAttributeMatching', [network_attribute_matching])
        
        result = super()._exec_tool(['output'])
        return result['output']


