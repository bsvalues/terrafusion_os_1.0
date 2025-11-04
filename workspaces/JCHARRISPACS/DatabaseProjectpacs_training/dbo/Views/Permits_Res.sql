Create view [dbo].[Permits_Res] as
SELECT DISTINCT TOP 0     bp.bldg_permit_id, 
bp.bldg_permit_num, 
pba.prop_id,
pp.property_use_cd,
bp.bldg_permit_desc, 
bp.bldg_permit_county_percent_complete,
bp.active_bit, 
pv.cycle,
pv.hood_cd,
convert(char(20), pv.last_appraisal_dt, 101) as last_appraisal_dt,
convert(char(20), bp.bldg_permit_issue_dt, 101) as Issue_date,
convert(char(20), bp.bldg_permit_limit_dt, 101) as permit_limit_date,
convert(char(20), bp.bldg_permit_dt_complete, 101) as complete_date,
convert(char(20), bp.bldg_permit_dt_worked, 101) as Worked_date,
convert(char(20), bp.bldg_permit_last_chg, 101) as last_change,
ap.appraiser_full_name,
ap.appraiser_id,
bp.bldg_permit_appraiser_id, 
bp.bldg_permit_status,
bp.bldg_permit_cad_status,
bp.bldg_permit_active, 
bp.bldg_permit_type_cd,
bp.bldg_permit_issuer,
dbo.fn_getexemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as exemptions,

bp.bldg_permit_val,
bp.bldg_permit_calc_value,
bp.bldg_permit_area,
bp.bldg_permit_dt_worked, 
bp.bldg_permit_pct_complete, 
bp.bldg_permit_builder, 
bp.bldg_permit_builder_phone, 

bp.bldg_permit_cmnt, 
bp.bldg_permit_issued_to,
bp.bldg_permit_owner_phone,
bp.bldg_permit_res_com, 
bp.bldg_permit_street_num,
bp.bldg_permit_street_prefix, 
bp.bldg_permit_street_name, 
bp.bldg_permit_street_suffix, 
bp.bldg_permit_unit_type, 
bp.bldg_permit_unit_number, 
bp.bldg_permit_sub_division, 
bp.bldg_permit_plat,
bp.bldg_permit_block, 
bp.bldg_permit_lot,
bp.bldg_permit_city, 
bp.bldg_permit_source, 
bp.bldg_permit_land_use, 
bp.bldg_permit_pct_complete_override, 
bp.bldg_permit_bldg_number
	FROM building_permit bp
LEFT OUTER JOIN
	 prop_building_permit_assoc pba ON bp.bldg_permit_id = pba.bldg_permit_id
INNER JOIN	(SELECT     prop_id, abs_subdv, neighborhood, subset, map_id, region, state_cd, property_use_cd	FROM pacs_oltp.dbo.property_profile p WHERE (prop_val_yr IN	(SELECT appr_yr FROM  pacs_oltp.dbo.pacs_system))) AS pp ON pba.prop_id = pp.prop_id 
inner join 
	(select * from property_val WHERE prop_inactive_dt is null and (prop_val_yr IN	(SELECT appr_yr FROM  pacs_oltp.dbo.pacs_system))) AS pv on pba.prop_id=pv.prop_id
left join 
	appraiser ap 
		on pv.last_appraiser_id = ap.appraiser_id

				where 
					--bldg_permit_status='open'
					bldg_permit_cad_status='open'
					--bldg_permit_active='t'
					--and bldg_permit_res_com='c'
					and bldg_permit_dt_complete is null
					--and pv.property_use_cd between '13' and '80'and pv.property_use_cd not like '14'and pv.property_use_cd not like '18'and pv.property_use_cd not like '11'--Commercial
					and pv.property_use_cd between '10' and '14'and pv.property_use_cd not between '15'and '89' and pv.property_use_cd not like '13'--Res
					--and pv.property_use_cd between '79' and '90'--Ag

GO

