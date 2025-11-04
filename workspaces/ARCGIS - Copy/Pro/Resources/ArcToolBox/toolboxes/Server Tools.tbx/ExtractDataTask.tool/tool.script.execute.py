def tool_execute():
    arcpy.server.ExtractData(
        Layers_to_Clip=arcpy.GetParameterAsText(0),
        Area_of_Interest=arcpy.GetParameterAsText(1),
        Feature_Format=arcpy.GetParameterAsText(2),
        Raster_Format=arcpy.GetParameterAsText(3),
        Spatial_Reference="Same As Input",
        Output_Zip_File=arcpy.GetParameterAsText(4))


if __name__ == '__main__':
    tool_execute()
