CREATE TABLE [dbo].[income_unit_type_code] (
    [unit_type_cd]          VARCHAR (10) NOT NULL,
    [unit_type_desc]        VARCHAR (30) NOT NULL,
    [include_in_total_unit] BIT          NULL,
    [multifamily]           BIT          NULL,
    [inactive]              BIT          NOT NULL,
    CONSTRAINT [CPK_income_unit_type_code] PRIMARY KEY CLUSTERED ([unit_type_cd] ASC)
);


GO

