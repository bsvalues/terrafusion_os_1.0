
create view prop_accepted_supp_assoc_vw
as

	select distinct
		owner_tax_yr = pv.prop_val_yr,
		sup_num = max(pv.sup_num),
		prop_id = pv.prop_id
	from property_val as pv with(nolock)
	left outer join supplement as s with(nolock) on
		s.sup_tax_yr = pv.prop_val_yr and
		s.sup_num = pv.sup_num
	left outer join sup_group as sg with(nolock) on
		sg.sup_group_id = s.sup_group_id
	where
		(sg.status_cd is null or sg.status_cd in ('A','BC'))
		or (isNull(pv.accept_create_id, 0) > 0)
	group by pv.prop_val_yr, pv.prop_id

GO

