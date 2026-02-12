
create view dbo.property_freeze_vw
as
select
	pf.*,
	oa.confidential_flag as confidential_owner,
	oa.file_as_name as owner_name,
	oa.confidential_file_as_name as confidential_owner_name,
	e.entity_cd,
	e.entity_type_cd,
	ea.confidential_flag as confidential_entity,
	ea.file_as_name as entity_name,
	ea.confidential_file_as_name as confidential_entity_name,
	et.exmpt_desc
from
	property_freeze as pf with (nolock)
inner join
	owner as o with (nolock)
on
	pf.owner_id = o.owner_id
and	pf.owner_tax_yr = o.owner_tax_yr
and	pf.sup_num = o.sup_num
and	pf.prop_id = o.prop_id
inner join
	account as oa with (nolock)
on
	o.owner_id = oa.acct_id
inner join
	entity as e with (nolock)
on
	pf.entity_id = e.entity_id
inner join
	account as ea with (nolock)
on
	pf.entity_id = ea.acct_id
inner join
	exmpt_type as et with (nolock)
on
	pf.exmpt_type_cd = et.exmpt_type_cd

GO

