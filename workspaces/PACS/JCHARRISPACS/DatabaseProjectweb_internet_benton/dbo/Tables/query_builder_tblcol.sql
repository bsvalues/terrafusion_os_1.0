CREATE TABLE [dbo].[query_builder_tblcol] (
    [szTable]          VARCHAR (127) NOT NULL,
    [szColumn]         VARCHAR (127) NOT NULL,
    [lUniqueColumnID]  INT           NOT NULL,
    [bKeyColumn]       BIT           NOT NULL,
    [lElementType]     INT           NULL,
    [szJoinOnConstant] VARCHAR (63)  NULL,
    [szHumanLanguage]  VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_query_builder_tblcol] PRIMARY KEY CLUSTERED ([szTable] ASC, [szColumn] ASC) WITH (FILLFACTOR = 100)
);


GO

