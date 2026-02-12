









CREATE PROCEDURE DeletePersonalPropertySchedule
@input_pp_sched_id      int,
@input_pp_year		int

AS

/* delete from pp_schedule_adj */
delete from pp_schedule_adj
where pp_sched_id = @input_pp_sched_id
and   year	  = @input_pp_year

/* delete from pp_schedule_area */
delete from pp_schedule_area
where pp_sched_id = @input_pp_sched_id
and year	= @input_pp_year

/* delete from pp_schedule_class */
delete from pp_schedule_class
where pp_sched_id = @input_pp_sched_id
and   year	  = @input_pp_year

/* delete from pp_schedule_deprec */
delete from pp_schedule_deprec
where pp_sched_id = @input_pp_sched_id
and   year	  = @input_pp_year

/* delete from pp_schedule_quality_density */
delete from pp_schedule_quality_density
where pp_sched_id = @input_pp_sched_id
and   year	  = @input_pp_year

/* delete from pp_schedule_unit_count */
delete from pp_schedule_unit_count
where pp_sched_id = @input_pp_sched_id
and year	= @input_pp_year

/* delete from pp_schedule_order */
delete from pp_schedule_order
where pp_sched_id = @input_pp_sched_id
and   year	  = @input_pp_year

/* delete from pp_schedule */
delete from pp_schedule
where pp_sched_id = @input_pp_sched_id
and   year	  = @input_pp_year

GO

