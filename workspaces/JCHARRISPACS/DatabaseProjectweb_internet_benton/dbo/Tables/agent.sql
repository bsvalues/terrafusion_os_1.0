CREATE TABLE [dbo].[agent] (
    [agent_id]      INT          NOT NULL,
    [agent_cd]      VARCHAR (10) NULL,
    [arb_docket_id] INT          NULL,
    [inactive_flag] BIT          NOT NULL,
    CONSTRAINT [CPK_agent] PRIMARY KEY CLUSTERED ([agent_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_arb_docket_id]
    ON [dbo].[agent]([arb_docket_id] ASC) WITH (FILLFACTOR = 90);


GO

