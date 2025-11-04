"""---------------------------------------------------------------------------
Name:              CostReport.py
Purpose:           To estimate and report the credits taken for a certain
                   online analysis tool.
Author:            Esri Inc.
Created:           2/12/2018
Copyright:   (c)   Esri, Inc. 2012
ArcGIS Version:    10.6.1
---------------------------------------------------------------------------"""
import os
import requests
import json
import math
from urllib.parse import quote
import arcpy  # pylint: disable=E0401
import hostedgp as agolgp  # pylint: disable=E0401
from abc import ABC, abstractmethod
from convert_spatial_units import convert_areal_units, convert_linear_units, dd_to_km_ratio
from tessellate.tessellations import (TessellationFactory, SquareTessellation, TriangleTessellation,
                                      HexagonTessellation, TransverseHexagonTessellation, DiamondTessellation)
# from tessellate.GenerateTessellation import predict_tile_count

# Default timeout of sync service is 60 secs.
TIMEOUT_CRITERIA = 60
LAYER_KEYWORD = 'url'
FEATURECOLLECTION_KEYWORD = 'featureSet'


class FeatureCountUtils:
    """Class module with utility functions used to get feature count."""

    @staticmethod
    def create_extent_from_json(extent_json):
        """Create extent from extent json.

        Args:
            extent_json: a json represents extent.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            No exception.

        """
        if "extent" in extent_json:
            extent_json = extent_json["extent"]

        xmin = extent_json['xmin']
        ymin = extent_json['ymin']
        xmax = extent_json['xmax']
        ymax = extent_json['ymax']

        extent = arcpy.Extent(xmin, ymin, xmax, ymax)
        spa_ref = FeatureCountUtils.get_sr(extent_json)
        extent.spatialReference = spa_ref
        return extent

    @staticmethod
    def get_sr(extent_dict):
        """To create an instance of arcpy.SpatialReference.

        Args:
            extent_dict: a dictionary represents the extent.
        Returns:
            An instance of spatial reference (None if able to create an spatial reference).
        Raises:
            No exception.

        """
        if "spatialReference" in extent_dict:
            latestwkid = None
            wkid = None
            wkt = None
            extentsr = extent_dict["spatialReference"]
            if isinstance(extentsr, dict):
                latestwkid = extentsr.get('latestWkid')
                wkid = extentsr.get('wkid')
                wkt = extentsr.get('wkt')

                if wkt:
                    new_sr = arcpy.SpatialReference()
                    new_sr.loadFromString(wkt)
                    return new_sr
                elif latestwkid:
                    return arcpy.SpatialReference(latestwkid)
                elif wkid:
                    return arcpy.SpatialReference(wkid)
                else:
                    return None
            else:
                return None
        else:
            return None

    @staticmethod
    def create_recordset_from_json(featureset_json):
        """Create an instance of arcpy.Recordset from json.

        Args:
            featureset_json: a json with the featureset content.
        Returns:
            An instance of arcpy.RecordSet.
        Raises:
            No exceptions.

        """
        if "featureSet" not in featureset_json:
            return None
        else:
            try:
                poly_str = json.dumps(featureset_json.get("featureSet"), ensure_ascii=False)
                return arcpy.gp.fromEsriJson(poly_str)
            except:
                return None

    @staticmethod
    def get_featureset_extent(featureset):
        """Get the extent of a featureset.

        Args:
            featureset: a json with the featureset.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            No exceptions.

        """
        feature_set = FeatureCountUtils.create_recordset_from_json(featureset)

        if feature_set:
            tmp_lyr = arcpy.MakeFeatureLayer_management(feature_set).getOutput(0)
            return arcpy.Describe(tmp_lyr.name).extent
        else:
            return None

    @staticmethod
    def get_query_response(url, headers={}):
        """To get the response from feature count query."""
        try:
            response = requests.get(url, params=None, headers=headers,
                                    verify=False, stream=True,
                                    timeout=TIMEOUT_CRITERIA)
            if response.status_code == 200:
                return response
            else:
                response.raise_for_status()
        except requests.exceptions.Timeout:
            arcpy.AddError('Timeout in accessing {}'.format(url))
            raise Exception
        except requests.exceptions.HTTPError:
            arcpy.AddError('HttpError in accessing {}'.format(url))
            raise Exception
        except Exception:
            arcpy.AddError('Unable to query {}'.format(url))
            raise Exception

    @staticmethod
    def post_query_response(url: str, params=None,
                            headers=None) -> requests.Response:
        """To get the response from feature count query."""
        if headers is None:
            headers = {}

        try:
            response = requests.post(url, data=params, headers=headers,
                                     verify=False, stream=True,
                                     timeout=60)
            if response.status_code == 200:
                return response
            else:
                response.raise_for_status()
        except requests.exceptions.Timeout:
            arcpy.AddMessage('Timeout in accessing {}'.format(url))
            raise Exception
        except requests.exceptions.HTTPError:
            arcpy.AddMessage('HttpError in accessing {}'.format(url))
            raise Exception
        except Exception:
            arcpy.AddMessage('Unable to query {}'.format(url))
            raise Exception

    @staticmethod
    def get_featureservice_extent(featureservice_url):
        """Get the extent of a feature service layer.

        Args:
            featureservice_url: a json with the url, token information.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            No exceptions.

        """
        if "url" not in featureservice_url:
            arcpy.AddMessage("Invalid feature_url of: {}".format(featureservice_url))
            return None

        try:
            extent_query_url = FeatureCountUtils.construct_featureservice_extent_query(featureservice_url)
            fs_response = FeatureCountUtils.get_query_response(extent_query_url).json()
            arcpy.AddMessage("fs_response extent: {}".format(fs_response.get("extent")))
            return FeatureCountUtils.create_extent_from_json(fs_response.get("extent"))
        except:
            arcpy.AddMessage("Unable to get the extent from {}".format(featureservice_url))
            return None

    @staticmethod
    def construct_featureservice_extent_query(featureservice):
        """Create a URL to query the extent of the featureservice.

        Args:
            featureservice: a dictionary with the URL and possibly containing token and filter information.
        Returns:
            A string with the URL to perform extent query.

        """
        fs_url = featureservice.get("url")
        service_token = featureservice.get("serviceToken")
        where_clause = featureservice.get("filter", "1=1")
        time_query = featureservice.get("time")
        query_variables = ["returnExtentOnly=true"]
        query_variables.append("where={}".format(quote(where_clause)))
        if time_query:
            query_variables.append("time={}".format(quote(time_query)))
        if service_token:
            query_variables.append("token={}".format(service_token))
        query_variables.append("f=json")
        query_str = '&'.join(query_variables)
        query_url = fs_url + '/query?' + query_str
        arcpy.AddMessage("query_url: {}".format(query_url))
        return query_url


