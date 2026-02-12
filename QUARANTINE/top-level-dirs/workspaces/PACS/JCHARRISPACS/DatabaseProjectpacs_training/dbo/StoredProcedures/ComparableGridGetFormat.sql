
create procedure ComparableGridGetFormat
	@lPacsUserID int,
	@szGridType varchar(5)
as

set nocount on

	declare @lGridID int

	select top 1 @lGridID = lGridID
	from comp_sales_display_grid with(nolock)
	where
		lPacsUserID = @lPacsUserID and
		szGridType = @szGridType
	order by cDefault desc /* Such that T comes before F */

	if ( @lGridID is null )
	begin
		select top 1 @lGridID = lGridID
		from comp_sales_display_grid with(nolock)
		where
			lPacsUserID = 0 and
			szGridType = @szGridType
		order by cDefault desc /* Such that T comes before F */
	end

set nocount off

	select lGridID = @lGridID

GO

