CREATE TABLE [dbo].[property_lien_holder] (
    [lien_holder_id]              INT           NOT NULL,
    [acct_id]                     INT           NOT NULL,
    [prop_id]                     INT           NOT NULL,
    [lien_type_cd]                VARCHAR (20)  NULL,
    [date_created]                DATETIME      CONSTRAINT [CDF_property_lien_holder_date_created] DEFAULT (getdate()) NOT NULL,
    [effective_date]              DATETIME      NULL,
    [recorded_number]             VARCHAR (50)  NULL,
    [recorded_date]               DATETIME      NULL,
    [volume]                      VARCHAR (20)  NULL,
    [page]                        VARCHAR (20)  NULL,
    [comment]                     VARCHAR (255) NULL,
    [trustee_acct_id]             INT           NULL,
    [beneficiary_acct_id]         INT           NULL,
    [in_favor_of_acct_id]         INT           NULL,
    [foreclosure_cost]            NUMERIC (14)  NULL,
    [superior_court_cause_number] VARCHAR (50)  NULL,
    [description]                 VARCHAR (50)  NULL,
    CONSTRAINT [CPK_property_lien_holder] PRIMARY KEY CLUSTERED ([prop_id] ASC, [acct_id] ASC, [lien_holder_id] ASC),
    CONSTRAINT [CFK_property_lien_holder_acct_id] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_property_lien_holder_beneficiary_acct_id] FOREIGN KEY ([beneficiary_acct_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_property_lien_holder_in_favor_of_acct_id] FOREIGN KEY ([in_favor_of_acct_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_property_lien_holder_lien_type] FOREIGN KEY ([lien_type_cd]) REFERENCES [dbo].[lien_type] ([lien_type_code]),
    CONSTRAINT [CFK_property_lien_holder_property] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_property_lien_holder_trustee_acct_id] FOREIGN KEY ([trustee_acct_id]) REFERENCES [dbo].[account] ([acct_id])
);


GO

