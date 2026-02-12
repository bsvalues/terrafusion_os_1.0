import os
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from typing import List, Optional, Union
from urllib.parse import urljoin

import arcgis
import arcpy
import ips.GenerateIndoorPositioningDataset.utils_db as gipd_u_db
import ips.GenerateIndoorPositioningDataset.validation as gipd_v
import ips.GenerateIndoorPositioningFile.utils as gipf_u
import ips.GenerateIndoorPositioningFile.validation as gipf_v
import ips.ShareIndoorPositioningDataService.const as sipds_c
import ips.ShareIndoorPositioningDataService.flip_map as sipds_f
import ips.ShareIndoorPositioningDataService.validation as sipds_v
import ips.const as c
import ips.utils as u
import ips.utils_db as u_db
import ips.utils_io as u_io
import pandas as pd
import requests
from arcgis.auth._auth._negotiate import EsriHttpNegotiateAuth

M = c.MODEL_LATEST
FM = c.MODEL_FLIP_MAP_34
IFP = c.MODEL_FLIP_MAP_34.IPS_FINGERPRINT_POINTS
TPW = c.MODEL_FLIP_MAP_34.TRANSMITTER_POINT_WEIGHT
RTM = c.MODEL_FLIP_MAP_34.RADIO_TRANSMITTER_MODEL

# global progressor
progressor = u_io.Progressor(step_num=4)

# Mapping tool's Sharing Level labels to arcgis API's access
sharing_level_map = {
    "Owner": "private",
    "Organization": "org",
    "Everyone": "public"
}


def fetch_dataset_fingerprints(
        dataset_sdf: pd.DataFrame,
        point_sdf: pd.DataFrame,
        signal_df: pd.DataFrame) -> pd.DataFrame:
    """fetch dataset into one dataframe

    Args:
        dataset_sdf: Positioning Dataset spatial dataframe
        point_sdf: Positioning Point spatial dataframe
        signal_df: Positioning Signal dataframe

    Returns: fingerprint spatial dataframe

    """
    # merge points to datasets
    fingerprint_df = dataset_sdf.merge(point_sdf, left_on=c.GLOBAL_ID_FIELD_NAME,
                                       right_on=M.IPS_POSITIONING_POINTS.FIELDS.DATASET_GUID.name,
                                       suffixes=('_x', ''))
    fingerprint_df.drop(list(fingerprint_df.filter(regex='_x$')), axis=1, inplace=True)

    # merge signals to points and datasets
    fingerprint_df = fingerprint_df.merge(signal_df, left_on=c.GLOBAL_ID_FIELD_NAME,
                                          right_on=M.IPS_POSITIONING_SIGNALS.FIELDS.POINT_GUID.name,
                                          suffixes=('_x', ''))
    fingerprint_df.drop(list(fingerprint_df.filter(regex='_x$')), axis=1, inplace=True)

    return fingerprint_df


def is_dataset_shared():
    return


