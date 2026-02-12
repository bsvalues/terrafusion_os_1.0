
CREATE    procedure BatchReopenDay
	@balance_date datetime,
	@pacs_user_id int,
	@reopen_date datetime
as

delete from batch_close_day
where balance_dt = @balance_date

-- log message in history table 
declare @message varchar(100)
declare @pacs_user_name varchar(50)
declare @str_reopen_date varchar(20)
select @pacs_user_name = pacs_user_name
from pacs_user with (nolock)
where pacs_user_id = @pacs_user_id

set @str_reopen_date = convert(varchar, @reopen_date, 102)
set @message = 'Reopened by user: ' + @pacs_user_name + ' on ' + @str_reopen_date
exec BatchInsertHistory  'RD', @message, @pacs_user_id, @str_reopen_date

GO

