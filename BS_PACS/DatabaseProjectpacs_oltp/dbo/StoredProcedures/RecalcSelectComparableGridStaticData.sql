
create procedure RecalcSelectComparableGridStaticData
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

	if ( @lPacsUserID != 0 )
	begin
			select
				cg.lPropGridID,
				cg.lColumn,
				cg.lFieldID,
				VAL = convert(bigint, szLeft)
			from #recalc_prop_list as rpl with(nolock)
			join comparable_grid_prop_year_comptype as pyc with(nolock) on
				pyc.lYear = rpl.sup_yr and
				pyc.lPropID = rpl.prop_id and
				pyc.szCompType = 'S'
			join comparable_grid_static_data as cg with(nolock) on
				cg.lPropGridID = pyc.lMarketValPropGridID and
				cg.lFieldID < 0
			order by
				cg.lPropGridID,
				cg.lColumn,
				cg.lFieldID
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			select
				cg.lPropGridID,
				cg.lColumn,
				cg.lFieldID,
				VAL = convert(bigint, szLeft)
			from comparable_grid_prop_year_comptype as pyc with(nolock)
			join comparable_grid_static_data as cg with(nolock) on
				cg.lPropGridID = pyc.lMarketValPropGridID and
				cg.lFieldID < 0
			where
				pyc.lYear = @lYear and
				pyc.szCompType = 'S'
			order by
				cg.lPropGridID,
				cg.lColumn,
				cg.lFieldID
		end
		else
		begin
			select
				cg.lPropGridID,
				cg.lColumn,
				cg.lFieldID,
				VAL = convert(bigint, szLeft)
			from comparable_grid_prop_year_comptype as pyc with(nolock)
			join comparable_grid_static_data as cg with(nolock) on
				cg.lPropGridID = pyc.lMarketValPropGridID and
				cg.lFieldID < 0
			where
				pyc.lYear = @lYear and
				pyc.lPropID = @lPropID and
				pyc.szCompType = 'S'
			order by
				cg.lPropGridID,
				cg.lColumn,
				cg.lFieldID
		end
	end

	return(@@rowcount)

GO

