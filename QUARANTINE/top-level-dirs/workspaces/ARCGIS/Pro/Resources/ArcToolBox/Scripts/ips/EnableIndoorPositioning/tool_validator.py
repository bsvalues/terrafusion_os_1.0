import os

import arcpy
import ips.const as c
import ips.validation as v


class ToolValidator:
    def __init__(self):
        self.parameters = arcpy.GetParameterInfo()

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if self.parameters[0].valueAsText and not self.parameters[0].hasBeenValidated:
            self.parameters[1].value = os.path.join(self.parameters[0].valueAsText, c.MODEL_30.IPS_RECORDINGS.NAME)
            self.parameters[2].value = os.path.join(self.parameters[0].valueAsText, c.MODEL_30.IPS_POSITIONING.NAME)
            self.parameters[4].value = os.path.join(self.parameters[0].valueAsText, c.MODEL_30.BEACONS.NAME)
        return

    def updateMessages(self):
        try:
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            # workspace input parameter
            inputWorkspace = self.parameters[0].valueAsText

            if not arcpy.Exists(inputWorkspace):
                # error: <value> does not exist.
                self.parameters[0].setIDMessage('ERROR', 110, inputWorkspace)

            # Check if the IPS Recording feature class
            # already exists in the workspace
            elif arcpy.Exists(os.path.join(inputWorkspace, c.MODEL_30.IPS_RECORDINGS.NAME)):
                # Using Core messaging: Output %1 already exists within %2.
                self.parameters[0].setIDMessage('ERROR', 250041)
            # Check if the IPS Positioning table already exists in the workspace
            elif arcpy.Exists(os.path.join(inputWorkspace, c.MODEL_30.IPS_POSITIONING.NAME)):
                # Using Core messaging: Output %1 already exists within %2.
                self.parameters[0].setIDMessage('ERROR', 250041)
            # Check if the Beacons feature class already exists in the workspace
            elif arcpy.Exists(os.path.join(inputWorkspace, c.MODEL_30.BEACONS.NAME)):
                # Using Core messaging: Output %1 already exists within %2.
                self.parameters[0].setIDMessage('ERROR', 250041)
            elif v.check_domain_exists(
                    workspace=inputWorkspace,
                    domainnames=[c.DOM_BOOLEAN, c.DOM_IPS_RECORDING_TYPE]
            ):
                # Using Core messaging: Output %1 already exists within %2.
                self.parameters[0].setIDMessage('ERROR', 250041)

            return
        except Exception:
            return

    def isLicensed(self):
        return v.has_license()
