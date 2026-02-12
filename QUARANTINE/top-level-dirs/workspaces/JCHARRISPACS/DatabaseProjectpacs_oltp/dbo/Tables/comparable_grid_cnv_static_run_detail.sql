CREATE TABLE [dbo].[comparable_grid_cnv_static_run_detail] (
    [lCnvStaticRunID]   INT NOT NULL,
    [lSourcePropGridID] INT NOT NULL,
    [lNewPropGridID]    INT NOT NULL,
    [lErrorCount]       INT NOT NULL,
    CONSTRAINT [CPK_comparable_grid_cnv_static_run_detail] PRIMARY KEY CLUSTERED ([lCnvStaticRunID] ASC, [lSourcePropGridID] ASC) WITH (FILLFACTOR = 100)
);


GO

