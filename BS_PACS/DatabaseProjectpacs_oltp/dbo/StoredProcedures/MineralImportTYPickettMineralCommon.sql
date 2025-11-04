

create procedure MineralImportTYPickettMineralCommon
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
       	owner_nbr,
       	owner_rest,
       	address1,
       	address2,
       	city,	
       	st,
	case zip_4 when null then zip else zip + '-' + zip_4 end,
	'TYPICKET',
	GetDate(),
	@appr_company_id
from
	mineral_import_typickett_O1 as mit with (nolock)
left outer join
	mineral_import_owner as mio
on
	mio.run_id = mit.run_id
and	mio.owner_no = mit.owner_nbr
where
	mit.run_id = @run_id
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
	field_cd,
	mineral_zone, 
	rr_comm_num, 
	lease_id, 
	lease_nm, 
	opr, 
	type_of_int, 
	well_type, 
	geo_info,
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
select distinct 
	@run_id,
	0,
	0,
	@year,
	0,
	miO1.owner_nbr,
	left(miL1.field_name, 20),
	'',
	'',
	miO1.lease_nbr,
	miL1.lease_name,
	miL1.operator,
	miO1.interest_type,
	'',
	left(miL1.geo_info, 50),
	miO1.converted_interest,
	0,
	miO1.geo_id,
	miO1.legal_desc,
	miO1.value,
	'TYPICKET',
	GetDate(),
	'MN',
	'G1',
	miO1.lease_nbr + miO1.interest_type + miO1.owner_nbr,
	miO1.geo_id,
	@appr_company_id,
	miO1.agent,
	0,
	case
		when miO1.rend = 'X' then getdate()
		else null
	end,
	case
		when ltrim(rtrim(miO1.agent)) <> '' then
			case
				when miO1.agent_authority = 'A' then 'T'
				when miO1.agent_authority = 'N' then 'T'
				when miO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(miO1.agent)) <> '' then
			case
				when miO1.agent_authority = 'A' then 'T'
				when miO1.agent_authority = 'N' then 'T'
				when miO1.agent_authority = 'O' then 'T'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(miO1.agent)) <> '' then
			case
				when miO1.agent_authority = 'A' then 'T'
				when miO1.agent_authority = 'N' then 'F'
				when miO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(miO1.agent)) <> '' then
			case
				when miO1.agent_authority = 'A' then 'T'
				when miO1.agent_authority = 'N' then 'T'
				when miO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(miO1.agent)) <> '' then
			case
				when miO1.agent_authority = 'A' then 'T'
				when miO1.agent_authority = 'N' then 'T'
				when miO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(miO1.agent)) <> '' then
			case
				when miO1.agent_authority = 'A' then 'T'
				when miO1.agent_authority = 'N' then 'T'
				when miO1.agent_authority = 'O' then 'F'
				else 'F'
			end
		else null
	end,
	case
		when ltrim(rtrim(miO1.agent)) <> '' then
			case
				when miO1.agent_authority = 'A' then 'T'
				when miO1.agent_authority = 'N' then 'F'
				when miO1.agent_authority = 'O' then 'T'
				else 'F'
			end
		else null
	end,
	null,
	null
from
	mineral_import_typickett_O1 as miO1 with (nolock)
left outer join
	mineral_import_typickett_L1 as miL1 with (nolock)
on
	miL1.run_id = miO1.run_id
and	miL1.lease = miO1.lease_nbr
where
	miO1.run_id = @run_id 
 


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
SELECT	
	@run_id,
	0,
	0,
	@year,
	@year,
	'MN',
	'EX',
	0,
	'A',
	'M',
	miO1.geo_id
from
	mineral_import_typickett_O1 as miO1 with (nolock)
where
	miO1.run_id = @run_id
and	left(miO1.owner_rest, 6) = 'EXEMPT'
and	not exists
(
	select
		*
	from
		mineral_import_exemption as mie with (nolock)
where
	run_id = @run_id
and	miO1.geo_id = mie.xref
and	mie.exmpt_type_cd = 'EX'
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
	run_id,
	0,
	0,
	0,
	@year,
	0,
	miev.pct * 100.0,
	miev.entity_code,
	miev.geo_id
from
	mineral_import_typickett_entity_vw as miev
where
	miev.run_id = @run_id

GO

