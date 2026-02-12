CREATE TABLE [dbo].[query_builder_fields] (
    [lFieldID]             INT           NOT NULL,
    [lUniqueColumnID]      INT           NOT NULL,
    [bFieldRoot]           BIT           NOT NULL,
    [szName]               VARCHAR (127) NOT NULL,
    [szCategory]           VARCHAR (500) NOT NULL,
    [szSubCategory]        VARCHAR (500) NULL,
    [szFieldDescription]   VARCHAR (500) NOT NULL,
    [szSampleData]         VARCHAR (255) NULL,
    [bExcludeDeletedProps] BIT           NULL,
    [bIncludeParentProps]  BIT           NULL,
    [szSubCategory2]       VARCHAR (500) NULL,
    CONSTRAINT [CPK_query_builder_fields] PRIMARY KEY CLUSTERED ([lFieldID] ASC, [lUniqueColumnID] ASC) WITH (FILLFACTOR = 100)
);


GO

