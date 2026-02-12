CREATE TABLE [dbo].[meta_field_info] (
    [records_uid]    VARCHAR (23)   NOT NULL,
    [table_name]     VARCHAR (127)  NOT NULL,
    [column_name]    VARCHAR (127)  NOT NULL,
    [column_desc]    VARCHAR (255)  NOT NULL,
    [column_tip]     VARCHAR (255)  NOT NULL,
    [sample_data]    VARCHAR (2047) NOT NULL,
    [show_in_letter] BIT            NOT NULL,
    CONSTRAINT [CPK_meta_field_info] PRIMARY KEY CLUSTERED ([records_uid] ASC, [table_name] ASC, [column_name] ASC) WITH (FILLFACTOR = 100)
);


GO

