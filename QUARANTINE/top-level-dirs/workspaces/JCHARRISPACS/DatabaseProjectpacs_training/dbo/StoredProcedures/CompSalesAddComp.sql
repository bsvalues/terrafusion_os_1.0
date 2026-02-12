

create procedure CompSalesAddComp
	@lPropGridID int,
	@lCompPropID int,
	@lSaleID int,
	@lColWidthGrid int = 2160 /* 1.5 inches in twips */
as

set nocount on

	begin transaction

	update comp_sales_property with(rowlock) set
		lColWidthGrid = @lColWidthGrid
	where
		lPropGridID = @lPropGridID and
		lCompPropID = @lCompPropID and
		lSaleID = @lSaleID

	if ( @@rowcount = 0 )
	begin
		insert comp_sales_property with(rowlock) (
			lPropGridID, lCompPropID, lColWidthGrid, lSaleID
		) values (
			@lPropGridID, @lCompPropID, @lColWidthGrid, @lSaleID
		)
	end

	commit transaction

set nocount off

GO

