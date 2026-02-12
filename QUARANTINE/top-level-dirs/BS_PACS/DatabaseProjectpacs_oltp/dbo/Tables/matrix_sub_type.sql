CREATE TABLE [dbo].[matrix_sub_type] (
    [matrix_sub_type_cd]   VARCHAR (10) NOT NULL,
    [matrix_type]          VARCHAR (20) NOT NULL,
    [matrix_sub_type_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_matrix_sub_type] PRIMARY KEY CLUSTERED ([matrix_sub_type_cd] ASC, [matrix_type] ASC) WITH (FILLFACTOR = 100)
);


GO

