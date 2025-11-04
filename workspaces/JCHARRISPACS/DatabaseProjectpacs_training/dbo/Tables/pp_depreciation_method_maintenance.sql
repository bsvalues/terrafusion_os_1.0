CREATE TABLE [dbo].[pp_depreciation_method_maintenance] (
    [prop_val_yr]   NUMERIC (4)  NOT NULL,
    [pp_type_cd]    CHAR (10)    NOT NULL,
    [sic_cd]        VARCHAR (10) NOT NULL,
    [dep_type_cd]   CHAR (10)    NOT NULL,
    [dep_deprec_cd] CHAR (10)    NOT NULL,
    CONSTRAINT [CPK_pp_depreciation_method_maintenance] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [pp_type_cd] ASC, [sic_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_pp_depreciation_method_maintenance_pp_type_cd] FOREIGN KEY ([pp_type_cd]) REFERENCES [dbo].[pp_type] ([pp_type_cd]),
    CONSTRAINT [CFK_pp_depreciation_method_maintenance_sic_cd] FOREIGN KEY ([sic_cd]) REFERENCES [dbo].[sic_code] ([sic_cd])
);


GO

