import arcgis
import csv
import json
import mmap
import os
import re
import time
import torch
import sys
import zipfile

from ThreeD_Utilities import write_to_memory_1b, read_from_memory_1b, write_to_memory, write_to_memory_real, write_to_memory_32_safe, write_to_memory_string, monitor_main_process
from fastai.callback import Callback

class ProgressCallback(Callback):
    def __init__(self, model, max_epochs, total_iterations, total_validation_iterations, 
                 show_accuracy = True, epoch_stats_dict = None, **kwargs):
        super().__init__()
        self.model                       = model
        self.max_epochs                  = max_epochs
        self.total_iterations            = total_iterations
        self.total_validation_iterations = total_validation_iterations
        self.show_accuracy               = show_accuracy
        self.epoch_stats_dict            = epoch_stats_dict
        self.temp_dir                    = trainParams['scratchFolder']

    def check_cancel(self):
        return read_from_memory_1b(mm, 0) != 0

    def on_train_begin(self, **kwargs):
        if self.check_cancel():
            raise
        write_to_memory_1b(mm, 8, 1)
        self.order_id = 0

    def on_epoch_begin(self, **kwargs):
        if self.check_cancel():
            raise
        self.start_time = time.time()
        self.batch_train = 0
        # Report epoch number in progress label
        epoch = kwargs.get('epoch')
        write_to_memory_32_safe(mm, 32, epoch)
        
    def on_batch_begin(self, **kwargs):
        if self.check_cancel():
            raise
        batch_train = 1 if kwargs.get('train') else 2
        if batch_train != self.batch_train:
            self.batch_train = batch_train
            self.batch_iteration = 0
            self.total = self.total_iterations if batch_train == 1 else self.total_validation_iterations
            write_to_memory_32_safe(mm, 128, batch_train)
            write_to_memory_32_safe(mm, 96, self.batch_iteration)
            write_to_memory_32_safe(mm, 64, self.total)

    def on_batch_end(self, **kwargs):
        if self.check_cancel():
            raise
        self.batch_iteration += 1
        write_to_memory_32_safe(mm, 96, self.batch_iteration)

    def on_epoch_end(self, **kwargs):
        if self.check_cancel():
            raise
        elapsed_time = time.strftime("%H:%M:%S", time.gmtime(time.time() - self.start_time))
        training_loss = float(kwargs.get("last_loss", "NA"))
        last_metrics = kwargs.get("last_metrics", [])
        validation_loss = float(last_metrics[0])
        accuracy = f'{float(last_metrics[1]):.5}' if len(last_metrics) > 1 else "N/A"
        precision = float(last_metrics[2])
        recall = float(last_metrics[3])
        f1 = float(last_metrics[4])
        if self.epoch_stats_dict is not None:
            self.epoch_stats_dict[self.order_id] = {'EPOCH'           : self.order_id,
                                                    'TRAINING_LOSS'   : training_loss, 
                                                    'VALIDATION_LOSS' : validation_loss,
                                                    'ACCURACY'        : accuracy,
                                                    'PRECISION'       : precision,
                                                    'RECALL'          : recall,
                                                    'F1'              : f1,
                                                    'TIME'            : elapsed_time}
        tempEpochStatsFile = os.path.join(self.temp_dir, f'epoch_{self.order_id}.json')
        with open(tempEpochStatsFile, 'w') as jsonFile:
            json.dump(self.epoch_stats_dict[self.order_id], jsonFile, indent = 4)
        self.order_id += 1
        write_to_memory_32_safe(mm, 160, self.order_id)

def Assign_GPU(processor_type, gpu_ID):
    # Assign the processing unit to be used for training
    # If a CUDA capable card is available and the GPU is specified
    if torch.cuda.is_available():
        total_gpus = torch.cuda.device_count()
        if processor_type == "GPU":
            if gpu_ID is None:
                # Initialize variables to store the ID and properties of the 'best' GPU.
                best_gpu_id = None
                best_gpu_properties = None

                # Flag to check whether we are looking at the first GPU in the loop.
                b_first = True

                # Loop through all available GPUs to find the one with the least memory.
                for i in range(total_gpus):
                    # Get properties of the current GPU.
                    current_gpu_properties = torch.cuda.get_device_properties(i)

                    # If this is the first GPU we are looking at, or if this GPU has more memory
                    # than the current 'best' GPU, update the 'best' GPU information.
                    if b_first or current_gpu_properties.total_memory > best_gpu_properties.total_memory:
                        best_gpu_id = i
                        best_gpu_properties = current_gpu_properties
                        b_first = False  # Reset the flag since we've now looked at least one GPU.

                # Set the selected 'best' GPU as the current device.
                # Exception when no suitable GPU is found (which shouldn't happen if CUDA is available)
                if best_gpu_id is not None:
                    torch.cuda.set_device(torch.device('cuda', best_gpu_id))

                    write_to_memory(mm, 224, 4, best_gpu_id)
                    write_to_memory_string(mm, 232, 256, best_gpu_properties.name)
                    write_to_memory_1b(mm, 216, 3)
            elif gpu_ID in range(total_gpus):
                torch.cuda.set_device(torch.device('cuda', gpu_ID))

                gpu_properties = torch.cuda.get_device_properties(gpu_ID)
                write_to_memory(mm, 224, 4, gpu_ID)
                write_to_memory_string(mm, 232, 256, gpu_properties.name)
                write_to_memory_1b(mm, 216, 3)
            else:
                write_to_memory_1b(mm, 216, 1)
                return False
        elif processor_type == "CPU":
            arcgis.env._processorType  = processor_type
        else:
            write_to_memory_1b(mm, 216, 2)
            return False
    else:
        write_to_memory_1b(mm, 216, 1)
        return False
    return True

