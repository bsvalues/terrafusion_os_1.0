CREATE TABLE [dbo].[batch_close_month_assoc] (
    [close_month_id] INT NOT NULL,
    [close_day_id]   INT NOT NULL,
    CONSTRAINT [CPK_batch_close_month_assoc] PRIMARY KEY CLUSTERED ([close_month_id] ASC, [close_day_id] ASC) WITH (FILLFACTOR = 100)
);


GO

