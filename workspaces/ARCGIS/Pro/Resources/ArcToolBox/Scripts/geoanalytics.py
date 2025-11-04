# -*- coding: utf-8 -*-
import time
import json
import arcpy
from urllib.parse import urlencode
from urllib.parse import quote
from urllib.request import Request
from urllib.request import urlopen
from urllib.error import HTTPError
from urllib.error import URLError


class GeospatialAnalysisTasks(object):
    """ Class to run Geospatial Analytics tasks."""
    def __init__(self, task):
        self.portal_url = arcpy.GetActivePortalURL()
        auth_params = arcpy.GetSigninToken()
        if self.portal_url is None and auth_params is None:
            raise Exception("Unable to get portal info.")
        self.task = task
        self.token = auth_params.get("token")
        self.headers = {"Referer": auth_params.get("referer")}
        self.rest_url = "{}/sharing/rest".format(self.portal_url)
        self.analysis_url = self.get_analysis_url()
        self.analysis_url = self.get_analysis_url()
        self.ga_analysis_url = self.analysis_url.replace("/System", "").replace("SpatialAnalysis", "GeoAnalytics")
        self.task_url = "{}/{}".format(self.ga_analysis_url, self.task)

    @staticmethod
    def rest_response(request):
        """ Sends the request to REST and returns the REST response as json."""
        with urlopen(request) as response:
            json_data = response.read().decode("utf-8")
            json_data = json.loads(json_data)
        if json_data:
            return json_data
        else:
            raise Exception("Unable to get REST response.")

    def get_analysis_url(self):
        """ Returns analysis url from GeoAnalytics for running analysis services."""
        params = {"f": "json", "token": self.token}
        data = urlencode(params)
        data = data.encode("utf-8")
        self_url = "{}/portals/self".format(self.rest_url)
        self_url = quote(self_url, safe="/:%")
        request = Request(self_url, data, headers=self.headers)
        portal_response = self.rest_response(request)
        if "helperServices" in portal_response:
            self.analysis_url = portal_response.get("helperServices", {}).get("analysis", {}).get("url")
            return self.analysis_url
        else:
            raise Exception("Unable to get Geoanalytics URL.")

    def analysis_job(self, params, analysis_layer=None):
        """ Submits an Analysis job and returns the job URL for monitoring the
            job status. params is a dict."""
        arcpy.AddMessage("Submitting {} job......\n".format(self.task))
        params.update({"f": "json", "token": self.token})
        data = urlencode(params)
        data = data.encode("utf-8")
        job_url = "{}/submitJob?".format(self.task_url)
        job_url = quote(job_url, safe="/:?")
        try:
            request = Request(job_url, data, self.headers)
            analysis_response = self.rest_response(request)
            print("rest response")
            print(analysis_response)
            if "error" in analysis_response:
                return analysis_response
            if not analysis_response:
                return
            analysis_status_response = self.analysis_job_status(analysis_response)
            if analysis_status_response:
                if "error" in analysis_status_response:
                    return analysis_status_response
                analysis_result = self.analysis_job_results(analysis_status_response, analysis_layer)
                if analysis_result:
                    return analysis_result
        except HTTPError as http_error:
            print("HTTP error: {}\n".format(http_error))
            return "HTTP error: {}".format(http_error)
        except URLError as url_error:
            print("URL error: {}\n".format(url_error))
            return "URL error: {}".format(url_error)

    def analysis_job_status(self, json_data):
        """ Tracks the status of the submitted analysis job."""
        params = {"f": "json", "token": self.token}
        data = urlencode(params)
        data = data.encode("utf-8")
        if "jobId" in json_data:
            job_id = json_data.get("jobId")
            job_url = "{}/jobs/{}".format(self.task_url, job_id)
            job_url = quote(job_url, safe="/:%")
            request = Request(job_url, data, self.headers)
            job_response = self.rest_response(request)
            if "jobStatus" in job_response:
                while not job_response.get("jobStatus") == "esriJobSucceeded":
                    request = Request(job_url, data, self.headers)
                    job_response = self.rest_response(request)
                    if job_response.get("jobStatus") == "esriJobFailed":
                        job_response["error"] = True
                        return job_response
                    elif job_response.get("jobStatus") == "esriJobTimedOut":
                        return "Job timed out."
                    time.sleep(5)
                if "results" in job_response:
                    return job_response

    def analysis_job_results(self, json_data, analysis_layer=None):
        """ Parses the job result json to get job value information to create feature
            collection or to get information about the feature service created from
            the analysis job. Returns a dict of the job values"""
        params = {"f": "json", "token": self.token}
        data = urlencode(params)
        data = data.encode("utf-8")
        if "results" in json_data and "jobId" in json_data:
            results = json_data.get("results")
            job_id = json_data.get("jobId")
            for key in results.keys():
                if "paramUrl" in results[key]:
                    param_url = results[key].get("paramUrl")
                    if analysis_layer is not None:
                        if param_url == "results/{}".format(analysis_layer):
                            param_url = "results/{}".format(analysis_layer)
                else:
                    raise Exception("Unable to retrieve param URL")
                result_url = "{}/jobs/{}/{}".format(self.task_url, job_id, param_url)
                result_url = quote(result_url, safe="/:%")
                request = Request(result_url, data, self.headers)
                job_results = self.rest_response(request)
                job_value = job_results.get("value")
                if job_value:
                    return job_value