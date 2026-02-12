CREATE TABLE [dbo].[arbitration_contact] (
    [arbitration_id]         INT           NOT NULL,
    [prop_val_yr]            NUMERIC (4)   NOT NULL,
    [contact_id]             INT           IDENTITY (1, 1) NOT NULL,
    [contact_type_cd]        VARCHAR (10)  NOT NULL,
    [acct_id]                INT           NULL,
    [contact_name]           VARCHAR (70)  NULL,
    [contact_addr1]          VARCHAR (70)  NULL,
    [contact_addr2]          VARCHAR (70)  NULL,
    [contact_addr3]          VARCHAR (70)  NULL,
    [contact_city]           VARCHAR (70)  NULL,
    [contact_state]          VARCHAR (2)   NULL,
    [contact_zip]            VARCHAR (10)  NULL,
    [contact_url]            VARCHAR (255) NULL,
    [contact_email]          VARCHAR (64)  NULL,
    [contact_phone_business] VARCHAR (20)  NULL,
    [contact_phone_home]     VARCHAR (20)  NULL,
    [contact_phone_cell]     VARCHAR (20)  NULL,
    [contact_phone_pager]    VARCHAR (20)  NULL,
    [contact_phone_fax]      VARCHAR (20)  NULL,
    [contact_phone_other]    VARCHAR (20)  NULL,
    CONSTRAINT [CPK_arbitration_contact] PRIMARY KEY CLUSTERED ([arbitration_id] ASC, [prop_val_yr] ASC, [contact_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_arbitration_contact_arbitration_id_prop_val_yr] FOREIGN KEY ([arbitration_id], [prop_val_yr]) REFERENCES [dbo].[arbitration] ([arbitration_id], [prop_val_yr]),
    CONSTRAINT [CFK_arbitration_contact_contact_type_cd] FOREIGN KEY ([contact_type_cd]) REFERENCES [dbo].[arbitration_contact_type] ([contact_type_cd])
);


GO

