CREATE TABLE [dbo].[wash_appraisal_notice_selection_criteria_code] (
    [notice_year]   NUMERIC (4)  NOT NULL,
    [notice_run_id] INT          NOT NULL,
    [type]          VARCHAR (5)  NOT NULL,
    [code]          VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_selection_criteria_code] PRIMARY KEY CLUSTERED ([notice_year] ASC, [notice_run_id] ASC, [type] ASC, [code] ASC),
    CONSTRAINT [CFK_wash_appraisal_notice_selection_criteria_code_notice_year_notice_run_id] FOREIGN KEY ([notice_year], [notice_run_id]) REFERENCES [dbo].[wash_appraisal_notice_selection_criteria] ([notice_year], [notice_run_id])
);


GO

