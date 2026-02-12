CREATE TABLE [dbo].[wash_appraisal_notice_prop_group_code] (
    [notice_year]   NUMERIC (4)  NOT NULL,
    [notice_run_id] INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [code]          VARCHAR (20) NOT NULL,
    [expiration_dt] DATETIME     NULL,
    [assessment_yr] NUMERIC (4)  NULL,
    [create_dt]     DATETIME     NULL,
    [create_id]     INT          NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_prop_group_code] PRIMARY KEY CLUSTERED ([notice_year] ASC, [notice_run_id] ASC, [prop_id] ASC, [code] ASC),
    CONSTRAINT [CFK_wash_appraisal_notice_prop_group_code_notice_year_notice_run_id] FOREIGN KEY ([notice_year], [notice_run_id]) REFERENCES [dbo].[wash_appraisal_notice_selection_criteria] ([notice_year], [notice_run_id])
);


GO

