









create procedure CloseBatchByDate

@input_begin_date       varchar(100),
@input_end_date		varchar(100)
as

update batch
set close_dt = GetDate()
where balance_dt >= convert(datetime, @input_begin_date)
and   balance_dt <= convert(datetime, @input_end_date)
and   close_dt is null

GO

