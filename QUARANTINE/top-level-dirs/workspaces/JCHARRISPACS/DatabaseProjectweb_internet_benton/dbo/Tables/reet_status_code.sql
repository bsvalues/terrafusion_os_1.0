CREATE TABLE [dbo].[reet_status_code] (
    [reet_status_cd]   VARCHAR (10) NOT NULL,
    [reet_status_desc] VARCHAR (30) NOT NULL,
    [priority]         INT          NOT NULL,
    [void_flag]        BIT          NOT NULL,
    [disable_flag]     BIT          NOT NULL,
    [sys_flag]         BIT          NOT NULL,
    CONSTRAINT [CPK_reet_status_code] PRIMARY KEY CLUSTERED ([reet_status_cd] ASC)
);


GO

