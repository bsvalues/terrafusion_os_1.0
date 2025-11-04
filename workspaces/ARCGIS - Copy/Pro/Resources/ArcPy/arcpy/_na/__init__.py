#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

import json
from arcgisscripting import na as cna
from ._solvers import *
from ._sas import *
from ._rs import *
from ._s import *
from ._odcms import *
from ._vrps import *
from ._cfs import *
from ._las import *
from ._nds import *
from ._ndsc import *
from ._path_costs import *
from ._lmds import *
from ._stor import *
from arcpy import gp

__all__ = ['CheckIntersectingFeatures',
           'ListDirectionsLanguages',
           'ListDirectionsStyleNames',
           'GenerateDirectionsFeatures',
           'GetNAClassNames',
           'GetTravelModes',
           'GetSolverProperties',
           'RouteSolverProperties',
           'ClosestFacilitySolverProperties',
           'ServiceAreaSolverProperties',
           'ODCostMatrixSolverProperties',
           'VehicleRoutingProblemSolverProperties',
           'LocationAllocationSolverProperties',
           'TravelMode',
           'StreetDirectionsProperties',
           'NAClassFieldMap',
           'NAClassFieldMappings',
           'GetWebToolInfo',
           'GetNASublayer',
           '_createTdsFiles',
           '_cleanupTdsFiles',
           '_writeRoadClosuresFeatureClass']

# Uncomment this line to make solver and network dataset APIs public
# __all__ += _solvers.__all__ + _sas.__all__ + _rs.__all__ + _odcms.__all__ + _vrps.__all__ + _cfs.__all__ + _las.__all__ + _nds.__all__


class ClosestFacilitySolverProperties(cna.ClosestFacilitySolverProperties):
    """Provides access to analysis properties from a closest facility network
       analysis layer. The GetSolverProperties function is used to obtain a
       ClosestFacilitySolverProperties object from a closest facility network
       analysis layer."""
    pass


class LocationAllocationSolverProperties(cna.LocationAllocationSolverProperties):
    """Provides access to analysis properties from a location-allocation network
       analysis layer. The GetSolverProperties function is used to obtain a
       LocationAllocationSolverProperties object from a location-allocation
       network analysis layer."""
    pass


class TravelMode(cna.TravelMode):
    """Provides access to travel mode properties for configuring solver with a
     predefined named set of properties representing a mode of travel."""
    pass


class StreetDirectionsProperties(cna.StreetDirectionsProperties):
    """Provides access to direction configuration analysis properties for
       configuring street directions output."""
    pass


class NAClassFieldMappings(cna.NAClassFieldMappings):
    """Provides  a Python dictionary of NAClassFieldMap objects that are used to
       map field names or set default values for the properties of a network
       analysis class within a network analysis layer. The dictionary keys are
       the network analysis class property names, and the values are the
       NAClassFieldMap objects."""
    pass


class NAClassFieldMap(cna.NAClassFieldMap):
    """Provides the ability to map field names or set default values for the
       properties of a network analysis  class within a network analysis layer.
       The properties of the network analysis class  are used  as inputs by the
       solvers while performing  the network analyses."""
    pass


class ODCostMatrixSolverProperties(cna.ODCostMatrixSolverProperties):
    """Provides access to analysis properties from an origin-destination (OD)
       cost matrix network analysis layer. The GetSolverProperties function is
       used to obtain an ODCostMatrixSolverProperties object from an OD cost
       matrix network analysis layer."""
    pass


class RouteSolverProperties(cna.RouteSolverProperties):
    """Provides access to analysis properties from a route network analysis
       layer. The GetSolverProperties function is used to obtain a
       RouteSolverProperties object from a route network analysis layer."""
    pass


class ServiceAreaSolverProperties(cna.ServiceAreaSolverProperties):
    """Provides access to analysis properties from a service area network
       analysis layer. The GetSolverProperties function is used to obtain a
       ServiceAreaSolverProperties object from a service area network analysis
       layer."""
    pass


class VehicleRoutingProblemSolverProperties(cna.VehicleRoutingProblemSolverProperties):
    """Provides access to analysis properties from a vehicle routing problem
       Network Analyst layer. The GetSolverProperties function is used to obtain
       a VehicleRoutingProblemSolverProperties object from a vehicle routing
       problem Network Analyst layer."""
    pass


