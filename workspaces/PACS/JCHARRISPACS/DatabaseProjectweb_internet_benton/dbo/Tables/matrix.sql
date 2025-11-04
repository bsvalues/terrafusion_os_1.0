CREATE TABLE [dbo].[matrix] (
    [matrix_id]          INT             NOT NULL,
    [matrix_yr]          NUMERIC (4)     NOT NULL,
    [label]              VARCHAR (20)    NULL,
    [axis_1]             VARCHAR (20)    NULL,
    [axis_2]             VARCHAR (20)    NULL,
    [matrix_description] VARCHAR (50)    NULL,
    [operator]           VARCHAR (20)    NULL,
    [default_cell_value] NUMERIC (16, 2) NULL,
    [bInterpolate]       BIT             NULL,
    [matrix_type]        VARCHAR (20)    NULL,
    [matrix_sub_type_cd] VARCHAR (10)    NULL,
    CONSTRAINT [CPK_matrix] PRIMARY KEY CLUSTERED ([matrix_id] ASC, [matrix_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_matrix_yr_label]
    ON [dbo].[matrix]([matrix_yr] ASC, [label] ASC) WITH (FILLFACTOR = 90);


GO

