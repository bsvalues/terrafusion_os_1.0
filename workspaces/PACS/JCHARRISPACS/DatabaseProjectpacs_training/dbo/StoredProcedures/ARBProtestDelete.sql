
create procedure ARBProtestDelete

@case_id	int,
@prop_val_yr 	numeric(4)

as

delete from _arb_protest_reason 
where case_id = @case_id
and   prop_val_yr = @prop_val_yr


delete from _arb_protest_panel_member
where case_id = @case_id 
and   prop_val_yr = @prop_val_yr


delete from _arb_letter_history
where lCaseID = @case_id
and   lPropValYr = @prop_val_yr


delete from _arb_event_object
from _arb_event
where _arb_event.lEventID = _arb_event_object.lEventID
and _arb_event.lCaseID = @case_id 
and   _arb_event.lYear   = @prop_val_yr

delete from _arb_event
where _arb_event.lCaseID = @case_id
and   _arb_event.lYear   = @prop_val_yr

delete from _arb_protest_protest_by_assoc
where _arb_protest_protest_by_assoc.case_id = @case_id
and   _arb_protest_protest_by_assoc.prop_val_yr   = @prop_val_yr

delete from _arb_protest
where case_id = @case_id 
and   prop_val_yr = @prop_val_yr

GO

