from xml.etree.ElementTree import TreeBuilder
import arcpy as ARCPY
import arcpy.nax as NAX
import os as OS
import sys as SYS
import SSDataObject as SSDO
import SSUtilities as UTILS
import WeightsUtilities as WU
import locale as LOCALE
import numpy as NUM
from SSHelperFunctions import *


class Toolbox(object):
    def __init__(self):
        self.label = "Spatial Statistics Tools"
        self.alias = "stats"
        self.helpContext = 50
        self.tools = [HighLowClustering,SpatialAutocorrelation,ClustersOutliers,HotSpots,
                      CentralFeature,DirectionalMean,CalculateAreas,ExportXYv,
                      MultiDistanceSpatialClustering,CalculateDistanceBand,
                      AverageNearestNeighbor,DirectionalDistribution,MeanCenter,
                      StandardDistance,CollectEvents,GeographicallyWeightedRegression,
                      OrdinaryLeastSquares,GWR,MGWR,GeneralizedLinearRegression,ConvertSpatialWeightsMatrixtoTable,
                      MedianCenter,GroupingAnalysis,ExploratoryRegression,
                      IncrementalSpatialAutocorrelation,OptimizedHotSpotAnalysis,
                      SimilaritySearch,GenerateNetworkSpatialWeights,
                      GenerateNetworkSWM,OptimizedOutlierAnalysis,
                      GenerateSpatialWeightsMatrix,DensityBasedClustering,
                      SpatiallyConstrainedMultivariateClustering,MultivariateClustering,
                      LocalBivariateRelationships,BuildBalancedZones,
                      SpatialAssociationBetweenZones, NeighborhoodSummaryStatistics, TimeSeriesSmoothing,
                      ConvertSSPopup, CausalInferenceAnalysis,
                      # CalculateSpatialExplanatoryVariables,
                      CompareNeighborhoodConceptualizations,
                      DecomposeSpatialStructure, FilterSpatialAutocorrelationFromField, CreateSpatialComponentExplanatoryVariables]

        self.tools.append(ColocationAnalysis)
        self.tools.append(DimensionReduction)
        self.tools.append(SpatialOutlierDetection)
        self.tools.append(PresenceOnlyPrediction)
        self.tools.append(PredictUsingSSMFile)
        self.tools.append(HotSpotAnalysisComparison)
        self.tools.append(SetSSMFileProperties)
        self.tools.append(CalculateCompositeIndex)
        self.tools.append(DescribeSSMFile)
        self.tools.append(CalculateRates)
        self.tools.append(AttributeUncertainty)
        self.tools.append(DirectionalTrend)
        self.tools.append(BivariateSpatialAssociation)

class HighLowClustering(object):
    def __init__(self):
        self.label = "High/Low Clustering (Getis-Ord General G)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Analyzing Patterns"
        self.helpContext = 9010001
        self.params = None
        #### Set Lists of Spatial Concepts ####
        self.baseConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        self.allConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "CONTIGUITY_EDGES_ONLY",
                             "CONTIGUITY_EDGES_CORNERS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        self.distanceConcepts = self.baseConcepts[0:4]
        self.currentConcepts = [ i for i in self.baseConcepts ]
        self.distanceTypes = ["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"]
        self.rowTypes = ["ROW", "NONE"]

        #### Define Default Values ####
        self.defaultIndexList = [3, 4, 5]
        self.defaultValueList = ['INVERSE_DISTANCE', 'EUCLIDEAN_DISTANCE', 
                                 'ROW']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point','Multipoint','Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Input Field",
                            name = "Input_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double', 'BigInteger']

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Generate Report",
                            name = "Generate_Report",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['GENERATE_REPORT','NO_REPORT']

        param3 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                            name = "Conceptualization_of_Spatial_Relationships",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param3.filter.type = "ValueList"

        param3.filter.list = ['INVERSE_DISTANCE','INVERSE_DISTANCE_SQUARED',
                              'FIXED_DISTANCE_BAND','ZONE_OF_INDIFFERENCE',
                              'K_NEAREST_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']

        param3.value = 'INVERSE_DISTANCE'

        param4 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.type = "ValueList"

        param4.filter.list = ['EUCLIDEAN_DISTANCE','MANHATTAN_DISTANCE']

        param4.value = 'EUCLIDEAN_DISTANCE'

        param5 = ARCPY.Parameter(displayName="Standardization",
                            name = "Standardization",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param5.filter.type = "ValueList"

        param5.filter.list = ['NONE','ROW']

        param5.value = 'ROW'

        param6 = ARCPY.Parameter(displayName="Distance Band or Threshold Distance",
                            name = "Distance_Band_or_Threshold_Distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "Range"
        param6.filter.list = [0.0,999999999999999.0]

        param7 = ARCPY.Parameter(displayName="Weights Matrix File",
                            name = "Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = ['swm', 'gwt', 'txt']
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Observed General G",
                            name = "Observed_General_G",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param9 = ARCPY.Parameter(displayName="ZScore",
                            name = "ZScore",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param10 = ARCPY.Parameter(displayName="PValue",
                            name = "PValue",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param11 = ARCPY.Parameter(displayName="Report File",
                            name = "Report_File",
                            datatype = "DEFile",
                            parameterType = "Derived",
                            direction = "Output")
        #param11.filter.list = ['html'] ##issue
        param11.enabled = False

        #### User Defined with Number of Neighbors Parameters (Required) ####
        param12 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param12.filter.type = "Range"
        param12.filter.list = [2, 1000]
        param12.enabled = False

        return [param0,param1,param2,param3,param4,param5,param6,
                param7,param8,param9,param10,param11,param12]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        if self.params[0].altered:
            if not self.params[0].isInputValueDerived():
                self.checkContiguity(self.params[0].value)
        
        if self.params[4].altered:
            value4 = self.params[4].value.upper().replace(" ", "_")
            if value4 in swapType:
                self.params[4].value = swapType[value4]

        #### Enable Type of Distance Measure if Appropriate ####
        if self.params[3].altered:
            value3 = self.params[3].value.upper().replace(" ", "_")
            if value3 == "POLYGON_CONTIGUITY_(FIRST_ORDER)":
                value3 = "CONTIGUITY_EDGES_ONLY"
                self.params[3].value = value3
            if value3 in self.distanceConcepts:
                self.params[4].enabled = 1
                self.params[6].enabled = 1
            else:
                self.params[4].enabled = 0
                self.params[6].enabled = 0

            if value3 == "GET_SPATIAL_WEIGHTS_FROM_FILE":
                self.params[7].enabled = 1
                self.params[5].enabled = 0
            else:
                self.params[7].enabled = 0
                self.params[5].enabled = 1

            if value3 == "K_NEAREST_NEIGHBORS":
                self.params[12].enabled = 1
                if not self.params[12].value:
                    self.params[12].value = 8
            else:
                clearParameter(self.params[12])

    def updateMessages(self, parameters):
        self.params = parameters
        if self.params[3].hasError():
            value3 = self.params[3].value.upper().replace(" ", "_")
            if value3 in self.currentConcepts:
                self.params[3].clearMessage()
            if value3.count("CONTIGUITY"):
                self.params[3].clearMessage()

        #### Required SWM or KNN ####
        if self.params[3].value:
            value3 = self.params[3].value.upper().replace(" ", "_")
            if value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                if self.params[7].value in ["", "#", None]:
                    self.params[7].setIDMessage("ERROR", 930)
            if value3 == "K_NEAREST_NEIGHBORS":
                if not self.params[12].value:
                    self.params[12].setIDMessage("ERROR", 976)

        if self.params[4].hasError():
            if self.params[4].value.upper().replace(" ", "_") in self.distanceTypes:
                self.params[4].clearMessage()

        if self.params[5].hasError():
            if self.params[5].value.upper() in self.rowTypes:
                self.params[5].clearMessage()
          
    def checkContiguity(self, inputFC):
        try:
            desc = ARCPY.Describe(inputFC)
            outSpatRef = setEnvSpatialReference(desc.SpatialReference)
            if outSpatRef.type.upper() == "GEOGRAPHIC":
                self.params[4].enabled = False
            else:
                self.params[4].enabled = True
            if desc.ShapeType.upper() == "POLYGON":
                self.params[3].filter.list = self.allConcepts
            else:
                self.params[3].filter.list = self.baseConcepts
        except:
            self.params[3].filter.list = self.baseConcepts
        self.currentConcepts = self.params[3].filter.list

    def execute(self, parameters, messages):
        import GeneralG as GG
        GG.execute(parameters, messages)

class SpatialAutocorrelation(object):
    def __init__(self):
        self.label = "Spatial Autocorrelation (Morans I)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Analyzing Patterns"
        self.helpContext = 9010002
        self.params = None

        #### Set Lists of Spatial Concepts ####
        self.baseConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        self.allConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "CONTIGUITY_EDGES_ONLY",
                             "CONTIGUITY_EDGES_CORNERS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        self.distanceConcepts = self.baseConcepts[0:4]
        self.currentConcepts = [ i for i in self.baseConcepts ]
        self.distanceTypes = ["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"]
        self.rowTypes = ["ROW", "NONE"]

        self.defaultIndexList = [3, 4, 5]
        self.defaultValueList = ['INVERSE_DISTANCE', 'EUCLIDEAN_DISTANCE',
                                 'ROW']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Input Field",
                            name = "Input_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double', 'BigInteger']

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Generate Report",
                            name = "Generate_Report",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['GENERATE_REPORT', 'NO_REPORT']

        param3 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                            name = "Conceptualization_of_Spatial_Relationships",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param3.filter.type = "ValueList"

        param3.filter.list = ['INVERSE_DISTANCE','INVERSE_DISTANCE_SQUARED',
                              'FIXED_DISTANCE_BAND','ZONE_OF_INDIFFERENCE',
                              'K_NEAREST_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']

        param3.value = 'INVERSE_DISTANCE'

        param4 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.type = "ValueList"

        param4.filter.list = ['EUCLIDEAN_DISTANCE','MANHATTAN_DISTANCE']

        param4.value = 'EUCLIDEAN_DISTANCE'

        param5 = ARCPY.Parameter(displayName="Standardization",
                            name = "Standardization",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param5.filter.type = "ValueList"

        param5.filter.list = ['NONE','ROW']

        param5.value = 'ROW'

        param6 = ARCPY.Parameter(displayName="Distance Band or Threshold Distance",
                            name = "Distance_Band_or_Threshold_Distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "Range"
        param6.filter.list = [0.0,999999999999999.0]

        param7 = ARCPY.Parameter(displayName="Weights Matrix File",
                            name = "Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = ['swm', 'gwt', 'txt'] 
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Index",
                            name = "Index",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param9 = ARCPY.Parameter(displayName="ZScore",
                            name = "ZScore",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param10 = ARCPY.Parameter(displayName="PValue",
                            name = "PValue",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param11 = ARCPY.Parameter(displayName="Report File",
                            name = "Report_File",
                            datatype = "DEFile",
                            parameterType = "Derived",
                            direction = "Output")
        #param11.filter.list = ['html'] #issue
        param11.enabled = False

        #### User Defined with Number of Neighbors Parameters (Required) ####
        param12 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param12.filter.type = "Range"
        param12.filter.list = [2, 1000]
        param12.enabled = False

        param13 = ARCPY.Parameter(displayName="Derived Input Dataset",
                                  name="Derived_Input_Dataset",
                                  datatype="GPFeatureLayer",
                                  direction="Output",
                                  parameterType="Derived")

        return [param0,param1,param2,param3,param4,param5,param6,
                param7,param8,param9,param10,param11,param12, param13]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        if self.params[0].altered:
            if not self.params[0].isInputValueDerived():
                self.checkContiguity(self.params[0].value)

        if self.params[4].altered:
            value4 = self.params[4].value.upper().replace(" ", "_")
            if value4 in swapType:
                self.params[4].value = swapType[value4]

        #### Enable Type of Distance Measure if Appropriate ####
        if self.params[3].altered:
            value3 = self.params[3].value.upper().replace(" ", "_")
            if value3 == "POLYGON_CONTIGUITY_(FIRST_ORDER)":
                value3 = "CONTIGUITY_EDGES_ONLY"
                self.params[3].value = value3
            if value3 in self.distanceConcepts:
                self.params[4].enabled = 1
                self.params[6].enabled = 1
            else:
                self.params[4].enabled = 0
                self.params[6].enabled = 0

            if value3 == "GET_SPATIAL_WEIGHTS_FROM_FILE":
                self.params[7].enabled = 1
                self.params[5].enabled = 0      
            else:
                self.params[7].enabled = 0
                self.params[5].enabled = 1

            if value3 == "K_NEAREST_NEIGHBORS":
                self.params[12].enabled = 1
                if not self.params[12].value:
                    self.params[12].value = 8
            else:
                clearParameter(self.params[12])

        if self.params[0].value:
            self.params[13].value = self.params[0].valueAsText

        return

    def updateMessages(self, parameters):
        self.params = parameters
        if self.params[3].hasError():
            value3 = self.params[3].value.upper().replace(" ", "_")
            if value3 in self.currentConcepts:
                self.params[3].clearMessage()
            if value3.count("CONTIGUITY"):
                self.params[3].clearMessage()

        #### Required SWM or KNN ####
        if self.params[3].value:
            value3 = self.params[3].value.upper().replace(" ", "_")
            if value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                if self.params[7].value in ["", "#", None]:
                    self.params[7].setIDMessage("ERROR", 930)
            if value3 == "K_NEAREST_NEIGHBORS":
                if not self.params[12].value:
                    self.params[12].setIDMessage("ERROR", 976)

        if self.params[4].hasError():
            if self.params[4].value.upper().replace(" ", "_") in self.distanceTypes:
                self.params[4].clearMessage()

        if self.params[5].hasError():
            if self.params[5].value.upper() in self.rowTypes:
                self.params[5].clearMessage()
        return

    def checkContiguity(self, inputFC):
        try:
            desc = ARCPY.Describe(inputFC)
            outSpatRef = setEnvSpatialReference(desc.SpatialReference)
            if outSpatRef.type.upper() == "GEOGRAPHIC":
                self.params[4].enabled = False
            else:
                self.params[4].enabled = True
            if desc.ShapeType.upper() == "POLYGON":
                self.params[3].filter.list = self.allConcepts
            else:
                self.params[3].filter.list = self.baseConcepts
        except:
            self.params[3].filter.list = self.baseConcepts
        self.currentConcepts = self.params[3].filter.list

    def execute(self, parameters, messages):
        import MoransI as MI
        MI.execute(parameters, messages)

class ClustersOutliers(object):
    def __init__(self):
        self.label = "Cluster and Outlier Analysis (Anselin Local Morans I)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030003

        #### Set Lists of Spatial Concepts ####
        self.baseConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        self.allConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "CONTIGUITY_EDGES_ONLY",
                             "CONTIGUITY_EDGES_CORNERS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        #### Set Parameter Defaults ####
        self.defaultIndexList = [3, 4, 5, 14, 15]
        self.defaultValueList = ['INVERSE_DISTANCE', 'EUCLIDEAN_DISTANCE', 'ROW', 499, 8]

        self.distanceConcepts = self.baseConcepts[0:4]
        self.currentConcepts = [ i for i in self.baseConcepts ]
        self.distanceTypes = ["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"]
        self.rowTypes = ["ROW", "NONE"]
        self.outputFieldNames = ["LMiIndex", "LMiZScore", "LMiPValue", "COType"]
        self.outputFieldTypes = ["DOUBLE", "DOUBLE", "DOUBLE", "TEXT"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Input Field",
                            name = "Input_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double','BigInteger']
        param1.parameterDependencies = ["Input_Feature_Class"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                            name = "Conceptualization_of_Spatial_Relationships",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param3.filter.type = "ValueList"
        param3.filter.list = ['INVERSE_DISTANCE','INVERSE_DISTANCE_SQUARED',
                              'FIXED_DISTANCE_BAND','ZONE_OF_INDIFFERENCE',
                              'K_NEAREST_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']
        param3.value = 'INVERSE_DISTANCE'
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.type = "ValueList"
        param4.filter.list = ['EUCLIDEAN_DISTANCE','MANHATTAN_DISTANCE']
        param4.value = 'EUCLIDEAN_DISTANCE'
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Standardization",
                            name = "Standardization",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param5.filter.type = "ValueList"
        param5.filter.list = ['NONE','ROW']
        param5.value = 'ROW'
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Distance Band or Threshold Distance",
                            name = "Distance_Band_or_Threshold_Distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type  = "Range"
        param6.filter.list = [0, 999999999999999]
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Weights Matrix File",
                            name = "Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = ['swm', 'gwt'] 
        param7.enabled = False
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Apply False Discovery Rate (FDR) Correction",
                            name = "Apply_False_Discovery_Rate__FDR__Correction",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param8.filter.list = ['APPLY_FDR', 'NO_FDR']
        param8.value = False
        param8.displayOrder = 9

        param9 = ARCPY.Parameter(displayName="Index Field Name",
                            name = "Index_Field_Name",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param9.value = 'LMiIndex'

        param10 = ARCPY.Parameter(displayName="ZScore Field Name",
                            name = "ZScore_Field_Name",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param10.value = 'LMiZScore'

        param11 = ARCPY.Parameter(displayName="Probability Field",
                            name = "Probability_Field",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param11.value = 'LMiPValue'

        param12 = ARCPY.Parameter(displayName="Cluster-Outlier Type",
                            name = "Cluster_Outlier_Type",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param12.value = 'CO_Type'

        param13 = ARCPY.Parameter(displayName="Source_ID",
                            name = "Source_ID",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param13.value = 'SOURCE_ID'

        param14 = ARCPY.Parameter(displayName="Number of Permutations",
                            name = "Number_of_Permutations",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param14.filter.list = [0, 99, 199, 499, 999, 9999]
        param14.value = 499
        param14.displayOrder = 10

        #### User Defined with Number of Neighbors Parameters (Required) ####
        param15 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param15.filter.type = "Range"
        param15.filter.list = [2, 1000]
        param15.enabled = False
        param15.displayOrder = 8

        return [param0,param1,param2,param3,param4,param5,param6,
                param7,param8,param9,param10,param11,param12,
                param13,param14,param15]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        inputField = parameters[1]
        outputFeatures = parameters[2]
        concept = parameters[3]
        distanceMethod = parameters[4]
        rowStandard = parameters[5]
        distanceBand = parameters[6]
        weightsFile = parameters[7]
        applyFDR = parameters[8]
        numNeighbors = parameters[15]

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        #### Create UI SSDO Field Checker/Adder/Symbology ####
        uiSSDO = None
        useWeights = False
        if concept.value:
            value3 = concept.value.upper().replace(" ", "_")
            useWeights = value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE'

        doDescribe = True
        if inputFeatures.value and outputFeatures.value:
            fieldNames = []
            if inputField.value:
                fieldNames.append(inputField.valueAsText)
            if useWeights:
                if weightsFile.value is not None:
                    uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures, 
                                             fieldNames = fieldNames,
                                             weightsParameter = weightsFile,
                                             outputFieldNames = self.outputFieldNames,
                                             outputFieldTypes = self.outputFieldTypes)
            else:
                uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures, 
                                         fieldNames = fieldNames,
                                         outputFieldNames = self.outputFieldNames,
                                         outputFieldTypes = self.outputFieldTypes)
            
            if uiSSDO is not None:
                if uiSSDO.ssdo is not None:
                    doDescribe = False

                    #### Check Chordal ####
                    if uiSSDO.ssdo.spatialRefType.upper() == "GEOGRAPHIC":
                        distanceMethod.enabled = False
                    else:
                        distanceMethod.enabled = True

                    #### Check Shape Type for Polygon Concepts ####
                    if uiSSDO.ssdo.shapeType.upper() == "POLYGON":
                        concept.filter.list = self.allConcepts
                    else:
                        concept.filter.list = self.baseConcepts
                    self.currentConcepts = concept.filter.list

        if doDescribe:
            try:
                info = ARCPY.Describe(inputFeatures.value)
                outSpatRef = setEnvSpatialReference(info.SpatialReference)

                #### Check Chordal ####
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    distanceMethod.enabled = False
                else:
                    distanceMethod.enabled = True

                #### Check Shape Type for Polygon Concepts ####
                if info.ShapeType.upper() == "POLYGON":
                    concept.filter.list = self.allConcepts
                else:
                    concept.filter.list = self.baseConcepts
                self.currentConcepts = concept.filter.list
            except:
                pass

        if distanceMethod.altered:
            value4 = distanceMethod.value.upper().replace(" ", "_")
            if value4 in swapType:
                distanceMethod.value = swapType[value4]

        #### Enable Type of Distance Measure if Appropriate ####
        if concept.altered:
            value3 = concept.value.upper().replace(" ", "_")
            if value3 in swapType:
                concept.value = swapType[value3]

            if value3 in self.distanceConcepts:
                distanceMethod.enabled = True
                distanceBand.enabled = True
            else:
                distanceMethod.enabled = False
                distanceBand.enabled = False

            if value3 == "GET_SPATIAL_WEIGHTS_FROM_FILE":
                weightsFile.enabled = True
                rowStandard.enabled = False
            else:
                weightsFile.enabled = False
                rowStandard.enabled = True

            if value3 == "K_NEAREST_NEIGHBORS":
                numNeighbors.enabled = True
                reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)
            else:
                clearParameter(numNeighbors)

    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        inputField = parameters[1]
        outputFeatures = parameters[2]
        concept = parameters[3]
        distanceMethod = parameters[4]
        rowStandard = parameters[5]
        distanceBand = parameters[6]
        weightsFile = parameters[7]
        applyFDR = parameters[8]
        numNeighbors = parameters[15]

        if distanceMethod.value:
            value4 = distanceMethod.value.upper().replace(" ", "_")
            if value4 in swapType:
                distanceMethod.value = swapType[value4]

        if concept.value:
            value3 = concept.value.upper().replace(" ", "_")
            if value3 in swapType:
                concept.value = swapType[value3]

        if concept.value:
            value3 = concept.value.upper().replace(" ", "_")
            if value3 in self.currentConcepts:
                concept.clearMessage()
            if value3.count("CONTIGUITY"):
                concept.clearMessage()

            #### Required SWM ####
            if value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                if weightsFile.value in ["", "#", None]:
                    weightsFile.setIDMessage("ERROR", 930)

            #### Require KNN ####
            if value3 == "K_NEAREST_NEIGHBORS":
                if numNeighbors.value is None:
                    numNeighbors.setIDMessage("ERROR", 976)

        if distanceMethod.value:
            value4 = distanceMethod.value.upper().replace(" ", "_")
            if value4 in self.distanceTypes:
                distanceMethod.clearMessage()

        if rowStandard.hasError():
            if rowStandard.value.upper() in self.rowTypes:
                rowStandard.clearMessage()

        #### Create UI SSDO Field Checker ####
        uiSSDO = None
        useWeights = False
        if concept.value:
            value3 = concept.value.upper().replace(" ", "_")
            useWeights = value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE'

        if inputFeatures.value and outputFeatures.value:
            fieldNames = []
            if inputField.value:
                fieldNames.append(inputField.valueAsText)
            if useWeights:
                if weightsFile.value is not None:
                    uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures, 
                                             fieldNames = fieldNames,
                                             weightsParameter = weightsFile,
                                             outputFieldNames = self.outputFieldNames,
                                             outputFieldTypes = self.outputFieldTypes)
            else:
                uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures, 
                                         fieldNames = fieldNames,
                                         outputFieldNames = self.outputFieldNames,
                                         outputFieldTypes = self.outputFieldTypes)

    def execute(self, parameters, messages):
        import LocalMoran as LM
        LM.execute(parameters, messages)

class HotSpots(object):
    def __init__(self):
        self.label = "Hot Spot Analysis (Getis-Ord Gi*)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030001

        #### Set Lists of Spatial Concepts ####
        self.baseConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        self.allConcepts = ["INVERSE_DISTANCE", 
                             "INVERSE_DISTANCE_SQUARED",
                             "FIXED_DISTANCE_BAND", 
                             "ZONE_OF_INDIFFERENCE",
                             "K_NEAREST_NEIGHBORS",
                             "CONTIGUITY_EDGES_ONLY",
                             "CONTIGUITY_EDGES_CORNERS",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]

        self.distanceConcepts = self.baseConcepts[0:4]
        self.currentConcepts = [ i for i in self.baseConcepts ]
        self.distanceTypes = ["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"]
        self.rowTypes = ["ROW", "NONE"]
        #### Ask about the other two output fields ####
        self.outputFieldNames = ["GiZScore", "GiPValue", "Gi_Bin"]
        self.outputFieldTypes = ["DOUBLE", "DOUBLE", "LONG"]

        #### Set Default Values ####
        #### Add Deleted Parameter Values to Defaults
        self.defaultIndexList = [3, 4, 5]
        self.defaultValueList = ['FIXED_DISTANCE_BAND','EUCLIDEAN_DISTANCE', 'ROW']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Input Field",
                            name = "Input_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double', 'BigInteger']
        param1.parameterDependencies = ["Input_Feature_Class"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2.parameterDependencies = ["Input_Feature_Class"]
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                            name = "Conceptualization_of_Spatial_Relationships",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param3.filter.type = "ValueList"
        param3.filter.list = ['INVERSE_DISTANCE','INVERSE_DISTANCE_SQUARED',
                              'FIXED_DISTANCE_BAND','ZONE_OF_INDIFFERENCE',
                              'K_NEAREST_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']
        param3.value = 'FIXED_DISTANCE_BAND'
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.type = "ValueList"
        param4.filter.list = ['EUCLIDEAN_DISTANCE','MANHATTAN_DISTANCE']
        param4.value = 'EUCLIDEAN_DISTANCE'
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Standardization",
                            name = "Standardization",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param5.filter.type = "ValueList"
        param5.filter.list = ['NONE','ROW']
        param5.value = 'ROW'
        param5.enabled = False
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Distance Band or Threshold Distance",
                            name = "Distance_Band_or_Threshold_Distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type  = "Range"
        param6.filter.list = [0, 999999999999999]
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Self Potential Field",
                            name = "Self_Potential_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param7.parameterDependencies = ["Input_Feature_Class"]
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Weights Matrix File",
                            name = "Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param8.filter.list = ['swm', 'gwt']
        param8.enabled = False
        param8.displayOrder = 8

        param9 = ARCPY.Parameter(displayName="Apply False Discovery Rate (FDR) Correction",
                            name = "Apply_False_Discovery_Rate__FDR__Correction",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param9.filter.list = ['APPLY_FDR','NO_FDR']
        param9.value = False
        param9.displayOrder = 10

        param10 = ARCPY.Parameter(displayName="Results Field",
                            name = "Results_Field",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param10.value = 'GiZScore'

        param11 = ARCPY.Parameter(displayName="Probability Field",
                            name = "Probability_Field",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param11.value = 'GiPValue'

        param12 = ARCPY.Parameter(displayName="Source_ID",
                            name = "Source_ID",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param12.value = 'SOURCE_ID'

        #### User Defined with Number of Neighbors Parameters (Required) ####
        param13 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param13.filter.type = "Range"
        param13.filter.list = [2, 1000]
        param13.enabled = False
        param13.displayOrder = 9

        return [param0,param1,param2,param3,param4,param5,param6,
                param7,param8,param9,param10,param11,param12,param13]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        inputField = parameters[1]
        outputFeatures = parameters[2]
        concept = parameters[3]
        distanceMethod = parameters[4]
        distanceBand = parameters[6]
        selfPotential = parameters[7]
        weightsFile = parameters[8]
        numNeighbors = parameters[13]


        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        #### create UI SSDO Field Checker/Adder/Sybm
        uiSSDO = None
        useWeights = False
        if concept.value:
            value3 = concept.value.upper().replace(" ", "_")
            useWeights = value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE' 

        doDescribe = True
        if inputFeatures.value and outputFeatures.value:
            fieldNames = []
            if inputField.value:
                fieldNames.append(inputField.valueAsText)

            if useWeights:
                if weightsFile.value is not None:
                    uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures,
                                            fieldNames=fieldNames,
                                            weightsParameter=weightsFile,
                                            outputFieldNames=self.outputFieldNames,
                                            outputFieldTypes=self.outputFieldTypes)
                else:
                    uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures, 
                                            fieldNames=fieldNames,
                                            outputFieldNames=self.outputFieldNames,
                                            outputFieldTypes=self.outputFieldTypes)

            if uiSSDO is not None:
                if uiSSDO.ssdo is not None:
                    doDescribe = False

                    #### Check Chordal ####
                    if uiSSDO.ssdo.spatialRefType.upper() == "GEOGRAPHIC":
                        distanceMethod.enabled = False
                    else:
                        distanceMethod.enabled = True

                    #### Check Shape Type for Polygon Concepts ####
                    if uiSSDO.ssdo.shapeType.upper() == "POLYGON":
                        concept.filter.list = self.allConcepts
                    else:
                        concept.filter.list = self.baseConcepts
                    self.currentConcepts = concept.filter.list

        if doDescribe:
            try:
                info = ARCPY.Describe(inputFeatures.value)
                outSpatRef = setEnvSpatialReference(info.SpatialReference)

                #### Check Chordal ####
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    distanceMethod.enabled = False
                else:
                    distanceMethod.enabled = True

                #### Check Shape Type for Polygon Concepts ####
                if info.ShapeType.upper() == "POLYGON":
                    concept.filter.list = self.allConcepts
                else:
                    concept.filter.list = self.baseConcepts
                self.currentConcepts = concept.filter.list
            except:
                pass

        #### Enable Type of Distance Measure if Appropriate ####
        if concept.altered:
            if value3 in self.distanceConcepts:
                distanceMethod.enabled = True
                distanceBand.enabled = True
            else:
                distanceMethod.enabled = False
                distanceBand.enabled = False

            if useWeights:
                weightsFile.enabled = True
            else:
                weightsFile.enabled = False

            if value3 == "K_NEAREST_NEIGHBORS":
                numNeighbors.enabled = True
                if not numNeighbors.value:
                    numNeighbors.value = 8
                # reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)
            else:
                clearParameter(numNeighbors)

    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        inputField = parameters[1]
        outputFeatures = parameters[2]
        concept = parameters[3]
        distanceMethod = parameters[4]
        rowStatndard = parameters[5]
        selfPotential = parameters[7]
        weightsFile = parameters[8]
        numNeighbors = parameters[13]

        if concept.hasError():
            value3 = concept.value.upper().replace(" ", "_")
            if value3 in self.currentConcepts:
                concept.clearMessage()
            if value3.count("CONTIGUITY"):
                concept.clearMessage()

        #### Required SWM or KNN ####
        if concept.value:
            value3 = concept.value.upper().replace(" ", "_")
            if value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                if weightsFile.value in ["", "#", None]:
                    weightsFile.setIDMessage("ERROR", 930)
            #### Require KNN ####
            if value3 == "K_NEAREST_NEIGHBORS":
                if not numNeighbors.value:
                    numNeighbors.setIDMessage("ERROR", 976)

        if distanceMethod.hasError():
            value4 = distanceMethod.value.upper().replace(" ", "_")
            if value4 in self.distanceTypes:
                distanceMethod.clearMessage()

        if rowStatndard.hasError():
            if rowStatndard.value.upper() in self.rowTypes:
                rowStatndard.clearMessage()

        #### Create UI SSDO Field Checker ####
        # if selfPotential.value is not None:
        #     self.outputFieldNames.append(selfPotential.value)
        #     self.outputFieldTypes.append()
        uiSSDO = None
        useWeights = False
        if concept.value:
            value3 = concept.value.upper().replace(" ", "_")
            useWeights = value3 == 'GET_SPATIAL_WEIGHTS_FROM_FILE'
        if inputFeatures.value and outputFeatures.value:
            fieldNames = []
            if inputField.value:
                fieldNames.append(inputField.valueAsText)
            if selfPotential.value:
                fieldNames.append(selfPotential.valueAsText)
            if useWeights:
                if weightsFile.value is not None:
                    uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures, 
                                             fieldNames=fieldNames,
                                             weightsParameter=weightsFile,
                                             outputFieldNames=self.outputFieldNames,
                                             outputFieldTypes=self.outputFieldTypes)
            else:
                uiSSDO = UI_SSDataObject(inputFeatures, outputFeatures, 
                                        fieldNames=fieldNames,
                                        outputFieldNames=self.outputFieldNames,
                                        outputFieldTypes=self.outputFieldTypes)

    def execute(self, parameters, messages):
        import Gi as GI
        GI.execute(parameters, messages)

class DirectionalTrend(object):
    def __init__(self):
        self.label ="Directional Trend"
        self.description=""
        self.canRunInBackground = False
        self.helpContext = 9040008
        self.category = "Measuring Geographic Distributions"
        self.baseType = None
        self.outPath = None

    def getParameterInfo(self):
        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon']
        
        param1 = ARCPY.Parameter(displayName="Analysis Field",
                                 name="analysis_field",
                                 datatype="Field",
                                 direction="Input")
        param1.filter.list = ['Short','Long','Float','Double', 'BigInteger']
        param1.parameterDependencies = [param0.name]

        param2 = ARCPY.Parameter(displayName="Direction of Trend",
                                    name="direction",
                                    datatype="GPDouble",
                                    parameterType="Optional",
                                    direction="Input")
        param2.filter.type = "Range"
        param2.filter.list = [0, 359.999]
        param2.value = 0

        param3 = ARCPY.Parameter(displayName="Determine Direction of Strongest Trend",
                            name="determine_direction",
                            datatype="GPBoolean",
                            parameterType="Optional",
                            direction="Input")
        param3.filter.list = ['DETERMINE_DIRECTION','NO_DETERMINE_DIRECTION']
        param3.value = False  

        param4 = ARCPY.Parameter(displayName="Polynomial Trend Order",
                                 name="order",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.type = "ValueList"
        param4.filter.list = [1,
                              2,
                              3,
                              4,
                              5,
                              6]
        param4.value = "1"

        param5 = ARCPY.Parameter(displayName="Updated Input Features With Chart",
                            name = "updated_in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Derived",
                            direction = "Output")
        param5.parameterDependencies = [param0.name]
        
        return [param0, param1, param2, param3, param4, param5]
    
    def isLicensed(self):
        return True
    
    def updateParameters(self, parameters):
        inputFC = parameters[0]
        analysisField = parameters[1]
        direction = parameters[2]
        determineDirection = parameters[3]
        order = parameters[4]

        if determineDirection.value:
            direction.enabled = False
            direction.value = None
        else: 
            direction.enabled = True

        if order.value is None:
            order.value = 1

        if direction.value is None:
            direction.value = 0

    def execute(self, parameters, messages):
        import SSDirectionalTrend as directionalTrend
        directionalTrend.execute(parameters, messages)

    def postExecute(self, parameters):
        import SSDirectionalTrend as directionalTrend
        directionalTrend.postExecute(parameters)

class CalculateRates(object):
    def __init__(self):
        self.label ="Calculate Rates"
        self.description=""
        self.canRunInBackground = False
        self.helpContext = 120004725
        self.category = "Utilities"
        self.baseType = None
        self.outPath = None


    def getParameterInfo(self):
        param0 = ARCPY.Parameter(displayName="Input Table or Features",
                                 name="in_table",
                                 datatype="GPTableView",
                                 parameterType="Required",
                                 direction="Input")

        param1 = ARCPY.Parameter(displayName="Rate Fields",
                                 name="rate_fields",
                                 datatype="GPValueTable",
                                 parameterType="Required",
                                 direction="Input")
        param1.parameterDependencies = [param0.name]
        param1.columns = [['Field', 'Count Field'], ['Field','Population Field']]
        param1.filters[0].list = ["Float", "Short", "Long", "BigInteger","Double"]
        param1.filters[1].list = ["Float", "Short", "Long", "BigInteger","Double"]
        param1.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param1.displayOrder = 2

        param2 = ARCPY.Parameter(displayName="Append Fields to Input",
                            name="append_to_input",
                            datatype="GPBoolean",
                            parameterType="Optional",
                            direction="Input")
        param2.filter.list = ['APPEND','NO_APPEND']
        param2.value = False
        param2.displayOrder = 1

        param3 = ARCPY.Parameter(displayName = "Output Table or Feature", 
                                 name="out_table",
                                 datatype=['DEFeatureClass','DETable'],
                                 parameterType="Optional",
                                 direction="Output")
        param3.enabled = False


        param4 = ARCPY.Parameter(displayName="Rate Method",
                                 name="rate_method",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.type = "ValueList"
        param4.filter.list = ["CRUDE_RATE",
                              "GLOBAL_EMPIRICAL_BAYES",
                              "LOCAL_EMPIRICAL_BAYES",
                              "LOCALLY_WEIGHTED_AVERAGE",
                              "LOCALLY_WEIGHTED_MEDIAN"]
        param4.value = "CRUDE_RATE"

        param5 = ARCPY.Parameter(displayName="Probability Distribution",
                                 name="probability_distribution",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["POISSON","BINOMIAL"]
        param5.value = "POISSON"
        param5.enabled = False

        #Spatial Neighborhood Definition Parameters
        param6 = ARCPY.Parameter(displayName="Neighborhood Type",
                            name = "neighborhood_type",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ['DISTANCE_BAND',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'K_NEAREST_NEIGHBORS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']
        param6.value = 'DISTANCE_BAND'
        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Distance Band",
                                 name="distance_band",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = supportDist
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Number of Neighbors",
                                 name="number_of_neighbors",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.type = "Range"
        param8.filter.list = [2, 1000]
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="Spatial Weights Matrix",
                                 name="weights_matrix_file",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param9.filter.list = ['swm', 'gwt', 'txt']
        param9.enabled = False

        param10 = ARCPY.Parameter(displayName="Local Weighting Scheme",
                                 name="local_weighting_scheme",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param10.filter.list = ['UNWEIGHTED',
                              'BISQUARE',
                              'GAUSSIAN']
        param10.value = 'UNWEIGHTED'
        param10.enabled = False

        param11 = ARCPY.Parameter(displayName="Kernel Bandwidth",
                                 name="kernel_bandwidth",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param11.filter.list = supportDist
        param11.enabled = False

        param12 = ARCPY.Parameter(displayName="Rate Multiplier",
                                    name="rate_multiplier",
                                    datatype="GPLong",
                                    parameterType="Optional",
                                    direction="Input")

        param13 = ARCPY.Parameter(displayName="Updated Table",
                            name="updated_table",
                            datatype="GPTableView",
                            parameterType="Derived",
                            direction="Output")
        param13.parameterDependencies = [param0.name]

        param14 = ARCPY.Parameter(displayName="Output Layer Group",
                            name="output_layer_group",
                            datatype="GPGroupLayer",
                            parameterType="Derived",
                            direction="Output")

        return [param0, param1,param2, param3, param4, param5, param6, param7, param8, param9, param10, param11, param12, param13, param14]

    def isLicensed(self):
        return True
    
    def updateParameters(self, parameters):
        import SSRates as rates
        inputFC = parameters[0]
        cntPopFields = parameters[1]
        appendToInput = parameters[2]
        outFC = parameters[3]
        rateTypes = parameters[4]
        probabilityDist = parameters[5]
        spatialConcept = parameters[6]
        spatialDistBand = parameters[7]  
        spatialNumNeigh = parameters[8]
        weightMatrixFile = parameters[9]
        localWieghtingScheme  = parameters[10]
        kernelBandWidth = parameters[11] 
        rate_multiplier = parameters[12] 
        derivedOutTable = parameters[13]
        derivedGroupLayer = parameters[14]

        #### Automatically fill the output and suffix ####
        if inputFC.value:
            if outFC.value is None and ARCPY.env.workspace is not None:
                #### Automatically populate the field names ####
                if len(ARCPY.env.workspace) > 0 and inputFC.value:
                    extraChrt = ""
                    try:
                        int(OS.path.basename(inputFC.valueAsText).split(".")[0])
                        extraChrt = "t"
                    except:
                        pass

                    try:
                        outputCandidate = OS.path.join(
                            ARCPY.env.workspace,
                            extraChrt + OS.path.basename(inputFC.valueAsText).split(".")[
                                0] + "_CalculateRates")
                        
                        path, name = OS.path.split(outputCandidate)
                        newName = ARCPY.ValidateTableName(name, path)
                        outputCandidateFinal= OS.path.join(path, newName)


                        ind = 1
                        while ARCPY.Exists(outputCandidateFinal):
                            outputCandidateFinal = outputCandidate + str(ind)
                            ind += 1
                        outFC.value = outputCandidateFinal
                    except:
                        pass
        if inputFC.altered and inputFC.value and ARCPY.Exists(inputFC.valueAsText):
            desc = ARCPY.Describe(inputFC.valueAsText)
            self.baseType = desc.DataType
            self.outPath = desc.path
            dataType = desc.dataType.upper()
            if outFC.value:
                try:
                    output = outFC.valueAsText
                    self.outPath, outName = OS.path.split(output.lower())
                    self.baseType = ARCPY.Describe(self.outPath).DataType
                    if not UTILS.isGDB(output, checkSDE=True) and not output.lower().startswith(
                            "memory\\") and not output.lower().startswith("in_memory\\"):
                        if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
                            if not output.lower().endswith(".shp"):
                                dir = OS.path.dirname(output)
                                fn = OS.path.basename(output).split(".")[0] + ".shp"
                                outFC.value = OS.path.join(dir, fn)
                        else:
                            if not output.lower().endswith(".dbf"):
                                dir = OS.path.dirname(output)
                                fn = OS.path.basename(output).split(".")[0] + ".dbf"
                                outFC.value = OS.path.join(dir, fn)
                except:
                    pass


        
        if paramChanged(inputFC):
            inputFCText = inputFC.valueAsText
            if inputFCText:
                try:
                    ssdo = SSDO.SSDataObject(inputFCText)
                    
                    currentValue = rateTypes.valueAsText

                    if ssdo.isTable or (ssdo.spatialRefType and ssdo.spatialRefType.upper() not in ['PROJECTED','GEOGRAPHIC']):
                        ratesFilter = ["CRUDE_RATE", "GLOBAL_EMPIRICAL_BAYES"]
                        rateTypes.filter.list = ratesFilter
                    else:
                        ratesFilter = ["CRUDE_RATE",
                                        "GLOBAL_EMPIRICAL_BAYES",
                                        "LOCAL_EMPIRICAL_BAYES",
                                        "LOCALLY_WEIGHTED_AVERAGE",
                                        "LOCALLY_WEIGHTED_MEDIAN"]
                        rateTypes.filter.list = ratesFilter
                    
                    currentValue = spatialConcept.valueAsText

                    shapeType = ssdo.shapeType
                    if shapeType:
                        shapeType = shapeType.upper()
                        if shapeType == "POLYGON":
                            spatList = ['DISTANCE_BAND',
                                            'K_NEAREST_NEIGHBORS',
                                            'CONTIGUITY_EDGES_ONLY',
                                            'CONTIGUITY_EDGES_CORNERS',
                                            'GET_SPATIAL_WEIGHTS_FROM_FILE']
                            spatialConcept.filter.list = spatList

                            if currentValue in [None, "", "#"] or currentValue not in spatList:
                                spatialConcept.value = 'CONTIGUITY_EDGES_CORNERS'

                        else:  # shapeType in ["POINT", "MULTIPOINT"]:
                            spatList = ['DISTANCE_BAND',
                                        'K_NEAREST_NEIGHBORS',
                                        'DELAUNAY_TRIANGULATION',
                                        'GET_SPATIAL_WEIGHTS_FROM_FILE']
                            spatialConcept.filter.list = spatList
                            if currentValue in [None, "", "#"] or currentValue not in spatList:
                                spatialConcept.value = 'DELAUNAY_TRIANGULATION'
                except:
                    pass
            else:
                spatialConcept.filter.list = ['DISTANCE_BAND',
                              'K_NEAREST_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']


        probabilityDist.enabled = False
        spatialConcept.enabled = False
        spatialDistBand.enabled = False  
        spatialNumNeigh.enabled = False
        weightMatrixFile.enabled = False
        localWieghtingScheme.enabled = False
        kernelBandWidth.enabled = False  

        if rateTypes.value == "GLOBAL_EMPIRICAL_BAYES" or rateTypes.value == "LOCAL_EMPIRICAL_BAYES":
            probabilityDist.enabled = True
        if rateTypes.value == "LOCALLY_WEIGHTED_AVERAGE" or rateTypes.value ==  "LOCALLY_WEIGHTED_MEDIAN" or rateTypes.value == "LOCAL_EMPIRICAL_BAYES":
            spatialConcept.enabled = True
            
            if spatialConcept.value == 'DISTANCE_BAND':
                spatialDistBand.enabled = True

            if spatialConcept.value == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                weightMatrixFile.enabled = True

            if spatialConcept.value == 'K_NEAREST_NEIGHBORS':
                spatialNumNeigh.enabled = True

            if spatialConcept.value in ['DISTANCE_BAND', 'K_NEAREST_NEIGHBORS']:
                localWieghtingScheme.enabled = True
            else:
                clearParameter(localWieghtingScheme)

            if localWieghtingScheme.enabled and not localWieghtingScheme.value:
                localWieghtingScheme.value = "UNWEIGHTED"

            if localWieghtingScheme.enabled and localWieghtingScheme.valueAsText in ['BISQUARE', 'GAUSSIAN']:
                kernelBandWidth.enabled = True

        #### Reset Defaults for non-enabled parameters ####
        if probabilityDist.enabled:
            if probabilityDist.valueAsText in [None, "", "#"]:
                probabilityDist.value = "POISSON"
        if not spatialConcept.enabled:
            spatialConcept.value = "DISTANCE_BAND"
        if not spatialDistBand.enabled: 
            spatialDistBand.value = None
        if not spatialNumNeigh.enabled:
            spatialNumNeigh.value = None
        if not weightMatrixFile.enabled:
            weightMatrixFile.value = None
        if not localWieghtingScheme.enabled :
            localWieghtingScheme.value = "UNWEIGHTED"
        if not kernelBandWidth.enabled:
            kernelBandWidth.value = None

        
        if appendToInput.value:
            #### Append to Input ####
            outFC.enabled = False
            outFC.value = None
            derivedGroupLayer.enabled = False
            derivedGroupLayer.value = None
            if inputFC.valueAsText not in ["", "#", None]:
                setOptionalAppendDerivedParam(inputFC, derivedOutTable)
                derivedOutTable.schema.additionalFields = rates.getOutputFCFields(parameters, self.outPath, self.baseType)

        else:
            #### Output Table ####
            outFC.enabled = True
            outFC.schema.additionalFields = rates.getOutputFCFields(parameters, self.outPath, self.baseType)
            derivedGroupLayer.enabled = True
            derivedOutTable.enabled = False
            derivedOutTable.value = None
    

        try:
            if appendToInput.value:
                derivedOutTable.parameterDependencies = [inputFC.name]
            else:
                derivedOutTable.parameterDependencies = None
        except:
            pass

    
    def updateMessages(self, parameters):
        import re as REGEX
        inputFC = parameters[0]
        cntPopFields = parameters[1]
        appendToInput = parameters[2]
        outFC = parameters[3]
        rateTypes = parameters[4]
        probabilityDist = parameters[5]
        spatialConcept = parameters[6]
        spatialDistBand = parameters[7]  
        spatialNumNeigh = parameters[8]
        weightMatrixFile = parameters[9]
        localWieghtingScheme  = parameters[10]
        kernelBandWidth = parameters[11] 
        rate_multiplier = parameters[12] 
        derivedOutTable = parameters[13]
        derivedGroupLayer = parameters[14]

        #### Assure not CSV and Writable ####
        if isCSV(inputFC.value):
            inputFC.setIDMessage("Error", 732, inputFC.valueAsText)
        else:
            if isReadOnly(inputFC.value) and appendToInput.value:
                inputFC.setIDMessage("Error", 381, inputFC.valueAsText)

        if inputFC.hasBeenValidated and not inputFC.hasError() and inputFC.valueAsText and cntPopFields.value:
            allFields = [x.name for x in ARCPY.ListFields(inputFC.valueAsText)]

            if allFields and len(allFields) and cntPopFields:
                fieldAsText = cntPopFields.valueAsText.split(';')
                spaceRegEx = REGEX.compile("^\s*$")
                for ind, row in enumerate(cntPopFields.value):
                    countField = row[0]
                    if hasattr(countField,"value"):
                        countField = countField.value

                    popField = row[1]
                    if hasattr(popField,"value"):
                        popField = popField.value

                    if countField:
                        if spaceRegEx.match(countField):
                            cntPopFields.setIDMessage("ERROR", 530)
                        elif countField not in allFields:
                            cntPopFields.setIDMessage("ERROR", 728,countField)
                    else:
                        cntPopFields.setIDMessage("ERROR", 530)
                    if popField:
                        if spaceRegEx.match(popField):
                            cntPopFields.setIDMessage("ERROR", 530)
                        elif popField not in allFields:
                            cntPopFields.setIDMessage("ERROR", 728,popField)
                    else:
                        cntPopFields.setIDMessage("ERROR", 530)

                    if countField and popField and countField == popField:
                        cntPopFields.setIDMessage("ERROR", 110182, countField)

                    if len(fieldAsText)>ind and fieldAsText.count(fieldAsText[ind])>1:
                        cntPopFields.setIDMessage("ERROR", 400)

        if not appendToInput.value and not outFC.value:
            outFC.setIDMessage("ERROR", 735, ARCPY.GetIDMessage(541))

        if spatialConcept.value == "GET_SPATIAL_WEIGHTS_FROM_FILE" and not weightMatrixFile.value:
            weightMatrixFile.setIDMessage("ERROR", 735, ARCPY.GetIDMessage(220838))

        if spatialDistBand.enabled and spatialDistBand.valueAsText:
            spatialConceptParamValue, spatialConceptParamUnit = spatialDistBand.valueAsText.split(" ")
            if LOCALE.atof(spatialConceptParamValue) <= 0:
                spatialDistBand.setIDMessage("ERROR", 531)

        if kernelBandWidth.enabled and kernelBandWidth.valueAsText:
            kernelBandWidthParamValue, kernelBandWidthParamUnit = kernelBandWidth.valueAsText.split(" ")
            if LOCALE.atof(kernelBandWidthParamValue) <= 0:
                kernelBandWidth.setIDMessage("ERROR", 531)

        #### Validate Rate Multiplier ####
        rateVAT = rate_multiplier.valueAsText
        if rateVAT not in ["", "#", None]:
            #### Assure Positive ####
            if LOCALE.atof(rateVAT) <= 0:
                rate_multiplier.setIDMessage("ERROR", 531)

    def execute(self, parameters, messages):
        import SSRates as rates
        rates.executeRates(parameters, messages)

    def postExecute(self, parameters):
        import SSRates as rates
        rates.postExecute(parameters)


class CentralFeature(object):
    def __init__(self):
        self.label = "Central Feature"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Measuring Geographic Distributions"
        self.helpContext = 9040001
        self.distanceTypes = ["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"]
        
        #### Set Parameter Defaults ####
        self.defaultIndexList = [2]
        self.defaultValueList = ['EUCLIDEAN_DISTANCE']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "ValueList"

        param2.filter.list = ['EUCLIDEAN_DISTANCE','MANHATTAN_DISTANCE']

        param2.value = 'EUCLIDEAN_DISTANCE'

        param3 = ARCPY.Parameter(displayName="Weight Field",
                            name = "Weight_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param3.parameterDependencies = ["Input_Feature_Class"]

        param4 = ARCPY.Parameter(displayName="Self Potential Weight Field",
                            name = "Self_Potential_Weight_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param4.parameterDependencies = ["Input_Feature_Class"]

        param5 = ARCPY.Parameter(displayName="Case Field",
                            name = "Case_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param5.filter.list = ['Short', 'Long', 'Text', 'Date', 'BigInteger']
        param5.parameterDependencies = ["Input_Feature_Class"]

        return [param0,param1,param2,param3,param4,param5]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        outputFeatures = parameters[1]
        distanceMethod = parameters[2]
        weightField = parameters[3]
        selfField = parameters[4]
        caseField = parameters[5]

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        if distanceMethod.altered:
            value2 = distanceMethod.value.upper().replace(" ", "_")
            if value2 in swapType:
                distanceMethod.value = swapType[value2]

        if inputFeatures.value and outputFeatures.value:
            #### Copy Features So All Fields Need to be Check with Output Workspace ####
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = "*", addSourceID = False)
            uissdo.addSymbology(pointLayer = "CentralFeaturePoints.lyr",
                                lineLayer = "CentralFeaturePolylines.lyr",
                                polygonLayer = "CentralFeaturePolygons.lyr")

    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        outputFeatures = parameters[1]
        if inputFeatures.value and outputFeatures.value:
            #### Copy Features So All Fields Need to be Check with Output Workspace ####
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = "*", addSourceID = False)

        self.params = parameters
        if self.params[2].hasError():
            if self.params[2].value.upper().replace(" ", "_") in self.distanceTypes:
                self.params[2].clearMessage()

    def execute(self, parameters, messages):
        import CentralFeature as CF
        CF.execute(parameters, messages)

class DirectionalMean(object):
    def __init__(self):
        self.label = "Linear Directional Mean"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Measuring Geographic Distributions"
        self.helpContext = 9040003
        self.params = None
    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Polyline']

        param1 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Orientation Only",
                            name = "Orientation_Only",
                            datatype = "GPBoolean",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.list = ['ORIENTATION_ONLY','DIRECTION']
        param2.value = False
        param3 = ARCPY.Parameter(displayName="Case Field",
                            name = "Case_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.list = ['Short', 'Long', 'Text', 'Date', 'BigInteger']
        param3.parameterDependencies = ["Input_Feature_Class"]

        return [param0,param1,param2,param3]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        self.fieldObjects = {}
        if self.params[0].altered:
            #if not self.params[0].isInputValueDerived():
            try:
                desc = ARCPY.Describe(self.params[0].value)
                for field in desc.fields:
                    self.fieldObjects[field.name] = field
            except:
                pass


        #### Reset Symbology ####
        if not self.params[2].hasBeenValidated:
            self.setOutputSymbology()

        #### Add Fields ####
        addFields = []

        #### Case Field ####
        if self.params[3].value:
            fieldName = self.params[3].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["CompassA", "DirMean", "CirVar", "AveX", "AveY", "AveLen"]
            
        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "DOUBLE"
            addFields.append(newField)  
        self.params[1].schema.additionalFields = addFields
    
    def updateMessages(self, parameters):
        return

    def setOutputSymbology(self):
        """Sets Output FC Symbology."""
        
        value2 = self.params[2].value
        if value2:
            renderLayerFile = "LinearMeanTwoWay.lyr"
        else:
            renderLayerFile = "LinearMeanOneWay.lyr"

        fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
        self.params[1].symbology = fullRLF

    def execute(self, parameters, messages):
        import DirectionalMean as DIRMEAN
        DIRMEAN.execute(parameters, messages)

class CalculateAreas(object):
    def __init__(self):
        self.label = "Calculate Areas"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        self.helpContext = 9050006

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Polygon']

        param1 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param1.parameterDependencies = ["Input_Feature_Class"]

        return [param0,param1]

    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        return
    def updateMessages(self, parameters):
        return
    def execute(self, parameters, messages):
        return
        

class ExportXYv(object):
    def __init__(self):
        self.label = "Export Feature Attribute to ASCII"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        self.helpContext = 9050007
        self.delimTypes = ["SPACE", "COMMA", "SEMI-COLON", "TAB"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param1 = ARCPY.Parameter(displayName="Value Field",
                            name = "Value_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param1.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param1.filter.list = ['Short','Long','Float','Double','Text','Date','OID','GlobalID','BigInteger']

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Delimiter",
                            name = "Delimiter",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "ValueList"

        param2.filter.list = ['SPACE','COMMA','SEMI-COLON',"TAB"]

        param2.value = 'SPACE'

        param3 = ARCPY.Parameter(displayName="Output ASCII File",
                            name = "Output_ASCII_File",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Output")

        param3.filter.list = ['txt', 'tab', 'tsv', 'csv']

        param4 = ARCPY.Parameter(displayName="Add Field Names to Output",
                            name = "Add_Field_Names_to_Output",
                            datatype = "GPBoolean",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.list = ['ADD_FIELD_NAMES','NO_FIELD_NAMES']
        param4.value  = False
        return [param0,param1,param2,param3,param4]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        delimiter = parameters[2].value
        outParam = parameters[3]
        if delimiter == 'COMMA':
            outParam.filter.list = ['txt', 'csv']
        elif delimiter == 'TAB':
            outParam.filter.list = ['txt', 'tab', 'tsv']
        else:
            outParam.filter.list = ['txt']

        return

    def updateMessages(self, parameters):
        self.params = parameters
        if not self.params[2].hasError():
            if self.params[2].value.upper().replace(" ", "_") in self.delimTypes:
                self.params[2].clearMessage()

        if self.params[3].altered:
            if self.params[3].value:
                #### Check Path to Output Exists ####
                outPath, outName = OS.path.split(self.params[3].value.value)
                if not OS.path.exists(outPath):
                    self.params[3].setIDMessage("ERROR", 436, outPath)

    def execute(self, parameters, messages):
        import ExportXYV as EXYV
        EXYV.execute(parameters, messages)

class MultiDistanceSpatialClustering(object):
    def __init__(self):
        self.label = "Multi-Distance Spatial Cluster Analysis (Ripleys K Function)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Analyzing Patterns"
        self.helpContext = 9010003
        self.params = None

        self.regularFields = ["ExpectedK", "ObservedK", "DiffK"]
        self.allFields = self.regularFields + ["LwConfEnv", "HiConfEnv"]
        
        #### Upper Param Lists ####
        self.permTypes = ["0_PERMUTATIONS_-_NO_CONFIDENCE_ENVELOPE",
                          "9_PERMUTATIONS", "99_PERMUTATIONS",
                          "999_PERMUTATIONS"]
        self.correctTypes = ["NONE", "SIMULATE_OUTER_BOUNDARY_VALUES",
                             "REDUCE_ANALYSIS_AREA",
                             "RIPLEY_EDGE_CORRECTION_FORMULA"]
        self.studyAreaTypes = ["MINIMUM_ENCLOSING_RECTANGLE",
                                            "USER_PROVIDED_STUDY_AREA_FEATURE_CLASS"]

        #### Parameter Indeces and Values ####
        self.defaultIndexList = [3, 8, 9]
        self.defaultValueList = ['0_PERMUTATIONS_-_NO_CONFIDENCE_ENVELOPE',
                                 'NONE', 'MINIMUM_ENCLOSING_RECTANGLE']

        self.canMakeGraph = canMakeGraph()

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Table",
                            name = "Output_Table",
                            datatype = "DETable",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Number of Distance Bands",
                            name = "Number_of_Distance_Bands",
                            datatype = "GPLong",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "Range"

        param2.filter.list = [1,100]

        param2.value = 10

        param3 = ARCPY.Parameter(displayName="Compute Confidence Envelope",
                            name = "Compute_Confidence_Envelope",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param3.filter.type = "ValueList"

        param3.filter.list = ['0_PERMUTATIONS_-_NO_CONFIDENCE_ENVELOPE','9_PERMUTATIONS','99_PERMUTATIONS','999_PERMUTATIONS']

        param3.value = '0_PERMUTATIONS_-_NO_CONFIDENCE_ENVELOPE'

        param4 = ARCPY.Parameter(displayName="Display Results Graphically",
                            name = "Display_Results_Graphically",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['DISPLAY_IT', 'NO_DISPLAY']

        if not self.canMakeGraph:
            param4.enabled = False

        param5 = ARCPY.Parameter(displayName="Weight Field",
                            name = "Weight_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param5.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param5.parameterDependencies = ["Input_Feature_Class"]

        param6 = ARCPY.Parameter(displayName="Beginning Distance",
                            name = "Beginning_Distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "Range"
        param6.filter.list = [0.0,9999999.0]

        param7 = ARCPY.Parameter(displayName="Distance Increment",
                            name = "Distance_Increment",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.type = "Range"
        param7.filter.list = [0.0,9999999.0]

        param8 = ARCPY.Parameter(displayName="Boundary Correction Method",
                            name = "Boundary_Correction_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param8.filter.type = "ValueList"

        param8.filter.list = ['NONE','SIMULATE_OUTER_BOUNDARY_VALUES','REDUCE_ANALYSIS_AREA','RIPLEY_EDGE_CORRECTION_FORMULA']

        param8.value = 'NONE'

        param9 = ARCPY.Parameter(displayName="Study Area Method",
                            name = "Study_Area_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param9.filter.type = "ValueList"

        param9.filter.list = ['MINIMUM_ENCLOSING_RECTANGLE','USER_PROVIDED_STUDY_AREA_FEATURE_CLASS']

        param9.value = 'MINIMUM_ENCLOSING_RECTANGLE'

        param10 = ARCPY.Parameter(displayName="Study Area Feature Class",
                            name = "Study_Area_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param10.filter.list = ['Polygon']
        param10.enabled = False

        param11 = ARCPY.Parameter(displayName="Result Image",
                            name = "Result_Image",
                            datatype = "GPGraph",
                            parameterType = "Derived",
                            direction = "Output")

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9,param10,param11]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        studyArea = "USER_PROVIDED_STUDY_AREA_FEATURE_CLASS"
        if self.params[9].value == studyArea:
            self.params[10].enabled = 1
        else:
            self.params[10].enabled = 0

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        #### Set Output Table Schema For Graphics ####
        if self.params[1].value != None:
            addFields = []
            if self.params[3].value == "0_PERMUTATIONS_-_NO_CONFIDENCE_ENVELOPE":
                fieldNames = self.regularFields
            else:
                fieldNames = self.allFields
            for fieldName in fieldNames:
                newField = ARCPY.Field()
                newField.name = fieldName
                newField.type = "DOUBLE"
                addFields.append(newField)
            self.params[1].schema.additionalFields = addFields
        return

    def updateMessages(self, parameters):
        self.params = parameters
        if self.params[0].value:
            try:
                desc = ARCPY.Describe(self.params[0].value)
                outSpatRef = setEnvSpatialReference(desc.SpatialReference)
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    self.params[0].setIDMessage("ERROR", 1606)
            except:
                pass

        if self.params[3].hasError():
            if self.params[3].value.upper().replace(" ", "_") in self.permTypes:
                self.params[3].clearMessage()

        if self.params[8].hasError():
            value8 = self.params[8].value.upper().replace(" ", "_")
            if value8 in self.correctTypes:
                self.params[8].clearMessage()
            if value8.split("_")[-1] == "FORMULA":
                self.params[8].clearMessage()

        if self.params[9].hasError():
            if self.params[9].value.upper().replace(" ", "_") in self.studyAreaTypes:
                self.params[9].clearMessage()

        if not self.canMakeGraph and self.params[4].value:
            self.params[4].setIDMessage("WARNING", 110038)
        return

    def execute(self, parameters, messages):
        import KFunction as KF
        KF.execute(parameters, messages)

    def postExecute(self, parameters):
        import KFunction as KF
        KF.postExecute(parameters)

class CalculateDistanceBand(object):
    def __init__(self):
        self.label = "Calculate Distance Band from Neighbor Count"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        self.helpContext = 9050008
        self.params = None
        self.distanceTypes = ["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "Input_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Neighbors",
                            name = "Neighbors",
                            datatype = "GPLong",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.type = "Range"
        param1.filter.list = [1,9999]
        param1.value = 1

        param2 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "ValueList"

        param2.filter.list = ['EUCLIDEAN_DISTANCE','MANHATTAN_DISTANCE']

        param2.value = 'EUCLIDEAN_DISTANCE'

        param3 = ARCPY.Parameter(displayName="Minimum Distance",
                            name = "Minimum_Distance",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param4 = ARCPY.Parameter(displayName="Average Distance",
                            name = "Average_Distance",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param5 = ARCPY.Parameter(displayName="Maximum Distance",
                            name = "Maximum_Distance",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        return [param0,param1,param2,param3,param4,param5]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters

        if self.params[2].altered:
             value2 = self.params[2].value.upper().replace(" ", "_")
             if value2 in swapType:
                 self.params[2].value = swapType[value2]


        if self.params[0].altered:
            try:
                desc = ARCPY.Describe(self.params[0].value)
                outSpatRef = setEnvSpatialReference(desc.SpatialReference)
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    self.params[2].enabled = False
                else:
                    self.params[2].enabled = True
            except:
                pass

    def updateMessages(self, parameters):
        self.params = parameters
        if self.params[2].hasError():
            if self.params[2].value.upper().replace(" ", "_") in self.distanceTypes:
                self.params[2].clearMessage()

    def execute(self, parameters, messages):
        import CalculateDistanceBand as CDB
        CDB.execute(parameters, messages)

class AverageNearestNeighbor(object):
    def __init__(self):
        self.label = "Average Nearest Neighbor"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Analyzing Patterns"
        self.helpContext = 9010004
        self.distanceTypes = ["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"]
        self.params = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.type = "ValueList"
        param1.filter.list = ['EUCLIDEAN_DISTANCE','MANHATTAN_DISTANCE']
        param1.value = 'EUCLIDEAN_DISTANCE'

        param2 = ARCPY.Parameter(displayName="Generate Report",
                            name = "Generate_Report",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['GENERATE_REPORT', 'NO_REPORT']
        param2.value  = False

        param3 = ARCPY.Parameter(displayName="Area",
                            name = "Area",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.type = "Range"
        param3.filter.list = [0.0,999999999999999.0]

        param4 = ARCPY.Parameter(displayName="NNRatio",
                            name = "NNRatio",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")
        param4.value = 0
        param5 = ARCPY.Parameter(displayName="NNZScore",
                            name = "NNZScore",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")
        param5.value = 0
        param6 = ARCPY.Parameter(displayName="PValue",
                            name = "PValue",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")
        param6.value = 0
        param7 = ARCPY.Parameter(displayName="NNExpected",
                            name = "NNExpected",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")
        param7.value = 0
        param8 = ARCPY.Parameter(displayName="NNObserved",
                            name = "NNObserved",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")
        param8.value = 0
        param9 = ARCPY.Parameter(displayName="Report File",
                            name = "Report_File",
                            datatype = "DEFile",
                            parameterType = "Derived",
                            direction = "Output")
        #param9.filter.list = ['html'] #issue
        param9.enabled = False

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        if self.params[0].altered:
            try:
                desc = ARCPY.Describe(self.params[0].value)
                outSpatRef = setEnvSpatialReference(desc.SpatialReference)
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    self.params[1].enabled = False
                else:
                    self.params[1].enabled = True
            except:
                pass

        if self.params[1].altered:
            value1 = self.params[1].value.upper().replace(" ", "_")
            if value1 in swapType:
                self.params[1].value = swapType[value1]


        if not self.params[1].value:
            self.params[1].value = "EUCLIDEAN_DISTANCE"

        return

    def updateMessages(self, parameters):
        self.params = parameters
        if self.params[1].hasError():
            if self.params[1].value.upper().replace(" ", "_") in self.distanceTypes:
                self.params[1].clearMessage()
        return

    def execute(self, parameters, messages):
        import NearestNeighbor as NN
        NN.execute(parameters, messages)

class DirectionalDistribution(object):
    def __init__(self):
        self.label = "Directional Distribution (Standard Deviational Ellipse)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Measuring Geographic Distributions"
        self.helpContext = 9040004
        self.circTypes = {"1_STANDARD_DEVIATION":1, "2_STANDARD_DEVIATIONS":2,
                          "3_STANDARD_DEVIATIONS":3}
        self.params = None
    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Ellipse Feature Class",
                            name = "Output_Ellipse_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Ellipse Size",
                            name = "Ellipse_Size",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "ValueList"

        param2.filter.list = ['1_STANDARD_DEVIATION','2_STANDARD_DEVIATIONS','3_STANDARD_DEVIATIONS']

        param2.value = '1_STANDARD_DEVIATION'

        param3 = ARCPY.Parameter(displayName="Weight Field",
                            name = "Weight_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param3.parameterDependencies = ["Input_Feature_Class"]

        param4 = ARCPY.Parameter(displayName="Case Field",
                            name = "Case_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['Short', 'Long', 'Text', 'Date', 'BigInteger']
        param4.parameterDependencies = ["Input_Feature_Class"]

        return [param0,param1,param2,param3,param4]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        self.fieldObjects = {}
        if self.params[0].altered:
            #if not self.params[0].isInputValueDerived():
            try:
                desc = ARCPY.Describe(self.params[0].value)
                for field in desc.fields:
                    self.fieldObjects[field.name] = field
            except:
                pass

        if not self.params[2].value:
            self.params[2].value = "1_STANDARD_DEVIATION"

        #### Add Fields ####
        addFields = []

        #### Weight Field ####
        if self.params[3].value:
            fieldName = self.params[3].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        #### Case Field ####
        if self.params[4].value:
            fieldName = self.params[4].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["CenterX", "CenterY", "XStdDist", "YStdDist", "Rotation"]
            
        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "DOUBLE"
            addFields.append(newField)  
        self.params[1].schema.additionalFields = addFields
        
        #### Set Symbology ####
        renderLayerFile = "StandardDeviationalEllipse.lyr"
        fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
        self.params[1].symbology = fullRLF

    def updateMessages(self, parameters):
        self.params = parameters
        if self.params[2].hasError():
            if self.params[2].value.upper().replace(" ", "_") in self.circTypes:
                self.params[2].clearMessage()

    def execute(self, parameters, messages):
        import StandardEllipse as SE

        inputFC = UTILS.getTextParameter(0, parameters)
        outputFC = UTILS.getTextParameter(1, parameters)
        stdDeviations = UTILS.getTextParameter(2, parameters).upper().replace(" ", "_")
        weightField = UTILS.getTextParameter(3, parameters, fieldName = True)
        caseField = UTILS.getTextParameter(4, parameters, fieldName = True)         

        fieldList = []
        if weightField:
            fieldList.append(weightField)
        if caseField:
            fieldList.append(caseField)

        #### Get Standard deviation value ####
        stdDeviations = self.circTypes[stdDeviations]

        #### Create a Spatial Stats Data Object (SSDO) ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC,
                                 useChordal = False)
        
        #### Apply Exec new field type checker ####
        check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=fieldList)

        #### Populate SSDO with Data ####
        ssdo.obtainData(ssdo.oidName, fieldList, minNumObs = 3,
                        requireGeometry = ssdo.complexFeature) 

        #### Run Analysis ####
        se = SE.StandardEllipse(ssdo, weightField = weightField, 
                             caseField = caseField, 
                             stdDeviations = stdDeviations)

        #### Create Output ####
        se.createOutput(outputFC, parameters)

class MeanCenter(object):
    def __init__(self):
        self.label = "Mean Center"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Measuring Geographic Distributions"
        self.helpContext = 9040002
        self.hasZ = False
        self.params = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Weight Field",
                            name = "Weight_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param2.parameterDependencies = ["Input_Feature_Class"]

        param3 = ARCPY.Parameter(displayName="Case Field",
                            name = "Case_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.list = ['Short', 'Long', 'Text', 'Date', 'BigInteger']
        param3.parameterDependencies = ["Input_Feature_Class"]

        param4 = ARCPY.Parameter(displayName="Dimension Field",
                            name = "Dimension_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param4.parameterDependencies = ["Input_Feature_Class"]

        return [param0,param1,param2,param3,param4]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        #### Check for Z Geometry and Fields ####
        self.params = parameters
        self.fieldObjects = {}
        if self.params[0].altered:
            if not self.params[0].isInputValueDerived():
                try:
                    desc = ARCPY.Describe(self.params[0].value)
                    if desc.HasZ:
                        self.hasZ = True
                    for field in desc.fields:
                        self.fieldObjects[field.name] = field
                except:
                    pass
            else:
                try:
                    desc = ARCPY.Describe(self.params[0].value)
                    for field in desc.fields:
                        self.fieldObjects[field.name] = field
                except:
                    pass                

        #### Add Fields ####
        addFields = []

        #### Weight Field ####
        if self.params[2].value:
            fieldName = self.params[2].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        #### Case Field ####
        if self.params[3].value:
            fieldName = self.params[3].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        #### Dim Field ####
        if self.params[4].value:
            fieldName = self.params[4].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["XCoord", "YCoord"]
        if self.hasZ:
          fieldNames.append("ZCoord")

        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "DOUBLE"
            addFields.append(newField)  
        self.params[1].schema.additionalFields = addFields      
        self.params[1].schema.featureTypeRule = "AsSpecified"
        self.params[1].schema.featureType = "Simple"
        self.params[1].schema.geometryTypeRule = "AsSpecified"
        self.params[1].schema.geometryType = "Point"

    def updateMessages(self, parameters):
        return

    def execute(self, parameters, messages):
        import MeanCenter as MC
        MC.execute(parameters, messages)

class StandardDistance(object):
    def __init__(self):
        self.label = "Standard Distance"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Measuring Geographic Distributions"
        self.helpContext = 9040005
        self.circTypes = {"1_STANDARD_DEVIATION":1, "2_STANDARD_DEVIATIONS":2,
                          "3_STANDARD_DEVIATIONS":3}
        self.params = None
        
        #### Set Parameter Defaults ####
        self.defaultIndexList = [2]
        self.defaultValueList = ['1_STANDARD_DEVIATION']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Standard Distance Feature Class",
                            name = "Output_Standard_Distance_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Circle Size",
                            name = "Circle_Size",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "ValueList"

        param2.filter.list = ['1_STANDARD_DEVIATION','2_STANDARD_DEVIATIONS','3_STANDARD_DEVIATIONS']

        param2.value = '1_STANDARD_DEVIATION'

        param3 = ARCPY.Parameter(displayName="Weight Field",
                            name = "Weight_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param3.parameterDependencies = ["Input_Feature_Class"]

        param4 = ARCPY.Parameter(displayName="Case Field",
                            name = "Case_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['Short', 'Long', 'Text', 'Date', 'BigInteger']
        param4.parameterDependencies = ["Input_Feature_Class"]

        return [param0,param1,param2,param3,param4]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        self.fieldObjects = {}
        if self.params[0].altered:
            #if not self.params[0].isInputValueDerived():
            try:
                desc = ARCPY.Describe(self.params[0].value)
                for field in desc.fields:
                    self.fieldObjects[field.name] = field
            except:
                pass

        #### Add Fields ####
        addFields = []

        #### Weight Field ####
        if self.params[3].value:
            fieldName = self.params[3].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        #### Case Field ####
        if self.params[4].value:
            fieldName = self.params[4].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["CenterX", "CenterY", "StdDist"]
            
        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "DOUBLE"
            addFields.append(newField)  
        self.params[1].schema.additionalFields = addFields

    def updateMessages(self, parameters):
        self.params = parameters
        if self.params[2].hasError():
            if self.params[2].value.upper().replace(" ", "_") in self.circTypes:
                self.params[2].clearMessage()

    def execute(self, parameters, messages):
        import StandardDistance as SD
        SD.execute(parameters, messages)

class CollectEvents(object):
    def __init__(self):
        self.label = "Collect Events"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        self.helpContext = 9050001
        self.outputFieldNames = ["ICOUNT"]
        self.outputFieldTypes = ["LONG"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Incident Features",
                            name = "Input_Incident_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Weighted Point Feature Class",
                            name = "Output_Weighted_Point_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Results Field",
                            name = "Results_Field",
                            datatype = "Field",
                            parameterType = "Derived",
                            direction = "Output")

        param2.value = 'Count'

        param3 = ARCPY.Parameter(displayName="Z Max Value",
                            name = "Z_Max_Value",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        return [param0,param1,param2,param3]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        outputFeatures = parameters[1]

        if inputFeatures.value and outputFeatures.value:
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, outputFieldNames = self.outputFieldNames,
                                     outputFieldTypes = self.outputFieldTypes)
            outputFeatures.schema.featureTypeRule = "AsSpecified"
            outputFeatures.schema.featureType = "Simple"
            outputFeatures.schema.geometryTypeRule = "AsSpecified"
            outputFeatures.schema.geometryType = "Point"
            outputFeatures.symbology = OS.path.join(fullLayerPath, "CollectEventsRenderer.lyrx")

    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        outputFeatures = parameters[1]

        if inputFeatures.value and outputFeatures.value:
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, outputFieldNames = self.outputFieldNames,
                                     outputFieldTypes = self.outputFieldTypes)

    def execute(self, parameters, messages):
        import CollectEvents as CE
        CE.execute(parameters, messages)

class GeographicallyWeightedRegression(object):
    def __init__(self):
        self.label = "Geographically Weighted Regression"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060002
        self.shapeType = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Point','Polygon']

        param1 = ARCPY.Parameter(displayName="Dependent variable",
                            name = "dependent_field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double']

        param1.parameterDependencies = ["in_features"]

        param2 = ARCPY.Parameter(displayName="Explanatory variable(s)",
                            name = "explanatory_field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param2.filter.list = ['Short','Long','Float','Double']

        param2.parameterDependencies = ["in_features"]

        param3 = ARCPY.Parameter(displayName="Output feature class",
                            name = "out_featureclass",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param4 = ARCPY.Parameter(displayName="Kernel type",
                            name = "kernel_type",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.type = "ValueList"

        param4.filter.list = ['FIXED','ADAPTIVE']

        param4.value = 'FIXED'

        param5 = ARCPY.Parameter(displayName="Bandwidth method",
                            name = "bandwidth_method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param5.filter.type = "ValueList"

        param5.filter.list = ['AICc','CV','BANDWIDTH_PARAMETER']

        param5.value = 'AICc'

        param6 = ARCPY.Parameter(displayName="Distance",
                            name = "distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "Range"
        param6.filter.list = [0.0, 1.79769e+308]
        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Number of neighbors",
                            name = "number_of_neighbors",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.type = "Range"
        param7.filter.list = [1,1000]
        param7.value = 30
        param7.enabled = False
        
        param8 = ARCPY.Parameter(displayName="Weights",
                            name = "weight_field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param8.filter.list = ['Short', 'Long', 'Float', 'Double']
        param8.parameterDependencies = ["in_features"]

        param9 = ARCPY.Parameter(displayName="Coefficient raster workspace",
                            name = "coefficient_raster_workspace",
                            datatype = "DEWorkspace",
                            parameterType = "Optional",
                            direction = "Input")
        param9.category = "Additional Parameters (Optional)"

        param10 = ARCPY.Parameter(displayName="Output cell size",
                            name = "cell_size",
                            datatype = "analysis_cell_size",
                            parameterType = "Optional",
                            direction = "Input")

        param10.category = "Additional Parameters (Optional)"

        param11 = ARCPY.Parameter(displayName="Prediction locations",
                            name = "in_prediction_locations",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param11.filter.list = ['Point', 'Polygon']
        param11.category = "Additional Parameters (Optional)"

        param12 = ARCPY.Parameter(displayName="Prediction explanatory variable(s)",
                            name = "prediction_explanatory_field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)
        param12.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param12.filter.list = ['Short', 'Long', 'Float', 'Double']
        param12.category = "Additional Parameters (Optional)"
        param12.parameterDependencies = ["in_prediction_locations"]

        param13 = ARCPY.Parameter(displayName="Output prediction feature class",
                            name = "out_prediction_featureclass",
                            datatype = "DEFeatureClass",
                            parameterType = "Optional",
                            direction = "Output")
        param13.category = "Additional Parameters (Optional)"

        param14 = ARCPY.Parameter(displayName="Output table",
                            name = "out_table",
                            datatype = "DETable",
                            parameterType = "Derived",
                            direction = "Output")
        param14.enabled = False

        param15 = ARCPY.Parameter(displayName="Output regression rasters",
                            name = "out_regression_rasters",
                            datatype = "GPRasterLayer",
                            parameterType = "Derived",
                            direction = "Output")
        param15.enabled = False
        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9,param10,param11,param12,param13,param14,param15]

    def isLicensed(self):
        try:
            t = ARCPY.CheckOutExtension("Spatial")
            if t != 'CheckedOut':
                return False
        except:
            return False

        return True

    def updateParameters(self, parameters):
        size = 0
        desc = None

        if parameters[0].altered:
            try:
                desc = ARCPY.Describe(parameters[0].value)
                size = min(desc.extent.width, desc.extent.height) / 250.0
                shapeType = desc.ShapeType.upper()
                if shapeType == "POINT":
                    parameters[3].symbology = OS.path.join(fullLayerPath, "GWR_Points.lyrx")
                if shapeType == "POLYGON":
                    parameters[3].symbology = OS.path.join(fullLayerPath, "GWR_Polygons.lyrx")
            except:
                pass

        if not parameters[10].altered:
            if size > 0:
                parameters[10].value = size

        if parameters[5].altered:
            value5 = parameters[5].value.upper().replace(' ', '_')
            parameters[5].value = value5

        if parameters[4].value:
            if parameters[4].value == 'FIXED' and parameters[5].value == 'BANDWIDTH_PARAMETER':
                parameters[6].enabled = True
                parameters[7].enabled = False
            if parameters[4].value == 'ADAPTIVE' and parameters[5].value == 'BANDWIDTH_PARAMETER':
                parameters[6].enabled = False
                parameters[7].enabled = True

        return

    def updateMessages(self, parameters):
        return

    def execute(self, parameters, messages):
        ### Get parameter values ####
        in_features = UTILS.getTextParameter(0, parameters)
        dependent_field = UTILS.getTextParameter(1, parameters, fieldName = True)
        explanatory_field = UTILS.getTextParameter(2, parameters)
        out_feature = UTILS.getTextParameter(3, parameters)
        kernel_type = UTILS.getTextParameter(4, parameters)
        band_width =  UTILS.getTextParameter(5, parameters)
        distance = UTILS.getNumericParameter(6, parameters, defualt = "FLOAT")
        nn = UTILS.getNumericParameter(7, parameters)
        weight_field = UTILS.getTextParameter(8, parameters, fieldName = True)
        crw = UTILS.getTextParameter(9, parameters)
        anaCellSize = UTILS.getTextParameter(10, parameters)
        in_pred = UTILS.getTextParameter(11, parameters)
        pred_field = UTILS.getTextParameter(12, parameters)
        out_pred = UTILS.getTextParameter(13, parameters)
        gwr = UTILS.getTextParameter(14, parameters)
        coe = UTILS.getTextParameter(15, parameters)
        import warnings as WARNINGS
        with WARNINGS.catch_warnings():
            WARNINGS.simplefilter("ignore")

            try:
                ARCPY.GeographicallyWeightedRegression_analysis(
                        in_features, dependent_field, explanatory_field, out_feature,
                        kernel_type, band_width, distance, nn, weight_field, crw,
                        anaCellSize, in_pred, pred_field, out_pred)
            except:
                pass

            ####Wrapping messages ####
            errors = ARCPY.GetMessages(2)
            warnings = ARCPY.GetMessages(1)
            output = ARCPY.GetMessages(0)
            if len(warnings):
                ARCPY.AddWarning(str(warnings))
            if len(output):
                n = output.find("Bandwidth")
                if n > -1:
                    output = output[n:]
                    ARCPY.AddMessage(str(output))
            if len(errors):
                ARCPY.AddError(str(errors))

        return

class GWR(object):
    def __init__(self):
        self.label = "Geographically Weighted Regression"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060007
        self.shapeType = None
        #### Define Default Parameters ####
        self.defaultIndexList = [2, 20]
        self.defaultValueList = ["CONTINUOUS", "BISQUARE"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point','Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Dependent Variable",
                            name = "dependent_variable",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.list = ['Short','Long','Float','Double','BigInteger']
        param1.parameterDependencies = ["in_features"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Model Type",
                                 name="model_type",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.type = "ValueList"
        param2.filter.list = ["CONTINUOUS", "BINARY", "COUNT"]
        param2.value = "CONTINUOUS"
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Explanatory Variable(s)",
                            name = "explanatory_variables",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param3.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param3.filter.list = ['Short','Long','Float','Double','BigInteger']
        param3.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param3.parameterDependencies = ["in_features"]
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Output Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")
        param4.displayOrder = 5

        param5 = ARCPY.Parameter(displayName="Neighborhood Type",
                                 name="neighborhood_type",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["NUMBER_OF_NEIGHBORS", "DISTANCE_BAND"]
        param5.displayOrder = 6

        param6 = ARCPY.Parameter(displayName="Neighborhood Selection Method",
                                 name="neighborhood_selection_method",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ["GOLDEN_SEARCH", "MANUAL_INTERVALS",
                              "USER_DEFINED"]
        param6.displayOrder = 7

        #### Optimized (Optional) / Manual (Required) ####
        param7 = ARCPY.Parameter(displayName = "Minimum Number of Neighbors",
                                 name = "minimum_number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param7.filter.type = "Range"
        param7.filter.list = [2, 999]
        param7.enabled = False
        param7.displayOrder = 8

        #### Optimized (Optional) ####
        param8 = ARCPY.Parameter(displayName = "Maximum Number of Neighbors",
                                 name = "maximum_number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param8.filter.type = "Range"
        param8.filter.list = [3, 1000]
        param8.enabled = False
        param8.displayOrder = 9

        #### Optimized (Optional) / Manual (Required) ####
        param9 = ARCPY.Parameter(displayName = "Minimum Search Distance",
                                 name = "minimum_search_distance",
                                 datatype = "GPLinearUnit",
                                 parameterType = "Optional",
                                 direction = "Input")
        param9.filter.list = supportDist
        param9.enabled = False
        param9.displayOrder = 10

        #### Optimized (Optional) ####
        param10 = ARCPY.Parameter(displayName = "Maximum Search Distance",
                                 name = "maximum_search_distance",
                                 datatype = "GPLinearUnit",
                                 parameterType = "Optional",
                                 direction = "Input")
        param10.filter.list = supportDist
        param10.enabled = False
        param10.displayOrder = 11

        #### Manual (Required) ####
        param11 = ARCPY.Parameter(displayName = "Number of Neighbors Increment",
                                 name = "number_of_neighbors_increment",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param11.filter.type = "Range"
        param11.filter.list = [1, 500]
        param11.enabled = False
        param11.displayOrder = 12

        #### Manual (Required) ####
        param12 = ARCPY.Parameter(displayName = "Search Distance Increment",
                                  name = "search_distance_increment",
                                  datatype = "GPLinearUnit",
                                  parameterType = "Optional",
                                  direction = "Input")
        param12.filter.list = supportDist
        param12.enabled = False
        param12.displayOrder = 13

        #### Manual (Required) ####
        param13 = ARCPY.Parameter(displayName = "Number of Increments",
                                  name = "number_of_increments",
                                  datatype = "GPLong",
                                  parameterType = "Optional",
                                  direction = "Input")
        param13.filter.type = "Range"
        param13.filter.list = [2, 20]
        param13.enabled = False
        param13.displayOrder = 14

        #### User Defined with Number of Neighbors Parameters (Required) ####
        param14 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param14.filter.type = "Range"
        param14.filter.list = [2, 1000]
        param14.enabled = False
        param14.displayOrder = 15

        #### User Defined with Distance Band Parameters (Required) ####
        param15 = ARCPY.Parameter(displayName = "Distance Band",
                                  name = "distance_band",
                                  datatype = "GPLinearUnit",
                                  parameterType = "Optional",
                                  direction = "Input")
        param15.filter.list = supportDist
        param15.enabled = False
        param15.displayOrder = 16

        #### Prediction ####
        param16 = ARCPY.Parameter(displayName="Prediction Locations",
                            name = "prediction_locations",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param16.filter.list = ['Point','Polygon']
        param16.category = "Prediction Options"
        param16.displayOrder = 17

        param17 = ARCPY.Parameter(displayName="Explanatory Variables to Match",
                                 name="explanatory_variables_to_match",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param17.parameterDependencies = [param16.name]
        param17.columns = [['GPString', 'Field From Input Features'],
                           ['Field','Field From Prediction Locations']]
        param17.columns = [['Field', 'Field From Prediction Locations'],
                           ['GPString','Field From Input Features']]
        param17.filters[1].type = "ValueList"
        param17.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param17.category = "Prediction Options"
        param17.displayOrder = 18

        param18 = ARCPY.Parameter(displayName="Output Predicted Features",
                                  name = "output_predicted_features",
                                  datatype = "DEFeatureClass",
                                  parameterType = "Optional",
                                  direction = "Output")
        param18.category = "Prediction Options"
        param18.displayOrder = 19

        param19 = ARCPY.Parameter(displayName = "Robust Prediction",
                                  name = "robust_prediction",
                                  datatype = 'GPBoolean',
                                  parameterType = "Optional",
                                  direction = "Input")
        param19.filter.list = ['ROBUST', 'NON_ROBUST']
        param19.value = True
        param19.category = "Prediction Options"
        param19.displayOrder = 20

        #### Additional Options ####
        param20 = ARCPY.Parameter(displayName="Local Weighting Scheme",
                            name = "local_weighting_scheme",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param20.filter.type = "ValueList"
        param20.filter.list = ['GAUSSIAN','BISQUARE']
        param20.value = 'BISQUARE'
        param20.category = "Additional Options"
        param20.displayOrder = 21

        param21 = ARCPY.Parameter(displayName="Coefficient Raster Workspace",
                                  name = "coefficient_raster_workspace",
                                  datatype = "DEWorkspace",
                                  parameterType = "Optional",
                                  direction = "Input")
        param21.category = "Additional Options"
        param21.displayOrder = 22
        #### Must Have Advanced License for Coef Rasters ####
        if not checkLicense():
            param21.enabled = False

        param22 = ARCPY.Parameter(displayName="Coefficient Raster Layers",
                                  name = "coefficient_raster_layers",
                                  datatype = "GPRasterLayer",
                                  parameterType = "Derived",
                                  direction = "Output",
                                  multiValue = True)
        param22.displayOrder = 23

        param23 = ARCPY.Parameter(displayName = "Scale Data",
                                  name = 'scale',
                                  datatype = 'GPBoolean',
                                  parameterType = "Optional",
                                  direction = "Input")
        param23.filter.list = ['SCALE_DATA', 'NO_SCALE_DATA']
        param23.enabled = True
        param23.displayOrder = 4

        return [param0, param1, param2, param3, param4, param5, param6,
                param7, param8, param9, param10, param11, param12,
                param13, param14, param15, param16, param17, param18,
                param19, param20, param21, param22, param23]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        import GWR

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        model = parameters[2]
        stdVar = parameters[23]
        change0 = paramChanged(parameters[0]) 
        change2 = paramChanged(model)
        change23 = paramChanged(stdVar)
        isPythonCMD = change0 and change2 and change23 
        isContinuous = model.value == "CONTINUOUS"

        #### Set Base Standardization to False ####
        #if isPythonCMD:
        #    if isContinuous:
        #        stdVar.enabled = True
        #    else:
        #        stdVar.enabled = False
        #        stdVar.value = False
        #else:
        if isContinuous:
            stdVar.enabled = True
        else:
            stdVar.enabled = False
            stdVar.value = False

        desc = None
        if parameters[0].altered or parameters[2].altered:
            modelType = parameters[2].value
            try:
                desc = ARCPY.Describe(parameters[0].value)
                shapeType = desc.ShapeType.upper()
                outLYR = ""
                if modelType == "CONTINUOUS":
                    if shapeType == "POINT":
                        outLYR = "GWR_Points.lyrx"
                    if shapeType == "POLYGON":
                        outLYR = "GWR_Polygons.lyrx"
                else:
                    if shapeType == "POINT":
                        outLYR = "GGWR_Points.lyrx"
                    if shapeType == "POLYGON":
                        outLYR = "GGWR_Polygons.lyrx"
                parameters[4].symbology = OS.path.join(fullLayerPath, outLYR)
            except:
                pass

        #### Neighborhood Search Options ####
        param5 = parameters[5].value
        param6 = parameters[6].value

        if param5 and param6:
            if param5 == "NUMBER_OF_NEIGHBORS":
                parameters[6].filter.list = ["GOLDEN_SEARCH", "MANUAL_INTERVALS", "USER_DEFINED"]

                #### Min/Max Distance ####
                clearParameter(parameters[9])
                clearParameter(parameters[10])
                clearParameter(parameters[12])

                #### User Dist/SWM ####
                clearParameter(parameters[15])

                if param6 in ["GOLDEN_SEARCH", "MANUAL_INTERVALS"]:
                    #### User Provided ####
                    clearParameter(parameters[14])

                    #### Min KNN ####
                    parameters[7].enabled = True

                    if param6 == "MANUAL_INTERVALS":
                        #### Max KNN ####
                        clearParameter(parameters[8])

                        #### Number of KNN/Increments ####
                        parameters[11].enabled = True
                        parameters[13].enabled = True
                    else:
                        #### Max KNN ####
                        parameters[8].enabled = True

                        #### Number of KNN/Increments ####
                        clearParameter(parameters[11])
                        clearParameter(parameters[13])

                else:
                    #### User Provided ####
                    parameters[14].enabled = True
                    clearParameter(parameters[7])
                    clearParameter(parameters[8])
                    clearParameter(parameters[11])
                    clearParameter(parameters[13])

            if param5 == "DISTANCE_BAND":
                parameters[6].filter.list = ["GOLDEN_SEARCH", "MANUAL_INTERVALS", "USER_DEFINED"]

                #### Min/Max KNN ####
                clearParameter(parameters[7])
                clearParameter(parameters[8])
                clearParameter(parameters[11])

                #### User KNN/SWM ####
                clearParameter(parameters[14])

                if param6 in ["GOLDEN_SEARCH", "MANUAL_INTERVALS"]:
                    #### User Provided ####
                    clearParameter(parameters[15])

                    #### Min Distance ####
                    parameters[9].enabled = True

                    if param6 == "MANUAL_INTERVALS":
                        #### Max Distance ####
                        clearParameter(parameters[10])

                        #### Number of Distance/Increments ####
                        parameters[12].enabled = True
                        parameters[13].enabled = True
                    else:
                        #### Max Distance ####
                        parameters[10].enabled = True

                        #### Number of Distance/Increments ####
                        clearParameter(parameters[12])
                        clearParameter(parameters[13])

                else:
                    #### User Provided ####
                    parameters[15].enabled = True
                    clearParameter(parameters[9])
                    clearParameter(parameters[10])
                    clearParameter(parameters[12])
                    clearParameter(parameters[13])

        #### Linear Unit Filters ####
        if parameters[9].value:
            try:
                linearUnit = parameters[9].valueAsText.split(" ")[-1]
                parameters[10].filter.list = [linearUnit]
                parameters[12].filter.list = [linearUnit]
            except:
                parameters[10].filter.list = supportDist
                parameters[12].filter.list = supportDist
        else:
            parameters[10].filter.list = supportDist
            parameters[12].filter.list = supportDist

        if not parameters[3].value or not parameters[16].value:
            # remove all the items in the predict items
            parameters[17].value = None

        #### Match Input / Prediction Fields ####
        if paramChanged(parameters[3]) or paramChanged(parameters[16]):
            param16 = parameters[16].value
            param3 = parameters[3].value
            if param3 and param16:
                #### Set Default Matches (Only on First Attempt) ####
                indVars = parameters[3].valueAsText.split(";")

                try:
                    desc = ARCPY.Describe(param16)
                    shapeType = desc.ShapeType.upper()
                    predLYR = ""
                    if modelType == "BINARY":
                        if shapeType == "POINT":
                            predLYR = "GWR_Predict_Points_Binary.lyrx"
                        else:
                            predLYR = "GWR_Predict_Polygons_Binary.lyrx"
                    elif modelType == "COUNT":
                        if shapeType == "POINT":
                            predLYR = "GWR_Predict_Points_Count.lyrx"
                        else:
                            predLYR = "GWR_Predict_Polygons_Count.lyrx"
                    else:
                        if shapeType == "POINT":
                            predLYR = "GWR_Predict_Points.lyrx"
                        else:
                            predLYR = "GWR_Predict_Polygons.lyrx"
                    parameters[18].symbology = OS.path.join(fullLayerPath, predLYR)

                    nameAliasMapPredFC = dict()
                    for fieldObj in desc.fields:
                        nameAliasMapPredFC[fieldObj.name] = fieldObj.aliasName
                    vtList = matchVariables(indVars, desc)
                    nameAliasMapInputFC = dict()
                    desc = ARCPY.Describe(parameters[0].value)
                    for fieldObj in desc.fields:
                        nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
                    for pair in vtList:
                        pair[1] = nameAliasMapInputFC[pair[1]]
                    if parameters[17].value:
                        #### Keep the Already Existing Fields Selected by User ####
                        existingMatchPairs = dict()
                        for vtRow in parameters[17].value:
                            predField = vtRow[0].value
                            indFieldAlias = vtRow[1]
                            if indFieldAlias not in existingMatchPairs:
                                existingMatchPairs[indFieldAlias] = predField
                        for pair in vtList:
                            if pair[1] in existingMatchPairs:
                                pair[0] = existingMatchPairs[pair[1]]
                    parameters[17].value = vtList
                except:
                    pass

        #### Robust Prediction ####
        if paramChanged(parameters[2]):
            if parameters[2].value != "CONTINUOUS":
                parameters[19].enabled = False
                parameters[19].value = False
            else:
                parameters[19].enabled = True

        #### Attach the Field Names to Output FC and Prediction FC for Model Builder####
        if parameters[0].value and parameters[1].value and \
                parameters[3].value and parameters[4].value and \
                parameters[5].value and parameters[6].value:
            try:
                outPath, outName = OS.path.split(UTILS.getTextParameter(4, parameters))
                if ARCPY.Exists(outPath):
                    outputFCFields = GWR.getOutputFCFields(parameters)
                    parameters[4].schema.additionalFields = outputFCFields
                else:
                    parameters[4].schema.additionalFields = []
            except:
                parameters[4].schema.additionalFields = []
        else:
            parameters[4].schema.additionalFields = []

        if parameters[0].value and parameters[1].value and \
                parameters[3].value and parameters[4].value and \
                parameters[5].value and parameters[6].value and \
                parameters[16].value and parameters[17].value and \
                parameters[18].value:
            try:
                outPath, outName = OS.path.split(UTILS.getTextParameter(18, parameters))
                if ARCPY.Exists(outPath):
                    predictFCFields = GWR.getPredictFCFields(parameters)
                    parameters[18].schema.additionalFields = predictFCFields
            except:
                parameters[18].schema.additionalFields = []
        else:
            parameters[18].schema.additionalFields = []

        #### Add Derived Raster Layers for Model Builder ####
        if parameters[21].value:
            if parameters[3].value and parameters[4].value:
                indVars = parameters[3].valueAsText.split(";")
                if stdVar.value:
                    indVars = ["S_" + i for i in indVars]
                outputFC = parameters[4].value.value
                outPath, outName = OS.path.split(UTILS.getTextParameter(4, parameters))
                try:
                    if ARCPY.Exists(outPath):
                        rasterNames = makeDerivedRasterLayers(indVars, outputFC)
                        parameters[22].value = rasterNames
                    else:
                        parameters[22].value = None
                except:
                    parameters[22].value = None
        else:
            parameters[22].value = None

        return

    def updateMessages(self, parameters):
        #### Optional to Required Parameter Messages ####
        import locale as LOCALE

        if parameters[0].altered:
            try:
                info = ARCPY.Describe(parameters[0].valueAsText)
                inputSpatRef = info.SpatialReference
                if inputSpatRef is None or inputSpatRef.name.upper() == "UNKNOWN":
                    parameters[0].setIDMessage("ERROR", 517)
            except:
                pass

        param5 = parameters[5].value
        param6 = parameters[6].value
        if param5 and param6:
            if param6 == "MANUAL_INTERVALS":
                if param5 == "NUMBER_OF_NEIGHBORS":
                    #### Minimum Number of Neighs ####
                    if not parameters[7].value:
                        if not parameters[7].hasError():
                            parameters[7].setIDMessage("ERROR", 110161)

                    #### Number of Neighs Increment ####
                    if not parameters[11].value:
                        parameters[11].setIDMessage("ERROR", 110162)

                else:
                    #### Minimum Distance ####
                    if not parameters[9].value:
                        parameters[9].setIDMessage("ERROR", 110163)
                    else:
                        positiveParam = parameters[9]
                        positiveParamValue, positiveParamUnit = positiveParam.valueAsText.split(" ")
                        if LOCALE.atof(positiveParamValue) <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                    #### Distance Increment ####
                    if not parameters[12].value:
                        parameters[12].setIDMessage("ERROR", 110164)
                    else:
                        positiveParam = parameters[12]
                        positiveParamValue, positiveParamUnit = positiveParam.valueAsText.split(" ")
                        if LOCALE.atof(positiveParamValue) <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                #### Number of Increments ####
                if not parameters[13].value:
                    parameters[13].setIDMessage("ERROR", 110165)

            if param6 == "USER_DEFINED":
                if param5 == "NUMBER_OF_NEIGHBORS":
                    #### Number of Neighs ####
                    if not parameters[14].value:
                        if not parameters[14].hasError():
                            parameters[14].setIDMessage("ERROR", 110166)

                else:
                    #### Distance Band ####
                    if not parameters[15].value:
                        parameters[15].setIDMessage("ERROR", 110167)
                    else:
                        positiveParam = parameters[15]
                        positiveParamValue, positiveParamUnit = positiveParam.valueAsText.split(" ")
                        if LOCALE.atof(positiveParamValue) <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

            if param6 == "GOLDEN_SEARCH":
                if param5 == "NUMBER_OF_NEIGHBORS":
                    #### Minimum Number of Neighs < Maximum ####
                    if parameters[7].value and parameters[8].value:
                        if parameters[7].value >= parameters[8].value:
                            parameters[7].setIDMessage("ERROR", 110223)

                else:
                    #### Minimum Distance < Maximum ####
                    if parameters[9].value and parameters[10].value:
                        param9, unit9 = parameters[9].valueAsText.split(" ")
                        param10, unit10 = parameters[10].valueAsText.split(" ")
                        if LOCALE.atof(param9) >= LOCALE.atof(param10):
                            parameters[9].setIDMessage("ERROR", 110224)

                        #### Linear Unit Must be the Same ####
                        if unit9.upper() != unit10.upper():
                            parameters[9].setIDMessage("ERROR", 110226)

                    positiveParam = parameters[9]
                    if positiveParam.value:
                        positiveParamValue, positiveParamUnit = positiveParam.valueAsText.split(" ")
                        if LOCALE.atof(positiveParamValue) <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                    positiveParam = parameters[10]
                    if positiveParam.value:
                        positiveParamValue, positiveParamUnit = positiveParam.valueAsText.split(" ")
                        if LOCALE.atof(positiveParamValue) <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

        #### Matching VT Errors ####
        if parameters[16].value and parameters[3].value and parameters[0].value:
            createVT = False
            try:
                descInputFC = ARCPY.Describe(parameters[0].value)
                fields = descInputFC.fields
                createVT = True
            except:
                pass

            if parameters[4].value and parameters[18].value:
                if parameters[4].valueAsText == parameters[18].valueAsText:
                    parameters[18].setIDMessage("ERROR", 110497)

            if createVT:
                aliasNameMapInputFC = dict()
                nameAliasMapInputFC = dict()
                for fieldObj in fields:
                    aliasNameMapInputFC[fieldObj.aliasName] = fieldObj.name
                    nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
                predFields = []
                inFieldAliases = []
                missingMatch = []
                if parameters[17].value:
                    for vtRow in parameters[17].value:
                        predField = vtRow[0].value
                        indFieldAlias = vtRow[1]
                        predFields.append(predField)
                        inFieldAliases.append(indFieldAlias)
                        if predField in ["#", ""]:
                            missingMatch.append(indFieldAlias)
            
                #### Missing Match ####
                if len(missingMatch):
                    missingMatch = ", ".join([i for i in missingMatch])
                    parameters[17].setIDMessage("ERROR", 110158, missingMatch)

                #### Check for Unique Prediction Fields ####
                predFieldsSet = set(predFields)
                if len(predFieldsSet) != len(predFields):
                    duplicate = []
                    for fieldName in predFieldsSet:
                        if predFields.count(fieldName) != 1 and fieldName not in ['', '#']:
                            duplicate.append(fieldName)
                    if len(duplicate) > 0:
                        duplicate = ", ".join(duplicate)
                        parameters[17].setIDMessage("ERROR", 110160, duplicate)

                #### Check for Unique Input Fields ####
                inFieldsAliasSet = set(inFieldAliases)
                if len(inFieldsAliasSet) != len(inFieldAliases):
                    duplicate = []
                    for inFieldAlias in inFieldsAliasSet:
                        if inFieldAliases.count(inFieldAlias) != 1 and inFieldAlias not in ['', '#']:
                            duplicate.append(inFieldAlias)
                    if len(duplicate) > 0:
                        duplicate = ", ".join(duplicate)
                        parameters[17].setIDMessage("ERROR", 110159, duplicate)

                #### Report Any Input Fields Left Unmatched From Ind Vars ####
                indVarAliases = set([nameAliasMapInputFC[indVar] for indVar in parameters[3].valueAsText.split(";") if indVar in nameAliasMapInputFC])
                missingVars = indVarAliases.difference(inFieldsAliasSet)
                if len(missingVars):
                    missingVars = ", ".join([i for i in missingVars])
                    parameters[17].setIDMessage("ERROR", 110157, missingVars)
                unexpectedVars = inFieldsAliasSet.difference(indVarAliases)
                hasEmptyField = False
                if '' in unexpectedVars or "#" in unexpectedVars:
                    hasEmptyField = True
                unexpectedVars = [v for v in unexpectedVars if v not in ['', '#']]
                if hasEmptyField:
                    unexpectedVars.append("''")
                if len(unexpectedVars):
                    unexpectedVars = ", ".join(unexpectedVars)
                    parameters[17].setIDMessage("ERROR", 110247, unexpectedVars)

                #### Must Provide Output Prediction Features ####
                if not parameters[18].value:
                    parameters[18].setIDMessage("ERROR", 110241)

        return

    def execute(self, parameters, messages):
        import GWR
        GWR.execute(parameters, messages)

class GeneralizedLinearRegression(object):
    def __init__(self):
        self.label = "Generalized Linear Regression"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060008
        self.shapeType = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point','Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Dependent Variable",
                            name = "dependent_variable",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.list = ['Short','Long','Float','Double','BigInteger']
        param1.parameterDependencies = ["in_features"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Model Type",
                                 name="model_type",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.type = "ValueList"
        param2.filter.list = ["CONTINUOUS", "BINARY", "COUNT"]
        param2.value = "CONTINUOUS"
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Output Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")
        param3.displayOrder = 5

        param4 = ARCPY.Parameter(displayName="Explanatory Variable(s)",
                            name = "explanatory_variables",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)

        param4.filter.list = ['Short','Long','Float','Double','BigInteger']
        param4.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param4.parameterDependencies = ["in_features"]
        param4.displayOrder = 3

        param5 = ARCPY.Parameter(displayName="Explanatory Distance Features",
                            name = "distance_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)
        param5.filter.list = ["Polygon", "Point", "Polyline"]
        param5.displayOrder = 4
        param5.enabled = True

        #### Prediction ####
        param6 = ARCPY.Parameter(displayName="Prediction Locations",
                                 name = "prediction_locations",
                                 datatype = "GPFeatureLayer",
                                 parameterType = "Optional",
                                 direction = "Input")
        param6.filter.list = ['Point','Polygon']
        param6.category = "Prediction Options"
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Explanatory Variables to Match",
                                 name="explanatory_variables_to_match",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param7.parameterDependencies = [param6.name]
        param7.columns = [['Field', 'Field From Prediction Locations'],
                          ['GPString', 'Field From Input Features']]
        param7.filters[1].type = "ValueList"
        param7.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param7.category = "Prediction Options"
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Match Distance Features",
                                 name = "explanatory_distance_matching",
                                 datatype = "GPValueTable",
                                 parameterType = "Optional",
                                 direction = "Input")
        param8.columns = [['GPFeatureLayer', 'Prediction Distance Features'],
                          ['GPString', 'Input Distance Features']]
        param8.filters[0].list = ["Polygon", "Point", "Polyline"]
        param8.controlCLSID = "{C99D0042-EF42-4B04-8A0B-1A53F6DB67A6}"
        param8.category = "Prediction Options"
        param8.displayOrder = 8
        param8.enabled = True

        param9 = ARCPY.Parameter(displayName="Output Predicted Features",
                                 name = "output_predicted_features",
                                 datatype = "DEFeatureClass",
                                 parameterType = "Optional",
                                 direction = "Output")
        param9.category = "Prediction Options"
        param9.displayOrder = 9

        param10 = ARCPY.Parameter(displayName="Output Trained Model File",
                            name = "output_trained_model",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Output")
        param10.filter.list = ['ssm']

        return [param0, param1, param2, param3, param4, param5, param6, 
                param7, param8, param9, param10]

    def isLicensed(self):
        return True

    def getOutputFieldInfo(self, modelType, dependentVar):
        outputFieldNames = []
        outputFieldAliases = []
        outputFieldTypes = []
        upperType = modelType.valueAsText.upper()
        if upperType == "CONTINUOUS":
            outputFieldNames += ["PREDICTED", "RESIDUAL", "STDRESID"]
            outputFieldAliases.append("Predicted ({0})".format(dependentVar.valueAsText))            
            outputFieldAliases += ["Residual", "Std Residual"]
            outputFieldTypes += ["DOUBLE", "DOUBLE", "DOUBLE"]
        elif upperType == "BINARY":
            outputFieldNames += ["PROB_1", "PREDICTED", "DEV_RESID"]
            outputFieldAliases.append("Probability of Being 1 ({0})".format(dependentVar.valueAsText))  
            outputFieldAliases.append("Predicted ({0})".format(dependentVar.valueAsText))            
            outputFieldAliases.append("Deviance Residual")
            outputFieldTypes += ["DOUBLE", "INTEGER", "DOUBLE"]
        else:
            outputFieldNames += ["RAW_PRED", "PREDICTED", "DEV_RESID"]
            outputFieldAliases.append("Raw Predicted ({0})".format(dependentVar.valueAsText))  
            outputFieldAliases.append("Predicted ({0})".format(dependentVar.valueAsText))            
            outputFieldAliases.append("Deviance Residual")
            outputFieldTypes += ["DOUBLE", "DOUBLE", "DOUBLE"]

        return outputFieldNames, outputFieldTypes, outputFieldAliases

    def getOutputPredFieldInfo(self, modelType, dependentVar):
        outputFieldNames = []
        outputFieldAliases = []
        outputFieldTypes = []
        upperType = modelType.valueAsText.upper()
        if upperType == "CONTINUOUS":
            outputFieldNames += ["PREDICTED"]
            outputFieldAliases.append("Predicted ({0})".format(dependentVar.valueAsText))    
            outputFieldTypes.append("DOUBLE")
        elif upperType == "BINARY":
            outputFieldNames += ["RAW_PRED", "PREDICTED"]
            outputFieldAliases.append("Probability of Being 1 ({0})".format(dependentVar.valueAsText))  
            outputFieldAliases.append("Predicted ({0})".format(dependentVar.valueAsText))        
            outputFieldTypes += ["DOUBLE", "INTEGER"]
        else:
            outputFieldNames += ["PROB_1", "PREDICTED"]
            outputFieldAliases.append("Raw Predicted ({0})".format(dependentVar.valueAsText))  
            outputFieldAliases.append("Predicted ({0})".format(dependentVar.valueAsText))            
            outputFieldTypes += ["DOUBLE", "DOUBLE"]

        return outputFieldNames, outputFieldTypes, outputFieldAliases

    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        dependentVar = parameters[1]
        modelType = parameters[2]
        outputFeatures = parameters[3]
        explanatoryVars = parameters[4]
        distanceFeatures = parameters[5]
        inputPrediction = parameters[6]
        explanatoryMatch = parameters[7]
        distanceMatch = parameters[8]
        outputPrediction = parameters[9]

        #### Required Inputs for Train Model ####
        validateTrain = inputFeatures.value and dependentVar.value and modelType.value
        validateTrain = validateTrain and outputFeatures.value
        if validateTrain and (explanatoryVars.value or distanceFeatures.value):
            fieldNames = [dependentVar.valueAsText.upper()]
            if explanatoryVars.value:
                fieldNames += [i.upper() for i in explanatoryVars.valueAsText.split(";")]
            distanceParameterInfo = None
            if distanceFeatures.value:
                distanceParameterInfo = (distanceFeatures, False)
            outputFieldNames, outputFieldTypes, outputFieldAliases = self.getOutputFieldInfo(modelType, dependentVar)

            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = fieldNames,
                                     distanceParameterInfo = distanceParameterInfo,
                                     outputFieldNames = outputFieldNames,
                                     outputFieldTypes = outputFieldTypes,
                                     outputFieldAliases = outputFieldAliases)

        #### Remove All the Items in the Predict UI If Origin Parameter is None ####
        if not inputPrediction.value:
            explanatoryMatch.value = None
            distanceMatch.value = None
        if not explanatoryVars.value:
            explanatoryMatch.value = None
        if not distanceFeatures.value:
            distanceMatch.value = None
        
        #### Match Input / Prediction Fields ####
        changedPredictions = paramChanged(inputPrediction)
        if paramChanged(explanatoryVars) or changedPredictions:
            param6 = inputPrediction.value
            param4 = explanatoryVars.value
            if param4 and param6:
                #### Set Default Matches (Only on First Attempt) ####
                indVars = explanatoryVars.valueAsText.split(";")
                try:
                    desc = ARCPY.Describe(param6)
                    nameAliasMapPredFC = dict()
                    for fieldObj in desc.fields:
                        nameAliasMapPredFC[fieldObj.name] = fieldObj.aliasName
                    vtList = matchVariables(indVars, desc)
                    nameAliasMapInputFC = dict()
                    desc = ARCPY.Describe(inputFeatures.value)
                    for fieldObj in desc.fields:
                        nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
                    for pair in vtList:
                        pair[1] = nameAliasMapInputFC[pair[1]]
                    if explanatoryMatch.value:
                        #### Keep the Already Existing Fields Selected by User ####
                        existingMatchPairs = dict()
                        for vtRow in explanatoryMatch.value:
                            predField = vtRow[0].value
                            indFieldAlias = vtRow[1]
                            if indFieldAlias not in existingMatchPairs:
                                existingMatchPairs[indFieldAlias] = predField
                        for pair in vtList:
                            if pair[1] in existingMatchPairs:
                                pair[0] = existingMatchPairs[pair[1]]
                    explanatoryMatch.value = vtList
                except:
                    pass

        #### Match Input / Prediction Distance Features ####
        if paramChanged(distanceFeatures) or changedPredictions:
            if distanceFeatures.value and inputPrediction.value:
                #### Only Set if Empty ####
                fcList = distanceFeatures.valueAsText.split(";")
                vtList = baseDistanceMatchList(fcList)
                matchedDistances = UTILS.getTextParameterMatch(8, parameters,
                                                              ["MappingLayerObject", "mp.Layer"])
                if matchedDistances is not None:
                    #### Keep the Already Existing FCs Selected by User ####
                    distEntry = [f[0] for f in matchedDistances]
                    existingMatchPairs = dict()
                    for f in matchedDistances:
                        predDisFC = f[0]
                        indDisFC = f[1]
                        existingMatchPairs[indDisFC] = predDisFC
                    for pair in vtList:
                        if pair[1] in existingMatchPairs:
                            pair[0] = existingMatchPairs[pair[1]]
                for pair in vtList:
                    pair[0] = pair[0].strip("'").strip("\"")
                distanceMatch.value = vtList

        validatePred = inputPrediction.value and dependentVar.value and modelType.value
        validatePred = validatePred and outputPrediction.value
        if validatePred and (explanatoryMatch.value or distanceMatch.value):
            fieldNames = []
            if explanatoryMatch.value:
                for vtRow in explanatoryMatch.value:
                    varName = vtRow[0].value
                    if str(varName) not in ["#", ""]:
                        fieldNames.append(varName)
            distanceMatchParameterInfo = None
            if distanceMatch.value:
                distanceMatchParameterInfo = (distanceMatch, True)
            outputFieldNames, outputFieldTypes, outputFieldAliases = self.getOutputPredFieldInfo(modelType, dependentVar)

            uissdo = UI_SSDataObject(inputPrediction, outputPrediction, fieldNames = fieldNames,
                                     distanceParameterInfo = distanceMatchParameterInfo,
                                     outputFieldNames = outputFieldNames,
                                     outputFieldTypes = outputFieldTypes,
                                     outputFieldAliases = outputFieldAliases)

        UTILS.validateOutputFile(parameters, 10, ".ssm")

        return

    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        dependentVar = parameters[1]
        modelType = parameters[2]
        outputFeatures = parameters[3]
        explanatoryVars = parameters[4]
        distanceFeatures = parameters[5]
        inputPrediction = parameters[6]
        explanatoryMatch = parameters[7]
        distanceMatch = parameters[8]
        outputPrediction = parameters[9]
        ssmFile = parameters[10]

        if ssmFile.value is not None:
            UTILS.checkOutputPath(ssmFile.valueAsText,"FILE",["SSM"], ssmFile)

        #### Required Inputs for Train Model ####
        validateTrain = inputFeatures.value and dependentVar.value and modelType.value
        validateTrain = validateTrain and outputFeatures.value
        uissdo = None
        if validateTrain and (explanatoryVars.value or distanceFeatures.value):
            fieldNames = [dependentVar.valueAsText.upper()]
            if explanatoryVars.value:
                fieldNames += [i.upper() for i in explanatoryVars.valueAsText.split(";")]
            distanceParameterInfo = None
            if distanceFeatures.value:
                distanceParameterInfo = (distanceFeatures, False)
            outputFieldNames, outputFieldTypes, outputFieldAliases = self.getOutputFieldInfo(modelType, dependentVar)

            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = fieldNames,
                                     distanceParameterInfo = distanceParameterInfo,
                                     outputFieldNames = outputFieldNames,
                                     outputFieldTypes = outputFieldTypes,
                                     outputFieldAliases = outputFieldAliases)
        
        #### Matching VT Errors ####
        if inputPrediction.value and explanatoryVars.value:
            descInputFC = None
            if uissdo is not None:
                if uissdo.ssdo is not None:
                    #### Borrow Describe From SSDO ####
                    descInputFC = uissdo.ssdo.info

            if descInputFC is None:
                descInputFC = ARCPY.Describe(inputFeatures.value)

            aliasNameMapInputFC = dict()
            nameAliasMapInputFC = dict()
            for fieldObj in descInputFC.fields:
                aliasNameMapInputFC[fieldObj.aliasName] = fieldObj.name
                nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
            predFields = []
            inFieldAliases = []
            missingMatch = []
            if explanatoryMatch.value:
                for vtRow in explanatoryMatch.value:
                    predField = vtRow[0].value
                    indFieldAlias = vtRow[1]
                    predFields.append(predField)
                    inFieldAliases.append(indFieldAlias)
                    if predField in ["#", ""]:
                        missingMatch.append(indFieldAlias)
            
            #### Missing Match ####
            if len(missingMatch):
                missingMatch = ", ".join([i for i in missingMatch])
                explanatoryMatch.setIDMessage("ERROR", 110158, missingMatch)

            #### Check for Unique Prediction Fields ####
            predFieldsSet = set(predFields)
            if len(predFieldsSet) != len(predFields):
                duplicate = []
                for fieldName in predFieldsSet:
                    if predFields.count(fieldName) != 1 and fieldName not in ['', '#']:
                        duplicate.append(nameAliasMapInputFC[fieldName])
                if len(duplicate) > 0:
                    duplicate = ", ".join(duplicate)
                    explanatoryMatch.setIDMessage("ERROR", 110160, duplicate)

            #### Check for Unique Input Fields ####
            inFieldsAliasSet = set(inFieldAliases)
            if len(inFieldsAliasSet) != len(inFieldAliases):
                duplicate = []
                for inFieldAlias in inFieldsAliasSet:
                    if inFieldAliases.count(inFieldAlias) != 1 and inFieldAlias not in ['', '#']:
                        duplicate.append(inFieldAlias)
                if len(duplicate) > 0:
                    duplicate = ", ".join(duplicate)
                    explanatoryMatch.setIDMessage("ERROR", 110159, duplicate)

            #### Report Any Input Fields Left Unmatched From Ind Vars ####
            indVarAliases = set([nameAliasMapInputFC[indVar] for indVar in explanatoryVars.valueAsText.split(";") if indVar in nameAliasMapInputFC])
            missingVars = indVarAliases.difference(inFieldsAliasSet)
            if len(missingVars):
                missingVars = ", ".join([i for i in missingVars])
                explanatoryMatch.setIDMessage("ERROR", 110157, missingVars)
            unexpectedVars = inFieldsAliasSet.difference(indVarAliases)
            hasEmptyField = False
            if '' in unexpectedVars or "#" in unexpectedVars:
                hasEmptyField = True
            unexpectedVars = [v for v in unexpectedVars if v not in ['', '#']]
            if hasEmptyField:
                unexpectedVars.append("''")
            if len(unexpectedVars):
                unexpectedVars = ", ".join(unexpectedVars)
                explanatoryMatch.setIDMessage("ERROR", 110247, unexpectedVars)

        if inputFeatures.value and outputFeatures.value and outputPrediction.value:
            if outputFeatures.valueAsText == outputPrediction.valueAsText:
                outputPrediction.setIDMessage("ERROR", 110497)

        #### Matching Distance VT Errors ####
        if inputPrediction.value and distanceFeatures.value:
            predFields = []
            inDistanceFCs = []
            missingMatch = []
            if distanceMatch.value:
                for vtRow in distanceMatch.value:
                    predField = vtRow[0]
                    if predField is None:
                        predField = "#"
                    else:
                        predField = str(predField)

                    indField = vtRow[1]
                    predFields.append(predField)
                    inDistanceFCs.append(indField)
                    if predField in ["#", '']:
                        missingMatch.append(indField)

            #### Missing Match ####
            if len(missingMatch):
                missingMatch = ", ".join([i for i in missingMatch])
                distanceMatch.setIDMessage("ERROR", 110218, missingMatch)

            #### Check for Unique Prediction Fields ####
            predFieldsSet = set(predFields)
            if len(predFieldsSet) != len(predFields):
                duplicate = []
                for fieldName in predFieldsSet:
                    if predFields.count(fieldName) != 1 and fieldName not in ['', '#']:
                        duplicate.append(fieldName)
                if len(duplicate) > 0:
                    duplicate = ", ".join(duplicate)
                    distanceMatch.setIDMessage("ERROR", 110220, duplicate)

            #### Check for Unique Input Fields ####
            predDistanceFCsSet = set(inDistanceFCs)
            if len(predDistanceFCsSet) != len(inDistanceFCs):
                duplicate = []
                for fieldName in predDistanceFCsSet:
                    if inDistanceFCs.count(fieldName) != 1 and fieldName not in ['', '#']:
                        duplicate.append(fieldName)
                if len(duplicate) > 0:
                    duplicate = ", ".join(duplicate)
                    distanceMatch.setIDMessage("ERROR", 110219, duplicate)

            #### Report Any Input Fields Left Unmatched From Ind Vars ####
            indFCs = set(distanceFeatures.valueAsText.split(";"))
            missingVars = indFCs.difference(inDistanceFCs)
            if len(missingVars):
                missingVars = ", ".join([i for i in missingVars])
                distanceMatch.setIDMessage("ERROR", 110217, missingVars)
            unexpectedFCs = predDistanceFCsSet.difference(indFCs)
            hasEmptyField = False
            if '' in unexpectedFCs or "#" in unexpectedFCs:
                hasEmptyField = True
            unexpectedFCs = [v for v in unexpectedFCs if v not in ['', '#']]
            if hasEmptyField:
                unexpectedFCs.append("''")
            if len(unexpectedFCs):
                unexpectedFCs = ", ".join([i for i in unexpectedFCs])
                distanceMatch.setIDMessage("ERROR", 110248, unexpectedFCs)

        #### Must Provide Output Prediction Features ####
        if inputPrediction.value and not outputPrediction.value:
                outputPrediction.setIDMessage("ERROR", 110241)

        validatePred = inputPrediction.value and dependentVar.value and modelType.value
        validatePred = validatePred and outputPrediction.value
        if validatePred and (explanatoryMatch.value or distanceMatch.value):
            if not explanatoryMatch.hasError() and not distanceMatch.hasError():
                fieldNames = []
                if explanatoryMatch.value:
                    for vtRow in explanatoryMatch.value:
                        varName = vtRow[0].value
                        if str(varName) not in ["#", ""]:
                            fieldNames.append(varName)
                distanceMatchParameterInfo = None
                if distanceMatch.value:
                    distanceMatchParameterInfo = (distanceMatch, True)
                outputFieldNames, outputFieldTypes, outputFieldAliases = self.getOutputPredFieldInfo(modelType, dependentVar)

                uissdo = UI_SSDataObject(inputPrediction, outputPrediction, fieldNames = fieldNames,
                                         distanceParameterInfo = distanceMatchParameterInfo,
                                         outputFieldNames = outputFieldNames,
                                         outputFieldTypes = outputFieldTypes,
                                         outputFieldAliases = outputFieldAliases)

        return

    def execute(self, parameters, messages):
        import GLR
        GLR.execute(parameters, messages)

class OrdinaryLeastSquares(object):
    def __init__(self):
        self.label = "Ordinary Least Squares"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060003
        self.outputFieldNames = ["Estimated", "Residual", "StdResid"]
        self.outputFieldTypes = ["DOUBLE", "DOUBLE", "DOUBLE"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Unique ID Field",
                            name = "Unique_ID_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','BigInteger']

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param3 = ARCPY.Parameter(displayName="Dependent Variable",
                            name = "Dependent_Variable",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param3.filter.list = ['Short','Long','Float','Double','BigInteger']

        param3.parameterDependencies = ["Input_Feature_Class"]

        param4 = ARCPY.Parameter(displayName="Explanatory Variables",
                            name = "Explanatory_Variables",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param4.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param4.filter.list = ['Short','Long','Float','Double','BigInteger']

        param4.parameterDependencies = ["Input_Feature_Class"]

        param5 = ARCPY.Parameter(displayName="Coefficient Output Table",
                            name = "Coefficient_Output_Table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")
        param5.category = "Additional Options"
        param6 = ARCPY.Parameter(displayName="Diagnostic Output Table",
                            name = "Diagnostic_Output_Table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")
        param6.category = "Additional Options"
        param7 = ARCPY.Parameter(displayName="Output Report File",
                            name = "Output_Report_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Output")
        param7.filter.list = ['pdf']

        return [param0,param1,param2,param3,param4,param5,param6,param7]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        masterField = parameters[1]
        outputFeatures = parameters[2]
        dependentField = parameters[3]
        explanatoryFields = parameters[4]
        requiredParamsFilled = inputFeatures.value and masterField.value and outputFeatures.value
        requiredParamsFilled = requiredParamsFilled and dependentField.value and explanatoryFields.value

        if requiredParamsFilled:
            fieldNames = [dependentField.valueAsText.upper()] 
            fieldNames += [i.upper() for i in explanatoryFields.valueAsText.split(";")]
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = fieldNames,
                                     outputFieldNames = self.outputFieldNames,
                                     outputFieldTypes = self.outputFieldTypes)
            uissdo.addSymbology(pointLayer = "StdResidPoints.lyr",
                                lineLayer = "StdResidPolylines.lyr",
                                polygonLayer = "StdResidPolygons.lyr")

    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        masterField = parameters[1]
        outputFeatures = parameters[2]
        dependentField = parameters[3]
        explanatoryFields = parameters[4]
        pdf = parameters[7]
        requiredParamsFilled = inputFeatures.value and masterField.value and outputFeatures.value
        requiredParamsFilled = requiredParamsFilled and dependentField.value and explanatoryFields.value

        if requiredParamsFilled:
            fieldNames = [dependentField.valueAsText.upper()] 
            fieldNames += [i.upper() for i in explanatoryFields.valueAsText.split(";")]
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = fieldNames,
                                     outputFieldNames = self.outputFieldNames,
                                     outputFieldTypes = self.outputFieldTypes)

        if pdf.altered:
            if pdf.value:
                #### Check Path to Output Exists ####
                outPath, outName = OS.path.split(pdf.value.value)
                if not OS.path.exists(outPath):
                    pdf.setIDMessage("ERROR", 436, outPath)

    def execute(self, parameters, messages):
        import OLS 
        OLS.execute(parameters, messages)

class ConvertSpatialWeightsMatrixtoTable(object):
    def __init__(self):
        self.label = "Convert Spatial Weights Matrix to Table"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        self.helpContext = 9050009
        self.params = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Spatial Weights Matrix File",
                            name = "Input_Spatial_Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['swm', 'gwt']

        param1 = ARCPY.Parameter(displayName="Output Table",
                            name = "Output_Table",
                            datatype = "DETable",
                            parameterType = "Required",
                            direction = "Output")

        return [param0,param1]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        #### Add Output Field Schema ####
        addFields = []
        swmFile = self.params[0].value
        if swmFile:
            #### Unicode / Scratch Folder Safe Path ####
            swmFile = swmFile.value
            if swmFile.upper().count('%SCRATCHFOLDER%'):
                swmFile =  ARCPY.env.scratchFolder + swmFile[15:]

        if not self.params[0].hasBeenValidated:
            try:
                swm = WU.SWMReader(swmFile)
                masterField = swm.masterField
                swm.close()
                newField = ARCPY.Field()
                newField.name = masterField
                newField.type = "LONG"
                addFields.append(newField)
            except:
                #### Cannot Read SWM Header, Perhaps in Model ####
                pass

            fieldNames = ["NID", "WEIGHT"]
            for ind, field in enumerate(fieldNames):
                newField = ARCPY.Field()
                newField.name = field
                if ind == 0:
                    newField.type = "LONG"
                else:
                    newField.type = "DOUBLE"
                addFields.append(newField)
            self.params[1].schema.additionalFields = addFields

    def updateMessages(self, parameters):
        self.params = parameters
        #### Invalid SWM File ####
        fields = self.params[1].schema.additionalFields
        if not len(fields):
            swmFile = str(self.params[0].value)
            self.params[0].clearMessage()
            self.params[0].setIDMessage("ERROR", 977, swmFile)

    def execute(self, parameters, messages):
        import SWM2Table as SWMT
        SWMT.execute(parameters, messages)

class MedianCenter(object):
    def __init__(self):
        self.label = "Median Center"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Measuring Geographic Distributions"
        self.helpContext = 9040006
        self.params = None

    def getParameterInfo(self):
        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Weight Field",
                            name = "Weight_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param2.parameterDependencies = ["Input_Feature_Class"]

        param3 = ARCPY.Parameter(displayName="Case Field",
                            name = "Case_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.list = ['Short', 'Long', 'Text', 'Date', 'BigInteger']
        param3.parameterDependencies = ["Input_Feature_Class"]

        param4 = ARCPY.Parameter(displayName="Attribute Field",
                            name = "Attribute_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)
        param4.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param4.parameterDependencies = ["Input_Feature_Class"]

        return [param0,param1,param2,param3,param4]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        self.fieldObjects = {}
        if self.params[0].altered:
            #if not self.params[0].isInputValueDerived():
            try:
                desc = ARCPY.Describe(self.params[0].value)
                for field in desc.fields:
                    self.fieldObjects[field.name] = field
            except:
                pass
        
        #### Add Fields ####
        addFields = []

        #### Weight Field ####
        if self.params[2].value:
            fieldName = self.params[2].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        #### Case Field ####
        if self.params[3].value:
            fieldName = self.params[3].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        #### Att Fields ####
        if self.params[4].value:
            for fieldName in self.params[4].value.exportToString().split(";"):
                if fieldName in self.fieldObjects:
                    addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["XCoord", "YCoord"]

        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "DOUBLE"
            addFields.append(newField)  
        self.params[1].schema.additionalFields = addFields      
        self.params[1].schema.featureTypeRule = "AsSpecified"
        self.params[1].schema.featureType = "Simple"
        self.params[1].schema.geometryTypeRule = "AsSpecified"
        self.params[1].schema.geometryType = "Point"

    def updateMessages(self, parameters):
        return

    def execute(self, parameters, messages):
        import MedianCenter as MEC
        MEC.execute(parameters, messages)

class GroupingAnalysis(object):
    def __init__(self):
        self.label = "Grouping Analysis"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030004
        self.maxNumGroups = 15
        self.maxNumVars = 15
        self.allSpaceTypes = ["CONTIGUITY_EDGES_ONLY",
                              "CONTIGUITY_EDGES_CORNERS",
                              "DELAUNAY_TRIANGULATION",
                              "K_NEAREST_NEIGHBORS",
                              "GET_SPATIAL_WEIGHTS_FROM_FILE",
                              "NO_SPATIAL_CONSTRAINT"]
        self.subSpaceTypes = ["DELAUNAY_TRIANGULATION", 
                              "K_NEAREST_NEIGHBORS", 
                              "GET_SPATIAL_WEIGHTS_FROM_FILE",
                              "NO_SPATIAL_CONSTRAINT"]
        self.distSetTypes = ["K_NEAREST_NEIGHBORS", 
                             "CONTIGUITY_EDGES_ONLY",
                            "CONTIGUITY_EDGES_CORNERS"]
        self.allowGroupSet = True

        #### Set Rendering Scheme Dict ####
        self.renderType = {'POINT': 0, 'MULTIPOINT': 0,
                           'POLYLINE': 1, 'LINE': 1,
                           'POLYGON': 2}
        self.params = None
    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "Input_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Unique ID Field",
                            name = "Unique_ID_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long']
        param1.parameterDependencies = ["Input_Features"]

        param2 = ARCPY.Parameter(displayName="Output Feature Class",
                            name = "Output_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output",
                            )

        param3 = ARCPY.Parameter(displayName="Number of Groups",
                            name = "Number_of_Groups",
                            datatype = "GPLong",
                            parameterType = "Required",
                            direction = "Input")

        param3.value = 2

        param4 = ARCPY.Parameter(displayName="Analysis Fields",
                            name = "Analysis_Fields",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param4.filter.list = ['Short','Long','Float','Double','Date']
        param4.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param4.parameterDependencies = ["Input_Features"]

        param5 = ARCPY.Parameter(displayName="Spatial Constraints",
                            name = "Spatial_Constraints",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ['CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION','K_NEAREST_NEIGHBORS',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE','NO_SPATIAL_CONSTRAINT']

        param6 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ['EUCLIDEAN','MANHATTAN']
        param6.value = 'EUCLIDEAN'

        param7 = ARCPY.Parameter(displayName="Number of Neighbors",
                            name = "Number_of_Neighbors",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param7.value = 8

        param8 = ARCPY.Parameter(displayName="Weights Matrix File",
                            name = "Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param8.filter.list = ['swm', 'gwt']

        param9 = ARCPY.Parameter(displayName="Initialization Method",
                            name = "Initialization_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param9.filter.type = "ValueList"
        param9.filter.list = ['FIND_SEED_LOCATIONS','GET_SEEDS_FROM_FIELD',
                              'USE_RANDOM_SEEDS']
        param9.value = 'FIND_SEED_LOCATIONS'

        param10 = ARCPY.Parameter(displayName="Initialization Field",
                            name = "Initialization_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param10.filter.list = ['Short', 'Long']
        param10.parameterDependencies = ["Input_Features"]
        param10.enabled = False

        param11 = ARCPY.Parameter(displayName="Output Report File",
                            name = "Output_Report_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Output")
        param11.filter.list = ['pdf']

        param12 = ARCPY.Parameter(displayName="Evaluate Optimal Number of Groups",
                            name = "Evaluate_Optimal_Number_of_Groups",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param12.filter.list = ['EVALUATE','DO_NOT_EVALUATE']
        param12.value = False

        param13 = ARCPY.Parameter(displayName="Output_FStat",
                            name = "Output_FStat",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param14 = ARCPY.Parameter(displayName="Max_FStat_Group",
                            name = "Max_FStat_Group",
                            datatype = "GPLong",
                            parameterType = "Derived",
                            direction = "Output")

        param15 = ARCPY.Parameter(displayName="Max_FStat",
                            name = "Max_FStat",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        return [param0,param1,param2,param3,param4,param5,param6,param7,
                param8,param9,param10,param11,param12,param13,param14,param15]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        #### Validate Polygon Types and Fields ####
        self.params = parameters
        self.fieldObjects = {}
        if self.params[0].altered:
            if not self.params[0].isInputValueDerived():
                try:
                    desc = ARCPY.Describe(self.params[0].value)
                    shapeType = desc.shapeType.upper()
                    if shapeType == "POLYGON":
                        self.params[5].filter.list = self.allSpaceTypes
                    else:
                        self.params[5].filter.list = self.subSpaceTypes
                    self.setOutputSymbology(shapeType)
                    for field in desc.fields:
                        self.fieldObjects[field.name] = field
                except:
                    self.params[5].filter.list = self.allSpaceTypes

            else:
                try:
                    desc = ARCPY.Describe(self.params[0].value)
                    for field in desc.fields:
                        self.fieldObjects[field.name] = field                
                except:
                    self.params[5].filter.list = self.allSpaceTypes
                    pass
        #### Default Number of Groups ####
        if not self.params[3].value:
            self.params[3].value = 2

        #### Validate Space Concepts ####
        spaceConcept = self.params[5].value
        if spaceConcept:
            spaceConcept = spaceConcept.upper()

        if spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            self.params[8].enabled = True
        else:
            self.params[8].enabled = False

        if spaceConcept in self.distSetTypes:
            self.params[6].enabled = True
            self.params[7].enabled = True
            numNeighs = self.params[7].value
            if not numNeighs:
                if spaceConcept == "K_NEAREST_NEIGHBORS":
                    self.params[7].value = 8
                else:
                    self.params[7].value = 0
        else:
            self.params[6].enabled = False
            self.params[7].enabled = False
            self.params[7].value = None

        initApproach = self.params[9].value
        if spaceConcept == "NO_SPATIAL_CONSTRAINT":
            self.params[9].enabled = True
            if initApproach == "GET_SEEDS_FROM_FIELD":
                self.params[10].enabled = True
            else:
                self.params[10].enabled = False
        else:
            self.params[9].enabled = False
            self.params[10].enabled = False

        if self.params[0].altered or self.params[2].altered:
            try:
                desc = ARCPY.Describe(self.params[0].value)
                if self.params[2].value:
                    output = self.params[2].value.value
                else:
                    output = None
                outSpatRef = returnOutputSpatialRef(desc.SpatialReference,
                                                    output)
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    self.params[6].enabled = False
                else:
                    self.params[6].enabled = True
            except:
                pass

        #### Assess Whether to Allow PDF Report ####
        #### Set to *15 Variables/Groups ####
        numFactors = []
        numGroups = self.params[3].value
        allowReport = True
        if numGroups:
            if numGroups > self.maxNumGroups:
                allowReport = False

        varNames = self.params[4].value
        if varNames:
            numVars = str(varNames).count(";") + 1
            if numVars > self.maxNumVars:
                allowReport = False
        if allowReport:
            self.params[11].enabled = True
        else:
            self.params[11].enabled = False

        #### Add Fields ####
        addFields = []

        #### Unique ID Field ####
        if self.params[1].value:
            fieldName = None        
            try:
                fieldName = self.params[1].value.value
            except:
                fieldName = self.params[1].value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        #### Analysis Field(s) ####
        if self.params[4].value:
            for fieldName in self.params[4].value.exportToString().split(";"):
                if fieldName in self.fieldObjects:
                    addFields.append(self.fieldObjects[fieldName])

        #### Seed Field ####
        if self.params[10].value:
            fieldName = None        
            try:
                fieldName = self.params[10].value.value
            except:
                fieldName = self.params[10].value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["SS_GROUP"]
          
        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "FLOAT"
            addFields.append(newField)  
        self.params[2].schema.additionalFields = addFields

        #### Set Derived Output to Empty ####
        self.params[13].value = None
        self.params[14].value = None
        self.params[15].value = None
        return

    def updateMessages(self, parameters):
        self.params = parameters
        numGroups = self.params[3].value
        if numGroups < 2:
            self.params[3].setIDMessage("ERROR", 1221, 2)

        spaceConcept = self.params[5].value
        if spaceConcept:
            spaceConcept = spaceConcept.upper()

        if spaceConcept in self.distSetTypes:
            numNeighs = self.params[7].value
            if spaceConcept == "K_NEAREST_NEIGHBORS":
                warnNumber = 2
            else:
                warnNumber = 0
            if numNeighs < warnNumber:
                self.params[7].setIDMessage("ERROR", 1219, warnNumber)

        #### Must Provide Seed Definition Field ####
        initApproach = self.params[9].value
        if spaceConcept == "NO_SPATIAL_CONSTRAINT":
            if initApproach == "GET_SEEDS_FROM_FIELD":
                if not self.params[10].value:
                    self.params[10].setIDMessage("ERROR", 1327)

        if self.params[11].altered:
            if self.params[11].value:
                #### Check Path to Output Exists ####
                outPath, outName = OS.path.split(self.params[11].value.value)
                if not OS.path.exists(outPath):
                    self.params[11].setIDMessage("ERROR", 436, outPath)
        return

    def setOutputSymbology(self, shapeType):
        renderOut = self.renderType[shapeType]
        if renderOut == 0:
            renderLayerFile = "GroupPoints.lyr"
        elif renderOut == 1:
            renderLayerFile = "GroupPolylines.lyr"
        else:
            renderLayerFile = "GroupPolygons.lyr"

        fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
        self.params[2].symbology = fullRLF

    def execute(self, parameters, messages):
        """Retrieves the parameters from the User Interface and executes the
        appropriate commands."""
        import Partition as PAR

        inputFC = UTILS.getTextParameter(0, parameters)
        masterField = UTILS.getTextParameter(1, parameters).upper()
        outputFC = UTILS.getTextParameter(2, parameters)

        #### User Defined Number of Groups ####
        kPartitions = UTILS.getNumericParameter(3, parameters)

        analysisFields = UTILS.getTextParameter(4, parameters).upper()
        analysisFields = analysisFields.split(";")

        #### Conceptualization ####
        spaceConcept = UTILS.getTextParameter(5, parameters).upper()

        #### EUCLIDEAN or MANHATTAN ####
        distanceConcept = UTILS.getTextParameter(6, parameters).upper().replace(" ", "_")
        if distanceConcept == "#" or distanceConcept == "": 
            distanceConcept = "EUCLIDEAN"

        #### Number of Neighbors ####
        numNeighs = UTILS.getNumericParameter(7, parameters)

        #### Quick Validation of k-nearest ####
        if spaceConcept == "K_NEAREST_NEIGHBORS":
            if numNeighs <= 0:
                ARCPY.AddIDMessage("ERROR", 976)
                raise SystemExit()

        #### Spatial Weights Matrix File ####
        weightsFile = UTILS.getTextParameter(8, parameters)
        useWeightsFile = spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE"
        if not weightsFile and useWeightsFile:
            ARCPY.AddIDMessage("ERROR", 930)
            raise SystemExit()
        if weightsFile and not useWeightsFile:
            ARCPY.AddIDMessage("WARNING", 925)
            weightsFile = None

        #### Initialization Approach ####
        initMethod = UTILS.getTextParameter(9, parameters)
        if initMethod == "#" or initMethod == "": 
            initMethod = "FIND_SEED_LOCATIONS"

        #### Initial Seed/Solution Field ####
        fieldList = [ i for i in analysisFields ]
        initField = UTILS.getTextParameter(10, parameters, fieldName = True) 
        if initField is not None:
            fieldList.append(initField)

        if spaceConcept == "NO_SPATIAL_CONSTRAINT":
            if initMethod == "GET_SEEDS_FROM_FIELD" and initField is None:
                ARCPY.AddIDMessage("ERROR", 1327)
                raise SystemExit()

        #### Report File ####
        reportFile = UTILS.getTextParameter(11, parameters)
        if reportFile == "#" or reportFile == "": 
            reportFile = None
        else:
            #### Validate Number of Vars/Groups for Report (Max 15) ####
            if kPartitions > self.maxNumGroups or len(analysisFields) > self.maxNumVars:
                reportFile = None
                ARCPY.AddIDMessage("WARNING", 1328)

        #### Permutations ####
        optimalBool = parameters[12].value

        #### Warn About Chordal Bool ####
        if spaceConcept in ["NO_SPATIAL_CONSTRAINT",
                            "GET_SPATIAL_WEIGHTS_FROM_FILE"]:
            useChordal = False
        else:
            useChordal = True

        #### Create SSDataObject ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC, 
                                 useChordal = useChordal)

        #### Populate SSDO with Data ####
        if spaceConcept not in ["NO_SPATIAL_CONSTRAINT", "GET_SPATIAL_WEIGHTS_FROM_FILE"]:
            ssdo.obtainData(masterField, fieldList, minNumObs = 3, 
                            requireSearch = True, warnNumObs = 30)
        else:
            ssdo.obtainData(masterField, fieldList, minNumObs = 3, 
                            warnNumObs = 30)

        #### Execute ####
        part = PAR.Partition(ssdo, analysisFields, spaceConcept = spaceConcept,
                         distConcept = distanceConcept, numNeighs = numNeighs,
                         weightsFile = weightsFile, initMethod = initMethod,
                         kPartitions = kPartitions, initField = initField,
                         optimizeGroups = optimalBool)

        #### Report ####
        pdfOutput = part.report(fileName = reportFile, optimal = optimalBool)

        #### Create OutputFC ####
        part.createOutput(outputFC, parameters)

        fStat = ""
        if ~SSDO.NUM.isnan(part.fStat):
            out = fStat

        #### Optimal Number of Partitions ####
        if optimalBool:
            #### Get FStat Info ####
            maxInd, maxGroup, maxFStat = part.fStatInfo

            #### Plot Results ####
            if reportFile:
                if part.aspatial:
                    PAR.plotFStats(pdfOutput, part.groupList, part.fStatRes,
                               maxInd = maxInd)
                else:
                    PAR.plotFStatsSpatial(pdfOutput, part.groupList, part.fStatRes,
                                      maxInd = maxInd)

            #### Set Derived Output ####
            UTILS.setParameterAsText(13, fStat, parameters)
            UTILS.setParameterAsText(14, maxGroup, parameters)
            UTILS.setParameterAsText(15, maxFStat, parameters)

        else:
            #### Set All Derived F-Stats to Main Partition Values ####
            UTILS.setParameterAsText(13, fStat, parameters)
            UTILS.setParameterAsText(14, "", parameters)
            UTILS.setParameterAsText(15, "", parameters)
        return


class ExploratoryRegression(object):
    def __init__(self):
        self.label = "Exploratory Regression"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060005
        self.params = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "Input_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Dependent Variable",
                            name = "Dependent_Variable",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double','BigInteger']

        param1.parameterDependencies = ["Input_Features"]

        param2 = ARCPY.Parameter(displayName="Candidate Explanatory Variables",
                            name = "Candidate_Explanatory_Variables",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param2.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param2.filter.list = ['Short','Long','Float','Double','BigInteger']

        param2.parameterDependencies = ["Input_Features"]

        param3 = ARCPY.Parameter(displayName="Weights Matrix File",
                            name = "Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.list = ['swm', 'gwt']

        param4 = ARCPY.Parameter(displayName="Output Report File",
                            name = "Output_Report_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Output")
        param4.filter.list = ['txt']

        param5 = ARCPY.Parameter(displayName="Output Results Table",
                            name = "Output_Results_Table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")

        param6 = ARCPY.Parameter(displayName="Maximum Number of Explanatory Variables",
                            name = "Maximum_Number_of_Explanatory_Variables",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param6.category = "Search Criteria"
        #param6.filter.type = "Range"
        #param6.filter.list = [1,20]
        param6.value = 5

        param7 = ARCPY.Parameter(displayName="Minimum Number of Explanatory Variables",
                            name = "Minimum_Number_of_Explanatory_Variables",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param7.category = "Search Criteria"
        #param7.filter.type = "Range"
        #param7.filter.list = [1,20]
        param7.value = 1

        param8 = ARCPY.Parameter(displayName="Minimum Acceptable Adj R Squared",
                            name = "Minimum_Acceptable_Adj_R_Squared",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param8.category = "Search Criteria"
        param8.filter.type = "Range"
        param8.filter.list = [0.0, 1.0]
        param8.value = 0.5

        param9 = ARCPY.Parameter(displayName="Maximum Coefficient p value Cutoff",
                            name = "Maximum_Coefficient_p_value_Cutoff",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param9.category = "Search Criteria"
        param9.filter.type = "Range"
        param9.filter.list = [0.0, 1.0]
        param9.value = 0.05

        param10 = ARCPY.Parameter(displayName="Maximum VIF Value Cutoff",
                            name = "Maximum_VIF_Value_Cutoff",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param10.category = "Search Criteria"
        param10.filter.type = "Range"
        param10.filter.list = [0.0, 99999999]
        param10.value = 7.5

        param11 = ARCPY.Parameter(displayName="Minimum Acceptable Jarque Bera p value",
                            name = "Minimum_Acceptable_Jarque_Bera_p_value",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param11.category = "Search Criteria"
        param11.filter.type = "Range"
        param11.filter.list = [0.0, 1.0]
        param11.value = 0.1

        param12 = ARCPY.Parameter(displayName="Minimum Acceptable Spatial Autocorrelation p value",
                            name = "Minimum_Acceptable_Spatial_Autocorrelation_p_value",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param12.category = "Search Criteria"
        param12.filter.type = "Range"
        param12.filter.list = [0.0, 1.0]
        param12.value = 0.1

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9,param10,param11,param12]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        #### Set Default Values ####
        if not self.params[6].value:
            self.params[6].value = 5
        if not self.params[7].value:
            self.params[7].value = 1
        if self.params[8].value == None:
            self.params[8].value = .5
        if self.params[9].value == None:
            self.params[9].value = .05
        if self.params[10].value == None:
            self.params[10].value = 7.5
        if self.params[11].value == None:
            self.params[11].value = .1
        if self.params[12].value == None:
            self.params[12].value = .1

    def updateMessages(self, parameters):
        self.params = parameters
        #### Assure Min Less Than Max ####
        value6 = int(self.params[6].value)
        value7 = int(self.params[7].value)
        if value7 > value6:
            self.params[7].setIDMessage("ERROR", 1220)

        if self.params[4].altered:
            if self.params[4].value:
                #### Check Path to Output Exists ####
                outPath, outName = OS.path.split(self.params[4].value.value)
                if not OS.path.exists(outPath):
                    self.params[4].setIDMessage("ERROR", 436, outPath)

        if self.params[6].altered:
            if self.params[6].value:
                n =int(self.params[6].value)
                if not 1 <= n <= 20:
                    self.params[6].setIDMessage("ERROR", 854, 1, 20)

        if self.params[7].altered:
            if self.params[7].value:
                n =int(self.params[7].value)
                if not 1 <= n <= 20:
                    self.params[7].setIDMessage("ERROR", 854, 1, 20)

    def execute(self, parameters, messages):
        import ExploratoryRegression as ER
        ER.execute(parameters, messages)

class IncrementalSpatialAutocorrelation(object):
    def __init__(self):
        self.label = "Incremental Spatial Autocorrelation"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Analyzing Patterns"
        self.helpContext = 9010005
        self.params = None
        #### Set Default Values ####
        self.defaultIndexList = [2, 5]
        self.defaultValueList = [10, 'EUCLIDEAN']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "Input_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Input Field",
                            name = "Input_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double','BigInteger']

        param1.parameterDependencies = ["Input_Features"]

        param2 = ARCPY.Parameter(displayName="Number of Distance Bands",
                            name = "Number_of_Distance_Bands",
                            datatype = "GPLong",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "Range"
        param2.filter.list = [2,30]
        param2.value = 10

        param3 = ARCPY.Parameter(displayName="Beginning Distance",
                            name = "Beginning_Distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.type = "Range"
        param3.filter.list = [0,999999999]
        param4 = ARCPY.Parameter(displayName="Distance Increment",
                            name = "Distance_Increment",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.type = "Range"
        param4.filter.list = [0.000000001,999999999]

        param5 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param5.filter.type = "ValueList"

        param5.filter.list = ['EUCLIDEAN','MANHATTAN']

        param5.value = 'EUCLIDEAN'

        param6 = ARCPY.Parameter(displayName="Row Standardization",
                            name = "Row_Standardization",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.list = ['ROW_STANDARDIZATION', 'NO_STANDARDIZATION']

        param6.value = True

        param7 = ARCPY.Parameter(displayName="Output Table",
                            name = "Output_Table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")

        param8 = ARCPY.Parameter(displayName="Output Report File",
                            name = "Output_Report_File",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Output")
        param8.filter.list = ['pdf']
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="First Peak",
                            name = "First_Peak",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        param10 = ARCPY.Parameter(displayName="Max Peak",
                            name = "Max_Peak",
                            datatype = "GPDouble",
                            parameterType = "Derived",
                            direction = "Output")

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9,param10]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)
        
        if self.params[0].altered:
            try:
                desc = ARCPY.Describe(self.params[0].value)
                outSpatRef = setEnvSpatialReference(desc.SpatialReference)
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    self.params[5].enabled = False
                else:
                    self.params[5].enabled = True
            except:
                pass

        #### Set Default Peak Distances to Empty ####
        self.params[9].value = None 
        self.params[10].value = None 

        return

    def updateMessages(self, parameters):
        return

    def execute(self, parameters, messages):
        import MoransI_Increment as MI
        MI.execute(parameters, messages)

class OptimizedHotSpotAnalysis(object):
    def __init__(self):
        self.label = "Optimized Hot Spot Analysis"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030005
        self.renderType = {'POINT': 0, 'MULTIPOINT': 0,
                           'POLYLINE': 1, 'LINE': 1,
                           'POLYGON': 2}
        self.aggTypes = {"SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS" : 0,
                         "COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS": 1,
                         "COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS": 2,
                         "COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS": 3}
        self.fieldObjects = {}
        self.oidName = None
        self.shapeType = None
        self.params = None

        #### Set Parameter Defaults ####
        self.defaultIndexList = [3]
        self.defaultValueList = ['COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "Input_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Point','Multipoint','Polygon']

        param1 = ARCPY.Parameter(displayName="Output Features",
                            name = "Output_Features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Analysis Field",
                            name = "Analysis_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param2.parameterDependencies = ["Input_Features"]

        param3 = ARCPY.Parameter(displayName="Incident Data Aggregation Method",
                            name = "Incident_Data_Aggregation_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param3.filter.type = "ValueList"

        param3.filter.list = ['COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS','COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS','COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS','SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS']

        param3.value = 'COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS'

        param3.enabled = False

        param4 = ARCPY.Parameter(displayName="Bounding Polygons Defining Where Incidents Are Possible",
                            name = "Bounding_Polygons_Defining_Where_Incidents_Are_Possible",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['Polygon']
        param4.enabled = False

        param5 = ARCPY.Parameter(displayName="Polygons For Aggregating Incidents Into Counts",
                            name = "Polygons_For_Aggregating_Incidents_Into_Counts",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param5.filter.list = ['Polygon']
        param5.enabled = False

        param6 = ARCPY.Parameter(displayName="Density Surface",
                            name = "Density_Surface",
                            datatype = "DERasterDataset",
                            parameterType = "Optional",
                            direction = "Output")

        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Cell Size",
                            name = "Cell_Size",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = supportDist
        param7.category = "Override Settings"

        param8 = ARCPY.Parameter(displayName="Distance Band",
                            name = "Distance_Band",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param8.filter.list = supportDist
        param8.category = "Override Settings"

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parmater
        has been changed."""

        self.params = parameters
        
        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        self.fieldObjects = {}
        if self.params[0].altered:
            if self.params[0].value:
                self.setParameterInfo(self.params[0].value)
        
        self.params[6].enabled = 0
       
        if self.shapeType in [None, "POLYGON"]:
            self.params[3].enabled = 0
            self.params[4].enabled = 0
            self.params[5].enabled = 0
            self.params[7].enabled = 0
        else:
            #### For Points ####
            fieldName = self.params[2].value
            aggMethod = self.params[3].value
            self.params[7].enabled = 1
           
            if fieldName:
                #### If Marked, Allow Density, No Agg Method ####
                self.params[3].enabled = 0
                self.params[4].enabled = 0
                self.params[5].enabled = 0
            else:
                #### If Unmarked, Allow Poly FCs ####
                self.params[3].enabled = 1

                if aggMethod.upper() not in self.aggTypes:
                    aggMethod = None

                if aggMethod:
                    aggType = self.aggTypes[aggMethod.upper()]
                    if aggType == 2:
                        #### Allow Polygons for Counts ####
                        self.params[5].enabled = 1
                    else:
                        self.params[5].enabled = 0

                    if aggType == 1 or aggType == 3:
                        #### Allow Bounding Polygons for Fishnet ####
                        self.params[4].enabled = 1
                        self.params[7].enabled = 1
                    else:
                        self.params[4].enabled = 0
                        self.params[7].enabled = 0
                elif aggMethod is not None:
                    self.params[4].enabled = 0
                    self.params[5].enabled = 0

        #### Add Fields ####
        addFields = []

        #### Result Fields ####
        fieldNames = ["GiZScore", "GiPValue", "Gi_Bin"]
        fieldTypes = ["DOUBLE", "DOUBLE", "LONG"]
                
        #### Analysis Field ####
        if self.params[2].value:
            self.params[7].enabled = 0

            fieldName = None
            try:
                fieldName = self.params[1].value.value
            except:
                fieldName = self.params[1].value

            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])
        else:
            self.params[7].enabled = 1
            aggMethod = self.params[3].value

            if aggMethod.upper() not in self.aggTypes:
                aggMethod = None
                self.params[3].enabled = 1

            if aggMethod:
                aggType = self.aggTypes[aggMethod.upper()]
                if aggType == 1 or aggType == 3:
                    #### Allow Bounding Polygons for Fishnet ####
                    self.params[4].enabled = 1
                    self.params[7].enabled = 1
                else:
                    self.params[4].enabled = 0
                    self.params[7].enabled = 0 

                if aggType:
                    analysisName = "JOIN_COUNT"
                else:
                    analysisName = "ICOUNT"
                fieldNames = [analysisName] + fieldNames
                fieldTypes = ["LONG"] + fieldTypes

        #### Add Master Field ####
        if self.params[0].value:
            masterFieldObj = ARCPY.Field()
            masterFieldObj.name = "SOURCE_ID"
            masterFieldObj.type = "LONG"
            addFields.append(masterFieldObj)

        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            addFields.append(newField)  
        self.params[1].schema.additionalFields = addFields

        #### Valid Raster Name ####
        if self.params[6].altered:
            if self.params[6].value:
                try:
                    rastValue = UTILS.returnRasterName(self.params[6].value.value)
                    self.params[6].value = rastValue
                except:
                    pass
                 
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        self.params = parameters
        if not self.params[2].value:
            if self.params[0].value:
                try:
                    desc = ARCPY.Describe(self.params[0].value)
                    shapeType = desc.ShapeType.upper()
                    if shapeType == "POLYGON":
                        self.params[2].setIDMessage("ERROR", 110151)
                    else:
                        aggMethod = self.params[3].value
                        if not aggMethod:
                            self.params[3].setIDMessage("ERROR", 110152)
                        else:
                            aggType = self.aggTypes[aggMethod.upper()]
                            if aggType == 2:
                                if not self.params[5].value:
                                    self.params[5].setIDMessage("ERROR", 110153)
                except:
                    pass
                    
        if self.params[6].value:
            try:
                outPath, outName = OS.path.split(self.params[6].value.value)
                if not OS.path.exists(outPath):
                    self.params[6].setIDMessage("ERROR", 560)
            except:
                pass

        if self.params[7].value:
            cellSizeUnit = self.params[7].value.value
            try:
                cellSizeParts = cellSizeUnit.split()
                cellSize = UTILS.strToFloat(cellSizeParts[0])

                if cellSize <= 0:
                    self.params[7].setIDMessage("ERROR", 531)
            except:
                pass

        if self.params[8].value:
            bandSizeUnit = self.params[8].value.value
            try:
                bandSizeParts = bandSizeUnit.split()
                bandSize = UTILS.strToFloat(bandSizeParts[0])

                if bandSize <= 0:
                    self.params[8].setIDMessage("ERROR", 531)
            except:
                pass
                
        if self.params[7].value and self.params[8].value:
            cellSizeUnit = self.params[7].value.value
            bandSizeUnit = self.params[8].value.value
            try:
                cellSizeParts = cellSizeUnit.split()
                bandSizeParts = bandSizeUnit.split()
                cellSize = UTILS.strToFloat(cellSizeParts[0])
                bandSize = UTILS.strToFloat(bandSizeParts[0])
                cellSizeUnit = cellSizeParts[1].upper()
                bandSizeUnit = bandSizeParts[1].upper()
                unitCell, factorCell = UTILS.distanceUnitInfo[cellSizeUnit]
                unitBand, factorBand = UTILS.distanceUnitInfo[bandSizeUnit]
                cellSize = factorCell * cellSize
                bandSize = factorBand * bandSize
                if bandSize <= cellSize:
                    self.params[8].setIDMessage("ERROR", 192, self.params[8].name )
            except:
                pass 

        return

    def setParameterInfo(self, inputFC):
        try:
            desc = ARCPY.Describe(inputFC)
            shapeType = desc.ShapeType.upper()
            self.oidName = desc.oidFieldName
            self.setOutputSymbology(shapeType)
            self.shapeType = shapeType
            for field in desc.fields:
                self.fieldObjects[field.name] = field
        except:
            self.oidName = None
            self.shapeType = None

    def setOutputSymbology(self, shapeType):
        renderOut = self.renderType[shapeType]
        varName = self.params[2].value

        #### Output Features ####
        if varName:
            if renderOut == 0:
                renderLayerFile = "LocalGPoints.lyr"
            elif renderOut == 1:
                renderLayerFile = "LocalGPolylines.lyr"
            else:
                renderLayerFile = "LocalGPolygons.lyr"
        else:
            aggMethod = self.params[3].value
            if aggMethod:
                aggType = self.aggTypes[aggMethod.upper()]
                if aggType:
                    renderLayerFile = "LocalGPolygons.lyr"
                else:
                    renderLayerFile = "LocalGPoints.lyr"
            else:
                renderLayerFile = "LocalGPolygons.lyr"
            
        fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
        self.params[1].symbology = fullRLF

        #### Output Density ####
        if self.params[6].value:
            if varName:
                rasterLayerFile = "PointDensityHSGray.lyr"
            else:
                rasterLayerFile = "PointDensityHSGrayPoints.lyr"

            fullRast = OS.path.join(fullLayerPath, renderLayerFile)
            self.params[6].symbology = fullRast

    def execute(self, parameters, messages):
        """Retrieves the parameters from the User Interface and executes the
        appropriate commands."""
        import OptimizedHotSpotAnalysis as OHSA
        import arcpy.management as DM

        #### Input Parameters ####
        inputFC = UTILS.getTextParameter(0, parameters)
        outputFC = UTILS.getTextParameter(1, parameters)
        varName = UTILS.getTextParameter(2, parameters, fieldName = True)

        #### Apply Exec new field type checker ####
        if varName is not None:
            check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=[varName])
        else:
            check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC)

        aggMethod = UTILS.getTextParameter(3, parameters)
        if aggMethod:
            aggType = self.aggTypes[aggMethod.upper()]
        else:
            aggType = 1

        boundaryFC = UTILS.getTextParameter(4, parameters)
        polygonFC = UTILS.getTextParameter(5, parameters)
        outputRaster = UTILS.getTextParameter(6, parameters)

        userCellSize, userCellUnit = UTILS.getLinearUnitParameter(7, parameters)
        userBandSize, userBandUnit = UTILS.getLinearUnitParameter(8, parameters)
        useDefaultDistance = False
        useDefaultBand = False
        
        if userCellUnit is None:
            useDefaultDistance = True
         
        if userBandUnit is None:
            useDefaultBand = True
        
        #### Check Number of Polygons ####
        if polygonFC and aggType == 2:
            ssdoPoly = SSDO.SSDataObject(polygonFC)
            ssdoPoly.obtainData(ssdoPoly.oidName)
            OHSA.checkNumberPolygons(ssdoPoly.numObs)

        makeFeatureLayerNoExtent = UTILS.clearExtent(DM.MakeFeatureLayer)
        selectLocationNoExtent = UTILS.clearExtent(DM.SelectLayerByLocation)
        featureLayer = "InputOHSA_FC"
        featureLayerInit = "InputOHSA_Init_FC"
        makeFeatureLayerNoExtent(inputFC, featureLayerInit)
        selectionType = UTILS.getSelectionType(featureLayerInit)

        #### Handle Current Selection and Study Area Selection ####
        if aggType == 1 or aggType == 3:
            if boundaryFC:
                selectLocationNoExtent(featureLayerInit, "INTERSECT",
                                       boundaryFC, "#",
                                       selectionType)
            polygonFC = None

        elif aggType == 2:
            selectLocationNoExtent(featureLayerInit, "INTERSECT",
                                   polygonFC, "#",
                                   selectionType)
            boundaryFC = None

        else:
            boundaryFC = None
            polygonFC = None

        #### Create SSDO ####
        makeFeatureLayerNoExtent(featureLayerInit, featureLayer)
        UTILS.passiveDelete(featureLayerInit)
        ssdo = SSDO.SSDataObject(featureLayer, templateFC = outputFC,
                                 useChordal = True)

        extentFactor = ssdo.distanceInfo.convertFactor
        processingBandSize = None
        processingCellSize = None
        cellSizeOrigin = None
        bandSizeOrigin = None

        if not useDefaultBand:
            bandSizeStr, bandSizeFactor = UTILS.distanceUnitInfo[userBandUnit]
            processingBandSize = (userBandSize * bandSizeFactor) / extentFactor
            bandSizeOrigin = UTILS.getTextParameter(8, parameters)

        if not useDefaultDistance:
            cellSizeStr, cellSizeFactor = UTILS.distanceUnitInfo[userCellUnit]
            processingCellSize = (userCellSize * cellSizeFactor) / extentFactor
            extendDistance = processingCellSize
            if ssdo.useChordal:
                extendDistance = (userCellSize * cellSizeFactor) / UTILS.GCSDegree2Meters
            cellSizeOrigin = UTILS.getTextParameter(7, parameters)
            #### Check and Make Sure the Cell Size Won't Exceed The Limitation of Input Feature Layer's SRS Extent ####
            xMin, yMin, zMin, xMax, yMax, zMax = UTILS.getXYZProjectionDomain(ssdo.spatialRef)
            centroid = ssdo.extent.polygon.centroid
            cX = centroid.X
            cY = centroid.Y
            if cX - extendDistance < xMin \
                    or cX + extendDistance > xMax \
                    or cY - extendDistance < yMin \
                    or cY + extendDistance > yMax:
                ARCPY.AddIDMessage("ERROR", 110250)
                raise SystemExit()

        hs = OHSA.OptHotSpots(ssdo, outputFC, varName = varName, aggType = aggType,
                            polygonFC = polygonFC, boundaryFC = boundaryFC,
                            outputRaster = outputRaster, cellSize2Use = processingCellSize,
                            bandSize2Use = processingBandSize, parameters = parameters,
                            cellSizeOrigin = cellSizeOrigin, bandSizeOrigin = bandSizeOrigin)
        UTILS.passiveDelete(featureLayer)



class SimilaritySearch(object):
    def __init__(self):
        self.label = "Similarity Search"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030006
        self.renderType = {'POINT': 0, 'MULTIPOINT': 0,
                           'POLYLINE': 1, 'LINE': 1,
                           'POLYGON': 2}
        self.outputRenderInfo = {
                                ('BOTH', 0): 'SimSearchBothPoints.lyr',
                                ('MOST_SIMILAR', 0): 'SimSearchMostPoints.lyr',
                                ('LEAST_SIMILAR', 0): 'SimSearchLeastPoints.lyr',
                                ('BOTH', 1): 'SimSearchBothPolylines.lyr',
                                ('MOST_SIMILAR', 1): 'SimSearchMostPolylines.lyr',
                                ('LEAST_SIMILAR', 1): 'SimSearchLeastPolylines.lyr',
                                ('BOTH', 2): 'SimSearchBothPolygons.lyr',
                                ('MOST_SIMILAR', 2): 'SimSearchMostPolygons.lyr',
                                ('LEAST_SIMILAR', 2): 'SimSearchLeastPolygons.lyr',
                                }

        self.outputFieldInfo = {
                                'ATTRIBUTE_VALUES': 
                                    {'SIMRANK': ('Similarity Rank', 'LONG', 0),
                                     'DSIMRANK': ('Dissimilarity Rank', 'LONG', 0),
                                     'SIMINDEX': ('Sum Squared Value Differences', 'DOUBLE', 0.0),
                                     'DSTCLOSEST': ('Distance to closest', 'DOUBLE', 0.0),
                                     'LABELRANK': ('Render Rank', 'LONG', 0)},
                                'RANKED_ATTRIBUTE_VALUES':
                                    {'SIMRANK': ('Similarity Rank', 'LONG', 0),
                                     'DSIMRANK': ('Dissimilarity Rank', 'LONG', 0),
                                     'SIMINDEX': ('Sum Squared Rank Differences', 'DOUBLE', 0.0),
                                     'DSTCLOSEST': ('Distance to closest', 'DOUBLE', 0.0),
                                     'LABELRANK': ('Render Rank', 'LONG', 0)},
                                'ATTRIBUTE_PROFILES':
                                    {'SIMRANK': ('Similarity Rank', 'LONG', 0),
                                     'DSIMRANK': ('Dissimilarity Rank', 'LONG', 0),
                                     'SIMINDEX': ('Cosine Similarity', 'DOUBLE', 1.0),
                                     'DSTCLOSEST': ('Distance to closest', 'DOUBLE', 0.0),
                                     'LABELRANK': ('Render Rank', 'LONG', 0)}
                                    }

        self.matchFieldInfo = {
                                'BOTH':
                                    ['SIMRANK', 'DSIMRANK', 'SIMINDEX', 'DSTCLOSEST', 'LABELRANK'],
                                'MOST_SIMILAR':
                                    ['SIMRANK', 'SIMINDEX', 'DSTCLOSEST', 'LABELRANK'],
                                'LEAST_SIMILAR':
                                    ['DSIMRANK', 'SIMINDEX', 'DSTCLOSEST', 'LABELRANK']
                                    }
        self.params = None

        #### Set Default Values ####
        #### Add Deleted Parameter Values to Defaults
        self.defaultIndexList = [4, 5, 6]
        self.defaultValueList = ['MOST_SIMILAR', 'ATTRIBUTE_VALUES', 10]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features To Match",
                            name = "Input_Features_To_Match",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Candidate Features",
                            name = "Candidate_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param2 = ARCPY.Parameter(displayName="Output Features",
                            name = "Output_Features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param3 = ARCPY.Parameter(displayName="Collapse Output To Points",
                            name = "Collapse_Output_To_Points",
                            datatype = "GPBoolean",
                            parameterType = "Required",
                            direction = "Input")
        param3.filter.list = ['COLLAPSE','NO_COLLAPSE']
        param3.enabled = False

        param4 = ARCPY.Parameter(displayName="Most Or Least Similar",
                            name = "Most_Or_Least_Similar",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.type = "ValueList"
        param4.filter.list = ['MOST_SIMILAR','LEAST_SIMILAR','BOTH']
        param4.parameterDependencies = ["Input_Features"]
        param4.value = 'MOST_SIMILAR'

        param5 = ARCPY.Parameter(displayName="Match Method",
                            name = "Match_Method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param5.filter.type = "ValueList"
        param5.filter.list = ['ATTRIBUTE_VALUES','RANKED_ATTRIBUTE_VALUES','ATTRIBUTE_PROFILES']
        param5.value = 'ATTRIBUTE_VALUES'

        param6 = ARCPY.Parameter(displayName="Number Of Results",
                            name = "Number_Of_Results",
                            datatype = "GPLong",
                            parameterType = "Required",
                            direction = "Input")

        param6.filter.list = []
        param6.value = 10

        param7 = ARCPY.Parameter(displayName="Attributes Of Interest",
                            name = "Attributes_Of_Interest",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param7.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param7.filter.list = ['Short','Long','Float','Double', 'BigInteger']
        param7.parameterDependencies = ["Input_Features_To_Match"]

        param8 = ARCPY.Parameter(displayName="Fields To Append To Output",
                            name = "Fields_To_Append_To_Output",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)
        param8.filter.list = ['Short', 'Long', 'Float', 'Double', 'Text', 'Date', 'BigInteger']
        param8.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param8.category = "Additional Options"
        param8.parameterDependencies = ["Candidate_Features"]

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        #### All Fields ####
        baseFields = {}

        if self.params[0].altered:
            try:
                d = ARCPY.Describe(self.params[0].value)
                shapeType = d.shapeType.upper()
                for field in d.fields:
                    baseFields[field.name] = field
                self.setOutputSymbology(shapeType)
            except:
                pass

        candFields = {}
        if self.params[1].altered:
            try:
                d = ARCPY.Describe(self.params[1].value)
                for field in d.fields:
                    candFields[field.name] = field
                d = ARCPY.Describe(self.params[0].value)
                shapeType = d.shapeType.upper()
                self.setOutputSymbology(shapeType)
            except:
                pass

        #### Set Collapse Option for Advanced License ####
        change0 = paramChanged(self.params[0])
        change1 = paramChanged(self.params[1])
        change3 = paramChanged(self.params[3])
        if self.params[0].value and self.params[1].value:
            if change0 and change1 and change3:
                self.setCollapse()
            else:
                if change0 or change1:
                    self.params[3].value = False
                    self.setCollapse()
        else:
            self.params[3].value = True
            self.params[3].enabled = False

        ##### Add Fields ####
        addFields = []
        newField = ARCPY.Field()
        newField.name = "MATCH_ID"
        newField.type = "LONG"
        addFields.append(newField)

        newField = ARCPY.Field()
        newField.name = "CAND_ID"
        newField.type = "LONG"
        addFields.append(newField)

        if self.params[7].value: # and ARCPY.Exists(self.params[0].value)
            for fieldName in self.params[7].value.exportToString().split(";"):
                if fieldName in baseFields:
                    addFields.append(baseFields[fieldName])

        if self.params[8].value:
            for fieldName in self.params[8].value.exportToString().split(";"):
                if fieldName in candFields:
                    addFields.append(candFields[fieldName])

        #### Add Result Fields ####
        fieldNames = self.matchFieldInfo[self.params[4].value]
        fieldInfo = self.outputFieldInfo[self.params[5].value]
        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldInfo[fieldName][1]
            addFields.append(newField)

        self.params[2].schema.additionalFields = addFields      

    def updateMessages(self, parameters):
        return

    def setCollapse(self):
        shapeTypeBase = None
        shapeTypeCand = None
        try:
            d = ARCPY.Describe(self.params[0].value)
            shapeTypeBase = self.renderType[d.shapeType.upper()]
        except:
            pass
        try:
            d = ARCPY.Describe(self.params[1].value)
            shapeTypeCand = self.renderType[d.shapeType.upper()]
        except:
            pass

        #### Disable and Collapse ####
        #### Points, Non Match Feature Type, No Advanced License ####
        shapesArePoints = shapeTypeBase == 0 or shapeTypeCand == 0
        shapesAreDiff = shapeTypeBase != shapeTypeCand
        notAdvanced = not checkLicense()
        if notAdvanced or shapesArePoints or shapesAreDiff:
            self.params[3].value = True
            self.params[3].enabled = False

        else:
            self.params[3].enabled = True

    def setOutputSymbology(self, shapeType):
        if self.params[3].value:
            renderType = 0
        else:
            renderType = self.renderType[shapeType]
            try:
                d = ARCPY.Describe(self.params[1].value)
                candType = self.renderType[d.shapeType.upper()]
                if candType != renderType:
                    renderType = 0
            except:
                pass

        try:
            numResults = int(self.params[6].value)
        except:
            numResults = 10
            
        renderKey = (self.params[4].value, renderType)
        renderFile = self.outputRenderInfo[renderKey]
        renderLayerFile = returnRenderLayerFile(numResults, renderFile)
        fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
        
        self.params[2].symbology = fullRLF

    def execute(self, parameters, messages):
        import Similarity as SIM
        inputFC = UTILS.getTextParameter(0, parameters)
        candidateFC = UTILS.getTextParameter(1, parameters)
        outputFC = UTILS.getTextParameter(2, parameters)
        collapseToPoints = parameters[3].value
        similarType = UTILS.getTextParameter(4, parameters)
        matchMethod = UTILS.getTextParameter(5, parameters)
        numResults = UTILS.getNumericParameter(6, parameters)
        tempFieldNames = UTILS.getTextParameter(7, parameters).upper()
        tempFieldNames = tempFieldNames.split(";")
        appendFields = UTILS.getTextParameter(8, parameters)

        if appendFields is not None:
            appendFields = appendFields.upper()
            appendFields = appendFields.split(";")
            appendFields = [ i for i in appendFields if i not in tempFieldNames ]
        else:
            appendFields = []

        #### Apply execute field checker
        # checkFields = tempFieldNames + appendFields
        checkInput = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=tempFieldNames)
        checkCand = UTILS.ExecuteNewFieldTypeChecker(candidateFC, outputFC, fields=appendFields)

        #### Get/Check Output Spatial Ref ####
        explicitSpatialRef = SIM.getOutputSpatialRef(inputFC, candidateFC, 
                                                    outputFC)

        #### Initialize DataObjects ####
        ssdoBase = SSDO.SSDataObject(inputFC, useChordal = False, 
                                        explicitSpatialRef = explicitSpatialRef)
        ssdoCand = SSDO.SSDataObject(candidateFC, useChordal = False,
                                        explicitSpatialRef = explicitSpatialRef)

        #### Field Validation ####
        fieldNames, appendBase, badInputNames = SIM.fieldValidation(ssdoBase, 
                                                                ssdoCand, 
                                                                tempFieldNames, 
                                                                appendFields)

        #### Warn About Excluded Fields #### 
        badNames = len(badInputNames)
        if badNames:
            badInputNames = ", ".join(badInputNames)
            ARCPY.AddIDMessage("WARNING", 1584, badInputNames)

        #### No Valid Fields Found ####
        if not len(fieldNames):
            ARCPY.AddIDMessage("ERROR", 1585)
            raise SystemExit()

        #### Runtime Check for Cosign Sim (In Class as Well for Variance) ####
        if len(fieldNames) == 1 and matchMethod == 'ATTRIBUTE_PROFILES':
            ARCPY.AddIDMessage("ERROR", 1598)
            raise SystemExit()

        allFieldNamesBase = fieldNames + appendBase
        allFieldNamesCand = fieldNames + appendFields

        ssdoBase.obtainData(ssdoBase.oidName, allFieldNamesBase,
                            explicitBadRecordID = 1615,
                            useNullinFields = appendBase)
        if ssdoBase.numObs == 0:
            ARCPY.AddIDMessage("ERROR", 1599)
            raise SystemExit()

        ssdoCand.obtainData(ssdoCand.oidName, allFieldNamesCand, 
                            explicitBadRecordID = 1616,
                            useNullinFields =  appendFields)

        if ssdoCand.numObs <= 2:
            ARCPY.AddIDMessage("ERROR", 1589)
            raise SystemExit()

        ss = SIM.SimilaritySearch(ssdoBase, ssdoCand, fieldNames,
                                similarType = similarType,
                                matchMethod = matchMethod,
                                numResults = numResults,
                                appendFields = allFieldNamesCand)
        ss.report()

        baseIsPoint = UTILS.renderType[ssdoBase.shapeType.upper()] == 0
        baseCandDiff = ssdoBase.shapeType.upper() != ssdoCand.shapeType.upper()
        if collapseToPoints or baseIsPoint or baseCandDiff:
            ss.createOutput(outputFC, parameters)
        else:
            ss.createOutputShapes(outputFC, parameters)

    def postExecute(self, parameters):
        import Similarity as SIM
        SIM.postExecute(parameters)
        return

class GenerateNetworkSpatialWeights(object):
    def __init__(self):
        self.label = "Generate Network Spatial Weights"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060004
        self.params = None

        #### Set Parameter Defaults ####
        self.defaultIndexList = [8, 11, 12, 13]
        self.defaultValueList = ['ALLOW_UTURNS', '5000 Meters', 'INVERSE', 1.0]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Point']

        param1 = ARCPY.Parameter(displayName="Unique ID Field",
                            name = "Unique_ID_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long']

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Output Spatial Weights Matrix File",
                            name = "Output_Spatial_Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Output")

        param2.filter.list = ['swm']

        param3 = ARCPY.Parameter(displayName="Input Network",
                            name = "Input_Network",
                            datatype = "GPNetworkDatasetLayer",
                            parameterType = "Required",
                            direction = "Input")

        param4 = ARCPY.Parameter(displayName="Impedance Attribute",
                            name = "Impedance_Attribute",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")
        param4.category = "Custom Travel Mode Options"
        param4.filter.type = "ValueList"

        param4.filter.list = []

        param5 = ARCPY.Parameter(displayName="Impedance Cutoff",
                            name = "Impedance_Cutoff",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param5.category = "Network Analysis Options"
        param6 = ARCPY.Parameter(displayName="Maximum Number of Neighbors",
                            name = "Maximum_Number_of_Neighbors",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param6.category = "Network Analysis Options"
        param7 = ARCPY.Parameter(displayName="Barriers",
                            name = "Barriers",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = ['Point','Polygon', 'Polyline']
        param7.category = "Network Analysis Options"
        param8 = ARCPY.Parameter(displayName="U-turn Policy",
                            name = "U-turn_Policy",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param8.category = "Custom Travel Mode Options"
        param8.filter.type = "ValueList"

        param8.filter.list = ['ALLOW_UTURNS','NO_UTURNS','ALLOW_DEAD_ENDS_ONLY','ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY']

        param8.value = 'ALLOW_UTURNS'

        param9 = ARCPY.Parameter(displayName="Restrictions",
                            name = "Restrictions",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)

        param9.category = "Custom Travel Mode Options"
        param9.filter.type = "ValueList"

        param9.filter.list = []

        param10 = ARCPY.Parameter(displayName="Use Hierarchy in Analysis",
                            name = "Use_Hierarchy_in_Analysis",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param10.filter.list = ['USE_HIERARCHY', 'NO_HIERARCHY']
        param10.value = False
        param10.category = "Custom Travel Mode Options"

        param11 = ARCPY.Parameter(displayName="Search Tolerance",
                            name = "Search_Tolerance",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param11.category = "Network Analysis Options"
        param11.value = '5000 Meters'
        param11.filter.list = supportDist

        param12 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                            name = "Conceptualization_of_Spatial_Relationships",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param12.category = "Weights Options"
        param12.filter.type = "ValueList"

        param12.filter.list = ['INVERSE','FIXED']

        param12.value = 'INVERSE'

        param13 = ARCPY.Parameter(displayName="Exponent",
                            name = "Exponent",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param13.category = "Weights Options"
        param13.value = 1.0

        param14 = ARCPY.Parameter(displayName="Row Standardization",
                            name = "Row_Standardization",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param14.filter.list = ['ROW_STANDARDIZATION','NO_STANDARDIZATION']
        param14.value = True

        param14.category = "Weights Options"
        param15 = ARCPY.Parameter(displayName="Travel Mode",
                            name = "Travel_Mode",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param15.filter.type = "ValueList"

        param15.filter.list = []

        param16 = ARCPY.Parameter(displayName="Time of Day",
                            name = "Time_of_Day",
                            datatype = "GPDate",
                            parameterType = "Optional",
                            direction = "Input")
        param16.category = "Network Analysis Options"
        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9,param10,param11,param12,param13,param14,param15,param16]

    def isLicensed(self):
        try:
            t = ARCPY.CheckOutExtension("Network")
            if t != 'CheckedOut':
                return False
        except:
            return False

        return True

    def updateParameters(self, parameters):
        self.params = parameters
        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        #### Network Dataset Changed ####
        if self.params[3].altered:
            if self.params[3].value and not self.params[3].hasBeenValidated:
                self.travelModes = returnTravelModes(self.params[3])
                travelList = list(self.travelModes.keys())
                travelList.append("Custom")
                self.params[15].filter.list = travelList
                self.setTravelModeParams(self.params[15].value)
                self.updateNetworkParams(self.params[3].value)

               
        #### Travel Mode Changed ####
        if self.params[15].altered:
            if self.params[15].value and self.params[3].value and not self.params[15].hasBeenValidated:
                self.travelModes = returnTravelModes(self.params[3])
                travelList = list(self.travelModes.keys())
                travelList.append("Custom")
                self.params[15].filter.list = travelList
                self.updateTravelModeParams(self.params[15].value)

        #### Disable Exponent if Fixed Distance ####
        if self.params[12].value == "INVERSE":
            self.params[13].enabled = 1
        else:
            self.params[13].enabled = 0

    def updateMessages(self, parameters):
        self.params = parameters
        #### Make Sure Cutoff is > 0 ####
        if self.params[5].altered and self.params[5].value <= 0:
            self.params[5].setIDMessage("Error", 30057)   

        #### Make Sure Number of Neighs is > 0 ####
        if self.params[6].altered and self.params[6].value <= 0:
            self.params[6].setIDMessage("Error", 30057)

        #### Make Sure Linear Unit in => 0 ####
        if self.params[11].altered:
          if float(str(self.params[11].value).split(" ")[0]) < 0:
            self.params[11].setIDMessage("Error", 30065)

    def updateTravelModeParams(self, travelMode):
        if travelMode.upper() != "CUSTOM":
            self.setTravelModeParams(travelMode)
        else:
            desc = ARCPY.Describe(self.params[3].value)
            self.setCustomParams(desc)

    def updateNetworkParams(self, network):
        """Sets Network Parameters."""

        #### Describe and Assess Travel Mode ####
        desc = ARCPY.Describe(network)
        defaultTravelMode = desc.defaultTravelModeName
        hasTravelMode = self.params[15].value not in ["", None]
        if defaultTravelMode != "" and not hasTravelMode:
            self.setTravelModeParams(defaultTravelMode)
        else:
            if hasTravelMode:
                if self.params[15].value.upper() != "CUSTOM":
                    self.setTravelModeParams(self.params[15].value)
                else:
                    self.setCustomParams(desc)
            else:
                self.params[15].value = "Custom"
                self.setCustomParams(desc)
        return

    def setCustomParams(self, desc):
        self.resetNetworkProps()
        attributes = desc.attributes
        costs = []
        defCost = ""
        restrictions = []
        defRestrictions = []
        costDomain = self.params[4].filter
        restDomain = self.params[9].filter
        hierarchy = 0
        defHierarchy = False
        for attribute in attributes:
            fieldName = attribute.name
            useType = attribute.usageType

            #### Costs ####
            if useType == "Cost":
                costs.append(fieldName.upper())
                #### Check For Defaults ####
                if attribute.useByDefault:
                    defCost = fieldName.upper()

            #### Restrictions ####
            elif useType == "Restriction":
                #### Check For Defaults ####
                if attribute.useByDefault:
                    defRestrictions.append(fieldName.upper())
                restrictions.append(fieldName.upper())

            #### Hierarchy ####
            elif useType == "Hierarchy":
                hierarchy = 1
                #### Check For Defaults ####
                if attribute.useByDefault:
                    defHierarchy = True
            else:
                pass

        if hierarchy == 1:
            self.params[10].enabled = True
        else:
            self.params[10].enabled = False

        costDomain.list = costs
        restDomain.list = restrictions

        if not self.params[4].altered:
            self.params[4].value = defCost
        if not self.params[9].altered:
            self.params[9].value = ";".join(defRestrictions)
        if not self.params[10].altered:
            self.params[10].value = defHierarchy

    def setTravelModeParams(self, travelMode):
        if travelMode not in self.travelModes:
            #self.params[15].value = "Custom"
            self.updateTravelModeParams("Custom")
            #if not self.params[4].value:
            #    self.setCustomParams(ARCPY.Describe(self.params[3].value))
        else:
            travelModeInfo = self.travelModes[travelMode]
            self.params[4].value = travelModeInfo.impedance
            self.params[8].value = travelModeInfo.uTurns
            self.params[9].value = ";".join(travelModeInfo.restrictions)
            self.params[10].value = travelModeInfo.useHierarchy == "USE_HIERARCHY"
            self.params[15].value = travelMode
            self.params[4].enabled = False
            self.params[8].enabled = False
            self.params[9].enabled = False
            self.params[10].enabled = False

    def resetNetworkProps(self, resetValues = False):
        """Resets the network dataset derived parameters to nothing"""
        self.params[4].enabled = True
        self.params[8].enabled = True
        self.params[9].enabled = True
        self.params[4].filter.list = []
        self.params[9].filter.list = []
        if resetValues:
            self.params[4].value = ""
            self.params[8].value = ""
            self.params[9].value = ""
        return

    def execute(self, parameters, messages):
        import Network2SWM as NSWM
        NSWM.execute(parameters, messages)

class GenerateNetworkSWM(object):
    def __init__(self):
        self.label = "Generate Network Spatial Weights Matrix"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 90600112
        self.params = None

        self.defaultIndexList = [10, 12, 13, 14]
        self.defaultValueList = ["LOCAL_TIME_AT_LOCATIONS", '5000 Meters',
                                 'FIXED', 1.0]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Point']

        param1 = ARCPY.Parameter(displayName="Unique ID Field",
                            name = "Unique_ID_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','BigInteger']

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Output Spatial Weights Matrix File",
                            name = "Output_Spatial_Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Output")

        param2.filter.list = ['swm']

        param3 = ARCPY.Parameter(displayName="Input Network Data Source",
                            name = "Input_Network_Data_Source",
                            datatype = "GPNetworkDataSource",
                            parameterType = "Required",
                            direction = "Input")

        param4 = ARCPY.Parameter(displayName="Travel Mode",
                            name = "Travel_Mode",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param4.filter.type = "ValueList"

        param4.filter.list = []

        param5 = ARCPY.Parameter(displayName="Impedance Distance Cutoff",
                            name = "Impedance_Distance_Cutoff",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param5.category = "Network Analysis Options"
        param5.filter.list = supportDist
        param5.enabled = False

        param6 = ARCPY.Parameter(displayName="Impedance Temporal Cutoff",
                                 name="Impedance_Temporal_Cutoff",
                                 datatype="GPTimeUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param6.category = "Network Analysis Options"
        param6.filter.list = supportNetTime
        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Impedance Cost Cutoff",
                            name = "Impedance_Cost_Cutoff",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param7.category = "Network Analysis Options"
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Maximum Number of Neighbors",
                            name = "Maximum_Number_of_Neighbors",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param8.category = "Network Analysis Options"

        param9 = ARCPY.Parameter(displayName="Time of Day",
                                 name = "Time_of_Day",
                                 datatype = "GPDate",
                                 parameterType = "Optional",
                                 direction = "Input")
        param9.category = "Network Analysis Options"

        param10 = ARCPY.Parameter(displayName="Time Zone",
                                 name="Time_Zone",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param10.category = "Network Analysis Options"
        param10.filter.type = "ValueList"
        param10.filter.list = ["LOCAL_TIME_AT_LOCATIONS", "UTC"]
        param10.value = "LOCAL_TIME_AT_LOCATIONS"

        param11 = ARCPY.Parameter(displayName="Barriers",
                            name = "Barriers",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param11.filter.list = ['Point','Polygon', 'Polyline']
        param11.category = "Network Analysis Options"

        param12 = ARCPY.Parameter(displayName="Search Tolerance",
                            name = "Search_Tolerance",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param12.category = "Network Analysis Options"
        param12.filter.list = supportDist
        param12.value = '5000 Meters'

        param13 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                            name = "Conceptualization_of_Spatial_Relationships",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param13.category = "Weights Options"
        param13.filter.type = "ValueList"
        param13.filter.list = ['FIXED', 'INVERSE']
        param13.value = 'FIXED'

        param14 = ARCPY.Parameter(displayName="Exponent",
                            name = "Exponent",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param14.category = "Weights Options"
        param14.filter.type = "Range"
        param14.filter.list = [0.1,4.0]
        param14.value = 1.0
        param14.enabled = False

        param15 = ARCPY.Parameter(displayName="Row Standardization",
                            name = "Row_Standardization",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param15.category = "Weights Options"
        param15.filter.list = ['ROW_STANDARDIZATION','NO_STANDARDIZATION']
        param15.value = True


        return [param0,param1,param2,param3,param4,param5,param6,
                param7,param8,param9,param10,param11,param12,
                param13,param14,param15]

    def isLicensed(self):
        try:
            t = ARCPY.CheckOutExtension("Network")
            if t != 'CheckedOut':
                return False
        except:
            return False

        return True

    def updateParameters(self, parameters):

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        #### Network Dataset Changed ####
        if parameters[3].value:
            travelModes = getTravelModes(parameters[3])
            travelModeList = list(travelModes.keys())
            parameters[4].filter.list = travelModeList

            #### Set Default to First in Hash ####
            if parameters[4].value not in travelModes:
                if len(travelModeList):
                    #### Default Travel Mode is First in Dict ####
                    parameters[4].value = travelModeList[0]
                else:
                    #### Clear Old Travel Mode Parameter ####
                    parameters[4].value = ""
        else:
            #### Clear Old Travel Mode Parameter ####
            parameters[4].value = ""

        #### Set Impedance ####  
        if parameters[4].altered:
            if parameters[4].value and not parameters[4].hasBeenValidated:
                travelModes = getTravelModes(parameters[3])
                travelMode = parameters[4].value

                #### Get Travel Mode Impedance Type ####
                if travelMode in travelModes:
                    travelModeInfo = travelModes[travelMode]

                    if travelModeInfo.impedance == travelModeInfo.distanceAttributeName:
                        #### Distance Based ####
                        parameters[5].enabled = True
                        clearParameter(parameters[6])
                        clearParameter(parameters[7])
                    elif travelModeInfo.impedance == travelModeInfo.timeAttributeName:
                        #### Time Based ####
                        parameters[6].enabled = True
                        clearParameter(parameters[5])
                        clearParameter(parameters[7])
                    else:
                        #### Cost / Custom (Double) Based ####
                        parameters[7].enabled = True
                        clearParameter(parameters[5])
                        clearParameter(parameters[6])

        #### Set Default Search Tolerance if Empty ####
        if parameters[12].value is None:
            parameters[12].value = '5000 Meters'

        #### Disable Exponent if Fixed Distance ####
        if parameters[13].value == "INVERSE":
            parameters[14].enabled = True
        else:
            parameters[14].enabled = False

    def updateMessages(self, parameters):

        #### 64bit OIDs not Allowed ####
        if parameters[0].value:
            if not parameters[0].hasError():
                try:
                    d = ARCPY.Describe(parameters[0].value)
                    if hasattr(d, "HasOID64"):
                        if d.HasOID64:
                            parameters[0].setIDMessage("ERROR", 110520)
                except:
                    pass

        if parameters[3].value:
            if not parameters[3].hasError():
                #### Warn About Credits ####
                try:
                    if "www.arcgis.com" in parameters[3].valueAsText:
                        parameters[3].setIDMessage("WARNING", 2872)
                except:
                    pass

        #### Must Have a Travel Mode ####
        if not parameters[3].hasError():
            travelModes = getTravelModes(parameters[3], returnError = True)
            if travelModes == "ERROR":
                parameters[3].setIDMessage("ERROR", 110318)
                return

            travelModeList = list(travelModes.keys())
            if not len(travelModeList):
                parameters[3].setIDMessage("ERROR", 110317)

        #### Make Sure Distance Cutoff is > 0 ####
        if parameters[5].value:
            value = getLinearUnitFloat(parameters[5].value)
            if value <= 0.0:
                parameters[5].setIDMessage("ERROR", 30057)

        #### Make Sure Temporal Cutoff is > 0 ####
        if parameters[6].value:
            value = getTemporalUnit(parameters[6].value)
            if value <= 0:
                parameters[6].setIDMessage("ERROR", 30057)

        #### Make Sure Cost is > 0 ####
        if parameters[7].value is not None:
            if parameters[7].value <= 0:
                parameters[7].setIDMessage("ERROR", 30057)

        #### Make Sure Maximum Number of Neighs is > 0 ####
        if parameters[8].value is not None:
            if parameters[8].value <= 0:
                parameters[8].setIDMessage("ERROR", 30057)

        #### Make Sure Search Tolerance Linear is => 0 ####
        if parameters[12].value:
            value = getLinearUnitFloat(parameters[12].value)
            if value < 0.0:
                parameters[12].setIDMessage("ERROR", 30065)

    def execute(self, parameters, messages):
        import NetworkSWM as NETSWM
        NETSWM.execute(parameters, messages)

class OptimizedOutlierAnalysis(object):
    def __init__(self):
        self.label = "Optimized Outlier Analysis"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030007
        self.aggTypes = {"SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS" : 0,
                         "COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS": 1,
                         "COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS": 2,
                         "COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS": 3}
        self.params = None
        self.renderType = {'POINT': 0, 'MULTIPOINT': 0,
                           'POLYLINE': 1, 'LINE': 1,
                           'POLYGON': 2}
        self.shapeType = None
        self.oidName = None
        #### Set Parameter Defaults####
        self.defaultIndexList = [3, 6]
        self.defaultValueList = ['COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS', 
                                 'BALANCED_499']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "Input_Features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Point','Multipoint','Polygon']

        param1 = ARCPY.Parameter(displayName="Output Features",
                            name = "Output_Features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Analysis Field",
                            name = "Analysis_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['Short','Long','Float', 'Double', 'BigInteger']
        param2.parameterDependencies = ["Input_Features"]

        param3 = ARCPY.Parameter(displayName="Incident Data Aggregation Method",
                            name = "Incident_Data_Aggregation_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param3.filter.type = "ValueList"

        param3.filter.list = ['COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS','COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS','COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS','SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS']

        param3.value = 'COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS'

        param3.enabled = False

        param4 = ARCPY.Parameter(displayName="Bounding Polygons Defining Where Incidents Are Possible",
                            name = "Bounding_Polygons_Defining_Where_Incidents_Are_Possible",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['Polygon']
        param4.enabled = False

        param5 = ARCPY.Parameter(displayName="Polygons For Aggregating Incidents Into Counts",
                            name = "Polygons_For_Aggregating_Incidents_Into_Counts",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param5.filter.list = ['Polygon']
        param5.enabled = False

        param6 = ARCPY.Parameter(displayName="Performance Adjustment",
                            name = "Performance_Adjustment",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param6.filter.type = "ValueList"

        param6.filter.list = ['QUICK_199','BALANCED_499','ROBUST_999']

        param6.value = 'BALANCED_499'

        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Cell Size",
                            name = "Cell_Size",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = supportDist
        param7.category = "Override Settings"

        param8 = ARCPY.Parameter(displayName="Distance Band",
                            name = "Distance_Band",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param8.filter.list = supportDist
        param8.category = "Override Settings"

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        self.fieldObjects = {}
        if self.params[0].altered:
            if self.params[0].value:
                self.setParameterInfo(self.params[0].value)
        
        self.params[6].enabled = 1
        if self.shapeType in [None, "POLYGON"]:
            self.params[3].enabled = 0
            self.params[4].enabled = 0
            self.params[5].enabled = 0
            self.params[7].enabled = 0
        else:
            #### For Points ####
            fieldName = self.params[2].value
            aggMethod = self.params[3].value
            self.params[7].enabled = 1
            if fieldName:
                #### If Marked, Allow Density, No Agg Method ####
                self.params[3].enabled = 0
                self.params[4].enabled = 0
                self.params[5].enabled = 0
            else:
                #### If Unmarked, Allow Poly FCs ####
                self.params[3].enabled = 1

                if aggMethod.upper().replace(' ', "_") not in self.aggTypes:
                    aggMethod = None

                if aggMethod:
                    self.params[3].value = aggMethod.upper().replace(' ', "_")
                    aggType = self.aggTypes[aggMethod.upper().replace(' ', "_")]
                    if aggType == 2:
                        #### Allow Polygons for Counts ####
                        self.params[5].enabled = 1
                    else:
                        self.params[5].enabled = 0

                    if aggType == 1 or aggType == 3:
                        #### Allow Bounding Polygons for Fishnet ####
                        self.params[4].enabled = 1
                        self.params[7].enabled = 1
                    else:
                        self.params[4].enabled = 0
                        self.params[7].enabled = 0
                elif aggMethod is not None:
                    self.params[4].enabled = 0
                    self.params[5].enabled = 0

        #### Add Fields ####
        addFields = []

        #### Result Fields ####
        fieldNames = ["LMiIndex", "LMiZScore", "LMiPValue", "COType"]

        #### Analysis Field ####
        if self.params[2].value:
            self.params[7].enabled = 0
            fieldName = self.params[1].value.value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])
        else:
            self.params[7].enabled = 1
            aggMethod = self.params[3].value

            if aggMethod.upper() not in self.aggTypes:
                aggMethod = None
                self.params[3].enabled = 1

            if aggMethod:
                aggType = self.aggTypes[aggMethod.upper()]
                if aggType == 1 or aggType == 3:
                    #### Allow Bounding Polygons for Fishnet ####
                    self.params[4].enabled = 1
                    self.params[7].enabled = 1
                else:
                    self.params[4].enabled = 0
                    self.params[7].enabled = 0 
                    
                if aggType:
                    analysisName = "JOIN_COUNT"
                else:
                    analysisName = "ICOUNT"
                fieldNames = [analysisName] + fieldNames

        #### Result Fields ####
        for fieldInd, fieldName in enumerate(fieldNames):
            newField = ARCPY.Field()
            newField.name = fieldName
            if fieldName == "COType":
                newField.type = "TEXT"
                newField.length = 2
            else:
                newField.type = "DOUBLE"
            addFields.append(newField)  
        self.params[1].schema.additionalFields = addFields

        #### Add Master Field ####
        if self.params[0].value:
            masterFieldObj = ARCPY.Field()
            masterFieldObj.name = "SOURCE_ID"
            masterFieldObj.type = "LONG"
            addFields.append(masterFieldObj)
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        self.params = parameters
        if not self.params[2].value:
            if self.params[0].value:
                try:
                    desc = ARCPY.Describe(self.params[0].value)
                    shapeType = desc.ShapeType.upper()
                    if shapeType == "POLYGON":
                        self.params[2].setIDMessage("ERROR", 110151)
                    else:
                        aggMethod = self.params[3].value
                        if not aggMethod:
                            self.params[3].setIDMessage("ERROR", 110152)
                        else:
                            aggType = self.aggTypes[aggMethod.upper()]
                            if aggType == 2:
                                if not self.params[5].value:
                                    self.params[5].setIDMessage("ERROR", 110153)
                except:
                    pass

        if self.params[7].value:
            cellSizeUnit = self.params[7].value.value 
            try:
                cellSizeParts = cellSizeUnit.split()
                cellSize = UTILS.strToFloat(cellSizeParts[0])
                if cellSize <= 0:
                    self.params[7].setIDMessage("ERROR", 531)
            except:
                pass
            
        if self.params[8].value:
            bandSizeUnit = self.params[8].value.value 
            try:
                bandSizeParts = bandSizeUnit.split()
                bandSize = UTILS.strToFloat(bandSizeParts[0])
                if bandSize <= 0:
                    self.params[8].setIDMessage("ERROR", 531)
            except:
                pass
                
        if self.params[7].value and self.params[8].value:
            cellSizeUnit = self.params[7].value.value 
            bandSizeUnit = self.params[8].value.value
            try:
                cellSizeParts = cellSizeUnit.split()
                bandSizeParts = bandSizeUnit.split()
                cellSize = UTILS.strToFloat(cellSizeParts[0])
                bandSize = UTILS.strToFloat(bandSizeParts[0])
                cellSizeUnit = cellSizeParts[1].upper()
                bandSizeUnit = bandSizeParts[1].upper()
                unitCell, factorCell = UTILS.distanceUnitInfo[cellSizeUnit]
                unitBand, factorBand = UTILS.distanceUnitInfo[bandSizeUnit]
                cellSize = factorCell * cellSize
                bandSize = factorBand * bandSize
                if bandSize <= cellSize:
                    self.params[8].setIDMessage("ERROR", 192, self.params[8].name )
            except:
                pass 

    def setParameterInfo(self, inputFC):
        try:
            desc = ARCPY.Describe(inputFC)
            shapeType = desc.ShapeType.upper()
            self.oidName = desc.oidFieldName
            self.shapeType = shapeType
            self.setOutputSymbology(shapeType)
            for field in desc.fields:
                self.fieldObjects[field.name] = field
        except:
            self.oidName = None
            self.shapeType = None

    def setOutputSymbology(self, shapeType):
        renderOut = self.renderType[shapeType]
        varName = self.params[2].value

        #### Output Features ####
        if varName:
            if renderOut == 0:
                renderLayerFile = "LocalIPoints.lyr"
            elif renderOut == 1:
                renderLayerFile = "LocalIPolylines.lyr"
            else:
                renderLayerFile = "LocalIPolygons.lyr"
        else:
            aggMethod = self.params[3].value
            if aggMethod:
                aggType = self.aggTypes[aggMethod.upper()]
                if aggType:
                    renderLayerFile = "LocalIPolygons.lyr"
                else:
                    renderLayerFile = "LocalIPoints.lyr"
            else:
                renderLayerFile = "LocalIPolygons.lyr"
            
        fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
        self.params[1].symbology = fullRLF

    def execute(self, parameters, messages):
        """Retrieves the parameters from the User Interface and executes the
        appropriate commands."""
        import OptimizedOutlierAnalysis as OOA
        import arcpy.management as DM

        #### Input Parameters ####
        inputFC = UTILS.getTextParameter(0, parameters)
        outputFC = UTILS.getTextParameter(1, parameters)
        varName = UTILS.getTextParameter(2, parameters, fieldName = True)
        aggMethod = UTILS.getTextParameter(3, parameters)
        if aggMethod:
            aggType = self.aggTypes[aggMethod.upper()]
        else:
            aggType = 1
        boundaryFC = UTILS.getTextParameter(4, parameters)
        polygonFC = UTILS.getTextParameter(5, parameters)

        permutationsOption = UTILS.getTextParameter(6, parameters)

        #### Apply execute new field type checker ####
        if varName is None:
            check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC)
        else:
            check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=[varName])
        
        permutations = 499
        try:
            permutationsOption = permutationsOption.split('_')[1]
            permutations = int(permutationsOption)
        except:
            pass

        userCellSize, userCellUnit = UTILS.getLinearUnitParameter(7, parameters)
        userBandSize, userBandUnit = UTILS.getLinearUnitParameter(8, parameters)
        useDefaultDistance = False
        useDefaultBand = False
        
        if userCellUnit is None:
            useDefaultDistance = True
         
        if userBandUnit is None:
            useDefaultBand = True

        #### Check Number of Polygons ####
        if polygonFC and aggType == 2:
            ssdoPoly = SSDO.SSDataObject(polygonFC)
            ssdoPoly.obtainData(ssdoPoly.oidName)
            OOA.checkNumberPolygons(ssdoPoly.numObs)

        makeFeatureLayerNoExtent = UTILS.clearExtent(DM.MakeFeatureLayer)
        selectLocationNoExtent = UTILS.clearExtent(DM.SelectLayerByLocation)
        featureLayer = "InputOA_FC"
        featureLayerInit = "InputOA_Init_FC"
        makeFeatureLayerNoExtent(inputFC, featureLayerInit)
        selectionType = UTILS.getSelectionType(featureLayerInit)

        #### Handle Current Selection and Study Area Selection ####
        if aggType == 1 or aggType == 3:
            if boundaryFC:
                selectLocationNoExtent(featureLayerInit, "INTERSECT",
                                       boundaryFC, "#",
                                       selectionType)
            polygonFC = None

        elif aggType == 2:
            selectLocationNoExtent(featureLayerInit, "INTERSECT",
                                   polygonFC, "#",
                                   selectionType)
            boundaryFC = None

        else:
            boundaryFC = None
            polygonFC = None

        #### Create SSDO ####
        makeFeatureLayerNoExtent(featureLayerInit, featureLayer)
        UTILS.passiveDelete(featureLayerInit)
        ssdo = SSDO.SSDataObject(featureLayer, templateFC = outputFC,
                                 useChordal = True)

        extentFactor = ssdo.distanceInfo.convertFactor
        processingBandSize = None
        processingCellSize = None
        cellSizeOrigin = None
        bandSizeOrigin = None

        if not useDefaultBand:
            bandSizeStr, bandSizeFactor = UTILS.distanceUnitInfo[userBandUnit]
            processingBandSize = (userBandSize * bandSizeFactor) / extentFactor
            bandSizeOrigin = UTILS.getTextParameter(8, parameters)

        if not useDefaultDistance:
            cellSizeStr, cellSizeFactor = UTILS.distanceUnitInfo[userCellUnit]
            processingCellSize = (userCellSize * cellSizeFactor) / extentFactor
            extendDistance = processingCellSize
            if ssdo.useChordal:
                extendDistance = (userCellSize * cellSizeFactor) / UTILS.GCSDegree2Meters
            cellSizeOrigin = UTILS.getTextParameter(7, parameters)
            #### Check and Make Sure the Cell Size Won't Exceed The Limitation of Input Feature Layer's SRS Extent ####
            xMin, yMin, zMin, xMax, yMax, zMax = UTILS.getXYZProjectionDomain(ssdo.spatialRef)
            centroid = ssdo.extent.polygon.centroid
            cX = centroid.X
            cY = centroid.Y
            if cX - extendDistance < xMin \
                    or cX + extendDistance > xMax \
                    or cY - extendDistance < yMin \
                    or cY + extendDistance > yMax:
                ARCPY.AddIDMessage("ERROR", 110250)
                raise SystemExit()

        hs = OOA.OptimizedOutlier(ssdo, outputFC, varName = varName, aggType = aggType,
                            polygonFC = polygonFC, boundaryFC = boundaryFC,
                            permutations = permutations,
                            cellSize2Use = processingCellSize, bandSize2Use = processingBandSize,
                            parameters = parameters,
                            cellSizeOrigin = cellSizeOrigin, bandSizeOrigin = bandSizeOrigin)

        UTILS.passiveDelete(featureLayer)


class GenerateSpatialWeightsMatrix(object):
    def __init__(self):
        self.label = "Generate Spatial Weights Matrix"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060001
        self.params = None
        #### Set Lists of Spatial Concepts ####
        self.baseConcepts = ["INVERSE_DISTANCE", "FIXED_DISTANCE", 
                             "K_NEAREST_NEIGHBORS", "DELAUNAY_TRIANGULATION",
                             "SPACE_TIME_WINDOW", "CONVERT_TABLE"]

        self.allConcepts = ["INVERSE_DISTANCE", "FIXED_DISTANCE", 
                            "K_NEAREST_NEIGHBORS", "CONTIGUITY_EDGES_ONLY",
                            "CONTIGUITY_EDGES_CORNERS",
                            "DELAUNAY_TRIANGULATION",
                            "SPACE_TIME_WINDOW", "CONVERT_TABLE"]

        self.distSetTypes = ["INVERSE_DISTANCE", "FIXED_DISTANCE",
                             "K_NEAREST_NEIGHBORS", 
                             "CONTIGUITY_EDGES_ONLY",
                             "CONTIGUITY_EDGES_CORNERS"]
                             
        self.zSupport = ["INVERSE_DISTANCE", "FIXED_DISTANCE",
                         "K_NEAREST_NEIGHBORS", "SPACE_TIME_WINDOW"]

        #### 
    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Feature Class",
                            name = "Input_Feature_Class",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point', 'Multipoint', 'Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Unique ID Field",
                            name = "Unique_ID_Field",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','BigInteger']

        param1.parameterDependencies = ["Input_Feature_Class"]

        param2 = ARCPY.Parameter(displayName="Output Spatial Weights Matrix File",
                            name = "Output_Spatial_Weights_Matrix_File",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Output")

        param2.filter.list = ['swm']

        param3 = ARCPY.Parameter(displayName="Conceptualization of Spatial Relationships",
                            name = "Conceptualization_of_Spatial_Relationships",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param3.filter.type = "ValueList"

        param3.filter.list = ['INVERSE_DISTANCE','FIXED_DISTANCE','K_NEAREST_NEIGHBORS','CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS','DELAUNAY_TRIANGULATION','SPACE_TIME_WINDOW','CONVERT_TABLE']

        param4 = ARCPY.Parameter(displayName="Distance Method",
                            name = "Distance_Method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param4.filter.type = "ValueList"

        param4.filter.list = ['EUCLIDEAN','MANHATTAN']

        param4.value = 'EUCLIDEAN'

        param4.enabled = False

        param5 = ARCPY.Parameter(displayName="Exponent",
                            name = "Exponent",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")

        param5.value = 1.0

        param5.enabled = False

        param6 = ARCPY.Parameter(displayName="Threshold Distance",
                            name = "Threshold_Distance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "Range"
        param6.filter.list = [0.0, 999999999.0]
        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Number of Neighbors",
                            name = "Number_of_Neighbors",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Row Standardization",
                            name = "Row_Standardization",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param8.filter.list = ['ROW_STANDARDIZATION', 'NO_STANDARDIZATION']
        param8.value = True

        param9 = ARCPY.Parameter(displayName="Input Table",
                            name = "Input_Table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Input")

        param9.enabled = False

        param10 = ARCPY.Parameter(displayName="Date/Time Field",
                            name = "Date_Time_Field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")

        param10.parameterDependencies = ["Input_Feature_Class"]
        param10.filter.list = ['Date']
        param10.enabled = False

        param11 = ARCPY.Parameter(displayName="Date/Time Interval Type",
                            name = "Date_Time_Interval_Type",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param11.filter.type = "ValueList"

        param11.filter.list = ['SECONDS','MINUTES','HOURS','DAYS','WEEKS','MONTHS','YEARS']

        param11.enabled = False

        param12 = ARCPY.Parameter(displayName="Date/Time Interval Value",
                            name = "Date_Time_Interval_Value",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param12.enabled = False

        param13 = ARCPY.Parameter(displayName="Use Z Values",
                            name = "Use_Z_values",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param13.filter.list = ['USE_Z_VALUES', 'DO_NOT_USE_Z_VALUES']
        param13.enabled = True

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9,param10,param11,param12,param13]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters

        if self.params[0].altered:
            if not self.params[0].isInputValueDerived():
                self.checkContiguity(self.params[0].value)

        #### Validate and Correct The SWM File Path ####
        if paramChanged(parameters[2]):
            try:
                if parameters[2].value:
                    swmPath = parameters[2].value.value
                    swmName, swmExt = OS.path.splitext(swmPath)
                    if swmExt != ".swm":
                        parameters[2].value = swmName + ".swm"
            except:
                pass

        #### Validate Space Concepts ####
        spaceConcept = self.params[3].value
        if spaceConcept:
            spaceConcept = spaceConcept.upper()

        #### Enable/Disable Distance Method ####
        nonDistMeth = ["DELAUNAY_TRIANGULATION", "CONVERT_TABLE", ""]
        if spaceConcept in nonDistMeth:
            self.params[4].enabled = 0
        else:
            try:
                desc = ARCPY.Describe(self.params[0].value)
                outSpatRef = setEnvSpatialReference(desc.SpatialReference)
                if outSpatRef.type.upper() == "GEOGRAPHIC":
                    self.params[4].enabled = False
                else:
                    self.params[4].enabled = True
            except:
                pass

        #### Enable/Disable Exponent ####
        if spaceConcept == "INVERSE_DISTANCE":
            self.params[5].enabled = 1
        else:
            self.params[5].enabled = 0

        #### Enable/Disable Threshold Distance ####
        threshTypes = ["INVERSE_DISTANCE", "FIXED_DISTANCE", "SPACE_TIME_WINDOW"]
        if spaceConcept in threshTypes:
            self.params[6].enabled = 1
        else:
            self.params[6].enabled = 0

        #### Enable/Disable Number of Neighs ####
        nonNNTypes = ["DELAUNAY_TRIANGULATION", "CONVERT_TABLE", 
                      "SPACE_TIME_WINDOW", ""]
        if spaceConcept in nonNNTypes:
            self.params[7].enabled = 0
        else:
            self.params[7].enabled = 1

        if spaceConcept in self.distSetTypes:
            self.params[7].enabled = True
            numNeighs = self.params[7].value
            if not numNeighs:
                if spaceConcept == "K_NEAREST_NEIGHBORS":
                    self.params[7].value = 8
                else:
                    self.params[7].value = 0
        else:
            self.params[7].enabled = False
            self.params[7].value = None

        #### Enable Table Input ####
        if spaceConcept == "CONVERT_TABLE":
            self.params[9].enabled = 1
        else:
            self.params[9].enabled = 0

        #### Enable Space-Time Params ####
        if spaceConcept == "SPACE_TIME_WINDOW":
            self.params[10].enabled = 1
            self.params[11].enabled = 1
            self.params[12].enabled = 1
        else:
            self.params[10].enabled = 0
            self.params[11].enabled = 0
            self.params[12].enabled = 0
            
        if self.params[13].altered:
            changeConcept = self.shapeType != "POLYGON" and self.params[13].value
            if self.params[13].value and changeConcept:
                self.params[3].filter.list = self.zSupport
            else:
                self.params[3].filter.list = self.allConcepts

    def updateMessages(self, parameters):
        self.params = parameters
        spaceConcept = self.params[3].value
        if spaceConcept:
            spaceConcept = spaceConcept.upper()

        if spaceConcept == "K_NEAREST_NEIGHBORS":
            numNeighs = self.params[7].value
            if numNeighs < 1:
                self.params[7].setIDMessage("ERROR", 1219, 1)

        if self.params[3].value:
            value3 = self.params[3].value

            #### Convert Table ####
            if value3 == 'CONVERT_TABLE':
                if self.params[9].value in ["", "#", None]:
                    self.params[9].setIDMessage("ERROR", 110189)

            elif value3 == 'SPACE_TIME_WINDOW':
                if self.params[10].value in ["", "#", None]:
                    self.params[10].setIDMessage("ERROR", 1320)

                if self.params[11].value in ["", "#", None]:
                    self.params[11].setIDMessage("ERROR", 1321)

                if self.params[12].value in ["", "#", None]:
                    self.params[12].setIDMessage("ERROR", 1322)

    def checkContiguity(self, inputFC):
        try:
            desc = ARCPY.Describe(inputFC)
            self.shapeType = desc.ShapeType.upper()
            if self.shapeType == "POLYGON":
                self.params[13].enabled = 0
                self.params[3].filter.list = self.allConcepts
            else:
                self.hasZ = desc.HasZ
                if self.hasZ:
                    self.params[13].enabled = 1
                    self.params[3].filter.list = self.zSupport
                else:
                    self.params[13].enabled = 0
                    self.params[3].filter.list = self.baseConcepts
        except:
            self.shapeType = "POLYGON"
            self.hasZ = False
            pass

    def execute(self, parameters, messages):
        import Weights as WEIGHTS
        WEIGHTS.execute(parameters, messages)

class DensityBasedClustering(object):
    def __init__(self):
        self.label = "Density-based Clustering"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030008
        self.methods = ["DBSCAN", "HDBSCAN", "OPTICS"]
        self.params = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Point']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Cluster Method",
                            name = "cluster_method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.type = "ValueList"
        param2.filter.list = ['DBSCAN','HDBSCAN','OPTICS']
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Minimum Number of Features per Cluster",
                            name = "min_features_cluster",
                            datatype = "GPLong",
                            parameterType = "Required",
                            direction = "Input")

        param3.filter.type = "Range"
        param3.filter.list = [2, 100000000]
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Search Distance",
                            name = "search_distance",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = supportDist
        param4.enabled = False
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Cluster Sensitivity",
                            name = "cluster_sensitivity",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param5.enabled = False
        param5.filter.type = "Range"
        param5.filter.list = [0, 100]
        param5.displayOrder = 7

        param6 = ARCPY.Parameter(displayName="Time Field", 
                            name="time_field",
                            datatype="Field",
                            parameterType="Optional",
                            direction="Input")
        param6.filter.list = ["Date"]
        param6.parameterDependencies = [param0.name]
        param6.displayOrder = 5
        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Search Time Interval",          
                                 name="search_time_interval",
                                 datatype="GPTimeUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = ["Seconds", "Minutes", "Hours", "Days", "Weeks", "Months", "Years"]
        param7.displayOrder = 6
        param7.enabled = False

        return [param0,param1,param2,param3,param4,param5,param6,param7]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        method = self.params[2]
        minNFea = self.params[3]
        sDistance = self.params[4]
        noise = self.params[5]
        timeField = self.params[6]
        interval = self.params[7]

        if self.params[2].value:
            if self.params[2].value =="HDBSCAN":
                enableParameters([ minNFea ], [ sDistance, noise])
            elif self.params[2].value == "OPTICS":
                enableParameters([ minNFea, sDistance, noise, timeField], [])
            elif self.params[2].value == "DBSCAN":
                enableParameters([ minNFea, sDistance, timeField], [ noise ])

        if self.params[2].value in ["OPTICS", "DBSCAN" ]:
            if timeField.value:
                interval.enabled = True
            else:
                interval.value = None
                interval.enabled = False
        else:
            #### Remove Time Info for HDBScan ####
            clearParameter(timeField)
            clearParameter(interval)

        #### Append Output Field to Output Feature Class's Schema ####
        if method.value == "HDBSCAN":
            fieldNames = ["SOURCE_ID", "CLUSTER_ID", "PROB", "OUTLIER", "EXEMPLAR", "STABILITY", "COLOR_ID"]
            fieldTypes = ["LONG", "LONG", "DOUBLE", "DOUBLE", "LONG", "DOUBLE", "LONG"]

        elif method.value == "OPTICS":
            fieldNames = ["SOURCE_ID", "CLUSTER_ID", "REACHORDER", "REACHDIST", "COLOR_ID"]
            fieldTypes = ["LONG", "LONG", "LONG", "DOUBLE", "LONG"]
        else:
            fieldNames = ["SOURCE_ID", "CLUSTER_ID", "COLOR_ID"]
            fieldTypes = ["LONG"] * 3
        
        if timeField.value is not None:
            fieldNames += ["START_TIME", "END_TIME", "MEAN_TIME", "TIME_EXAGG"]
            fieldTypes += ["DATE", "DATE", "DATE", "DOUBLE"]

        addFields = []
        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            addFields.append(newField)

        parameters[1].schema.additionalFields = addFields

        return

    def updateMessages(self, parameters):
        self.params = parameters
        outParam = self.params[1]
        minNFea = self.params[3]
        noise = self.params[5]
        sDistance = self.params[4]
        method = self.params[2]
        timeField = self.params[6]
        interval = self.params[7]

        if outParam.value is not None:
            if UTILS.isShapeFile(outParam.valueAsText):
                outParam.setIDMessage("WARNING", 110402)

        if self.params[2].value in ["OPTICS", "DBSCAN" ]:
            if timeField.value:
                if interval.value is None:
                    interval.setIDMessage("ERROR", 530)
                else:
                    searchTime = interval.valueAsText
                    try:
                        time, intervalType = searchTime.split(" ")
                        intTime = int(LOCALE.atof(time))
                        if intTime < 0:
                            interval.setIDMessage("ERROR", 110404)

                        #### Assure Time is Not a Float ####
                        interval.value = "{0} {1}".format(intTime, intervalType)
                    except:
                        #### Invalid Search Time Interval ####
                        interval.setIDMessage("ERROR", 110403)

                if sDistance.value is None:
                    sDistance.setIDMessage("ERROR", 530)

        if noise.value:
           if UTILS.getNumericParameter(5, self.params) <= 0 or UTILS.getNumericParameter(5, self.params)> 100:
               noise.setIDMessage("ERROR", 854, 0, 100)

        if method.value:
            if method.value in ['DBSCAN']:
                if sDistance.value is not None:
                    value = getLinearUnitFloat(sDistance.value)
                    if value <= 0.0:
                        sDistance.setIDMessage("ERROR", 323)

            if method.value in ['OPTICS']:
                if sDistance.value is not None:
                    value = getLinearUnitFloat(sDistance.value)
                    if value <= 0.0:
                        sDistance.setIDMessage("ERROR", 323)

        if minNFea.value:
            value = UTILS.getNumericParameter(3, self.params)
            if value <= 1:
                minNFea.setIDMessage("ERROR", 110143)

        if minNFea.value == 0:
            minNFea.setIDMessage("ERROR", 110143)
        return

    def execute(self, parameters, messages):
        import SSCluster as SC

        inputFC = UTILS.getTextParameter(0, parameters)
        outputFC = UTILS.getTextParameter(1, parameters)
        typeValue = UTILS.getTextParameter(2, parameters)
        minClusterSize = int(UTILS.getTextParameter(3, parameters))
        distance = UTILS.getTextParameter(4, parameters)
        noise = UTILS.getNumericParameter(5, parameters)
        timeField = UTILS.getTextParameter(6, parameters, fieldName = True)
        timeInterval = UTILS.getTextParameter(7,parameters)

        ## Apply ExecuteNewFieldTypeChecker
        check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC)

        distance = None if distance in ["","#"] else distance
        timeField = None if timeField in ["","#"] else timeField
        timeInterval = None if timeInterval in ["","#"] else timeInterval
        #### Check Output ####
        UTILS.checkOutputPath(outputFC, "FC")

        layer = None
        cluster = None

        threads  =  UTILS.getNumberOfThreadsDefault()
        if typeValue == 'DBSCAN':
            cluster = SC.DBSCAN(inputFC, outputFC, minClusterSize, distance, parallel = threads, 
                                timeField = timeField, timeInterval = timeInterval  )
        if typeValue == 'HDBSCAN':
            cluster = SC.HDBSCAN(inputFC, outputFC, minClusterSize,  parallel = threads, 
                                timeField = timeField, timeInterval = timeInterval  )
        if typeValue == 'OPTICS':
            cluster = SC.OPTICS(inputFC, outputFC, minClusterSize, distance, noise,  parallel = threads, 
                                timeField = timeField, timeInterval = timeInterval  )

        cluster.run()
        layer = cluster.output()
        paramOutput = parameters[1]
        lChart = None

        if cluster.timeEnabled:

            if cluster.ssdo.numObs > 10000:
                ARCPY.AddIDMessage("WARNING", 110538)
            else:
                lChart = ARCPY.Chart("Time Span Per Cluster")
                lChart.type = "line"
                lChart.title = ARCPY.GetIDMessage(220171)

                #### Assign X Axis Field ####
                lChart.xAxis.field = cluster.timeFieldName
                lChart.xAxis.title = cluster.timeFieldAlias
                lChart.yAxis.field = "CLUSTER_ID"
                lChart.yAxis.title = ARCPY.GetIDMessage(84790)
                #lChart.line.aggregation= "MEAN"
                lChart.legend.visible = False
                lChart.line.splitCategory = "CLUSTER_ID"
                lChart.color = cluster.colorSeries

        #### Bar Chart ####
        bChart = ARCPY.Chart(ARCPY.GetIDMessage(84783))
        bChart.type = "bar"
        bChart.title = ARCPY.GetIDMessage(84783)

        #### Assign X Axis Field ####
        bChart.xAxis.field = "CLUSTER_ID"
        bChart.xAxis.title = ARCPY.GetIDMessage(84790)
        bChart.xAxis.sort = "ASC"
        bChart.yAxis.field = ""
        bChart.yAxis.title = ARCPY.GetIDMessage(84785)
        bChart.bar.aggregation= "COUNT"
        bChart.bar.multiSeriesDisplay = "stacked"
        bChart.bar.splitCategory = "COLOR_ID"
        bChart.legend.visible = False

        if typeValue == 'OPTICS':
            chart = ARCPY.Chart(ARCPY.GetIDMessage(84769))
            chart.type = "scatter"
            chart.title = ARCPY.GetIDMessage(84769)
            chart.scatter.showTrendLine = False
            #### Assign Y Axis Field ####
            chart.yAxis.field = "REACHDIST"
            chart.yAxis.title = ARCPY.GetIDMessage(84770)

            #### Assign X Axis Field ####
            chart.xAxis.field = "REACHORDER"
            chart.xAxis.title = ARCPY.GetIDMessage(84771)
            if cluster.timeEnabled and lChart is not None:
                paramOutput.charts = [chart, bChart, lChart]
            else:
                paramOutput.charts = [chart, bChart]
        elif typeValue == 'HDBSCAN':
            hProb = ARCPY.Chart(ARCPY.GetIDMessage(84782))
            hProb.type = "histogram"
            hProb.title = ARCPY.GetIDMessage(84782)
            hProb.xAxis.field = "PROB"
            hProb.xAxis.title = ARCPY.GetIDMessage(84789)
            hProb.histogram.showMean = False
            paramOutput.charts = [hProb, bChart]
        else:
            if cluster.timeEnabled and lChart is not None:
                paramOutput.charts = [bChart,lChart]
            else:
                paramOutput.charts = [bChart]

        return
        

class SpatiallyConstrainedMultivariateClustering(object):
    def __init__(self):
        self.label = "Spatially Constrained Multivariate Clustering"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030010
        self.allSpaceTypes = ["CONTIGUITY_EDGES_ONLY",
                             "CONTIGUITY_EDGES_CORNERS",
                             "TRIMMED_DELAUNAY_TRIANGULATION",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]
        self.pointSpaceTypes = ["TRIMMED_DELAUNAY_TRIANGULATION",
                                "GET_SPATIAL_WEIGHTS_FROM_FILE"]
        self.skaterShape2Layer = {"POINT": "MultiVarClusterPoints.lyrx",
                             "POLYGON": "MultiVarClusterPolygons.lyrx"}
        self.params = None
        #### Set Parameter Default ####
        #### Add Deleted Parameter Values to Defaults
        self.defaultIndexList = [3, 10]
        self.defaultValueList = ['NONE', 0]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")

        param0.filter.list = ['Point','Polygon']

        param1 = ARCPY.Parameter(displayName="Output Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Analysis Fields",
                            name = "analysis_fields",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param2.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param2.filter.list = ['Short','Long','Float','Double', 'BigInteger']

        param2.parameterDependencies = ["in_features"]

        param3 = ARCPY.Parameter(displayName="Cluster Size Constraints",
                            name = "size_constraints",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param3.filter.type = "ValueList"

        param3.filter.list = ['NONE','NUM_FEATURES','ATTRIBUTE_VALUE']

        param3.value = 'NONE'

        param4 = ARCPY.Parameter(displayName="Constraint Field",
                            name = "constraint_field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param4.parameterDependencies = ["in_features"]

        param5 = ARCPY.Parameter(displayName="Minimum per Cluster",
                            name = "min_constraint",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")

        param6 = ARCPY.Parameter(displayName="Maximum per Cluster",
                            name = "max_constraint",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")

        param7 = ARCPY.Parameter(displayName="Number of Clusters",
                            name = "number_of_clusters",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param8 = ARCPY.Parameter(displayName="Spatial Constraints",
                            name = "spatial_constraints",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param8.filter.type = "ValueList"

        param8.filter.list = ['CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS','TRIMMED_DELAUNAY_TRIANGULATION','GET_SPATIAL_WEIGHTS_FROM_FILE']

        param9 = ARCPY.Parameter(displayName="Spatial Weight Matrix File",
                            name = "weights_matrix_file",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param9.filter.list = ['swm', 'gwt']

        param10 = ARCPY.Parameter(displayName="Number of Permutations",
                            name = "number_of_permutations",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param10.filter.list = [0, 100, 200, 500, 1000]
        param10.value  = 0

        param11 = ARCPY.Parameter(displayName="Output Table",
                            name = "output_table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")

        return [param0,param1,param2,param3,param4,param5,param6,param7,param8,param9,param10,param11]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        self.params = parameters
        
        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(self.params, self.defaultIndexList, self.defaultValueList)

        self.fieldObjects = {}
        if paramChanged(parameters[0]):
            try:
                desc = ARCPY.Describe(parameters[0].value)
                shapeType = desc.shapeType.upper()
                if shapeType.upper() == "POLYGON":
                    parameters[8].filter.list = self.allSpaceTypes
                else:
                    parameters[8].filter.list = self.pointSpaceTypes

                for field in desc.fields:
                    self.fieldObjects[field.name] = field
            except:
                parameters[8].filter.list = self.allSpaceTypes

        #### SWM File ####
        if parameters[8].value == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            parameters[9].enabled = True
        else:
            parameters[9].enabled = False

        #### Min/Max Constraints ####
        if parameters[3].value == "NUM_FEATURES":
            parameters[4].value = None
            parameters[4].enabled = False
            parameters[5].enabled = True
            parameters[6].enabled = True
        elif parameters[3].value == "ATTRIBUTE_VALUE":
            parameters[4].enabled = True
            parameters[5].enabled = True
            parameters[6].enabled = True
        else:
            parameters[4].value = None
            parameters[4].enabled = False
            parameters[5].enabled = False
            parameters[6].enabled = False

        #### Disable Num Groups, Perms and Optimize Table with Max Constraint ####
        if parameters[3].value != "NONE":
            minValue = UTILS.getNumericParameter(5, parameters) 
            maxValue = UTILS.getNumericParameter(6, parameters) 
            if parameters[3].value == "NUM_FEATURES":
                if minValue is not None:
                    minValue = int(minValue)
                    parameters[5].value = minValue
                if maxValue is not None:
                    maxValue = int(maxValue)
                    parameters[6].value = maxValue
            if maxValue is not None:
                parameters[7].value = None
                parameters[7].enabled = False
                parameters[10].enabled = False
                parameters[11].enabled = False
                parameters[11].value = None
            else:
                parameters[7].enabled = True
                parameters[10].enabled = True
                parameters[11].enabled = True
        else:
            parameters[7].enabled = True
            parameters[10].enabled = True
            parameters[11].enabled = True

        #### Clear and Gray Out Max Constraint if Permutations ####
        if parameters[10].value:
            parameters[6].value = None
            parameters[6].enabled = False

        #### Default Spatial Constraint ####
        if parameters[0].value and parameters[8].value in [None, ""]:
            try:
                desc = ARCPY.Describe(parameters[0].value)
                shapeType = desc.shapeType.upper()
                if shapeType.upper() == "POLYGON":
                    parameters[8].value = "CONTIGUITY_EDGES_CORNERS"
                else:
                    parameters[8].value = "TRIMMED_DELAUNAY_TRIANGULATION"
            except:
                pass

        #### Analysis Field(s) ####
        addFields = []
        if parameters[2].value:
            for fieldName in parameters[2].value.exportToString().split(";"):
                if fieldName in self.fieldObjects:
                    addFields.append(self.fieldObjects[fieldName])

        if parameters[3].value == "ATTRIBUTE_VALUE" and parameters[4].value:
            fieldName = parameters[4].value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["CLUSTER_ID"]

        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "LONG"
            addFields.append(newField)
        parameters[1].schema.additionalFields = addFields
        self.params[1].schema.featureTypeRule = "AsSpecified"
        self.params[1].schema.featureType = "Simple"
        self.params[1].schema.geometryTypeRule = "AsSpecified"
        self.params[1].schema.fieldsRule = "None"

        #### Output Table ####
        if parameters[11].value:
            parameters[11].value = returnTablePath(parameters[11])
            fieldNames = ["NUM_GROUPS", "PSEUDO_F"]
            fieldTypes = ["LONG", "DOUBLE"]
            tabFields = []
            for fieldInd, fieldName in enumerate(fieldNames):
                newField = ARCPY.Field()
                newField.name = fieldName
                newField.type = fieldTypes[fieldInd]
                tabFields.append(newField)
            self.params[11].schema.additionalFields = tabFields

        return

    def updateMessages(self, parameters):
        self.params = parameters 
        #### Positive K > 1 When Chosen ####
        numGroups = UTILS.getNumericParameter(7, parameters)
        if numGroups is not None:
            if numGroups < 2:
                parameters[7].setIDMessage("ERROR", 110128, 2)

        #### Must Choose Sum Field ####
        if parameters[3].value == "ATTRIBUTE_VALUE":
            sumField = UTILS.getTextParameter(4,parameters, fieldName = True)
            if sumField is None:
                parameters[4].setIDMessage("ERROR", 110136)

        #### Min Must Be Smaller Than Max ####
        minNumValues = UTILS.getNumericParameter(5, parameters)
        maxNumValues = UTILS.getNumericParameter(6, parameters)
        if minNumValues is not None and maxNumValues is not None:
            if minNumValues >= maxNumValues:
                parameters[5].setIDMessage("ERROR", 110137)

        #### Must Be Positive Greater than Zero ####
        if minNumValues is not None:
            if minNumValues <= 0:
                parameters[5].setIDMessage("ERROR", 110138)

        if maxNumValues is not None:
            if maxNumValues <= 0:
                parameters[6].setIDMessage("ERROR", 110138)


        if parameters[1].value and parameters[11].value:
            fc = parameters[1].valueAsText
            tbl = parameters[11].valueAsText
            fcNoExt = fc.lower().replace(".shp", "")
            tblNoExt = tbl.lower().replace(".dbf", "")
            if fcNoExt == tblNoExt:
                parameters[11].setIDMessage("ERROR", 605, tbl, fc)

        if parameters[11].value:
            tbl = parameters[11].valueAsText
            if ".txt" in tbl:
                parameters[11].setIDMessage("ERROR", 210, tbl)

    def execute(self, parameters, messages):
        import SKATER as SK

        #### User Defined Inputs ####
        inputFC = parameters[0].valueAsText
        outputFC = parameters[1].valueAsText

        #### Analysis Fields ####
        analysisFields = parameters[2].valueAsText
        analysisFields = analysisFields.split(";")
        analysisFields = [ i.upper() for i in analysisFields ]
        fieldList = [ i for i in analysisFields ]

        #### Search Conditions ####
        minNumFeatures = None
        maxNumFeatures = None
        minNumValues = None
        maxNumValues = None
        searchCondition = UTILS.getTextParameter(3, parameters)
        sumField = UTILS.getTextParameter(4, parameters, fieldName = True)
        if searchCondition not in ["NONE", None]:
            if searchCondition == "ATTRIBUTE_VALUE":
                minNumValues = UTILS.getNumericParameter(5, parameters)
                maxNumValues = UTILS.getNumericParameter(6, parameters)
                if sumField not in fieldList:
                    fieldList.append(sumField)
            else:
                sumField = None
                minNumFeatures = UTILS.getNumericParameter(5, parameters)
                maxNumFeatures = UTILS.getNumericParameter(6, parameters)
                if minNumFeatures is not None:
                    minNumFeatures = int(minNumFeatures)
                if maxNumFeatures is not None:
                    maxNumFeatures = int(maxNumFeatures)

        #### Apply Exec new field type ####
        check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=fieldList)

        #### Number of Groups ####
        kPartitions = UTILS.getNumericParameter(7, parameters)

        #### Conceptualization ####
        spaceConcept = UTILS.getTextParameter(8, parameters)

        #### Number of Neighbors ####
        numNeighs = 2

        #### Spatial Weights Matrix File ####
        weightsFile = UTILS.getTextParameter(9, parameters)
        useWeightsFile = spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE"
        if not weightsFile and useWeightsFile:
            ARCPY.AddIDMessage("ERROR", 930)
            raise SystemExit()
        if weightsFile and not useWeightsFile:
            weightsFile = None

        #### Number of Permutations ####
        permutations = UTILS.getNumericParameter(10, parameters)
        if permutations is None:
            permutations = 0

        #### FStat Table ####
        outputTable = parameters[11].valueAsText

        #### Warn About Chordal Bool ####
        useChordal = spaceConcept not in self.pointSpaceTypes

        #### Create SSDataObject ####
        ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC,
                                    useChordal = useChordal)

        #### Set Unique ID Field ####
        masterField = UTILS.setUniqueIDField(ssdo, weightsFile = weightsFile)

        #### Populate SSDO with Data ####
        if useChordal:
            ssdo.obtainData(masterField, fieldList, minNumObs = 3, 
                            requireSearch = True, warnNumObs = 30)
        else:
            ssdo.obtainData(masterField, fieldList, minNumObs = 3, 
                            warnNumObs = 30)

        #### Execute ####
        skater = SK.SKATER(ssdo, analysisFields, spaceConcept = spaceConcept,
                        distConcept = "EUCLIDEAN", numNeighs = numNeighs,
                        weightsFile = weightsFile, kPartitions = kPartitions, 
                        sumField = sumField, minNumFeatures = minNumFeatures,
                        maxNumFeatures = maxNumFeatures, minNumValues = minNumValues,
                        maxNumValues = maxNumValues, permutations = permutations,
                        outputTable = outputTable)

        skater.report()

        #### Permutations / Gather Evidence and Calculate Probabilities ####
        if skater.doPermutations > 0:
            skater.getEvidenceProbs()

        #### Create OutputFC ####
        skater.createOutput(outputFC)

        #### Set the Default Symbology ####
        try:
            renderLayerFile = self.skaterShape2Layer[ssdo.shapeType.upper()]
            fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
            parameters[1].symbology = fullRLF
        except:
            ARCPY.AddIDMessage("WARNING", 973)

        #### Set Chart Output ####
        if UTILS.isPRO():

            #### Bar Chart ####
            bChart = ARCPY.Chart(ARCPY.GetIDMessage(84783))
            bChart.type = "bar"
            bChart.title = ARCPY.GetIDMessage(84783)

            #### Assign X Axis Field ####
            bChart.xAxis.field = "CLUSTER_ID"
            bChart.xAxis.title = ARCPY.GetIDMessage(84751)
            bChart.xAxis.sort = "ASC"
            bChart.yAxis.field = ""
            bChart.yAxis.title = ARCPY.GetIDMessage(84785)
            bChart.bar.aggregation= "COUNT"

            #### Box Plots ####
            box = ARCPY.Chart(ARCPY.GetIDMessage(84780))
            box.type = "boxPlot"
            box.title = ARCPY.GetIDMessage(84780)

            #### Assign Y Axis Field ####
            outPath, outName = OS.path.split(outputFC)
            plotFieldNames = [ ssdo.in2OutFieldMap[i] for i in analysisFields ]

            box.yAxis.field = plotFieldNames
            if len(plotFieldNames) == 1:
                box.yAxis.title = ARCPY.GetIDMessage(84974)
            else:
                box.yAxis.title = ARCPY.GetIDMessage(84269)

            #### Assign X Axis Field ####
            box.xAxis.field = ""
            box.xAxis.title = ARCPY.GetIDMessage(84399)

            #### Set Box Plot Properties ####
            box.boxPlot.splitCategory = "CLUSTER_ID"
            box.boxPlot.splitCategoryAsMeanLine = True
            box.boxPlot.standardizeValues = True

            chartList = [box, bChart]
            probFieldName = "MEM_PROB"
            if skater.permutations:
                perm = ARCPY.Chart(ARCPY.GetIDMessage(84782))
                perm.type = "histogram"
                perm.histogram.showMean = False
                perm.title = ARCPY.GetIDMessage(84782)
                perm.xAxis.field = probFieldName
                perm.xAxis.title = ARCPY.GetIDMessage(84789)
                perm.histogram.showMean = False
                chartList.append(perm)

            parameters[1].charts = chartList

            if outputTable is not None:
                #### FStat Plot ####
                chart = ARCPY.Chart(ARCPY.GetIDMessage(84772))
                chart.type = "line"
                chart.title = ARCPY.GetIDMessage(84772)

                #### Assign X Axis Field ####
                chart.xAxis.field = "NUM_GROUPS"
                chart.xAxis.title = ARCPY.GetIDMessage(84764)

                #### Assign Y Axis Field ####
                chart.yAxis.field = "PSEUDO_F"
                chart.yAxis.title = ARCPY.GetIDMessage(84773)

                #### Sort by X ####
                #chart.xAxis.sort = chart.xAxis.field

                parameters[11].charts = [chart]

class MultivariateClustering(object):
    def __init__(self):
        self.label = "Multivariate Clustering"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030009
        self.params  = None
        self.fieldObjects = None
        self.kMeansShape2Layer = {"POINT": "MultiVarClusterPoints.lyrx",
                     "MULTIPOINT": "MultiVarClusterPoints.lyrx",
                     "POLYGON": "MultiVarClusterPolygons.lyr",
                     "POLYLINE": "MultiVarClusterLines.lyrx"}
        #### Set Parameter Defaults ####
        self.defaultIndexList = [3, 4]
        self.defaultValueList = ['K_MEANS', 'OPTIMIZED_SEED_LOCATIONS']

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point','Multipoint','Polygon', 'Polyline']

        param1 = ARCPY.Parameter(displayName="Output Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param1.schema.featureTypeRule = "AsSpecified"
        param1.schema.featureType = "Simple"
        param1.schema.geometryTypeRule = "AsSpecified"
        param1.schema.fieldsRule = "None"

        param2 = ARCPY.Parameter(displayName="Analysis Fields",
                            name = "analysis_fields",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param2.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param2.filter.list = ['Short','Long','Float','Double','BigInteger']

        param2.parameterDependencies = ["in_features"]

        param3 = ARCPY.Parameter(displayName="Clustering Method",
                            name = "clustering_method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param3.filter.type = "ValueList"
        param3.filter.list = ['K_MEANS', 'K_MEDOIDS']
        param3.value = 'K_MEANS'

        param4 = ARCPY.Parameter(displayName="Initialization Method",
                            name = "initialization_method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param4.filter.type = "ValueList"

        param4.filter.list = ['OPTIMIZED_SEED_LOCATIONS','USER_DEFINED_SEED_LOCATIONS','RANDOM_SEED_LOCATIONS']

        param4.value = 'OPTIMIZED_SEED_LOCATIONS'

        param5 = ARCPY.Parameter(displayName="Initialization Field",
                            name = "initialization_field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")

        param5.parameterDependencies = ["in_features"]
        param5.filter.list = ['Short', 'Long']

        param6 = ARCPY.Parameter(displayName="Number of Clusters",
                            name = "number_of_clusters",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param7 = ARCPY.Parameter(displayName="Output Table",
                            name = "output_table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")

        return [param0,param1,param2,param3,param4,param5,param6,param7]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        self.fieldObjects = {}
        if paramChanged(parameters[0]):
            try:
                #### Set Output Symbology ####
                desc = ARCPY.Describe(parameters[0].value)
                shapeType = desc.shapeType.upper()
                renderLayerFile = self.kMeansShape2Layer[shapeType]
                fullRLF = OS.path.join(fullLayerPath, renderLayerFile)
                parameters[1].symbology = fullRLF

                for field in desc.fields:
                    self.fieldObjects[field.name] = field
            except:
                pass

        #### Set Initialization Info ####
        initApproach = parameters[4].value
        if initApproach == "USER_DEFINED_SEED_LOCATIONS":
            #### No K-Partitions or Optimized Option ####
            parameters[5].enabled = True
            parameters[6].value = None
            parameters[6].enabled = False
            parameters[7].value = None
            parameters[7].enabled = False
        else:
            parameters[5].enabled = False
            parameters[6].enabled = True
            parameters[7].enabled = True
        
        #### Analysis Field(s) ####
        addFields = []
        if parameters[2].value:
            for fieldName in parameters[2].value.exportToString().split(";"):
                if fieldName in self.fieldObjects:
                    addFields.append(self.fieldObjects[fieldName])

        if initApproach == "USER_DEFINED_SEED_LOCATIONS" and parameters[5].value:
            fieldName = parameters[5].value
            if fieldName in self.fieldObjects:
                addFields.append(self.fieldObjects[fieldName])

        fieldNames = ["CLUSTER_ID", "IS_SEED"]

        for fieldName in fieldNames:
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = "LONG"
            addFields.append(newField)
        parameters[1].schema.additionalFields = addFields

        #### Output Table ####
        if parameters[7].value:
            #### Add "dbf" to Table if in Folder/FileSystem ####
            parameters[7].value = returnTablePath(parameters[7])
            fieldNames = ["NUM_GROUPS", "PSEUDO_F"]
            fieldTypes = ["LONG", "DOUBLE"]
            tabFields = []
            for fieldInd, fieldName in enumerate(fieldNames):
                newField = ARCPY.Field()
                newField.name = fieldName
                newField.type = fieldTypes[fieldInd]
                addFields.append(newField)
            parameters[7].schema.additionalFields = addFields

        return

    def updateMessages(self, parameters):
        #### Positive K > 1 When Chosen ####
        numGroups = UTILS.getNumericParameter(6, parameters) 
        if numGroups is not None:
            if numGroups < 2:
                parameters[6].setIDMessage("ERROR", 110128, 2)

        #### Must Choose Init Field ####
        if parameters[4].value == "USER_DEFINED_SEED_LOCATIONS":
            initField = UTILS.getTextParameter(5, parameters, fieldName = True)
            if initField is None:
                parameters[5].setIDMessage("ERROR", 1327)

        if parameters[1].value and parameters[7].value:
            fc = parameters[1].valueAsText
            tbl = parameters[7].valueAsText
            fcNoExt = fc.lower().replace(".shp", "")
            tblNoExt = tbl.lower().replace(".dbf", "")
            if fcNoExt == tblNoExt:
                parameters[7].setIDMessage("ERROR", 605, tbl, fc)

        if parameters[7].value:
            tbl = parameters[7].valueAsText
            if ".txt" in tbl:
                parameters[7].setIDMessage("ERROR", 210, tbl)
        return

    def execute(self, parameters, messages):
        import MultivariateClustering as MC
        MC.execute(parameters, messages)

class LocalBivariateRelationships(object):
    def __init__(self):
        self.label = "Local Bivariate Relationships"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060009

        #### Set Default Values ####
        #### Add Deleted Parameter Values to Defaults
        self.defaultIndexList = [4, 5, 7, 9]
        self.defaultValueList = [30, 199, "90%", 0.5]

        #### Result Field Names ####
        self.outputFieldNames = ["ENTROPY", "PVALUES", "LBR_SIG", "INTERCEPT", "COEF_1",
                                 "PINTERCEPT", "P_COEF_1", "P_COEF_2", "AICC", "R2", "P_AICc", 
                                 "P_R2", "SIG_COEF", "P_SIG_COEF", "LBR_TYPE"]

        self.outputFieldTypes = ["DOUBLE", "DOUBLE", "TEXT", "DOUBLE", "DOUBLE", 
                                 "DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", 
                                 "DOUBLE", "TEXT", "TEXT", "TEXT"]

        self.outputFieldAliases = ["Entropy", "p-values", "Local Bivariate Relationship Confidence Level",
                                   "Intercept", "Coefficient (Linear)", "Polynomial Intercept",
                                   "Polynomial Coefficient (Linear)", "Polynomial Coefficient (Squared)",
                                   "AICc (Linear)", "r-squared (Linear)", "AICc (Polynomial)", "r-squared (Polynomial)",
                                   "Significance of Coefficients (Linear)", "Significance of Coefficients (Polynomial)",
                                   "Type of Relationship"]

        self.outputFieldLengths = [30, 3, 3, 30]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point','Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Dependent Variable",
                            name = "dependent_variable",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.list = ['Short','Long','Float','Double','BigInteger']
        param1.parameterDependencies = ["in_features"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Explanatory Variable",
                            name = "explanatory_variable",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")
        param2.filter.list = ['Short','Long','Float','Double','BigInteger']
        param2.parameterDependencies = ["in_features"]
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Output Features",
                                 name = "output_features",
                                 datatype = "DEFeatureClass",
                                 parameterType = "Required",
                                 direction = "Output")
        param3.displayOrder = 5

        param4 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param4.filter.type = "Range"
        param4.value = 30
        param4.filter.list = [30, 1000]
        param4.displayOrder = 3

        param5 = ARCPY.Parameter(displayName="Number of Permutations",
                                 name = "number_of_permutations",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param5.filter.list = [99, 199, 499, 999]
        param5.value = 199
        param5.displayOrder = 4

        param6 = ARCPY.Parameter(displayName="Enable Local Scatterplot Pop-ups",
                                 name = "enable_local_scatterplot_popups",
                                 datatype = "GPBoolean",
                                 parameterType = "Optional",
                                 direction = "Input")
        param6.filter.list = ['CREATE_POPUP', 'NO_POPUP']
        param6.value = True
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Level of Confidence",
                                 name = "level_of_confidence",
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param7.filter.list = ["90%", "95%", "99%"]
        param7.value = "90%"
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Apply False Discovery Rate (FDR) Correction",
                                 name = "apply_false_discovery_rate_fdr_correction",
                                 datatype = "GPBoolean",
                                 parameterType = "Optional",
                                 direction = "Input")
        param8.filter.list = ['APPLY_FDR', 'NO_FDR']
        param8.value = True
        param8.category = "Advanced Options"
        param8.displayOrder = 8

        param9 = ARCPY.Parameter(displayName="Scaling Factor (Alpha)",
                                  name = "scaling_factor",
                                  datatype = "GPDouble",
                                  parameterType = "Optional",
                                  direction = "Input")
        param9.filter.type = "Range"
        param9.filter.list = [0.01, 1]
        param9.value = 0.5
        param9.category = "Advanced Options"
        param9.displayOrder = 9

        return [param0, param1, param2, param3, param4, param5, param6, param7, param8,
                param9]

    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        dependentField = parameters[1]
        explanatoryField = parameters[2]
        outputFeatures = parameters[3]
        confidence = parameters[7]

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        #### Do Validation When All Required Params ####
        if inputFeatures.value and dependentField.value and explanatoryField.value and outputFeatures.value:
            fieldNames = [dependentField.valueAsText, explanatoryField.valueAsText]
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = fieldNames,
                                     outputFieldNames = self.outputFieldNames,
                                     outputFieldTypes = self.outputFieldTypes,
                                     outputFieldAliases = self.outputFieldAliases,
                                     outputFieldLengths = self.outputFieldLengths)
            uissdo.addSymbology(pointLayer = "BivariateDependence_Points.lyrx",
                                polygonLayer = "BivariateDependence_Polygons.lyrx")

        if not confidence.value:
            confidence.value = "90%"

    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        dependentField = parameters[1]
        explanatoryField = parameters[2]
        outputFeatures = parameters[3]
        scatter = parameters[6]
        confidence = parameters[7]

        if inputFeatures.value and dependentField.value and explanatoryField.value and outputFeatures.value:
            #### Make Sure the Explanatory Variable and Dependent Variable are different ####
            if dependentField.valueAsText == explanatoryField.valueAsText:
                explanatoryField.setIDMessage("ERROR", 110266)

            #### Second Call to UISSDO to Set Error Messages ####
            fieldNames = [dependentField.valueAsText, explanatoryField.valueAsText]
            uissdo = UI_SSDataObject(inputFeatures, outputFeatures, fieldNames = fieldNames,
                                     outputFieldNames = self.outputFieldNames,
                                     outputFieldTypes = self.outputFieldTypes,
                                     outputFieldAliases = self.outputFieldAliases,
                                     outputFieldLengths = self.outputFieldLengths)

            if scatter.value:
                if outputParamHasExtension(outputFeatures, extension = ".shp"):
                    #### Warning Message for Local Scatterplots When Written to Shapefile ####
                    scatter.setIDMessage("WARNING", 110277)

        #### Manual Check for GPString Parameter Due to % in Value List ####
        if confidence.value:
            if confidence.value not in ["90%", "95%", "99%"]:
                confidence.setIDMessage("ERROR", 800, "90% | 95% | 99%")

    def execute(self, parameters, messages):
        import BivariateDependence as BD
        BD.execute(parameters, messages)

    def postExecute(self, parameters):
        import BivariateDependence as BD
        BD.postExecute(parameters)

class BuildBalancedZones(object):
    def __init__(self):
        self.label = "Build Balanced Zones"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030011

        self.allSpaceTypes = ["CONTIGUITY_EDGES_ONLY",
                             "CONTIGUITY_EDGES_CORNERS",
                             "TRIMMED_DELAUNAY_TRIANGULATION",
                             "GET_SPATIAL_WEIGHTS_FROM_FILE"]
        self.pointSpaceTypes = ["TRIMMED_DELAUNAY_TRIANGULATION",
                                "GET_SPATIAL_WEIGHTS_FROM_FILE"]
        self.constPoly = ["EQUAL_AREA","COMPACTNESS","EQUAL_NUMBER_OF_FEATURES"]
        self.constPoint = ["COMPACTNESS","EQUAL_NUMBER_OF_FEATURES"]
        self.onlyCompact = ["COMPACTNESS"]
        self.constPolyArea = ["EQUAL_AREA","COMPACTNESS"]
        self.idMsg = ARCPY.GetIDMessage(84903)
        #### Set Parameter Defaults ####
        self.defaultIndexList = [2, 13, 14, 15]
        self.defaultValueList = ["ATTRIBUTE_TARGET", 100, 50, 0.1]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point','Polygon']

        param1 = ARCPY.Parameter(displayName="Output Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param2 = ARCPY.Parameter(displayName="Zone Creation Method",
                            name = "zone_creation_method",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")
        param2.filter.list = ["ATTRIBUTE_TARGET","NUMBER_ZONES_AND_ATTRIBUTE","NUMBER_OF_ZONES"]
        param2.value  = "ATTRIBUTE_TARGET"

        param3 = ARCPY.Parameter(displayName="Target Number of Zones",
                            name = "number_of_zones",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param4 = ARCPY.Parameter(displayName="Zone Building Criteria With Target",
                            name = "zone_building_criteria_target",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param4.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param4.parameterDependencies = [param0.name]
        param4.columns = [['Field', 'Variable'], ['GPString','Sum'], ['GPDouble', 'Weight']]
        param4.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]


        param5 = ARCPY.Parameter(displayName="Zone Building Criteria",
                            name = "zone_building_criteria",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")

        param5.parameterDependencies = [param0.name]
        param5.columns = [['Field', 'Variable'], ['GPDouble', 'Weight']]
        param5.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]


        param6 = ARCPY.Parameter(displayName="Spatial Constraints",
                            name = "spatial_constraints",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ['CONTIGUITY_EDGES_ONLY','CONTIGUITY_EDGES_CORNERS',
                              'TRIMMED_DELAUNAY_TRIANGULATION','GET_SPATIAL_WEIGHTS_FROM_FILE']
        #param6.value = 'TRIMMED_DELAUNAY_TRIANGULATION'

        param7 = ARCPY.Parameter(displayName="Spatial Weight Matrix File",
                            name = "weights_matrix_file",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.list = ['swm', 'gwt']

        param8 = ARCPY.Parameter(displayName="Zone Characteristics",
                            name = "zone_characteristics",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)
        param8.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param8.filter.list = ["EQUAL_AREA","COMPACTNESS","EQUAL_NUMBER_OF_FEATURES"]
        param8.category = "Additional Zone Selection Criteria"

        param9 = ARCPY.Parameter(displayName="Attribute to Consider",
                            name = "attribute_to_consider",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")

        param9.parameterDependencies = [param0.name]
        param9.columns = [['Field', 'Variable'], ['GPString','Function']]
        param9.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param9.filters[1].list = ["SUM","AVERAGE", "VARIANCE", "MEDIAN" ]
        param9.category = "Additional Zone Selection Criteria"

        param10 = ARCPY.Parameter(displayName="Distance to Consider",
                            name = "distance_to_consider",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            multiValue = True,
                            direction = "Input")
        param10.category = "Additional Zone Selection Criteria"
        param10.filter.list = ['Point', 'Polygon', 'Polyline']

        param11 = ARCPY.Parameter(displayName="Categorical Variable to Maintain Proportions",
                                 name="categorial_variable",
                                 datatype="Field",
                                 parameterType="Optional",
                                 direction="Input")
        param11.parameterDependencies = [param0.name]
        param11.filter.list = ["Integer","Short","Text", "Double", "Float", "BigInteger"]
        param11.category = "Additional Zone Selection Criteria"

        param12 = ARCPY.Parameter(displayName="Proportion Method",
                            name = "proportion_method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param12.filter.list = ['MAINTAIN_WITHIN_PROPORTION','MAINTAIN_OVERALL_PROPORTION']
        param12.filter.type = "ValueList"
        param12.category = "Additional Zone Selection Criteria"
        param12.enabled = False

        param13 = ARCPY.Parameter(displayName="Population Size",
                            name = "population_size",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param13.filter.type = "Range"
        param13.value = 100
        param13.filter.list = [3, 10000000]
        param13.category = "Advanced Parameters"

        param14 = ARCPY.Parameter(displayName="Number of Generations",
                            name = "number_generations",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")

        param14.filter.type = "Range"
        param14.value = 50
        param14.filter.list = [1, 10000000]
        param14.category = "Advanced Parameters"

        param15 = ARCPY.Parameter(displayName="Mutation Factor",
                            name = "mutation_factor",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")

        param15.filter.type = "Range"
        param15.value = 0.1
        param15.filter.list = [0.0, 1.0]
        param15.category = "Advanced Parameters"

        param16 = ARCPY.Parameter(displayName="Output Convergence Table",
                            name = "output_convergence_table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")

        param16.category = "Advanced Parameters"

        return [param0,param1,param2,param3,
                param4,param5,param6,param7,
                param8,param9,param10,param11,
                param12,param13,param14,param15,
                param16]

    def isLicensed(self):
        return True

    def _getWeights(self, valuesVar, indexPosWeight = 2 ):
        """ Get Weight from Value Table """

        values  = []
        weights = []
        names = set()
        for value in valuesVar.value:
            record = value
            weight = record[indexPosWeight]
            names.add(record[0].value)

            if weight in [0, None]:
                weight = 1

            weight1 = None

            try:
                weight1 = UTILS.strToFloat(weight)
            except:
                weight1 = weight

            weights.append(weight1)

        return weights, True if len(weights) == len(names) else False

    def _weights(self, numZonePar, variablesPar, par = False):
        """ Update Sum/Weight """
        currentSep = f'{0.5:n}'[1]
        rep ="." if currentSep == "," else ","
        if par and numZonePar.value is None or numZonePar.value == 0:
            valuesVar = variablesPar.valueAsText
            weights, eqNam = self._getWeights(variablesPar, 1)
            values = []
            for id, value in enumerate(variablesPar.value):
                record = value
                values.append([record[0].value,  weights[id]])
            variablesPar.value = values
            return

        if numZonePar.value:
            if variablesPar.value:
                valuesVar = variablesPar.valueAsText
                weights, eqNam = self._getWeights(variablesPar, 1)
                values = []
                for id, value in enumerate(variablesPar.value):
                    record = value
                    values.append([record[0].value,  weights[id]])
                variablesPar.value = values
        elif variablesPar.value :
            valuesVar = variablesPar.valueAsText
            weights, eqNam = self._getWeights(variablesPar, 2)
            values = []

            for id, value in enumerate(variablesPar.value):
                record = value
                variableName = record[0].value
                valuef = record[1]

                if len(valuef) > 0:
                    if rep in valuef:
                        valuef = valuef.replace(rep, currentSep)
                    valuef = "" if valuef in ["#", None, ""] else valuef
                else:
                    value = ""
                values.append([variableName, valuef , weights[id]])

            if len(values):
                variablesPar.value = values

    def _isDuplicatedVar(self, valuesVar, checkInput = None):
        """ Get Weight from Value Table """

        nameInput = ""
        if checkInput is not None:
            try:
                info = ARCPY.Describe(checkInput)
                nameInput = info.catalogPath
            except:
                nameInput = ""


        n = len(valuesVar.split(";"))
        names = set()
        for value in valuesVar.split(";"):
            if checkInput is None:
                record = value.split(" ")
                names.add(record[0])
            else:
                try:
                    info = ARCPY.Describe(value)
                    names.add(info.catalogPath)
                    if info.catalogPath == nameInput:
                        return False
                except:
                    names.add(value)

        return  True if n == len(names) else False

    def _setList(self, zoneCharacteristics, newList ):
        currentValuesStr = zoneCharacteristics.valueAsText
        if currentValuesStr not in [None, "", "#"]:
            da =  currentValuesStr.split(";")
            values = []
            for val in da:
                if val in self.constPoly and val in newList:
                    values.append(val)
            zoneCharacteristics.filter.list = newList
            zoneCharacteristics.value = values
        else:
            zoneCharacteristics.filter.list = newList

    def updateParameters(self, parameters):
        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        """ Update Parameters"""
        inFeatures = parameters[0]
        outputFeatures = parameters[1]
        zoneCreationMethod = parameters[2]
        numberOfZones = parameters[3]
        zoneBuildingCriteriaTarget = parameters[4]
        zoneBuildingCriteria = parameters[5]
        spatialConstraints = parameters[6]
        weightsMatrixFile = parameters[7]
        zoneCharacteristics = parameters[8]
        attributeToConsider = parameters[9]
        distanceToConsider = parameters[10]
        categorialVariable = parameters[11]
        proportionMethod = parameters[12]
        populationSize = parameters[13]
        numberGenerations = parameters[14]
        mutationFactor =  parameters[15]
        outputConvergenceTable = parameters[16]

        if categorialVariable.value:
            proportionMethod.enabled = True
        else:
            proportionMethod.enabled = False
            proportionMethod.value = None

        if spatialConstraints.valueAsText != "GET_SPATIAL_WEIGHTS_FROM_FILE":
            weightsMatrixFile.value = None

        if zoneCreationMethod.value == "ATTRIBUTE_TARGET":
            numberOfZones.enabled = False
            numberOfZones.value = None
            zoneBuildingCriteriaTarget.enabled = True
            zoneBuildingCriteria.enabled = False
            zoneBuildingCriteria.value = None
            numberOfZones.value = None

            if zoneBuildingCriteriaTarget.value is not None:
                self._weights(numberOfZones, zoneBuildingCriteriaTarget)

        elif zoneCreationMethod.value == "NUMBER_ZONES_AND_ATTRIBUTE":
            numberOfZones.enabled = True
            zoneBuildingCriteria.enabled = True
            zoneBuildingCriteriaTarget.enabled = False
            zoneBuildingCriteriaTarget.value = None

            if zoneBuildingCriteria.value is not None:
                self._weights(numberOfZones, zoneBuildingCriteria, True)

        elif zoneCreationMethod.value == "NUMBER_OF_ZONES":
            numberOfZones.enabled = True
            zoneBuildingCriteria.enabled = False
            zoneBuildingCriteriaTarget.enabled = False
            zoneBuildingCriteria.value = None
            zoneBuildingCriteriaTarget.value = None

        desc = None
        shapeType = ""
        try:
            desc = ARCPY.Describe(inFeatures.value)
            shapeType = desc.shapeType.upper()
        except:
            desc = None

        if not spatialConstraints.altered: 
            if shapeType.upper() == "POLYGON":
                spatialConstraints.value = "CONTIGUITY_EDGES_CORNERS"
            if shapeType.upper() == "POINT":
                spatialConstraints.value = "TRIMMED_DELAUNAY_TRIANGULATION"


        if shapeType.upper() == "POINT":
            spatialConstraints.filter.list = self.pointSpaceTypes

            if zoneCreationMethod.value == "NUMBER_ZONES_AND_ATTRIBUTE":
                zoneCharacteristics.filter.list = self.constPoint

            if zoneCreationMethod.value == "NUMBER_OF_ZONES":
                self._setList(zoneCharacteristics, self.onlyCompact)
                #zoneCharacteristics.filter.list = self.onlyCompact

            if zoneCreationMethod.value == "ATTRIBUTE_TARGET":
                self._setList(zoneCharacteristics, self.constPoint)
                #zoneCharacteristics.filter.list  = self.constPoint

        if shapeType.upper() == "POLYGON":
            spatialConstraints.filter.list = self.allSpaceTypes

            if zoneCreationMethod.value == "NUMBER_ZONES_AND_ATTRIBUTE":
                zoneCharacteristics.filter.list = self.constPoly

            if zoneCreationMethod.value == "NUMBER_OF_ZONES":
                zoneCharacteristics.filter.list = self.constPolyArea

            if zoneCreationMethod.value == "ATTRIBUTE_TARGET":
                zoneCharacteristics.filter.list  = self.constPoly

        #### SWM File ####
        if spatialConstraints.value == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            weightsMatrixFile.enabled = True
        else:
            weightsMatrixFile.enabled = False

        #### Add "dbf" to Tables in Folders ####
        if outputConvergenceTable.value:
            outputConvergenceTable.value = returnTablePath(outputConvergenceTable)

        return

    def updateMessages(self, parameters):
        """ Update Messages """
        inFeatures = parameters[0]
        outputFeatures = parameters[1]
        zoneCreationMethod = parameters[2]
        numberOfZones = parameters[3]
        zoneBuildingCriteriaTarget = parameters[4]
        zoneBuildingCriteria = parameters[5]
        spatialConstraints = parameters[6]
        weightsMatrixFile = parameters[7]
        zoneCharacteristics = parameters[8]
        attributeToConsider = parameters[9]
        distanceToConsider = parameters[10]
        categorialVariable = parameters[11]
        proportionMethod = parameters[12]
        populationSize = parameters[13]
        numberGenerations = parameters[14]
        mutationFactor =  parameters[15]
        outputConvergenceTable = parameters[16]

        if numberOfZones.value is not None or numberOfZones.value == 0:
            if numberOfZones.value < 2:
                numberOfZones.setIDMessage("ERROR", 110267)

        if outputFeatures.value:
            newField = ARCPY.Field()
            newField.name = "ZONE_ID"
            newField.type = "LONG"
            outputFeatures.schema.additionalFields = [newField]

        if zoneCreationMethod.value == "ATTRIBUTE_TARGET":
            if zoneBuildingCriteriaTarget.value is None:
                zoneBuildingCriteriaTarget.setIDMessage("ERROR", 530)
            else:
                weights, eqNam = self._getWeights(zoneBuildingCriteriaTarget)

                if not eqNam:
                    zoneBuildingCriteriaTarget.setIDMessage("ERROR", 400)

                for id, value in enumerate(zoneBuildingCriteriaTarget.value):
                    record = value
                    variableName = record[0].value
                    value2 = record[1]
                    weight = record[2]

                    try:
                        value2 = UTILS.strToFloat(value2.strip())
                    except:
                        if value2 in [ "", "#" , None]:
                            zoneBuildingCriteriaTarget.setIDMessage("ERROR", 530)
                        else:
                            zoneBuildingCriteriaTarget.setIDMessage("ERROR", 891)
                        continue
                    #### Check Weight Value ####
                    check = True
                    try:
                        weight = UTILS.strToFloat(weight)
                    except:
                        if weight in [ "", "#" , None]:
                            zoneBuildingCriteriaTarget.setIDMessage("ERROR", 530)
                        else:
                            zoneBuildingCriteriaTarget.setIDMessage("ERROR", 891)
                        check = False

                    if check and weight <= 0 :
                        zoneBuildingCriteriaTarget.setIDMessage("ERROR", 531)

                    continue


        elif zoneCreationMethod.value == "NUMBER_ZONES_AND_ATTRIBUTE":
            if numberOfZones.value is None or zoneBuildingCriteria.value is None:
                if numberOfZones.value is None:
                    numberOfZones.setIDMessage("ERROR", 530)
                if zoneBuildingCriteria.value is None:
                     zoneBuildingCriteria.setIDMessage("ERROR", 530)

            elif numberOfZones.value is not None and zoneBuildingCriteria.value is not None:
                weights, eqNam = self._getWeights(zoneBuildingCriteria, 1)

                if not eqNam:
                    zoneBuildingCriteria.setIDMessage("ERROR", 400)

                for id, value in enumerate(zoneBuildingCriteria.value):
                    variableName = value[0].value
                    weight = value[1]

                    check = True
                    try:
                        weight = UTILS.strToFloat(weight)
                    except:
                        if weight in [ "", "#" , None]:
                            zoneBuildingCriteria.setIDMessage("ERROR", 530)
                        else:
                            zoneBuildingCriteria.setIDMessage("ERROR", 891)
                        check = False

                    if check and weight <= 0 :
                        zoneBuildingCriteria.setIDMessage("ERROR", 531)

                    continue


        elif zoneCreationMethod.value == "NUMBER_OF_ZONES":
            if numberOfZones.value is None:
                numberOfZones.setIDMessage("ERROR", 530)

        if attributeToConsider.value:
            if not self._isDuplicatedVar(attributeToConsider.valueAsText):
                attributeToConsider.setIDMessage("ERROR", 400)

        if distanceToConsider.value:
            value = None
            if inFeatures.value:
                value = inFeatures.valueAsText

            if not self._isDuplicatedVar(distanceToConsider.valueAsText, value):
                distanceToConsider.setIDMessage("ERROR", 400)

        if categorialVariable.value:
            if proportionMethod.value is None:
                proportionMethod.setIDMessage("ERROR", 530)

        if outputFeatures.value and  outputConvergenceTable.value:
            if outputFeatures.valueAsText.upper() == outputConvergenceTable.valueAsText.upper():
                outPath, outName = OS.path.split(outputFeatures.valueAsText)
                outputConvergenceTable.setIDMessage("ERROR", 110275, outName)

        if spatialConstraints.value:
           if spatialConstraints.valueAsText == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            if weightsMatrixFile.value is None:
                weightsMatrixFile.setIDMessage("ERROR", 530)

        return

    def execute(self, parameters, messages):
        #### User Defined Inputs ####

        inFeatures = parameters[0].valueAsText
        outputFeatures = parameters[1].valueAsText
        zoneCreationMethod = parameters[2].valueAsText
        numberOfZones = UTILS.getNumericParameter(3, parameters)
        zoneBuildingCriteriaTarget = parameters[4].value
        zoneBuildingCriteria = parameters[5].valueAsText
        spatialConstraints = parameters[6].valueAsText
        weightsMatrixFile = parameters[7].valueAsText
        zoneCharacteristics = parameters[8].valueAsText
        attributeToConsider = parameters[9].valueAsText
        distanceToConsider = parameters[10].valueAsText
        categorialVariable = parameters[11].valueAsText
        proportionMethod = parameters[12].value
        populationSize = UTILS.getNumericParameter(13, parameters)
        numberGenerations =  UTILS.getNumericParameter(14, parameters)
        mutationFactor =  UTILS.getNumericParameter(15, parameters)
        outputConvergenceTable = parameters[16]

        fieldConstraints = None
        if zoneCreationMethod == "ATTRIBUTE_TARGET":
            numRegions = None
            fieldConstraints = zoneBuildingCriteriaTarget
        else:
            fieldConstraints = zoneBuildingCriteria
            numRegions = numberOfZones

        if numRegions in [None, ""]:
            numRegions = None

        if outputConvergenceTable.value is not None:
            UTILS.checkOutputPath(outputConvergenceTable.valueAsText, "TABLE")

        constraints = None
        costValues = None
        if fieldConstraints is not None:
            if type(fieldConstraints) == list:
                try:
                    constraints = []
                    for i in fieldConstraints:
                        constraints.append("{0} {1} {2}".format(str(i[0].value),i[1].strip(),i[2] ))
                except:
                    constraints = parameters[4].valueAsText.split(";")
            else:
                constraints = fieldConstraints.split(";")

            constraintsClean = []
            weights = []
            varNames = []
            for e in constraints:
                elems = e.split(" ")

                if len(elems) == 3:
                    strItem = ""
                    varNames.append(elems[0])
                    strItem = "{0} >= {1}".format(elems[0],UTILS.strToFloat(elems[1].strip()))
                    constraintsClean.append(strItem)
                    weights.append(UTILS.strToFloat(elems[2]))
                else:
                    strItem = ""
                    varNames.append(elems[0])
                    strItem = "{0} >= {1}".format(elems[0],-1)
                    constraintsClean.append(strItem)
                    weights.append(UTILS.strToFloat(elems[1]))

            constraints = constraintsClean
            costValuesNum = SSDO.NUM.array(weights, dtype = float)
            total = costValuesNum.sum()
            costValuesReCal = costValuesNum / total
            #### Create Dictionary with Name Field - Calculated Weight ####
            costValues = {w.upper():costValuesReCal[id] for id, w in enumerate(varNames)}


        import SSOptimal as OPT
        import numpy as NUM
        ssdo = SSDO.SSDataObject(inFeatures)

        globalGen = OPT.GlobalGeneratorBase(ssdo, constraints,
                                        sizePopulation = populationSize,
                                        mutationFactor = mutationFactor,
                                        outputFC = outputFeatures,
                                        parameterOutput = parameters[1],
                                        otherConstraints = zoneCharacteristics,
                                        spatialConcept = spatialConstraints,
                                        weightsFile = weightsMatrixFile,
                                        costValues = costValues,
                                        applyFunction = attributeToConsider,
                                        proportionField = categorialVariable,
                                        conserveProportion = proportionMethod == 'MAINTAIN_WITHIN_PROPORTION',
                                        numRegions = numRegions,
                                        numGenerations = numberGenerations,
                                        distanceFeatures = distanceToConsider)
        info = globalGen.getSolution()

        if info is None:
            return

        fitness, maxFitness = info
        
        if outputConvergenceTable.value is not None and fitness is None and maxFitness is None:
            ARCPY.AddIDMessage("WARNING", 110557, outputConvergenceTable.valueAsText )
            return

        outputFitTable = None
        generationData = None

        if outputConvergenceTable.value:
            outputFitTable = outputConvergenceTable.valueAsText
            generationData = NUM.arange(globalGen.numGenerations+1, dtype = NUM.int32)


        if outputFitTable is not None:
            cont = UTILS.DataContainer()
            fieldGeneration = SSDO.CandidateField(name= "GENERATION",
                                                  alias = ARCPY.GetIDMessage(84917),
                                                  type = "LONG",
                                                  data = generationData)
            yFields = [f.name for f in fitness]
            fitness.append(fieldGeneration)

            cont.generateOutput(outputFitTable, fitness)

            chart = ARCPY.Chart(ARCPY.GetIDMessage(84916))
            chart.type = "line"
            chart.title = ARCPY.GetIDMessage(84916)

            #### Assign Y Axis Field ####
            chart.yAxis.field = yFields
            chart.yAxis.title = ARCPY.GetIDMessage(84918)

            #### Assign X Axis Field ####
            chart.xAxis.field = "GENERATION"
            chart.xAxis.title = ARCPY.GetIDMessage(84917)
            chart.legend.visible = True
            chart.xAxis.minimum = 0
            chart.xAxis.maximum = numberGenerations
            chart.yAxis.minimum = 0
            chart.yAxis.maximum = maxFitness

            outputConvergenceTable.charts = [chart]

class ColocationAnalysis(object):
    def __init__(self):
        self.label = "Colocation Analysis"
        self.decription  = "Calculate local Colocation Quotient Wang et al 2016"
        self.category = "Modeling Spatial Relationships"
        self.canRunInBackground = False
        self.helpContext = 9060010
        self.ssdoTarget = None
        self.ssdoSource = None
        self.listTarget = []
        self.listSource = []
        #### Set Parameter Defaults ####
        
        self.defaultIndexList = [0, 10, 11, 14, 16, 17]
        self.defaultValueList = ["SINGLE_DATASET", 'K_NEAREST_NEIGHBORS', 8, 
                                 'BEFORE', 99, 'GAUSSIAN']

    def getParameterInfo(self):
        """Define parameter definitions"""
        #### Local Imports ####
        import os as OS
        import sys as SYS

        templateDir = OS.path.join(OS.path.dirname(SYS.path[0]), "Templates", "Layers")
        fullRLF = OS.path.join(templateDir, "LocalColocationQuotient.lyrx")

        param0 = ARCPY.Parameter(displayName="Input Type",
                            name = "input_type",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ["SINGLE_DATASET","DATASETS_WITHOUT_CATEGORIES", "TWO_DATASETS"]
        param0.value = "SINGLE_DATASET"
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Input Features of Interest",
                                 name="in_features_of_interest",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.list = ["Point"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output",
                                 symbology= fullRLF)
        param2.displayOrder = 16

        param3 = ARCPY.Parameter(displayName="Field of Interest",
                            name="field_of_interest",
                            datatype="Field",
                            parameterType="Optional",
                            direction="Input")
        param3.filter.list = ["Short", "Long", "String", "Text", "BigInteger"]
        param3.parameterDependencies = [param1.name]
        param3.displayOrder = 2
        param3.enabled = True

        param4 = ARCPY.Parameter(displayName="Time Field of Interest", #####Neww
                            name="time_field_of_interest",
                            datatype="Field",
                            parameterType="Optional",
                            direction="Input")
        param4.filter.list = ["Date"]
        param4.parameterDependencies = [param1.name]
        param4.displayOrder = 3
        param4.enabled = True


        param5 = ARCPY.Parameter(displayName="Category of Interest",
                            name="category_of_interest",
                            datatype="GPString",
                            parameterType="Optional",
                            direction="Input")
        param5.displayOrder = 4
        param5.enabled = True

        param6 = ARCPY.Parameter(displayName="Input Neighboring Features",
                                 name="input_feature_for_comparison",
                                 datatype="GPFeatureLayer",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.list = ["Point"]
        param6.displayOrder = 5
        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Field Containing Neighboring Category",
                            name="field_for_comparison",
                            datatype="Field",
                            parameterType="Optional",
                            direction="Input")
        param7.filter.list =  ["Short", "Long", "String", "Text", "BigInteger"]
        param7.parameterDependencies = [param6.name]
        param7.displayOrder = 6
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Time Field of Neighboring Features",            ###New
                            name="time_field_for_comparison",
                            datatype="Field",
                            parameterType="Optional",
                            direction="Input")
        param8.filter.list =  ["Date"]
        param8.parameterDependencies = [param6.name]
        param8.displayOrder = 7
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="Neighboring Category",
                    name="category_for_comparison",
                    datatype="GPString",
                    parameterType="Optional",
                    direction="Input")
        param9.displayOrder = 8
        param9.enabled = True

        param10 = ARCPY.Parameter(displayName="Neighborhood Type",
                            name = "neighborhood_type",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param10.filter.type = "ValueList"
        param10.filter.list = ['K_NEAREST_NEIGHBORS',
                              'DISTANCE_BAND',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE'
                              ]

        param10.value = 'K_NEAREST_NEIGHBORS'
        param10.displayOrder = 9

        param11 = ARCPY.Parameter(displayName = "Number of Neighbors",
                                 name = "number_of_neighbors",
                                 datatype = "GPLong",
                                 parameterType = "Optional",
                                 direction = "Input")
        param11.filter.type = "Range"
        param11.filter.list = [1, 1000]
        param11.enabled = True
        param11.displayOrder = 10
        param11.value = 8

        param12 = ARCPY.Parameter(displayName="Distance Band",
                            name = "distance_band",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")

        param12.filter.list = supportDist
        param12.enabled = False
        param12.displayOrder = 11

        param13 = ARCPY.Parameter(displayName="Weight Matrix File",
                            name = "weights_matrix_file",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Input")
        param13.filter.list = ['swm', 'gwt']
        param13.enabled = False
        param13.displayOrder = 12

        param14 = ARCPY.Parameter(displayName="Temporal Relationship Type",  #Newwwww
                            name = "temporal_relationship_type",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param14.filter.type = "ValueList"
        param14.filter.list = ['BEFORE',
                              'AFTER',
                              'SPAN']
        param14.value = 'BEFORE'
        param14.displayOrder = 13

        param15 = ARCPY.Parameter(displayName="Time Step Interval",             #Newww
                                 name="time_step_interval",
                                 datatype="GPTimeUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param15.filter.list = ["Seconds", "Minutes", "Hours", "Days", "Weeks", "Months", "Years"]
        param15.displayOrder = 14

        param16 = ARCPY.Parameter(displayName="Number of Permutations",
                                 name="number_of_permutations",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param16.filter.type = "Value List"
        param16.filter.list = [99, 199, 499, 999, 9999]
        param16.value = 99
        param16.displayOrder = 15

        param17 = ARCPY.Parameter(displayName="Local Weighting Scheme",  #Newwwww
                            name = "local_weighting_scheme",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param17.filter.type = "ValueList"
        param17.filter.list = ['BISQUARE',
                              'GAUSSIAN',
                              'NONE']
        param17.value = 'GAUSSIAN'
        param17.category = "Additional Options"
        param17.displayOrder = 17

        param18 = ARCPY.Parameter(displayName="Output Table for Global Relationships",
                                 name="output_table",
                                 datatype="DETable",
                                 parameterType="Optional",
                                 direction="Output")
        param18.category = "Additional Options"
        param18.displayOrder = 18

        params = [param0,  param1,  param2,  param3,
                  param4,  param5,  param6,  param7,
                  param8,  param9,  param10, param11,
                  param12, param13, param14, param15,
                  param16, param17, param18]

        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        unique_values = ['None']

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        inputType = parameters[0]
        inputFC1 = parameters[1]
        outputFC = parameters[2]
        fieldInterest = parameters[3]
        timeFieldInterest = parameters[4]
        catInterest = parameters[5]
        inputFC2 = parameters[6]
        fieldComparison = parameters[7]
        timeFieldComparison = parameters[8]
        catComparison = parameters[9]
        neighborType = parameters[10]
        numberOfNeighbors = parameters[11]
        distanceBand = parameters[12]
        swmFile = parameters[13]
        temporalRelationType = parameters[14]
        timeInterval = parameters[15]
        numPermutations = parameters[16]
        outputTable = parameters[18]
        kernelType =  parameters[17]


        if neighborType.value is None:
            neighborType.value = 'K_NEAREST_NEIGHBORS'

        if inputType.value == "SINGLE_DATASET":
            enableParametersBy(parameters, [1,3,4,5,9], [6,7,8])

            if timeFieldInterest.value:
                temporalRelationType.enabled = True
                timeInterval.enabled = True
            else:
                temporalRelationType.enabled = False
                timeInterval.enabled = False

        if inputType.value == "TWO_DATASETS":
            enableParametersBy(parameters, [1,3,4,5,6,7,8,9], [])

        if inputType.value == "DATASETS_WITHOUT_CATEGORIES":
            enableParametersBy(parameters, [1,6,4,8], [3,5,7,9])

        if inputType.value in ["TWO_DATASETS", "DATASETS_WITHOUT_CATEGORIES"]:

            if timeFieldInterest.value and timeFieldComparison.value:
                temporalRelationType.enabled = True
                timeInterval.enabled = True
            else:
                temporalRelationType.enabled = False
                timeInterval.enabled = False

        if inputType.value == "SINGLE_DATASET":
            inputFC2.value = None

        if inputType.value in [ "SINGLE_DATASET", "TWO_DATASETS"]:
            if inputFC1.value:
                if fieldInterest.value:
                    try:
                        if self.ssdoTarget is None or self.ssdoTarget.inputFC != inputFC1.valueAsText:
                            self.ssdoTarget = UTILS.BasicReader(inputFC1.value)

                        self.ssdoTarget.obtainData(fieldName = fieldInterest.value.value)
                        unique = UTILS.NUM.unique(self.ssdoTarget.data[fieldInterest.value.value.upper()])
                        uniqueValues =  [str(i) for i in unique if str(i) != '']
                        catInterest.filter.list = uniqueValues
                        catComparison.filter.list = uniqueValues

                        if len(uniqueValues) == 0:
                            catInterest.value = None
                            if inputFC2.value is None:
                                catComparison.value = None
                            
                        if catInterest.value is not None and catInterest.value not in uniqueValues:
                            catInterest.value = None
                            
                        if catComparison.value is not None and \
                          catComparison.value not in uniqueValues and \
                          inputFC2.value is None:
                            catComparison.value = None
                    except:
                        catInterest.filter.list = []
                        catComparison.filter.list = []

        if inputType.value == "TWO_DATASETS":
            catComparison.filter.list = []

            if inputFC2.value and fieldComparison.value:
                try:
                    if self.ssdoSource is None or self.ssdoSource.inputFC != inputFC2.valueAsText:
                        self.ssdoSource = UTILS.BasicReader(inputFC2.value)
                    self.ssdoSource.obtainData(fieldName = fieldComparison.value.value)
                    unique = UTILS.NUM.unique(self.ssdoSource.data[fieldComparison.value.value.upper()])
                    uniqueValues =  [str(i) for i in unique if str(i) != '']
                    catComparison.filter.list = uniqueValues
                    
                    if len(uniqueValues) == 0:
                        catComparison.value = None
                        
                    if catComparison.value is not None and catComparison.value not in uniqueValues:
                        catComparison.value = None
                except:
                    catComparison.filter.list = []
            else:
                catComparison.filter.list = []
                catComparison.value = None

        if inputType.value == "DATASETS_WITHOUT_CATEGORIES":
            fieldInterest.value = None
            catInterest.value = None
            fieldComparison.value = None
            catInterest.filter.list = []
            catComparison.filter.list = []
            catComparison.value = None


        if timeFieldInterest.value:
            neighborType.filter.list = ['DISTANCE_BAND']
            neighborType.value = 'DISTANCE_BAND'
        else:
            if inputType.value ==  "SINGLE_DATASET" :
                neighborType.filter.list = ['K_NEAREST_NEIGHBORS', 'DISTANCE_BAND','GET_SPATIAL_WEIGHTS_FROM_FILE']
            else:
                neighborType.filter.list = ['K_NEAREST_NEIGHBORS', 'DISTANCE_BAND' ]


        if neighborType.valueAsText == "K_NEAREST_NEIGHBORS":
            numberOfNeighbors.enabled = True
            distanceBand.enabled = False
            distanceBand.value = None
            swmFile.enabled = False
            swmFile.value = None

        if neighborType.valueAsText == "DISTANCE_BAND":
            distanceBand.enabled = True
            numberOfNeighbors.enabled = False
            numberOfNeighbors.value = None
            swmFile.enabled = False
            swmFile.value = None

        if neighborType.valueAsText == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            numberOfNeighbors.enabled = False
            distanceBand.enabled = False
            numberOfNeighbors.value = None
            distanceBand.value = None
            swmFile.enabled = True

        if neighborType.valueAsText == "KNN_THRESHOLD":
            numberOfNeighbors.enabled = True
            distanceBand.enabled = True
            swmFile.enabled = False
            swmFile.value = None

        tableCheck(outputTable, True)

    def updateMessages(self, parameters):

        inputType = parameters[0]
        inputFC1 = parameters[1]
        outputFC = parameters[2]
        fieldInterest = parameters[3]
        timeFieldInterest = parameters[4]
        catInterest = parameters[5]
        inputFC2 = parameters[6]
        fieldComparison = parameters[7]
        timeFieldComparison = parameters[8]
        catComparison = parameters[9]
        neighborType = parameters[10]
        numberOfNeighbors = parameters[11]
        distanceBand = parameters[12]
        swmFile = parameters[13]
        temporalRelationType = parameters[14]
        timeInterval = parameters[15]
        numPermutations = parameters[16]
        outputTable = parameters[18]
        kernelType =  parameters[17]

        if inputType.value in ["TWO_DATASETS", "DATASETS_WITHOUT_CATEGORIES"]:

            if timeFieldInterest.value:
                if not timeFieldComparison.value:
                    timeFieldComparison.setIDMessage("ERROR", 530)
            if timeFieldComparison.value:
                if not timeFieldInterest.value:
                    timeFieldInterest.setIDMessage("ERROR", 530)

        if timeFieldInterest.value:
            if not timeInterval.value:
                timeInterval.setIDMessage("ERROR", 530)

        if inputType.value == "SINGLE_DATASET":
            if not fieldInterest.value:
                fieldInterest.setIDMessage("ERROR", 530)
            else:
                if not catInterest.value:
                    catInterest.setIDMessage("ERROR", 530)
                if not catComparison.value:
                    catComparison.setIDMessage("ERROR", 530)

        if inputType.value == "TWO_DATASETS":
            if fieldInterest.value:
                if not catInterest.value:
                    catInterest.setIDMessage("ERROR", 530)

            if not inputFC2.value:
                inputFC2.setIDMessage("ERROR", 530)
            else:
                if fieldComparison.value:
                    if not catComparison.value:
                        catComparison.setIDMessage("ERROR", 530)

        if inputType.value == "DATASETS_WITHOUT_CATEGORIES":
            if not inputFC2.value:
                inputFC2.setIDMessage("ERROR", 530)


        if distanceBand.value:
            bandSizeUnit = distanceBand.value.value
            try:
                bandSizeParts = bandSizeUnit.split()
                bandSize = UTILS.strToFloat(bandSizeParts[0])

                if bandSize <= 0:
                    distanceBand.setIDMessage("ERROR", 531)
            except:
                pass

        if neighborType.valueAsText == "KNN_THRESHOLD":
            if not numberOfNeighbors.value:
                numberOfNeighbors.setIDMessage("ERROR", 530)
            if not distanceBand.value:
                distanceBand.setIDMessage("ERROR", 530)

        if neighborType.valueAsText == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            if not swmFile.value:
                swmFile.setIDMessage("ERROR", 530)

        if outputFC.value and  outputTable.value:
            if outputFC.valueAsText.upper() == outputTable.valueAsText.upper():
                outPath, outName = OS.path.split(outputFC.valueAsText)
                outputTable.setIDMessage("ERROR", 110275, outName)
        pass


    def execute(self, parameters, messages):
        import SSColocation as SSC
        SSC.execute(parameters, messages)

class DimensionReduction(object):
    def __init__(self):
        self.label = "Dimension Reduction"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        self.helpContext = 9050011

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Table",
                            name = "in_table",
                            datatype = "GPTableView",
                            parameterType = "Required",
                            direction = "Input")
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Data",
                            name = "output_data",
                            datatype = ['DEFeatureClass','DETable'],
                            parameterType = "Optional",
                            direction = "Output")
        param1.displayOrder = 2

        param2 = ARCPY.Parameter(displayName="Analysis Fields",
                            name = "fields",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input",
                            multiValue = True)
        param2.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param2.filter.list = ['Short','Long','Float','Double','BigInteger']
        param2.parameterDependencies = [param0.name]
        param2.displayOrder = 3

        param3 = ARCPY.Parameter(displayName="Dimension Reduction Method",
                            name = "method",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")

        param3.filter.type = "ValueList"
        param3.filter.list = ['PCA', 'LDA']
        param3.value = "PCA"
        param3.displayOrder = 5

        param4 = ARCPY.Parameter(displayName="Scale Data",
                            name = "scale",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = ['SCALE_DATA','NO_SCALE_DATA']
        param4.value = True
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Categorical Field",
                            name = "categorical_field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")

        param5.filter.list = ['Text', 'Short', 'Long', 'BigInteger']
        param5.parameterDependencies = [param0.name]
        param5.displayOrder = 6

        param6 = ARCPY.Parameter(displayName="Minimum Percent Variance to Maintain",
                            name = "min_variance",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input") 
        param6.filter.type = "Range"
        param6.filter.list = [1, 100]
        param6.displayOrder = 7

        param7 = ARCPY.Parameter(displayName="Minumum Number of Components",
                            name = "min_components",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input") 
        param7.filter.type = "Range"
        param7.filter.list = [1, 65534]
        param7.displayOrder = 8

        param8 = ARCPY.Parameter(displayName="Append All Fields from Input Data",
                            name = "append_fields",
                            datatype = "GPBoolean",
                            parameterType = "Optional",
                            direction = "Input")

        param8.category = "Additional Options"
        param8.filter.list = ['APPEND','NO_APPEND']
        param8.value = False
        param8.displayOrder = 9

        param9 = ARCPY.Parameter(displayName="Output Eigenvalues Table",
                            name = "output_eigenvalues_table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")
        param9.category = "Additional Options"
        param9.displayOrder = 10

        param10 = ARCPY.Parameter(displayName="Output Eigenvectors Table",
                            name = "output_eigenvectors_table",
                            datatype = "DETable",
                            parameterType = "Optional",
                            direction = "Output")
        param10.category = "Additional Options"
        param10.displayOrder = 11

        param11 = ARCPY.Parameter(displayName="Number of Permutations test",
                            name = "number_of_permutations",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param11.filter.list = [0, 99, 199, 499, 999]
        param11.value = 0
        param11.category = "Additional Options"
        param11.displayOrder = 12

        param12 = ARCPY.Parameter(displayName="Append Fields to Input Data",
                                  name="append_to_input",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")

        #param12.category = "Additional Options"
        param12.filter.list = ['APPEND_TO_INPUT','NEW_OUTPUT']
        param12.value = False

        param12.displayOrder = 1
        param1.parameterDependencies = [param12.name]

        param13 = ARCPY.Parameter(displayName="Updated Table",
                            name="updated_table",
                            datatype="GPTableView",
                            parameterType="Derived",
                            direction="Output")

        return [param0, param1, param2,
                param3, param4, param5,
                param6, param7, param8, 
                param9, param10, param11,
                param12, param13]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        parameters[11].enabled = True
        if parameters[3].value not in ["PCA", "LDA"]:
            parameters[3].value = "PCA"

        if parameters[3].value:
            if parameters[3].valueAsText == "LDA":
                parameters[5].enabled = True
                parameters[11].enabled = False
                parameters[11].value = 0
                parameters[4].enabled = False
            else:
                parameters[5].enabled = False
                parameters[4].enabled = True
                parameters[11].enabled = True

        if parameters[11].value is None:
            parameters[11].value = 0

        table1 = parameters[9]
        table2 = parameters[10]
        tableCheck(table1, True)
        tableCheck(table2, True)

        #### Check extension ####
        if parameters[1].value is None and parameters[0].value is not None and not parameters[12].value :
            desc = ARCPY.Describe(parameters[0].value)
            name = desc.nameString if hasattr(desc, "nameString") else desc.name
            isGroup = False
            path = parameters[0].valueAsText.upper()
            if "\\" in name:
                name = name.split("\\")[-1]
                isGroup = True

            inPath, inName = OS.path.split(parameters[0].valueAsText)
            # To fix the python stand alone error
            if inPath == '' or isGroup:
                current = ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase
            else:
                current = inPath

            name = ARCPY.ValidateTableName(name)
            parameters[1].value = UTILS.checkForDuplicateOutput(name + "_DimensionReduction", current, 0)

        if parameters[1].value is not None and parameters[0].value is not None and not parameters[12].value :
            try:
                desc = ARCPY.Describe(parameters[0].value)
                if parameters[3].value == "PCA":
                    fields = parameters[2].valueAsText.split(";")
                    fieldsInfo = {f.name.upper():f for f in desc.fields}
                    if len(fields) > 0:
                        lstFlds = []
                        if parameters[8].value:
                            for fldName in fields:
                                fld = ARCPY.Field()
                                fld.name = fldName
                                fld.type = fieldsInfo[fldName.upper()].type.upper() 
                                fld.aliasName = fieldsInfo[fldName.upper()].aliasName
                                lstFlds.append(fld)
        
                        if parameters[7].value in ['', None, 0]:
                            fld = ARCPY.Field()
                            fld.name = "PCA1"
                            fld.type = "DOUBLE"
                            fld.aliasName = "Component 1"
                            lstFlds.append(fld)
                        else:
                            for n in range(parameters[7].value):
                                fld = ARCPY.Field()
                                fld.name = "PCA{0}".format(n+1)
                                fld.type = "DOUBLE"
                                fld.aliasName = "Component {0}".format(n+1)
                                lstFlds.append(fld)

                        parameters[1].schema.additionalFields = lstFlds

                if parameters[3].value == "LDA" :
                    fields = parameters[2].valueAsText.split(";")
                    fieldsInfo = {f.name.upper():f for f in desc.fields}
                    if len(fields) > 1:
                        lstFlds = []
                        if parameters[8].value:
                            for fldName in fields:
                                fld = ARCPY.Field()
                                fld.name = fldName
                                fld.type = fieldsInfo[fldName.upper()].type.upper() 
                                fld.aliasName = fieldsInfo[fldName.upper()].aliasName
                                lstFlds.append(fld)

                        if parameters[5].value:
                            fld = ARCPY.Field()
                            fld.name = parameters[5].valueAsText
                            fld.type = fieldsInfo[parameters[5].valueAsText.upper()].type.upper()
                            fld.aliasName = fieldsInfo[parameters[5].valueAsText.upper()].aliasName

                        if parameters[7].value in ['', None, 0]:
                            fld = ARCPY.Field()
                            fld.name = "LDA1"
                            fld.type = "DOUBLE"
                            fld.aliasName = "Component 1"
                            lstFlds.append(fld)
                        else:
                            for n in range(parameters[7].value):
                                fld = ARCPY.Field()
                                fld.name = "LDA{0}".format(n+1)
                                fld.type = "DOUBLE"
                                fld.aliasName = "Component {0}".format(n+1)
                                lstFlds.append(fld)

                        parameters[1].schema.additionalFields = lstFlds
            except Exception as e:
                pass

        parameters[1].enabled = True
        if parameters[12].value:
            #### Append to Input ####
            parameters[1].enabled = False
            parameters[1].value = None
            setOptionalAppendDerivedParam(parameters[0], parameters[13])
            parameters[8].enabled = False
        else:
            #### Output Table ####
            parameters[1].enabled = True
            parameters[13].enabled = False
            parameters[13].value = None
            parameters[8].enabled = True

        return

    def updateMessages(self, parameters):

        UTILS.avoidRepeatedOutputInParameters(parameters, [1,9,10])

        if isCSV(parameters[0].value):
            parameters[0].setIDMessage("Error", 732, parameters[0].valueAsText)
        else:
            if isReadOnly(parameters[0].value) and parameters[12].value:
                parameters[0].setIDMessage("Error", 381, parameters[0].valueAsText)

        if parameters[2].value:
            nFields  = len(parameters[2].values)
            if nFields < 2:
                parameters[2].setIDMessage("ERROR", 556, "number of fields")
            if parameters[7].value:
                if parameters[7].value > nFields:
                    parameters[7].setIDMessage("ERROR",110361)

        if parameters[3].value and parameters[3].valueAsText == "LDA":
            if parameters[5].value is None:
                parameters[5].setIDMessage("ERROR", 530)
            else:
                if parameters[2].value:
                    analysisFields = parameters[2].valueAsText
                    analysisFields = analysisFields.split(";")
                    if parameters[5].valueAsText in analysisFields:
                        parameters[5].setIDMessage("ERROR", 359)

        if parameters[7].value is not None:
            if parameters[7].value <= 0:
                parameters[7].setIDMessage("ERROR", 531)

        return

    def execute(self, parameters, messages):
        import SSDataReduction as SSR
        SSR.execute(parameters, messages)

class SpatialOutlierDetection(object):
    def __init__(self):
        self.label = "Spatial Outlier Detection"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9030012
        self.params = None

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                            name = "in_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['Point']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Number of Neighbors",
                            name = "n_neighbors",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param2.value = 1
        param2.displayOrder = 4

        param3 = ARCPY.Parameter(displayName="Percent of Locations Considered Outlier",
                            name = "percent_outlier",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param3.filter.type = "Range"
        param3.filter.list = [0.00001,50]
        param3.displayOrder = 6

        param4 = ARCPY.Parameter(displayName="Output Prediction Raster",
                            name = "output_raster",
                            datatype = "DERasterDataset",
                            parameterType = "Optional",
                            direction = "Output")
        param4.displayOrder = 7

        param5 = ARCPY.Parameter(displayName="Outlier Type",
                            name = "outlier_type",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["GLOBAL", "LOCAL"]
        param5.value = "GLOBAL"
        param5.displayOrder = 3

        param6 = ARCPY.Parameter(displayName="Detection Sensitivity",
                            name = "sensitivity",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ["LOW", "MEDIUM", "HIGH"]
        param6.value = "MEDIUM"
        param6.displayOrder = 5

        param7 = ARCPY.Parameter(displayName="Keep Only Spatial Outliers",
                                 name="keep_type",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = ['KEEP_OUTLIER', 'KEEP_ALL']
        param7.value = False
        param7.displayOrder = 2

        return [param0,param1,param2,param3,param4, param5, param6, param7]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        parameters[4].enabled = True
        try:
            desc  = ARCPY.Describe(parameters[0].value)
            if desc.hasz:
                parameters[4].enabled = False
                parameters[4].value = None
            else:
                parameters[4].enabled = True
        except:
            pass

        if parameters[4].enabled  and parameters[4].value:
            parameters[4].value = returnRasterPath(parameters[4])

        if parameters[5].value is None:
            parameters[5].value = "GLOBAL"

        #### Append Output Field to Output Feature Class's Schema ####
        fieldNames = ["SOURCE_ID", "OUTLIER_ID", "LOF"]
        fieldTypes = ["LONG", "LONG", "DOUBLE"]

        if parameters[5].value is None:
            parameters[5].value = "GLOBAL"

        if parameters[5].value == "GLOBAL":
            parameters[3].enabled = False
            parameters[6].enabled = True
            fieldNames = ["SOURCE_ID", "OUTLIER_ID", "Z_SCORE"]
            fieldTypes = ["LONG", "LONG", "DOUBLE"]

            if parameters[6].value is None:
                parameters[6].value = "MEDIUM"
        else:
            parameters[3].enabled = True
            parameters[6].enabled = False

        if not parameters[2].altered and parameters[5].value == "LOCAL":
            if parameters[2].value == 1:
                parameters[2].value = None

        addFields = []
        for fieldInd, fieldName in enumerate(fieldNames):
            fieldType = fieldTypes[fieldInd]
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldType
            addFields.append(newField)

        parameters[1].schema.additionalFields = addFields

    def updateMessages(self, parameters):
        if parameters[1].value and parameters[4].value:
            if parameters[1].valueAsText == parameters[4].valueAsText:
                parameters[4].setIDMessage("ERROR", 432, parameters[4].valueAsText)
                
        if parameters[5].value == "GLOBAL":
            if parameters[2].value is None:
                parameters[2].setIDMessage("ERROR", 530)
            else:
                if parameters[2].value < 1:
                    parameters[2].setIDMessage("ERROR", 1219, 1)

        if parameters[5].value == "LOCAL":
            if parameters[2].value is not None:
                if parameters[2].value < 2:
                    parameters[2].setIDMessage("ERROR", 1219, 2)

        return

    def execute(self, parameters, messages):
        import SSCluster as SC

        inputFC = UTILS.getTextParameter(0, parameters)
        outputFC = UTILS.getTextParameter(1, parameters)
        numNeighbors = parameters[2].value
        percent = parameters[3].value
        outputRaster = UTILS.getTextParameter(4, parameters)
        outlierType = UTILS.getTextParameter(5, parameters)
        sensitivity = parameters[6].value
        keepJustOutlier = parameters[7].value
        UTILS.checkOutputPath(outputFC, "FC")
        if outputRaster is not None:
            UTILS.checkOutputPath(outputRaster, "RASTER")

        if numNeighbors in [None, "", "#"]:
            numNeighbors = None

        layer = None

        if outlierType is ["", "#", None]:
            outlierType = "GLOBAL"
        

        if percent in [ "", "#", None]:
            percent = None

        if sensitivity in [ "", "#", None]:
            sensitivity = "MEDIUM"

        #### Apply exec new field type checker ####
        check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC)

        threads  =  UTILS.getNumberOfThreadsDefault()
        #### Main Object ####
        instanceLOF = SC.Outlier(inputFC, outputFC, numNeighbors, percent, 
                                 parallel = threads,
                                 outlierType = outlierType,
                                 sensitivity = sensitivity,
                                 keepJustOutlier = keepJustOutlier
                                 )

        #### Execute Main Function ####
        instanceLOF.run()

        #### Generate Output ####
        instanceLOF.output()

        if not keepJustOutlier:
            title = ARCPY.GetIDMessage(220108)
            xField = "LOF"
            msg = ARCPY.GetIDMessage(220110)
            xTitle = msg.format(instanceLOF.minPoints)
            lineMsg = ARCPY.GetIDMessage(220111)
            
            if outlierType == "GLOBAL":
                title = ARCPY.GetIDMessage(220242)
                xField = "NTHDIST"
                xTitle = ARCPY.GetIDMessage(220243).format(instanceLOF.minPoints)
                lineMsg = ARCPY.GetIDMessage(220244)
            
            histChart = ARCPY.Chart(title)
            histChart.type = 'histogram'
            histChart.title = title
            histChart.xAxis.field = xField
            histChart.yAxis.title = ARCPY.GetIDMessage(84785)
            histChart.xAxis.title = xTitle
            histChart.histogram.showComparisonDistribution = True
            histChart.histogram.showMean = True

            if instanceLOF.useThresholdInChart:
                histChart.xAxis.guides.new(lineMsg , instanceLOF.threshold, None, lineMsg)

            paramOutput = parameters[1]
            #### Bar Chart ####
            bChart = ARCPY.Chart(ARCPY.GetIDMessage(220109))
            bChart.type = "bar"
            bChart.title = ARCPY.GetIDMessage(220109)

            #### Assign X Axis Field ####
            bChart.xAxis.field = "OUTLIER_ID"
            bChart.xAxis.title = ARCPY.GetIDMessage(220126)
            bChart.xAxis.sort = "ASC"
            bChart.yAxis.field = ""
            bChart.yAxis.title = ARCPY.GetIDMessage(84785)
            bChart.bar.aggregation= "COUNT"
            paramOutput.charts = [bChart, histChart]

            #### Apply Template - Editing the heading and Labels for Localization ####
            try:
                instanceLOF.applyJSONLayerPoints()
            except:
                ARCPY.AddIDMessage("WARNING", 973)
                pass
        else:
            try:
                parameters[1].symbology = OS.path.join(fullLayerPath, "LocalOutlierFactorOnly.lyrx")
            except:
                ARCPY.AddIDMessage("WARNING", 973)
                pass

        if outputRaster is not None:
            try:
                instanceLOF.runDetectionRaster(outputRaster)
            except:
                ARCPY.AddIDMessage("WARNING", 973)
                pass

        return


class SpatialAssociationBetweenZones(object):
    def __init__(self):
        self.label = "Spatial Association between Zones"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060011

    def getParameterInfo(self):
        if ARCPY.CheckExtension("spatial") == "Available":
            supportedDataTypes = ["GPFeatureLayer", "GPRasterLayer", "DEImageServer"]
        else:
            supportedDataTypes = "GPFeatureLayer"

        param0 = ARCPY.Parameter(displayName="Input Polygon Features or Raster Zones",
                                 name="input_feature_or_raster",
                                 datatype=supportedDataTypes,
                                 parameterType="Required",
                                 direction="Input")
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Categorical Zone Field",
                                 name="categorical_zone_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.list = ['Short', 'Long', 'String', 'BigInteger']
        param1.parameterDependencies = ["input_feature_or_raster"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Overlay Polygon Features or Raster Zones",
                                 name="overlay_feature_or_raster",
                                 datatype=supportedDataTypes,
                                 parameterType="Required",
                                 direction="Input")
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Categorical Overlay Zone Field",
                                 name="categorical_overlay_zone_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param3.filter.list = ['Short', 'Long', 'String', 'BigInteger']
        param3.parameterDependencies = ["overlay_feature_or_raster"]
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Optional",
                                 direction="Output")
        param4.displayOrder = 4
        param4.enabled = True

        param5 = ARCPY.Parameter(displayName="Output Raster",
                                 name="output_raster",
                                 datatype="DERasterDataset",
                                 parameterType="Optional",
                                 direction="Output")
        param5.displayOrder = 5
        param5.enabled = True

        param6 = ARCPY.Parameter(displayName="Correspondence of Overlay Zones within Input Zones",
                                 name="correspondence_overlay_to_input",
                                 datatype="DEFeatureClass",
                                 parameterType="Optional",
                                 direction="Output")
        param6.displayOrder = 6
        param6.enabled = True

        param7 = ARCPY.Parameter(displayName="Correspondence of Input Zones within Overlay Zones",
                                 name="correspondence_input_to_overlay",
                                 datatype="DEFeatureClass",
                                 parameterType="Optional",
                                 direction="Output")
        param7.displayOrder = 7
        param7.enabled = True

        param8 = ARCPY.Parameter(displayName="Global Measure of Spatial Association",
                                 name="global_measure_of_spatial_association",
                                 datatype="GPDouble",
                                 parameterType="Derived",
                                 direction="Output")


        param9 = ARCPY.Parameter(displayName="Global Correspondence of Input Zones within Overlay Zones",
                                 name="global_correspondence_input_to_overlay",
                                 datatype="GPDouble",
                                 parameterType="Derived",
                                 direction="Output")


        param10 = ARCPY.Parameter(displayName="Global Correspondence of Overlay Zones within Input Zones",
                                 name="global_correspondence_overlay_to_input",
                                 datatype="GPDouble",
                                 parameterType="Derived",
                                 direction="Output")

        return [param0, param1, param2, param3, param4, param5,
                param6, param7, param8, param9, param10]

    def validateFCGeom(self, paramDS):
        if not paramDS.value:
            return
        inputDAPath = paramDS.valueAsText
        try:
            desc = ARCPY.Describe(inputDAPath)
            dataType = desc.dataType.upper()
            if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
                if desc.shapeType.upper() != "POLYGON":
                    paramDS.setIDMessage("ERROR", 366)
        except:
            pass
        return

    def setOutputRasterFields(self, parameters):
        inputFCRef = parameters[0].value
        inputFCRefField = UTILS.getTextParameter(1, parameters)
        inputFCTar = parameters[2].value
        inputFCTarField = UTILS.getTextParameter(3, parameters)
        param_outputRaster = parameters[5]

        if inputFCRefField is None or inputFCTarField is None:
            return

        lfRef = ARCPY.ListFields(inputFCRef)
        refField = None
        tarField = None

        for field in lfRef:
            if field.name.upper() == inputFCRefField.upper():
                refField = field

        lfTar = ARCPY.ListFields(inputFCTar)
        for field in lfTar:
            if field.name.upper() == inputFCTarField.upper():
                tarField = field

        fieldsHaveError = parameters[1].hasError() or parameters[3].hasError()
        if refField is not None and tarField is not None and not fieldsHaveError:
            refFieldName = refField.name
            tarFieldName = tarField.name

            try:
                refFieldAlias = refField.alias
            except:
                refFieldAlias = refField.name

            try:
                tarFieldAlias = tarField.alias
            except:
                tarFieldAlias = tarField.name

            if refField.type.upper() in ['TEXT', 'STRING']:
                dataTypeRef = 'TEXT'
            else:
                dataTypeRef = 'LONG'

            if tarField.type.upper() in ['TEXT', 'STRING']:
                dataTypeTar = 'TEXT'
            else:
                dataTypeTar = 'LONG'


            if refFieldName.upper() == tarFieldName.upper():
                refFieldName = refField.name[0: 6] + "_REF"
                tarFieldName = tarField.name[0: 6] + "_TAR"

            if refFieldAlias == tarFieldAlias:
                refFieldAlias += " (Reference)"
                tarFieldAlias += " (Target)"

            rasterFields = []
            fieldNames = ["Val_IN", "Val_OVL", refFieldName, tarFieldName,
                          "CRSPDNC_IO", "CRSPDNC_OI", "BIVAR_CAT"]

            fieldAliases = ["Value of Input Raster", "Value of Overlay Raster",
                            refFieldAlias, tarFieldAlias,
                            "Correspondence of Input Zones within Overlay Zones",
                            "Correspondence of Overlay Zones within Input Zones",
                            "Bivariate Category of Correspondence"]

            fieldTypes = ["LONG", "LONG", dataTypeRef, dataTypeTar, "FLOAT", "FLOAT", "TEXT"]

            for fieldInd, fieldName in enumerate(fieldNames):
                outField = ARCPY.Field()
                outField.name = fieldName
                outField.alias = fieldAliases[fieldInd]
                outField.type = fieldTypes[fieldInd]
                rasterFields.append(outField)

        return

    def updateParameters(self, parameters):
        import SABRE
        param_inputFCRef = parameters[0]
        param_inputFCRefField = parameters[1]
        param_inputFCTar = parameters[2]
        param_inputFCTarField = parameters[3]

        generalDTRef = None
        generalDTTar = None
        defaultRasterRef = None
        defaultRasterTar = None

        if not param_inputFCRef.hasError() and not param_inputFCTar.hasError():
            generalDTRef, defaultRasterRef = SABRE.getInputDataType(param_inputFCRef)
            generalDTTar, defaultRasterTar = SABRE.getInputDataType(param_inputFCTar)

        outFCINT = parameters[4]
        outRaster = parameters[5]
        outFCRef = parameters[6]
        outFCTar = parameters[7]

        #### Determine which output Option should be enabled ####
        dtList = [generalDTRef, generalDTTar]
        if dtList.count("RASTER"):
            outRaster.enabled = True
            clearParameter(outFCINT)
            clearParameter(outFCRef)
            clearParameter(outFCTar)

            #### Set Default Raster Field if Only One Field ####
            if defaultRasterRef is not None and not param_inputFCRefField.value:
                param_inputFCRefField.value = defaultRasterRef
            if defaultRasterTar is not None and not param_inputFCTarField.value:
                param_inputFCTarField.value = defaultRasterTar
        elif generalDTRef == "POLYGON" and generalDTTar == "POLYGON":
            outFCINT.enabled = True
            clearParameter(outRaster)
            if param_inputFCRef.valueAsText == param_inputFCTar.valueAsText:
                clearParameter(outFCRef)
                clearParameter(outFCTar)
            else:
                outFCRef.enabled = True
                outFCTar.enabled = True

            #### Add the output FeatureClass schema here ####
            if not param_inputFCRef.hasError() and not param_inputFCTar.hasError() and param_inputFCRef.value and param_inputFCTar.value and param_inputFCRefField.value and param_inputFCTarField.value and not param_inputFCRefField.hasError() and not param_inputFCTarField.hasError():
                SABRE.buildOutputFCSchema(param_inputFCRef, param_inputFCRefField,
                                          param_inputFCTar, param_inputFCTarField,
                                          outFCINT, outFCRef, outFCTar)
        else:
            outFCINT.enabled = True
            outFCRef.enabled = True
            outFCTar.enabled = True
            outRaster.enabled = True

        if outRaster.value:
            rasterPath = outRaster.valueAsText
            outDir, outFileName = OS.path.split(rasterPath)
            if outDir == "":
                outRaster.value = OS.path.join(ARCPY.env.workspace, rasterPath)
            elif OS.path.isdir(outDir):
                baseType = UTILS.getBaseWorkspaceType(outDir)
                if baseType.upper() == "FILESYSTEM":
                    outFileName = OS.path.splitext(outFileName)[0] + ".tif"
                    outRaster.value = OS.path.join(outDir, outFileName)

            #### Set Output Raster Fields ####
            #self.setOutputRasterFields(parameters)

        return

    def updateMessages(self, parameters):
        param_inputFCRef = parameters[0]
        param_inputFCRefField = parameters[1]
        param_inputFCTar = parameters[2]
        param_inputFCTarField = parameters[3]

        ref_feature = param_inputFCRef.valueAsText
        ref_field = param_inputFCRefField.valueAsText
        tar_feature = param_inputFCTar.valueAsText
        tar_field = param_inputFCTarField.valueAsText
        if ref_feature and ref_field and not param_inputFCRefField.hasError() and not param_inputFCTarField.hasError() and ref_feature == tar_feature and ref_field == tar_field:
            param_inputFCTarField.setIDMessage("ERROR", 400)

        if not param_inputFCRef.hasError():
            self.validateFCGeom(param_inputFCRef)
        if not param_inputFCTar.hasError():
            self.validateFCGeom(param_inputFCTar)

        outFCFileMain = parameters[4].valueAsText
        outFCRef = parameters[6]
        outFCTar = parameters[7]
        if outFCRef.enabled:
            #### Check Ref Output FC ####
            outFCRefFile = UTILS.getTextParameter(6, parameters)
            if outFCRefFile is not None:
                if outFCRefFile == ref_feature or outFCRefFile == tar_feature:
                    outFCRef.setIDMessage("ERROR", 3221, "This output and the input dataset")

                if outFCRefFile == outFCFileMain:
                    outFCRef.setIDMessage("ERROR", 3221, "This output and the other output dataset")


            #### Check Target Output FC ####
            outFCTarFile = UTILS.getTextParameter(7, parameters)
            if outFCTarFile is not None:
                if outFCTarFile == ref_feature or outFCTarFile == tar_feature:
                    outFCTar.setIDMessage("ERROR", 3221, "This output and the input dataset")

                if outFCTarFile == outFCFileMain or outFCTarFile == outFCRefFile:
                    outFCTar.setIDMessage("ERROR", 3221, "This output and the other output dataset")

        outRaster = parameters[5]
        if outRaster.value:
            rasterPath = outRaster.valueAsText
            outDir, outFileName = OS.path.split(rasterPath)
            if len(outDir) and not OS.path.isdir(outDir):
                outRaster.setIDMessage("ERROR", 436, outDir)

        return

    def execute(self, parameters, messages):
        import SABRE
        SABRE.execute(parameters, messages)

class NeighborhoodSummaryStatistics(object):
    def __init__(self):
        self.label = "Neighborhood Summary Statistics"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Measuring Geographic Distributions"
        self.helpContext = 9040007

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param1.displayOrder = 2

        param2 = ARCPY.Parameter(displayName="Analysis Fields",
                                 name="analysis_fields",
                                 datatype="Field",
                                 parameterType="Optional",
                                 multiValue=True,
                                 direction="Input")
        param2.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param2.filter.list = ['Short','Long','Float','Double', 'BigInteger']
        param2.parameterDependencies = ["in_features"]
        param2.displayOrder = 1

        param3 = ARCPY.Parameter(displayName="Local Summary Statistic",
                                 name="local_summary_statistic",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param3.filter.list = ["ALL", "MEAN", "MEDIAN", "STD_DEV", "IQR", "SKEWNESS", "QUANTILE_IMBALANCE"]
        param3.value = "ALL"
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Include Focal Feature in Calculations",
                                 name="include_focal_feature",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ['INCLUDE_FOCAL', 'EXCLUDE_FOCAL']
        param4.value = True
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Ignore Null Values in Calculations",
                                 name="ignore_nulls",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = ['IGNORE_NULLS', 'INCLUDE_NULLS']
        param5.value = True
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Neighborhood Type",
                                 name="neighborhood_type",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.list = ['DISTANCE_BAND',
                              'NUMBER_OF_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Distance Band",
                                 name="distance_band",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = supportDist
        param7.enabled = False
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Number of Neighbors",
                                 name="number_of_neighbors",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.type = "Range"
        param8.filter.list = [2, 1000]
        param8.enabled = False
        param8.value = 8
        param8.displayOrder = 8

        param9 = ARCPY.Parameter(displayName="Weights Matrix File",
                                 name="weights_matrix_file",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param9.filter.list = ['swm', 'gwt', 'txt']
        param9.enabled = False
        param9.displayOrder = 9

        param10 = ARCPY.Parameter(displayName="Local Weighting Scheme",
                                 name="local_weighting_scheme",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param10.filter.list = ['UNWEIGHTED',
                              'BISQUARE',
                              'GAUSSIAN']
        param10.value = 'UNWEIGHTED'
        param10.enabled = False
        param10.displayOrder = 10

        param11 = ARCPY.Parameter(displayName="Kernel Bandwidth",
                                 name="kernel_bandwidth",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param11.filter.list = supportDist
        param11.enabled = False
        param11.displayOrder = 11

        return [param0, param1, param2, param3, param4,
                param5, param6, param7, param8, param9,
                param10, param11]

    def updateParameters(self, parameters):
        import NeighborhoodSummaryStatistics as NSS

        param_inFC = parameters[0]
        param_inFields = parameters[2]
        param_outFC = parameters[1]
        param_staMethod = parameters[3]
        param_focal = parameters[4]
        param_concept_of_spatial_relation = parameters[6]
        param_distBand = parameters[7]
        param_KNN = parameters[8]
        param_weightsFile = parameters[9]
        param_weightSchema = parameters[10]
        param_kernelBand = parameters[11]

        if paramChanged(param_inFC):
            inputFC = param_inFC.valueAsText
            if inputFC:
                try:
                    desc = ARCPY.Describe(inputFC)
                    shapeType = desc.ShapeType.upper()
                    currentValue = param_concept_of_spatial_relation.valueAsText
                    if shapeType == "POLYGON":
                        param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                                                                         'NUMBER_OF_NEIGHBORS',
                                                                         'CONTIGUITY_EDGES_ONLY',
                                                                         'CONTIGUITY_EDGES_CORNERS',
                                                                         'GET_SPATIAL_WEIGHTS_FROM_FILE']

                        if currentValue in [None, "", "#"] or currentValue not in param_concept_of_spatial_relation.filter.list:
                            param_concept_of_spatial_relation.value = 'CONTIGUITY_EDGES_CORNERS'

                    else:  # shapeType in ["POINT", "MULTIPOINT"]:
                        param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                                                                         'NUMBER_OF_NEIGHBORS',
                                                                         'DELAUNAY_TRIANGULATION',
                                                                         'GET_SPATIAL_WEIGHTS_FROM_FILE']
                        if currentValue in [None, "", "#"] or currentValue not in param_concept_of_spatial_relation.filter.list:
                            param_concept_of_spatial_relation.value = 'DELAUNAY_TRIANGULATION'
                except:
                    pass
            else:
                param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                              'NUMBER_OF_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']

        concept_of_spatial_relation = parameters[6].value

        if concept_of_spatial_relation == 'DISTANCE_BAND':
            param_distBand.enabled = True
        else:
            param_distBand.enabled = False

        if concept_of_spatial_relation == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
            param_focal.enabled = False
            param_weightsFile.enabled = True
        else:
            param_focal.enabled = True
            param_weightsFile.enabled = False

        if concept_of_spatial_relation == 'NUMBER_OF_NEIGHBORS':
            param_KNN.enabled = True
        else:
            param_KNN.enabled = False

        if concept_of_spatial_relation in ['DISTANCE_BAND', 'NUMBER_OF_NEIGHBORS']:
            param_weightSchema.enabled = True
        else:
            clearParameter(param_weightSchema)

        if param_weightSchema.enabled and not param_weightSchema.value:
            param_weightSchema.value = "UNWEIGHTED"

        if param_weightSchema.enabled and param_weightSchema.valueAsText in ['BISQUARE', 'GAUSSIAN']:
            param_kernelBand.enabled = True
        else:
            param_kernelBand.enabled = False

        #### Auto Fill Bandwidth w/ Distance Band if Distance Band Changes ####
        if param_distBand.enabled and param_kernelBand.enabled:
            distVal = UTILS.getTextParameter(7, parameters)
            if UTILS.getTextParameter(11, parameters) is None and distVal is not None:
                try:
                    dist, unit = distVal.split(" ")
                    if unit.upper() in upperSupportDist:
                        param_kernelBand.value = param_distBand.value
                except:
                    pass

        #### Auto Fill Local Stats ####
        if UTILS.getTextParameter(3, parameters) is None:
            parameters[3].value = "ALL"

        #### Auto Fill Neighborhood Type ####
        if UTILS.getTextParameter(6, parameters) is None:
            inputFC = param_inFC.valueAsText
            if inputFC:
                try:
                    desc = ARCPY.Describe(inputFC)
                    shapeType = desc.ShapeType.upper()
                    if shapeType == "POLYGON":
                        param_concept_of_spatial_relation.value = 'CONTIGUITY_EDGES_CORNERS'
                    else:
                        param_concept_of_spatial_relation.value = 'DELAUNAY_TRIANGULATION'
                except:
                    pass

        #### Auto Fill Number of Neighbors ####
        if param_KNN.enabled:
            if UTILS.getNumericParameter(8, parameters) is None:
                param_KNN.value = 8

        #### Build the field schema for output Feature Class ####
        if param_inFC.value is not None and not param_staMethod.hasError() and not param_inFields.hasError() \
                and param_inFields.value is not None and not param_outFC.hasError() and param_outFC.value is not None:
            try:
                varNames = UTILS.getTextParameter(2, parameters)
                if varNames is None:
                    varNames = []
                schemas = NSS.NeighborhoodSummaryStatistics.buildOutputFieldsSchema(
                            param_inFC.valueAsText, varNames, param_outFC.valueAsText,
                            statisticMethod=param_staMethod.valueAsText, calDistance=True)
                param_outFC.schema.additionalFields = schemas
            except:
                param_outFC.schema.additionalFields = []
        return

    def updateMessages(self, parameters):
        import locale as LOCALE

        param_threshold = parameters[7]
        if param_threshold.enabled and param_threshold.value:
            positiveParamValue, positiveParamUnit = param_threshold.valueAsText.split(" ")
            if LOCALE.atof(positiveParamValue) <= 0:
                param_threshold.setIDMessage("ERROR", 531)

        param_weightsFile = parameters[9]
        if param_weightsFile.enabled and param_weightsFile.value in ["", "#", None]:
            param_weightsFile.setIDMessage("ERROR", 930)

        param_weightSchema = parameters[10]
        if param_weightSchema.enabled and not param_weightSchema.value:
            param_weightSchema.setIDMessage("ERROR", 930)

        param_kernelBand = parameters[11]
        if param_kernelBand.enabled and param_kernelBand.value:
            positiveParamValue, positiveParamUnit = param_kernelBand.valueAsText.split(" ")
            if LOCALE.atof(positiveParamValue) <= 0:
                param_kernelBand.setIDMessage("ERROR", 531)

        return

    def execute(self, parameters, messages):
        import SSUtilities as UTILS
        import SSDataObject as SSDO
        import NeighborhoodSummaryStatistics as NSS
        ARCPY.env.overwriteOutput = True

        ### Get parameter values ####
        inputFC = UTILS.getTextParameter(0, parameters)
        varNames = []
        inVarNames = UTILS.getTextParameter(2, parameters)
        if inVarNames is not None:
            for varName in inVarNames.split(";"):
                upperName = varName.upper()
                if upperName not in varNames:
                    varNames.append(upperName)

        outputFC = UTILS.getTextParameter(1, parameters)
        statisticMethod = UTILS.getTextParameter(3, parameters)
        includeSelf = parameters[4].value
        ignoreNulls = parameters[5].value
        spaceConcept = UTILS.getTextParameter(6, parameters)

        #### Check Advanced License for Delaunay ####
        if spaceConcept == 'DELAUNAY_TRIANGULATION':
            if not checkLicense():
                ARCPY.AddIDMessage("ERROR", 110463)
                raise SystemExit

        if spaceConcept == 'DISTANCE_BAND':
            spaceConcept = 'FIXED_DISTANCE'
        elif spaceConcept == 'NUMBER_OF_NEIGHBORS':
            spaceConcept = 'K_NEAREST_NEIGHBORS'

        threshold = None
        if spaceConcept == 'FIXED_DISTANCE':
            threshold = UTILS.getTextParameter(7, parameters)
        numNeighs = None
        if spaceConcept == 'K_NEAREST_NEIGHBORS':
            numNeighs = UTILS.getNumericParameter(8, parameters)
        weightsFile = None
        if spaceConcept == "GET_SPATIAL_WEIGHTS_FROM_FILE":
            weightsFile = UTILS.getTextParameter(9, parameters)
            includeSelf = False

        #### Apply Exec new field checker ####
        check = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields=varNames, weightsFile=weightsFile)

        try:
            wType = WU.weightDispatch[spaceConcept]
        except:
            ARCPY.AddIDMessage("Error", 723)
            raise SystemExit()
        weightSchema = UTILS.getTextParameter(10, parameters)

        kernelBand = None
        if weightSchema in ['BISQUARE', 'GAUSSIAN']:
            kernelBand = UTILS.getTextParameter(11, parameters)

        #### Do Theissen Polygons for Delaunay and Set To Polygon Neighbors ####
        if wType == 3:
            ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220088))
            inMemoryFC = "in_memory/LSSThiessenPolygonsTempFC"
            clearedThiessen = UTILS.clearExtent(ARCPY.CreateThiessenPolygons_analysis)
            clearedThiessen(inputFC, inMemoryFC, "ALL")
            ssdo = SSDO.SSDataObject(inMemoryFC, templateFC = outputFC)
            masterField = "INPUT_FID" 
            wType = 5
            sourceIsThiessen = True
        else:
            #### Create SSDataObject ####
            ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC)

            #### Set Unique ID Field ####
            masterField = UTILS.setUniqueIDField(ssdo, weightsFile=weightsFile)
            sourceIsThiessen = False

        #### Populate SSDO with Data ####
        ssdo.obtainData(masterField, varNames, minNumObs = 3, useNullinFields = varNames)

        #### Make Sure the Number of Neighbors is less Than the Total Number of Features ####
        if numNeighs and numNeighs >= ssdo.numObs:
            ARCPY.AddIDMessage("Error", 110265)
            raise SystemExit()

        #### Analysis ####
        nss = NSS.NeighborhoodSummaryStatistics(ssdo, varNames, wType=wType,
                                                includeSelf=includeSelf, ignoreNulls=ignoreNulls,
                                                statisticMethod=statisticMethod, calGeoWeight=True, threshold=threshold,
                                                weightsFile=weightsFile, numNeighs=numNeighs, weightSchema=weightSchema, 
                                                kernelBand=kernelBand, sourceIsThiessen=sourceIsThiessen)
        nss.createOutput(outputFC)

        symbolStr = nss.createSymology()
        if symbolStr is not None:
            ARCPY.gp.SetParameterSymbology(1, symbolStr)
        return


class TimeSeriesSmoothing(object):
    def __init__(self):
        self.label = "Time Series Smoothing"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        self.helpContext = 9050002

    def isReadOnly(self, input):
        """Returns whether the input is a dataset read only
        INPUTS:
        input (str): feature layer/Table View (string), fc input, fc output

        OUTPUT:
        return (bool): is the input in a gdb?
        """
        formatReadOnly = [".BDC", ".CSV"]
        isContained = False
        path = input
        try:
            d = ARCPY.Describe(input)
            path = d.CatalogPath.upper()
            for ext in formatReadOnly:
                if ext in path:
                    isContained = True
                    break

            if d.dataType in ["FeatureLayer", "TableView"] and ".NC" in path:
                isContained = True
        except:
            pass
        return isContained


    def getParameterInfo(self):
        param0 = ARCPY.Parameter(displayName="Input Features or Table",
                                 name="in_features",
                                 datatype=["GPTableView"],
                                 parameterType="Required",
                                 direction="Input")
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Time Field",
                                 name="time_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.list = ['Date']
        param1.parameterDependencies = [param0.name]
        param1.displayOrder = 4

        param2 = ARCPY.Parameter(displayName="Analysis Field",
                                 name="analysis_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.list = ["Short", "Long", "Float", "Double", "BigInteger"]
        param2.parameterDependencies = [param0.name]
        param2.displayOrder = 5

        param3 = ARCPY.Parameter(displayName="Group Time Series by",
                                 name="group_method",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param3.filter.type = "ValueList"
        param3.filter.list = ["LOCATION", "ID_FIELD", "NONE"]
        param3.value = 'LOCATION'
        param3.displayOrder = 6

        param4 = ARCPY.Parameter(displayName="Smoothing Method",
                                 name="method",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.type = "ValueList"
        param4.filter.list = ["BACKWARD", "CENTERED", "FORWARD", "ADAPTIVE"]
        param4.value = 'BACKWARD'
        param4.displayOrder = 8

        param5 = ARCPY.Parameter(displayName="Time Window",
                                 name="time_window",
                                 datatype="GPTimeUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = supportTime
        param5.displayOrder = 9

        param6 = ARCPY.Parameter(displayName="Append Fields to Input Features",
                                  name="append_to_input",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")
        param6.filter.list = ['APPEND_TO_INPUT', 'NEW_OUTPUT']
        param6.value = False
        param6.displayOrder = 1

        param7 = ARCPY.Parameter(displayName="Output Features or Table",
                                 name="output_features",
                                 datatype=["DETable"],
                                 parameterType="Optional",
                                 direction="Output")
        param7.enabled = True
        param7.displayOrder = 2

        param8 = ARCPY.Parameter(displayName="ID Field",
                                 name="id_field",
                                 datatype="Field",
                                 parameterType="optional",
                                 direction="Input")
        param8.filter.list = ["Short", "Long", "String", "BigInteger"]
        param8.parameterDependencies = [param0.name]
        param8.enabled = False
        param8.displayOrder = 7

        param9 = ARCPY.Parameter(displayName="Allow Shorter Time Windows at Start and End",
                                 name="apply_shorter_window",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param9.filter.list = ["APPLY_SHORTER_WINDOW", "NOT_APPLY_SHORTER_WINDOW"]
        param9.value = False
        param9.displayOrder = 10
        param10 = ARCPY.Parameter(displayName="Enable Time Series Pop-ups",
                                 name="enable_time_series_popups",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param10.filter.list = ['CREATE_POPUP', 'NO_POPUP']
        param10.value = True
        param10.displayOrder = 3

        param11 = ARCPY.Parameter(displayName="Updated Features or Table",
                                  name="updated_features",
                                  datatype="GPTableView",
                                  parameterType="Derived",
                                  direction="Output")
        param11.displayOrder = 11

        return [param0, param1, param2, param3,
                param4, param5, param6, param7,
                param8, param9, param10, param11]

    def isLicensed(self):
        return True

    def testIfPositiveInt(self, value, testIfEven=False):
        if isinstance(value, int):
            if testIfEven:
                if value > 0 and value % 2 == 0:
                    return True
                else:
                    return False
            else:
                return value > 0
        if isinstance(value, float):
            if not value.is_integer():
                return False
            else:
                value = int(value)
                if testIfEven:
                    if value > 0 and value % 2 == 0:
                        return True
                    else:
                        return False
                else:
                    return value > 0
        return False

    def updateParameters(self, parameters):
        import SSTSSmoothing as SSTS

        param_in = parameters[0]
        param_groupBy = parameters[3]
        param_doAppd = parameters[6]
        param_out = parameters[7]
        param_appd = parameters[11]

        if param_in.altered:
            is_joindFC = False
            if param_in.value:
                try:
                    oidName = ARCPY.Describe(param_in.valueAsText).OIDFieldName
                    if oidName is not None and "." in oidName:
                        is_joindFC = True

                except:
                    pass
            if is_joindFC:
                param_doAppd.value = False
                param_doAppd.enabled = False
            else:
                param_doAppd.enabled = True

        if param_doAppd.value:
            clearParameter(param_out)
            if param_in.value:
                param_appd.value = param_in.valueAsText
        else:
            param_out.enabled = True
            param_appd.value = None
            if param_out.value is None and ARCPY.env.workspace is not None:
                #### Automatically populate the field names ####
                if len(ARCPY.env.workspace) > 0 and param_in.value:
                    extraChrt = ""
                    try:
                        int(OS.path.basename(param_in.valueAsText).split(".")[0])
                        extraChrt ="t"
                    except:
                        pass

                    try:
                        outputCandidate = OS.path.join(
                            ARCPY.env.workspace,
                            extraChrt + OS.path.basename(param_in.valueAsText).split(".")[0] + "_TimeSeriesSmoothing")
                        param_out.value = outputCandidate
                    except:
                        pass
        if param_in.altered and param_in.value and ARCPY.Exists(param_in.valueAsText):
            desc = ARCPY.Describe(param_in.valueAsText)
            dataType = desc.dataType.upper()
            if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
                param_groupBy.filter.list = ["LOCATION", "ID_FIELD", "NONE"]
            else:
                param_groupBy.filter.list = ["ID_FIELD", "NONE"]
                if param_groupBy.valueAsText == "LOCATION":
                    param_groupBy.value = "NONE"
            if param_out.value:
                try:
                    output = param_out.valueAsText
                    if not UTILS.IsPathInGeoDatabase(output):
                        desc = ARCPY.Describe(param_in.valueAsText)
                        dataType = desc.dataType.upper()
                        if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
                            if not output.lower().endswith(".shp"):
                                dir = OS.path.dirname(output)
                                fn = OS.path.basename(output).split(".")[0] + ".shp"
                                param_out.value = OS.path.join(dir, fn)
                        else:
                            if not output.lower().endswith(".dbf"):
                                dir = OS.path.dirname(output)
                                fn = OS.path.basename(output).split(".")[0] + ".dbf"
                                param_out.value = OS.path.join(dir, fn)
                except:
                    pass
        if param_in.value is None:
            param_groupBy.filter.list = ["LOCATION", "ID_FIELD", "NONE"]
        if param_groupBy.value is None:
            if "LOCATION" in param_groupBy.filter.list:
                param_groupBy.value = "LOCATION"
            else:
                param_groupBy.value = "NONE"

        param_method = parameters[4]
        method = param_method.valueAsText
        if method in ["BACKWARD", "CENTERED", "FORWARD"]:
            parameters[9].enabled = True
        else:
            parameters[9].enabled = False

        if not param_method.value:
            param_method.value = "BACKWARD"

        param_groupBy = parameters[3]
        param_idField = parameters[8]
        if param_groupBy.valueAsText == "ID_FIELD":
            param_idField.enabled = True
        else:
            clearParameter(param_idField)

        #### Build Output Fields ####
        couldBuild = True
        param_time = parameters[1]
        param_ana = parameters[2]
        param_timeWindow = parameters[5]
        if not param_in.value or param_in.hasError():
            couldBuild = False
        if not param_doAppd.value and not param_out.value:
            couldBuild = False
        if not param_time.value or param_time.hasError():
            couldBuild = False
        if not param_ana.value or param_ana.hasError():
            couldBuild = False
        if param_groupBy.valueAsText == "ID_FIELD" and not param_idField.value:
            couldBuild = False
        if param_idField.hasError():
            couldBuild = False
        if param_in.hasError() or param_time.hasError() or param_ana.hasError() or param_idField.hasError() or param_timeWindow.hasError():
            couldBuild = False
        method = param_method.valueAsText

        if not param_doAppd.value:
            param_appd.enabled = False
            param_appd.value = None

        if couldBuild:
            if param_doAppd.value:
                #### Append to Input Function for Derived Output ####
                setOptionalAppendDerivedParam(param_in, param_appd)
                paramO = param_appd
                output = None
            else:
                paramO = param_out
                output = param_out.valueAsText

            paramO.schema.additionalFields = SSTS.buildOutputFCSchema(
                param_in.valueAsText, output, param_ana.valueAsText, param_time.valueAsText,
                param_groupBy.valueAsText, param_idField.valueAsText, method, param_idField.valueAsText)

        return

    def updateMessages(self, parameters):
        param_in = parameters[0]
        method = parameters[4].valueAsText
        param_ana = parameters[2]
        param_timeWindow = parameters[5]
        param_idField = parameters[8]
        param_popUps = parameters[10]
        if method in ["BACKWARD", "CENTERED", "FORWARD"]:
            if param_timeWindow.value is None:
                param_timeWindow.setIDMessage("ERROR", 530)
        if param_timeWindow.value:
            value = getLinearUnitFloat(param_timeWindow.value)
            if method in ["BACKWARD", "FORWARD"]:
                if not self.testIfPositiveInt(value, testIfEven=False):
                    param_timeWindow.setIDMessage("ERROR", 110396)
                    return
            else:
                timeUnit = param_timeWindow.valueAsText.split(" ")[1].upper()
                if timeUnit in ["MONTHS", "YEARS"]:
                    if not self.testIfPositiveInt(value, testIfEven=True):
                        param_timeWindow.setIDMessage("ERROR", 110397)
                        return
                else:
                    if not self.testIfPositiveInt(value, testIfEven=False):
                        param_timeWindow.setIDMessage("ERROR", 110396)
                        return

        param_out = parameters[7]
        if param_out.enabled and param_out.value is None:
            param_out.setIDMessage("ERROR", 530)

        if param_out.value:
            try:
                output = param_out.valueAsText
                if not UTILS.IsPathInGeoDatabase(output):
                    if param_popUps.value:
                        param_popUps.setIDMessage("WARNING", 110315)
                    input = param_in.valueAsText
                    if input:
                        desc = ARCPY.Describe(param_in.valueAsText)
                        dataType = desc.dataType.upper()
                        if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
                            if UTILS.IsPathInGeoDatabase(input):
                                param_out.setIDMessage("WARNING", 110402)
            except:
                pass

        param_doAppd = parameters[6]
        if param_doAppd.value:
            if param_in.value:
                try:
                    input = param_in.valueAsText
                    if not UTILS.isGDB(input) and not input.lower().startswith("memory\\"):
                        if param_popUps.value:
                            param_popUps.setIDMessage("WARNING", 110315)
                    if self.isReadOnly(input):
                        param_doAppd.setIDMessage("ERROR", 381, input)
                except:
                    pass

        if param_idField.enabled and param_idField.value is None:
            param_idField.setIDMessage("ERROR", 530)
        if param_idField.value and param_idField.valueAsText == param_ana.valueAsText:
            param_idField.setIDMessage("ERROR", 110401)

        return

    def execute(self, parameters, messages):
        import SSTSSmoothing as TS
        TS.execute(parameters, messages)

    def postExecute(self, parameters):
        import SSTSSmoothing as TS
        TS.postExecute(parameters)


class PresenceOnlyPrediction(object):
    def __init__(self):
        self.label = "Presence-Only Prediction (MaxEnt)"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 9060012
        self.category = "Modeling Spatial Relationships"
        self.shapeType = None
        self.fieldNames = None
        self.fieldAlias = None
        self.rfD = None
        self.fieldInput = {}
        self.fileExt = ".RFM"
        self.discrete = "(CAT)"
        self.continuous = "(CNT)"
        self.notDisplay = ["OID", "FID", "SHAPE", "OBJECTID", "SHAPE_LENG", "SHAPE_AREA"]
        self.noTypeDisplay = ["OID", "FID", "DATE"]
        self.varTypeRev = { "(CNT)": 'Numeric',"(DSC)":'Categorical' }
        self.typeOperationPolygon = ["AVG", "MAJORITY", "SUM"]
        self.typeOperationPoint = ["None"]
        self.dbg = ""
        self.desc = None
        self.descF2P = None
        self.fieldAliasF2P = None
        self.fieldNamesF2P = None
        self.modelCreated = ''
        self.lic = True
        self.near = True
        self.inFields = None
        self.inFiedsF2P = None

        self.defaultIndexList = [7, 8, 12, 13, 15, 27, 28]
        self.defaultValueList = [10, "CONVEX_HULL", 10, 100, .5, "NONE", 3]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Point Features",
                                 name = "input_point_features",
                                 datatype = "GPFeatureLayer",
                                 parameterType = "Required",
                                 direction = "Input")
        param0.filter.list = ["Point"]
        param0.displayOrder = 0
        
        param1 = ARCPY.Parameter(displayName="Contains Background Points",
                                  name = "contains_background",
                                  datatype = "GPBoolean",
                                  parameterType = "Optional",
                                  direction = "Input")
        param1.value = False
        param1.displayOrder = 1
        
        param2 = ARCPY.Parameter(displayName="Presence Indicator Field",
                            name = "presence_indicator_field",
                            datatype = "Field",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param2.parameterDependencies = [param0.name]
        param2.enabled = False
        param2.displayOrder = 2
        
        param3 = ARCPY.Parameter(displayName="Explanatory Training Variables",
                            name = "explanatory_variables",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param3.parameterDependencies = [param0.name]
        param3.columns = [['Field', 'Variable'],['GPBoolean','Categorical']]
        param3.filters[0].list = ["Double", "Float", "Short", "Long", "Text", "BigInteger"]
        param3.filters[1].type = "ValueList"
        param3.filters[1].list = ["CATEGORICAL", "NUMERIC"]
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Explanatory Training Distance Features",
                            name = "distance_features",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)
        param4.filter.list = ["Polygon", "Point", "Polyline"]
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Explanatory Training Rasters",
                            name = "explanatory_rasters",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param5.columns = [['GPRasterLayer', 'Variable'],['GPBoolean','Categorical']]
        param5.filters[1].type = "ValueList"
        param5.filters[1].list = ["CATEGORICAL", "NUMERIC"]
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Explanatory Variable Expansions (Basis Functions)",
                            name = "basis_expansion_functions",
                            datatype = "GPString",
                            parameterType = "Optional",
                            direction = "Input",
                            multiValue = True)
        param6.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param6.filter.list = ["LINEAR", "QUADRATIC", "PRODUCT", "HINGE", "THRESHOLD"]
        param6.value = ["LINEAR"]
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Number of Knots",
                            name = "number_knots",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param7.filter.type = "Range"
        param7.filter.list = [2, 50]
        param7.value = 10
        param7.enabled = False
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Study Area",
                                 name="study_area_type",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.type = "ValueList"
        param8.filter.list = ["CONVEX_HULL", "RASTER_EXTENT", "STUDY_POLYGON"]
        param8.value = "CONVEX_HULL"
        param8.displayOrder = 8
        
        param9 = ARCPY.Parameter(displayName = "Study Area Polygon",
                                 name = "study_area_polygon",
                                 datatype = "GPFeatureLayer",
                                 parameterType = "Optional",
                                 direction = "Input")
        param9.filter.list = ["Polygon"]
        param9.enabled = False
        param9.displayOrder = 9

        param10 = ARCPY.Parameter(displayName="Apply Spatial Thinning",
                                  name = "spatial_thinning",
                                  datatype = "GPBoolean",
                                  parameterType = "Optional",
                                  direction = "Input")
        param10.filter.list = ['THINNING', 'NO_THINNING']
        param10.value = False
        param10.displayOrder = 10

        param11 = ARCPY.Parameter(displayName="Minimum Nearest Neighbor Distance",
                            name = "thinning_distance_band",
                            datatype = "GPLinearUnit",
                            parameterType = "Optional",
                            direction = "Input")
        param11.enabled = False
        param11.filter.list = supportDist
        param11.displayOrder = 11

        param12 = ARCPY.Parameter(displayName="Number of Iterations for Thinning",
                            name = "number_of_iterations",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param12.filter.type = "Range"
        param12.filter.list = [1, 50]
        param12.value = 10
        param12.displayOrder = 12
        param12.enabled = False

        param13 = ARCPY.Parameter(displayName="Relative Weight of Presence to Background",
                            name = "relative_weight",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param13.category =  "Advanced Model Options"
        param13.filter.type = "Range"
        param13.filter.list = [1, 100]
        param13.value = 100
        param13.enabled = True
        param13.displayOrder = 13

        param14 = ARCPY.Parameter(displayName="Presence Probability Transformation (Link Function)",
                                  name = "link_function",
                                  datatype = "GPString",
                                  parameterType = "Optional",
                                  direction = "Input")
        param14.category =  "Advanced Model Options"
        param14.filter.list = ["CLOGLOG", "LOGISTIC"]
        param14.displayOrder = 14

        param15 = ARCPY.Parameter(displayName="Presence Probability Cutoff",
                            name = "presence_probability_cutoff",
                            datatype = "GPDouble",
                            parameterType = "Optional",
                            direction = "Input")
        param15.category =  "Advanced Model Options"
        param15.filter.type = "Range"
        param15.filter.list = [0.01,0.99]
        param15.value = .5
        param15.displayOrder = 15

        param16 = ARCPY.Parameter(displayName="Output Trained Features",
                                  name = "output_trained_features",
                                  datatype = "DEFeatureClass",
                                  parameterType = "Optional",
                                  direction = "Output")
        param16.category =  "Training Outputs"
        param16.displayOrder = 16
        param16.parameterDependencies = [param0.name]

        param17 = ARCPY.Parameter(displayName="Output Trained Raster",
                                  name = "output_trained_raster",
                                  datatype = "DERasterDataset",
                                  parameterType = "Optional",
                                  direction = "Output")
        param17.category =  "Training Outputs"
        param17.displayOrder = 17

        param18 = ARCPY.Parameter(displayName="Output Response Curve Table",
                                  name = "output_response_curve_table",
                                  datatype = "DETable",
                                  parameterType = "Optional",
                                  direction = "Output")
        param18.category = "Training Outputs"
        param18.displayOrder = 18

        param19 = ARCPY.Parameter(displayName="Output Sensitivity Table",
                                  name = "output_sensitivity_table",
                                  datatype = "DETable",
                                  parameterType = "Optional",
                                  direction = "Output")
        param19.category =  "Training Outputs"
        param19.displayOrder = 19

        param20 = ARCPY.Parameter(displayName="Input Prediction Features",
                                  name = "features_to_predict",
                                  datatype = "GPFeatureLayer",
                                  parameterType = "Optional",
                                  direction = "Input")
        param20.filter.list = ["Point"]
        param20.category = "Prediction Options"
        param20.displayOrder = 20

        param21 = ARCPY.Parameter(displayName="Output Prediction Features",
                                  name = "output_pred_features",
                                  datatype = "DEFeatureClass",
                                  parameterType = "Optional",
                                  direction = "Output")
        param21.parameterDependencies = [param20.name]
        param21.category = "Prediction Options"
        param21.displayOrder = 21

        param22 = ARCPY.Parameter(displayName="Output Prediction Raster",
                                  name = "output_pred_raster",
                                  datatype = "DERasterDataset",
                                  parameterType = "Optional",
                                  direction = "Output")
        param22.category = "Prediction Options"
        param22.displayOrder = 22

        param23 = ARCPY.Parameter(displayName="Match Explanatory Variables",
                                 name = "explanatory_variable_matching",
                                 datatype = "GPValueTable",
                                 parameterType = "Optional",
                                 direction = "Input")
        param23.columns = [['Field', 'Prediction'], ['GPString','Training']]
        param23.filters[0].list = ["Double", "Float", "Short", "Long", "Text", "BigInteger"]
        param23.parameterDependencies = [param20.name]
        param23.controlCLSID = "{C99D0042-EF42-4B04-8A0B-1A53F6DB67A6}"
        param23.category = "Prediction Options"
        param23.displayOrder = 23

        param24 = ARCPY.Parameter(displayName="Match Distance Features",
                                  name = "explanatory_distance_matching",
                                  datatype = "GPValueTable",
                                  parameterType = "Optional",
                                  direction = "Input")
        param24.columns = [['GPFeatureLayer', 'Prediction'], ['GPString','Training']]
        param24.filters[0].list = ["Polygon", "Point", "Polyline"]
        param24.controlCLSID = "{C99D0042-EF42-4B04-8A0B-1A53F6DB67A6}"
        param24.category = "Prediction Options"
        param24.displayOrder = 24

        param25 = ARCPY.Parameter(displayName="Match Explanatory Rasters",
                                  name = "explanatory_rasters_matching",
                                  datatype = "GPValueTable",
                                  parameterType = "Optional",
                                  direction = "Input")
        param25.columns = [['GPRasterLayer', 'Prediction'], ['GPString','Training']]
        param25.controlCLSID = "{C99D0042-EF42-4B04-8A0B-1A53F6DB67A6}"
        param25.category = "Prediction Options"
        param25.displayOrder = 25

        param26 = ARCPY.Parameter(displayName="Allow Predictions Outside of Data Ranges",
                                  name = "allow_predictions_outside_of_data_ranges",
                                  datatype = "GPBoolean",
                                  parameterType = "Optional",
                                  direction = "Input")
        param26.category = "Prediction Options"
        param26.filter.list = ['ALLOWED', 'NOT_ALLOWED']
        param26.value = True
        param26.displayOrder = 26

        param27 = ARCPY.Parameter(displayName="Resampling Scheme",
                                 name="resampling_scheme",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param27.category = "Validation Options"
        param27.filter.type = "ValueList"
        param27.filter.list = ["NONE", "RANDOM"]
        #param27.filter.list = ["NONE", "SPATIAL", "RANDOM"]
        param27.value = "NONE"
        param27.displayOrder = 27

        param28 = ARCPY.Parameter(displayName="Number of Groups",
                                  name = "number_of_groups",
                                  datatype = "GPLong",
                                  parameterType = "Optional",
                                  direction = "Input")
        param28.category = "Validation Options"
        param28.filter.type = "Range"
        param28.filter.list = [2, 10]
        param28.value = 3
        param28.displayOrder = 28
        param28.enabled = False

        param29 = ARCPY.Parameter(displayName="Output Trained Model File",
                            name = "output_trained_model",
                            datatype = "DEFile",
                            parameterType = "Optional",
                            direction = "Output")
        param29.filter.list = ['ssm']


        self.lic = True
        if ARCPY.CheckExtension("spatial") != "Available":
            self.lic = False

        if self.lic:
            param1.filter.list = ["PRESENCE_AND_BACKGROUND_POINTS", "PRESENCE_ONLY_POINTS"]
        else:
            param1.filter.list = ["PRESENCE_AND_BACKGROUND_POINTS"]

        return [param0,param1,param2,param3, param4, param5, param6,param7,param8,
                param9,param10,param11,param12,param13,param14,param15, param16, 
                param17, param18, param19, param20, param21, param22, param23,
                param24, param25, param26, param27, param28, param29]

    def isLicensed(self):
        return True

    def populateField(self):
        if self.desc is not None:
            desc = self.desc
            try:
                self.inFields = UTILS.SSFieldsInfo(self.desc)
            except:
                self.inFields = None
                return 

    def getFieldType(self, row):
        """ Overwrite Categorical option for text fields 
        INPUT:
            row (list): Information value table [(field, bool)]
        """

        dat = ([self.inFields.fieldAlias(str(row[0].value)), False], False) \
               if row[1] in [ None, False, "#"] \
               else ([self.inFields.fieldAlias(str(row[0].value)), row[1]], True)

        #### If Field is Set as Categorical ####
        if dat[1]:
            return dat[0]

        #### If Field is String Then It is Considered Categorical (True) Overwrite User ####
        row = dat[0]
        if self.inFields:
            field = self.inFields.fieldAlias(row[0].name)

            if field is not None:
                fieldType = field.ftype

                if fieldType.upper() in ["TEXT","STRING"]:
                    return [field, True]

        return row

    def pv(self, value, id = None):
        from time import gmtime, strftime
        f= open(r"c:\temporal\tem.txt", "a")
        id = str(id)
        try:
            f.write(strftime("%Y-%m-%d %H:%M:%S", gmtime()) + " " + str(value) + " " + id +"\n") 
        except:
            f.write(strftime("%Y-%m-%d %H:%M:%S", gmtime()) + "--\n")
            pass
        f.close()

    def fcType(self, inputFC):
        try:
            self.desc = ARCPY.Describe(inputFC)
            self.populateField()
        except:
            pass

    def getDescribeF2P(self, inputFC):
        try:
            self.descF2P = ARCPY.Describe(inputFC)
            self.inFiedsF2P = UTILS.SSFieldsInfo(self.descF2P)
        except:
            pass

    def existInF2P(self, name):
        try:
            field = self.inFiedsF2P.fieldAlias(name)
            if field is not None:
                return field.name
        except:
            pass

        return None

    def replaceE(self, value, listR):
        for ele in listR:
            index = -1*len(ele)
            info  = value[index:]
            if value[index:] == ele:
                return value[:(index-1)], info
        return value, ""

    def getValuesVT(self, parameter, infoList = None, removePart = []):
        """ Get values from a value table parameter
        """
        info = parameter.valueAsText
        info = info.split(";")
        data  = []

        if infoList is not None:
            try:
                for id, opt in enumerate(info):
                    part = []
                    count = sum(map(lambda x : 1 if "'" in x else 0, opt ))
                    if count == 2:
                        part1 = opt.split("'")[1::2]
                        part2 = opt.replace(part1[0],"").replace("'","").strip()
                        part = [part1[0], infoList[id]]
                    elif count == 4:
                        part = opt.split("'")[1::2]
                        part[1] = infoList[id]
                    else:
                        part = opt.split(" ")
                        part[1] = infoList[id]
                    data.append(part)
            finally:
                return data
            return data
        else:
            data2 = []
            try:
                for opt1 in info:
                    opt, infov = self.replaceE(opt1, removePart)
                    part = []

                    count = sum(map(lambda x : 1 if "'" in x else 0, opt ))
                    if len(removePart) == 0:
                        count = sum(map(lambda x : 1 if "'" in x else 0, opt ))

                    if count == 2:
                        part1 = opt.split("'")[1::2]
                        part2 = opt.replace(part1[0],"").replace("'","").strip()
                        data.append(part1[0])

                        if not len(removePart):
                            data2.append(part2)
                        else:
                            data2.append(infov)

                    elif count == 4:
                        part = opt.split("'")[1::2]
                        data.append(part[0])
                        data2.append(part[1])

                    else:
                        part = opt.split(" ")
                        data.append(part[0])

                        if not len(removePart):
                            data2.append(part[1])
                        else:
                            data2.append(infov)

                return data, data2
            finally:
                return data, data2
            return data, data2
        return []

    def addFields(self, resamplingScheme, training = True):
        fieldNames = ["SOURCE_ID"]
        fieldTypes = []

        #### If Describe Exists Set Source ID Type to Input OID Type ####
        try:
            if self.desc.HasOID64:
                fieldTypes.append("BIGINTEGER")
            else:
                fieldTypes.append("LONG")
        except:
            fieldTypes.append("LONG")

        if training:
            fieldNames += ["PRESENCE", "OBSERVED", "PROB", "PROB_RANGE", "PREDICTED", "CLASSIFY"]
            fieldTypes += ["LONG", "TEXT", "DOUBLE", "TEXT", "LONG", "TEXT"]
            fieldAliases = [ARCPY.GetIDMessage(220125), ARCPY.GetIDMessage(220345), ARCPY.GetIDMessage(220348),
                            ARCPY.GetIDMessage(220346), ARCPY.GetIDMessage(220349), ARCPY.GetIDMessage(220347),
                            ARCPY.GetIDMessage(220350)]
            if resamplingScheme.value is not None:
                if resamplingScheme.valueAsText != "NONE":
                    fieldNames.append("CVGROUP")
                    fieldTypes.append("LONG")
                    fieldAliases.append(ARCPY.GetIDMessage(220351))
        else:
            fieldNames += ["PROB", "PREDICTED"]
            fieldTypes += ["DOUBLE", "LONG"]
            fieldAliases = [ARCPY.GetIDMessage(220125), ARCPY.GetIDMessage(220346), ARCPY.GetIDMessage(220347)]

        outFields = []
        for ind, fieldName in enumerate(fieldNames):
            newField = ARCPY.Field()
            newField.name = fieldName
            newField.type = fieldTypes[ind]
            newField.alias = fieldAliases[ind]
            outFields.append(newField)

        return outFields

    def updateParameters(self, parameters):
        inFeatures = parameters[0]
        containsBackground = parameters[1]
        presenceField = parameters[2]
        explanatoryVariables = parameters[3]
        distanceFeatures = parameters[4] 
        explanatoryRasters = parameters[5]
        basisExpansionFunction = parameters[6]
        numKnots = parameters[7]
        studyAreaType = parameters[8]
        studyAreaPolygon = parameters[9]
        doThinning = parameters[10]
        thinningDistanceBand = parameters[11]
        thinIter = parameters[12]
        relativeWeight = parameters[13]
        linkFunction = parameters[14]
        cutoff = parameters[15]
        outputTrainedFeatures = parameters[16]
        outputTrainedRaster = parameters[17]
        outputResponseTable = parameters[18]
        outputSensitivityTable = parameters[19]
        featuresToPredict = parameters[20]
        outputPredFeatures = parameters[21]
        outputPredRaster = parameters[22]
        explanatoryVariableMatching = parameters[23]
        explanatoryDistanceMatching = parameters[24]
        explanatoryRastersMatching = parameters[25]
        doExtrapolate = parameters[26]
        resamplingScheme = parameters[27]
        numSampleGroups = parameters[28]


        UTILS.validateOutputFile(parameters, 29, ".ssm")
        self.lic = True
        if ARCPY.CheckExtension("spatial") != "Available":
            self.lic = False

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        #### Set Cutoff to Default if Empty ####
        if cutoff.value is None:
            cutoff.value = .5
        elif cutoff.value < 0.01 or cutoff.value > 0.99:
            cutoff.setIDMessage("ERROR", 854, 0.01, 0.99)

        if not linkFunction.value:
            linkFunction.value = "CLOGLOG"

        if containsBackground.value:
            #### Base Variables ####
            seePar = [presenceField, explanatoryVariables, explanatoryVariableMatching,
                      distanceFeatures, explanatoryDistanceMatching,
                      featuresToPredict, outputPredFeatures]
            #### Hide Raster Output ####
            hidePar = [outputTrainedRaster, outputPredRaster, studyAreaType, studyAreaPolygon]
            if explanatoryVariables.value is None  and  distanceFeatures.value is None \
               and explanatoryRasters.value is not None:
                seePar += [outputPredRaster]
                hidePar = [outputTrainedRaster, studyAreaType, studyAreaPolygon]

            #### Enable/Disable Params ####
            enableParametersByVariable(seePar, hidePar)

        else:
            #### Presence Only Points ####
            seePar = [featuresToPredict, outputTrainedRaster, outputPredRaster, studyAreaType]

            #### Hide Params ####
            hidePar = [presenceField, explanatoryVariables, distanceFeatures, 
                       explanatoryVariableMatching, explanatoryDistanceMatching]

            #### Enable/Disable Params ####
            enableParametersByVariable(seePar, hidePar)

            #### Define the Extent for Study
            if not studyAreaType.value:
                studyAreaType.value = "CONVEX_HULL"
            else:
                if studyAreaType.value.upper() == "STUDY_POLYGON":
                    studyAreaPolygon.enabled = True
                else:
                    studyAreaPolygon.value = None
                    studyAreaPolygon.enabled = False

        if inFeatures.enabled and inFeatures.altered:
            if inFeatures.value:
                self.fcType(inFeatures.value)

        #### Create Presence Probability Output in the Trained Feature Class
        if outputTrainedFeatures.value and inFeatures.value:
            outputTrainedFeatures.schema.additionalFields = self.addFields(resamplingScheme, training = True)
            outputTrainedFeatures.symbology = OS.path.join(fullLayerPath, "POP_Uncertainty_Categories.lyrx")

        #### Create Presence Probability in the Output Feature Class
        if outputPredFeatures.value and inFeatures.value:
            outputPredFeatures.schema.additionalFields = self.addFields(resamplingScheme, training = False)
            outputPredFeatures.symbology = OS.path.join(fullLayerPath, "POP_Uncertainty_Categories.lyrx")
        
        if featuresToPredict.altered:
            if featuresToPredict.value:
                self.getDescribeF2P(featuresToPredict.value)

        if containsBackground.value:
            #### Match Explanatory Variables ####
            if featuresToPredict.value:
                try:
                    if explanatoryVariables.value:
                        isFilled = False

                        explaVNames = []

                        for i in explanatoryVariables.value:
                            val = str(i[0].value)
                            field = self.inFields.fieldAlias(val)
                            explaVNames.append(field)

                        if explanatoryVariableMatching.value:
                            matchV = explanatoryVariableMatching.value
                            tEmptyToPredictFields = [ i  for i in  matchV if i[0] is not None]
                            isFilled = len(tEmptyToPredictFields) == len(explaVNames)

                        if not isFilled:
                            explanatoryVariableMatching.value = [[self.existInF2P(i.name), str(i)] for id, i in enumerate(explaVNames)]
                        else:
                            values = []
                            if len(explaVNames):
                                for id, i in enumerate(explaVNames):
                                    v = matchV[id]
                                    ex = self.existInF2P(v[0].value)
                                    values.append([ex.name, str(i)])
                                explanatoryVariableMatching.value = values

                except:
                    pass

            #### Match Distance Features ####
            if not distanceFeatures.hasBeenValidated or containsBackground.altered:
                #### If Prediction Dataset is Provided
                if featuresToPredict.value is not None or outputPredRaster.value is not None:
                    #### Get Current Distance Features ####
                    if distanceFeatures.value:
                        distancesFCList = [pathDist.replace("'","") for pathDist in \
                                           str(distanceFeatures.value).split(";")]
                        #### Create Var to Fill Match. Dist Param ####
                        matchD = [[pathDist, pathDist] for pathDist in distancesFCList]

                        if explanatoryDistanceMatching.values is None:
                            #### Update Match Dist Par ####
                            explanatoryDistanceMatching.values = matchD
                        else:
                            #### Get Current List Matching Feature ####
                            values = explanatoryDistanceMatching.values
                            if len(values) == len(distancesFCList):
                                #### Replace New Selection ####
                                explanatoryDistanceMatching.values = self.getValuesVT(explanatoryDistanceMatching, distancesFCList)
                            else:
                                #### Update Using New List of Distance Features ###
                                matchD2 = matchD

                                if len(values) > 0:
                                    #### Get List Per Colummn in Value Table ####
                                    current2P, current2M = self.getValuesVT(explanatoryDistanceMatching)
                                    matchD2 = []

                                    #### Compare/Update With Previous Selection ####
                                    for base in matchD:
                                        if base[0] in current2M:
                                            matchD2.append([current2P[current2M.index(base[0])], base[0]])
                                        else:
                                            matchD2.append([base[0], base[1]])

                                #### Replace Matching Parameter ####
                                explanatoryDistanceMatching.values = matchD2

                    if distanceFeatures.value is None:
                        explanatoryDistanceMatching.value = None

        if containsBackground.value:
            #### Update Explanatory Variables - Check for TEXT fields ###
            v = []
            #### Fill Exp Variables - Checking Aliases ####
            try:
                for i in explanatoryVariables.value:
                    if i[0].value not in [None, '#', '']:
                        valueToInsert = self.getFieldType(i)
                        v.append([valueToInsert[0].name, valueToInsert[1]])
            except:
                pass
            explanatoryVariables.value = v

        #### Clean Matching Variables ####
        if explanatoryVariables.value is None:
            explanatoryVariableMatching.value = None

        #### Clean Matching Distances ####
        if distanceFeatures.value is None :
            explanatoryDistanceMatching.value = None

        expRaster = None
        matchExpRaster = None

        if explanatoryRasters.altered:
            expRaster = explanatoryRasters.valueAsText
            matchExpRaster = explanatoryRastersMatching.valueAsText

        if expRaster in ["", None]:
            explanatoryRastersMatching.value = None
        if distanceFeatures.value is None:
            explanatoryDistanceMatching.value = None

        #### Match Explanatory Rasters ####
        if featuresToPredict.value is not None or outputPredRaster.value is not None:
            if explanatoryRasters.altered or not explanatoryRasters.hasBeenValidated:
                try:
                    matchR = None
                    if expRaster not in ["", None]:
                        #### Get Current List Of Rasters ####
                        valueRasters, cats = self.getValuesVT(explanatoryRasters, removePart = ["#", "true", "false"])
                        #### Create Variable to Fill Match. Raster Param ####
                        matchR = [[pathR, pathR] for pathR in valueRasters]

                        if explanatoryRastersMatching.valueAsText in ["", None]:
                            #### Update Match Raster Par ####
                            explanatoryRastersMatching.values = matchR
                        else:
                            #### Get Current List Raster in the Match. Raster Parameter ####
                            values = explanatoryRastersMatching.valueAsText
                            values = values.split(";")

                            if len(values) == len(valueRasters):
                                #### Replace New Selection ####
                                explanatoryRastersMatching.values = self.getValuesVT(explanatoryRastersMatching, valueRasters)
                            else:
                                #### Update Using New Raster List ###
                                matchR2 = matchR
                                if len(values) > 0:
                                    #### Get List Per Colummn in Value Table ####
                                    current2PR, current2MR = self.getValuesVT(explanatoryRastersMatching)
                                    matchR2 = []

                                    #### Compare/Update With Previous Selection ####
                                    for base in matchR:
                                        if base[0] in current2MR:
                                            matchR2.append([current2PR[current2MR.index(base[0])], base[0]])
                                        else:
                                            matchR2.append([base[0], base[1]])
                                #### Replace Match Raster Parameter ####
                                explanatoryRastersMatching.values = matchR2
                except:
                    pass

        #### Add "tif" to Rasters in Folders ####
        if outputTrainedRaster.value:
            outputTrainedRaster.value = returnRasterPath(outputTrainedRaster)

        if outputPredRaster.value:
            outputPredRaster.value = returnRasterPath(outputPredRaster)

        #### Add "dbf" to Tables in Folders ####
        if outputSensitivityTable.value:
            outputSensitivityTable.value = returnTablePath(outputSensitivityTable)

        if outputResponseTable.value:
            outputResponseTable.value = returnTablePath(outputResponseTable)

        #### Update Basis Functions ####
        numVars = 0
        if explanatoryVariables.value:
            numVars += len(explanatoryVariables.valueAsText.split(";"))

        if explanatoryRasters.value:
            #### Get Current List Of Rasters ####
            valueRasters, cats = self.getValuesVT(explanatoryRasters, removePart = ["#", "true", "false"])
            numVars += len(valueRasters)

        if distanceFeatures.value:
            distancesFCList = [pathDist.replace("'","") for pathDist in distanceFeatures.valueAsText.split(";")]
            numVars += len(distancesFCList)


        #### Set MaxEnt Basis Funs ####
        if numVars > 1:
            basisExpansionFunction.filter.list = ["LINEAR", "QUADRATIC", "PRODUCT", "HINGE", "THRESHOLD"]
        else:
            basisExpansionFunction.filter.list = ["LINEAR", "QUADRATIC", "HINGE", "THRESHOLD"]

        #### Assure Linear if Empty ####
        if basisExpansionFunction.valueAsText is None:
            basisExpansionFunction.value = ["LINEAR"]
        else:
            #### Display Number of Knots for Hinge or Threshold
            basisFuns = basisExpansionFunction.valueAsText.split(";")

            if "HINGE" in basisFuns or "THRESHOLD" in basisFuns:
                numKnots.enabled = True
            else:
                numKnots.enabled = False

        #### Set Back to Default if Cleared ####
        if numKnots.enabled:
            if numKnots.value is None:
                numKnots.value = 10
            
        #### Control Spatial Thinning Parameter Input Display
        if doThinning.value:
            thinningDistanceBand.enabled = True
            thinIter.enabled = True
            if thinIter.value is None:
                thinIter.value = 10
            elif thinIter.value < 0 or thinIter.value > 50:
                thinIter.setIDMessage("ERROR", 854, 0, 50)
        else:
            thinningDistanceBand.enabled = False
            thinIter.enabled = False

        if resamplingScheme.value is not None:
            if resamplingScheme.valueAsText != "NONE":
                numSampleGroups.enabled = True
                if numSampleGroups.value is None:
                    numSampleGroups.value = 3
                elif numSampleGroups.value < 2 or numSampleGroups.value > 10:
                    numSampleGroups.setIDMessage("ERROR", 854, 2, 10)
            else:
                numSampleGroups.enabled = False
        else:
            resamplingScheme.value = "NONE"

        #### Set Output Symbology ####
        #if outputTrainedFeatures.value:
        #    outputTrainedFeatures.symbology = OS.path.join(fullLayerPath, "GGWR_Points.lyrx")

    def updateMessages(self, parameters):
        inFeatures = parameters[0]
        containsBackground = parameters[1]
        presenceField = parameters[2]
        explanatoryVariables = parameters[3]
        distanceFeatures = parameters[4] 
        explanatoryRasters = parameters[5]
        basisExpansionFunction = parameters[6]
        numKnots = parameters[7]
        studyAreaType = parameters[8]
        studyAreaPolygon = parameters[9]
        doThinning = parameters[10]
        thinningDistanceBand = parameters[11]
        thinIter = parameters[12]
        relativeWeight = parameters[13]
        linkFunction = parameters[14]
        cutoff = parameters[15]
        outputTrainedFeatures = parameters[16]
        outputTrainedRaster = parameters[17]
        outputResponseTable = parameters[18]
        outputSensitivityTable = parameters[19]
        featuresToPredict = parameters[20]
        outputPredFeatures = parameters[21]
        outputPredRaster = parameters[22]
        explanatoryVariableMatching = parameters[23]
        explanatoryDistanceMatching = parameters[24]
        explanatoryRastersMatching = parameters[25]
        doExtrapolate = parameters[26]
        resamplingScheme = parameters[27]
        numSampleGroups = parameters[28]
        ssmFile = parameters[29]

        if ssmFile.value is not None:
            UTILS.checkOutputPath(ssmFile.valueAsText,"FILE",["SSM"], ssmFile)

        basisFuns = basisExpansionFunction.valueAsText.split(";")

        if explanatoryRasters.hasError():
            if "800" in str(explanatoryRasters.message):
                if explanatoryRasters.value:
                    for i in explanatoryRasters.value:
                        val = str(i[1]).upper()
                        if val in ["#", "NONE", "FALSE", "TRUE", "NUMERIC", "CATEGORICAL"]:
                            explanatoryRasters.clearmessage()
                        else:
                            break

        #### Must Have At Least One Explanatory Raster When Using Presence Only ####
        if not containsBackground.value:
            if explanatoryRasters.value is None:
                explanatoryRasters.setIDMessage("ERROR", 530)
            ### To make study area polygon required
            if studyAreaType.value.upper() == "STUDY_POLYGON":
                if studyAreaPolygon.value is None:
                    studyAreaPolygon.setIDMessage("ERROR", 530)
                            
            ### Check matching explanatory raster for empty cells ###
            if explanatoryRastersMatching.value != None:
                for i in explanatoryRastersMatching.valueAsText.split(';'):
                    val = i.split(' ')[0]
                    if val == '#' or val == ' ':
                        explanatoryRastersMatching.setIDMessage("ERROR", 530)
        else:
            if presenceField.value is None:
                presenceField.setIDMessage("ERROR", 530)

        #### Warn Basis Funs do not apply to Cat Vars ####
        hasCatFields = UTILS.hasCatVar(3, parameters)
        hasCatRasters = False
        if explanatoryRasters.value:
            valueRasters, cats = self.getValuesVT(explanatoryRasters, removePart = ["#", "true", "false"])
            hasCatRasters = [v for v in cats if v.upper() == 'TRUE']
            if hasCatRasters:
                hasCatRasters = True
            else:
                hasCatRasters = False

        if hasCatFields or hasCatRasters:
            basisExpansionFunction.setIDMessage("WARNING", 110409)

        #### Duplicate Checks ####
        if containsBackground.value:
            #### Can't Have Repeated Explanatory Variables ####
            if explanatoryVariables.value:
                repeatedInItself, compareOther = checkRepeated(explanatoryVariables.value, 0)
                if repeatedInItself is not None:
                    explanatoryVariables.setIDMessage("ERROR", 110182, repeatedInItself)

            if explanatoryVariableMatching.value:
                for i in explanatoryVariableMatching.valueAsText.split(';'):
                    val = i.split(' ')[0] #str(i[0].value)
                    if val == '#' or val =='':
                        explanatoryVariableMatching.setIDMessage("ERROR", 530)

            #### Can't Have Repeated Distance Features ####
            if distanceFeatures.value:
                repeatedInItself, compareOther = checkRepeated(distanceFeatures.value, 0)
                if repeatedInItself is not None:
                    distanceFeatures.setIDMessage("ERROR", 110182, repeatedInItself)

        #### Can't Have Same Raster Twice ####
        if explanatoryRasters.altered:
            if explanatoryRasters.value:
                repeatedInItself, compareOther = checkRepeated(explanatoryRasters.value, 0)
                if repeatedInItself is not None:
                    explanatoryRasters.setIDMessage("ERROR", 110182, repeatedInItself)

        #### Conditionally Required Output(s) ####
        if featuresToPredict.value is not None and outputPredFeatures.value is None:
            outputPredFeatures.setIDMessage("ERROR", 530)

        if doThinning.value:
            if thinningDistanceBand.value is None:
                thinningDistanceBand.setIDMessage("ERROR", 530)
            if thinIter.value is None:
                thinIter.setIDMessage("ERROR", 530)

        #### Assure Output Locations Exist ####
        outVarList = [outputTrainedFeatures]
        outVarList.append(outputTrainedRaster)
        outVarList.append(outputResponseTable)
        outVarList.append(outputSensitivityTable)
        outVarList.append(outputPredFeatures)
        outVarList.append(outputPredRaster)

        for par in outVarList:
            if par.value:
                outPath, outName = OS.path.split(par.valueAsText)
                if not ARCPY.Exists(outPath):
                    par.setIDMessage("ERROR", 210, par.value.value)

        if not containsBackground.value:
            if "HINGE" in basisFuns:
                basisExp = ARCPY.GetIDMessage(220301)
                basisExpansionFunction.setIDMessage("WARNING", 220297, basisExp)
            elif "THRESHOLD" in basisFuns:
                basisExp = ARCPY.GetIDMessage(220302)
                basisExpansionFunction.setIDMessage("WARNING", 220297, basisExp)

        if "HINGE" in basisFuns and "THRESHOLD" in basisFuns:
            basisExpansionFunction.setIDMessage("ERROR", 110414)

        if linkFunction.value.upper() == "LOGISTIC":
            if relativeWeight.value != 1:
                linkFunction.setIDMessage("WARNING", 110446)
                
        checkRequired = explanatoryRasters.value is not None and \
                       (outputPredFeatures.value is not None or outputPredRaster.value is not None)
        allowBandInVT(explanatoryRastersMatching, checkRequired )

        #### Check for Unsupportd Raster Types ####
        rasterNotSupported = isImageService(explanatoryRasters)
        if rasterNotSupported:
            explanatoryRasters.setIDMessage("ERROR", 110213)

        if explanatoryRastersMatching.value is not None:
            rasterNotSupported = isImageService(explanatoryRastersMatching)
            if rasterNotSupported:
                explanatoryRastersMatching.setIDMessage("ERROR", 110213)
        return


    def execute(self, parameters, messages):
        import SSPresenceOnlyPrediction as POP
        POP.executePOP(parameters, messages)


class MGWR(object):
    def __init__(self):
        self.label = "Multiscale Geographically Weighted Regression (MGWR)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060014
        self.shapeType = None
        #### Define Default Parameters ####
        self.defaultIndexList = [2, 26]
        self.defaultValueList = ["CONTINUOUS", "BISQUARE"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Dependent Variable",
                                 name="dependent_variable",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param1.parameterDependencies = ["in_features"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Model Type",
                                 name="model_type",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.type = "ValueList"
        param2.filter.list = ["CONTINUOUS"]
        param2.value = "CONTINUOUS"
        param2.enabled = False
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Explanatory Variable(s)",
                                 name="explanatory_variables",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input",
                                 multiValue=True)

        param3.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        param3.controlCLSID = "{C15EC6FA-35EF-4204-90FB-01E7B4DD6862}"
        param3.parameterDependencies = ["in_features"]
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")
        param4.displayOrder = 5


        param5 = ARCPY.Parameter(displayName="Neighborhood Type",
                                 name="neighborhood_type",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["NUMBER_OF_NEIGHBORS", "DISTANCE_BAND"]
        param5.displayOrder = 6

        param6 = ARCPY.Parameter(displayName="Neighborhood Selection Method",
                                 name="neighborhood_selection_method",
                                 datatype="GPString",
                                 parameterType="Required",
                                 direction="Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ["GOLDEN_SEARCH", "GRADIENT_SEARCH",
                              "MANUAL_INTERVALS", "USER_DEFINED"]
        param6.displayOrder = 7

        #### Optimized (Optional) / Manual (Required) ####
        param7 = ARCPY.Parameter(displayName="Minimum Number of Neighbors",
                                 name="minimum_number_of_neighbors",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param7.enabled = False
        param7.displayOrder = 8

        #### Optimized (Optional) ####
        param8 = ARCPY.Parameter(displayName="Maximum Number of Neighbors",
                                 name="maximum_number_of_neighbors",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param8.enabled = False
        param8.displayOrder = 9

        #### Optimized (Optional) / Manual (Required) ####
        param9 = ARCPY.Parameter(displayName="Distance Unit",
                                 name="distance_unit",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param9.filter.list = upperSupportDist
        param9.enabled = False
        param9.displayOrder = 10

        #### Optimized (Optional) / Manual (Required) ####
        param10 = ARCPY.Parameter(displayName="Minimum Search Distance",
                                 name="minimum_search_distance",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 direction="Input")
        param10.enabled = False
        param10.displayOrder = 11

        #### Optimized (Optional) ####
        param11 = ARCPY.Parameter(displayName="Maximum Search Distance",
                                  name="maximum_search_distance",
                                  datatype="GPDouble",
                                  parameterType="Optional",
                                  direction="Input")
        param11.enabled = False
        param11.displayOrder = 12

        #### Manual (Required) ####
        param12 = ARCPY.Parameter(displayName="Number of Neighbors Increment",
                                  name="number_of_neighbors_increment",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        # param12.filter.type = "Range"
        # param12.filter.list = [1, 500]
        param12.enabled = False
        param12.displayOrder = 13


        #### Manual (Required) ####
        param13 = ARCPY.Parameter(displayName="Search Distance Increment",
                                  name="search_distance_increment",
                                  datatype="GPDouble",
                                  parameterType="Optional",
                                  direction="Input")
        param13.enabled = False
        param13.displayOrder = 14

        #### Manual (Required) ####
        param14 = ARCPY.Parameter(displayName="Number of Increments",
                                  name="number_of_increments",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param14.filter.type = "Range"
        param14.filter.list = [2, 20]
        param14.enabled = False
        param14.displayOrder = 15

        #### User Defined with Number of Neighbors Parameters (Required) ####
        param15 = ARCPY.Parameter(displayName="Number of Neighbors",
                                  name="number_of_neighbors",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param15.enabled = False
        param15.displayOrder = 16

        #### User Defined with Distance Band Parameters (Required) ####
        param16 = ARCPY.Parameter(displayName="Distance Band",
                                  name="distance_band",
                                  datatype="GPDouble",
                                  parameterType="Optional",
                                  direction="Input")
        param16.enabled = False
        param16.displayOrder = 17

        #### Customized Search Options ####
        param17 = ARCPY.Parameter(displayName="Number of Neighbors for Golden Search",
                                  name="number_of_neighbors_golden",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param17.parameterDependencies = [param0.name]
        param17.columns = [['Field', 'Explanatory Variable'],
                           ['GPLong', 'Minimum Number of Neighbors'],
                           ['GPLong', 'Maximum Number of Neighbors']]
        param17.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        # param17.filters[1].type = "Range"
        # param17.filters[1].list = [2, 999]
        # param17.filters[2].type = "Range"
        # param17.filters[2].list = [3, 1000]
        param17.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param17.enabled = False
        param17.category = "Customized Neighborhood Options"
        param17.displayOrder = 18

        param18 = ARCPY.Parameter(displayName="Number of Neighbors for Manual Intervals",
                                  name="number_of_neighbors_manual",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param18.parameterDependencies = [param0.name]
        param18.columns = [['Field', 'Explanatory Variable'],
                           ['GPLong', 'Minimum Number of Neighbors'],
                           ['GPLong', 'Number of Neighbors Increment'],
                           ['GPLong', 'Number of Increments']]
        param18.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        # param18.filters[1].type = "Range"
        # param18.filters[1].list = [2, 999]
        # param18.filters[2].type = "Range"
        # param18.filters[2].list = [1, 500]
        # param18.filters[3].type = "Range"
        # param18.filters[3].list = [2, 20]
        param18.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param18.enabled = False
        param18.category = "Customized Neighborhood Options"
        param18.displayOrder = 19

        param19 = ARCPY.Parameter(displayName="User Defined Number of Neighbors",
                                  name="number_of_neighbors_defined",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param19.parameterDependencies = [param0.name]
        param19.columns = [['Field', 'Explanatory Variable'],
                           ['GPLong', 'Number of Neighbors']]
        param19.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        # param19.filters[1].type = "Range"
        # param19.filters[1].list = [2, 1000]
        param19.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param19.enabled = False
        param19.category = "Customized Neighborhood Options"
        param19.displayOrder = 20

        param20 = ARCPY.Parameter(displayName="Search Distance for Golden Search",
                                  name="distance_golden",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param20.parameterDependencies = [param0.name]
        param20.columns = [['Field', 'Explanatory Variable'],
                           ['GPDouble', 'Minimum Search Distance'],
                           ['GPDouble', 'Maximum Search Distance']]
        param20.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param20.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param20.enabled = False
        param20.category = "Customized Neighborhood Options"
        param20.displayOrder = 22

        param21 = ARCPY.Parameter(displayName="Search Distance for Manual Intervals",
                                  name="distance_manual",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param21.parameterDependencies = [param0.name]
        param21.columns = [['Field', 'Explanatory Variable'],
                           ['GPDouble', 'Minimum Search Distance'],
                           ['GPDouble', 'Search Distance Increment'],
                           ['GPLong', 'Number of Increments']]
        param21.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param21.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param21.enabled = False
        param21.category = "Customized Neighborhood Options"
        param21.displayOrder = 23

        param22 = ARCPY.Parameter(displayName="User Defined Search Distance",
                                  name="distance_defined",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param22.parameterDependencies = [param0.name]
        param22.columns = [['Field', 'Explanatory Variable'],
                           ['GPDouble', 'Distance Band']]
        param22.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param22.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param22.enabled = False
        param22.category = "Customized Neighborhood Options"
        param22.displayOrder = 24

        #### Prediction ####
        param23 = ARCPY.Parameter(displayName="Prediction Locations",
                                  name="prediction_locations",
                                  datatype="GPFeatureLayer",
                                  parameterType="Optional",
                                  direction="Input")
        param23.filter.list = ['Point', 'Polygon']
        param23.category = "Prediction Options"
        param23.displayOrder = 26

        param24 = ARCPY.Parameter(displayName="Explanatory Variables to Match",
                                  name="explanatory_variables_to_match",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param24.parameterDependencies = [param23.name]
        param24.columns = [['GPString', 'Field From Input Features'],
                           ['Field', 'Field From Prediction Locations']]
        param24.columns = [['Field', 'Field From Prediction Locations'],
                           ['GPString', 'Field From Input Features']]
        param24.filters[1].type = "ValueList"
        param24.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param24.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param24.category = "Prediction Options"
        param24.displayOrder = 27

        param25 = ARCPY.Parameter(displayName="Output Predicted Features",
                                  name="output_predicted_features",
                                  datatype="DEFeatureClass",
                                  parameterType="Optional",
                                  direction="Output")
        param25.category = "Prediction Options"
        param25.displayOrder = 28

        param26 = ARCPY.Parameter(displayName="Robust Prediction",
                                  name="robust_prediction",
                                  datatype='GPBoolean',
                                  parameterType="Optional",
                                  direction="Input")
        param26.filter.list = ['ROBUST', 'NON_ROBUST']
        param26.value = True
        param26.category = "Prediction Options"
        param26.displayOrder = 29

        #### Additional Options ####
        param27 = ARCPY.Parameter(displayName="Local Weighting Scheme",
                                  name="local_weighting_scheme",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param27.filter.type = "ValueList"
        param27.filter.list = ['GAUSSIAN', 'BISQUARE']
        param27.value = 'BISQUARE'
        param27.category = "Additional Options"
        param27.displayOrder = 30

        param28 = ARCPY.Parameter(displayName="Output Neighborhood Table",
                                 name="output_table",
                                 datatype="DETable",
                                 parameterType="Optional",
                                 direction="Output")
        param28.category = "Additional Options"
        param28.displayOrder = 31

        param29 = ARCPY.Parameter(displayName="Coefficient Raster Workspace",
                                  name="coefficient_raster_workspace",
                                  datatype="DEWorkspace",
                                  parameterType="Optional",
                                  direction="Input")
        param29.category = "Additional Options"
        param29.displayOrder = 32
        #### Must Have Advanced License for Coef Rasters ####
        if not checkLicense():
            param29.enabled = False

        param30 = ARCPY.Parameter(displayName="Scale Data",
                                  name="scale",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")
        param30.filter.list = ['SCALE_DATA', 'NO_SCALE_DATA']
        param30.value = True
        param30.displayOrder = 4

        param31 = ARCPY.Parameter(displayName="Coefficient Raster Layers",
                                  name="coefficient_raster_layers",
                                  datatype="GPRasterLayer",
                                  parameterType="Derived",
                                  direction="Output",
                                  multiValue=True)
        param31.displayOrder = 33

        param32 = ARCPY.Parameter(displayName="Output Layer Group",
                                 name="output_layer_group",
                                 datatype="GPGroupLayer",
                                 parameterType="Derived",
                                 direction="Output")
        param32.displayOrder = 34

        #### Customized Search Options ####
        param33 = ARCPY.Parameter(displayName="Number of Neighbors for Gradient Search",
                                  name="number_of_neighbors_gradient",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param33.parameterDependencies = [param0.name]
        param33.columns = [['Field', 'Explanatory Variable'],
                           ['GPLong', 'Minimum Number of Neighbors'],
                           ['GPLong', 'Maximum Number of Neighbors']]
        param33.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param33.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param33.enabled = False
        param33.category = "Customized Neighborhood Options"
        param33.displayOrder = 21

        param34 = ARCPY.Parameter(displayName="Search Distance for Gradient Search",
                                  name="distance_gradient",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param34.parameterDependencies = [param0.name]
        param34.columns = [['Field', 'Explanatory Variable'],
                           ['GPDouble', 'Minimum Search Distance'],
                           ['GPDouble', 'Maximum Search Distance']]
        param34.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param34.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param34.enabled = False
        param34.category = "Customized Neighborhood Options"
        param34.displayOrder = 25


        return [param0, param1, param2, param3, param4, param5, param6,
                param7, param8, param9, param10, param11, param12,
                param13, param14, param15, param16, param17, param18,
                param19, param20, param21, param22,
                param23, param24, param25, param26, param27, param28, param29,
                param30, param31, param32, param33, param34]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        import shlex
        import SSMGWR as MGWR
        if parameters[2].value != "CONTINUOUS":
            parameters[2].value = "CONTINUOUS"

        #### Add Deleted Parameter Values to Defaults
        reassignDefaults(parameters, self.defaultIndexList, self.defaultValueList)

        desc = None
        modelType = parameters[2].value
        if parameters[0].altered or parameters[2].altered:
            try:
                desc = ARCPY.Describe(parameters[0].value)
                shapeType = desc.ShapeType.upper()
                outLYR = ""
                if modelType == "CONTINUOUS":
                    if shapeType == "POINT":
                        outLYR = "GWR_Points.lyrx"
                    if shapeType == "POLYGON":
                        outLYR = "GWR_Polygons.lyrx"
                else:
                    if shapeType == "POINT":
                        outLYR = "GGWR_Points.lyrx"
                    if shapeType == "POLYGON":
                        outLYR = "GGWR_Polygons.lyrx"
                parameters[4].symbology = OS.path.join(fullLayerPath, outLYR)
            except:
                pass

        #### Neighborhood Search Options ####
        param5 = parameters[5].value
        param6 = parameters[6].value

        if param6 =="GRADIENT_SEARCH":
            parameters[27].filter.list = ['BISQUARE']
        else:
            parameters[27].filter.list = ['GAUSSIAN', 'BISQUARE']

        if param5 and param6:
            if param5 == "NUMBER_OF_NEIGHBORS":
                parameters[6].filter.list = ["GOLDEN_SEARCH", "GRADIENT_SEARCH", "MANUAL_INTERVALS", "USER_DEFINED"]

                #### Min/Max Distance ####
                clearParameter(parameters[10])
                clearParameter(parameters[11])
                clearParameter(parameters[13])

                #### User Dist/SWM ####
                clearParameter(parameters[16])

                if param6 in ["GOLDEN_SEARCH", "GRADIENT_SEARCH", "MANUAL_INTERVALS"]:
                    #### User Provided ####
                    clearParameter(parameters[15])

                    #### Min KNN ####
                    parameters[7].enabled = True

                    if param6 == "MANUAL_INTERVALS":
                        #### Max KNN ####
                        clearParameter(parameters[8])

                        #### Number of KNN/Increments ####
                        parameters[12].enabled = True
                        parameters[14].enabled = True
                    else:
                        #### Max KNN ####
                        parameters[8].enabled = True

                        #### Number of KNN/Increments ####
                        clearParameter(parameters[12])
                        clearParameter(parameters[14])

                else:
                    #### User Provided ####
                    parameters[15].enabled = True
                    clearParameter(parameters[7])
                    clearParameter(parameters[8])
                    clearParameter(parameters[12])
                    clearParameter(parameters[14])

                #### Deal with the individual variables ####
                clearParameter(parameters[20])
                clearParameter(parameters[21])
                clearParameter(parameters[22])
                clearParameter(parameters[34])
                if param6 == "GOLDEN_SEARCH":
                    parameters[17].enabled = True
                    clearParameter(parameters[18])
                    clearParameter(parameters[19])
                    clearParameter(parameters[33])
                elif param6 == "MANUAL_INTERVALS":
                    parameters[18].enabled = True
                    clearParameter(parameters[17])
                    clearParameter(parameters[19])
                    clearParameter(parameters[33])
                elif param6 == "USER_DEFINED":
                    parameters[19].enabled = True
                    clearParameter(parameters[17])
                    clearParameter(parameters[18])
                    clearParameter(parameters[33])
                else:  # GRADIENT_SEARCH
                    parameters[33].enabled = True
                    clearParameter(parameters[17])
                    clearParameter(parameters[18])
                    clearParameter(parameters[19])

            if param5 == "DISTANCE_BAND":
                parameters[6].filter.list = ["GOLDEN_SEARCH", "GRADIENT_SEARCH", "MANUAL_INTERVALS", "USER_DEFINED"]

                #### Min/Max KNN ####
                clearParameter(parameters[7])
                clearParameter(parameters[8])
                clearParameter(parameters[12])

                #### User KNN/SWM ####
                clearParameter(parameters[15])

                if param6 in ["GOLDEN_SEARCH", "GRADIENT_SEARCH", "MANUAL_INTERVALS"]:
                    #### User Provided ####
                    clearParameter(parameters[16])

                    #### Min Distance ####
                    parameters[10].enabled = True

                    if param6 == "MANUAL_INTERVALS":
                        #### Max Distance ####
                        clearParameter(parameters[11])

                        #### Number of Distance/Increments ####
                        parameters[13].enabled = True
                        parameters[14].enabled = True
                    else:
                        #### Max Distance ####
                        parameters[11].enabled = True

                        #### Number of Distance/Increments ####
                        clearParameter(parameters[13])
                        clearParameter(parameters[14])

                else:
                    #### User Provided ####
                    parameters[16].enabled = True
                    clearParameter(parameters[10])
                    clearParameter(parameters[11])
                    clearParameter(parameters[13])
                    clearParameter(parameters[14])

                #### Deal with the individual variables ####
                clearParameter(parameters[17])
                clearParameter(parameters[18])
                clearParameter(parameters[19])
                clearParameter(parameters[33])
                if param6 == "GOLDEN_SEARCH":
                    parameters[20].enabled = True
                    clearParameter(parameters[21])
                    clearParameter(parameters[22])
                    clearParameter(parameters[34])
                elif param6 == "MANUAL_INTERVALS":
                    parameters[21].enabled = True
                    clearParameter(parameters[20])
                    clearParameter(parameters[22])
                    clearParameter(parameters[34])
                elif param6 == "USER_DEFINED":
                    parameters[22].enabled = True
                    clearParameter(parameters[20])
                    clearParameter(parameters[34])
                    clearParameter(parameters[21])
                else:
                    parameters[34].enabled = True
                    clearParameter(parameters[20])
                    clearParameter(parameters[21])
                    clearParameter(parameters[22])

            #### Update the values in customized search table according to the independent variables selected ####
            param_idv_num = 0
            for pid in [17, 18, 19, 20, 21, 22, 33, 34]:
                if parameters[pid].enabled:
                    param_idv_num = pid
            if param_idv_num:
                param_idv = parameters[param_idv_num]

                num_col = len(param_idv.columns)
                indVarNames = []
                if UTILS.getTextParameter(3, parameters) is not None:
                    indVarNames = UTILS.getTextParameter(3, parameters).split(";")

                param_idv_val = {}
                for vn in indVarNames:
                    param_idv_val[vn] = [vn] + [None] * (num_col - 1)
                if param_idv.value is not None:
                    textValues = param_idv.valueAsText.split(";")
                    for rowInd, row in enumerate(param_idv.value):
                        vn = row[0].value
                        if vn in indVarNames:
                            textValuesRow = shlex.split(textValues[rowInd])
                            rowToKeep = []
                            for colInd, col in enumerate(row):
                                if type(col) in [int, float]:
                                    if textValuesRow[colInd] == "#":
                                        rowToKeep.append(None)
                                    else:
                                        rowToKeep.append(col)
                                else:
                                    rowToKeep.append(col.value)
                            param_idv_val[vn] = rowToKeep
                valCol = []
                for vn in indVarNames:
                    if vn in param_idv_val:
                        valCol.append(param_idv_val[vn])
                param_idv.value = valCol

        if not parameters[3].value or not parameters[23].value:
            # remove all the items in the predict items
            parameters[24].value = None

        #### Match Input / Prediction Fields ####
        if paramChanged(parameters[3]) or paramChanged(parameters[23]):
            param_predFC = parameters[23].value
            param3 = parameters[3].value
            if param3 and param_predFC:
                #### Set Default Matches (Only on First Attempt) ####
                indVars = parameters[3].valueAsText.split(";")
                try:
                    desc = ARCPY.Describe(param_predFC)
                    nameAliasMapPredFC = dict()
                    for fieldObj in desc.fields:
                        nameAliasMapPredFC[fieldObj.name] = fieldObj.aliasName
                    vtList = matchVariables(indVars, desc)
                    nameAliasMapInputFC = dict()
                    desc = ARCPY.Describe(parameters[0].value)
                    for fieldObj in desc.fields:
                        nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
                    for pair in vtList:
                        pair[1] = nameAliasMapInputFC[pair[1]]
                    if parameters[24].value:
                        #### Keep the Already Existing Fields Selected by User ####
                        existingMatchPairs = dict()
                        for vtRow in parameters[24].value:
                            predField = vtRow[0].value
                            indFieldAlias = vtRow[1]
                            if indFieldAlias not in existingMatchPairs:
                                existingMatchPairs[indFieldAlias] = predField
                        for pair in vtList:
                            if pair[1] in existingMatchPairs:
                                pair[0] = existingMatchPairs[pair[1]]
                    parameters[24].value = vtList
                except:
                    pass

        #### Robust Prediction ####
        if paramChanged(parameters[2]):
            if parameters[2].value != "CONTINUOUS":
                parameters[26].enabled = False
                parameters[26].value = False
            else:
                parameters[26].enabled = True

        #### Attach the Field Names to Output FC and Prediction FC for Model Builder####
        if parameters[0].value and parameters[1].value and \
                parameters[3].value and parameters[4].value and \
                parameters[5].value and parameters[6].value:
            try:
                outPath, outName = OS.path.split(UTILS.getTextParameter(4, parameters))
                if ARCPY.Exists(outPath):
                    outputFCFields = MGWR.MGWR.getOutputFCFields(
                        UTILS.getTextParameter(0, parameters),
                        UTILS.getTextParameter(4, parameters),
                        UTILS.getTextParameter(1, parameters).upper(),
                        UTILS.getTextParameter(3, parameters).upper().split(";"),
                        parameters[30].value)
                    parameters[4].schema.additionalFields = outputFCFields
                else:
                    parameters[4].schema.additionalFields = []
            except:
                parameters[4].schema.additionalFields = []
        else:
            parameters[4].schema.additionalFields = []
        if parameters[0].value and parameters[1].value and \
                parameters[3].value and parameters[4].value and \
                parameters[5].value and parameters[6].value and \
                parameters[23].value and parameters[24].value and \
                parameters[25].value:
            try:
                outPath, outName = OS.path.split(UTILS.getTextParameter(25, parameters))
                if ARCPY.Exists(outPath):
                    predictFCFields = MGWR.MGWR.getPredictFCFields(UTILS.getTextParameter(1, parameters).upper(),
                                                                   UTILS.getTextParameter(0, parameters),
                                                                   UTILS.getTextParameter(23, parameters),
                                                                   UTILS.getTextParameter(25, parameters),
                                                                   parameters[24].value,
                                                                   parameters[30].value)
                    parameters[25].schema.additionalFields = predictFCFields
            except:
                parameters[25].schema.additionalFields = []
        else:
            parameters[25].schema.additionalFields = []

        if not parameters[27].value:
            parameters[27].value = "BISQUARE"

        param_tableOut = parameters[28]
        if param_tableOut.value:
            #### Check/Update Extension of Output Table Parameters ####
            tableCheck(param_tableOut, True)

        #### Add Derived Raster Layers for Model Builder ####
        param_rasterOut = parameters[31]
        if parameters[29].value:
            if parameters[3].value and parameters[4].value:
                indVars = parameters[3].valueAsText.split(";")
                outputFC = parameters[4].value.value
                outPath, outName = OS.path.split(UTILS.getTextParameter(4, parameters))
                try:
                    if ARCPY.Exists(outPath):
                        outRasters, layerNames, ext, delRaster = MGWR.MGWR.makeDerivedRasterLayers(indVars, outputFC,
                                                                        UTILS.getTextParameter(29, parameters),
                                                                        parameters[30].value, True)
                        param_rasterOut.value = outRasters
                    else:
                        param_rasterOut.value = None
                except:
                    param_rasterOut.value = None
        else:
            param_rasterOut.value = None

        return

    def getInputDistUnit(self, inParam, unitParam):
        try:
            info = ARCPY.Describe(inParam.valueAsText)
            inputSpatRef = info.SpatialReference
            if inputSpatRef is None or inputSpatRef.name.upper()=="UNKNOWN":
                inParam.setIDMessage("ERROR", 517)
                return
            if unitParam.enabled:
                spatialRefType = inputSpatRef.type
                if spatialRefType.upper() == "GEOGRAPHIC":
                    useChordal = True
                else:
                    useChordal = False
                distanceInfo = UTILS.DistanceInfo(inputSpatRef, useChordalDistances=useChordal)
                inputUnitName = str(distanceInfo.name).upper()
                unitDistMap = {
                    "FEET": "FEET",
                    "FOOT": "FEET",
                    "FOOT_US": "FEET",
                    "US_FOOT": "FEET",
                    "US_FEET": "FEET",
                    "METER": "METERS",
                    "METERS": "METERS",
                    "KILOMETERS": "KILOMETERS",
                    "KILOMETER": "KILOMETERS",
                    "MILES": "MILES",
                    "MILE": "MILES",
                }
                unitParam.filter.list = upperSupportDist
                unitParamValueUpper = unitParam.value
                if unitParamValueUpper is not None:
                    unitParamValueUpper = unitParamValueUpper.upper()
                if unitParamValueUpper in upperSupportDist:
                    unitParam.value = unitParamValueUpper
                else:
                    if inputUnitName in unitDistMap:
                        unitParam.value = unitDistMap[inputUnitName]
                    else:
                        unitParam.value = None
                        unitParam.setIDMessage("ERROR", 530)
        except:
            return

    def updateMessages(self, parameters):
        #### Optional to Required Parameter Messages ####
        import locale as LOCALE

        paramDep = parameters[1]
        paramInd = parameters[3]
        if paramDep.value and paramInd.value:
            depVar = paramDep.valueAsText
            indVars = paramInd.valueAsText.split(";")
            if depVar in indVars:
                paramInd.setIDMessage("ERROR", 110182, depVar)

        param5 = parameters[5].value
        param6 = parameters[6].value
        if param5 and param6:
            if param5 == "NUMBER_OF_NEIGHBORS":
                clearParameter(parameters[9])
            else:
                parameters[9].enabled = True

            if param6 == "MANUAL_INTERVALS":
                if param5 == "NUMBER_OF_NEIGHBORS":
                    #### Minimum Number of Neighs ####
                    if parameters[7].value is None:
                        parameters[7].setIDMessage("ERROR", 110161)
                    else:
                        positiveParam = parameters[7]
                        if positiveParam.value is not None and positiveParam.value <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                    #### Number of Neighs Increment ####
                    if parameters[12].value is None:
                        parameters[12].setIDMessage("ERROR", 110162)
                    else:
                        positiveParam = parameters[12]
                        if positiveParam.value is not None and positiveParam.value <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                else:
                    #### Minimum Distance ####
                    if parameters[10].value is None:
                        parameters[10].setIDMessage("ERROR", 110163)
                    else:
                        positiveParam = parameters[10]
                        if positiveParam.value is not None and positiveParam.value <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                    #### Distance Increment ####
                    if parameters[13].value is None:
                        parameters[13].setIDMessage("ERROR", 110164)
                    else:
                        positiveParam = parameters[13]
                        if positiveParam.value is not None and positiveParam.value <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                #### Number of Increments ####
                if parameters[14].value is None:
                    parameters[14].setIDMessage("ERROR", 110165)

            elif param6 == "USER_DEFINED":
                if param5 == "NUMBER_OF_NEIGHBORS":
                    #### Number of Neighs ####
                    if parameters[15].value is None:
                        parameters[15].setIDMessage("ERROR", 110166)
                    else:
                        positiveParam = parameters[15]
                        if positiveParam.value is not None and positiveParam.value <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

                else:
                    #### Distance Band ####
                    if parameters[16].value is None:
                        parameters[16].setIDMessage("ERROR", 110167)
                    else:
                        positiveParam = parameters[16]
                        if positiveParam.value is not None and positiveParam.value <= 0:
                            positiveParam.setIDMessage("ERROR", 531)

            elif param6 in ["GOLDEN_SEARCH", "GRADIENT_SEARCH"]:
                if param5 == "NUMBER_OF_NEIGHBORS":
                    #### Minimum Number of Neighs < Maximum ####
                    if parameters[7].value and parameters[8].value:
                        if parameters[7].value >= parameters[8].value:
                            parameters[7].setIDMessage("ERROR", 110223)

                else:
                    #### Minimum Distance < Maximum ####
                    if parameters[10].value and parameters[11].value:
                        if parameters[10].value >= parameters[11].value:
                            parameters[10].setIDMessage("ERROR", 110224)

                    positiveParam = parameters[10]
                    if positiveParam.value is not None and positiveParam.value <= 0:
                        positiveParam.setIDMessage("ERROR", 531)

                    positiveParam = parameters[11]
                    if positiveParam.value is not None and positiveParam.value <= 0:
                        positiveParam.setIDMessage("ERROR", 531)

        if not parameters[3].hasError():
            indVarNames = UTILS.getTextParameter(3, parameters).upper().split(";")
            floorKNN = max(5, len(indVarNames) + 1)
            if parameters[7].enabled and parameters[7].value is not None:
                if parameters[7].value < floorKNN:
                    parameters[7].setIDMessage("ERROR", 110475, floorKNN)
                if parameters[8].enabled and parameters[8].value is not None:
                    if parameters[8].value < parameters[7].value:
                        parameters[7].setIDMessage("ERROR", 110223)
            if parameters[8].enabled and parameters[8].value is not None:
                if parameters[8].value < floorKNN + 1:
                    parameters[8].setIDMessage("ERROR", 110476, (floorKNN + 1))


            if parameters[15].enabled and parameters[15].value is not None:
                if parameters[15].value < floorKNN:
                    parameters[15].setIDMessage("ERROR", 110477, floorKNN)

        if parameters[0].altered:
            self.getInputDistUnit(parameters[0], parameters[9])

        #### Matching VT Errors ####
        if parameters[23].value and parameters[3].value and parameters[0].value:
            createVT = False
            try:
                descInputFC = ARCPY.Describe(parameters[0].value)
                fields = descInputFC.fields
                createVT = True
            except:
                pass

            if parameters[4].value and parameters[25].value:
                if parameters[4].valueAsText == parameters[25].valueAsText:
                    parameters[25].setIDMessage("ERROR", 110497)

            if createVT:
                aliasNameMapInputFC = dict()
                nameAliasMapInputFC = dict()
                for fieldObj in fields:
                    aliasNameMapInputFC[fieldObj.aliasName] = fieldObj.name
                    nameAliasMapInputFC[fieldObj.name] = fieldObj.aliasName
                predFields = []
                inFieldAliases = []
                missingMatch = []
                if parameters[24].value:
                    for vtRow in parameters[24].value:
                        predField = vtRow[0].value
                        indFieldAlias = vtRow[1]
                        predFields.append(predField)
                        inFieldAliases.append(indFieldAlias)
                        if predField in ["#", ""]:
                            missingMatch.append(indFieldAlias)

                #### Missing Match ####
                if len(missingMatch):
                    missingMatch = ", ".join([i for i in missingMatch])
                    parameters[24].setIDMessage("ERROR", 110158, missingMatch)

                #### Check for Unique Prediction Fields ####
                predFieldsSet = set(predFields)
                if len(predFieldsSet) != len(predFields):
                    duplicate = []
                    for fieldName in predFieldsSet:
                        if predFields.count(fieldName) != 1 and fieldName not in ['', '#']:
                            duplicate.append(fieldName)
                    if len(duplicate) > 0:
                        duplicate = ", ".join(duplicate)
                        parameters[24].setIDMessage("ERROR", 110160, duplicate)

                #### Check for Unique Input Fields ####
                inFieldsAliasSet = set(inFieldAliases)
                if len(inFieldsAliasSet) != len(inFieldAliases):
                    duplicate = []
                    for inFieldAlias in inFieldsAliasSet:
                        if inFieldAliases.count(inFieldAlias) != 1 and inFieldAlias not in ['', '#']:
                            duplicate.append(inFieldAlias)
                    if len(duplicate) > 0:
                        duplicate = ", ".join(duplicate)
                        parameters[24].setIDMessage("ERROR", 110159, duplicate)

                #### Report Any Input Fields Left Unmatched From Ind Vars ####
                indVarAliases = set([nameAliasMapInputFC[indVar] for indVar in parameters[3].valueAsText.split(";") if
                                     indVar in nameAliasMapInputFC])
                missingVars = indVarAliases.difference(inFieldsAliasSet)
                if len(missingVars):
                    missingVars = ", ".join([i for i in missingVars])
                    parameters[24].setIDMessage("ERROR", 110157, missingVars)
                unexpectedVars = inFieldsAliasSet.difference(indVarAliases)
                hasEmptyField = False
                if '' in unexpectedVars or "#" in unexpectedVars:
                    hasEmptyField = True
                unexpectedVars = [v for v in unexpectedVars if v not in ['', '#']]
                if hasEmptyField:
                    unexpectedVars.append("''")
                if len(unexpectedVars):
                    unexpectedVars = ", ".join(unexpectedVars)
                    parameters[24].setIDMessage("ERROR", 110247, unexpectedVars)

                #### Must Provide Output Prediction Features ####
                if not parameters[25].value:
                    parameters[25].setIDMessage("ERROR", 530)

        #### Validate the value for customized neighbors/distances ####
        for pid in [17, 18, 19, 20, 21, 22, 33, 34]:
            if parameters[pid].enabled and parameters[pid].value is not None:
                paramIndv = parameters[pid]
                valText = paramIndv.valueAsText.split(";")
                values = paramIndv.value
                for rowInd, row in enumerate(values):
                    for colInd, col in enumerate(row):
                        if colInd == 0:
                            continue
                        if col <= 0 and valText[rowInd].split(" ")[colInd] != "#":
                            paramIndv.setIDMessage("ERROR", 531)
                        if pid in [18, 21] and colInd == 3 and valText[rowInd].split(" ")[colInd] != "#":
                            if col < 1 or col > 20:
                                parameters[pid].setIDMessage("ERROR", 110478, 1, 20)
                if pid in [17, 20, 33, 34]:
                    #### Make sure the maximum search bandwidth is greater than minimum search bandwidth ####
                    for rowInd, row in enumerate(values):
                        valMin = row[1]
                        valMax = row[2]
                        if valMin >= valMax and valText[rowInd].split(" ")[1] != "#" and valText[rowInd].split(" ")[2] != "#":
                            if pid in [17, 33]:
                                paramIndv.setIDMessage("ERROR", 110223)
                            else:
                                paramIndv.setIDMessage("ERROR", 110224)
                if pid in [17, 18, 19, 33]:
                    #### Make sure the minimum KNN is not too small #####
                    if not parameters[1].hasError():
                        indVarNames = UTILS.getTextParameter(3, parameters).upper().split(";")
                        floorKNN = max(5, len(indVarNames) + 1)
                        for rowInd, row in enumerate(values):
                            valMin = row[1]
                            if valMin < floorKNN and valText[rowInd].split(" ")[1] != "#":
                                if pid == 19:
                                    parameters[pid].setIDMessage("ERROR", 110477, floorKNN)
                                else:
                                    parameters[pid].setIDMessage("ERROR", 110475, floorKNN)

        return

    def execute(self, parameters, messages):
        import SSMGWR as MGWR
        MGWR.execute(parameters, messages)
    
    def postExecute(self, parameters):
        import SSMGWR as MGWR
        MGWR.postExecute(parameters)

class PredictUsingSSMFile(object):
    def __init__(self):
        self.label = "Predict Using Spatial Statistics Model File"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 9060016
        self.category = "Modeling Spatial Relationships"
        self.versionSupport = "0.0.11"

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Model",
                            name = "input_model",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['ssm']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Operation Mode",
                            name = "prediction_type",
                            datatype = "GPString",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.list = ["PREDICT_FEATURES", "PREDICT_RASTER"]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Input Predict Features",
                            name = "features_to_predict",
                            datatype = "GPFeatureLayer",
                            parameterType = "Optional",
                            direction = "Input")
        param2.filter.list = ["Point", "Polygon"]
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Output Prediction Features",
                            name = "output_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Optional",
                            direction = "Output")
        param3.displayOrder = 3
        param3.parameterDependencies = [param2.name]

        param4 = ARCPY.Parameter(displayName="Output Prediction Raster",
                            name = "output_raster",
                            datatype = "DERasterDataset",
                            parameterType = "Optional",
                            direction = "Output")
        param4.displayOrder = 4

        param5= ARCPY.Parameter(displayName="Match Explanatory Variables",
                            name = "explanatory_variable_matching",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param5.columns = [['Field', 'Prediction'], ['GPString','Training'], ['GPBoolean','Categorical', True]]
        param5.filters[0].list = ["Double", "Float", "Short", "Long", "Text", "BigInteger"]
        param5.filters[1].list = []
        param5.filters[2].list = ["CATEGORICAL", "NUMERIC"]
        param5.parameterDependencies = [param2.name]
        param5.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Match Distance Features",
                            name = "explanatory_distance_matching",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param6.columns = [['GPFeatureLayer', 'Prediction'], ['GPString','Training']]
        param6.filters[0].list = ["Polygon", "Point", "Polyline"]
        param6.filters[1].list = []
        param6.controlCLSID =  "{C99D0042-EF42-4B04-8A0B-1A53F6DB67A6}"
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Match Explanatory Rasters",
                            name = "explanatory_rasters_matching",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param7.columns = [['GPRasterLayer', 'Prediction'], ['GPString','Training'], ['GPBoolean','Categorical', True]]
        param7.filters[1].list = []
        param7.filters[2].list = ["CATEGORICAL", "NUMERIC"]
        param7.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param7.displayOrder = 7

        return [param0,param1,param2,param3,param4,param5,param6, param7]

    def isLicensed(self):
        return True


    def getVariables(self, metadata, typeVar = None):
        listVars = []
        if metadata is not None:
            for i in metadata:
                if type(metadata[i]) == dict and metadata[i]["index"] >=0:
                    if  typeVar is None:
                        listVars.append((metadata[i]['name'], metadata[i]['variableType'].upper() == "CATEGORICAL") )
                    else:
                        if metadata[i]['rfType'] == typeVar:
                            listVars.append((metadata[i]['name'], metadata[i]['variableType'].upper() == "CATEGORICAL") )
        return listVars

    def getVariablesByType(self, metadata, typeVar = None, attr = "source"):
        listVars = []
        if metadata is not None:
            for i in metadata:
                if type(metadata[i]) == dict and metadata[i]["index"] >=0:
                    if metadata[i]['source'] == typeVar:
                        listVars.append((metadata[i]['name'], metadata[i]['variableType'].upper() == "CATEGORICAL",  metadata[i]['fieldType']))
        return listVars

    def isCat(self, metadata, name):
        return metadata[name] != 'Numeric'

    def clean(self,param,listValues, useCat = True):

        #if len(listValues):
        #    param.filters[1].list = [ i[0] for i in listValues]
        #else:
        #    param.filters[1].list = []

        if listValues is not None and len(listValues) > 0 and param.value is not None:

            try:
                pValues = [p for p in param.values]
                if len(listValues) != len(param.values):
                    tempList = []
                    if len(listValues) < len(pValues):
                        for id, v in enumerate(listValues):
                            tempList.append(param.values[id])
                        pValues = tempList
                    else:
                        if useCat:
                            param.value = [[None,i[0],i[1]] for i in listValues]
                        else:
                            param.value = [[None,i[0]] for i in listValues]
                        return
                else:
                    names = [i[0] for i in listValues]
                    pVnames = [str(i[1]) for i in pValues]
                    ### Order is different ###
                    if names != pVnames:
                        pValuesOrdered = []
                        for id, name in enumerate(names):
                            if name in pVnames:
                                pValuesOrdered.append(pValues[pVnames.index(name)])
                            else:
                                return
                        pValues = pValuesOrdered


                if useCat:
                    values = []
                    for i, v in zip(listValues, pValues):
                        val = v[0]
                        if hasattr(v[0] , "name"):
                            if "MappingLayer" in str(type(v[0])):
                                val = v[0].URI
                            else:
                                val = v[0].name
                        elif hasattr(v[0] , "value"):
                            val = v[0].value
                        else:
                            val = str(v[0])
                        values.append([val,i[0],i[1]])
                    param.value = values
                else:
                    values = []
                    for i, v in zip(listValues, pValues):
                        val = v[0]
                        if hasattr(v[0] , "value"):
                            val = v[0].value
                        elif hasattr(v[0] , "name"):
                            if "MappingLayer" in str(type(v[0])):
                                val = v[0].URI
                            else:
                                val = v[0].name
                        else:
                            val = str(v[0])
                        values.append([val,i[0]])
                    param.value = values
            except:
                pass
        else:
            if len(listValues) == 0:
                param.value = None

    def checkValuesParm(self,param,listValues):
        if listValues is not None and len(listValues) > 0 and param.value is not None:
            try:
                pValues = [p for p in param.values]
                if len(listValues) == len(param.values):
                    names = [i[0] for i in listValues]
                    pVnames = [str(i[1]) for i in pValues]
                    ### Order is different ###
                    if names != pVnames:
                        diff = []
                        for id, name in enumerate(names):
                            if name not in pVnames:
                                diff.append(name)
                        if len(diff):
                            param.setIDMessage("Error", 800, "| ".join(names))
            except:
                pass

    def fillVT(self, param, listValues, useCat = True):
        if len(listValues) == 0:
            param.value = None
            return

        if param.value is None or len(param.values) == 0:
            if useCat:
                param.value = [[None,i[0],i[1]] for i in listValues]
            else:
                param.value = [[None,i[0]] for i in listValues]

    def getDescribeF2P(self, inputFC):
        try:
            self.descF2P = ARCPY.Describe(inputFC)
            self.inFiedsF2P = UTILS.SSFieldsInfo(self.descF2P)
        except:
            pass

    def existInF2P(self, name):
        try:
            field = self.inFiedsF2P.fieldAliasUpper(name.upper())
            if field is not None:
                return field.name
        except:
            pass

        return None  

    def updateParameters(self, parameters):
        import h5py as H5
        import json as JSON

        modelInput = parameters[0]
        predictionMode =  parameters[1]
        featuresToPredict = parameters[2]
        outputFeatures = parameters[3]
        outputRaster = parameters[4]
        explanatoryVariableMatching = parameters[5]
        explanatoryDistanceMatching = parameters[6]
        explanatoryRastersMatching = parameters[7]

        modelType = None
        metadata  = None
        options = []
        dist = []
        distances = []
        fcs = []
        rasters = []
        version = self.versionSupport
        if paramChanged(modelInput) is not None:
            try:
                if ARCPY.Exists(modelInput.value.value):
                    model = UTILS.ModelMetadata()
                    model.loadInfo(modelInput.valueAsText,  checkVersion = False)
                    metadata = model.metadata
                    label = model.modelDescriptionLabel
                    version = model.version
                    featuresToPredict.filter.list = ["Polygon", "Point"]

                    if model.modelType == "POP":
                        featuresToPredict.filter.list = ["Point"]

                    distances = self.getVariablesByType(metadata, "DIST")
                    fcs = self.getVariablesByType(metadata, "FC")
                    rasters = self.getVariablesByType(metadata, "RASTER")
            except:
                pass

        if int(version.split(".")[2]) < int(self.versionSupport.split(".")[2]):
            return

        self.clean(explanatoryVariableMatching,fcs) 
        self.clean(explanatoryDistanceMatching,distances, False) 
        self.clean(explanatoryRastersMatching,rasters)

        if featuresToPredict.value:
            self.getDescribeF2P(featuresToPredict.value)
            try:
                if len(fcs)> 0:
                    isFilled = False

                    explaVNames = fcs

                    if explanatoryVariableMatching.value:
                        matchV = explanatoryVariableMatching.value
                        tEmptyToPredictFields = [ i  for i in  matchV if i[0] is not None]
                        isFilled = len(tEmptyToPredictFields) == len(explaVNames)

                    if not isFilled:
                        explanatoryVariableMatching.value = [[self.existInF2P(i[0]), str(i[0]), i[1] ] for id, i in enumerate(explaVNames)]
                    else:
                        values = []
                        if len(explaVNames):
                            for id, i in enumerate(explaVNames):
                                v = matchV[id]
                                ex = self.existInF2P(v[0].value)
                                if ex is None:
                                    values.append([v[0].value, str(i[0]), i[1]])
                                else:
                                    values.append([ex, str(i[0]), i[1]])
                            explanatoryVariableMatching.value = values

            except:
                pass
        else:
            explanatoryVariableMatching.value = None

        explanatoryVariableMatching.enabled = len(fcs)> 0
        explanatoryDistanceMatching.enabled = len(distances) > 0 
        explanatoryRastersMatching.enabled = len(rasters) > 0

        #self.fillVT(explanatoryVariableMatching,fcs) 
        self.fillVT(explanatoryDistanceMatching,distances, False) 
        self.fillVT(explanatoryRastersMatching,rasters)
        
        predictionMode.filter.list = ["PREDICT_FEATURES", "PREDICT_RASTER"]

        if explanatoryRastersMatching.hasBeenValidated and len(rasters) ==  0 :
            predictionMode.filter.list = ["PREDICT_FEATURES"]
            predictionMode.value = "PREDICT_FEATURES"

        if (len(fcs)> 0 or len(distances) > 0):
            predictionMode.filter.list = ["PREDICT_FEATURES"]
            predictionMode.value = "PREDICT_FEATURES"

        #### Type of options PREDICT_FEATURES, PREDICT_RASTER ####
        if predictionMode.value == "PREDICT_FEATURES":
            outputRaster.enabled = False
            outputRaster.value = None
            outputFeatures.enabled = True
            featuresToPredict.enabled = True

        if predictionMode.value == "PREDICT_RASTER":
            outputRaster.enabled = True
            explanatoryRastersMatching.enabled = True
            featuresToPredict.enabled = False
            outputFeatures.enabled = False
            featuresToPredict.value = None
            outputFeatures.value = None

            if outputRaster.value:
                path =  str(outputRaster.value)
                if not UTILS.isGDB(path, True):
                    outPath, outName = OS.path.split(path)
                    lowOutPath = outPath.lower()

                    if "." not in outName:
                         outputRaster.value =  str(outputRaster.value)+ ".tif"

                    isMem = lowOutPath.startswith("memory") or lowOutPath.startswith("in_memory")
                    if isMem and outputRaster.valueAsText.lower().endswith(".tif"):
                        outputRaster.value = outputRaster.valueAsText[:-4]
        pass


    def updateMessages(self, parameters):
        import h5py as H5
        import json as JSON

        modelInput = parameters[0]
        predictionMode =  parameters[1]
        featuresToPredict = parameters[2]
        outputFeatures = parameters[3]
        outputRaster = parameters[4]
        explanatoryVariableMatching = parameters[5]
        explanatoryDistanceMatching = parameters[6]
        explanatoryRastersMatching = parameters[7]
        modelType = ""
        metadata  = ""
        variable = ""
        version = self.versionSupport
        fcs = None
        allowBandInVT(explanatoryRastersMatching)
        distances  = None
        rasters = None
        if paramChanged(modelInput) is not None:
            try:
                if ARCPY.Exists(modelInput.value.value):
                    model = UTILS.ModelMetadata()
                    model.loadInfo(modelInput.valueAsText,  checkVersion = False)
                    metadata = model.metadata
                    label = model.modelDescriptionLabel
                    version = model.version
                    modelType  = model.modelType
                    variable = metadata["Yhat"]["alias"]

                    if label in ["", None]:
                        modelInput.setIDMessage("ERROR", 110522)
                    else:
                        modelInput.setIDMessage("WARNING", 230012, label, variable )

                    distances = self.getVariablesByType(metadata, "DIST")
                    fcs = self.getVariablesByType(metadata, "FC")
                    rasters = self.getVariablesByType(metadata, "RASTER")

            except Exception as inst:
                modelInput.setIDMessage("ERROR", 368)
                return

        if int(version.split(".")[2]) < int(self.versionSupport.split(".")[2]):
            modelInput.setIDMessage("ERROR", 1662, fr"Model version {version} is not supported please update the model to {self.versionSupport}")

        varNotSet =[]

        self.checkValuesParm(explanatoryVariableMatching,fcs) 
        self.checkValuesParm(explanatoryDistanceMatching,distances) 
        self.checkValuesParm(explanatoryRastersMatching,rasters)


        #### Type of options PREDICT_FEATURES, PREDICT_RASTER ####
        if predictionMode.value == "PREDICT_FEATURES":

            if featuresToPredict.value is None :
                featuresToPredict.setIDMessage("ERROR", 530)
            else:
                if explanatoryVariableMatching.value:
                    self.getDescribeF2P(featuresToPredict.value)
                    self.checkTypes(fcs, explanatoryVariableMatching)

            if outputFeatures.value is None:
                outputFeatures.setIDMessage("ERROR", 530)

        if predictionMode.value == "PREDICT_RASTER":
            if outputRaster.value is None:
                outputRaster.setIDMessage("ERROR", 530)

        for par in [explanatoryVariableMatching, explanatoryDistanceMatching,explanatoryRastersMatching]:
            if par.value:
                for v in par.values:
                    if v[0] is None or str(v[0]) in ["", "#"]:
                        par.setIDMessage("ERROR",530)

            repeatedInItself, compareOther = checkRepeated(par.value, 0)
            if repeatedInItself is not None:
                par.setIDMessage("ERROR", 110182, repeatedInItself )

        if explanatoryRastersMatching.value is not None:
            rasterNotSupported = isImageService(explanatoryRastersMatching)
            if rasterNotSupported:
                explanatoryRastersMatching.setIDMessage("ERROR", 110213)

        return

    def checkTypes(self, fcs, explanatoryVariableMatching):
        lst = []
        try:
            for id, e in enumerate(explanatoryVariableMatching.values):
                pFld = str(e[0]).upper()
                orgType = fcs[id][2].upper()
                isNumeric = orgType in UTILS.numericTypes
                fld = None
                if self.existInF2P(pFld) is not None:
                    fld = self.inFiedsF2P.fieldAliasUpper(pFld)
                if fld is not None:
                    preType = fld.ftype.upper()
                    preIsNumeric = preType  in  UTILS.numericTypes
                    if preIsNumeric != isNumeric:
                        lst.append(pFld)
        except:
            pass
        if len(lst) > 0:
            explanatoryVariableMatching.setIDMessage("ERROR", 378, lst[0])

    def execute(self, parameters, messages):
        import SSModelPredict as SSM

        modelInput = parameters[0]
        predictionMode =  parameters[1]
        featuresToPredict = parameters[2]
        outputFeatures = parameters[3]
        outputRaster = parameters[4]
        explanatoryVariableMatching = parameters[5]
        explanatoryDistanceMatching = parameters[6]
        explanatoryRastersMatching = parameters[7]

        if outputFeatures.value:
            UTILS.checkOutputPath(outputFeatures.valueAsText, "FC")
        if outputRaster.value:
            UTILS.checkOutputPath(outputRaster.valueAsText, "RASTER")

        SSM.executeModel(self, parameters) 

class HotSpotAnalysisComparison(object):

    def __init__(self):
        self.label = "Hot Spot Analysis Comparison"
        self.description = "Compares the categories of two hot spot maps."
        self.canRunInBackground = False
        self.category = "Mapping Clusters"
        self.helpContext = 9060015
        self.params = None
        self.methodList = ["FUZZY", "EXACT_MATCH", "ABOVE_90", "ABOVE_95", "ABOVE_99", 
                           "CUSTOM", "TABLE", "REVERSE"]

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Hot Spot Result 1",
                            name = "in_hot_spot_1",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ["Polygon", "Point", "Polyline"]

        param1 = ARCPY.Parameter(displayName="Input Hot Spot Result 2",
                            name = "in_hot_spot_2",
                            datatype = "GPFeatureLayer",
                            parameterType = "Required",
                            direction = "Input")
        param1.filter.list = ["Polygon", "Point", "Polyline"]

        param2 = ARCPY.Parameter(displayName="Output Hot Spot Similarity Feature Class",
                            name = "out_features",
                            datatype = "DEFeatureClass",
                            parameterType = "Required",
                            direction = "Output")

        param3 = ARCPY.Parameter(displayName="Number of Neighbors",
                            name = "num_neighbors",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param3.value = 8
        param3.filter.type = "Range"
        param3.filter.list = [0, 10000000000]

        param4 = ARCPY.Parameter(displayName="Number of Permutations",
                            name = "num_perms",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param4.filter.list = [99, 199, 499, 999, 9999]
        param4.value = 499

        param5 = ARCPY.Parameter(displayName = "Hot Spot Categorical Similarity Weighting Method",
                                 name = "weighting_method",
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param5.filter.type = "ValueList"
        param5.filter.list = self.methodList
        param5.value = "FUZZY"

        param6 = ARCPY.Parameter(displayName="Category Similarity Weights",
                                 name="similarity_weights",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")

        param6.controlCLSID = "{11AE45C5-5372-4422-920E-869CE4ED054B}"
        param6.columns = [['GPString', 'Category 1'],['GPString', 'Category 2'],['GPDouble', 'Weight']]
        param6.enabled = False
        param6.filters[0].list = list(range(-3, 4))
        param6.filters[1].list = list(range(-3, 4))
        param6.filters[2].type = "Range"
        param6.filters[2].list = [0, 1]

        param7 = ARCPY.Parameter(displayName="Input Weights Table",
                            name = "in_weights_table",
                            datatype = "GPTableView",
                            parameterType = "Optional",
                            direction = "Input")
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Exclude Non-Significant Features",
                                 name="exclude_nonsig_features",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.list = ['EXCLUDE', 'NO_EXCLUDE']
        param8.value = False

        param9 = ARCPY.Parameter(displayName="Global Similarity Value",
                                 name="SIM_VALUE",
                                 datatype="GPDouble",
                                 parameterType="Derived",
                                 direction="Output")

        param10 = ARCPY.Parameter(displayName="Global Expected Similarity Value",
                                  name="EXP_SIM_VALUE",
                                  datatype="GPDouble",
                                  parameterType="Derived",
                                  direction="Output")

        param11 = ARCPY.Parameter(displayName="Global Spatial Fuzzy Kappa",
                                  name="KAPPA",
                                  datatype="GPDouble",
                                  parameterType="Derived",
                                  direction="Output")

        #param12 = ARCPY.Parameter(displayName="P-value",
        #                          name="P_VALUE",
        #                          datatype="GPDouble",
        #                          parameterType="Derived",
        #                          direction="Output")

        param12 = ARCPY.Parameter(displayName="Output Layer Group",
                                 name="output_layer_group",
                                 datatype="GPGroupLayer",
                                 parameterType="Derived",
                                 direction="Output")

        return [param0,param1,param2,param3,param4,param5,param6,param7,
                param8,param9,param10,param11,param12]
        #return [param0,param1,param2,param3,param4,param5,param6,param7,
        #        param8,param9,param10,param11,param12,param13]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        inputFC1 = parameters[0]
        inputFC2 = parameters[1]
        outputFC = parameters[2]
        numNeighs = parameters[3]
        permutations = parameters[4]
        catWeightMethod = parameters[5]
        catValueTable = parameters[6]
        catWeightsTable = parameters[7]
        excludeNonSig = parameters[8]
        useMean = parameters[9]
        isCustom = catWeightMethod.value == "CUSTOM"
        useVT = catWeightMethod.value != "TABLE"
        allValues = inputFC1.value and inputFC2.value

        #### Custom Value Table ####
        if useVT:
            emptyVT = catValueTable.value in [None, [], "", "#"]
            catValueTable.enabled = True
            if isCustom:
                #### If CUSTOM but Empty Value Table, Set to FUZZY ####
                if emptyVT:
                    catWeightMethod.value = "FUZZY"
                    catValueTable.value = self.autoWeights(catWeightMethod)
                    isCustom = False

            else:
                if paramChanged(catWeightMethod) or emptyVT:
                    #### Set Auto Weights if Method Changed ####
                    catValueTable.value = self.autoWeights(catWeightMethod)
                else:
                    #### Check if is Custom ####
                    #if paramChanged(catValueTable):
                    if self.isCustomVT(catValueTable.value):
                        catWeightMethod.value = "CUSTOM"
                    
        else:
            catValueTable.enabled = False
            catValueTable.value = None

        if allValues:
            #### Output Field Schema ####
            if outputFC.value:
                outPath, outName = OS.path.split(outputFC.valueAsText)
                if ARCPY.Exists(outPath):
                    #### Add Fields ####
                    addFields = []
                    candidateFieldNames = ["GI_BIN_1", "GI_BIN_2", "GI_SIG_1", "GI_SIG_2",
                                           "SIM_VALUE", "EXP_SIM", "KAPPA", "CAT_PAIR"]
                    candidateFieldTypes = ["LONG", "LONG", "TEXT", "TEXT", 
                                           "DOUBLE", "DOUBLE", "DOUBLE", "TEXT"]
                    aliasIDs = [220594, 220595, 220555, 220556, 220552, 220553, 220554, 220557]
                    candidateFieldAliases = [ARCPY.GetIDMessage(i) for i in aliasIDs]

                    #### Add Output Fields ####
                    for ind, fieldName in enumerate(candidateFieldNames):
                        field = ARCPY.Field()
                        field.name = fieldName
                        field.type = candidateFieldTypes[ind]
                        field.alias = candidateFieldAliases[ind]
                        addFields.append(field)

                    outputFC.schema.additionalFields = addFields      

        if numNeighs.altered:
            if numNeighs.value is None:
                numNeighs.value = 8

        if permutations.value is None:
            permutations.value = 499

        if catWeightMethod.value is None:
            catWeightMethod.value = "NAMES"


        if catWeightMethod.value == "TABLE":
            catWeightsTable.enabled = True
        else:
            catWeightsTable.enabled = False

        #### Add "dbf" to Tables in Folders ####
        if catWeightsTable.value:
            catWeightsTable.value = returnTablePath(catWeightsTable)

    def updateMessages(self, parameters):
        inputFC1 = parameters[0]
        inputFC2 = parameters[1]
        outputFC = parameters[2]
        numNeighs = parameters[3]
        permutations = parameters[4]
        catWeightMethod = parameters[5]
        catValueTable = parameters[6]
        catWeightsTable = parameters[7]
        excludeNonSig = parameters[8]
        isCustom = catWeightMethod.value == "CUSTOM"
        sameInputFCs = inputFC1.valueAsText == inputFC2.valueAsText
        #if sameInputFCs:
        #    inputFC1.setIDMessage("ERROR", 1596)

        #### Assure GI_BIN in Inputs ####
        if inputFC1.value is not None:
            if not inputFC1.hasError():
                try:
                    inputValue = inputFC1.valueAsText
                    lf = ARCPY.ListFields(inputValue, "GI_BIN")
                    throwError = True
                    if len(lf):
                        if lf[0].type.upper() in ["SMALLINTEGER", "INTEGER"]:
                            throwError = False
                    if throwError:
                        mainName = OS.path.basename(inputValue)
                        inputFC1.setIDMessage("ERROR", 110493, mainName)
                except:
                    pass

        if inputFC2.value is not None:
            if not inputFC2.hasError():
                try:
                    inputValue = inputFC2.valueAsText
                    lf = ARCPY.ListFields(inputValue, "GI_BIN")
                    throwError = True
                    if len(lf):
                        if lf[0].type.upper() in ["SMALLINTEGER", "INTEGER"]:
                            throwError = False
                    if throwError:
                        mainName = OS.path.basename(inputValue)
                        inputFC2.setIDMessage("ERROR", 110493, mainName)
                except:
                    pass

        #### Require Weights Table ####
        if catWeightMethod.value == "TABLE":
            if catWeightsTable.value is None:
                catWeightsTable.setIDMessage("ERROR", 530)
            else:
                try:
                    #### Assure Field Names and Types are Valid ####
                    table = catWeightsTable.valueAsText
                    goodTable = True
                    for ind, fieldName in enumerate(["CATEGORY1", "CATEGORY2", "WEIGHT"]):
                        lf = ARCPY.ListFields(table, fieldName)
                        if not len(lf):
                            goodTable = False
                            break
                        else:
                            if ind < 2:
                                if lf[0].type.upper() not in ["SMALLINTEGER", "INTEGER"]:
                                    goodTable = False
                                    break
                            else:
                                if lf[0].type.upper() not in ["SMALLINTEGER", "INTEGER", "SINGLE", "DOUBLE"]:
                                    goodTable = False
                                    break
                            
                    if not goodTable:
                        catWeightsTable.setIDMessage("ERROR", 110494)
                except:
                    pass

                        

    def autoWeights(self, catWeightMethod):
        if catWeightMethod.value not in defaultKappaWeights:
            return []

        catWeightValue = catWeightMethod.value
        reverseBool = catWeightValue == "REVERSE"
        upperWeights = defaultKappaWeights[catWeightValue]
        vt = []
        pairs = set([])
        for upperW in upperWeights:
            r,c,w = upperW
            if (r, c) not in pairs and (c, r) not in pairs:
                vt.append(upperW)
                pairs.add((r,c))

            if reverseBool:
                row = abs(r)
                col = c * -1
            else:
                row = abs(r)
                col = abs(c)

            if (row, col) not in pairs and (col, row) not in pairs:
                vt.append([row, col, w])
                pairs.add((row, col))

        return vt

    def getCatWeightsMatrix(self, method):
        weights = NUM.zeros((7,7), dtype = float)
        upperWeights = defaultKappaWeights[method]
        reverseBool = method == "REVERSE"
        vt = []
        for upperW in upperWeights:
            vt.append(upperW)
            r,c,w = upperW
            vt.append([c,r,w])
            if reverseBool:
                vt.append([abs(r), c * -1, w])
                vt.append([c * -1, abs(r), w])
            else:
                vt.append([abs(r), abs(c), w])
                vt.append([abs(c), abs(r), w])

        for r,c,w in vt:
            weights[r+3,c+3] = w

        return weights

    def getVTWeightsMatrix(self, vt):
        weights = NUM.zeros((7,7), dtype = float)
        for r,c,w in vt:
            row = int(r)
            col = int(c)
            weights[row+3,col+3] = w
            weights[col+3,row+3] = w

        return weights

    def isCustomVT(self, vt):
        vtMatrix = self.getVTWeightsMatrix(vt)
        #f = open(r'c:\temp\testVT.txt', 'a')
        #print(vtMatrix, file = f)

        for method in defaultKappaWeights.keys():
            methodMatrix = self.getCatWeightsMatrix(method)
            #print(methodMatrix, file = f)
            #print(vtMatrix == methodMatrix, file = f)
            if (vtMatrix == methodMatrix).sum() == 49:
                #print("FALSE", file = f)
                #f.close()
                return False

        #print("TRUE", file = f)
        #f.close()

        return True

    def execute(self, parameters, messages):
        ARCPY.env.overwriteOutput = True
        import SSFuzzyKappa as KAPPA
        KAPPA.execute(parameters, messages)

    def postExecute(self, parameters):
        ARCPY.env.overwriteOutput = True
        import SSFuzzyKappa as KAPPA
        KAPPA.postExecute(parameters)

class SetSSMFileProperties(object):
    def __init__(self):
        self.label = "Set Spatial Statistics Model File Properties"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 9050005
        self.category = "Utilities"
        self.versionSupport = "0.0.11"

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Model File",
                            name = "input_model",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['ssm']
        param0.displayOrder = 0


        param1= ARCPY.Parameter(displayName="Variable To Predict",
                            name = "variable_predict",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param1.controlCLSID = "{1A1CA7EC-A47A-4187-A15C-6EDBA4FE0CF7}"
        param1.columns = [['GPString','Variable', True],['GPString','Description'],['GPString', 'Unit']]
        param1.displayOrder = 1


        param2= ARCPY.Parameter(displayName="Explanatory Training Variables",
                            name = "explanatory_variables",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param2.controlCLSID = "{1A1CA7EC-A47A-4187-A15C-6EDBA4FE0CF7}"
        param2.columns = [['GPString','Variable', True],['GPString','Description'],['GPString', 'Unit']]
        param2.displayOrder = 2


        param3= ARCPY.Parameter(displayName="Explanatory Training Distance Features",
                            name = "distance_features",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param3.controlCLSID = "{1A1CA7EC-A47A-4187-A15C-6EDBA4FE0CF7}"
        param3.columns = [['GPString','Variable', True],['GPString','Description'],['GPString', 'Unit', True]]
        param3.displayOrder = 3

        param4= ARCPY.Parameter(displayName="Explanatory Training Rasters",
                            name = "explanatory_rasters",
                            datatype = "GPValueTable",
                            parameterType = "Optional",
                            direction = "Input")
        param4.controlCLSID = "{1A1CA7EC-A47A-4187-A15C-6EDBA4FE0CF7}"
        param4.columns = [['GPString','Variable', True],['GPString','Description'],['GPString', 'Unit']]
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Updated Model File",
                            name = "updated_model_file",
                            datatype = "DEFile",
                            parameterType = "Derived",
                            direction = "Output")

        return [param0,param1, param2, param3, param4, param5]

    def isLicensed(self):
        return True

    def getVariablesByType(self, metadata, typeVar = None, getYhat = False):
        listVars = []
        if metadata is not None:
            for i in metadata:
                if getYhat and type(metadata[i]) == dict and metadata[i]["index"] == -1:
                    return [metadata[i]]
                elif type(metadata[i]) == dict and metadata[i]["index"] >=0:
                    if metadata[i]['source'] == typeVar:
                        listVars.append(metadata[i])
        return listVars

    def fillVT(self, listDict):
        parts = []
        for val in listDict:
            parts.append([val["name"],val["description"],val["unit"]])
        return parts

    def updateParameters(self, parameters):

        modelInput = parameters[0]
        tableYhat =  parameters[1]
        tableVars =  parameters[2]
        tableDist =  parameters[3]
        tableRast =  parameters[4]

        modelType = None
        metadata  = None
        options = []
        dist = []
        distances = []
        fcs = []
        rasters = []
        version = self.versionSupport
        if paramChanged(modelInput) is not None:
            try:
                if ARCPY.Exists(modelInput.value.value):
                    model = UTILS.ModelMetadata()
                    model.loadInfo(modelInput.valueAsText,  checkVersion = False)
                    metadata = model.metadata
                    label = model.modelDescriptionLabel
                    version = model.version
                    modelType  = model.modelType
            except:
                return

        if int(version.split(".")[2]) < int(self.versionSupport.split(".")[2]):
            return

        if modelInput.value:
            parameters[5].value = modelInput.valueAsText

        yhat = self.getVariablesByType(metadata, getYhat = True)
        vars = self.getVariablesByType(metadata, typeVar = "FC", getYhat = False)
        dist = self.getVariablesByType(metadata, typeVar = "DIST", getYhat = False)
        rast = self.getVariablesByType(metadata, typeVar = "RASTER", getYhat = False)

        tableVars.enabled = len(vars) > 0
        tableDist.enabled = len(dist) > 0
        tableRast.enabled = len(rast) > 0


        allv = []
        if metadata is not None:
            for val, par in zip([yhat,vars,dist,rast],[tableYhat, tableVars,tableDist,tableRast]):
                parts = self.fillVT(val)
                if not par.enabled:
                    par.value = None
                elif par.enabled:
                    values = par.values
                    if values is None:
                        par.value = parts
                    else:
                        if len(parts) != len(values):
                            par.value = parts
                        else:
                            changed = False
                            for id, val in enumerate(values):
                                if parts[id][0] == val[0]:
                                    if parts[id][1] != val[1] :
                                        parts[id][1] = val[1]
                                        changed = True
                                    if parts[id][2] != val[2] :
                                        parts[id][2] = val[2]
                                        changed = True
                                else:
                                    par.value = parts
                            if changed:
                                par.value = parts
        pass


    def updateMessages(self, parameters):
        import h5py as H5
        import json as JSON

        modelInput = parameters[0]
        version = self.versionSupport
        if paramChanged(modelInput) is not None:
            try:
                if ARCPY.Exists(modelInput.value.value):
                    model = UTILS.ModelMetadata()
                    model.loadInfo(modelInput.valueAsText,  checkVersion = False)
                    metadata = model.metadata
                    label = model.modelDescriptionLabel
                    version = model.version
                    modelType  = model.modelType
                    variable = metadata["Yhat"]["alias"]
                    if label in ["", None]:
                        modelInput.setIDMessage("ERROR", 110522)
                    else:
                        modelInput.setIDMessage("WARNING", 230012, label, variable )

            except Exception as inst:
                modelInput.setIDMessage("ERROR", 368)
                return

        if int(version.split(".")[2]) < int(self.versionSupport.split(".")[2]):
            modelInput.setIDMessage("ERROR", 1662, fr"Model version {version} is not supported please update the model to {self.versionSupport}")

    def execute(self, parameters, messages):
        import SSModelPredict as SSM
        pred = PredictUsingSSMFile()
        paramP = pred.getParameterInfo()
        paramP[0].value = parameters[0].value
        SSM.describeModel(self, parameters, paramP) 

class DescribeSSMFile(object):
    def __init__(self):
        self.label = "Describe Spatial Statistics Model File"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 9050004
        self.category = "Utilities"
        self.versionSupport = "0.0.11"

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Model File",
                            name = "input_model",
                            datatype = "DEFile",
                            parameterType = "Required",
                            direction = "Input")
        param0.filter.list = ['ssm']
        param0.displayOrder = 0

        param1= ARCPY.Parameter(displayName="Explanatory Training Variables",
                            name = "explanatory_variables",
                            datatype = "GPString",
                            parameterType = "Derived",
                            multiValue = True,
                            direction = "Output")

        param2= ARCPY.Parameter(displayName="Explanatory Training Distance Features",
                            name = "explanatory_distance_features",
                            datatype = "GPString",
                            parameterType = "Derived",
                            multiValue = True,
                            direction = "Output")

        param3= ARCPY.Parameter(displayName="Explanatory Training Rasters",
                            name = "explanatory_rasters",
                            datatype = "GPString",
                            parameterType = "Derived",
                            multiValue = True,
                            direction = "Output")

        return [param0, param1, param2, param3]

    def isLicensed(self):
        return True

    def getVariablesByType(self, metadata, typeVar = None, getYhat = False):
        listVars = []
        if metadata is not None:
            for i in metadata:
                if getYhat and type(metadata[i]) == dict and metadata[i]["index"] == -1:
                    return [metadata[i]]
                elif type(metadata[i]) == dict and metadata[i]["index"] >=0:
                    if metadata[i]['source'] == typeVar:
                        listVars.append(metadata[i])
        return listVars

    def updateParameters(self, parameters):
        import h5py as H5
        import json as JSON

        modelInput = parameters[0]
        version = self.versionSupport
        metadata = None
        if paramChanged(modelInput) is not None:
            try:
                if ARCPY.Exists(modelInput.value.value):
                    model = UTILS.ModelMetadata()
                    model.loadInfo(modelInput.valueAsText,  checkVersion = False)
                    metadata = model.metadata
                    label = model.modelDescriptionLabel
                    version = model.version
                    modelType  = model.modelType
                    variable = metadata["Yhat"]["alias"]
            except Exception as inst:
                modelInput.setIDMessage("ERROR", 368)
                return

        if int(version.split(".")[2]) < int(self.versionSupport.split(".")[2]):
            return

        yhat = self.getVariablesByType(metadata, getYhat = True)
        vars = self.getVariablesByType(metadata, typeVar = "FC", getYhat = False)
        dist = self.getVariablesByType(metadata, typeVar = "DIST", getYhat = False)
        rast = self.getVariablesByType(metadata, typeVar = "RASTER", getYhat = False)

        allv = []
        if metadata is not None:
            for id, vals in enumerate([vars, dist,rast]):
                if len(vals):
                    parameters[id+1].value = [i['name'] for i in vals]
                else:
                    parameters[id+1].value = None
 
        pass


    def updateMessages(self, parameters):
        import h5py as H5
        import json as JSON

        modelInput = parameters[0]
        version = self.versionSupport
        if paramChanged(modelInput) is not None:
            try:
                if ARCPY.Exists(modelInput.value.value):
                    model = UTILS.ModelMetadata()
                    model.loadInfo(modelInput.valueAsText,  checkVersion = False)
                    metadata = model.metadata
                    label = model.modelDescriptionLabel
                    version = model.version
                    modelType  = model.modelType
                    variable = metadata["Yhat"]["alias"]
                    if label in ["", None]:
                        modelInput.setIDMessage("ERROR", 110522)
                    else:
                        modelInput.setIDMessage("WARNING", 230012, label, variable )

            except Exception as inst:
                modelInput.setIDMessage("ERROR", 368)
                return

        if int(version.split(".")[2]) < int(self.versionSupport.split(".")[2]):
            modelInput.setIDMessage("ERROR", 1662, fr"Model version {version} is not supported please update the model to {self.versionSupport}")

    def execute(self, parameters, messages):
        import SSModelPredict as SSM
        pred = PredictUsingSSMFile()
        paramP = pred.getParameterInfo()
        paramP[0].value = parameters[0].value
        SSM.describeModel(self, parameters, paramP, update = False) 


class CalculateCompositeIndex(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Calculate Composite Index"
        self.description = ""
        self.helpContext = 9030013
        self.category = "Mapping Clusters"
        self.canRunInBackground = False
        self.isPolygon = False
        self.desc = None
        self.inFields = None

       #### Set Default Values ####
        self.defaultIndexList = []
        self.defaultValueList = []

    def getParameterInfo(self):
        """Define parameter definitions"""
        param0 = ARCPY.Parameter(displayName="Input Table",
                                 name="in_table",
                                 datatype= 'GPTableView',
                                 parameterType="Required",
                                 direction="Input")
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Input Variables",
                                 name="in_variables",
                                 datatype="GPValueTable",
                                 parameterType="Required",
                                 direction="Input")
        param1.parameterDependencies = [param0.name]
        param1.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param1.columns = [['Field', 'Field'], ['GPBoolean', 'Reverse Direction']]
        param1.filters[0].list = ["DOUBLE", "FLOAT", "SHORT", "LONG", "BigInteger"]
        param1.filters[1].list = ["TRUE", "FALSE"]
        param1.enabled = True
        param1.displayOrder = 3

        param2 = ARCPY.Parameter(displayName="Append Fields to Input Table",
                                 name="append_to_input",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param2.value = False
        param2.enabled = True
        param2.filter.list = ['APPEND_TO_INPUT', 'NEW_FEATURES']
        param2.displayOrder = 1

        param3 = ARCPY.Parameter(displayName="Output Features or Table",
                                 name="out_table",
                                 datatype=['DEFeatureClass','DETable'],
                                 parameterType="Optional",
                                 direction="Output")
        param3.parameterDependencies = [param0.name]
        param3.enabled = True
        param3.displayOrder = 2

        param4 = ARCPY.Parameter(displayName="Preset Method to Scale and Combine Variables",
                                 name="index_preset",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ["MEAN_SCALED",           # ENUM_LABEL: "Mean of scaled values"
                              "MEAN_PCTL",             # ENUM_LABEL: "Mean of percentile"
                              "GEOMEAN_SCALED",        # ENUM_LABEL: "Geometric mean of scaled values"
                              "SUM_FLAGSPCTL",         # ENUM_LABEL: "Sum of flags by percentile"
                              "CUSTOM"]                # ENUM_LABEL: "Custom"
        param4.value = "MEAN_SCALED"
        param4.enabled = True
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Method to Scale Input Variables",
                                 name="preprocessing",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = ["MINMAX",                 # ENUM_LABEL: "Scaled values (minimum-maximum)"
                              "CUST_MINMAX",            # ENUM_LABEL: "Scaled values (custom minimum-maximum)"
                              "PERCENTILE",             # ENUM_LABEL: "Relative values (percentile)"
                              "RANK",                   # ENUM_LABEL: "Relative values (rank)"
                              "ZSCORE",                 # ENUM_LABEL: "Standardize (z-score)"
                              "CUST_ZSCORE",            # ENUM_LABEL: "Standardize (custom z-score)"
                              "BINARY",                 # ENUM_LABEL: Thresholds (binary flags)
                              "RAW"]                    # ENUM_LABEL: "Raw values"

        param5.value = "MINMAX"
        param5.enabled = True
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Method to Scale for Thresholds",
                                 name="pre_threshold_scaling",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.list = ["THRESHOLD_MINMAX",                   # ENUM_LABEL: "Scaled values (minimum-maximum)"
                              "THRESHOLD_CUST_MINMAX",              # ENUM_LABEL: "Scaled values (custom minimum-maximum)"
                              "THRESHOLD_PERCENTILE",               # ENUM_LABEL: "Relative values (percentile)"
                              "THRESHOLD_ZSCORE",                   # ENUM_LABEL: "Standardize (z-score)"
                              "THRESHOLD_CUST_ZSCORE",              # ENUM_LABEL: "Standardize (custom z-score)"
                              "THRESHOLD_RAW"]                      # ENUM_LABEL: "Raw values"


        param6.value = "THRESHOLD_PERCENTILE"
        param6.enabled = False
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Custom Standardization",
                                 name="pre_custom_zscore",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param7.parameterDependencies = [param0.name]
        param7.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param7.columns = [['Field', 'Field'], ['GPDouble', 'Mean'], ['GPDouble', 'Standard Deviation']]
        param7.filters[0].list = ["DOUBLE", "FLOAT", "SHORT", "LONG", "BigInteger"]
        param7.enabled = False
        # param7.filters[2].type = "Range"
        # param7.filters[2].list = [0.000000001, 999999999]
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Custom Data Ranges",
                                 name="pre_min_max",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param8.parameterDependencies = [param0.name]
        param8.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param8.columns = [['Field', 'Field'], ['GPDouble', 'Possible Minimum'], ['GPDouble', 'Possible Maximum']]
        param8.filters[0].list = ["DOUBLE", "FLOAT", "SHORT", "LONG", "BigInteger"]
        param8.enabled = False
        param8.displayOrder = 8

        param9 = ARCPY.Parameter(displayName="Thresholds",
                                  name="pre_thresholds",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param9.parameterDependencies = [param0.name]
        param9.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param9.columns = [['Field', 'Variable'], ["GPString", "Method"], ['GPDouble', 'Threshold']]
        param9.filters[0].list = ["DOUBLE", "FLOAT", "SHORT", "LONG", "BigInteger"]
        param9.filters[1].type = "ValueList"
        param9.filters[1].list = ["GREATERTHAN",      # ENUM_LABEL: "Greater than or equal to"
                                   "LESSTHAN"]         # ENUM_LABEL: "Less than or equal to"
        param9.enabled = False
        param9.displayOrder = 9

        param10 = ARCPY.Parameter(displayName="Method to Combine Scaled Variables",
                                  name="index_method",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param10.filter.type = "ValueList"
        param10.filter.list = ["MEAN",           # ENUM_LABEL: "Mean (accumulate)"
                               "SUM",            # ENUM_LABEL: "Sum (accumulate)"
                               "GEOMETRIC_MEAN", # ENUM_LABEL: "Geometric mean (amplify)" 
                               "PRODUCT"]        # ENUM_LABEL: "Multiply (amplify)"
        param10.value = "MEAN"
        param10.enabled = True
        param10.displayOrder = 10

        param11 = ARCPY.Parameter(displayName="Weights",
                                  name="index_weights",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param11.parameterDependencies = [param0.name]
        param11.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param11.columns = [['Field', 'Field'], ['GPDouble', 'Weight']]
        param11.filters[0].list = ["DOUBLE", "FLOAT", "SHORT", "LONG", "BigInteger"]
        param11.filters[1].type = "Range"
        param11.filters[1].list = [0, 999999999999999]
        param11.enabled = True
        param11.displayOrder = 11      
        param11.category = "Variable Weights"

        param12 = ARCPY.Parameter(displayName="Output Index Name",
                                  name="out_index_name",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param12.enabled = True
        param12.displayOrder = 12
        param12.category = "Output Settings"

        param13 = ARCPY.Parameter(displayName="Reverse Output Index Values",
                                  name="out_index_reverse",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")
        param13.filter.list = ["REVERSE", "NO_REVERSE"]
        param13.enabled = True
        param13.displayOrder = 13
        param13.category = "Output Settings"

        param14 = ARCPY.Parameter(displayName="Output Index Minimum and Maximum Values",
                                  name="post_min_max",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        # param14.controlCLSID = "{F604736F-06D8-47CD-AC15-7055F7FCDAC1}"
        param14.controlCLSID = "{1A1CA7EC-A47A-4187-A15C-6EDBA4FE0CF7}"
        param14.columns = [['GPDouble', 'Minimum'], ['GPDouble', 'Maximum']]
        param14.enabled = True
        param14.displayOrder = 14
        param14.category = "Output Settings"

        param15 = ARCPY.Parameter(displayName="Method to Classify Output Index",
                                  name="post_reclass",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input",
                                  multiValue=True)

        param15.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param15.filter.list = ["EQINTERVAL",  # ENUM_LABEL: "Classes (equal interval)"
                               "QUANTILE",  # ENUM_LABEL: "Classes (quantile)"
                               "STDDEV",  # ENUM_LABEL: "Classes (standard deviation)"
                               "CUST"]  # ENUM_LABEL: "Classes (custom)"

        param15.enabled = True
        param15.displayOrder = 15
        param15.category = "Output Settings"

        param16 = ARCPY.Parameter(displayName="Output Index Number of Classes",
                                  name="post_num_classes",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param16.filter.type = "Range"
        param16.filter.list = [2, 256]
        param16.value = 5
        param16.enabled = False
        param16.displayOrder = 16
        param16.category = "Output Settings"

        param17 = ARCPY.Parameter(displayName="Output Index Custom Classes",
                                  name="post_custom_classes",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param17.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param17.columns = [['GPDouble', 'Upper Bound'], ['GPString', 'Class Value']]
        param17.enabled = False
        param17.displayOrder = 17
        param17.category = "Output Settings"

        param18 = ARCPY.Parameter(displayName="Updated Input Table",
                        name = "updated_table",
                        datatype = "GPTableView",
                        parameterType = "Derived",
                        direction = "Output")
        param18.parameterDependencies = [param0.name]
        param19 = ARCPY.Parameter(displayName="Output Layer Group",
                                 name="output_layer_group",
                                 datatype="GPGroupLayer",
                                 parameterType="Derived",
                                 direction="Output")

        params = [param0, param1, param2, param3, param4, param5, param6, param7, param8, param9,
                  param10, param11, param12, param13, param14, param15, param16, param17, param18,
                  param19]
        return params

    def fieldExist(self, name):
        try:
            field = self.inFields.fieldAlias(name)
            if field is not None:
                return field.name
        except:
            pass

        return None

    def populateField(self):
        if self.desc is not None:
            desc = self.desc
            try:
                self.inFields = UTILS.SSFieldsInfo(self.desc)
            except:
                self.inFields = None
                return

    def fcType(self, inputFC):
        try:
            self.isPolygon = False
            self.desc = ARCPY.Describe(inputFC)
            if self.desc is not None and self.desc.dataType not  in UTILS.dataTypeTable:
                if "Polygon" == self.desc.shapeType:
                    self.isPolygon = True
                if "Point" == self.desc.shapeType:
                    self.isPolygon = False
            self.populateField()
            return True
        except:
            pass
        return False

    def handleOutput(self, inFeature,  appendField, outFC):
        isTable = False
        if inFeature.value is not None:
            desc = ARCPY.Describe(inFeature.value)
            name = desc.nameString if hasattr(desc, "nameString") else desc.name
            if name[-4:] in [".shp", ".dbf"]:
                name = name[:-4]
            wrkspc = ARCPY.env.workspace
            isTable = desc.dataType in UTILS.dataTypeTable

        if  outFC.value is None and inFeature.value is not None and not appendField.value:

            isGroup = False

            if "\\" in name:
                name = name.split("\\")[-1]
                isGroup = True

            inPath, _ = OS.path.split(inFeature.valueAsText)

            ### To fix the python stand alone error###
            if inPath == '' or isGroup or inPath.upper().startswith("HTTPS:"):
                current = ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase
            else:
                current = inPath

            ext = ""
            currentUpper = current.upper()
            if not UTILS.IsPathInGeoDatabase(currentUpper):
                if isTable:
                    ext = ".dbf"
                else:
                    ext = ".shp"
                wrkspc, _ = OS.path.split(ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase)
            name = ARCPY.ValidateTableName(name)

            outFC.value = UTILS.checkForDuplicateOutput(name + "_CalculateCompositeIndex", wrkspc, 0, ext)

        elif outFC.value is not None :
            outO = outFC.valueAsText
            outp = outO.upper()

            _, name  = OS.path.split(outO)
            ext = ""
            if "." in name:
                ext = name.rsplit('.',1)[1]

            if not UTILS.IsPathInGeoDatabase(outp):
                if isTable:
                    if not outp.endswith(".DBF"): 
                        if ext != "":
                            outFC.value = outO.replace("."+ext, ".dbf")
                        else:
                            outFC.value = outO +".dbf"
                if not isTable:
                    if not outp.endswith(".SHP"):
                        if ext != "":
                            outFC.value = outO.replace("."+ext, ".shp")
                        else:
                            outFC.value = outO +".shp"

    def __checkFieldNames(self, candidateFields, isSHP):
        """ This function adjusts the field names for shp and dbf file outputs
        """
        cNames = {i.name:0 for i in candidateFields}
        for i in range(len(candidateFields)):
            cNames[candidateFields[i].name]+=1
            ext = ""

            if cNames[candidateFields[i].name] > 1:
                ext = str(cNames[candidateFields[i].name] -1)
            
            candidateFields[i].name = candidateFields[i].name.replace(".", "_")+ext
            
        if not isSHP:
            return candidateFields
        else:
            return UTILS.checkCandidateFieldsSimple(candidateFields)

    def getCandidateFields(self, parameters):
        inputFC = parameters[0].value
        inputFields = parameters[1].value
        indexCalcMethod = parameters[10].value
        outIndexName = parameters[12].value
        outMinMaxVals = parameters[14].value
        outInvert = parameters[13].value
        outCustomClassesV = parameters[17].value
        outIndexClassification = parameters[15]
        outputFC = parameters[3]
        inputVarStandard = parameters[5].value
        thresholdScaling = parameters[6].value
        appendField = parameters[2].value
        updated_table = parameters[18]

        if inputFC is None or inputFields is None:
            return
        isSHP = False

        pathOutput = None
        fldsInput=[]
        outParm = outputFC
        isSDE= False

        if appendField:
            try:
                outParm = updated_table
                fldsInput = ARCPY.ListFields(inputFC)
                if self.desc is None:
                    self.desc = ARCPY.Describe(inputFC)
                pathOutput = self.desc.catalogPath
            except:
                pass
        else:
            pathOutput = outputFC.valueAsText

        try:
            outPath, outName = OS.path.split(pathOutput)
            info = ARCPY.Describe(outPath)
            prop = info.connectionProperties.instance.upper()
            isSDE = "SDE:ORACLE" in prop or"SDE:SQL" in prop
        except:
            isSDE = False

        try:
            if pathOutput.lower().endswith(".shp") or pathOutput.lower().endswith(".dbf"):
                isSHP = True

            combineMethod2Str = {"SUM" : 220436, "MEAN" : 220437, "PRODUCT" : 220601, "GEOMETRIC_MEAN" : 220602}
            combineMethod = ARCPY.GetIDMessage(combineMethod2Str[indexCalcMethod])
            Raw = ARCPY.GetIDMessage(220604)
            Rank = ARCPY.GetIDMessage(220610)
            percentile = ARCPY.GetIDMessage(220609)
            Reversed = ARCPY.GetIDMessage(220603)
            if outIndexName is None:
                outIndexName = ARCPY.GetIDMessage(220612) 

            rawIdxAlias = outIndexName + " - " + combineMethod
            if  outMinMaxVals or outInvert:
                rawIdxAlias += " (" + Raw + ")"

            tIndex = "INDEX"
            if isSDE:
                tIndex = 'INDEX_'

            flds = {
              'INDEX_RAW': ["Double", rawIdxAlias, "INDEX_RAW"],
              'INDEX':     ["Double", outIndexName + " - " + combineMethod, tIndex],
              'INDEX_RANK':["Long",   outIndexName + " - " + combineMethod + " (" + Rank + ")", "INDEX_RANK"],
              'INDEX_PCTL':["Double", outIndexName + " - " + combineMethod + " (" + percentile + ")", "INDEX_PCTL"],
              "STDDEV":    ["Long",   outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220618) + ")", "INDEX_STDV"],
              "QUANTILE":  ["Long",   outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220614) + ")","INDEX_QUAN"],
              "EQINTERVAL":["Long",   outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220626) + ")", "INDEX_EQUL"]
              }

            def str2Float(value):
                try:
                    return UTILS.strToFloat(value)
                except:
                    return None

            outCustomClasses = {}
            if outCustomClassesV:
                labels = []
                for row in outCustomClassesV:
                    labels.append(str(row[1]))
                lenText =[ len(e) for e in labels]
                numbers = [ str2Float(e) for e in labels]
                typeOut = "Long"
                if None in numbers:
                    typeOut = "TEXT"
                else:
                    integers = [ (f-int(f)) == 0 for f in numbers]
                    if False in integers:
                        typeOut = "Double"
                    else:
                        typeOut = "Long"
                flds["CUST"] = [typeOut, outIndexName + " - " + combineMethod + " (" + ARCPY.GetIDMessage(220616) + ")", "INDEX_CUST"]

            outF = []

            rawIdxFiledName = 'INDEX'
            if outMinMaxVals or outInvert:
                rawIdxFiledName += '_RAW'
            outF.append(rawIdxFiledName)
            outF.append("INDEX_RANK")
            outF.append("INDEX_PCTL")

            if outIndexClassification.value is not None:
                classifyOuputIdxOrder = ['EQINTERVAL', 'QUANTILE', 'STDDEV', 'CUST']
                vals = outIndexClassification.valueAsText.split(";")
                for cls in classifyOuputIdxOrder:
                    if cls in vals:
                        outF.append(cls)

            outFldsOrg = []
            fieldAliases = []
            names = [ str(i[0]) for i in inputFields]
            if appendField:
                for fld in fldsInput:
                    if fld.name in names:
                         fieldAliases.append(self.inFields.fieldAlias(fld.name).aliasName)
                    outFldsOrg.append(fld)
            else:
                for f in inputFields:
                    nFld = ARCPY.Field()
                    nFld.name = str(f[0])
                    nFld.type = "Double"
                    outFldsOrg.append(nFld)
                    fieldAliases.append(self.inFields.fieldAlias(str(f[0])).aliasName)

            outFlds = []

            for i,f in enumerate(inputFields):
                nFld = ARCPY.Field()
                if not isSHP:
                    nFld.name = str(f[0])+"_PREPROCESSED"
                else:
                    nFld.name = fr"VAR{i+1}_PRE"
                isReversed = f[1]

                if inputVarStandard == "RAW" or (inputVarStandard  == "BINARY" and thresholdScaling == "THRESHOLD_RAW"):
                    if isReversed:
                        stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + Raw + ")"
                    else:
                        stdFieldAlias = fieldAliases[i] + " (" + Raw + ")"
                elif inputVarStandard == "ZSCORE" or (inputVarStandard  == "BINARY" and thresholdScaling == "THRESHOLD_ZSCORE"):
                    zScore = ARCPY.GetIDMessage(220605)
                    if isReversed:
                        stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + zScore + ")"
                    else:
                        stdFieldAlias = fieldAliases[i] + " (" + zScore + ")"

                elif inputVarStandard  == "CUST_ZSCORE" or \
                        (inputVarStandard  == "BINARY" and thresholdScaling == "THRESHOLD_CUST_ZSCORE"):
                    customZScore = ARCPY.GetIDMessage(220606)
                    if isReversed:
                        stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + customZScore + ")"
                    else:
                        stdFieldAlias = fieldAliases[i] + " (" + customZScore + ")"

                elif inputVarStandard == "MINMAX" or \
                        (inputVarStandard  == "BINARY" and thresholdScaling == "THRESHOLD_MINMAX"):
                    minMax = ARCPY.GetIDMessage(220607)
                    if isReversed:
                        stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + minMax + ")"
                    else:
                        stdFieldAlias = fieldAliases[i] + " (" + minMax + ")"
                elif inputVarStandard == "CUST_MINMAX" or \
                        (inputVarStandard  == "BINARY" and thresholdScaling == "THRESHOLD_CUST_MINMAX"):
                    customMinmax = ARCPY.GetIDMessage(220608)
                    if isReversed:
                        stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + customMinmax + ")"
                    else:
                        stdFieldAlias = fieldAliases[i]  + " (" + customMinmax + ")"
                elif inputVarStandard == "PERCENTILE" or \
                        (inputVarStandard  == "BINARY" and thresholdScaling == "THRESHOLD_PERCENTILE"):

                    percentile = ARCPY.GetIDMessage(220609)
                    if isReversed:
                        stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + percentile + ")"
                    else:
                        stdFieldAlias = fieldAliases[i] + " (" + percentile + ")"
                else:
                    rankStr = ARCPY.GetIDMessage(220610)
                    if isReversed:
                        stdFieldAlias = fieldAliases[i] + " (" + Reversed + ", " + rankStr + ")"
                    else:
                        stdFieldAlias = fieldAliases[i] + " (" + rankStr + ")"

                nFld.type = "Double"
                if not isSHP:
                    nFld.aliasName = stdFieldAlias

                outFlds.append(nFld)


            for fld in outF:
                nFld = ARCPY.Field()
                nFld.name = flds[fld][2]
                nFld.type = flds[fld][0]
                if not isSHP:
                    nFld.aliasName = flds[fld][1]
                outFlds.append(nFld)
                
            if appendField:
               outFlds = UTILS.checkDuplicatedBasic(outFlds, isSHP, [i.name for i in fldsInput], 
                                                    useFieldsAsCandidateFields = True, updateAliases=False)
               outFlds = self.__checkFieldNames(outFlds, isSHP)

            outParm.schema.additionalFields = outFldsOrg + outFlds

        except:
            pass


    def updateParameters(self, parameters):

        inFeatures = parameters[0]  # Input features
        inputFields = parameters[1]  # Input Variables
        appendField = parameters[2]  # Append Fields to Input Features
        outFc = parameters[3]  # Output Features
        inWorkflow = parameters[4]  # Index Workflow
        prepro = parameters[5]  # Input Variable Standardization
        prepro_flags_scale_method = parameters[6]  # Custom Classes
        prepro_sdmean_vals = parameters[7]  # Custom Standardization
        prepro_minmax_vals = parameters[8]  # Custom Minimum and Maximum Values
        prepro_flags = parameters[9]  # Flags
        calculateMethod = parameters[10]  # Index Calculation Method
        variableWeights = parameters[11]  # Weights
        outIndexName = parameters[12]  # Output Index Name
        outInvert = parameters[13]  # Invert Output Index Values
        postpro_minmax = parameters[14]  # Minimum and Maximum Values
        postpro = parameters[15].values  # Output Index Classification
        postpro_classes = parameters[16]  # Index Number of Classes
        postpro_reclass_table = parameters[17]  # Reclassification Table for Custom
        updated_table = parameters[18]       # Reclassification Table for Custom
        group_layer = parameters[19]       # Reclassification Table for Custom
        #### Get Information of Field Aliases of Input FC ####
        if inFeatures.enabled and inFeatures.altered:
            if inFeatures.value:
                if not self.fcType(inFeatures.value):
                    return

        #### If append fields to output, disable the output FC param ####
        if appendField.value:
            outFc.enabled = False
            outFc.value = None
        else:
            outFc.enabled = True


        try:
            if appendField.value:
                updated_table.parameterDependencies = [inFeatures.name]
            else:
                updated_table.parameterDependencies = None
        except:
            pass

        #### Logic to populate fields in weights value table ####
        if inFeatures.value and inputFields.value and inputFields.altered:
            isFilled = False
            inVariablesList = []

            for i in inputFields.value:
                # field = self.fieldExist(i[0].value) # self.inFields.fieldAlias(val)
                # if field:
                inVariablesList.append(i[0])

            defv = [[str(i), 1] for id, i in enumerate(inVariablesList)]  #  if i is not None]
            if variableWeights.value:
                tempValues = [[i[0], i[1]] for i in variableWeights.values]
                defaults = [[str(i), 1] for id, i in enumerate(inVariablesList)]
                if len(tempValues) == len(defaults):
                    values = []
                    for t,d in zip(tempValues, defaults):
                        if  d[1] != t[1]:
                            values.append([d[0], t[1]])
                        else:
                            values.append([d[0], d[1]])
                    variableWeights.value = values
                else:
                    variableWeights.value =  defv
            else:
                variableWeights.value = defv


        ### Check if preset method is empty ####
        if inWorkflow.value is None:
            inWorkflow.value = "MEAN_SCALED"

        #### Logic to use Index Workflow to prepopulate parameter values
        workflow_to_enabledparams_dict = {
            "MEAN_SCALED": {
                prepro: "MINMAX",  # Input Variable Standardization
                calculateMethod: "MEAN",  # Index Calculation Method
            },
            "MEAN_PCTL": {
                prepro: "PERCENTILE",  # Input Variable Standardization
                calculateMethod: "MEAN",  # Index Calculation Method
            },
            "GEOMEAN_SCALED": {
                prepro: "MINMAX",  # Input Variable Standardization
                calculateMethod: "GEOMETRIC_MEAN",  # Index Calculation Method
            },
            "SUM_FLAGSPCTL": {
                prepro: "BINARY",  # Input Variable Standardization
                calculateMethod: "SUM",  # Input Variable Standardization
            }
        }

        # Check the Index Workflow value, then set parameter visibility and value accordingly
        #if inWorkflow.altered and inWorkflow.value in ["MEAN_SCALED", "MEAN_PCTL", "GEOMEAN_SCALED", "SUM_FLAGSPCTL"]:
        thresholdModifed = False
        if inWorkflow.value in ["MEAN_SCALED", "MEAN_PCTL", "GEOMEAN_SCALED", "SUM_FLAGSPCTL"]:
            if (inWorkflow.altered and not inWorkflow.hasBeenValidated) or (prepro.value is None or calculateMethod.value is None):
                for param in workflow_to_enabledparams_dict[inWorkflow.value]:
                    param.value = workflow_to_enabledparams_dict[inWorkflow.value][param]

                if inWorkflow.value == "SUM_FLAGSPCTL":
                    prepro_flags_scale_method.value = "PERCENTILE"
            else:
                if inWorkflow.value == "MEAN_SCALED" and (prepro.value != "MINMAX" or calculateMethod.value != "MEAN"):
                    inWorkflow.value = "CUSTOM"
                elif inWorkflow.value == "MEAN_PCTL" and (prepro.value != "PERCENTILE" or calculateMethod.value != "MEAN"):
                    inWorkflow.value = "CUSTOM"
                elif inWorkflow.value == "GEOMEAN_SCALED" and (prepro.value != "MINMAX" or calculateMethod.value != "GEOMETRIC_MEAN"):
                    inWorkflow.value = "CUSTOM"
                elif inWorkflow.value == "SUM_FLAGSPCTL":
                    if prepro.value != "BINARY" or calculateMethod.value != "SUM" \
                        or prepro.value == "BINARY" and prepro_flags_scale_method.value != "THRESHOLD_PERCENTILE":
                        inWorkflow.value = "CUSTOM"
                    
                    # Check if Thresholds are modified
                    if inWorkflow.value != "CUSTOM" and prepro_flags.value is not None:
                        for row in prepro_flags.value:
                            if row[1] != "GREATERTHAN" or row[2] != 0.9:
                                inWorkflow.value = "CUSTOM"
                                thresholdModifed = True
                                break 

        if inWorkflow.value == "CUSTOM":
            if prepro.value is None:
                prepro.value = "MINMAX"
            if calculateMethod.value is None:
                calculateMethod.value = "MEAN"
            # if not thresholdModifed and (paramChanged(inWorkflow) and paramChanged(prepro_flags_scale_method)):
            #    prepro_flags.value = None
        elif inWorkflow.value == "SUM_FLAGSPCTL":
            prepro_flags.value = None

        if prepro.value == "ZSCORE":
            calculateMethod.filter.list = ["SUM",            # ENUM_LABEL: "Sum (additive)"
                                            "MEAN"]          # ENUM_LABEL: "Mean (additive)"
        else:
            calculateMethod.filter.list = ["SUM",            # ENUM_LABEL: "Sum (additive)"
                                           "MEAN",           # ENUM_LABEL: "Mean (additive)"
                                           "PRODUCT",        # ENUM_LABEL: "Product (Multiplicative)"
                                           "GEOMETRIC_MEAN"] # ENUM_LABEL: "Geometric mean (amplify)"

        prepro_flags_scale_method.displayOrder = 10
        #### Determine when min-max valueTable and numClasses params show ####
        if prepro.value == "CUST_ZSCORE":
            prepro_minmax_vals.enabled = False
            prepro_sdmean_vals.enabled = True
            prepro_flags_scale_method.enabled = False
            prepro_flags.enabled = False
        elif prepro.value == "CUST_MINMAX":
            prepro_minmax_vals.enabled = True
            prepro_sdmean_vals.enabled = False
            prepro_sdmean_vals.value = None
            prepro_flags_scale_method.enabled = False
            prepro_flags.enabled = False
        elif prepro.value == "BINARY":
            prepro_minmax_vals.enabled = False
            prepro_sdmean_vals.enabled = False
            prepro_minmax_vals.enabled = False
            if prepro_flags_scale_method.value  == "THRESHOLD_CUST_ZSCORE":
                prepro_flags_scale_method.displayOrder = 5
                prepro_sdmean_vals.enabled = True
            elif prepro_flags_scale_method.value == "THRESHOLD_CUST_MINMAX":
                prepro_flags_scale_method.displayOrder = 5
                prepro_minmax_vals.displayOrder = 6
                prepro_minmax_vals.enabled = True
            prepro_flags_scale_method.enabled = True
            prepro_flags.enabled = True 
        else:
            prepro_minmax_vals.enabled = False
            prepro_sdmean_vals.enabled = False
            prepro_sdmean_vals.value = None
            prepro_flags_scale_method.enabled = False
            prepro_flags.enabled = False

        #### Logic to populate fields in custom std dev mean value table ####
        if prepro_sdmean_vals.enabled:
            try:
                if inputFields.value:
                    isFilled = False
                    inVariablesList = []

                    for i in inputFields.value:
                        val = str(i[0].value)
                        field = self.inFields.fieldAlias(val)
                        inVariablesList.append(field)

                    if prepro_sdmean_vals.value:
                        matchVariables = prepro_sdmean_vals.value
                        matchVariablesList = [i for i in matchVariables if i[0] is not None]
                        # isFilled = len(matchVariablesList) == len(inVariablesList)
                        if len(matchVariablesList) == len(inVariablesList):
                            fieldsMatch = True
                            for i in range(len(matchVariablesList)):
                                if matchVariablesList[i].name != inVariablesList[i].name:
                                    fieldsMatch = False
                                    break
                            isFilled = fieldsMatch
                    
                    if not isFilled:
                        prepro_sdmean_vals.value = [[i.name, "", ""] for id, i in enumerate(inVariablesList)]

            except:
                pass

        #### Logic to populate fields in custom min max value table ####
        if prepro_minmax_vals.enabled:
            try:
                if inputFields.value:
                    isFilled = False
                    inVariablesList = []
                    for i in inputFields.value:
                        val = str(i[0].value)
                        field = self.inFields.fieldAlias(val)
                        inVariablesList.append(field)

                    if prepro_minmax_vals.value:
                        matchVariables = prepro_minmax_vals.value
                        matchVariablesList = [i for i in matchVariables if i[0] is not None]
                        # isFilled = len(matchVariablesList) == len(inVariablesList)
                        if len(matchVariablesList) == len(inVariablesList):
                            fieldsMatch = True
                            for i in range(len(matchVariablesList)):
                                if matchVariablesList[i].name != inVariablesList[i].name:
                                    fieldsMatch = False
                                    break
                            isFilled = fieldsMatch

                    if not isFilled:
                        prepro_minmax_vals.value = [[i.name, "", ""] for id, i in enumerate(inVariablesList)]
            except:
                pass

        #### TODO: Logic to populate fields in custom classes value table ####
        # if prepro_class_vals.enabled:
        #     pass

        #### Logic to populate fields in Flags value table ####
        if prepro_flags.enabled:
            if prepro.value:
                flags_method = ["GREATERTHAN", "LESSTHAN"]
                prepro_flags.filters[1].list = flags_method
            try:
                if inputFields.value:
                    isFilled = False
                    inVariablesList = []
                    for i in inputFields.value:
                        val = str(i[0].value)
                        field = self.inFields.fieldAlias(val)
                        inVariablesList.append(field)

                    if prepro_flags.value:
                        matchVariables = prepro_flags.value
                        matchVariablesList = [i for i in matchVariables if i[0] is not None]
                        # isFilled = len(matchVariablesList) == len(inVariablesList)
                        if len(matchVariablesList) == len(inVariablesList):
                            fieldsMatch = True
                            for i in range(len(matchVariablesList)):
                                if matchVariablesList[i].name != inVariablesList[i].name:
                                    fieldsMatch = False
                                    break
                            isFilled = fieldsMatch

                    if not isFilled:
                        if inWorkflow.value == "SUM_FLAGSPCTL":
                            prepro_flags.value = [[i.name, flags_method[0], 0.9] for id, i in enumerate(inVariablesList)]
                        else:
                            prepro_flags.value = [[i.name, "GREATERTHAN", ""] for id, i in enumerate(inVariablesList)]
                else:
                    prepro_flags.value = None
            except:
                pass
        else:
            prepro_flags.value = None

        #### Clean Matching Variables ####
        if inputFields.value is None:
            prepro_minmax_vals.value = None
            # prepro_class_vals.value = None

        #### Post-pro param logic ####
        if postpro != None:

            if "QUANTILE" in postpro or "EQINTERVAL" in postpro:
                postpro_classes.enabled = True
            else:
                postpro_classes.enabled = False

            if "CUST" in postpro:
                postpro_reclass_table.enabled = True
            else:
                postpro_reclass_table.enabled = False
        else:
            postpro_classes.enabled = False
            postpro_reclass_table.enabled = False

        if appendField.value:
            #### Append to Input ####
            outFc.enabled = False
            outFc.value = None
            setOptionalAppendDerivedParam(inFeatures, updated_table)
        else:
            outFc.enabled = True
            updated_table.enabled = False
            updated_table.value = None

        if prepro.value =="CUST_ZSCORE":
            prepro_minmax_vals.value = None

        if prepro.value == "CUST_MINMAX":
            prepro_sdmean_vals.value = None

        if prepro.value == "CLASS_CUST":
            prepro_sdmean_vals.value = None
            prepro_minmax_vals.value = None

        self.handleOutput(inFeatures,appendField, outFc)
        self.getCandidateFields(parameters)

        return


    def updateMessages(self, parameters):

        inFeatures = parameters[0]                      # Input features
        inputFields = parameters[1]                     # Input Variables
        appendField = parameters[2]                     # Append Fields to Input Features
        outFc = parameters[3]                           # Output Features
        inWorkflow = parameters[4]                      # Index Workflow
        prepro = parameters[5].value                    # Input Variable Standardization
        prepro_flags_scale_method = parameters[6]       # Custom Classes
        prepro_sdmean_vals = parameters[7]              # Custom Standardization
        prepro_minmax_vals = parameters[8]              # Custom Minimum and Maximum Values
        prepro_thresholds = parameters[9]               # Thresholds
        calculateMethod = parameters[10]                # Index Calculation Method
        variableWeights = parameters[11]                # Weights
        outIndexName = parameters[12]                   # Output Index Name
        outInvert = parameters[13]                      # Invert Output Index Values
        postpro_minmax = parameters[14]                 # Minimum and Maximum Values
        postpro = parameters[15].values                 # Output Index Classification
        postpro_classes = parameters[16]                # Index Number of Classes
        postpro_reclass_table = parameters[17]          # Reclassification Table for Custom
        updated_table = parameters[18]                  # Reclassification Table for Custom

        #### Assure Not CSV and Writable ####
        if isCSV(inFeatures.value):
            inFeatures.setIDMessage("Error", 732, inFeatures.valueAsText)

        if appendField.value:
            if isReadOnly(inFeatures.value) :
                inFeatures.setIDMessage("Error", 381, inFeatures.valueAsText)

        # # Check for invalid input variables
        uniqueInputFields = set()
        if inFeatures.value and inputFields.value:
            self.fcType(inFeatures.value)
            for row in inputFields.value:
                if row[0] is not None and row[0].value is not None:
                    field = row[0].value
                    # if field is None:
                        # inputFields.setIDMessage("ERROR", 728, str(row[0].value))
                    # else:
                    if field in uniqueInputFields:
                        inputFields.setIDMessage("ERROR", 110182, field)
                    else:
                        uniqueInputFields.add(field)

        # check the range of the stdev for custom z-score
        if prepro_sdmean_vals.value is not None:
            for row in prepro_sdmean_vals.value:
                if row[2] <= 0:
                    prepro_sdmean_vals.setIDMessage("ERROR", 531)

        # check the weights values
        if variableWeights.value is not None:
            for row in variableWeights.value:
                if row[1] <= 0:
                    variableWeights.setIDMessage("ERROR", 531)

        # Make optional parameters required in pre-processing
        if prepro == "CUST_ZSCORE":
            if prepro_sdmean_vals.value is not None:
                valText = prepro_sdmean_vals.valueAsText.split(";")
                vals = prepro_sdmean_vals.value
                for rowIdx, row in enumerate(vals):
                    meanStdVals = valText[rowIdx].split(" ")
                    for colIdx, col in enumerate(row):
                        if colIdx == 0: continue
                        if meanStdVals[colIdx] in ['#', "", None]:
                            prepro_sdmean_vals.setIDMessage("ERROR", 530)

        if prepro == "CUST_MINMAX":
            if prepro_minmax_vals.value is not None:
                valText = prepro_minmax_vals.valueAsText.split(";")
                vals = prepro_minmax_vals.value
                for rowIdx, row in enumerate(vals):
                    min = -2
                    max = -1
                    for colIdx, col in enumerate(row):
                        if colIdx == 0: continue
                        val = valText[rowIdx].split(" ")[colIdx]
                        if val in ['#', "", None]:
                            prepro_minmax_vals.setIDMessage("ERROR", 530)
                        else:
                            if ',' in val:
                                val = val.replace(',', '.')
                                val = val.replace(",", ".", val.count(".") - 1)
                            if colIdx == 1:
                                min = float(val)
                            elif colIdx == 2:
                                max = float(val)
                    if max <= min:
                        prepro_minmax_vals.setIDMessage("ERROR", 10443)

        elif prepro == "BINARY":
            if prepro_thresholds.value is None:
                prepro_thresholds.setIDMessage("ERROR", 530)
            else:
                valText = prepro_thresholds.valueAsText.split(";")
                vals = prepro_thresholds.value
                for rowIdx, row in enumerate(vals):
                    for colIdx, col in enumerate(row):
                        if colIdx == 0: continue
                        if valText[rowIdx].split(' ')[colIdx] in ['#', '', None]:
                            prepro_thresholds.setIDMessage("ERROR", 530)

            if prepro_flags_scale_method.value == "THRESHOLD_CUST_MINMAX":
                if prepro_minmax_vals.value is not None:
                    valText = prepro_minmax_vals.valueAsText.split(";")
                    vals = prepro_minmax_vals.value
                    for rowIdx, row in enumerate(vals):
                        for colIdx, col in enumerate(row):
                            if colIdx == 0: continue
                            if valText[rowIdx].split(" ")[colIdx] in ['#', "", None]:
                                prepro_minmax_vals.setIDMessage("ERROR", 530)
                else:
                    prepro_minmax_vals.setIDMessage("ERROR", 530)
            elif prepro_flags_scale_method.value == "THRESHOLD_CUST_ZSCORE":
                if prepro_sdmean_vals.value is not None:
                    valText = prepro_sdmean_vals.valueAsText.split(";")
                    vals = prepro_sdmean_vals.value
                    for rowIdx, row in enumerate(vals):
                        for colIdx, col in enumerate(row):
                            if colIdx == 0: continue
                            if valText[rowIdx].split(" ")[colIdx] in ['#', "", None]:
                                prepro_sdmean_vals.setIDMessage("ERROR", 530)
                else:
                    prepro_sdmean_vals.setIDMessage("ERROR", 530)

        # informatives for at leat 2 input feilds
        if not inputFields.hasError():
            filedCount = 0
            if inputFields.value is not None:
                for row in inputFields.value:
                    filedCount += 1

            if filedCount == 1:
                inputFields.setIDMessage("WARNING", 230016, 2)

        # Make optional parameters required in post-processing
        if postpro:
            for outCls in postpro:
                if outCls == "EQINTERVAL" or outCls == "QUANTILE":
                    if postpro_classes.value is None:
                        postpro_classes.setIDMessage("ERROR", 530)
                elif outCls == "CUST":
                    if postpro_reclass_table.value is None:
                        postpro_reclass_table.setIDMessage("ERROR", 530)
                    else:
                        valText = postpro_reclass_table.valueAsText.split(";")
                        vals = postpro_reclass_table.value
                        for rowIdx, row in enumerate(vals):
                            boudVal = valText[rowIdx].split(" ")
                            for colIdx, col in enumerate(row):
                                if boudVal[colIdx] in ['#', "", None]:
                                    postpro_reclass_table.setIDMessage("ERROR", 530)

        # Informative msgs for thresholds
        if prepro == "BINARY":
            if prepro_flags_scale_method.value == "THRESHOLD_RAW":
                prepro_flags_scale_method.setIDMessage("WARNING", 230013)
            elif prepro_flags_scale_method.value in ["THRESHOLD_ZSCORE", "THRESHOLD_CUST_ZSCORE"]:
                prepro_flags_scale_method.setIDMessage("WARNING", 230014)
            elif prepro_flags_scale_method.value in ["THRESHOLD_MINMAX", "THRESHOLD_CUST_MINMAX", "THRESHOLD_PERCENTILE"]:
                prepro_flags_scale_method.setIDMessage("WARNING", 230015)

        if postpro_minmax.value:
            minMaxProvided = False
            vals = postpro_minmax.valueAsText.split(' ')
            if not vals[0] in ['#', '', None] and not vals[1] in ['#', '', None]:
                minMaxProvided = True
            else:
                postpro_minmax.setIDMessage("ERROR", 530)
            if minMaxProvided:
                for row in postpro_minmax.value:
                    if row[1] <= row[0]:
                        postpro_minmax.setIDMessage("ERROR", 10443)
                
        return


    def execute(self, parameters, messages):
        import SSCompositeIndex as SSCI
        SSCI.execute(parameters, messages)

    def postExecute(self, parameters):
        import SSCompositeIndex as SSCI
        if not parameters[2].value:
            SSCI.postProcessing(parameters)


class ConvertSSPopup(object):
    def __init__(self):
        self.label = "Convert Spatial Statistics Popup Charts for Web Display"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Utilities"
        # self.helpContext =

    def getParameterInfo(self):
        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']

        param1 = ARCPY.Parameter(displayName="Output Features",
                                 name="out_feature_class",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")

        param2 = ARCPY.Parameter(displayName="Width",
                                 name="img_width",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param2.filter.type = "Range"
        param2.value = None
        param2.filter.list = [300, 1600]
        param2.category = "Image Properties"

        param3 = ARCPY.Parameter(displayName="Height",
                                 name="img_height",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param3.filter.type = "Range"
        param3.value = None
        param3.filter.list = [300, 1000]
        param3.category = "Image Properties"

        param4 = ARCPY.Parameter(displayName="Rotate X Axis Labels",
                                 name="rotate_x_axis_labels",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ['ROTATE', 'NO_ROTATE']
        param4.value = False
        param4.category = "Image Properties"


        params = [param0, param1, param2, param3, param4]
        return params

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        return

    def updateMessages(self, parameters):
        inputFCParam = parameters[0]
        outputFCParam = parameters[1]

        #### Auto fill the field name if possible ####
        if inputFCParam.value:
            try:
                info = ARCPY.Describe(inputFCParam.value)
                if hasattr(info, "HasOID64") and info.HasOID64:
                    inputFCParam.setIDMessage("ERROR", 110520)
                    return
                path = info.catalogPath
                if UTILS.isShapeFile(path):
                    inputFCParam.setIDMessage("ERROR", 110513)
                    return
                field_exist = False
                for f in info.fields:
                    if f.type.upper() in ["STRING", "TEXT"] and f.name.upper() == "HTML_CHART":
                        field_exist = True
                        break
                if not field_exist:
                    inputFCParam.setIDMessage("ERROR", 110514)
                    return
            except:
                pass
        if outputFCParam.value:
            outputFC = outputFCParam.valueAsText
            if outputFC != inputFCParam.value and UTILS.isShapeFile(outputFC):
                outputFCParam.setIDMessage("ERROR", 110515)
                return
        return

    def execute(self, parameters, messages):
        import SSPopupImageConvertor as POPCON
        POPCON.execute(parameters, messages)

    def postExecute(self, parameters):
        #### Update Pop-up titles ####
        UTILS.postExecuteUpdatePopupTitle(parameters, 1, -1)


class CausalInferenceAnalysis(object):
    def __init__(self):
        self.label = "Causal Inference Analysis"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Modeling Spatial Relationships"
        self.helpContext = 9060017

    def isReadOnly(self, input):
        """Returns whether the input is a dataset read only
        INPUTS:
        input (str): feature layer/Table View (string), fc input, fc output

        OUTPUT:
        return (bool): is the input in a gdb?
        """
        formatReadOnly = [".BDC", ".CSV"]
        isContained = False
        path = input
        try:
            d = ARCPY.Describe(input)
            path = d.CatalogPath.upper()
            for ext in formatReadOnly:
                if ext in path:
                    isContained = True
                    break

            if d.dataType in ["FeatureLayer", "TableView"] and ".NC" in path:
                isContained = True
        except:
            pass
        return isContained

    def getParameterInfo(self):
        param0 = ARCPY.Parameter(displayName="Input Features or Table",
                                 name="in_features",
                                 datatype="GPTableView",
                                 parameterType="Required",
                                 direction="Input")
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Outcome Field",
                                 name="outcome_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.list = ['Short', 'Long', 'Float', 'Double', "BigInteger"]
        param1.parameterDependencies = [param0.name]
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Exposure Field",
                                 name="exposure_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input")
        param2.filter.list = ["Short", "Long", "Float", "Double", "BigInteger"]
        param2.parameterDependencies = [param0.name]
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Confounding Variables",
                                 name="confounding_variables",
                                 datatype="GPValueTable",
                                 parameterType="Required",
                                 direction="Input")
        param3.parameterDependencies = [param0.name]
        param3.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param3.columns = [['Field', 'Variable'], ['GPBoolean', 'Categorical']]
        param3.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger", "Text"]
        param3.filters[1].type = "ValueList"
        param3.filters[1].list = ["CATEGORICAL", "NUMERIC"]
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Output Features or Table",
                                 name="out_features",
                                 datatype=["DEFeatureClass", "DETable"],
                                 parameterType="Required",
                                 direction="Output")
        param4.displayOrder = 6

        param5 = ARCPY.Parameter(displayName="Propensity Score Calculation Method",
                                 name="ps_method",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.type = "ValueList"
        param5.filter.list = ["REGRESSION", "GRADIENT_BOOSTING"]
        param5.value = "REGRESSION"
        param5.displayOrder = 4

        param6 = ARCPY.Parameter(displayName="Balancing Method",
                                 name="balancing_method",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.type = "ValueList"
        param6.filter.list = ["MATCHING", "WEIGHTING"]
        param6.value = 'MATCHING'
        param6.displayOrder = 5

        param7 = ARCPY.Parameter(displayName="Enable Exposure-Response Function Pop-ups",
                                 name="enable_erf_popups",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = ['CREATE_POPUP', 'NO_POPUP']
        param7.value = False
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Output Exposure-Response Function Table",
                                 name="out_erf_table",
                                 datatype="DETable",
                                 parameterType="Optional",
                                 direction="Output")
        param8.displayOrder = 8

        param9 = ARCPY.Parameter(displayName="Target Outcome Values for Calculating New Exposures",
                                 name="target_outcomes",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 multiValue=True,
                                 direction="Input")
        param9.displayOrder = 9

        param10 = ARCPY.Parameter(displayName="Target Exposure Values for Calculating New Outcomes",
                                 name="target_exposures",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 multiValue=True,
                                 direction="Input")
        param10.displayOrder = 10

        param11 = ARCPY.Parameter(displayName="Lower Exposure Quantile",
                                 name="lower_exp_trim",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 direction="Input")
        param11.category = "Trimming Options"
        param11.filter.type = "Range"
        param11.filter.list = [0.0, 1.0]
        param11.value = 0.01
        param11.displayOrder = 11

        param12 = ARCPY.Parameter(displayName="Upper Exposure Quantile",
                                 name="upper_exp_trim",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 direction="Input")
        param12.category = "Trimming Options"
        param12.filter.type = "Range"
        param12.filter.list = [0.0, 1.0]
        param12.value = 0.99
        param12.displayOrder = 12

        param13 = ARCPY.Parameter(displayName="Lower Propensity Score Quantile",
                                 name="lower_ps_trim",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 direction="Input")
        param13.category = "Trimming Options"
        param13.filter.type = "Range"
        param13.filter.list = [0.0, 1.0]
        param13.value = 0.0
        param13.displayOrder = 13

        param14 = ARCPY.Parameter(displayName="Upper Propensity Score Quantile",
                                 name="upper_ps_trim",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 direction="Input")
        param14.category = "Trimming Options"
        param14.filter.type = "Range"
        param14.filter.list = [0.0, 1.0]
        param14.value = 1.0
        param14.displayOrder = 14

        param15 = ARCPY.Parameter(displayName="Number of Exposure Bins",
                                  name="num_bins",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param15.category = "Advanced Matching Options"
        param15.filter.type = "Range"
        param15.filter.list = [2, 9999]
        param15.value = None
        param15.displayOrder = 15

        param16 = ARCPY.Parameter(displayName="Relative Weight of Propensity to Exposure",
                                  name="scale",
                                  datatype="GPDouble",
                                  parameterType="Optional",
                                  direction="Input")
        param16.category = "Advanced Matching Options"
        param16.filter.type = "Range"
        param16.filter.list = [0.0, 1.0]
        param16.value = None
        param16.displayOrder = 16

        param17 = ARCPY.Parameter(displayName="Balance Type",
                                  name="balance_type",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param17.category = "Advanced Balancing Options"
        param17.filter.type = "ValueList"
        param17.filter.list = ["MEAN", "MEDIAN", "MAXIMUM"]
        param17.value = 'MEAN'
        param17.displayOrder = 17

        param18 = ARCPY.Parameter(displayName="Balance Threshold",
                                  name="balance_threshold",
                                  datatype="GPDouble",
                                  parameterType="Optional",
                                  direction="Input")
        param18.category = "Advanced Balancing Options"
        param18.filter.type = "Range"
        param18.filter.list = [0.0, 1.0]
        param18.value = 0.1
        param18.displayOrder = 18

        param19 = ARCPY.Parameter(displayName="Bandwidth Estimation Method",
                                 name="bw_method",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param19.category = "Advanced Exposure-Response Function Options"
        param19.filter.type = "ValueList"
        param19.filter.list = ["PLUG_IN", "CV", "MANUAL"]
        param19.value = 'PLUG_IN'
        param19.displayOrder = 19

        param20 = ARCPY.Parameter(displayName="Bandwidth",
                                 name="bandwidth",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 direction="Input")
        param20.category = "Advanced Exposure-Response Function Options"
        param20.displayOrder = 20
        param20.enabled = False

        param21 = ARCPY.Parameter(displayName="Create Bootstrapped Confidence Intervals",
                                 name="create_bootstrap_ci",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param21.filter.list = ['CREATE_CI', 'NO_CI']
        param21.category = "Advanced Exposure-Response Function Options"
        param21.value = False
        param21.displayOrder = 21

        return [param0, param1, param2, param3, param4,
                param5, param6, param7, param8, param9,
                param10, param11, param12, param13, param14,
                param15, param16, param17, param18, param19,
                param20, param21]

    def isLicensed(self):
        return True

    def updateParameters(self, parameters):
        param_in = parameters[0]
        param_conf = parameters[3]
        param_out = parameters[4]
        param_out_table = parameters[8]
        param_propenstiy_score_method = parameters[5]
        param_balancing_method = parameters[6]
        param_expo_quantile_lower = parameters[11]
        param_expo_quantile_upper = parameters[12]
        param_ps_quantile_lower = parameters[13]
        param_ps_quantile_upper = parameters[14]
        param_bin_num = parameters[15]
        param_scale = parameters[16]
        param_balance_type = parameters[17]
        param_balance_threshold = parameters[18]
        param_bw_est_method = parameters[19]
        param_bw = parameters[20]

        outcome_field = UTILS.getTextParameter(1, parameters)
        expo_field = UTILS.getTextParameter(2, parameters)
        if param_conf.value is not None:
            conf_fields = [(row[0].value, row[1]) for row in param_conf.value]
        else:
            conf_fields = None
        if parameters[9].value is not None:
            target_outcome_vars = parameters[9].values
        else:
            target_outcome_vars = None
        if parameters[10].value is not None:
            target_exposure_vars = parameters[10].values
        else:
            target_exposure_vars = None

        #### Automatically fill the output and suffix ####
        if param_in.value:
            if param_out.value is None and ARCPY.env.workspace is not None:
                #### Automatically populate the field names ####
                if len(ARCPY.env.workspace) > 0 and param_in.value:
                    extraChrt = ""
                    try:
                        int(OS.path.basename(param_in.valueAsText).split(".")[0])
                        extraChrt = "t"
                    except:
                        pass

                    try:
                        outputCandidate = OS.path.join(
                            ARCPY.env.workspace,
                            extraChrt + OS.path.basename(param_in.valueAsText).split(".")[
                                0] + "_CausalInferenceAnalysis")
                        outputCandidateFinal = outputCandidate
                        ind = 1
                        while ARCPY.Exists(outputCandidateFinal):
                            outputCandidateFinal = outputCandidate + str(ind)
                            ind += 1
                        param_out.value = outputCandidateFinal
                    except:
                        pass
        if param_in.altered and param_in.value and ARCPY.Exists(param_in.valueAsText):
            desc = ARCPY.Describe(param_in.valueAsText)
            dataType = desc.dataType.upper()
            if param_out.value:
                try:
                    output = param_out.valueAsText
                    if not UTILS.isGDB(output, checkSDE=True) and not output.lower().startswith(
                            "memory\\") and not output.lower().startswith("in_memory\\"):
                        if dataType in ['SHAPEFILE', 'FEATURECLASS', 'FEATURELAYER']:
                            if not output.lower().endswith(".shp"):
                                dir = OS.path.dirname(output)
                                fn = OS.path.basename(output).split(".")[0] + ".shp"
                                param_out.value = OS.path.join(dir, fn)
                        else:
                            if not output.lower().endswith(".dbf"):
                                dir = OS.path.dirname(output)
                                fn = OS.path.basename(output).split(".")[0] + ".dbf"
                                param_out.value = OS.path.join(dir, fn)
                except:
                    pass
            if param_out_table.value:
                try:
                    output = param_out_table.valueAsText
                    if not UTILS.isGDB(output, checkSDE=True) and not output.lower().startswith(
                            "memory\\") and not output.lower().startswith("in_memory\\"):
                        if not output.lower().endswith(".dbf"):
                            dir = OS.path.dirname(output)
                            fn = OS.path.basename(output).split(".")[0] + ".dbf"
                            param_out_table.value = OS.path.join(dir, fn)
                except:
                    pass

        #### Auto set non-numerical confounder fields as categorical ####
        if param_in.value and param_conf.value:
            field_dict = {}
            try:
                tb_val = []
                for f in ARCPY.ListFields(ARCPY.Describe(param_in.valueAsText).catalogPath):
                    field_dict[f.name] = [f.type, f.aliasName]
                for indRow, vtRow in enumerate(param_conf.value):
                    confField = vtRow[0].value
                    isCat = vtRow[1]
                    r = [confField, isCat]
                    if not isCat and confField in field_dict and field_dict[confField][0].upper() in ["STRING", "TEXT"]:
                        # vtRow[1] = True
                        r[1] = True
                    tb_val.append(r)
                param_conf.value = tb_val
            except:
                pass

        #### Fill up the default value if None ####
        if param_balancing_method.value is None:
            param_balancing_method.value = "MATCHING"
        if param_balancing_method.value == "MATCHING":
            param_bin_num.enabled = True
            param_scale.enabled = True
        else:
            clearParameter(param_bin_num)
            clearParameter(param_scale)

        param_expo_quantile_lower = parameters[11]
        param_expo_quantile_upper = parameters[12]
        param_ps_quantile_lower = parameters[13]
        param_ps_quantile_upper = parameters[14]
        
        if param_expo_quantile_lower.value is None:
            param_expo_quantile_lower.value = 0.01
        
        if param_expo_quantile_upper.value is None:
            param_expo_quantile_upper.value = 0.99

        if param_ps_quantile_lower.value is None:
            param_ps_quantile_lower.value = 0.0

        if param_ps_quantile_upper.value is None:
            param_ps_quantile_upper.value = 1.0
        
        if param_balance_type.value is None:
            param_balance_type.value = "MEAN"

        if param_balance_threshold.value is None:
            param_balance_threshold.value = 0.1

        if param_bw_est_method.value is None:
            param_bw_est_method.value = "PLUG_IN"

        #### Show/hide parameters ####
        # if not param_exposure_is_binary.value and param_balancing_method.valueAsText == "MATCHING":
        #     param_bin_num.enabled = True
        #     param_scale.enabled = True
        # else:
        #     param_bin_num.enabled = False
        #     param_scale.enabled = False
        if param_bw_est_method.value and param_bw_est_method.valueAsText == "MANUAL":
            param_bw.enabled = True
        else:
            clearParameter(param_bw)

        #### Build Output Fields ####
        if param_out.value and param_in.value and outcome_field and expo_field and conf_fields and param_propenstiy_score_method.value and param_balancing_method.value:
            try:
                import SSCausalInferenceAnalysis as CIA
                additional_fields_main, additional_fields_table = CIA.buildOutputFCSchema(
                    param_in.valueAsText, param_out.valueAsText, param_out_table.value,
                    outcome_field, expo_field, conf_fields,
                    param_propenstiy_score_method.valueAsText, param_balancing_method.valueAsText,
                    target_outcome_vars, target_exposure_vars)

                param_out.schema.additionalFields = additional_fields_main
                param_out_table.schema.additionalFields = additional_fields_table
            except:
                pass
        return

    def updateMessages(self, parameters):
        param_in = parameters[0]
        param_outcome = parameters[1]
        param_expo = parameters[2]
        param_conf = parameters[3]
        param_out = parameters[4]
        param_out_table = parameters[8]
        param_target_outcome = parameters[9]
        param_target_exposure = parameters[10]
        param_expo_trim_quantile_lower = parameters[11]
        param_expo_trim_quantile_upper = parameters[12]
        param_propen_trim_quantile_lower = parameters[13]
        param_propen_trim_quantile_upper = parameters[14]
        param_balance_threshold = parameters[18]
        # param_balancing_attempt_num = parameters[16]
        param_bw = parameters[20]
        
        if param_in.value:
            try:
                inPath = param_in.valueAsText
                desc = ARCPY.Describe(inPath)
                if not desc.hasOID:
                    # will not support iput table without objectid
                    param_in.setIDMessage("ERROR", 732, inPath, inPath)  # Invalid input: The input Related Table does not have an ObjectID field.
                    return
            except:
                pass
                

        #### Check duplicated fields ####
        if param_outcome.value and param_expo.value:
            if param_outcome.valueAsText == param_expo.valueAsText:
                param_expo.setIDMessage("ERROR", 110182, param_outcome.valueAsText)
        if param_conf.value:
            repeatedInItself, compareOther = checkRepeated(param_conf.value, 0)
            if repeatedInItself is not None:
                param_conf.setIDMessage("ERROR", 110182, repeatedInItself)
            confVars = [row[0].value for row in param_conf.value]
            # for rowInd, row in enumerate(param_conf.value):
            #     confVars.append(row[0].valuAsText)
            if param_outcome.value:
                outcomeVar = param_outcome.valueAsText
                if outcomeVar in confVars:
                    param_conf.setIDMessage("ERROR", 110182, outcomeVar)
            if param_expo.value:
                expoVar = param_expo.valueAsText
                if expoVar in confVars:
                    param_conf.setIDMessage("ERROR", 110182, expoVar)

        if param_in.value and param_out.value is None:
            param_out.setIDMessage("ERROR", 530)

        #### VAlidate triming boundaries ####
        if param_expo_trim_quantile_lower.value is not None and param_expo_trim_quantile_upper.value is not None and param_expo_trim_quantile_lower.value >= param_expo_trim_quantile_upper.value:
            param_expo_trim_quantile_upper.setIDMessage("ERROR", 110523)

        if param_propen_trim_quantile_lower.value is not None and param_propen_trim_quantile_upper.value is not None and param_propen_trim_quantile_lower.value >= param_propen_trim_quantile_upper.value:
            param_propen_trim_quantile_upper.setIDMessage("ERROR", 110523)

        #### 0 and 1 are not allowed for balance threshold ####
        if param_balance_threshold.value == 0 or param_balance_threshold.value == 1:
            param_balance_threshold.setIDMessage("ERROR", 854, 0, 1)

        # if param_balancing_attempt_num.value is None:
        #     param_balancing_attempt_num.value = 5

        #### Checke duplicated values in target outcome param ####
        for param in [param_target_outcome, param_target_exposure]:
            if param.value is not None:
                values = []
                dup_values = []
                for v in param.values:
                    if v in values:
                        if v not in dup_values:
                            dup_values.append(v)
                    else:
                        values.append(v)
                if len(dup_values):
                    param.setIDMessage("ERROR", 400)

        if param_bw.enabled:
            if not param_bw.value:
                param_bw.setIDMessage("ERROR", 530)
            elif param_bw.value <= 0:
                param_bw.setIDMessage("ERROR", 531)

        if param_out.value is not None and param_out_table.value is not None:
            if param_out.valueAsText == param_out_table.valueAsText:
                param_out_table.setIDMessage("ERROR", 110275, param_out_table.valueAsText)
                return
            elif param_out.valueAsText.lower().removesuffix(".shp") == param_out_table.valueAsText.lower().removesuffix(".dbf"):
                param_out_table.setIDMessage("ERROR", 110462)
                return 
        return

    def execute(self, parameters, messages):
        import SSCausalInferenceAnalysis as CIA
        CIA.execute(parameters, messages)

    def postExecute(self, parameters):
        import SSCausalInferenceAnalysis as CIA
        CIA.postExecute(parameters)

class AttributeUncertainty(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Assess Sensitivity to Attribute Uncertainty"
        self.description = "For select Spatial Statistics analytical results, this tool evaluates how the analysis results change when the value of the analysis variable is adjusted within its margin of error, its confidence bounds, or by a specified percentage of its original value."
        self.category = "Assessing Sensitivity"
        self.helpContext = 9020001

    def getParameterInfo(self):
        """Define the tool parameters."""
        """Define parameter definitions"""
        params = []

        param0 = ARCPY.Parameter(
            displayName="Analysis Result Features",
            name="in_features",
            datatype="GPFeatureLayer",
            parameterType="Required",
            direction="Input")
        params.append(param0)

        param1 = ARCPY.Parameter(
            displayName="Output Features",
            name="out_features",
            datatype="DEFeatureClass",
            parameterType="Required",
            direction="Output")
        params.append(param1)

        param2 = ARCPY.Parameter(
            displayName="Output Simulation Table",
            name="out_simulation_table",
            datatype="DETable",
            parameterType="Optional",
            direction="Output")
        params.append(param2)

        param3 = ARCPY.Parameter(
            displayName="Analysis Input Features",
            name="analysis_input_features",
            datatype="GPFeatureLayer",
            parameterType="Optional",
            direction="Input")
        param3.enabled = False
        params.append(param3)

        param4 = ARCPY.Parameter(
            displayName="Uncertainty Type",
            name="uncertainty_measure",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")
        param4.filter.type = "ValueList"
        param4.filter.list = ["MOE", "CONFIDENCE_BOUNDS", "PERCENTAGE"]
        param4.value = "MOE"
        params.append(param4)

        param5 = ARCPY.Parameter(
            displayName="Margin of Error Field",
            name="moe_field",
            datatype="GPValueTable",
            parameterType="Optional",
            direction="Input")
        param5.columns = [['Field', 'Analysis Variable', 'ReadOnly'], ['Field', 'Margin of Error Field']]
        param5.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param5.parameterDependencies = [param3.name]
        param5.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param5.filters[1].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        params.append(param5)

        param6 = ARCPY.Parameter(
            displayName="Confidence Bound Field",
            name="confidence_bound_field",
            datatype="GPValueTable",
            parameterType="Optional",
            direction="Input")
        param6.columns = [['Field', 'Analysis Variable', 'ReadOnly'], ['Field', 'Lower Bound Field'], ['Field', 'Upper Bound Field']]
        param6.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param6.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param6.filters[1].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param6.filters[2].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param6.parameterDependencies = [param3.name]
        params.append(param6)

        param7 = ARCPY.Parameter(
            displayName="Percentage Below and Above Values",
            name="randomize_pct",
            datatype="GPValueTable",
            parameterType="Optional",
            direction="Input")
        param7.columns = [['Field', 'Analysis Variable','ReadOnly'], ['GPDouble', 'Percentage Below'], ['GPDouble', 'Percentage Above']]
        param7.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param7.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param7.parameterDependencies = [param3.name]
        params.append(param7)

        param8 = ARCPY.Parameter(
            displayName="Number of Simulations",
            name="num_simulations",
            datatype="GPLong",
            parameterType="Optional",
            direction="Input")
        param8.filter.type = "Range"
        param8.filter.list = [10, 1000]   
        param8.value = 30
        params.append(param8)

        param9 = ARCPY.Parameter(
            displayName="Simulation Method",
            name="simulation_method",
            datatype="GPString",
            parameterType="Optional",
            direction="Input")
        param9.filter.type = "ValueList"
        param9.filter.list = ["NORMAL", "UNIFORM", "TRIANGULAR"]
        param9.value = "NORMAL"
        params.append(param9)

        param10 = ARCPY.Parameter(
            displayName="Workspace for Simulation Results",
            name="output_workspace",
            datatype="DEWorkspace",
            parameterType="Optional",
            direction="Input")
        param10.enabled = True
        param10.category = "Advanced Options"
        params.append(param10)

        param11 = ARCPY.Parameter(
            displayName="Simulation Data Limits",
            name="sim_data_limits",
            datatype="GPValueTable",
            parameterType="Optional",
            direction="Input")
        param11.columns = [['Field', 'Analysis Variable','ReadOnly'], ['GPDouble', 'Lower Bound'], ['GPDouble', 'Upper Bound']]
        param11.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param11.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param11.parameterDependencies = [param3.name]
        param11.category = "Advanced Options"
        params.append(param11)

        param12 = ARCPY.Parameter(
            displayName="Margin of Error Confidence Level",
            name="moe_conf_level",
            datatype="GPLong",
            parameterType="Optional",
            direction="Input")
        param12.category = "Advanced Options"
        param12.filter.type = "Range"
        param12.filter.list = [50, 99]
        param12.value = 90
        params.append(param12)

        param13 = ARCPY.Parameter(
            displayName="Output Group Layer",
            name="out_group_layer",
            datatype="GPGrouplayer",
            parameterType="Derived",
            direction="Output")
        param13.enabled = False
        params.append(param13)

        param14 = ARCPY.Parameter(
            displayName="Output Workspace",
            name="out_workspace",
            datatype="DEWorkspace",
            parameterType="Derived",
            direction="Input")
        params.append(param14)
        return params

    def isLicensed(self):
        """Set whether the tool is licensed to execute."""
        return True

    def getFieldsDictCount(self, fields, filter):
        """Get the field names from the fields object"""
        fldsAliases = {}
        nFlds = 0
        for fld in fields:
            if fld.type in filter:
                if fld.aliasName in fldsAliases:
                    fldsAliases[fld.aliasName] += 1
                else:
                    fldsAliases[fld.aliasName] = 0
                
                nFlds += 1
        return fldsAliases

    def getMetadata(self, parameters):
        if parameters[0].value:
            map = None
            project = None
            checkLayer = True
            try:
                project = ARCPY.mp.ArcGISProject('current')
                checkLayer = False
            except:
                pass

            if project is None:
                checkLayer = False
            else:
                map = project.activeMap

            if checkLayer and  map is None:
                checkLayer = False

            layer_metadata = None
            lyrSelected = None

            if map is not None:
                path, name = OS.path.split(parameters[0].valueAsText)
                lyrs = map.listLayers(name)
                lyrParam = parameters[0].value

                try:
                    n = len(lyrs)
                    if n > 0:
                        if n == 1:
                            parVal = parameters[0].valueAsText
                            if parVal == lyrs[0].name or \
                               (len(parVal) != len(lyrs[0].name) and  parVal.endswith(lyrs[0].name)):
                                lyrSelected = lyrs[0]
                        else:
                            for lyr in lyrs:
                                if lyr.URI.upper() == lyrParam.URI.upper():
                                    lyrSelected = lyr
                                    break
                except:
                    pass
            try:
                if lyrSelected is not None:
                    layer_metadata = lyrSelected.metadata
                else:
                    layer_metadata = ARCPY.metadata.Metadata(parameters[0].value)
            except:
                return None

            return layer_metadata
        else:
            return None

    def getValue(self, val, upper = True):
        if val is str:
            return val
        if hasattr(val, "value"):
            if upper:
                return  str(val.value).upper() if val.value is not None else None
            else:
                return  str(val.value) if val.value is not None else None
        return val

    def updateParameters(self, parameters):
        ### Parameters indices ####
        idResult = 0
        idOutput = 1
        idSimTable = 2
        idInput = 3
        idType = 4
        idMOE = 5
        idConf = 6
        idPct = 7
        idSim = 8
        idSimMethod = 9
        idWS = 10
        idSimLimits = 11
        idMOEConf = 12
        idGL = 13
        idWSReal = 14
        toolAttributeName = "AttributeUncertainty"
        sameIdResult, previoutIdResultValue = isSameInCache(toolAttributeName, parameters, 0)

        if sameIdResult == 0:
            parameters[idMOE].value = None
            parameters[idConf].value = None
            parameters[idPct].value = None
            parameters[idSimLimits].value = None

        parameters[idMOE].enabled = False
        parameters[idConf].enabled = False
        parameters[idPct].enabled = False
        isMOE = False
        isConfidence = False
        isPercentage = False

        parameters[idWSReal].value = parameters[idWS].value

        if parameters[idType].value in ["", "#", None]:
            if parameters[idMOE].value is not None and \
                parameters[idConf].value is None and \
                parameters[idPct].value is None:
                parameters[idType].value = "MOE"
            elif parameters[idConf].value is not None and \
                parameters[idMOE].value is None and \
                parameters[idPct].value is None:
                parameters[idType].value = "CONFIDENCE_BOUNDS"
            elif parameters[idPct].value is not None and \
                parameters[idMOE].value is None and \
                parameters[idConf].value is None:
                parameters[idType].value = "PERCENTAGE"
            else:
                parameters[idType].value = "MOE"

        match parameters[idType].value:
            case "MOE":
                parameters[idMOE].enabled = True
                parameters[idConf].value = None
                parameters[idPct].value = None
                isMOE = True
                parameters[idSimMethod].filter.list = ["NORMAL", "UNIFORM", "TRIANGULAR"]

            case "CONFIDENCE_BOUNDS":
                parameters[idConf].enabled = True
                parameters[idMOE].value = None
                parameters[idPct].value = None
                isConfidence = True

                if parameters[idSimMethod].value  in ["NORMAL" ]:
                    parameters[idSimMethod].filter.list = ["UNIFORM", "TRIANGULAR"]
                    parameters[idSimMethod].value =  "UNIFORM"
                else:
                    parameters[idSimMethod].filter.list = ["UNIFORM", "TRIANGULAR"]

            case "PERCENTAGE":
                parameters[idPct].enabled = True 
                parameters[idMOE].value = None
                parameters[idConf].value = None
                isPercentage = True
                if parameters[idSimMethod].value  in ["NORMAL" ]:
                    parameters[idSimMethod].filter.list = ["UNIFORM", "TRIANGULAR"]
                    parameters[idSimMethod].value =  "UNIFORM"
                else:
                    parameters[idSimMethod].filter.list = ["UNIFORM", "TRIANGULAR"]

        cmd = None
        tool_name = None
        infoMeta = None
        latest_FC = None
        analysis_vars = None

        if sameIdResult in [0, 2]: 
            layer_metadata = self.getMetadata(parameters = parameters)  
            if layer_metadata is None:
                cleanParameters(parameters, [idMOE, idPct, idConf, idSimLimits])
                setVariableInCache(toolAttributeName, parameters, 0, None)
            else:
                root = XMLFromString(layer_metadata.xml)
                process_elements = root.findall(".//Process[@ToolSource]")

                # Extracted elements as string
                extracted_elements = [XMLToString(elem, encoding='unicode') for elem in process_elements]

                tool_name, datetime_str, latest_FC, analysis_vars, cmd = extract_tool_info(extracted_elements)
                infoMeta = (tool_name, datetime_str, latest_FC, analysis_vars, cmd)
                setVariableInCache(toolAttributeName, parameters, 0, infoMeta)
        else:
            infoMeta = getVariableFromCache(toolAttributeName, parameters, 0)
            if infoMeta is not None:
                tool_name, datetime_str, latest_FC, analysis_vars, cmd = infoMeta

        if parameters[idResult].value:
            valueTable_list_2col = []
            valueTable_list_3col = []

            foundMetadata = True
            analysis_var_list = []

            if infoMeta is not None:

                #### It is not supported the  GeoAnalytics tool  ####
                if tool_name == "GeneralizedLinearRegression" and cmd is None:
                    tool_name = None

                if tool_name == "GeneralizedLinearRegression" and cmd[3] not in [fr'CONTINUOUS', fr'"{ARCPY.GetIDMessage(220992)}"', fr'"Continuous (Gaussian)"']:
                    analysis_var_list = cmd[5].split(';')
                elif tool_name in ["OptimizedHotSpotAnalysis", "OptimizedOutlierAnalysis"]:
                    analysis_var_list = cmd[3].split(';')
                else:
                    if tool_name is not None:
                        analysis_var_list = [item for sublist in analysis_vars for item in (sublist if isinstance(sublist, list) else [sublist])]

                if tool_name is not None:
                    valueTable_list_2col = [[item, None] for item in analysis_var_list]
                    valueTable_list_3col = [[item, None, None] for item in analysis_var_list]
            else:
                foundMetadata = False

            if tool_name is not None:
                if tool_name in ["HotSpots", "ClustersOutliers"]:
                    parameters[idSimTable].enabled = False
                elif tool_name in ["SpatialAutocorrelation", "GeneralizedLinearRegression"]:
                    parameters[idSimTable].enabled = True
                    if parameters[idSimTable].value is None:
                        desc = ARCPY.Describe(parameters[idResult].value)
                        name = desc.nameString if hasattr(desc, "nameString") else desc.name
                        wrkspc = ARCPY.env.workspace
                        if name[-4:].lower() in [".shp", ".dbf"]:
                            name = name[:-4]
                        isGroup = False
                        if "\\" in name:
                            name = name.split("\\")[-1]
                            isGroup = True
                        inPath, _ = OS.path.split(parameters[idResult].valueAsText)

                        ### To fix the python stand alone error###
                        if inPath == '' or isGroup or inPath.upper().startswith("HTTPS:"):
                            current = ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase
                        else:
                            current = inPath

                        ext = ""
                        currentUpper = current.upper()
                        if not UTILS.IsPathInGeoDatabase(currentUpper):
                            ext = ".dbf"

                            wrkspc, _ = OS.path.split(ARCPY.mp.ArcGISProject("CURRENT").defaultGeodatabase)

                        name = ARCPY.ValidateTableName(name)
                        parameters[idSimTable].value = UTILS.checkForDuplicateOutput(name + "_AttributeUncertaintySims", wrkspc, 0)

                else:
                    parameters[idSimTable].enabled = False

            exists = ARCPY.Exists(latest_FC)

            def existVariablesinInput(var_list):
                value = False
                if ARCPY.Exists(parameters[idInput].value):
                    lstF = ARCPY.ListFields (parameters[idInput].value)
                    cnt = 0
                    for fld in lstF:
                        if fld.name in var_list:
                            cnt+=1
                    if len(var_list) != cnt:
                        value =  False
                    else:
                        value  =True
                else:
                    value = False
                return value 

            if latest_FC in [None, ''] or not exists :
                if parameters[idInput].enabled and parameters[idInput].value is not None:
                    if existVariablesinInput(analysis_var_list):
                        latest_FC =  parameters[idInput].valueAsText
                    else:
                        latest_FC = None
                        valueTable_list_2col= []
                        valueTable_list_3col = []
                        cleanParameters(parameters, [idMOE, idPct, idConf, idSimLimits])
                else:
                    valueTable_list_2col= []
                    valueTable_list_3col = []
                    try:
                        if not ARCPY.Exists(parameters[idInput].value):
                            cleanParameters(parameters, [idMOE, idPct, idConf, idSimLimits])
                    except:
                        pass
            else:
                if exists:
                    parameters[idInput].enabled = False
                    parameters[idInput].value = latest_FC
                else:
                    if not parameters[idInput].enabled:
                        parameters[idInput].enabled = True
                    if not ARCPY.Exists( parameters[idInput].value):
                        parameters[idInput].value = None

            if not foundMetadata:
                return

            newValues = []
            if isMOE:
                values = parameters[idMOE].values
                if values is None:
                    if latest_FC in ['',None] or  len(valueTable_list_2col) == 0:
                        parameters[idMOE].values = [[None,None]]
                    else:
                        parameters[idMOE].values = valueTable_list_2col
                else:
                    if not self.checkDifferences(parameters[idMOE], analysis_var_list, False):
                        if len(analysis_var_list) > 0:
                            maxNVar = len(analysis_var_list)
                            for id, row in enumerate(values):
                                if id < maxNVar:
                                    if self.getValue(row[0]) == analysis_var_list[id].upper() and self.getValue(row[1]) is not None: 
                                        newValues.append([analysis_var_list[id], self.getValue(row[1], False)])
                                    else:
                                        newValues.append([analysis_var_list[id], None])
                            parameters[idMOE].value  = newValues

            if isConfidence:
                values = parameters[idConf].values
                if values is None :
                    if latest_FC in ['',None] or  len(valueTable_list_3col) == 0:
                        parameters[idConf].values = [[None,None,None]]
                    else:
                        parameters[idConf].values = valueTable_list_3col
                else:
                    if not self.checkDifferences(parameters[idConf], analysis_var_list, False):
                        if len(analysis_var_list) > 0:
                            maxNVar = len(analysis_var_list)
                            for id, row in enumerate(values):
                                if id < maxNVar:
                                    if self.getValue(row[0])== analysis_var_list[id].upper():
                                        left = self.getValue(row[1], False)
                                        right = self.getValue(row[2], False)
                                        newValues.append([analysis_var_list[id], left, right])
                                    else:
                                        newValues.append([analysis_var_list[id], None, None])
                            parameters[idConf].value  = newValues

            if isPercentage:
                values = parameters[idPct].values
                if values is None:
                    parameters[idPct].values = valueTable_list_3col
                else:
                    if not self.checkDifferences(parameters[idPct], analysis_var_list, False):
                        if len(analysis_var_list) > 0:
                            maxNVar = len(analysis_var_list)
                            for id, row in enumerate(values):
                                if id < maxNVar:
                                    if self.getValue(row[0])== analysis_var_list[id].upper():
                                        newValues.append([analysis_var_list[id], row[1], row[2]])
                                    else:
                                        newValues.append([analysis_var_list[id], '', ''])
                            parameters[idPct].value  = newValues

            disabledDataLimits = False
            if len(newValues) and  tool_name == "GeneralizedLinearRegression" and isMOE:
                n = len([row[1] for row in newValues if row[1] not in [None, '', "#"]])
                if n > 1:
                    disabledDataLimits = True

            if disabledDataLimits:
                parameters[idSimLimits].enabled = False
            else:
                parameters[idSimLimits].enabled = True
                valueLimits = parameters[idSimLimits].values
                valueLimitsSTR = parameters[idSimLimits].valueAsText
                newValuesLimit = []
                if valueLimits is None:
                    parameters[idSimLimits].values = valueTable_list_3col
                else:
                    if len(analysis_var_list) > 0:
                        maxNVar = len(analysis_var_list)
                        valueLimitsSTR = valueLimitsSTR.split(";")
                        for id, row in enumerate(valueLimits):
                            if id < maxNVar:
                                rowSTR = valueLimitsSTR[id].split(" ")
                                if self.getValue(row[0])== analysis_var_list[id].upper():
                                    lower = row[1]
                                    if rowSTR[1] == '#':
                                        lower = None
                                    upper = row[2]
                                    if rowSTR[2] == '#':
                                        upper = None
                                    newValuesLimit.append([analysis_var_list[id], lower, upper])
                                else:
                                    newValuesLimit.append([analysis_var_list[id], None, None])
                        parameters[idSimLimits].value  = newValuesLimit

        if parameters[idType].valueAsText != "MOE":
            parameters[idMOEConf].enabled = False
        else:
            parameters[idMOEConf].enabled = True

        if parameters[idSimMethod].value in ["", "#", None]:
            parameters[idSimMethod].value = "NORMAL"
        if parameters[idSim].value in ["", "#", None]:
            parameters[idSim].value = 30
        if parameters[idMOEConf].value in ["", "#", None]:
            parameters[idMOEConf].value = 90

        try:
            addSchemaUncertaintyTool(tool_name, parameters, cmd = cmd)
        except Exception as e:
            UTILS.dbg(e)
        return

    def updateMessages(self, parameters):
        idResult = 0
        idOutput = 1
        idSimTable = 2
        idInput = 3
        idType = 4
        idMOE = 5
        idConf = 6
        idPct = 7
        idSim = 8
        idSimMethod = 9
        idWS = 10
        idSimLimits = 11
        idMOEConf = 12
        idGL = 13

        toolAttributeName = "AttributeUncertainty"
        toolNames = {"ClustersOutliers": ARCPY.GetIDMessage(220965),
                     "HotSpots": ARCPY.GetIDMessage(220985),
                     "GeneralizedLinearRegression": ARCPY.GetIDMessage(220954),
                     "SpatialAutocorrelation": ARCPY.GetIDMessage(220986),
                     "OptimizedHotSpotAnalysis": ARCPY.GetIDMessage(220995),
                     "OptimizedOutlierAnalysis": ARCPY.GetIDMessage(220996)}

        if parameters[idResult].value:
            if parameters[idSimTable].value is not None and parameters[idOutput].value is not None:
                if parameters[idSimTable].valueAsText.lower() == parameters[idOutput].valueAsText.lower():
                    #### Output Simulation Table is the same as Output Features. ####
                    parameters[idSimTable].setIDMessage("ERROR", 110572)

            analysis_var_list = []
            layer_metadata = None
            analysis_vars = None
            cmd = None
            infoMeta = getVariableFromCache(toolAttributeName, parameters, 0)
            tool_name = None
            latest_FC = None
            datetime_str = None

            if infoMeta is not None:
                tool_name, datetime_str, latest_FC, analysis_vars, cmd = infoMeta
            else:
                layer_metadata = self.getMetadata(parameters = parameters)
                if layer_metadata is None:
                    #### Unable to access metadata for the input layer. ####
                    parameters[idResult].setIDMessage("ERROR",110590, parameters[0].valueAsText)
                else:
                    root = XMLFromString(layer_metadata.xml)
                    process_elements = root.findall(".//Process[@ToolSource]")

                    # Extracted elements as string
                    extracted_elements = [XMLToString(elem, encoding='unicode') for elem in process_elements]
                    tool_name, datetime_str, latest_FC, analysis_vars, cmd = extract_tool_info(extracted_elements)
                    infoMeta = (tool_name, datetime_str, latest_FC, analysis_vars, cmd)

            if infoMeta is not None:

                if tool_name == "GeneralizedLinearRegression" and cmd is None :
                     #### gapro.GeneralizedLinearRegression is not supported. ####
                     parameters[idResult].setIDMessage("ERROR", 110584)
                     return

                if tool_name == "GeneralizedLinearRegression" and cmd[3] not in [fr'CONTINUOUS', fr'"{ARCPY.GetIDMessage(220992)}"', fr'"Continuous (Gaussian)"'] :
                    analysis_var_list = cmd[5].split(';')
                elif tool_name in ["OptimizedHotSpotAnalysis", "OptimizedOutlierAnalysis"]:
                    analysis_var_list = cmd[3].split(';')
                else:
                    if tool_name is not None:
                        analysis_var_list = [item for sublist in analysis_vars for item in (sublist if isinstance(sublist, list) else [sublist])]   

                if tool_name == "SpatialAutocorrelation":
                    if parameters[idSimTable].value is None:
                        parameters[idSimTable].setIDMessage("ERROR", 530)

                try:
                    desc = ARCPY.Describe(latest_FC)
                    fields = desc.fields
                    fieldsDictCount = self.getFieldsDictCount(fields, ["Double","Integer", "Single"])
                    fieldAliases = list(fieldsDictCount.keys())
                except:
                    pass

                if not ARCPY.Exists(latest_FC):
                    if latest_FC in [None, '']:
                        if tool_name in ["", None]:
                            #### The analysis result features do not contain a supported analysis result. ####
                            parameters[idResult].setIDMessage("ERROR", 110570)
                        else:
                            #### The Analysis Result Features or Analysis Input Feature is invalid. ####
                            parameters[idResult].setIDMessage("ERROR", 110578)
                    else:
                        parameters[idInput].enabled = True
                        if parameters[idInput].value is None:
                            parameters[idInput].setIDMessage("ERROR", 530)
                        parameters[idResult].setIDMessage("WARNING", 230025, toolNames[tool_name], datetime_str)
                        parameters[idType].setIDMessage("WARNING", 230026, latest_FC)
                else:
                    parameters[idResult].setIDMessage("WARNING", 230025, toolNames[tool_name],datetime_str)
                    parameters[idType].setIDMessage("WARNING", 230026, latest_FC)

                if tool_name in ["OptimizedHotSpotAnalysis", "OptimizedOutlierAnalysis"]:
                    if self.ch(cmd[3]) is None:
                        #### The tool does not support analysis with aggregated data. ####
                        parameters[idResult].setIDMessage("ERROR", 110583)
   
            if parameters[idMOE].hasError():
                if "800" in str(parameters[idMOE].message):
                    parameters[idMOE].clearmessage()

            if parameters[idConf].hasError():
                if "800" in str(parameters[idConf].message):
                    parameters[idConf].clearmessage()

            if parameters[idPct].hasError():
                if "800" in str(parameters[idPct].message):
                    parameters[idPct].clearmessage()

            if parameters[idSimTable].enabled and parameters[idSimTable].value is None:
                parameters[idSimTable].setIDMessage("ERROR", 530)

            match parameters[idType].value:
                case "MOE":
                    values = parameters[idMOE].values
                    names = set()
                    assigned = []
                    atleastOneAssigned = False
                    if values is not None:
                        if len(values) == 1 and parameters[idInput].value is None:
                            pass
                        else:
                            if not self.checkDifferences(parameters[idMOE], analysis_var_list):
                                equalNames = []
                                for id, row in enumerate(values):
                                    fld = self.getValue(row[1])
                                    if  fld not in  [None, '']:
                                        atleastOneAssigned = True
                                        names.add(fld)
                                        assigned.append(fld)
                                        if self.getValue(row[0]).upper() == fld.upper():
                                            equalNames.append(fld)

                                if len(equalNames) > 0:
                                    #### Margin of Error Field cannot be the same as the Analysis Variable. ####
                                    parameters[idMOE].setIDMessage("ERROR", 110568)

                                if len(names) > 0 and   len(names) < len(assigned):
                                    #### There are Margin of Error Fields duplicated. ####
                                    parameters[idMOE].setIDMessage("ERROR", 110585)

                                if not atleastOneAssigned:
                                    #### At least one Margin of Error Field should be filled. ####
                                    parameters[idMOE].setIDMessage("ERROR", 110586)

                case "CONFIDENCE_BOUNDS":
                    values = parameters[idConf].values
                    namesLeft = set()
                    namesRight = set()
                    lstLeft = []
                    lstRight = []
                    atleastOneAssignedCompleted = 0
                    if values is not None:
                        if parameters[idInput].value is None  and len(values) == 1 :
                            pass
                        else:
                            if not self.checkDifferences(parameters[idConf], analysis_var_list):
                                equalNames = []

                                for id, row in enumerate(values):
                                    fldLeft = self.getValue(row[1])
                                    fldRight = self.getValue(row[2])
                                    validLeft =  fldLeft not in [None, '', "#"]
                                    validRight =  fldRight not in [None, '', "#"]

                                    if validLeft:
                                        atleastOneAssignedCompleted += 1
                                        namesLeft.add(fldLeft)
                                        lstLeft.append(fldLeft)
                                    if validRight:
                                        atleastOneAssignedCompleted += 1
                                        namesRight.add(fldRight)
                                        lstRight.append(fldRight)

                                    if fldLeft == fldRight and validLeft:
                                        equalNames.append(fldLeft)

                                namesLeft = list(namesLeft)
                                namesRight = list(namesRight)

                                if len(equalNames) > 0:
                                    #### Lower Bound Field cannot be the same as the Upper Bound Field. ###
                                    parameters[idConf].setIDMessage("ERROR", 110567)
                                if len(namesLeft) > 0 and len(namesLeft) < len(lstLeft):
                                    #### There are Lower Bound Fields duplicated. ####
                                    parameters[idConf].setIDMessage("ERROR", 110579)
                                if len(namesRight) > 0 and len(namesRight) < len(lstRight):
                                    #### There are Upper Bound Fields duplicated. ####
                                    parameters[idConf].setIDMessage("ERROR", 110580)

                                if (atleastOneAssignedCompleted > 0 and  (atleastOneAssignedCompleted % 2) != 0)  or  \
                                (atleastOneAssignedCompleted == 0 and  (atleastOneAssignedCompleted % 2) == 0):
                                    #### At least one Lower and Upper Bound fields should be filled together.####
                                    parameters[idConf].setIDMessage("ERROR",110581)

                case "PERCENTAGE":
                    values = parameters[idPct].values
                    if values is not None:
                        if parameters[idInput].value is None and len(values) == 1 :
                            pass
                        else:
                            if not self.checkDifferences(parameters[idConf], analysis_var_list):
                                checkTotalValues = 0
                                completed = True
                                for id, row in enumerate(values):
                                    checkTotalValues += row[1] + row[2]
                                    if row[1] > 100  or row[2] > 100:
                                        #### The Percentage Below / Above should be lower than 100. ####
                                        parameters[idPct].setIDMessage("ERROR", 110591)
                                        completed = False
                                        break
                                    if row[1] < 0  or row[2] < 0:
                                        #### The Percentage Below / Above should be greater or equal to zero. ###
                                        parameters[idPct].setIDMessage("ERROR", 110592)
                                        completed = False
                                        break
                                if completed and checkTotalValues == 0:
                                    #### At least one field's Percentage Below and Percentage Above values must be set. ####
                                    parameters[idPct].setIDMessage("ERROR",110593)

            if parameters[idSimLimits].value is not None:
                valueLimits = parameters[idSimLimits].values
                valueLimitsSTR = parameters[idSimLimits].valueAsText.split(";")
                for id, row in enumerate(valueLimits):
                    rowSTR = valueLimitsSTR[id].split(" ")
                    lower = row[1]
                    upper = row[2]
                    if rowSTR[1] != '#' and rowSTR[2] != '#':
                        if lower >= upper:
                            ####  The Lower Limit is greater or equal than the Upper Limit. ###
                            parameters[idSimLimits].setIDMessage("ERROR", 110573 )
                            break

        return

    def checkDifferences(self, parameter, variable_list, displayMessage = True):
        values = parameter.values
        differences = False
        try:
            if values is not None:
                if len(variable_list) != len(values):
                    if displayMessage:
                        parameter.setIDMessage("ERROR", 800, ", ".join(variable_list))
                    differences = True
                else:
                    lst = set()
                    olst = set()
                    diff = False
                    for id, row in enumerate(values):
                        if self.getValue(row[0]).upper() != variable_list[id].upper():
                            diff = True
                        lst.add(self.getValue(row[0]).upper())
                        olst.add(variable_list[id].upper())
                    if lst == olst and diff:
                        if displayMessage:
                            #### The order of the Analysis Variables must be %1. ####
                            parameter.setIDMessage("ERROR", 110596, ", ".join(variable_list))
                        differences = True
                    if lst != olst:
                        if displayMessage:
                            parameter.setIDMessage("ERROR", 800, ", ".join(variable_list))
                        differences = True
        except:
            pass

        return differences


    def ch(self, value):
        return None if value == "#" else value

    def execute(self, parameters, messages):
        import SSAttributeUncertainty as AU
        AU.execute(parameters, messages)
        return

    def postExecute(self, parameters):
        import SSAttributeUncertainty as AU
        AU.postExecute(parameters)
        return

class BivariateSpatialAssociation(object):
    def __init__(self):
        self.label ="Bivariate Spatial Association (Lee's L)"
        self.description=""
        self.canRunInBackground = False
        self.helpContext = 9060018
        self.category = "Modeling Spatial Relationships"
        self.baseType = None
        self.outPath = None
        self.allTypes = ['DISTANCE_BAND', 'K_NEAREST_NEIGHBORS',
                         'CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS',
                         'DELAUNAY_TRIANGULATION', 'GET_SPATIAL_WEIGHTS_FROM_FILE']
        self.polyTypes = ['DISTANCE_BAND', 'K_NEAREST_NEIGHBORS',
                          'CONTIGUITY_EDGES_ONLY', 'CONTIGUITY_EDGES_CORNERS',
                          'GET_SPATIAL_WEIGHTS_FROM_FILE']
        self.pointTypes = ['DISTANCE_BAND', 'K_NEAREST_NEIGHBORS',
                           'DELAUNAY_TRIANGULATION', 'GET_SPATIAL_WEIGHTS_FROM_FILE']


    def getParameterInfo(self):
        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point','Polygon']

        param1 = ARCPY.Parameter(displayName="Analysis Field 1",
                            name = "analysis_field1",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param1.filter.list = ['Short','Long','Float','Double', 'BigInteger']
        param1.parameterDependencies = ["in_features"]
        #param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Analysis Field 2",
                            name = "analysis_field2",
                            datatype = "Field",
                            parameterType = "Required",
                            direction = "Input")

        param2.filter.list = ['Short','Long','Float','Double', 'BigInteger']
        param2.parameterDependencies = ["in_features"]

        param3 = ARCPY.Parameter(displayName = "Output Features", 
                                 name="out_features",
                                 datatype='DEFeatureClass',
                                 parameterType="Required",
                                 direction="Output")


        param4 = ARCPY.Parameter(displayName="Neighborhood Type",
                                 name = "neighborhood_type",
                                 datatype = "GPString",
                                 parameterType = "Optional",
                                 direction = "Input")
        param4.filter.type = "ValueList"
        param4.filter.list = ['DISTANCE_BAND',
                              'K_NEAREST_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']

        param5 = ARCPY.Parameter(displayName="Distance Band",
                                 name="distance_band",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = supportDist
        param5.enabled = False

        param6 = ARCPY.Parameter(displayName="Number of Neighbors",
                                 name="num_neighbors",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.type = "Range"
        param6.filter.list = [2, 1000]
        param6.value = 8
        param6.enabled = False

        param7 = ARCPY.Parameter(displayName="Spatial Weights Matrix",
                                 name="weights_matrix_file",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = ['swm']
        param7.enabled = False

        param8 = ARCPY.Parameter(displayName="Local Weighting Scheme",
                                 name="local_weighting_scheme",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.list = ['UNWEIGHTED', 'BISQUARE']
        param8.value = 'UNWEIGHTED'
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="Kernel Bandwidth",
                                 name="kernel_bandwidth",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param9.filter.list = supportDist
        param9.enabled = False

        param10 = ARCPY.Parameter(displayName="Number of Permutations",
                            name = "num_permutations",
                            datatype = "GPLong",
                            parameterType = "Optional",
                            direction = "Input")
        param10.filter.list = [99, 199, 499, 999, 4999, 9999]
        param10.value  = 999
 
        param11 = ARCPY.Parameter(displayName="Lee's L",
                                 name="lee_l",
                                 datatype="GPDouble",
                                 parameterType="Derived",
                                 direction="Output")

        param12 = ARCPY.Parameter(displayName="P-value",
                                 name="p_value",
                                 datatype="GPDouble",
                                 parameterType="Derived",
                                 direction="Output")

        param13 = ARCPY.Parameter(displayName="Pearson Correlation",
                                 name="corr",
                                 datatype="GPDouble",
                                 parameterType="Derived",
                                 direction="Output")

        return [param0, param1, param2, param3, param4, param5, param6, param7, param8, param9, param10,
                param11, param12, param13]

    def isLicensed(self):
        return True

    def setTypesAndDefault(self, shapeType, neighborType, currentValue):
        """ Check Shape Type for Polygon/Point Concepts """
        if shapeType.upper() == "POLYGON":
            neighborType.filter.list = self.polyTypes

            if currentValue in [None, "", "#"] or currentValue not in self.polyTypes:
                neighborType.value = 'CONTIGUITY_EDGES_CORNERS'

        else:  
            neighborType.filter.list = self.pointTypes
            if currentValue in [None, "", "#"] or currentValue not in self.pointTypes:
                neighborType.value = 'DISTANCE_BAND'

    def returnOutputFieldInfo(self, parameters):
        inputFC = parameters[0]
        varNameX = parameters[1]
        varNameY = parameters[2]
        outFC = parameters[3]
        neighborType = parameters[4]
        distanceBand = parameters[5]  
        numNeighs = parameters[6]
        swmFile = parameters[7]
        weightSchema  = parameters[8]
        bandwidth = parameters[9] 
        permutations = parameters[10]

        currentValue = neighborType.valueAsText
        useWeights = currentValue == 'GET_SPATIAL_WEIGHTS_FROM_FILE'

        #### Append Fields ####
        addFieldAlias2Alias = {}
        fieldNames = []

        if varNameX.value:
            upperName = varNameX.valueAsText.upper()
            fieldNames.append(upperName)
            addFieldAlias2Alias["NWA_VAR1"] = upperName

        if varNameY.value:
            upperName = varNameY.valueAsText.upper()
            fieldNames.append(upperName)
            addFieldAlias2Alias["NWA_VAR2"] = upperName

        #### Output Fields ####
        outputFieldLengths = [50, 15]
        outputFieldNames = ["LOCAL_L", "NWA_VAR1", "NWA_VAR2", "P_VALUE", "SIG_LEVEL", "ASSOC_CAT", "NUM_NBRS"]
        outputFieldTypes = ["DOUBLE", "DOUBLE", "DOUBLE", "DOUBLE", "TEXT", "TEXT", "LONG"]
        aliasIDs = [220865, 220864, 220864, 220866, 220867, 220868, 84362]
        outputFieldAliases = [ARCPY.GetIDMessage(i) for i in aliasIDs]

        uiSSDO = None
        if useWeights:
            if swmFile.value is not None:
                uiSSDO = UI_SSDataObject(inputFC, outFC, 
                                         fieldNames = fieldNames,
                                         weightsParameter = swmFile,
                                         outputFieldNames = outputFieldNames,
                                         outputFieldTypes = outputFieldTypes,
                                         outputFieldAliases = outputFieldAliases,
                                         outputFieldLengths = outputFieldLengths,
                                         addFieldAlias2Alias = addFieldAlias2Alias)
        else:
            uiSSDO = UI_SSDataObject(inputFC, outFC, 
                                     fieldNames = fieldNames,
                                         outputFieldNames = outputFieldNames,
                                         outputFieldTypes = outputFieldTypes,
                                         outputFieldAliases = outputFieldAliases,
                                         outputFieldLengths = outputFieldLengths,
                                         addFieldAlias2Alias = addFieldAlias2Alias)

        return uiSSDO

    
    def updateParameters(self, parameters):
        inputFC = parameters[0]
        varNameX = parameters[1]
        varNameY = parameters[2]
        outFC = parameters[3]
        neighborType = parameters[4]
        distanceBand = parameters[5]  
        numNeighs = parameters[6]
        swmFile = parameters[7]
        weightSchema  = parameters[8]
        bandwidth = parameters[9] 
        permutations = parameters[10]

        #### Create UI SSDO Field Checker/Adder ####
        uiSSDO = None
        currentValue = neighborType.valueAsText
        doDescribe = True

        if inputFC.value and outFC.value:

            uiSSDO = self.returnOutputFieldInfo(parameters)
            
            if uiSSDO is not None:
                if uiSSDO.ssdo is not None:
                    doDescribe = False

                    #### Check Shape Type for Polygon/Point Concepts ####
                    self.setTypesAndDefault(uiSSDO.ssdo.shapeType, neighborType, currentValue)

        if doDescribe:
            try:
                #### Check Shape Type for Polygon/Point Concepts ####
                desc = ARCPY.Describe(inputFC)
                self.setTypesAndDefault(desc.ShapeType, neighborType, currentValue)
            except:
                neighborType.filter.list = self.allTypes

        distanceBand.enabled = False  
        numNeighs.enabled = False
        swmFile.enabled = False
        weightSchema.enabled = False
        bandwidth.enabled = False  

        if neighborType.value == 'DISTANCE_BAND':
            distanceBand.enabled = True

        if neighborType.value == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
            swmFile.enabled = True

        if neighborType.value == 'K_NEAREST_NEIGHBORS':
            numNeighs.enabled = True

        if neighborType.value in ['DISTANCE_BAND', 'K_NEAREST_NEIGHBORS']:
            weightSchema.enabled = True
        else:
            clearParameter(weightSchema)

        if weightSchema.enabled and not weightSchema.value:
            weightSchema.value = "UNWEIGHTED"

        if weightSchema.enabled and weightSchema.valueAsText == 'BISQUARE':
            bandwidth.enabled = True

        #### Reset Defaults for non-enabled parameters ####
        if not neighborType.enabled:
            neighborType.value = "DISTANCE_BAND"
        if not distanceBand.enabled: 
            distanceBand.value = None
        if not numNeighs.enabled:
            numNeighs.value = None
        else:
            if numNeighs.value in ["", "#", None]:
                numNeighs.value = 8
        if not swmFile.enabled:
            swmFile.value = None
        if not weightSchema.enabled:
            weightSchema.value = "UNWEIGHTED"
        if not bandwidth.enabled:
            bandwidth.value = None

        if permutations.value in ["", "#", None]:
            permutations.value = 999
        
    def updateMessages(self, parameters):
        inputFC = parameters[0]
        varNameX = parameters[1]
        varNameY = parameters[2]
        outFC = parameters[3]
        neighborType = parameters[4]
        distanceBand = parameters[5]  
        numNeighs = parameters[6]
        swmFile = parameters[7]
        weightSchema  = parameters[8]
        bandwidth = parameters[9] 
        permutations = parameters[10]

        if inputFC.value and outFC.value:
            uiSSDO = self.returnOutputFieldInfo(parameters)

        if varNameX.value and varNameY.value and inputFC.value:
            if varNameX.valueAsText == varNameY.valueAsText:
                if not varNameX.hasError():
                    varNameX.setIDMessage("ERROR", 110182, varNameX.valueAsText)

        if neighborType.value == "GET_SPATIAL_WEIGHTS_FROM_FILE" and not swmFile.value:
            swmFile.setIDMessage("ERROR", 735, ARCPY.GetIDMessage(220838))

        if distanceBand.enabled and distanceBand.valueAsText:
            spatialConceptParamValue, spatialConceptParamUnit = distanceBand.valueAsText.split(" ")
            if LOCALE.atof(spatialConceptParamValue) <= 0:
                distanceBand.setIDMessage("ERROR", 531)

        if bandwidth.enabled and bandwidth.valueAsText:
            kValue, kUnit = bandwidth.valueAsText.split(" ")
            if LOCALE.atof(kValue) <= 0:
                bandwidth.setIDMessage("ERROR", 531)

    def execute(self, parameters, messages):
        import SSBivariateAssociation as BSA
        BSA.executeBSA(parameters, messages)

    #def postExecute(self, parameters):
    #    import SSRates as rates


class CalculateSpatialExplanatoryVariables(object):
    def __init__(self):
        self.label = "Calculate Spatial Explanatory Variables"
        self.description = "Calculates the values of one ore more fields which can be used as explanatory variables in other tools. Fields values can summarize the spatial patterns and scales of the map using Moran’s Eigenvector Maps, or summarize one or more numeric or categorical fields using local neighborhoods around each feature. For numeric fields the local statistics include sum, min, mean (average), median, and maximum. For categorical fields the local statistics include raw count for each category, percentage for each category, majority, majority percentage, minority, minority percentage, and variety. Many statistics can be geographically weighted using kernels to give more influence to neighbors closer to the focal feature. Various neighborhood types can be used, including distance band, number of neighbors, polygon contiguity, Delaunay triangulation, and spatial weights matrix files (.swm). Summary statistics are also calculated for the distances to the neighbors of each feature."
        self.canRunInBackground = False
        self.category = "Utilities"
        # self.helpContext =

    def getParameterInfo(self):

        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Append Fields to Input Features",
                                 name="append_to_input",
                                 datatype="GPBoolean",
                                 parameterType="Required",
                                 direction="Input")
        param1.filter.list = ['APPEND_TO_INPUT', 'NEW_OUTPUT']
        param1.value = False
        param1.displayOrder = 1

        param2 = ARCPY.Parameter(displayName="Numeric Analysis Fields",
                                 name="numerical_fields",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param2.parameterDependencies = [param0.name]
        param2.columns = [['Field', 'Field'], ['GPString', 'Statistic']]
        param2.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param2.filters[1].type = "ValueList"
        param2.filters[1].list = ["SUM", "MIN", "MEAN", "MEDIAN", "MAX", "STD_DEV"]
        param2.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param2.displayOrder = 2

        param3 = ARCPY.Parameter(displayName="Categorical Analysis Fields",
                                 name="categorical_fields",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param3.parameterDependencies = [param0.name]
        param3.columns = [['Field', 'Variable'], ['GPString', 'Statistic'], ['GPString', 'Summarization Method']]
        param3.filters[0].list = ["Short", "Long", "BigInteger", "Text"]
        param3.filters[1].type = "ValueList"
        param3.filters[1].list = ["COUNT", "PERCENT", "MAJORITY", "MAJORITY_PERCENT", "MINORITY", "MINORITY_PERCENT", "VARIETY"]
        param3.filters[2].type = "ValueList"
        param3.filters[2].list = ["None", "WEIGHTED_MEAN", "WEIGHTED_SUM"]
        param3.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param3.displayOrder = 3

        param4 = ARCPY.Parameter(displayName="Output Features",
                                 name="output_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Optional",
                                 direction="Output")
        param4.displayOrder = 4

        param5 = ARCPY.Parameter(displayName="Include Focal Feature in Calculations",
                                 name="include_focal_feature",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = ['INCLUDE_FOCAL', 'EXCLUDE_FOCAL']
        param5.value = True
        param5.displayOrder = 5

        param6 = ARCPY.Parameter(displayName="Ignore Null Values in Calculations",
                                 name="ignore_nulls",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param6.filter.list = ['IGNORE_NULLS', 'INCLUDE_NULLS']
        param6.value = True
        param6.displayOrder = 6

        param7 = ARCPY.Parameter(displayName="Neighborhood Type",
                                 name="neighborhood_type",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.list = ['DISTANCE_BAND',
                              'NUMBER_OF_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']
        param7.displayOrder = 7

        param8 = ARCPY.Parameter(displayName="Distance Band",
                                 name="distance_band",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.list = supportDist
        param8.enabled = False
        param8.displayOrder = 8

        param9 = ARCPY.Parameter(displayName="Number of Neighbors",
                                 name="number_of_neighbors",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param9.filter.type = "Range"
        param9.filter.list = [2, 1000]
        param9.enabled = False
        param9.value = 8
        param9.displayOrder = 9

        param10 = ARCPY.Parameter(displayName="Weights Matrix File",
                                 name="weights_matrix_file",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param10.filter.list = ['swm', 'gwt', 'txt']
        param10.enabled = False
        param10.displayOrder = 10

        param11 = ARCPY.Parameter(displayName="Local Weighting Scheme",
                                  name="local_weighting_scheme",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param11.filter.list = ['UNWEIGHTED',
                               'BISQUARE',
                               'GAUSSIAN']
        param11.value = 'UNWEIGHTED'
        param11.enabled = False
        param11.displayOrder = 11

        param12 = ARCPY.Parameter(displayName="Bandwidth Unit",
                                 name="bandwidth_unit",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param12.filter.list = upperSupportDist
        param12.enabled = False
        param12.displayOrder = 12

        param13 = ARCPY.Parameter(displayName="Kernel Inner Bandwidth",
                                  name="kernel_inner_bandwidth",
                                  datatype="GPDouble",
                                  parameterType="Optional",
                                  direction="Input")
        param13.enabled = False
        param13.displayOrder = 13

        param14 = ARCPY.Parameter(displayName="Kernel Outer Bandwidth",
                                  name="kernel_outer_bandwidth",
                                  datatype="GPDouble",
                                  parameterType="Optional",
                                  direction="Input")
        param14.enabled = False
        param14.displayOrder = 14

        param15 = ARCPY.Parameter(displayName="Secondary Input Features",
                                  name="secondary_in_features",
                                  datatype="GPFeatureLayer",
                                  parameterType="Optional",
                                  direction="Input")
        param15.filter.list = ['Point', 'Polygon']
        param15.displayOrder = 15
        param15.category = "Secondary Features Summarization"

        param16 = ARCPY.Parameter(displayName="Secondary Numeric Analysis Fields",
                                 name="secondary_numerical_fields",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param16.parameterDependencies = [param15.name]
        param16.columns = [['Field', 'Field'], ['GPString', 'Statistic']]
        param16.filters[0].list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param16.filters[1].type = "ValueList"
        param16.filters[1].list = ["SUM", "MIN", "MEAN", "MEDIAN", "MAX", "STD_DEV"]
        param16.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param16.displayOrder = 16
        param16.category = "Secondary Features Summarization"

        param17 = ARCPY.Parameter(displayName="Secondary Categorical Analysis Fields",
                                 name="secondary_categorical_fields",
                                 datatype="GPValueTable",
                                 parameterType="Optional",
                                 direction="Input")
        param17.parameterDependencies = [param15.name]
        param17.columns = [['Field', 'Variable'], ['GPString', 'Statistic'], ['GPString', 'Summarization Method']]
        param17.filters[0].list = ["Short", "Long", "BigInteger", "Text"]
        param17.filters[1].type = "ValueList"
        param17.filters[1].list = ["COUNT", "PERCENT", "MAJORITY", "MAJORITY_PERCENT", "MINORITY", "MINORITY_PERCENT",
                                  "VARIETY"]
        param17.filters[2].type = "ValueList"
        param17.filters[2].list = ["None", "WEIGHTED_MEAN", "WEIGHTED_SUM"]
        param17.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param17.displayOrder = 17
        param17.category = "Secondary Features Summarization"

        param18 = ARCPY.Parameter(displayName="Distance Features",
                                  name="distance_features",
                                  datatype="GPFeatureLayer",
                                  parameterType="Optional",
                                  direction="Input",
                                  multiValue=True)
        param18.filter.list = ['Point', 'Polygon']
        param18.displayOrder = 18
        param18.category = "Distance Features Summarization"

        param19 = ARCPY.Parameter(displayName="Numeric Raster",
                                  name="numeric_raster",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param19.columns = [['GPRasterLayer', 'Raster Layer'], ['GPString', 'Statistic']]
        param19.filters[1].type = "ValueList"
        param19.filters[1].list = ["SUM", "MIN", "MEAN", "MEDIAN", "MAX", "STD_DEV"]
        param19.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param19.displayOrder = 19
        param19.category = "Raster Summarization"

        param20 = ARCPY.Parameter(displayName="Categorical Raster",
                                  name="categorical_raster",
                                  datatype="GPValueTable",
                                  parameterType="Optional",
                                  direction="Input")
        param20.columns = [['GPRasterLayer', 'Raster Layer'], ['GPString', 'Statistic'],
                           ['GPString', 'Summarization Method']]
        # param20.filters[0].list = ["Short", "Long", "BigInteger", "Text"]
        param20.filters[1].type = "ValueList"
        param20.filters[1].list = ["COUNT", "PERCENT", "MAJORITY", "MAJORITY_PERCENT", "MINORITY", "MINORITY_PERCENT",
                                   "VARIETY"]
        param20.filters[2].type = "ValueList"
        param20.filters[2].list = ["None", "WEIGHTED_MEAN", "WEIGHTED_SUM"]
        param20.controlCLSID = "{1AA9A769-D3F3-4EB0-85CB-CC07C79313C8}"
        param20.displayOrder = 20
        param20.category = "Raster Summarization"

        param21 = ARCPY.Parameter(displayName="Calculate Spatial Components",
                                  name="calc_spatial_components",
                                  datatype="GPBoolean",
                                  parameterType="Optional",
                                  direction="Input")
        param21.filter.list = ['CAL_SPATIAL_COMP', 'NO_CAL_SPATIAL_COMP']
        param21.value = True
        param21.displayOrder = 21
        param21.category = "Spatial Pattern Summarization"

        param22 = ARCPY.Parameter(displayName="Dependent Variable for Selecting Spatial Components",
                                  name="dependent_spatial_variable",
                                  datatype="Field",
                                  parameterType="Optional",
                                  direction="Input",
                                  multiValue=True)
        param22.filter.list = ["Double", "Float", "Short", "Long", "BigInteger"]
        param22.parameterDependencies = [param0.name]
        param22.displayOrder = 22
        param22.enabled = True
        param22.category = "Spatial Pattern Summarization"

        param23 = ARCPY.Parameter(displayName="Maximum Number of Spatial Components",
                                  name="max_components",
                                  datatype="GPLong",
                                  parameterType="Optional",
                                  direction="Input")
        param23.filter.type = "Range"
        param23.filter.list = [1, 10000]
        param23.value = 10
        param23.enabled = True
        param23.displayOrder = 23
        param23.category = "Spatial Pattern Summarization"


        return [param0, param1, param2, param3, param4,
                param5, param6, param7, param8, param9,
                param10, param11, param12, param13, param14,
                param15, param16, param17, param18, param19,
                param20, param21, param22, param23]

    def updateParameters(self, parameters):
        import locale as LOCALE

        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_append = ARCPY.GetParameterInfo()["append_to_input"]
        param_fields_num = ARCPY.GetParameterInfo()["numerical_fields"]
        param_fields_cat = ARCPY.GetParameterInfo()["categorical_fields"]
        param_outFC = ARCPY.GetParameterInfo()["output_features"]
        param_focal = ARCPY.GetParameterInfo()["include_focal_feature"]
        param_concept_of_spatial_relation = ARCPY.GetParameterInfo()["neighborhood_type"]
        param_distBand = ARCPY.GetParameterInfo()["distance_band"]
        param_KNN = ARCPY.GetParameterInfo()["number_of_neighbors"]
        param_weightsFile = ARCPY.GetParameterInfo()["weights_matrix_file"]
        param_weightSchema = ARCPY.GetParameterInfo()["local_weighting_scheme"]
        param_kernelBandUnit = ARCPY.GetParameterInfo()["bandwidth_unit"]
        param_kernelBandInner = ARCPY.GetParameterInfo()["kernel_inner_bandwidth"]
        param_kernelBandOuter = ARCPY.GetParameterInfo()["kernel_outer_bandwidth"]
        param_second_fields_num = ARCPY.GetParameterInfo()["secondary_numerical_fields"]
        param_second_fields_cat = ARCPY.GetParameterInfo()["secondary_categorical_fields"]
        param_raster_num = ARCPY.GetParameterInfo()["numeric_raster"]
        param_raster_cat = ARCPY.GetParameterInfo()["categorical_raster"]
        param_spatial_comp = ARCPY.GetParameterInfo()["calc_spatial_components"]
        param_spatial_comp_field = ARCPY.GetParameterInfo()["dependent_spatial_variable"]
        param_spatial_comp_num = ARCPY.GetParameterInfo()["max_components"]

        if paramChanged(param_inFC):
            inputFC = param_inFC.valueAsText
            if inputFC:
                try:
                    desc = ARCPY.Describe(inputFC)
                    shapeType = desc.ShapeType.upper()
                    currentValue = param_concept_of_spatial_relation.valueAsText
                    if shapeType == "POLYGON":
                        param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                                                                         'NUMBER_OF_NEIGHBORS',
                                                                         'CONTIGUITY_EDGES_ONLY',
                                                                         'CONTIGUITY_EDGES_CORNERS',
                                                                         'GET_SPATIAL_WEIGHTS_FROM_FILE']

                        if currentValue in [None, "", "#"] or currentValue not in param_concept_of_spatial_relation.filter.list:
                            param_concept_of_spatial_relation.value = 'CONTIGUITY_EDGES_CORNERS'

                    else:  # shapeType in ["POINT", "MULTIPOINT"]:
                        param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                                                                         'NUMBER_OF_NEIGHBORS',
                                                                         'DELAUNAY_TRIANGULATION',
                                                                         'GET_SPATIAL_WEIGHTS_FROM_FILE']
                        if currentValue in [None, "", "#"] or currentValue not in param_concept_of_spatial_relation.filter.list:
                            param_concept_of_spatial_relation.value = 'DELAUNAY_TRIANGULATION'
                except:
                    pass
            else:
                param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                              'NUMBER_OF_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']

        concept_of_spatial_relation = param_concept_of_spatial_relation.value

        if param_append.value is True:
            clearParameter(param_outFC)
        else:
            param_outFC.enabled = True
            if param_outFC.value is None and ARCPY.env.workspace is not None:
                #### Automatically populate the field names ####
                param_outFC.value = param_inFC.value
                if len(ARCPY.env.workspace) > 0 and param_inFC.value is not None:
                    extraChrt = ""
                    try:
                        int(OS.path.basename(param_inFC.valueAsText).split(".")[0])
                        extraChrt = "t"
                    except:
                        pass

                    try:
                        outputCandidate = OS.path.join(
                            ARCPY.env.workspace,
                            extraChrt + OS.path.basename(param_inFC.valueAsText).split(".")[0] + "_CalculateSpatialExplanatoryVariables")
                        param_outFC.value = outputCandidate
                    except:
                        pass

        if param_spatial_comp.value:
            param_spatial_comp_field.enabled = True
            param_spatial_comp_num.enabled = True
        else:
            param_spatial_comp_field.enabled = False
            param_spatial_comp_num.enabled = False
        if param_spatial_comp_num.enabled and param_spatial_comp_num.value is None:
            param_spatial_comp_num.value = 10

        if concept_of_spatial_relation == 'DISTANCE_BAND':
            param_distBand.enabled = True
        else:
            clearParameter(param_distBand)

        if concept_of_spatial_relation == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
            param_focal.enabled = False
            param_weightsFile.enabled = True
        else:
            param_focal.enabled = True
            param_weightsFile.enabled = False

        if concept_of_spatial_relation == 'NUMBER_OF_NEIGHBORS':
            param_KNN.enabled = True
        else:
            clearParameter(param_KNN)

        if concept_of_spatial_relation in ['DISTANCE_BAND', 'NUMBER_OF_NEIGHBORS']:
            param_weightSchema.enabled = True
        else:
            clearParameter(param_weightSchema)

        if param_weightSchema.enabled and not param_weightSchema.value:
            param_weightSchema.value = "UNWEIGHTED"

        if param_weightSchema.enabled and param_weightSchema.valueAsText in ['BISQUARE', 'GAUSSIAN']:
            param_kernelBandUnit.enabled = True
            param_kernelBandInner.enabled = True
            param_kernelBandOuter.enabled = True
        else:
            clearParameter(param_kernelBandUnit)
            clearParameter(param_kernelBandInner)
            clearParameter(param_kernelBandOuter)

        if param_kernelBandInner.enabled and not param_kernelBandInner.value:
            param_kernelBandInner.value = 0

        #### Auto Fill Bandwidth w/ Distance Band if Distance Band Changes ####
        if param_distBand.enabled and param_kernelBandOuter.enabled:
            distVal = param_distBand.value
            if param_kernelBandUnit.value is None and param_kernelBandOuter.value is None and distVal is not None:
                try:
                    dist, unit = distVal.split(" ")
                    if unit.upper() in upperSupportDist:
                        param_kernelBandOuter.value = LOCALE.atof(dist)
                        param_kernelBandUnit.value = unit
                except:
                    pass

        #### Auto Fill Neighborhood Type ####
        if param_concept_of_spatial_relation.value is None:
            inputFC = param_inFC.valueAsText
            if inputFC:
                try:
                    desc = ARCPY.Describe(inputFC)
                    shapeType = desc.ShapeType.upper()
                    if shapeType == "POLYGON":
                        param_concept_of_spatial_relation.value = 'CONTIGUITY_EDGES_CORNERS'
                    else:
                        param_concept_of_spatial_relation.value = 'DELAUNAY_TRIANGULATION'
                except:
                    pass

        #### Auto Fill Number of Neighbors ####
        if param_KNN.enabled:
            if UTILS.getNumericParameter(8, parameters) is None:
                param_KNN.value = 8

        #### Build the field schema for output Feature Class ####
        if param_inFC.value is not None and not param_outFC.hasError() and param_outFC.value is not None:
            try:
                varNames = UTILS.getTextParameter(2, parameters)
                if varNames is None:
                    varNames = []
                # schemas = NSS.NeighborhoodSummaryStatistics.buildOutputFieldsSchema(
                #             param_inFC.valueAsText, varNames, param_outFC.valueAsText,
                #             statisticMethod=param_staMethod.valueAsText, calDistance=True)
                # param_outFC.schema.additionalFields = schemas
            except:
                param_outFC.schema.additionalFields = []
        return

    def updateMessages(self, parameters):
        import locale as LOCALE

        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_append = ARCPY.GetParameterInfo()["append_to_input"]
        param_fields_num = ARCPY.GetParameterInfo()["numerical_fields"]
        param_fields_cat = ARCPY.GetParameterInfo()["categorical_fields"]
        param_outFC = ARCPY.GetParameterInfo()["output_features"]
        param_focal = ARCPY.GetParameterInfo()["include_focal_feature"]
        param_concept_of_spatial_relation = ARCPY.GetParameterInfo()["neighborhood_type"]
        param_distBand = ARCPY.GetParameterInfo()["distance_band"]
        param_KNN = ARCPY.GetParameterInfo()["number_of_neighbors"]
        param_weightsFile = ARCPY.GetParameterInfo()["weights_matrix_file"]
        param_weightSchema = ARCPY.GetParameterInfo()["local_weighting_scheme"]
        param_kernelBandUnit = ARCPY.GetParameterInfo()["bandwidth_unit"]
        param_kernelBandInner = ARCPY.GetParameterInfo()["kernel_inner_bandwidth"]
        param_kernelBandOuter = ARCPY.GetParameterInfo()["kernel_outer_bandwidth"]
        param_second_fields_num = ARCPY.GetParameterInfo()["secondary_numerical_fields"]
        param_second_fields_cat = ARCPY.GetParameterInfo()["secondary_categorical_fields"]
        param_raster_num = ARCPY.GetParameterInfo()["numeric_raster"]
        param_raster_cat = ARCPY.GetParameterInfo()["categorical_raster"]
        param_spatial_comp = ARCPY.GetParameterInfo()["calc_spatial_components"]
        param_spatial_comp_field = ARCPY.GetParameterInfo()["dependent_spatial_variable"]
        param_spatial_comp_num = ARCPY.GetParameterInfo()["max_components"]

        #### Check positive values ####
        for param_positive in [param_spatial_comp_num, param_kernelBandInner, param_kernelBandOuter]:
            if param_positive.enabled and param_positive.value is not None:
                if param_positive.value < 0:
                    param_positive.setIDMessage("ERROR", 531)

        if param_distBand.enabled and param_distBand.value:
            positiveParamValue, positiveParamUnit = param_distBand.valueAsText.split(" ")
            if LOCALE.atof(positiveParamValue) <= 0:
                param_distBand.setIDMessage("ERROR", 531)

        if param_weightsFile.enabled and param_weightsFile.value in ["", "#", None]:
            param_weightsFile.setIDMessage("ERROR", 930)

        if param_kernelBandInner.enabled and param_kernelBandInner.value is not None and param_kernelBandOuter.value is not None:
            if param_kernelBandInner.value >= param_kernelBandOuter.value:
                param_kernelBandInner.setErrorMessage("Inner Bandwidth must be less than Outer Bandwidth")

        #### Check conditioanl required parameters ####
        for param_required in [param_outFC, param_spatial_comp_num, param_KNN, param_weightSchema, param_kernelBandUnit]:
            if param_required.enabled and param_required.value in ["", "#", None]:
                param_required.setIDMessage("ERROR", 530)

        #### Check categorical fields ####
        for param_cat in [param_fields_cat, param_second_fields_cat, param_raster_cat]:
            if param_cat.value is not None:
                for row in param_cat.value:
                    field = row[0]
                    stat = row[1]
                    summarization_method = row[2]
                    if stat is not None and summarization_method is not None:
                        if stat.upper() != "PERCENT" and summarization_method != "None":
                            param_cat.setErrorMessage(
                                "WEIGHTED_MEAN and WEIGHTED_SUM is only allowd for Percentage for each category.")

        return

    def execute(self, parameters, messages):
        import SSCalSpatialExpVar as CSEV
        CSEV.execute(parameters, messages)

    def postExecute(self, parameters):
        import SSCalSpatialExpVar as CSEV
        CSEV.postExecute(parameters)


class DecomposeSpatialStructure:
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Decompose Spatial Structure (Moran Eigenvectors)"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Spatial Component Utilities (Moran Eigenvectors)"
        self.helpContext = 9040009

    def isAdvance(self):
        from SSDecomposeSpatialStructure import isLicensed
        return isLicensed()

    def getParameterInfo(self):
        """Define the tool parameters."""
        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']

        param1 = ARCPY.Parameter(displayName="Output Features",
                                 name="out_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")

        param2 = ARCPY.Parameter(displayName="Append All Fields From Input Features",
                                 name="append_all_fields",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param2.value = True
        param2.filter.list = ['ALL', 'NO_FIELDS']
        param2.enabled = True

        param3 = ARCPY.Parameter(displayName="Relative Moran's I Threshold",
                                 name="min_autocorrelation",
                                 datatype="GPDouble",
                                 parameterType="Optional",
                                 multiValue=False,
                                 direction="Input")
        param3.value = 0.25
        param3.filter.type = "Range"
        param3.filter.list = [0, 1]
        param3.enabled = True

        param4 = ARCPY.Parameter(displayName="Maximum Number of Spatial Components",
                                 name="max_components",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 multiValue=False,
                                 direction="Input")
        param4.filter.type = "Range"
        param4.filter.list = [1, 10000]
        param4.value = 15
        param4.enabled = True

        param5 = ARCPY.Parameter(displayName="Neighborhood Type",
                                 name="neighborhood_type",
                                 datatype="GPString",
                                 parameterType="Optional",
                                 direction="Input")
        param5.filter.list = ['DISTANCE_BAND',
                              'NUMBER_OF_NEIGHBORS',
                              'CONTIGUITY_EDGES_ONLY',
                              'CONTIGUITY_EDGES_CORNERS',
                              'DELAUNAY_TRIANGULATION',
                              'GET_SPATIAL_WEIGHTS_FROM_FILE']
        param5.enabled = True

        param6 = ARCPY.Parameter(displayName="Distance Band",
                                 name="distance_band",
                                 datatype="GPLinearUnit",
                                 parameterType="Optional",
                                 direction="Input")
        param6.enabled = False
        param6.filter.list = supportDist

        param7 = ARCPY.Parameter(displayName="Number of Neighbors",
                                 name="number_of_neighbors",
                                 datatype="GPLong",
                                 parameterType="Optional",
                                 direction="Input")
        param7.filter.type = "Range"
        param7.filter.list = [2, 1000]
        param7.enabled = False
        param7.value = 8

        param8 = ARCPY.Parameter(displayName="Weights Matrix File",
                                 name="weights_matrix_file",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param8.filter.list = ['swm', 'gwt', 'txt']
        param8.enabled = False

        param9 = ARCPY.Parameter(displayName="Local Weighting Scheme",
                                  name="local_weighting_scheme",
                                  datatype="GPString",
                                  parameterType="Optional",
                                  direction="Input")
        param9.filter.list = ['UNWEIGHTED',
                               'BISQUARE',
                               'GAUSSIAN']
        param9.value = 'UNWEIGHTED'
        param9.enabled = False

        param10 = ARCPY.Parameter(displayName="Kernel Bandwidth",
                                  name="kernel_bandwidth",
                                  datatype="GPLinearUnit",
                                  parameterType="Optional",
                                  direction="Input")
        param10.enabled = False
        param10.filter.list = supportDist

        param11 = ARCPY.Parameter(displayName="Output Spatial Weights Matrix File",
                                 name="out_swm",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Output")
        param11.filter.list = ['swm']
        param11.category = "Spatial Weights Matrix Options"
        param11.enabled = True

        param12 = ARCPY.Parameter(displayName="Unique ID Field",
                                 name="id_field",
                                 datatype="Field",
                                 parameterType="Optional",
                                 direction="Input",
                                 multiValue=False)
        param12.parameterDependencies = ["in_features"]
        param12.filter.list = ['Short', 'Long', 'BigInteger']
        param12.category = "Spatial Weights Matrix Options"
        param12.enabled = True

        return [param0, param1, param2, param3, param4,
                param5, param6, param7, param8, param9, param10,
                param11, param12]

    def isLicensed(self):
        """Set whether the tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_outFC = ARCPY.GetParameterInfo()["out_features"]
        param_append_all = ARCPY.GetParameterInfo()["append_all_fields"]

        param_morans_threshold = ARCPY.GetParameterInfo()["min_autocorrelation"]
        param_spatial_comp_num = ARCPY.GetParameterInfo()["max_components"]

        param_concept_of_spatial_relation = ARCPY.GetParameterInfo()["neighborhood_type"]
        param_distBand = ARCPY.GetParameterInfo()["distance_band"]
        param_KNN = ARCPY.GetParameterInfo()["number_of_neighbors"]
        param_weightsFile = ARCPY.GetParameterInfo()["weights_matrix_file"]
        param_weightSchema = ARCPY.GetParameterInfo()["local_weighting_scheme"]
        param_kernelBand = ARCPY.GetParameterInfo()["kernel_bandwidth"]
        param_out_swm = ARCPY.GetParameterInfo()["out_swm"]
        param_out_swm_field = ARCPY.GetParameterInfo()["id_field"]

        if paramChanged(param_inFC):
            inputFC = param_inFC.valueAsText
            if inputFC:
                try:
                    desc = ARCPY.Describe(inputFC)
                    shapeType = desc.ShapeType.upper()
                    currentValue = param_concept_of_spatial_relation.valueAsText
                    if shapeType == "POLYGON":
                        param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                                                                         'NUMBER_OF_NEIGHBORS',
                                                                         'CONTIGUITY_EDGES_ONLY',
                                                                         'CONTIGUITY_EDGES_CORNERS',
                                                                         'GET_SPATIAL_WEIGHTS_FROM_FILE']

                        if currentValue in [None, "",
                                            "#"] or currentValue not in param_concept_of_spatial_relation.filter.list:
                            param_concept_of_spatial_relation.value = 'CONTIGUITY_EDGES_CORNERS'

                    else:  # shapeType in ["POINT", "MULTIPOINT"]:
                        param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                                                                         'NUMBER_OF_NEIGHBORS',
                                                                         'DELAUNAY_TRIANGULATION',
                                                                         'GET_SPATIAL_WEIGHTS_FROM_FILE']
                        if currentValue in [None, "",
                                            "#"] or currentValue not in param_concept_of_spatial_relation.filter.list:
                            param_concept_of_spatial_relation.value = 'DISTANCE_BAND'
                except:
                    pass
            else:
                param_concept_of_spatial_relation.filter.list = ['DISTANCE_BAND',
                                                                 'NUMBER_OF_NEIGHBORS',
                                                                 'CONTIGUITY_EDGES_ONLY',
                                                                 'CONTIGUITY_EDGES_CORNERS',
                                                                 'DELAUNAY_TRIANGULATION',
                                                                 'GET_SPATIAL_WEIGHTS_FROM_FILE']

        if param_concept_of_spatial_relation.enabled:
            concept_of_spatial_relation = param_concept_of_spatial_relation.value
            if concept_of_spatial_relation == 'DISTANCE_BAND':
                param_distBand.enabled = True
            else:
                clearParameter(param_distBand)

            if concept_of_spatial_relation == 'GET_SPATIAL_WEIGHTS_FROM_FILE':
                param_weightsFile.enabled = True
                clearParameter(param_out_swm)
                clearParameter(param_out_swm_field)
            else:
                clearParameter(param_weightsFile)
                param_out_swm.enabled = True
                param_out_swm_field.enabled = True

            if concept_of_spatial_relation == 'NUMBER_OF_NEIGHBORS':
                param_KNN.enabled = True
            else:
                clearParameter(param_KNN)

            if concept_of_spatial_relation in ['DISTANCE_BAND', 'NUMBER_OF_NEIGHBORS']:
                param_weightSchema.enabled = True
            else:
                clearParameter(param_weightSchema)

            if param_weightSchema.enabled and not param_weightSchema.value:
                param_weightSchema.value = "UNWEIGHTED"

            if param_weightSchema.enabled and param_weightSchema.valueAsText in ['BISQUARE', 'GAUSSIAN']:
                param_kernelBand.enabled = True
            else:
                clearParameter(param_kernelBand)
        else:
            clearParameter(param_distBand)
            clearParameter(param_KNN)
            clearParameter(param_weightsFile)
            clearParameter(param_weightSchema)
            clearParameter(param_kernelBand)

        #### Auto Fill Bandwidth w/ Distance Band if Distance Band Changes ####
        if param_distBand.enabled and param_kernelBand.enabled:
            distVal = param_distBand.value
            if param_kernelBand.value is None and distVal is not None:
                try:
                    dist, unit = distVal.split(" ")
                    if unit.upper() in upperSupportDist:
                        param_kernelBand.value = param_distBand.value
                except:
                    pass

        #### Auto Fill Morans's I threshold ####
        if param_morans_threshold.enabled and param_morans_threshold.value is None:
            param_morans_threshold.value = 0.25

        #### Auto Fill Number of Neighbors ####
        if param_KNN.enabled:
            if UTILS.getNumericParameter("number_of_neighbors", parameters) is None:
                param_KNN.value = 8

        if param_spatial_comp_num.value is None:
            param_spatial_comp_num.value = 15

        #### Build the field schema for output Feature Class ####
        if param_inFC.value is not None and not param_outFC.hasError() and param_outFC.value is not None:
            try:
                varNames = UTILS.getTextParameter(2, parameters)
                if varNames is None:
                    varNames = []
                # schemas = NSS.NeighborhoodSummaryStatistics.buildOutputFieldsSchema(
                #             param_inFC.valueAsText, varNames, param_outFC.valueAsText,
                #             statisticMethod=param_staMethod.valueAsText, calDistance=True)
                # param_outFC.schema.additionalFields = schemas
            except:
                param_outFC.schema.additionalFields = []

        return

    def updateMessages(self, parameters):
        import locale as LOCALE
        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_outFC = ARCPY.GetParameterInfo()["out_features"]
        param_append_all = ARCPY.GetParameterInfo()["append_all_fields"]

        param_morans_threshold = ARCPY.GetParameterInfo()["min_autocorrelation"]
        param_spatial_comp_num = ARCPY.GetParameterInfo()["max_components"]

        param_concept_of_spatial_relation = ARCPY.GetParameterInfo()["neighborhood_type"]
        param_distBand = ARCPY.GetParameterInfo()["distance_band"]
        param_KNN = ARCPY.GetParameterInfo()["number_of_neighbors"]
        param_weightsFile = ARCPY.GetParameterInfo()["weights_matrix_file"]
        param_weightSchema = ARCPY.GetParameterInfo()["local_weighting_scheme"]
        param_kernelBand = ARCPY.GetParameterInfo()["kernel_bandwidth"]
        param_outSWM = ARCPY.GetParameterInfo()["out_swm"]
        param_idField = ARCPY.GetParameterInfo()["id_field"]

        #### Check positive values ####
        for param_positive in [param_spatial_comp_num]:
            if param_positive.enabled and param_positive.value is not None:
                if param_positive.value < 0:
                    param_positive.setIDMessage("ERROR", 531)

        if param_distBand.enabled and param_distBand.value:
            positiveParamValue, positiveParamUnit = param_distBand.valueAsText.split(" ")
            if LOCALE.atof(positiveParamValue) <= 0:
                param_distBand.setIDMessage("ERROR", 531)

        if param_weightsFile.enabled and param_weightsFile.value in ["", "#", None]:
            param_weightsFile.setIDMessage("ERROR", 930)

        #### Check conditioanl required parameters ####
        for param_required in [param_outFC, param_spatial_comp_num, param_KNN, param_weightSchema]:
            if param_required.enabled and param_required.value in ["", "#", None]:
                param_required.setIDMessage("ERROR", 530)

        if param_outSWM.value is not None and param_idField.value in ["", "#", None]:
            param_idField.setIDMessage("ERROR", 530)

        return

    def execute(self, parameters, messages):
        import SSDecomposeSpatialStructure as DSS
        DSS.execute_individual(parameters, messages, None, 1)


class CompareNeighborhoodConceptualizations:
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Compare Neighborhood Conceptualizations"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Spatial Component Utilities (Moran Eigenvectors)"
        self.helpContext = 9060019

    def isAdvance(self):
        from SSDecomposeSpatialStructure import isLicensed
        return isLicensed()

    def getParameterInfo(self):
        """Define the tool parameters."""
        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']

        param1 = ARCPY.Parameter(displayName="Input Fields",
                                  name="input_fields",
                                  datatype="Field",
                                  parameterType="Required",
                                  direction="Input",
                                  multiValue=True)
        param1.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        # param13.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param1.parameterDependencies = ["in_features"]

        param2 = ARCPY.Parameter(displayName="Output Spatial Weights Matrix File",
                                  name="out_swm",
                                  datatype="DEFile",
                                  parameterType="Required",
                                  direction="Output")
        param2.filter.list = ['swm']
        param2.enabled = True

        param3 = ARCPY.Parameter(displayName="Unique ID Field",
                                 name="id_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input",
                                 multiValue=False)
        param3.parameterDependencies = ["in_features"]
        param3.filter.list = ['Short', 'Long', 'BigInteger']
        param3.enabled = True

        return [param0, param1, param2, param3]

    def isLicensed(self):
        """Set whether the tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):

        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_auto_select_target = ARCPY.GetParameterInfo()["input_fields"]
        param_auto_select_outSWM = ARCPY.GetParameterInfo()["out_swm"]

        if param_auto_select_target.value is not None:
            fields = param_auto_select_target.valueAsText.split(";")
            unique_fields = set()
            duplicate_fields = []
            for field in fields:
                if field in unique_fields:
                    duplicate_fields.append(field)
                else:
                    unique_fields.add(field)
            if duplicate_fields:
                param_auto_select_target.setIDMessage("ERROR", 110415, "; ".join(duplicate_fields))

        return

    def updateMessages(self, parameters):
        import locale as LOCALE
        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_auto_select_target = ARCPY.GetParameterInfo()["input_fields"]
        param_auto_select_outSWM = ARCPY.GetParameterInfo()["out_swm"]

        if param_auto_select_target.value is not None:
            fields = param_auto_select_target.valueAsText.split(";")
            unique_fields = set()
            duplicate_fields = []
            for field in fields:
                if field in unique_fields:
                    duplicate_fields.append(field)
                else:
                    unique_fields.add(field)
            if duplicate_fields:
                param_auto_select_target.setIDMessage("ERROR", 110415, "; ".join(duplicate_fields))

        return

    def execute(self, parameters, messages):
        import SSDecomposeSpatialStructure as DSS
        DSS.execute_individual(parameters, messages, "GLOBAL", -1)


class FilterSpatialAutocorrelationFromField:
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Filter Spatial Autocorrelation From Field"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Spatial Component Utilities (Moran Eigenvectors)"
        self.helpContext = 9010006

    def isAdvance(self):
        from SSDecomposeSpatialStructure import isLicensed
        return isLicensed()

    def getParameterInfo(self):
        """Define the tool parameters."""
        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Input Field",
                                 name="input_field",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input",
                                 multiValue=False)
        param1.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        # param13.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param1.parameterDependencies = ["in_features"]

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="out_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")

        param3 = ARCPY.Parameter(displayName="Append All Fields From Input Features",
                                 name="append_all_fields",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param3.value = True
        param3.filter.list = ['ALL', 'NO_FIELDS']
        param3.enabled = True
        param3.displayOrder = 2

        param4 = ARCPY.Parameter(displayName="Input Spatial Weights Matrix File",
                                 name="in_swm",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ['swm', 'gwt', 'txt']
        param4.category = "Spatial Weights Matrix Options"

        param5 = ARCPY.Parameter(displayName="Output Spatial Weights Matrix File",
                                  name="out_swm",
                                  datatype="DEFile",
                                  parameterType="Optional",
                                  direction="Output")
        param5.filter.list = ['swm']
        param5.category = "Spatial Weights Matrix Options"

        param6 = ARCPY.Parameter(displayName="Unique ID Field",
                                 name="id_field",
                                 datatype="Field",
                                 parameterType="Optional",
                                 direction="Input",
                                 multiValue=False)
        param6.parameterDependencies = ["in_features"]
        param6.filter.list = ['Short', 'Long', 'BigInteger']
        param6.category = "Spatial Weights Matrix Options"
        param6.enabled = False

        return [param0, param1, param2, param3, 
                param4, param5, param6]

    def isLicensed(self):
        """Set whether the tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_outFC = ARCPY.GetParameterInfo()["out_features"]
        param_append_all = ARCPY.GetParameterInfo()["append_all_fields"]
        param_auto_select_target = ARCPY.GetParameterInfo()["input_field"]
        param_weightsFile = ARCPY.GetParameterInfo()["in_swm"]
        param_auto_select_outSWM = ARCPY.GetParameterInfo()["out_swm"]
        param_outSWM_idField = ARCPY.GetParameterInfo()["id_field"]

        if param_weightsFile.value is not None:
            clearParameter(param_auto_select_outSWM)
        else:
            param_auto_select_outSWM.enabled = True
        
        if param_auto_select_outSWM.value is not None:
            param_outSWM_idField.enabled = True
        else:
            clearParameter(param_outSWM_idField)

        #### Build the field schema for output Feature Class ####
        if param_inFC.value is not None and not param_outFC.hasError() and param_outFC.value is not None:
            try:
                varNames = UTILS.getTextParameter(2, parameters)
                if varNames is None:
                    varNames = []
                # schemas = NSS.NeighborhoodSummaryStatistics.buildOutputFieldsSchema(
                #             param_inFC.valueAsText, varNames, param_outFC.valueAsText,
                #             statisticMethod=param_staMethod.valueAsText, calDistance=True)
                # param_outFC.schema.additionalFields = schemas
            except:
                param_outFC.schema.additionalFields = []

        return

    def updateMessages(self, parameters):
        import locale as LOCALE
        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_outFC = ARCPY.GetParameterInfo()["out_features"]
        param_append_all = ARCPY.GetParameterInfo()["append_all_fields"]
        param_auto_select_target = ARCPY.GetParameterInfo()["input_field"]
        param_weightsFile = ARCPY.GetParameterInfo()["in_swm"]
        param_auto_select_outSWM = ARCPY.GetParameterInfo()["out_swm"]
        param_outSWM_idField = ARCPY.GetParameterInfo()["id_field"]

        if param_outSWM_idField.enabled and param_outSWM_idField.value is None:
            param_outSWM_idField.setIDMessage("ERROR", 530)

        return

    def execute(self, parameters, messages):
        import SSDecomposeSpatialStructure as DSS
        DSS.execute_individual(parameters, messages, "MIN_SPATIAL_AUTOCORRELATION", 2)


class CreateSpatialComponentExplanatoryVariables:
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create Spatial Component Explanatory Variables"
        self.description = ""
        self.canRunInBackground = False
        self.category = "Spatial Component Utilities (Moran Eigenvectors)"
        self.helpContext = 9060020

    def isAdvance(self):
        from SSDecomposeSpatialStructure import isLicensed
        return isLicensed()

    def getParameterInfo(self):
        """Define the tool parameters."""
        param0 = ARCPY.Parameter(displayName="Input Features",
                                 name="in_features",
                                 datatype="GPFeatureLayer",
                                 parameterType="Required",
                                 direction="Input")
        param0.filter.list = ['Point', 'Polygon']
        param0.displayOrder = 0

        param1 = ARCPY.Parameter(displayName="Input Fields",
                                 name="input_fields",
                                 datatype="Field",
                                 parameterType="Required",
                                 direction="Input",
                                 multiValue=True)
        param1.filter.list = ['Short', 'Long', 'Float', 'Double', 'BigInteger']
        # param13.controlCLSID = "{38C34610-C7F7-11D5-A693-0008C711C8C1}"
        param1.parameterDependencies = ["in_features"]

        param2 = ARCPY.Parameter(displayName="Output Features",
                                 name="out_features",
                                 datatype="DEFeatureClass",
                                 parameterType="Required",
                                 direction="Output")

        param3 = ARCPY.Parameter(displayName="Append All Fields From Input Features",
                                 name="append_all_fields",
                                 datatype="GPBoolean",
                                 parameterType="Optional",
                                 direction="Input")
        param3.value = True
        param3.filter.list = ['ALL', 'NO_FIELDS']
        param3.enabled = True
        param3.displayOrder = 2

        param4 = ARCPY.Parameter(displayName="Input Spatial Weights Matrix File",
                                 name="in_swm",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Input")
        param4.filter.list = ['swm', 'gwt', 'txt']
        param4.category = "Spatial Weights Matrix Options"

        param5 = ARCPY.Parameter(displayName="Output Spatial Weights Matrix File",
                                 name="out_swm",
                                 datatype="DEFile",
                                 parameterType="Optional",
                                 direction="Output")
        param5.filter.list = ['swm']
        param5.category = "Spatial Weights Matrix Options"

        param6 = ARCPY.Parameter(displayName="Unique ID Field",
                                 name="id_field",
                                 datatype="Field",
                                 parameterType="Optional",
                                 direction="Input",
                                 multiValue=False)
        param6.parameterDependencies = ["in_features"]
        param6.filter.list = ['Short', 'Long', 'BigInteger']
        param6.category = "Spatial Weights Matrix Options"
        param6.enabled = False

        return [param0, param1, param2, param3,
                param4, param5, param6]

    def isLicensed(self):
        """Set whether the tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_outFC = ARCPY.GetParameterInfo()["out_features"]
        param_append_all = ARCPY.GetParameterInfo()["append_all_fields"]
        param_auto_select_target = ARCPY.GetParameterInfo()["input_fields"]
        param_weightsFile = ARCPY.GetParameterInfo()["in_swm"]
        param_auto_select_outSWM = ARCPY.GetParameterInfo()["out_swm"]
        param_outSWM_idField = ARCPY.GetParameterInfo()["id_field"]

        if param_weightsFile.value is not None:
            clearParameter(param_auto_select_outSWM)
        else:
            param_auto_select_outSWM.enabled = True

        if param_auto_select_outSWM.value is not None:
            param_outSWM_idField.enabled = True
        else:
            clearParameter(param_outSWM_idField)

        #### Build the field schema for output Feature Class ####
        if param_inFC.value is not None and not param_outFC.hasError() and param_outFC.value is not None:
            try:
                varNames = UTILS.getTextParameter(2, parameters)
                if varNames is None:
                    varNames = []
                # schemas = NSS.NeighborhoodSummaryStatistics.buildOutputFieldsSchema(
                #             param_inFC.valueAsText, varNames, param_outFC.valueAsText,
                #             statisticMethod=param_staMethod.valueAsText, calDistance=True)
                # param_outFC.schema.additionalFields = schemas
            except:
                param_outFC.schema.additionalFields = []

        return

    def updateMessages(self, parameters):
        param_inFC = ARCPY.GetParameterInfo()["in_features"]
        param_outFC = ARCPY.GetParameterInfo()["out_features"]
        param_append_all = ARCPY.GetParameterInfo()["append_all_fields"]
        param_auto_select_target = ARCPY.GetParameterInfo()["input_fields"]
        param_weightsFile = ARCPY.GetParameterInfo()["in_swm"]
        param_outSWM_idField = ARCPY.GetParameterInfo()["id_field"]
        
        if param_outSWM_idField.enabled and param_outSWM_idField.value is None:
            param_outSWM_idField.setIDMessage("ERROR", 530)

        if param_auto_select_target.value is not None:
            fields = param_auto_select_target.valueAsText.split(";")
            unique_fields = set()
            duplicate_fields = []
            for field in fields:
                if field in unique_fields:
                    duplicate_fields.append(field)
                else:
                    unique_fields.add(field)
            if duplicate_fields:
                param_auto_select_target.setIDMessage("ERROR", 110415, "; ".join(duplicate_fields))

    def execute(self, parameters, messages):
        import SSDecomposeSpatialStructure as DSS
        DSS.execute_individual(parameters, messages, "FORWARD_SELECTION", 2)
