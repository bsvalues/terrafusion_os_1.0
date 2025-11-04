CREATE TABLE [dbo].[depreciation_detail] (
    [type_cd]         CHAR (10)      NOT NULL,
    [deprec_cd]       CHAR (10)      NOT NULL,
    [year]            NUMERIC (4)    NOT NULL,
    [prop_type_cd]    CHAR (5)       NOT NULL,
    [deprec_year_max] NUMERIC (3)    NOT NULL,
    [deprec_year_pct] DECIMAL (5, 2) NULL,
    CONSTRAINT [CPK_depreciation_detail] PRIMARY KEY CLUSTERED ([type_cd] ASC, [deprec_cd] ASC, [year] ASC, [prop_type_cd] ASC, [deprec_year_max] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_type_cd]
    ON [dbo].[depreciation_detail]([prop_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

