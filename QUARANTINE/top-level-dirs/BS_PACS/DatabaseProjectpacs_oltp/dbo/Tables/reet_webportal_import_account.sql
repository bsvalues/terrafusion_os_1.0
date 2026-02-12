CREATE TABLE [dbo].[reet_webportal_import_account] (
    [webportal_id]    VARCHAR (10)  NOT NULL,
    [account_type_cd] CHAR (1)      NOT NULL,
    [name]            VARCHAR (150) NOT NULL,
    [addr_line1]      VARCHAR (60)  NOT NULL,
    [addr_line2]      VARCHAR (60)  NOT NULL,
    [addr_line3]      VARCHAR (60)  NOT NULL,
    [addr_city]       VARCHAR (50)  NOT NULL,
    [addr_state]      VARCHAR (50)  NOT NULL,
    [addr_zip]        CHAR (9)      NOT NULL,
    [addr_country_cd] CHAR (5)      NOT NULL,
    [phone_num]       VARCHAR (20)  NULL,
    [error]           VARCHAR (255) NULL,
    CONSTRAINT [CPK_reet_webportal_import_account] PRIMARY KEY CLUSTERED ([webportal_id] ASC, [account_type_cd] ASC, [name] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_reet_webportal_import_account_webportal_id] FOREIGN KEY ([webportal_id]) REFERENCES [dbo].[reet_webportal_import] ([webportal_id])
);


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_webportal_import_account] TO PUBLIC
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_webportal_import_account] TO [simplifile]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_webportal_import_account] TO PUBLIC
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_webportal_import_account] TO [simplifile]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_webportal_import_account] TO PUBLIC
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_webportal_import_account] TO PUBLIC
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_webportal_import_account] TO [simplifile]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_webportal_import_account] TO [simplifile]
    AS [dbo];


GO

