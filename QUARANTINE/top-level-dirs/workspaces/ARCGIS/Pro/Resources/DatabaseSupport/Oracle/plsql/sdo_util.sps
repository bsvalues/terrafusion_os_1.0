/* $Id: sdo_util.sps,v 1.8.1.2, 2013-03-22 16:51:14Z, Sanjay Magal$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE sdo_util
/***********************************************************************
*
*N  {sdo_util.sps}  --  Oracle Spatial Utilities 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   ArcSDE server operations involving the Oracle Spatial type.  It 
*   should be compiled by the SDE DBA user.   
*E
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*X  Legalese:
*
*   COPYRIGHT 1992-2004 ESRI
*
*   TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
*   Unpublished material - all rights reserved under the
*   Copyright Laws of the United States.
*
*   For additional information, contact:
*   Environmental Systems Research Institute, Inc.
*   Attn: Contracts Dept
*   380 New York Street
*   Redlands, California, USA 92373
*
*   email: contracts@esri.com
*   
*E
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*H  History:
*
*    Kevin Watt          12/07/00               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

   -- Standard identifier for
   -- &1..layers, &1..table_registry and &1..geometry_columns

   SUBTYPE layer_record_t        IS &1..layers%ROWTYPE;
   SUBTYPE geocol_record_t       IS &1..geometry_columns%ROWTYPE;
   SUBTYPE registration_record_t IS &1..table_registry%ROWTYPE;
     
   -- Standard table name type

  /* Constants. */

   -- The following constant defines the release of sdo_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1004;
   C_package_guid          CONSTANT VARCHAR2 (32):= '8AC9FC8E90FB49B2A731389F9505C5D6';

  /* Procedures and functions. */

   -- Procedure register_layer:
   --   * Checks the table is not already registered
   --   * Insert &1..LAYERS record
   --   * Insert &1..TABLE_REGISTRY record
   -- This procedure issues COMMIT on success.

   PROCEDURE register_layer (layer            IN  layer_record_t,
                             gcol             IN  geocol_record_t,
                             registration     IN  registration_record_t);
 
   -- Assert WNDS, WNPS to Compiler

   PRAGMA RESTRICT_REFERENCES (sdo_util,WNDS,WNPS);

END sdo_util;
/
