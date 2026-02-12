import os
import re
import xml.etree.ElementTree as ET
from typing import List, Dict, Union, Tuple, Optional, Iterable

import arcgis
import arcpy
import indoorsdatapy.access.recording as indoor_rec
import ips.const as c
import ips.utils_db as u_db
import pandas as pd
import requests
from google.protobuf.message import DecodeError


def string_match(string1, string2):
    """case-insensitive string comparison

    :param string1: str
    :param string2: str
    :return: match: bool
    """
    return string1.lower() == string2.lower()


def create_gis_connect():
    """create gis connection instance
    Uses the portal you are currently connected to

    :return: gis instance
    """
    gis = arcgis.gis.GIS('home', verify_cert=False)
    return gis


def get_schema_info_from_xml(
        xml_schema_path: str,
        data_element_name: str,
        base_path: str = './WorkspaceDefinition/DatasetDefinitions/DataElement/'
):
    """Returns fields, table type, and (possibly) geometry type of table defined
    in a xml schema

    Args:
        xml_schema_path: path to the xml schema definition
        data_element_name: name of the table or feature class in the xml schema
        we want to retrieve the fields of
        base_path: a base path to start searching from in the element tree

    Notes:
        If the base_path is not defined it defaults to
        'WorkspaceDefinition/DatasetDefinitions/DataElement' which is used to
        find the feature classes/tables that don't belong in any dataset (they
        are defined directly under a workspace).

    Returns:
        fields: list of table fields
        data_element_type: data element type (either DEFeatureClass or DETable)
        geometry_type: geom type for a DEFeatureClass, else None

    """
    xsi = '{http://www.w3.org/2001/XMLSchema-instance}'

    tree = ET.parse(xml_schema_path)
    root = tree.getroot()
    table_node = root.find((
            base_path + f'[Name="{data_element_name}"]'))

    # get the type. Will be either DEFeatureClass or DETable
    data_element_type = table_node.attrib[f'{xsi}type'][len('esri:'):]

    # if this is a Feature Class, extract also the geometry type
    geometry_type = None
    if data_element_type == 'DEFeatureClass':
        geometry_type = table_node.find('.//GeometryDef/GeometryType').text[
                        len('esriGeometry'):]

    fields_node = table_node.find('Fields/FieldArray')

    fields = []

    # this is a mapping from Field attribute name to the
    # corresponding node in the xml document
    field2xml = {
        'name': 'Name',
        'aliasName': 'AliasName',
        'type': 'Type',
        'domain': 'Domain/DomainName',
        'length': 'Length',
        'precision': 'Precision',
        'scale': 'Scale',
        'editable': 'Editable',
        'isNullable': 'IsNullable',
        'required': 'Required',
        'defaultValue': 'DefaultValue',
    }

    for field_node in fields_node:
        field = arcpy.Field()

        for field_attr, xml_attr in field2xml.items():
            try:
                setattr(field, field_attr, field_node.find(xml_attr).text)
            except (AttributeError, NameError):
                pass

        # strip off the "esriFieldType" from the type string
        field.type = field.type[len('esriFieldType'):]

        # if the alias is empty, fill it with the name
        if not field.aliasName:
            field.aliasName = field.name

        fields.append(field)

    return fields, data_element_type, geometry_type


def edit_dataset_xml_schema(
        in_xml_schema_path: str,
        data_dir: str,
        coordinate_system: str = None,
        out_dataset_name: str = None) -> str:
    """Edit a default IPS XML SCHEMA. Optionally, edit the coordinate system
    (WKT) and the dataset name (for feature dataset).

    Args:
        in_xml_schema_path: the XML Schema to be edited
        data_dir: a temporary folder that contains the xml_schema xml file that gets created.
        coordinate_system: the coordinate system as WKT (user defined)
        out_dataset_name: the output dataset name (user defined). Used for IPS Quality dataset only

    Returns:
        edited_xml_schema_path: the absolute path to the newly created xml schema

    """
    # TODO: delete this function and replace it with read / operations (set_dataset...) / write
    tree = read_xml_schema(xml_schema_path=in_xml_schema_path)
    root = tree.getroot()

    if out_dataset_name:
        root = set_dataset_name_in_xml_schema(root, out_dataset_name)
    if coordinate_system:
        root = set_crs_in_xml_schema(root, coordinate_system)

    # Write the new xml schema file as temp file. It gets deleted later
    new_path = os.path.join(data_dir, 'edited_schema.xml')

    write_xml_schema(tree=tree, xml_schema_path=new_path)

    return new_path


