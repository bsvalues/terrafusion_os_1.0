
-- 1.1 03/03/2004  Rossk Added Personal Property Sub Segments


CREATE procedure ConvMinPopulateProperty

as
	/* First Inactivate all Current Mineral */
	update property_val set prop_inactive_dt = GetDate()
	from property
	where property_val.prop_id = property.prop_id
	and property.prop_type_cd = 'MN'
	and prop_val_yr in (select distinct prop_val_yr from mineral_property_cv)

	/* Now proceed with loading the newly converted property by mineral appraisal company */

	update property set geo_id        = mineral_property_cv.geo_id,
	   	            	prop_create_dt = mineral_property_cv.prop_create_dt,
			prop_type_cd   = mineral_property_cv.prop_type_cd,
			state_cd = mineral_property_cv.state_cd
	from mineral_property_cv
	where property.prop_id = mineral_property_cv.prop_id
	
	insert into property
	(
	prop_id,
	geo_id,
	prop_create_dt,
	prop_type_cd,
	state_cd
	)
	select prop_id,
		geo_id,
		prop_create_dt,
		prop_type_cd,
		state_cd
	from mineral_property_cv
	where not exists (select * from property as p1 where p1.prop_id = mineral_property_cv.prop_id)


	/* mineral account */
	update mineral_acct set field_cd     = mineral_property_cv.field_cd,
				mineral_zone = mineral_property_cv.mineral_zone,
				rr_comm_num  = mineral_property_cv.rr_comm_num,
				lease_id     = mineral_property_cv.lease_id,
				lease_nm     = mineral_property_cv.lease_nm,
				opr	     = mineral_property_cv.opr,
				type_of_int  = mineral_property_cv.type_of_int,
				well_type    = mineral_property_cv.well_type,
				geo_info     = mineral_property_cv.geo_info,
				barrels_per_day = mineral_property_cv.barrels_per_day
	from  mineral_property_cv
	where mineral_acct.prop_id = mineral_property_cv.prop_id

	insert into mineral_acct
	(
	mineral_acct_id,
	prop_id,
	field_cd,
	mineral_zone,
	rr_comm_num,
	lease_id,
	lease_nm,
	opr,
	type_of_int,
	well_type,
	geo_info,
	barrels_per_day
	)
	select distinct
	prop_id,
	prop_id,
	field_cd,
	mineral_zone,
	rr_comm_num,
	lease_id,
	lease_nm,
	opr,
	type_of_int,
	well_type,
	geo_info,
	barrels_per_day
	from mineral_property_cv
	where not exists (select * from mineral_acct as ma1 where ma1.prop_id = mineral_property_cv.prop_id)
		

/* Populate Mineral Property */
	update property_val set legal_desc    = mineral_property_cv.legal_desc,
	  	               	recalc_flag  = 'C',
				assessed_val  = mineral_property_cv.value,
				appraised_val = mineral_property_cv.value,
				market = mineral_property_cv.value,
				prop_inactive_dt = null,
				appr_company_id = 1,
				mineral_int_pct = mineral_property_cv.mineral_int_pct
	from mineral_property_cv
	where property_val.prop_id     = mineral_property_cv.prop_id
	and   property_val.prop_val_yr = mineral_property_cv.prop_val_yr
	and   mineral_property_cv.prop_type_cd = 'MN'
	
	insert into property_val
	(
	prop_id,
	sup_num,
	prop_val_yr,
	legal_desc,
	assessed_val,
	appraised_val,
	market,
	appr_company_id,
	recalc_flag, 
	prev_sup_num,
	mineral_int_pct
	)
	select distinct
	prop_id,
	0,
	prop_val_yr,
	legal_desc,
	value,
	value,
	value,
	1,
	'C',
	0,
	mineral_int_pct
	from mineral_property_cv
	where  mineral_property_cv.prop_type_cd = 'MN' 
	and    not exists (select * from property_val as pv1 
			  where pv1.prop_id = mineral_property_cv.prop_id 
			  and   pv1.prop_val_yr = mineral_property_cv.prop_val_yr)

