
-------------------------------------------------------------------------------
-- Procedure: sp_TableCompareViewGen
--
-- This procedure generates two views usefull for finding differences in a 
-- table that exists in two different databases. The databases do not have to
-- have the same table definitions as the views that are generated will only
-- compare columns that exist in both table definitions. The tables must have
-- a primary key because this procedure joins the two tables automatically
-- on the primary key. 
--
-- Views produced:
--
-- 1) [table_name]_cmp_vw - A view that has the primary key columns and all
--												of the other columns from both tables. The left
--												database columns are preceded with "l_" and the 
--												right columns are proceded by "r_". This view 
--												returns records if there is any difference in
--												the included columns. 
-- 2) [table_name]_report_cmp_vw - This view uses the other view to produce a 
--												report on what columns are different. This view is
--												very usefull in that it will perform the task of
--												determining what columns are different from the 
--												records produced by [table_name]_cmp_vw.
-------------------------------------------------------------------------------
-- Example usage:
--
-- exec sp_TableCompareViewGen 'property_val','pacs_oltp','pacs_oltp_certified',2,'\\PACSFILE\OLTP\SQL\'
--
-- Views produced:
--
-- 1) property_val_cmp_vw
-- 2) property_val_report_cmp_vw
--
-- SQL file - The views are created by the procedure, but you may want to 
--						modify them for specific purpose the sql script is located in 
--						the directory '\\PACSFILE\OLTP\SQL\'
--
-- Because of the option 2, these views will compare all of the numeric 
-- or real value columns.
-------------------------------------------------------------------------------
-- Parameters:
--
-- @table - Name of the table to generate comparison views for
-- @ldb - Left database name, example pacs_oltp
-- @rdb - Right database name, example pacs_oltp_certified
-- @options - Specifies what types of columns to include
--						0 - All datatypes
--						1 - All number and interger types
--						2 - Only numeric and other real value types
--						3 - String types
-- @directory - Name of the directory to store sql files that are generated
-- @trusted - Use NT user account information
-- @user - SQL server user name required if not trusted
-- @pwd - SQL server password required if not trusted
--
-------------------------------------------------------------------------------
create procedure sp_TableCompareViewGen

@table as varchar(255),
@ldb as varchar(255),
@rdb as varchar(255),
@options int=0,
@directory as varchar(255)='C:\',
@trusted bit = 1,
@user as varchar(64) = NULL,
@pwd as varchar(64) = NULL
as



set nocount on

-- Create temporary tables before any other statements
If object_id('tempdb..#tmp_col_names')  IS NOT NULL
Begin
	drop table #tmp_col_names
End 

create table #tmp_col_names
(
	[name] varchar(128) not null
)


If object_id('tempdb..#tmp_col_types')  IS NOT NULL
Begin
	drop table #tmp_col_types
End 

create table #tmp_col_types
(
	[xtype] int not null
)

declare @select as varchar(8000)
declare @from as varchar(8000)
declare @where as varchar(8000)
declare @file_name as varchar(8000)

declare @sql_complete as varchar(8000)
declare @sql_columns as varchar(8000)
declare @sql_report as varchar(8000)
declare @sql_report_keys as varchar(8000)

declare @view as varchar(255)
declare @create_view as varchar(255)
declare @create_report_view as varchar(255)
declare @drop_report_view as varchar(255)
declare @drop_view as varchar(255)
declare @join_condition as varchar(8000)
declare @tmp_table as varchar(2048)
declare @join_phrase as varchar(64)
declare @keyno as int
declare @col_name as varchar(128)
declare @xtype as int
declare @isnullable as bit
declare @seq int


set @trusted=1
-- Make sure global temp table is created and empty for this spid
exec sp_SaveTextFile

set @select='select '+char(13)+char(10)

set @join_phrase=' inner join '

set @view=@table+'_cmp_vw'
set @join_condition=''

set @file_name=@directory+'cvw.'+@view+'.sql'

set @from = char(13)+char(10)+'from '+@ldb+'.dbo.'+@table+' as l with(nolock) '+char(13)+char(10)
set @from = @from+@join_phrase+@rdb+'.dbo.'+@table+' as r with(nolock) on '+char(13)+char(10)

set @where=char(13)+char(10)+'where '

-- Drop the view if it already exists
set @drop_view=''