def read_xml_schema(xml_schema_path: str) -> ET.ElementTree:
    """Reads and xml file and return the ElementTree.

    Args:
        xml_schema_path: file of the xml schema path

    Returns:
        tree: ET.ElementTree
    """
    ET.register_namespace('esri', 'http://www.esri.com/schemas/ArcGIS/10.8')
    ET.register_namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')

    tree = ET.parse(xml_schema_path)
    root = tree.getroot()

    # Add manually the namespace "xs". The XML parser ignores it.
    # The attributes that use it are inside quotes in the xml schema
    root.attrib['xmlns:xs'] = 'http://www.w3.org/2001/XMLSchema'

    return tree


def write_xml_schema(tree: ET.ElementTree, xml_schema_path: str) -> None:
    """Writes an ElementTree to a xml file.

    Args:
        tree: the xml representation as ET.ElementTree
        xml_schema_path: the file path for the xml file output

    Returns:
        None
    """
    tree.write(file_or_filename=xml_schema_path,
               encoding='UTF-8',
               xml_declaration=False,
               short_empty_elements=False)


def set_crs_in_xml_schema(xml_schema: Union[ET.ElementTree, str],
                          coordinate_system: str) -> ET.ElementTree:
    """
    Change the coordinate system with the user defined. This function
    changes every occurrence of coordinate system in the xml schema.
    NOTE: the function changes only the WKT. The parameters for tolerance,
    minimum values, etc. are wiped out. These will be set to default values for
    each coordinate system during importing operation in ArcGIS Pro.

    :param xml_schema: This is either the path to the xml schema file or
    the root node of the xml tree of the xml schema file
    :type xml_schema: ET.Element or str
    :param coordinate_system: the output dataset coordinate system. It
    contains only the WKT (user defined)
    :type coordinate_system: str
    :return root: the root node of the XML tree containing the edited nodes
    :rtype: ET.Element
    """
    if isinstance(xml_schema, str):
        tree = ET.parse(xml_schema)
    else:
        tree = xml_schema

    attribute = {'xsi:type': 'esri:ProjectedCoordinateSystem'} \
        if arcpy.SpatialReference(text=coordinate_system).type == 'Projected' \
        else {'xsi:type': 'esri:GeographicCoordinateSystem'}

    for spatial_reference_instance in tree.findall('.//SpatialReference'):
        # Clear all node children and tag. Avoid iteration on all children
        spatial_reference_instance.clear()
        # Set the attrib and the new WKT tag
        spatial_reference_instance.attrib = attribute
        ET.SubElement(spatial_reference_instance, 'WKT').text = \
            coordinate_system

    # replace the grid size value to be 0 to avoid indexing issues
    for grid_size_0 in tree.findall('.//GridSize0'):
        grid_size_0.text = '0'

    return tree


def set_dataset_name_in_xml_schema(xml_schema: Union[ET.Element, str],
                                   out_dataset_name: str) -> ET.Element:
    """
    Change the name of the dataset (in this case the default 'IPS_Quality')
    with the user defined.

    :param xml_schema: the root node of the XML tree of the IPS_Quality xml file
    :type xml_schema: ET.Element
    :param out_dataset_name: the output dataset name (user defined)
    :type out_dataset_name: str
    :return root: the root node of the XML tree containing the edited nodes
    :rtype: ET.Element
    """
    if isinstance(xml_schema, str):
        root = ET.parse(xml_schema).getroot()
    else:
        root = xml_schema

    base_path = './WorkspaceDefinition/DatasetDefinitions/DataElement/'

    # Change the name in the nodes CatalogPath and Name
    root.find(base_path + 'CatalogPath').text = f'/FD={out_dataset_name}'
    root.find(base_path + 'Name').text = out_dataset_name

    # Change the name of the Feature Classes created
    fc_names = root.findall(base_path + 'Children/DataElement/CatalogPath')
    for fc_name in fc_names:
        fc_name.text = re.sub(r'FD=.*/', f'FD={out_dataset_name}/',
                              fc_name.text)
    return root


