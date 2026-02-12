import arcpy
import importlib
import os
from collections import Counter
from rapathutils import swizzle_path
from ThreeD_Utilities import ApplyRemapDictionary, CreateRemapDictionary, \
    ReadModel, ValidateTrainingData, ValidatePretrainedModel, \
    pctd_attributes_dict, model_architecture_keyword_name, model_architecture_dict, \
    validate_model_name, create_unique_folder


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        # Tool parameters
        self.params              = arcpy.GetParameterInfo()
        self.training_data       = self.params[0]
        self.model_location      = self.params[1]
        self.model_name          = self.params[2]
        self.pretrained_model    = self.params[3]
        self.attributes          = self.params[4]
        self.class_remap         = self.params[6]
        self.target_classes      = self.params[7]
        self.background_class    = self.params[8]
        self.class_descriptions  = self.params[9]
        self.out_model           = self.params[16]
        self.out_model_stats     = self.params[17]
        self.out_epoch_stats     = self.params[19]
        self.architecture        = self.params[20]
        self.loss_function       = self.params[21]

        # Modify attribute list to checkbox list
        self.attributes.controlCLSID = '{38C34610-C7F7-11D5-A693-0008C711C8C1}'

        # Tool variables
        self.all_attributes      = list(pctd_attributes_dict.keys())
        self.all_codes           = range(256)

        # Tool dictionaries
        # Dictionary for matching pctd attributes to tool keywords
        self.reverse_pctd_attributes_dict = {v: k for k, v in pctd_attributes_dict.items()}
        # Dictionary for class code values and labels
        self.classcode_label_dict = {
            # Class code labels based on ASPRS LAS 1.4 R14 specification
            0: arcpy.GetIDMessage(86527), # Never Classified
            1: arcpy.GetIDMessage(86528), # Unassigned
            2: arcpy.GetIDMessage(86529), # Ground
            3: arcpy.GetIDMessage(86530), # Low Vegetation
            4: arcpy.GetIDMessage(86531), # Medium Vegetation
            5: arcpy.GetIDMessage(86532), # High Vegetation
            6: arcpy.GetIDMessage(86533), # Building
            7: arcpy.GetIDMessage(86534), # Low Noise
            8: arcpy.GetIDMessage(86535), # Model Key
            9: arcpy.GetIDMessage(86536), # Water
            10: arcpy.GetIDMessage(86537), # Rail
            11: arcpy.GetIDMessage(86538), # Road Surface
            12: arcpy.GetIDMessage(86539), # Overlap
            13: arcpy.GetIDMessage(86540), # Wire Guard
            14: arcpy.GetIDMessage(86541), # Wire Conductor
            15: arcpy.GetIDMessage(86542), # Transmission Tower
            16: arcpy.GetIDMessage(86543), # Wire Structure Connector
            17: arcpy.GetIDMessage(86544), # Bridge Deck
            18: arcpy.GetIDMessage(86545), # High Noise
            19: arcpy.GetIDMessage(86552), # Overhead Structure
            20: arcpy.GetIDMessage(86553), # Ignored Ground
            21: arcpy.GetIDMessage(86554), # Snow
            22: arcpy.GetIDMessage(86555)  # Temporal Exclusion
        }

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        # Maintain sort order of a given list
        def sorted_attributes(unsorted_attributes):
            unsorted_attributes = {self.reverse_pctd_attributes_dict[attribute] for attribute in (unsorted_attributes- {'xyz'})}
            sorted_attributes = [x for x in self.all_attributes if x in unsorted_attributes]
            return sorted_attributes

        # Load class code descriptions dictionary
        def load_descriptions(class_descriptions, codes_to_load):
            for class_code in codes_to_load:
                # Parse background class code as string to handle 0
                if str(class_code) == self.background_class.valueAsText:
                    class_descriptions.append((self.background_class.value, arcpy.GetIDMessage(86526)))
                elif class_code in set(self.classcode_label_dict.keys()):
                    class_descriptions.append((class_code, self.classcode_label_dict[class_code]))
                else:
                    class_descriptions.append((class_code, ''))
            return class_descriptions

        # Sources of default values for parameters
        classDescriptionList = []
        loadDescriptions = False
        trainingClasses = list(self.all_codes)
        targetClassCodeList = list(self.all_codes)
        # Define default remapping filters which will get overwritten by training data and pretrained model
        self.class_remap.filters[0].list = sorted(list(self.all_codes)) + ['OTHER']
        self.class_remap.filters[1].list = list(self.all_codes)
        # Define default enabled state, overwritten by pretrained model
        self.target_classes.enabled = True
        # Populate the output location parameter with the current workspace environment setting
        if arcpy.env.workspace and not self.model_location.valueAsText:
            desc = arcpy.Describe(arcpy.env.workspace)
            defaultWorkspace = arcpy.env.workspace if desc.workspaceType == 'FileSystem' else desc.path
            self.model_location.value = swizzle_path(defaultWorkspace)
            
        if self.pretrained_model.valueAsText:
            self.target_classes.enabled = False
            emd = ValidatePretrainedModel(swizzle_path(self.pretrained_model.valueAsText))
            if emd.supportedPretrainedModelArchitecture and emd.supportedPretrainedModelVersion:
                pretrained_attributes = sorted_attributes(emd.pretrainedModelAttributes)
                # Set the attributes to always match the model
                self.attributes.filter.list = pretrained_attributes
                self.attributes.value       = pretrained_attributes
                # Set the architecture to always match the model
                self.architecture.value = model_architecture_keyword_name[emd.modelArchitecture]
                # Updated class code labels with information from pretrained model
                pretrained_info = ReadModel(swizzle_path(self.pretrained_model.valueAsText))
                [self.classcode_label_dict.update({info["Value"]: info["Name"]}) for info in pretrained_info['Classes']]
                classDescriptionList = [pretrained_classes['Value'] for pretrained_classes in pretrained_info['Classes']]
                self.class_remap.filters[1].list = classDescriptionList
                if not self.loss_function.altered and 'FocalLoss' in pretrained_info:
                    self.loss_function.value = 'FOCAL_LOSS' if pretrained_info['FocalLoss'] else 'CROSS_ENTROPY_LOSS'
                loadDescriptions = True
        else:
            if not self.training_data.valueAsText:
                classDescriptionList = []
            if not self.architecture.altered:
                self.architecture.value = "RANDLANET"

        if self.training_data.value:
            # Assign default value for model name
            if self.model_location.value and not self.model_name.value:
                modelFolderName = f'{swizzle_path(os.path.splitext(self.training_data.valueAsText)[0])}_PointClassificationModel'
                # If folder location exists, use routine to create unique model name
                #if os.path.exists(self.model_location.valueAsText):
                modelFolderPath = create_unique_folder(self.model_location.valueAsText, modelFolderName)
                # Assign default model name
                self.model_name.value = os.path.basename(modelFolderPath)

            # Use information from training data to define values for subsequent parameters
            pctd = ValidateTrainingData(swizzle_path(self.training_data.valueAsText))
            if pctd.trainingDataExists and pctd.supportedTrainingVersion and pctd.supportedValidationVersion:
                loadDescriptions = True
                # Define source class code remap field filter
                self.class_remap.filters[0].list = sorted(list(pctd.trainingClassCodes.union(pctd.validationClassCodes))) + ['OTHER']
                # Define attribute parameter domain using training data
                if not self.pretrained_model.value:
                    self.attributes.filter.list = sorted_attributes(pctd.trainingAttributes)
                    trainingClasses = pctd.trainingClassCodes
                    targetClassCodeList = pctd.trainingTargetClassCodes.intersection(pctd.validationClassCodes)
                    
        # Remove space from beginning and end of name
        if self.model_name.valueAsText:
            self.model_name.value = self.model_name.valueAsText.strip(" ")

        if not self.training_data.valueAsText and not self.pretrained_model.valueAsText:
            loadDescriptions = False
            self.attributes.filter.list = self.all_attributes
            self.attributes.values = []
            trainingClasses = self.all_codes
            targetClassCodeList = self.all_codes

        # Update class code list if remap table is used
        if self.class_remap.values:
            if self.class_remap.altered:
                remap_dictionary, other_value = CreateRemapDictionary(self.class_remap.values)
                trainingClasses = ApplyRemapDictionary(pctd.trainingClassCodes,
                                                       remap_dictionary, other_value)
                validationClasses = ApplyRemapDictionary(pctd.validationClassCodes,
                                                         remap_dictionary, other_value)
                commonClasses = trainingClasses.intersection(validationClasses)
                targetClassCodeList = commonClasses
                trainingClasses = commonClasses
                loadDescriptions = True
        if not (self.pretrained_model.valueAsText and os.path.isfile(self.pretrained_model.valueAsText)):
            classDescriptionList = sorted(list(trainingClasses))
        self.target_classes.filter.list = sorted(list(targetClassCodeList))
        if self.target_classes.value:
            self.background_class.enabled = True
            self.background_class.filter.list = sorted(list(set(self.all_codes) - set(self.target_classes.values)))
            classDescriptionList = self.target_classes.values
            loadDescriptions = True
            # Get background value as text to properly evaluate the presence of 0
            if self.background_class.valueAsText:
                classDescriptionList.append(self.background_class.value)
        else:
            self.background_class.enabled = False
            self.background_class.value = None

        # Update class code descriptions values to only ones present in the model
        self.class_descriptions.filters[0].list  = sorted(classDescriptionList)

        # Define class code descriptions based on class codes that will be used
        if classDescriptionList:
            classDescriptions = []
            # Maintains user-modified class code labels
            if self.class_descriptions.value and loadDescriptions:
                classDescriptions = self.class_descriptions.values
                # Adding new codes to the list while retaining old codes
                newCodes = list(set(classDescriptionList)- set(dict(classDescriptions)))
                classDescriptions = load_descriptions(classDescriptions, newCodes)
                self.class_descriptions.values = classDescriptions
                # Remove codes that are no longer in the domain
                oldCodes = list(set(dict(classDescriptions)) - set(classDescriptionList))
                self.class_descriptions.values = [(code, description) for (code, description) in classDescriptions if code not in oldCodes]
            # Populates default class code labels when no custom labels are present
            elif loadDescriptions:
                classDescriptions = load_descriptions(classDescriptions,
                                                      classDescriptionList)
                self.class_descriptions.values = classDescriptions

        # Define derived parameters for model builder
        if self.model_location.value and self.model_name.value:
            self.out_model.value = os.path.join(self.model_location.valueAsText, self.model_name.valueAsText, f"{self.model_name.valueAsText}.emd")
            checkPointPath = os.path.join(swizzle_path(self.model_location.valueAsText), f"{self.model_name.valueAsText}.checkpoints")
            # If folder location exists, use routine to create unique model name for the sake of model builder
            # Model builder must have logic to emulate if any expected input does not yet exist
            # For this reason, we have to add checks for uniqueness when expected input actually exists
            if os.path.exists(self.model_location.valueAsText):
                checkPointPath = create_unique_folder(swizzle_path(self.model_location.valueAsText), f"{self.model_name.valueAsText}.checkpoints")
            self.out_model_stats.value = os.path.join(checkPointPath, f"{self.model_name.valueAsText}_{arcpy.GetIDMessage(86551)}.csv") # <model name>_Statistics.csv
            self.out_epoch_stats.value = os.path.join(checkPointPath, f"{self.model_name.valueAsText}_{arcpy.GetIDMessage(86509)}_{arcpy.GetIDMessage(86551)}.csv") # <model name>_Statsitics.csv
  
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
        if self.class_descriptions.values:
            descriptionCodeCount = Counter([code for (code, description) in self.class_descriptions.values])
            duplicateCodes = [str(codes) for codes, count in descriptionCodeCount.items() if count > 1]
            if duplicateCodes:
                self.class_descriptions.setIDMessage("ERROR", 50179, ",".join(duplicateCodes))
        # Check for existing output and validate against overwriteOutput environment setting
        if self.model_location.value and self.model_name.value:
            modelOSPath =  swizzle_path(self.model_location.valueAsText)
            out_model = os.path.join(modelOSPath, self.model_name.valueAsText)
            out_model_file = os.path.realpath(os.path.join(modelOSPath, self.model_name.valueAsText, self.model_name.valueAsText))
            # Convert paths to lower-case to ensure valid comparison for Windows OS
            if os.name == 'nt':
                out_model_file = out_model_file.lower()

            model_name_error = False
            if self.pretrained_model.valueAsText:
                # Get pretrained model without extension (emd or dlpk)
                pretrained_model_file = swizzle_path(os.path.realpath(os.path.splitext(self.pretrained_model.valueAsText)[0]))
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

        # Make the background class code required if classes of interest are specified
        if self.target_classes.value:
            if not self.background_class.valueAsText:
                self.background_class.setIDMessage('ERROR', 735, self.background_class.displayName)

        # Verify training data if it exists so ModelBuilder intermediate output works
        trainingClasses, validationClasses = None, None
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
                    remap_dictionary, other_value = CreateRemapDictionary(self.class_remap.values)
                    trainingClasses = ApplyRemapDictionary(validateTraining.trainingClassCodes,
                                                            remap_dictionary,
                                                            other_value)
                    validationClasses = ApplyRemapDictionary(validateTraining.validationClassCodes,
                                                              remap_dictionary,
                                                              other_value)

                    commonClasses = trainingClasses.intersection(validationClasses)
                    allClasses =  trainingClasses.union(validationClasses)
                    unmatchedTrainingClasses = trainingClasses.difference(commonClasses)
                    unmatchedValidationClasses = validationClasses.difference(commonClasses)
                    # Return error or warning message based on background class code
                    if unmatchedTrainingClasses or unmatchedValidationClasses and other_value is None:
                        msg = ""
                        if unmatchedTrainingClasses:
                            msg += f"\n{arcpy.GetIDMessage(86589)}: {sorted(list(unmatchedTrainingClasses))}"
                        if unmatchedValidationClasses:
                            msg += f"\n{arcpy.GetIDMessage(86590)}: {sorted(list(unmatchedValidationClasses))}"
                        if commonClasses:
                            msg += f"\n\n{arcpy.GetIDMessage(86591)}: {sorted(list(commonClasses))}"
                        status = "Warning" if self.target_classes.valueAsText else "Error"
                        self.class_remap.setIDMessage(status, 50202, msg)
                    elif self.target_classes.values:
                        if len(allClasses.difference(set(self.target_classes.values))) == 0:
                            self.target_classes.setIDMessage('ERROR', 50208)

                if not self.pretrained_model.valueAsText:
                    architectureMinPoints = model_architecture_dict[self.architecture.valueAsText]["MinPoints"]
                    if validateTraining.trainingMaxPoints < architectureMinPoints:
                        self.architecture.setIDMessage('ERROR', 50213, validateTraining.trainingMaxPoints, architectureMinPoints)

        # Validate pretrained model
        if self.pretrained_model.valueAsText:
            # Verify pretrained model if it exists so ModelBuilder's intermediate output works
            validatePretrained = ValidatePretrainedModel(swizzle_path(self.pretrained_model.valueAsText))
            if validatePretrained.pretrainedModelExists:
                if not validatePretrained.pretrainedModelValid:
                    # MSG: "Unknown or unsupported model type."
                    self.pretrained_model.setIDMessage('ERROR', 50171)
                elif not validatePretrained.supportedPretrainedModelArchitecture:
                    # MSG: "Invalid model architecture (requires PointCNN or RandLANet)."
                    self.pretrained_model.setIDMessage('ERROR', 2514, arcpy.GetIDMessage(86549))
                elif not validatePretrained.supportedPretrainedModelVersion:
                    # MSG: "Minimum required version for <neural network architecture> is <version_minimum>."
                    self.pretrained_model.setIDMessage('ERROR', 50164, validatePretrained.modelArchitecture, validatePretrained.requiredModelVersion)
        # Verify training data matches pretrained model
        if self.training_data.valueAsText and self.pretrained_model.valueAsText:
            # Only validate if training data and validation data exist
            if validateTraining.trainingDataExists and validatePretrained.pretrainedModelExists:
                # Validate block size in training data matches block size in pretrained model
                if validatePretrained.pretrainedModelBlockSize != validateTraining.trainingBlockSize:
                    self.training_data.setIDMessage('WARNING', 50187, validateTraining.trainingBlockSize, validatePretrained.pretrainedModelBlockSize)
                # Validate point count in training data matches point count in pretrained model
                if validatePretrained.pretrainedModelMaxPoints != validateTraining.trainingMaxPoints:
                    self.training_data.setIDMessage('ERROR', 50188, validateTraining.trainingMaxPoints, validatePretrained.pretrainedModelMaxPoints)
                # Validate attributes in training data match pretrained model
                if validatePretrained.pretrainedModelAttributes and validateTraining.trainingAttributes:
                    missingAttributes = list(validatePretrained.pretrainedModelAttributes.difference(validateTraining.trainingAttributes))
                    if missingAttributes:
                        self.training_data.setIDMessage('ERROR',50163, arcpy.GetIDMessage(86546), sorted(list(missingAttributes)))
                # Validate classes in training data match pretrained model
                allClasses = trainingClasses.union(validationClasses)
                missingClasses = validatePretrained.pretrainedModelClassCodes.difference(allClasses)
                extraClasses = allClasses.difference(validatePretrained.pretrainedModelClassCodes)
                if missingClasses:
                    self.class_remap.setIDMessage('ERROR',50163, arcpy.GetIDMessage(86547), sorted(list(missingClasses)))
                if extraClasses:
                    self.class_remap.setIDMessage('ERROR', 50170, sorted(list(extraClasses)))
