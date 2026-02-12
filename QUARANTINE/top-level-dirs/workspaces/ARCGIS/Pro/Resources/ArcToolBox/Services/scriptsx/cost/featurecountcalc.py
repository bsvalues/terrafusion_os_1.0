"""---------------------------------------------------------------------------
Name:              CostReport.py
Purpose:           To estimate and report the credits taken for a certain
                   online analysis tool.
Author:            Esri Inc.
Created:           2/12/2018
Copyright:   (c)   Esri, Inc. 2012
ArcGIS Version:    10.6.1
---------------------------------------------------------------------------"""
# no-qa. pylint: disable=logging-format-interpolation
import json
from abc import ABC, abstractmethod
from urllib.parse import quote
from typing import Optional, Any, Dict, Union
import math

import urllib3
import arcpy
import arcpy.management

from common import AOLUtils, TessellationUtils, LogUtils, H3_HEXAGON_RES

LOGGER = LogUtils.setup_logger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)  # type: ignore


class FeatureCountCalculator(ABC):
    """Abstract class module define the feature count query interface."""

    def __init__(self, layer: Dict, context: Optional[Dict] = None, extent: Optional[Dict] = None):
        """Initialize the attributes.

        Args:
            layer: a json with the feature layer information (i.e., {"url": "..."} or {"featureSet": "..."})
            context: a json with the context information (i.e., {"extent": {...}}).
            extent: a json with the extent information.
        Returns:
            No returns.
        Raises:
            No raises

        """
        self.layer = layer
        self.context = context
        self.extent = extent

    def validate_extent(self, extent: Optional[Dict]) -> Optional[Dict]:
        """Check if the extent is usable for query.

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
                        # mapnotes with only one non-polygon features.
                        return None
                else:
                    # Use the context if there are more than one features (mapnotes).
                    return None
            except KeyError:
                return None

    @abstractmethod
    def get_count(self) -> Optional[int]:
        """Get the count of features."""
        raise NotImplementedError

    def calc(self) -> int:
        """Get the count of features.

        Args:
            No arguments.
        Returns:
            An integer represents the count of features.
        Raises:
            Error if failed to get the count.

        """
        try:
            count = self.get_count()
            if count is None:
                raise RuntimeError
            return count
        except Exception as err:   # noqa. pylint: disable=W0702
            LOGGER.error("Unable to get the count.")
            raise Exception from err


class FeatServiceCountCalculator(FeatureCountCalculator):
    """Query the count of features from a feature service layer."""

    def construct_query_parameters(self, token: Optional[str] = None, geometry: Optional[str] = None,
                                   attribute_query: str = "1=1",
                                   time_query: Optional[str] = None) -> Dict:
        """Construct parameters for the feature layer count query.

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

    def get_count(self) -> Optional[int]:
        """Overwrite the abstractmethod."""
        drawing_extent = self.validate_extent(self.extent)
        if drawing_extent:
            query_geometry = json.dumps(drawing_extent)
        else:
            try:
                query_geometry = self.context.get('extent')  # type: ignore
                query_geometry = json.dumps(query_geometry)
            except:  # noqa. pylint: disable=W0702
                query_geometry = None
                LOGGER.debug('Unable to get the extent for query! extent is set to None.')

        referer = self.layer.get('referer')
        headers = {'referer': referer} if referer else {}
        url = self.layer.get("url")
        if url and not url.endswith("/query"):
            url += "/query"
        elif url is None:
            LOGGER.debug("Unable to get count from empty url.")
            raise RuntimeError

        params = self.construct_query_parameters(self.layer.get("serviceToken"),
                                                 query_geometry,
                                                 self.layer.get("filter", "1=1"),
                                                 self.layer.get("time"))

        try:
            query_response = AOLUtils.mk_post_request(url, data=params, headers=headers)
            LOGGER.debug(f"query_response: {query_response}")
            return query_response['count']
        except:  # noqa. pylint: disable=bare-except
            try:
                # If get count failed, re-try using the signin token
                signin_token = arcpy.GetSigninToken()
                lyr_token = signin_token.get("token")
                headers = {"referer": signin_token.get("referer")} if "referer" in signin_token else {}
                params = self.construct_query_parameters(lyr_token, query_geometry,
                                                         self.layer.get("filter", "1=1"),
                                                         self.layer.get("time"))
                query_response = AOLUtils.mk_post_request(url, data=params, headers=headers)
                return query_response["count"]
            except:  # noqa. pylint: disable=bare-except
                return None


