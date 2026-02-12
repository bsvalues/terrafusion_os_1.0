CREATE TABLE [dbo].[tax_due_calc_list] (
    [dataset_id] INT NOT NULL,
    [tax_due_id] INT NOT NULL,
    [segment_id] INT NULL,
    CONSTRAINT [CPK_tax_due_calc_list] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [tax_due_id] ASC) WITH (FILLFACTOR = 100)
);


GO

