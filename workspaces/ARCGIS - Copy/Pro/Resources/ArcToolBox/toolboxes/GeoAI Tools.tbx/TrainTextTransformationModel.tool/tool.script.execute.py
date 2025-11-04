"""-------------------------------------------------------------------------
    Tool:               Train Text Transformation Model (GeoAI Tools)
    Source Name:        trainTextTransformationModel.py
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:              
    Required model_arguments: Input Table
                        Text Field
                        Label Field
                        Output Model
    Optional model_arguments: Pretrained Model
                        Max Epochs
                        Backbone Model
                        Model Arguments
                        Batch Size
                        Learning Rate
                        Validation %
                        Stop when model stops improving
                        Freeze Model
                        Remove HTML Tags
                        Remove URLs
    Description:        Trains Text Transformation model.          
------------------------------------------------------------------------"""

# Import system modules

try:
    from decimal import DivisionByZero
    import arcpy
    import os, json
    import arcgis
    import torch, gc
    import arcgis.learn
    from zipfile import ZipFile
    import shutil
    import pandas as pd
    from arcgis.learn.text import SequenceToSequence
    from arcgis.learn import prepare_textdata
    from fastai.callback import Callback
    import warnings
    from fastprogress import fastprogress

    arcpy.env.autoCancelling = False
    fastprogress.NO_BAR = True
    import locale as LOCALE
    import re

    LOCALE.setlocale(LOCALE.LC_ALL, "")
    warnings.filterwarnings("ignore")
    gc.collect()
    torch.cuda.empty_cache()
    HAS_DEPS = True
except Exception as e:
    HAS_DEPS = False


def _raise_conda_import_error():
    arcpy.AddIDMessage("ERROR", 260005)
    exit()


if not HAS_DEPS:
    _raise_conda_import_error()

g_ESRI_variable_2 = "tmp"


class CustomCancelException(Exception):
    """Custom exception for geoprocessing tool cancellations"""

    pass


# if cuda-enabled GPU is available, the tool uses GPU when the user specify processor type to be GPU or not specify anything
if torch.cuda.is_available() and (
    not arcpy.env.processorType or arcpy.env.processorType == "GPU"
):
    arcpy.env.processorType = "GPU"
    arcgis.env._processorType = arcpy.env.processorType
    os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
    if not arcpy.env.gpuId:
        arcpy.env.gpuId = 0
    os.environ["CUDA_VISIBLE_DEVICES"] = str(arcpy.env.gpuId)
    arcgis.env._gpuid = arcpy.env.gpuId
    torch.cuda.set_device(arcpy.env.gpuId)
    arcpy.AddIDMessage("INFORMATIVE", 260036)
# if cuda-enabled GPU is available, the tool uses CPU when the user specify processor type to be CPU
elif torch.cuda.is_available() and arcpy.env.processorType == "CPU":
    arcpy.env.processorType = "CPU"
    arcgis.env._processorType = arcpy.env.processorType
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    arcpy.AddIDMessage("INFORMATIVE", 260035)
# if cuda-enabled GPU is not available, the tool uses CPU when the user specify processor type to be CPU or not specify anything
elif not torch.cuda.is_available() and (
    not arcpy.env.processorType or arcpy.env.processorType == "CPU"
):
    arcpy.env.processorType = "CPU"
    arcgis.env._processorType = arcpy.env.processorType
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    arcpy.AddIDMessage("INFORMATIVE", 260035)
else:
    arcpy.AddIDMessage("ERROR", 260006)
    exit()


def format_message(results):
    res = re.findall(r"\d+\.\d+", results)
    final_str = ""
    for num in res:
        num = LOCALE.format_string("%0.12f", float(num))
        final_str += str(num) + "\t\t"
    return final_str.strip()


class ProgressCallback(Callback):
    def __init__(self, model, max_epochs, show_accuracy=True, **kwargs):
        super().__init__()
        self.model = model
        self.max_epochs = max_epochs
        self.show_accuracy = show_accuracy

    def on_train_begin(self, **kwargs):
        arcpy.SetProgressor("step", arcpy.GetIDMessage(260133))
        t_loss = arcpy.GetIDMessage(260134)
        v_loss = arcpy.GetIDMessage(260135)
        accuracy_msg = arcpy.GetIDMessage(260136)
        message_string = f"{t_loss}\t\t{v_loss}"
        if self.show_accuracy:
            message_string = message_string + f"\t\t{accuracy_msg}"
        arcpy.AddMessage(message_string)
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()

    def on_epoch_begin(self, **kwargs):
        epoch_msg = arcpy.GetIDMessage(260137)
        arcpy.SetProgressorLabel("{} {}".format(epoch_msg, kwargs.get("epoch") + 1))
        percentage_completed = float(kwargs.get("epoch") / self.max_epochs) * 100
        arcpy.SetProgressorPosition(int(percentage_completed))
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()

    def on_epoch_end(self, **kwargs):
        last_loss = kwargs.get("last_loss", "NA")
        last_metrics = kwargs.get("last_metrics", [])
        message_string = f"{last_loss}\t{last_metrics[0]}"
        if self.show_accuracy:
            accuracy = last_metrics[1] if len(last_metrics) > 1 else "NA"
            message_string = message_string + f"\t\t{accuracy}"
        local_message_string = format_message(message_string)
        arcpy.AddMessage(local_message_string)
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()


