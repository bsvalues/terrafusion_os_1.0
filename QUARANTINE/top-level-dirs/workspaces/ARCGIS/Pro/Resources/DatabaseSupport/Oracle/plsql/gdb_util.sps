CREATE OR REPLACE PACKAGE gdb_util AUTHID CURRENT_USER
/***********************************************************************
*
*N  {gdb_util.sps}  --  Geodatanase PL/SQL utility package
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines useful constants and type
*   definitions for use by other Geodatabase procedures.  
*E
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*X  Legalese:
*
*   COPYRIGHT 1992-2010 ESRI
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
*    Kevin Watt             10/28/2010            Original coding.
*E
***********************************************************************/
IS

  C_package_release  CONSTANT PLS_INTEGER := 1008;
  C_package_guid     CONSTANT VARCHAR2 (32):= 'D1BC23FF77F94927B07910014F93C4BE';  

  TYPE C_GDB_Items_T IS REF CURSOR;
  TYPE C_SEQ_T IS REF CURSOR;
  TYPE t_varchar2 IS TABLE OF &1..sde_util.a_owner_t;
  TYPE t_float IS TABLE OF FLOAT;
  TYPE t_int IS TABLE OF INTEGER;

  FUNCTION next_rowid                 (owner_in     IN &1..table_registry.owner%TYPE,
                                       table_in     IN &1..table_registry.table_name%TYPE)
    RETURN NUMBER;

  FUNCTION is_simple                  (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
    RETURN varchar2;

  FUNCTION rowid_name                 (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
    RETURN varchar2;

  FUNCTION is_versioned               (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
    RETURN varchar2;

  FUNCTION version_view_name          (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
    RETURN varchar2;

  FUNCTION is_archive_enabled         (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
    RETURN varchar2;
    
  FUNCTION archive_view_name          (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
    RETURN varchar2;

$IF $$st_geometry_installed $THEN   
  FUNCTION get_extent                 (owner_in    IN &1..layers.owner%TYPE,
                                       table_in    IN &1..layers.table_name%TYPE,
                                       column_in   IN &1..layers.spatial_column%TYPE,
                                       op          IN varchar2,
                                       minx        IN OUT number,
                                       miny        IN OUT number,
                                       maxx        IN OUT number,
                                       maxy        IN OUT number)
    RETURN pls_integer;

  FUNCTION get_extent                 (owner_in    IN &1..layers.owner%TYPE,
                                       table_in    IN &1..layers.table_name%TYPE,
                                       column_in   IN &1..layers.spatial_column%TYPE,
                                       minx        IN OUT number,
                                       miny        IN OUT number,
                                       maxx        IN OUT number,
                                       maxy        IN OUT number)
    RETURN pls_integer;

  PROCEDURE spatial_ref_info          (owner_in    IN &1..layers.owner%TYPE,
                                       table_in    IN &1..layers.table_name%TYPE,
                                       column_in   IN &1..layers.spatial_column%TYPE,
                                       wkid        IN OUT integer,
                                       wkt         IN OUT varchar2,
                                       st_srid     IN OUT integer);
$END 
                                 
  FUNCTION globalid_name              (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
  RETURN varchar2;
 
  FUNCTION next_globalid
  RETURN nchar;

  FUNCTION geometry_columns           (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
  RETURN clob;

  FUNCTION geometry_column_type       (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE,
                                       column_in   IN nvarchar2)
  RETURN varchar2;

$IF $$st_geometry_installed $THEN   
  FUNCTION geometry_type              (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE,
                                       column_in   IN nvarchar2)
  RETURN clob;
$END 

  FUNCTION is_replicated              (owner_in    IN &1..table_registry.owner%TYPE,
                                       table_in    IN &1..table_registry.table_name%TYPE)
  RETURN varchar2;

  FUNCTION is_geodatabase
  RETURN varchar2;
                        
  PROCEDURE update_open_cursors;
                        
  PRAGMA RESTRICT_REFERENCES (gdb_util,WNDS,WNPS);

END gdb_util;
/