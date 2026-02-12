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
r"""The Spatial Statistics toolbox contains statistical tools for
analyzing spatial distributions, patterns, processes, and
relationships. While there may be similarities between spatial and
nonspatial (traditional) statistics in terms of concepts and
objectives, spatial statistics are unique in that they were developed
specifically for use with geographic data. Unlike traditional
nonspatial statistical methods, they incorporate space (proximity,
area, connectivity, and/or other spatial relationships) directly into
their mathematics."""
from __future__ import annotations

__all__ = [
    "AttributeUncertainty",
    "AverageNearestNeighbor",
    "BivariateSpatialAssociation",
    "BuildBalancedZones",
    "CalculateAreas",
    "CalculateCompositeIndex",
    "CalculateDistanceBand",
    "CalculateRates",
    "CausalInferenceAnalysis",
    "CentralFeature",
    "ClustersOutliers",
    "CollectEvents",
    "ColocationAnalysis",
    "CompareNeighborhoodConceptualizations",
    "ConvertSpatialWeightsMatrixtoTable",
    "ConvertSSPopup",
    "CreateSpatialComponentExplanatoryVariables",
    "DecomposeSpatialStructure",
    "DensityBasedClustering",
    "DescribeSSMFile",
    "DimensionReduction",
    "DirectionalDistribution",
    "DirectionalMean",
    "DirectionalTrend",
    "ExploratoryRegression",
    "ExportXYv",
    "FilterSpatialAutocorrelationFromField",
    "Forest",
    "GeneralizedLinearRegression",
    "GenerateNetworkSpatialWeights",
    "GenerateNetworkSWM",
    "GenerateSpatialWeightsMatrix",
    "GeographicallyWeightedRegression",
    "GroupingAnalysis",
    "GWR",
    "HighLowClustering",
    "HotSpotAnalysisComparison",
    "HotSpots",
    "IncrementalSpatialAutocorrelation",
    "LocalBivariateRelationships",
    "MeanCenter",
    "MedianCenter",
    "MGWR",
    "MultiDistanceSpatialClustering",
    "MultivariateClustering",
    "NeighborhoodSummaryStatistics",
    "OptimizedHotSpotAnalysis",
    "OptimizedOutlierAnalysis",
    "OrdinaryLeastSquares",
    "PredictUsingSSMFile",
    "PresenceOnlyPrediction",
    "SetSSMFileProperties",
    "SimilaritySearch",
    "SpatialAssociationBetweenZones",
    "SpatialAutocorrelation",
    "SpatiallyConstrainedMultivariateClustering",
    "SpatialOutlierDetection",
    "StandardDistance",
    "TimeSeriesSmoothing",
]
__alias__ = "stats"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Analyzing Patterns toolset
@gptooldoc("AverageNearestNeighbor_stats", None)
def AverageNearestNeighbor(
    Input_Feature_Class=None,
    Distance_Method: Literal["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"] | None = None,
    Generate_Report: Literal["GENERATE_REPORT", "NO_REPORT"] | None = None,
    Area=None,
) -> Result:
    """AverageNearestNeighbor_stats(Input_Feature_Class, Distance_Method, {Generate_Report}, {Area})

       Calculates a nearest neighbor index based on the average distance from
       each feature to its nearest neighboring feature.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class, typically a point feature class, for which the
         average nearest neighbor distance will be calculated.
     Distance_Method (String):
         Specifies how distances are calculated from each feature to
         neighboring features.EUCLIDEAN_DISTANCE-The straight-line distance
         between two points (as
         the crow flies)MANHATTAN_DISTANCE-The distance between two points
         measured along axes
         at right angles (city block); calculated by summing the (absolute)
         difference between the x- and y-coordinates
     Generate_Report {Boolean}:
         Specifies whether the tool will create a graphical summary of
         results.NO_REPORT-No graphical summary will be created. This is the
         default.GENERATE_REPORT-A graphical summary will be created as an HTML
         file.
     Area {Double}:
         A numeric value representing the study area size. The default value is
         the area of the minimum enclosing rectangle that would encompass all
         features (or all selected features). Units should match those for the
         Output Coordinate System."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AverageNearestNeighbor_stats(
                *gp_fixargs((Input_Feature_Class, Distance_Method, Generate_Report, Area), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("HighLowClustering_stats", None)
def HighLowClustering(
    Input_Feature_Class=None,
    Input_Field=None,
    Generate_Report: Literal["GENERATE_REPORT", "NO_REPORT"] | None = None,
    Conceptualization_of_Spatial_Relationships: Literal[
        "INVERSE_DISTANCE",
        "INVERSE_DISTANCE_SQUARED",
        "FIXED_DISTANCE_BAND",
        "ZONE_OF_INDIFFERENCE",
        "K_NEAREST_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    Distance_Method: Literal["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"] | None = None,
    Standardization: Literal["NONE", "ROW"] | None = None,
    Distance_Band_or_Threshold_Distance=None,
    Weights_Matrix_File=None,
    number_of_neighbors=None,
) -> Result:
    """HighLowClustering_stats(Input_Feature_Class, Input_Field, {Generate_Report}, Conceptualization_of_Spatial_Relationships, Distance_Method, Standardization, {Distance_Band_or_Threshold_Distance}, {Weights_Matrix_File}, {number_of_neighbors})

       Measures the degree of clustering for either high or low values using
       the Getis-Ord General G statistic.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class for which the General G statistic will be
         calculated.
     Input_Field (Field):
         The numeric field to be evaluated.
     Generate_Report {Boolean}:
         Specifies whether a graphical summary of result will be created as an
         .html file.NO_REPORT-No graphical summary will be created. This is the
         default.GENERATE_REPORT-A graphical summary will be created.
     Conceptualization_of_Spatial_Relationships (String):
         Specifies how spatial relationships among features are
         defined.INVERSE_DISTANCE-Nearby neighboring features have a larger
         influence
         on the computations for a target feature than features that are far
         away.INVERSE_DISTANCE_SQUARED-Same as INVERSE_DISTANCE except that the
         slope is sharper, so influence drops off more quickly, and only a
         target feature's closest neighbors will exert substantial influence on
         computations for that feature.FIXED_DISTANCE_BAND-Each feature is
         analyzed within the context of
         neighboring features. Neighboring features inside the specified
         critical distance (Distance_Band_or_Threshold) receive a weight of one
         and exert influence on computations for the target feature.
         Neighboring features outside the critical distance receive a weight of
         zero and have no influence on a target feature's
         computations.ZONE_OF_INDIFFERENCE-Features within the specified
         critical distance
         (Distance_Band_or_Threshold) of a target feature receive a weight of
         one and influence computations for that feature. Once the critical
         distance is exceeded, weights (and the influence a neighboring feature
         has on target feature computations) diminish with
         distance.K_NEAREST_NEIGHBORS-The closest k features are included in
         the
         analysis; k is a specified numeric
         parameter.CONTIGUITY_EDGES_ONLY-Only neighboring polygon features that
         share a
         boundary or overlap will influence computations for the target polygon
         feature.CONTIGUITY_EDGES_CORNERS-Polygon features that share a
         boundary, share
         a node, or overlap will influence computations for the target polygon
         feature.GET_SPATIAL_WEIGHTS_FROM_FILE-Spatial relationships are
         defined by a
         specified spatial weights file. The path to the spatial weights file
         is specified by the Weights_Matrix_File parameter.
     Distance_Method (String):
         Specifies how distances are calculated from each feature to
         neighboring features.EUCLIDEAN_DISTANCE-The straight-line distance
         between two points (as
         the crow flies)MANHATTAN_DISTANCE-The distance between two points
         measured along axes
         at right angles (city block); calculated by summing the (absolute)
         difference between the x- and y-coordinates
     Standardization (String):
         Specifies whether standardization of spatial weights will be applied.
         Row standardization is recommended whenever the distribution of your
         features is potentially biased due to sampling design or an imposed
         aggregation scheme.NONE-No standardization of spatial weights is
         applied.ROW-Spatial
         weights are standardized; each weight is divided by its
         row sum (the sum of the weights of all neighboring features). This is
         the default.
     Distance_Band_or_Threshold_Distance {Double}:
         Specifies a cutoff distance for the inverse distance and fixed
         distance options. Features outside the specified cutoff for a target
         feature are ignored in analyses for that feature. However, for
         ZONE_OF_INDIFFERENCE, the influence of features outside the given
         distance is reduced with distance, while those inside the distance
         threshold are equally considered. The distance value entered should
         match that of the output coordinate system.For the inverse distance
         conceptualizations of spatial relationships,
         a value of 0 indicates that no threshold distance is applied; when
         this parameter is left blank, a default threshold value is computed
         and applied. This default value is the Euclidean distance that ensures
         that every feature has at least one neighbor.This parameter has no
         effect when polygon contiguity
         (CONTIGUITY_EDGES_ONLY or CONTIGUITY_EDGES_CORNERS) or
         GET_SPATIAL_WEIGHTS_FROM_FILE spatial conceptualizations are selected.
     Weights_Matrix_File {File}:
         The path to a file containing weights that define spatial, and
         potentially temporal, relationships among features.
     number_of_neighbors {Long}:
         An integer specifying the number of neighbors that will be included in
         the analysis."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.HighLowClustering_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Input_Field,
                        Generate_Report,
                        Conceptualization_of_Spatial_Relationships,
                        Distance_Method,
                        Standardization,
                        Distance_Band_or_Threshold_Distance,
                        Weights_Matrix_File,
                        number_of_neighbors,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("IncrementalSpatialAutocorrelation_stats", None)
def IncrementalSpatialAutocorrelation(
    Input_Features=None,
    Input_Field=None,
    Number_of_Distance_Bands=None,
    Beginning_Distance=None,
    Distance_Increment=None,
    Distance_Method: Literal["EUCLIDEAN", "MANHATTAN"] | None = None,
    Row_Standardization: Literal["ROW_STANDARDIZATION", "NO_STANDARDIZATION"] | None = None,
    Output_Table=None,
    Output_Report_File=None,
) -> Result:
    """IncrementalSpatialAutocorrelation_stats(Input_Features, Input_Field, Number_of_Distance_Bands, {Beginning_Distance}, {Distance_Increment}, {Distance_Method}, {Row_Standardization}, {Output_Table}, {Output_Report_File})

       Measures spatial autocorrelation for a series of distances and
       optionally creates a line graph of those distances and their
       corresponding z-scores. Z-scores reflect the intensity of spatial
       clustering, and statistically significant peak z-scores indicate
       distances where spatial processes promoting clustering are most
       pronounced. These peak distances are often appropriate values to use
       for tools with a Distance Band or Distance Radius parameter.

    INPUTS:
     Input_Features (Feature Layer):
         The feature class for which spatial autocorrelation will be measured
         over a series of distances.
     Input_Field (Field):
         The numeric field that will be used in assessing spatial
         autocorrelation.
     Number_of_Distance_Bands (Long):
         The number of times the neighborhood size will be incremented and the
         dataset will be analyzed for spatial autocorrelation. The starting
         point and size of the increment are specified by the
         Beginning_Distance and Distance_Increment parameters, respectively.
     Beginning_Distance {Double}:
         The distance at which the analysis of spatial autocorrelation and the
         distance from which to increment will start. The value provided for
         this parameter should be in the units of the Output Coordinate System
         environment setting.
     Distance_Increment {Double}:
         The distance that will be increased after each iteration. The distance
         used in the analysis starts at the Beginning_Distance parameter value
         and increases by the amount specified in the Distance_Increment
         parameter value. The value provided for this parameter should be in
         the units of the Output Coordinate System environment setting.
     Distance_Method {String}:
         Specifies how distances will be calculated from each feature to
         neighboring features.EUCLIDEAN-The distances will be calculated using
         the straight-line
         distance between two points (as the crow flies). This is the
         default.MANHATTAN-The distances will be calculated using the distance
         between
         two points measured along axes at right angles (city block), which is
         calculated by summing the (absolute) difference between the x- and
         y-coordinates.
     Row_Standardization {Boolean}:
         Specifies whether spatial weights will be standardized. Row
         standardization is recommended whenever feature distribution is
         potentially biased due to sampling design or an imposed aggregation
         scheme.ROW_STANDARDIZATION-Spatial weights will be standardized. Each
         weight
         will divided by its row sum (the sum of the weights of all neighboring
         features). This is the default.NO_STANDARDIZATION-Spatial weights will
         not be standardized.

    OUTPUTS:
     Output_Table {Table}:
         The table that will be created with each distance band and associated
         z-score result.
     Output_Report_File {File}:
         The .pdf file that will be created containing a line graph summarizing
         results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.IncrementalSpatialAutocorrelation_stats(
                *gp_fixargs(
                    (
                        Input_Features,
                        Input_Field,
                        Number_of_Distance_Bands,
                        Beginning_Distance,
                        Distance_Increment,
                        Distance_Method,
                        Row_Standardization,
                        Output_Table,
                        Output_Report_File,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MultiDistanceSpatialClustering_stats", None)
def MultiDistanceSpatialClustering(
    Input_Feature_Class=None,
    Output_Table=None,
    Number_of_Distance_Bands=None,
    Compute_Confidence_Envelope: Literal[
        "0_PERMUTATIONS_-_NO_CONFIDENCE_ENVELOPE", "9_PERMUTATIONS", "99_PERMUTATIONS", "999_PERMUTATIONS"
    ]
    | None = None,
    Display_Results_Graphically: Literal["DISPLAY_IT", "NO_DISPLAY"] | None = None,
    Weight_Field=None,
    Beginning_Distance=None,
    Distance_Increment=None,
    Boundary_Correction_Method: Literal[
        "NONE", "SIMULATE_OUTER_BOUNDARY_VALUES", "REDUCE_ANALYSIS_AREA", "RIPLEY_EDGE_CORRECTION_FORMULA"
    ]
    | None = None,
    Study_Area_Method: Literal["MINIMUM_ENCLOSING_RECTANGLE", "USER_PROVIDED_STUDY_AREA_FEATURE_CLASS"] | None = None,
    Study_Area_Feature_Class=None,
) -> Result2[str, str]:
    """MultiDistanceSpatialClustering_stats(Input_Feature_Class, Output_Table, Number_of_Distance_Bands, {Compute_Confidence_Envelope}, {Display_Results_Graphically}, {Weight_Field}, {Beginning_Distance}, {Distance_Increment}, {Boundary_Correction_Method}, {Study_Area_Method}, {Study_Area_Feature_Class})

       Determines whether features, or the values associated with features,
       exhibit statistically significant clustering or dispersion over a
       range of distances.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class upon which the analysis will be performed.
     Number_of_Distance_Bands (Long):
         The number of times to increment the neighborhood size and analyze the
         dataset for clustering. The starting point and size of the increment
         are specified in the Beginning_Distance and Distance_Increment
         parameters, respectively.
     Compute_Confidence_Envelope {String}:
         The confidence envelope is calculated by randomly placing feature
         points (or feature values) in the study area. The number of
         points/values randomly placed is equal to the number of points in the
         feature class. Each set of random placements is called a permutation
         and the confidence envelope is created from these permutations. This
         parameter allows you to select how many permutations you want to use
         to create the confidence envelope.0_PERMUTATIONS_-
         _NO_CONFIDENCE_ENVELOPE-Confidence envelopes are not
         created.9_PERMUTATIONS-Nine sets of points/values are randomly
         placed.99_PERMUTATIONS-99 sets of points/values are randomly
         placed.999_PERMUTATIONS-999 sets of points/values are randomly placed.
     Display_Results_Graphically {Boolean}:
         This parameter has no effect; it remains to support backward
         compatibility.NO_DISPLAY-No graphical summary will be created
         (default).DISPLAY_IT-A
         graphical summary will be created as a graph layer.
     Weight_Field {Field}:
         A numeric field with weights representing the number of
         features/events at each location.
     Beginning_Distance {Double}:
         The distance at which to start the cluster analysis and the distance
         from which to increment. The value entered for this parameter should
         be in the units of the Output Coordinate System.
     Distance_Increment {Double}:
         The distance to increment during each iteration. The distance used in
         the analysis starts at the Beginning_Distance and increments by the
         amount specified in the Distance_Increment. The value entered for this
         parameter should be in the units of the Output Coordinate System
         environment setting.
     Boundary_Correction_Method {String}:
         Method to use to correct for underestimates in the number of neighbors
         for features near the edges of the study area.NONE-No edge correction
         is applied. However, if the input feature
         class already has points that fall outside the study area boundaries,
         these will be used in neighborhood counts for features near
         boundaries.SIMULATE_OUTER_BOUNDARY_VALUES-This method simulates points
         outside
         the study area so that the number of neighbors near edges is not
         underestimated. The simulated points are the "mirrors" of points near
         edges within the study area boundary.REDUCE_ANALYSIS_AREA-This method
         shrinks the study area such that some
         points are found outside of the study area boundary. Points found
         outside the study area are used to calculate neighbor counts but are
         not used in the cluster analysis
         itself.RIPLEY_EDGE_CORRECTION_FORMULA-For all the points (j) in the
         neighborhood of point i, this method checks to see if the edge of the
         study area is closer to i, or if j is closer to i. If j is closer,
         extra weight is given to the point j. This edge correction method is
         only appropriate for square or rectangular shaped study areas.
     Study_Area_Method {String}:
         Specifies the region to use for the study area. The K Function is
         sensitive to changes in study area size so careful selection of this
         value is important.MINIMUM_ENCLOSING_RECTANGLE-Indicates that the
         smallest possible
         rectangle enclosing all of the points will be
         used.USER_PROVIDED_STUDY_AREA_FEATURE_CLASS-Indicates that a feature
         class
         defining the study area will be provided in the Study Area Feature
         Class parameter.
     Study_Area_Feature_Class {Feature Layer}:
         Feature class that delineates the area over which the input feature
         class should be analyzed. Only specified if Study_Area_Method =
         "USER_PROVIDED_STUDY_AREA_FEATURE_CLASS".

    OUTPUTS:
     Output_Table (Table):
         The table to which the results of the analysis will be written."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MultiDistanceSpatialClustering_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Output_Table,
                        Number_of_Distance_Bands,
                        Compute_Confidence_Envelope,
                        Display_Results_Graphically,
                        Weight_Field,
                        Beginning_Distance,
                        Distance_Increment,
                        Boundary_Correction_Method,
                        Study_Area_Method,
                        Study_Area_Feature_Class,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SpatialAutocorrelation_stats", None)
