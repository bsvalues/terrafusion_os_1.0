CREATE TABLE [dbo].[export_appraisal_header] (
    [run_date_time]   VARCHAR (16) NULL,
    [file_desc]       VARCHAR (40) NULL,
    [appraisal_year]  VARCHAR (4)  NULL,
    [sup_num]         VARCHAR (4)  NULL,
    [entitiy_cd]      VARCHAR (10) NULL,
    [entity_desc]     VARCHAR (40) NULL,
    [office_name]     VARCHAR (30) NULL,
    [operator]        VARCHAR (20) NULL,
    [pacs_version]    VARCHAR (10) NULL,
    [export_version]  VARCHAR (10) NULL,
    [value_option]    VARCHAR (10) NULL,
    [office_use_only] VARCHAR (50) NULL,
    [export_id]       INT          IDENTITY (1, 1) NOT NULL,
    [expiration_dt]   DATETIME     NULL,
    CONSTRAINT [CPK_export_appraisal_header] PRIMARY KEY CLUSTERED ([export_id] ASC) WITH (FILLFACTOR = 100)
);


GO

