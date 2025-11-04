CREATE TABLE [dbo].[tb_ta_cache_status] (
    [szTableName] VARCHAR (127) NOT NULL,
    [lDummy]      INT           NOT NULL,
    [ts]          ROWVERSION    NOT NULL,
    CONSTRAINT [CPK_tb_ta_cache_status] PRIMARY KEY CLUSTERED ([szTableName] ASC) WITH (FILLFACTOR = 100)
);


GO

