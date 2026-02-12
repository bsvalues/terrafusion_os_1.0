CREATE TABLE [dbo].[meta_code_table_column_type] (
    [column_type_id]   INT          IDENTITY (1, 1) NOT NULL,
    [column_type_desc] VARCHAR (23) NOT NULL,
    CONSTRAINT [CPK_meta_code_table_column_type] PRIMARY KEY CLUSTERED ([column_type_id] ASC) WITH (FILLFACTOR = 100)
);


GO

