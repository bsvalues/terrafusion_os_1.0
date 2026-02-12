/* $Id: st_type_user.sps,v 1.4, 2006-05-10 19:46:38Z, Tom Gigler$ 
$NoKeywords$ */ 
CREATE OR REPLACE Package st_type_user AS
/******************************************************************************
   name:       st_Type_Util
   purpose:

   revisions:
   ver        date        author           description
   ---------  ----------  ---------------  ------------------------------------
   1.0        4/22/2005             1. created this package.
******************************************************************************/

/* constants. */

   -- the following constants are used as return values from sql-callable 
   -- functions of type number, since oracle doesn't allow functions of
   -- type boolean.

   c_false                          Constant number  := 0;
   c_true                           Constant number  := 1;

   -- the following constant is the name of the st_Geometry type dba user.

   c_type_dba                       Constant varchar2(32) := '&1.';

   -- the following constant defines the release of sde_Util, and is used 
   -- by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   c_package_release                Constant pls_integer := 1002;
   C_package_guid                   CONSTANT VARCHAR2 (32):= 'D74C31BAC1B54D0E8ECD96ACC407E378';   
   
   se_success                       Constant number := 0;

   -- Type definitions

   SUBTYPE spat_owner_t             IS &1..ST_GEOMETRY_COLUMNS.owner%TYPE;

   SUBTYPE a_identifier_t           IS VARCHAR2(128);
 
   --  &1. st_Geometry type error codes.  -20000 to conform to oracle convention 
   -- that user-raised exceptions be in the range of -20999 to -20000.
   
  Function type_user Return varchar2;

  Pragma Restrict_References (st_type_user,wnds,wnps);
  Pragma Restrict_References (type_user,wnds,wnps);

End st_type_user;

/
