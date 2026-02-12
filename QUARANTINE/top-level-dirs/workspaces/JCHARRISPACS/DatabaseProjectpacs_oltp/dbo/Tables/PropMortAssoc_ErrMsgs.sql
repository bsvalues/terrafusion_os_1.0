CREATE TABLE [dbo].[PropMortAssoc_ErrMsgs] (
    [errCode] VARCHAR (2)   NOT NULL,
    [errMsg]  VARCHAR (150) NULL,
    CONSTRAINT [CPK_PropMortAssoc_ErrMsgs] PRIMARY KEY CLUSTERED ([errCode] ASC) WITH (FILLFACTOR = 100)
);


GO

