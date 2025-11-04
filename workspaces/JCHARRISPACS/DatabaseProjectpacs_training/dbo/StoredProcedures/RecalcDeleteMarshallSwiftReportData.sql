
create procedure RecalcDeleteMarshallSwiftReportData
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
		delete imprv_detail_ms_report_data
		from imprv_detail_ms_report_data
		join recalc_prop_list_current_division as rpl with(nolock) on
			rpl.prop_id = imprv_detail_ms_report_data.prop_id and
			rpl.sup_yr = imprv_detail_ms_report_data.prop_val_yr and
			rpl.sup_num = imprv_detail_ms_report_data.sup_num and
			rpl.pacs_user_id = @lPacsUserID
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			delete imprv_detail_ms_report_data with(tablock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum
		end
		else
		begin
			delete imprv_detail_ms_report_data
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum
		end
	end

GO

