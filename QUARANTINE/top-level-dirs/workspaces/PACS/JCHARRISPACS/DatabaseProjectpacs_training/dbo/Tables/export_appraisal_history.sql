CREATE TABLE [dbo].[export_appraisal_history] (
    [export_id]       INT           NOT NULL,
    [run_date_time]   DATETIME      NULL,
    [file_desc]       VARCHAR (40)  NULL,
    [appraisal_year]  INT           NULL,
    [sup_num]         INT           NULL,
    [entity_cd]       VARCHAR (23)  NULL,
    [entity_desc]     VARCHAR (512) NULL,
    [office_name]     VARCHAR (50)  NULL,
    [operator]        VARCHAR (20)  NULL,
    [pacs_version]    VARCHAR (20)  NULL,
    [script_name]     VARCHAR (50)  NULL,
    [office_use_only] VARCHAR (50)  NULL,
    [expiration_dt]   DATETIME      NULL,
    [deleted]         BIT           NULL,
    [rdo_option]      INT           NULL,
    [value_option]    VARCHAR (25)  NULL,
    [sup_group_id]    INT           NULL,
    [sup_tax_years]   VARCHAR (100) NULL,
    CONSTRAINT [CPK_export_appraisal_history] PRIMARY KEY CLUSTERED ([export_id] ASC) WITH (FILLFACTOR = 100)
);


GO

