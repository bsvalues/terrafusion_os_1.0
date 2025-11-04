# this file had invalid syntax, can't really be in use? --Ghis, April 2020
import arcpy

def tool_execute():
    try:
        zip_file = "%scratchFolder%\output.zip"
        arcpy.server.ExtractData(
            Layers_to_Clip=arcpy.GetParameterAsText(0),
            Area_of_Interest=arcpy.GetParameterAsText(1),
            Feature_Format=arcpy.GetParameterAsText(2),
            Raster_Format=arcpy.GetParameterAsText(3),
            Spatial_Reference="Same As Input",
            Output_Zip_File=zip_file)

        arcpy.server.SendEmailWithZipFileAttachment(
            To=arcpy.GetParameterAsText(4),
            Sent=arcpy.GetParameterAsText(5))

        arcpy.SetParameterAsText(6, "True")

    except:
        arcpy.SetParameterAsText(6, "False")

if __name__ == '__main__':
    tool_execute()
