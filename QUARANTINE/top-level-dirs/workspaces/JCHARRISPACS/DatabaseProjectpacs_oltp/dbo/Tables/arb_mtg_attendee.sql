CREATE TABLE [dbo].[arb_mtg_attendee] (
    [arb_inq_id]    INT          NOT NULL,
    [attendee_id]   INT          NOT NULL,
    [arb_mtg_id]    INT          NOT NULL,
    [attendee_name] VARCHAR (70) NULL,
    [was_present]   CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_mtg_attendee] PRIMARY KEY CLUSTERED ([arb_inq_id] ASC, [attendee_id] ASC, [arb_mtg_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_arb_mtg_id_arb_inq_id]
    ON [dbo].[arb_mtg_attendee]([arb_mtg_id] ASC, [arb_inq_id] ASC) WITH (FILLFACTOR = 90);


GO

