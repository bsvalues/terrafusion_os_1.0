








CREATE procedure UpdateBatchReport

@input_user_id		int,
@input_batch_str	varchar(50),
@input_date_range_str	varchar(50),
@input_user_str		varchar(50)

as

delete from batch_report_criteria
where pacs_user_id = @input_user_id

insert into batch_report_criteria
(
pacs_user_id,
batch,
batch_user,
date_range
)
values
(
@input_user_id,
@input_batch_str,
@input_user_str,
@input_date_range_str
)

GO

