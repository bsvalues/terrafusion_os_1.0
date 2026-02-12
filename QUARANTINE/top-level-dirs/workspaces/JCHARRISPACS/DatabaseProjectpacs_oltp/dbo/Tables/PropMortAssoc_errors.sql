CREATE TABLE [dbo].[PropMortAssoc_errors] (
    [datRec]  INT         NULL,
    [errType] VARCHAR (2) NULL,
    [lKey]    INT         IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_PropMortAssoc_errors] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

