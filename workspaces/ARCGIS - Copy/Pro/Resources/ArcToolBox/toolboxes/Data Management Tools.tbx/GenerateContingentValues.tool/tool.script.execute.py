import arcpy
import gdbschema


gdbschema.generate_contingent_values(
    table=arcpy.GetParameterAsText(0),
    fg_csv=arcpy.GetParameterAsText(1),
    cav_csv=arcpy.GetParameterAsText(2),
    mode=arcpy.GetParameterAsText(3),
    field_groups=arcpy.GetParameter(4),
)
