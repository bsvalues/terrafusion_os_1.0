CREATE TABLE [dbo].[tb_ta_transaction_queue_archive] (
    [lYear]                   INT          NOT NULL,
    [lMonth]                  INT          NOT NULL,
    [lDay]                    INT          NOT NULL,
    [lEnvironmentID]          TINYINT      NOT NULL,
    [lTransactionComponentID] INT          NOT NULL,
    [lPriority]               TINYINT      NOT NULL,
    [szSlaveMachineName]      VARCHAR (23) NOT NULL,
    [bLargeJob]               BIT          NOT NULL,
    [bSuccess]                BIT          NOT NULL,
    [l64TransactionCount]     BIGINT       NOT NULL,
    [lMinSecondsQueue]        INT          NOT NULL,
    [lMinSecondsTransaction]  INT          NOT NULL,
    [lMinSecondsTotal]        INT          NOT NULL,
    [lMaxSecondsQueue]        INT          NOT NULL,
    [lMaxSecondsTransaction]  INT          NOT NULL,
    [lMaxSecondsTotal]        INT          NOT NULL,
    [lAvgSecondsQueue]        INT          NOT NULL,
    [lAvgSecondsTransaction]  INT          NOT NULL,
    [lAvgSecondsTotal]        INT          NOT NULL,
    CONSTRAINT [CPK_tb_ta_transaction_queue_archive] PRIMARY KEY CLUSTERED ([lYear] ASC, [lMonth] ASC, [lDay] ASC, [lEnvironmentID] ASC, [lTransactionComponentID] ASC, [lPriority] ASC, [szSlaveMachineName] ASC, [bLargeJob] ASC, [bSuccess] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tb_ta_transaction_queue_archive_lEnvironmentID_lTransactionComponentID] FOREIGN KEY ([lEnvironmentID], [lTransactionComponentID]) REFERENCES [dbo].[tb_ta_transaction_component] ([lEnvironmentID], [lTransactionComponentID]) ON DELETE CASCADE
);


GO

