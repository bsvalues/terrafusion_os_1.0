/* $Id: st_geometry_operators.sps,v 1.6.1.24, 2014-09-04 18:41:51Z, Sanjay Magal$ 
$NoKeywords$ */ 
CREATE OR REPLACE Package st_geometry_operators Authid current_user
/***********************************************************************
*
*n  {st_Geometry_Operators.sps}  --  st_Geometry operators.  
*
*:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
*
*p  purpose:
*     this pl/sql package specification defines operators 
*    to support the st_Geometry type.
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

  c_package_release       Constant pls_integer := 1150;
  C_package_guid          CONSTANT VARCHAR2 (32):= '0599A32E435E4221AF5321268F455769';
  
  mtrue                   Constant pls_integer := 1;
  mfalse                  Constant pls_integer := 0;

   -- st_Geometry operator functions (isocomn.h st_Geometry_Operators enum) 
   
  geomfromshape                Constant pls_integer := 1;
  pointfromshape               Constant pls_integer := 2;
  linefromshape                Constant pls_integer := 3;
  polyfromshape                Constant pls_integer := 4;
  mpointfromshape              Constant pls_integer := 5;
  mlinefromshape               Constant pls_integer := 6;
  mpolyfromshape               Constant pls_integer := 7;
  st_geomfromwkb               Constant pls_integer := 8;  
  st_pointfromwkb              Constant pls_integer := 9;
  st_linefromwkb               Constant pls_integer := 10;
  st_polyfromwkb               Constant pls_integer := 11;
  st_mpointfromwkb             Constant pls_integer := 12;
  st_mlinefromwkb              Constant pls_integer := 13;
  st_mpolyfromwkb              Constant pls_integer := 14;
  st_boundary                  Constant pls_integer := 15;
  st_buffer                    Constant pls_integer := 16;
  st_centroid                  Constant pls_integer := 17;
  st_convexhull                Constant pls_integer := 18;
  st_startpoint                Constant pls_integer := 19;
  st_endpoint                  Constant pls_integer := 20;
  st_linestringn               Constant pls_integer := 21;
  st_pointonsurface            Constant pls_integer := 22;
  st_exteriorring              Constant pls_integer := 23;
  st_interiorringn             Constant pls_integer := 24;
  st_numinteriorring           Constant pls_integer := 25;
  st_numgeometries             Constant pls_integer := 26;
  st_geometryn                 Constant pls_integer := 27;
  st_difference                Constant pls_integer := 28;
  st_union                     Constant pls_integer := 29;
  st_symmetricdiff             Constant pls_integer := 30;
  st_pointn                    Constant pls_integer := 31;
  st_intersection              Constant pls_integer := 32;
  st_transform                 Constant pls_integer := 33;
  st_verify                    Constant pls_integer := 34;
  st_area                      Constant pls_integer := 35;
  st_length                    Constant pls_integer := 36;
  st_perimeter                 Constant pls_integer := 37;                 

  Function st_astext_f(prim &1..st_geometry)
    Return clob deterministic;

  Function st_asbinary_f(prim &1..st_geometry)
    Return blob deterministic;

  Function st_geomfromwkb_f(wkb_blob blob)
    Return &1..st_geometry deterministic;

  Function st_geomfromwkb_f(wkb_blob blob,srid number)
    Return &1..st_geometry deterministic;
    
  Function st_pointfromwkb_f(wkb_blob blob)
    Return &1..st_geometry deterministic;
  
  Function st_pointfromwkb_f(wkb_blob blob,srid number)
    Return &1..st_geometry deterministic;
    
  Function st_linefromwkb_f(wkb_blob blob)
    Return &1..st_geometry deterministic;

  Function st_linefromwkb_f(wkb_blob blob,srid number)
    Return &1..st_geometry deterministic;

  Function st_polyfromwkb_f(wkb_blob blob)
    Return &1..st_geometry deterministic;    

  Function st_polyfromwkb_f(wkb_blob blob,srid number)
    Return &1..st_geometry deterministic;
  
  Function st_mpointfromwkb_f(wkb_blob blob)
    Return &1..st_geometry deterministic;

  Function st_mpointfromwkb_f(wkb_blob blob,srid number)
    Return &1..st_geometry deterministic;

  Function st_mlinefromwkb_f(wkb_blob blob)
    Return &1..st_geometry deterministic;    

  Function st_mlinefromwkb_f(wkb_blob blob,srid number)
    Return &1..st_geometry deterministic;
    
	  Function st_mpolyfromwkb_f(wkb_blob blob)
    Return &1..st_geometry deterministic;

  Function st_mpolyfromwkb_f(wkb_blob blob,srid number)
    Return &1..st_geometry deterministic;
    
  Function st_boundary_f(prim &1..st_geometry)
    Return &1..st_geometry deterministic;

  Function st_coorddim_f(prim &1..st_geometry)
    Return number deterministic;
    
  Function st_envelope_f(prim &1..st_geometry)
    Return &1..st_polygon deterministic;

  Function st_geometrytype_f(prim &1..st_geometry)
    Return varchar2 deterministic;

  Function st_is3d_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_ismeasured_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_isclosed_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_isempty_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_isring_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_issimple_f (prim &1..st_geometry)
    Return number deterministic;

  Function st_area_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_areaunits_f(prim &1..st_geometry,unit varchar2)
    Return number deterministic;

  Function st_area_unit_f(prim &1..st_geometry,unit_name varchar2)
    Return number deterministic;

  Function st_buffer_f(prim &1..st_geometry,distance number)
    Return &1..st_geometry deterministic;

  Function st_buffer_unit_f(prim &1..st_geometry,distance number, unit_name varchar2)
    Return &1..st_geometry deterministic;

  Function st_centroid_f(prim &1..st_geometry)
    Return &1..st_geometry deterministic;

  Function st_convexhull_f(prim &1..st_geometry)
    Return &1..st_geometry deterministic;

  Function st_dimension_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_startpoint_f (prim &1..st_geometry)
    Return &1..st_point deterministic;

  Function st_endpoint_f (prim &1..st_geometry)
    Return &1..st_point deterministic;

  Function st_pointonsurface_f (prim &1..st_geometry)
    Return &1..st_point deterministic;

  Function st_exteriorring_f (prim &1..st_geometry)
    Return &1..st_linestring deterministic;

  Function st_interiorringn_f (prim &1..st_geometry,ring_pos number)
    Return &1..st_linestring deterministic;

  Function st_numinteriorring_f (prim &1..st_geometry)
    Return number deterministic;

  Function st_numgeometries_f (prim &1..st_geometry)
    Return number deterministic;

  Function st_geometryn_f (prim &1..st_geometry,position number)
    Return &1..st_geometry;

  Function st_difference_f(shape1 &1..st_geometry,shape2 &1..st_geometry)
    Return &1..st_geometry deterministic;

  Function st_union_f (shape1 &1..st_geometry,shape2 &1..st_geometry)
    Return &1..st_geometry deterministic;

  Function st_symmetricdiff_f (shape1 &1..st_geometry,shape2 &1..st_geometry)
    Return &1..st_geometry deterministic;

  Function st_pointn_f (prim &1..st_geometry,point_pos number)
    Return &1..st_point deterministic;

  Function st_intersection_f (shape1 &1..st_geometry,shape2 &1..st_geometry)
    Return &1..st_geometry deterministic;

  Function st_transform_f(prim &1..st_geometry,srid number)
    Return &1..st_geometry deterministic;

  Function st_transform_geotranid_f(prim &1..st_geometry,srid number,geotranid number)
    Return &1..st_geometry deterministic;

  Function st_transform_gcsextent_f(prim &1..st_geometry,srid number,
                                    minx number, miny number, maxx number, maxy number, 
                                    prime_meridian number, unit_factor number)
    Return &1..st_geometry deterministic;

  Function st_entity_f (prim &1..st_geometry)
    Return number;

  Function st_numpoints_f (prim &1..st_geometry)
    Return number;

  Function st_minx_f (prim &1..st_geometry)
    Return number;

  Function st_maxx_f (prim &1..st_geometry)
    Return number;

  Function st_miny_f (prim &1..st_geometry)
    Return number;

  Function st_maxy_f (prim &1..st_geometry)
    Return number;

  Function st_minz_f (prim &1..st_geometry)
    Return number;

  Function st_maxz_f (prim &1..st_geometry)
    Return number;

  Function st_minm_f (prim &1..st_geometry)
    Return number;

  Function st_maxm_f (prim &1..st_geometry)
    Return number;

  Function st_length_f (prim &1..st_geometry)
    Return number;

  Function st_length_unit_f (prim &1..st_geometry, unit_name varchar2)
    Return number;

  Function st_perimeter_f(prim &1..st_geometry)
    Return number deterministic;

  Function st_perimeter_unit_f(prim &1..st_geometry,unit_name varchar2)
    Return number deterministic;

  Function st_srid_f (prim &1..st_geometry)
    Return number;

  Function st_x_f (prim &1..st_geometry)
    Return number deterministic;

  Function st_y_f (prim &1..st_geometry)
    Return number deterministic;

  Function st_z_f (prim &1..st_geometry)
    Return number deterministic;

  Function st_m_f (prim &1..st_geometry)
    Return number deterministic;
    
  Function st_distance_f(shape1 &1..st_geometry,shape2 &1..st_geometry)
    Return number deterministic;
    
  Function st_distance_f(shape1 &1..st_geometry,shape2 &1..st_geometry,unit varchar2)
    Return number deterministic;
    
  Function st_distance_unit_f(shape1 &1..st_geometry,shape2 &1..st_geometry,unit_name varchar2)
    Return number deterministic;

  Function st_distance_within_f(shape1 &1..st_geometry,shape2 &1..st_geometry,distance number)
    Return number deterministic;
	
  Function st_disjoint_f(shape1 &1..st_geometry,shape2 &1..st_geometry)
    Return number deterministic;
    
  Procedure transform_srch_shape         (shape             IN  &1..st_geometry,
                                          shape_out         OUT &1..st_geometry,
                                          from_srid         IN &1..st_spref_util.srid_t,
                                          to_srid           IN &1..st_spref_util.srid_t);

  Function st_verify_f (shape &1..st_geometry)
    Return &1..st_geometry deterministic;                                       

  Function st_geohash_f (prim &1..st_geometry, precision number)
    Return varchar2 deterministic;

  Function st_geohash_np_f (prim &1..st_geometry)
    Return varchar2 deterministic;

  Function st_pointfromgeohash_f (geohash_str varchar2, precision number)
    Return &1..st_geometry deterministic;

  Function st_pointfromgeohash_np_f (geohash_str varchar2)
    Return &1..st_geometry deterministic;

  Function st_geomfromgeohash_f (geohash_str varchar2, precision number)
    Return &1..st_geometry deterministic;

  Function st_geomfromgeohash_np_f (geohash_str varchar2)
    Return &1..st_geometry deterministic;

  Function st_geosquare_f (prim &1..st_geometry, precision number)
    Return varchar2 deterministic;

  Function st_geosquare_np_f (prim &1..st_geometry)
    Return varchar2 deterministic;

  Function st_pointfromgeosquare_f (geosquare_str varchar2, precision number, srid number)
    Return &1..st_geometry deterministic;

  Function st_pointfromgeosquare_p_f (geosquare_str varchar2, precision number)
    Return &1..st_geometry deterministic;  

  Function st_pointfromgeosquare_np_f (geosquare_str varchar2)
    Return &1..st_geometry deterministic;  

  Function st_geomfromgeosquare_f (geosquare_str varchar2, precision number, srid number)
    Return &1..st_geometry deterministic;
	
  Function st_geomfromgeosquare_p_f (geosquare_str varchar2, precision number)
    Return &1..st_geometry deterministic;

  Function st_geomfromgeosquare_np_f (geosquare_str varchar2)
    Return &1..st_geometry deterministic;

  Function st_geohexcode_f (prim &1..st_geometry)
    Return varchar2 deterministic;

  Function st_geohexcode_p_f (prim &1..st_geometry, precision number)
    Return varchar2 deterministic;

  Function st_geohexcode_po_f (prim &1..st_geometry, precision number, orientation number)
    Return varchar2 deterministic;

  Function st_geohexcode_poa_f (prim &1..st_geometry, precision number, orientation number, append number)
    Return varchar2 deterministic;

  Function st_geohextriangle_f (prim &1..st_geometry)
    Return varchar2 deterministic;
 
  Function st_geohextriangle_p_f (prim &1..st_geometry, precision number)
    Return varchar2 deterministic;

  Function st_geohextriangle_po_f (prim &1..st_geometry, precision number, orientation number)
    Return varchar2 deterministic;

  Function st_geomfromgeohextri_f (geohex_str varchar2)
    Return &1..st_geometry deterministic;
   
  Function st_geomfromgeohextri_s_f (geohex_str varchar2, srid number)
    Return &1..st_geometry deterministic;

  Function st_geomfromgeohextri_sp_f (geohex_str varchar2, srid number, precision number)
    Return &1..st_geometry deterministic;

  Function st_geomfromgeohextri_spo_f (geohex_str varchar2, srid number, precision number, orientation number)
    Return &1..st_geometry deterministic;

  Function st_geohexcodefromtcode_f (triangle_str varchar2)
    Return varchar2 deterministic;
  
  Function st_geohexcodefromtcode_s_f (triangle_str varchar2, srid number)
    Return varchar2 deterministic;
  
  Function st_geohexcodefromtcode_sp_f (triangle_str varchar2, srid number, precision number)
    Return varchar2 deterministic;
  
  Function st_geohexcodefromtcode_spo_f (triangle_str varchar2, srid number, precision number, orientation number)
    Return varchar2 deterministic;
  
  Function st_geohexcodefromtcode_spoa_f (triangle_str varchar2, srid number, precision number, orientation number, append number)
    Return varchar2 deterministic;
  
  Function st_pointfromgeohextri_f (geohex_str varchar2)
    Return &1..st_geometry deterministic;
  
  Function st_pointfromgeohextri_s_f (geohex_str varchar2, srid number)
    Return &1..st_geometry deterministic;
  
  Function st_pointfromgeohextri_sp_f (geohex_str varchar2, srid number, precision number)
    Return &1..st_geometry deterministic;

  Function st_pointfromgeohextri_spo_f (geohex_str varchar2, srid number, precision number, orientation number)
    Return &1..st_geometry deterministic;

  Function st_ptfromgeohextriangle_f (triangle_str varchar2)
    Return &1..st_geometry deterministic;
  
  Function st_ptfromgeohextriangle_s_f (triangle_str varchar2, srid number)
    Return &1..st_geometry deterministic;
  
  Function st_ptfromgeohextriangle_sp_f (triangle_str varchar2, srid number, precision number)
    Return &1..st_geometry deterministic;
  
  Function st_ptfromgeohextriangle_spo_f (triangle_str varchar2, srid number, precision number, orientation number)
    Return &1..st_geometry deterministic;
  
  Function st_gfromgeohextriangle_f (triangle_str varchar2)
    Return &1..st_geometry deterministic;
  
  Function st_gfromgeohextriangle_s_f (triangle_str varchar2, srid number)
    Return &1..st_geometry deterministic;
  
  Function st_gfromgeohextriangle_sp_f (triangle_str varchar2, srid number, precision number)
    Return &1..st_geometry deterministic;
  
  Function st_gfromgeohextriangle_spo_f (triangle_str varchar2, srid number, precision number, orientation number)
    Return &1..st_geometry deterministic;
 
  Function st_gfromtrianglecode_f (triangle_str varchar2)
    Return &1..st_geometry deterministic;
  
  Function st_gfromtrianglecode_s_f (triangle_str varchar2, srid number)
    Return &1..st_geometry deterministic;

  Function st_gfromtrianglecode_sp_f (triangle_str varchar2, srid number, precision number)
    Return &1..st_geometry deterministic;

  Function st_gfromtrianglecode_spo_f (triangle_str varchar2, srid number, precision number, orientation number)
    Return &1..st_geometry deterministic;

  Pragma Restrict_References (st_geometry_operators,wnds);

End st_geometry_operators;
/  
