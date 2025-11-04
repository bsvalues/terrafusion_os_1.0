
create view mineral_import_poesc_compare_vw
as

select
	mipsc.run_id,
	poesc.entity_id,
	rtrim(pvsc.state_cd) as state_cd,
	count(poesc.market) as poesc_count,
	sum(poesc.market) as poesc_market,
	count(mip.value) as import_count,
	sum(isnull(mip.value, 0) * (isnull(mie2.entity_prop_pct, 0) / 100.0)) as import_market
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
) as mipsc
on
	mipsc.prop_val_yr = pvsc.prop_val_yr
and	rtrim(mipsc.state_cd) = rtrim(pvsc.state_cd)
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
	mie.run_id = mipsc.run_id
and	mie.entity_id = poesc.entity_id
left outer join
	mineral_import_entity as mie2 with (nolock)
on
	mie2.run_id = mipsc.run_id
and	mie2.prop_id = poesc.prop_id
and	mie2.owner_id = poesc.owner_id
and	mie2.entity_id = poesc.entity_id
and	mie2.tax_yr = poesc.year
and	mie2.entity_def = 0
left outer join
(
	select
		mip2.run_id,
		mip2.prop_id,
		mip2.owner_id,
		mip2.prop_val_yr,
		mip2.value,
		isnull(sc2.ptd_state_cd, '') as state_cd
	from
		mineral_import_property as mip2 with (nolock)
	inner join
		state_code as sc2 with (nolock)
	on
		rtrim(sc2.state_cd) = rtrim(mip2.state_cd)
) as mip
on
	mip.run_id = mie.run_id
and	mip.prop_id = poesc.prop_id
and	mip.owner_id = poesc.owner_id
and	mip.prop_val_yr = poesc.year
and	rtrim(mip.state_cd) = rtrim(pvsc.state_cd)
where
	poesc.sup_num = 0
group by
	mipsc.run_id,
	poesc.entity_id,
	rtrim(pvsc.state_cd)

GO

