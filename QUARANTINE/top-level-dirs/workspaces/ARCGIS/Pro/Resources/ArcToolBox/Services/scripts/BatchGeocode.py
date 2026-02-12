__author__ = 'vict7669'
import arcpy
import gcutils
import json
import os
import hostedgp
import aolutils
import time
import rendererUtils
import sys
import requests


###Constants used in Debugging
DEBUG = False
ANALYZE_TASK_NAME = "AnalyzeGeocodeInput"
TASK_NAME = "BatchGeocode"
handled_error_codes = list(gcutils.BatchGeocode.ERROR_CODES.keys())
handled_error_codes_analyze = list(gcutils.Analyze.ERROR_CODES.keys())

inputs_dict = {
    'analyze_obj': 0,
    'portal_table': 3,
    'portal_file': 4,
    'output_location': 11,
    'output_file_type': 2,
    'service_url': 1,
    'source_country': 5,
    'category': 6,
    'output_fields': 7,
    'header_rows_to_skip': 8,
    'output_name': 9,
    'context': 10,
    'locator_parameters': 12,
    'geocoding_stats': 13
}

# Take in user input
analyze_object = arcpy.GetParameterAsText(inputs_dict['analyze_obj'])

portal_table = arcpy.GetParameterAsText(inputs_dict['portal_table'])

portal_file = arcpy.GetParameterAsText(inputs_dict['portal_file'])

output_location = arcpy.GetParameterAsText(inputs_dict['output_location'])

source_country = arcpy.GetParameterAsText(inputs_dict['source_country'])

category = arcpy.GetParameterAsText(inputs_dict['category'])

output_file_type = arcpy.GetParameterAsText(inputs_dict['output_file_type'])

orig_service_url = arcpy.GetParameterAsText(inputs_dict['service_url'])

output_fields = arcpy.GetParameterAsText(inputs_dict['output_fields'])

header_rows_to_skip = arcpy.GetParameterAsText(inputs_dict['header_rows_to_skip'])

output_name = arcpy.GetParameterAsText(inputs_dict['output_name'])

context = arcpy.GetParameterAsText(inputs_dict['context'])

locator_parameters = arcpy.GetParameterAsText(inputs_dict['locator_parameters'])

# needed for the Analyze class
locale = ''

# check for *all* out fields. If its all out fields, act differently elsewhere for rematch
all_output_fields = False
if output_fields == "" or output_fields == "*":
    all_output_fields = True

if not portal_table and not portal_file:
    err = "Empty inputTable and empty inputFileItem. Enter either an inputTable or inputFileItem."
    aolutils.AddErrorCode(100253, err)
    raise arcpy.ExecuteError

try:
    analyze_json = json.loads(analyze_object)
except Exception as e:
    msg_params = dict(paramName="geocodeParameters")
    err = "Invalid expression for {paramName}, malformed JSON."
    aolutils.AddErrorCode(100245, err, msg_params)

try:
    location_value = ""
    if locator_parameters:
        locations_json = json.loads(locator_parameters)
        if "locationType" in locations_json:
            location_value = locations_json["locationType"]
        if "sourceCountry" in locations_json:
            source_country = locations_json["sourceCountry"]
        if "category" in locations_json:
            category = locations_json["category"]

except Exception as e:
    #arcpy.AddMessage("exception is {}".format(e))
    msg_params = dict(paramName="locationType")
    err = "Invalid expression for {paramName}, malformed JSON."
    aolutils.AddErrorCode(100245, err, msg_params)

try:
    service_json = json.loads(orig_service_url)
    orig_service_url = service_json["url"]
except:
    # Giving the user the option to pass it as a json
    pass

if "geocodeserver" not in orig_service_url.lower():
    msg_params = dict(paramName=orig_service_url)
    err = "Invalid locator service URL: {paramName}."
    aolutils.AddErrorCode(100171, err, msg_params)

if orig_service_url[-1] == "/":
    orig_service_url = orig_service_url[:-1]

if orig_service_url.lower().endswith("geocodeserver"):
    service_name = ""
    input_service_url = orig_service_url
    url_to_save = input_service_url
