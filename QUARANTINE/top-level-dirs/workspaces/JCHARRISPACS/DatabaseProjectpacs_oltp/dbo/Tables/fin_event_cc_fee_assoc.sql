CREATE TABLE [dbo].[fin_event_cc_fee_assoc] (
    [fin_account_id]     INT          NOT NULL,
    [event_cd]           VARCHAR (15) NOT NULL,
    [action]             BIT          NOT NULL,
    [cc_type]            VARCHAR (5)  NOT NULL,
    [is_primary_account] BIT          NULL,
    CONSTRAINT [CPK_fin_event_cc_fee_assoc] PRIMARY KEY CLUSTERED ([fin_account_id] ASC, [event_cd] ASC, [action] ASC, [cc_type] ASC),
    CONSTRAINT [CFK_fin_event_cc_fee_assoc_cc_type] FOREIGN KEY ([cc_type]) REFERENCES [dbo].[cc_type] ([cc_type]),
    CONSTRAINT [CFK_fin_event_cc_fee_assoc_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[fin_event_code] ([event_cd]),
    CONSTRAINT [CFK_fin_event_cc_fee_assoc_fin_account_id] FOREIGN KEY ([fin_account_id]) REFERENCES [dbo].[fin_account] ([fin_account_id])
);


GO

