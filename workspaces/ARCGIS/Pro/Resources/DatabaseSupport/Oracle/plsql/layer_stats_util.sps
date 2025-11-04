/* $Id: layer_stats_util.sps,v 1.0, 2009-07-21 17:12:47Z, Josefina Santiago$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE layer_stats_util
/***********************************************************************
*
*N  {layer_stats_util.sps}  --  Interface for layer_stats DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on Layer_Stats.  It should be compiled by the
*   SDE DBA user; security is by user name.   
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
*    Josefina Santiago      06/23/2009               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

   -- Standard identifier for a Layer_Stats.

   SUBTYPE layer_id_t           IS &1..sde_layer_stats.layer_id%TYPE;
   SUBTYPE version_id_t         IS &1..sde_layer_stats.version_id%TYPE;
   SUBTYPE layer_stats_record_t IS &1..sde_layer_stats%ROWTYPE;

   -- Standard table name type

   DEF_table_name  NVARCHAR2(160);
   DEF_column_name &1..sde_util.identifier_t;
   SUBTYPE table_name_t  IS DEF_table_name%TYPE;
   SUBTYPE schema_name_t IS &1..sde_util.identifier_t;
   SUBTYPE column_name_t IS &1..sde_util.identifier_t;
   
  /* Constants. */

   -- The following constant defines the release of layer_stats_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1001;
   C_package_guid          CONSTANT VARCHAR2 (32):= 'C40A205D859943D39ED9E15AAB0A888E';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for layer_stats objects
   -- stored in the &1..LAYER_STATS table.  These procedures all issue a COMMIT
   -- on success.
   
   PROCEDURE insert_layer_stats (layer_stats      IN  layer_stats_record_t);
   PROCEDURE delete_layer_stats (old_layer_id     IN  layer_id_t, 
                                 old_version_id	  IN  version_id_t); 
   PROCEDURE update_layer_stats (layer_stats      IN  layer_stats_record_t);       

   PRAGMA RESTRICT_REFERENCES (layer_stats_util,WNDS,WNPS);

END layer_stats_util;
/
