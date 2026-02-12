import os
import sys
import arcpy

def execute(): 
    arcpy.env.overwriteOutput = True
    in_num = arcpy.GetParameterAsText(0)
    in_den = arcpy.GetParameterAsText(1)
    pop_num = arcpy.GetParameterAsText(2)
    pop_den = arcpy.GetParameterAsText(3)
    out_raster = arcpy.GetParameterAsText(4)
    cell_size = arcpy.GetParameterAsText(5)
    radius_num = arcpy.GetParameterAsText(6)
    radius_den = arcpy.GetParameterAsText(7)    
    out_cell_values = arcpy.GetParameterAsText(8)
    method = arcpy.GetParameterAsText(9)
    barr_num = arcpy.GetParameterAsText(10)
    barr_den = arcpy.GetParameterAsText(11)  

    if cell_size != '':
        arcpy.env.cellSize=cell_size

    try:    
        desc1 = arcpy.Describe(in_num)
        desc2 = arcpy.Describe(in_den)
        if pop_num == desc1.OIDFieldName:
            pop_num=''
        if pop_den == desc2.OIDFieldName:
            pop_den=''
        # describe 
        arcpy.AddMessage("Calculating kernel density")
        if arcpy.env.outputCoordinateSystem == None:
            arcpy.env.outputCoordinateSystem = in_num
        if arcpy.env.extent == None:
            arcpy.env.extent = "MINOF"

        if in_num:
            density_raster1 = arcpy.sa.KernelDensity(in_num, pop_num, cell_size, radius_num, 'SQUARE_MAP_UNITS', out_cell_values, method, barr_num)
            arcpy.AddMessage(arcpy.GetMessages())
        if in_den:
            density_raster2 = arcpy.sa.KernelDensity(in_den, pop_den, cell_size, radius_den, 'SQUARE_MAP_UNITS', out_cell_values, method, barr_den)
            arcpy.AddMessage(arcpy.GetMessages())


        arcpy.AddMessage("Calculating the ratio")
        ratio_raster = arcpy.sa.Divide(arcpy.sa.Float(density_raster1), arcpy.sa.Float(density_raster2))
        ratio_raster.save(out_raster)

    except:               
        arcpy.AddError(arcpy.GetMessages(2))
        raise arcpy.ExecuteError()
    
if __name__ == '__main__':
    execute()
