"""Implement the core logic of ExtractData."""
# noqa. pylint: disable=import-error
# pylint: disable=logging-fstring-interpolation
import os
import re
import csv
from abc import ABC, abstractmethod
from typing import Optional, Union, Tuple, List, Dict
from urllib.parse import unquote, quote, urlparse
import time
import zipfile
import shutil

import arcpy
import arcpy.management
import arcpy.conversion
import arcpy.analysis
from arcpy.da import SearchCursor  # type: ignore
import requests

from .pacommon import PAFeatureLayer, PAFeatureLayerCollection
from .palog import LogUtils, ToolExit
from .parenderer import Renderer
from .aolutils import AOLUtils
from .pautils import FieldUtils, AnalysisUtils


LOGGER = LogUtils.setup_logger(__name__)


__all__ = ["ExtractUtils", "RESTExtractor", "NonRESTExtractor", "DataExtractHandler",
           "FGDBExtractHandler", "CSVExtractHandler", "KMLExtractHandler",
           "SHPExtractHandler"]


class ExtractUtils:
    """Class module with utlity function for ExtractData."""
    GREATER_THAN_8_MEG = 100000

    @staticmethod
    def get_basename(data: Union[str, PAFeatureLayer], validate_as_tablename: bool = True) -> str:
        """Get file name from layer name.

        Args:
            data: if it is str, data is an absolute path of a certain dataset.
            Otherwise, it can be an instance of PAFeatureLayer.
            validate_as_tablename: to check if the base_name is a valid table name
            in scratchGDB if True.
        Returns:
            file base name.
        Raises:
            No exceptions.

        """
        if isinstance(data, PAFeatureLayer):
            tmp_layer_name = data.layer_name  # type: ignore
            # replace any non-alpha character with _
            usable_layer_name = re.sub('[^a-zA-Z0-9]', '_', tmp_layer_name)
            return usable_layer_name

        filename1 = os.path.basename(data)
        filename2 = filename1.replace("\\", "")
        if validate_as_tablename:
            return arcpy.ValidateTableName(filename2, AOLUtils.get_scratch_wkspc())  # type: ignore
        else:
            return filename2

    @staticmethod
    def validate_output_format(layer_to_extract: PAFeatureLayer, desired_output_format: str) -> str:
        """Check if the output format is valid.

        Args:
            layer_to_extract: an instance of PAFeatureLayer which represents feature to extract from.
            desired_output_format: user specified output format.
        Returns:
            A str represents the output format after validation. If the layer_to_extract is not a table view,
            desired_output_format is going to be returned. Otherwise if the desired_output_format
            is shapefile or kml, output format will be CSV.
        Raises:
            ValueError if desired_output_format is not currently supported.

        """
        if desired_output_format.lower() not in ["filegeodatabase", "csv", "kml", "shapefile"]:
            LOGGER.error(f"Unsupported output format of {desired_output_format}.")
            raise ValueError

        if not layer_to_extract.is_table_view:
            return desired_output_format
        else:
            if desired_output_format.lower() in ["kml", "shapefile"]:
                return "CSV"
            else:
                return desired_output_format

    @staticmethod
    def get_extent_from_nonpolylayer(extent_layer: PAFeatureLayer) -> PAFeatureLayer:
        """Create a PAFeatureLayer instance using the extent of a non-polygon PAFeatureLayer.

        Args:
            extent_layer: an instance of PAFeatureLayer with non-polygon shapetype.
        Returns:
            A PAFeatureLayer object where the data is the extent polygon of the input extent_layer.
        Raises:
            AO_100136 if extent is only a point.

        """
        if extent_layer.shapeType == "Polygon":
            return extent_layer

        extent: arcpy.Extent = extent_layer.extent  # type: ignore
        if extent.XMin == extent.XMax or extent.YMin == extent.YMax:
            LOGGER.error(100136, extra={"message_ID": 100136})
            raise ValueError
        extent_poly_path = AOLUtils.create_unique_name(f"{extent_layer.layer}_extent", "in_memory")
        arcpy.management.CopyFeatures(extent.polygon, extent_poly_path)
        return PAFeatureLayer(extent_poly_path, metadata={"parameterDataType": "Feature Set",
                                                          "parameterName": "extentlayer",
                                                          "parameterType": "Optional"})

    @staticmethod
    def get_output_folder_path(folder_name: str, output_format: str) -> str:
        """Create and return a path for output with the desired folder name and format.

        Args:
            folder_name: a string represents the name of the folder to dump the output to.
            output_format: the output format of the files.
        Returns:
            If format is not a FILEGEODATABASE, then the a folder path is returned. Otherwise, the folder path is a
            path to a filegeodatabase.
        Raises:
            No exceptions.

        """
        scratch_folder = AOLUtils.get_scratch_wkspc(False)
        if output_format.upper() == "FILEGEODATABASE":
            folder_name = folder_name + ".gdb" if not folder_name.endswith(".gdb") else folder_name
            if not arcpy.Exists(os.path.join(scratch_folder, folder_name)):
                arcpy.management.CreateFileGDB(scratch_folder, folder_name)
            return os.path.join(scratch_folder, folder_name)
        else:
            if not os.path.exists(os.path.join(scratch_folder, folder_name)):
                os.mkdir(os.path.join(scratch_folder, folder_name))
            else:
                # Delete the existing files there. Used for unit-test purpose.
                tmp_scrath_folder = os.path.join(scratch_folder, folder_name)
                for file in os.listdir(tmp_scrath_folder):
                    try:
                        os.remove(os.path.join(tmp_scrath_folder, file))
                    except OSError:
                        continue
            return os.path.join(scratch_folder, folder_name)

    @staticmethod
    def get_usable_file_name(folder_path: str, file_name: str):
        """Get a new file name that is usable within the folder.

        Parameters
        ----------
            folder_path : 'str'
                Absolute path for the folder to be checked.
            file_name : 'str'
                Name of the file to be created in the folder.
        Returns
        -------
            new_file_name : 'str'
                Name of the file that is usable within the folder. If folder does
                not exist, file_name will be returned as it is.

        """
        if not os.path.exists(folder_path):
            return file_name

        if arcpy.Exists(folder_path) and not arcpy.Exists(os.path.join(folder_path, file_name)):
            return file_name
        else:
            i = 1
            (orig_file_name, ext) = os.path.splitext(file_name)
            new_file_name = f"{orig_file_name}_{i}{ext}"
            while arcpy.Exists(os.path.join(folder_path, new_file_name)):
                i += 1
                new_file_name = f"{orig_file_name}_{i}{ext}"
            return new_file_name

    @staticmethod
    def get_extent_json(extent_layer: PAFeatureLayer):
        """Get polygon geometry of extent layer as json for create replica.

        Args:
            extent_layer: an instance of PAFeatureLayer which contains extent information.
        Returns:
            A dictionary (json) with the extent obtained.
        Raises:
            No exceptions.

        """
        feature_count = extent_layer.count
        layer_name = extent_layer.layer
        # initialize a blank geometry to avoid unbound issue.
        feat_geom = arcpy.Geometry()
        if feature_count > 1:
            extent_feature_layer = arcpy.management.Dissolve(layer_name, r"in_memory\{}".format(layer_name))
        else:
            extent_feature_layer = layer_name

        with SearchCursor(extent_feature_layer, "SHAPE@") as s_curs:
            for row in s_curs:
                feat_geom = row[0]
                break

        point_count = feat_geom.pointCount
        if point_count > ExtractUtils.GREATER_THAN_8_MEG:
            feat_geom = ExtractUtils.simplify_large_features(feat_geom)
        extent_json = feat_geom.JSON

        return extent_json

    @staticmethod
    def simplify_large_features(geom: arcpy.Geometry) -> arcpy.Geometry:
        """Simplify extent layer if more than 100,000 points.

        Args:
            geom: an instance of arcpy.Geometry.
        Returns:
            An instance of arcpy.Geometry with the geometry of the simplified feature.
        Raises:
            AO error of 100141 if geometry after simpliciation still have nodes
            greater than 100,000.

        """
        simplify_vertices_limit = 0.00001
        geom_length = geom.length

        max_offset = geom_length * simplify_vertices_limit
        simplified_geom = geom._arc_object.generalize(max_offset)  # noqa. pylint: disable=protected-access
        simplified_point_count = simplified_geom.pointCount
        if simplified_point_count > ExtractUtils.GREATER_THAN_8_MEG:
            LOGGER.error(100141, extra={"message_ID": 100141})
            raise Exception
        else:
            LOGGER.warning(100140, extra={"message_ID": 100140})

        return simplified_geom

    @staticmethod
    def zip_dir(base_dir: str, output_folder: str, output_zipfilename: str) -> str:
        """Create a compressed zip file from a certain folder with output.

        Args:
            base_dir: a certain directory with the outputs.
            output_folder: path to a folder to save the zip file.
            output_zipfilename: file name without extension with all the files from base_dir zipped.
        Returns:
            Absolute path of the zipped file.
        Raises:
            IO error if base_dir does not exist.

        """
        if not os.path.exists(base_dir):
            LOGGER.error(f"{base_dir} does not exist!")

        zip_file = os.path.join(output_folder, f'{output_zipfilename}.zip')
        write_mode = 'a' if os.path.exists(zip_file) else 'w'
        if base_dir.endswith(".gdb"):
            gdb_name = os.path.basename(base_dir)
        else:
            gdb_name = None

        with zipfile.ZipFile(zip_file, write_mode, zipfile.ZIP_DEFLATED) as z_file:
            # get the relative path of the base_dir. No need to check if the folder name is a valid table name.
            # rel_base_dir = ExtractUtils.get_basename(base_dir, False)
            for root, _, files in os.walk(base_dir):
                for filename in files:
                    if not filename.endswith(".zip") and not filename.endswith(".lock"):
                        absfn = os.path.join(root, filename)
                        zfn = absfn[len(base_dir) + len(os.sep):]
                        # z_file.write(absfn, os.path.join(rel_base_dir, zfn))
                        rel_zfn_path = os.path.join(gdb_name, zfn) if gdb_name else zfn
                        z_file.write(absfn, rel_zfn_path)
        return zip_file

    @staticmethod
    def check_layers_within_extent(paf_coll: PAFeatureLayerCollection,
                                   output_format: str,
                                   extent_layer: Optional[PAFeatureLayer] = None,
                                   clip_to_extent: bool = False) -> Tuple[int, List]:
        """Get total # of features of all the layers within the coverage of extent_layer.

        Args:
            layers: an instance of PAFeatureLayerCollection.
            output_format: a string indicating the extractData output format.
            extent_layer: an instance of PAFeatureLayer with the extent information.
            clip_to_extent: whether to clip to the boundary to get the feature count or not. If not clip_to_extent,
            the feature count might be biased high since the extent is always larger than the polygons.
        Returns:
            The total # of features of all the layers within the coverage of the extent_layer. If the layer's data is
            a tableview, then all the rows are counted.
        Raises:
            No exceptions.

        """
        count = 0
        zero_fields_layer = []
        orig_extent = arcpy.env.extent  # type: ignore
        if extent_layer:
            arcpy.env.extent = extent_layer.extent  # type: ignore

        for i, paflyr in enumerate(paf_coll.data):
            if output_format == "CSV":
                exclude_fields = []
                if hasattr(paflyr, "shapeFieldName"):
                    exclude_fields.append(paflyr.shapeFieldName)
                if hasattr(paflyr, "oidFieldName"):
                    exclude_fields.append(paflyr.oidFieldName)
                temp_fields = [field.name for field in paflyr.fields if field.name not in exclude_fields]
                if not temp_fields:
                    zero_fields_layer.append(i)
                    LOGGER.warning(100050, extra={"message_ID": 100050})

            if arcpy.env.extent is None or paflyr.is_table_view:  # type: ignore
                tmp_count = paflyr.count
            else:
                if not clip_to_extent or not extent_layer:
                    tmp_count = AOLUtils.get_feature_count(paflyr.data)
                else:
                    clip_layer = AOLUtils.create_unique_name("clip_layer", "scratchgdb")
                    arcpy.analysis.Clip(paflyr.data, extent_layer.data, clip_layer)
                    tmp_count = AOLUtils.get_feature_count(clip_layer)

            if tmp_count == 0:
                LOGGER.warning(100024, extra={"message_ID": 100024,
                                              "inputLayer": paflyr.layer_name})
            count += tmp_count

        arcpy.env.extent = orig_extent  # type: ignore
        return (count, zero_fields_layer)

    @staticmethod
    def is_fs_table_view(fs_info, fs_layer_id, headers):
        """Check if a certain feature layer is a table view.

        Args:
            fs_info: a dictionary with information specified for createReplica. It is generated from hostedgp's
            GetHostedLayersForExtract function. It contains keys of "url", "token", and "layers".
            fs_layer_id: the id of a certain layer to check.
        Returns:
            True if the feature layer is a table view and False otherwise.
        Exceptions:
            No exception. Return false which will treat the feature layer as a non-tableview if unable to get the
            data type.

        """
        try:
            # Use actualUrl over url
            fs_url = fs_info.get("url")
            if fs_url is None:
                LOGGER.error(
                    "Invalid feature service information that does not have the URL of the service.")
                raise Exception
            # Construct the query URL to get the data type of the feature layer.
            fl_url = f"{fs_url}/{fs_layer_id}"
            params = {"f": "json"}
            if "token" in fs_info:
                params["token"] = fs_info["token"]

            flayer_response = AOLUtils.mk_post_request(fl_url, params=params,
                                                       verify=False, headers=headers)
            if "type" in flayer_response:
                return flayer_response["type"] == "Table"
            LOGGER.debug("Unable to get data type of the feature layer.")
            return False
        except:  # noqa. pylint: disable=bare-except
            LOGGER.debug("Unable to get data type of the feature layer.")
            return False

    @staticmethod
    def file_rename(file_name: str, new_name: str) -> str:
        """Rename an existing file.

        Args:
            file_name: the absolute path of an existing file.
            new_name: a str represents the new name of the file.
        Returns:
            The absolute file path after name change.
        Raises:
            IOError if file to rename does not exist.

        """
        if not os.path.exists(file_name):
            LOGGER.error(f'{file_name} does not exist!')
            raise IOError

        # Get the file base name
        base = os.path.basename(file_name)
        dirname = os.path.dirname(file_name)
        (_, extension) = os.path.splitext(base)

        # Replace the invalid characters from new_name with _
        newname = []

        for char in new_name:
            if char.isdigit() or char.isalpha():
                newname.append(char)
            else:
                newname.append('_')

        new_name = "".join(newname)

        os.rename(file_name, os.path.join(dirname, new_name + extension))
        return os.path.join(dirname, new_name + extension)


