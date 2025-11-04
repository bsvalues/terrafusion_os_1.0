CREATE TABLE [dbo].[appr_notice_prop_list_exemption] (
    [notice_yr]     NUMERIC (4)  NOT NULL,
    [notice_num]    INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [owner_id]      INT          NOT NULL,
    [sup_num]       INT          NOT NULL,
    [sup_yr]        NUMERIC (4)  NOT NULL,
    [exmpt_type_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_appr_notice_prop_list_exemption] PRIMARY KEY CLUSTERED ([notice_yr] ASC, [notice_num] ASC, [prop_id] ASC, [sup_yr] ASC, [sup_num] ASC, [owner_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

