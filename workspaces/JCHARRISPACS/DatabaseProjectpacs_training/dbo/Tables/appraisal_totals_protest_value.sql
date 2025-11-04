CREATE TABLE [dbo].[appraisal_totals_protest_value] (
    [entity_id]     INT          NOT NULL,
    [prop_val_yr]   INT          NOT NULL,
    [pacs_user_id]  INT          NOT NULL,
    [date_time]     DATETIME     NOT NULL,
    [prop_count]    INT          NULL,
    [market]        NUMERIC (14) NULL,
    [protest_value] NUMERIC (14) NULL,
    [tnt_export_id] INT          NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_protest_value] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [prop_val_yr] ASC, [tnt_export_id] ASC) WITH (FILLFACTOR = 90)
);


GO

