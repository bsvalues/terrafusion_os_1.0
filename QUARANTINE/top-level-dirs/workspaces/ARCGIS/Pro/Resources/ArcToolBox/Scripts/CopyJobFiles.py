"""
COPYRIGHT 2019 ESRI

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States.

For additional information, contact:
Environmental Systems Research Institute, Inc.
Attn: Contracts Dept
380 New York Street
Redlands, California, USA 92373

email: contracts@esri.com

---------------------------------------------------------------------------
Source Name:   CopyJobFiles.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Sets the data workspace for the chosen job.
---------------------------------------------------------------------------
"""


# Import required modules
import arcpy
import TopoWorkflowUtilities as utils
import DefenseUtilities
import sys
import os
import shutil
import zipfile
import datetime
import stat
import distutils.dir_util
import ctypes
import socket

def UpdateExtendedProperties(properties, qc_props, source_path, copy_to_path, job, new_folder=False):
    arcpy.AddMessage("Updating Extended Properties")
    try:
        item_url = properties[0]['item_url'].replace(source_path, copy_to_path)
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'item_url': item_url})
    except:
        arcpy.AddWarning('Cannot get extended property item_url from TOPO_PRODUCTION_PROPERTIES table')
    try:
        job_database = properties[0]['current_job_data_path'].replace(source_path, copy_to_path)
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'current_job_data_path': job_database})
    except:
        arcpy.AddWarning('Cannot get extended property current_job_data_path from TOPO_PRODUCTION_PROPERTIES table')
    job.update_property('TOPO_PRODUCTION_PROPERTIES', {'current_job_path': copy_to_path})

    try:
        reviewer_db = qc_props[0]['job_reviewer_db'].replace(source_path, copy_to_path)
        job.update_property('TOPO_QC_PROPERTIES', {'job_reviewer_db': reviewer_db})
    except:
        arcpy.AddWarning('Cannot get extended property job_reviewer_db from TOPO_QC_PROPERTIES table')

    try:
        output_file_path = properties[0]['output_file_path'].replace(source_path, copy_to_path)
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'output_file_path': output_file_path})
    except:
        arcpy.AddWarning('Cannot get extended property output_file_path from TOPO_PRODUCTION_PROPERTIES table')

    try:
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'processing_machine': socket.gethostname()})
    except:
        arcpy.AddWarning('Cannot get extended property processing_machine from TOPO_PRODUCTION_PROPERTIES table')


    if new_folder:
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'shared_job_path': copy_to_path})
    job.job.save()

