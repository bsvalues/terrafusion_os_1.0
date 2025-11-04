CREATE TABLE [dbo].[appr_notice_prop_list_group_code] (
    [notice_yr]        NUMERIC (4)  NOT NULL,
    [notice_num]       INT          NOT NULL,
    [prop_id]          INT          NOT NULL,
    [prop_group_cd]    VARCHAR (20) NOT NULL,
    [special_group_id] INT          NULL,
    CONSTRAINT [CPK_appr_notice_prop_list_group_code] PRIMARY KEY CLUSTERED ([notice_yr] ASC, [notice_num] ASC, [prop_id] ASC, [prop_group_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

