# -*- coding: utf-8 -*-
"""
Source Name:   Table2SAS.py
Version:       ArcGIS PRO 2.8
Author:        Environmental Systems Research Institute Inc.
Description:   Converts Feature Classes and Tables to SAS Tables
"""

import arcpy as ARCPY
import arcgisscripting as ARC
import SSDataObject as SSDO
import SSUtilities as UTILS
import ErrorUtils as ERROR
import SAS_Utilities as SAS_UTILS
import pandas as PANDAS
import numpy as NUM
import os as OS
import sys as SYS
import winreg as WINREG
import saspy as SASPY
from saspy import autocfg
import swat as SWAT
import certifi as CERTIFI
import traceback as TRACEBACK
import contextlib as CONTEXTLIB
import warnings as WARNINGS

SWAT.options.cas.print_messages = True


class Table2SAS(object):
    def __init__(self, inputTable, outputSAS, overwriteSAS = True, useDomainsSubtypes = True,
                 casHost = None, casPort = None, casUserName = None, casPassword = None,
                 configFile = None, authinfoFile = None):

        UTILS.assignClassAttr(self, locals())

        #### Get/Check SAS Dataset Info ####
        libref, table = SAS_UTILS.getSASDatasetInfo(outputSAS)

        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(220166))
        remoteSession = False
        if casHost is not None:
            remoteSession = True
            if authinfoFile is not None:
                if casUserName is not None and casPassword is not None:
                    authinfoFile = None
                    self.authinfoFile = None

        if remoteSession:    
            #### Remote SAS CAS Session ####
            ssl_certs = CERTIFI.where()
            SWAT.options.cas.ssl_ca_list = ssl_certs

            #### Use Name and Password Call ####
            if authinfoFile is None:
                try:
                    conn = SWAT.CAS(casHost, port = casPort, username = casUserName, 
                                    password = casPassword, protocol='cas',
                                    authinfo = None)
                    ARCPY.AddMessage(conn)

                except SWAT.SWATError:
                    ARCPY.AddIDMessage("ERROR", 110389)
                    raise SystemExit()

            #### Authinfo Call ####
            else:
                try:
                    conn = SWAT.CAS(casHost, port = casPort, username = None, 
                                    password = None, protocol='cas',
                                    authinfo = authinfoFile)
                    ARCPY.AddMessage(conn)

                except SWAT.SWATError as error:
                    ARCPY.AddIDMessage("ERROR", 110489)
                    raise SystemExit()

        else:
            #### Desktop ####
            sas, scratchCFG = SAS_UTILS.getSASSessionInfo(configFile = self.configFile)

            if libref.upper() not in sas.assigned_librefs():
                existRefs = ", ".join(list(sas.assigned_librefs()))
                ARCPY.AddIDMessage("ERROR", 110388, libref, existRefs)
                SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                raise SystemExit()

            #### Check to See If Table Exists ####
            tableExists = sas.exist(table, libref)
            if tableExists:
                if not overwriteSAS:
                    ARCPY.AddIDMessage("ERROR", 110387, outputSAS)
                    SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                    raise SystemExit()
                else:
                    #### Make Sure it isn't Locked ####
                    sasInfo = sas.submit(SAS_UTILS.SAS_SUBMIT_STR.format(outputSAS))
                    if 'ERROR: A lock is not available' in sasInfo['LOG']:
                        ARCPY.AddIDMessage("ERROR", 110386, outputSAS)
                        SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                        raise SystemExit()

        df, labels = SAS_UTILS.table_to_data_frame(inputTable, useDomainsSubtypes)

        if remoteSession:
            try:
                tbl = conn.upload_frame(df)
            except SWAT.SWATError:
                SAS_UTILS.raiseSWAT_Error(conn)

            try:
                if conn.retrieve('table.tableExists', caslib=libref, name=table).exists:
                    if overwriteSAS == True:
                        conn.retrieve('table.droptable', caslib=libref, name=table)
                    else:
                        ARCPY.AddIDMessage("ERROR", 110387, outputSAS)
                        conn.close()
                        raise SystemExit()

                castbl = conn.promote(tbl, targetlib=libref, target=table)
            except SWAT.SWATError:
                SAS_UTILS.raiseSWAT_Error(conn)

            #### Report Status Info ####
            ARCPY.AddMessage(ARCPY.GetIDMessage(220169).format(str(castbl.status)))
            ARCPY.AddMessage(ARCPY.GetIDMessage(220170).format(str(castbl.status_code)))

            if castbl.status_code != 0:
                ARCPY.AddIDMessage("ERROR", 110394, str(castbl.status))
                conn.close()
                raise SystemExit()
        else:
            try:
                sas_result = sas.df2sd(df, table, libref, labels = labels)
            except UnicodeEncodeError: 
                ARCPY.AddIDMessage("ERROR", 110390)
                SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                raise SystemExit()
            except ValueError:
                #### ValueError Version of Unicode Error ####
                msg = TRACEBACK.format_exc().splitlines()[-1]
                msgKey = 'ValueError: invalid literal for int() with base 10'
                if msg.startswith(msgKey):
                    ARCPY.AddIDMessage("ERROR", 110390)
                    SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                    raise SystemExit()
                else:
                    #### Unknown ValueError - Throw Traceback ####
                    ARCPY.AddError(msg)
                    SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                    raise SystemExit()


        #### Number of Records Written ####
        ARCPY.AddMessage(ARCPY.GetIDMessage(220168).format(len(df), outputSAS))

        if remoteSession:
            conn.close()
        else:
            SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)

if __name__ == '__main__':

    parameters = ARCPY.GetParameterInfo()
    inputTable = parameters[0].valueAsText
    outputSAS = parameters[1].valueAsText
    overwriteSAS = parameters[2].value
    useDomainsSubtypes = parameters[3].value
    useCAS = parameters[4].value
    configFile = None
    if useCAS:
        casHost = UTILS.getTextParameter(5, parameters)
        casPort = UTILS.getTextParameter(6, parameters)
        casUserName = UTILS.getTextParameter(7, parameters)
        casPassword = UTILS.getTextParameter(8, parameters)
        authinfoFile = UTILS.getTextParameter(10, parameters)
    else:
        casHost = None
        casPort = None
        casUserName = None
        casPassword = None
        configFile = UTILS.getTextParameter(9, parameters)
        authinfoFile = None

    tab2sas = Table2SAS(inputTable, outputSAS, overwriteSAS = overwriteSAS, useDomainsSubtypes = useDomainsSubtypes,
                        casHost = casHost, casPort = casPort, casUserName = casUserName, casPassword = casPassword,
                        configFile = configFile, authinfoFile = authinfoFile)
