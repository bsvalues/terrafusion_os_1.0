
create procedure CalculateTaxableBuildLists
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@szEntityList varchar(8000),
	@szPropertyList varchar(8000)
as

set nocount on

	truncate table #totals_list
	truncate table #totals_entity_list
	truncate table #totals_prop_list

	declare @szSQL varchar(8000)

	set @szSQL =
		'insert #totals_list (entity_id, prop_id) ' +
		'select distinct entity_id, prop_id ' + 
		'from entity_prop_assoc with(nolock) ' +
		'where tax_yr = ' + convert(varchar(4), @lYear) +
		'and sup_num = ' + convert(varchar(12), @lSupNum)

	if ( @lPropID <> 0 )
	begin
		set @szSQL = @szSQL + ' and prop_id = ' + convert(varchar(12), @lPropID)
	end
	else if ( @szPropertyList <> '' )
	begin
		set @szSQL = @szSQL + ' and prop_id in (' + @szPropertyList + ')'
	end

	if ( @szEntityList <> '' )
	begin
		set @szSQL = @szSQL + ' and entity_id in (' + @szEntityList + ')'
	end

	set @szSQL = @szSQL + ' order by entity_id asc, prop_id asc '

	exec(@szSQL)

	insert #totals_entity_list (entity_id)
	select distinct entity_id
	from #totals_list
	order by entity_id asc

	insert #totals_prop_list (prop_id)
	select distinct prop_id
	from #totals_list
	order by prop_id asc

GO

