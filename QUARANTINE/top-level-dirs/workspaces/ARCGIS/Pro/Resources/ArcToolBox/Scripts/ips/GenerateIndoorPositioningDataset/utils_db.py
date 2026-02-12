import os
from datetime import datetime
from typing import Tuple, Iterable, Dict, Optional

import arcgis
import arcpy
import indoorsdatapy.common.const.network_type as type
import ips.const as c
import ips.utils as u
import ips.utils_db as u_db
import ips.validation as v
import pandas as pd
import requests
from arcgis.auth._auth._negotiate import EsriHttpNegotiateAuth
from arcgis.geometry import Polygon
from arcpy._mp import Layer


def oids2guids(table_path: str,
               oid_field: str = None,
               guid_field: str = None,
               oid_filter: Iterable[int] = None) -> Dict[int, str]:
    """Returns a mapping OID -> GlobalID

    Args:
        table_path: table or feature class
        oid_field: OID field, if None is automatically detected
        guid_field: GlobalID field, if None is automatically detected
        oid_filter: optional list of OIDs for which the map will be created

    Returns: a dictionary [OID, GlobalID]

    """
    if oid_field is None or guid_field is None:
        table_desc = arcpy.Describe(table_path)
        oid_field = table_desc.OIDFieldName
        guid_field = table_desc.GlobalIDFieldName

    # retrieve the global_id of the last-inserted row
    if oid_filter is None:
        where_clause = None
    elif len(oid_filter) == 1:
        where_clause = f'{oid_field} = {oid_filter[0]}'
    else:
        # use multiple in-clauses to get around Oracle DB error
        # https://stackoverflow.com/questions/17842453/is-there-a-workaround-for-ora-01795-maximum-number-of-expressions-in-a-list-is
        lists = u_db.split_list(list(oid_filter))
        where_clause = f'{oid_field} IN ' + f" OR {oid_field} IN ".join(str(tuple(lst)) for lst in lists)

    return {row[0]: row[1] for row in arcpy.da.SearchCursor(
        in_table=table_path,
        field_names=[oid_field, guid_field],
        where_clause=where_clause)}


