import arcpy
import ips.CreateIPSDataModel.utils as cdm_u


class CreateIPSDataModel(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create IPS Data Model"
        self.description = (
            "Creates the necessary tables and feature classes"
            "to be able to provide data for Indoor Positioning"
        )

        self.canRunInBackground = False
        self.helpContext = 78000007

    def execute(self):
        """main function"""
        target_workspace = arcpy.GetParameterAsText(0)
        coordinate_system = arcpy.GetParameterAsText(2)
        setup_indoors_model_for_ips = arcpy.GetParameter(3)

        try:
            updated_workspace = cdm_u.create_ips_data_model(
                workspace=target_workspace,
                coordinate_system=coordinate_system,
                setup_indoors_model_for_ips=setup_indoors_model_for_ips
            )

            arcpy.SetParameter(index=1, value=updated_workspace)
        except Exception as any_error:
            print(any_error)
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError(any_error)

        return


if __name__ == "__main__":
    CreateIPSDataModel().execute()
