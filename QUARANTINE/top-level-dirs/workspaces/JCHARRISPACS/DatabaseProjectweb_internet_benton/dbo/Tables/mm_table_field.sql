CREATE TABLE [dbo].[mm_table_field] (
    [type]             VARCHAR (5)   NOT NULL,
    [field_name]       VARCHAR (100) NOT NULL,
    [pacs_table_name]  VARCHAR (50)  NOT NULL,
    [pacs_column_name] VARCHAR (50)  NOT NULL,
    [field_type]       VARCHAR (10)  NOT NULL,
    [adj_type]         VARCHAR (5)   NULL,
    CONSTRAINT [CPK_mm_table_field] PRIMARY KEY CLUSTERED ([pacs_table_name] ASC, [pacs_column_name] ASC) WITH (FILLFACTOR = 100)
);


GO

