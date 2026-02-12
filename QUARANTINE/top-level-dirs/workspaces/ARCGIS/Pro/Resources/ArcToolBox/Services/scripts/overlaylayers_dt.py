'''---------------------------------------------------------------------------
Name:              overlaylayers.py
Purpose:           Performs an Intersect, Union or Erase overlay operation.
Author:            Esri, Inc.
Created:           02/14/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
Python Version:    2.7.2 (default, Jun 12 2011, 15:08:59)
---------------------------------------------------------------------------'''
import arcpy
import analysisutils

def overlay_layers(input_layer,
                    overlay_layer,
                    output_layer,
                    overlay_type='INTERSECT',
                    snap_to_input=False,
                    output_type='INPUT',
                    tolerance=''):
    """Overlays layers by performing an intersect, union or erase.
    Default is Intersect.
    """
    if snap_to_input == True:
        rank = ' 1'
    else:
        rank = ''

    if overlay_type == 'ERASE':
        arcpy.AddMessage(u'{} {} {} {} {}'.format(overlay_type, input_layer, overlay_layer, output_layer, tolerance))
        arcpy.analysis.Erase(input_layer, overlay_layer, output_layer, tolerance)

    elif overlay_type == 'INTERSECT':
        dInput = arcpy.Describe(input_layer)
        dOverlay = arcpy.Describe(overlay_layer)

        if dInput.shapeType == 'Point':
            tolerance = 0
            arcpy.AddMessage(u'SpatialJoin {} {} {} {}'.format(input_layer, overlay_layer, output_layer, tolerance))
            arcpy.analysis.SpatialJoin(input_layer,overlay_layer,output_layer,'JOIN_ONE_TO_ONE','KEEP_COMMON','','INTERSECT',tolerance)
        elif dOverlay.shapeType == 'Point':
            tolerance = 0
            arcpy.AddMessage(u'SpatialJoin {} {} {} {}'.format(overlay_layer, input_layer, output_layer, tolerance))
            arcpy.analysis.SpatialJoin(overlay_layer,input_layer,output_layer,'JOIN_ONE_TO_ONE','KEEP_COMMON','','INTERSECT',tolerance)
        else:
            input_cp = dInput.catalogPath
            #arcpy.AddMessage(input_cp)
            overlay_cp = dOverlay.catalogPath
            #arcpy.AddMessage(overlay_cp)
            if not input_cp == overlay_cp:
                inputs = u'{}{};{}'.format(input_layer, rank, overlay_layer)
            else:
                inputs = input_layer
            arcpy.AddMessage(u'{} {} {} {} {}'.format(overlay_type, inputs, output_layer, tolerance, output_type))
            arcpy.analysis.Intersect(inputs,output_layer,'',tolerance,output_type)

    elif overlay_type == 'UNION':
        inputs = u'{}{};{}'.format(input_layer, rank, overlay_layer)
        arcpy.AddMessage(u'{} {} {} {}'.format(overlay_type, inputs, output_layer, tolerance))
        arcpy.analysis.Union(inputs, output_layer, '', tolerance)

    #Add analysis area or length field depending on input layer type
    #dOutput = arcpy.Describe(output_layer)
    #if dOutput.shapeType == "Polygon":
        #analysisutils.createShapeAreaField(output_layer, "SquareKilometers", dOutput)
    #elif dOutput.shapeType == "Polyline":
        #analysisutils.createShapeLengthField(output_layer, "Kilometers", dOutput)

# End overlay_layers function

if __name__ == '__main__':
    inputlayer = arcpy.GetParameterAsText(0)
    overlaylayer = arcpy.GetParameterAsText(1)
    outputlayer = arcpy.GetParameterAsText(2)
    overlaytype = arcpy.GetParameterAsText(3)
    snap = arcpy.GetParameter(4)
    outputtype = arcpy.GetParameterAsText(5)
    snaptolerance = arcpy.GetParameterAsText(6)
    if snaptolerance == '0':
        snaptolerance = ''
    overlay_layers(inputlayer, overlaylayer, outputlayer, overlaytype,
                                        snap, outputtype, snaptolerance)