def create_zipped_gdb(gdb: str, zipped_gdb: str) -> str:
    """Creates a zipped file geodatabase and ignores any lock files.

    Args:
        gdb: path to the file geodatabase
        zipped_gdb: path to the zipped file geodatabase

    Notes:
        If gdb = 'PATH/gdbName.gdb' then the zipped_gdb = 'PATH/gdbName.gdb.zip/gdbName.gdb'

    Returns:
        The path to the zipped file geodatabase (=zipped_gdb input).

    """
    gdb_name = os.path.basename(gdb)
    with zipfile.ZipFile(zipped_gdb, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for foldername, _, filenames in os.walk(gdb):
            for filename in filenames:
                # avoid zipping any lock files (raises OSError)
                if not filename.endswith('.lock'):
                    file_path = os.path.join(foldername, filename)
                    zipf.write(filename=file_path,
                               arcname=os.path.join(gdb_name, os.path.relpath(file_path, gdb)))
    return zipped_gdb


def convert_flip_map_to_dataservice_schema(flip_map: dict,
                                           point_df: pd.DataFrame,
                                           tmp_dir: str) -> str:
    """Converts flip map dataset to Indoor Positioning Data Service items and saves them to a local temporary database.

    Args:
        flip_map: output produced by FLIP MAP legacy code
        point_df: IPS Positioning Points spatial dataframe, containing fingerprints from a specific IPS dataset
        tmp_dir: path to a temporary folder for storing IPS Data Service items locally

    Returns:
        tmp_gdb: file path to the temporary file geodatabase containing
            - IPS_Fingerprint_Points
            - Transmitter_Point_Weight
            - Radio_Transmitter_Model

    """
    # make sure that the output ips_fingerprint_points are in WGS84
    if point_df.spatial.sr.as_arcpy != c.WGS84_SR:
        point_df.spatial.project(spatial_reference=4326)

    # create temporary database to store FLIP MAP items before uploading to portal
    # the name of the database is random string, the same as the temporary folder
    out_name = os.path.basename(tmp_dir) + ".gdb"
    arcpy.CreateFileGDB_management(out_folder_path=tmp_dir, out_name=out_name)
    tmp_gdb = os.path.join(tmp_dir, out_name)

    # get the paths to the temporary feature class & tables
    arcpy.ImportXMLWorkspaceDocument_management(target_geodatabase=tmp_gdb, in_file=FM.XML_PATH)
    ips_fingerprint_points = os.path.join(tmp_gdb, IFP.NAME)
    transmitter_point_weight = os.path.join(tmp_gdb, TPW.NAME)
    radio_transmitter_model = os.path.join(tmp_gdb, RTM.NAME)

    # create field name dictionaries
    ips_fingerprint_points_dict = {k.name: k.name for k in IFP.FIELDS} | {"SHAPE": "SHAPE@"}
    transmitter_point_weight_dict = {k.name: k.name for k in TPW.FIELDS}
    radio_transmitter_model_dict = {k.name: k.name for k in RTM.FIELDS}

    # read the empty temporary feature class & tables
    radio_transmitter_model_df = u_db.tb2df(radio_transmitter_model, radio_transmitter_model_dict)

    # IPS Fingerprint Points calculations using IPS Positioning Points
    ips_fingerprint_points_df = point_df[[c.SHAPE_FIELD_NAME,
                                          c.GLOBAL_ID_FIELD_NAME,
                                          c.LEVEL_ID_FIELD_NAME,
                                          c.VERTICAL_ORDER]]
    ips_fingerprint_points_df.rename(columns={c.GLOBAL_ID_FIELD_NAME: IFP.FIELDS.POINT_GUID.name}, inplace=True)

    # we need to convert the SHAPE to arcpy because we do not yet have a sdf2fc_insert.
    # we use df2fc_insert instead that can work only with arcpy geoms
    ips_fingerprint_points_df[c.SHAPE_FIELD_NAME] = point_df.SHAPE.geom.as_arcpy
    # force POINT_GUID to be of type object not string (default)
    ips_fingerprint_points_df[IFP.FIELDS.POINT_GUID.name] = ips_fingerprint_points_df[
        IFP.FIELDS.POINT_GUID.name].astype(object)

    # Transmitter Point Weight calculations using the point_weight_list dataframes of FLIP Map
    # and rename the columns based on the xml schema definition
    transmitter_point_weight_df = pd.concat(flip_map["radiomap_essentials"][transmitter_id]["point_weight_list"] for
                                            transmitter_id in list(flip_map["radiomap_essentials"].keys())).rename(
        columns={"point_id": TPW.FIELDS.POINT_GUID.name,
                 "transmitter_id": TPW.FIELDS.TRANSMITTER_ID.name,
                 "weight": TPW.FIELDS.WEIGHT.name})

    # Radio Transmitter Model Tri-Linear calculations using the Flip Map's f_n_ps_param dictionaries
    for transmitter_id, i in zip(flip_map["radiomap_essentials"], range(len(flip_map["radiomap_essentials"]))):
        f = flip_map["radiomap_essentials"][transmitter_id]["f_n_ps_param"]
        tx_type = 0 if gipf_v.is_ibeacon(transmitter_id) else 1
        radio_transmitter_model_df.loc[i] = [
            transmitter_id,  # TRANSMITTER_ID
            tx_type,  # TRANSMITTER_TYPE
            f["low"]["min"], f["low"]["k"], f["low"]["d"],  # X_MIN, SLOPE_1, INTERCEPT_1
            f["med"]["min"], f["med"]["k"], f["med"]["d"],  # X_2, SLOPE_2, INTERCEPT_2
            f["hig"]["min"], f["hig"]["k"], f["hig"]["d"],  # X_3, SLOPE_3, INTERCEPT_3
            f["hig"]["max"]]  # X_MAX

    # write to the temp local feature class and tables
    u_db.df2fc_insert(ips_fingerprint_points_df, ips_fingerprint_points, ips_fingerprint_points_dict)
    u_db.df2fc_insert(radio_transmitter_model_df, radio_transmitter_model, radio_transmitter_model_dict)
    u_db.df2rel_insert(transmitter_point_weight_df, transmitter_point_weight, transmitter_point_weight_dict)

    return tmp_gdb


def publish_ips_dataservice(
        gdb: str,
        portal: arcgis.gis.GIS,
        title: str,
        summary: Optional[str],
        tags: Optional[Union[str, List[str]]],
        folder: Optional[str],
        metadata: Optional[str],
        sharing_level: str,
        group_sharing: Optional[List[str]],
        update_existing: bool = False) -> arcgis.gis.Item:
    """Publishes or updates an Indoor Positioning Data Service from the data contained in the file gdb.

    Notes:
        When updating an IPDS only the data, summary, tags & metadata are getting updated.
         The reason for this is that in case of updating an IPDS that the current user doesn't own, the folder and
         group sharing might not work, e.g. sharing with a group that the IPDS owner isn't part of.

    Args:
        gdb: path to the file geodatabase
        portal: the arcgis.gis.GIS object
        title: title of the feature service to be published
        summary: description of the feature service
        tags: tags of the feature service as comma separated values or list of strings
        folder: optional folder to publish the feature service
        metadata: optional xml file containing the metadata
        sharing_level: sharing level of the feature service [Owner, Organization, Everyone]
        group_sharing: comma separated group names to share the Web Feature Layer with
                       Available only if the sharing level is Owner
        update_existing: optional boolean to update an existing Indoor Positioning Data Service

    Returns:
        The arcgis gis Item published.

    """
    # create a zip folder containing the file gdb (.../gdbName.gdb.zip/gdbName.gdb)
    zipped_gdb = create_zipped_gdb(gdb, os.path.join(os.path.dirname(gdb), os.path.basename(gdb) + ".zip"))

    # temporarily upload the zipped file GDB to the portal from which the wfl will be created
    zipped_gdb_item = portal.content.add(
        data=zipped_gdb,
        item_properties={
            "type": "File Geodatabase",
            "title": title,
            # The file geodatabase is shared with no one
            "access": "private"
        },
        thumbnail=c.IPDS_THUMBNAIL
    )
    # create a Web Feature Layer by publishing the feature service definition
    published_item = zipped_gdb_item.publish(overwrite=update_existing)

    # delete the zipped gdb portal item, we don't need it anymore
    zipped_gdb_item.delete(permanent=True)

    # add the IPS type keyword, tags and description
    # providerSDS: enables the Data Source options in the item's settings page for Enterprise Portals
    published_item.update(metadata=metadata,
                          item_properties={"typeKeywords": ["IndoorPositioningDataService", "Metadata", "providerSDS"],
                                           "tags": tags,  # comma separated values
                                           "description": summary})

    # folder and sharing level properties are set only when sharing the IPDS for the first time
    if not update_existing:
        # if a folder is given, move the web feature layer inside it
        if folder:
            published_item.move(folder=folder)

        organization = sharing_level == sipds_c.SHARING_LEVEL_ORGANIZATION
        everyone = sharing_level == sipds_c.SHARING_LEVEL_EVERYONE

        if group_sharing:
            # create a list of arcgis.gis.Group items and use it to share the published web feature layer
            groups = [arcgis.gis.GroupManager(portal).search(query=group_name)[0] for group_name in group_sharing]
            allow_members_to_edit = True
        else:
            groups = None
            allow_members_to_edit = False

        # share the published item with owner / organization / everyone and groups.
        # group sharing works only if allow_members_to_edit is set to True
        published_item.share(org=organization, everyone=everyone, groups=groups,
                             allow_members_to_edit=allow_members_to_edit)

    return published_item


def share_ips_dataservice(
        in_ips_datasets: str,
        ips_dataset_name: str,
        title: str,
        summary: str = None,
        tags: Union[List[str], str] = None,
        folder: str = None,
        sharing_level: str = sipds_c.SHARING_LEVEL_OWNER,
        group_sharing: List[str] = None,
        update_existing: bool = False,
):
    """

    Args:
        in_ips_datasets: the location of indoor positioning datasets
        ips_dataset_name: dataset name
        title: title for the data service
        summary: optional summary (description) for the data service
        tags: optional tags for the data service. Either a list of tags, or a string with comma separated values
        folder: optional folder that contains the data service
        sharing_level: share as "Owner", "Organization" or "Everyone". Defaults to "Owner"
        group_sharing: optional share with groups. A list of strings with the group names
        update_existing: optional boolean to update an existing Indoor Positioning Data Service

    Returns:
        out_positioning_item_id: the Indoor Positioning Data Service Item ID
        out_positioning_item_url: the Indoor Positioning Data Service Item URL

    """
    global progressor

    datasets_path, points_path, signals_path = gipd_u_db.find_related_positioning_tables(
        positioning_datasets_path=in_ips_datasets)

    gipd_v.validate_related_tables(positioning_points=points_path, positioning_signals=signals_path)

    dataset_sdf, point_sdf, signal_df = u_io.read_positioning_dataset(datasets_path=datasets_path,
                                                                      points_path=points_path,
                                                                      signals_path=signals_path,
                                                                      ips_dataset_name=ips_dataset_name)

    # check first that the inputs are not empty, otherwise we can't create a positioning data service
    if point_sdf.empty:
        raise gipd_v.EmptyPositioningDataset(param_name=os.path.basename(points_path))

    if signal_df.empty:
        raise gipd_v.EmptyPositioningDataset(param_name=os.path.basename(signals_path))

    sipds_v.validate_ips_dataservice_guid(title, ips_dataset_name, dataset_sdf)

    # TODO: validate that dfs are not empty
    fingerprint_sdf = fetch_dataset_fingerprints(dataset_sdf=dataset_sdf, point_sdf=point_sdf, signal_df=signal_df)

    flip_map_dataset = sipds_f.generate_vflip_map(fpp_stats=fingerprint_sdf)

    tempfile.TemporaryDirectory.cleanup = gipf_u.cleanup_patch
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_gdb = convert_flip_map_to_dataservice_schema(flip_map=flip_map_dataset,
                                                         point_df=point_sdf,
                                                         tmp_dir=tmp_dir)

        metadata = create_guid_metadata_xml(out_file=os.path.join(tmp_dir, "metadata.xml"),
                                            guid=dataset_sdf[c.GLOBAL_ID_FIELD_NAME][0])
        new_item = publish_ips_dataservice(
            gdb=tmp_gdb,
            portal=u.create_gis_connect(),
            title=title,
            summary=summary,
            tags=tags,
            folder=folder,
            metadata=metadata,
            sharing_level=sharing_level,
            group_sharing=group_sharing,
            update_existing=update_existing)

        arcpy.AddIDMessage('INFORMATIVE', 250100, title, new_item.id)

    return new_item.id, new_item.homepage


def get_portal_user_folders(portal_url: str, username: str) -> Optional[List[str]]:
    """Retrieves the folders of the given user on the given portal

    Args:
        portal_url: url of the portal
        username: username of the user

    Returns:
        list of folder names

    """
    if portal_url == "" or username == "":
        return []
    token = arcpy.GetSigninToken()

    if token is None:
        return []

    user_content_url = urljoin(portal_url, f'sharing/rest/content/users/{username}')
    params = {'start': 1, 'num': 1, 'f': 'json', 'token': token['token']}
    response = requests.post(
        user_content_url,
        params=params,
        verify=False,
        auth=EsriHttpNegotiateAuth()
    )
    user_content_json = response.json()
    return [folder['title'] for folder in user_content_json['folders']]


def get_user_privileges(portal_url: str) -> Optional[List[str]]:
    """Retrieves the privileges of the given user on the given portal

    Args:
        portal_url: url of the portal

    Returns:
        list of privileges

    """
    if portal_url == "":
        return []

    token = arcpy.GetSigninToken()
    if token is None:
        return []

    # validate user privilege
    params = {
        'f': 'json',
        'token': token['token']
    }

    user_data_url = urljoin(portal_url, 'sharing/rest/community/self')
    response = requests.post(
        user_data_url,
        params=params,
        verify=False,
        auth=EsriHttpNegotiateAuth()
    )
    response_json = response.json()
    return response_json["privileges"]


def get_portal_groups(portal_url: str) -> Optional[List[str]]:
    """Retrieves the groups that the current user belongs to in the given portal

    Args:
        portal_url: url of the portal

    Returns:
        list of group names
    """
    token = arcpy.GetSigninToken()

    if token is None:
        return []

    user_info_url = urljoin(portal_url, f'sharing/rest/community/self')
    params = {'f': 'json', 'token': token['token']}
    response = requests.post(
        user_info_url,
        params=params,
        verify=False,
        auth=EsriHttpNegotiateAuth()
    )
    user_info_json = response.json()
    return [group['title'] for group in user_info_json['groups']]


def get_portal_username(portal_url: str) -> Optional[str]:
    """Gets the username of the current user on the given portal

    Args:
        portal_url: url of the portal

    Returns:
        current user's username
    """
    if portal_url == "" or portal_url is None:
        return None
    username = None
    portal_desc = arcpy.GetPortalDescription(portal_url)
    if 'user' in portal_desc:
        username = portal_desc['user']['username']
    return username


def get_portal_existing_ipds() -> List[str]:
    """Queries the portal for all the existing Indoor Positioning Data Services and returns their names in a list.

    Returns:
        A list of names of the existing Indoor Positioning Data Services.
    """
    portal = u.create_gis_connect()
    token = arcpy.GetSigninToken()
    if token is None:
        return []

    sign_in_token = token['token']
    # validate user privilege
    params = {
        'f': 'json',
        'token': sign_in_token,
        'num': 100
    }

    # SIPDS-Update uses publish(overwrite=True) which is permitted only for feature services owned by the user
    title_filter_url = urljoin(portal.url,
                               f'sharing/rest/search?filter=owner:{portal.users.me.username} AND '
                               f'typeKeywords:"IndoorPositioningDataService"'
                               'AND type:"Feature Service"')

    existing_service_names = []
    while True:
        response = requests.post(
            title_filter_url,
            params=params,
            verify=False,
            auth=EsriHttpNegotiateAuth())

        if not response.json()["results"]:
            break

        existing_service_names += [r['title'] for r in response.json()["results"]]

        if response.json()["nextStart"] > 0:
            params["start"] = response.json()["nextStart"]
        else:
            break

    return sorted(existing_service_names, key=lambda s: s.lower())


def create_guid_metadata_xml(guid: str,
                             out_file: str) -> str:
    """Creates a xml file with metadata with only property the GUID.

    Args:
        guid: the global id value
        out_file: the absolute file path of the output xml file

    Returns:
        The absolute file path of the xml file.

    """
    root = ET.Element(c.IPDS_METADATA_XML_TAG)
    # Set the attribute for the property element
    root.text = guid
    # Create the XML tree
    tree = ET.ElementTree(root)

    # Write the XML tree to a file
    tree.write(out_file)

    return out_file
