CREATE TABLE [dbo].[sales_ratio_rpt_criteria] (
    [report_id]       INT             NOT NULL,
    [search_field_id] INT             NOT NULL,
    [range_start]     NUMERIC (18, 4) NOT NULL,
    [range_end]       NUMERIC (18, 4) NOT NULL,
    [text_criteria]   VARCHAR (4096)  NOT NULL,
    CONSTRAINT [CPK_sales_ratio_rpt_criteria] PRIMARY KEY CLUSTERED ([report_id] ASC, [search_field_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sales_ratio_rpt_criteria_report_id] FOREIGN KEY ([report_id]) REFERENCES [dbo].[sales_ratio_rpt] ([report_id]) ON DELETE CASCADE
);


GO

