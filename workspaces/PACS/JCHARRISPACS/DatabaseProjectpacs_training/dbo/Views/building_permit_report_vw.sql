



create view building_permit_report_vw
as

select
bp.bldg_permit_id as permit_id,
bp.bldg_permit_num as permit_num,

bp.bldg_permit_issuer as issuer, 
bp.bldg_permit_issue_dt as issue_dt,
bp.bldg_permit_import_dt as import_dt,
bp.bldg_permit_limit_dt as limit_dt,
bp.bldg_permit_dt_complete as dt_complete, 
bp.bldg_permit_val as permit_val,
bp.bldg_permit_area as permit_area,
bp.bldg_permit_dt_worked as dt_worked, 
bp.bldg_permit_pct_complete as pct_complete,
bp.bldg_permit_builder as builder,
bp.bldg_permit_active as active, 
bp.bldg_permit_last_chg as last_chg,
bp.bldg_permit_cmnt as comment,
bp.bldg_permit_issued_to as issued_to, 
bp.bldg_permit_street_num as street_num,
bp.bldg_permit_street_prefix as street_prefix,
bp.bldg_permit_street_name as street_name, 
bp.bldg_permit_street_suffix as street_suffix,
bp.bldg_permit_city as city,
bp.bldg_permit_land_use as land_use, 
bp.bldg_permit_source as source,
bp.bldg_permit_res_com as res_com,    
bp.bldg_permit_unit_type as unit_type,
bp.bldg_permit_unit_number as unit_number, 
bp.bldg_permit_sub_division as sub_division,
bp.bldg_permit_plat as plat, 
bp.bldg_permit_block as block,
bp.bldg_permit_lot as lot, 
bp.bldg_permit_dim_1 as dim_1,
bp.bldg_permit_dim_2 as dim_2,
bp.bldg_permit_dim_3 as dim_3, 
bp.bldg_permit_bldg_inspect_req as bldg_inspect_req,
bp.bldg_permit_elec_inspect_req as elec_inspect_req, 
bp.bldg_permit_mech_inspect_req as mech_inspect_req,
bp.bldg_permit_plumb_inspect_req as plumb_inspect_req, 
bp.bldg_permit_builder_phone as builder_phone,
bp.bldg_permit_owner_phone as owner_phone,

appraiser.appraiser_nm,
bp.bldg_permit_type_cd as permit_type_cd, bp_type.bld_permit_desc as permit_type, 
bp.bldg_permit_sub_type_cd as permit_subtype_cd, bp_subtype.Description as permit_subtype,  
bp.bldg_permit_status as status, bps.Description as status_desc,  
bp.bldg_permit_cad_status as cad_status, bpcs.Description as cad_status_desc,

bp.bldg_permit_case_name as case_name,
bp.bldg_permit_project_name as project_name,
bp.bldg_permit_project_num as project_num,
bp.bldg_permit_import_prop_id as import_prop_id,
bp.bldg_permit_desc,
bp.bldg_permit_other_id AS other_id,

(select count(*) from prop_building_permit_assoc pbpa
 where bp.bldg_permit_id = pbpa.bldg_permit_id) as property_count


from building_permit bp

left outer join bld_permit_type bp_type with (nolock)
on bp.bldg_permit_type_cd = bp_type.bld_permit_type_cd

left outer join bld_permit_sub_type bp_subtype with (nolock)
on bp.bldg_permit_sub_type_cd = bp_subtype.PermitSubtypeCode

left outer join bp_issuer_status_cd bps with (nolock)
on bp.bldg_permit_status = bps.IssuerStatus 

left outer join bp_cad_status_cd bpcs with (nolock)
on bp.bldg_permit_cad_status = bpcs.CadStatus 

left outer join appraiser
on bp.bldg_permit_appraiser_id = appraiser.appraiser_id

GO

