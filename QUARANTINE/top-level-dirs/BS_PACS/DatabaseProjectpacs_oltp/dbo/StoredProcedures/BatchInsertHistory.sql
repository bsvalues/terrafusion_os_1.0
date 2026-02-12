


CREATE PROCEDURE BatchInsertHistory

@str_trans_type		char(5),
@str_message		varchar(100),
@pacs_user_id		int,
@str_balance_dt	varchar(100)
 
AS

insert into batch_distribution_history
(
trans_type,
message,
pacs_user_id,
trans_dt,
balance_dt
)
values
(
@str_trans_type,
@str_message,
@pacs_user_id,
GetDate(),
@str_balance_dt
)

GO