else:
    # REST Address locator coming from pro, we need to preserve the
    # locator's name for rematch later.
    index_of_rest = orig_service_url.lower().find('geocodeserver')
    cutoff_index = index_of_rest + 14
    service_name = orig_service_url[cutoff_index:]
    input_service_url = orig_service_url[:cutoff_index - 1]
    url_to_save = input_service_url

#arcpy.AddMessage(input_service_url)
#arcpy.AddMessage(service_name)

try:
    file_type = analyze_json['file_type']
except Exception as e:
    err = "Your geocodeParameters is not formatted correctly"
    aolutils.AddErrorCode(100240, err)
    raise arcpy.ExecuteError

if file_type == 'txt':
    try:
        delimiter = analyze_json['column_delimiter']
        qualifier = analyze_json['text_qualifier']
        header_row_exists = analyze_json['header_row_exists']
        fixed_width = analyze_json['fixed_width']
        widths_of_columns = analyze_json['width_of_cols']
        chars_per_row = analyze_json['chars_per_row']
        field_names = analyze_json['column_names']
        field_mapping = analyze_json['field_mapping']
        field_info = analyze_json['field_info']

    except Exception as e:
        err = "Your geocodeParameters is not formatted correctly"
        aolutils.AddErrorCode(100240, err)
        raise arcpy.ExecuteError

else:
    try:
        delimiter = analyze_json['column_delimiter']
        qualifier = analyze_json['text_qualifier']
        header_row_exists = analyze_json['header_row_exists']
        # fixed_width = analyze_json['fixed_width']
        # widths_of_columns = analyze_json['width_of_cols']
        # chars_per_row = analyze_json['chars_per_row']
        field_names = analyze_json['column_names']
        field_mapping = analyze_json['field_mapping']
        field_info = analyze_json['field_info']
        fixed_width = ""
        widths_of_columns = ""
        chars_per_row = ""

    except Exception as e:
        err = "Your geocodeParameters is not formatted correctly"
        aolutils.AddErrorCode(100240, err)
        raise arcpy.ExecuteError



# Because we are reading something from portal, let's initialize our hostedgp instance
try:
    context_json = json.loads(context)
except ValueError:
    pass
    # arcpy.AddMessage('WARNING: Your context JSON is empty or not properly formatted JSON')

if portal_file and portal_table:
    err = 'You cannot submit both a table and a file, please submit only one.'
    aolutils.AddErrorCode(100234, err)
    raise arcpy.ExecuteError


# Initialize hostedgp
hosted_gp = hostedgp.HostedGP(inputs_dict['context'],inputs_dict['output_name'])
output_hosted_name = hosted_gp.GetOutputName(inputs_dict['output_name'])
# check publishing privilege
# aolutils.checkPublishingPrivilege(hosted_gp, output_hosted_name)
# check geocoding privilege
#aolutils.checkPrivilege("portal:user:geocode", hosted_gp)

portal_self_json = json.loads(hosted_gp.GetSelf())


# If both service description and geocodeAddresses calls don't give a 499 error,
# then service is completely unsecure. No need to get server token in that case
try:
    input_service_url = aolutils.getPrivateServiceURL(hosted_gp, input_service_url)
    service_secure = gcutils.token_check(input_service_url)
except Exception as err:
    msg_dict = dict(service_url=input_service_url)
    msg = "Invalid locator service URL: {service_url}. Make sure proxy items are shared with Everyone.".format(**msg_dict)
    aolutils.AddErrorCode(100172, msg)
    raise arcpy.ExecuteError

if service_secure == "error":
    msg_dict = dict(service_url=input_service_url)
    msg = "Invalid locator service URL: {service_url}. Make sure proxy items are shared with Everyone.".format(**msg_dict)
    aolutils.AddErrorCode(100172, msg)
    raise arcpy.ExecuteError

if service_secure:
    try:
        token, referer = hosted_gp.GetServerToken(input_service_url,120)
    
    except Exception as err:
        msg_dict = dict(service_url=input_service_url)
        msg = "Invalid locator service URL: {service_url}.".format(**msg_dict)
        aolutils.AddErrorCode(100171, msg)
        raise arcpy.ExecuteError

