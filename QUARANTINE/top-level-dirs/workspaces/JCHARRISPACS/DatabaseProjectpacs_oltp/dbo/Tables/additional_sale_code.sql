CREATE TABLE [dbo].[additional_sale_code] (
    [sale_cd]      VARCHAR (10) NOT NULL,
    [sale_desc]    VARCHAR (30) NOT NULL,
    [imp_recopied] BIT          NOT NULL,
    CONSTRAINT [CPK_additional_sale_code] PRIMARY KEY CLUSTERED ([sale_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_additional_sale_code_delete_insert_update_MemTable
on additional_sale_code
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
where szTableName = 'additional_sale_code'

GO

