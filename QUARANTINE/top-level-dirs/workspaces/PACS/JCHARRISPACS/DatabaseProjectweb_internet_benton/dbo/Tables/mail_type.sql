CREATE TABLE [dbo].[mail_type] (
    [ml_type_cd]   CHAR (5)     NOT NULL,
    [ml_type_desc] VARCHAR (50) NULL,
    [sys_flag]     CHAR (1)     NULL,
    CONSTRAINT [CPK_mail_type] PRIMARY KEY CLUSTERED ([ml_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

