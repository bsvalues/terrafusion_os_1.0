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
Source Name:   SetProductionProperties.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Updates production properties of a job.
---------------------------------------------------------------------------
"""
# Import required modules
import arcpy
import sys
import os
import shutil
import TopoWorkflowUtilities as utils
import DefenseUtilities
import TopographicGeneralizationUtilities as gen


def getRelated(database, index_fc_name):
    """ get relationship classes linked to index fc """
    related_items = []
    related_to_index = []

##    arcpy.AddMessage("Index: {}".format(index_fc_name.lower()))

    walk = arcpy.da.Walk(database, datatype="RelationshipClass")

    for dirpath, dirnames, filenames in walk:
        for filename in filenames:
            keep = False

##            arcpy.AddMessage("Rel: {}".format(filename))
            desc = arcpy.Describe(os.path.join(dirpath, filename))
            dests = desc.destinationClassNames
            origs = desc.originClassNames
            rel_classes = list(dests + origs)
##            arcpy.AddMessage('{}'.format(rel_classes))
            for dest in rel_classes:
                dest = dest.lower()
##                arcpy.AddMessage('compare {}'.format(dest))
                if index_fc_name.lower() in dest:
                    keep = True
                else:
                    related_items.append(os.path.join(dirpath, dest))
            if keep:
                related_to_index.extend(related_items)

    related_to_index = list(set(related_to_index))
    arcpy.AddMessage("Related tables: {}".format(related_to_index))
    return related_to_index


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

    if 'Available' == arcpy.CheckExtension('DataReviewer'):
        DefenseUtilities.checkoutextensions(['DataReviewer'])
    else:
        raise DefenseUtilities.LicenseException('Tool requires a Data Reviewer license')

    # Set variables
    job_id = int(arcpy.GetParameterAsText(0))
    database_path = arcpy.GetParameterAsText(1)

    # Set temp workspace
    temp_workspace = utils.ScratchWorkspace()
    arcpy.env.overwriteOutput = True

    try:
        """ --- Connect to WMX and get Job --- """
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

        # Get job
        job = None
        try:
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

        qual = connection.table_name_prepender

        """ Get Production Properties values and copy to other tables"""
        extProp = 'production_type_name'
        production = utils.ProductionProperties(connection, job.get_property('TOPO_PRODUCTION_PROPERTIES', extProp))

        if not production.production_type:
            arcpy.AddIDMessage('ERROR', 90291, extProp)
            sys.exit(1)

        if len(production.prod_properties) < 1:
            arcpy.AddIDMessage('ERROR', 90292)
            sys.exit(1)

        '''
        Topo_Production_Type & Topo_Production_Properties tables require common field names for the production properties
        that need to be copied over by this tool.
        '''

        # determine the property tables associated with the job

        desc = connection.wmx_connection.config.getJobTypeDescription(job.job.jobTypeID)
        prop_tables_list = list(desc.extendedProperties.keys())
        prop_tables = []
        for table in prop_tables_list:
            # ignore the task tables as these properties are set in the Set Task List tool
            if 'TOPO_TASK_PROPERTIES' not in table.upper() and 'TOPO_TASK_GROUP_PROPERTIES' not in table.upper():
                table = table.upper()
                table = table.replace(connection.table_name_prepender.upper(), '')
                prop_tables.append(table)

        #arcpy.AddMessage(prop_tables)

        # for each property table copy the common values
        for prop_table in prop_tables:
            #arcpy.AddMessage(prop_table)
            ext_properties = job.get_properties(prop_table)
            if len(ext_properties) > 0:
                # Update production properties for job
                for key, value in ext_properties[0].items():
                    if key in production.prod_properties:
##                        arcpy.AddMessage('... update {}'.format(key))
                        ext_properties[0][key] = production.prod_properties[key]
                job.update_property(prop_table, ext_properties[0])

        """ ---- Determine product name from map index --- """
        job_production_properties = job.get_properties('TOPO_PRODUCTION_PROPERTIES')
        carto_properties = job.get_properties('TOPO_CARTO_PROPERTIES')
        map_index = carto_properties[0]['map_index_path']
        orig_map_index = map_index
        name_field = carto_properties[0]['map_index_field']

        # Getting JOB_AOI for processing
        aoi_layer = arcpy.GetJobAOI_wmx(job_id, r'in_memory/LOI_Layer', database_path)
        aoi_name = None

        # Getting map index from extended properties
        processing_aoi = aoi_layer
        if map_index and arcpy.Exists(map_index):
            arcpy.AddMessage("Getting Product Name")
            if name_field and name_field != '':
                map_index_layer = arcpy.management.MakeFeatureLayer(map_index, 'Index_Features')
                aoi_name = None
                processing_aoi, out_layer, count = arcpy.management.SelectLayerByLocation(map_index_layer, 'ARE_IDENTICAL_TO', aoi_layer, "", 'NEW_SELECTION')
                if int(count) == 1:
                    #arcpy.AddMessage("AOI Exact Match")
                    aoi_names = [row[0] for row in arcpy.da.SearchCursor(processing_aoi, name_field)]
                    aoi_name = aoi_names[0]

                else:
                    #try using intersection
                    intersect_table = arcpy.analysis.TabulateIntersection(aoi_layer, "OBJECTID", map_index, r"in_memory/JobAOI_TabulateIntersection", name_field, None, None, "UNKNOWN")
                    highest_percent = 95
                    with arcpy.da.SearchCursor(intersect_table, [name_field, 'PERCENTAGE']) as cursor:
                        for row in cursor:
                            if row[1] > highest_percent:
                                aoi_name = row[0]
                                highest_percent = row[1]
                    if aoi_name:
                        #arcpy.AddMessage("AOI {} Percent Match".format(highest_percent))
                        query = gen.MakeWhereClause(map_index_layer, name_field, aoi_name, '=')
                        # the layer with the select set is used when create the AOI fc in the target database
                        # reset the selection on the layer
                        processing_aoi = arcpy.SelectLayerByAttribute_management(map_index_layer, 'NEW_SELECTION', query)

                if not aoi_name:
                    aoi_name = "Custom"

                job.update_property('TOPO_PRODUCTION_PROPERTIES', {'product_name': aoi_name})
                arcpy.AddMessage("Product name: {}".format(aoi_name))


        """ ---- Update Job Name --- """
        job_name = str(job.job.name)

        if job_name in ('', ' ') or job_name is None:
            job_name = f'JOB_{job_id}'

        if aoi_name and aoi_name.replace(' ', '_') not in job_name:
            job_name = f'{aoi_name}_{job_name}'.replace(' ', '_')

        if production.production_type.replace(' ', '_') not in job_name:
            job_name = f'{production.production_type}_{job_name}'.replace(' ', '_')

        job.job.name = job_name
        job.job.save()


        """ --- Create Job artifacts folder and copy files --- """
        intersect_sel, buffer_aoi, final_intersect = '', '', ''


        if len(job_production_properties) > 0:
            # Get Root and create (Parent) JOB_ID folder
            root_folder = job_production_properties[0]['shared_root_path']
            job_folder = os.path.join(f'{root_folder}', f'{job_name}')
            if arcpy.Exists(job_folder):
                arcpy.Delete_management(job_folder)
            arcpy.CreateFolder_management(root_folder, job_name)

            # Get product files and copy necessary files to root
            product_file_path = job_production_properties[0]['product_file_path']
            if product_file_path not in ('', ' ') and product_file_path is not None:
                for item in os.listdir(product_file_path):
                    src = os.path.join(product_file_path, item)
                    dst = os.path.join(job_folder, item)
                    if arcpy.Exists(dst):
                        arcpy.management.Delete(dst)
                    if os.path.isdir(src):
                        try:
                            shutil.copytree(src, dst, False, None)
                        except Exception as exc:
                            if '[Errno 13] Permission denied' in str(exc):
                                try:
                                    if item.endswith('.gdb'):
                                        if arcpy.Exists(dst):
                                            arcpy.Delete_management(dst)
                                        arcpy.Copy_management(src, dst)
                                    else:
                                        arcpy.AddWarning("{}.  File will not be copied to job directory.".format(exc))
                                except:
                                    arcpy.AddWarning("{}.  File will not be copied to job directory.".format(exc))
                            else:
                                arcpy.AddError(exc)
                                sys.exit(1)

                    else:
                        try:
                            shutil.copy2(src, dst)
                        except Exception as exc:
                            if '[Errno 13] Permission denied' in str(exc):
                                try:
                                    if item.endswith('.gdb'):
                                        if arcpy.Exists(dst):
                                            arcpy.Delete_management(dst)
                                        arcpy.Copy_management(src, dst)
                                    else:
                                        arcpy.AddWarning("{}.  File will not be copied to job directory.".format(exc))
                                except:
                                    arcpy.AddWarning("{}.  File will not be copied to job directory.".format(exc))
                            else:
                                arcpy.AddError(exc)
                                sys.exit(1)


            """ ---- Copy schema database to Geodatabases folder and rename --- """
            #if no schema database create empty gdb
            if not os.path.exists(os.path.join(job_folder, 'Geodatabases')):
                os.mkdir(os.path.join(job_folder, 'Geodatabases'))

            gdb_name = production.prod_properties['schema_database_name']
            for root, dirs, files in os.walk(job_folder):
                for d in dirs:
                    if d == f"{gdb_name}.gdb":
                        if not os.path.exists(os.path.join(job_folder, 'Geodatabases', f'{job_name}.gdb')):
    ##                        shutil.copytree(os.path.join(root, d), os.path.join(job_folder, 'Geodatabases', f'{job_name}.gdb'))
                            arcpy.Copy_management(os.path.join(root, d), os.path.join(job_folder, 'Geodatabases', f'{job_name}.gdb'))
                            arcpy.management.Delete(os.path.join(root, d))
            if not os.path.exists(os.path.join(job_folder, 'Geodatabases', f'{job_name}.gdb')):
                arcpy.management.CreateFileGDB(os.path.join(job_folder, 'Geodatabases'), f'{job_name}.gdb', 'CURRENT')
            """ --- Create Reviewer Workspace --- """
            wksp = arcpy.management.CreateFileGDB(os.path.join(job_folder, 'Geodatabases'), f'ReviewerWorkspace_JOB_{job_id}.gdb', 'CURRENT')
            arcpy.reviewer.EnableDataReviewer(wksp)

            """ Copy and rename job map or layout --- """
            # Update item_url property if we find mapx or pagx
            # If mapx/mxd, set name to JobTemplate. If pagx, name after job
            item_name = job_production_properties[0]['item_name']
            map_copied = False
            for root, dirs, files in os.walk(job_folder):
                for f in files:
                    if item_name in f:
                        if f.split('.')[-1] in ['mxd', 'mapx', 'pagx']:
                            map_copied = True
                            if not os.path.exists(os.path.join(job_folder, 'Maps', f"JobTemplate.{f.split('.')[-1]}")) and not os.path.exists(os.path.join(job_folder, 'Maps', f"{job_name}.{f.split('.')[-1]}")) :
                                if not os.path.exists(os.path.join(job_folder, 'Maps')):
                                    os.mkdir(os.path.join(job_folder, 'Maps'))
                                if f.split('.')[-1] in ['mxd', 'mapx']:
                                    shutil.copy2(os.path.join(root, f), os.path.join(job_folder, 'Maps', f"JobTemplate.{f.split('.')[-1]}"))
                                    job.update_property('TOPO_PRODUCTION_PROPERTIES', {'item_url': os.path.join(job_folder, 'Maps', f"JobTemplate.{f.split('.')[-1]}")})
                                elif f.split('.')[-1] == 'pagx':
                                    shutil.copy2(os.path.join(root, f), os.path.join(job_folder, 'Maps', f"{job_name}.{f.split('.')[-1]}"))
                                    job.update_property('TOPO_PRODUCTION_PROPERTIES', {'item_url': os.path.join(job_folder, 'Maps', f"{job_name}.{f.split('.')[-1]}")})
                                os.remove(os.path.join(root, f))
            if not map_copied:
                item_url = job_production_properties[0]['item_url']
                if not os.path.exists(os.path.join(job_folder, 'Maps')):
                    os.mkdir(os.path.join(job_folder, 'Maps'))
                if f.split('.')[-1] in ['mxd', 'mapx']:
                    shutil.copy2(item_url, os.path.join(job_folder, 'Maps', f"JobTemplate.{item_url.split('.')[-1]}"))
                    job.update_property('TOPO_PRODUCTION_PROPERTIES', {'item_url': os.path.join(job_folder, 'Maps', f"JobTemplate.{item_url.split('.')[-1]}")})
                elif f.split('.')[-1] == 'pagx':
                    shutil.copy2(item_url, os.path.join(job_folder, 'Maps', f"{job_name}.{item_url.split('.')[-1]}"))
                    job.update_property('TOPO_PRODUCTION_PROPERTIES', {'item_url': os.path.join(job_folder, 'Maps', f"{job_name}.{item_url.split('.')[-1]}")})


        """---  Copy AOI and Indexes--- """
        # Getting JOB_AOI for processing
        in_database = os.path.join(job_folder, 'Geodatabases', f'{job_name}.gdb')
        job_aoi = os.path.join(in_database, r'JobAOI')
        if not arcpy.Exists(job_aoi):
            try:
                if aoi_name != "Custom":
                    arcpy.CopyFeatures_management(processing_aoi, os.path.join(in_database, r'JobAOI'))
                else:
                    arcpy.CopyFeatures_management(aoi_layer, os.path.join(in_database, r'JobAOI'))
            except:
                arcpy.CopyFeatures_management(aoi_layer, os.path.join(in_database, r'JobAOI'))

        #save a layer file with the AOI selected
        job_aoi_lyr = arcpy.MakeFeatureLayer_management(job_aoi, 'JobAOI_Layer')
        arcpy.SelectLayerByAttribute_management(job_aoi_lyr, 'NEW_SELECTION')
        arcpy.SaveToLayerFile_management(job_aoi_lyr, os.path.join(job_folder, 'Geodatabases', 'JobAOI.lyrx'), 'RELATIVE')

        # Getting map index from extended properties
        map_index = carto_properties[0]['map_index_path']
        if map_index is not None:
            if arcpy.Exists(map_index):
                fc_name = (os.path.split(map_index)[-1]).split('.')[-1]

                # Copy map index feature class to carto database
                arcpy.AddMessage("Copying Map Sheet Index {}".format(map_index))
                copied_index = os.path.join(in_database, 'Job_{}'.format(fc_name))
                if arcpy.Exists(copied_index):
                    arcpy.AddMessage("Output feature class {} already exists.  Feature class will be deleted and replaced".format(copied_index))
                    arcpy.Delete_management(copied_index)

                intersect_sel = arcpy.management.SelectLayerByLocation(map_index_layer, 'INTERSECT', job_aoi_lyr, '', 'NEW_SELECTION').getOutput(0)
                second_intersect = arcpy.management.SelectLayerByLocation(map_index_layer, 'INTERSECT', intersect_sel, '', 'NEW_SELECTION').getOutput(0)
                buffer_aoi = arcpy.analysis.Buffer(second_intersect, r'in_memory/buffered_index', '100 Kilometers', 'FULL', 'FLAT', 'ALL').getOutput(0)
                final_intersect, names, sel_cnt = arcpy.management.SelectLayerByLocation(map_index_layer, 'INTERSECT', buffer_aoi, '', 'NEW_SELECTION')
                arcpy.AddMessage("Index copying {} features to: {}".format(sel_cnt, copied_index))

                arcpy.management.CopyFeatures(map_index_layer, copied_index)

                job.update_property('TOPO_CARTO_PROPERTIES', {'map_index_path': copied_index})

        """ --- Copy matching attributes from job aoi and map index related objects to extended properties --- """
        aoi_properties = {}
        # get a list of property values from the aoi fc
        with arcpy.da.SearchCursor(job_aoi, '*') as cur:
            f_names = cur.fields
            for row in cur:
                for f_name in f_names:
                    try:
                        if f_name.lower() not in ['job_id', 'objectid', 'shape', 'shape_area', 'shape_length']:
                            aoi_properties[f_name.lower()] = row[f_names.index(f_name)]
                    except Exception as e:
                        arcpy.AddWarning('Unable to copy value of {} as data types do not match'.format(f_name.lower()))

        #get map index database path - may be in feature dataset
        if orig_map_index:
            desc = arcpy.Describe(orig_map_index)
            orig_name = desc.baseName.split('.')[-1]
            while desc.dataType.upper() != 'WORKSPACE':
                desc = arcpy.Describe(desc.path)

            # get list of related tables
            rels = getRelated(desc.catalogPath, orig_name)
            if len(rels) >= 1:
                #arcpy.AddMessage('rels {}'.format(rels))

                # build a query to get only the records related to the job aoi
                if name_field.lower() in aoi_properties:
                    row_val = aoi_properties[name_field.lower()]
                else:
                    row_val = job_production_properties[0]['product_name']
                query = gen.MakeWhereClause(orig_map_index, name_field, row_val, '=')
    ##            arcpy.AddMessage(query)

                for rel_path in rels:
                    try:
                        # for each related table get the attributes from the related feature
                        # using try in cause query is bad
                        with arcpy.da.SearchCursor(rel_path, '*', query) as cur:
                            f_names = cur.fields
                            for row in cur:
                                for f_name in f_names:
                                    f_lower = f_name.lower()
                                    if f_lower not in ['job_id', 'objectid', 'shape', 'shape_area', 'shape_length', name_field.lower()]:
                                        if f_lower not in aoi_properties:
                                            aoi_properties[f_lower] = row[f_names.index(f_name)]
                    except:
                        # likely failure will happen if query name field does not exist in related table
                        # skip getting properties
                        pass

            favor_aoi = production.prod_properties['favor_aoi_properties']
            for prop_table in prop_tables:
                arcpy.AddMessage(prop_table)
                ext_properties = job.get_properties(prop_table)
                if len(ext_properties) > 0:
    ##                arcpy.AddMessage('{} properties'.format(len(ext_properties)))
                    # Update extended properties for common values with aoi and related tables
                    for key, value in aoi_properties.items():
    ##                    arcpy.AddMessage(key)
                        if key in ext_properties[0]:
                            arcpy.AddMessage('... update {}'.format(key))
                            if favor_aoi == 1:
                                ext_properties[0][key] = value
                            else:
                                if ext_properties[0][key] is None or ext_properties[0][key] == 'None' or ext_properties[0][key] == 'Null' or ext_properties[0][key] == '<Null>' or ext_properties[0][key] == '' or ext_properties[0][key] == ' ':
                                    ext_properties[0][key] = value

                    try:
                        job.update_property(prop_table, ext_properties[0])
                    except Exception as e:
                        arcpy.AddWarning('Unable to copy value of from aoi to {} because some attribute data types do not match'.format(prop_table))
        else:
            arcpy.AddWarning('Unable to copy values from aoi to because AOI feature class has not been defined')

        """ --- Update share_path and current_path (set to (Parent) JOB_ID folder) --- """
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'shared_job_path': job_folder, 'current_job_path': job_folder})
        try:
            job.update_property('TOPO_QC_PROPERTIES', {'job_reviewer_db': os.path.join(job_folder, 'Geodatabases', f'ReviewerWorkspace_JOB_{job_id}.gdb')})
        except:
            pass

        # Setting output parameter
        arcpy.SetParameter(2, job_id)

    except Exception as e:
        arcpy.AddError(e)
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
##finally:
### Delete temp features
##    for temp in [r'in_memory/Index', r'in_memory/job_aoi', intersect_sel, buffer_aoi, final_intersect]:
##        if arcpy.Exists(temp):
##            try:
##                arcpy.Delete_management(temp)
##            except:
##                pass

if __name__ == '__main__':
    main()
