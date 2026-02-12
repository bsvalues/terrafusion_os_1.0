import os

import arcpy
import ips.const as c


class EnableIndoorPositioning(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Enable Indoor Positioning"
        self.description = (
            "Creates the necessary tables and feature classes"
            "to be able to provide data for indoor positioning"
        )

        self.canRunInBackground = False
        self.helpContext = 78000002

    def execute(self):
        """main function"""
        target_database = arcpy.GetParameterAsText(0)
        try:
            arcpy.ImportXMLWorkspaceDocument_management(
                target_database, c.MODEL_30.XML_PATH)

            positioning_table_path = os.path.join(
                target_database,
                c.MODEL_30.IPS_POSITIONING.NAME
            )

            recordings_fc_path = os.path.join(
                target_database,
                c.MODEL_30.IPS_RECORDINGS.NAME
            )

            beacons_fc_path = os.path.join(
                target_database,
                c.MODEL_30.BEACONS.NAME
            )

            arcpy.SetParameter(index=1, value=recordings_fc_path)
            arcpy.SetParameter(index=2, value=positioning_table_path)
            arcpy.SetParameter(index=3, value=target_database)
            arcpy.SetParameter(index=4, value=beacons_fc_path)
        except Exception as any_error:
            print(any_error)
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError(any_error)

        return


if __name__ == "__main__":
    EnableIndoorPositioning().execute()