class CreateReplicateHandler:
    def __init__(self, fs_json: Dict, extent_json: Optional[Dict],
                 output_folder: str,
                 output_format: str = "filegdb",
                 extent_type: str = "esriGeometryPolygon"):
        """Get a FGDB using create replica.

        Args:
            input_services: a list of dict with information of services (i.e., URL, token, layer to extract).
            extent_json: a json created from extent as query for createReplica.
            output_folder: absolute path to a certain folder to unpack the replica FGDB.
        Returns:
            An integer represents the total number of features in the FGDB created from the feature collection.

        """
        self.fs_json = fs_json
        if not self.fs_json.get("url"):
            LOGGER.error("Invalid input for CreateReplicaHandler. url is missing.")
            raise ToolExit
        self.fs_name = self.get_fs_name()
        self.extent_json = extent_json
        self.output_folder = output_folder
        self.output_format = output_format
        self.extent_type = extent_type
        if not os.path.exists(self.output_folder):
            os.mkdir(self.output_folder)

    def get_fs_name(self) -> str:
        """Get the feature service name from the URL. This name is going to be used as name of the output FGDB."""
        fs_parse = urlparse(self.fs_json["url"])
        path_comp = fs_parse.path.split("/")
        if len(path_comp) >= 2:
            tmp_name = path_comp[-2]
            tmp_name = tmp_name.replace(" ", "_").strip()
            return tmp_name
        else:
            LOGGER.debug("Unable to find the feature service name.")
            return ""

    def _prep_params(self) -> Tuple:
        where_clause = {}
        service_url = self.fs_json.get("url", "")
        layer_name = os.path.split(os.path.split(unquote(service_url))[0])[1]
        referer_url = self.fs_json.get("referer")
        headers = {"referer": referer_url}
        service_token = self.fs_json.get("token")
        sync_model = "none"
        if self.fs_json.get("layers"):
            for elem_lyr in self.fs_json.get("layers", []):
                if "filter" in elem_lyr and "id" in elem_lyr:
                    where_clause[str(elem_lyr.get("id"))] = {"where": str(elem_lyr.get("filter"))}
                # Check if the layer is a table view or not.
                elif ExtractUtils.is_fs_table_view(self.fs_json, elem_lyr.get("id"), headers):
                    LOGGER.debug(f"{elem_lyr.get('id')} is a TableView")
                    where_clause[str(elem_lyr.get("id"))] = {
                        "queryOption": "all"}

            service_layers = [int(layer["id"]) for layer in self.fs_json.get("layers", [])]

        params = {"replicaName": layer_name,
                  "layers": service_layers,  # type: ignore
                  "returnAttachments": "true",
                  "transportType": "esriTransportTypeUrl",
                  "returnAttachmentDatabyURL": "true",
                  "async": "true",
                  "dataFormat": self.output_format,
                  "token": service_token}
        if self.extent_json:
            params["geometry"] = self.extent_json
            params["geometryType"] = self.extent_type

        if self.extent_json is None or self.output_format == "sqlite":
            if service_token:
                fs_url = f"{service_url}?token={service_token}&f=json"
            else:
                fs_url = f"{service_url}?f=json"
            LOGGER.debug(f"{fs_url=}")
            fs_json = AOLUtils.mk_get_request(fs_url, verify=False, headers=headers)
            if self.extent_json is None:
                ext = fs_json.get("fullExtent")
                if ext:
                    params["geometryType"] = "esriGeometryEnvelope"
                    geom = f"{ext['xmin']},{ext['ymin']},{ext['xmax']},{ext['ymax']}"
                    params["geometry"] = geom
            if self.output_format == "sqlite":
                if fs_json.get("syncEnabled") and fs_json.get("syncCapabilities"):
                    if fs_json["syncCapabilities"].get("supportsPerLayerSync"):
                        sync_model = "perLayer"
                    else:
                        sync_model = "perReplica"
        params["syncModel"] = sync_model
        params["f"] = "json"
        if where_clause:
            params["layerQueries"] = where_clause
        return (service_url, params, headers)

    def _unpack_replica_url(self, replica_response: Dict) -> str:
        replica_result_url = replica_response.get("resultUrl", "")
        replica_result_url = quote(replica_result_url, safe="/:")
        LOGGER.debug(f"replica_result_url: {replica_result_url}")
        return replica_result_url

    def handle(self) -> int:
        """Extract data into the FGDB.

        Returns:
            URL with the createReplica output FGDB.

        """
        (service_url, params, headers) = self._prep_params()
        replica_resp = self.create_replica(service_url, params, headers)
        return self.replica_data_extract(self._unpack_replica_url(replica_resp),
                                         self.fs_json.get("token"))

    def cache(self) -> Tuple[str, Dict]:
        """Extract data into a SQLite mobile geodatabase."""
        (service_url, params, headers) = self._prep_params()
        LOGGER.debug(f"Params for create_replica: {params}")
        LOGGER.debug(f"service_url: {service_url}")
        try:
            replica_resp = self.create_replica(service_url, params, headers)
        except Exception as err:
            # re-try using syncModel as none
            if params.get("syncModel") != "none":
                params["syncModel"] = "none"
                try:
                    LOGGER.debug("Retry with syncModel as none.")
                    replica_resp = self.create_replica(service_url, params, headers)
                except Exception as err:
                    LOGGER.error(f"Unable to create_replica against: {service_url} with params: {params}")
                    raise ToolExit from err
            else:
                LOGGER.error(f"Unable to create_replica against: {service_url} with params: {params}")
                raise ToolExit
        replica_local_copy = self.unpack_replica(self._unpack_replica_url(replica_resp),
                                                 self.fs_json.get("token"),
                                                 self.output_folder)
        return (replica_local_copy, replica_resp)

    def create_replica(self, service_url: str, params: Dict, headers: Dict) -> Dict:
        """Create replica of feature service to get attachments. createReplica can be POST only.

        Args:
            service_url: URL of the feature service.
            params: a dictionary of parameters to query.
            headers: headers to send in the request.
        Returns:
            A url to access the output FGDB.

        """
        if params.get("token"):
            create_replica_url = "{}/{}?token={}".format(
                service_url, "createReplica", params.get("token"))
        else:
            params.pop("token")
            create_replica_url = f"{service_url}/createReplica"

        # check status before further operation
        try:
            if "geometry" in params:
                geometry = params.pop("geometry")
                data = {"geometry": geometry}
                create_replica_response = AOLUtils.mk_post_request(create_replica_url,
                                                                   params=params,
                                                                   data=data,
                                                                   verify=False,
                                                                   headers=headers)
            else:
                create_replica_response = AOLUtils.mk_post_request(create_replica_url,
                                                                   params=params,
                                                                   verify=False,
                                                                   headers=headers)

            LOGGER.debug(f"create_replica_response: {create_replica_response}")
            if create_replica_response.get("statusUrl"):
                return CreateReplicateHandler.check_replica_job(
                    create_replica_response, params.get("token"))
            else:
                LOGGER.error("Unable to get status of createReplica via: {}".format(
                    create_replica_url))
                raise Exception
        except Exception as err:
            # Raise an error to prompt users to check if allow export to other formats was turned on.
            LOGGER.error(100206, extra={"message_ID": 100206, "Url": service_url})
            raise Exception from err

    @classmethod
    def check_replica_job(cls, cr_response: Dict, token: Optional[str]) -> Dict:
        """Track the status of the submitted createReplica job.

        Args:
            cr_response: a json of createReplica response.
            token: token used to trigger the createReplica call. It can also be used to check status of the job.
        Returns:
            Url to access the output FGDB.
        Raises:
            Exception if failed in tracking the status of the job.

        """
        if "statusUrl" in cr_response:
            status_url = cr_response.get("statusUrl")
            status_url = quote(status_url, safe="/:")  # type: ignore
            if token:
                status_url_call = f"{status_url}?f=json&token={token}"
            else:
                status_url_call = f"{status_url}?f=json"
            LOGGER.debug(f"status_url_call: {status_url_call}")
            job_response = AOLUtils.mk_get_request(status_url_call,
                                                   verify=False,
                                                   stream=True)
            if "status" in job_response:
                while not job_response.get("status") == "Completed":
                    job_response = AOLUtils.mk_get_request(status_url_call,
                                                           verify=False,
                                                           stream=True)
                    # LOGGER.debug(f"job_response: {job_response}")
                    if job_response.get("status") == "Failed" or "error" in job_response:
                        LOGGER.error("Failed in tracking the status of createReplica.")
                        raise RuntimeError
                    time.sleep(1)
                if "resultUrl" in job_response:
                    LOGGER.debug(f"job_response: {job_response}")
                    return job_response
                else:
                    LOGGER.debug("No resultUrl in job response.")
                    raise RuntimeError
            else:
                LOGGER.debug("Job status is missing in job response.")
                raise RuntimeError
        else:
            LOGGER.error("Failed in tracking the status of createReplica.")
            raise RuntimeError

    @classmethod
    def unpack_replica(cls, replica_output_url: str, token: Optional[str], output_folder: str) -> str:
        local_filename = replica_output_url.split('/')[-1]
        local_file = os.path.join(output_folder, local_filename)
        LOGGER.debug(f"unpack replica output at: {local_file}")
        if token:
            replica_url_token = "{}?token={}".format(replica_output_url, token)
        else:
            replica_url_token = "{}".format(replica_output_url)
        # NOTE the stream=True parameter below
        with requests.get(replica_url_token, stream=True, verify=False) as r:
            r.raise_for_status()
            with open(local_file, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192): 
                    # If you have chunk encoded response uncomment if
                    # and set chunk_size parameter to None.
                    # if chunk: 
                    f.write(chunk)
        return local_file

    def rename_fgdb(self, orig_fgdb_path: str, new_fgdb_name: str) -> str:
        """Rename the FGDB.

        Args:
            orig_fgdb_path (str): the absolute path of the FGDB to rename.
            new_fgdb_name (str): the new name of the FGDB with the extension (.gdb).

        Returns:
            str: the absolute path of the renamed FGDB.
        """
        arcpy.management.Rename(orig_fgdb_path, new_fgdb_name)
        return os.path.join(self.output_folder, new_fgdb_name)
    
    def proj_fgdb(self, orig_fgdb_path: str, new_fgdb_name: str) -> str:
        """Project all the feature classes to the env's outputCoordinateSystem. 

        Args:
            orig_fgdb_path (str): the input FGDB containing the data to project.
            new_fgdb_name (str): name of the output FGDB to save the projected data.

        Returns:
            str: the absolute path of the output.
        """
        arcpy.management.CreateFileGDB(self.output_folder, new_fgdb_name)
        with arcpy.EnvManager(workspace = orig_fgdb_path):
            datasets: List[str] = arcpy.ListDatasets("", "") or [] # type: ignore
            for tmp_ds in datasets:
                feature_classes: List[str] = arcpy.ListFeatureClasses("", "", tmp_ds) or [] # type: ignore
                for feature_class in feature_classes:
                    # CopyFeatures honors the env's outputCoordinateSystem.
                    arcpy.management.CopyFeatures(os.path.join(orig_fgdb_path, feature_class),
                                                    os.path.join(self.output_folder, new_fgdb_name, feature_class))

            feature_classes: List[str] = arcpy.ListFeatureClasses("", "") or [] # type: ignore
            for feature_class in feature_classes:
                arcpy.management.CopyFeatures(os.path.join(orig_fgdb_path, feature_class),
                                            os.path.join(self.output_folder, new_fgdb_name, feature_class))
            
            tbls: List[str] = arcpy.ListTables("", "") or []  # type: ignore
            for tbl in tbls:
                arcpy.management.CopyRows(os.path.join(orig_fgdb_path, tbl),
                                        os.path.join(self.output_folder, new_fgdb_name, tbl))
        
        # delete the original FGDB after the projection.
        try:
            shutil.rmtree(orig_fgdb_path)
        except Exception as err:
            LOGGER.debug(f"Unable to delete {orig_fgdb_path} due to {str(err)}.")

        return os.path.join(self.output_folder, new_fgdb_name)
    
    def replica_data_extract(self, replica_output_url: str, token: Optional[str]) -> int:
        """ Unzip the create replica zip file output.

        Args:
            replica_output_url: URL to access the createReplica output.
            token: token to access the feature service. It can also be used to fetch the createReplica output. 
        Returns:
            An integer represents the total # of features in all the results.
        Raises:
            No exceptions.

        """
        feature_count = 0

        zip_file = self.unpack_replica(replica_output_url, token, self.output_folder)  # type: ignore
        with zipfile.ZipFile(zip_file) as zipped_gdb:
            file_name = zipped_gdb.namelist()[0].split(".")[0]
            zipped_gdb.extractall(self.output_folder)
        output_gdb = f"{file_name}.gdb"
        output_gdb_path = os.path.join(self.output_folder, output_gdb)
        fgdb_name = self.fs_name if self.fs_name.strip() else file_name
        new_gdb = f"{fgdb_name}.gdb"
        feature_count = 0
        for files in os.listdir(self.output_folder):
            LOGGER.debug(f"{files=}")
            if files == output_gdb:
                
                if arcpy.env.outputCoordinateSystem:  # type: ignore
                    wkspc = self.proj_fgdb(output_gdb_path, new_gdb)  # type: ignore
                else:
                    wkspc = self.rename_fgdb(output_gdb_path, new_gdb)  # type: ignore
                
                with arcpy.EnvManager(workspace=wkspc):
                    datasets: List[str] = arcpy.ListDatasets("", "") or [] # type: ignore
                    for tmp_ds in datasets:
                        feature_classes: List[str] = arcpy.ListFeatureClasses("", "", tmp_ds) or []  # type: ignore
                        for feature_class in feature_classes:
                            tmp_fc_path = os.path.join(arcpy.env.workspace, feature_class)  # type: ignore
                            feature_count += AOLUtils.get_feature_count(tmp_fc_path)

                    feature_classes: List[str] = arcpy.ListFeatureClasses("", "") or []  # type: ignore
                    for feature_class in feature_classes:
                        feature_count += AOLUtils.get_feature_count(feature_class)
                        
                    tables: List[str] = arcpy.ListTables("", "") or []  # type: ignore
                    for tbl in tables:
                        feature_count += AOLUtils.get_feature_count(tbl)

        return feature_count


