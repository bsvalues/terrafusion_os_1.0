
CREATE VIEW dbo.PROPERTY_COL_AGENT_VW
AS
select
	p.prop_id,
	p.col_agent_id as agent_id,
	p.col_owner_id as owner_id,
	owner_account.file_as_name as owner_file_as_name,
	pt.prop_type_desc,
	pv.legal_desc,
	p.geo_id
from
	property as p with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = p.prop_id
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
inner join
	property_type as pt with (nolock)
on
	pt.prop_type_cd = p.prop_type_cd
inner join
	account as agent_account with (nolock)
on
	agent_account.acct_id = p.col_agent_id
inner join
	account as owner_account with (nolock)
on
	owner_account.acct_id = p.col_owner_id
where
	pv.prop_val_yr in
	(
		select
			max(owner_tax_yr)
		from
			prop_supp_assoc with (nolock)
		where
			psa.prop_id = p.prop_id
	)

GO

