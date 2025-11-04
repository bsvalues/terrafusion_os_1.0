CREATE TABLE [dbo].[__property_exemption_dor_detail_sams_20230224] (
    [exmpt_tax_yr]  NUMERIC (4)    NOT NULL,
    [owner_tax_yr]  NUMERIC (4)    NOT NULL,
    [sup_num]       INT            NOT NULL,
    [prop_id]       INT            NOT NULL,
    [owner_id]      INT            NOT NULL,
    [exmpt_type_cd] VARCHAR (10)   NOT NULL,
    [item_type]     CHAR (1)       NOT NULL,
    [item_id]       INT            NOT NULL,
    [value_type]    CHAR (1)       NOT NULL,
    [exmpt_amount]  NUMERIC (12)   NULL,
    [exmpt_percent] NUMERIC (9, 6) NULL
);


GO

