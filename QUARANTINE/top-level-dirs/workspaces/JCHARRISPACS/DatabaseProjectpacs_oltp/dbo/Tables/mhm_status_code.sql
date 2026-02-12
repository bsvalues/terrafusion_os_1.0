CREATE TABLE [dbo].[mhm_status_code] (
    [mhm_status_cd]   VARCHAR (12) NOT NULL,
    [mhm_status_desc] VARCHAR (50) NOT NULL,
    [cancelled]       BIT          NULL,
    [completed]       BIT          NULL,
    [priority]        INT          DEFAULT ((0)) NOT NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_mhm_status_code] PRIMARY KEY CLUSTERED ([mhm_status_cd] ASC)
);


GO


create trigger tr_mhm_status_code_delete_insert_update_MemTable
on mhm_status_code
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
where szTableName = 'mhm_status_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mobile Home Movement Status Codefile', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mhm_status_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Describes whether this code is a system code or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mhm_status_code', @level2type = N'COLUMN', @level2name = N'sys_flag';


GO

