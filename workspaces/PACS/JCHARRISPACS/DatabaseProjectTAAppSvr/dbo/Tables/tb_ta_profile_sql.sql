CREATE TABLE [dbo].[tb_ta_profile_sql] (
    [ID]                    BIGINT   IDENTITY (1, 1) NOT NULL,
    [l64TransactionQueueID] BIGINT   NOT NULL,
    [lSPID]                 INT      NOT NULL,
    [dtBegin]               DATETIME NOT NULL,
    [dtEnd]                 DATETIME NOT NULL,
    [szSQL]                 TEXT     NOT NULL,
    [szError]               TEXT     NULL,
    [bSuccess]              AS       (CONVERT([bit],case when [szError] IS NULL then (1) else (0) end)),
    CONSTRAINT [CPK_tb_ta_profile_sql] PRIMARY KEY CLUSTERED ([ID] ASC) WITH (FILLFACTOR = 100)
);


GO

