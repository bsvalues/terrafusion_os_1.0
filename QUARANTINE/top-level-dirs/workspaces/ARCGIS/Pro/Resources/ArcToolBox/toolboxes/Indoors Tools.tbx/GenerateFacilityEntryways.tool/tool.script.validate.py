import arcpy
import requests
import urllib3
import re

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params =  arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        if self.params[3].valueAsText:
            poi_layer = self.params[3].value
            floorAwareField = self.getFloorAwareField(poi_layer)
            if floorAwareField is not None:
                self.params[9].value = floorAwareField
        return


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        units_fields = ["FACILITY_NAME", "FACILITY_ID", "LEVEL_ID", "LEVEL_NAME", "LEVEL_NUMBER"]
        levels_fields = ["NAME_SHORT", "LEVEL_ID", "FACILITY_NAME", "FACILITY_ID", "LEVEL_NUMBER"]
        poi_fields = ["FACILITY_ID","LEVEL_NAME", "LEVEL_ID", "LEVEL_NUMBER", "ELEVATION_RELATIVE"]
        levels_fields_new = ['FACILITY_ID', 'LEVEL_ID', 'LEVEL_NUMBER', 'NAME', 'NAME_SHORT', 'VERTICAL_ORDER']
        fields_new =  ["LEVEL_ID"]
        regex = re.compile('^[^\W\d_]\w*$')
        levelIdFieldName = None
        levelsFC = None
        if self.params[0].valueAsText and self.params[0].altered and self.params[0].hasError() == False:
            levels_layer = self.params[0].value
            isOldDataset = self.CheckIndoorDataset(self.getWorkspace(levels_layer))
            if isOldDataset:
                fieldsToValidate = levels_fields
            else:
                fieldsToValidate = levels_fields_new
            if not (self.validateFields(self.params[0], fieldsToValidate)):
                self.params[0].setIDMessage("ERROR", 180251)
            else:
                levelsFC = self.params[0]

        if self.params[1].valueAsText and self.params[1].altered and self.params[1].hasError() == False:
            units_layer = self.params[1].value
            isOldDataset = self.CheckIndoorDataset(self.getWorkspace(units_layer))
            if isOldDataset:
                fieldsToValidate = units_fields
            else:
                fieldsToValidate = fields_new
            if not self.validateFields(self.params[1], fieldsToValidate):
                self.params[1].setIDMessage("ERROR", 180251)
            elif (levelsFC):
                if self.compareSpatialReference(levelsFC, self.params[1]) == False:
                    self.params[1].setIDMessage("ERROR", 180368)

        if self.params[3].valueAsText and self.params[3].altered and self.params[3].hasError() == False:
          poi_layer = self.params[3].value
          isPOIOldDataset = self.CheckIndoorDataset(self.getWorkspace(poi_layer))
          if isPOIOldDataset is not None and isPOIOldDataset == True:
              if not self.validateFields(self.params[3], poi_fields):
                  self.params[3].setIDMessage("ERROR", 180251)
          elif levelsFC:
              if self.compareSpatialReference(levelsFC, self.params[3]) == False:
                  self.params[3].setIDMessage("ERROR", 180368)

        if self.params[2].valueAsText and self.params[2].altered and self.params[2].hasError() == False:
            if levelsFC:
                if self.compareSpatialReference(levelsFC, self.params[2]) == False:
                    self.params[2].setIDMessage("ERROR", 180368)

        if self.params[9].valueAsText and self.params[9].altered and self.params[9].hasError() == False:
            levelIdFieldName = self.params[9].valueAsText
            if (not regex.match(levelIdFieldName) or len(levelIdFieldName) > 64):
                self.params[9].setIDMessage("ERROR", 544, levelIdFieldName)

        if self.params[10].valueAsText and self.params[10].altered and self.params[10].hasError() == False:
            useTypeFieldName = self.params[10].valueAsText
            if (not regex.match(useTypeFieldName) or len(useTypeFieldName) > 64):
                self.params[10].setIDMessage("ERROR", 544, useTypeFieldName)
            elif levelIdFieldName and levelIdFieldName == useTypeFieldName:
                self.params[10].setIDMessage("ERROR", 180262, useTypeFieldName)
                return
        if self.params[5]:
            use_type_value = self.params[5].valueAsText
            if len(use_type_value) > 50:
                self.params[5].setIDMessage("ERROR", 160096)
                return


    def validateFields(self, param, required_fields):
      fields_valid = True
      desc = arcpy.Describe(param)
      if hasattr(desc, "fields") and len(desc.fields) > 0:
          fields = desc.fields
          field_names = []
          for field in fields:
            field_names.append(field.name.upper())
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

    def getWorkspace(self, infc):
        workspace = os.path.dirname(arcpy.Describe(infc).catalogPath)
        if arcpy.Describe(workspace).datatype.lower() == "featuredataset":
            return os.path.dirname(workspace)
        else:
            return workspace

    def CheckIndoorDataset(self, inputWorkspace):
        try:
            arcpy.env.workspace = inputWorkspace
            isLegacyDataset = None
            IndoorFCList = ["deadzones", "details", "events", "facilities", "levels", "pointsofinterest",
                            "sections", "sites", "trackingzones", "units", "zones"]
            NewDatasetFCList = ["Details", "Facilities", "Levels", "Sites", "Units"]

            legacyFeatures = [x.lower() for x in IndoorFCList]
            latestFeatures = [x.lower() for x in NewDatasetFCList]
            datasetList = arcpy.ListDatasets("*", "Feature")

            fcArr = []
            featuresLatestDataset = []
            if datasetList:
                for dataset in datasetList:
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

            return isLegacyDataset
        except:
            return None

    def getFloorAwareField(self, targetFC):
        try:
            desc = arcpy.Describe(targetFC)
            project = arcpy.mp.ArcGISProject("CURRENT")
            if (project == None):
                return None
            else:
                currentMap = project.activeMap.name
                for map in project.listMaps():
                    if (map.name == currentMap):
                        for lyr in map.listLayers():
                            layer_cim = None
                            try:
                                if hasattr(lyr, 'dataSource'):
                                    if (lyr.dataSource == desc.catalogPath and lyr.isFeatureLayer):
                                        layer_cim = lyr.getDefinition('V2')
                                    elif "Dataset" in lyr.dataSource:
                                        layerSource = lyr.dataSource.split(",")
                                        datasetProps = layerSource[len(layerSource) - 1]
                                        datasetName = datasetProps.split("=")
                                        datasetName = datasetName[1]
                                        if (datasetName == desc.baseName):
                                            layer_cim = lyr.getDefinition('V2')
                                    if layer_cim is not None and layer_cim.featureTable is not None and layer_cim.featureTable.floorAwareTableProperties is not None:
                                        cimFeatureTable = layer_cim.featureTable
                                        if cimFeatureTable.floorAwareTableProperties.floorField is not None:
                                            floorAwareField = cimFeatureTable.floorAwareTableProperties.floorField
                                            return floorAwareField
                            except:
                                continue

            return None
        except Exception as e:
            return None

    def compareSpatialReference(self, levelsFC, inputFC):
        try:
            if not levelsFC or not inputFC:
                return True
            if arcpy.Exists(levelsFC) == False or arcpy.Exists(inputFC) == False:
                return True
            levelsFCSpatialRef = arcpy.Describe(levelsFC).spatialReference.name
            inputFCSpatialRef = arcpy.Describe(inputFC).spatialReference.name
            if levelsFCSpatialRef != inputFCSpatialRef:
                return False
            return True
        except:
            return False
