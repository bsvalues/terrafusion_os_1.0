




CREATE  procedure IAUpdateSchedule

@iPos		int,
@amt_paid	numeric(14,2),
@ia_id		int,
@payment_id	int

as

declare @i    		int
declare @ia_schedule_id	int
declare @ia_amt_due	numeric(14,2)
declare @ia_amt_pd	numeric(14,2)
declare @ia_status	varchar(5)
declare @temp_amt_due	numeric(14,2)
declare @ia_history_pd	numeric(14,2)

set @i = 0

DECLARE ia_schedule CURSOR FAST_FORWARD
FOR select ia_schedule_id, 
       ia_amt_due,
       IsNull(ia_amt_pd, 0)
From installment_agreement_schedule
where ia_id = @ia_id
order by ia_dt_due asc

open ia_schedule
fetch next from ia_schedule into @ia_schedule_id, @ia_amt_due, @ia_amt_pd

while (@@FETCH_STATUS = 0)
begin

	set @ia_history_pd = 0

	if (@i >= @iPos)
	begin

		if (((@ia_amt_due - @ia_amt_pd) > 0) and
	             (@amt_paid > 0))
		begin
			set @temp_amt_due = @ia_amt_due - @ia_amt_pd
	
			if (@amt_paid > @temp_amt_due)
			begin
				set @ia_amt_pd = @ia_amt_due
				set @amt_paid  = @amt_paid - @temp_amt_due

				set @ia_history_pd = @temp_amt_due
			end
			else
			begin
				set @ia_amt_pd = @ia_amt_pd + @amt_paid
				
				set @ia_history_pd = @amt_paid
				set @amt_paid  = 0
			end
	
			if (@ia_amt_pd = @ia_amt_due)
			begin
				set @ia_status = 'P'
			end
			else
			begin
				set @ia_status = 'PP'
			end
	
			update installment_agreement_schedule
			set ia_amt_pd = @ia_amt_pd,
			    ia_dt_pd  = GetDate(),
			    ia_status = @ia_status
			where ia_schedule_id = @ia_schedule_id
			and   ia_id          = @ia_id

			insert into installment_agreement_payment_history
			(
			ia_id,
			ia_schedule_id,
			payment_id,
			payment_amt
			)
			values
			(
			@ia_id,
			@ia_schedule_id,
			@payment_id,
			@ia_history_pd
			)
		end
	end

	set @i = @i + 1

	fetch next from ia_schedule into @ia_schedule_id, @ia_amt_due, @ia_amt_pd
end

close ia_schedule
deallocate ia_schedule

GO

