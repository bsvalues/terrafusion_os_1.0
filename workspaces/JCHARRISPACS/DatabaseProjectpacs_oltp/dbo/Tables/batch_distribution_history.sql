CREATE TABLE [dbo].[batch_distribution_history] (
    [id]           INT           IDENTITY (1, 1) NOT NULL,
    [trans_type]   CHAR (5)      NULL,
    [message]      VARCHAR (100) NULL,
    [pacs_user_id] INT           NULL,
    [trans_dt]     DATETIME      NULL,
    [balance_dt]   DATETIME      NULL,
    CONSTRAINT [CPK_batch_distribution_history] PRIMARY KEY CLUSTERED ([id] ASC) WITH (FILLFACTOR = 100)
);


GO

