import arcpy
import gdbschema

result = gdbschema.convert_report(
    report=arcpy.GetParameterAsText(0),
    folder=arcpy.GetParameterAsText(1),
    name=arcpy.GetParameterAsText(2),
    formats=arcpy.GetParameterAsText(3),
)
if result:
    arcpy.SetParameter(4, result)
