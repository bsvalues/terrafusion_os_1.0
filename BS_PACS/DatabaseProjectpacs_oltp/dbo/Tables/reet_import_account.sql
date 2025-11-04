CREATE TABLE [dbo].[reet_import_account] (
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
    [loaded]                 BIT           CONSTRAINT [CDF_reet_import_account_loaded] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_reet_import_account] PRIMARY KEY CLUSTERED ([reet_import_account_id] ASC),
    CONSTRAINT [CFK_reet_import_account_reet_id] FOREIGN KEY ([reet_id]) REFERENCES [dbo].[reet] ([reet_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies if the account has been loaded as part of Buyer Add Automating', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'reet_import_account', @level2type = N'COLUMN', @level2name = N'loaded';


GO

