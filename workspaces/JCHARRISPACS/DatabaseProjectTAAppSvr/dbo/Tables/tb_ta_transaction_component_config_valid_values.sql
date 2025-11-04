CREATE TABLE [dbo].[tb_ta_transaction_component_config_valid_values] (
    [lEnvironmentID]          TINYINT       NOT NULL,
    [lTransactionComponentID] INT           NOT NULL,
    [szConfigName]            VARCHAR (63)  NOT NULL,
    [szValidValue]            VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_tb_ta_transaction_component_config_valid_values] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC, [lTransactionComponentID] ASC, [szConfigName] ASC, [szValidValue] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tb_ta_transaction_component_config_valid_values_lEnvironmentID_lTransactionComponentID_szConfigName] FOREIGN KEY ([lEnvironmentID], [lTransactionComponentID], [szConfigName]) REFERENCES [dbo].[tb_ta_transaction_component_config] ([lEnvironmentID], [lTransactionComponentID], [szConfigName]) ON DELETE CASCADE
);


GO