class DataExtractHandler(ABC):
    """Abstract class for ExtractData core logic."""

    OUTPUT_EXTENSION_LOOKUP = {"filegeodatabase": "", "csv": ".csv", "kml": ".kmz",
                               "shapefile": ".shp", "layerpackage": ".lpk"}

    def __init__(self, input_layer: PAFeatureLayer, extent_layer: Optional[PAFeatureLayer],
                 output_folder: str, output_format: str, clip: bool = False):
        """Initialize properties.

        Args:
            input_layer: an instance of PAFeatureLayer.
            extent_layer: an instance of PAFeatureLayer.
            output_folder: folder to keep the outputs.
            output_format: format of the output data.
            clip: whether to clip the input_layers to the extent_layer boundary or not.

        """
        self.output_format = output_format
        self.input_layer = self.preprocess_input(input_layer)
        self.extent_layer = extent_layer
        self.clip = clip
        self.output_extension = self.OUTPUT_EXTENSION_LOOKUP[output_format.lower()]
        self.output_file_name = ExtractUtils.get_basename(self.input_layer) + self.output_extension
        self.output_folder = output_folder
        self.output_file_name = ExtractUtils.get_usable_file_name(self.output_folder,
                                                                  self.output_file_name)
        self.output_file_path = os.path.join(self.output_folder, self.output_file_name)
        LOGGER.debug(f"output_file_path: {self.output_file_path}")
    
    @LogUtils.time_exec
    def get_hpd_fields(self, lyr: PAFeatureLayer) -> List[str]:
        """Get the high precision date fields of a layer.

        Args:
            lyr (PAFeatureLayer): an instance of PAFeatureLayer from which to search high precision date fields.

        Returns:
            List[str]: a list of names of high precision date fields.
        
        Notes:
            This function can be time-consuming with large number of rows containing high-precision date fields as
            it needs to look into the content of each date fields with precision equals to 1.
        """
        hp_date_fields = []
        fields = arcpy.Describe(lyr.data).fields
        for fld in fields:
            if fld.type == "Date" and fld.precision == 1:
                hp_date_fields.append(fld.name)

        if hp_date_fields:
            real_hp_idx = []
            idx_not_checked = [i for i in range(len(hp_date_fields))]
            with arcpy.da.SearchCursor(lyr.data, hp_date_fields) as curr:
                for row in curr:
                    has_update = False
                    for i in idx_not_checked:
                        iso_str = AnalysisUtils.date_to_iso(row[i], "ms")
                        if "." in iso_str:
                            iso_ms = iso_str.split(".")[-1]
                            if iso_ms != '0' * len(iso_ms):
                                real_hp_idx.append(i)
                                has_update = True
                    if has_update:
                        for idx in real_hp_idx:
                            if idx in idx_not_checked:
                                idx_not_checked.remove(idx)
                    if not idx_not_checked:
                        break
            return [hp_date_fields[i] for i in real_hp_idx]
        return []
    
    def preprocess_input(self, input_layer: PAFeatureLayer) -> PAFeatureLayer:
        """Preprocess the input to convert high-precision date field to string.

        Args:
            input_layer (PAFeatureLayer): an instance of PAFeatureLayer.

        Returns:
            PAFeatureLayer: the preprocessed layer.
        """
        if self.output_format.lower() == "filegeodatabase":
            return input_layer
        hpd_field_names = self.get_hpd_fields(input_layer)
        LOGGER.debug(f"{hpd_field_names=}")
        if not hpd_field_names:
            return input_layer
        else:
            local_copy = AOLUtils.create_unique_name("tmpInput", arcpy.env.scratchGDB)  # type: ignore
            if input_layer.is_table_view:
                arcpy.management.CopyRows(input_layer.data, local_copy)
            else:
                arcpy.management.CopyFeatures(input_layer.layer, local_copy)
            fields: List[arcpy.Field] = arcpy.Describe(local_copy).fields  # type: ignore
            hp_date_fields = FieldUtils.get_fields_by_names(fields, hpd_field_names)
            LOGGER.debug(f"local copy's high-precision date fields: {hp_date_fields}")
            # update the row
            hp_str_date_fields = []
            for hp_fld in hp_date_fields:
                uniq_fname = FieldUtils.create_unique_field_name(fields, hp_fld.name)[0]
                arcpy.management.AddField(local_copy, uniq_fname, field_type="TEXT",
                                          field_length=50, field_alias=hp_fld.aliasName)
                hp_str_date_fields.append(uniq_fname)
            
            fields_to_update = []
            for hpd_f, hps_fname in zip(hp_date_fields, hp_str_date_fields):
                fields_to_update.append(hpd_f.name)
                fields_to_update.append(hps_fname)
            
            with arcpy.da.UpdateCursor(local_copy, fields_to_update) as ucurr:
                for row in ucurr:
                    new_row = []
                    for date_idx in range(len(hp_date_fields)):
                        iso_str = AnalysisUtils.date_to_iso(row[date_idx * 2], "ms")
                        new_row.append(row[date_idx * 2])
                        new_row.append(iso_str)
                    ucurr.updateRow(new_row)

            for hpd_f, hps_fname in zip(hp_date_fields, hp_str_date_fields):
                arcpy.management.DeleteField(local_copy, hpd_f.name)
                arcpy.management.AlterField(local_copy, hps_fname, new_field_name=hpd_f.name)
            LOGGER.debug("High-precision date fields has been altered.")
            processed_lyr = PAFeatureLayer(local_copy)
            processed_lyr.layer_name = input_layer.layer_name
            return processed_lyr

    def select_features(self, copy_to_output: bool):
        """Select features within extent_layer or extent and copy the selected features to workspace.

        Args:
            No arguments.
        Returns:
            An integer with the # of features from input_layer fall within the extent_layer. If extent_layer is empty,
            return # of features fall within the extent.
        Raises:
            No exceptions.

        """
        if self.extent_layer and not self.input_layer.is_table_view:
            arcpy.management.SelectLayerByLocation(self.input_layer.layer, "intersect", self.extent_layer.layer)
            # If selection has been updated, reset the properties so the updated count can be picked.
            if copy_to_output:
                arcpy.management.CopyFeatures(self.input_layer.layer, self.output_file_path)
        elif self.input_layer.is_table_view and copy_to_output:
            arcpy.gp._arc_object.SimpleCopy(self.input_layer.data,  # pylint: disable=protected-access
                                            self.output_file_path)
        elif copy_to_output:
            arcpy.management.CopyFeatures(self.input_layer.layer, self.output_file_path)

    def clip_features(self, output_file_path):
        """Clip features that fall within extent_layer or extent.

        Args:
            No arguments
        Returns:
            An integer with the # of features in the clipped layer.
        Raises:
            No exceptions.

        """
        if not self.input_layer.is_table_view and self.extent_layer:
            arcpy.analysis.Clip(self.input_layer.layer, self.extent_layer.layer, output_file_path)
        else:
            arcpy.management.CopyRows(self.input_layer.data, output_file_path)

    @abstractmethod
    def handle(self) -> int:
        """Abstract method to get the desired data.

        Returns:
            An integer represents the count of features in the output.

        """
        # This will never be hit.
        raise NotImplementedError


