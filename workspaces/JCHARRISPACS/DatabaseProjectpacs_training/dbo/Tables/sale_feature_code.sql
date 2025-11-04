CREATE TABLE [dbo].[sale_feature_code] (
    [sl_feature_cd]   CHAR (5)     NOT NULL,
    [sl_feature_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_sale_feature_code] PRIMARY KEY CLUSTERED ([sl_feature_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

