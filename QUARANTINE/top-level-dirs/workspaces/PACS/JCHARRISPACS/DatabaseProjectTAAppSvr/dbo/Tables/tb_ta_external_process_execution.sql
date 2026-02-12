CREATE TABLE [dbo].[tb_ta_external_process_execution] (
    [lEnvironmentID]          TINYINT       NOT NULL,
    [lTransactionComponentID] INT           NOT NULL,
    [szMachineName]           VARCHAR (255) NOT NULL,
    [lProcessSPID]            SMALLINT      CONSTRAINT [CDF_tb_ta_process_execution_state_lProcessSPID] DEFAULT ((-1)) NOT NULL,
    [szProcessFunction]       VARCHAR (255) NULL,
    [lProcessBindPort]        INT           NOT NULL,
    [szProcessNamedEvent]     VARCHAR (255) NOT NULL,
    [szProcessState]          VARCHAR (63)  NULL,
    CONSTRAINT [CPK_tb_ta_external_process_execution] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC, [lTransactionComponentID] ASC, [szMachineName] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tb_ta_external_process_execution_lEnvironmentID_lTransactionComponentID] FOREIGN KEY ([lEnvironmentID], [lTransactionComponentID]) REFERENCES [dbo].[tb_ta_transaction_component] ([lEnvironmentID], [lTransactionComponentID]) ON DELETE CASCADE
);


GO

