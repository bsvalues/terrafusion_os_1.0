CREATE TABLE [dbo].[appraisal_totals_criteria_entity] (
    [pacs_user_id]  INT NOT NULL,
    [entity_id]     INT NOT NULL,
    [tnt_export_id] INT CONSTRAINT [CDF_appraisal_totals_criteria_entity_tnt_export_id] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_criteria_entity] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [tnt_export_id] ASC) WITH (FILLFACTOR = 100)
);


GO

