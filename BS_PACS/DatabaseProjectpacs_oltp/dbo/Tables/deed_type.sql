CREATE TABLE [dbo].[deed_type] (
    [deed_type_cd]        CHAR (10)    NOT NULL,
    [deed_type_desc]      VARCHAR (50) NULL,
    [sys_flag]            CHAR (1)     NULL,
    [county_cd]           VARCHAR (10) NULL,
    [sales_ratio_type_cd] VARCHAR (5)  NULL,
    CONSTRAINT [CPK_deed_type] PRIMARY KEY CLUSTERED ([deed_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_deed_type_delete_insert_update_MemTable
on deed_type
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
where szTableName = 'deed_type'

GO

