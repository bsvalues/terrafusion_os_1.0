CREATE TABLE [dbo].[pp_schedule] (
    [pp_sched_id]  INT         NOT NULL,
    [year]         NUMERIC (4) NOT NULL,
    [value_method] CHAR (5)    NOT NULL,
    [table_code]   CHAR (10)   NOT NULL,
    [segment_type] CHAR (10)   NOT NULL,
    CONSTRAINT [CPK_pp_schedule] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [year] ASC, [value_method] ASC, [table_code] ASC, [segment_type] ASC) WITH (FILLFACTOR = 100)
);


GO

