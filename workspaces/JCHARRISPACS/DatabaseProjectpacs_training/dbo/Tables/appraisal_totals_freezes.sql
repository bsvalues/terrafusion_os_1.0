CREATE TABLE [dbo].[appraisal_totals_freezes] (
    [entity_id]             INT             NOT NULL,
    [prop_val_yr]           NUMERIC (4)     NOT NULL,
    [pacs_user_id]          INT             NOT NULL,
    [arb_status]            VARCHAR (1)     NOT NULL,
    [date_time]             DATETIME        NULL,
    [exmpt_type_cd]         VARCHAR (10)    NOT NULL,
    [freeze_assessed]       NUMERIC (14)    NULL,
    [freeze_taxable]        NUMERIC (14)    NULL,
    [actual_tax]            NUMERIC (14, 2) NULL,
    [freeze_ceiling_count]  NUMERIC (14)    NULL,
    [freeze_ceiling_amount] NUMERIC (14, 2) NULL,
    [tnt_export_id]         INT             NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_freezes] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [arb_status] ASC, [tnt_export_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

