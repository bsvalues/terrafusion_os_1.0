from __future__ import unicode_literals
import arcpy
import json



def debugLayer(paramName, layer):
    """Debug layer."""
    #arcpy.AddMessage("in debug layer")
    arcpy.AddMessage(u'{}: {},{},{},{}'.format(paramName, layer.name, layer.layername, layer.shapeType, layer.count))
    if layer.changedFieldNames:
        arcpy.AddMessage(u'{} - changedFieldNames: {}'.format(paramName, layer.changedFieldNames))
    #d = arcpy.Describe(layer.name)
    #arcpy.AddMessage(u'{} data path: {}'.format(paramName, d.catalogPath))

# End def DebugLayer

def debugExtent():
    """Debug extent."""

    extent = arcpy.env.extent
    if not extent is None:
        sr = extent.spatialReference
        if not sr is None:
            factoryCode = sr.factoryCode
            if factoryCode == 0:
                factoryCode = sr.exportToString()
        else:
            factoryCode = 0
        extentMsg = u"Extent: {},{},{},{},{}".format(extent.XMin, extent.YMin, extent.XMax, extent.YMax, factoryCode)
        arcpy.AddMessage(extentMsg)

# End def DebugExtent

def debugToolMessages(result, toolName="desktop"):
    '''prints desktop tool messages
    result : tool result
    toolName: name of the tool
    '''
    arcpy.AddMessage("-----------Start of {} Tool Messages ------------".format(toolName))
    arcpy.AddMessage(result.getMessages())
    msgs = result.getMessages().split("\n")
    for i in range(2,len(msgs)-2):
        arcpy.AddMessage(msgs[i])
    arcpy.AddMessage("-----------End of {} Tool Messages ------------".format(toolName))

# End def debugToolMessages

def debugFeatureCount(layer, layerName):
    '''prints count of features 
    layer: featurelayer or table
    layerName: name of the layer for identification'''
    count = arcpy.GetCount_management(layer).getOutput(0)
    arcpy.AddMessage("{} count: {}".format(layerName, count))

# End def debugFeatureCount

def debugFields(layer):
    '''prints the fieldnames in the layer'''
    fields = [field.name for field in arcpy.ListFields(layer)]
    arcpy.AddMessage(fields)
    
def debugFeatureClass(layer):
    '''prints the values in the feature class except geometries'''
    
    fields = [field.name for field in arcpy.ListFields(layer)]
    shapeFieldName = arcpy.Describe(layer).shapeFieldName    
    if shapeFieldName in fields:
        fields.remove(shapeFieldName)
    arcpy.AddMessage(fields)
    with arcpy.da.SearchCursor(layer, fields) as cursor:
        for row in cursor:
            arcpy.AddMessage(row)
            

def debugRenderer(renderer):
    '''prints renderer json'''
    for key, value in renderer.items():
        if isinstance(value, list):
            arcpy.AddMessage(key)
            for item in value:
                arcpy.AddMessage(str(item))
        else:
            arcpy.AddMessage("{} : {}".format(key,value))


def debugRelationships(relationship):
    for key,value in relationship.items():
        arcpy.AddMessage("{} : {}".format(key, value))