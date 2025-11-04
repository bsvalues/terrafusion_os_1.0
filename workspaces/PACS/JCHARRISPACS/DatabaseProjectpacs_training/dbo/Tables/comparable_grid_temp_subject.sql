CREATE TABLE [dbo].[comparable_grid_temp_subject] (
    [lTempPropGridID]         INT NOT NULL,
    [lSecondarySubjectPropID] INT NOT NULL,
    CONSTRAINT [CPK_comparable_grid_temp_subject] PRIMARY KEY CLUSTERED ([lTempPropGridID] ASC, [lSecondarySubjectPropID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_comparable_grid_temp_subject_lTempPropGridID] FOREIGN KEY ([lTempPropGridID]) REFERENCES [dbo].[comp_sales_temp_property_grids] ([lTempPropGridID]) ON DELETE CASCADE
);


GO

