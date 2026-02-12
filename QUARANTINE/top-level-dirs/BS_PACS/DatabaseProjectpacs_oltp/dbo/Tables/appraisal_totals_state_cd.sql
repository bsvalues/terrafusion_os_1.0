CREATE TABLE [dbo].[appraisal_totals_state_cd] (
    [entity_id]     INT             NOT NULL,
    [prop_val_yr]   NUMERIC (4)     NOT NULL,
    [pacs_user_id]  INT             NOT NULL,
    [date_time]     DATETIME        NULL,
    [state_cd]      CHAR (5)        NOT NULL,
    [state_cd_desc] VARCHAR (50)    NULL,
    [prop_ct]       INT             NULL,
    [market]        NUMERIC (14)    NULL,
    [acres]         NUMERIC (18, 4) NULL,
    [new_val]       NUMERIC (14)    NULL,
    [arb_status]    VARCHAR (1)     NOT NULL,
    [tnt_export_id] INT             NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_state_cd] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [arb_status] ASC, [tnt_export_id] ASC, [state_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

