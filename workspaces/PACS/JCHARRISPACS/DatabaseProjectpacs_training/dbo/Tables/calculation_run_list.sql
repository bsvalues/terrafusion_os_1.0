CREATE TABLE [dbo].[calculation_run_list] (
    [dataset_id] INT         NOT NULL,
    [year]       NUMERIC (4) NOT NULL,
    [sup_num]    INT         NOT NULL,
    [prop_id]    INT         NOT NULL,
    [segment_id] INT         NOT NULL,
    CONSTRAINT [CPK_calculation_run_list] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [year] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 100)
);


GO