def save_positioning_dataset(
        fingerprint_sdf_wgs84: pd.DataFrame,
        dataset_name: str,
        dataset_geom: Polygon,
        positioning_datasets_path: str,
        positioning_points_path: str,
        positioning_signals_path: str) -> None:
    """saves a fingerprint dataframe into an Indoor Positioning Dataset

    Args:
        fingerprint_sdf_wgs84: fingerprints
        dataset_name: dataset name
        dataset_geom: geometry of the dataset
        positioning_datasets_path: path to the Indoor Positioning Datasets FC
        positioning_points_path: path to the Indoor Positioning Points FC
        positioning_signals_path: path to the Indoor Positioning Signals Table

    Raises:
        any_error: in case an exception occurs during arcpy Editing operations
        v.NonEditableFeatureServiceError: when the Indoor Positioning Dataset is a feature service not editable by
                                          the current user

    Returns:

    """
    if v.is_feature_service(positioning_datasets_path):
        feature_service_url = u_db.valid_url(arcpy.Describe(positioning_datasets_path).catalogPath)
        gis = u.create_gis_connect()
        layer = arcgis.features.FeatureLayer(feature_service_url, gis=gis)
        # raise error if the feature layer can't be edited by logged-in user
        v.is_feature_service_editable_by_user(gis=gis, layer=layer)

    # the fingerprint dataframe MUST contain the column GENERATION_METHOD already filled out. This tells us if
    # each signal in the dataframe was generated survey-based or survey-less. Here we compute the generation method
    # value for the full dataset.
    generation_methods = fingerprint_sdf_wgs84[
        c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name].unique().tolist()
    if len(generation_methods) == 1:
        # there is only one value in the generation method column, so the same value is to be saved for the dataset
        generation_m = generation_methods[0]
    else:
        # there is more than one unique value in the column, meaning that this dataset
        # consists of a mixed generation method
        generation_m = 2  # MIXED
    # get the workspace
    ws = u_db.get_workspace(positioning_datasets_path)

    # raise error if the target workspace (gdb) has pending edits
    if arcpy.IsBeingEdited(ws):
        raise v.PendingEditsError

    # get relevant info about the target datasets FC
    datasets_desc = arcpy.Describe(positioning_datasets_path)

    # reproject the fingerprints to the target spatial reference
    fingerprint_sdf_wgs84.spatial.project(spatial_reference=datasets_desc.spatialReference.factoryCode)

    # create a unique point_id column based on unique values of the triplet (x, y, vertical_order)
    if 'point_id' in fingerprint_sdf_wgs84.columns:
        fingerprint_sdf_wgs84 = fingerprint_sdf_wgs84.drop(columns='point_id')
    fingerprint_sdf_wgs84.insert(
        loc=0, column='point_id',
        value=fingerprint_sdf_wgs84.set_index(['x', 'y', 'vertical_order']).index.factorize()[0] + 1)

    # drop the transmitter_type prefix (5_ for BLE, 0_ for WIFI) from the transmitter_id and
    # convert to MAC address
    fingerprint_sdf_wgs84['transmitter_id'] = fingerprint_sdf_wgs84[['transmitter_id', 'transmitter_type']].apply(
        lambda r: u_db.resolve_transmitter_id(r['transmitter_id'], r['transmitter_type']), axis=1)

    # do fingerprints contain BLE/WIFI?
    radio_types = fingerprint_sdf_wgs84.transmitter_type.unique()
    ble = type.IBEACON in radio_types
    wifi = type.WLAN in radio_types

    # insertion must be done within an "edit" context
    edit = arcpy.da.Editor(ws)
    edit.startEditing(False, False)
    edit.startOperation()

    # TODO: the following operations for Points & Signals are VERY SLOW in case of feature services, we have to find
    #  if there is an option for doing batch InsertCursor operations
    try:
        with arcpy.da.InsertCursor(
                # we use the catalogPath of the positioning_datasets_path to dishonor any row selection
                in_table=datasets_desc.catalogPath,
                field_names=[c.MODEL_LATEST.IPS_POSITIONING_DATASETS.FIELDS.DATASET_NAME.name,
                             c.MODEL_LATEST.IPS_POSITIONING_DATASETS.FIELDS.DATE_CREATED.name,
                             c.MODEL_LATEST.IPS_POSITIONING_DATASETS.FIELDS.GENERATION_METHOD.name,
                             c.MODEL_LATEST.IPS_POSITIONING_DATASETS.FIELDS.BLUETOOTH.name,
                             c.MODEL_LATEST.IPS_POSITIONING_DATASETS.FIELDS.WIFI.name,
                             c.MODEL_LATEST.IPS_POSITIONING_DATASETS.FIELDS.NOTES.name,
                             'SHAPE@',
                             ]
        ) as dataset_cursor:
            dataset_oid = dataset_cursor.insertRow([
                dataset_name,
                datetime.now(),
                generation_m,
                ble,
                wifi,
                None,
                dataset_geom.as_arcpy])

        # retrieve the Global ID of the row we just inserted
        dataset_guid = oids2guids(table_path=positioning_datasets_path,
                                  oid_filter=[dataset_oid])[dataset_oid]

        point_oids = []
        point_id2oid = {}  # here we will store a map point_id (as in the df) -> point_OID (as in the FC)
        with arcpy.da.InsertCursor(
                in_table=positioning_points_path,
                field_names=[c.MODEL_LATEST.IPS_POSITIONING_POINTS.FIELDS.DATASET_GUID.name,
                             c.MODEL_LATEST.IPS_POSITIONING_POINTS.FIELDS.DATASET_NAME.name,
                             c.MODEL_LATEST.IPS_POSITIONING_POINTS.FIELDS.LEVEL_ID.name,
                             c.MODEL_LATEST.IPS_POSITIONING_POINTS.FIELDS.VERTICAL_ORDER.name,
                             'SHAPE@']
        ) as point_cursor:
            for pid, signal_df in fingerprint_sdf_wgs84.groupby('point_id'):
                geom = signal_df.iloc[0]['SHAPE']
                vo = signal_df.iloc[0]['vertical_order']
                level_id = signal_df.iloc[0][c.LEVEL_ID_FIELD_NAME]
                point_oid = point_cursor.insertRow([dataset_guid,
                                                    dataset_name,
                                                    level_id,
                                                    int(vo),
                                                    arcpy.Point(geom.x, geom.y, signal_df.iloc[0][c.Z_VALUE]) ])
                point_oids.append(point_oid)
                point_id2oid[pid] = point_oid

        # get a mapping OID->GUIDs
        point_oids2guids = oids2guids(table_path=positioning_points_path, oid_filter=point_oids)
        # create a direct map point_id (as in the df) -> point_GUID (as in the FC)
        point_id2guids = {pid: point_oids2guids[oid] for pid, oid in point_id2oid.items()}

        with arcpy.da.InsertCursor(
                in_table=positioning_signals_path,
                field_names=[
                    c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.POINT_GUID.name,
                    c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.DATASET_NAME.name,
                    c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_ID.name,
                    c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.TRANSMITTER_TYPE.name,
                    c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.RSSI_MEAN.name,
                    c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name]) as signal_cursor:
            for i, fingerprint in fingerprint_sdf_wgs84.iterrows():
                point_guid = point_id2guids[fingerprint.point_id]
                signal_cursor.insertRow([
                    point_guid,
                    dataset_name,
                    fingerprint.transmitter_id,
                    int(0 if fingerprint.transmitter_type == type.IBEACON else 1),
                    fingerprint.rssi_mean,
                    fingerprint[c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.FIELDS.GENERATION_METHOD.name]])
        edit.stopOperation()

        # Stop the edit session and save the changes
        edit.stopEditing(True)
    except Exception as any_error:
        # an error occurred: stop operation, don't commit changes
        edit.abortOperation()
        edit.stopEditing(False)
        if isinstance(any_error, RuntimeError) and '400' in any_error.args[0]:
            # TODO: this is how we encoded the duplicated dataset name error as a attribute rule -> raise
            #  the appropriate error (we still do not have it). Note that I am not sure if attribute rules
            #  are exported to web layers. It might be more secure to explicitly check for duplicate dataset
            #  name before trying to insert
            pass
        raise any_error


