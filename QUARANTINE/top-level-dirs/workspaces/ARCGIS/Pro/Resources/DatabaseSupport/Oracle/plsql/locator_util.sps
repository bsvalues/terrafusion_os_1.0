/* $Id: locator_util.sps,v 1.17, 2006-05-03 19:04:08Z, Tom Gigler$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE locator_util
/***********************************************************************
*
*N  {locator_util.sps}  --  Interface for locator DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on SDE locator table.  It should be compiled by the
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
*    Yung-Ting Chen          05/03/99               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

   -- Standard identifier for a locator.

   SUBTYPE locator_id_t IS &1..locators.locator_id%TYPE;
   SUBTYPE locator_record_t IS &1..locators%ROWTYPE;

   -- Array of sdemetadata columns.

   TYPE record_id_list_t IS TABLE OF &1..metadata.record_id%TYPE 
                                  INDEX BY BINARY_INTEGER;
   TYPE property_list_t IS TABLE OF &1..metadata.property%TYPE 
                                  INDEX BY BINARY_INTEGER;
   TYPE value_list_t IS TABLE OF &1..metadata.prop_value%TYPE 
                                  INDEX BY BINARY_INTEGER;

   -- The metadata class name of locator.

   C_metadata_class_name_locator  CONSTANT NVARCHAR2(32) := N'SDE internal';

   -- The following constant defines the release of locator_util, and 
   -- is used by the iomgr to determine if the most up to date version
   -- of the package has been installed.

   C_package_release                 CONSTANT PLS_INTEGER := 1008;
   C_package_guid                    CONSTANT VARCHAR2 (32):= '205AD85F3072401D989E28C9D6BBE563';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for locator objects
   -- stored in the &1..SDELOCATORS table.  These procedures all issue 
   -- a COMMIT on success.

   PROCEDURE insert_locator (locator           IN  locator_record_t,
                             num_properties    IN  integer,
                             record_id_list    IN  record_id_list_t,
                             property_list     IN  property_list_t,
                             value_list        IN  value_list_t);
   PROCEDURE delete_locator (old_locator_id    IN  locator_id_t); 
   PROCEDURE update_locator (locator           IN  locator_record_t,
                             num_properties    IN  integer,
                             record_id_list    IN  record_id_list_t,
                             property_list     IN  property_list_t,
                             value_list        IN  value_list_t);

   PRAGMA RESTRICT_REFERENCES (locator_util,WNDS,WNPS);

END locator_util;
/
