
create procedure RecalcSelectEntityPropAssocIncome
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	/* Note that #recalc_worktable_income_prop_assoc is already populated (in RecalcSelectIncome) */

	select
		epa.prop_id,
		convert(smallint, epa.tax_yr),
		convert(smallint, epa.sup_num),
		epa.entity_id
	from #recalc_worktable_income_prop_assoc as t with(nolock)
	join entity_prop_assoc as epa with(nolock) on
		t.prop_val_yr = epa.tax_yr and
		t.sup_num = epa.sup_num and
		t.prop_id = epa.prop_id
	order by
		1 asc, 2 asc, 3 asc, 4 asc

	return( @@rowcount )

GO

