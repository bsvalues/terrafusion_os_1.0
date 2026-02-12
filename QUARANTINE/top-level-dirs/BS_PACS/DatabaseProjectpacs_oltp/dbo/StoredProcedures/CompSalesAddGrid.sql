

create procedure CompSalesAddGrid
	@lPacsUserID int,
	@szGridName varchar(255),
	@szGridType varchar(5),
	@cResidentialGrid char(1)
as

set nocount on

	declare @lGridID int
	declare @lNumGrids int

	begin transaction

	insert comp_sales_display_grid with(rowlock) (
		lPacsUserID, szGridName, szGridType	, cResidentialGrid
	) values (
		@lPacsUserID, @szGridName, @szGridType	, @cResidentialGrid
	)

	set @lGridID = @@identity

	select @lNumGrids = count(*)
	from comp_sales_display_grid with(nolock)
	where
		lPacsUserID = @lPacsUserID and
		cResidentialGrid = @cResidentialGrid and
		szGridType = @szGridType

	if @lNumGrids = 1
	begin
		/* Must have a default grid */
		update comp_sales_display_grid with(rowlock) set
			cDefault = 'T'
		where
			lGridID = @lGridID
	end

	commit transaction

set nocount off

	select lGridID = @lGridID

GO

