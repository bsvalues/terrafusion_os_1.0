CREATE TABLE [dbo].[_arb_event_object] (
    [lObjectID]     INT           IDENTITY (100000, 1) NOT NULL,
    [lEventID]      INT           NOT NULL,
    [dtObject]      DATETIME      NOT NULL,
    [szObjectPath]  VARCHAR (512) NOT NULL,
    [szObjectDesc]  VARCHAR (512) NULL,
    [lPacsUserID]   INT           NOT NULL,
    [szDisplayName] VARCHAR (255) NULL,
    CONSTRAINT [CPK__arb_event_object] PRIMARY KEY CLUSTERED ([lObjectID] ASC) WITH (FILLFACTOR = 90)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Display name for ARB event objects', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_event_object', @level2type = N'COLUMN', @level2name = N'szDisplayName';


GO

