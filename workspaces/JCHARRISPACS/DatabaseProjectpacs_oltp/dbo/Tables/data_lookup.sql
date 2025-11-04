CREATE TABLE [dbo].[data_lookup] (
    [FieldID] VARCHAR (10) NOT NULL,
    [Name]    VARCHAR (25) NOT NULL,
    [Filter]  VARCHAR (25) NOT NULL,
    CONSTRAINT [CPK_data_lookup] PRIMARY KEY CLUSTERED ([Filter] ASC, [FieldID] ASC) WITH (FILLFACTOR = 100)
);


GO

