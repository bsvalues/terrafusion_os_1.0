CREATE TABLE [dbo].[sale_adjustment] (
    [sl_adj_cd]   CHAR (5)     NOT NULL,
    [sl_adj_desc] VARCHAR (30) NULL,
    [sys_flag]    CHAR (1)     NULL,
    CONSTRAINT [CPK_sale_adjustment] PRIMARY KEY CLUSTERED ([sl_adj_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