class TessellationFeatureCountUtils:
    """Class module with utility functions used to get Tessellation feature count."""

    SUPPORTED_AREAL_UNITS = ["squarekilometers", "hectares", "squaremeters", "squaremiles",
                             "acres", "squareyards", "squarefeet", "squareinches"]
    SUPPORTED_DISTANCE_UNITS = ["nauticalmiles", "miles", "yards", "feet", "kilometers", "meters"]

    @staticmethod
    def calculate_area_from_distance(distance, shape_type, length_unit):
        """Calculate the area of a certain shape from the length of edge.

        Args:
            distance: numeric number represents the height of a certain geometry.
            shape_type: a string indicates the type of shape. Currently only supports "Triangle", "Square", "Hexagon",
            "TraverseHexagon", and "Diamond".
            length_unit: unit of length.
        Returns:
            A string in the format of areal unit (i.e., 100 SquareMiles).
        Raises:
            Exception if the shape_type is invalid.

        """
        if length_unit.lower() == "nauticalmiles":
            length_unit = "Miles"
            distance = distance * 1.15

        if shape_type.lower() == "square":
            return "{} Square{}".format((distance * distance), length_unit)
        elif shape_type.lower() == "diamond":
            # diamond generated is actually a rotated square. Distance specified represents the diagonal length
            return "{} Square{}".format((distance * distance) / 2, length_unit)
        elif shape_type.lower() in ["hexagon", "transversehexagon", "transverse_hexagon"]:
            # distance for Hexagon is actually the distance between the parallel edges
            return "{} Square{}".format((distance * distance * (math.sqrt(3) / 2)), length_unit)
        elif shape_type.lower() == "triangle":
            # distance represents the height of the equal lateral triangle
            return "{} Square{}".format((distance * distance / math.sqrt(3)), length_unit)
        else:
            arcpy.AddMessage("Error: invalid shape_type of {}.".format(shape_type))
            raise Exception

    @staticmethod
    def get_areal_size(size_value, shape_type, size_unit):
        """Get the size in the areal format."""
        if size_unit == "#" or size_value == "#":
            return "#"
        # AggregatePoints/SummarizeWithin only accepts distance units. This only applies to GenerateTessellations
        elif size_unit.lower() in TessellationFeatureCountUtils.SUPPORTED_AREAL_UNITS:
            return "{0} {1}".format(size_value, size_unit)
        elif size_unit.lower() in TessellationFeatureCountUtils.SUPPORTED_DISTANCE_UNITS:
            return TessellationFeatureCountUtils.calculate_area_from_distance(size_value, shape_type, size_unit)
        else:
            arcpy.AddMessage("Error: invalid unit of {}.".format(size_unit))
            raise Exception

    @staticmethod
    def create_proj_extent(extent_input):
        """Create the extent in GCS.

        Args:
            input_extent: can be either an instance of arcpy.Extent or a feature layer.
        Returns:
            A two items tuple with the first item as the projected extent and the second item as the original spatial
            reference of the input_extent.
        Raises:
            No exceptions.

        """
        if isinstance(extent_input, arcpy.Extent):
            templatePolySR = extent_input.spatialReference
            gcsSR = templatePolySR.GCS.exportToString()
            templatePolyExtent = extent_input.projectAs(gcsSR)
        else:
            desc = arcpy.Describe(extent_input)
            projectedPolyExtent = ""

            templatePolySR = desc.spatialReference
            gcsSR = templatePolySR.GCS.exportToString()
            # If extent_layer is in PCS, project it to GCS.
            if templatePolySR.PCSName:
                templatePolyGCS = os.path.join(arcpy.env.scratchGDB, "templatePolyGCS")
                outSR = arcpy.env.outputCoordinateSystem
                arcpy.env.outputCoordinateSystem = gcsSR
                arcpy.CopyFeatures_management(extent_input, templatePolyGCS)
                arcpy.env.outputCoordinateSystem = outSR
                desc = arcpy.Describe(templatePolyGCS)
            elif len(desc.FIDSet) > 0:
                # generate tessellation doesn't support selection
                copyTemplate = arcpy.CreateUniqueName("copyTemplate", arcpy.env.scratchGDB)
                arcpy.CopyFeatures_management(extent_input, copyTemplate)
                templatePolygon = copyTemplate
                desc = arcpy.Describe(templatePolygon)
            else:
                # could be GCS data: use minimum bounding polygon to honor definition queries
                # https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/24800
                minBoundingPolygon = r"in_memory\\mbgPoly"
                res = arcpy.management.MinimumBoundingGeometry(extent_input, minBoundingPolygon, "ENVELOPE", "ALL", None)
                minBoundingPolyDesc = arcpy.Describe(minBoundingPolygon)
                if minBoundingPolyDesc.extent:
                    desc = minBoundingPolyDesc
            templatePolyExtent = desc.extent

        try:
            # arcpy.AddMessage(templatePolyExtent.JSON)
            # arcpy.AddMessage(gcsSR)
            srtext = arcpy.gp._arc_object.getcustompcs(templatePolyExtent, gcsSR)
            if srtext:
                srtext = srtext.replace("\"", "\'")
                srtext = srtext.replace("''", "'")
                arcpy.AddMessage(srtext)
                projectionSR = arcpy.SpatialReference()
                projectionSR.loadFromString(srtext)
            else:
                raise Exception
        except:
            projectionSR = arcpy.SpatialReference(54034)
        projectedPolyExtent = templatePolyExtent.projectAs(projectionSR)
        return (projectedPolyExtent, templatePolySR)


