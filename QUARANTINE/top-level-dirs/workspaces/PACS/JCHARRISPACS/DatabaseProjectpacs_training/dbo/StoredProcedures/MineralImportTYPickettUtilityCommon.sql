

create procedure MineralImportTYPickettUtilityCommon
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
       	uO1.owner_nbr,
       	uO1.owner_rest,
       	uO1.address1,
       	uO1.address2,
       	uO1.city,	
       	uO1.st,
	case uO1.zip_4 when null then uO1.zip else uO1.zip + '-' + uO1.zip_4 end,
	'TYPICKET',
	GetDate(),
	@appr_company_id
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
left outer join
	mineral_import_owner as mio with (nolock)
on
	mio.run_id = uO1.run_id
and	mio.owner_no = uO1.owner_nbr
where
	uO1.run_id = @run_id
and	mio.run_id is null


insert into
	mineral_import_property
(
	run_id, 
	prop_id, 
	owner_id,
	prop_val_yr, 
	pp_seg_id,  
	owner_no, 
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
select distinct 
	@run_id,
	0,
	0,
	@year,
	0,
	uO1.owner_nbr,
	0,
	uN.geo_id,
	uN.legal_desc,
	un.real + uN.pers,
	'TYPICKET',
	GetDate(),
	'P',
	uN.gov_code,
	'09' + uO1.owner_nbr + uN.item_nbr + uN.seq_nbr,
	uN.geo_id,
	@appr_company_id,
	uO1.agent,
	0,
	uO1.rendered_date,
	case
		when ltrim(rtrim(uO1.agent)) <> '' then
			case
				when uO1.agent_authority = 'A' then 'T'
				when uO1.agent_authority = 'N' then 'T'
				when uO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(uO1.agent)) <> '' then
			case
				when uO1.agent_authority = 'A' then 'T'
				when uO1.agent_authority = 'N' then 'T'
				when uO1.agent_authority = 'O' then 'T'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(uO1.agent)) <> '' then
			case
				when uO1.agent_authority = 'A' then 'T'
				when uO1.agent_authority = 'N' then 'F'
				when uO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(uO1.agent)) <> '' then
			case
				when uO1.agent_authority = 'A' then 'T'
				when uO1.agent_authority = 'N' then 'T'
				when uO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(uO1.agent)) <> '' then
			case
				when uO1.agent_authority = 'A' then 'T'
				when uO1.agent_authority = 'N' then 'T'
				when uO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(uO1.agent)) <> '' then
			case
				when uO1.agent_authority = 'A' then 'T'
				when uO1.agent_authority = 'N' then 'T'
				when uO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(uO1.agent)) <> '' then
			case
				when uO1.agent_authority = 'A' then 'T'
				when uO1.agent_authority = 'N' then 'F'
				when uO1.agent_authority = 'O' then 'T'
				else 'F'
			end
		else null
	end,
	'NR',
	'NR'
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N as uN with (nolock)
on
	uN.run_id = uO1.run_id
and	uN.owner_nbr = uO1.owner_nbr
where
	uO1.run_id = @run_id 
 


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
	'P',
	'EX',
	0,
	'A',
	'M',
	uN.geo_id
from
	mineral_import_utility_typickett_O1 as uO1 with (nolock)
inner join
	mineral_import_utility_typickett_N un with (nolock)
on
	uN.owner_nbr = uO1.owner_nbr 
where
	uO1.run_id = @run_id
and	left(uO1.owner_rest, 6) = 'EXEMPT'


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
	mituev.run_id,
	0,
	0,
	0,
	@year,
	0,
	mituev.pct * 100,
	mituev.entity_code,
	mituev.geo_id
from
	mineral_import_typickett_utility_entity_vw as mituev
where
	run_id = @run_id

GO

