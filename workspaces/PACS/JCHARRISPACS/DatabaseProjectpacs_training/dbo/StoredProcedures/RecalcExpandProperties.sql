
create procedure RecalcExpandProperties
	@lPacsUserID int,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@bRecalcPropListPopulated bit,
	@lUniquePacsUserID bigint
as

set nocount on

	declare @lParentPropID int

	truncate table #recalc_worktable_income_id_assoc
	truncate table #recalc_worktable_income_prop_assoc

	declare @bRecalcIncome bit
	set @bRecalcIncome = 0
	
	if ( @lPacsUserID <> 0 )
	begin
		if ( @bRecalcPropListPopulated = 0 )
		begin
			truncate table #recalc_prop_list

			insert #recalc_prop_list (
				prop_id, sup_yr, sup_num
			)
			select prop_id, sup_yr, sup_num
			from recalc_prop_list with(nolock)
			where pacs_user_id = @lPacsUserID
			order by 1 asc, 2 asc, 3 asc
		end
		/* else caller has already populated #recalc_prop_list */

		declare @tblUDI table (
			lChild int not null,
			lParent int not null,
			lYear numeric(4,0) not null,
			lSupNum int not null
		)

		/* Get the properties that are children */
		insert @tblUDI (lChild, lParent, lYear, lSupNum )
		select rpl.prop_id, pv.udi_parent_prop_id, rpl.sup_yr, rpl.sup_num
		from #recalc_prop_list as rpl with(nolock)
		join property_val as pv with(nolock) on
			rpl.prop_id = pv.prop_id and
			rpl.sup_yr = pv.prop_val_yr and
			rpl.sup_num = pv.sup_num
		where
			pv.udi_parent_prop_id is not null and
			pv.udi_status is null

		/* Insert their parents into the list... */
		insert #recalc_prop_list (
			prop_id, sup_yr, sup_num
		)
		select distinct tu.lParent, tu.lYear, tu.lSupNum
		from @tblUDI as tu
		where 
			not exists ( /* ... but only if they aren't already in the list */
				select *
				from #recalc_prop_list as rpl with(nolock)
				where
					rpl.prop_id = tu.lParent and
					rpl.sup_yr = tu.lYear and
					rpl.sup_num = tu.lSupNum
			)
		order by 1 asc, 2 asc, 3 asc

		-- Populate income worktables
		insert #recalc_worktable_income_id_assoc (income_yr, sup_num, income_id)
		select distinct rpl.sup_yr, rpl.sup_num, ipa.income_id
		from #recalc_prop_list as rpl
		join income_prop_assoc as ipa with(nolock) on
			rpl.sup_yr = ipa.prop_val_yr and
			rpl.sup_num = ipa.sup_num and
			rpl.prop_id = ipa.prop_id
		union
		select distinct rpl.sup_yr, rpl.sup_num, ilda.income_id
		from #recalc_prop_list as rpl
		join income_land_detail_assoc as ilda with(nolock) on
			rpl.sup_yr = ilda.income_yr and
			rpl.sup_num = ilda.sup_num and
			rpl.prop_id = ilda.prop_id
		join property_val as pv with(nolock) on
			pv.prop_val_yr = ilda.income_yr and
			pv.sup_num = ilda.sup_num and
			pv.prop_id = ilda.prop_id and
			(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
		
		if ( @@rowcount > 0 )
		begin
			set @bRecalcIncome = 1
			
			insert #recalc_worktable_income_prop_assoc (prop_val_yr, sup_num, prop_id)
			select distinct t.income_yr, t.sup_num, ipa.prop_id
			from #recalc_worktable_income_id_assoc as t with(nolock)
			join income_prop_assoc as ipa with(nolock) on
				t.income_yr = ipa.prop_val_yr and
				t.sup_num = ipa.sup_num and
				t.income_id = ipa.income_id
			union
			select distinct t.income_yr, t.sup_num, ilda.prop_id
			from #recalc_worktable_income_id_assoc as t with(nolock)
			join income_land_detail_assoc as ilda with(nolock) on
				t.income_yr = ilda.income_yr and
				t.sup_num = ilda.sup_num and
				t.income_id = ilda.income_id 
			join property_val as pv with(nolock) on
				pv.prop_val_yr = ilda.income_yr and
				pv.sup_num = ilda.sup_num and
				pv.prop_id = ilda.prop_id and
				(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			
			insert #recalc_worktable_income_id_assoc (income_yr, sup_num, income_id)
			select * from
			(
				select distinct t.prop_val_yr income_yr, t.sup_num, ipa.income_id
				from #recalc_worktable_income_prop_assoc as t with(nolock)
				join income_prop_assoc as ipa with(nolock) on
					t.prop_val_yr = ipa.prop_val_yr and
					t.sup_num = ipa.sup_num and
					t.prop_id = ipa.prop_id		 
				union
				select distinct t.prop_val_yr income_yr, t.sup_num, ilda.income_id
				from #recalc_worktable_income_prop_assoc as t with(nolock)
				join income_land_detail_assoc as ilda with(nolock) on
					t.prop_val_yr = ilda.income_yr and
					t.sup_num = ilda.sup_num and
					t.prop_id = ilda.prop_id 
				join property_val as pv with(nolock) on
					pv.prop_val_yr = ilda.income_yr and
					pv.sup_num = ilda.sup_num and
					pv.prop_id = ilda.prop_id and
					(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			)x
			where not exists (
				select * from #recalc_worktable_income_id_assoc ia with(nolock)
				where
					ia.income_yr = x.income_yr and
					ia.sup_num = x.sup_num and
					ia.income_id = x.income_id
			)

			-- Expand property list as necessary
			insert #recalc_prop_list (prop_id, sup_yr, sup_num)
			select t.prop_id, t.prop_val_yr, t.sup_num
			from #recalc_worktable_income_prop_assoc as t with(nolock)
			where not exists (
				select *
				from #recalc_prop_list as rpl with(nolock)
				where
					rpl.sup_yr = t.prop_val_yr and
					rpl.sup_num = t.sup_num and
					rpl.prop_id = t.prop_id
			)
		end		
	end
	else
	begin
		declare @cParent char(1)

		/* An individual property */
		select
			@lParentPropID = case when udi_status is null then udi_parent_prop_id else null end,
			@cParent = udi_parent
		from property_val with(nolock)
		where
			prop_id = @lPropID and
			prop_val_yr = @lYear and
			sup_num = @lSupNum

		if ( @cParent = 'T' )
		begin
			set @lParentPropID = @lPropID
		end

		-- Populate income worktables
		insert #recalc_worktable_income_id_assoc (income_yr, sup_num, income_id)
		select distinct @lYear, @lSupNum, ipa.income_id
		from income_prop_assoc as ipa with(nolock)
		where
			ipa.prop_val_yr = @lYear and
			ipa.sup_num = @lSupNum and
			ipa.prop_id = case when @lParentPropID is not null then @lParentPropID else @lPropID end
		union
		select distinct @lYear, @lSupNum, ilda.income_id
		from income_land_detail_assoc as ilda with(nolock)
		join property_val as pv with(nolock) on
			pv.prop_val_yr = ilda.income_yr and
			pv.sup_num = ilda.sup_num and
			pv.prop_id = ilda.prop_id and
			(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
		where
			ilda.income_yr = @lYear and
			ilda.sup_num = @lSupNum and
			ilda.prop_id = case when @lParentPropID is not null then @lParentPropID else @lPropID end
		
		if ( @@rowcount > 0 )
		begin
			set @bRecalcIncome = 1
			
			insert #recalc_worktable_income_prop_assoc (prop_val_yr, sup_num, prop_id)
			select distinct @lYear, @lSupNum, ipa.prop_id
			from #recalc_worktable_income_id_assoc as t with(nolock)
			join income_prop_assoc as ipa with(nolock) on
				t.income_yr = ipa.prop_val_yr and
				t.sup_num = ipa.sup_num and
				t.income_id = ipa.income_id
			union
			select distinct @lYear, @lSupNum, ilda.prop_id
			from #recalc_worktable_income_id_assoc as t with(nolock)
			join income_land_detail_assoc as ilda with(nolock) on
				t.income_yr = ilda.income_yr and
				t.sup_num = ilda.sup_num and
				t.income_id = ilda.income_id 
			join property_val as pv with(nolock) on
				pv.prop_val_yr = ilda.income_yr and
				pv.sup_num = ilda.sup_num and
				pv.prop_id = ilda.prop_id and
				(pv.prop_inactive_dt is null or pv.udi_parent = 'T')

			insert #recalc_worktable_income_id_assoc (income_yr, sup_num, income_id)
			select * from
			(
				select distinct @lYear income_yr, @lSupNum sup_num, ipa.income_id
				from #recalc_worktable_income_prop_assoc as t with(nolock)
				join income_prop_assoc as ipa with(nolock) on
					t.prop_val_yr = ipa.prop_val_yr and
					t.sup_num = ipa.sup_num and
					t.prop_id = ipa.prop_id		 
				union
				select distinct @lYear income_yr, @lSupNum sup_num, ilda.income_id
				from #recalc_worktable_income_prop_assoc as t with(nolock)
				join income_land_detail_assoc as ilda with(nolock) on
					t.prop_val_yr = ilda.income_yr and
					t.sup_num = ilda.sup_num and
					t.prop_id = ilda.prop_id 
				join property_val as pv with(nolock) on
					pv.prop_val_yr = ilda.income_yr and
					pv.sup_num = ilda.sup_num and
					pv.prop_id = ilda.prop_id and
					(pv.prop_inactive_dt is null or pv.udi_parent = 'T')
			)x
			where not exists (
				select * from #recalc_worktable_income_id_assoc ia with(nolock)
				where
					ia.income_yr = x.income_yr and
					ia.sup_num = x.sup_num and
					ia.income_id = x.income_id
			)
		end
		
		/* At this point, if the property was a parent, @lParentPropID contains said PID */
		/* Or, if the property was a child, it contains it's parent PID */
		/* Or, if it is entirely non UDI, it remains null */

		if ( @lParentPropID is not null or @bRecalcIncome = 1 )
		begin
			truncate table #recalc_prop_list

			insert #recalc_prop_list (
				prop_id, sup_yr, sup_num
			) values (
				case when @lParentPropID is not null then @lParentPropID else @lPropID end, @lYear, @lSupNum
			)

			if ( @lParentPropID is not null )
			begin
				/* Add the children to the list */
				insert #recalc_prop_list (
					prop_id, sup_yr, sup_num
				)
				select prop_id, prop_val_yr, sup_num
				from property_val with(nolock)
				where
					prop_val_yr = @lYear and
					sup_num = @lSupNum and
					udi_parent_prop_id = @lParentPropID
				order by 1 asc, 2 asc, 3 asc
			end

			if ( @bRecalcIncome = 1 )
			begin
				-- Expand property list as necessary
				insert #recalc_prop_list (prop_id, sup_yr, sup_num)
				select t.prop_id, t.prop_val_yr, t.sup_num
				from #recalc_worktable_income_prop_assoc as t with(nolock)
				where not exists (
					select *
					from #recalc_prop_list as rpl with(nolock)
					where
						rpl.sup_yr = t.prop_val_yr and
						rpl.sup_num = t.sup_num and
						rpl.prop_id = t.prop_id
				)
			end
		end
	end

	if ( @bRecalcIncome = 1 )
	begin
		delete recalc_income_list_current_division
		where pacs_user_id = @lUniquePacsUserID
		
		insert recalc_income_list_current_division (income_yr, sup_num, income_id, pacs_user_id)
		select distinct t.income_yr, t.sup_num, t.income_id, @lUniquePacsUserID
		from #recalc_worktable_income_id_assoc as t with(nolock)
	end
	
set nocount off

	select
		ShouldUseList = convert(bit, case when @lParentPropID is not null or @bRecalcIncome = 1 then 1 else 0 end),
		RecalcIncome = @bRecalcIncome

GO

