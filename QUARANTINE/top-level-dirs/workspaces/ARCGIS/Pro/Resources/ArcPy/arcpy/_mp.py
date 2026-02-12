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
from arcpy.arcobjects._base import _ObjectWithoutInitCall, passthrough_attr
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from arcpy.geoprocessing._base import gp_fixargs
from arcpy.pdfdocument import PDFDocument, PDFDocumentOpen, PDFDocumentCreate
from arcpy.utils import ArgAdaptor
from arcpy._symbology import Symbology, ColorRamp, ClassBreak, RasterClassBreak, Symbol, Item, RasterItem, ItemGroup
from arcpy._renderer import UniqueValueRenderer, SimpleRenderer, Graduated_colors_renderer, Graduated_symbols_renderer
from arcpy import metadata
class constants(ArgAdaptor):
    """Represents the constants that can be passed into various ExportTo* mp functions"""
    __args__ = {
        # For add position
        'add_position': {
            'AUTO_ARRANGE': 'auto_arrange',
            'BOTTOM': 'bottom',
            'TOP': 'top'
        },
        # For anchor
        'anchor': {
            'BOTTOM_LEFT_CORNER': 'BOTTOM_LEFT_CORNER',
            'BOTTOM_MID_POINT': 'BOTTOM_MID_POINT',
            'BOTTOM_RIGHT_CORNER': 'BOTTOM_RIGHT_CORNER',
            'CENTER_POINT': 'CENTER_POINT',
            'LEFT_MID_POINT': 'LEFT_MID_POINT',
            'RIGHT_MID_POINT': 'RIGHT_MID_POINT',
            'TOP_LEFT_CORNER': 'TOP_LEFT_CORNER',
            'TOP_MID_POINT': 'TOP_MID_POINT',
            'TOP_RIGHT_CORNER': 'TOP_RIGHT_CORNER'
        },
        # For bmp_color_mode
        'bmp_color_mode': {
          '1-BIT_MONOCHROME_THRESHOLD': '1-BIT_MONOCHROME_THRESHOLD',
            '8-BIT_ADAPTIVE_PALETTE': '8-BIT_ADAPTIVE_PALETTE',
            '8-BIT_GRAYSCALE': '8-BIT_GRAYSCALE',
            '24-BIT_TRUE_COLOR': '24-BIT_TRUE_COLOR'
        },
        # For bmp_image_compression
        'bmp_image_compression': {
            'NONE': 'NONE',
            'RLE': 'RLE'
        },
        # For CIM version
        'cim_version': {
            'V2': '2',
            'V3': '3'
        },
        # For class type
        'class_type': {
            'MAPSERIES': 'MAPSERIES',
            'REPORT': 'REPORT'
        },
        # For color mode
        'color_mode': {
            '24-BIT_TRUE_COLOR': 1,
            '8-BIT_ADAPTIVE_PALETTE': 2,
            '8-BIT_GRAYSCALE': 3,
            '32-BIT_WITH_ALPHA': 4,
            '32-BIT_CMYK_TRUE_COLOR': 5,
            '40-BIT_CMYK_WITH_ALPHA': 6,
            '1-BIT_MONOCHROME_THRESHOLD': 7
        },
        # For element type
        'element_type': {
            'GRAPHIC_ELEMENT': 'GRAPHIC_ELEMENT',
            'GROUP_ELEMENT': 'GROUP_ELEMENT',
            'LEGEND_ELEMENT': 'LEGEND_ELEMENT',
            'MAPFRAME_ELEMENT': 'MAPFRAME_ELEMENT',
            'MAPSURROUND_ELEMENT': 'MAPSURROUND_ELEMENT',
            'PICTURE_ELEMENT': 'PICTURE_ELEMENT',
            'TABLEFRAME_ELEMENT': 'TABLEFRAME_ELEMENT',
            'TEXT_ELEMENT': 'TEXT_ELEMENT'
        },
        # For encryption
        'encryption': {
            'RC4': 2
        },
        # For eps image compression
        'eps_compression': {
            'NONE': 1,
            'RLE': 2,
            'LZW': 3,
            'DEFLATE': 4,
        },
        # For export file options
        'export_file_options': {
            'PDF_SINGLE_FILE': 'PDF_SINGLE_FILE',
            'PDF_MULTIPLE_FILES_PAGE_NAME': 'PDF_MULTIPLE_FILES_PAGE_NAME',
            'PDF_MULTIPLE_FILES_PAGE_NUMBER': 'PDF_MULTIPLE_FILES_PAGE_NUMBER'
        },
        # For export_pages
        'export_pages': {
            'ALL': 'ALL',
            'CURRENT': 'CURRENT',
            'CUSTOM': 'CUSTOM',
            'SELECTED_INDEX_FEATURES': 'SELECTED_INDEX_FEATURES'
        },
        # For export format
        'format': {
            'AIX': 'AIX',
            'BMP': 'BMP',
            'EMF': 'EMF',
            'EPS': 'EPS',
            'GIF': 'GIF',
            'JPEG': 'JPEG',
            'PDF': 'PDF',
            'PNG': 'PNG',
            'SVG': 'SVG',
            'TIFF': 'TIFF',
            'TGA': 'TGA'
        },
        # For extrusion type
        'extrusion_type': {
            'ABSOLUTE_HEIGHT': 'ABSOLUTE_HEIGHT',
            'BASE_HEIGHT': 'BASE_HEIGHT',
            'MAX_HEIGHT': 'MAX_HEIGHT',
            'MIN_HEIGHT': 'MIN_HEIGHT',
            'NONE': 'NONE'
        },
        # For gif_color_mode
        'gif_color_mode': {
          '1-BIT_MONOCHROME_THRESHOLD': '1-BIT_MONOCHROME_THRESHOLD',
            '8-BIT_ADAPTIVE_PALETTE': '8-BIT_ADAPTIVE_PALETTE',
            '8-BIT_GRAYSCALE': '8-BIT_GRAYSCALE',
        },
        # For group type
        'group_type': {
            'CHECKBOX': 'CHECKBOX',
            'RADIO': 'RADIO'
        },
        # For image compression
        'image_compression': {
            'NONE': 1,
            'RLE': 2,
            'LZW': 3,
            'DEFLATE': 4,
            'JPEG': 5,
            'ADAPTIVE': 6,
            'JPEG2000': 7
        },
        # For image quality
        'image_quality': {
            'BEST': 1,
            'BETTER': 2,
            'NORMAL': 3,
            'FASTER': 4,
            'FASTEST': 5
        },
        # For insert position
        'insert_position': {
            'AFTER': 'after',
            'BEFORE': 'before'
        },
        # For interval_units
        'interval_units': {
            'CENTURIES': 'CENTURIES',
            'DAYS': 'DAYS',
            'DECADES': 'DECADES',
            'HOURS': 'HOURS',
            'MILLISECONDS': 'MILLISECONDS',
            'MINUTES': 'MINUTES',
            'MONTHS': 'MONTHS',
            'SECONDS': 'SECONDS',
            'WEEKS': 'WEEKS',
            'YEARS': 'YEARS'
        },
        # For jpeg color mode
        'jpeg_color_mode': {
            '24-BIT_TRUE_COLOR': 1,
            '8-BIT_GRAYSCALE': 3
        },
        # For label class language
        'labelclass_language': {
            'ARCADE': 'ARCADE',
            'JSCRIPT': 'JSCRIPT',
            'PYTHON': 'PYTHON',
            'VBSCRIPT': 'VBSCRIPT'
        },
        # For layers attributes
        'layers_attributes': {
            'NONE': 1,
            'LAYERS_ONLY': 2,
            'LAYERS_AND_ATTRIBUTES': 3
        },
        # For layer property
        'layer_property': {
            'BRIGHTNESS': 'brightness',
            'CONNECTIONPROPERTIES': 'connectionProperties',
            'CONTRAST': 'contrast',
            'DATASOURCE': 'dataSource',
            'DEFINITIONQUERY': 'definitionQuery',
            'IS3DLAYER': 'is3DLayer',
            'ISBASEMAPLAYER': 'isBasemapLayer',
            'ISBROKEN': 'isBroken',
            'ISFEATURELAYER': 'isFeatureLayer',
            'ISGRAPHICSLAYER': 'isGraphicsLayer',
            'ISGROUPLAYER': 'isGroupLayer',
            'ISNETWORKANALYSTLAYER': 'isNetworkAnalystLayer',
            'ISNETWORKDATASETLAYER': 'isNetworkDatasetLayer',
            'ISPARCELFABRICLAYER': 'isParcelFabricLayer',
            'ISRASTERLAYER': 'isRasterLayer',
            'ISSCENELAYER': 'isSceneLayer',
            'ISTIMEENABLED': 'isTimeEnabled',
            'ISWEBLAYER': 'isWebLayer',
            'LONGNAME': 'longName',
            'MAXTHRESHOLD': 'maxThreshold',
            'METADATA': 'metadata',
            'MINTHRESHOLD': 'minThreshold',
            'NAME': 'name',
            'SHOWLABELS': 'showLabels',
            'SYMBOLOGY': 'symbology',
            'TRANSPARENCY': 'transparency',
            'TIME': 'time',
            'URI': 'URI',
            'VISIBLE': 'visible'
        },
        # For map_surround_type
        'mapsurround_type': {
            'LEGEND': 'LEGEND',
            'GRID': 'GRID',
            'NORTH_ARROW': 'NORTH_ARROW',
            'SCALE_BAR': 'SCALE_BAR'
        },
        # For map type
        'map_type': {
            'MAP': 'MAP',
            'GLOBE': 'GLOBE',
            'SCENE': 'SCENE'
        },
        # For method
        'method': {
            'DIFFERENCE': 'DIFFERENCE',
            'INTERSECT': 'INTERSECT',
            'NEW': 'NEW',
            'SYMDIFFERENCE': 'SYMDIFFERENCE',
            'UNION': 'UNION'
        },
        # For move_position
        'move_position': {
            'AFTER': 'AFTER',
            'BEFORE': 'BEFORE'
        },
        # For multiple files
        'multiple_files': {
            'PDF_SINGLE_FILE': 'PDF_SINGLE_FILE',
            'PDF_MULTIPLE_FILES_PAGE_NAME': 'PDF_MULTIPLE_FILES_PAGE_NAME',
            'PDF_MULTIPLE_FILES_PAGE_NUMBER': 'PDF_MULTIPLE_FILES_PAGE_NUMBER'
        },
        # For page_range_type
        'page_range_type': {
            'ALL': 'ALL',
            'CURRENT': 'CURRENT',
            'RANGE': 'RANGE',
            'SELECTED': 'SELECTED'
        },
        # For page_units
        'page_units': {
            'CENTIMETER': 'CENTIMETER',
            'INCH': 'INCH',
            'MILLIMETER': 'MILLIMETER',
            'POINT': 'POINT'
        },
        # For pdf layout
        'pdf_layout': {
            'VIEWER_DEFAULT': 0,
            'SINGLE_PAGE': 1,
            'ONE_COLUMN': 2,
            'TWO_COLUMN_LEFT': 3,
            'TWO_COLUMN_RIGHT': 4,
            'TWO_PAGE_LEFT': 5,
            'TWO_PAGE_RIGHT': 6
        },
        # For pdf layout
        'pdf_layout': {
            'ONE_COLUMN': 'ONE_COLUMN',
            'SINGLE_PAGE': 'SINGLE_PAGE',
            'TWO_COLUMN_LEFT': 'TWO_COLUMN_LEFT',
            'TWO_COLUMN_RIGHT': 'TWO_COLUMN_RIGHT',
            'TWO_PAGE_LEFT': 'TWO_PAGE_LEFT',
            'TWO_PAGE_RIGHT': 'TWO_PAGE_RIGHT',
            'VIEWER_DEFAULT': 'VIEWER_DEFAULT'
        },
        # For pdf open view
        'pdf_open_view': {
            'VIEWER_DEFAULT': 0,
            'USE_NONE': 1,
            'USE_THUMBS': 2,
            'USE_BOOKMARKS': 3,
            'FULL_SCREEN': 4,
            'LAYERS': 5,
            'ATTACHMENT': 6
        },
        # For pdf open view
        'pdf_open_view': {
            'ATTACHMENT': 'ATTACHMENT',
            'FULL_SCREEN': 'FULL_SCREEN',
            'LAYERS': 'LAYERS',
            'USE_BOOKMARKS': 'USE_BOOKMARKS',
            'USE_NONE': 'USE_NONE',
            'USE_THUMBS': 'USE_THUMBS',
            'VIEWER_DEFAULT': 'VIEWER_DEFAULT'
        },
        # For permissions
        'permissions': {
            'ALL': -268435457,
            'OPEN': 1,
            'SECURE': 2,
            'PRINT': 4,
            'EDIT': 8,
            'COPY': 16,
            'EDIT_NOTES': 32,
            'FILL_AND_SIGN': 256,
            'DOC_ASSEMBLY': 1024,
            'HIGH_PRINT': 2052,
            'ALL_MASTER': 2104
        },
        # For png color mode
        'png_color_mode': {
            '24-BIT_TRUE_COLOR': '24-BIT_TRUE_COLOR',
            '32-BIT_WITH_ALPHA': '32-BIT_WITH_ALPHA',
            '8-BIT_ADAPTIVE_PALETTE': '8-BIT_ADAPTIVE_PALETTE',
            '8-BIT_GRAYSCALE': '8-BIT_GRAYSCALE',
            '1-BIT_MONOCHROME_THRESHOLD': '1-BIT_MONOCHROME_THRESHOLD'
        },
        # For layer_paste_properties
        'layer_paste_properties': {
            'ALL': 'ALL',
            'SYMBOLOGY': 'SYMBOLOGY',
            'LABELING': 'LABELING',
            'POPUPS': 'POPUPS',
            'DISPLAY_FILTERS': 'DISPLAY_FILTERS',
            'FIELD_PROPERTIES': 'FIELD_PROPERTIES',
            'CHARTS': 'CHARTS',
            'DEFINITION_QUERIES': 'DEFINITION_QUERIES',
            'DISPLAY_EXPRESSION': 'DISPLAY_EXPRESSION',
            'VISIBILITY_RANGE': 'VISIBILITY_RANGE'
        },
        # For table_paste_properties
        'table_paste_properties': {
            'ALL': 'ALL',
            'POPUPS': 'POPUPS',
            'FIELD_PROPERTIES': 'FIELD_PROPERTIES',
            'CHARTS': 'CHARTS',
            'DEFINITION_QUERIES': 'DEFINITION_QUERIES',
            'DISPLAY_EXPRESSION': 'DISPLAY_EXPRESSION',
        },
        # For query rows
        'query_rows': {
            'ALL_ROWS': 'ALL_ROWS',
            'MAPSERIES_ROWS': 'MAPSERIES_ROWS',
            'VISIBLE_ROWS': 'VISIBLE_ROWS',
        },
        # For report export pages
        'report_export_pages': {
            'ALL': 'ALL',
            'EVEN': 'EVEN',
            'LAST': 'LAST',
            'ODD': 'ODD',
            'CUSTOM': 'CUSTOM',
        },
        'report_page_range_type': {
            'ALL': 'ALL',
            'EVEN': 'EVEN',
            'LAST': 'LAST',
            'ODD': 'ODD',
            'RANGE': 'RANGE',
        },
        # For selection
        'selection': {
            'ALL': 'ALL',
            'SELECTED': 'SELECTED'
        },
        # For server type
        'server_type': {
            'FEDERATED_SERVER': 'FEDERATED_SERVER',
            'HOSTING_SERVER': 'HOSTING_SERVER',
            'MY_HOSTED_SERVICES': 'MY_HOSTED_SERVICES'
        },
        # For service type
        'service_type': {
            'FEATURE': 'FEATURE',
            'MAP_IMAGE': 'MAP_IMAGE',
            'TILE': 'TILE',
            'SCENE_LAYER': 'SCENE_LAYER'
        },
        # For shape_type
        'shape_type': {
            'CIRCLE': 'CIRCLE',
            'CLOUD': 'CLOUD',
            'CROSS': 'CROSS',
            'ELLIPSE': 'ELLIPSE',
            'HALF_CIRCLE': 'HALF_CIRCLE',
            'RECTANGLE': 'RECTANGLE',
            'RIGHT_TRIANGLE': 'RIGHT_TRIANGLE',
            'ROUNDED_RECTANGLE': 'ROUNDED_RECTANGLE',
            'TRIANGLE': 'TRIANGLE',
            'X': 'X'
        },
        # For style_class
        'style_class': {
          'COLOR': 1,
          'COLOR_RAMP': 2,
          'POINT': 3,
          'LINE': 4,
          'POLYGON': 5,
          'TEXT': 6,
          'NORTH_ARROW': 7,
          'SCALE_BAR': 8,
          'STANDARD_LABEL_PLACEMENT': 9,
          'MAPLEX_LABEL_PLACEMENT': 10,
          'GRID': 11,
          'MESH_SYMBOL': 12,
          'LEGEND': 13,
          'TABLE_FRAME': 14,
          'MAP_SURROUND': 15,
          'DIMENSION_STYLE': 16,
          'LEGEND_ITEM': 17,
          'TABLE_FRAME_FIELD': 18,
          'AREA_LEGEND_PATCH': 19,
          'LINE_LEGEND_PATCH': 20
        },
        # For report styling
        'styling': {
            'BLACK_AND_WHITE': 'BLACK_AND_WHITE',
            'COOL_TONES': 'COOL_TONES',
            'NO_STYLING': 'NO_STYLING',
            'WARM_TONES': 'WARM_TONES'
        },
        # For report template
        'template': {
            'ATTR_LIST': 'ATTR_LIST',
            'ATTR_LIST_GROUP': 'ATTR_LIST_GROUP',
            'BASIC_SUM': 'BASIC_SUM',
            'BASIC_SUM_GROUP': 'BASIC_SUM_GROUP',
            'PAGE_PER_FEATURE': 'PAGE_PER_FEATURE'
        },
        # For text_type
        'text_type': {
            'CIRCLE': 'CIRCLE',
            'ELLIPSE': 'ELLIPSE',
            'LINE': 'LINE',
            'POINT': 'POINT',
            'POLYGON': 'POLYGON'
        },
        # For tga color mode
        'tga_color_mode': {
            '24-BIT_TRUE_COLOR': '24-BIT_TRUE_COLOR',
            '32-BIT_WITH_ALPHA': '32-BIT_WITH_ALPHA',
            '8-BIT_ADAPTIVE_PALETTE': '8-BIT_ADAPTIVE_PALETTE',
            '8-BIT_GRAYSCALE': '8-BIT_GRAYSCALE'
        },
        # For tiff compression
        'tiff_compression': {
            'NONE': 1,
            'JPEG': 2,
            'PACK_BITS': 3,
            'LZW': 4,
            'DEFLATE': 5
        },
        # For time_inclusion
        'time_inclusion': {
            'EXCLUDE_START_AND_END': 'EXCLUDE_START_AND_END',
            'INCLUDE_ONLY_START': 'INCLUDE_ONLY_START',
            'INCLUDE_ONLY_END': 'INCLUDE_ONLY_END',
            'INCLUDE_START_AND_END': 'INCLUDE_START_AND_END'
        },
        # For time zone type
        'time_zone_type': {
            'IANA': 'IANA',
            'IANA_ABBREVIATED': 'IANA_ABBREVIATED',
            'MICROSOFT_WINDOWS': 'MICROSOFT_WINDOWS'
        },
        # For view type
        'view_type': {
            'LAYOUTS': 'LAYOUTS',
            'MAPS': 'MAPS',
            'MAPS_AND_LAYOUTS': 'MAPS_AND_LAYOUTS',
            'REPORTS': 'REPORTS',
            'TABLES': 'TABLES'
        },
        # For web service type
        'web_service_type': {
            'AUTOMATIC': 'AUTOMATIC',
            'ARCGIS_SERVER_WEB': 'ARCGIS_SERVER_WEB',
            'KML': 'KML',
            'VECTOR_TILE': 'VECTOR_TILE',
            'WMS': 'WMS'
        },
        # For portal project merging conflict direction
        'merge_conflict_flow_direction': {
            'PUSH': 0,
            'PULL': 1
        },
    }

