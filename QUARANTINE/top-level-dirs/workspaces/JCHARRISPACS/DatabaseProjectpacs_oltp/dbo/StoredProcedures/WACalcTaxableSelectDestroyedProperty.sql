
create procedure WACalcTaxableSelectDestroyedProperty
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as

	if ( @lPacsUserID <> 0 )
	begin
		select
			convert(smallint, pd.prop_val_yr),
			convert(smallint, pd.sup_num),
			pd.prop_id,
			pd.date_destroyed,
			pd.percent_destroyed,
			pd.jan1_taxable_classified + pd.jan1_taxable_non_classified as january_one_value,
			pd.jan1_taxable_classified,
			pd.jan1_taxable_non_classified
		from #taxable_property_list as tpl with(nolock)
		join destroyed_property as pd with(nolock) on
			tpl.year = pd.prop_val_yr and
			tpl.sup_num = pd.sup_num and
			tpl.prop_id = pd.prop_id
		order by 1, 2, 3
	end
	else if ( @lPropID <> 0 )
	begin
		select
			convert(smallint, pd.prop_val_yr),
			convert(smallint, pd.sup_num),
			pd.prop_id,
			pd.date_destroyed,
			pd.percent_destroyed,
			pd.jan1_taxable_classified + pd.jan1_taxable_non_classified as january_one_value,
			pd.jan1_taxable_classified,
			pd.jan1_taxable_non_classified
		from destroyed_property as pd with(nolock)
		where
			pd.prop_val_yr = @lYear and
			pd.sup_num = @lSupNum and
			pd.prop_id = @lPropID
		order by 1, 2, 3
	end
	else -- Select all
	begin
		select
			convert(smallint, pd.prop_val_yr),
			convert(smallint, pd.sup_num),
			pd.prop_id,
			pd.date_destroyed,
			pd.percent_destroyed,
			pd.jan1_taxable_classified + pd.jan1_taxable_non_classified as january_one_value,
			pd.jan1_taxable_classified,
			pd.jan1_taxable_non_classified
		from destroyed_property as pd with(nolock)
		where
			pd.prop_val_yr = @lYear and
			pd.sup_num = @lSupNum
		order by 1, 2, 3
	end

GO

