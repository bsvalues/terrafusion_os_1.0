CREATE TABLE [dbo].[appraisal_totals_new_value] (
    [entity_id]         INT          NOT NULL,
    [prop_val_yr]       INT          NOT NULL,
    [pacs_user_id]      INT          NOT NULL,
    [date_time]         DATETIME     NOT NULL,
    [state_cd]          CHAR (5)     NOT NULL,
    [prop_count]        NUMERIC (18) NULL,
    [new_taxable_value] NUMERIC (18) NULL,
    [new_market_value]  NUMERIC (18) NULL,
    [tnt_export_id]     INT          NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_new_value] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [tnt_export_id] ASC, [state_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

