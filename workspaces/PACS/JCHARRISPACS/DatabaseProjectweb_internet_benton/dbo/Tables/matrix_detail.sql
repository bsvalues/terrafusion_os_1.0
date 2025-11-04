CREATE TABLE [dbo].[matrix_detail] (
    [matrix_id]    INT             NOT NULL,
    [matrix_yr]    NUMERIC (4)     NOT NULL,
    [axis_1_value] VARCHAR (75)    NOT NULL,
    [axis_2_value] VARCHAR (75)    NOT NULL,
    [cell_value]   NUMERIC (16, 2) NOT NULL,
    CONSTRAINT [CPK_matrix_detail] PRIMARY KEY CLUSTERED ([matrix_id] ASC, [matrix_yr] ASC, [axis_1_value] ASC, [axis_2_value] ASC) WITH (FILLFACTOR = 90)
);


GO

