
CREATE  procedure InsertEvent

@PropID		int,
@EventType	char(20),
@EventDesc	varchar(255),
@UserID		int,
@UserSystemType varchar(5) = null,
@RefEventType varchar(20) = null,
@RefYear numeric(4,0) = null,
@RefNum int = null,
@RefID1 int = null,
@RefID2 int = null,
@RefID3 int = null,
@RefID4 int = null,
@RefID5 int = null,
@RefID6 int = null

as

set nocount on

declare @EventID	int
declare @UserName	varchar(50)

exec dbo.GetUniqueID 'event', @EventID output, 1, 0

select @UserName = pacs_user_name
from   pacs_user with(nolock)
where  pacs_user_id = @UserID

declare @system_type 	varchar(5)

select @system_type = isnull(system_type, @UserSystemType)
from event_type with(nolock)
where event_type_cd = @EventType

insert into event
(
event_id,
system_type,
event_type,
event_date,
pacs_user,
event_desc,
ref_evt_type,
ref_year,
ref_num,
ref_id1,
ref_id2,
ref_id3,
ref_id4,
ref_id5,
ref_id6,
pacs_user_id
)
values
(
@EventID,
@System_Type,
@EventType,
GetDate(),
@UserName,
@EventDesc,
@RefEventType,
@RefYear,
@RefNum,
@RefID1,
@RefID2,
@RefID3,
@RefID4,
@RefID5,
@RefID6,
@UserID
)

insert into prop_event_assoc
(
prop_id,
event_id
)
values
(
@PropID,
@EventID
)

GO

