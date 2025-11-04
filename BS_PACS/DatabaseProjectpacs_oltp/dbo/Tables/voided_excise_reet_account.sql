CREATE TABLE [dbo].[voided_excise_reet_account] (
    [excise_number]          INT           NOT NULL,
    [reet_import_account_id] INT           NOT NULL,
    [reet_id]                INT           NOT NULL,
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
    CONSTRAINT [CPK_voided_excise_reet_account] PRIMARY KEY CLUSTERED ([excise_number] ASC, [reet_import_account_id] ASC),
    CONSTRAINT [CFK_voided_excise_reet_account_excise_number] FOREIGN KEY ([excise_number]) REFERENCES [dbo].[voided_excise_reet] ([excise_number])
);


GO

