import arcpy
import os
import json
import requests


class ToolValidator:
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.BIS_CATALOG = 'BisCatalog'
        self.DATASETID = 'BisDatasetId'
        self.GLOBALID = 'GlobalID'
        self.SORTED_DATASETID = 'sorted_BisDatasetIds'
        return

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        try:
            if self.params[4].altered:
                if self.params[4].value == True:
                    self.params[5].enabled = True
                else:
                    self.params[5].enabled = False
                    self.params[5].value = False
        except Exception as ex:
            self.params[0].setErrorMessage(
                "Error in updateParameters - ".format(str(ex)))
        return

    def updateMessages(self):
        # check bis workspace
        try:
            if self.params[0].enabled and self.params[0].altered and not self.params[0].hasBeenValidated:
                if self.params[0].value and hasattr(self.params[0].value, 'value'):
                    workspace = self.params[0].value.value
                    tw = workspace.lower()
                    if arcpy.Exists(workspace):
                        if tw.endswith(".gdb") or tw.endswith(".sde") or tw.endswith(".geodatabase"):
                            self.get_BisCatalog_path(workspace)
                        else:
                            self.params[0].setIDMessage("ERROR", 90110)
                    else:
                        self.params[0].setIDMessage("ERROR", 732, "Input BIS Workspace", workspace)
        except Exception as ex:
            self.params[0].setErrorMessage("Error in updateMessages: check BIS Workspace - {}.".format(str(ex)))

        # check if the Target Workspace for the Output Mosaic Dataset is the same as Input BIS Workspace
        try:
            if not self.params[0].hasBeenValidated or not self.params[1].hasBeenValidated:
                if self.params[0].value and self.params[1].value:
                    bis_workspace = self.params[0].value.value
                    mosaic_path = self.params[1].value.value
                    if bis_workspace in mosaic_path:
                        self.params[1].setErrorMessage("Error - The Output Mosaic Dataset Workspace should not be the same as Input BIS Workspace. Please designate a different workspace.")
        except Exception as ex:
            self.params[1].setErrorMessage("Error in updateMessages: check Target Workspace - {}.".format(str(ex)))

        # check query file
        try:
            if self.params[3].enabled and self.params[3].altered and not self.params[3].hasBeenValidated:
                if self.params[3].value and hasattr(self.params[3].value, 'value'):
                    file_path = self.params[3].value.value
                    if file_path:
                        if arcpy.Exists(file_path):
                            try:
                                with open(file_path) as jsonfile:
                                    bathy_query = json.load(jsonfile)
                                if file_path.lower().endswith('.model'):
                                    if self.SORTED_DATASETID not in bathy_query:
                                        self.params[3].setIDMessage("ERROR", 30259, "Model File", "sorted_BisDatasetIds")
                                elif file_path.lower().endswith('.rule'):
                                    if not any('orderRule' in kw for kw in bathy_query):
                                        self.params[3].setIDMessage("ERROR", 30259, "Rule File", "orderRule")
                            except:
                                self.params[3].setIDMessage("ERROR", 814)
                        else:
                            self.params[3].setIDMessage("ERROR", 10061, file_path)  # file does not exist
        except Exception as ex:
            self.params[3].setErrorMessage("Error in updateMessages: check Query File - {}.".format(str(ex)))
        return

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        isBathymetryEnabled = self.getLicenseInfo()
        return isBathymetryEnabled

    def sde_table_ownername(self, workspace):
        """Get SDE table owner name."""
        with arcpy.EnvManager(workspace=workspace):
            for _, _, filenames in arcpy.da.Walk(workspace):  # dirpath, subdirnames, filenames
                if filenames:
                    for filename in filenames:
                        if filename.lower().endswith('.'+self.BIS_CATALOG.lower()):
                            _, owner_name, _ = arcpy.ParseTableName(filename, workspace).split(',')  # gdb_name, owner_name, table_name
                            return True, owner_name
        return False, None

    def get_BisCatalog_path(self, workspace):
        """get BisCatalog path"""
        bis_catalog = ""
        if workspace.lower().endswith(".sde"):  # get owner name from table name rather than connection properties, because table might not be owned by the conneciton user
            flag_owner, owner_name = self.sde_table_ownername(workspace)
            if flag_owner and owner_name:
                bis_catalog = os.path.join(workspace, owner_name.strip()+'.'+self.BIS_CATALOG)
            else:
                self.params[0].setErrorMessage("ERROR - SDE owner name {} is invalid.".format(owner_name))
                return False
        else:
            bis_catalog = os.path.join(workspace, self.BIS_CATALOG)
        # check BisCatalog exists or not
        if arcpy.Exists(bis_catalog):
            fields = arcpy.ListFields(bis_catalog)
            fields_names = [f.name.upper() for f in fields]
            if not (self.GLOBALID.upper() in fields_names):
                self.params[0].setErrorMessage("ERROR - invalid BIS, missing BIS schema = GlobalID.")
                return False, None
        else:
            self.params[0].setErrorMessage("ERROR - invalid BIS, missing BisCatalog - {}.".format(bis_catalog))
            return False, None
        return True, bis_catalog

    def getLicenseInfo(self):
        isBathymetryEnabled = False
        try:
            # check product license level
            if arcpy.CheckProduct("ArcInfo") != "Available" and arcpy.CheckProduct("ArcInfo") != "AlreadyInitialized":
                if arcpy.CheckProduct("ArcEditor") != "Available" and arcpy.CheckProduct("ArcEditor") != "AlreadyInitialized":
                    if arcpy.CheckProduct("ArcView") != "Available" and arcpy.CheckProduct("ArcView") != "AlreadyInitialized":
                        if arcpy.CheckProduct("ArcServer") != "Available" and arcpy.CheckProduct("ArcServer") != "AlreadyInitialized":
                            return False

            # first try for Pro extension license
            if arcpy.CheckExtension("Bathymetry").lower() == "available":
                if arcpy.CheckOutExtension("Bathymetry").lower() == "checkedout":
                    isBathymetryEnabled = True

            # if Bathymetry extension not available, try for organizational capability
            # going to check for organizational capability Bathymetry license first
            if not isBathymetryEnabled:
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
                                if capabilityID == "bathymetry" and capabilityStatus != "expired":
                                    isBathymetryEnabled = True
                                    return isBathymetryEnabled

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
                                        if prdInfo.lower() == "bathymetry":
                                            isBathymetryEnabled = True
                                            break
                                    else:
                                        if prdInfo.lower() == "bathymetry" and status.lower() != "expired":
                                            isBathymetryEnabled = True
                                            break
                    else:
                        return False

            return isBathymetryEnabled
        except Exception:
            return False

    def getOrganizationID(self, url, token):
        orgId = ""
        try:
            portalSelfUrl = "{0}{1}".format(url, "sharing/rest/portals/self")
            params = {'f': 'json', 'token': token}
            response = requests.post(
                portalSelfUrl, params=params, verify=False)
            responseJson = response.json()
            for key in responseJson:
                if key == "id":
                    orgId = responseJson[key]
                    break
            return orgId
        except:
            return orgId
