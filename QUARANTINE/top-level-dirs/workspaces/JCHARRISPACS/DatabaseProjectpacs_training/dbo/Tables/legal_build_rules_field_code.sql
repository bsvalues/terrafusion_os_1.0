CREATE TABLE [dbo].[legal_build_rules_field_code] (
    [lFieldCode]  INT          NOT NULL,
    [szFieldDesc] VARCHAR (63) NOT NULL,
    CONSTRAINT [CPK_legal_build_rules_field_code] PRIMARY KEY CLUSTERED ([lFieldCode] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_legal_build_rules_field_code_delete_insert_update_MemTable
on legal_build_rules_field_code
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
where szTableName = 'legal_build_rules_field_code'

GO

