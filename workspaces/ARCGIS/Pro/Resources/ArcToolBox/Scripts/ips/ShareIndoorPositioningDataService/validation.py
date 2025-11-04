# this file will be used for runtime validation only
import xml.etree.ElementTree as ET
from urllib.parse import urljoin

import arcpy
import ips.const as c
import pandas as pd
import requests
from arcgis.auth._auth._negotiate import EsriHttpNegotiateAuth


class DuplicateTitleError(Exception):
    def __init__(self, title):
        self.title = title


class DuplicateIPDSDatasetError(Exception):
    def __init__(self, param_name):
        self.param_name = param_name


def xml_to_dict(xml_string):
    result = {}
    root = ET.fromstring(xml_string)
    result[root.tag] = root.text
    for child in root:
        if len(child) == 0:
            result[child.tag] = child.text
        else:
            result[child.tag] = xml_to_dict(ET.tostring(child))
    return result


def validate_ips_dataservice_guid(title: str, ips_dataset_name: str, dataset_sdf: pd.DataFrame) -> bool:
    """Validates the input parameter IPS Datasets against portal items before sharing a new IPS data service.

    Args:
        title: title for the data service
        ips_dataset_name: parameter depending on the in_ips_dataset
        dataset_sdf: indoor positioning datasets data frame

    Returns:
        True if the title does not exist, GUID does not exist in portal
        else False

    """
    active_portal = arcpy.GetActivePortalURL()
    token = arcpy.GetSigninToken()
    if token is None:
        return False

    sign_in_token = token['token']

    # validate user privilege
    params = {
        'f': 'json',
        'token': sign_in_token
    }

    # validate on guid
    guid = dataset_sdf[c.GLOBAL_ID_FIELD_NAME][0]
    items_data_url = urljoin(active_portal,
                             'sharing/rest/search?filter=typeKeywords:"IndoorPositioningDataService" '
                             'AND type:"Feature Service"')
    response_items = requests.post(
        items_data_url,
        params=params,
        verify=False,
        auth=EsriHttpNegotiateAuth()
    )
    response_items_json = response_items.json()

    if response_items_json["total"] > 0:
        while True:
            for response_item in response_items_json["results"]:
                if response_item.get("url") is not None and response_item["url"].startswith("http"):
                    item_id = response_item['id']
                    metadata_url = urljoin(
                        base=active_portal,
                        url=f'sharing/rest/content/items/{item_id}/info/metadata/metadata.xml?token={sign_in_token}'
                    )
                    response_metadata = requests.get(url=metadata_url, verify=False, auth=EsriHttpNegotiateAuth())
                    response_guid_dict = xml_to_dict(response_metadata.content)
                    if response_guid_dict.get("IndoorPositioningGUID") is not None:
                        item_guid = response_guid_dict["IndoorPositioningGUID"]
                        if item_guid == guid:
                            raise DuplicateIPDSDatasetError(param_name=response_item["title"])

            if response_items_json["nextStart"] > 0:
                params["start"] = response_items_json["nextStart"]

                items_data_url = urljoin(active_portal,
                                         'sharing/rest/search?filter=typeKeywords:"IndoorPositioningDataService" '
                                         'AND type:"Feature Service"')
                response_items = requests.post(
                    items_data_url,
                    params=params,
                    verify=False,
                    auth=EsriHttpNegotiateAuth()
                )
                response_items_json = response_items.json()
            else:
                break

    return True