class FGDBExtractHandler(DataExtractHandler):
    """Extract data and save the output in the format of FGDB."""

    def handle(self) -> int:
        """Implement the abstract method."""
        if self.clip:
            self.clip_features(self.output_file_path)
        else:
            self.select_features(True)
        # Get the count of all features in the output instead of the features within arcpy.env.extent.
        return AOLUtils.get_total_feature_count(self.output_file_path, False)


class CSVExtractHandler(DataExtractHandler):
    """Extract data and save the output in the format of CSV."""

    def create_csv(self, feat_layer: PAFeatureLayer, out_csv_file: str) -> int:
        """Create a csv file from the PAFeatureLayer.

        Args:
            feat_layer: an instance of PAFeatureLayer.
            out_csv_file: absolute path of saving the output csv file.
        Returns:
            Integer represents the total # of records write to the csv file.
        Raises:
            No exceptions.

        """
        omit_fields = []
        if hasattr(feat_layer, "shapeFieldName"):
            omit_fields.append(feat_layer.shapeFieldName)

        if hasattr(feat_layer, "oidFieldName"):
            omit_fields.append(feat_layer.oidFieldName)
        data_to_export = feat_layer.data if feat_layer.is_table_view else feat_layer.layer

        fields = [f.name for f in AOLUtils.list_fields(data_to_export) if f.name not in omit_fields]
        row_count = 0

        if not fields:
            LOGGER.warning(100050, extra={"message_ID": 100050})
            return row_count

        spa_ref = arcpy.SpatialReference(4326)

        csv_file = open(out_csv_file, 'w', newline='', encoding='utf8')
        csv_writer = csv.writer(csv_file)

        # Point feature type handling for CSV output
        try:
            if feat_layer.shapeType == 'Point':
                csv_writer.writerow(['Long', 'Lat'] + fields)
                with SearchCursor(data_to_export, ['SHAPE@XY'] + fields, spatial_reference=spa_ref) as rows:
                    for row in rows:
                        vals = [row[0][0], row[0][1]] + list(row[1:])
                        csv_writer.writerow(vals)
                        row_count += 1

            # Multipoint feature type handling for CSV output
            elif feat_layer.shapeType == 'Multipoint':
                csv_writer.writerow(['Long', 'Lat'] + fields)
                with SearchCursor(data_to_export, ['SHAPE@XY'] + fields, spatial_reference=spa_ref,
                                           explode_to_points=True) as rows:
                    for row in rows:
                        vals = [row[0][0], row[0][1]] + list(row[1:])
                        csv_writer.writerow(vals)
                        row_count += 1

            # All other feature type handling for CSV output
            else:
                csv_writer.writerow(fields)
                with SearchCursor(data_to_export, fields) as rows:
                    for row in rows:
                        vals = list(row[0:])
                        csv_writer.writerow(vals)
                        row_count += 1

        except AttributeError:
            csv_writer.writerow(fields)
            # no-qa. pylint: disable=E1101
            with SearchCursor(data_to_export, fields) as rows:
                for row in rows:
                    vals = list(row[0:])
                    csv_writer.writerow(vals)
                    row_count += 1

        del csv_writer
        return row_count

    def handle(self) -> int:
        """Implement abstract method."""
        if self.extent_layer and self.clip and not self.input_layer.is_table_view:
            tmp_output_path = r'in_memory\{}'.format(
                ExtractUtils.get_basename(self.input_layer))
            arcpy.analysis.Clip(self.input_layer.layer, self.extent_layer.layer, tmp_output_path)
            clip_layer = PAFeatureLayer(tmp_output_path, verify_feature_count=False,
                                        select_features_in_extent=False)
            return self.create_csv(clip_layer, self.output_file_path)
        else:
            self.select_features(copy_to_output=False)
            return self.create_csv(self.input_layer, self.output_file_path)


