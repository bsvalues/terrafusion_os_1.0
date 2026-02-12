CREATE TABLE [dbo].[_arb_event] (
    [lEventID]       INT            IDENTITY (100000, 1) NOT NULL,
    [lPropID]        INT            NOT NULL,
    [lYear]          NUMERIC (4)    NOT NULL,
    [lCaseID]        INT            NOT NULL,
    [szARBType]      VARCHAR (2)    NOT NULL,
    [szEventCode]    VARCHAR (10)   NOT NULL,
    [dtEvent]        DATETIME       NOT NULL,
    [lPacsUserID]    INT            NOT NULL,
    [szEventComment] VARCHAR (1500) NULL,
    [attachment]     BIT            NULL,
    CONSTRAINT [CPK__arb_event] PRIMARY KEY CLUSTERED ([lEventID] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_event_szARBType_szEventCode] FOREIGN KEY ([szARBType], [szEventCode]) REFERENCES [dbo].[_arb_event_type] ([szARBType], [szCode])
);


GO

CREATE NONCLUSTERED INDEX [idx_lPropID]
    ON [dbo].[_arb_event]([lPropID] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Serves as an attachment for ARB events', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_event', @level2type = N'COLUMN', @level2name = N'attachment';


GO

