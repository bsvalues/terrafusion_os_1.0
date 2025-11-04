#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''---------------------------------------------------------------------------
Name:              extractdata.py
Purpose:           Extracts data within a user specified user extent.
Author:            Esri, Inc.
Created:           02/26/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
Python Version:    2.7.2 (default, Jun 12 2011, 15:08:59)
---------------------------------------------------------------------------'''
import os
import time
import json
import contextlib
import requests
import debugUtils


from urllib.parse import unquote, urlencode, quote
from urllib.request import urlopen

try:
    unicode=unicode
except NameError:
    str = str
    unicode = str
    bytes = bytes
    basestring = (str, bytes)
else:
    str = str
    unicode = unicode
    bytes = str
    basestring = basestring

import zipfile
import shutil
import arcpy
import hostedgp as agolgp
import aolutils
import ssl

from extractdata_dt import create_csv, zipdir

PRIVILEGE_CREATE_ITEM = "portal:user:createItem"
taskName = "ExtractData"


def simplify_large_features(geom, point_count):
    """ Simplify Extent Layer if more than 100,000 points."""
    greater_than_8_meg = 100000
    simplify_vertices_limit = 0.00001
    geom_length = geom.length

    max_offset = geom_length * simplify_vertices_limit
    simplified_geom = geom._arc_object.generalize(max_offset)
    simplified_point_count = simplified_geom.pointCount
    if simplified_point_count > greater_than_8_meg:
        aolutils.AddErrorCode(100141, "The features in the Extent Layer are beyond max request size limit and cannot be extracted.")
        raise Exception
    else:
        aolutils.AddErrorCode(100140, "The extent layer contains features with geometry too complex for the requested service. Results will be based on a simplified geometry.", warning=True)

    return simplified_geom


def get_extent(extent_name):
    """ Get polygon geometry of Extent Layer as json for create replica."""
    greater_than_8_meg = 100000
    feat_layer_name = "{}_layer".format(extent_name)
    extent_feature_layer = arcpy.MakeFeatureLayer_management(extent_name, feat_layer_name)
    feature_count = int(arcpy.GetCount_management(extent_feature_layer).getOutput(0))
    if feature_count > 1:
        extent_feature_layer = arcpy.Dissolve_management(extent_feature_layer, r"in_memory\{}".format(extent_name))
    with arcpy.da.SearchCursor(extent_feature_layer, "SHAPE@") as s_curs:   # pylint: disable=E1101
        for row in s_curs:
            feat_geom = row[0]
    point_count = feat_geom.pointCount
    if point_count > greater_than_8_meg:
        feat_geom = simplify_large_features(feat_geom, point_count)
    extent_json = feat_geom.JSON

    return extent_json

def append_folder_zip(output_filename, source_dir):
    """Append the gdb folder to the zipped output"""
    with zipfile.ZipFile(output_filename, "a", zipfile.ZIP_DEFLATED) as zip_final:
        for root, _, files in os.walk(source_dir):
            for f in files:
                file_name = os.path.join(root, f)
                if os.path.isfile(file_name) and not file_name.endswith(".zip"):
                    file_path = os.path.join(os.path.relpath(root, source_dir), f)
                    zip_final.write(file_name, file_path)

    result_file = os.path.join(source_dir, output_filename)

    return result_file

def is_fs_table_view(fs_info, fs_layer_id, headers):
    """Check if a certain feature layer is a table view.

    Args:
        fs_info: a dictionary with information specified for createReplica. It is generated from hostedgp's
        GetHostedLayersForExtract function. It contains keys of "url", "actualUrl", "token", and "layers".
        fs_layer_id: the id of a certain layer to check.
    Returns:
        True if the feature layer is a table view and False otherwise.
    Exceptions:
        No exception. Return false which will treat the feature layer as a non-tableview if unable to get the data type.

    """
    try:
        # Use actualUrl over url
        fs_url = fs_info.get("actualUrl", fs_info.get("url"))
        if fs_url is None:
            arcpy.AddMessage("Invalid feature service information that does not have the URL of the service.")
            raise Exception
        # Construct the query URL to get the data type of the feature layer.
        fl_url = "{0}/{1}".format(fs_url, fs_layer_id)
        params = {"f": "json"}
        if "token" in fs_info:
            params["token"] = fs_info["token"]

        response = requests.post(fl_url, params=urlencode(params), verify=False, headers=headers)
        flayer_response = response.json()
        if "type" in flayer_response:
            return flayer_response["type"] == "Table"
        arcpy.AddMessage("Unable to get data type of the feature layer.")
        return False
    except:  # noqa. pylint: disable=bare-except
        arcpy.AddMessage("Unable to get data type of the feature layer.")
        return False

def extract_attachments(extent_name, tableViewOutputs):
    """ Extract Data to get attachments returned in a file geodatabase."""
    if extent_name:
        extent_json = get_extent(extent_name)
    else:
        extent_json = None
    replica_data = []
    input_layers = hostedgp.GetHostedLayersForExtract(0)
    featureCount = 0

    if "featureCollections" in input_layers:
        input_feat_coll = input_layers.get("featureCollections")
        if input_feat_coll:
            featureCount += create_feature_collection_gdb(input_feat_coll, extent_name)
        else:
            featureCount += 0

    if "services" in input_layers:
        input_services = input_layers.get("services")
        for elem in input_services:
            where_clause = {}
            service_url = elem.get("url")
            layer_name = os.path.split(os.path.split(unquote(service_url))[0])[1]
            service_token = elem.get("token")
            referer_url = elem.get("referer")
            headers = {"referer": referer_url}
            if elem.get("layers"):
                for fs_layer in elem.get("layers"):
                    if "filter" in fs_layer and "id" in fs_layer:
                        where_clause[str(fs_layer.get("id"))] = {"where": str(fs_layer.get("filter"))}
                    # Check if the layer is a table view or not.
                    elif is_fs_table_view(elem, fs_layer.get("id"), headers):
                        arcpy.AddMessage("{} is a TableView".format(fs_layer.get("id")))
                        where_clause[str(fs_layer.get("id"))] = {"queryOption": "all"}

                service_layers = [int(layer["id"]) for layer in elem.get("layers")]

            params = {"replicaName": layer_name,
                      "layers": service_layers,
                      "returnAttachments": "true",
                      "transportType": "esriTransportTypeUrl",
                      "returnAttachmentDatabyURL": "true",
                      "async": "true",
                      "syncModel": "none",
                      "dataFormat": "filegdb",
                      "token": service_token}

            if extent_json:
                params["geometry"] = extent_json
                params["geometryType"] = "esriGeometryPolygon"
            if where_clause:
                params["layerQueries"] = where_clause

            replica_output_urls = create_replica(service_url, params, headers)
            replica_data.append(str(replica_output_urls))

        featureCount += replica_data_extract(replica_data, service_token)

    output_loc = arcpy.env.scratchFolder  # pylint: disable=E1101
    output_loc_unzipped_gdbs = os.path.join(output_loc, "out_gdbs")
    result_file = replica_data_zip(os.path.join(output_loc_unzipped_gdbs, "extract_data.zip"), output_loc_unzipped_gdbs)
    return result_file, featureCount

def create_feature_collection_gdb(input_feat_coll, extent_name):
    currGDBName = os.path.split(str(input_feat_coll[0]))[0]
    output_loc = arcpy.env.scratchFolder  # pylint: disable=E1101
    output_loc_unzipped_gdbs = os.path.join(output_loc, "out_gdbs")
    if not os.path.exists(output_loc_unzipped_gdbs):
        os.mkdir(output_loc_unzipped_gdbs)

    feat_coll_gdb = os.path.basename(currGDBName).replace("scratch", "feature_collection")
    if not arcpy.Exists(os.path.join(output_loc_unzipped_gdbs, feat_coll_gdb)):
        arcpy.CreateFileGDB_management(output_loc_unzipped_gdbs, feat_coll_gdb)

    feature_count = 0
    for fc_featureclass in input_feat_coll:
        fcName = os.path.split(str(fc_featureclass))[1]
        resLayer = arcpy.CreateUniqueName(fcName, os.path.join(output_loc_unzipped_gdbs, feat_coll_gdb))
        if arcpy.Describe(fc_featureclass).dataType != 'TableView':
            tmpLyr = arcpy.MakeFeatureLayer_management(fc_featureclass, fcName).getOutput(0)
            if extent_name:
                arcpy.management.SelectLayerByLocation(tmpLyr, "intersect", extent_name)

            arcpy.CopyFeatures_management(tmpLyr, resLayer)
        else:
            arcpy.CopyRows_management(fc_featureclass, resLayer)

        feature_count += int(arcpy.GetCount_management(resLayer).getOutput(0))

    return feature_count

def create_replica(service_url, params, headers):
    """ Create replica of feature service to get attachments. POST only. params argument is a dict."""
    params["f"] = "json"
    token = params.get("token")
    if not params.get("geometry"):
        # construct URL differently with/without token. If a feature service is shared to public, there is no token
        # but createReplica should still work. (see https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/21822)
        if token:
            fs_url = "{}?token={}&f=json".format(service_url, token)
        else:
            fs_url = "{}?f=json".format(service_url)
        arcpy.AddMessage(fs_url)
        response = requests.get(fs_url, verify=False, headers=headers)
        fs = response.json()
        ext = fs.get("fullExtent")
        if ext:
            params["geometryType"] = "esriGeometryEnvelope"
            geom = "{},{},{},{}".format(ext["xmin"], ext["ymin"], ext["xmax"], ext["ymax"])
            params["geometry"] = geom

    if token:
        create_replica_url = "{}/{}?token={}".format(service_url, "createReplica", params.get("token"))
    else:
        params.pop("token")
        create_replica_url = "{}/{}".format(service_url, "createReplica")

    if "geometry" in params:
        geometry = params.pop("geometry")
        data = {"geometry": geometry}
        response = requests.post(create_replica_url, params=urlencode(params), data=data, verify=False, headers=headers)
    else:
        response = requests.post(create_replica_url, params=urlencode(params), verify=False, headers=headers)
    
    # check status before further operation
    try:
        if not response.ok:
            raise response.raise_for_status()

        response.encoding = 'utf-8'

        create_replica_response = response.json()
        if create_replica_response.get("statusUrl"):
            replica_output_data = create_replica_job(create_replica_response, params.get("token"))
            return replica_output_data
        else:
            raise Exception
    except:
        # Raise an error to prompt users to check if enable sync was turned on.
        params = {"Url": service_url}
        aolutils.AddErrorCode(100206,
                              "Create Replica failed for the Url(s): {}. Check if service allows others to export data to different formats.".format(service_url),
                              params)
        raise Exception


def create_replica_job(json_data, token):
    """ Tracks the status of the submitted create replica job."""
    if "statusUrl" in json_data:
        status_url = json_data.get("statusUrl")
        status_url = quote(status_url, safe="/:")
        if token:
            status_url_call = "{}?f=json&token={}".format(status_url, token)
        else:
            status_url_call = "{}?f=json".format(status_url)
        response = requests.get(status_url_call, verify=False, stream=True)
        job_response = response.json()
        if "status" in job_response:
            while not job_response.get("status") == "Completed":
                response = requests.get(status_url_call, verify=False, stream=True)
                response.encoding = 'utf-8'
                job_response = response.json()
                if job_response.get("status") == "Failed" or "error" in job_response:
                    raise Exception
                time.sleep(5)
            if "resultUrl" in job_response:
                replica_result_url = job_response.get("resultUrl")
                replica_result_url = quote(replica_result_url, safe="/:")
                arcpy.AddMessage("replica_result_url: {}".format(replica_result_url))
                return replica_result_url
    else:
        raise Exception


def replica_data_extract(replica_output_urls, token):
    """ Unzip the create replica zip file output."""
    output_loc = arcpy.env.scratchFolder  # pylint: disable=E1101
    output_loc_unzipped_gdbs = os.path.join(output_loc, "out_gdbs")
    if not os.path.exists(output_loc_unzipped_gdbs):
        os.mkdir(output_loc_unzipped_gdbs)

    zip_file = os.path.join(output_loc, "extract_data.zip")
    zip_file_in = zipfile.ZipFile(zip_file, "w", zipfile.ZIP_DEFLATED)
    for replica_url in replica_output_urls:
        zip_file_name = os.path.split(replica_url)[1].split(".")[0]
        fgdb_name = os.path.split(os.path.split(os.path.split(replica_url)[0])[0])
        # Online the replica name is different from the name on portal. Use the following pattern to avoid duplicate
        # name.
        if fgdb_name[1].lower() == "featureserver":
            fgdb_name = os.path.split(fgdb_name[0])[1]
        else:
            fgdb_name = fgdb_name[1]

        if token:
            replica_url_token = "{}?token={}".format(replica_url, token)
        else:
            replica_url_token = "{}".format(replica_url)
        response = requests.get(replica_url_token, verify=False, stream=True)
        with open(zip_file, "wb") as output:
            output.write(response.content)

        with zipfile.ZipFile(zip_file) as zipped_gdb:
            file_name = zipped_gdb.namelist()[0].split(".")[0]
            zipped_gdb.extractall(output_loc_unzipped_gdbs)
        output_gdb = "{}{}".format(file_name, ".gdb")
        output_gdb_path = os.path.join(output_loc_unzipped_gdbs, output_gdb)
        new_gdb = "{}{}".format(fgdb_name, ".gdb")
        feature_count = 0
        for files in os.listdir(output_loc_unzipped_gdbs):
            if files == output_gdb:
                arcpy.Rename_management(output_gdb_path, new_gdb)
                files = new_gdb
            arcpy.env.workspace = os.path.join(output_loc_unzipped_gdbs, files)
            feature_classes = arcpy.ListFeatureClasses("", "")
            for feature_class in feature_classes:
                feature_count += int(arcpy.GetCount_management(feature_class).getOutput(0))

    return feature_count


def replica_data_zip(output_filename, source_dir):
    """ Zip the create replica gdb output."""
    output_filename_split = output_filename.split(".")
    time_stamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    zipped_gdb_file = "{}_{}.{}".format(output_filename_split[0], time_stamp, output_filename_split[1])
    with zipfile.ZipFile(zipped_gdb_file, "w", zipfile.ZIP_DEFLATED) as zip_final:
        for root, dirs, files in os.walk(source_dir):
            for f in files:
                file_name = os.path.join(root, f)
                if os.path.isfile(file_name) and not file_name.endswith(".zip"):
                    file_path = os.path.join(os.path.relpath(root, source_dir), f)
                    zip_final.write(file_name, file_path)

    result_file = os.path.join(source_dir, zipped_gdb_file)

    return result_file

def file_rename(file_name, new_name):
    """rename an existed file and returns the absolute file path after change"""
    if not os.path.exists(file_name):
        arcpy.AddMessage('{} does not exist!'.format(file_name))
        raise Exception

    # Get the file base name
    base = os.path.basename(file_name)
    dirname = os.path.dirname(file_name)
    (base_name, extension) = os.path.splitext(base)

    # Replace the invalid characters from new_name with _
    newname = []

    for chr in new_name:
        if chr.isdigit() or chr.isalpha():
            newname.append(chr)
        else:
            newname.append('_')

    new_name = "".join(newname)

    os.rename(file_name, os.path.join(dirname, new_name + extension))
    return os.path.join(dirname, new_name + extension)

def exportTable(inputLayers, exportFormat, input_lyr_str):
    """To export the TableViews ahead of the ExtractData logic."""
    # Table view can only be dumped as .csv or table in a FGDB
    if exportFormat == 'SHAPEFILE' or exportFormat == 'KML':
        exportFormat = 'CSV'

    input_lyr_strs = input_lyr_str.split(";")
    new_lyr_strs = []

    newInputLayers = []
    tableViewOutputs = []

    numFeats = 0
    layersForCost = []

    for ii, (inputLyr, input_lyr_str) in enumerate(zip(inputLayers, input_lyr_strs)):
        if arcpy.Describe(inputLyr.name).dataType == 'TableView':
            output_loc = arcpy.env.scratchFolder  # pylint: disable=E1101

            tmpCount = int(arcpy.GetCount_management(inputLyr.name).getOutput(0))
            numFeats += tmpCount
            layersForCost.append({"count": tmpCount, "shapeType": ""})

            if exportFormat == 'FILEGEODATABASE':
                output_loc_unzipped_gdbs = os.path.join(output_loc, "out_gdbs")

                if not os.path.exists(output_loc_unzipped_gdbs):
                    os.mkdir(output_loc_unzipped_gdbs)

                if not arcpy.Exists(os.path.join(output_loc_unzipped_gdbs, 'TableView.gdb')):
                    arcpy.CreateFileGDB_management(output_loc_unzipped_gdbs, 'TableView.gdb')
                # inputLyr should always have layername since it must be a published table view service
                out_name = inputLyr.layername if inputLyr.layername.strip() != '' else 'table_{}'.format(ii + 1)

                arcpy.CopyRows_management(inputLyr.name, os.path.join(output_loc_unzipped_gdbs, 'TableView.gdb', 
                                          out_name))

                if not os.path.join(output_loc_unzipped_gdbs, 'TableView.gdb') in tableViewOutputs:
                    tableViewOutputs.append(os.path.join(output_loc_unzipped_gdbs, 'TableView.gdb'))

            elif exportFormat == 'CSV':
                output_loc_unzipped_csvs = os.path.join(output_loc, 'out_csvs')
                if not os.path.exists(output_loc_unzipped_csvs):
                    os.mkdir(output_loc_unzipped_csvs)

                out_name = inputLyr.layername if inputLyr.layername.strip() != '' else 'table_{}'.format(ii + 1)

                tableViewOutputs.append(
                    create_csv(inputLyr.name, os.path.join(output_loc_unzipped_csvs, out_name + '.csv')))

            else:
                raise Exception('Only support output format of CSV or FILEGEODATABASE')
        else:
            newInputLayers.append(inputLyr)
            new_lyr_strs.append(input_lyr_str)

    return newInputLayers, tableViewOutputs, numFeats, layersForCost, ";".join(new_lyr_strs)

def zipTableViewOutputs(result_file, tableViewOutputs, tvNumFeats, numFeats,
                        data_format, clip):
    numFeats += tvNumFeats

    # if tvLyrs4Cost:
    #     for lyr4cost in tvLyrs4Cost:
    #         layersForCost.append(lyr4cost)

    if data_format == 'FILEGEODATABASE' and clip:
        result_file = append_folder_zip(result_file, os.path.dirname(tableViewOutputs[0]))
        return result_file, numFeats

    #Inputs contain both feature service and table view service
    if result_file and tableViewOutputs:
        dirName = os.path.dirname(os.path.abspath(result_file))
        if result_file.endswith('.zip'):
            new_result_file = result_file
            write_mode = "a"
        else:
            fileDirName = os.path.dirname(os.path.abspath(result_file))
            fileBaseName = os.path.splitext(os.path.basename(os.path.abspath(result_file)))[0]
            new_result_file = os.path.join(fileDirName, fileBaseName + ".zip")
            write_mode = "w"

        with zipfile.ZipFile(new_result_file, write_mode, zipfile.ZIP_DEFLATED) as zip_final:
            if write_mode == 'w':
                zip_final.write(result_file, os.path.basename(result_file))

            for tOutput in tableViewOutputs:
                zip_final.write(tOutput, os.path.basename(tOutput))

        return new_result_file, numFeats

    # Inputs contain table view service only
    elif tableViewOutputs:
        timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())

        if len(tableViewOutputs) == 1 and tableViewOutputs[0].endswith('.csv'):
            fileBaseName = os.path.basename(tableViewOutputs[0])
            # name without extension
            fileBaseName = os.path.splitext(fileBaseName)[0]
            # Add timestamp to make it unique
            newPath = os.path.join(os.path.dirname(tableViewOutputs[0]), fileBaseName + timestamp + '.csv')
            os.rename(tableViewOutputs[0], newPath)
            return newPath, numFeats

        dirName = os.path.dirname(os.path.abspath(tableViewOutputs[0]))
        # One or more tables in one FGDB
        if tableViewOutputs[0].endswith('.gdb'):
            zipdir(tableViewOutputs[0], dirName, 'TableView_{}'.format(timestamp))
        # Multiple .csv files
        else:
            zipdir(dirName, dirName, 'TableView_{}'.format(timestamp))

        return os.path.join(dirName, 'TableView_{}.zip'.format(timestamp)), numFeats

    else:
        return result_file, numFeats


def get_extent_from_nonpolylayer(nonpoly_layername):
    """Create a polygon layer with the geometry as the extent of the non-polygon Extent layer.

    Args:
        nonpoly_layername: name of the non-polygon extent layer.
    Returns:
        name of the polygon layer with the geometry as the extent.

    """
    extent = arcpy.Describe(nonpoly_layername).extent
    extent_poly_path = arcpy.CreateUniqueName("{}_extent".format(nonpoly_layername), "in_memory")
    arcpy.CopyFeatures_management(extent.polygon, extent_poly_path)
    extent_lyr = arcpy.MakeFeatureLayer_management(extent_poly_path,
                                                   "{}_extent".format(nonpoly_layername)).getOutput(0)
    return extent_lyr.name


if __name__ == '__main__':
    import ast
    hostedgp = None
    startTime = time.time()
    inputlayers = ""

    try:
        hostedgp = agolgp.HostedGP(5, 4)

        # Check privilege
        if not hostedgp.CheckPrivilege(PRIVILEGE_CREATE_ITEM):
            aolutils.AddErrorCode(100118, "Your user role does not include the create, update, and delete content privilege.")
            raise Exception

        # Add the check ahead otherwise GetHostedLayers will raise a query error message that front-end can't catch.
        # context is always passed in from front-end even though the "use current map extent" is unchecked.
        env_extent = arcpy.env.extent
        if env_extent:
            if env_extent.XMin == env_extent.XMax or env_extent.YMin == env_extent.YMax:
                aolutils.AddErrorCode(100136, "Invalid extent for data extraction.")
                raise Exception

        beginTime = time.time()

        # No need to update the count for feature collection. The count if correct even for feature collection with
        # extract set as True.
        inputlayers = hostedgp.GetHostedLayers(0, True)
        input_lyr_str = arcpy.GetParameterAsText(0)

        _len = len

        output_loc = arcpy.env.scratchFolder  # pylint: disable=E1101

        errorCodes = [1115, 100024, 100049, 100050, 100051, 100052, 100136, 100140, 100141, 100206]

        aolutils.addRemoveToolboxes(True, "Workflows.tbx")

        startTime = aolutils.AddTimerMessage(startTime, "Get Input Layers")

        clip = arcpy.GetParameter(2)

        if clip:
            clipCost = 2
        else:
            clipCost = 1

        dataformat = arcpy.GetParameterAsText(3).upper()
        if not dataformat:
            dataformat = "FILEGEODATABASE"

        # if logic goes to createReplica, use createReplica to export tables so the attachment can be kept if there is
        # any.
        if dataformat == "FILEGEODATABASE" and not clip:
            tableViewOutputs = []
            tvNumFeats = 0
            tvLyrs4Cost = []
        else:
            inputlayers, tableViewOutputs, tvNumFeats, tvLyrs4Cost, new_input_lyr_str = exportTable(inputlayers,
                                                                                                    dataformat,
                                                                                                    input_lyr_str)

        try:
            extent = hostedgp.GetHostedLayer(1)
            extentname = extent.name
            extent_layername = extent.layername
        except Exception:
            extentname = ""
            extent_layername = ""

        startTime = aolutils.AddTimerMessage(startTime, "Get Extent Layer")

        arcpy.SetParameterAsText(6, "")

        if extentname and extent.shapeType != "esriGeometryPolygon":
            extentname = get_extent_from_nonpolylayer(extentname)
            # extent_layername is used for printing.
            extent_layername = extentname
        
        arcpy.AddMessage("extentname: {}".format(extentname))

        result_file = None
        numFeats = 0
        layersForCost = tvLyrs4Cost
        paramsDict = {"inputLayers": layersForCost, "clip": clip}
        layerCount = 0

        if len(inputlayers) > 0:
            if dataformat == "FILEGEODATABASE" and not clip:
                layer_name = []
                no_feats = []

                for input_layer in inputlayers:
                    if input_layer.count > 0:
                        if extentname:
                            if not arcpy.Describe(input_layer.name).dataType == 'TableView':
                                clip_layer = arcpy.CreateUniqueName("clip_layer",  # pylint: disable=E1101
                                                                    arcpy.env.scratchGDB)
                                arcpy.Clip_analysis(input_layer.name, extentname, clip_layer)
                                result = arcpy.GetCount_management(clip_layer)
                                layersForCost.append({"count": int(result[0]), "shapeType": input_layer.shapeType})
                            else:
                                layersForCost.append({"count": input_layer.count, "shapeType": "None"})
                        else:
                            if arcpy.Describe(input_layer.name).dataType == 'TableView':
                                shape_type = "None"
                            else:
                                shape_type = input_layer.shapeType
                            layersForCost.append({"count": input_layer.count, "shapeType": shape_type})

                        layer_name.append(input_layer.layername)
                    else:
                        aolutils.AddErrorCode(100024, "There are no features provided for analysis in {}.".format(input_layer.layername),
                                            {'inputLayers': input_layer.layername}, warning=True)
                if not layer_name:
                    aolutils.AddErrorCode(100049, "There are no features in the processing extent for any input layers.")
                    raise Exception
                else:
                    layers = ";".join(layer_name)
                    layerCount = _len(layer_name)
                # check credits balance
                # paramsDict = {"inputLayers": layersForCost, "clip": clip}
                paramsDict["inputLayers"] = layersForCost
                aolutils.checkForCredits(taskName, paramsDict)

                result_file, numFeats = extract_attachments(extentname, tableViewOutputs)
            else:
                arcpy.env.extent = None
                names = []
                no_feats = []
                no_layer_fields = []
                numFeats = 0
                for ii, inputLayer in enumerate(inputlayers):
                    if inputLayer.count > 0:
                        layer_name = "tmp_input_layer_%i" % ii
                        if _len(inputLayer.layername) > 0:
                            # Set the layer name with the layername property
                            layer_name = inputLayer.layername

                        Layer = arcpy.MakeFeatureLayer_management(inputLayer.name, layer_name).getOutput(0)
                        # if Layer.description == "":
                        #    Layer.description = Layer.name
                        if dataformat == 'CSV':
                            dsc = arcpy.Describe(layer_name)
                            omit_fields = [dsc.shapeFieldName, dsc.oidFieldName]
                            fields = [f.name for f in arcpy.ListFields(Layer) if f.name not in omit_fields]
                            if _len(fields) == 0:
                                no_layer_fields.append(Layer.name)
                            else:
                                numFeats += inputLayer.count
                                layersForCost.append({"count": inputLayer.count, "shapeType": inputLayer.shapeType})
                                names.append(Layer.name)
                                layerCount = layerCount + 1
                        else:
                            numFeats += inputLayer.count
                            layersForCost.append({"count": inputLayer.count, "shapeType": inputLayer.shapeType})
                            names.append(Layer.name)
                            layerCount = layerCount + 1
                    else:
                        no_feats.append(inputLayer.layername)

                if no_feats:
                    no_feat_layers = '; '.join(no_feats)
                    aolutils.AddErrorCode(100024, 'There are no features provided for analysis in {}.'.format(no_feat_layers),
                                                    {'inputLayers': no_feat_layers}, warning=True)

                if no_layer_fields:
                    no_fields_layer = '; '.join(no_layer_fields)
                    aolutils.AddErrorCode(100052, 'No fields exist for data extraction in the input Layer: {}'.format(no_fields_layer),
                                            {'inputLayers': no_fields_layer}, warning=True)

                if not names and not no_layer_fields:
                    aolutils.AddErrorCode(100049, 'There are no features in the processing extent for any input layers.')
                    raise Exception

                if not names and not no_feats:
                    aolutils.AddErrorCode(100050, 'No fields exist in the input Layers for data extraction.')
                    raise Exception

                if not names and no_feats and no_layer_fields:
                    aolutils.AddErrorCode(100051, 'No features in the processing extent for any input Layer and none of the input Layers have fields for data extraction.')
                    raise Exception

                layers = ";".join(names)

                # paramsDict = {"inputLayers": layersForCost, "clip": clip}
                paramsDict["inputLayers"] = layersForCost
                aolutils.checkForCredits(taskName, paramsDict)

                result = arcpy.gp.ExtractData_workflows(layers,
                                                        output_loc,
                                                        extentname,
                                                        clip,
                                                        dataformat)

                result_file = result.getOutput(0)

                startTime = aolutils.AddTimerMessage(startTime, "Rename zipped file.")

                if extentname and layersForCost:
                    layer_count = result.getOutput(1)                
                    if layer_count:                
                        for i, count in enumerate(layer_count.split(";")):
                            if "count" in layersForCost[i] and int(count) > 0:
                                layersForCost[i]["count"] = int(count)

        if len(tableViewOutputs) > 0:
            result_file, numFeats = zipTableViewOutputs(result_file, tableViewOutputs,
                                                        tvNumFeats, numFeats,
                                                        dataformat, clip)
            layerCount += len(tableViewOutputs)

            # If no feature service input and the output format is .shp or .kml, change it to .csv
            if len(inputlayers) == 0 and dataformat in ('SHAPEFILE', 'KML'):
                dataformat = 'CSV'

        # Check how long it will take for file renaming
        startTime = time.time()

        outputConfig = json.loads(hostedgp.outputName.json)
        try:
            outfileName = outputConfig['itemProperties']['title']
            result_file = file_rename(result_file, outfileName)
        except Exception as e:
            arcpy.AddMessage(u'Unable to rename the output {} to the user specified name, because {}' \
                             .format(result_file, str(e)))

        cost = numFeats * 0.001

        arcpy.AddMessage(u'Layer count: {}'.format(layerCount))
        # arcpy.AddMessage(u"Layers: {}".format(layers))
        arcpy.AddMessage(u"Output Location: {}".format(output_loc))
        arcpy.AddMessage(u"Extent: {}".format(extent_layername))
        arcpy.AddMessage(u"Clip: {}".format(clip))
        arcpy.AddMessage(u"Data format: {}".format(dataformat))
        arcpy.AddMessage(u"Cost: {}".format(cost))

        aolutils.AddExecuteWarnings(taskName, errorCodes)

        startTime = aolutils.AddTimerMessage(startTime, "Extract Data Tool")

        # Check if zip file or other (.kml or .csv)
        if dataformat == "FILEGEODATABASE":
            dataformat = "File Geodatabase"
        elif dataformat == 'CSV' and os.path.splitext(result_file)[1] == '.zip':
            dataformat = 'CSV Collection'
        elif dataformat == 'KML' and os.path.splitext(result_file)[1] == '.zip':
            dataformat = 'KML Collection'

        arcpy.AddMessage(u"Result File: {}".format(result_file))
        arcpy.AddMessage(u"Data format: {}".format(dataformat))

        contentID = hostedgp.ProcessFileOutput(dataformat, result_file)
        arcpy.SetParameterAsText(6, contentID)

        values = [layerCount, numFeats, clipCost]
        aolutils.LogUsageMetering(taskName, numFeats, cost, beginTime, values)

        # Report cost
        aolutils.reportParamsForCost(hostedgp, taskName, paramsDict)
        aolutils.addRemoveToolboxes(False, "Workflows.tbx")

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(taskName, errorCodes)

    except Exception as err:
        import traceback
        import sys
        msgs = traceback.format_exception(*sys.exc_info())[1:]
        for msg in msgs:
            arcpy.AddMessage(msg.strip())
        aolutils.AddExceptionError(taskName, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")
