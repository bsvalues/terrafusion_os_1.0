

CREATE procedure [dbo].[monitor_RemoveBankruptcyLitigationProps]  ----{call monitor_RemoveBankruptcyLitigationProps (30185, 3)}
/***** 

This monitor was written for Benton to copy data from the bankruptcy litigation into 
a property event for future reference.  This monitor also removes the property from the 
specified litigation

******/


/*
step 1:  update next_unique_id where id_name = 'event'
step 2:  insert event from query
step 3:  insert event_prop_assoc
step 4:  remove litigation_statement_assoc
step 5:  remove litigation_prop_assoc
step 6:  remove property_litigation_comment_event
*/

@prop_id			int,
@litigation_id		int

AS 

SET NOCOUNT ON


DECLARE		@next_event_id		int


SELECT @next_event_id = id
from next_unique_id 
where id_name = 'event'

update next_unique_id 
set id = @next_event_id + 1
where id_name = 'event'


---case number = litigation_prop_assoc.file_number
---bankruptcy status = litigation_prop_assoc.bankruptcy_status
---date filed = litigation_prop_assoc.date_filed
---litigation comment = property_litigation_comment_event.comments

insert into event (event_id, system_type, event_type, event_date, pacs_user, event_desc)
select @next_event_id as event_id, 'C' as system_type, 'Bankruptcy' as event_type, getdate() as event_date, 'Monitor' as pacs_user, 
	(cps.pursuit_status_description + '    ' + 'Case Number: ' + 
			case when isnull(lpa.file_number, '') = '' then 'None Assigned' else lpa.file_number end + '    ' + 'Date Filed: ' +
			case when isnull(lpa.date_filed, '1/1/1900') = '1/1/1900' then 'Unknown' else cast(lpa.date_filed as varchar(12)) end + '    ' + 'Bankruptcy Status: ' +
			case when isnull(lpa.bankruptcy_status, '') = '' then 'Unknown' else lpa.bankruptcy_status end + '    ' + 'Litigation Comment: ' +
			plc.comments) as event_desc
from litigation_prop_assoc lpa with(nolock)
join litigation l with(nolock)
	on l.litigation_id = lpa.litigation_id
join collection_pursuit_status cps with(nolock)
	on cps.pursuit_status_code = l.pursuit_status_code
left join property_litigation_comment_event plc with(nolock)
	on plc.litigation_id = lpa.litigation_id
	and plc.prop_id = lpa.prop_id
where lpa.prop_id = @prop_id
and lpa.litigation_id = @litigation_id


insert into prop_event_assoc
values (@prop_id, @next_event_id, NULL)

delete		---(1 row(s) affected)
--select *		---1
from litigation_statement_assoc
where prop_id = @prop_id
and litigation_id = @litigation_id

delete		---(1 row(s) affected)
--select *		---1
from litigation_prop_assoc
where prop_id = @prop_id
and litigation_id = @litigation_id

delete		---(1 row(s) affected)
--select *		---1
from property_litigation_comment_event
where prop_id = @prop_id
and litigation_id = @litigation_id

select 'Process Completed' as result

GO

