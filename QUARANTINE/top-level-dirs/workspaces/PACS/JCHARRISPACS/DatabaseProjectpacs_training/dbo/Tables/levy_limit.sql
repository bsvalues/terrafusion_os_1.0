CREATE TABLE [dbo].[levy_limit] (
    [year]               NUMERIC (4)  NOT NULL,
    [tax_district_id]    INT          NOT NULL,
    [levy_cd]            VARCHAR (10) NOT NULL,
    [levy_limit_type_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_levy_limit] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [levy_limit_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_levy_limit_levy_limit_type_cd] FOREIGN KEY ([levy_limit_type_cd]) REFERENCES [dbo].[levy_limit_type] ([levy_limit_type_cd]) ON DELETE CASCADE,
    CONSTRAINT [CFK_levy_limit_year_tax_district_id_levy_cd] FOREIGN KEY ([year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd]) ON DELETE CASCADE
);


GO

