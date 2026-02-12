/* $Id: version_util.sps,v 1.50.1.16, 2015-08-28 15:40:46Z, Sanjay Magal$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE version_util
/***********************************************************************
*
*N  {version_util.sps}  --  Interface for version and state DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on versions and states.  It should be compiled by the
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
*    Peter Aronson             12/09/98               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

   -- Standard identifier for a state.

   SUBTYPE state_id_t IS &1..states.state_id%TYPE;

   -- An array of state ids.
 
   TYPE state_list_t IS TABLE OF state_id_t INDEX BY BINARY_INTEGER;

   -- Standard version name type, can be of the form <owner>.<version> or
   -- of the form <version>, in which case owner is USER.

   DEF_version_name  NVARCHAR2(97);
   SUBTYPE version_name_t IS DEF_version_name%TYPE; 

   -- 7.3.3-style interface for the version record.  At 8i will probably be
   -- replaced by an object type.  Or maybe not.

   SUBTYPE version_record_t IS &1..versions%ROWTYPE;

  /* Constants. */

   -- The root state of the state tree.

   C_base_state_id         CONSTANT state_id_t := 0;

   -- State creation flags.

   C_state_is_open         CONSTANT PLS_INTEGER := 1;
   C_state_is_closed       CONSTANT PLS_INTEGER := 2;

   -- Standard default version name.  While this is always created by SDE
   -- at instance initialization, it can be deleted, and so may not exist.

   C_default_version       CONSTANT VARCHAR2(32) := 'DEFAULT';

   -- The following are mnemonic keywords for the name_rule 
   -- parameter of the insert_version procedure.

   C_generate_unique_name  CONSTANT PLS_INTEGER := 1;
   C_take_name_as_given    CONSTANT PLS_INTEGER := 2;

   -- The following are values of VERSIONS status column for various levels
   -- of access.

   C_version_private       CONSTANT PLS_INTEGER := 0;
   C_version_public        CONSTANT PLS_INTEGER := 1;
   C_version_protected     CONSTANT PLS_INTEGER := 2;

   C_def_preserve_edits_param  CONSTANT NVARCHAR2(32) := 'SQLDEFPRESERVEEDITS';
   C_def_preserve_h_param      CONSTANT NVARCHAR2(32) := 'SQLDEFPRESERVEH';

   -- The following global flag is used to determine the edit version
   -- type - Standard or Default. Trigger bodies support both modes. 
   -- The default mode is DEFAULT. The call to edit_version w/ and
   -- edit_action of 'open' sets the edit_mode_default to FALSE.

   G_edit_mode_default     BOOLEAN NOT NULL DEFAULT TRUE;
   G_default_version_set   BOOLEAN NOT NULL DEFAULT FALSE;

   -- The following are used to define the global edit states

   C_edit_state_stop       CONSTANT PLS_INTEGER := 1;
   C_edit_state_start      CONSTANT PLS_INTEGER := 2;

   -- The following global flag caches the owner/named version

   G_version_owner         version_name_t NOT NULL DEFAULT &1..sde_util.C_sde_dba;
   G_version_name          version_name_t NOT NULL DEFAULT UPPER('DEFAULT');

   -- The following global flag manages the edit state 

   G_edit_state            PLS_INTEGER NOT NULL DEFAULT C_edit_state_stop;

   -- Multiversion View Default Editing mode to indicate if edits should be
   -- preserved when at state 0. (For any insert, update, or delete, always
   -- add new records to the delta and _H tables).

   G_edit_mode_def_preserve_edits      BOOLEAN NOT NULL DEFAULT FALSE;

   -- Multiversion View Default Editing mode to indicate if archive edits
   -- should be preserved when making an update. (For any update, always
   -- add new records to the just the _H table).
   
   G_edit_mode_def_preserve_h          BOOLEAN NOT NULL DEFAULT FALSE;

   -- Multiversion View SQL batch edit trigger mode to indicate the edit 
   -- should wait one second to ensure the next edit does not cause a
   -- constraint violation on the archive table DATE. 

   G_sql_batch_edit      BOOLEAN NOT NULL DEFAULT FALSE;

   -- The following value is tested to see if we should generate state ids
   -- using a sequence. (Only expected to be used by Reliance.)

   C_def_stateid_sequence_param  CONSTANT NVARCHAR2(32) := 'USESTATEIDSEQUENCE';

   -- The following constant defines the release of version_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1084;
   C_package_guid          CONSTANT VARCHAR2 (32):= '21D9F25749BA4939B7276308645761B5';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for state objects
   -- stored in the &1..STATES table.  These procedures occur in an
   -- autonomous transaction.

   PROCEDURE insert_state (parent_state_id      IN  state_id_t,
                           parent_lineage_name  IN  state_id_t,
                           open_or_closed       IN  PLS_INTEGER,
                           new_state_id         OUT state_id_t,
                           new_lineage_name     OUT state_id_t,
                           new_state_time       OUT DATE); 
   PROCEDURE close_state (state_id              IN  state_id_t,
                          state_close_time      OUT DATE);
   PROCEDURE open_state (state_id               IN  state_id_t,
                        state_close_time        OUT DATE);  
   PROCEDURE trim_state (high_state_id  IN  state_id_t,
                         low_state_id   IN  state_id_t,
                         delete_list    IN  state_list_t);

   -- The following functions perform DDL operations for state objects
   -- stored in the &1..STATES table.  They expect a commit to performed
   -- externally on success.

   PROCEDURE new_edit_state (parent_state_id      IN  state_id_t,
                             new_state_id         OUT state_id_t,
                             new_lineage_name     OUT state_id_t,
                             new_state_time       OUT DATE); 

   -- The following functions perform DDL operations for state objects
   -- stored in the &1..STATES table.  These procedures all issue a COMMIT
   -- on success.

   PROCEDURE delete_states (state_list  IN  state_list_t);  -- Arbitrary list.

   -- The following functions perform DDL operations for version objects
   -- stored in the &1..VERSIONS table.  These procedures occur in an
   -- autonomous transaction.

   PROCEDURE insert_version (version           IN   version_record_t,
                             name_rule         IN   PLS_INTEGER,
                             new_version_name  OUT  &1..versions.name%TYPE);
   PROCEDURE update_version (version  IN  version_record_t);
   PROCEDURE delete_version (name  IN  version_name_t);
   PROCEDURE change_version_state (name          IN  version_name_t,
                                   old_state_id  IN  state_id_t,
                                   new_state_id  IN  state_id_t);
   PROCEDURE rename_version (owner     IN  &1..versions.owner%TYPE,
                             old_name  IN  &1..versions.name%TYPE,
                             new_name  IN  &1..versions.name%TYPE);

   -- The following variant procedures occur in the user transaction context.

   PROCEDURE insert_version_in_trans 
                                (version           IN   version_record_t,
                                 name_rule         IN   PLS_INTEGER,
                                 new_version_name  OUT  &1..versions.name%TYPE);
   PROCEDURE change_version_state_in_trans (name          IN  version_name_t,
                                            old_state_id  IN  state_id_t,
                                            new_state_id  IN  state_id_t);

   -- The following procedure updates the time last modified for a specifed
   -- lineage.  It occurs in a autonomous transaction.

   PROCEDURE touch_lineage (lineage_name        IN  state_id_t,
                            time_last_modified  IN  DATE);

   -- The following procedures perform utility operations required by the
   -- optional version_user_ddl package.

   PROCEDURE parse_version_name (version_name  IN  version_name_t,
                                 parsed_name   OUT &1..versions.name%TYPE,
                                 parsed_owner  OUT &1..versions.owner%TYPE);

   -- The following procedure performs DML operations on the MVTABLES_MODIFIED
   -- table.  Unlike the above procedures, it does not issue commits, as entries
   -- to the MVTABLES_MODIFIED tables are part of the transaction in which
   -- they occur.

   PROCEDURE flag_mvtable_modified 
                               (mvtable_id  IN  registry_util.registration_id_t,
                                state_id    IN  state_id_t);

   -- The following procedure deletes from the mvtables_modified table based on
   -- an array of registration ids and a state list subquery with the base state
   -- being the low state id.

   PROCEDURE del_mvmod_base_save(reg_list     IN registry_util.reg_list_t,
                                 high_id      IN state_id_t,
                                 lineage_name IN state_id_t);

   -- This procedure raises an appropriate exception if for any reason the
   -- pair of states are not legal for a range deletion.

   PROCEDURE range_delete_ok (start_state  IN  state_id_t,
                              end_state    IN  state_id_t);

   -- These procedures and functions are used by or with intellegent 
   -- multiversion views: set_current_version sets the state for such views, 
   -- current_version_writable raises an appropriate exception if the
   -- current user can not write to the currently set version for any reason,
   -- the functions are used in IMV views or in their triggers and
   -- current_version_not_default is used by views on archiving tables to
   -- prevent them from being written to while in the default version.

   PROCEDURE current_version_writable;
   PROCEDURE set_current_version (version_name  IN  version_name_t);
   FUNCTION in_current_lineage (state_id IN NUMBER) RETURN NUMBER;
   FUNCTION current_state RETURN NUMBER;
   PROCEDURE current_version_not_default;
   PROCEDURE set_default;
   FUNCTION get_lineage RETURN NUMBER;
   FUNCTION get_lineage_list RETURN NUMBER;
   PROCEDURE preserve_edits (preserve_mode IN BOOLEAN DEFAULT TRUE);
   PROCEDURE preserve_h (preserve_h_mode IN BOOLEAN DEFAULT TRUE);
   PROCEDURE set_batch_mode (sql_batch_mode IN BOOLEAN DEFAULT TRUE);

END version_util;
/
