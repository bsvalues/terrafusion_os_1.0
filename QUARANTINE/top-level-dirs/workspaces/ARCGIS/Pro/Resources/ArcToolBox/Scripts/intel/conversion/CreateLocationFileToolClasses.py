'''
------------------------------------------------------------------------------
CreateLocationFileToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.8, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2021-02-22 - jjones - Initial write-up
------------------------------------------------------------------------------
'''
import arcpy
import os

from intel.enumerations import Gazetteer
from intel.enumerations import TOOL_CATEGORY_CONVERSION
from intel.conversion.CreateLocationFile import LocationFile

class CreateLocationFileFromTextFile(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create Location File From Text File"
        self.description = "Creates a Location File for use in LocateXT from a text file from GeoNames, National Geospatial-Intelligence Agency Geonet Names Server, or US Geological Survey Geographic Names Information Service."
        self.category = TOOL_CATEGORY_CONVERSION
        self.helpContext = 73040003

    def getParameterInfo(self):
        """Define parameter definitions"""
        
        in_placenames_file = arcpy.Parameter(
            displayName="Input Placenames File",
            name="in_placenames_file",
            datatype="DEFile",
            parameterType="Required",
            direction="Input")

        in_placenames_file.filter.list = ['txt']

        data_source = arcpy.Parameter(
            displayName="Data Source",
            name="data_source",
            datatype="GPString",
            parameterType="Required",
            direction="Input")

        data_source_list = [
            Gazetteer.GEONAMES.value, 
            Gazetteer.NGA_GNS.value, 
            Gazetteer.USGS_GNIS.value,
            Gazetteer.USGS_ANT.value,
            ]
        
        data_source.type = 'ValueList'
        data_source.filter.list = data_source_list
        data_source.value = data_source_list[0]

        out_location_file = arcpy.Parameter(
            displayName="Output Location File",
            name="out_location_file",
            datatype="DEFile",
            parameterType="Required",
            direction="Output")

        include_features = arcpy.Parameter(
            displayName="Include Features",
            name="include_features",
            datatype="GPString",
            parameterType="Optional",
            direction="Input",
            multiValue=True)

        include_features.filter.type = 'ValueList'
        include_features.filter.list = [
            Gazetteer.ADMIN.value,
            Gazetteer.HYDRO.value,
            Gazetteer.GEN.value,
            Gazetteer.POP.value,
            Gazetteer.TRANS.value,
            Gazetteer.PT.value,
            Gazetteer.TERR.value,
            Gazetteer.SEA.value,
            Gazetteer.VEG.value,
        ]

        in_rois = arcpy.Parameter(
            displayName="Input Regions Of Interest",
            name="in_rois",
            datatype="GPFeatureLayer",
            parameterType="Optional",
            direction="Input")
 
        return [
            in_placenames_file,
            data_source,
            out_location_file,
            include_features,
            in_rois,
        ]

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        
        if parameters[2].altered and not parameters[2].valueAsText.endswith('.lxtgaz'):
            parameters[2].value = os.path.splitext(parameters[2].valueAsText)[0] + ".lxtgaz"
        
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return
   
    def execute(self, parameters, messages):
        try:    
            in_placenames_file = parameters[0].valueAsText
            data_source = parameters[1].valueAsText
            out_location_file = parameters[2].valueAsText
            include_features = parameters[3].valueAsText
            in_rois = parameters[4].valueAsText

            arcpy.AddMessage(f"Include Features:  {include_features}")

            if include_features and type(include_features) == str:
                features = include_features.split(";")
            elif include_features and type(include_features) == list:
                features = include_features
            else:
                features = None

            lf = LocationFile(in_placenames_file=in_placenames_file,
                              data_source=data_source,
                              out_location_file=out_location_file,
                              include_features=features,
                              in_rois=in_rois,
                            )

            result = lf.create()

            if not result.empty_output:
                arcpy.SetParameter(2, result.location_file)

            if result.error:
                arcpy.AddError(result.error_message)
        
        except Exception:
            import sys
            import traceback
            
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}'.format(tbinfo,
                                        str(sys.exc_info()[1]),
                                        arcpy.GetMessages(2))

            arcpy.AddError(pymsg)

        return