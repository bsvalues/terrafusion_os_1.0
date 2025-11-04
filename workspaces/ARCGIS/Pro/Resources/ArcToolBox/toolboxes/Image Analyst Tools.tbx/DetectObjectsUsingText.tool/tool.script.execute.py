
import os, tempfile, gc, arcpy, arcgis, ConversionUtils
from pathlib import Path

try:
    import torch
    HAS_TORCH = True
except Exception as e:
    HAS_TORCH = False

try:
    from samgeo.text_sam import LangSAM
    HAS_SAM = True
except Exception as e:
    HAS_SAM = False

if arcpy.env.processorType == "GPU" and torch.cuda.is_available() and arcpy.env.gpuId:
    # use specific gpu if gpuId is specified, use all available gpus if no gpuID is specified
    arcgis.env._processorType = arcpy.env.processorType
    os.environ["CUDA_VISIBLE_DEVICES"] = str(arcpy.env.gpuId)
    arcgis.env._gpuid = arcpy.env.gpuId
    torch.cuda.set_device(arcpy.env.gpuId)
else:
    # use all available gpus if processor type is not specified(default), gpuID is ignored in this case
    arcgis.env._processorType = "GPU"

def execute():
    if not HAS_TORCH:
        ConversionUtils.gp.AddError("PyTorch library is not installed. Install deep learning frameworks for ArcGIS Pro at https://pro.arcgis.com/en/pro-app/latest/help/analysis/deep-learning/install-deep-learning-frameworks.htm") 
        
    if not HAS_SAM:
        ConversionUtils.gp.AddError("SAM is not installed. Install deep learning frameworks for ArcGIS Pro at https://pro.arcgis.com/en/pro-app/latest/help/analysis/deep-learning/install-deep-learning-frameworks.htm")

    input_raster = ConversionUtils.gp.GetParameterAsText(0)
    output_feature_class = ConversionUtils.gp.GetParameterAsText(1)
    class_name= ConversionUtils.gp.GetParameterAsText(2)
    box_threshold = float(ConversionUtils.gp.GetParameterAsText(3))
    text_threshold = float(ConversionUtils.gp.GetParameterAsText(4))

    try:
        
        sam = LangSAM(model_type='vit_b')
        input_path = arcpy.Describe(input_raster).catalogPath
        
        if arcpy.env.extent != "":
            clip_raster = tempfile.NamedTemporaryFile().name
            clip_raster = str(Path(clip_raster).with_suffix(Path(input_path).suffix))
            arcpy.management.Clip(input_raster, arcpy.env.extent, clip_raster)
            input_path = arcpy.Describe(clip_raster).catalogPath

        ConversionUtils.gp.AddMessage("Detecting {0}...".format(class_name))
        sam.predict(input_path, class_name, box_threshold, text_threshold)

        temp_file = tempfile.NamedTemporaryFile().name
        shape_path = str(Path(temp_file).with_suffix(".shp"))

        ConversionUtils.gp.AddMessage("Saving detected {0}...".format(class_name))
        sam.save_boxes(shape_path)

        arcpy.conversion.ExportFeatures(shape_path, output_feature_class)

    except Exception as ErrorDesc:
        ConversionUtils.gp.AddError(str(ErrorDesc))

    finally:
        del sam
        gc.collect()
        torch.cuda.empty_cache()

if __name__ == '__main__':
    execute()