def SpatialAutocorrelation(
    Input_Feature_Class=None,
    Input_Field=None,
    Generate_Report: Literal["GENERATE_REPORT", "NO_REPORT"] | None = None,
    Conceptualization_of_Spatial_Relationships: Literal[
        "INVERSE_DISTANCE",
        "INVERSE_DISTANCE_SQUARED",
        "FIXED_DISTANCE_BAND",
        "ZONE_OF_INDIFFERENCE",
        "K_NEAREST_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    Distance_Method: Literal["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"] | None = None,
    Standardization: Literal["NONE", "ROW"] | None = None,
    Distance_Band_or_Threshold_Distance=None,
    Weights_Matrix_File=None,
    number_of_neighbors=None,
) -> Result:
    """SpatialAutocorrelation_stats(Input_Feature_Class, Input_Field, {Generate_Report}, Conceptualization_of_Spatial_Relationships, Distance_Method, Standardization, {Distance_Band_or_Threshold_Distance}, {Weights_Matrix_File}, {number_of_neighbors})

       Measures spatial autocorrelation based on feature locations and
       attribute values using the Global Moran's I statistic.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class for which spatial autocorrelation will be
         calculated.
     Input_Field (Field):
         The numeric field that will be used in assessing spatial
         autocorrelation.
     Generate_Report {Boolean}:
         Specifies whether a graphical summary of result will be created as an
         .html file.NO_REPORT-No graphical summary will be created. This is the
         default.GENERATE_REPORT-A graphical summary will be created.
     Conceptualization_of_Spatial_Relationships (String):
         Specifies how spatial relationships among features will be
         defined.INVERSE_DISTANCE-Nearby neighboring features have a larger
         influence
         on the computations for a target feature than features that are far
         away.INVERSE_DISTANCE_SQUARED-This is the same as the INVERSE_DISTANCE
         option except that the slope is sharper, so influence drops off more
         quickly, and only a target feature's closest neighbors will exert
         substantial influence on computations for that
         feature.FIXED_DISTANCE_BAND-Each feature is analyzed within the
         context of
         neighboring features. Neighboring features within the specified
         critical distance (Distance_Band_or_Threshold value) receive a weight
         of one and exert influence on computations for the target feature.
         Neighboring features outside the critical distance receive a weight of
         zero and have no influence on a target feature's
         computations.ZONE_OF_INDIFFERENCE-Features within the specified
         critical distance
         (Distance_Band_or_Threshold value) of a target feature receive a
         weight of one and influence computations for that feature. Once the
         critical distance is exceeded, weights (and the influence a
         neighboring feature has on target feature computations) diminish with
         distance.K_NEAREST_NEIGHBORS-The closest k features are included in
         the
         analysis. The number of neighbors (k) to include in the analysis is
         specified by the number_of_neighbors
         parameter.CONTIGUITY_EDGES_ONLY-Only neighboring polygon features that
         share a
         boundary or overlap will influence computations for the target polygon
         feature.CONTIGUITY_EDGES_CORNERS-Polygon features that share a
         boundary, share
         a node, or overlap will influence computations for the target polygon
         feature.GET_SPATIAL_WEIGHTS_FROM_FILE-Spatial relationships are
         defined by a
         specified spatial weights file. The path to the spatial weights file
         is specified by the Weights_Matrix_File parameter.
     Distance_Method (String):
         Specifies how distances will be calculated from each feature to
         neighboring features.EUCLIDEAN_DISTANCE-The straight-line distance
         between two points (as
         the crow flies) will be used. This is the
         default.MANHATTAN_DISTANCE-The distance between two points measured
         along axes
         at right angles (city block) will be used. This is calculated by
         summing the (absolute) difference between the x- and y-coordinates
     Standardization (String):
         Specifies whether standardization of spatial weights will be applied.
         Row standardization is recommended whenever the distribution of
         features is potentially biased due to sampling design or an imposed
         aggregation scheme.NONE-No standardization of spatial weights will be
         applied.ROW-Spatial
         weights will be standardized; each weight will be divided
         by its row sum (the sum of the weights of all neighboring features).
         This is the default.
     Distance_Band_or_Threshold_Distance {Double}:
         The cutoff distance for the various inverse distance and fixed
         distance options. Features outside the specified cutoff for a target
         feature are ignored in analyses for that feature. However, for
         ZONE_OF_INDIFFERENCE, the influence of features outside the given
         distance is reduced with distance, while those within the distance
         threshold are equally considered. The distance value provided should
         match that of the output coordinate system.For the inverse distance
         conceptualizations of spatial relationships,
         a value of 0 indicates that no threshold distance is applied; when
         this parameter is left blank, a default threshold value is computed
         and applied. The default value is the Euclidean distance, which
         ensures that every feature has at least one neighbor.This parameter
         has no effect when polygon contiguity
         (CONTIGUITY_EDGES_ONLY or CONTIGUITY_EDGES_CORNERS) or
         GET_SPATIAL_WEIGHTS_FROM_FILE spatial conceptualization is specified.
     Weights_Matrix_File {File}:
         The path to a file containing weights that define spatial, and
         potentially temporal, relationships among features.
     number_of_neighbors {Long}:
         An integer specifying the number of neighbors that will be included in
         the analysis."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SpatialAutocorrelation_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Input_Field,
                        Generate_Report,
                        Conceptualization_of_Spatial_Relationships,
                        Distance_Method,
                        Standardization,
                        Distance_Band_or_Threshold_Distance,
                        Weights_Matrix_File,
                        number_of_neighbors,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Assessing Sensitivity toolset
@gptooldoc("AttributeUncertainty_stats", None)
def AttributeUncertainty(
    in_features=None,
    out_features=None,
    out_simulation_table=None,
    analysis_input_features=None,
    uncertainty_measure: Literal["MOE", "CONFIDENCE_BOUNDS", "PERCENTAGE"] | None = None,
    moe_field=None,
    confidence_bound_field=None,
    randomize_pct=None,
    num_simulations=None,
    simulation_method: Literal["NORMAL", "UNIFORM", "TRIANGULAR"] | None = None,
    output_workspace=None,
    sim_data_limits=None,
    moe_conf_level=None,
) -> Result3[str, str, str | Layer]:
    """AttributeUncertainty_stats(in_features, out_features, {out_simulation_table}, {analysis_input_features}, {uncertainty_measure}, {moe_field;moe_field...}, {confidence_bound_field;confidence_bound_field...}, {randomize_pct;randomize_pct...}, {num_simulations}, {simulation_method}, {output_workspace}, {sim_data_limits;sim_data_limits...}, {moe_conf_level})

       Measures the stability of an analysis result by comparing the original
       analysis output to the results from multiple tool runs using simulated
       data. The simulated data accounts for uncertainty in one or more
       analysis variables. Three types of attribute uncertainty are
       supported: margin of error, confidence bounds, and a percentage of the
       original attribute value.

    INPUTS:
     in_features (Feature Layer):
         A feature class containing the output analysis result from a spatial
         statistics tool. Only certain tools are supported. This is the
         analysis result that will be evaluated for stability.
     analysis_input_features {Feature Layer}:
         The input features that were used in the analysis that produced the
         analysis result features.
     uncertainty_measure {String}:
         Specifies how attribute uncertainty will be measured.MOE-The input
         feature class of the original analysis contains a field
         with the symmetrical margin of error for each feature and that will be
         used.CONFIDENCE_BOUNDS-The input feature class of the original
         analysis
         contains a field with the lower bounds and upper bounds for each
         feature and that will be used. The bounds may be asymmetric with
         respect to a feature's analysis variable value.PERCENTAGE-The analysis
         variable will be adjusted by the percentage
         specified by the randomize_pct parameter.
     moe_field {Value Table}:
         The field containing the margin of error (MOE) of the analysis
         variable. The MOE is used to construct a symmetric distribution from
         which the simulated values will be generated.
     confidence_bound_field {Value Table}:
         The fields containing the lower and upper bounds for the analysis
         variable. Values will be generated between the lower and upper
         confidence bounds.
     randomize_pct {Value Table}:
         The percentage of the original attribute value that will be subtracted
         and added to the original value of the analysis variable to create a
         range of values for the simulations.
     num_simulations {Long}:
         The number of simulations that will be performed.
     simulation_method {String}:
         Specifies the probability distribution that will be used to simulate
         data.NORMAL-A normal distribution will be used. This is the
         default.UNIFORM-A uniform distribution will be used.TRIANGULAR-A
         triangular distribution will be used.
     output_workspace {Workspace}:
         An existing workspace where the analysis results from each simulation
         will be stored. The workspace can be a folder or a geodatabase.
     sim_data_limits {Value Table}:
         The lower and upper limits for the simulated values. All simulated
         values will be within these limits. For example, for counts or
         percentages, use a lower limit of zero to ensure that there are no
         negative counts or percentages.
     moe_conf_level {Long}:
         The confidence level of the margins of error. For example, if the
         margins of error were created from 95 percent confidence intervals,
         provide a value of 95.

    OUTPUTS:
     out_features (Feature Class):
         The output features that will contain a copy of the original analysis
         results and fields summarizing the stability of the analysis for each
         feature.
     out_simulation_table {Table}:
         The output table that will contain fields summarizing the stability of
         the analysis."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AttributeUncertainty_stats(
                *gp_fixargs(
                    (
                        in_features,
                        out_features,
                        out_simulation_table,
                        analysis_input_features,
                        uncertainty_measure,
                        moe_field,
                        confidence_bound_field,
                        randomize_pct,
                        num_simulations,
                        simulation_method,
                        output_workspace,
                        sim_data_limits,
                        moe_conf_level,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Mapping Clusters toolset
@gptooldoc("BuildBalancedZones_stats", None)
def BuildBalancedZones(
    in_features=None,
    output_features=None,
    zone_creation_method: Literal["ATTRIBUTE_TARGET", "NUMBER_ZONES_AND_ATTRIBUTE", "NUMBER_OF_ZONES"] | None = None,
    number_of_zones=None,
    zone_building_criteria_target=None,
    zone_building_criteria=None,
    spatial_constraints: Literal[
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "TRIMMED_DELAUNAY_TRIANGULATION",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    weights_matrix_file=None,
    zone_characteristics: list[Literal["EQUAL_AREA", "COMPACTNESS", "EQUAL_NUMBER_OF_FEATURES"]]
    | Literal["EQUAL_AREA", "COMPACTNESS", "EQUAL_NUMBER_OF_FEATURES"]
    | str
    | None = None,
    attribute_to_consider=None,
    distance_to_consider=None,
    categorial_variable=None,
    proportion_method: Literal["MAINTAIN_WITHIN_PROPORTION", "MAINTAIN_OVERALL_PROPORTION"] | None = None,
    population_size=None,
    number_generations=None,
    mutation_factor=None,
    output_convergence_table=None,
) -> Result2[str, str]:
    """BuildBalancedZones_stats(in_features, output_features, zone_creation_method, {number_of_zones}, {zone_building_criteria_target;zone_building_criteria_target...}, {zone_building_criteria;zone_building_criteria...}, {spatial_constraints}, {weights_matrix_file}, {zone_characteristics;zone_characteristics...}, {attribute_to_consider;attribute_to_consider...}, {distance_to_consider;distance_to_consider...}, {categorial_variable}, {proportion_method}, {population_size}, {number_generations}, {mutation_factor}, {output_convergence_table})

       Creates spatially contiguous zones in a study area using a genetic
       growth algorithm based on specified criteria.

    INPUTS:
     in_features (Feature Layer):
         The feature class or feature layer that will be aggregated into zones.
     zone_creation_method (String):
         Specifies the method that will be used to create each zone. Zones grow
         until all specified criteria are satisfied.
         ATTRIBUTE_TARGET-Zones will be created based on target values
         of one or multiple variables. The sum of each attribute must be
         specified in theparameter, and each zone will grow until the sum of
         the attributes exceeds these values. For example, you can use this
         option to create zones that each have at least 100,000 residents and
         20,000 family homes. Zone Building Criteria With Target
         NUMBER_ZONES_AND_ATTRIBUTE-A specified number of zones will
         be created while keeping the sum of an attribute approximately equal
         within each zone. The number of zones must be specified in
         theparameter. The attribute sum within each zone is equal to the sum
         of the total attribute divided by the number of zones. Target
         Number of Zones         NUMBER_OF_ZONES-A specified number of zones
         will be created
         that are each composed of approximately the same number of input
         features. The number of zones must be specified in theparameter.
         Target Number of Zones
     number_of_zones {Long}:
         The number of zones that will be created.
     zone_building_criteria_target {Value Table}:
         Specifies the variables that will be considered, as well as their
         target values and optional weights. The default weight is 1, and each
         variable contributes equally unless they are changed.
     zone_building_criteria {Value Table}:
         Specifies the variables that will be considered and, optionally, their
         weights. The default weight is 1, and each variable contributes
         equally unless changed.
     spatial_constraints {String}:
         Specifies how neighbors will be defined while the zones grow.
         Zones can only grow into new features that are neighbors of at least
         one of the features already in the zone. If the input features are
         polygons, the default spatial constraint is. If the input features are
         points, the default spatial constraint is. Contiguity edges
         cornersTrimmed Delaunay triangulationCONTIGUITY_EDGES_ONLY-For zones
         containing contiguous polygon
         features, only polygons that share an edge will be part of the same
         zone.CONTIGUITY_EDGES_CORNERS-For zones containing contiguous polygon
         features, only polygons that share an edge or a vertex will be part of
         the same zone.TRIMMED_DELAUNAY_TRIANGULATION-Features in the same
         zone will have at
         least one natural neighbor in common with another feature in the zone.
         Natural neighbor relationships are based on a trimmed Delaunay
         Triangulation. Conceptually, Delaunay Triangulation creates a
         nonoverlapping mesh of triangles from feature centroids. Each feature
         is a triangle node, and nodes that share edges are considered
         neighbors. These triangles are then clipped to a convex hull to ensure
         that features cannot be neighbors with any features outside of the
         convex hull. This is the default.
         GET_SPATIAL_WEIGHTS_FROM_FILE-Spatial, and, optionally,
         temporal relationships will be defined by a specified spatial weights
         file (.swm). Create the spatial weights matrix using the Generate
         Spatial Weights Matrix tool or the Generate Network Spatial Weights
         tool. The path to the spatial weights file is specified by
         theparameter. Spatial Weights Matrix File
     weights_matrix_file {File}:
         The path to a file containing spatial weights that define spatial and,
         optionally, temporal relationships among features.
     zone_characteristics {String}:
         Specifies the characteristics of the zones that will be
         created.EQUAL_AREA-Zones with total area as similar as possible will
         be
         created.COMPACTNESS-Zones with more closely-packed (compact) features
         will be
         created.EQUAL_NUMBER_OF_FEATURES-Zones with an equal number of
         features will
         be created.
     attribute_to_consider {Value Table}:
         Specifies attributes and statistics to consider in the selection of
         final zones. You can homogenize attributes based on their sum,
         average, median, or variance. For example, if you are creating zones
         based on home values and want to balance the average total income
         within each zone, the solution with the most equal average income
         across zones will be preferred.
     distance_to_consider {Feature Layer}:
         The feature class that will be used to homogenize the total distance
         per zone. The distance is calculated from each of the input features
         to the closest feature provided in this parameter. This distance is
         then used as an additional attribute constraint when selecting the
         final zone solution. For example, you can create police patrol
         districts that are each approximately the same distance from the
         closest police station.
     categorial_variable {Field}:
         The categorical variable to be considered for zone proportions.
     proportion_method {String}:
         Specifies the type of proportion that will be maintained based on the
         chosen categorical variable.MAINTAIN_WITHIN_PROPORTION-Each zone will
         maintain the same
         proportions as the overall study area for the given categorical
         variable. For example, given a categorical variable that is 60% Type A
         and 40% Type B, this method will prefer zones that are composed of
         approximately 60% Type A features and 40% Type B
         features.MAINTAIN_OVERALL_PROPORTION-Zones will be created so that the
         overall
         proportions of category predominance by zone matches the proportions
         of the given categorical variable for the entire dataset. For example,
         given a categorical variable that is 60% Type A and 40% Type B, this
         method will prefer solutions where 60% of the zones are predominantly
         Type A features and 40% of the zones are predominantly Type B
         features.
     population_size {Long}:
         The number of randomly generated initial seeds. For larger datasets,
         increasing this number will increase the search space and the
         probability of finding a better solution. The default is 100.
     number_generations {Long}:
         The number of times the zone search process will be repeated. For
         larger datasets, increasing the number is recommended to find an
         optimal solution. The default is 50 generations.
     mutation_factor {Double}:
         The probability that an individual's seed values will be mutated to a
         new set of seeds. Mutation increases the search space by introducing
         variability of the possible solutions in every generation and allows
         for faster convergence to an optimal solution. The default is 0.1.

    OUTPUTS:
     output_features (Feature Class):
         The output feature class indicating which features are
         aggregated into each zone. The feature class will be symbolized by
         thefield and will contain fields displaying the values of each
         criteria that you specify. ZONE_ID
     output_convergence_table {Table}:
         The table containing the total fitness score for the best solution
         found in every generation as well as the fitness score for the
         individual zone constraints."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BuildBalancedZones_stats(
                *gp_fixargs(
                    (
                        in_features,
                        output_features,
                        zone_creation_method,
                        number_of_zones,
                        zone_building_criteria_target,
                        zone_building_criteria,
                        spatial_constraints,
                        weights_matrix_file,
                        zone_characteristics,
                        attribute_to_consider,
                        distance_to_consider,
                        categorial_variable,
                        proportion_method,
                        population_size,
                        number_generations,
                        mutation_factor,
                        output_convergence_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateCompositeIndex_stats", None)
def CalculateCompositeIndex(
    in_table=None,
    in_variables=None,
    append_to_input: Literal["APPEND_TO_INPUT", "NEW_FEATURES"] | None = None,
    out_table=None,
    index_preset: Literal["MEAN_SCALED", "MEAN_PCTL", "GEOMEAN_SCALED", "SUM_FLAGSPCTL", "CUSTOM"] | None = None,
    preprocessing: Literal["MINMAX", "CUST_MINMAX", "PERCENTILE", "RANK", "ZSCORE", "CUST_ZSCORE", "BINARY", "RAW"]
    | None = None,
    pre_threshold_scaling: Literal[
        "THRESHOLD_MINMAX",
        "THRESHOLD_CUST_MINMAX",
        "THRESHOLD_PERCENTILE",
        "THRESHOLD_ZSCORE",
        "THRESHOLD_CUST_ZSCORE",
        "THRESHOLD_RAW",
    ]
    | None = None,
    pre_custom_zscore=None,
    pre_min_max=None,
    pre_thresholds=None,
    index_method: Literal["MEAN", "SUM", "GEOMETRIC_MEAN", "PRODUCT"] | None = None,
    index_weights=None,
    out_index_name=None,
    out_index_reverse: Literal["REVERSE", "NO_REVERSE"] | None = None,
    post_min_max=None,
    post_reclass: list[Literal["EQINTERVAL", "QUANTILE", "STDDEV", "CUST"]]
    | Literal["EQINTERVAL", "QUANTILE", "STDDEV", "CUST"]
    | str
    | None = None,
    post_num_classes=None,
    post_custom_classes=None,
) -> Result3[str, str | Table, str | Layer]:
    """CalculateCompositeIndex_stats(in_table, in_variables;in_variables..., {append_to_input}, {out_table}, {index_preset}, {preprocessing}, {pre_threshold_scaling}, {pre_custom_zscore;pre_custom_zscore...}, {pre_min_max;pre_min_max...}, {pre_thresholds;pre_thresholds...}, {index_method}, {index_weights;index_weights...}, {out_index_name}, {out_index_reverse}, {post_min_max;post_min_max...}, {post_reclass;post_reclass...}, {post_num_classes}, {post_custom_classes;post_custom_classes...})

       Combines multiple numeric variables to create a single index.

    INPUTS:
     in_table (Table View):
         The table or features containing the variables that will be combined
         into the index.
     in_variables (Value Table):
         A list of numeric fields representing the variables that will be
         combined as an index. The Reverse Direction column reverses the values
         of the variables. This means that the feature or record that
         originally had the highest value will have the lowest value, and vice
         versa. Values will be reversed after scaling.
     append_to_input {Boolean}:
         Specifies whether the results will be appended to the input data or
         provided as an output feature class or table.APPEND_TO_INPUT-The
         results will be appended to the input data. This
         option modifies the input data.NEW_FEATURES-An output feature class
         or table will be created
         containing the results. This is the default.
     index_preset {String}:
         Specifies the workflow that will be used when creating the index. The
         options represent common index creation workflows; each option sets
         default values for the preprocessing and index_method
         parameters.MEAN_SCALED-An index will be created by scaling the input
         variables
         between 0 and 1 and averaging the scaled values. This method is useful
         for creating an index that is easy to interpret. The shape of the
         distribution and outliers in the input variables will impact the
         index. This is the default.MEAN_PCTL-An index will be created by
         scaling the ranks of the input
         variables between 0 and 1 and averaging the scaled ranks. This option
         is useful when the rankings of the variable values are more important
         than the differences between values. The shape of the distribution and
         outliers in the input variables will not impact the
         index.GEOMEAN_SCALED-An index will be created by scaling the input
         variables
         between 0 and 1 and calculating the geometric average of the scaled
         values. High values will not cancel low values, so this option is
         useful for creating an index in which higher index values will occur
         only when there are high values in multiple variables.
         SUM_FLAGSPCTL-An index will be created that counts the number
         of input variables with values greater than or equal to the
         90percentile. This method is useful for identifying locations that may
         be considered the most extreme or the most in need.
         thCUSTOM-An index will be created using customized variable scaling
         and
         combination options.
     preprocessing {String}:
         Specifies the method that will be used to convert the input variables
         to a common scale.MINMAX-Variables will be scaled between 0 and 1
         using the minimum and
         maximum values of each variable. This is the default.CUST_MINMAX-
         Variables will be scaled between 0 and 1 using the
         possible minimum and possible maximum values for each variable,
         specified by the pre_min_max parameter. This method has many uses,
         including specifying the minimum and maximum based on a benchmark, on
         a reference statistic, or on theoretical values. For example, if ozone
         recordings for a single day range between 5 and 27 parts per million
         (ppm), you can use the theoretical minimum and maximum based on prior
         observation and domain expertise to ensure that the index can be
         compared across multiple daysPERCENTILE-Variables will be converted to
         percentiles between 0 and 1
         by calculating the percent of data values less than the data value.
         This option is useful when you want to ignore absolute differences
         between the data values, such as with outliers or skewed
         distributions.RANK-Variables will be ranked. The smallest value is
         assigned rank
         value 1, the next value is assigned rank value 2, and so on. Ties are
         assigned the average of their ranks.ZSCORE-Each variable will be
         standardized by subtracting the mean
         value and dividing by the standard deviation (called a z-score). The
         z-score is the number of standard deviations above or below the mean
         value. This option is useful when the means of the variables are
         important comparison points. Values above the mean will receive
         positive z-scores, and values below the mean will receive negative
         z-scores.CUST_ZSCORE-Each variable will be standardized by subtracting
         a custom
         mean value and dividing by a custom standard deviation. Provide the
         custom values in the pre_custom_zscore parameter. This option is
         useful when the means and standard deviations of the variables are
         known from previous research.BINARY-Variables will be identified when
         they are above or below a
         defined threshold. The resulting field contains binary (0 or 1) values
         indicating whether the threshold was exceeded. You can also use the
         pre_threshold_scaling parameter to scale the input variable values
         before defining the threshold, and use the pre_thresholds parameter to
         specify the threshold values. This method is useful when the values of
         the variables are less important than whether they exceed a particular
         threshold, such as a safety limit of a pollutant.RAW-The original
         values of the variables will be used. Use this method
         only when all variables are measured on a comparable scale, such as
         percentages or rates, or when the variables have been standardized
         before using this tool.
     pre_threshold_scaling {String}:
         Specifies the method that will be used to convert the input variables
         to a common scale prior to setting
         thresholds.THRESHOLD_MINMAX-Variables between 0 and 1 will be scaled
         using the
         minimum and maximum values of each
         variable.THRESHOLD_CUST_MINMAX-Variables between 0 and 1 will be
         scaled using
         the possible minimum and possible maximum values for each
         variable.THRESHOLD_PERCENTILE-Variables will be converted to
         percentiles
         between 0 and 1.THRESHOLD_ZSCORE-Each variable will be standardized by
         subtracting the
         mean value and dividing by the standard
         deviation.THRESHOLD_CUST_ZSCORE-Each variable will be standardized by
         subtracting a custom mean value and dividing by a custom standard
         deviation.THRESHOLD_RAW-The values of the variables will be used
         without
         change. This is the default.
     pre_custom_zscore {Value Table}:
         The custom mean value and custom standard deviation that will
         be used when standardizing each input variable. For each variable,
         provide the custom mean in thecolumn and the custom standard deviation
         in thecolumn. MeanStandard Deviation
     pre_min_max {Value Table}:
         The possible minimum and maximum values that will be used in the units
         of the variables. Each variable will be scaled between 0 and 1 based
         on the possible minimum and maximum values.
     pre_thresholds {Value Table}:
         The threshold that determines whether a feature will be flagged.
         Specify the value in the units of the scaled variables and specify
         whether values above or below the threshold value will be flagged.
     index_method {String}:
         Specifies the method that will be used to combine the scaled variables
         into a single value.SUM-The values will be added.MEAN-The arithmetic
         (additive) mean of
         the values will be calculated.
         This is the default.PRODUCT-The values will be multiplied. All scaled
         values must be
         greater than or equal to zero.GEOMETRIC_MEAN-The geometric
         (multiplicative) mean of the values will
         be calculated. All scaled values must be greater than or equal to
         zero.You cannot multiply or calculate a geometric mean when any
         variables
         are scaled using z-scores, because z-scores always contain negative
         values.
     index_weights {Value Table}:
         The weights that will set the relative influence of each input
         variable on the index. Each weight has a default value of 1, meaning
         that each variable has equal contribution. Increase or decrease the
         weights to reflect the relative importance of the variables. For
         example, if a variable is twice as important as another, use a weight
         value of 2. Using weight values larger than 1 while multiplying to
         combine scaled values can result in indices with very large values.
     out_index_name {String}:
         The name of the index. The value is used in the visualization of the
         outputs, such as field aliases and chart labels. The value is not used
         when the output (or appended input) is a shapefile.
     out_index_reverse {Boolean}:
         Specifies whether the output index values will be reversed in
         direction (for example, to treat high index values as low
         values).REVERSE-The index values will be reversed in
         direction.NO_REVERSE-
         The index values will not be reversed in direction. This
         is the default.
     post_min_max {Value Table}:
         The minimum and maximum of the output index values. This scaling is
         applied after combining the scaled variables. If no values are
         provided, the output index is not scaled.
     post_reclass {String}:
         Specifies the method that will be used to classify the output index.
         An additional output field will be provided for each selected
         option.EQINTERVAL-Classes will be created by dividing the range of
         values
         into equally sized intervalsQUANTILE-Classes will be created in which
         each class includes an equal
         number of records.STDDEV-Classes will be created corresponding to the
         number of standard
         deviations above and below the average of the index. The resulting
         values will be between -3 and 3.CUST-Class breaks and class values
         will be specified using the
         post_custom_classes parameter.
     post_num_classes {Long}:
         The number of classes that will be used for the equal interval and
         quantile classification methods.
     post_custom_classes {Value Table}:
         The upper bounds and class values for the custom classification
         method. For example, you can use this variable to classify an index
         containing values between 0 and 100 into classes representing low,
         medium, and high values based on custom break values.

    OUTPUTS:
     out_table {Feature Class / Table}:
         The output features or table that will include the results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateCompositeIndex_stats(
                *gp_fixargs(
                    (
                        in_table,
                        in_variables,
                        append_to_input,
                        out_table,
                        index_preset,
                        preprocessing,
                        pre_threshold_scaling,
                        pre_custom_zscore,
                        pre_min_max,
                        pre_thresholds,
                        index_method,
                        index_weights,
                        out_index_name,
                        out_index_reverse,
                        post_min_max,
                        post_reclass,
                        post_num_classes,
                        post_custom_classes,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClustersOutliers_stats", None)
def ClustersOutliers(
    Input_Feature_Class=None,
    Input_Field=None,
    Output_Feature_Class=None,
    Conceptualization_of_Spatial_Relationships: Literal[
        "INVERSE_DISTANCE",
        "INVERSE_DISTANCE_SQUARED",
        "FIXED_DISTANCE_BAND",
        "ZONE_OF_INDIFFERENCE",
        "K_NEAREST_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    Distance_Method: Literal["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"] | None = None,
    Standardization: Literal["NONE", "ROW"] | None = None,
    Distance_Band_or_Threshold_Distance=None,
    Weights_Matrix_File=None,
    Apply_False_Discovery_Rate__FDR__Correction: Literal["APPLY_FDR", "NO_FDR"] | None = None,
    Number_of_Permutations: Literal["0", "99", "199", "499", "999", "9999"] | None = None,
    number_of_neighbors=None,
) -> Result:
    """ClustersOutliers_stats(Input_Feature_Class, Input_Field, Output_Feature_Class, Conceptualization_of_Spatial_Relationships, Distance_Method, Standardization, {Distance_Band_or_Threshold_Distance}, {Weights_Matrix_File}, {Apply_False_Discovery_Rate__FDR__Correction}, {Number_of_Permutations}, {number_of_neighbors})

       Given a set of weighted features, identifies statistically significant
       hot spots, cold spots, and spatial outliers using the Anselin Local
       Moran's I statistic.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class for which cluster and outlier analysis will be
         performed.
     Input_Field (Field):
         The numeric field to be evaluated.
     Conceptualization_of_Spatial_Relationships (String):
         Specifies how spatial relationships among features are
         defined.INVERSE_DISTANCE-Nearby neighboring features have a larger
         influence
         on the computations for a target feature than features that are far
         away.INVERSE_DISTANCE_SQUARED-Same as INVERSE_DISTANCE except that the
         slope is sharper, so influence drops off more quickly, and only a
         target feature's closest neighbors will exert substantial influence on
         computations for that feature.FIXED_DISTANCE_BAND-Each feature is
         analyzed within the context of
         neighboring features. Neighboring features inside the specified
         critical distance (Distance_Band_or_Threshold_Distance) receive a
         weight of one and exert influence on computations for the target
         feature. Neighboring features outside the critical distance receive a
         weight of zero and have no influence on a target feature's
         computations.ZONE_OF_INDIFFERENCE-Features within the specified
         critical distance
         (Distance_Band_or_Threshold_Distance) of a target feature receive a
         weight of one and influence computations for that feature. Once the
         critical distance is exceeded, weights (and the influence a
         neighboring feature has on target feature computations) diminish with
         distance.K_NEAREST_NEIGHBORS-The closest k features are included in
         the
         analysis. The number of neighbors (k) is specified by the
         number_of_neighbors parameter.CONTIGUITY_EDGES_ONLY-Only neighboring
         polygon features that share a
         boundary or overlap will influence computations for the target polygon
         feature.CONTIGUITY_EDGES_CORNERS-Polygon features that share a
         boundary, share
         a node, or overlap will influence computations for the target polygon
         feature.GET_SPATIAL_WEIGHTS_FROM_FILE-Spatial relationships are
         defined by a
         specified spatial weights file. The path to the spatial weights file
         is specified by the Weights_Matrix_File parameter.
     Distance_Method (String):
         Specifies how distances are calculated from each feature to
         neighboring features.EUCLIDEAN_DISTANCE-The straight-line distance
         between two points (as
         the crow flies)MANHATTAN_DISTANCE-The distance between two points
         measured along axes
         at right angles (city block); calculated by summing the (absolute)
         difference between the x- and y-coordinates
     Standardization (String):
         Row standardization is recommended whenever the distribution of your
         features is potentially biased due to sampling design or an imposed
         aggregation scheme.NONE-No standardization of spatial weights is
         applied.ROW-Spatial
         weights are standardized; each weight is divided by its
         row sum (the sum of the weights of all neighboring features).
     Distance_Band_or_Threshold_Distance {Double}:
         Specifies a cutoff distance for Inverse Distance and Fixed Distance
         options. Features outside the specified cutoff for a target feature
         are ignored in analyses for that feature. However, for Zone of
         Indifference, the influence of features outside the given distance is
         reduced with distance, while those inside the distance threshold are
         equally considered. The distance value entered should match that of
         the output coordinate system.For the Inverse Distance
         conceptualizations of spatial relationships,
         a value of 0 indicates that no threshold distance is applied; when
         this parameter is left blank, a default threshold value is computed
         and applied. This default value is the Euclidean distance that ensures
         every feature has at least one neighbor.This parameter has no effect
         when Polygon Contiguity or Get Spatial
         Weights From File spatial conceptualizations are selected.
     Weights_Matrix_File {File}:
         The path to a file containing weights that define spatial, and
         potentially temporal, relationships among features.
     Apply_False_Discovery_Rate__FDR__Correction {Boolean}:
         APPLY_FDR-Statistical significance will be based on the False
         Discovery Rate correction for a 95 percent confidence level.
         NO_FDR-Features with p-values less than 0.05 will appear in
         thefield reflecting statistically significant clusters or outliers at
         a 95 percent confidence level (default). COType
     Number_of_Permutations {Long}:
         The number of random permutations for the calculation of pseudo
         p-values. The default number of permutations is 499. If you choose 0
         permutations, the standard p-value is calculated.0-Permutations are
         not used and a standard p-value is
         calculated.99-With 99 permutations, the smallest possible pseudo
         p-value is 0.01
         and all other pseudo p-values will be multiples of this value.199-With
         199 permutations, the smallest possible pseudo p-value is
         0.005 and all other possible pseudo p-values will be multiples of this
         value.499-With 499 permutations, the smallest possible pseudo p-value
         is
         0.002 and all other pseudo p-values will be multiples of this
         value.999-With 999 permutations, the smallest possible pseudo p-value
         is
         0.001 and all other pseudo p-values will be multiples of this
         value.9999-With 9999 permutations, the smallest possible pseudo
         p-value is
         0.0001 and all other pseudo p-values will be multiples of this value.
     number_of_neighbors {Long}:
         The number of neighbors to include in the analysis.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         The output feature class to receive the results fields."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClustersOutliers_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Input_Field,
                        Output_Feature_Class,
                        Conceptualization_of_Spatial_Relationships,
                        Distance_Method,
                        Standardization,
                        Distance_Band_or_Threshold_Distance,
                        Weights_Matrix_File,
                        Apply_False_Discovery_Rate__FDR__Correction,
                        Number_of_Permutations,
                        number_of_neighbors,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DensityBasedClustering_stats", None)
def DensityBasedClustering(
    in_features=None,
    output_features=None,
    cluster_method: Literal["DBSCAN", "HDBSCAN", "OPTICS"] | None = None,
    min_features_cluster=None,
    search_distance=None,
    cluster_sensitivity=None,
    time_field=None,
    search_time_interval=None,
) -> Result1[str]:
    """DensityBasedClustering_stats(in_features, output_features, cluster_method, min_features_cluster, {search_distance}, {cluster_sensitivity}, {time_field}, {search_time_interval})

       Finds clusters of point features within surrounding noise based on
       their spatial distribution. Time can also be incorporated to find
       space-time clusters.

    INPUTS:
     in_features (Feature Layer):
         The point features for which density-based clustering will be
         performed.
     cluster_method (String):
         Specifies the method that will be used to define clusters.DBSCAN-A
         specified distance will be used to separate dense clusters
         from sparser noise. DBSCAN is the fastest of the clustering methods
         but is only appropriate if there is a clear distance to use that works
         well to define all clusters that may be present. This results in
         clusters that have similar densities.HDBSCAN-Varying distances will
         be used to separate clusters of
         varying densities from sparser noise. HDBSCAN is the most data-driven
         of the clustering methods and requires the least user input.OPTICS-The
         distance between neighbors and a reachability plot will be
         used to separate clusters of varying densities from noise. OPTICS
         offers the most flexibility in fine-tuning the clusters that are
         detected, though it is computationally intensive, particularly with a
         large search distance.
     min_features_cluster (Long):
         The minimum number of points that will be considered a cluster. Any
         cluster with fewer points than the number provided will be considered
         noise.
     search_distance {Linear Unit}:
         The maximum distance that will be considered.For the cluster_method
         parameter's DBSCAN option, the
         min_features_cluster parameter value must be found within this
         distance for cluster membership. Individual clusters will be separated
         by at least this distance. If a point is located farther than this
         distance from the next closest point in the cluster, it will not be
         included in the cluster.For the cluster_method parameter's OPTICS
         option, this parameter is
         optional and is used as the maximum search distance when creating the
         reachability plot. For OPTICS, the reachability plot, combined with
         the cluster_sensitivity parameter value, determines cluster
         membership. If no distance is specified, the tool will search all
         distances, which will increase processing time.If left blank, the
         default distance used will be the highest core
         distance found in the dataset, excluding those core distances in the
         top 1 percent (he most extreme core distances). If the time_field
         parameter value is provided, a search distance must be provided and
         does not include a default value.
     cluster_sensitivity {Long}:
         An integer between 0 and 100 that determines the compactness of
         clusters. A number close to 100 will result in a higher number of
         dense clusters. A number close to 0 will result in fewer, less compact
         clusters. If left blank, the tool will find a sensitivity value using
         the Kullback-Leibler divergence that finds the value in which adding
         more clusters does not add additional information.
     time_field {Field}:
         The field containing the time stamp for each record in the dataset.
         This field must be of type Date. If provided, the tool will find
         clusters of points that are close to each other in space and time. The
         search_time_interval parameter value must be provided to determine
         whether a point is close enough in time to a cluster to be included in
         the cluster.
     search_time_interval {Time Unit}:
         The time interval that will be used to determine whether points form a
         space-time cluster. The search time interval spans before and after
         the time of each point; for example, an interval of 3 days around a
         point will include all points starting 3 days before and ending 3 days
         after the time of the point.For the cluster_method parameter's DBSCAN
         option, the
         min_features_cluster value specified must be found within the search
         distance and the search time interval to be included in a cluster.For
         the cluster_method parameter's OPTICS option, all points outside
         of the search time interval will be excluded when calculating core
         distances, neighbor-distances, and reachability distances.The search
         time interval does not control the overall time span of the
         resulting space-time clusters. The time span of points within a
         cluster can be larger than the search time interval as long as each
         point has neighbors within the cluster that are within the search time
         interval.

    OUTPUTS:
     output_features (Feature Class):
         The output feature class that will receive the cluster results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DensityBasedClustering_stats(
                *gp_fixargs(
                    (
                        in_features,
                        output_features,
                        cluster_method,
                        min_features_cluster,
                        search_distance,
                        cluster_sensitivity,
                        time_field,
                        search_time_interval,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GroupingAnalysis_stats", None)
def GroupingAnalysis(
    Input_Features=None,
    Unique_ID_Field=None,
    Output_Feature_Class=None,
    Number_of_Groups=None,
    Analysis_Fields=None,
    Spatial_Constraints: Literal[
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "DELAUNAY_TRIANGULATION",
        "K_NEAREST_NEIGHBORS",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
        "NO_SPATIAL_CONSTRAINT",
    ]
    | None = None,
    Distance_Method: Literal["EUCLIDEAN", "MANHATTAN"] | None = None,
    Number_of_Neighbors=None,
    Weights_Matrix_File=None,
    Initialization_Method: Literal["FIND_SEED_LOCATIONS", "GET_SEEDS_FROM_FIELD", "USE_RANDOM_SEEDS"] | None = None,
    Initialization_Field=None,
    Output_Report_File=None,
    Evaluate_Optimal_Number_of_Groups: Literal["EVALUATE", "DO_NOT_EVALUATE"] | None = None,
) -> Result:
    """GroupingAnalysis_stats(Input_Features, Unique_ID_Field, Output_Feature_Class, Number_of_Groups, Analysis_Fields;Analysis_Fields..., Spatial_Constraints, {Distance_Method}, {Number_of_Neighbors}, {Weights_Matrix_File}, {Initialization_Method}, {Initialization_Field}, {Output_Report_File}, {Evaluate_Optimal_Number_of_Groups})

       Groups features based on feature attributes and optional spatial or
       temporal constraints.

    INPUTS:
     Input_Features (Feature Layer):
         The feature class or feature layer for which you want to create
         groups.
     Unique_ID_Field (Field):
         An integer field containing a different value for every
         feature in the input feature class. If you don't have a Unique ID
         field, you can create one by adding an integer field to your feature
         class table and calculating the field values to equal theorfield.
         FIDOBJECTID
     Number_of_Groups (Long):
         The number of groups to create. Theparameter will be disabled
         for more than 15 groups. Output Report
     Analysis_Fields (Field):
         A list of fields you want to use to distinguish one group from
         another. Theparameter will be disabled for more than 15 fields.
         Output Report
     Spatial_Constraints (String):
         Specifies if and how spatial relationships among features should
         constrain the groups created.CONTIGUITY_EDGES_ONLY-Groups contain
         contiguous polygon features. Only
         polygons that share an edge can be part of the same
         group.CONTIGUITY_EDGES_CORNERS-Groups contain contiguous polygon
         features.
         Only polygons that share an edge or a vertex can be part of the same
         group.DELAUNAY_TRIANGULATION-Features in the same group will have at
         least
         one natural neighbor in common with another feature in the group.
         Natural neighbor relationships are based on Delaunay Triangulation.
         Conceptually, Delaunay Triangulation creates a nonoverlapping mesh of
         triangles from feature centroids. Each feature is a triangle node and
         nodes that share edges are considered
         neighbors.K_NEAREST_NEIGHBORS-Features in the same group will be near
         each
         other; each feature will be a neighbor of at least one other feature
         in the group. Neighbor relationships are based on the nearest K
         features where you specify an Integer value, K, for the
         Number_of_Neighbors parameter.GET_SPATIAL_WEIGHTS_FROM_FILE-Spatial,
         and optionally temporal,
         relationships are defined by a spatial weights file (.swm). Create the
         spatial weights matrix file using the Generate Spatial Weights Matrix
         tool or the Generate Network Spatial Weights
         tool.NO_SPATIAL_CONSTRAINT-Features will be grouped using data space
         proximity only. Features do not have to be near each other in space or
         time to be part of the same group.
     Distance_Method {String}:
         Specifies how distances are calculated from each feature to
         neighboring features.EUCLIDEAN-The straight-line distance between two
         points (as the crow
         flies)MANHATTAN-The distance between two points measured along axes at
         right
         angles (city block); calculated by summing the (absolute) difference
         between the x- and y-coordinates
     Number_of_Neighbors {Long}:
         This parameter may be specified whenever the Spatial_Constraints
         parameter is K_NEAREST_NEIGHBORS or one of the contiguity methods
         (CONTIGUITY_EDGES_ONLY or CONTIGUITY_EDGES_CORNERS). The default
         number of neighbors is 8 and cannot be smaller than 2 for
         K_NEAREST_NEIGHBORS. This value reflects the exact number of nearest
         neighbor candidates to consider when building groups. A feature will
         not be included in a group unless one of the other features in that
         group is a K nearest neighbor. The default for CONTIGUITY_EDGES_ONLY
         and CONTIGUITY_EDGES_CORNERS is 0. For the contiguity methods, this
         value reflects the minimum number of neighbor candidates to consider.
         Additional nearby neighbors for features with less than the
         Number_of_Neighbors specified will be based on feature centroid
         proximity.
     Weights_Matrix_File {File}:
         The path to a file containing spatial weights that define spatial
         relationships among features.
     Initialization_Method {String}:
         Specifies how initial seeds are obtained when the Spatial_Constraint
         parameter selected is NO_SPATIAL_CONSTRAINT. Seeds are used to grow
         groups. If you indicate you want three groups, for example, the
         analysis will begin with three seeds.FIND_SEED_LOCATIONS-Seed features
         will be selected to optimize
         performance.GET_SEEDS_FROM_FIELD-Nonzero entries in the Initialization
         Field will
         be used as starting points to grow groups.USE_RANDOM_SEEDS-Initial
         seed features will be randomly selected.
     Initialization_Field {Field}:
         The numeric field identifying seed features. Features with a value of
         1 for this field will be used to grow groups.
     Evaluate_Optimal_Number_of_Groups {Boolean}:
         EVALUATE-Groupings from 2 to 15 will be evaluated.DO_NOT_EVALUATE-No
         evaluation of the number of groups will be
         performed. This is the default.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         The new output feature class created containing all features, the
         analysis fields specified, and a field indicating to which group each
         feature belongs.
     Output_Report_File {File}:
         The full path for the PDF report file to be created summarizing group
         characteristics. This report provides a number of graphs to help you
         compare the characteristics of each group. Creating the report file
         can add substantial processing time."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GroupingAnalysis_stats(
                *gp_fixargs(
                    (
                        Input_Features,
                        Unique_ID_Field,
                        Output_Feature_Class,
                        Number_of_Groups,
                        Analysis_Fields,
                        Spatial_Constraints,
                        Distance_Method,
                        Number_of_Neighbors,
                        Weights_Matrix_File,
                        Initialization_Method,
                        Initialization_Field,
                        Output_Report_File,
                        Evaluate_Optimal_Number_of_Groups,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("HotSpotAnalysisComparison_stats", None)
def HotSpotAnalysisComparison(
    in_hot_spot_1=None,
    in_hot_spot_2=None,
    out_features=None,
    num_neighbors=None,
    num_perms: Literal["99", "199", "499", "999", "9999"] | None = None,
    weighting_method: Literal["FUZZY", "EXACT_MATCH", "ABOVE_90", "ABOVE_95", "ABOVE_99", "CUSTOM", "TABLE", "REVERSE"]
    | None = None,
    similarity_weights=None,
    in_weights_table=None,
    exclude_nonsig_features: Literal["EXCLUDE", "NO_EXCLUDE"] | None = None,
) -> Result:
    """HotSpotAnalysisComparison_stats(in_hot_spot_1, in_hot_spot_2, out_features, {num_neighbors}, {num_perms}, {weighting_method}, {similarity_weights;similarity_weights...}, {in_weights_table}, {exclude_nonsig_features})

       Compares two hot spot analysis result layers and measures their
       similarity and association.

    INPUTS:
     in_hot_spot_1 (Feature Layer):
         The first hot spot analysis result layer.
     in_hot_spot_2 (Feature Layer):
         The second hot spot analysis result layer.
     num_neighbors {Long}:
         The number of neighbors around each feature that will be used for
         distance weighting. Distance weighting is one component of the overall
         similarity, and any features with matching significance levels within
         the neighborhood will be considered partial matches when calculating
         similarity and association.
     num_perms {Long}:
         The number of permutations that will be used to estimate the expected
         similarity and kappa values. A larger number of simulations will
         increase the precision of the estimates but will also increase
         calculation time.99-The analysis will use 99 permutations.199-The
         analysis will use 199
         permutations.499-The analysis will use 499 permutations. This is the
         default.999-The analysis will use 999 permutations.9999-The analysis
         will use 9,999 permutations.
     weighting_method {String}:
         Specifies how similarity weights between significance level categories
         will be defined. Similarity weights are numbers between 0 and 1 that
         define the categories of one result that are expected to match the
         categories of the other result. A value of 1 indicates that the
         categories will be considered exactly the same, and a value of 0
         indicates that the categories will be considered completely different.
         Values between 0 and 1 indicate degrees of partial similarity between
         the categories. For example, 99% significant hot spots can be
         considered perfectly similar to other 99% hot spots, partially similar
         to 95% hot spots, and completely dissimilar to 99% cold
         spots.FUZZY-Similarity weights will be fuzzy (nonbinary) and
         determined by
         the closeness of significance levels. For example, 99% significant hot
         spots will be perfectly similar to other 99% significant hot spots
         (weight = 1), but they will be partially similar to 95% significant
         hot spots (weight=0.71) and 90% significant hot spots (weight = 0.55).
         The weight between 95% significant and 90% significant is 0.78. All
         hot spots will be completely dissimilar to all cold spots and
         nonsignificant features (weight = 0). This is the
         default.EXACT_MATCH-Features must have the same significance level to
         be
         considered similar. For example, 99% significant hot spots will be
         considered completely dissimilar to 95% and 90% significant hot
         spots.ABOVE_90-Features that are 90%, 95%, and 99% significant hot
         spots
         will be considered perfectly similar to each other, and all features
         that are 90%, 95%, and 99% significant cold spots will be considered
         perfectly similar to each other. This option treats all features at or
         above 90% significance as being the same (statistically significant)
         and all features below 90% confidence as being the same
         (nonsignificant). This option is recommended when the hot spot
         analyses were performed at a 90% significance level.ABOVE_95-Features
         that are 95% and 99% significant hot (or cold) spots
         will be considered perfectly similar, and features that are 95% and
         99% significant cold spots will be considered perfectly similar. For
         example, 90% significant hot and cold spots will be considered
         completely dissimilar to higher significance levels. This option
         treats all features at or above 95% confidence as being the same
         (statistically significant) and all features below 95% confidence as
         being the same (nonsignificant). This option is recommended when the
         hot spot analyses were performed at a 95% significance
         level.ABOVE_99-Only features that are 99% significant hot (or cold)
         spots
         will be considered perfectly similar to each other. This option treats
         all features below 99% significance as being nonsignificant. This
         option is recommended when the hot spot analyses were performed at a
         99% significance level.CUSTOM-Custom similarity weights provided in
         the similarity_weights
         parameter will be used.TABLE-Similarity weights between significance
         levels will be defined
         by an input table. Provide the table in the in_weights_table
         parameter.REVERSE-The default fuzzy weights will be used, but hot
         spots of the
         first hot spot result will be considered similar to the cold spots of
         the second hot spot result. For example, 99% significant hot spots in
         one result will be considered perfectly similar to 99% cold spots in
         the other result and partially similar to 95% and 90% cold spots in
         the other result. This option is recommended when the hot spot
         analysis variables have a negative relationship. For example, you can
         measure how closely hot spots of infant mortality correspond to cold
         spots of healthcare access.
     similarity_weights {Value Table}:
         The custom similarity weights between significance level categories.
         The weights are values between 0 and 1 and indicate how similar to
         consider the two categories. A value of 0 indicates the categories are
         completely dissimilar, a value of 1 indicates the values are perfectly
         similar, and values between 0 and 1 indicate the categories are
         partially similar.
     in_weights_table {Table View}:
         The table containing custom similarity weights for each
         combination of hot spot significance level categories. The table must
         contain,, andfields. Provide the significance level categories of the
         pair (thefield values of the input layers) in the category fields and
         the similarity weight between them in the weight field. If a
         combination is not provided in the table, the weight for the
         combination is assumed to be 0. CATEGORY1CATEGORY2WEIGHTGi_Bin
     exclude_nonsig_features {Boolean}:
         Specifies whether pairs of features will be excluded from the
         comparisons if both hot spot results are nonsignificant. If excluded,
         conditional similarity and kappa values will be calculated that
         compare only the statistically significant hot and cold spots.
         Excluding features is recommended when you are interested only in
         whether the hot and cold spots of the input layers align, not whether
         the nonsignificant areas align, such as comparing whether hot and cold
         spots of median income correspond to hot and cold spots of food
         access.EXCLUDE-Nonsignificant features will be excluded, and the
         comparisons
         will be conditional on statistically significant hot and cold
         spots.NO_EXCLUDE-Nonsignificant features will be included. This is the
         default.If any significance level categories are assigned a similarity
         weight
         of 1 to the nonsignificant category (indicating that the category will
         be treated the same as the nonsignificant category), features with
         that category will also be excluded from comparisons if they are
         paired with another nonsignificant feature.

    OUTPUTS:
     out_features (Feature Class):
         The output feature class that will contain the local measures of
         similarity and association."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.HotSpotAnalysisComparison_stats(
                *gp_fixargs(
                    (
                        in_hot_spot_1,
                        in_hot_spot_2,
                        out_features,
                        num_neighbors,
                        num_perms,
                        weighting_method,
                        similarity_weights,
                        in_weights_table,
                        exclude_nonsig_features,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("HotSpots_stats", None)
def HotSpots(
    Input_Feature_Class=None,
    Input_Field=None,
    Output_Feature_Class=None,
    Conceptualization_of_Spatial_Relationships: Literal[
        "INVERSE_DISTANCE",
        "INVERSE_DISTANCE_SQUARED",
        "FIXED_DISTANCE_BAND",
        "ZONE_OF_INDIFFERENCE",
        "K_NEAREST_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    Distance_Method: Literal["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"] | None = None,
    Standardization: Literal["NONE", "ROW"] | None = None,
    Distance_Band_or_Threshold_Distance=None,
    Self_Potential_Field=None,
    Weights_Matrix_File=None,
    Apply_False_Discovery_Rate__FDR__Correction: Literal["APPLY_FDR", "NO_FDR"] | None = None,
    number_of_neighbors=None,
) -> Result:
    """HotSpots_stats(Input_Feature_Class, Input_Field, Output_Feature_Class, Conceptualization_of_Spatial_Relationships, Distance_Method, Standardization, {Distance_Band_or_Threshold_Distance}, {Self_Potential_Field}, {Weights_Matrix_File}, {Apply_False_Discovery_Rate__FDR__Correction}, {number_of_neighbors})

       Given a set of weighted features, identifies statistically significant
       hot spots and cold spots using the Getis-Ord Gi* statistic.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class for which hot spot analysis will be performed.
     Input_Field (Field):
         The numeric field (for example, number of victims, crime rate, test
         scores, and so on) to be evaluated.
     Conceptualization_of_Spatial_Relationships (String):
         Specifies how spatial relationships among features will be
         defined.INVERSE_DISTANCE-Nearby neighboring features will have a
         larger
         influence on the computations for a target feature than features that
         are far away.INVERSE_DISTANCE_SQUARED-This is the same as
         INVERSE_DISTANCE except
         that the slope is sharper, so influence will drop off more quickly,
         and only a target feature's closest neighbors will exert substantial
         influence on computations for that feature.FIXED_DISTANCE_BAND-Each
         feature will be analyzed within the context
         of neighboring features. Neighboring features inside the specified
         critical distance (Distance_Band_or_Threshold) will receive a weight
         of 1 and exert influence on computations for the target feature.
         Neighboring features outside the critical distance will receive a
         weight of 0 and have no influence on a target feature's
         computations.ZONE_OF_INDIFFERENCE-Features within the specified
         critical distance
         (Distance_Band_or_Threshold) of a target feature will receive a weight
         of 1 and influence computations for that feature. Once the critical
         distance is exceeded, weights (and the influence a neighboring feature
         has on target feature computations) will diminish with
         distance.K_NEAREST_NEIGHBORS-The closest k features will be included
         in the
         analysis; k is a specified numeric
         parameter.CONTIGUITY_EDGES_ONLY-Only neighboring polygon features that
         share a
         boundary or overlap will influence computations for the target polygon
         feature.CONTIGUITY_EDGES_CORNERS-Polygon features that share a
         boundary, share
         a node, or overlap will influence computations for the target polygon
         feature.GET_SPATIAL_WEIGHTS_FROM_FILE-Spatial relationships will be
         defined by
         a specified spatial weights file. The path to the spatial weights file
         is specified by the Weights_Matrix_File parameter.
     Distance_Method (String):
         Specifies how distances will be calculated from each feature to
         neighboring features.EUCLIDEAN_DISTANCE-The straight-line distance
         between two points (as
         the crow flies) will be used.MANHATTAN_DISTANCE-The distance between
         two points measured along axes
         at right angles (city block) calculated by summing the (absolute)
         difference between the x- and y-coordinates will be used.
     Standardization (String):
         Row standardization has no impact on this tool: Results from this tool
         would be identical with or without row standardization. This parameter
         is disabled; it remains only to support backward compatibility.NONE-No
         standardization of spatial weights is applied.ROW-No
         standardization of spatial weights is applied.
     Distance_Band_or_Threshold_Distance {Double}:
         The cutoff distance for the inverse distance and fixed distance
         options. Features outside the specified cutoff for a target feature
         will be ignored in analyses for that feature. However, for
         ZONE_OF_INDIFFERENCE, the influence of features outside the given
         distance will be reduced with distance, while those inside the
         distance threshold will be equally considered. The distance value
         provided should match that of the output coordinate system.For the
         inverse distance conceptualizations of spatial relationships,
         a value of 0 indicates that no threshold distance will be applied;
         when this parameter is left blank, a default threshold value will be
         computed and applied. The default value is the Euclidean distance,
         which ensures that every feature has at least one neighbor.This
         parameter has no effect when polygon contiguity
         (CONTIGUITY_EDGES_ONLY or CONTIGUITY_EDGES_CORNERS) or the
         GET_SPATIAL_WEIGHTS_FROM_FILE spatial conceptualization option is
         specified.
     Self_Potential_Field {Field}:
         The field representing self potential, which is the distance or weight
         between a feature and itself.
     Weights_Matrix_File {File}:
         The path to a file containing weights that define spatial, and
         potentially temporal, relationships among features.
     Apply_False_Discovery_Rate__FDR__Correction {Boolean}:
         Specifies whether statistical significance will be assessed based on
         the FDR correction.APPLY_FDR-Statistical significance will be based on
         the FDR
         correction.NO_FDR-Statistical significance will not be based on the
         FDR
         correction; it will be based on the p-value and z-score fields. This
         is the default.
     number_of_neighbors {Long}:
         An integer specifying the number of neighbors that will be included in
         the analysis.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         The output feature class that will receive the z-score and p-value
         results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.HotSpots_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Input_Field,
                        Output_Feature_Class,
                        Conceptualization_of_Spatial_Relationships,
                        Distance_Method,
                        Standardization,
                        Distance_Band_or_Threshold_Distance,
                        Self_Potential_Field,
                        Weights_Matrix_File,
                        Apply_False_Discovery_Rate__FDR__Correction,
                        number_of_neighbors,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MultivariateClustering_stats", None)
def MultivariateClustering(
    in_features=None,
    output_features=None,
    analysis_fields=None,
    clustering_method: Literal["K_MEANS", "K_MEDOIDS"] | None = None,
    initialization_method: Literal["OPTIMIZED_SEED_LOCATIONS", "USER_DEFINED_SEED_LOCATIONS", "RANDOM_SEED_LOCATIONS"]
    | None = None,
    initialization_field=None,
    number_of_clusters=None,
    output_table=None,
) -> Result2[str, str]:
    """MultivariateClustering_stats(in_features, output_features, analysis_fields;analysis_fields..., {clustering_method}, {initialization_method}, {initialization_field}, {number_of_clusters}, {output_table})

       Finds natural clusters of features based solely on feature attribute
       values.

    INPUTS:
     in_features (Feature Layer):
         The feature class or feature layer for which clusters will be created.
     analysis_fields (Field):
         A list of fields that will be used to distinguish one cluster from
         another.
     clustering_method {String}:
         Specifies the clustering algorithm that will be used.The K_MEANS and
         K_MEDOIDS options generally produce similar results.
         However, K_MEDOIDS is more robust to noise and outliers in the
         in_features parameter value. K_MEANS is generally faster than
         K_MEDOIDS and is recommended for large data sets.K_MEANS-The
         in_features parameter value will be clustered using the K
         means algorithm. This is the default.K_MEDOIDS-The in_features
         parameter value will be clustered using the
         K medoids algorithm.
     initialization_method {String}:
         Specifies how initial seeds to grow clusters are obtained. If you
         indicate you want three clusters, for example, the analysis will begin
         with three seeds.OPTIMIZED_SEED_LOCATIONS-Seed features will be
         selected to optimize
         analysis results and performance. This is the
         default.USER_DEFINED_SEED_LOCATIONS-Nonzero entries in the
         initialization_field parameter value will be used as starting points
         to grow clusters.RANDOM_SEED_LOCATIONS-Initial seed features will be
         randomly selected.
     initialization_field {Field}:
         The numeric field identifying seed features. Features with a value of
         1 for this field will be used to grow clusters. Each seed results in a
         cluster, so at least two seed features must be provided.
     number_of_clusters {Long}:
         The number of clusters that will be created. If you leave this
         parameter empty, the tool will evaluate the optimal number of clusters
         by computing a pseudo F-statistic for clustering solutions with 2
         through 30 clusters.This parameter is disabled if the seed locations
         were provided in an
         initialization field.

    OUTPUTS:
     output_features (Feature Class):
         The output feature class that will be created containing all features,
         the analysis fields specified, and a field indicating to which cluster
         each feature belongs.
     output_table {Table}:
         The table containing the pseudo F-statistic for clustering
         solutions 2 through 30, calculated to evaluate the optimal number of
         clusters. The chart created from this table can be accessed in the
         stand-alone tables section of thepane. Contents"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MultivariateClustering_stats(
                *gp_fixargs(
                    (
                        in_features,
                        output_features,
                        analysis_fields,
                        clustering_method,
                        initialization_method,
                        initialization_field,
                        number_of_clusters,
                        output_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OptimizedHotSpotAnalysis_stats", None)
def OptimizedHotSpotAnalysis(
    Input_Features=None,
    Output_Features=None,
    Analysis_Field=None,
    Incident_Data_Aggregation_Method: Literal[
        "COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS",
        "COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS",
        "COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS",
        "SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS",
    ]
    | None = None,
    Bounding_Polygons_Defining_Where_Incidents_Are_Possible=None,
    Polygons_For_Aggregating_Incidents_Into_Counts=None,
    Density_Surface=None,
    Cell_Size=None,
    Distance_Band=None,
) -> Result2[str, str]:
    """OptimizedHotSpotAnalysis_stats(Input_Features, Output_Features, {Analysis_Field}, {Incident_Data_Aggregation_Method}, {Bounding_Polygons_Defining_Where_Incidents_Are_Possible}, {Polygons_For_Aggregating_Incidents_Into_Counts}, {Density_Surface}, {Cell_Size}, {Distance_Band})

       Given incident points or weighted features (points or polygons),
       creates a map of statistically significant hot and cold spots using
       the Getis-Ord Gi* statistic. It evaluates the characteristics of the
       input feature class to produce optimal results.

    INPUTS:
     Input_Features (Feature Layer):
         The point or polygon feature class for which hot spot analysis will be
         performed.
     Analysis_Field {Field}:
         The numeric field (number of incidents, crime rates, test scores, and
         so on) to be evaluated.
     Incident_Data_Aggregation_Method {String}:
         The aggregation method to use to create weighted features for analysis
         from incident point data.COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS-A
         fishnet polygon mesh will
         overlay the incident point data and the number of incidents within
         each polygon cell will be counted. If no bounding polygon is provided
         in the Bounding_Polygons_Defining_Where_Incidents_Are_Possible
         parameter, only cells with at least one incident will be used in the
         analysis; otherwise, all cells within the bounding polygons will be
         analyzed.COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS-A hexagon polygon
         mesh will
         overlay the incident point data and the number of incidents within
         each polygon cell will be counted. If no bounding polygon is provided
         in the Bounding_Polygons_Defining_Where_Incidents_Are_Possible
         parameter, only cells with at least one incident will be used in the
         analysis; otherwise, all cells within the bounding polygons will be
         analyzed.COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS-You provide
         aggregation
         polygons to overlay the incident point data in the
         Polygons_For_Aggregating_Incidents_Into_Counts parameter. The
         incidents within each polygon are
         counted.SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS-Nearby
         incidents will
         be aggregated together to create a single weighted point. The weight
         for each point is the number of aggregated incidents at that location.
     Bounding_Polygons_Defining_Where_Incidents_Are_Possible {Feature Layer}:
         A polygon feature class defining where the incident Input_Features
         could possibly occur.
     Polygons_For_Aggregating_Incidents_Into_Counts {Feature Layer}:
         The polygons to use to aggregate the incident Input_Features in order
         to get an incident count for each polygon feature.
     Cell_Size {Linear Unit}:
         The size of the grid cells used to aggregate the Input_Features. When
         aggregating into a hexagon grid, this distance is used as the height
         to construct the hexagon polygons.
     Distance_Band {Linear Unit}:
         The spatial extent of the analysis neighborhood. This value determines
         which features are analyzed together in order to assess local
         clustering.

    OUTPUTS:
     Output_Features (Feature Class):
         The output feature class to receive the z-score, p-value, and Gi_Bin
         results.
     Density_Surface {Raster Dataset}:
         The Density_Surface parameter is disabled; it remains as a tool
         parameter only to support backwards compatibility. The Kernel Density
         tool can be used if you would like a density surface visualization of
         your weighted points."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OptimizedHotSpotAnalysis_stats(
                *gp_fixargs(
                    (
                        Input_Features,
                        Output_Features,
                        Analysis_Field,
                        Incident_Data_Aggregation_Method,
                        Bounding_Polygons_Defining_Where_Incidents_Are_Possible,
                        Polygons_For_Aggregating_Incidents_Into_Counts,
                        Density_Surface,
                        Cell_Size,
                        Distance_Band,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OptimizedOutlierAnalysis_stats", None)
def OptimizedOutlierAnalysis(
    Input_Features=None,
    Output_Features=None,
    Analysis_Field=None,
    Incident_Data_Aggregation_Method: Literal[
        "COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS",
        "COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS",
        "COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS",
        "SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS",
    ]
    | None = None,
    Bounding_Polygons_Defining_Where_Incidents_Are_Possible=None,
    Polygons_For_Aggregating_Incidents_Into_Counts=None,
    Performance_Adjustment: Literal["QUICK_199", "BALANCED_499", "ROBUST_999"] | None = None,
    Cell_Size=None,
    Distance_Band=None,
) -> Result1[str]:
    """OptimizedOutlierAnalysis_stats(Input_Features, Output_Features, {Analysis_Field}, {Incident_Data_Aggregation_Method}, {Bounding_Polygons_Defining_Where_Incidents_Are_Possible}, {Polygons_For_Aggregating_Incidents_Into_Counts}, {Performance_Adjustment}, {Cell_Size}, {Distance_Band})

       Given incident points or weighted features (points or polygons),
       creates a map of statistically significant hot spots, cold spots, and
       spatial outliers using the Anselin Local Moran's I statistic. It
       evaluates the characteristics of the input feature class to produce
       optimal results.

    INPUTS:
     Input_Features (Feature Layer):
         The point or polygon feature class for which the cluster and outlier
         analysis will be performed.
     Analysis_Field {Field}:
         The numeric field (number of incidents, crime rates, test scores, and
         so on) to be evaluated.
     Incident_Data_Aggregation_Method {String}:
         The aggregation method to use to create weighted features for analysis
         from incident point data.COUNT_INCIDENTS_WITHIN_FISHNET_POLYGONS-A
         fishnet polygon mesh will
         overlay the incident point data and the number of incidents within
         each polygon cell will be counted. If no bounding polygon is provided
         in the Bounding_Polygons_Defining_Where_Incidents_Are_Possible
         parameter, only cells with at least one incident will be used in the
         analysis; otherwise, all cells within the bounding polygons will be
         analyzed. This is the
         default.COUNT_INCIDENTS_WITHIN_HEXAGON_POLYGONS-A hexagon polygon mesh
         will
         overlay the incident point data and the number of incidents within
         each polygon cell will be counted. If no bounding polygon is provided
         in the Bounding_Polygons_Defining_Where_Incidents_Are_Possible
         parameter, only cells with at least one incident will be used in the
         analysis; otherwise, all cells within the bounding polygons will be
         analyzed.COUNT_INCIDENTS_WITHIN_AGGREGATION_POLYGONS-You provide
         aggregation
         polygons to overlay the incident point data in the
         Polygons_For_Aggregating_Incidents_Into_Counts parameter. The
         incidents within each polygon are
         counted.SNAP_NEARBY_INCIDENTS_TO_CREATE_WEIGHTED_POINTS-Nearby
         incidents will
         be aggregated together to create a single weighted point. The weight
         for each point is the number of aggregated incidents at that location.
     Bounding_Polygons_Defining_Where_Incidents_Are_Possible {Feature Layer}:
         A polygon feature class defining where the incident Input_Features
         could possibly occur.
     Polygons_For_Aggregating_Incidents_Into_Counts {Feature Layer}:
         The polygons to use to aggregate the incident Input_Features in order
         to get an incident count for each polygon feature.
     Performance_Adjustment {String}:
         This analysis utilizes permutations to create a reference
         distribution. Choosing the number of permutations is a balance between
         precision and increased processing time. Choose your preference for
         speed versus precision. More robust and precise results take longer to
         calculate.QUICK_199-With 199 permutations, the smallest possible
         pseudo p-value
         is 0.005 and all other pseudo p-values will be even multiples of this
         value.BALANCED_499-With 499 permutations, the smallest possible pseudo
         p-value is 0.002 and all other pseudo p-values will be even multiples
         of this value. This is the default.ROBUST_999-With 999 permutations,
         the smallest possible pseudo p-value
         is 0.001 and all other pseudo p-values will be even multiples of this
         value.
     Cell_Size {Linear Unit}:
         The size of the grid cells used to aggregate the Input_Features. When
         aggregating into a hexagon grid, this distance is used as the height
         to construct the hexagon polygons.
     Distance_Band {Linear Unit}:
         The spatial extent of the analysis neighborhood. This value determines
         which features are analyzed together in order to assess local
         clustering.

    OUTPUTS:
     Output_Features (Feature Class):
         The output feature class to receive the result fields."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OptimizedOutlierAnalysis_stats(
                *gp_fixargs(
                    (
                        Input_Features,
                        Output_Features,
                        Analysis_Field,
                        Incident_Data_Aggregation_Method,
                        Bounding_Polygons_Defining_Where_Incidents_Are_Possible,
                        Polygons_For_Aggregating_Incidents_Into_Counts,
                        Performance_Adjustment,
                        Cell_Size,
                        Distance_Band,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SimilaritySearch_stats", None)
def SimilaritySearch(
    Input_Features_To_Match=None,
    Candidate_Features=None,
    Output_Features=None,
    Collapse_Output_To_Points: Literal["COLLAPSE", "NO_COLLAPSE"] | None = None,
    Most_Or_Least_Similar: Literal["MOST_SIMILAR", "LEAST_SIMILAR", "BOTH"] | None = None,
    Match_Method: Literal["ATTRIBUTE_VALUES", "RANKED_ATTRIBUTE_VALUES", "ATTRIBUTE_PROFILES"] | None = None,
    Number_Of_Results=None,
    Attributes_Of_Interest=None,
    Fields_To_Append_To_Output=None,
) -> Result1[str]:
    """SimilaritySearch_stats(Input_Features_To_Match, Candidate_Features, Output_Features, Collapse_Output_To_Points, Most_Or_Least_Similar, Match_Method, Number_Of_Results, Attributes_Of_Interest;Attributes_Of_Interest..., {Fields_To_Append_To_Output;Fields_To_Append_To_Output...})

       Identifies which candidate features are most similar or most
       dissimilar to one or more input features based on feature attributes.

    INPUTS:
     Input_Features_To_Match (Feature Layer):
         The layer, or a selection on a layer, containing the features you want
         to match; you are searching for other features that look like these
         features. When more than one feature is provided, matching is based on
         attribute averages. When theandvalues are from a single
         dataset layer, you can do
         the following:         Input Features To MatchCandidate Features
         Copy the layer to thepane, making a duplicate layer.
         ContentsRename the duplicate layer. On the renamed layer,
         make a selection or set a definition
         query for the reference features you want to match. Use the new layer
         created for theparameter. Input Features To Match
         Apply a selection or set a definition query on the original
         layer so it excludes the reference features. This will be the layer to
         use for theparameter. Candidate Features
     Candidate_Features (Feature Layer):
         The layer, or a selection on a layer, containing candidate matching
         features. The tool will check for features most similar (or most
         dissimilar) to the Input_Features_To_Match values among these
         candidates.
     Collapse_Output_To_Points (Boolean):
         Specifies whether the geometry for the Output_Features parameter will
         be collapsed to points or will match the original geometry (lines or
         polygons) of the input features if the Input_Features_To_Match and
         Candidate_Features parameter values are both either lines or polygons.
         This parameter is only available with an Desktop Advanced license.
         Choosing COLLAPSE will improve tool performance for large line and
         polygon datasets.COLLAPSE-The line and polygon features will be
         represented as feature
         centroids (points).NO_COLLAPSE-The output geometry will match the line
         or polygon
         geometry of the input features. This is the default.
     Most_Or_Least_Similar (String):
         Specifies whether features that are most similar or most dissimilar to
         the Input_Features_To_Match values will be
         identified.MOST_SIMILAR-Features that are most similar will be
         identified. This
         is the default.LEAST_SIMILAR-Features that are most dissimilar will be
         identified.BOTH-Features that are most similar and features that are
         most
         dissimilar will both be identified.
     Match_Method (String):
         Specifies whether matching will be based on values, ranks, or cosine
         relationships. ATTRIBUTE_VALUES-Matching will be based on the
         sum of squared
         standardized attribute value differences for all of thevalues. This is
         the default. Attributes Of Interest
         RANKED_ATTRIBUTE_VALUES-Matching will be based on the sum of
         squared rank differences for all of thevalues. Attributes Of
         Interest         ATTRIBUTE_PROFILES-Matching will be computed as a
         function of
         cosine similarity for all of thevalues. Attributes Of Interest
     Number_Of_Results (Long):
         The number of solution matches to find. Entering zero or a number
         larger than the total number of Candidate_Features values will return
         rankings for all the candidate features. The default is 10.
     Attributes_Of_Interest (Field):
         The numeric attributes representing the matching criteria.
     Fields_To_Append_To_Output {Field}:
         The fields to include with the Output_Features parameter. These fields
         are not used to determine similarity; they are only included in the
         Output_Features parameter for reference.

    OUTPUTS:
     Output_Features (Feature Class):
         The output feature class containing a record for each of the
         Input_Features_To_Match values and for all the solution-matching
         features found."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SimilaritySearch_stats(
                *gp_fixargs(
                    (
                        Input_Features_To_Match,
                        Candidate_Features,
                        Output_Features,
                        Collapse_Output_To_Points,
                        Most_Or_Least_Similar,
                        Match_Method,
                        Number_Of_Results,
                        Attributes_Of_Interest,
                        Fields_To_Append_To_Output,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SpatialOutlierDetection_stats", None)
def SpatialOutlierDetection(
    in_features=None,
    output_features=None,
    n_neighbors=None,
    percent_outlier=None,
    output_raster=None,
    outlier_type: Literal["GLOBAL", "LOCAL"] | None = None,
    sensitivity: Literal["LOW", "MEDIUM", "HIGH"] | None = None,
    keep_type: Literal["KEEP_OUTLIER", "KEEP_ALL"] | None = None,
) -> Result2[str, str]:
    """SpatialOutlierDetection_stats(in_features, output_features, {n_neighbors}, {percent_outlier}, {output_raster}, {outlier_type}, {sensitivity}, {keep_type})

       Identifies global or local spatial outliers in point features.

    INPUTS:
     in_features (Feature Layer):
         The point features that will be used to build the spatial outlier
         detection model. Each point will be classified as an outlier or inlier
         based on its local outlier factor.
     n_neighbors {Long}:
         The number of neighbors that will be used to detect spatial outliers
         for each input point.For local outlier detection, the value must be at
         least 2, and all
         features within the neighborhood will be used as neighbors. If no
         value is specified, a value is estimated at run time and is displayed
         as a geoprocessing message.For global outlier detection, only the
         farthest neighbor in the
         neighborhood will be used, and the default is 1 (the closest
         neighbor). For example, a value of 3 indicates that global outliers
         are detected using distances to the third nearest neighbor of each
         point.
     percent_outlier {Double}:
         The percent of locations that will be identified as spatial outliers
         by defining the threshold of the local outlier factor. If no value is
         specified, a value is estimated at run time and is displayed as a
         geoprocessing message. A maximum of 50 percent of the features can be
         identified as spatial outliers.
     outlier_type {String}:
         Specifies the type of outlier that will be detected. A global outlier
         is a point that is far away from all other points in the feature
         class. A local outlier is a point that is farther away from its
         neighbors than would be expected by the density of points in the
         surrounding area.GLOBAL-Global outliers of input points will be
         detected. This is the
         default.LOCAL-Local outliers of input points will be detected.
     sensitivity {String}:
         Specifies the sensitivity level that will be used to detect global
         outliers. The higher the sensitivity, the more points that will be
         detected as outliers.The sensitivity value will determine the
         threshold, and any point with
         a neighbor distance larger than this threshold will be identified as a
         global outlier. The thresholds are determined using the box plot rule,
         in which the threshold for high sensitivity is one interquartile range
         above the third quartile. For medium sensitivity, the threshold is 1.5
         interquartile ranges above the third quartile. For low sensitivity,
         the threshold is two interquartile ranges above the third
         quartile.LOW-Outliers will be detected using low sensitivity. This
         option will
         detect the fewest outliers.MEDIUM-Outliers will be detected using
         moderate sensitivity. This is
         the default.HIGH-Outliers will be detected using high sensitivity.
         This option
         will detect the most outliers.
     keep_type {Boolean}:
         Specifies whether the output features will contain all input features
         or only features identified as spatial outliers.KEEP_OUTLIER-The
         output features will only contain features identified
         as spatial outliers.KEEP_ALL-The output features will contain all
         input features. This is
         the default.

    OUTPUTS:
     output_features (Feature Class):
         The output feature class containing the local outlier factor for each
         input feature as well as an indicator of whether the point is a
         spatial outlier.
     output_raster {Raster Dataset}:
         The output raster containing the local outlier factors at each cell,
         which is calculated based on the spatial distribution of the input
         features.This parameter is only available with a Desktop Advanced
         license."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SpatialOutlierDetection_stats(
                *gp_fixargs(
                    (
                        in_features,
                        output_features,
                        n_neighbors,
                        percent_outlier,
                        output_raster,
                        outlier_type,
                        sensitivity,
                        keep_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SpatiallyConstrainedMultivariateClustering_stats", None)
def SpatiallyConstrainedMultivariateClustering(
    in_features=None,
    output_features=None,
    analysis_fields=None,
    size_constraints: Literal["NONE", "NUM_FEATURES", "ATTRIBUTE_VALUE"] | None = None,
    constraint_field=None,
    min_constraint=None,
    max_constraint=None,
    number_of_clusters=None,
    spatial_constraints: Literal[
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "TRIMMED_DELAUNAY_TRIANGULATION",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    weights_matrix_file=None,
    number_of_permutations: Literal["0", "100", "200", "500", "1000"] | None = None,
    output_table=None,
) -> Result2[str, str]:
    """SpatiallyConstrainedMultivariateClustering_stats(in_features, output_features, analysis_fields;analysis_fields..., {size_constraints}, {constraint_field}, {min_constraint}, {max_constraint}, {number_of_clusters}, {spatial_constraints}, {weights_matrix_file}, {number_of_permutations}, {output_table})

       Finds spatially contiguous clusters of features based on a set of
       feature attribute values and optional cluster size limits.

    INPUTS:
     in_features (Feature Layer):
         The feature class or feature layer for which you want to create
         clusters.
     analysis_fields (Field):
         A list of fields that will be used to distinguish one cluster from
         another.
     size_constraints {String}:
         Specifies cluster size based on number of features per group or a
         target attribute value per group.NONE-No cluster size constraints will
         be used. This is the
         default.NUM_FEATURES-A minimum and maximum number of features per
         group will
         be used.ATTRIBUTE_VALUE-A minimum and maximum attribute value per
         group will
         be used.
     constraint_field {Field}:
         The attribute value to be summed per cluster.
     min_constraint {Double}:
         The minimum number of features per cluster or the minimum attribute
         value per cluster. This must be a positive value.
     max_constraint {Double}:
         The maximum number of features per cluster or the maximum attribute
         value per cluster. If a maximum constraint is set, the
         number_of_clusters parameter is disabled. This must be a positive
         value.
     number_of_clusters {Long}:
         The number of clusters to create. If this parameter is empty, the tool
         will evaluate the optimal number of clusters by computing a pseudo
         F-statistic value for clustering solutions with 2 through 30
         clusters.This parameter will be disabled if a maximum number of
         features or
         maximum attribute value has been set.
     spatial_constraints {String}:
         Specifies how spatial relationships among features will be
         defined.CONTIGUITY_EDGES_ONLY-Clusters will contain contiguous polygon
         features. Only polygons that share an edge can be part of the same
         cluster.CONTIGUITY_EDGES_CORNERS-Clusters will contain contiguous
         polygon
         features. Only polygons that share an edge or a vertex can be part of
         the same cluster. This is the default for polygon
         features.TRIMMED_DELAUNAY_TRIANGULATION-Features in the same cluster
         will have
         at least one natural neighbor in common with another feature in the
         cluster. Natural neighbor relationships are based on a trimmed
         Delaunay triangulation. Conceptually, Delaunay triangulation creates a
         nonoverlapping mesh of triangles from feature centroids. Each feature
         is a triangle node, and nodes that share edges are considered
         neighbors. These triangles are then clipped to a convex hull to ensure
         that features cannot be neighbors with any features outside the convex
         hull. This is the default for point
         features.GET_SPATIAL_WEIGHTS_FROM_FILE-Spatial, and optionally
         temporal,
         relationships are defined by a specified spatial weights file (.swm).
         Create the spatial weights matrix using the Generate Spatial Weights
         Matrix or Generate Network Spatial Weights tool. The path to the
         spatial weights file is specified by the Weights_Matrix_File
         parameter.
     weights_matrix_file {File}:
         The path to a file containing spatial weights that define spatial, and
         potentially temporal, relationships among features.
     number_of_permutations {Long}:
         The number of random permutations for the calculation of membership
         stability scores. If 0 (zero) is chosen, probabilities will not be
         calculated. Calculating these probabilities uses permutations of
         random spanning trees and evidence accumulation. This
         calculation can take a significant time to run for larger
         datasets. It is recommended that you iterate and find the optimal
         number of clusters for your analysis first; then calculate
         probabilities for your analysis in a subsequent run. Setting
         theEnvironment setting to 50 may improve the run time of the tool.
         Parallel Processing Factor

    OUTPUTS:
     output_features (Feature Class):
         The new output feature class created containing all features, the
         analysis fields specified, and a field indicating to which cluster
         each feature belongs.
     output_table {Table}:
         The table created containing the results of the F-statistic
         values calculated to evaluate the optimal number of clusters. The
         chart created from this table can be accessed in thepane under the
         output feature layer. Contents"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SpatiallyConstrainedMultivariateClustering_stats(
                *gp_fixargs(
                    (
                        in_features,
                        output_features,
                        analysis_fields,
                        size_constraints,
                        constraint_field,
                        min_constraint,
                        max_constraint,
                        number_of_clusters,
                        spatial_constraints,
                        weights_matrix_file,
                        number_of_permutations,
                        output_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Measuring Geographic Distributions toolset
@gptooldoc("CentralFeature_stats", None)
def CentralFeature(
    Input_Feature_Class=None,
    Output_Feature_Class=None,
    Distance_Method: Literal["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"] | None = None,
    Weight_Field=None,
    Self_Potential_Weight_Field=None,
    Case_Field=None,
) -> Result1[str]:
    """CentralFeature_stats(Input_Feature_Class, Output_Feature_Class, Distance_Method, {Weight_Field}, {Self_Potential_Weight_Field}, {Case_Field})

       Identifies the most centrally located feature in a point, line, or
       polygon feature class.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class containing a distribution of features from which to
         identify the most centrally located feature.
     Distance_Method (String):
         Specifies how distances are calculated from each feature to
         neighboring features.EUCLIDEAN_DISTANCE-The straight-line distance
         between two points (as
         the crow flies)MANHATTAN_DISTANCE-The distance between two points
         measured along axes
         at right angles (city block); calculated by summing the (absolute)
         difference between the x- and y-coordinates
     Weight_Field {Field}:
         The numeric field used to weight distances in the origin-destination
         distance matrix.
     Self_Potential_Weight_Field {Field}:
         The field representing self-potential-the distance or weight between a
         feature and itself.
     Case_Field {Field}:
         Field used to group features for separate central feature
         computations. The case field can be of integer, date, or string type.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         The feature class that will contain the most centrally located
         feature in the. Input Feature Class"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CentralFeature_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Output_Feature_Class,
                        Distance_Method,
                        Weight_Field,
                        Self_Potential_Weight_Field,
                        Case_Field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DirectionalDistribution_stats", None)
def DirectionalDistribution(
    Input_Feature_Class=None,
    Output_Ellipse_Feature_Class=None,
    Ellipse_Size: Literal["1_STANDARD_DEVIATION", "2_STANDARD_DEVIATIONS", "3_STANDARD_DEVIATIONS"] | None = None,
    Weight_Field=None,
    Case_Field=None,
) -> Result1[str]:
    """DirectionalDistribution_stats(Input_Feature_Class, Output_Ellipse_Feature_Class, Ellipse_Size, {Weight_Field}, {Case_Field})

       Creates standard deviational ellipses or ellipsoids to summarize the
       spatial characteristics of geographic features: central tendency,
       dispersion, and directional trends.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         A feature class containing a distribution of features for which the
         standard deviational ellipse or ellipsoid will be calculated.
     Ellipse_Size (String):
         The size of output ellipses in standard deviations. The default
         ellipse size is 1; valid choices are 1, 2, or 3 standard
         deviations.1_STANDARD_DEVIATION-1 standard
         deviation2_STANDARD_DEVIATIONS-2
         standard deviations3_STANDARD_DEVIATIONS-3 standard deviations
     Weight_Field {Field}:
         The numeric field used to weight locations according to their relative
         importance.
     Case_Field {Field}:
         The field used to group features for separate directional distribution
         calculations. The case field can be of integer, date, or string type.

    OUTPUTS:
     Output_Ellipse_Feature_Class (Feature Class):
         A polygon feature class that will contain the output ellipse feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DirectionalDistribution_stats(
                *gp_fixargs(
                    (Input_Feature_Class, Output_Ellipse_Feature_Class, Ellipse_Size, Weight_Field, Case_Field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DirectionalMean_stats", None)
def DirectionalMean(
    Input_Feature_Class=None,
    Output_Feature_Class=None,
    Orientation_Only: Literal["ORIENTATION_ONLY", "DIRECTION"] | None = None,
    Case_Field=None,
) -> Result1[str]:
    """DirectionalMean_stats(Input_Feature_Class, Output_Feature_Class, Orientation_Only, {Case_Field})

       Identifies the mean direction, length, and geographic center for a set
       of lines.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class containing vectors for which the mean direction will
         be calculated.
     Orientation_Only (Boolean):
         Specifies whether to include direction (From and To nodes) information
         in the analysis.DIRECTION-The From and To nodes are utilized in
         calculating the mean.
         This is the default.ORIENTATION_ONLY-The From and To node information
         is ignored.
     Case_Field {Field}:
         Field used to group features for separate directional mean
         calculations. The case field can be of integer, date, or string type.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         A line feature class that will contain the features representing the
         mean directions of the input feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DirectionalMean_stats(
                *gp_fixargs((Input_Feature_Class, Output_Feature_Class, Orientation_Only, Case_Field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DirectionalTrend_stats", None)
def DirectionalTrend(
    in_features=None,
    analysis_field=None,
    direction=None,
    determine_direction: Literal["DETERMINE_DIRECTION", "NO_DETERMINE_DIRECTION"] | None = None,
    order: Literal["1", "2", "3", "4", "5", "6"] | None = None,
) -> Result1[str | Layer]:
    """DirectionalTrend_stats(in_features, analysis_field, {direction}, {determine_direction}, {order})

       Creates a scatter plot chart on a feature layer displaying the trend
       of data values in a particular direction.

    INPUTS:
     in_features (Feature Layer):
         The input feature layer that will be used to calculate the directional
         trend. The input must be point or polygon features. For polygons, the
         centroids of the polygons will be used to create the chart.
     analysis_field (Field):
         The numeric field from the input feature layer that will be used to
         calculate the directional trend.
     direction {Double}:
         The direction of the trend. Provide the value as degrees clockwise
         from north. For example, 0 corresponds to north, 90 to east, 180 to
         south, and 270 to west. The value must be between 0 and 360. The
         default is 0. This parameter does not apply if you choose to determine
         the direction of strongest trend.The direction will generally not
         correspond to true cardinal
         directions. For example, 0 corresponds to the direction of the
         y-coordinates of the features, which may not be true north.
     determine_direction {Boolean}:
         Specifies whether the direction of the strongest trend will be
         determined by the tool. The direction of strongest trend is determined
         by finding the direction that maximizes the R-squared value for the
         provided polynomial order. If you specify DETERMINE_DIRECTION, the
         value will be rounded to a whole number.DETERMINE_DIRECTION-The
         direction of strongest trend will be
         determined by the tool.NO_DETERMINE_DIRECTION-The direction of trend
         will be the direction
         parameter value. This is the default.
     order {Long}:
         Specifies the order of the polynomial that will be fitted to the data
         values.1-First order (linear) polynomial will be used.2-Second order
         (quadratic) polynomial will be used.3-Third order (cubic) polynomial
         will be used.4-Fourth order (quartic) polynomial will be used.5-Fifth
         order (quintic) polynomial will be used.6-Sixth order (sextic)
         polynomial will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DirectionalTrend_stats(
                *gp_fixargs((in_features, analysis_field, direction, determine_direction, order), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MeanCenter_stats", None)
def MeanCenter(
    Input_Feature_Class=None,
    Output_Feature_Class=None,
    Weight_Field=None,
    Case_Field=None,
    Dimension_Field=None,
) -> Result1[str]:
    """MeanCenter_stats(Input_Feature_Class, Output_Feature_Class, {Weight_Field}, {Case_Field}, {Dimension_Field})

       Identifies the geographic center (or the center of concentration) for
       a set of features.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         A feature class for which the mean center will be calculated.
     Weight_Field {Field}:
         The numeric field used to create a weighted mean center.
     Case_Field {Field}:
         Field used to group features for separate mean center calculations.
         The case field can be of integer, date, or string type.
     Dimension_Field {Field}:
         A numeric field containing attribute values from which an average
         value will be calculated.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         A point feature class that will contain the features representing the
         mean centers of the input feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MeanCenter_stats(
                *gp_fixargs(
                    (Input_Feature_Class, Output_Feature_Class, Weight_Field, Case_Field, Dimension_Field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MedianCenter_stats", None)
def MedianCenter(
    Input_Feature_Class=None,
    Output_Feature_Class=None,
    Weight_Field=None,
    Case_Field=None,
    Attribute_Field=None,
) -> Result1[str]:
    """MedianCenter_stats(Input_Feature_Class, Output_Feature_Class, {Weight_Field}, {Case_Field}, {Attribute_Field;Attribute_Field...})

       Identifies the location that minimizes overall Euclidean distance to
       the features in a dataset.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         A feature class for which the median center will be calculated.
     Weight_Field {Field}:
         The numeric field used to create a weighted median center.
     Case_Field {Field}:
         Field used to group features for separate median center calculations.
         The case field can be of integer, date, or string type.
     Attribute_Field {Field}:
         Numeric field(s) for which the data median value will be computed.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         A point feature class that will contain the features representing the
         median centers of the input feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MedianCenter_stats(
                *gp_fixargs(
                    (Input_Feature_Class, Output_Feature_Class, Weight_Field, Case_Field, Attribute_Field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NeighborhoodSummaryStatistics_stats", None)
def NeighborhoodSummaryStatistics(
    in_features=None,
    output_features=None,
    analysis_fields=None,
    local_summary_statistic: Literal["ALL", "MEAN", "MEDIAN", "STD_DEV", "IQR", "SKEWNESS", "QUANTILE_IMBALANCE"]
    | None = None,
    include_focal_feature: Literal["INCLUDE_FOCAL", "EXCLUDE_FOCAL"] | None = None,
    ignore_nulls: Literal["IGNORE_NULLS", "INCLUDE_NULLS"] | None = None,
    neighborhood_type: Literal[
        "DISTANCE_BAND",
        "NUMBER_OF_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "DELAUNAY_TRIANGULATION",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    distance_band=None,
    number_of_neighbors=None,
    weights_matrix_file=None,
    local_weighting_scheme: Literal["UNWEIGHTED", "BISQUARE", "GAUSSIAN"] | None = None,
    kernel_bandwidth=None,
) -> Result1[str]:
    """NeighborhoodSummaryStatistics_stats(in_features, output_features, {analysis_fields;analysis_fields...}, {local_summary_statistic}, {include_focal_feature}, {ignore_nulls}, {neighborhood_type}, {distance_band}, {number_of_neighbors}, {weights_matrix_file}, {local_weighting_scheme}, {kernel_bandwidth})

       Calculates summary statistics of one or more numeric fields using
       local neighborhoods around each feature. The local statistics include
       mean (average), median, standard deviation, interquartile range,
       skewness, and quantile imbalance. All statistics can be geographically
       weighted using kernels to give more influence to neighbors closer to
       the focal feature. Various neighborhood types can be used, including
       distance band, number of neighbors, polygon contiguity, Delaunay
       triangulation, and spatial weights matrix files (.swm). Summary
       statistics are also calculated for the distances to the neighbors of
       each feature.

    INPUTS:
     in_features (Feature Layer):
         The point or polygon features that will be used to calculate the local
         statistics.
     analysis_fields {Field}:
         One or more fields that will be used to calculate local statistics. If
         no analysis fields are provided, only local statistics based on
         distances to neighbors will be calculated.
     local_summary_statistic {String}:
         Specifies the local summary statistic that will be calculated for each
         analysis field.ALL-All local statistics will be calculated. This is
         the
         default.MEAN-The local mean (average) will be calculated.MEDIAN-The
         local median will be calculated.STD_DEV-The local standard deviation
         will be calculated.IQR-The local interquartile range will be
         calculated.SKEWNESS-The local skewness will be
         calculated.QUANTILE_IMBALANCE-The local quantile imbalance will be
         calculated.
     include_focal_feature {Boolean}:
         Specifies whether the focal feature will be included when calculating
         local statistics for each feature.INCLUDE_FOCAL-The focal feature and
         all of its neighbors will be
         included when calculating local statistics. This is the
         default.EXCLUDE_FOCAL-The focal feature will not be included when
         calculating
         local statistics. Only neighbors of the feature will be included.
     ignore_nulls {Boolean}:
         Specifies whether null values in the analysis fields will be included
         or ignored in the calculations.IGNORE_NULLS-Null values will be
         ignored in the local
         calculations.INCLUDE_NULLS-Null values will be included in the local
         calculations.
     neighborhood_type {String}:
         Specifies which features will be included as neighbors. To calculate
         local statistics, neighboring features must be identified for each
         input feature, and these neighbors are used to calculate the local
         statistics for each feature. Theoption is only available with a
         Desktop Advanced license.
         Delaunay triangulationDISTANCE_BAND-Features within a specified
         critical distance of each
         feature will be included as neighbors.NUMBER_OF_NEIGHBORS-The closest
         features will be included as
         neighbors.CONTIGUITY_EDGES_ONLY-Polygon features that share an edge
         will be
         included as neighbors.CONTIGUITY_EDGES_CORNERS-Polygon features that
         share an edge or a
         corner will be included as neighbors. This is the default for polygon
         features.DELAUNAY_TRIANGULATION-Features whose Delaunay triangulation
         share an
         edge will be included as neighbors. This is the default for point
         features.GET_SPATIAL_WEIGHTS_FROM_FILE-Neighbors and weights will be
         defined
         by a specified spatial weights file.
     distance_band {Linear Unit}:
         All features within this distance will be included as neighbors. If no
         value is provided, one will be estimated during processing and
         included as a geoprocessing message. If the specified distance results
         in more than 1,000 neighbors, only the closest 1,000 features will be
         included as neighbors.
     number_of_neighbors {Long}:
         The number of neighbors that will be included for each local
         calculation. The number does not include the focal feature. If the
         focal feature is included in calculations, one additional neighbor
         will be used. The default is 8.
     weights_matrix_file {File}:
         The path and file name of the spatial weights matrix file that defines
         spatial, and potentially temporal, relationships among features.
     local_weighting_scheme {String}:
         Specifies the weighting scheme that will be applied to neighbors when
         calculating local statistics.UNWEIGHTED-Neighbors will not be
         weighted. This is the
         default.BISQUARE-Neighbors will be weighted using a bisquare kernel
         scheme.GAUSSIAN-Neighbors will be weighted using a Gaussian kernel
         scheme.
     kernel_bandwidth {Linear Unit}:
         The bandwidth of the bisquare or Gaussian local weighting schemes. If
         no value is provided, one will be estimated during processing and
         included as a geoprocessing message.

    OUTPUTS:
     output_features (Feature Class):
         The output feature class containing the local statistics as fields.
         Each statistic of each analysis field will be stored as an individual
         field."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NeighborhoodSummaryStatistics_stats(
                *gp_fixargs(
                    (
                        in_features,
                        output_features,
                        analysis_fields,
                        local_summary_statistic,
                        include_focal_feature,
                        ignore_nulls,
                        neighborhood_type,
                        distance_band,
                        number_of_neighbors,
                        weights_matrix_file,
                        local_weighting_scheme,
                        kernel_bandwidth,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("StandardDistance_stats", None)
def StandardDistance(
    Input_Feature_Class=None,
    Output_Standard_Distance_Feature_Class=None,
    Circle_Size: Literal["1_STANDARD_DEVIATION", "2_STANDARD_DEVIATIONS", "3_STANDARD_DEVIATIONS"] | None = None,
    Weight_Field=None,
    Case_Field=None,
) -> Result1[str]:
    """StandardDistance_stats(Input_Feature_Class, Output_Standard_Distance_Feature_Class, Circle_Size, {Weight_Field}, {Case_Field})

       Measures the degree to which features are concentrated or dispersed
       around the geometric mean center.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         A feature class containing a distribution of features for which the
         standard distance will be calculated.
     Circle_Size (String):
         Specifies the size of output circles in standard
         deviations.1_STANDARD_DEVIATION-The output circles will be 1 standard
         deviation.
         This is the default.2_STANDARD_DEVIATIONS-The output circles will be 2
         standard
         deviations.3_STANDARD_DEVIATIONS-The output circles will be 3 standard
         deviations.
     Weight_Field {Field}:
         The numeric field used to weight locations according to their relative
         importance.
     Case_Field {Field}:
         The field used to group features for separate standard distance
         calculations. The case field can be of integer, date, or string type.

    OUTPUTS:
     Output_Standard_Distance_Feature_Class (Feature Class):
         A polygon feature class that will contain a circle polygon for each
         input center. These circle polygons graphically portray the standard
         distance at each center point."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.StandardDistance_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Output_Standard_Distance_Feature_Class,
                        Circle_Size,
                        Weight_Field,
                        Case_Field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Modeling Spatial Relationships toolset
@gptooldoc("BivariateSpatialAssociation_stats", None)
def BivariateSpatialAssociation(
    in_features=None,
    analysis_field1=None,
    analysis_field2=None,
    out_features=None,
    neighborhood_type: Literal[
        "DISTANCE_BAND",
        "K_NEAREST_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "DELAUNAY_TRIANGULATION",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    distance_band=None,
    num_neighbors=None,
    weights_matrix_file=None,
    local_weighting_scheme: Literal["UNWEIGHTED", "BISQUARE"] | None = None,
    kernel_bandwidth=None,
    num_permutations: Literal["99", "199", "499", "999", "4999", "9999"] | None = None,
) -> Result:
    """BivariateSpatialAssociation_stats(in_features, analysis_field1, analysis_field2, out_features, {neighborhood_type}, {distance_band}, {num_neighbors}, {weights_matrix_file}, {local_weighting_scheme}, {kernel_bandwidth}, {num_permutations})

       Calculates the spatial association between two continuous variables
       using the Lee's L statistic.

    INPUTS:
     in_features (Feature Layer):
         The input features containing the fields of the two analysis
         variables.
     analysis_field1 (Field):
         The field of the first analysis variable. The field must be numeric.
     analysis_field2 (Field):
         The field of the second analysis variable. The field must be numeric.
     neighborhood_type {String}:
         Specifies how neighbors of each feature will be determined. The
         feature is always included in the neighborhood, and all neighborhood
         weights are normalized to sum to 1.DISTANCE_BAND-Features within a
         specified critical distance of each
         feature will be included as neighbors. This is the default for point
         features.K_NEAREST_NEIGHBORS-The closest k features will be included
         as
         neighbors.CONTIGUITY_EDGES_ONLY-Polygon features that share an edge
         will be
         included as neighbors.CONTIGUITY_EDGES_CORNERS-Polygon features that
         share an edge or
         corner will be included as neighbors. This is the default for polygon
         features.DELAUNAY_TRIANGULATION-Points whose Delaunay triangulation
         (Thiessen
         polygons) share an edge or corner will be included as
         neighbors.GET_SPATIAL_WEIGHTS_FROM_FILE-Neighbors and weights will be
         defined by
         a spatial weights file.
     distance_band {Linear Unit}:
         The distance band that will be used to determine neighbors around the
         focal feature. If no value is provided, the distance will be the
         shortest distance such that each feature has at least one other
         neighbor in its neighborhood. For polygons, the distance between
         centroids will be used to determine neighbors.
     num_neighbors {Long}:
         The number of neighbors around each feature that will be included as
         neighbors. The value does not include the feature. For example,
         specifying 6 will use the feature and its six closest neighbors (seven
         features total). The default is 8. The value must be at least 2.
     weights_matrix_file {File}:
         The path and file name of the spatial weights matrix file that defines
         the neighbors and weights between features.
     local_weighting_scheme {String}:
         Specifies the weighting scheme that will be applied to neighbors when
         calculating spatial associations.UNWEIGHTED-Neighbors will not be
         weighted. This is the
         default.BISQUARE-Neighbors will be weighted using a bisquare (quartic)
         kernel.
     kernel_bandwidth {Linear Unit}:
         The bandwidth for the bisquare kernel. The bandwidth defines how
         quickly the weights decrease with distance. Larger bandwidths will
         provide comparatively larger weights to neighbors that are farther
         away from the feature. For the k nearest neighbors neighborhood, the
         default value (empty) will use an adaptive bandwidth equal to the
         distance to the (k+1)th neighbor of the focal feature. For the fixed
         distance band neighborhood, the default (empty) will use the same
         value as the distance band.
     num_permutations {Long}:
         Specifies the number of permutations that will be used to create
         reference distributions when calculating global and local p-values.
         All p-values are calculated using two-sided hypothesis tests.99-The
         analysis will use 99 permutations. With 99 permutations, the
         smallest possible p-value is 0.02, and all other p-values will be
         multiples of this value.199-The analysis will use 199 permutations.
         With 199 permutations, the
         smallest possible p-value is 0.01, and all other p-values will be
         multiples of this value.499-The analysis will use 499 permutations.
         With 499 permutations, the
         smallest possible p-value is 0.004, and all other p-values will be
         multiples of this value.999-The analysis will use 999 permutations.
         With 999 permutations, the
         smallest possible p-value is 0.002, and all other p-values will be
         multiples of this value. This option is recommended for 90 percent
         confidence tests. This is the default.4999-The analysis will use 4,999
         permutations. With 4,999
         permutations, the smallest possible p-value is 0.0004, and all other
         p-values will be multiples of this value. This option is recommended
         for 95 percent confidence tests.9999-The analysis will use 9,999
         permutations. With 9,999
         permutations, the smallest possible p-value is 0.0002, and all other
         p-values will be multiples of this value. This option is recommended
         for 99 percent confidence tests.

    OUTPUTS:
     out_features (Feature Class):
         The output features containing the local Lee's L statistics, spatial
         association categories, p-values, and the weighted averages of the
         neighbors of each feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.BivariateSpatialAssociation_stats(
                *gp_fixargs(
                    (
                        in_features,
                        analysis_field1,
                        analysis_field2,
                        out_features,
                        neighborhood_type,
                        distance_band,
                        num_neighbors,
                        weights_matrix_file,
                        local_weighting_scheme,
                        kernel_bandwidth,
                        num_permutations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CausalInferenceAnalysis_stats", None)
def CausalInferenceAnalysis(
    in_features=None,
    outcome_field=None,
    exposure_field=None,
    confounding_variables=None,
    out_features=None,
    ps_method: Literal["REGRESSION", "GRADIENT_BOOSTING"] | None = None,
    balancing_method: Literal["MATCHING", "WEIGHTING"] | None = None,
    enable_erf_popups: Literal["CREATE_POPUP", "NO_POPUP"] | None = None,
    out_erf_table=None,
    target_outcomes=None,
    target_exposures=None,
    lower_exp_trim=None,
    upper_exp_trim=None,
    lower_ps_trim=None,
    upper_ps_trim=None,
    num_bins=None,
    scale=None,
    balance_type: Literal["MEAN", "MEDIAN", "MAXIMUM"] | None = None,
    balance_threshold=None,
    bw_method: Literal["PLUG_IN", "CV", "MANUAL"] | None = None,
    bandwidth=None,
    create_bootstrap_ci: Literal["CREATE_CI", "NO_CI"] | None = None,
) -> Result2[str, str]:
    """CausalInferenceAnalysis_stats(in_features, outcome_field, exposure_field, confounding_variables;confounding_variables..., out_features, {ps_method}, {balancing_method}, {enable_erf_popups}, {out_erf_table}, {target_outcomes;target_outcomes...}, {target_exposures;target_exposures...}, {lower_exp_trim}, {upper_exp_trim}, {lower_ps_trim}, {upper_ps_trim}, {num_bins}, {scale}, {balance_type}, {balance_threshold}, {bw_method}, {bandwidth}, {create_bootstrap_ci})

       Estimates the causal effect of a continuous exposure variable on a
       continuous outcome variable by approximating a randomized experiment
       and controlling for confounding variables.

    INPUTS:
     in_features (Table View):
         The input features or table containing fields of the exposure,
         outcome, and confounding variables.
     outcome_field (Field):
         The numeric field of the outcome variable. This is the variable that
         responds to changes in the exposure variable. The outcome variable
         must be continuous or binary (not categorical).
     exposure_field (Field):
         The numeric field of the exposure variable (sometimes called the
         treatment variable). This is the variable that causes changes in the
         outcome variable. The exposure variable must be continuous (not binary
         or categorical).
     confounding_variables (Value Table):
         The fields of the confounding variables. These are the variables that
         are related to both the exposure and outcome variables, and they must
         be balanced in order to estimate the causal effect between the
         exposure and outcome variables. The confounding variables can be
         continuous, categorical, or binary. Text fields must be categorical,
         integer fields can be either categorical or continuous, and other
         numeric fields must be continuous.For the exposure-response function
         to be unbiased, all variables that
         are related to the exposure and outcome variables must be included as
         confounding variables.
     ps_method {String}:
         Specifies the method that will be used for calculating the propensity
         scores of each observation.The propensity score of an observation is
         the likelihood (or
         probability) of receiving the observed exposure value, given the
         values of the confounding variables. Large propensity scores mean that
         the exposure is common for individuals with the associated confounding
         variables, and low propensity scores mean that the exposure value is
         uncommon for individuals with the confounding variables. For example,
         if an individual has high blood pressure (exposure) but has no risk
         factors for high blood pressure (confounders), this individual would
         have a low propensity score because it is uncommon to have high blood
         pressure without any risk factors. Conversely, high blood pressure for
         an individual with many risk factors would have a larger propensity
         score because it is more common.Propensity scores are estimated by a
         statistical model that predicts
         the exposure variable using the confounding variables as explanatory
         variables. You can use an OLS regression model or a machine learning
         model that uses gradient boosted regression trees. It is recommended
         that you first use regression and only use gradient boosting if
         regression fails to balance the confounding variables.REGRESSION-OLS
         regression will be used to estimate the propensity
         scores. This is the default.GRADIENT_BOOSTING-Gradient boosted
         regression trees will be used to
         estimate the propensity scores.
     balancing_method {String}:
         Specifies the method that will be used for balancing the confounding
         variables.Each method estimates a set of balancing weights that
         removes the
         correlation between the confounding variables and the exposure
         variable. It is recommended that you first use matching and only use
         inverse propensity score weighting if matching fails to balance the
         confounding variables. Inverse propensity score weighting will
         calculate faster than propensity score matching, so it also
         recommended when the calculation time of matching is not feasible for
         the data.MATCHING-Propensity score matching will be used to balance
         the
         confounding variables. This is the default.WEIGHTING-Inverse
         propensity score weighting will be used to balance
         the confounding variables.
     enable_erf_popups {Boolean}:
         Specifies whether pop-up charts that display the local ERF for the
         observation will be created for each observation.CREATE_POPUP-Local
         ERF pop-up charts will be created on the output
         features or table.NO_POPUP-Local ERF pop-up charts will not be created
         on the output
         features or table. This is the default.
     target_outcomes {Double}:
         A list of target outcome values from which required changes in
         exposure to achieve the outcomes will be calculated for each
         observation. For example, if the exposure variable is an air quality
         index and the outcome variable is the annual asthma hospitalization
         rate of counties, you can determine how much the air quality index
         needs to decrease to achieve asthma hospitalization rates below 0.01,
         0.005, and 0.001. For each provided target outcome value, two new
         fields will be created on the output. The first field contains the
         exposure value that would result in the target outcome, and the second
         field contains the required change in the exposure variable to produce
         the target outcome (positive values indicate that the exposure needs
         to increase, and negative values indicate that the exposure needs to
         decrease). In some cases, there will be no solution for some
         observations, so you should only provide target outcomes that are
         feasible to achieve by changing the exposure variable. For example,
         there is no PM2.5 level that can result in an asthma hospitalization
         rate of zero, so using a target outcome equal to zero will result in
         no solutions. If there are multiple exposure values that would result
         in the target outcome, the one that requires the smallest change in
         exposure will be used.If an output exposure-response function table is
         created, it will
         include any target outcome values and the associated exposure values
         appended to the end of the table. If there are multiple solutions,
         multiple records will be appended to the table with repeated outcome
         values.If local ERF pop-up charts are created, the target outcomes and
         associated exposure values will be shown in the pop-ups of each
         observation.
     target_exposures {Double}:
         A list of target exposure values that will be used to calculate new
         outcomes for each observation. For each target exposure value, the
         tool estimates the new outcome value that the observation would
         receive if its exposure variable was changed to the target exposure.
         For example, if the exposure variable is an air quality index and the
         outcome variable is the annual asthma hospitalization rate of
         counties, you can estimate how the hospitalization rate for each
         observation would change for different levels of air quality. For each
         provided target exposure value, two new fields will be created on the
         output. The first field contains the estimated outcome value if the
         observation received the target exposure, and the second field
         contains the estimated change in the outcome variable (positive values
         indicate that the outcome variable will increase, and negative values
         indicate that the outcome variable will decrease). The target
         exposures must be within the range of the exposure variable after
         trimming.If an output exposure-response function table is created, it
         will
         include any target exposure values and the associated response values
         appended to the end of the table.If local ERF pop-up charts are
         created, the target exposure values and
         associated outcomes will be shown in the pop-ups of each feature.
     lower_exp_trim {Double}:
         The lower quantile that will be used to trim the exposure variable.
         Any observations with exposure values below this quantile will be
         excluded from the analysis before estimating propensity scores. The
         value must be between 0 and 1. The default is 0.01, meaning that the
         bottom 1 percent of exposure values will be trimmed. It is recommended
         that you trim some of the lowest exposure values to improve the
         estimation of propensity scores.
     upper_exp_trim {Double}:
         The upper quantile that will be used to trim the exposure variable.
         Any observations with exposure values above this quantile will be
         excluded from the analysis before estimating propensity scores. The
         value must be between 0 and 1. The default is 0.99, meaning that the
         top 1 percent of exposure values will be trimmed. It is recommended
         that you trim some of the highest exposure values to improve the
         estimation of propensity scores.
     lower_ps_trim {Double}:
         The lower quantile that will be used to trim the propensity scores.
         Any observations with propensity scores below this quantile will be
         excluded from the analysis before performing propensity score matching
         or inverse propensity score weighting. The value must be between 0 and
         1. The default is 0, meaning that no trimming will be performed.Lower
         propensity score trimming is often needed when using inverse
         propensity score weighting. Propensity scores near zero can produce
         large and unstable balancing weights.
     upper_ps_trim {Double}:
         The upper quantile that will be used to trim the propensity scores.
         Any observations with propensity scores above this quantile will be
         excluded from the analysis before performing propensity score matching
         or inverse propensity score weighting. The value must be between 0 and
         1. The default is 1, meaning that no trimming will be performed.
     num_bins {Long}:
         The number of exposure bins that will be used for propensity score
         matching. In matching, the exposure variable is divided into evenly
         spaced bins (equal intervals), and matching is performed within each
         bin. At least two exposure bins are required, and it is recommended
         that at least five exposure values be included within each bin. If no
         value is provided, the value will be estimated while the tool runs and
         displayed in the messages.
     scale {Double}:
         The relative weight (sometimes called the scale) of the propensity
         score to the exposure variable that will be used when performing
         propensity score matching. Within each exposure bin, matches are
         determined using the differences in the propensity scores and in the
         values of the exposure variable. This parameter specifies how to
         prioritize each criteria. For example, a value equal to 0.5 means that
         the propensity score and exposure variables are given equal weight
         when finding matching observations.If no value is provided, the value
         will be estimated while the tool
         runs and displayed in the messages. The value that will provide the
         best balance is difficult to predict, so it is recommended that you
         allow the tool to estimate the value. Providing a manual value can be
         used to reduce the calculation time or to reproduce prior results. If
         the resulting exposure-response function shows vertical bands of
         observations with large weights, increasing the relative weight may
         provide a more realistic and accurate exposure-response function.
     balance_type {String}:
         Specifies the method that will be used to determine whether the
         confounding variables are balanced. After estimating weights with
         propensity score matching or inverse propensity score weighting,
         weighted correlations are calculated for each confounding variable. If
         the mean, median, or maximum absolute correlation is less than the
         balance threshold, the confounding variables are considered balanced,
         meaning they are sufficiently uncorrelated with the exposure
         variable.MEAN-Confounding variables will be considered balanced if the
         mean
         absolute correlation is less than the balance threshold. This is the
         default.MEDIAN-Confounding variables will be considered balanced if
         the median
         absolute correlation is less than the balance
         threshold.MAXIMUM-Confounding variables will be considered balanced if
         the
         maximum absolute correlation is less than the balance threshold.
     balance_threshold {Double}:
         The threshold value that will be compared to the weighted correlations
         of the confounding variables to determine if they are balanced. The
         value must be between 0 and 1. A larger balance threshold indicates a
         larger tolerance for imbalance in the confounding variables and bias
         in the exposure-response function. The default is 0.1.
     bw_method {String}:
         Specifies the method that will be used to estimate the bandwidth of
         the exposure-response function.PLUG_IN-A plug-in method will be used
         to estimate the bandwidth. This
         is the default.CV-The bandwidth that minimizes the mean square cross
         validation error
         will be used.MANUAL-A custom bandwidth will be used.
     bandwidth {Double}:
         The bandwidth value of the exposure-response function when using a
         manual bandwidth.
     create_bootstrap_ci {Boolean}:
         Specifies whether 95 percent confidence intervals for the exposure-
         response function will be created using M-out-of-N
         bootstrapping.CREATE_CI-Confidence intervals for the exposure-response
         function will
         be created.NO_CI-Confidence intervals for the exposure-response
         function will not
         be created. This is the default.

    OUTPUTS:
     out_features (Feature Class / Table):
         The output features or table containing the propensity scores,
         balancing weights, and a field indicating whether the feature was
         trimmed (excluded from the analysis). The exposure, outcome, and
         confounding variables are also included.
     out_erf_table {Table}:
         A table containing values of the exposure-response function. The table
         will contain 200 evenly spaced exposure values between the minimum and
         maximum exposure (after trimming) along with the estimated response
         from the exposure-response function. The response field represents the
         average value of the outcome variable if all members of the population
         received the associated exposure value. If bootstrapped confidence
         intervals are created, additional fields will be created containing
         the upper and lower bounds of the confidence interval for the exposure
         value, as well as the standard deviation and number of samples used to
         construct the confidence interval. If any target outcome or exposure
         values are provided, they will be appended to the end of the table."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CausalInferenceAnalysis_stats(
                *gp_fixargs(
                    (
                        in_features,
                        outcome_field,
                        exposure_field,
                        confounding_variables,
                        out_features,
                        ps_method,
                        balancing_method,
                        enable_erf_popups,
                        out_erf_table,
                        target_outcomes,
                        target_exposures,
                        lower_exp_trim,
                        upper_exp_trim,
                        lower_ps_trim,
                        upper_ps_trim,
                        num_bins,
                        scale,
                        balance_type,
                        balance_threshold,
                        bw_method,
                        bandwidth,
                        create_bootstrap_ci,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ColocationAnalysis_stats", None)
def ColocationAnalysis(
    input_type: Literal["SINGLE_DATASET", "DATASETS_WITHOUT_CATEGORIES", "TWO_DATASETS"] | None = None,
    in_features_of_interest=None,
    output_features=None,
    field_of_interest=None,
    time_field_of_interest=None,
    category_of_interest=None,
    input_feature_for_comparison=None,
    field_for_comparison=None,
    time_field_for_comparison=None,
    category_for_comparison=None,
    neighborhood_type: Literal["K_NEAREST_NEIGHBORS", "DISTANCE_BAND", "GET_SPATIAL_WEIGHTS_FROM_FILE"] | None = None,
    number_of_neighbors=None,
    distance_band=None,
    weights_matrix_file=None,
    temporal_relationship_type: Literal["BEFORE", "AFTER", "SPAN"] | None = None,
    time_step_interval=None,
    number_of_permutations: Literal["99", "199", "499", "999", "9999"] | None = None,
    local_weighting_scheme: Literal["BISQUARE", "GAUSSIAN", "NONE"] | None = None,
    output_table=None,
) -> Result2[str, str]:
    """ColocationAnalysis_stats(input_type, in_features_of_interest, output_features, {field_of_interest}, {time_field_of_interest}, {category_of_interest}, {input_feature_for_comparison}, {field_for_comparison}, {time_field_for_comparison}, {category_for_comparison}, {neighborhood_type}, {number_of_neighbors}, {distance_band}, {weights_matrix_file}, {temporal_relationship_type}, {time_step_interval}, {number_of_permutations}, {local_weighting_scheme}, {output_table})

       Measures local patterns of spatial association, or colocation, between
       two categories of point features using the colocation quotient
       statistic.

    INPUTS:
     input_type (String):
         Specifies whether the in_features_of_interest parameter values will
         come from the same dataset with specified categories, different
         datasets with specified categories, or different datasets that will be
         treated as their own category (for example, one dataset with all
         points representing cheetahs and a second dataset in which all points
         represent gazelles).SINGLE_DATASET-The categories to be analyzed exist
         in a field in a
         single dataset.TWO_DATASETS-The categories to be analyzed exist in
         fields of separate
         datasets.DATASETS_WITHOUT_CATEGORIES-Two separate datasets
         representing two
         categories will be analyzed.
     in_features_of_interest (Feature Layer):
         The feature class containing points with representative categories.
     field_of_interest {Field}:
         The field containing the category or categories to be analyzed.
     time_field_of_interest {Field}:
         A date field with an optional time stamp for each feature to analyze
         points using a space-time window. Features near each other in space
         and time will be considered neighbors and will be analyzed together.
     category_of_interest {String}:
         The base category for the analysis. The tool will identify, for each
         category_of_interest value, the degree to which the base category is
         attracted to or colocated with the neighboring_category parameter
         value.
     input_feature_for_comparison {Feature Layer}:
         The input feature class containing the points with the categories that
         will be compared.
     field_for_comparison {Field}:
         The field from the input_feature_for_comparison parameter containing
         the category to be compared.
     time_field_for_comparison {Field}:
         A date field with a time stamp for each feature to analyze your points
         using a space-time window. Features near each other in space and time
         will be considered neighbors and will be analyzed together.
     category_for_comparison {String}:
         The neighboring category for the analysis. The tool will identify the
         degree to which the category_of_interest parameter value is attracted
         to or isolated from the category_for_comparison value.
     neighborhood_type {String}:
         Specifies how the spatial relationships among features will be
         defined.DISTANCE_BAND-Each feature will be analyzed within the context
         of
         neighboring features. Neighboring features inside the specified
         critical distance specified by the distance_band parameter receive a
         weight of one and exert influence on computations for the target
         feature. Neighboring features outside the critical distance receive a
         weight of zero and have no influence on a target feature's
         computations.K_NEAREST_NEIGHBORS-The closest k features will be
         included in the
         analysis as neighbors. The number of neighbors is specified by the
         number_of_neighbors parameter. The neighbor's influence in the
         analysis is weighted based on the distance to the farthest neighbor.
         This is the default.GET_SPATIAL_WEIGHTS_FROM_FILE-When SINGLE_DATASET
         is used as the
         input_type, spatial relationships will be defined by a specified
         spatial weights matrix file. The neighbor's influence in the analysis
         is weighted based on the distance to the farthest neighbor. The path
         to the spatial weights file is specified by the weights_matrix_file
         parameter.
     number_of_neighbors {Long}:
         The number of neighbors around each feature that will be used to test
         for local relationships between categories. If no value is provided,
         the default of 8 is used. The provided value must be large enough to
         detect the relationships between features but small enough to still
         identify local patterns.
     distance_band {Linear Unit}:
         The neighborhood size is a constant or fixed distance for each
         feature. All features within this distance will be used to test for
         local relationships between categories. If no value is provided, the
         distance used will be the average distance at which each feature has
         at least eight neighbors.
     weights_matrix_file {File}:
         The path to a file containing weights that define spatial, and
         potentially temporal, relationships among features.
     temporal_relationship_type {String}:
         Specifies how temporal relationships among features will be
         defined.BEFORE-The time window will extend back in time for each of
         the
         in_features_of_interest values. Neighboring features must have a
         date/time stamp that occurs before the date/time stamp of the feature
         of interest to be included in the analysis. This is the
         default.AFTER-The time window will extend forward in time for each of
         the
         in_features_of_interest values. Neighboring features must have a
         date/time stamp that occurs after the date/time stamp of the feature
         of interest to be included in the analysis.SPAN-The time window will
         extend both back and forward in time for
         each of the in_features_of_interest values. Neighboring features that
         have a date/time stamp that occurs within the time_step_interval value
         before or after the date/time stamp of the feature of interest will be
         included in the analysis. For example, if the time_step_interval
         parameter is set to 1 week, the window will look 1 week before and 1
         week after the target feature.
     time_step_interval {Time Unit}:
         An integer and unit of measurement representing the number of time
         units composing the time window.
     number_of_permutations {Long}:
         The number of permutations that will be used to create a reference
         distribution. Choosing the number of permutations is a balance between
         precision and increased processing time. Choose your preference of
         speed versus precision. More robust and precise results take longer to
         calculate.99-The analysis will use 99 permutations. With 99
         permutations, the
         smallest possible pseudo p-value is 0.02 and all other pseudo p-values
         will be multiples of this value. This is the default.199-The analysis
         will use 199 permutations. With 199 permutations, the
         smallest possible pseudo p-value is 0.01 and all other pseudo p-values
         will be even multiples of this value.499-The analysis will use 499
         permutations. With 499 permutations, the
         smallest possible pseudo p-value is 0.004 and all other pseudo
         p-values will be even multiples of this value.999-The analysis will
         use 999 permutations. With 999 permutations, the
         smallest possible pseudo p-value is 0.002 and all other pseudo
         p-values will be even multiples of this value.9999-The analysis will
         use 9,999 permutations. With 9,999
         permutations, the smallest possible pseudo p-value is 0.0002 and all
         other pseudo p-values will be even multiples of this value.
     local_weighting_scheme {String}:
         Specifies the kernel type that will be used to provide the spatial
         weighting. The kernel defines how each feature is related to other
         features within its neighborhood.BISQUARE-Features will be weighted
         based on the distance to the
         farthest neighbor or the edge of the distance band, and a weight of 0
         will be assigned to any feature outside the neighborhood specified.
         GAUSSIAN-Features will be weighted based on the distance to
         the farthest neighbor or the edge of the distance band but drop off
         more quickly than theoption. A weight of 0 will be assigned to any
         feature outside the neighborhood specified. This is the default.
         BisquareNONE-No weighting scheme will be applied, and all features
         within the
         neighborhood will be given a weight of 1 and contribute equally. All
         features outside the neighborhood will be given a weight of 0.

    OUTPUTS:
     output_features (Feature Class):
         The output feature class containing all the in_features parameter
         values with fields representing the local colocation quotient scores
         and p-values.
     output_table {Table}:
         A table that includes the global colocation quotients between
         all the categories in theparameter and all the categories in
         theparameter. This table can help you determine the local categories
         to analyze. Field of InterestField Containing Neighboring
         Category        Ifis used as theparameter value, global colocation
         quotients
         will be calculated for each dataset and between each dataset.
         Datasets without categoriesInput Type"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ColocationAnalysis_stats(
                *gp_fixargs(
                    (
                        input_type,
                        in_features_of_interest,
                        output_features,
                        field_of_interest,
                        time_field_of_interest,
                        category_of_interest,
                        input_feature_for_comparison,
                        field_for_comparison,
                        time_field_for_comparison,
                        category_for_comparison,
                        neighborhood_type,
                        number_of_neighbors,
                        distance_band,
                        weights_matrix_file,
                        temporal_relationship_type,
                        time_step_interval,
                        number_of_permutations,
                        local_weighting_scheme,
                        output_table,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExploratoryRegression_stats", None)
def ExploratoryRegression(
    Input_Features=None,
    Dependent_Variable=None,
    Candidate_Explanatory_Variables=None,
    Weights_Matrix_File=None,
    Output_Report_File=None,
    Output_Results_Table=None,
    Maximum_Number_of_Explanatory_Variables=None,
    Minimum_Number_of_Explanatory_Variables=None,
    Minimum_Acceptable_Adj_R_Squared=None,
    Maximum_Coefficient_p_value_Cutoff=None,
    Maximum_VIF_Value_Cutoff=None,
    Minimum_Acceptable_Jarque_Bera_p_value=None,
    Minimum_Acceptable_Spatial_Autocorrelation_p_value=None,
) -> Result2[str, str]:
    """ExploratoryRegression_stats(Input_Features, Dependent_Variable, Candidate_Explanatory_Variables;Candidate_Explanatory_Variables..., {Weights_Matrix_File}, {Output_Report_File}, {Output_Results_Table}, {Maximum_Number_of_Explanatory_Variables}, {Minimum_Number_of_Explanatory_Variables}, {Minimum_Acceptable_Adj_R_Squared}, {Maximum_Coefficient_p_value_Cutoff}, {Maximum_VIF_Value_Cutoff}, {Minimum_Acceptable_Jarque_Bera_p_value}, {Minimum_Acceptable_Spatial_Autocorrelation_p_value})

       Evaluates all possible combinations of the input candidate explanatory
       variables, looking for OLS models that best explain the dependent
       variable within the context of user-specified criteria.

    INPUTS:
     Input_Features (Feature Layer):
         The feature class or feature layer containing the dependent and
         candidate explanatory variables to analyze.
     Dependent_Variable (Field):
         The numeric field containing the observed values you want to model
         using OLS.
     Candidate_Explanatory_Variables (Field):
         A list of fields to try as OLS model explanatory variables.
     Weights_Matrix_File {File}:
         A file containing spatial weights that define the spatial
         relationships among your input features. This file is used to assess
         spatial autocorrelation among regression residuals. You can use the
         Generate Spatial Weights Matrix File tool to create this. When you do
         not provide a spatial weights matrix file, residuals are assessed for
         spatial autocorrelation based on each feature's 8 nearest
         neighbors.Note: The spatial weights matrix file is only used to
         analyze spatial
         structure in model residuals; it is not used to build or to calibrate
         any of the OLS models.
     Maximum_Number_of_Explanatory_Variables {Long}:
         All models with explanatory variables up to the value entered here
         will be assessed. If, for example, the
         Minimum_Number_of_Explanatory_Variables is 2 and the
         Maximum_Number_of_Explanatory_Variables is 3, the Exploratory
         Regression tool will try all models with every combination of two
         explanatory variables, and all models with every combination of three
         explanatory variables.
     Minimum_Number_of_Explanatory_Variables {Long}:
         This value represents the minimum number of explanatory variables for
         models evaluated. If, for example, the
         Minimum_Number_of_Explanatory_Variables is 2 and the
         Maximum_Number_of_Explanatory_Variables is 3, the Exploratory
         Regression tool will try all models with every combination of two
         explanatory variables, and all models with every combination of three
         explanatory variables.
     Minimum_Acceptable_Adj_R_Squared {Double}:
         This is the lowest Adjusted R-Squared value you consider a passing
         model. If a model passes all of your other search criteria, but has an
         Adjusted R-Squared value smaller than the value entered here, it will
         not show up as a Passing Model in the Output_Report_File. Valid values
         for this parameter range from 0.0 to 1.0. The default value is 0.5,
         indicating that passing models will explain at least fifty percent of
         the variation in the dependent variable.
     Maximum_Coefficient_p_value_Cutoff {Double}:
         For each model evaluated, OLS computes explanatory variable
         coefficient p-values. The cutoff p-value you enter here represents the
         confidence level you require for all coefficients in the model in
         order to consider the model passing. Small p-values reflect a stronger
         confidence level. Valid values for this parameter range from 1.0 down
         to 0.0, but will most likely be 0.1, 0.05, 0.01, 0.001, and so on. The
         default value is 0.05, indicating passing models will only contain
         explanatory variables whose coefficients are statistically at the 95
         percent confidence level (p-values smaller than 0.05). To relax this
         default you would enter a larger p-value cutoff, such as 0.1. If you
         are getting lots of passing models, you will likely want to make this
         search criteria more stringent by decreasing the default p-value
         cutoff from 0.05 to 0.01 or smaller.
     Maximum_VIF_Value_Cutoff {Double}:
         This value reflects how much redundancy (multicollinearity) among
         model explanatory variables you will tolerate. When the VIF (Variance
         Inflation Factor) value is higher than about 7.5, multicollinearity
         can make a model unstable; consequently, 7.5 is the default value
         here. If you want your passing models to have less redundancy, you
         would enter a smaller value, such as 5.0, for this parameter.
     Minimum_Acceptable_Jarque_Bera_p_value {Double}:
         The p-value returned by the Jarque-Bera diagnostic test indicates
         whether the model residuals are normally distributed. If the p-value
         is statistically significant (small), the model residuals are not
         normal and the model is biased. Passing models should have large
         Jarque-Bera p-values. The default minimum acceptable p-value is 0.1.
         Only models returning p-values larger than this minimum will be
         considered passing. If you are having trouble finding unbiased passing
         models, and decide to relax this criterion, you might enter a smaller
         minimum p-value such as 0.05.
     Minimum_Acceptable_Spatial_Autocorrelation_p_value {Double}:
         For models that pass all of the other search criteria, the Exploratory
         Regression tool will check model residuals for spatial clustering
         using Global Moran's I. When the p-value for this diagnostic test is
         statistically significant (small), it indicates the model is very
         likely missing key explanatory variables (it isn't telling the whole
         story). Unfortunately, if you have spatial autocorrelation in your
         regression residuals, your model is misspecified, so you cannot trust
         your results. Passing models should have large p-values for this
         diagnostic test. The default minimum p-value is 0.1. Only models
         returning p-values larger than this minimum will be considered
         passing. If you are having trouble finding properly specified models
         because of this diagnostic test, and decide to relax this search
         criteria, you might enter a smaller minimum such as 0.05.

    OUTPUTS:
     Output_Report_File {File}:
         The report file contains tool results, including details about any
         models found that passed all the search criteria you entered. This
         output file also contains diagnostics to help you fix common
         regression problems in the case that you don't find any passing
         models.
     Output_Results_Table {Table}:
         The optional output table created containing the explanatory variables
         and diagnostics for all of the models within the Coefficient p-value
         and VIF value cutoffs."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExploratoryRegression_stats(
                *gp_fixargs(
                    (
                        Input_Features,
                        Dependent_Variable,
                        Candidate_Explanatory_Variables,
                        Weights_Matrix_File,
                        Output_Report_File,
                        Output_Results_Table,
                        Maximum_Number_of_Explanatory_Variables,
                        Minimum_Number_of_Explanatory_Variables,
                        Minimum_Acceptable_Adj_R_Squared,
                        Maximum_Coefficient_p_value_Cutoff,
                        Maximum_VIF_Value_Cutoff,
                        Minimum_Acceptable_Jarque_Bera_p_value,
                        Minimum_Acceptable_Spatial_Autocorrelation_p_value,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Forest_stats", None)
def Forest(
    prediction_type: Literal["TRAIN", "PREDICT_FEATURES", "PREDICT_RASTER"] | None = None,
    in_features=None,
    variable_predict=None,
    treat_variable_as_categorical: Literal["CATEGORICAL", "NUMERIC"] | None = None,
    explanatory_variables=None,
    distance_features=None,
    explanatory_rasters=None,
    features_to_predict=None,
    output_features=None,
    output_raster=None,
    explanatory_variable_matching=None,
    explanatory_distance_matching=None,
    explanatory_rasters_matching=None,
    output_trained_features=None,
    output_importance_table=None,
    use_raster_values: Literal["TRUE", "FALSE"] | None = None,
    number_of_trees=None,
    minimum_leaf_size=None,
    maximum_depth=None,
    sample_size=None,
    random_variables=None,
    percentage_for_training=None,
    output_classification_table=None,
    output_validation_table=None,
    compensate_sparse_categories: Literal["TRUE", "FALSE"] | None = None,
    number_validation_runs=None,
    calculate_uncertainty: Literal["TRUE", "FALSE"] | None = None,
    output_trained_model=None,
    model_type: Literal["FOREST-BASED", "GRADIENT_BOOSTED"] | None = None,
    reg_lambda=None,
    gamma=None,
    eta=None,
    max_bins=None,
    optimize: Literal["TRUE", "FALSE"] | None = None,
    optimize_algorithm: Literal["RANDOM", "RANDOM_ROBUST", "GRID"] | None = None,
    optimize_target: Literal["R2", "RMSE", "ACCURACY", "MCC", "F1-SCORE"] | None = None,
    num_search=None,
    model_param_setting=None,
    output_param_tuning_table=None,
    include_probabilities: Literal["ALL_PROBABILITIES", "HIGHEST_PROBABILITY_ONLY"] | None = None,
) -> Result:
    """Forest_stats(prediction_type, in_features, {variable_predict}, {treat_variable_as_categorical}, {explanatory_variables;explanatory_variables...}, {distance_features;distance_features...}, {explanatory_rasters;explanatory_rasters...}, {features_to_predict}, {output_features}, {output_raster}, {explanatory_variable_matching;explanatory_variable_matching...}, {explanatory_distance_matching;explanatory_distance_matching...}, {explanatory_rasters_matching;explanatory_rasters_matching...}, {output_trained_features}, {output_importance_table}, {use_raster_values}, {number_of_trees}, {minimum_leaf_size}, {maximum_depth}, {sample_size}, {random_variables}, {percentage_for_training}, {output_classification_table}, {output_validation_table}, {compensate_sparse_categories}, {number_validation_runs}, {calculate_uncertainty}, {output_trained_model}, {model_type}, {reg_lambda}, {gamma}, {eta}, {max_bins}, {optimize}, {optimize_algorithm}, {optimize_target}, {num_search}, {model_param_setting;model_param_setting...}, {output_param_tuning_table}, {include_probabilities})

       Creates models and generates predictions using one of two supervised
       machine learning methods: an adaptation of the random forest algorithm
       developed by Leo Breiman and Adele Cutler or the Extreme Gradient
       Boosting (XGBoost) algorithm developed by Tianqi Chen and Carlos
       Guestrin. Predictions can be performed for both categorical variables
       (classification) and continuous variables (regression). Explanatory
       variables can take the form of fields in the attribute table of the
       training features, raster datasets, and distance features used to
       calculate proximity values for use as additional variables. In
       addition to validation of model performance based on the training
       data, predictions can be made to either features or a prediction
       raster.

    INPUTS:
     prediction_type (String):
         Specifies the operation mode that will be used. The tool can be run to
         train a model to only assess performance, predict features, or create
         a prediction surface.TRAIN-A model will be trained, but no predictions
         will be generated.
         Use this option to assess the accuracy of the model before generating
         predictions. This option will output model diagnostics in the messages
         window and a chart of variable importance. This is the
         default.PREDICT_FEATURES-Predictions or classifications will be
         generated for
         features. Explanatory variables must be provided for both the training
         features and the features to be predicted. The output of this option
         will be a feature class, model diagnostics in the messages window, and
         an optional table and chart of variable importance.PREDICT_RASTER-A
         prediction raster will be generated for the area
         where the explanatory rasters intersect. Explanatory rasters must be
         provided for both the training area and the area to be predicted. The
         output of this option will be a prediction surface, model diagnostics
         in the messages window, and an optional table and chart of variable
         importance.
     in_features (Feature Layer):
         The feature class containing the variable_predict parameter value and,
         optionally, the explanatory training variables from fields.
     variable_predict {Field}:
         The variable from the in_features parameter value containing the
         values to be used to train the model. This field contains known
         (training) values of the variable that will be used to predict at
         unknown locations.
     treat_variable_as_categorical {Boolean}:
         CATEGORICAL-The variable_predict value is a categorical variable and
         classification will be performed.NUMERIC-The variable_predict value is
         continuous and regression will
         be performed. This is the default
     explanatory_variables {Value Table}:
         A list of fields representing the explanatory variables that help
         predict the value or category of the variable_predict value. Use the
         treat_variable_as_categorical parameter for any variables that
         represent classes or categories (such as land cover or presence or
         absence). Specify the variable as CATEGORICAL if it represents classes
         or categories such as land cover or presence or absence, and specify
         NUMERIC if it is continuous.
     distance_features {Feature Layer}:
         The explanatory training distance features. Explanatory variables will
         be automatically created by calculating a distance from the provided
         features to the in_features values. Distances will be calculated from
         each of the features in the in_features value to the nearest
         distance_features values. If the input distance_features values are
         polygons or lines, the distance attributes will be calculated as the
         distance between the closest segments of the pair of features.
     explanatory_rasters {Value Table}:
         The explanatory training variables extracted from rasters. Explanatory
         training variables will be automatically created by extracting raster
         cell values. For each feature in the in_features parameter, the value
         of the raster cell is extracted at that exact location. Bilinear
         raster resampling is used when extracting the raster value unless it
         is specified as categorical, in which case nearest neighbor assignment
         is used. Specify the raster as CATEGORICAL if it represents classes or
         categories such as land cover or presence or absence, and specify
         NUMERIC if it is continuous.
     features_to_predict {Feature Layer}:
         A feature class representing the locations where predictions will be
         made. This feature class must also contain any explanatory variables
         provided as fields that correspond to those used from the training
         data.
     explanatory_variable_matching {Value Table}:
         A list of the explanatory_variables values specified from the
         in_features parameter on the right and corresponding fields from the
         features_to_predict parameter on the left, for example,
         [["LandCover2000", "LandCover2010"], ["Income", "PerCapitaIncome"]].
     explanatory_distance_matching {Value Table}:
         A list of the distance_features values specified for the in_features
         parameter on the right and corresponding feature sets from the
         features_to_predict parameter on the
         left.explanatory_distance_features values that are more appropriate
         for the
         features_to_predict parameter can be provided if those used for
         training are in a different study area or time period.
     explanatory_rasters_matching {Value Table}:
         A list of the explanatory_rasters values specified for the in_features
         on the right and corresponding rasters from the features_to_predict
         parameter or output_raster parameter to be created on the left.The
         explanatory_rasters values that are more appropriate for the
         features_to_predict parameter can be provided if those used for
         training are in a different study area or time period.
     use_raster_values {Boolean}:
         Specifies how polygons will be treated when training the model if the
         in_features values are polygons with a categorical variable_predict
         value and only explanatory_rasters values have been provided.TRUE-The
         polygon will be divided into all of the raster cells with
         centroids falling within the polygon. The raster values at each
         centroid will be extracted and used to train the model. The model will
         no longer be trained on the polygon; it will be trained on the raster
         values extracted for each cell centroid. This is the
         default.FALSE-Each polygon will be assigned the average value of the
         underlying continuous rasters and the majority for underlying
         categorical rasters.
     number_of_trees {Long}:
         The number of trees that will be created in the Forest-based and
         Gradient Boosted models. The default is 100.If the model_type
         parameter value is FOREST-BASED, more trees will
         generally result in more accurate model predictions; however, the
         model will take longer to calculate. If the model_type parameter value
         is GRADIENT_BOOSTED, more trees may result in more accurate model
         predictions; however, they may also lead to overfitting the training
         data. To avoid overfitting the data, provide values for the
         maximum_depth, reg_lambda, gamma, and eta parameters.
     minimum_leaf_size {Long}:
         The minimum number of observations required to keep a leaf (that is,
         the terminal node on a tree without further splits). The default
         minimum for regression is 5 and the default for classification is 1.
         For very large data, increasing these numbers will decrease the run
         time of the tool.
     maximum_depth {Long}:
         The maximum number of splits that will be made down a tree. Using a
         large maximum depth, more splits will be created, which may increase
         the chances of overfitting the model. If the model_type parameter
         value is FOREST-BASED, the default is data driven and depends on the
         number of trees created and the number of variables included. If the
         model_type parameter value is GRADIENT_BOOSTED, the default is 6.
     sample_size {Long}:
         The percentage of the in_features values that will be used for each
         decision tree. The default is 100 percent of the data. Samples for
         each tree are taken randomly from two-thirds of the data
         specified.Each decision tree in the forest is created using a random
         sample or
         subset (approximately two-thirds) of the training data available.
         Using a lower percentage of the input data for each decision tree
         decreases the run time of the tool for very large datasets.
     random_variables {Long}:
         The number of explanatory variables that will be used to create each
         decision tree.Each decision tree in the forest is created using a
         random subset of
         the specified explanatory variables. Increasing the number of
         variables used in each decision tree will increase the chances of
         overfitting the model, particularly if there is one or more dominant
         variables. A common practice is to use the square root of the total
         number of explanatory variables (fields, distances, and rasters
         combined) if the variable_predict value is categorical or to divide
         the total number of explanatory variables (fields, distances, and
         rasters combined) by 3 if the variable_predict value is numeric.
     percentage_for_training {Double}:
         The percentage (between 10 percent and 50 percent) of the in_features
         values that will be reserved as the test dataset for validation. The
         model will be trained without this random subset of data, and the
         observed values for those features will be compared to the predicted
         value. The default is 10 percent.
     compensate_sparse_categories {Boolean}:
         Specifies whether each category in the training dataset, regardless of
         its frequency, will be represented in each tree. This parameter is
         available when the model_type parameter value is FOREST-
         BASED.TRUE-Each tree will include every category that is represented
         in the
         training dataset.FALSE-Each tree will be created based on a random
         sample of the
         categories in the training dataset. This is the default.
     number_validation_runs {Long}:
         The number of iterations of the tool.The distribution of R-squared
         values or accuracies of all the models
         can be displayed using the output_validation_table parameter. If the
         prediction_type parameter value is PREDICT_RASTER or PREDICT_FEATURES,
         the model that produced the median R-squared value or accuracy will be
         used to make predictions. Using the median value helps ensure
         stability of the predictions.
     calculate_uncertainty {Boolean}:
         Specifies whether prediction uncertainty will be calculated when
         training, predicting to features, or predicting to raster.This
         parameter is available when the model_type parameter value is
         FOREST-BASED.TRUE-A prediction uncertainty interval will be
         calculated.FALSE-
         Uncertainty will not be calculated. This is the default.
     model_type {String}:
         Specifies the method that will be used to create the model.FOREST-
         BASED-A model will be created using an adaptation of the random
         forest algorithm. The model will use the votes from hundreds of
         decisions trees. Each decision tree will be created from a randomly
         generated subset of the original data and original
         variables.GRADIENT_BOOSTED-A model will be created using the Extreme
         Gradient
         Boosting (XGBoost) algorithm. The model will create a sequence of
         hundreds of trees in which each subsequent tree corrects the errors of
         the previous trees.
     reg_lambda {Double}:
         A regularization term that reduces the model's sensitivity to
         individual features. Increasing this value will make the model more
         conservative and prevent overfitting the training data. If the value
         is 0, the model becomes the traditional Gradient Boosting model. The
         default is 1.This parameter is available when the model_type parameter
         value is
         GRADIENT_BOOSTED.
     gamma {Double}:
         A threshold for the minimum loss reduction needed to split
         trees.Potential splits are evaluated for their loss reduction. If the
         candidate split has a higher loss reduction than this threshold value,
         the partition will occur. Higher threshold values avoid overfitting
         and result in more conservative models with fewer partitions. The
         default is 0.This parameter is available when the model_type parameter
         value is
         GRADIENT_BOOSTED.
     eta {Double}:
         A value that reduces the contribution of each tree to the final
         prediction. The value should be greater than 0 and less than or equal
         to 1. A lower learning rate prevents overfitting the model; however,
         it may require longer computation times. The default is 0.3.This
         parameter is available when the model_type parameter value is
         GRADIENT_BOOSTED.
     max_bins {Long}:
         The number of bins that the training data will be divided into to
         search for the best splitting point. The value cannot be 1. The
         default is 0, which corresponds to the use of a greedy algorithm. A
         greedy algorithm will create a candidate split at every data point.
         Providing too few bins for searching is not recommended because it
         will lead to poor model prediction performance.This parameter is
         available when the model_type parameter value is
         GRADIENT_BOOSTED.
     optimize {Boolean}:
         Specifies whether an optimization method will be used to find the set
         of hyperparameters that achieve optimal model performance.TRUE-An
         optimization method will be used to find the set of
         hyperparameters.FALSE-An optimization method will not be used. This is
         the default.
     optimize_algorithm {String}:
         Specifies the optimization method that will be used to select and test
         search points to find the optimal set of hyperparameters. Search
         points are combinations of hyperparameters within the search space
         specified by the model_param_setting parameter. This option is
         available when the optimize parameter value is TRUE.RANDOM-A
         stratified random sampling algorithm will be used to select
         the search points within the search space. This is the
         default.RANDOM_ROBUST-A stratified random sampling algorithm will be
         used to
         select the search points. Each search will be run 10 times using a
         different random seed. The result of each search will be the median
         best run determined by the optimize_target parameter value. This
         option is available when the model_type parameter value is FOREST-
         BASED.GRID-Every search point within the search space will be
         selected.
     optimize_target {String}:
         Specifies the objective function or value that will be minimized or
         maximized to find the optimal set of hyperparameters. R2-The
         optimization method will maximize Rto find the optimal
         set of hyperparameters. This option is only available when the
         variable to predict is not categorical. This is the default when the
         variable to predict is not categorical. 2RMSE-The optimization
         method will minimize root mean square error to
         find the optimal set of hyperparameters. This option is only available
         when the variable to predict is not categorical.ACCURACY-The
         optimization method will maximize accuracy to find the
         optimal model. This option is only available when the variable to
         predict is categorical. This is the default when the variable to
         predict is categorical.MCC-The optimization method will maximize
         Matthews correlation
         coefficient to find the optimal set of hyperparameters. This option is
         only available when the variable to predict is
         categorical.F1-SCORE-The optimization method will maximize the
         F1-Score to find
         the optimal set of hyperparameters. This option is only available when
         the variable to predict is categorical.
     num_search {Long}:
         The number of search points within the search space specified by the
         model_param_setting parameter that will be tested. This parameter is
         available when the optimize_algorithm parameter value is RANDOM or
         RANDOM_ROBUST.
     model_param_setting {Value Table}:
         A list of hyperparameters and their search spaces. Customize the
         search space of each hyperparameter by providing a lower bound, upper
         bound, and interval. The lower bound and upper bound specify the range
         of possible values for the hyperparameter. The following is the
         range of valid values for each
         hyperparameter:        Number of Trees (number_of_trees)-An integer
         value greater than
         1.Maximum Tree Depth (maximum_depth)-An integer value greater than or
         equal to 0.Minimum Leaf Size (minimum_leaf_size)-An integer value
         greater than 1.Data Available per Tree (%) (sample_size)-An integer
         value greater
         than 0 and less than or equal to 100.Number of Randomly Sampled
         Variables (random_variables)-An integer
         value less than or equal to the number of explanatory variables. This
         includes the explanatory variables from fields, distance features, and
         rasters.Learning Rate (Eta) (eta)-A double value greater than 0 and
         less than
         or equal to 1.L2 Regularization (Lambda) (reg_lambda)-A double value
         greater than or
         equal to 0.Minimum Loss Reduction for Splits (Gamma) (gamma)-A double
         value
         greater than or equal to 0.Maximum Number of Bins for Searching Splits
         (max_bins)-An integer
         value greater than 1 or the value 0. A value of 0 means the model will
         create a candidate split at every data point.
     include_probabilities {Boolean}:
         For categorical variables to predict, specifies whether the
         probability of every category of the categorical variable or only the
         probability of the record's category will be predicted. For example,
         if a categorical variable has categories A, B, and C, and the first
         record has category B, use this parameter to specify whether the
         probability for categories A, B, and C will be predicted or only the
         probability of category B will be
         predicted.ALL_PROBABILITIES-Probabilities for all categories of the
         categorical
         variable will be predicted and included in the trained features output
         and predicted features output.HIGHEST_PROBABILITY_ONLY-Only the
         probability of the category of the
         record will be predicted and included in the trained features output
         and predicted features output. This is the default.

    OUTPUTS:
     output_features {Feature Class}:
         The output feature class containing the prediction results.
     output_raster {Raster Dataset}:
         The output raster containing the prediction results. The default cell
         size will be the maximum cell size of the raster inputs. To set a
         different cell size, use the Cell Size environment setting.
     output_trained_features {Feature Class}:
         The explanatory variables used for training (including sampled raster
         values and distance calculations), as well as the observed
         variable_predict field and accompanying predictions that will be used
         to further assess performance of the trained model.
     output_importance_table {Table}:
         The table that will contain information describing the importance of
         each explanatory variable (fields, distance features, and rasters)
         used to create the model.
     output_classification_table {Table}:
         A confusion matrix that summarizes the performance of the model
         created on the validation data. The matrix compares the model
         predicted categories for the validation data to the actual categories.
         This table can be used to calculate additional diagnostics that are
         not included in the output messages. This parameter is available when
         the variable_predict value is categorical and the
         treat_variable_as_categorical parameter value is CATEGORICAL.
     output_validation_table {Table}:
         A table that contains the Rfor each model if the
         variable_predict value is not categorical, or the accuracy of each
         model if the value is categorical. This table includes a bar chart of
         the distribution of accuracies or the Rvalues. This distribution can
         be used to assess the stability of the model. This parameter is
         available when the number_validation_runs value is greater than 2.
         22
     output_trained_model {File}:
         An output model file that will save the trained model, which can be
         used later for prediction.
     output_param_tuning_table {Table}:
         A table that contains the parameter settings and objective values for
         each optimization trial. The output includes a chart of all the trials
         and their objective values. This option is available when optimize is
         TRUE."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Forest_stats(
                *gp_fixargs(
                    (
                        prediction_type,
                        in_features,
                        variable_predict,
                        treat_variable_as_categorical,
                        explanatory_variables,
                        distance_features,
                        explanatory_rasters,
                        features_to_predict,
                        output_features,
                        output_raster,
                        explanatory_variable_matching,
                        explanatory_distance_matching,
                        explanatory_rasters_matching,
                        output_trained_features,
                        output_importance_table,
                        use_raster_values,
                        number_of_trees,
                        minimum_leaf_size,
                        maximum_depth,
                        sample_size,
                        random_variables,
                        percentage_for_training,
                        output_classification_table,
                        output_validation_table,
                        compensate_sparse_categories,
                        number_validation_runs,
                        calculate_uncertainty,
                        output_trained_model,
                        model_type,
                        reg_lambda,
                        gamma,
                        eta,
                        max_bins,
                        optimize,
                        optimize_algorithm,
                        optimize_target,
                        num_search,
                        model_param_setting,
                        output_param_tuning_table,
                        include_probabilities,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GWR_stats", None)
def GWR(
    in_features=None,
    dependent_variable=None,
    model_type: Literal["CONTINUOUS", "BINARY", "COUNT"] | None = None,
    explanatory_variables=None,
    output_features=None,
    neighborhood_type: Literal["NUMBER_OF_NEIGHBORS", "DISTANCE_BAND"] | None = None,
    neighborhood_selection_method: Literal["GOLDEN_SEARCH", "MANUAL_INTERVALS", "USER_DEFINED"] | None = None,
    minimum_number_of_neighbors=None,
    maximum_number_of_neighbors=None,
    minimum_search_distance=None,
    maximum_search_distance=None,
    number_of_neighbors_increment=None,
    search_distance_increment=None,
    number_of_increments=None,
    number_of_neighbors=None,
    distance_band=None,
    prediction_locations=None,
    explanatory_variables_to_match=None,
    output_predicted_features=None,
    robust_prediction: Literal["ROBUST", "NON_ROBUST"] | None = None,
    local_weighting_scheme: Literal["GAUSSIAN", "BISQUARE"] | None = None,
    coefficient_raster_workspace=None,
    scale: Literal["SCALE_DATA", "NO_SCALE_DATA"] | None = None,
) -> Result3[str, str, str | Layer]:
    """GWR_stats(in_features, dependent_variable, model_type, explanatory_variables;explanatory_variables..., output_features, neighborhood_type, neighborhood_selection_method, {minimum_number_of_neighbors}, {maximum_number_of_neighbors}, {minimum_search_distance}, {maximum_search_distance}, {number_of_neighbors_increment}, {search_distance_increment}, {number_of_increments}, {number_of_neighbors}, {distance_band}, {prediction_locations}, {explanatory_variables_to_match;explanatory_variables_to_match...}, {output_predicted_features}, {robust_prediction}, {local_weighting_scheme}, {coefficient_raster_workspace}, {scale})

       Performs Geographically Weighted Regression, which is a local form of
       linear regression that is used to model spatially varying
       relationships.

    INPUTS:
     in_features (Feature Layer):
         The feature class containing the dependent and explanatory variables.
     dependent_variable (Field):
         The numeric field containing the observed values that will be modeled.
     model_type (String):
         Specifies the type of data that will be modeled.CONTINUOUS-The
         dependent_variable value is continuous. The Gaussian
         model will be used, and the tool will perform ordinary least squares
         regression.BINARY-The dependent_variable value represents presence or
         absence.
         This can be either conventional 1s and 0s or continuous data that has
         been coded based on a threshold value. The Logistic regression model
         will be used.COUNT-The dependent_variable value is discrete and
         represents events,
         such as crime counts, disease incidents, or traffic accidents. The
         Poisson regression model will be used.
     explanatory_variables (Field):
         A list of fields representing independent explanatory variables in the
         regression model.
     neighborhood_type (String):
         Specifies whether the neighborhood used is constructed as a fixed
         distance or allowed to vary in spatial extent depending on the density
         of the features.NUMBER_OF_NEIGHBORS-The neighborhood size is a
         function of a
         specified number of neighbors included in calculations for each
         feature. Where features are dense, the spatial extent of the
         neighborhood is smaller; where features are sparse, the spatial extent
         of the neighborhood is larger.DISTANCE_BAND-The neighborhood size is a
         constant or fixed distance
         for each feature.
     neighborhood_selection_method (String):
         Specifies how the neighborhood size will be determined. The
         neighborhood selected with the GOLDEN_SEARCH and MANUAL_INTERVALS
         options is based on minimizing the AICc value.GOLDEN_SEARCH-The tool
         will identify an optimal distance or number of
         neighbors based on the characteristics of the data using the golden
         section search method.MANUAL_INTERVALS-The neighborhoods tested will
         be defined by the
         values specified in the minimum_number_of_neighbors and
         number_of_neighbors_increment parameters when NUMBER_OF_NEIGHBORS is
         chosen for the neighborhood_type parameter, or the
         minimum_search_distance and search_distance_increment parameters when
         DISTANCE_BAND is chosen for the neighborhood_type parameter, as well
         as the number_of_increments parameter.USER_DEFINED-The neighborhood
         size will be specified by either the
         number_of_neighbors parameter or the distance_band parameter.
     minimum_number_of_neighbors {Long}:
         The minimum number of neighbors each feature will include in its
         calculations. It is recommended that you use at least 30 neighbors.
     maximum_number_of_neighbors {Long}:
         The maximum number of neighbors (up to 1000) each feature will include
         in its calculations.
     minimum_search_distance {Linear Unit}:
         The minimum neighborhood search distance. It is recommended that you
         use a distance at which each feature has at least 30 neighbors.
     maximum_search_distance {Linear Unit}:
         The maximum neighborhood search distance. If a distance results in
         features with more than 1000 neighbors, the tool will use the first
         1000 in calculations for the target feature.
     number_of_neighbors_increment {Long}:
         The number of neighbors by which manual intervals will increase for
         each neighborhood test.
     search_distance_increment {Linear Unit}:
         The distance by which manual intervals will increase for each
         neighborhood test.
     number_of_increments {Long}:
         The number of neighborhood sizes that will be tested starting with the
         minimum_number_of_neighbors or minimum_search_distance parameter
         value.
     number_of_neighbors {Long}:
         The closest number of neighbors (up to 1000) that will be considered
         for each feature. The number must be an integer between 2 and 1000.
     distance_band {Linear Unit}:
         The spatial extent of the neighborhood.
     prediction_locations {Feature Layer}:
         A feature class containing features representing locations where
         estimates will be computed. Each feature in this dataset should
         contain values for all the explanatory variables specified. The
         dependent variable for these features will be estimated using the
         model calibrated for the input feature class data. To be predicted,
         these feature locations should be within the same study area as the
         in_features parameter value or be close (within the extent plus 15
         percent). A feature class containing features representing
         locations
         where estimates will be computed. Each feature in this dataset should
         contain values for all the explanatory variables specified. The
         dependent variable for these features will be estimated using the
         model calibrated for the input feature class data. To be predicted,
         these feature locations should be within the same study area as
         theparameter value or be close (within the extent plus 15 percent).
         Input Features
     explanatory_variables_to_match {Value Table}:
         The explanatory variables from the prediction_locations parameter that
         match corresponding explanatory variables from the in_features
         parameter. [["LandCover2000", "LandCover2010"], ["Income",
         "PerCapitaIncome"]] are examples.
     robust_prediction {Boolean}:
         Specifies the features that will be used in prediction
         calculations.ROBUST-Features with values more than three standard
         deviations from
         the mean (value outliers) and features with weights of 0 (spatial
         outliers) will be excluded from prediction calculations but will
         receive predictions in the output feature class. This is the
         default.NON_ROBUST-All features will be used in prediction
         calculations
     local_weighting_scheme {String}:
         Specifies the kernel type that will be used to provide the spatial
         weighting in the model. The kernel defines how each feature is related
         to other features within its neighborhood.BISQUARE-A weight of 0 will
         be assigned to any feature outside the
         neighborhood specified. This is the default.GAUSSIAN-All features will
         receive weights, but weights become
         exponentially smaller the farther away they are from the target
         feature.
     coefficient_raster_workspace {Workspace}:
         The workspace where the coefficient rasters will be created. When this
         workspace is provided, rasters are created for the intercept and every
         explanatory variable. This parameter is only available with a Desktop
         Advanced license.
     scale {Boolean}:
         Specifies whether the values of the explanatory and dependent
         variables will be scaled to have mean zero and standard deviation one
         before fitting the model.SCALE_DATA-The values of the variables will
         be scaled. The results
         will contain scaled and unscaled versions of the explanatory variable
         coefficients.NO_SCALE_DATA-The values of the variables will not be
         scaled. All
         coefficients will be unscaled and in original data units.

    OUTPUTS:
     output_features (Feature Class):
         The new feature class containing the dependent variable estimates and
         residuals.
     output_predicted_features {Feature Class}:
         The output feature class that will receive dependent variable
         estimates for each prediction_location value."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GWR_stats(
                *gp_fixargs(
                    (
                        in_features,
                        dependent_variable,
                        model_type,
                        explanatory_variables,
                        output_features,
                        neighborhood_type,
                        neighborhood_selection_method,
                        minimum_number_of_neighbors,
                        maximum_number_of_neighbors,
                        minimum_search_distance,
                        maximum_search_distance,
                        number_of_neighbors_increment,
                        search_distance_increment,
                        number_of_increments,
                        number_of_neighbors,
                        distance_band,
                        prediction_locations,
                        explanatory_variables_to_match,
                        output_predicted_features,
                        robust_prediction,
                        local_weighting_scheme,
                        coefficient_raster_workspace,
                        scale,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GeneralizedLinearRegression_stats", None)
def GeneralizedLinearRegression(
    in_features=None,
    dependent_variable=None,
    model_type: Literal["CONTINUOUS", "BINARY", "COUNT"] | None = None,
    output_features=None,
    explanatory_variables=None,
    distance_features=None,
    prediction_locations=None,
    explanatory_variables_to_match=None,
    explanatory_distance_matching=None,
    output_predicted_features=None,
    output_trained_model=None,
) -> Result3[str, str, str]:
    """GeneralizedLinearRegression_stats(in_features, dependent_variable, model_type, output_features, {explanatory_variables;explanatory_variables...}, {distance_features;distance_features...}, {prediction_locations}, {explanatory_variables_to_match;explanatory_variables_to_match...}, {explanatory_distance_matching;explanatory_distance_matching...}, {output_predicted_features}, {output_trained_model})

       Performs generalized linear regression (GLR) to generate predictions
       or to model a dependent variable in terms of its relationship to a set
       of explanatory variables. This tool can be used to fit continuous
       (OLS), binary (logistic), and count (Poisson) models.

    INPUTS:
     in_features (Feature Layer):
         The feature class containing the dependent and independent variables.
     dependent_variable (Field):
         The numeric field containing the observed values to be modeled.
     model_type (String):
         Specifies the type of data that will be modeled.CONTINUOUS-The
         dependent_variable value is continuous. The model used
         is Gaussian, and the tool performs ordinary least squares
         regression.BINARY-The dependent_variable value represents presence or
         absence.
         This can be either conventional 1s and 0s, or continuous data that has
         been recoded based on a threshold value. The model used is Logistic
         Regression.COUNT-The dependent_variable value is discrete and
         represents
         events-for example, crime counts, disease incidents, or traffic
         accidents. The model used is Poisson regression.
     explanatory_variables {Field}:
         A list of fields representing independent explanatory variables in the
         regression model.
     distance_features {Feature Layer}:
         Automatically creates explanatory variables by calculating a distance
         from the provided features to the in_features values. Distances will
         be calculated from each of the input distance_features values to the
         nearest in_features value. If the input distance_features values are
         polygons or lines, the distance attributes will be calculated as the
         distance between the closest segments of the pair of features.
     prediction_locations {Feature Layer}:
         A feature class containing features representing locations where
         estimates will be computed. Each feature in this dataset should
         contain values for all the explanatory variables specified. The
         dependent variable for these features will be estimated using the
         model calibrated for the input feature class data.
     explanatory_variables_to_match {Value Table}:
         Matches the explanatory variables in the prediction_locations
         parameter to corresponding explanatory variables from the in_features
         parameter.
     explanatory_distance_matching {Value Table}:
         Matches the distance features specified for the features_to_predict
         parameter on the left to the corresponding distance features for the
         in_features parameter on the right.

    OUTPUTS:
     output_features (Feature Class):
         The new feature class that will contain the dependent variable
         estimates and residuals.
     output_predicted_features {Feature Class}:
         The output feature class that will receive dependent variable
         estimates for each prediction_location value. The output
         feature class that will receive dependent variable
         estimates for eachvalue. Prediction Location
     output_trained_model {File}:
         An output model file that will save the trained model, which can be
         used later for prediction."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeneralizedLinearRegression_stats(
                *gp_fixargs(
                    (
                        in_features,
                        dependent_variable,
                        model_type,
                        output_features,
                        explanatory_variables,
                        distance_features,
                        prediction_locations,
                        explanatory_variables_to_match,
                        explanatory_distance_matching,
                        output_predicted_features,
                        output_trained_model,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateNetworkSWM_stats", None)
def GenerateNetworkSWM(
    Input_Feature_Class=None,
    Unique_ID_Field=None,
    Output_Spatial_Weights_Matrix_File=None,
    Input_Network_Data_Source=None,
    Travel_Mode=None,
    Impedance_Distance_Cutoff=None,
    Impedance_Temporal_Cutoff=None,
    Impedance_Cost_Cutoff=None,
    Maximum_Number_of_Neighbors=None,
    Time_of_Day=None,
    Time_Zone: Literal["LOCAL_TIME_AT_LOCATIONS", "UTC"] | None = None,
    Barriers=None,
    Search_Tolerance=None,
    Conceptualization_of_Spatial_Relationships: Literal["FIXED", "INVERSE"] | None = None,
    Exponent=None,
    Row_Standardization: Literal["ROW_STANDARDIZATION", "NO_STANDARDIZATION"] | None = None,
) -> Result1[str]:
    """GenerateNetworkSWM_stats(Input_Feature_Class, Unique_ID_Field, Output_Spatial_Weights_Matrix_File, Input_Network_Data_Source, Travel_Mode, {Impedance_Distance_Cutoff}, {Impedance_Temporal_Cutoff}, {Impedance_Cost_Cutoff}, {Maximum_Number_of_Neighbors}, {Time_of_Day}, {Time_Zone}, {Barriers}, {Search_Tolerance}, {Conceptualization_of_Spatial_Relationships}, {Exponent}, {Row_Standardization})

       Constructs a spatial weights matrix file (.swm) using a network
       dataset, defining spatial relationships in terms of the underlying
       network structure.

    INPUTS:
     Input_Feature_Class (Feature Class):
         The point feature class representing locations on the network. For
         each feature, neighbors and weights are calculated and stored in the
         output spatial weights matrix file.
     Unique_ID_Field (Field):
         An integer field containing a unique value for each feature in
         the input feature class. If you don't have a field with unique ID
         values, you can create one by adding an integer field to your feature
         class table and calculating the field values to equal theorfield.
         FIDOBJECTID
     Input_Network_Data_Source (Network Data Source):
         The network dataset used to find neighbors of each input feature.
         Network datasets usually represent street networks but can also
         represent other kinds of transportation networks such as railroads or
         walking paths. The network dataset must include at least one attribute
         related to distance, travel time, or cost.
     Travel_Mode (String):
         The mode of transportation for the analysis. A travel mode defines how
         a pedestrian, car, truck, or other medium of transportation moves
         through the network and represents a collection of network settings,
         such as travel restrictions and U-turn policies.An arcpy.na.TravelMode
         object and a string containing the valid JSON
         representation of a travel mode can also be used as input to the
         parameter.
     Impedance_Distance_Cutoff {Linear Unit}:
         The maximum impedance distance allowed for neighbors of a feature. Any
         feature whose distance is farther than this value will not be used as
         a neighbor. By default, no distance cutoff is used.
     Impedance_Temporal_Cutoff {Time Unit}:
         The maximum impedance travel time allowed for neighbors of a feature.
         Any feature whose travel time is longer than this value will not be
         used as a neighbor. By default, no temporal cutoff is used.
     Impedance_Cost_Cutoff {Double}:
         The maximum impedance cost allowed for neighbors of a feature. Any
         feature whose cost of travel is larger than this value will not be
         used as a neighbor. By default, no cost cutoff is used.
     Maximum_Number_of_Neighbors {Long}:
         An integer reflecting the maximum number of neighbors for each
         feature. The actual number of neighbors used for each feature may be
         smaller due to impedance cutoffs.
     Time_of_Day {Date}:
         The time of day traffic conditions will be considered in the analysis.
         Traffic conditions can impact the distance that can be traveled over a
         given time. If no date or time is provided, the analysis will not
         consider the impact of traffic.Instead of using a particular date, you
         can specify a day of the week
         using the following
         dates:Today-12/30/1899Sunday-12/31/1899Monday-1/1/1900Tuesday-
         1/2/1900Wednesday-1/3/1900Thursday-1/4/1900Friday-1/5/1900Saturday-
         1/6/1900For example, to specify that travel should begin at 5:00 p.m.
         on
         Tuesday, specify the parameter value as 1/2/1900 5:00 PM.
     Time_Zone {String}:
         Specifies the time zone for the Time_of_Day
         parameter.LOCAL_TIME_AT_LOCATIONS-The time zone in which the
         Input_Feature_Class
         is located will be used. This is the default.UTC-Coordinated universal
         time (UTC) will be used.
     Barriers {Feature Layer}:
         The features that represent blocked intersections, road closures,
         accident sites, or other locations where travel is blocked along the
         network.
     Search_Tolerance {Linear Unit}:
         The maximum distance used to assign each input feature to a location
         on the network. If any of the input points do not fall exactly on a
         line of the network, they will be assigned to the closest location on
         the network for the analysis. However, if the feature is farther than
         the search tolerance value from any location on the network, it will
         not be assigned to the network and will not be included in the
         analysis.
     Conceptualization_of_Spatial_Relationships {String}:
         Specifies how weights will be defined for each
         neighbor.INVERSE-Features farther in distance, time, or cost will have
         a
         smaller weight than features nearby. The weights decrease by their
         inverse to an exponent.FIXED-All neighbors will be given equal weight.
         This is the default.
     Exponent {Double}:
         The exponent used when INVERSE option is specified for the
         Conceptualization_of_Spatial_Relationships parameter. The weights
         assigned to each neighbor are calculated by taking the inverse
         distance, time, or cost to the power of the exponent. The default
         value is 1, and the value must be between 0.01 and 4. Weights drop off
         more rapidly as the exponent increases.
     Row_Standardization {Boolean}:
         Specifies whether row standardization will be applied. Row
         standardization is recommended when the locations of the input points
         are potentially biased due to sampling design or an imposed
         aggregation scheme. It is also recommended that you standardize rows
         when weighting neighbors based on inverse distance, time, or
         cost.ROW_STANDARDIZATION-Spatial weights will be standardized by row.
         Each
         weight is divided by its row sum. This is the
         default.NO_STANDARDIZATION-No standardization of spatial weights will
         be
         applied.

    OUTPUTS:
     Output_Spatial_Weights_Matrix_File (File):
         The output network spatial weights matrix file (.swm) that will store
         the neighbors and weights for each input feature."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateNetworkSWM_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Unique_ID_Field,
                        Output_Spatial_Weights_Matrix_File,
                        Input_Network_Data_Source,
                        Travel_Mode,
                        Impedance_Distance_Cutoff,
                        Impedance_Temporal_Cutoff,
                        Impedance_Cost_Cutoff,
                        Maximum_Number_of_Neighbors,
                        Time_of_Day,
                        Time_Zone,
                        Barriers,
                        Search_Tolerance,
                        Conceptualization_of_Spatial_Relationships,
                        Exponent,
                        Row_Standardization,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateNetworkSpatialWeights_stats", None)
def GenerateNetworkSpatialWeights(
    Input_Feature_Class=None,
    Unique_ID_Field=None,
    Output_Spatial_Weights_Matrix_File=None,
    Input_Network=None,
    Impedance_Attribute=None,
    Impedance_Cutoff=None,
    Maximum_Number_of_Neighbors=None,
    Barriers=None,
    U_turn_Policy=None,
    Restrictions=None,
    Use_Hierarchy_in_Analysis: Literal["USE_HIERARCHY", "NO_HIERARCHY"] | None = None,
    Search_Tolerance=None,
    Conceptualization_of_Spatial_Relationships: Literal["INVERSE", "FIXED"] | None = None,
    Exponent=None,
    Row_Standardization: Literal["ROW_STANDARDIZATION", "NO_STANDARDIZATION"] | None = None,
    Travel_Mode=None,
    Time_of_Day=None,
) -> Result1[str]:
    """GenerateNetworkSpatialWeights_stats(Input_Feature_Class, Unique_ID_Field, Output_Spatial_Weights_Matrix_File, Input_Network, Impedance_Attribute, {Impedance_Cutoff}, {Maximum_Number_of_Neighbors}, {Barriers}, {U_turn_Policy}, {Restrictions;Restrictions...}, {Use_Hierarchy_in_Analysis}, {Search_Tolerance}, {Conceptualization_of_Spatial_Relationships}, {Exponent}, {Row_Standardization}, {Travel_Mode}, {Time_of_Day})

       Constructs a spatial weights matrix file (.swm) using a Network
       dataset, defining feature spatial relationships in terms of the
       underlying network structure.

    INPUTS:
     Input_Feature_Class (Feature Class):
         The point feature class for which network spatial relationships among
         features will be assessed.
     Unique_ID_Field (Field):
         An integer field containing a different value for every
         feature in the input feature class. If you don't have a Unique ID
         field, you can create one by adding an integer field to your feature
         class table and calculating the field values to equal theorfield.
         FIDOBJECTID
     Input_Network (Network Dataset Layer):
         The network dataset for which spatial relationships among features in
         the input feature class will be defined. Network datasets most often
         represent street networks but may represent other kinds of
         transportation networks as well. The network dataset needs at least
         one time-based and one distance-based cost attribute.
     Impedance_Attribute (String):
         The type of cost units to use as impedance in the analysis.
     Impedance_Cutoff {Double}:
         Specifies a cutoff value for INVERSE and FIXED conceptualizations of
         spatial relationships. Enter this value using the units specified by
         the Impedance_Attribute parameter.A value of zero indicates that no
         threshold is applied. When this
         parameter is left blank, a default threshold value is computed based
         on input feature class extent and the number of features.
     Maximum_Number_of_Neighbors {Long}:
         An integer reflecting the maximum number of neighbors to find for each
         feature.
     Barriers {Feature Layer}:
         The name of a point feature class with features representing blocked
         intersections, road closures, accident sites, or other locations where
         travel is blocked along the network.
     U-turn_Policy {String}:
         Specifies optional U-turn restrictions.ALLOW_UTURNS-U-turns will be
         allowed anywhere. This is the
         default.NO_UTURNS-No U-turns will be allowed during
         navigation.ALLOW_DEAD_ENDS_ONLY-U-turns will be allowed only at dead
         ends (that
         is, single-valent
         junctions).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns will be
         allowed only at
         dead ends and intersections.
     Restrictions {String}:
         A list of restrictions. Check the restrictions to be honored in
         spatial relationship computations.
     Use_Hierarchy_in_Analysis {Boolean}:
         Specifies whether to use a hierarchy in the analysis.USE_HIERARCHY-The
         network dataset's hierarchy attribute will be used
         in a heuristic path algorithm to speed analysis.NO_HIERARCHY-An exact
         path algorithm will be used instead. If there is
         no hierarchy attribute, this option does not affect analysis.
     Search_Tolerance {Linear Unit}:
         The search threshold used to locate features in the
         Input_Feature_Class onto the network dataset. This parameter includes
         a search value and the units for the tolerance.
     Conceptualization_of_Spatial_Relationships {String}:
         Specifies how the weighting associated with each spatial relationship
         is specified.INVERSE-Features farther away have a smaller weight than
         features
         nearby.FIXED-Features within the Impendance_Cutoff are neighbors
         (weight of
         1); features outside the Impendance_Cutoff are not weighted (weight of
         0).
     Exponent {Double}:
         Parameter for the INVERSE Conceptualization_of_Spatial_Relationships
         calculation. Typical values are 1 or 2. Weights drop off quicker with
         distance as this exponent value increases.
     Row_Standardization {Boolean}:
         Specifies whether row standardization is applied. Row standardization
         is recommended whenever feature distribution is potentially biased due
         to sampling design or to an imposed aggregation
         scheme.ROW_STANDARDIZATION-Spatial weights are standardized by row.
         Each
         weight is divided by its row sum.NO_STANDARDIZATION-No standardization
         of spatial weights is applied.
     Travel_Mode {String}:
         The mode of transportation for the analysis.is always a
         choice. For other travel modes to appear, they must be present in the
         network dataset specified in theparameter. CustomNetwork
         DatasetA travel mode is defined on a network dataset and provides
         override
         values for parameters that model car, truck, pedestrian, or other
         modes of travel.
     Time_of_Day {Date}:
         Specifies whether travel times should consider traffic conditions.
         Especially in urbanized areas, traffic conditions can significantly
         impact the area covered within a specified travel time. If no date or
         time is specified, the distance covered during a specified travel time
         will not be impacted by traffic.

    OUTPUTS:
     Output_Spatial_Weights_Matrix_File (File):
         The output network spatial weights matrix (.swm) file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateNetworkSpatialWeights_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Unique_ID_Field,
                        Output_Spatial_Weights_Matrix_File,
                        Input_Network,
                        Impedance_Attribute,
                        Impedance_Cutoff,
                        Maximum_Number_of_Neighbors,
                        Barriers,
                        U_turn_Policy,
                        Restrictions,
                        Use_Hierarchy_in_Analysis,
                        Search_Tolerance,
                        Conceptualization_of_Spatial_Relationships,
                        Exponent,
                        Row_Standardization,
                        Travel_Mode,
                        Time_of_Day,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateSpatialWeightsMatrix_stats", None)
def GenerateSpatialWeightsMatrix(
    Input_Feature_Class=None,
    Unique_ID_Field=None,
    Output_Spatial_Weights_Matrix_File=None,
    Conceptualization_of_Spatial_Relationships: Literal[
        "INVERSE_DISTANCE",
        "FIXED_DISTANCE",
        "K_NEAREST_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "DELAUNAY_TRIANGULATION",
        "SPACE_TIME_WINDOW",
        "CONVERT_TABLE",
    ]
    | None = None,
    Distance_Method: Literal["EUCLIDEAN", "MANHATTAN"] | None = None,
    Exponent=None,
    Threshold_Distance=None,
    Number_of_Neighbors=None,
    Row_Standardization: Literal["ROW_STANDARDIZATION", "NO_STANDARDIZATION"] | None = None,
    Input_Table=None,
    Date_Time_Field=None,
    Date_Time_Interval_Type: Literal["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"] | None = None,
    Date_Time_Interval_Value=None,
    Use_Z_values: Literal["USE_Z_VALUES", "DO_NOT_USE_Z_VALUES"] | None = None,
) -> Result1[str]:
    """GenerateSpatialWeightsMatrix_stats(Input_Feature_Class, Unique_ID_Field, Output_Spatial_Weights_Matrix_File, Conceptualization_of_Spatial_Relationships, {Distance_Method}, {Exponent}, {Threshold_Distance}, {Number_of_Neighbors}, {Row_Standardization}, {Input_Table}, {Date_Time_Field}, {Date_Time_Interval_Type}, {Date_Time_Interval_Value}, {Use_Z_values})

       Generates a spatial weights matrix file (.swm) to represent the
       spatial relationships among features in a dataset.

    INPUTS:
     Input_Feature_Class (Feature Class):
         The feature class for which spatial relationships of features will be
         assessed.
     Unique_ID_Field (Field):
         An integer field containing a different value for every
         feature in the input feature class. If you don't have a Unique ID
         field, you can create one by adding an integer field to your feature
         class table and calculating the field values to equal theorfield.
         FIDOBJECTID
     Conceptualization_of_Spatial_Relationships (String):
         Specifies how spatial relationships among features will be
         conceptualized.INVERSE_DISTANCE-The impact of one feature on another
         feature will
         decrease with distance.FIXED_DISTANCE-Everything within a specified
         critical distance of each
         feature will be included in the analysis. Everything outside the
         critical distance will be excluded.K_NEAREST_NEIGHBORS-The closest k
         features will be included in the
         analysis; k is a specified numeric
         parameter.CONTIGUITY_EDGES_ONLY-Polygon features that share a boundary
         will be
         neighbors.CONTIGUITY_EDGES_CORNERS-Polygon features that share a
         boundary or
         share a node will be neighbors.DELAUNAY_TRIANGULATION-A mesh of
         nonoverlapping triangles will be
         created from feature centroids, and features associated with triangle
         nodes that share edges will be neighbors.SPACE_TIME_WINDOW-Features
         within a specified critical distance and
         specified time interval of each other will be
         neighbors.CONVERT_TABLE-Spatial relationships will be defined in a
         table.
     Distance_Method {String}:
         Specifies how distances will be calculated from each feature to
         neighboring features.EUCLIDEAN-The straight-line distance between two
         points (as the crow
         flies) will be calculated. This is the default.MANHATTAN-The distance
         between two points measured along axes at right
         angles (city block) will be calculated by summing the (absolute)
         difference between the x- and y-coordinates.
     Exponent {Double}:
         The value for inverse distance calculation. A typical value is 1 or 2.
     Threshold_Distance {Double}:
         The cutoff distance for the Conceptualization_of_Spatial_Relationships
         parameter's INVERSE_DISTANCE and FIXED_DISTANCE options. Enter this
         value using the units specified in the environment output coordinate
         system. This defines the size of the space window for the
         SPACE_TIME_WINDOW option.When this parameter is left blank, a default
         threshold value is
         computed based on the output feature class extent and the number of
         features. For the inverse distance conceptualization of spatial
         relationships, a value of zero indicates that no threshold distance
         will be applied and all features will be neighbors of every other
         feature.
     Number_of_Neighbors {Long}:
         An integer reflecting either the minimum or the exact number of
         neighbors. When the Conceptualization_of_Spatial_Relationships
         parameter is set to K_NEAREST_NEIGHBORS, each feature will have
         exactly this specified number of neighbors. For the INVERSE_DISTANCE
         or FIXED_DISTANCE option, each feature will have at least this many
         neighbors (the threshold distance will be temporarily extended to
         ensure this many neighbors, if necessary). When the
         CONTIGUITY_EDGES_ONLY or CONTIGUITY_EDGES_CORNERS option is chosen,
         each polygon will be assigned this minimum number of neighbors. For
         polygons with fewer than this number of contiguous neighbors,
         additional neighbors will be based on feature centroid proximity.
     Row_Standardization {Boolean}:
         Specifies whether spatial weights will be standardized by row. Row
         standardization is recommended whenever feature distribution is
         potentially biased due to sampling design or to an imposed aggregation
         scheme.ROW_STANDARDIZATION-Spatial weights will be standardized by
         row. Each
         weight is divided by its row sum. This is the
         default.NO_STANDARDIZATION-No standardization of spatial weights will
         be
         applied.
     Input_Table {Table}:
         A table containing numeric weights relating every feature to
         every other feature in the input feature class. Required fields for
         the table are theparameter value,(neighbor ID), and. Unique ID
         FieldNIDWEIGHT
     Date_Time_Field {Field}:
         A date field with a time stamp for each feature.
     Date_Time_Interval_Type {String}:
         Specifies the units that will be used for measuring time.SECONDS-The
         unit will be seconds.MINUTES-The unit will be
         minutes.HOURS-The unit will be hours.DAYS-The unit will be
         days.WEEKS-The unit will be weeks.MONTHS-The unit will be 30
         days.YEARS-The unit will be years.
     Date_Time_Interval_Value {Long}:
         An integer reflecting the number of time units comprising the time
         window.For example, if you choose HOURS for the
         Date_Time_Interval_Type
         parameter and specify 3 for the Date_Time_Interval_Value parameter,
         the time window will be 3 hours. Features within the specified space
         window and within the specified time window will be neighbors.
     Use_Z_values {Boolean}:
         Specifies whether z-coordinates will be used in the construction of
         the spatial weights matrix if the input features are
         z-enabled.USE_Z_VALUES-Z-values will be used in the construction of
         the spatial
         weights matrix.DO_NOT_USE_Z_VALUES-Z-values will not be used. They
         will be ignored
         and only x- and y-coordinates will be considered in the construction
         of the spatial weights matrix. This is the default.

    OUTPUTS:
     Output_Spatial_Weights_Matrix_File (File):
         The full path for the output spatial weights matrix file (.swm)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateSpatialWeightsMatrix_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Unique_ID_Field,
                        Output_Spatial_Weights_Matrix_File,
                        Conceptualization_of_Spatial_Relationships,
                        Distance_Method,
                        Exponent,
                        Threshold_Distance,
                        Number_of_Neighbors,
                        Row_Standardization,
                        Input_Table,
                        Date_Time_Field,
                        Date_Time_Interval_Type,
                        Date_Time_Interval_Value,
                        Use_Z_values,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GeographicallyWeightedRegression_stats", None)
def GeographicallyWeightedRegression(
    in_features=None,
    dependent_field=None,
    explanatory_field=None,
    out_featureclass=None,
    kernel_type: Literal["FIXED", "ADAPTIVE"] | None = None,
    bandwidth_method: Literal["AICc", "CV", "BANDWIDTH_PARAMETER"] | None = None,
    distance=None,
    number_of_neighbors=None,
    weight_field=None,
    coefficient_raster_workspace=None,
    cell_size=None,
    in_prediction_locations=None,
    prediction_explanatory_field=None,
    out_prediction_featureclass=None,
) -> Result:
    """GeographicallyWeightedRegression_stats(in_features, dependent_field, explanatory_field;explanatory_field..., out_featureclass, kernel_type, bandwidth_method, {distance}, {number_of_neighbors}, {weight_field}, {coefficient_raster_workspace}, {cell_size}, {in_prediction_locations}, {prediction_explanatory_field;prediction_explanatory_field...}, {out_prediction_featureclass})

       Performs Geographically Weighted Regression (GWR), a local form of
       linear regression used to model spatially varying relationships.

    INPUTS:
     in_features (Feature Layer):
         The feature class containing the dependent and independent variables.
     dependent_field (Field):
         The numeric field containing the values that will be modeled.
     explanatory_field (Field):
         A list of fields representing independent explanatory variables in the
         regression model.
     kernel_type (String):
         Specifies whether the kernel is constructed as a fixed distance, or if
         it is allowed to vary in extent as a function of feature
         density.FIXED-The spatial context (the Gaussian kernel) used to solve
         each
         local regression analysis is a fixed distance.ADAPTIVE-The spatial
         context (the Gaussian kernel) is a function of a
         specified number of neighbors. Where feature distribution is dense,
         the spatial context is smaller; where feature distribution is sparse,
         the spatial context is larger.
     bandwidth_method (String):
         Specifies how the extent of the kernel will be determined. When AICc
         or CV is selected, the tool will find the optimal distance or number
         of neighbors. Typically, you will select either AICc or CV when you
         aren't sure what to use for the distance or number_of_neighbors
         parameter. Once the tool determines the optimal distance or number of
         neighbors, however, you'll use the BANDWIDTH_PARAMETER option.AICc-The
         extent of the kernel is determined using the Akaike
         Information Criterion (AICc).CV-The extent of the kernel is determined
         using Cross Validation.BANDWIDTH_PARAMETER-The extent of the kernel is
         determined by a fixed
         distance or a fixed number of neighbors. You must specify a value for
         either the distance or number_of_neighbors parameter.
     distance {Double}:
         The distance to use when kernel_type is FIXED and bandwidth_method is
         BANDWIDTH_PARAMETER.
     number_of_neighbors {Long}:
         The exact number of neighbors to include in the local bandwidth of the
         Gaussian kernel when kernel_type is ADAPTIVE and bandwidth_method is
         BANDWIDTH_PARAMETER.
     weight_field {Field}:
         The numeric field containing a spatial weighting for individual
         features. This weight field allows some features to be more important
         in the model calibration process than others. This is useful when the
         number of samples taken at different locations varies, values for the
         dependent and independent variables are averaged, and places with more
         samples are more reliable (should be weighted higher). If you have an
         average of 25 different samples for one location but an average of
         only 2 samples for another location, for example, you can use the
         number of samples as your weight field so that locations with more
         samples have a larger influence on model calibration than locations
         with few samples.
     coefficient_raster_workspace {Workspace}:
         The full path to the workspace where the coefficient rasters will be
         created. When this workspace is provided, rasters are created for the
         intercept and every explanatory variable.
     cell_size {Analysis Cell Size}:
         The cell size (a number) or reference to the cell size (a path to a
         raster dataset) to use when creating the coefficient rasters.The
         default cell size is the shortest of the width or height of the
         extent specified in the geoprocessing environment output coordinate
         system, divided by 250.
     in_prediction_locations {Feature Layer}:
         A feature class containing features representing locations where
         estimates should be computed. Each feature in this dataset should
         contain values for all of the explanatory variables specified; the
         dependent variable for these features will be estimated using the
         model calibrated for the input feature class data.
     prediction_explanatory_field {Field}:
         A list of fields representing explanatory variables in the Prediction
         locations feature class. These field names should be provided in the
         same order (a one-to-one correspondence) as those listed for the input
         feature class Explanatory variables parameter. If no prediction
         explanatory variables are given, the output prediction feature class
         will only contain computed coefficient values for each prediction
         location.

    OUTPUTS:
     out_featureclass (Feature Class):
         The output feature class that will receive dependent variable
         estimates and residuals.
     out_prediction_featureclass {Feature Class}:
         The output feature class to receive dependent variable estimates for
         each feature in the Prediction locations feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeographicallyWeightedRegression_stats(
                *gp_fixargs(
                    (
                        in_features,
                        dependent_field,
                        explanatory_field,
                        out_featureclass,
                        kernel_type,
                        bandwidth_method,
                        distance,
                        number_of_neighbors,
                        weight_field,
                        coefficient_raster_workspace,
                        cell_size,
                        in_prediction_locations,
                        prediction_explanatory_field,
                        out_prediction_featureclass,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LocalBivariateRelationships_stats", None)
def LocalBivariateRelationships(
    in_features=None,
    dependent_variable=None,
    explanatory_variable=None,
    output_features=None,
    number_of_neighbors=None,
    number_of_permutations: Literal["99", "199", "499", "999"] | None = None,
    enable_local_scatterplot_popups: Literal["CREATE_POPUP", "NO_POPUP"] | None = None,
    level_of_confidence: Literal["90%", "95%", "99%"] | None = None,
    apply_false_discovery_rate_fdr_correction: Literal["APPLY_FDR", "NO_FDR"] | None = None,
    scaling_factor=None,
) -> Result1[str]:
    """LocalBivariateRelationships_stats(in_features, dependent_variable, explanatory_variable, output_features, {number_of_neighbors}, {number_of_permutations}, {enable_local_scatterplot_popups}, {level_of_confidence}, {apply_false_discovery_rate_fdr_correction}, {scaling_factor})

       Analyzes two variables for statistically significant relationships
       using local entropy. Each feature is classified into one of six
       categories based on the type of relationship. The output can be used
       to visualize areas where the variables are related and explore how
       their relationship changes across the study area.

    INPUTS:
     in_features (Feature Layer):
         The feature class containing fields representing the
         dependent_variable and explanatory_variable values.
     dependent_variable (Field):
         The numeric field representing the values of the dependent variable.
         When categorizing the relationships, the explanatory_variable value is
         used to predict the dependent_variable value.
     explanatory_variable (Field):
         The numeric field representing the values of the explanatory variable.
         When categorizing the relationships, the explanatory_variable value is
         used to predict the dependent_variable value.
     number_of_neighbors {Long}:
         The number of neighbors around each feature (including the feature)
         that will be used to test for a local relationship between the
         variables. The number of neighbors must be between 30 and 1,000, and
         the default is 30. The provided value should be large enough to detect
         the relationship between features, but small enough to still identify
         local patterns.
     number_of_permutations {Long}:
         Specifies the number of permutations that will be used to calculate
         the pseudo p-value for each feature. Choosing a number of permutations
         is a balance between precision in the pseudo p-value and increased
         processing time.99-With 99 permutations, the smallest possible pseudo
         p-value is 0.01,
         and all other pseudo p-values will be multiples of this value.199-With
         199 permutations, the smallest possible pseudo p-value is
         0.005, and all other pseudo p-values will be multiples of this value.
         This is the default.499-With 499 permutations, the smallest possible
         pseudo p-value is
         0.002, and all other pseudo p-values will be multiples of this
         value.999-With 999 permutations, the smallest possible pseudo p-value
         is
         0.001, and all other pseudo p-values will be multiples of this value.
     enable_local_scatterplot_popups {Boolean}:
         Specifies whether scatterplot pop-ups will be generated for each
         output feature. Each scatterplot displays the values of the
         explanatory (horizontal axis) and dependent (vertical axis) variables
         in the local neighborhood along with a fitted line or curve
         visualizing the form of the relationship. Scatterplot charts are not
         supported for shapefile outputs.CREATE_POPUP-Local scatterplot pop-ups
         will be generated for each
         feature in the dataset. This is the default.NO_POPUP-Local scatterplot
         pop-ups will not be generated.
     level_of_confidence {String}:
         Specifies a confidence level of the hypothesis test for significant
         relationships.90%-The confidence level is 90 percent. This is the
         default.95%-The
         confidence level is 95 percent.99%-The confidence level is 99 percent.
     apply_false_discovery_rate_fdr_correction {Boolean}:
         Specifies whether False Discover Rate (FDR) correction will be applied
         to the pseudo p-values.APPLY_FDR-Statistical significance will be
         based on the FDR
         correction. This is the default.NO_FDR-Statistical significance will
         be based on the pseudo p-value.
     scaling_factor {Double}:
         The level of sensitivity to subtle relationships between the
         variables. Larger values (closer to one) can detect relatively weak
         relationships, while smaller values (closer to zero) will only detect
         strong relationships. Smaller values are also more robust to outliers.
         The value must be between 0.01 and 1, and the default is 0.5.

    OUTPUTS:
     output_features (Feature Class):
         The output feature class containing all input features with fields
         representing the dependent_variable value, explanatory_variable value,
         entropy score, pseudo p-value, level of significance, type of
         categorized relationship, and diagnostics related to the
         categorization."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LocalBivariateRelationships_stats(
                *gp_fixargs(
                    (
                        in_features,
                        dependent_variable,
                        explanatory_variable,
                        output_features,
                        number_of_neighbors,
                        number_of_permutations,
                        enable_local_scatterplot_popups,
                        level_of_confidence,
                        apply_false_discovery_rate_fdr_correction,
                        scaling_factor,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("MGWR_stats", None)
def MGWR(
    in_features=None,
    dependent_variable=None,
    model_type: Literal["CONTINUOUS"] | None = None,
    explanatory_variables=None,
    output_features=None,
    neighborhood_type: Literal["NUMBER_OF_NEIGHBORS", "DISTANCE_BAND"] | None = None,
    neighborhood_selection_method: Literal["GOLDEN_SEARCH", "GRADIENT_SEARCH", "MANUAL_INTERVALS", "USER_DEFINED"]
    | None = None,
    minimum_number_of_neighbors=None,
    maximum_number_of_neighbors=None,
    distance_unit: Literal["FEET", "METERS", "KILOMETERS", "MILES", "FEETINT", "MILESINT"] | None = None,
    minimum_search_distance=None,
    maximum_search_distance=None,
    number_of_neighbors_increment=None,
    search_distance_increment=None,
    number_of_increments=None,
    number_of_neighbors=None,
    distance_band=None,
    number_of_neighbors_golden=None,
    number_of_neighbors_manual=None,
    number_of_neighbors_defined=None,
    distance_golden=None,
    distance_manual=None,
    distance_defined=None,
    prediction_locations=None,
    explanatory_variables_to_match=None,
    output_predicted_features=None,
    robust_prediction: Literal["ROBUST", "NON_ROBUST"] | None = None,
    local_weighting_scheme: Literal["GAUSSIAN", "BISQUARE"] | None = None,
    output_table=None,
    coefficient_raster_workspace=None,
    scale: Literal["SCALE_DATA", "NO_SCALE_DATA"] | None = None,
    number_of_neighbors_gradient=None,
    distance_gradient=None,
) -> Result:
    """MGWR_stats(in_features, dependent_variable, model_type, explanatory_variables;explanatory_variables..., output_features, neighborhood_type, neighborhood_selection_method, {minimum_number_of_neighbors}, {maximum_number_of_neighbors}, {distance_unit}, {minimum_search_distance}, {maximum_search_distance}, {number_of_neighbors_increment}, {search_distance_increment}, {number_of_increments}, {number_of_neighbors}, {distance_band}, {number_of_neighbors_golden;number_of_neighbors_golden...}, {number_of_neighbors_manual;number_of_neighbors_manual...}, {number_of_neighbors_defined;number_of_neighbors_defined...}, {distance_golden;distance_golden...}, {distance_manual;distance_manual...}, {distance_defined;distance_defined...}, {prediction_locations}, {explanatory_variables_to_match;explanatory_variables_to_match...}, {output_predicted_features}, {robust_prediction}, {local_weighting_scheme}, {output_table}, {coefficient_raster_workspace}, {scale}, {number_of_neighbors_gradient;number_of_neighbors_gradient...}, {distance_gradient;distance_gradient...})

       Performs Multiscale Geographically Weighted Regression (MGWR), which
       is a local form of linear regression that models spatially varying
       relationships.

    INPUTS:
     in_features (Feature Layer):
         The feature class containing the dependent and explanatory variables.
     dependent_variable (Field):
         The numeric field containing the observed values that will be modeled.
     model_type (String):
         Specifies the regression model based on the values of the
         dependent variable. Currently, only continuous data is supported, and
         the parameter is hidden in thepane. Do not use categorical, count, or
         binary dependent variables. GeoprocessingCONTINUOUS-The
         dependent variable represents continuous values. This
         is the default.
     explanatory_variables (Field):
         A list of fields that will be used as independent explanatory
         variables in the regression model.
     neighborhood_type (String):
         Specifies whether the neighborhood will be a fixed distance or allowed
         to vary spatially depending on the density of the
         features.NUMBER_OF_NEIGHBORS-The neighborhood size will be a
         specified number
         of closest neighbors for each feature. Where features are dense, the
         spatial extent of the neighborhood will be smaller; where features are
         sparse, the spatial extent of the neighborhood will be
         larger.DISTANCE_BAND-The neighborhood size will be a constant or fixed
         distance for each feature.
     neighborhood_selection_method (String):
         Specifies how the neighborhood size will be
         determined.GOLDEN_SEARCH-An optimal distance or number of neighbors
         will be
         identified by minimizing the AICc value using the Golden Search
         algorithm. This option takes the longest time to calculate, especially
         for large or high-dimensional datasets.GRADIENT_SEARCH-An optimal
         distance or number of neighbors will be
         identified by minimizing the AICc value using the gradient-based
         optimization algorithm. This option runs the fastest and requires
         significantly less memory usage than Golden Search.MANUAL_INTERVALS-A
         distance or number of neighbors will be identified
         by testing a range of values and determining the value with the
         smallest AICc. If the neighborhood_type parameter is set to
         DISTANCE_BAND, the minimum value of this range is provided by the
         minimum_search_distance parameter. The minimum value is then
         incremented by the value specified in the search_distance_increment
         parameter. This is repeated the number of times specified by the
         number_of_increments parameter. If the neighborhood_type parameter is
         set to NUMBER_OF_NEIGHBORS, the minimum value, increment size, and
         number of increments are provided by the minimum_number_of_neighbors,
         number_of_neighbors_increment, and number_of_increments parameters,
         respectively.USER_DEFINED-The neighborhood size will be specified by
         either the
         number_of_neighbors parameter value or the distance_band parameter
         value.
     minimum_number_of_neighbors {Long}:
         The minimum number of neighbors that each feature will include in its
         calculation. It is recommended that you use at least 30 neighbors.
     maximum_number_of_neighbors {Long}:
         The maximum number of neighbors that each feature will include in its
         calculations.
     distance_unit {String}:
         Specifies the unit of distance that will be used to measure the
         distances between features.FEETINT-Distances will be measured in
         international
         feet.MILESINT-Distances will be measured in statute
         miles.FEET-Distances will be measured in US survey
         feet.METERS-Distances will be measured in meters.KILOMETERS-Distances
         will be measured in kilometers.MILES-Distances will be measured in US
         survey miles.
     minimum_search_distance {Double}:
         The minimum search distance that will be applied to every explanatory
         variable. It is recommended that you provide a minimum distance that
         includes at least 30 neighbors for each feature.
     maximum_search_distance {Double}:
         The maximum neighborhood search distance that will be applied to all
         variables.
     number_of_neighbors_increment {Long}:
         The number of neighbors by which manual intervals will increase for
         each neighborhood test.
     search_distance_increment {Double}:
         The distance by which manual intervals will increase for each
         neighborhood test.
     number_of_increments {Long}:
         The number of neighborhood sizes to test when using manual intervals.
         The first neighborhood size is the value of the
         minimum_number_of_neighbors or minimum_search_distance parameter.
     number_of_neighbors {Long}:
         The number of neighbors that will be used for the user-defined
         neighborhood type.
     distance_band {Double}:
         The size of the distance band that will be used for the user-defined
         neighborhood type. All features within this distance will be included
         as neighbors in the local models.
     number_of_neighbors_golden {Value Table}:
         The customized Golden Search options for individual explanatory
         variables. For each explanatory variable to be customized, provide the
         variable, the minimum number of neighbors, and the maximum number of
         neighbors in the columns.
     number_of_neighbors_manual {Value Table}:
         The customized manual intervals options for individual explanatory
         variables. For each explanatory variable to be customized, provide the
         minimum number of neighbors, number of neighbors increment, and number
         of increments in the columns.
     number_of_neighbors_defined {Value Table}:
         The customized user-defined options for individual explanatory
         variables. For each explanatory variable to be customized, provide the
         number of neighbors.
     distance_golden {Value Table}:
         The customized Golden Search options for individual explanatory
         variables. For each explanatory variable to be customized, provide the
         variable, the minimum search distance, and the maximum search distance
         in the columns.
     distance_manual {Value Table}:
         The customized manual intervals options for individual explanatory
         variables. For each variable to be customized, provide the variable,
         the minimum search distance, search distance increments, and number of
         increments in the columns.
     distance_defined {Value Table}:
         The customized user-defined options for individual explanatory
         variables. For each variable to be customized, provide the variable
         and the distance band in the columns.
     prediction_locations {Feature Layer}:
         A feature class with the locations where estimates will be computed.
         Each feature in this dataset should contain a value for every
         explanatory variables specified. The dependent variable for these
         features will be estimated using the model calibrated for the input
         feature class data. These feature locations should be close to (within
         115 percent of the extent) or within the same study area as the input
         features.
     explanatory_variables_to_match {Value Table}:
         The explanatory variables from the prediction locations that match
         corresponding explanatory variables from the input features.
     robust_prediction {Boolean}:
         Specifies the features that will be used in the prediction
         calculations.ROBUST-Features with values greater than three standard
         deviations
         from the mean (value outliers) and features with weights of 0 (spatial
         outliers) will be excluded from the prediction calculations but will
         receive predictions in the output feature class. This is the
         default.NON_ROBUST-Every feature will be used in the prediction
         calculations.
     local_weighting_scheme {String}:
         Specifies the kernel type that will be used to provide the spatial
         weighting in the model. The kernel defines how each feature is related
         to other features within its neighborhood.BISQUARE-A weight of zero
         will be assigned to any feature outside the
         neighborhood specified. This is the default.GAUSSIAN-All features will
         receive weights, but weights become
         exponentially smaller the farther away they are from the target
         feature.
     coefficient_raster_workspace {Workspace}:
         The workspace where the coefficient rasters will be created. When this
         workspace is provided, rasters are created for the intercept and every
         explanatory variable. This parameter is only available with a Desktop
         Advanced license. If a directory is provided, the rasters will be TIFF
         (.tif) raster type.
     scale {Boolean}:
         Specifies whether the values of the explanatory and dependent
         variables will be scaled to have mean zero and standard deviation one
         prior to fitting the model.SCALE_DATA-The values of the variables will
         be scaled. The results
         will contain scaled and unscaled versions of the explanatory variable
         coefficients.NO_SCALE_DATA-The values of the variables will not be
         scaled. All
         coefficients will be unscaled and in original data units.
     number_of_neighbors_gradient {Value Table}:
         The customized Gradient Search options for individual explanatory
         variables. For each explanatory variable to be customized, provide the
         variable, the minimum number of neighbors, and the maximum number of
         neighbors in the columns.
     distance_gradient {Value Table}:
         The customized Gradient Search options for individual explanatory
         variables. For each explanatory variable to be customized, provide the
         variable, the minimum search distance, and the maximum search distance
         in the columns.

    OUTPUTS:
     output_features (Feature Class):
         The new feature class containing the coefficients, residuals, and
         significance levels of the MGWR model.
     output_predicted_features {Feature Class}:
         The output feature class that will receive dependent variable
         estimates for every prediction location.
     output_table {Table}:
         A table containing the output statistics of the MGWR model. A bar
         chart of estimated bandwidths or numbers of neighbors will be included
         with the output."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.MGWR_stats(
                *gp_fixargs(
                    (
                        in_features,
                        dependent_variable,
                        model_type,
                        explanatory_variables,
                        output_features,
                        neighborhood_type,
                        neighborhood_selection_method,
                        minimum_number_of_neighbors,
                        maximum_number_of_neighbors,
                        distance_unit,
                        minimum_search_distance,
                        maximum_search_distance,
                        number_of_neighbors_increment,
                        search_distance_increment,
                        number_of_increments,
                        number_of_neighbors,
                        distance_band,
                        number_of_neighbors_golden,
                        number_of_neighbors_manual,
                        number_of_neighbors_defined,
                        distance_golden,
                        distance_manual,
                        distance_defined,
                        prediction_locations,
                        explanatory_variables_to_match,
                        output_predicted_features,
                        robust_prediction,
                        local_weighting_scheme,
                        output_table,
                        coefficient_raster_workspace,
                        scale,
                        number_of_neighbors_gradient,
                        distance_gradient,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("OrdinaryLeastSquares_stats", None)
def OrdinaryLeastSquares(
    Input_Feature_Class=None,
    Unique_ID_Field=None,
    Output_Feature_Class=None,
    Dependent_Variable=None,
    Explanatory_Variables=None,
    Coefficient_Output_Table=None,
    Diagnostic_Output_Table=None,
    Output_Report_File=None,
) -> Result:
    """OrdinaryLeastSquares_stats(Input_Feature_Class, Unique_ID_Field, Output_Feature_Class, Dependent_Variable, Explanatory_Variables;Explanatory_Variables..., {Coefficient_Output_Table}, {Diagnostic_Output_Table}, {Output_Report_File})

       Performs global Ordinary Least Squares (OLS) linear regression to
       generate predictions or to model a dependent variable in terms of its
       relationships to a set of explanatory variables.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class containing the dependent and independent variables
         for analysis.
     Unique_ID_Field (Field):
         An integer field containing a different value for every
         feature in the. Input Feature Class
     Dependent_Variable (Field):
         The numeric field containing values for what you are trying to model.
     Explanatory_Variables (Field):
         A list of fields representing explanatory variables in your regression
         model.

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         The output feature class that will receive dependent variable
         estimates and residuals.
     Coefficient_Output_Table {Table}:
         The full path to an optional table that will receive model
         coefficients, standardized coefficients, standard errors, and
         probabilities for each explanatory variable.
     Diagnostic_Output_Table {Table}:
         The full path to an optional table that will receive model summary
         diagnostics.
     Output_Report_File {File}:
         The path to the optional PDF file the tool will create. This report
         file includes model diagnostics, graphs, and notes to help you
         interpret the OLS results."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.OrdinaryLeastSquares_stats(
                *gp_fixargs(
                    (
                        Input_Feature_Class,
                        Unique_ID_Field,
                        Output_Feature_Class,
                        Dependent_Variable,
                        Explanatory_Variables,
                        Coefficient_Output_Table,
                        Diagnostic_Output_Table,
                        Output_Report_File,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PredictUsingSSMFile_stats", None)
def PredictUsingSSMFile(
    input_model=None,
    prediction_type: Literal["PREDICT_FEATURES", "PREDICT_RASTER"] | None = None,
    features_to_predict=None,
    output_features=None,
    output_raster=None,
    explanatory_variable_matching=None,
    explanatory_distance_matching=None,
    explanatory_rasters_matching=None,
) -> Result2[str, str]:
    """PredictUsingSSMFile_stats(input_model, prediction_type, {features_to_predict}, {output_features}, {output_raster}, {explanatory_variable_matching;explanatory_variable_matching...}, {explanatory_distance_matching;explanatory_distance_matching...}, {explanatory_rasters_matching;explanatory_rasters_matching...})

       Predicts continuous or categorical values using a trained spatial
       statistics model (.ssm file).

    INPUTS:
     input_model (File):
         The spatial statistics model file that will be used to make new
         predictions.
     prediction_type (String):
         Specifies the operation mode that will be used. The tool can predict
         new features or create a prediction raster
         surface.PREDICT_FEATURES-Predictions or classifications will be
         generated for
         features. Explanatory variables must be provided to match variables
         used to train the input model file. The output of this option will be
         a feature class and model diagnostics in the messages
         window.PREDICT_RASTER-A prediction raster will be generated for the
         area
         where the explanatory rasters intersect. Explanatory rasters must be
         provided to match the rasters used to train the input model file. The
         output of this option will be a prediction surface and model
         diagnostics in the messages window
     features_to_predict {Feature Layer}:
         The feature class representing locations where predictions will be
         made. This feature class must also contain any explanatory variables
         provided as fields that correspond to those used to train the input
         model.
     explanatory_variable_matching {Value Table}:
         A list of the explanatory variables of the input model and
         corresponding fields of the input prediction features. For each
         explanatory variable in thecolumn, provide the corresponding
         prediction field in thecolumn. Thecolumn specifies whether the
         variable is categorical or continuous.
         TrainingPredictionCategorical
     explanatory_distance_matching {Value Table}:
         A list of the explanatory distance features of the input model
         and corresponding prediction distance features. For each explanatory
         distance feature in thecolumn, provide the corresponding prediction
         distance feature in thecolumn. TrainingPrediction
     explanatory_rasters_matching {Value Table}:
         A list of the explanatory rasters of the input model and
         corresponding prediction rasters. For each explanatory raster in
         thecolumn, provide the corresponding prediction raster in thecolumn.
         Thecolumn specifies whether the raster is categorical or continuous.
         TrainingPredictionCategorical

    OUTPUTS:
     output_features {Feature Class}:
         The output feature class containing the prediction results.
     output_raster {Raster Dataset}:
         The output raster containing the prediction results. The default cell
         size will be the maximum cell size of the input rasters."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PredictUsingSSMFile_stats(
                *gp_fixargs(
                    (
                        input_model,
                        prediction_type,
                        features_to_predict,
                        output_features,
                        output_raster,
                        explanatory_variable_matching,
                        explanatory_distance_matching,
                        explanatory_rasters_matching,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PresenceOnlyPrediction_stats", None)
def PresenceOnlyPrediction(
    input_point_features=None,
    contains_background: Literal["PRESENCE_AND_BACKGROUND_POINTS", "PRESENCE_ONLY_POINTS"] | None = None,
    presence_indicator_field=None,
    explanatory_variables=None,
    distance_features=None,
    explanatory_rasters=None,
    basis_expansion_functions: list[Literal["LINEAR", "QUADRATIC", "PRODUCT", "HINGE", "THRESHOLD"]]
    | Literal["LINEAR", "QUADRATIC", "PRODUCT", "HINGE", "THRESHOLD"]
    | str
    | None = None,
    number_knots=None,
    study_area_type: Literal["CONVEX_HULL", "RASTER_EXTENT", "STUDY_POLYGON"] | None = None,
    study_area_polygon=None,
    spatial_thinning: Literal["THINNING", "NO_THINNING"] | None = None,
    thinning_distance_band=None,
    number_of_iterations=None,
    relative_weight=None,
    link_function: Literal["CLOGLOG", "LOGISTIC"] | None = None,
    presence_probability_cutoff=None,
    output_trained_features=None,
    output_trained_raster=None,
    output_response_curve_table=None,
    output_sensitivity_table=None,
    features_to_predict=None,
    output_pred_features=None,
    output_pred_raster=None,
    explanatory_variable_matching=None,
    explanatory_distance_matching=None,
    explanatory_rasters_matching=None,
    allow_predictions_outside_of_data_ranges: Literal["ALLOWED", "NOT_ALLOWED"] | None = None,
    resampling_scheme: Literal["NONE", "RANDOM"] | None = None,
    number_of_groups=None,
    output_trained_model=None,
) -> Result:
    """PresenceOnlyPrediction_stats(input_point_features, {contains_background}, {presence_indicator_field}, {explanatory_variables;explanatory_variables...}, {distance_features;distance_features...}, {explanatory_rasters;explanatory_rasters...}, {basis_expansion_functions;basis_expansion_functions...}, {number_knots}, {study_area_type}, {study_area_polygon}, {spatial_thinning}, {thinning_distance_band}, {number_of_iterations}, {relative_weight}, {link_function}, {presence_probability_cutoff}, {output_trained_features}, {output_trained_raster}, {output_response_curve_table}, {output_sensitivity_table}, {features_to_predict}, {output_pred_features}, {output_pred_raster}, {explanatory_variable_matching;explanatory_variable_matching...}, {explanatory_distance_matching;explanatory_distance_matching...}, {explanatory_rasters_matching;explanatory_rasters_matching...}, {allow_predictions_outside_of_data_ranges}, {resampling_scheme}, {number_of_groups}, {output_trained_model})

       Models the presence of a phenomenon given known presence locations and
       explanatory variables using a maximum entropy approach (MaxEnt). The
       tool provides output features and rasters that include the probability
       of presence and can be applied to problems in which only presence is
       known and absence is not known.

    INPUTS:
     input_point_features (Feature Layer):
         The point features representing locations where presence of a
         phenomenon of interest is known to occur.
     contains_background {Boolean}:
         Specifies whether the input point features contain background
         points.If the input points do not contain background points, the tool
         will
         generate background points using cells in the explanatory training
         rasters. The tool uses background points to model the characteristics
         of the landscape in unknown locations and compare them to landscape
         characteristics in known presence locations. Therefore, background
         points can be considered as the study area. Generally, these are
         locations where presence of a phenomenon of interest is unknown.
         However, if any information is known about the background points, the
         relative_weight parameter can be used to indicate
         this.PRESENCE_AND_BACKGROUND_POINTS-The input point features include
         background points.PRESENCE_ONLY_POINTS-The input point features do not
         include
         background points. This is the default.
     presence_indicator_field {Field}:
         The field from the input point features containing binary values that
         indicate each point as presence (1) or background (0). The field must
         be numeric.
     explanatory_variables {Value Table}:
         A list of fields representing the explanatory variables that will help
         predict the probability of presence. You can specify whether each
         variable is categorical or numeric. Specify the CATEGORICAL option for
         each variable that represents a class or category (such as land
         cover).
     distance_features {Feature Layer}:
         A list of feature layers or feature classes that will be used to
         automatically create explanatory variables that represent the distance
         from the input point features to the nearest provided distance
         features. If the input explanatory training distance features are
         polygons or lines, the distance attributes are calculated as the
         distance between the closest segment and the point.
     explanatory_rasters {Value Table}:
         A list of rasters that will be used to automatically create
         explanatory training variables in the model whose values are extracted
         from rasters. For each feature (presence and background points) in the
         input point features, the value of the raster cell will be extracted
         at that exact location.Bilinear raster resampling will be used when
         extracting the raster
         value for continuous rasters. Nearest neighbor assignment will be used
         when extracting a raster value from categorical rasters.You can
         specify whether each raster value is categorical or numeric.
         Specify the CATEGORICAL option for each raster that represents a class
         or category (such as land cover).
     basis_expansion_functions {String}:
         Specifies the basis function that will be used to transform the
         provided explanatory variables for use in the model. If multiple basis
         functions are selected, the tool will produce multiple transformed
         variables and attempt to use them in the model.LINEAR-A linear
         transformation to the input variables will be
         applied. This is the defaultPRODUCT-A pairwise multiplication on
         continuous explanatory variables
         will be used, yielding interaction variables. This option is only
         available when multiple explanatory variables have been
         provided.HINGE-The continuous explanatory variable values will be
         converted
         into two segments, a static segment (composed of zeroes or ones) and a
         linear function segment (increasing or decreasing).THRESHOLD-The
         continuous explanatory variable values will be
         converted into a binary variable composed of zeroes and
         ones.QUADRATIC-The square of each continuous explanatory variable
         value
         will be returned.
     number_knots {Long}:
         The number of knots that will be used by the hinge and threshold
         explanatory variable expansions. The value controls how many
         thresholds are created, which are used to create multiple explanatory
         variable expansions using each threshold. The value must be between 2
         and 50. The default is 10.
     study_area_type {String}:
         Specifies the type of study area that will be used to define where
         presence is possible when the input point features do not contain
         background points.CONVEX_HULL-The smallest convex polygon that
         encloses all the
         presence points in the input point features will be used. This is the
         defaultRASTER_EXTENT-The extent of the intersection of the explanatory
         training rasters will be used.STUDY_POLYGON-A custom study area that
         is defined by a polygon feature
         class will be used.
     study_area_polygon {Feature Layer}:
         A feature class containing the polygons that define a custom study
         area. The input point features must be located within the custom study
         area covered by the polygon features. A study area can be composed of
         multiple polygons.
     spatial_thinning {Boolean}:
         Specifies whether spatial thinning will be applied to presence and
         background points before training the model.Spatial thinning helps to
         reduce sampling bias by removing points and
         ensuring that remaining points have a minimum nearest-neighbor
         distance, set in the thinning_distance_band parameter. Spatial
         thinning is also applied to background points whether they are
         provided in input point features or generated by the
         tool.THINNING-Spatial thinning will be applied.NO_THINNING-Spatial
         thinning
         will not be applied. This is the default.
     thinning_distance_band {Linear Unit}:
         The minimum distance between any two presence points or any two
         background points when spatial thinning is applied.
     number_of_iterations {Long}:
         The number of runs that will be used to find the optimal spatial
         thinning solution, seeking to maintain as many presence and background
         points as possible while ensuring that no two presence or two
         background points are within the specified thinning_distance_band
         parameter value. The minimum possible is 1 iteration and the maximum
         possible is 50 iterations. The default is 10.This parameter is only
         applicable for spatial thinning applied to
         presence and background points in the input point features. Spatial
         thinning that is applied to background points generated from raster
         cells undergo spatial thinning by resampling the raster cells to the
         specified thinning_distance_band parameter value, without needing to
         iterate for an optimal solution.
     relative_weight {Long}:
         A value between 1 and 100 that specifies the relative information
         weight of presence points to background points. The default is 100.A
         higher value indicates that presence points are the primary source
         of information; it is unknown whether background points represent
         presence or absence and background points receive lower weight in the
         model. A lower value indicates that background points also contribute
         valuable information that can be used in conjunction with presence
         points; there is greater confidence that background points represent
         absence and their information can be used in the model as absence
         locations.
     link_function {String}:
         Specifies the function that will convert the unbounded outputs of the
         model to a number between 0 and 1. This value can be interpreted as
         the probability of presence at the location. Each option converts the
         same continuous value to a different probability.CLOGLOG-The C-log-
         log link function will be used to convert the
         predictions to probabilities. This option is recommended when the
         presence and location of a phenomenon is unambiguous, for example,
         when modeling the presence of an immobile plant species. This is the
         default.LOGISTIC-The logistic link function will be used to convert
         predictions to probabilities. This option is recommended when the
         presence and location of a phenomenon is ambiguous, for example, when
         modeling the presence of a migratory animal species.
     presence_probability_cutoff {Double}:
         A cutoff value between 0.01 and 0.99 that establishes which
         probabilities correspond with presence in the resulting
         classification. The cutoff value is used to help evaluate the model's
         performance using training data and known presence points.
         Classification diagnostics are provided in geoprocessing messages and
         in the output trained features.
     features_to_predict {Feature Layer}:
         The feature class representing locations where predictions will be
         made. The feature class must contain any provided explanatory variable
         fields that were used from the input point features.When using spatial
         thinning, you can use the original input point
         features as input prediction features to receive a prediction for the
         entire dataset.
     explanatory_variable_matching {Value Table}:
         The matching explanatory variable fields for the input point features
         and input prediction features.
     explanatory_distance_matching {Value Table}:
         The matching distance features for the training and prediction.
     explanatory_rasters_matching {Value Table}:
         The matching rasters for the training and prediction.
     allow_predictions_outside_of_data_ranges {Boolean}:
         ALLOWED-The prediction will allow extrapolation beyond the range of
         values used in training. This is the default.NOT_ALLOWED-The
         prediction will not allow extrapolation beyond the
         range of values used in training.
     resampling_scheme {String}:
         Specifies the method that will be used to perform cross validation of
         the prediction model. Cross validation excludes a portion of the data
         during training of the model and uses it to test the model's
         performance after it is trained.NONE-Cross validation will not be
         performed. This is the
         defaultRANDOM-The points will be randomly divided into groups, and
         each
         group will be left out once when performing cross validation. The
         number of groups is specified in the number_of_groups parameter.
     number_of_groups {Long}:
         The number of groups that will be used in cross validation for the
         random resampling scheme. A field in the output trained features
         indicates the group that each point was assigned to. The default is 3.
         A minimum of 2 groups and a maximum of 10 groups are allowed.

    OUTPUTS:
     output_trained_features {Feature Class}:
         An output feature class that will contain all features and explanatory
         variables used in the training of the model.
     output_trained_raster {Raster Dataset}:
         The output raster with cell values indicating the probability of
         presence using the selected link function. The default cell size is
         the maximum of the cell sizes of the explanatory training rasters. An
         output trained raster can only be created if the input point features
         do not contain background points.
     output_response_curve_table {Table}:
         The output table that will contain diagnostics from the training model
         that indicate the effect of each explanatory variable on the
         probability of presence after accounting for the average effects of
         all other explanatory variables in the model.The table will have up to
         two derived charts of partial dependence
         plots: one set of line charts for continuous variables and one set of
         bar charts for categorical variables.
     output_sensitivity_table {Table}:
         The output table that will contain diagnostics of training model
         accuracy as the probability presence cutoff changes from 0 to 1.
     output_pred_features {Feature Class}:
         The output feature class that will contain the results of the
         prediction model applied to the input prediction features.
     output_pred_raster {Raster Dataset}:
         The output raster containing the prediction results at each cell of
         the matched explanatory rasters. The default cell size is the maximum
         of the cell sizes of the explanatory training rasters.
     output_trained_model {File}:
         An output model file that will save the trained model, which can be
         used later for prediction."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PresenceOnlyPrediction_stats(
                *gp_fixargs(
                    (
                        input_point_features,
                        contains_background,
                        presence_indicator_field,
                        explanatory_variables,
                        distance_features,
                        explanatory_rasters,
                        basis_expansion_functions,
                        number_knots,
                        study_area_type,
                        study_area_polygon,
                        spatial_thinning,
                        thinning_distance_band,
                        number_of_iterations,
                        relative_weight,
                        link_function,
                        presence_probability_cutoff,
                        output_trained_features,
                        output_trained_raster,
                        output_response_curve_table,
                        output_sensitivity_table,
                        features_to_predict,
                        output_pred_features,
                        output_pred_raster,
                        explanatory_variable_matching,
                        explanatory_distance_matching,
                        explanatory_rasters_matching,
                        allow_predictions_outside_of_data_ranges,
                        resampling_scheme,
                        number_of_groups,
                        output_trained_model,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SpatialAssociationBetweenZones_stats", None)
def SpatialAssociationBetweenZones(
    input_feature_or_raster=None,
    categorical_zone_field=None,
    overlay_feature_or_raster=None,
    categorical_overlay_zone_field=None,
    output_features=None,
    output_raster=None,
    correspondence_overlay_to_input=None,
    correspondence_input_to_overlay=None,
) -> Result:
    """SpatialAssociationBetweenZones_stats(input_feature_or_raster, categorical_zone_field, overlay_feature_or_raster, categorical_overlay_zone_field, {output_features}, {output_raster}, {correspondence_overlay_to_input}, {correspondence_input_to_overlay})

       Measures the degree of spatial association between two
       regionalizations of the same study area in which each regionalization
       is composed of a set of categories, called zones. The association
       between the regionalizations is determined by the area overlap between
       zones of each regionalization. The association is highest when each
       zone of one regionalization closely corresponds to a zone of the other
       regionalization. Similarly, spatial association is lowest when the
       zones of one regionalization have large overlap with many different
       zones of the other regionalization. The primary output of the tool is
       a global measure of spatial association between the categorical
       variables: a single number ranging from 0 (no correspondence) to 1
       (perfect spatial alignment of zones). Optionally, this global
       association can be calculated and visualized for specific zones of
       either regionalization or for specific combinations of zones between
       regionalizations.

    INPUTS:
     input_feature_or_raster (Feature Layer / Raster Layer / Image Service):
         The dataset representing the zones of the first regionalization. The
         zones can be defined using polygon features or a raster.
     categorical_zone_field (Field):
         The field representing the zone category of the input zones.
         Each unique value of this field defines an individual zone. For
         features, the field must be integer or text. For rasters, thefield is
         also supported. VALUE
     overlay_feature_or_raster (Feature Layer / Raster Layer / Image Service):
         The dataset representing the zones of the second regionalization. The
         zones can be polygon features or a raster.
     categorical_overlay_zone_field (Field):
         The field representing the zone category of the overlay zones.
         Each unique value of this field defines an individual zone. For
         features, the field must be integer or text. For rasters, thefield is
         also supported. VALUE

    OUTPUTS:
     output_features {Feature Class}:
         The output polygon features containing spatial association measures at
         all intersections of the input and overlay zones.The output features
         can be used to measure the association between
         specific combinations of input and overlay zones, such as the
         association between areas of corn production (crop type) and areas of
         well-drained soil (soil drainage class). This parameter is only
         enabled if the input and overlay zones are both polygon features.
     output_raster {Raster Dataset}:
         The output raster containing spatial association measures between the
         input and overlay zones.The output raster will have three fields to
         indicate the spatial
         association measures for intersections of the input and overlay zones,
         correspondence of overlay zones within input zones, and correspondence
         of input zones within overlay zones. This parameter is only enabled if
         at least one of the input and overlay zones is a raster.
     correspondence_overlay_to_input {Feature Class}:
         The output polygon features containing the correspondence measures of
         the overlay zones within the input zones.This output will have the
         same geometry as the input zones and can be
         used to identify which input zones closely correspond overall to the
         overlay zones. Specific zone combinations can then be investigated
         with the output features. This parameter is only enabled if the input
         and overlay zones are both polygon features.
     correspondence_input_to_overlay {Feature Class}:
         The output polygon features containing the correspondence measures of
         the input zones within the overlay zones.This output will have the
         same geometry as the overlay zones and can
         be used to identify which overlay zones closely correspond overall to
         the input zones. Specific zone combinations can then be investigated
         with the output features. This parameter is only enabled if the input
         and overlay zones are both polygon features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SpatialAssociationBetweenZones_stats(
                *gp_fixargs(
                    (
                        input_feature_or_raster,
                        categorical_zone_field,
                        overlay_feature_or_raster,
                        categorical_overlay_zone_field,
                        output_features,
                        output_raster,
                        correspondence_overlay_to_input,
                        correspondence_input_to_overlay,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Spatial Component Utilities (Moran Eigenvectors) toolset
@gptooldoc("CompareNeighborhoodConceptualizations_stats", None)
def CompareNeighborhoodConceptualizations(
    in_features=None,
    input_fields=None,
    out_swm=None,
    id_field=None,
) -> Result1[str]:
    """CompareNeighborhoodConceptualizations_stats(in_features, input_fields;input_fields..., out_swm, id_field)

       Selects the spatial weights matrix (SWM) from a set of candidate SWMs
       that best represents the spatial patterns (such as trends or clusters)
       of one or more numeric fields.

    INPUTS:
     in_features (Feature Layer):
         The input features containing the fields that will be used to select
         the SWM.
     input_fields (Field):
         The input fields that will be used to select the SWM.
     id_field (Field):
         The unique ID field of the output .swm file. The field must be an
         integer and must have a unique value for each input feature.

    OUTPUTS:
     out_swm (File):
         The output .swm file of the neighbors and weights selected by the
         tool."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CompareNeighborhoodConceptualizations_stats(
                *gp_fixargs((in_features, input_fields, out_swm, id_field), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateSpatialComponentExplanatoryVariables_stats", None)
def CreateSpatialComponentExplanatoryVariables(
    in_features=None,
    input_fields=None,
    out_features=None,
    append_all_fields: Literal["ALL", "NO_FIELDS"] | None = None,
    in_swm=None,
    out_swm=None,
    id_field=None,
) -> Result2[str, str]:
    """CreateSpatialComponentExplanatoryVariables_stats(in_features, input_fields;input_fields..., out_features, {append_all_fields}, {in_swm}, {out_swm}, {id_field})

       Creates a set of spatial component fields that best describe the
       spatial patterns of one or more numeric fields and serve as useful
       explanatory variables in a prediction or regression model.

    INPUTS:
     in_features (Feature Layer):
         The input features containing fields of the explanatory and dependent
         variables that will be used in a prediction model.
     input_fields (Field):
         The input fields of the explanatory and dependent variables that will
         be used in a prediction model.
     append_all_fields {Boolean}:
         Specifies whether all fields will be copied from the input features to
         the output feature class.ALL-All fields from the input features will
         be copied to the output
         feature class. This is the default.NO_FIELDS-Only the input fields
         will be copied to the output feature
         class.
     in_swm {File}:
         The input SWM file (.swm). If a value is provided, the file will be
         used to define neighbors and weights of the input features. If no
         value is provided, the tool will test 28 different neighborhoods and
         use the one that creates components that are most effective as
         explanatory variables.
     id_field {Field}:
         The unique ID field of the output .swm file. The field must be an
         integer and must have a unique value for each input feature.

    OUTPUTS:
     out_features (Feature Class):
         The output features that will contain fields of the spatial components
         that can be used as additional explanatory variables in a prediction
         model.
     out_swm {File}:
         The output SWM file (.swm) of the neighbors and weights selected by
         the tool. This parameter does not apply if you provide an input .swm
         file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateSpatialComponentExplanatoryVariables_stats(
                *gp_fixargs(
                    (in_features, input_fields, out_features, append_all_fields, in_swm, out_swm, id_field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DecomposeSpatialStructure_stats", None)
def DecomposeSpatialStructure(
    in_features=None,
    out_features=None,
    append_all_fields: Literal["ALL", "NO_FIELDS"] | None = None,
    min_autocorrelation=None,
    max_components=None,
    neighborhood_type: Literal[
        "DISTANCE_BAND",
        "NUMBER_OF_NEIGHBORS",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "DELAUNAY_TRIANGULATION",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    distance_band=None,
    number_of_neighbors=None,
    weights_matrix_file=None,
    local_weighting_scheme: Literal["UNWEIGHTED", "BISQUARE", "GAUSSIAN"] | None = None,
    kernel_bandwidth=None,
    out_swm=None,
    id_field=None,
) -> Result2[str, str]:
    """DecomposeSpatialStructure_stats(in_features, out_features, {append_all_fields}, {min_autocorrelation}, {max_components}, {neighborhood_type}, {distance_band}, {number_of_neighbors}, {weights_matrix_file}, {local_weighting_scheme}, {kernel_bandwidth}, {out_swm}, {id_field})

       Decomposes a feature class and neighborhood into a set of spatial
       components. The components represent potential spatial patterns among
       the features, such as clusters or trends.

    INPUTS:
     in_features (Feature Layer):
         The point or polygon features that will be used to create the spatial
         components.
     append_all_fields {Boolean}:
         Specifies whether all fields will be copied from the input features to
         the output feature class.ALL-All fields from the input features will
         be copied to the output
         feature class. This is the default.NO_FIELDS-No fields will be copied
         to the output feature class.
     min_autocorrelation {Double}:
         The threshold value for including a spatial component. The value is a
         proportion of the largest possible Moran's I value for the spatial
         weights, and a component must have a larger Moran's I value than this
         threshold to be included. The default is 0.25, meaning that for a
         component to be included, it must have a Moran's I value that is at
         least 25 percent of the maximum possible Moran's I value. The value
         must be between 0 and 1, and smaller values will result in more
         components.
     max_components {Long}:
         The maximum number of spatial components that will be created. The
         default is 15.
     neighborhood_type {String}:
         Specifies how neighbors will be chosen for each input feature.
         Neighboring features must be identified in order to decompose the
         spatial structure of the input features.DISTANCE_BAND-Features within
         a specified critical distance of each
         feature will be included as neighbors. This is the default for point
         features.NUMBER_OF_NEIGHBORS-The closest features will be included as
         neighbors.CONTIGUITY_EDGES_ONLY-Polygon features that share an edge
         will be
         included as neighbors.CONTIGUITY_EDGES_CORNERS-Polygon features that
         share an edge or a
         corner will be included as neighbors. This is the default for polygon
         features.DELAUNAY_TRIANGULATION-Features whose Delaunay triangulation
         share an
         edge will be included as neighbors.GET_SPATIAL_WEIGHTS_FROM_FILE-
         Neighbors and weights will be defined
         by a specified spatial weights file.
     distance_band {Linear Unit}:
         The distance within which features will be included as neighbors. If
         no value is provided, one will be estimated during processing and
         included as a geoprocessing message. If the specified distance results
         in more than 1,000 neighbors, only the closest 1,000 features will be
         included as neighbors.
     number_of_neighbors {Long}:
         The number of neighbors that will be included for each feature. The
         number does not include the focal feature. The default is 8.
     weights_matrix_file {File}:
         The path and file name of the spatial weights matrix file (.swm) that
         defines the neighbors and weights between the input features.
     local_weighting_scheme {String}:
         Specifies the weighting scheme that will be applied to neighboring
         features.UNWEIGHTED-Neighbors will not be weighted. This is the
         default.BISQUARE-Neighbors will be weighted using a bisquare kernel
         scheme.GAUSSIAN-Neighbors will be weighted using a Gaussian kernel
         scheme.
     kernel_bandwidth {Linear Unit}:
         The bandwidth of the bisquare or Gaussian local weighting schemes. If
         no value is provided, one will be estimated during processing and
         included as a geoprocessing message.
     id_field {Field}:
         The unique ID field of the output spatial weights matrix file. The
         field must be an integer and must have a unique value for each input
         feature.

    OUTPUTS:
     out_features (Feature Class):
         The output feature class that will contain the spatial components as
         fields. The number of fields created depends on the
         min_autocorrelation and max_components parameter values.
     out_swm {File}:
         The output spatial weights matrix file (.swm) of the neighbors and
         weights of all pairs of features. If created, this file can be reused
         in tools that allow defining neighbors and weights with spatial
         weights matrix files."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DecomposeSpatialStructure_stats(
                *gp_fixargs(
                    (
                        in_features,
                        out_features,
                        append_all_fields,
                        min_autocorrelation,
                        max_components,
                        neighborhood_type,
                        distance_band,
                        number_of_neighbors,
                        weights_matrix_file,
                        local_weighting_scheme,
                        kernel_bandwidth,
                        out_swm,
                        id_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FilterSpatialAutocorrelationFromField_stats", None)
def FilterSpatialAutocorrelationFromField(
    in_features=None,
    input_field=None,
    out_features=None,
    append_all_fields: Literal["ALL", "NO_FIELDS"] | None = None,
    in_swm=None,
    out_swm=None,
    id_field=None,
) -> Result2[str, str]:
    """FilterSpatialAutocorrelationFromField_stats(in_features, input_field, out_features, {append_all_fields}, {in_swm}, {out_swm}, {id_field})

       Creates a spatially filtered version of an input field. The filtered
       variable will have no statistically significant spatial clustering but
       will maintain the core statistical properties of the field. The
       spatially filtered version of the field can then be used in analytical
       workflows (such as correlation or regression analysis) that assume the
       values at each location are spatially independent (not spatially
       clustered).

    INPUTS:
     in_features (Feature Layer):
         The input features containing the field that will be spatially
         filtered.
     input_field (Field):
         The input field that will be spatially filtered.
     append_all_fields {Boolean}:
         Specifies whether all fields will be copied from the input features to
         the output feature class.ALL-All fields from the input features will
         be copied to the output
         feature class. This is the default.NO_FIELDS-Only the input field will
         be copied to the output features.
     in_swm {File}:
         The input SWM file (.swm). If a value is provided, the file will be
         used to define neighbors and weights of the input features. If no
         value is provided, the tool will test 28 different neighborhoods and
         use the one that most effectively filters spatial autocorrelation from
         the input field.
     id_field {Field}:
         The unique ID field of the output .swm file. The field must be an
         integer and must have a unique value for each input feature.

    OUTPUTS:
     out_features (Feature Class):
         The output features containing a field of the spatially filtered input
         field and fields of the spatial components used to filter it.
     out_swm {File}:
         The output SWM file (.swm) of the neighbors and weights selected by
         the tool. This parameter does not apply if you provide an input .swm
         file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FilterSpatialAutocorrelationFromField_stats(
                *gp_fixargs(
                    (in_features, input_field, out_features, append_all_fields, in_swm, out_swm, id_field), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Utilities toolset
@gptooldoc("CalculateAreas_stats", None)
def CalculateAreas(
    Input_Feature_Class=None,
    Output_Feature_Class=None,
) -> Result1[str]:
    """CalculateAreas_stats(Input_Feature_Class, Output_Feature_Class)

       ‌

    INPUTS:
     Input_Feature_Class (Feature Layer):
         Input Feature Class

    OUTPUTS:
     Output_Feature_Class (Feature Class):
         Output Feature Class"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateAreas_stats(*gp_fixargs((Input_Feature_Class, Output_Feature_Class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateDistanceBand_stats", None)
def CalculateDistanceBand(
    Input_Features=None,
    Neighbors=None,
    Distance_Method: Literal["EUCLIDEAN_DISTANCE", "MANHATTAN_DISTANCE"] | None = None,
) -> Result3[str, str, str]:
    """CalculateDistanceBand_stats(Input_Features, Neighbors, Distance_Method)

       Returns the minimum, the maximum, and the average distance to the
       specified Nth nearest neighbor (N is an input parameter) for a set of
       features. Results are written as tool execution messages.

    INPUTS:
     Input_Features (Feature Layer):
         The feature class or layer used to calculate distance statistics.
     Neighbors (Long):
         The number of neighbors (N) to consider for each feature. This number
         should be any integer between one and the total number of features in
         the feature class. A list of distances between each feature and its
         Nth neighbor is compiled, and the maximum, minimum, and average
         distances are output to the Results window.
     Distance_Method (String):
         Specifies how distances are calculated from each feature to
         neighboring features.EUCLIDEAN_DISTANCE-The straight-line distance
         between two points (as
         the crow flies)MANHATTAN_DISTANCE-The distance between two points
         measured along axes
         at right angles (city block); calculated by summing the (absolute)
         difference between the x- and y-coordinates"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateDistanceBand_stats(*gp_fixargs((Input_Features, Neighbors, Distance_Method), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CalculateRates_stats", None)
def CalculateRates(
    in_table=None,
    rate_fields=None,
    append_to_input: Literal["APPEND", "NO_APPEND"] | None = None,
    out_table=None,
    rate_method: Literal[
        "CRUDE_RATE",
        "GLOBAL_EMPIRICAL_BAYES",
        "LOCAL_EMPIRICAL_BAYES",
        "LOCALLY_WEIGHTED_AVERAGE",
        "LOCALLY_WEIGHTED_MEDIAN",
    ]
    | None = None,
    probability_distribution: Literal["POISSON", "BINOMIAL"] | None = None,
    neighborhood_type: Literal[
        "DISTANCE_BAND",
        "CONTIGUITY_EDGES_ONLY",
        "CONTIGUITY_EDGES_CORNERS",
        "K_NEAREST_NEIGHBORS",
        "DELAUNAY_TRIANGULATION",
        "GET_SPATIAL_WEIGHTS_FROM_FILE",
    ]
    | None = None,
    distance_band=None,
    number_of_neighbors=None,
    weights_matrix_file=None,
    local_weighting_scheme: Literal["UNWEIGHTED", "BISQUARE", "GAUSSIAN"] | None = None,
    kernel_bandwidth=None,
    rate_multiplier=None,
) -> Result3[str, str | Table, str | Layer]:
    """CalculateRates_stats(in_table, rate_fields;rate_fields..., {append_to_input}, {out_table}, {rate_method}, {probability_distribution}, {neighborhood_type}, {distance_band}, {number_of_neighbors}, {weights_matrix_file}, {local_weighting_scheme}, {kernel_bandwidth}, {rate_multiplier})

       Calculates crude or smoothed rates. The global empirical Bayes rate
       method smooths the rates toward a global reference rate. The local
       empirical Bayes, locally weighted average, and locally weighted median
       rate methods use local neighbors to spatially smooth rates.

    INPUTS:
     in_table (Table View):
         The table or features containing count fields and population fields to
         calculate rates.
     rate_fields (Value Table):
         The count and population fields that will be used to calculate rates.
     append_to_input {Boolean}:
         Specifies whether fields will be appended to the input dataset or
         saved to an output table or feature class.APPEND-Fields will be
         appended to the input features. This modifies
         the input data.NO_APPEND-An output table or feature class containing
         the fields will
         be created. This is the default.
     rate_method {String}:
         Specifies the method that will be used to calculate
         rates.CRUDE_RATE-The rates will be calculated by dividing the count
         field
         values by the population field values. This is the
         default.GLOBAL_EMPIRICAL_BAYES-The rates will be the weighted average
         of the
         crude rate and the global average rate. The weight will depend on the
         feature's population size.LOCAL_EMPIRICAL_BAYES-The rates will be the
         weighted average of the
         focal feature's crude rate and the weighted average rate of its
         neighborhood.LOCALLY_WEIGHTED_AVERAGE-The rates will be the spatially
         weighted
         average rate of each feature and its
         neighborhood.LOCALLY_WEIGHTED_MEDIAN-The rates will be the spatially
         weighted
         median rate of each feature and its neighborhood.
     probability_distribution {String}:
         Specifies the probability distribution of the count field.POISSON-The
         count field is assumed to follow a Poisson distribution.
         This is the default.BINOMIAL-The count field is assumed to follow a
         binomial distribution.
     neighborhood_type {String}:
         Specifies the method that will be used to identify the neighbors of
         each feature.DISTANCE_BAND-A threshold distance is applied to identify
         neighbors.
         Every feature that is within the threshold distance of a focal feature
         is considered a neighbor. If the input contains point or line
         features, this is the default.CONTIGUITY_EDGES_ONLY-Polygon features
         that share an edge or overlap
         a feature become neighbors of that feature.CONTIGUITY_EDGES_CORNERS-
         Features that overlap, share an edge, or
         share a vertex with a feature are neighbors of that feature. If the
         input contains polygon features, this is the
         default.K_NEAREST_NEIGHBORS-The same number of neighbors, k, is
         assigned to
         every feature. The k nearest features to a feature become its
         neighbors.DELAUNAY_TRIANGULATION-A nonoverlapping mesh of triangles is
         created
         from feature centroids. Each feature is a triangle node and nodes that
         share edges are considered neighbors.GET_SPATIAL_WEIGHTS_FROM_FILE-The
         spatial relationships between
         features is defined in a spatial weights matrix (.swm) file.
     distance_band {Linear Unit}:
         The distance from each feature that will be used to search for
         neighbors. All features within this distance will be included as
         neighbors.
     number_of_neighbors {Long}:
         The number of neighbors that will be included in a feature's
         neighborhood.
     weights_matrix_file {File}:
         The path and file name of the spatial weights matrix file that defines
         the spatial relationships among features.
     local_weighting_scheme {String}:
         Specifies the weighting scheme that will be applied to neighbors when
         calculating local statistics.UNWEIGHTED-Neighbors will not be
         weighted. This is the
         default.BISQUARE-Neighbors will be weighted using a bisquare kernel
         scheme.GAUSSIAN-Neighbors will be weighted using a Gaussian kernel
         scheme.
     kernel_bandwidth {Linear Unit}:
         The bandwidth of the bisquare or Gaussian local weighting schemes. If
         no value is provided, one will be estimated during processing and
         included as a geoprocessing message.
     rate_multiplier {Long}:
         A constant value that will be multiplied by the rates. This parameter
         can be used to scale the rates or to report the rates per specific
         unit of population. For example, when the value is set to 10,000, the
         rates will be reported as a number per 10,000 people.

    OUTPUTS:
     out_table {Feature Class / Table}:
         The output table or feature class containing the rates and additional
         fields to help evaluate the rates."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CalculateRates_stats(
                *gp_fixargs(
                    (
                        in_table,
                        rate_fields,
                        append_to_input,
                        out_table,
                        rate_method,
                        probability_distribution,
                        neighborhood_type,
                        distance_band,
                        number_of_neighbors,
                        weights_matrix_file,
                        local_weighting_scheme,
                        kernel_bandwidth,
                        rate_multiplier,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CollectEvents_stats", None)
def CollectEvents(
    Input_Incident_Features=None,
    Output_Weighted_Point_Feature_Class=None,
) -> Result3[str, str, str]:
    """CollectEvents_stats(Input_Incident_Features, Output_Weighted_Point_Feature_Class)

       Converts event data, such as crime or disease incidents, to weighted
       point data.

    INPUTS:
     Input_Incident_Features (Feature Layer):
         The features representing event or incident data.

    OUTPUTS:
     Output_Weighted_Point_Feature_Class (Feature Class):
         The output feature class that will contain the weighted point data."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CollectEvents_stats(*gp_fixargs((Input_Incident_Features, Output_Weighted_Point_Feature_Class), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertSSPopup_stats", None)
def ConvertSSPopup(
    in_features=None,
    out_feature_class=None,
    img_width=None,
    img_height=None,
    rotate_x_axis_labels: Literal["ROTATE", "NO_ROTATE"] | None = None,
) -> Result1[str]:
    """ConvertSSPopup_stats(in_features, out_feature_class, {img_width}, {img_height}, {rotate_x_axis_labels})

       Prepares interactive pop-up charts for web display by saving them as
       image attachments to a feature class.

    INPUTS:
     in_features (Feature Layer):
         The feature class that contains thefield with the HTML code to
         create a pop-up chart. The feature class must have a 32 bit ObjectID -
         64 bit Object IDs are not supported. HTML_CHART
     img_width {Long}:
         The width, in pixels, of each image attachment.
     img_height {Long}:
         The height, in pixels, of each image attachment.
     rotate_x_axis_labels {Boolean}:
         Specifies whether the x-axis labels will be rotated.ROTATE-The x-axis
         labels will be rotated 20 degrees.NO_ROTATE-The
         x-axis labels will not be rotated. This is the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class that will contain the pop-up chart of each
         feature saved as an image attachment."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertSSPopup_stats(
                *gp_fixargs((in_features, out_feature_class, img_width, img_height, rotate_x_axis_labels), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConvertSpatialWeightsMatrixtoTable_stats", None)
def ConvertSpatialWeightsMatrixtoTable(
    Input_Spatial_Weights_Matrix_File=None,
    Output_Table=None,
) -> Result1[str]:
    """ConvertSpatialWeightsMatrixtoTable_stats(Input_Spatial_Weights_Matrix_File, Output_Table)

       Converts a binary spatial weights matrix file (.swm) to a table.

    INPUTS:
     Input_Spatial_Weights_Matrix_File (File):
         The full pathname for the spatial weights matrix file (.swm) you want
         to convert.

    OUTPUTS:
     Output_Table (Table):
         A full pathname to the table you want to create."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConvertSpatialWeightsMatrixtoTable_stats(
                *gp_fixargs((Input_Spatial_Weights_Matrix_File, Output_Table), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DescribeSSMFile_stats", None)
def DescribeSSMFile(
    input_model=None,
) -> Result3[str, str, str]:
    """DescribeSSMFile_stats(input_model)

       Describes the contents and diagnostics of a spatial statistics model
       file.

    INPUTS:
     input_model (File):
         The spatial statistics model file that will be described."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(gp.DescribeSSMFile_stats(*gp_fixargs((input_model,), True)))
        return retval
    except Exception as e:
        raise e


@gptooldoc("DimensionReduction_stats", None)
def DimensionReduction(
    in_table=None,
    output_data=None,
    fields=None,
    method: Literal["PCA", "LDA"] | None = None,
    scale: Literal["SCALE_DATA", "NO_SCALE_DATA"] | None = None,
    categorical_field=None,
    min_variance=None,
    min_components=None,
    append_fields: Literal["APPEND", "NO_APPEND"] | None = None,
    output_eigenvalues_table=None,
    output_eigenvectors_table=None,
    number_of_permutations: Literal["0", "99", "199", "499", "999"] | None = None,
    append_to_input: Literal["APPEND_TO_INPUT", "NEW_OUTPUT"] | None = None,
) -> Result:
    """DimensionReduction_stats(in_table, {output_data}, fields;fields..., {method}, {scale}, {categorical_field}, {min_variance}, {min_components}, {append_fields}, {output_eigenvalues_table}, {output_eigenvectors_table}, {number_of_permutations}, {append_to_input})

       Reduces the number of dimensions of a set of continuous variables by
       aggregating the highest possible amount of variance into fewer
       components using Principal Component Analysis (PCA) or Reduced-Rank
       Linear Discriminant Analysis (LDA).

    INPUTS:
     in_table (Table View):
         The table or features containing the fields with the dimension that
         will be reduced.
     fields (Field):
         The fields representing the data with the dimension that will be
         reduced.
     method {String}:
         Specifies the method that will be used to reduce the dimensions of the
         analysis fields.PCA-The analysis fields will be partitioned into
         components that each
         maintain the maximum proportion of the total variance. This is the
         default.LDA-The analysis fields will be partitioned into components
         that each
         maintain the maximum between-category separability of a categorical
         variable.
     scale {Boolean}:
         Specifies whether the values of each analysis will be scaled to have a
         variance equal to one. This scaling ensures that each analysis field
         is given equal priority in the components. Scaling also removes the
         effect of linear units; for example, the same data measured in meters
         and feet will result in equivalent components. The values of the
         analysis fields will be shifted to have mean zero for both
         options.SCALE_DATA-The values of each analysis field will be scaled to
         have a
         variance equal to one by dividing each value by the standard deviation
         of the analysis field. This is the default.NO_SCALE_DATA-The variance
         of each analysis field will not be scaled.
     categorical_field {Field}:
         The field representing the categorical variable for LDA. The
         components will maintain the maximum amount of information needed to
         classify each input record into these categories.
     min_variance {Double}:
         The minimum percent of total variance of the analysis fields that must
         be maintained in the components. The total variance depends on whether
         the analysis fields were scaled using the scale parameter.
     min_components {Long}:
         The minimum number of components.
     append_fields {Boolean}:
         Specifies whether all fields from the input table or features will be
         copied and appended to the output table or feature class. The fields
         provided in the fields parameter will be copied to the output
         regardless of the value of this parameter.APPEND-All fields from the
         input table or features will be copied and
         appended to the output table or feature class.NO_APPEND-Only the
         analysis fields will be included in the output
         table or feature class. This is the default.
     number_of_permutations {Long}:
         The number of permutations that will be used when determining the
         optimal number of components. The default value is 0, which indicates
         that no permutation test will be performed. The provided value must be
         equal to 0, 99, 199, 499, or 999. If any other value is provided, 0
         will be used and no permutation test will be performed.
     append_to_input {Boolean}:
         Specifies whether the component fields will be appended to the input
         dataset or saved to an output table or feature class. If you append
         the fields to the input, the output coordinate system environment will
         be ignored.APPEND_TO_INPUT-The fields containing the components will
         be appended
         to the input features. This option modifies the input
         data.NEW_OUTPUT-An output table or feature class will be created
         containing
         the component fields. This is the default.

    OUTPUTS:
     output_data {Feature Class / Table}:
         The output table or feature class containing the resulting components
         of the dimension reduction.
     output_eigenvalues_table {Table}:
         The output table containing the eigenvalues of each component. The
         values of the eigenvectors are rescaled to have unit norm (the sum of
         squared values equals one).
     output_eigenvectors_table {Table}:
         The output table containing the eigenvectors of each component."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DimensionReduction_stats(
                *gp_fixargs(
                    (
                        in_table,
                        output_data,
                        fields,
                        method,
                        scale,
                        categorical_field,
                        min_variance,
                        min_components,
                        append_fields,
                        output_eigenvalues_table,
                        output_eigenvectors_table,
                        number_of_permutations,
                        append_to_input,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExportXYv_stats", None)
def ExportXYv(
    Input_Feature_Class=None,
    Value_Field=None,
    Delimiter: Literal["SPACE", "COMMA", "SEMI-COLON", "TAB"] | None = None,
    Output_ASCII_File=None,
    Add_Field_Names_to_Output: Literal["ADD_FIELD_NAMES", "NO_FIELD_NAMES"] | None = None,
) -> Result1[str]:
    """ExportXYv_stats(Input_Feature_Class, Value_Field;Value_Field..., Delimiter, Output_ASCII_File, Add_Field_Names_to_Output)

       Exports feature class coordinates and attribute values to a space-,
       comma-, tab-, or semicolon-delimited ASCII text file.

    INPUTS:
     Input_Feature_Class (Feature Layer):
         The feature class from which the feature coordinates and attribute
         values will be exported.
     Value_Field (Field):
         The field or fields in the input feature class containing the values
         to export to an ASCII text file.
     Delimiter (String):
         Specifies how feature coordinates and attribute values will be
         separated in the output ASCII file.SPACE-Feature coordinates and
         attribute values will be separated by a
         space in the output. This is the default.COMMA-Feature coordinates and
         attribute values will be separated by a
         comma in the output.SEMI-COLON-Feature coordinates and attribute
         values will be separated
         by a semicolon in the output.TAB-Feature coordinates and attribute
         values will be separated by a
         tab in the output.
     Add_Field_Names_to_Output (Boolean):
         Specifies whether field names will be included as the first line in
         the output text file.ADD_FIELD_NAMES-Field names will be written to
         the output text
         file.NO_FIELD_NAMES-Field names will not be written to the output text
         file. This is the default.

    OUTPUTS:
     Output_ASCII_File (File):
         The ASCII text file that will contain the feature coordinates and
         attribute values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExportXYv_stats(
                *gp_fixargs(
                    (Input_Feature_Class, Value_Field, Delimiter, Output_ASCII_File, Add_Field_Names_to_Output), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SetSSMFileProperties_stats", None)
def SetSSMFileProperties(
    input_model=None,
    variable_predict=None,
    explanatory_variables=None,
    distance_features=None,
    explanatory_rasters=None,
) -> Result1[str]:
    """SetSSMFileProperties_stats(input_model, {variable_predict;variable_predict...}, {explanatory_variables;explanatory_variables...}, {distance_features;distance_features...}, {explanatory_rasters;explanatory_rasters...})

       Adds descriptions and units to the variables stored in a spatial
       statistics model file.

    INPUTS:
     input_model (File):
         The spatial statistics model file.
     variable_predict {Value Table}:
         The name, description, and unit of the variable that will be predicted
         at new locations.
     explanatory_variables {Value Table}:
         The name, description, and unit of the explanatory variables that will
         be used to train the input model.
     distance_features {Value Table}:
         The name, description, and unit of the explanatory training distance
         features that will be used to train the input model.
     explanatory_rasters {Value Table}:
         The name, description, and unit of the explanatory training rasters
         that will be used to train the input model."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SetSSMFileProperties_stats(
                *gp_fixargs(
                    (input_model, variable_predict, explanatory_variables, distance_features, explanatory_rasters), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TimeSeriesSmoothing_stats", None)
def TimeSeriesSmoothing(
    in_features=None,
    time_field=None,
    analysis_field=None,
    group_method: Literal["LOCATION", "ID_FIELD", "NONE"] | None = None,
    method: Literal["BACKWARD", "CENTERED", "FORWARD", "ADAPTIVE"] | None = None,
    time_window=None,
    append_to_input: Literal["APPEND_TO_INPUT", "NEW_OUTPUT"] | None = None,
    output_features=None,
    id_field=None,
    apply_shorter_window: Literal["APPLY_SHORTER_WINDOW", "NOT_APPLY_SHORTER_WINDOW"] | None = None,
    enable_time_series_popups: Literal["CREATE_POPUP", "NO_POPUP"] | None = None,
) -> Result2[str, str | Table]:
    """TimeSeriesSmoothing_stats(in_features, time_field, analysis_field, {group_method}, {method}, {time_window}, {append_to_input}, {output_features}, {id_field}, {apply_shorter_window}, {enable_time_series_popups})

       Smooths a numeric variable of one or more time series using centered,
       forward, and backward moving averages, as well as an adaptive method
       based on local linear regression. After smoothing short-term
       fluctuations, longer-term trends or cycles often become apparent.

    INPUTS:
     in_features (Table View):
         The features or table containing the time series data and the field to
         smooth.
     time_field (Field):
         The field containing the time of each record.
     analysis_field (Field):
         The field containing the values that will be smoothed.
     group_method {String}:
         Specifies the method that will be used to group records into different
         time series. Smoothing is performed independently for each time
         series.LOCATION-Features at the same location will be grouped in the
         same
         time series. This is the default.ID_FIELD-Records with the same value
         of the ID field will be grouped
         in the same time series.NONE-All records will be in the same time
         series.
     method {String}:
         Specifies the smoothing method that will be used.BACKWARD-The smoothed
         value is the average of the record and the
         values within the time window before it. This is the
         default.CENTERED-The smoothed value is the average of the record and
         the
         values before and after it. Half of the time window is used before the
         time of the record, and half is used after.FORWARD-The smoothed value
         is the average of the record and the values
         within the time window after it.ADAPTIVE-The smoothed value is the
         result of a local linear regression
         centered at the record. The size of the time window is optimized for
         each record.
     time_window {Time Unit}:
         The length of the time window. The value can be provided in seconds,
         minutes, hours, days, weeks, months, or years. For backward, forward,
         and centered moving averages, the value and unit must be provided. For
         adaptive bandwidth local linear regression, the value can be left
         empty and a time window will be estimated independently for each
         value. Values that fall on the border of the time window will be
         included within the window. For example, if you have daily data and
         you use a backward moving average with a time window of four days,
         five values will be included in the window when smoothing a record:
         the value of the record and the values of the four previous days.
     append_to_input {Boolean}:
         Specifies whether the output fields will be appended to the input
         dataset or saved as a new output table or feature class. If you append
         the fields to the input, the output coordinate system environment will
         be ignored.APPEND_TO_INPUT-The output fields will be appended to the
         input
         features. This option modifies the input data.NEW_OUTPUT-The output
         fields will not be appended to the input. An
         output table or a feature class will be created containing the output
         fields. This is the default.
     id_field {Field}:
         The integer or text field containing a unique ID for each time series.
         All records with the same value of this field are part of the same
         time series.
     apply_shorter_window {Boolean}:
         Specifies whether the time window will be shortened at the beginning
         and end of each time series.APPLY_SHORTER_WINDOW-The time window will
         be shortened at the start
         and end of the time series so that the time window does not extend
         before the start or after the end of the time
         series.NOT_APPLY_SHORTER_WINDOW-The time window will not be shortened.
         If the
         time window extends before the start or after the end of the time
         series, the smoothed value will be null. This is the default.
     enable_time_series_popups {Boolean}:
         Specifies whether the output features or table will include pop-up
         charts showing the original and smoothed values of the time
         series.CREATE_POPUP-The output will include pop-up charts. This is the
         default.NO_POPUP-The output will not include pop-up charts.

    OUTPUTS:
     output_features {Table}:
         The output features containing the smoothed values as well as fields
         for the time window and number of neighbors."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TimeSeriesSmoothing_stats(
                *gp_fixargs(
                    (
                        in_features,
                        time_field,
                        analysis_field,
                        group_method,
                        method,
                        time_window,
                        append_to_input,
                        output_features,
                        id_field,
                        apply_shorter_window,
                        enable_time_series_popups,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