def remove_data_elements_in_xml_schema(xml_schema: Union[ET.ElementTree, str],
                                       data_elements: List[str],
                                       is_in_dataset: bool = False) -> ET.ElementTree:
    """Removes data elements defined in xml schema if they don't belong to the data elements given.
    Also, it removes all the domains that are not used by the remaining data elements.
    
    Args:
        xml_schema: path to the xml schema to be edited
        data_elements: list of data element names as defined in the xml schema
        is_in_dataset: if the data elements are defined to be inside a feature dataset

    Returns:
        None

    """
    if isinstance(xml_schema, str):
        tree = ET.parse(xml_schema)
    else:
        tree = xml_schema

    base_path = './WorkspaceDefinition/DatasetDefinitions/DataElement' \
        if is_in_dataset else './WorkspaceDefinition/DatasetDefinitions'

    # the dataset that contains the data elements we are looking for
    # node <DataElement xsi:type="esri:DEFeatureDataset"> if defined inside a feature dataset
    # node <DatasetDefinitions xsi:type='esri:ArrayOfDataElement'> otherwise
    data_elements_parent = tree.find(base_path)
    # all the data elements defined in the xml schema that are part of the dataset
    data_elements_xml = tree.findall(base_path + '/Children/DataElement')
    # remove any data element from the xml if it doesn't belong to the ones we want to keep
    for de in data_elements_xml:
        if de.find("./Name").text not in data_elements:
            data_elements_parent.find("./Children").remove(de)

    # remove any domains that are not used by the remaining data elements
    used_domain_names = [d.text for d in tree.findall(
        base_path + '/Children/DataElement/Fields/FieldArray/Field/Domain/DomainName')]

    # node <Domains xsi:type="esri:ArrayOfDomain">, parent of each Domain node definition
    workspace = tree.find('./WorkspaceDefinition/Domains')
    # all the domains defined in the xml schema
    defined_domains_xml = tree.findall('./WorkspaceDefinition/Domains/Domain')

    for dm in defined_domains_xml:
        if dm.find("./DomainName").text not in used_domain_names:
            workspace.remove(dm)

    return tree


def compare_fields(
        f1: arcpy.Field,
        f2: arcpy.Field,
        attr_filter: Iterable[str] = None) -> bool:
    """compares two arcpy.Field to check if they are equal.
    It only compares the attributes listed in attr_filter.

    :param f1: first field to compare
    :type f1: arcpy.Field
    :param f2: second field to compare
    :type f2: arcpy.Field
    :param attr_filter: list of arcpy.Field attributes to check for.
      If None, check all the attributes.
      possible values: ['name', 'aliasName', 'type', 'domain', 'length',
      'precision', 'scale', 'editable', 'isNullable',
      'required', 'defaultValue']
    :type attr_filter: List[str]
    :return: True if the 2 fields are equal in all the given attributes
    """

    # Floats map to single- or double-precision in different databases
    # we introduce this function to relax the check (specifically for EGDBs)
    def type_match(t1, t2):
        def is_float(t):
            return t in ('single', 'double')

        t1, t2 = str(t1).lower(), str(t2).lower()
        return t1 == t2 or (is_float(t1) and is_float(t2))

    field_attrs = ['name', 'aliasName', 'type',
                   'domain', 'length', 'precision',
                   'scale', 'editable', 'isNullable',
                   'required', 'defaultValue']

    if attr_filter is None:
        attr_filter = field_attrs

    # filter out attributes that do not exist
    attr_filter = set(attr_filter).intersection(field_attrs)

    return all([
        type_match(getattr(f1, a), getattr(f2, a)) if a == 'type'
        else str(getattr(f1, a)).lower() == str(getattr(f2, a)).lower() if a == 'name'
        else getattr(f1, a) == getattr(f2, a)
        for a in attr_filter])


