CREATE TABLE [dbo].[tb_ta_transaction_component_config] (
    [lEnvironmentID]          TINYINT       NOT NULL,
    [lTransactionComponentID] INT           NOT NULL,
    [szConfigName]            VARCHAR (63)  NOT NULL,
    [szConfigValue]           VARCHAR (255) NOT NULL,
    [lConfigValueType]        INT           NOT NULL,
    [bAllowUIEdit]            BIT           CONSTRAINT [CDF_tb_ta_transaction_component_config_bAllowUIEdit] DEFAULT ((1)) NOT NULL,
    [bReadOnce]               BIT           CONSTRAINT [CDF_tb_ta_transaction_component_config_bReadOnce] DEFAULT ((0)) NOT NULL,
    [szDescription]           VARCHAR (511) NULL,
    CONSTRAINT [CPK_tb_ta_transaction_component_config] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC, [lTransactionComponentID] ASC, [szConfigName] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_tb_ta_transaction_component_config_lConfigValueType] CHECK ([lConfigValueType]=(5) OR [lConfigValueType]=(4) OR [lConfigValueType]=(3) OR [lConfigValueType]=(2) OR [lConfigValueType]=(1) OR [lConfigValueType]=(0)),
    CONSTRAINT [CFK_tb_ta_transaction_component_config_lEnvironmentID_lTransactionComponentID] FOREIGN KEY ([lEnvironmentID], [lTransactionComponentID]) REFERENCES [dbo].[tb_ta_transaction_component] ([lEnvironmentID], [lTransactionComponentID]) ON DELETE CASCADE
);


GO


create trigger tr_tb_ta_transaction_component_config_delete_insert_update_MemTable
on tb_ta_transaction_component_config
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update tb_ta_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'tb_ta_transaction_component_config'

GO

