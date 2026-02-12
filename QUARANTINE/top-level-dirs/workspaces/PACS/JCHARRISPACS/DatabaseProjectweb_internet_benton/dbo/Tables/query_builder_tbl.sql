CREATE TABLE [dbo].[query_builder_tbl] (
    [szTable]         VARCHAR (127) NOT NULL,
    [szHumanLanguage] VARCHAR (255) NOT NULL,
    [szAlias]         VARCHAR (15)  NOT NULL,
    [bSingleRow]      BIT           NOT NULL,
    CONSTRAINT [CPK_query_builder_tbl] PRIMARY KEY CLUSTERED ([szTable] ASC) WITH (FILLFACTOR = 100)
);


GO