class AIXFormat(_ObjectWithoutInitCall):
    """AIXFormat(aix_path)


    TBD.


    aix_path(String):
    TBD."""

    clipToElements = passthrough_attr('clipToElements')
    convertMarkers = passthrough_attr('convertMarkers')
    embedColorProfile = passthrough_attr('embedColorProfile')
    embedFonts = passthrough_attr('embedFonts')
    filePath = passthrough_attr('filePath')
    height = passthrough_attr('height')
    imageCompression = passthrough_attr('imageCompression')
    imageQuality = passthrough_attr('imageQuality')
    imageCompressionQuality = passthrough_attr('imageCompressionQuality')
    removeLayoutBackground = passthrough_attr('removeLayoutBackground')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    width = passthrough_attr('width')

    @constants.maskargs
    def setImageCompression(self, image_compression):
        """AIXFormat.setImageCompression(image_compression)


        A string constant that represents the compression scheme used to
        compress image or raster data in the output file.


        image_compression(String):
        Below is a list of valid strings.

        * ADAPTIVE: JPEG and Deflate compression are combined, depending on the
        contents of the stream. This works well for most cases.

        * DEFLATE: Lossless compression method that works well for most cases.

        * JPEG: Lossy compression method that works well for photographic-type
        images.

        * JPEG2000: Higher-quality compression with file sizes
        smaller than JPEG . This compression is lossless if imageQuality is set
        to 100.

        * LZW: Lempel-Ziv-Welch,  a lossless compression method using a code
        table.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression, a lossless compression method
        that works well if there are large areas of the same color.
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageCompression(*gp_fixargs((image_compression,), True)))

    @constants.maskargs
    def setImageQuality(self, image_quality):
        """AIXFormat.setImageQuality(image_quality)


        A string constant that sets the amount of image resampling.


        image_quality(String):
        Below is a list of valid strings.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageQuality(*gp_fixargs((image_quality,), True)))

    def __init__(self, aix_path):
        """AIXFormat(aix_path)


        TBD.


        aix_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.AIXFormat(*gp_fixargs((aix_path,), True))

class ArcGISProject(_ObjectWithoutInitCall):
    """ArcGISProject(aprx_path)

    Provides a reference to an ArcGIS project (.aprx) stored on disk or to the project
    currently loaded within the ArcGIS Pro application using the CURRENT keyword.

    aprx_path(String):
    A string that includes the full system path and file name of an existing
    ArcGIS project ( .aprx ) or a string that contains the CURRENT keyword."""

    activeMap = passthrough_attr('activeMap')
    activeView = passthrough_attr('activeView')
    databases = passthrough_attr('databases')
    dateSaved = passthrough_attr('dateSaved')
    defaultGeodatabase = passthrough_attr('defaultGeodatabase')
    defaultToolbox = passthrough_attr('defaultToolbox')
    documentVersion = passthrough_attr('version')
    filePath = passthrough_attr('filePath')
    folderConnections = passthrough_attr('folderConnections')
    homeFolder = passthrough_attr('homeFolder')
    isReadOnly = passthrough_attr('isReadOnly')
    metadata = passthrough_attr('metadata')
    styles = passthrough_attr('styles')
    toolboxes = passthrough_attr('toolboxes')

    @constants.maskargs
    def closeViews(self, view_type='MAPS_AND_LAYOUTS'):
        """ArcGISProject.closeViews({view_type})


        Close view panes that are currently open in  ArcGIS Pro.


        view_type{String}:
        A constant that determines the type of views to be closed in the
        application. The default value is MAPS_AND_LAYOUTS.

        * LAYOUTS: Close all open layout view panes.

        * MAPS: Close all open map view panes.

        * MAPS_AND_LAYOUTS: Close all open layout and map view panes.

        * REPORTS: Close all open report view panes.

        * TABLES: Close all open table view panes.
        """
        return convertArcObjectToPythonObject(self._arc_object.closeViews(*gp_fixargs((view_type,), True)))

    def copyItem(self, project_item, new_name=None):
        """ArcGISProject.copyItem(project_item, {new_name})


        Creates a copy of an existing layout, map, or report project item.


        project_item(Object):
        An object reference that represents a supported project item to be
        copied.


        new_name{String}:
        An optional string that represents the name of the new project item.  If
        a name is not provided, the default name will follow the sequencing
        nomenclature, for example, Map, Map1, Map2.
        """
        return convertArcObjectToPythonObject(self._arc_object.copyItem(*gp_fixargs((project_item, new_name,), True)))

    def createGraphicElement(self, container, geometry, style_item=None, name=None, lock_aspect_ratio=True):
        """ArcGISProject.createGraphicElement(container, geometry, {style_item},
        {name}, {lock_aspect_ratio})


        The createGraphicElement method creates a GraphicElement in the
        specified container.


        container(Object):
        A reference to a Layout object, a graphics layer in a Map object, or a
        GroupElement object in a layout or a graphics layer.


        geometry(Object):
        The appropriate Point, Polyline, or Polygon object that will be used to
        construct the graphic element. Page units should be used for layouts and
        map units should be used for elements in a graphics layer.


        style_item{String}:
        An optional reference to a StyleItem. The style's intended geometry must
        match the geometry input parameter. If a style_item value is not
        specified, a default style item will be applied.


        name{String}:
        An optional string that represents the name of the new GraphicElement.
        If a name is not provided, the default name value will follow the
        automatic sequencing nomenclature, for example, Point, Point 1, Point 2,
        and so on.


        lock_aspect_ratio{Boolean}:
        An optional Boolean that controls how the element can be resized.  For
        example, if the value is True, setting the elementHeight value will also
        set the elementWidth value proportionally. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.createGraphicElement(*gp_fixargs((container, geometry, style_item, name, lock_aspect_ratio,), True)))

    def createGroupElement(self, container, element_list, name=None):
        """ArcGISProject.createGroupElement(container, element_list, {name})


        The createGroupElement method creates a GroupElement in the specified
        container.


        container(Object):
        A reference to a Layout object, a graphics layer in a Map object, or a
        GroupElement object in a layout or a graphics layer.


        element_list(List):
        A list of elements that will be placed in the newly created group. You
        can not create an empty group element, there must be existing elements
        to place in the group.


        name{String}:
        An optional string that represents the name of the new GroupElement.  If
        a name is not provided, the default name value will follow the automatic
        sequencing nomenclature, for example, Group Element, Group Element 1,
        Group Element 2, and so on.
        """
        return convertArcObjectToPythonObject(self._arc_object.createGroupElement(*gp_fixargs((container, element_list, name,), True)))

    @constants.maskargs
    def createLayout(self, page_width, page_height, page_units, name=None):
        """ArcGISProject.createLayout(page_width, page_height, page_units, {name})


        The createLayout method creates a Layout that will automatically get
        added to the Catalog pane.


        page_width(Double):
        A double that specifies the width of a layout and is based on the
        page_units.


        page_height(Double):
        A double that specifies the height of a layout and is based on the
        page_units.


        page_units(String):
        One of the following page units must be provided to describe the
        page_width and page_height values.

        * CENTIMETER: Page units are in centimeters.

        * INCH: Page units are in inches.

        * MILLIMETER: Page units are in millimeters.

        * POINT: Page units are in points where 72 points is 1 inch or 2.54
        centimeters.


        name{String}:
        A string that represents the name of the new layout.  If a name is not
        provided, the default name will follow the sequencing nomenclature, for
        example, Layout, Layout1, Layout2.
        """
        return convertArcObjectToPythonObject(self._arc_object.createLayout(*gp_fixargs((page_width, page_height, page_units, name,), True)))

    @constants.maskargs
    def createMap(self, name=None, map_type="Map"):
        """ArcGISProject.createMap({name}, {map_type})


        This method creates a map that will automatically get added to the
        Catalog pane.


        name{String}:
        A string that represents the name of the new map.  If a name is not
        provided, the default name will follow the sequencing nomenclature, for
        example, Map, Map1, Map2.


        map_type{String}:
        The type of map to be created and are defined by the keywords below. The
        default value is Map.

        * GLOBE: A new global scene

        * MAP: A new map

        * SCENE: A new local scene
        """
        return convertArcObjectToPythonObject(self._arc_object.createMap(*gp_fixargs((name, map_type,), True)))

    def createPictureElement(self, container, geometry, path, name=None, lock_aspect_ratio=True):
        """ArcGISProject.createPictureElement(container, geometry, path, {name},
        {lock_aspect_ratio})


        The createPictureElement method creates a PictureElement in the
        specified container.


        container(Object):
        A reference to a Layout object, a graphics layer object in a Map, or a
        GroupElement object in a layout or a graphics layer.


        geometry(Object):
        The appropriate Point, or Polygon object that will be used to construct
        the picture element. Page units should be used for layouts and map units
        should be used for elements in a graphics layer.


        path(String):
        A string that represents the full path and file name of the location of
        the picture.


        name{String}:
        An optional string that represents the name of the new PictureElement.
        If a name is not provided, the default name value will follow the
        automatic sequencing nomenclature, for example, Picture, Picture 1,
        Picture 2, and so on.


        lock_aspect_ratio{Boolean}:
        A Boolean that controls how the picture is inserted into the envelope.
        If set to False, the image will be stretched to fill the entire area of
        the envelope. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.createPictureElement(*gp_fixargs((container, geometry, path, name, lock_aspect_ratio), True)))

    @constants.maskargs
    def createPredefinedGraphicElement(self, container, geometry, shape_type, style_item=None, name=None, lock_aspect_ratio=True):
        """ArcGISProject.createPredefinedGraphicElement(container, geometry,
        shape_type, {style_item}, {name}, {lock_aspect_ratio})


        The createPredefinedGraphicElement method creates a GraphicElement in
        the specified container.


        container(Object):
        A reference to a Layout object, a graphics layer in a Map object, or a
        GroupElement object in a layout or a graphics layer.


        geometry(Object):
        The appropriate Point or Polygon object that will be used to construct
        the predefined GraphicElement object. Page units should be used for
        layouts and map units should be used for elements in a graphics layer.


        shape_type(String):
        A string constant that represents the predefined shape that will be
        created. The following is a list of valid values:

        * CIRCLE: A predefined circle shape will be created.

        * CLOUD: A predefined cloud shape will be created.

        * CROSS: A predefined cross shape will be created.

        * ELLIPSE: A predefined ellipse shape will be created.

        * HALF_CIRCLE: A predefined half circle shape will be created.

        * RECTANGLE: A predefined rectangle shape will be created.

        * RIGHT_TRIANGLE: A predefined right triangle shape will be created.

        * ROUNDED_RECTANGLE: A predefined rounded rectangle shape will be
        created.

        * TRIANGLE: A predefined triangle shape will be created.

        * X: A predefined X shape will be created.


        style_item{String}:
        An optional reference to a StyleItem. The style's intended geometry must
        match the geometry input parameter. If a style_item value is not
        specified, a default style item will be applied.


        name{String}:
        An optional string that represents the name of the new GraphicElement.
        If a name is not provided, the default name value will follow the
        automatic sequencing nomenclature, for example, Circle, Circle 1, Circle
        2, and so on.


        lock_aspect_ratio{Boolean}:
        An optional Boolean that controls how the element can be resized.  For
        example, if the value is True, setting the elementHeight value will also
        set the elementWidth value proportionally. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.createPredefinedGraphicElement(*gp_fixargs((container, geometry, shape_type, style_item, name, lock_aspect_ratio,), True)))

    @constants.maskargs
    def createReport(self, page_info, data_source, fields=None, statistics=None, name=None, template='ATTR_LIST', styling='BLACK_AND_WHITE'):
        """ArcGISProject.createReport(page_info, data_source, {fields},
        {statistics}, {name}, {template}, {styling})


        The createReport method creates a report that is automatically added to
        the Catalog pane.


        page_info(Dictionary):
        A dictionary that specifies the page width, height, units, and margins
        for the new report.The page width and height are based on the units key
        value.The page margins restrict editable space for the report. An 8.5
        inch by 11 inch report, for example, with NORMAL margins will display as
        6.5 inches by 9 inches in a new Report view.  The margin key values are
        defined as follows:





        NORMAL

        The page margins will be 1 inch, 72 points, 2.54 centimeters, or 25.4
        millimeters.

        NARROWThe page margins will be 0.5 inches, 36 points, 1.27 centimeters,
        or12.7 millimeters.

         MODERATE

        The page margins will be 1 inch, 72 points, 2.54 centimeters, or 25.4
        millimeters for top and bottom margins and 0.75 inch, 54 points, 1.905
        centimeters, or 12.05 millimeters for left and right margins.

        WIDEThe page margins will be 1 inch, 72 points, 2.54 centimeters, or
        25.4 millimeters for top and bottom margins and 2 inches, 144 points,
        5.08 centimeters, or 50.8 millimeters for left and right margins.

        * CENTIMETER: The page units will be centimeters.

        * INCH: The page units will be inches.

        * MILLIMETER: The page units will be millimeters.

        * POINT: The page units will be points in which 72 points is 1 inch or
        2.54 centimeters.


        data_source(Object):
        A Layer object, a Table object, or a string that represents the path to
        an external data source.


        fields{Dictionary}:
        A list of field dictionaries that include the following keys:
        The sortInfo values are defined as follows:ASCSort the field in
        ascending order.DESCSort the field in descending order.NONEDo not sort
        the field, use the database order.

        * fieldName: The field name for the report.

        * groupField: Set to True if the field should be used as a group.

        * sortInfo: The field sorting information for the report.


        statistics{Dictionary}:
        A list of statistic dictionaries that include field name and statistic
        type. If a value is specified, the fields parameter is required.  The
        keys for the dictionary are defined as follows:The acceptable statistic
        values are defined as follows:COUNTThe row count for a group or report
        will be identified.MEANThe mean of a numeric field for a group or report
        will be computed.MEDIANThe median of a numeric field for a group or
        report will be computed.SUMThe sum of a numeric field for a group or
        report will be computed.STD_DEVThe standard deviation of a numeric field
        for a group or report. will be computedMAXThe maximum of a field for a
        group or report will be identified.MINThe minimum of a field for a group
        or report will be identified.

        * fieldName: The field name for the statistic.

        * statistic: The statistic type for the report.


        name{String}:
        A string that represents the name of the new report.  If no name is
        provided, the default name value will follow the sequencing
        nomenclature, for example, Report, Report1, Report2.


        template{String}:
        A string that represents a default template for the new report. The
        acceptable  values are defined as follows: The default value is
        ATTR_LIST.

        * ATTR_LIST: Generates a list of rows with columns from the chosen
        fields.

        * ATTR_LIST_GROUP: Generates a list of rows with columns from the chosen
        fields, grouped by a unique field.

        * BASIC_SUM: Generates a list of the specified summary statistics. No
        individual rows are listed.

        * BASIC_SUM_GROUP: Generates a list of the specified summary statistics,
        grouped by a unique field. No individual rows are listed.

        * PAGE_PER_FEATURE: Generates a separate page for each feature listing
        the chosen fields.


        styling{String}:
        A string that represents a default styling for the new report. The
        acceptable values are defined as follows: The default value is
        BLACK_AND_WHITE.

        * BLACK_AND_WHITE: Greyscale styling with black fonts.

        * COOL_TONES: Blue lines and backgrounds with gray fonts.

        * NO_STYLING: No styling.

        * WARM_TONES: Orange lines and backgrounds with gray fonts.
        """
        return convertArcObjectToPythonObject(self._arc_object.createReport(*gp_fixargs((page_info, data_source, fields, statistics,
        name, template, styling,), True)))

    @constants.maskargs
    def createTextElement(self, container, geometry, text_type, text, text_size=None, font_family_name=None, font_style_name=None,
    style_item=None, name=None, lock_aspect_ratio=False):
        """ArcGISProject.createTextElement(container, geometry, text_type, text,
        {text_size}, {font_family_name}, {font_style_name}, {style_item},
        {name}, {lock_aspect_ratio})


        The createTextElement method creates a TextElement object in the
        specified container.


        container(Object):
        A Layout object, a graphics layer in a Map object, or a  GroupElement
        object in a layout or a graphics layer.


        geometry(Object):
        The appropriate Point, Polyline, or Polygon object that will be used to
        construct the text element. Use page units for layouts and map units for
        elements in a graphics layer.


        text_type(String):
        Specifies the type of text that will be created. The following is a list
        of valid values:

        * CIRCLE: Circle paragraph text will be created.

        * ELLIPSE: Ellipse paragraph text will be created.

        * LINE: Text along a polyline will be created.

        * POINT: Straight text will be created.

        * POLYGON: Rectangle or polygon paragraph text will be created.


        text(String):
        The text string associated with the element.


        text_size{Double}:
        The size of the text in points.


        font_family_name{String}:
        The text symbol font associated with the element. The value that appears
        in the Font name drop-down list on the ribbon does not always match the
        font_style_name property. Variable fonts contain named instances of font
        styles and also allow customization. Before setting a value, you can set
        it on the ribbon and verify the property value returned.


        font_style_name{String}:
        The font style name. Depending on the font, the style may include
        regular, bold, italic, any combination of these, or an extended list.
        The value that appears in the Font style drop-down list on the ribbon
        does not always match the font_style_name property. Variable fonts
        contain named instances of font styles and also allow customization.
        Before setting a value, you can set it on the ribbon and verify the
        property value returned.


        style_item{String}:
        A StyleItem object. The style's intended geometry must match the
        geometry input parameter. If a style_item value is not provided, a
        default style item will be applied.


        name{String}:
        The new TextElement name.  If no name is provided, the default name
        value will follow the automatic sequencing nomenclature, for example,
        Point, Point 1, Point 2, and so on.


        lock_aspect_ratio{Boolean}:
        Specifies whether the element can be resized.  For example, if the value
        is True, setting the elementHeight value will also set the elementWidth
        value proportionally.  This setting does not apply to point text. The
        default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.createTextElement(*gp_fixargs((container, geometry, text_type, text, text_size, font_family_name, font_style_name, style_item, name, lock_aspect_ratio,), True)))

    def deleteItem(self, project_item):
        """ArcGISProject.deleteItem(project_item)


        Deletes a layout, map, or report project item.


        project_item(Object):
        An object that represents a supported project item to be deleted.
        """
        return convertArcObjectToPythonObject(self._arc_object.deleteItem(*gp_fixargs((project_item,), True)))

    def importDocument(self, document_path, include_layout=True, reuse_existing_maps = False, log_files=True):
        """ArcGISProject.importDocument(document_path, {include_layout},
        {reuse_existing_maps}, {log_files})


        Imports map (.mxd), globe (.3dd), and scene (.sxd) documents into an
        ArcGIS Pro project.  It can also be used to import the contents of  map
        files (.mapx), layout files (.pagx), and report files (.rptx).


        document_path(String):
        A string that includes the system path and name of a document (.mxd,
        .3dd, or .sxd) or a map file (.mapx), layout file ( .pagx), or report
        file (.rptx).


        include_layout{Boolean}:
        A Boolean parameter indicating whether the layout from a map document
        (.mxd) is imported.  If  set to True, the layout and all data frames are
        imported. If set to False, only the data frames are imported.  This
        parameter is ignored for other file types. The default value is True.


        reuse_existing_maps{Boolean}:
        A Boolean parameter to prevent the creation of duplicate maps in the
        project. If reuse_existing_maps is set to True, it checks the project
        for the maps referenced in the imported file and only copies maps that
        don't already exist in the project.  There may be cases in which maps
        have the same name in different imported sources, so you may want to set
        this value to  False. The default value is False.


        log_files{Boolean}:
        A Boolean parameter that controls if log files are written to the
        ImportLog folder in the project's homeFolder.  Log files can be useful
        for identifying possible warnings and errors during import but they can
        also accumulate if not properly managed. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.importDocument(*gp_fixargs((document_path, include_layout, reuse_existing_maps, log_files), True)))

    def listBasemaps(self, wildcard=None):
        """ArcGISProject.listBasemaps({wildcard})


        The listBasemaps method references basemaps  available in a project.


        wildcard{String}:
        A wildcard is based on the label as it appears in the basemap gallery in
        the application and is not case sensitive.  A combination of asterisks
        (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listBasemaps(*gp_fixargs((wildcard,), True)))

    def listBrokenDataSources(self):
        """ArcGISProject.listBrokenDataSources()


        Returns a Python list of Layer and/or Table objects that have broken
        connections to their original source data for all maps in a project.
        """
        return convertArcObjectToPythonObject(self._arc_object.listBrokenDataSources(*gp_fixargs((), True)))

    def listColorRamps(self, wildcard=None):
        """ArcGISProject.listColorRamps({wildcard})


        The listColorRamps method references color ramps  available in a
        project.


        wildcard{String}:
        A wildcard is based on the color ramp name as it appears in the
        application.  A combination of asterisks (*) and characters can be used
        to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listColorRamps(*gp_fixargs((wildcard,), True)))

    def listLayouts(self, wildcard=None):
        """ArcGISProject.listLayouts({wildcard})


        Returns a Python list of Layout objects in an ArcGIS project (.aprx).


        wildcard{String}:
        A wildcard is based on the layout name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listLayouts(*gp_fixargs((wildcard,), True)))

    def listMaps(self, wildcard=None):
        """ArcGISProject.listMaps({wildcard})


        Returns a Python list of Map objects in an ArcGIS project (.aprx).


        wildcard{String}:
        A wildcard is based on the map name and is not case sensitive. A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listMaps(*gp_fixargs((wildcard,), True)))

    def listReports(self, wildcard=None):
        """ArcGISProject.listReports({wildcard})


        Returns a Python list of Report objects in an ArcGIS project (.aprx).


        wildcard{String}:
        A wildcard is based on the report name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listReports(*gp_fixargs((wildcard,), True)))

    @constants.maskargs
    def listStyleItems(self, style, style_class=None, wildcard=None):
        """ArcGISProject.listStyleItems(style, {style_class}, {wildcard})


        The listStyleItems method references system, personal, and custom styles
        available in a project.


        style(String):
        A string that represents either a system style name such as ArcGIS 2D, a
        personal style such as Favorites, or a custom .stylx file.
        Styles must exist in the project before they can be referenced using
        listStyleItems.  Custom .stylx files must be loaded and saved in a
        project. They are  referenced  by passing in their full path and
        filename. The default value is None.


        style_class{String}:
        A string that represents the class of the style items as they appear in
        the Catalog View window. The default value is None.

        * LEGEND: Legend elements

        * LEGEND_ITEM: Legend items

        * LINE: Polyline graphic elements

        * NORTH_ARROW: North arrow map surround elements

        * POINT: Point graphic elements

        * POLYGON: Polygon graphic elements

        * SCALE_BAR: North arrow map surround elements

        * TABLE_FRAME: Table frame elements

        * TEXT: Text graphic elements


        wildcard{String}:
        A wildcard based on the style item name as it appears in the
        application.  A combination of asterisks (*) and characters can be used
        to limit the length of the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listStyleItems(*gp_fixargs((style, style_class, wildcard), True)))

    def setMergingStrategy(self, merge_conflict_flow_direction = 'PUSH'):
        """ArcGISProject.setMergingStrategy(merge_conflict_flow_direction)


        Set merging strategy when there is conflict.


        merge_conflict_flow_direction(String):
        A string defines the merging flow direction.
        """
        return convertArcObjectToPythonObject(self._arc_object.setMergingStrategy(*gp_fixargs((merge_conflict_flow_direction,), True)))

    def save(self):
        """ArcGISProject.save()


        Saves changes to an ArcGISProject  (.aprx).
        """
        return convertArcObjectToPythonObject(self._arc_object.save(*gp_fixargs((), True)))

    def saveACopy(self, file_name):
        """ArcGISProject.saveACopy(file_name)


        Saves an ArcGISProject (.aprx) to a new file path or name.


        file_name(String):
        A string used to save an ArcGISProject (.aprx) to a new file path or
        file name.
        """
        return convertArcObjectToPythonObject(self._arc_object.saveACopy(*gp_fixargs((file_name,), True)))

    def updateConnectionProperties(self, current_connection_info, new_connection_info, auto_update_joins_and_relates=True, validate=True, ignore_case=False):
        """ArcGISProject.updateConnectionProperties(current_connection_info,
        new_connection_info, {auto_update_joins_and_relates}, {validate},
        {ignore_case})


        The updateConnectionProperties method replaces connection properties
        using a dictionary or a path to a workspace.


        current_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties to the source you want to update. If an
        empty string or None is used in current_connection_info, all connection
        properties will be replaced with the new_workspace_info, depending on
        the value of the validate parameter.


        new_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties with the new source information.


        auto_update_joins_and_relates{Boolean}:
        If  set to True, the updateConnectionProperties method will also update
        the connections for associated joins or relates. The default value is
        True.


        validate{Boolean}:
        If  set to True, the connection properties will only be updated if the
        new_connection_info value is a valid connection.  If it is not valid,
        the connection will not be replaced.   If set to False, the method will
        set all connections to match the new_connection_info value, regardless
        of a valid match.  In this case, if a match does not exist, the data
        sources would be broken. The default value is True.


        ignore_case{Boolean}:
        Determines whether searches will be case sensitive. By default, queries
        are case sensitive. To perform queries that are not case sensitive, set
        ignore_case to True. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateConnectionProperties(*gp_fixargs((current_connection_info, new_connection_info, auto_update_joins_and_relates, validate, ignore_case), True)))

    def updateDatabases(self, databases, validate=True):
        """ArcGISProject.updateDatabases(databases, {validate})


        The updateDatabases method replaces project databases using a list of
        dictionaries that describe each database.


        databases(List):
        A list of Python dictionaries that each contain properties to an
        individual database.  The dictionary keys are defined below.

        * databasePath: A local or UNC path to a database.

        * isDefaultDatabase: The default geodatabase.  One valid geodatabase
        must be set to True. This property can be locked by systems
        administrators through Application settings.


        validate{Boolean}:
        If  set to True, the database will only be added if the  databasePath is
        a valid database.  If it is not valid, the database will not be added
        and the function will return the dictionary as an invalid database.   If
        set to False, the method will add  all the databases to the project,
        regardless of whether the database can be connected to. The default
        value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateDatabases(*gp_fixargs((databases, validate), True)))

    def updateFolderConnections(self, folder_connections, validate=True):
        """ArcGISProject.updateFolderConnections(folder_connections, {validate})


        The updateFolderConnections method replaces project folder connections
        using a list of dictionaries that describe each connection.


        folder_connections(List):
        A list of Python dictionaries that each contain connection properties to
        an individual folder.  The dictionary keys are defined below.

        * alias: An alternative label for a folder connection. If left as an
        empty string, the alias will match the connectionString value.

        * connectionString: A local or UNC path to a system folder.

        * isHomeFolder: The default home folder.  One folder must be set to
        True. This property can be locked by systems administrators through
        Application settings.


        validate{Boolean}:
        If  set to True, the folder will only be added if the  connectionString
        is a valid path.  If it is not valid, the folder will not be added and
        the function will return the dictionary as an invalid folder.   If set
        to False, the method will add  all the folders to the project,
        regardless of whether the folder is valid. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateFolderConnections(*gp_fixargs((folder_connections, validate), True)))

    def updateStyles(self, styles):
        """ArcGISProject.updateStyles(styles)


        The updateStyles method updates project styles using a list of strings.


        styles(List):
        A list of strings that are either a system style keyword such as ArcGIS
        2D or the full path to a custom .stylx file.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateStyles(*gp_fixargs((styles,), True)))

    def updateToolboxes(self, toolboxes, validate=True):
        """ArcGISProject.updateToolboxes(toolboxes, {validate})


        The updateToolboxes method replaces project toolboxes using a list of
        dictionaries.


        toolboxes(List):
        A list of Python dictionaries that each contain toolbox information.
        The dictionary keys are defined below.

        * toolboxPath: A local or UNC path to an ArcGIS toolbox (*.atbx), a
        Legacy toolbox (*.tbx), or a Python toolbox (*.pyt).

        * validate: The default project toolbox.  One toolbox must be set to
        True. This property can be locked by systems administrators through
        application settings.


        validate{Boolean}:
        Specifies whether all toolboxes will be added to the project. If  set to
        True, the toolbox will only be added if the  toolboxPath value is a
        valid path.  If it is not valid, the toolbox will not be added and the
        function will return the dictionary as an invalid toolbox.   If set to
        False, all the toolboxes will be added to the project, regardless of
        whether the folder is valid. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateToolboxes(*gp_fixargs((toolboxes, validate), True)))

    def __init__(self, aprx_path):
        """ArcGISProject(aprx_path)


        Provides a reference to an ArcGIS project ( .aprx ) stored on disk or to the
        project currently loaded within the ArcGIS Pro application using the
        CURRENT keyword.


        aprx_path(String):
        A string that includes the full system path and file name of an existing ArcGIS
        project (.aprx) or a string that contains the CURRENT keyword.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.ArcGISProject(*gp_fixargs((aprx_path,), True))

class BMPFormat(_ObjectWithoutInitCall):
    """BMPFormat(bmp_path)


    TBD.


    bmp_path(String):
    TBD."""

    clipToElements = passthrough_attr('clipToElements')
    colorMode = passthrough_attr('colorMode')
    filePath = passthrough_attr('filePath')
    georeferenceMapFrame = passthrough_attr('georeferenceMapFrame')
    height = passthrough_attr('height')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    threshold = passthrough_attr('threshold')
    width = passthrough_attr('width')
    worldFile = passthrough_attr('worldFile')

    @constants.maskargs
    def setColorMode(self, bmp_color_mode):
        """BMPFormat.setColorMode(color_mode)


        A string constant that represents the number of bits to describe color
        in a pixel.


        color_mode(String):
        Below is a list of valid strings.

        * 1-BIT_MONOCHROME_THRESHOLD: 2 possible colors, black and white. The
        areas
        which are white and black are determined by the threshold value.

        * 24-BIT_TRUE_COLOR: 16,777,216 possible colors. This option is good for
        maximum color fidelity.

        * 8-BIT_ADAPTIVE_PALETTE: Uses 256 of the most commonly-used pixel
        colors in the image’s palette, thereby minimizing the number of pixels
        whose color may change during output.

        * 8-BIT_GRAYSCALE: 256 shades of gray. All colors are converted to
        grayscale.
        """
        return convertArcObjectToPythonObject(self._arc_object.setColorMode(*gp_fixargs((bmp_color_mode,), True)))

    def __init__(self, bmp_path):
        """BMPFormat(bmp_path)


        TBD.


        bmp_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.BMPFormat(*gp_fixargs((bmp_path,), True))

class Bookmark(_ObjectWithoutInitCall):
    """Provides access to bookmark methods and properties."""
    description = passthrough_attr('description')
    hasThumbnail = passthrough_attr('hasThumbnail')
    map = passthrough_attr('map')
    name = passthrough_attr('name')

    def updateThumbnail(self):
        """Bookmark.updateThumbnail()


        Updates a bookmark's thumbnail image.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateThumbnail(*gp_fixargs((), True)))

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isBookmarkSame(*gp_fixargs((other,), True)))

