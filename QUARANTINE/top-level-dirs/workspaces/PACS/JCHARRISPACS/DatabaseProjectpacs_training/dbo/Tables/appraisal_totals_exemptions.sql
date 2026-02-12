CREATE TABLE [dbo].[appraisal_totals_exemptions] (
    [entity_id]        INT          NOT NULL,
    [prop_val_yr]      NUMERIC (4)  NOT NULL,
    [pacs_user_id]     INT          NOT NULL,
    [arb_status]       VARCHAR (1)  NOT NULL,
    [date_time]        DATETIME     NULL,
    [exempt_type_cd]   VARCHAR (10) NOT NULL,
    [exempt_count]     NUMERIC (14) NULL,
    [exempt_local_amt] NUMERIC (14) NULL,
    [exempt_state_amt] NUMERIC (14) NULL,
    [tnt_export_id]    INT          NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_exemptions] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [arb_status] ASC, [tnt_export_id] ASC, [exempt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

