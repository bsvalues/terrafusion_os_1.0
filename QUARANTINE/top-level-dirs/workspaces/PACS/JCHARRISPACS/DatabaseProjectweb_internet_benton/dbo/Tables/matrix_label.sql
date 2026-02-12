CREATE TABLE [dbo].[matrix_label] (
    [matrix_yr]   NUMERIC (4)  NOT NULL,
    [label_cd]    VARCHAR (20) NOT NULL,
    [label_desc]  VARCHAR (50) NULL,
    [matrix_type] VARCHAR (20) NOT NULL,
    CONSTRAINT [CPK_matrix_label] PRIMARY KEY CLUSTERED ([matrix_yr] ASC, [label_cd] ASC, [matrix_type] ASC) WITH (FILLFACTOR = 100)
);


GO

