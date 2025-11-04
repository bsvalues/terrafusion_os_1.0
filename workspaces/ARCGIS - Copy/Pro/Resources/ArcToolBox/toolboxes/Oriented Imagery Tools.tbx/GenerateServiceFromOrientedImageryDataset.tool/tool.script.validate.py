import arcpy
from pathlib import Path
from arcgis.gis import GIS


class ToolValidator:
    """Class to add custom behavior and properties to the tool and tool parameters."""

    def __init__(self):
        """Setup tool"""
        self.params = {param.name: param for param in arcpy.GetParameterInfo()}
        self.gis = GIS("home")

    def initializeParameters(self):
        """
        Customize parameter properties.
        This gets called when the tool is opened.
        """

    def updateParameters(self):
        """
        Modify parameter values and properties.
        This gets called each time a parameter is modified, before standard validation.
        """
        if self.gis.users.me:
            self.params["portal_folder"].filter.list = [
                folder["title"] for folder in self.gis.users.me.folders
            ]

    def updateMessages(self):
        """
        Customize messages for the parameters.
        This gets called after standard validation.
        """
        if not self.gis.users.me:
            self.params["portal_folder"].setIDMessage("ERROR", 2119)

        if self.gis.version:
            major, minor = self.gis.version
            if major < 2023 or (major == 2023 and minor < 2):
                self.params["portal_folder"].setIDMessage("ERROR", 3910, "11.2")

        if self.params["service_name"].value:
            service_name = self.params["service_name"].valueAsText
            if not self.gis.content.is_service_name_available(
                service_name=service_name, service_type="featureService"
            ):
                self.params["service_name"].setIDMessage("ERROR", 1398, service_name)

        if self.params["in_oriented_imagery_dataset"].value:
            if not arcpy.Exists(
                self.params["in_oriented_imagery_dataset"].value
            ) or arcpy.Describe(
                self.params["in_oriented_imagery_dataset"].value
            ).catalogPath.startswith(
                "http"
            ):
                self.params["in_oriented_imagery_dataset"].setIDMessage(
                    "ERROR",
                    732,
                    str(self.params["in_oriented_imagery_dataset"].value),
                    str(self.params["in_oriented_imagery_dataset"].value),
                )

        if (
            self.params["in_oriented_imagery_dataset"].value
            and self.params["add_footprint"].value
            and not self.params["in_oriented_imagery_dataset"].hasError()
        ):
            footprint_name = arcpy.da.Describe(
                self.params["in_oriented_imagery_dataset"].value
            )["extensionProperties"].get("footprintItem")
            if footprint_name:
                oriented_imagery_dataset = self.params[
                    "in_oriented_imagery_dataset"
                ].valueAsText
                oriented_imagery_dataset_path = Path(
                    arcpy.Describe(oriented_imagery_dataset).catalogPath
                )
                footprint_dataset_path = (
                    oriented_imagery_dataset_path.parent / footprint_name
                )
                if not arcpy.Exists(footprint_dataset_path):
                    self.params["add_footprint"].setIDMessage("ERROR", 3891)
            else:
                self.params["add_footprint"].setIDMessage("ERROR", 3891)

    def isLicensed(self):
        """set tool isLicensed."""
        return (
            arcpy.CheckProduct("ArcEditor") in ["Available", "AlreadyInitialized"]
            or arcpy.CheckProduct("ArcInfo") in ["Available", "AlreadyInitialized"]
            or arcpy.CheckProduct("ArcServer") in ["Available", "AlreadyInitialized"]
        )

    def postExecute(self):
        """
        This method takes place after outputs are processed and added to the display.
        """
