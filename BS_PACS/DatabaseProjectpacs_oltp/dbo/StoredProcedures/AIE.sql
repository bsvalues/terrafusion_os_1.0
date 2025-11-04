

CREATE procedure AIE

@case_id	int,
	@ID1 int,
	@ID2 int = NULL


as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end


select szEventCode as code,
       convert(varchar(10), dtEvent, 101)     as dt,
       szEventComment as comment

from _arb_event
where lcaseid = @case_id
and   lyear   = @prop_val_yr
and   szARBType = 'AI'
order by dt

GO