else:
    token = None
    referer = None

#arcpy.AddMessage("token is {}".format(token))

# determine number of threads to use
# Some AGOL regex logic for later...
# try:
#     num_threads = analyze_json['num_threads']
#
# except Exception as e:
#     # optional parameter from service
#     pass
# owning_system = hosted_gp.GetOwningSystem()
# # define a couple of regular expressions
# agol_hostname = re.compile("\w*.arcgis.com\.*",re.IGNORECASE)
# agol_service = re.compile('\w*geocode\w*.arcgis.com\.*',re.IGNORECASE)

# Do a quick privilege check
try:
    if output_file_type == "Feature Service":
        aolutils.checkPublishingPrivilege(hosted_gp, output_hosted_name)
except Exception as e:
    msg = "Your user role doesn't include the geocode privilege."
    aolutils.AddErrorCode(100232, msg)
    raise arcpy.ExecuteError
try:
    if output_file_type == "csv" or output_file_type == "xls":
        has_priv = aolutils.checkPrivilege("portal:user:createItem", hosted_gp)
        if not has_priv:
            msg = "Your user role doesn't include the create items privilege"
            aolutils.AddErrorCode(100173, msg)
            raise arcpy.ExecuteError
except Exception as e:
    msg = "Your user role doesn't include the geocode privilege."
    aolutils.AddErrorCode(100232, msg)
    raise arcpy.ExecuteError

### Comment out this section since proxy services
### are supported in Python3
# try:
#     # Check for a proxy shared with org. If proxy is shared with just org, we have a problem. Throw an error.
#     search_dict = {"q":"url:{}".format(input_service_url)}
#     search_results_json = hosted_gp.GenericSharingRequest("search",search_dict)
#     # service proxies must be public!!
#     if "Service Proxy" in search_results_json['results'][0]['typeKeywords']:
#         if search_results_json['results'][0]['access'] != "public":
#             msg_dict = {"service_url": input_service_url}
#             msg = "Invalid locator service URL: {service_url}.".format(**msg_dict)
#             aolutils.AddErrorCode(100171, msg, msg_dict)
#             raise arcpy.ExecuteError

# except Exception as err:
#     try:
#         # Check for a proxy shared with org. If proxy is shared with just org, we have a problem. Throw an error.
#         search_dict = {"q":"url:{}".format(input_service_url.lower())}
#         search_results_json = hosted_gp.GenericSharingRequest("search",search_dict)
#         # service proxies must be public!!
#         if "Service Proxy" in search_results_json['results'][0]['typeKeywords']:
#             if search_results_json['results'][0]['access'] != "public":
#                 msg_dict = {"service_url": input_service_url}
#                 msg = "Invalid locator service URL: {service_url}.".format(**msg_dict)
#                 aolutils.AddErrorCode(100171, msg, msg_dict)
#                 raise arcpy.ExecuteError
#     except Exception as err:
#         pass

# arcpy.AddMessage(search_results_json)
# sys.exit()

# Check for the output name and make sure it's not already taken
# if output_name:
#     output_name_json = json.loads(output_name)
#     try:
#         output_name_just_name = output_name_json["serviceProperties"]['name']
#     except KeyError:
#         try:
#             output_name_just_name = output_name_json["itemProperties"]['title']
#         except KeyError:
#             msg = "Output Name is not formatted correctly"
#             aolutils.AddErrorCode(100231, msg)
#             sys.exit()
#
# search_dict_name = {"name":output_name_just_name,"type":"CSV","f":"json"}
# search_results_json_name = hosted_gp.GenericSharingRequest("isServiceNameAvailable",search_dict_name)
# arcpy.AddMessage(search_results_json_name)


concurrent_batches = 1
record_limit = False
max_records = 0

try:
    geocode_helper_services = portal_self_json['helperServices']['geocode']

    for geocoder in geocode_helper_services:
        if geocoder['url'] == input_service_url:
            concurrent_batches = geocoder['numBatchThreads']

