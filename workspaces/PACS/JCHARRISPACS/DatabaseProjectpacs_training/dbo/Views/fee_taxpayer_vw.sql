
create view fee_taxpayer_vw
as
select
	f.fee_id,
	f.year,
	f.fee_type_cd as type_cd,
	f.effective_due_date as fee_dt,
	f.current_amount_due as fee_amount,
	f.amount_paid as amt_pd,
	(f.current_amount_due - f.amount_paid) as amount_due,
	f.comment,
	faa_account.acct_id as acct_id,
	faa_account.file_as_name as file_as_name,
	faa_address.addr_line1 as addr_line1,
	faa_address.addr_line2 as addr_line2,
	faa_address.addr_line3 as addr_line3,
	faa_address.addr_city addr_city,
	faa_address.addr_state as addr_state,
	faa_address.addr_zip as addr_zip,
	faa_address.country_cd,
	faa_address.is_international
from 		fee as f with (nolock)
inner join	fee_acct_assoc as faa with (nolock)
	on f.fee_id = faa.fee_id
inner join 	account as faa_account with (nolock)
	on faa.acct_id = faa_account.acct_id
inner join 	address as faa_address with (nolock)
	on faa.acct_id = faa_address.acct_id and faa_address.primary_addr = 'Y'
UNION
select
	f.fee_id,
	f.year,
	f.fee_type_cd as type_cd,
	f.effective_due_date as fee_dt,
	f.current_amount_due as fee_amount,
	f.amount_paid as amt_pd,
	(f.current_amount_due - f.amount_paid) as amount_due,
	f.comment,
	fpa_account.acct_id as acct_id,
	fpa_account.file_as_name as file_as_name,
	fpa_address.addr_line1 as addr_line1,
	fpa_address.addr_line2 as addr_line2,
	fpa_address.addr_line3 as addr_line3,
	fpa_address.addr_city addr_city,
	fpa_address.addr_state as addr_state,
	fpa_address.addr_zip as addr_zip,
	fpa_address.country_cd,
	fpa_address.is_international
from 		fee as f with (nolock)
inner join 	fee_prop_assoc as fpa with (nolock)
	on f.fee_id = fpa.fee_id
inner join 	prop_supp_assoc as psa with (nolock)
	on psa.prop_id = fpa.prop_id and psa.owner_tax_yr = (select max(owner_tax_yr) from prop_supp_assoc where prop_id = fpa.prop_id)
inner join	owner as o with (nolock)
	on o.prop_id = psa.prop_id and o.owner_tax_yr = psa.owner_tax_yr and o.sup_num = psa.sup_num
inner join 	account as fpa_account with (nolock) 
	on o.owner_id = fpa_account.acct_id
inner join 	address as fpa_address with (nolock)
	on fpa_account.acct_id = fpa_address.acct_id and fpa_address.primary_addr = 'Y'
where o.owner_id not in (select acct_id from fee_acct_assoc where fee_acct_assoc.fee_id = f.fee_id)
UNION
select
	f.fee_id,
	f.year,
	f.fee_type_cd as type_cd,
	f.effective_due_date as fee_dt,
	f.current_amount_due as fee_amount,
	f.amount_paid as amt_pd,
	(f.current_amount_due - f.amount_paid) as amount_due,
	f.comment,
	fla_account.acct_id as acct_id,
	fla_account.file_as_name as file_as_name,
	fla_address.addr_line1 as addr_line1,
	fla_address.addr_line2 as addr_line2,
	fla_address.addr_line3 as addr_line3,
	fla_address.addr_city addr_city,
	fla_address.addr_state as addr_state,
	fla_address.addr_zip as addr_zip,
	fla_address.country_cd,
	fla_address.is_international
from 		fee as f with (nolock)
inner join 	fee_litigation_assoc as fla with (nolock)
	on f.fee_id = fla.fee_id
inner join 	litigation 
	on fla.litigation_id = litigation.litigation_id
inner join litigation_owner_history loh with(nolock)
	on litigation.litigation_id = loh.litigation_id
inner join 	account as fla_account 
	on loh.owner_id = fla_account.acct_id
inner join address as fla_address 
	on fla_account.acct_id = fla_address.acct_id and fla_address.primary_addr = 'Y'
where loh.owner_id not in 
	(
	select acct_id as owner_id from fee_acct_assoc with (nolock) where fee_acct_assoc.fee_id = f.fee_id
	union
	select owner.owner_id 
	from fee_prop_assoc with (nolock)
	inner join prop_supp_assoc with (nolock)
	on prop_supp_assoc.prop_id = fee_prop_assoc.prop_id and prop_supp_assoc.owner_tax_yr = (select max(owner_tax_yr) from prop_supp_assoc where prop_id = fee_prop_assoc.prop_id)
	inner join owner with (nolock)
	on owner.prop_id = prop_supp_assoc.prop_id and owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr and owner.sup_num = prop_supp_assoc.sup_num
	where fee_prop_assoc.fee_id = f.fee_id
	)

GO