def get_organization_id(url, token):
    """
    returns the organization id from a portal

    :param url: portal url, either AGOL or Enterprise
    :param token: sign-in token
    """
    org_id = ""
    try:
        portal_self_url = "{0}{1}".format(url, "sharing/rest/portals/self")
        params = {'f': 'json', 'token': token}
        response = requests.post(portal_self_url, params=params, verify=False)
        response_json = response.json()
        for key in response_json:
            if key == "id":
                org_id = response_json[key]
                break
        return org_id
    except Exception:
        return org_id


def get_fc_path(dataset_path: str, feature_class_name: str,
                feature_class_type: str) -> str:
    """
    Finds the path to the first occurrence of a feature class whose name starts
    with the given name in the given dataset.
    Args:
        :param dataset_path: Input Dataset to search against
        :type dataset_path: str
        :param feature_class_name: Feature class name to search for in the
        dataset
        :type feature_class_name: str
        :param feature_class_type: Type of feature class to search for. Possible
        values -'Point', ,Polyline, 'Polygon'
        :type feature_class_type: str
    Returns:
        path to the feature class : str - None if not feature class by that name
        exists
    """
    dataset_name = os.path.basename(dataset_path)

    arcpy.env.workspace = os.path.dirname(dataset_path)
    fc_name = arcpy.ListFeatureClasses(
        wild_card='*' + feature_class_name + '*',
        feature_type=feature_class_type,
        feature_dataset=dataset_name
    )
    return None if len(fc_name) == 0 else os.path.join(dataset_path, fc_name[0])


def create_field_name_dict(data_element: str, xml_schema_path: str,
                           xml_element_name: str,
                           is_in_dataset: bool = False) -> Dict:
    """Returns a dictionary of {original_field_name: actual_field_name}

    Creates a map between the actual field names of a feature class or table
    based on the restrictions of the DB that they are stored in and constant
    field names (as they are defined in the xml schemas).
    The "ObjectID", "Shape" and "Shape_Length" fields are mapped as ""OID@",
    "SHAPE@" and "SHAPE@LENGTH" accordingly.

    Args:
        data_element(str): path to the feature class or table
        xml_schema_path(str): path to the xml schema that defines the feature
            class or table
        xml_element_name(str): the name of the feature class or table inside
            the xml schema
        is_in_dataset(bool): if the data element inside the xml schema is inside
            a feature dataset

    Returns:
        _ :(dict) mapping {original_field_name -> actual_field_name}

    """
    base_path = './WorkspaceDefinition/DatasetDefinitions/DataElement/Children/DataElement' \
        if is_in_dataset else './WorkspaceDefinition/DatasetDefinitions/DataElement/'
    xml_fields = get_schema_info_from_xml(xml_schema_path, xml_element_name, base_path)[0]

    de_desc = arcpy.Describe(data_element)
    de_fields = de_desc.fields

    # let's create the field name dictionary mapping from XML field names to actual field names
    field_dict = dict()
    for xml_field in xml_fields:
        if 'shape' in xml_field.name.lower() and xml_field.type != 'Geometry':
            # shape.area/length have different name on enterprise gdbs,
            # but we can skip them because we don't use them in our calculations
            continue

        if xml_field.type == 'Geometry':
            # geometry fields are special and could have different names, better treat them separately
            field_dict[c.SHAPE_FIELD_NAME] = de_desc.shapeFieldName
        elif xml_field.type == 'OID':
            # object_id fields are special and could have different names, better treat them separately
            field_dict[c.OBJECT_ID_FIELD_NAME] = de_desc.OIDFieldName
        elif xml_field.type == 'GlobalID' and de_desc.hasGlobalID:
            # GlobalID fields are special and can be either GLOBALID or GlobalID our XML schema files!
            # better use always the following const,actual pair: "GLOBALID" (const): de_desc.globalIDFieldName
            field_dict[c.GLOBAL_ID_FIELD_NAME] = de_desc.globalIDFieldName
        else:
            matching_field = find_matching_field(xml_field, de_fields)
            if matching_field is None:
                # could not find a match, move forward
                # TODO: is this safe? shall we rather raise an error and handle it properly?
                continue
            # this works based on the assumption that the ips.const field names
            # match the field names in the xml schema definitions
            field_dict[xml_field.name] = matching_field.name

    return field_dict


