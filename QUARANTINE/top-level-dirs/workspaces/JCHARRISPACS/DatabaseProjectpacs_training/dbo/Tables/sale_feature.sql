CREATE TABLE [dbo].[sale_feature] (
    [chg_of_owner_id] INT      NOT NULL,
    [prop_id]         INT      NOT NULL,
    [sl_feature_id]   INT      NOT NULL,
    [sl_feature_cd]   CHAR (5) NULL,
    CONSTRAINT [CPK_sale_feature] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC, [prop_id] ASC, [sl_feature_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sale_feature_sl_feature_cd] FOREIGN KEY ([sl_feature_cd]) REFERENCES [dbo].[sale_feature_code] ([sl_feature_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_sl_feature_cd]
    ON [dbo].[sale_feature]([sl_feature_cd] ASC) WITH (FILLFACTOR = 90);


GO

