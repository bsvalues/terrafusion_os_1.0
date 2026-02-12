import json


class JobClient:
    """
    Provides a GP-like async client for submitting GeoAnalytics Desktop GP tools.
    The client uses py4j to interact with the JVM.
    """

    def __init__(self, spark):
        self._jgp = spark._sc._gateway.jvm.com.esri.arcgis.gae.desktop.DesktopPythonEnvironment.getJobClient()

    def submit_job(self, tool_name, params):
        return json.loads(self._jgp.submit(tool_name, json.dumps({"params": params})))

    def cancel_job(self, job_id):
        return json.loads(self._jgp.cancelJob(job_id))

    def get_job_status(self, job_id, message_offset=0):
        return json.loads(self._jgp.queryJobStatus(job_id, message_offset))

    def list_tools(self):
        return json.loads(self._jgp.listTools())

