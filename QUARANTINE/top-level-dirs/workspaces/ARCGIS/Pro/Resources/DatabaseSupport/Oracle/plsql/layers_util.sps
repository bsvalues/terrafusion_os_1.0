/* $Id: layers_util.sps,v 1.34.1.3, 2010-02-11 17:55:00Z, Kevin Watt$ 
$NoKeywords$ */ 
CREATE OR REPLACE PACKAGE layers_util
/***********************************************************************
*
*N  {layers_util.sps}  --  Interface for layers DDL package 
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*P  Purpose:
*     This PL/SQL package specification defines procedures to perform
*   DDL operations on Layers.  It should be compiled by the
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
*    Yung-Ting Chen          03/02/99               Original coding.
*E
***********************************************************************/
IS

  /* Type definitions. */

   -- Standard identifier for a Layers.

   SUBTYPE layer_id_t IS &1..layers.layer_id%TYPE;
   SUBTYPE layer_grid_t   IS &1..layers.gsize1%TYPE;
   SUBTYPE layer_record_t IS &1..layers%ROWTYPE;

   -- Standard identifier for a geometry.

   SUBTYPE srid_t          IS &1..layers.srid%TYPE;
   SUBTYPE geocol_record_t IS &1..geometry_columns%ROWTYPE;
   SUBTYPE layer_mask_t    IS &1..layers.layer_mask%TYPE;

   -- Standard identifier for a spatial_reference record.
  
   SUBTYPE spatial_record_t  IS &1..spatial_references%ROWTYPE;
   SUBTYPE spref_srid_t      IS &1..spatial_references.srid%TYPE;
   SUBTYPE spref_authname_t  IS &1..spatial_references.auth_name%TYPE;
   SUBTYPE spref_xycluster_t IS &1..spatial_references.xycluster_tol%TYPE;
   SUBTYPE spref_zcluster_t  IS &1..spatial_references.zcluster_tol%TYPE;
   SUBTYPE spref_mcluster_t  IS &1..spatial_references.mcluster_tol%TYPE;

   -- Standard table name type

   DEF_table_name  NVARCHAR2(160);
   DEF_srtext      VARCHAR2(1024);
   SUBTYPE table_name_t  IS DEF_table_name%TYPE;
   SUBTYPE schema_name_t IS &1..sde_util.identifier_t;
   SUBTYPE srtext_t      IS DEF_srtext%TYPE;
   SUBTYPE column_name_t IS &1..sde_util.identifier_t;
   
  /* Constants. */

   -- The following constant defines the release of layers_util, and is 
   -- used by the iomgr to determine if the most up to date version of the 
   -- package has been installed.

   C_package_release       CONSTANT PLS_INTEGER := 1022;
   C_package_guid          CONSTANT VARCHAR2 (32):= '0B9445C940ED45BD86A455BDD112F3D3';

  /* Procedures and functions. */

   -- The following functions perform DDL operations for layer objects
   -- stored in the &1..LAYERS table.  These procedures all issue a COMMIT
   -- on success.
   
   PROCEDURE insert_layer (layer            IN  layer_record_t,
                           gcol             IN  geocol_record_t,
                           new_g_table_name IN  table_name_t);
   PROCEDURE delete_layer (old_layer_id  IN  layer_id_t); 
   PROCEDURE update_layer (layer     IN  layer_record_t); 
   PROCEDURE update_layer (layer     IN  layer_record_t,
                           new_spatial_column IN column_name_t); 
   PROCEDURE change_layer_table_name 
                              (new_table_name    IN  table_name_t,
                               wanted_layer_id   IN  layer_id_t);
   PROCEDURE change_g_table_name 
                              (new_table_name    IN  table_name_t,
                               wanted_layer_id   IN  layer_id_t);
   PROCEDURE update_spatial_references (wanted_layer_id   IN layer_id_t,
                                        new_srtext        IN srtext_t,
                                        new_xycluster_tol IN spref_xycluster_t,
                                        new_zcluster_tol  IN spref_zcluster_t,
                                        new_mcluster_tol  IN spref_mcluster_t);
   PROCEDURE update_layer_srid (wanted_layer_id IN layer_id_t,
                                new_srid        IN srid_t);
   PROCEDURE insert_spatial_ref (spatial IN  spatial_record_t);
   PROCEDURE lock_spatial_ref;

   PROCEDURE update_layer_mask (wanted_layer_id IN layer_id_t,
                                new_layer_mask  IN layer_mask_t);

   PROCEDURE update_spref_auth_srid (srid_in      IN spref_srid_t,
                                     auth_srid_in IN spref_srid_t,
                                     auth_name_in IN spref_authname_t);
                                     
   PROCEDURE update_layer_grids (owner_in    IN  VARCHAR2,
                                 table_in    IN  VARCHAR2,
                                 column_in   IN  VARCHAR2,
                                 grid1       IN  layer_grid_t,
                                 grid2       IN  layer_grid_t,
                                 grid3       IN  layer_grid_t);
   
   -- The following functions perform DML operations for layer objects
   -- stored in the &1..LAYERS table.  These procedures occur in an
   -- autonomous transaction.
 
   PROCEDURE update_layer_extent(wanted_layer_id IN layer_id_t,
                                new_minx        IN &1..layers.minx%TYPE,
                                new_miny        IN &1..layers.miny%TYPE,
                                new_maxx        IN &1..layers.maxx%TYPE,
                                new_maxy        IN &1..layers.maxy%TYPE,
                                new_minz        IN &1..layers.minz%TYPE,
                                new_minm        IN &1..layers.minm%TYPE,
                                new_maxz        IN &1..layers.maxz%TYPE,
                                new_maxm        IN &1..layers.maxm%TYPE);
                                
   PROCEDURE update_layer_eflags         (owner_in    IN varchar2, 
                                          table_in    IN varchar2,
                                          column_in   IN varchar2,
                                          new_eflags  IN number);
  
   PRAGMA RESTRICT_REFERENCES (layers_util,WNDS,WNPS);

END layers_util;
/
