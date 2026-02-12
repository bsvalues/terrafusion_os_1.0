CREATE TABLE [dbo].[prelim_property_exemption] (
    [prop_id]            INT            NOT NULL,
    [owner_id]           INT            NOT NULL,
    [exmpt_tax_yr]       NUMERIC (4)    NOT NULL,
    [owner_tax_yr]       NUMERIC (4)    NOT NULL,
    [prop_type_cd]       CHAR (5)       NOT NULL,
    [exmpt_type_cd]      VARCHAR (10)   NOT NULL,
    [applicant_nm]       VARCHAR (70)   NULL,
    [birth_dt]           DATETIME       NULL,
    [spouse_birth_dt]    DATETIME       NULL,
    [prop_exmpt_dl_num]  VARCHAR (20)   NULL,
    [prop_exmpt_ss_num]  VARCHAR (11)   NULL,
    [effective_dt]       DATETIME       NULL,
    [termination_dt]     DATETIME       NULL,
    [apply_pct_owner]    NUMERIC (5, 2) NULL,
    [sup_num]            INT            NOT NULL,
    [effective_tax_yr]   NUMERIC (4)    NULL,
    [qualify_yr]         NUMERIC (4)    NULL,
    [sp_date_approved]   DATETIME       NULL,
    [sp_expiration_date] DATETIME       NULL,
    [sp_comment]         VARCHAR (5000) NULL,
    [sp_value_type]      CHAR (1)       NULL,
    [sp_value_option]    CHAR (1)       NULL,
    CONSTRAINT [CPK_prelim_property_exemption] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

