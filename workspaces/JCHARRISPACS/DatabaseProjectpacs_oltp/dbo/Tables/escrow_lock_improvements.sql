CREATE TABLE [dbo].[escrow_lock_improvements] (
    [escrow_id] INT NOT NULL,
    [imprv_id]  INT NOT NULL,
    [lock_flag] BIT DEFAULT ((1)) NULL,
    CONSTRAINT [CPK_escrow_id_imprv_id] PRIMARY KEY CLUSTERED ([escrow_id] ASC, [imprv_id] ASC),
    CONSTRAINT [FK_escrow_escrow_id2] FOREIGN KEY ([escrow_id]) REFERENCES [dbo].[escrow] ([escrow_id])
);


GO

