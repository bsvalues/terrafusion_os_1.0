import arcpy
import requests
import os


class ToolValidator:
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.BIS_CATALOG = 'BisCatalog'
        self.BIS_DETAILS = 'BisDetails'
        self.BIS_BDI = 'BisBDI'
        self.GLOBALID = 'GlobalID'
        return

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        if self.params[0].enabled:
            if self.params[0].value and hasattr(self.params[0].value, 'value'):
                self.params[5].value = self.params[0].value.value  # will check validity of input in updateMessages
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        try:
            # Verify the target workspace does not already contain a BisCatalog, BisDetails, or BisBDI
            if self.params[0].enabled and self.params[0].altered:
                if self.params[0].value and hasattr(self.params[0].value, 'value'):
                    workspace = self.params[0].value.value
                    tw = workspace.lower()
                    if arcpy.Exists(workspace):
                        if tw.endswith(".gdb") or tw.endswith(".sde"):
                            if tw.endswith(".sde"):
                                arcpy.env.workspace = workspace
                                desc = arcpy.Describe(workspace)
                                conn = desc.connectionProperties
                                bis_catalog = os.path.join(workspace, conn.user+'.'+self.BIS_CATALOG)
                                if arcpy.Exists(bis_catalog):
                                    self.params[0].setIDMessage("ERROR", 725, "Target Workspace", bis_catalog)  # %1: Dataset %2 already exists.
                                    return
                                bis_details = os.path.join(workspace, conn.user+'.'+self.BIS_DETAILS)
                                if arcpy.Exists(bis_details):
                                    self.params[0].setIDMessage("ERROR", 725, "Target Workspace", bis_details)  # %1: Dataset %2 already exists.
                                    return
                                bis_bdi = os.path.join(workspace, conn.user+'.'+self.BIS_BDI)
                                if arcpy.Exists(bis_bdi):
                                    self.params[0].setIDMessage("ERROR", 725, "Target Workspace", bis_bdi)  # %1: Dataset %2 already exists.
                                    return
                            else:
                                bis_catalog = os.path.join(workspace, self.BIS_CATALOG)
                                if arcpy.Exists(bis_catalog):
                                    self.params[0].setIDMessage("ERROR", 725, "Target Workspace", bis_catalog)  # %1: Dataset %2 already exists.
                                    return
                                bis_details = os.path.join(workspace, self.BIS_DETAILS)
                                if arcpy.Exists(bis_details):
                                    self.params[0].setIDMessage("ERROR", 725, "Target Workspace", bis_details)  # %1: Dataset %2 already exists.
                                    return
                                bis_bdi = os.path.join(workspace, self.BIS_BDI)
                                if arcpy.Exists(bis_bdi):
                                    self.params[0].setIDMessage("ERROR", 725, "Target Workspace", bis_bdi)  # %1: Dataset %2 already exists.
                                    return
                        else:
                            self.params[0].setIDMessage("ERROR", 90110)  # The workspace is not valid
                            return
                    else:
                        self.params[0].setIDMessage("ERROR", 732, "Target Workspace", workspace)  # %1: Dataset %2 does not exist or is not supported
                        return
        except Exception as ex:
            self.params[0].setErrorMessage("Error in updateMessages: check Target Workspace - {}".format(str(ex)))
        try:
            # Verify the input template is a Table View
            if self.params[1].enabled and self.params[1].altered:
                if self.params[1].value and hasattr(self.params[1].value, 'value'):
                    template = self.params[1].value.value
                    desc = arcpy.Describe(template)
                    if desc.dataType != "Table" and desc.dataType != "TableView":
                        self.params[1].setIDMessage("ERROR", 260013)  # Invalid input format. Only feature classes and tables are supported.
                        return
                    fields = arcpy.ListFields(template)
                    field_names = [f.name.upper() for f in fields]  # sde fields names are upper case
                    if self.GLOBALID.upper() not in field_names:
                        self.params[1].setIDMessage("ERROR", 20009, template)  # Invalid input data %s.
                        return
        except Exception as ex:
            self.params[1].setErrorMessage("Error in updateMessages: check BIS Catalog Template - {}".format(str(ex)))
        return

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        isBathymetryEnabled = self.getLicenseInfo()
        return isBathymetryEnabled

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
            response = requests.post(portalSelfUrl, params=params, verify=False)
            responseJson = response.json()
            for key in responseJson:
                if key == "id":
                    orgId = responseJson[key]
                    break
            return orgId
        except:
            return orgId
