CREATE TABLE [dbo].[property_income_characteristic_amount] (
    [year]            NUMERIC (4)  NOT NULL,
    [sup_num]         INT          NOT NULL,
    [prop_id]         INT          NOT NULL,
    [pic_id]          INT          NOT NULL,
    [code]            VARCHAR (20) NOT NULL,
    [quality]         VARCHAR (40) NOT NULL,
    [type]            INT          NOT NULL,
    [amenity_cd]      AS           (CONVERT([varchar](10),case when [type]=(4) then [code]  end,0)) PERSISTED,
    [misc_expense_cd] AS           (CONVERT([varchar](10),case when [type]=(2) then [code]  end,0)) PERSISTED,
    [misc_income_cd]  AS           (CONVERT([varchar](10),case when [type]=(1) then [code]  end,0)) PERSISTED,
    CONSTRAINT [CPK_property_income_characteristic_amount] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [pic_id] ASC, [code] ASC, [type] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_income_characteristic_amount_amenity_cd] FOREIGN KEY ([amenity_cd]) REFERENCES [dbo].[amenity_code] ([amenity_cd]),
    CONSTRAINT [CFK_property_income_characteristic_amount_misc_expense_cd] FOREIGN KEY ([misc_expense_cd]) REFERENCES [dbo].[misc_expense_code] ([misc_expense_cd]),
    CONSTRAINT [CFK_property_income_characteristic_amount_misc_income_cd] FOREIGN KEY ([misc_income_cd]) REFERENCES [dbo].[misc_income_code] ([misc_income_cd]),
    CONSTRAINT [CFK_property_income_characteristic_amount_year_sup_num_prop_id_pic_id] FOREIGN KEY ([year], [sup_num], [prop_id], [pic_id]) REFERENCES [dbo].[property_income_characteristic] ([year], [sup_num], [prop_id], [pic_id])
);


GO

