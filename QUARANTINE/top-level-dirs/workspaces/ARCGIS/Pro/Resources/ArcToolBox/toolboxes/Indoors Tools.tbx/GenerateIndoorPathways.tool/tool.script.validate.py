import arcpy
import requests
import os


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        levels_fc = self.params[0].value
        if not levels_fc or not arcpy.Exists(levels_fc):
            return
        is_legacy = self.isDatabaseLegacy(levels_fc)
        if is_legacy:
            floor_fields = ['elevation_relative', 'facility_id', 'level_id',
                                'level_number', 'name', 'name_short', 'vertical_order']
        else:
            floor_fields = ['height_relative', 'facility_id', 'level_id',
                            'level_number', 'name', 'name_short', 'vertical_order']
        if is_legacy:
            barrier_fields = ['detail_id', 'facility_id', 'level_id']
        else:
            barrier_fields = ['detail_id', 'level_id']

        pathway_fields = ['angle', 'facility_id', 'facility_name',
                          'length_3d', 'level_name_from', 'level_name_to',
                          'path_edge_distance', 'pathway_rank', 'pathway_type',
                          'travel_direction', 'vertical_order']
        if is_legacy:
            space_fields = ['facility_id', 'level_id', 'unit_id']
        else:
            space_fields = ['level_id', 'unit_id']


        if self.params[0].valueAsText and self.params[0].altered and \
                self.params[0].hasError() == False:
            if not self.validateFields(self.params[0], floor_fields):
                self.params[0].setIDMessage("ERROR", 30108,
                                            self.params[0].valueAsText)
        if self.params[1].valueAsText and self.params[1].altered and \
                self.params[1].hasError() == False:
            if not self.validateFields(self.params[1], barrier_fields):
                self.params[1].setIDMessage("ERROR", 30108,
                                            self.params[1].valueAsText)
        if self.params[2].valueAsText and self.params[2].altered and \
                self.params[2].hasError() == False:
            if not self.validateFields(self.params[2], pathway_fields):
                self.params[2].setIDMessage("ERROR", 30108,
                                            self.params[2].valueAsText)
        if self.params[5].valueAsText and self.params[5].altered and \
                self.params[5].hasError() == False:
            if not self.validateFields(self.params[5], space_fields):
                self.params[5].setIDMessage("ERROR", 30108,
                                            self.params[5].valueAsText)
        if self.compareSpatialReference(self.params[0].value, self.params[2].value) == False:
            self.params[2].setIDMessage("ERROR", 180368)

    def validateFields(self, param, required_fields):
        fields_valid = True
        desc = arcpy.Describe(param)
        fields = desc.fields
        field_names = []
        for field in fields:
            field_names.append(field.name.lower())
        for required_field in required_fields:
            if not required_field in field_names:
                fields_valid = False
        return fields_valid

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        isIndoorsEnabled = self.getLicenseInfo()
        return isIndoorsEnabled

    def getLicenseInfo(self):
        isIndoorsEnabled = False
        try:
            # first try for Pro extension license
            if arcpy.CheckExtension("Indoors").lower() == "available":
                isIndoorsEnabled = True

            # if Indoors extension not available, try for organizational capability 
            # going to check for organizational capability Indoors license first
            if not isIndoorsEnabled:
                url = arcpy.GetActivePortalURL()
                if url is not None:
                    # get portal id
                    orgCapabilities = ""
                    portal_desc = arcpy.GetPortalDescription(url)
                    try:
                        organizationID = portal_desc['id']
                        orgCapabilities = portal_desc['orgCapabilities']
                        if orgCapabilities != "":
                            for capability in orgCapabilities:
                                capabilityID = capability["id"]
                                capabilityStatus = capability["status"]
                                if (capabilityID == "indoors" or capabilityID == "indoorsmaps") and capabilityStatus != "expired" and capabilityStatus != "cancelled":
                                    isIndoorsEnabled = True
                                    return isIndoorsEnabled

                    except:
                        organizationID = ""

                    token = arcpy.GetSigninToken()
                    if token is not None:
                        signInToken = token['token']
                        params = {'f': 'json', 'token': signInToken}
                        if organizationID == "":
                            organizationID = self.getOrganizationID(url,
                                                                    signInToken)
                    else:
                        params = {'f': 'json'}

                    if organizationID != "":
                        from requests_negotiate_sspi import HttpNegotiateAuth
                        sharingLink = "sharing/rest/portals/{0}/{1}".format(
                            organizationID, "subscriptionInfo")
                        subscriptionUrl = "{0}{1}".format(url, sharingLink)
                        response = requests.post(subscriptionUrl, params=params,
                                                verify=False, auth=HttpNegotiateAuth())
                        responseJson = response.json()
                        for key in responseJson:
                            if key == "orgCapabilities":
                                for valueObject in responseJson[key]:
                                    prdInfo = valueObject.get('id')
                                    status = valueObject.get('status')
                                    if status is None:
                                        if prdInfo.lower() == "indoors" or prdInfo.lower() == "indoorsmaps":
                                            isIndoorsEnabled = True
                                            break
                                    else:
                                        if (prdInfo.lower() == "indoors" or prdInfo.lower() == "indoorsmaps") and status.lower() != "expired" and status.lower() != "cancelled":
                                            isIndoorsEnabled = True
                                            break
                    else:
                        return False

            return isIndoorsEnabled
        except Exception:
            return False

    def getOrganizationID(self, url, token):
        orgId = ""
        try:
            portalSelfUrl = "{0}{1}".format(url, "sharing/rest/portals/self")
            params = {'f': 'json', 'token': token}
            response = requests.post(portalSelfUrl, params=params, verify=False)
            responseJson = response.json()
            for key in responseJson:
                if key == "id":
                    orgId = responseJson[key]
                    break
            return orgId
        except:
            return orgId

    def compareSpatialReference(self, levelsFC, pathwaysFC):
        try:
            if not levelsFC or not pathwaysFC or not arcpy.Exists(levelsFC) or not arcpy.Exists(pathwaysFC):
                return True
            # Indoors Dataset
            levelsFC = arcpy.Describe(levelsFC).catalogPath
            pathwaysFC = arcpy.Describe(pathwaysFC).catalogPath
            unitsSpRef = arcpy.Describe(levelsFC).spatialReference.name
            #Network Dataset
            pathwaysSpRef = arcpy.Describe(pathwaysFC).spatialReference.name
            if unitsSpRef != pathwaysSpRef:
                return False
            return True
        except:
            return False

    def getDatabaseProperties(self, inputWorkspace):
        # Returns dictionary {isLegacyDatabase, indoorDatasetName, sdeQualifier}
        # For agidev1.AGI.Indoor, SDE qualifier = "agidev1.AGI", and dataset = Indoor. For feature class agidev1.AGI.Details, sdequaifier = agidev1.AGI
        try:
            INDOORFEATURECLASSES = ["deadzones", "details", "events", "facilities", "levels", "pointsofinterest",
                                    "sections", "sites", "trackingzones", "units", "zones"]
            INDOORFEATURES = ["Details", "Facilities", "Levels", "Sites", "Units"]
            arcpy.env.workspace = inputWorkspace

            isLegacyDataset = None
            indoorsDatasetName = None
            sdeQualifier = None

            legacyFeatures = [x.lower() for x in INDOORFEATURECLASSES]
            latestFeatures = [x.lower() for x in INDOORFEATURES]
            datasetList = arcpy.ListDatasets("*", "Feature")

            fcArr = []
            featuresLatestDataset = []
            if datasetList:
                for dataset in datasetList:
                    datasetSplit = dataset.split(".")
                    indoorsDatasetName = datasetSplit[-1]
                    if len(datasetSplit) > 1:
                        sdeQualifier = ".".join(datasetSplit[:-1]) + "."
                    else:
                        sdeQualifier = ""
                    fcList = arcpy.ListFeatureClasses("*", "", dataset)
                    for fc in fcList:
                        fcNameArr = fc.split('.')
                        fcName = fcNameArr[len(fcNameArr) - 1]
                        if fcName.lower() in legacyFeatures:
                            fcArr.append(fcName.lower())
                        if fcName.lower() in latestFeatures:
                            featuresLatestDataset.append(fcName.lower())
                    # Test if legacy dataset
                    if len(set(legacyFeatures) - set(fcArr)) == 0:
                        isLegacyDataset = True
                        break
                    # Test if non-legacy or latest dataset
                    if len(set(latestFeatures) - set(featuresLatestDataset)) == 0:
                        isLegacyDataset = False
                        break

            return {"isLegacyDataset": isLegacyDataset, "indoorsDatasetName": indoorsDatasetName,
                    "sdeQualifier": sdeQualifier}
        except:
            return None

    def getWorkspacePath(self, fc):
        dirname = os.path.dirname(arcpy.Describe(fc).catalogPath)
        desc = arcpy.Describe(dirname)
        if hasattr(desc, "datasetType") and desc.datasetType == 'FeatureDataset':
            dirname = os.path.dirname(dirname)
        return dirname

    def isDatabaseLegacy(self, levelsFC):
        if not levelsFC or not arcpy.Exists(levelsFC):
            return True
        ws = self.getWorkspacePath(levelsFC)
        databaseProps = self.getDatabaseProperties(ws)
        isLegacyDataset = databaseProps["isLegacyDataset"]
        return isLegacyDataset

