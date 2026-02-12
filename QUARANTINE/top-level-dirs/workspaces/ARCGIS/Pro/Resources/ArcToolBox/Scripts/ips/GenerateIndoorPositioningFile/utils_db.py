import datetime
import os
import shutil

import arcgis
import arcpy
import indoorsdatapy.common.const.network_type as type
import indoorssql.core.sql_base as indoor_sql
import indoorssql.model.idm as indoor_idm
import ips.const as c
import ips.utils as u
import ips.utils_db as u_db
import ips.validation as v
import pandas as pd


def insert_building_db_in_table(building_db_path,
                                positioning_table,
                                site_id=None,
                                comment=None,
                                ble=1,
                                wifi=0):
    """Adds a new row to the target positioning table and attaches the legacy
        db to such row

        Args:
            building_db_path: path to the legacy db file
            positioning_table: target positioning table
            site_id: SITE_ID of the processed data
            ble: is a ble positioning file? 0 equals False, 1 True
            wifi: is a wifi positioning file? 0 equals False, 1 True
            comment: comment for the new row

        Returns:

        """

    if v.is_feature_service(gp_parameter=positioning_table):
        attach_to_feature_service(
            positioning_table,
            file_path=building_db_path,
            site_id=site_id,
            comment=comment,
            ble=ble,
            wifi=wifi)
    else:

        table_desc = arcpy.Describe(positioning_table)
        # I will use OID as a matching field
        oid_field = table_desc.OIDFieldName
        global_id_field = table_desc.GlobalIDFieldName

        field_names = u.create_field_name_dict(
            data_element=positioning_table,
            xml_schema_path=c.MODEL_30.XML_PATH,
            xml_element_name=c.MODEL_30.IPS_POSITIONING.NAME,
            is_in_dataset=False
        )
        table_path = table_desc.catalogPath

        # The workspace where the positioning table is stored
        ws = os.path.dirname(table_desc.catalogPath)

        # we will create an in-memory matching table to
        # match attachments to table rows
        match_table_name = 'match_tab'
        match_id_field = 'match_id'
        attachment_path_field = 'attachment_path'

        # check that there exist an attachment table for the positioning table,
        # if not, raise a detailed error about which table is missing
        attachment_props = u_db.get_attachment_table(table_path)
        if attachment_props is None:
            raise v.AttachmentTableError(table=table_path)

        # make sure in-memory workspace is clean
        if arcpy.Exists(f'memory/{match_table_name}'):
            arcpy.Delete_management(f'memory/{match_table_name}')

        # create the match_table
        match_table = arcpy.CreateTable_management('memory', match_table_name)

        # add the necessary fields
        arcpy.AddField_management(match_table, match_id_field, "Text")
        arcpy.AddField_management(match_table, attachment_path_field, "Text")

        # now we will add a new row to the positioning table
        # and create an entry in the match_table to be used
        # later on to add the file attachment

        # raise error if the target workspace (gdb) has pending edits
        if arcpy.IsBeingEdited(ws):
            raise v.PendingEditsError

        # insertion must be done within an "edit" context
        edit = arcpy.da.Editor(ws)
        edit.startEditing(False, False)
        edit.startOperation()

        try:
            # we use the table_path (=catalogPath of the positioning_table to dishonor any row selection)
            with arcpy.da.InsertCursor(in_table=table_path,
                                       field_names=[
                                           field_names[c.SITE_ID_FIELD_NAME],
                                           field_names[c.DATE_CREATED_FIELD_NAME],
                                           field_names[c.COMMENT_FIELD_NAME],
                                           field_names[c.BLE_FIELD_NAME],
                                           field_names[c.WIFI_FIELD_NAME]
                                       ]) as icur:
                oid = icur.insertRow([site_id, datetime.datetime.now(),
                                      comment, ble, wifi])

            # retrieve the global_id of the last-inserted row
            expression = f'{oid_field} = {oid}'
            gid = [row[0] for row in arcpy.da.SearchCursor(
                in_table=table_path,
                field_names=global_id_field,
                where_clause=expression)][0]

            # create a match entry
            with arcpy.da.InsertCursor(in_table=match_table,
                                       field_names=[match_id_field,
                                                    attachment_path_field
                                                    ]) as i_cur_match:
                i_cur_match.insertRow([gid, building_db_path])

            # commit operation
            edit.stopOperation()

            # Stop the edit session and save the changes
            edit.stopEditing(True)

        except Exception as any_error:
            # an error occurred: stop operation, don't commit changes
            edit.abortOperation()
            edit.stopEditing(False)
            raise any_error

        # add the attachment (which does not work for me)
        arcpy.AddAttachments_management(
            in_dataset=positioning_table,
            in_join_field=global_id_field,
            in_match_table=match_table,
            in_match_join_field=match_id_field,
            in_match_path_field=attachment_path_field)

        # clear the in-memory workspace
        arcpy.Delete_management(f'memory/{match_table_name}')


