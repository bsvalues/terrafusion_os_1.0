
create view [dbo].[BP_open] as 
SELECT     prop_building_permit_assoc.prop_id,   building_permit.bldg_permit_id, building_permit.bldg_permit_status, building_permit.bldg_permit_cad_status, building_permit.bldg_permit_type_cd, building_permit.bldg_permit_sub_type_cd, 
                         building_permit.bldg_permit_num, building_permit.bldg_permit_issuer, building_permit.bldg_permit_issue_dt, building_permit.bldg_permit_limit_dt, building_permit.bldg_permit_dt_complete, 
                         building_permit.bldg_permit_val, building_permit.bldg_permit_area, building_permit.bldg_permit_dim_1, building_permit.bldg_permit_dim_2, building_permit.bldg_permit_dim_3, 
                         building_permit.bldg_permit_num_floors, building_permit.bldg_permit_num_units, building_permit.bldg_permit_appraiser_id, building_permit.bldg_permit_dt_worked, building_permit.bldg_permit_pct_complete, 
                         building_permit.bldg_permit_builder, building_permit.bldg_permit_builder_phone, building_permit.bldg_permit_active, building_permit.bldg_permit_last_chg, building_permit.bldg_permit_cmnt, 
                         building_permit.bldg_permit_issued_to, building_permit.bldg_permit_owner_phone, building_permit.bldg_permit_res_com, building_permit.bldg_permit_street_num, building_permit.bldg_permit_street_prefix, 
                         building_permit.bldg_permit_street_name, building_permit.bldg_permit_street_suffix, building_permit.bldg_permit_unit_type, building_permit.bldg_permit_unit_number, 
                         building_permit.bldg_permit_sub_division, building_permit.bldg_permit_plat, building_permit.bldg_permit_block, building_permit.bldg_permit_lot, building_permit.bldg_permit_city, 
                         building_permit.bldg_permit_land_use, building_permit.bldg_permit_source, building_permit.bldg_permit_pct_complete_override, building_permit.bldg_permit_bldg_inspect_req, 
                         building_permit.bldg_permit_elec_inspect_req, building_permit.bldg_permit_mech_inspect_req, building_permit.bldg_permit_plumb_inspect_req, building_permit.bldg_permit_old_permit_no, 
                         building_permit.bldg_permit_property_roll, building_permit.bldg_permit_place_id, building_permit.bldg_permit_import_dt, building_permit.bldg_permit_street_sub, building_permit.bldg_permit_case_name, 
                         building_permit.bldg_permit_project_num, building_permit.bldg_permit_project_name, building_permit.bldg_permit_calc_value, building_permit.bldg_permit_acreage, building_permit.bldg_permit_prim_zoning, 
                         building_permit.bldg_permit_second_zoning, building_permit.bldg_permit_import_prop_id, building_permit.bldg_permit_legal, building_permit.bldg_permit_bldg_number, building_permit.bldg_permit_desc, 
                         building_permit.bldg_permit_county_percent_complete, building_permit.bldg_permit_import_status, building_permit.active_bit, building_permit.bldg_permit_other_id, 
                         building_permit.bldg_permit_worksheet_type_cd,CENTROID_X as xcoord,CENTROID_Y as ycoord,Geometry ,[X],[Y]
FROM            building_permit LEFT OUTER JOIN
                         prop_building_permit_assoc ON building_permit.bldg_permit_id = prop_building_permit_assoc.bldg_permit_id

						 INNER JOIN

(SELECT     prop_id, abs_subdv, neighborhood, subset, map_id, region, state_cd, property_use_cd
FROM          pacs_oltp.dbo.property_profile p (nolock)

WHERE      (prop_val_yr IN

(SELECT     appr_yr
FROM          pacs_oltp.dbo.pacs_system))) AS pp ON prop_building_permit_assoc.prop_id = pp.prop_id 

inner join 
(select CENTROID_X,CENTROID_Y,geometry,prop_id,[X]
      ,[Y]
from benton_spatial_data.dbo.parcel)as sp on pp.prop_id=sp.prop_id
where 
bldg_permit_active='t'

GO

