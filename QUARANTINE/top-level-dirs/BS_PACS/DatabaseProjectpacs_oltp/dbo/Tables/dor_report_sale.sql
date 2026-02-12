CREATE TABLE [dbo].[dor_report_sale] (
    [dataset_id]                INT             NOT NULL,
    [chg_of_owner_id]           INT             NOT NULL,
    [stratum_id]                INT             NOT NULL,
    [reet_number]               INT             NOT NULL,
    [sale_date]                 DATETIME        NULL,
    [sale_price]                NUMERIC (14)    NOT NULL,
    [adjusted_sale_price]       NUMERIC (14)    NOT NULL,
    [dor_land_use_code]         VARCHAR (10)    NOT NULL,
    [assessed_value]            NUMERIC (14)    NOT NULL,
    [taxable_value]             NUMERIC (14)    NOT NULL,
    [sale_ratio]                NUMERIC (14, 6) NOT NULL,
    [senior_flag]               BIT             NOT NULL,
    [forestland_flag]           BIT             NOT NULL,
    [timberland_flag]           BIT             NOT NULL,
    [dor_use_singlefamily_flag] BIT             NOT NULL,
    [dor_use_other_flag]        BIT             NOT NULL,
    [is_sample]                 BIT             NOT NULL,
    [invalid_sales_code]        VARCHAR (5)     NULL,
    [invalid_reason]            VARCHAR (100)   NULL,
    [dor_use_commercial_flag]   BIT             CONSTRAINT [CDF_dor_report_sale_dor_use_commercial_flag] DEFAULT ((0)) NULL,
    [year]                      NUMERIC (4)     NULL,
    [prop_type_cd]              CHAR (5)        NULL,
    CONSTRAINT [CPK_dor_report_sale] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [chg_of_owner_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Commercial, manufacturing, or multifamily', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_sale', @level2type = N'COLUMN', @level2name = N'dor_use_commercial_flag';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'stratum year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_sale', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property type of the main property of the sale', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_sale', @level2type = N'COLUMN', @level2name = N'prop_type_cd';


GO

