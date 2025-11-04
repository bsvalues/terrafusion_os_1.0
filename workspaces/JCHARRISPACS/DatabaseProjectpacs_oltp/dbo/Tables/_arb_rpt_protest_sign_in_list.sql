CREATE TABLE [dbo].[_arb_rpt_protest_sign_in_list] (
    [pacs_user_id]         INT           NOT NULL,
    [owner_name]           VARCHAR (70)  NULL,
    [agent_name]           VARCHAR (70)  NULL,
    [prot_type]            VARCHAR (10)  NULL,
    [prop_id]              INT           NOT NULL,
    [legal_desc]           VARCHAR (255) NULL,
    [prop_val_yr]          NUMERIC (4)   NOT NULL,
    [case_id]              INT           NOT NULL,
    [docket_start_year]    INT           NULL,
    [docket_start_month]   INT           NULL,
    [docket_start_day]     INT           NULL,
    [docket_start_hour]    INT           NULL,
    [docket_start_minute]  INT           NULL,
    [prot_assigned_panel]  VARCHAR (10)  NULL,
    [meeting_appraiser_nm] VARCHAR (40)  NULL,
    [property_use_cd]      VARCHAR (10)  NULL
);


GO

CREATE CLUSTERED INDEX [idx_pacs_user_id_prop_id_prop_val_yr_case_id]
    ON [dbo].[_arb_rpt_protest_sign_in_list]([pacs_user_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC) WITH (FILLFACTOR = 90);


GO