def write_to_path(df, output_path, text_field, label_field):
    output_path = os.path.join(output_path, "inputdata")
    df = df[df[text_field].notna()]
    df = df[df[label_field].notna()]
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    file_path = os.path.join(output_path, "training_data.csv")
    _ = df.to_csv(file_path, index=False)
    return output_path


def read_file(path, col_list):
    data_type = arcpy.Describe(path).dataType
    catalog_path = arcpy.Describe(path).catalogPath
    sdf = None
    if "http:" in catalog_path or "https:" in catalog_path:
        try:
            all_data = arcpy.da.TableToNumPyArray(catalog_path, field_names=col_list)
            sdf = pd.DataFrame(data=all_data, columns=col_list)
        except:
            arcpy.AddIDMessage("ERROR", 260013)
            exit()
    else:
        if data_type in ["TableView", "TextFile", "Table"]:
            sdf = pd.DataFrame.spatial.from_table(path, fields=col_list)
        elif data_type in ["ShapeFile", "FeatureLayer", "FeatureClass"]:
            sdf = pd.DataFrame.spatial.from_featureclass(path, fields=col_list)
        else:
            arcpy.AddIDMessage("ERROR", 260013)
            exit()
    return data_type, sdf


def execute():
    try:
        if not HAS_DEPS:
            _raise_conda_import_error()

        training_model_object = None
        data_bunch = None
        in_table = arcpy.GetParameter(0)
        text_field = arcpy.GetParameterAsText(1)
        label_field = arcpy.GetParameterAsText(2)
        out_model = arcpy.GetParameterAsText(3)
        pretrained_model = (
            arcpy.GetParameterAsText(4) if arcpy.GetParameterAsText(4) else None
        )
        max_epochs = int(arcpy.GetParameterAsText(5))
        backbone_model = arcpy.GetParameterAsText(6)
        batch_size = int(arcpy.GetParameterAsText(7))
        model_arguments = arcpy.GetParameter(8)
        learning_rate = (
            float(abs(arcpy.GetParameter(9))) if arcpy.GetParameter(9) else None
        )
        validation_percentage = (
            (float(arcpy.GetParameter(10)) / 100) if arcpy.GetParameter(10) else None
        )
        stop_training = arcpy.GetParameter(11)
        freeze = arcpy.GetParameter(12)
        remove_html = arcpy.GetParameter(13)
        remove_url = arcpy.GetParameter(14)
        input_prompt = arcpy.GetParameterAsText(15)
        # Get model parameters and prepare_data parameters
        kwargs = {}
        prepare_data_kwargs = {}
        if backbone_model not in ["mistral"]:
            for arg_index in range(model_arguments.rowCount):
                arg_pair = model_arguments.getRow(arg_index).split("'")
                for each in arg_pair:
                    if not each.strip():
                        arg_pair.remove(each)
                if arg_pair[1]:
                    if arg_pair[0] == "sequence_length":
                        kwargs["seq_len"] = eval(arg_pair[1])
                    else:
                        kwargs[arg_pair[0]] = eval(arg_pair[1])
        # Prepare Data
        prepare_data_kwargs["batch_size"] = batch_size
        if validation_percentage:
            prepare_data_kwargs["val_split_pct"] = validation_percentage
        if backbone_model == "":
            kwargs["backbone"] = "t5-base"
        else:
            kwargs["backbone"] = backbone_model

        if backbone_model in ["mistral"]:
            kwargs["prompt"] = input_prompt

        show_accuracy = "precision_score"
        in_table_str = str(in_table)
        data_type, sdf = read_file(in_table_str, [text_field, label_field])
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        input_data_path = write_to_path(sdf, out_model, text_field, label_field)
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        try:
            data_bunch = prepare_textdata(
                path=str(input_data_path),
                task="sequence_translation",
                text_columns=text_field,
                label_columns=label_field,
                train_file=str("training_data.csv"),
                remove_html_tags=remove_html,
                remove_urls=remove_url,
                working_dir=out_model,
                **prepare_data_kwargs,
            )
            if arcpy.env.isCancelled:
                arcpy.AddIDMessage("ERROR", 571)
                exit()
        except ValueError as e:
            arcpy.AddIDMessage("ERROR", 260062)
            exit()
        except KeyError as e:
            arcpy.AddIDMessage("ERROR", 260062)
            exit()
        except IndexError as e:
            arcpy.AddIDMessage("ERROR", 260062)
            exit()
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 260041, str(e))
            exit()
        show_accuracy = True
        compute_metrics = False
        if backbone_model not in ["mistral"]:
            compute_metrics = True
            if learning_rate is None:
                arcpy.AddIDMessage("INFORMATIVE", 260051)
            else:
                arcpy.AddIDMessage("INFORMATIVE", 260052, str(learning_rate))
        if not pretrained_model:
            # Create Training Model Object
            try:
                training_model_object = SequenceToSequence(data_bunch, **kwargs)
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()
            except IndexError:
                arcpy.AddIDMessage("ERROR", 260147)
                exit()
            except Exception as e:
                if "Mistral model is not installed" in str(e):
                    arcpy.AddIDMessage("ERROR", 260333)
                    exit()
                else:
                    arcpy.AddIDMessage("ERROR", 260165)
                    exit()
        else:
            # Use pretrained_model parameters to override user provided parameters if there is any
            if pretrained_model.endswith(".dlpk"):
                with ZipFile(pretrained_model, "r") as f:
                    tmp = os.path.join(
                        os.path.dirname(pretrained_model), g_ESRI_variable_2
                    )
                    f.extractall(tmp)
                    pretrained_model_emd = os.path.basename(pretrained_model).replace(
                        ".dlpk", ".emd"
                    )
                    pretrained_model_path = os.path.join(tmp, pretrained_model_emd)
                    if arcpy.env.isCancelled:
                        arcpy.AddIDMessage("ERROR", 571)
                        exit()
            else:
                pretrained_model_path = pretrained_model
            try:
                if backbone_model not in ["mistral"]:
                    training_model_object = SequenceToSequence.from_model(
                        pretrained_model_path, data_bunch
                    )
                else:
                    training_model_object = SequenceToSequence.from_model(
                        pretrained_model_path, data_bunch, llm_params={"prompt": input_prompt}
                    )
            except IndexError:
                arcpy.AddIDMessage("ERROR", 260147)
                exit()
            except Exception as e:
                if "Mistral model is not installed" in str(e):
                    arcpy.AddIDMessage("ERROR", 260333)
                    exit()
                else:
                    arcpy.AddIDMessage("ERROR", 260165)
                    exit()
        # If Freeze option is unchecked, the layers in the backbone is also updated
        if backbone_model not in ["mistral"]:
            try:
                if not freeze:
                    training_model_object.unfreeze()
                training_model_object.fit(
                    epochs=max_epochs,
                    lr=learning_rate,
                    early_stopping=stop_training,
                    checkpoint=False,
                    callbacks=[
                        ProgressCallback(
                            training_model_object,
                            max_epochs,
                            show_accuracy=show_accuracy,
                            checkpoint=False,
                        )
                    ],
                )
            except Exception as e:
                arcpy.AddIDMessage("ERROR", 260041, str(e))
                exit()
            if arcpy.env.isCancelled:
                arcpy.AddIDMessage("ERROR", 571)
                exit()
        arcpy.SetProgressorLabel(arcpy.GetIDMessage(260056))
        arcpy.SetProgressorLabel(arcpy.GetIDMessage(260138))
        metrics_text = str(training_model_object.get_model_metrics())
        nums = re.findall(r"\d+\.\d+", metrics_text)
        if backbone_model not in ["mistral"]:
            seq2seq_acc = LOCALE.format_string("%0.2f", float(nums[0]))
            bleu = LOCALE.format_string("%0.2f", float(nums[1]))
            out_text = "'seq2seq_acc': " + str(seq2seq_acc) + ", 'bleu': " + str(bleu)
        else:
            bleu = LOCALE.format_string("%0.2f", float(nums[0]))
            out_text = "'bleu': " + str(bleu)

        arcpy.AddIDMessage("INFORMATIVE", 260063, out_text)
        arcpy.SetProgressorPosition(100)
        arcpy.ResetProgressor()
        try:
            training_model_object.save(
                out_model, save_inference_file=False, compute_metrics=compute_metrics
            )
        except:
            arcpy.AddIDMessage("ERROR", 260147)
            exit()
        arcpy.AddIDMessage("INFORMATIVE", 260065, str(out_model))
        arcpy.AddIDMessage("INFORMATIVE", 260056)
        # delete tmp folder if existed
        shutil.rmtree(input_data_path)
        try:
            if os.path.exists(tmp):
                shutil.rmtree(tmp)
        except NameError:
            pass
    except Exception as e:
        if "out of memory" in str(e):
            arcpy.AddIDMessage("ERROR", 260004)
            exit()
        else:
            arcpy.AddIDMessage("ERROR", 260041, str(e))
            exit()
    finally:
        del data_bunch
        del training_model_object
        gc.collect()
        torch.cuda.empty_cache()


if __name__ == "__main__":
    execute()
