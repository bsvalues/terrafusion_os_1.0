CREATE TABLE [dbo].[levy_type] (
    [levy_type_cd]   VARCHAR (10) NOT NULL,
    [levy_type_desc] VARCHAR (50) NULL,
    [generated_by]   INT          NULL,
    [sys_flag]       BIT          NULL,
    [levy_part]      INT          CONSTRAINT [CDF_levy_type_levy_part] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_levy_type] PRIMARY KEY CLUSTERED ([levy_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_levy_type_generated_by] FOREIGN KEY ([generated_by]) REFERENCES [dbo].[pacs_user] ([pacs_user_id])
);


GO


create trigger tr_levy_type_delete_insert_update_MemTable
on levy_type
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
where szTableName = 'levy_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy Part 1 or 2 attribute', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy_type', @level2type = N'COLUMN', @level2name = N'levy_part';


GO