class BookmarkMapSeries(_ObjectWithoutInitCall):
    """ BookmarkMapSeries object provides access to properties."""
    bookmarks = passthrough_attr('bookmarks')
    currentBookmark = passthrough_attr('currentBookmark')
    currentPageNumber = passthrough_attr('currentPageNumber')
    enabled = passthrough_attr('enabled')
    mapFrame = passthrough_attr('mapFrame')
    pageCount = passthrough_attr('pageCount')

    def export(self, export_format, mapseries_export_options=None):
        """BookmarkMapSeries.export(export_format, {mapseries_export_options})


        The export method exports a BookmarkMapSeries using a specified export
        format and optionally different mapseries_export_options.


        export_format(Object):
        The supported export format object is PDFFormat.


        mapseries_export_options{Object}:
        The MapSeriesExportOptions object that includes changes to default
        property values.
        """
        return convertArcObjectToPythonObject(self._arc_object.export(*gp_fixargs((export_format, mapseries_export_options,), True)))

    @constants.maskargs
    def exportToPDF(self, out_pdf, page_range_type="ALL", page_range_string="", multiple_files="PDF_SINGLE_FILE", resolution=96,
    image_quality='BEST', compress_vector_graphics=True, image_compression='ADAPTIVE', embed_fonts=True, layers_attributes='LAYERS_ONLY',
    georef_info=True, jpeg_compression_quality=80, clip_to_elements=False, output_as_image=False,
    embed_color_profile=True, pdf_accessibility=False, show_export_count=False, keep_layout_background=True, convert_markers=False,
    simulate_overprint=False):
        """BookmarkMapSeries.exportToPDF(out_pdf, {page_range_type},
        {page_range_string}, {multiple_files}, {resolution}, {image_quality},
        {compress_vector_graphics}, {image_compression}, {embed_fonts},
        {layers_attributes}, {georef_info}, {jpeg_compression_quality},
        {clip_to_elements}, {output_as_image}, {embed_color_profile},
        {pdf_accessibility}, {show_export_count}, {keep_layout_background},
        {convert_markers}, {simulate_overprint})


        Exports a specified set of pages to a Portable Document Format (PDF)
        file for a layout that has map series enabled.


        out_pdf(String):
        A string that represents the path and file name of the output export
        file.


        page_range_type{String}:
        The string value that designates how the pages will be printed. The
        default value is ALL.

        * ALL: All pages are exported.

        * CURRENT: The active or current page is exported.

        * RANGE: Only pages listed in the page_range_string parameter are
        exported.

        * SELECTED: Does not apply to bookmark map series.This option can only
        be used for a spatial map series in which index features can be
        selected. If it is used with a bookmark map series, all pages will be
        exported.


        page_range_string{String}:
        A string that identifies the pages to be exported if the RANGE option in
        the page_range_type parameter is used (for example, 1, 3, 5-12).   If
        any other page_range_type value is used, the page_range_string value
        will be ignored.


        multiple_files{String}:
        A string that controls how the output PDF file is created.  By default,
        all pages are exported into a single, multipage document. The default
        value is PDF_SINGLE_FILE.

        * PDF_MULTIPLE_FILES_PAGE_NAME: Export  each map series page to an
        individual file and append the page name to the file name.  For example,
        Output.PDF will become Output_LakeErie.PDF

        * PDF_MULTIPLE_FILES_PAGE_NUMBER: Export  each map series page to an
        individual file and append the page number to the file name. For
        example, Output.PDF will become Output_1.PDF

        * PDF_SINGLE_FILE: Export  into a multipage, single file document.


        resolution{Integer}:
        An integer that defines the resolution of the export file in dots per
        inch (dpi). The default value is 96.


        image_quality{String}:
        A string that defines output image quality. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls the compression of vector and text portions of
        the output file. Image compression is defined separately. The default
        value is True.


        image_compression{String}:
        A string that defines the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in an export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        layers_attributes{String}:
        A string that controls the inclusion of PDF layers and PDF object data
        (attributes) in the export file. The default value is LAYERS_ONLY.

        * LAYERS_AND_ATTRIBUTES: Export PDF layers and feature attributes.

        * LAYERS_ONLY: Export PDF layers only.

        * NONE: No setting is applied.


        georef_info{Boolean}:
        A Boolean that enables the export of coordinate system information for
        each map frame into the output PDF file. The default value is True.


        jpeg_compression_quality{Integer}:
        A number that controls the compression quality value when
        image_compression is set to ADAPTIVE or JPEG. The valid range is 1
        through 100.    A jpeg_compression_quality of 100 provides the best
        quality images but creates large export files.   The recommended range
        is 70 through 90. The default value is 80.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        pdf_accessibility{Boolean}:
        Output a tagged PDF file where text can be read by screen readers or
        other assistive technology.  A tagged PDF file can include alt text—a
        text
        description of a graphic element that a screen reader uses to
        describe the element—for map frames, pictures, and chart frames.
        Alt text is added in the
        Element Pane
         for each element. The default value is False.


        show_export_count{Boolean}:
        If set to True, you will see the status of each page being exported
        displayed in the Python shell. The default value is False.


        keep_layout_background{Boolean}:
        If set to True, the white background will be included in the export. The
        default value is True.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.


        simulate_overprint{Boolean}:
        Sometimes called soft proofing, simulating overprinting shows a
        representation of how overlapping areas of ink will appear when printed
        on a page.  You set up overprinting on symbol layers. The default value
        is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPDF(*gp_fixargs((out_pdf, page_range_type, page_range_string,
        multiple_files ,resolution, image_quality, compress_vector_graphics, image_compression, embed_fonts, layers_attributes, georef_info,
        jpeg_compression_quality, clip_to_elements, None, output_as_image, embed_color_profile, pdf_accessibility,
        show_export_count, keep_layout_background, convert_markers, simulate_overprint), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """BookmarkMapSeries.getDefinition(cim_version)


        Returns a bookmark map series' CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version), True)))))

    def getPageNumberFromName(self, page_name):
        """BookmarkMapSeries.getPageNumberFromName(page_name)


        Returns the page number that corresponds to  the name of the currently
        displayed bookmark map series page.


        page_name(String):
        The name of the Bookmark based on the Name field that was used to set up
        the map series.
        """
        return convertArcObjectToPythonObject(self._arc_object.getPageNumberFromName(*gp_fixargs((page_name,), True)))

    def refresh(self):
        """BookmarkMapSeries.refresh()


        Refreshes an existing bookmark map series.
        """
        return convertArcObjectToPythonObject(self._arc_object.refresh(*gp_fixargs((), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """BookmarkMapSeries.setDefinition(definition_object)


        Sets a bookmark map series' CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

class Camera(_ObjectWithoutInitCall):
    """The Camera object provides access to  2D and 3D viewer properties that
       control the display in a MapFrame ."""
    heading = passthrough_attr('heading')
    mode = passthrough_attr('mode')
    pitch = passthrough_attr('pitch')
    roll = passthrough_attr('roll')
    scale = passthrough_attr('scale')
    X = passthrough_attr('X')
    Y = passthrough_attr('Y')
    Z = passthrough_attr('Z')
    def getExtent(self):
        """Camera.getExtent()


        Returns an Extent object for a 2D map frame.
        """
        return convertArcObjectToPythonObject(self._arc_object.getExtent(*gp_fixargs((), True)))

    def setExtent(self, extent):
        """Camera.setExtent(extent)


        Sets the Extent for a map frame in a layout.


        extent(Extent):
        A geoprocessing Extent object.
        """
        return convertArcObjectToPythonObject(self._arc_object.setExtent(*gp_fixargs((extent,), True)))

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isCameraSame(*gp_fixargs((other,), True)))

class ElevationSurface(_ObjectWithoutInitCall):
    """ElevationSurface provides access to elevation surface level information in a Project."""
    name = passthrough_attr('name')
    verticalExaggeration = passthrough_attr('verticalExaggeration')

    def listElevationSources(self, wildcard=None):
        """ElevationSurface.listElevationSources({wildcard})


        Returns a Python list of ElevationSource objects that are associated
        with an ElevationSurface object.


        wildcard{String}:
        A wildcard is based on the elevation surface name and is not case
        sensitive. A combination of asterisks (*) and characters can be used to
        help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listElevationSources(*gp_fixargs((wildcard,), True)))

class ElevationSource(_ObjectWithoutInitCall):
    """ElevationSource provides access to elevation source level information in a Project."""
    dataSource = passthrough_attr('dataSource')
    name = passthrough_attr('name')
    visible = passthrough_attr('visible')

class EMFFormat(_ObjectWithoutInitCall):
    """EMFFormat(emf_path)


    TBD.


    emf_path(String):
    TBD.
    """
    clipToElements = passthrough_attr('clipToElements')
    convertMarkers = passthrough_attr('convertMarkers')
    filePath = passthrough_attr('filePath')
    height = passthrough_attr('height')
    imageQuality = passthrough_attr('imageQuality')
    outputAsImage = passthrough_attr('outputAsImage')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    width = passthrough_attr('width')

    @constants.maskargs
    def setImageQuality(self, image_quality):
        """EMFFormat.setImageQuality(image_quality)


        A string constant that sets the amount of image resampling.


        image_quality(String):
        Below is a list of valid strings.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageQuality(*gp_fixargs((image_quality,), True)))

    def __init__(self, emf_path):
        """EMFFormat(emf_path)


        TBD.


        emf_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.EMFFormat(*gp_fixargs((emf_path,), True))

class EPSFormat(_ObjectWithoutInitCall):
    """EPSFormat(eps_path)


    TBD.


    eps_path(String):
    TBD.
    """
    clipToElements = passthrough_attr('clipToElements')
    convertMarkers = passthrough_attr('convertMarkers')
    embedFonts = passthrough_attr('embedFonts')
    filePath = passthrough_attr('filePath')
    height = passthrough_attr('height')
    imageCompression = passthrough_attr('imageCompression')
    imageQuality = passthrough_attr('imageQuality')
    outputAsImage = passthrough_attr('outputAsImage')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    width = passthrough_attr('width')

    @constants.maskargs
    def setImageCompression(self, eps_compression):
        """EPSFormat.setImageCompression(image_compression)


        A string constant that represents the compression scheme used to
        compress image or raster data in the output file.


        image_compression(String):
        Below is a list of valid strings.

        * DEFLATE: Lossless compression method that works well for most cases.

        * LZW: Lossless compression method using a code table.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression, a lossless compression method
        that works well if there are large areas of the same color.
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageCompression(*gp_fixargs((eps_compression,), True)))

    @constants.maskargs
    def setImageQuality(self, image_quality):
        """EPSFormat.setImageQuality(image_quality)


        A string constant that sets the amount of image resampling.


        image_quality(String):
        Below is a list of valid strings.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageQuality(*gp_fixargs((image_quality,), True)))

    def __init__(self, eps_path):
        """EPSFormat(eps_path)


        TBD.


        eps_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.EPSFormat(*gp_fixargs((eps_path,), True))

class GIFFormat(_ObjectWithoutInitCall):
    """GIFFormat(gif_path)


    TBD.


    gif_path(String):
    TBD.
    """
    clipToElements = passthrough_attr('clipToElements')
    colorMode = passthrough_attr('colorMode')
    filePath = passthrough_attr('filePath')
    georeferenceMapFrame = passthrough_attr('georeferenceMapFrame')
    height = passthrough_attr('height')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    threshold = passthrough_attr('threshold')
    width = passthrough_attr('width')
    worldFile = passthrough_attr('worldFile')

    @constants.maskargs
    def setColorMode(self, gif_color_mode):
        """GIFFormat.setColorMode(color_mode)


        A string constant that represents the number of bits to describe color
        in a pixel.


        color_mode(String):
        Below is a list of valid strings.

        * 1-BIT_MONOCHROME_THRESHOLD: 2 possible colors, black and white. The
        areas which are white and black are determined by the threshold value.

        * 8-BIT_ADAPTIVE_PALETTE: Uses 256 of the most commonly-used pixel
        colors in the image’s palette, thereby minimizing the number of pixels
        whose color may change during output.

        * 8-BIT_GRAYSCALE: 256 shades of gray. All colors are converted to
        grayscale.
        """
        return convertArcObjectToPythonObject(self._arc_object.setColorMode(*gp_fixargs((gif_color_mode,), True)))

    def __init__(self, gif_path):
        """GIFFormat(gif_path)


        TBD.


        gif_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.GIFFormat(*gp_fixargs((gif_path,), True))

class GraphicElement(_ObjectWithoutInitCall):
    """The GraphicElement object provides access to properties that enables its
       repositioning on the page layout, as well as methods that allow for
       duplicating and deleting existing graphic elements."""
    anchor = passthrough_attr('anchor')
    elementHeight = passthrough_attr('elementHeight')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementRotation = passthrough_attr('elementRotation')
    elementWidth = passthrough_attr('elementWidth')
    isGroup = passthrough_attr('isGroup')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    def applyStyleItem(self, style_item):
        """GraphicElement.applyStyleItem(style_item)


        The applyStyleItem method applies a style item to a graphic element.


        style_item(StyleItem):
        A reference to a StyleItem in a project.
        """
        return convertArcObjectToPythonObject(self._arc_object.applyStyleItem(*gp_fixargs((style_item,), True)))

    def clone(self, suffix=None):
        """GraphicElement.clone({suffix})


        Provides a mechanism to clone an existing graphic element on a page
        layout.


        suffix{String}:
        An optional string that is used to tag each newly created graphic
        element.  The new element will get the same element name as the parent
        graphic plus the suffix value along with  a numeric sequencer.  For
        example, if the parent element name is Line and the suffix value is
        _copy, the newly cloned elements are named  Line_copy, Line_copy_1,
        Line_copy_2, and so on.  If a suffix is not provided, the results
        resemble Line_1, Line_2, Line_3, and so on.
        """
        return convertArcObjectToPythonObject(self._arc_object.clone(*gp_fixargs((suffix,), True)))

    def delete(self):
        """GraphicElement.delete()


        Provides a mechanism to delete an existing graphic element on a page
        layout.
        """
        return convertArcObjectToPythonObject(self._arc_object.delete(*gp_fixargs((), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """GraphicElement.getDefinition(cim_version)


        Returns a graphic element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def setAnchor(self, anchor):
        """GraphicElement.setAnchor(anchor)


        The setAnchor method controls the anchor position for a GraphicElement.


        anchor(String):
        A string that specifies the location of the anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """GraphicElement.setDefinition(definition_object)


        Sets a graphic element's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isGraphicElementSame(*gp_fixargs((other,), True)))

class GroupElement(_ObjectWithoutInitCall):
    """Provides access to group element properties."""
    anchor = passthrough_attr('anchor')
    elementHeight = passthrough_attr('elementHeight')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementRotation = passthrough_attr('elementRotation')
    elements = passthrough_attr('elements')
    elementWidth = passthrough_attr('elementWidth')
    isGroup = passthrough_attr('isGroup')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    @constants.maskargs
    def getDefinition(self, cim_version):
        """GroupElement.getDefinition(cim_version)


        Returns a graphic element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def setAnchor(self, anchor):
        """GroupElement.setAnchor(anchor)


        The setAnchor method controls the anchor position for a GroupElement
        value.


        anchor(String):
        A string that specifies the location of the anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """GroupElement.setDefinition(definition_object)


        Sets a group element's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    def ungroupElements(self):
        """GroupElement.ungroupElements()


        The ungroupElements method separates all elements in the group element.
        """
        return convertArcObjectToPythonObject(self._arc_object.ungroupElements(*gp_fixargs((), True)))

class JPEGFormat(_ObjectWithoutInitCall):
    """JPEGFormat(jpeg_path)


    TBD.


    jpeg_path(String):
    TBD."""

    clipToElements = passthrough_attr('clipToElements')
    colorMode = passthrough_attr('colorMode')
    filePath = passthrough_attr('filePath')
    georeferenceMapFrame = passthrough_attr('georeferenceMapFrame')
    height = passthrough_attr('height')
    imageCompressionQuality = passthrough_attr('imageCompressionQuality')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    width = passthrough_attr('width')
    worldFile = passthrough_attr('worldFile')

    @constants.maskargs
    def setColorMode(self, jpeg_color_mode):
        """JPEGFormat.setColorMode(color_mode)


        A string constant that represents the number of bits to describe color
        in a pixel.


        color_mode(String):
        Below is a list of valid strings.

        * 24-BIT_TRUE_COLOR: 16,777,216 possible colors. This option is good for
        maximum color fidelity.

        * 8-BIT_GRAYSCALE: 256 shades of gray. All colors are converted to
        grayscale.
        """
        return convertArcObjectToPythonObject(self._arc_object.setColorMode(*gp_fixargs((jpeg_color_mode,), True)))

    def __init__(self, jpeg_path):
        """JPEGFormat(jpeg_path)


        TBD.


        jpeg_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.JPEGFormat(*gp_fixargs((jpeg_path,), True))

class LabelClass(_ObjectWithoutInitCall):
    """Provides access to a layer's label class properties."""
    expression = passthrough_attr('expression')
    name = passthrough_attr('name')
    SQLQuery = passthrough_attr('SQLQuery')
    visible = passthrough_attr('visible')

    @constants.maskargs
    def getDefinition(self, cim_version):
        """LabelClass.getDefinition(cim_version)


        Returns a label classes' CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """LabelClass.setDefinition(definition_object)


        Sets a label classes' CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

class Layer(_ObjectWithoutInitCall):
    """Layer(lyr_file_path)


    References a layer file stored on disk.


    lyr_file_path(String):
    A string that includes the full path and file name of an existing layer
    file.  The supported extensions are .lyr or .lyrx.
    """
    brightness = passthrough_attr('brightness')
    contrast = passthrough_attr('contrast')
    connectionProperties = passthrough_attr('connectionProperties', True)
    dataSource = passthrough_attr('dataSource', True)
    definitionQuery = passthrough_attr('definitionQuery')
    groupType = passthrough_attr('groupType')
    is3DLayer = passthrough_attr('is3DLayer')
    isBroken = passthrough_attr('isBroken')
    isFeatureLayer = passthrough_attr('isFeatureLayer')
    isSceneLayer = passthrough_attr('isSceneLayer')
    isBasemapLayer = passthrough_attr('isBasemapLayer')
    isGroupLayer = passthrough_attr('isGroupLayer')
    isNetworkAnalystLayer = passthrough_attr('isNetworkAnalystLayer')
    isNetworkDatasetLayer = passthrough_attr('isNetworkDatasetLayer')
    isParcelFabricLayer = passthrough_attr('isParcelFabricLayer')
    isRasterLayer = passthrough_attr('isRasterLayer')
    isWebLayer = passthrough_attr('isWebLayer')
    isGraphicsLayer = passthrough_attr('isGraphicsLayer')
    isTimeEnabled = passthrough_attr('isTimeEnabled')
    longName = passthrough_attr('longName')
    maxThreshold = passthrough_attr('maxThreshold')
    metadata = passthrough_attr('metadata')
    minThreshold = passthrough_attr('minThreshold')
    name = passthrough_attr('name')
    pageQuery = passthrough_attr('pageQuery')
    showLabels = passthrough_attr('showLabels')
    symbology = passthrough_attr('symbology')
    time = passthrough_attr('time')
    transparency = passthrough_attr('transparency')
    URI = passthrough_attr('URI')
    visible = passthrough_attr('visible')

    @constants.maskargs
    def createLabelClass(self, name, expression, sql_query=None, labelclass_language='ARCADE'):
        """Layer.createLabelClass(name, expression, {sql_query},
        {labelclass_language})


        The createLabelClass method creates a LabelClass for a layer.


        name(String):
        The name of the new label class.  Names must be unique.


        expression(String):
        An expression to be applied. Its syntax must match the
        labelclass_language value. The default value is None.


        sql_query{String}:
        An optional query that is useful for restricting the features that are
        labeled.


        labelclass_language{String}:
        The following are the supported scripting languages. The default value
        is ARCADE.

        * ARCADE: Arcade

        * JSCRIPT: JScript

        * PYTHON: Python

        * VBSCRIPT: VBScript
        """
        return convertArcObjectToPythonObject(self._arc_object.createLabelClass(*gp_fixargs((name, expression, sql_query, labelclass_language), True)))

    def disableTime(self):
        """Layer.disableTime()


        Disables time enabled properties on a Layer object.
        """
        return convertArcObjectToPythonObject(self._arc_object.disableTime(*gp_fixargs((), True)))

    def enableTime(self, startTimeField=None, endTimeField=None, autoCalculateTimeRange=True, timeDimension=None):
        """Layer.enableTime({startTimeField}, {endTimeField},
        {autoCalculateTimeRange}, {timeDimension})


        Enables time on a layer if it has time information.


        startTimeField{String}:
        The name of the field containing the start time values. If each feature
        has a single time field, specify that field name in the startTimeField
        and leave endTimeField blank. If each feature has a start and end time
        field, specify both the  startTimeField and endTimeField. The default
        value is None.


        endTimeField{String}:
        The name of the field containing the end time values. Not all layers use
        an end time field. If each feature has a single time field, specify that
        field name in the startTimeField and leave endTimeField blank. If each
        feature has a start and end time field, specify both the  startTimeField
        and endTimeField. The default value is None.


        autoCalculateTimeRange{Boolean}:
        If  set to True, the start and end time attribute information is used to
        calculate the layer's time extent. The default value is True.


        timeDimension{String}:
        The name of the dimension containing time values when using netCDF data.
        The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.enableTime(*gp_fixargs((startTimeField, endTimeField, autoCalculateTimeRange, timeDimension), True)))

    @constants.maskargs
    def extrusion(self, extrusion_type='NONE', expression=None):
        """Layer.extrusion({extrusion_type}, {expression})


        Extrudes 2D features in a layer to display 3D symbology.


        extrusion_type{String}:
        A string that specifies the extrusion method.  The default value is NONE
        which turns off layer extrusion. The default value is NONE.

        * ABSOLUTE_HEIGHT: The feature is extruded to the specified z-value, as
        a flat top, regardless of the z-values of the feature.

        * BASE_HEIGHT: A z-value is calculated for each vertex of the feature's
        base, and the feature is extruded to the various z-values creating a
        multifaceted top.

        * MAX_HEIGHT: Adds extrusion height to the minimum z-value of the
        feature, and the feature is extruded to a flat top at that value.

        * MIN_HEIGHT: Adds extrusion height to the minimum z-value of the
        feature, and the feature is extruded to a flat top at that value.

        * NONE: Features are not extruded.


        expression{String}:
        A string that defines the extrusion expression, which provides an
        absolute extrusion height  for each feature. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.extrusion(*gp_fixargs((extrusion_type, expression), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """Layer.getDefinition(cim_version)


        Gets a layer's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    def getSelectionSet(self):
        """Layer.getSelectionSet()


        Returns a layer's selection as a Python set of object IDs.
        """
        return convertArcObjectToPythonObject(self._arc_object.getSelectionSet(*gp_fixargs((), True)))

    def listDefinitionQueries(self, wildcard=None):
        """Layer.listDefinitionQueries({wildcard})


        Returns a Python list of definition queries associated with a layer.


        wildcard{String}:
        A wildcard is based on the query name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to limit the
        resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listDefinitionQueries(*gp_fixargs((wildcard,), True)))

    def listLabelClasses(self, wildcard=None):
        """Layer.listLabelClasses({wildcard})


        Returns a Python list of LabelClass objects in a layer.


        wildcard{String}:
        A wildcard is based on the label class name and is not case sensitive. A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listLabelClasses(*gp_fixargs((wildcard,), True)))

    def listLayers(self, wildcard=None):
        """Layer.listLayers({wildcard})


        Returns a Python list of Layer objects from  a group layer or composite
        layer.


        wildcard{String}:
        A wildcard is based on the layer name and is not case sensitive. A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listLayers(*gp_fixargs((wildcard,), True)))

    def listTables(self, wildcard=None):
        """Layer.listTables({wildcard})


        Returns a Python list of Table objects that exist within a group layer.


        wildcard{String}:
        A wildcard is based on the table name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to limit the
        resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listTables(*gp_fixargs((wildcard,), True)))

    def openTableView(self, show_selected=False):
        """Layer.openTableView({show_selected})


        TBD.

        show_selected{Boolean}:
        TBD.
        """
        return convertArcObjectToPythonObject(self._arc_object.openTableView(*gp_fixargs((show_selected,), True)))

    @constants.maskargs
    def pasteProperties(self, source_layer, layer_paste_properties='ALL'):
        """Layer.pasteProperties(source_layer, {layer_paste_properties})


        The pasteProperties method pastes properties from a feature layer to
        another feature layer.


        source_layer(Layer):
        A feature layer with the properties that will be pasted.


        layer_paste_properties{String}:
        A single string or a list of strings that specify  the property or
        properties that will be pasted. For example,
        layer_paste_properties="SYMBOLGY" will paste only symbology properties,
        whereas  layer_paste_properties=["SYMBOLGY", "LABELING",
        "VISIBILITY_RANGE"]) will paste multiple properties. The default value
        is ALL.

        * ALL: All applicable properties will be pasted.

        * CHARTS: Only chart properties will be pasted.

        * DEFINITION_QUERIES: Only definition query properties will be pasted.

        * DISPLAY_EXPRESSION: Only display expression properties will be pasted.

        * DISPLAY_FILTERS: Only display filter  properties will be pasted.

        * FIELD_PROPERTIES: Only field properties will be pasted.

        * LABELING: Only labeling properties will be pasted.

        * POPUPS: Only pop-up configuration properties will be pasted.

        * SYMBOLOGY: Only symbology properties will be pasted.

        * VISIBILITY_RANGE: Only visibility range properties will be pasted.
        """
        layer_paste_properties = layer_paste_properties.split(",")
        return convertArcObjectToPythonObject(self._arc_object.pasteProperties(*gp_fixargs((source_layer, layer_paste_properties), True)))

    def saveACopy(self, file_name):
        """Layer.saveACopy(file_name)


        Saves a layer to a layer file (.lyrx).


        file_name(String):
        A string that includes the location and name of the output layer file
        (.lyrx).
        """
        return convertArcObjectToPythonObject(self._arc_object.saveACopy(*gp_fixargs((file_name,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """Layer.setDefinition(definition_object)


        Sets a layer's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    @constants.maskargs
    def setGroupType(self, group_type):
        """Layer.setGroupType(group_type)


        The setGroupType method sets a layer's group type.


        group_type(String):
        A string that specifies the selection method that will be used.

        * CHECKBOX: The group layer will be set to a check box style.

        * RADIO: The group layer will be set to a radio style.
        """
        return convertArcObjectToPythonObject(self._arc_object.setGroupType(*gp_fixargs((group_type,), True)))

    def setPageQuery(self, field_name='NONE', match=True):
        """Layer.setPageQuery({field_name}, {match})


        The setPageQuery method sets a page query filter for the layer.


        field_name{String}:
        The name of the field that contains values that match the map series
        page name field in the index layer. The default value is None.


        match{Boolean}:
        If set to True, features with the same map series page name will be
        displayed, if False, the inverse set of features will be displayed. The
        default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.setPageQuery(*gp_fixargs((field_name, match,), True)))

    @constants.maskargs
    def setSelectionSet(self, oidList=None, method='NEW'):
        """Layer.setSelectionSet({oidList}, {method})


        Sets a layer's selection using a Python list of Object IDs.


        oidList{Integer}:
        A Python list of Object IDs to use along with the appropriate selection
        method. The default value is None.


        method{String}:
        A string that specifies which selection method to use. The default value
        is NEW.

        * DIFFERENCE: Selects the features that are not in the current selection
        but are in the oidList.

        * INTERSECT: Selects the features that are in the current selection and
        the oidList.

        * NEW: Creates a new feature selection from the oidList.

        * SYMDIFFERENCE: Selects the features that are in the current selection
        or the oidList but not both.

        * UNION: Selects all the features in both the current selection and
        those in the oidList.
        """
        return convertArcObjectToPythonObject(self._arc_object.setSelectionSet(*gp_fixargs((oidList, method), True)))

    @constants.maskargs
    def supports(self, layer_property):
        """Layer.supports(layer_property)


        Used to determine if a particular layer type supports a property on the
        layer object.  Not all layers support the same set of properties; the
        supports property can be used to test if a layer supports that property
        before attempting to set it.


        layer_property(String):
        The name of a particular layer property that will be tested. The default
        value is name.

        * BRIGHTNESS: A raster layer's brightness value.

        * CONNECTIONPROPERTIES: A Layer's connection information.

        * CONTRAST: A raster layer's contrast value

        * DATASOURCE: A layer's file path or connection file.

        * DEFINITIONQUERY: A layer's definition query string.

        * LONGNAME: A layer's path including the group layers it may be nested
        within.

        * MAXTHRESHOLD: A layer's maximum threshold to display the features.

        * METADATA: A layer that can persist metadata.

        * MINTHRESHOLD: A layer's minimum threshold to display the features.

        * NAME: A layer's name.

        * SHOWLABELS: A layer that can display labels.

        * SYMBOLOGY: A layer that symbology can be accessed.

        * TIME: A layer's time properties.

        * TRANSPARENCY: A layer's transparency value.

        * URI: A layer's Universal Resource Identifier.

        * VISIBLE: A layer's visibility state.
        """
        return convertArcObjectToPythonObject(self._arc_object.supports(*gp_fixargs((layer_property,), True)))

    def updateConnectionProperties(self, current_connection_info, new_connection_info, auto_update_joins_and_relates=True, validate=True, ignore_case=False):
        """Layer.updateConnectionProperties(current_connection_info,
        new_connection_info, {auto_update_joins_and_relates}, {validate},
        {ignore_case})


        The updateConnectionProperties method replaces connection properties
        using a dictionary or a path to a workspace.


        current_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties to the source you want to update. If an
        empty string or None is used in current_connection_info, all connection
        properties will be replaced with the new_workspace_info, depending on
        the value of the validate parameter.


        new_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties with the new source information.


        auto_update_joins_and_relates{Boolean}:
        If  set to True, the updateConnectionProperties method will also update
        the connections for associated joins or relates. The default value is
        True.


        validate{Boolean}:
        If  set to True, the connection properties will only be updated if the
        new_connection_info value is a valid connection.  If it is not valid,
        the connection will not be replaced.   If set to False, the method will
        set all connections to match the new_connection_info value, regardless
        of a valid match.  In this case, if a match does not exist, the data
        sources would be broken. The default value is True.


        ignore_case{Boolean}:
        Determines whether searches will be case sensitive. By default, queries
        are case sensitive. To perform queries that are not case sensitive, set
        ignore_case to True. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateConnectionProperties(*gp_fixargs((current_connection_info, new_connection_info, auto_update_joins_and_relates, validate, ignore_case), True)))

    def updateDefinitionQueries(self, definitionQueries):
        """Layer.updateDefinitionQueries(definitionQueries)


        Updates a layer's collection of definition queries.


        definitionQueries(List):
        Updates a list of dictionaries that represent the properties of each
        definition query.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateDefinitionQueries(*gp_fixargs((definitionQueries,), True)))

    def updateLayerFromJSON(self, json_data):
        """Layer.updateLayerFromJSON(json_data)


        Updates a Layer from a JSON string.


        json_data(String):
        The layer definition in JavaScript Object Notation (JSON) format. See
        the ExportWebMap JSON specification for more information. ArcGIS API for
        JavaScript and ArcGIS Web AppBuilder allow you to get this JSON string
        from the web app. The layer definition is a subset of the webmap_json
        used in the ConvertWebMapToArcGISProject function. You don't need to
        create the web map JSON; the APIs take care of it for you. However, you
        need to extract the layer definition from the full webmap_json.
        """
        return convertArcObjectToPythonObject(self._arc_object.UpdateLayerFromJSON(*gp_fixargs((json_data,), True)))

    def __str__(self):
        return self.longName

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isLayerSame(*gp_fixargs((other,), True)))

class LayerFile(_ObjectWithoutInitCall):
    """LayerFile(layer_file_path)


    References a layer file (.lyr or .lyrx) stored on disk.


    layer_file_path(String):
    A string that includes the full system path and file name of an existing
    layer file.
    """
    filePath = passthrough_attr('filePath')
    metadata = passthrough_attr('metadata')
    version = passthrough_attr('version')

    @constants.maskargs
    def addLayer(self, add_layer_or_layerfile, add_position='AUTO_ARRANGE'):
        """LayerFile.addLayer(add_layer_or_layerfile, {add_position})


        Provides the ability to add a Layer or LayerFile to a layer file
        (.lyrx) using basic placement options.


        add_layer_or_layerfile(Layer):
        A reference to a Layer or LayerFile object representing the layer or
        layers  to be added.


        add_position{String}:
        A constant that determines the placement of the added layer or layers
        in a layer file. The default value is AUTO_ARRANGE.

        * AUTO_ARRANGE: Automatically places the layer or layers based on its
        layer weight rules and geometry.

        * BOTTOM: Places the layer or layers at the bottom of the TOC layer
        stack.

        * TOP: Places the layer or layers at the top of the TOC layer stack.
        """
        return convertArcObjectToPythonObject(self._arc_object.addLayer(*gp_fixargs((add_layer_or_layerfile, add_position), True)))

    @constants.maskargs
    def addLayerToGroup(self, target_group_layer, add_layer_or_layerfile, add_position='AUTO_ARRANGE'):
        """LayerFile.addLayerToGroup(target_group_layer, add_layer_or_layerfile,
        {add_position})


        Provides the ability to add a Layer or the contents of a LayerFile to an
        existing group layer in a layer file (.lyrx) using basic placement
        options.


        target_group_layer(Layer):
        A reference to an existing group Layer object.


        add_layer_or_layerfile(Layer):
        A reference to a Layer or LayerFile object representing the layer or
        layers  to be added.


        add_position{String}:
        A constant that determines the placement of the added layer or layers in
        the target_group_layer. The default value is AUTO_ARRANGE.

        * AUTO_ARRANGE: Automatically places the layer based on its layer weight
        rules and geometry.

        * BOTTOM: Places the layer at the bottom of the TOC layer stack.

        * TOP: Places the layer at the top of the TOC layer stack.
        """
        return convertArcObjectToPythonObject(self._arc_object.addLayerToGroup(*gp_fixargs((target_group_layer, add_layer_or_layerfile, add_position), True)))

    @constants.maskargs
    def insertLayer(self, reference_layer, insert_layer_or_layerfile, insert_position='BEFORE'):
        """LayerFile.insertLayer(reference_layer, insert_layer_or_layerfile,
        {insert_position})


        Provides the ability to add a Layer or LayerFile into a layer file
        (.lyrx) by specifying  a location.


        reference_layer(Layer):
        A Layer object representing an existing layer that determines the
        location where the new layer will be inserted.


        insert_layer_or_layerfile(Layer):
        A reference to a Layer or LayerFile object representing the layer or
        layers  to be added.


        insert_position{String}:
        A constant that determines the placement of the added layer or layers
        relative to the reference_layer. The default value is BEFORE.

        * AFTER: Inserts the new layer after or below the reference layer.

        * BEFORE: Inserts the new layer before or above the reference layer.
        """
        return convertArcObjectToPythonObject(self._arc_object.insertLayer(*gp_fixargs((reference_layer, insert_layer_or_layerfile, insert_position), True)))

    def listBrokenDataSources(self):
        """LayerFile.listBrokenDataSources()


        Returns a Python list of Layer objects in a layer file that have broken
        connections to their original source data.
        """
        return convertArcObjectToPythonObject(self._arc_object.listBrokenDataSources(*gp_fixargs((), True)))

    def listLayers(self, wildcard=None):
        """LayerFile.listLayers({wildcard})


        Returns a Python list of Layers in a layer file.


        wildcard{String}:
        A wildcard is based on the layer name and is not case sensitive. A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listLayers(*gp_fixargs((wildcard,), True)))

    def listTables(self, wildcard=None):
        """LayerFile.listTables({wildcard})


        Returns a Python list of Table objects that exist within a LayerFile.


        wildcard{String}:
        A wildcard is based on the table name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to limit the
        resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listTables(*gp_fixargs((wildcard,), True)))

    @constants.maskargs
    def moveLayer(self, reference_layer, move_layer, insert_position='BEFORE'):
        """LayerFile.moveLayer(reference_layer, move_layer, {insert_position})


        Provides the ability to move a layer or group layer in a layer file to
        a specific location in the layer stack.


        reference_layer(Layer):
        A Layer  object representing an existing layer that determines the
        location where the new layer will be moved.


        move_layer(Layer):
        A reference to a Layer object representing the layer to be moved.


        insert_position{String}:
        A constant that determines the placement of the moved layer relative to
        the reference layer. The default value is BEFORE.

        * AFTER: Moves the  layer after or below the reference layer.

        * BEFORE: Moves the layer before or above the reference layer.
        """
        return convertArcObjectToPythonObject(self._arc_object.moveLayer(*gp_fixargs((reference_layer, move_layer, insert_position), True)))

    def removeLayer(self, remove_layer):
        """LayerFile.removeLayer(remove_layer)


        Provides the ability to remove a layer from a layer file.


        remove_layer(Layer):
        A reference to a Layer object representing the layer to be removed.
        """
        return convertArcObjectToPythonObject(self._arc_object.removeLayer(*gp_fixargs((remove_layer,), True)))

    def save(self):
        """LayerFile.save()


        Saves an existing layer file reference to a .lyrx file, even if the file
        referenced was a .lyr file.
        """
        return convertArcObjectToPythonObject(self._arc_object.save(*gp_fixargs((), True)))

    def saveACopy(self, file_name):
        """LayerFile.saveACopy(file_name)


        Saves a LayerFile  to a new path or file name.


        file_name(String):
        A string used to save a LayerFile to a new path or file name.  You can
        only save to .lyrx files.
        """
        return convertArcObjectToPythonObject(self._arc_object.saveACopy(*gp_fixargs((file_name,), True)))

    def updateConnectionProperties(self, current_connection_info, new_connection_info, auto_update_joins_and_relates=True, validate=True, ignore_case=False):
        """LayerFile.updateConnectionProperties(current_connection_info,
        new_connection_info, {auto_update_joins_and_relates}, {validate},
        {ignore_case})


        The updateConnectionProperties method replaces connection properties
        using a dictionary or a path to a workspace.


        current_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties to the source you want to update. If an
        empty string or None is used in current_connection_info, all connection
        properties will be replaced with the new_workspace_info, depending on
        the value of the validate parameter.


        new_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties with the new source information.


        auto_update_joins_and_relates{Boolean}:
        If  set to True, the updateConnectionProperties method will also update
        the connections for associated joins or relates. The default value is
        True.


        validate{Boolean}:
        If  set to True, the connection properties will only be updated if the
        new_connection_info value is a valid connection.  If it is not valid,
        the connection will not be replaced.   If set to False, the method will
        set all connections to match the new_connection_info value, regardless
        of a valid match.  In this case, if a match does not exist, the data
        sources would be broken. The default value is True.


        ignore_case{Boolean}:
        Determines whether searches will be case sensitive. By default, queries
        are case sensitive. To perform queries that are not case sensitive, set
        ignore_case to True. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateConnectionProperties(*gp_fixargs((current_connection_info, new_connection_info, auto_update_joins_and_relates, validate, ignore_case), True)))

    def __init__(self, layer_file_path):
        """LayerFile(layer_file_path)


        References a layer file ( .lyr or .lyrx ) stored on disk.


        layer_file_path(String):
        A string that includes the full system path and file name of an existing layer file.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.LayerFile(*gp_fixargs((layer_file_path,), True))

    def __str__(self):
        return self.filePath

class LayerTime(_ObjectWithoutInitCall):
    """LayerTime provides access to layer time level information in a Layer Object."""
    daylightSavings = passthrough_attr('daylightSavings')
    endTime = passthrough_attr('endTime')
    endTimeField = passthrough_attr('endTimeField')
    startTime = passthrough_attr('startTime')
    startTimeField = passthrough_attr('startTimeField')
    timeDimension = passthrough_attr('timeDimension')
    timeFormat = passthrough_attr('timeFormat')
    timeOffset = passthrough_attr('timeOffset')
    timeOffsetUnits = passthrough_attr('timeOffsetUnits')
    timeStepInterval = passthrough_attr('timeStepInterval')
    timeStepIntervalUnits = passthrough_attr('timeStepIntervalUnits')
    timeZone = passthrough_attr('timeZone')
    timeZoneIANA = passthrough_attr('timeZoneIANA')

class Layout(_ObjectWithoutInitCall):
    """The Layout object references a single-page layout in an ArcGIS Pro
       project ( .aprx ).  It provides access to common properties like page
       size and a number of different export methods."""
    mapSeries = passthrough_attr('mapSeries')
    metadata = passthrough_attr('metadata')
    name = passthrough_attr('name')
    pageHeight = passthrough_attr('pageHeight')
    pageUnits = passthrough_attr('pageUnits')
    pageWidth = passthrough_attr('pageWidth')
    URI = passthrough_attr('URI')

    def changePageSize(self, page_width, page_height, resize_elements=True):
        """Layout.changePageSize(page_width, page_height, {resize_elements})


        The changePageSize method modifies the size of a  layout.


        page_width(Double):
        A double that indicates the width of a layout and is based on the
        page_units value.


        page_height(Double):
        A double that indicates the height of a layout and is based on the
        page_units value.


        resize_elements{Boolean}:
        Specifies whether the elements will be resized. If set to True, the
        elements on the layout will be resized proportionally. If set to False,
        only the page size will change, the elements will remain their original
        size. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.changePageSize(*gp_fixargs((page_width, page_height, resize_elements,), True)))

    def createBookmarkMapSeries(self, mapframe, bookmarks=None):
        """Layout.createBookmarkMapSeries(mapframe, {bookmarks})


        This method creates a new BookmarkMapSeries for a layout.


        mapframe(MapFrame):
        A MapFrame that will have its camera settings driven by the information
        persisted in the bookmarks provided.


        bookmarks{List}:
        A list of Bookmark objects from either a single map, or multiple maps.
        If a list is not provided, the bookmarks that belong to the map
        associated with the map frame will be used instead.
        """
        return convertArcObjectToPythonObject(self._arc_object.createBookmarkMapSeries(*gp_fixargs((mapframe, bookmarks), True)))

    def createMapFrame(self, geometry, map=None, name=None):
        """Layout.createMapFrame(geometry, {map}, {name})


        The createMapFrame method creates a MapFrame element in a layout.


        geometry(Object):
        The appropriate Point, or Polygon object that will be used to construct
        the element using page units.


        map{Map}:
        The Map associated with the MapFrame.  If the default value of None is
        used, it can be changed at a later time. The default value is None.


        name{String}:
        An optional string that represents the name of the new MapFrame element.
        If a name is not provided, the default name value will follow the
        automatic sequencing nomenclature, for example, Map Frame, Map Frame 1,
        Map Frame 2, and so on.
        """
        return convertArcObjectToPythonObject(self._arc_object.createMapFrame(*gp_fixargs((geometry, map, name,), True)))

    @constants.maskargs
    def createMapSurroundElement(self, geometry, mapsurround_type, mapframe=None, style_item=None, name=None):
        """Layout.createMapSurroundElement(geometry, mapsurround_type, {mapframe},
        {style_item}, {name})


        The createMapSurroundElement method creates a MapSurroundElement in a
        layout.


        geometry(Object):
        A Point or a Polygon object that will be used to construct the element.
        The map surround types have different anchor locations so if you are
        creating an element with a point geometry, you will need to consider
        positioning relative to the default anchor location.


        mapsurround_type(String):
        A string that represents the map surround element that will be created

        * LEGEND: A legend element will be created.

        * NORTH_ARROW: A north arrow element will be created.

        * SCALE_BAR: A scale bar element will be created.


        mapframe{MapFrame}:
        The MapFrame element that will be associated with the map surround. If
        the default value of None is used, it can be changed at a later time.
        The default value is None.


        style_item{String}:
        An optional reference to a StyleItem value. It must match the
        mapsuround_type input parameter. If a style_item value is not provided,
        a default style will be applied.


        name{String}:
        An optional string that represents the name of the new
        MapSurroundElement.  If a name is not provided, the default name value
        will follow the automatic sequencing nomenclature, for example, North
        Arrow, North Arrow 1, North Arrow 2, and so on.
        """
        return convertArcObjectToPythonObject(self._arc_object.createMapSurroundElement(*gp_fixargs((geometry, mapsurround_type, mapframe, style_item, name), True)))

    def createSpatialMapSeries(self, mapframe, index_layer, name_field, sort_field=None):
        """Layout.createSpatialMapSeries(mapframe, index_layer, name_field,
        {sort_field})


        This method creates a spatial MapSeries object for a layout.


        mapframe(MapFrame):
        A MapFrame object that has an  associated map that includes the index
        layer needed for creating the spatial map series pages.


        index_layer(Layer):
        The index Layer object needed for the extents and attribute information
        for  each page. The default value is None.


        name_field(String):
        The field name of the field used to control the name of each page in the
        map series.  Ideally, all field values are unique so each page can be
        uniquely identified.


        sort_field{String}:
        The name of the field that will be used to sort the map series pages.
        """
        return convertArcObjectToPythonObject(self._arc_object.createSpatialMapSeries(*gp_fixargs((mapframe, index_layer, name_field, sort_field), True)))

    def createTableFrameElement(self, geometry, mapframe=None, table=None, fields=None, style_item=None, name=None):
        """Layout.createTableFrameElement(geometry, {mapframe}, {table}, {fields},
        {style_item}, {name})


        The createTableFrameElement method creates a TableFrameElement object
        in a layout.


        geometry(Object):
        A Point or a rectangular Polygon object using layout page units.


        mapframe{MapFrame}:
        The MapFrame element that will be associated with the table frame
        element. If the default value of None is used, it can be changed at a
        later time using the mapframe property on the TableFrameElement class.
        The default value is None.


        table{Object}:
        The Layer or Table object associated with the table frame element. If
        the default value of None is used, it can be changed at a later time
        using the table property on the TableFrameElement class. The default
        value is None.


        fields{String}:
        A list of strings that represent the table field names to display in the
        table frame.  If the default value of None is used, it can be changed at
        a later time using the fields property on the TableFrameElement class.


        style_item{String}:
        An optional reference to a StyleItem value. When using the
        listStyleItems method on the ArcGISProject class, you must use
        theTABLE_FRAME keyword for the style_class parameter.  If a style_item
        value is not provided, a default style will be applied.


        name{String}:
        An optional string that represents the name of the new table frame
        element.  If no name is provided, the default name value will follow the
        automatic sequencing nomenclature, for example, Table Frame, Table Frame
        1, Table Frame 2, and so on.
        """
        return convertArcObjectToPythonObject(self._arc_object.createTableFrameElement(*gp_fixargs((geometry, mapframe, table, fields, style_item, name), True)))

    def deleteElement(self, element):
        """Layout.deleteElement(element)


        The deleteElement function deletes a layout element.


        element(Object):
        An object that represents a layout element to be deleted.
        """
        return convertArcObjectToPythonObject(self._arc_object.deleteElement(*gp_fixargs((element,), True)))

    def export(self, export_format):
        """Layout.export(export_format)


        The export method exports a Layout using a specified export format.


        export_format(Object):
        The supported export format objects  are: AIXFormat, BMPFormat,
        EMFFormat, EPSFormat, GIFFormat, JPEGFormat, PDFFormat, PNGFormat,
        SVGFormat, TGAFormat and TIFFFormat.
        """
        return convertArcObjectToPythonObject(self._arc_object.export(*gp_fixargs((export_format,), True)))

    @constants.maskargs
    def exportToAIX(self, out_aix, resolution=300, image_quality='BEST', compress_vector_graphics=True, image_compression='ADAPTIVE',
    jpeg_compression_quality=80, embed_fonts=True, embed_color_profile=True, clip_to_elements=False, keep_layout_background=False, convert_markers=False):
        """Layout.exportToAIX(out_aix, {resolution}, {image_quality},
        {compress_vector_graphics}, {image_compression},
        {jpeg_compression_quality}, {embed_fonts}, {embed_color_profile},
        {clip_to_elements}, {keep_layout_background}, {convert_markers})


        Exports the  Layout  to Adobe Illustrator Exchange (AIX) format. AIX
        files can be used with the ArcGIS Maps for Adobe Creative Cloud
        extension or Adobe Illustrator.


        out_aix(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 300.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls compression of vector and text portions of the
        output file. Image compression is defined separately. The default value
        is True.


        image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        jpeg_compression_quality{Integer}:
        A number that controls compression quality value when image_compression
        is set to ADAPTIVE or JPEG. The valid range is 1 through 100.    A
        jpeg_compression_quality of 100 provides the best-quality images but
        creates large export files.   The recommended range is between 70 and
        90. The default value is 80.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        keep_layout_background{Boolean}:
        If set to True, the layout's white background will be kept. The default
        value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToAIX(*gp_fixargs((out_aix, resolution, image_quality, compress_vector_graphics, image_compression,
        jpeg_compression_quality, embed_fonts, embed_color_profile, clip_to_elements, keep_layout_background, convert_markers), True)))

    @constants.maskargs
    def exportToBMP(self, out_bmp, resolution=96, bmp_color_mode='24-BIT_TRUE_COLOR', bmp_image_compression='NONE', embed_color_profile=True, clip_to_elements=False):
        """Layout.exportToBMP(out_bmp, {resolution}, {bmp_color_mode},
        {bmp_image_compression}, {embed_color_profile}, {clip_to_elements})


        Exports the Layout to the Microsoft Windows Bitmap format (BMP).


        out_bmp(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        bmp_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        bmp_image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file.  This option only applies to 8-bit
        bmp_color_mode options. The default value is NONE.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToBMP(*gp_fixargs((out_bmp, resolution, bmp_color_mode, bmp_image_compression, embed_color_profile, clip_to_elements), True)))

    @constants.maskargs
    def exportToEMF(self, out_emf, resolution=96, image_quality='BEST', output_as_image=False, clip_to_elements=False, convert_markers=False):
        """Layout.exportToEMF(out_emf, {resolution}, {image_quality},
        {output_as_image}, {clip_to_elements}, {convert_markers})


        Exports the Layout to the Enhanced Metafile (EMF) format.


        out_emf(String):
        A string that represents the system path and file name for the output
        export file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToEMF(*gp_fixargs((out_emf, resolution, image_quality, output_as_image, clip_to_elements, convert_markers), True)))

    @constants.maskargs
    def exportToEPS(self, out_eps, resolution=96, image_compression='DEFLATE', image_quality='BEST',
                   embed_fonts=True, output_as_image=False, clip_to_elements=False, convert_markers=False):
        """Layout.exportToEPS(out_eps, {resolution}, {image_compression},
        {image_quality}, {embed_fonts}, {output_as_image}, {clip_to_elements},
        {convert_markers})


        Exports the Layout to an Encapsulated PostScript (EPS) format file.


        out_eps(String):
        A string that represents the system path and file name for the output
        export file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file. The default value is DEFLATE.

        * DEFLATE: A lossless data compression.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1.

        * BETTER: An output image quality resample ratio of 2.

        * FASTER: An output image quality resample ratio of 4.

        * FASTEST: An output image quality resample ratio of 5.

        * NORMAL: An output image quality resample ratio of 3.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToEPS(*gp_fixargs((out_eps, resolution, image_compression,
        image_quality, embed_fonts, output_as_image, clip_to_elements, convert_markers), True)))

    @constants.maskargs
    def exportToGIF(self, out_gif, resolution=96, gif_color_mode='8-BIT_ADAPTIVE_PALETTE',
                    clip_to_elements=False):
        """Layout.exportToGIF(out_gif, {resolution}, {gif_color_mode},
        {clip_to_elements})


        Exports the Layout to Graphic Interchange Format (GIF).


        out_gif(String):
        A string that represents the system path and file name for the output
        export file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        gif_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 8-BIT_ADAPTIVE_PALETTE.

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToGIF(*gp_fixargs((out_gif, resolution, gif_color_mode, clip_to_elements), True)))

    @constants.maskargs
    def exportToJPEG(self, out_jpg, resolution=96, jpeg_color_mode='24-BIT_TRUE_COLOR', jpeg_quality=80, embed_color_profile=True, clip_to_elements=False):
        """Layout.exportToJPEG(out_jpg, {resolution}, {jpeg_color_mode},
        {jpeg_quality}, {embed_color_profile}, {clip_to_elements})


        Exports the Layout to a Joint Photographic Experts Group (JPEG) format
        file.


        out_jpg(String):
        A string that represents the path and file name of the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        jpeg_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        jpeg_quality{Integer}:
        This value (0–100) controls the amount of compression applied to the
        output image. With a JPEG image, quality is adversely affected the more
        compression is applied. A higher quality (highest = 100) setting will
        produce sharper images and larger file sizes. A lower quality setting
        will produce more image artifacts and smaller files. The default value
        is 80.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToJPEG(*gp_fixargs((out_jpg, resolution, False, jpeg_color_mode, jpeg_quality, embed_color_profile, clip_to_elements), True)))

    def exportToPAGX(self, out_pagx):
        from os import remove
        from os.path import isfile
        if isfile(out_pagx):
            remove(out_pagx)

        """Layout.exportToPAGX(out_pagx)


        Exports a layout to a page file.


        out_pagx(String):
        A string used to save a layout to a page file (.pagx).
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPAGX(*gp_fixargs((out_pagx,), True)))

    @constants.maskargs
    def exportToPDF(self, out_pdf, resolution=96, image_quality='BEST', compress_vector_graphics=True, image_compression='ADAPTIVE',
    embed_fonts=True, layers_attributes='LAYERS_ONLY', georef_info=True, jpeg_compression_quality=80, clip_to_elements=False,
    output_as_image= False, embed_color_profile=True, pdf_accessibility=False, keep_layout_background=True, convert_markers=False,
    simulate_overprint=False):
        """Layout.exportToPDF(out_pdf, {resolution}, {image_quality},
        {compress_vector_graphics}, {image_compression}, {embed_fonts},
        {layers_attributes}, {georef_info}, {jpeg_compression_quality},
        {clip_to_elements}, {output_as_image}, {embed_color_profile},
        {pdf_accessibility}, {keep_layout_background}, {convert_markers},
        {simulate_overprint})


        Exports the Layout  to Portable Document Format (PDF).


        out_pdf(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 300.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls compression of vector and text portions of the
        output file. Image compression is defined separately. The default value
        is True.


        image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        layers_attributes{String}:
        A string that specifies whether the PDF layer and PDF object data
        (attributes) will be included in the export file. The default value is
        LAYERS_ONLY.

        * LAYERS_AND_ATTRIBUTES: Export PDF layers and feature attributes

        * LAYERS_ONLY: Export PDF layers only

        * NONE: None


        georef_info{Boolean}:
        A Boolean that enables the export of coordinate system information for
        each data frame into the output PDF file. The default value is True.


        jpeg_compression_quality{Integer}:
        A number that controls compression quality value when image_compression
        is set to ADAPTIVE or JPEG. The valid range is 1 through 100.    A
        jpeg_compression_quality of 100 provides the best quality images but
        creates large export files.   The recommended range is between 70 and
        90. The default value is 80.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        pdf_accessibility{Boolean}:
        Output a tagged PDF file where text can be read by screen readers or
        other assistive technology.  A tagged PDF file can include alt text—a
        text
        description of a graphic element that a screen reader uses to
        describe the element—for map frames, pictures, and chart frames.
        Alt text is added in the
        Element Pane for each element. The default value is False.


        keep_layout_background{Boolean}:
        If set to True, the white background will be included in the export. The
        default value is True.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.


        simulate_overprint{Boolean}:
        Sometimes called soft proofing, simulating overprinting shows a
        representation of how overlapping areas of ink will appear when printed
        on a page.  You set up overprinting on symbol layers. The default value
        is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPDF(*gp_fixargs((out_pdf, resolution, image_quality,
        compress_vector_graphics, image_compression, embed_fonts, layers_attributes, georef_info, jpeg_compression_quality, clip_to_elements,
        output_as_image, embed_color_profile, pdf_accessibility, keep_layout_background, convert_markers, simulate_overprint), True)))

    @constants.maskargs
    def exportToPNG(self, out_png, resolution=96, color_mode='32-BIT_WITH_ALPHA', transparent_background=False, embed_color_profile=True, clip_to_elements=False):
        """Layout.exportToPNG(out_png, {resolution}, {color_mode},
        {transparent_background}, {embed_color_profile}, {clip_to_elements})


        Exports the Layout to a Portable Network Graphics (PNG) format file.


        out_png(String):
        A string that represents the path and file name of the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 32-BIT_WITH_ALPHA.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 32-BIT_WITH_ALPHA: 32-bit with alpha

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        transparent_background{Boolean}:
        If set to True, the white page background is set to transparent. The
        default value is False.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPNG(*gp_fixargs((out_png, resolution, False, color_mode, transparent_background, embed_color_profile, clip_to_elements), True)))

    @constants.maskargs
    def exportToSVG(self, out_svg, resolution=96, compress_to_svgz=False, image_quality='BEST', embed_fonts=True, output_as_image=False,
    clip_to_elements=False, convert_markers=False):
        """Layout.exportToSVG(out_svg, {resolution}, {compress_to_svgz},
        {image_quality}, {embed_fonts}, {output_as_image}, {clip_to_elements},
        {convert_markers})


        Exports the Layout to the Scalable Vector Graphics format (SVG).


        out_svg(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        compress_to_svgz{Boolean}:
        If set to True, the output is compressed. The default value is False.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1.

        * BETTER: An output image quality resample ratio of 2.

        * FASTER: An output image quality resample ratio of 4.

        * FASTEST: An output image quality resample ratio of 5.

        * NORMAL: An output image quality resample ratio of 3.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToSVG(*gp_fixargs((out_svg, resolution, compress_to_svgz, image_quality, embed_fonts, output_as_image, clip_to_elements, convert_markers), True)))

    @constants.maskargs
    def exportToTGA(self, out_tga, resolution=96, color_mode='24-BIT_TRUE_COLOR', transparent_background=False, clip_to_elements=False):
        """Layout.exportToTGA(out_tga, {resolution}, {color_mode},
        {transparent_background}, {clip_to_elements})


        Exports the Layout to the Truevision Graphics Adapter format (TGA).


        out_tga(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 32-BIT_WITH_ALPHA.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 32-BIT_WITH_ALPHA: 32-bit with alpha

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        transparent_background{Boolean}:
        If set to True, the white page background is set to transparent. The
        default value is False.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToTGA(*gp_fixargs((out_tga, resolution, color_mode, transparent_background, clip_to_elements), True)))

    @constants.maskargs
    def exportToTIFF(self, out_tif, resolution=96, color_mode='24-BIT_TRUE_COLOR', tiff_compression='LZW',
                     jpeg_compression_quality=80, transparent_background=False, embed_color_profile=True, clip_to_elements=False,
                     world_file=False, geoTIFF_tags=False, georef_mapframe=None):
        """Layout.exportToTIFF(out_tif, {resolution}, {color_mode},
        {tiff_compression}, {jpeg_compression_quality},
        {transparent_background}, {embed_color_profile}, {clip_to_elements},
        {world_file}, {geoTIFF_tags}, {georef_mapframe})


        Exports the Layout to a Tagged Image File Format (TIFF) file.


        out_tif(String):
        A string that represents the path and file name of the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        available options are dependent on the specified Color Model set in the
        layout's Color Management properties. The default value is
        24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color. Available only to RGB.

        * 32-BIT_CMYK_TRUE_COLOR: 32-bit CMYK true color. Available only to
        CMYK.

        * 32-BIT_WITH_ALPHA: 32-bit with alpha. Available only to RGB.

        * 40-BIT_CMYK_WITH_ALPHA: 40-bit CMYK with alpha. Available only to
        CMYK.

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette. Available to RGB and
        CMYK.

        * 8-BIT_GRAYSCALE: 8-bit grayscale. Available to RGB and CMYK.


        tiff_compression{String}:
        This value represents a compression scheme. The default value is LZW.

        * DEFLATE: A lossless data compression.

        * JPEG: JPEG compression.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * PACK_BITS: Pack bits compression.


        jpeg_compression_quality{Integer}:
        This value (0–100) controls the amount of compression applied to the
        output image. With a JPEG image, quality is adversely affected the more
        compression is applied. A higher-quality (highest = 100) setting will
        produce sharper images and larger file sizes. A lower-quality setting
        will produce more image artifacts and smaller files. The default value
        is 80.


        transparent_background{Boolean}:
        If set to True, the white page background is set to transparent. The
        default value is False.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        world_file{Boolean}:
        If set to True and a valid georef_mapframe is
        set, a world file will be generated based on the map frame's
        coordinate system. The default value is False.


        geoTIFF_tags{Boolean}:
        If set to True and a valid georef_mapframe is set, geoTIFF tags will be
        embedded in the resulting image based on the map frame's coordinate
        system. The default value is False.


        georef_mapframe{MapFrame}:
        The MapFrame used to control the coordinate system when geoTIFF_tags are
        set to True. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToTIFF(*gp_fixargs((out_tif, resolution, color_mode, tiff_compression,
                                              jpeg_compression_quality, transparent_background, embed_color_profile, clip_to_elements,
                                              world_file, geoTIFF_tags, georef_mapframe), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """Layout.getDefinition(cim_version)


        Gets a layout's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version), True)))))

    @constants.maskargs
    def listElements(self, element_type=None, wildcard=None):
        """Layout.listElements({element_type}, {wildcard})


        Returns a Python list of page layout elements  that exist in  a Layout
        object.


        element_type{String}:
        A string that represents the element type that will be used to filter
        the returned list of elements. The default value is None.

        * GRAPHIC_ELEMENT: Filter for GraphicElement objects.

        * GROUP_ELEMENT: Filter for GroupElement objects.

        * LEGEND_ELEMENT: Filter for LegendElement objects.

        * MAPFRAME_ELEMENT: Filter for MapFrame objects.

        * MAPSURROUND_ELEMENT: Filter for MapsurroundElement objects.

        * PICTURE_ELEMENT: Filter for PictureElement objects.

        * TABLEFRAME_ELEMENT: Filter for TableFrameElement objects.

        * TEXT_ELEMENT: Filter for TextElement objects.


        wildcard{String}:
        A wildcard is based on the element name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to help limit
        the results. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listElements(*gp_fixargs((element_type, wildcard), True)))

    def openView(self):
        """Layout.openView()


        Opens and activates a new layout view pane in the application.
        """
        return convertArcObjectToPythonObject(self._arc_object.openView(*gp_fixargs((), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """Layout.setDefinition(definition_object)


        Sets a layout's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isLayoutSame(*gp_fixargs((other,), True)))

class LegendElement(_ObjectWithoutInitCall):
    """The LegendElement object provides access to properties that enable its positioning
       and resizing on the page layout as well as modifying its title. It also provides
       access to individual LegendItems."""
    anchor = passthrough_attr('anchor')
    columnCount = passthrough_attr('columnCount')
    elementHeight = passthrough_attr('elementHeight')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementRotation = passthrough_attr('elementRotation')
    elementWidth = passthrough_attr('elementWidth')
    fittingStrategy = passthrough_attr('fittingStrategy')
    items = passthrough_attr('items')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    mapFrame = passthrough_attr('mapFrame')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    showTitle = passthrough_attr('showTitle')
    syncLayerOrder = passthrough_attr('syncLayerOrder')
    syncLayerVisibility = passthrough_attr('syncLayerVisibility')
    syncNewLayer = passthrough_attr('syncNewLayer')
    syncReferenceScale = passthrough_attr('syncReferenceScale')
    title = passthrough_attr('title')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    @constants.maskargs
    def addItem(self, layer, add_position='TOP'):
        """LegendElement.addItem(layer, {add_position})


        Allows you to add a Layer to a legend using basic placement options.


        layer(Layer):
        A reference to a Layer object representing the layer to be added to a
        legend as a LegendItem.


        add_position{String}:
        A constant that determines the placement of the added layer within the
        legend. The default value is TOP.

        * BOTTOM: Places the layer or layers at the bottom of the TOC layer
        stack.

        * TOP: Places the layer or layers at the top of the TOC layer stack.
        """
        return convertArcObjectToPythonObject(self._arc_object.addItem(*gp_fixargs((layer, add_position), True)))

    def applyStyleItem(self, style_item):
        """LegendElement.applyStyleItem(style_item)


        Applies a StyleItem to a LegendElement.


        style_item(StyleItem):
        A reference to a StyleItem in a project.
        """
        return convertArcObjectToPythonObject(self._arc_object.applyStyleItem(*gp_fixargs((style_item,), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """LegendElement.getDefinition(cim_version)


        Returns a legend element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def moveItem(self, reference_item, move_item, move_position='BEFORE'):
        """LegendElement.moveItem(reference_item, move_item, {move_position})


        Allows you to move a legend item to  a specific location within a
        legend.


        reference_item(LegendItem):
        A LegendItem object representing an existing legend item that determines
        the relative location where the  move_item will be moved.


        move_item(Layer):
        A reference to a LegendItem object representing the layer to be moved.


        move_position{String}:
        A constant that determines the placement of the moved layer relative to
        the reference layer. The default value is BEFORE.

        * AFTER: Moves the  legend item after or below the reference_item.

        * BEFORE: Moves the legend item before or above the reference_item.
        """
        return convertArcObjectToPythonObject(self._arc_object.moveItem(*gp_fixargs((reference_item, move_item, move_position), True)))

    def removeItem(self, remove_item):
        """LegendElement.removeItem(remove_item)


        Allows you to remove a legend item from a legend.


        remove_item(LegendItem):
        A reference to a LegendItem object representing the item to be removed.
        """
        return convertArcObjectToPythonObject(self._arc_object.removeItem(*gp_fixargs((remove_item,), True)))

    @constants.maskargs
    def setAnchor(self, anchor):
        """LegendElement.setAnchor(anchor)


        The setAnchor method controls the anchor position for a LegendElement.


        anchor(String):
        A string that specifies the location of the anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """LegendElement.setDefinition(definition_object)


        Sets a legend element's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

class LegendItem(_ObjectWithoutInitCall):
    """LegendItem provides access to legend item level information in a LegendElement."""
    arrangement = passthrough_attr('arrangement')
    column = passthrough_attr('column')
    name = passthrough_attr('name')
    patchHeight = passthrough_attr('patchHeight')
    patchWidth = passthrough_attr('patchWidth')
    showFeatureCount = passthrough_attr('showFeatureCount')
    showVisibleFeatures = passthrough_attr('showVisibleFeatures')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    def applyStyleItem(self, style_item):
        """LegendItem.applyStyleItem(style_item)


        Applies a StyleItem to a LegendItem.


        style_item(StyleItem):
        A reference to a StyleItem in a project.
        """
        return convertArcObjectToPythonObject(self._arc_object.applyStyleItem(*gp_fixargs((style_item,), True)))

class Map(_ObjectWithoutInitCall):
    """The Map is the primary object for referencing and managing layers and
       tables within an ArcGIS Pro project."""
    defaultCamera = passthrough_attr('defaultCamera')
    defaultView = passthrough_attr('defaultView', True)
    excludedLayersFromClipping = passthrough_attr('excludedLayersFromClipping')
    mapType = passthrough_attr('mapType')
    mapUnits = passthrough_attr('mapUnits')
    metadata = passthrough_attr('metadata')
    name = passthrough_attr('name')
    referenceScale = passthrough_attr('referenceScale')
    spatialReference = passthrough_attr('spatialReference')
    transformations = passthrough_attr('transformations')
    URI = passthrough_attr('URI')

    def addBasemap(self, basemap_name):
        """Map.addBasemap(basemap_name)


        The addBasemap method provides the ability to add or replace a basemap
        layer within a map.


        basemap_name(String):
        The name of the basemap as it appears in the basemap gallery.
        """
        return convertArcObjectToPythonObject(self._arc_object.addBasemap(*gp_fixargs((basemap_name,), True)))

    @constants.maskargs
    def addDataFromPath(self, data_path, web_service_type="AUTOMATIC", custom_parameters=None):
        """Map.addDataFromPath(data_path, {web_service_type}, {custom_parameters})


        addDataFromPath allows you to add a Layer  to a map in a project (.aprx)
        by providing a local path or URL.


        data_path(String):
        A string that represents a local path or URL. The default value is None.


        web_service_type{String}:
        A string that represents the type of web service connection. When you
        are working with a service URL that is hosted on a third-party server
        and the URL is not deterministic, you must specify the service type from
        the list to add the data.  The default value of AUTOMATIC will not work
        if the custom_parameters dictionary is provided. The default value is
        AUTOMATIC.

        * ARCGIS_SERVER_WEB: An ArcGIS Server web service

        * AUTOMATIC: Attempt to automatically match the correct service based on
        the provided URL

        * KML: KML

        * VECTOR_TILE: A vector tile service

        * WMS: A WMS OGC web service


        custom_parameters{Dictionary}:
        A Python dictionary of custom connection parameters.  The KML
        data_service_type does not support custom properties. The default value
        is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.addDataFromPath(*gp_fixargs((data_path, web_service_type, custom_parameters,), True)))

    @constants.maskargs
    def addLayer(self, add_layer_or_layerfile, add_position='AUTO_ARRANGE'):
        """Map.addLayer(add_layer_or_layerfile, {add_position})


        Provides the ability to add a Layer or LayerFile to a map within a
        project (.aprx) using basic placement options.


        add_layer_or_layerfile(Layer):
        A reference to a Layer or LayerFile object representing the layer or
        layers  to be added.


        add_position{String}:
        A constant that determines the placement of the added layer or layers
        in a map. The default value is AUTO_ARRANGE.

        * AUTO_ARRANGE: Automatically places the layer or layers based on its
        layer weight rules and geometry.

        * BOTTOM: Places the layer or layers at the bottom of the TOC layer
        stack.

        * TOP: Places the layer or layers at the top of the TOC layer stack.
        """
        return convertArcObjectToPythonObject(self._arc_object.addLayer(*gp_fixargs((add_layer_or_layerfile, add_position), True)))

    @constants.maskargs
    def addLayerToGroup(self, target_group_layer, add_layer_or_layerfile, add_position='AUTO_ARRANGE'):
        """Map.addLayerToGroup(target_group_layer, add_layer_or_layerfile,
        {add_position})


        Provides the ability to add a Layer or the contents of a LayerFile to an
        existing group layer in a map within a project (.aprx) using basic
        placement options.


        target_group_layer(Layer):
        A reference to an existing group Layer object.


        add_layer_or_layerfile(Layer):
        A reference to a Layer or LayerFile object representing the layer or
        layers  to be added.


        add_position{String}:
        A constant that determines the placement of the added layer or layers in
        the target_group_layer. The default value is AUTO_ARRANGE.

        * AUTO_ARRANGE: Automatically places the layer based on its layer weight
        rules and geometry.

        * BOTTOM: Places the layer at the bottom of the TOC layer stack.

        * TOP: Places the layer at the top of the TOC layer stack.
        """
        return convertArcObjectToPythonObject(self._arc_object.addLayerToGroup(*gp_fixargs((target_group_layer, add_layer_or_layerfile, add_position), True)))

    def addTable(self, add_table):
        """Map.addTable(add_table)


        Provides the ability to add a Table  to a map within a project (.aprx).


        add_table(Table):
        A reference to a Table object representing the table  to be added.
        """
        return convertArcObjectToPythonObject(self._arc_object.addTable(*gp_fixargs((add_table,), True)))

    def addTableToGroup(self, target_group_layer, add_table):
        """Map.addTableToGroup(target_group_layer, add_table)


        Provides the ability to add a Table to an existing group layer in a map
        within a project (.aprx).


        target_group_layer(Layer):
        A reference to an existing group layer.


        add_table(Table):
        A reference to a Table object.
        """
        return convertArcObjectToPythonObject(self._arc_object.addTableToGroup(*gp_fixargs((target_group_layer, add_table), True)))

    def clearSelection(self):
        """Map.clearSelection()


        Clears the selection for all layers and tables in a map.
        """
        return convertArcObjectToPythonObject(self._arc_object.clearSelection(*gp_fixargs((), True)))

    @constants.maskargs
    def clipLayers(self, clip_object, selection='ALL'):
        """Map.clipLayers(clip_object, {selection})


        The clipLayers method sets the clipping options for a map.


        clip_object(Object):
        This object can be a polygon feature layer, an extent object, a graphics
        layer that includes polygons, or a  custom polygon object. The clipping
        options can be cleared if set to None.


        selection{String}:
        Specifies whether a selection will be used for clipping.   If set to
        True and the clip_object value includes a selection, only selected
        polygon features will be used for clipping. If set to   True and the
        clip_object does not have a selection, clipLayers will be set to None.
        A selection only applies to polygon feature layers and graphics layers
        that include polygon elements.  Also, a selection only applies to
        graphics layers when a script is run from within the application because
        a graphic layer element selection is not saved with a project. The
        default value is ALL.
        """
        return convertArcObjectToPythonObject(self._arc_object.clipLayers(*gp_fixargs((clip_object, selection), True)))

    def copyBookmark(self, bookmark, name=None):
        """Map.copyBookmark(bookmark, {name})


        The copyBookmark method copies a reference to a bookmark into the map.


        bookmark(Bookmark):
        A reference to an existing bookmark in a map either in the same map or a
        different map.


        name{String}:
        A string that represents the name of the new bookmark.  If a name is not
        provided, the default value will follow the sequencing nomenclature, for
        example, Bookmark, Bookmark [1], Bookmark [2].
        """
        return convertArcObjectToPythonObject(self._arc_object.copyBookmark(*gp_fixargs((bookmark, name,), True)))

    def createGraphicsLayer(self, name=None):
        """Map.createGraphicsLayer({name})


        The createGraphicsLayer method creates  a graphics layer in a map.


        name{String}:
        The name of the new graphics layer. If no name is provided, the default
        name value will follow the automatic sequencing nomenclature, for
        example, Graphics Layer, Graphics Layer 2, Graphics Layer 3, and so on.
        """
        return convertArcObjectToPythonObject(self._arc_object.createGraphicsLayer(*gp_fixargs((name,), True)))

    @constants.maskargs
    def createGroupLayer(self, name, group_layer=None):
        """Map.createGroupLayer(name, {group_layer})


        Allows you to create  a group layer in a map within a project (.aprx).


        name(String):
        A string that represents the name of the new group layer.


        group_layer{Layer}:
        A reference to an existing group layer into which  to insert the new
        group layer. Use this parameter to create nested group layers.
        """
        return convertArcObjectToPythonObject(self._arc_object.createGroupLayer(*gp_fixargs((name, group_layer,), True)))

    def exportBookmarks(self, out_bkmx):
        """Map.exportBookmarks(out_bkmx)


        The exportBookmarks method exports all bookmarks associated with the map
        to a bookmark file (.bkmx).


        out_bkmx(String):
        A string that represents the path and file name for the output bookmark
        file (.bkmx).
        """
        return convertArcObjectToPythonObject(self._arc_object.exportBookmarks(*gp_fixargs((out_bkmx,), True)))

    def exportToMAPX(self, out_mapx):
        """Map.exportToMAPX(out_mapx)


        Exports a Map  to a map file.


        out_mapx(String):
        A string used to save a Map to a map file (.mapx).
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToMAPX(*gp_fixargs((out_mapx,), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """Map.getDefinition(cim_version)


        Gets a map's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version), True)))))

    @constants.maskargs
    def getWebLayerSharingDraft(self, server_type, service_type, service_name, layers_and_tables=None):
        """Map.getWebLayerSharingDraft(server_type, service_type, service_name,
        {layers_and_tables})


        Creates a sharing draft from a map that can be configured and shared to
        ArcGIS Enterprise or ArcGIS Online.


        server_type(String):
        A string representing the server type.
        The following server types are supported:
        The getWebLayerSharingDraft function does not support publishing  map
        services to ArcGIS Server. Instead, use the
        arcpy.sharing.CreateSharingDraft function.

        * FEDERATED_SERVER: Supports publishing a map image layer or web scene
        layer to an ArcGIS Enterprise portal federated server. Use this option
        when specifying MAP_IMAGE  or SCENE_LAYER in the service_type parameter.

        * HOSTING_SERVER: Supports publishing either a web feature layer, a web
        tile layer, or a web scene layer to ArcGIS Enterprise or ArcGIS Online.
        Use this option when specifying FEATURE, TILE, or SCENE_LAYER  in the
        service_type parameter.


        service_type(String):
        A string representing the service type. The following service types are
        supported:

        * FEATURE: Creates a FeatureSharingDraft for a web feature layer

        * MAP_IMAGE: Creates a MapImageSharingDraft for a map image layer

        * SCENE_LAYER: Creates a SceneLayerSharingDraft for a web scene layer

        * TILE: Creates a TileSharingDraft for a web tile layer


        service_name(String):
        A string that represents the name of the service. This is the name
        people will see and use to identify the service. The name can contain
        alphanumeric characters, spaces, and underscores. No special characters
        are allowed. The name cannot be more than 120 characters in length.


        layers_and_tables{List}:
        A list of layers and tables from the map. If left blank, the entire map
        will be published. This parameter allows you to choose a subset of
        layers and tables from the map to publish. The layers and tables must be
        from the same map that is being published.If you specify a layer or
        table that participates in a relationship class when publishing a web
        feature layer or a map image layer, all layers or tables involved in the
        relationship class will be published.
        """
        validation_map = {
            "FEDERATED_SERVER": ["MAP_IMAGE", "SCENE_LAYER"],
            "MY_HOSTED_SERVICES": ["TILE", "FEATURE", "SCENE_LAYER"],
            "HOSTING_SERVER": ["TILE", "FEATURE", "SCENE_LAYER"],
            }
        if service_type in validation_map[server_type]:
          if service_type == "TILE":
            from arcpy.sharing import _TileSharingDraft
            tileSharingObject = _TileSharingDraft()
            tileSharingObject.serverType = server_type
            tileSharingObject.serviceType = service_type
            convertArcObjectToPythonObject(self._arc_object.getWebLayerSharingDraft(tileSharingObject, *gp_fixargs((server_type, service_type, service_name, layers_and_tables), True)))
            return tileSharingObject
          if service_type == "FEATURE":
            from arcpy.sharing import _FeatureSharingDraft
            featureSharingObject = _FeatureSharingDraft()
            featureSharingObject.serverType = server_type
            featureSharingObject.serviceType = service_type
            convertArcObjectToPythonObject(self._arc_object.getWebLayerSharingDraft(featureSharingObject, *gp_fixargs((server_type, service_type, service_name, layers_and_tables), True)))
            return featureSharingObject
          if service_type == "MAP_IMAGE":
            from arcpy.sharing import _MapImageSharingDraft
            mapImageObject = _MapImageSharingDraft()
            mapImageObject.serverType = server_type
            mapImageObject.serviceType = service_type
            convertArcObjectToPythonObject(self._arc_object.getWebLayerSharingDraft(mapImageObject, *gp_fixargs(( server_type, service_type, service_name, layers_and_tables), True, pass_arc_object=True)))
            return mapImageObject
        if service_type == "SCENE_LAYER":
            import arcpy
            if self.mapType != "SCENE":
                raise TypeError(arcpy.GetIDMessage(89457))
            if layers_and_tables == None or not isinstance(layers_and_tables, list) or len(layers_and_tables) != 1:
                raise TypeError(arcpy.GetIDMessage(89461))
            sharingDraft = None
            if server_type == "FEDERATED_SERVER":
                sharingDraft = self.getWebLayerSharingDraft(server_type, "MAP_IMAGE", service_name, layers_and_tables)
            else:
                sharingDraft = self.getWebLayerSharingDraft(server_type, "FEATURE", service_name, layers_and_tables)
            from arcpy.sharing import _SceneLayerSharingDraft
            return _SceneLayerSharingDraft(service_type, service_name, layers_and_tables[0], sharingDraft, self.defaultView.camera.mode == "LOCAL")


        raise ValueError("Incompatible server_type: {} and service_type: {}".format(server_type, service_type))

    def importBookmarks(self, bkmx_path):
        """Map.importBookmarks(bkmx_path)


        The importBookmarks method imports all bookmarks from a bookmark file
        (.bkmx) into the map.


        bkmx_path(String):
        A string that represents the path and file name to a bookmark file
        (.bkmx).
        """
        return convertArcObjectToPythonObject(self._arc_object.importBookmarks(*gp_fixargs((bkmx_path,), True)))

    @constants.maskargs
    def insertLayer(self, reference_layer, insert_layer_or_layerfile, insert_position='BEFORE'):
        """Map.insertLayer(reference_layer, insert_layer_or_layerfile,
        {insert_position})


        Provides the ability to add a Layer or LayerFile to a map within a
        project (.aprx) by specifying  a specific location.


        reference_layer(Layer):
        A Layer object representing an existing layer that determines the
        location where the new layer will be inserted.


        insert_layer_or_layerfile(Layer):
        A reference to a Layer or LayerFile object representing the layer or
        layers  to be added.


        insert_position{String}:
        A constant that determines the placement of the added layer or layers
        relative to the reference_layer. The default value is BEFORE.

        * AFTER: Inserts the new layer after or below the reference layer.

        * BEFORE: Inserts the new layer before or above the reference layer.
        """
        return convertArcObjectToPythonObject(self._arc_object.insertLayer(*gp_fixargs((reference_layer, insert_layer_or_layerfile, insert_position), True)))

    def listBookmarks(self, wildcard=None):
        """Map.listBookmarks({wildcard})


        Returns a Python list of bookmark objects in a Map.


        wildcard{String}:
        A wildcard is based on the bookmark name and is not case sensitive. A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listBookmarks(*gp_fixargs((wildcard,), True)))

    def listBrokenDataSources(self):
        """Map.listBrokenDataSources()


        Returns a Python list of Layer or Table objects that have broken
        connections to their original source data within a map.
        """
        return convertArcObjectToPythonObject(self._arc_object.listBrokenDataSources(*gp_fixargs((), True)))

    def listElevationSurfaces(self, wildcard=None):
        """Map.listElevationSurfaces({wildcard})


        Returns a Python list of ElevationSurface objects in a map.


        wildcard{String}:
        A wildcard is based on the label class name and is not case sensitive. A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listElevationSurfaces(*gp_fixargs((wildcard,), True)))

    def listLayers(self, wildcard=None):
        """Map.listLayers({wildcard})


        Returns a Python list of Layer objects that exist within a map.


        wildcard{String}:
        A wildcard is based on the layer name and is not case sensitive. A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listLayers(*gp_fixargs((wildcard,), True)))

    def listTables(self, wildcard=None):
        """Map.listTables({wildcard})


        Returns a Python list of Table objects that exist within a map.


        wildcard{String}:
        A wildcard is based on the layer name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to help limit
        the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listTables(*gp_fixargs((wildcard,), True)))

    @constants.maskargs
    def moveLayer(self, reference_layer, move_layer, insert_position='BEFORE'):
        """Map.moveLayer(reference_layer, move_layer, {insert_position})


        Provides the ability to move a layer or group layer in a map to  a
        specific location within the same map.


        reference_layer(Layer):
        A Layer  object representing an existing layer that determines where the
        move_layer is positioned based on the insert_position value.


        move_layer(Layer):
        A reference to a Layer object representing the layer to be moved.


        insert_position{String}:
        A constant that determines the placement of the moved layer relative to
        the reference_layer. The default value is BEFORE.

        * AFTER: Moves the  layer after or below the reference layer.

        * BEFORE: Moves the layer before or above the reference layer.
        """
        return convertArcObjectToPythonObject(self._arc_object.moveLayer(*gp_fixargs((reference_layer, move_layer, insert_position), True)))

    def openView(self):
        """Map.openView()


        Opens and activates a new map view pane in the application.
        """
        return convertArcObjectToPythonObject(self._arc_object.openView(*gp_fixargs((), True)))

    def removeBookmark(self, remove_bookmark):
        """Map.removeBookmark(remove_bookmark)


        The removeBookmark method allows you to remove a bookmark from a map.


        remove_bookmark(Bookmark):
        A reference to a Bookmark object representing the bookmark to be
        removed.
        """
        return convertArcObjectToPythonObject(self._arc_object.removeBookmark(*gp_fixargs((remove_bookmark,), True)))

    def removeLayer(self, remove_layer):
        """Map.removeLayer(remove_layer)


        Provides the ability to remove a layer from a map in a project.


        remove_layer(Layer):
        A reference to a Layer object representing the layer to be removed.
        """
        return convertArcObjectToPythonObject(self._arc_object.removeLayer(*gp_fixargs((remove_layer,), True)))

    def removeTable(self, remove_table):
        """Map.removeTable(remove_table)


        Provides the ability to remove a table from a map in a project.


        remove_table(Table):
        A reference to a Table object representing the layer to be removed.
        """
        return convertArcObjectToPythonObject(self._arc_object.removeTable(*gp_fixargs((remove_table,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """Map.setDefinition(definition_object)


        Sets a map's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    def updateConnectionProperties(self, current_connection_info, new_connection_info, auto_update_joins_and_relates=True, validate=True, ignore_case=False):
        """Map.updateConnectionProperties(current_connection_info,
        new_connection_info, {auto_update_joins_and_relates}, {validate},
        {ignore_case})


        The updateConnectionProperties method replaces connection properties
        using a dictionary or a path to a workspace.


        current_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties to the source you want to update. If an
        empty string or None is used in current_connection_info, all connection
        properties will be replaced with the new_workspace_info, depending on
        the value of the validate parameter.


        new_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties with the new source information.


        auto_update_joins_and_relates{Boolean}:
        If  set to True, the updateConnectionProperties method will also update
        the connections for associated joins or relates. The default value is
        True.


        validate{Boolean}:
        If  set to True, the connection properties will only be updated if the
        new_connection_info value is a valid connection.  If it is not valid,
        the connection will not be replaced.   If set to False, the method will
        set all connections to match the new_connection_info value, regardless
        of a valid match.  In this case, if a match does not exist, the data
        sources would be broken. The default value is True.


        ignore_case{Boolean}:
        Determines whether searches will be case sensitive. By default, queries
        are case sensitive. To perform queries that are not case sensitive, set
        ignore_case to True. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateConnectionProperties(*gp_fixargs((current_connection_info, new_connection_info, auto_update_joins_and_relates, validate, ignore_case), True)))

    def updateTransformations(self, transformations):
        """Map.updateTransformations(transformations)


        The updateTransformations method replaces a map's transformations using
        a dictionary.


        transformations(Dictionary):
        The dictionary keys are defined below.

        * 2D: Horizontal transformations, if any exist

        * 3D: Vertical transformations, if any exist
        """
        return convertArcObjectToPythonObject(self._arc_object.updateTransformations(*gp_fixargs((transformations,), True)))

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isMapSame(*gp_fixargs((other,), True)))

class MapFrame(_ObjectWithoutInitCall):
    """The MapFrame object is a page layout element that is used to display the
       contents of a map on a layout.      It also provides access to page size
       and positioning, basic navigation methods,  and export options."""
    anchor = passthrough_attr('anchor')
    camera = passthrough_attr('camera')
    elementHeight = passthrough_attr('elementHeight')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementRotation = passthrough_attr('elementRotation')
    elementWidth = passthrough_attr('elementWidth')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    map = passthrough_attr('map')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    time = passthrough_attr('time')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    def addGrid(self, style_item):
        """MapFrame.addGrid(style_item)


        The addGrid method adds a grid or graticule to a  MapFrame using a style
        item.


        style_item(StyleItem):
        The reference to a grid StyleItem object using the listStyleItems method
        on the ArcGISProject class.
        """
        return convertArcObjectToPythonObject(self._arc_object.addGrid(*gp_fixargs((style_item,), True)))

    def convertGridToFeatures(self, grid_name, output_geodatabase, new_grid_name=None):
        """MapFrame.convertGridToFeatures(grid_name, output_geodatabase,
        {new_grid_name})


        Converts a MapFrame grid or graticule into geodatabase features.


        grid_name(String):
        The name of the grid or graticule the way it appears in the Contents
        pane.


        output_geodatabase(String):
        The full path to a file geodatabase (*.gdb) or an enterprise geodatabase
        (*.sde) including the geodatabase name and extension.


        new_grid_name{String}:
        The new name of the group layer added to the map frame's map that will
        contain all the resulting feature layers.  This value will also be added
        to the GridName field in each feature class table.
        """
        return convertArcObjectToPythonObject(self._arc_object.convertGridToFeatures(*gp_fixargs((grid_name, output_geodatabase, new_grid_name,), True)))

    def createBookmark(self, name=None, description=None):
        """MapFrame.createBookmark({name}, {description})


        The createBookmark method creates a bookmark for the map associated with
        the map frame using the current camera settings.


        name{String}:
        An string that represents the name of the new bookmark.  If a name is
        not provided, the default name will follow the sequencing nomenclature,
        for example, Bookmark, Bookmark [1], Bookmark [2].


        description{String}:
        A string that represents the bookmark's description.  If not specified,
        the value is an empty string.
        """
        return convertArcObjectToPythonObject(self._arc_object.createBookmark(*gp_fixargs((name, description,), True)))

    def export(self, export_format):
        """MapFrame.export(export_format)


        The export method exports a MapFrame using a specified export format.


        export_format(Object):
        The supported export format objects  are: AIXFormat, BMPFormat,
        EMFFormat, EPSFormat, GIFFormat, JPEGFormat, PDFFormat, PNGFormat,
        SVGFormat, TGAFormat and TIFFFormat.
        """
        return convertArcObjectToPythonObject(self._arc_object.export(*gp_fixargs((export_format,), True)))

    @constants.maskargs
    def exportToAIX(self, out_aix, resolution=300, image_quality='BEST', compress_vector_graphics=True, image_compression='ADAPTIVE',
    jpeg_compression_quality=80, embed_fonts=True, embed_color_profile=True, convert_markers=False):
        """MapFrame.exportToAIX(out_aix, {resolution}, {image_quality},
        {compress_vector_graphics}, {image_compression},
        {jpeg_compression_quality}, {embed_fonts}, {embed_color_profile},
        {convert_markers})


        Exports the MapFrame  to Adobe Illustrator Exchange (AIX) format. AIX
        files can be used with the ArcGIS Maps for Adobe Creative Cloud
        extension or Adobe Illustrator.


        out_aix(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 300.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls compression of vector and text portions of the
        output file. Image compression is defined separately. The default value
        is True.


        image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        jpeg_compression_quality{Integer}:
        A number that controls compression quality value when image_compression
        is set to ADAPTIVE or JPEG. The valid range is 1 through 100.    A
        jpeg_compression_quality of 100 provides the best quality images but
        creates large export files.   The recommended range is between 70 and
        90. The default value is 80.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToAIX(*gp_fixargs((out_aix, resolution, image_quality, compress_vector_graphics,
        image_compression, jpeg_compression_quality, embed_fonts, embed_color_profile, convert_markers), True)))

    @constants.maskargs
    def exportToBMP(self, out_bmp, resolution=96, world_file=False, bmp_color_mode='24-BIT_TRUE_COLOR', bmp_image_compression='NONE', embed_color_profile=True):
        """MapFrame.exportToBMP(out_bmp, {resolution}, {world_file},
        {bmp_color_mode}, {bmp_image_compression}, {embed_color_profile})


        Exports the MapFrame to a Microsoft Windows Bitmap (BMP) format file.


        out_bmp(String):
        A string that represents the path and file name of the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information. The
        default value is False.


        bmp_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        bmp_image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file.  This option only applies to 8-bit
        bmp_color_mode options. The default value is NONE.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToBMP(*gp_fixargs((out_bmp, resolution, world_file, bmp_color_mode, bmp_image_compression, embed_color_profile), True)))

    @constants.maskargs
    def exportToEMF(self, out_emf, resolution=96, image_quality='BEST', output_as_image=False, convert_markers=False):
        """MapFrame.exportToEMF(out_emf, {resolution}, {image_quality},
        {output_as_image}, {convert_markers})


        Exports the MapFrame to an Enhanced Metafile (EMF) format file.


        out_emf(String):
        A string that represents the system path and file name of the output
        export file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToEMF(*gp_fixargs((out_emf, resolution, image_quality, output_as_image, convert_markers), True)))

    @constants.maskargs
    def exportToEPS(self, out_eps, resolution=96, image_compression='DEFLATE', image_quality='BEST',
                   embed_fonts=True, output_as_image=False, convert_markers=False):
        """MapFrame.exportToEPS(out_eps, {resolution}, {image_compression},
        {image_quality}, {embed_fonts}, {output_as_image}, {convert_markers})


        Exports the MapFrame to an Encapsulated PostScript (EPS) format file.


        out_eps(String):
        A string that represents the system path and file name of the output
        export file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file. The default value is DEFLATE.

        * DEFLATE: A lossless data compression.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1.

        * BETTER: An output image quality resample ratio of 2.

        * FASTER: An output image quality resample ratio of 4.

        * FASTEST: An output image quality resample ratio of 5.

        * NORMAL: An output image quality resample ratio of 3.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToEPS(*gp_fixargs((out_eps, resolution, image_compression, image_quality, embed_fonts, output_as_image, convert_markers), True)))

    @constants.maskargs
    def exportToGIF(self, out_gif, resolution=96, world_file=False, gif_color_mode='8-BIT_ADAPTIVE_PALETTE'):
        """MapFrame.exportToGIF(out_gif, {resolution}, {world_file},
        {gif_color_mode})


        Exports the MapFrame to a Graphic Interchange Format (GIF) file.


        out_gif(String):
        A string that represents the system path and file name of the output
        export file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information. The
        default value is False.


        gif_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 8-BIT_ADAPTIVE_PALETTE.

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToGIF(*gp_fixargs((out_gif, resolution, world_file, gif_color_mode), True)))

    @constants.maskargs
    def exportToJPEG(self, out_jpg, resolution=96, world_file=False, jpeg_color_mode='24-BIT_TRUE_COLOR', jpeg_quality=80, embed_color_profile=True):
        """MapFrame.exportToJPEG(out_jpg, {resolution}, {world_file},
        {jpeg_color_mode}, {jpeg_quality}, {embed_color_profile})


        Exports the MapFrame to the Joint Photographic Experts Group (JPEG)
        format.


        out_jpg(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information.  If you
        export a 3D map frame, this parameter will be ignored regardless of the
        setting because world files are not applicable to 3D views. The default
        value is False.


        jpeg_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        jpeg_quality{Integer}:
        This value (0–100) controls the amount of compression applied to the
        output image. For JPEG, image quality is adversely affected the more
        compression is applied. A higher quality (highest = 100) setting will
        produce sharper images and larger file sizes. A lower quality setting
        will produce more image artifacts and smaller files. The default value
        is 80.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToJPEG(*gp_fixargs((out_jpg, resolution, world_file, jpeg_color_mode, jpeg_quality, embed_color_profile), True)))

    @constants.maskargs
    def exportToPDF(self, out_pdf, resolution=96, image_quality='BEST', compress_vector_graphics=True, image_compression='ADAPTIVE',
    embed_fonts=True, layers_attributes='LAYERS_ONLY', georef_info=True, jpeg_compression_quality=80, output_as_image=False,
    embed_color_profile=True, convert_markers=False, simulate_overprint=False):
        """MapFrame.exportToPDF(out_pdf, {resolution}, {image_quality},
        {compress_vector_graphics}, {image_compression}, {embed_fonts},
        {layers_attributes}, {georef_info}, {jpeg_compression_quality},
        {output_as_image}, {embed_color_profile}, {convert_markers},
        {simulate_overprint})


        Exports the MapFrame  to a Portable Document Format (PDF) file.


        out_pdf(String):
        A string that represents the path and file name of the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 300.


        image_quality{String}:
        A string that defines the output image quality and the draw resolution
        of map layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls the compression of vector and text portions of
        the output file. Image compression is defined separately. The default
        value is True.


        image_compression{String}:
        A string that defines the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        layers_attributes{String}:
        A string that controls the inclusion of PDF layers and PDF object data
        (attributes) in the export file. The default value is LAYERS_ONLY.

        * LAYERS_AND_ATTRIBUTES: Export PDF layers and feature attributes.

        * LAYERS_ONLY: Export PDF layers only.

        * NONE: No setting is applied.


        georef_info{Boolean}:
        A Boolean that enables the export of coordinate system information for
        each data frame into the output PDF file. The default value is True.


        jpeg_compression_quality{Integer}:
        A number that controls the compression quality value when
        image_compression is set to ADAPTIVE or JPEG. The valid range is 1
        through 100.    A jpeg_compression_quality of 100 provides the best
        quality images but creates large export files.   The recommended range
        is 70 through 90. The default value is 80.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.


        simulate_overprint{Boolean}:
        Sometimes called soft proofing, simulating overprinting shows a
        representation of how overlapping areas of ink will appear when printed
        on a page.  You set up overprinting on symbol layers. The default value
        is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPDF(*gp_fixargs((out_pdf, resolution, image_quality,
        compress_vector_graphics, image_compression, embed_fonts, layers_attributes, georef_info, jpeg_compression_quality,
        output_as_image, embed_color_profile, convert_markers, simulate_overprint), True)))

    @constants.maskargs
    def exportToPNG(self, out_png, resolution=96, world_file=False, color_mode='32-BIT_WITH_ALPHA', embed_color_profile=True):
        """MapFrame.exportToPNG(out_png, {resolution}, {world_file}, {color_mode},
        {embed_color_profile})


        Exports the MapFrame to Portable Network Graphics (PNG) format.


        out_png(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information.  If you
        export a 3D map frame, this parameter will be ignored regardless of the
        setting because world files are not applicable to 3D views. The default
        value is False.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 32-BIT_WITH_ALPHA.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 32-BIT_WITH_ALPHA: 32-bit with alpha

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPNG(*gp_fixargs((out_png, resolution, world_file, color_mode, embed_color_profile), True)))

    @constants.maskargs
    def exportToSVG(self, out_svg, resolution=96, compress_to_svgz=False, image_quality='BEST', embed_fonts=True, output_as_image=False, convert_markers=False):
        """MapFrame.exportToSVG(out_svg, {resolution}, {compress_to_svgz},
        {image_quality}, {embed_fonts}, {output_as_image}, {convert_markers})


        Exports the MapFrame to a Scalable Vector Graphics (SVG) format file.


        out_svg(String):
        A string that represents the path and file name of the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        compress_to_svgz{Boolean}:
        If set to True, the output is compressed. The default value is False.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1.

        * BETTER: An output image quality resample ratio of 2.

        * FASTER: An output image quality resample ratio of 4.

        * FASTEST: An output image quality resample ratio of 5.

        * NORMAL: An output image quality resample ratio of 3.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToSVG(*gp_fixargs((out_svg, resolution, compress_to_svgz,
            image_quality, embed_fonts, output_as_image, convert_markers), True)))

    @constants.maskargs
    def exportToTGA(self, out_tga, resolution=96, world_file=False, color_mode='24-BIT_TRUE_COLOR'):
        """MapFrame.exportToTGA(out_tga, {resolution}, {world_file}, {color_mode})


        Exports the MapFrame to a Truevision Graphics Adapter (TGA) format file.


        out_tga(String):
        A string that represents the path and file name of the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information. The
        default value is False.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 32-BIT_WITH_ALPHA.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 32-BIT_WITH_ALPHA: 32-bit with alpha

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToTGA(*gp_fixargs((out_tga, resolution, world_file, color_mode), True)))

    @constants.maskargs
    def exportToTIFF(self, out_tif, resolution=96, world_file=False, color_mode='24-BIT_TRUE_COLOR', tiff_compression='LZW', geoTIFF_tags=False,
                    jpeg_compression_quality=80, embed_color_profile=True):
        """MapFrame.exportToTIFF(out_tif, {resolution}, {world_file}, {color_mode},
        {tiff_compression}, {geoTIFF_tags}, {jpeg_compression_quality},
        {embed_color_profile})


        Exports the MapFrame to Tagged Image File Format (TIFF).


        out_tif(String):
        A string that represents the path and file name for the output export
        file.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information.  If you
        export a 3D map frame, this parameter will be ignored regardless of the
        setting because world files are not applicable to 3D views. The default
        value is False.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        available options are dependent on the specified Color Model set in the
        layout's Color Management properties. The default value is
        24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color. Available only to RGB.

        * 32-BIT_CMYK_TRUE_COLOR: 32-bit CMYK true color. Available only to
        CMYK.

        * 32-BIT_WITH_ALPHA: 32-bit with alpha. Available only to RGB.

        * 40-BIT_CMYK_WITH_ALPHA: 40-bit CMYK with alpha. Available only to
        CMYK.

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette. Available to RGB and
        CMYK.

        * 8-BIT_GRAYSCALE: 8-bit grayscale. Available to RGB and CMYK.


        tiff_compression{String}:
        This value represents a compression scheme. The default value is LZW.

        * DEFLATE: A lossless data compression.

        * JPEG: JPEG compression.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * PACK_BITS: Pack bits compression.


        geoTIFF_tags{Boolean}:
        If set to True, georeferencing tags are included in the structure of the
        TIFF export file. The tags contain pixel scale information and real-
        world coordinate information. These tags can be read by applications
        that support GeoTIFF format. The default value is False.


        jpeg_compression_quality{Integer}:
        This value (0–100) controls the amount of compression applied to the
        output image. With a JPEG image, quality is adversely affected the more
        compression is applied. A higher quality (highest = 100) setting will
        produce sharper images and larger file sizes. A lower quality setting
        will produce more image artifacts and smaller files. The default value
        is 80.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToTIFF(*gp_fixargs((out_tif, resolution, world_file, color_mode, tiff_compression, geoTIFF_tags,
                                              jpeg_compression_quality, embed_color_profile), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """MapFrame.getDefinition(cim_version)


        Returns a map frame element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    def getLayerExtent(self, layer, selection_only=True, symbolized_extent=True):
        """MapFrame.getLayerExtent(layer, {selection_only}, {symbolized_extent})


        Returns a layer's extent for all features or only the selected features
        in a layer.


        layer(Layer):
        A reference to a Layer object.


        selection_only{Boolean}:
        If True, it returns the extent for selected features; if False, it
        returns the extent for all features. The default value is True.


        symbolized_extent{Boolean}:
        A value of True will return the layer's symbolized extent; otherwise, it
        will return the geometric extent.  The symbolized extent takes into
        account the area the symbology covers so that it does not get cut off by
        the data frame's boundary. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.getLayerExtent(*gp_fixargs((layer, selection_only, symbolized_extent), True)))

    def panToExtent(self, extent):
        """MapFrame.panToExtent(extent)


        Pans and centers the MapFrame using a new Extent object without changing
        the map frame's scale.


        extent(Extent):
        A geoprocessing Extent object.
        """
        return convertArcObjectToPythonObject(self._arc_object.panToExtent(*gp_fixargs((extent,), True)))

    def removeGrids(self, wilcard=None):
        """MapFrame.removeGrids({wildcard})


        The removeGrids method removes one or more grids or graticules from a
        map frame.


        wildcard{String}:
        A wildcard is based on the grid or graticule name in the Contents pane
        and is not case sensitive.  A combination of asterisks (*) and
        characters can be used to limit the resulting list. The default value is
        None.
        """
        return convertArcObjectToPythonObject(self._arc_object.removeGrids(*gp_fixargs((wilcard,), True)))

    @constants.maskargs
    def setAnchor(self, anchor):
        """MapFrame.setAnchor(anchor)


        The setAnchor method controls the anchor position for a MapFrame
        element.


        anchor(String):
        A string that specifies the location of the anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """MapFrame.setDefinition(definition_object)


        Sets a map frame element's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    def zoomToAllLayers(self, selection_only=True, symbolized_extent=True):
        """MapFrame.zoomToAllLayers({selection_only}, {symbolized_extent})


        Modifies the MapFrame view to match the extent of all layers or selected
        layers in a map.


        selection_only{Boolean}:
        If True, it sets the extent based on the selected  features; if False,
        it sets the extent for all  features in a map. The default value is
        True.


        symbolized_extent{Boolean}:
        A value of True will return the layer's symbolized extent; otherwise, it
        will return the geometric extent.  The symbolized extent takes into
        account the area the symbology covers so that it does not get cut off by
        the map frame's boundary. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.zoomToAllLayers(*gp_fixargs((selection_only, symbolized_extent), True)))

    def zoomToBookmark(self, bookmark):
        """MapFrame.zoomToBookmark(bookmark)


        Modifies the MapFrame view to match the view information stored with a
        spatial bookmark.


        bookmark(Bookmark):
        A reference to a Bookmark object.
        """
        return convertArcObjectToPythonObject(self._arc_object.zoomToBookmark(*gp_fixargs((bookmark,), True)))

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isMapFrameSame(*gp_fixargs((other,), True)))

class MapSeries(_ObjectWithoutInitCall):
    """ MapSeries object provides access to properties."""
    clipToIndexFeature = passthrough_attr('clipToIndexFeature')
    currentPageNumber = passthrough_attr('currentPageNumber')
    enabled = passthrough_attr('enabled')
    indexLayer = passthrough_attr('indexLayer')
    mapFrame = passthrough_attr('mapFrame')
    pageCount = passthrough_attr('pageCount')
    pageNameField = passthrough_attr('pageNameField')
    selectedIndexFeatures = passthrough_attr('selectedIndexFeatures')

    def _convert(self, dictionary):
        from collections import namedtuple
        #replace the special characters ( . ) in spatial fields names with _
        newDict = {key.replace('(', '_').replace(')', '_').replace('.', '_') : value for key, value in list(dictionary.items())}
        return namedtuple('pageRow', list(newDict.keys()))(**newDict)

    def export(self, export_format, mapseries_export_options=None):
        """MapSeries.export(export_format, {mapseries_export_options})


        The export method exports a MapSeries using a specified export format
        and optionally different mapseries_export_options.


        export_format(Object):
        The supported export format object is PDFFormat.


        mapseries_export_options{Object}:
        The MapSeriesExportOptions object that includes changes to default
        property values.
        """
        return convertArcObjectToPythonObject(self._arc_object.export(*gp_fixargs((export_format, mapseries_export_options,), True)))

    @constants.maskargs
    def exportToPDF(self, out_pdf, page_range_type="ALL", page_range_string="", multiple_files="PDF_SINGLE_FILE", resolution=96, image_quality='BEST',
    compress_vector_graphics=True, image_compression='ADAPTIVE', embed_fonts=True, layers_attributes='LAYERS_ONLY', georef_info=True,
    jpeg_compression_quality=80, clip_to_elements=False, show_selection_symbology=False, output_as_image=False, embed_color_profile=True,
    pdf_accessibility=False, show_export_count=False, keep_layout_background=True, convert_markers=False, simulate_overprint=False):
        """MapSeries.exportToPDF(out_pdf, {page_range_type}, {page_range_string},
        {multiple_files}, {resolution}, {image_quality},
        {compress_vector_graphics}, {image_compression}, {embed_fonts},
        {layers_attributes}, {georef_info}, {jpeg_compression_quality},
        {clip_to_elements}, {show_selection_symbology}, {output_as_image},
        {embed_color_profile}, {pdf_accessibility}, {show_export_count},
        {keep_layout_background}, {convert_markers}, {simulate_overprint})


        Exports a specified set of pages to a Portable Document Format (PDF)
        file for a layout that has map series enabled.


        out_pdf(String):
        A string that represents the path and file name of the output export
        file.


        page_range_type{String}:
        The string value that designates how the pages will be printed. The
        default value is ALL.

        * ALL: All pages are exported.

        * CURRENT: The active or current page is exported.

        * RANGE: Only pages listed in the page_range_string parameter are
        exported.

        * SELECTED: Selected index layer features/pages are exported.


        page_range_string{String}:
        A string that identifies the pages to be exported if the RANGE option in
        the page_range_type parameter is used (for example, 1, 3, 5-12).   If
        any other page_range_type value is used, the page_range_string value
        will be ignored.


        multiple_files{String}:
        A string that controls how the output PDF file is created.  By default,
        all pages are exported into a single, multipage document.  The default
        is PDF_SINGLE_FILE. The default value is PDF_SINGLE_FILE.

        * PDF_MULTIPLE_FILES_PAGE_NAME: Export  each map series page to an
        individual file and append the page name to the file name.  For example,
        Output.PDF will become Output_LakeErie.PDF

        * PDF_MULTIPLE_FILES_PAGE_NUMBER: Export  each map series page to an
        individual file and append the page number to the file name. For
        example, Output.PDF will become Output_1.PDF

        * PDF_SINGLE_FILE: Export  into a multipage, single file document.


        resolution{Integer}:
        An integer that defines the resolution of the export file in dots per
        inch (dpi). The default value is 96.


        image_quality{String}:
        A string that defines output image quality. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls the compression of vector and text portions of
        the output file. Image compression is defined separately. The default
        value is True.


        image_compression{String}:
        A string that defines the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in an export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        layers_attributes{String}:
        A string that controls the inclusion of PDF layers and PDF object data
        (attributes) in the export file. The default value is LAYERS_ONLY.

        * LAYERS_AND_ATTRIBUTES: Export PDF layers and feature attributes.

        * LAYERS_ONLY: Export PDF layers only.

        * NONE: No setting is applied.


        georef_info{Boolean}:
        A Boolean that enables the export of coordinate system information for
        each map frame into the output PDF file. The default value is True.


        jpeg_compression_quality{Integer}:
        A number that controls the compression quality value when
        image_compression is set to ADAPTIVE or JPEG. The valid range is 1
        through 100.    A jpeg_compression_quality of 100 provides the best
        quality images but creates large export files.   The recommended range
        is 70 through 90. The default value is 80.


        clip_to_elements{Boolean}:
        If set to True, the layout is clipped to the smallest bounding box that
        includes all layout elements. The default value is False.


        show_selection_symbology{Boolean}:
        A Boolean that controls whether the selection symbology should be
        displayed in the output. The default value is False.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        pdf_accessibility{Boolean}:
        Output a tagged PDF file where text can be read by screen readers or
        other assistive technology.  A tagged PDF file can include alt text—a
        text
        description of a graphic element that a screen reader uses to
        describe the element—for map frames, pictures, and chart frames.
        Alt text is added in the
        Element Pane
         for each element. The default value is False.


        show_export_count{Boolean}:
        If set to True, you will see the status of each page being exported
        displayed in the Python shell. The default value is False.


        keep_layout_background{Boolean}:
        If set to True, the white background will be included in the export. The
        default value is True.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.


        simulate_overprint{Boolean}:
        Sometimes called soft proofing, simulating overprinting shows a
        representation of how overlapping areas of ink will appear when printed
        on a page.  You set up overprinting on symbol layers. The default value
        is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPDF(*gp_fixargs((out_pdf, page_range_type, page_range_string,
        multiple_files ,resolution, image_quality, compress_vector_graphics, image_compression, embed_fonts, layers_attributes,
        georef_info, jpeg_compression_quality, clip_to_elements, show_selection_symbology, output_as_image, embed_color_profile,
        pdf_accessibility, show_export_count, keep_layout_background, convert_markers, simulate_overprint), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """MapSeries.getDefinition(cim_version)


        Returns a spatial map series' CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version), True)))))

    def getPageNumberFromName(self, page_name):
        """MapSeries.getPageNumberFromName(page_name)


        Returns a Map Series page number based on the name of the page.


        page_name(String):
        A page number in the index layer that corresponds to the Name field that
        was used to set up the Map Series.
        """
        return convertArcObjectToPythonObject(self._arc_object.getPageNumberFromName(*gp_fixargs((page_name,), True)))

    @property
    def pageRow(self):
        return self._convert(convertArcObjectToPythonObject(getattr(self._arc_object, "pageRow")))

    def refresh(self):
        """MapSeries.refresh()


        Refreshes an existing map series.
        """
        return convertArcObjectToPythonObject(self._arc_object.refresh(*gp_fixargs((), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """MapSeries.setDefinition(definition_object)


        Sets a spatial map series' CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

class MapSurroundElement(_ObjectWithoutInitCall):
    anchor = passthrough_attr('anchor')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementHeight = passthrough_attr('elementHeight')
    elementWidth = passthrough_attr('elementWidth')
    elementRotation = passthrough_attr('elementRotation')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    mapFrame = passthrough_attr('mapFrame')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    def applyStyleItem(self, style_item):
        """MapSurroundElement.applyStyleItem(style_item)


        Applies a StyleItem to a MapSurroundElement.


        style_item(StyleItem):
        A reference to a StyleItem in a project.
        """
        return convertArcObjectToPythonObject(self._arc_object.applyStyleItem(*gp_fixargs((style_item,), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """MapSurroundElement.getDefinition(cim_version)


        Returns a map surround element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def setAnchor(self, anchor):
        """MapSurroundElement.setAnchor(anchor)


        The setAnchor method controls the anchor position for a
        MapSurroundElement value.


        anchor(String):
        A string that specifies the location of the anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """MapSurroundElement.setDefinition(definition_object)


        Sets a map surround element's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

class MapTime(_ObjectWithoutInitCall):
    """The MapTime object is a Map object with time settings."""
    currentTimeEnd = passthrough_attr('currentTimeEnd')
    currentTimeStart = passthrough_attr('currentTimeStart')
    currentTimeSpan = passthrough_attr('currentTimeSpan')
    currentTimeSpanUnits = passthrough_attr('currentTimeSpanUnits')
    isTimeEnabled = passthrough_attr('isTimeEnabled')
    timeInclusion = passthrough_attr('timeInclusion')
    timeStepInterval = passthrough_attr('timeStepInterval')
    timeStepIntervalUnits = passthrough_attr('timeStepIntervalUnits')

    @constants.maskargs
    def setTimeInclusion(self, time_inclusion):
        """MapTime.setTimeInclusion(time_inclusion)


        The setTimeInclusion method controls how  the currentTimeStart and the
        currentTimeEnd are included in the current time span.


        time_inclusion(String):
        A string that specifies a valid time inclusion value.

        * EXCLUDE_START_AND_END: Exclude both start and end times.

        * INCLUDE_ONLY_END: Exclude start time, include end time.

        * INCLUDE_ONLY_START: Include start time, exclude end time.

        * INCLUDE_START_AND_END: Include both start and end times.
        """
        return convertArcObjectToPythonObject(self._arc_object.setTimeInclusion(*gp_fixargs((time_inclusion,), True)))

    @constants.maskargs
    def timeStep(self, reference_time, interval, interval_units):
        """MapTime.timeStep(reference_time, interval, interval_units)


        The timeStep method returns a new time based on a given reference time
        and a time interval.


        reference_time(DateTime):
        A Python DateTime object. The interval and interval_units will be added
        to the reference_time.The reference_time can be any Python DateTime
        object. For example, you can set the reference_time to be the
        currentStartTime or currentEndTime values.


        interval(Double):
        A double that defines a time interval. Positive or negative intervals
        can be used.


        interval_units(String):
        A string that specifies a valid interval unit.

        * CENTURIES: Centuries

        * DAYS: Days

        * DECADES: Decades

        * HOURS: Hours

        * MILLISECONDS: Milliseconds

        * MINUTES: Minutes

        * MONTHS: Months

        * SECONDS: Seconds

        * WEEKS: Weeks

        * YEARS: Years
        """
        return convertArcObjectToPythonObject(self._arc_object.timeStep(*gp_fixargs((reference_time, interval, interval_units), True)))

class MapView(_ObjectWithoutInitCall):
    """The MapView."""
    camera = passthrough_attr('camera')
    map = passthrough_attr('map')

    def createBookmark(self, name=None, description=None):
        """MapView.createBookmark({name}, {description})


        The createBookmark method creates a bookmark for the map associated with
        the map view using the current camera settings.


        name{String}:
        An optional string that represents the name of the new bookmark.  If a
        name is not provided, the default name value will follow the sequencing
        nomenclature, for example, Bookmark, Bookmark [1], Bookmark [2], and so
        on.


        description{String}:
        An optional string that represents the bookmark's description. The
        default value is Map.
        """
        return convertArcObjectToPythonObject(self._arc_object.createBookmark(*gp_fixargs((name, description), True)))

    def export(self, export_format):
        """MapView.export(export_format)


        The export method exports a MapView using a specified export format.


        export_format(Object):
        The supported export format objects  are: AIXFormat, BMPFormat,
        EMFFormat, EPSFormat, GIFFormat, JPEGFormat, PDFFormat, PNGFormat,
        SVGFormat, TGAFormat and TIFFFormat.
        """
        return convertArcObjectToPythonObject(self._arc_object.export(*gp_fixargs((export_format,), True)))

    @constants.maskargs
    def exportToAIX(self, out_aix, width, height, resolution=300, image_quality='BEST', compress_vector_graphics=True, image_compression='ADAPTIVE',
    jpeg_compression_quality=80, embed_fonts=True, embed_color_profile=True, convert_markers=False):
        """MapView.exportToAIX(out_aix, width, height, {resolution},
        {image_quality}, {compress_vector_graphics}, {image_compression},
        {jpeg_compression_quality}, {embed_fonts}, {embed_color_profile},
        {convert_markers})


        Exports the MapView to Adobe Illustrator Exchange (AIX) format. AIX
        files can be used with the ArcGIS Maps for Adobe Creative Cloud
        extension or Adobe Illustrator.


        out_aix(String):
        A string that represents the path and file name for the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 300.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls compression of vector and text portions of the
        output file. Image compression is defined separately. The default value
        is True.


        image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        jpeg_compression_quality{Integer}:
        A number that controls compression quality value when image_compression
        is set to ADAPTIVE or JPEG. The valid range is 1 through 100.    A
        jpeg_compression_quality of 100 provides the best quality images but
        creates large export files.   The recommended range is between 70 and
        90. The default value is 80.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToAIX(*gp_fixargs((out_aix, width, height, resolution, image_quality,
        compress_vector_graphics, image_compression, jpeg_compression_quality, embed_fonts, embed_color_profile, convert_markers), True)))

    @constants.maskargs
    def exportToBMP(self, out_bmp, width, height, resolution=96, world_file=False,
                    bmp_color_mode='24-BIT_TRUE_COLOR', bmp_image_compression='NONE', embed_color_profile=True):
        """MapView.exportToBMP(out_bmp, width, height, {resolution}, {world_file},
        {bmp_color_mode}, {bmp_image_compression}, {embed_color_profile})


        Exports the MapView to a Microsoft Windows Bitmap (BMP) format file.


        out_bmp(String):
        A string that represents the path and file name of the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information. The
        default value is False.


        bmp_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        bmp_image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file.  This option only applies to 8-bit
        bmp_color_mode options. The default value is NONE.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToBMP(*gp_fixargs((out_bmp, width, height, resolution, world_file, bmp_color_mode, bmp_image_compression, embed_color_profile), True)))

    @constants.maskargs
    def exportToEMF(self, out_emf, width, height, resolution=96, image_quality='BEST', output_as_image=False, convert_markers=False):
        """MapView.exportToEMF(out_emf, width, height, {resolution},
        {image_quality}, {output_as_image}, {convert_markers})


        Exports the MapView to an Enhanced Metafile (EMF) format file.


        out_emf(String):
        A string that represents the system path and file name of the output
        export file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToEMF(*gp_fixargs((out_emf, width, height, resolution, image_quality, output_as_image, convert_markers), True)))

    @constants.maskargs
    def exportToEPS(self, out_eps, width, height, resolution=96, image_compression='DEFLATE', image_quality='BEST',
                   embed_fonts=True, output_as_image=False, convert_markers=False):
        """MapView.exportToEPS(out_eps, width, height, {resolution},
        {image_compression}, {image_quality}, {embed_fonts}, {output_as_image},
        {convert_markers})


        Exports the MapView to an Encapsulated PostScript (EPS) format file.


        out_eps(String):
        A string that represents the system path and file name of the output
        export file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        image_compression{String}:
        A string that specifies the compression scheme used to compress image or
        raster data in the output file. The default value is DEFLATE.

        * DEFLATE: A lossless data compression.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1.

        * BETTER: An output image quality resample ratio of 2.

        * FASTER: An output image quality resample ratio of 4.

        * FASTEST: An output image quality resample ratio of 5.

        * NORMAL: An output image quality resample ratio of 3.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToEPS(*gp_fixargs((out_eps, width, height, resolution, image_compression, image_quality, embed_fonts, output_as_image, convert_markers), True)))

    @constants.maskargs
    def exportToGIF(self, out_gif, width, height, resolution=96, world_file=False, gif_color_mode='8-BIT_ADAPTIVE_PALETTE'):
        """MapView.exportToGIF(out_gif, width, height, {resolution}, {world_file},
        {gif_color_mode})


        Exports the MapView to a Graphic Interchange Format (GIF) file.


        out_gif(String):
        A string that represents the system path and file name of the output
        export file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information. The
        default value is False.


        gif_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 8-BIT_ADAPTIVE_PALETTE.

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToGIF(*gp_fixargs((out_gif, width, height, resolution, world_file, gif_color_mode), True)))

    @constants.maskargs
    def exportToJPEG(self, out_jpg, width, height, resolution=96, world_file=False, jpeg_color_mode='24-BIT_TRUE_COLOR', jpeg_quality=80, embed_color_profile=True):
        """MapView.exportToJPEG(out_jpg, width, height, {resolution}, {world_file},
        {jpeg_color_mode}, {jpeg_quality}, {embed_color_profile})


        Exports the MapView to a Joint Photographic Experts Group (JPEG) format
        file.


        out_jpg(String):
        A string that represents the path and file name of the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information.  If you
        export a 3D map frame, this parameter will be ignored regardless of the
        setting, because world files are not applicable to 3D views. The default
        value is False.


        jpeg_color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        jpeg_quality{Integer}:
        This value (0–100) controls the amount of compression applied to the
        output image. For JPEG, image quality is adversely affected the more
        compression is applied. A higher quality (highest = 100) setting will
        produce sharper images and larger file sizes. A lower quality setting
        will produce more image artifacts and smaller files. The default value
        is 80.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToJPEG(*gp_fixargs((out_jpg, width, height, resolution, world_file, jpeg_color_mode, jpeg_quality, embed_color_profile), True)))

    @constants.maskargs
    def exportToPDF(self, out_pdf, width, height, resolution=96, image_quality='BEST', compress_vector_graphics=True,
    image_compression='ADAPTIVE', embed_fonts=True, layers_attributes='LAYERS_ONLY', georef_info=True, jpeg_compression_quality=80,
    output_as_image=False, embed_color_profile=True, convert_markers=False, simulate_overprint=False):
        """MapView.exportToPDF(out_pdf, width, height, {resolution},
        {image_quality}, {compress_vector_graphics}, {image_compression},
        {embed_fonts}, {layers_attributes}, {georef_info},
        {jpeg_compression_quality}, {output_as_image}, {embed_color_profile},
        {convert_markers}, {simulate_overprint})


        Exports the MapView  to a Portable Document Format (PDF) file.


        out_pdf(String):
        A string that represents the path and file name of the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 300.


        image_quality{String}:
        A string that defines the output image quality and the draw resolution
        of map layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls the compression of vector and text portions of
        the output file. Image compression is defined separately. The default
        value is True.


        image_compression{String}:
        A string that defines the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression.

        * JPEG: A lossy data compression.

        * JPEG2000: Offers higher quality compression with smaller file size
        than JPEG.  This compression is lossless if jpeg_compression_quality is
        set to 100.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        layers_attributes{String}:
        A string that controls the inclusion of PDF layers and PDF object data
        (attributes) in the export file. The default value is LAYERS_ONLY.

        * LAYERS_AND_ATTRIBUTES: Export PDF layers and feature attributes.

        * LAYERS_ONLY: Export PDF layers only.

        * NONE: None.


        georef_info{Boolean}:
        A Boolean that enables the export of coordinate system information for
        each data frame into the output PDF file. The default value is True.


        jpeg_compression_quality{Integer}:
        A number that controls the compression quality value when
        image_compression is set to ADAPTIVE or JPEG. The valid range is 1
        through 100.    A jpeg_compression_quality of 100 provides the best
        quality images but creates large export files.   The recommended range
        is 70 through 90. The default value is 80.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.


        simulate_overprint{Boolean}:
        Sometimes called soft proofing, simulating overprinting shows a
        representation of how overlapping areas of ink will appear when printed
        on a page.  You set up overprinting on symbol layers. The default value
        is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPDF(*gp_fixargs((out_pdf, width, height, resolution, image_quality,
        compress_vector_graphics, image_compression, embed_fonts, layers_attributes, georef_info, jpeg_compression_quality, False,
        output_as_image, embed_color_profile, convert_markers, simulate_overprint), True)))

    @constants.maskargs
    def exportToPNG(self, out_png, width, height, resolution=96, world_file=False, color_mode='32-BIT_WITH_ALPHA',
                    embed_color_profile=True):
        """MapView.exportToPNG(out_png, width, height, {resolution}, {world_file},
        {color_mode}, {embed_color_profile})


        Exports the MapView to a Portable Network Graphics (PNG) format file.


        out_png(String):
        A string that represents the path and file name of the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information.  If you
        export a 3D map frame, this parameter will be ignored regardless of the
        setting, because world files are not applicable to 3D views. The default
        value is False.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 32-BIT_WITH_ALPHA.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 32-BIT_WITH_ALPHA: 32-bit with alpha

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToPNG(*gp_fixargs((out_png, width, height, resolution, world_file, color_mode, embed_color_profile), True)))

    @constants.maskargs
    def exportToSVG(self, out_svg, width, height, resolution=96, compress_to_svgz=False, image_quality='BEST', embed_fonts=True, output_as_image=False, convert_markers=False):
        """MapView.exportToSVG(out_svg, width, height, {resolution},
        {compress_to_svgz}, {image_quality}, {embed_fonts}, {output_as_image},
        {convert_markers})


        Exports the MapView to a Scalable Vector Graphics (SVG) format file.


        out_svg(String):
        A string that represents the path and file name of the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        compress_to_svgz{Boolean}:
        If set to True, the output is compressed. The default value is False.


        image_quality{String}:
        A string that specifies output image quality, the draw resolution of map
        layers that draw as rasters. The default value is BEST.

        * BEST: An output image quality resample ratio of 1.

        * BETTER: An output image quality resample ratio of 2.

        * FASTER: An output image quality resample ratio of 4.

        * FASTEST: An output image quality resample ratio of 5.

        * NORMAL: An output image quality resample ratio of 3.


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in the export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        output_as_image{Boolean}:
        If set to True, vector content  can be saved as an image.  Selecting
        this option for maps or layouts that contain vector layers with a high
        density of vertices can reduce the output file size.  When exporting to
        PDF and this option is set to True, you cannot view PDF layers in the
        output. The default value is False.


        convert_markers{Boolean}:
        A Boolean that controls the conversion of character-based marker symbols
        to polygons. This allows the symbols to appear correctly if the symbol
        font is not available or cannot be embedded. However, setting this
        parameter to True disables font embedding for all character-based marker
        symbols, which can result in a change in their appearance. The default
        value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToSVG(*gp_fixargs((out_svg, width, height, resolution, compress_to_svgz, image_quality, embed_fonts, output_as_image, convert_markers), True)))

    @constants.maskargs
    def exportToTGA(self, out_tga, width, height, resolution=96, world_file=False, color_mode='24-BIT_TRUE_COLOR'):
        """MapView.exportToTGA(out_tga, width, height, {resolution}, {world_file},
        {color_mode})


        Exports the MapView to a Truevision Graphics Adapter (TGA) format file.


        out_tga(String):
        A string that represents the path and file name of the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information. The
        default value is False.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        default value is 32-BIT_WITH_ALPHA.

        * 24-BIT_TRUE_COLOR: 24-bit true color

        * 32-BIT_WITH_ALPHA: 32-bit with alpha

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette

        * 8-BIT_GRAYSCALE: 8-bit grayscale
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToTGA(*gp_fixargs((out_tga, width, height, resolution, world_file, color_mode), True)))

    @constants.maskargs
    def exportToTIFF(self, out_tif, width, height, resolution=96, world_file=False, color_mode='24-BIT_TRUE_COLOR', tiff_compression='LZW', geoTIFF_tags=False,
                     jpeg_compression_quality=80, embed_color_profile=True):
        """MapView.exportToTIFF(out_tif, width, height, {resolution}, {world_file},
        {color_mode}, {tiff_compression}, {geoTIFF_tags},
        {jpeg_compression_quality}, {embed_color_profile})


        Exports the MapView to a Tagged Image File Format (TIFF) file.


        out_tif(String):
        A string that represents the path and file name of the output export
        file.


        width(Integer):
        A number that defines the width of the export in pixels.


        height(Integer):
        A number that defines the height of the export in pixels.


        resolution{Integer}:
        A number that defines the resolution of the export file in dots per inch
        (dpi). The default value is 96.


        world_file{Boolean}:
        If set to True, a georeferenced world file is created. The file contains
        pixel scale information and real-world coordinate information.  If you
        export a 3D map frame, this parameter will be ignored regardless of the
        setting, because world files are not applicable to 3D views. The default
        value is False.


        color_mode{String}:
        This value specifies the number of bits used to describe color. The
        available options are dependent on the specified Color Model set in the
        layout's Color Management properties. The default value is
        24-BIT_TRUE_COLOR.

        * 24-BIT_TRUE_COLOR: 24-bit true color. Available only to RGB.

        * 32-BIT_CMYK_TRUE_COLOR: 32-bit CMYK true color. Available only to
        CMYK.

        * 32-BIT_WITH_ALPHA: 32-bit with alpha. Available only to RGB.

        * 40-BIT_CMYK_WITH_ALPHA: 40-bit CMYK with alpha. Available only to
        CMYK.

        * 8-BIT_ADAPTIVE_PALETTE: 8-bit adaptive palette. Available to RGB and
        CMYK.

        * 8-BIT_GRAYSCALE: 8-bit grayscale. Available to RGB and CMYK.


        tiff_compression{String}:
        This value represents a compression scheme. The default value is LZW.

        * DEFLATE: A lossless data compression.

        * JPEG: JPEG compression.

        * LZW: Lempel-Ziv-Welch, a lossless data compression.

        * NONE: Compression is not applied.

        * PACK_BITS: Pack bits compression.


        geoTIFF_tags{Boolean}:
        If set to True, georeferencing tags are included in the structure of the
        TIFF export file. The tags contain pixel scale information and real-
        world coordinate information. These tags can be read by applications
        that support the GeoTIFF format. The default value is False.


        jpeg_compression_quality{Integer}:
        This value (0–100) controls the amount of compression applied to the
        output image. With a JPEG image, quality is adversely affected the more
        compression is applied. A higher quality (highest = 100) setting will
        produce sharper images and larger file sizes. A lower quality setting
        will produce more image artifacts and smaller files. The default value
        is 80.


        embed_color_profile{Boolean}:
        If set to True, color profile information is embedded in the image's
        metadata. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.exportToTIFF(*gp_fixargs((out_tif, width, height, resolution, world_file, color_mode, tiff_compression, geoTIFF_tags,
                                              jpeg_compression_quality, embed_color_profile), True)))

    def getLayerExtent(self, layer, selection_only=True, symbolized_extent=True):
        """MapView.getLayerExtent(layer, {selection_only}, {symbolized_extent})


        Returns a layer's extent for all features or only the selected features
        in a layer.


        layer(Layer):
        A reference to a Layer object.


        selection_only{Boolean}:
        If True, it returns the extent for selected features; if False, it
        returns the extent for all features. The default value is True.


        symbolized_extent{Boolean}:
        A value of True will return the layer's symbolized extent; otherwise, it
        will return the geometric extent.  The symbolized extent takes into
        account the area the symbology covers so that it does not get cut off by
        the data frame's boundary. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.getLayerExtent(*gp_fixargs((layer, selection_only, symbolized_extent), True)))

    def panToExtent(self, extent):
        """MapView.panToExtent(extent)


        Pans and centers the MapView using a new Extent object without changing
        the map view's scale.


        extent(Extent):
        A geoprocessing Extent object.
        """
        return convertArcObjectToPythonObject(self._arc_object.panToExtent(*gp_fixargs((extent,), True)))

    def zoomToAllLayers(self, selection_only=True, symbolized_extent=True):
        """MapView.zoomToAllLayers({selection_only}, {symbolized_extent})


        Modifies the MapView view to match the extent of all layers or selected
        layers in a map.


        selection_only{Boolean}:
        If True, it sets the extent based on the selected  features; if False,
        it sets the extent for all  features in a map. The default value is
        True.


        symbolized_extent{Boolean}:
        A value of True will return the layer's symbolized extent; otherwise, it
        will return the geometric extent.  The symbolized extent takes into
        account the area the symbology covers so that it does not get cut off by
        the map frame's boundary. The default value is True.
        """
        return convertArcObjectToPythonObject(self._arc_object.zoomToAllLayers(*gp_fixargs((selection_only, symbolized_extent), True)))

    def zoomToBookmark(self, bookmark):
        """MapView.zoomToBookmark(bookmark)


        Modifies the MapView view to match the view information stored with a
        spatial bookmark.


        bookmark(Bookmark):
        A reference to a Bookmark object.
        """
        return convertArcObjectToPythonObject(self._arc_object.zoomToBookmark(*gp_fixargs((bookmark,), True)))

class MapSeriesExportOptions(_ObjectWithoutInitCall):
    customPages = passthrough_attr('customPages')
    exportFileOptions = passthrough_attr('exportFileOptions')
    exportPages = passthrough_attr('exportPages')
    showExportCount = passthrough_attr('showExportCount')

    @constants.maskargs
    def setExportFileOptions(self, export_file_options):
        """MapSeriesExportOptions.setExportFileOptions(export_file_options)


        A string constant that represents how the pages will be exported.


        export_file_options(String):


        * PDF_MULTIPLE_FILES_PAGE_NAME: Export  each map series page to an
        individual file and append the page name to the file name.  For example,
        Output.PDF will become Output_LakeErie.PDF.

        * PDF_MULTIPLE_FILES_PAGE_NUMBER: Export  each map series page to an
        individual file and append the page number to the file name. For
        example, Output.PDF will become Output_1.PDF.

        * PDF_SINGLE_FILE: Export  all pages into a multipage, single file
        document.
        """
        return convertArcObjectToPythonObject(self._arc_object.setExportFileOptions(*gp_fixargs((export_file_options,), True)))

    @constants.maskargs
    def setExportPages(self, export_pages):
        """MapSeriesExportOptions.setExportPages(export_pages)


        A string constant that represents the collection of map series pages to
        be exported.


        export_pages(String):


        * ALL: Export all pages in the map series.

        * CURRENT: Export the currently active page. This option only applies
        when running a script inside the application.

        * CUSTOM: Export a custom set of pages that is defined using the
        customPages property.

        * SELECTED_INDEX_FEATURES: Only export map series pages that correspond
        to the selected index features associated with the map series.
        """
        return convertArcObjectToPythonObject(self._arc_object.setExportPages(*gp_fixargs((export_pages,), True)))

    def __init__(self):
        """MapSeriesExportOptions()


        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.MapSeriesExportOptions(*gp_fixargs((), True))

class PDFFormat(_ObjectWithoutInitCall):
    """PDFFormat(pdf_path)


    TBD.


    pdf_path(String):
    TBD.
    """
    clipToElements = passthrough_attr('clipToElements')
    compressVectorGraphics = passthrough_attr('compressVectorGraphics')
    convertMarkers = passthrough_attr('convertMarkers')
    embedColorProfile = passthrough_attr('embedColorProfile')
    embedFonts = passthrough_attr('embedFonts')
    filePath = passthrough_attr('filePath')
    georefInfo = passthrough_attr('georefInfo')
    height = passthrough_attr('height')
    imageCompression = passthrough_attr('imageCompression')
    imageCompressionQuality = passthrough_attr('imageCompressionQuality')
    imageQuality = passthrough_attr('imageQuality')
    includeAccessibilityTags = passthrough_attr('includeAccessibilityTags')
    includeNonVisibleMapLayers = passthrough_attr('includeNonVisibleMapLayers')
    layersAndAttributes = passthrough_attr('layersAndAttributes')
    outputAsImage = passthrough_attr('outputAsImage')
    removeLayoutBackground = passthrough_attr('removeLayoutBackground')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    simulateOverprint = passthrough_attr('simulateOverprint')
    width = passthrough_attr('width')

    @constants.maskargs
    def setImageCompression(self, image_compression):
        """PDFFormat.setImageCompression(image_compression)


        A string constant that represents the compression scheme used to
        compress image or raster data in the output file.


        image_compression(String):
        Below is a list of valid strings.

        * ADAPTIVE: JPEG and Deflate compression are combined, depending on the
        contents of the stream. This works well for most cases.

        * DEFLATE: Lossless compression method that works well for most cases.

        * JPEG: Lossy compression method that works well for photographic-type
        images.

        * JPEG2000: Higher-quality compression with file sizes
        smaller than JPEG . This compression is lossless if imageQuality is set
        to 100.

        * LZW: Lempel-Ziv-Welch,  a lossless compression method using a code
        table.

        * NONE: Compression is not applied.

        * RLE: Run-length encoded compression, a lossless compression method
        that works well if there are large areas of the same color.
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageCompression(*gp_fixargs((image_compression,), True)))

    @constants.maskargs
    def setImageQuality(self, image_quality):
        """PDFFormat.setImageQuality(image_quality)


        A string constant that sets the amount of image resampling.


        image_quality(String):
        Below is a list of valid strings.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageQuality(*gp_fixargs((image_quality,), True)))

    @constants.maskargs
    def setLayersAndAttributes(self, layers_attributes):
        """PDFFormat.setLayersAndAttributes(layers_attributes)


        A string constant that specifies whether the PDF layer and PDF object
        data (attributes) will be included in the export file.


        layers_attributes(String):
        Below is a list of valid strings.

        * LAYERS_AND_ATTRIBUTES: Export PDF layers only

        * LAYERS_ONLY: Export PDF layers and feature attributes

        * NONE: Do not export any PDF information
        """
        return convertArcObjectToPythonObject(self._arc_object.setLayersAndAttributes(*gp_fixargs((layers_attributes,), True)))

    def __init__(self, pdf_path):
        """PDFFormat(pdf_path)


        TBD.


        pdf_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.PDFFormat(*gp_fixargs((pdf_path,), True))

class PNGFormat(_ObjectWithoutInitCall):
    """PNGFormat(png_path)


    TBD.


    png_path(String):
    TBD.
    """
    clipToElements = passthrough_attr('clipToElements')
    colorMode = passthrough_attr('colorMode')
    filePath = passthrough_attr('filePath')
    georeferenceMapFrame = passthrough_attr('georeferenceMapFrame')
    height = passthrough_attr('height')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    threshold = passthrough_attr('threshold')
    transparentBackground = passthrough_attr('transparentBackground')
    width = passthrough_attr('width')
    worldFile = passthrough_attr('worldFile')

    @constants.maskargs
    def setColorMode(self, png_color_mode):
        """PNGFormat.setColorMode(color_mode)


        A string constant that represents the number of bits to describe color
        in a pixel.


        color_mode(String):
        Below is a list of valid strings.

        * 1-BIT_MONOCHROME_THRESHOLD: 2 possible colors, black and white. The
        areas
        which are white and black are determined by the threshold value.

        * 24-BIT_TRUE_COLOR: 16,777,216 possible colors. This option is good for
        maximum color fidelity.

        * 32-BIT_WITH_ALPHA: 16,777,216 possible colors and an alpha
        (transparency) channel of 255 values. This option is useful for maps or
        layouts with transparency.

        * 8-BIT_ADAPTIVE_PALETTE: Uses 256 of the most commonly-used pixel
        colors in the image’s palette, thereby minimizing the number of pixels
        whose color may change during output.

        * 8-BIT_GRAYSCALE: 256 shades of gray. All colors are converted to
        grayscale.
        """
        return convertArcObjectToPythonObject(self._arc_object.setColorMode(*gp_fixargs((png_color_mode,), True)))

    def __init__(self, png_path):
        """PNGFormat(png_path)


        TBD.


        png_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.PNGFormat(*gp_fixargs((png_path,), True))

