CREATE TABLE [dbo].[_clientdb_imprv_det_sketch] (
    [prop_id]            INT             NOT NULL,
    [prop_val_yr]        NUMERIC (4)     NOT NULL,
    [imprv_det_type_cd]  VARCHAR (10)    NULL,
    [imprv_det_typ_desc] VARCHAR (50)    NULL,
    [imprv_det_area]     NUMERIC (18, 1) NULL,
    [sketch_cmds]        VARCHAR (1800)  NULL,
    [living_area]        NUMERIC (18, 1) NULL
);


GO

CREATE CLUSTERED INDEX [IX__clientdb_imprv_det_sketch]
    ON [dbo].[_clientdb_imprv_det_sketch]([prop_val_yr] ASC, [prop_id] ASC);


GO

