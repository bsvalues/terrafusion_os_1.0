CREATE TABLE [dbo].[data_control_definition] (
    [control_id]        INT            IDENTITY (1, 1) NOT NULL,
    [name]              VARCHAR (50)   NOT NULL,
    [table_name]        VARCHAR (50)   NULL,
    [where_sql]         VARCHAR (1024) NULL,
    [double_click_edit] SMALLINT       NOT NULL,
    [enter_edit]        SMALLINT       NOT NULL,
    [enter_end_edit]    SMALLINT       NOT NULL,
    [allow_delete_key]  SMALLINT       NOT NULL,
    [verify_delete_key] SMALLINT       NOT NULL,
    [allow_insert_add]  SMALLINT       NOT NULL,
    [use_row_color]     SMALLINT       NOT NULL,
    [display_errors]    SMALLINT       NOT NULL,
    [allow_sort]        SMALLINT       NOT NULL,
    [allow_totaling]    SMALLINT       NOT NULL,
    CONSTRAINT [CPK_data_control_definition] PRIMARY KEY CLUSTERED ([control_id] ASC) WITH (FILLFACTOR = 100)
);


GO

