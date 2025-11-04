import json
import os
import packaging.version
import re
import struct
import zlib
import threading
import time
import psutil
import sys

#dl tools config
dl_config_dict = {
    "PointCloudClassification": {
        "PointCNN": {
            "display_name": "PointCNN",
            "api_info": {
                "class_name": "PointCNN",
                "parameter_name": None,
                "backbone": None,
            },
            "export_tool": {
                "tool_name": "PreparePointCloudTrainingData_3d",
                "parameters": {
                    "block_point_limit": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 8192,
                        "domain": {"type": "Range", "list": [768, 9999999999]},
                    },
                },
            },
            "train_tool": {
                "tool_name": "TrainPointCloudClassificationModel_3d",
                "parameters": {
                    "attributes": {
                        "enable": True,
                        "data_type": ["String"],
                        "default": None,
                        "domain": {
                            "type": "ValueList",
                            "list": [
                                [
                                    "INTENSITY",
                                    "RETURN_NUMBER",
                                    "NUMBER_OF_RETURNS",
                                    "RED",
                                    "GREEN",
                                    "BLUE",
                                    "NEAR_INFRARED",
                                    "RELATIVE_HEIGHT",
                                ]
                            ],
                        },
                    },
                    "min_points": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 0,
                        "domain": {"type": "Range", "list": [0, 9999999999]},
                    },
                    "model_selection_criteria": {
                        "enable": True,
                        "data_type": "String",
                        "default": "RECALL",
                        "domain": {
                            "type": "ValueList",
                            "list": [
                                "VALIDATION_LOSS",
                                "RECALL",
                                "F1_SCORE",
                                "PRECISION",
                                "ACCURACY",
                            ],
                        },
                    },
                    "max_epochs": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 25,
                        "domain": {"type": "Range", "list": [0, 9999999999]},
                    },
                    "epoch_iterations": {
                        "enable": True,
                        "data_type": "Double",
                        "default": 100,
                        "domain": {"type": "Range", "list": [0.1, 100]},
                    },
                    "learning_rate": {
                        "enable": True,
                        "data_type": "Double",
                        "default": None,
                        "domain": {"type": "Range", "list": [0, 1]},
                    },
                    "batch_size": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 2,
                        "domain": {"type": "Range", "list": [1, 256]},
                    },
                    "early_stop": {
                        "enable": True,
                        "data_type": "Boolean",
                        "default": True,
                        "domain": {"type": "ValueList", "list": [True, False]},
                    },
                    "learning_rate_strategy": {
                        "enable": True,
                        "data_type": "String",
                        "default": "ONE_CYCLE",
                        "domain": {"type": "ValueList", "list": ["ONE_CYCLE", "FIXED"]},
                    },
                    "loss_function": {
                        "enable": True,
                        "data_type": "String",
                        "default": "CROSS_ENTROPY_LOSS",
                        "domain": {
                            "type": "ValueList",
                            "list": ["CROSS_ENTROPY_LOSS", "FOCAL_LOSS"],
                        },
                    },
                    "architecture_settings": {
                        "enable": True,
                        "Option": {
                            "out_channels_control": {
                                "description": "Number of channels produced by each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [16, 32, 64, 96],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "points_per_layer": {
                                "description": "Number of points in each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [-1, 768, 384, 128],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [-1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "nearest_neighbor_points": {
                                "description": "Number of K-nearest neighbor in each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [12, 16, 16, 16],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "dilation": {
                                "description": "Dilation in each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [1, 1, 2, 2],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "multiplier": {
                                "description": "Multiplier which is multiplied by each element of out_channel",
                                "data_type": "Long",
                                "default": 8,
                                "domain": {"type": "Range", "list": [1, 99999]},
                            },
                            "dropout_control": {
                                "description": "dropout to control over-fitting",
                                "data_type": "Double",
                                "default": None,
                                "domain": {"type": "Range", "list": [0, 0.99]},
                            },
                        },
                        "tool_api_mapping": {
                            "encoder_params": {
                                "arg_type": "Dict",
                                "arg_map": {
                                    "out_channels": "out_channels_control",
                                    "P": "points_per_layer",
                                    "K": "nearest_neighbor_points",
                                    "D": "dilation",
                                    "m": "multiplier",
                                },
                            },
                            "dropout": {
                                "arg_type": "Double",
                                "arg_map": {"dropout": "dropout_control"},
                            },
                        },
                    },
                },
            },
            "infer_tool": {
                "tool_name": "ClassifyPointCloudUsingTrainedModel_3d",
                "parameters": {},
            },
        },
        "RandLANet": {
            "display_name": "RandLA-Net",
            "api_info": {
                "class_name": "RandLANet",
                "parameter_name": None,
                "backbone": None,
            },
            "export_tool": {
                "tool_name": "PreparePointCloudTrainingData_3d",
                "parameters": {
                    "block_point_limit": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 20000,
                        "domain": {"type": "Range", "list": [3, 9999999999]},
                    },
                },
            },
            "train_tool": {
                "tool_name": "TrainPointCloudClassificationModel_3d",
                "parameters": {
                    "attributes": {
                        "enable": True,
                        "data_type": ["String"],
                        "default": None,
                        "domain": {
                            "type": "ValueList",
                            "list": [
                                [
                                    "INTENSITY",
                                    "RETURN_NUMBER",
                                    "NUMBER_OF_RETURNS",
                                    "RED",
                                    "GREEN",
                                    "BLUE",
                                    "NEAR_INFRARED",
                                    "RELATIVE_HEIGHT",
                                ]
                            ],
                        },
                    },
                    "min_points": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 0,
                        "domain": {"type": "Range", "list": [0, 9999999999]},
                    },
                    "model_selection_criteria": {
                        "enable": True,
                        "data_type": "String",
                        "default": "RECALL",
                        "domain": {
                            "type": "ValueList",
                            "list": [
                                "VALIDATION_LOSS",
                                "RECALL",
                                "F1_SCORE",
                                "PRECISION",
                                "ACCURACY",
                            ],
                        },
                    },
                    "max_epochs": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 25,
                        "domain": {"type": "Range", "list": [0, 9999999999]},
                    },
                    "epoch_iterations": {
                        "enable": True,
                        "data_type": "Double",
                        "default": 100,
                        "domain": {"type": "Range", "list": [0.1, 100]},
                    },
                    "learning_rate": {
                        "enable": True,
                        "data_type": "Double",
                        "default": None,
                        "domain": {"type": "Range", "list": [0, 1]},
                    },
                    "batch_size": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 8,
                        "domain": {"type": "Range", "list": [1, 256]},
                    },
                    "early_stop": {
                        "enable": True,
                        "data_type": "Boolean",
                        "default": True,
                        "domain": {"type": "ValueList", "list": [True, False]},
                    },
                    "learning_rate_strategy": {
                        "enable": True,
                        "data_type": "String",
                        "default": "ONE_CYCLE",
                        "domain": {"type": "ValueList", "list": ["ONE_CYCLE", "FIXED"]},
                    },
                    "loss_function": {
                        "enable": True,
                        "data_type": "String",
                        "default": "CROSS_ENTROPY_LOSS",
                        "domain": {
                            "type": "ValueList",
                            "list": ["CROSS_ENTROPY_LOSS", "FOCAL_LOSS"],
                        },
                    },
                    "architecture_settings": {
                        "enable": True,
                        "Option": {
                            "out_channels_control": {
                                "description": "Number of channels produced by each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [16, 64, 128, 256],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "sub_sampling_control": {
                                "description": "Sampling ratio of random sampling at each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [4, 4, 4, 4],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "nearest_neighbor_points": {
                                "description": "Number of K-nearest neighbor for a point",
                                "data_type": "Long",
                                "default": 16,
                                "domain": {"type": "Range", "list": [1, 99999]},
                            },
                        },
                        "tool_api_mapping": {
                            "encoder_params": {
                                "arg_type": "Dict",
                                "arg_map": {
                                    "out_channels": "out_channels_control",
                                    "sub_sampling_ratio": "sub_sampling_control",
                                    "k_n": "nearest_neighbor_points",
                                },
                            }
                        },
                    },
                },
            },
            "infer_tool": {
                "tool_name": "ClassifyPointCloudUsingTrainedModel_3d",
                "parameters": {},
            },
        },
        "SQNSeg": {
            "display_name": "Semantic Query Network",
            "api_info": {
                "class_name": "SQNSeg",
                "parameter_name": None,
                "backbone": None,
            },
            "export_tool": {
                "tool_name": "PreparePointCloudTrainingData_3d",
                "parameters": {
                    "block_point_limit": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 8192,
                        "domain": {"type": "Range", "list": [3, 9999999999]},
                    },
                },
            },
            "train_tool": {
                "tool_name": "TrainPointCloudClassificationModel_3d",
                "parameters": {
                    "attributes": {
                        "enable": True,
                        "data_type": ["String"],
                        "default": None,
                        "domain": {
                            "type": "ValueList",
                            "list": [
                                [
                                    "INTENSITY",
                                    "RETURN_NUMBER",
                                    "NUMBER_OF_RETURNS",
                                    "RED",
                                    "GREEN",
                                    "BLUE",
                                    "NEAR_INFRARED",
                                    "RELATIVE_HEIGHT",
                                ]
                            ],
                        },
                    },
                    "min_points": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 0,
                        "domain": {"type": "Range", "list": [0, 9999999999]},
                    },
                    "model_selection_criteria": {
                        "enable": True,
                        "data_type": "String",
                        "default": "RECALL",
                        "domain": {
                            "type": "ValueList",
                            "list": [
                                "VALIDATION_LOSS",
                                "RECALL",
                                "F1_SCORE",
                                "PRECISION",
                                "ACCURACY",
                            ],
                        },
                    },
                    "max_epochs": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 25,
                        "domain": {"type": "Range", "list": [0, 9999999999]},
                    },
                    "epoch_iterations": {
                        "enable": True,
                        "data_type": "Double",
                        "default": 100,
                        "domain": {"type": "Range", "list": [0.1, 100]},
                    },
                    "learning_rate": {
                        "enable": True,
                        "data_type": "Double",
                        "default": None,
                        "domain": {"type": "Range", "list": [0, 1]},
                    },
                    "batch_size": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 2,
                        "domain": {"type": "Range", "list": [1, 256]},
                    },
                    "early_stop": {
                        "enable": True,
                        "data_type": "Boolean",
                        "default": True,
                        "domain": {"type": "ValueList", "list": [True, False]},
                    },
                    "learning_rate_strategy": {
                        "enable": True,
                        "data_type": "String",
                        "default": "ONE_CYCLE",
                        "domain": {"type": "ValueList", "list": ["ONE_CYCLE", "FIXED"]},
                    },
                    "loss_function": {
                        "enable": True,
                        "data_type": "String",
                        "default": "CROSS_ENTROPY_LOSS",
                        "domain": {
                            "type": "ValueList",
                            "list": ["CROSS_ENTROPY_LOSS", "FOCAL_LOSS"],
                        },
                    },
                    "architecture_settings": {
                        "enable": True,
                        "Option": {
                            "out_channels_control": {
                                "description": "Number of channels produced by each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [16, 64, 128, 256],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "sub_sampling_control": {
                                "description": "Sampling ratio of random sampling at each layer",
                                "data_type": ["Long", "Long", "Long", "Long"],
                                "default": [4, 4, 4, 4],
                                "domain": {
                                    "type": ["Range", "Range", "Range", "Range"],
                                    "list": [
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                        [1, 99999],
                                    ],
                                },
                            },
                            "nearest_neighbor_points": {
                                "description": "Number of K-nearest neighbor for a point",
                                "data_type": "Long",
                                "default": 16,
                                "domain": {"type": "Range", "list": [1, 99999]},
                            },
                        },
                        "tool_api_mapping": {
                            "encoder_params": {
                                "arg_type": "Dict",
                                "arg_map": {
                                    "out_channels": "out_channels_control",
                                    "sub_sampling_ratio": "sub_sampling_control",
                                    "k_n": "nearest_neighbor_points",
                                },
                            }
                        },
                    },
                },
            },
            "infer_tool": {
                "tool_name": "ClassifyPointCloudUsingTrainedModel_3d",
                "parameters": {},
            },
        },
    },
    "PointCloudDetection": {
        "SECOND": {
            "display_name": "Sparsely Embedded Convolutional Detection",
            "api_info": {
                "class_name": "MMdetection3D",
                "parameter_name": "model",
                "backbone": None,
            },
            "export_tool": {
                "tool_name": "PreparePointCloudObjectDetectionTrainingData_3d",
                "parameters": {
                    "block_point_limit": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 500000,
                        "domain": {"type": "Range", "list": [3, 9999999999]},
                    },
                },
            },
            "train_tool": {
                "tool_name": "TrainPointCloudObjectDetectionModel_3d",
                "parameters": {
                    "attributes": {
                        "enable": True,
                        "data_type": ["String"],
                        "default": None,
                        "domain": {
                            "type": "ValueList",
                            "list": [
                                [
                                    "INTENSITY",
                                    "RETURN_NUMBER",
                                    "NUMBER_OF_RETURNS",
                                    "RED",
                                    "GREEN",
                                    "BLUE",
                                    "NEAR_INFRARED",
                                    "RELATIVE_HEIGHT",
                                ]
                            ],
                        },
                    },
                    "min_points": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 50,
                        "domain": {"type": "Range", "list": [0, 99999999]},
                    },
                    "train_blocks": {
                        "enable": True,
                        "data_type": "Boolean",
                        "default": False,
                        "domain": {"type": "ValueList", "list": [True, False]},
                    },
                    "model_selection_criteria": {
                        "enable": True,
                        "data_type": "String",
                        "default": "AVERAGE_PRECISION",
                        "domain": {
                            "type": "ValueList",
                            "list": ["VALIDATION_LOSS", "AVERAGE_PRECISION"],
                        },
                    },
                    "max_epochs": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 50,
                        "domain": {"type": "Range", "list": [0, 99999999]},
                    },
                    "learning_rate_strategy": {
                        "enable": True,
                        "data_type": "String",
                        "default": "ONE_CYCLE",
                        "domain": {"type": "ValueList", "list": ["ONE_CYCLE", "FIXED"]},
                    },
                    "learning_rate": {
                        "enable": True,
                        "data_type": "Double",
                        "default": None,
                        "domain": {"type": "Range", "list": [0, 1]},
                    },
                    "batch_size": {
                        "enable": True,
                        "data_type": "Long",
                        "default": 2,
                        "domain": {"type": "Range", "list": [1, 256]},
                    },
                    "early_stop": {
                        "enable": True,
                        "data_type": "Boolean",
                        "default": False,
                        "domain": {"type": "ValueList", "list": [True, False]},
                    },
                    "architecture_settings": {
                        "enable": True,
                        "Option": {
                            "VOXEL_WIDTH": {
                                "description": "width of the each voxels",
                                "data_type": "Long",
                                "default": None,
                                "domain": {
                                    "type": "Range",
                                    "list": [0, 99999999999999999],
                                },
                            },
                            "VOXEL_HEIGHT": {
                                "description": "height of the each voxels",
                                "data_type": "Long",
                                "default": None,
                                "domain": {
                                    "type": "Range",
                                    "list": [0, 99999999999999999],
                                },
                            },
                            "VOXEL_POINT_LIMIT": {
                                "description": "decides the maximum number of points per voxel",
                                "data_type": "Long",
                                "default": None,
                                "domain": {
                                    "type": "Range",
                                    "list": [0, 99999999999999999],
                                },
                            },
                            "MAX_TRAINING_VOXELS": {
                                "description": "maximum number of voxels used for training",
                                "data_type": "Long",
                                "default": None,
                                "domain": {
                                    "type": "Range",
                                    "list": [0, 99999999999999999],
                                },
                            },
                            "MAX_VALIDATION_VOXELS": {
                                "description": "maximum number of voxels used for validation",
                                "data_type": "Long",
                                "default": None,
                                "domain": {
                                    "type": "Range",
                                    "list": [0, 99999999999999999],
                                },
                            },
                        },
                        "tool_api_mapping": {
                            "voxel_parms": {
                                "arg_type": "Dict",
                                "arg_map": {
                                    "voxel_size": [
                                        "VOXEL_WIDTH",
                                        "VOXEL_WIDTH",
                                        "VOXEL_HEIGHT",
                                    ],
                                    "voxel_points": "VOXEL_POINT_LIMIT",
                                    "max_voxels": [
                                        "MAX_TRAINING_VOXELS",
                                        "MAX_VALIDATION_VOXELS",
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            "infer_tool": {
                "tool_name": "DetectObjectsFromPointCloudUsingTrainedModel_3d",
                "parameters": {},
            },
        },
    },
}

# Dictionaries used by training tools for point clouds
model_architecture_dict = {"POINTCNN" : {"Name": "PointCNN",
                                         "MinPoints": 768,
                                         "MinVersion": "1.8.5",
                                         "Type": "Classification"},
                           "RANDLANET": {"Name": "RandLANet",
                                         "MinPoints": 10,
                                         "MinVersion": "2.1.0",
                                         "Type": "Classification"},
                           "SQN": {"Name": "SQNSeg",
                                   "MinPoints": 10,
                                   "MinVersion": "2.1.0",
                                   "Type": "Classification"},
                           "SECD": {"Name":"MMDetection3D",
                                    "MinPoints": 100,
                                    "MinVersion": "2.2.0",
                                    "Type": "Object Detection"}
                          }

model_architecture_keyword_name = {'PointCNN': "POINTCNN",
                                   'RandLANet': "RANDLANET",
                                   'SQNSeg' : "SQN",
                                   'MMDetection3D': "SECD"
                                  }
architecture_settings_dict = {'SECD': {"VOXEL_POINT_LIMIT"    : {"DataType": int,
                                                                 "MinLimit": 10,
                                                                 "MaxLimit": None},
                                       "MAX_TRAINING_VOXELS"  : {"DataType": int,
                                                                 "MinLimit": 20000,
                                                                 "MaxLimit": None},
                                       "MAX_VALIDATION_VOXELS": {"DataType": int,
                                                                 "MinLimit": 40000,
                                                                 "MaxLimit": None}
                                       }
                              }

# Training data attributes
pctd_attributes_dict  =       {"INTENSITY"        : "intensity",
                               "RETURN_NUMBER"    : "returnNumber",
                               "NUMBER_OF_RETURNS": "numberOfReturns",
                               "RED"              : "red",
                               "GREEN"            : "green",
                               "BLUE"             : "blue",
                               "NEAR_INFRARED"    : "nearInfrared",
                               "RELATIVE_HEIGHT"  : "relativeHeight"}
reverse_pctd_attributes_dict = {v: k for k, v in pctd_attributes_dict.items()}
all_attributes_list          = list(pctd_attributes_dict)
 
# Model selection parameters
model_selection_dict = {'VALIDATION_LOSS': 'valid_loss',
                        'ACCURACY'       : 'accuracy',
                        'RECALL'         : 'recall',
                        'F1_SCORE'       : 'f1',
                        'PRECISION'      : 'precision'}

od_selection_dict = {'VALIDATION_LOSS': 'valid_loss',
                     'AVERAGE_PRECISION': 'average_precision'}

# Learning strategy dictionary
learning_dict =        {"ONE_CYCLE": True,
                        "FIXED"    : False}


def is_cuda_out_of_memory_error(error_message):
    """
    Check if the error message starts with "CUDA out of memory".
    """
    return error_message.startswith("CUDA out of memory")

def is_out_of_memory_error(error_message):
    """
    Check if the exception is an out-of-memory error specific to DefaultCPUAllocator.
    """
    # Define the exact pattern to match the entire out-of-memory error message with DefaultCPUAllocator.
    pattern = (
        r"^\[enforce fail at .+?alloc_cpu\.cpp:\d+\] data\. "
        r"DefaultCPUAllocator: not enough memory: you tried to allocate \d+ bytes\.$"
    )    # Check if the entire error message matches the pattern.
    return re.match(pattern, error_message)

"""
Usage pattern for handling out-of-memory errors:

except RuntimeError as e:
    if is_cuda_out_of_memory_error(str(e)):
        print("CUDA out of memory error occurred")
    elif is_out_of_memory_error(str(e)):
        print("Out of memory error occurred")  
    else: 
        raise
"""

# Classes used to obtain properties from training data and models

class ValidateTrainingData:
    def __init__(self, training_data):
        """*******************************************************************************
        Returns the following properties from the training dataset:
        ----------------------------------------------------------------------------------
        trainingDataExists          = Boolean indicating if training data exists
        trainingDataInfo            = dictionary returned from statistics JSON of 
                                      the training subset from the training data
        validationDataInfo          = dictionary returned from statistics JSON of 
                                      the validation subset from the training data
        supportedTrainingVersion    = Boolean indicated training data has required version
        supportedValidationVersion  = Boolean indicated validation subset of training
                                      data is of the minimum version (2.0) required for
                                      the TrainPointCloudClassificationModel tool
        supportedTrainingFormat     = Boolean indicating the type property of the
                                      training data statistics is 'point_cloud_block'
        supportedValidationFormat   = Boolean indicating type property of the
                                      validation data statistics is 'point_cloud_block'
        trainingAttributes          = set containing attributes in training data
        validationAttributes        = set containing attributes in validation data
        trainingClassCodes          = set containing class codes in training data
        validationClassCodes        = set containing class codes in validation data
        trainingObjectCodes         = set containing object codes for training data
        *******************************************************************************"""
        # Set default attributes
        self.trainingDataExists         = os.path.exists(training_data)
        self.supportedTrainingVersion   = False
        self.supportedValidationVersion = False
        self.supportedTrainingFormat    = False
        self.supportedValidationFormat  = False
        self.trainingAttributes         = None
        self.validationAttributes       = None
        self.trainingClassCodes         = None
        self.validationClassCodes       = None
        self.trainingObjectCodes        = None
        self.validationObjectCodes      = None
        self.trainingBlockSize          = None
        self.validationBlockSize        = None
        self.trainingMaxPoints          = None
        self.validationMaxPoints        = None
        self.trainingZRange             = None
        self.validationZRange           = None
        self.trainingScaleFactor        = None
        self.validationScaleFactor      = None

        if self.trainingDataExists:    
            for folder in ['train', 'val']:
                folder_path = os.path.join(training_data, folder)
                self.expectedFolders = os.path.exists(folder_path)
            training_stats = os.path.join(training_data, 'train', 'Statistics.json')
            validation_stats = os.path.join(training_data, 'val', 'Statistics.json')
            
            for stats_file in [training_stats, validation_stats]:
                training_data_type = "Training" if stats_file == training_stats else "Validation"
                info = f'{training_data_type.lower()}DataInfo'
                setattr(self, info, False)
                supportedVersion = f'supported{training_data_type}Version'
                setattr(self, supportedVersion, False)
                supportedFormat = f'supported{training_data_type}Format'
                setattr(self, supportedFormat, False)
                attributes = f'{training_data_type.lower()}Attributes'
                setattr(self, attributes, None)
                objectCodes = f'{training_data_type.lower()}ObjectCodes'
                setattr(self, objectCodes, None)
                classCodes = f'{training_data_type.lower()}ClassCodes'
                setattr(self, classCodes, None)
                targetClassCodes = f'{training_data_type.lower()}TargetClassCodes'
                setattr(self, targetClassCodes, None)
                version = f'{training_data_type.lower()}Version'
                setattr(self, version, None)
                blockSize = f'{training_data_type.lower()}BlockSize'
                setattr(self, blockSize, None)
                maxPoints = f'{training_data_type.lower()}MaxPoints'
                setattr(self, maxPoints, None)
                zRange = f'{training_data_type.lower()}ZRange'
                setattr(self, zRange, None)
                scaleFactor = f'{training_data_type.lower()}ScaleFactor'
                setattr(self, scaleFactor, None)
                self.expectedFiles = os.path.exists(stats_file)
                
                if self.expectedFiles:
                    training_data_type = "Training" if stats_file == training_stats else "Validation"
                    with open(stats_file, 'r') as f:
                        setattr(self, info, json.load(f))
                    # Set the version, supported version (Boolean), and supportedFormat (Boolean)
                    if {'type', 'version'}.issubset(set(getattr(self, info))):
                        setattr(self, version, f"{getattr(self, info)['version']['major']}.{getattr(self, info)['version']['minor']}")
                        setattr(self, supportedVersion, packaging.version.parse(getattr(self, version)) >= packaging.version.parse("2.0"))
                        setattr(self, supportedFormat, getattr(self, info)['type'] == "point_cloud_block")
                    trainingDataAttributesSet = set(getattr(self, info))
                    # Set the object IDs and zRange
                    if 'tileStatistics' in trainingDataAttributesSet:
                        if 'classification' in getattr(self, info)['tileStatistics']:
                            setattr(self, objectCodes, {objectClassID['classCode'] for objectClassID in getattr(self, info)['tileStatistics']['classification']['table']})
                        if 'Z' in getattr(self, info)['tileStatistics']:
                            setattr(self, zRange, getattr(self, info)['tileStatistics']['Z']['max'])
                    # Set the class codes
                    if 'classification' in trainingDataAttributesSet:
                        setattr(self, classCodes, {classCode['classCode'] for classCode in getattr(self, info)['classification']['table']})
                    # Set the attributes
                    if 'attributes' in trainingDataAttributesSet:
                        setattr(self, attributes, set(getattr(self, info)['attributes']))
                    trainingDataParametersSet = set(getattr(self, info)['parameters'])
                    # Set the class codes of interest
                    if 'classCodesOfInterest' in trainingDataParametersSet:
                        setattr(self, targetClassCodes, set(getattr(self, info)['parameters']['classCodesOfInterest']))
                    else:
                        setattr(self, targetClassCodes, getattr(self, classCodes))
                    # Set the max points limit
                    if 'maxPoints' in trainingDataParametersSet:
                        setattr(self, maxPoints, getattr(self, info)['parameters']['maxPoints'])
                    # Set the block size
                    if 'tileSize' in trainingDataParametersSet:
                        setattr(self, blockSize, getattr(self, info)['parameters']['tileSize'])
                    # Set the scale factor
                    if 'scaleFactor' in trainingDataParametersSet:
                        setattr(self, scaleFactor, getattr(self, info)['parameters']['scaleFactor'])

class ValidatePretrainedModel:
    def __init__(self, pretrained_model):
        """*******************************************************************************
        Returns the following properties from the pretrained model:
        ----------------------------------------------------------------------------------
        pretrainedModelExists                = Boolean indicating if pretrained model exists
        supportedPretrainedModelArchitecture = Boolean indicating pretrained model's
                                               architecture is using PointCNN
        pretrainedModelVersion               = version number for the pretrained model. 
                                               when value is missing, property is set to 'unknown'
        supportedPretrainedModelVersion      = Boolean indicating pretrained model's version
                                               is supported (1.8.5)
        pretrainedModelAttributes            = attributes used in the pretrained model
        pretrainedModelClassCodes            = point classification codes or object codes
        pretrainedModelClassDescriptions     = descriptions for codes in pretrained model
        pretrainedModelMaxPoints             = maximum number of points in blocks used to 
                                               train the pretrained model
        pretrainedModelBlockSize             = block size used to train the pretrained model
        pretrainedModelType                  = the type of point cloud model 
                                               (object detection or classification)
        *******************************************************************************"""
        self.pretrainedModelExists = os.path.isfile(pretrained_model)
        self.pretrainedModelValid = False
        self.supportedPretrainedModelArchitecture = False
        self.supportedPretrainedModelVersion = False
        self.pretrainedModelVersion = None
        self.pretrainedModelAttributes = None
        self.pretrainedModelClassCodes = None
        self.pretrainedModelObjectCodes = None
        self.pretrainedModelClassDescriptions = None
        self.pretrainedModelMaxPoints  = None
        self.pretrainedModelBlockSize  = None
        self.pretrainedModelMinimumPointLimit = None
        self.pretrainedModelType = None

        # Exit the function if model doesn't exist
        if not self.pretrainedModelExists:
            return

        # Exit the ReadModel function if pretrained model can't be read
        try:
            pretrained_model_info = ReadModel(pretrained_model)
            self.pretrainedModelValid = True
        except:
            return
        
        # Get attributes from pretrained model
        if self.pretrainedModelValid:
            model_key = "ModelName"
            if model_key in pretrained_model_info:
                self.modelArchitecture = pretrained_model_info[model_key]
                self.supportedPretrainedModelArchitecture = self.modelArchitecture in set(model_architecture_keyword_name.keys())
                # Define default min points for all architecture
                if self.supportedPretrainedModelArchitecture:
                    self.pretrainedModelMinimumPointLimit = model_architecture_dict[model_architecture_keyword_name[self.modelArchitecture]]['MinPoints']
                    # Override if PointCNN
                    if self.modelArchitecture == "PointCNN":
                        try:
                            self.pretrainedModelMinimumPointLimit = pretrained_model_info["model_parameters"]["encoder_params"]["P"][1]
                        except:
                            pass
                    self.requiredModelVersion = model_architecture_dict[model_architecture_keyword_name[self.modelArchitecture]]["MinVersion"]
            if self.supportedPretrainedModelArchitecture:
                version_key = "ArcGISLearnVersion"
                if version_key in pretrained_model_info:
                    self.pretrainedModelVersion = pretrained_model_info[version_key]
                    self.supportedPretrainedModelVersion = packaging.version.parse(self.pretrainedModelVersion) >= packaging.version.parse(self.requiredModelVersion)
                else:
                    self.pretrainedModelVersion = "unknown"
                # Get the pretrained model type
                if 'pc_type' in pretrained_model_info['DataAttributes']:
                    self.pretrainedModelType = pretrained_model_info['DataAttributes']['pc_type']
                # Get attributes used in model
                self.pretrainedModelAttributes = pretrained_model_info['DataAttributes']['extra_features']
                # Support for JSON record formatting of older pre-trained models
                if type(self.pretrainedModelAttributes) is list:
                    self.pretrainedModelAttributes = {attribute[0] for attribute in self.pretrainedModelAttributes}
                else:
                    self.pretrainedModelAttributes = set(self.pretrainedModelAttributes)
                # Get block size & point limit from pretrained model
                self.pretrainedModelMaxPoints = pretrained_model_info['DataAttributes']['max_point']
                self.pretrainedModelBlockSize = pretrained_model_info['DataAttributes']['block_size']
                # Get class codes & descriptions from pretrained model
                self.pretrainedModelClassCodes = {pretrained_class['Value'] for pretrained_class in pretrained_model_info['Classes']}
                # Get code descriptions
                self.pretrainedModelClassDescriptions = [pretrained_class['Name'] for pretrained_class in pretrained_model_info['Classes']]

def validate_model_name(model_name):
    # Define restricted characters and extensions.
    restricted_characters = {'\\', '/', ':', '*', '?', '"', '<', '>', '|'}
    restricted_names = {
        "CON", "PRN", "AUX", "NUL", 
        "COM", "COM0", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", 
        "LPT", "LPT0", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"}
    # Check for restricted characters.
    if any(char in restricted_characters for char in model_name):
        return False
    # Extract the base name without the extension and check for restricted names.
    base_name = os.path.splitext(model_name)[0].upper()
    if base_name in restricted_names:
        return False
    return True

# Functions used for training and inferencing
def ApplyRemapDictionary(classes_set: set, remap_dictionary: dict, other_value: int) -> set:
    new_classes = set()
    for x in classes_set:
        if x in remap_dictionary:
            new_classes.add(remap_dictionary[x])
        elif other_value is not None:
            new_classes.add(other_value)
        else:
            new_classes.add(x)
    return new_classes

def CreateRemapDictionary(class_remap_values: list):
    remap_dictionary = dict()
    other_value = None
    if class_remap_values:
        for old_code, new_code in class_remap_values:
            new_code = int(new_code)
            if old_code.isdigit():
                old_code = int(old_code)
                remap_dictionary[old_code] = new_code
            elif old_code == "OTHER":
                other_value = new_code
    return remap_dictionary, other_value

def CompleteRemapDictionary(all_class_codes: set, remap_dictionary: dict, other_value: int) -> dict:
    if other_value is not None:
        remaining_codes = all_class_codes.difference(set(remap_dictionary))
        if remaining_codes:
            remap_dictionary = remap_dictionary.copy()
            for remaining_code in remaining_codes:
                remap_dictionary[remaining_code] = other_value
    return remap_dictionary

def sorted_attributes(unsorted_attributes):
    # Remove xyz attributes
    sorted_attributes = {reverse_pctd_attributes_dict[attribute] for attribute in (unsorted_attributes - {'xyz'})}
    sorted_attributes = [x for x in all_attributes_list if x in sorted_attributes]
    return sorted_attributes

def UnPackArguments(s):
    """*******************************************************************************
    Split string to multiple strings.
    *******************************************************************************"""
    s = s.split("\\,")
    for i in range(len(s)):
        s[i] = s[i].replace("\\/", "\\")

    return s

def ReadModel(dl_model):
    """*******************************************************************************
    Reads a deep learning model in the EMD JSON file or DLPK archive.
    *******************************************************************************"""
    import zipfile
    if (not re.search('.(emd|dlpk|json)$', dl_model, re.IGNORECASE) or not os.path.isfile(dl_model)) and os.path.isdir(dl_model):
        dl_model += os.sep + os.path.basename(dl_model) + '.emd'
        
        if not os.path.isfile(dl_model):
            dl_model = re.sub('.emd$', '.dlpk', dl_model, flags = re.IGNORECASE)
                
    if not os.path.isfile(dl_model):
        return None
        
    if re.search('.(emd|json)$', dl_model, re.IGNORECASE):
        with open(dl_model, 'r') as f:
            return json.load(f)
    
    if re.search('.dlpk$', dl_model, re.IGNORECASE):
        with zipfile.ZipFile(dl_model, 'r') as dlpk:
            emd = re.sub('.dlpk$', '.emd', os.path.basename(dl_model), flags = re.IGNORECASE)
            if not emd in dlpk.namelist():
                dl_model = []
                for name in dlpk.namelist():
                    if re.search('.emd$', name, re.IGNORECASE):
                        dl_model.append(name)
                if len(dl_model) != 1:
                    exit(-6)
                dl_model = dl_model[0]
            else:
                dl_model = emd
            with dlpk.open(dl_model) as f:
                return json.load(f)

def DeleteExistingModelDirectory(model_directory):
    delete_success = False
    model_name     = os.path.basename(model_directory)
    expected_items = {'ModelCharacteristics',
                      'model_metrics.html', 
                      f'{model_name}.pth', 
                      f'{model_name}.dlpk', 
                      f'{model_name}.emd'}
    existing_items = set(os.listdir(model_directory))
    if not existing_items.difference(expected_items):
        model_char_dir = os.path.join(model_directory, 'ModelCharacteristics')
        if os.path.isdir(model_char_dir):
            existing_model_char_items = set(os.listdir(model_char_dir))
            # Only proceed if ModelCharacteristics folder has exactly the expected files
            if not existing_model_char_items.difference({'loss_graph.png', 
                                                         'show_results.html'}): 
                for item in existing_model_char_items:
                    item = os.path.join(model_char_dir, item)
                    # Confirm it's a file before deleting
                    if os.path.isfile(item):
                        os.remove(item)
                # Remove ModelCharacteristics directory
                os.rmdir(model_char_dir)
                expected_items.remove('ModelCharacteristics')
                # Delete contents of model folder
                for item in expected_items:
                    item = os.path.join(model_directory, item) 
                    # Confirm it's a file before deleting
                    if os.path.isfile(item): 
                        os.remove(item)
                # Remove model directory
                os.rmdir(model_directory)
                delete_success = True
    return delete_success

def create_unique_folder(base_path, folder_name):
    """
    Creates a unique folder by adding an incrementing number if the folder already exists.
 
    Args:
    base_path (str): The path where the folder will be created.
    folder_name (str): The base name for the folder.
 
    Returns:
    str: The path to the newly created folder.
    """
    # Ensure the base path exists.
    if not os.path.exists(base_path):
        os.makedirs(base_path)
 
    # Create a unique folder by appending a number if necessary.
    unique_folder_path = os.path.join(base_path, folder_name)
    counter = 0
    while os.path.exists(unique_folder_path):
        unique_folder_path = os.path.join(base_path, f"{folder_name}_{counter}")
        counter += 1
 
    # os.makedirs(unique_folder_path)
    return unique_folder_path

def write_to_memory_1b(mapped_memory, position, stored_value):
    mapped_memory[position] = stored_value

def read_from_memory_1b(mapped_memory, position):
    return mapped_memory[position]

def write_to_memory(mapped_memory, position, number_of_bytes, stored_value):
    for i in range(position, position + number_of_bytes):
        mapped_memory[i] = stored_value & 0xFF
        stored_value >>= 8

def read_from_memory(mapped_memory, position, number_of_bytes):
    val = 0
    for i in range(number_of_bytes):
        val |= mapped_memory[position + i] << (8 * i)
    return val

def write_to_memory_real(mapped_memory, position, stored_value):
    mapped_memory[position : position + 8] = struct.pack('d', stored_value)

def read_from_memory_real(mapped_memory, position):
    return struct.unpack('d', mapped_memory[position : position + 8])[0]

def write_to_memory_32_safe(mapped_memory, position, stored_value):
    i = read_from_memory(mapped_memory, position, 8)
    i += 1
    write_to_memory(mapped_memory, position, 8, i)
    position += 8
    write_to_memory(mapped_memory, position, 8, stored_value)
    position += 8
    write_to_memory(mapped_memory, position, 8, i)
    position += 8

    crc = zlib.crc32(mapped_memory[position - 16: position])
    write_to_memory(mapped_memory, position, 4, crc)
    position += 4
    write_to_memory(mapped_memory, position, 4, crc)

def read_from_memory_32_safe(mapped_memory, position):
    mapped_memory_copy = mapped_memory[position : position + 32]
    i1 = read_from_memory(mapped_memory_copy, 16, 8)
    crc1 = read_from_memory(mapped_memory_copy, 28, 4)
    read_value = read_from_memory(mapped_memory_copy, 8, 8)
    crc0 = read_from_memory(mapped_memory_copy, 24, 4)
    i0 = read_from_memory(mapped_memory_copy, 0, 8)

    if i0 == 0 or i0 != i1 or crc0 != crc1:
        return None

    crc2 = zlib.crc32(mapped_memory_copy[8 : 24])
    if crc0 != crc2:
        return None

    return (read_value, i0)

def write_to_memory_string(mapped_memory, position, number_of_bytes, stored_string):
    for i in range(len(stored_string)):
        if number_of_bytes < 2:
            break

        c = ord(stored_string[i])
        mapped_memory[position] = c if c < 0x100 else ord('\"_\"')
        position += 1
        number_of_bytes -= 1
    mapped_memory[position] = 0

def read_from_memory_string(mapped_memory, position, number_of_bytes):
    read_string = []
    for i in range(1, number_of_bytes):
        if mapped_memory[position] == 0:
            break
        read_string.append(chr(mapped_memory[position]))
        position += 1
    return ''.join(read_string)

def monitor_main_process_thread(main_pid):
    """
    Thread function to monitor the main process and exit if the main process does not exist.
    
    Args:
    main_pid (int): PID of the main process to monitor.
    """
    while psutil.pid_exists(main_pid):
        time.sleep(10)
        
    os._exit(1) # Exit the worker process if the main process does not exist.

def monitor_main_process(main_pid):
    """
    Function to start a separate thread to monitor the main process.
    
    Args:
    main_pid (int): PID of the main process to monitor.
    """
    monitor_thread = threading.Thread(target = monitor_main_process_thread, args = (main_pid,))
    monitor_thread.daemon = True # Set the monitor thread as a daemon thread.
    monitor_thread.start()