def CheckIntersectingFeatures(network_dataset_path, feature_layer, cutoff=5000):
    """CheckIntersectingFeatures(network_dataset_path, feature_layer, {cutoff})

       Returns a Boolean indicating whether the number of edge source features
       from the specified network dataset that are intersected by the features
       within the specified feature layer is less than or equal to the specified
       cutoff. The function is useful to restrict the number of features that
       can be loaded as line or polygon barriers into a network analysis layer.

         network_dataset_path(String):
       A variable that references the catalog path of the network dataset. Each
       edge source in this network dataset will be considered while performing
       the check. The catalog path of a  network dataset can be obtained from
       the dataSource property of a network dataset layer or a network analysis
       layer object. It can also be obtained from the catalogPath property of a
       network dataset Describe object.

         feature_layer(Layer):
       A variable that references the Layer object containing the features that
       are intersected with the edge sources. Any selection set or definition
       query present on the Layer object is honored and can be used to specify
       only a subset of features.

         cutoff{Long}:
       An integer value used as a cutoff while performing the check."""
    return cna.CheckIntersectingFeatures(network_dataset_path, feature_layer, cutoff)


def ListDirectionsLanguages(network_dataset_path=None):
    """ListDirectionsLanguages(network_dataset_path)

       Returns a List of supported directions language names.

         network_dataset_path(String):
       This parameter is deprecated and the value is ignored."""
    return cna.ListDirectionsLanguages(network_dataset_path)


def ListDirectionsStyleNames(network_dataset_path=None):
    """ListDirectionsStyleNames(network_dataset_path)

       Returns a List of available directions style names.

         network_dataset_path(String):
       This parameter is deprecated and the value is ignored."""
    return cna.ListDirectionsStyleNames(network_dataset_path)


def GenerateDirectionsFeatures(network_analyst_layer, catalog_path="in_memory\\Directions",
                               schema_only=False, configuration_keyword=None):
    """GenerateDirectionsFeatures(network_analyst_layer, {catalog_path}, {schema_only}, {configuration_keyword})

       Returns a String indicating the full catalog path of the generated directions feature class.

         network_analyst_layer(Layer):
       A variable that references a Layer object obtained from a network
       analysis layer. It can be derived from existing layers in a map document
       or by specifying the catalog path to the network analysis layer file as
       an argument to the Layer class. The isNetworkAnalystLayer property on the
       Layer object can be used to identify whether a given Layer object is a
       network analysis layer. The analysis layer solver type must be 'Route', 'VRP',
       or 'Closest Facility' because directions support is required. Also, the network
       dataset used by the analysis layer must be configured for directions.

        catalog_path{String}:
      The catalog path to the output directions feature class.

        schema_only{bool}:
      Indicates whether to only generate an empty directions feature class or to also populate it with direction
      features.

        configuration_keyword{String}
      The configuration keyword of the output directions feature class."""
    return cna.GenerateDirectionsFeatures(network_analyst_layer, catalog_path, schema_only, configuration_keyword)


def GetNAClassNames(network_analyst_layer, naclass_edit_type='ANY', nalocation_type='ANY', shape_type='ANY'):
    """GetNAClassNames(network_analyst_layer, {naclass_edit_type},
       {nalocation_type}, {shape_type})

       Returns a dictionary of network analysis class names from the network
       analysis layer specified as argument. The dictionary keys are the network
       analysis class names, and the values are the layer names that reference
       the network analysis classes from the network analysis layer.
        The layer names are used as input in some geoprocessing tools such as
        Add Locations and Add Field To Analysis Layer .

         network_analyst_layer(Layer):
       A variable that references a Layer object obtained from a network
       analysis layer. It can be derived from existing layers in a map document
       or by specifying the catalog path to the network analysis layer file as
       an argument to the Layer class. The isNetworkAnalystLayer property on the
       Layer object can be used to identify whether a given Layer object is a
       network analysis layer.

         naclass_edit_type{String}:
       A string that specifies which network analysis classes are included in
       the output dictionary based on their edit mode in the network analysis
       layer. The argument value can be one of the following string keywords:

        * ANY:   Include all the classes from the network analysis layer. This
        is the default value.

        * INPUT:   Include only those classes that support an input mode in the
        network analysis layer. This option will also include classes that
        support both input and output modes.

        * OUTPUT:   Include only those classes that support an output mode in
        the network analysis layer. This option will also include classes that
        support both input and output modes.

         nalocation_type{String}:
       A string that specifies which network analysis classes are included in
       the output dictionary based on their support for location fields. The
       argument value can be one of the following string keywords:

        * ANY:   Include the classes from the network analysis layer
        irrespective of whether they do or do not support location fields. This
        is the default value.

        * LOCATION:   Include only those classes from the network analysis layer
        that support location fields or location ranges.

        * NOT_LOCATION:   Include only those classes from the network analysis
        layer that do not support location fields or location ranges.

         shape_type{String}:
       A string that specifies which network analysis classes are included in
       the output dictionary based on their shape type. The argument value can
       be one of the following string keywords:

        * ANY:   Include all shape type classes from the network analysis layer.
        This is the default value.

        * POINT:   Include only point classes from the network analysis layer.

        * LINE:   Include only line classes from the network analysis layer.

        * POLYGON:   Include only polygon classes from the network analysis
        layer.

        * NULL:   Include only tables from the network analysis layer."""
    return cna.GetNAClassNames(network_analyst_layer, naclass_edit_type, nalocation_type, shape_type)


