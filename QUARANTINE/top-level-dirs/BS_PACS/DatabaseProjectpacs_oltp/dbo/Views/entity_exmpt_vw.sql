
create view entity_exmpt_vw as
select
	ltrim(rtrim(e.entity_cd)) as entity_cd,
	ee.entity_id,
	ltrim(rtrim(e.entity_type_cd)) as entity_type_cd,
	ltrim(rtrim(ee.exmpt_type_cd)) as exmpt_type_cd,
	a.file_as_name as entity_name,
	ee.exmpt_tax_yr,
	ee.entity_exmpt_desc,
	ltrim(rtrim(ee.special_exmpt)) as special_exmpt,
	ee.local_option_pct,
	ee.state_mandate_amt,
	ee.local_option_min_amt,
	ee.local_option_amt,
	ltrim(rtrim(ee.apply_pct_ownrship)) as apply_pct_ownrship,
	ee.freeze_flag,
	ee.transfer_flag,
	ee.set_initial_freeze_date,
	ee.set_initial_freeze_user_id
from
	entity_exmpt as ee with (nolock)
inner join
	entity as e with (nolock)
on
	e.entity_id = ee.entity_id
inner join
	account as a with (nolock)
on
	a.acct_id = e.entity_id
inner join
	exmpt_type as et with (nolock)
on
	et.exmpt_type_cd = ee.exmpt_type_cd

GO

