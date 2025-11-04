CREATE TABLE [dbo].[appraisal_totals_criteria_proptype] (
    [pacs_user_id]  INT      NOT NULL,
    [prop_type_cd]  CHAR (5) NOT NULL,
    [tnt_export_id] INT      CONSTRAINT [CDF_appraisal_totals_criteria_proptype_tnt_export_id] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_appraisal_totals_criteria_proptype] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [prop_type_cd] ASC, [tnt_export_id] ASC) WITH (FILLFACTOR = 100)
);


GO

