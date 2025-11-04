
create procedure IncomeValuationDataRemove

	@year numeric(4,0),
	@sup_num int,
	@prop_id int,
	@split_merge_id int

as

declare @event_id int

set nocount on

select @event_id = pea.event_id
from prop_event_assoc as pea
with (nolock)
join event as e
with (nolock)
on pea.event_id = e.event_id
where pea.prop_id = @prop_id
and e.event_type = 'IVDS'
and e.ref_year = @year
and e.ref_num = @sup_num
and e.ref_id1 = @prop_id
and e.ref_id3 = @split_merge_id

if @event_id > 0
begin
	delete
	from income_sm_improvement_level_detail
	where event_id = @event_id

	delete
	from income_sm_worksheet_values
	where event_id = @event_id

	delete
	from income_sm_worksheet_property_info
	where event_id = @event_id

	delete
	from income_sm_worksheet_land_info
	where event_id = @event_id

	delete
	from income_sm_worksheet_improvement_info
	where event_id = @event_id

	delete
	from income_sm_worksheet_detail
	where event_id = @event_id

	delete
	from income_sm_worksheet
	where event_id = @event_id

	delete
	from prop_event_assoc
	where event_id = @event_id

	delete
	from event_object
	where event_id = @event_id

	delete
	from event
	where event_id = @event_id
end

set nocount off


-- ** 'End csp.IncomeValuationDataRemove.sql'

GO

