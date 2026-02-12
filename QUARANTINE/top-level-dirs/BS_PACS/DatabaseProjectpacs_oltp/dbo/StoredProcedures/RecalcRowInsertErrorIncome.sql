
create procedure RecalcRowInsertErrorIncome
	@lYear numeric(4,0),
	@lSupNum int,
	@lIncomeID int,
	@error varchar(255),
	@method varchar(5)
as

set nocount on

	insert income_recalc_errors with(rowlock) (
		income_yr, sup_num, income_id, error, method
	) values (
		@lYear, @lSupNum, @lIncomeID, @error, @method
	)

GO

