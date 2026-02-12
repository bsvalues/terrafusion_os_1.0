import os
import re
from typing import List, Collection
from urllib.parse import urljoin

import arcgis
import arcgis.auth._auth._negotiate
import arcpy
import ips.const as c
# Since validation uses utils and utils uses validation etc, etc...
# https://stackoverflow.com/questions/7336802/how-to-avoid-circular-imports
# -in-python
import ips.utils as u
import ips.utils_db as u_db
import numpy as np
import pandas as pd
import requests
import urllib3


class LicenseError(Exception):
    pass


class AttachmentTableError(Exception):
    def __init__(self, table):
        self.table = table


class FeatureServiceError(Exception):
    pass


class NonEditableFeatureServiceError(Exception):
    pass


class MultiSiteError(Exception):
    pass


class EmptyRadiomapError(Exception):
    pass


# TODO: rename this to NoValidRecordingsError
class NoValidRecordings(Exception):
    pass


class PendingEditsError(Exception):
    pass


# TODO: replace NoValidRecordings with NoValidFeaturesError
class NoValidFeaturesError(Exception):
    """
    Raised when an input does not contain any valid feature.
    This is different from the case where the input if empty.
    This error is thrown when the input was full, but all the
    records were dropped during the validation
    """

    def __init__(self, input_param_name):
        self.input_param_name = input_param_name


class UploadAttachmentError(Exception):
    def __init__(self, oid, attachment_local_path):
        self.oid = oid
        self.attachment_local_path = attachment_local_path


def has_license() -> bool:
    """checks if the necessary licenses are present.

    IPS tools are available under the following conditions:
        - the user belongs to an organization with the "ips"
          organizational capability
        - the user has either a "GIS Professional Standard" or
          a "GIS Professional Advanced" license
        - the user is entitled with the "arcgisips" User Type Extension
        - the user is of type "Creator" or "GIS Professional Standard/Advanced"

    :return: check license conditions
    :rtype: bool
    """
    return has_pro_license() and has_ips_org_capability() and \
        has_privileges_and_type_extension()


def has_pro_license() -> bool:
    """Checks if the user has Standard or Advanced ArcGIS Pro license enabled
    Returns:
        _ : True if 'Standard' or 'Advanced' license is used
    """
    # only accept ArcGIS Pro Standard or Advanced Licenses
    accepted_pro_license_types = ['Standard', 'Advanced']

    # check for ArcGIS Pro Standard or Advance License
    return arcpy.GetInstallInfo()['LicenseLevel'] in \
        accepted_pro_license_types


def has_privileges_and_type_extension() -> bool:
    """Checks if the active user has the appropriate user type and the ips UTE
    Returns:
        _ : True if the user is type GIS Professional Standard/Advanced or
        Creator AND is assigned the ArcGIS IPS User Type Extension

    """
    try:
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

        # only accept user create item privilegs
        accepted_privileges = 'portal:user:createItem'
        # only accept arcgisips UTE
        accepted_ute = 'arcgisips'

        portal_url = arcpy.GetActivePortalURL()

        token = arcpy.GetSigninToken()
        if token is None:
            # application not signed-in
            return False

        sign_in_token = token['token']
        params = {
            'f': 'json',
            'token': sign_in_token,
            'returnUserLicenseTypeExtensions': True,
        }

        user_data_url = urljoin(portal_url, 'sharing/rest/community/self')
        response = requests.post(
            user_data_url,
            params=params,
            verify=False,
            auth=arcgis.auth._auth._negotiate.EsriHttpNegotiateAuth()
        )
        response_json = response.json()

        if 'userLicenseTypeExtensions' not in response_json or \
                'privileges' not in response_json:
            return False

        # check userLicense Type Extensions (UTE) for arcgisips
        has_ute = accepted_ute in [ute.lower() for ute in
                                   response_json['userLicenseTypeExtensions']]

        # check for privileges
        has_privileges = accepted_privileges in response_json['privileges']

        return has_ute and has_privileges
    except Exception:
        return False