def GetTravelModes(network_dataset_path):
    """GetTravelModes(network_dataset_path)

       Returns a dictionary of travel modes from the specified network dataset.
       The function is useful to apply override properties from a travel mode to a
       solver settings object. The travel modes predefined in the network dataset
       can be useful for quickly setting a group of related settings (a travel mode).

         network_dataset_path(String):
       A variable that references the catalog path of the network dataset. The
       catalog path of a  network dataset can be obtained from the dataSource
       property of a network dataset layer or a network analysis layer object.
       It can also be obtained from the catalogPath property of a network dataset
       Describe object."""
    return cna.GetTravelModes(network_dataset_path)


def GetSolverProperties(network_analyst_layer):
    """GetSolverProperties(network_analyst_layer)

       Returns a Network Analyst solver properties object based on the type of
       the Network Analyst layer specified as the argument. The solver
       properties object is used to update the analysis properties for the
       layer.

         network_analyst_layer(Layer):
       A variable that references a layer object obtained from a Network Analyst
       layer. It can be derived from existing layers in a map document or by
       specifying the catalog path to the Network Analyst layer file as an
       argument to the Layer class. The isNetworkAnalystLayer property on the
       layer object can be used to identify whether a given layer object is a
       Network Analyst layer."""
    return cna.GetSolverProperties(network_analyst_layer)


def ExportRouteData(network_analyst_layer, route_data_file, travel_mode, include_directions):
    """ExportRouteData(network_analyst_layer, route_data_file, travel_mode, include_directions)

       Returns a String indicating the full catalog path of the exported route data.

         network_analyst_layer(Layer):
       A variable that references a Layer object obtained from a network
       analysis layer. It can be derived from existing layers in a map document
       or by specifying the catalog path to the network analysis layer file as
       an argument to the Layer class. The isNetworkAnalystLayer property on the
       Layer object can be used to identify whether a given Layer object is a
       network analysis layer. The analysis layer solver type must be 'Route', 'VRP',
       or 'Closest Facility' because the layer must produce routes as output The layer
       must be solved before exporting route data.

        route_data_file(String):
      The catalog path including the name and extension to the output route data file.
      The file extension should be .zip as the function exports route data as a compressed
      file in ZIP format. If the target zip file already exists, the function will overwrite
      the existing file or raise an exception based on arcpy.env.overwriteOutput setting.

        travel_mode(String)
      A string representing the travel mode used to perform the analysis. The string
      representation of the travel mode can be obtained by using the str built-in Python
      function with the travel mode object. For example, str(travel_mode_object)

        include_directions(Boolean)
      A boolean that whether or not the output should include the directions feature classes."""
    return cna.ExportRouteData(network_analyst_layer, route_data_file, travel_mode, include_directions)


def IsNetworkDatasetBuilt(network_dataset):
    """IsNetworkDatasetBuilt(network_dataset)

       Returns a Boolean indicating the build status for the network dataset.

         network_dataset(Layer or String):
       A variable that references a network dataset. It can be a network dataset layer object, a  string representing a
       network dataset layer name or a string representing the catalog path for the network dataset.
    """
    return cna.IsNetworkDatasetBuilt(network_dataset)


