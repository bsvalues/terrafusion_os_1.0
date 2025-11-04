CREATE TABLE [dbo].[income_sm_worksheet_property_info] (
    [event_id]         INT            NOT NULL,
    [prop_id]          INT            NOT NULL,
    [owner_name]       VARCHAR (70)   NULL,
    [situs]            VARCHAR (147)  NULL,
    [distribution_pct] NUMERIC (5, 2) NULL,
    [value]            NUMERIC (14)   NULL,
    CONSTRAINT [CPK_income_sm_worksheet_property_info] PRIMARY KEY CLUSTERED ([event_id] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_income_sm_worksheet_property_info_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id])
);


GO

