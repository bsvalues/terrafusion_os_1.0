CREATE TABLE [dbo].[reet_import_property] (
    [reet_id]           INT             NOT NULL,
    [prop_id]           INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [sup_num]           INT             NOT NULL,
    [land_use_cd]       VARCHAR (10)    NOT NULL,
    [location_cd]       VARCHAR (10)    NULL,
    [parcel_segregated] BIT             NOT NULL,
    [legal_desc]        VARCHAR (500)   NOT NULL,
    [taxable_val]       NUMERIC (14)    NOT NULL,
    [prop_type_cd]      CHAR (10)       NOT NULL,
    [situs_display]     VARCHAR (173)   NULL,
    [dor_use_cd]        VARCHAR (10)    NULL,
    [sale_price]        NUMERIC (11, 2) NULL,
    [sale_percent]      NUMERIC (5, 2)  NULL,
    [state_REET]        NUMERIC (12, 2) NULL,
    [local_REET]        NUMERIC (12, 2) NULL,
    CONSTRAINT [CPK_reet_import_property] PRIMARY KEY CLUSTERED ([reet_id] ASC, [prop_id] ASC, [year] ASC, [sup_num] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_reet_import_property_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Property Sale Percentage', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_import_property', @level2type = N'COLUMN', @level2name = N'sale_percent';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Property Sale Price', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_import_property', @level2type = N'COLUMN', @level2name = N'sale_price';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Property Local REET', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_import_property', @level2type = N'COLUMN', @level2name = N'local_REET';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'REET Property State REET', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_import_property', @level2type = N'COLUMN', @level2name = N'state_REET';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dept of Revenue Use Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_import_property', @level2type = N'COLUMN', @level2name = N'dor_use_cd';


GO

