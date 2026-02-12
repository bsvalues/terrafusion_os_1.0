CREATE TABLE [dbo].[daily_batch_prop_assoc] (
    [batch_id]         INT          NOT NULL,
    [prop_id]          INT          NOT NULL,
    [prev_yr_assessed] NUMERIC (14) NULL,
    [curr_yr_assessed] NUMERIC (14) NULL,
    CONSTRAINT [CPK_daily_batch_prop_assoc] PRIMARY KEY CLUSTERED ([batch_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_daily_batch_prop_assoc_batch_id] FOREIGN KEY ([batch_id]) REFERENCES [dbo].[daily_batch] ([batch_id]),
    CONSTRAINT [CFK_daily_batch_prop_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[daily_batch_prop_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

