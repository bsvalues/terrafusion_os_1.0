CREATE TABLE [dbo].[security_dbkeys] (
    [key_name] VARCHAR (255)   NOT NULL,
    [key_blob] VARBINARY (256) NULL,
    CONSTRAINT [CPK_security_dbkeys] PRIMARY KEY CLUSTERED ([key_name] ASC) WITH (FILLFACTOR = 100)
);


GO

