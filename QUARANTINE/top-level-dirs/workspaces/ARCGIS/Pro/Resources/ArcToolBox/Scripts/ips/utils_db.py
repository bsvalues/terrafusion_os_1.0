import os
from collections import Counter
from typing import List, Dict

import arcgis
import arcpy
import indoorsdatapy.common.const.network_type as type
import ips.const as c
import ips.utils as u
import ips.validation as v
import pandas as pd


def get_attachment_table(table):
    """ Get the attachment table related to the input

    If a table/feature class has attachments enabled the attachment
    table's path is returned, as well as origin and foreign
    key fields.
    If not, it returns None

    :param table: table or table view
    :return: (origin_key, foreign_key, attachment_table):
      (string, string, string)
    """
    table_description = arcpy.Describe(table)
    table_source_path = os.path.dirname(table_description.catalogPath)
    relationship_classes = table_description.relationshipClassNames
    for relationship_class in relationship_classes:
        relation_describe = arcpy.Describe(
            os.path.join(table_source_path, relationship_class))
        if relation_describe.isAttachmentRelationship:
            origin_key = relation_describe.originClassKeys[0][0]
            foreign_key = relation_describe.originClassKeys[1][0]
            attachment_table = os.path.join(
                table_source_path, relation_describe.destinationClassNames[0])
            return origin_key, foreign_key, attachment_table
    return None


def extract_attachments(table: str,
                        target_dir: str,
                        object_ids: List[int],
                        skip_object_ids: List[int] = None):
    """extracts attachments from either a feature service or a geodatabase

    :param table: path to table or feature service
    :type table: str
    :param target_dir: target directory to write attachments to
    :type target_dir: str
    :param object_ids: the row ids for which we want to retrieve
      the attachments
    :type object_ids: List[int]
    :param skip_object_ids: the row ids which we want to skip,
      if None all the rows are returned
    :type skip_object_ids: List[int]
    :return:  yields tuple (file_path, record_oid, attachment_oid)
      paths of extracted attachments and corresponding record and
      attachment object ids (the oid pair is unique)
    """
    os.makedirs(target_dir, exist_ok=True)

    if skip_object_ids is not None:
        object_ids = list(set(object_ids).difference(skip_object_ids))
    if len(object_ids) == 0:
        return None

    # TODO during validation, check that table is not empty
    if v.is_feature_service(table):
        yield from attachments_from_feature_service(table, target_dir,
                                                    object_ids)
    else:
        yield from attachments_from_gdb(table, target_dir, object_ids)


def attachments_from_gdb(table: str, target_dir: str, object_ids: List[int],
                         outfile_prefix: str = None):
    """
    Looks up the object ids contained in the table and
    extracts the corresponding attachments from the attachments
    table by writing them into a target directory

    :param table: table or table view
    :param target_dir: path to the output folder
    :param object_ids: list of object ids
    :param outfile_prefix: prefix for the output filename
    :return: yields tuple (file_path, record_oid, attachment_oid)
      paths of extracted attachments and corresponding record and
      attachment object ids (the oid pair is unique)
    """

    attachment_props = get_attachment_table(table)
    if attachment_props is None:
        raise v.AttachmentTableError(table=table)

    origin_key, foreign_key, attachment_table = attachment_props
    table_description = arcpy.Describe(table)
    att_table_description = arcpy.Describe(attachment_table)

    # get the name of the object_id field of the tables
    table_oid_field = table_description.OIDFieldName
    att_table_oid_field = att_table_description.OIDFieldName

    # also get the base names (we will need to operate on the tables)
    att_table_name = att_table_description.baseName
    table_name = table_description.baseName

    # join the table to its attachment_table and select by object_id (if given)

    # the join condition
    where_clause = (
        f'{table_name}.{origin_key}'
        f' = {att_table_name}.{foreign_key}'
    )
    # if specific object ids are given also add a selection condition
    if object_ids:
        where_clause += (
            f' AND {table_name}.{table_oid_field}'
            f' IN ({", ".join(str(oid) for oid in object_ids)}) '
        )

    join_table = arcpy.MakeQueryTable_management(
        in_table=[table, attachment_table],
        out_table='oid_selection',
        in_key_field_option='USE_KEY_FIELDS',
        in_key_field=[
            f'{table_name}.{table_oid_field}',
            f'{att_table_name}.{att_table_oid_field}'
        ],
        in_field=[
            f'{table_name}.{table_oid_field}',
            f'{att_table_name}.{att_table_oid_field}',
            f'{att_table_name}.ATT_NAME', f'{att_table_name}.DATA'
        ],
        where_clause=where_clause)

    with arcpy.da.SearchCursor(join_table, [
        f'{table_name}.{table_oid_field}',
        f'{att_table_name}.{att_table_oid_field}',
        f'{att_table_name}.ATT_NAME', f'{att_table_name}.DATA'
    ]) as cursor:
        for item in cursor:
            table_oid, att_table_oid, att_name, att_data = item
            filename = f'{str(att_table_oid)}_{str(att_name)}'
            if outfile_prefix:
                filename = f'{outfile_prefix}_{filename}'
            file_path = os.path.join(target_dir, filename)
            with open(os.path.join(target_dir, filename), 'wb') as file_handle:
                file_handle.write(att_data.tobytes())

            # Yield tuple
            yield file_path, table_oid, att_table_oid

            del item
            del att_data

    # make sure to delete the temporary table and
    # delete any associated lock file
    arcpy.Delete_management(join_table)  # delete the table
    del join_table  # delete the variable

    db_path = get_workspace(table)
    # does not work for enterprise gdb, maybe lock issues there
    if arcpy.Describe(db_path).workspaceType == 'LocalDatabase':
        arcpy.Compact_management(db_path)  # remove invalid locks!


