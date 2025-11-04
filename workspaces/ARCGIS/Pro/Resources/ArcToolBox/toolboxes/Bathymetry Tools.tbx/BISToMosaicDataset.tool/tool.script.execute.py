import arcpy
import json
import os
from datetime import date, datetime


class BISToMosaicDataset(object):
    """-------------------------------------------------------------------------
    Tool:               BIS To Mosaic Dataset(Bathymetry Tools)
    Source Name:        Bathymetry Tools
    Author:             Esri, Inc.
    Usage:              arcpy.BISToMosaicDataset(
                                        Input BIS Workspace,
                                        Output Mosaic Dataset,
                                        Coordinate System,
                                        Query File,
                                        Create Overviews,
                                        Force Overview Tiles
                                        )
    Required Arguments: Input BIS Workspace
                        Output Mosaic Dataset
    Optional Arguments: Coordinate System
                        Query File,
                        Create Overviews,
                        Force Overview Tiles
    Description: Creates a mosaic dataset from a Bathymetric Information System (BIS).
    ------------------------------------------------------------------------"""

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.DEFAULT_COORDINATE_SYTEM_WKID = 3857  # WGS 1984 Web Mercator (auxiliary sphere)
        self.RASTER_TYPE = "Bathymetry Model"
        # This is specified if the data does not have a coordinate system; otherwise, the coordinate system of the mosaic dataset will be used. This can also be used to override the coordinate system of the input data.
        self.SPATIAL_REFERENCE = None
        # (STRING) The wildcards for the filter work on the full path to the input data.
        self.FILTER = '*.json'
        self.SUBFOLDERS = "SUBFOLDERS"  # or "NO_SUBFOLDERS"
        # "EXCLUDE_DUPLICATES" # or "ALLOW_DUPLICATES", "OVERWRITE_DUPLICATES"
        self.DUPLICATE_ITEMS_ACTION = "EXCLUDE_DUPLICATES"
        self.OPERATION_DESCRIPTION = ''  # (STRING)
        # or "FORCE_SPATIAL_REFERENCE"
        self.FORCE_SPATIAL_REFERENCE = "NO_FORCE_SPATIAL_REFERENCE"
        self.AUX_INPUTS = None
        # OR "USE_PIXEL_CACHE". Specifies whether the pixel cache will be generated for faster display and processing of the mosaic dataset.
        self.ENABLE_PIXEL_CACHE = "NO_PIXEL_CACHE"
        self.CACHE_LOCATION = None  # (FOLDER; STRING) # The location of the pixel cache. If no location is defined, the cache is written to C:\Users\<Username>\AppData\Local\ESRI\rasterproxies\
        self.BUILD_THUMBNAILS = "NO_THUMBNAILS"
        # Hard code the settings
        self.UpdateCellSizeRanges = "UPDATE_CELL_SIZES"  # or True
        self.UpdateBoundary = "UPDATE_BOUNDARY"  # or True
        self.UpdateOverviews = "NO_OVERVIEWS"  # or False
        self.MaximumLevels = None
        self.MaximumCellSize = 0
        self.MinimumRowsOrColumns = 1500
        self.CalculateStatistics = "CALCULATE_STATISTICS"  # or True
        self.BuildRasterPyramids = "BUILD_PYRAMIDS"  # or True
        self.EstimateMosaicDatasetStatistics = "NO_STATISTICS"  # or False, mosaic dataset statistics will be calculated in overviews
        # the above boolean definition reference: https://pro.arcgis.com/en/pro-app/latest/tool-reference/data-management/add-rasters-to-mosaic-dataset.htm
        # Hard code: the name of BIS Catalog Dataset, the Catalog Dataset schema, BIS schema, Web App model file
        self.BIS_CATALOG = 'BisCatalog'
        self.LAYER_NAME = 'cd_itemname'
        self.LAYER_SOURCE = 'cd_itemsource'
        self.LAYER_TYPE = 'cd_itemtype'
        self.VERTICAL_UNITS = 'VerticalUnits'
        self.DIRECTIONALITY = 'Directionality'
        self.BIS_CELL_SIZE = 'BisCellSize'
        self.MD_CELL_SIZE = 'CellSize'
        self.DATA_TYPE = 'DataType'
        self.DATASETPATH = 'BisDatasetPath'
        self.DATASETID = 'BisDatasetId'
        self.GLOBALID = 'GlobalID'
        self.SORTED_DATASETID = 'sorted_BisDatasetIds'
        self.PROXY_RASTER_PATH = 'ProxyRasterPath'
        # ignore list
        self.IGNORE_FIELDS = ['OBJECTID', 'SHAPE', 'CD_MAXSCALE', 'CD_MINSCALE', 'CD_DRAWORDER', 'CD_SHAPEHEIGHT', 'SHAPE_LENGTH', 'SHAPE.LEN', 'SHAPE_AREA', 'SHAPE.AREA',
                              'ST_AREA(SHAPE)', 'ST_LENGTH(SHAPE)', 'SHAPE.STAREA()', 'SHAPE.STLENGTH()']  # ignore list, but export self.LAYER_NAME.upper(), self.LAYER_TYPE.upper()
        # DataType: GeoTiff (Elevation), GeoTiff (RGB), BAG, ASCII Grid, Esri Grid, GDB Raster, Floating Point Grid, Point, Multipoint, Point Cloud (LAS), Line, Polygon, Mosaic Dataset,
        # HDF5, MRF, netCDF, CRF, ShapeFile, Other
        self.RASTER_DATA_TYPES = ['GeoTiff (Elevation)', 'GeoTiff (RGB)', 'BAG', 'ASCII Grid', 'Esri Grid', 'GDB Raster', 'Floating Point Grid', 'MRF', 'S102']
        self.POINT_DATA_TYPES = ['Point Cloud (LAS)', 'Point Cloud (LASD)', 'Point', 'Multipoint', 'ShapeFile']

    def execute(self):
        """The source code of the tool."""
        try:
            #######################################
            # Get and check input parameters
            #######################################
            # BIS Catalog Dataset - Input error check
            bis_wksp = arcpy.GetParameterAsText(0)
            if not bis_wksp:
                arcpy.AddError("No workspace specified.")
                return
            flag_wksp, gdb_type = self.check_wksp(bis_wksp)
            if not flag_wksp:
                return
            # Do not spread operations across multiple processes
            ppf_origin = arcpy.env.parallelProcessingFactor  # will resume the original ppf value afterwards
            arcpy.env.parallelProcessingFactor = "0"

            if gdb_type == "SDE":
                flag_owner, owner_name = self.sde_table_ownername(bis_wksp)
                if flag_owner and owner_name:
                    bis_catalog = os.path.join(bis_wksp, owner_name.strip()+'.'+self.BIS_CATALOG)
                else:
                    arcpy.AddError("ERROR - SDE owner name {} is invalid.".format(owner_name))
                    return
            else:
                bis_catalog = os.path.join(bis_wksp, self.BIS_CATALOG)
            if not self.check_bis(bis_catalog):
                return

            # Output Mosaic Dataset - Input error check
            out_mosaic = arcpy.GetParameterAsText(1)
            # check if Target Workspace is the same as Input BIS Workspace
            #if not self.check_outwksp(target_wksp, bis_wksp):
            #    return
            if not self.check_outwksp(out_mosaic, bis_wksp):
                return

            # Coordinate system for Output MD coordinate system - Input error check; Default Coordinate system is WGS 1984 Web Mercator (auxiliary sphere)
            coordsys = arcpy.GetParameterAsText(2)
            [flag_cs, sr] = self.check_coord_sys(coordsys, self.DEFAULT_COORDINATE_SYTEM_WKID)
            if not flag_cs:
                return

            # Query file - Input error check and branch selection
            query_file = arcpy.GetParameterAsText(3)
            [flag_query, query_type] = self.check_query(query_file)
            if not flag_query:
                return

            # Overviews
            create_overviews = arcpy.GetParameter(4)
            force_overview_tiles = arcpy.GetParameter(5)

            #######################################
            # Processing
            #######################################
            # Create a Mosaic Dataset: 32 bit float, 1 band
            try:
                self.create_md(out_mosaic, sr)
            except Exception as ex:
                arcpy.AddError('Exception when creating an empty mosaic dataset - {}.'.format(str(ex)))
                return
            arcpy.SetProgressor("default", 'Creating mosaic dataset...')

            # Extract fields and domains to add to mosaic dataset
            add_md_fields, bis_catalog_fields, flag = self.list_add_fields(bis_catalog, self.IGNORE_FIELDS)
            if not flag:
                return

            # Add domains
            arcpy.SetProgressor("default", 'Adding domains to mosaic dataset...')
            if not self.add_domains(add_md_fields, bis_wksp, out_mosaic):
                return

            # Add fields
            arcpy.SetProgressor("default", 'Adding fields to mosaic dataset...')
            if not self.add_bis_fields(add_md_fields, out_mosaic):
                return

            # Add rasters to mosaic dataset using custom raster type (Bathymetry Model)
            try:
                arcpy.SetProgressor("default", 'Querying data to Mosaic Dataset...')
                # generate dataset json for custom raster type
                flag, dataset_json = self.gen_dataset_json(bis_catalog, query_file, add_md_fields, bis_catalog_fields, query_type)
                if not flag:
                    return
                arcpy.AddMessage("Information of raster(s) or proxy raster(s) synchronized to raster type file: {}.".format(dataset_json))
                # run gp tool with custom raster type
                arcpy.SetProgressor("default", 'Adding rasters to mosaic dataset...')
                arcpy.AddMessage('Adding rasters to mosaic dataset...')

                arcpy.management.AddRastersToMosaicDataset(in_mosaic_dataset=out_mosaic, raster_type=self.RASTER_TYPE, input_path=dataset_json, update_cellsize_ranges=self.UpdateCellSizeRanges,
                                                           update_boundary=self.UpdateBoundary, update_overviews=self.UpdateOverviews, maximum_pyramid_levels=self.MaximumLevels,
                                                           maximum_cell_size=self.MaximumCellSize, minimum_dimension=self.MinimumRowsOrColumns, spatial_reference=self.SPATIAL_REFERENCE,
                                                           filter=self.FILTER, sub_folder=self.SUBFOLDERS, duplicate_items_action=self.DUPLICATE_ITEMS_ACTION, build_pyramids=self.BuildRasterPyramids,
                                                           calculate_statistics=self.CalculateStatistics, build_thumbnails=self.BUILD_THUMBNAILS, operation_description=self.OPERATION_DESCRIPTION,
                                                           force_spatial_reference=self.FORCE_SPATIAL_REFERENCE, estimate_statistics=self.EstimateMosaicDatasetStatistics, aux_inputs=self.AUX_INPUTS,
                                                           enable_pixel_cache=self.ENABLE_PIXEL_CACHE, cache_location=self.CACHE_LOCATION)

                if not self.output_GP_messages("Add Rasters To Mosaic Dataset"):
                    return
            except:
                self.output_GP_messages("Add Rasters To Mosaic Dataset")
                return

            flag_imn = self.is_mosaic_null(out_mosaic)
            if flag_imn == 0:
                # CellSize for mosaic dataset cell size
                if not self.update_CellSize(bis_catalog, out_mosaic):
                    return
                # Overviews if needed
                if not self.run_overviews(create_overviews, out_mosaic, force_overview_tiles):
                    return
                # Update MinPS and MaxPS for display purpose
                flag_ps, err_ps = self.update_MinPS_MaxPS(out_mosaic)
                if not flag_ps: # warning rather than failed because this is only for display enhancement
                    arcpy.AddWarning("Exception when updating MinPS and MaxPS fields - {}.".format(err_ps)) 

            # resume the original value of parallel processing factor
            arcpy.env.parallelProcessingFactor = ppf_origin

            return

        except Exception as ex:
            arcpy.AddError("Error in executing BIS To Mosaic Dataset - {}.".format(str(ex)))
            return

    def is_mosaic_null(self, out_mosaic):
        """Check if mosaic dataset is null, using correct field name format."""
        count = 0
        try:
            fields = arcpy.ListFields(out_mosaic)
            fields_names = [f.name for f in fields]
            field_name = None
            if self.DATASETID in fields_names:
                field_name = self.DATASETID
            elif self.DATASETID.upper() in fields_names:
                field_name = self.DATASETID.upper()
            elif self.DATASETID.lower() in fields_names:
                field_name = self.DATASETID.lower()
            with arcpy.da.SearchCursor(out_mosaic, field_name) as cursor:
                for row in cursor:
                    if row[0]:
                        count += 1
            if count == 0:
                arcpy.AddWarning("No data exported to mosaic datasets.")
                return 1
            else:
                return 0
        except Exception as ex:
            arcpy.AddError("Exception when checking if mosaic dataset is null - {}.".format(str(ex)))
            return -1

    def update_CellSize(self, bis_catalog, out_mosaic):
        """Update CellSize for mosaic dataset cell size."""
        try:
            bis_sr = arcpy.Describe(bis_catalog).spatialReference
            md_sr = arcpy.Describe(out_mosaic).spatialReference
            bis_unit, bis_coeff = self.get_unit(bis_sr)
            md_unit, md_coeff = self.get_unit(md_sr)
            if bis_sr.name.lower() == md_sr.name.lower() or bis_unit.lower() == md_unit.lower: # CellSize equals to BISCellSize when they are of same coordinate systems
                try: # arcpy.da.UpdateCursor
                    with arcpy.da.UpdateCursor(out_mosaic, ['CELLSIZE', 'BISCELLSIZE']) as cursor:
                        for row in cursor:
                            row[0] = row[1]
                            cursor.updateRow(row)
                except: # arcpy.UpdateCursor works when there are pending edits in SDE
                    arcpy.env.workspace = os.path.dirname(out_mosaic)
                    cursor = arcpy.UpdateCursor(out_mosaic)
                    for row in cursor:
                        row.setValue('CELLSIZE', row.getValue('BISCELLSIZE'))
                        cursor.updateRow(row)
            else: # CellSize equals to LowPS
                try:
                    with arcpy.da.UpdateCursor(out_mosaic, ['CELLSIZE', 'LowPS']) as cursor:
                        for row in cursor:
                            row[0] = round(float(row[1]), 10) # round to 10 decimal places
                            cursor.updateRow(row)
                except:
                    arcpy.env.workspace = os.path.dirname(out_mosaic)
                    cursor = arcpy.UpdateCursor(out_mosaic)
                    for row in cursor:
                        row.setValue('CELLSIZE', round(float(row.getValue('LowPS')), 10)) # round to 10 decimal places
                        cursor.updateRow(row)

            del cursor, row # clean up
        except Exception as ex:
            arcpy.AddWarning("CellSize field was not updated - {}.".format(str(ex)))
            return False
        return True

    def run_overviews(self, create_overviews, out_mosaic, force_overview_tiles):
        if create_overviews:
            arcpy.SetProgressor("default", 'Creating overviews...')
            # define overviews
            try:
                arcpy.AddMessage("Defining overviews...")
                arcpy.management.DefineOverviews(in_mosaic_dataset=out_mosaic, overview_image_folder=None, in_template_dataset=None, extent=None, pixel_size=None, number_of_levels=None,
                                                 tile_rows=None, tile_cols=None, overview_factor=None, force_overview_tiles=force_overview_tiles, resampling_method="BILINEAR", compression_method="JPEG", compression_quality=80)

                if not self.output_GP_messages("Define Overviews"):
                    return False

            except:
                self.output_GP_messages("Define Overviews")
                return False
            # build overviews
            try:
                arcpy.AddMessage("Building overviews...")
                arcpy.management.BuildOverviews(in_mosaic_dataset=out_mosaic, where_clause="", define_missing_tiles="DEFINE_MISSING_TILES",
                                                generate_overviews="GENERATE_OVERVIEWS", generate_missing_images="GENERATE_MISSING_IMAGES", regenerate_stale_images="REGENERATE_STALE_IMAGES")

                if not self.output_GP_messages("Build Overviews"):
                    return False

            except:
                self.output_GP_messages("Build Overviews")
                return False
        return True

    def check_wksp(self, wksp):
        """Check the validity of workspace."""
        tw = wksp.lower()
        if arcpy.Exists(wksp):
            if tw.endswith(".gdb"):
                gdb_type = "FGDB"
            elif tw.endswith(".sde"):
                gdb_type = "SDE"
            elif tw.endswith(".geodatabase"):
                gdb_type = "MGDB"
            else:
                gdb_type = None
            return True, gdb_type
        else:
            arcpy.AddIDMessage("ERROR", 90110)
            return False, None

    def check_bis(self, bis_catalog):
        """Check the validity of BIS workspace."""
        if arcpy.Exists(bis_catalog):
            fields = arcpy.ListFields(bis_catalog)
            fields_names = [f.name.upper() for f in fields]
            if self.GLOBALID.upper() in fields_names:
                return True
            else:
                arcpy.AddError('Invalid BIS workspace, BisCatalog missing required field GlobalID.')
                return False
        else:
            arcpy.AddError("Invalid BIS, missing BisCatalog - {}.".format(bis_catalog))
            return False

    def sde_table_ownername(self, workspace):
        """Get SDE table owner name."""
        with arcpy.EnvManager(workspace=workspace):
            for _, _, filenames in arcpy.da.Walk(workspace):  # dirpath, subdirnames, filenames
                if filenames:
                    for filename in filenames:
                        if filename.lower().endswith('.'+self.BIS_CATALOG.lower()):
                            _, owner_name, _ = arcpy.ParseTableName(filename, workspace).split(',')  # gdb_name, owner_name, table_name
                            return True, owner_name
        return False, None

    def check_coord_sys(self, coordsys, default_coordsys):
        """Check coordinate system."""
        if coordsys:
            try:
                sref = arcpy.SpatialReference()
                sref.loadFromString(coordsys)
                sr = sref
                return True, sr
            except:
                arcpy.AddIDMessage("ERROR", 519)
                return False, None
        else:
            sr = arcpy.SpatialReference(default_coordsys)
            return True, sr

    def check_inval_chr(self, out_mosaic_name):
        """Check invalid characters."""
        md_name = out_mosaic_name
        is_valid = not any(k in md_name for k in '!@#$%^&*()-+<>/}[{]~`?. ')
        is_1st_num = not any(k in md_name[0] for k in '_1234567890')
        if not is_valid or not is_1st_num:
            arcpy.AddIDMessage("ERROR", 354)
            return False
        else:
            return True

    def check_query(self, query_file):
        """Check query type."""
        query_type = ''
        if query_file:
            if arcpy.Exists(query_file):
                try:
                    with open(query_file) as jsonfile:
                        bathy_query = json.load(jsonfile)
                    if query_file.lower().endswith('.model'):
                        if self.SORTED_DATASETID not in bathy_query:
                            arcpy.AddIDMessage("ERROR", 30259, "Model File", "sorted_BisDatasetIds")
                            return False, None
                        else:
                            query_type = 'model'
                            arcpy.AddMessage('Using model file to create mosaic dataset.')
                    elif query_file.lower().endswith('.rule'):
                        if not any('orderRule' in kw for kw in bathy_query):
                            arcpy.AddIDMessage("ERROR", 30259, "Rule File", "orderRule")
                            return False, None
                        else:
                            query_type = 'rule'
                            arcpy.AddMessage('Using rule file to create mosaic dataset.')
                    else:
                        arcpy.AddMessage('Invalid query file. Only *.model or *.rule accepted.')
                        return False, None
                except:
                    arcpy.AddIDMessage("ERROR", 814)
                    return False, None
            else:
                arcpy.AddIDMessage("ERROR", 10061, query_file)  # file does not exist
                return False, None
        else:
            arcpy.AddMessage('No query file specified, creating mosaic dataset from BisCatalog.')
        return True, query_type

    def create_md(self, out_mosaic, sr):
        """Create a mosaic dataset."""
        mosaic = os.path.basename(out_mosaic)
        workspace_path = os.path.dirname(out_mosaic)
        if arcpy.Exists(out_mosaic):
            arcpy.AddWarning("Overwriting existing mosaic dataset.")
        arcpy.management.CreateMosaicDataset(workspace_path, mosaic, sr,  1, "32_BIT_FLOAT", "NONE", None)
        arcpy.management.SetMosaicDatasetProperties(in_mosaic_dataset=out_mosaic,default_mosaic_method="LockRaster") # change mosaic method to LockRaster to render per the order of ObjectID
        return

    def list_add_fields(self, bis_catalog, ignore_fields_name):
        """List fields properties to add to mosaic dataset."""
        try:
            all_fields = arcpy.ListFields(bis_catalog)
            all_fields_names = [f.name for f in all_fields]

            add_bis_fields_names = []
            for fn in all_fields_names:
                if fn.upper() not in ignore_fields_name:
                    add_bis_fields_names.append(fn)
            # Extract fields properties
            add_md_fields_props = []
            from_bis_fields_props = []
            add_prop = []
            bis_prop = []
            for fp in all_fields:
                if fp.name in add_bis_fields_names:
                    # prop = ["name", "type", "aliasName", "length", "defaultValue", "domain"]
                    bis_prop = [fp.name, fp.type,
                                fp.aliasName, fp.length, '', fp.domain]
                    # field name and type from BIS Catalog
                    from_bis_fields_props.append(bis_prop)
                    # alter some field name and type for adding to mosaic dataset; sde name convention
                    if fp.name.upper() == self.LAYER_SOURCE.upper():
                        if fp.name.isupper():
                            add_prop = [self.DATASETPATH.upper(), fp.type, self.DATASETPATH.upper(), fp.length, '', fp.domain]
                        else:
                            add_prop = [self.DATASETPATH, fp.type, self.DATASETPATH, fp.length, '', fp.domain]
                    elif fp.name.upper() == self.GLOBALID.upper():
                        if fp.name.isupper():
                            add_prop = [self.DATASETID.upper(), 'GUID', self.DATASETID.upper(), fp.length, '', fp.domain]
                        else:
                            add_prop = [self.DATASETID, 'GUID', self.DATASETID, fp.length, '', fp.domain]
                    elif fp.name.upper() == self.BIS_CELL_SIZE.upper():
                        if fp.name.isupper():
                            add_prop = [self.MD_CELL_SIZE.upper(), 'Double', self.MD_CELL_SIZE.upper(), None, '', None]  # add CellSize for mosaic dataset cell size
                            add_md_fields_props.append(add_prop)
                            add_prop = [fp.name.upper(), fp.type, fp.aliasName.upper(), fp.length, '', fp.domain]
                        else:
                            # add BisCellSize for sort
                            add_prop = [self.MD_CELL_SIZE, 'Double', self.MD_CELL_SIZE, None, '', None]
                            add_md_fields_props.append(add_prop)
                            add_prop = [fp.name, fp.type, fp.aliasName, fp.length, '', fp.domain]
                    else:
                        if fp.name.isupper():
                            add_prop = [fp.name.upper(), fp.type, fp.aliasName.upper(), fp.length, '', fp.domain]
                        else:
                            add_prop = [fp.name, fp.type, fp.aliasName, fp.length, '', fp.domain]
                    add_md_fields_props.append(add_prop)
            return add_md_fields_props, from_bis_fields_props, True
        except Exception as ex:
            arcpy.AddError("Exception when listing fields to add to mosaic dataset - {}.".format(str(ex)))
            return None, None, False

    def add_domains(self, add_fields, bis_wksp, out_mosaic):  # retained function
        """Add domain when target workspace is not the same with input bis workspace."""
        try:
            target_wksp = os.path.dirname(out_mosaic)
            if target_wksp is not None and target_wksp != bis_wksp:
                domains = []
                for field in add_fields:
                    if field[5] and (field[5] not in domains):  # add unique domain
                        domains.append(field[5])
                # add domains
                domains_count = len(domains)
                if domains_count > 0:
                    arcpy.SetProgressor("step", "Adding domains to Output Mosaic Dataset Workspace...", 0, domains_count, 1)
                    for domain_name in domains:
                        arcpy.SetProgressorLabel("Adding domain - {}...".format(domain_name))
                        table = 'memory/table_{}'.format(domain_name)
                        if arcpy.Exists(table):
                            arcpy.Delete_management(table)
                        if not arcpy.Exists(table):
                            arcpy.management.DomainToTable(bis_wksp, domain_name, table, "Code", "Description", '')
                            arcpy.management.TableToDomain(table, 'Code', 'Description', target_wksp, domain_name, '', "REPLACE")
                            arcpy.AddMessage(
                                "Domain '{}' added.".format(domain_name))
                        else:
                            arcpy.AddError('The "{}" table could not be overwritten.'.format(table))
                    arcpy.SetProgressorPosition()
                arcpy.ResetProgressor()
                return True
            else:
                return True
        except Exception as ex:
            arcpy.AddError('Error adding domains - {}.'.format(str(ex)))
            return False

    def add_bis_fields(self, fields_to_add, out_mosaic):
        """Add fields and check input error."""
        try:
            fields_count = len(fields_to_add)
            if fields_count < 0:
                arcpy.AddError("Number of BIS fields is negative.")
                return False
            elif fields_count == 0:
                arcpy.AddWarning("No BIS fields found to add.")
                return True
            else:
                for f in fields_to_add:
                    # Convert name convention of field type from Field Object to use AddFields tool
                    f[1] = 'TEXT' if f[1] == 'String' else 'SHORT' if f[1] == 'SmallInteger' else 'FLOAT' if f[1] == 'Single' else 'LONG' if f[1] == 'Integer' else f[1]
                arcpy.management.AddFields(out_mosaic, fields_to_add)
                for field in fields_to_add:
                    arcpy.AddMessage("Field '{}' added.".format(field[2]))
            return True
        except Exception as ex:
            arcpy.AddError(
                'Exception when adding fields - {}.'.format(str(ex)))
            return False

    def extract_path(self, layersource):
        """Extract path from field cd_itemsource, the dictionary-like string"""
        try:
            path_dict_text = layersource
            path = path_dict_text.partition(":")[2].strip()
            path = path.partition("}")[0].strip().strip("\'").strip('\"')
            path = path.replace('\\\\', '\\')
            if path:
                return path, True
            else:
                arcpy.AddError(
                    "Error when extracting path from cd_itemsource - {}.".format(layersource))
                return path, False
        except Exception as ex:
            arcpy.AddError(
                "Exception when extracting path from cd_itemsource - {}.".format(str(ex)))
            return None, False

    def extract_metadata(self, cursor, bis_fields_names, query_type):
        """Extract metadata from datasets with supported data types"""
        fields_rows = []
        vertical_units = []
        directionality = []
        bis_fields_names_upper = [name.upper() for name in bis_fields_names]
        index_vu = bis_fields_names_upper.index(self.VERTICAL_UNITS.upper())
        index_drc = bis_fields_names_upper.index(self.DIRECTIONALITY.upper())
        index_dtyp = bis_fields_names_upper.index(self.DATA_TYPE.upper())
        index_name = bis_fields_names_upper.index(self.LAYER_NAME.upper())
        for row in cursor:
            # only export specified types (raster datasets, las files, las datasets)
            if row[index_dtyp] in self.RASTER_DATA_TYPES:
                fields_rows.append(row)
            elif row[index_dtyp] in self.POINT_DATA_TYPES:
                if self.PROXY_RASTER_PATH.upper() in bis_fields_names_upper:
                    index_prxr = bis_fields_names_upper.index(self.PROXY_RASTER_PATH.upper())
                    proxyraster_path = row[index_prxr]
                    source_dataset_name = row[index_name]
                    if proxyraster_path:  # only write point cloud datasets with proxyraster into Dataset.json
                        if arcpy.Exists(proxyraster_path):
                            fields_rows.append(row)
                        else:
                            arcpy.AddWarning("Proxy raster '{}' of dataset '{}' does not exist. Skipped exporting it to mosaic dataset.".format(proxyraster_path, source_dataset_name))
                    else:
                        arcpy.AddWarning("Proxy raster path of dataset '{}' is blank. Skipped exporting it to mosaic dataset.".format(source_dataset_name))
                        continue
                else:
                    continue
            else:
                if query_type == 'model':
                    arcpy.AddWarning("{} is not in a supported data type, skipped.".format(row[index_name]))
                continue
            # unique VerticalUnits for inconsistence warning
            vu = row[index_vu]
            if vu and (vu not in vertical_units):
                vertical_units.append(vu)
            # unique Directionality for inconsistence warning
            drc = row[index_drc]
            if drc and (drc not in directionality):
                directionality.append(drc)
        return fields_rows, vertical_units, directionality

    def gen_dataset_json(self, bis_catalog, query_file, add_md_fields_props, from_bis_fields_props, query_type):
        """Generate dataset json from BIS Catalog, rule file, or model file exclude non-raster when exporting from Catalog Dataset, warn when multi-VirticalUnits, multi-Directionality."""
        try:
            # save Dataset.file in temp location
            temp_path = os.path.dirname(os.getenv('TEMP'))
            if not os.path.exists(temp_path):
                arcpy.AddMessage("Temp folder does not exist, creating Temp folder - {}".format(temp_path))
                try:
                    os.makedirs(temp_path)
                except Exception as ex_path:
                    arcpy.AddError("Exception when creating Temp folder - {}".format(str(ex_path)))
                    return False, None
            # temp proxy raster dataset json file with timestamp
            now = datetime.now()
            timestamp = now.strftime("%Y%m%d%H%M%S%f")
            dataset_json = os.path.join(temp_path, "Dataset_"+timestamp+".json")
            # read metadada from fields: bis minimum, bag, user custom
            # bis original field name and type for search cursor; prop = ["name", "type", "aliasName", "length", "defaultValue", " domain"]
            bis_fields_names = [f[0] for f in from_bis_fields_props]
            # revised field name and type for mosaic dataset
            add_md_fields_names = [f[0] for f in add_md_fields_props]

            # 3 branches: BIS Catalog; rule file; model file
            # Branch 1: from BIS Catalog
            if not query_file:
                with arcpy.da.SearchCursor(bis_catalog, bis_fields_names) as cursor:
                    [fields_rows, vertical_units, directionality] = self.extract_metadata(cursor, bis_fields_names, query_type)

            # Branch 2: from rule file
            elif query_file.lower().endswith('.rule'):
                with open(query_file, 'r') as f:
                    query_rule = json.load(f)
                sort_field = []
                for q in query_rule:
                    elm = self.GLOBALID+' ASC' if (q['orderRule'] == 'Ascending' and q['name'] == self.DATASETID) else self.GLOBALID+' DESC' if (q['orderRule'] == 'Descending' and q['name']
                                                                                                                                                 == self.DATASETID) else q['name']+' ASC' if (q['orderRule'] == 'Ascending') else q['name']+' DESC'  # ASC for ascending, DESC for descending
                    add_elm = 'ORDER BY '+elm if not sort_field else elm
                    sort_field.append(add_elm)
                sql_query = ','.join(sort_field)
                with arcpy.da.SearchCursor(bis_catalog, bis_fields_names, sql_clause=(None, sql_query)) as cursor:
                    [fields_rows, vertical_units, directionality] = self.extract_metadata(cursor, bis_fields_names, query_type)

            # Branch 3: from model file
            elif query_file.lower().endswith('.model'):
                with open(query_file, 'r') as f:
                    bathy_model = json.load(f)
                # exclude null/None value caused by overviews
                sorted_Ids = [BisId for BisId in bathy_model[self.SORTED_DATASETID] if BisId != None]
                fields_rows = []
                for id in sorted_Ids:
                    expr = u"{} = '{}'".format(self.GLOBALID, id)
                    # search one by one to keep ZOrder if any
                    try:
                        with arcpy.da.SearchCursor(bis_catalog, bis_fields_names, where_clause=expr) as cursor:
                            [fields_rows_tmp, vertical_units, directionality] = self.extract_metadata(cursor, bis_fields_names, query_type)
                            fields_rows.append(fields_rows_tmp[0])  # trim nested list
                    except:
                        arcpy.AddWarning("Dataset with GlobalID {} was not found in BisCatalog, skipped.".format(id))
                        continue

            # warning if VerticalUnits or Directionality inconsistent
            if len(vertical_units) > 1:
                arcpy.AddWarning("The data are of different vertical units.")
            if len(directionality) > 1:
                arcpy.AddWarning("The data are of different directionality.")
            # remove "CellSize" from json, this will be assigned after add rasters
            if self.MD_CELL_SIZE in add_md_fields_names:
                add_md_fields_names.remove(self.MD_CELL_SIZE)
            elif self.MD_CELL_SIZE.upper() in add_md_fields_names:
                add_md_fields_names.remove(self.MD_CELL_SIZE.upper())
            # write dataset json
            num_fields = len(add_md_fields_names)
            dictionary = {}
            for i in range(num_fields):
                if add_md_fields_names[i].upper() == self.DATASETPATH.upper():
                    path_list = []
                    for row in fields_rows:
                        path_dict_text = row[i]
                        path, flag = self.extract_path(path_dict_text)
                        if flag:
                            path_list.append(path)
                        else:
                            return
                    dictionary[add_md_fields_names[i]] = path_list
                else:
                    dictionary[add_md_fields_names[i]] = [row[i] for row in fields_rows]
            json_object = json.dumps(dictionary, indent=4, default=str) # convert to string, supporting numeric, text, Date, DateOnly, TimeOnly, GUID
            with open(dataset_json, "w") as outfile:
                outfile.write(json_object)
            return True, dataset_json
        except Exception as ex:
            arcpy.AddError("Exception when generating dataset json - {}.".format(str(ex)))
            return False, None

    def get_unit(self, sr):
        """To get unit of the spatial reference"""
        if sr.type == 'Projected':
            cs_unit = sr.linearUnitName
            cs_coeffPerUnit = sr.metersPerUnit
        elif sr.type == 'Geographic':
            cs_unit = sr.angularUnitName
            cs_coeffPerUnit = sr.radiansPerUnit
        else:
            arcpy.AddError("spatial reference is not a valid type.")
            raise
        return cs_unit, cs_coeffPerUnit

    def output_GP_messages(self, tool_name):
        """Output geoprocessing tools output messages"""
        errors = arcpy.GetMessages(2)
        warnings = arcpy.GetMessages(1)
        output = arcpy.GetMessages(0)
        arcpy.AddMessage('******** Start of Messages from "'+tool_name+'" ********')
        if len(warnings):
            arcpy.AddWarning(str(warnings))
        if len(output):
            arcpy.AddMessage(str(output))
        if len(errors):
            arcpy.AddError(str(errors))
            arcpy.AddMessage('******** End of Messages from "'+tool_name+'" ********')
            if tool_name == "Add Rasters To Mosaic Dataset":
                if "Cannot set input into parameter raster_type" in errors:  # error message for missing custom raster type
                    arcpy.AddError("Bathymetry custom raster type not found. Please copy it to <ArcGIS Pro Installation>\Resources\Raster\Types\ and restart ArcGIS Pro.")
            return False
        arcpy.AddMessage('******** End of Messages from "'+tool_name+'" ********')
        return True

    def check_outwksp(self, out_mosaic, bis_wksp):
        """Check if Target Workspace is same as Input BIS Workspace"""
        flag = False
        try:
            if bis_wksp in out_mosaic:
                arcpy.AddError("The Output Mosaic Dataset should not share the same workspace as Input BIS Workspace. Please designate a different workspace.")
            else:
                flag = True
        except Exception as ex:
            arcpy.AddError("Exception when checking Output Mosaic Dataset - {}.".format(str(ex)))
        return flag
    
    def update_MinPS_MaxPS(self, out_mosaic):
        """Assign MinPS = 0 and MaxPS = 10*HighPS for display, only for rasters."""
        flag = True
        msg = None
        try:
            with arcpy.da.UpdateCursor(out_mosaic, ['MINPS', 'MAXPS', 'HIGHPS', 'CATEGORY']) as cursor:
                for row in cursor:
                    if row[3] == 1: # non-overviews
                        if row[0] != 0 or row[1] != 10 * row[2]:
                            row[0] = 0
                            row[1] = 10 * row[2]
                            try:
                                cursor.updateRow(row)
                            except:
                                pass
        
        except: # use arcpy.UpdateCursor to handle existing UI edit session in SDE scenario
            try:
                arcpy.env.workspace = os.path.dirname(out_mosaic)
                cursor = arcpy.UpdateCursor(out_mosaic)
                for row in cursor:
                    if row.getValue('CATEGORY') == 1: # non-overviews
                        if row.getValue('MINPS') != 0 or row.getValue('MAXPS') != 10 * row.getValue('HIGHPS'):
                            row.setValue('MINPS', 0)
                            row.setValue('MAXPS', 10 * row.getValue('HIGHPS'))
                            try:
                                cursor.updateRow(row)
                            except Exception as ex:
                                pass
                del cursor, row
                
            except Exception as ex:
                flag = False
                msg = str(ex)
        
        return flag, msg
            


# run the script
if __name__ == '__main__':
    createMD = BISToMosaicDataset()
    createMD.execute()
