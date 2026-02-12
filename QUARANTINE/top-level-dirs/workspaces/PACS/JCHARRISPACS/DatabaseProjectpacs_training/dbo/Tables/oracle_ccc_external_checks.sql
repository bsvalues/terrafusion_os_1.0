CREATE TABLE [dbo].[oracle_ccc_external_checks] (
    [SOURCE_NAME]         VARCHAR (25)    NOT NULL,
    [CREATION_DATE]       DATETIME        NULL,
    [BANK_NUMBER]         VARCHAR (9)     NOT NULL,
    [BANK_ACCOUNT_NUMBER] VARCHAR (30)    NOT NULL,
    [TRANSACTION_DATE]    DATETIME        NOT NULL,
    [TRANSACTION_TYPE]    VARCHAR (7)     NOT NULL,
    [TRANSACTION_NUMBER]  VARCHAR (30)    NOT NULL,
    [FUND]                VARCHAR (4)     NULL,
    [PAYEE_NAME]          VARCHAR (50)    NULL,
    [AMOUNT]              NUMERIC (16, 2) NULL,
    [TRANSACTION_ID]      INT             NULL,
    [BANK_ACCOUNT_ID]     INT             NULL,
    [STATUS]              VARCHAR (10)    NULL,
    [GL_DATE]             DATETIME        NULL,
    [CLEARED_AMOUNT]      NUMERIC (16, 2) NULL,
    [CLEARED_DATE]        DATETIME        NULL,
    [ERROR_AMOUNT]        NUMERIC (16, 2) NULL,
    [WARRANT_NUMBER]      VARCHAR (10)    NULL,
    [EXPORTED]            BIT             NULL
);


GO

