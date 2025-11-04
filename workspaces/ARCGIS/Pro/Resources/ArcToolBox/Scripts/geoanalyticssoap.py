# -*- coding: utf-8 -*-
import os
import sys
import time
import re
import json
import arcpy
from urllib.parse import urlencode
from urllib.parse import quote
from urllib.request import Request
from urllib.request import urlopen
from gautils import ExceptionHandler, get_message
import gautils.messages as msgs


class GAError(Exception):
    pass


@ExceptionHandler((RuntimeError, GAError))
class GeospatialAnalysisTasks(object):
    """ Class to run Geospatial Analytics tasks through SOAP."""

    def __init__(self, task, helper_services='geoanalytics'):
        self.portal_url = arcpy.GetActivePortalURL()
        self.helper_services = helper_services
        auth_params = arcpy.GetSigninToken()
        if self.portal_url is None or auth_params is None:
            arcpy.AddIDMessage('ERROR', 120380)
        else:
            self.task = task
            self.tool_name = self.task.replace(" ", "")
            self.token = auth_params.get("token")
            self.referer = auth_params.get("referer")
            self.headers = {"Referer": self.referer}
            self.rest_url = "{}/sharing/rest".format(self.portal_url)
            self.ga_analysis_url = self.get_analysis_url()
            self.task_url = "{}/{}".format(self.ga_analysis_url, self.task)
            self.ga_toolbox_url, self.service = self.get_toolbox_url_service()
            self.toolbox_name = os.path.split(self.service)[1]
            self.toolbox = self.create_toolbox_string()
            self.service_tool = "{}_{}".format(self.tool_name, self.toolbox_name)
            self.msg_stats = ""
            self.msg_stats_arr = []

    @staticmethod
    def rest_response(request):
        """ Sends the request to REST and returns the REST response as json."""
        with urlopen(request) as response:
            json_data = response.read().decode("utf-8")
            json_data = json.loads(json_data)
        if json_data:
            return json_data
        else:
            msg = get_message(120001)  # Unable to get REST response.
            raise GAError(msg)

    def get_analysis_url(self):
        """ Returns analysis url from GeoAnalytics for running analysis services."""
        portal_response = arcpy.GetPortalDescription()
        if not isinstance(portal_response, dict):
            portal_response = json.loads(portal_response)

        if "helperServices" in portal_response:
            self.analysis_url = portal_response.get("helperServices", {}).get(self.helper_services, {}).get("url")
            if self.analysis_url is not None:
                return self.analysis_url
            else:
                msg = get_message(120002, self.helper_services)  # Unable to get %s URL.
                raise GAError(msg)
        else:
            msg = get_message(120002, self.helper_services)  # Unable to get %s URL.
            raise GAError(msg)

    def add_toolbox(self):
        """ Add the GeoAnalytics service toolbox for tool run through SOAP."""
        arcpy.ImportToolbox(self.toolbox)

    def remove_toolbox(self):
        """ Remove the GeoAnalytics service toolbox after tool run through SOAP."""
        arcpy.gp.removeToolbox(self.toolbox)

    def create_toolbox_string(self):
        """ Create string to connect to the GeoAnalytics service toolbox through SOAP."""
        sso = "UseSSOIdentityIfPortalOwned"
        tbx = "{};{};{}".format(self.ga_toolbox_url, self.service, sso)
        return tbx

    def run_portal_tool(self, params):
        """ Run Portal analysis (GeoAnalytics, standard and raster) through SOAP."""
        next_msg_index = 0

        self.add_toolbox()

        try:
            tool = getattr(arcpy, self.service_tool)
        except AttributeError:
            # Pro returns this error when the service is stopped or the toolbox failed to
            # load the service tasks from the server toolbox
            # It also failed when the Sharing team broke SSOIdentityIfPortalOwned
            # https://devtopia.esri.com/ArcGISPro/sharing/issues/1926#issuecomment-2124506
            arcpy.AddIDMessage('ERROR', 120056)
            sys.exit(1)

        try:
            result = tool(**params)
        except AttributeError:
            # Pro returns this error when the service isn't available
            arcpy.AddIDMessage('ERROR', 120056)
            sys.exit(1)
        except arcpy.ExecuteError as err:
            arcpy.AddError(err)
            sys.exit(1)

        arcpy.env.autoCancelling = False

        while result.status < 4:
            try:
                time.sleep(0.5)
                msg_count = result.messageCount

                current_msg_index = next_msg_index
                if msg_count > current_msg_index:
                    for i in range(current_msg_index, msg_count):
                        next_msg_index = i + 1
                        self.format_message(result.getMessage(i),
                                            result.getSeverity(i))

                if arcpy.env.isCancelled:
                    # GP will add error messages similar to:
                    #   Cancelled script <tool name>...
                    #   (<tool_name>) aborted by User.
                    result.cancel()
                    raise KeyboardInterrupt()

            except KeyboardInterrupt:
                # Note: messages are generated by the cancel mechanism
                sys.exit(1)

            except Exception as err:
                # Don't error out for message handling issues
                pass

        if result.status == 4:
            output_count = result.outputCount
            if self.tool_name == 'GeneralizedLinearRegression':
                self.format_json_table_glr()
            arcpy.AddMessage(self.msg_stats)
            if self.tool_name == 'GeographicallyWeightedRegression':
                self.format_json_table_gwr()
            if output_count == 1:
                output = result.getOutput(0)
            elif output_count == 0:
                output = None
            else:
                output = [result.getOutput(i) for i in range(0, output_count)]

        else:
            # Shouldn't be necessary, but just in case
            arcpy.AddIDMessage('ERROR', 582)
            sys.exit(1)

        self.remove_toolbox()
        return output


    def get_json_format(self):
        """"
        Template to use for printing any JSON table
        """
        required_formatting = {
            "element": "table",
            "data": [
                ["test", "test2"],
                ["test", "test2"],
                ["test", "test2"]
            ],
            "elementProps": {
                "striped": "true",
                "1": {
                    "align": "right",
                    "pad": "20px"
                },
                "2": {
                    "align": "left"
                }
            }
        }

        return required_formatting


    def format_json_table_glr(self):
        import json
        import arcpy
        """"Formatting for the Describe BDC Tool
                :param in_str: An input JSON to be formatted
                :param row_values: The row titles for the table
        """
        required_formatting = self.get_json_format()

        fields_title = ""
        stats_title = ""
        # Lists that will be used to store results
        fields_data_array = []
        stats_data_list = [[arcpy.GetIDMessage(120358), arcpy.GetIDMessage(120359)]]

        for element in self.msg_stats_arr:
            if element[0] == "BD_101178":
                # Summary of GLR Results [Model Type: Continuous (Gaussian/OLS)]
                if element[1] == arcpy.GetIDMessage(120338):
                    fields_title = arcpy.GetIDMessage(120338)
                # Summary of GLR Results [Model Type: Binary (Logistic)]
                if element[1] == arcpy.GetIDMessage(120340):
                    fields_title = arcpy.GetIDMessage(120340)
                # Summary of GLR Results [Model Type: Count (Poisson)]
                if element[1] == arcpy.GetIDMessage(120341):
                    fields_title = arcpy.GetIDMessage(120341)
            elif element[0] == "BD_101181":
                stats_title = arcpy.GetIDMessage(120339)
            elif element[0] == "BD_101179":
                for index, item in enumerate(element[1]):
                    # Variable
                    if item == arcpy.GetIDMessage(120329):
                        element[1][index] = arcpy.GetIDMessage(120329)
                    # Coef
                    if item == arcpy.GetIDMessage(120342):
                        element[1][index] = arcpy.GetIDMessage(120330)
                    # StdError
                    if item == arcpy.GetIDMessage(120343):
                        element[1][index] = arcpy.GetIDMessage(120331)
                    # t_Stat
                    if item == arcpy.GetIDMessage(120344):
                        element[1][index] = arcpy.GetIDMessage(120332)
                    # Prob
                    if item == arcpy.GetIDMessage(120345):
                        element[1][index] = arcpy.GetIDMessage(120333)
                fields_data_array.append(element[1])
            elif element[0] == "BD_101180":
                for index, item in enumerate(element[1]):
                    if index != 0:
                        element[1][index] = round(float(item), 4)
                fields_data_array.append(element[1])
            elif element[0] == "BD_101182" or element[0] == "BD_101183" or element[0] == "BD_101184" or element[0] == "BD_101185":
                if element[0] == "BD_101182" or element[0] == "BD_101183":
                    if fields_title != arcpy.GetIDMessage(120338):
                        continue
                for index, item in enumerate(element[1]):
                    if index != 0:
                        element[1][index] = round(float(item), 4)
                    else:
                        # Multiple R-Squared
                        if item == arcpy.GetIDMessage(120334):
                            element[1][index] = arcpy.GetIDMessage(120334)
                        # Adjusted R-Squared
                        if item == arcpy.GetIDMessage(120335):
                            element[1][index] = arcpy.GetIDMessage(120335)
                        # Akaike's Information Criterion (AIC)
                        if item == arcpy.GetIDMessage(120336):
                            element[1][index] = arcpy.GetIDMessage(120336)
                        # Akaike's Information Criterion corrected (AICc)
                        if item == arcpy.GetIDMessage(120337):
                            element[1][index] = arcpy.GetIDMessage(120337)
                stats_data_list.append(element[1])


        fields_element_props = {
            "striped": "true",
            "0": {
                "align": "left"
            },
            "1": {
                "align": "right",
                "pad": "20px"
            },
            "2": {
                "align": "right",
                "pad": "20px"
            },
            "3": {
                "align": "right",
                "pad": "20px"
            },
            "4": {
                "align": "right",
                "pad": "20px"
            }
        }

        stats_element_props = {
            "striped": "true",
            "0": {
                "align": "left"
            },
            "1": {
                "align": "right",
                "pad": "20px"
            }
        }

        arcpy.AddMessage(fields_title)

        required_formatting["data"] = fields_data_array
        required_formatting["elementProps"] = fields_element_props
        fields_table = [required_formatting]
        fields_json_string = json.dumps(fields_table)
        fields_table_str = """json:\n{}""".format(fields_json_string)
        arcpy.AddMessage(fields_table_str)

        arcpy.AddMessage(stats_title)

        required_formatting["data"] = stats_data_list
        required_formatting["elementProps"] = stats_element_props
        stats_table = [required_formatting]
        fields_json_string = json.dumps(stats_table)
        print(fields_json_string)
        stats_table_str = """json:\n{}""".format(fields_json_string)
        arcpy.AddMessage(stats_table_str)

    def format_json_table_gwr(self):
        import json
        import arcpy
        """"Formatting for the Describe BDC Tool
                :param in_str: An input JSON to be formatted
                :param row_values: The row titles for the table
        """
        required_formatting = self.get_json_format()

        element_props = {
            "striped": "true",
            "0": {
                "align": "left"
            },
            "1": {
                "align": "right",
                "pad": "20px"
            }
        }

        analysis_title = arcpy.GetIDMessage(120346)
        model_title = arcpy.GetIDMessage(120353)
        analysis_data_array = [[arcpy.GetIDMessage(120358), arcpy.GetIDMessage(120359)]]
        model_data_array = [[arcpy.GetIDMessage(120358), arcpy.GetIDMessage(120359)]]

        for element in self.msg_stats_arr:
            if element[0] == "BD_101147":
                # Number of Features
                # The following values like "Number of Features" etc are not translated in Server, that's why they are hard-coded here
                if element[1][0] == "Number of Features":
                    element[1][0] = arcpy.GetIDMessage(120347)
                    element[1][1] = int(element[1][1])
                    analysis_data_array.append(element[1])
                # Number of Neighbors
                elif element[1][0] == "Number of Neighbors":
                    element[1][0] = arcpy.GetIDMessage(120351)
                    element[1][1] = int(element[1][1])
                    analysis_data_array.append(element[1])
                # R-Squared
                elif element[1][0] == "R-Squared":
                    element[1][0] = arcpy.GetIDMessage(120354)
                    element[1][1] = float(element[1][1])
                    model_data_array.append(element[1])
                # Adjusted R-Squared
                elif element[1][0] == "Adjusted R-Squared":
                    element[1][0] = arcpy.GetIDMessage(120335)
                    element[1][1] = float(element[1][1])
                    model_data_array.append(element[1])
                # Akaike's Information Criterion corrected (AICc)
                elif element[1][0] == "Akaike's Information Criterion corrected (AICc)":
                    element[1][0] = arcpy.GetIDMessage(120337)
                    element[1][1] = float(element[1][1])
                    model_data_array.append(element[1])
                # Sigma-Squared
                elif element[1][0] == "Sigma-Squared":
                    element[1][0] = arcpy.GetIDMessage(120355)
                    element[1][1] = float(element[1][1])
                    model_data_array.append(element[1])
                # Effective Degrees of Freedom
                elif element[1][0] == "Effective Degrees of Freedom":
                    element[1][0] = arcpy.GetIDMessage(120356)
                    element[1][1] = float(element[1][1])
                    model_data_array.append(element[1])
                else:
                    # Explanatory Variables
                    if element[1][0] == "Explanatory Variables":
                        element[1][0] = arcpy.GetIDMessage(120348)
                    # Dependent Variable
                    elif element[1][0] == "Dependent Variable":
                        element[1][0] = arcpy.GetIDMessage(120349)
                    # Neighborhood Selection Method
                    elif element[1][0] == "Neighborhood Selection Method":
                        element[1][0] = arcpy.GetIDMessage(120350)
                    # Local Weighting Scheme
                    elif element[1][0] == "Local Weighting Scheme":
                        element[1][0] = arcpy.GetIDMessage(120352)
                    # Distance Band
                    elif element[1][0] == "Distance Band":
                        element[1][0] = arcpy.GetIDMessage(120357)
                    analysis_data_array.append(element[1])

        arcpy.AddMessage(analysis_title)

        required_formatting["data"] = analysis_data_array
        required_formatting["elementProps"] = element_props
        analysis_table = [required_formatting]
        analysis_json_string = json.dumps(analysis_table)
        analysis_table_str = """json:\n{}""".format(analysis_json_string)
        arcpy.AddMessage(analysis_table_str)

        arcpy.AddMessage(model_title)

        required_formatting["data"] = model_data_array
        required_formatting["elementProps"] = element_props
        model_table = [required_formatting]
        model_json_string = json.dumps(model_table)
        model_table_str = """json:\n{}""".format(model_json_string)
        arcpy.AddMessage(model_table_str)


    def get_toolbox_url_service(self):
        """ Get the URL and name from the GeoAnalytics service."""
        ga_url = os.path.split(self.ga_analysis_url)[0].replace("rest/", "")
        ga_toolbox_url, toolbox_service = os.path.split(ga_url)
        ga_toolbox_url = os.path.split(ga_toolbox_url)[0]
        toolbox_service = "{}/{}".format(os.path.split(os.path.split(ga_url)[0])[1], toolbox_service)
        return ga_toolbox_url, toolbox_service

    def format_message(self, msg, severity):
        """ Format messages and add to tool message stack"""

        severity_dict = {0: 'INFORMATIVE',
                         1: 'WARNING',
                         2: 'ERROR'}

        if severity not in severity_dict.keys():
            severity = 0

        try:
            msg_dict = json.JSONDecoder().decode(msg)

            # If the expected keys are not there, bypass dict handling
            if 'messageCode' not in msg_dict.keys() or 'message' not in msg_dict.keys():
                msg_dict = None
        except Exception:
            msg_dict = None

        if msg_dict:
            if severity == 1 or severity == 2:
                try:
                    if len(msg_dict['params']) == 0:
                        param_values = ()
                    elif len(msg_dict['params']) == 1:
                        param_values = list(msg_dict['params'].values())[0]
                    else:
                        value_positions = []
                        for k, v in msg_dict['params'].items():
                            p = msg_dict['message'].find("'{}'".format(v))
                            value_positions.append((v, p))

                        value_positions.sort(key=lambda f: f[1])
                        param_values = tuple([i[0] for i in value_positions])
                except Exception:
                    param_values = ()

                try:
                    msg_code = msgs.lookup[msg_dict['messageCode']]
                except KeyError as err:
                    # KeyError, if message ID from service isn't available in lookup
                    # Message will include service message ID
                    out_msg = '{} {}: {}'.format(severity_dict[severity],
                                                 msg_dict['messageCode'],
                                                 msg_dict['message'])

                else:
                    try:
                        msg_str = arcpy.GetIDMessage(msg_code) % param_values
                    except TypeError:
                        # Expected number of arguments is invalid. Use message as is
                        msg_str = arcpy.GetIDMessage(msg_code)

                    # Message will include geoprocessing message ID
                    out_msg = '{} {}: {}'.format(severity_dict[severity],
                                                 msg_code,
                                                 msg_str)

                if severity == 1:
                    arcpy.AddWarning(out_msg)
                else:  # severity == 2
                    arcpy.AddError(out_msg)
            else:
                try:
                    out_msg = msg_dict['message']
                    out_msg_code = msg_dict['messageCode']
                    try:
                        out_msg_params = msg_dict['params']
                    except Exception:
                        out_msg_params = None

                    server_msgs = ['BD_101028', 'BD_101029', 'BD_101081', 'BD_101082', 'BD_101083', 'BD_101084', 'BD_101226']
                    glr_msgs = ['BD_101178', 'BD_101179', 'BD_101180', 'BD_101181', 'BD_101182', 'BD_101183',
                                'BD_101184', 'BD_101185']
                    gwr_msgs = ['BD_101240', 'BD_101241', 'BD_101147']
                    cms_msgs = ['BD_101265']
                                                                                                                                                                                                                                                                                                                                         
                    # Server generic
                    if out_msg_code in server_msgs:
                        # Server messages with no params
                        if out_msg_params is None:
                            arcpy.AddIDMessage("INFORMATIVE", msgs.lookup[out_msg_code])
                        # Server messages with 1 param
                        elif out_msg_code in ['BD_101028', 'BD_101082', 'BD_101083', 'BD_101084', 'BD_101226']:
                            param_list = list(out_msg_params.values())
                            arcpy.AddIDMessage("INFORMATIVE", msgs.lookup[out_msg_code], param_list[0])
                        # Format completed tasks out of total
                        elif out_msg_code == 'BD_101029':
                            tasks_string = str(out_msg_params['completedTasks']) + "/" + str(out_msg_params['totalTasks'])
                            arcpy.AddIDMessage("INFORMATIVE", msgs.lookup['BD_101029'], tasks_string)

                    # GLR
                    if out_msg_code == 'BD_101178' or out_msg_code == 'BD_101181':
                        self.msg_stats_arr.append([out_msg_code, out_msg])
                    if out_msg_code == 'BD_101179':
                        self.msg_stats_arr.append([out_msg_code, json.loads(out_msg)])
                    if out_msg_code == 'BD_101180':
                        self.msg_stats_arr.append([out_msg_code, out_msg.replace('\'', '').strip().split(',')])
                    if out_msg_code == 'BD_101182' or out_msg_code == 'BD_101183' or out_msg_code == 'BD_101184' or out_msg_code == 'BD_101185':
                        self.msg_stats_arr.append([out_msg_code, out_msg.strip().split(':')])

                    # GWR
                    if out_msg_code == 'BD_101240' or out_msg_code == 'BD_101241':
                        self.msg_stats_arr.append([out_msg_code, out_msg])
                    if out_msg_code == 'BD_101147':
                        out_msg = out_msg.replace(',', ':', 1)
                        self.msg_stats_arr.append([out_msg_code, out_msg.strip().split(':')])

                    # FBCR
                    if out_msg_code == 'BD_84810':
                        self.msg_stats += '-' * 60 + '\n'
                        self.msg_stats += ('{:-^60}'.format(out_msg)) + '\n'
                    if out_msg_code == 'BD_84829' or out_msg_code == 'BD_84834' or out_msg_code == 'BD_84839':
                        self.msg_stats += ' ' * 96 + '\n'
                        self.msg_stats += ('{:-^60}'.format(out_msg)) + '\n'
                    if out_msg_code == 'BD_84811' or out_msg_code == 'BD_84812' or out_msg_code == 'BD_84813' or out_msg_code == 'BD_84814' or out_msg_code == 'BD_84815' or out_msg_code == 'BD_84816':
                        out_msg_split = out_msg.split(':')
                        self.msg_stats += '{:<50s}{:>10s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                    if out_msg_code == 'BD_101146' or out_msg_code == 'BD_101147':
                        split_char = "," if out_msg_code == 'BD_101146' else ":"
                        out_msg = out_msg.replace('[', '').replace(']', '').replace('"', '').replace('\'', '')
                        out_msg_split = out_msg.split(split_char)
                        self.msg_stats += '{:<25s}{:>15s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                    if out_msg_code == 'BD_101150':
                        out_msg = out_msg.replace('[', '').replace(']', '').replace('"', '').replace('\'', '')
                        out_msg_split = out_msg.split(',', 1)
                        self.msg_stats += '{:<50s}{:>15s}'.format(out_msg_split[0], out_msg_split[1].replace(',', '')) + '\n'
                        msg_stats = '{:<50s}{:>15s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                    if out_msg_code == 'BD_101151':
                        out_msg = out_msg.replace('[', '').replace(']', '').replace('"', '').replace('\'', '')
                        out_msg_split = out_msg.rsplit(',', 1)
                        self.msg_stats += '{:<50s}{:>15s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                        msg_stats = '{:<50s}{:>15s}'.format(out_msg_split[0], out_msg_split[1]) + '\n'
                    if out_msg_code == 'BD_84830' or out_msg_code == 'BD_84840':
                        self.msg_stats += out_msg + '\n'

                    # CMS
                    if out_msg_code == "BD_101265":
                        arcpy.AddIDMessage("INFORMATIVE", msgs.lookup['BD_101265'], out_msg_params['stat'], out_msg_params['unit'])
                except Exception:
                    self.msg_stats = ''
                 
                message_list = glr_msgs + gwr_msgs + cms_msgs + server_msgs
                if out_msg_code not in message_list:
                    arcpy.AddMessage(out_msg)

        else:
            if severity == 0:
                arcpy.AddMessage(msg)
            elif severity == 1:
                arcpy.AddWarning(msg)
            else:  # severity == 2
                arcpy.AddError(msg)

