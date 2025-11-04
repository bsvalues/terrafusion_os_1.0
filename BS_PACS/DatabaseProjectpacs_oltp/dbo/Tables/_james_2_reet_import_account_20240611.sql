CREATE TABLE [dbo].[_james_2_reet_import_account_20240611] (
    [reet_import_account_id] INT           IDENTITY (1, 1) NOT NULL,
    [reet_id]                INT           NULL,
    [account_type_cd]        CHAR (1)      NULL,
    [name]                   VARCHAR (150) NULL,
    [addr_line1]             VARCHAR (60)  NULL,
    [addr_line2]             VARCHAR (60)  NULL,
    [addr_line3]             VARCHAR (60)  NULL,
    [addr_city]              VARCHAR (50)  NULL,
    [addr_state]             VARCHAR (50)  NULL,
    [addr_zip]               CHAR (9)      NULL,
    [addr_country_cd]        CHAR (5)      NULL,
    [phone_num]              VARCHAR (20)  NULL,
    [loaded]                 BIT           NOT NULL
);


GO