def GetWebToolInfo(service_name, tool_name, portal_url=None):
    """Get additional information such as the description of the network dataset used for the analysis and the execution
       limits for a tool in the routing utility services registered with your portal.

       Returns a python dictionary with a key called "networkDataset" that provides the information about the network
       dataset used by the web tool and a key called "serviceLimits" that provides the limits for the web tool.

          service_name (String)
       The name of the service containing the web tool. Valid values are [asyncClosestFacility, asyncLocationAllocation,
       asyncODCostMatrix, asyncRoute, asyncServiceArea, asyncVRP, syncVRP] and are case sensitive. A ValueError is
       raised if the service_name is not in the list of supported values.

          tool_name (String)
        The name of the web tool. Valid values are [ EditVehicleRoutingProblem, FindClosestFacilities, FindRoutes,
        GenerateOriginDestinationCostMatrix, GenerateServiceAreas, SolveLocationAllocation, SolveVehicleRoutingProblem]
        and are case sensitive. A ValueError is raised if the tool_name is not in the list of supported values.

          portal_url (String)
        The URL of the portal containing the service or a routing service info dictionary for a standalone server connection.
        If a value is not specified, the active portal url is used.
    """
    service_names = ("asyncClosestFacility", "asyncLocationAllocation", "asyncODCostMatrix", "asyncRoute",
                     "asyncServiceArea", "asyncVRP", "syncVRP", "asyncFleetRouting")
    tool_names = ("EditVehicleRoutingProblem", "FindClosestFacilities", "FindRoutes",
                  "GenerateOriginDestinationCostMatrix", "GenerateServiceAreas", "SolveLocationAllocation",
                  "SolveVehicleRoutingProblem", "SolveLastMileDelivery")
    # Fail if we get invalid values for service_name or tool_name
    if service_name not in service_names:
        msg = "{} {}".format(gp.getIDMessage(88048) % "service_name",
                             " | ".join('"' + name + '"' for name in service_names))
        raise ValueError(msg)
    if tool_name not in tool_names:
        msg = "{} {}".format(gp.getIDMessage(88048) % "tool_name", " | ".join('"' + name + '"' for name in tool_names))
        raise ValueError(msg)

    # Ensure the portal url is a valid url
    if portal_url:
        if type(portal_url) == "str":
            portal_urls = gp.listPortalURLs()
            if portal_urls:
                if portal_url not in portal_urls and portal_url + "/" not in portal_urls:
                    msg = "{} {}".format(gp.getIDMessage(88048) % "portal_url",
                                         " | ".join('"' + url + '"' for url in portal_urls))
                    raise ValueError(msg)
            else:
                raise ValueError(gp.getIDMessage(88051))  # Return 'Not signed into Portal.'
    else:
        # Use the active portal url if portal_url is not specified
        portal_url = gp.getActivePortalURL()

    # Return the web tool info as a dict since the underlying function in arcgisscripting returns a json string.
    tool_info = cna.GetWebToolInfo(service_name, tool_name, portal_url)
    return json.loads(tool_info)


def SelectNetworkDataset(input_datasets, extents_layer, remote_service_field, region_name_field="RegionName", rank_field="Rank", provider_field="Provider"):
    """SelectNetworkDataset(input_datasets, extents_layer, remote_service_field, region_name_field="RegionName", rank_field="Rank", provider_field="Provider")
       Returns a four value tuple containing the region name, provider name, connection file, and service name for the selected
        network dataset. If the inputs are not contained within any region, return an empty string for each of four
        values. For local network datasets, the connection file and service name values are empty strings. For a remote
        region, the connection file is the full catalog path to the ArcGIS Server connection file. The name of the file
        is derived from the remote_service_name field and the file path is assumed to be in the same folder as
        the file geodatabase containing the extents layer. The service_name is also derived from the
        remote_service_field.

         input_datasets (List):
        List of datasets used as inputs for the analysis. For analysis that support multiple inputs, the first element
        in the list should be the input that is used for the determination of the network dataset. For example, for
        closest facility analysis, pass [incidents, facilities] since incidents are used to determine the network
        dataset. Each dataset can be a feature set object, a layer object, a name representing the layer,
        or the full catalog path to the feature class.

         extents_layer (Layer or String):
        Features containing the extent polygons for the network datasets. The value can be a feature set,
        a layer object, a name representing the layer or full catalog path to the feature class.

         remote_service_field (String):
        The name of the field in the extents layer that contains the connection information for the remote service.

         region_name_field (String):
        The name of the field in the extents layer that contain the network dataset layer name.

         rank_field (String):
        The name of the field in the extents layer that contain the rank for a network dataset layer. The rank is used
        to break the tie when the network datasets have overlapping extents.

        provider_field (String):
        The name of the field in the extents layer that contain the provider for a network dataset layer. The provider value is 
         included in the ArcGIS Server log message with code 9999.
    """
    return cna.SelectNetworkDataset(input_datasets, extents_layer, remote_service_field, region_name_field, rank_field, provider_field)


