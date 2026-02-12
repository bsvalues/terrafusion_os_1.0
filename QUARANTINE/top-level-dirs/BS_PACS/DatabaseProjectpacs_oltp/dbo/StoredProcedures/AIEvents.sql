

create procedure AIEvents

@case_id	int,
@prop_val_yr	numeric(4)

as

select szEventCode as code,
       dtEvent     as dt,
       szEventComment as comment

from _arb_event
where lcaseid = @case_id
and   lyear   = @prop_val_yr
and   szARBType = 'AI'
order by dt

GO

