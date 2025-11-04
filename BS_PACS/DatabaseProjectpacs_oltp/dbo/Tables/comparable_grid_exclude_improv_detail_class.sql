CREATE TABLE [dbo].[comparable_grid_exclude_improv_detail_class] (
    [szClass] CHAR (10) NOT NULL,
    CONSTRAINT [CPK_comparable_grid_exclude_improv_detail_class] PRIMARY KEY CLUSTERED ([szClass] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comparable_grid_exclude_improv_detail_class_szClass] FOREIGN KEY ([szClass]) REFERENCES [dbo].[imprv_det_class] ([imprv_det_class_cd]) ON DELETE CASCADE
);


GO

