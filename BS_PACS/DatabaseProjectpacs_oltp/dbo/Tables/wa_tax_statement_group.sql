CREATE TABLE [dbo].[wa_tax_statement_group] (
    [group_id]               INT          NOT NULL,
    [year]                   NUMERIC (4)  NOT NULL,
    [description]            VARCHAR (50) NOT NULL,
    [include_property_taxes] BIT          NOT NULL,
    [include_assessments]    BIT          NOT NULL,
    CONSTRAINT [CPK_wa_tax_statement_group] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO




create trigger tr_wa_tax_statement_group_delete_insert_update_MemTable
on wa_tax_statement_group
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
where szTableName = 'wa_tax_statement_group'

GO

