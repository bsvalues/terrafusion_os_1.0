CREATE TABLE [dbo].[appraisal_totals_transfers] (
    [entity_id]            INT          NOT NULL,
    [prop_val_yr]          NUMERIC (4)  NOT NULL,
    [pacs_user_id]         INT          NOT NULL,
    [arb_status]           VARCHAR (1)  NOT NULL,
    [date_time]            DATETIME     NULL,
    [exmpt_type_cd]        VARCHAR (10) NOT NULL,
    [transfer_totals]      NUMERIC (14) NULL,
    [transfer_assessed]    NUMERIC (14) NULL,
    [transfer_taxable]     NUMERIC (14) NULL,
    [post_percent_taxable] NUMERIC (14) NULL,
    [transfer_adjustment]  NUMERIC (14) NULL,
    [tnt_export_id]        INT          NOT NULL,
    [transfer_count]       NUMERIC (14) NULL,
    CONSTRAINT [CPK_appraisal_totals_transfers] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [arb_status] ASC, [tnt_export_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