def has_ips_org_capability():
    """checks if the active portal has the ips org capability enabled

    :return: check the organizational capability
    :rtype: bool
    """

    try:
        url = arcpy.GetActivePortalURL()
        if url is not None:
            # get portal id
            portal_desc = arcpy.GetPortalDescription(url)

            if "orgCapabilities" not in portal_desc:
                return False

            for org_capabilities_dict in portal_desc.get("orgCapabilities"):
                org_cap_id = org_capabilities_dict.get("id")
                org_cap_status = org_capabilities_dict.get("status")
                if org_cap_id.lower() == 'ips' and (
                        not org_cap_status or org_cap_status.lower() !=
                        'expired'):
                    return True
        return False
    except Exception:
        return False


def check_data_element_type(
        data_element, accepted_data_types: Collection[str]) -> bool:
    """check if a data element is set to an accepted data type

    :param data_element: data element
      (Table, Table View, Layer, Feature Class, ...)
    :param accepted_data_types: a collection of data type to check against
    :return: check_result: boolean
    """
    try:
        desc = arcpy.Describe(data_element)
        return desc.dataElementType in accepted_data_types
    except Exception:
        return False


def check_geometry_type(
        data_element, accepted_geometry_types: List[str]) -> bool:
    """checks if the given data_element has a geometry and if this is
    one of the given accepted types

    :param data_element: Feature class or layer
    :param accepted_geometry_types: list of accepted geometry types
    :return: bool
    """
    de_desc = arcpy.Describe(data_element)

    if de_desc.dataElementType != 'DEFeatureClass':
        # Error: Invalid input data.
        return False
    elif de_desc.shapeType not in accepted_geometry_types:
        # ERROR: invalid geometry.
        return False
    else:
        return True


def check_schema(
        data_element,
        xml_schema_path: str,
        xml_element_name: str,
        field_attr_filter: List[str] = None,
        is_in_dataset: bool = False,
        fields_to_check: List = None
) -> bool:
    """check if the data_element fits the expected schema.

    Shape field (if present) is only checked for existence.
    Shape-related fields (Shape_Length and Shape_Area) are not checked.

    :param data_element: the data element to check
    :type data_element: Table View, Table, Layer, or Feature Class
    :param xml_schema_path: path to the xml schema
    :type xml_schema_path: str
    :param xml_element_name: name of the data element in the xml schema
      to compare against
    :type xml_element_name: str
    :param field_attr_filter: list of arcpy.Field attributes to check for.
      If None, check all the attributes. possible values: [
        'name', 'aliasName', 'type', 'domain', 'length', 'precision', 'scale',
        'editable', 'isNullable', 'required', 'defaultValue']
    :type field_attr_filter: List[str]
    :param is_in_dataset: Indicates whether the schema is inside a dataset in
    XML
    :type is_in_dataset: bool
    :param fields_to_check:list of fields that needs to be checked if they exist
      in the given data_element. If None, check all the fields
    :type fields_to_check:Lst[str]

    :return: bool: True if the schema of the given table matches
      the one in the xml definition
    """
    base_path = './WorkspaceDefinition/DatasetDefinitions/DataElement/Children/DataElement' \
        if is_in_dataset else './WorkspaceDefinition/DatasetDefinitions/DataElement/'
    xml_fields, xml_de_type, _ = u.get_schema_info_from_xml(
        xml_schema_path=xml_schema_path,
        data_element_name=xml_element_name,
        base_path=base_path
    )

    de_desc = arcpy.Describe(data_element)
    de_fields = de_desc.fields

    if xml_de_type == 'DEFeatureClass':
        if de_desc.dataElementType != 'DEFeatureClass':
            # the xml schema has a geometry field (is a FC),
            # the given data element doesn't
            return False

        # if we are checking a feature class we need to exclude shape-related fields
        # because they are very different in different DBMS
        xml_fields = [f for f in xml_fields if f.type.lower() != 'geometry' and 'shape' not in f.name.lower()]

    # if we have been given a specific list of fields to check, filter the xml_fields
    if fields_to_check is not None:
        xml_fields = [f for f in xml_fields if f.name in fields_to_check]

    # when here we are sure that the xml and de are of the same type (table or FC)
    # and that we have excluded shape related fields.
    # The only special fields that may still remain are OID and GlobalID, which we treat differently
    for xml_field in xml_fields:
        if xml_field.type.lower() == 'oid' and not de_desc.hasOID:
            return False
        elif xml_field.type.lower() == 'globalid' and not de_desc.hasGlobalID:
            return False
        else:
            if u.find_matching_field(field=xml_field, field_list=de_fields,
                                     match_attrs=field_attr_filter) is None:
                # One of the requested fields was not found in the data element, early terminate
                return False

    # all matched!
    return True


