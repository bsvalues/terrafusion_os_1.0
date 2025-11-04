CREATE TABLE [dbo].[prelim_owner] (
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
    CONSTRAINT [CPK_prelim_owner] PRIMARY KEY CLUSTERED ([owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC) WITH (FILLFACTOR = 95)
);


GO

