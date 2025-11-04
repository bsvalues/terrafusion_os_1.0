CREATE TABLE [dbo].[_arb_protest_hearing_docket] (
    [lHearingID]              INT      NOT NULL,
    [docket_id]               INT      NOT NULL,
    [docket_start_date_time]  DATETIME NOT NULL,
    [docket_end_date_time]    DATETIME NOT NULL,
    [maximum_hearing_count]   INT      NULL,
    [scheduled_protest_count] INT      CONSTRAINT [CDF__arb_protest_hearing_docket_scheduled_protest_count] DEFAULT (0) NOT NULL,
    [scheduled_agent_count]   INT      CONSTRAINT [CDF__arb_protest_hearing_docket_scheduled_agent_count] DEFAULT (0) NOT NULL,
    [assigned_agent_count]    INT      CONSTRAINT [CDF__arb_protest_hearing_docket_assigned_agent_count] DEFAULT (0) NOT NULL,
    [offsite]                 BIT      CONSTRAINT [CDF__arb_protest_hearing_docket_offsite] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK__arb_protest_hearing_docket] PRIMARY KEY CLUSTERED ([docket_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CCK__arb_protest_hearing_docket_maximum_hearing_count] CHECK ([maximum_hearing_count] is null or [scheduled_protest_count] <= [maximum_hearing_count]),
    CONSTRAINT [CFK__arb_protest_hearing_docket_lHearingID] FOREIGN KEY ([lHearingID]) REFERENCES [dbo].[_arb_protest_hearing] ([lHearingID])
);


GO

CREATE NONCLUSTERED INDEX [idx_docket_start_date_time]
    ON [dbo].[_arb_protest_hearing_docket]([docket_start_date_time] ASC) WITH (FILLFACTOR = 90);


GO

