CREATE TABLE [dbo].[appr_notice_config_maint] (
    [notice_yr]              NUMERIC (4)  NOT NULL,
    [notice_line1]           VARCHAR (60) NULL,
    [notice_line2]           VARCHAR (60) NULL,
    [notice_line3]           VARCHAR (60) NULL,
    [arb_hearing_dt]         DATETIME     NULL,
    [arb_protest_due_dt]     DATETIME     NULL,
    [arb_location]           VARCHAR (45) NULL,
    [print_prop_id_19a]      CHAR (1)     NULL,
    [print_prior_year_19a]   CHAR (1)     NULL,
    [print_appraiser_19a]    CHAR (1)     NULL,
    [print_tax_due_19a]      CHAR (1)     NULL,
    [print_land_imprv_19i]   CHAR (1)     NULL,
    [print_freeze_19i]       CHAR (1)     NULL,
    [print_prior_year_19i]   CHAR (1)     NULL,
    [print_appraiser_19i]    CHAR (1)     NULL,
    [notice_of_protest_flag] VARCHAR (1)  NULL,
    [print_hs_cap_value_19a] CHAR (1)     NULL,
    [print_freeze_year_19a]  CHAR (1)     NULL,
    [print_id_type_19a]      INT          NULL,
    [notice_line4]           VARCHAR (60) NULL,
    [notice_line5]           VARCHAR (60) NULL,
    [notice_line6]           VARCHAR (60) NULL,
    [main_phone]             VARCHAR (20) NULL,
    [direct_phone]           VARCHAR (20) NULL,
    [fax]                    VARCHAR (20) NULL,
    [email]                  VARCHAR (50) NULL,
    CONSTRAINT [CPK_appr_notice_config_maint] PRIMARY KEY CLUSTERED ([notice_yr] ASC) WITH (FILLFACTOR = 100)
);


GO