class FeatCollectionCountCalculator(FeatureCountCalculator):
    """Query the count of features from a feature collection."""

    def selectfeatures_byextent(self, feature_set: arcpy.FeatureSet,
                                extent_json: Optional[Dict]) -> int:
        """Select features based on extent.

        Args:
            feature_set: an instance of arcpy's FeatureSet created using arcpy.gp.fromEsriJson.
            extent_json: a json with the extent layer information.
        Returns:
            integer with the total # of features.
        Raises:
            No exception.

        """
        if extent_json:
            try:
                extent = AOLUtils.create_extent_from_json(extent_json)
                lyr = AOLUtils.make_feature_layer(feature_set)
                arcpy.management.SelectLayerByLocation(lyr, "INTERSECT", extent.polygon,  # type: ignore
                                                       "#", "NEW_SELECTION")
                return AOLUtils.get_feature_count(lyr)
            except:  # noqa. pylint: disable=bare-except
                return AOLUtils.get_feature_count(feature_set)
        else:
            return AOLUtils.get_feature_count(feature_set)

    def selectfeatures_bydrawingpolygon(self, feature_set: arcpy.FeatureSet, drawing_poly: Optional[Dict]):
        """Select features based on drawing extent.

        Args:
            feature_set: an instance of arcpy's FeatureSet created using arcpy.gp.fromEsriJson.
            drawing_poly: json of the drawing features.
        Returns:
            integer with total # of features.
        Raises:
            No exception.

        """
        if drawing_poly:
            try:
                poly_rset = AOLUtils.create_featureset_from_json(drawing_poly)
                if poly_rset:
                    extent_lyr = AOLUtils.make_feature_layer(poly_rset)
                else:
                    LOGGER.debug("empty poly_rset")
                    raise RuntimeError

                lyr = AOLUtils.make_feature_layer(feature_set)
                arcpy.management.SelectLayerByLocation(lyr, "INTERSECT", extent_lyr, "#", "NEW_SELECTION")
                return AOLUtils.get_feature_count(lyr)
            except:  # noqa. pylint: disable=bare-except
                return AOLUtils.get_feature_count(feature_set)
        else:
            return AOLUtils.get_feature_count(feature_set)

    def get_count(self) -> Optional[int]:
        """Overwrite the get_count abstractmethod."""
        # If the feature collection is a tableview, return the count of records.
        if self.layer['layerDefinition'].get('type', '') == 'Table':
            return len(self.layer['featureSet']['features'])
        else:
            try:
                rset = AOLUtils.create_featureset_from_json(self.layer)
                if rset is None:
                    LOGGER.error("Unable to create recordset from json.")
                    return None
                if AOLUtils.describe(rset).shapeType.lower() in ('polygon', 'polyline',
                                                                 'point', 'multipoint',
                                                                 'multipatch'):
                    if self.validate_extent(self.extent):
                        return self.selectfeatures_bydrawingpolygon(rset, self.extent)
                    else:
                        tmp_context = self.context.get("extent") if self.context and "extent" in self.context else None
                        return self.selectfeatures_byextent(rset, tmp_context)
                else:
                    return len(self.layer['featureSet']['features'])
            except:  # noqa. pylint: disable=bare-except
                LOGGER.error("Unable to get the count of feature collection.")
                return None


class CatalogPathCountCalculator(FeatureCountCalculator):
    def _derive_extent(self) -> Optional[arcpy.Extent]:
        if self.extent:
            extent = self.extent
        elif self.context and "extent" in self.context:
            extent = self.context["extent"]
        else:
            return None

        if isinstance(extent, dict):
            return AOLUtils.create_extent_from_json(extent)
        elif isinstance(extent, arcpy.Extent):
            return extent
        else:
            LOGGER.debug(f"Unrecognized extent with type of {type(self.extent)}.")
            return None

    @classmethod
    def _get_count(cls, data: Union[str, arcpy.RecordSet, arcpy.FeatureSet],
                   task_extent: Optional[arcpy.Extent]=None) -> int:
        with arcpy.EnvManager(extent=task_extent):
            return int(arcpy.management.GetCount(data).getOutput(0))  # type: ignore

    def get_count(self) -> Optional[int]:
        cpath = self.layer.get("catalogPath")
        if not cpath or not arcpy.Exists(cpath):
            return None
        else:
            if not self.layer.get("filter"):
                task_extent = self._derive_extent() if self.context or self.extent else arcpy.env.extent
                return self._get_count(cpath, task_extent)
            else:
                filter = self.layer["filter"]
                try:
                    data = arcpy.management.MakeFeatureLayer(cpath, where_clause=filter).getOutput(0)
                    task_extent = self._derive_extent() if self.context or self.extent else arcpy.env.extent
                    return self._get_count(data, task_extent)
                except:
                    LOGGER.debug(f"Unable to wrap {cpath} as a FeatureSet.")
                    try:
                        data = arcpy.RecordSet(cpath, filter)
                    except:
                        LOGGER.debug(f"Unable to wrap {cpath} as a RecordSet.")
                        return None
                    return self._get_count(data)

