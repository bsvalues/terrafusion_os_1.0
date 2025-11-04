CREATE TABLE [dbo].[query_builder_query] (
    [lQueryID]         INT            IDENTITY (100000, 1) NOT NULL,
    [lPacsUserID]      INT            NOT NULL,
    [szQueryName]      VARCHAR (63)   NOT NULL,
    [szQueryDesc]      VARCHAR (1023) NULL,
    [dtCreate]         DATETIME       NOT NULL,
    [dtExpire]         DATETIME       NOT NULL,
    [bDistinct]        BIT            NOT NULL,
    [binClientAppData] IMAGE          NULL,
    [bIsHidden]        BIT            CONSTRAINT [CDF_query_builder_query_bIsHidden] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_query_builder_query] PRIMARY KEY CLUSTERED ([lQueryID] ASC) WITH (FILLFACTOR = 100)
);


GO

CREATE NONCLUSTERED INDEX [idx_lPacsUserID]
    ON [dbo].[query_builder_query]([lPacsUserID] ASC) WITH (FILLFACTOR = 80);


GO

