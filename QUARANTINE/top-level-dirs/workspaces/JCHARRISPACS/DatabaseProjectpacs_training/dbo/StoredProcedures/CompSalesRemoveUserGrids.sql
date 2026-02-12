

create procedure CompSalesRemoveUserGrids
	@lPacsUserID int,
	@cGridType char(1)
as

set nocount on

	begin transaction

	declare @lGridID int
	declare @lGridsExist int

	set @lGridsExist = 0

	/* Cursor to enumerate the grids belonging to the user */
	declare curGrids scroll cursor
	for
		select
			lGridID
		from comp_sales_display_grid
		where
			lPacsUserID = @lPacsUserID
		and	cResidentialGrid = @cGridType
	for update

	open curGrids
	fetch next from curGrids into @lGridID

	/* For each grid */
	while @@fetch_status = 0
	begin
		/* We can only delete a grid if it is not associated with any property grids */
		if not exists (
			select
				lPropGridID
			from comp_sales_property_grids with(nolock)
			where
				lGridID = @lGridID
		)
		begin
			/* We can delete the grid */

			/* Remove the fields associated with the grid */
			delete comp_sales_display_grid_layout with(rowlock)
			where
				lGridID = @lGridID

			/* Remove the grid */
			delete comp_sales_display_grid with(rowlock)
			where
				current of curGrids
		end
		else
		begin
			/* We cannot delete the grid */
			set @lGridsExist = 1
		end

		fetch next from curGrids into @lGridID
	end

	close curGrids
	deallocate curGrids

	commit transaction

set nocount off

	/* Return whether or not all grids were deleted */
	select lGridsExist = @lGridsExist

GO

