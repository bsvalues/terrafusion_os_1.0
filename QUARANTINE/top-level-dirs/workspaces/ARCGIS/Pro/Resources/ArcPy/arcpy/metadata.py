from arcpy.arcobjects._base import _ObjectWithoutInitCall
from arcpy.arcobjects._base import passthrough_attr as _passthrough_attr
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject as _convertArcObjectToPythonObject
from arcpy.geoprocessing._base import gp_fixargs as _gp_fixargs
from arcpy.utils import ArgAdaptor as _ArgAdaptor

class _metadata_constants(_ArgAdaptor):
    """Represents the constants that can be passed into various ExportTo* metadata functions"""
    __args__ = {
        # For import options
        'metadata_import_option': {
            'DEFAULT': 0,             # Use this option if you are importing metadata from a stand-alone metadata XML file and you are unsure what XML format it uses. The document’s format will be checked, and the correct conversion will be performed to transform its content to the ArcGIS metadata XML format.
            'ARCGIS_METADATA': 1,     # The metadata format used by ArcGIS
            'FGDC_CSDGM': 2,          # The stand-alone metadata XML file has content stored in the FGDC CSDGM XML format.
            'ISO19139_GML32': 3,      # The stand-alone metadata XML file has content stored in the ISO 19139 XML format, and must have the GML namespace appropriate for the 2012 version of the ISO 19139 XML
            'ISO19139': 4,            # The stand-alone metadata XML file has content stored in the ISO 19139 XML format, and must have the GML namespace appropriate for the 2007 version of the ISO 19139 XML Schemas: http://www.opengis.net/gml.
            'ISO19139_UNKNOWN': 5,    # The stand-alone metadata XML file has content stored in the ISO 19139 XML format. Use this option if you are unsure which GML namespace the document uses. The namespace is checked and the correct conversion will be performed to transform the document’s content to the ArcGIS metadata XML format.
            'CUSTOM': 6,              # A custom XSLT will be used to convert from another XML format to the ArcGIS metadata XML format.
            'ISO19115_3': 7           # The stand-alone metadata XML file has content stored in the ISO 19115-3 XML format, and must have the mdb namespace appropriate for http://standards.iso.org/iso/19115/-3/mdb/1.0
        },

        # For export options
        'metadata_export_option': {
            'FGDC_CSDGM': 0,         # The exported metadata document will have content stored in the FGDC CSDGM XML format.
            'ISO19139_GML32': 1,     # The exported metadata document will have content stored in the ISO 19139 XML format. The GML namespace used in the output file is appropriate for the 2012 version of the ISO 19139 XML Schemas: http://www.opengis.net/gml/3.2.
            'ISO19139': 2,           # The exported metadata document will have content stored in the ISO 19139 XML format. The GML namespace used in output file is appropriate for the 2007 version of the ISO 19139 XML Schemas: http://www.opengis.net/gml.
            'CUSTOM': 3,             # A custom XSLT will be used to convert metadata content stored in the item from ArcGIS metadata to another XML format.
            'ISO19115_3': 4          # The exported metadata document will have content stored in the ISO 19115-3 XML format. The namespace used in the output file is appropriate for http://standards.iso.org/iso/19115/-3/mdb/1.0
        },

        # For Save As XML options
        'metadata_save_as_xml_option': {
            'EXACT_COPY': 0,                # The metadata content is not filtered before it is exported to a standard metadata format. All content is exported, including any sensitive information that may be present.
            'REMOVE_MACHINE_NAMES': 1,      # The metadata content is filtered to remove machine names from UNC paths, if they are present. The remaining metadata content is exported.
            'REMOVE_ALL_SENSITIVE_INFO': 2, # The metadata content is filtered to remove local file paths, database connection information, URLs that do not begin with http or https, and so on, if this information is present. The remaining metadata content is exported.
            'TEMPLATE': 3                   # The content of the item’s metadata is filtered to remove content describing properties of the item from its metadata, if they are present. The remaining metadata content is then saved to the output file. This file would be suitable to use as the basis for a metadata template.
        },

        # For removal options
        'metadata_removal_option': {
            'EXACT_COPY': 0,                # The metadata content is not filtered before it is exported to a standard metadata format. All content is exported, including any sensitive information that may be present.
            'REMOVE_MACHINE_NAMES': 1,      # The metadata content is filtered to remove machine names from UNC paths, if they are present. The remaining metadata content is exported.
            'REMOVE_ALL_SENSITIVE_INFO': 2  # The metadata content is filtered to remove local file paths, database connection information, URLs that do not begin with http or https, and so on, if this information is present. The remaining metadata content is exported.
        },

        # For upgrade options
        'metadata_upgrade_option': {
            'ESRI_ISO': 0,    # ESRI-ISO format metadata content included in the item’s metadata will be upgraded to the ArcGIS metadata format.
            'FGDC_CSDGM': 1   # FGDC CSDGM-format metadata content included in the item’s metadata will be upgraded to the ArcGIS metadata format.
        },

        # For sycn options
        'metadata_sync_option': {
            'ACCESSED': 0,      # Properties are added to metadata when it is accessed; metadata is created if it doesn't already exist. Syncing will be skipped if the time difference between now and last syncing time is less than the interval.
            'ALWAYS': 1,        # Properties are added to metadata always; metadata is created if it doesn't already exist. Syncing will always happen.
            'CREATED': 2,       # Metadata is created and properties are added to it when metadata doesn't already exist. Syncing will be skipped if metadata exists.
            'NOT_CREATED': 3,   # Properties are added to existing metadata. Syncing will be skipped if metadata doesn't exist.
            'OVERWRITE': 4,     # Same as ALWAYS, except that individual tags are always updated, regardless of the value of the Sync attribute.
            'SELECTIVE': 5      # Same as OVERWRITE, except that certain properties (Name and ContentType as of now) won't be overwrite.
        },

        # For content delete options
        'metadata_delete_content_option': {
            'ENCLOSED_FILES': 0,   # The enclosed files will be deleted.
            'GPHISTORY': 1,        # The GP history will be deleted.
            'THUMBNAIL': 2         # The thumbnail will be deleted.
        },
     }

