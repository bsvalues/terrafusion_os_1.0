CREATE TABLE [dbo].[pp_schedule_order] (
    [pp_sched_id] INT         NOT NULL,
    [year]        NUMERIC (4) NOT NULL,
    [module_1]    CHAR (4)    NULL,
    [module_2]    CHAR (4)    NULL,
    [module_3]    CHAR (4)    NULL,
    [module_4]    CHAR (4)    NULL,
    [module_5]    CHAR (4)    NULL,
    [module_6]    CHAR (4)    NULL,
    CONSTRAINT [CPK_pp_schedule_order] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO

