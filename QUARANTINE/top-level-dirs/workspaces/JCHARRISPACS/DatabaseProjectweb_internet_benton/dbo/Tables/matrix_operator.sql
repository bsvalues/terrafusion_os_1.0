CREATE TABLE [dbo].[matrix_operator] (
    [matrix_yr]     NUMERIC (4)  NOT NULL,
    [operator_cd]   VARCHAR (20) NOT NULL,
    [operator_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_matrix_operator] PRIMARY KEY CLUSTERED ([matrix_yr] ASC, [operator_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

