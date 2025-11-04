CREATE TABLE [dbo].[delq_roll_params] (
    [pacs_user_id]      INT           NOT NULL,
    [effective_dt]      DATETIME      NULL,
    [delq_year]         CHAR (1)      NULL,
    [month1]            VARCHAR (15)  NULL,
    [month2]            VARCHAR (15)  NULL,
    [month3]            VARCHAR (15)  NULL,
    [suppress_detail]   CHAR (1)      NULL,
    [report_entity]     VARCHAR (255) NULL,
    [report_codes]      VARCHAR (255) NULL,
    [report_year]       VARCHAR (255) NULL,
    [report_prop_types] VARCHAR (255) NULL,
    [report_geo_id]     VARCHAR (255) NULL,
    [report_date]       VARCHAR (255) NULL,
    CONSTRAINT [CPK_delq_roll_params] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO

