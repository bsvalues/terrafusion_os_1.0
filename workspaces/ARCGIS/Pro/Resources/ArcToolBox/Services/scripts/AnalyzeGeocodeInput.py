__author__ = 'vict7669'
import arcpy
import gcutils
import json
import hostedgp
import os
import sys
import aolutils
import requests

###Constants used in Debugging
DEBUG = False
TASK_NAME = "AnalyzeGeocodeInput"
handled_error_codes = list(gcutils.Analyze.ERROR_CODES.keys())
# Take in user input

inputs_dict = {
    'service_url': 0,
    'locale': 5,
    'portal_table': 1,
    'context': 6,
    'geocoding_parameters': 4,
    'column_names': 3,
    'portal_file': 2
}

try:
    portal_table = arcpy.GetParameterAsText(inputs_dict['portal_table'])
except Exception as e:
    err = "This input table is invalid. Please select another table."
    aolutils.AddErrorCode(100237, err)
    raise arcpy.ExecuteError
#arcpy.AddMessage('got the portal table successfully')

input_service_url = arcpy.GetParameterAsText(inputs_dict['service_url'])

portal_file = arcpy.GetParameterAsText(inputs_dict['portal_file'])

locale = arcpy.GetParameterAsText(inputs_dict['locale'])

column_names = arcpy.GetParameterAsText(inputs_dict['column_names'])

input_file_parameters = arcpy.GetParameterAsText(inputs_dict['geocoding_parameters'])

try:
    service_json = json.loads(input_service_url)
    input_service_url = service_json["url"]
except:
    # Giving the user the option to pass it as a json
    pass

if portal_file and portal_table:
    err = 'You cannot submit both a table and a file, please submit only one.'
    aolutils.AddErrorCode(100234, err)
    raise arcpy.ExecuteError

if input_file_parameters:
    try:
        input_file_params_JSON = json.loads(input_file_parameters)
        file_type = input_file_params_JSON['fileType']

    except Exception as e:
        err = 'Your inputFileParameters is not formatted correctly.'
        aolutils.AddErrorCode(100235, err)
        raise arcpy.ExecuteError
    if file_type == "txt":
        try:
            header_row_exists = input_file_params_JSON['headerRowExists']
            delimiter = input_file_params_JSON['columnDelimiter']
            qualifier = input_file_params_JSON['textQualifier']
            fixed_width_file = input_file_params_JSON['fixedWidthTextFile']
            widths_of_columns = input_file_params_JSON['widthsOfColumns']
            chars_per_row = input_file_params_JSON['charactersPerRow']
        except Exception as e:
            err = 'Your inputFileParameters is not formatted correctly.'
            aolutils.AddErrorCode(100235, err)
            raise arcpy.ExecuteError

    else:
        try:
            header_row_exists = input_file_params_JSON['headerRowExists']
            delimiter = input_file_params_JSON['columnDelimiter']
            qualifier = input_file_params_JSON['textQualifier']
            # fixed_width_file = input_file_params_JSON['fixedWidthTextFile']
            # widths_of_columns = input_file_params_JSON['widthsOfColumns']
            # chars_per_row = input_file_params_JSON['charactersPerRow']
            fixed_width_file = ""
            widths_of_columns = ""
            chars_per_row = ""
        except Exception as e:
            err = 'Your inputFileParameters is not formatted correctly. {}'.format(e)
            aolutils.AddErrorCode(100235, err)
            raise arcpy.ExecuteError
else:
    # inputFileParameters empty...
    if not portal_table and portal_file:
        # if they submitted an inputFile...
        err = 'If you are submitting an inputFile you must specify inputFileParameters.'
        aolutils.AddErrorCode(100236, err)
        raise arcpy.ExecuteError

    file_type = 'table'
    header_row_exists = 'true'
    delimiter = ""
    qualifier = ""
    fixed_width_file = ""
    widths_of_columns = ""
    chars_per_row = ""

hosted_gp = hostedgp.HostedGP(inputs_dict['context'])
big_data = False

if portal_table:
    if "rest/services/datastorecatalogs" in portal_table.lower():
        big_data = True
        #arcpy.AddMessage(portal_table)
        table = portal_table
    else:
        try:
            table = hosted_gp.GetHostedLayer(inputs_dict['portal_table'])
        except Exception as e:
            err = "This input table is invalid. Please select another table."
            aolutils.AddErrorCode(100237, err)
            raise arcpy.ExecuteError

    in_file_zip = ''
    portal_file_type = ''

else:
    if portal_file:
        portal_item_json = json.loads(portal_file)
        scratch_folder = arcpy.env.scratchFolder
        in_file_from_portal = os.path.join(scratch_folder, 'input_file')
        try:
            item_data_json = hosted_gp.GetItemDataAsFile(portal_item_json["itemid"], in_file_from_portal)
        except Exception:
            err = "This input file is invalid. Please select another file."
            aolutils.AddErrorCode(100238, err)
            raise arcpy.ExecuteError
        item_file_json = hosted_gp.GetItem(portal_item_json["itemid"])
        portal_file_type = item_file_json['type']
        in_file_zip = in_file_from_portal
    else:
        in_file_zip = ''
        portal_file_type = ''
        if not column_names:
            err = 'You must either specify an inputFile, inputTable or columnNames.'
            aolutils.AddErrorCode(100239, err)
            raise arcpy.ExecuteError

    table = ''

input_service_url = aolutils.getPrivateServiceURL(hosted_gp, input_service_url)

service_secure = gcutils.token_check(input_service_url)

if service_secure == "error":
    msg_dict = dict(service_url=input_service_url)
    msg = "Invalid locator service URL: {service_url}. Make sure proxy items are shared with Everyone.".format(**msg_dict)
    aolutils.AddErrorCode(100172, msg)
    raise arcpy.ExecuteError

if service_secure:
    try:
        token, referer = hosted_gp.GetServerToken(input_service_url,120)
    
    except Exception as err:
        arcpy.AddMessage(err)
        msg_dict = dict(service_url=input_service_url)
        msg = "Invalid locator service URL: {service_url}.".format(**msg_dict)
        aolutils.AddErrorCode(100171, msg)
        raise arcpy.ExecuteError

else:
    token = None
    referer = None


# arcpy.AddMessage('token: {}, referer:{}'.format(token,referer))
service_url = input_service_url + '/geocodeAddresses'

to_pass_errorFunc = aolutils.AddErrorCode
to_pass_warningFunc = aolutils.AddErrorCode
to_pass_DEBUG = DEBUG
try:
    analyze = gcutils.Analyze(mode='analyze',in_file_zip=in_file_zip,\
                        service_url=service_url,\
                        file_type=file_type,delimiter=delimiter,\
                        locale=locale,qualifier=qualifier,\
                        header_row_exists=header_row_exists,\
                        fixed_width_file=fixed_width_file,\
                        widths_of_columns=widths_of_columns,\
                        chars_per_row=chars_per_row,col_names=column_names,\
                        table_input=table,portal_file_type=portal_file_type,\
                        token=token,referer=referer,big_data=big_data,\
                        error_func=to_pass_errorFunc, warning_func=to_pass_warningFunc,\
                        debug=to_pass_DEBUG)

except arcpy.ExecuteError as ex:
    aolutils.AddExecuteErrors(TASK_NAME, handled_error_codes)
    #Add any error messages that do not have predefined error codes
    if DEBUG:
        gcutils.log_error_call_stack()
    raise arcpy.ExecuteError

arcpy.SetParameterAsText(7,analyze.output_json)
