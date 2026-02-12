
create procedure ComparableGridUpdateCnvStaticRunDetail
	@lCnvStaticRunID int,
	@bMakeStaticDefault bit,
	@szFile varchar(255)
as

set nocount on

	create table #tmp_detail
	(
		lCnvStaticRunID int not null,
		lSourcePropGridID int not null,
		lNewPropGridID int not null, -- 0 indicates failure
		lErrorCount int not null, -- 0 = success ; > 0 = # of times CompSalesCalcPropertyAdj failed OR negative # indicating specific error

		primary key clustered (lCnvStaticRunID, lSourcePropGridID)
		with fillfactor = 100
	)

	declare @szSQL varchar(512)

	set @szSQL = 'bulk insert #tmp_detail from ''' + @szFile + ''' with (tablock)'
	exec(@szSQL)

	/* Update the real table with the results: new grid ID and error code/count */
	update comparable_grid_cnv_static_run_detail
	set
		comparable_grid_cnv_static_run_detail.lNewPropGridID = t.lNewPropGridID,
		comparable_grid_cnv_static_run_detail.lErrorCount = t.lErrorCount
	from comparable_grid_cnv_static_run_detail with(tablockx)
	join #tmp_detail as t on
		comparable_grid_cnv_static_run_detail.lCnvStaticRunID = t.lCnvStaticRunID and
		comparable_grid_cnv_static_run_detail.lSourcePropGridID = t.lSourcePropGridID

	if ( @bMakeStaticDefault = 1 )
	begin
		create table #tmp_prop
		(
			lYear numeric(4,0) not null,
			lSubjectPropID int not null,
			szCompType char(1) not null,
			lNewPropGridID int not null,

			primary key clustered (lYear, lSubjectPropID, szCompType)
			with fillfactor = 100
		)
		/* Need a list of distinct year, PID, & comparison type with grid ID to set as default */
		insert #tmp_prop
		select distinct
			cg.lYear, cg.lSubjectPropID, isnull(cg.comparison_type, 'S'), max(t.lNewPropGridID)
		from #tmp_detail as t
		join comp_sales_property_grids as cg with(nolock) on
			cg.lPropGridID = t.lSourcePropGridID
		where /* Successful */
			t.lNewPropGridID > 0 and
			t.lErrorCount = 0
		group by cg.lYear, cg.lSubjectPropID, isnull(cg.comparison_type, 'S')

		/* Now set the grids to the default for the properties */
		update comparable_grid_prop_year_comptype with(tablockx)
		set
			comparable_grid_prop_year_comptype.lPropGridID = t.lNewPropGridID
		from comparable_grid_prop_year_comptype with(tablockx)
		join #tmp_prop as t with(nolock) on
			comparable_grid_prop_year_comptype.lYear = t.lYear and
			comparable_grid_prop_year_comptype.lPropID = t.lSubjectPropID and
			comparable_grid_prop_year_comptype.szCompType = t.szCompType

		insert comparable_grid_prop_year_comptype with(tablockx) (
			lYear, lPropID, szCompType, lPropGridID
		)
		select
			t.lYear, t.lSubjectPropID, t.szCompType, t.lNewPropGridID
		from #tmp_prop as t with(nolock)
		where not exists (
			select c.lYear
			from comparable_grid_prop_year_comptype as c with(tablockx)
			where
				c.lYear = t.lYear and
				c.lPropID = t.lSubjectPropID and
				c.szCompType = t.szCompType
		)
	end

GO

