
create procedure RecalcRowUpdateIncomePropAssoc
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lIncomeID int,

	@income_value numeric(14,0)
as

set nocount on

	update income_prop_assoc with(rowlock)
	set
		income_value = @income_value
	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		income_id = @lIncomeID

GO

