CREATE TABLE [dbo].[sale_ratio_type] (
    [sl_ratio_type_cd] CHAR (5)     NOT NULL,
    [sl_ratio_desc]    VARCHAR (30) NULL,
    [invalid_sale]     BIT          NULL,
    [requires_reason]  BIT          NULL,
    CONSTRAINT [CPK_sale_ratio_type] PRIMARY KEY CLUSTERED ([sl_ratio_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

