import arcpy as ARCPY
import os as OS

def setRequired(paramList):
    for param in paramList:
        if param.value is None:
            param.setIDMessage("ERROR", 530)

def clearRequired(paramList):
    for param in paramList:
        if param.hasError():
            if "530" in str(param.message):
                param.clearMessage()

def autoAuthinfo(param):
    if not param.value:
        homeDir = OS.path.expanduser('~')
        files = OS.listdir(homeDir)
        for f in files:
            base, ext = OS.path.splitext(f)
            if base.lower() == '_authinfo':
                param.value = OS.path.join(homeDir, f)
                return

def paramChanged(param, checkValue = False):
    changed = param.altered and not param.hasBeenValidated
    if checkValue:
        if param.value:
            return changed
        else:
            return False
    else:
        return changed

def enableParametersByVariable(enable = [], disable= [], clear = True):
    """ enable and disable list of parameters
    """
    for i in enable:
        i.enabled = True
    for j in disable:
        j.enabled = False
        if clear:
            j.value = None

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup ARCPY and the list of tool parameters."""
        self.params = ARCPY.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        parameters = self.params
        useCAS = parameters[4]
        casHost = parameters[5]
        casPort = parameters[6]
        casUserName = parameters[7]
        casPassword = parameters[8]
        configFile = parameters[9]
        authinfoFile = parameters[10]
        casBool = useCAS.value
        if casBool:
            userBool = casUserName.value is None
            passBool = casPassword.value is None
            authBool = authinfoFile.value is None
            enableParametersByVariable(enable = [casHost, casPort, casUserName, casPassword, authinfoFile],
                                        disable = [configFile])

            #### Auto Populate Authinfo ####
            if userBool and passBool and authBool:
                autoAuthinfo(authinfoFile)

            #### Disable - Remove Authinfo ####
            if not userBool and not passBool:
                authinfoFile.value = None
                authinfoFile.enabled = False
        else:
            enableParametersByVariable(disable = [casHost, casPort, casUserName, casPassword, authinfoFile],
                                       enable = [configFile])

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        parameters = self.params
        sasName = parameters[1]
        useCAS = parameters[4]
        casHost = parameters[5]
        casUserName = parameters[7]
        casPassword = parameters[8]
        authinfoFile = parameters[10]
        if sasName.value is not None:
            sasText = sasName.valueAsText
            if sasText.find("%") == -1:
                #### Only Check and Validate Names w/o % Variable Char(s) ####
                validName = True
                usingWork = False
                try:
                    #### Assure libref.table ####
                    libref, table = sasText.split(".")
                    validName = len(table) > 0 and len(libref) > 0

                    if validName:
                        if libref.upper() == "WORK":
                            usingWork = True
                            validName = False

                    #### Assure Valid SAS Table Name ####
                    if validName:
                        table = ARCPY.ValidateTableName(table, "in_memory")[0:32]
                        sasName.value = libref + "." + table

                except:
                    validName = False
                    pass

                if not validName:
                    if usingWork:
                        parameters[1].setIDMessage("ERROR", 110503)
                    else:
                        parameters[1].setIDMessage("ERROR", 110392)

        #### Required CAS Params ####
        if useCAS.value:
            if casHost.value is None:
                casHost.setIDMessage("ERROR", 530)

            userBool = casUserName.value is None
            passBool = casPassword.value is None
            authBool = authinfoFile.value is None

            #### All Required ####
            setRequired([casUserName, casPassword, authinfoFile])

            #### If Authinfo ####
            if not authBool:
                clearRequired([casUserName, casPassword])

            #### All Empty ####
            if not userBool and not passBool:
                clearRequired([authinfoFile])

        return
