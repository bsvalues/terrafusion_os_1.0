CREATE TABLE [dbo].[batch_close_day] (
    [close_day_id] INT      IDENTITY (1, 1) NOT NULL,
    [balance_dt]   DATETIME NULL,
    [close_by_id]  INT      NULL,
    [close_dt]     DATETIME NULL,
    CONSTRAINT [CPK_batch_close_day] PRIMARY KEY CLUSTERED ([close_day_id] ASC) WITH (FILLFACTOR = 100)
);


GO

