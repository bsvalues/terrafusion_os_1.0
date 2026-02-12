CREATE TABLE [dbo].[mineral_property_cv] (
    [prop_id]         INT              NOT NULL,
    [owner_id]        INT              NOT NULL,
    [prop_val_yr]     NUMERIC (4)      NOT NULL,
    [pp_seg_id]       INT              NOT NULL,
    [owner_no]        VARCHAR (20)     NULL,
    [field_cd]        VARCHAR (20)     NULL,
    [mineral_zone]    VARCHAR (20)     NULL,
    [rr_comm_num]     VARCHAR (20)     NULL,
    [lease_id]        VARCHAR (20)     NULL,
    [lease_nm]        VARCHAR (50)     NULL,
    [opr]             VARCHAR (30)     NULL,
    [type_of_int]     CHAR (5)         NULL,
    [well_type]       VARCHAR (20)     NULL,
    [geo_info]        VARCHAR (50)     NULL,
    [barrels_per_day] NUMERIC (18)     NULL,
    [mineral_int_pct] NUMERIC (13, 10) NULL,
    [new_val]         NUMERIC (14)     NULL,
    [geo_id]          VARCHAR (50)     NULL,
    [legal_desc]      VARCHAR (255)    NULL,
    [value]           NUMERIC (14)     NULL,
    [source]          VARCHAR (30)     NULL,
    [prop_create_dt]  DATETIME         NULL,
    [prop_type_cd]    CHAR (5)         NULL,
    [state_cd]        CHAR (5)         NULL,
    [seq_no]          CHAR (5)         NULL,
    [ref_id1]         VARCHAR (30)     NULL,
    [xref]            VARCHAR (25)     NULL,
    [new]             CHAR (1)         NULL
);


GO

CREATE CLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_property_cv]([xref] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id_owner_id_prop_val_yr]
    ON [dbo].[mineral_property_cv]([prop_id] ASC, [owner_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 90);


GO

