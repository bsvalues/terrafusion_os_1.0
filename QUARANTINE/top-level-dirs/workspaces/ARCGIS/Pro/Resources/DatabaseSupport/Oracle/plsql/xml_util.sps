/* $Id: xml_util.sps,v 1.13.1.0, 2007-11-15 16:49:50Z, Josefina Santiago$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE xml_util
/***********************************************************************
*
*N  {xml_util.sps}  --  Interface for XML DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on ArcSDE XML system tables.  It should be compiled 
*   by the SDE DBA user; security is by user name.   
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
*    Annette Locke             07/31/02               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

  -- Standard identifier for XML_INDEX_TAGS record.

  SUBTYPE xml_index_tags_index_id_t IS &1..sde_xml_index_tags.index_id%TYPE;
  SUBTYPE xml_index_tags_record_t   IS &1..sde_xml_index_tags%ROWTYPE;
  SUBTYPE xml_index_tags_id_t   IS &1..sde_xml_index_tags.tag_id%TYPE;


  -- Standard identifier for XML_INDEXES record.

  SUBTYPE xml_indexes_index_id_t IS &1..sde_xml_indexes.index_id%TYPE;
  SUBTYPE xml_indexes_owner_t    IS &1..sde_xml_indexes.owner%TYPE;
  SUBTYPE xml_indexes_name_t     IS &1..sde_xml_indexes.index_name%TYPE;
  SUBTYPE xml_indexes_description_t IS &1..sde_xml_indexes.description%TYPE;
  SUBTYPE xml_indexes_record_t   IS &1..sde_xml_indexes%ROWTYPE;

  -- Standard identifier for XML_COLUMNS record.

  SUBTYPE xml_columns_column_id_t IS &1..sde_xml_columns.column_id%TYPE;
  SUBTYPE xml_columns_index_id_t  IS &1..sde_xml_columns.index_id%TYPE;
  SUBTYPE xml_columns_record_t    IS &1..sde_xml_columns%ROWTYPE;

  TYPE tagid_list_t IS TABLE OF xml_index_tags_id_t INDEX BY BINARY_INTEGER;
  /* Constants. */

   -- The following constant defines the release of xml_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1008;
   C_package_guid          CONSTANT VARCHAR2 (32):= '743B25EF9EE54EADA6A62EBA2CEC67D8';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for xml objects
   -- stored in the &1..XML_INDEX_TAGS table.  These procedures all issue a
   -- COMMIT on success.
   
   PROCEDURE xml_index_tags_def_insert(indexIdVal  IN xml_index_tags_index_id_t,
                                       index_tag  IN xml_index_tags_record_t);

   -- The following functions perform DDL operations for xml objects
   -- stored in the &1..XML_INDEXES table.  These procedures all issue a
   -- COMMIT on success.

   PROCEDURE xml_indexes_def_insert(xml_index    IN xml_indexes_record_t);
   PROCEDURE xml_indexes_def_delete(ownerVal     IN xml_indexes_owner_t,
                                    indexNameVal IN xml_indexes_name_t);

   -- The following functions perform DDL operations for xml objects
   -- stored in the &1..XML_COLUMNS table.  These procedures all issue a
   -- COMMIT on success.
   
   PROCEDURE xml_columns_def_insert(column      IN xml_columns_record_t);
   PROCEDURE xml_columns_def_delete(columnIdVal IN xml_columns_column_id_t);
   PROCEDURE xml_columns_def_update(column      IN xml_columns_record_t);
   PROCEDURE xml_indexes_def_update(indexIdVal   IN xml_indexes_index_id_t, 
                                    indexNameVal   IN xml_indexes_name_t, 
                                    indexDescriptionVal  IN xml_indexes_description_t);
   PROCEDURE xml_index_tags_def_update (indexIdVal  IN xml_index_tags_index_id_t,
                                        index_tag  IN xml_index_tags_record_t);
   PROCEDURE xml_index_tags_def_delete (indexIdVal  IN xml_index_tags_index_id_t,
                                        tag_list  IN tagid_list_t);
   PRAGMA RESTRICT_REFERENCES (xml_util, WNDS, WNPS);

END xml_util;
/
