"""-------------------------------------------------------------------------
    Tool:               Train Entity Recognizer Model (GeoAI Tools)
    Source Name:        trainEntityRecognizerModel.py
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:              
    Required model_model_arguments: Input Folder
                        Output Model
    Optional model_model_arguments: Pretrained Model
                        Address Entity
                        Max Epochs
                        Backbone Model
                        Model model_arguments
                        Batch Size
                        Learning Rate
                        Validation %
                        Stop when model stops improving
                        Freeze Model
    Description:        Trains Entity Recognizer model.
------------------------------------------------------------------------"""

try:
    import sys, arcpy
    import os, glob, re
    import torch, gc
    from zipfile import ZipFile
    import shutil
    import pandas as pd
    from arcgis.learn.text import EntityRecognizer
    from arcgis.learn import prepare_textdata
    from fastai.callback import Callback
    import warnings
    from fastprogress import fastprogress
    from io import StringIO

    arcpy.env.autoCancelling = False
    fastprogress.NO_BAR = True
    import re
    import locale as LOCALE

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

g_ESRI_variable_1 = os.path.join(arcpy.env.scriptWorkspace, "textclassifier1")
g_ESRI_variable_2 = "tmp"


class CustomCancelException(Exception):
    """Custom exception for geoprocessing tool cancellations"""

    pass


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


class RedirectedStdout:
    def __init__(self):
        self._stdout = None
        self._string_io = None

    def __enter__(self):
        self._stdout = sys.stdout
        sys.stdout = self._string_io = StringIO()
        return self

    def __exit__(self, type, value, traceback):
        sys.stdout = self._stdout

    def __str__(self):
        return self._string_io.getvalue()


def write_to_path(df, output_path):
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    file_path = os.path.join(output_path, "training_data.csv")
    _ = df.to_csv(file_path, index=False)


def read_file(filepath, output_path, text_column):
    dataset_type = ""
    filename = ""
    desc = arcpy.Describe(filepath)
    if desc.dataType in ["Folder"]:
        is_csv = glob.glob(os.path.join(filepath, "*.csv"))
        is_json = glob.glob(os.path.join(filepath, "*.json"))
        if len(is_json) > 0:
            dataset_type = "ner_json"
            filename = os.path.basename(is_json[0])
        elif len(is_csv) > 1:
            is_tag = os.path.isfile(os.path.join(filepath, "tags.csv"))
            is_token = os.path.isfile(os.path.join(filepath, "tokens.csv"))
            if is_tag and is_token:
                tag = pd.read_csv(os.path.join(filepath, "tags.csv"))
                all_str = tag.astype(str).values.flatten().tolist()
                biluo = list(
                    filter(lambda x: x.startswith("L-") or x.startswith("U-"), all_str)
                )
                if len(biluo) > 0:
                    dataset_type = "BILUO"
                else:
                    dataset_type = "IOB"
            else:
                arcpy.AddIDMessage("ERROR", 260014)
                exit()
        else:
            arcpy.AddIDMessage("ERROR", 260014)
            exit()
    else:
        data_type = arcpy.Describe(filepath).dataType
        if text_column == "":
            arcpy.AddIDMessage("ERROR", 728, "''")
            exit()
        if data_type in ["TableView", "TextFile", "Table"]:
            sdf = pd.DataFrame.spatial.from_table(filepath)
        elif data_type in ["ShapeFile", "FeatureLayer", "FeatureClass"]:
            sdf = pd.DataFrame.spatial.from_featureclass(filepath)
        else:
            arcpy.AddIDMessage("ERROR", 260014)
            exit()
        output_path_name = os.path.join(output_path, "inputdata")
        if not os.path.exists(output_path_name):
            os.makedirs(output_path_name)
        file_path = os.path.join(output_path_name, "training_data.csv")
        df = sdf[sdf[text_column].notna()]
        df = df[df[text_column] != ""]
        df = df.drop(columns=["OBJECTID"], axis=1, errors="ignore")
        df.dropna(how="all", axis=1, inplace=True)
        df.to_csv(file_path, index=False)
        dataset_type = "csv"
        filename = file_path
    return filename, dataset_type


