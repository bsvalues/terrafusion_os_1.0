/* $Id: logfile_util.sps,v 1.8.1.2, 2016-02-03 02:33:12Z, Josefina Santiago$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE logfile_util
/***********************************************************************
*
*N  {logfile_util.sps}  --  Interface for logfiles DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on logfiles.  It should be compiled by the
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
*    Sanjay Magal             06/09/03               Original coding.
*E
***********************************************************************/
IS

   SUBTYPE sde_id_t   IS &1..sde_logfile_pool.sde_id%TYPE;
   SUBTYPE table_id_t IS &1..sde_logfile_pool.table_id%TYPE;
   
   -- The following constant defines the release of version_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.


   C_check_orphans           CONSTANT PLS_INTEGER := 1;
   C_nocheck_orphans         CONSTANT PLS_INTEGER := 2;

   C_package_release         CONSTANT PLS_INTEGER := 1004;
   C_package_guid          CONSTANT VARCHAR2 (32):= 'A993B0E8C0314E368860C1A949046444';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for logfiles
   --These procedures occur in an autonomous transaction.

   PROCEDURE logfile_pool_get_id (in_sde_id     IN  sde_id_t,
                                  check_orphans IN  PLS_INTEGER,
                                  pool_id       OUT table_id_t);

   PROCEDURE logfile_pool_rel_id (pool_id   IN table_id_t);


   PROCEDURE logpool_tab_trunc (in_tab_name IN NVARCHAR2);
                             
   PROCEDURE logdata_tab_trunc (in_tab_name IN NVARCHAR2);
                             
   PROCEDURE drop_lf_data_table (in_table_name IN  NVARCHAR2); 
                             
   PROCEDURE delete_lf_data_table (in_table_name IN  NVARCHAR2,
                                   in_lf_data_id IN  sde_id_t); 
 
   PROCEDURE delete_logfiles_table (in_table_name IN  NVARCHAR2,
                                    in_lf_id IN  sde_id_t); 
 
   PROCEDURE purge_tmp_logs (in_sde_id IN  sde_id_t,
                             in_owner  IN  NVARCHAR2); 
                     
   PRAGMA RESTRICT_REFERENCES (logfile_util,WNDS,WNPS);
  
END logfile_util;
/
