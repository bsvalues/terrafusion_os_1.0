CREATE TABLE [dbo].[property_exemption_income] (
    [exmpt_tax_yr]   NUMERIC (4)    NOT NULL,
    [owner_tax_yr]   NUMERIC (4)    NOT NULL,
    [sup_num]        INT            NOT NULL,
    [prop_id]        INT            NOT NULL,
    [owner_id]       INT            NOT NULL,
    [exmpt_type_cd]  VARCHAR (10)   NOT NULL,
    [inc_id]         INT            NOT NULL,
    [active]         BIT            DEFAULT ((0)) NOT NULL,
    [income_year]    NUMERIC (4)    NOT NULL,
    [created_date]   DATETIME       NOT NULL,
    [created_by_id]  INT            NOT NULL,
    [tax_return]     BIT            DEFAULT ((0)) NOT NULL,
    [deny_exemption] BIT            DEFAULT ((0)) NOT NULL,
    [comment]        VARCHAR (5000) NULL,
    CONSTRAINT [CPK_property_exemption_income] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC, [inc_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CCK_property_exemption_income_exmpt_type_cd] CHECK ([exmpt_type_cd]='SNR/DSBL'),
    CONSTRAINT [CFK_property_exemption_income_property_exemption] FOREIGN KEY ([exmpt_tax_yr], [owner_tax_yr], [sup_num], [prop_id], [owner_id], [exmpt_type_cd]) REFERENCES [dbo].[property_exemption] ([exmpt_tax_yr], [owner_tax_yr], [sup_num], [prop_id], [owner_id], [exmpt_type_cd])
);


GO

