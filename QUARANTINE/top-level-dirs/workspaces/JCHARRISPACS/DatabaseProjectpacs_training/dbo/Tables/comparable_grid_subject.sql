CREATE TABLE [dbo].[comparable_grid_subject] (
    [lPropGridID]             INT NOT NULL,
    [lSecondarySubjectPropID] INT NOT NULL,
    CONSTRAINT [CPK_comparable_grid_subject] PRIMARY KEY CLUSTERED ([lPropGridID] ASC, [lSecondarySubjectPropID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_comparable_grid_subject_lPropGridID] FOREIGN KEY ([lPropGridID]) REFERENCES [dbo].[comp_sales_property_grids] ([lPropGridID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [idx_lSecondarySubjectPropID]
    ON [dbo].[comparable_grid_subject]([lSecondarySubjectPropID] ASC) WITH (FILLFACTOR = 90);


GO

