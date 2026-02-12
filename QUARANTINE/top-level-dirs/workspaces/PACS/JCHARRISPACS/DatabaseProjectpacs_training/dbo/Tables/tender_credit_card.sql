CREATE TABLE [dbo].[tender_credit_card] (
    [tender_id] INT         NOT NULL,
    [card_type] VARCHAR (5) NULL,
    [last_four] INT         NULL,
    [auth_code] CHAR (10)   NULL,
    [cccc]      CHAR (10)   NULL,
    [swipe]     CHAR (10)   NULL,
    CONSTRAINT [CPK_tender_credit_card] PRIMARY KEY CLUSTERED ([tender_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_tender_credit_card_card_type] FOREIGN KEY ([card_type]) REFERENCES [dbo].[cc_type] ([cc_type]),
    CONSTRAINT [CFK_tender_credit_card_tender_id] FOREIGN KEY ([tender_id]) REFERENCES [dbo].[tender] ([tender_id])
);


GO

