CREATE TABLE [dbo].[meta_manage_table] (
    [table_name]          VARCHAR (50)  NOT NULL,
    [dialog_name]         VARCHAR (150) NOT NULL,
    [column1_name]        VARCHAR (150) NOT NULL,
    [column1_field]       VARCHAR (50)  NULL,
    [column2_name]        VARCHAR (150) NOT NULL,
    [column2_field]       VARCHAR (50)  NULL,
    [column1_combo]       BIT           NOT NULL,
    [column1_combo_value] VARCHAR (150) NULL,
    [primary_key]         VARCHAR (100) NULL,
    CONSTRAINT [CPK_meta_manage_table] PRIMARY KEY CLUSTERED ([table_name] ASC)
);


GO

