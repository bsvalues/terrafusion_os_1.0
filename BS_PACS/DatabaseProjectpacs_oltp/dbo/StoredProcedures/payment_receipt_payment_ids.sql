

CREATE procedure [dbo].[payment_receipt_payment_ids]
  @paymentIDs varchar(8000), @numberOfCopies int = 1
as

if object_id('tempdb..#id_table') is not null
	drop table #id_table
create table #id_table (payment_id int, copy_num int)

declare @selectQuery varchar(8000)

declare @index int
set @index = 1

while @index <= @numberOfCopies
begin
	set @selectQuery = 'insert #id_table select payment_id, ' + convert(varchar,@index) + ' from dbo.payment ' +
						'where payment_id in (' + @paymentIDs + ')'
	exec(@selectQuery)
	set @index = @index + 1
end

select * from #id_table
drop table #id_table

GO

