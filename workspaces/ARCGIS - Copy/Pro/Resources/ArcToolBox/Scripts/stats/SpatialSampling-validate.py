import arcpy as ARCPY

def paramChanged(param, checkValue = False):
    changed = param.altered and not param.hasBeenValidated
    if checkValue:
        if param.value:
            return changed
        else:
            return False 
    else:
        return changed


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = ARCPY.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    
    def _isParamEmpty(self, parameter):
        if parameter.valueAsText in ['', None, '#']:
            return True
        return False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        parameters = self.params
        input_study_area = parameters[0]
        output_features = parameters[1]
        sampling_method = parameters[2]
        strata_id_field = parameters[3]
        strata_count_method = parameters[4]
        bin_shape = parameters[5]
        bin_size = parameters[6]
        h3_resolution = parameters[7]
        num_sample = parameters[8]
        num_samples_per_strata = parameters[9]
        population_field = parameters[10]
        geometry_type = parameters[11]
        min_distance = parameters[12]
        spatial_rel = parameters[13]

        # Limit sampling method options based on layer type of input study area.
        # p_sampling_method.filter.list = ["RANDOM", "STRAT_POLY", "STRAT_RAST", "STRAT_ID", "SYSTEMATIC", "CLUSTER"]
        if input_study_area.value:
            desc = ARCPY.Describe(input_study_area)
            layer_type = desc.dataType
            if layer_type in ['FeatureLayer', 'FeatureClass', 'ShapeFile']:
                sampling_method.filter.list = ["RANDOM", "STRAT_POLY", "STRAT_ID", "SYSTEMATIC", "CLUSTER"]
            elif layer_type in ["RasterLayer", "RasterDataset"]:
                sampling_method.filter.list = ["RANDOM", "STRAT_RAST", "STRAT_ID", "SYSTEMATIC", "CLUSTER"]
            # else:
            #     sampling_method.filter.list = ["RANDOM", "STRAT_POLY", "STRAT_RAST", "STRAT_ID", "SYSTEMATIC", "CLUSTER"]
        else:
            sampling_method.filter.list = ["RANDOM", "STRAT_POLY", "STRAT_RAST", "STRAT_ID", "SYSTEMATIC", "CLUSTER"]

        if sampling_method.valueAsText == "STRAT_RAST":
            strata_count_method.filter.list = ["EQUAL", "PROP_AREA"]
        else:
            strata_count_method.filter.list = ["EQUAL", "PROP_AREA", "FIELD", "PROP_FIELD"]

        # Control visibility of parameters based on other parameters.
        if self._isParamEmpty(sampling_method):
            sampling_method.value = "RANDOM"
        if sampling_method.valueAsText == "STRAT_ID":
            strata_id_field.enabled = True
        else:
            strata_id_field.enabled = False

        # Check if the field is empty
        if self._isParamEmpty(strata_count_method):
            strata_count_method.value = "EQUAL"

        if sampling_method.valueAsText in ["STRAT_POLY", "STRAT_RAST", "STRAT_ID"] :
            strata_count_method.enabled = True
        else:
            strata_count_method.enabled = False

        if sampling_method.valueAsText in ["CLUSTER", "SYSTEMATIC"] :
            bin_shape.enabled = True
            bin_size.enabled = True
            if not (sampling_method.valueAsText == 'SYSTEMATIC' and geometry_type.value == "POINT"):
                spatial_rel.enabled = True
            else:
                spatial_rel.enabled = False
        else:
            bin_shape.enabled = False
            bin_size.enabled = False
            spatial_rel.enabled = False

        # Check if the value of bin shape is empty
        if bin_shape.enabled and self._isParamEmpty(bin_shape):
            bin_shape.value = "HEXAGON"

        if sampling_method.valueAsText in ['SYSTEMATIC', 'CLUSTER']:
            if bin_shape.valueAsText == "H3_HEXAGON":
                h3_resolution.enabled = True
                bin_size.enabled = False
            else:
                h3_resolution.enabled = False
        else:
            h3_resolution.enabled = False

        if (sampling_method.valueAsText in ["RANDOM", "CLUSTER"]) or \
         ((sampling_method.valueAsText in ["STRAT_POLY", "STRAT_RAST", "STRAT_ID"] and \
         strata_count_method.valueAsText in ["PROP_AREA", "PROP_FIELD"])):
            num_sample.enabled = True
        else:
            num_sample.enabled = False

        if sampling_method.valueAsText in ["STRAT_POLY", "STRAT_RAST", "STRAT_ID"] and \
         strata_count_method.valueAsText == "EQUAL":
            num_samples_per_strata.enabled = True
        else:
            num_samples_per_strata.enabled = False

        if sampling_method.valueAsText in ["STRAT_POLY", "STRAT_RAST", "STRAT_ID"] and \
         strata_count_method.valueAsText in ["FIELD", "PROP_FIELD"]:
            population_field.enabled = True
        else:
            population_field.enabled = False

        if sampling_method.valueAsText == "SYSTEMATIC":
            geometry_type.enabled = True
        else:
            geometry_type.enabled = False

        if (sampling_method.valueAsText in ["RANDOM", "STRAT_POLY", "STRAT_RAST", "STRAT_ID"]):
            min_distance.enabled = True
        else:
            min_distance.enabled = False

        
        # Reset to default numerical parameters
        if min_distance.enabled and self._isParamEmpty(min_distance):
            min_distance.value = 0
        if h3_resolution.enabled and self._isParamEmpty(h3_resolution):
            h3_resolution.value = 7

        # if num_sample.enabled:
        #     if sampling_method.valueAsText == "CLUSTER" and not num_sample.altered:
        #         num_sample.value = 10
            
        if num_sample.enabled and self._isParamEmpty(num_sample):
            if sampling_method.valueAsText == "CLUSTER":
                num_sample.value = 10
            else:
                num_sample.value = 100
            
        if not (paramChanged(sampling_method) and paramChanged(num_sample)):
            if not sampling_method.hasBeenValidated:
                if sampling_method.valueAsText == "CLUSTER":
                    num_sample.value = 10
                else:
                    num_sample.value = 100
                    
        if num_samples_per_strata.enabled and self._isParamEmpty(num_samples_per_strata):
            num_samples_per_strata.value = 100
        if geometry_type.enabled and self._isParamEmpty(geometry_type):
            geometry_type.value = 'POINT'

        # Schema geometry for model builder
        if (sampling_method.valueAsText == "SYSTEMATIC" and geometry_type.valueAsText == "POLYGON") or sampling_method.valueAsText == "CLUSTER":
            output_features.schema.geometryType = "Polygon"
        else:
            output_features.schema.geometryType = "Point"

        return


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        parameters = self.params
        input_study_area = parameters[0]
        sampling_method = parameters[2]
        strata_id_field = parameters[3]
        strata_count_method = parameters[4]
        bin_shape = parameters[5]
        bin_size = parameters[6]
        h3_resolution = parameters[7]
        num_sample = parameters[8]
        num_samples_per_strata = parameters[9]
        population_field = parameters[10]
        geometry_type = parameters[11]
        min_distance = parameters[12]

        if input_study_area.value:
            desc = ARCPY.Describe(input_study_area)
            layer_type = desc.dataType
            if layer_type in ['FeatureLayer', 'FeatureClass']:
                if desc.shapeType != 'Polygon':
                    input_study_area.setIDMessage("ERROR", 366)
            elif layer_type in ["RasterLayer", "RasterDataset"]:
                if not desc.isInteger or desc.tableType != 'Value':
                    input_study_area.setIDMessage("ERROR", 969)

        #### Make optional params, required ####
        for opt_param in [strata_id_field, bin_size, population_field]:
            if opt_param.enabled and self._isParamEmpty(opt_param):
                opt_param.setIDMessage("ERROR", 530)

        #### Check the range ####
        for positive_Param in [num_sample, num_samples_per_strata]:
            if positive_Param.enabled and positive_Param.value <= 0:
                positive_Param.setIDMessage("ERROR", 531)

        if bin_size.enabled:
            if bin_size.value in [None, '', '#']:
                bin_size.setIDMessage("ERROR", 530)
            else:
                bin = bin_size.valueAsText.split(" ")[0]
                if bin not in ['', None, '#'] and float(bin) <= 0:
                    bin_size.setIDMessage("ERROR", 531)

        # dist = UTILS.quickLinearUnitPrint(min_distance).split(" ")[0]
        try:
            dist = min_distance.valueAsText.split(" ")[0]
            if dist not in ['', None, '#'] and int(dist) < 0:
                min_distance.setIDMessage("ERROR", 673)
        except:
            pass

        return True