def attachments_from_feature_service(table, target_dir, object_ids):
    """extracts attachments from feature services

    For the list of object ids the attachments are downloaded
    and the file paths of the downloaded files returned

    :param table: table or table view
    :param target_dir: string
    :param object_ids: iterable
    :return: yields tuple (file_path, record_oid, attachment_oid)
      paths of extracted attachments and corresponding record and
      attachment object ids (the oid pair is unique)
    """
    feature_service_url = valid_url(
        arcpy.Describe(table).catalogPath)

    # TODO not sure about the gis login, you can only get the data,
    #  if you are log in to the portal
    layer = arcgis.features.FeatureLayer(
        feature_service_url,
        gis=u.create_gis_connect()
    )

    if not layer.properties.get('hasAttachments'):
        raise v.AttachmentTableError(table=table)

    # TODO: this was broken before, can we now download all recordings at once?
    for oid in object_ids:
        try:
            str_oid = str(oid)
            download_paths = layer.attachments.download(str_oid,
                                                        save_path=target_dir)
            for i, download_path in enumerate(download_paths):
                yield download_path, oid, i
        except (KeyError, IndexError) as e:
            pass


def get_workspace(input_path):
    """given a path returns the part of the path that identifies the workspace
    intended to be used for file / enterprise geodatabases or web feature
    layers.

    NOTE: For web feature layer it returns the path of the web feature layer
    up to the last slash(es) (forward or backward).

    NOTE2: The workspace of a web feature layer has:
    catalogPath: https://services5.arcgis.com/.../arcgis/rest/services/Name
    workspaceType: Remote Database
    workspaceFactoryProgID: esriDataSourcesGDB.FeatureServiceDBWorkspaceFactory

    :param input_path: input path where database gets extracted from
    :return: workspace_path: str
    """
    workspace_desc = arcpy.Describe(input_path)
    while True:
        if workspace_desc.dataType == 'Workspace':
            return workspace_desc.catalogPath
        if workspace_desc.catalogPath == os.path.dirname(
                workspace_desc.catalogPath):
            # we reached the end of the file path
            raise ValueError(
                f'Could not find workspace for input path {input_path}.')
        workspace_desc = arcpy.Describe(os.path.dirname(
            workspace_desc.catalogPath))


def count_attachments(table: str,
                      object_ids: List[int]) -> Dict[int, int]:
    """counts attachments per row from either a feature service or a geodatabase

    :param table: path to table or feature service
    :type table: str
    :param object_ids: the row ids for which we want to retrieve
      the attachments
    :type object_ids: List[int]
    :return: Dict[int, int]:
      a dictionary containing the number of attachments per objectid
    """
    if v.is_feature_service(table):
        return count_attachments_from_feature_service(table,
                                                      object_ids)
    else:
        return count_attachments_from_gdb(table, object_ids)