def find_related_de(orig_de: str, related_xml_schema: str, related_xml_name: str) -> Optional[str]:
    """Finds a data element with given name and schema related
    to the given origin data element through a relationship

    Args:
        orig_de: origin data element
        related_xml_schema: xml schema of the related data element
        related_xml_name: name of the related data element

    Returns:
        The path of the related data element, if found.

    """
    orig_desc = arcpy.Describe(orig_de)
    ws = orig_desc.workspace.catalogPath
    relate_de = None
    if ws.startswith('http'):
        # for web feature services we can't get the arcpy.Describe object of relationships,
        # relationships are not exposed in the web feature layers by design.
        # by describing workspace instead does not working for "referencing registered data" web feature layer
        # rely on rest end API to pull relationships
        token = arcpy.GetSigninToken()
        if token is None:
            return []
        params = {'f': 'json', 'token': token['token']}
        response = requests.post(orig_de, params=params, verify=False, auth=EsriHttpNegotiateAuth())
        orig_desc_json = response.json()
        if orig_desc_json["relationships"] and len(orig_desc_json["relationships"]) > 0:
            for rel_name in orig_desc_json["relationships"]:
                related_id = rel_name["relatedTableId"]
                dest_de = u_db.valid_url(os.path.join(ws, str(related_id)))

                # NOTE: check schema to identify the correct relationship feature class
                if v.check_schema(data_element=dest_de,
                                  xml_schema_path=related_xml_schema,
                                  xml_element_name=related_xml_name,
                                  field_attr_filter=['name', 'type']):
                    relate_de = dest_de
                    break
    else:
        for rel_name in orig_desc.relationshipClassNames:
            rel = os.path.join(ws, rel_name)
            rel_desc = arcpy.Describe(rel)
            dest_de = os.path.join(ws, rel_desc.destinationClassNames[0])

            if v.check_schema(data_element=dest_de,
                              xml_schema_path=related_xml_schema,
                              xml_element_name=related_xml_name,
                              field_attr_filter=['name', 'type']):
                relate_de = dest_de
                break
    return relate_de


