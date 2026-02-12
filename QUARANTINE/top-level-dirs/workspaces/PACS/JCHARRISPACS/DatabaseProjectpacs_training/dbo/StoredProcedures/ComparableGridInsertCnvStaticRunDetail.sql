
create procedure ComparableGridInsertCnvStaticRunDetail
	@lCnvStaticRunID int,
	@szQuery varchar(2048),
	@bReturnGridData bit
as

set nocount on

	create table #tmp_grid_id
	(
		lPropGridID int not null
	)

	declare @szSQL varchar(4096)

	set @szSQL = 'insert #tmp_grid_id (lPropGridID) ' + @szQuery
	exec(@szSQL)

	insert comparable_grid_cnv_static_run_detail (
		lCnvStaticRunID, lSourcePropGridID, lNewPropGridID, lErrorCount

	)
	select distinct @lCnvStaticRunID, lPropGridID, 0, 0
	from #tmp_grid_id
	order by lPropGridID

set nocount off
	
	if ( @bReturnGridData = 1 )
	begin
		select
			cgsd.lSourcePropGridID,
			cg.lSubjectPropID,
			cg.lYear,
			case
				when cg.comparison_type = 'S' then 0
				else 1
			end,
			upper(rtrim(pp.state_cd)),
			bLandGrid = convert(bit, case when cdg.szGridType = 'LS' then 1 else 0 end)
		from comparable_grid_cnv_static_run_detail as cgsd with(nolock)
		join comp_sales_property_grids as cg with(nolock) on
			cgsd.lSourcePropGridID = cg.lPropGridID
		join comp_sales_display_grid as cdg with(nolock) on
			cg.lGridID = cdg.lGridID
		left outer join property_profile as pp with(nolock) on
			pp.prop_val_yr = cg.lYear and
			pp.prop_id = cg.lSubjectPropID
		where
			cgsd.lCnvStaticRunID = @lCnvStaticRunID
		order by cgsd.lSourcePropGridID asc

		return( @@rowcount )
	end

	return(0)

GO

