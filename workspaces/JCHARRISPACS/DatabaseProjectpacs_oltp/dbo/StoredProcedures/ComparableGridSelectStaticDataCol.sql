
create procedure ComparableGridSelectStaticDataCol
	@lPropGridID int,@lColumn int
as

	select lFieldID, szLeft, szRight, szDetail
	from comparable_grid_static_data with(nolock)
	where
		lPropGridID = @lPropGridID and lColumn=@lColumn
	order by
		lStaticGridItemID asc

GO

