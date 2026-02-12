import arcpy
import os
import requests


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

        self.ConfigTableName = "IndoorsConfig"
        self.ConfigTableFields = ['CONFIG_KEY', 'CONFIG_VALUE']

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""
        arcpy.env.overwriteOutput = True

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        arcpy.env.overwriteOutput = True

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        if self.params[0].valueAsText and self.params[0].altered:
            inputWorkspace = self.params[0].valueAsText
            if os.path.exists(inputWorkspace) == False:
                self.params[0].setIDMessage("ERROR", 110, inputWorkspace)
                return
            configTable = self.getQualifiedNameTable(self.params[0].valueAsText,
                                                     self.ConfigTableName)
            databaseProperties = self.getDatabaseProperties(self.params[0].valueAsText)
            isLegacyDatabase = databaseProperties["isLegacyDataset"]
            if isLegacyDatabase:
                if configTable == "":
                    self.params[0].setIDMessage("ERROR", 180101,
                                                self.ConfigTableName)
                else:
                    if len(arcpy.ListFields(configTable,
                                            self.ConfigTableFields[0])) == 0 or len(
                            arcpy.ListFields(configTable,
                                             self.ConfigTableFields[1])) == 0:
                        self.params[0].setIDMessage("ERROR", 30108,
                                                    self.params[0].valueAsText)

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        isIndoorsEnabled = self.getLicenseInfo()
        return isIndoorsEnabled

    def getQualifiedNameTable(self, inputWorkspace, tableName):
        try:
            qualifiedTableName = ""
            desc = arcpy.Describe(inputWorkspace)
            if hasattr(desc, 'workspaceType'):
                if desc.workspaceType == 'LocalDatabase':
                    qualifiedTableName = os.path.join(inputWorkspace, tableName)
                    if arcpy.Exists(qualifiedTableName):
                        return qualifiedTableName
                    else:
                        return ""
            arcpy.env.workspace = inputWorkspace
            tables = arcpy.ListTables()
            for table in tables:
                if tableName in table:
                    qualifiedTableName = os.path.join(inputWorkspace, table)
                    return qualifiedTableName
            return ""
        except Exception:
            return ""

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

