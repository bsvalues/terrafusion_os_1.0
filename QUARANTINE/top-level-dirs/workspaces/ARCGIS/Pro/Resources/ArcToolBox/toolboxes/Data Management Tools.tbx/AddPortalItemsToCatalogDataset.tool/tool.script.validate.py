import arcpy
from arcgis.gis import GIS

available_portals = []
content_filter = ["MY_CONTENT", "MY_GROUPS", "MY_ORGANIZATION"]
access_filter = ["PUBLIC", "ORG", "SHARED", "PRIVATE"]
myGrp_filter = ["PUBLIC", "ORG", "SHARED"]

class ToolValidator:
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.portalURL = ''
        self.gis = None
        return

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        portal_URL = arcpy.GetActivePortalURL()
        self.portalURL = portal_URL
        token = arcpy.GetSigninToken()
        if token:
            self.gis = GIS('Pro')
        else:
            self.gis = None
        self.params[2].value = content_filter[0]
        self.params[5].value = access_filter[0]
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""
        portal_URL = arcpy.GetActivePortalURL()
        content_param = self.params[2]
        folders_param = self.params[3]
        groups_param = self.params[4]
        access_param = self.params[5]

        portal_URL_changed = False
        if portal_URL != self.portalURL:
            token = arcpy.GetSigninToken()
            if token:
                self.gis = GIS('Pro')
            else:
                self.gis = None
            self.portalURL = portal_URL
            portal_URL_changed = True
        
        if (not content_param.valueAsText) or (not content_param.hasBeenValidated):
            if not content_param.valueAsText:
                content_param.value = content_filter[0]
            if (content_param.valueAsText == "MY_GROUPS"):
                access_param.filter.list = myGrp_filter
                folders_param.value = []
                folders_param.enabled = False
                groups_param.enabled = True
            else:
                if (content_param.valueAsText == "MY_CONTENT"):
                    folders_param.enabled = True
                    groups_param.value = []
                    groups_param.enabled = False
                else:
                    folders_param.value = []
                    folders_param.enabled = False
                    groups_param.value = []
                    groups_param.enabled = False
                access_param.filter.list = access_filter
            if not access_param.value:
                access_param.value = access_param.filter.list[0]

        if portal_URL_changed:
            groups_param.filter.list = []
            folders_param.filter.list = []
            if self.gis is not None:
                groups = self.getGroups()
                if groups_param.enabled and (groups is not None):
                    groupNames = [group.title for group in groups]
                    groups_param.filter.list = sorted(groupNames, key=lambda s: s.lower())
                folders = self.getPortalFolders()
                if folders_param.enabled and (folders is not None):
                    folderNames = [folder['title'] for folder in folders]
                    folders_param.filter.list = sorted(folderNames, key=lambda s: s.lower())
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        cd_param = self.params[0]
        token = arcpy.GetSigninToken()
        
        if self.portalURL is None or token is None:
            cd_param.setErrorMessage(arcpy.GetIDMessage(2119))
        
        folders_param = self.params[3]
        if (folders_param.valueAsText):
            if not (folders_param.filter.list):
                self.params[3].setErrorMessage(arcpy.GetIDMessage(3715))
        groups_param = self.params[4]
        if (groups_param.valueAsText):
            if not (groups_param.filter.list):
                self.params[4].setErrorMessage(arcpy.GetIDMessage(3714))
        return

    def getGroups(self):
        if self.gis is None:
            return None
        groups = self.gis.users.me.groups
        return groups

    def getPortalFolders(self):
        if self.gis is None:
            return None
        loggedInUser = self.gis.users.me
        folders = loggedInUser.folders
        return folders
