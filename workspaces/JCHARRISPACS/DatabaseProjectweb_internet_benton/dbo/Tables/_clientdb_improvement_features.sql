CREATE TABLE [dbo].[_clientdb_improvement_features] (
    [prop_id]         INT          NOT NULL,
    [prop_val_yr]     NUMERIC (4)  NOT NULL,
    [imprv_id]        INT          NOT NULL,
    [imprv_det_id]    INT          NULL,
    [imprv_attr_desc] VARCHAR (50) NULL,
    [i_attr_val_cd]   VARCHAR (75) NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_improvement_features]
    ON [dbo].[_clientdb_improvement_features]([prop_val_yr] ASC, [prop_id] ASC, [imprv_id] ASC);


GO

