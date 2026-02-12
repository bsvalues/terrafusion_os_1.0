
create procedure ComparableGridSelectStaticData
	@lPropGridID int
as

	select lColumn, lFieldID, szLeft, szRight, szDetail
	from comparable_grid_static_data with(nolock)
	where
		lPropGridID = @lPropGridID
	order by
		lColumn asc, lStaticGridItemID asc

GO

