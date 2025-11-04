"""CreateRouteLayerData core logic executor."""
# pylint: disable=import-error,no-name-in-module
import os
import sys
import zipfile
import json
import traceback
from typing import Dict, Optional

import arcpy
import arcpy.management
from arcpy.da import SearchCursor, ListDomains  # type: ignore

from .routelayerrenderer import RouteLayerRenderer
from common import (PAExecutor, PAOutputFeatureLayer, PAOutputName, PortalUtils,
                    ToolExit, LogUtils, ImmutableDict, CALFIELD_PY_METHOD,
                    AOLUtils)
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class CRLDExecutor(PAExecutor):
    """Core logic of CreateRouteLayerData tool."""

    def __init__(self, route_data_zip_file: str, warn_if_limit_exceeded: bool = True):
        """Initialize the executor."""
        self.route_data_zip_file = route_data_zip_file
        self.warn_if_limit_exceeded = warn_if_limit_exceeded

        # Variables that will be set or updated during processing
        self.output_coordinate_system = arcpy.env.outputCoordinateSystem  # type: ignore
        self.transformation_wgs84 = None
        self.output_workspace = AOLUtils.get_scratch_wkspc(False)
        self.route_id_field = "RouteID"
        self.stops_route_id_field = ""
        self.route_name_field = "RouteName"
        self.route_data_gdb = None
        self.route_data_gdb_domains = {}
        self.route_data_fls = {}
        self.route_data_field_domains = {}
        self.route_names = {}
        self.route_count = 0
        self.output_items = {}

    def execute(self):
        """Extract the route data zip file in preparation for publishing to portal.

        This method just extracts and validates the zip file and does some data prep on the feature classes. To actually
        publish the route data, the calling tool must call the publish_route_layers() method.
        """
        # Unzip the route data zip file and validate that the correct contents are present
        self._unzip_and_validate()

        # Depending on the version of the RouteData, the Stops can have a RouteID or just RouteName
        # field. Determine the correct one to use.
        stop_fields = [f.name for f in self.route_data_fls[NAUtils.RD_FCN_STOPS].fields]
        self.stops_route_id_field = self.route_id_field if self.route_id_field in stop_fields \
            else self.route_name_field

        # Store gdb domains and field domains for each route data feature class
        self._get_domains()

        # Add attribute indices
        self._add_attribute_indices()

        # Configure pop-ups on the output layer
        self._configure_popups()

        # Get a dictionary of {route id: route name} from the route data
        self.route_names = self._get_route_names()
        self.route_count = len(self.route_names)

        # Store a geographic transformation from the output route data feature class coordinate system to WGS84 if
        # a transformation is needed.  This is because we will need to include the WGS84 extent in the output json.
        self.transformation_wgs84 = NAUtils.get_datum_transformation(
            self.route_data_fls[NAUtils.RD_FCN_STOPS].SpatialReference,
            NAUtils.SR_WGS84,
            self.route_data_fls[NAUtils.RD_FCN_STOPS].extent
        )

    def validate_parameters(self) -> bool:
        """Validates the input route data zip file."""
        # Check if the route data zip file is a valid zip file
        if not zipfile.is_zipfile(self.route_data_zip_file):
            LOGGER.error(100212, extra={"message_ID": 100212})
            return False

        return True

    def _unzip_and_validate(self):
        """Unzip the route data zip file and validate the contents."""
        LOGGER.debug("Unzipping and validating route layer zip file...")

        # Unzip the route data zip file. If a ValueError exception is raised, quit.
        try:
            route_data_file_names = []
            with zipfile.ZipFile(self.route_data_zip_file, "r") as zf:
                zf.extractall(self.output_workspace)
                route_data_file_names = zf.namelist()
            route_data_gdb_name = os.path.splitext(os.path.basename(self.route_data_zip_file))[0] + ".gdb"
            self.route_data_gdb = os.path.join(self.output_workspace, route_data_gdb_name)
        except ValueError as ex:
            LOGGER.debug(str(ex))
            LOGGER.error(100226, extra={"message_ID": 100226})
            raise arcpy.ExecuteError

        # Make sure route data gdb exists
        if not os.path.exists(self.route_data_gdb):
            # Determine the route data gdb name from the contents of the zip file
            if route_data_file_names:
                route_data_gdb_name = route_data_file_names[0].split("/")[0]
                self.route_data_gdb = os.path.join(self.output_workspace, route_data_gdb_name)
                if not os.path.exists(self.route_data_gdb):
                    LOGGER.error(100295, extra={"message_ID": 100295, "geodatabase": self.route_data_gdb})
                    raise arcpy.ExecuteError
            else:
                LOGGER.error(100296, extra={"message_ID": 100296, "zipfile": self.route_data_zip_file})
                raise arcpy.ExecuteError
        LOGGER.debug(f"Route data gdb: {self.route_data_gdb}")

        # Make an output feature layer for each output type. Only keep it if the route data feature class exists and
        # has records.
        for fc_name in NAUtils.RD_FC_NAMES:
            fc = os.path.join(self.route_data_gdb, fc_name)
            if arcpy.Exists(fc) and AOLUtils.get_feature_count(fc) > 0:
                LOGGER.debug(f"Route layer data includes {fc_name}")
                self.route_data_fls[fc_name] = PAOutputFeatureLayer(fc)
            else:
                self.route_data_fls[fc_name] = None

        # Check if the route data zip file contains route data. To perform this check make sure the route data gdb
        # has a feature class called stops and it has features
        if not self.route_data_fls[NAUtils.RD_FCN_STOPS]:
            LOGGER.error(100213, extra={"message_ID": 100213})
            raise arcpy.ExecuteError
        if self.route_data_fls[NAUtils.RD_FCN_STOPS].count < 2:
            LOGGER.error(100214, extra={"message_ID": 100214})
            raise arcpy.ExecuteError

        # Check if we need to project the data, and do so if needed using the correct transformation.
        if self.output_coordinate_system and \
                self.route_data_fls[NAUtils.RD_FCN_STOPS].SpatialReference != self.output_coordinate_system:
            LOGGER.debug("Projecting route data...")
            transformation = NAUtils.get_datum_transformation(
                self.route_data_fls[NAUtils.RD_FCN_STOPS].SpatialReference,
                self.output_coordinate_system,
                self.route_data_fls[NAUtils.RD_FCN_STOPS].extent
            )
            for fc_name in self.route_data_fls:
                if self.route_data_fls[fc_name]:
                    projected_fc = arcpy.management.Project(
                        self.route_data_fls[fc_name].layer,
                        self.route_data_fls[fc_name].data + "_prj",
                        self.output_coordinate_system, transformation
                    )
                    self.route_data_fls[fc_name] = PAOutputFeatureLayer(projected_fc)  # type: ignore

    def _get_domains(self):
        """Get and store domains for later use."""
        LOGGER.debug("Getting domains...")

        # Get a list of gdb domains in the route GDB and convert it to json
        for domain in ListDomains(self.route_data_gdb):
            domain_json = {}
            domain_name = domain.name
            domain_type = domain.domainType
            domain_json["name"] = domain_name
            domain_json["type"] = NAUtils.DOMAIN_TYPES.get(domain_type, "codedValue")
            if domain_type.lower() == "codedvalue":
                domain_json["codedValues"] = [dict(code=k, name=v) for k, v in domain.codedValues.items()]
            else:
                domain_json["range"] = list(domain.range)
            self.route_data_gdb_domains[domain_name] = domain_json

        # If the feature class is not empty, get field domains
        for fc_name in NAUtils.RD_FC_NAMES:
            field_domains = {}
            if self.route_data_fls[fc_name] and self.route_data_fls[fc_name].count > 0:
                for fld in self.route_data_fls[fc_name].fields:
                    if fld.domain:
                        field_domains[fld.name] = self.route_data_gdb_domains[fld.domain]
            self.route_data_field_domains[fc_name] = field_domains

    def _add_attribute_indices(self):
        """Add attribute indices for Stops, Direction Events, and Directions."""
        LOGGER.debug("Adding attribute indices...")
        arcpy.management.AddIndex(
            self.route_data_fls[NAUtils.RD_FCN_STOPS].layer,
            [self.stops_route_id_field],
            self.stops_route_id_field,
            "NON_UNIQUE",
            "NON_ASCENDING"
        )
        if self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS_EVENTS]:
            arcpy.management.AddIndex(
                self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS_EVENTS].layer,
                [self.route_id_field],
                self.route_id_field,
                "NON_UNIQUE",
                "NON_ASCENDING"
            )
        if self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS]:
            arcpy.management.AddIndex(
                self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS].layer,
                [self.route_id_field],
                self.route_id_field,
                "NON_UNIQUE",
                "NON_ASCENDING"
            )

    def _get_route_names(self):
        """Returns a dictionary of {route id: route name}."""
        route_names = {}
        # Get a list of route names
        # Derive route names from route info feature class if it is present
        if self.route_data_fls[NAUtils.RD_FCN_ROUTE_INFO]:
            for row in SearchCursor(
                self.route_data_fls[NAUtils.RD_FCN_ROUTE_INFO].layer,
                (self.route_data_fls[NAUtils.RD_FCN_ROUTE_INFO].description.oidFieldName, self.route_name_field)
            ):
                # Assign a default name in case route name is null
                route_name = row[1] if row[1] else "Route {}".format(row[0])
                route_names[row[0]] = route_name
        else:
            # Otherwise, get route names from stops
            for row in SearchCursor(
                self.route_data_fls[NAUtils.RD_FCN_STOPS].layer, (self.route_id_field, self.route_name_field)
            ):
                if row[0] and not row[0] in route_names:
                    route_names[row[0]] = row[1]

        if not route_names:
            # Assume a fixed route name
            route_names[1] = "Route"

        return route_names

    def _features_to_json(self, rd_feature_class_name: str, where_clause: str = "") -> Dict:
        """Return the JSON representation of features from a route data feature class as a python dict.

        Args:
            rd_feature_class_name (str): Route data feature class name used as a dictionary key.
            where_clause (str, optional): Where clause to select certain features from the route data feature class.
                Defaults to "".

        Returns:
            Dict: Python dictionary of JSON representation of the route data feature class's features.
        """
        # Don't use the Features to JSON tool because it has to write output to a json file, and file io can be slow.
        msg = f"Creating JSON from {rd_feature_class_name}"
        if where_clause:
            msg += f" where {where_clause}"
        LOGGER.debug(msg)

        if not self.route_data_fls[rd_feature_class_name]:
            return {}

        # Get extent of the feature class
        # Use the extent of the entire route data feature class. This will be inaccurate when a route data has multiple
        # routes and we are selecting only one of them, but we don't want to spend time calculating the accurate extent.
        extent = self.route_data_fls[rd_feature_class_name].extent
        # Also prepare the WGS84 extent, which apps use to display and select only data within the map extent.
        extent_wgs84 = ""

        # Use a where clause to select only a single route's data.
        if where_clause:
            arcpy.management.SelectLayerByAttribute(
                self.route_data_fls[rd_feature_class_name].layer,
                "NEW_SELECTION", where_clause
            )
            # Convert the extent to WGS84
            if rd_feature_class_name == NAUtils.RD_FCN_STOPS:
                # For stops, project the extent of all selected features
                extent_wgs84 = json.loads(extent.projectAs(NAUtils.SR_WGS84, self.transformation_wgs84).JSON)
            elif rd_feature_class_name == NAUtils.RD_FCN_ROUTE_INFO:
                # For routes, the extent is the extent of the individual route feature. Grab the geometry of the first
                # feature in the selection set (which should be the only one), get its extent, and project it.
                with SearchCursor(  # pylint: disable=no-member
                    self.route_data_fls[rd_feature_class_name].layer, "SHAPE@"
                ) as cursor:
                    route_shape = cursor.next()[0]
                if route_shape:
                    extent_wgs84 = json.loads(
                        route_shape.extent.projectAs(NAUtils.SR_WGS84, self.transformation_wgs84).JSON)

        # Get JSON representation of layer by loading it into a feature set and then getting the JSON property
        feature_set = arcpy.FeatureSet()
        feature_set.load(self.route_data_fls[rd_feature_class_name].layer)
        feature_set_json = json.loads(feature_set.JSON)

        # Load extent data
        feature_set_json["extent"] = json.loads(extent.JSON)
        feature_set_json["extentWGS84"] = extent_wgs84

        # Determine the ObjectID field and populate domains for the fields
        object_id_field = ""
        feature_class_field_domains = self.route_data_field_domains[rd_feature_class_name]
        for fld in feature_set_json["fields"]:
            fld_name = fld["name"]
            if fld["type"].lower() == "esrifieldtypeoid":
                object_id_field = fld["name"]
            if fld_name in feature_class_field_domains:
                fld["domain"] = feature_class_field_domains[fld_name]
        feature_set_json["objectIdField"] = object_id_field

        return feature_set_json

    def _configure_popups(self):
        """Configure pop-ups on the output feature layers."""
        LOGGER.debug("Configuring pop-ups...")
        self.route_data_fls[NAUtils.RD_FCN_STOPS].set_popup(
            None, popup_title="{Name}",
            hide_fields=("RouteID", "StopOID", "IncidentOID", "FacilityOID")
        )
        if self.route_data_fls[NAUtils.RD_FCN_ROUTE_INFO]:
            self.route_data_fls[NAUtils.RD_FCN_ROUTE_INFO].set_popup(None, popup_title="{RouteName}")
        if self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS]:
            self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS].set_popup(
                None, popup_title="{Text}", hide_fields=("RouteID",))
        if self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS_EVENTS]:
            self.route_data_fls[NAUtils.RD_FCN_DIRECTIONS_EVENTS].set_popup(
                None, popup_title="{DisplayText}",
                hide_fields=("RouteID", "StopOID", "IncidentOID", "FacilityOID")
            )
        if self.route_data_fls[NAUtils.RD_FCN_BARRIERS]:
            self.route_data_fls[NAUtils.RD_FCN_BARRIERS].set_popup(None, popup_title="Point Barriers")
        if self.route_data_fls[NAUtils.RD_FCN_POLYLINE_BARRIERS]:
            self.route_data_fls[NAUtils.RD_FCN_POLYLINE_BARRIERS].set_popup(None, popup_title="Polyline Barriers")
        if self.route_data_fls[NAUtils.RD_FCN_POLYGON_BARRIERS]:
            self.route_data_fls[NAUtils.RD_FCN_POLYGON_BARRIERS].set_popup(None, popup_title="Polygon Barriers")

    def _make_feature_collection_layer(self, rd_feature_class_name: str, feature_set_json: Dict, title: str,
                                       drawing_info: Dict) -> Optional[Dict]:
        """Return a feature collection json definition for the given feature set.

        Args:
            rd_feature_class_name (str): Name of the route data feature class.
            feature_set_json (Dict): Feature set with data that will be used to create the feature collection.
            title (str): Title to use for the feature collection layer
            drawing_info (Dict, optional): JSON drawingInfo definition

        Returns:
            Optional[Dict]: Feature collection definition. If the feature set is empty, returns None.
        """
        LOGGER.debug(f"Creating feature collection layer for {rd_feature_class_name}...")
        if not feature_set_json or not self.route_data_fls[rd_feature_class_name]:
            return None

        # Initialize an empty feature collection definition
        feat_coll_layer = {}

        # Configure the layer defintion
        feat_coll_layer_def = {
            "type": "Feature Layer",
            "typeIdField": "",
            "types": [],
            "capabilities": "Query",
        }
        feat_coll_layer_def["name"] = rd_feature_class_name
        feat_coll_layer_def["title"] = title
        feat_coll_layer_def["geometryType"] = feature_set_json["geometryType"]
        feat_coll_layer_def["hasM"] = self.route_data_fls[rd_feature_class_name].description.hasM
        feat_coll_layer_def["hasZ"] = self.route_data_fls[rd_feature_class_name].description.hasZ
        feat_coll_layer_def["fields"] = feature_set_json["fields"]
        feat_coll_layer_def["objectIdField"] = feature_set_json.pop("objectIdField")
        feat_coll_layer_def["extent"] = feature_set_json.pop("extent")
        feat_coll_layer_def["drawingInfo"] = drawing_info

        # Set feature collection data
        feat_coll_layer["layerDefinition"] = feat_coll_layer_def
        feat_coll_layer["featureSet"] = feature_set_json
        feat_coll_layer["popupInfo"] = self.route_data_fls[rd_feature_class_name].popup

        return feat_coll_layer

    def make_feature_collections_for_routes(self):
        '''Return a generator to loop over single routes consisting of a route id and the data which can be used to
        create route layer items.'''
        # If we have only one route, make sure the route name field for all stops has the route name.
        # This is required only for route data from the Route solver, when only one route is solved, and if the route
        # data is from v0 (v1 route data always populates RouteName on stops).
        stop_fields = [f.name for f in self.route_data_fls[NAUtils.RD_FCN_STOPS].fields]
        if self.stops_route_id_field in stop_fields and len(self.route_names) == 1:
            arcpy.management.CalculateField(
                self.route_data_fls[NAUtils.RD_FCN_STOPS].layer,
                self.route_name_field,
                "{}".format(repr(list(self.route_names.values())[0])),
                CALFIELD_PY_METHOD
            )

        # Initialize renderer, which pulls drawing info from json templates
        renderer = RouteLayerRenderer()

        # Get the JSON representation for all rows for all route data feature classes that make up a route
        # Some route data feature classes like barriers are the same for each route
        feature_set_point_barriers = self._features_to_json(NAUtils.RD_FCN_BARRIERS)
        feat_coll_layer_point_barriers = self._make_feature_collection_layer(
            NAUtils.RD_FCN_BARRIERS,
            feature_set_point_barriers,
            "Point Barriers",
            renderer.drawing_json[NAUtils.RD_FCN_BARRIERS]
        )
        feature_set_polyline_barriers = self._features_to_json(NAUtils.RD_FCN_POLYLINE_BARRIERS)
        feat_coll_layer_polyline_barriers = self._make_feature_collection_layer(
            NAUtils.RD_FCN_POLYLINE_BARRIERS,
            feature_set_polyline_barriers,
            "Polyline Barriers",
            renderer.drawing_json[NAUtils.RD_FCN_POLYLINE_BARRIERS]
        )
        feature_set_polygon_barriers = self._features_to_json(NAUtils.RD_FCN_POLYGON_BARRIERS)
        feat_coll_layer_polygon_barriers = self._make_feature_collection_layer(
            NAUtils.RD_FCN_POLYGON_BARRIERS,
            feature_set_polygon_barriers,
            "Polygon Barriers",
            renderer.drawing_json[NAUtils.RD_FCN_POLYGON_BARRIERS]
        )

        # Loop over each individual route and yield a route layer item for it
        for route_id in self.route_names:
            LOGGER.debug(f"Processing Route {route_id}...")
            route_name = self.route_names[route_id]
            layer_index = -1
            route_extent_wgs84 = ""

            # Initialize the route layer item data
            route_layer_item_data = {
                "visibility": True,
                "layers": [],
                "visibleLayers": [],
                "opacity": 1
            }

            # Get the Stops data for this route
            # Stops can have a RouteID and RouteName or Just RouteName field
            if self.stops_route_id_field == self.route_id_field:
                route_where_clause = "{} = {}".format(self.route_id_field, route_id)
            else:
                route_where_clause = "{} = '{}'".format(self.route_name_field, route_name)
            feature_set_stops = self._features_to_json(NAUtils.RD_FCN_STOPS, route_where_clause)

            # Get the RouteInfo data for this route
            # RouteInfo does not have RouteID field but ObjectID on RouteInfo is RouteID
            route_where_clause = "{} = {}".format(
                self.route_data_fls[NAUtils.RD_FCN_ROUTE_INFO].description.oidFieldName, route_id)
            feature_set_route_info = self._features_to_json(NAUtils.RD_FCN_ROUTE_INFO, route_where_clause)

            # Get the DirectionPoints and DirectionLines data for this route
            # DirectionPoints and DirectionLines have a RouteID field
            route_where_clause = "{} = {}".format(self.route_id_field, route_id)
            feature_set_directions_events = self._features_to_json(NAUtils.RD_FCN_DIRECTIONS_EVENTS, route_where_clause)
            feature_set_directions = self._features_to_json(NAUtils.RD_FCN_DIRECTIONS, route_where_clause)

            # Add feature collections to the output route layer item data
            # Add polygon layers followed by line layers and then point layers. Layers in map viewer are drawn in the
            # reverse order from that in which they are added to route_layer_item_data list

            # Polygon Barriers
            if feat_coll_layer_polygon_barriers:
                route_layer_item_data["layers"].append(feat_coll_layer_polygon_barriers)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)

            # Polyline Barriers
            if feat_coll_layer_polyline_barriers:
                route_layer_item_data["layers"].append(feat_coll_layer_polyline_barriers)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)

            # RouteInfo
            if feature_set_route_info:
                # Update WGS84 extent for later use
                route_extent_wgs84 = feature_set_route_info.pop("extentWGS84")
                # Make the feature collection
                feat_coll_layer_route_info = self._make_feature_collection_layer(
                    NAUtils.RD_FCN_ROUTE_INFO, feature_set_route_info, "Route Details",
                    renderer.drawing_json[NAUtils.RD_FCN_ROUTE_INFO])
                # Add feature collection to final output data
                route_layer_item_data["layers"].append(feat_coll_layer_route_info)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)

            # Directions
            if feature_set_directions:
                # Make the feature collection
                feat_coll_layer_directions = self._make_feature_collection_layer(
                    NAUtils.RD_FCN_DIRECTIONS, feature_set_directions, "Direction Lines",
                    renderer.drawing_json[NAUtils.RD_FCN_DIRECTIONS])
                # Add feature collection to final output data
                route_layer_item_data["layers"].append(feat_coll_layer_directions)
                layer_index += 1

            # Point Barriers
            if feat_coll_layer_point_barriers:
                route_layer_item_data["layers"].append(feat_coll_layer_point_barriers)
                layer_index += 1
                route_layer_item_data["visibleLayers"].append(layer_index)

            # Direction Points
            if feature_set_directions_events:
                # Make the feature collection
                feat_coll_layer_directions_events = self._make_feature_collection_layer(
                    NAUtils.RD_FCN_DIRECTIONS_EVENTS, feature_set_directions_events, "Direction Points",
                    renderer.drawing_json[NAUtils.RD_FCN_DIRECTIONS_EVENTS])
                # Add feature collection to final output data
                route_layer_item_data["layers"].append(feat_coll_layer_directions_events)
                layer_index += 1
                # Make direction points visible only if RouteInfo has features
                if route_extent_wgs84:
                    route_layer_item_data["visibleLayers"].append(layer_index)

            # Stops
            # Update the drawing info to account for unique values for this route
            renderer.update_stops_unique_values(feature_set_stops["features"])
            # Make the feature collection
            feat_coll_layer_stops = self._make_feature_collection_layer(
                NAUtils.RD_FCN_STOPS, feature_set_stops, "Stops",
                renderer.drawing_json[NAUtils.RD_FCN_STOPS])
            # Add feature collection to final output data
            route_layer_item_data["layers"].append(feat_coll_layer_stops)
            layer_index += 1
            route_layer_item_data["visibleLayers"].append(layer_index)
            if route_extent_wgs84:
                feature_set_stops.pop("extentWGS84")
            else:
                route_extent_wgs84 = feature_set_stops.pop("extentWGS84")

            #Store item info for a route
            route_snippet = "Route and directions for {}".format(route_name)
            route_license_info = (
                "Directions are provided for planning purposes only and are subject to "
                "<a href='http://www.esri.com/legal/software-license' target='_blank'>Esri's terms of use</a>. "
                "Dynamic road conditions can exist that cause accuracy to differ from your directions and must be taken"
                " into account along with signs and legal restrictions. You assume all risk of use."
            )
            route_layer_item = {
                "text": route_layer_item_data,
                "extent": route_extent_wgs84,
                "title": route_name,
                "type": "Feature Collection",
                "typeKeywords": "Data, Feature Collection, Multilayer, Route Layer",
                "description": route_snippet,
                "tags": "route, route layer, {}".format(route_name),
                "snippet": route_snippet,
                "thumbnailUrl": "",
                "licenseInfo": route_license_info
            }
            yield route_id, route_layer_item

    def publish_route_layers(self, calling_tool_output_name: PAOutputName):
        """Create a route layer item for each individual route in the result and add each item to the portal.

        Also update the self.output_items dictionary with the route data in case the calling tool needs it.
        Note: To call this, you must have already confirmed that the user has privileges to create items in the portal
        using self.check_privileges([PAPrivileges.CREATE_ITEM]) in the calling tool.

        Args:
            calling_tool_output_name (PAOutputName): PAOutputName object from the calling tool's self.output_name.
        """
        # Immediately exit if the total number of routes in the route data is greater than the number allowed
        if self.route_count > NAUtils.MAX_ROUTE_LAYER_COUNT:
            msg_code = 100247
            msg_params = {"message_ID": msg_code, "routeCount": self.route_count, "max": NAUtils.MAX_ROUTE_LAYER_COUNT}
            if self.warn_if_limit_exceeded:
                LOGGER.warning(msg_code, extra=msg_params)
            else:
                LOGGER.error(msg_code, extra=msg_params)
                raise ToolExit
            return

        # Initialize some variables we may fill in later
        routes_without_route_layers = []
        output_item_properties = {}
        folder_id = ""
        title = ""
        output_feature_service_item_id = ""

        portal_url = arcpy.GetActivePortalURL()
        portal_description = ImmutableDict(arcpy.GetPortalDescription(portal_url))

        # Initialize structure for final output
        self.output_items = {
            "portalUrl": portal_url,
            "folderId": "",
            "items": {}
        }

        # Get the org specific URL for the item if the portal is ArcGIS Online
        item_url = "{}/home/item.html?id=".format(portal_url)
        if not portal_description.get("isPortal", False):
            custom_base_url = portal_description.get("customBaseUrl", "")
            url_key = portal_description.get("urlKey", "")
            if custom_base_url and url_key:
                item_url = "https://{}.{}/home/item.html?id=".format(url_key, custom_base_url)

        # Get the output item properties such as folderId, title and tags
        if calling_tool_output_name.json:
            output_item_properties = calling_tool_output_name.json.get("itemProperties", {})

            # Check if title is present within itemProperties of output name json.
            title = output_item_properties.get("title", "")
            if not title:
                # Try using name from serviceProperties of output name json
                service_properties_json = calling_tool_output_name.json.get("serviceProperties", {})
                if "name" in service_properties_json:
                    title = service_properties_json["name"]

            # Check to see if items are to be created in a folder
            folder_id = output_item_properties.get("folderId", "")
            self.output_items["folderId"] = folder_id

            # Check if the route layers items are to be related with a feature service item
            output_feature_service_item_id = output_item_properties.get("itemId", "")

        # Iterate over the available route layer items, update properties, and add them to the final output
        for _, item in self.make_feature_collections_for_routes():
            item_properties = {}
            add_item_properties = {}
            route_name = item["title"]
            LOGGER.debug("Creating route layer for Route: {}".format(route_name))

            # Update tags
            tags = output_item_properties.get("tags", "")
            if tags:
                # Remove any duplicate tags
                default_tags = {default_tag.strip() for default_tag in item["tags"].split(",")}
                # Input tags come in as str. So convert them to unicode
                input_tags = {tag.strip() for tag in tags.split(",")}
                item["tags"] = ", ".join(sorted(default_tags.union(input_tags)))

            # Update snippet
            snippet = output_item_properties.get("snippet", "")
            if snippet:
                item["snippet"] = snippet

            # Update title. Only use the title value as a prefix
            if title:
                # Check for the presence of {} in the title. If found treat {} as a format string replacing it with
                # route name
                start_curly_brace = title.find("{")
                end_curly_brace = title.find("}")
                if start_curly_brace != -1 and end_curly_brace != -1:
                    item["title"] = f"{title[0: start_curly_brace]}{route_name}{title[end_curly_brace + 1:]}"
                else:
                    # Ensure title is unicode since route_name is always unicode.
                    # Converting title to unicode can sometimes fail in the python standard library
                    try:
                        item["title"] = "{} - {}".format(title, route_name)
                    except Exception:
                        LOGGER.debug("Failed to append prefix to route name. Setting title to {}".format(route_name))
                        msgs = traceback.format_exception(*sys.exc_info())[1:]
                        for msg in msgs:
                            LOGGER.debug(msg.strip())
                        item["title"] = route_name

            # Add a Service2Route relationship between output feature service
            if output_feature_service_item_id:
                LOGGER.debug("Adding Service2Route relationship with item {}".format(output_feature_service_item_id))
                item["originItemId"] = output_feature_service_item_id
                item["relationshipType"] = "Service2Route"

            # Add route layer item to portal. Skip adding the item if it fails
            try:
                if folder_id:
                    add_item_properties["folderId"] = folder_id
                output_item_id = PortalUtils.add_portal_item(item, add_item_properties)
            except ToolExit:
                routes_without_route_layers.append(route_name)
                continue

            # Update tags and typeKeywords as for some reason hostedgp.AddItem does not seem to update tags and it will
            # only keep Feature Collection as the type keyword when creating Service2Route relationships.
            # Since moving to Pro Server hostedgp.AddItem also does not apply extent.
            update_item_properties = {
                "tags": item["tags"],
                "typeKeywords": item['typeKeywords'],
                "extent": item["extent"]
            }
            PortalUtils.update_portal_item(output_item_id, update_item_properties)

            # Add item to final output
            item_properties = {
                "url": item_url + output_item_id,
                "title": item["title"],
                "routeName": route_name,
            }
            self.output_items["items"][output_item_id] = item_properties

        # Add a warning message in case some route layers were not created.
        if routes_without_route_layers:
            msg_code = 100246
            msg_params = {"message_ID": msg_code, "routeNames": ", ".join(routes_without_route_layers)}
            LOGGER.warning(msg_code, extra=msg_params)
