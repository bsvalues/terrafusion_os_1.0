CREATE TABLE [dbo].[appr_notice_prop_list_entity_exemption] (
    [notice_yr]     NUMERIC (4)  NOT NULL,
    [notice_num]    INT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [owner_id]      INT          NOT NULL,
    [sup_num]       INT          NOT NULL,
    [sup_yr]        NUMERIC (4)  NOT NULL,
    [exmpt_type_cd] VARCHAR (10) NOT NULL,
    [entity_id]     INT          NOT NULL,
    [state_amt]     NUMERIC (14) NULL,
    [local_amt]     NUMERIC (14) NULL,
    CONSTRAINT [CPK_appr_notice_prop_list_entity_exemption] PRIMARY KEY CLUSTERED ([notice_yr] ASC, [notice_num] ASC, [prop_id] ASC, [sup_yr] ASC, [sup_num] ASC, [owner_id] ASC, [entity_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_appr_notice_prop_list_entity_exemption_notice_yr_notice_num_prop_id_sup_yr_sup_num_owner_id_exmpt_type_cd] FOREIGN KEY ([notice_yr], [notice_num], [prop_id], [sup_yr], [sup_num], [owner_id], [exmpt_type_cd]) REFERENCES [dbo].[appr_notice_prop_list_exemption] ([notice_yr], [notice_num], [prop_id], [sup_yr], [sup_num], [owner_id], [exmpt_type_cd])
);


GO

