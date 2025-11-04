'''
------------------------------------------------------------------------------
MilitaryRasterToMosaicDataset.py
(Easy RPF Importer)
------------------------------------------------------------------------------
requirements: ArcGIS Pro 3.4, ArcGIS AllSource 1.3, Python 3.11
author: ArcGIS AllSource Team
contact: intel@esri.com
company: Esri
------------------------------------------------------------------------------
* 2024-05-30 - mfunk - Initial write-up
------------------------------------------------------------------------------
'''

import os
import sys
import arcpy
import datetime as dt
import traceback

from typing import Any, Literal

from intel.enumerations import RPFTypes
from intel.data_classes import EasyRPFImportResult

from intel.utilities import DEBUG, Logger
from intel.utilities.ErrorHandlers import general_error_logger

from intel.conversion.CADRGFileExtensions import CADRGFileExtensions
from intel.conversion.CIBFileExtensions import CIBFileExtensions

class ImportRPF(object):

    _logger: Logger

    def __init__(self,
        input_folder: str,
        output_gdb: str,
        out_mosaic_basename: str,
        import_rpf_type: list[str],
        append_duplicate_datasets: str,
        ):

        super().__init__()

        self.DEBUG: bool = DEBUG
        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)

        self._input_folder: str = input_folder
        self._output_gdb: str = output_gdb
        self._out_mosaic_basename: str = out_mosaic_basename
        self._import_rpf_type: list[str] = import_rpf_type

        self._append_duplicate_datasets: str = append_duplicate_datasets

        self._input_found_files: list[str] | None = None

        self._DATFilePath: str = self._getDATFilePath()
        self._load_from_DAT: bool = os.path.exists(self._DATFilePath)
        self._dat_file_content: str = ""
        if self._load_from_DAT:
            self._dat_file_content = self._getDATFileContent()
        self._cadrg_file_extensions: list[str] = self._generateCADRGFileExtensions()
        self._cib_file_extensions: list[str] = self._generateCIBFileExtensions()
        self._dted_file_extensions: list[str] = self._generateDTEDFileExtensions()
        self._hre_file_extensions: list[str] = self._generateHREFileExtensions()

        self._op_desc = str(dt.datetime.now())
        self._gcs_wgs_84: arcpy.SpatialReference = arcpy.SpatialReference(4326) #GCS_WGS_1984

    @property
    def input_folder(self) -> str:
        return self._input_folder
    
    @property
    def out_geodatabase(self) -> str:
        return self._output_gdb

    @property
    def out_mosaic_basename(self) -> str:
        return self._out_mosaic_basename
    
    @property
    def import_rpf_type(self) -> list[str]:
        return self._import_rpf_type
    
    @property
    def append_duplicate_datasets(self) -> str:
        return self._append_duplicate_datasets

    def __del__(self):
        pass
    
    @general_error_logger
    def _getDATFilePath(self) -> str:
        install_dir: str = arcpy.GetInstallInfo()['InstallDir']
        return os.path.join(install_dir, r"bin", r"RasterFormats.dat")

    @general_error_logger
    def _getDATFileContent(self) -> list[str]:
        dat_lines: list[str] = []
        with open(self._DATFilePath, 'r') as dat:
            dat_lines = dat.readlines()
            dat.close()
        return dat_lines
    
    @general_error_logger
    def _getFileExtensionsFromDAT(self, lead_string: str) -> list[str]:
        # get the ones that match the input lead string
        formats: list[str] = [i for i in self._dat_file_content if lead_string in i]

        # clean up the extensions from the list
        extensions: list[str] = []
        for s in formats: 
            idx_ex = s.find(r'ex="')
            idx_et = s.find(r'et="')
            s1 = s[idx_ex + 4:idx_et].rstrip().replace('"',"") # subset the file extensions
            l1 = [i.replace("*","").lstrip() for i in s1.split(";")] # drop asterisk and whitespace
            l2 = [i for i in l1 if not i == ""] # DAT file contains several blank spaces
            for j in l2:
                if not j in extensions:
                    extensions.append(j)
        return extensions

    @general_error_logger
    def _generateCADRGFileExtensions(self) -> list[str]:
        exts: list[str] = []
        if self._load_from_DAT:
            lead: str = r'<e on="y" nm="CADRG/ECRG: '
            exts = self._getFileExtensionsFromDAT(lead)
        else:
            cadrg: object = CADRGFileExtensions()
            exts = cadrg.fileExtensions
        # if self.DEBUG:
        #     arcpy.AddMessage(f"CADRG extensions:\n{exts}")
        return exts

    @general_error_logger    
    def _generateCIBFileExtensions(self) -> list[str]:
        exts: list[str] = []
        if self._load_from_DAT:
            lead: str = r'<e on="y" nm="CIB: '
            exts = self._getFileExtensionsFromDAT(lead)
        else:
            cib: object = CIBFileExtensions()
            exts = cib.fileExtensions
        return exts

    @general_error_logger    
    def _generateDTEDFileExtensions(self) -> list[str]:
        exts: list[str] = []
        if self._load_from_DAT:
            lead: str = r'<e on="y" nm="DTED Level '
            exts = self._getFileExtensionsFromDAT(lead)
        else:
            exts = [".dt0", ".dt1", ".dt2"] #, ".dt3", ".dt4", ".dt5"]
        return exts

    @general_error_logger
    def _generateHREFileExtensions(self) -> list[str]:
        exts: list[str] = []
        if self._load_from_DAT:
            lead: str = r'<e on="y" nm="HRE: '
            exts = self._getFileExtensionsFromDAT(lead)
        else:
            exts = [".hr1", ".hr2", ".hr3", ".hr4", ".hr5", ".hr6", ".hr7", ".hr8"]
        return exts

    @general_error_logger
    def _findFilesByExtension(self, extensions_to_find: list[str]) -> list[str]:
        # Walk the folder and look for RPF products
        found_files: list[str] = []

        # find all files so we don't have to walk this again
        if not self._input_found_files:
            self._input_found_files = []
            for root, dirs, files in os.walk(self._input_folder, topdown=True):
                for name in files:
                    self._input_found_files.append(os.path.join(root, name))
        
        # check each file by extension to see if its one we want
        for name in self._input_found_files:
                ext: str = os.path.splitext(name)[1]
                if ext in extensions_to_find:
                    found_files.append(name)

        return found_files

    @general_error_logger    
    def _createMosaicDataset(self, 
                             mosaic_name: str,
                             number_bands: int,
                             pixel_type: str,
                             ) -> str:
        
        sr: arcpy.SpatialReference | None = None
        try:
            # Getting an error if I use map's SR directly
            # Exception: SpatialReference: Get attribute __class__ does not exist
            factory_code = arcpy.mp.ArcGISProject("CURRENT").activeMap.spatialReference.factoryCode
            sr = arcpy.SpatialReference(factory_code)
        except:
            sr = arcpy.env.outputCoordinateSystem

        # last chance to put an SR to anything
        if sr == None:
            sr = self._gcs_wgs_84

        if self.DEBUG:
            arcpy.AddMessage(f"mosaic_name: {mosaic_name}")
            arcpy.AddMessage(f"number_bands: {number_bands}")
            arcpy.AddMessage(f"spatial ref: {sr.name}")
            arcpy.AddMessage(f"type(sr): {type(sr)}")
            arcpy.AddMessage(f"sr.factoryCode: {sr.factoryCode}")
            arcpy.AddMessage(f"pixel type: {pixel_type}")

        res: arcpy.Result = arcpy.management.CreateMosaicDataset(in_workspace=self._output_gdb,
                                                in_mosaicdataset_name=mosaic_name,
                                                coordinate_system=sr,
                                                num_bands=number_bands,
                                                pixel_type=pixel_type,
                                                product_definition="NONE",
                                                # {product_band_definitions},
                                                )

        return res.getOutput(0)

    @general_error_logger
    def _addRastersToMosaic(self, 
                            in_mosaic_dataset: str, 
                            input_rasters: list[str],
                            raster_type: str) -> str:

        loaded_mosaic: str = ""

        # self._create_overview_boundaries: str = create_overview_boundaries
        # self._overwrite_existing_dataset: str = overwrite_existing_datasets
        
        # https://pro.arcgis.com/en/pro-app/latest/tool-reference/data-management/add-rasters-to-mosaic-dataset.htm
        res: arcpy.Result = arcpy.management.AddRastersToMosaicDataset(in_mosaic_dataset=in_mosaic_dataset, 
                                raster_type=raster_type, 
                                input_path=input_rasters, 
                                # {update_cellsize_ranges}, 
                                # {update_boundary}, 
                                # {update_overviews}, 
                                # {maximum_pyramid_levels}, 
                                # {maximum_cell_size}, 
                                # {minimum_dimension}, 
                                spatial_reference=self._gcs_wgs_84, 
                                # {filter}, 
                                sub_folder=True, 
                                duplicate_items_action=self._append_duplicate_datasets,
                                # {build_pyramids}, 
                                # {calculate_statistics}, 
                                # {build_thumbnails}, 
                                operation_description=self._op_desc, 
                                # {force_spatial_reference}, 
                                # {estimate_statistics}, 
                                # {aux_inputs}, 
                                # {enable_pixel_cache}, 
                                # {cache_location},
                                )

        loaded_mosaic: str = res.getOutput(0)    

        return loaded_mosaic

    @general_error_logger
    def _buildMosaic(self,
                     rpf_value: RPFTypes,
                     num_bands: int,
                     pixel_type: str,
                     raster_type: str) -> str:
        
        new_mosaic: str = ""

        basename = self.out_mosaic_basename
        # If there is more than one type selected then 
        # use <basename>_<type> for the mosaic name
        if len(self._import_rpf_type) > 1:
            basename = f"{basename}_{rpf_value}"

        # Create the mosaic
        if self.DEBUG:
            arcpy.AddMessage(f"Creating {rpf_value} mosaic...")
        new_mosaic = self._createMosaicDataset(basename,
                                               num_bands,
                                               pixel_type,
                                               )
        # Add rasters to mosaic
        if self.DEBUG:
            arcpy.AddMessage(f"Loading {rpf_value}...")
        new_mosaic = self._addRastersToMosaic(in_mosaic_dataset=new_mosaic,
                                                input_rasters=self._input_folder,
                                                raster_type=raster_type)

        return new_mosaic

    @general_error_logger
    def importRPF(self) -> EasyRPFImportResult | None:

        try:
            
            result_mosaics: dict[str, str | None] = {"CADRG": None,
                                    "CIB": None,
                                    "DTED": None,
                                    "HRE": None} 
            # CADRG
            if RPFTypes.CADRG.value in self._import_rpf_type:
                cadrg_files = self._findFilesByExtension(self._cadrg_file_extensions)
                if self.DEBUG:
                    arcpy.AddMessage(f"Found {len(cadrg_files)} {RPFTypes.CADRG.value} files.")
                if len(cadrg_files) > 0:
                    cadrg_result: str = self._buildMosaic(RPFTypes.CADRG.value,
                                                          "3",
                                                          '8_BIT_UNSIGNED',
                                                          # "CADRG/ECRG",
                                                          "NITF",
                                                          )
                    result_mosaics[RPFTypes.CADRG.value] = cadrg_result
                else:
                    # <Message><ID>190800</ID><Description>No {0} files found in {1}. {0} mosaic will not be created.</Description></Message> <!-- WARNING-->
                    arcpy.AddWarning(arcpy.GetIDMessage(190800).format(RPFTypes.CADRG.value, self._input_folder))

            # CIB
            if RPFTypes.CIB.value in self._import_rpf_type:
                cib_files = self._findFilesByExtension(self._cib_file_extensions)
                if self.DEBUG:
                    arcpy.AddMessage(f"Found {len(cib_files)} {RPFTypes.CIB.value} files.")
                if len(cib_files) > 0:
                    result_mosaics[RPFTypes.CIB.value] = self._buildMosaic(RPFTypes.CIB.value,
                                                        "1",
                                                        '8_BIT_UNSIGNED',
                                                        RPFTypes.CIB.value,
                                                        )
                else:
                    arcpy.AddWarning(arcpy.GetIDMessage(190800).format(RPFTypes.CIB.value, self._input_folder))


            # DTED
            if RPFTypes.DTED.value in self._import_rpf_type:
                dted_files = self._findFilesByExtension(self._dted_file_extensions)
                if self.DEBUG:
                    arcpy.AddMessage(f"Found {len(dted_files)} {RPFTypes.DTED.value} files.")
                if len(dted_files) > 0:                
                    result_mosaics[RPFTypes.DTED.value] = self._buildMosaic(RPFTypes.DTED.value,
                                                        "1",
                                                        '16_BIT_SIGNED',
                                                        RPFTypes.DTED.value,
                                                        )
                else:
                    arcpy.AddWarning(arcpy.GetIDMessage(190800).format(RPFTypes.DTED.value, self._input_folder))

            # HRE
            if RPFTypes.HRE.value in self._import_rpf_type:
                hre_files = self._findFilesByExtension(self._hre_file_extensions)
                if self.DEBUG:
                    arcpy.AddMessage(f"Found {len(hre_files)} {RPFTypes.HRE.value} files.")
                if len(hre_files) > 0:   
                    result_mosaics[RPFTypes.HRE.value] = self._buildMosaic(RPFTypes.HRE.value,
                                                        "1",
                                                        '32_BIT_FLOAT',
                                                        RPFTypes.HRE.value,
                                                        )           
                else:
                    arcpy.AddWarning(arcpy.GetIDMessage(190800).format(RPFTypes.HRE.value, self._input_folder))

            return EasyRPFImportResult(result_mosaics, False, None)

        except arcpy.ExecuteError:
            err_msg = arcpy.GetMessages(2)
            return EasyRPFImportResult(result_mosaics, True, err_msg)

        except Exception:
            tb: traceback.TracebackType | None = sys.exc_info()[2]
            tbinfo: str = traceback.format_tb(tb)[0]
            pymsg: str = '{}\n{}\n{}'.format(tbinfo,
                                        str(sys.exc_info()[1]),
                                        arcpy.GetMessages(2))
            return EasyRPFImportResult(result_mosaics, True, pymsg)
