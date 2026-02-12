CREATE TABLE [dbo].[import_bpp_account_info] (
    [run_id]          INT          NOT NULL,
    [aid]             INT          IDENTITY (1, 1) NOT NULL,
    [owner_id]        INT          NOT NULL,
    [file_as_name]    VARCHAR (70) NULL,
    [email]           VARCHAR (50) NULL,
    [primary_address] CHAR (1)     NULL,
    [address_type]    VARCHAR (5)  NULL,
    [address_1]       VARCHAR (60) NULL,
    [address_2]       VARCHAR (60) NULL,
    [address_3]       VARCHAR (60) NULL,
    [city]            VARCHAR (50) NULL,
    [state]           VARCHAR (50) NULL,
    [zip]             VARCHAR (5)  NULL,
    [cass]            VARCHAR (4)  NULL,
    [country_cd]      VARCHAR (5)  NULL,
    [phone_type]      VARCHAR (5)  NULL,
    [phone_number]    VARCHAR (20) NULL,
    CONSTRAINT [CPK_import_bpp_account_info] PRIMARY KEY CLUSTERED ([run_id] ASC, [aid] ASC),
    CONSTRAINT [CFK_import_bpp_account_info_import_bpp] FOREIGN KEY ([run_id]) REFERENCES [dbo].[import_bpp] ([run_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Address Line 1', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'address_1';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Zip Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'zip';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New CASS', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'cass';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Owner ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'owner_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New State', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'state';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Phone Number', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'phone_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Unique Account Info ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'aid';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Address Type Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'address_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Phone Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'phone_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Import BPP Account Informatoin table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Email Address', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'email';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Primary Address Indicator (Y = Yes, N = No)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'primary_address';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New City', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'city';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Owner Name', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'file_as_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Address Line 2', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'address_2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Address Line 3', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'address_3';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'New Country Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_bpp_account_info', @level2type = N'COLUMN', @level2name = N'country_cd';


GO

