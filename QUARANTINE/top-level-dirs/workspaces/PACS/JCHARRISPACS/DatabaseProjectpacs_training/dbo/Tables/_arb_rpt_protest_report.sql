CREATE TABLE [dbo].[_arb_rpt_protest_report] (
    [pacs_user_id]                INT            NOT NULL,
    [file_as_name]                VARCHAR (70)   NULL,
    [appraised_val]               NUMERIC (14)   NULL,
    [prop_id]                     INT            NOT NULL,
    [prop_val_yr]                 NUMERIC (4)    NOT NULL,
    [case_id]                     INT            NOT NULL,
    [prot_type]                   VARCHAR (10)   NULL,
    [prot_status]                 VARCHAR (10)   NULL,
    [prot_assigned_panel]         VARCHAR (10)   NULL,
    [appraiser_meeting_date_time] DATETIME       NULL,
    [docket_start_date_time]      DATETIME       NULL,
    [geo_id]                      VARCHAR (50)   NULL,
    [appraiser_nm]                VARCHAR (40)   NULL,
    [meeting_appraiser_nm]        VARCHAR (40)   NULL,
    [owner_id]                    INT            NOT NULL,
    [sup_num]                     INT            NOT NULL,
    [property_use_cd]             VARCHAR (10)   NULL,
    [agent_list]                  VARCHAR (2048) NULL,
    CONSTRAINT [CPK__arb_rpt_protest_report] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [owner_id] ASC, [case_id] ASC) WITH (FILLFACTOR = 100)
);


GO

