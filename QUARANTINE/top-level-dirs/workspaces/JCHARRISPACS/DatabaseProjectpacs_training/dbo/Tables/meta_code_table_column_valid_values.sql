CREATE TABLE [dbo].[meta_code_table_column_valid_values] (
    [list_type]     VARCHAR (23)  NOT NULL,
    [store_value]   VARCHAR (511) NOT NULL,
    [display_value] VARCHAR (511) NOT NULL,
    CONSTRAINT [CPK_meta_code_table_column_valid_values] PRIMARY KEY CLUSTERED ([list_type] ASC, [store_value] ASC) WITH (FILLFACTOR = 100)
);


GO

