/* $Id: st_geom_cols_util.sps,v 1.4.1.11, 2014-05-08 19:48:30Z, Kevin Watt$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE St_Geom_Cols_Util AS
/******************************************************************************
   NAME:       st_geom_cols_util
   PURPOSE:

   REVISIONS:
   Ver        Date        Author           Description
   ---------  ----------  ---------------  ------------------------------------
   1.0        4/21/2005             1. Created this package.
******************************************************************************/

  C_package_release          CONSTANT PLS_INTEGER := 1014;
  C_package_guid             CONSTANT VARCHAR2 (32):= 'D2F410062A0443F69F68BB9DB62631FB'; 
  
  SE_SUCCESS                 CONSTANT NUMBER := 0;
  SE_LAYER_EXISTS            CONSTANT NUMBER := -20019;
  SE_SPATIALREF_NOEXIST      CONSTANT NUMBER := -20255;
  
  SUBTYPE gc_owner_t          IS &1..st_geometry_columns.owner%TYPE;
  SUBTYPE gc_table_t          IS &1..st_geometry_columns.table_name%TYPE;
  SUBTYPE gc_column_t         IS &1..st_geometry_columns.column_name%TYPE;
  SUBTYPE gc_srid_t           IS &1..st_geometry_columns.srid%TYPE;
  SUBTYPE gc_properties_t     IS &1..st_geometry_columns.properties%TYPE;
  SUBTYPE gc_record_t         IS &1..st_geometry_columns%Rowtype;
  SUBTYPE gindex_record_t     IS &1..st_geometry_index%Rowtype;
  
  TYPE gtype_t IS VARRAY(20) OF VARCHAR2(20);
  gtype  gtype_t := gtype_t('ST_GEOMETRY','ST_POINT','ST_LINESTRING','ST_POLYGON',
                            'ST_MULTIPOINT','ST_MULTILINESTRING','ST_MULTIPOLYGON');

  
  PROCEDURE insert_gcol   (owner           IN   gc_owner_t,
                           table_name      IN   gc_table_t,
                           column_name     IN   gc_column_t,
                           geom_type       IN   VARCHAR2,
                           srid            IN   gc_srid_t);

  PROCEDURE insert_gcol   (owner           IN   gc_owner_t,
                           table_name      IN   gc_table_t,
                           column_name     IN   gc_column_t,
                           geom_type       IN   VARCHAR2,
                           properties      IN   gc_properties_t,
                           srid            IN   gc_srid_t);

  PROCEDURE delete_gcol   (owner           IN   gc_owner_t,
                           table_name      IN   gc_table_t,
                           column_name     IN   gc_column_t);

  PROCEDURE update_gcol   (owner           IN   gc_owner_t,
                           table_name      IN   gc_table_t,
                           column_name     IN   gc_column_t,
                           properties      IN   NUMBER);

  PROCEDURE update_gcol_table   (owner_name IN   gc_owner_t,
                                 old_table  IN   gc_table_t,
                                 colname    IN   gc_column_t,
                                 new_table  IN   gc_table_t);

  Procedure update_gcol_properties   (owner_name    IN   gc_owner_t,
                                      old_table     IN   gc_table_t,
                                      colname       IN   gc_column_t,
                                      properties_in IN   number);

  PROCEDURE delete_st_geom_metadata   (owner        IN gc_owner_t,
                                     table_name   IN gc_table_t,
                                     column_name  IN gc_column_t);

  FUNCTION select_gcol    (owner           IN   gc_owner_t,
                           table_name      IN   gc_table_t,
                           column_name     IN   gc_column_t,
                           geom_type       IN OUT VARCHAR2,
                           properties      IN OUT NUMBER,
                           srid            IN OUT gc_srid_t)
      RETURN NUMBER;

PROCEDURE update_gcol_srid     (owner_in           IN   gc_owner_t,
                                table_name_in      IN   gc_table_t,
                                column_name_in     IN   gc_column_t,
                                srid_in            IN   gc_srid_t);

END St_Geom_Cols_Util;

/