if __name__ in ('__main__', '__mp_main__'):
    epochStatsDict = {}
    # Get parameters
    if len(sys.argv) != 2:
        raise Exception("Wrong number of arguments!")

    # Read the JSON file containing arguments
    jsonParamFile = sys.argv[1]
    with open(jsonParamFile, 'r') as f:
        trainParams = json.load(f)
        
    monitor_main_process(trainParams["main_pid"])

    with open(trainParams['messageFile'], "r+b") as f:
        mm = None
        try:
            mm = mmap.mmap(f.fileno(), 1024)
            # Assign GPU
            if Assign_GPU(trainParams['processorType'], trainParams['gpu_id']):
                # Prepare Data
                prepareArgs = trainParams['prepareDataArgs']
                # Convert the keys back to integers
                codeDescriptionsDict = {int(k): v for k, v in prepareArgs['class_mapping'].items()}
                # Convert remap values to integers
                remapCodes = {int(k): int(v) for k, v in prepareArgs['remap_classes'].items()}
                os.mkdir(prepareArgs['working_dir'])
                transformArgs  = arcgis.learn.Transform3d(rotation=[2.5, 2.5, 180], scaling = 5, jitter = 0.0)
                prepareArgDict = {'dataset_type'         : prepareArgs['dataset_type'],
                                  'extra_features'       : prepareArgs['extra_features'],
                                  'classes_of_interest'  : prepareArgs['classes_of_interest'],
                                  'background_classcode' : prepareArgs['background_classcode'],
                                  'remap_classes'        : remapCodes,
                                  'class_mapping'        : codeDescriptionsDict,
                                  'batch_size'           : prepareArgs['batch_size'],
                                  'min_points'           : prepareArgs['min_points'],
                                  'working_dir'          : prepareArgs['working_dir'],
                                  'transforms'           : transformArgs}
                target_objects = prepareArgs['classes_of_interest']
                if target_objects or prepareArgs['background_classcode']:
                    prepareArgDict['background_classcode'] = prepareArgs['background_classcode']
                    if not prepareArgs['classes_of_interest']:
                        target_objects = list(codeDescriptionsDict)
                    prepareArgDict['classes_of_interest'] = target_objects
                trainingData = arcgis.learn.prepare_data(prepareArgs['in_training_data'], **prepareArgDict)
                # Get the number of training blocks & blocks to be processed
                training_blocks            = len(trainingData.train_ds.tiles)
                all_training_blocks        = trainingData.train_ds._total_blocks
                filtered_validation_blocks = trainingData.valid_ds._total_blocks# - (trainingData.valid_ds._skip_block_COI + trainingData.valid_ds._skip_block_min_points)
                # Get the total number of iterations
                totalTrainingIterations = (training_blocks + prepareArgs['batch_size'] - 1) // prepareArgs['batch_size']
                totalValidationIterations = (filtered_validation_blocks + prepareArgs['batch_size'] - 1) // prepareArgs['batch_size']
                write_to_memory(mm, 496, 8, training_blocks)
                write_to_memory(mm, 504, 8, all_training_blocks)
                write_to_memory(mm, 512, 8, filtered_validation_blocks)
                write_to_memory_1b(mm, 488, 1)

                modelArgs = trainParams['modelSetupArgs']
                pretrainedModel = None
                if modelArgs['pretrained_model']:
                    pretrainedModel = modelArgs['pretrained_model']
                    # If pretrained model is DLPK, unpack emd and pth
                    # Temporary fix until Learn API call directly supports DLPK
                    if re.search('.dlpk$', pretrainedModel, re.IGNORECASE):
                        unpacked_model_dir = os.path.join(trainParams["scratchFolder"], "UnpackedDLPK")
                        with zipfile.ZipFile(pretrainedModel, 'r') as dlpk:
                            emd = re.sub('.dlpk$', '.emd', os.path.basename(pretrainedModel), flags = re.IGNORECASE)
                            if not emd in dlpk.namelist():
                                emd_model = []
                                for name in dlpk.namelist():
                                    if re.search('.emd$', name, re.IGNORECASE):
                                        emd_model.append(name)
                                if len(emd_model) != 1:
                                    raise "Put right message here"
                                emd_model = emd_model[0]
                            else:
                                emd_model = emd
                             
                            pth = re.sub('.dlpk$', '.pth', os.path.basename(pretrainedModel), flags = re.IGNORECASE)
                            if not pth in dlpk.namelist():
                                pth_model = []
                                for name in dlpk.namelist():
                                    if re.search('.pth$', name, re.IGNORECASE):
                                        pth_model.append(name)
                                if len(pth_model) != 1:
                                    raise "Put right message here"
                                pth_model = pth_model[0]
                            else:
                                pth_model = pth                            
                            for extractFile in [emd_model, pth_model]:
                                dlpk.extract(extractFile, path = unpacked_model_dir)
                            pretrainedModel = os.path.join(unpacked_model_dir, emd_model)
                            
                pctd_model = eval(f"arcgis.learn.{modelArgs['architecture']}(trainingData,  pretrained_path = pretrainedModel, focal_loss = modelArgs['focal_loss'])")
                # Get fit arguments
                fitArgs = trainParams['fitArgs']
                learningRate = fitArgs['lr']
                if not learningRate:
                    write_to_memory_1b(mm, 8, 2)
                    learningRate = pctd_model.lr_find(allow_plot = False)
                    write_to_memory_real(mm, 192, learningRate)
                    write_to_memory_1b(mm, 200, 1)

                pctd_model.fit(epochs          = fitArgs['epochs'],
                               lr              = learningRate,
                               early_stopping  = fitArgs['early_stopping'],
                               checkpoint      = fitArgs['checkpoint'],
                               monitor         = fitArgs['monitor'],
                               one_cycle       = fitArgs['one_cycle'],
                               callbacks       = [ProgressCallback(pctd_model, fitArgs['epochs'], totalTrainingIterations, 
                                                                   totalValidationIterations, epoch_stats_dict = epochStatsDict)]
                              )

                write_to_memory_32_safe(mm, 32, 0xFFFFFFFFFFFFFFFF)

                pctd_model.save(trainParams['outModel'], compute_metrics = False)

                # Write epoch stats file
                with open(trainParams['epochStatsFile'], 'w', newline = '') as csvfile:
                    stats_writer = csv.writer(csvfile)
                    # Write header row
                    stats_writer.writerow(['EPOCH', 'TRAINING_LOSS', 'VALIDATION_LOSS', 
                                           'ACCURACY', 'PRECISION', 'RECALL', 
                                           'F1_SCORE','ELAPSED_TIME'])
                    # Write data rows
                    for epoch in sorted(epochStatsDict.keys()):
                        stats_writer.writerow([epoch,
                                               epochStatsDict[epoch]['TRAINING_LOSS'],
                                               epochStatsDict[epoch]['VALIDATION_LOSS'],
                                               epochStatsDict[epoch]['ACCURACY'],
                                               epochStatsDict[epoch]['PRECISION'],
                                               epochStatsDict[epoch]['RECALL'],
                                               epochStatsDict[epoch]['F1'],
                                               epochStatsDict[epoch]['TIME']])
                # Write class stats file
                class_stats = pctd_model.learn._epoch_metrics
                epoch = 0
                with open(trainParams['classStatsFile'], 'w', newline='') as csvfile:
                    stats_writer = csv.writer(csvfile)
                    # Header row: Epoch    Class Code   Precision    Recall    F1 Score
                    stats_writer.writerow(['EPOCH', 'CLASS_CODE', 'CLASS_DESCRIPTION', 
                                          'PRECISION', 'RECALL', 'F1_SCORE'])
                    # Table info
                    for stats in class_stats:
                        for stat in stats.keys():
                            if stat == 'background':
                                class_number = prepareArgs['background_classcode']
                            else:
                                class_number = list(codeDescriptionsDict.keys())[list(codeDescriptionsDict.values()).index(stat)]
                            stats_writer.writerow([epoch, 
                                                   class_number, 
                                                   stat,
                                                   stats[stat]['precision'],
                                                   stats[stat]['recall'],
                                                   stats[stat]['f1-score']])
                        epoch += 1

                write_to_memory_1b(mm, 16, 1)
        finally:
            if mm is not None:
                mm.close()
