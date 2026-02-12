CREATE TABLE [dbo].[comparable_grid_include_improv_type] (
    [szImprovType] CHAR (5) NOT NULL,
    CONSTRAINT [CPK_comparable_grid_include_improv_type] PRIMARY KEY CLUSTERED ([szImprovType] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comparable_grid_include_improv_type_szImprovType] FOREIGN KEY ([szImprovType]) REFERENCES [dbo].[imprv_type] ([imprv_type_cd]) ON DELETE CASCADE
);


GO

