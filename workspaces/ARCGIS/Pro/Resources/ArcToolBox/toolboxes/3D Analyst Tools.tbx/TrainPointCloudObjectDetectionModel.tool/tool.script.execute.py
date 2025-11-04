import arcpy
import json
import mmap
import os
import rapathutils
import shutil
import subprocess
import sys
import tempfile
import time
import traceback

from ThreeD_Utilities import ValidateTrainingData, ValidatePretrainedModel, \
    pctd_attributes_dict, od_selection_dict, learning_dict, \
    ApplyRemapDictionary, CreateRemapDictionary, CompleteRemapDictionary, \
    DeleteExistingModelDirectory, model_architecture_dict, \
    write_to_memory_1b, read_from_memory_1b, read_from_memory, \
    read_from_memory_real, read_from_memory_32_safe, read_from_memory_string, \
    create_unique_folder

class CustomCancelException(Exception):
    pass

class CustomErrorException(Exception):
    pass

if __name__ in ('__main__', '__mp_main__'):
    try:
        def Assign_GPU():
            # Fails when CPU is defined as processor type
            if arcpy.env.processorType is None:
                processUsing = "GPU"
                processGPU = None
            elif arcpy.env.processorType == "GPU":
                processUsing = "GPU"
                processGPU = arcpy.env.gpuId if arcpy.env.gpuId is not None else 0
            elif arcpy.env.processorType == "CPU":
                # MSG: Processor type is invalid. (placeholder for more specific message)
                arcpy.AddIDMessage('ERROR', 260006)
                raise CustomErrorException()
            else:
                # MSG: Processor type is invalid.
                arcpy.AddIDMessage('ERROR', 260006)
                raise CustomErrorException()
            return processUsing, processGPU

        def ValidateObjectDetectionTrainingData(in_training_data, pretrained_model, architecture):
            validateTraining = ValidateTrainingData(in_training_data)
            if not validateTraining.trainingDataExists:
                # MSG: "Invalid input data."
                arcpy.AddIDMessage('ERROR', 152)
                raise CustomErrorException()
            if not validateTraining.supportedTrainingFormat or not validateTraining.supportedValidationFormat:
                # MSG: "Unsupported format."
                arcpy.AddIDMessage('ERROR', 1921)
                raise CustomErrorException()
            if not {'type', 'version'}.issubset(set(validateTraining.trainingDataInfo)):
                # MSG: "Unsupported training data version for this operation."
                arcpy.AddIDMessage('ERROR', 3329, arcpy.GetIDMessage(86556).lower())
                raise CustomErrorException()
            if not validateTraining.supportedTrainingVersion or not validateTraining.supportedValidationVersion:
                # MSG: "Unsupported point cloud training data."
                arcpy.AddIDMessage('ERROR', 50172)
                raise CustomErrorException()
            if not pretrained_model:
                architecturePointLimit = model_architecture_dict[architecture]["MinPoints"]
                if validateTraining.trainingMaxPoints < architecturePointLimit:
                    arcpy.AddIDMessage('ERROR', 50213, validateTraining.trainingMaxPoints, architecturePointLimit)
                    raise CustomErrorException()
            return validateTraining

        def Main():
            messageFile = None
            errorFile = None
            tempJsonFile = None
            try:
                """Get tool parameters"""
                in_training_data      = rapathutils.swizzle_path(arcpy.GetParameterAsText(0))
                out_model_location    = rapathutils.swizzle_path(arcpy.GetParameterAsText(1))
                out_model_name        = arcpy.GetParameterAsText(2)
                out_model             = os.path.join(out_model_location, out_model_name)
                working_folder        = rapathutils.swizzle_path(create_unique_folder(out_model_location, f"{out_model_name}.checkpoints"))
                pretrained_model      = rapathutils.swizzle_path(arcpy.GetParameterAsText(3))
                #architecture       = model_architecture_dict[arcpy.GetParameterAsText(4)]["Name"]
                attributes            = []
                attributes.extend(list(map(pctd_attributes_dict.get, arcpy.GetParameter(5))))
                min_points            = arcpy.GetParameter(6)
                remap_objects         = arcpy.GetParameter(7)
                target_objects        = []
                target_objects.extend(arcpy.GetParameter(8))
                training_blocks       = arcpy.GetParameter(9)
                object_descriptions   = arcpy.GetParameter(10)
                criteria              = od_selection_dict[arcpy.GetParameterAsText(11)]
                max_epochs            = arcpy.GetParameter(12)
                lr_strategy           = learning_dict[arcpy.GetParameter(13)]
                learning_rate         = arcpy.GetParameter(14)
                batch_size            = arcpy.GetParameter(15)
                early_stop            = arcpy.GetParameter(16)
                architecture_settings = arcpy.GetParameter(17)

                # Check if output exists
                if os.path.isdir(out_model):
                    if arcpy.env.overwriteOutput:
                        deleteSuccess = DeleteExistingModelDirectory(out_model)
                        if not deleteSuccess:
                            # MSG: %1!s!: Unable to delete the output %2!s!.
                            arcpy.AddIDMessage('ERROR', 903, arcpy.GetIDMessage(86558), out_model_name)
                            raise CustomErrorException()
                    else:
                        # MSG: Deep Learning Model: Dataset <out model> already exists and cannot be overwritten since
                        # the Overwrite existing datasets option is disabled.
                        arcpy.AddIDMessage('ERROR', 872, arcpy.GetIDMessage(86558), out_model_name)
                        raise CustomErrorException()

                # Populate architecture settings
                voxel_vals         = {}
                voxel_size_values  = [None, None, None]
                max_voxel_values   = [None, None]
                ## Populate architecture settings if pretrained model is not specified
                if not pretrained_model:
                    for row in range(0, architecture_settings.rowCount):
                        architecture_option = architecture_settings.getValue(row, 1)
                        if architecture_option:
                            if architecture_settings.getValue(row, 0) == "VOXEL_WIDTH":
                                voxel_size_values[0] = float(architecture_option)
                                voxel_size_values[1] = float(architecture_option)
                            elif architecture_settings.getValue(row, 0) == "VOXEL_HEIGHT":
                                voxel_size_values[2] = float(float(architecture_option))
                            elif architecture_settings.getValue(row, 0) == "VOXEL_POINT_LIMIT":
                                # Define the voxel points setting
                                voxel_vals["voxel_points"] = int(architecture_option)
                            elif architecture_settings.getValue(row, 0) == "MAX_TRAINING_VOXELS":
                                max_voxel_values[0] = int(architecture_option)
                            elif architecture_settings.getValue(row, 0) == "MAX_VALIDATION_VOXELS":
                                max_voxel_values[1] = int(architecture_option)
                    # Define voxel size only if width and height are provided
                    if all(voxel_size_values):
                        voxel_vals["voxel_size"] = voxel_size_values
                    # Define max voxel values only if both values are specified
                    if all(max_voxel_values):
                        voxel_vals["max_voxels"] = max_voxel_values

                # Validate training data
                validateTraining = ValidateTrainingData(in_training_data)

                if not validateTraining.trainingDataExists:
                    # MSG: "Invalid input data."
                    arcpy.AddIDMessage('ERROR', 152)
                    raise CustomErrorException()
                if not validateTraining.supportedTrainingFormat or not validateTraining.supportedValidationFormat:
                    # MSG: "Unsupported format."
                    arcpy.AddIDMessage('ERROR', 1921)
                    raise CustomErrorException()
                if not {'type', 'version'}.issubset(set(validateTraining.trainingDataInfo)):
                    # MSG: "Unsupported training data version for this operation."
                    arcpy.AddIDMessage('ERROR', 3329, arcpy.GetIDMessage(86556).lower())
                    raise CustomErrorException()
                if not validateTraining.supportedTrainingVersion or not validateTraining.supportedValidationVersion:
                    # MSG: "Unsupported point cloud training data."
                    arcpy.AddIDMessage('ERROR', 50172)
                    raise CustomErrorException()
                if not pretrained_model:
                    architecturePointLimit = model_architecture_dict[arcpy.GetParameterAsText(4)]["MinPoints"]
                    if validateTraining.trainingMaxPoints < architecturePointLimit:
                        arcpy.AddIDMessage('ERROR', 50213, validateTraining.trainingMaxPoints, architecturePointLimit)
                        raise CustomErrorException()

                # Create dictionary for class code remapping
                remap_list = []
                for row in range(0, remap_objects.rowCount):
                    remap_list.append((remap_objects.getValue(row, 0), remap_objects.getValue(row, 1)))
                originalObjectCodes = validateTraining.trainingObjectCodes.union(validateTraining.validationObjectCodes)
                remap_dictionary, other_value = CreateRemapDictionary(remap_list)

                # Verify training data has same class codes as validation data
                trainingCodes = ApplyRemapDictionary(validateTraining.trainingObjectCodes, remap_dictionary, other_value)
                validationCodes = ApplyRemapDictionary(validateTraining.validationObjectCodes, remap_dictionary, other_value)
                commonCodes = trainingCodes.intersection(validationCodes)
                allCodes =  trainingCodes.union(validationCodes)
                unmatchedTrainingCodes = trainingCodes.difference(commonCodes)
                unmatchedValidationCodes = validationCodes.difference(commonCodes)
                if (unmatchedTrainingCodes or unmatchedValidationCodes) and not target_objects:
                    msg = ""
                    if unmatchedTrainingCodes:
                        ### Mismatching Training Classes: {1, 2, 3, etc}
                        msg += f"\n{arcpy.GetIDMessage(86589)}: {sorted(list(unmatchedTrainingCodes))}"
                    if unmatchedValidationCodes:
                        ### Mismatching Validation Classes: {4, 5, 6, etc}
                        msg += f"\n{arcpy.GetIDMessage(86590)}: {sorted(list(unmatchedValidationCodes))}"
                    if commonCodes:
                        ### Common Codes: {7, 8, 9, etc}
                        msg += f"\n\n{arcpy.GetIDMessage(86591)}: {sorted(list(commonCodes))}"
                    arcpy.AddIDMessage('ERROR',50202, msg)
                    raise CustomErrorException()
                elif not set(target_objects).issubset(commonCodes):
                    ### One or more target classes are not present in both training and validation data.
                    ### MSG: "Common Classes: {7, 8, 9, etc}"
                    msg = f"\n{arcpy.GetIDMessage(86591)}: {sorted(list(commonCodes))}"
                    arcpy.AddIDMessage('ERROR', 50207, msg)
                    raise CustomErrorException()

                # Verify pretrained model is of the correct architecture & version
                if pretrained_model:
                    validatePretrained = ValidatePretrainedModel(pretrained_model)
                    if not validatePretrained.pretrainedModelValid:
                        # MSG: "Unknown or unsupported model type."
                        arcpy.AddIDMessage('ERROR', 50171)
                        raise CustomErrorException()
                    if not validatePretrained.pretrainedModelExists:
                        # MSG: "Invalid deep learning model."
                        arcpy.AddIDMessage('ERROR', 2514, arcpy.GetIDMessage(86558).lower())
                        raise CustomErrorException()
                    if not validatePretrained.supportedPretrainedModelArchitecture:
                        # MSG: "Invalid model architecture (requires PointCNN or RandLANet)."
                        arcpy.AddIDMessage('ERROR', 2514, arcpy.GetIDMessage(86549))
                        raise CustomErrorException()
                    if not validatePretrained.supportedPretrainedModelVersion:
                        # MSG: "Minimum required version for <neural network architecture> is <version_minimum>."
                        arcpy.AddIDMessage('ERROR', 50164, validatePretrained.modelArchitecture, validatePretrained.requiredModelVersion)
                        if validatePretrained.pretrainedModelVersion == 'unknown':
                            # MSG: "Model was trained using an unspecified version of ArcGIS Learn."
                            arcpy.AddIDMessage('INFORMATIVE', 86548)
                            raise CustomErrorException()
                        else:
                            # MSG: "Model was trained using ArcGIS Learn version <version number>."
                            arcpy.AddIDMessage('INFORMATIVE', 86588, validatePretrained.pretrainedModelVersion)
                            raise CustomErrorException()

                    # Validate block size in training data matches block size in pretrained model
                    if validatePretrained.pretrainedModelBlockSize != validateTraining.trainingBlockSize:
                        # MSG: Training data's block size (%1!d! meters) does not match the pretrained model (%2!d! meters).
                        arcpy.AddIDMessage('WARNING', 50187, validateTraining.trainingBlockSize, validatePretrained.pretrainedModelBlockSize)
                    # Validate point count in training data matches point count in pretrained model
                    if validatePretrained.pretrainedModelMaxPoints != validateTraining.trainingMaxPoints:
                        # MSG: "Training data's maximum point limit (%1!d!) does not match the pretrained model (%2!d!)."
                        arcpy.AddIDMessage('ERROR', 50188, validateTraining.trainingMaxPoints, validatePretrained.pretrainedModelMaxPoints)
                        raise CustomErrorException()

                    # Verify training data has same attributes as pretrained model
                    missingAttributes = list(validatePretrained.pretrainedModelAttributes - validateTraining.trainingAttributes)
                    if missingAttributes:
                        # MSG: "The input data does not have the following 'attributes' required by the classification model: <missing_attributes>."
                        arcpy.AddIDMessage('ERROR',50163, arcpy.GetIDMessage(86546), ', '.join([str(missingAttribute) for missingAttribute in missingAttributes]))
                        raise CustomErrorException()

                    # Verify training data has same class codes as pretrained model
                    missingCodes = validatePretrained.pretrainedModelClassCodes.difference(allCodes)
                    if missingCodes:
                        # MSG: "The input data does not have the following 'class codes' required by the classification model: <missing_classes>."
                        arcpy.AddIDMessage('ERROR',50163, arcpy.GetIDMessage(86547), ', '.join([str(missingCode) for missingCode in missingCodes]))
                        raise CustomErrorException()
                    extraClasses = allCodes.difference(validatePretrained.pretrainedModelClassCodes)
                    if extraClasses:
                        # MSG: "The following class codes in the training data are not present in the pretrained model and must be remapped: <extra_classes>."
                        arcpy.AddIDMessage('ERROR', 50170, ', '.join([str(extraClass) for extraClass in extraClasses]))
                        raise CustomErrorException()

                # Create dictionary of class code descriptions
                objectCode_dictionary = {}
                for row in range(0, object_descriptions.rowCount):
                    objectCode_dictionary[int(object_descriptions.getValue(row, 0))] = object_descriptions.getValue(row, 1)
                # Prepare Data
                finalRemapDict = CompleteRemapDictionary(originalObjectCodes, remap_dictionary, other_value)
                # Scratch workspace
                scratchFolder  = rapathutils.swizzle_path(arcpy.env.scratchFolder)
                tempDir = tempfile.mkdtemp(suffix = '.tmp', dir = scratchFolder)
                # Temp files
                messageFile  = os.path.join(tempDir, f'{out_model_name}_msgMgr.b1n')
                errorFile    = os.path.join(tempDir, f'{out_model_name}_stderr.txt')
                tempJsonFile = os.path.join(tempDir, f'{out_model_name}_params.json')
                # Assign GPU
                processorType, GPU_id = Assign_GPU()
                trainingArgs = {'prepareDataArgs' : {'in_training_data'     : in_training_data,
                                                     'dataset_type'         : 'PointCloudOD',
                                                     'extra_features'       : attributes,
                                                     'classes_of_interest'  : target_objects,
                                                     'remap_classes'        : finalRemapDict,
                                                     'class_mapping'        : objectCode_dictionary,
                                                     'batch_size'           : batch_size,
                                                     'min_points'           : min_points,
                                                     'working_dir'          : working_folder,
                                                     'background_classcode' : training_blocks},
                                'modelSetupArgs'  : {'pretrained_model'     : pretrained_model,
                                                     'model'                : "SECOND",
                                                     'voxel_parms'          : voxel_vals},
                                'fitArgs'         : {'epochs'               : max_epochs,
                                                     'lr'                   : learning_rate,
                                                     'early_stopping'       : early_stop,
                                                     'checkpoint'           : "all",
                                                     'monitor'              : criteria,
                                                     'one_cycle'            : lr_strategy},
                                'outModel'        : out_model,
                                'epochStatsFile'  : os.path.join(working_folder, f'{out_model_name}_{arcpy.GetIDMessage(86509)}_{arcpy.GetIDMessage(86551)}.csv'),
                                'messageFile'     : messageFile,
                                'processorType'   : processorType,
                                'gpu_id'          : GPU_id,
                                'scratchFolder'   : tempDir,
                                'main_pid'        : os.getpid()}

                with open(tempJsonFile, 'w') as jsonFile:
                    json.dump(trainingArgs, jsonFile, indent = 4)
                # Report the architecture being used "Model is trained using <architecture name>"
                arcpy.AddMessage(arcpy.GetIDMessage(50221) % ("Sparsely Embedded Convolutional Detection"))

                # Create a byte array of 256 zeros
                # 0 - cancel.
                # 8 - progressor.
                # 16 - complete.
                # 32 - epoch.
                # 64 - total.
                # 96 - iteration.
                # 128 - batch train.
                # 160 - number of completed epoch.
                # 192 - learning rate.
                # 200 - learning rate ready.
                # 216 - 1 CPU/GPU selection.
                # 224 - 4 GPU selection.
                # 232 - 256 GPU name.
                # 488 - blocks info.
                # 496 - trained blocks
                # 504 - total trained blocks
                # 512 - validation blocks
                with open(messageFile, "wb") as file:
                    file.write(bytearray(1024))

                with open(messageFile, "r+b") as f, open(errorFile, "w+") as ef:
                    mm = None
                    process = None
                    try:
                        mm = mmap.mmap(f.fileno(), 1024)
                        process_args = { "stdout": subprocess.DEVNULL,
                                         "stderr" : ef,
                                         "text" : True,
                        }                        
                        # Get the correct python interpretter
                        if os.name == "nt":
                            py = os.path.join(sys.prefix, "python.exe")
                            process_args['creationflags'] = subprocess.CREATE_NO_WINDOW
                        else:
                            py = os.path.join(sys.prefix, "bin", "python")
                            
                        pyfile = os.path.join(rapathutils.swizzle_path(arcpy.GetInstallInfo()["InstallDir"]),
                                              'Resources','ArcToolBox', 'Scripts', 'DDD_Training.py')
                        process = subprocess.Popen([py, pyfile, tempJsonFile], **process_args)

                        label_epoch                 = arcpy.GetIDMessage(86509) # Epoch
                        label_training_loss         = arcpy.GetIDMessage(86518) # Training Loss
                        label_validation_loss       = arcpy.GetIDMessage(86519) # Validation Loss
                        label_avg_precision         = arcpy.GetIDMessage(86606) # Average Precision
                        label_time                  = arcpy.GetIDMessage(84971) # Time
                        width_epoch                 = len(label_epoch) + 3
                        width_training              = len(label_training_loss) + 3
                        width_validation            = len(label_validation_loss) + 3
                        width_avg_precision         = len(label_avg_precision) + 3

                        process_cancelled = False
                        learning_rate_printed = False
                        progressor_index_current = 0
                        progressor_label_epoch_index = 0
                        progressor_total_index = 0
                        progressor_batch_iteration_current = 0
                        train_type = None
                        skip_progressor_label = False

                        print_processor = True
                        def PrintProcessor():
                            nonlocal print_processor
                            if print_processor:
                                process_selection = read_from_memory_1b(mm, 216)
                                if process_selection == 0:
                                    return
                                if process_selection == 1:
                                    # Error for invalid GPU ID
                                    arcpy.AddIDMessage('ERROR', 50160)
                                elif process_selection == 2:
                                    # Wrong CPU/GPU parameter.
                                    arcpy.AddIDMessage('ERROR', 50160)
                                elif process_selection == 3:
                                    gpu_id = read_from_memory(mm, 224, 4)
                                    gpu_name = read_from_memory_string(mm, 232, 256)
                                    arcpy.AddMessage(arcpy.GetIDMessage(86507) % (f"GPU {gpu_id} - {gpu_name}"))
                                print_processor = False

                        print_block_statistics = True
                        def PrintBlockStatistics():
                            nonlocal print_block_statistics
                            if print_block_statistics and read_from_memory_1b(mm, 488) != 0:
                                training_blocks = read_from_memory(mm, 496, 8)
                                all_training_blocks = read_from_memory(mm, 504, 8)
                                filtered_validation_blocks = read_from_memory(mm, 512, 8)

                                # Return message reading "{n} of {m} training blocks processed" or "{n} training/validation blocks processed"
                                if training_blocks == all_training_blocks:
                                    arcpy.AddMessage(arcpy.GetIDMessage(86516) % (training_blocks, arcpy.GetIDMessage(84862).lower()))
                                else:
                                    arcpy.AddMessage(arcpy.GetIDMessage(86515) % (training_blocks, all_training_blocks, arcpy.GetIDMessage(84862).lower()))
                                # Return message for number of validation blocks
                                arcpy.AddMessage(arcpy.GetIDMessage(86516) % (filtered_validation_blocks, arcpy.GetIDMessage(84856).lower()))
                                print_block_statistics = False

                        # Write epoch stats in tool message window
                        current_epoch = 0
                        def PrintEpochStats():
                            nonlocal current_epoch
                            completedEpoch = read_from_memory_32_safe(mm, 160)
                            if completedEpoch is not None and 0 < completedEpoch[0]:
                                # Print column headers for epoch stats table
                                if current_epoch == 0:
                                    arcpy.AddMessage(f"{label_epoch:{width_epoch}} {label_training_loss:{width_training}} {label_validation_loss:{width_validation}} {label_avg_precision:{width_avg_precision}} {label_time}")

                                while current_epoch < completedEpoch[0]:
                                    epochStatsInfo = os.path.join(tempDir, f'epoch_{current_epoch}.json')
                                    with open(epochStatsInfo, 'r') as f:
                                        epochStats = json.load(f)
                                    # Print epoch metrics
                                    arcpy.AddMessage(f"{epochStats['EPOCH']:<{width_epoch}} "\
                                        f"{epochStats['TRAINING_LOSS']:<{width_training}.6g} "\
                                        f"{epochStats['VALIDATION_LOSS']:<{width_validation}.6g} "\
                                        f"{epochStats['AVERAGE_PRECISION']:<{width_avg_precision}.6g} "\
                                        f"{epochStats['TIME']}")
                                    try:
                                        os.remove(epochStatsInfo)
                                    except:
                                        pass
                                    current_epoch += 1

                        while process.poll() is None:
                            if arcpy.env.isCancelled:
                                write_to_memory_1b(mm, 0, 1)
                                process_cancelled = True
                                break

                            PrintProcessor()
                            PrintBlockStatistics()

                            if not learning_rate_printed:
                                if read_from_memory_1b(mm, 200) != 0:
                                    learning_rate = read_from_memory_real(mm, 192)
                                    # Msg 86508: Learning Rate: %e
                                    arcpy.AddMessage(arcpy.GetIDMessage(86508) % learning_rate)
                                    learning_rate_printed = True

                            progressor_index = read_from_memory_1b(mm, 8)
                            if progressor_index == 1 and progressor_index_current != progressor_index:
                                if progressor_index == 1:
                                    arcpy.SetProgressor("step", f"{arcpy.GetIDMessage(84862)}...")
                                elif progressor_index == 2:
                                    # Msg 86511: Calculating optimal learning rate...
                                    arcpy.SetProgressor('default', arcpy.GetIDMessage(86511))
                                progressor_index_current = progressor_index

                            progressor_label_epoch = read_from_memory_32_safe(mm, 32)
                            if progressor_label_epoch is not None and progressor_label_epoch_index != progressor_label_epoch[1]:
                                if progressor_label_epoch[0] != 0xFFFFFFFFFFFFFFFF:
                                    arcpy.SetProgressorLabel(f"{label_epoch} {progressor_label_epoch[0]}")
                                else:
                                    # Report completion of training
                                    arcpy.SetProgressorLabel(arcpy.GetIDMessage(86514))
                                    arcpy.SetProgressorPosition(100)
                                    arcpy.ResetProgressor()
                                    # Report saving model
                                    arcpy.SetProgressorLabel(arcpy.GetIDMessage(86512))

                                    skip_progressor_label = True
                                progressor_label_epoch_index = progressor_label_epoch[1]

                            if not skip_progressor_label:
                                progressor_total = read_from_memory_32_safe(mm, 64)
                                batch_train = read_from_memory_32_safe(mm, 128)
                                progressor_batch_iteration = read_from_memory_32_safe(mm, 96)
                                if progressor_total is not None and batch_train is not None and progressor_batch_iteration is not None and batch_train[1] == progressor_total[1]:
                                    if progressor_total_index != progressor_total[1]:
                                        progressor_total_index = progressor_total[1]

                                        train_type = arcpy.GetIDMessage(84862) if batch_train[0] == 1 else arcpy.GetIDMessage(84856)

                                        arcpy.SetProgressor('step', min_range = 0, max_range = progressor_total[0])
                                        progressor_batch_iteration_current = 0

                                    while progressor_batch_iteration_current < progressor_batch_iteration[0]:
                                        arcpy.SetProgressorPosition()
                                        progressor_batch_iteration_current += 1

                                    # MSG: Epoch %i: %s batch %i of %i (Epoch 1: Training batch 3 of 324)
                                    if train_type is not None:
                                        arcpy.SetProgressorLabel(arcpy.GetIDMessage(86517) % (progressor_label_epoch[0], train_type, progressor_batch_iteration[0], progressor_total[0]))

                                    PrintEpochStats()
                            time.sleep(0.1)

                        if process_cancelled:
                            process.wait()
                            # Process can be killed.
                            raise CustomCancelException

                        PrintProcessor()
                        PrintBlockStatistics()
                        PrintEpochStats()

                        process.wait()

                        if read_from_memory_1b(mm, 16) == 0:
                            try:
                                ef.seek(0)
                                stderr = ef.read()
                            except Exception as e:
                                stderr = "There was an issue reading the stderr log saved."
                            raise RuntimeError(stderr if stderr else "")

                        arcpy.SetParameterAsText(18, out_model)
                        arcpy.SetParameterAsText(19, trainingArgs['epochStatsFile'])

                        # Display loss graph and sample model if they are present
                        images_list = ["loss_graph.png"]
                        for image in images_list:
                            image = os.path.join(out_model, "ModelCharacteristics", image)
                            if os.path.isfile(image):
                                # Image will only display if path reference uses forward slash
                                arcpy.AddMessage("""json:[{"element":"image", "data":"%s"}]""" % image.replace(os.sep, '/'))

                    except CustomCancelException:
                        raise

                    except RuntimeError:
                        raise

                    except:
                        if process is not None:
                            try:
                                write_to_memory_1b(mm, 0, 1)
                                process.wait(timeout = 3)
                            except subprocess.TimeoutExpired:
                                process.kill()
                            except:
                                pass
                        raise

                    finally:
                        if mm is not None:
                            mm.close()
            finally:
                try:
                    shutil.rmtree(tempDir)
                except:
                    pass

        Main()

    except CustomCancelException:
        arcpy.AddError(arcpy.GetIDMessage(10017))

    except CustomErrorException:
        pass

    except RuntimeError as e:
        arcpy.AddIDMessage('ERROR',50203)
        arcpy.AddError(str(e))

    except:
        if not arcpy.env.isCancelled:
            ## By default any other errors will be caught here
            ## Get the traceback object
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]

            ## Concatenate information together concerning the error into a message string
            pymsg = "PYTHON ERRORS:\nTraceback info:\n" + tbinfo + "\nError Info:\n" + str(sys.exc_info()[1])
            arcpy.AddError(pymsg)
            # Return Python error messages for use in script tool or Python window
            if arcpy.GetMessages(2):
                msgs = "ArcPy ERRORS:\n" + arcpy.GetMessages(2) + "\n"
                arcpy.AddError(msgs)
