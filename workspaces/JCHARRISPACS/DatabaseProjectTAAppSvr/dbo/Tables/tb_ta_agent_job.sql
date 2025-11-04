CREATE TABLE [dbo].[tb_ta_agent_job] (
    [l64AgentJobID]                       BIGINT        IDENTITY (1, 1) NOT NULL,
    [szAgentJobDescription]               VARCHAR (255) NOT NULL,
    [lLoginIDRunAs]                       INT           NOT NULL,
    [lEnvironmentID]                      TINYINT       NOT NULL,
    [lTransactionComponentID]             INT           NOT NULL,
    [lPriority]                           TINYINT       NULL,
    [bEnabled]                            BIT           NOT NULL,
    [bPersistTransactionCompleteCallback] BIT           NOT NULL,
    [binParamsIn]                         IMAGE         NOT NULL,
    CONSTRAINT [CPK_tb_ta_agent_job] PRIMARY KEY CLUSTERED ([l64AgentJobID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tb_ta_agent_job_lEnvironmentID_lTransactionComponentID] FOREIGN KEY ([lEnvironmentID], [lTransactionComponentID]) REFERENCES [dbo].[tb_ta_transaction_component] ([lEnvironmentID], [lTransactionComponentID]) ON DELETE CASCADE
);


GO

