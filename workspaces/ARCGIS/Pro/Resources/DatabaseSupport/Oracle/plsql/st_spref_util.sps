/* $Id: st_spref_util.sps,v 1.4.1.3, 2013-08-09 00:02:35Z, Josefina Santiago$ 
$NoKeywords$ */ 
CREATE OR REPLACE Package st_spref_util AS
/******************************************************************************
   NAME:       st_spref_util
   PURPOSE:

   REVISIONS:
   Ver        Date        Author           Description
   ---------  ----------  ---------------  ------------------------------------
   1.0        4/23/2005             1. Created this package.
******************************************************************************/

  c_package_release           Constant pls_integer := 1005;
  C_package_guid              CONSTANT VARCHAR2 (32):= '818CEFB06F8D4613AF0EC76F37F68BBA';  

  se_success                  Constant pls_integer := 0;
  se_failure                  Constant pls_integer := 1;
  epsg_min                    Constant pls_integer := 2000;
  epsg_max                    Constant pls_integer := 300000;
  
  Subtype sr_name_t           IS &1..st_spatial_references.sr_name%Type;
  Subtype srid_t              IS &1..st_spatial_references.srid%Type;
  Subtype x_off_t             IS &1..st_spatial_references.x_offset%Type;
  Subtype y_off_t             IS &1..st_spatial_references.y_offset%Type;
  Subtype xyunits_t           IS &1..st_spatial_references.xyunits%Type;
  Subtype z_off_t             IS &1..st_spatial_references.z_offset%Type;
  Subtype zscale_t            IS &1..st_spatial_references.z_scale%Type;
  Subtype m_off_t             IS &1..st_spatial_references.m_offset%Type;
  Subtype mscale_t            IS &1..st_spatial_references.m_scale%Type;
  Subtype minx_t              IS &1..st_spatial_references.min_x%Type;
  Subtype maxx_t              IS &1..st_spatial_references.max_x%Type;
  Subtype miny_t              IS &1..st_spatial_references.min_y%Type;
  Subtype maxy_t              IS &1..st_spatial_references.max_y%Type;
  Subtype minz_t              IS &1..st_spatial_references.min_z%Type;
  Subtype maxz_t              IS &1..st_spatial_references.max_z%Type;
  Subtype minm_t              IS &1..st_spatial_references.min_m%Type;
  Subtype maxm_t              IS &1..st_spatial_references.max_m%Type;
  Subtype csid_t              IS &1..st_spatial_references.cs_id%Type;
  Subtype cs_name_t           IS &1..st_spatial_references.cs_name%Type;
  Subtype cs_type_t           IS &1..st_spatial_references.cs_type%Type;
  Subtype org_t               IS &1..st_spatial_references.organization%Type;
  Subtype org_coord_t         IS &1..st_spatial_references.org_coordsys_id%Type;
  Subtype def_t               IS &1..st_spatial_references.Definition%Type;
  Subtype desc_t              IS &1..st_spatial_references.description%Type;

  Subtype spatial_ref_record_t IS &1..st_spatial_references%Rowtype;

  Type r_cache IS Record  (srid srid_t, sr_name sr_name_t, x_offset x_off_t,
                                                  y_offset y_off_t, xyunits xyunits_t, z_offset z_off_t,
                                                  zscale zscale_t, m_offset m_off_t, mscale mscale_t,
                                                  min_x minx_t, max_x maxx_t, min_y miny_t, max_y maxy_t,
                                                  min_z minz_t, max_z maxz_t, min_m minm_t, max_m maxm_t,
                                                  csid csid_t, cs_name cs_name_t, cs_type cs_type_t,
                                                  organization org_t, org_coordsys_id org_coord_t, 
                                                  Definition def_t, description desc_t);

  Type spref_cache_t IS TABLE OF r_cache INDEX BY binary_integer;

  spref_cache                spref_cache_t;
  nsp_refs                   pls_integer := 0;

  Function get_srid                 (sr_name IN sr_name_t) Return number;

  Function check_spref_cache        (srid srid_t) Return spatial_ref_record_t;

  Procedure add_spref_cache_info    (spref_r       IN spatial_ref_record_t);
  
  Procedure insert_spref            (spref IN spatial_ref_record_t,
                                     srid  IN Out srid_t);

  Procedure insert_spref            (spref IN spatial_ref_record_t);

  Function select_spref             (spref_r       IN Out spatial_ref_record_t)
    Return number;

  Function exists_spref             (spref       IN spatial_ref_record_t)
    Return number;


End st_spref_util;

/
