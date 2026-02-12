CREATE TABLE [dbo].[appr_notice_selection_criteria_group_codes] (
    [notice_yr]  NUMERIC (4)  NOT NULL,
    [notice_num] INT          NOT NULL,
    [group_cd]   VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_appr_notice_selection_criteria_group_codes] PRIMARY KEY CLUSTERED ([notice_yr] ASC, [notice_num] ASC, [group_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

