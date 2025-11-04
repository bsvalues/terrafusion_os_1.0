
create procedure CalculateTaxableListBuildMain
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int,
	
	@lDivide int
as

set nocount on

	declare @lRet int
	set @lRet = 0

	truncate table #taxable_property_list
	truncate table #taxable_property_list_by_division
	
	-- Full calculation
	if ( @lPropID = 0 and @lPacsUserID = 0 )
	begin
		if ( @lDivide > 1 )
		begin
			declare @tbl table (
				lID int identity(1,1) not null,
				lPropID int not null,
				primary key clustered (lID)
				with fillfactor = 100
			)

			declare @lRowCount int

			insert @tbl (lPropID)
			select prop_id
			from property_val with(nolock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum
			order by prop_id asc

			set @lRowCount = @@rowcount
			
			declare @lPerRange int
			set @lPerRange = @lRowCount / @lDivide
			
			declare @lMin int
			declare @lMax int
			declare @lIndex int
			set @lIndex = 0
			while ( @lIndex < @lDivide )
			begin
				set @lMin = @lIndex * @lPerRange
				if ( @lIndex = (@lDivide - 1) )
					set @lMax = @lRowCount -- Last range
				else
					set @lMax = @lMin + @lPerRange
				
				insert #taxable_property_list_by_division (division_num, year, sup_num, prop_id)
				select @lIndex, @lYear, @lSupNum, lPropID
				from @tbl
				where
					lID > @lMin and
					lID <= @lMax
				
				set @lIndex = @lIndex + 1
			end
		end
	end
	-- Calculation by list of property IDs
	else if ( @lPacsUserID <> 0 )
	begin
		insert #taxable_property_list (year, sup_num, prop_id)
		select sup_yr, sup_num, prop_id
		from recalc_prop_list with(nolock)
		where pacs_user_id = @lPacsUserID
	
		-- Ensure parents are in the list
		insert #taxable_property_list (year, sup_num, prop_id)
		select distinct pv.prop_val_yr, pv.sup_num, pv.udi_parent_prop_id
		from property_val as pv with(nolock)
		join #taxable_property_list as tpl with(nolock) on
			tpl.year = pv.prop_val_yr and
			tpl.sup_num = pv.sup_num and
			tpl.prop_id = pv.prop_id
		where
			pv.udi_parent_prop_id > 0 and
			not exists (
				select *
				from #taxable_property_list as t with(nolock)
				where
					t.year = pv.prop_val_yr and
					t.sup_num = pv.sup_num and
					t.prop_id = pv.udi_parent_prop_id
			)
		
		-- Ensure children are in the list
		insert #taxable_property_list (year, sup_num, prop_id)
		select pv.prop_val_yr, pv.sup_num, pv.prop_id
		from #taxable_property_list as tpl with(nolock)
		join property_val as pv with(nolock) on
			tpl.year = pv.prop_val_yr and
			tpl.sup_num = pv.sup_num and
			tpl.prop_id = pv.udi_parent_prop_id
		where
			not exists (
				select *
				from #taxable_property_list as t with(nolock)
				where
					t.year = pv.prop_val_yr and
					t.sup_num = pv.sup_num and
					t.prop_id = pv.prop_id
			)
	end
	else -- Calculation of a single property ID
	begin
		declare @lParentPropID int
		select @lParentPropID = case
			when udi_parent_prop_id > 0
			then udi_parent_prop_id
			when udi_parent in ('T','D')
			then prop_id
			else null
		end
		from property_val with(nolock)
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			prop_id = @lPropID
		
		if ( @lParentPropID > 0 )
		begin
			insert #taxable_property_list (year, sup_num, prop_id)
			select prop_val_yr, sup_num, prop_id
			from property_val with(nolock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				udi_parent_prop_id = @lParentPropID
				
			insert #taxable_property_list (year, sup_num, prop_id)
			values (@lYear, @lSupNum, @lParentPropID)
			
			set @lRet = @lParentPropID
		end
	end

set nocount off

	select lRet = @lRet

GO

