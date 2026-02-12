

create   procedure MineralImportCapitolCommon
	@run_id int,
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
	mic.computed_owner_no, 
	mic.owner_name, 
	case mic.owner_name2 when null then mic.owner_name else mic.owner_addr1 end, 
	case mic.owner_name2 when null then mic.owner_addr1 else mic.owner_addr2 end,
	case mic.owner_name2 when null then mic.owner_addr2 else null end, 
	mic.city, 
	mic.state, 
	case mic.zip_code2 when null then mic.zip_code1 else isnull(mic.zip_code1, '') + isnull(mic.zip_code2, '') end,
	'CAPITOL', 
	getdate(),
	@appr_company_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id


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
	mic.computed_owner_no,
	'',	
	'',
	mic.rrc_number,
	mic.do_lease_number,
	'',
	'', 
	mic.interest_type, 
	'',	 	
	mic.interest,	
	mic.new_imprv_value,	
	mic.geo_id,	
	mic.legal_desc,    
	mic.maximum_market,	 
	'CAPITOL',	
	getdate(),	
	mic.converted_prop_type_cd,   
	mic.sptb_code,		
	mic.account_number,	
	mic.geo_id,
	@appr_company_id,
	mic.agent_code,
	0,
	case
		when mic.rendered_flag in ('T', 'Y') then getdate()
		else null
	end,
	case
		when ltrim(rtrim(mic.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mic.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mic.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mic.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mic.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mic.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mic.agent_code)) <> '' then 'T'
		else null
	end,
	case
		when mic.converted_prop_type_cd = 'P' then 'NR'
		else null
	end,
	case
		when mic.converted_prop_type_cd = 'P' then 'NR'
		else null
	end
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id



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
	@run_id, 
	0, 
	0, 
	@year, 
	@year, 
	mic.converted_prop_type_cd,  
	mic.exmpt_type_cd, 
	0, 
	mic.sp_value_type,  
	mic.sp_value_option,  
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(ltrim(mic.exmpt_type_cd))) > 0
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock)
	where
		mie.run_id = @run_id
	and	mie.xref = mic.geo_id
	and	mie.exmpt_type_cd = mic.exmpt_type_cd
)


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent1_pc * 100, 
	mic.ent1_type + mic.ent1_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent1_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent2_pc * 100, 
	mic.ent2_type + mic.ent2_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent2_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent3_pc * 100, 
	mic.ent3_type + mic.ent3_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent3_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent4_pc * 100, 
	mic.ent4_type + mic.ent4_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent4_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent5_pc * 100, 
	mic.ent5_type + mic.ent5_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent5_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent6_pc * 100, 
	mic.ent6_type + mic.ent6_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	run_id = @run_id
and	len(rtrim(isnull(mic.ent6_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent7_pc * 100, 
	mic.ent7_type + mic.ent7_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent7_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent8_pc * 100, 
	mic.ent8_type + mic.ent8_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent8_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent9_pc * 100, 
	mic.ent9_type + mic.ent9_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent9_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent10_pc * 100, 
	mic.ent10_type + mic.ent10_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent10_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent11_pc * 100, 
	mic.ent11_type + mic.ent11_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent11_type,''))) > 0


insert into
	mineral_import_entity
(
	run_id, 
	entity_id, 
	prop_id, 
	owner_id, 
	tax_yr, 
	pp_seg_id, 
	entity_prop_pct, 
	entity_code, 
	xref
)
select
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	0, 
	mic.ent12_pc * 100, 
	mic.ent12_type + mic.ent12_code, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent12_type,''))) > 0



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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent1_type + mic.ent1_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent1_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent2_type + mic.ent2_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent2_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent3_type + mic.ent3_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent3_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent4_type + mic.ent4_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent4_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent5_type + mic.ent5_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent5_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent6_type + mic.ent6_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	run_id = @run_id
and	len(rtrim(isnull(mic.ent6_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent7_type + mic.ent7_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent7_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent8_type + mic.ent8_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent8_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent9_type + mic.ent9_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent9_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent10_type + ent10_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent10_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent11_type + mic.ent11_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent11_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')


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
	@run_id, 
	0, 
	0, 
	0, 
	@year, 
	@year, 
	mic.exmpt_type_cd, 
	0, 
	mic.ent12_type + mic.ent12_code,  
	mic.maximum_market * mic.exemption_pc, 
	0, 
	mic.geo_id
from
	mineral_import_capitol as mic with (nolock)
where
	mic.run_id = @run_id
and	len(rtrim(isnull(mic.ent12_type,''))) > 0
and	isnull(mic.exmpt_type_cd,'') in ('PC','AB','EX366','FR')

GO

