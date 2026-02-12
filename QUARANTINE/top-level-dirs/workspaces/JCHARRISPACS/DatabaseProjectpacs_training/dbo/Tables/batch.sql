CREATE TABLE [dbo].[batch] (
    [batch_id]        INT           NOT NULL,
    [balance_dt]      DATETIME      NULL,
    [close_dt]        DATETIME      NULL,
    [deposit_date]    DATETIME      NULL,
    [create_dt]       DATETIME      NULL,
    [user_id]         INT           NULL,
    [comment]         VARCHAR (255) NULL,
    [distribution_id] INT           NULL,
    [description]     VARCHAR (255) NULL,
    CONSTRAINT [CPK_batch] PRIMARY KEY CLUSTERED ([batch_id] ASC) WITH (FILLFACTOR = 90)
);


GO

