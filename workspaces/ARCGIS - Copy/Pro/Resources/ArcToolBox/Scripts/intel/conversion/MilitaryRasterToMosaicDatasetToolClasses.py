'''
------------------------------------------------------------------------------
MilitaryRasterToMosaicDatasetToolClasses.py
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
import arcpy
import os
import sys
import traceback

from intel.enumerations import RPFTypes, AllowDuplicates
from intel.enumerations import TOOL_CATEGORY_CONVERSION

from intel.utilities import DEBUG, Logger
#from intel.utilities.ErrorHandlers import general_error_logger

from intel.conversion.MilitaryRasterToMosaicDataset import ImportRPF

class MilitaryRasterToMosaicDataset(object):

    _logger: Logger

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Military Raster To Mosaic Dataset"
        self.category = TOOL_CATEGORY_CONVERSION
        self.helpContext = 73040004

        self.DEBUG: str = DEBUG
        self.logger = Logger()
        self.logger.create_logger(self.__class__.__name__)

    def getParameterInfo(self):
        """Define parameter definitions"""

        # input_folder
        input_folder: arcpy.Parameter = arcpy.Parameter(
            displayName="Input Folder",
            name="in_folder",
            datatype="DEFolder",
            parameterType="Required",
            direction="Input",
            )

        # out_geodatabase
        output_gdb: arcpy.Parameter = arcpy.Parameter(
            name='target_geodatabase',
            displayName='Target Geodatabase',
            datatype='DEWorkspace',
            parameterType='Required',
            direction='Input',
            )
        output_gdb.value = arcpy.env.workspace

        # output_mosaic_basename
        out_mosaic_basename: arcpy.Parameter = arcpy.Parameter(
            displayName="Output Mosaic Basename",
            name="output_mosaic_basename",
            datatype="GPString",
            parameterType="Required",
            direction="Input",
            )
        
        # import_format
        import_format: arcpy.Parameter = arcpy.Parameter(
            displayName="Import Format",
            name="import_format",
            datatype="GPString",
            parameterType="Required",
            direction="Input",
            multiValue=True
            )
        
        import_format.type = 'ValueList'
        import_format.filter.list = [
            RPFTypes.CADRG.value,
            RPFTypes.CIB.value,
            RPFTypes.DTED.value,
            RPFTypes.HRE.value,
            ]

        allow_duplicate_datasets_list: list[str] = [
            AllowDuplicates.EXCLUDE.value,
            AllowDuplicates.ALLOW.value,
            AllowDuplicates.OVERWRITE.value,
            ]

        # allow_duplicate_datasets
        allow_duplicate_datasets: arcpy.Parameter = arcpy.Parameter(
            displayName="Allow Duplicate Datasets",
            name="allow_duplicate_datasets",
            datatype="GPString",
            parameterType="Required",
            direction="Input",
        )

        allow_duplicate_datasets.type = 'ValueList'
        allow_duplicate_datasets.filter.list = allow_duplicate_datasets_list
        allow_duplicate_datasets.value = allow_duplicate_datasets_list[0]

        # out_cadrg_mosaic
        out_cadrg_mosaic: arcpy.Parameter = arcpy.Parameter(
            displayName="Output CADRG Mosaic",
            name="out_cadrg_mosaic",
            datatype="GPString",
            parameterType="Derived",
            direction="Output",
        )

        # out_cib_mosaic
        out_cib_mosaic: arcpy.Parameter = arcpy.Parameter(
            displayName="Output CIB Mosaic",
            name="out_cib_mosaic",
            datatype="GPString",
            parameterType="Derived",
            direction="Output",
        )

        # out_dted_mosaic
        out_dted_mosaic: arcpy.Parameter = arcpy.Parameter(
            displayName="Output DTED Mosaic",
            name="out_dted_mosaic",
            datatype="GPString",
            parameterType="Derived",
            direction="Output",
        )

        # out_hre_mosaic
        out_hre_mosaic: arcpy.Parameter = arcpy.Parameter(
            displayName="Output HRE Mosaic",
            name="out_hre_mosaic",
            datatype="GPString",
            parameterType="Derived",
            direction="Output",
        )

        return [input_folder,
            output_gdb,
            out_mosaic_basename,
            import_format,
            allow_duplicate_datasets,
            out_cadrg_mosaic,
            out_cib_mosaic,
            out_dted_mosaic,
            out_hre_mosaic,
            ]

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        # Licensed for Pro - Standard and Pro - Advanced, but not for Pro - Basic"
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.CheckProduct("ArcEditor") in license_available or arcpy.CheckProduct("ArcInfo") in license_available:
                return True
            else:
                return False
        except Exception:
            return False

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        # Check output_gdb and output_basename to make sure it does not exist

        # if rftype is ALL, check that output_gdb, plus output_basename_CADRG,
        # output_basename_CIB, and output_basename_DTED do not exist.

        output_gdb = parameters[1].valueAsText
        out_mosaic_basename = parameters[2].valueAsText
        import_rpf_type = parameters[3].valueAsText

        #check basename is valid (no invalid characters)
        char_error_msg: str = arcpy.GetIDMessage(190801)
        if parameters[2].altered:
            valid_fname = arcpy.ValidateTableName(out_mosaic_basename, output_gdb)
            if out_mosaic_basename != valid_fname:
                parameters[2].setErrorMessage(char_error_msg.format(valid_fname))

        # check for existence of output
        if parameters[1].altered or \
            (parameters[2].altered or parameters[2].hasBeenValidated):

            check_messages: list[str] = []
            # <Message><ID>605</ID><Description>Output %1 already exists within %2.</Description></Message>
            output_exists_msg: str = arcpy.GetIDMessage(258)

            if import_rpf_type: # if checkboxes have been checked
                selected_types = import_rpf_type.split(";")
                if len(selected_types) > 1:

                    fs: list[str] = [f"{out_mosaic_basename}_{j}" for j in selected_types]
                    for f in fs:
                        if arcpy.Exists(os.path.join(output_gdb, f)):
                            check_messages.append(os.path.join(output_gdb, f))
                else:
                    f = os.path.join(output_gdb, out_mosaic_basename)
                    if arcpy.Exists(os.path.join(output_gdb, f)):
                        check_messages.append(f)
                
                if len(check_messages) > 0:
                    out_msg: str = ""
                    for i in check_messages:
                        out_msg += output_exists_msg % (i) + "\n\n"
                    parameters[2].setErrorMessage(out_msg)

        return

    def execute(self, parameters, messages):
        has_project: bool = False
        has_cadrg: bool = False
        has_cib: bool = False
        has_dted: bool = False
        has_hre: bool = False

        try:    
            input_folder = parameters[0].valueAsText
            output_gdb = parameters[1].valueAsText
            out_mosaic_basename = parameters[2].valueAsText
            import_rpf_type = parameters[3].valueAsText.split(";")
            allow_duplicate_datasets = parameters[4].valueAsText
            out_cadrg_mosaic = parameters[5].valueAsText
            out_cib_mosaic = parameters[6].valueAsText
            out_dted_mosaic = parameters[7].valueAsText
            out_hre_mosaic = parameters[8].valueAsText

            eri = ImportRPF(input_folder,
                                output_gdb,
                                out_mosaic_basename,
                                import_rpf_type,
                                allow_duplicate_datasets,
                                )

            result = eri.importRPF()

            if result.error:
                arcpy.AddError(result.error_message)

            if result.output_mosaics[RPFTypes.CADRG.value]:
                has_cadrg = True
            if result.output_mosaics[RPFTypes.CIB.value]:
                has_cib = True
            if result.output_mosaics[RPFTypes.DTED.value]:
                has_dted = True
            if result.output_mosaics[RPFTypes.HRE.value]:
                has_hre = True

            try:
                if has_cadrg or has_cib or has_dted or has_hre:
                    as_project: arcpy.mp.ArcGISProject = arcpy.mp.ArcGISProject('CURRENT')
                    active_map: arcpy.mp.Map = as_project.activeMap
                    has_project = True
                    layer_arrange: str = "AUTO_ARRANGE"
                    if self.DEBUG:
                        arcpy.AddMessage(f"adding group layer to active map...")
                    group_layer: arcpy.mp.Layer = active_map.createGroupLayer(out_mosaic_basename)
                else:
                    # Warning empty output.
                    
                    if self.DEBUG:
                        arcpy.AddMessage(f"empty output, no mosaics to add to map.")
            except:
                pass


            if has_dted:
                arcpy.SetParameter(7, result.output_mosaics[RPFTypes.DTED.value])
                if has_project:
                    layer_name: str = f"{out_mosaic_basename} ({RPFTypes.DTED.value})"
                    dted_layer: arcpy.mp.Layer = arcpy.management.MakeMosaicLayer(result.output_mosaics[RPFTypes.DTED.value],
                                                                                  layer_name).getOutput(0)
                    active_map.addLayerToGroup(group_layer, dted_layer, layer_arrange)

            if has_hre:
                arcpy.SetParameter(8, result.output_mosaics[RPFTypes.HRE.value])
                if has_project:
                    layer_name: str = f"{out_mosaic_basename} ({RPFTypes.HRE.value})"
                    hre_layer: arcpy.mp.Layer = arcpy.management.MakeMosaicLayer(result.output_mosaics[RPFTypes.HRE.value],
                                                                                 layer_name).getOutput(0)
                    active_map.addLayerToGroup(group_layer, hre_layer, layer_arrange)    

            if has_cib:
                arcpy.SetParameter(6, result.output_mosaics[RPFTypes.CIB.value])
                if has_project:
                    layer_name: str = f"{out_mosaic_basename} ({RPFTypes.CIB.value})"
                    cib_layer: arcpy.mp.Layer = arcpy.management.MakeMosaicLayer(result.output_mosaics[RPFTypes.CIB.value],
                                                                                 layer_name).getOutput(0)
                    active_map.addLayerToGroup(group_layer, cib_layer, layer_arrange)

            if has_cadrg:
                arcpy.SetParameter(5, result.output_mosaics[RPFTypes.CADRG.value])
                if has_project:
                    layer_name: str = f"{out_mosaic_basename} ({RPFTypes.CADRG.value})"
                    cadrg_layer: arcpy.mp.Layer =  arcpy.management.MakeMosaicLayer(result.output_mosaics[RPFTypes.CADRG.value],
                                                                                    layer_name).getOutput(0)
                    active_map.addLayerToGroup(group_layer, cadrg_layer, layer_arrange)

        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))

        except Exception:
            tb: traceback.TracebackType | None = sys.exc_info()[2]
            tbinfo: str = traceback.format_tb(tb)[0]
            pymsg: str = '{}\n{}\n{}'.format(tbinfo,
                                        str(sys.exc_info()[1]),
                                        arcpy.GetMessages(2))

            arcpy.AddError(pymsg)
        return