/* populate personal property */
		
	insert into property_val
	(
	prop_id,
	sup_num,
	prop_val_yr,
	appr_company_id,
	recalc_flag,
	prev_sup_num
	)
	select distinct
	prop_id,
	0,
	prop_val_yr,
	1,
	'C',
	0
	from mineral_property_cv
	where  mineral_property_cv.prop_type_cd = 'P' 
	and    not exists (select * from property_val as pv1 
			  where pv1.prop_id = mineral_property_cv.prop_id 
			  and   pv1.prop_val_yr = mineral_property_cv.prop_val_yr)

	update property_val set legal_desc = mineral_property_cv.legal_desc,
		prop_inactive_dt = null,
		appr_company_id = 1
	from mineral_property_cv
	where property_val.prop_id = mineral_property_cv.prop_id
	and     property_val.prop_val_yr = mineral_property_cv.prop_val_yr
	and     mineral_property_cv.prop_type_cd = 'P'

	update property_val set    assessed_val  = mineral_cv_pers_value_vw.value,
				appraised_val =  mineral_cv_pers_value_vw.value,
				market = mineral_cv_pers_value_vw.value
	from mineral_cv_pers_value_vw
	where property_val.prop_id     = mineral_cv_pers_value_vw.prop_id
	and   property_val.prop_val_yr = mineral_cv_pers_value_vw.prop_val_yr
	and   property_val.prop_id in (select prop_id from mineral_property_cv where prop_type_cd = 'P')
	
		
	
		

	insert into prop_supp_assoc
	(
	prop_id,
	owner_tax_yr,
	sup_num
	)
	select distinct
	prop_id,
	prop_val_yr,
	0
	from mineral_property_cv
	where not exists (select * from prop_supp_assoc as psa1 
			  where psa1.prop_id = mineral_property_cv.prop_id 
			  and   psa1.owner_tax_yr = mineral_property_cv.prop_val_yr)

--	Ownership records should be removed for all properties that are fixin to be copied.	
	delete from owner
	from mineral_property_cv
	where owner.prop_id      = mineral_property_cv.prop_id
	and   owner.owner_tax_yr = mineral_property_cv.prop_val_yr

--	update owner set type_of_int = mineral_property_cv.type_of_int, pct_ownership =100,
--	owner_id = mineral_property_cv.owner_id,
--	updt_dt = getdate()
--	from mineral_property_cv
--	where owner.prop_id      = mineral_property_cv.prop_id
--	and   owner.sup_num      = 0
--	and   owner.owner_tax_yr = mineral_property_cv.prop_val_yr
	
	insert into owner
	(
	prop_id,
	owner_id,
	sup_num,
	owner_tax_yr,
	type_of_int,
	pct_ownership,
	updt_dt
	)
	select distinct
	prop_id,
	owner_id,
	0,
	prop_val_yr,
	type_of_int,
	100,
	GetDate()
	from mineral_property_cv
	where not exists (select * from owner as o1 
			  where o1.prop_id = mineral_property_cv.prop_id 
			  and   o1.owner_tax_yr = mineral_property_cv.prop_val_yr
			  and   o1.owner_id     = mineral_property_cv.owner_id)

	delete from entity_prop_assoc 
	from mineral_property_cv
	where entity_prop_assoc.prop_id = mineral_property_cv.prop_id and entity_prop_assoc.tax_yr = mineral_property_cv.prop_val_yr
	
	
	delete from property_entity_exemption 
	from mineral_property_cv
	where property_entity_exemption.prop_id = mineral_property_cv.prop_id and property_entity_exemption.owner_tax_yr = mineral_property_cv.prop_val_yr

	insert into entity_prop_assoc
	(
	entity_id,
	prop_id,
	sup_num,
	tax_yr,
	entity_prop_pct
	)
	select distinct  
	entity_id, 
	prop_id,
	0,
	tax_yr,
	entity_prop_pct
	from mineral_entity_cv
	where  not exists (select * from entity_prop_assoc
			where entity_prop_assoc.prop_id = mineral_entity_cv.prop_id
			and   entity_prop_assoc.tax_yr = mineral_entity_cv.tax_yr
			and   entity_prop_assoc.entity_id = mineral_entity_cv.entity_id)
	and entity_id <> 0


	delete from pers_prop_sub_seg 
	from mineral_property_cv
	where pers_prop_sub_seg.prop_id = mineral_property_cv.prop_id 
	and pers_prop_sub_seg.prop_val_yr = mineral_property_cv.prop_val_yr


	
	delete from pers_prop_seg 
	from mineral_property_cv
	where pers_prop_seg.prop_id = mineral_property_cv.prop_id 
	and pers_prop_seg.prop_val_yr = mineral_property_cv.prop_val_yr

	insert into pers_prop_seg
	(
	prop_id,
	prop_val_yr,
	sup_num,
	pp_seg_id,
	sale_id,
	pp_area,
	pp_unit_count,
	pp_pct_good,
	pp_orig_cost,
	pp_economic_pct,
	pp_physical_pct,
	pp_flat_val,
	pp_prior_yr_val,
	pp_last_notice_val,
	pp_appraised_val,
	pp_appraise_meth,
	pp_new_val,
	pp_mkt_val,
	pp_unit_price,
	pp_description,
	pp_state_cd,
	pp_deprec_override,
	pp_active_flag
	)
	select distinct
	prop_id,
	prop_val_yr,
	0,
	pp_seg_id,
	0,
	0,
	1,
	100,
	0,
	100,
	100,
	value,
	0,
	0,
	0,
	'F',
	0,
	value,
	0.00,
	legal_desc,
	state_cd,
	'F',
	'T'
	from mineral_property_cv
	where prop_type_cd = 'P'
	and  not exists (select * from pers_prop_seg as pps1 
		  where pps1.prop_id = mineral_property_cv.prop_id 
		  and   pps1.prop_val_yr = mineral_property_cv.prop_val_yr)

GO