class PictureElement(_ObjectWithoutInitCall):
    """Provides access to picture properties that enable the repositioning of a
       picture on the page layout as well as getting and setting its data
       source."""
    anchor = passthrough_attr('anchor')
    elementHeight = passthrough_attr('elementHeight')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementRotation = passthrough_attr('elementRotation')
    elementWidth = passthrough_attr('elementWidth')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    sourceImage = passthrough_attr('sourceImage')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    @constants.maskargs
    def getDefinition(self, cim_version):
        """PictureElement.getDefinition(cim_version)


        Returns a picture element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def setAnchor(self, anchor):
        """PictureElement.setAnchor(anchor)


        The setAnchor method controls the anchor position for a PictureElement.


        anchor(String):
        A string that specifies the location of the anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """PictureElement.setDefinition(definition_object)


        Sets a picture element's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

class Report(_ObjectWithoutInitCall):
    """The Report object references a report in an ArcGIS Pro
       project ( .aprx ).  It provides access to common properties like dataReference,
       definitionQuery, and the export method."""
    definitionQuery = passthrough_attr('definitionQuery')
    metadata = passthrough_attr('metadata')
    name = passthrough_attr('name')
    pageInfo = passthrough_attr('pageInfo')
    referenceDataSource = passthrough_attr('referenceDataSource')

    def export(self, export_format, report_export_options=None):
        """Report.export(export_format, {report_export_options})


        The export method exports a Report using a specified export format and
        optionally different report_export_options.


        export_format(Object):
        The supported export format object is PDFFormat.


        report_export_options{Object}:
        The ReportExportOptions object that includes changes to default property
        values.
        """
        return convertArcObjectToPythonObject(self._arc_object.export(*gp_fixargs((export_format, report_export_options,), True)))

    def exportToPDF(self, out_pdf, page_range_type='ALL', page_range='', starting_page_number=1, total_page_number=None, resolution=96, image_quality='BEST', compress_vector_graphics=True, image_compression='ADAPTIVE', embed_fonts=True, jpeg_compression_quality=80):
        """Report.exportToPDF(out_pdf, {page_range_type}, {page_range},
        {starting_page_number}, {total_page_number}, {resolution},
        {image_quality}, {compress_vector_graphics}, {image_compression},
        {embed_fonts}, {jpeg_compression_quality})


        Exports a report to a Portable Document Format (PDF) file.


        out_pdf(String):
        A string that represents the path and file name of the output export
        file.


        page_range_type{String}:
        A string that defines the type of page range to export. The default is
        ALL. The default value is ALL.

        * ALL: Export all pages of the report.

        * EVEN: Export the even numbered pages of the report.

        * LAST: Export the last page of the report.

        * ODD: Export the odd numbered pages of the report.

        * RANGE: Export the pages listed in the page_range parameter .


        page_range{String}:
        A string that identifies the pages to be exported if the RANGE option in
        the page_range_type parameter is used (for example, 1, 3, 5-12).   If
        any other page_range_type value is used, the page_range value will be
        ignored.


        starting_page_number{Integer}:
        Applies an offset to the page numbering to add additional pages to the
        beginning of the report.  The default offset is 1. The default value is
        1.


        total_page_number{Integer}:
        The total number of pages to label, for example, when your report
        displays X of Y pages.  This is useful when you want to combine multiple
        reports into one.  The default is -1, which means there is no override.
        The default value is None.


        resolution{Integer}:
        An integer that defines the resolution of the export file in dots per
        inch (dpi). The default value is 96.


        image_quality{String}:
        A string that defines output image quality. The default value is BEST.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3


        compress_vector_graphics{Boolean}:
        A Boolean that controls compression of vector and text portions of the
        output file. Image compression is defined separately. The default value
        is True.


        image_compression{String}:
        A string that defines the compression scheme used to compress image or
        raster data in the output file. The default value is ADAPTIVE.

        * ADAPTIVE: Automatically selects the best compression type for each
        image on the page.   JPEG will be used for large images with many unique
        colors.  DEFLATE will be used for all other images.

        * DEFLATE: A lossless data compression

        * JPEG: A lossy data compression.

        * LZW: Lempel-Ziv-Welch, a lossless data compression

        * NONE: Compression is not applied

        * RLE: Run-length encoded compression


        embed_fonts{Boolean}:
        A Boolean that controls the embedding of fonts in an export file. Font
        embedding allows text and character markers to be displayed correctly
        when the document is viewed on a computer that does not have the
        necessary fonts installed. The default value is True.


        jpeg_compression_quality{Integer}:
        A number that controls compression quality value when image_compression
        is set to ADAPTIVE or JPEG. The valid range is 1 through 100.    A
        jpeg_compression_quality of 100 provides the best quality images but
        creates large export files.   The recommended range is 70 through 90.
        The default value is 80.
        """

        @constants.maskargs
        def maskArgsWrapper(out_pdf, report_page_range_type, page_range, starting_page_number,
                            total_page_number, resolution, image_quality, compress_vector_graphics,
                            image_compression, embed_fonts, jpeg_compression_quality):
            """Use this method to convert externally exposed page_range_type kwargs to the interal masked arg report_page_range_type"""
            return convertArcObjectToPythonObject(self._arc_object.exportToPDF(*gp_fixargs((out_pdf, report_page_range_type, page_range,
                                                                                            starting_page_number, total_page_number, resolution,
                                                                                            image_quality, compress_vector_graphics, image_compression,
                                                                                            embed_fonts, jpeg_compression_quality), True)))

        try:
            return maskArgsWrapper(out_pdf, page_range_type, page_range,
                                     starting_page_number, total_page_number,
                                     resolution, image_quality, compress_vector_graphics,
                                     image_compression, embed_fonts, jpeg_compression_quality)
        except ValueError as e:
            message = str(e)
            if 'report_page_range_type' in message:
                cleanErr = ValueError(message.replace('report_page_range_type', 'page_range_type'))
                raise cleanErr from cleanErr
            else:
                raise e

    @constants.maskargs
    def getDefinition(self, cim_version):
        """Report.getDefinition(cim_version)


        Gets a report's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    def listSections(self, wildcard=None):
        """Report.listSections({wildcard})


        Returns a Python list of ReportSection and ReportLayoutSection objects
        in a report.


        wildcard{String}:
        A wildcard is based on the section name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to help
        limit the resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listSections(*gp_fixargs((wildcard,), True)))

    def openView(self):
        """Report.openView()


        Opens and activates a new report view pane in the application.
        """
        return convertArcObjectToPythonObject(self._arc_object.openView(*gp_fixargs((), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """Report.setDefinition(definition_object)


        Sets a report's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    def setReferenceDataSource(self, data_source):
        """Report.setReferenceDataSource(data_source)


        Sets a report's reference data source.


        data_source(Object):
        The data reference that powers the report.  This parameter can be a
        Layer object, a Table object, or a string that represents the path to an
        external data source. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.setReferenceDataSource(*gp_fixargs((data_source,), True)))

    def updatePageInfo(self, page_info):
        """Report.updatePageInfo(pageInfo)


        Updates the report page information.


        pageInfo(Dictionary):
        The keys for the dictionary are defined as follows:

        * height: The report's height in page units.

        * margins: The report's margins keyword. The supported margin values are
        NORMAL, MODERATE, WIDE, and NARROW.

        * units: The report's page unit keyword. The supported values are inch,
        point, centimeter, and millimeter.

        * width: The report's width in page units.
        """
        return convertArcObjectToPythonObject(self._arc_object.updatePageInfo(*gp_fixargs((page_info,), True)))

class ReportLayoutSection(_ObjectWithoutInitCall):
    """The ReportLayoutSection object references a reportLayoutSection in a Report.
       It provides access to common properties like name and visibility."""
    name = passthrough_attr('name')
    type = passthrough_attr('type')
    URI = passthrough_attr('URI')
    visible = passthrough_attr('visible')

class ReportExportOptions(_ObjectWithoutInitCall):
    customPages = passthrough_attr('customPages')
    exportPages = passthrough_attr('exportPages')
    startingPageNumberLabelOffset = passthrough_attr('startingPageNumberLabelOffset')
    totalPageNumberOverride = passthrough_attr('totalPageNumberOverride')

    @constants.maskargs
    def setExportPages(self, report_export_pages):
        """ReportExportOptions.setExportPages(export_pages)


        A string constant that represents the collection of Report  pages to
        export.


        export_pages(String):


        * ALL: Export all pages in the report.

        * CUSTOM: Export a custom set of pages that is defined using the
        customPages property.

        * EVEN: Export the even numbered pages of the report.

        * LAST: Export the last page of the report.

        * ODD: Export the odd numbered pages of the report.
        """
        return convertArcObjectToPythonObject(self._arc_object.setExportPages(*gp_fixargs((report_export_pages,), True)))

    def __init__(self):
        """ReportExportOptions()


        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.ReportExportOptions(*gp_fixargs((), True))

