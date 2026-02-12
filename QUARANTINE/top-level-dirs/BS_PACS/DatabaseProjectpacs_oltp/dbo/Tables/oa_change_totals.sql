CREATE TABLE [dbo].[oa_change_totals] (
    [total_records]       INT NOT NULL,
    [total_owner_records] INT NULL,
    [total_agent_records] INT NULL,
    [total_real]          INT NULL,
    [total_personal]      INT NULL,
    [total_mobile_home]   INT NULL,
    [total_automobile]    INT NULL,
    [total_mineral]       INT NULL,
    CONSTRAINT [CPK_oa_change_totals] PRIMARY KEY CLUSTERED ([total_records] ASC) WITH (FILLFACTOR = 100)
);


GO

