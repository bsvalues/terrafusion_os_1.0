
create view mineral_import_report_vw
as

select
	mip.run_id,
	poesc.entity_id,
	rtrim(pvsc.state_cd) as state_cd,
	sum(poesc.market) as poesc_market
from
	property_owner_entity_state_cd as poesc with (nolock)
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = poesc.prop_id
and	pv.prop_val_yr = poesc.year
and	pv.sup_num = poesc.sup_num
and	pv.prop_inactive_dt is null
inner join
	property_val_state_cd as pvsc with (nolock)
on
	pvsc.prop_id = pv.prop_id
and	pvsc.prop_val_yr = pv.prop_val_yr
and	pvsc.sup_num = pv.sup_num
inner join
(
	select
		mip1.run_id,
		mip1.prop_val_yr,
		isnull(sc1.ptd_state_cd, '') as state_cd
	from
		mineral_import_property as mip1 with (nolock)
	inner join
		state_code as sc1 with (nolock)
	on
		rtrim(sc1.state_cd) = rtrim(mip1.state_cd)
	group by
		mip1.run_id,
		mip1.prop_val_yr,
		isnull(sc1.ptd_state_cd, '')
) as mip
on
	mip.prop_val_yr = pvsc.prop_val_yr
and	rtrim(mip.state_cd) = rtrim(pvsc.state_cd)
inner join
(
	select
		run_id,
		entity_id
	from
		mineral_import_entity with (nolock)
	group by
		run_id,
		entity_id
) as mie
on
	mie.run_id = mip.run_id
and	mie.entity_id = poesc.entity_id
where
	poesc.sup_num = 0
group by
	mip.run_id,
	poesc.entity_id,
	rtrim(pvsc.state_cd)

GO

