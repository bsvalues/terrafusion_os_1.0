/* $Id: metadata_util.sps,v 1.13, 2006-05-03 19:04:06Z, Tom Gigler$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE metadata_util
/***********************************************************************
*
*N  {metadata_util.sps}  --  Interface for metadata DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on the SDE metadata table.  It should be compiled by 
*   the SDE DBA user; security is by user name.   
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
*    Peter Aronson             04/07/99               Original coding.
*E
***********************************************************************/
IS
  /* Type definitions. */

   -- Standard identifier for a metadata record.

   SUBTYPE record_id_t IS &1..metadata.record_id%TYPE;

   -- An array of metadata record ids.

   TYPE record_id_list_t IS TABLE OF record_id_t INDEX BY BINARY_INTEGER;

   -- 8.0.4-style interface for the metadata record.  At 8i will probably be
   -- replaced by an object type.

   SUBTYPE metadata_record_t IS &1..metadata%ROWTYPE;

   -- An array of metadata records.

   TYPE metadata_record_list_t IS TABLE OF metadata_record_t INDEX BY
                               BINARY_INTEGER;

   -- Id only record for delete cursors.

   TYPE metadata_info_t IS RECORD (record_id  record_id_t);

   -- The following declarations are used to pass a deletion cursor to 
   -- delete metadata.

   TYPE delete_info_cursor_t IS REF CURSOR RETURN metadata_info_t;

  /* Constants. */

   C_metadata_object_type_table   CONSTANT &1..metadata.object_type%TYPE := 1;
   C_metadata_object_type_locator CONSTANT &1..metadata.object_type%TYPE := 2;
                                           
   -- The following constant defines the release of metadata_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1006;
   C_package_guid          CONSTANT VARCHAR2 (32):= 'F11CA9CC8FD943408B016591C69CB356';

  /* Procedures and functions. */

   -- The following functions perform DDL operations on the metadata records.
   -- These procedures all issue a COMMIT on success.

   PROCEDURE  insert_metadata (metadata_list  IN  metadata_record_list_t);
   PROCEDURE  delete_metadata (record_id_list  IN  record_id_list_t);
   PROCEDURE  delete_metadata (delete_select_cursor  IN  delete_info_cursor_t);
   PROCEDURE  update_metadata (new_metadata  IN  metadata_record_t);

   PRAGMA RESTRICT_REFERENCES (metadata_util,WNDS,WNPS);

END metadata_util;
/
