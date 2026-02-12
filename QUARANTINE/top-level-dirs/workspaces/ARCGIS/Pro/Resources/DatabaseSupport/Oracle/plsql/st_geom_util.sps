/* $id: st_Geom_Util.sps,v 1.2 2005/03/30 22:10:55 gaut3693 exp $ */

CREATE OR REPLACE Package st_geom_util 
/***********************************************************************
*
*n  {st_Geom_Util.sps}  --  st_Geometry type functions and procedures.
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*p  purpose:
*     this pl/sql package specification defines st_Geometry type 
*    constructor functions/procedures to instantiate a st_Geometry 
*    row.
*e
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*x  legalese:
*
*   copyright 1992-2005 esri
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
  
  c_package_release             Constant pls_integer := 1127;
  C_package_guid                CONSTANT VARCHAR2 (32):= '612C5D2BB4644D94874D68EB70B17D32';
  
   -- Minimum version of the corresponding type library
  libMajor constant pls_integer := 1;
  libMinor constant pls_integer := 0;
  libBug   constant pls_integer := 1;
  
  sys_units_limit               Constant number := 9007199254740992;
  SG_M_NODATA                   Constant pls_integer := -1;
  
  feature_3D_mask               Constant pls_integer := 1;
  feature_measure_mask          Constant pls_integer := 2;
  format_high_precision         Constant pls_integer := 1;

  sg_nil_shape                  Constant pls_integer := 0;
  sg_point_shape                Constant pls_integer := 1;
  sg_line_shape                 Constant pls_integer := 2;
  sg_simple_line_shape          Constant pls_integer := 4;
  sg_area_shape                 Constant pls_integer := 8;
  sg_shape_class_mask           Constant pls_integer := 255; -- mask all of the previous 
  sg_shape_multi_part_mask      Constant pls_integer := 256; -- bit flag indicates mult parts 
  sg_multi_point_shape          Constant pls_integer := 257;
  sg_multi_line_shape           Constant pls_integer := 258;
  sg_multi_simple_line_shape    Constant pls_integer := 260;
  sg_multi_area_shape           Constant pls_integer := 264;
  sg_illegal_shape              Constant pls_integer := 1000;
  
    -- sqlcomn.h geomerty type codes 

  unspecified_type              Constant pls_integer := 0;
  point_type                    Constant pls_integer := 4;
  pointm_type                   Constant pls_integer := 5;
  pointz_type                   Constant pls_integer := 6;
  pointzm_type                  Constant pls_integer := 7;
  multipoint_type               Constant pls_integer := 8;
  multipointm_type              Constant pls_integer := 9;
  multipointz_type              Constant pls_integer := 10;
  multipointzm_type             Constant pls_integer := 11;
  linestring_type               Constant pls_integer := 12;
  linestringm_type              Constant pls_integer := 13;
  linestringz_type              Constant pls_integer := 14;
  linestringzm_type             Constant pls_integer := 15;
  polygon_type                  Constant pls_integer := 16;
  polygonm_type                 Constant pls_integer := 17;
  polygonz_type                 Constant pls_integer := 18;
  polygonzm_type                Constant pls_integer := 19;
  multilinestring_type          Constant pls_integer := 20;
  multilinestringm_type         Constant pls_integer := 21;
  multilinestringz_type         Constant pls_integer := 22;
  multilinestringzm_type        Constant pls_integer := 23;
  multipolygon_type             Constant pls_integer := 24;
  multipolygonm_type            Constant pls_integer := 25;
  multipolygonz_type            Constant pls_integer := 26;
  multipolygonzm_type           Constant pls_integer := 27;
  
  st_geometry_type              Constant pls_integer := 100;
  st_geomcollection_type        Constant pls_integer := 101;
  
    -- The following relational constants must stay in-sync 
    -- with the st_relation_operators relational constants. 

  intersects_c                  Constant pls_integer := 1;
  within_c                      Constant pls_integer := 2;
  overlaps_c                    Constant pls_integer := 3;
  touches_c                     Constant pls_integer := 4;
  contains_c                    Constant pls_integer := 5;
  crosses_c                     Constant pls_integer := 6;
  orderingequals_c              Constant pls_integer := 7;
  equals_c                      Constant pls_integer := 8;
  disjoint_c                    Constant pls_integer := 9;
  distance_c                    Constant pls_integer := 10;
  relate_c                      Constant pls_integer := 11;
  buffer_intersects_c           Constant pls_integer := 12;
  distance_within_c             Constant pls_integer := 13;
  
  -- The following coordinate error is from sql3\oracle\sqlerrors.h 
  
  sg_coordref_out_of_bounds     Constant pls_integer := -2021;
  st_incompatible_shapes        Constant pls_integer := 20801;
  st_coord_out_of_bounds        Constant pls_integer := 20807;
  st_pshape_inv_numpts          Constant pls_integer := 20828;
  st_pshape_inv_angle           Constant pls_integer := 20829;
  st_pshape_inv_maj_min_axis    Constant pls_integer := 20830;
  st_pshape_inv_radius          Constant pls_integer := 20831;

  LAYERS_HAS_INDEX              Constant pls_integer := 1;
  LAYERS_NO_INDEX               Constant pls_integer := 2;

  ST_GEOM_PROP_PARTITION_INDEX  Constant pls_integer := 2;

  ST_SRID_EPSG_WGS84            Constant pls_integer :=  4326;
  
  SG_GeoHex_Vertical           Constant pls_integer :=  1;
  SG_GeoHex_Horizontal         Constant pls_integer :=  2;

  -- shape type 
  Type shape_r IS Record (numpts number,entity number,minx number,miny number,
                          maxx number,maxy number,minz number,maxz number,
                          minm number,maxm number,area number,len number,
                          srid number,points blob);
  
  Type geom_type_t IS varray(12) OF varchar2(20);
  geometry_type       geom_type_t := geom_type_t('POINT ZM','POINT Z','POINT M','POINT',
                                                 'LINESTRING ZM', 'LINESTRING Z', 'LINESTRING M','LINESTRING',
                                                 'POLYGON ZM','POLYGON Z','POLYGON M','POLYGON');

  Type gtype_t IS varray(4) OF number;
  
  TYPE grid_info_t IS Record (g1 number,g2 number,g3 number);

  point             gtype_t := gtype_t(7,6,5,4);	
  mpoint            gtype_t := gtype_t(11,10,9,8);
  lstring           gtype_t := gtype_t(15,14,13,12);
  poly              gtype_t := gtype_t(19,18,17,16);
  mlstring          gtype_t := gtype_t(23,22,21,20);
  mpoly             gtype_t := gtype_t(27,26,25,24);
   
  srid_tab          dbms_sql.number_table;
  count_tab         dbms_sql.number_table;

  Procedure get_type           (geom_str      IN Out  clob,
                                entity        IN Out  number,
                                geom_type     IN Out  number,
                                is_empty      IN Out  boolean,
                                type_in       IN      number);


  Procedure get_name           (entity        IN      number,
                                name          IN Out  varchar2);

  Procedure validate_geom_srid (owner         IN      varchar2,
                                table_name    IN      varchar2,
                                column_name   IN      varchar2,
                                srid          IN OUT  integer);
                                
  Procedure  encode_var   (value_in           IN         number,
                           r_final            IN Out     raw);

  Function convert_to_system   (planeValue    IN      number,
                                false_origin  IN      number,
                                units         IN      number)
    Return number;

  Function get_relation_operation (matrix  varchar2)
    Return varchar2;

  Function getLibraryVersion  (component in binary_integer) 
   Return number deterministic;
   
  Function getLibraryVersion 
   Return varchar2 deterministic;
  
  Function checkLibraryVersion 
   Return varchar2 deterministic;
  
  Function isWindows 
   Return number deterministic;
   
  Function sdexml_to_text_f(xml blob)
    Return clob deterministic;

  $IF DBMS_DB_VERSION.VERSION >= 11 $THEN     
     Function lookup_index_id(
        owner_in  IN &1..ST_GEOMETRY_INDEX.owner%type,
        table_in  IN &1..ST_GEOMETRY_INDEX.table_name%type,
        column_in IN &1..ST_GEOMETRY_INDEX.column_name%type)
      Return PLS_INTEGER RESULT_CACHE;  
      
    FUNCTION lookup_grid_size(
      owner_in  IN &1..ST_GEOMETRY_INDEX.owner%type,
      table_in  IN &1..ST_GEOMETRY_INDEX.table_name%type,
      column_in IN &1..ST_GEOMETRY_INDEX.column_name%type)
    RETURN grid_info_t RESULT_CACHE;
  $END
 
End st_geom_util;


/
