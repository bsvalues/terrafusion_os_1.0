import multiprocessing
import os
import sys
import tempfile

import arcpy
import ips.GenerateIndoorPositioningFile.utils as gipf_u
import ips.GenerateIndoorPositioningFile.validation as gipf_v
import ips.validation as v


class GenerateIndoorPositioningFile(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Generate Indoor Positioning File"
        self.description = "Creates a radiomap for indoor positioning."
        self.canRunInBackground = False
        self.helpContext = 78000001

    def execute(self):
        parameters = arcpy.GetParameterInfo()
        positioning_table = parameters[1]  # arcpy.GetParameter(1),
        recordings_fc = parameters[0]  # arcpy.GetParameter(0),
        transitions = parameters[2]  # arcpy.GetParameter(2),
        comment = parameters[3]  # arcpy.GetParameterAsText(3)

        """main function to generate a positioning file as script tool

        :param positioning_table: table, default: from arcGIS
        :param recordings_fc: feature class, default: from arcGIS
                      if several recordings are used, separate ids with space
        :param transitions: feature class, default: from arcGIS
                             transformed into portals
        :param comment: str, default: from arcGIS
                        comment gets written to positioning_table
        """
        multiprocessing.freeze_support = True
        exe_path = os.path.join(sys.exec_prefix, 'pythonw.exe')
        multiprocessing.set_executable(exe_path)
        try:
            # if there are pending edits in a fgdb/egdb raise error
            if (not v.is_feature_service(positioning_table.valueAsText)
                    and arcpy.IsBeingEdited(positioning_table.value)):
                raise v.PendingEditsError

            # check if the inputs have attachment tables
            if not v.has_attachments(table=recordings_fc.value):
                raise v.AttachmentTableError(table=recordings_fc.value)
            if not v.has_attachments(table=positioning_table.value):
                raise v.AttachmentTableError(table=positioning_table.value)
            # from Python 3.10 on we can call cleanup
            # and ignore exceptions for tempdirs
            # this patch can be replaced by using tempdir parameter
            # ignore_errors from 3.10 on
            tempfile.TemporaryDirectory.cleanup = (
                gipf_u.cleanup_patch)
            with tempfile.TemporaryDirectory() as tmp_dir:
                gipf_u.generate_positioning_file(
                    recordings_fc=recordings_fc.value,
                    positioning_table=positioning_table.value,
                    transitions=transitions.value,
                    comment=comment.valueAsText,
                    data_dir=tmp_dir
                )
            table_path = arcpy.Describe(positioning_table).catalogPath
            arcpy.SetParameter(4, table_path)
        except v.AttachmentTableError as e:
            if str(e.table) == str(recordings_fc.value):
                # recordings FC has no attachment table
                arcpy.AddIDMessage("ERROR", 250031)
            elif str(e.table) == str(positioning_table.value):
                # positioning table has no attachment table
                arcpy.AddIDMessage("ERROR", 250032)
            else:
                # (generic) table/FC has no attachment table
                arcpy.AddIDMessage("ERROR", 1179)
        except v.NonEditableFeatureServiceError:
            arcpy.AddIDMessage('ERROR', 250103)
        except v.FeatureServiceError:
            arcpy.AddIDMessage("ERROR", 250033)
        except v.UploadAttachmentError as e:
            arcpy.AddIDMessage("ERROR", 250051, e.oid, e.attachment_local_path)
        except v.MultiSiteError:
            arcpy.AddIDMessage("ERROR", 250034)
        except v.NoValidRecordings:
            arcpy.AddIDMessage('ERROR', 250035)
        except v.EmptyRadiomapError:
            arcpy.AddIDMessage('ERROR', 250036)
        except gipf_v.MixedSignalDataError:
            arcpy.AddIDMessage('ERROR', 250038)
        except v.PendingEditsError:
            arcpy.AddIDMessage('ERROR', 130144)
        except Exception as any_error:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError(any_error)


if __name__ == "__main__":
    GenerateIndoorPositioningFile().execute()
