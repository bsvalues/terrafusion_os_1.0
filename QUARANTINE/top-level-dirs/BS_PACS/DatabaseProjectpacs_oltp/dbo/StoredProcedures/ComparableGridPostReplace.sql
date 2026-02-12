
create procedure ComparableGridPostReplace
	@lYear numeric(4,0),
	@lSubjectPropID int,
	@szComparisonType char(1),
	@lPropGridIDExclude int
as

set nocount on
	
	-- Delete all grids for the year, subject, & comp type (equity or sales) except the grid used as the replacement

	declare @lPropGridID int

	declare curGrids insensitive cursor
	for
		select lPropGridID
		from comp_sales_property_grids with(nolock)
		where
			lYear = @lYear and
			lSubjectPropID = @lSubjectPropID and
			comparison_type = @szComparisonType and
			lPropGridID <> @lPropGridIDExclude
	for read only

	open curGrids
	fetch next from curGrids into @lPropGridID

	while ( @@fetch_status = 0 )
	begin
		exec dbo.CompSalesRemovePropGrid @lPropGridID
		fetch next from curGrids into @lPropGridID
	end

	close curGrids
	deallocate curGrids

GO

