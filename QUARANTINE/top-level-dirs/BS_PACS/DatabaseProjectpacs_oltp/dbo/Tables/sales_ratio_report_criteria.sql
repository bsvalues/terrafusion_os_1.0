CREATE TABLE [dbo].[sales_ratio_report_criteria] (
    [dataset_id] INT            NOT NULL,
    [line_order] INT            NOT NULL,
    [criteria]   VARCHAR (4160) NULL,
    CONSTRAINT [CPK_sales_ratio_report_criteria] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [line_order] ASC) WITH (FILLFACTOR = 100)
);


GO

