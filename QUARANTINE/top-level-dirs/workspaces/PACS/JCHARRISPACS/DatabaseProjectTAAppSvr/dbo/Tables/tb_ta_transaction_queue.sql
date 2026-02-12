CREATE TABLE [dbo].[tb_ta_transaction_queue] (
    [l64TransactionQueueID]               BIGINT           NOT NULL,
    [lEnvironmentID]                      TINYINT          NOT NULL,
    [lTransactionComponentID]             INT              NOT NULL,
    [lPriority]                           TINYINT          NOT NULL,
    [dtQueued]                            DATETIME         NOT NULL,
    [dtTransactionBegin]                  DATETIME         NULL,
    [dtTransactionEnd]                    DATETIME         NULL,
    [szAppUser]                           VARCHAR (63)     NOT NULL,
    [szSlaveMachineName]                  VARCHAR (23)     NULL,
    [bLargeJob]                           BIT              NOT NULL,
    [lHResult]                            INT              NULL,
    [bSuccess]                            AS               (CONVERT([bit],case when [lHResult]>(-1) then (1) else (0) end)),
    [lSubTransactionID]                   INT              NULL,
    [l64AgentJobScheduleID]               BIGINT           NULL,
    [bPersistTransactionCompleteCallback] BIT              NOT NULL,
    [l64TransactionQueueIDCallback]       BIGINT           NULL,
    [lLoginID]                            INT              NULL,
    [uuidClientTransaction]               UNIQUEIDENTIFIER NULL,
    [bRecoverable]                        BIT              NULL,
    [szDescription]                       VARCHAR (511)    NULL,
    [l64JobCPU]                           BIGINT           NULL,
    [l64SQLCPU]                           BIGINT           NULL,
    [l64SQLIO]                            BIGINT           NULL,
    CONSTRAINT [CPK_tb_ta_transaction_queue] PRIMARY KEY CLUSTERED ([l64TransactionQueueID] ASC) WITH (FILLFACTOR = 100)
);


GO