def count_attachments_from_gdb(table: str, object_ids: List[int]) -> Dict[
    int, int]:
    """
    Looks up the object ids contained in the table and
    counts the number of attachments from the attachments table

    :param table: table or table view
    :param object_ids: list of object ids
    :return: Dict[int, int]:
      a dictionary containing the number of attachments per objectid
    """

    attachment_props = get_attachment_table(table)
    if attachment_props is None:
        raise v.AttachmentTableError(table=table)

    origin_key, foreign_key, attachment_table = attachment_props
    table_description = arcpy.Describe(table)
    att_table_description = arcpy.Describe(attachment_table)

    # get the name of the object_id field of the tables
    table_oid_field = table_description.OIDFieldName
    att_table_oid_field = att_table_description.OIDFieldName

    # also get the base names (we will need to operate on the tables)
    att_table_name = att_table_description.baseName
    table_name = table_description.baseName

    # join the table to its attachment_table and select by object_id (if given)

    # the join condition
    where_clause = (
        f'{table_name}.{origin_key}'
        f' = {att_table_name}.{foreign_key}'
    )
    # if specific object ids are given also add a selection condition
    if object_ids:
        where_clause += (
            f' AND {table_name}.{table_oid_field}'
            f' IN ({", ".join(str(oid) for oid in object_ids)}) '
        )

    join_table = arcpy.MakeQueryTable_management(
        in_table=[table, attachment_table],
        out_table='oid_selection',
        in_key_field_option='USE_KEY_FIELDS',
        in_key_field=[
            f'{table_name}.{table_oid_field}',
            f'{att_table_name}.{att_table_oid_field}'
        ],
        in_field=[
            f'{table_name}.{table_oid_field}',
            f'{att_table_name}.{att_table_oid_field}',
            f'{att_table_name}.ATT_NAME', f'{att_table_name}.DATA'
        ],
        where_clause=where_clause)

    count_per_oid = Counter(
        row[0] for row in arcpy.da.SearchCursor(join_table, [
            f'{table_name}.{table_oid_field}']))
    # make sure to delete the temporary table and
    # delete any associated lock file
    arcpy.Delete_management(join_table)  # delete the table
    del join_table  # delete the variable

    db_path = get_workspace(table)
    # does not work for enterprise gdb, maybe lock issues there
    if arcpy.Describe(db_path).workspaceType == 'LocalDatabase':
        arcpy.Compact_management(db_path)  # remove invalid locks!
    return count_per_oid


def count_attachments_from_feature_service(table, object_ids) -> Dict[int, int]:
    """counts the attachments from feature services

    For the list of object ids the number of attachments are counted for
    those object ids without downloading them

    :param table: table or table view
    :param object_ids: iterable
    :return: Dict[int, int]:
      a dictionary containing the number of attachments per objectid
    """
    feature_service_url = valid_url(
        arcpy.Describe(table).catalogPath)

    layer = arcgis.features.FeatureLayer(
        feature_service_url,
        gis=u.create_gis_connect()
    )

    if not layer.properties.get('hasAttachments'):
        raise v.AttachmentTableError(table=table)

    count_per_oid = {}

    for oid in object_ids:
        try:
            str_oid = str(oid)
            # Count the attachments for row with one or more attachments
            count = len(layer.attachments.get_list(str_oid))
            if count > 0:
                count_per_oid[oid] = count
        except (KeyError, IndexError) as e:
            pass

    return count_per_oid


def df2fc_insert(df: pd.DataFrame, fc: str, field_names_dict: Dict):
    """Inserts the rows of the given dataframe into the given feature class

    Note:
        The dataframe columns must be a subset of the feature class/table
        fields

    Args:
        df: the source dataframe
        fc: the target feature class
        field_names_dict: a dictionary with keys the "constant" field names
            (as defined in the xml schema) and values the actual field names of
            the feature class/table

    Returns:

    """
    df.rename(columns=field_names_dict, inplace=True)
    columns = df.columns.tolist()

    # TODO: check also that the datatypes match and
    #  filter out from common fields those that do not match

    # raise error if the target workspace (gdb) has pending edits
    if arcpy.IsBeingEdited(get_workspace(fc)):
        raise v.PendingEditsError

    # insert the data
    edit = arcpy.da.Editor(get_workspace(fc))
    edit.startEditing(False, False)
    edit.startOperation()
    try:
        cursor = arcpy.da.InsertCursor(fc, columns)
        for row in df[columns].values:
            cursor.insertRow(row)
        edit.stopOperation()
        edit.stopEditing(True)
    except Exception as any_error:
        raise any_error
    finally:
        del cursor


