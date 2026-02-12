CREATE TABLE [dbo].[mhm_type_code] (
    [mhm_type_cd]   VARCHAR (10) NOT NULL,
    [mhm_type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_mhm_type_code] PRIMARY KEY CLUSTERED ([mhm_type_cd] ASC)
);


GO


create trigger tr_mhm_type_code_delete_insert_update_MemTable
on mhm_type_code
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
where szTableName = 'mhm_type_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mobile Home Movement Type Codefile', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mhm_type_code';


GO

