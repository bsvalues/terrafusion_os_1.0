CREATE TABLE [dbo].[matrix_axis_land_characteristic] (
    [matrix_yr]         NUMERIC (4)  NOT NULL,
    [axis_cd]           VARCHAR (20) NOT NULL,
    [matrix_type]       VARCHAR (20) NOT NULL,
    [characteristic_cd] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_matrix_axis_land_characteristic] PRIMARY KEY CLUSTERED ([matrix_yr] ASC, [axis_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

