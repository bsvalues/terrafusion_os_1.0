

CREATE PROCEDURE MineralImportPritchardAbbottCommon
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
	mipa.owner_number,
	mipa.owner_name,
	case mipa.in_care_of when null then street_addr else mipa.in_care_of end,
	case mipa.in_care_of when null then null else mipa.street_addr end,
	null,
	mipa.city,
	mipa.state,
	mipa.zip,
	'P&A',
	GetDate(),
	@appr_company_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and not exists
(
	select
		*  
	from
		mineral_import_owner as mio with (nolock)
	where
		mio.owner_no = mipa.owner_number 
	and	mio.run_id = @run_id
)


	   	
insert into
	mineral_import_property
(
	run_id, 
	prop_id, 
	owner_id, 	
	prop_val_yr,
	pp_seg_id,
	owner_no ,
	rr_comm_num, 
	lease_id, 
	lease_nm, 
	opr, 
	type_of_int, 
	mineral_int_pct, 
	new_val,
	mipa.geo_id, 
	legal_desc, 
	value, 
	source, 
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
	mipa.owner_number,
	mipa.rrc, 
	mipa.lease_number, 
	mipa.lease_name, 
	mipa.oper_name, 
	mipa.interest_type, 
	mipa.decimal_interest, 
	0,
	mipa.geo_id, 
	mipa.legal_desc, 
	mipa.value,
	'P&A', 
	mipa.converted_prop_type, 
	mipa.state_cd, 
	mipa.ref_id1, 
	mipa.geo_id,
	@appr_company_id,
	mipa.agent_number,
	0,
	case
		when mipa.compliance_code = 'A1' then convert(datetime, '04/15/' + convert(varchar(4), @year))
		when mipa.compliance_code = 'A3' then convert(datetime, '04/19/' + convert(varchar(4), @year))
		when mipa.compliance_code = 'B1' then convert(datetime, '05/15/' + convert(varchar(4), @year))
		when mipa.compliance_code = 'B3' then convert(datetime, '05/19/' + convert(varchar(4), @year))
		when mipa.compliance_code = 'C1' then convert(datetime, '05/30/' + convert(varchar(4), @year))
		when mipa.compliance_code = 'C3' then convert(datetime, '06/04/' + convert(varchar(4), @year))
		else null
	end,
	case
		when ltrim(rtrim(mipa.agent_number)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mipa.agent_number)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mipa.agent_number)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mipa.agent_number)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mipa.agent_number)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mipa.agent_number)) <> '' then 'T'
		else null
	end,
	case
		when ltrim(rtrim(mipa.agent_number)) <> '' then 'T'
		else null
	end,
	case
		when mipa.converted_prop_type = 'P' then
			case
				when left(mipa.compliance_code, 1) = 'C' then 'G'
				when left(mipa.compliance_code, 1) = 'B' then 'G'
				else 'NR'
			end
		else null
	end,
	case
		when mipa.converted_prop_type = 'P' then
			case
				when left(mipa.compliance_code, 1) = 'C' then 'G'
				else 'NR'
			end
		else null
	end
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id 

	
/* IMPORT ENTITIY  */

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
	case mipa.value when 0 then 0.0 else (mipa.ent1_market / mipa.value) * 100 end,
	mipa.ent1,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent1,''))) > 0


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
	case mipa.value when 0 then 0.0 else (mipa.ent2_market / mipa.value) * 100 end,
	mipa.ent2,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent2,''))) > 0



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
	case mipa.value when 0 then 0.0 else (mipa.ent3_market / mipa.value) * 100 end,
	mipa.ent3,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent3,''))) > 0



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
	case mipa.value when 0 then 0.0 else (mipa.ent4_market / mipa.value) * 100 end,
	mipa.ent4,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent4,''))) > 0



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
	case mipa.value when 0 then 0.0 else (mipa.ent5_market / mipa.value) * 100 end,
	mipa.ent5,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent5,''))) > 0



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
	case mipa.value when 0 then 0.0 else (mipa.ent6_market / mipa.value) * 100 end,
	mipa.ent6,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent6,''))) > 0



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
	case mipa.value when 0 then 0.0 else (mipa.ent7_market / mipa.value) * 100 end,
	mipa.ent7,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent7,''))) > 0


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
	case mipa.value when 0 then 0.0 else (mipa.ent8_market / mipa.value) * 100 end,
	mipa.ent8,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent8,''))) > 0



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
	case mipa.value when 0 then 0.0 else (mipa.ent9_market / mipa.value) * 100 end,
	mipa.ent9,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent9,''))) > 0



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
	case mipa.value when 0 then 0.0 else (mipa.ent10_market / mipa.value) * 100 end,
	mipa.ent10,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent10,''))) > 0


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
	case mipa.value when 0 then 0.0 else (mipa.ent11_market / mipa.value) * 100 end,
	mipa.ent11,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent11,''))) > 0


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
	case mipa.value when 0 then 0.0 else (mipa.ent12_market / mipa.value) * 100 end,
	mipa.ent12,
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent12,''))) > 0