def ConvertStringToFloat(value):
    """ConvertStringToFloat(value)

       Converts a string value to a float based on locale's thousand separator and decimal symbol as much as possible.
        >>> ConvertStringToFloat("1,2.3")
        12.3
        >>> cna.ConvertStringToFloat("1.2,3")
        12.3

        Raise a ValueError if the value cannot be converted to a number.
    """
    return cna.ConvertStringToFloat(value)


def GetNASublayer(network_analyst_layer, naclass_name):
    """GetNASublayer(network_analyst_layer, naclass_name)

       Returns a sublayer or subtable object of network analysis class layer.

         network_analyst_layer(Layer):
       A variable that references a Layer object obtained from a network analysis layer or the string name of a
       network analysis layer.

         naclass_name(String):
       The name of the NAClass for the sublayer or subtable. This is the name of the class, not the name of the layer
       itself, which maybe localized or changed.
       """
    return cna.GetNASublayer(network_analyst_layer, naclass_name)

def CreateTrafficIndex(network_dataset_path, oneway_attribute_name, out_sr_wkid, street_generalization_tolerance, exclude_countries):
    """CreateTrafficIndex(...)

       TODO
    """
    return cna.CreateTrafficIndex(network_dataset_path, oneway_attribute_name, out_sr_wkid, street_generalization_tolerance, exclude_countries)

def UpdateLiveTrafficFeedLocation(network_dataset_path, traffic_feed_type, traffic_feed_location):
    """UpdateLiveTrafficFeedLocation(...)

       TODO
    """
    return cna.UpdateLiveTrafficFeedLocation(network_dataset_path, traffic_feed_type, traffic_feed_location)

def GenerateHierarchy(network_dataset_path):
    """GenerateHierarchy(...)

       TODO
    """
    return cna.GenerateHierarchy(network_dataset_path)

def ApplyLocateSettings(network_analyst_layer, locate_settings):
    """Apply the locate settings to the network analysis layer.
        Args:
              network_analyst_layer: A network analysis layer object
              locate_settings: A string representing the JSON for the locate settings.
    """
    return cna.ApplyLocateSettings(network_analyst_layer, locate_settings)

def _createTdsFiles(configuration_path):
    """_createTdsFiles(configuration_path)

       Creates Traffic Data Stream files according input configuration.
       Args:
             configuration_path: A path to configuration which describes the traffic feeds.
    """
    return cna._createTdsFiles(configuration_path)

def _cleanupTdsFiles(configuration_path, history_depth=1):
    """_cleanupTdsFiles(configuration_path, {history_depth})

       Deletes Traffic Data Stream files in storages according input configuration.
       Args:
             configuration_path: A path to configuration which describes the traffic feeds.

             history_depth: A count of the latest speeds files which should stay on storage. 0 - remove all files (even feed_info.tds).
    """
    return cna._cleanupTdsFiles(configuration_path, history_depth)

def _writeRoadClosuresFeatureClass(network_dataset, traffic_cache, output_workspace, fc_name):
    """_writeRoadClosuresFeatureClass(network_dataset, traffic_cache, output_workspace, fc_name)

       Creates road closures feature class.
       Args:
             network_dataset: A path to network dataset.

             traffic_cache: A path to TrafficCache folder (NOT for a specific network, but at an upper level).
             
             output_workspace: A path to a destination connection file or workspace; the workspace must exist.

             fc_name: A destination feature class name.
    """
    return cna._writeRoadClosuresFeatureClass(network_dataset, traffic_cache, output_workspace, fc_name)
