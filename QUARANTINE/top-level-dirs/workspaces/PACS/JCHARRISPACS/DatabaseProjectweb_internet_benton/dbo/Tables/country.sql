CREATE TABLE [dbo].[country] (
    [country_cd]   CHAR (5)     NOT NULL,
    [country_name] VARCHAR (50) NULL,
    [sys_flag]     CHAR (1)     NULL,
    CONSTRAINT [CPK_country] PRIMARY KEY CLUSTERED ([country_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

