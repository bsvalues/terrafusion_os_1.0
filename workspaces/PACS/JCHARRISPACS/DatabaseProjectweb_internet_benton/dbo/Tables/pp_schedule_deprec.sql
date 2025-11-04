CREATE TABLE [dbo].[pp_schedule_deprec] (
    [pp_sched_id]               INT          NOT NULL,
    [pp_sched_deprec_type_cd]   CHAR (10)    NOT NULL,
    [pp_sched_deprec_deprec_cd] CHAR (10)    NOT NULL,
    [year]                      NUMERIC (4)  NOT NULL,
    [description]               VARCHAR (50) NULL,
    CONSTRAINT [CPK_pp_schedule_deprec] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_deprec_type_cd] ASC, [pp_sched_deprec_deprec_cd] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO

