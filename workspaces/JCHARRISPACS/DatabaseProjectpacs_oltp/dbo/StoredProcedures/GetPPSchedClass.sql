


CREATE PROCEDURE GetPPSchedClass
 @input_pp_sched_id 	int,
 @input_sup_yr  	numeric(4),
 @input_class_cd	char(5),
 @unit_price		numeric(14,2) output
AS

declare @pp_class_amt numeric(14,2)
declare @pp_class_pct numeric(5,2)

--Try and find a match on the class code
IF EXISTS (select pp_schedule_class.pp_class_cd from pp_schedule_class
						where 	pp_schedule_class.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_class.year		= @input_sup_yr
						and	pp_schedule_class.pp_class_cd 	= @input_class_cd)
begin
	select @pp_class_amt = pp_schedule_class.pp_class_amt, @pp_class_pct = pp_schedule_class.pp_class_pct
	from pp_schedule_class
	where 	pp_schedule_class.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_class.year		= @input_sup_yr
	and	pp_schedule_class.pp_class_cd 	= @input_class_cd

	if (@pp_class_amt is not null)
	begin
		select @unit_price = @unit_price + @pp_class_amt
	end
	else if (@pp_class_pct is not null)
	begin
		select @unit_price = @unit_price * @pp_class_pct
	end

end


--If there isn't a match on the class code, look for the wildcard (*) value
ELSE IF EXISTS (select pp_schedule_class.pp_class_cd from pp_schedule_class
						where 	pp_schedule_class.pp_sched_id	= @input_pp_sched_id
						and	pp_schedule_class.year		= @input_sup_yr
						and	pp_schedule_class.pp_class_cd 	= '*')
begin
	select @pp_class_amt = pp_schedule_class.pp_class_amt, @pp_class_pct = pp_schedule_class.pp_class_pct
	from pp_schedule_class
	where 	pp_schedule_class.pp_sched_id	= @input_pp_sched_id
	and	pp_schedule_class.year		= @input_sup_yr
	and	pp_schedule_class.pp_class_cd 	= '*'

	if (@pp_class_amt is not null)
	begin
		select @unit_price = @unit_price + @pp_class_amt
	end
	else if (@pp_class_pct is not null)
	begin
		select @unit_price = @unit_price * @pp_class_pct
	end

end

GO

