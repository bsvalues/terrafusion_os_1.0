CREATE TABLE [dbo].[property_reet_assoc] (
    [year]                          NUMERIC (4)     NOT NULL,
    [sup_num]                       INT             NOT NULL,
    [prop_id]                       INT             NOT NULL,
    [reet_id]                       INT             NOT NULL,
    [legal_desc]                    VARCHAR (500)   NULL,
    [metes_and_bounds]              VARCHAR (500)   NULL,
    [original_property_use_cd]      CHAR (10)       NULL,
    [current_property_use_cd]       CHAR (10)       NULL,
    [situs_display]                 VARCHAR (173)   NULL,
    [prop_type_cd]                  CHAR (10)       NOT NULL,
    [urban_growth_cd]               VARCHAR (10)    NULL,
    [legal_acreage]                 NUMERIC (14, 4) NULL,
    [continue_current_use]          BIT             NULL,
    [current_use_update_by_user_id] INT             NULL,
    [current_use_update_date]       DATETIME        NULL,
    [imp_property_use_cd]           VARCHAR (10)    NULL,
    [location_cd]                   VARCHAR (4)     NULL,
    [parcel_segregated]             BIT             NULL,
    [imp_location_code]             VARCHAR (4)     NULL,
    [imp_parcel_segregated]         BIT             NULL,
    [taxable_classified]            NUMERIC (14)    CONSTRAINT [CDF_property_reet_assoc_taxable_classified] DEFAULT ((0)) NOT NULL,
    [taxable_non_classified]        NUMERIC (14)    CONSTRAINT [CDF_property_reet_assoc_taxable_non_classified] DEFAULT ((0)) NOT NULL,
    [dor_use_cd]                    VARCHAR (10)    NULL,
    [seq_num]                       INT             CONSTRAINT [CDF_property_reet_assoc_seq_num] DEFAULT ((0)) NOT NULL,
    [tax_area_id]                   INT             NULL,
    CONSTRAINT [CPK_property_reet_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [reet_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_reet_assoc_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id]),
    CONSTRAINT [CFK_property_reet_assoc_urban_growth_cd] FOREIGN KEY ([urban_growth_cd]) REFERENCES [dbo].[urban_growth_code] ([urban_growth_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Dept of Revenue Use Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_reet_assoc', @level2type = N'COLUMN', @level2name = N'dor_use_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'seq_num', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_reet_assoc', @level2type = N'COLUMN', @level2name = N'seq_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'stored tax_area_id of property associated to the reet', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_reet_assoc', @level2type = N'COLUMN', @level2name = N'tax_area_id';


GO

