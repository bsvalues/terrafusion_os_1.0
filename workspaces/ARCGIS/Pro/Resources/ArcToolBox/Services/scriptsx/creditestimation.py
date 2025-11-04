"""---------------------------------------------------------------------------
Name:              CostReport.py
Purpose:           To estimate and report the credits taken for a certain
                   online analysis tool.
Author:            Esri Inc.
Created:           2/12/2018
Copyright:   (c)   Esri, Inc. 2012
ArcGIS Version:    10.6.1
---------------------------------------------------------------------------"""
# pylint: disable=W0703, W0702, C0103
# noqa: E722
# pylint: disable=import-error
import arcpy

from cost import CostHandler
from common import LogUtils, PAErrorProcessor, ToolExit

ERROR_CODES = ['001', '002', '003', 900003, 900005, 100245, 900007, 900008, 900009]

LOGGER = LogUtils.setup_logger(__name__)

def main():
    """Entry-point of the CostEstimation REST service."""
    task_name = arcpy.GetParameterAsText(0)
    parameters = arcpy.GetParameterAsText(1)

    try:
        cost_estimation = CostHandler(task_name, parameters, False).handle()
        arcpy.SetParameterAsText(2, cost_estimation)
        LOGGER.debug('Credit estimation complete successfully.')
    except Exception as err:
        PAErrorProcessor(task_name, ERROR_CODES, err).process()


if __name__ == '__main__':
    main()