def execute():
    try:
        if not HAS_DEPS:
            _raise_conda_import_error()
            exit()
        data_bunch = None
        training_model_object = None

        in_folder = arcpy.GetParameterAsText(0)
        pretrained_model = (
            arcpy.GetParameterAsText(2) if arcpy.GetParameterAsText(2) else None
        )
        out_model = arcpy.GetParameterAsText(1)
        address_entity = arcpy.GetParameterAsText(3)
        max_epochs = int(arcpy.GetParameterAsText(4))
        backbone_model = arcpy.GetParameterAsText(5)
        batch_size = int(arcpy.GetParameterAsText(6))
        model_arguments = arcpy.GetParameter(7)
        learning_rate = (
            float(abs(arcpy.GetParameter(8))) if arcpy.GetParameter(8) else None
        )
        validation_percentage = (
            (float(arcpy.GetParameter(9)) / 100) if arcpy.GetParameter(9) else None
        )
        stop_training = arcpy.GetParameter(10)
        freeze = arcpy.GetParameter(11)
        text_columns = arcpy.GetParameterAsText(12)
        input_prompt = arcpy.GetParameterAsText(13)
        # Get model parameters and prepare_data parameters
        kwargs = {}
        prepare_data_kwargs = {}
        filename, dataset_type = read_file(in_folder, out_model, text_columns)
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        if backbone_model not in ["mistral"]:
            for arg_index in range(model_arguments.rowCount):
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()
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

        if dataset_type == "csv":
            prepare_data_kwargs["text_columns"] = text_columns

        if validation_percentage:
            prepare_data_kwargs["val_split_pct"] = validation_percentage

        show_accuracy = "accuracy"
        if backbone_model == "":
            kwargs["backbone"] = "roberta-base"
        else:
            kwargs["backbone"] = backbone_model

        if backbone_model in ["mistral"]:
            kwargs["prompt"] = input_prompt
        try:
            if dataset_type == "csv":
                data_path = filename
            else:
                data_path = os.path.join(in_folder, filename)

            if address_entity != "":
                data_bunch = prepare_textdata(
                    path=data_path,
                    task="entity_recognition",
                    dataset_type=dataset_type,
                    class_mapping={"address_tag": address_entity},
                    working_dir=out_model,
                    stratify=True,
                    **prepare_data_kwargs,
                )
            else:
                data_bunch = prepare_textdata(
                    path=data_path,
                    task="entity_recognition",
                    dataset_type=dataset_type,
                    working_dir=out_model,
                    stratify=True,
                    **prepare_data_kwargs,
                )
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 260041, str(e))
            exit()
        if arcpy.env.isCancelled:
            arcpy.AddIDMessage("ERROR", 571)
            exit()
        show_accuracy = True
        if not pretrained_model:
            # Create Training Model Object
            try:
                training_model_object = EntityRecognizer(data_bunch, **kwargs)
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
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
            tmp = ""
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
                    training_model_object = EntityRecognizer.from_model(
                        pretrained_model_path, data_bunch, **kwargs
                    )
                else:
                    training_model_object = EntityRecognizer.from_model(
                        pretrained_model_path, data_bunch, llm_params={"prompt": input_prompt}
                    )
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()
            except Exception as e:
                if "Mistral model is not installed" in str(e):
                    arcpy.AddIDMessage("ERROR", 260333)
                    exit()
                else:
                    arcpy.AddIDMessage("ERROR", 260165)
                    exit()
            # delete tmp folder if existed
            try:
                if os.path.exists(tmp):
                    shutil.rmtree(tmp)
            except NameError:
                pass
        # # If Freeze option is unchecked, the layers in the backbone is also updated

        compute_metrics = False
        if backbone_model not in ["mistral"]:
            compute_metrics = True
            if learning_rate is None:
                arcpy.AddIDMessage("INFORMATIVE", 260051)
                learning_rate = training_model_object.lr_find(allow_plot=False)
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()

            else:
                arcpy.AddIDMessage("INFORMATIVE", 260052, str(learning_rate))
            if not freeze:
                training_model_object.unfreeze()

            try:
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
                if arcpy.env.isCancelled:
                    arcpy.AddIDMessage("ERROR", 571)
                    exit()
            except Exception as e:
                arcpy.AddIDMessage("ERROR", 260041, str(e))
                exit()
        arcpy.SetProgressorLabel(arcpy.GetIDMessage(260056))
        arcpy.SetProgressorLabel(arcpy.GetIDMessage(260138))
        accuracy = LOCALE.format_string(
            "%0.2f", float(training_model_object.precision_score())
        )
        recall_score = LOCALE.format_string(
            "%0.2f", float(training_model_object.recall_score())
        )
        f1_score = LOCALE.format_string(
            "%0.2f", float(training_model_object.f1_score())
        )
        arcpy.AddIDMessage("INFORMATIVE", 260053, str(accuracy))
        arcpy.AddIDMessage("INFORMATIVE", 260054, str(recall_score))
        arcpy.AddIDMessage("INFORMATIVE", 260055, str(f1_score))

        arcpy.SetProgressorPosition(100)
        arcpy.ResetProgressor()
        try:
            training_model_object.save(
                out_model, save_inference_file=False, compute_metrics=compute_metrics
            )
        except Exception as e:
            if "Try specifying the labels parameter" in str(e):
                arcpy.AddIDMessage("ERROR", 260332)
                exit()
        arcpy.AddIDMessage("INFORMATIVE", 260065, str(out_model))
        arcpy.AddIDMessage("INFORMATIVE", 260056)
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