/*IMPORT EXEMPTION*/
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
	mipa.converted_prop_type,  
	case mipa.ent1_exmpt_type_cd 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent1_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent1_exmpt_type_cd) in ('A', 'T', 'F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock)
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent1_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)


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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent2_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent2_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent2_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock)
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent2_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent3_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	run_id = @run_id
and	len(rtrim(isnull(mipa.ent3_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent3_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent3_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(ent4_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent4_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent4_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent4_exmpt_type_cd, '')))
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent5_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent5_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent5_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent5_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent6_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent6_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent6_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock)
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent6_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent7_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent7_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent7_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent7_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent8_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent8_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent8_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent8_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent9_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent9_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent9_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent9_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent10_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent10_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent10_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent10_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)

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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent11_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id and len(rtrim(isnull(mipa.ent11_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent11_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock) 
	where
		mie.run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent11_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)


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
	mipa.converted_prop_type,  
	case rtrim(ltrim(isnull(mipa.ent12_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		when 'E' then 'EX'
		else ''
	end,
	0, 
	'A',  
	'M',  
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent12_exmpt_type_cd, ''))) > 0 
and	rtrim(mipa.ent12_exmpt_type_cd) in ('A', 'T','F', 'G', 'L', 'E')
and not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock)
	where
		run_id = @run_id
	and	mipa.geo_id = mie.xref
	and	mie.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent12_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				when 'E' then 'EX'
				else ''
			end
)



/*IMPORT SPECIAL ENTITY EXEMPTION*/

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
	case ltrim(rtrim(isnull(mipa.ent1_exmpt_type_cd, '')))
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent1,  
	mipa.ent1_market - mipa.ent1_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent1_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent1_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent1_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent1 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent1_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)

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
	case ltrim(rtrim(isnull(mipa.ent2_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent2,  
	mipa.ent2_market - mipa.ent2_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent2_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent2_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent2_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent2 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent2_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)

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
	case ltrim(rtrim(isnull(mipa.ent3_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent3,  
	mipa.ent3_market - mipa.ent3_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent3_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent3_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent3_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent3 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent3_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)

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
	case ltrim(rtrim(isnull(mipa.ent4_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent4,  
	mipa.ent4_market - mipa.ent4_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent4_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent4_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent4_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent4 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent4_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)

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
	case ltrim(rtrim(isnull(mipa.ent5_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent5,  
	mipa.ent5_market - mipa.ent5_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent5_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent5_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent5_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent5 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent5_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)

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
	case ltrim(rtrim(isnull(mipa.ent6_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent6,  
	mipa.ent6_market - mipa.ent6_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent6_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent6_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent6_exmpt_type_cd)) <> 'E'  
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent6 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent6_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)


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
	case ltrim(rtrim(isnull(mipa.ent7_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent7,  
	mipa.ent7_market - mipa.ent7_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent7_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent7_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent7_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent7 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent7_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)


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
	case ltrim(rtrim(isnull(mipa.ent8_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent8,  
	mipa.ent8_market - mipa.ent8_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent8_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent8_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent8_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent8 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent8_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)


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
	case ltrim(rtrim(isnull(mipa.ent9_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent9,  
	mipa.ent9_market - mipa.ent9_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent9_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent9_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent9_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent9 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent9_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)


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
	case ltrim(rtrim(isnull(mipa.ent10_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent10,  
	mipa.ent10_market - mipa.ent10_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent10_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent10_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent10_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent10 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent10_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)


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
	case ltrim(rtrim(isnull(mipa.ent11_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent11,  
	mipa.ent11_market - mipa.ent11_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent11_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent11_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent11_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent11 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent11_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)


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
	case ltrim(rtrim(isnull(mipa.ent12_exmpt_type_cd, ''))) 
		when 'A' then 'AB'
		when 'F' then 'FR'	
		when 'T' then 'PC'	
		when 'G' then 'EX366'	
		when 'L' then 'EX366'	
		else ''
	end,
	0, 
	mipa.ent12,  
	mipa.ent12_market - mipa.ent12_taxable, 
	0, 
	mipa.geo_id
from
	mineral_import_pritchard_abbott as mipa with (nolock)
where
	mipa.run_id = @run_id
and	len(rtrim(isnull(mipa.ent12_exmpt_type_cd,''))) > 0
and	ltrim(rtrim(mipa.ent12_exmpt_type_cd)) <> 'EX'
and	ltrim(rtrim(mipa.ent12_exmpt_type_cd)) <> 'E'
and not exists
(
	select
		*
	from
		mineral_import_special_entity_exemption as misee with (nolock) 
	where
		misee.run_id = @run_id
	and	mipa.geo_id = misee.xref
	and	misee.exmpt_tax_yr = @year
	and	misee.owner_tax_yr = @year
	and	mipa.ent12 = misee.entity_code
	and	misee.exmpt_type_cd = 
			case rtrim(ltrim(isnull(mipa.ent12_exmpt_type_cd, ''))) 
				when 'A' then 'AB'
				when 'F' then 'FR'	
				when 'T' then 'PC'	
				when 'G' then 'EX366'	
				when 'L' then 'EX366'
				else ''
			end
)

GO