def df2rel_insert(df: pd.DataFrame, rel_table: str, field_names_dict: Dict):
    """Inserts the rows of the given dataframe into the given Relationship table

    Note:
        - The dataframe columns must be a subset of the relationship table fields
        - We have to use the memory because inserting rows one by one doesn't work for M:N relationships. See Post:
        https://community.esri.com/t5/python-questions/inserting-record-in-m-n-relationship-table-quot/td-p/1110631

    Args:
        df: the source dataframe
        rel_table: the (attributed) relationship class
        field_names_dict: a dictionary with keys the "constant" field names
            (as defined in the xml schema) and values the actual field names of
            the relationship table

    Returns:

    """
    df.rename(columns=field_names_dict, inplace=True)
    columns = df.columns.tolist()

    # TODO: check also that the datatypes match and
    #  filter out from common fields those that do not match

    # raise error if the target workspace (gdb) has pending edits
    if arcpy.IsBeingEdited(get_workspace(rel_table)):
        raise v.PendingEditsError

    in_memory_table_name = "Relationship_Table"
    # make sure in-memory workspace is clean
    if arcpy.Exists(f'memory/{in_memory_table_name}'):
        arcpy.Delete_management(f'memory/{in_memory_table_name}')

    in_memory_rel_table = arcpy.CreateTable_management(
        out_path='memory',
        out_name=in_memory_table_name,
        template=rel_table)

    # insert the data
    edit = arcpy.da.Editor(get_workspace(in_memory_rel_table))
    edit.startEditing(False, False)
    edit.startOperation()
    try:
        cursor = arcpy.da.InsertCursor(in_memory_rel_table, columns)
        for row in df[columns].values:
            cursor.insertRow(row)
        edit.stopOperation()
        edit.stopEditing(True)
    except Exception as any_error:
        raise any_error
    finally:
        del cursor

    arcpy.Append_management(inputs=in_memory_rel_table, target=rel_table)


def tb2df(tb: str, field_names_dict: dict,
          where_clause: str = None, sql_clause: str = None) -> pd.DataFrame:
    """Loads fields of the given Table into a dataframe

    Note: Loads only the fields that are defined as values in the input field names dict.


    Args:
        tb: path to the feature class/table
        field_names_dict: a dictionary used to rename the actual
            field names of the feature class/table with the constant field names
            as defined in the xml schema
        where_clause: where clause as in the search cursor
            https://pro.arcgis.com/en/pro-app/latest/arcpy/data-access/searchcursor-class.htm
        sql_clause: where clause as in the search cursor
            https://pro.arcgis.com/en/pro-app/latest/arcpy/data-access/searchcursor-class.htm
    Returns:
        _ : the dataframe

    """
    with arcpy.da.SearchCursor(tb, list(field_names_dict.values()),
                               where_clause=where_clause, sql_clause=sql_clause) as cur:
        df = pd.DataFrame(data=cur, columns=list(field_names_dict.keys()))

    return df


