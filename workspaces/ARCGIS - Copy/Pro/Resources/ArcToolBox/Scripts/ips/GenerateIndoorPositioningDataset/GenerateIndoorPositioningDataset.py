import multiprocessing
import os
import sys

import arcpy
import ips.GenerateIndoorPositioningDataset.const as gipd_c
import ips.GenerateIndoorPositioningDataset.utils as gipd_u
import ips.GenerateIndoorPositioningDataset.validation as gipd_v
import ips.GenerateIndoorPositioningDataset.tool_validator as gipd_t_v
import ips.GenerateIndoorPositioningFile.validation as gipf_v
import ips.GenerateIndoorPositioningFileWithoutSurvey.validation as gipfws_v
import ips.utils_io as u_io
import ips.validation as v


class GenerateIndoorPositioningDataset(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Generate Indoor Positioning Dataset"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 78000008

    def execute(self):
        """main function to generate a positioning dataset as script tool

        input params:
            - target_ips_positioning_datasets: the location of indoor positioning datasets
            - dataset_name: dataset name
            - generation_method: "Survey-based" or "Survey-less" generated method
            - in_ips_recordings: layer or feature class
            - in_ips_beacons: layer or feature class
            - in_ips_areas: layer or feature class
            - in_walls: layer or feature class
            - in_levels: layer or feature class

        """

        params = arcpy.GetParameterInfo()
        target_ips_positioning_datasets_param = params[0]
        dataset_name = params[1].valueAsText  # output dataset name
        generation_method = params[2].valueAsText
        in_levels_param = params[3]
        in_recordings_param = None
        in_ips_beacons_param = None
        in_ips_areas_param = None
        in_walls_param = None
        update_existing = params[9].value
        existing_dataset = params[10].valueAsText

        if generation_method == gipd_c.METHOD_SURVEY_BASED:
            in_recordings_param = params[4]
        else:
            in_ips_beacons_param = params[5]
            in_ips_areas_param = params[6]
            in_walls_param = params[7]

        multiprocessing.freeze_support = True
        exe_path = os.path.join(sys.exec_prefix, 'pythonw.exe')
        multiprocessing.set_executable(exe_path)
        try:

            parameter_names_dict = None

            gipd_u.generate_positioning_dataset(
                target_ips_positioning_datasets=u_io.layer_or_fc(target_ips_positioning_datasets_param),
                dataset_name=dataset_name,
                generation_method=generation_method,
                in_levels=u_io.layer_or_fc(in_levels_param),
                in_recordings=u_io.layer_or_fc(in_recordings_param),
                in_ips_beacons=u_io.layer_or_fc(in_ips_beacons_param),
                in_ips_areas=u_io.layer_or_fc(in_ips_areas_param),
                in_walls=u_io.layer_or_fc(in_walls_param),
                update_existing=update_existing,
                existing_dataset=existing_dataset,
                parameter_names_dict=parameter_names_dict
            )
        except gipd_v.MissingData as e:
            # target workspace is missing Positioning Points or Positioning Signals schema
            arcpy.AddIDMessage('ERROR', 250091, e.param_name)
        except v.AttachmentTableError as e:
            if str(e.table) == str(in_recordings_param.value):
                # recordings FC has no attachment table
                arcpy.AddIDMessage("ERROR", 250031)
            else:
                # (generic) table/FC has no attachment table
                arcpy.AddIDMessage("ERROR", 1179)
        except v.NonEditableFeatureServiceError:
            arcpy.AddIDMessage('ERROR', 250103)
        except v.NoValidFeaturesError as e:
            arcpy.AddIDMessage('ERROR', 250072, e.input_param_name)
        except v.FeatureServiceError:
            arcpy.AddIDMessage("ERROR", 250033)
        except v.NoValidRecordings:
            arcpy.AddIDMessage('ERROR', 250035)
        except v.EmptyRadiomapError:
            if generation_method == gipd_c.METHOD_SURVEY_BASED:
                arcpy.AddIDMessage('ERROR', 250036)
            else:
                arcpy.AddIDMessage('ERROR', 250081)
        except gipf_v.MixedSignalDataError:
            arcpy.AddIDMessage('ERROR', 250038)
        except gipfws_v.DuplicatedLevelsError as e:
            arcpy.AddIDMessage('ERROR', 250075, e.level_object_ids)
        except gipfws_v.DuplicatedBeaconsError as e:
            arcpy.AddIDMessage('ERROR', 250076, e.beacon_object_ids)
        except gipfws_v.CurvedGeometriesError as e:
            arcpy.AddIDMessage('ERROR', 250073, e.input_param_name, e.curved_geometries_oids)
        except gipfws_v.MisplacedBeaconsError as e:
            arcpy.AddIDMessage('ERROR', 250060, e.beacon_object_ids)
        except gipfws_v.DisjointInputError as e:
            arcpy.AddIDMessage('ERROR', 250068, e.param_name,
                               ', '.join([str(oid) for oid in e.object_ids]))
        except v.PendingEditsError:
            arcpy.AddIDMessage('ERROR', 130144)
        except v.MultiSiteError:
            arcpy.AddIDMessage("ERROR", 250034)
        except gipd_v.DatasetExtentExceedsMaxSize:
            arcpy.AddIDMessage("ERROR", 250094)
        except gipd_v.EmptyPositioningDataset as e:
            arcpy.AddIDMessage("ERROR", 250102, e.param_name)
        except gipd_v.NotUpdatableDatasetError:
            arcpy.AddIDMessage("ERROR", 250104)
        except Exception as any_error:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError(any_error)
        finally:
            gipd_t_v.validate_after_run = True


if __name__ == "__main__":
    GenerateIndoorPositioningDataset().execute()
