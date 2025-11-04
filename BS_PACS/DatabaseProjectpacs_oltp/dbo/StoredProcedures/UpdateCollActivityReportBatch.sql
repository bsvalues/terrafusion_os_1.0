

CREATE procedure UpdateCollActivityReportBatch

@input_del_flag		char,
@input_user_id		int,
@input_batch_str	varchar(255)

as

if @input_del_flag = 'T'
begin
    delete from coll_activity_report_batch
    where pacs_user_id = @input_user_id
end

insert into coll_activity_report_batch
(
pacs_user_id,
batch
)
values
(
@input_user_id,
@input_batch_str
)

GO

