CREATE TABLE [dbo].[appr_notice_selection_criteria_omit_entity] (
    [notice_yr]  NUMERIC (4) NOT NULL,
    [notice_num] INT         NOT NULL,
    [entity_id]  INT         NOT NULL,
    CONSTRAINT [CPK_appr_notice_selection_criteria_omit_entity] PRIMARY KEY CLUSTERED ([notice_yr] ASC, [notice_num] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO

