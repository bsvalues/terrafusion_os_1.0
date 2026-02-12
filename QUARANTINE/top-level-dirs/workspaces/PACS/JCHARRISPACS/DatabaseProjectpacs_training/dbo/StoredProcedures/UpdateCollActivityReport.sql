



CREATE procedure UpdateCollActivityReport 

@input_user_id		int,
/* @input_batch_str	varchar(50),        now using UpdateCollActivityReportBatch */
@input_entity_str	varchar(50),
@input_date_range_str	varchar(50),
@input_year_str		varchar(4)

as


delete from coll_activity_report_criteria
where pacs_user_id = @input_user_id


insert into coll_activity_report_criteria
(
pacs_user_id, 
/* batch,               */
entity,                                             
coll_year,   
date_range
)
values
(
@input_user_id,
/* @input_batch_str,    */
@input_entity_str,
@input_year_str,
@input_date_range_str
)

GO

