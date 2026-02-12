import arcpy
import ips.CreateIPSQualityDataset.tool_validator as ciqd_t_v
import ips.CreateIPSQualityDataset.utils as ciqd_u


class CreateIPSQualityDataset(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create IPS Quality Dataset"
        self.description = (
            """Creates a feature dataset containing the necessary feature 
            classes and tables to store a quality assessment of an ArcGIS
            IPS deployment."""
        )

        # self.canRunInBackground = False
        self.helpContext = 78020001

    def execute(self):
        """Main function"""
        try:
            target_workspace = arcpy.GetParameterAsText(0)
            coordinate_system = arcpy.GetParameterAsText(1)
            out_dataset_name = arcpy.GetParameterAsText(2)
            out_ips_quality_dataset, out_reference_positions_fc, out_computed_positions_fc = \
                ciqd_u.create_ips_quality_dataset(
                    workspace=target_workspace,
                    coordinate_system=coordinate_system,
                    out_dataset_name=out_dataset_name
                )
            arcpy.SetParameter(index=3, value=out_ips_quality_dataset)
            arcpy.SetParameter(index=4, value=out_reference_positions_fc)
            arcpy.SetParameter(index=5, value=out_computed_positions_fc)
        except Exception as any_error:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError(any_error)
        finally:
            ciqd_t_v.validate_after_run = True

        return


if __name__ == "__main__":
    CreateIPSQualityDataset().execute()