def filter_df(df: pd.DataFrame,
              field_name: str,
              field_values: Union[List, str] = None,
              filter_type: str = 'Null') -> \
        Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generic function to filter Dataframe on the column defined as field name
    and return two Dataframes - one that satisfies the criteria and one that
    doesn't meet the criteria

    Args:
        df: DataFrame representation of input Feature class
        field_name: the field name as written in ips.const
        field_values (optional): required list or string if filter_type is not 'Null'
            - List of elements for 'isin' filter type
            - List of 2 elements for 'between' filter type
            - String pattern for 'Regex Match'
        filter_type (optional): the filter type
            - 'Null' (default): filter out null values
            - 'isin': filter for values that belong in the values of the list
            - 'Between': filter out values is not between the two provided values (including these)
            - 'RegexMatch': filter out values that don't follow the pattern fully (for string fields)

    Returns:
        One Dataframe that contains only the rows that satisfy the field_name
        criteria
        One Dataframe that contains only the rows that did not satisfy the
        field_name criteria

    """
    if filter_type == 'isin' and isinstance(field_values, list):
        filter_rows = df[field_name].isin(field_values)
    elif filter_type == 'Between' and isinstance(field_values, list) \
            and len(field_values) == 2:
        # Need to include .notnull condition in addition to .between otherwise missing values return NA instead of False
        filter_rows = df[field_name].notnull() & df[field_name].between(field_values[0], field_values[1])
    elif filter_type == 'RegexMatch':
        filter_rows = df[field_name].str.fullmatch(pat=field_values, na=False)
    else:
        # default case: Null values or Null/empty geometry
        if field_name == c.SHAPE_FIELD_NAME:
            # return empty dataframes here because the apply func discards the df columns
            if df.empty:
                return df, df
            # Arcpy/Arcgis : NULL geometries are just None
            # Arcgis: empty geometries have WKT None
            # Arcpy: empty geometries have one of the following WKT
            # 'POINT EMPTY, 'POINT Z EMPTY', 'MULTIPOLYGON EMPTY', 'MULTILINESTRING EMPTY'
            filter_rows = df[field_name].apply(lambda x: x is not None and
                                                         x.WKT is not None and
                                                         'EMPTY' not in x.WKT)
        else:
            filter_rows = (df[field_name].astype(str).str.strip() != '') & (df[field_name].notnull())

    return df[filter_rows], df[~filter_rows]


def filter_single_attachment_recordings(recordings_df: pd.DataFrame,
                                        recordings_features: str) -> \
        Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
     Count the attachments for each recordings and return list of object_ids
     that have none, one and multiple attachments

    :param recordings_df: DataFrame representation of Recordings Feature class
    :type recordings_df: pd.DataFrame
    :param recordings_features: path to table or feature service
    :type recordings_features: str

    Returns:
        DataFrame representation of Recordings Feature class containing only
        one attachment
        DataFrame representation of Recordings Feature class containing no
        attachment
        DataFrame representation of Recordings Feature class containing
        multiple attachment
    """

    object_ids = sorted(recordings_df[c.OBJECT_ID_FIELD_NAME].values.tolist())
    # Counting recording data per feature
    count_per_oid = u_db.count_attachments(
        table=recordings_features,
        object_ids=object_ids
    )

    # TODO: Need to explore if we can use group by for spliting the df
    # recordings with no attachments
    no_attachment_oids = list(
        set(object_ids).difference(count_per_oid.keys()))

    # recordings with multiple attachments (more than one)
    multiple_attachment_oids = [key for key, val in count_per_oid.items() if
                                val > 1]
    # recordings with single attachments
    valid_attachment_ids = [key for key, val in count_per_oid.items() if
                            val == 1]

    return (recordings_df[recordings_df[c.OBJECT_ID_FIELD_NAME].isin(
        valid_attachment_ids)],
            recordings_df[
                recordings_df[c.OBJECT_ID_FIELD_NAME].isin(no_attachment_oids)],
            recordings_df[recordings_df[c.OBJECT_ID_FIELD_NAME].isin(
                multiple_attachment_oids)])


