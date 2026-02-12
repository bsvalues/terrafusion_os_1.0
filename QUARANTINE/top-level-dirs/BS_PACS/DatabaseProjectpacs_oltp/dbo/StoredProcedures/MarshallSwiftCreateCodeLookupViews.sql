
create procedure MarshallSwiftCreateCodeLookupViews

as

set nocount on

	declare
		@szSQLViewNameType varchar(max),
		@szSQLViewNameStyle varchar(max),
		@szSQLViewNameQuality varchar(max),
		@szSQLViewNameCondition varchar(max),
		@szSQLViewNameComponent varchar(max),
		@szSQLViewNameSystem varchar(max),
		@szSQLViewNameZoneItems varchar(max),
		@szSQLViewNameAddition varchar(max),
		@szSQLViewNameZoneCategories varchar(max)

	set @szSQLViewNameType = 'rms_residence_type_vw'
	set @szSQLViewNameStyle  = 'rms_style_vw'
	set @szSQLViewNameQuality  = 'rms_quality_vw'
	set @szSQLViewNameCondition  = 'rms_condition_vw'
	set @szSQLViewNameComponent  = 'rms_component_vw'
	set @szSQLViewNameSystem = 'rms_system_vw'
	set @szSQLViewNameZoneItems = 'rms_zone_items_vw'
	set @szSQLViewNameAddition = 'rms_addition_vw'
	set @szSQLViewNameZoneCategories = 'rms_zone_categories_vw'

	declare
		@szSQLViewDefinitionType varchar(max),
		@szSQLViewDefinitionStyle varchar(max),
		@szSQLViewDefinitionQuality varchar(max),
		@szSQLViewDefinitionCondition varchar(max),
		@szSQLViewDefinitionComponent varchar(max),
		@szSQLViewDefinitionSystem varchar(max),
		@szSQLViewDefinitionZoneItems varchar(max),
		@szSQLViewDefinitionAddition varchar(max),
		@szSQLViewDefinitionZoneCategories varchar(max)
		
	set @szSQLViewDefinitionType = 'create view ' + @szSQLViewNameType + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionStyle = 'create view ' + @szSQLViewNameStyle + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionQuality = 'create view ' + @szSQLViewNameQuality + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionCondition = 'create view ' + @szSQLViewNameCondition + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionComponent = 'create view ' + @szSQLViewNameComponent + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionSystem = 'create view ' + @szSQLViewNameSystem + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionZoneItems = 'create view ' + @szSQLViewNameZoneItems + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionAddition = 'create view ' + @szSQLViewNameAddition + ' as ' + char(13) + char(10)
	set @szSQLViewDefinitionZoneCategories = 'create view ' + @szSQLViewNameZoneCategories + ' as ' + char(13) + char(10)

	declare
		@year numeric(4,0),
		@residential_loaded bit
	
	declare
		@dbYear numeric(4,0),
		@dbName varchar(24)

	declare curYears cursor
	for
		select year, residential_loaded
		from ms_config
		where residential_enabled = 1
	for read only

	open curYears
	fetch next from curYears into @year, @residential_loaded
	
	declare @lCount int
	set @lCount = 0
	
	while ( @@fetch_status = 0 )
	begin
	
		if ( @residential_loaded = 1 )
		begin
			set @dbYear = @year
		end
		else
		begin
			select @dbYear = max(year)
			from ms_config
			where year < @year and residential_loaded = 1
		end
		
		set @dbName = 'ms_res_cost_' + convert(varchar(4), @dbYear)
		
		if db_id(@dbName) is not null
		begin
			if ( @lCount > 0 )
			begin
				set @szSQLViewDefinitionType = @szSQLViewDefinitionType + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionStyle = @szSQLViewDefinitionStyle + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionQuality = @szSQLViewDefinitionQuality + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionCondition = @szSQLViewDefinitionCondition + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionComponent = @szSQLViewDefinitionComponent + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionSystem = @szSQLViewDefinitionSystem + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionZoneItems = @szSQLViewDefinitionZoneItems + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionAddition = @szSQLViewDefinitionAddition + 'union all' + char(13) + char(10)
				set @szSQLViewDefinitionZoneCategories = @szSQLViewDefinitionZoneCategories + 'union all' + char(13) + char(10)
			end
			
			set @szSQLViewDefinitionType = @szSQLViewDefinitionType + 'select Year = ' + convert(varchar(4), @year) + ', TypeID, TypeName from ' + @dbName + '.dbo.Type with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionStyle = @szSQLViewDefinitionStyle + 'select Year = ' + convert(varchar(4), @year) + ', StyleID, StyleName from ' + @dbName + '.dbo.Style with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionQuality = @szSQLViewDefinitionQuality + 'select Year = ' + convert(varchar(4), @year) + ', QualityID, QualityName from ' + @dbName + '.dbo.Quality with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionCondition = @szSQLViewDefinitionCondition + 'select Year = ' + convert(varchar(4), @year) + ', ConditionID, Description from ' + @dbName + '.dbo.Condition with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionComponent = @szSQLViewDefinitionComponent + 'select Year = ' + convert(varchar(4), @year) + ', ComponentID, SystemID, ComponentName from ' + @dbName + '.dbo.Component with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionSystem = @szSQLViewDefinitionSystem + 'select Year = ' + convert(varchar(4), @year) + ', SystemID, SystemName from ' + @dbName + '.dbo.System with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionZoneItems = @szSQLViewDefinitionZoneItems + 'select Year = ' + convert(varchar(4), @year) + ', ZoneItemID, ZoneCategoryCode, ZoneItemName from ' + @dbName + '.dbo.ZoneItems with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionAddition = @szSQLViewDefinitionAddition + 'select Year = ' + convert(varchar(4), @year) + ', AdditionTypeID, Description from ' + @dbName + '.dbo.AdditionType with(nolock)' + char(13) + char(10)
			set @szSQLViewDefinitionZoneCategories = @szSQLViewDefinitionZoneCategories + 'select Year = ' + convert(varchar(4), @year) + ', ZoneCategoryCode, ZoneCategoryName from ' + @dbName + '.dbo.ZoneCategories with(nolock)' + char(13) + char(10)
			set @lCount = @lCount + 1		
		end
		
		fetch next from curYears into @year, @residential_loaded
	end
	
	close curYears
	deallocate curYears
	
	-- Drop the views if they already exist

	if exists (select * from sys.views where name = @szSQLViewNameType)
		exec('drop view ' + @szSQLViewNameType)
	if exists (select * from sys.views where name = @szSQLViewNameStyle)
		exec('drop view ' + @szSQLViewNameStyle)
	if exists (select * from sys.views where name = @szSQLViewNameQuality)
		exec('drop view ' + @szSQLViewNameQuality)
	if exists (select * from sys.views where name = @szSQLViewNameCondition)
		exec('drop view ' + @szSQLViewNameCondition)
	if exists (select * from sys.views where name = @szSQLViewNameComponent)
		exec('drop view ' + @szSQLViewNameComponent)
	if exists (select * from sys.views where name = @szSQLViewNameSystem)
		exec('drop view ' + @szSQLViewNameSystem)
	if exists (select * from sys.views where name = @szSQLViewNameZoneItems)
		exec('drop view ' + @szSQLViewNameZoneItems)
	if exists (select * from sys.views where name = @szSQLViewNameAddition)
		exec('drop view ' + @szSQLViewNameAddition)
	if exists (select * from sys.views where name = @szSQLViewNameZoneCategories)
		exec('drop view ' + @szSQLViewNameZoneCategories)
	
	if ( @lCount = 0 )
	begin
		set @szSQLViewDefinitionType = @szSQLViewDefinitionType + 'select convert(numeric(4,0), null) Year, convert(smallint, null) TypeID, convert(nvarchar(50), null) TypeName'
		set @szSQLViewDefinitionStyle = @szSQLViewDefinitionStyle + 'select convert(numeric(4,0), null) Year, convert(smallint, null) StyleID, convert(nvarchar(50), null) StyleName'
		set @szSQLViewDefinitionQuality = @szSQLViewDefinitionQuality + 'select convert(numeric(4,0), null) Year, convert(smallint, null) QualityID, convert(nvarchar(50), null) QualityName'
		set @szSQLViewDefinitionCondition = @szSQLViewDefinitionCondition + 'select convert(numeric(4,0), null) Year, convert(smallint, null) ConditionID, convert(nvarchar(50), null) Description'
		set @szSQLViewDefinitionComponent = @szSQLViewDefinitionComponent + 'select convert(numeric(4,0), null) Year, convert(int, null) ComponentID, convert(int, null) SystemID, convert(nvarchar(50), null) ComponentName'
		set @szSQLViewDefinitionSystem = @szSQLViewDefinitionSystem + 'select convert(numeric(4,0), null) Year, convert(int, null) SystemID, convert(nvarchar(50), null) SystemName'
		set @szSQLViewDefinitionZoneItems = @szSQLViewDefinitionZoneItems + 'select convert(numeric(4,0), null) Year, convert(int, null) ZoneItemID, convert(nvarchar(5), null) ZoneCategoryCode, convert(nvarchar(50), null) ZoneItemName'
		set @szSQLViewDefinitionAddition = @szSQLViewDefinitionAddition + 'select convert(numeric(4,0), null) Year, convert(int, null) AdditionTypeID, convert(nvarchar(15), null) Description'
		set @szSQLViewDefinitionZoneCategories = @szSQLViewDefinitionZoneCategories + 'select convert(numeric(4,0), null) Year, convert(varchar(5), null) ZoneCategoryCode, convert(nvarchar(50), null) ZoneCategoryName'
	end

	-- Create them new
	exec(@szSQLViewDefinitionType)
	exec(@szSQLViewDefinitionStyle)
	exec(@szSQLViewDefinitionQuality)
	exec(@szSQLViewDefinitionCondition)
	exec(@szSQLViewDefinitionComponent)
	exec(@szSQLViewDefinitionSystem)
	exec(@szSQLViewDefinitionZoneItems)
	exec(@szSQLViewDefinitionAddition)
	exec(@szSQLViewDefinitionZoneCategories)

GO

