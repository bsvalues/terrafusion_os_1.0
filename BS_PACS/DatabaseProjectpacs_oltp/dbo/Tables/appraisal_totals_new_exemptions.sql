CREATE TABLE [dbo].[appraisal_totals_new_exemptions] (
    [entity_id]              INT          NOT NULL,
    [prop_val_yr]            INT          NOT NULL,
    [pacs_user_id]           INT          NOT NULL,
    [date_time]              DATETIME     NOT NULL,
    [exmpt_type_cd]          VARCHAR (10) NOT NULL,
    [prop_count]             NUMERIC (10) NULL,
    [last_year_absolute_mkt] NUMERIC (18) NULL,
    [this_year_exmpt_amt]    NUMERIC (18) NULL,
    [value_loss]             NUMERIC (18) NULL,
    [tnt_export_id]          INT          NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_new_exemptions] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [tnt_export_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

