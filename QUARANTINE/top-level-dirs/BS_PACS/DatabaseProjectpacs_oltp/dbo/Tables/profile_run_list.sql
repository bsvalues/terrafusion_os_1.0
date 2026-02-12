CREATE TABLE [dbo].[profile_run_list] (
    [detail_id]          INT            IDENTITY (1, 1) NOT NULL,
    [run_id]             INT            NOT NULL,
    [pacs_user_id]       INT            NULL,
    [run_date]           DATETIME       NULL,
    [run_desc]           VARCHAR (500)  NULL,
    [run_type]           CHAR (5)       NULL,
    [prop_val_yr]        NUMERIC (4)    NULL,
    [hood_cd]            VARCHAR (10)   NULL,
    [region]             VARCHAR (10)   NULL,
    [subset]             VARCHAR (10)   NULL,
    [abs_subdv_cd]       VARCHAR (10)   NULL,
    [query]              VARCHAR (4096) NULL,
    [default_run]        CHAR (1)       NULL,
    [imprv_pct]          NUMERIC (5, 2) NULL,
    [land_pct]           NUMERIC (5, 2) NULL,
    [imprv_ct]           INT            NULL,
    [unimprv_ct]         INT            NULL,
    [build_query]        VARCHAR (4096) NULL,
    [code]               VARCHAR (10)   NULL,
    [code_type]          VARCHAR (5)    NULL,
    [code_desc]          VARCHAR (50)   NULL,
    [report_title]       VARCHAR (50)   NULL,
    [report_date_range]  VARCHAR (50)   NULL,
    [report_sale_type]   VARCHAR (250)  NULL,
    [report_school_code] VARCHAR (250)  NULL,
    [report_state_code]  VARCHAR (250)  NULL,
    [linked_to]          VARCHAR (10)   NULL,
    CONSTRAINT [CPK_profile_run_list] PRIMARY KEY CLUSTERED ([run_id] ASC, [detail_id] ASC) WITH (FILLFACTOR = 90)
);


GO

