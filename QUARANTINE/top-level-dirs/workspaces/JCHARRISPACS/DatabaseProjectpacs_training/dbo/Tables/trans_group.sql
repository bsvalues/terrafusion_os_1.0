CREATE TABLE [dbo].[trans_group] (
    [trans_group_id]   INT          NOT NULL,
    [trans_group_type] VARCHAR (10) NOT NULL,
    [mrtransid_adj]    INT          NULL,
    [mrtransid_pay]    INT          NULL,
    [mrtransid_opc]    INT          NULL,
    CONSTRAINT [CPK_trans_group] PRIMARY KEY CLUSTERED ([trans_group_id] ASC),
    CONSTRAINT [CFK_trans_group_trans_group_type] FOREIGN KEY ([trans_group_type]) REFERENCES [dbo].[trans_group_type] ([trans_group_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_mrtransid_adj]
    ON [dbo].[trans_group]([mrtransid_adj] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_mrtransid_pay]
    ON [dbo].[trans_group]([mrtransid_pay] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_mrtransid_opc]
    ON [dbo].[trans_group]([mrtransid_opc] ASC) WITH (FILLFACTOR = 90);


GO

