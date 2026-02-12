CREATE TABLE [dbo].[special_group] (
    [special_group_id] INT           NOT NULL,
    [name]             VARCHAR (50)  NOT NULL,
    [description]      VARCHAR (255) NULL,
    [create_dt]        DATETIME      NULL,
    [user_dt]          DATETIME      NULL,
    [contact_name]     VARCHAR (50)  NULL,
    [address1]         VARCHAR (50)  NULL,
    [address2]         VARCHAR (50)  NULL,
    [address3]         VARCHAR (50)  NULL,
    [city]             VARCHAR (50)  NULL,
    [state]            VARCHAR (2)   NULL,
    [zip]              VARCHAR (13)  NULL,
    [phone]            VARCHAR (14)  NULL,
    [fax]              VARCHAR (14)  NULL,
    [email]            VARCHAR (50)  NULL,
    [ftp]              VARCHAR (255) NULL,
    [ftp_login]        VARCHAR (50)  NULL,
    [ftp_password]     VARCHAR (50)  NULL,
    [ftp_deploy]       BIT           NULL,
    [e_notices]        BIT           NULL,
    [e_statements]     BIT           NULL,
    CONSTRAINT [CPK_special_group] PRIMARY KEY CLUSTERED ([special_group_id] ASC) WITH (FILLFACTOR = 100)
);


GO