class KMLExtractHandler(DataExtractHandler):
    """Extract data and save the output in the format of KML."""

    def render_layer(self, layer_to_render: PAFeatureLayer):
        """Add renderer information to the layer.

        Args:
            layer_to_render: an instance of PAFeatureLayer.
        Returns:
            The layer attribute of the layer_to_renderer.
        Raises:
            No exceptions.

        """
        shape_type = layer_to_render.shapeType.upper()
        LOGGER.debug(f'{shape_type=}')
        symbol_lyrx = f"SIMPLE_RENDERER_{shape_type}.lyrx" if shape_type != "MULTIPOINT" else "SIMPLE_RENDERER_POINT.lyrx"
        Renderer.apply_renderer_to_layer(layer_to_render, symbol_lyrx)

    def create_kml(self, layer_to_save: PAFeatureLayer, out_kmz_file: str):
        """Save the feature layer to a .kmz file.

        Args:
            layer_to_save: an instance of PAFeatureLayer.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.render_layer(layer_to_save)
        if self.extent_layer:
            arcpy.conversion.LayerToKML(layer_to_save.layer, out_kmz_file,
                                        boundary_box_extent=self.extent_layer.layer)
        else:
            arcpy.conversion.LayerToKML(layer_to_save.layer, out_kmz_file)

    def handle(self) -> int:
        """Implement the abstract method."""
        if self.extent_layer and self.clip:
            clip_layer_path = os.path.join(AOLUtils.get_scratch_wkspc(),
                                           ExtractUtils.get_basename(self.input_layer))
            # clip_layer_path = r'in_memory\{}'.format(ExtractUtils.get_basename(self.input_layer))
            arcpy.analysis.Clip(self.input_layer.layer,
                                self.extent_layer.layer, clip_layer_path)
            feat_layer = PAFeatureLayer(clip_layer_path, verify_feature_count=False,
                                        select_features_in_extent=False)
        else:
            self.select_features(copy_to_output=False)
            # Copy the selected features since create_kml does not honor selection
            # tmp_out_layer = r'in_memory\{}'.format(ExtractUtils.get_basename(self.input_layer))
            tmp_out_layer = AOLUtils.create_unique_name(ExtractUtils.get_basename(self.input_layer),
                                                        "scratchgdb")
            arcpy.management.CopyFeatures(
                self.input_layer.layer, tmp_out_layer)
            feat_layer = PAFeatureLayer(tmp_out_layer, verify_feature_count=False,
                                        select_features_in_extent=False)
        self.create_kml(feat_layer, self.output_file_path)
        return feat_layer.count


class SHPExtractHandler(DataExtractHandler):
    """Extract data and save the output in the format of FGDB."""

    def handle(self) -> int:
        """Implement the abstract method."""
        if self.clip:
            self.clip_features(self.output_file_path)
        else:
            self.select_features(True)
        return AOLUtils.get_total_feature_count(self.output_file_path)


class RESTExtractor:
    """Call createReplica tool to extract data with attachments included."""

    def __init__(self, input_layers: PAFeatureLayerCollection, extent_layer: Optional[PAFeatureLayer]):
        """Set up the properties."""
        self.input_layers = input_layers
        self.layers_for_extract = self.input_layers.get_extract_data_json()
        if not self.layers_for_extract:
            LOGGER.error("No data to extract.")
            raise ToolExit
        LOGGER.debug(f"{self.layers_for_extract=}")
        self.extent_layer = extent_layer

    def extract(self) -> tuple:
        """Extract data from the layers.

        Returns:
            A two item tuple where the first item represents the path of the final output and the second
            item as an integer represents the total number of features in the output.

        """
        tot_feat_count = 0
        date_stamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
        output_zipped_file_name = f"extract_data_{date_stamp}"
        output_file = None

        # extract all the feature collection data into the feature_collection FGDB.
        if "featureCollections" in self.layers_for_extract and self.layers_for_extract["featureCollections"]:
            fc_output_gdb = ExtractUtils.get_output_folder_path(
                "feature_collection", "FILEGEODATABASE")
            tot_feat_count += self.extract_fc_data(fc_output_gdb)
            output_file = ExtractUtils.zip_dir(fc_output_gdb,
                                               AOLUtils.get_scratch_wkspc(False),
                                               output_zipped_file_name)

        if "featureServices" in self.layers_for_extract and self.layers_for_extract["featureServices"]:
            fs_output_folder = os.path.join(AOLUtils.get_scratch_wkspc(False),
                                            "services")
            if self.extent_layer:
                extent_json = ExtractUtils.get_extent_json(self.extent_layer)
            else:
                extent_json = None
            tot_feat_count += self.extract_fs_data(self.layers_for_extract["featureServices"],
                                                   extent_json, fs_output_folder)
            output_file = ExtractUtils.zip_dir(fs_output_folder,
                                               AOLUtils.get_scratch_wkspc(False),
                                               output_zipped_file_name)

        # Zip fc_output_gdb with fs_output_gdb
        return (output_file, tot_feat_count)

    def extract_fc_data(self, output_gdb: str) -> int:
        """Create a FGDB from feature collection.

        Args:
            output_gdb: absolute path of a filegeodatabase to save output.
        Returns:
            An integer represents the total number of features in the FGDB created from the feature collection.

        """
        input_feat_coll = self.layers_for_extract.get("featureCollections")
        if input_feat_coll:
            feature_count = 0
            for feat_coll in input_feat_coll:
                tmp_feat_count = FGDBExtractHandler(feat_coll, self.extent_layer, output_gdb,
                                                    "FILEGEODATABASE", False).handle()
                feature_count += tmp_feat_count

            return feature_count
        else:
            return 0

    def extract_fs_data(self, input_services: list, extent_json: Optional[Dict], output_gdb: str) -> int:
        """Create a FGDB using create replica.

        Args:
            input_services: a list of dict with information of services (i.e., URL, token, layer to extract).
            extent_json: a json created from extent as query for createReplica.
            output_gdb: absolute path of a filegeodatabase to save output.
        Returns:
            An integer represents the total number of features in the FGDB created from the feature collection.

        """
        feature_count = 0
        for fservice in input_services:
            handler = CreateReplicateHandler(fservice, extent_json, output_gdb)
            feature_count += handler.handle()

        return feature_count


class NonRESTExtractor:
    """ExtractData through arcpy operations instead of createReplica."""

    DATA_EXTRACTORS = {"FILEGEODATABASE": FGDBExtractHandler,
                       "SHAPEFILE": SHPExtractHandler,
                       "CSV": CSVExtractHandler,
                       "KML": KMLExtractHandler}

    def __init__(self, input_layers: PAFeatureLayerCollection, extent_layer: Optional[PAFeatureLayer],
                 output_format: str, clip: bool = False):
        """Set up initial properties."""
        self.input_layers = input_layers
        self.extent_layer = extent_layer
        self.output_format = output_format
        self.clip = clip
        self.output_folder = ExtractUtils.get_output_folder_path(
            "output", self.output_format)
        arcpy.env.workspace = self.output_folder  # type: ignore

    def extract(self) -> Tuple:
        """Extract data from the layers.

        Args:
            No arguments.
        Returns:
            A two item tuple where the first item represents the path of the final output and the second
            item as an integer represents the total number of features in the output.
        Raises:
            No exceptions.

        """
        output_counts = []
        output_files = []

        for layer in self.input_layers.data:
            # get the proper output_format.
            output_format = ExtractUtils.validate_output_format(
                layer, self.output_format)
            try:
                extractor = self.DATA_EXTRACTORS[output_format.upper()](layer, self.extent_layer,
                                                                        self.output_folder,
                                                                        output_format, self.clip)
            except KeyError as kerr:
                LOGGER.error(f"Unsupported output format of {output_format}.")
                raise ValueError from kerr

            output_feat_count = extractor.handle()
            output_counts.append(output_feat_count)
            if output_feat_count > 0:
                output_files.append(extractor.output_file_path)

        if len(output_files) == 1 and self.output_format.upper() in ["CSV", "KML"]:
            # TODO: need to add datestamp to the output_file. Otherwise the publish might fail.
            return (output_files[0], sum(output_counts))
        elif len(output_files) == 1 and self.output_format.upper() == "SHAPEFILE" and output_files[0].endswith(".csv"):
            return (output_files[0], sum(output_counts))
        else:
            date_stamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
            file_name_prefix = ExtractUtils.get_basename(output_files[0])
            output_zipped_file_name = f"{file_name_prefix}_{date_stamp}"

            output_zip_file = ExtractUtils.zip_dir(arcpy.env.workspace,  # type: ignore
                                                   AOLUtils.get_scratch_wkspc(False),
                                                   output_zipped_file_name)
            return (output_zip_file, sum(output_counts))
