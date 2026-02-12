CREATE TABLE [dbo].[property_assessment_attribute_val] (
    [prop_val_yr]        NUMERIC (4)     NOT NULL,
    [sup_num]            INT             NOT NULL,
    [prop_id]            INT             NOT NULL,
    [assessment_use_cd]  VARCHAR (10)    NULL,
    [impervious_surface] NUMERIC (18, 4) NULL,
    [benefit_acres]      NUMERIC (18, 4) NULL,
    [multi_family_units] INT             NULL,
    CONSTRAINT [CPK_property_assessment_attribute_val] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_property_assessment_attribute_val_assessment_use_cd] FOREIGN KEY ([assessment_use_cd]) REFERENCES [dbo].[assessment_use_category] ([assessment_use_cd]),
    CONSTRAINT [CFK_property_assessment_attribute_val_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

