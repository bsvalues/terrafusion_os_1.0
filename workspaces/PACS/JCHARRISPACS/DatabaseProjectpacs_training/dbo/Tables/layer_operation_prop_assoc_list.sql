CREATE TABLE [dbo].[layer_operation_prop_assoc_list] (
    [lGeneralRunID] INT         NOT NULL,
    [lYear_From]    NUMERIC (4) NOT NULL,
    [lSupNum_From]  INT         NOT NULL,
    [lPropID_From]  INT         NOT NULL,
    [lYear_To]      NUMERIC (4) NULL,
    [lSupNum_To]    INT         NULL,
    [lPropID_To]    INT         NULL,
    CONSTRAINT [CFK_layer_operation_prop_assoc_list_lGeneralRunID] FOREIGN KEY ([lGeneralRunID]) REFERENCES [dbo].[general_run_id] ([lGeneralRunID]) ON DELETE CASCADE
);


GO

CREATE CLUSTERED INDEX [idx_lGeneralRunID_lYear_From_lSupNum_From_lPropID_From]
    ON [dbo].[layer_operation_prop_assoc_list]([lGeneralRunID] ASC, [lYear_From] ASC, [lSupNum_From] ASC, [lPropID_From] ASC) WITH (FILLFACTOR = 90);


GO

