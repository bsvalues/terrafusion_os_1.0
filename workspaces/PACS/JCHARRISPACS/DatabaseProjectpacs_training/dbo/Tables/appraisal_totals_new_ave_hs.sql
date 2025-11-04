CREATE TABLE [dbo].[appraisal_totals_new_ave_hs] (
    [entity_id]        INT          NOT NULL,
    [prop_val_yr]      INT          NOT NULL,
    [pacs_user_id]     INT          NOT NULL,
    [date_time]        DATETIME     NOT NULL,
    [hs_count]         INT          NULL,
    [ave_market]       NUMERIC (14) NULL,
    [ave_hs_exemption] NUMERIC (14) NULL,
    [ave_taxable]      NUMERIC (14) NULL,
    [tnt_export_id]    INT          NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_new_ave_hs] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [tnt_export_id] ASC) WITH (FILLFACTOR = 100)
);


GO

