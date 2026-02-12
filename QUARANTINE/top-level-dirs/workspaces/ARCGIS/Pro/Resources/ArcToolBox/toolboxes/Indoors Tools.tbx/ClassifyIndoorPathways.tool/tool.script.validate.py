import arcpy
import requests
import os

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.parameters =  arcpy.GetParameterInfo()

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

        units_fields = ["FACILITY_NAME", "FACILITY_ID", "LEVEL_ID", "LEVEL_NAME", "LEVEL_NUMBER", "VERTICAL_ORDER"]
        pathways_fields = ["FACILITY_NAME", "FACILITY_ID", "LEVEL_NAME_FROM", "PATHWAY_RANK", "LENGTH_3D", "VERTICAL_ORDER"]

        units_layer = self.parameters[0].value
        pathways_layer = self.parameters[1].value

        if self.compareSpatialReference(units_layer, pathways_layer) == False:
            self.parameters[1].setIDMessage("ERROR", 180368)

        isLegacy = self.isDatabaseLegacy(units_layer)

        if isLegacy is None:
            self.missingFeatureClasses = [fc.title() for fc in self.missingFeatureClasses]
            self.parameters[0].setIDMessage("ERROR", 180307, ", ".join(self.missingFeatureClasses))
            return

        if isLegacy == False:
            units_fields = ["UNIT_ID", "USE_TYPE", "LEVEL_ID"]

        if (self.parameters[0].value and self.parameters[0].altered and self.parameters[0].hasError() == False) and (
                self.parameters[1].value and self.parameters[1].altered and self.parameters[1].hasError() == False):
            if arcpy.Describe(pathways_layer).spatialReference.factoryCode != arcpy.Describe(
                    pathways_layer).spatialReference.factoryCode:
                self.parameters[0].setIDMessage("ERROR", 180336)
                return

        if (self.parameters[0].value and self.parameters[0].altered and self.parameters[0].hasError() == False):
          field_names = [field.name.upper() for field in arcpy.ListFields(units_layer)]
          for field in units_fields:
            if field.upper() not in field_names:
              self.parameters[0].setIDMessage("ERROR", 180337, field.upper())
              return

        if (self.parameters[1].value and self.parameters[1].altered and self.parameters[1].hasError() == False):
          field_names = [field.name.upper() for field in arcpy.ListFields(pathways_layer)]
          for field in pathways_fields:
            if field.upper() not in field_names:
              self.parameters[1].setIDMessage("ERROR", 180338, field.upper())
              return

        if (self.parameters[0].value and self.parameters[0].altered and self.parameters[0].hasError() == False):
            if hasattr(units_layer, "isFeatureLayer"):
              if units_layer.isFeatureLayer == False:
                self.parameters[0].setIDMessage("ERROR", 180339)
              else:
                selected_oids = units_layer.getSelectionSet()
                if not selected_oids:
                  self.parameters[0].setIDMessage("ERROR", 180340)
                  return
            else:
              self.parameters[0].setIDMessage("ERROR", 180341)

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
                    #get portal id
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
                        params = {'f' : 'json', 'token' : signInToken}
                        if organizationID == "":
                            organizationID = self.getOrganizationID(url, signInToken)
                    else:
                        params = {'f' : 'json'}

                    if organizationID != "":
                        from requests_negotiate_sspi import HttpNegotiateAuth
                        sharingLink = "sharing/rest/portals/{0}/{1}".format(organizationID,"subscriptionInfo")
                        subscriptionUrl = "{0}{1}".format(url,sharingLink)
                        response = requests.post(subscriptionUrl, params = params,verify = False, auth=HttpNegotiateAuth())
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
            params = {'f' : 'json', 'token' : token}
            response = requests.post(portalSelfUrl, params = params,verify = False)
            responseJson = response.json()
            for key in responseJson:
                if key == "id":
                    orgId = responseJson[key]
                    break
            return orgId
        except:
            return orgId

    def compareSpatialReference(self, unitsFC, pathwaysFC):
        try:
            if not unitsFC or not pathwaysFC or not arcpy.Exists(unitsFC) or not arcpy.Exists(pathwaysFC):
                return True
            # Indoors Dataset
            unitsSpRef = arcpy.Describe(unitsFC).spatialReference.name
            # Network Dataset
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
            missingFeatureClasses = []
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
                    else:
                        missingFeatureClasses = list(set(legacyFeatures) - set(fcArr))
                    # Test if non-legacy or latest dataset
                    if len(set(latestFeatures) - set(featuresLatestDataset)) == 0:
                        isLegacyDataset = False
                        break
                    else:
                        missingFeatureClasses = list(set(latestFeatures) - set(featuresLatestDataset))

            return {"isLegacyDataset": isLegacyDataset, "indoorsDatasetName": indoorsDatasetName,
                    "sdeQualifier": sdeQualifier, "missingFeatureClasses" : missingFeatureClasses}
        except:
            return None

    def getWorkspacePath(self, fc):
        dirname = os.path.dirname(arcpy.Describe(fc).catalogPath)
        desc = arcpy.Describe(dirname)
        if hasattr(desc, "datasetType") and desc.datasetType == 'FeatureDataset':
            dirname = os.path.dirname(dirname)
        return dirname

    def isDatabaseLegacy(self, fc):
        if not fc or not arcpy.Exists(fc):
            return True
        ws = self.getWorkspacePath(fc)
        databaseProps = self.getDatabaseProperties(ws)
        isLegacyDataset = databaseProps["isLegacyDataset"]
        self.missingFeatureClasses = databaseProps["missingFeatureClasses"]
        return isLegacyDataset
