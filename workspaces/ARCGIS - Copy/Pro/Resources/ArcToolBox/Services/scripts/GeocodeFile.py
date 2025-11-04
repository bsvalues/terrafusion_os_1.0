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
import glob

###Constants used in Debugging
DEBUG = False
ANALYZE_TASK_NAME = u"AnalyzeGeocodeInput"
TASK_NAME = u"BatchGeocode"
handled_error_codes = list(gcutils.BatchGeocode.ERROR_CODES.keys())
handled_error_codes_analyze = list(gcutils.Analyze.ERROR_CODES.keys())

inputs_dict = {
    'geocode_parameters': 0,
    'service_url': 1,
    'output_file_type': 2,
    'input_file': 3,
    'table_name': 4,
    'source_country': 5,
    'category': 6,
    'output_fields': 7,
    'header_rows_to_skip': 8,
    'output_name': 9,
    'context': 10,
    'locator_parameters': 11,
    'output_location': 12,
    'geocoding_stats': 13
}

# Take in user input
geocode_parameters = arcpy.GetParameterAsText(inputs_dict['geocode_parameters'])

input_file = arcpy.GetParameterAsText(inputs_dict['input_file'])

table_name = arcpy.GetParameterAsText(inputs_dict['table_name'])

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

if not input_file:
    err = "Empty input file."
    aolutils.AddErrorCode(100253, err)
    raise arcpy.ExecuteError

try:
    analyze_json = json.loads(geocode_parameters)
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
    from_pro = False
else:
    # REST Address locator coming from pro, we need to preserve the
    # locator's name for rematch later.
    from_pro = True
    index_of_rest = orig_service_url.lower().find('geocodeserver')
    cutoff_index = index_of_rest + 14
    service_name = orig_service_url[cutoff_index:]
    input_service_url = orig_service_url[:cutoff_index - 1]
    url_to_save = input_service_url

### FOR TESTING PURPOSES
from_pro = True

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
    geocode_helper_services = portal_self_json[u'helperServices'][u'geocode']

    for geocoder in geocode_helper_services:
        if geocoder[u'url'] == input_service_url:
            concurrent_batches = geocoder[u'numBatchThreads']

except Exception as e:
    concurrent_batches = 1

try:
    input_service_url = aolutils.getPrivateServiceURL(hosted_gp, input_service_url)

except Exception as err:
    msg_dict = dict(service_url=input_service_url)
    msg = "Invalid locator service URL: {service_url}.".format(**msg_dict)
    aolutils.AddErrorCode(100171, msg)
    raise arcpy.ExecuteError


service_url = input_service_url + '/geocodeAddresses'

### DO THIS FOR CSV, XLS OUTPUT TYPES
### TEST ON PYTHON 3... ONLY THING THAT MIGHT BE BROKEN IS
### THE USAGE OF ZIPFILE MODULE
try:
    output_name_json = json.loads(output_name)
    if "serviceProperties" in output_name_json:
        name = output_name_json["serviceProperties"]["name"]
    elif "itemProperties" in output_name_json:
        name = output_name_json["itemProperties"]["title"]
    else:
        err = "Your outputName is not formatted correctly."
        aolutils.AddErrorCode(100231, err)
        raise arcpy.ExecuteError
except Exception as e:
    err = "Your outputName is not formatted correctly."
    aolutils.AddErrorCode(100231, err)
    raise arcpy.ExecuteError


if input_file[-3:] == "zip":
    import zipfile
    zip_ref = zipfile.ZipFile(input_file, 'r')
    scratch_folder = arcpy.env.scratchFolder
    zip_ref.extractall(scratch_folder)
    zip_ref.close()
    if file_type == "gdb":
        walk = arcpy.da.Walk(scratch_folder, datatype="Table")
        found_it = False
        for dirpath, dirnames, filenames in walk:
            for filename in filenames:
                if filename == table_name:
                    found_it = True
                    break
                # FIND THE CHOSEN TABLE AND SET THAT AS IN_TABLE
                # in_table needs to be E:\whatever.gdb\tablename and you should be good to go
                # arcpy.AddMessage('found 1!!!')
                # arcpy.AddMessage('the table is named {}'.format(filename))
                # arcpy.AddMessage('should be named {}'.format(table_name))
                #feature_classes.append(os.path.join(dirpath, filename))
        if found_it:
            folder, gdb = os.path.split(input_file[:-4])
            in_table = os.path.join(scratch_folder, gdb, table_name)
            #arcpy.AddMessage("{} should be perfect".format(new_in_table))
            #arcpy.AddMessage('input table path {}'.format(in_table))
            input_file = ''
        else:
            err = "This input table is invalid. Please select another table."
            aolutils.AddErrorCode(100237, err)
            raise arcpy.ExecuteError
        # set it to the new value that gcutils will recognize 
        # and know what to do with
        file_type = "table"
    else:
        input_file = ''
        in_table = ''
        if file_type == "csv":
            for f in glob.glob(os.path.join(scratch_folder, "*.csv")):
                input_file = f
                break
        if file_type == "xls":
            for f in glob.glob(os.path.join(scratch_folder, "*.xls")):
                input_file = f
                break
        if file_type == "xlsx":
            for f in glob.glob(os.path.join(scratch_folder, "*.xlsx")):
                input_file = f
                break
        if not input_file:
            err = "There is no file of the specified format in your zip file."
            aolutils.AddErrorCode(100170, err)
            raise arcpy.ExecuteError
else:
    err = "Your input must be a zipfile cannot be opened."
    aolutils.AddErrorCode(100169, err)
    raise arcpy.ExecuteError
    
