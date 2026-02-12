/* $Id: rastercolumns_util.sps,v 1.14.1.1, 2009-03-23 20:18:00Z, Zhiguang Han$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE rastercolumns_util
/***********************************************************************
*
*N  {rastercolumns_util.sps}  --  Interface for raster_columns DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on raster_columns.  It should be compiled by the
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
*    Yung-Ting Chen          03/02/99               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

   -- Standard identifier for a RASTER_COLUMNS.

   SUBTYPE rastercolumn_id_t IS &1..raster_columns.rastercolumn_id%TYPE;
   SUBTYPE rastercolumn_record_t IS &1..raster_columns%ROWTYPE;
   SUBTYPE srid_t IS &1..raster_columns.srid%TYPE;

  -- Standard table name type

  DEF_table_name  NVARCHAR2(160);
  DEF_srtext      VARCHAR2(1024);
  SUBTYPE table_name_t IS DEF_table_name%TYPE;
  SUBTYPE srtext_t     IS DEF_srtext%TYPE;

  /* Constants. */

   -- The following constant defines the release of rastercolumns_util, and 
   -- is used by the iomgr to determine if the most up to date version of
   -- the package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1007;
   C_package_guid          CONSTANT VARCHAR2 (32):= 'CA6080F3641343B89958340657059B4C';

  /* Procedures and functions. */

   -- The following functions perform DML operations for raster layer 
   -- objects stored in the &1..RASTER_COLUMNS table. These procedures 
   -- all issue a COMMIT on success.

   PROCEDURE insert_rastercolumn (rastercolumn  IN  rastercolumn_record_t);
   PROCEDURE delete_rastercolumn (old_rastercolumn_id IN rastercolumn_id_t); 
   PROCEDURE update_rastercolumn (rastercolumn  IN rastercolumn_record_t); 
   PROCEDURE update_rastercolumn (r IN rastercolumn_record_t, flag IN number);
   PROCEDURE rename_rastercolumn (new_table_name         IN table_name_t,
                                  wanted_rastercolumn_id IN rastercolumn_id_t);
   PROCEDURE update_rastercolumn_srid 
                                 (wanted_rastercolumn_id IN rastercolumn_id_t,
                                  new_srid               IN srid_t);
   PROCEDURE update_spatial_references
                                 (wanted_rastercolumn_id IN rastercolumn_id_t,
                                  new_srtext             IN srtext_t);

   PRAGMA RESTRICT_REFERENCES (rastercolumns_util,WNDS,WNPS);

END rastercolumns_util;
/
