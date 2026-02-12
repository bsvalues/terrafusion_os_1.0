CREATE TABLE [dbo].[matrix_axis] (
    [matrix_yr]    NUMERIC (4)   NOT NULL,
    [axis_cd]      VARCHAR (20)  NOT NULL,
    [data_type]    VARCHAR (20)  NULL,
    [lookup_query] VARCHAR (512) NULL,
    [matrix_type]  VARCHAR (20)  NOT NULL,
    CONSTRAINT [CPK_matrix_axis] PRIMARY KEY CLUSTERED ([matrix_yr] ASC, [axis_cd] ASC, [matrix_type] ASC) WITH (FILLFACTOR = 100)
);


GO

