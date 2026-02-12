CREATE TABLE [dbo].[reet_wac_code] (
    [wac_cd]   VARCHAR (32)  NOT NULL,
    [wac_desc] VARCHAR (100) NOT NULL,
    [sys_flag] CHAR (1)      NULL,
    [inactive] BIT           NOT NULL,
    CONSTRAINT [CPK_reet_wac_code] PRIMARY KEY CLUSTERED ([wac_cd] ASC)
);


GO

