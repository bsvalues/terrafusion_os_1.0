CREATE TABLE [dbo].[integrity_check_results] (
    [result_id]  INT          IDENTITY (1, 1) NOT NULL,
    [batch_id]   INT          NOT NULL,
    [check_cd]   VARCHAR (15) NULL,
    [prop_id]    INT          NOT NULL,
    [year]       INT          NOT NULL,
    [entity_id]  INT          NOT NULL,
    [owner_id]   INT          NOT NULL,
    [sup_num]    INT          NOT NULL,
    [corrected]  BIT          CONSTRAINT [CDF_integrity_check_results_corrected] DEFAULT (0) NOT NULL,
    [irrelevant] BIT          CONSTRAINT [CDF_integrity_check_results_irrelevant] DEFAULT (0) NOT NULL,
    [ic_ref_id]  INT          NULL,
    CONSTRAINT [CPK_integrity_check_results] PRIMARY KEY CLUSTERED ([result_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_integrity_check_results_batch_id] FOREIGN KEY ([batch_id]) REFERENCES [dbo].[integrity_check_history] ([batch_id]),
    CONSTRAINT [CFK_integrity_check_results_check_cd] FOREIGN KEY ([check_cd]) REFERENCES [dbo].[integrity_check_definition] ([check_cd])
);


GO

