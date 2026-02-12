CREATE TABLE [dbo].[PropMortAssoc_DataSummary] (
    [lKey] INT           IDENTITY (1, 1) NOT NULL,
    [memo] VARCHAR (128) NULL,
    CONSTRAINT [CPK_PropMortAssoc_DataSummary] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

