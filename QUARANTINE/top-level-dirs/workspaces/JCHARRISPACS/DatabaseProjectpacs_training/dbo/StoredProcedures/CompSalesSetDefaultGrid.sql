

create procedure CompSalesSetDefaultGrid
	@lPacsUserID int,
	@lGridID int,
	@cResidentialGrid char(1),
	@szGridType varchar(5)
as

set nocount on

	update comp_sales_display_grid with(rowlock) set
		cDefault = case
			when
				lGridID = @lGridID
			then
				'T'
			else
				'F'
		end
	where
		lPacsUserID = @lPacsUserID and
		--cResidentialGrid = @cResidentialGrid and
		szGridType = @szGridType

set nocount off

GO

