
create procedure CompSalesSetCorpGridOptionsTemp
	@lTempPropGridID int,
	@lBPPValue int,
	@cSystemBPP char(1),
	@lOGBValue int
as

set nocount on

	begin transaction

	update comp_sales_temp_corp_grid_options with(rowlock) set
		lBPPValue = @lBPPValue,
		cSystemBPP = @cSystemBPP,
		lOGBValue = @lOGBValue
	where
		lTempPropGridID = @lTempPropGridID

	if ( @@rowcount = 0 )
	begin
		insert comp_sales_temp_corp_grid_options with(rowlock) (
			lTempPropGridID, lBPPValue, cSystemBPP, lOGBValue
		) values (
			@lTempPropGridID, @lBPPValue, @cSystemBPP, @lOGBValue
		)
	end

	commit transaction

GO

