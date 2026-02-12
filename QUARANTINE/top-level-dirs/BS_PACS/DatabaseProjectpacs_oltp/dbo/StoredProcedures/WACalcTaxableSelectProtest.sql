
create procedure WACalcTaxableSelectProtest
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

	if ( @lPacsUserID <> 0 )
	begin
		select distinct
			convert(smallint, ap.prop_val_yr),
			ap.prop_id
		from #taxable_property_list as tpl with(nolock)
		join _arb_protest as ap with(nolock) on
			tpl.year = ap.prop_val_yr and
			tpl.prop_id = ap.prop_id and
			ap.prot_complete_dt is null
		order by 1, 2
	end
	else if ( @lPropID <> 0 )
	begin
		select distinct
			convert(smallint, ap.prop_val_yr),
			ap.prop_id
		from _arb_protest as ap with(nolock)
		where
			ap.prop_val_yr = @lYear and
			ap.prop_id = @lPropID and
			ap.prot_complete_dt is null
		order by 1, 2
	end
	else -- Select all
	begin
		select distinct
			convert(smallint, ap.prop_val_yr),
			ap.prop_id
		from _arb_protest as ap with(nolock)
		where
			ap.prop_val_yr = @lYear and
			ap.prot_complete_dt is null
		order by 1, 2
	end

GO

