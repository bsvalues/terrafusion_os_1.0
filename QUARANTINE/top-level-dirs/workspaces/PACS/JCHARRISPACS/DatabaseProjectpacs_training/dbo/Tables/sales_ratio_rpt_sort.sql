CREATE TABLE [dbo].[sales_ratio_rpt_sort] (
    [report_id]       INT NOT NULL,
    [search_field_id] INT NOT NULL,
    [sort_order]      INT NOT NULL,
    [summarize]       BIT NOT NULL,
    CONSTRAINT [CPK_sales_ratio_rpt_sort] PRIMARY KEY CLUSTERED ([report_id] ASC, [search_field_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sales_ratio_rpt_sort_report_id] FOREIGN KEY ([report_id]) REFERENCES [dbo].[sales_ratio_rpt] ([report_id]) ON DELETE CASCADE,
    CONSTRAINT [CUQ_sales_ratio_rpt_sort_report_id_sort_order] UNIQUE NONCLUSTERED ([report_id] ASC, [sort_order] ASC) WITH (FILLFACTOR = 90)
);


GO

