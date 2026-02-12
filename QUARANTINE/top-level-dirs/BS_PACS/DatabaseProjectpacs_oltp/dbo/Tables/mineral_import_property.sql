CREATE TABLE [dbo].[mineral_import_property] (
    [run_id]                  INT              NOT NULL,
    [prop_id]                 INT              NOT NULL,
    [owner_id]                INT              NOT NULL,
    [prop_val_yr]             NUMERIC (4)      NOT NULL,
    [pp_seg_id]               INT              NOT NULL,
    [owner_no]                VARCHAR (20)     NULL,
    [field_cd]                VARCHAR (20)     NULL,
    [mineral_zone]            VARCHAR (20)     NULL,
    [rr_comm_num]             VARCHAR (20)     NULL,
    [lease_id]                VARCHAR (20)     NULL,
    [lease_nm]                VARCHAR (50)     NULL,
    [opr]                     VARCHAR (30)     NULL,
    [type_of_int]             CHAR (5)         NULL,
    [well_type]               VARCHAR (20)     NULL,
    [geo_info]                VARCHAR (50)     NULL,
    [barrels_per_day]         NUMERIC (18)     NULL,
    [mineral_int_pct]         NUMERIC (13, 10) NULL,
    [new_val]                 NUMERIC (14)     NULL,
    [geo_id]                  VARCHAR (50)     NULL,
    [legal_desc]              VARCHAR (255)    NULL,
    [value]                   NUMERIC (14)     NULL,
    [source]                  VARCHAR (30)     NULL,
    [prop_create_dt]          DATETIME         NULL,
    [prop_type_cd]            CHAR (5)         NULL,
    [state_cd]                CHAR (5)         NULL,
    [seq_no]                  CHAR (5)         NULL,
    [ref_id1]                 VARCHAR (30)     NULL,
    [xref]                    VARCHAR (50)     NULL,
    [new]                     CHAR (1)         NULL,
    [new_prop_id]             INT              NULL,
    [appr_company_id]         INT              NULL,
    [agent_code]              VARCHAR (20)     NULL,
    [agent_id]                INT              NULL,
    [rendered_date]           DATETIME         NULL,
    [agent_arb_mailings]      CHAR (1)         NULL,
    [agent_ca_mailings]       CHAR (1)         NULL,
    [agent_ent_mailings]      CHAR (1)         NULL,
    [agent_auth_to_protest]   CHAR (1)         NULL,
    [agent_auth_to_resolve]   CHAR (1)         NULL,
    [agent_auth_confidential] CHAR (1)         NULL,
    [agent_auth_other]        CHAR (1)         NULL,
    [rendition_extension_1]   VARCHAR (5)      NULL,
    [rendition_extension_2]   VARCHAR (5)      NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_import_property]([xref] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_agent_code]
    ON [dbo].[mineral_import_property]([agent_code] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_geo_id]
    ON [dbo].[mineral_import_property]([geo_id] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_state_cd]
    ON [dbo].[mineral_import_property]([state_cd] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_owner_no]
    ON [dbo].[mineral_import_property]([owner_no] ASC);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_property]([run_id] ASC);


GO

