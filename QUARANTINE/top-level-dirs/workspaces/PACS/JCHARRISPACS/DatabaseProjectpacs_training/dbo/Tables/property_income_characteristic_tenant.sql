CREATE TABLE [dbo].[property_income_characteristic_tenant] (
    [year]                    NUMERIC (4)     NOT NULL,
    [sup_num]                 INT             NOT NULL,
    [prop_id]                 INT             NOT NULL,
    [pic_id]                  INT             NOT NULL,
    [tenant_id]               INT             NOT NULL,
    [tenant_name]             VARCHAR (25)    NULL,
    [lease_begin_date]        DATETIME        NULL,
    [lease_end_date]          DATETIME        NULL,
    [sqft_occupancy]          NUMERIC (12, 2) NULL,
    [base_rent_per_month]     NUMERIC (10, 2) NULL,
    [base_rent_per_year]      NUMERIC (10, 2) NULL,
    [indicated_rent_per_sqft] NUMERIC (8, 2)  NULL,
    [monthly_cam_per_sqft]    NUMERIC (6, 2)  NULL,
    [water_sewer]             BIT             NOT NULL,
    [garbage]                 BIT             NOT NULL,
    [electricity]             BIT             NOT NULL,
    [heat]                    BIT             NOT NULL,
    [gas]                     BIT             NOT NULL,
    [real_estate_taxes]       BIT             NOT NULL,
    [fire_insurance]          BIT             NOT NULL,
    [other]                   VARCHAR (50)    NULL,
    [prop_type_cd]            VARCHAR (10)    NULL,
    [include_in_analysis]     BIT             CONSTRAINT [CDF_property_income_characteristic_tenant_include_in_analysis] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_property_income_characteristic_tenant] PRIMARY KEY CLUSTERED ([year] ASC, [sup_num] ASC, [prop_id] ASC, [pic_id] ASC, [tenant_id] ASC) WITH (FILLFACTOR = 90)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Allow Tenant Information to be Included in Analysis', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_income_characteristic_tenant', @level2type = N'COLUMN', @level2name = N'include_in_analysis';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Tenant Information Property Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_income_characteristic_tenant', @level2type = N'COLUMN', @level2name = N'prop_type_cd';


GO

