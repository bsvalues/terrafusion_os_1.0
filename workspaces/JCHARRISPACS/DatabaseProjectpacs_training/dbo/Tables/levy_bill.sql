CREATE TABLE [dbo].[levy_bill] (
    [bill_id]         INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [year]            NUMERIC (4)  NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [taxable_val]     NUMERIC (14) NULL,
    [tax_area_id]     INT          NULL,
    CONSTRAINT [CPK_levy_bill] PRIMARY KEY CLUSTERED ([bill_id] ASC),
    CONSTRAINT [CFK_levy_bill_bill_id] FOREIGN KEY ([bill_id]) REFERENCES [dbo].[bill] ([bill_id]),
    CONSTRAINT [CFK_levy_bill_year_tax_district_id_levy_cd] FOREIGN KEY ([year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_levy_bill_tax_area_id]
    ON [dbo].[levy_bill]([tax_area_id] ASC);


GO

