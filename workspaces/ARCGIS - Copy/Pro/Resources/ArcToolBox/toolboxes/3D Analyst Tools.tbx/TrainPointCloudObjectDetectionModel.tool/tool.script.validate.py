import arcpy
import importlib
import os
from collections import Counter
from rapathutils import swizzle_path
from ThreeD_Utilities import ApplyRemapDictionary, CreateRemapDictionary, \
    ReadModel, ValidateTrainingData, ValidatePretrainedModel, \
    pctd_attributes_dict, model_architecture_keyword_name, validate_model_name, \
    model_architecture_dict, architecture_settings_dict, sorted_attributes, \
    create_unique_folder

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        # Tool parameters
        self.params                = arcpy.GetParameterInfo()
        self.training_data         = self.params[0]
        self.model_location        = self.params[1]
        self.model_name            = self.params[2]
        self.pretrained_model      = self.params[3]
        self.architecture          = self.params[4]
        self.attributes            = self.params[5]
        self.remap_objects         = self.params[7]
        self.target_objects        = self.params[8]
        self.training_blocks       = self.params[9]
        self.object_descriptions   = self.params[10]
        self.architecture_settings = self.params[17]
        self.out_model             = self.params[18]
        self.out_model_stats       = self.params[19]

        # Tool variables
        self.all_attributes_list   = list(pctd_attributes_dict)
        self.all_codes_list        = list(range(256))

        # Dictionary for class code values and labels
        self.object_label_dict = dict()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        # Modify attribute list to checkbox list
        self.attributes.controlCLSID = '{38C34610-C7F7-11D5-A693-0008C711C8C1}'

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        # Load class code descriptions dictionary
        def load_descriptions(class_descriptions, codes_to_load):
            for object_code in codes_to_load:
                if object_code in set(self.object_label_dict.keys()):
                    class_descriptions.append((object_code, self.classcode_label_dict[object_code]))
                else:
                    class_descriptions.append((object_code, ''))
            return class_descriptions

        # Default values for parameter filters
        attributesList        = self.all_attributes_list
        remapOldCodesList     = self.all_codes_list
        remapNewCodesList     = self.all_codes_list
        targetObjectCodeList  = self.all_codes_list
        objectDescriptionList = self.all_codes_list

        # Populate Output Location with Current Workspace environment setting
        if arcpy.env.workspace and not self.model_location.valueAsText:
            # Use default workspace if folder, otherwise use parent folder of non folder workspace (e.g. fgdb)
            desc = arcpy.Describe(arcpy.env.workspace)
            defaultWorkspace = arcpy.env.workspace if desc.workspaceType == 'FileSystem' else desc.path
            self.model_location.value = swizzle_path(defaultWorkspace)

        # Populate attributes and codes from training data
        if self.training_data.valueAsText:
            trainingDataPath = swizzle_path(self.training_data.valueAsText)
            # Assign default model name
            if self.model_location.valueAsText and not self.model_name.valueAsText:
                emdFullPath = create_unique_folder(self.model_location.valueAsText,
                                                   f'{os.path.splitext(os.path.basename(trainingDataPath))[0]}_ObjectDetectionModel')
                self.model_name.value = os.path.basename(emdFullPath)

            # Use information from training data to define values for subsequent parameters
            pctd = ValidateTrainingData(trainingDataPath)
            if pctd.trainingDataExists and pctd.supportedTrainingVersion and pctd.supportedValidationVersion:
                # Define "Current Code" remap options
                remapOldCodesList = sorted(list(pctd.trainingObjectCodes.union(pctd.validationObjectCodes)))
                # Restrict attributes to ones present in training data
                attributesList = sorted_attributes(pctd.trainingAttributes)
                commonTrainingDataObjectsList = list(pctd.trainingObjectCodes.intersection(pctd.validationObjectCodes))
                targetObjectCodeList = list(commonTrainingDataObjectsList)
                objectDescriptionList = list(commonTrainingDataObjectsList)
            else:
                self.attributes.values = []
        # Remove space from beginning and end of name
        if self.model_name.valueAsText:
            self.model_name.value = self.model_name.valueAsText.strip(" ") 

        # Overwrite attributes filter and architecture from pretrained model
        if self.pretrained_model.valueAsText:
            self.target_objects.enabled = False
            self.architecture_settings.enabled = False
            emd = ValidatePretrainedModel(self.pretrained_model.valueAsText)
            if emd.supportedPretrainedModelArchitecture and emd.supportedPretrainedModelVersion:
                pretrained_attributes = sorted_attributes(emd.pretrainedModelAttributes)
                # Set the attributes to always match the model
                attributesList              = pretrained_attributes
                self.attributes.values      = attributesList
                # Set the architecture to always match the model
                self.architecture.value = model_architecture_keyword_name[emd.modelArchitecture]
                # Updated object code labels with information from pretrained model
                pretrained_info = ReadModel(self.pretrained_model.valueAsText)
                [self.object_label_dict.update({info["Value"]: info["Name"]}) for info in pretrained_info['Classes']]
                pretrainedCodes = [pretrained_objects['Value'] for pretrained_objects in pretrained_info['Classes']]
                remapNewCodesList = pretrainedCodes
        else:
            # Reset disabled parmeters when pretrained model is removed
            self.target_objects.enabled = True
            self.architecture_settings.enabled = True
            if not self.training_data.valueAsText:
                objectDescriptionList = []
                self.attributes.values = []

        # Update object code list when remap table is used
        if self.remap_objects.values:
            if self.remap_objects.altered:
                remap_dictionary, other_value = CreateRemapDictionary(self.remap_objects.values)
                trainingObjectSet   = ApplyRemapDictionary(pctd.trainingObjectCodes,
                                                           remap_dictionary, other_value)
                validationObjectSet = ApplyRemapDictionary(pctd.validationObjectCodes,
                                                           remap_dictionary, other_value)
                commonObjectSet       = trainingObjectSet.intersection(validationObjectSet)
                # Modify the list of target object codes to only common objects after remapping
                objectDescriptionList = sorted(list(commonObjectSet))
                targetObjectCodeList  = sorted(list(commonObjectSet))

        # Define parameter filters
        if len(remapOldCodesList) > 2: remapOldCodesList.append('OTHER')
        self.attributes.filter.list        = attributesList
        self.remap_objects.filters[0].list = remapOldCodesList
        self.remap_objects.filters[1].list = remapNewCodesList
        self.target_objects.filter.list    = targetObjectCodeList
        #self.object_descriptions.filters[0].list = objectDescriptionList

        # Enable target_objects if there is more than 1 object code & no pretrained_model is provided
        self.target_objects.enabled = len(targetObjectCodeList) > 1 and not self.pretrained_model.valueAsText
        # If pretrained model doesn't exist, assign to match trainingObjects
        if not(self.pretrained_model.valueAsText and os.path.isfile(self.pretrained_model.valueAsText)) and self.target_objects.values:
            # Modify the list of class descriptions to match target objects
            objectDescriptionList = self.target_objects.values # returns list
        # Define class code descriptions based on class codes that will be used
        if objectDescriptionList:
            if self.object_descriptions.values:
                self.object_label_dict = dict(self.object_descriptions.values)
            for removeObject in set(self.object_label_dict).difference(set(objectDescriptionList)):
                self.object_label_dict.pop(removeObject)
            for addObject in set(objectDescriptionList).difference(set(self.object_label_dict)):
                self.object_label_dict[addObject] = ''
            #self.object_descriptions.filters[0].list = sorted(list(self.object_label_dict))
            #self.object_descriptions
            self.object_descriptions.values = list(self.object_label_dict.items())

        # Define derived parameters for model builder
        if self.model_location.value and self.model_name.value:
            self.out_model.value = os.path.join(self.model_location.valueAsText, self.model_name.valueAsText, f"{self.model_name.valueAsText}.emd")
            checkPointPath = os.path.join(self.model_location.valueAsText, f"{self.model_name.valueAsText}.checkpoints")
            # If folder location exists, use routine to create unique model name
            if os.path.exists(self.model_location.valueAsText):
                checkPointPath = create_unique_folder(self.model_location.valueAsText, f"{self.model_name.valueAsText}.checkpoints")
            self.out_model_stats.value = os.path.join(self.model_location.valueAsText, checkPointPath,
                                                      f"{self.model_name.valueAsText}_{arcpy.GetIDMessage(86551)}.csv")

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        # Check for required modules

        for pylib in ['arcgis', 'torch']:
            if not importlib.util.find_spec(pylib):
                self.training_data.setIDMessage('ERROR', 2667)
        # Validate output model name
        if self.model_name.valueAsText:
            valid_name = validate_model_name(self.model_name.valueAsText)
            if not valid_name:
                self.model_name.setIDMessage("Error", 354)
        # Check for duplicate class code entries
        if self.object_descriptions.values:
            descriptionCodeCount = Counter([code for (code, description) in self.object_descriptions.values])
            duplicateCodes = [str(codes) for codes, count in descriptionCodeCount.items() if count > 1]
            if duplicateCodes:
                self.object_descriptions.setIDMessage("ERROR", 50179, ",".join(duplicateCodes))
        # Validate architecture settings
        voxel_width_value = None
        voxel_height_value = None
        voxel_max_training = None
        voxel_max_validation = None
        if self.architecture_settings.values:
            for (user_architecture_option, user_architecture_value) in self.architecture_settings.values:
                if user_architecture_value:
                    if user_architecture_option == 'VOXEL_WIDTH':
                        voxel_width_value = user_architecture_value
                    elif user_architecture_option == 'VOXEL_HEIGHT':
                        voxel_height_value = user_architecture_value
                    elif user_architecture_option == 'MAX_TRAINING_VOXELS':
                        voxel_max_training = user_architecture_value
                    elif user_architecture_option == 'MAX_VALIDATION_VOXELS':
                        voxel_max_validation = user_architecture_value
                    if user_architecture_option in architecture_settings_dict[self.architecture.valueAsText] and len(user_architecture_value) >= 1:
                        arch_setting_minLimit = architecture_settings_dict[self.architecture.valueAsText][user_architecture_option]["MinLimit"]
                        if user_architecture_value.isdigit():
                            if int(user_architecture_value) < arch_setting_minLimit:
                                self.architecture_settings.setIDMessage("ERROR", 10478, user_architecture_option, arch_setting_minLimit - 1)
                        else:
                            # MSG: Invalid '%s' parameter value. Value must be an integer.
                            self.architecture_settings.setIDMessage("ERROR", 180604, user_architecture_option)

        # Flag parameter as required when one of its associated values are defined
        voxel_dependencies = [{voxel_width_value: 'VOXEL_WIDTH',
                               voxel_height_value: 'VOXEL_HEIGHT'},
                              {voxel_max_training: 'MAX_TRAINING_VOXELS',
                               voxel_max_validation: 'MAX_VALIDATION_VOXELS'}]
        for voxel_dependency in voxel_dependencies:
            if any(value is None for value in voxel_dependency) and any(voxel_dependency):
                self.architecture_settings.setIDMessage('ERROR', 735, voxel_dependency[None])

        # Check for existing output and validate against overwriteOutput environment setting
        if self.model_location.value and self.model_name.value:
            #out_model = os.path.join(self.model_location.valueAsText, self.model_name.valueAsText)
            out_model_file = os.path.realpath(os.path.join(self.model_location.valueAsText, self.model_name.valueAsText, self.model_name.valueAsText))
            # Convert paths to lower-case to ensure valid comparison for Windows OS
            if os.name == 'nt':
                out_model_file = out_model_file.lower()

            model_name_error = False
            if self.pretrained_model.valueAsText:
                # Get pretrained model without extension (emd or dlpk)
                pretrained_model_file = os.path.realpath(os.path.splitext(self.pretrained_model.valueAsText)[0])
                # Convert paths to lower-case to ensure valid comparison for Windows OS
                if os.name == 'nt':
                    pretrained_model_file = pretrained_model_file.lower()
                if out_model_file == pretrained_model_file:
                    # MSG: "Unable to overwrite pretrained model."
                    self.model_name.setIDMessage('ERROR', 515, "pretrained model")
                    model_name_error = True

            # Check if output model exists as emd or dlpk
            if not model_name_error and (os.path.isfile(f'{out_model_file}.emd') or os.path.isfile(f'{out_model_file}.pth') or os.path.isfile(f'{out_model_file}.dlpk')):
                if arcpy.env.overwriteOutput:
                    self.model_name.setIDMessage('WARNING', 870, arcpy.GetIDMessage(86558), self.model_name.valueAsText)
                else:
                    self.model_name.setIDMessage('ERROR', 872, arcpy.GetIDMessage(86558), self.model_name.valueAsText)
        # Verify training data if it exists so ModelBuilder intermediate output works
        trainingObjects, validationObjects, allTrainingObjects = None, None, None
        if self.training_data.valueAsText:
            validateTraining = ValidateTrainingData(swizzle_path(self.training_data.valueAsText))
            if validateTraining.trainingDataExists:
                if not validateTraining.expectedFiles:
                    self.training_data.setIDMessage('ERROR', 2514, arcpy.GetIDMessage(86556).lower())
                elif not validateTraining.expectedFolders:
                    self.training_data.setIDMessage('ERROR', 152)
                elif not validateTraining.supportedTrainingFormat or not validateTraining.supportedValidationFormat:
                    # MSG: "Unsupported format."
                    self.training_data.setIDMessage('ERROR', 1921)
                #if not {'type', 'version'}.issubset(set(validateTraining.trainingDataInfo)):
                    ## MSG: "Unsupported training data version for this operation."
                    #self.training_data.setIDMessage('ERROR', 3329, arcpy.GetIDMessage(86556).lower())
                elif not validateTraining.supportedTrainingVersion or not validateTraining.supportedValidationVersion:
                    # MSG: "Unsupported point cloud training data."
                    self.training_data.setIDMessage('ERROR', 50172)
                else:
                    remap_dictionary, other_value = CreateRemapDictionary(self.remap_objects.values)
                    trainingObjects = ApplyRemapDictionary(validateTraining.trainingObjectCodes,
                                                            remap_dictionary,
                                                            other_value)
                    validationObjects = ApplyRemapDictionary(validateTraining.validationObjectCodes,
                                                              remap_dictionary,
                                                              other_value)

                    commonObjects = trainingObjects.intersection(validationObjects)
                    allTrainingObjects =  trainingObjects.union(validationObjects)
                    unmatchedTrainingObjects = trainingObjects.difference(commonObjects)
                    unmatchedValidationObjects = validationObjects.difference(commonObjects)
                    if unmatchedTrainingObjects or unmatchedValidationObjects and other_value is None:
                        msg = ""
                        if unmatchedTrainingObjects:
                            msg += f"\nMismatching Training Object Codes: {sorted(list(unmatchedTrainingObjects))}"
                        if unmatchedValidationObjects:
                            msg += f"\nMismatching Validation Object Codes: {sorted(list(unmatchedValidationObjects))}"
                        if commonObjects:
                            msg += f"\n\nMatching Object Codes: {sorted(list(commonObjects))}"
                        status = "Warning" if self.target_objects.valueAsText else "Error"
                        self.remap_objects.setIDMessage(status, 50202, msg)
                    #elif self.target_objects.values:
                        #if len(allObjects.difference(set(self.target_objects.values))) == 0:
                            #self.target_objects.setIDMessage('ERROR', 50208)
                    # Verify architecture settings for VOXEL_WIDTH and VOXEL_HEIGHT
                    voxel_width_size_limit = validateTraining.trainingBlockSize / 64
                    voxel_height_size_limit = validateTraining.trainingZRange * validateTraining.trainingScaleFactor / 32
                    voxel_dimension_dict = {"VOXEL_WIDTH": (voxel_width_value,voxel_width_size_limit),
                                            "VOXEL_HEIGHT": (voxel_height_value,voxel_height_size_limit)}
                    for voxel_dimension in voxel_dimension_dict:
                        voxel_dimension_val = voxel_dimension_dict[voxel_dimension][0]
                        voxel_dimension_size_limit = round(voxel_dimension_dict[voxel_dimension][1], 3)
                        if voxel_dimension_val:
                            if voxel_dimension_val.replace('.','',1).isdigit():
                                if float(voxel_dimension_val) > voxel_dimension_size_limit:
                                    # Will need a string added later
                                    self.architecture_settings.setErrorMessage(f"{voxel_dimension} must be equal to or lesser than {voxel_dimension_size_limit}.")
                            else:
                                self.architecture_settings.setErrorMessage(f"{voxel_dimension} must be a number.")
                if not self.pretrained_model.valueAsText:
                    architectureMinPoints = model_architecture_dict[self.architecture.valueAsText]["MinPoints"]
                    if validateTraining.trainingMaxPoints < architectureMinPoints:
                        self.architecture.setIDMessage('ERROR', 50213, validateTraining.trainingMaxPoints, architectureMinPoints)

        # Validate pretrained model
        if self.pretrained_model.valueAsText:
            # Verify pretrained model if it exists so ModelBuilder's intermediate output works
            validatePretrained = ValidatePretrainedModel(self.pretrained_model.valueAsText)
            if validatePretrained.pretrainedModelExists:
                if not validatePretrained.pretrainedModelValid or validatePretrained.pretrainedModelType != 'PointCloudOD':
                    # MSG: "Unknown or unsupported model type."
                    self.pretrained_model.setIDMessage('ERROR', 50171)
                #elif not validatePretrained.supportedPretrainedModelArchitecture:
                    # MSG: "Invalid model architecture (requires PointCNN or RandLANet)." (needs change)
                     #self.pretrained_model.setIDMessage('ERROR', 2514, arcpy.GetIDMessage(86549))
                elif not validatePretrained.supportedPretrainedModelVersion:
                    # MSG: "Minimum required version for <neural network architecture> is <version_minimum>."
                    self.pretrained_model.setIDMessage('ERROR', 50164, validatePretrained.modelArchitecture, validatePretrained.requiredModelVersion)
        # Verify training data matches pretrained model
        if self.training_data.valueAsText and self.pretrained_model.valueAsText:
            # Only validate if training data and validation data exist
            if validateTraining.trainingDataExists and validatePretrained.pretrainedModelExists:
                # Validate block size in training data matches pretrained model
                if validatePretrained.pretrainedModelBlockSize != validateTraining.trainingBlockSize:
                    self.training_data.setIDMessage('WARNING', 50187, validateTraining.trainingBlockSize, validatePretrained.pretrainedModelBlockSize)
                # Validate point limit in training data matches pretrained model
                if validatePretrained.pretrainedModelMaxPoints != validateTraining.trainingMaxPoints:
                    self.training_data.setIDMessage('ERROR', 50188, validateTraining.trainingMaxPoints, validatePretrained.pretrainedModelMaxPoints)
                # Validate attributes in training data match pretrained model
                if validatePretrained.pretrainedModelAttributes and validateTraining.trainingAttributes:
                    missingAttributes = list(validatePretrained.pretrainedModelAttributes.difference(validateTraining.trainingAttributes))
                    if missingAttributes:
                        self.training_data.setIDMessage('ERROR',50163, arcpy.GetIDMessage(86546), sorted(list(missingAttributes)))
                # Validate classes in training data match pretrained model
                pretrainedModelObjects = validatePretrained.pretrainedModelClassCodes
                missingClasses = pretrainedModelObjects.difference(allTrainingObjects)
                extraClasses = allTrainingObjects.difference(pretrainedModelObjects)
                if missingClasses:
                    self.remap_objects.setIDMessage('ERROR',50163, arcpy.GetIDMessage(86547), sorted(list(missingClasses)))
                if extraClasses:
                    self.remap_objects.setIDMessage('ERROR', 50170, sorted(list(extraClasses)))