class Metadata(_ObjectWithoutInitCall):
    """Metadata(uri)

        The Metadata object has properties that provide access to information that provides an overview of the item, as well as the full metadata document. Operations are available to manage the item’s metadata content.

        When a URI is provided, the Metadata object returned will provide access to the metadata for the item identified by the URI. When this object is returned from an item, the Metadata object will represent the item’s metadata. If the item doesn’t support metadata, or if the item doesn’t exist an empty object is created.

        When the Metadata object is empty, you can create or import metadata to the object, then save the content to a new XML file or to another item as its metadata.

          uri{String}:
        An optional URI that identifies an item from which metadata will be imported to the metadata object."""

    uri = _passthrough_attr('uri')                             # Gets and sets the URI that identifies an item
    xml = _passthrough_attr('xml')                             # Gets the item’s metadata XML document as a string. Remarks: Not all items support metadata. Be sure to check for empty string or null as the return value from GetXml.
    isReadOnly = _passthrough_attr('isReadonly', True)         # Gets if you can update metadata for the item identified by the input URI.
    title = _passthrough_attr('title')                         # Gets and sets a descriptive title for the item. Derived from the Title in the item's metadata.
    summary = _passthrough_attr('summary')                     # Gets and sets a summary describing the purpose of the item. Derived from the Summary or Purpose defined in the item's metadata.
    description = _passthrough_attr('description')             # Gets and sets a description of the item. Derived from the Description or Abstract defined in the item's metadata.
    tags = _passthrough_attr('tags')                           # Gets and sets a comma separated string of tags that describe the item. Derived from Tags defined in the item's metadata.
    credits = _passthrough_attr('credits')                     # Gets and sets information that gives credit to the producer or provider of the item. Derived from Credits defined in the item's metadata.
    accessConstraints = _passthrough_attr('accessConstraints') # Gets and sets documented limitations with respect to using the item. Derived from Use Limitations defined in the item's metadata.
    thumbnailUri = _passthrough_attr('thumbnailUri')           # Gets and sets a path to a thumbnail that describes and helps to identify the item. Derived from the Thumbnail that is extracted from the item's metadata.
    minScale = _passthrough_attr('minScale', True)             # Gets the minimum map scale at which the item should draw
    maxScale = _passthrough_attr('maxScale', True)             # Gets the maximum map scale at which the item should draw
    xMin = _passthrough_attr('xMin', True)                     # Gets the minimum value along the x-axis for the item's minimum bounding rectangle
    xMax = _passthrough_attr('xMax', True)                     # Gets the maximum value along the x-axis for the item's minimum bounding rectangle
    yMin = _passthrough_attr('yMin', True)                     # Gets the minimum value along the y-axis for the item's minimum bounding rectangle
    yMax = _passthrough_attr('yMax', True)                     # Gets the maximum value along the y-axis for the item's minimum bounding rectangle

    def __init__(self, uri = ''):
        import arcgisscripting
        self._arc_object = arcgisscripting.metadata.Metadata(uri)

    def copy(self, inputMetadata):
        """Metadata.copy(inputMetadata)

           Copy the metadata content from the input metadata object. Only xml content will be copied.

              inputMetadata(object):
           The metadata object defining the ArcGIS metadata content."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.copy(*_gp_fixargs((self, inputMetadata), True)))

    @_metadata_constants.maskargs
    def importMetadata(self, sourceUri, metadata_import_option = 'DEFAULT', customStylesheetPath = ''):
        """Metadata.importMetadata(sourceUri, metadata_import_option, customStylesheetPath)

           Import content to the metadata object from the item identified by the sourceURI. An item’s metadata must be stored in the ArcGIS metadata XML format. The imported XML file will be converted from the standard metadata XML format, identified by the metadata_export_option, to the ArcGIS metadata format and the resulting content is stored in the metadata object.

              sourceUri(string):
           A URI that identifies an item from which metadata will be imported to the metadata object.
              metadata_import_option{string}:
           This option determines how content is imported to the metadata object from the source item. This value indicates the XML format of metadata stored in the source item. The source item’s content will be converted from the indicated format to the ArcGIS metadata XML format before being saved to the metadata object.
              customStylesheetPath{string}:
           A local or network file path identifying the custom XSLT stylesheet that will be used to import metadata from a custom XML format. The value in this parameter will only be considered if the metadata_export_option is CUSTOM."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.importMetadata(*_gp_fixargs((self, sourceUri, metadata_import_option, customStylesheetPath), True)))

    @_metadata_constants.maskargs
    def exportMetadata(self, outputPath, metadata_export_option = 'ISO19139', metadata_removal_option = 'REMOVE_ALL_SENSITIVE_INFO', customStylesheetPath = ''):
        """Metadata.exportMetadata(outputPath, metadata_export_option, metadata_removal_option, customStylesheetPath)

           Export metadata to the specified file. An item’s metadata is stored in the ArcGIS metadata XML format. The exported XML file will be formatted to follow a metadata standard as identified by the metadata_export_option parameter.

              outputPath(string):
           A local or network file path identifying the output XML file will be created.
              metadata_export_option{string}:
           The option determines how the item’s metadata is exported. The value indicates what XML format will be used by the output XML file. The item’s ArcGIS metadata content will be converted to the appropriate XML format.
              metadata_removal_option{string}:
           This option determines if sensitive information is removed from the item’s metadata as part of the export process. The value indicates what content is filtered out. The remaining metadata content is exported.
              customStylesheetPath{string}:
           A local or network file path identifying the custom XSLT stylesheet that will be used to export metadata to a custom XML format. The value in this parameter will only be considered if the metadata_export_option is CUSTOM."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.exportMetadata(*_gp_fixargs((self, outputPath, metadata_export_option, metadata_removal_option, customStylesheetPath), True)))

    @_metadata_constants.maskargs
    def synchronize(self, metadata_sync_option = 'ALWAYS', interval = 0):
        """Metadata.synchronize(metadata_sync_option, interval)

           Syncrhonize metadata object from the item identified by the URI.

              metadata_sync_option{string}:
           This option determines how metadata object will be synchronized.
              interval{int}:
           How often the metadata will be synchronized. If the elapsed since the last synchronization is less than interval seconds, this synchronization will be skipped."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.synchronize(*_gp_fixargs((self, metadata_sync_option, interval), True)))

    def reload(self):
        """Metadata.reload()

            Reload the metadata object from the source URI if needed."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.reload(*_gp_fixargs((self,), True)))

    def save(self):
        """Metadata.save()

            Save content from the metadata object to the current item identified by the URI."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.save(*_gp_fixargs((self,), True)))

    @_metadata_constants.maskargs
    def saveAsXML(self, outputPath, metadata_save_as_xml_option = 'EXACT_COPY'):
        """Metadata.saveAsXML(outputPath, metadata_save_as_xml_option)

           Save a copy of the item’s metadata to a stand-alone metadata XML file.

              outputPath(string):
           A local or network file path identifying the output XML file that will be created. The output file will contain metadata stored in the ArcGIS Metadata XML format.
              metadata_save_as_xml_option{string}:
           The option to remove sensitive information. This option determines if information is removed from the item’s metadata as part of the process of saving the item’s metadata to a stand-alone metadata XML file. The value indicates the amount and type of content that is filtered out of the item’s metadata."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.saveAsXML(*_gp_fixargs((self, outputPath, metadata_save_as_xml_option), True)))

    def saveAsUsingCustomXSLT(self, outputPath, customStylesheetPath):
        """Metadata.saveAsUsingCustomXSLT(outputPath, customStylesheetPath)

           Save metadata out as using the provided stylesheet.

              outputPath(string):
           A local or network file path identifying the output XML file that will be created. The output file will contain metadata stored in the ArcGIS Metadata XML format.
              customStylesheetPath(string):
           A local or network file path identifying the custom XSLT stylesheet that will be used to export metadata to a custom XML format."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.saveAsUsingCustomXSLT(*_gp_fixargs((self, outputPath, customStylesheetPath), True)))

    @_metadata_constants.maskargs
    def upgrade(self, metadata_upgrade_option):
        """Metadata.upgrade(metadata_upgrade_option)

           Upgrade the metadata of the current item. A metadata document that was created with ArcGIS Desktop 8.x or 9.x can be upgraded to the ArcGIS metadata format.

              metadata_upgrade_option(string):
           This option indicates how the item’s metadata will be upgraded to the ArcGIS metadata format. This option is provided to update metadata that was created with ArcGIS Desktop 8.x or 9.x."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.upgrade(*_gp_fixargs((self, metadata_upgrade_option), True)))

    @_metadata_constants.maskargs
    def deleteContent(self, metadata_delete_content_option):
        """Metadata.deleteContent(metadata_delete_content_option)

           Delete certain content from metadata.

              metadata_delete_content_option(string):
           This option indicates what content will be deleted from metadata."""
        import arcgisscripting
        return _convertArcObjectToPythonObject(arcgisscripting.metadata.Metadata.deleteContent(*_gp_fixargs((self, metadata_delete_content_option), True)))
