
create procedure ComparableGridSetPropYearCompType
	@lYear numeric(4,0),
	@lSubjectPropID int,
	@szCompType char(1),
	@bUpdatePropGridID bit,
	@lPropGridID int,
	@bUpdateMarketValPropGridID bit,
	@lMarketValPropGridID int
as

set nocount on

	update comparable_grid_prop_year_comptype
	set
		lPropGridID = case when @bUpdatePropGridID = 1 then @lPropGridID else lPropGridID end,
		lMarketValPropGridID = case when @bUpdateMarketValPropGridID = 1 then @lMarketValPropGridID else lMarketValPropGridID end
	where
		lYear = @lYear and
		lPropID = @lSubjectPropID and
		szCompType = @szCompType

	if ( @@rowcount = 0 )
	begin
		insert comparable_grid_prop_year_comptype (
			lYear, lPropID, szCompType,
			lPropGridID, lMarketValPropGridID
		)
		values (
			@lYear, @lSubjectPropID, @szCompType,
			@lPropGridID, @lMarketValPropGridID
		)
	end

GO

