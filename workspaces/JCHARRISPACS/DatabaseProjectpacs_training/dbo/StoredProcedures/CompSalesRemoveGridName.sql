

create procedure CompSalesRemoveGridName
	@lPacsUserID int,
	@szGridName varchar(255)
as

set nocount on

	declare @lGridID int

	select
		@lGridID = lGridID
	from comp_sales_display_grid with(nolock)
	where
		lPacsUserID = @lPacsUserID and
		szGridName = @szGridName

	exec CompSalesRemoveGrid @lGridID

set nocount off

GO

