CREATE TABLE [dbo].[sup_group_exemption_info] (
    [sup_group_id]  INT          NOT NULL,
    [sup_yr]        NUMERIC (4)  NOT NULL,
    [sup_num]       INT          NOT NULL,
    [data_flag]     BIT          NOT NULL,
    [prop_id]       INT          NOT NULL,
    [exemption_id]  INT          IDENTITY (1, 1) NOT NULL,
    [exmpt_type_cd] VARCHAR (10) NOT NULL,
    [exemption]     VARCHAR (20) NOT NULL,
    [pacs_user_id]  INT          NOT NULL,
    CONSTRAINT [CPK_sup_group_exemption_info] PRIMARY KEY CLUSTERED ([sup_group_id] ASC, [sup_yr] ASC, [sup_num] ASC, [data_flag] ASC, [prop_id] ASC, [exemption_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_sup_group_exemption_info_sup_group_id_sup_yr_sup_num_data_flag_prop_id] FOREIGN KEY ([sup_group_id], [sup_yr], [sup_num], [data_flag], [prop_id]) REFERENCES [dbo].[sup_group_property_info] ([sup_group_id], [sup_yr], [sup_num], [data_flag], [prop_id])
);


GO

