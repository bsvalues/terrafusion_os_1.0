CREATE TABLE [dbo].[report_refund_due] (
    [pacs_user_id]  INT             NOT NULL,
    [bill_id]       INT             NOT NULL,
    [mno_amt]       NUMERIC (14, 2) NULL,
    [ins_amt]       NUMERIC (14, 2) NULL,
    [penalty_amt]   NUMERIC (14, 2) NULL,
    [interest_amt]  NUMERIC (14, 2) NULL,
    [atty_fee_amt]  NUMERIC (14, 2) NULL,
    [entity_id]     INT             NOT NULL,
    [refund_year]   NUMERIC (4)     NOT NULL,
    [modify_cd]     CHAR (10)       NULL,
    [modify_reason] VARCHAR (500)   NULL,
    [discount_amt]  NUMERIC (14, 2) NULL,
    [underage_amt]  NUMERIC (14, 2) NULL,
    [overage_amt]   NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_report_refund_due] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [bill_id] ASC, [entity_id] ASC, [refund_year] ASC) WITH (FILLFACTOR = 100)
);


GO