class FeatureCountQuery(object):
    """Query the feature count from feature service/feature collection based on filter/context/extent."""
    def __init__(self, layer, context=None, extent=None, token=None):
        """Initialize the attributes.

        Args:
            layer: a dictionary with the feature service/collection info.
            context: a dictionary with the extent info.
            extent: a dictionary with the hand-drawn extent info.
            token: token passed in from configuration. This parameter is used for functional testing purpose.
        Returns:
            No returns.
        Raises:
            TypeError will be raised if layer is not a dictionary.
            TypeError will be raised if context is not None and is also not a dictionary.
            TypeError will be raised if extent is not None and is also not a dictionary.

        """
        if not isinstance(layer, dict):
            arcpy.AddError('layer must be a dictionary!')
            raise Exception

        if context:
            if not isinstance(context, dict):
                arcpy.AddError('context needs to be a dictionary if it is not None.')
                raise Exception

        if extent:
            if not isinstance(extent, dict):
                arcpy.AddError('extent needs to be a dictionary if it is not None.')
                raise Exception

        self.layer = layer
        self.context = context
        self.extent = extent
        self.token = token

    def __valid_extent(self, extent):
        """Check if the extent is usable.

        Args:
            extent: a dictionary with the hand-drawn extent info.
        Returns:
            None if the extent is not a hand-drawn polygon. Otherwise, return the geometry of the hand-drawn polygon.
        Raises:
            No exceptions.

        """
        if not extent:
            return None
        elif not isinstance(extent, dict):
            return None
        else:
            try:
                # extent can be a drawing polygon, a feature service URL, and mapnotes with any type of geometry.
                # Hand-drawn polygon should contain only one polygon.
                if len(extent["featureSet"]["features"]) == 1:
                    geometry_info = extent['featureSet']['features'][0].get('geometry')
                    geometry_type = extent['featureSet'].get('geometryType', "")
                    if geometry_type == "esriGeometryPolygon":
                        return geometry_info
                    else:
                        # context is wrapped up as the layers/mapnotes extent in front-end if study area is set to 
                        # layers or mapnotes
                        # Use the context if it is not a hand-drawn polygon.
                        return None
                else:
                    return None
            except:
                return None

    def _get_service_feature_count(self, layer, context, extent):
        """To get the count of total features from a layer.

        Args:
            layer: the value of the parameter with type of layer.
            context: an instance of parameter with param_type as context.
            extent: the json used to perform the query.
        Returns:
            The total # of features of the layer.
        Raises:
            Exception with timeout message if requests.exceptions.Timeout were raised when querying the URL.
            Exception with HTTPError message if requests.exceptions.HTTPError.
            RuntimeError if not able to get the count from an url.

        """
        drawing_extent = self.__valid_extent(extent)
        if drawing_extent:
            query_geometry = json.dumps(drawing_extent)
        else:
            try:
                query_geometry = context.get('extent', None)
                query_geometry = json.dumps(query_geometry)
            except Exception:
                query_geometry = None
                arcpy.AddWarning('ValueError: Unable to get the extent for query! extent is set to None.')

        referer = layer.get('referer')
        headers = {'referer': referer} if referer else {}
        url = layer.get("url") + "/query"

        try:
            params = self.construct_query_parameters(layer.get("serviceToken"),
                                                     query_geometry,
                                                     layer.get("filter", "1=1"),
                                                     layer.get("time"))

            query_response = FeatureCountUtils.post_query_response(url, params, headers)
            arcpy.AddMessage("query_response: {}".format(query_response.json()))
            return query_response.json()["count"]
        except:  # noqa.
            # If get count failed, re-try using the signin token.
            signin_token = arcpy.GetSigninToken()
            lyr_token = signin_token.get("token")
            headers = {"referer": signin_token.get("referer")} if "referer" in signin_token else {}
            params = self.construct_query_parameters(lyr_token,
                                                     query_geometry,
                                                     layer.get("filter", "1=1"),
                                                     layer.get("time"))

            query_response = FeatureCountUtils.post_query_response(url, params, headers)
            return query_response.json()["count"]

    def construct_query_parameters(self, token=None, geometry=None,
                                   attribute_query="1=1",
                                   time_query=None) -> dict:
        """Construct parameters for the URL query.

        Args:
            token: token to access the URL.
            geometry: a dictionary with the geometry information. Geometry can either be an extent or a polygon.
            attribute_query: attribute filter.
            time_query: time filter.
        Returns:
            A dictionary with parameters to feed the post operation of feature layer query URL.
        Raises:
            No exceptions.

        """
        params = {"where": attribute_query, "returnCountOnly": True, "f": "json",
                  "spatialRel": "esriSpatialRelIntersects"}
        if token:
            params["token"] = token

        if time_query:
            params["time"] = time_query

        if geometry:
            params["geometry"] = geometry
            if "xmin" in geometry:
                params["geometryType"] = "esriGeometryEnvelope"
            else:
                params["geometryType"] = "esriGeometryPolygon"

        return params

    def _selectfeatures_byextent(self, feature_set, extent_dict):
        """Select features based on extent.

        Args:
            feature_set: an instance of arcpy's FeatureSet created using arcpy.gp.fromEsriJson.
            extent_dict: a dictionary of extent.
        Returns:
            Integer/Long value of the total # of features.
        Raises:
            No exception.

        """
        if extent_dict:
            try:
                extent = FeatureCountUtils.create_extent_from_json(extent_dict)
                lyr = arcpy.MakeFeatureLayer_management(feature_set).getOutput(0)
                arcpy.SelectLayerByLocation_management(lyr.name, "INTERSECT", extent.polygon, "#", "NEW_SELECTION")
                return int(arcpy.GetCount_management(lyr.name).getOutput(0))
            except Exception:
                return int(arcpy.GetCount_management(feature_set).getOutput(0))
        else:
            return int(arcpy.GetCount_management(feature_set).getOutput(0))

    def _selectfeatures_bydrawingpolygon(self, feature_set, drawing_poly):
        """Select features based on drawing extent.

        Args:
            feature_set: an instance of arcpy's FeatureSet created using arcpy.gp.fromEsriJson.
            drawing_poly: json of the drawing features.
        Returns:
            Integer/Long value of the total # of features.
        Raises:
            No exception.

        """
        if drawing_poly:
            try:
                poly_rset = FeatureCountUtils.create_recordset_from_json(drawing_poly)
                extent_lyr = arcpy.MakeFeatureLayer_management(poly_rset).getOutput(0)
                lyr = arcpy.MakeFeatureLayer_management(feature_set).getOutput(0)
                arcpy.SelectLayerByLocation_management(lyr.name, "INTERSECT", extent_lyr.name, "#", "NEW_SELECTION")
                return int(arcpy.GetCount_management(lyr.name).getOutput(0))
            except Exception:
                return int(arcpy.GetCount_management(feature_set).getOutput(0))
        else:
            return int(arcpy.GetCount_management(feature_set).getOutput(0))

    def _get_featurecollection_count(self, layer, context, extent):
        """To get the total count of features from a FeatureSet.

        Args:
            layer: the value of the parameter with type of layer.
            context: a dictionary with the context info.
            extent: a dictionary with the extent info.
        Returns:
            The total # of features of the layer.
        Raises:
            RuntimeError if not able to get the count from the feature collection.

        """
        if layer['layerDefinition'].get('type', '') == 'Table':
            return len(layer['featureSet']['features'])
        else:
            try:
                rset = FeatureCountUtils.create_recordset_from_json(layer)
                if arcpy.Describe(rset).shapeType.lower() in ('polygon', 'polyline',
                                                              'point', 'multipoint', 'multipatch'):
                    if self.__valid_extent(extent):
                        return self._selectfeatures_bydrawingpolygon(rset, extent)
                    else:
                        if context:
                            return self._selectfeatures_byextent(rset, context.get('extent', None))
                        else:
                            return self._selectfeatures_byextent(rset, None)
                else:
                    return len(layer['featureSet']['features'])
            except Exception:
                arcpy.AddError('Unable to get the count of feature collection.')
                raise Exception

    def construct_count_query_url(self, lyr_url, token, geometry=None,
                                  attribute_query='1=1', generate_token=False):
        """Construct an query URL to get the feature count of a layer.

        Args:
            lyr_url: url of the feature service.
            token: string of token
            geometry: extent dictionary from the context.
            attribute_query: query string based on attribute.
            generate_token: a flag indicating whether to generate the token or not.
        Returns:
            A URL string used by the request to get the feature count.
        Raises:
            RuntimeError if failed to generate the token via hostedgp's GetServerToekn method.

        """
        where_clause = 'where={}'.format(quote(attribute_query))
        return_count = 'returnCountOnly=true'
        if not lyr_url.endswith('/'):
            lyr_url += '/'

        if not token and generate_token:
            # Get a token valid for 60 mins
            try:
                token = arcpy.GetSigninToken().get("token", "")
                arcpy.AddMessage("Token generated from GetSigninToken() is {}".format(token))
            except Exception as err:
                arcpy.AddError('RuntimeError: Unable to generate the token via GetServerToken because {}'
                               .format(str(err)))
                raise Exception

        if token:
            query_variables = [where_clause, return_count, 'spatialRel=esriSpatialRelIntersects',
                               'f=pjson', 'token={}'.format(token)]
        else:
            query_variables = [where_clause, return_count, 'spatialRel=esriSpatialRelIntersects',
                               'f=pjson']

        if geometry:
            geometry_str = 'geometry={}'.format(quote(geometry))
            query_variables.append(geometry_str)
            if 'xmin' in geometry:
                query_variables.append('geometryType=esriGeometryEnvelope')
            else:
                # No need to worry about other types of geometry. Json from client-end is always rings.
                query_variables.append('geometryType=esriGeometryPolygon')

        query_str = '&'.join(query_variables)
        query_url = lyr_url + 'query?' + query_str
        return query_url

    def query(self):
        """Get the total # of features from a layer.

        Args:
            layer: the value of the parameter with type of layer.
            context: an instance of parameter with param_type as context.
        Returns:
            The total # of features of the layer.
        Raises:
            RuntimeError if not able to get the count from an url.

        """
        try:
            if LAYER_KEYWORD in self.layer:
                return self._get_service_feature_count(self.layer, self.context, self.extent)
            elif FEATURECOLLECTION_KEYWORD in self.layer:
                return self._get_featurecollection_count(self.layer, self.context, self.extent)
            else:
                arcpy.AddError('Invalid layer type! Can not get feature count information!')
                raise Exception
        except Exception as err:
            raise Exception(str(err))


