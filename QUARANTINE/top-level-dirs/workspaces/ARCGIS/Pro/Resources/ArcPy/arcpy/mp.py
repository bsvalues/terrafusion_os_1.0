#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

from arcpy._mp import ArcGISProject, LayerFile, Table
from arcpy._mp import constants as _constants
from arcpy._mp import ColorRamp
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject as _convertArcObjectToPythonObject
from arcpy.geoprocessing._base import gp_fixargs as _gp_fixargs
from arcpy.pdfdocument import PDFDocumentOpen, PDFDocumentCreate

def CreateWebLayerSDDraft(map_or_layers, out_sddraft, service_name, server_type='HOSTING_SERVER', service_type='', folder_name=None, overwrite_existing_service=False, copy_data_to_server=False, enable_editing=False, allow_exporting=True, enable_sync=False, summary=None, tags=None, description=None, credits=None, use_limitations=None):
    """CreateWebLayerSDDraft(map_or_layers, out_sddraft, service_name,
    {server_type}, {service_type}, {folder_name}, {overwrite_existing_service},
    {copy_data_to_server}, {enable_editing}, {allow_exporting}, {enable_sync},
    {summary}, {tags}, {description}, {credits}, {use_limitations})


    Converts a map, layer, or list of layers in an ArcGIS Project   to a
    Service Definition Draft ( .sddraft )  file.


    map_or_layers(Object):
    A variable that references a Map object, Layer object, or a list of Layer
    objects. If publishing a list of Layer objects, they must be from the
    same map.


    out_sddraft(String):
    A string that represents the path and file name for the output Service
    Definition Draft ( .sddraft ) file.


    service_name(String):
    A string that represents the name of the service. This is the name people
    will see and use to identify the service. The name can only contain
    alphanumeric characters and underscores. No spaces or special characters
    are allowed. The name cannot be more than 120 characters in length.


    server_type{String}:
    A string representing the server type.
    Currently, the only supported value is HOSTING_SERVER for ArcGIS
    Online .


    service_type{String}:
    A string representing the service type.

    * FEATURE_ACCESS: FEATURE_ACCESS supports vector querying,
    visualization, and editing.

    * TILED: TILED supports fast map visualization using a collection of
    predrawn map images or tiles. These tiles are created and stored on the server
    after you upload your data.


    folder_name{String}:
    A string that represents  a folder name to which you want to publish the
    service definition. If the folder does not currently exist, it will be
    created.  The default folder is the server root level.


    overwrite_existing_service{Boolean}:
    A Boolean that determines whether to overwrite an existing service or
    not.


    copy_data_to_server{Boolean}:
    A Boolean that indicates whether the data referenced in the map or layers
    are copied to the server or not.


    enable_editing{Boolean}:
    A Boolean that determines if editing of feature services is
    enabled. Query capability is always on. Editing is optional.


    allow_exporting{Boolean}:
    A Boolean that determines if users can export the service to
    different formats.


    enable_sync{Boolean}:
    A Boolean that determines if users can work with a local copy of the data
    even when they are offline and
    synchronize changes when they are online.


    summary{String}:
    A string that represents the summary.


    tags{String}:
    A string that represents the tags. Multiple tags can be added or
    separated by a comma or semicolon.


    description{String}:
    A string that represents the description.


    credits{String}:
    A string that represents the credits.


    use_limitations{String}:
    A string that represents the use limitations."""
    import arcgisscripting
    return _convertArcObjectToPythonObject(arcgisscripting._mapping.CreateWebLayerSDDraft(*_gp_fixargs([map_or_layers, out_sddraft, service_name, server_type, service_type, folder_name, overwrite_existing_service, copy_data_to_server, enable_editing, allow_exporting, enable_sync, summary, tags, description, credits, use_limitations], True)))


