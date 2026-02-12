CREATE TABLE [dbo].[property_exemption_income_detail] (
    [exmpt_tax_yr]  NUMERIC (4)     NOT NULL,
    [owner_tax_yr]  NUMERIC (4)     NOT NULL,
    [sup_num]       INT             NOT NULL,
    [prop_id]       INT             NOT NULL,
    [owner_id]      INT             NOT NULL,
    [exmpt_type_cd] VARCHAR (10)    NOT NULL,
    [inc_id]        INT             NOT NULL,
    [inc_detail_id] INT             NOT NULL,
    [id_flag]       BIT             DEFAULT ((0)) NOT NULL,
    [code]          VARCHAR (10)    NOT NULL,
    [amount]        NUMERIC (14, 2) DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_property_exemption_income_detail] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC, [inc_id] ASC, [inc_detail_id] ASC),
    CONSTRAINT [CCK_property_exemption_income_detail_exmpt_type_cd] CHECK ([exmpt_type_cd]='SNR/DSBL'),
    CONSTRAINT [CFK_property_exemption_income_detail_property_exemption_income] FOREIGN KEY ([exmpt_tax_yr], [owner_tax_yr], [sup_num], [prop_id], [owner_id], [exmpt_type_cd], [inc_id]) REFERENCES [dbo].[property_exemption_income] ([exmpt_tax_yr], [owner_tax_yr], [sup_num], [prop_id], [owner_id], [exmpt_type_cd], [inc_id]) ON DELETE CASCADE
);


GO