class GeoenrichmentFeatureCountQuery(object):
    """Query the count of features for geoenrichment."""
    def __init__(self, country, input_collections):
        """Initialize the attribute.

        Args:
            country: a string with the country name.
            input_collections: a collection of input.
        Returns:
            No returns.
        Raises:
            No exception.

        """
        self.country = country
        self.input_collections = input_collections

    def query(self):
        """Get the count of features.

        Args:
            country: a string with the country name.
            input_collections: a collection of input.
        Returns:
            No returns.
        Raises:
            No exception.

        """
        try:
            input_coll_count = self.input_collections
            # Get the variable count for these collections build the url
            # for geoenrich server
            hostedgp = agolgp.HostedGP(None, None, False)
            helper_services = hostedgp.GetHelperServices()
            geo_enrich_url = helper_services['geoenrichment'].get('url', None)

            if geo_enrich_url is None:
                arcpy.AddError('KeyError: url property missing from geoenrichment object!')
                raise Exception

            (geoenrich_token, geoenrich_referer) = hostedgp.GetServerToken(geo_enrich_url, 60)

            if geo_enrich_url.endswith('/'):
                str_url = geo_enrich_url + 'Geoenrichment/DataCollections'
            else:
                str_url = geo_enrich_url + '/Geoenrichment/DataCollections'

            str_url = str_url + '/{}/f=pjson&token={}'.format(self.country, geoenrich_token)

            # Get the outputJson
            response = requests.get(str_url, params=None,
                                    headers={'referer': geoenrich_referer}, verify=False, stream=True)
            output_json = response.json()

            data_colls = output_json.get('DataCollections', None)
            if data_colls is None:
                arcpy.AddError('KeyError: DataCollections property missing from GeoEnrich response!')
                raise Exception

            if input_coll_count == 1:
                # Go over the dataColls
                input_collection = self.input_collections[0]
                var_count = 0
                for data_col in data_colls:
                    coll_name = data_col.get('dataCollectionID', None)
                    if coll_name is None:
                        arcpy.AddError('KeyError: Failed to get DataCollectionID! Missing key dataCollectionID')
                        raise Exception

                    if coll_name == input_collection:
                        data_arr = data_col.get('data', None)

                        if data_arr is None:
                            arcpy.AddError('KeyError: Failed to get data array! Missing key data!')
                            raise Exception

                        var_count += len(data_arr)
            else:
                collection_hash = {}
                var_count = 0
                for data_col in data_colls:
                    coll_name = data_col.get('dataCollectionID', None)
                    if coll_name is None:
                        arcpy.AddError('KeyError: Failed to get DataCollectionID! Missing key dataCollectionID')
                        raise Exception
                    collection_hash[coll_name] = data_col

                for input_col in self.input_collections:
                    if input_col in collection_hash:
                        data_arr = collection_hash[input_col].get('data', None)

                        if data_arr is None:
                            arcpy.AddError('KeyError: Failed to get data array! Missing key data!')
                            raise Exception

                        var_count += len(data_arr)

            return var_count
        except Exception:
            raise Exception

    def _convert_areal_to_linear(self):
        if self.bin_size_unit.lower() in self.SUPPORTED_AREAL_UNITS:
            return math.sqrt(2 * self.bin_size / math.sqrt(3))
        else:
            return self.bin_size

    def calculate(self):
        (extent_height, extent_width) = self._get_height_width_in_meters()
        conversion_factor = self._get_linearunit_conversion_factor(self.bin_size_unit)
        self.bin_size = self.bin_size * conversion_factor
        long_diag_length = (self.bin_size / (2.0 * math.sin(math.radians(60)))) * 2.0
        col_count = math.ceil(extent_width / self.bin_size) + 1
        # There are overlaps of hexagon. Height of each hexagon is actually long diagnol length - overlap
        hex_overlapping = (self.bin_size / 2.0) * math.tan(math.radians(30))
        row_count = math.ceil(extent_height / (long_diag_length - hex_overlapping)) + 1
        return col_count * row_count


