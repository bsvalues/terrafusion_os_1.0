CREATE TABLE [dbo].[land_sched_matrix_assoc] (
    [ls_id]        INT            NOT NULL,
    [ls_year]      NUMERIC (4)    NOT NULL,
    [matrix_id]    INT            NOT NULL,
    [matrix_order] INT            NOT NULL,
    [adj_factor]   NUMERIC (7, 4) NULL,
    CONSTRAINT [CPK_land_sched_matrix_assoc] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [matrix_id] ASC, [matrix_order] ASC) WITH (FILLFACTOR = 90)
);


GO

