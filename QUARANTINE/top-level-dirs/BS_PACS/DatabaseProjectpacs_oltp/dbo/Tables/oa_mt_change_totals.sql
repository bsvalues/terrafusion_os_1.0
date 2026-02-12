CREATE TABLE [dbo].[oa_mt_change_totals] (
    [total_records]       INT    NOT NULL,
    [total_owner_records] INT    NULL,
    [total_agent_records] INT    NULL,
    [total_real]          INT    NULL,
    [total_personal]      INT    NULL,
    [total_mobile_home]   INT    NULL,
    [total_automobile]    INT    NULL,
    [total_mineral]       INT    NULL,
    [dataset_id]          BIGINT NOT NULL
);


GO

