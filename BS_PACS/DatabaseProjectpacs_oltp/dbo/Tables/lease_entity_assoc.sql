CREATE TABLE [dbo].[lease_entity_assoc] (
    [lease_id]   VARCHAR (20)     NOT NULL,
    [lease_yr]   INT              NOT NULL,
    [rev_num]    INT              NOT NULL,
    [entity_id]  INT              NOT NULL,
    [entity_pct] NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_lease_entity_assoc] PRIMARY KEY CLUSTERED ([lease_id] ASC, [lease_yr] ASC, [rev_num] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_lease_entity_assoc_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id])
);


GO

