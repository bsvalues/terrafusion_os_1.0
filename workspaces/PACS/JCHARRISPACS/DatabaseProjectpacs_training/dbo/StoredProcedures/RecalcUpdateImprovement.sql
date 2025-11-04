
create procedure RecalcUpdateImprovement
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv
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
		update imprv
		set
			imprv.imp_new_val = ti.imp_new_val,
			imprv.imp_new_val_override = ti.imp_new_val_override,

			imprv.imprv_adj_factor = ti.imprv_adj_factor,
			imprv.imprv_adj_amt = ti.imprv_adj_amt,
			imprv.imprv_mass_adj_factor = ti.imprv_mass_adj_factor,

			imprv.calc_val = ti.calc_val,
			imprv.adjusted_val = ti.adjusted_val,
			imprv.imprv_val = ti.imprv_val,
			imprv.income_val = ti.income_val,
			
			imprv.imp_new_yr = ti.imp_new_yr,
			
			imprv.primary_use_cd = ti.primary_use_cd,
			imprv.secondary_use_cd = ti.secondary_use_cd,
			
			imprv.permanent_crop_land_acres = ti.permanent_crop_land_acres,
			imprv.mktappr_val = ti.mktappr_val
		from imprv
		join #recalc_bcp_imprv as ti with(nolock) on
			imprv.prop_id = ti.prop_id and
			imprv.prop_val_yr = ti.prop_val_yr and
			imprv.sup_num = ti.sup_num and
			imprv.sale_id = ti.sale_id and
			imprv.imprv_id = ti.imprv_id and
			ti.lRecalcBCPRowID >= @lMinBCPRowID and ti.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end

GO