def attach_to_feature_service(table,
                              file_path,
                              site_id=None,
                              comment=None,
                              ble=1,
                              wifi=0):
    """adds file as attachment to feature service table

    :param table: table or table view
    :param file_path: string
    :param site_id: string
    :param comment: string
    :param ble: int
        is ble data in positioning file? 0 equals False, 1 True
    :param wifi: int
        is wifi data in positioning file? 0 equals False, 1 True
    """
    feature_service_url = u_db.valid_url(arcpy.Describe(table).catalogPath)
    gis = u.create_gis_connect()
    layer = arcgis.features.FeatureLayer(feature_service_url, gis=gis)

    # raise error if the feature layer can't be edited by logged-in user
    v.is_feature_service_editable_by_user(gis=gis, layer=layer)

    # set the container, i.e. the Feature Layer collection that the layer is
    # part of. The container manages the uploading of attachments over 9 MB
    layer.container = arcgis.features.FeatureLayerCollection(
        url=os.path.dirname(feature_service_url),
        gis=gis)

    # use xml (const) fields and actual fields to validate field names
    xml_fields = u.create_field_name_dict(
        table,
        c.MODEL_30.XML_PATH,
        c.MODEL_30.IPS_POSITIONING.NAME)

    data_dict = {
        'attributes': {
            xml_fields[c.SITE_ID_FIELD_NAME]: site_id,
            xml_fields[c.DATE_CREATED_FIELD_NAME]: datetime.datetime.now(),
            xml_fields[c.COMMENT_FIELD_NAME]: comment,
            xml_fields[c.BLE_FIELD_NAME]: ble,
            xml_fields[c.WIFI_FIELD_NAME]: wifi
        }
    }

    response = layer.edit_features(adds=[data_dict])
    if 'addResults' not in response.keys(
    ) or not response['addResults'][0]['success']:
        raise v.FeatureServiceError

    oid = response['addResults'][0]['objectId']
    # upload the attachment. If it fails, save it locally and message the user
    try:
        response = layer.attachments.add(oid, file_path)
        if 'addAttachmentResult' not in response.keys() or \
                not response['addAttachmentResult']['success']:
            raise Exception
    except:
        try:
            # save it in the current open ArcGIS project (run tool from Pro)
            attachment_folder = os.path.dirname(
                arcpy.mp.ArcGISProject("CURRENT").filePath)
        except OSError:
            # else save it in the user's "home" folder (run tool from python)
            attachment_folder = os.path.expanduser("~")

        attachment_local_path = os.path.join(attachment_folder,
                                             os.path.basename(file_path))
        shutil.copyfile(file_path, attachment_local_path)

        # raise an exception and inform the user
        raise v.UploadAttachmentError(oid, attachment_local_path)


