CREATE TABLE [dbo].[autopay_ach_information] (
    [company_name]      VARCHAR (16) NOT NULL,
    [origin_name]       VARCHAR (23) NOT NULL,
    [taxpayer_ident]    VARCHAR (9)  NOT NULL,
    [bank_name]         VARCHAR (23) NOT NULL,
    [entry_class]       VARCHAR (3)  NOT NULL,
    [entry_description] VARCHAR (10) NOT NULL,
    [routing_number]    VARCHAR (9)  NULL,
    CONSTRAINT [CPK_autopay_ach_information] PRIMARY KEY CLUSTERED ([company_name] ASC)
);


GO

