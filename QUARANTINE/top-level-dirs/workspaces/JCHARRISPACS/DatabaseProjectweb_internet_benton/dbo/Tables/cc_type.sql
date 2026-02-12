CREATE TABLE [dbo].[cc_type] (
    [cc_type] VARCHAR (5)  NOT NULL,
    [cc_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_cc_type] PRIMARY KEY CLUSTERED ([cc_type] ASC) WITH (FILLFACTOR = 100)
);


GO

