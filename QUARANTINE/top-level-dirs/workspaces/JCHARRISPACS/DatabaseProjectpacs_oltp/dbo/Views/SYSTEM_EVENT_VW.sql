
CREATE VIEW SYSTEM_EVENT_VW
AS
select 
system_events.event_cd,
system_event_type.event_type_desc,
system_events.event_desc,
system_events.event_date,
system_events.event_user_id,
system_events.event_id,
pacs_user.pacs_user_name,
pacs_user.full_name
from system_events, system_event_type, pacs_user
where system_events.event_cd = system_event_type.event_type_cd
and event_user_id = pacs_user.pacs_user_id

GO

