/* $Id: st_type_util.sps,v 1.7.1.11, 2011-12-13 01:22:55Z, Kevin Watt$ 
$NoKeywords$ */ 
CREATE OR REPLACE Package st_type_util AS
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

   c_package_release                Constant pls_integer := 1115;
   C_package_guid                   CONSTANT VARCHAR2 (32):= '41FC032ED7C0404EA4DBFC1AF328E38C';

   se_success                       Constant number := 0;
   se_failure                       Constant pls_integer := 1;
   
   Subtype spx_owner_t              IS &1..st_geometry_index.owner%Type;
   Subtype spx_table_t              IS &1..st_geometry_index.table_name%Type;
   Subtype spx_column_t             IS &1..st_geometry_index.column_name%Type;
   Subtype spx_index_t              IS &1..st_geometry_index.index_name%Type;
   Subtype spx_record_t             IS &1..st_geometry_index%Rowtype;

   --  &1. st_Geometry type error codes.  -20000 to conform to oracle convention 
   -- that user-raised exceptions be in the range of -20999 to -20000.
   
   st_no_permissions                Constant number := -20000;
   st_table_exists                  Constant number := -20001;
   st_table_noexist                 Constant number := -20002;
   st_geometry_invalid_type         Constant number := -20003;
   st_spref_noexist                 Constant number := -20004;
   st_no_srid                       Constant number := -20005;
   st_cref_noexist                  Constant number := -20006;
   st_geometry_invalid_shape        Constant number := -20007;
   st_geom_id_seq_noexist           Constant number := -20008;
   st_geom_text_invalid             Constant number := -20009;
   st_geom_text_invalid_dimension   Constant number := -20010;
   st_geom_text_invalid_empty       Constant number := -20011;
   st_relate_invalid_matrix         Constant number := -20012;
   st_geom_invalid_parameter        Constant number := -20014;
   st_geom_invalid_ellipse_field    Constant number := -20015;
   st_geom_invalid_circle_field     Constant number := -20016;
   st_geom_invalid_wedge_field      Constant number := -20017;
   
   st_geom_multiple_srids           Constant number := -20020;
   
   spx_invalid_type                 Constant number := -20080;
   spx_indexid_seq_noexist          Constant number := -20081;
   spx_object_noexist               Constant number := -20082;
   spx_no_srid                      Constant number := -20083;
   spx_no_grid_info                 Constant number := -20084;
   spx_diff_srids                   Constant number := -20085;
   spx_inv_grid_sizes               Constant number := -20086;
   spx_index_id_noexist             Constant number := -20087;
   spx_invalid_number_of_grids      Constant number := -20088;
   spx_delete_err                   Constant number := -20089;
   spx_invalid_release              Constant number := -20090;
   spx_diff_exp_imp_srids           Constant number := -20091;
   spx_max_grids_per_feat           Constant number := -20092;
   spx_no_grids                     Constant number := -20093;
   spx_invalid_transformation       Constant number := -20094;
   spx_invalid_tess_grid            Constant number := -20095;
   spx_invalid_rel_operation        Constant number := -20096;
   spx_invalid_alter_parms          Constant number := -20097;
   spx_invalid_grid_format          Constant number := -20098;
   spx_partition_index_insert       Constant number := -20099;
   spx_partition_not_found          Constant number := -20100;
   spx_partition_error              Constant number := -20101;
   st_invalid_unit_name             Constant number := -20102;
      
  Function get_geom_index_rec    (owner          IN spx_owner_t,
                                  table_name     IN spx_table_t,
                                  column         IN spx_column_t,
                                  spx_rec        IN OUT spx_record_t)
     Return number;
     
  Function type_user Return varchar2;

  Pragma Restrict_References (st_type_util,wnds,wnps);
  Pragma Restrict_References (type_user,wnds,wnps);

End st_type_util;

/
