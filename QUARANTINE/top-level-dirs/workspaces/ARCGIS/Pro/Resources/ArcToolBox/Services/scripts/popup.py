"""---------------------------------------------------------------------------
Name:              popup.py
Purpose:           Helper function for creating layer popups 
Author:            Esri Inc.
Created:           1/7/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
---------------------------------------------------------------------------"""
from __future__ import unicode_literals

class PopupInfo :
    ''' Represents a popup info element of a featurelayer '''
    def __init__(self, title, description=None,showAttachments=False):
        self.title = title
        if description:
            self.description = description
        self.showAttachments = showAttachments        

    class _ChartMediaInfo :
        ''' Represents a chart component of the popup '''
        def __init__(self, title, caption, value, chart_type):
            self.title = title
            self.caption = caption
            self. value = value
            self.chart_type = chart_type

    class _FieldInfo :        
        '''Represents the Fieldinfo coomponent of the popup'''
        def __init__(self,fieldName, label, dFormat, places, visible, stringFieldOption,
                     dateFormat=None):

            self.fieldName = fieldName
            self.label = label            
            self.tooltip = label
            self.visible = visible
            self.stringFieldOption = stringFieldOption
            if fieldName.upper() not in ["FID", "OID", "OBJECTID"]:
                self.isEditable = True
            else:
                self.isEditable = False
            if dFormat:               
                if dateFormat:
                    self.dFormat = {"dateFormat" : dateFormat}
                else:
                    self.dFormat = {"places":places,"digitSeparator":True}
             
    def addMediaInfo(self, title, fieldNames, tooltipField, 
                     chart_type="columnchart",caption="", normalizeField="",relTableId=None):
        '''Adds a chart element to mediaInfo component of the popup
        fieldNames is a list of field names 
        chart_types can be piechart,columnchart,barchart,linechart 
        relTableId: related table id.
        if relTableId is passed will prefix fieldnames and tooltipField 
        with /relationships/<reltableid>'''
        
        if relTableId != None:
            prefix = "relationships/{}".format(relTableId)
            fieldNames = ["{}/{}".format(prefix,field) for field in fieldNames]
            tooltipField = "relationships/{}/{}".format(relTableId, tooltipField)
        value = {"fields":fieldNames, "tooltipField":tooltipField}
        value["normalizeField"] = normalizeField
        mediaInfo = vars(self._ChartMediaInfo(title, caption, value, chart_type))        
        mediaInfo.update({"type":mediaInfo.pop("chart_type")})
        if not "mediaInfos" in self.__dict__:
            self.mediaInfos = []   
        self.mediaInfos.append(mediaInfo)

    def addFieldInfo(self, fieldName, label,
                     dFormat=False,                                          
                     places=2,
                     visible=True,
                     stringFieldOption="textbox",
                     dateFormat=None, relTableId=None):
        '''Adds a field element to fieldInfo component of the popup
        relTableId: related table id.
        if relTableId is passed will prefix fieldnames and tooltipField 
        with /relationships/<reltableid>
        '''  
        if relTableId != None:
            fieldName = "relationships/{}/{}".format(relTableId,fieldName)
        fieldInfo = vars(self._FieldInfo(fieldName, label, dFormat, places, visible, stringFieldOption, dateFormat))
        # update property name dFormat to format
        if dFormat:
            fieldInfo["format"] = fieldInfo.get("dFormat")
            fieldInfo.pop("dFormat")  
        #Add to popup class
        if not 'fieldInfos' in self.__dict__:
            self.fieldInfos = []
        self.fieldInfos.append(fieldInfo)

    def getPopupInfo(self):
        '''returns popup info of a featurelayer'''
        return vars(self)
 
def feature_layer_popup(desc_layer, popup_title, date_format="shortDateShortTime", hide_fields=None,
                        field_names_display_order=None):
    '''Returns a popup for the feature layer. Omits OID, globalid, shape, shape_length and shape_area fields
    from the popup. Use default formatting as defined in the PopupInfo class for double and date fields. For more info
    about JSON for popup objects refer to 
    http://resources.arcgis.com/en/help/arcgis-rest-api/#/popupInfo/02r300000042000000/
    desc_layer - Describe object derived from the layer for which the popup is being created.
    popup_title - A string that appears at the top of the pop-up window as a title. This can contain a field name
    enclosed in {}, such as {NAME}.
    date_format - format style that is used to format date time fields
    hide_fields - sequence of field names that should not be visible by default
    field_names_display_order - sequence of field names that are in the order in which they are to be drawn in the popup. 
     None, the fields are drawn in the order in default order which is the order in which the fields were added to
     the table'''

    layer_popup = PopupInfo(popup_title)
    #Add all fields to the popup except the OID, GlobalID, shape, shape_length fields
    omit_fields = (desc_layer.OIDFieldName.lower(), desc_layer.shapeFieldName.lower(), "shape_length", "shape_area",
                   "globalid")
    
    #layer field objects are used to look up properties for a field such as field type based on the field name
    layer_fields = desc_layer.fields
    layer_field_objects = {fld.name: fld for fld in layer_fields}

    if field_names_display_order:
        layer_field_names = field_names_display_order
    else:
        layer_field_names = [fld.name for fld in layer_fields]

    #Set a format for fields of type date and double. 
    for name in layer_field_names:
        fld = layer_field_objects[name]
        fld_name = fld.name
        if fld_name.lower() in omit_fields:
            continue
        is_field_visible = True
        if hide_fields and fld_name in hide_fields:
            is_field_visible = False
        #use the field alias as the label for the popup. For date and double fields, set a format
        fld_type = fld.type.lower()
        if fld_type == "double": 
            layer_popup.addFieldInfo(fld_name, fld.aliasName, True, visible=is_field_visible)
        elif fld_type == "date":
            layer_popup.addFieldInfo(fld_name, fld.aliasName, True, dateFormat=date_format, visible=is_field_visible)
        else:
            layer_popup.addFieldInfo(fld_name, fld.aliasName, visible=is_field_visible)

    return layer_popup.getPopupInfo()  