except Exception as e:
    concurrent_batches = 1

# arcpy.AddMessage('concurrent_batches is {}'.format(concurrent_batches))
    # try:
    #     scratch_folder = arcpy.env.scratchFolder
    #     resource_file_from_portal = os.path.join(scratch_folder,'resource_file.json')
    #     resource_file_json = hosted_gp.GetResource("batchGeocodingProperties",resource_file_from_portal)
    #     with open(resource_file_from_portal) as json_file:
    #         thread_info = json.load(json_file)
    #
    #     for service_entry in thread_info:
    #         if service_url[:-17] == service_entry["url"]:
    #             concurrent_batches = service_entry["numThreads"]
    # except Exception:
    #     concurrent_batches = 1

try:
    input_service_url = aolutils.getPrivateServiceURL(hosted_gp, input_service_url)

except Exception as err:
    msg_dict = dict(service_url=input_service_url)
    msg = "Invalid locator service URL: {service_url}.".format(**msg_dict)
    aolutils.AddErrorCode(100171, msg)
    raise arcpy.ExecuteError


service_url = input_service_url + '/geocodeAddresses'

if portal_table:
    # Then we need to get a hosted table or layer
    # Read the inputs

    # json.dumps(portal_table)
    try:
        in_table = hosted_gp.GetHostedLayer(inputs_dict['portal_table'])
    except Exception:
        err = "This input table is invalid. Please select another table."
        aolutils.AddErrorCode(100237, err)
        raise arcpy.ExecuteError


    input_file = ''
    portal_file_type = ''

else:
    # Then we need to get an item from the portal
    # file_json
    in_table = ''
    portal_item_json = json.loads(portal_file)
    scratch_folder = arcpy.env.scratchFolder
    in_file_from_portal = os.path.join(scratch_folder,'input_file')
    try:
        item_file_json = hosted_gp.GetItemDataAsFile(portal_item_json["itemid"],in_file_from_portal)
    except Exception:
        err = "This input file is invalid. Please select another file."
        aolutils.AddErrorCode(100238, err)
        raise arcpy.ExecuteError
    item_file_json = hosted_gp.GetItem(portal_item_json["itemid"])
    portal_file_type = item_file_json['type']

    input_file = in_file_from_portal

to_pass_errorFunc = aolutils.AddErrorCode
to_pass_warningFunc = aolutils.AddErrorCode
to_pass_DEBUG = DEBUG

try:
    # arcpy.AddMessage('token: {}, referer:{}'.format(token,referer))
    analyze = gcutils.Analyze(mode='batch_geocode',in_file_zip=input_file,\
                              service_url=service_url,\
                              file_type=file_type,delimiter=delimiter,\
                              locale=locale,qualifier=qualifier,\
                              header_row_exists=header_row_exists,\
                              fixed_width_file=fixed_width,\
                              widths_of_columns=widths_of_columns,\
                              chars_per_row=chars_per_row,col_names=field_names,\
                              in_table=in_table,portal_file_type=portal_file_type, \
                              portal_self=portal_self_json,token=token,referer=referer,\
                              error_func=to_pass_errorFunc,warning_func=to_pass_warningFunc,\
                              debug=to_pass_DEBUG)
except arcpy.ExecuteError as ex:
    aolutils.AddExecuteErrors(ANALYZE_TASK_NAME, handled_error_codes_analyze)
    if DEBUG:
        gcutils.log_error_call_stack()
    # Add any error messages that do not have predefined error codes
    arcpy.AddMessage(str(ex))
    raise arcpy.ExecuteError

try:
    bg = gcutils.BatchGeocode(analyze,source_country,\
                              category,output_fields,\
                              output_file_type,fixed_width,header_row_exists,\
                              header_rows_to_skip,qualifier,\
                              widths_of_columns,field_names,chars_per_row,\
                              field_mapping,field_info,output_name,context,\
                              concurrent_batches, location_value,\
                              to_pass_errorFunc,to_pass_warningFunc,\
                              to_pass_DEBUG,output_location,None)

