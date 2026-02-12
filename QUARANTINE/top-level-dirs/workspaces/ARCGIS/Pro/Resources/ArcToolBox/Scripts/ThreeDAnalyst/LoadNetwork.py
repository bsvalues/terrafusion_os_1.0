from logging import config
import os
import json
import torch
from ThreeDAnalyst.MyNet import *
from ThreeDAnalyst.CommonDefines import *

# Load the configuration from a JSON file for the model parameters.
def load_config(path):
    try:
        with open(path + ".json", "r") as file:
            config = json.load(file)
        return config

    except FileNotFoundError:
        print(f"Error: The file {path} was not found.")
    except json.JSONDecodeError:
        print(f"Error: The file {path} is not a valid JSON file.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

    return None

# Get the parameters from the configuration file.
def get_parameters(path):
    default_config = {
        "TrackGauge": 1.435,
        "RailThickness": 0.07,
        "CellSize": 0.04,
        "LineThickness": 0.07
    }

    user_config = load_config(path)
    default_config.update(user_config)

    return default_config

def read_model(model_path, device = "cpu", config_path = None, diagnostics = False):
    # Load the configuration.
    config = load_config(model_path if config_path is None else config_path)
    if config is None:
        return None

    if config:
        try:
            # Accessing the configuration values.
            version = config.get("version")
            model_architecture = config.get("model_architecture")
            input_channels = config.get("input_channels")
            decoder_channels = config.get("decoder_channels")
            num_classes = config.get("num_classes")
            layers_config = config.get("layers_config")
            pdf_config = config.get("pdf_config", [])
            combining_channels = config.get("combining_channels", [])
            combining_mode = config.get("combining_mode", "MULTIPLICATION")

            # Print the loaded configuration.
            if diagnostics:
                print("Version:", version)
                print("Model Architecture:", model_architecture)
                print("Input Channels:", input_channels)
                print("Decoder Channels:", decoder_channels)
                print("Num Classes:", num_classes)
                print("Layers Config:", layers_config)
                print("PDF Config:", pdf_config)
                print("Combining Channels:", combining_channels)
                print("Combining Mode:", combining_mode)

            # Create the model.
            if model_architecture == "MyNet":
                combining_mode = str_to_pdf_combining_mode(combining_mode)

                model = MyNet(num_classes = num_classes, input_channels = input_channels, decoder_channels = decoder_channels, layers_config = layers_config, pdf_config = pdf_config, combining_channels = combining_channels, combining_mode = combining_mode)
            else:
                print(f"Error: The model architecture {model_architecture} is not supported.")
                return None

            # Load the weights into the model.
            model.load_state_dict(torch.load(model_path + ".pth", map_location = device))

            # Move the model to the target device.
            model.to(device)

            return model

        except KeyError as e:
            print(f"Error: Missing key in the configuration file: {e}")
        except Exception as e:
            print(f"An unexpected error occurred while processing the configuration: {e}")

        return None
