CREATE TABLE [dbo].[tax_area_fund_assoc] (
    [year]            NUMERIC (4)  NOT NULL,
    [tax_district_id] INT          NOT NULL,
    [levy_cd]         VARCHAR (10) NOT NULL,
    [fund_id]         INT          NOT NULL,
    [tax_area_id]     INT          NOT NULL,
    CONSTRAINT [CPK_tax_area_fund_assoc] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [fund_id] ASC, [tax_area_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_tax_area_fund_assoc_tax_area_id] FOREIGN KEY ([tax_area_id]) REFERENCES [dbo].[tax_area] ([tax_area_id]),
    CONSTRAINT [CFK_tax_area_fund_assoc_year_tax_district_id_levy_cd_fund_id] FOREIGN KEY ([year], [tax_district_id], [levy_cd], [fund_id]) REFERENCES [dbo].[fund] ([year], [tax_district_id], [levy_cd], [fund_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_year_tax_area_id]
    ON [dbo].[tax_area_fund_assoc]([year] ASC, [tax_area_id] ASC) WITH (FILLFACTOR = 100);


GO

