









create procedure CloseBatch

@input_batch_id		int

as

update batch
set close_dt = GetDate()
where batch_id = @input_batch_id
and   close_dt is null

GO