def check_domain_exists(workspace, domainnames: list) -> bool:
    """check if the domain exists in the current workspace

    :param workspace: the workspace to check
    :param domainnames: list of domains to check existence of
    :return: bool: True if the domain of the given table/feature class
      already exists in the workspace
    """
    de_domains = arcpy.da.ListDomains(workspace)
    for domain in de_domains:
        if domain.name in domainnames:
            return True
    return False


def check_value_exists(table: str, field_name: str, dataset_name: str) -> bool:
    """Checks if a given values exists for the field in the table

    Args:
        table: Path of Input Table
        field_name: Name of the field that needs to be checked for the given value
        dataset_name: Values as entered by the user
    Returns: True -> If the name already exits in the table
             False -> If the name doesn't exist in the table
    """
    where_clause = f"{field_name} = '{dataset_name}'"
    with arcpy.da.SearchCursor(table, field_name, where_clause) as cursor:
        try:
            next(cursor)
            return True
        except StopIteration:
            return False


def check_coords_wgs84(lats, lons):
    """check range of coordinates

    checks if coordinates are in the correct range and also
    if coordinates are not all 0

    :param lats: np.ndarray
    :param lons: np.ndarray
    :return: check_result:
    """
    # if field is not set i protobuf, appears to be 0
    fields_set_check = not (np.all((lats == 0.)) and np.all((lons == 0.)))
    # consider floating point comparisons
    lat_range_check = np.all(
        np.isclose(np.abs(lats), 90.0) | ((lats <= 90) & (lats >= -90)))
    lon_range_check = np.all(
        np.isclose(np.abs(lons), 180.) | ((lons <= 180) & (lons >= -180)))
    return bool(fields_set_check and lat_range_check and lon_range_check)


def is_feature_service(gp_parameter):
    """Checks if the input is a feature service table
    :param gp_parameter: table or table view
    :return: bool
    """
    catalog_path = arcpy.Describe(gp_parameter).catalogPath
    # TODO didn't find one, but it feels like there
    #  should be a function to check
    return catalog_path.startswith('http')


def is_feature_service_editable_by_user(
        gis=arcgis.gis.GIS,
        layer=arcgis.features.FeatureLayer) -> None:
    """
    Checks if the given feature layer can be edited by the logged-in user of gis.
    In case of failure raises the NonEditableFeatureServiceError.

    Args:
        gis: the connection to the portal object
        layer: the web feature layer

    Raises:
        v.NonEditableFeatureServiceError

    Returns:
        None
    """
    try:
        layer_is_creatable = 'Create' in layer.properties.capabilities
        # administrators or owners of features services have privileges to edit them
        user_is_owner = gis.users.me.username == gis.content.get(layer.properties['serviceItemId']).owner
        user_is_admin = gis.users.me.role == 'org_admin'
        if not (layer_is_creatable or user_is_owner or user_is_admin):
            raise NonEditableFeatureServiceError
    except Exception as e:
        raise NonEditableFeatureServiceError


    return


