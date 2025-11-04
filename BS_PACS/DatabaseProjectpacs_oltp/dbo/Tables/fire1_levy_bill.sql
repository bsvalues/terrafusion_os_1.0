CREATE TABLE [dbo].[fire1_levy_bill] (
    [bill_id]         INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [year]            NUMERIC (4)  NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [taxable_val]     NUMERIC (14) NULL,
    [tax_area_id]     INT          NULL
);


GO

