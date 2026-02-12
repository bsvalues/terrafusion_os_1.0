
create procedure RecalcRowInsertTraceImprovement
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lImprovID int,
	@lImprovDetailID int,
	
	@szText varchar(512)
as

set nocount on

	insert recalc_trace_imprv with(rowlock) (
		prop_id, prop_val_yr, sup_num, imprv_id, imprv_det_id, szText
	) values (
		@lPropID, @lYear, @lSupNum, @lImprovID, @lImprovDetailID, @szText
	)

GO

