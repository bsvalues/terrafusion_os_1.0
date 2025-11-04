CREATE TABLE [dbo].[arb_meeting] (
    [arb_inq_id]         INT      NOT NULL,
    [arb_mtg_id]         INT      NOT NULL,
    [arb_mtg_type_cd]    CHAR (5) NOT NULL,
    [arb_mtg_type_dt_tm] DATETIME NULL,
    [sys_flag]           CHAR (1) NULL,
    CONSTRAINT [CPK_arb_meeting] PRIMARY KEY CLUSTERED ([arb_inq_id] ASC, [arb_mtg_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_arb_inq_id]
    ON [dbo].[arb_meeting]([arb_inq_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_arb_mtg_type_cd]
    ON [dbo].[arb_meeting]([arb_mtg_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

