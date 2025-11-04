CREATE TABLE [dbo].[sales_ratio_rpt] (
    [report_id]                       INT            NOT NULL,
    [report_name]                     VARCHAR (100)  NOT NULL,
    [pacs_user_id]                    INT            NOT NULL,
    [is_global]                       BIT            NOT NULL,
    [report_type]                     INT            NOT NULL,
    [print_pid_barcode]               BIT            NOT NULL,
    [property_type]                   INT            NOT NULL,
    [select_criteria_type]            INT            NOT NULL,
    [input_query]                     VARCHAR (4096) NOT NULL,
    [values_type]                     INT            NOT NULL,
    [values_year]                     NUMERIC (4)    NOT NULL,
    [include_sale_price_zero]         BIT            NOT NULL,
    [include_suppressed_sales]        BIT            NOT NULL,
    [include_only_vacant_land_sales]  BIT            NOT NULL,
    [totals_only]                     BIT            NOT NULL,
    [include_deleted_properties]      BIT            NOT NULL,
    [use_time_adj]                    BIT            NOT NULL,
    [time_adj_month]                  INT            NOT NULL,
    [time_adj_year]                   NUMERIC (4)    NOT NULL,
    [time_adj_pct]                    NUMERIC (5, 4) NULL,
    [use_comparison_sale_date_range]  BIT            CONSTRAINT [CDF_sales_ratio_rpt_use_comparison_sale_date_range] DEFAULT ((0)) NOT NULL,
    [comparison_sale_date_range_from] DATETIME       CONSTRAINT [CDF_sales_ratio_rpt_comparison_sale_date_range_from] DEFAULT (getdate()) NOT NULL,
    [comparison_sale_date_range_to]   DATETIME       CONSTRAINT [CDF_sales_ratio_rpt_comparison_sale_date_range_to] DEFAULT (getdate()) NOT NULL,
    [values_as_of_sup_num]            INT            CONSTRAINT [CDF_sales_ratio_rpt_values_as_of_sup_num] DEFAULT ((0)) NOT NULL,
    [values_appr_method]              VARCHAR (5)    CONSTRAINT [CDF_sales_ratio_rpt_values_appr_method] DEFAULT ('') NOT NULL,
    CONSTRAINT [CPK_sales_ratio_rpt] PRIMARY KEY CLUSTERED ([report_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Ending comparison sale date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sales_ratio_rpt', @level2type = N'COLUMN', @level2name = N'comparison_sale_date_range_to';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specific appraisal method of properties on the report', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sales_ratio_rpt', @level2type = N'COLUMN', @level2name = N'values_appr_method';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Beginning comparison sale date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sales_ratio_rpt', @level2type = N'COLUMN', @level2name = N'comparison_sale_date_range_from';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Values used on the report are as-of this supplement number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sales_ratio_rpt', @level2type = N'COLUMN', @level2name = N'values_as_of_sup_num';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Flag indicating if the comparison sale date sale ratio data is calculated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sales_ratio_rpt', @level2type = N'COLUMN', @level2name = N'use_comparison_sale_date_range';


GO

