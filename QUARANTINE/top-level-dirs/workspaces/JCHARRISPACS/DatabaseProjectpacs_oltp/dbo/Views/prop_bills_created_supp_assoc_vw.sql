
create view prop_bills_created_supp_assoc_vw
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
		(sg.status_cd is null 
		or
		(isNull(sg.status_cd, '') = 'BC' and isNull(sg.sup_bill_status, '') = 'BA' ))
		or (isNull(pv.accept_create_id, 0) > 0)
		
	group by pv.prop_val_yr, pv.prop_id
	union all
	select distinct
		owner_tax_yr = wag.tax_year,
		sup_num = s.sup_num,
		prop_id = ag.prop_id
	from ag_rollback ag with (nolock)
	join wash_ag_rollback wag with (nolock) on 
		wag.ag_rollbk_id = ag.ag_rollbk_id
	join supplement s with (nolock) on
		s.sup_tax_yr = wag.tax_year		
		and (s.sup_group_id = ag.accept_sup_group_id
			or s.sup_group_id = ag.void_sup_group_id)

GO

