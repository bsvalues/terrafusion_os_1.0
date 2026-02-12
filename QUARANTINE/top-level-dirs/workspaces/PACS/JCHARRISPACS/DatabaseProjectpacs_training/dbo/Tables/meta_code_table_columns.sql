CREATE TABLE [dbo].[meta_code_table_columns] (
    [table_name]      VARCHAR (50)   NOT NULL,
    [column_name]     VARCHAR (50)   NOT NULL,
    [display_name]    VARCHAR (255)  NOT NULL,
    [is_editable]     BIT            NOT NULL,
    [column_type_id]  INT            NULL,
    [valid_values]    VARCHAR (2047) NULL,
    [is_new_editable] BIT            NOT NULL,
    [allow_null]      BIT            CONSTRAINT [CDF_meta_code_table_columns_allow_null] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_meta_code_table_columns] PRIMARY KEY CLUSTERED ([table_name] ASC, [column_name] ASC),
    CONSTRAINT [CFK_meta_code_table_columns_table_name] FOREIGN KEY ([table_name]) REFERENCES [dbo].[meta_code_table] ([table_name]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates that a column may be null or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'meta_code_table_columns', @level2type = N'COLUMN', @level2name = N'allow_null';


GO

