from typing import Dict

from .nautils import NAUtils
from common import Renderer, LogUtils

LOGGER = LogUtils.setup_logger(__name__)


class RouteLayerRenderer(Renderer):
    """Renderer for route layer data."""

    def __init__(self):
        """Initialize the renderers for all layers in the RouteLayer data type.

        Args:
            fc_name: Name of the route data layer feature class. Must be one of the ones defined in NAUtils.
        Returns:
            No return value.
        Raises:
            No exception.
        """
        self.drawing_json = {}
        self.stops_unique_symbols = {}
        self.init_drawing_json()

    def init_drawing_json(self):
        """Get drawing json from template files."""
        # Get basic renderer definitions
        self.drawing_json[NAUtils.RD_FCN_STOPS] = Renderer.get_drawing_from_json("routedata_draw_renderer_stops.json")
        self.drawing_json[NAUtils.RD_FCN_ROUTE_INFO] = Renderer.get_drawing_from_json("routedata_draw_renderer_route_info.json")
        self.drawing_json[NAUtils.RD_FCN_DIRECTIONS] = Renderer.get_drawing_from_json("routedata_draw_renderer_directions.json")
        self.drawing_json[NAUtils.RD_FCN_DIRECTIONS_EVENTS] = Renderer.get_drawing_from_json("routedata_draw_renderer_direction_points.json")
        self.drawing_json[NAUtils.RD_FCN_BARRIERS] = Renderer.get_drawing_from_json("routedata_draw_renderer_point_barriers.json")
        self.drawing_json[NAUtils.RD_FCN_POLYLINE_BARRIERS] = Renderer.get_drawing_from_json("routedata_draw_renderer_polyline_barriers.json")
        self.drawing_json[NAUtils.RD_FCN_POLYGON_BARRIERS] = Renderer.get_drawing_from_json("routedata_draw_renderer_polygon_barriers.json")
        # Get special unique symbols for stops of different types
        self.stops_unique_symbols["first"] = Renderer.get_drawing_from_json("routedata_symbol_stops_first.json")
        self.stops_unique_symbols["last"] = Renderer.get_drawing_from_json("routedata_symbol_stops_last.json")
        self.stops_unique_symbols["waypoint"] = Renderer.get_drawing_from_json("routedata_symbol_stops_waypoint.json")
        self.stops_unique_symbols["unassigned"] = Renderer.get_drawing_from_json("routedata_symbol_stops_unassigned.json")

    def get_drawing_json(self):
        """Return the drawing json."""
        return self.drawing_json

    def update_stops_unique_values(self, stop_features: Dict):
        """Update the drawing json for stops with appropriate unique values for the designated features.

        Args:
            stop_features (Dict): The 'features' portion of the JSON dictionary representation of the Stops.
        """
        # Initialize the unique values list
        stop_unique_value_infos = []

        # Read the input stops and categorize them by type
        waypoints = []
        unassigned_stops = []
        used_stops = []
        for stop in stop_features:
            stop_attributes = stop["attributes"]
            stop_sequence = stop_attributes["Sequence"]
            if stop_attributes["LocationType"] == 1:
                waypoints.append(stop_sequence)
            elif stop_attributes["Status"] not in (0, 6, 7):
                # Status value of 0 is for stops that are successfully located on the network. Value 6 is for stops
                # with time window violation, and value 7 is for stops not located on closest edge. Any other status
                # value, like 1, is for stops that are unassigned for some reason.
                unassigned_stops.append(stop_sequence)
            else:
                used_stops.append(stop_sequence)

        # Determine the first and last stop along the route.  Sort the used stops by sequence rather than relying on the
        # digitized order of the stops because TSP problems may reorder stops.
        # Assign special symbols to first and last stops
        if used_stops:
            used_stops.sort()
            stop_unique_value_infos.append(
                {"value": used_stops[0], "label": "First Stop", "symbol": self.stops_unique_symbols["first"]})
            stop_unique_value_infos.append(
                {"value": used_stops[-1], "label": "Last Stop", "symbol": self.stops_unique_symbols["last"]})

        # Define special symbols waypoints and unassigned stops
        for pt in waypoints:
            stop_unique_value_infos.append(
                {"value": pt, "label": "Waypoint", "symbol": self.stops_unique_symbols["waypoint"]})
        for pt in unassigned_stops:
            stop_unique_value_infos.append(
                {"value": pt, "label": "Unassigned Stop", "symbol": self.stops_unique_symbols["unassigned"]})

        # Note: Ordinary stops use default stop symbols. Only the weird cases are set in this method.

        # Set unique value renderer info to updated definition
        self.drawing_json[NAUtils.RD_FCN_STOPS]["renderer"]["uniqueValueInfos"] = stop_unique_value_infos
