
create procedure RecalcUpdateRMSAddition
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_detail_rms_addition
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
		update rms
		set
			rms.DeprPct = trms.DeprPct,
			rms.EffectiveYearBuilt = trms.EffectiveYearBuilt,
			rms.TypicalLife = trms.TypicalLife,
			rms.BaseDate = trms.BaseDate,
			rms.AdditionValueRCN = trms.AdditionValueRCN,
			rms.AdditionValueRCNLD = trms.AdditionValueRCNLD
		from imprv_detail_rms_addition as rms
		join #recalc_bcp_imprv_detail_rms_addition as trms with(nolock) on
			rms.prop_val_yr = trms.prop_val_yr and
			rms.sup_num = trms.sup_num and
			rms.sale_id = trms.sale_id and
			rms.prop_id = trms.prop_id and
			rms.imprv_id = trms.imprv_id and
			rms.imprv_det_id = trms.imprv_det_id and
			rms.pacs_addition_id = trms.pacs_addition_id and
			trms.lRecalcBCPRowID >= @lMinBCPRowID and trms.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

