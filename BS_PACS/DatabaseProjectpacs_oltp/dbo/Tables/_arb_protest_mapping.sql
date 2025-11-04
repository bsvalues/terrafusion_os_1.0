CREATE TABLE [dbo].[_arb_protest_mapping] (
    [QuestionID]      VARCHAR (10)  NOT NULL,
    [QuestionText]    VARCHAR (255) NOT NULL,
    [ProtestQuestion] VARCHAR (10)  NULL,
    CONSTRAINT [CPK__arb_protest_mapping] PRIMARY KEY CLUSTERED ([QuestionID] ASC) WITH (FILLFACTOR = 100)
);


GO

