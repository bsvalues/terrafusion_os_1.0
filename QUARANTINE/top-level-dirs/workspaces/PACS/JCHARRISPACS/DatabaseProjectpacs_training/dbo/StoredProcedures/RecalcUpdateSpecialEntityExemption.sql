
create procedure RecalcUpdateSpecialEntityExemption
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_property_special_entity_exemption
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL)
	set @lBCPRowCount = @@rowcount

	/* Update all rows at once if requested */
	if ( @lRowsPerUpdate = 0 )
	begin
		set @lRowsPerUpdate = @lBCPRowCount
	end

	declare @lMinBCPRowID int
	declare @lMaxBCPRowID int

	set @lMinBCPRowID = 1
	set @lMaxBCPRowID = @lRowsPerUpdate

	while ( @lBCPRowCount > 0 )
	begin
		update property_special_entity_exemption
		set
			property_special_entity_exemption.exmpt_amt = tsp.exmpt_amt,
			property_special_entity_exemption.sp_segment_amt = tsp.sp_segment_amt
		from property_special_entity_exemption
		join #recalc_bcp_property_special_entity_exemption as tsp with(nolock) on
			property_special_entity_exemption.prop_id = tsp.prop_id and
			property_special_entity_exemption.exmpt_tax_yr = tsp.exmpt_tax_yr and
			property_special_entity_exemption.owner_tax_yr = tsp.owner_tax_yr and
			property_special_entity_exemption.sup_num = tsp.sup_num and
			property_special_entity_exemption.owner_id = tsp.owner_id and
			property_special_entity_exemption.entity_id = tsp.entity_id and
			property_special_entity_exemption.exmpt_type_cd = tsp.exmpt_type_cd and
			tsp.lRecalcBCPRowID >= @lMinBCPRowID and tsp.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

