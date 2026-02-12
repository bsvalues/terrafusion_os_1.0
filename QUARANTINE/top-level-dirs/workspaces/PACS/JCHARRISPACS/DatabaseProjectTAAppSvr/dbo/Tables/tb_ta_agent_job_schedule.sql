CREATE TABLE [dbo].[tb_ta_agent_job_schedule] (
    [l64AgentJobScheduleID]         BIGINT        IDENTITY (1, 1) NOT NULL,
    [l64AgentJobID]                 BIGINT        NOT NULL,
    [bEnabled]                      BIT           NOT NULL,
    [dtTime]                        DATETIME      NOT NULL,
    [lDaysMask]                     TINYINT       NOT NULL,
    [szAgentJobScheduleDescription] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_tb_ta_agent_job_schedule] PRIMARY KEY CLUSTERED ([l64AgentJobScheduleID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_tb_ta_agent_job_schedule_lDaysMask] CHECK ([lDaysMask]=(1) OR ([lDaysMask]&(1))=(0)),
    CONSTRAINT [CFK_tb_ta_agent_job_schedule_l64AgentJobID] FOREIGN KEY ([l64AgentJobID]) REFERENCES [dbo].[tb_ta_agent_job] ([l64AgentJobID]) ON DELETE CASCADE
);


GO

