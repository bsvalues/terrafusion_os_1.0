









CREATE  PROCEDURE GetPPSchedAdjustments
 @input_pp_sched_id 	int,
 @input_sup_yr  	numeric(4),
 @unit_price		numeric(14,2) output
AS

declare @pp_adj_usage		char(5)
declare @pp_adj_pct		numeric(5,2)
declare @pp_sched_adj_pc	numeric(5,2)
declare @pp_adj_amt		numeric(14,0)
declare @pp_sched_adj_amt	numeric(14,0)


DECLARE ADJUSTMENTS SCROLL CURSOR
FOR select pp_adj_usage, pp_adj_pct, pp_sched_adj_pc, pp_adj_amt, pp_sched_adj_amt
from pp_sched_adj_vw
where pp_sched_id	= @input_pp_sched_id
and   year		= @input_sup_yr
order by pp_adj_amt DESC, pp_sched_adj_amt DESC

OPEN ADJUSTMENTS
FETCH NEXT FROM ADJUSTMENTS into @pp_adj_usage, @pp_adj_pct, @pp_sched_adj_pc, @pp_adj_amt, @pp_sched_adj_amt

while (@@FETCH_STATUS = 0)
begin
	if (@pp_adj_usage = 'A')
	begin
		select @unit_price = @unit_price + @pp_adj_amt
	end
	else if (@pp_adj_usage = 'P')
	begin
		select @unit_price = @unit_price * (@pp_adj_pct/100)
	end
	else if (@pp_adj_usage = 'U')
	begin
		if (@pp_sched_adj_pc is not null)
		begin
			select @unit_price = @unit_price * (@pp_sched_adj_pc/100)
		end
		else if (@pp_sched_adj_amt is not null)
		begin
			select @unit_price = @unit_price + @pp_sched_adj_amt
		end
	end

	FETCH NEXT FROM ADJUSTMENTS into @pp_adj_usage, @pp_adj_pct, @pp_sched_adj_pc, @pp_adj_amt, @pp_sched_adj_amt
end

CLOSE ADJUSTMENTS
DEALLOCATE ADJUSTMENTS

GO