class TessellationFeatureCountQuery:
    """Predict the count of output tessellations using tessellate package."""
    def __init__(self, extent, bin_type, bin_size, bin_size_unit):
        self.extent = self.get_extent(extent)
        (self.extent, _) = TessellationFeatureCountUtils.create_proj_extent(self.extent)
        self.bin_type = bin_type
        if self.bin_type.lower() == "transversehexagon":
            self.bin_type = "TRANSVERSE_HEXAGON"
        self.areal_size = TessellationFeatureCountUtils.get_areal_size(bin_size, self.bin_type, bin_size_unit)

    def get_extent(self, extent):
        """Create an instance of arcpy.Extent from input.

        Args:
            extent: extent can be of the following: 1) a json represents the extent; 2) a dictionary with the feature
            service URL; 3) a dictionary with feature set; 4) a dictionary with the name a Layer instance; and 5) an
            extent instance.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            Exception if the arcpy.Extent instance is not able to be created.

        """
        if isinstance(extent, arcpy.Extent):
            return extent
        elif isinstance(extent, dict):
            if "extent" in extent:
                # extent is an extent json
                return FeatureCountUtils.create_extent_from_json(extent)
            elif "url" in extent:
                # extent is a feature service
                return FeatureCountUtils.get_featureservice_extent(extent)
            elif "featureSet" in extent:
                # extent is a featureset
                return FeatureCountUtils.get_featureset_extent(extent)
            elif "layer" in extent:
                # extent contains a layer name
                # If the extent is a dictionary with key of layer, return the layer itself.
                return extent["layer"]
            else:
                return None
        else:
            return None

    def initialize_tessellation(self, in_extent, in_shape_type, in_shape_size, in_coord_sys=None):
        """Create an instance of tessellation where the rows and columns can be fetched to predict count of tiles.

        Args:
            in_extent: an instance of arcpy.Extent.
            in_shape_type: a string represents the shape type of the tessellation.
            in_shape_size: an areal shape size.
            in_coord_sys: the spatial reference based on which the tessellations will be generated.
        Returns:
            An instance of tessellation.

        """
        shape_dict = {'SQUARE': SquareTessellation,
                      'TRIANGLE': TriangleTessellation,
                      'HEXAGON': HexagonTessellation,
                      'TRANSVERSE_HEXAGON': TransverseHexagonTessellation,
                      'DIAMOND': DiamondTessellation}

        area, areal_unit = in_shape_size.split(" ")
        area = float(area.replace(",", "."))

        if area <= 0.0:
            arcpy.AddError("Invalid area value of {}.".format(area))
            raise ValueError

        if not in_extent:
            arcpy.AddError("Unable to generate tessellations with extent missing.")
            raise ValueError

        try:
            ucs = arcpy.SpatialReference()
            ucs.loadFromString(
                u'{B286C06B-0879-11D2-AACA-00C04FA33C20};-450359962737.05 -450359962737.05 10000;#;#;0.001;#;#;IsHighPrecision')

            # Area of regular polygon to radius formula
            area_sq_m = convert_areal_units(area, 'squaremeters', areal_unit)
            s = shape_dict[in_shape_type.upper()].shape.sides
            d = math.sqrt(3) if s % 3 == 0 else 2
            radius_m = math.sqrt((4 * (area_sq_m / s)) / d)

            # output SR is that of SR param, else extent.SR, else Unknown
            if in_coord_sys not in [None, "", "#"] and in_coord_sys.name:
                project_to = in_coord_sys
            elif (in_extent.spatialReference is not None and
                    in_extent.spatialReference.name != ""):
                project_to = in_extent.spatialReference
            else:
                project_to = ucs

            # extent's SR
            if (in_extent.spatialReference is not None and
                    in_extent.spatialReference.name != ""):
                project_from = in_extent.spatialReference
            else:
                project_from = ucs

            # unit conversion
            if (project_from.linearUnitName == project_to.linearUnitName and
                project_from.linearUnitName in ["Meter", ""]) or (areal_unit == "Unknown"):
                # No conversion needed
                size = radius_m
            elif project_from.type == "Geographic":
                # Convert from Decimal Degrees
                ratio = dd_to_km_ratio(in_extent)
                size = convert_linear_units(radius_m * 1000 * ratio,
                                            'kilometers',
                                            project_to.linearUnitName)
            else:
                # Regular conversion of units
                size = convert_linear_units(radius_m,
                                            'meters',
                                            project_to.linearUnitName)

            if ((project_to.type == "Geographic") and (areal_unit not in ["Unknown", ""])):
                # Convert to Decimal Degrees
                ratio = 1 / dd_to_km_ratio(in_extent)
                size = radius_m / 1000 * ratio

            sr = project_to if project_to.name != "Unknown" else ""

            tessellation = TessellationFactory.make_tessellation(shape_dict[in_shape_type.upper()],
                                                                 float(size), in_extent)
            return tessellation

        except (ValueError, RuntimeError, KeyError) as e:
            arcpy.AddError(e)

        except SystemError as e:
            # ambiguous numpy exception, add more information for debugging
            arcpy.AddError(e)

    def predict_tile_count(self, in_extent, in_shape_type, in_shape_size, in_coord_sys=None):
        """Calculate total # of tiles to be generated based on the user inputs without actually generating them."""
        tessellation = self.initialize_tessellation(in_extent, in_shape_type, in_shape_size, in_coord_sys)
        return tessellation.rows * tessellation.columns

    def query(self):
        return self.predict_tile_count(self.extent, self.bin_type, self.areal_size)
