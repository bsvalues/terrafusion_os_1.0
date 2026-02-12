CREATE TABLE [dbo].[cms_depreciation_type] (
    [year]                          NUMERIC (4)  NOT NULL,
    [code]                          CHAR (1)     NOT NULL,
    [name]                          VARCHAR (50) NULL,
    [physical_enabled]              BIT          NOT NULL,
    [functional_enabled]            BIT          NOT NULL,
    [typical_life_enabled]          BIT          NOT NULL,
    [physical_functional_enabled]   BIT          NOT NULL,
    [additional_functional_enabled] BIT          NOT NULL,
    [external_enabled]              BIT          NOT NULL,
    CONSTRAINT [CPK_cms_depreciation_type] PRIMARY KEY CLUSTERED ([year] ASC, [code] ASC)
);


GO

