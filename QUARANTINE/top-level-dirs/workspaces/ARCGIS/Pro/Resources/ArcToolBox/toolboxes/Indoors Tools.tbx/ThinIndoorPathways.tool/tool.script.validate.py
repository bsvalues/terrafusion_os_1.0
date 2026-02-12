import arcpy
import requests
import urllib3

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
        floor_fields = ['elevation_relative', 'facility_id', 'level_id', 'level_number', 'name', 'name_short', 'vertical_order']
        floor_fields_new = ['facility_id', 'level_id', 'level_number', 'name', 'name_short', 'vertical_order']
        prelim_pathway_fields = ['angle', 'facility_id', 'facility_name', 'length_3d', 'level_name_from', 'level_name_to', 'path_edge_distance', 'pathway_rank', 'pathway_type', 'travel_direction', 'vertical_order']
        target_pathway_fields = ['facility_id', 'facility_name', 'length_3d', 'level_name_from', 'level_name_to', 'pathway_rank', 'pathway_type', 'travel_direction', 'vertical_order']

        prelim_transitions_fields = ['facility_id', 'facility_name', 'height_from', 'height_to', 'length_3d', 'level_name_from', 'level_name_to', 'path_edge_distance', 'transition_rank', 'transition_type', 'vertical_order_from', 'vertical_order_to', 'travel_direction']
        target_transitions_fields = ['facility_id', 'facility_name', 'height_from', 'height_to', 'length_3d', 'level_name_from', 'level_name_to', 'transition_rank', 'transition_type', 'vertical_order_from', 'vertical_order_to', 'travel_direction']
        routablelocation_fields = ['level_id']
        levelsFC = None

        if self.params[0].valueAsText and self.params[0].altered and self.params[0].hasError() == False:
          isOldDataset = self.CheckIndoorDataset(self.getWorkspace(self.params[0]))
          if isOldDataset:
              fieldsToValidate = floor_fields
          else:
              fieldsToValidate = floor_fields_new
          if not (self.validateFields(self.params[0], fieldsToValidate)):
            self.params[0].setIDMessage("ERROR", 30108, self.params[0].valueAsText)
          else:
            levelsFC = self.params[0]

        #pathways and target pathways
        if self.params[1].valueAsText and self.params[1].altered and self.params[1].hasError() == False:
          if not self.validateFields(self.params[1], prelim_pathway_fields):
            self.params[1].setIDMessage("ERROR", 30108, self.params[1].valueAsText)
          elif(levelsFC):
            if self.compareSpatialReference(levelsFC, self.params[1]) == False:
              self.params[1].setIDMessage("ERROR", 180368)

        #transitions and target transitions
        if self.params[2].valueAsText and self.params[2].altered and self.params[2].hasError() == False:
          if not self.validateFields(self.params[2], prelim_transitions_fields):
            self.params[2].setIDMessage("ERROR", 30108, self.params[2].valueAsText)
          elif(levelsFC):
            if self.compareSpatialReference(levelsFC, self.params[2]) == False:
              self.params[2].setIDMessage("ERROR", 180368)

        #routable locations

        if self.params[3].valueAsText and self.params[3].altered and self.params[3].hasError() == False:
          routable_locations = self.params[3].valueAsText.replace("'", "").split(";")
          for routable_location in routable_locations:
              if routable_location:
                #isOldDataset = self.CheckIndoorDataset(self.getWorkspace(routable_location))
                #if isOldDataset:
                  fieldsToValidate = routablelocation_fields
                  if not self.validateFields(routable_location, fieldsToValidate):
                    floorField = self.getFloorAwareField(routable_location)
                    if floorField == None:
                        self.params[3].setIDMessage("ERROR", 180218, routable_location)
                    else:
                        #check length
                        poi_fields = arcpy.ListFields(routable_location)
                        for field in poi_fields:
                            if(field.name.upper() == floorField.upper()):
                                if field.length < 255:
                                    self.params[3].setIDMessage("ERROR", 130034, field.name)

              if levelsFC:
                if self.compareSpatialReference(levelsFC, routable_location) == False:
                  self.params[3].setIDMessage("ERROR", 180368)

        if self.params[4].valueAsText and self.params[4].altered and self.params[4].hasError() == False:
          isFieldsValid = self.validateFields(self.params[4], target_pathway_fields)
          if not isFieldsValid:
            self.params[4].setIDMessage("ERROR", 30108, self.params[4].valueAsText)
          elif isFieldsValid:
              fcNameArr = arcpy.Describe(self.params[4].valueAsText).baseName.split('.')
              targetPathways = fcNameArr[len(fcNameArr) - 1]
              if (targetPathways.lower() == "prelimpathways"):
                  self.params[4].setIDMessage("ERROR", 152)
          elif(levelsFC):
            if self.compareSpatialReference(levelsFC, self.params[4]) == False:
              self.params[4].setIDMessage("ERROR", 180368)

        if self.params[5].valueAsText and self.params[5].altered and self.params[5].hasError() == False:
          isFieldsValid = self.validateFields(self.params[5], target_transitions_fields)
          if not isFieldsValid:
            self.params[5].setIDMessage("ERROR", 30108, self.params[5].valueAsText)
          elif isFieldsValid:
              fcNameArr = arcpy.Describe(self.params[5].valueAsText).baseName.split('.')
              targetTrasitions = fcNameArr[len(fcNameArr) - 1]
              if (targetTrasitions.lower() == "prelimtransitions"):
                  self.params[5].setIDMessage("ERROR", 152)
          elif (levelsFC):
            if self.compareSpatialReference(levelsFC, self.params[5]) == False:
             self.params[5].setIDMessage("ERROR", 180368)



        if self.params[6].value and self.params[6].altered and self.params[6].hasError() == False:
          searchTolerance = self.params[6].value
          if searchTolerance < 0:
            self.params[6].setIDMessage("ERROR", 10153, self.params[6].displayName)
          if isinstance(searchTolerance, float) == True:
            self.params[6].setIDMessage("ERROR", 581, self.params[6].valueAsText)

        if self.params[7].valueAsText and self.params[7].altered and self.params[7].hasError() == False:
          solveCount = self.params[7].value
          if solveCount <= 0:
            self.params[7].setIDMessage("ERROR", 10154, self.params[7].displayName)
          if isinstance(solveCount, float) == True:
            self.params[7].setIDMessage("ERROR", 581, self.params[7].valueAsText)

    def validateFields(self, param, required_fields):
      fields_valid = True
      desc = arcpy.Describe(param)
      if hasattr(desc, "fields") and len(desc.fields) > 0:
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
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
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

    def getOrganizationID(url, token):
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
            indoorsDatasetName = None
            sdeQualifier = None
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
                    fcList = arcpy.ListFeatureClasses("*","",dataset)
                    for fc in fcList:
                        fcNameArr = fc.split('.')
                        fcName = fcNameArr[len(fcNameArr) - 1]
                        if fcName.lower() in legacyFeatures:
                            fcArr.append(fcName.lower())
                        if fcName.lower() in latestFeatures:
                            featuresLatestDataset.append(fcName.lower())
                    #Test if legacy dataset
                    if len(set(legacyFeatures) - set(fcArr)) == 0:
                        isLegacyDataset = True
                        break
                    #Test if non-legacy or latest dataset
                    if len(set(latestFeatures) - set(featuresLatestDataset)) == 0:
                        isLegacyDataset = False
                        break

            return isLegacyDataset
        except:
            return None

    def compareSpatialReference(self, levelsFC, inputFC):
        try:
            if not levelsFC or not inputFC:
                return True
            levelsFCSpatialRef = arcpy.Describe(levelsFC).spatialReference.name
            inputFCSpatialRef = arcpy.Describe(inputFC).spatialReference.name
            if levelsFCSpatialRef != inputFCSpatialRef:
                return False
            return True
        except:
            return False

    def getFloorAwareField(self, routable_location):
        try:
            desc = arcpy.Describe(routable_location)
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
                                    if lyr.dataSource == desc.catalogPath and lyr.isFeatureLayer:
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
