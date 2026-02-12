/* $Id: dbtune_util.sps,v 1.14.1.0, 2007-08-16 21:49:59Z, Jose Kuruvilla$
$NoKeywords$ */
CREATE OR REPLACE PACKAGE dbtune_util
/***********************************************************************
*
*N  {dbtune_util.sps}  --  Interface for dbtune DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on dbtune table. It should be compiled by the
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
*    Jose Kuruvilla         04/14/2000               Original coding.
*E
***********************************************************************/
IS

   -- Standard identifier for a dbtune record.

   DEF_keyword        NVARCHAR2(32);
   DEF_parameter_name NVARCHAR2(32);
   
   SUBTYPE keyword_t        IS DEF_keyword%TYPE;
   SUBTYPE parameter_name_t IS DEF_parameter_name%TYPE;
 --  SUBTYPE config_string_t  IS DEF_config_string%TYPE;

  /* Constants. */

   -- The following constant defines the release of dbtune_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1006; 
   C_package_guid          CONSTANT VARCHAR2 (32):= '19AAC1FA24A74B6299697F02B2CD2952';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for dbtune table. 
   -- objects stored in the <schema>.DBTUNE table. 

   PROCEDURE update_dbtune (in_keyword        IN  keyword_t,
                            in_parameter_name IN parameter_name_t,
                            in_config_string  IN NCLOB);

   PROCEDURE insert_dbtune (in_keyword        IN  keyword_t,
                            in_parameter_name IN parameter_name_t,
                            in_config_string  IN NCLOB); 

   PROCEDURE delete_dbtune (in_keyword        IN  keyword_t,
                            in_parameter_name IN parameter_name_t);

   PROCEDURE truncate_dbtune;

   PRAGMA RESTRICT_REFERENCES (dbtune_util,WNDS,WNPS); 

END dbtune_util;
/
