
create procedure MarketApproachGridRunDelete
	@run_id int
as

set nocount on

	declare curGrids cursor
	for
		select lPropGridID		
		from market_approach_grid_run_detail as magd with(nolock)
		where run_id = @run_id and lPropGridID > 0
	for read only
	
	declare @lPropGridID int
	
	open curGrids
	fetch next from curGrids into @lPropGridID
	
	while ( @@fetch_status = 0 )
	begin
		exec CompSalesRemovePropGrid @lPropGridID
		fetch next from curGrids into @lPropGridID
	end
	
	close curGrids
	deallocate curGrids
		
	update pv
	set
		pv.mktappr_market = 0,
		pv.recalc_flag = case when pv.recalc_flag = 'C' then 'M' else pv.recalc_flag end
	from property_val as pv
	join market_approach_grid_run_detail as magd with(nolock) on
		magd.run_id = @run_id and
		magd.year = pv.prop_val_yr and
		magd.sup_num = pv.sup_num and
		magd.prop_id = pv.prop_id
	join comparable_grid_prop_year_comptype as pyc with(nolock) on
		pyc.lYear = magd.year and
		pyc.lPropID = magd.prop_id and
		pyc.szCompType = 'S' and
		pyc.lMarketValPropGridID is null
		
	delete market_approach_grid_run
	where run_id = @run_id

GO

