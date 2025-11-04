CREATE TABLE [dbo].[tb_ta_transaction_component_alert] (
    [lEnvironmentID]          TINYINT NOT NULL,
    [lTransactionComponentID] INT     NOT NULL,
    [lOperatorID]             INT     NOT NULL,
    [lLogThreshold]           TINYINT NOT NULL,
    CONSTRAINT [CPK_tb_ta_transaction_component_alert] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC, [lTransactionComponentID] ASC, [lOperatorID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_tb_ta_transaction_component_alert_lLogThreshold] CHECK ([lLogThreshold]>(0) AND [lLogThreshold]<(8)),
    CONSTRAINT [CFK_tb_ta_transaction_component_alert_lEnvironmentID_lTransactionComponentID] FOREIGN KEY ([lEnvironmentID], [lTransactionComponentID]) REFERENCES [dbo].[tb_ta_transaction_component] ([lEnvironmentID], [lTransactionComponentID]) ON DELETE CASCADE,
    CONSTRAINT [CFK_tb_ta_transaction_component_alert_lOperatorID] FOREIGN KEY ([lOperatorID]) REFERENCES [dbo].[tb_ta_operator] ([lOperatorID]) ON DELETE CASCADE
);


GO

