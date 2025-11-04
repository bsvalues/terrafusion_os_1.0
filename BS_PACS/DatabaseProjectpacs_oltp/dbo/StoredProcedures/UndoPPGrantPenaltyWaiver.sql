

create procedure dbo.UndoPPGrantPenaltyWaiver
	@input_year numeric(4,0),
	@input_status_dt datetime
as

update
	pp_rendition_tracking
set
	penalty_waiver_status = 'NR',
	penalty_waiver_status_dt = null,
	penalty_comment = ''
where
	prop_val_yr = @input_year
and	isnull(penalty_waiver_status, 'NR') = 'SG'
and	penalty_waiver_status_dt = @input_status_dt

GO

