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
Source Name:   GetFeaturesByJOBAOI.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Extracts data or creates a replica over the Job AOI Extent.
---------------------------------------------------------------------------
"""


# Import required modules
import arcpy
import TopoWorkflowUtilities as utils
import DefenseUtilities
import sys
import os

def replaceToken(query, job):
    """
    Replaces tokens in the extraction query with the appropriate extended
    property value.  Tokens should have the following format:
        [JOBEX:<table name with no qualifier>.<property name>]

    sample query:
        ((IS_CONFLATE = 1 AND PLTS_COMP_SCALE >= [JOBEX:test.low]) OR
        ((IS_CONFLATE = 0 OR IS_CONFLATE IS NULL) AND
        (PLTS_COMP_SCALE >= [JOBEX:test.low]  AND PLTS_COMP_SCALE) < [JOBEX:test.high])
        AND NIS_PODUCTS IN (1,2)))
    """
    if query and '[JOBEX:' in query.upper():
        while '[JOBEX:' in query.upper():

            #remove any qualifier that currently exists
            token_start = query.upper().find('[JOBEX:')
            token_end = query.upper().find(']', token_start)

            token = query[token_start:token_end+1]


            ex, val = token.split(':')
            table, prop = val.split('.')
            prop = prop.replace(']', '')

            query_properties = job.get_properties(table)
            query_val = query_properties[0][prop]
            if not query_val:
                raise Exception ('Cannot retrieve value for extended property {}'.format(prop))
            query = query.replace(token, str(query_val))

        #arcpy.AddMessage(query)
    return query

# Functions used in this script
def getfeatures(database, rtype, extract, fc_list=[], rels=[]):
    feature_class_dict = {}
    exclude_rels = []

    # rels are just the name of the relationship class.  Walk the
    # relationship class to get the full path
    walk = arcpy.da.Walk(database, datatype="RelationshipClass" )

    for dirpath, dirnames, filenames in walk:
        for filename in filenames:
            if filename.lower() in rels:
                exclude_rels.append(os.path.join(dirpath, filename))


    # walk the database to get a list of feature classes/tables to use as input
    walk = arcpy.da.Walk(database, datatype=['FeatureClass', 'Table'])
    desc = arcpy.Describe(database)
    for root, dirs, features in walk:
        for feature in features:
            fc_name = feature.split('.')[-1].lower()
            #arcpy.AddMessage(fc_name)
            #if the fc_list has values, we want to return only the list of common values
            if len(fc_list) == 0 or fc_name in fc_list:
                # check to ensure feature classes in SDE database have appropriate
                # versioning and global ids required by the chosen replica type
                if desc.workspaceType == 'RemoteDatabase' and extract == 'REPLICATE_DATA':
                    fcdesc = arcpy.Describe(os.path.join(root, feature))
                    versioned = fcdesc.isVersioned
                    if rtype in ['ONE_WAY_REPLICA', 'TWO_WAY_REPLICA', 'ONE_WAY_CHILD_TO_PARENT_REPLICA']:
                        global_id = fcdesc.hasGlobalID
                        if versioned and global_id:
                            feature_class_dict[fc_name] = os.path.join(root, feature)
                    else:
                        if versioned:
                            feature_class_dict[fc_name] = os.path.join(root, feature)
                else:
                    feature_class_dict[fc_name] = os.path.join(root, feature)

    return feature_class_dict, exclude_rels

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

    # # Set variables
    job_id = int(arcpy.GetParameterAsText(0)) # Used for Replica Name
    source_database = arcpy.GetParameterAsText(1)
    target_database = arcpy.GetParameterAsText(2)
    extract = arcpy.GetParameterAsText(3)
    selecting_feature = arcpy.GetParameterAsText(4) # Optional Defaults to JOB AOI
    filter_type = arcpy.GetParameterAsText(5) # Optional Defaults to INTERSECT
    replica_type = arcpy.GetParameterAsText(6) # Optional Defaults to Check out replica
    database_path = arcpy.GetParameterAsText(7) # Optional parameter for jtc

    # Set temp workspace
    temp_workspace = utils.ScratchWorkspace()
    arcpy.env.overwriteOutput = True

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

    try:
        utils.checkuser(connection, job_id)
    except Exception as e:
        arcpy.AddError(e)
        sys.exit(1)

    try:
        # Get Features By JOB AOI
        # Get the data source name from the production properties
        properties = job.get_properties('TOPO_PRODUCTION_PROPERTIES')

        # Getting current_job_data_type
        job_data_type = properties[0]['current_job_data_type']

        #Get Extract Properties that are not exposed in UI
        extract_expand = properties[0]['extract_expand']
        extract_related = properties[0]['extract_replicate_related']
        extract_exclude_rel = properties[0]['extract_excluded_rels']
        extract_query = properties[0]['extract_expression']
        extract_exclude_fc = properties[0]['extract_excluded_fcs']

        # create list of feature classes/table to exclude from tool input
        # split string at ; and make sure value is lower for case sensitivity
        exclude_list_lower = []
        if extract_exclude_fc:
            for val in extract_exclude_fc.split(';'):
                val = val.lower()
                exclude_list_lower.append(val.strip())


        # replace any tokens in extraction query
        if extract_query:
            extract_query = replaceToken(extract_query, job)
            arcpy.AddMessage('Query: {}'.format(extract_query))

        # create a list of relationships to exclude
        rel_list = []
        if extract_exclude_rel:
            rel_list = extract_exclude_rel.lower().split(';')

        # Getting list of full path to feature classes in  target databases
        arcpy.AddMessage("Getting feature classes from database")
        target_feature_dict, target_rels = getfeatures(target_database, replica_type, extract)
        target_fc_list = target_feature_dict.keys()

        # only get the source feature classes that exist in the target and list of full path to excluded relationships
        source_feature_dict, exclude_rels = getfeatures(source_database, replica_type, extract, target_fc_list, rel_list)
        arcpy.AddMessage("Excluded Rels: {}".format(exclude_rels))

        # Filter source_feature_dict by target_feature_dict
        if len(target_feature_dict) > 0:
            reuse = 'REUSE'
        else:
            reuse = 'DO_NOT_REUSE'

        # create the final list of input fcs\tables by removing and exlcuded fcs
        common_dict = {}
        for d_name, d_val in source_feature_dict.items():
            if d_name.lower() not in exclude_list_lower:
                common_dict[d_name] = d_val

        #arcpy.AddMessage("Extract FCs: {}".format(common_dict.keys()))

        # Getting JOB_AOI and selecting AOI for processing
        if selecting_feature in ('#', ' ', '') or selecting_feature is None:
            job_aoi = arcpy.wmx.GetJobAOI(job_id, 'JOB_AOI', database_path)
        else:
            arcpy.management.Dissolve(selecting_feature, 'in_memory/Dissolve_AOI')
            job_aoi = arcpy.management.SelectLayerByAttribute('in_memory/Dissolve_AOI', 'NEW_SELECTION')


        if len(common_dict) > 0:
            parent = str(job.job.parent)

            extract_string = ''
            for value in common_dict.values():
                extract_string += f"\'{value}\' USE_FILTERS;"
            extract_string = extract_string.rstrip(';')

            #arcpy.AddMessage(extract_string)

            # Run either replicate or extract
            if extract == 'EXTRACT_DATA':

                arcpy.AddMessage("Extracting Data")
                job_data_type = 2
                arcpy.topographic.ExtractDataByFeature(extract_string, target_database, reuse, job_aoi, filter_type, 'DO_NOT_CHECKOUT_REPLICA', "",
                                                        extract_expand, extract_related, exclude_rels, extract_query)
                arcpy.AddMessage(arcpy.GetMessages())

            elif extract == 'REPLICATE_DATA':
                if replica_type == 'CHECK_OUT':

                    arcpy.AddMessage('Creating Check Out Replica')
                    job_data_type = 3
                    arcpy.topographic.ExtractDataByFeature(extract_string, target_database, reuse, job_aoi, filter_type, 'CHECKOUT_REPLICA', f'JOB_{parent}',
                                                            extract_expand, extract_related, exclude_rels, extract_query)
                    arcpy.AddMessage(arcpy.GetMessages())

                elif replica_type in ['TWO_WAY_REPLICA', 'ONE_WAY_REPLICA', 'ONE_WAY_CHILD_TO_PARENT_REPLICA']:
                    arcpy.AddMessage("Replicating Data")
                    if replica_type == 'TWO_WAY_REPLICA':
                        job_data_type = 4
                    elif replica_type == 'ONE_WAY_REPLICA':
                        job_data_type = 5
                    elif replica_type == 'ONE_WAY_CHILD_TO_PARENT_REPLICA':
                        job_data_type = 6
                    replicate_string = ''
                    for value in common_dict.values():
                        replicate_string += f"\'{value}\';"
                    replicate_string = replicate_string.rstrip(';')
                    arcpy.management.CreateReplica(in_data=replicate_string, in_type=replica_type, out_geodatabase=target_database,
                                                   out_name=f'JOB_{parent}', access_type='FULL', initial_data_sender='PARENT_DATA_SENDER',
                                                   expand_feature_classes_and_tables='USE_DEFAULTS', reuse_schema=reuse,
                                                   get_related_data='DO_NOT_GET_RELATED', geometry_features=job_aoi)
                    arcpy.AddMessage(arcpy.GetMessages())
            else:
                arcpy.AddError("Invalid Extract Operation.")

            # # Updating extended properties
            job.update_property('TOPO_PRODUCTION_PROPERTIES',
                                {'current_job_data_path': target_database, 'current_job_data_type': job_data_type})

        else:
            arcpy.AddError('There are no features to process. Please make sure that your database is versioned.')
            sys.exit(1)

        # Setting output parameter
        arcpy.SetParameter(8, target_database)
    except Exception as e:
        arcpy.AddError(e)
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
        sys.exit(1)
    finally:
        if arcpy.Exists('JOB_AOI'):
            arcpy.management.Delete('JOB_AOI')


if __name__ == '__main__':
    main()