except arcpy.ExecuteError as ex:
    aolutils.AddExecuteErrors(TASK_NAME, handled_error_codes)
    if DEBUG:
        gcutils.log_error_call_stack()
    # Add any error messages that do not have predefined error codes
    arcpy.AddMessage(str(ex))
    raise arcpy.ExecuteError
if output_file_type == 'Feature Service':
    if output_fields != "NONE":
        ### if NONE is requested as the output fields, you do not get geocoding stats back.
        arcpy.SetParameterAsText(inputs_dict['geocoding_stats'], bg.geocoding_stats)

    try:
        output_name_json = json.loads(output_name)
    except Exception as e:
        err = "Your outputName is not formatted correctly."
        aolutils.AddErrorCode(100231, err)
        raise arcpy.ExecuteError
    
    folderid = ""
    if "itemProperties" in output_name_json:
        if "folderId" in output_name_json["itemProperties"]:
            folderid = output_name_json["itemProperties"]["folderId"]

    try:
        community_self_response = hosted_gp.GenericSharingRequest("community/self",{"f":"json"})
    except hostedgp.GPCloudExec as ex:
        err = "Invalid portal."
        aolutils.AddErrorCode(100161, err)
        raise arcpy.ExecuteError
    username = community_self_response.get("username")

if output_file_type == 'Feature Service':
    ###############################################################################
    ## START CREATE SERVICE PART ##
    # https://dev006066.esri.com/portal/sharing/rest/portals/0123456789ABCDEF/isServiceNameAvailable

    # get the token just in case the service was otherwise unsecure

    #token, referer = hosted_gp.GetServerToken(input_service_url,120)
    created_service = False
    if "itemProperties" in output_name_json:
       if "itemId" in output_name_json["itemProperties"]:
           created_service = True
           itemid_created = output_name_json["itemProperties"]["itemId"]

    portal_url = hosted_gp.GetOwningSystem()

    if not created_service:
        portal_id = portal_self_json["id"]
        #arcpy.AddMessage("portalid is {}".format(portal_id))
        if "serviceProperties" in output_name_json:
            out_name = output_name_json["serviceProperties"]["name"]
        elif "itemProperties" in output_name_json:
            out_name = output_name_json["itemProperties"]["title"]
        else:
            msg = "Output Name is not formatted correctly"
            aolutils.AddErrorCode(100231, msg)
            raise arcpy.ExecuteError

        data_dict = {
            "name":out_name,
            "type":"Feature Service",
            "f":"json"
            }
        #arcpy.AddMessage("data_dict is {}".format(data_dict))
        try:
            is_service_name_available_response = hosted_gp.GenericSharingRequest("portals/{}/isServiceNameAvailable".format(portal_id),data_dict)
        except hostedgp.GPCloudExec as ex:
            err = "Service name is already taken. Please pick a unique service name."
            aolutils.AddErrorCode(100161, err)
            raise arcpy.ExecuteError
        available = is_service_name_available_response.get("available")

        if available:
            # call create service
            if folderid:
                create_service = "content/users/{}/{}/createService".format(username, folderid)
            else:
                create_service = "content/users/{}/createService".format(username)
            out_name_stripped = out_name.replace(" ","_").replace(".","_")
            create_dict = {
                    "currentVersion": "10.6",
                    "serviceDescription": "",
                    "hasVersionedData": False,
                    "supportsDisconnectedEditing": False,
                    "hasStaticData": False,
                    "maxRecordCount": 2000,
                    "supportedQueryFormats": "JSON",
                    "capabilities": '''Query,Editing,Update''',
                    "description": "",
                    "copyrightText": "",
                    "allowGeometryUpdates": True,
                    "syncEnabled": False,
                    "editorTrackingInfo": {
                                    "enableEditorTracking": False,
                                    "enableOwnershipAccessControl": False,
                                    "allowOthersToUpdate": True,
                                    "allowOthersToDelete": True,
                                    "allowOthersToQuery": True,
                                    "allowAnonymousToUpdate": True,
                                    "allowAnonymousToDelete": True
                    },
                    "xssPreventionInfo": {
                                    "xssPreventionEnabled": True,
                                    "xssPreventionRule": "InputOnly",
                                    "xssInputRule": "rejectInvalid"
                    },
                    "tables": [],
                    "name": out_name_stripped
            }
            try:
                params_dict = {
                    "createParameters": json.dumps(create_dict),
                    "outputType": "featureService",
                    "f": "json"
                    }
                create_service_response = hosted_gp.GenericSharingRequest(create_service,params_dict)
                success = create_service_response.get("success")
                if success:
                    itemid_created = create_service_response.get("itemId")
                    serviceURL_created = create_service_response.get("serviceurl")
            except hostedgp.GPCloudExec as ex:
                err = "Invalid portal3."
                aolutils.AddErrorCode(100161, err)
                raise arcpy.ExecuteError
            # https://dev006066.esri.com/portal/sharing/rest/content/users/admin/createService
        else:
            err = "Your output service name already exists. Please enter a unique name."
            aolutils.AddErrorCode(100161, err)
            raise arcpy.ExecuteError
        out_name_proper = {
            "serviceProperties": {
                "name": out_name_stripped,
                "serviceUrl": serviceURL_created
            },
            "itemProperties": {
                "itemId": itemid_created,
                "fieldMapping": field_mapping,
                "geocodingService": input_service_url
            }
        }

        ## END CREATE SERVICE PART ##
    ###############################################################################

    # next few lines add rematch information, description, and tags to the already created
    # service
    #if "itemProperties" in output_name_json:
    #    if "folderId" in output_name_json["itemProperties"]:
    #        folderid = output_name_json["itemProperties"]["folderId"]

    


    # now it's time to put the layer into the created service
