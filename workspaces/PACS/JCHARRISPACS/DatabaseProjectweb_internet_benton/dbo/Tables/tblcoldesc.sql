CREATE TABLE [dbo].[tblcoldesc] (
    [table_name]     VARCHAR (127)  NOT NULL,
    [column_name]    VARCHAR (127)  NOT NULL,
    [human_language] VARCHAR (255)  NOT NULL,
    [column_format]  VARCHAR (2047) NULL,
    CONSTRAINT [CPK_tblcoldesc] PRIMARY KEY CLUSTERED ([table_name] ASC, [column_name] ASC) WITH (FILLFACTOR = 90)
);


GO