def CopyExtendedProperties(properties, qc_props, parent_id, database_path, source_path, copy_to_path, qual, new_folder=False):

    conn = None
    parent_job = None
    try:
        if database_path not in ('#', ' ', '') and database_path is not None:
            conn = arcpy.wmx.Connect(database_path)
        else:
            conn = arcpy.wmx.Connect()

        parent_job = conn.getJob(parent_id)
        arcpy.AddMessage("Updating parent job {} properties".format(parent_id))
        p_topo_props = parent_job.getExtendedPropertyTable('{}TOPO_PRODUCTION_PROPERTIES'.format(qual))
        p_qc_props = parent_job.getExtendedPropertyTable('{}TOPO_QC_PROPERTIES'.format(qual))

        item_url = properties[0]['item_url'].replace(source_path, copy_to_path)
        job_database = properties[0]['current_job_data_path'].replace(source_path, copy_to_path)
        try:
            reviewer_db = qc_props[0]['job_reviewer_db'].replace(source_path, copy_to_path)
        except:
            reviewer_db = None
        try:
            output_file_path = properties[0]['output_file_path'].replace(source_path, copy_to_path)
        except:
            output_file_path = None

        p_topo_props['item_url'].data = item_url
        p_topo_props['current_job_data_path'].data = job_database
        p_topo_props['current_job_path'].data = copy_to_path
        p_topo_props['output_file_path'].data = output_file_path

        if reviewer_db is not None:
            p_qc_props['job_reviewer_db'].data = reviewer_db

        if new_folder:
            p_topo_props['shared_job_path'].data = copy_to_path

    except Exception as e:
        target_delete_fail = True
        arcpy.AddWarning('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddWarning("Failed at Line %i" % tb.tb_lineno)
        sys.exit(1)
    finally:
        if parent_job:
            parent_job.save()

def CopyFiles(source_path, copy_to_path):
    arcpy.AddMessage("Copying Files")
    try:
        gdb_paths = []
        target_delete_fail = False
        #walk through the source directories
        for root, dirs, files in os.walk(source_path):
            for direct in dirs:

                # os see .gdbs as a folder, find .gdbs and use copy
                extension = os.path.splitext(direct)[1]
                if extension == '.gdb':
                    source_gdb = os.path.join(root, direct)
                    arcpy.AddMessage("... {}".format(direct))
                    target_gdb = source_gdb.replace(source_path, copy_to_path)
                    gdb_paths.append(source_gdb)

                    if arcpy.Exists(target_gdb):
                        arcpy.Delete_management(target_gdb)
                    arcpy.Copy_management(source_gdb, target_gdb)


                # if a folder exists in the source but not the target, create the folder
                elif not os.path.exists(os.path.join(root.replace(source_path, copy_to_path), direct)):
                    os.makedirs(os.path.join(root.replace(source_path, copy_to_path), direct))

            if not target_delete_fail:
                for f in files:

                    source_file = os.path.join(root, f)
                    target_file = source_file.replace(source_path, copy_to_path)

                    #os sees the content of .gdbs as files.  Ignore files in a .gdb
                    if root not in gdb_paths:
                        arcpy.AddMessage("... {}".format(f))
                        #remove the file if it exists
                        if os.path.exists(target_file):
                            try:
                                os.remove(target_file)
                            except PermissionError as exc:
                                os.chmod(target_file, stat.S_IWUSR)
                                os.remove(target_file)
                        # copy the file
                        shutil.copy(source_file, target_file)

    except Exception as e:
        target_delete_fail = True
        arcpy.AddWarning('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddWarning("Failed at Line %i" % tb.tb_lineno)

    finally:
        return target_delete_fail

def main():
    # Check out licenses
    if DefenseUtilities.licenselevel() == 'Basic' or DefenseUtilities.licenselevel() == 'None':
        raise DefenseUtilities.LicenseException()

    if 'Available' == arcpy.CheckExtension('defense'):
        DefenseUtilities.checkoutextensions(['defense', 'JTX'])
    elif 'Available' == arcpy.CheckExtension('Foundation'):
        DefenseUtilities.checkoutextensions(['Foundation', 'JTX'])
    else:
        raise DefenseUtilities.LicenseException('Tool requires either defense or Foundation extension to run.')

    # Set variables
    job_id = int(arcpy.GetParameterAsText(0))
    source_path = arcpy.GetParameterAsText(1)
    target_path = arcpy.GetParameterAsText(2)
    archive = arcpy.GetParameter(3)
    delete_source = arcpy.GetParameter(4)
    create_job_folder = arcpy.GetParameter(5)
    database_path = arcpy.GetParameterAsText(6)

    # Set temp workspace
    temp_workspace = utils.ScratchWorkspace()

    # Get wmx connection
    connection = None
    try:
        if database_path not in ('#', ' ', '') and database_path is not None:
            connection = utils.WmxConnection(arcpy.wmx.Connect(database_path), temp_workspace)
        else:
            connection = utils.WmxConnection(arcpy.wmx.Connect(), temp_workspace)
    except Exception as e:
        arcpy.AddError(e)
        sys.exit(1)

    try:
        # Get job
        job = utils.Job(connection, job_id)
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 90286, job_id) # Unable to get WMX job with id %1.
        sys.exit(1)

    # Checking job assignment
    try:
        utils.checkuser(connection, job_id)
    except Exception as e:
        arcpy.AddError(e)
        sys.exit(1)

    # Copy Job Files
    # Get the data source name from the production properties
    properties = job.get_properties('TOPO_PRODUCTION_PROPERTIES')
    qc_props = job.get_properties('TOPO_QC_PROPERTIES')

    # Copy files from source to target
    share_path = properties[0]['shared_job_path']
    job_name = job.job.name

    # Determining if process is running from the background processing script or if it is being run by a user
    try:
        background_processing = properties[0]['remote_processing']
    except:
        background_processing = 'False'

    if not archive:
        if os.path.exists(os.path.join(source_path)):
            if source_path != target_path:
                arcpy.AddMessage("Copying Files")
                if target_path != share_path:
                    copy_to_path = os.path.join(target_path, job_name)
                else:
                    if not create_job_folder:
                        copy_to_path = os.path.join(target_path)
                    else:
                        copy_to_path = os.path.join(target_path, job_name)

                # copy the files
                # AB - Because .gdbs have locks use arcpy.Copy to copy.  Use
                # distutils.dir_util.copy_tree(os.path.join(source_path), copy_to_path)

                gdb_paths = []
                #walk through the source directories
                delete_fail = CopyFiles(source_path, copy_to_path)
                if not delete_fail:

                    UpdateExtendedProperties(properties, qc_props, source_path, copy_to_path, job, False)
                    if target_path == share_path:
                        parent_id = job.job.parent
                        qual = connection.configure_fully_qualified_table_prepender()

                        if parent_id:
                            CopyExtendedProperties(properties, qc_props, parent_id, database_path, source_path, copy_to_path, qual, False)

                if delete_fail:
                    copy_to_path = '{}_1'.format(copy_to_path)
                    arcpy.AddMessage('Copying to New Path {}'.format(copy_to_path))
                    if not arcpy.Exists(copy_to_path):
                        arcpy.CreateFolder_management(os.path.dirname(copy_to_path), os.path.basename(copy_to_path))
                    delete_fail = CopyFiles(source_path, copy_to_path)
                    UpdateExtendedProperties(properties, qc_props, source_path, copy_to_path, job, True)
                    parent_id = job.job.parent
                    qual = connection.configure_fully_qualified_table_prepender()
                    if parent_id:
                        CopyExtendedProperties(properties, qc_props, parent_id, database_path, source_path, copy_to_path, qual, True)


    # Determine if archive flag is selected, if so zip files and delete original folder
    if archive:
        arcpy.AddMessage("Archiving Files")
        date = datetime.datetime.today()
        datestamp = f"{date.year}{date.strftime('%m')}{date.strftime('%d')}"
        timestamp = f"{date.strftime('%H')}{date.strftime('%M')}{date.strftime('%S')}"

        completed = True
        task_properties = job.get_properties('TOPO_TASK_PROPERTIES')
        for task in task_properties:
            if task['task_status'] != 10:
                completed = False
        if completed:
            target_path = os.path.join(target_path, 'Completed')
        else:
            target_path = os.path.join(target_path, 'Canceled')

        if not arcpy.Exists(target_path):
            arcpy.CreateFolder_management(os.path.dirname(target_path), os.path.basename(target_path))

        product_name = properties[0]['product_name']
        production_type = properties[0]['production_type_name']
        
        relroot = os.path.abspath(os.path.join(source_path, os.pardir))
        with zipfile.ZipFile(os.path.join(target_path, f'{production_type}_{product_name}_JOB_{job_id}.zip'), 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for root, dirs, files in os.walk(os.path.join(source_path)):
                zip_file.write(root, os.path.relpath(root, relroot))
                for file in files:
                    filename = os.path.join(root, file)
                    if filename.split('.')[-1] != 'lock':
                        if os.path.isfile(filename):
                            arcname = os.path.join(os.path.relpath(root, relroot), file)
                            zip_file.write(filename, arcname)
            zip_file.close()
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'output_file_path': os.path.join(target_path, f'{production_type}_{product_name}_JOB_{job_id}.zip')})


    # Determine if delete_source flag is selected, if so delete source folder
    #AB - Because of locks in file gdb, use arcpy.Delete
    no_delete = []
    if delete_source:
        #shutil.rmtree(os.path.join(source_path))
        # remove files
        if source_path != target_path:
            arcpy.AddMessage("Deleting files")
            gdb_paths = []
            #walk through the source directories
            for root, dirs, files in os.walk(source_path):
                for direct in dirs:

                    # os see .gdbs as a folder, find .gdbs and use delete
                    extension = os.path.splitext(direct)[1]
                    arcpy.AddMessage("... {}".format(direct))
                    if extension == '.gdb':
                        try:
                            if arcpy.Exists(os.path.join(root, direct)):
                                arcpy.Delete_management(os.path.join(root, direct))
                        except:
                            arcpy.AddWarning("Cannot Delete {}".format(os.path.join(root, direct)))
                            no_delete.append(os.path.join(root, direct))
                            pass

                for f in files:
                    source_file = os.path.join(root, f)

                    #os sees the content of .gdbs as files.  Ignore files in a .gdb
                    if root not in gdb_paths:
                        arcpy.AddMessage("... {}".format(f))
                        #remove the file if it exists
                        try:
                            os.remove(source_file)
                        except PermissionError as exc:

                            try:
                                os.chmod(source_file, stat.S_IWUSR)
                                os.remove(source_file)
                            except Exception as e:
                                arcpy.AddWarning(e)
                                no_delete.append(source_file)
                                pass
                        except Exception as e:
                            arcpy.AddWarning(e)
                            no_delete.append(source_file)
                            pass




            #remove any remaining folders
            try:
                shutil.rmtree(os.path.join(source_path))
            except:
                if background_processing == 'True':

                    arcpy.AddWarning("Unable to remove all job files from local machine.  File(s) exist at: {}".format(source_path))
                else:
                    #add warning and popup message
                    #removed popup message - Pro 3.2
                    msg = "Unable to remove all job files from local machine.  File(s) exist at: {}".format(source_path)
                    arcpy.AddWarning(msg)
                    #ctypes.windll.user32.MessageBoxW(0, msg, "Permission Error", 0x30 | 0x0)
                pass

    if len(no_delete) >= 1:
        msg = "Unable to remove all job files from local machine.  File(s) exist at:"
        for val in no_delete:
            msg += " {}".format(val)
        if background_processing == 'True':

            arcpy.AddWarning(msg)
        else:
            #add warning and popup message
            #removed popup message - Pro 3.2
            arcpy.AddWarning(msg)
            #ctypes.windll.user32.MessageBoxW(0, msg, "Permission Error", 0x30 | 0x0)


    # Setting output parameter
    arcpy.SetParameter(7, job_id)


if __name__ == '__main__':
    main()
