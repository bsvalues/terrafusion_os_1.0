CREATE TABLE [dbo].[mhm_status_code] (
    [mhm_status_cd]   VARCHAR (12) NOT NULL,
    [mhm_status_desc] VARCHAR (50) NOT NULL,
    [cancelled]       BIT          NULL,
    [completed]       BIT          NULL,
    [priority]        INT          NOT NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_mhm_status_code] PRIMARY KEY CLUSTERED ([mhm_status_cd] ASC)
);


GO

