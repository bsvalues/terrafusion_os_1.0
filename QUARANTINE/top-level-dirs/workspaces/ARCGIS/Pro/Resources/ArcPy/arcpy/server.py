# COPYRIGHT 2013-2024 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com
r"""The Server toolbox contains tools to manage web layers and web maps.
It also contains tools that simplify data extraction through the
server."""
from __future__ import annotations

__all__ = [
    "AnalyzeRasterAnalysisDataLocation",
    "ConvertMapServerCacheStorageFormat",
    "CreateMapServerCache",
    "DeleteMapServerCache",
    "ExportMapServerCache",
    "ExportWebMap",
    "ExtractData",
    "ExtractDataAndEmailTask",
    "ExtractDataTask",
    "GenerateMapServerCacheTilingScheme",
    "GetLayoutTemplatesInfo",
    "GetReportTemplatesInfo",
    "ImportMapServerCache",
    "ManageMapServerCacheScales",
    "ManageMapServerCacheStatus",
    "ManageMapServerCacheTiles",
    "ReplaceWebLayer",
    "SendEmailWithZipFileAttachment",
    "StageService",
    "UploadServiceDefinition",
]
__alias__ = "server"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Caching toolset
@gptooldoc("ConvertMapServerCacheStorageFormat_server", None)
def ConvertMapServerCacheStorageFormat(
    input_service=None,
    num_of_caching_service_instances=None,
) -> Result1[str]:
    """ConvertMapServerCacheStorageFormat_server(input_service, {num_of_caching_service_instances})

       Converts the storage of a map image layer or a map or image service
       cache between the exploded format and the compactV2 format.

    INPUTS:
     input_service (Image Service / Map Server):
         The map or image service whose cache format will be converted. In
         ArcGIS Enterprise, this is a string containing the REST endpoint of
         the map image layer. In a stand-alone ArcGIS Server deployment, this
         is a string containing both the server and the service information.
     num_of_caching_service_instances {Long}:
         The total number of instances of the System/CachingTools service that
         will be dedicated to running this tool. When the default value of -1
         is used, all the caching tool instances of the ArcGIS Enterprise setup
         will be used. Use a lower value to use fewer caching tool instances.
         You can increase thesetting of the System/CachingTools service
         using thewindow available through an administrative connection to
         ArcGIS Server. Ensure that the server machines can support the chosen
         number of instances. Maximum number of instances per
         machineService Editor        When connecting to a stand-alone server,
         the default number of
         instances is equal to the value of thesetting of the caching tool
         service. Maximum number of instances"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertMapServerCacheStorageFormat_server(
                *gp_fixargs((input_service, num_of_caching_service_instances), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateMapServerCache_server", None)
def CreateMapServerCache(
    input_service=None,
    service_cache_directory=None,
    tiling_scheme_type: Literal["NEW", "PREDEFINED"] | None = None,
    scales_type: Literal["STANDARD", "CUSTOM"] | None = None,
    num_of_scales=None,
    dots_per_inch=None,
    tile_size: Literal["128 x 128", "256 x 256", "512 x 512", "1024 x 1024"] | None = None,
    predefined_tiling_scheme=None,
    tile_origin=None,
    scales=None,
    cache_tile_format: Literal["PNG", "PNG8", "PNG24", "PNG32", "JPEG", "MIXED"] | None = None,
    tile_compression_quality=None,
    storage_format: Literal["COMPACT"] | None = None,
    ready_to_serve_format: Literal["READY_TO_SERVE_FORMAT", "NON_READY_TO_SERVE_FORMAT"] | None = None,
) -> Result1[str]:
    """CreateMapServerCache_server(input_service, service_cache_directory, tiling_scheme_type, scales_type, num_of_scales, dots_per_inch, tile_size, {predefined_tiling_scheme}, {tile_origin}, {scales;scales...}, {cache_tile_format}, {tile_compression_quality}, {storage_format}, {ready_to_serve_format})

       Creates the tiling scheme and preparatory folders for a map or image
       service cache. After running this tool, use the Manage Map Server
       Cache Tiles tool to add tiles to the cache.

    INPUTS:
     input_service (Image Service / Map Server):
         The map or image layer that will be cached.
     service_cache_directory (String):
         The parent directory for the cache. This must be a registered ArcGIS
         Server cache directory.
     tiling_scheme_type (String):
         Specifies how the tiling scheme will be defined. You can define a new
         tiling scheme or browse to a predefined tiling scheme file (.xml). A
         predefined scheme can be created by running the Generate Map Server
         Cache Tiling Scheme tool.NEW-The tiling scheme will be defined using
         other parameters in this
         tool to define scale levels, image format, storage format, and so on.
         This is the default.PREDEFINED-The tiling scheme will be defined using
         an .xml file. You
         can create a tiling scheme file using the Generate Map Server Cache
         Tiling Scheme tool.
     scales_type (String):
         Specifies how the tiles will be scaled.STANDARD-The scales will be
         automatically generated based on the
         number of scale levels value. It will use levels that increase or
         decrease by half from 1:1,000,000 and will start with the level
         closest to the extent of the source map document. For example, if the
         source map document has an extent of 1:121,000,000 and three scale
         levels are defined, the map service will create a cache with scale
         levels at 1:128,000,000; 1:64,000,000; and 1:32,000,000. This is the
         default.CUSTOM-The cache designer will determine the scales.
     num_of_scales (Long):
         The number of scale levels that will be created in the cache. This
         parameter is disabled if you create a custom list of scales.
     dots_per_inch (Long):
         The dots per inch (DPI) of the intended output device. If a DPI is
         specified that does not match the resolution of the output device, the
         scale of the map tile will appear incorrect. The default value is 96.
     tile_size (String):
         Specifies the width and height of the cache tiles in pixels. For the
         best balance between performance and manageability, avoid deviating
         from standard widths of 256 by 256 or 512 by 512.128 x 128-The width
         and height of the cache tiles will be 128 by 128
         pixels.256 x 256-The width and height of the cache tiles will be 256
         by 256
         pixels. This is the default.512 x 512-The width and height of the
         cache tiles will be 512 by 512
         pixels.1024 x 1024-The width and height of the cache tiles will be
         1024 by
         1024 pixels.
     predefined_tiling_scheme {File}:
         The path to a predefined tiling scheme file (usually named conf.xml).
     tile_origin {Point}:
         The origin (upper left corner) of the tiling scheme in the coordinates
         of the spatial reference of the source map document. The extent of the
         source map document must be within (but does not need to coincide
         with) this region.
     scales {Value Table}:
         The scale levels available for the cache. These are not represented as
         fractions. Instead, use 500 to represent a scale of 1:500, and so on,
         for example.
     cache_tile_format {String}:
         Specifies the cache tile format that will be used.PNG-A PNG format
         with varying bit depths will be used. The bit depths
         are optimized according to the color variation and transparency values
         in a tile. This is the default.PNG8-A lossless, 8-bit color, image
         format that uses an indexed color
         palette and an alpha table will be used. Each pixel stores a value
         (0-255) that is used to look up the color in the color palette and the
         transparency in the alpha table. 8-bit PNG images are similar to GIF
         images, and most web browsers support transparent backgrounds in PNG
         images.PNG24-A lossless, three-channel image format that supports
         large color
         variations (16 million colors) and has limited support for
         transparency will be used. Each pixel contains three 8-bit color
         channels, and the file header contains the single color that
         represents the transparent background. Versions of Microsoft Internet
         Explorer earlier than version 7 do not support this type of
         transparency. Caches using PNG24 are significantly larger than those
         using PNG8 or JPEG and will use more disk space and require greater
         bandwidth to serve clients.PNG32-A lossless, four-channel image format
         that supports large color
         variations (16 million colors) and transparency will be used. Each
         pixel contains three 8-bit color channels and one 8-bit alpha channel
         that represents the level of transparency for each pixel. While the
         PNG32 format allows for partially transparent pixels in the range from
         0 to 255, the ArcGIS Server cache generation tool only writes fully
         transparent (0) or fully opaque (255) values in the transparency
         channel. Caches using PNG32 are significantly larger than the other
         supported formats and will use more disk space and require greater
         bandwidth to serve clients.JPEG-A lossy, three-channel image format
         that supports large color
         variations (16 million colors) but does not support transparency will
         be used. Each pixel contains three 8-bit color channels. Caches using
         JPEG provide control over output quality and size.MIXED-The PNG32
         format will be created anywhere that transparency is
         detected (that is, anywhere that the data frame background is
         visible). The JPEG format will be created for the remaining tiles.
         This keeps the average file size down while providing a clean overlay
         on top of other caches.
     tile_compression_quality {Long}:
         The JPEG compression quality (1-100) that will be used. The default
         value is 75 for the JPEG tile format and 0 for other
         formats.Compression is supported only for the JPEG format. Choosing a
         higher
         value will result in a larger file size with a higher-quality image.
         Choosing a lower value will result in a smaller file size with a
         lower-quality image.
     storage_format {String}:
         Specifies the storage format that will be used for the tiles.
         This parameter has been deprecated. The Compact V2 storage format will
         always be used regardless of the storage format specified.COMPACT-The
         Compact V2 storage format will be used to group tiles into
         large files called bundles. This storage format is efficient in terms
         of storage and mobility. This is the default.EXPLODED-This option has
         been deprecated. The Compact V2 storage
         format will always be used.
     ready_to_serve_format {Boolean}:
         Specifies whether the cache content will be generated using the open
         tile package specification, and specifies the file format of the cache
         schema.READY_TO_SERVE_FORMAT-The cache content will be generated using
         the
         open tile package specification (https://github.com/Esri/tile-package-
         spec). A tile package can be packaged to a zip archive as a tile
         package for offline workflows. The cache format will be Compact V2,
         and the cache schema will be stored in JSON
         format.NON_READY_TO_SERVE_FORMAT-The cache content will be generated
         using a
         schema stored in XML format. Use this option to copy the cache to
         previous versions of ArcGIS Enterprise. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateMapServerCache_server(
                *gp_fixargs(
                    (
                        input_service,
                        service_cache_directory,
                        tiling_scheme_type,
                        scales_type,
                        num_of_scales,
                        dots_per_inch,
                        tile_size,
                        predefined_tiling_scheme,
                        tile_origin,
                        scales,
                        cache_tile_format,
                        tile_compression_quality,
                        storage_format,
                        ready_to_serve_format,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeleteMapServerCache_server", None)
def DeleteMapServerCache(
    input_service=None,
    num_of_caching_service_instances=None,
) -> Result1[str]:
    """DeleteMapServerCache_server(input_service, {num_of_caching_service_instances})

       Deletes an existing map image layer cache, including all associated
       files on disk.

    INPUTS:
     input_service (Image Service / Map Server):
         The map image layer whose cache tiles you want to delete.
     num_of_caching_service_instances {Long}:
         Defines the number of instances that will be used to update/generate
         the tiles. The value for this parameter is set to unlimited (-1) and
         cannot be modified."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeleteMapServerCache_server(*gp_fixargs((input_service, num_of_caching_service_instances), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportMapServerCache_server", None)
def ExportMapServerCache(
    input_service=None,
    target_cache_path=None,
    export_cache_type: Literal["TILE_PACKAGE", "CACHE_DATASET"] | None = None,
    copy_data_from_server: Literal["COPY_DATA", "DO_NOT_COPY"] | None = None,
    storage_format_type: Literal["COMPACT_V2", "COMPACT", "EXPLODED"] | None = None,
    scales=None,
    num_of_caching_service_instances=None,
    area_of_interest=None,
    export_extent=None,
    overwrite: Literal["OVERWRITE", "MERGE"] | None = None,
) -> Result1[str]:
    """ExportMapServerCache_server(input_service, target_cache_path, export_cache_type, copy_data_from_server, storage_format_type, scales;scales..., {num_of_caching_service_instances}, {area_of_interest}, {export_extent}, {overwrite})

       Exports tiles from a map image layer cache as a cache dataset or tile
       package to a folder on disk. The tiles can be imported into other
       caches, or they can be accessed from ArcGIS Desktop or mobile devices
       as a raster dataset, independent from their parent service.

    INPUTS:
     input_service (Image Service / Map Server):
         The map image layer with the cache tiles to be exported.
     target_cache_path (Folder):
         The folder into which the cache will be exported. This folder
         does not need to be a registered server cache directory. The ArcGIS
         Server account must have write access to the target cache folder. If
         the server account cannot be granted write access to the destination
         folder but the ArcGIS Desktop or ArcGIS Pro client has write access to
         it, check theparameter. Copy data from server
     export_cache_type (String):
         Specifies the type of cache that will be exported. Tile packages are
         suitable for use with ArcGIS Maps SDKs for Native Apps.CACHE_DATASET-A
         map or image service cache that is generated using
         ArcGIS Server will be exported. It can be used in ArcGIS Desktop and
         by ArcGIS Server map or image services. This is the
         default.TILE_PACKAGE-A single compressed file in which the cache
         dataset is
         added as a layer and consolidated so that it can be shared will be
         exported. In can be used in ArcGIS Pro and with ArcGIS Maps SDKs for
         Native Apps.
     copy_data_from_server (Boolean):
         Specifies how tiles will be moved to the target folder.Set this
         parameter to COPY_DATA if the ArcGIS Server account cannot be
         granted write access to the target folder and the ArcGIS Desktop or
         ArcGIS Pro client has write access to it. The software exports the
         tiles in the server output directory before moving them to the target
         folder.COPY_DATA-Tiles will first be placed in the server output
         directory,
         then moved to the target folder. The ArcGIS Desktop or ArcGIS Pro
         client must have write access to the target folder.DO_NOT_COPY-Tiles
         will be exported directly into the target folder.
         The ArcGIS Server account must have write access to the target folder.
         This is the default.
     storage_format_type (String):
         Specifies the storage format that will be used for the exported
         cache.COMPACT-Tiles will be grouped in bundle and bundlex files to
         save
         space on disk and allow for faster copying of caches. If the
         export_cache_type parameter is set to TILE_PACKAGE, this is the
         default.COMPACT_V2-Tiles will be grouped in bundle files only. This
         format
         provides better performance on network shares and cloud store
         directories. If the export_cache_type parameter is set to
         TILE_PACKAGE, the extension of the tile package will be .tpkx, which
         is supported by recent versions of ArcGIS products such as ArcGIS
         Online, ArcGIS Enterprise 11.4, ArcGIS Maps SDKs for Native Apps 200.0
         or later, and ArcGIS Runtime 100.5-100.15.EXPLODED-Each tile will be
         stored as an individual file.
     scales (Double):
         A list of scale levels at which tiles will be exported.
     num_of_caching_service_instances {Long}:
         Specifies the number of instances that will be used to update or
         generate the tiles. The value for this parameter is set to unlimited
         (-1) and cannot be modified.
     area_of_interest {Feature Set}:
         An area of interest that spatially constrains where tiles will be
         exported from the cache. This parameter is useful when exporting
         irregularly shaped areas, as the tool clips the cache dataset at pixel
         resolution.If you do not specify an area of interest, the full extent
         of the map
         will be exported.
     export_extent {Extent}:
         A rectangular extent defining the tiles that will be exported.
         By default, the extent is set to the full extent of the map service
         into which you are importing. The optionalparameter allows you to
         alternatively import using a polygon. It is recommended that you not
         provide values for both parameters. If values are provided for both
         parameters, theparameter takes precedence over this one. Area
         Of InterestArea Of InterestMAXOF-The maximum extent of all inputs will
         be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     overwrite {Boolean}:
         Specifies whether the images in the receiving cache will be merged
         with the tiles from the originating cache or overwritten by
         them.OVERWRITE-All pixels in the area of interest will be replaced,
         effectively overwriting tiles in the destination cache with tiles from
         the originating cache.MERGE-When the tiles are imported, transparent
         pixels in the
         originating cache will be ignored. This results in a merged or blended
         image in the destination cache. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportMapServerCache_server(
                *gp_fixargs(
                    (
                        input_service,
                        target_cache_path,
                        export_cache_type,
                        copy_data_from_server,
                        storage_format_type,
                        scales,
                        num_of_caching_service_instances,
                        area_of_interest,
                        export_extent,
                        overwrite,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateMapServerCacheTilingScheme_server", None)
def GenerateMapServerCacheTilingScheme(
    in_map: Literal["Internal_Map"] | None = None,
    tile_origin=None,
    output_tiling_scheme=None,
    num_of_scales=None,
    scales=None,
    dots_per_inch=None,
    tile_size: Literal["128 x 128", "256 x 256", "512 x 512", "1024 x 1024"] | None = None,
    ready_to_serve_format: Literal["READY_TO_SERVE_FORMAT", "NON_READY_TO_SERVE_FORMAT"] | None = None,
    output_folder=None,
) -> Result1[str]:
    """GenerateMapServerCacheTilingScheme_server(in_map, tile_origin, output_tiling_scheme, num_of_scales, scales;scales..., dots_per_inch, tile_size, {ready_to_serve_format}, {output_folder})

       Generates a custom tiling scheme file that defines the scale levels,
       tile dimensions, and other properties for a web tile layer.

    INPUTS:
     in_map (Map):
         The current map or an existing .mxd file to be used for the tiling
         scheme.
     tile_origin (Point):
         The origin (upper left corner) of the tiling scheme in the coordinates
         of the spatial reference of the source data frame.
     num_of_scales (Long):
         The number of scale levels that will be included in the tiling scheme.
     scales (Value Table):
         The scale levels that will be included in the tiling scheme. These are
         not represented as fractions. Instead, use 500 to represent a scale of
         1:500, and so on, for example.
     dots_per_inch (Long):
         The dots per inch (DPI) of the intended output device. If a DPI is
         specified that does not match the resolution of the output device, the
         scale of the map tile will appear incorrect. The default value is 96.
     tile_size (String):
         Specifies the width and height of the cache tiles in pixels. For the
         best balance between performance and manageability, avoid deviating
         from standard dimensions of 256 by 256 or 512 by 512.128 x 128-The
         width and height of the cache tiles will be 128 by 128
         pixels.256 x 256-The width and height of the cache tiles will be 256
         by 256
         pixels. This is the default.512 x 512-The width and height of the
         cache tiles will be 512 by 512
         pixels.1024 x 1024-The width and height of the cache tiles will be
         1024 by
         1024 pixels.
     ready_to_serve_format {Boolean}:
         Specifies the file format of the cache schema that will be used and
         whether it will be generated using the open tile package
         specification.READY_TO_SERVE_FORMAT-The cache schema will be generated
         in JSON
         format using the open tile package specification. An output folder
         must be specified in the output_folder
         parameter.NON_READY_TO_SERVE_FORMAT-The cache schema will be generated
         in XML
         format. This is the default.
     output_folder {Folder}:
         The folder location where the cache schema and iteminfo files will be
         created in JSON format.

    OUTPUTS:
     output_tiling_scheme (File):
         The path and file name of the tiling scheme file that will be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateMapServerCacheTilingScheme_server(
                *gp_fixargs(
                    (
                        in_map,
                        tile_origin,
                        output_tiling_scheme,
                        num_of_scales,
                        scales,
                        dots_per_inch,
                        tile_size,
                        ready_to_serve_format,
                        output_folder,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportMapServerCache_server", None)
def ImportMapServerCache(
    input_service=None,
    source_cache_type: Literal["CACHE_DATASET", "TILE_PACKAGE"] | None = None,
    source_cache_dataset=None,
    source_tile_package=None,
    upload_data_to_server: Literal["UPLOAD_DATA", "DO_NOT_UPLOAD"] | None = None,
    scales=None,
    num_of_caching_service_instances=None,
    area_of_interest=None,
    import_extent=None,
    overwrite: Literal["OVERWRITE", "MERGE"] | None = None,
) -> Result1[str]:
    """ImportMapServerCache_server(input_service, source_cache_type, {source_cache_dataset}, {source_tile_package}, {upload_data_to_server}, {scales;scales...}, {num_of_caching_service_instances}, {area_of_interest}, {import_extent}, {overwrite})

       Imports tiles from a folder on disk into a map image layer cache.

    INPUTS:
     input_service (Image Service / Map Server):
         The map image layer with the cache tiles to be imported.
     source_cache_type (String):
         Specifies the type of cache that will be imported to a cached map or
         image service running on the server.CACHE_DATASET-A map or image
         service cache that is generated using
         ArcGIS Server will be imported. It can be used in ArcGIS Desktop and
         by ArcGIS Server map or image services.TILE_PACKAGE-A single
         compressed file in which the cache dataset is
         added as a layer and consolidated so that it can be shared will be
         imported. It can be used in ArcGIS Pro and with ArcGIS Maps SDKs for
         Native Apps.
     source_cache_dataset {Raster Dataset}:
         The path to the cache folder matching the data frame name. You do not
         need to specify a registered server cache directory; typically, you'll
         specify a location on disk where tiles have been previously exported.
         This location should be accessible to the ArcGIS Server account. If
         the ArcGIS Server account cannot be granted access to this location,
         set the upload_data_to_server parameter to UPLOAD_DATA.
     source_tile_package {File}:
         The path to the tile package (.tpk) that will be imported. This
         location should be accessible to the ArcGIS Server account. When
         importing a tile package file to a cached map or image service, the
         upload_data_to_server parameter is ignored, as it is automatically set
         to UPLOAD_DATA.
     upload_data_to_server {Boolean}:
         Specifies how tiles will be moved to the server cache directory.Set
         this parameter to UPLOAD_DATA if the ArcGIS Server account does
         not have read access to the source cache. The tool will upload the
         source cache to the ArcGIS Server uploads directory before moving it
         to the ArcGIS Server cache directory.UPLOAD_DATA-Tiles will first be
         placed in the server uploads
         directory, then moved to the server cache directory. This is enabled
         by default when source_cache_type is TILE_PACKAGE.DO_NOT_UPLOAD-Tiles
         will be imported directly into the server cache
         directory. The ArcGIS Server account must have read access to the
         source cache.
     scales {Double}:
         A list of scale levels at which tiles will be imported.
     num_of_caching_service_instances {Long}:
         Specifies the number of instances that will be used to update or
         generate the tiles. The value for this parameter is set to unlimited
         (-1) and cannot be modified.
     area_of_interest {Feature Set}:
         An area of interest polygon that spatially constrains where tiles will
         be imported into the cache. This parameter is useful when importing
         tiles for irregularly shaped areas, as the tool clips the cache
         dataset, which intersects the polygon at pixel resolution and imports
         it to the service cache directory. If you do not provide a
         value for this parameter, the value of
         theparameter will be used. The default is to use the full extent of
         the map. Import Extent
     import_extent {Extent}:
         A rectangular extent defining the tiles that will be imported
         into the cache. By default, the extent is set to the full extent of
         the map service into which you are importing. The optionalparameter
         allows you to spatially constrain the imported tiles using an
         irregular shape. If values are provided for both parameters,
         theparameter takes precedence over this one. Area Of
         InterestArea Of InterestMAXOF-The maximum extent of all inputs will be
         used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     overwrite {Boolean}:
         Specifies whether the images in the destination cache will be merged
         with the tiles from the originating cache or overwritten by
         them.OVERWRITE-All pixels in the area of interest will be replaced,
         effectively overwriting tiles in the destination cache with tiles from
         the originating cache.MERGE-When the tiles are imported, transparent
         pixels in the
         originating cache will be ignored. This results in a merged or blended
         image in the destination cache. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportMapServerCache_server(
                *gp_fixargs(
                    (
                        input_service,
                        source_cache_type,
                        source_cache_dataset,
                        source_tile_package,
                        upload_data_to_server,
                        scales,
                        num_of_caching_service_instances,
                        area_of_interest,
                        import_extent,
                        overwrite,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ManageMapServerCacheScales_server", None)
def ManageMapServerCacheScales(
    input_service=None,
    scales=None,
) -> Result1[str]:
    """ManageMapServerCacheScales_server(input_service, scales;scales...)

       Updates the scale levels in an existing map image layer in ArcGIS
       Enterprise or in a cached map or image service on a stand-alone
       server. Use this tool to add new scales or delete existing scales from
       a cache.

    INPUTS:
     input_service (Image Service / Map Server):
         The map image layer or map or image service where cache scales will be
         added or removed. In ArcGIS Enterprise, this is a string containing
         the REST endpoint of the web map image layer. In a stand-alone ArcGIS
         Server, this is a string containing both the server and the service
         information.
     scales (Value Table):
         The scale values that will be included in the updated tiling scheme."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ManageMapServerCacheScales_server(*gp_fixargs((input_service, scales), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ManageMapServerCacheStatus_server", None)
def ManageMapServerCacheStatus(
    input_service=None,
    manage_mode: Literal["REBUILD_CACHE_STATUS", "DELETE_CACHE_STATUS", "REPORT_BUNDLE_STATUS"] | None = None,
    scales=None,
    num_of_caching_service_instances=None,
    report_folder=None,
    area_of_interest=None,
    report_extent=None,
) -> Result1[str]:
    """ManageMapServerCacheStatus_server(input_service, manage_mode, {scales;scales...}, {num_of_caching_service_instances}, {report_folder}, {area_of_interest}, {report_extent})

       Manages internal data kept by the server about the built tiles in a
       map or image service cache.

    INPUTS:
     input_service (Image Service / Map Server):
         The map image layer for which the cache status will be
         modified.. You can choose it by browsing to the desired service in
         Portal or you can drag and drop a web tile layer from thepanetab to
         supply this parameter. CatalogPortal
     manage_mode (String):
         DELETE_CACHE_STATUS-Deletes the status information used by the
         server.REBUILD_CACHE_STATUS-Deletes, then rebuilds the status
         information
         used by the server. REPORT_BUNDLE_STATUS-Creates status
         information in a new file
         geodatabase named Status.gdb in a folder you specify in theparameter.
         This option is used when you want to create a custom status report for
         a particular area of interest or set of scales. Output Folder
     scales {Double}:
         The scale levels for which the status will be modified. This parameter
         is only applicable when building a custom status using the
         REPORT_BUNDLE_STATUS option for the manage_mode parameter.
     num_of_caching_service_instances {Long}:
         Defines the number of instances that will be used to update/generate
         the tiles. The value for this parameter is set to unlimited (-1) and
         cannot be modified.
     report_folder {Folder}:
         Output folder for the Status.gdb. This parameter is only applicable
         when building a custom status using the REPORT_BUNDLE_STATUS option.
     area_of_interest {Feature Set}:
         An area of interest (polygon) that determines what geography the
         status report will cover. This parameter is only applicable when
         building a custom status using the REPORT_BUNDLE_STATUS option.
     report_extent {Extent}:
         A rectangular extent defining the area for which the status will be
         built. This parameter is only applicable when building a custom status
         using the REPORT_BUNDLE_STATUS option.Note that the area_of_interest
         parameter allows you to specify an area
         of interest that is nonrectangular.MAXOF-The maximum extent of all
         inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ManageMapServerCacheStatus_server(
                *gp_fixargs(
                    (
                        input_service,
                        manage_mode,
                        scales,
                        num_of_caching_service_instances,
                        report_folder,
                        area_of_interest,
                        report_extent,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ManageMapServerCacheTiles_server", None)
def ManageMapServerCacheTiles(
    input_service=None,
    scales=None,
    update_mode: Literal["RECREATE_EMPTY_TILES", "RECREATE_ALL_TILES", "DELETE_TILES"] | None = None,
    num_of_caching_service_instances=None,
    area_of_interest=None,
    update_extent=None,
    wait_for_job_completion: Literal["WAIT", "DO_NOT_WAIT"] | None = None,
    portal_url=None,
) -> Result1[str]:
    """ManageMapServerCacheTiles_server(input_service, scales;scales..., update_mode, {num_of_caching_service_instances}, {area_of_interest}, {update_extent}, {wait_for_job_completion}, {portal_url})

       Creates and updates tiles in an existing web tile layer cache (in
       ArcGIS Enterprise or ArcGIS Online), map image layers in ArcGIS
       Enterprise, and cached map or image services in a stand-alone server.
       This tool is used to create new tiles, replace missing tiles,
       overwrite outdated tiles, and delete tiles.

    INPUTS:
     input_service (Image Service / Map Server):
         The web tile layer, web imagery layer, or map image layer whose cache
         tiles will be updated.
     scales (Double):
         A list of scale levels at which tiles will be created.
     update_mode (String):
         Specifies the mode that will be used to update the
         cache.RECREATE_EMPTY_TILES-Only tiles that are empty will be created.
         Existing tiles will be left unchanged. This option is not available
         for web tile layers published to ArcGIS
         Online.RECREATE_ALL_TILES-Existing tiles will be replaced and new
         tiles will
         be added if the extent has changed.DELETE_TILES-Tiles will be deleted
         from the cache. The cache folder
         structure will not be deleted.
     num_of_caching_service_instances {Long}:
         The total number of instances of the System/CachingTools service that
         will be dedicated to running this tool. If the default value of -1 is
         used, all the caching tool instances of the ArcGIS Enterprise setup
         will be used. Use a lower value to use fewer caching tool instances.
         You can increase thesetting of the System/CachingTools service
         using thewindow available through an administrative connection to
         ArcGIS Server. Ensure that the server machines can support the chosen
         number of instances. Maximum number of instances per
         machineService Editor        When connecting to a stand-alone server,
         the default number of
         instances is equal to the value of thesetting of the caching tool
         service. Maximum number of instances
     area_of_interest {Feature Set}:
         An area of interest that will constrain where tiles will be created or
         deleted. This parameter is useful for managing tiles for irregularly
         shaped areas. It is also useful when precaching some areas and leaving
         less-visited areas uncached.If you do not provide a value for this
         parameter, the default value
         uses the full extent of the map.
     update_extent {Extent}:
         A rectangular extent used to create or delete tiles, depending on the
         value of the update_mode parameter. If both the update_extent and
         area_of_interest parameter values are specified, the area_of_interest
         value will be used.MAXOF-The maximum extent of all inputs will be
         used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.
     wait_for_job_completion {Boolean}:
         Specifies whether the tool will continue to run while the cache job
         runs on ArcGIS Online or Portal for ArcGIS.WAIT-The tool will continue
         to run while the cache job runs on ArcGIS
         Online or Portal for ArcGIS. Using this option, you can request
         detailed progress reports at any time and view the geoprocessing
         messages as they appear. This is the default. It is recommended that
         you use this option in Python scripts.DO_NOT_WAIT-A job will be
         submitted to the server, allowing you to
         perform other geoprocessing tasks. Use this option when you are
         building a cache automatically at the time you publish the service.
         You can also set this option on any other cache that you build.
     portal_url {String}:
         The URL of the portal."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ManageMapServerCacheTiles_server(
                *gp_fixargs(
                    (
                        input_service,
                        scales,
                        update_mode,
                        num_of_caching_service_instances,
                        area_of_interest,
                        update_extent,
                        wait_for_job_completion,
                        portal_url,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Data Extraction toolset
@gptooldoc("ExtractData_server", None)
def ExtractData(
    Layers_to_Clip=None,
    Area_of_Interest=None,
    Feature_Format=None,
    Raster_Format=None,
    Spatial_Reference=None,
    Custom_Spatial_Reference_Folder=None,
    Output_Zip_File=None,
) -> Result1[str]:
    """ExtractData_server(Layers_to_Clip;Layers_to_Clip..., Area_of_Interest, Feature_Format, Raster_Format, Spatial_Reference, {Custom_Spatial_Reference_Folder}, Output_Zip_File)

       Extracts selected layers in the specified area of interest to a
       specific format and spatial reference. The extracted data is then
       written to a zip file.

    INPUTS:
     Layers_to_Clip (Layer):
         The layers to be clipped. Layers must be feature or raster; layer
         files are not supported.
     Area_of_Interest (Feature Set):
         One or more polygons by which the layers will be clipped.
     Feature_Format (String):
         Specifies the format of the output features. The format should
         be specified as follows:        Name or format - Short Name -
         extension (if any)The hyphens are required and there must be one space
         before and after
         the hyphen. For example:        File Geodatabase - GDB -
         .gdbShapefile -
         SHP - .shpAutodesk AutoCAD -
         DXF_R2007 - .dxfAutodesk AutoCAD - DWG_R2007 - .dwgBentley
         Microstation Design (V8) - DGN_V8 - .dgnThe list of short names
         supported includes DGN_V8, DWG_R14, DWG_R2000,
         DWG_R2004, DWG_R2005, DWG_R2007, DWG_R2010, DXF_R14, DXF_R2000,
         DXF_R2004, DXF_R2005, DXF_R2007, and DXF_R2010.
     Raster_Format (String):
         Specifies the format of the output raster datasets. The format
         should be specified as follows:        Name of format - Short Name -
         extension (if any)The hyphens are required and there must be one space
         before and after
         the hyphen. For example:        Esri GRID - GRIDFile
         Geodatabase - GDB -
         .gdbERDAS IMAGINE - IMG -
         .imgTagged Image File Format - TIFF - .tifPortable Network Graphics -
         PNG - .pngGraphic Interchange Format - GIF - .gifJoint Photographics
         Experts Group - JPEG - .jpgJoint Photographics Experts Group - JPEG -
         .jp2Bitmap - BMP - .bmpSome of the above raster formats have
         limitations and not all data can
         be converted to the format. For a list of formats and their
         limitations, refer to List of supported sensors.
     Spatial_Reference (String):
         The spatial reference of the output data delivered by the tool.For
         standard Esri spatial references, the name you provide here should
         be the name of the desired coordinate system. This name corresponds to
         the name of the spatial reference's projection file. Alternatively,
         you can use the Well Known ID (WKID) of the coordinate system.
         For example:        Sinusoidal (world)WGS 1984 World
         MercatorNAD 1983 HARN StatePlane
         Oregon North FIPS 3601 (Meters)WGS 1984 UTM Zone 11N10200354001If you
         want the output to have the same coordinate system as the
         input, then use the string Same As Input.For any custom projection,
         the name specified should be the name of
         the custom projection file (without extension). The location of the
         custom projection files should be specified in the parameter.
     Custom_Spatial_Reference_Folder {Folder}:
         The location of any custom projection file or files referenced in the
         Spatial Reference parameter. This is only necessary if the custom
         projection file is not in the default installation Coordinate System
         folder.

    OUTPUTS:
     Output_Zip_File (File):
         The zip file that will contain the extracted data."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractData_server(
                *gp_fixargs(
                    (
                        Layers_to_Clip,
                        Area_of_Interest,
                        Feature_Format,
                        Raster_Format,
                        Spatial_Reference,
                        Custom_Spatial_Reference_Folder,
                        Output_Zip_File,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractDataAndEmailTask_server", None)
def ExtractDataAndEmailTask(
    Layers_to_Clip=None,
    Area_of_Interest=None,
    Feature_Format: Literal["File Geodatabase - GDB - .gdb", "Shapefile - SHP - .shp"] | None = None,
    Raster_Format: Literal[
        "ESRI GRID - GRID",
        "File Geodatabase - GDB - .gdb",
        "ERDAS IMAGINE - IMG - .img",
        "Tagged Image File Format - TIFF - .tif",
        "Graphic Interchange Format - GIF - .gif",
        "Joint Photographics Experts Group - JPEG - .jpg",
        "Joint Photographics Experts Group - JPEG 2000 - .jp2",
        "Bitmap - BMP - .bmp",
        "Portable Network Graphics - PNG - .png",
    ]
    | None = None,
    To=None,
) -> Result1[str]:
    """ExtractDataAndEmailTask_server(Layers_to_Clip;Layers_to_Clip..., Area_of_Interest, Feature_Format, Raster_Format, To)

       Extracts the data in the specified layers and area of interest to the
       selected format and spatial reference, zips the data, and emails it to
       the specified address. This tool can be used to create a Data
       Extraction geoprocessing service.

    INPUTS:
     Layers_to_Clip (Layer):
         The layers to be clipped. Layers must be feature or raster; layer
         files are not supported.
     Area_of_Interest (Feature Set):
         One or more polygons by which the layers will be clipped.
     Feature_Format (String):
         Specifies the format of the output features. The format should
         be specified as follows:        Name or format - Short Name -
         extension (if any)The hyphens are required and there must be one space
         before and after
         the hyphen. For example:        File Geodatabase - GDB -
         .gdbShapefile -
         SHP - .shpAutodesk AutoCAD -
         DXF_R2007 - .dxfAutodesk AutoCAD - DWG_R2007 - .dwgBentley
         Microstation Design (V8) - DGN_V8 - .dgnThe list of short names
         supported includes DGN_V8, DWG_R14, DWG_R2000,
         DWG_R2004, DWG_R2005, DWG_R2007, DWG_R2010, DXF_R14, DXF_R2000,
         DXF_R2004, DXF_R2005, DXF_R2007, and DXF_R2010.
     Raster_Format (String):
         Specifies the format of the output raster datasets. The format
         should be specified as follows:        Name of format - Short Name -
         extension (if any)The hyphens are required and there must be one space
         before and after
         the hyphen. For example:        Esri GRID - GRIDFile
         Geodatabase - GDB -
         .gdbERDAS IMAGINE - IMG -
         .imgTagged Image File Format - TIFF - .tifPortable Network Graphics -
         PNG - .pngGraphic Interchange Format - GIF - .gifJoint Photographics
         Experts Group - JPEG - .jpgJoint Photographics Experts Group - JPEG -
         .jp2Bitmap - BMP - .bmpSome of the above raster formats have
         limitations and not all data can
         be converted to the format. For a list of formats and their
         limitations, refer to List of supported sensors.
     To (String):
         The email address of the recipient.This tool will be able to email to
         this address if and only if the
         SMTP server has been configured within this model."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractDataAndEmailTask_server(
                *gp_fixargs((Layers_to_Clip, Area_of_Interest, Feature_Format, Raster_Format, To), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractDataTask_server", None)
def ExtractDataTask(
    Layers_to_Clip=None,
    Area_of_Interest=None,
    Feature_Format: Literal[
        "File Geodatabase - GDB - .gdb",
        "Shapefile - SHP - .shp",
        "Bentley Microstation Design (V8) - DGN_V8 - .dgn",
        "Autodesk AutoCAD - DXF_R14   - .dxf",
        "Autodesk AutoCAD - DXF_R2000 - .dxf",
        "Autodesk AutoCAD - DXF_R2004 - .dxf",
        "Autodesk AutoCAD - DXF_R2005 - .dxf",
        "Autodesk AutoCAD - DXF_R2007 - .dxf",
        "Autodesk AutoCAD - DXF_R2010 - .dxf",
        "Autodesk AutoCAD - DXF_R2013 - .dxf",
        "Autodesk AutoCAD - DWG_R14   - .dwg",
        "Autodesk AutoCAD - DWG_R2000 - .dwg",
        "Autodesk AutoCAD - DWG_R2004 - .dwg",
        "Autodesk AutoCAD - DWG_R2005 - .dwg",
        "Autodesk AutoCAD - DWG_R2007 - .dwg",
        "Autodesk AutoCAD - DWG_R2010 - .dwg",
        "Autodesk AutoCAD - DWG_R2013 - .dwg",
    ]
    | None = None,
    Raster_Format: Literal[
        "ESRI GRID - GRID",
        "File Geodatabase - GDB - .gdb",
        "ERDAS IMAGINE - IMG - .img",
        "Tagged Image File Format - TIFF - .tif",
        "Graphic Interchange Format - GIF - .gif",
        "Joint Photographics Experts Group - JPEG - .jpg",
        "Joint Photographics Experts Group - JPEG 2000 - .jp2",
        "Bitmap - BMP - .bmp",
        "Portable Network Graphics - PNG - .png",
    ]
    | None = None,
    Output_Zip_File=None,
) -> Result1[str]:
    """ExtractDataTask_server(Layers_to_Clip;Layers_to_Clip..., Area_of_Interest, Feature_Format, Raster_Format, Output_Zip_File)

       Extracts the selected layers in the specified area of interest to the
       selected formats and spatial reference, and returns the data in a .zip
       file.

    INPUTS:
     Layers_to_Clip (Layer):
         The layers to be clipped. Layers must be feature or raster; layer
         files are not supported.
     Area_of_Interest (Feature Set):
         One or more polygons by which the layers will be clipped.
     Feature_Format (String):
         Specifies the format of the output features. The format should
         be specified as follows:        Name or format - Short Name -
         extension (if any)The hyphens are required and there must be one space
         before and after
         the hyphen. For example:        File Geodatabase - GDB -
         .gdbShapefile -
         SHP - .shpAutodesk AutoCAD -
         DXF_R2007 - .dxfAutodesk AutoCAD - DWG_R2007 - .dwgBentley
         Microstation Design (V8) - DGN_V8 - .dgnThe list of short names
         supported includes DGN_V8, DWG_R14, DWG_R2000,
         DWG_R2004, DWG_R2005, DWG_R2007, DWG_R2010, DXF_R14, DXF_R2000,
         DXF_R2004, DXF_R2005, DXF_R2007, and DXF_R2010.
     Raster_Format (String):
         Specifies the format of the output raster datasets. The format
         should be specified as follows:        Name of format - Short Name -
         extension (if any)The hyphens are required and there must be one space
         before and after
         the hyphen. For example:        Esri GRID - GRIDFile
         Geodatabase - GDB -
         .gdbERDAS IMAGINE - IMG -
         .imgTagged Image File Format - TIFF - .tifPortable Network Graphics -
         PNG - .pngGraphic Interchange Format - GIF - .gifJoint Photographics
         Experts Group - JPEG - .jpgJoint Photographics Experts Group - JPEG -
         .jp2Bitmap - BMP - .bmpSome of the above raster formats have
         limitations and not all data can
         be converted to the format. For a list of formats and their
         limitations, refer to List of supported sensors.

    OUTPUTS:
     Output_Zip_File (File):
         The zip file that will contain the extracted data."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractDataTask_server(
                *gp_fixargs((Layers_to_Clip, Area_of_Interest, Feature_Format, Raster_Format, Output_Zip_File), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SendEmailWithZipFileAttachment_server", None)
def SendEmailWithZipFileAttachment(
    To=None,
    From=None,
    Subject=None,
    Text=None,
    Zip_File=None,
    Max_File_Size__MB_=None,
    SMTP_Email_Server=None,
    User=None,
    Password=None,
) -> Result1[str]:
    """SendEmailWithZipFileAttachment_server(To, From, Subject, Text, Zip_File, Max_File_Size__MB_, SMTP_Email_Server, {User}, {Password})

       Emails a file to an email address using an SMTP email server.

    INPUTS:
     To (String):
         The email address of the recipient.
     From (String):
         The email address of the sender.
     Subject (String):
         The text in the subject line of the email.
     Text (String):
         The body text of the email.
     Zip_File (File):
         The file to be attached to the email.
     Max_File_Size__MB_ (Long):
         The maximum allowable size of an attachment.If you don't know what to
         use for Max File Size, check the attachment
         size limit of your SMTP mail server and the recipient email provider.
     SMTP_Email_Server (String):
         The SMTP email server that will deliver the email.
     User {String}:
         The user which will log in to the SMTP email server.
     Password {String}:
         The user password used to connect to the SMTP email server (if
         necessary)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SendEmailWithZipFileAttachment_server(
                *gp_fixargs(
                    (To, From, Subject, Text, Zip_File, Max_File_Size__MB_, SMTP_Email_Server, User, Password), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Printing toolset
@gptooldoc("ExportWebMap_server", None)
def ExportWebMap(
    Web_Map_as_JSON=None,
    Output_File=None,
    Format: Literal["PDF", "PNG32", "PNG8", "JPG", "GIF", "EPS", "SVG", "SVGZ", "AIX", "TIFF"] | None = None,
    Layout_Templates_Folder=None,
    Layout_Template=None,
    Layout_Item_ID=None,
    Report_Template=None,
    Report_Item_ID=None,
) -> Result1[str]:
    """ExportWebMap_server(Web_Map_as_JSON, Output_File, {Format}, {Layout_Templates_Folder}, {Layout_Template}, {Layout_Item_ID}, {Report_Template}, {Report_Item_ID})

       Returns a printable page layout or basic map of a specified area of
       interest based on the state of a web app (for example, included
       services, layer visibility settings, and client-side graphics).

    INPUTS:
     Web_Map_as_JSON (String):
         A JSON representation of the state of the map to be exported as it
         appears in the web app. See the ExportWebMap specification to
         understand how to format this text. ArcGIS API for JavaScript allows
         you to get this JSON string from the map.
     Format {String}:
         Specifies the format in which the map image for printing will be
         delivered.PNG8-8-bit Portable Network Graphics (PNG8) will be used.
         This is the
         default.PDF-Portable Document Format (PDF) will be used.PNG32-32-bit
         Portable Network Graphics (PNG32) will be used.JPG-Joint Photographic
         Experts Group (JPG) will be used.GIF-Graphics Interchange Format
         (GIF) will be used.EPS-Encapsulated PostScript (EPS) will be
         used.SVG-Scalable Vector Graphics (SVG) will be used.SVGZ-Compressed
         Scalable Vector Graphics (SVGZ) will be used.AIX-Adobe Illustrator
         Exchange (AIX) will be used.TIFF-Tag Image File Format (TIFF) will be
         used.The background of the output file is always opaque.
     Layout_Templates_Folder {Folder}:
         The full path to the folder containing layout or report pages (.pagx,
         .rptx, and .rptt files) to be used as templates. The default location
         is <install_directory>\\Resources\\ArcToolBox\\Templates\\ExportWebMapTemp
         lates.
     Layout_Template {String}:
         The name of a template from the list or the keyword MAP_ONLY. When
         MAP_ONLY is used or an empty string is passed in, the output map will
         not contain any page layout elements such as title, legend, or scale
         bar.
     Layout_Item_ID {String}:
         The portal ID (in JSON format) of the layout item that will be used
         for templates. Use the format: {"id": "<portal-id>"}. When a value is
         provided, this parameter takes precedence over the Layout_Template
         parameter.
     Report_Template {String}:
         The name of the report template.When this parameter is provided, the
         Format parameter must be set to
         PDF. When this parameter is unspecified, the output file will not
         contain any reports.
     Report_Item_ID {String}:
         The portal ID (in JSON format) of the report item that will be used
         for templates. Use the format: {"id": "<portal-id>"}. When a value is
         provided, this parameter takes precedence over the Report_Template
         parameter.

    OUTPUTS:
     Output_File (File):
         The output file name. The extension of the file depends on the Format
         parameter value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportWebMap_server(
                *gp_fixargs(
                    (
                        Web_Map_as_JSON,
                        Output_File,
                        Format,
                        Layout_Templates_Folder,
                        Layout_Template,
                        Layout_Item_ID,
                        Report_Template,
                        Report_Item_ID,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GetLayoutTemplatesInfo_server", None)
def GetLayoutTemplatesInfo(
    Layout_Templates_Folder=None,
    Layout_Item_ID=None,
) -> Result1[str]:
    """GetLayoutTemplatesInfo_server({Layout_Templates_Folder}, {Layout_Item_ID})

       Returns the content of layout templates in JSON format. Layout files
       (.pagx) located in a folder are used as layout templates.

    INPUTS:
     Layout_Templates_Folder {Folder}:
         The full path to the folder where the layout files (.pagx) that will
         be used as layout templates are located. The default location is <inst
         all_directory>\\Resources\\ArcToolBox\\Templates\\ExportWebMapTemplates.
     Layout_Item_ID {String}:
         The portal ID (in JSON format) of the layout item that will be used
         for templates. Use the format {"id": "<portal-id>"}."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GetLayoutTemplatesInfo_server(*gp_fixargs((Layout_Templates_Folder, Layout_Item_ID), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GetReportTemplatesInfo_server", None)
def GetReportTemplatesInfo(
    Report_Templates_Folder=None,
    Report_Item_ID=None,
) -> Result1[str]:
    """GetReportTemplatesInfo_server({Report_Templates_Folder}, {Report_Item_ID})

       Returns the content of report files and templates in JSON format.
       Report files (.rptx) and report templates (.rptt) are used to store
       report definitions.

    INPUTS:
     Report_Templates_Folder {Folder}:
         The full path to the folder where the report files (.rptx or .rptt)
         that will be used as report templates are located. The default
         location is <install_directory>\\Resources\\ArcToolBox\\Templates\\ExportW
         ebMapTemplates.
     Report_Item_ID {String}:
         The portal ID (in JSON format) of the report item that will be used
         for the templates. Use the format {"id": "<portal-id>"}."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GetReportTemplatesInfo_server(*gp_fixargs((Report_Templates_Folder, Report_Item_ID), True))
        )
        return retval
    except Exception as e:
        raise e


# Publishing toolset
@gptooldoc("ReplaceWebLayer_server", None)
def ReplaceWebLayer(
    target_layer=None,
    archive_layer_name=None,
    update_layer=None,
    replace_item_info: Literal["REPLACE", "KEEP"] | None = None,
    create_new_item: Literal["TRUE", "FALSE"] | None = None,
) -> Result1[str]:
    """ReplaceWebLayer_server(target_layer, archive_layer_name, update_layer, {replace_item_info}, {create_new_item})

       Replaces the content of a web layer in a portal with the content of
       another web layer.

    INPUTS:
     target_layer (Vector Tile Layer / Internet Tiled Layer / Scene Layer):
         The web layer that will be replaced. Provide a layer or
         catalog path, or provide the item ID or service URL of one of the
         following:        Vector tile layer published from vector tile
         packageTile layer
         Scene layer published from one of the following sources:
         Scene layer packageReferenced scene cache in folder or cloud data
         stores
     archive_layer_name (String):
         A unique name for the archive layer. The web layer that is replaced
         remains in the portal as an archive layer.
     update_layer (Vector Tile Layer / Internet Tiled Layer / Scene Layer):
         The replacement web layer. Provide a layer or catalog path, or
         provide the item ID or service URL of one of the following:
         Vector tile layer published from vector tile packageTile layer
         Scene layer published from one of the following sources:
         Scene layer packageReferenced scene cache in folder or cloud data
         stores
     replace_item_info {Boolean}:
         Specifies whether the target layer's item information (thumbnail
         image, summary, description, and tags) will be replaced. With either
         option, the item's credits (attribution), terms of use, and created-
         from information will not be replaced.KEEP-The target layer's item
         information will not be replaced when the
         layer is updated. This is the default.REPLACE-The target layer's item
         information will be replaced by the
         update layer's item information.
     create_new_item {Boolean}:
         Specifies whether an item will be created for the archive layer. This
         parameter is supported on portals in ArcGIS Online and ArcGIS
         Enterprise 10.8 or later.TRUE-An item ID will be created for the
         archive layer. This is the
         default for scene layers.FALSE-The item ID of the update layer will be
         used for the archive
         layer. This is the default for vector tile layers and tile layers."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReplaceWebLayer_server(
                *gp_fixargs((target_layer, archive_layer_name, update_layer, replace_item_info, create_new_item), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("StageService_server", None)
def StageService(
    in_service_definition_draft=None,
    out_service_definition=None,
    staging_version=None,
) -> Result1[str]:
    """StageService_server(in_service_definition_draft, out_service_definition, {staging_version})

       Stages a service definition. A staged service definition file (.sd)
       contains all the necessary information to share a web layer, locator,
       web tool, or service.

    INPUTS:
     in_service_definition_draft (File):
         The input draft service definition. Service definition drafts can be
         created using the arcpy.sharing module or the CreateGeocodeSDDraft or
         CreateGPSDDraft ArcPy functions.
     staging_version {Long}:
         The version of the published service definition.When sharing a
         feature, a tile, or an imagery layer to ArcGIS
         Enterprise, use 5 for the value. When sharing a map image layer or web
         tool to ArcGIS Enterprise, and any layer type to ArcGIS Online, use
         102 for the value. This is the default.When sharing a web tool or
         geoprocessing service to ArcGIS Enterprise
         or ArcGIS Server using the GeoprocessingSharingDraft or
         CreateGPSDDraft function, use the value corresponding to the version
         number from the following list:11.4-34011.3-33011.2-32011.1-31011.0-30
         010.9.1-20910.9-20810.8.1-20610
         .8-20510.7.1-20410.7-20310.6.1-20210.6-201

    OUTPUTS:
     out_service_definition (File):
         The resulting service definition. The default is to write the service
         definition to the same directory as the draft service definition."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.StageService_server(
                *gp_fixargs((in_service_definition_draft, out_service_definition, staging_version), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UploadServiceDefinition_server", None)
def UploadServiceDefinition(
    in_sd_file=None,
    in_server=None,
    in_service_name=None,
    in_cluster=None,
    in_folder_type: Literal["FROM_SERVICE_DEFINITION", "EXISTING", "NEW"] | None = None,
    in_folder=None,
    in_startupType: Literal["STARTED", "STOPPED"] | None = None,
    in_override: Literal["OVERRIDE_DEFINITION", "USE_DEFINITION"] | None = None,
    in_my_contents: Literal["SHARE_ONLINE", "NO_SHARE_ONLINE"] | None = None,
    in_public: Literal["PUBLIC", "PRIVATE"] | None = None,
    in_organization: Literal["SHARE_ORGANIZATION", "NO_SHARE_ORGANIZATION"] | None = None,
    in_groups=None,
) -> Result:
    """UploadServiceDefinition_server(in_sd_file, in_server, {in_service_name}, {in_cluster}, {in_folder_type}, {in_folder}, {in_startupType}, {in_override}, {in_my_contents}, {in_public}, {in_organization}, {in_groups;in_groups...})

       Uploads and shares a web layer, locator, web tool, or service to
       ArcGIS Online, ArcGIS Enterprise, or ArcGIS Server.

    INPUTS:
     in_sd_file (File):
         The service definition file (.sd) that contains all the information
         needed to share a web layer, web tool, or service.
     in_server (ServerConnection):
         The server type. The following server types are supported:
         My Hosted Services-Use when sharing a hosted web layer to ArcGIS
         Online or ArcGIS Enterprise. Enter My Hosted Services for the server
         connection. Capitalize the first letter of each word and include a
         space between each word.HOSTING_SERVER-Use when sharing a hosted web
         layer to ArcGIS Online or
         ArcGIS Enterprise.URL to the ArcGIS Enterprise portal federated
         server-Use when sharing
         a web tool or map image layer to an ArcGIS Enterprise portal federated
         server. ArcGIS Server connection-Use when sharing a map or
         geoprocessing service to ArcGIS Server. You can use ArcGIS Server
         connections listed under thenode in thewindow, or you can browse to a
         folder where server connection files are stored.
         ServersProjectURL to ArcGIS Server-Use when sharing a map or
         geoprocessing service
         to ArcGIS Server. You can specify the URL to ArcGIS Server provided a
         publisher connection to ArcGIS Server has been added to the ArcGIS Pro
         project, and you're opening the project in the script or you're
         running the tool in ArcGIS Pro.
     in_service_name {String}:
         The service name that will override the current service name specified
         in the service definition.
     in_cluster {String}:
         The cluster name that will override the current cluster to which the
         service has been assigned. You must choose from clusters on the
         specified server.Clusters are deprecated at ArcGIS Enterprise 10.5.1.
         This parameter
         will be ignored for servers that do not support multiple clusters.
     in_folder_type {String}:
         Specifies the folder type that will be used to determine the source
         for the folder. The default is to get a folder from the service
         definition. You can also get a list of existing folders on the
         specified online server, or you can specify that a new folder be
         created once you share the web layer or service.NEW-A new folder will
         be created.EXISTING-An existing folder on the
         server will be used.FROM_SERVICE_DEFINITION-The folder in the service
         definition will be
         used. This is the default.
     in_folder {String}:
         The folder that will be used for the web layer or service. If no
         folder is provided, the folder specified in the service definition
         will be used. If you specified NEW for in_folder_type, use this
         parameter to provide a folder name. If you specified EXISTING for
         in_folder_type, you can choose from the existing folders on the
         server.
     in_startupType {Boolean}:
         Specifies whether the service will be started after
         sharing.STARTED-The service will be started after sharing. This is the
         default.STOPPED-The service will not be started after sharing.
     in_override {Boolean}:
         Specifies whether the sharing properties set in the service definition
         will be overridden. These properties define if, and how, you are
         sharing the web layer or web tool with ArcGIS Online or ArcGIS
         Enterprise. Sharing the web layer or web tool exposes it for others to
         use.OVERRIDE_DEFINITION-The sharing properties set in the service
         definition will be overridden.USE_DEFINITION-The sharing properties
         set in the service definition
         will not be overridden; they will be used. This is the default.You
         must be signed in to ArcGIS Online or ArcGIS Enterprise to
         override sharing properties.This parameter is not honored when sharing
         to ArcGIS Server.
     in_my_contents {Boolean}:
         Specifies whether web layers and web tools will be shared. All
         shared web layers and web tools are available through.
         Even if you only want to share with a specific group in your
         organization, the web layer or web tool will also be shared through.
         My ContentMy Content         SHARE_ONLINE-The web layer or web tool
         will be shared on
         ArcGIS Online or ArcGIS Enterprise. The web layer or web tool will be
         listed under. My ContentNO_SHARE_ONLINE-The web layer or web
         tool will not be shared on ArcGIS
         Online or ArcGIS Enterprise and will be inaccessible to other ArcGIS
         Online or ArcGIS Enterprise users and clients on the web. This is the
         default.You must be signed in to a portal to override sharing
         properties.This parameter is not honored when sharing to ArcGIS
         Server.
     in_public {Boolean}:
         Specifies whether the web layer or web tool will be available to the
         public.PUBLIC-The web layer or web tool will be available to the
         public.PRIVATE-The web layer or web tool will not be available to the
         public.
         This is the default.You must be signed in to ArcGIS Online or ArcGIS
         Enterprise to
         override sharing properties.This parameter is not honored when sharing
         to ArcGIS Server.
     in_organization {Boolean}:
         Specifies whether the web layer or web tool will be shared with your
         organization.SHARE_ORGANIZATION-The web layer or web tool will be
         shared with your
         organization.NO_SHARE_ORGANIZATION-The web layer or web tool will not
         be shared
         with your organization. This is the default.You must be signed in to
         ArcGIS Online or ArcGIS Enterprise to
         override sharing properties.This parameter is not honored when sharing
         to ArcGIS Server.
     in_groups {String}:
         A list of group names with which the web layer or web tool will be
         shared.You must be signed in to ArcGIS Online or ArcGIS Enterprise to
         override sharing properties.This parameter is not honored when sharing
         to ArcGIS Server."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UploadServiceDefinition_server(
                *gp_fixargs(
                    (
                        in_sd_file,
                        in_server,
                        in_service_name,
                        in_cluster,
                        in_folder_type,
                        in_folder,
                        in_startupType,
                        in_override,
                        in_my_contents,
                        in_public,
                        in_organization,
                        in_groups,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Raster toolset
@gptooldoc("AnalyzeRasterAnalysisDataLocation_server", None)
def AnalyzeRasterAnalysisDataLocation(
    in_task=None,
) -> Result1[str]:
    """AnalyzeRasterAnalysisDataLocation_server(in_task)

       Analyze input data locations in a Raster Analysis task.

    INPUTS:
     in_task (File / String):
         Input Raster Analysis Task"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AnalyzeRasterAnalysisDataLocation_server(*gp_fixargs((in_task,), True))
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
