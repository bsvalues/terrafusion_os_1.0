CREATE TABLE [dbo].[security_fields] (
    [table_name]           VARCHAR (127) NOT NULL,
    [column_name]          VARCHAR (127) NOT NULL,
    [key_name]             VARCHAR (255) NULL,
    [max_length_plaintext] INT           NULL,
    CONSTRAINT [CPK_security_fields] PRIMARY KEY CLUSTERED ([table_name] ASC, [column_name] ASC) WITH (FILLFACTOR = 100)
);


GO

