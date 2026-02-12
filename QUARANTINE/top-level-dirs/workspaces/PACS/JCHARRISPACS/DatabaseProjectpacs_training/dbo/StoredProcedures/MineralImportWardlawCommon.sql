

create procedure MineralImportWardlawCommon
	@run_id	int,
	@year numeric(4) ,
	@appr_company_id int

as


insert into
	mineral_import_owner
(
	run_id, 
	acct_id, 
	owner_no, 
	file_as_name, 
	addr_line1, 
	addr_line2, 
	addr_line3, 
	addr_city, 
	addr_st, 
	addr_zip, 
	source, 
	acct_create_dt,
	appr_company_id 
)
select distinct
	@run_id, 
	0, 
	miw.owner_id, 
	case when len(rtrim(isnull(name_sort, ''))) > 0 then left(replace(name_sort, ',', ''),50) else left(replace(addr1, ',', ''),50)  end,
	dbo.fn_SelectAddress('1', miw.addr2, miw.addr3, miw.addr4, miw.addr5),
	dbo.fn_SelectAddress('2', miw.addr2, miw.addr3, miw.addr4, miw.addr5),
	dbo.fn_SelectAddress('3', miw.addr2, miw.addr3, miw.addr4, miw.addr5),
	substring(miw.addr6,0, charindex(',', miw.addr6)),
	substring(miw.addr6, charindex(',', miw.addr6)+1, 3),  
	left(ltrim(rtrim(substring(miw.addr6, charindex(',', miw.addr6) + 5, len(miw.addr6) - charindex(',', miw.addr6) + 5))), 10),	
	'WDL', 
	GetDate(),
	@appr_company_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id


insert into
	mineral_import_property
(
	run_id, 
	prop_id, 
	owner_id,	
	prop_val_yr,
	pp_seg_id,
	owner_no,
	field_cd,	
	mineral_zone,
	rr_comm_num,
	lease_id,
	lease_nm,
	opr, 
	type_of_int, 
	well_type,	 	
	mineral_int_pct,	
	new_val,	
	geo_id,	
	legal_desc,    
	value,	 
	source,	
	prop_create_dt,	
	prop_type_cd,   
	state_cd,	
	ref_id1,	
	xref,
	appr_company_id,
	agent_code,
	agent_id,
	rendered_date,
	agent_arb_mailings,
	agent_ca_mailings,
	agent_ent_mailings,
	agent_auth_to_protest,
	agent_auth_to_resolve,
	agent_auth_confidential,
	agent_auth_other,
	rendition_extension_1,
	rendition_extension_2
)
select
	@run_id, 
	0, 
	0,	
	@year,
	0,
	miw.owner_id,	
	'',	
	'',
	null,
	miw.lease_id,	
	miw.lease_name,	
	left(miw.lease_operator, 30),
	miw.converted_interest_type, 
	'',	 	
	miw.converted_interest,	
	0,	
	miw.geo_id,		
	miw.legal_desc,    
	miw.property_val,	 
	'WDL',	
	GetDate(),	
	miw.converted_prop_type,   
	miw.ptd_sub_code,	
	miw.lease_id + miw.interest_type + miw.owner_id,	
	miw.xref_id,
	@appr_company_id,
	miw.agent_code,
	0,
	case
		when miw.rendered_date in (space(10), '0000000000') then null
		else convert(datetime, miw.rendered_date, 101) 
	end,
	case
		when ltrim(rtrim(miw.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(miw.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(miw.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(miw.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(miw.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(miw.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(miw.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when miw.converted_prop_type = 'P' then 'NR'
		else null
	end,
	case
		when miw.converted_prop_type = 'P' then 'NR'
		else null
	end
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id



insert into
	mineral_import_entity
(
	run_id, 
	entity_id,	
	prop_id, 	
	owner_id,	
	tax_yr,		
	entity_prop_pct, 
	entity_code,	
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_01,
	miw.entity_01,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_01, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_02,
	miw.entity_02,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_02, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_03,
	miw.entity_03,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_03, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_04,
	miw.entity_04,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_04, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_05,
	miw.entity_05,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_05, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_06,
	miw.entity_06,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_06, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_07,
	miw.entity_07,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_07, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_08,
	miw.entity_08,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_08, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_09,
	miw.entity_09,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_09, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_10,
	miw.entity_10,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_10, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_11,
	miw.entity_11,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_11, 0.0) > 0.0


insert into
	mineral_import_entity
(
	run_id,
	entity_id,
	prop_id, 
	owner_id,
	tax_yr,
	entity_prop_pct,
	entity_code,
	pp_seg_id,
	xref
)
select
	@run_id,
	0,
	0,
	0,
	@year,
	miw.pct_12,
	miw.entity_12,
	0,
	miw.xref_id
from
	mineral_import_wardlaw as miw with (nolock)
where
	miw.run_id = @run_id
and	isnull(miw.pct_12, 0.0) > 0.0


/*PROCESS exemption  1 -12*/
insert into
	mineral_import_exemption
(
	run_id, 
	prop_id, 
	owner_id, 
	exmpt_tax_yr, 
	owner_tax_yr, 
	prop_type_cd, 
	exmpt_type_cd, 
	sup_num, 
	sp_value_type, 
	sp_value_option, 
	xref
)
select
	miewv.run_id,
	0,
	0,
	@year,
	@year,
	miewv.prop_type_cd,
	miewv.exmpt_type_cd,
	0,
	'A',
	'M',
	miewv.xref_id
from
	mineral_import_exemption_wardlaw_vw as miewv
where
	miewv.run_id = @run_id
and not exists
(
	select
		* 
	from
		mineral_import_exemption as mie with (nolock)
	where
		miewv.run_id = mie.run_id
	and	miewv.xref_id = mie.xref 
	and	miewv.exmpt_type_cd = mie.exmpt_type_cd
	and	mie.exmpt_tax_yr = @year
)


/* Special Exemptions */
insert into
	mineral_import_special_entity_exemption
(
	run_id, 
	prop_id, 
	owner_id, 
	sup_num, 
	exmpt_tax_yr, 
	owner_tax_yr, 
	exmpt_type_cd, 
	entity_id, 
	entity_code, 
	sp_amt, 
	sp_pct, 
	xref
)
select
	misewv.run_id,
	0,
	0,
	0,
	@year,
	@year,
	misewv.exmpt_type_cd,
	0,
	misewv.entity_code,
	case when misewv.exmpt_type_cd = 'EX366' then 0.0 else misewv.amt end,
	0,
	misewv.xref_id
from
	mineral_import_special_exemption_wardlaw_vw as misewv
where
	misewv.run_id = @run_id

GO

