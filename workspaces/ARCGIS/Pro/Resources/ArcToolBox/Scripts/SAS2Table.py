# -*- coding: utf-8 -*-
"""
Source Name:   SAS2Table.py
Version:       ArcGIS PRO 2.8
Author:        Environmental Systems Research Institute Inc.
Description:   Converts SAS Tables to ESRI Tables
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

SWAT.options.cas.print_messages = True

class SAS2Table(object):
    def __init__(self, inputSAS, outputTable, casHost = None, casPort = None,
                 casUserName = None, casPassword = None,
                 configFile = None, authinfoFile = None):

        UTILS.assignClassAttr(self, locals())
        #### Create Path for Output FC ####
        outPath, outName = OS.path.split(outputTable)

        #### Get/Check SAS Dataset Info ####
        libref, table = SAS_UTILS.getSASDatasetInfo(inputSAS)

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

            #### Read/Write Data ####
            SAS_UTILS.swat2OutputTable(conn, outputTable, libref, table)

            #### Clean Up ####
            ARCPY.AddMessage(conn.fileinfo(caslib=libref))
            conn.close()

        else:
            #### Desktop ####
            sas, scratchCFG = SAS_UTILS.getSASSessionInfo(configFile = self.configFile)

            if libref.upper() not in sas.assigned_librefs():
                sasLibRefs = [ i for i in sas.assigned_librefs() if i != 'WORK']
                existRefs = ", ".join(sasLibRefs)
                ARCPY.AddIDMessage("ERROR", 110388, libref, existRefs)
                SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                raise SystemExit()

            #### Assure Table Exists ####
            tableExists = sas.exist(table, libref)
            if not tableExists:
                ARCPY.AddIDMessage("ERROR", 110405, inputSAS)
                SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)
                raise SystemExit()

            #### Read/Write Data ####
            SAS_UTILS.saspy2OutputTable(sas, outputTable, libref, table)
            SAS_UTILS.endSASSession(sas, scratchCFG = scratchCFG)

if __name__ == '__main__':

    parameters = ARCPY.GetParameterInfo()
    inputSAS = parameters[0].valueAsText
    outputTable = parameters[1].valueAsText
    useCAS = parameters[2].value
    configFile = None
    if useCAS:
        casHost = UTILS.getTextParameter(3, parameters)
        casPort = UTILS.getTextParameter(4, parameters)
        casUserName = UTILS.getTextParameter(5, parameters)
        casPassword = UTILS.getTextParameter(6, parameters)
        authinfoFile = UTILS.getTextParameter(8, parameters)
    else:
        casHost = None
        casPort = None
        casUserName = None
        casPassword = None
        configFile = UTILS.getTextParameter(7, parameters)
        authinfoFile = None

    sas2tab = SAS2Table(inputSAS, outputTable, casHost = casHost, casPort = casPort,
                        casUserName = casUserName, casPassword = casPassword,
                        configFile = configFile, authinfoFile = authinfoFile)