portal_file_type = ''

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
                              to_pass_DEBUG,None,table_name)

except arcpy.ExecuteError as ex:
    aolutils.AddExecuteErrors(TASK_NAME, handled_error_codes)
    if DEBUG:
        gcutils.log_error_call_stack()
    # Add any error messages that do not have predefined error codes
    arcpy.AddMessage(str(ex))
    raise arcpy.ExecuteError

if output_file_type == "gdb":
    # create the zipfile
    import zipfile
    import zlib

    ### Going to create the dictionary of geocoding options
    geocoding_options = {}
    if location_value:
        geocoding_options["locationType"] = location_value
    if category:
        geocoding_options["category"] = category
    if source_country:
        geocoding_options["sourceCountry"] = source_country

    ### Need to add rematch info and then zip the gdb table
    if from_pro and output_fields != "NONE":
        fc = bg.output_feature_class
        locator_path = orig_service_url
        fields = arcpy.ListFields(fc)
        if all_output_fields:
            ### Going to add rematch info using attach_locator
            inputFieldNames = ''
            for field in fields:
                if field.name[:3] == "IN_":
                    inputFieldNames += field.name
                    inputFieldNames += ","
            inputFieldNames = inputFieldNames[:-1]
            outputFieldNames = ''
            for field in fields:
                if field.name[:3] != "IN_" and field.name[:5] != "USER_":
                    if field.name != "OBJECTID":
                        outputFieldNames += field.name
                        outputFieldNames += ","
            outputFieldNames = outputFieldNames[:-1]
            # arcpy.AddMessage("loc_path is {}".format(locator_path))
            # arcpy.AddMessage("fc is {}".format(fc))
            # arcpy.AddMessage("inputFieldNames is {}".format(inputFieldNames))
            # arcpy.AddMessage("outputFieldNames is {}".format(outputFieldNames))


            arcpy.AttachLocator(locator_path, fc, inputFieldNames, outputFieldNames, geocoding_options)
            # arcpy.AddMessage("finished attaching")
        else:
            ### this is the case of not ALL outFields, but SOME outFields.
            ### Still activate rematch for this feature class.
            possible_service_fields = []
            addr_fields = bg.analyze_obj.json_info_response['addressFields']
            singleLine_field = bg.analyze_obj.json_info_response['singleLineAddressField']
            singleLine_name = singleLine_field['name']
            for addr in addr_fields:
                # Add each field to possible_service_fields
                possible_service_fields.append(addr['name'])
            possible_service_fields.append(singleLine_name)
            field_mapping_final = json.loads(field_mapping)
            inputFieldNames = ''
            for service_field in possible_service_fields:
                found = False
                for mapp in field_mapping_final:
                    if mapp[1] == service_field:
                        found = True
                        inputFieldNames += mapp[0]
                        inputFieldNames += ","
                
                
            inputFieldNames = inputFieldNames[:-1]
            outputFieldNames = ''
            ### find a way to find the 1st possible input field. probably via field info??
            json_field_info = json.loads(field_info)
            first_orig_field = json_field_info[0][0]
            for field in fields:
                if field.name == first_orig_field:
                    break
                outputFieldNames += field.name
                outputFieldNames += ","
            outputFieldNames = outputFieldNames[:-1]
            # arcpy.AddMessage("loc_path is {}".format(locator_path))
            # arcpy.AddMessage("fc is {}".format(fc))
            # arcpy.AddMessage("inputFieldNames is {}".format(inputFieldNames))
            # arcpy.AddMessage("outputFieldNames is {}".format(outputFieldNames))

            arcpy.AttachLocator(locator_path, fc, inputFieldNames, outputFieldNames, geocoding_options)




    ### zip the gdb table
    gdb_file = bg.out_gdb
    gdb_name = os.path.basename(gdb_file)
    zipped_output = gdb_file + ".zip"
    #time.sleep(5)
    with zipfile.ZipFile(zipped_output,mode='w',compression=zipfile.ZIP_DEFLATED, allowZip64=True) as zip:
        for f in os.listdir(gdb_file):
            if f.endswith(".sr.lock"):
                pass
            else:
                zip.write(os.path.join(gdb_file,f),os.path.join(gdb_name,os.path.basename(f)))

    if output_fields != "NONE":
        ### if NONE is requested as the output fields, you do not get geocoding stats back.
        arcpy.SetParameterAsText(inputs_dict['geocoding_stats'], bg.geocoding_stats)

else:
    output_file = bg.output
    if output_file_type == "xls" or output_file_type == "XLS":
        ### add some special xls bytes in order for ArcGIS Pro to open the excel file
        ### this code was scalped from Ghis' check-in here: https://devtopia.esri.com/ArcGISPro/ArcGISPro/pull/46436/files
        import struct
        with open(output_file, mode='rb') as f:
            arr = bytearray(f.read())
            update = b'\x0f', b'\x00', b'\x00', b'N', b'o', b'n', b'e'
            struct.pack_into('s'*7, arr, 552, *update)
        # We need to zip the output csv or output xls file
        with open(output_file, mode='wb') as f:
            f.write(arr)
    
    out_name = os.path.basename(output_file)
    #arcpy.AddMessage(output_file)
    zipped_output = output_file[:-4] + ".zip"
    #arcpy.AddMessage(zipped_output)
    with zipfile.ZipFile(zipped_output,mode='w',compression=zipfile.ZIP_DEFLATED, allowZip64=True) as zip:
        zip.write(output_file,out_name)
    
arcpy.SetParameterAsText(inputs_dict['output_location'], zipped_output)