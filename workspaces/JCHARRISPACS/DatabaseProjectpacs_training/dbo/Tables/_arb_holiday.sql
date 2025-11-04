CREATE TABLE [dbo].[_arb_holiday] (
    [holiday]     DATETIME     NOT NULL,
    [description] VARCHAR (50) NULL,
    CONSTRAINT [CPK__arb_holiday] PRIMARY KEY CLUSTERED ([holiday] ASC) WITH (FILLFACTOR = 90)
);


GO

