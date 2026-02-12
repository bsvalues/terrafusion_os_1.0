CREATE TABLE [dbo].[ag_use] (
    [ag_use_cd]     CHAR (5)     NOT NULL,
    [ag_use_desc]   VARCHAR (50) NOT NULL,
    [sys_flag]      CHAR (1)     NULL,
    [dfl]           BIT          NULL,
    [timber]        BIT          NULL,
    [reforestation] BIT          NULL,
    [ag]            BIT          NULL,
    [osp]           BIT          NULL,
    [pbrs]          BIT          CONSTRAINT [CDF_ag_use_pbrs] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_ag_use] PRIMARY KEY CLUSTERED ([ag_use_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_ag_use_delete_insert_update_MemTable
on ag_use
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
where szTableName = 'ag_use'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Public Benefit Rating System Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'ag_use', @level2type = N'COLUMN', @level2name = N'pbrs';


GO

