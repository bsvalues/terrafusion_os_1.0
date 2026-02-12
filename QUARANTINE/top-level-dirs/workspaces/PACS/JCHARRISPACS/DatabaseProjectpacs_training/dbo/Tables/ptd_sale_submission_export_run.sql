CREATE TABLE [dbo].[ptd_sale_submission_export_run] (
    [export_run_id]   INT            IDENTITY (1, 1) NOT NULL,
    [pacs_user_id]    INT            NULL,
    [export_dt]       DATETIME       NULL,
    [state_codes]     VARCHAR (1024) NULL,
    [school_codes]    VARCHAR (1024) NULL,
    [date_option]     VARCHAR (1)    NULL,
    [date_begin]      DATETIME       NULL,
    [date_end]        DATETIME       NULL,
    [map_number]      VARCHAR (25)   NULL,
    [order_by]        VARCHAR (512)  NULL,
    [export_filename] VARCHAR (512)  NULL,
    [export_count]    INT            NULL,
    CONSTRAINT [CPK_ptd_sale_submission_export_run] PRIMARY KEY CLUSTERED ([export_run_id] ASC) WITH (FILLFACTOR = 100)
);


GO

