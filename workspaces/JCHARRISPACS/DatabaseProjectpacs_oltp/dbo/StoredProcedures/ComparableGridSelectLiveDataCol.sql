
create procedure ComparableGridSelectLiveDataCol
	@lTempPropGridID int,@lColumn int
as

	select lFieldID, szLeft, szRight, szDetail
	from comparable_grid_live_data with(nolock)
	where
		lTempPropGridID = @lTempPropGridID and lColumn=@lColumn
	order by
		lStaticGridItemID asc

GO

