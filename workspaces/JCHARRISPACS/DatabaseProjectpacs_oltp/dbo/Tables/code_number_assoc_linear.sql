CREATE TABLE [dbo].[code_number_assoc_linear] (
    [szType]    VARCHAR (15) NOT NULL,
    [szCode]    VARCHAR (23) NOT NULL,
    [l64Number] BIGINT       NOT NULL,
    CONSTRAINT [CPK_code_number_assoc_linear] PRIMARY KEY CLUSTERED ([szType] ASC, [szCode] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_code_number_assoc_linear_l64Number] CHECK ([l64Number] > 0),
    CONSTRAINT [CUQ_code_number_assoc_linear_szType_l64Number] UNIQUE NONCLUSTERED ([szType] ASC, [l64Number] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_code_number_assoc_linear_delete_insert_update_MemTable
on code_number_assoc_linear
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
where szTableName = 'code_number_assoc_linear'

GO

