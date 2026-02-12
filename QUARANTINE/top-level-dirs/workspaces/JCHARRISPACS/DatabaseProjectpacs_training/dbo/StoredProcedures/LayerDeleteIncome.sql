
create procedure LayerDeleteIncome
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
as

	-- Formerly DeletePropertySupplementLayer would only delete one income ID
	-- This is corrected.
	declare @tblIncomeID table (
		income_id int not null,
		primary key clustered(income_id)
	)


set nocount on

	insert @tblIncomeID (income_id)
	select ipa.income_id
	from income_prop_assoc as ipa with(nolock)
	where
		ipa.prop_val_yr = @lYear and
		ipa.sup_num = @lSupNum and
		ipa.prop_id = @lPropID

	delete ipfa
	from income_pro_forma_assoc as ipfa with (rowlock)
	join @tblIncomeID as t on
		ipfa.pf_income_id = t.income_id
	where
		ipfa.income_yr = @lYear and
		ipfa.sup_num = @lSupNum


	delete ipa
	from income_prop_assoc as ipa with(rowlock)
	where
		ipa.prop_val_yr = @lYear and
		ipa.sup_num = @lSupNum and
		ipa.prop_id = @lPropID


	delete i
	from dbo.income as i with(rowlock)
	join @tblIncomeID as t on
		t.income_id = i.income_id
	where
		i.income_yr = @lYear and
		i.sup_num = @lSupNum and
		not exists (
			select ipa.prop_val_yr
			from dbo.income_prop_assoc as ipa with(nolock)
			where
				ipa.prop_val_yr = i.income_yr and
				ipa.sup_num = i.sup_num and
				ipa.income_id = i.income_id
		)

	delete dbo.property_income_characteristic_unit_mix with(rowlock)
	where year = @lYear and sup_num = @lSupNum and prop_id = @lPropID

	delete dbo.property_income_characteristic_tenant with(rowlock)
	where year = @lYear and sup_num = @lSupNum and prop_id = @lPropID

	delete dbo.property_income_characteristic_amount with(rowlock)
	where year = @lYear and sup_num = @lSupNum and prop_id = @lPropID

	delete dbo.property_income_characteristic with(rowlock)
	where year = @lYear and sup_num = @lSupNum and prop_id = @lPropID

	return(0)

GO

