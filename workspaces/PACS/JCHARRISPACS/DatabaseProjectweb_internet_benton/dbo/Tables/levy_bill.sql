CREATE TABLE [dbo].[levy_bill] (
    [bill_id]         INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [year]            NUMERIC (4)  NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [taxable_val]     NUMERIC (14) NULL,
    [tax_area_id]     INT          NULL,
    CONSTRAINT [CPK_levy_bill] PRIMARY KEY CLUSTERED ([bill_id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_levy_bill_tax_area_id]
    ON [dbo].[levy_bill]([tax_area_id] ASC);


GO

