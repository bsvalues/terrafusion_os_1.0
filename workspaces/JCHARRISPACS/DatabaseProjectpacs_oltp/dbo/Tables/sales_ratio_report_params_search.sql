CREATE TABLE [dbo].[sales_ratio_report_params_search] (
    [report_name]  VARCHAR (100) NOT NULL,
    [report_type]  CHAR (3)      NOT NULL,
    [pacs_user_id] INT           NOT NULL,
    [page_number]  INT           NULL,
    [group_type]   VARCHAR (50)  NOT NULL,
    [input_data]   VARCHAR (20)  NULL,
    [input_order]  INT           NULL,
    [lKey]         INT           IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_sales_ratio_report_params_search] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO

