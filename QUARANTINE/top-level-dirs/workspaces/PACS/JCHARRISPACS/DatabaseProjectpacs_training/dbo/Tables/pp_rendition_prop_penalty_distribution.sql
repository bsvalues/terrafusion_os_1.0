CREATE TABLE [dbo].[pp_rendition_prop_penalty_distribution] (
    [prop_id]                        INT             NOT NULL,
    [owner_id]                       INT             NOT NULL,
    [sup_num]                        INT             NOT NULL,
    [rendition_year]                 NUMERIC (4)     NOT NULL,
    [entity_cd]                      CHAR (5)        NOT NULL,
    [penalty_distribution_amt]       NUMERIC (14, 2) NULL,
    [fraud_penalty_distribution_amt] NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_pp_rendition_prop_penalty_distribution] PRIMARY KEY CLUSTERED ([rendition_year] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [entity_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[pp_rendition_prop_penalty_distribution]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

