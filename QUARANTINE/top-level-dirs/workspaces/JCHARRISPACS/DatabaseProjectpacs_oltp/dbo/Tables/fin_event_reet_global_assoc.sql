CREATE TABLE [dbo].[fin_event_reet_global_assoc] (
    [fin_account_id]     INT          NOT NULL,
    [event_cd]           VARCHAR (15) NOT NULL,
    [action]             BIT          NOT NULL,
    [is_primary_account] BIT          NULL,
    CONSTRAINT [CPK_fin_event_reet_p_and_i_assoc] PRIMARY KEY CLUSTERED ([fin_account_id] ASC, [event_cd] ASC, [action] ASC),
    CONSTRAINT [CFK_fin_event_reet_global_assoc_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[fin_event_code] ([event_cd]),
    CONSTRAINT [CFK_fin_event_reet_global_assoc_fin_account_id] FOREIGN KEY ([fin_account_id]) REFERENCES [dbo].[fin_account] ([fin_account_id])
);


GO

