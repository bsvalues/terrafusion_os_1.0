CREATE OR REPLACE PACKAGE branch_util
/***********************************************************************
*
*N  {branch_util.sps}  --  Implementation for BRANCH table  
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification implements the procedures to 
*   perform DML operations on the BRANCHES and BRANCH_TABLES_MODIFIED
*   table. It should be compiled by the SDE DBA user; security is by
*   user name.   
*E
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*X  Legalese:
*
*   COPYRIGHT 1992-2016 ESRI
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
*    Kevin Watt             12/15/2015               Original coding.
*E
***********************************************************************/
IS

  C_package_release       CONSTANT PLS_INTEGER := 1023;
  C_package_guid          CONSTANT VARCHAR2 (32):= '340AE16279704DA196CB056E88334F78';

    -- Session Globals to manage mutlibranch editing in the INSTEAD OF trigger.

  G_edit_moment                      TIMESTAMP(3);
  G_ancestor_moment                  TIMESTAMP(3);
  G_branch_id                        INTEGER;
  G_username                         &1..sde_util.identifier_t;
  G_session_guid                     CHAR(38);

  -- Type Definitions

  SUBTYPE branch_name_t              IS &1..branches.name%TYPE;
  SUBTYPE branch_owner_t             IS &1..branches.owner%TYPE;
  SUBTYPE branch_id_t                IS &1..branches.branch_id%TYPE;
  SUBTYPE description_t              IS &1..branches.description%TYPE;
  SUBTYPE status_t                   IS &1..branches.status%TYPE;
  SUBTYPE branch_moment_t            IS &1..branches.branch_moment%TYPE;
  SUBTYPE ancestor_moment_t          IS &1..branches.ancestor_moment%TYPE;
  SUBTYPE reconcile_moment_t         IS &1..branches.last_reconcile_moment%TYPE;
  SUBTYPE service_name_t             IS &1..branches.service_name%TYPE;
  SUBTYPE mb_tables_regid_t          IS &1..multibranch_tables.registration_id%TYPE;
  SUBTYPE mb_tables_behavior_t       IS &1..multibranch_tables.behavior_map%TYPE;


  SUBTYPE branch_record_t            IS &1..branches%ROWTYPE;
  SUBTYPE branch_table_mod_t         IS &1..branch_tables_modified%ROWTYPE;
  SUBTYPE mb_tables_record_t         IS &1..multibranch_tables%ROWTYPE;

  -- Constants

   C_sde_dba                         CONSTANT  &1..sde_util.identifier_t := UPPER(N'&1.');
   C_default_branch                  CONSTANT VARCHAR2(32) := 'DEFAULT';
   C_default_branch_id               CONSTANT INTEGER := 0;

   -- Session Global Procedures 

  PROCEDURE get_branch_session       (branch_id             OUT  INTEGER,
                                      edit_moment           OUT  TIMESTAMP,
                                      ancestor_moment       OUT  TIMESTAMP,
                                      username              OUT  NVARCHAR2);

  PROCEDURE set_branch_session      (branch_id              IN      INTEGER,
                                     edit_moment            IN OUT  TIMESTAMP,
                                     ancestor_moment        IN      TIMESTAMP,
                                     username               IN      NVARCHAR2);

   -- Procedures and Functions for BRANCHES 

  PROCEDURE insert_branch            (branch                IN   branch_record_t);

  PROCEDURE delete_branch            (branch_id_i           IN   INTEGER);

  PROCEDURE update_branch_moment     (branch_id_i           IN   INTEGER,
                                      branch_moment_i       IN   TIMESTAMP);

  PROCEDURE update_ancestor_moment   (branch_id_i           IN   INTEGER,
                                      ancestor_moment_i     IN   TIMESTAMP);

  PROCEDURE update_reconcile_moment  (branch_id_i           IN   INTEGER,
                                      reconcile_moment_i    IN   TIMESTAMP);

  PROCEDURE update_status            (branch_id_i           IN   INTEGER,
                                      status_i              IN   INTEGER);

  PROCEDURE update_description       (branch_id_i           IN   INTEGER,
                                      description_i         IN   NVARCHAR2);

  PROCEDURE update_validation_moment (branch_id_i           IN  INTEGER,
                                      validation_moment_i   IN  TIMESTAMP);

  PROCEDURE update_owner             (branch_id_i           IN  INTEGER,
                                      new_owner_i           IN  NVARCHAR2);

  PROCEDURE update_name              (branch_id_i           IN  INTEGER,
                                      new_name_i            IN  branch_name_t);

  -- Deprecated functions.

  PROCEDURE rename_branch            (owner_i               IN  branch_owner_t, -- Use update_name.
                                      old_name              IN  branch_name_t,
                                      new_name              IN  branch_name_t);

  -- Functions

  FUNCTION get_branch_id
    RETURN INTEGER;

  FUNCTION get_ancestor_moment
    RETURN TIMESTAMP;

  FUNCTION get_edit_moment
    RETURN TIMESTAMP;

  FUNCTION get_database_time_in_utc
    RETURN DATE;

  FUNCTION get_utc_time_string
    RETURN VARCHAR2;

  FUNCTION branch_get_last_edit_moment (branch_id_i   IN   branch_id_t)
    RETURN TIMESTAMP; 

  -- Procedures and Functions for BRANCH_TABLES_MODIFIED 

  PROCEDURE insert_branch_tables_mod        (branch_id_i        IN   branch_id_t,
                                             reg_id_i           IN   INTEGER,
                                             edit_moment_i      IN   TIMESTAMP);

  PROCEDURE delete_branch_tables_mod        (branch_id_i        IN   branch_id_t,
                                             delete_moment_i    IN   TIMESTAMP);

  PROCEDURE reconcile_branch_tables_mod     (branch_id_i        IN   branch_id_t,
                                             reconcile_moment_i IN   TIMESTAMP);

  PROCEDURE reconcile_branch_table_mod      (branch_id_i        IN   branch_id_t,
                                             reg_id_i           IN   INTEGER,
                                             reconcile_moment_i IN   TIMESTAMP);

  PROCEDURE trim_branch_tables_mod          (branch_id_i        IN   branch_id_t,
                                             branch_moment_i    IN   TIMESTAMP,
                                             trim_moment_i      IN   TIMESTAMP);

  PROCEDURE post_branch_tables_mod          (branch_id_i        IN   branch_id_t,
                                             post_moment_i      IN   TIMESTAMP);

  PROCEDURE post_branch_table_mod           (branch_id_i        IN   branch_id_t,
                                             reg_id_i           IN   INTEGER,
                                             post_moment_i      IN   TIMESTAMP);

  PROCEDURE delete_branch_tables_mod_by_id  (reg_id_i           IN   INTEGER);

  PROCEDURE delete_branch_tables_mod_purge   (branch_id_i        IN   branch_id_t,
                                              reg_id_i           IN  INTEGER);

  PROCEDURE delete_branch_tables_mod_delete_regid_moment  (branch_id_i   IN   branch_id_t,
                                                           del_moment_i  IN   TIMESTAMP,
                                                           reg_id_i      IN   INTEGER);

  PROCEDURE update_branch_tables_mod_by_id_regid_moment  (branch_id_i        IN   branch_id_t,
                                                          reg_id_i           IN   INTEGER,
                                                          edit_moment_i      IN   TIMESTAMP, 
                                                          branch_id_val_i    IN   branch_id_t, 
                                                          edit_moment_val_i  IN   TIMESTAMP);

  -- Procedures and Functions for MULTIBRANCH_TABLES

  PROCEDURE insert_mb_tables                (mbt                IN   mb_tables_record_t);

  PROCEDURE delete_mb_tables                (regid_i            IN   mb_tables_regid_t);

  PROCEDURE update_mb_tables_behavior_map   (regid_i            IN   mb_tables_regid_t,
                                             behavior_i         IN   mb_tables_behavior_t);

  PROCEDURE get_mb_tables_by_id             (regid_i            IN   mb_tables_regid_t,
                                             mbt                OUT  mb_tables_record_t);

END branch_util;
/
