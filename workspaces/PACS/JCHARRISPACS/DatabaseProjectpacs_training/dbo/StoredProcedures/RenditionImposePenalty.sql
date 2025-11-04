

CREATE PROCEDURE RenditionImposePenalty

@input_year 					numeric(4,0),
@input_option_create_fee_if_no_amount_exists 	bit,
@input_option_update_fee_if_amount_exists 	bit,
@input_option_update_fee_if_amount_is_different bit

AS

set nocount on

exec SetMachineLogChanges 0

if (@input_option_create_fee_if_no_amount_exists = 1)
begin
	update pp_rendition_tracking set
		pp_rendition_tracking.penalty_amount 		  = cast((isnull(pv.appraised_val, 0) * (isnull(ps.pp_waive_penalty_percent, 10.00) / 100)) as numeric(14,2)),
		pp_rendition_tracking.penalty_amount_dt 	  = GetDate(),
		pp_rendition_tracking.waiver_request_mandatory_dt = convert(varchar(10), case when datepart(dw, dateadd(day, 30, GetDate())) = 7
													then dateadd(day, 32, GetDate())
												when datepart(dw, dateadd(day, 30, GetDate())) = 1
													then dateadd(day, 31, GetDate())
												else dateadd(day, 30, GetDate()) end, 101)
	from property_val pv, pacs_system ps, pp_waiver_status pws
	where pp_rendition_tracking.prop_id = pv.prop_id
		and pp_rendition_tracking.prop_val_yr = pv.prop_val_yr
		and pv.prop_inactive_dt is null
		and pp_rendition_tracking.penalty_waiver_status = pws.code
		and pws.code_type < 2
		and pp_rendition_tracking.prop_val_yr = @input_year
		and pp_rendition_tracking.prop_id in
		(
			select prop_id from #tmp
		)
		and isnull(pp_rendition_tracking.penalty_amount_override, 0) = 0
		and isnull(pp_rendition_tracking.penalty_amount, 0) = 0
end

if (@input_option_update_fee_if_amount_exists = 1)
begin
	update pp_rendition_tracking set
		pp_rendition_tracking.penalty_amount 		  = cast((isnull(pv.appraised_val, 0) * (isnull(ps.pp_waive_penalty_percent, 10.00) / 100)) as numeric(14,2)),
		pp_rendition_tracking.penalty_amount_dt 	  = GetDate(),
		pp_rendition_tracking.waiver_request_mandatory_dt = convert(varchar(10), case when datepart(dw, dateadd(day, 30, GetDate())) = 7
													then dateadd(day, 32, GetDate())
												when datepart(dw, dateadd(day, 30, GetDate())) = 1
													then dateadd(day, 31, GetDate())
												else dateadd(day, 30, GetDate()) end, 101)
	from property_val pv, pacs_system ps, pp_waiver_status pws
	where pp_rendition_tracking.prop_id = pv.prop_id
		and pp_rendition_tracking.prop_val_yr = pv.prop_val_yr
		and pv.prop_inactive_dt is null
		and pp_rendition_tracking.penalty_waiver_status = pws.code
		and pws.code_type < 2
		and pp_rendition_tracking.prop_val_yr = @input_year
		and pp_rendition_tracking.prop_id in
		(
			select prop_id from #tmp
		)
		and isnull(pp_rendition_tracking.penalty_amount_override, 0) = 0
		and isnull(pp_rendition_tracking.penalty_amount, 0) > 0
end


if (@input_option_update_fee_if_amount_is_different = 1)
begin
	update pp_rendition_tracking set
		pp_rendition_tracking.penalty_amount 		  = cast((isnull(pv.appraised_val, 0) * (isnull(ps.pp_waive_penalty_percent, 10.00) / 100)) as numeric(14,2)),
		pp_rendition_tracking.penalty_amount_dt 	  = GetDate(),
		pp_rendition_tracking.waiver_request_mandatory_dt = convert(varchar(10), case when datepart(dw, dateadd(day, 30, GetDate())) = 7
													then dateadd(day, 32, GetDate())
												when datepart(dw, dateadd(day, 30, GetDate())) = 1
													then dateadd(day, 31, GetDate())
												else dateadd(day, 30, GetDate()) end, 101)
	from property_val pv, pacs_system ps, pp_waiver_status pws
	where pp_rendition_tracking.prop_id = pv.prop_id
		and pp_rendition_tracking.prop_val_yr = pv.prop_val_yr
		and pv.prop_inactive_dt is null
		and pp_rendition_tracking.penalty_waiver_status = pws.code
		and pws.code_type < 2
		and pp_rendition_tracking.prop_val_yr = @input_year
		and pp_rendition_tracking.prop_id in
		(
			select prop_id from #tmp
		)
		and isnull(pp_rendition_tracking.penalty_amount_override, 0) = 0
		and isnull(pp_rendition_tracking.penalty_amount, 0) <> cast((isnull(pv.appraised_val, 0) * (isnull(ps.pp_waive_penalty_percent, 10.00) / 100)) as numeric(14,2))
end

exec SetMachineLogChanges 1

GO