if output_file_type == 'Feature Service' or output_file_type == 'Feature Collection':
    descResultLayer = arcpy.Describe(bg.output_feature_class)
    # Create renderer with temporary layer
    startTime = time.time()
    drawingInfo = rendererUtils.getSimpleRendererInfo(descResultLayer.shapeType)
    startTime = aolutils.AddTimerMessage(startTime, "Create drawingInfo")

    layerOutDesc = aolutils.getOutDescription("ResultLocations", 0, drawingInfo)

    outputName = hosted_gp.GetOutputName(inputs_dict['output_name'])

    if output_file_type == 'Feature Service':
        if not created_service:
            #arcpy.AddMessage(out_name_proper)
            outputName.json = json.dumps(out_name_proper)
    
    #arcpy.AddMessage(outputName.json)

    toolResult = aolutils.HostedToolResult(outputName)
    toolResult.addHostedOutput(descResultLayer, layerOutDesc, inputs_dict['output_location'])
    num_tries = 0
    success = False
    # arcpy.AddMessage('added output')
    while num_tries < 4:
        try:
            num_tries += 1
            toolResult.generateHostedResult(hosted_gp, startTime)
            # arcpy.AddMessage('generated result')
            success = True
            break
        except Exception as e:
            if "already exists" in str(e):
                break
            else:
                # arcpy.AddError('Could not publish Feature Service.')
                arcpy.AddMessage('Trying again...')

    if not success:
        err = "Your output result name already exists, please choose a different name."
        aolutils.AddErrorCode(100241, err)
        raise arcpy.ExecuteError

    # else:
    #     arcpy.AddMessage('does it get to setting output')
    #     arcpy.SetParameterAsText(inputs_dict['output_location'], toolResult)


else:
    # output_file = os.path.join(bg.output_location, bg.output_name + '.zip')

    output_file = bg.output

    if output_file_type.lower() == "csv":
        dataformat = "CSV"

    else:
        dataformat = "Microsoft Excel"

    try:
    # arcpy.AddMessage('dataformat is {}'.format(dataformat))
    # arcpy.AddMessage('output_file is {}'.format(output_file))
        contentID = hosted_gp.ProcessFileOutput(str(dataformat), str(output_file))
        #arcpy.AddMessage(contentID)
        content_json = json.loads(contentID)
        itemid_created = content_json["itemId"]
        #arcpy.AddMessage(itemid_created)
    except Exception as err:
        err = "Your output result name already exists, please choose a different name."
        aolutils.AddErrorCode(100241, err)
        raise arcpy.ExecuteError

    try:
        arcpy.SetParameterAsText(inputs_dict['output_location'], contentID)
    except Exception as e:
        pass

