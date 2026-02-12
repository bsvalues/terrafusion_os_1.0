CREATE TABLE [dbo].[sales_ratio_report_params] (
    [report_name]                VARCHAR (100)  NOT NULL,
    [report_type]                VARCHAR (50)   NOT NULL,
    [pacs_user_id]               INT            NOT NULL,
    [sort1_desc]                 VARCHAR (100)  NULL,
    [sort1_summarize]            CHAR (1)       NULL,
    [sort2_desc]                 VARCHAR (100)  NULL,
    [sort2_summarize]            CHAR (1)       NULL,
    [sort3_desc]                 VARCHAR (100)  NULL,
    [sort3_summarize]            CHAR (1)       NULL,
    [sort4_desc]                 VARCHAR (100)  NULL,
    [sort4_summarize]            CHAR (1)       NULL,
    [include_0_sales]            CHAR (1)       NULL,
    [value_option]               CHAR (1)       NULL,
    [query]                      VARCHAR (4096) NULL,
    [include_suppressed]         CHAR (1)       NULL,
    [time_adj_month]             INT            NULL,
    [time_adj_year]              NUMERIC (4)    NULL,
    [time_adj_pct]               NUMERIC (5, 4) NULL,
    [appraisal_value_yr]         VARCHAR (4)    NULL,
    [date_from]                  DATETIME       NULL,
    [date_to]                    DATETIME       NULL,
    [totals_only]                BIT            NULL,
    [vacant_land_only]           BIT            NULL,
    [include_deleted_properties] CHAR (1)       NULL
);


GO

CREATE CLUSTERED INDEX [idx_pacs_user_id_report_name_report_type]
    ON [dbo].[sales_ratio_report_params]([pacs_user_id] ASC, [report_name] ASC, [report_type] ASC) WITH (FILLFACTOR = 100);


GO