class ELFeatCountCalculator:
    """Predict the count of features involved in EnrichLayer analysis."""

    def __init__(self, country: str, input_collections: Any):
        """Initialize the attribute.

        Args:
            country: name of the country to query from.
            input_collections: a collection of input.
        Returns:
            No returns.
        Raises:
            No exception.

        """
        self.country = country
        self.input_collections = input_collections

    def calc(self) -> Optional[int]:
        """Get the count of features.

        Returns:
            Count of features.
        Raises:
            No exception.

        """
        input_coll_count = self.input_collections
        # Get the variable count for these collections build the url for geoenrich server
        helper_services = arcpy.GetPortalDescription().get("helperServices")
        if "geoenrichment" not in helper_services:
            LOGGER.error("url property missing from geoenrichment object!")
            raise KeyError

        geo_enrich_url = helper_services['geoenrichment'].get('url')
        sign_in_token = arcpy.GetSigninToken()
        geoenrich_token = sign_in_token.get("token")
        geoenrich_referer = sign_in_token.get("referer")

        format = "" if geo_enrich_url.endswith('/') else "/"
        str_url = f"{geo_enrich_url}{format}Geoenrichment/DataCollections"
        str_url = f'{str_url}/{self.country}/f=pjson&token={geoenrich_token}'

        # Get the outputJson
        output_json = AOLUtils.mk_get_request(str_url, headers={"referer": geoenrich_referer})

        data_colls = output_json.get('DataCollections')
        if data_colls is None:
            LOGGER.error('DataCollections property missing from GeoEnrich response!')
            raise KeyError

        if input_coll_count == 1:
            # Go over the dataColls
            input_collection = self.input_collections[0]
            var_count = 0
            for data_col in data_colls:
                coll_name = data_col.get('dataCollectionID')
                if coll_name is None:
                    LOGGER.error('Failed to get DataCollectionID! Missing key dataCollectionID.')
                    raise KeyError

                if coll_name == input_collection:
                    data_arr = data_col.get('data')

                    if not data_arr:
                        LOGGER.error('Failed to get data array! Missing key data!')
                        raise KeyError

                    var_count += len(data_arr)
        else:
            collection_hash = {}
            var_count = 0
            for data_col in data_colls:
                coll_name = data_col.get('dataCollectionID')
                if not coll_name:
                    LOGGER.error('Failed to get DataCollectionID! Missing key dataCollectionID')
                    raise KeyError
                collection_hash[coll_name] = data_col

            for input_col in self.input_collections:
                if input_col in collection_hash:
                    data_arr = collection_hash[input_col].get('data')

                    if not data_arr:
                        LOGGER.error('Failed to get data array! Missing key data!')
                        raise KeyError

                    var_count += len(data_arr)

        return var_count


class TessellFeatCountCalculator:
    """Predict the count of output tessellations using tessellate package."""

    def __init__(self, extent: Union[Dict, arcpy.Extent], bin_type: str, bin_size: float, bin_size_unit: str):
        """Set up an arcpy.Extent instance and project it if needed.

        Args:
            extent: a json with extent information or an instance of arcpy.Extent.
            bin_type: type of customed bin. Can be Triangle, Hexagon, Square, Diamond, and TransverseHexagon.
            bin_size: a numeric value represents the size of the bin.
            bin_size_unit: a string represents the unit of size.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.extent = self.create_extent(extent)
        (self.extent, _) = TessellationUtils.create_proj_extent(self.extent)
        self.bin_type = bin_type
        if self.bin_type.lower() == "transversehexagon":
            self.bin_type = "TRANSVERSE_HEXAGON"
        self.areal_size = TessellationUtils.get_areal_size(bin_size, self.bin_type, bin_size_unit)

    @classmethod
    def create_extent(cls, extent_input: Any) -> Optional[arcpy.Extent]:
        """Create an instance of arcpy.Extent from input.

        Args:
            extent_input: extent can be of the following: 1) a json represents the extent; 2) a dictionary with the
            feature service URL; 3) a dictionary with feature set; 4) a dictionary with the name of a Layer instance;
            5) an extent instance; and 6) a featureset/recordset/maplayer/layername that can be described and has extent.
        Returns:
            An instance of arcpy.Extent.
        Raises:
            Exception if the arcpy.Extent instance is not able to be created.

        """
        if isinstance(extent_input, arcpy.Extent):
            return extent_input
        elif isinstance(extent_input, dict):
            if "extent" in extent_input:
                # extent is an extent json
                return AOLUtils.create_extent_from_json(extent_input)
            elif "url" in extent_input:
                # extent is a feature service
                return AOLUtils.get_featureservice_extent(extent_input)
            elif "featureSet" in extent_input:
                # extent is a featureset
                return AOLUtils.get_featureset_extent(extent_input)
            elif "layer" in extent_input:
                # extent contains a layer name
                return AOLUtils.describe(extent_input["layer"]).extent
        elif arcpy.Exists(extent_input):
            desc = arcpy.Describe(extent_input)
            if hasattr(desc, "extent"):
                return desc.extent  # type: ignore

        return None

    def calc(self) -> Optional[int]:
        """Query the count of features."""
        tessellation = TessellationUtils.initialize_tessellation(self.extent,  # type: ignore
                                                                 self.bin_type,
                                                                 self.areal_size,
                                                                 None)
        return tessellation.rows * tessellation.columns


class H3HexagonFeatCountCalculator:
    """Estimate the count of output tessellations based on H3Hexagon shape type."""

    def __init__(
            self,
            extent: Union[Dict, arcpy.Extent, arcpy.FeatureSet, arcpy.RecordSet],
            h3_res: int
    ):
        if isinstance(extent, arcpy.FeatureSet) or isinstance(extent, arcpy.RecordSet):
            self.extent = TessellationUtils.create_h3hex_extent(extent)
        else:
            self.extent = TessellFeatCountCalculator.create_extent(extent)
        self.h3_res = h3_res
    
    def _get_h3_cell_area(self) -> float:
        return H3_HEXAGON_RES[self.h3_res] * math.pow(10, 6)

    def _rads_to_km_ratio(self, x_min: float, y_min: float, x_max: float) -> float:
        radis_earth_km = 6371.0
        d = math.pow(math.sin((y_min - y_min) / 2.0), 2.0) + math.cos(y_min) * math.cos(y_min) * math.pow(math.sin((x_max - x_min) / 2.0), 2.0)
        d = 2.0 * radis_earth_km * math.asin(math.sqrt(d))
        return d / (x_max - x_min)
    
    def _convert_area(self, h3_cell_area: float) -> float:
        area_radius = math.sqrt(h3_cell_area)
        sref = self.extent.spatialReference
        # projected coordinate system
        if sref.PCSName:
            area_radius /= sref.metersPerUnit
        elif sref.GCSName:
            rpu = sref.radiansPerUnit
            # at 0 longitude (equator) 1 degree is approximately 111.139 km
            # We will calculate ratio between radians of coordinate system and
            # physical kilometers on the Earth surface by measuring physical distance
            # between xMin and xMin + radius (of the cell) in kilometers
            degree_to_km = 111.139
            rad_to_km = 180.0 * degree_to_km / math.pi
            # change the units of radius in radians at equator to meters
            radius_in_radians = area_radius / (1000.0 * rad_to_km)
            rads_to_km_ratio = self._rads_to_km_ratio(self.extent.XMin * rpu,
                                                      self.extent.YMin * rpu,
                                                      self.extent.XMin * rpu + radius_in_radians)
            ratio = 1.0 / rads_to_km_ratio
            area_radius = area_radius / 1000.0 / rpu * ratio
        else:
            LOGGER.debug("Invalid spatial reference of the extent.")
            raise RuntimeError
        return area_radius * area_radius

    def calc(self) -> int:
        """Estimate the count of output H3 hexagons"""
        extent_area = self.extent.polygon.area
        convert_area = self._convert_area(self._get_h3_cell_area())
        return math.ceil(extent_area / convert_area)
