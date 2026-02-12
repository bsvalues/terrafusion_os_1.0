CREATE TABLE [dbo].[batch_close_month] (
    [close_month_id] INT      IDENTITY (1, 1) NOT NULL,
    [month]          INT      NULL,
    [month_yr]       INT      NULL,
    [close_by_id]    INT      NULL,
    [close_dt]       DATETIME NULL,
    CONSTRAINT [CPK_batch_close_month] PRIMARY KEY CLUSTERED ([close_month_id] ASC) WITH (FILLFACTOR = 100)
);


GO