class LegacyDbMapper(indoor_sql.SqlBase):

    def __init__(self, db_path):
        super(LegacyDbMapper, self).__init__('sqlite:///%s' % db_path,
                                             indoor_idm.IdmBase)

    def add_building(self,
                     building_id: int,
                     lat_origin: float,
                     lon_origin: float,
                     azimuth_x_axis: float = 90.):
        """Adds a row to the Building table

        Args:
            building_id: id of the building
            lat_origin: latitude of the legacy origin
            lon_origin: latitude of the legacy origin
            azimuth_x_axis: CW rotation (in degrees) from the north to
                            the x-axis of the legacy coordinate system

        Returns:

        """
        self.session.add(
            indoor_idm.Building(id=building_id,
                                description=None,
                                latorigin=int(lat_origin * 1e6),
                                lonorigin=int(lon_origin * 1e6),
                                name='dummy name',
                                rotation=azimuth_x_axis))
        self.commit()

    def add_floors(self, building_id: int, floor_df: pd.DataFrame):
        """Adds rows to the Floor table

        Args:
            building_id: id of the building
            floor_df: dataframe containing floor data. The index is used for the floor ids,
                    min columns: ['vertical_order', ...]

        Returns:

        """

        for floor_id, floor in floor_df.iterrows():
            # Floor ids are only unique within one idm
            # if a different set of recordings is processed
            # we might get different floor id for this idm
            self.session.add(
                indoor_idm.Floor(id=floor_id,
                                 building_id=building_id,
                                 description=None,
                                 level=int(floor.vertical_order),
                                 mmheight=None,
                                 mmleftorigin=0,
                                 mmtoporigin=0,
                                 mmwidth=None,
                                 name=str(floor.vertical_order)))
        self.commit()

    def add_portals(self, portal_df: pd.DataFrame):
        """Add rows to the Portal table.
        **NOTE**: we misuse the table on purpose and write
        floor vertical_orders to the floor_id field

        Args:
            portal_df: dataframe of portals. Min columns:
                        [VERTICAL_ORDER_FROM_FIELD_NAME, SHAPE_FIELD_NAME]

        Returns:

        """
        portal_df = portal_df.reset_index(drop=True)
        portal_df.index += 1

        for portal_id, portal in portal_df.iterrows():
            self.session.add(
                indoor_idm.Portal(id=portal_id,
                                  edge_id=None,
                                  floor_id=portal[c.VERTICAL_ORDER_FROM_FIELD_NAME],
                                  x=portal[c.SHAPE_FIELD_NAME].x,
                                  y=portal[c.SHAPE_FIELD_NAME].y))
        self.commit()

    def add_networks(self, building_id: int, network_df: pd.DataFrame):
        """Add rows to the Network and NetworkMetadata tables

        Args:
            building_id: id of the building
            network_df: network dataframe. Min columns: [bssid, ssid, transmitter_type]

        Returns:

        """
        network_metadata_id = 1
        for network_id, network in network_df.iterrows():
            if network.transmitter_type == type.WLAN:
                bssid = network.bssid
            else:
                bssid = network_id
            self.session.add(
                indoor_idm.Network(id=network_id,
                                   building_id=building_id,
                                   bssid=bssid,
                                   channel=0,
                                   name=network.ssid,
                                   networktype=int(network.transmitter_type),
                                   refreshrate=None)
            )

            metadata = ()
            if network.transmitter_type == type.IBEACON:
                metadata = zip(
                    ('ibeacon_uuid', 'ibeacon_major', 'ibeacon_minor'),
                    network.ssid.split("."))
            elif network.transmitter_type == type.WLAN:
                metadata = [('wlan_ssid', network.ssid)]

            for k, v in metadata:
                self.session.add(
                    indoor_idm.NetworkMetadata(id=network_metadata_id,
                                               network_id=network_id,
                                               name=k,
                                               value=v)
                )
                network_metadata_id += 1

        self.commit()

    def add_fingerprints(self, fingerprint_df: pd.DataFrame):
        """Adds rows to Fingerprint, FingerprintPoint and Statistic tables

        Args:
            fingerprint_df: fingerprint dataframe. Min columns: [x, y, floor_id, network_id, mean, var]

        Returns:

        """
        device_id = 1

        self.session.add(
            indoor_idm.Device(id=device_id,
                              name='SLAM DEVICE')
        )

        # sort fingerprints
        fingerprint_df = fingerprint_df.sort_values(by=['x', 'y', 'vertical_order']).reset_index(drop=True)
        fingerprint_df.index += 1

        for point_id, ((x, y, floor_id), position_df) in enumerate(
                fingerprint_df.groupby(['x', 'y', 'floor_id'])):
            point_id += 1
            self.session.add(
                indoor_idm.FingerprintPoint(
                    id=point_id,
                    cluster_id=None,
                    floor_id=int(floor_id),
                    x=int(x * 1e3),
                    y=int(y * 1e3),
                )
            )

            for radio_id, radio in position_df.iterrows():
                self.session.add(
                    indoor_idm.Fingerprint(
                        id=radio_id,
                        network_id=radio.network_id,
                        point_id=point_id
                    )
                )

                self.session.add(
                    indoor_idm.Statistic(
                        id=radio_id,
                        device_id=device_id,
                        fingerprint_id=radio_id,
                        amount=0,
                        mean=radio.rssi_mean,
                        variance=radio.rssi_var)
                )
        self.commit()
