CREATE TABLE [dbo].[dor_report_stratification] (
    [dataset_id]            INT          NOT NULL,
    [year]                  NUMERIC (4)  NOT NULL,
    [sup_num]               INT          NOT NULL,
    [prop_id]               INT          NOT NULL,
    [stratum_id]            INT          NOT NULL,
    [owner_name]            VARCHAR (70) NOT NULL,
    [addr_line1]            VARCHAR (60) NOT NULL,
    [addr_line2]            VARCHAR (60) NOT NULL,
    [addr_line3]            VARCHAR (60) NOT NULL,
    [addr_city]             VARCHAR (50) NOT NULL,
    [addr_state]            VARCHAR (50) NOT NULL,
    [addr_zip]              VARCHAR (5)  NOT NULL,
    [dor_land_use_code]     VARCHAR (10) NOT NULL,
    [assessed_value]        NUMERIC (14) NOT NULL,
    [dba_name]              VARCHAR (50) NOT NULL,
    [is_sample]             BIT          NOT NULL,
    [overall_flag]          BIT          NOT NULL,
    [senior_flag]           BIT          NOT NULL,
    [forestland_flag]       BIT          NOT NULL,
    [properties_under_flag] BIT          NOT NULL,
    [Row]                   INT          NULL,
    [senior_value]          NUMERIC (14) CONSTRAINT [CDF_dor_report_stratification_senior_value] DEFAULT ((0)) NOT NULL,
    [forestland_value]      NUMERIC (14) CONSTRAINT [CDF_dor_report_stratification_forestland_value] DEFAULT ((0)) NOT NULL,
    [prior_assessed_value]  NUMERIC (14) NULL,
    [geo_id]                VARCHAR (50) NULL,
    [is_ioll]               BIT          CONSTRAINT [CDF_dor_report_stratification_is_ioll] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_dor_report_stratification] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [year] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Senior classified value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_stratification', @level2type = N'COLUMN', @level2name = N'senior_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'GEO ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_stratification', @level2type = N'COLUMN', @level2name = N'geo_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Forest land value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_stratification', @level2type = N'COLUMN', @level2name = N'forestland_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True for IOLL properties', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_stratification', @level2type = N'COLUMN', @level2name = N'is_ioll';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Prior Year Assessed Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'dor_report_stratification', @level2type = N'COLUMN', @level2name = N'prior_assessed_value';


GO

