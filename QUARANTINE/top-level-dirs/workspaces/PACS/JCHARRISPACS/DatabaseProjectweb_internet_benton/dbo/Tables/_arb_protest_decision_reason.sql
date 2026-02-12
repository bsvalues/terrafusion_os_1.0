CREATE TABLE [dbo].[_arb_protest_decision_reason] (
    [decision_reason_cd]      VARCHAR (10) NOT NULL,
    [decision_reason_desc]    VARCHAR (50) NULL,
    [qualify_for_arbitration] BIT          NOT NULL,
    [sys_flag]                BIT          NOT NULL,
    CONSTRAINT [CPK__arb_protest_decision_reason] PRIMARY KEY CLUSTERED ([decision_reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