set @drop_view=@drop_view+'SET QUOTED_IDENTIFIER ON '+char(13)+char(10)
set @drop_view=@drop_view+'GO'+char(13)+char(10)
set @drop_view=@drop_view+'SET ANSI_NULLS ON '+char(13)+char(10)
set @drop_view=@drop_view+'GO'+char(13)+char(10)
set @drop_view=@drop_view+'If object_id('''+@view+''')  IS NOT NULL'+char(13)+char(10)
set @drop_view=@drop_view+'Begin'+char(13)+char(10)
set @drop_view=@drop_view+'	drop view '+@view+char(13)+char(10)
set @drop_view=@drop_view+'End '+char(13)+char(10)+'go'+char(13)+char(10)


set @create_view='create view '+@view +char(13)+char(10)+'AS '+char(13)+char(10)
set @create_report_view='create view '+@table+'_report_cmp_vw' +char(13)+char(10)+'AS '+char(13)+char(10)
set @drop_report_view=''
set @drop_report_view=@drop_report_view+'If object_id('''+@table+'_report_cmp_vw'+''')  IS NOT NULL'+char(13)+char(10)
set @drop_report_view=@drop_report_view+'Begin'+char(13)+char(10)
set @drop_report_view=@drop_report_view+'	drop view '+@table+'_report_cmp_vw'+char(13)+char(10)
set @drop_report_view=@drop_report_view+'End '+char(13)+char(10)+'go'+char(13)+char(10)

-- Store the column names from the right database, so that we can only
-- compare columns that exist in both databases
set @tmp_table=''

set @tmp_table=@tmp_table+'insert into #tmp_col_names'+char(13)+char(10)
set @tmp_table=@tmp_table+'('+char(13)+char(10)
set @tmp_table=@tmp_table+'	name'+char(13)+char(10)
set @tmp_table=@tmp_table+')'+char(13)+char(10)
set @tmp_table=@tmp_table+'select c.name'+char(13)+char(10)
set @tmp_table=@tmp_table+'from '+@rdb+'.dbo.sysobjects as o with(nolock)'+char(13)+char(10)
set @tmp_table=@tmp_table+'inner join '+@rdb+'.dbo.syscolumns as c with(nolock) on'+char(13)+char(10)
set @tmp_table=@tmp_table+'		o.id=c.id'+char(13)+char(10)
set @tmp_table=@tmp_table+'and o.name='''+@table+''''+char(13)+char(10)
exec(@tmp_table)

if @options=0
	begin
		-- All datatypes
		insert into #tmp_col_types (xtype) select xtype from systypes
	end
else if @options=1
	begin
		-- All integer and number types
		insert into #tmp_col_types (xtype) select xtype from systypes where xtype in (127,106,62,56,108,59,52,122,48)
	end
else if @options=2
	begin
	-- All number types no integers
		insert into #tmp_col_types (xtype) select xtype from systypes where xtype in (106,62,108,59,122)
	end
else if @options=3
	begin
	-- Char and varchar
		insert into #tmp_col_types (xtype) select xtype from systypes where xtype in (175,239,99,167,35)
	end

declare keys cursor for
-- Query for primary key columns
select k.keyno,c.name,c.xtype
from sysindexes as i with(nolock)
inner join sysobjects as o with(nolock) on
		o.id=i.id
inner join sysobjects as pkey with(nolock) on
		pkey.parent_obj=o.id
and pkey.xtype='PK'
and pkey.name=i.name
inner join sysindexkeys as k with(nolock) on
		i.id=k.id
and i.indid=k.indid

inner join syscolumns as c with(nolock) on
		c.id=k.id
and c.colid=k.colid
inner join systypes as t with(nolock) on
		t.xtype=c.xtype

where o.name=@table
order by k.keyno


declare col cursor fast_forward for
-- Query for columns, excluding primary key columns
select c.name,c.xtype,c.isnullable 
from sysobjects as o with(nolock)
inner join syscolumns as c with(nolock) on
		o.id=c.id
inner join systypes as t with(nolock) on
		t.xtype=c.xtype
inner join #tmp_col_names as r with(nolock) on
		r.name=c.name
inner join #tmp_col_types as f on
		f.xtype=c.xtype
where c.name not in
(
	select c1.name
	from sysindexes as i1 with(nolock)
	inner join sysobjects as o1 with(nolock) on
			o1.id=i1.id
	inner join sysobjects as pkey1 with(nolock) on
			pkey1.parent_obj=o1.id
	and pkey1.xtype='PK'
	and pkey1.name=i1.name
	inner join sysindexkeys as k1 with(nolock) on
			i1.id=k1.id
	and i1.indid=k1.indid
	
	inner join syscolumns as c1 with(nolock) on
			c1.id=k1.id
	and c1.colid=k1.colid

	where o1.name=o.name
)
and o.name=@table

-- Build the join condition
open keys
set @sql_report_keys=''
fetch next from keys into 
	@keyno,
	@col_name,
	@xtype

while @@fetch_status = 0
begin

	set @join_condition =	@join_condition+'l.'+@col_name+'='+'r.'+@col_name+char(13)+char(10)
	set @select = @select + 'l.'+@col_name+','+char(13)+char(10)
	set @sql_report_keys = @sql_report_keys + 'l.'+@col_name+','+char(13)+char(10)
	fetch next from keys into 
			@keyno,
			@col_name,
			@xtype
	if @@fetch_status = 0
	begin
		set @join_condition=@join_condition+' and '
	end
end

close keys
deallocate keys

-- Flush remaining text, create statement
exec sp_SaveText @drop_view ,	@seq output,1
exec sp_SaveText @create_view ,	@seq output,1

-- Build the select clauses
open col

fetch next from col into 
	@col_name,
	@xtype,
	@isnullable

while @@fetch_status = 0
begin
	-- Generate the select statement
	set @select=@select+'l.'+@col_name+' as l_'+@col_name+', r.'+@col_name+' as r_'+@col_name

	fetch next from col into 
		@col_name,
		@xtype,
		@isnullable

	if @@fetch_status = 0
	begin
		set @select=@select+','+char(13)+char(10)
	end
	-- Save text if greater than 7000 characters
	exec sp_SaveText @select output,	@seq output

end
close col

set @select=@select+char(13)+char(10)
-- Flush remaining text
exec sp_SaveText @select output,	@seq output,1

-- Flush remaining text, from 
exec sp_SaveText @from ,	@seq output,1
-- Flush remaining text, join 
exec sp_SaveText @join_condition ,	@seq output,1

-- Build the where clause
set @where = @where + '('+char(13)+char(10)+CHAR(9)
open col

fetch next from col into 
	@col_name,
	@xtype,
	@isnullable

while @@fetch_status = 0
begin

	-- Generate the where conditions
	if @isnullable = 0
		begin
			set @where =  @where+'l.'+@col_name+'<>'+'r.'+@col_name+char(13)+char(10)
		end
	else
		begin
			if @xtype in (167,175,239,99,231,35) -- Text
				begin
					set @where =  @where+'isnull('+'l.'+@col_name+','''')<>'+'isnull('+'r.'+@col_name+','''')'+char(13)+char(10)
				end
			else
				begin
					set @where =  @where+'isnull('+'l.'+@col_name+',0)<>'+'isnull('+'r.'+@col_name+',0)'+char(13)+char(10)
				end
		end

	fetch next from col into 
		@col_name,
		@xtype,
		@isnullable

	-- Save text if greater than 7000 characters
	exec sp_SaveText @where output,	@seq output

	if @@fetch_status = 0
	begin
		set @where=@where+' or '
	end
	
end
close col

set @where = @where + char(13)+char(10)+')'+char(13)+char(10)+'go'+char(13)+char(10)

-- Flush remaining text
exec sp_SaveText @where output,	@seq output, 1 



-- Build report view
declare @flag bit
set @flag=0
set @sql_report=''

exec sp_SaveText @drop_report_view ,	@seq output, 1 
exec sp_SaveText @create_report_view ,	@seq output, 1 
open col

fetch next from col into 
	@col_name,
	@xtype,
	@isnullable

while @@fetch_status = 0
begin

	-- Generate the unions
	if @flag=1
		begin
			set @sql_report=@sql_report+char(13)+char(10)+'union all select '+char(13)+char(10)+@sql_report_keys+''''+@col_name+''''+' as [column],'+char(13)+char(10)
		end
	else
		begin
			set @sql_report=@sql_report+char(13)+char(10)+'select '+char(13)+char(10)+@sql_report_keys+''''+@col_name+''''+' as [column],'+char(13)+char(10)
			set @flag=1
		end
	set @sql_report=@sql_report+'cast(l.'+@col_name+' as varchar(512)) as '+@ldb+','+char(13)+char(10)+'cast(r.'+@col_name+' as varchar(512)) as '+@rdb+char(13)+char(10)
	--set @sql_report=@sql_report+'from '+@view+char(13)+char(10)
	set @sql_report=@sql_report+@from+@join_condition

	if @isnullable = 0
		begin
			set @sql_report =  @sql_report+'where '+'l.'+@col_name+'<>'+'r.'+@col_name+char(13)+char(10)
		end
	else
		begin
			if @xtype in (167,175,239,99,231,35) -- Text
				begin
					set @sql_report =  @sql_report+'where '+'isnull('+'l.'+@col_name+','''')<>'+'isnull('+'r.'+@col_name+','''')'+char(13)+char(10)
				end
			else
				begin
					set @sql_report =  @sql_report+'where '+'isnull('+'l.'+@col_name+',0)<>'+'isnull('+'r.'+@col_name+',0)'+char(13)+char(10)
				end
		end

	fetch next from col into 
		@col_name,
		@xtype,
		@isnullable

	-- Save text if greater than 7000 characters
	exec sp_SaveText @sql_report output,	@seq output

	
end
close col

set @sql_report=@sql_report+'go'+char(13)+char(10)
exec sp_SaveText @sql_report output,	@seq output,1

deallocate col

-- Save the text file
exec sp_SaveTextFile @file_name,@trusted,@user,@pwd


--print @create_view
--print @select
--print @from
--print @join_condition
--print @where

--set @sql_complete=@create_view+@select+@from+@join_condition+@where
--exec(@sql_complete)
--print @sql_complete
--select datalength(@create_view )

declare @cmd varchar(512)

if @trusted = 0
	begin
		set @cmd='isql -i"'+@file_name+'" -S"'+@@SERVERNAME+'" -U"'+@user+'" -P"'+@pwd+'" -d"'+@ldb+'"'
		exec master..xp_CmdShell @cmd
	end
else
	begin
		set @cmd='isql -i"'+@file_name+'" -S"'+@@SERVERNAME+'" -E -d"'+@ldb+'"'
		exec master..xp_CmdShell @cmd
	end

GO

