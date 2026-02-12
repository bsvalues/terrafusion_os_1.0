CREATE TABLE [dbo].[report] (
    [type]          VARCHAR (10)  NOT NULL,
    [description]   VARCHAR (100) NULL,
    [location]      VARCHAR (255) NULL,
    [system_type]   CHAR (1)      NULL,
    [group_type]    VARCHAR (50)  NULL,
    [server_name]   VARCHAR (50)  NULL,
    [database_name] VARCHAR (50)  NULL,
    [dsn_name]      VARCHAR (50)  NULL,
    CONSTRAINT [CPK_report] PRIMARY KEY CLUSTERED ([type] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_report_server_name_database_name] CHECK ([server_name] is null and [database_name] is null or [server_name] is not null and [database_name] is not null)
);


GO

