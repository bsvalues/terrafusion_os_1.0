CREATE TABLE [dbo].[_arb_rpt_inquiry_report] (
    [pacs_user_id]                INT          NOT NULL,
    [file_as_name]                VARCHAR (70) NULL,
    [appraised_val]               NUMERIC (14) NULL,
    [prop_id]                     INT          NOT NULL,
    [prop_val_yr]                 NUMERIC (4)  NOT NULL,
    [case_id]                     INT          NOT NULL,
    [inq_type]                    VARCHAR (10) NULL,
    [inq_status]                  VARCHAR (10) NULL,
    [appraiser_meeting_date_time] DATETIME     NULL,
    [geo_id]                      VARCHAR (50) NULL,
    [appraiser_nm]                VARCHAR (40) NULL,
    [meeting_appraiser_nm]        VARCHAR (40) NULL,
    [property_use_cd]             VARCHAR (10) NULL,
    [owner_id]                    INT          NOT NULL,
    CONSTRAINT [CPK__arb_rpt_inquiry_report] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC, [owner_id] ASC) WITH (FILLFACTOR = 100)
);


GO

