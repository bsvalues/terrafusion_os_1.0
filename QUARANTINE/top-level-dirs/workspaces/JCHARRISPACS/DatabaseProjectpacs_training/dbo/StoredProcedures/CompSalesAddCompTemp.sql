
create procedure CompSalesAddCompTemp
	@lPropGridID int,
	@lCompPropID int,
	@lSaleID int,
	@lColWidthGrid int = 2160 /* 1.5 inches in twips */
as

set nocount on

	begin transaction

	update comp_sales_temp_property with(rowlock) set
		lColWidthGrid = @lColWidthGrid
	where
		lTempPropGridID = @lPropGridID and
		lCompPropID = @lCompPropID and
		lSaleID = @lSaleID

	if ( @@rowcount = 0 )
	begin
		insert comp_sales_temp_property with(rowlock) (
			lTempPropGridID, lCompPropID, lColWidthGrid, lSaleID
		) values (
			@lPropGridID, @lCompPropID, @lColWidthGrid, @lSaleID
		)
	end

	commit transaction

set nocount off

GO

