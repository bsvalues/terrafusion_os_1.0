
CREATE PROCEDURE DeletePropertyEvent
   @input_event_id int,
   @input_prop_id int = 0,
   @bAllProperties bit = 0
   
AS

/*
 * The following income_* tables are only associated with ONE Event.  So just delete
 * the rows.
 */
 
delete
from income_sm_worksheet
where event_id = @input_event_id

delete
from income_sm_worksheet_property_info
where event_id = @input_event_id

delete
from income_sm_worksheet_values
where event_id = @input_event_id

delete
from income_sm_worksheet_detail
where event_id = @input_event_id

delete
from income_sm_worksheet_improvement_info
where event_id = @input_event_id

delete
from income_sm_worksheet_land_info
where event_id = @input_event_id

delete
from income_sm_improvement_level_detail
where event_id = @input_event_id


if (@bAllProperties <> 0)
begin
		
 	DECLARE @count_properties int
	
-- 	delete this event from prop_event_assoc

	delete from prop_event_assoc
	where	event_id = @input_event_id
	and	prop_id = @input_prop_id
	

	select @count_properties = COUNT(*)
	from prop_event_assoc
	where event_id = @input_event_id	
	
--  	check if this event exists only on this property
-- 	if yes, it is safe to delete all event objects
-- 	on this event
	if (@count_properties = 1)
	begin	

	delete from event_object
	where event_id = @input_event_id

	delete from event
	where event_id = @input_event_id

	end	

end

else
begin
	delete from prop_event_assoc
	where	event_id = @input_event_id
	
	delete from event_object
	where event_id = @input_event_id

	delete from event
	where event_id = @input_event_id
end

GO

