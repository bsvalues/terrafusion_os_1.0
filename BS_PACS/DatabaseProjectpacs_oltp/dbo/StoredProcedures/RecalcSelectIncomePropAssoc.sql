
create procedure RecalcSelectIncomePropAssoc
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	/* Note that #recalc_worktable_income_id_assoc is already populated (in RecalcSelectIncome) */

	set nocount on

	truncate table #recalc_worktable_income_prop_assoc_data

	insert #recalc_worktable_income_prop_assoc_data (
		income_id, prop_id, sup_num, prop_val_yr,
		active_valuation,
		income_pct, income_value
	)
	select
		ipa.income_id, ipa.prop_id, ipa.sup_num, ipa.prop_val_yr,
		convert(
			bit,
			case ipa.active_valuation
				when 'T' then 1
				else 0
			end
		),
		ipa.income_pct, ipa.income_value
	from #recalc_worktable_income_id_assoc as t with(nolock)
	join income_prop_assoc as ipa with(nolock) on
		t.income_yr = ipa.prop_val_yr and
		t.sup_num = ipa.sup_num and
		t.income_id = ipa.income_id
	order by
		4 asc, 3 asc, 2 asc, 1 asc

	/* Update the worktable with the improvement main area sizes */
	update #recalc_worktable_income_prop_assoc_data
	set imprv_det_area = (
		select sum(isnull(id.imprv_det_area, 0))
		from imprv_detail as id with(nolock)
		join imprv_det_type as idt with(nolock) on
			idt.imprv_det_type_cd = id.imprv_det_type_cd and
			idt.main_area = 'T'
		where
			id.prop_id = #recalc_worktable_income_prop_assoc_data.prop_id and
			id.prop_val_yr = #recalc_worktable_income_prop_assoc_data.prop_val_yr and
			id.sup_num = #recalc_worktable_income_prop_assoc_data.sup_num and
			id.sale_id = 0
	)

	/* Update the worktable with the number of units */
	update #recalc_worktable_income_prop_assoc_data
	set num_units = (
		select sum(isnull(i.num_imprv, 0))
		from imprv as i with(nolock)
		where
			i.prop_id = #recalc_worktable_income_prop_assoc_data.prop_id and
			i.prop_val_yr = #recalc_worktable_income_prop_assoc_data.prop_val_yr and
			i.sup_num = #recalc_worktable_income_prop_assoc_data.sup_num and
			i.sale_id = 0
	)

	/* Update the worktable with the land sizes */
	update #recalc_worktable_income_prop_assoc_data
	set size_square_feet = (
		select sum(isnull(ld.size_square_feet, 0))
		from land_detail as ld with(nolock)
		where
			ld.prop_id = #recalc_worktable_income_prop_assoc_data.prop_id and
			ld.prop_val_yr = #recalc_worktable_income_prop_assoc_data.prop_val_yr and
			ld.sup_num = #recalc_worktable_income_prop_assoc_data.sup_num and
			ld.sale_id = 0
	)

	set nocount off

	select
		r.prop_id,
		convert(smallint, r.prop_val_yr),
		convert(smallint, r.sup_num),
		r.income_id,
		active_valuation,
		income_pct,
		isnull(income_value, 0),
		isnull(imprv_det_area, 0),
		isnull(num_units, 0),
		isnull(size_square_feet, 0),
		isnull(iplrv.levy_rate, 0)
	from #recalc_worktable_income_prop_assoc_data as r
	with(nolock)
	left outer join income_prop_levy_rate_vw as iplrv
	with (nolock)
	on r.prop_val_yr = iplrv.prop_val_yr
	and r.sup_num = iplrv.sup_num
	and r.prop_id = iplrv.prop_id
	and r.income_id = iplrv.income_id
	order by 1 asc, 2 asc, 3 asc, 4 asc
	option(keep plan)

	return( @@rowcount )

GO

