
create procedure RecalcDeleteStateAssessedUtilitySegments
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
		declare curPID insensitive cursor
		for
			select pv.prop_val_yr, pv.sup_num, pv.prop_id
			from #recalc_prop_list as rpl with(nolock)
			join property_val as pv with(nolock) on
				pv.prop_val_yr = rpl.sup_yr and
				pv.sup_num = rpl.sup_num and
				pv.prop_id = rpl.prop_id
			join property_sub_type as pst with(nolock) on
				pst.property_sub_cd = pv.sub_type and
				pst.state_assessed_utility = 1
		for read only
	end
	else if ( @lPropID = 0 )
	begin
		declare curPID insensitive cursor
		for
			select pv.prop_val_yr, pv.sup_num, pv.prop_id
			from property_val as pv with(nolock)
			join property_sub_type as pst with(nolock) on
				pst.property_sub_cd = pv.sub_type and
				pst.state_assessed_utility = 1
			where
				pv.prop_val_yr = @lYear and
				pv.sup_num = @lSupNum
		for read only
	end
	else
	begin
		declare curPID insensitive cursor
		for
			select pv.prop_val_yr, pv.sup_num, pv.prop_id
			from property_val as pv with(nolock)
			join property_sub_type as pst with(nolock) on
				pst.property_sub_cd = pv.sub_type and
				pst.state_assessed_utility = 1
			where
				pv.prop_val_yr = @lYear and
				pv.sup_num = @lSupNum and
				pv.prop_id = @lPropID
		for read only
	end

	declare
		@year numeric(4,0),
		@sup_num int,
		@prop_id int
		
	open curPID
	fetch next from curPID into @year, @sup_num, @prop_id
	
	while ( @@fetch_status = 0 )
	begin
		exec dbo.LayerDeleteLand @year, @sup_num, 0, @prop_id
		exec dbo.LayerDeleteImprovement @year, @sup_num, 0, @prop_id
		exec dbo.LayerDeletePersonal @year, @sup_num, @prop_id
		
		fetch next from curPID into @year, @sup_num, @prop_id
	end
	
	close curPID
	deallocate curPID

GO

