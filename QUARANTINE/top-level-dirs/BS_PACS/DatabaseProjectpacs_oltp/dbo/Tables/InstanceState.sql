CREATE TABLE [dbo].[InstanceState] (
    [uidInstanceID] UNIQUEIDENTIFIER NOT NULL,
    [state]         IMAGE            NULL,
    [status]        INT              NULL,
    [unlocked]      INT              NULL,
    [blocked]       INT              NULL,
    [info]          NTEXT            NULL,
    [modified]      DATETIME         NOT NULL,
    [ownerID]       UNIQUEIDENTIFIER NULL,
    [ownedUntil]    DATETIME         NULL,
    [nextTimer]     DATETIME         NULL
);


GO

CREATE UNIQUE CLUSTERED INDEX [idx_uidInstanceID]
    ON [dbo].[InstanceState]([uidInstanceID] ASC);


GO

