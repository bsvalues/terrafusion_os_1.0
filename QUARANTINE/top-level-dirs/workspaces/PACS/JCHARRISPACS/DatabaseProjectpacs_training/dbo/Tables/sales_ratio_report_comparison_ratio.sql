CREATE TABLE [dbo].[sales_ratio_report_comparison_ratio] (
    [dataset_id]                 INT             NOT NULL,
    [initial_reciprocal]         NUMERIC (14, 5) NOT NULL,
    [comparison_reciprocal]      NUMERIC (14, 5) NOT NULL,
    [number_of_months]           INT             NOT NULL,
    [indicated_annual_time_adj]  NUMERIC (14, 4) NOT NULL,
    [indicated_monthly_time_adj] NUMERIC (14, 4) NOT NULL,
    CONSTRAINT [CPK_sales_ratio_report_comparison_ratio] PRIMARY KEY CLUSTERED ([dataset_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains the comparison sale ratio report data', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'sales_ratio_report_comparison_ratio';


GO

