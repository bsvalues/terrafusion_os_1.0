CREATE TABLE [dbo].[mm_table_field] (
    [type]             VARCHAR (5)   NOT NULL,
    [field_name]       VARCHAR (100) NOT NULL,
    [pacs_table_name]  VARCHAR (50)  NOT NULL,
    [pacs_column_name] VARCHAR (50)  NOT NULL,
    [field_type]       VARCHAR (10)  NOT NULL,
    [adj_type]         VARCHAR (5)   CONSTRAINT [CDF_mm_table_field_adj_type] DEFAULT ('S') NULL,
    CONSTRAINT [CPK_mm_table_field] PRIMARY KEY CLUSTERED ([pacs_table_name] ASC, [pacs_column_name] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_mm_table_field_delete_insert_update_MemTable
on mm_table_field
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
where szTableName = 'mm_table_field'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specify the adjustment type for this column if any', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mm_table_field', @level2type = N'COLUMN', @level2name = N'adj_type';


GO

