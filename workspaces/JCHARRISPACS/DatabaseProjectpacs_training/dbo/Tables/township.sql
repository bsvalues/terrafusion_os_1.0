CREATE TABLE [dbo].[township] (
    [township_code] VARCHAR (20) NOT NULL,
    [township_year] NUMERIC (4)  NOT NULL,
    [township_desc] VARCHAR (60) NOT NULL,
    [created_date]  DATETIME     CONSTRAINT [DF_township_created_date] DEFAULT (getdate()) NULL,
    CONSTRAINT [CPK_township] PRIMARY KEY CLUSTERED ([township_code] ASC, [township_year] ASC)
);


GO


create trigger tr_township_delete_insert_update_MemTable
on township
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'township'

GO

