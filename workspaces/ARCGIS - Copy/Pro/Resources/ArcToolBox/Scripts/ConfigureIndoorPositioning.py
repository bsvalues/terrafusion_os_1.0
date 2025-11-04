# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
 Copyright 2017 - 2018 Esri
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
------------------------------------------------------------------------------
 requirements: ArcGIS 2.1 + Standard or Advanced, Python 3.4+
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
------------------------------------------------------------------------------
* 11/21/2017 - mfunk - original writeup
* 05/03/2018 - mfunk - change conditions names
* 05/17/2018 - mfunk - fix name change overwrite
------------------------------------------------------------------------------
'''
from __future__ import print_function
import arcpy
import os
import pandas as pd
import numpy as np
import ast
import sys
import traceback
import datetime
import re
import math
import re
import time
from operator import itemgetter
import base64
import xml.etree.ElementTree as ET
import IndoorsUtilsModule


class LicenseError(Exception):
    pass


class ConfigureIndoorPositioning(object):
    def __init__(self):
        self.IndoorsAPIKeyField = "ELSS_API_KEY"
        self.IndoorsEncyptionKeyField = "ELSS_ENCRYPTION_KEY"
        self.IndoorsBuildidIdField = "ELSS_BUILDING_ID"
        self.ConfigTableFields = ['CONFIG_KEY', 'CONFIG_VALUE']
        self.ConfigTableName = "IndoorsConfig"

        self.execute()

    def xor_crypt_string(self, inputMessage, key):
        try:
            kIdx = 0
            cryptStr = ""
            for i in range(len(inputMessage)):
                cryptStr = cryptStr + chr(ord(inputMessage[i]) ^ ord(key[kIdx]))
                # use the mod operator - % - to cyclically loop through the keyword
                kIdx = (kIdx + 1) % len(key)
            return cryptStr
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180102)
            arcpy.AddError("{0}".format(e))
            return None

    def addKeyToConfig(self, inputWorkspace, apiKey, encryptKey, configTable):
        try:
            fields = self.ConfigTableFields
            apiRowUpdated = False
            encryptRowUpdated = False
            # Create update cursor
            with arcpy.da.UpdateCursor(configTable, fields) as cursor:
                for row in cursor:
                    if(row[0] == self.IndoorsAPIKeyField):
                        row[1] = apiKey
                        cursor.updateRow(row)
                        apiRowUpdated = True
                    if(row[0] == self.IndoorsEncyptionKeyField):
                        row[1] = encryptKey
                        cursor.updateRow(row)
                        encryptRowUpdated = True

            if apiRowUpdated == False:
                with arcpy.da.InsertCursor(configTable, fields) as cursor:
                    cursor.insertRow((self.IndoorsAPIKeyField, apiKey))
            if encryptRowUpdated == False:
                with arcpy.da.InsertCursor(configTable, fields) as cursor:
                    cursor.insertRow((self.IndoorsEncyptionKeyField, encryptKey))
            return True
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180103)
            arcpy.AddError(arcpy.GetMessages(2))
            return False
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180103)
            arcpy.AddError("{0}".format(e))
            return False

    def addBuildingIdToConfig(self, inputWorkspace, buildingId, configTable):
        try:
            fields = self.ConfigTableFields
            rowUpdated = False
            # Create update cursor
            with arcpy.da.UpdateCursor(configTable, fields) as cursor:
                for row in cursor:
                    if(row[0] == self.IndoorsBuildidIdField):
                        row[1] = buildingId
                        cursor.updateRow(row)
                        rowUpdated = True
            if rowUpdated == False:
                with arcpy.da.InsertCursor(configTable, fields) as cursor:
                    cursor.insertRow((self.IndoorsBuildidIdField, buildingId))
            return True
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180104)
            arcpy.AddError(arcpy.GetMessages(2))
            return False
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180104)
            arcpy.AddError("{0}".format(e))
            return False

    def execute(self):
        inputWorkspace = None
        try:
            # need *any* level of desktop or server license
            minimum_basic_license = ["ArcView", "ArcEditor", "ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_basic_license:
                raise LicenseError

            # Get and validate parameters
            inputWorkspace = arcpy.GetParameterAsText(0)

            databaseProperties = IndoorsUtilsModule.getDatabaseProperties(inputWorkspace)
            self.isLegacyDataset = databaseProperties["isLegacyDataset"]
            self.indoorsDatasetName = databaseProperties["indoorsDatasetName"]
            self.sdeQualifier = databaseProperties["sdeQualifier"]

            if inputWorkspace:
                if self.isLegacyDataset:
                    isDataValid, errorMessage =  IndoorsUtilsModule.validateIndoorsWorkspace(inputWorkspace)
                    if isDataValid == False:
                        if errorMessage == "Input Workspace does not exist.":
                            arcpy.AddIDMessage ("ERROR", 837, inputWorkspace)
                            return
                        else:
                            arcpy.AddIDMessage("ERROR", 180101)
                else:
                    configTable = self.createConfigTableLatestDataset(inputWorkspace)



            inputEncryptKey = arcpy.GetParameterAsText(1)
            inputAPIKey = arcpy.GetParameterAsText(2)
            buildingId = arcpy.GetParameterAsText(3)

            # Get IndoorsConfig table from workspace
            configTable = IndoorsUtilsModule.getQualifiedNameTable(inputWorkspace, self.ConfigTableName)
            if not arcpy.Exists(configTable):
                arcpy.AddIDMessage("ERROR", 110, configTable)
                return

            # Create cyphered text for API key
            cypheredText = self.xor_crypt_string(inputAPIKey, inputEncryptKey)
            if cypheredText is None:
                return
            # Encrypt the key
            byteEncryptKey = base64.b64encode(bytes(inputEncryptKey, 'utf-8'))
            # Encrypt the API cypher
            byteAPIKey = base64.b64encode(bytes(cypheredText, 'utf-8'))
            # Write configuration information to Indoors Configuration table
            if not self.addKeyToConfig(inputWorkspace, byteAPIKey, byteEncryptKey, configTable):
                return
            if not self.addBuildingIdToConfig(inputWorkspace, buildingId, configTable):
                return

            arcpy.AddIDMessage("INFORMATIVE", 180105)
        except LicenseError:
            # A Desktop license is not available or could not be initialized.
            arcpy.AddIDMessage("ERROR", 180005)
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
        finally:
            arcpy.SetParameter(4, inputWorkspace)
            arcpy.CheckInExtension("Indoors")

    def createConfigTableLatestDataset(self, inputWorkspace):
        try:
            if not inputWorkspace:
                return
            # check for the config table and create
            configTable = os.path.join(inputWorkspace, self.sdeQualifier + self.ConfigTableName)
            if not arcpy.Exists(configTable):
                arcpy.CreateTable_management(inputWorkspace, self.ConfigTableName, None, None, "Indoors Configuration")
                arcpy.AddField_management(configTable, "CONFIG_KEY", 'TEXT', None, None, 50, "Config Key")
                arcpy.AddField_management(configTable, "CONFIG_VALUE", 'TEXT', None, None, 5000, "Config Value")
                rows = [("VERSION", "1.1"),
                        ("INDOORSWEB_URL", ""),
                        ("DEVICE_MONITOR_ENDPOINT_FEATURESERVICE", ""),
                        ("LOCATION_TRANSMISSION_FREQUENCY", ""),
                        ("LOCATION_STORE_AND_FORWARD_FREQUENCY", ""),
                        ("LOCATION_TRANSMIT_IF_STATIONARY", ""),
                        ("LOCATION_STORE_AND_FORWARD_MAX_POINTS", "")]
                with arcpy.da.InsertCursor(configTable, ["CONFIG_KEY", "CONFIG_VALUE"]) as cursor:
                    for row in rows:
                        cursor.insertRow([row[0], row[1]])
            return configTable
        except:
            return None

if __name__ == '__main__':
    ConfigureIndoorPositioning()
