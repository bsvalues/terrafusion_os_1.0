CREATE TABLE [dbo].[appraisal_totals_new_annex] (
    [entity_id]     INT          NOT NULL,
    [prop_val_yr]   INT          NOT NULL,
    [pacs_user_id]  INT          NOT NULL,
    [date_time]     DATETIME     NOT NULL,
    [prop_count]    NUMERIC (18) NULL,
    [taxable_value] NUMERIC (18) NULL,
    [market_value]  NUMERIC (18) NULL,
    [tnt_export_id] INT          NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_new_annex] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [tnt_export_id] ASC) WITH (FILLFACTOR = 100)
);


GO

