CREATE TABLE [dbo].[mail_returned_type] (
    [ml_return_type_cd]  CHAR (5)     NOT NULL,
    [ml_return_typ_desc] VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    CONSTRAINT [CPK_mail_returned_type] PRIMARY KEY CLUSTERED ([ml_return_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

