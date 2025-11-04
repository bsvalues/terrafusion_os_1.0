CREATE TABLE [dbo].[_steve_owner_20230720] (
    [owner_id]             INT              NOT NULL,
    [owner_tax_yr]         NUMERIC (4)      NOT NULL,
    [prop_id]              INT              NOT NULL,
    [updt_dt]              DATETIME         NOT NULL,
    [pct_ownership]        NUMERIC (13, 10) NULL,
    [owner_cmnt]           VARCHAR (255)    NULL,
    [over_65_defer]        CHAR (1)         NULL,
    [over_65_date]         DATETIME         NULL,
    [ag_app_filed]         CHAR (1)         NULL,
    [apply_pct_exemptions] CHAR (1)         NULL,
    [sup_num]              INT              NOT NULL,
    [type_of_int]          CHAR (5)         NULL,
    [hs_prop]              CHAR (1)         NULL,
    [birth_dt]             DATETIME         NULL,
    [roll_exemption]       VARCHAR (500)    NULL,
    [roll_state_code]      VARCHAR (500)    NULL,
    [roll_entity]          VARCHAR (500)    NULL,
    [pct_imprv_hs]         NUMERIC (13, 10) NULL,
    [pct_imprv_nhs]        NUMERIC (13, 10) NULL,
    [pct_land_hs]          NUMERIC (13, 10) NULL,
    [pct_land_nhs]         NUMERIC (13, 10) NULL,
    [pct_ag_use]           NUMERIC (13, 10) NULL,
    [pct_ag_mkt]           NUMERIC (13, 10) NULL,
    [pct_tim_use]          NUMERIC (13, 10) NULL,
    [pct_tim_mkt]          NUMERIC (13, 10) NULL,
    [pct_pers_prop]        NUMERIC (13, 10) NULL,
    [udi_child_prop_id]    INT              NULL,
    [percent_type]         VARCHAR (5)      NULL,
    [pct_ag_use_hs]        NUMERIC (13, 10) NULL,
    [pct_ag_mkt_hs]        NUMERIC (13, 10) NULL,
    [pct_tim_use_hs]       NUMERIC (13, 10) NULL,
    [pct_tim_mkt_hs]       NUMERIC (13, 10) NULL,
    [linked_cd]            VARCHAR (10)     NULL
);


GO

