CREATE TABLE [dbo].[_arb_rpt_panel_decisions] (
    [pacs_user_id]                   INT           NOT NULL,
    [owner_name]                     VARCHAR (70)  NULL,
    [agent_name]                     VARCHAR (70)  NULL,
    [prop_id]                        INT           NOT NULL,
    [geo_id]                         VARCHAR (50)  NULL,
    [legal_desc]                     VARCHAR (255) NULL,
    [prop_val_yr]                    NUMERIC (4)   NOT NULL,
    [case_id]                        INT           NOT NULL,
    [appraiser_nm]                   VARCHAR (40)  NULL,
    [situs]                          VARCHAR (83)  NULL,
    [first_decision]                 VARCHAR (50)  NULL,
    [second_decision]                VARCHAR (50)  NULL,
    [prot_second_motion_decision_dt] DATETIME      NULL,
    [prot_first_motion_decision_dt]  DATETIME      NULL,
    [prot_first_motion_decision_cd]  VARCHAR (10)  NULL,
    [prot_second_motion_decision_cd] VARCHAR (10)  NULL,
    [meeting_appraiser_nm]           VARCHAR (40)  NULL,
    [property_use_cd]                VARCHAR (10)  NULL,
    CONSTRAINT [CPK__arb_rpt_panel_decisions] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC) WITH (FILLFACTOR = 100)
);


GO

