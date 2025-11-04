
create   PROCEDURE ApplicationInsertEvent

@input_prop_id	int,
@input_app_type varchar(5),
@input_user_id	int

AS

declare @event_id	int
declare @event_desc  	varchar(2048)
declare @user_name	varchar(30)

exec dbo.GetUniqueID 'event', @event_id output, 1, 0

select @user_name = pacs_user_name
from pacs_user 
where pacs_user_id = @input_user_id

set @event_desc = @input_app_type + ' Application generated for Export'

insert into event
(
event_id,
system_type,
event_type,
event_date,
pacs_user,
event_desc,
pacs_user_id
)
values
(
@event_id,
'A',
'SYSTEM',
GetDate(),
@user_name,
@event_desc,
@input_user_id
)

insert into prop_event_assoc
(
prop_id,
event_id
)
values
(
@input_prop_id,
@event_id
)

GO

