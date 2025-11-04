/* $Id: registry_util.sps,v 1.24.1.0, 2008-01-24 16:36:33Z, Josefina Santiago$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE registry_util
/***********************************************************************
*
*N  {registry_util.sps}  --  Interface for table_registry DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on table_registry.  It should be compiled by the
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

   -- Standard identifiers and structures for registered tables and columns.

   SUBTYPE registration_id_t IS &1..table_registry.registration_id%TYPE;
   SUBTYPE registration_record_t IS &1..table_registry%ROWTYPE;
   SUBTYPE registered_column_record_t IS &1..column_registry%ROWTYPE;

   -- An array of registration ids.

   TYPE reg_list_t IS TABLE OF registration_id_t INDEX BY BINARY_INTEGER;

   -- Array of registered column definitions.

   TYPE registered_column_list_t IS TABLE OF registered_column_record_t
      INDEX BY BINARY_INTEGER;

   -- Standard table name type

   DEF_table_name  NVARCHAR2(160);
   SUBTYPE table_name_t IS DEF_table_name%TYPE;

   -- Qualified table name type

   DEF_qualified_table_name  NVARCHAR2(288);
   SUBTYPE qualified_table_name_t IS DEF_qualified_table_name%TYPE;

   -- Old column name type

   SUBTYPE column_name_t IS  &1..sde_util.identifier_t;

   -- Session Globals to manage the TABLES_LAST_EDIT_TIME table's trigger operation.
   G_delete_last           TIMESTAMP(3) DEFAULT NULL;  -- last delete time
   G_purge_threshold       PLS_INTEGER  DEFAULT NULL;  -- Trigger's default 24 hours

  /* Constants. */

   -- The following constant defines the release of registry_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.
   
   C_package_release       CONSTANT PLS_INTEGER := 1021;
   C_package_guid          CONSTANT VARCHAR2 (32):= 'DBE6D05469FA48879999B1147263F3B6';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for registration objects
   -- stored in the &1..TABLE_REGISTRY table.  These procedures all issue a 
   -- COMMIT on success.

   PROCEDURE insert_registration (registration IN  registration_record_t);
   PROCEDURE insert_registration2 (registration IN  registration_record_t);
   PROCEDURE delete_registration (old_reg_id   IN  registration_id_t); 
   PROCEDURE update_registration (registration IN  registration_record_t); 
   PROCEDURE update_registration2 (registration IN  registration_record_t); 
   PROCEDURE update_registration (registration IN  registration_record_t,
                                  txn_commit   IN  NUMBER); 
   PROCEDURE update_registration2 (registration IN  registration_record_t,
                                   txn_commit   IN  NUMBER);
   PROCEDURE change_registration_table_name 
                             (new_table_name   IN  table_name_t,
                              wanted_reg_id    IN  registration_id_t);
   PROCEDURE clear_registration_modified (reg_id  IN  registration_id_t);
   FUNCTION get_registered_table_name (reg_id  IN  registration_id_t)
     RETURN qualified_table_name_t;

   -- The following functions perform DDL operations for registration objects
   -- stored in the &1..COLUMN_REGISTRY table.  These procedures all issue a 
   -- COMMIT on success, except for insert_registered_column.

   PROCEDURE insert_registered_column 
                                 (column_entry  IN  registered_column_record_t);
   PROCEDURE insert_registered_column2 
                                 (column_entry  IN  registered_column_record_t);
   PROCEDURE delete_registered_column 
                                 (column_entry  IN  registered_column_record_t);
   PROCEDURE update_registered_column 
                                 (column_entry  IN  registered_column_record_t);   
   PROCEDURE update_registered_column2 
                                 (column_entry  IN  registered_column_record_t);   
   PROCEDURE update_registered_column3 
                                 (column_entry  IN  registered_column_record_t);
   PROCEDURE update_registered_column 
                                 (column_entry  IN  registered_column_record_t,
                                  old_column_name IN column_name_t);
   PROCEDURE update_registered_column2
                                 (column_entry  IN  registered_column_record_t,
                                  old_column_name IN column_name_t);
   PROCEDURE update_registered_column3
                                 (column_entry  IN  registered_column_record_t,
                                  old_column_name IN column_name_t);

   PRAGMA RESTRICT_REFERENCES (registry_util,WNDS,WNPS);

END registry_util;
/
