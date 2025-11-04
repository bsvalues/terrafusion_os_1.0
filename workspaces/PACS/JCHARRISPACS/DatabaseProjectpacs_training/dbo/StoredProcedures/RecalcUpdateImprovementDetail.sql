
create procedure RecalcUpdateImprovementDetail
	@szBCPFile varchar(512),
	@lRowsPerUpdate int,
	@tsRowVersion rowversion
with recompile
as

set nocount on

	declare @szSQL varchar(512)
	declare @lBCPRowCount int

	set @szSQL = '
		bulk insert #recalc_bcp_imprv_detail
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
		update imprv_detail
		set
			imprv_detail.dep_pct = tid.dep_pct,
			imprv_detail.size_adj_pct = tid.size_adj_pct,
			imprv_detail.physical_pct_source = null,
			imprv_detail.unit_price = tid.unit_price,
			imprv_detail.new_value = tid.new_value,
			imprv_detail.new_value_flag = tid.new_value_flag,
			imprv_detail.add_factor = tid.add_factor,

			imprv_detail.imprv_det_adj_factor = tid.imprv_det_adj_factor,
			imprv_detail.imprv_det_adj_amt = tid.imprv_det_adj_amt,
			imprv_detail.imprv_det_calc_val = tid.imprv_det_calc_val,
			imprv_detail.imprv_det_adj_val = tid.imprv_det_adj_val,
			imprv_detail.imprv_det_val = tid.imprv_det_val,

			imprv_detail.imprv_det_class_cd = case tid.bUpdate_Class
				when 1 then tid.imprv_det_class_cd
				else imprv_detail.imprv_det_class_cd
			end
			,
			imprv_detail.imprv_det_meth_cd = case tid.bUpdate_Method
				when 1 then tid.imprv_det_meth_cd
				else imprv_detail.imprv_det_meth_cd
			end
			,
			imprv_detail.imprv_det_sub_class_cd = case tid.bUpdate_SubClass
				when 1 then tid.imprv_det_sub_class_cd
				else imprv_detail.imprv_det_sub_class_cd
			end,
			imprv_detail.imprv_det_area = tid.imprv_det_area,
			imprv_detail.yr_new = tid.yr_new,

			imprv_detail.economic_pct = tid.economic_pct,
			imprv_detail.physical_pct = tid.physical_pct,
			imprv_detail.functional_pct = tid.functional_pct,
			imprv_detail.percent_complete = tid.percent_complete,
			imprv_detail.depreciated_replacement_cost_new = tid.depreciated_replacement_cost_new,
			imprv_detail.depreciation_yr = tid.depreciation_yr,
			imprv_detail.yr_built = tid.yr_built,
			imprv_detail.actual_age = tid.actual_age,
			imprv_detail.imprv_det_cost_unit_price = tid.imprv_det_cost_unit_price,
			imprv_detail.imprv_det_ms_val = tid.imprv_det_ms_val,
			imprv_detail.imprv_det_ms_unit_price = tid.imprv_det_ms_unit_price

		from imprv_detail
		join #recalc_bcp_imprv_detail as tid with(nolock) on
			imprv_detail.prop_id = tid.prop_id and
			imprv_detail.prop_val_yr = tid.prop_val_yr and
			imprv_detail.sup_num = tid.sup_num and
			imprv_detail.sale_id = tid.sale_id and
			imprv_detail.imprv_id = tid.imprv_id and
			imprv_detail.imprv_det_id = tid.imprv_det_id and
			tid.lRecalcBCPRowID >= @lMinBCPRowID and tid.lRecalcBCPRowID <= @lMaxBCPRowID
		where tsRowVersion <= @tsRowVersion

		/* Explicitly *not* minus @@rowcount */
		set @lBCPRowCount = @lBCPRowCount - @lRowsPerUpdate

		set @lMinBCPRowID = @lMaxBCPRowID + 1
		set @lMaxBCPRowID = @lMaxBCPRowID + @lRowsPerUpdate
	end
	
set nocount off

GO