# at the very end, make update and add resource calls, only if it's an output feature service.
if output_file_type == 'Feature Service':
    if folderid:
        update_url = "content/users/{}/{}/items/{}/update".format(username,folderid,itemid_created)
        resources_url = "content/users/{}/{}/items/{}/addResources".format(username,folderid,itemid_created)
    else:
        update_url = "content/users/{}/items/{}/update".format(username,itemid_created)
        resources_url = "content/users/{}/items/{}/addResources".format(username,itemid_created)

    update_dict = {
        "description":"Geocoded results generated from running the Geocode Locations from Table solution.",
        "tags":"Analysis Result, Geocode Locations From Table",
        "snippet": "Result generated from Geocode Locations From Table",
        "f":"json"
        }
    try:
        #arcpy.AddMessage(update_url)
        #arcpy.AddMessage(update_dict)
        update_response = hosted_gp.GenericSharingRequest(update_url,update_dict)
    except hostedgp.GPCloudExec as ex:
        arcpy.AddWarning("Failed to update description info")
        pass
    success = update_response.get("success")
    if not success:
        arcpy.AddWarning("Failed to update description info")

if output_file_type == 'Feature Service':
    field_mapping_final = json.loads(field_mapping)
    field_mapping_to_write = []
    for map in field_mapping_final:
        if map[1]:
            if all_output_fields:
                field_mapping_to_write.append(["in_" + map[0].lower(),map[1]])
            else:
                field_mapping_to_write.append([map[0],map[1]])
    prop_dict = {"rematchInfo":
                    {
                    "fieldMapping": field_mapping_to_write,
                    "geocodingService": url_to_save
                    }
                }
    if location_value:
        prop_dict["rematchInfo"]["locationType"] = location_value
    if source_country:
        prop_dict["rematchInfo"]["sourceCountry"] = source_country
    if category:
        prop_dict["rematchInfo"]["category"] = category
    if service_name:
        prop_dict["rematchInfo"]["serviceName"] = service_name
    resources_dict = {
        "filename": "rematch_json.json",
        "text": json.dumps(prop_dict),
        "f":"json"
        }

    if output_fields != "NONE":
        ### if NONE is requested as the output fields, you do not get the ability to rematch. Skip this call
        try:
            #arcpy.AddMessage('about to try to make addresources call')
            #arcpy.AddMessage(resources_url)
            #arcpy.AddMessage(resources_dict)
            resources_response = hosted_gp.GenericSharingRequest(resources_url,resources_dict)
            #arcpy.AddMessage('no exception was thrown')
        except hostedgp.GPCloudExec as ex:
            arcpy.AddWarning("Failed to update rematch info")
            pass
        #arcpy.AddMessage(resources_response)
        res_success = resources_response.get("success")
        if not res_success:
            arcpy.AddWarning("Failed to update rematch info")

    if bg.cannot_parse_records:
        # then we need to add one more item resource.
        unable_to_parse_dict = {
            "droppedRecords": bg.cannot_parse_records
            }

        resources_dict_2 = {
            "filename": "dropped_records.json",
            "text": json.dumps(unable_to_parse_dict),
            "f":"json"
            }
        try:
            #arcpy.AddMessage('about to try to make addresources call')
            resources_response_2 = hosted_gp.GenericSharingRequest(resources_url,resources_dict_2)
            #arcpy.AddMessage('no exception was thrown')
        except hostedgp.GPCloudExec as ex:
            arcpy.AddWarning("Failed to update dropped records info")
            pass
        #arcpy.AddMessage(resources_response)
        res_success_2 = resources_response_2.get("success")
        if not res_success_2:
            arcpy.AddWarning("Failed to update dropped records info")