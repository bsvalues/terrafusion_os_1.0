










CREATE PROCEDURE GetPPSchedOrder
 @input_pp_sched_id 	int,
 @input_sup_yr  	numeric(4),
 @module1		char(5) output,
 @module2		char(5) output,
 @module3		char(5) output,
 @module4		char(5) output,
 @module5		char(5) output,
 @module6		char(5) output
AS

-- Get the Module 1 Code
IF EXISTS (select pp_schedule_order.module_1 from pp_schedule_order
						where pp_schedule_order.pp_sched_id 	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr)
begin
	select @module1 = pp_schedule_order.module_1 from pp_schedule_order
						where pp_schedule_order.pp_sched_id	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr
end

-- Get the Module 2 Code
IF EXISTS (select pp_schedule_order.module_2 from pp_schedule_order
						where pp_schedule_order.pp_sched_id 	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr)
begin
	select @module2 = pp_schedule_order.module_2 from pp_schedule_order
						where pp_schedule_order.pp_sched_id	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr
end

-- Get the Module 3 Code
IF EXISTS (select pp_schedule_order.module_3 from pp_schedule_order
						where pp_schedule_order.pp_sched_id 	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr)
begin
	select @module3 = pp_schedule_order.module_3 from pp_schedule_order
						where pp_schedule_order.pp_sched_id	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr
end

-- Get the Module 4 Code
IF EXISTS (select pp_schedule_order.module_4 from pp_schedule_order
						where pp_schedule_order.pp_sched_id 	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr)
begin
	select @module4 = pp_schedule_order.module_4 from pp_schedule_order
						where pp_schedule_order.pp_sched_id	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr
end

-- Get the Module 5 Code
IF EXISTS (select pp_schedule_order.module_5 from pp_schedule_order
						where pp_schedule_order.pp_sched_id 	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr)
begin
	select @module5 = pp_schedule_order.module_5 from pp_schedule_order
						where pp_schedule_order.pp_sched_id	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr
end

-- Get the Module 6 Code
IF EXISTS (select pp_schedule_order.module_6 from pp_schedule_order
						where pp_schedule_order.pp_sched_id 	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr)
begin
	select @module6 = pp_schedule_order.module_6 from pp_schedule_order
						where pp_schedule_order.pp_sched_id	= @input_pp_sched_id
						and   pp_schedule_order.year		= @input_sup_yr
end

GO

