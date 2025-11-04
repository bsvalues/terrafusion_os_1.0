CREATE TABLE [dbo].[deferral_selected_statements] (
    [deferral_ss_id] INT             IDENTITY (1, 1) NOT NULL,
    [deferral_id]    INT             NOT NULL,
    [statement_id]   INT             NOT NULL,
    [year]           NUMERIC (4)     NOT NULL,
    [prop_id]        INT             NOT NULL,
    [statement_type] VARCHAR (5)     NOT NULL,
    [item_id]        INT             NOT NULL,
    [selected]       BIT             DEFAULT ((0)) NOT NULL,
    [taxpayer]       VARCHAR (125)   NULL,
    [base_amt]       DECIMAL (14, 2) NULL,
    [interest]       DECIMAL (14, 2) NULL,
    [penalty]        DECIMAL (14, 2) NULL,
    [balance]        DECIMAL (14, 2) NULL,
    [fee_type_cd]    VARCHAR (25)    NULL,
    [agency_id]      INT             NULL,
    [agency_name]    VARCHAR (256)   NULL,
    CONSTRAINT [CPK_deferral_selected_statements] PRIMARY KEY CLUSTERED ([deferral_ss_id] ASC),
    CONSTRAINT [ck_statement_type] CHECK ([statement_type]='SA' OR [statement_type]='FEE' OR [statement_type]='BILL'),
    CONSTRAINT [FK_deferral_selected_statements_deferral_id] FOREIGN KEY ([deferral_id]) REFERENCES [dbo].[deferral] ([deferral_id])
);


GO

