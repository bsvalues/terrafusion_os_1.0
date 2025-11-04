/* $Id: pinfo_util.sps,v 1.15.1.4, 2010-10-01 18:47:45Z, Kevin Watt$ 
$NoKeywords$ */ 
/* $Id */
CREATE OR REPLACE PACKAGE pinfo_util
/***********************************************************************
*
*N  {pinfo_util.sps}  --  Interface for pinfo DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on process information records.  It should be compiled
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
*    Peter Aronson             01/25/00               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

   -- Standard SDE Id type.

   SUBTYPE sde_id_t IS &1..process_information.sde_id%TYPE;
   SUBTYPE server_id_t IS &1..process_information.server_id%TYPE;
   SUBTYPE sysname_t IS &1..process_information.sysname%TYPE;
   SUBTYPE nodename_t IS &1..process_information.nodename%TYPE;

   -- Standard PINFO record.

   SUBTYPE pinfo_record_t IS &1..process_information%ROWTYPE;

  /* Constants. */

   -- The following constant defines the release of pinfo_util and is used by
   -- the instance startup code to determine if the most up to date version of
   -- the package has been installed.

   C_package_release          CONSTANT PLS_INTEGER := 1018;
   C_package_guid             CONSTANT VARCHAR2 (32):= 'E89D951C07D54E75B3517C630629E91D';

   -- The following constant is the standard prefix for the connection locks
   -- used to by the logoff trigger to determine if a connection is live or
   -- dead.

   C_connection_lock_prefix   CONSTANT VARCHAR2(30) := 'SDE_Connection_ID#';
 
   -- The following constants determine if a process information entry is
   -- for a direct connection or not.

   C_is_direct_connection     CONSTANT VARCHAR2(1) := 'Y';
   C_is_not_direct_connection CONSTANT VARCHAR2(1) := 'N';

   -- The following constants determine if a process information entry is
   -- for xdr_needed or not.

   C_is_xdr_needed CONSTANT VARCHAR2(1) := 'Y';
   C_is_not_xdr_needed CONSTANT VARCHAR2(1) := 'N';

  /* Procedures and Functions. */
   
   -- The following procedures perform DDL operations for PINFO entries stored
   -- in the &1..PROCESS_INFORMATION table.  Each operation is an autonomous
   -- transaction.
   
   PROCEDURE insert_pinfo (sde_id          IN  sde_id_t,
                           server_id       IN  server_id_t,
                           direct_connect  IN  VARCHAR2,
                           sysname         IN  sysname_t,
                           nodename        IN  nodename_t,
                           xdr_needed      IN  VARCHAR2);
   PROCEDURE delete_pinfo (sde_id  IN  sde_id_t);
   PROCEDURE delete_pinfo_by_pid (sde_id   IN  sde_id_t);
   PROCEDURE update_pinfo (pinfo  IN  pinfo_record_t);
   PROCEDURE insert_pinfo_for_proxy (sde_id          IN  sde_id_t,
                                     server_id       IN  server_id_t,
                                     direct_connect  IN  VARCHAR2,
                                     sysname         IN  sysname_t,
                                     nodename        IN  nodename_t,
                                     xdr_needed      IN  VARCHAR2,
                                     proxy_yn        IN  VARCHAR2,
                                     parent_sde_id   IN  sde_id_t);

   -- The following functions gets the unique SDE connection id for this
   -- connection, the difference being is that the 2nd function will return
   -- NULL if there is no set already, while the first function will 
   -- generate and set a new connection id in that case.

   FUNCTION get_sde_id RETURN sde_id_t;
   FUNCTION get_current_sde_id RETURN sde_id_t;

   -- The following procedure is invoked by an SDE user's LOGOFF trigger
   -- to delete any lock or process entries that might have been left behind
   -- by a bad connection.

   PROCEDURE logoff (sde_id          IN  sde_id_t,
                     direct_connect  IN  VARCHAR2);

   -- The following procedure is invoked by first connection to the underlying
   -- Oracle database after startup.  It removes any entries in the process
   -- information or lock tables that may have been left behind by a crash.

   PROCEDURE cleanup (start_token  IN  VARCHAR2);

   -- The following procedure is invoked to cleanup dead connections.

   PROCEDURE purge_unused (new_count  OUT  INTEGER);

END pinfo_util;
/
