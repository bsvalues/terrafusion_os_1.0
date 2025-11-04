"""CalculateCompositeIndex core logic executor."""
# Update sys.path dynamically. pylint: disable=C0411, C0413
# Use the setattr and __slots__. Disable missing attribute. pylint: disable=E1101

import arcpy
import SSCluster as SC
import numpy as NUM
from typing import Optional
from common import LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer, FieldUtils, AOLUtils
import SSCompositeIndex as SCI

LOGGER = LogUtils.setup_logger(__name__)

class CCIExecutor(PAExecutor):
    """ Core logic for CalculateCompositeIndex. """

    def __init__(self, input_layer: PAFeatureLayer, output_layer: PAOutputFeatureLayer,
                 input_variables: str, index_method: str, output_index_reverse: bool,
                 output_index_min_max: list):
                #  output_index_min: float, output_index_max: float):
        """Unpack input parameters and set the properties.
        
        Args:
            input_layer: an instance of PAFeatureLayer with geometry to fetch center from
            output_layer: an instance of PAOutputFeatureLayer with the results to be stored
            input_variables: a list of values in the form of [field, reverseVariable, weight] where field is the field name,
                            reverseVariable is a boolean indicating if the field needs to be reversed, and weight is the weight
                            of the fields in the index calculation
            index_method: a string indicatin which method to use
            output_index_reverse: a boolean indicating if the result needs to be reversed
            output_index_min: a float indicating the minimum value of the output index values.
            output_index_max: a float indicating the maximum value of the output index values. 
        """
        self.input_layer = input_layer
        self.output_layer = output_layer
        self.input_variables = input_variables
        self.index_method = index_method
        self.output_index_reverse = output_index_reverse
        self.output_index_min_max = output_index_min_max
        self.process_info = None

    def validate_parameters(self) -> bool:
        """ Validate input parameters"""
        # if Min is provided Max should be provided too, and vice versa.
        if self.output_index_min_max:
            if (self.output_index_min_max[0][0] is not None and self.output_index_min_max[0][1] is None) or \
                (self.output_index_min_max[0][0] is None and self.output_index_min_max[0][1] is not None):
                LOGGER.error(530, extra={'message_ID': 530})
                return False
            elif self.output_index_min_max[0][0] is not None and self.output_index_min_max[0][1] is not None:
                if self.output_index_min_max[0][0] >= self.output_index_min_max[0][1]:
                    LOGGER.error(10443, extra={'message_ID': 10443})
                    return False
        
        # Weights are always positive
        for val in self.input_variables:
            if val['weight'] <= 0:
                LOGGER.error(531, extra={'message_ID': 531})
                return False

        # vars = set()
        for val in self.input_variables:
            var_name = val['field'].upper()
            # Check if the variable exists in the input layer/table
            if not FieldUtils.verify_field_exists(self.input_layer, var_name):
                LOGGER.error(100052, extra={"message_ID": 100052,
                                            "fieldName": var_name,
                                            "paramName": self.input_layer.layer_name})
                return False

            # Check if the input variable is of correct type
            if not FieldUtils.verify_field_exists(self.input_layer, var_name,
                                     field_types=["Double", "Integer", "Single", "SmallInteger", "BigInteger"]):
                    LOGGER.error(308, extra={"message_ID": 308})
                    return False

        return True
    
    def _create_flags(self):
        flags = []
        for val in self.input_variables:
            var_name = val['field'].upper()
            flags.append([var_name, 'GREATERTHAN', 0.9])

        return flags
    
    def execute(self):
        """ Execute core logic """

        # Prepare data in a format acceptable for backend
        inputvars = []
        indicator_weights = []
        for val in self.input_variables:
            var_name = val['field'].upper()
            is_reverse = 0 if val['reverseVariable'].upper() in ['FALSE', ''] else 1
            weight = val['weight']

            inputvars.append([var_name, is_reverse])
            indicator_weights.append([var_name, weight])

        # auto fill method to scale and method to combine based on index workflow
        threshold_scaling = None
        flags = None
        if self.index_method == 'meanScaled': ## NEEDS to be modified
            prepro = 'MINMAX'
            calculate_method = 'MEAN'
        elif self.index_method == 'meanPercentile':
            prepro = 'PERCENTILE'
            calculate_method = 'MEAN'
        elif self.index_method == 'geomeanScaled':
            prepro = 'MINMAX'
            calculate_method = 'GEOMETRIC_MEAN'
        elif self.index_method == 'sumFlagsPercentile':
            prepro = 'BINARY'
            threshold_scaling = 'THRESHOLD_PERCENTILE'
            flags = self._create_flags()
            calculate_method = 'SUM'
        elif self.index_method == 'meanRaw':
            prepro = 'RAW'
            calculate_method = 'MEAN'
        elif self.index_method == 'geomeanPercentile':
            prepro = 'PERCENTILE'
            calculate_method = 'GEOMETRIC_MEAN'
        elif self.index_method == 'geomeanRaw':
            prepro = 'RAW'
            calculate_method = 'GEOMETRIC_MEAN'

        if self.input_layer.is_table_view:
            inputFeatures = self.input_layer.data
        else:
            inputFeatures = self.input_layer.layer

        additional_output = ['EQINTERVAL', 'QUANTILE', 'STDDEV']
        num_classes = 5

        LogUtils.reconfig_ss_logger()
        sci = SCI.SSCompositeIndex(inputFeatures=inputFeatures, appendToField=False,
                                    outFeatures=self.output_layer.data, inputVars=inputvars,
                                    indexWorkFlow=self.index_method, inputVarStandard=prepro,
                                    customStandard=None, customMinMaxVals=None,
                                    indexCalcMethod=calculate_method, flags=flags,
                                    indicatorWeights=indicator_weights,
                                    outIndexName=None, outInvert=self.output_index_reverse,
                                    outIndexClassification=additional_output, indexNumClasses=num_classes,
                                    minMaxVals=self.output_index_min_max, outReclassTable=None,
                                    thresholdScaling=threshold_scaling)

        # calculate indices
        sci.calculateIndices(from_AGOL=True)
        