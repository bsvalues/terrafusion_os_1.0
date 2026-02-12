/* $Id: spx_util_10g.sps,v 1.16, 2015-04-15 22:24:23Z, Sanjay Magal$ 
$NoKeywords$ */ 
CREATE OR REPLACE Package spx_util Authid current_user 
/***********************************************************************
*
*n  {spx_util.sps}  --  utility procs/funct for st_spatial_index. 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*p  purpose:
*   this pl/sql package specification defines procedures and functions
*   to perform utility operations to support the st_Spatial_Index domain 
*   index and st_Geometry type.
*e
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*x  legalese:
*
*   copyright 1992-2004 esri
*
*   trade secrets: esri proprietary and confidential
*   unpublished material - all rights reserved under the
*   copyright laws of the united states.
*
*   for additional information, contact:
*   environmental systems research institute, inc.
*   attn: contracts dept
*   380 new york street
*   redlands, california, usa 92373
*
*   email: contracts@esri.com
*   
*e
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*h  history:
*
*    kevin watt          12/02/04               original coding.
*e
***********************************************************************/
IS

    -- type definitions --
    
   c_package_release              Constant pls_integer := 1173;
   C_package_guid                 CONSTANT VARCHAR2 (32):= '';

   TYPE C_Ref_T IS REF CURSOR;
  
   Subtype spx_index_id_t       IS integer;
   Subtype spx_gsize_t          IS &1..st_geometry_index.grid.grid1%Type;
   Subtype spx_owner_t          IS &1..st_geometry_index.owner%Type;
   Subtype spx_table_t          IS &1..st_geometry_index.table_name%Type;
   Subtype spx_column_t         IS &1..st_geometry_index.column_name%Type;
   Subtype st_geom_prop_t       IS &1..st_geometry_columns.properties%Type;
   Subtype spx_record_t         IS &1..st_geometry_index%Rowtype;

   -- standard identifier for a geometry --

   Subtype srid_t               IS &1..st_spatial_references.srid%Type;
   Subtype sr_falsex_t          IS &1..st_spatial_references.x_offset%Type;
   Subtype sr_falsey_t          IS &1..st_spatial_references.y_offset%Type;
   Subtype sr_xyunits_t         IS &1..st_spatial_references.xyunits%Type;
   Subtype spatial_ref_record_t IS &1..st_spatial_references%Rowtype;
   Subtype geocol_record_t      IS &1..st_geometry_columns%Rowtype;
   
   -- ST_Geometry types
   TYPE entity_t   IS TABLE OF integer INDEX BY BINARY_INTEGER;
   TYPE numpts_t   IS TABLE OF integer INDEX BY BINARY_INTEGER;
   TYPE mbr_tab    IS TABLE OF FLOAT INDEX BY BINARY_INTEGER;
   TYPE sridtab    IS TABLE OF INTEGER INDEX BY BINARY_INTEGER;
   TYPE points_t   IS TABLE OF BLOB INDEX BY BINARY_INTEGER;
   TYPE rowid_t    IS TABLE OF ROWID INDEX BY BINARY_INTEGER;

   Type r_env IS Record (minx integer,miny integer,maxx integer,maxy integer);
   Type r_grid_env IS varray(3) OF r_env;
   Type v_grids IS varray(3) OF integer;
   Type v_levels IS varray(3) OF integer;
   
   TYPE tess_cell_r IS RECORD (minx integer,miny integer, maxx integer, maxy integer, dem integer);
   TYPE tess_cell_t IS TABLE OF tess_cell_r INDEX BY BINARY_INTEGER;

   TYPE grid_cell_r IS RECORD (hashkey integer, dem integer, t_cell tess_cell_t);
   TYPE grid_cell_t IS TABLE OF grid_cell_r INDEX BY BINARY_INTEGER;
   
   
   first_fetch                  boolean;
   grid_rows_fetched            pls_integer;
   min_gx_t                     dbms_sql.number_table;
   max_gx_t                     dbms_sql.number_table;
   min_gy_t                     dbms_sql.number_table;
   max_gy_t                     dbms_sql.number_table;
   minx_t                       dbms_sql.number_table;
   miny_t                       dbms_sql.number_table;
   maxx_t                       dbms_sql.number_table;
   maxy_t                       dbms_sql.number_table;
   sp_id_t                      dbms_sql.urowid_table;
   srid_tab                     dbms_sql.number_table;
   
   num_grid_cell                integer;
   grid_cell_dem_t              grid_cell_t;
   interior_rids                &1..bnd_rowid_tab;
   interior_rids_cnt            pls_integer;
   interior_rid_pos             pls_integer;
   grid1                        pls_integer;
   hashgrid_key_min             v_grids;
   hashgrid_key_max             v_grids;
          
   rid_tab                      dbms_sql.urowid_table;
   rid_init                     boolean := False;
   
   entity_tab                   dbms_sql.number_table;
   numpts_tab                   dbms_sql.number_table;
   points_tab                   dbms_sql.blob_table;
   fetch_state                  varchar2(32);
   fetch_pos                    pls_integer DEFAULT 1;
   total_rows                   pls_integer DEFAULT 0;
   srch_geometry                &1..st_geometry;
   test_boundary_fetch          varchar2(32);
   
   relate_disjoint              boolean DEFAULT FALSE;
   def_table_name               varchar2(160);

   Type fetch_env_r IS RECORD (curs number, first_fetch boolean, fetch_state varchar2(10), fetch_pos number, total_rows number,
                               entity_t dbms_sql.number_table, numpts_t dbms_sql.number_table,
                               min_gx_t dbms_sql.number_table,max_gx_t dbms_sql.number_table,
                               min_gy_t dbms_sql.number_table,max_gy_t dbms_sql.number_table,
                               minx_t dbms_sql.number_table, miny_t dbms_sql.number_table,
                               maxx_t dbms_sql.number_table, maxy_t dbms_sql.number_table,
                               points_t dbms_sql.blob_table, srid_t dbms_sql.number_table,
                               rid_t dbms_sql.varchar2_table, interior_rids &1..bnd_rowid_tab,
                               interior_rids_cnt pls_integer, interior_rid_pos pls_integer,
                               test_boundary_fetch varchar2(10),sp_id_t dbms_sql.varchar2_table,
                               gen_grid1 number, gen_grid2 number, gen_grid3 number,srch_geom &1..st_geometry,
                               relate_disjoint boolean, envp_bygridorder boolean);
   Type fetch_env_t is TABLE OF fetch_env_r INDEX BY BINARY_INTEGER;

   fetch_env                    fetch_env_t;
   
   srch_grid_env                &1..spx_util.r_grid_env := &1..spx_util.r_grid_env();
   srch_grid_env_new_grid       &1..spx_util.r_grid_env := &1..spx_util.r_grid_env();
   max_hash_value               integer := 0;

   Subtype table_name_t  IS def_table_name%Type;

   Type r_table_array IS Record (tab_object varchar2(32), curs number,
                                 curs_insert number,curs_delete number,
                                 curs_update number, curs_spatial_join number,
                                 curs_grid1 number,
                                 gsize1 spx_gsize_t,gsize2 spx_gsize_t,gsize3 spx_gsize_t);
   Type table_array_t IS TABLE OF r_table_array INDEX BY binary_integer;

   Type r_cache2 IS Record (table_name spx_table_t,owner spx_owner_t,
                            column spx_column_t,index_id spx_index_id_t,
                            gsize1 spx_gsize_t,gsize2 spx_gsize_t,gsize3 spx_gsize_t,
                            properties st_geom_prop_t, falsex sr_falsex_t,
                            falsey sr_falsey_t,xyunits sr_xyunits_t,
                            srid srid_t,ncurs_array pls_integer,
                            curs_array table_array_t);

   Type cursor_cache_t IS TABLE OF r_cache2  INDEX BY binary_integer;

   curs_type_select               pls_integer := 1;
   curs_type_insert               pls_integer := 2;
   curs_type_update               pls_integer := 3;
   curs_type_delete               pls_integer := 4;
   curs_type_select_spatial_join  pls_integer := 5;
   curs_type_grid1                pls_integer := 6;
   curs_type_ashape               pls_integer := 7;
   
   nlayers                        pls_integer := 0;
   cursor_cache                   cursor_cache_t;

   se_success                     Constant pls_integer := 0;
   se_failure                     Constant pls_integer := 1;
   
   max_grids_per_level            Constant pls_integer := 4;
   grid_level_mask_1              Constant pls_integer := 16777216;
   grid_level_mask_2              Constant pls_integer := 33554432;
   int_max                        Constant pls_integer := 2147483647;
   max_grids_per_feat             Constant pls_integer := 8000;
   
   st_geom_operation_new          Constant pls_integer := 1;
   st_geom_operation_create       Constant pls_integer := 2;
   st_geom_operation_dml          Constant pls_integer := 3;
   st_geom_operation_select       Constant pls_integer := 4;  
   st_geom_operation_drop         Constant pls_integer := 5;
   st_geom_operation_selordbygx   Constant pls_integer := 6;
   
   unknown_case                   Constant pls_integer := 0;
   boundary_case                  Constant pls_integer := 1;
   interior_case                  Constant pls_integer := 2;
   
   curs_shape_empty_null          Constant pls_integer := -1;
   
   mask_load_only                 Constant pls_integer := 1048576;
   mask_has_no_index              Constant pls_integer := 1073741824;
   SULIMIT64                      Constant number := 9007199254740992;
   SE_MIN_GRIDSIZE                Constant number := 256;

  
  -- procedures and functions

   -- the following functions perform ddl operations for layer objects
   -- stored in the &1..layers table.  these procedures all issue a commit
   -- on success.

  Procedure parse_params                 (params            IN  varchar2,
                                          spx_info_r        IN OUT  spx_record_t);

  Procedure parse_params2                (params            IN  OUT varchar2);                                          

  Procedure get_storage_info             (params            IN  varchar2,
                                          st_storage        IN OUT  clob,
                                          st_tablespace     IN OUT  varchar2,
                                          st_pctthreshold   IN OUT  pls_integer);

  Function get_object_info               (ia           IN sys.odciindexinfo,
                                          optype       IN OUT pls_integer,
                                          params       IN varchar2,
                                          spx_info_r   IN OUT spx_record_t,
                                          spref_r      IN OUT spatial_ref_record_t,
                                          properties   IN OUT st_geom_prop_t)
      Return number;

  Function check_cache                   (in_owner     IN varchar2,
                                          in_table     IN varchar2,
                                          in_spatial   IN varchar2, 
                                          spx_info_r   IN OUT spx_record_t,
                                          sp_ref_r     IN OUT spatial_ref_record_t,
                                          properties   IN OUT st_geom_prop_t)
      Return number;

  Procedure add_cache_info               (in_owner     IN varchar2,
                                          in_table     IN varchar2,
                                          in_spatial   IN varchar2,
                                          spx_info_r   IN spx_record_t,
                                          sp_ref_r     IN spatial_ref_record_t,
                                          properties   IN st_geom_prop_t);

  Procedure update_cache_info            (in_owner     IN varchar2,
                                          in_table     IN varchar2,
                                          in_spatial   IN varchar2,
                                          spx_info_r   IN spx_record_t,
                                          sp_ref_r     IN spatial_ref_record_t,
                                          properties   IN st_geom_prop_t);
                                          
  Procedure delete_cache_info            (spx_info_r   IN spx_record_t);
                           
  Procedure close_partition_table_cursor (curs  IN number);
                           
  Procedure compute_feat_grid_envp       (gsize1    IN integer,
                                          gsize2    IN integer,
                                          gsize3    IN integer,
                                          e_minx    IN integer,
                                          e_miny    IN integer,
                                          e_maxx    IN integer,
                                          e_maxy    IN integer,
                                          g_minx    OUT integer,
                                          g_miny    OUT integer,
                                          g_maxx    OUT integer,
                                          g_maxy    OUT integer);

  Function get_partition_curs            (pos             IN integer,
                                          partition_name  IN varchar2,
                                          type            IN   pls_integer,
                                          grid_info       IN OUT sp_grid_info)
     Return number;

  Procedure set_partition_curs           (pos             IN integer,
                                          curs            IN number,
                                          partition_name  IN varchar2,
                                          spx_info_r      IN spx_record_t,
                                          type            IN pls_integer);

  Function get_curs                      (pos            IN integer,
                                          type           IN pls_integer)
     Return number;

  Procedure set_curs                     (pos            IN integer,
                                          curs           IN number,
                                          type           IN pls_integer);

  Procedure execute_spatial              (ia             sys.odciindexinfo,
                                          table_name     IN  varchar2,
                                          spx_info_r     IN OUT  &1..spx_util.spx_record_t,
                                          sp_ref_r       IN  &1..spx_util.spatial_ref_record_t,
                                          int_env_r      IN  &1..spx_util.r_env,
                                          curs           OUT integer);

 Procedure execute_spatial_join          (ia              IN  sys.odciindexinfo,
                                          op              IN  sys.odcipredinfo,
                                          table_name      IN  varchar2,
                                          spx_info_r      IN OUT  &1..spx_util.spx_record_t,
                                          sp_ref_r        IN  &1..spx_util.spatial_ref_record_t,
                                          int_env_r       IN  &1..spx_util.r_env,
                                          curs            OUT integer);

  Procedure execute_spatial_gridorder    (ia             sys.odciindexinfo,
                                          table_name     IN  varchar2,
                                          spx_info_r     IN  &1..spx_util.spx_record_t,
                                          sp_ref_r       IN  &1..spx_util.spatial_ref_record_t,
                                          int_env_r      IN  &1..spx_util.r_env,
                                          curs           OUT integer);

  Function exec_delete                   (ia             sys.odciindexinfo,
                                          idx_name       IN varchar2,
                                          spx_info_r     IN spx_record_t,
                                          rid            IN varchar2) 
      Return number;

  Procedure insert_index                 (spx_info_r     IN OUT spx_record_t);

  Procedure update_index                 (spx_info_r     IN  spx_record_t,
                                          owner_in       IN spx_owner_t,
                                          table_in       IN spx_table_t,
                                          column_in      IN spx_column_t);
   
  Procedure delete_index                 (del_index_id   IN integer);
                   
  Procedure set_column_stats             (owner          IN VARCHAR2,
                                          table_name     IN VARCHAR2,
                                          column_name    IN VARCHAR2,
                                          distcnt        IN NUMBER DEFAULT NULL,
                                          nullcnt        IN NUMBER DEFAULT NULL);

  Procedure set_index_stats              (owner          IN VARCHAR2,
                                          table_name     IN VARCHAR2,
                                          index_name     IN VARCHAR2,
                                          numrows        IN NUMBER DEFAULT NULL,
                                          numlblks       IN NUMBER DEFAULT NULL,
                                          clstfct        IN NUMBER DEFAULT NULL,
                                          density        IN NUMBER DEFAULT NULL,
                                          indlevel       IN NUMBER DEFAULT NULL);

  Procedure set_operator_cost            (owner          IN VARCHAR2,
                                          table_name     IN VARCHAR2,
                                          column_name    IN VARCHAR2,
                                          operator_name  IN VARCHAR2,
                                          cost           IN integer);

  Procedure delete_operator_cost         (owner          IN VARCHAR2,
                                          table_name     IN VARCHAR2,
                                          column_name    IN VARCHAR2,
                                          operator_name  IN VARCHAR2);

  Procedure set_operator_selectivity     (owner          IN VARCHAR2,
                                          table_name     IN VARCHAR2,
                                          column_name    IN VARCHAR2,
                                          operator_name  IN VARCHAR2,
                                          sel            IN integer);

  Procedure delete_operator_selectivity  (owner          IN VARCHAR2,
                                          table_name     IN VARCHAR2,
                                          column_name    IN VARCHAR2,
                                          operator_name  IN VARCHAR2);

  Procedure rename_spatial_index         (owner          IN varchar2,
                                          table_name     IN varchar2,
                                          column_name    IN varchar2,
                                          new_index_name IN varchar2);

  Procedure rename_spatial_table         (owner          IN varchar2,
                                          table_name     IN varchar2,
                                          new_table_name IN varchar2);
                                          
  Procedure gen_cell_arrays              (shape          IN &1..st_geometry,
                                          operation      IN Integer,
                                          distance       IN number,
                                          gsize1         IN Integer,
                                          gsize2         IN Integer,
                                          gsize3         IN Integer,
                                          num_grid_cell  IN Out Integer,
                                          grid_cell_dem  IN Out &1..spx_util.grid_cell_t,
                                          gen_grid1      IN OUT number,
                                          gen_grid2      IN OUT number,
                                          gen_grid3      IN OUT number);
                                          
  Procedure grid_search_prepare          (ia              IN  sys.odciindexinfo,
                                          table_name      IN  varchar2,
                                          spx_info_r      IN OUT  &1..spx_util.spx_record_t,
                                          sp_ref_r        IN  &1..spx_util.spatial_ref_record_t,
                                          srch_shape      IN  &1..st_geometry,
                                          operation       IN  Integer,
                                          distance        IN  number,
                                          curs_select     OUT integer);
                                          
  Function grid_search_execute           (curs1           IN number,
                                          owner_name      IN varchar2,
                                          table_name      IN varchar2,
                                          sp_col          IN varchar2,
                                          operation       IN varchar2,
                                          srch_geom       IN &1..st_geometry,
                                          distance        IN number, 
                                          rids            OUT NOCOPY sys.odciridlist,
                                          env             IN sys.odcienv)
  Return number;
  
  Procedure test_boundary_rids           (owner_name         IN varchar2,
                                          table_name         IN varchar2,
                                          sp_col             IN varchar2,
                                          bshape             IN &1..st_geometry,
                                          distance           IN number,
                                          operation          IN varchar2,
                                          boundary_rids      IN &1..bnd_rowid_tab,
                                          boundary_rids_cnt  IN pls_integer,
                                          interior_rids      IN OUT &1..bnd_rowid_tab,
                                          interior_rids_cnt  IN OUT pls_integer);
                                          
  Function check_search_geom_srid        (ia          IN sys.odciindexinfo,
                                          srch_geom   IN &1..st_geometry,
                                          shape_out   IN OUT &1..st_geometry)
   Return number;

  Procedure insert_partition             (owner_name         IN varchar2,
                                          table_name         IN varchar2,
                                          column_name        IN varchar2,
                                          partition_name     IN varchar2,
                                          spx_info_r         IN &1..spx_util.spx_record_t);

  Procedure delete_partition             (owner_in           IN varchar2,
                                          table_in           IN varchar2,
                                          column_in          IN varchar2,
                                          partition_in       IN varchar2,
                                          index_id           IN spx_index_id_t,
                                          properties      IN st_geom_prop_t);

  Function get_partition_name            (partition_name  IN varchar2,
                                          properties      IN st_geom_prop_t,
                                          index_id        IN spx_index_id_t)
  Return varchar2;

  Procedure get_partition_grids          (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          column_in       IN varchar2,
                                          partition_in    IN varchar2,
                                          properties      IN st_geom_prop_t,
                                          spx_info_r      IN OUT &1..spx_util.spx_record_t);

  Procedure update_partition_stats       (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          column_in       IN varchar2,
                                          partition_in    IN varchar2,
                                          blevel_in       IN number,
                                          leafblocks_in   IN number,
                                          clstfct_in      IN number,
                                          avgcellcnt_in   IN number,
                                          numrows_in      IN number,
                                          samplesize_in   IN number,
                                          distkeys_in     IN number,
                                          minx_in         IN number,
                                          miny_in         IN number,
                                          maxx_in         IN number,
                                          maxy_in         IN number);

  Procedure update_index_table           (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          column_in       IN varchar2,
                                          index_in        IN varchar2);

  Procedure update_index_stats           (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          column_in       IN varchar2,
                                          blevel_in       IN number,
                                          leafblocks_in   IN number,
                                          clstfct_in      IN number,
                                          avgcellcnt_in   IN number,
                                          numrows_in      IN number,
                                          samplesize_in   IN number,
                                          distkeys_in     IN number);

  Procedure update_index_mbr             (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          column_in       IN varchar2,
                                          eminx           IN number,
                                          eminy           IN number,
                                          emaxx           IN number,
                                          emaxy           IN number);

  Procedure update_partition_index_mbr   (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          partition_in    IN varchar2,
                                          eminx           IN number,
                                          eminy           IN number,
                                          emaxx           IN number,
                                          emaxy           IN number);

  Procedure update_index_numnulls        (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          column_in       IN varchar2,
                                          num_nulls       IN number);

  Procedure update_partition_numnulls    (owner_in        IN varchar2,
                                          table_in        IN varchar2,
                                          column_in       IN varchar2,
                                          partition_in    IN varchar2,
                                          num_nulls       IN number);

  Procedure update_partition_name        (spx_info_r      IN &1..spx_util.spx_record_t,
                                          properties      IN &1..spx_util.st_geom_prop_t,
                                          partition_in    IN varchar2,
                                          new_partition   IN varchar2);

  Procedure calc_extent                  (ia           IN sys.odciindexinfo,
                                          eminx        IN OUT number,
                                          eminy        IN OUT number,
                                          emaxx        IN OUT number,
                                          emaxy        IN OUT number);

  Procedure update_layers_sp_mode (owner_in   IN      varchar2,
                                   table_in   IN      varchar2,
                                   column_in  IN      varchar2,
                                   sp_mode    IN      pls_integer);

  Pragma Restrict_References (spx_util,wnds,wnps);

End spx_util;
/  

