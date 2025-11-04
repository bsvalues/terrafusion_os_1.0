import arcpy
import ips.GenerateIndoorPositioningFileWithoutSurvey.const as gipfws_c
import ips.GenerateIndoorPositioningFileWithoutSurvey.utils as gipfws_u
import ips.GenerateIndoorPositioningFileWithoutSurvey.validation as gipfws_v
import ips.validation as v


class GenerateIndoorPositioningFileWithoutSurvey(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Generate Survey-Less Positioning Dataset"
        self.description = "Creates an indoor positioning dataset."
        self.canRunInBackground = False
        self.helpContext = 78000006

    def execute(self):
        """main function"""
        parameters = arcpy.GetParameterInfo()
        target_positioning_table = parameters[0]
        in_beacon_features = parameters[1]
        in_ips_area_features = parameters[2]
        in_wall_features = parameters[3]
        in_facility_features = parameters[4]
        in_level_features = parameters[5]
        in_ips_transition_features = parameters[6]
        in_comment = parameters[7]

        parameter_names_dict = {
            gipfws_c.BEACONS_PARAM: in_beacon_features.displayName,
            gipfws_c.IPS_AREAS_PARAM: in_ips_area_features.displayName,
            gipfws_c.WALLS_PARAM: in_wall_features.displayName,
            gipfws_c.FACILITIES_PARAM: in_facility_features.displayName,
            gipfws_c.LEVELS_PARAM: in_level_features.displayName}

        try:
            # if there are pending edits in a fgdb/egdb raise error
            if (not v.is_feature_service(target_positioning_table.valueAsText)
                    and arcpy.IsBeingEdited(target_positioning_table.value)):
                raise v.PendingEditsError

            # check if the target positioning table has attachments
            if not v.has_attachments(table=target_positioning_table.value):
                raise v.AttachmentTableError(table=target_positioning_table.value)

            gipfws_u.generate_indoor_positioning_file_without_survey(
                target_positioning_table=target_positioning_table.value,
                in_beacon_features=in_beacon_features.value,
                in_ips_area_features=in_ips_area_features.value,
                in_wall_features=in_wall_features.value,
                in_facility_features=in_facility_features.value,
                in_level_features=in_level_features.value,
                in_ips_transition_features=in_ips_transition_features.value,
                comment=in_comment.valueAsText,
                parameter_names_dict=parameter_names_dict)
        except v.NoValidFeaturesError as e:
            arcpy.AddIDMessage('ERROR', 250072, e.input_param_name)
        except gipfws_v.DuplicatedFacilitiesError as e:
            arcpy.AddIDMessage('ERROR', 250074, e.facility_object_ids)
        except gipfws_v.DuplicatedLevelsError as e:
            arcpy.AddIDMessage('ERROR', 250075, e.level_object_ids)
        except gipfws_v.DuplicatedBeaconsError as e:
            arcpy.AddIDMessage('ERROR', 250076, e.beacon_object_ids)
        except v.MultiSiteError:
            arcpy.AddIDMessage("ERROR", 250034)
        except gipfws_v.CurvedGeometriesError as e:
            arcpy.AddIDMessage('ERROR', 250073, e.input_param_name, e.curved_geometries_oids)
        except gipfws_v.MisplacedBeaconsError as e:
            arcpy.AddIDMessage('ERROR', 250060, e.beacon_object_ids)
        except gipfws_v.DisjointInputError as e:
            arcpy.AddIDMessage('ERROR', 250068, e.param_name,
                               ', '.join([str(oid) for oid in e.object_ids]))
        except v.FeatureServiceError:
            arcpy.AddIDMessage('ERROR', 250033)
        except v.NonEditableFeatureServiceError:
            arcpy.AddIDMessage('ERROR', 250103)
        except v.AttachmentTableError:
            arcpy.AddIDMessage("ERROR", 250032)
        except v.PendingEditsError:
            arcpy.AddIDMessage('ERROR', 130144)
        except v.EmptyRadiomapError:
            arcpy.AddIDMessage('ERROR', 250081)
        except Exception as any_error:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError(any_error)


if __name__ == "__main__":
    GenerateIndoorPositioningFileWithoutSurvey().execute()
