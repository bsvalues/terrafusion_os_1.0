CREATE TABLE [dbo].[letter_type] (
    [letter_type_cd]      VARCHAR (15)  NOT NULL,
    [letter_type_desc]    VARCHAR (255) NOT NULL,
    [letter_system_types] VARCHAR (5)   CONSTRAINT [CDF_letter_type_letter_system_types] DEFAULT ('A') NULL,
    CONSTRAINT [CPK_letter_type] PRIMARY KEY CLUSTERED ([letter_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_letter_type_delete_insert_update_MemTable
on letter_type
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
where szTableName = 'letter_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'System types allowed to use letter types: A=Assessor C=Collections', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'letter_type', @level2type = N'COLUMN', @level2name = N'letter_system_types';


GO

