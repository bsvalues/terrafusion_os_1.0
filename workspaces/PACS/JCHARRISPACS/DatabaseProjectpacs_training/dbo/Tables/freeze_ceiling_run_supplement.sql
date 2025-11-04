CREATE TABLE [dbo].[freeze_ceiling_run_supplement] (
    [run_id]  INT         NOT NULL,
    [year]    NUMERIC (4) NOT NULL,
    [sup_num] INT         NOT NULL,
    CONSTRAINT [CPK_freeze_ceiling_run_supplement] PRIMARY KEY CLUSTERED ([run_id] ASC, [year] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_freeze_ceiling_run_supplement_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[freeze_ceiling_run] ([run_id])
);


GO

