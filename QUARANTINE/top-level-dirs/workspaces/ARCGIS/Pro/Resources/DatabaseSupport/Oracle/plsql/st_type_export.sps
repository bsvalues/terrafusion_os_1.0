/* $Id: st_type_export.sps,v 1.1.1.11, 2014-10-09 17:12:26Z, Sanjay Magal$ 
$NoKeywords$ */ 
CREATE OR REPLACE Package st_type_export AUTHID current_user AS
/******************************************************************************
   name:       ST_Type_Expor
   purpose:

   revisions:
   ver        date        author           description
   ---------  ----------  ---------------  ------------------------------------
   1.0        4/22/2005             1. created this package.
******************************************************************************/

/* constants. */

  c_package_release    Constant pls_integer := 1019;
  C_package_guid       CONSTANT VARCHAR2 (32):= 'C033B05D4BEA4BDEAE28AD3EA20DB123';     
  se_success           Constant number := 0;

  domain_dropped       BOOLEAN;
  domain_storage       CLOB;
 
  Function export_info (idxschema      IN  varchar2, 
                        idxname        IN  varchar2,
                        spx_info       &1..spx_util.spx_record_t,
                        spref          &1..spx_util.spatial_ref_record_t,
                        expversion     IN varchar2,
                        newblock       Out pls_integer) Return varchar2;

  Procedure checkversion (version IN varchar2);
  Procedure validate_sidx (table_owner IN nvarchar2, table_name IN nvarchar2, geom_id IN number);
  Procedure validate_spref (table_owner IN nvarchar2, sr_name IN nvarchar2, srid IN number, x_offset IN float, y_offset IN float, xyunits IN float,
                            z_offset IN float, z_scale IN float, m_offset IN float, m_scale IN float, min_x IN float,
                            max_x IN float, min_y IN float, max_y IN float, min_z IN float, max_z IN float, min_m IN float,
                            max_m IN float, cs_id IN number, cs_name IN nvarchar2, cs_type IN nvarchar2, organization IN nvarchar2,
                            org_coordsys_id IN number, definition IN varchar2, description IN nvarchar2, 
                            table_name IN varchar2, column_name IN varchar2, index_name IN varchar2, param IN clob, tbs_name IN varchar2);
 
  Pragma Restrict_References (st_type_export,wnds,wnps);

End st_type_export;

/
