CREATE TABLE [dbo].[refund_type] (
    [year]                      NUMERIC (4)    NOT NULL,
    [refund_type_cd]            VARCHAR (20)   NOT NULL,
    [refund_reason]             VARCHAR (50)   NULL,
    [interest_check]            BIT            NULL,
    [interest_to_refund_amount] NUMERIC (6, 4) NULL,
    [print_refund_letter]       INT            NULL,
    [print_refund_check]        BIT            NULL,
    [category]                  BIT            NULL,
    [modify_cd]                 VARCHAR (10)   NULL,
    [core_refund_type]          INT            NOT NULL,
    CONSTRAINT [CPK_refund_type] PRIMARY KEY CLUSTERED ([year] ASC, [refund_type_cd] ASC)
);


GO