def find_related_positioning_tables(positioning_datasets_path: Layer or str) -> Tuple[str, str, str]:
    """Follow the relationships to the given positioning datasets FC to find
    positioning dataset points and signals tables

    Args:
        positioning_datasets_path: positioning datasets layer or FC database path

    Returns: paths to positioning datasets, positioning points, positioning signals

    """
    datasets_fc, points_fc, signals_tab = None, None, None
    datasets_desc = arcpy.Describe(positioning_datasets_path)
    datasets_fc = datasets_desc.catalogPath

    points_fc = find_related_de(datasets_fc, c.MODEL_LATEST.XML_PATH, c.MODEL_LATEST.IPS_POSITIONING_POINTS.NAME)

    if points_fc:
        signals_tab = find_related_de(points_fc, c.MODEL_LATEST.XML_PATH, c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.NAME)
    return datasets_fc, points_fc, signals_tab


def add_layer_to_map(dataset_name, positioning_points_path, positioning_datasets_path, positioning_signals_path):
    """
    Adds the output generated to an active map if it exits, or to a new map if no map is open. This works only within
    Pro
    Args:
        dataset_name: dataset name
        positioning_points_path:  path to the Indoor Positioning Points FC
        positioning_datasets_path: path to the Indoor Positioning Datasets FC
        positioning_signals_path: path to the Indoor Positioning Signals Table

    Returns:

    """
    try:
        if not v.is_ArcGIS_Pro():
            return
        aprx = arcpy.mp.ArcGISProject("CURRENT")
        # Check if project is open/exists
        if aprx:
            map = aprx.activeMap
            # If Map is not open or active
            if not map:
                map = aprx.createMap()
                map.openView()
            map_frame = aprx.activeView
            group_layer = map.createGroupLayer(dataset_name + '_Dataset')
            where_clause = " {0}  = '{1}'".format(c.MODEL_LATEST.IPS_POSITIONING_DATASETS.FIELDS.DATASET_NAME.name,
                                                  dataset_name)
            # Make a layer from the feature class
            tempLayer = arcpy.management.MakeFeatureLayer(positioning_points_path,
                                                          dataset_name + '_Points',
                                                          where_clause)
            map.addLayerToGroup(group_layer, tempLayer[0])

            tempLayer = arcpy.management.MakeFeatureLayer(positioning_datasets_path,
                                                          dataset_name + '_Extent',
                                                          where_clause)
            # Logic to change the symbology of the extent to dotted lines
            temp_symbology = tempLayer[0].symbology
            new_symbol = temp_symbology.renderer.symbol.listSymbolsFromGallery('dash')[0]
            temp_symbology.renderer.symbol = new_symbol
            tempLayer[0].symbology = temp_symbology
            map.addLayerToGroup(group_layer, tempLayer[0])

            tempLayer = arcpy.management.MakeTableView(positioning_signals_path,
                                                       dataset_name + '_Signals',
                                                       where_clause)
            map.addTableToGroup(group_layer, tempLayer[0])
            # Zoom to the results layer
            map_frame.camera.setExtent(map_frame.getLayerExtent(group_layer, False, True))
    except:
        pass
    return
