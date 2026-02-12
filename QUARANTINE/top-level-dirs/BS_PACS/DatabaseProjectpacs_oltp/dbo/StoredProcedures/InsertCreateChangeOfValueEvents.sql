create procedure [dbo].[InsertCreateChangeOfValueEvents]
	@user_id int,
	@dataset_id int
as
set nocount on

declare @next_event_id	int
declare @next_event_object_id	int
declare @username varchar(30)
declare @count int

select @count = count(*) from change_of_value_report with(nolock) where dataset_id = @dataset_id

exec dbo.GetUniqueID 'event', @next_event_id output, @count, 0
select @username = pacs_user_name from pacs_user with(nolock) where pacs_user_id = @user_id

create table #tempEventIDs
(
	id_offset int IDENTITY,
	prop_id int,
	year numeric(4,0)
)

insert into #tempEventIDs
select prop_id, assessment_yr from change_of_value_report with(nolock) where dataset_id = @dataset_id 

insert into event
(
	event_id,
	system_type,
	event_type,
	event_date,
	pacs_user,
	event_desc,
	pacs_user_id,
	ref_id1,
	ref_id2,
	ref_year
)
select
@next_event_id - 1 + id_offset,
'A',
'COV-PRINT',
GetDate(),
@username,
'Change of value form printed',
@user_id,
prop_id,
@dataset_id,
year
from #tempEventIDs with(nolock)

insert into prop_event_assoc
(prop_id, event_id)
select
prop_id,
@next_event_id - 1 + id_offset
from #tempEventIDs with(nolock)

drop table #tempEventIDs

GO

