CREATE TABLE [dbo].[CompletedScope] (
    [uidInstanceID]    UNIQUEIDENTIFIER NOT NULL,
    [completedScopeID] UNIQUEIDENTIFIER NOT NULL,
    [state]            IMAGE            NOT NULL,
    [modified]         DATETIME         NOT NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_completedScopeID]
    ON [dbo].[CompletedScope]([completedScopeID] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_uidInstanceID]
    ON [dbo].[CompletedScope]([uidInstanceID] ASC);


GO

