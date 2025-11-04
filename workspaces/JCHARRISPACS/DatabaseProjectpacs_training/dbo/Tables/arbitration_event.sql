CREATE TABLE [dbo].[arbitration_event] (
    [arbitration_id] INT           NOT NULL,
    [prop_val_yr]    NUMERIC (4)   NOT NULL,
    [event_id]       INT           IDENTITY (1, 1) NOT NULL,
    [event_cd]       VARCHAR (10)  NOT NULL,
    [event_dt]       DATETIME      NOT NULL,
    [pacs_user_id]   INT           NOT NULL,
    [event_comment]  VARCHAR (500) NULL,
    CONSTRAINT [CPK_arbitration_event] PRIMARY KEY CLUSTERED ([arbitration_id] ASC, [prop_val_yr] ASC, [event_id] ASC),
    CONSTRAINT [CFK_arbitration_event_arbitration_id_prop_val_yr] FOREIGN KEY ([arbitration_id], [prop_val_yr]) REFERENCES [dbo].[arbitration] ([arbitration_id], [prop_val_yr]),
    CONSTRAINT [CFK_arbitration_event_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[arbitration_event_type] ([event_type_cd])
);


GO

