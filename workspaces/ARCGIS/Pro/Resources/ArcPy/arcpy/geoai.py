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
r"""The GeoAI toolbox contains tools for using and training AI models that
work with geospatial and tabular data. These tools use modern machine
learning and deep learning techniques and integrate them with GIS."""
from __future__ import annotations

__all__ = [
    "ClassifyTextUsingDeepLearning",
    "ExtractEntitiesUsingDeepLearning",
    "ExtractFeaturesUsingAIModels",
    "ForecastUsingTimeSeriesModel",
    "PredictUsingAutoML",
    "TrainEntityRecognitionModel",
    "TrainTextClassificationModel",
    "TrainTextTransformationModel",
    "TrainTimeSeriesForecastingModel",
    "TrainUsingAutoDL",
    "TrainUsingAutoML",
    "TransformTextUsingDeepLearning",
]
__alias__ = "geoai"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Feature and Tabular Analysis toolset
@gptooldoc("PredictUsingAutoML_geoai", None)
def PredictUsingAutoML(
    in_model_definition=None,
    prediction_type: Literal["PREDICT_FEATURE", "PREDICT_RASTER"] | None = None,
    in_features=None,
    explanatory_rasters=None,
    distance_features=None,
    out_prediction_features=None,
    out_prediction_surface=None,
    match_explanatory_variables=None,
    match_distance_variables=None,
    match_explanatory_rasters=None,
    get_prediction_explanations: Literal["TRUE", "FALSE"] | None = None,
) -> Result2[str, str]:
    """PredictUsingAutoML_geoai(in_model_definition, prediction_type, in_features, {explanatory_rasters;explanatory_rasters...}, {distance_features;distance_features...}, {out_prediction_features}, {out_prediction_surface}, {match_explanatory_variables;match_explanatory_variables...}, {match_distance_variables;match_distance_variables...}, {match_explanatory_rasters;match_explanatory_rasters...}, {get_prediction_explanations})

       Predicts continuous variables (regression) or categorical variables
       (classification) on unseen compatible datasets using a trained .dlpk
       model produced by the Train Using AutoML tool.

    INPUTS:
     in_model_definition (File):
         The .dlpk file or the .emd file.
     prediction_type (String):
         Specifies the output file type that will be created.
         PREDICT_FEATURE-A feature layer containing the prediction
         values will be created. Thevalue is required for this option.
         Output Prediction Features         PREDICT_RASTER-A raster layer
         containing the prediction
         values will be created. Thevalue is required for this option.
         Output Prediction Surface
     in_features (Feature Layer / Table View / Feature Class):
         The features for which the prediction will be obtained. The input
         should include some or all the fields necessary to determine the
         dependent variable value. This parameter is required if the
         prediction_type parameter is set to PREDICT_FEATURE.
     explanatory_rasters {Raster Layer}:
         A list of rasters that contain the explanatory rasters necessary to
         determine the dependent variable value. This parameter is required if
         the prediction_type parameter is set to PREDICT_RASTER.
     distance_features {Feature Layer}:
         The point or polygon features whose distances from the input training
         features will be estimated automatically and added as explanatory
         variables. Distances will be calculated from each of the input
         explanatory training distance features to the nearest input training
         features. If the input explanatory training distance features are
         polygons, the distance attributes will be calculated as the distance
         between the closest segments of the pair of features.
     match_explanatory_variables {Value Table}:
         The mapping of field names from the prediction set to the training
         set. Use this parameter if the field names of the training and
         prediction sets are different. The values are the field names in the
         prediction dataset that match the field names in the input feature
         class.
     match_distance_variables {Value Table}:
         The mapping of distance feature names from the prediction set to the
         training set. Use this parameter if the distance feature names used in
         the training and prediction sets are different. The string values are
         the feature names that were used for prediction that match the
         distance features names used for training.
     match_explanatory_rasters {Value Table}:
         The mapping of names from the prediction rasters to the training
         rasters. Use this parameter if the names of the explanatory rasters
         used for prediction and the names of the corresponding rasters used
         during training are different. The string values are the explanatory
         raster names that were used for prediction that match the explanatory
         raster names used for training.
     get_prediction_explanations {Boolean}:
         Specifies whether fields representing feature importance will be
         added.TRUE-Fields representing feature importance will be added.
         Fields will
         be generated for every predicted sample along with the prediction
         values.FALSE-Fields representing feature importance will not be
         generated.
         This is the default.

    OUTPUTS:
     out_prediction_features {Feature Class / Table}:
         The output table or feature class.
     out_prediction_surface {Folder}:
         The path to where the output prediction raster will be saved."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PredictUsingAutoML_geoai(
                *gp_fixargs(
                    (
                        in_model_definition,
                        prediction_type,
                        in_features,
                        explanatory_rasters,
                        distance_features,
                        out_prediction_features,
                        out_prediction_surface,
                        match_explanatory_variables,
                        match_distance_variables,
                        match_explanatory_rasters,
                        get_prediction_explanations,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainUsingAutoML_geoai", None)
def TrainUsingAutoML(
    in_features=None,
    out_model=None,
    variable_predict=None,
    treat_variable_as_categorical: Literal["CATEGORICAL", "CONTINUOUS"] | None = None,
    explanatory_variables=None,
    distance_features=None,
    explanatory_rasters=None,
    total_time_limit=None,
    autoML_mode: Literal["BASIC", "INTERMEDIATE", "ADVANCED"] | None = None,
    algorithms: list[
        Literal["RANDOM TREES", "XGBOOST", "LIGHT GBM", "DECISION TREE", "EXTRA TREE", "LINEAR", "CATBOOST"]
    ]
    | Literal["RANDOM TREES", "XGBOOST", "LIGHT GBM", "DECISION TREE", "EXTRA TREE", "LINEAR", "CATBOOST"]
    | str
    | None = None,
    validation_percent=None,
    out_report=None,
    out_importance=None,
    out_features=None,
    add_image_attachments=None,
    sensitive_feature=None,
    fairness_metric: Literal[
        "DEMOGRAPHIC_PARITY_RATIO",
        "DEMOGRAPHIC_PARITY_DIFFERENCE",
        "EQUALISED_ODDS_RATIO",
        "EQUALISED_ODDS_DIFFERENCE",
        "GROUP_LOSS_RATIO",
    ]
    | None = None,
) -> Result:
    """TrainUsingAutoML_geoai(in_features, out_model, variable_predict, {treat_variable_as_categorical}, {explanatory_variables;explanatory_variables...}, {distance_features;distance_features...}, {explanatory_rasters;explanatory_rasters...}, {total_time_limit}, {autoML_mode}, {algorithms;algorithms...}, {validation_percent}, {out_report}, {out_importance}, {out_features}, {add_image_attachments}, {sensitive_feature;sensitive_feature...}, {fairness_metric})

       Trains a deep learning model by building training pipelines and
       automating much of the training process. This includes exploratory
       data analysis, feature selection, feature engineering, model
       selection, hyperparameter tuning, and model training. Its outputs
       include performance metrics of the best model on the training data, as
       well as the trained deep learning model package (.dlpk) that can be
       used as input for the Predict Using AutoML tool to predict on a new
       dataset.

    INPUTS:
     in_features (Feature Layer / Table View / Feature Class):
         The input feature class that will be used to train the model.
     variable_predict (Field):
         A field from the in_features parameter that contains the values that
         will be used to train the model. This field contains known (training)
         values of the variable that will be used to predict at unknown
         locations.
     treat_variable_as_categorical {Boolean}:
         Specifies whether the variable_predict parameter value will be treated
         as a categorical variable.CATEGORICAL-The variable_predict parameter
         value will be treated as a
         categorical variable and classification will be
         performed.CONTINUOUS-The variable_predict parameter value will be
         treated as
         continuous and regression will be performed. This is the default.
     explanatory_variables {Value Table}:
         A list of fields representing the explanatory variables that will help
         predict the value or category of the variable_predict parameter value.
         Pass the true value ("<name_of_variable> true") for any variables that
         represent classes or categories (such as land cover, presence, or
         absence).
     distance_features {Feature Layer}:
         The features whose distances from the input training features will be
         estimated automatically and added as more explanatory variables.
         Distances will be calculated from each of the input explanatory
         training distance features to the nearest input training features.
         Point and polygon features are supported, and if the input explanatory
         training distance features are polygons, the distance attributes will
         be calculated as the distance between the closest segments of the pair
         of features.
     explanatory_rasters {Value Table}:
         The rasters whose values will be extracted from the raster and
         considered as explanatory variables for the model. Each layer forms
         one explanatory variable. For each feature in the input training
         features, the value of the raster cell will be extracted at that exact
         location. Bilinear raster resampling will be used when extracting the
         raster value for continuous rasters. Nearest neighbor assignment will
         be used when extracting a raster value from categorical rasters. If
         the in_features parameter value has polygons, and you provided a value
         for this parameter, one raster value for each polygon will be used in
         the model. Each polygon is assigned the average value for continuous
         rasters and the majority for categorical rasters. Pass the true value
         using "<name_of_raster> true" for any raster that depicts classes or
         categories such as land cover, vegetation, or soil type.
     total_time_limit {Double}:
         The total time limit in minutes it takes for AutoML model training.
         The default is 240 (4 hours).
     autoML_mode {String}:
         Specifies the goal of AutoML and how intensive the AutoML search will
         be.BASIC-Basic is used to explain the significance of the different
         variables and the data. Feature engineering, feature selection, and
         hyperparameter tuning will not be performed. Full descriptions and
         explanations for model learning curves, feature importance plots
         generated for tree-based models, and SHAP plots for all other models
         will be included in reports. This mode takes the least amount of
         processing time. This is the default.INTERMEDIATE-Intermediate is used
         to train a model that will be used
         in real-life use cases. This mode uses 5-fold cross validation (CV)
         and produces output of learning curves and importance plots in the
         reports, but SHAP plots are not available.ADVANCED-Advanced is used
         for machine learning competitions (for
         maximum performance). This mode uses 10-fold cross validation (CV) and
         performs feature engineering, feature selection, and hyperparameter
         tuning. Input training features are assigned to multiple spatial grids
         of different sizes based on their location, and the corresponding grid
         IDs are passed as additional categorical explanatory variables to the
         model. The report only includes learning curves; model explainability
         is not available.
     algorithms {String}:
         Specifies the algorithms that will be used during the
         training.LINEAR-The Linear regression supervised algorithm will be
         used to
         train a regression machine learning model. If this is the only option
         specified, ensure that the total number of records is less than 10.000
         and the number of columns is less than 1,000. Other models can
         accommodate larger datasets and it is recommended that you use this
         option with other algorithms and not as the sole algorithm.RANDOM
         TREES-The Random Trees decision tree-based supervised machine
         learning algorithm will be used. It can be used for both
         classification and regression.XGBOOST-The XGBoost (extreme gradient
         boosting) supervised machine
         learning algorithm will be used. It can be used for both
         classification and regression.LIGHT GBM-The Light GBM gradient
         boosting ensemble algorithm, which is
         based on decision trees, will be used. It can be used for both
         classification and regression. Light GBM is optimized for high
         performance with distributed systems.DECISION TREE-The Decision Tree
         supervised machine learning
         algorithm, which classifies or regresses the data using true and false
         answers to certain questions, will be used. Decision trees are easily
         understood and are good for explainability.EXTRA TREE-The Extra Tree
         (extremely randomized trees) ensemble
         supervised machine learning algorithm, which uses decision trees, will
         be used. This algorithm is similar to Random Trees but can be
         faster.CATBOOST-The CatBoost algorithm will be used. It uses decision
         trees
         for classification and regression. This option can use a combination
         of categorical and noncategorical explanatory variables without
         preprocessing.By default, all the algorithms will be used.
     validation_percent {Long}:
         The percentage of input data that will be used for validation. The
         default value is 10.
     add_image_attachments {Boolean}:
         Specifies whether images will be used as explanatory variables from
         the in_features parameter value for training a multimodal or mixed
         data model. Training a multimodal or mixed data tabular model involves
         using machine and deep learning backbones in AutoML to learn from
         multiple types of data formats by a single model. The input data can
         consist of a combination of explanatory variables from a diverse set
         of data sources such as text descriptions, corresponding images, and
         any additional categorical and continuous variables.TRUE-The image
         attachments will be downloaded and treated as
         explanatory variables and multimodal data training will be
         performed.FALSE-The image attachments will not be used during the
         training. This
         is the default.
     sensitive_feature {Value Table}:
         Assesses and improves the fairness of the trained models for
         tabular data for classification and regression models. Set the
         following two components for this parameter:        Sensitive
         Features-An attribute such as race, gender, socioeconomic
         status, or age that can introduce bias in machine learning or deep
         learning models. By selecting sensitive features such as race, gender,
         socioeconomic status, or age, biases associated with the specific
         sensitive features are mitigated for an unbiased model.Underprivileged
         Groups-The discriminated group from the Sensitive
         Features value provided.
     fairness_metric {String}:
         Specifies the fairness metrics that will be used for measuring
         fairness for classification and regression problems, which are used
         for grid searches for selecting the best fair
         model.DEMOGRAPHIC_PARITY_RATIO-This metric is used in classification
         models.
         The ratio of selection rates between different groups of individuals
         will be measured. The selection rate is the proportion of individuals
         who are classified as positive by the model. The ideal value for this
         metric is 1, which indicates that the selection rates for different
         groups are equal. Fairness for this metric is between 0.8 to 1,
         meaning that the ratio of selection rates between groups should be no
         more than 20 percent.DEMOGRAPHIC_PARITY_DIFFERENCE-This metric is used
         in classification
         models. It is similar to the demographic parity ratio metric, but the
         difference in selection rates between different groups of individuals
         will be measured, rather than the ratio. The selection rate is the
         proportion of individuals who are classified as positive by the model.
         The ideal value for this metic is 0, which indicates that there is no
         difference in selection rates between groups. Fairness for this metric
         is between 0 to 0.25, meaning that differences in selection rates
         between groups should be no more than 25
         percent.EQUALISED_ODDS_RATIO-This metric is used in classification
         models. The
         ratio of error rates between groups of individuals, such as different
         racial ro gender groups, will be measured. The ideal value for this
         metric is 1, which indicates that the error rates for different groups
         are equal. Fairness for this metric is between 0.8 to 1, meaning that
         the ratio of error between groups should be no more than 20
         percent.EQUALISED_ODDS_DIFFERENCE-This metric is used in
         classification
         models. It is similar to the equalized odds ratio metric, but the
         difference in error between different groups of individuals will be
         measured, rather than the ratio. The ideal value for this metric is 0,
         which indicates that there is no difference in error between groups.
         Fairness for this metric is between 0 to 0.25, meaning that difference
         in error between groups should be no more than 25
         percent.GROUP_LOSS_RATIO-This metric is used in regression models. The
         ratio
         of the average loss or error for one subgroup compared to another
         subgroup will be measured. It provides a relative measure of the
         disparity in losses between groups. A value of 1 indicates no
         difference in losses between the groups, while values greater or
         smaller than 1 indicate relative disparities.

    OUTPUTS:
     out_model (File):
         The output trained model that will be saved as a deep learning package
         (.dlpk file).
     out_report {File}:
         The output report that will be generated as an .html file. If the path
         provided is not empty, the report will be created in a new folder
         under the provided path. The report will contain details of the
         various models as well as details of the hyperparameters that were
         used during the evaluation and the performance of each model.
         Hyperparameters are parameters that control the training process. They
         are not updated during training and include model architecture,
         learning rate, number of epochs, and so on.
     out_importance {Table}:
         An output table containing information about the importance of each
         explanatory variable (fields, distance features, and rasters) used in
         the model.
     out_features {Feature Class}:
         The feature layer containing the predicted values by the best
         performing model on the training feature layer. It can be used to
         verify model performance by visually comparing the predicted values
         with the ground truth."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainUsingAutoML_geoai(
                *gp_fixargs(
                    (
                        in_features,
                        out_model,
                        variable_predict,
                        treat_variable_as_categorical,
                        explanatory_variables,
                        distance_features,
                        explanatory_rasters,
                        total_time_limit,
                        autoML_mode,
                        algorithms,
                        validation_percent,
                        out_report,
                        out_importance,
                        out_features,
                        add_image_attachments,
                        sensitive_feature,
                        fairness_metric,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Imagery AI toolset
@gptooldoc("ExtractFeaturesUsingAIModels_geoai", None)
def ExtractFeaturesUsingAIModels(
    in_raster=None,
    mode: Literal["Infer and Postprocess", "Only Postprocess"] | None = None,
    out_location=None,
    out_prefix=None,
    area_of_interest=None,
    pretrained_models=None,
    additional_models=None,
    confidence_threshold=None,
    save_intermediate_output: Literal["TRUE", "FALSE"] | None = None,
    test_time_augmentation: Literal["TRUE", "FALSE"] | None = None,
    buffer_distance=None,
    extend_length=None,
    smoothing_tolerance=None,
    dangle_length=None,
    in_road_features=None,
    road_buffer_width=None,
    regularize_parcels: Literal["TRUE", "FALSE"] | None = None,
    post_processing_workflow: Literal["Line Regularization", "Parcel Regularization", "Polygon Regularization"]
    | None = None,
    out_features=None,
    parcel_tolerance=None,
    regularization_method: Literal["Right Angles", "Right Angles and Diagonals", "Any Angles", "Circle"] | None = None,
    poly_tolerance=None,
    prompt: Literal["Centroid", "Bounding Box", "None"] | None = None,
    in_features=None,
    out_summary=None,
) -> Result2[str, str]:
    """ExtractFeaturesUsingAIModels_geoai(in_raster, mode, out_location, out_prefix, {area_of_interest}, {pretrained_models;pretrained_models...}, {additional_models;additional_models...}, {confidence_threshold}, {save_intermediate_output}, {test_time_augmentation}, {buffer_distance}, {extend_length}, {smoothing_tolerance}, {dangle_length}, {in_road_features}, {road_buffer_width}, {regularize_parcels}, {post_processing_workflow}, {out_features}, {parcel_tolerance}, {regularization_method}, {poly_tolerance}, {prompt}, {in_features}, {out_summary})

       Runs one or more pretrained deep learning models on an input raster to
       extract features and automate the postprocessing of the inferenced
       outputs.

    INPUTS:
     in_raster (Raster Layer / Raster Dataset / Mosaic Layer):
         The input raster on which processing will be performed.If the mode
         parameter is specified as Only Postprocess, a raster with
         binary classification is required for this parameter.
     mode (String):
         Specifies the mode that will be used for the processing of the input
         raster.Infer and Postprocess-Features will be extracted from the
         imagery and
         postprocessed. This is the default.Only Postprocess-The input raster
         will be directly postprocessed. A
         single band raster with binary classification is required for this
         option.
     out_location (Workspace):
         The file geodatabase where the intermediate output from the models and
         the final postprocessed output will be stored.
     out_prefix (String):
         A prefix that will be added to the name of the outputs that will be
         saved to the output location. The prefix will also be used as the name
         of a group layer that will be used to display all outputs.
     area_of_interest {Feature Set}:
         The geographical extent that will be used to extract features. Only
         features within the area of interest will be extracted.
     pretrained_models {String}:
         The ArcGIS pretrained models from ArcGIS Living Atlas of the World
         that can be used on the provided input raster. This parameter requires
         an internet connection to download the pretrained models.
     additional_models {Value Table}:
         The deep learning models that can be used on the provided input raster
         and the postprocessing workflow that will be used for additional model
         files (.dlpk and .emd). Available postprocessing workflows are as
         follows:Line Regularization-The postprocessing workflow will extract
         line
         features from a single band raster with binary classification and
         generate a polyline feature class after refining it. This workflow
         also supports deep learning models that generate polyline feature
         classes.Parcel Regularization-The postprocessing workflow will extract
         parcels
         from a single band raster with binary classification and generate a
         polygon feature class after refining it.Polygon Regularization-The
         postprocessing workflow will generate a
         polygon feature class after refining it. This workflow is only
         compatible with object detection models.Polygon Segmentation-The
         postprocessing workflow will generate a
         polygon feature class containing the detected objects using their
         centroid or bounding box. The segmentation method is specified using
         the prompt parameter.None-No postprocessing workflow will be applied.
         This is the default.
     confidence_threshold {Double}:
         The minimum confidence of deep learning model that will be used when
         detecting objects. The value must be between 0 and 1.
     save_intermediate_output {Boolean}:
         Specifies whether the intermediate outputs will be saved to the output
         location. The term intermediate outputs refers to the results
         generated after the model has been inferenced.TRUE-The intermediate
         outputs will be saved to the output
         location.FALSE-The intermediate outputs will not be saved. This is the
         default.
     test_time_augmentation {Boolean}:
         Specifies whether predictions of flipped and rotated variants of the
         input image will be merged into the final output.TRUE-Predictions of
         flipped and rotated variants of the input image
         will be merged into the final output.FALSE-Predictions of flipped and
         rotated variants of the input image
         will not be merged into the final output. This is the default.
     buffer_distance {Linear Unit}:
         The distance that will be used to buffer polyline features before they
         are used in postprocessing. The default is 15 meters.
     extend_length {Linear Unit}:
         The maximum distance a line segment will be extended to an
         intersecting feature. The default is 25 meters.
     smoothing_tolerance {Linear Unit}:
         The tolerance used by the Polynomial Approximation with Exponential
         Kernel (PAEK) algorithm. The default is 30 meters.
     dangle_length {Linear Unit}:
         The length at which line segments that do not touch another line at
         both endpoints (dangles) will be trimmed. The default is 5 meters.
     in_road_features {Feature Layer / Feature Class}:
         A road feature class that will be used for refining the parcels. The
         input can be a polygon or polyline feature class.
     road_buffer_width {Linear Unit}:
         The buffer distance that will be used for the input road features. The
         default value is 5 meters for polyline features and 0 meters for
         polygon features.
     regularize_parcels {Boolean}:
         Specifies whether extracted parcels will be normalized by eliminating
         undesirable artifacts in their geometry.TRUE-Extracted parcels will be
         normalized. This is the
         default.FALSE-Extracted parcels will not be normalized.
     post_processing_workflow {String}:
         Specifies the postprocessing workflow that will be used.Line
         Regularization-Line features will be extracted from a single band
         raster with binary classification and a polyline feature class will be
         generated after refining it.Parcel Regularization-Parcels will be
         extracted from a single band
         raster with binary classification and a polygon feature class will be
         generated after refining it.Polygon Regularization-A polygon feature
         class will be generated
         after refining it. This workflow is only compatible with object
         detection models.
     parcel_tolerance {Linear Unit}:
         The minimum distance between coordinates before they are considered
         equal. This parameter is used to reduce slivers between extracted
         parcels. The default is 3 meters.
     regularization_method {String}:
         Specifies the regularization method that will be used in
         postprocessing.Right Angles-Shapes composed of 90° angles between
         adjoining edges
         will be constructed. This is the default.Right Angles and
         Diagonals-Shapes composed of 45° and 90° angles
         between adjoining edges will be constructed.Any Angles-Shapes that
         form any angles between adjoining edges will be
         constructed.Circle-The maximum distance from the boundary of the
         feature being
         processed will be used.
     poly_tolerance {Linear Unit}:
         The maximum distance that the regularized footprint can deviate from
         the boundary of its originating feature. The default is 1 meter.
     prompt {String}:
         Specifies the segmentation method that will be used when the
         additional_models parameter is set to Polygon Segmentation.Centroid-
         The centroid of the detections will be used to indicate to
         the polygon segmentation model what to segment in the input
         raster.Bounding Box-The bounding box of the detections will be used
         to
         indicate to the polygon segmentation model what to segment in the
         input raster.None-No segmentation method will be used. This is the
         default
     in_features {Feature Layer / Feature Class}:
         The feature class on which postprocessing will be performed. This
         parameter is only supported when the post_processing_workflow
         parameter is set to Line Regularization or Polygon Regularization.

    OUTPUTS:
     out_features {Feature Class}:
         The feature class containing the postprocessed output.
     out_summary {Table}:
         The table that will contain a list of outputs that were generated
         along with their respective paths."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractFeaturesUsingAIModels_geoai(
                *gp_fixargs(
                    (
                        in_raster,
                        mode,
                        out_location,
                        out_prefix,
                        area_of_interest,
                        pretrained_models,
                        additional_models,
                        confidence_threshold,
                        save_intermediate_output,
                        test_time_augmentation,
                        buffer_distance,
                        extend_length,
                        smoothing_tolerance,
                        dangle_length,
                        in_road_features,
                        road_buffer_width,
                        regularize_parcels,
                        post_processing_workflow,
                        out_features,
                        parcel_tolerance,
                        regularization_method,
                        poly_tolerance,
                        prompt,
                        in_features,
                        out_summary,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainUsingAutoDL_geoai", None)
def TrainUsingAutoDL(
    in_data=None,
    out_model=None,
    pretrained_model=None,
    total_time_limit=None,
    autodl_mode: Literal["BASIC", "ADVANCED"] | None = None,
    networks=None,
    save_evaluated_models: Literal["SAVE_ALL_MODELS", "SAVE_BEST_MODEL"] | None = None,
) -> Result2[str, str]:
    """TrainUsingAutoDL_geoai(in_data, out_model, {pretrained_model}, {total_time_limit}, {autodl_mode}, {networks;networks...}, {save_evaluated_models})

       Trains a deep learning model by building training pipelines and
       automating much of the training process. This includes data
       augmentation, model selection, hyperparameter tuning, and batch size
       deduction. Its outputs include performance metrics of the best model
       on the training data, as well as the trained deep learning model
       package (.dlpk file) that can be used as input for the Extract
       Features Using AI Models tool to predict on new imagery.

    INPUTS:
     in_data (Folder):
         The folders containing the image chips, labels, and statistics
         required to train the model. This is the output from the Export
         Training Data For Deep Learning tool. The metadata format of the
         exported data must be Classified_Tiles, PASCAL_VOC_rectangles, or
         KITTI_rectangles.
     pretrained_model {File}:
         A pretrained model that will be used to fine-tune the new model. The
         input is an Esri model definition file (.emd) or a deep learning
         package file (.dlpk).A pretrained model with similar classes can be
         fine-tuned to fit the
         new model. The pretrained model must have been trained with the same
         model type and backbone model that will be used to train the new
         model.
     total_time_limit {Double}:
         The total time limit in hours it will take for AutoDL model training.
         The default is 2 hours.
     autodl_mode {String}:
         Specifies the AutoDL mode that will be used and how intensive the
         AutoDL search will be.BASIC-The basic mode will be used. This mode is
         used to train all
         selected networks without hyperparameter tuning.ADVANCED-The advanced
         mode will be used. This mode is used to perform
         hyperparameter tuning on the top two performing models.
     networks {String}:
         Specifies the architectures that will be used to train the
         model.SingleShotDetector-The SingleShotDetector architecture will be
         used to
         train the model. SingleShotDetector is used for object
         detection.RetinaNet-The RetinaNet architecture will be used to train
         the model.
         RetinaNet is used for object detection.FasterRCNN-The FasterRCNN
         architecture will be used to train the
         model. FasterRCNN is used for object detection.YOLOv3-The YOLOv3
         architecture will be used to train the model. YOLOv3
         is used for object detection.HRNet-The HRNet architecture will be used
         to train the model. HRNet is
         used for pixel classification.ATSS-The ATSS architecture will be used
         to train the model. ATSS is
         used for object detection.CARAFE-The CARAFE architecture will be used
         to train the model. CARAFE
         is used for object detection.CascadeRCNN-The CascadeRCNN architecture
         will be used to train the
         model. CascadeRCNN is used for object detection.CascadeRPN-The
         CascadeRPN architecture will be used to train the
         model. CascadeRPN is used for object detection.DCN-The DCN
         architecture will be used to train the model. DCN is used
         for object detection.DeepLab-The DeepLab architecture will be used to
         train the model.
         DeepLab is used for pixel classification.UnetClassifier-The
         UnetClassifier architecture will be used to train
         the model. UnetClassifier is used for pixel
         classification.DeepLabV3Plus-The DeepLabV3Plus architecture will be
         used to train the
         model. DeepLabV3Plus is used for pixel
         classification.PSPNetClassifier-The PSPNetClassifier architecture will
         be used to
         train the model. PSPNetClassifier is used for pixel
         classification.ANN-The ANN architecture will be used to train the
         model. ANN is used
         for pixel classification.APCNet-The APCNet architecture will be used
         to train the model. APCNet
         is used for pixel classification.CCNet-The CCNet architecture will be
         used to train the model. CCNet is
         used for pixel classification.CGNet-The CGNet architecture will be
         used to train the model. CGNet is
         used for pixel classification.DETReg-The DETReg architecture will be
         used to train the model. DETReg
         is used for object detection.DynamicRCNN-The DynamicRCNN architecture
         will be used to train the
         model. DynamicRCNN is used for object detection.EmpiricalAttention-The
         EmpiricalAttention architecture will be used to
         train the model. EmpiricalAttention is used for object
         detection.FCOS-The FCOS architecture will be used to train the model.
         FCOS is
         used for object detection.FoveaBox-The FoveaBox architecture will be
         used to train the model.
         FoveaBox is used for object detection.FSAF-The FSAF architecture will
         be used to train the model. FSAF is
         used for object detection.GHM-The GHM architecture will be used to
         train the model. GHM is used
         for object detection.LibraRCNN-The LibraRCNN architecture will be used
         to train the model.
         LibraRCNN is used for object detection.PaFPN-The PaFPN architecture
         will be used to train the model. PaFPN is
         used for object detection.Res2Net-The Res2Net architecture will be
         used to train the model.
         Res2Net is used for object detection.SABL-The SABL architecture will
         be used to train the model. SABL is
         used for object detection.VFNet-The VFNet architecture will be used to
         train the model. VFNet is
         used for object detection.DMNet-The DMNet architecture will be used to
         train the model. DMNet is
         used for pixel classification.DNLNet-The DNLNet architecture will be
         used to train the model. DNLNet
         is used for pixel classification.FastSCNN-The FastSCNN architecture
         will be used to train the model.
         FastSCNN is used for pixel classification.FCN-The FCN architecture
         will be used to train the model. FCN is used
         for pixel classification.GCNet-The GCNet architecture will be used to
         train the model. GCNet is
         used for pixel classification.MobileNetV2-The MobileNetV2 architecture
         will be used to train the
         model. MobileNetV2 is used for pixel classification.NonLocalNet-The
         NonLocalNet architecture will be used to train the
         model. NonLocalNet is used for pixel classification.OCRNet-The OCRNet
         architecture will be used to train the model. OCRNet
         is used for pixel classification.PSANet-The PSANet architecture will
         be used to train the model. PSANet
         is used for pixel classification.SemFPN-The SemFPN architecture will
         be used to train the model. SemFPN
         is used for pixel classification.UperNet-The UperNet architecture will
         be used to train the model.
         UperNet is used for pixel classification.MaskRCNN-The MaskRCNN
         architecture will be used to train the model.
         MaskRCNN is used for object detection.By default, all the networks
         will be used.
     save_evaluated_models {Boolean}:
         Specifies whether all evaluated models will be saved.SAVE_ALL_MODELS-
         All evaluated models will be
         saved.SAVE_BEST_MODEL-Only the best performing model will be saved.
         This is
         the default.

    OUTPUTS:
     out_model (File):
         The output trained model that will be saved as a deep learning package
         (.dlpk file)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainUsingAutoDL_geoai(
                *gp_fixargs(
                    (
                        in_data,
                        out_model,
                        pretrained_model,
                        total_time_limit,
                        autodl_mode,
                        networks,
                        save_evaluated_models,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Text Analysis toolset
@gptooldoc("ClassifyTextUsingDeepLearning_geoai", None)
def ClassifyTextUsingDeepLearning(
    in_table=None,
    text_field=None,
    in_model_definition_file=None,
    class_label_field=None,
    model_arguments=None,
    explain: Literal["ENABLE_SHAP", "DISABLE_SHAP"] | None = None,
    batch_size=None,
) -> Result1[str | Table | Layer]:
    """ClassifyTextUsingDeepLearning_geoai(in_table, text_field, in_model_definition_file, {class_label_field}, {model_arguments;model_arguments...}, {explain}, {batch_size})

       Runs a trained text classification model on a text field in a feature
       class or table and updates each record with an assigned class or
       category label with each class having a confidence value.

    INPUTS:
     in_table (Feature Layer / Table View):
         The input point, line, or polygon feature class, or table containing
         the text that will be classified and labelled.
     text_field (Field):
         A text field in the input feature class or table that contains the
         text that will be classified.
     in_model_definition_file (File):
         The trained model that will be used for classification. The model
         definition file can be either an Esri model definition JSON file
         (.emd) or a deep learning model package (.dlpk) that is stored locally
         or hosted on ArcGIS Living Atlas (.dlpk_remote).To use a .dlpk file
         that is trained using the Mistral backbone, it
         must be installed before using the model. To install the Mistral
         backbone, see ArcGIS Mistral BackboneThe .dlpk file can also be a
         third-party language model.A third-party language model .dlpk file can
         potentially contain
         harmful code. Use these models only if you trust their source.
     class_label_field {String}:
         The name of the field that will contain the class or category
         label assigned by the model. The default field name is.
         ClassLabel
     model_arguments {Value Table}:
         Additional arguments that will be used by the model while performing
         inference. The supported model arguments include sequence_length and
         confidence_threshold, which will be used to adjust the model's output.
         The confidence_threshold model argument is only applicable to
         multilabel text classification.When using a third party language
         model, the model arguments will be
         updated according to the parameters specified in the .dlpk file. To
         learn more about defining model arguments, see getParameterInfo
         section in Use third party language models with ArcGIS.
     explain {Boolean}:
         Specifies whether SHAP explanations will be generated. The time it
         takes to generate an explanation will depend on the length of the
         input.ENABLE_SHAP-A SHAP explanation will be generated for each row in
         the
         output table.DISABLE_SHAP-No SHAP explanation will be generated. This
         is the
         default.
     batch_size {Double}:
         The number of training samples that will be processed at one time. The
         default value is 4.Increasing the batch size can improve tool
         performance; however, as
         the batch size increases, more memory is used. If an out of memory
         error occurs, use a smaller batch size."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyTextUsingDeepLearning_geoai(
                *gp_fixargs(
                    (
                        in_table,
                        text_field,
                        in_model_definition_file,
                        class_label_field,
                        model_arguments,
                        explain,
                        batch_size,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ExtractEntitiesUsingDeepLearning_geoai", None)
def ExtractEntitiesUsingDeepLearning(
    in_folder=None,
    out_table=None,
    in_model_definition_file=None,
    model_arguments=None,
    batch_size=None,
    location_zone=None,
    in_locator=None,
    text_field=None,
) -> Result1[str | Layer]:
    """ExtractEntitiesUsingDeepLearning_geoai(in_folder, out_table, in_model_definition_file, {model_arguments;model_arguments...}, {batch_size}, {location_zone}, {in_locator}, {text_field})

       Runs a trained named entity recognizer model on text files in a
       folder, or a text field in a feature class or table, to extract
       entities and locations (such as addresses, place or person names,
       dates, and monetary values) in a table. If the extracted entities
       contain an address, the tool geocodes the addresses using the
       specified locator and produces a feature class as an output.

    INPUTS:
     in_folder (Folder / Feature Layer / Table View / Feature Class):
         The input to this parameter can be either of the following:A feature
         class or table containing the text column on which named
         entity extraction will be performed.A folder containing the text files
         on which named entity extraction
         will be performed.
     in_model_definition_file (File):
         The trained model that will be used to extract entities from text. The
         model definition file can be either an Esri model definition JSON file
         (.emd) or a deep learning model package (.dlpk) that is stored locally
         or hosted on ArcGIS Living Atlas (.dlpk_remote).To use a .dlpk file
         that is trained using the Mistral backbone, it
         must be installed before using the model. To install the Mistral
         backbone, see ArcGIS Mistral BackboneThe .dlpk file can also be a
         third-party language model.A third-party language model .dlpk file can
         potentially contain
         harmful code. Use these models only if you trust their source.
     model_arguments {Value Table}:
         Additional arguments that will be used by the model while performing
         inference. The supported model argument is sequence_length, which will
         be used to adjust the model's output.When using a third party language
         model, the model arguments will be
         updated according to the parameters specified in the .dlpk file. To
         learn more about defining model arguments, see getParameterInfo
         section in Use third party language models with ArcGIS.
     batch_size {Double}:
         The number of training samples that will be processed at one time. The
         default value is 4.Increasing the batch size can improve tool
         performance; however, as
         the batch size increases, more memory is used. If an out of memory
         error occurs, use a smaller batch size.
     location_zone {String}:
         The geographic region or zone where the addresses are expected to be
         located. The specified text will be appended to the address extracted
         by the model.The locator uses the location zone information to
         identify the region
         or geographic area where the address is located to produce better
         results.
     in_locator {Address Locator}:
         The locator that will be used to geocode addresses in the input text
         documents. A point is generated for each address that is geocoded
         successfully and stored in the output feature class.
     text_field {Field}:
         A text field in the input feature class or table that contains the
         text that will be used by the model as input. This parameter is
         required when the in_folder parameter value is a feature class or
         table.

    OUTPUTS:
     out_table (Feature Class / Table / Feature Layer):
         The output feature class or table that will contain the extracted
         entities. If a locator is provided and the model extracts addresses,
         the feature class will be produced by geocoding the extracted
         addresses."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ExtractEntitiesUsingDeepLearning_geoai(
                *gp_fixargs(
                    (
                        in_folder,
                        out_table,
                        in_model_definition_file,
                        model_arguments,
                        batch_size,
                        location_zone,
                        in_locator,
                        text_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainEntityRecognitionModel_geoai", None)
def TrainEntityRecognitionModel(
    in_folder=None,
    out_model=None,
    pretrained_model_file=None,
    address_entity=None,
    max_epochs=None,
    model_backbone: Literal[
        "bert-base-cased",
        "roberta-base",
        "albert-base-v1",
        "xlnet-base-cased",
        "xlm-roberta-base",
        "distilroberta-base",
        "distilbert-base-cased",
        "mistral",
    ]
    | None = None,
    batch_size=None,
    model_arguments=None,
    learning_rate=None,
    validation_percentage=None,
    stop_training: Literal["STOP_TRAINING", "CONTINUE_TRAINING"] | None = None,
    make_trainable: Literal["TRAIN_MODEL_BACKBONE", "FREEZE_MODEL_BACKBONE"] | None = None,
    text_field=None,
    prompt=None,
) -> Result1[str]:
    """TrainEntityRecognitionModel_geoai(in_folder, out_model, {pretrained_model_file}, {address_entity}, {max_epochs}, {model_backbone}, {batch_size}, {model_arguments;model_arguments...}, {learning_rate}, {validation_percentage}, {stop_training}, {make_trainable}, {text_field}, {prompt})

       Trains a named entity recognition model to extract a predefined set of
       entities from raw text.

    INPUTS:
     in_folder (Folder / Feature Layer / Table View / Feature Class):
         The input can be either of the following:A feature class or table
         containing a text field with the input text
         for the model and the labelled entities where the selected text field
         will be used as input text for the model and the remaining fields will
         be treated as named entities labels. A folder containing
         training data in the form of standard
         datasets for NER tasks. The training data must be in .json or .csv
         files. The file format determines the dataset type of the input.
         When the input is a folder, the following dataset types are
         supported:           ner_json-The training data folder should contain
         a .json file with
         text and the labelled entities formatted using the spaCy JSON training
         format. IOB-The IOB (I - inside, O - outside, B -
         beginning tags)
         format proposed by Ramshaw and Marcus in the paper Text Chunking using
         Transformation-Based Learning. The training data folder
         should contain the following two .csv files:tokens.csv-Contains text
         as input chunkstags.csv-Contains IOB tags for
         the text chunks             BILUO-An extension of the IOB format that
         additionally
         contains L - last and U - unit tags. The training data
         folder should contain the following two .csv files:tokens.csv-Contains
         text as input chunkstags.csv-Contains BILUO tags
         for the text chunks
     pretrained_model_file {File}:
         A pretrained model that will be used to fine-tune the new model. The
         input can be an Esri model definition file (.emd) or a deep learning
         package file (.dlpk).A pretrained model with similar entities can be
         fine-tuned to fit the
         new model. The pretrained model must have been trained with the same
         model type and backbone model that will be used to train the new
         model.
     address_entity {String}:
         An address entity that will be treated as a location. During
         inference, such entities will be geocoded using the specified locator,
         and a feature class will be produced as a result of the entity
         extraction process. If no locator is provided or the trained model
         does not extract address entities, a table containing the extracted
         entities will be produced instead.
     max_epochs {Long}:
         The maximum number of epochs for which the model will be trained. A
         maximum epoch value of 1 means the dataset will be passed through the
         neural network one time. The default value is 5.
     model_backbone {String}:
         Specifies the preconfigured neural network that will be used as the
         architecture for training the new model.bert-base-cased-The model will
         be trained using the BERT neural
         network. BERT is pretrained using the masked language modeling
         objective and next sentence prediction.roberta-base-The model will be
         trained using the RoBERTa neural
         network. RoBERTa modifies the key hyperparameters of BERT, eliminating
         the pretraining objective and training of the next sentence with small
         batches and higher learning rates.albert-base-v1-The model will be
         trained using the ALBERT neural
         network. ALBERT uses a self-supervised loss that focuses on modeling
         intersentence coherence, resulting in better scalability than
         BERT.xlnet-base-cased-The model will be trained using the XLNet neural
         network. XLNet is a generalized autoregressive pretraining method. It
         allows learning bidirectional contexts by maximizing the expected
         probability on all permutations of the factorization order, which
         overcomes the drawbacks of BERT.xlm-roberta-base-The model will be
         trained using the XLM-RoBERTa
         neural network. XLM-RoBERTa is a multilingual model trained on 100
         different languages. Unlike some XLM multilingual models, it does not
         require language tensors to understand which language is used and
         identifies the correct language from the input IDs.distilroberta-
         base-The model will be trained using the DistilRoBERTa
         neural network. DistilRoBERTa is an English language model pretrained
         with the supervision of roberta-base neural network based solely on
         OpenWebTextCorpus, a reproduction of OpenAI's WebText
         dataset.distilbert-base-cased-The model will be trained using the
         DistilBERT
         neural network. DistilBERT is a smaller general-purpose language
         representation model.mistral-The model will be trained using the
         Mistral large language
         model (LLM). Mistral is a decoder-only transformer that uses Sliding
         Window Attention, Grouped Query Attention, and the Byte-fallback BPE
         tokenizer. To install the Mistral backbone, see ArcGIS Mistral
         Backbone.
     batch_size {Double}:
         The number of training samples that will be processed at one time. The
         default value is 2.Increasing the batch size can improve tool
         performance; however, as
         the batch size increases, more memory is used. If an out of memory
         error occurs, use a smaller batch size.
     model_arguments {Value Table}:
         Additional arguments that will be used for initializing the model. The
         supported model argument is sequence_length, which is used to set the
         maximum sequence length of the training data that will be considered
         for training the model.
     learning_rate {Double}:
         The step size indicating how much the model weights will be adjusted
         during the training process. If no value is specified, an optimal
         learning rate will be derived automatically.
     validation_percentage {Double}:
         The percentage of training samples that will be used for validating
         the model. The default value is 10 for transformer-based model
         backbones and 50 for the Mistral backbone.
     stop_training {Boolean}:
         Specifies whether model training will stop when the model is no longer
         improving or continue until the max_epochs parameter value is
         reached.STOP_TRAINING-The model training will stop when the model is
         no longer
         improving, regardless of the max_epochs parameter value. This is the
         default.CONTINUE_TRAINING-The model training will continue until the
         max_epochs parameter value is reached.
     make_trainable {Boolean}:
         Specifies whether the backbone layers in the pretrained model will be
         frozen, so that the weights and biases remain as originally
         designed.TRAIN_MODEL_BACKBONE-The backbone layers will not be frozen,
         and the
         weights and biases of the model_backbone parameter value can be
         altered to fit the training samples. This takes more time to process
         but typically produces better results. This is the
         default.FREEZE_MODEL_BACKBONE-The backbone layers will be frozen, and
         the
         predefined weights and biases of the model_backbone parameter value
         will not be altered during training.
     text_field {Field}:
         A text field in the input feature class or table that contains the
         text that will be used by the model as input. This parameter is
         required when the in_folder parameter value is a feature class or
         table.
     prompt {String}:
         A specific input or instruction given to a large language model (LLM)
         to generate an expected output. The default value is
         Extract named entities belonging
         to the specified classes within the
         provided text. Do not tag entities belonging to any other class.

    OUTPUTS:
     out_model (Folder):
         The output folder location where the trained model will be stored."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainEntityRecognitionModel_geoai(
                *gp_fixargs(
                    (
                        in_folder,
                        out_model,
                        pretrained_model_file,
                        address_entity,
                        max_epochs,
                        model_backbone,
                        batch_size,
                        model_arguments,
                        learning_rate,
                        validation_percentage,
                        stop_training,
                        make_trainable,
                        text_field,
                        prompt,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainTextClassificationModel_geoai", None)
def TrainTextClassificationModel(
    in_table=None,
    text_field=None,
    label_field=None,
    out_model=None,
    pretrained_model_file=None,
    max_epochs=None,
    model_backbone: Literal[
        "bert-base-cased",
        "roberta-base",
        "albert-base-v1",
        "xlnet-base-cased",
        "xlm-roberta-base",
        "distilroberta-base",
        "distilbert-base-cased",
        "mistral",
    ]
    | None = None,
    batch_size=None,
    model_arguments=None,
    learning_rate=None,
    validation_percentage=None,
    stop_training: Literal["STOP_TRAINING", "CONTINUE_TRAINING"] | None = None,
    make_trainable: Literal["TRAIN_MODEL_BACKBONE", "FREEZE_MODEL_BACKBONE"] | None = None,
    remove_html_tags: Literal["REMOVE_HTML_TAGS", "DO_NOT_REMOVE_HTML_TAGS"] | None = None,
    remove_urls: Literal["REMOVE_URLS", "DO_NOT_REMOVE_URLS"] | None = None,
    prompt=None,
) -> Result1[str]:
    """TrainTextClassificationModel_geoai(in_table, text_field, label_field;label_field..., out_model, {pretrained_model_file}, {max_epochs}, {model_backbone}, {batch_size}, {model_arguments;model_arguments...}, {learning_rate}, {validation_percentage}, {stop_training}, {make_trainable}, {remove_html_tags}, {remove_urls}, {prompt})

       Trains a single or multilabel text classification model to assign a
       predefined category or label to unstructured text.

    INPUTS:
     in_table (Feature Class / Table View / Feature Layer):
         A feature class or table containing a text field with the input text
         for the model and a label field containing the target class labels.
     text_field (Field):
         A text field in the input feature class or table that contains the
         text that will be classified by the model.
     label_field (Field):
         A text field in the input feature class or table that contains the
         target class labels for training the model. In the case of multilabel
         text classification, specify more than one text field.
     pretrained_model_file {File}:
         A pretrained model that will be used to fine-tune the new model. The
         input can be an Esri model definition file (.emd) or a deep learning
         package file (.dlpk).A pretrained model with similar classes can be
         fine-tuned to fit the
         new model. The pretrained model must have been trained with the same
         model type and backbone model that will be used to train the new
         model.
     max_epochs {Long}:
         The maximum number of epochs for which the model will be trained. A
         maximum epoch value of 1 means the dataset will be passed through the
         neural network one time. The default value is 5.
     model_backbone {String}:
         Specifies the preconfigured neural network that will serve as the
         encoder for the model and extract feature representations of the input
         text in the form of fixed length vectors. These vectors will be passed
         as input to the classification head of the model.bert-base-cased-The
         model will be trained using the BERT neural
         network. BERT is pretrained using the masked language modeling
         objective and next sentence prediction.roberta-base-The model will be
         trained using the RoBERTa neural
         network. RoBERTa modifies the key hyperparameters of BERT, eliminating
         the pretraining objective and training of the next sentence with small
         batches and higher learning rates.albert-base-v1-The model will be
         trained using the ALBERT neural
         network. ALBERT uses a self-supervised loss that focuses on modeling
         intersentence coherence, resulting in better scalability than
         BERT.xlnet-base-cased-The model will be trained using the XLNet neural
         network. XLNet is a generalized autoregressive pretraining method. It
         allows learning bidirectional contexts by maximizing the expected
         probability on all permutations of the factorization order, which
         overcomes the drawbacks of BERT.xlm-roberta-base-The model will be
         trained using the XLM-RoBERTa
         neural network. XLM-RoBERTa is a multilingual model trained on 100
         different languages. Unlike some XLM multilingual models, it does not
         require language tensors to understand which language is used and
         identifies the correct language from the input IDs.distilroberta-
         base-The model will be trained using the DistilRoBERTa
         neural network. DistilRoBERTa is an English language model pretrained
         with the supervision of the roberta-base neural network based solely
         on OpenWebTextCorpus, a reproduction of OpenAI's WebText
         dataset.distilbert-base-cased-The model will be trained using the
         DistilBERT
         neural network. DistilBERT is a smaller general-purpose language
         representation model.mistral-The model will be created using the
         Mistral large language
         model (LLM). Mistral is a decoder-only transformer that uses Sliding
         Window Attention, Grouped Query Attention, and the Byte-fallback BPE
         tokenizer. To install the Mistral backbone, see ArcGIS Mistral
         Backbone.
     batch_size {Double}:
         The number of training samples that will be processed at one time. The
         default value is 2.Increasing the batch size can improve tool
         performance; however, as
         the batch size increases, more memory is used. If an out of memory
         error occurs, use a smaller batch size.
     model_arguments {Value Table}:
         Additional arguments that will be used for initializing the model. The
         supported model argument is sequence_length, which is used to set the
         maximum sequence length of the training data that will be considered
         for training the model.
     learning_rate {Double}:
         The step size indicating how much the model weights will be adjusted
         during the training process. If no value is specified, an optimal
         learning rate will be applied automatically.
     validation_percentage {Double}:
         The percentage of training samples that will be used for validating
         the model. The default value is 10 for transformer-based model
         backbones and 50 for the Mistral backbone.
     stop_training {Boolean}:
         Specifies whether model training will stop when the model is no longer
         improving or continue until the max_epochs parameter value is
         reached.STOP_TRAINING-The model training will stop when the model is
         no longer
         improving, regardless of the max_epochs parameter value. This is the
         default.CONTINUE_TRAINING-The model training will continue until the
         max_epochs parameter value is reached.
     make_trainable {Boolean}:
         Specifies whether the backbone layers in the pretrained model will be
         frozen, so that the weights and biases remain as originally
         designed.TRAIN_MODEL_BACKBONE-The backbone layers will not be frozen,
         and the
         weights and biases of the model_backbone parameter value can be
         altered to fit the training samples. This takes more time to process
         but typically produces better results. This is the
         default.FREEZE_MODEL_BACKBONE-The backbone layers will be frozen, and
         the
         predefined weights and biases of the model_backbone parameter value
         will not be altered during training.
     remove_html_tags {Boolean}:
         Specifies whether HTML tags will be removed from the input
         text.REMOVE_HTML_TAGS-The HTML tags in the input text will be removed.
         This
         is the default.DO_NOT_REMOVE_HTML_TAGS-The HTML tags in the input text
         will not be
         removed.
     remove_urls {Boolean}:
         Specifies whether URLs will be removed from the input
         text.REMOVE_URLS-The URLs in the input text will be removed. This is
         the
         default.DO_NOT_REMOVE_URLS-The URLs in the input text will not be
         removed.
     prompt {String}:
         A specific input or instruction given to a large language model (LLM)
         to generate an expected output. The default value is
         Categorize the provided text into
         the specified classes. Do not create
         new labels for classification.

    OUTPUTS:
     out_model (Folder):
         The output folder location where the trained model will be stored."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainTextClassificationModel_geoai(
                *gp_fixargs(
                    (
                        in_table,
                        text_field,
                        label_field,
                        out_model,
                        pretrained_model_file,
                        max_epochs,
                        model_backbone,
                        batch_size,
                        model_arguments,
                        learning_rate,
                        validation_percentage,
                        stop_training,
                        make_trainable,
                        remove_html_tags,
                        remove_urls,
                        prompt,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainTextTransformationModel_geoai", None)
def TrainTextTransformationModel(
    in_table=None,
    text_field=None,
    label_field=None,
    out_model=None,
    pretrained_model_file=None,
    max_epochs=None,
    model_backbone: Literal["t5-small", "t5-base", "t5-large", "mistral"] | None = None,
    batch_size=None,
    model_arguments=None,
    learning_rate=None,
    validation_percentage=None,
    stop_training: Literal["STOP_TRAINING", "CONTINUE_TRAINING"] | None = None,
    make_trainable: Literal["TRAIN_MODEL_BACKBONE", "FREEZE_MODEL_BACKBONE"] | None = None,
    remove_html_tags: Literal["REMOVE_HTML_TAGS", "DO_NOT_REMOVE_HTML_TAGS"] | None = None,
    remove_urls: Literal["REMOVE_URLS", "DO_NOT_REMOVE_URLS"] | None = None,
    prompt=None,
) -> Result1[str]:
    """TrainTextTransformationModel_geoai(in_table, text_field, label_field, out_model, {pretrained_model_file}, {max_epochs}, {model_backbone}, {batch_size}, {model_arguments;model_arguments...}, {learning_rate}, {validation_percentage}, {stop_training}, {make_trainable}, {remove_html_tags}, {remove_urls}, {prompt})

       Trains a text transformation model to transform, translate, or
       summarize text.

    INPUTS:
     in_table (Feature Class / Table View / Feature Layer):
         A feature class or table containing a text field with the input text
         for the model and a label field containing the target transformed
         text.
     text_field (Field):
         A text field in the input feature class or table that contains the
         input text that will be transformed by the model.
     label_field (Field):
         A text field in the input feature class or table that contains the
         target transformed text for training the model.
     pretrained_model_file {File}:
         A pretrained model that will be used to fine-tune the new model. The
         input can be an Esri model definition file (.emd) or a deep learning
         package file (.dlpk).A pretrained model that performs a similar task
         can be fine-tuned to
         fit the training data. The pretrained model must have been trained
         with the same model type and backbone model that will be used to train
         the new model.
     max_epochs {Long}:
         The maximum number of epochs for which the model will be trained. A
         maximum epoch value of 1 means the dataset will be passed through the
         neural network one time. The default value is 5.
     model_backbone {String}:
         Specifies the preconfigured neural network that will be used as the
         architecture for training the new model.t5-small-The new model will be
         trained using the T5 neural network. T5
         is a unified framework that converts every language problem into a
         text-to-text format. t5-small is the small variant of T5.t5-base-The
         new model will be trained using the T5 neural network. T5
         is a unified framework that converts every language problem into a
         text-to-text format. t5-base is the medium variant of T5.t5-large-The
         new model will be trained using the T5 neural network. T5
         is a unified framework that converts every language problem into a
         text-to-text format. t5-large is the large variant of T5.mistral-The
         model will be trained using the Mistral large language
         model (LLM). Mistral is a decoder-only transformer that uses Sliding
         Window Attention, Grouped Query Attention, and the Byte-fallback BPE
         tokenizer. To install the Mistral backbone, see ArcGIS Mistral
         Backbone.
     batch_size {Double}:
         The number of training samples that will be processed at one time. The
         default value is 2.Increasing the batch size can improve tool
         performance; however, as
         the batch size increases, more memory is used. If an out of memory
         error occurs, use a smaller batch size.
     model_arguments {Value Table}:
         Additional arguments that will be used for initializing the model. The
         supported model argument is sequence_length, which is used to set the
         maximum sequence length of the training data that will be considered
         for training the model.
     learning_rate {Double}:
         The step size indicating how much the model weights will be adjusted
         during the training process. If no value is specified, an optimal
         learning rate will be derived automatically.
     validation_percentage {Double}:
         The percentage of training samples that will be used for validating
         the model. The default value is 10 for transformer-based model
         backbones and 50 for the Mistral backbone.
     stop_training {Boolean}:
         Specifies whether model training will stop when the model is no longer
         improving or continue until the max_epochs parameter value is
         reached.STOP_TRAINING-The model training will stop when the model is
         no longer
         improving, regardless of the max_epochs parameter value. This is the
         default.CONTINUE_TRAINING-The model training will continue until the
         max_epochs parameter value is reached.
     make_trainable {Boolean}:
         Specifies whether the backbone layers in the pretrained model will be
         frozen, so that the weights and biases remain as originally
         designed.TRAIN_MODEL_BACKBONE-The backbone layers will not be frozen,
         and the
         weights and biases of the model_backbone parameter value can be
         altered to fit the training samples. This takes more time to process
         but typically produces better results. This is the
         default.FREEZE_MODEL_BACKBONE-The backbone layers will be frozen, and
         the
         predefined weights and biases of the model_backbone parameter value
         will not be altered during training.
     remove_html_tags {Boolean}:
         Specifies whether HTML tags will be removed from the input
         text.REMOVE_HTML_TAGS-The HTML tags in the input text will be removed.
         This
         is the default.DO_NOT_REMOVE_HTML_TAGS-The HTML tags in the input text
         will not be
         removed.
     remove_urls {Boolean}:
         Specifies whether URLs will be removed from the input
         text.REMOVE_URLS-The URLs in the input text will be removed. This is
         the
         default.DO_NOT_REMOVE_URLS-The URLs in the input text will not be
         removed.
     prompt {String}:
         A specific input or instruction given to a large language model (LLM)
         to generate an expected output. The default value is
         Transform the input text from the
         text field into the transformed text
         present in the label field.

    OUTPUTS:
     out_model (Folder):
         The output folder location where the trained model will be stored."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainTextTransformationModel_geoai(
                *gp_fixargs(
                    (
                        in_table,
                        text_field,
                        label_field,
                        out_model,
                        pretrained_model_file,
                        max_epochs,
                        model_backbone,
                        batch_size,
                        model_arguments,
                        learning_rate,
                        validation_percentage,
                        stop_training,
                        make_trainable,
                        remove_html_tags,
                        remove_urls,
                        prompt,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TransformTextUsingDeepLearning_geoai", None)
def TransformTextUsingDeepLearning(
    in_table=None,
    text_field=None,
    in_model_definition_file=None,
    result_field=None,
    model_arguments=None,
    batch_size=None,
    minimum_sequence_length=None,
    maximum_sequence_length=None,
) -> Result1[str | Table | Layer]:
    """TransformTextUsingDeepLearning_geoai(in_table, text_field, in_model_definition_file, {result_field}, {model_arguments;model_arguments...}, {batch_size}, {minimum_sequence_length}, {maximum_sequence_length})

       Runs a trained sequence-to-sequence model on a text field in a feature
       class or table and updates it with a new field containing the
       converted, transformed, or translated text.

    INPUTS:
     in_table (Feature Layer / Table View / Feature Class):
         The input point, line, or polygon feature class, or table containing
         the text that will be transformed.
     text_field (Field):
         A text field in the input feature class or table that contains the
         text that will be transformed.
     in_model_definition_file (File):
         The trained model that will be used for text transformation. The model
         definition file can be either an Esri model definition JSON file
         (.emd) or a deep learning model package (.dlpk) that is stored locally
         or hosted on ArcGIS Living Atlas (.dlpk_remote).To use a .dlpk file
         that is trained using the Mistral backbone, it
         must be installed before using the model. To install the Mistral
         backbone, see ArcGIS Mistral Backbone.The .dlpk file can also be a
         third-party language model.A third-party language model .dlpk file can
         potentially contain
         harmful code. Use these models only if you trust their source.
     result_field {String}:
         The name of the field that will contain the transformed text
         in the output feature class or table. The default field name is.
         Result
     model_arguments {Value Table}:
         Additional arguments that will be used by the model while performing
         inference. The supported model argument is sequence_length, which will
         be used to adjust the model's output.When using a third party language
         model, the model arguments will be
         updated according to the parameters specified in the .dlpk file. To
         learn more about defining model arguments, see getParameterInfo
         section in Use third party language models with ArcGIS.
     batch_size {Double}:
         The number of training samples that will be processed at one time. The
         default value is 4.Increasing the batch size can improve tool
         performance; however, as
         the batch size increases, more memory is used. If an out of memory
         error occurs, use a smaller batch size.
     minimum_sequence_length {Double}:
         The minimum number of characters for the output text string. The
         default value is 20.
     maximum_sequence_length {Double}:
         The maximum number of characters for the output text string. The
         default value is 50."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TransformTextUsingDeepLearning_geoai(
                *gp_fixargs(
                    (
                        in_table,
                        text_field,
                        in_model_definition_file,
                        result_field,
                        model_arguments,
                        batch_size,
                        minimum_sequence_length,
                        maximum_sequence_length,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Time Series AI toolset
@gptooldoc("ForecastUsingTimeSeriesModel_geoai", None)
def ForecastUsingTimeSeriesModel(
    in_cube=None,
    in_model_definition=None,
    out_features=None,
    number_of_timesteps_to_forecast=None,
    match_explanatory_variables=None,
    out_cube=None,
    outlier_option: Literal["NONE", "IDENTIFY"] | None = None,
    level_of_confidence: Literal["90%", "95%", "99%"] | None = None,
    maximum_number_of_outliers=None,
) -> Result2[str, str]:
    """ForecastUsingTimeSeriesModel_geoai(in_cube, in_model_definition, out_features, number_of_timesteps_to_forecast, {match_explanatory_variables;match_explanatory_variables...}, {out_cube}, {outlier_option}, {level_of_confidence}, {maximum_number_of_outliers})

       Predicts the values of each location of a space-time cube using a deep
       learning-based time series forecasting model that has been trained
       using the Train Time Series Forecasting Model tool.

    INPUTS:
     in_cube (File):
         The netCDF cube containing the variable that will be used to forecast
         to future time steps. This file must have an .nc file extension and
         must have been created using the Create Space Time Cube By Aggregating
         Points, Create Space Time Cube From Defined Locations, or Create Space
         Time Cube From Multidimensional Raster Layer tool.
     in_model_definition (File):
         The trained deep learning model file (.dlpk or .emd) that will be used
         to make the predictions. The model can be trained using the Train Time
         Series Forecasting Model tool.
     number_of_timesteps_to_forecast (Long):
         A positive integer specifying the number of time steps that will be
         used to forecast the analysis variable. The default value is 2. This
         value cannot be larger than 50 percent of the total time steps in the
         input space-time cube for one-step forecasting, and it cannot be
         larger than 50 percent of the sequence_length parameter value in the
         Train Time Series Forecasting Model tool for multistep forecasting.
     match_explanatory_variables {Value Table}:
         The mapping of field names from the prediction set to the training
         set. Use this parameter if the field names of the training and
         prediction sets are different. The values are the field names in the
         prediction dataset that match the field names in the input time series
         data.
     outlier_option {String}:
         Specifies whether statistically significant time series outliers will
         be identified.NONE-Outliers will not be identified. This is the
         default.IDENTIFY-Outliers will be identified using the Generalized ESD
         test.
     level_of_confidence {String}:
         Specifies the confidence level that will be used for the test for time
         series outliers.90%-The confidence level for the test will be 90
         percent. This is the
         default.95%-The confidence level for the test will be 95
         percent.99%-The confidence level for the test will be 99 percent.
     maximum_number_of_outliers {Long}:
         The maximum number of time steps that can be declared outliers for
         each location. The default value corresponds to 5 percent (rounded
         down) of the number of time steps of the input space-time cube (a
         value of at least 1 will always be used). The value cannot exceed 20
         percent of the number of time steps.

    OUTPUTS:
     out_features (Feature Class):
         The output feature class of all locations in the space-time cube with
         forecasted values stored as fields. The layer displays the forecast
         for the final time step and contains pop-up charts showing the time
         series and forecasts for each location.
     out_cube {File}:
         An output space-time cube (.nc file) containing the values of the
         input space-time cube with the forecasted time steps appended. Use the
         Visualize Space Time Cube in 3D tool to see all of the observed and
         forecasted values simultaneously."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ForecastUsingTimeSeriesModel_geoai(
                *gp_fixargs(
                    (
                        in_cube,
                        in_model_definition,
                        out_features,
                        number_of_timesteps_to_forecast,
                        match_explanatory_variables,
                        out_cube,
                        outlier_option,
                        level_of_confidence,
                        maximum_number_of_outliers,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("TrainTimeSeriesForecastingModel_geoai", None)
def TrainTimeSeriesForecastingModel(
    in_cube=None,
    out_model=None,
    analysis_variable=None,
    sequence_length=None,
    explanatory_variables=None,
    max_epochs=None,
    validation_timesteps=None,
    model_type: Literal["InceptionTime", "ResNet", "ResCNN", "FCN", "LSTM", "TimeSeriesTransformer"] | None = None,
    batch_size=None,
    arguments=None,
    early_stopping=None,
    out_features=None,
    out_cube=None,
    multistep=None,
) -> Result:
    """TrainTimeSeriesForecastingModel_geoai(in_cube, out_model, analysis_variable, sequence_length, {explanatory_variables;explanatory_variables...}, {max_epochs}, {validation_timesteps}, {model_type}, {batch_size}, {arguments;arguments...}, {early_stopping}, {out_features}, {out_cube}, {multistep})

       Trains a deep learning-based time series forecasting model using time
       series data from a space-time cube. The trained model can be used for
       forecasting the values of each location of a space-time cube using the
       Forecast Using Time Series Model tool.

    INPUTS:
     in_cube (File):
         The netCDF cube containing the variable that will be used to forecast
         to future time steps. This file must have an .nc file extension and
         must have been created using the Create Space Time Cube By Aggregating
         Points, Create Space Time Cube From Defined Locations, or Create Space
         Time Cube From Multidimensional Raster Layer tool.
     analysis_variable (String):
         The numeric variable in the dataset that will be forecasted to future
         time steps.
     sequence_length (Long):
         The number of previous time steps that will be used when
         training the model. If the data contains seasonality (repeating
         cycles), provide the length corresponding to one season. If the
         multistep parameter value is False, the value of this parameter
         should be less than or equal to the total number of input time steps
         remaining after excluding the validation_timesteps parameter value.If
         the multistep parameter value is True, 1.5 times the value of
         sequence_length should be less than or equal to the total number of
         time steps after excluding the validation_timesteps parameter value.
     explanatory_variables {Value Table}:
         Independent variables from the data that will be used to train the
         model. Use a True value after any variables that represent classes or
         categories.
     max_epochs {Long}:
         The maximum number of epochs for which the model will be trained. The
         default is 20.
     validation_timesteps {Long}:
         The number of time steps that will be excluded for validation. For
         example, if a value of 14 is specified, the last 14 rows in the data
         frame will be used as validation data. The default is 10 percent of
         total timesteps. Ideally it should not be less than 5 percent of the
         total time steps in the input time cube.If the multistep parameter
         value is False, this parameter value should
         be less than 25 percent of the total number of records in the input
         space-time cube.If the multistep parameter value is True, this
         parameter value should
         be less than or equal to half of the sequence_length parameter value.
     model_type {String}:
         Specifies the model architecture that will be used for training the
         model.InceptionTime-The InceptionTime architecture that will be used
         for
         training the model. This is the default.ResNet-The ResNet architecture
         that will be used for training the
         model.ResCNN-The ResCNN architecture that will be used for training
         the
         model.FCN-The FCN architecture that will be used for training the
         model.LSTM-The LSTM architecture that will be used for training the
         model.TimeSeriesTransformer-The TimeSeriesTransformer architecture
         that will
         be used for training the model.
     batch_size {Long}:
         The number of samples that will be processed at one time. The default
         is 64.Depending on the computer's GPU, this number can be changed to
         8, 16,
         32, 64, and so on.
     arguments {Value Table}:
         Additional model arguments that will be used specific to each model.
         These arguments can be used to adjust the model complexity and size.
         See How Time Series forecasting models work to understand the model
         architecture, the supported model arguments, and their default values.
     early_stopping {Boolean}:
         Specifies whether the model training will stop when validation loss
         does not register improvement after five consecutive epochs.TRUE-The
         model training will stop when validation loss does not
         register improvement after five consecutive epochs. This is the
         default.FALSE-The model training will continue until the maximum
         number of
         epochs has been reached.
     multistep {Boolean}:
         Specifies whether a one-step or multistep approach will be used for
         training the multivariate time series forecasting model.TRUE-The model
         training will use a multistep approach.FALSE-The model
         training will use the traditional one-step approach.
         This is the default.

    OUTPUTS:
     out_model (Folder):
         The output folder location that will store the trained model. The
         trained model will be saved as a deep learning package file (.dlpk).
     out_features {Feature Class}:
         The output feature class of all locations in the space-time cube with
         forecasted values stored as fields. The feature class will be created
         using prediction of the trained model on the validation dataset. The
         output displays the forecast for the final time step and contains pop-
         up charts showing the time series forecast on the validation set.
     out_cube {File}:
         An output space-time cube (.nc file) containing the values of the
         input space-time cube with the forecasted values for the corresponding
         validation time steps replaced."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TrainTimeSeriesForecastingModel_geoai(
                *gp_fixargs(
                    (
                        in_cube,
                        out_model,
                        analysis_variable,
                        sequence_length,
                        explanatory_variables,
                        max_epochs,
                        validation_timesteps,
                        model_type,
                        batch_size,
                        arguments,
                        early_stopping,
                        out_features,
                        out_cube,
                        multistep,
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
