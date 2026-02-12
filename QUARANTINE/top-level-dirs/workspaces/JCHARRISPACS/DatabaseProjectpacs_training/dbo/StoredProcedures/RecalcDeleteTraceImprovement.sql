
create procedure RecalcDeleteTraceImprovement
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
		delete recalc_trace_imprv
		from recalc_trace_imprv
		join recalc_prop_list_current_division as rpl with(nolock) on
			rpl.prop_id = recalc_trace_imprv.prop_id and
			rpl.sup_yr = recalc_trace_imprv.prop_val_yr and
			rpl.sup_num = recalc_trace_imprv.sup_num and
			rpl.pacs_user_id = @lPacsUserID
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			delete recalc_trace_imprv with(tablock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum
		end
		else
		begin
			delete recalc_trace_imprv
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum
		end
	end

GO

