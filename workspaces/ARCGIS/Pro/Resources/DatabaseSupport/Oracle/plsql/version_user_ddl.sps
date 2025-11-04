/* $Id: version_user_ddl.sps,v 1.18.1.16, 2011-04-19 21:30:34Z, Peter Aronson$ 
$NoKeywords$ */ 

CREATE OR REPLACE PACKAGE version_user_ddl
/***********************************************************************
*
*N  {version_user_ddl.sps}  --  Interface for user version DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on versions.  It is intended to allow users to perform
*   some of the same operations in SQL as they do via the ArcSDE API or
*   via ArcMap.  It should be compiled by the ArcSDE DBA user; security 
*   is by user name.   
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
*    Peter Aronson             02/12/00               Original coding.
*E
***********************************************************************/
IS

  /* Constants. */

   -- Edit action flags.

   C_edit_action_open   CONSTANT PLS_INTEGER := 1;
   C_edit_action_close  CONSTANT PLS_INTEGER := 2;

   -- The following constant defines the release of version_user_ddl, and is 
   -- used by the installer to determine if the most up to date version of 
   -- the package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1024;
   C_package_guid          CONSTANT VARCHAR2 (32):= '7DF613E1608B4BD59F37E2C8CB9C1509';

   -- The following are used to define the global edit states

   C_edit_state_stop       CONSTANT PLS_INTEGER := 1;
   C_edit_state_start      CONSTANT PLS_INTEGER := 2;

  /* Procedures and functions to manipulate versions. */

   PROCEDURE create_version (parent_name  IN      version_util.version_name_t,
                             name         IN OUT  version_util.version_name_t,
                             name_rule    IN      PLS_INTEGER,
                             access       IN      PLS_INTEGER,
                             description  IN      NVARCHAR2);
 
   PROCEDURE delete_version (name  IN  version_util.version_name_t);

   PROCEDURE edit_version (name         IN  version_util.version_name_t,
                           edit_action  IN  PLS_INTEGER);

  /* Miscellaneous utility functions; not generally called directly. */

   FUNCTION next_row_id (owner            IN  NVARCHAR2,
                         registration_id  IN  NUMBER) RETURN NUMBER;

  /* Support function for obtaining an ArcSDE format 38-character 
     GUID/UUID string. */

   FUNCTION retrieve_guid RETURN NCHAR;
   
   FUNCTION check_mv_release RETURN NVARCHAR2;

   FUNCTION new_branch_state (current_state_id      IN  version_util.state_id_t,
                              current_lineage_name  IN  version_util.state_id_t,
                              new_state_id          OUT version_util.state_id_t)
     RETURN NUMBER;

END version_user_ddl;
/