def print_warnings(warnings: dict):
    """

    Args:
        warnings: Dictionary of warnings with warning id as key and list of
        oids as values

    Returns:
        Outputs arcpy WARNING messages
    """
    for warning_id, oids in warnings.items():
        if warning_id == 250090:
            # using a message with the format: ... with the following object IDs ... : %s.
            arcpy.AddIDMessage('WARNING', warning_id, ', '.join([str(oid) for oid in sorted(oids)]))
            break
        for oid in oids:
            # using a message with the format: ... with object ID %s is ...
            arcpy.AddIDMessage('WARNING', warning_id, oid)


def get_recording_access(recording_file_path: str) -> Union[indoor_rec.RecordingAccess, None]:
    """Opens a recording file and returns a indoor_rec.RecordingAccess object.
    If the file is not a valid recording pb file, returns None

    Args:
        recording_file_path: path to the (supposed) recording file

    Returns: a valid indoor_rec.RecordingAccess object or None

    """

    file_ending = os.path.splitext(recording_file_path)[-1]
    if file_ending not in (".pb", ".zip"):
        # optimization: if the file extension is not what we
        # expect we won't even try to open the file
        return None

    try:
        with open(recording_file_path, 'rb') as recording_handle:
            recording_access = indoor_rec.RecordingAccess(recording_handle)
        return recording_access
    except DecodeError:
        # raised when we try reading a file that
        # is not a valid Recording protobuf
        return None


def find_matching_field(field: arcpy.Field,
                        field_list: List[arcpy.Field],
                        match_attrs: Iterable[str] = None) -> Optional[arcpy.Field]:
    """matches the given field with one element of the list

    there is a match if the data type is compatible and if the names match.
    The name match is case-insensitive and we ignore underscores.

    Args:
        field: the arcpy.Field to match
        field_list: the list of arcpy.Field objects to search
        match_attrs: the field attributes that must match

    Returns:
        the matching element from the list, if a match is found. Else None

    """
    # if match attrs was not given, make it an empty list
    if match_attrs is None:
        match_attrs = []

    # make it a set to remove duplicates
    match_attrs = set(match_attrs)

    # at least, we want to check for name and type
    # name match is treated in this function, so let's remove it from the match_attrs
    # note that 'discard' is safe: if the element to discard does not exist, it won't raise an error
    match_attrs.discard('name')
    # make sure match_attrs contains 'type' because type checking is delegated to another function
    match_attrs.add('type')

    # let's create a pattern for regex matching:
    # remove any opening or trailing underscores from the name
    name_pattern = re.sub('^_+|_+$', '', field.name)
    # if there is any remaining underscore, we will accept any number of underscores for each of those:
    # so we just replace each underscore sequence with regex expression for "one or more underscores"
    name_pattern = re.sub('_+', '_+', name_pattern)
    # accept any opening or trailing underscores
    name_pattern = '_*' + name_pattern + '_*'

    # now loop through the data element fields try to find a case-insensitive match
    for f in field_list:
        if (compare_fields(f, field, attr_filter=match_attrs) and
                re.fullmatch(name_pattern, f.name, re.IGNORECASE)):
            # we found a match in the data element: return it
            return f

    # if here, we could not find a match: just return the input field
    return None

def int_to_mac(macint: int or str) -> str:
    """
    Transforms an integer representation of a mac address to its string form XX:XX:XX:XX:XX:XX
    Args:
        macint: the int representation of a mac address

    Returns: the HEX form of a mac address

    """
    return ":".join(re.findall("..", "%012x" % macint)).upper()
