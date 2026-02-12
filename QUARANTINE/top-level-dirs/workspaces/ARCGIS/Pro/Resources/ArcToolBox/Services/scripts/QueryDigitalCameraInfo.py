"""-----------------------------------------------------------------------------
Name:              QueryDigitalCameraInfo.py
Purpose:           Load digital camera database to JSON
Author:            Esri Inc.
Created:           3/2/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import datetime
import os
import tempfile
import shutil
import json
import pandas as pd

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'QueryDigitalCameraInfo'


def _read_cameras_list():
    """
    Read the cameras list from the camera database.
    Note: support rigs through camera manager command.
    @return: the camera database csv file path in scratch folder
    """
    try:
        # Open DigitalCamera.dat
        installdir = arcpy.GetInstallInfo()["InstallDir"]
        cameras_file = os.path.join(installdir, "bin/DigitalCameras.dat")
        arcpy.AddMessage("Loading Cameras database...")
        # arcpy.AddMessage("Loading Cameras database: {}".format(cameras_file))

        with open(cameras_file) as cameras_f:
            camera_db_json = json.load(cameras_f)

        if camera_db_json:
            if "cameras" in camera_db_json:
                cameras_list = camera_db_json["cameras"]
                return cameras_list

        return None
    except Exception as err:
        return None


def _convert_cameradb_to_csv():
    """
    Convert the camera database file in JSON format to csv table for SQL search.
    Note: support rigs through camera manager command.
    @return: the camera database csv file path in scratch folder
    """
    try:
        # Define cameras list
        cameras_list = _read_cameras_list()

        if cameras_list and isinstance(cameras_list, list):
            cameras_csv = "cdb_" + str(datetime.datetime.now().strftime("%Y%m%d%H%M%S")) + ".csv"
            scratch_fld = arcpy.env.scratchFolder
            cameras_csv = os.path.join(scratch_fld, cameras_csv)

            cameras_df = pd.DataFrame(cameras_list)
            cameras_df.to_csv(cameras_csv, index_label="OID")

            return cameras_csv

        return None
    except Exception as err:
        return None


def _convert_camera_info(camera_info_str):
    """
    Convert the camera info JSON to output format {"schema": ..., "content": ...}
    @param camera_info_str:
    @return:
    """
    try:
        dbjson = {}
        camera_info_json = json.loads(camera_info_str)
        if camera_info_json:
            # possible to have list of cameras returned
            if isinstance(camera_info_json, list):
                cameras_df = pd.DataFrame(camera_info_json)
                dbjson["schema"] = list(cameras_df.columns)
                dbjson["content"] = cameras_df.values.tolist()
                dbjson["camera_info"] = camera_info_json
            elif isinstance(camera_info_json, dict):
                dbjson["schema"] = list(camera_info_json.keys())
                dbjson["content"] = list(camera_info_json.values())
                dbjson["camera_info"] = camera_info_json

        return dbjson
    except Exception as err:
        return None


if __name__ == '__main__':
    """
    This service tool allows user to give an optional query filter to find specific 
    """
    inquery = arcpy.GetParameterAsText(0)
    # arcpy.AddMessage(inquery)

    # 0. Check Image Server extension license
    rasterutils.checkImageExtension(taskName=TASK_NAME)

    # 1. Parse inquery parameter
    is_json_inquery = False
    try:
        inquery = json.loads(inquery)
        is_json_inquery = True
    except Exception as err:
        pass

    try:
        # 2. Return the camera info in the format of {"schema": ..., "content": ...}
        dbjson = {}

        # If inquery is a JSON, use the camera manager method right away
        if is_json_inquery:
            arcpy.AddMessage("Query input is JSON.")
            command_str = "QueryCameraInfo \'" + json.dumps(inquery) + "\'"
            # arcpy.AddMessage(command_str)
            # Invoke camera manager wrapper to search for matching camera
            camerainfo = arcpy.gp.command(command_str)
            # arcpy.AddMessage(camerainfo)
            dbjson = _convert_camera_info(camerainfo)
            if not dbjson:
                arcpy.AddWarning("Cannot find matching camera information.")
        # If inquery string exists but not a JSON, it could be the SQL query. Deprecating this approach.
        elif inquery:
            cameras_csv_file = _convert_cameradb_to_csv()

            # List the fields names
            schema = [fld.name for fld in arcpy.ListFields(cameras_csv_file)]
            typedb = []
            with arcpy.da.SearchCursor(cameras_csv_file, schema, inquery) as cur:
                for row in cur:
                    typedb.append(row)

            dbjson["schema"] = schema
            dbjson["content"] = typedb
            arcpy.AddMessage("Camera Info JSON: {}".format(json.dumps(dbjson)))
        else:
            # Return the entire database to JSON
            cameras_list = _read_cameras_list()
            # arcpy.AddMessage(cameras_list)
            if cameras_list and isinstance(cameras_list, list):
                cameras_df = pd.DataFrame(cameras_list)
                dbjson["schema"] = list(cameras_df.columns)
                dbjson["content"] = cameras_df.values.tolist()
                dbjson["camera_info"] = cameras_list
                arcpy.AddMessage("Camera Info JSON: {}".format(json.dumps(dbjson)))
            else:
                arcpy.AddError("Cannot read the digital camera database.")

        arcpy.SetParameter(1, json.dumps(dbjson))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))
    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))
    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
