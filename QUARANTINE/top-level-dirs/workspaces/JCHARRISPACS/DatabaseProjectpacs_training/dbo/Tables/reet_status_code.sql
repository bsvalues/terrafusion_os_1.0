CREATE TABLE [dbo].[reet_status_code] (
    [reet_status_cd]   VARCHAR (10) NOT NULL,
    [reet_status_desc] VARCHAR (30) NOT NULL,
    [priority]         INT          NOT NULL,
    [void_flag]        BIT          CONSTRAINT [CDF_reet_status_code_void_flag] DEFAULT ((0)) NOT NULL,
    [disable_flag]     BIT          CONSTRAINT [CDF_reet_status_code_disable_flag] DEFAULT ((0)) NOT NULL,
    [sys_flag]         BIT          CONSTRAINT [CDF_reet_status_code_sys_flag] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_reet_status_code] PRIMARY KEY CLUSTERED ([reet_status_cd] ASC)
);


GO


CREATE trigger [dbo].[tr_reet_status_code_delete_insert_update_MemTable]
on [dbo].[reet_status_code]
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
where szTableName = 'reet_status_code'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates a REET that has been disabled.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_status_code', @level2type = N'COLUMN', @level2name = N'disable_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates a REET that has been cancelled or voided.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_status_code', @level2type = N'COLUMN', @level2name = N'void_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag to determine if it is a System Code or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_status_code', @level2type = N'COLUMN', @level2name = N'sys_flag';


GO

