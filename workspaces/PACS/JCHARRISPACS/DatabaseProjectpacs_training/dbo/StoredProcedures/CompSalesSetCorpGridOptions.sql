
create procedure CompSalesSetCorpGridOptions
	@lPropGridID int,
	@lBPPValue int = 0,
	@cSystemBPP char(1) = 'T',
	@lOGBValue int = 0
as

set nocount on

	begin transaction

	update comp_sales_corp_grid_options with(rowlock) set
		lBPPValue = @lBPPValue,
		cSystemBPP = @cSystemBPP,
		lOGBValue = @lOGBValue
	where
		lPropGridID = @lPropGridID

	if @@rowcount = 0
	begin
		insert comp_sales_corp_grid_options with(rowlock) (
			lPropGridID, lBPPValue, cSystemBPP, lOGBValue
		) values (
			@lPropGridID, @lBPPValue, @cSystemBPP, @lOGBValue
		)
	end

	commit transaction

GO