def ConvertWebMapToArcGISProject(webmap_json, template_pagx=None, mapframe_name=None, notes_gdb=None, report_template=None):
    """ConvertWebMapToArcGISProject (webmap_json, {template_pagx}, {mapframe_name},
    {notes_gdb}, {report_template})


    Converts a web map (in JSON format), that you intend to print or export,
    to a map within an in-memory ArcGIS Project (.aprx) with option to generate
    a layout. The map or the layout can be further modified before finally
    being printed or exported.

    The function generates an in-memory ArcGIS Project (.aprx). You can save
    it as a file on disk by calling Save().


    webmap_json{String}:
    The web map for printing in JavaScript Object Notation (JSON). See the
    ExportWebMap JSON specification for more information. The ArcGIS Web APIs
    (JavaScript, Flex, and Silverlight) allow developers to easily get this JSON
    string from the web application.


    template_pagx{String}:
    A string representing the path and file name to a Layout file(.pagx) to use as the
    template for the page layout. The contents of the web map will be inserted into the
    map frame that is specified as a value to mapframe_name parameter. Layers in the 
    template_pagx file's map frame (and all other maps) will be preserved in the output
    mapDocument. (The default value is None).


    mapframe_name{String}:
    Name of the map frame who associated map’s contents will be updated. If value is
    missing, and the layout contains multiple maps, the function will try to find the
    map, that will get modified, in the following order. If there is only one map frame
    (or multiple map frames associated to a single map) then that map gets used.
    - A map frame that is named as MAIN_MAP
    - The largest map frame
    - The first map frame i.e. arcgisProject.ListLayouts()[0]

    Note: Most of the cases, the map should be empty i.e. does not contain any layer.
    (The default value is None).


    notes_gdb{String}:
    A string representing the path to a new or existing file geodatabase or an existing
    enterprise geodatabase connection where graphic features should be written. This
    parameter should only be used if graphic features from the web map JSON need to be
    preserved permanently.


    report_template{String}:
    A string representing the path and file name to a report template file (.rptt) or report
    definition file (.rptx) to use as the optional template for a report. If the webmap_json
    contains reportOptions, then a Report class object will be present in the ArcGISProject
    return object which can then be exported. The report can be accessed by using the listReports
    function on the ArcGISProject class."""

    import arcgisscripting
    import collections
    webmap_tuple = collections.namedtuple('Webmap', ['ArcGISProject', 'DPI', 'outputSizeHeight', 'outputSizeWidth'])
    return webmap_tuple(*_convertArcObjectToPythonObject(arcgisscripting._mapping.ConvertWebMapToArcGISProject(*_gp_fixargs([webmap_json, template_pagx, mapframe_name, notes_gdb, report_template], True))))

@_constants.maskargs
def ConvertLayoutFileToLayout(layout_file):
    import arcgisscripting
    return _convertArcObjectToPythonObject(arcgisscripting._mapping.ConvertLayoutFileToLayout(*_gp_fixargs([layout_file], True)))

@_constants.maskargs
def ListTimeZones(wildcard=None, time_zone_type="MICROSOFT_WINDOWS"):
    """ListTimeZones({wildcard}, {time_zone_type})


    Lists valid time zone strings to be used with the timeZone or timeZoneIANA properties
    on the LayerTime class.


    wildcard{String}
    A wildcard is based on the time zone string and is not case sensitive. A combination of
    asterisks (*) and characters can be used to help limit the resulting list.


    time_zone_type{String}
    A string constant that controls the list of available time zone types to filter from.

    * IANA: Time zones are displayed using Internet Assigned Numbers Authority (IANA)
    extended names including both standard and daylight offsets.

    * IANA_ABBREVIATED: Time zones are displayed using Internet Assigned Numbers Authority (IANA)
    location names including only the standard offsets.

    * MICROSOFT_WINDOWS— Time zones are displayed using the Microsoft Windows operating system
    names."""
    import arcgisscripting
    return arcgisscripting._listTimeZonesLabels(*_gp_fixargs((wildcard, time_zone_type,), True))

@_constants.maskargs
def CreateExportFormat(format, file_path=None):
    """CreateExportFormat(format, {file_path})


    The CreateExportFormat function creates an export format object and is used with the export method
    to generate the appropriate output export file.


    format(String)
    The list of supported export formats is as follows:

    *AIX: Adobe Illustrator Exchange
    
    *BMP: Microsoft Windows Bitmap
    
    *EMF: Windows Enhanced Metafile
    
    *EPS: Encapsulated PostScript
    
    *GIF: Graphic Interchange Format
    
    *JPEG: Joint Photographic Experts Group
    
    *PDF: Portable Document Format
    
    *PNG: Portable Network Graphics
    
    *SVG: Scalable Vector Graphics

    *TGA: Truevision Graphics Adapter

    *TIFF: Tagged Image File Format


    file_path{String}
    The full system path, file name, and extension for the resulting export file."""
    import arcgisscripting
    return _convertArcObjectToPythonObject(arcgisscripting._mapping.CreateExportFormat(*_gp_fixargs([format, file_path], True)))

@_constants.maskargs
def CreateExportOptions(class_type):
    """CreateExportOptions(class_type)


    The CreateExportOptions function creates additional classes that can be used to
    further configure MapSeries and Report export capabilities.


    class_type(String)
    *MAPSERIES: To modify additional map series export options.

    *REPORT: To modify additional report export options."""
    import arcgisscripting
    return _convertArcObjectToPythonObject(arcgisscripting._mapping.CreateExportOptions(*_gp_fixargs([class_type], True)))
