
create procedure InsertChangeLogTransactionSelectFields
	@sid int,
	@fieldList varchar(Max)
as

set nocount on

declare @list_item varchar(100)
declare @tbl_name varchar(50)  
declare @column_name varchar(50)  
declare @Pos int  

if object_id('tempdb..#temp_transaction_fileds') is not null
begin 
   drop table #temp_transaction_fileds
end

create table #temp_transaction_fileds
(
   tbl_name varchar(50),
   column_name varchar(50)
)

while len(@fieldList) > 0   
begin   
 	set @Pos = CHARINDEX(',', @fieldList)   
  
-- * To extract the list item string   
if @Pos = 0   
	begin   
		set @list_item = @fieldList   
		set @fieldList   = ''
	end   
else   
	begin   
		set @list_item = SUBSTRING(@fieldList, 1, @Pos - 1)   
		set @fieldList = SUBSTRING(@fieldList, @Pos+1, LEN(@fieldList))
	end   
	
	set @tbl_name = SUBSTRING(@list_item, 1, (CHARINDEX('-', @list_item)-1))   
	set @column_name = SUBSTRING(@list_item, (CHARINDEX('-', @list_item)+1), LEN(@list_item))  

	insert into #temp_transaction_fileds(tbl_name, column_name)   
	values (@tbl_name, @column_name)  
	 
end

insert into chg_log_trans_selection_fields 
select @sid, pt.iTableID ,pc.iColumnID 
from chg_log_columns as clc with(nolock) 
join #temp_transaction_fileds as tmp with (nolock)
on tmp.tbl_name = clc.chg_log_tables
and tmp.column_name = clc.chg_log_columns
join pacs_tables as pt with (nolock) 
on pt.szTableName = clc.chg_log_tables 
join pacs_columns as pc with (nolock) 
on pc.szColumnName = clc.chg_log_columns 

if object_id('tempdb..#temp_transaction_fileds') is not null
begin 
   drop table #temp_transaction_fileds
end

GO

