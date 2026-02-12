CREATE TABLE [dbo].[condition] (
    [condition_cd]   CHAR (5)     NOT NULL,
    [condition_desc] VARCHAR (50) NULL,
    [sys_flag]       CHAR (1)     NULL,
    [rc_type]        CHAR (1)     NULL,
    CONSTRAINT [CPK_condition] PRIMARY KEY CLUSTERED ([condition_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_condition_delete_insert_update_MemTable
on condition
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
where szTableName = 'condition'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'condition', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

