CREATE TABLE [dbo].[phone_type] (
    [phone_type_cd]   CHAR (5)     NOT NULL,
    [phone_type_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_phone_type] PRIMARY KEY CLUSTERED ([phone_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