def has_attachments(table):
    """
    Check if attachment exits for the Feature service or feature class within
    GDB

    If feature layer has attachments enabled it returns True else returns False
    :param table: table or table view
    :return Boolean
    """
    table_description = arcpy.Describe(table)
    table_path = u_db.valid_url(table_description.catalogPath)
    if table_path.startswith('http'):
        # if the given table is a feature service
        layer = arcgis.features.FeatureLayer(
            table_path,
            gis=u.create_gis_connect())
        return layer.properties.get('hasAttachments')

    else:
        # the given table is a feature class in a local database
        table_source_path = os.path.dirname(table_description.catalogPath)
        relationship_classes = table_description.relationshipClassNames
        if len(relationship_classes) > 0:
            for relationship_class in relationship_classes:
                relation_describe = arcpy.Describe(
                    os.path.join(table_source_path, relationship_class))
                if relation_describe.isAttachmentRelationship:
                    return True
    return False


def has_valid_crs(feature_class) -> bool:
    """
    Returns false if the Feature Class has 'Unknown' or 'Custom' spatial
    Reference System.
    We reject these because the transformation to WGS84 is not possible.

    Args:
        feature_class: the path to the feature class

    Returns:
        False if the spatial Reference is either 'Unknown' or 'Custom'.
    """
    return arcpy.Describe(feature_class).spatialReference.factoryCode != 0


def has_valid_first_letter(data_element: str) -> bool:
    """Checks if a data element (class, dataset, gdb, field) name has a valid
    first letter.
    ArcGIS Pro accepts only word characters (of any language) or underscore as
    first character.

    :param data_element: the name of the feature class, dataset, gdb, field
    :type data_element: str
    :return: True if the name has a valid first character else false
    :rtype: Boolean
    """
    # Valid first characters are anything that is: ^\d -> not a digit number or
    # ^\W-> anything that is not a word character
    VALID_FIRST_LETTER = re.compile(r"^[^\W\d]")
    return bool(re.match(VALID_FIRST_LETTER, data_element)) and \
        data_element[0] == arcpy.ValidateTableName(data_element)[0]


def has_valid_name(data_element):
    """Checks if a data element (class, dataset, gdb, field) name contains only
    valid characters.
    ArcGIS Pro accepts only word characters (of any language) or underscore as
    first character and word characters (of any language), underscore and
    numbers in other positions.

    :param data_element: the name of the feature class, dataset, gdb, field
    :type data_element: str
    :return: True if the name contains only valid characters else false
    :rtype: Boolean
    """
    VALID_NAME = re.compile(r"[^\W\d]\w+")
    return bool(re.fullmatch(VALID_NAME, data_element)) and \
        data_element == arcpy.ValidateTableName(data_element)


def has_valid_length(data_element, length=160):
    """Checks if a data element (class, dataset, gdb, field) name has valid
    length.
    ArcGIS Pro accepts at maximum 160 characters for feature dataset and
    feature class, 64 characters for field name and the number of characters
    the OS allows in a folder name for Geodatabase.

    :param data_element: the name of the feature class, dataset, gdb, field
    :type data_element: str
    :length: the maximum length
    :type length: int
    :return: True if the name contains only valid characters else false
    :rtype: Boolean
    """
    return len(data_element) <= length


def validate_single_site(df: pd.DataFrame) -> None:
    """Validates that the given dataframe belongs to a single site

    Args:
        df: a dataframe containing SITE_ID column

    Raises:
        MultiSiteError if multiple SITE_ID values
    """
    site_ids = set([v for v in df[c.SITE_ID_FIELD_NAME].values if v])

    # if more than one site -> raise exception
    if len(site_ids) > 1:
        raise MultiSiteError


def is_valid_mac_address(mac_address: str) -> bool:
    """checks if the given string is a valid MAC address

    Args:
        mac_address: string to verify

    Returns: True if it is a valid mac address, False otherwise

    """
    # Regular expression pattern for a MAC address
    mac_pattern = r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'

    # Check if the string matches the pattern
    return bool(re.match(mac_pattern, mac_address))


def is_ArcGIS_Pro() -> bool:
    """
    Check if the script is executed within Pro environment
    Returns:True if it within Pro, False otherwise

    """
    try:
        aprx = arcpy.mp.ArcGISProject("CURRENT")
        if aprx:
            return True
        else:
            return False
    except Exception as e:
        return False