class ReportSection(_ObjectWithoutInitCall):
    """The ReportSection object references a reportSection in a Report.
       It provides access to common properties like dataReference and
       definitionQuery."""
    definitionQuery = passthrough_attr('definitionQuery')
    fields = passthrough_attr('fields')
    name = passthrough_attr('name')
    referenceDataSource = passthrough_attr('referenceDataSource')
    statistics = passthrough_attr('statistics')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    def setReferenceDataSource(self, data_source):
        """ReportSection.setReferenceDataSource(data_source)


        Sets a report section's reference data source.


        data_source(Object):
        The data reference for the report section.  This parameter can be a
        Layer object, a Table object, or a string that represents the path to an
        external data source. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.setReferenceDataSource(*gp_fixargs((data_source,), True)))

    def setRelatedReportSource(self, related_report_data_source, related_report_section_name, relate_or_relationship_class_name):
        """ReportSection.setRelatedReportSource(related_report_data_source,
        related_report_section_name, relate_or_relationship_class_name)


        Sets a related report's data source.


        related_report_data_source(Object):
        The data source for the new related report.  This parameter can be a
        Layer object, a Table object, or a string that represents the path to an
        external data source. The default value is None.


        related_report_section_name(String):
        The name of the related report. The default value is None.


        relate_or_relationship_class_name(String):
        The name of the new relate or relationship class. The default value is
        None.
        """
        return convertArcObjectToPythonObject(self._arc_object.setRelatedReportSource(*gp_fixargs((related_report_data_source, related_report_section_name, relate_or_relationship_class_name), True)))

class StyleItem(_ObjectWithoutInitCall):
    """StyleItem provides access to style item level information in a Project."""
    category = passthrough_attr('category')
    name = passthrough_attr('name')
    style = passthrough_attr('style')
    styleClass = passthrough_attr('styleClass')
    tags = passthrough_attr('tags')


class SVGFormat(_ObjectWithoutInitCall):
    """SVGFormat(aix_path)


    TBD.


    svg_path(String):
    TBD."""
    clipToElements = passthrough_attr('clipToElements')
    compressToSVGZ = passthrough_attr('compressToSVGZ')
    convertMarkers = passthrough_attr('convertMarkers')
    embedFonts = passthrough_attr('embedFonts')
    filePath = passthrough_attr('filePath')
    height = passthrough_attr('height')
    imageQuality = passthrough_attr('imageQuality')
    includeNonVisibleMapLayers = passthrough_attr('includeNonVisibleMapLayers')
    outputAsImage = passthrough_attr('outputAsImage')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    width = passthrough_attr('width')

    @constants.maskargs
    def setImageQuality(self, image_quality):
        """SVGFormat.setImageQuality(image_quality)


        A string constant that sets the amount of image resampling.


        image_quality(String):
        Below is a list of valid strings.

        * BEST: An output image quality resample ratio of 1

        * BETTER: An output image quality resample ratio of 2

        * FASTER: An output image quality resample ratio of 4

        * FASTEST: An output image quality resample ratio of 5

        * NORMAL: An output image quality resample ratio of 3
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageQuality(*gp_fixargs((image_quality,), True)))

    def __init__(self, svg_path):
        """SVGFormat(svg_path)


        TBD.


        svg_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.SVGFormat(*gp_fixargs((svg_path,), True))

class Table(_ObjectWithoutInitCall):
    """Table(table_data_source)


    Enables you to reference a table in a workspace so that it can be added
    to a Map .


    table_data_source(String):
    A string that includes the full workspace path, including the name of the
    table.  For SDE tables, the workspace path is the path to an SDE
    connection file.
    """
    connectionProperties = passthrough_attr('connectionProperties', True)
    dataSource = passthrough_attr('dataSource', True)
    definitionQuery = passthrough_attr('definitionQuery')
    isBroken = passthrough_attr('isBroken')
    isTimeEnabled = passthrough_attr('isTimeEnabled')
    longName = passthrough_attr('longName')
    metadata = passthrough_attr('metadata')
    name = passthrough_attr('name')
    time = passthrough_attr('time')
    URI = passthrough_attr('URI')

    def disableTime(self):
        """Table.disableTime()


        Disables time enabled properties on a Table object.
        """
        return convertArcObjectToPythonObject(self._arc_object.disableTime(*gp_fixargs((), True)))

    def enableTime(self, startTimeField=None, endTimeField=None, autoCalculateTimeRange=True, timeDimension=None):
        """Table.enableTime({startTimeField}, {endTimeField},
        {autoCalculateTimeRange}, {timeDimension})


        Enables time on a table if it has time information.


        startTimeField{String}:
        The name of the field containing the start time values. If each row has
        a single time field, specify that field name in the startTimeField and
        leave endTimeField blank. If each row has a start and end time field,
        specify both the  startTimeField and endTimeField. The default value is
        None.


        endTimeField{String}:
        The name of the field containing the end time values. Not all tables use
        an end time field. If each row has a single time field, specify that
        field name in the startTimeField and leave endTimeField blank. If each
        row has a start and end time field, specify both the  startTimeField and
        endTimeField. The default value is None.


        autoCalculateTimeRange{Boolean}:
        If  set to True, the start and end time attribute information is used to
        calculate the table's time extent. The default value is True.


        timeDimension{String}:
        The name of the dimension containing time values when using netCDF data.
        The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.enableTime(*gp_fixargs((startTimeField, endTimeField, autoCalculateTimeRange, timeDimension), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """Table.getDefinition(cim_version)


        Gets a table's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version), True)))))

    def getSelectionSet(self):
        """Table.getSelectionSet()


        Returns a table's selection as a Python set of Object IDs.
        """
        return convertArcObjectToPythonObject(self._arc_object.getSelectionSet(*gp_fixargs((), True)))

    def listDefinitionQueries(self, wildcard=None):
        """Table.listDefinitionQueries({wildcard})


        Returns a Python list of definition queries associated with a table.


        wildcard{String}:
        A wildcard is based on the query name and is not case sensitive.  A
        combination of asterisks (*) and characters can be used to limit the
        resulting list. The default value is None.
        """
        return convertArcObjectToPythonObject(self._arc_object.listDefinitionQueries(*gp_fixargs((wildcard,), True)))

    def openTableView(self, show_selected=False):
        """Table.openTableView({show_selected})


        TBD.

        show_selected{Boolean}:
        TBD.
        """
        return convertArcObjectToPythonObject(self._arc_object.openTableView(*gp_fixargs((show_selected,), True)))

    @constants.maskargs
    def pasteProperties(self, source_table, table_paste_properties='ALL'):
        """Table.pasteProperties(source_table, {table_paste_properties})


        The pasteProperties method pastes properties from a table to another
        table.


        source_table(Table):
        A table or feature layer with the properties that will be pasted.


        table_paste_properties{String}:
        A single string or a list of strings that specify  the property or
        properties that will be pasted. For example,
        table_paste_properties="SYMBOLGY" will paste only symbology properties,
        whereas  table_paste_properties=["CHARTS", "FIELD_PROPERTIES",
        "POPUPS"]) will paste multiple properties. The default value is ALL.

        * ALL: All applicable properties will be pasted.

        * CHARTS: Only chart properties will be pasted.

        * DEFINITION_QUERIES: Only definition query properties will be pasted.

        * DISPLAY_EXPRESSION: Only display expression properties will be pasted.

        * FIELD_PROPERTIES: Only field properties will be pasted.

        * POPUPS: Only pop-up configuration properties will be pasted.
        """
        table_paste_properties = table_paste_properties.split(",")
        return convertArcObjectToPythonObject(self._arc_object.pasteProperties(*gp_fixargs((source_table, table_paste_properties), True)))

    def saveACopy(self, file_name):
        """Table.saveACopy(file_name)


        Saves a table to a layer file (.lyrx).


        file_name(String):
        A string that includes the location and name of the output layer file
        (.lyrx).
        """
        return convertArcObjectToPythonObject(self._arc_object.saveACopy(*gp_fixargs((file_name,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """Table.setDefinition(definition_object)


        Sets a table's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    @constants.maskargs
    def setSelectionSet(self, oidList=None, method='NEW'):
        """Table.setSelectionSet({oidList}, {method})


        Sets a table's selection using a Python list of Object IDs.


        oidList{List}:
        A Python list of Object IDs to use along with the appropriate selection
        method. The default value is None.


        method{String}:
        A string that specifies which selection method to use. The default value
        is NEW.

        * DIFFERENCE: Selects the records that are not in the current selection
        but are in the oidList.

        * INTERSECT: Selects the records that are in the current selection and
        the oidList.

        * NEW: Creates a new record selection from the oidList.

        * SYMDIFFERENCE: Selects the records that are in the current selection
        or the oidList but not both.

        * UNION: Selects all the records in both the current selection and those
        in the oidList.
        """
        return convertArcObjectToPythonObject(self._arc_object.setSelectionSet(*gp_fixargs((oidList, method), True)))

    def updateConnectionProperties(self, current_connection_info, new_connection_info, auto_update_joins_and_relates=True, validate=True, ignore_case=False):
        """Table.updateConnectionProperties(current_connection_info,
        new_connection_info, {auto_update_joins_and_relates}, {validate},
        {ignore_case})


        The updateConnectionProperties method replaces connection properties
        using a dictionary or a path to a workspace.


        current_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties to the source you want to update. If an
        empty string or None is used in current_connection_info, all connection
        properties will be replaced with the new_workspace_info, depending on
        the value of the validate parameter.


        new_connection_info(String):
        A string that represents the workspace path or a Python dictionary that
        contains connection properties with the new source information.


        auto_update_joins_and_relates{Boolean}:
        If  set to True, the updateConnectionProperties method will also update
        the connections for associated joins or relates. The default value is
        True.


        validate{Boolean}:
        If  set to True, the connection properties will only be updated if the
        new_connection_info value is a valid connection.  If it is not valid,
        the connection will not be replaced.   If set to False, the method will
        set all connections to match the new_connection_info value, regardless
        of a valid match.  In this case, if a match does not exist, the data
        sources would be broken. The default value is True.


        ignore_case{Boolean}:
        Determines whether searches will be case sensitive. By default, queries
        are case sensitive. To perform queries that are not case sensitive, set
        ignore_case to True. The default value is False.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateConnectionProperties(*gp_fixargs((current_connection_info, new_connection_info, auto_update_joins_and_relates, validate, ignore_case), True)))

    def updateDefinitionQueries(self, definitionQueries):
        """Table.updateDefinitionQueries(definitionQueries)


        Updates a table's collection of definition queries.


        definitionQueries(List):
        Updates a list of dictionaries that represent the properties of each
        definition query for a table.
        """
        return convertArcObjectToPythonObject(self._arc_object.updateDefinitionQueries(*gp_fixargs((definitionQueries,), True)))

    def __init__(self, table_data_source):
        """Table(table_data_source)


        Enables you to reference a table in a workspace so that it can be added to a Map .


        table_data_source(String):
        A string that includes the full workspace path, including the name of the table.
        For SDE tables, the workspace path is the path to an SDE connection file.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.Table(*gp_fixargs((table_data_source,), True))

    def __str__(self):
        return self.name

    def __eq__(self, other):
        if type(self)!= type(other):
            return False
        else:
            return convertArcObjectToPythonObject(self._arc_object.isTableSame(*gp_fixargs((other,), True)))

class TableFrameElement(_ObjectWithoutInitCall):
    """Provides access to tableFrame properties that enable the repositioning of a
       tableFrames on the page layout as well as getting and setting its data
       source."""
    anchor = passthrough_attr('anchor')
    elementHeight = passthrough_attr('elementHeight')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementWidth = passthrough_attr('elementWidth')
    fields = passthrough_attr('fields')
    table = passthrough_attr('table')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    mapFrame = passthrough_attr('mapFrame')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    query = passthrough_attr('query')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    def applyStyleItem(self, style_item):
        """TableFrameElement.applyStyleItem(style_item)


        Applies a StyleItem to a TableFrameElement.


        style_item(StyleItem):
        A reference to a StyleItem in a project.
        """
        return convertArcObjectToPythonObject(self._arc_object.applyStyleItem(*gp_fixargs((style_item,), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """TableFrameElement.getDefinition(cim_version)


        Returns a table frame element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def setAnchor(self, anchor):
        """TableFrameElement.setAnchor(anchor)


        The setAnchor method controls the anchor position for a
        TableFrameElement value.


        anchor(String):
        A string that specifies the location of the anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """TableFrameElement.setDefinition(definition_object)


        The setDefinition method sets the CIM definition for a table frame
        element.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

    @constants.maskargs
    def setQuery(self, query_rows):
        """TableFrameElement.setQuery(query_rows)


        The setQuery method controls the display of rows in the table frame.


        query_rows(String):
        A keyword string that serves as a filter and specifies the rows that
        will be displayed in the table frame. The default value is ALL_ROWS.

        * ALL_ROWS: All rows in the table will be displayed.

        * MAPSERIES_ROWS: The row associated with the current index feature will
        be displayed if a spatial map series is enabled.

        * VISIBLE_ROWS: Only the visible features in the map frame will be
        displayed.
        """
        return convertArcObjectToPythonObject(self._arc_object.setQuery(*gp_fixargs((query_rows,), True)))

    def sortFields(self, field_info):
        """TableFrameElement.sortFields(field_info)


        The sortFields method sorts a table frame using a list of dictionary
        key-value pairs for one or many fields.


        field_info(List):
        A list of Python dictionaries that each contain field sorting
        information.  The dictionary keys are defined below.

        * ascending: A Boolean value of True will sort in ascending order.  The
        default value is True.

        * caseSensitive: A Boolean value of True will honor case while sorting.
        The default value is True.

        * name: A string that represents the name of the field used to sort.
        """
        return convertArcObjectToPythonObject(self._arc_object.sortFields(*gp_fixargs((field_info,), True)))

class TextElement(_ObjectWithoutInitCall):
    """The TextElement object provides access to properties that enable its
       repositioning on the page layout as well as modifying the text string and
       font size."""
    anchor = passthrough_attr('anchor')
    elementHeight = passthrough_attr('elementHeight')
    elementPositionX = passthrough_attr('elementPositionX')
    elementPositionY = passthrough_attr('elementPositionY')
    elementRotation = passthrough_attr('elementRotation')
    elementWidth = passthrough_attr('elementWidth')
    fontFamilyName = passthrough_attr("fontFamilyName")
    fontStyleName = passthrough_attr("fontStyleName")
    isOverflowing = passthrough_attr('isOverflowing')
    locked = passthrough_attr('locked')
    longName = passthrough_attr('longName')
    name = passthrough_attr('name')
    parentGroupElement = passthrough_attr('parentGroupElement')
    text = passthrough_attr('text')
    textAngle = passthrough_attr('textAngle')
    textSize = passthrough_attr('textSize')
    type = passthrough_attr('type')
    visible = passthrough_attr('visible')

    def applyStyleItem(self, style_item):
        """TextElement.applyStyleItem(style_item)


        Applies a StyleItem to a TextElement.


        style_item(StyleItem):
        A reference to a StyleItem in a project.
        """
        return convertArcObjectToPythonObject(self._arc_object.applyStyleItem(*gp_fixargs((style_item,), True)))

    def clone(self, suffix=None):
        """TextElement.clone({suffix})


        Provides a mechanism to clone an existing  text element on a page
        layout.


        suffix{String}:
        An optional string that is used to tag each newly created text element.
        The new element gets the same element name as the parent text element,
        plus the suffix value, plus a numeric sequencer.  For example, if the
        parent element name is FieldLabel and the suffix value is _copy, the
        newly cloned elements are named  FieldLabel_copy, FieldLabel_copy_1,
        FieldLabel_copy_2, and so on.  If a suffix is not provided, the results
        resemble FieldLabel_1, FieldLabel_2, FieldLabel_3, and so on.
        """
        return convertArcObjectToPythonObject(self._arc_object.clone(*gp_fixargs((suffix,), True)))

    def delete(self):
        """TextElement.delete()


        Provides a mechanism to delete an existing text element on a page
        layout.
        """
        return convertArcObjectToPythonObject(self._arc_object.delete(*gp_fixargs((), True)))

    @constants.maskargs
    def getDefinition(self, cim_version):
        """TextElement.getDefinition(cim_version)


        Returns a text element's CIM definition.


        cim_version(String):
        A string that represents the major version of the CIM that will be used.

        * V2: The 2.x version of the CIM will be used.

        * V3: The 3.x version of the CIM will be used.
        """
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(self._arc_object.GetCimJSONString(*gp_fixargs((cim_version,), True)))))

    @constants.maskargs
    def setAnchor(self, anchor):
        """TextElement.setAnchor(anchor)


        The setAnchor method controls the anchor position.


        anchor(String):
        A string that specifies an anchor position.

        * BOTTOM_LEFT_CORNER: The anchor will be set at the bottom left corner
        position.

        * BOTTOM_MID_POINT: The anchor will be set at the bottom center
        position.

        * BOTTOM_RIGHT_CORNER: The anchor will be set at the bottom right corner
        position.

        * CENTER_POINT: The anchor will be set at the center position.

        * LEFT_MID_POINT: The anchor will be set at the left center position.

        * RIGHT_MID_POINT: The anchor will be set at the right center position.

        * TOP_LEFT_CORNER: The anchor will be set at the top left corner
        position.

        * TOP_MID_POINT: The anchor will be set at the top center position.

        * TOP_RIGHT_CORNER: The anchor will be set at the top right corner
        position.
        """
        return convertArcObjectToPythonObject(self._arc_object.setAnchor(*gp_fixargs((anchor,), True)))

    @constants.maskargs
    def setDefinition(self, definition_object):
        """TextElement.setDefinition(definition_object)


        Sets a text element's CIM definition.


        definition_object(Object):
        A modified CIM definition object originally retrieved using
        getDefinition.
        """
        from .cim.cimloader import  CimJsonEncoder
        import json
        json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        return convertArcObjectToPythonObject(self._arc_object.SetCimJSONString(json_data))

class TGAFormat(_ObjectWithoutInitCall):
    """TGAFormat(tga_path)


    TBD.


    tga_path(String):
    TBD.
    """
    clipToElements = passthrough_attr('clipToElements')
    colorMode = passthrough_attr('colorMode')
    filePath = passthrough_attr('filePath')
    height = passthrough_attr('height')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    transparentBackground = passthrough_attr('transparentBackground')
    width = passthrough_attr('width')

    @constants.maskargs
    def setColorMode(self, tga_color_mode):
        """TGAFormat.setColorMode(color_mode)


        A string constant that represents the number of bits to describe color
        in a pixel.


        color_mode(String):
        Below is a list of valid strings.

        * 24-BIT_TRUE_COLOR: 16,777,216 possible colors. This option is good for
        maximum color fidelity.

        * 32-BIT_WITH_ALPHA: 16,777,216 possible colors and an alpha
        (transparency) channel of 255 values. This option is useful for maps or
        layouts with transparency.

        * 8-BIT_ADAPTIVE_PALETTE: Uses 256 of the most commonly-used pixel
        colors in the image’s palette, thereby minimizing the number of pixels
        whose color may change during output.

        * 8-BIT_GRAYSCALE: Uses 256 of the most commonly-used pixel colors in
        the image’s palette, thereby minimizing the number of pixels whose color
        may change during output.
        """
        return convertArcObjectToPythonObject(self._arc_object.setColorMode(*gp_fixargs((tga_color_mode,), True)))

    def __init__(self, tga_path):
        """TGAFormat(tga_path)


        TBD.


        tga_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.TGAFormat(*gp_fixargs((tga_path,), True))

class TIFFFormat(_ObjectWithoutInitCall):
    """TIFFFormat(tiff_path)


    TBD.


    tiff_path(String):
    TBD.
    """
    clipToElements = passthrough_attr('clipToElements')
    colorMode = passthrough_attr('colorMode')
    embedColorProfile = passthrough_attr('embedColorProfile')
    filePath = passthrough_attr('filePath')
    geoTIFFTags = passthrough_attr('geoTIFFTags')
    georeferenceMapFrame = passthrough_attr('georeferenceMapFrame')
    height = passthrough_attr('height')
    imageCompression = passthrough_attr('imageCompression')
    imageCompressionQuality = passthrough_attr('imageCompressionQuality')
    resolution = passthrough_attr('resolution')
    showSelectionSymbology = passthrough_attr('showSelectionSymbology')
    threshold = passthrough_attr('threshold')
    transparentBackground = passthrough_attr('transparentBackground')
    width = passthrough_attr('width')
    worldFile = passthrough_attr('worldFile')

    @constants.maskargs
    def setColorMode(self, color_mode):
        """TIFFFormat.setColorMode(color_mode)


        A string constant that represents the number of bits used to describe
        color.


        color_mode(String):
        Below is a list of valid strings.
        The available colorMode values are dependent on the specified color
        model set in color management properties.

        * 1-BIT_MONOCHROME_THRESHOLD: 2 possible colors, black and white. The
        areas
        which are white and black are determined by the threshold value.

        * 24-BIT_TRUE_COLOR: 16,777,216 possible colors. This option is good for
        maximum color fidelity.

        * 32-BIT_CMYK_TRUE_COLOR: 8 bits per pixel for each channel: cyan,
        magenta, yellow, black.

        * 32-BIT_WITH_ALPHA: 16,777,216 possible colors and an alpha
        (transparency) channel of 255 values. This option is useful for maps or
        layouts with transparency.

        * 40-BIT_CMYK_WITH_ALPHA: 8 bits per pixel for each channel: cyan,
        magenta, yellow, black, plus an additional 8-bit channel for alpha. Use
        this option if maps or layouts have transparency.

        * 8-BIT_ADAPTIVE_PALETTE: Uses 256 of the most commonly-used pixel
        colors in the image’s palette, thereby minimizing the number of pixels
        whose color may change during output.

        * 8-BIT_GRAYSCALE: 256 shades of gray. All colors are converted to
        grayscale.
        """
        return convertArcObjectToPythonObject(self._arc_object.setColorMode(*gp_fixargs((color_mode,), True)))

    @constants.maskargs
    def setImageCompression(self, tiff_compression):
        """TIFFFormat.setImageCompression(image_compression)


        A string constant that represents the compression scheme used to
        compress image or raster data in the output file.


        image_compression(String):
        Below is a list of valid strings.

        * DEFLATE: Lossless compression method that works well for most cases.

        * JPEG: Lossy compression method that works well for photographic-type
        images.

        * LZW: Lossless compression method using a code table.

        * NONE: Compression is not applied.

        * PACK_BITS: Lossless compression method that works well if there are
        large areas of the same color.
        """
        return convertArcObjectToPythonObject(self._arc_object.setImageCompression(*gp_fixargs((tiff_compression,), True)))

    def __init__(self, tiff_path):
        """TIFFFormat(tiff_path)


        TBD.


        tiff_path(String):
        TBD.
        """
        import arcgisscripting
        self._arc_object = arcgisscripting._mapping.TIFFFormat(*gp_fixargs((tiff_path,), True))

# Decorate PDFDocument methods with constants lists for Python window
PDFDocument.updateDocProperties.__esri_toolinfo__ = constants.maskargs(PDFDocument.updateDocProperties).__esri_toolinfo__
PDFDocument.updateDocSecurity.__esri_toolinfo__ = constants.maskargs(PDFDocument.updateDocSecurity).__esri_toolinfo__

ob_conversion = (
    ('MappingAIXFormatObject', AIXFormat),
    ('MappingArcGISProjectObject', ArcGISProject),
    ('MappingBMPFormatObject', BMPFormat),
    ('MappingBookmarkObject', Bookmark),
    ('MappingBookmarkMapSeriesObject', BookmarkMapSeries),
    ('MappingCameraObject', Camera),
    ('MappingClassBreakObject', ClassBreak),
    ('MappingColorMapObject', ColorRamp),
    ('ElevationSource', ElevationSource),
    ('ElevationSurface', ElevationSurface),
    ('MappingEMFFormatObject', EMFFormat),
    ('MappingEPSFormatObject', EPSFormat),
    ('MappingGIFFormatObject', GIFFormat),
    ('MappingGraphicElementObject', GraphicElement),
    ('MappingGroupElementObject', GroupElement),
    ('MappingItemObject', Item),
    ('MappingItemGroupObject', ItemGroup),
    ('MappingJPEGFormatObject', JPEGFormat),
    ('MappingLabelClassObject', LabelClass),
    ('MappingLayerObject', Layer),
    ('MappingLayerFileObject', LayerFile),
    ('MappingLayerTimeObject', LayerTime),
    ('MappingLayoutObject', Layout),
    ('MappingLegendElementObject', LegendElement),
    ('MappingLegendItemObject', LegendItem),
    ('MappingMapObject', Map),
    ('MappingMapFrameObject', MapFrame),
    ('MappingMapSeriesObject', MapSeries),
    ('MappingMapSurroundElementObject', MapSurroundElement),
    ('MappingMapTimeObject', MapTime),
    ('MappingMapViewObject', MapView),
    ('MetadataObject', metadata.Metadata),
    ('MappingMapSeriesExportOptionsObject', MapSeriesExportOptions),
    ('MappingPictureElementObject', PictureElement),
    ('MappingPDFFormatObject', PDFFormat),
    ('MappingPNGFormatObject', PNGFormat),
    ('MappingRasterClassBreakObject', RasterClassBreak),
    ('MappingRasterItemObject', RasterItem),
    ('MappingReportObject', Report),
    ('MappingReportExportOptionsObject', ReportExportOptions),
    ('MappingReportLayoutSectionObject', ReportLayoutSection),
    ('MappingReportSectionObject', ReportSection),
    ('MappingSVGFormatObject', SVGFormat),
    ('MappingSymbolObject', Symbol),
    ('MappingSymbologyObject', Symbology),
    ('MappingTableObject', Table),
    ('MappingTableFrameElementObject', TableFrameElement),
    ('MappingTextElementObject', TextElement),
    ('MappingTIFFFormatObject', TIFFFormat),
    ('MappingTGAFormatObject', TGAFormat)
)
