CREATE TABLE [dbo].[cad] (
    [CAD_code]       VARCHAR (5)  NOT NULL,
    [CAD_desc]       VARCHAR (50) NULL,
    [sys_flag]       VARCHAR (1)  NULL,
    [CAD_addr_line1] VARCHAR (50) NULL,
    [CAD_addr_line2] VARCHAR (50) NULL,
    [CAD_addr_line3] VARCHAR (50) NULL,
    [CAD_addr_city]  VARCHAR (50) NULL,
    [CAD_addr_state] VARCHAR (2)  NULL,
    [CAD_addr_zip]   VARCHAR (50) NULL,
    [CAD_phone_num]  VARCHAR (50) NULL,
    [value_option]   CHAR (1)     NULL,
    [format_type]    VARCHAR (3)  NULL,
    CONSTRAINT [CPK_cad] PRIMARY KEY CLUSTERED ([CAD_code] ASC) WITH (FILLFACTOR = 100)
);


GO