def fc2sdf(fc: str, field_names_dict: dict = None, sr: int = 4326,
           where_clause: str = None, sql_clause: str = None) -> pd.DataFrame:
    """Loads fields of the given Feature Class or (local) Feature Layer
    into a spatially enabled dataframe.
    The column names will be as in the keys of the field_names_dict

    Note: Loads only the fields that are defined as values in the input field
        names dict

    Args:
        fc: path to the feature class or feature layer
        field_names_dict: a dictionary {original_field_name: actual_field_name}
            used to rename the actual field names of the feature class/layer
            to match the constant field names (original_field_name) as defined
            in the xml schema
        sr: EPSG of the output spatial reference. Features will be reprojected if necessary
        where_clause: where clause as in the search cursor
            https://pro.arcgis.com/en/pro-app/latest/arcpy/data-access/searchcursor-class.htm
        sql_clause: where clause as in the search cursor
            https://pro.arcgis.com/en/pro-app/latest/arcpy/data-access/searchcursor-class.htm
    Returns:
        _ : the spatial dataframe

    """
    desc = arcpy.Describe(fc)

    if desc.catalogPath.startswith('http') and desc.dataType == 'FeatureClass':
        fl = arcgis.features.FeatureLayer(
            url=desc.catalogPath,
            gis=u.create_gis_connect())
        # NOTE: from_layer expects an arcgis.features.FeatureLayer object (
        # i.e. full URL), **not** and arcpy.Layer
        sdf = pd.DataFrame.spatial.from_layer(layer=fl)

    else:
        # the function DataFrame.spatial.from_featureclass takes an optional "fields" param
        # if not given, it returns all fields EXCEPT SHAPE_LENGTH and SHAPE_AREA (if present).
        # HOWEVER, if the given fields list explicitly contains the "SHAPE" column, this is returned
        # once as a json and once as list of vertices. So we create here a list of fields containing
        # all the field names except the SHAPE field. In this way we are sure to retrieve all the FC fields.
        field_names = [f.name for f in desc.fields if f.type != 'Geometry'
                       and f.type.upper() != c.GLOBAL_ID_FIELD_NAME]
        # for GlobalID field we are always using the following const, actual pair:
        # "GLOBALID" (const): desc.globalIDFieldName
        if desc.hasGlobalID:
            field_names.append(desc.globalIDFieldName)

        # Reintroduced this try/except block to handle when GUI passes the input pointing to
        # FGDB FC directly
        # TODO: Find a better way to handle this issue
        try:
            fc = fc.value
        except:
            pass

        # NOTE: from_featureclass expects a Feature Class or map Layer (with
        # data saved locally / web feature service)
        sdf = pd.DataFrame.spatial.from_featureclass(location=fc, fields=field_names,
                                                     where_clause=where_clause, sql_clause=sql_clause)

    if field_names_dict:
        if c.SHAPE_FIELD_NAME in field_names_dict:
            # the Shape field is always mapped to the column "SHAPE" (all caps) in the spatial dataframe,
            # this may not match with the shape attribute name in the field_names_dict, so we need to rename it
            sdf = sdf.rename(columns={
                sdf.spatial.name: field_names_dict[c.SHAPE_FIELD_NAME]})

        # NOTE: fix  lower case "GlobalID" in web feature layer with "Referecing Registered Data"
        if c.GLOBAL_ID_FIELD_NAME in field_names_dict:
            for column in sdf.columns:
                if column.upper() == c.GLOBAL_ID_FIELD_NAME:
                    sdf = sdf.rename(columns={column: field_names_dict[c.GLOBAL_ID_FIELD_NAME]})
                    break

        # make sure to remove from the field_names_dict items that do not exist in the sdf
        field_names_dict = {k: v for k, v in field_names_dict.items() if v in sdf.columns}

        # Based on bug reported 483, we run into issues if there are two ObjectID fields - OBJECTID_1, OBJECTID
        # In order to avoid this issue, we first filter the sdf only for the needed fields and then rename the fields
        # instead of renaming the columns and then filtering the sdf

        # filter out columns that we do not want
        sdf = sdf[list(field_names_dict.values())]

        # rename the columns to use the XML names instead of the actual names
        sdf = sdf.rename(columns={v: k for k, v in field_names_dict.items()})

    # re-project to the given spatial reference
    sdf.spatial.project(sr)

    # lastly convert pandas <NA> values to python None and return
    return sdf.replace({pd.NA: None})


def valid_url(url: str) -> str:
    """ ensures a valid URL, as per RFC 1738

    Args:
        url: original URL

    Returns: RFC 1738-valid URL

    """
    return url.replace('\\', '/')


def resolve_transmitter_id(tx_id: str, tx_type: int) -> str:
    """
    Modify transmitter id by removing only the prefix (5_) for Bluetooth data and by converting the values to
    MAC Address after removing the prefix (0_) for WI-FI data
    Args:
        tx_id: the transmitter id to be resolved
        tx_type: the legacy transmitter type (0 == WiFi, 5 == BLE)

    Returns: string with prefix removed for BLE (5_) and for WI-FI(0_) and converted to
     MAC address only for WI-FI
    """

    # remove the prefix 5_ or 0_ (if present)
    tx_id = tx_id.split('_')[-1]

    # if we are dealing with WiFi transmitter_id, convert it to mac address (if it is not already)
    if tx_type == type.WLAN and not v.is_valid_mac_address(tx_id):
        tx_id = u.int_to_mac(int(tx_id))

    return tx_id

# TODO: we can change the functionality and make it return the SQL
#  statement instead of just since we use it for this reason exclusively
def split_list(lst: list, max_length: int = 1000):
    return [lst[i: i + max_length] for i in range(0, len(lst), max_length)]
