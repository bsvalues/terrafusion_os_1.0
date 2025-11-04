import os
import arcpy

class CreateBIS(object):
    """--------------------------------------------------------------------------------------------
    Tool:               Create BIS
    Source Name:        createbis.py
    Author:             Esri, Inc.
    Usage:              arcpy.CreateBIS(Target Workspace,
                                        Bis Catalog Template,
                                        Proxy Raster Location,
                                        Coordinate System,
                                        Configuration Keyword)
    Required Arguments: Target Workspace
                        Bis Catalog Template
                        Proxy Raster Location
    Optional Arguments: Coordinate System
                        Configuration Keyword
    Derived  Arguments: Output BIS
    Description:        Creates a Bathymetric Information System (BIS) in a designated geodatabase workspace.
    --------------------------------------------------------------------------------------------"""

    def __init__(self):
        self.label = "Create BIS"
        self.description = "Create the BIS (or Bathymetric Information System), a Catalog Dataset containing the minimum BIS schema."
        self.canRunInBackground = False
        self.BIS_CATALOG = 'BisCatalog'
        self.BIS_DETAILS = 'BisDetails'
        self.BIS_BDI = 'BisBDI'
        self.GLOBALID = 'GlobalID'
        self.DATATYPE = 'DataType'
        self.DEFAULT_COORDINATE_SYSTEM = 4326
        self.SPATIAL_REF = None
        self.HAS_Z = "DISABLED"

    def execute(self):
        try:
            #######################################
            # Get and validate input parameters
            #######################################

            # Target Workspace
            target_wksp = arcpy.GetParameterAsText(0)
            if not target_wksp:
                arcpy.AddError("No Target Workspace specified.")
                return
            if not self.check_wksp(target_wksp):
                return

            # BIS Catalog Template
            bis_template = arcpy.GetParameterAsText(1)
            if not bis_template:
                arcpy.AddError("No BIS Catalog Template specified.")
                return
            if not self.check_template(bis_template):
                return

            # Proxy Raster Location
            proxy_path = arcpy.GetParameterAsText(2)
            if not proxy_path:
                arcpy.AddError("No Proxy Raster Location specified")
                return

            # Coordinate System (optional); Default Coordinate system is WGS 1984 GCS
            coordsys = arcpy.GetParameterAsText(3)
            [sr, flag] = self.check_coord_sys(coordsys, self.DEFAULT_COORDINATE_SYSTEM)
            if not flag:
                return

            # Configuration Keyword (optional)
            c_keyword = arcpy.GetParameterAsText(4)

            # Verify that the target workspace has Bathymetry domains, otherwise create them.
            self.checkForBathymetryDomains(target_wksp, bis_template)

            #######################################
            # Create the BisCatalog
            #######################################

            # Create the BisCatalog using CreateCatalogDataset
            out_catalog = arcpy.management.CreateCatalogDataset(out_path=target_wksp, out_name=self.BIS_CATALOG,
                                                                template=bis_template, has_z=self.HAS_Z, spatial_reference=sr,
                                                                out_alias=self.BIS_CATALOG, config_keyword=c_keyword)

            # Output any messages returned from Create Catalog Dataset
            if (not self.outputExternalGPMessages("Create Catalog Dataset")):
                return            

            #######################################
            # Set value to derived parameters
            #######################################
            arcpy.SetParameter(5, target_wksp)

            #######################################
            # Set Datatype to non-nullable
            #######################################
            field_names = self.setDataTypeFieldNonNullable(out_catalog)
            
            #######################################
            # Set the BisCatalog as versioned for SDE
            #######################################
            self.versionBisCatalog(target_wksp, out_catalog)

            #######################################
            # Create the BisDetails Table
            #######################################
            self.createBisDetails(target_wksp, proxy_path, field_names)

            #######################################
            # Create the BisBDI Mosaic Dataset
            #######################################
            self.createBisBDI(target_wksp, sr)

        except Exception as ex:
            arcpy.AddError("Error in executing Create BIS - {}".format(str(ex)))
            return

    def check_wksp(self, wksp):
        tw = wksp.lower()
        if tw.endswith(".gdb") or tw.endswith(".sde"):
            if arcpy.Exists(wksp):
                return True
            else:
                arcpy.AddIDMessage("ERROR", 732, "Target Workspace", wksp)  # %1: Dataset %2 does not exist or is not supported
                return False
        else:
            arcpy.AddIDMessage("ERROR", 90110)  # The workspace is not valid.
            return False

    def check_template(self, template):
        desc = arcpy.Describe(template)
        if desc.dataType != "Table" and desc.dataType != "TableView":
            arcpy.AddIDMessage("ERROR", 260013)  # Invalid input format. Only feature classes and tables are supported.
            return False
        fields = arcpy.ListFields(template)
        field_names = [f.name.upper() for f in fields]  # sde fields names are upper case
        if self.GLOBALID.upper() not in field_names:
            arcpy.AddIDMessage("ERROR", 20009, template)  # Invalid input data %s.
            return False
        return True

    def check_coord_sys(self, coordsys, default_coordsys):
        if coordsys:
            try:
                sref = arcpy.SpatialReference()
                sref.loadFromString(coordsys)
                sr = sref
                return sr, True
            except:
                arcpy.AddIDMessage("ERROR", 519)  # Undefined output coordinate system.
                return None, False
        else:
            sr = arcpy.SpatialReference(default_coordsys)
            return sr, True

    def checkForBathymetryDomains(self, target_wksp, bis_template):
        template_wksp = self.get_template_wksp(bis_template)
        domains = arcpy.da.ListDomains(template_wksp)
        if domains:
            for domain in domains:
                table = 'memory/table_{}'.format(domain.name)
                if arcpy.Exists(table):
                    arcpy.Delete_management(table)
                if not arcpy.Exists(table):
                    arcpy.management.DomainToTable(template_wksp, domain.name, table, 'Code',
                                                   'Description', '')
                    arcpy.management.TableToDomain(table, 'Code', 'Description', target_wksp,
                                                   domain.name, domain.description, "REPLACE")
        else:
            arcpy.AddWarning("Failed to get domains from template")

    def get_template_wksp(self, template):
        wksp = os.path.dirname(template)
        if [any(ext) for ext in ('.gdb', '.sde', '.geodatabase') if ext in os.path.splitext(wksp)]:
            return wksp
        else:
            # template was in feature dataset
            return os.path.dirname(wksp)

    def setDataTypeFieldNonNullable(self, out_catalog):
        fields = arcpy.ListFields(out_catalog)
        field_names = [f.name for f in fields]
        field_names_upper = [f.name.upper() for f in fields]  # sde fields names are upper case
        if self.DATATYPE.upper() in field_names_upper:
            arcpy.management.AlterField(in_table=out_catalog, field=self.DATATYPE, field_is_nullable="NON_NULLABLE")
        return field_names

    def getDisplayFields(self, field_names):
        ignore_list = ['OBJECTID', 'SHAPE', 'CD_ITEMSOURCE', 'CD_ITEMTYPE', 'CD_MINSCALE', 'CD_MAXSCALE', 'CD_DRAWORDER', 'CD_SHAPEHEIGHT', 'SHAPE_LENGTH', 'SHAPE.LEN', 'SHAPE_AREA', 'SHAPE.AREA',
                       'ST_AREA(SHAPE)', 'ST_LENGTH(SHAPE)', 'SHAPE.STAREA()', 'SHAPE.STLENGTH()', 'GLOBALID', 'PROXYRASTERPATH', 'BAG_ABSTRACT', 'BAG_PURPOSE', 'BAG_USECONSTRAINTS',
                       'BAG_OTHERCONSTRAINTS', 'S102_EPOCH', 'S102_ISO_METADATA', 'S102_XC_DATETIME', 'S102_XC_CONTACT', 'S102_DD_DESCRIPTION', 'S102_DD_DATASETID', 'S102_DD_COPYRIGHT', 
                       'S102_DD_CLASSIFICATION', 'S102_DD_PURPOSE', 'S102_DD_NOTFORNAVIGATION', 'S102_DD_EDITIONNUMBER']  # exclude some catalog dataset schema, shape related fields, GlobalID, ProxyRasterPath, and some BAG or S-102 fields per issue #5596
        display_list = []
        for f in field_names:
            if f.upper() not in ignore_list:
                display_list.append(f)
        display_fields = ','.join(display_list)
        return display_fields
        
    def versionBisCatalog(self, target_wksp, out_catalog):
        try:
            # only apply versioning to SDE workspaces
            desc = arcpy.Describe(target_wksp)
            if desc.workspaceType != 'RemoteDatabase':
                return None
            
            arcpy.management.RegisterAsVersioned(out_catalog)
            self.outputExternalGPMessages("RegisterAsVersioned")
            
        except Exception as ex:
            arcpy.AddError("Error in executing Version BisCatalog - {}".format(str(ex)))
            return None

    def createBisDetails(self, target_wksp, proxy_path, field_names):
        try:
            # create the empty table, add the required fields, and add a single row
            # with the workspace name, (optional) proxy raster location, and version number 1.
            bis_details_tbl = arcpy.management.CreateTable(out_path=target_wksp, out_name=self.BIS_DETAILS, out_alias=self.BIS_DETAILS)
            self.outputExternalGPMessages("CreateTable")

            arcpy.AddGlobalIDs_management(bis_details_tbl)
            self.outputExternalGPMessages("AddGlobalIDs_management")

            arcpy.management.AddFields(bis_details_tbl,
                                       [['Name', 'TEXT', 'Name', 255],
                                        ['ProxyRasterLocation', 'TEXT', 'Proxy Raster Location', 255],
                                        ['FieldsToDisplay', 'TEXT', 'Fields To Display', 3000],
                                        ['Version', 'SHORT', 'Version']])
            self.outputExternalGPMessages("AddFields")

            cursor = arcpy.da.InsertCursor(bis_details_tbl, ("Name", "ProxyRasterLocation", "FieldsToDisplay", "Version"))
            wkspName = self.getTrimmedWkspName(target_wksp)
            display_fields = self.getDisplayFields(field_names)
            if proxy_path is not None or display_fields is not None:
                cursor.insertRow((wkspName, proxy_path, display_fields, 1))
            else:
                cursor.insertRow((wkspName, None, None, 1))
            del cursor
            # add an attribute rule to limit the table to one row
            arcpy.management.AddAttributeRule(
                in_table=bis_details_tbl,
                name='Disable Inserting or Deleting Rows',
                type='CONSTRAINT',
                script_expression='return false',
                triggering_events='INSERT;DELETE',
                error_number=1001,
                error_message='BisDetails does not allow inserting or deleting rows.'
            )
            self.outputExternalGPMessages("AddAttributeRule")
        except Exception as ex:
            arcpy.AddError("Error in executing Create BisDetails - {}".format(str(ex)))
            return None

    def getTrimmedWkspName(self, target_wksp):
        startIndex = target_wksp.rfind('\\') + 1
        endIndex = target_wksp.rfind('.')
        return target_wksp[startIndex:endIndex]

    def createBisBDI(self, target_wksp, sr):
        try:
            bis_bdi = arcpy.management.CreateMosaicDataset(target_wksp, self.BIS_BDI, sr, 2, "32_BIT_FLOAT", "NONE", None)
            self.outputExternalGPMessages("CreateMosaicDataset")
            arcpy.management.AlterMosaicDatasetSchema(
                in_mosaic_dataset=bis_bdi, side_tables="BOUNDARY;LEVELS;LOG;OVERVIEW", raster_type_names=None, editor_tracking="NO_EDITOR_TRACKING")
            self.outputExternalGPMessages("AlterMosaicDatasetSchema")
            arcpy.management.AddField(in_table=bis_bdi, field_name="BisDatasetId", field_type="GUID", field_precision=None, field_scale=None, field_length=None,
                                      field_alias="BisDatasetId", field_is_nullable="NULLABLE", field_is_required="REQUIRED", field_domain="")
            self.outputExternalGPMessages("AddField")
        except Exception as ex:
            arcpy.AddError("Error in executing Create BisBDI - {}".format(str(ex)))
            return None

    def outputExternalGPMessages(self, toolName):
        errors = arcpy.GetMessages(2)
        warnings = arcpy.GetMessages(1)
        output = arcpy.GetMessages(0)
        if (not (len(warnings) or len(errors))):
            return True
        arcpy.AddMessage('******** Start of Messages from "'+toolName+'" ********')
        if len(warnings):
            arcpy.AddWarning(str(warnings))
        if len(output):
            arcpy.AddMessage(str(output))
        if len(errors):
            arcpy.AddError(str(errors))
            arcpy.AddMessage('******** End of Messages from "'+toolName+'" ********')
            return False
        arcpy.AddMessage('******** End of Messages from "'+toolName+'" ********')
        return True


# run the script
if __name__ == '__main__':
    createBIS = CreateBIS()
    createBIS.execute()
