CREATE TABLE [dbo].[income] (
    [income_id]                      INT             NOT NULL,
    [sup_num]                        INT             NOT NULL,
    [income_yr]                      NUMERIC (4)     NOT NULL,
    [GBA]                            NUMERIC (14)    NULL,
    [NRA]                            NUMERIC (14)    NULL,
    [TAX]                            NUMERIC (14, 2) NULL,
    [override_tax]                   CHAR (1)        NULL,
    [override_gba]                   CHAR (1)        NULL,
    [DC_LA]                          NUMERIC (14)    NULL,
    [DC_VA]                          NUMERIC (14)    NULL,
    [DC_BE]                          NUMERIC (5, 2)  NULL,
    [DC_OR]                          NUMERIC (5, 2)  NULL,
    [DC_VR]                          NUMERIC (5, 2)  NULL,
    [DC_LARate]                      NUMERIC (14, 2) NULL,
    [DC_VARate]                      NUMERIC (14, 2) NULL,
    [DC_LI]                          NUMERIC (14)    NULL,
    [DC_VI]                          NUMERIC (14)    NULL,
    [DC_GPI]                         NUMERIC (14)    NULL,
    [DC_GPIVR]                       NUMERIC (5, 2)  NULL,
    [DC_GPIVI]                       NUMERIC (14)    NULL,
    [DC_GPICLR]                      NUMERIC (5, 2)  NULL,
    [DC_GPICLI]                      NUMERIC (14)    NULL,
    [DC_GPIRER]                      NUMERIC (5, 2)  NULL,
    [DC_GPIRE]                       NUMERIC (14)    NULL,
    [DC_GPISIR]                      NUMERIC (5, 2)  NULL,
    [DC_GPISI]                       NUMERIC (14)    NULL,
    [DC_EGI]                         NUMERIC (14)    NULL,
    [DC_EXPOEI]                      NUMERIC (14)    NULL,
    [DC_MGMTR]                       NUMERIC (5, 2)  NULL,
    [DC_MGMTI]                       NUMERIC (14)    NULL,
    [DC_RRR]                         NUMERIC (5, 2)  NULL,
    [DC_RRI]                         NUMERIC (14)    NULL,
    [DC_TIR]                         NUMERIC (5, 2)  NULL,
    [DC_TII]                         NUMERIC (14)    NULL,
    [DC_LCR]                         NUMERIC (5, 2)  NULL,
    [DC_LCI]                         NUMERIC (14)    NULL,
    [DC_EXP]                         NUMERIC (14)    NULL,
    [DC_NOI]                         NUMERIC (14)    NULL,
    [DC_CAPR]                        NUMERIC (5, 2)  NULL,
    [DC_CAPI]                        NUMERIC (14)    NULL,
    [DC_PERS]                        NUMERIC (14)    NULL,
    [DC_IND]                         NUMERIC (14)    NULL,
    [DC_GPIRSF]                      NUMERIC (14, 2) NULL,
    [DC_GPIVRSF]                     NUMERIC (14, 2) NULL,
    [DC_GPICLRSF]                    NUMERIC (14, 2) NULL,
    [DC_GPIRERSF]                    NUMERIC (14, 2) NULL,
    [DC_GPISIRSF]                    NUMERIC (14, 2) NULL,
    [DC_EGIRSF]                      NUMERIC (14, 2) NULL,
    [DC_EGIPCTREV]                   NUMERIC (5, 2)  NULL,
    [DC_EXPOERSF]                    NUMERIC (14, 2) NULL,
    [DC_EXPTAXRSF]                   NUMERIC (14, 2) NULL,
    [DC_EXPMGMTRSF]                  NUMERIC (14, 2) NULL,
    [DC_RRRSF]                       NUMERIC (14, 2) NULL,
    [DC_EXPTIRSF]                    NUMERIC (14, 2) NULL,
    [DC_EXPLCRSF]                    NUMERIC (14, 2) NULL,
    [DC_EXPRSF]                      NUMERIC (14, 2) NULL,
    [DC_EXPPCTREV]                   NUMERIC (5, 2)  NULL,
    [DC_NOIRSF]                      NUMERIC (14, 2) NULL,
    [DC_NOIPCTREV]                   NUMERIC (5, 2)  NULL,
    [SCH_LA]                         NUMERIC (14)    NULL,
    [SCH_VA]                         NUMERIC (14)    NULL,
    [SCH_BE]                         NUMERIC (5, 2)  NULL,
    [SCH_OR]                         NUMERIC (5, 2)  NULL,
    [SCH_VR]                         NUMERIC (5, 2)  NULL,
    [SCH_LARate]                     NUMERIC (14, 2) NULL,
    [SCH_VARate]                     NUMERIC (14, 2) NULL,
    [SCH_LI]                         NUMERIC (14)    NULL,
    [SCH_VI]                         NUMERIC (14)    NULL,
    [SCH_GPI]                        NUMERIC (14)    NULL,
    [SCH_GPIVR]                      NUMERIC (5, 2)  NULL,
    [SCH_GPIVI]                      NUMERIC (14)    NULL,
    [SCH_GPICLR]                     NUMERIC (5, 2)  NULL,
    [SCH_GPICLI]                     NUMERIC (14)    NULL,
    [SCH_GPIRER]                     NUMERIC (5, 2)  NULL,
    [SCH_GPIRE]                      NUMERIC (14)    NULL,
    [SCH_GPISIR]                     NUMERIC (5, 2)  NULL,
    [SCH_GPISI]                      NUMERIC (14)    NULL,
    [SCH_EGI]                        NUMERIC (14)    NULL,
    [SCH_EXPOEI]                     NUMERIC (14)    NULL,
    [SCH_MGMTR]                      NUMERIC (5, 2)  NULL,
    [SCH_MGMTI]                      NUMERIC (14)    NULL,
    [SCH_RRR]                        NUMERIC (5, 2)  NULL,
    [SCH_RRI]                        NUMERIC (14)    NULL,
    [SCH_TIR]                        NUMERIC (5, 2)  NULL,
    [SCH_TII]                        NUMERIC (14)    NULL,
    [SCH_LCR]                        NUMERIC (5, 2)  NULL,
    [SCH_LCI]                        NUMERIC (14)    NULL,
    [SCH_EXP]                        NUMERIC (14)    NULL,
    [SCH_NOI]                        NUMERIC (14)    NULL,
    [SCH_CAPR]                       NUMERIC (5, 2)  NULL,
    [SCH_CAPI]                       NUMERIC (14)    NULL,
    [SCH_PERS]                       NUMERIC (14)    NULL,
    [SCH_IND]                        NUMERIC (14)    NULL,
    [SCH_GPIRSF]                     NUMERIC (14, 2) NULL,
    [SCH_GPIVRSF]                    NUMERIC (14, 2) NULL,
    [SCH_GPICLRSF]                   NUMERIC (14, 2) NULL,
    [SCH_GPIRERSF]                   NUMERIC (14, 2) NULL,
    [SCH_GPISIRSF]                   NUMERIC (14, 2) NULL,
    [SCH_EGIRSF]                     NUMERIC (14, 2) NULL,
    [SCH_EGIPCTREV]                  NUMERIC (5, 2)  NULL,
    [SCH_EXPOERSF]                   NUMERIC (14, 2) NULL,
    [SCH_EXPTAXRSF]                  NUMERIC (14, 2) NULL,
    [SCH_EXPMGMTRSF]                 NUMERIC (14, 2) NULL,
    [SCH_RRRSF]                      NUMERIC (14, 2) NULL,
    [SCH_EXPTIRSF]                   NUMERIC (14, 2) NULL,
    [SCH_EXPLCRSF]                   NUMERIC (14, 2) NULL,
    [SCH_EXPRSF]                     NUMERIC (14, 2) NULL,
    [SCH_EXPPCTREV]                  NUMERIC (5, 2)  NULL,
    [SCH_NOIRSF]                     NUMERIC (14, 2) NULL,
    [SCH_NOIPCTREV]                  NUMERIC (5, 2)  NULL,
    [PF_LA]                          NUMERIC (14)    NULL,
    [PF_VA]                          NUMERIC (14)    NULL,
    [PF_BE]                          NUMERIC (5, 2)  NULL,
    [PF_OR]                          NUMERIC (5, 2)  NULL,
    [PF_VR]                          NUMERIC (5, 2)  NULL,
    [PF_LARate]                      NUMERIC (14, 2) NULL,
    [PF_VARate]                      NUMERIC (14, 2) NULL,
    [PF_LI]                          NUMERIC (14)    NULL,
    [PF_VI]                          NUMERIC (14)    NULL,
    [PF_GPI]                         NUMERIC (14)    NULL,
    [PF_GPIVR]                       NUMERIC (5, 2)  NULL,
    [PF_GPIVI]                       NUMERIC (14)    NULL,
    [PF_GPICLR]                      NUMERIC (5, 2)  NULL,
    [PF_GPICLI]                      NUMERIC (14)    NULL,
    [PF_GPIRER]                      NUMERIC (5, 2)  NULL,
    [PF_GPIRE]                       NUMERIC (14)    NULL,
    [PF_GPISIR]                      NUMERIC (5, 2)  NULL,
    [PF_GPISI]                       NUMERIC (14)    NULL,
    [PF_EGI]                         NUMERIC (14)    NULL,
    [PF_EXPOEI]                      NUMERIC (14)    NULL,
    [PF_MGMTR]                       NUMERIC (5, 2)  NULL,
    [PF_MGMTI]                       NUMERIC (14)    NULL,
    [PF_RRR]                         NUMERIC (5, 2)  NULL,
    [PF_RRI]                         NUMERIC (14)    NULL,
    [PF_TIR]                         NUMERIC (5, 2)  NULL,
    [PF_TII]                         NUMERIC (14)    NULL,
    [PF_LCR]                         NUMERIC (5, 2)  NULL,
    [PF_LCI]                         NUMERIC (14)    NULL,
    [PF_EXP]                         NUMERIC (14)    NULL,
    [PF_NOI]                         NUMERIC (14)    NULL,
    [PF_CAPR]                        NUMERIC (5, 2)  NULL,
    [PF_CAPI]                        NUMERIC (14)    NULL,
    [PF_PERS]                        NUMERIC (14)    NULL,
    [PF_IND]                         NUMERIC (14)    NULL,
    [PF_GPIRSF]                      NUMERIC (14, 2) NULL,
    [PF_GPIVRSF]                     NUMERIC (14, 2) NULL,
    [PF_GPICLRSF]                    NUMERIC (14, 2) NULL,
    [PF_GPIRERSF]                    NUMERIC (14, 2) NULL,
    [PF_GPISIRSF]                    NUMERIC (14, 2) NULL,
    [PF_EGIRSF]                      NUMERIC (14, 2) NULL,
    [PF_EGIPCTREV]                   NUMERIC (5, 2)  NULL,
    [PF_EXPOERSF]                    NUMERIC (14, 2) NULL,
    [PF_EXPTAXRSF]                   NUMERIC (14, 2) NULL,
    [PF_EXPMGMTRSF]                  NUMERIC (14, 2) NULL,
    [PF_RRRSF]                       NUMERIC (14, 2) NULL,
    [PF_EXPTIRSF]                    NUMERIC (14, 2) NULL,
    [PF_EXPLCRSF]                    NUMERIC (14, 2) NULL,
    [PF_EXPRSF]                      NUMERIC (14, 2) NULL,
    [PF_EXPPCTREV]                   NUMERIC (5, 2)  NULL,
    [PF_NOIRSF]                      NUMERIC (14, 2) NULL,
    [PF_NOIPCTREV]                   NUMERIC (5, 2)  NULL,
    [flat_value]                     NUMERIC (14)    NULL,
    [econ_area]                      VARCHAR (10)    NULL,
    [prop_type_cd]                   VARCHAR (10)    NULL,
    [class]                          VARCHAR (10)    NULL,
    [level_cd]                       VARCHAR (10)    NULL,
    [yr_blt]                         NUMERIC (4)     NULL,
    [stories]                        VARCHAR (10)    NULL,
    [prop_name]                      VARCHAR (50)    NULL,
    [comment]                        VARCHAR (255)   NULL,
    [value_method]                   VARCHAR (5)     NULL,
    [income_value]                   NUMERIC (14)    NULL,
    [lease_company]                  VARCHAR (50)    NULL,
    [lease_contact]                  VARCHAR (50)    NULL,
    [lease_address]                  VARCHAR (150)   NULL,
    [lease_phone]                    VARCHAR (25)    NULL,
    [lease_fax]                      VARCHAR (25)    NULL,
    [lease_email]                    VARCHAR (25)    NULL,
    [lease_survery_dt]               DATETIME        NULL,
    [recalc_flag]                    CHAR (1)        NULL,
    [pf_input_ocr]                   NUMERIC (5, 2)  NULL,
    [pf_input_mgmtr]                 NUMERIC (5, 2)  NULL,
    [pf_input_exp_rsf]               NUMERIC (14, 2) NULL,
    [pf_input_si_rsf]                NUMERIC (5, 2)  NULL,
    [pf_input_tir]                   NUMERIC (5, 2)  NULL,
    [pf_input_rrr]                   NUMERIC (5, 2)  NULL,
    [pf_input_capr]                  NUMERIC (5, 2)  NULL,
    [pf_input_lease_rsf]             NUMERIC (14, 2) NULL,
    [pf_date]                        DATETIME        NULL,
    [pf_prop_name]                   VARCHAR (100)   NULL,
    [DC_TAX]                         NUMERIC (14)    NULL,
    [SCH_TAX]                        NUMERIC (14)    NULL,
    [PF_TAX]                         NUMERIC (14)    NULL,
    [override_dc_tax]                CHAR (1)        NULL,
    [override_sch_tax]               CHAR (1)        NULL,
    [override_pf_tax]                CHAR (1)        NULL,
    [land_ratio]                     NUMERIC (14, 5) NULL,
    [land_ratio_typical]             NUMERIC (14, 5) NULL,
    [land_rsf]                       NUMERIC (14, 2) NULL,
    [land_size]                      NUMERIC (18, 4) NULL,
    [land_excess_value]              NUMERIC (14)    NULL,
    [lu_rent_loss_area]              NUMERIC (14)    NULL,
    [lu_rent_sf]                     NUMERIC (14, 2) NULL,
    [lu_rent_num_year]               NUMERIC (5, 2)  NULL,
    [lu_rent_total]                  NUMERIC (14)    NULL,
    [lu_lease_pct]                   NUMERIC (5, 2)  NULL,
    [lu_lease_total]                 NUMERIC (14)    NULL,
    [lu_tfo_sf]                      NUMERIC (14, 2) NULL,
    [lu_tfo_total]                   NUMERIC (14)    NULL,
    [lu_disc_rate]                   NUMERIC (5, 2)  NULL,
    [lu_num_year]                    NUMERIC (5, 2)  NULL,
    [lu_cost]                        NUMERIC (14)    NULL,
    [dc_ind_rsf]                     NUMERIC (14, 2) NULL,
    [sch_ind_rsf]                    NUMERIC (14, 2) NULL,
    [pf_ind_rsf]                     NUMERIC (14, 2) NULL,
    [dc_ocr_rsf]                     NUMERIC (14, 2) NULL,
    [sch_ocr_rsf]                    NUMERIC (14, 2) NULL,
    [pf_ocr_rsf]                     NUMERIC (14, 2) NULL,
    [dc_ocr_runit]                   NUMERIC (14, 2) NULL,
    [sch_ocr_runit]                  NUMERIC (14, 2) NULL,
    [pf_ocr_runit]                   NUMERIC (14, 2) NULL,
    [dc_ind_runit]                   NUMERIC (14, 2) NULL,
    [sch_ind_runit]                  NUMERIC (14, 2) NULL,
    [pf_ind_runit]                   NUMERIC (14, 2) NULL,
    [num_units]                      NUMERIC (14)    NULL,
    [override_num_units]             CHAR (1)        NULL,
    [lu_override_cost]               CHAR (1)        NULL,
    [pf_input_VARate]                NUMERIC (14, 2) NULL,
    [expense_structure_cd]           VARCHAR (10)    NULL,
    [lease_type_cd]                  VARCHAR (10)    NULL,
    [rent_type_cd]                   VARCHAR (10)    NULL,
    [pf_input_clr]                   NUMERIC (5, 2)  NULL,
    [pf_input_rer]                   NUMERIC (5, 2)  NULL,
    [pf_input_lcr]                   NUMERIC (5, 2)  NULL,
    [include_in_pf]                  CHAR (1)        NULL,
    [tsRowVersion]                   ROWVERSION      NOT NULL,
    [DC_other_value]                 NUMERIC (14)    CONSTRAINT [CDF_income_DC_other_value] DEFAULT ((0)) NOT NULL,
    [DC_other_value_comment]         VARCHAR (255)   NULL,
    [DC_base_indicated_value]        NUMERIC (14)    CONSTRAINT [CDF_income_DC_base_indicated_value] DEFAULT ((0)) NOT NULL,
    [SCH_other_value]                NUMERIC (14)    CONSTRAINT [CDF_income_SCH_other_value] DEFAULT ((0)) NOT NULL,
    [SCH_other_value_comment]        VARCHAR (255)   NULL,
    [SCH_base_indicated_value]       NUMERIC (14)    CONSTRAINT [CDF_income_SCH_base_indicated_value] DEFAULT ((0)) NOT NULL,
    [PF_other_value]                 NUMERIC (14)    CONSTRAINT [CDF_income_PF_other_value] DEFAULT ((0)) NOT NULL,
    [PF_other_value_comment]         VARCHAR (255)   NULL,
    [PF_base_indicated_value]        NUMERIC (14)    CONSTRAINT [CDF_income_PF_base_indicated_value] DEFAULT ((0)) NOT NULL,
    [include_in_grm_gim]             BIT             CONSTRAINT [CDF_income_include_in_grm_gim] DEFAULT ((0)) NOT NULL,
    [non_income_land_imps_value]     NUMERIC (14)    CONSTRAINT [CDF_income_non_income_land_imps_value] DEFAULT ((0)) NOT NULL,
    [non_income_land_value]          NUMERIC (14)    CONSTRAINT [CDF_income_non_income_land_value] DEFAULT ((0)) NOT NULL,
    [non_income_imprv_value]         NUMERIC (14)    CONSTRAINT [CDF_income_non_income_imprv_value] DEFAULT ((0)) NOT NULL,
    [other_land_value]               NUMERIC (14)    CONSTRAINT [CDF_income_other_land_value] DEFAULT ((0)) NOT NULL,
    [schil_grid_static]              BIT             CONSTRAINT [CDF_income_schil_grid_static] DEFAULT ((0)) NOT NULL,
    [schil_override_schedule_values] BIT             CONSTRAINT [CDF_income_schil_override_schedule_values] DEFAULT ((0)) NOT NULL,
    [schil_method_value]             NUMERIC (14)    CONSTRAINT [CDF_income_schil_method_value] DEFAULT ((0)) NOT NULL,
    [schil_personal_property_value]  NUMERIC (14)    CONSTRAINT [CDF_income_schil_personal_property_value] DEFAULT ((0)) NOT NULL,
    [schil_other_value]              NUMERIC (14)    CONSTRAINT [CDF_income_schil_other_value] DEFAULT ((0)) NOT NULL,
    [schil_other_value_comment]      VARCHAR (255)   NULL,
    [schil_base_indicated_value]     NUMERIC (14)    CONSTRAINT [CDF_income_schil_base_indicated_value] DEFAULT ((0)) NOT NULL,
    [schil_indicated_value]          NUMERIC (14)    CONSTRAINT [CDF_income_schil_indicated_value] DEFAULT ((0)) NOT NULL,
    [schil_indicated_land_value]     NUMERIC (14)    CONSTRAINT [CDF_income_schil_indicated_land_value] DEFAULT ((0)) NOT NULL,
    [schil_indicated_imprv_value]    NUMERIC (14)    CONSTRAINT [CDF_income_schil_indicated_imprv_value] DEFAULT ((0)) NOT NULL,
    [num_designated_units]           INT             CONSTRAINT [CDF_income_num_designated_units] DEFAULT ((0)) NOT NULL,
    [gba_designated_units]           NUMERIC (18, 1) CONSTRAINT [CDF_income_gba_designated_units] DEFAULT ((0)) NOT NULL,
    [DC_indicated_imprv_value]       NUMERIC (14)    CONSTRAINT [CDF_income_DC_indicated_imprv_value] DEFAULT ((0)) NOT NULL,
    [SCH_indicated_imprv_value]      NUMERIC (14)    CONSTRAINT [CDF_income_SCH_indicated_imprv_value] DEFAULT ((0)) NOT NULL,
    [PF_indicated_imprv_value]       NUMERIC (14)    CONSTRAINT [CDF_income_PF_indicated_imprv_value] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income] PRIMARY KEY CLUSTERED ([income_yr] ASC, [sup_num] ASC, [income_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_income_class] FOREIGN KEY ([class]) REFERENCES [dbo].[income_class] ([class_cd]),
    CONSTRAINT [CFK_income_econ_area] FOREIGN KEY ([econ_area]) REFERENCES [dbo].[income_econ_area] ([econ_cd]),
    CONSTRAINT [CFK_income_expense_structure_cd] FOREIGN KEY ([expense_structure_cd]) REFERENCES [dbo].[income_expense_structure] ([expense_structure_cd]),
    CONSTRAINT [CFK_income_lease_type_cd] FOREIGN KEY ([lease_type_cd]) REFERENCES [dbo].[income_lease_type] ([lease_type_cd]),
    CONSTRAINT [CFK_income_level_cd] FOREIGN KEY ([level_cd]) REFERENCES [dbo].[income_level] ([level_cd]),
    CONSTRAINT [CFK_income_prop_type_cd] FOREIGN KEY ([prop_type_cd]) REFERENCES [dbo].[income_prop_type] ([prop_type_cd]),
    CONSTRAINT [CFK_income_rent_type_cd] FOREIGN KEY ([rent_type_cd]) REFERENCES [dbo].[income_rent_type] ([rent_type_cd])
);


GO

 
create trigger tr_income_insert_ChangeLog
on income
for insert
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @income_id int
declare @sup_num int
declare @income_yr numeric(4,0)
declare @GBA numeric(14,0)
declare @NRA numeric(14,0)
declare @TAX numeric(14,2)
declare @override_tax char(1)
declare @override_gba char(1)
declare @DC_LA numeric(14,0)
declare @DC_VA numeric(14,0)
declare @DC_BE numeric(5,2)
declare @DC_OR numeric(5,2)
declare @DC_VR numeric(5,2)
declare @DC_LARate numeric(14,2)
declare @DC_VARate numeric(14,2)
declare @DC_LI numeric(14,0)
declare @DC_VI numeric(14,0)
declare @DC_GPI numeric(14,0)
declare @DC_GPIVR numeric(5,2)
declare @DC_GPIVI numeric(14,0)
declare @DC_GPICLR numeric(5,2)
declare @DC_GPICLI numeric(14,0)
declare @DC_GPIRER numeric(5,2)
declare @DC_GPIRE numeric(14,0)
declare @DC_GPISIR numeric(5,2)
declare @DC_GPISI numeric(14,0)
declare @DC_EGI numeric(14,0)
declare @DC_EXPOEI numeric(14,0)
declare @DC_MGMTR numeric(5,2)
declare @DC_MGMTI numeric(14,0)
declare @DC_RRR numeric(5,2)
declare @DC_RRI numeric(14,0)
declare @DC_TIR numeric(5,2)
declare @DC_TII numeric(14,0)
declare @DC_LCR numeric(5,2)
declare @DC_LCI numeric(14,0)
declare @DC_EXP numeric(14,0)
declare @DC_NOI numeric(14,0)
declare @DC_CAPR numeric(5,2)
declare @DC_CAPI numeric(14,0)
declare @DC_PERS numeric(14,0)
declare @DC_IND numeric(14,0)
declare @DC_GPIRSF numeric(14,2)
declare @DC_GPIVRSF numeric(14,2)
declare @DC_GPICLRSF numeric(14,2)
declare @DC_GPIRERSF numeric(14,2)
declare @DC_GPISIRSF numeric(14,2)
declare @DC_EGIRSF numeric(14,2)
declare @DC_EGIPCTREV numeric(5,2)
declare @DC_EXPOERSF numeric(14,2)
declare @DC_EXPTAXRSF numeric(14,2)
declare @DC_EXPMGMTRSF numeric(14,2)
declare @DC_RRRSF numeric(14,2)
declare @DC_EXPTIRSF numeric(14,2)
declare @DC_EXPLCRSF numeric(14,2)
declare @DC_EXPRSF numeric(14,2)
declare @DC_EXPPCTREV numeric(5,2)
declare @DC_NOIRSF numeric(14,2)
declare @DC_NOIPCTREV numeric(5,2)
declare @SCH_LA numeric(14,0)
declare @SCH_VA numeric(14,0)
declare @SCH_BE numeric(5,2)
declare @SCH_OR numeric(5,2)
declare @SCH_VR numeric(5,2)
declare @SCH_LARate numeric(14,2)
declare @SCH_VARate numeric(14,2)
declare @SCH_LI numeric(14,0)
declare @SCH_VI numeric(14,0)
declare @SCH_GPI numeric(14,0)
declare @SCH_GPIVR numeric(5,2)
declare @SCH_GPIVI numeric(14,0)
declare @SCH_GPICLR numeric(5,2)
declare @SCH_GPICLI numeric(14,0)
declare @SCH_GPIRER numeric(5,2)
declare @SCH_GPIRE numeric(14,0)
declare @SCH_GPISIR numeric(5,2)
declare @SCH_GPISI numeric(14,0)
declare @SCH_EGI numeric(14,0)
declare @SCH_EXPOEI numeric(14,0)
declare @SCH_MGMTR numeric(5,2)
declare @SCH_MGMTI numeric(14,0)
declare @SCH_RRR numeric(5,2)
declare @SCH_RRI numeric(14,0)
declare @SCH_TIR numeric(5,2)
declare @SCH_TII numeric(14,0)
declare @SCH_LCR numeric(5,2)
declare @SCH_LCI numeric(14,0)
declare @SCH_EXP numeric(14,0)
declare @SCH_NOI numeric(14,0)
declare @SCH_CAPR numeric(5,2)
declare @SCH_CAPI numeric(14,0)
declare @SCH_PERS numeric(14,0)
declare @SCH_IND numeric(14,0)
declare @SCH_GPIRSF numeric(14,2)
declare @SCH_GPIVRSF numeric(14,2)
declare @SCH_GPICLRSF numeric(14,2)
declare @SCH_GPIRERSF numeric(14,2)
declare @SCH_GPISIRSF numeric(14,2)
declare @SCH_EGIRSF numeric(14,2)
declare @SCH_EGIPCTREV numeric(5,2)
declare @SCH_EXPOERSF numeric(14,2)
declare @SCH_EXPTAXRSF numeric(14,2)
declare @SCH_EXPMGMTRSF numeric(14,2)
declare @SCH_RRRSF numeric(14,2)
declare @SCH_EXPTIRSF numeric(14,2)
declare @SCH_EXPLCRSF numeric(14,2)
declare @SCH_EXPRSF numeric(14,2)
declare @SCH_EXPPCTREV numeric(5,2)
declare @SCH_NOIRSF numeric(14,2)
declare @SCH_NOIPCTREV numeric(5,2)
declare @PF_LA numeric(14,0)
declare @PF_VA numeric(14,0)
declare @PF_BE numeric(5,2)
declare @PF_OR numeric(5,2)
declare @PF_VR numeric(5,2)
declare @PF_LARate numeric(14,2)
declare @PF_VARate numeric(14,2)
declare @PF_LI numeric(14,0)
declare @PF_VI numeric(14,0)
declare @PF_GPI numeric(14,0)
declare @PF_GPIVR numeric(5,2)
declare @PF_GPIVI numeric(14,0)
declare @PF_GPICLR numeric(5,2)
declare @PF_GPICLI numeric(14,0)
declare @PF_GPIRER numeric(5,2)
declare @PF_GPIRE numeric(14,0)
declare @PF_GPISIR numeric(5,2)
declare @PF_GPISI numeric(14,0)
declare @PF_EGI numeric(14,0)
declare @PF_EXPOEI numeric(14,0)
declare @PF_MGMTR numeric(5,2)
declare @PF_MGMTI numeric(14,0)
declare @PF_RRR numeric(5,2)
declare @PF_RRI numeric(14,0)
declare @PF_TIR numeric(5,2)
declare @PF_TII numeric(14,0)
declare @PF_LCR numeric(5,2)
declare @PF_LCI numeric(14,0)
declare @PF_EXP numeric(14,0)
declare @PF_NOI numeric(14,0)
declare @PF_CAPR numeric(5,2)
declare @PF_CAPI numeric(14,0)
declare @PF_PERS numeric(14,0)
declare @PF_IND numeric(14,0)
declare @PF_GPIRSF numeric(14,2)
declare @PF_GPIVRSF numeric(14,2)
declare @PF_GPICLRSF numeric(14,2)
declare @PF_GPIRERSF numeric(14,2)
declare @PF_GPISIRSF numeric(14,2)
declare @PF_EGIRSF numeric(14,2)
declare @PF_EGIPCTREV numeric(5,2)
declare @PF_EXPOERSF numeric(14,2)
declare @PF_EXPTAXRSF numeric(14,2)
declare @PF_EXPMGMTRSF numeric(14,2)
declare @PF_RRRSF numeric(14,2)
declare @PF_EXPTIRSF numeric(14,2)
declare @PF_EXPLCRSF numeric(14,2)
declare @PF_EXPRSF numeric(14,2)
declare @PF_EXPPCTREV numeric(5,2)
declare @PF_NOIRSF numeric(14,2)
declare @PF_NOIPCTREV numeric(5,2)
declare @flat_value numeric(14,0)
declare @econ_area varchar(10)
declare @prop_type_cd varchar(10)
declare @class varchar(10)
declare @level_cd varchar(10)
declare @yr_blt numeric(4,0)
declare @stories varchar(10)
declare @prop_name varchar(50)
declare @comment varchar(255)
declare @value_method varchar(5)
declare @income_value numeric(14,0)
declare @lease_company varchar(50)
declare @lease_contact varchar(50)
declare @lease_address varchar(150)
declare @lease_phone varchar(25)
declare @lease_fax varchar(25)
declare @lease_email varchar(25)
declare @lease_survery_dt datetime
declare @recalc_flag char(1)
declare @pf_input_ocr numeric(5,2)
declare @pf_input_mgmtr numeric(5,2)
declare @pf_input_exp_rsf numeric(14,2)
declare @pf_input_si_rsf numeric(5,2)
declare @pf_input_tir numeric(5,2)
declare @pf_input_rrr numeric(5,2)
declare @pf_input_capr numeric(5,2)
declare @pf_input_lease_rsf numeric(14,2)
declare @pf_date datetime
declare @pf_prop_name varchar(100)
declare @DC_TAX numeric(14,0)
declare @SCH_TAX numeric(14,0)
declare @PF_TAX numeric(14,0)
declare @override_dc_tax char(1)
declare @override_sch_tax char(1)
declare @override_pf_tax char(1)
declare @land_ratio numeric(14,5)
declare @land_ratio_typical numeric(14,5)
declare @land_rsf numeric(14,2)
declare @land_size numeric(18,4)
declare @land_excess_value numeric(14,0)
declare @lu_rent_loss_area numeric(14,0)
declare @lu_rent_sf numeric(14,2)
declare @lu_rent_num_year numeric(5,2)
declare @lu_rent_total numeric(14,0)
declare @lu_lease_pct numeric(5,2)
declare @lu_lease_total numeric(14,0)
declare @lu_tfo_sf numeric(14,2)
declare @lu_tfo_total numeric(14,0)
declare @lu_disc_rate numeric(5,2)
declare @lu_num_year numeric(5,2)
declare @lu_cost numeric(14,0)
declare @dc_ind_rsf numeric(14,2)
declare @sch_ind_rsf numeric(14,2)
declare @pf_ind_rsf numeric(14,2)
declare @dc_ocr_rsf numeric(14,2)
declare @sch_ocr_rsf numeric(14,2)
declare @pf_ocr_rsf numeric(14,2)
declare @dc_ocr_runit numeric(14,2)
declare @sch_ocr_runit numeric(14,2)
declare @pf_ocr_runit numeric(14,2)
declare @dc_ind_runit numeric(14,2)
declare @sch_ind_runit numeric(14,2)
declare @pf_ind_runit numeric(14,2)
declare @num_units numeric(14,0)
declare @override_num_units char(1)
declare @lu_override_cost char(1)
declare @pf_input_VARate numeric(14,2)
declare @expense_structure_cd varchar(10)
declare @lease_type_cd varchar(10)
declare @rent_type_cd varchar(10)
declare @pf_input_clr numeric(5,2)
declare @pf_input_rer numeric(5,2)
declare @pf_input_lcr numeric(5,2)
declare @include_in_pf char(1)
declare @DC_other_value numeric(14,0)
declare @DC_other_value_comment varchar(255)
declare @DC_base_indicated_value numeric(14,0)
declare @SCH_other_value numeric(14,0)
declare @SCH_other_value_comment varchar(255)
declare @SCH_base_indicated_value numeric(14,0)
declare @PF_other_value numeric(14,0)
declare @PF_other_value_comment varchar(255)
declare @PF_base_indicated_value numeric(14,0)
declare @include_in_grm_gim bit
declare @non_income_land_imps_value numeric(14,0)
declare @non_income_land_value numeric(14,0)
declare @non_income_imprv_value numeric(14,0)
declare @other_land_value numeric(14,0)
declare @schil_grid_static bit
declare @schil_override_schedule_values bit
declare @schil_method_value numeric(14,0)
declare @schil_personal_property_value numeric(14,0)
declare @schil_other_value numeric(14,0)
declare @schil_other_value_comment varchar(255)
declare @schil_base_indicated_value numeric(14,0)
declare @schil_indicated_value numeric(14,0)
declare @schil_indicated_land_value numeric(14,0)
declare @schil_indicated_imprv_value numeric(14,0)
 
declare curRows cursor
for
     select income_id, sup_num, case income_yr when 0 then @tvar_lFutureYear else income_yr end, GBA, NRA, TAX, override_tax, override_gba, DC_LA, DC_VA, DC_BE, DC_OR, DC_VR, DC_LARate, DC_VARate, DC_LI, DC_VI, DC_GPI, DC_GPIVR, DC_GPIVI, DC_GPICLR, DC_GPICLI, DC_GPIRER, DC_GPIRE, DC_GPISIR, DC_GPISI, DC_EGI, DC_EXPOEI, DC_MGMTR, DC_MGMTI, DC_RRR, DC_RRI, DC_TIR, DC_TII, DC_LCR, DC_LCI, DC_EXP, DC_NOI, DC_CAPR, DC_CAPI, DC_PERS, DC_IND, DC_GPIRSF, DC_GPIVRSF, DC_GPICLRSF, DC_GPIRERSF, DC_GPISIRSF, DC_EGIRSF, DC_EGIPCTREV, DC_EXPOERSF, DC_EXPTAXRSF, DC_EXPMGMTRSF, DC_RRRSF, DC_EXPTIRSF, DC_EXPLCRSF, DC_EXPRSF, DC_EXPPCTREV, DC_NOIRSF, DC_NOIPCTREV, SCH_LA, SCH_VA, SCH_BE, SCH_OR, SCH_VR, SCH_LARate, SCH_VARate, SCH_LI, SCH_VI, SCH_GPI, SCH_GPIVR, SCH_GPIVI, SCH_GPICLR, SCH_GPICLI, SCH_GPIRER, SCH_GPIRE, SCH_GPISIR, SCH_GPISI, SCH_EGI, SCH_EXPOEI, SCH_MGMTR, SCH_MGMTI, SCH_RRR, SCH_RRI, SCH_TIR, SCH_TII, SCH_LCR, SCH_LCI, SCH_EXP, SCH_NOI, SCH_CAPR, SCH_CAPI, SCH_PERS, SCH_IND, SCH_GPIRSF, SCH_GPIVRSF, SCH_GPICLRSF, SCH_GPIRERSF, SCH_GPISIRSF, SCH_EGIRSF, SCH_EGIPCTREV, SCH_EXPOERSF, SCH_EXPTAXRSF, SCH_EXPMGMTRSF, SCH_RRRSF, SCH_EXPTIRSF, SCH_EXPLCRSF, SCH_EXPRSF, SCH_EXPPCTREV, SCH_NOIRSF, SCH_NOIPCTREV, PF_LA, PF_VA, PF_BE, PF_OR, PF_VR, PF_LARate, PF_VARate, PF_LI, PF_VI, PF_GPI, PF_GPIVR, PF_GPIVI, PF_GPICLR, PF_GPICLI, PF_GPIRER, PF_GPIRE, PF_GPISIR, PF_GPISI, PF_EGI, PF_EXPOEI, PF_MGMTR, PF_MGMTI, PF_RRR, PF_RRI, PF_TIR, PF_TII, PF_LCR, PF_LCI, PF_EXP, PF_NOI, PF_CAPR, PF_CAPI, PF_PERS, PF_IND, PF_GPIRSF, PF_GPIVRSF, PF_GPICLRSF, PF_GPIRERSF, PF_GPISIRSF, PF_EGIRSF, PF_EGIPCTREV, PF_EXPOERSF, PF_EXPTAXRSF, PF_EXPMGMTRSF, PF_RRRSF, PF_EXPTIRSF, PF_EXPLCRSF, PF_EXPRSF, PF_EXPPCTREV, PF_NOIRSF, PF_NOIPCTREV, flat_value, econ_area, prop_type_cd, class, level_cd, yr_blt, stories, prop_name, comment, value_method, income_value, lease_company, lease_contact, lease_address, lease_phone, lease_fax, lease_email, lease_survery_dt, recalc_flag, pf_input_ocr, pf_input_mgmtr, pf_input_exp_rsf, pf_input_si_rsf, pf_input_tir, pf_input_rrr, pf_input_capr, pf_input_lease_rsf, pf_date, pf_prop_name, DC_TAX, SCH_TAX, PF_TAX, override_dc_tax, override_sch_tax, override_pf_tax, land_ratio, land_ratio_typical, land_rsf, land_size, land_excess_value, lu_rent_loss_area, lu_rent_sf, lu_rent_num_year, lu_rent_total, lu_lease_pct, lu_lease_total, lu_tfo_sf, lu_tfo_total, lu_disc_rate, lu_num_year, lu_cost, dc_ind_rsf, sch_ind_rsf, pf_ind_rsf, dc_ocr_rsf, sch_ocr_rsf, pf_ocr_rsf, dc_ocr_runit, sch_ocr_runit, pf_ocr_runit, dc_ind_runit, sch_ind_runit, pf_ind_runit, num_units, override_num_units, lu_override_cost, pf_input_VARate, expense_structure_cd, lease_type_cd, rent_type_cd, pf_input_clr, pf_input_rer, pf_input_lcr, include_in_pf, DC_other_value, DC_other_value_comment, DC_base_indicated_value, SCH_other_value, SCH_other_value_comment, SCH_base_indicated_value, PF_other_value, PF_other_value_comment, PF_base_indicated_value, include_in_grm_gim, non_income_land_imps_value, non_income_land_value, non_income_imprv_value, other_land_value, schil_grid_static, schil_override_schedule_values, schil_method_value, schil_personal_property_value, schil_other_value, schil_other_value_comment, schil_base_indicated_value, schil_indicated_value, schil_indicated_land_value, schil_indicated_imprv_value from inserted
for read only
 
open curRows
fetch next from curRows into @income_id, @sup_num, @income_yr, @GBA, @NRA, @TAX, @override_tax, @override_gba, @DC_LA, @DC_VA, @DC_BE, @DC_OR, @DC_VR, @DC_LARate, @DC_VARate, @DC_LI, @DC_VI, @DC_GPI, @DC_GPIVR, @DC_GPIVI, @DC_GPICLR, @DC_GPICLI, @DC_GPIRER, @DC_GPIRE, @DC_GPISIR, @DC_GPISI, @DC_EGI, @DC_EXPOEI, @DC_MGMTR, @DC_MGMTI, @DC_RRR, @DC_RRI, @DC_TIR, @DC_TII, @DC_LCR, @DC_LCI, @DC_EXP, @DC_NOI, @DC_CAPR, @DC_CAPI, @DC_PERS, @DC_IND, @DC_GPIRSF, @DC_GPIVRSF, @DC_GPICLRSF, @DC_GPIRERSF, @DC_GPISIRSF, @DC_EGIRSF, @DC_EGIPCTREV, @DC_EXPOERSF, @DC_EXPTAXRSF, @DC_EXPMGMTRSF, @DC_RRRSF, @DC_EXPTIRSF, @DC_EXPLCRSF, @DC_EXPRSF, @DC_EXPPCTREV, @DC_NOIRSF, @DC_NOIPCTREV, @SCH_LA, @SCH_VA, @SCH_BE, @SCH_OR, @SCH_VR, @SCH_LARate, @SCH_VARate, @SCH_LI, @SCH_VI, @SCH_GPI, @SCH_GPIVR, @SCH_GPIVI, @SCH_GPICLR, @SCH_GPICLI, @SCH_GPIRER, @SCH_GPIRE, @SCH_GPISIR, @SCH_GPISI, @SCH_EGI, @SCH_EXPOEI, @SCH_MGMTR, @SCH_MGMTI, @SCH_RRR, @SCH_RRI, @SCH_TIR, @SCH_TII, @SCH_LCR, @SCH_LCI, @SCH_EXP, @SCH_NOI, @SCH_CAPR, @SCH_CAPI, @SCH_PERS, @SCH_IND, @SCH_GPIRSF, @SCH_GPIVRSF, @SCH_GPICLRSF, @SCH_GPIRERSF, @SCH_GPISIRSF, @SCH_EGIRSF, @SCH_EGIPCTREV, @SCH_EXPOERSF, @SCH_EXPTAXRSF, @SCH_EXPMGMTRSF, @SCH_RRRSF, @SCH_EXPTIRSF, @SCH_EXPLCRSF, @SCH_EXPRSF, @SCH_EXPPCTREV, @SCH_NOIRSF, @SCH_NOIPCTREV, @PF_LA, @PF_VA, @PF_BE, @PF_OR, @PF_VR, @PF_LARate, @PF_VARate, @PF_LI, @PF_VI, @PF_GPI, @PF_GPIVR, @PF_GPIVI, @PF_GPICLR, @PF_GPICLI, @PF_GPIRER, @PF_GPIRE, @PF_GPISIR, @PF_GPISI, @PF_EGI, @PF_EXPOEI, @PF_MGMTR, @PF_MGMTI, @PF_RRR, @PF_RRI, @PF_TIR, @PF_TII, @PF_LCR, @PF_LCI, @PF_EXP, @PF_NOI, @PF_CAPR, @PF_CAPI, @PF_PERS, @PF_IND, @PF_GPIRSF, @PF_GPIVRSF, @PF_GPICLRSF, @PF_GPIRERSF, @PF_GPISIRSF, @PF_EGIRSF, @PF_EGIPCTREV, @PF_EXPOERSF, @PF_EXPTAXRSF, @PF_EXPMGMTRSF, @PF_RRRSF, @PF_EXPTIRSF, @PF_EXPLCRSF, @PF_EXPRSF, @PF_EXPPCTREV, @PF_NOIRSF, @PF_NOIPCTREV, @flat_value, @econ_area, @prop_type_cd, @class, @level_cd, @yr_blt, @stories, @prop_name, @comment, @value_method, @income_value, @lease_company, @lease_contact, @lease_address, @lease_phone, @lease_fax, @lease_email, @lease_survery_dt, @recalc_flag, @pf_input_ocr, @pf_input_mgmtr, @pf_input_exp_rsf, @pf_input_si_rsf, @pf_input_tir, @pf_input_rrr, @pf_input_capr, @pf_input_lease_rsf, @pf_date, @pf_prop_name, @DC_TAX, @SCH_TAX, @PF_TAX, @override_dc_tax, @override_sch_tax, @override_pf_tax, @land_ratio, @land_ratio_typical, @land_rsf, @land_size, @land_excess_value, @lu_rent_loss_area, @lu_rent_sf, @lu_rent_num_year, @lu_rent_total, @lu_lease_pct, @lu_lease_total, @lu_tfo_sf, @lu_tfo_total, @lu_disc_rate, @lu_num_year, @lu_cost, @dc_ind_rsf, @sch_ind_rsf, @pf_ind_rsf, @dc_ocr_rsf, @sch_ocr_rsf, @pf_ocr_rsf, @dc_ocr_runit, @sch_ocr_runit, @pf_ocr_runit, @dc_ind_runit, @sch_ind_runit, @pf_ind_runit, @num_units, @override_num_units, @lu_override_cost, @pf_input_VARate, @expense_structure_cd, @lease_type_cd, @rent_type_cd, @pf_input_clr, @pf_input_rer, @pf_input_lcr, @include_in_pf, @DC_other_value, @DC_other_value_comment, @DC_base_indicated_value, @SCH_other_value, @SCH_other_value_comment, @SCH_base_indicated_value, @PF_other_value, @PF_other_value_comment, @PF_base_indicated_value, @include_in_grm_gim, @non_income_land_imps_value, @non_income_land_value, @non_income_imprv_value, @other_land_value, @schil_grid_static, @schil_override_schedule_values, @schil_method_value, @schil_personal_property_value, @schil_other_value, @schil_other_value_comment, @schil_base_indicated_value, @schil_indicated_value, @schil_indicated_land_value, @schil_indicated_imprv_value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'income_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2344, null, convert(varchar(255), @income_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'income_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2357, null, convert(varchar(255), @income_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'GBA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1996, null, convert(varchar(255), @GBA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'NRA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3352, null, convert(varchar(255), @NRA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'TAX' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 5089, null, convert(varchar(255), @TAX), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'override_tax' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3468, null, convert(varchar(255), @override_tax), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'override_gba' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3460, null, convert(varchar(255), @override_gba), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_LA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1163, null, convert(varchar(255), @DC_LA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_VA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1183, null, convert(varchar(255), @DC_VA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_BE' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1131, null, convert(varchar(255), @DC_BE), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_OR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1175, null, convert(varchar(255), @DC_OR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_VR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1186, null, convert(varchar(255), @DC_VR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_LARate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1164, null, convert(varchar(255), @DC_LARate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_VARate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1184, null, convert(varchar(255), @DC_VARate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_LI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1167, null, convert(varchar(255), @DC_LI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_VI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1185, null, convert(varchar(255), @DC_VI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1146, null, convert(varchar(255), @DC_GPI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPIVR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1158, null, convert(varchar(255), @DC_GPIVR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPIVI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1157, null, convert(varchar(255), @DC_GPIVI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPICLR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1148, null, convert(varchar(255), @DC_GPICLR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPICLI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1147, null, convert(varchar(255), @DC_GPICLI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPIRER' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1151, null, convert(varchar(255), @DC_GPIRER), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPIRE' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1150, null, convert(varchar(255), @DC_GPIRE), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPISIR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1155, null, convert(varchar(255), @DC_GPISIR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPISI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1154, null, convert(varchar(255), @DC_GPISI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EGI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1134, null, convert(varchar(255), @DC_EGI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPOEI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1140, null, convert(varchar(255), @DC_EXPOEI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_MGMTR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1169, null, convert(varchar(255), @DC_MGMTR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_MGMTI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1168, null, convert(varchar(255), @DC_MGMTI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_RRR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1178, null, convert(varchar(255), @DC_RRR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_RRI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1177, null, convert(varchar(255), @DC_RRI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_TIR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1182, null, convert(varchar(255), @DC_TIR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_TII' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1181, null, convert(varchar(255), @DC_TII), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_LCR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1166, null, convert(varchar(255), @DC_LCR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_LCI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1165, null, convert(varchar(255), @DC_LCI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXP' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1137, null, convert(varchar(255), @DC_EXP), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_NOI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1170, null, convert(varchar(255), @DC_NOI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_CAPR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1133, null, convert(varchar(255), @DC_CAPR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_CAPI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1132, null, convert(varchar(255), @DC_CAPI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_PERS' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1176, null, convert(varchar(255), @DC_PERS), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_IND' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1160, null, convert(varchar(255), @DC_IND), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1153, null, convert(varchar(255), @DC_GPIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPIVRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1159, null, convert(varchar(255), @DC_GPIVRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPICLRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1149, null, convert(varchar(255), @DC_GPICLRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPIRERSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1152, null, convert(varchar(255), @DC_GPIRERSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_GPISIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1156, null, convert(varchar(255), @DC_GPISIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EGIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1136, null, convert(varchar(255), @DC_EGIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EGIPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1135, null, convert(varchar(255), @DC_EGIPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPOERSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1141, null, convert(varchar(255), @DC_EXPOERSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPTAXRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1144, null, convert(varchar(255), @DC_EXPTAXRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPMGMTRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1139, null, convert(varchar(255), @DC_EXPMGMTRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_RRRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1179, null, convert(varchar(255), @DC_RRRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPTIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1145, null, convert(varchar(255), @DC_EXPTIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPLCRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1138, null, convert(varchar(255), @DC_EXPLCRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1143, null, convert(varchar(255), @DC_EXPRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_EXPPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1142, null, convert(varchar(255), @DC_EXPPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_NOIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1172, null, convert(varchar(255), @DC_NOIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_NOIPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1171, null, convert(varchar(255), @DC_NOIPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_LA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4647, null, convert(varchar(255), @SCH_LA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_VA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4667, null, convert(varchar(255), @SCH_VA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_BE' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4615, null, convert(varchar(255), @SCH_BE), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_OR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4659, null, convert(varchar(255), @SCH_OR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_VR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4670, null, convert(varchar(255), @SCH_VR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_LARate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4648, null, convert(varchar(255), @SCH_LARate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_VARate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4668, null, convert(varchar(255), @SCH_VARate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_LI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4651, null, convert(varchar(255), @SCH_LI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_VI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4669, null, convert(varchar(255), @SCH_VI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4630, null, convert(varchar(255), @SCH_GPI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPIVR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4642, null, convert(varchar(255), @SCH_GPIVR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPIVI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4641, null, convert(varchar(255), @SCH_GPIVI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPICLR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4632, null, convert(varchar(255), @SCH_GPICLR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPICLI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4631, null, convert(varchar(255), @SCH_GPICLI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPIRER' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4635, null, convert(varchar(255), @SCH_GPIRER), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPIRE' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4634, null, convert(varchar(255), @SCH_GPIRE), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPISIR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4639, null, convert(varchar(255), @SCH_GPISIR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPISI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4638, null, convert(varchar(255), @SCH_GPISI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EGI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4618, null, convert(varchar(255), @SCH_EGI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPOEI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4624, null, convert(varchar(255), @SCH_EXPOEI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_MGMTR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4653, null, convert(varchar(255), @SCH_MGMTR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_MGMTI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4652, null, convert(varchar(255), @SCH_MGMTI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_RRR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4662, null, convert(varchar(255), @SCH_RRR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_RRI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4661, null, convert(varchar(255), @SCH_RRI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_TIR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4666, null, convert(varchar(255), @SCH_TIR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_TII' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4665, null, convert(varchar(255), @SCH_TII), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_LCR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4650, null, convert(varchar(255), @SCH_LCR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_LCI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4649, null, convert(varchar(255), @SCH_LCI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXP' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4621, null, convert(varchar(255), @SCH_EXP), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_NOI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4654, null, convert(varchar(255), @SCH_NOI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_CAPR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4617, null, convert(varchar(255), @SCH_CAPR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_CAPI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4616, null, convert(varchar(255), @SCH_CAPI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_PERS' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4660, null, convert(varchar(255), @SCH_PERS), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_IND' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4644, null, convert(varchar(255), @SCH_IND), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4637, null, convert(varchar(255), @SCH_GPIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPIVRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4643, null, convert(varchar(255), @SCH_GPIVRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPICLRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4633, null, convert(varchar(255), @SCH_GPICLRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPIRERSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4636, null, convert(varchar(255), @SCH_GPIRERSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_GPISIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4640, null, convert(varchar(255), @SCH_GPISIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EGIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4620, null, convert(varchar(255), @SCH_EGIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EGIPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4619, null, convert(varchar(255), @SCH_EGIPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPOERSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4625, null, convert(varchar(255), @SCH_EXPOERSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPTAXRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4628, null, convert(varchar(255), @SCH_EXPTAXRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPMGMTRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4623, null, convert(varchar(255), @SCH_EXPMGMTRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_RRRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4663, null, convert(varchar(255), @SCH_RRRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPTIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4629, null, convert(varchar(255), @SCH_EXPTIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPLCRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4622, null, convert(varchar(255), @SCH_EXPLCRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4627, null, convert(varchar(255), @SCH_EXPRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_EXPPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4626, null, convert(varchar(255), @SCH_EXPPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_NOIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4656, null, convert(varchar(255), @SCH_NOIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_NOIPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4655, null, convert(varchar(255), @SCH_NOIPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_LA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3698, null, convert(varchar(255), @PF_LA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_VA' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3726, null, convert(varchar(255), @PF_VA), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_BE' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3649, null, convert(varchar(255), @PF_BE), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_OR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3713, null, convert(varchar(255), @PF_OR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_VR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3730, null, convert(varchar(255), @PF_VR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_LARate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3699, null, convert(varchar(255), @PF_LARate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_VARate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3727, null, convert(varchar(255), @PF_VARate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_LI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3704, null, convert(varchar(255), @PF_LI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_VI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3728, null, convert(varchar(255), @PF_VI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3669, null, convert(varchar(255), @PF_GPI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPIVR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3681, null, convert(varchar(255), @PF_GPIVR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPIVI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3680, null, convert(varchar(255), @PF_GPIVI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPICLR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3671, null, convert(varchar(255), @PF_GPICLR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPICLI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3670, null, convert(varchar(255), @PF_GPICLI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPIRER' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3674, null, convert(varchar(255), @PF_GPIRER), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPIRE' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3673, null, convert(varchar(255), @PF_GPIRE), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPISIR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3678, null, convert(varchar(255), @PF_GPISIR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPISI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3677, null, convert(varchar(255), @PF_GPISI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EGI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3656, null, convert(varchar(255), @PF_EGI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPOEI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3663, null, convert(varchar(255), @PF_EXPOEI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_MGMTR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3707, null, convert(varchar(255), @PF_MGMTR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_MGMTI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3706, null, convert(varchar(255), @PF_MGMTI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_RRR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3720, null, convert(varchar(255), @PF_RRR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_RRI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3719, null, convert(varchar(255), @PF_RRI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_TIR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3725, null, convert(varchar(255), @PF_TIR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_TII' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3724, null, convert(varchar(255), @PF_TII), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_LCR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3701, null, convert(varchar(255), @PF_LCR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_LCI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3700, null, convert(varchar(255), @PF_LCI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXP' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3659, null, convert(varchar(255), @PF_EXP), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_NOI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3708, null, convert(varchar(255), @PF_NOI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_CAPR' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3651, null, convert(varchar(255), @PF_CAPR), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_CAPI' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3650, null, convert(varchar(255), @PF_CAPI), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_PERS' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3714, null, convert(varchar(255), @PF_PERS), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_IND' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3683, null, convert(varchar(255), @PF_IND), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3676, null, convert(varchar(255), @PF_GPIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPIVRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3682, null, convert(varchar(255), @PF_GPIVRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPICLRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3672, null, convert(varchar(255), @PF_GPICLRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPIRERSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3675, null, convert(varchar(255), @PF_GPIRERSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_GPISIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3679, null, convert(varchar(255), @PF_GPISIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EGIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3658, null, convert(varchar(255), @PF_EGIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EGIPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3657, null, convert(varchar(255), @PF_EGIPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPOERSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3664, null, convert(varchar(255), @PF_EXPOERSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPTAXRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3667, null, convert(varchar(255), @PF_EXPTAXRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPMGMTRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3662, null, convert(varchar(255), @PF_EXPMGMTRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_RRRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3721, null, convert(varchar(255), @PF_RRRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPTIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3668, null, convert(varchar(255), @PF_EXPTIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPLCRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3661, null, convert(varchar(255), @PF_EXPLCRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3666, null, convert(varchar(255), @PF_EXPRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_EXPPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3665, null, convert(varchar(255), @PF_EXPPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_NOIRSF' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3710, null, convert(varchar(255), @PF_NOIRSF), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_NOIPCTREV' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3709, null, convert(varchar(255), @PF_NOIPCTREV), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'flat_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1931, null, convert(varchar(255), @flat_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'econ_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1408, null, convert(varchar(255), @econ_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'prop_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4079, null, convert(varchar(255), @prop_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'class' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 761, null, convert(varchar(255), @class), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'level_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2811, null, convert(varchar(255), @level_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'yr_blt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 5557, null, convert(varchar(255), @yr_blt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'stories' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4958, null, convert(varchar(255), @stories), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'prop_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4048, null, convert(varchar(255), @prop_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 827, null, convert(varchar(255), @comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'value_method' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 5491, null, convert(varchar(255), @value_method), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'income_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2356, null, convert(varchar(255), @income_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_company' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2755, null, convert(varchar(255), @lease_company), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_contact' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2756, null, convert(varchar(255), @lease_contact), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_address' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2753, null, convert(varchar(255), @lease_address), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_phone' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2765, null, convert(varchar(255), @lease_phone), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_fax' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2759, null, convert(varchar(255), @lease_fax), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_email' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2758, null, convert(varchar(255), @lease_email), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_survery_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2767, null, convert(varchar(255), @lease_survery_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'recalc_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4315, null, convert(varchar(255), @recalc_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_ocr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3692, null, convert(varchar(255), @pf_input_ocr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_mgmtr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3691, null, convert(varchar(255), @pf_input_mgmtr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_exp_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3688, null, convert(varchar(255), @pf_input_exp_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_si_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3695, null, convert(varchar(255), @pf_input_si_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_tir' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3696, null, convert(varchar(255), @pf_input_tir), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_rrr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3694, null, convert(varchar(255), @pf_input_rrr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_capr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3686, null, convert(varchar(255), @pf_input_capr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_lease_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3690, null, convert(varchar(255), @pf_input_lease_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3654, null, convert(varchar(255), @pf_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_prop_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3715, null, convert(varchar(255), @pf_prop_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_TAX' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1180, null, convert(varchar(255), @DC_TAX), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_TAX' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4664, null, convert(varchar(255), @SCH_TAX), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_TAX' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3723, null, convert(varchar(255), @PF_TAX), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'override_dc_tax' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3459, null, convert(varchar(255), @override_dc_tax), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'override_sch_tax' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3467, null, convert(varchar(255), @override_sch_tax), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'override_pf_tax' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3466, null, convert(varchar(255), @override_pf_tax), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'land_ratio' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2651, null, convert(varchar(255), @land_ratio), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'land_ratio_typical' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2654, null, convert(varchar(255), @land_ratio_typical), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'land_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2655, null, convert(varchar(255), @land_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'land_size' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2672, null, convert(varchar(255), @land_size), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'land_excess_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2590, null, convert(varchar(255), @land_excess_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_rent_loss_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2967, null, convert(varchar(255), @lu_rent_loss_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_rent_sf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2969, null, convert(varchar(255), @lu_rent_sf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_rent_num_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2968, null, convert(varchar(255), @lu_rent_num_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_rent_total' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2970, null, convert(varchar(255), @lu_rent_total), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_lease_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2963, null, convert(varchar(255), @lu_lease_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_lease_total' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2964, null, convert(varchar(255), @lu_lease_total), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_tfo_sf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2971, null, convert(varchar(255), @lu_tfo_sf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_tfo_total' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2972, null, convert(varchar(255), @lu_tfo_total), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_disc_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2962, null, convert(varchar(255), @lu_disc_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_num_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2965, null, convert(varchar(255), @lu_num_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_cost' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2961, null, convert(varchar(255), @lu_cost), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'dc_ind_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1161, null, convert(varchar(255), @dc_ind_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'sch_ind_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4645, null, convert(varchar(255), @sch_ind_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_ind_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3684, null, convert(varchar(255), @pf_ind_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'dc_ocr_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1173, null, convert(varchar(255), @dc_ocr_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'sch_ocr_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4657, null, convert(varchar(255), @sch_ocr_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_ocr_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3711, null, convert(varchar(255), @pf_ocr_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'dc_ocr_runit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1174, null, convert(varchar(255), @dc_ocr_runit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'sch_ocr_runit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4658, null, convert(varchar(255), @sch_ocr_runit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_ocr_runit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3712, null, convert(varchar(255), @pf_ocr_runit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'dc_ind_runit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1162, null, convert(varchar(255), @dc_ind_runit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'sch_ind_runit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4646, null, convert(varchar(255), @sch_ind_runit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_ind_runit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3685, null, convert(varchar(255), @pf_ind_runit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'num_units' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3371, null, convert(varchar(255), @num_units), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'override_num_units' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3463, null, convert(varchar(255), @override_num_units), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lu_override_cost' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2966, null, convert(varchar(255), @lu_override_cost), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_VARate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3697, null, convert(varchar(255), @pf_input_VARate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'expense_structure_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 1840, null, convert(varchar(255), @expense_structure_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'lease_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2768, null, convert(varchar(255), @lease_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'rent_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 4382, null, convert(varchar(255), @rent_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_clr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3687, null, convert(varchar(255), @pf_input_clr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_rer' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3693, null, convert(varchar(255), @pf_input_rer), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'pf_input_lcr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 3689, null, convert(varchar(255), @pf_input_lcr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'include_in_pf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 2337, null, convert(varchar(255), @include_in_pf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_other_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9739, null, convert(varchar(255), @DC_other_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_other_value_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9740, null, convert(varchar(255), @DC_other_value_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'DC_base_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9733, null, convert(varchar(255), @DC_base_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_other_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9776, null, convert(varchar(255), @SCH_other_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_other_value_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9777, null, convert(varchar(255), @SCH_other_value_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'SCH_base_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9770, null, convert(varchar(255), @SCH_base_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_other_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9761, null, convert(varchar(255), @PF_other_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_other_value_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9762, null, convert(varchar(255), @PF_other_value_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'PF_base_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9755, null, convert(varchar(255), @PF_base_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'include_in_grm_gim' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9748, null, convert(varchar(255), @include_in_grm_gim), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'non_income_land_imps_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9751, null, convert(varchar(255), @non_income_land_imps_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'non_income_land_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9752, null, convert(varchar(255), @non_income_land_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'non_income_imprv_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9750, null, convert(varchar(255), @non_income_imprv_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'other_land_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9754, null, convert(varchar(255), @other_land_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_grid_static' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9782, null, convert(varchar(255), @schil_grid_static), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_override_schedule_values' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9789, null, convert(varchar(255), @schil_override_schedule_values), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_method_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9786, null, convert(varchar(255), @schil_method_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_personal_property_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9790, null, convert(varchar(255), @schil_personal_property_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_other_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9787, null, convert(varchar(255), @schil_other_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_other_value_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9788, null, convert(varchar(255), @schil_other_value_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_base_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9781, null, convert(varchar(255), @schil_base_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9785, null, convert(varchar(255), @schil_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_indicated_land_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9784, null, convert(varchar(255), @schil_indicated_land_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income' and
               chg_log_columns = 'schil_indicated_imprv_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 333, 9783, null, convert(varchar(255), @schil_indicated_imprv_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @income_id, @sup_num, @income_yr, @GBA, @NRA, @TAX, @override_tax, @override_gba, @DC_LA, @DC_VA, @DC_BE, @DC_OR, @DC_VR, @DC_LARate, @DC_VARate, @DC_LI, @DC_VI, @DC_GPI, @DC_GPIVR, @DC_GPIVI, @DC_GPICLR, @DC_GPICLI, @DC_GPIRER, @DC_GPIRE, @DC_GPISIR, @DC_GPISI, @DC_EGI, @DC_EXPOEI, @DC_MGMTR, @DC_MGMTI, @DC_RRR, @DC_RRI, @DC_TIR, @DC_TII, @DC_LCR, @DC_LCI, @DC_EXP, @DC_NOI, @DC_CAPR, @DC_CAPI, @DC_PERS, @DC_IND, @DC_GPIRSF, @DC_GPIVRSF, @DC_GPICLRSF, @DC_GPIRERSF, @DC_GPISIRSF, @DC_EGIRSF, @DC_EGIPCTREV, @DC_EXPOERSF, @DC_EXPTAXRSF, @DC_EXPMGMTRSF, @DC_RRRSF, @DC_EXPTIRSF, @DC_EXPLCRSF, @DC_EXPRSF, @DC_EXPPCTREV, @DC_NOIRSF, @DC_NOIPCTREV, @SCH_LA, @SCH_VA, @SCH_BE, @SCH_OR, @SCH_VR, @SCH_LARate, @SCH_VARate, @SCH_LI, @SCH_VI, @SCH_GPI, @SCH_GPIVR, @SCH_GPIVI, @SCH_GPICLR, @SCH_GPICLI, @SCH_GPIRER, @SCH_GPIRE, @SCH_GPISIR, @SCH_GPISI, @SCH_EGI, @SCH_EXPOEI, @SCH_MGMTR, @SCH_MGMTI, @SCH_RRR, @SCH_RRI, @SCH_TIR, @SCH_TII, @SCH_LCR, @SCH_LCI, @SCH_EXP, @SCH_NOI, @SCH_CAPR, @SCH_CAPI, @SCH_PERS, @SCH_IND, @SCH_GPIRSF, @SCH_GPIVRSF, @SCH_GPICLRSF, @SCH_GPIRERSF, @SCH_GPISIRSF, @SCH_EGIRSF, @SCH_EGIPCTREV, @SCH_EXPOERSF, @SCH_EXPTAXRSF, @SCH_EXPMGMTRSF, @SCH_RRRSF, @SCH_EXPTIRSF, @SCH_EXPLCRSF, @SCH_EXPRSF, @SCH_EXPPCTREV, @SCH_NOIRSF, @SCH_NOIPCTREV, @PF_LA, @PF_VA, @PF_BE, @PF_OR, @PF_VR, @PF_LARate, @PF_VARate, @PF_LI, @PF_VI, @PF_GPI, @PF_GPIVR, @PF_GPIVI, @PF_GPICLR, @PF_GPICLI, @PF_GPIRER, @PF_GPIRE, @PF_GPISIR, @PF_GPISI, @PF_EGI, @PF_EXPOEI, @PF_MGMTR, @PF_MGMTI, @PF_RRR, @PF_RRI, @PF_TIR, @PF_TII, @PF_LCR, @PF_LCI, @PF_EXP, @PF_NOI, @PF_CAPR, @PF_CAPI, @PF_PERS, @PF_IND, @PF_GPIRSF, @PF_GPIVRSF, @PF_GPICLRSF, @PF_GPIRERSF, @PF_GPISIRSF, @PF_EGIRSF, @PF_EGIPCTREV, @PF_EXPOERSF, @PF_EXPTAXRSF, @PF_EXPMGMTRSF, @PF_RRRSF, @PF_EXPTIRSF, @PF_EXPLCRSF, @PF_EXPRSF, @PF_EXPPCTREV, @PF_NOIRSF, @PF_NOIPCTREV, @flat_value, @econ_area, @prop_type_cd, @class, @level_cd, @yr_blt, @stories, @prop_name, @comment, @value_method, @income_value, @lease_company, @lease_contact, @lease_address, @lease_phone, @lease_fax, @lease_email, @lease_survery_dt, @recalc_flag, @pf_input_ocr, @pf_input_mgmtr, @pf_input_exp_rsf, @pf_input_si_rsf, @pf_input_tir, @pf_input_rrr, @pf_input_capr, @pf_input_lease_rsf, @pf_date, @pf_prop_name, @DC_TAX, @SCH_TAX, @PF_TAX, @override_dc_tax, @override_sch_tax, @override_pf_tax, @land_ratio, @land_ratio_typical, @land_rsf, @land_size, @land_excess_value, @lu_rent_loss_area, @lu_rent_sf, @lu_rent_num_year, @lu_rent_total, @lu_lease_pct, @lu_lease_total, @lu_tfo_sf, @lu_tfo_total, @lu_disc_rate, @lu_num_year, @lu_cost, @dc_ind_rsf, @sch_ind_rsf, @pf_ind_rsf, @dc_ocr_rsf, @sch_ocr_rsf, @pf_ocr_rsf, @dc_ocr_runit, @sch_ocr_runit, @pf_ocr_runit, @dc_ind_runit, @sch_ind_runit, @pf_ind_runit, @num_units, @override_num_units, @lu_override_cost, @pf_input_VARate, @expense_structure_cd, @lease_type_cd, @rent_type_cd, @pf_input_clr, @pf_input_rer, @pf_input_lcr, @include_in_pf, @DC_other_value, @DC_other_value_comment, @DC_base_indicated_value, @SCH_other_value, @SCH_other_value_comment, @SCH_base_indicated_value, @PF_other_value, @PF_other_value_comment, @PF_base_indicated_value, @include_in_grm_gim, @non_income_land_imps_value, @non_income_land_value, @non_income_imprv_value, @other_land_value, @schil_grid_static, @schil_override_schedule_values, @schil_method_value, @schil_personal_property_value, @schil_other_value, @schil_other_value_comment, @schil_base_indicated_value, @schil_indicated_value, @schil_indicated_land_value, @schil_indicated_imprv_value
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_delete_ChangeLog
on income
for delete
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
if not exists (
     select chg_log_audit
     from chg_log_columns with(nolock)
     where
          chg_log_tables = 'income' and
          chg_log_audit = 1
)
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
declare @tvar_szOldValue varchar(255)
set @tvar_szOldValue = 'DELETED'
 
declare @tvar_key_prop_id int
 
declare @income_id int
declare @sup_num int
declare @income_yr numeric(4,0)
 
declare curRows cursor
for
     select income_id, sup_num, case income_yr when 0 then @tvar_lFutureYear else income_yr end from deleted
for read only
 
open curRows
fetch next from curRows into @income_id, @sup_num, @income_yr
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 333, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @income_id, @sup_num, @income_yr
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_update_ChangeLog
on income
for update
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @old_income_id int
declare @new_income_id int
declare @old_sup_num int
declare @new_sup_num int
declare @old_income_yr numeric(4,0)
declare @new_income_yr numeric(4,0)
declare @old_GBA numeric(14,0)
declare @new_GBA numeric(14,0)
declare @old_NRA numeric(14,0)
declare @new_NRA numeric(14,0)
declare @old_TAX numeric(14,2)
declare @new_TAX numeric(14,2)
declare @old_override_tax char(1)
declare @new_override_tax char(1)
declare @old_override_gba char(1)
declare @new_override_gba char(1)
declare @old_DC_LA numeric(14,0)
declare @new_DC_LA numeric(14,0)
declare @old_DC_VA numeric(14,0)
declare @new_DC_VA numeric(14,0)
declare @old_DC_BE numeric(5,2)
declare @new_DC_BE numeric(5,2)
declare @old_DC_OR numeric(5,2)
declare @new_DC_OR numeric(5,2)
declare @old_DC_VR numeric(5,2)
declare @new_DC_VR numeric(5,2)
declare @old_DC_LARate numeric(14,2)
declare @new_DC_LARate numeric(14,2)
declare @old_DC_VARate numeric(14,2)
declare @new_DC_VARate numeric(14,2)
declare @old_DC_LI numeric(14,0)
declare @new_DC_LI numeric(14,0)
declare @old_DC_VI numeric(14,0)
declare @new_DC_VI numeric(14,0)
declare @old_DC_GPI numeric(14,0)
declare @new_DC_GPI numeric(14,0)
declare @old_DC_GPIVR numeric(5,2)
declare @new_DC_GPIVR numeric(5,2)
declare @old_DC_GPIVI numeric(14,0)
declare @new_DC_GPIVI numeric(14,0)
declare @old_DC_GPICLR numeric(5,2)
declare @new_DC_GPICLR numeric(5,2)
declare @old_DC_GPICLI numeric(14,0)
declare @new_DC_GPICLI numeric(14,0)
declare @old_DC_GPIRER numeric(5,2)
declare @new_DC_GPIRER numeric(5,2)
declare @old_DC_GPIRE numeric(14,0)
declare @new_DC_GPIRE numeric(14,0)
declare @old_DC_GPISIR numeric(5,2)
declare @new_DC_GPISIR numeric(5,2)
declare @old_DC_GPISI numeric(14,0)
declare @new_DC_GPISI numeric(14,0)
declare @old_DC_EGI numeric(14,0)
declare @new_DC_EGI numeric(14,0)
declare @old_DC_EXPOEI numeric(14,0)
declare @new_DC_EXPOEI numeric(14,0)
declare @old_DC_MGMTR numeric(5,2)
declare @new_DC_MGMTR numeric(5,2)
declare @old_DC_MGMTI numeric(14,0)
declare @new_DC_MGMTI numeric(14,0)
declare @old_DC_RRR numeric(5,2)
declare @new_DC_RRR numeric(5,2)
declare @old_DC_RRI numeric(14,0)
declare @new_DC_RRI numeric(14,0)
declare @old_DC_TIR numeric(5,2)
declare @new_DC_TIR numeric(5,2)
declare @old_DC_TII numeric(14,0)
declare @new_DC_TII numeric(14,0)
declare @old_DC_LCR numeric(5,2)
declare @new_DC_LCR numeric(5,2)
declare @old_DC_LCI numeric(14,0)
declare @new_DC_LCI numeric(14,0)
declare @old_DC_EXP numeric(14,0)
declare @new_DC_EXP numeric(14,0)
declare @old_DC_NOI numeric(14,0)
declare @new_DC_NOI numeric(14,0)
declare @old_DC_CAPR numeric(5,2)
declare @new_DC_CAPR numeric(5,2)
declare @old_DC_CAPI numeric(14,0)
declare @new_DC_CAPI numeric(14,0)
declare @old_DC_PERS numeric(14,0)
declare @new_DC_PERS numeric(14,0)
declare @old_DC_IND numeric(14,0)
declare @new_DC_IND numeric(14,0)
declare @old_DC_GPIRSF numeric(14,2)
declare @new_DC_GPIRSF numeric(14,2)
declare @old_DC_GPIVRSF numeric(14,2)
declare @new_DC_GPIVRSF numeric(14,2)
declare @old_DC_GPICLRSF numeric(14,2)
declare @new_DC_GPICLRSF numeric(14,2)
declare @old_DC_GPIRERSF numeric(14,2)
declare @new_DC_GPIRERSF numeric(14,2)
declare @old_DC_GPISIRSF numeric(14,2)
declare @new_DC_GPISIRSF numeric(14,2)
declare @old_DC_EGIRSF numeric(14,2)
declare @new_DC_EGIRSF numeric(14,2)
declare @old_DC_EGIPCTREV numeric(5,2)
declare @new_DC_EGIPCTREV numeric(5,2)
declare @old_DC_EXPOERSF numeric(14,2)
declare @new_DC_EXPOERSF numeric(14,2)
declare @old_DC_EXPTAXRSF numeric(14,2)
declare @new_DC_EXPTAXRSF numeric(14,2)
declare @old_DC_EXPMGMTRSF numeric(14,2)
declare @new_DC_EXPMGMTRSF numeric(14,2)
declare @old_DC_RRRSF numeric(14,2)
declare @new_DC_RRRSF numeric(14,2)
declare @old_DC_EXPTIRSF numeric(14,2)
declare @new_DC_EXPTIRSF numeric(14,2)
declare @old_DC_EXPLCRSF numeric(14,2)
declare @new_DC_EXPLCRSF numeric(14,2)
declare @old_DC_EXPRSF numeric(14,2)
declare @new_DC_EXPRSF numeric(14,2)
declare @old_DC_EXPPCTREV numeric(5,2)
declare @new_DC_EXPPCTREV numeric(5,2)
declare @old_DC_NOIRSF numeric(14,2)
declare @new_DC_NOIRSF numeric(14,2)
declare @old_DC_NOIPCTREV numeric(5,2)
declare @new_DC_NOIPCTREV numeric(5,2)
declare @old_SCH_LA numeric(14,0)
declare @new_SCH_LA numeric(14,0)
declare @old_SCH_VA numeric(14,0)
declare @new_SCH_VA numeric(14,0)
declare @old_SCH_BE numeric(5,2)
declare @new_SCH_BE numeric(5,2)
declare @old_SCH_OR numeric(5,2)
declare @new_SCH_OR numeric(5,2)
declare @old_SCH_VR numeric(5,2)
declare @new_SCH_VR numeric(5,2)
declare @old_SCH_LARate numeric(14,2)
declare @new_SCH_LARate numeric(14,2)
declare @old_SCH_VARate numeric(14,2)
declare @new_SCH_VARate numeric(14,2)
declare @old_SCH_LI numeric(14,0)
declare @new_SCH_LI numeric(14,0)
declare @old_SCH_VI numeric(14,0)
declare @new_SCH_VI numeric(14,0)
declare @old_SCH_GPI numeric(14,0)
declare @new_SCH_GPI numeric(14,0)
declare @old_SCH_GPIVR numeric(5,2)
declare @new_SCH_GPIVR numeric(5,2)
declare @old_SCH_GPIVI numeric(14,0)
declare @new_SCH_GPIVI numeric(14,0)
declare @old_SCH_GPICLR numeric(5,2)
declare @new_SCH_GPICLR numeric(5,2)
declare @old_SCH_GPICLI numeric(14,0)
declare @new_SCH_GPICLI numeric(14,0)
declare @old_SCH_GPIRER numeric(5,2)
declare @new_SCH_GPIRER numeric(5,2)
declare @old_SCH_GPIRE numeric(14,0)
declare @new_SCH_GPIRE numeric(14,0)
declare @old_SCH_GPISIR numeric(5,2)
declare @new_SCH_GPISIR numeric(5,2)
declare @old_SCH_GPISI numeric(14,0)
declare @new_SCH_GPISI numeric(14,0)
declare @old_SCH_EGI numeric(14,0)
declare @new_SCH_EGI numeric(14,0)
declare @old_SCH_EXPOEI numeric(14,0)
declare @new_SCH_EXPOEI numeric(14,0)
declare @old_SCH_MGMTR numeric(5,2)
declare @new_SCH_MGMTR numeric(5,2)
declare @old_SCH_MGMTI numeric(14,0)
declare @new_SCH_MGMTI numeric(14,0)
declare @old_SCH_RRR numeric(5,2)
declare @new_SCH_RRR numeric(5,2)
declare @old_SCH_RRI numeric(14,0)
declare @new_SCH_RRI numeric(14,0)
declare @old_SCH_TIR numeric(5,2)
declare @new_SCH_TIR numeric(5,2)
declare @old_SCH_TII numeric(14,0)
declare @new_SCH_TII numeric(14,0)
declare @old_SCH_LCR numeric(5,2)
declare @new_SCH_LCR numeric(5,2)
declare @old_SCH_LCI numeric(14,0)
declare @new_SCH_LCI numeric(14,0)
declare @old_SCH_EXP numeric(14,0)
declare @new_SCH_EXP numeric(14,0)
declare @old_SCH_NOI numeric(14,0)
declare @new_SCH_NOI numeric(14,0)
declare @old_SCH_CAPR numeric(5,2)
declare @new_SCH_CAPR numeric(5,2)
declare @old_SCH_CAPI numeric(14,0)
declare @new_SCH_CAPI numeric(14,0)
declare @old_SCH_PERS numeric(14,0)
declare @new_SCH_PERS numeric(14,0)
declare @old_SCH_IND numeric(14,0)
declare @new_SCH_IND numeric(14,0)
declare @old_SCH_GPIRSF numeric(14,2)
declare @new_SCH_GPIRSF numeric(14,2)
declare @old_SCH_GPIVRSF numeric(14,2)
declare @new_SCH_GPIVRSF numeric(14,2)
declare @old_SCH_GPICLRSF numeric(14,2)
declare @new_SCH_GPICLRSF numeric(14,2)
declare @old_SCH_GPIRERSF numeric(14,2)
declare @new_SCH_GPIRERSF numeric(14,2)
declare @old_SCH_GPISIRSF numeric(14,2)
declare @new_SCH_GPISIRSF numeric(14,2)
declare @old_SCH_EGIRSF numeric(14,2)
declare @new_SCH_EGIRSF numeric(14,2)
declare @old_SCH_EGIPCTREV numeric(5,2)
declare @new_SCH_EGIPCTREV numeric(5,2)
declare @old_SCH_EXPOERSF numeric(14,2)
declare @new_SCH_EXPOERSF numeric(14,2)
declare @old_SCH_EXPTAXRSF numeric(14,2)
declare @new_SCH_EXPTAXRSF numeric(14,2)
declare @old_SCH_EXPMGMTRSF numeric(14,2)
declare @new_SCH_EXPMGMTRSF numeric(14,2)
declare @old_SCH_RRRSF numeric(14,2)
declare @new_SCH_RRRSF numeric(14,2)
declare @old_SCH_EXPTIRSF numeric(14,2)
declare @new_SCH_EXPTIRSF numeric(14,2)
declare @old_SCH_EXPLCRSF numeric(14,2)
declare @new_SCH_EXPLCRSF numeric(14,2)
declare @old_SCH_EXPRSF numeric(14,2)
declare @new_SCH_EXPRSF numeric(14,2)
declare @old_SCH_EXPPCTREV numeric(5,2)
declare @new_SCH_EXPPCTREV numeric(5,2)
declare @old_SCH_NOIRSF numeric(14,2)
declare @new_SCH_NOIRSF numeric(14,2)
declare @old_SCH_NOIPCTREV numeric(5,2)
declare @new_SCH_NOIPCTREV numeric(5,2)
declare @old_PF_LA numeric(14,0)
declare @new_PF_LA numeric(14,0)
declare @old_PF_VA numeric(14,0)
declare @new_PF_VA numeric(14,0)
declare @old_PF_BE numeric(5,2)
declare @new_PF_BE numeric(5,2)
declare @old_PF_OR numeric(5,2)
declare @new_PF_OR numeric(5,2)
declare @old_PF_VR numeric(5,2)
declare @new_PF_VR numeric(5,2)
declare @old_PF_LARate numeric(14,2)
declare @new_PF_LARate numeric(14,2)
declare @old_PF_VARate numeric(14,2)
declare @new_PF_VARate numeric(14,2)
declare @old_PF_LI numeric(14,0)
declare @new_PF_LI numeric(14,0)
declare @old_PF_VI numeric(14,0)
declare @new_PF_VI numeric(14,0)
declare @old_PF_GPI numeric(14,0)
declare @new_PF_GPI numeric(14,0)
declare @old_PF_GPIVR numeric(5,2)
declare @new_PF_GPIVR numeric(5,2)
declare @old_PF_GPIVI numeric(14,0)
declare @new_PF_GPIVI numeric(14,0)
declare @old_PF_GPICLR numeric(5,2)
declare @new_PF_GPICLR numeric(5,2)
declare @old_PF_GPICLI numeric(14,0)
declare @new_PF_GPICLI numeric(14,0)
declare @old_PF_GPIRER numeric(5,2)
declare @new_PF_GPIRER numeric(5,2)
declare @old_PF_GPIRE numeric(14,0)
declare @new_PF_GPIRE numeric(14,0)
declare @old_PF_GPISIR numeric(5,2)
declare @new_PF_GPISIR numeric(5,2)
declare @old_PF_GPISI numeric(14,0)
declare @new_PF_GPISI numeric(14,0)
declare @old_PF_EGI numeric(14,0)
declare @new_PF_EGI numeric(14,0)
declare @old_PF_EXPOEI numeric(14,0)
declare @new_PF_EXPOEI numeric(14,0)
declare @old_PF_MGMTR numeric(5,2)
declare @new_PF_MGMTR numeric(5,2)
declare @old_PF_MGMTI numeric(14,0)
declare @new_PF_MGMTI numeric(14,0)
declare @old_PF_RRR numeric(5,2)
declare @new_PF_RRR numeric(5,2)
declare @old_PF_RRI numeric(14,0)
declare @new_PF_RRI numeric(14,0)
declare @old_PF_TIR numeric(5,2)
declare @new_PF_TIR numeric(5,2)
declare @old_PF_TII numeric(14,0)
declare @new_PF_TII numeric(14,0)
declare @old_PF_LCR numeric(5,2)
declare @new_PF_LCR numeric(5,2)
declare @old_PF_LCI numeric(14,0)
declare @new_PF_LCI numeric(14,0)
declare @old_PF_EXP numeric(14,0)
declare @new_PF_EXP numeric(14,0)
declare @old_PF_NOI numeric(14,0)
declare @new_PF_NOI numeric(14,0)
declare @old_PF_CAPR numeric(5,2)
declare @new_PF_CAPR numeric(5,2)
declare @old_PF_CAPI numeric(14,0)
declare @new_PF_CAPI numeric(14,0)
declare @old_PF_PERS numeric(14,0)
declare @new_PF_PERS numeric(14,0)
declare @old_PF_IND numeric(14,0)
declare @new_PF_IND numeric(14,0)
declare @old_PF_GPIRSF numeric(14,2)
declare @new_PF_GPIRSF numeric(14,2)
declare @old_PF_GPIVRSF numeric(14,2)
declare @new_PF_GPIVRSF numeric(14,2)
declare @old_PF_GPICLRSF numeric(14,2)
declare @new_PF_GPICLRSF numeric(14,2)
declare @old_PF_GPIRERSF numeric(14,2)
declare @new_PF_GPIRERSF numeric(14,2)
declare @old_PF_GPISIRSF numeric(14,2)
declare @new_PF_GPISIRSF numeric(14,2)
declare @old_PF_EGIRSF numeric(14,2)
declare @new_PF_EGIRSF numeric(14,2)
declare @old_PF_EGIPCTREV numeric(5,2)
declare @new_PF_EGIPCTREV numeric(5,2)
declare @old_PF_EXPOERSF numeric(14,2)
declare @new_PF_EXPOERSF numeric(14,2)
declare @old_PF_EXPTAXRSF numeric(14,2)
declare @new_PF_EXPTAXRSF numeric(14,2)
declare @old_PF_EXPMGMTRSF numeric(14,2)
declare @new_PF_EXPMGMTRSF numeric(14,2)
declare @old_PF_RRRSF numeric(14,2)
declare @new_PF_RRRSF numeric(14,2)
declare @old_PF_EXPTIRSF numeric(14,2)
declare @new_PF_EXPTIRSF numeric(14,2)
declare @old_PF_EXPLCRSF numeric(14,2)
declare @new_PF_EXPLCRSF numeric(14,2)
declare @old_PF_EXPRSF numeric(14,2)
declare @new_PF_EXPRSF numeric(14,2)
declare @old_PF_EXPPCTREV numeric(5,2)
declare @new_PF_EXPPCTREV numeric(5,2)
declare @old_PF_NOIRSF numeric(14,2)
declare @new_PF_NOIRSF numeric(14,2)
declare @old_PF_NOIPCTREV numeric(5,2)
declare @new_PF_NOIPCTREV numeric(5,2)
declare @old_flat_value numeric(14,0)
declare @new_flat_value numeric(14,0)
declare @old_econ_area varchar(10)
declare @new_econ_area varchar(10)
declare @old_prop_type_cd varchar(10)
declare @new_prop_type_cd varchar(10)
declare @old_class varchar(10)
declare @new_class varchar(10)
declare @old_level_cd varchar(10)
declare @new_level_cd varchar(10)
declare @old_yr_blt numeric(4,0)
declare @new_yr_blt numeric(4,0)
declare @old_stories varchar(10)
declare @new_stories varchar(10)
declare @old_prop_name varchar(50)
declare @new_prop_name varchar(50)
declare @old_comment varchar(255)
declare @new_comment varchar(255)
declare @old_value_method varchar(5)
declare @new_value_method varchar(5)
declare @old_income_value numeric(14,0)
declare @new_income_value numeric(14,0)
declare @old_lease_company varchar(50)
declare @new_lease_company varchar(50)
declare @old_lease_contact varchar(50)
declare @new_lease_contact varchar(50)
declare @old_lease_address varchar(150)
declare @new_lease_address varchar(150)
declare @old_lease_phone varchar(25)
declare @new_lease_phone varchar(25)
declare @old_lease_fax varchar(25)
declare @new_lease_fax varchar(25)
declare @old_lease_email varchar(25)
declare @new_lease_email varchar(25)
declare @old_lease_survery_dt datetime
declare @new_lease_survery_dt datetime
declare @old_recalc_flag char(1)
declare @new_recalc_flag char(1)
declare @old_pf_input_ocr numeric(5,2)
declare @new_pf_input_ocr numeric(5,2)
declare @old_pf_input_mgmtr numeric(5,2)
declare @new_pf_input_mgmtr numeric(5,2)
declare @old_pf_input_exp_rsf numeric(14,2)
declare @new_pf_input_exp_rsf numeric(14,2)
declare @old_pf_input_si_rsf numeric(5,2)
declare @new_pf_input_si_rsf numeric(5,2)
declare @old_pf_input_tir numeric(5,2)
declare @new_pf_input_tir numeric(5,2)
declare @old_pf_input_rrr numeric(5,2)
declare @new_pf_input_rrr numeric(5,2)
declare @old_pf_input_capr numeric(5,2)
declare @new_pf_input_capr numeric(5,2)
declare @old_pf_input_lease_rsf numeric(14,2)
declare @new_pf_input_lease_rsf numeric(14,2)
declare @old_pf_date datetime
declare @new_pf_date datetime
declare @old_pf_prop_name varchar(100)
declare @new_pf_prop_name varchar(100)
declare @old_DC_TAX numeric(14,0)
declare @new_DC_TAX numeric(14,0)
declare @old_SCH_TAX numeric(14,0)
declare @new_SCH_TAX numeric(14,0)
declare @old_PF_TAX numeric(14,0)
declare @new_PF_TAX numeric(14,0)
declare @old_override_dc_tax char(1)
declare @new_override_dc_tax char(1)
declare @old_override_sch_tax char(1)
declare @new_override_sch_tax char(1)
declare @old_override_pf_tax char(1)
declare @new_override_pf_tax char(1)
declare @old_land_ratio numeric(14,5)
declare @new_land_ratio numeric(14,5)
declare @old_land_ratio_typical numeric(14,5)
declare @new_land_ratio_typical numeric(14,5)
declare @old_land_rsf numeric(14,2)
declare @new_land_rsf numeric(14,2)
declare @old_land_size numeric(18,4)
declare @new_land_size numeric(18,4)
declare @old_land_excess_value numeric(14,0)
declare @new_land_excess_value numeric(14,0)
declare @old_lu_rent_loss_area numeric(14,0)
declare @new_lu_rent_loss_area numeric(14,0)
declare @old_lu_rent_sf numeric(14,2)
declare @new_lu_rent_sf numeric(14,2)
declare @old_lu_rent_num_year numeric(5,2)
declare @new_lu_rent_num_year numeric(5,2)
declare @old_lu_rent_total numeric(14,0)
declare @new_lu_rent_total numeric(14,0)
declare @old_lu_lease_pct numeric(5,2)
declare @new_lu_lease_pct numeric(5,2)
declare @old_lu_lease_total numeric(14,0)
declare @new_lu_lease_total numeric(14,0)
declare @old_lu_tfo_sf numeric(14,2)
declare @new_lu_tfo_sf numeric(14,2)
declare @old_lu_tfo_total numeric(14,0)
declare @new_lu_tfo_total numeric(14,0)
declare @old_lu_disc_rate numeric(5,2)
declare @new_lu_disc_rate numeric(5,2)
declare @old_lu_num_year numeric(5,2)
declare @new_lu_num_year numeric(5,2)
declare @old_lu_cost numeric(14,0)
declare @new_lu_cost numeric(14,0)
declare @old_dc_ind_rsf numeric(14,2)
declare @new_dc_ind_rsf numeric(14,2)
declare @old_sch_ind_rsf numeric(14,2)
declare @new_sch_ind_rsf numeric(14,2)
declare @old_pf_ind_rsf numeric(14,2)
declare @new_pf_ind_rsf numeric(14,2)
declare @old_dc_ocr_rsf numeric(14,2)
declare @new_dc_ocr_rsf numeric(14,2)
declare @old_sch_ocr_rsf numeric(14,2)
declare @new_sch_ocr_rsf numeric(14,2)
declare @old_pf_ocr_rsf numeric(14,2)
declare @new_pf_ocr_rsf numeric(14,2)
declare @old_dc_ocr_runit numeric(14,2)
declare @new_dc_ocr_runit numeric(14,2)
declare @old_sch_ocr_runit numeric(14,2)
declare @new_sch_ocr_runit numeric(14,2)
declare @old_pf_ocr_runit numeric(14,2)
declare @new_pf_ocr_runit numeric(14,2)
declare @old_dc_ind_runit numeric(14,2)
declare @new_dc_ind_runit numeric(14,2)
declare @old_sch_ind_runit numeric(14,2)
declare @new_sch_ind_runit numeric(14,2)
declare @old_pf_ind_runit numeric(14,2)
declare @new_pf_ind_runit numeric(14,2)
declare @old_num_units numeric(14,0)
declare @new_num_units numeric(14,0)
declare @old_override_num_units char(1)
declare @new_override_num_units char(1)
declare @old_lu_override_cost char(1)
declare @new_lu_override_cost char(1)
declare @old_pf_input_VARate numeric(14,2)
declare @new_pf_input_VARate numeric(14,2)
declare @old_expense_structure_cd varchar(10)
declare @new_expense_structure_cd varchar(10)
declare @old_lease_type_cd varchar(10)
declare @new_lease_type_cd varchar(10)
declare @old_rent_type_cd varchar(10)
declare @new_rent_type_cd varchar(10)
declare @old_pf_input_clr numeric(5,2)
declare @new_pf_input_clr numeric(5,2)
declare @old_pf_input_rer numeric(5,2)
declare @new_pf_input_rer numeric(5,2)
declare @old_pf_input_lcr numeric(5,2)
declare @new_pf_input_lcr numeric(5,2)
declare @old_include_in_pf char(1)
declare @new_include_in_pf char(1)
declare @old_DC_other_value numeric(14,0)
declare @new_DC_other_value numeric(14,0)
declare @old_DC_other_value_comment varchar(255)
declare @new_DC_other_value_comment varchar(255)
declare @old_DC_base_indicated_value numeric(14,0)
declare @new_DC_base_indicated_value numeric(14,0)
declare @old_SCH_other_value numeric(14,0)
declare @new_SCH_other_value numeric(14,0)
declare @old_SCH_other_value_comment varchar(255)
declare @new_SCH_other_value_comment varchar(255)
declare @old_SCH_base_indicated_value numeric(14,0)
declare @new_SCH_base_indicated_value numeric(14,0)
declare @old_PF_other_value numeric(14,0)
declare @new_PF_other_value numeric(14,0)
declare @old_PF_other_value_comment varchar(255)
declare @new_PF_other_value_comment varchar(255)
declare @old_PF_base_indicated_value numeric(14,0)
declare @new_PF_base_indicated_value numeric(14,0)
declare @old_include_in_grm_gim bit
declare @new_include_in_grm_gim bit
declare @old_non_income_land_imps_value numeric(14,0)
declare @new_non_income_land_imps_value numeric(14,0)
declare @old_non_income_land_value numeric(14,0)
declare @new_non_income_land_value numeric(14,0)
declare @old_non_income_imprv_value numeric(14,0)
declare @new_non_income_imprv_value numeric(14,0)
declare @old_other_land_value numeric(14,0)
declare @new_other_land_value numeric(14,0)
declare @old_schil_grid_static bit
declare @new_schil_grid_static bit
declare @old_schil_override_schedule_values bit
declare @new_schil_override_schedule_values bit
declare @old_schil_method_value numeric(14,0)
declare @new_schil_method_value numeric(14,0)
declare @old_schil_personal_property_value numeric(14,0)
declare @new_schil_personal_property_value numeric(14,0)
declare @old_schil_other_value numeric(14,0)
declare @new_schil_other_value numeric(14,0)
declare @old_schil_other_value_comment varchar(255)
declare @new_schil_other_value_comment varchar(255)
declare @old_schil_base_indicated_value numeric(14,0)
declare @new_schil_base_indicated_value numeric(14,0)
declare @old_schil_indicated_value numeric(14,0)
declare @new_schil_indicated_value numeric(14,0)
declare @old_schil_indicated_land_value numeric(14,0)
declare @new_schil_indicated_land_value numeric(14,0)
declare @old_schil_indicated_imprv_value numeric(14,0)
declare @new_schil_indicated_imprv_value numeric(14,0)
 
declare curRows cursor
for
     select d.income_id, d.sup_num, case d.income_yr when 0 then @tvar_lFutureYear else d.income_yr end, d.GBA, d.NRA, d.TAX, d.override_tax, d.override_gba, d.DC_LA, d.DC_VA, d.DC_BE, d.DC_OR, d.DC_VR, d.DC_LARate, d.DC_VARate, d.DC_LI, d.DC_VI, d.DC_GPI, d.DC_GPIVR, d.DC_GPIVI, d.DC_GPICLR, d.DC_GPICLI, d.DC_GPIRER, d.DC_GPIRE, d.DC_GPISIR, d.DC_GPISI, d.DC_EGI, d.DC_EXPOEI, d.DC_MGMTR, d.DC_MGMTI, d.DC_RRR, d.DC_RRI, d.DC_TIR, d.DC_TII, d.DC_LCR, d.DC_LCI, d.DC_EXP, d.DC_NOI, d.DC_CAPR, d.DC_CAPI, d.DC_PERS, d.DC_IND, d.DC_GPIRSF, d.DC_GPIVRSF, d.DC_GPICLRSF, d.DC_GPIRERSF, d.DC_GPISIRSF, d.DC_EGIRSF, d.DC_EGIPCTREV, d.DC_EXPOERSF, d.DC_EXPTAXRSF, d.DC_EXPMGMTRSF, d.DC_RRRSF, d.DC_EXPTIRSF, d.DC_EXPLCRSF, d.DC_EXPRSF, d.DC_EXPPCTREV, d.DC_NOIRSF, d.DC_NOIPCTREV, d.SCH_LA, d.SCH_VA, d.SCH_BE, d.SCH_OR, d.SCH_VR, d.SCH_LARate, d.SCH_VARate, d.SCH_LI, d.SCH_VI, d.SCH_GPI, d.SCH_GPIVR, d.SCH_GPIVI, d.SCH_GPICLR, d.SCH_GPICLI, d.SCH_GPIRER, d.SCH_GPIRE, d.SCH_GPISIR, d.SCH_GPISI, d.SCH_EGI, d.SCH_EXPOEI, d.SCH_MGMTR, d.SCH_MGMTI, d.SCH_RRR, d.SCH_RRI, d.SCH_TIR, d.SCH_TII, d.SCH_LCR, d.SCH_LCI, d.SCH_EXP, d.SCH_NOI, d.SCH_CAPR, d.SCH_CAPI, d.SCH_PERS, d.SCH_IND, d.SCH_GPIRSF, d.SCH_GPIVRSF, d.SCH_GPICLRSF, d.SCH_GPIRERSF, d.SCH_GPISIRSF, d.SCH_EGIRSF, d.SCH_EGIPCTREV, d.SCH_EXPOERSF, d.SCH_EXPTAXRSF, d.SCH_EXPMGMTRSF, d.SCH_RRRSF, d.SCH_EXPTIRSF, d.SCH_EXPLCRSF, d.SCH_EXPRSF, d.SCH_EXPPCTREV, d.SCH_NOIRSF, d.SCH_NOIPCTREV, d.PF_LA, d.PF_VA, d.PF_BE, d.PF_OR, d.PF_VR, d.PF_LARate, d.PF_VARate, d.PF_LI, d.PF_VI, d.PF_GPI, d.PF_GPIVR, d.PF_GPIVI, d.PF_GPICLR, d.PF_GPICLI, d.PF_GPIRER, d.PF_GPIRE, d.PF_GPISIR, d.PF_GPISI, d.PF_EGI, d.PF_EXPOEI, d.PF_MGMTR, d.PF_MGMTI, d.PF_RRR, d.PF_RRI, d.PF_TIR, d.PF_TII, d.PF_LCR, d.PF_LCI, d.PF_EXP, d.PF_NOI, d.PF_CAPR, d.PF_CAPI, d.PF_PERS, d.PF_IND, d.PF_GPIRSF, d.PF_GPIVRSF, d.PF_GPICLRSF, d.PF_GPIRERSF, d.PF_GPISIRSF, d.PF_EGIRSF, d.PF_EGIPCTREV, d.PF_EXPOERSF, d.PF_EXPTAXRSF, d.PF_EXPMGMTRSF, d.PF_RRRSF, d.PF_EXPTIRSF, d.PF_EXPLCRSF, d.PF_EXPRSF, d.PF_EXPPCTREV, d.PF_NOIRSF, d.PF_NOIPCTREV, d.flat_value, d.econ_area, d.prop_type_cd, d.class, d.level_cd, d.yr_blt, d.stories, d.prop_name, d.comment, d.value_method, d.income_value, d.lease_company, d.lease_contact, d.lease_address, d.lease_phone, d.lease_fax, d.lease_email, d.lease_survery_dt, d.recalc_flag, d.pf_input_ocr, d.pf_input_mgmtr, d.pf_input_exp_rsf, d.pf_input_si_rsf, d.pf_input_tir, d.pf_input_rrr, d.pf_input_capr, d.pf_input_lease_rsf, d.pf_date, d.pf_prop_name, d.DC_TAX, d.SCH_TAX, d.PF_TAX, d.override_dc_tax, d.override_sch_tax, d.override_pf_tax, d.land_ratio, d.land_ratio_typical, d.land_rsf, d.land_size, d.land_excess_value, d.lu_rent_loss_area, d.lu_rent_sf, d.lu_rent_num_year, d.lu_rent_total, d.lu_lease_pct, d.lu_lease_total, d.lu_tfo_sf, d.lu_tfo_total, d.lu_disc_rate, d.lu_num_year, d.lu_cost, d.dc_ind_rsf, d.sch_ind_rsf, d.pf_ind_rsf, d.dc_ocr_rsf, d.sch_ocr_rsf, d.pf_ocr_rsf, d.dc_ocr_runit, d.sch_ocr_runit, d.pf_ocr_runit, d.dc_ind_runit, d.sch_ind_runit, d.pf_ind_runit, d.num_units, d.override_num_units, d.lu_override_cost, d.pf_input_VARate, d.expense_structure_cd, d.lease_type_cd, d.rent_type_cd, d.pf_input_clr, d.pf_input_rer, d.pf_input_lcr, d.include_in_pf, d.DC_other_value, d.DC_other_value_comment, d.DC_base_indicated_value, d.SCH_other_value, d.SCH_other_value_comment, d.SCH_base_indicated_value, d.PF_other_value, d.PF_other_value_comment, d.PF_base_indicated_value, d.include_in_grm_gim, d.non_income_land_imps_value, d.non_income_land_value, d.non_income_imprv_value, d.other_land_value, d.schil_grid_static, d.schil_override_schedule_values, d.schil_method_value, d.schil_personal_property_value, d.schil_other_value, d.schil_other_value_comment, d.schil_base_indicated_value, d.schil_indicated_value, d.schil_indicated_land_value, d.schil_indicated_imprv_value, 
            i.income_id, i.sup_num, case i.income_yr when 0 then @tvar_lFutureYear else i.income_yr end, i.GBA, i.NRA, i.TAX, i.override_tax, i.override_gba, i.DC_LA, i.DC_VA, i.DC_BE, i.DC_OR, i.DC_VR, i.DC_LARate, i.DC_VARate, i.DC_LI, i.DC_VI, i.DC_GPI, i.DC_GPIVR, i.DC_GPIVI, i.DC_GPICLR, i.DC_GPICLI, i.DC_GPIRER, i.DC_GPIRE, i.DC_GPISIR, i.DC_GPISI, i.DC_EGI, i.DC_EXPOEI, i.DC_MGMTR, i.DC_MGMTI, i.DC_RRR, i.DC_RRI, i.DC_TIR, i.DC_TII, i.DC_LCR, i.DC_LCI, i.DC_EXP, i.DC_NOI, i.DC_CAPR, i.DC_CAPI, i.DC_PERS, i.DC_IND, i.DC_GPIRSF, i.DC_GPIVRSF, i.DC_GPICLRSF, i.DC_GPIRERSF, i.DC_GPISIRSF, i.DC_EGIRSF, i.DC_EGIPCTREV, i.DC_EXPOERSF, i.DC_EXPTAXRSF, i.DC_EXPMGMTRSF, i.DC_RRRSF, i.DC_EXPTIRSF, i.DC_EXPLCRSF, i.DC_EXPRSF, i.DC_EXPPCTREV, i.DC_NOIRSF, i.DC_NOIPCTREV, i.SCH_LA, i.SCH_VA, i.SCH_BE, i.SCH_OR, i.SCH_VR, i.SCH_LARate, i.SCH_VARate, i.SCH_LI, i.SCH_VI, i.SCH_GPI, i.SCH_GPIVR, i.SCH_GPIVI, i.SCH_GPICLR, i.SCH_GPICLI, i.SCH_GPIRER, i.SCH_GPIRE, i.SCH_GPISIR, i.SCH_GPISI, i.SCH_EGI, i.SCH_EXPOEI, i.SCH_MGMTR, i.SCH_MGMTI, i.SCH_RRR, i.SCH_RRI, i.SCH_TIR, i.SCH_TII, i.SCH_LCR, i.SCH_LCI, i.SCH_EXP, i.SCH_NOI, i.SCH_CAPR, i.SCH_CAPI, i.SCH_PERS, i.SCH_IND, i.SCH_GPIRSF, i.SCH_GPIVRSF, i.SCH_GPICLRSF, i.SCH_GPIRERSF, i.SCH_GPISIRSF, i.SCH_EGIRSF, i.SCH_EGIPCTREV, i.SCH_EXPOERSF, i.SCH_EXPTAXRSF, i.SCH_EXPMGMTRSF, i.SCH_RRRSF, i.SCH_EXPTIRSF, i.SCH_EXPLCRSF, i.SCH_EXPRSF, i.SCH_EXPPCTREV, i.SCH_NOIRSF, i.SCH_NOIPCTREV, i.PF_LA, i.PF_VA, i.PF_BE, i.PF_OR, i.PF_VR, i.PF_LARate, i.PF_VARate, i.PF_LI, i.PF_VI, i.PF_GPI, i.PF_GPIVR, i.PF_GPIVI, i.PF_GPICLR, i.PF_GPICLI, i.PF_GPIRER, i.PF_GPIRE, i.PF_GPISIR, i.PF_GPISI, i.PF_EGI, i.PF_EXPOEI, i.PF_MGMTR, i.PF_MGMTI, i.PF_RRR, i.PF_RRI, i.PF_TIR, i.PF_TII, i.PF_LCR, i.PF_LCI, i.PF_EXP, i.PF_NOI, i.PF_CAPR, i.PF_CAPI, i.PF_PERS, i.PF_IND, i.PF_GPIRSF, i.PF_GPIVRSF, i.PF_GPICLRSF, i.PF_GPIRERSF, i.PF_GPISIRSF, i.PF_EGIRSF, i.PF_EGIPCTREV, i.PF_EXPOERSF, i.PF_EXPTAXRSF, i.PF_EXPMGMTRSF, i.PF_RRRSF, i.PF_EXPTIRSF, i.PF_EXPLCRSF, i.PF_EXPRSF, i.PF_EXPPCTREV, i.PF_NOIRSF, i.PF_NOIPCTREV, i.flat_value, i.econ_area, i.prop_type_cd, i.class, i.level_cd, i.yr_blt, i.stories, i.prop_name, i.comment, i.value_method, i.income_value, i.lease_company, i.lease_contact, i.lease_address, i.lease_phone, i.lease_fax, i.lease_email, i.lease_survery_dt, i.recalc_flag, i.pf_input_ocr, i.pf_input_mgmtr, i.pf_input_exp_rsf, i.pf_input_si_rsf, i.pf_input_tir, i.pf_input_rrr, i.pf_input_capr, i.pf_input_lease_rsf, i.pf_date, i.pf_prop_name, i.DC_TAX, i.SCH_TAX, i.PF_TAX, i.override_dc_tax, i.override_sch_tax, i.override_pf_tax, i.land_ratio, i.land_ratio_typical, i.land_rsf, i.land_size, i.land_excess_value, i.lu_rent_loss_area, i.lu_rent_sf, i.lu_rent_num_year, i.lu_rent_total, i.lu_lease_pct, i.lu_lease_total, i.lu_tfo_sf, i.lu_tfo_total, i.lu_disc_rate, i.lu_num_year, i.lu_cost, i.dc_ind_rsf, i.sch_ind_rsf, i.pf_ind_rsf, i.dc_ocr_rsf, i.sch_ocr_rsf, i.pf_ocr_rsf, i.dc_ocr_runit, i.sch_ocr_runit, i.pf_ocr_runit, i.dc_ind_runit, i.sch_ind_runit, i.pf_ind_runit, i.num_units, i.override_num_units, i.lu_override_cost, i.pf_input_VARate, i.expense_structure_cd, i.lease_type_cd, i.rent_type_cd, i.pf_input_clr, i.pf_input_rer, i.pf_input_lcr, i.include_in_pf, i.DC_other_value, i.DC_other_value_comment, i.DC_base_indicated_value, i.SCH_other_value, i.SCH_other_value_comment, i.SCH_base_indicated_value, i.PF_other_value, i.PF_other_value_comment, i.PF_base_indicated_value, i.include_in_grm_gim, i.non_income_land_imps_value, i.non_income_land_value, i.non_income_imprv_value, i.other_land_value, i.schil_grid_static, i.schil_override_schedule_values, i.schil_method_value, i.schil_personal_property_value, i.schil_other_value, i.schil_other_value_comment, i.schil_base_indicated_value, i.schil_indicated_value, i.schil_indicated_land_value, i.schil_indicated_imprv_value
from deleted as d
join inserted as i on 
     d.income_id = i.income_id and
     d.sup_num = i.sup_num and
     d.income_yr = i.income_yr
for read only
 
open curRows
fetch next from curRows into @old_income_id, @old_sup_num, @old_income_yr, @old_GBA, @old_NRA, @old_TAX, @old_override_tax, @old_override_gba, @old_DC_LA, @old_DC_VA, @old_DC_BE, @old_DC_OR, @old_DC_VR, @old_DC_LARate, @old_DC_VARate, @old_DC_LI, @old_DC_VI, @old_DC_GPI, @old_DC_GPIVR, @old_DC_GPIVI, @old_DC_GPICLR, @old_DC_GPICLI, @old_DC_GPIRER, @old_DC_GPIRE, @old_DC_GPISIR, @old_DC_GPISI, @old_DC_EGI, @old_DC_EXPOEI, @old_DC_MGMTR, @old_DC_MGMTI, @old_DC_RRR, @old_DC_RRI, @old_DC_TIR, @old_DC_TII, @old_DC_LCR, @old_DC_LCI, @old_DC_EXP, @old_DC_NOI, @old_DC_CAPR, @old_DC_CAPI, @old_DC_PERS, @old_DC_IND, @old_DC_GPIRSF, @old_DC_GPIVRSF, @old_DC_GPICLRSF, @old_DC_GPIRERSF, @old_DC_GPISIRSF, @old_DC_EGIRSF, @old_DC_EGIPCTREV, @old_DC_EXPOERSF, @old_DC_EXPTAXRSF, @old_DC_EXPMGMTRSF, @old_DC_RRRSF, @old_DC_EXPTIRSF, @old_DC_EXPLCRSF, @old_DC_EXPRSF, @old_DC_EXPPCTREV, @old_DC_NOIRSF, @old_DC_NOIPCTREV, @old_SCH_LA, @old_SCH_VA, @old_SCH_BE, @old_SCH_OR, @old_SCH_VR, @old_SCH_LARate, @old_SCH_VARate, @old_SCH_LI, @old_SCH_VI, @old_SCH_GPI, @old_SCH_GPIVR, @old_SCH_GPIVI, @old_SCH_GPICLR, @old_SCH_GPICLI, @old_SCH_GPIRER, @old_SCH_GPIRE, @old_SCH_GPISIR, @old_SCH_GPISI, @old_SCH_EGI, @old_SCH_EXPOEI, @old_SCH_MGMTR, @old_SCH_MGMTI, @old_SCH_RRR, @old_SCH_RRI, @old_SCH_TIR, @old_SCH_TII, @old_SCH_LCR, @old_SCH_LCI, @old_SCH_EXP, @old_SCH_NOI, @old_SCH_CAPR, @old_SCH_CAPI, @old_SCH_PERS, @old_SCH_IND, @old_SCH_GPIRSF, @old_SCH_GPIVRSF, @old_SCH_GPICLRSF, @old_SCH_GPIRERSF, @old_SCH_GPISIRSF, @old_SCH_EGIRSF, @old_SCH_EGIPCTREV, @old_SCH_EXPOERSF, @old_SCH_EXPTAXRSF, @old_SCH_EXPMGMTRSF, @old_SCH_RRRSF, @old_SCH_EXPTIRSF, @old_SCH_EXPLCRSF, @old_SCH_EXPRSF, @old_SCH_EXPPCTREV, @old_SCH_NOIRSF, @old_SCH_NOIPCTREV, @old_PF_LA, @old_PF_VA, @old_PF_BE, @old_PF_OR, @old_PF_VR, @old_PF_LARate, @old_PF_VARate, @old_PF_LI, @old_PF_VI, @old_PF_GPI, @old_PF_GPIVR, @old_PF_GPIVI, @old_PF_GPICLR, @old_PF_GPICLI, @old_PF_GPIRER, @old_PF_GPIRE, @old_PF_GPISIR, @old_PF_GPISI, @old_PF_EGI, @old_PF_EXPOEI, @old_PF_MGMTR, @old_PF_MGMTI, @old_PF_RRR, @old_PF_RRI, @old_PF_TIR, @old_PF_TII, @old_PF_LCR, @old_PF_LCI, @old_PF_EXP, @old_PF_NOI, @old_PF_CAPR, @old_PF_CAPI, @old_PF_PERS, @old_PF_IND, @old_PF_GPIRSF, @old_PF_GPIVRSF, @old_PF_GPICLRSF, @old_PF_GPIRERSF, @old_PF_GPISIRSF, @old_PF_EGIRSF, @old_PF_EGIPCTREV, @old_PF_EXPOERSF, @old_PF_EXPTAXRSF, @old_PF_EXPMGMTRSF, @old_PF_RRRSF, @old_PF_EXPTIRSF, @old_PF_EXPLCRSF, @old_PF_EXPRSF, @old_PF_EXPPCTREV, @old_PF_NOIRSF, @old_PF_NOIPCTREV, @old_flat_value, @old_econ_area, @old_prop_type_cd, @old_class, @old_level_cd, @old_yr_blt, @old_stories, @old_prop_name, @old_comment, @old_value_method, @old_income_value, @old_lease_company, @old_lease_contact, @old_lease_address, @old_lease_phone, @old_lease_fax, @old_lease_email, @old_lease_survery_dt, @old_recalc_flag, @old_pf_input_ocr, @old_pf_input_mgmtr, @old_pf_input_exp_rsf, @old_pf_input_si_rsf, @old_pf_input_tir, @old_pf_input_rrr, @old_pf_input_capr, @old_pf_input_lease_rsf, @old_pf_date, @old_pf_prop_name, @old_DC_TAX, @old_SCH_TAX, @old_PF_TAX, @old_override_dc_tax, @old_override_sch_tax, @old_override_pf_tax, @old_land_ratio, @old_land_ratio_typical, @old_land_rsf, @old_land_size, @old_land_excess_value, @old_lu_rent_loss_area, @old_lu_rent_sf, @old_lu_rent_num_year, @old_lu_rent_total, @old_lu_lease_pct, @old_lu_lease_total, @old_lu_tfo_sf, @old_lu_tfo_total, @old_lu_disc_rate, @old_lu_num_year, @old_lu_cost, @old_dc_ind_rsf, @old_sch_ind_rsf, @old_pf_ind_rsf, @old_dc_ocr_rsf, @old_sch_ocr_rsf, @old_pf_ocr_rsf, @old_dc_ocr_runit, @old_sch_ocr_runit, @old_pf_ocr_runit, @old_dc_ind_runit, @old_sch_ind_runit, @old_pf_ind_runit, @old_num_units, @old_override_num_units, @old_lu_override_cost, @old_pf_input_VARate, @old_expense_structure_cd, @old_lease_type_cd, @old_rent_type_cd, @old_pf_input_clr, @old_pf_input_rer, @old_pf_input_lcr, @old_include_in_pf, @old_DC_other_value, @old_DC_other_value_comment, @old_DC_base_indicated_value, @old_SCH_other_value, @old_SCH_other_value_comment, @old_SCH_base_indicated_value, @old_PF_other_value, @old_PF_other_value_comment, @old_PF_base_indicated_value, @old_include_in_grm_gim, @old_non_income_land_imps_value, @old_non_income_land_value, @old_non_income_imprv_value, @old_other_land_value, @old_schil_grid_static, @old_schil_override_schedule_values, @old_schil_method_value, @old_schil_personal_property_value, @old_schil_other_value, @old_schil_other_value_comment, @old_schil_base_indicated_value, @old_schil_indicated_value, @old_schil_indicated_land_value, @old_schil_indicated_imprv_value, 
                             @new_income_id, @new_sup_num, @new_income_yr, @new_GBA, @new_NRA, @new_TAX, @new_override_tax, @new_override_gba, @new_DC_LA, @new_DC_VA, @new_DC_BE, @new_DC_OR, @new_DC_VR, @new_DC_LARate, @new_DC_VARate, @new_DC_LI, @new_DC_VI, @new_DC_GPI, @new_DC_GPIVR, @new_DC_GPIVI, @new_DC_GPICLR, @new_DC_GPICLI, @new_DC_GPIRER, @new_DC_GPIRE, @new_DC_GPISIR, @new_DC_GPISI, @new_DC_EGI, @new_DC_EXPOEI, @new_DC_MGMTR, @new_DC_MGMTI, @new_DC_RRR, @new_DC_RRI, @new_DC_TIR, @new_DC_TII, @new_DC_LCR, @new_DC_LCI, @new_DC_EXP, @new_DC_NOI, @new_DC_CAPR, @new_DC_CAPI, @new_DC_PERS, @new_DC_IND, @new_DC_GPIRSF, @new_DC_GPIVRSF, @new_DC_GPICLRSF, @new_DC_GPIRERSF, @new_DC_GPISIRSF, @new_DC_EGIRSF, @new_DC_EGIPCTREV, @new_DC_EXPOERSF, @new_DC_EXPTAXRSF, @new_DC_EXPMGMTRSF, @new_DC_RRRSF, @new_DC_EXPTIRSF, @new_DC_EXPLCRSF, @new_DC_EXPRSF, @new_DC_EXPPCTREV, @new_DC_NOIRSF, @new_DC_NOIPCTREV, @new_SCH_LA, @new_SCH_VA, @new_SCH_BE, @new_SCH_OR, @new_SCH_VR, @new_SCH_LARate, @new_SCH_VARate, @new_SCH_LI, @new_SCH_VI, @new_SCH_GPI, @new_SCH_GPIVR, @new_SCH_GPIVI, @new_SCH_GPICLR, @new_SCH_GPICLI, @new_SCH_GPIRER, @new_SCH_GPIRE, @new_SCH_GPISIR, @new_SCH_GPISI, @new_SCH_EGI, @new_SCH_EXPOEI, @new_SCH_MGMTR, @new_SCH_MGMTI, @new_SCH_RRR, @new_SCH_RRI, @new_SCH_TIR, @new_SCH_TII, @new_SCH_LCR, @new_SCH_LCI, @new_SCH_EXP, @new_SCH_NOI, @new_SCH_CAPR, @new_SCH_CAPI, @new_SCH_PERS, @new_SCH_IND, @new_SCH_GPIRSF, @new_SCH_GPIVRSF, @new_SCH_GPICLRSF, @new_SCH_GPIRERSF, @new_SCH_GPISIRSF, @new_SCH_EGIRSF, @new_SCH_EGIPCTREV, @new_SCH_EXPOERSF, @new_SCH_EXPTAXRSF, @new_SCH_EXPMGMTRSF, @new_SCH_RRRSF, @new_SCH_EXPTIRSF, @new_SCH_EXPLCRSF, @new_SCH_EXPRSF, @new_SCH_EXPPCTREV, @new_SCH_NOIRSF, @new_SCH_NOIPCTREV, @new_PF_LA, @new_PF_VA, @new_PF_BE, @new_PF_OR, @new_PF_VR, @new_PF_LARate, @new_PF_VARate, @new_PF_LI, @new_PF_VI, @new_PF_GPI, @new_PF_GPIVR, @new_PF_GPIVI, @new_PF_GPICLR, @new_PF_GPICLI, @new_PF_GPIRER, @new_PF_GPIRE, @new_PF_GPISIR, @new_PF_GPISI, @new_PF_EGI, @new_PF_EXPOEI, @new_PF_MGMTR, @new_PF_MGMTI, @new_PF_RRR, @new_PF_RRI, @new_PF_TIR, @new_PF_TII, @new_PF_LCR, @new_PF_LCI, @new_PF_EXP, @new_PF_NOI, @new_PF_CAPR, @new_PF_CAPI, @new_PF_PERS, @new_PF_IND, @new_PF_GPIRSF, @new_PF_GPIVRSF, @new_PF_GPICLRSF, @new_PF_GPIRERSF, @new_PF_GPISIRSF, @new_PF_EGIRSF, @new_PF_EGIPCTREV, @new_PF_EXPOERSF, @new_PF_EXPTAXRSF, @new_PF_EXPMGMTRSF, @new_PF_RRRSF, @new_PF_EXPTIRSF, @new_PF_EXPLCRSF, @new_PF_EXPRSF, @new_PF_EXPPCTREV, @new_PF_NOIRSF, @new_PF_NOIPCTREV, @new_flat_value, @new_econ_area, @new_prop_type_cd, @new_class, @new_level_cd, @new_yr_blt, @new_stories, @new_prop_name, @new_comment, @new_value_method, @new_income_value, @new_lease_company, @new_lease_contact, @new_lease_address, @new_lease_phone, @new_lease_fax, @new_lease_email, @new_lease_survery_dt, @new_recalc_flag, @new_pf_input_ocr, @new_pf_input_mgmtr, @new_pf_input_exp_rsf, @new_pf_input_si_rsf, @new_pf_input_tir, @new_pf_input_rrr, @new_pf_input_capr, @new_pf_input_lease_rsf, @new_pf_date, @new_pf_prop_name, @new_DC_TAX, @new_SCH_TAX, @new_PF_TAX, @new_override_dc_tax, @new_override_sch_tax, @new_override_pf_tax, @new_land_ratio, @new_land_ratio_typical, @new_land_rsf, @new_land_size, @new_land_excess_value, @new_lu_rent_loss_area, @new_lu_rent_sf, @new_lu_rent_num_year, @new_lu_rent_total, @new_lu_lease_pct, @new_lu_lease_total, @new_lu_tfo_sf, @new_lu_tfo_total, @new_lu_disc_rate, @new_lu_num_year, @new_lu_cost, @new_dc_ind_rsf, @new_sch_ind_rsf, @new_pf_ind_rsf, @new_dc_ocr_rsf, @new_sch_ocr_rsf, @new_pf_ocr_rsf, @new_dc_ocr_runit, @new_sch_ocr_runit, @new_pf_ocr_runit, @new_dc_ind_runit, @new_sch_ind_runit, @new_pf_ind_runit, @new_num_units, @new_override_num_units, @new_lu_override_cost, @new_pf_input_VARate, @new_expense_structure_cd, @new_lease_type_cd, @new_rent_type_cd, @new_pf_input_clr, @new_pf_input_rer, @new_pf_input_lcr, @new_include_in_pf, @new_DC_other_value, @new_DC_other_value_comment, @new_DC_base_indicated_value, @new_SCH_other_value, @new_SCH_other_value_comment, @new_SCH_base_indicated_value, @new_PF_other_value, @new_PF_other_value_comment, @new_PF_base_indicated_value, @new_include_in_grm_gim, @new_non_income_land_imps_value, @new_non_income_land_value, @new_non_income_imprv_value, @new_other_land_value, @new_schil_grid_static, @new_schil_override_schedule_values, @new_schil_method_value, @new_schil_personal_property_value, @new_schil_other_value, @new_schil_other_value_comment, @new_schil_base_indicated_value, @new_schil_indicated_value, @new_schil_indicated_land_value, @new_schil_indicated_imprv_value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_income_id <> @new_income_id
          or
          ( @old_income_id is null and @new_income_id is not null ) 
          or
          ( @old_income_id is not null and @new_income_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'income_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2344, convert(varchar(255), @old_income_id), convert(varchar(255), @new_income_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sup_num <> @new_sup_num
          or
          ( @old_sup_num is null and @new_sup_num is not null ) 
          or
          ( @old_sup_num is not null and @new_sup_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_income_yr <> @new_income_yr
          or
          ( @old_income_yr is null and @new_income_yr is not null ) 
          or
          ( @old_income_yr is not null and @new_income_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'income_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2357, convert(varchar(255), @old_income_yr), convert(varchar(255), @new_income_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_GBA <> @new_GBA
          or
          ( @old_GBA is null and @new_GBA is not null ) 
          or
          ( @old_GBA is not null and @new_GBA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'GBA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1996, convert(varchar(255), @old_GBA), convert(varchar(255), @new_GBA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_NRA <> @new_NRA
          or
          ( @old_NRA is null and @new_NRA is not null ) 
          or
          ( @old_NRA is not null and @new_NRA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'NRA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3352, convert(varchar(255), @old_NRA), convert(varchar(255), @new_NRA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_TAX <> @new_TAX
          or
          ( @old_TAX is null and @new_TAX is not null ) 
          or
          ( @old_TAX is not null and @new_TAX is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'TAX' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 5089, convert(varchar(255), @old_TAX), convert(varchar(255), @new_TAX), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_override_tax <> @new_override_tax
          or
          ( @old_override_tax is null and @new_override_tax is not null ) 
          or
          ( @old_override_tax is not null and @new_override_tax is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'override_tax' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3468, convert(varchar(255), @old_override_tax), convert(varchar(255), @new_override_tax), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_override_gba <> @new_override_gba
          or
          ( @old_override_gba is null and @new_override_gba is not null ) 
          or
          ( @old_override_gba is not null and @new_override_gba is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'override_gba' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3460, convert(varchar(255), @old_override_gba), convert(varchar(255), @new_override_gba), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_LA <> @new_DC_LA
          or
          ( @old_DC_LA is null and @new_DC_LA is not null ) 
          or
          ( @old_DC_LA is not null and @new_DC_LA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_LA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1163, convert(varchar(255), @old_DC_LA), convert(varchar(255), @new_DC_LA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_VA <> @new_DC_VA
          or
          ( @old_DC_VA is null and @new_DC_VA is not null ) 
          or
          ( @old_DC_VA is not null and @new_DC_VA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_VA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1183, convert(varchar(255), @old_DC_VA), convert(varchar(255), @new_DC_VA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_BE <> @new_DC_BE
          or
          ( @old_DC_BE is null and @new_DC_BE is not null ) 
          or
          ( @old_DC_BE is not null and @new_DC_BE is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_BE' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1131, convert(varchar(255), @old_DC_BE), convert(varchar(255), @new_DC_BE), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_OR <> @new_DC_OR
          or
          ( @old_DC_OR is null and @new_DC_OR is not null ) 
          or
          ( @old_DC_OR is not null and @new_DC_OR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_OR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1175, convert(varchar(255), @old_DC_OR), convert(varchar(255), @new_DC_OR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_VR <> @new_DC_VR
          or
          ( @old_DC_VR is null and @new_DC_VR is not null ) 
          or
          ( @old_DC_VR is not null and @new_DC_VR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_VR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1186, convert(varchar(255), @old_DC_VR), convert(varchar(255), @new_DC_VR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_LARate <> @new_DC_LARate
          or
          ( @old_DC_LARate is null and @new_DC_LARate is not null ) 
          or
          ( @old_DC_LARate is not null and @new_DC_LARate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_LARate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1164, convert(varchar(255), @old_DC_LARate), convert(varchar(255), @new_DC_LARate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_VARate <> @new_DC_VARate
          or
          ( @old_DC_VARate is null and @new_DC_VARate is not null ) 
          or
          ( @old_DC_VARate is not null and @new_DC_VARate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_VARate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1184, convert(varchar(255), @old_DC_VARate), convert(varchar(255), @new_DC_VARate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_LI <> @new_DC_LI
          or
          ( @old_DC_LI is null and @new_DC_LI is not null ) 
          or
          ( @old_DC_LI is not null and @new_DC_LI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_LI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1167, convert(varchar(255), @old_DC_LI), convert(varchar(255), @new_DC_LI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_VI <> @new_DC_VI
          or
          ( @old_DC_VI is null and @new_DC_VI is not null ) 
          or
          ( @old_DC_VI is not null and @new_DC_VI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_VI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1185, convert(varchar(255), @old_DC_VI), convert(varchar(255), @new_DC_VI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPI <> @new_DC_GPI
          or
          ( @old_DC_GPI is null and @new_DC_GPI is not null ) 
          or
          ( @old_DC_GPI is not null and @new_DC_GPI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1146, convert(varchar(255), @old_DC_GPI), convert(varchar(255), @new_DC_GPI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPIVR <> @new_DC_GPIVR
          or
          ( @old_DC_GPIVR is null and @new_DC_GPIVR is not null ) 
          or
          ( @old_DC_GPIVR is not null and @new_DC_GPIVR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPIVR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1158, convert(varchar(255), @old_DC_GPIVR), convert(varchar(255), @new_DC_GPIVR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPIVI <> @new_DC_GPIVI
          or
          ( @old_DC_GPIVI is null and @new_DC_GPIVI is not null ) 
          or
          ( @old_DC_GPIVI is not null and @new_DC_GPIVI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPIVI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1157, convert(varchar(255), @old_DC_GPIVI), convert(varchar(255), @new_DC_GPIVI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPICLR <> @new_DC_GPICLR
          or
          ( @old_DC_GPICLR is null and @new_DC_GPICLR is not null ) 
          or
          ( @old_DC_GPICLR is not null and @new_DC_GPICLR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPICLR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1148, convert(varchar(255), @old_DC_GPICLR), convert(varchar(255), @new_DC_GPICLR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPICLI <> @new_DC_GPICLI
          or
          ( @old_DC_GPICLI is null and @new_DC_GPICLI is not null ) 
          or
          ( @old_DC_GPICLI is not null and @new_DC_GPICLI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPICLI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1147, convert(varchar(255), @old_DC_GPICLI), convert(varchar(255), @new_DC_GPICLI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPIRER <> @new_DC_GPIRER
          or
          ( @old_DC_GPIRER is null and @new_DC_GPIRER is not null ) 
          or
          ( @old_DC_GPIRER is not null and @new_DC_GPIRER is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPIRER' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1151, convert(varchar(255), @old_DC_GPIRER), convert(varchar(255), @new_DC_GPIRER), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPIRE <> @new_DC_GPIRE
          or
          ( @old_DC_GPIRE is null and @new_DC_GPIRE is not null ) 
          or
          ( @old_DC_GPIRE is not null and @new_DC_GPIRE is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPIRE' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1150, convert(varchar(255), @old_DC_GPIRE), convert(varchar(255), @new_DC_GPIRE), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPISIR <> @new_DC_GPISIR
          or
          ( @old_DC_GPISIR is null and @new_DC_GPISIR is not null ) 
          or
          ( @old_DC_GPISIR is not null and @new_DC_GPISIR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPISIR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1155, convert(varchar(255), @old_DC_GPISIR), convert(varchar(255), @new_DC_GPISIR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPISI <> @new_DC_GPISI
          or
          ( @old_DC_GPISI is null and @new_DC_GPISI is not null ) 
          or
          ( @old_DC_GPISI is not null and @new_DC_GPISI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPISI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1154, convert(varchar(255), @old_DC_GPISI), convert(varchar(255), @new_DC_GPISI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EGI <> @new_DC_EGI
          or
          ( @old_DC_EGI is null and @new_DC_EGI is not null ) 
          or
          ( @old_DC_EGI is not null and @new_DC_EGI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EGI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1134, convert(varchar(255), @old_DC_EGI), convert(varchar(255), @new_DC_EGI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPOEI <> @new_DC_EXPOEI
          or
          ( @old_DC_EXPOEI is null and @new_DC_EXPOEI is not null ) 
          or
          ( @old_DC_EXPOEI is not null and @new_DC_EXPOEI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPOEI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1140, convert(varchar(255), @old_DC_EXPOEI), convert(varchar(255), @new_DC_EXPOEI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_MGMTR <> @new_DC_MGMTR
          or
          ( @old_DC_MGMTR is null and @new_DC_MGMTR is not null ) 
          or
          ( @old_DC_MGMTR is not null and @new_DC_MGMTR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_MGMTR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1169, convert(varchar(255), @old_DC_MGMTR), convert(varchar(255), @new_DC_MGMTR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_MGMTI <> @new_DC_MGMTI
          or
          ( @old_DC_MGMTI is null and @new_DC_MGMTI is not null ) 
          or
          ( @old_DC_MGMTI is not null and @new_DC_MGMTI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_MGMTI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1168, convert(varchar(255), @old_DC_MGMTI), convert(varchar(255), @new_DC_MGMTI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_RRR <> @new_DC_RRR
          or
          ( @old_DC_RRR is null and @new_DC_RRR is not null ) 
          or
          ( @old_DC_RRR is not null and @new_DC_RRR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_RRR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1178, convert(varchar(255), @old_DC_RRR), convert(varchar(255), @new_DC_RRR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_RRI <> @new_DC_RRI
          or
          ( @old_DC_RRI is null and @new_DC_RRI is not null ) 
          or
          ( @old_DC_RRI is not null and @new_DC_RRI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_RRI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1177, convert(varchar(255), @old_DC_RRI), convert(varchar(255), @new_DC_RRI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_TIR <> @new_DC_TIR
          or
          ( @old_DC_TIR is null and @new_DC_TIR is not null ) 
          or
          ( @old_DC_TIR is not null and @new_DC_TIR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_TIR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1182, convert(varchar(255), @old_DC_TIR), convert(varchar(255), @new_DC_TIR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_TII <> @new_DC_TII
          or
          ( @old_DC_TII is null and @new_DC_TII is not null ) 
          or
          ( @old_DC_TII is not null and @new_DC_TII is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_TII' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1181, convert(varchar(255), @old_DC_TII), convert(varchar(255), @new_DC_TII), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_LCR <> @new_DC_LCR
          or
          ( @old_DC_LCR is null and @new_DC_LCR is not null ) 
          or
          ( @old_DC_LCR is not null and @new_DC_LCR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_LCR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1166, convert(varchar(255), @old_DC_LCR), convert(varchar(255), @new_DC_LCR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_LCI <> @new_DC_LCI
          or
          ( @old_DC_LCI is null and @new_DC_LCI is not null ) 
          or
          ( @old_DC_LCI is not null and @new_DC_LCI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_LCI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1165, convert(varchar(255), @old_DC_LCI), convert(varchar(255), @new_DC_LCI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXP <> @new_DC_EXP
          or
          ( @old_DC_EXP is null and @new_DC_EXP is not null ) 
          or
          ( @old_DC_EXP is not null and @new_DC_EXP is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXP' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1137, convert(varchar(255), @old_DC_EXP), convert(varchar(255), @new_DC_EXP), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_NOI <> @new_DC_NOI
          or
          ( @old_DC_NOI is null and @new_DC_NOI is not null ) 
          or
          ( @old_DC_NOI is not null and @new_DC_NOI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_NOI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1170, convert(varchar(255), @old_DC_NOI), convert(varchar(255), @new_DC_NOI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_CAPR <> @new_DC_CAPR
          or
          ( @old_DC_CAPR is null and @new_DC_CAPR is not null ) 
          or
          ( @old_DC_CAPR is not null and @new_DC_CAPR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_CAPR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1133, convert(varchar(255), @old_DC_CAPR), convert(varchar(255), @new_DC_CAPR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_CAPI <> @new_DC_CAPI
          or
          ( @old_DC_CAPI is null and @new_DC_CAPI is not null ) 
          or
          ( @old_DC_CAPI is not null and @new_DC_CAPI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_CAPI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1132, convert(varchar(255), @old_DC_CAPI), convert(varchar(255), @new_DC_CAPI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_PERS <> @new_DC_PERS
          or
          ( @old_DC_PERS is null and @new_DC_PERS is not null ) 
          or
          ( @old_DC_PERS is not null and @new_DC_PERS is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_PERS' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1176, convert(varchar(255), @old_DC_PERS), convert(varchar(255), @new_DC_PERS), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_IND <> @new_DC_IND
          or
          ( @old_DC_IND is null and @new_DC_IND is not null ) 
          or
          ( @old_DC_IND is not null and @new_DC_IND is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_IND' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1160, convert(varchar(255), @old_DC_IND), convert(varchar(255), @new_DC_IND), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPIRSF <> @new_DC_GPIRSF
          or
          ( @old_DC_GPIRSF is null and @new_DC_GPIRSF is not null ) 
          or
          ( @old_DC_GPIRSF is not null and @new_DC_GPIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1153, convert(varchar(255), @old_DC_GPIRSF), convert(varchar(255), @new_DC_GPIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPIVRSF <> @new_DC_GPIVRSF
          or
          ( @old_DC_GPIVRSF is null and @new_DC_GPIVRSF is not null ) 
          or
          ( @old_DC_GPIVRSF is not null and @new_DC_GPIVRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPIVRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1159, convert(varchar(255), @old_DC_GPIVRSF), convert(varchar(255), @new_DC_GPIVRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPICLRSF <> @new_DC_GPICLRSF
          or
          ( @old_DC_GPICLRSF is null and @new_DC_GPICLRSF is not null ) 
          or
          ( @old_DC_GPICLRSF is not null and @new_DC_GPICLRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPICLRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1149, convert(varchar(255), @old_DC_GPICLRSF), convert(varchar(255), @new_DC_GPICLRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPIRERSF <> @new_DC_GPIRERSF
          or
          ( @old_DC_GPIRERSF is null and @new_DC_GPIRERSF is not null ) 
          or
          ( @old_DC_GPIRERSF is not null and @new_DC_GPIRERSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPIRERSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1152, convert(varchar(255), @old_DC_GPIRERSF), convert(varchar(255), @new_DC_GPIRERSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_GPISIRSF <> @new_DC_GPISIRSF
          or
          ( @old_DC_GPISIRSF is null and @new_DC_GPISIRSF is not null ) 
          or
          ( @old_DC_GPISIRSF is not null and @new_DC_GPISIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_GPISIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1156, convert(varchar(255), @old_DC_GPISIRSF), convert(varchar(255), @new_DC_GPISIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EGIRSF <> @new_DC_EGIRSF
          or
          ( @old_DC_EGIRSF is null and @new_DC_EGIRSF is not null ) 
          or
          ( @old_DC_EGIRSF is not null and @new_DC_EGIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EGIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1136, convert(varchar(255), @old_DC_EGIRSF), convert(varchar(255), @new_DC_EGIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EGIPCTREV <> @new_DC_EGIPCTREV
          or
          ( @old_DC_EGIPCTREV is null and @new_DC_EGIPCTREV is not null ) 
          or
          ( @old_DC_EGIPCTREV is not null and @new_DC_EGIPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EGIPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1135, convert(varchar(255), @old_DC_EGIPCTREV), convert(varchar(255), @new_DC_EGIPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPOERSF <> @new_DC_EXPOERSF
          or
          ( @old_DC_EXPOERSF is null and @new_DC_EXPOERSF is not null ) 
          or
          ( @old_DC_EXPOERSF is not null and @new_DC_EXPOERSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPOERSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1141, convert(varchar(255), @old_DC_EXPOERSF), convert(varchar(255), @new_DC_EXPOERSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPTAXRSF <> @new_DC_EXPTAXRSF
          or
          ( @old_DC_EXPTAXRSF is null and @new_DC_EXPTAXRSF is not null ) 
          or
          ( @old_DC_EXPTAXRSF is not null and @new_DC_EXPTAXRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPTAXRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1144, convert(varchar(255), @old_DC_EXPTAXRSF), convert(varchar(255), @new_DC_EXPTAXRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPMGMTRSF <> @new_DC_EXPMGMTRSF
          or
          ( @old_DC_EXPMGMTRSF is null and @new_DC_EXPMGMTRSF is not null ) 
          or
          ( @old_DC_EXPMGMTRSF is not null and @new_DC_EXPMGMTRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPMGMTRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1139, convert(varchar(255), @old_DC_EXPMGMTRSF), convert(varchar(255), @new_DC_EXPMGMTRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_RRRSF <> @new_DC_RRRSF
          or
          ( @old_DC_RRRSF is null and @new_DC_RRRSF is not null ) 
          or
          ( @old_DC_RRRSF is not null and @new_DC_RRRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_RRRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1179, convert(varchar(255), @old_DC_RRRSF), convert(varchar(255), @new_DC_RRRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPTIRSF <> @new_DC_EXPTIRSF
          or
          ( @old_DC_EXPTIRSF is null and @new_DC_EXPTIRSF is not null ) 
          or
          ( @old_DC_EXPTIRSF is not null and @new_DC_EXPTIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPTIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1145, convert(varchar(255), @old_DC_EXPTIRSF), convert(varchar(255), @new_DC_EXPTIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPLCRSF <> @new_DC_EXPLCRSF
          or
          ( @old_DC_EXPLCRSF is null and @new_DC_EXPLCRSF is not null ) 
          or
          ( @old_DC_EXPLCRSF is not null and @new_DC_EXPLCRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPLCRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1138, convert(varchar(255), @old_DC_EXPLCRSF), convert(varchar(255), @new_DC_EXPLCRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPRSF <> @new_DC_EXPRSF
          or
          ( @old_DC_EXPRSF is null and @new_DC_EXPRSF is not null ) 
          or
          ( @old_DC_EXPRSF is not null and @new_DC_EXPRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1143, convert(varchar(255), @old_DC_EXPRSF), convert(varchar(255), @new_DC_EXPRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_EXPPCTREV <> @new_DC_EXPPCTREV
          or
          ( @old_DC_EXPPCTREV is null and @new_DC_EXPPCTREV is not null ) 
          or
          ( @old_DC_EXPPCTREV is not null and @new_DC_EXPPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_EXPPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1142, convert(varchar(255), @old_DC_EXPPCTREV), convert(varchar(255), @new_DC_EXPPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_NOIRSF <> @new_DC_NOIRSF
          or
          ( @old_DC_NOIRSF is null and @new_DC_NOIRSF is not null ) 
          or
          ( @old_DC_NOIRSF is not null and @new_DC_NOIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_NOIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1172, convert(varchar(255), @old_DC_NOIRSF), convert(varchar(255), @new_DC_NOIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_NOIPCTREV <> @new_DC_NOIPCTREV
          or
          ( @old_DC_NOIPCTREV is null and @new_DC_NOIPCTREV is not null ) 
          or
          ( @old_DC_NOIPCTREV is not null and @new_DC_NOIPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_NOIPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1171, convert(varchar(255), @old_DC_NOIPCTREV), convert(varchar(255), @new_DC_NOIPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_LA <> @new_SCH_LA
          or
          ( @old_SCH_LA is null and @new_SCH_LA is not null ) 
          or
          ( @old_SCH_LA is not null and @new_SCH_LA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_LA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4647, convert(varchar(255), @old_SCH_LA), convert(varchar(255), @new_SCH_LA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_VA <> @new_SCH_VA
          or
          ( @old_SCH_VA is null and @new_SCH_VA is not null ) 
          or
          ( @old_SCH_VA is not null and @new_SCH_VA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_VA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4667, convert(varchar(255), @old_SCH_VA), convert(varchar(255), @new_SCH_VA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_BE <> @new_SCH_BE
          or
          ( @old_SCH_BE is null and @new_SCH_BE is not null ) 
          or
          ( @old_SCH_BE is not null and @new_SCH_BE is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_BE' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4615, convert(varchar(255), @old_SCH_BE), convert(varchar(255), @new_SCH_BE), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_OR <> @new_SCH_OR
          or
          ( @old_SCH_OR is null and @new_SCH_OR is not null ) 
          or
          ( @old_SCH_OR is not null and @new_SCH_OR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_OR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4659, convert(varchar(255), @old_SCH_OR), convert(varchar(255), @new_SCH_OR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_VR <> @new_SCH_VR
          or
          ( @old_SCH_VR is null and @new_SCH_VR is not null ) 
          or
          ( @old_SCH_VR is not null and @new_SCH_VR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_VR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4670, convert(varchar(255), @old_SCH_VR), convert(varchar(255), @new_SCH_VR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_LARate <> @new_SCH_LARate
          or
          ( @old_SCH_LARate is null and @new_SCH_LARate is not null ) 
          or
          ( @old_SCH_LARate is not null and @new_SCH_LARate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_LARate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4648, convert(varchar(255), @old_SCH_LARate), convert(varchar(255), @new_SCH_LARate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_VARate <> @new_SCH_VARate
          or
          ( @old_SCH_VARate is null and @new_SCH_VARate is not null ) 
          or
          ( @old_SCH_VARate is not null and @new_SCH_VARate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_VARate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4668, convert(varchar(255), @old_SCH_VARate), convert(varchar(255), @new_SCH_VARate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_LI <> @new_SCH_LI
          or
          ( @old_SCH_LI is null and @new_SCH_LI is not null ) 
          or
          ( @old_SCH_LI is not null and @new_SCH_LI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_LI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4651, convert(varchar(255), @old_SCH_LI), convert(varchar(255), @new_SCH_LI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_VI <> @new_SCH_VI
          or
          ( @old_SCH_VI is null and @new_SCH_VI is not null ) 
          or
          ( @old_SCH_VI is not null and @new_SCH_VI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_VI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4669, convert(varchar(255), @old_SCH_VI), convert(varchar(255), @new_SCH_VI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPI <> @new_SCH_GPI
          or
          ( @old_SCH_GPI is null and @new_SCH_GPI is not null ) 
          or
          ( @old_SCH_GPI is not null and @new_SCH_GPI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4630, convert(varchar(255), @old_SCH_GPI), convert(varchar(255), @new_SCH_GPI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPIVR <> @new_SCH_GPIVR
          or
          ( @old_SCH_GPIVR is null and @new_SCH_GPIVR is not null ) 
          or
          ( @old_SCH_GPIVR is not null and @new_SCH_GPIVR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPIVR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4642, convert(varchar(255), @old_SCH_GPIVR), convert(varchar(255), @new_SCH_GPIVR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPIVI <> @new_SCH_GPIVI
          or
          ( @old_SCH_GPIVI is null and @new_SCH_GPIVI is not null ) 
          or
          ( @old_SCH_GPIVI is not null and @new_SCH_GPIVI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPIVI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4641, convert(varchar(255), @old_SCH_GPIVI), convert(varchar(255), @new_SCH_GPIVI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPICLR <> @new_SCH_GPICLR
          or
          ( @old_SCH_GPICLR is null and @new_SCH_GPICLR is not null ) 
          or
          ( @old_SCH_GPICLR is not null and @new_SCH_GPICLR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPICLR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4632, convert(varchar(255), @old_SCH_GPICLR), convert(varchar(255), @new_SCH_GPICLR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPICLI <> @new_SCH_GPICLI
          or
          ( @old_SCH_GPICLI is null and @new_SCH_GPICLI is not null ) 
          or
          ( @old_SCH_GPICLI is not null and @new_SCH_GPICLI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPICLI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4631, convert(varchar(255), @old_SCH_GPICLI), convert(varchar(255), @new_SCH_GPICLI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPIRER <> @new_SCH_GPIRER
          or
          ( @old_SCH_GPIRER is null and @new_SCH_GPIRER is not null ) 
          or
          ( @old_SCH_GPIRER is not null and @new_SCH_GPIRER is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPIRER' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4635, convert(varchar(255), @old_SCH_GPIRER), convert(varchar(255), @new_SCH_GPIRER), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPIRE <> @new_SCH_GPIRE
          or
          ( @old_SCH_GPIRE is null and @new_SCH_GPIRE is not null ) 
          or
          ( @old_SCH_GPIRE is not null and @new_SCH_GPIRE is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPIRE' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4634, convert(varchar(255), @old_SCH_GPIRE), convert(varchar(255), @new_SCH_GPIRE), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPISIR <> @new_SCH_GPISIR
          or
          ( @old_SCH_GPISIR is null and @new_SCH_GPISIR is not null ) 
          or
          ( @old_SCH_GPISIR is not null and @new_SCH_GPISIR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPISIR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4639, convert(varchar(255), @old_SCH_GPISIR), convert(varchar(255), @new_SCH_GPISIR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPISI <> @new_SCH_GPISI
          or
          ( @old_SCH_GPISI is null and @new_SCH_GPISI is not null ) 
          or
          ( @old_SCH_GPISI is not null and @new_SCH_GPISI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPISI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4638, convert(varchar(255), @old_SCH_GPISI), convert(varchar(255), @new_SCH_GPISI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EGI <> @new_SCH_EGI
          or
          ( @old_SCH_EGI is null and @new_SCH_EGI is not null ) 
          or
          ( @old_SCH_EGI is not null and @new_SCH_EGI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EGI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4618, convert(varchar(255), @old_SCH_EGI), convert(varchar(255), @new_SCH_EGI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPOEI <> @new_SCH_EXPOEI
          or
          ( @old_SCH_EXPOEI is null and @new_SCH_EXPOEI is not null ) 
          or
          ( @old_SCH_EXPOEI is not null and @new_SCH_EXPOEI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPOEI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4624, convert(varchar(255), @old_SCH_EXPOEI), convert(varchar(255), @new_SCH_EXPOEI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_MGMTR <> @new_SCH_MGMTR
          or
          ( @old_SCH_MGMTR is null and @new_SCH_MGMTR is not null ) 
          or
          ( @old_SCH_MGMTR is not null and @new_SCH_MGMTR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_MGMTR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4653, convert(varchar(255), @old_SCH_MGMTR), convert(varchar(255), @new_SCH_MGMTR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_MGMTI <> @new_SCH_MGMTI
          or
          ( @old_SCH_MGMTI is null and @new_SCH_MGMTI is not null ) 
          or
          ( @old_SCH_MGMTI is not null and @new_SCH_MGMTI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_MGMTI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4652, convert(varchar(255), @old_SCH_MGMTI), convert(varchar(255), @new_SCH_MGMTI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_RRR <> @new_SCH_RRR
          or
          ( @old_SCH_RRR is null and @new_SCH_RRR is not null ) 
          or
          ( @old_SCH_RRR is not null and @new_SCH_RRR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_RRR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4662, convert(varchar(255), @old_SCH_RRR), convert(varchar(255), @new_SCH_RRR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_RRI <> @new_SCH_RRI
          or
          ( @old_SCH_RRI is null and @new_SCH_RRI is not null ) 
          or
          ( @old_SCH_RRI is not null and @new_SCH_RRI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_RRI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4661, convert(varchar(255), @old_SCH_RRI), convert(varchar(255), @new_SCH_RRI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_TIR <> @new_SCH_TIR
          or
          ( @old_SCH_TIR is null and @new_SCH_TIR is not null ) 
          or
          ( @old_SCH_TIR is not null and @new_SCH_TIR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_TIR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4666, convert(varchar(255), @old_SCH_TIR), convert(varchar(255), @new_SCH_TIR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_TII <> @new_SCH_TII
          or
          ( @old_SCH_TII is null and @new_SCH_TII is not null ) 
          or
          ( @old_SCH_TII is not null and @new_SCH_TII is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_TII' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4665, convert(varchar(255), @old_SCH_TII), convert(varchar(255), @new_SCH_TII), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_LCR <> @new_SCH_LCR
          or
          ( @old_SCH_LCR is null and @new_SCH_LCR is not null ) 
          or
          ( @old_SCH_LCR is not null and @new_SCH_LCR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_LCR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4650, convert(varchar(255), @old_SCH_LCR), convert(varchar(255), @new_SCH_LCR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_LCI <> @new_SCH_LCI
          or
          ( @old_SCH_LCI is null and @new_SCH_LCI is not null ) 
          or
          ( @old_SCH_LCI is not null and @new_SCH_LCI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_LCI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4649, convert(varchar(255), @old_SCH_LCI), convert(varchar(255), @new_SCH_LCI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXP <> @new_SCH_EXP
          or
          ( @old_SCH_EXP is null and @new_SCH_EXP is not null ) 
          or
          ( @old_SCH_EXP is not null and @new_SCH_EXP is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXP' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4621, convert(varchar(255), @old_SCH_EXP), convert(varchar(255), @new_SCH_EXP), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_NOI <> @new_SCH_NOI
          or
          ( @old_SCH_NOI is null and @new_SCH_NOI is not null ) 
          or
          ( @old_SCH_NOI is not null and @new_SCH_NOI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_NOI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4654, convert(varchar(255), @old_SCH_NOI), convert(varchar(255), @new_SCH_NOI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_CAPR <> @new_SCH_CAPR
          or
          ( @old_SCH_CAPR is null and @new_SCH_CAPR is not null ) 
          or
          ( @old_SCH_CAPR is not null and @new_SCH_CAPR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_CAPR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4617, convert(varchar(255), @old_SCH_CAPR), convert(varchar(255), @new_SCH_CAPR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_CAPI <> @new_SCH_CAPI
          or
          ( @old_SCH_CAPI is null and @new_SCH_CAPI is not null ) 
          or
          ( @old_SCH_CAPI is not null and @new_SCH_CAPI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_CAPI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4616, convert(varchar(255), @old_SCH_CAPI), convert(varchar(255), @new_SCH_CAPI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_PERS <> @new_SCH_PERS
          or
          ( @old_SCH_PERS is null and @new_SCH_PERS is not null ) 
          or
          ( @old_SCH_PERS is not null and @new_SCH_PERS is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_PERS' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4660, convert(varchar(255), @old_SCH_PERS), convert(varchar(255), @new_SCH_PERS), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_IND <> @new_SCH_IND
          or
          ( @old_SCH_IND is null and @new_SCH_IND is not null ) 
          or
          ( @old_SCH_IND is not null and @new_SCH_IND is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_IND' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4644, convert(varchar(255), @old_SCH_IND), convert(varchar(255), @new_SCH_IND), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPIRSF <> @new_SCH_GPIRSF
          or
          ( @old_SCH_GPIRSF is null and @new_SCH_GPIRSF is not null ) 
          or
          ( @old_SCH_GPIRSF is not null and @new_SCH_GPIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4637, convert(varchar(255), @old_SCH_GPIRSF), convert(varchar(255), @new_SCH_GPIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPIVRSF <> @new_SCH_GPIVRSF
          or
          ( @old_SCH_GPIVRSF is null and @new_SCH_GPIVRSF is not null ) 
          or
          ( @old_SCH_GPIVRSF is not null and @new_SCH_GPIVRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPIVRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4643, convert(varchar(255), @old_SCH_GPIVRSF), convert(varchar(255), @new_SCH_GPIVRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPICLRSF <> @new_SCH_GPICLRSF
          or
          ( @old_SCH_GPICLRSF is null and @new_SCH_GPICLRSF is not null ) 
          or
          ( @old_SCH_GPICLRSF is not null and @new_SCH_GPICLRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPICLRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4633, convert(varchar(255), @old_SCH_GPICLRSF), convert(varchar(255), @new_SCH_GPICLRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPIRERSF <> @new_SCH_GPIRERSF
          or
          ( @old_SCH_GPIRERSF is null and @new_SCH_GPIRERSF is not null ) 
          or
          ( @old_SCH_GPIRERSF is not null and @new_SCH_GPIRERSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPIRERSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4636, convert(varchar(255), @old_SCH_GPIRERSF), convert(varchar(255), @new_SCH_GPIRERSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_GPISIRSF <> @new_SCH_GPISIRSF
          or
          ( @old_SCH_GPISIRSF is null and @new_SCH_GPISIRSF is not null ) 
          or
          ( @old_SCH_GPISIRSF is not null and @new_SCH_GPISIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_GPISIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4640, convert(varchar(255), @old_SCH_GPISIRSF), convert(varchar(255), @new_SCH_GPISIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EGIRSF <> @new_SCH_EGIRSF
          or
          ( @old_SCH_EGIRSF is null and @new_SCH_EGIRSF is not null ) 
          or
          ( @old_SCH_EGIRSF is not null and @new_SCH_EGIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EGIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4620, convert(varchar(255), @old_SCH_EGIRSF), convert(varchar(255), @new_SCH_EGIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EGIPCTREV <> @new_SCH_EGIPCTREV
          or
          ( @old_SCH_EGIPCTREV is null and @new_SCH_EGIPCTREV is not null ) 
          or
          ( @old_SCH_EGIPCTREV is not null and @new_SCH_EGIPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EGIPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4619, convert(varchar(255), @old_SCH_EGIPCTREV), convert(varchar(255), @new_SCH_EGIPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPOERSF <> @new_SCH_EXPOERSF
          or
          ( @old_SCH_EXPOERSF is null and @new_SCH_EXPOERSF is not null ) 
          or
          ( @old_SCH_EXPOERSF is not null and @new_SCH_EXPOERSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPOERSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4625, convert(varchar(255), @old_SCH_EXPOERSF), convert(varchar(255), @new_SCH_EXPOERSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPTAXRSF <> @new_SCH_EXPTAXRSF
          or
          ( @old_SCH_EXPTAXRSF is null and @new_SCH_EXPTAXRSF is not null ) 
          or
          ( @old_SCH_EXPTAXRSF is not null and @new_SCH_EXPTAXRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPTAXRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4628, convert(varchar(255), @old_SCH_EXPTAXRSF), convert(varchar(255), @new_SCH_EXPTAXRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPMGMTRSF <> @new_SCH_EXPMGMTRSF
          or
          ( @old_SCH_EXPMGMTRSF is null and @new_SCH_EXPMGMTRSF is not null ) 
          or
          ( @old_SCH_EXPMGMTRSF is not null and @new_SCH_EXPMGMTRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPMGMTRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4623, convert(varchar(255), @old_SCH_EXPMGMTRSF), convert(varchar(255), @new_SCH_EXPMGMTRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_RRRSF <> @new_SCH_RRRSF
          or
          ( @old_SCH_RRRSF is null and @new_SCH_RRRSF is not null ) 
          or
          ( @old_SCH_RRRSF is not null and @new_SCH_RRRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_RRRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4663, convert(varchar(255), @old_SCH_RRRSF), convert(varchar(255), @new_SCH_RRRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPTIRSF <> @new_SCH_EXPTIRSF
          or
          ( @old_SCH_EXPTIRSF is null and @new_SCH_EXPTIRSF is not null ) 
          or
          ( @old_SCH_EXPTIRSF is not null and @new_SCH_EXPTIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPTIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4629, convert(varchar(255), @old_SCH_EXPTIRSF), convert(varchar(255), @new_SCH_EXPTIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPLCRSF <> @new_SCH_EXPLCRSF
          or
          ( @old_SCH_EXPLCRSF is null and @new_SCH_EXPLCRSF is not null ) 
          or
          ( @old_SCH_EXPLCRSF is not null and @new_SCH_EXPLCRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPLCRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4622, convert(varchar(255), @old_SCH_EXPLCRSF), convert(varchar(255), @new_SCH_EXPLCRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPRSF <> @new_SCH_EXPRSF
          or
          ( @old_SCH_EXPRSF is null and @new_SCH_EXPRSF is not null ) 
          or
          ( @old_SCH_EXPRSF is not null and @new_SCH_EXPRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4627, convert(varchar(255), @old_SCH_EXPRSF), convert(varchar(255), @new_SCH_EXPRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_EXPPCTREV <> @new_SCH_EXPPCTREV
          or
          ( @old_SCH_EXPPCTREV is null and @new_SCH_EXPPCTREV is not null ) 
          or
          ( @old_SCH_EXPPCTREV is not null and @new_SCH_EXPPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_EXPPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4626, convert(varchar(255), @old_SCH_EXPPCTREV), convert(varchar(255), @new_SCH_EXPPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_NOIRSF <> @new_SCH_NOIRSF
          or
          ( @old_SCH_NOIRSF is null and @new_SCH_NOIRSF is not null ) 
          or
          ( @old_SCH_NOIRSF is not null and @new_SCH_NOIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_NOIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4656, convert(varchar(255), @old_SCH_NOIRSF), convert(varchar(255), @new_SCH_NOIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_NOIPCTREV <> @new_SCH_NOIPCTREV
          or
          ( @old_SCH_NOIPCTREV is null and @new_SCH_NOIPCTREV is not null ) 
          or
          ( @old_SCH_NOIPCTREV is not null and @new_SCH_NOIPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_NOIPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4655, convert(varchar(255), @old_SCH_NOIPCTREV), convert(varchar(255), @new_SCH_NOIPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_LA <> @new_PF_LA
          or
          ( @old_PF_LA is null and @new_PF_LA is not null ) 
          or
          ( @old_PF_LA is not null and @new_PF_LA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_LA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3698, convert(varchar(255), @old_PF_LA), convert(varchar(255), @new_PF_LA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_VA <> @new_PF_VA
          or
          ( @old_PF_VA is null and @new_PF_VA is not null ) 
          or
          ( @old_PF_VA is not null and @new_PF_VA is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_VA' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3726, convert(varchar(255), @old_PF_VA), convert(varchar(255), @new_PF_VA), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_BE <> @new_PF_BE
          or
          ( @old_PF_BE is null and @new_PF_BE is not null ) 
          or
          ( @old_PF_BE is not null and @new_PF_BE is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_BE' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3649, convert(varchar(255), @old_PF_BE), convert(varchar(255), @new_PF_BE), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_OR <> @new_PF_OR
          or
          ( @old_PF_OR is null and @new_PF_OR is not null ) 
          or
          ( @old_PF_OR is not null and @new_PF_OR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_OR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3713, convert(varchar(255), @old_PF_OR), convert(varchar(255), @new_PF_OR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_VR <> @new_PF_VR
          or
          ( @old_PF_VR is null and @new_PF_VR is not null ) 
          or
          ( @old_PF_VR is not null and @new_PF_VR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_VR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3730, convert(varchar(255), @old_PF_VR), convert(varchar(255), @new_PF_VR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_LARate <> @new_PF_LARate
          or
          ( @old_PF_LARate is null and @new_PF_LARate is not null ) 
          or
          ( @old_PF_LARate is not null and @new_PF_LARate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_LARate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3699, convert(varchar(255), @old_PF_LARate), convert(varchar(255), @new_PF_LARate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_VARate <> @new_PF_VARate
          or
          ( @old_PF_VARate is null and @new_PF_VARate is not null ) 
          or
          ( @old_PF_VARate is not null and @new_PF_VARate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_VARate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3727, convert(varchar(255), @old_PF_VARate), convert(varchar(255), @new_PF_VARate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_LI <> @new_PF_LI
          or
          ( @old_PF_LI is null and @new_PF_LI is not null ) 
          or
          ( @old_PF_LI is not null and @new_PF_LI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_LI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3704, convert(varchar(255), @old_PF_LI), convert(varchar(255), @new_PF_LI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_VI <> @new_PF_VI
          or
          ( @old_PF_VI is null and @new_PF_VI is not null ) 
          or
          ( @old_PF_VI is not null and @new_PF_VI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_VI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3728, convert(varchar(255), @old_PF_VI), convert(varchar(255), @new_PF_VI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPI <> @new_PF_GPI
          or
          ( @old_PF_GPI is null and @new_PF_GPI is not null ) 
          or
          ( @old_PF_GPI is not null and @new_PF_GPI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3669, convert(varchar(255), @old_PF_GPI), convert(varchar(255), @new_PF_GPI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPIVR <> @new_PF_GPIVR
          or
          ( @old_PF_GPIVR is null and @new_PF_GPIVR is not null ) 
          or
          ( @old_PF_GPIVR is not null and @new_PF_GPIVR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPIVR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3681, convert(varchar(255), @old_PF_GPIVR), convert(varchar(255), @new_PF_GPIVR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPIVI <> @new_PF_GPIVI
          or
          ( @old_PF_GPIVI is null and @new_PF_GPIVI is not null ) 
          or
          ( @old_PF_GPIVI is not null and @new_PF_GPIVI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPIVI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3680, convert(varchar(255), @old_PF_GPIVI), convert(varchar(255), @new_PF_GPIVI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPICLR <> @new_PF_GPICLR
          or
          ( @old_PF_GPICLR is null and @new_PF_GPICLR is not null ) 
          or
          ( @old_PF_GPICLR is not null and @new_PF_GPICLR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPICLR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3671, convert(varchar(255), @old_PF_GPICLR), convert(varchar(255), @new_PF_GPICLR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPICLI <> @new_PF_GPICLI
          or
          ( @old_PF_GPICLI is null and @new_PF_GPICLI is not null ) 
          or
          ( @old_PF_GPICLI is not null and @new_PF_GPICLI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPICLI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3670, convert(varchar(255), @old_PF_GPICLI), convert(varchar(255), @new_PF_GPICLI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPIRER <> @new_PF_GPIRER
          or
          ( @old_PF_GPIRER is null and @new_PF_GPIRER is not null ) 
          or
          ( @old_PF_GPIRER is not null and @new_PF_GPIRER is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPIRER' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3674, convert(varchar(255), @old_PF_GPIRER), convert(varchar(255), @new_PF_GPIRER), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPIRE <> @new_PF_GPIRE
          or
          ( @old_PF_GPIRE is null and @new_PF_GPIRE is not null ) 
          or
          ( @old_PF_GPIRE is not null and @new_PF_GPIRE is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPIRE' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3673, convert(varchar(255), @old_PF_GPIRE), convert(varchar(255), @new_PF_GPIRE), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPISIR <> @new_PF_GPISIR
          or
          ( @old_PF_GPISIR is null and @new_PF_GPISIR is not null ) 
          or
          ( @old_PF_GPISIR is not null and @new_PF_GPISIR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPISIR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3678, convert(varchar(255), @old_PF_GPISIR), convert(varchar(255), @new_PF_GPISIR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPISI <> @new_PF_GPISI
          or
          ( @old_PF_GPISI is null and @new_PF_GPISI is not null ) 
          or
          ( @old_PF_GPISI is not null and @new_PF_GPISI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPISI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3677, convert(varchar(255), @old_PF_GPISI), convert(varchar(255), @new_PF_GPISI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EGI <> @new_PF_EGI
          or
          ( @old_PF_EGI is null and @new_PF_EGI is not null ) 
          or
          ( @old_PF_EGI is not null and @new_PF_EGI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EGI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3656, convert(varchar(255), @old_PF_EGI), convert(varchar(255), @new_PF_EGI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPOEI <> @new_PF_EXPOEI
          or
          ( @old_PF_EXPOEI is null and @new_PF_EXPOEI is not null ) 
          or
          ( @old_PF_EXPOEI is not null and @new_PF_EXPOEI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPOEI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3663, convert(varchar(255), @old_PF_EXPOEI), convert(varchar(255), @new_PF_EXPOEI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_MGMTR <> @new_PF_MGMTR
          or
          ( @old_PF_MGMTR is null and @new_PF_MGMTR is not null ) 
          or
          ( @old_PF_MGMTR is not null and @new_PF_MGMTR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_MGMTR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3707, convert(varchar(255), @old_PF_MGMTR), convert(varchar(255), @new_PF_MGMTR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_MGMTI <> @new_PF_MGMTI
          or
          ( @old_PF_MGMTI is null and @new_PF_MGMTI is not null ) 
          or
          ( @old_PF_MGMTI is not null and @new_PF_MGMTI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_MGMTI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3706, convert(varchar(255), @old_PF_MGMTI), convert(varchar(255), @new_PF_MGMTI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_RRR <> @new_PF_RRR
          or
          ( @old_PF_RRR is null and @new_PF_RRR is not null ) 
          or
          ( @old_PF_RRR is not null and @new_PF_RRR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_RRR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3720, convert(varchar(255), @old_PF_RRR), convert(varchar(255), @new_PF_RRR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_RRI <> @new_PF_RRI
          or
          ( @old_PF_RRI is null and @new_PF_RRI is not null ) 
          or
          ( @old_PF_RRI is not null and @new_PF_RRI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_RRI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3719, convert(varchar(255), @old_PF_RRI), convert(varchar(255), @new_PF_RRI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_TIR <> @new_PF_TIR
          or
          ( @old_PF_TIR is null and @new_PF_TIR is not null ) 
          or
          ( @old_PF_TIR is not null and @new_PF_TIR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_TIR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3725, convert(varchar(255), @old_PF_TIR), convert(varchar(255), @new_PF_TIR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_TII <> @new_PF_TII
          or
          ( @old_PF_TII is null and @new_PF_TII is not null ) 
          or
          ( @old_PF_TII is not null and @new_PF_TII is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_TII' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3724, convert(varchar(255), @old_PF_TII), convert(varchar(255), @new_PF_TII), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_LCR <> @new_PF_LCR
          or
          ( @old_PF_LCR is null and @new_PF_LCR is not null ) 
          or
          ( @old_PF_LCR is not null and @new_PF_LCR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_LCR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3701, convert(varchar(255), @old_PF_LCR), convert(varchar(255), @new_PF_LCR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_LCI <> @new_PF_LCI
          or
          ( @old_PF_LCI is null and @new_PF_LCI is not null ) 
          or
          ( @old_PF_LCI is not null and @new_PF_LCI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_LCI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3700, convert(varchar(255), @old_PF_LCI), convert(varchar(255), @new_PF_LCI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXP <> @new_PF_EXP
          or
          ( @old_PF_EXP is null and @new_PF_EXP is not null ) 
          or
          ( @old_PF_EXP is not null and @new_PF_EXP is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXP' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3659, convert(varchar(255), @old_PF_EXP), convert(varchar(255), @new_PF_EXP), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_NOI <> @new_PF_NOI
          or
          ( @old_PF_NOI is null and @new_PF_NOI is not null ) 
          or
          ( @old_PF_NOI is not null and @new_PF_NOI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_NOI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3708, convert(varchar(255), @old_PF_NOI), convert(varchar(255), @new_PF_NOI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_CAPR <> @new_PF_CAPR
          or
          ( @old_PF_CAPR is null and @new_PF_CAPR is not null ) 
          or
          ( @old_PF_CAPR is not null and @new_PF_CAPR is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_CAPR' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3651, convert(varchar(255), @old_PF_CAPR), convert(varchar(255), @new_PF_CAPR), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_CAPI <> @new_PF_CAPI
          or
          ( @old_PF_CAPI is null and @new_PF_CAPI is not null ) 
          or
          ( @old_PF_CAPI is not null and @new_PF_CAPI is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_CAPI' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3650, convert(varchar(255), @old_PF_CAPI), convert(varchar(255), @new_PF_CAPI), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_PERS <> @new_PF_PERS
          or
          ( @old_PF_PERS is null and @new_PF_PERS is not null ) 
          or
          ( @old_PF_PERS is not null and @new_PF_PERS is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_PERS' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3714, convert(varchar(255), @old_PF_PERS), convert(varchar(255), @new_PF_PERS), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_IND <> @new_PF_IND
          or
          ( @old_PF_IND is null and @new_PF_IND is not null ) 
          or
          ( @old_PF_IND is not null and @new_PF_IND is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_IND' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3683, convert(varchar(255), @old_PF_IND), convert(varchar(255), @new_PF_IND), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPIRSF <> @new_PF_GPIRSF
          or
          ( @old_PF_GPIRSF is null and @new_PF_GPIRSF is not null ) 
          or
          ( @old_PF_GPIRSF is not null and @new_PF_GPIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3676, convert(varchar(255), @old_PF_GPIRSF), convert(varchar(255), @new_PF_GPIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPIVRSF <> @new_PF_GPIVRSF
          or
          ( @old_PF_GPIVRSF is null and @new_PF_GPIVRSF is not null ) 
          or
          ( @old_PF_GPIVRSF is not null and @new_PF_GPIVRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPIVRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3682, convert(varchar(255), @old_PF_GPIVRSF), convert(varchar(255), @new_PF_GPIVRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPICLRSF <> @new_PF_GPICLRSF
          or
          ( @old_PF_GPICLRSF is null and @new_PF_GPICLRSF is not null ) 
          or
          ( @old_PF_GPICLRSF is not null and @new_PF_GPICLRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPICLRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3672, convert(varchar(255), @old_PF_GPICLRSF), convert(varchar(255), @new_PF_GPICLRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPIRERSF <> @new_PF_GPIRERSF
          or
          ( @old_PF_GPIRERSF is null and @new_PF_GPIRERSF is not null ) 
          or
          ( @old_PF_GPIRERSF is not null and @new_PF_GPIRERSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPIRERSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3675, convert(varchar(255), @old_PF_GPIRERSF), convert(varchar(255), @new_PF_GPIRERSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_GPISIRSF <> @new_PF_GPISIRSF
          or
          ( @old_PF_GPISIRSF is null and @new_PF_GPISIRSF is not null ) 
          or
          ( @old_PF_GPISIRSF is not null and @new_PF_GPISIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_GPISIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3679, convert(varchar(255), @old_PF_GPISIRSF), convert(varchar(255), @new_PF_GPISIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EGIRSF <> @new_PF_EGIRSF
          or
          ( @old_PF_EGIRSF is null and @new_PF_EGIRSF is not null ) 
          or
          ( @old_PF_EGIRSF is not null and @new_PF_EGIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EGIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3658, convert(varchar(255), @old_PF_EGIRSF), convert(varchar(255), @new_PF_EGIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EGIPCTREV <> @new_PF_EGIPCTREV
          or
          ( @old_PF_EGIPCTREV is null and @new_PF_EGIPCTREV is not null ) 
          or
          ( @old_PF_EGIPCTREV is not null and @new_PF_EGIPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EGIPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3657, convert(varchar(255), @old_PF_EGIPCTREV), convert(varchar(255), @new_PF_EGIPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPOERSF <> @new_PF_EXPOERSF
          or
          ( @old_PF_EXPOERSF is null and @new_PF_EXPOERSF is not null ) 
          or
          ( @old_PF_EXPOERSF is not null and @new_PF_EXPOERSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPOERSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3664, convert(varchar(255), @old_PF_EXPOERSF), convert(varchar(255), @new_PF_EXPOERSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPTAXRSF <> @new_PF_EXPTAXRSF
          or
          ( @old_PF_EXPTAXRSF is null and @new_PF_EXPTAXRSF is not null ) 
          or
          ( @old_PF_EXPTAXRSF is not null and @new_PF_EXPTAXRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPTAXRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3667, convert(varchar(255), @old_PF_EXPTAXRSF), convert(varchar(255), @new_PF_EXPTAXRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPMGMTRSF <> @new_PF_EXPMGMTRSF
          or
          ( @old_PF_EXPMGMTRSF is null and @new_PF_EXPMGMTRSF is not null ) 
          or
          ( @old_PF_EXPMGMTRSF is not null and @new_PF_EXPMGMTRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPMGMTRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3662, convert(varchar(255), @old_PF_EXPMGMTRSF), convert(varchar(255), @new_PF_EXPMGMTRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_RRRSF <> @new_PF_RRRSF
          or
          ( @old_PF_RRRSF is null and @new_PF_RRRSF is not null ) 
          or
          ( @old_PF_RRRSF is not null and @new_PF_RRRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_RRRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3721, convert(varchar(255), @old_PF_RRRSF), convert(varchar(255), @new_PF_RRRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPTIRSF <> @new_PF_EXPTIRSF
          or
          ( @old_PF_EXPTIRSF is null and @new_PF_EXPTIRSF is not null ) 
          or
          ( @old_PF_EXPTIRSF is not null and @new_PF_EXPTIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPTIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3668, convert(varchar(255), @old_PF_EXPTIRSF), convert(varchar(255), @new_PF_EXPTIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPLCRSF <> @new_PF_EXPLCRSF
          or
          ( @old_PF_EXPLCRSF is null and @new_PF_EXPLCRSF is not null ) 
          or
          ( @old_PF_EXPLCRSF is not null and @new_PF_EXPLCRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPLCRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3661, convert(varchar(255), @old_PF_EXPLCRSF), convert(varchar(255), @new_PF_EXPLCRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPRSF <> @new_PF_EXPRSF
          or
          ( @old_PF_EXPRSF is null and @new_PF_EXPRSF is not null ) 
          or
          ( @old_PF_EXPRSF is not null and @new_PF_EXPRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3666, convert(varchar(255), @old_PF_EXPRSF), convert(varchar(255), @new_PF_EXPRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_EXPPCTREV <> @new_PF_EXPPCTREV
          or
          ( @old_PF_EXPPCTREV is null and @new_PF_EXPPCTREV is not null ) 
          or
          ( @old_PF_EXPPCTREV is not null and @new_PF_EXPPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_EXPPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3665, convert(varchar(255), @old_PF_EXPPCTREV), convert(varchar(255), @new_PF_EXPPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_NOIRSF <> @new_PF_NOIRSF
          or
          ( @old_PF_NOIRSF is null and @new_PF_NOIRSF is not null ) 
          or
          ( @old_PF_NOIRSF is not null and @new_PF_NOIRSF is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_NOIRSF' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3710, convert(varchar(255), @old_PF_NOIRSF), convert(varchar(255), @new_PF_NOIRSF), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_NOIPCTREV <> @new_PF_NOIPCTREV
          or
          ( @old_PF_NOIPCTREV is null and @new_PF_NOIPCTREV is not null ) 
          or
          ( @old_PF_NOIPCTREV is not null and @new_PF_NOIPCTREV is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_NOIPCTREV' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3709, convert(varchar(255), @old_PF_NOIPCTREV), convert(varchar(255), @new_PF_NOIPCTREV), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_flat_value <> @new_flat_value
          or
          ( @old_flat_value is null and @new_flat_value is not null ) 
          or
          ( @old_flat_value is not null and @new_flat_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'flat_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1931, convert(varchar(255), @old_flat_value), convert(varchar(255), @new_flat_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_econ_area <> @new_econ_area
          or
          ( @old_econ_area is null and @new_econ_area is not null ) 
          or
          ( @old_econ_area is not null and @new_econ_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'econ_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1408, convert(varchar(255), @old_econ_area), convert(varchar(255), @new_econ_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_prop_type_cd <> @new_prop_type_cd
          or
          ( @old_prop_type_cd is null and @new_prop_type_cd is not null ) 
          or
          ( @old_prop_type_cd is not null and @new_prop_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'prop_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4079, convert(varchar(255), @old_prop_type_cd), convert(varchar(255), @new_prop_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_class <> @new_class
          or
          ( @old_class is null and @new_class is not null ) 
          or
          ( @old_class is not null and @new_class is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'class' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 761, convert(varchar(255), @old_class), convert(varchar(255), @new_class), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_level_cd <> @new_level_cd
          or
          ( @old_level_cd is null and @new_level_cd is not null ) 
          or
          ( @old_level_cd is not null and @new_level_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'level_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2811, convert(varchar(255), @old_level_cd), convert(varchar(255), @new_level_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_yr_blt <> @new_yr_blt
          or
          ( @old_yr_blt is null and @new_yr_blt is not null ) 
          or
          ( @old_yr_blt is not null and @new_yr_blt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'yr_blt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 5557, convert(varchar(255), @old_yr_blt), convert(varchar(255), @new_yr_blt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_stories <> @new_stories
          or
          ( @old_stories is null and @new_stories is not null ) 
          or
          ( @old_stories is not null and @new_stories is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'stories' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4958, convert(varchar(255), @old_stories), convert(varchar(255), @new_stories), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_prop_name <> @new_prop_name
          or
          ( @old_prop_name is null and @new_prop_name is not null ) 
          or
          ( @old_prop_name is not null and @new_prop_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'prop_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4048, convert(varchar(255), @old_prop_name), convert(varchar(255), @new_prop_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_comment <> @new_comment
          or
          ( @old_comment is null and @new_comment is not null ) 
          or
          ( @old_comment is not null and @new_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 827, convert(varchar(255), @old_comment), convert(varchar(255), @new_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_value_method <> @new_value_method
          or
          ( @old_value_method is null and @new_value_method is not null ) 
          or
          ( @old_value_method is not null and @new_value_method is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'value_method' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 5491, convert(varchar(255), @old_value_method), convert(varchar(255), @new_value_method), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_income_value <> @new_income_value
          or
          ( @old_income_value is null and @new_income_value is not null ) 
          or
          ( @old_income_value is not null and @new_income_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'income_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2356, convert(varchar(255), @old_income_value), convert(varchar(255), @new_income_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_company <> @new_lease_company
          or
          ( @old_lease_company is null and @new_lease_company is not null ) 
          or
          ( @old_lease_company is not null and @new_lease_company is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_company' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2755, convert(varchar(255), @old_lease_company), convert(varchar(255), @new_lease_company), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_contact <> @new_lease_contact
          or
          ( @old_lease_contact is null and @new_lease_contact is not null ) 
          or
          ( @old_lease_contact is not null and @new_lease_contact is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_contact' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2756, convert(varchar(255), @old_lease_contact), convert(varchar(255), @new_lease_contact), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_address <> @new_lease_address
          or
          ( @old_lease_address is null and @new_lease_address is not null ) 
          or
          ( @old_lease_address is not null and @new_lease_address is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_address' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2753, convert(varchar(255), @old_lease_address), convert(varchar(255), @new_lease_address), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_phone <> @new_lease_phone
          or
          ( @old_lease_phone is null and @new_lease_phone is not null ) 
          or
          ( @old_lease_phone is not null and @new_lease_phone is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_phone' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2765, convert(varchar(255), @old_lease_phone), convert(varchar(255), @new_lease_phone), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_fax <> @new_lease_fax
          or
          ( @old_lease_fax is null and @new_lease_fax is not null ) 
          or
          ( @old_lease_fax is not null and @new_lease_fax is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_fax' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2759, convert(varchar(255), @old_lease_fax), convert(varchar(255), @new_lease_fax), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_email <> @new_lease_email
          or
          ( @old_lease_email is null and @new_lease_email is not null ) 
          or
          ( @old_lease_email is not null and @new_lease_email is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_email' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2758, convert(varchar(255), @old_lease_email), convert(varchar(255), @new_lease_email), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_survery_dt <> @new_lease_survery_dt
          or
          ( @old_lease_survery_dt is null and @new_lease_survery_dt is not null ) 
          or
          ( @old_lease_survery_dt is not null and @new_lease_survery_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_survery_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2767, convert(varchar(255), @old_lease_survery_dt), convert(varchar(255), @new_lease_survery_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_recalc_flag <> @new_recalc_flag
          or
          ( @old_recalc_flag is null and @new_recalc_flag is not null ) 
          or
          ( @old_recalc_flag is not null and @new_recalc_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'recalc_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4315, convert(varchar(255), @old_recalc_flag), convert(varchar(255), @new_recalc_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_ocr <> @new_pf_input_ocr
          or
          ( @old_pf_input_ocr is null and @new_pf_input_ocr is not null ) 
          or
          ( @old_pf_input_ocr is not null and @new_pf_input_ocr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_ocr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3692, convert(varchar(255), @old_pf_input_ocr), convert(varchar(255), @new_pf_input_ocr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_mgmtr <> @new_pf_input_mgmtr
          or
          ( @old_pf_input_mgmtr is null and @new_pf_input_mgmtr is not null ) 
          or
          ( @old_pf_input_mgmtr is not null and @new_pf_input_mgmtr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_mgmtr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3691, convert(varchar(255), @old_pf_input_mgmtr), convert(varchar(255), @new_pf_input_mgmtr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_exp_rsf <> @new_pf_input_exp_rsf
          or
          ( @old_pf_input_exp_rsf is null and @new_pf_input_exp_rsf is not null ) 
          or
          ( @old_pf_input_exp_rsf is not null and @new_pf_input_exp_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_exp_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3688, convert(varchar(255), @old_pf_input_exp_rsf), convert(varchar(255), @new_pf_input_exp_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_si_rsf <> @new_pf_input_si_rsf
          or
          ( @old_pf_input_si_rsf is null and @new_pf_input_si_rsf is not null ) 
          or
          ( @old_pf_input_si_rsf is not null and @new_pf_input_si_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_si_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3695, convert(varchar(255), @old_pf_input_si_rsf), convert(varchar(255), @new_pf_input_si_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_tir <> @new_pf_input_tir
          or
          ( @old_pf_input_tir is null and @new_pf_input_tir is not null ) 
          or
          ( @old_pf_input_tir is not null and @new_pf_input_tir is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_tir' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3696, convert(varchar(255), @old_pf_input_tir), convert(varchar(255), @new_pf_input_tir), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_rrr <> @new_pf_input_rrr
          or
          ( @old_pf_input_rrr is null and @new_pf_input_rrr is not null ) 
          or
          ( @old_pf_input_rrr is not null and @new_pf_input_rrr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_rrr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3694, convert(varchar(255), @old_pf_input_rrr), convert(varchar(255), @new_pf_input_rrr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_capr <> @new_pf_input_capr
          or
          ( @old_pf_input_capr is null and @new_pf_input_capr is not null ) 
          or
          ( @old_pf_input_capr is not null and @new_pf_input_capr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_capr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3686, convert(varchar(255), @old_pf_input_capr), convert(varchar(255), @new_pf_input_capr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_lease_rsf <> @new_pf_input_lease_rsf
          or
          ( @old_pf_input_lease_rsf is null and @new_pf_input_lease_rsf is not null ) 
          or
          ( @old_pf_input_lease_rsf is not null and @new_pf_input_lease_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_lease_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3690, convert(varchar(255), @old_pf_input_lease_rsf), convert(varchar(255), @new_pf_input_lease_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_date <> @new_pf_date
          or
          ( @old_pf_date is null and @new_pf_date is not null ) 
          or
          ( @old_pf_date is not null and @new_pf_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3654, convert(varchar(255), @old_pf_date), convert(varchar(255), @new_pf_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_prop_name <> @new_pf_prop_name
          or
          ( @old_pf_prop_name is null and @new_pf_prop_name is not null ) 
          or
          ( @old_pf_prop_name is not null and @new_pf_prop_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_prop_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3715, convert(varchar(255), @old_pf_prop_name), convert(varchar(255), @new_pf_prop_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_TAX <> @new_DC_TAX
          or
          ( @old_DC_TAX is null and @new_DC_TAX is not null ) 
          or
          ( @old_DC_TAX is not null and @new_DC_TAX is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_TAX' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1180, convert(varchar(255), @old_DC_TAX), convert(varchar(255), @new_DC_TAX), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_TAX <> @new_SCH_TAX
          or
          ( @old_SCH_TAX is null and @new_SCH_TAX is not null ) 
          or
          ( @old_SCH_TAX is not null and @new_SCH_TAX is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_TAX' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4664, convert(varchar(255), @old_SCH_TAX), convert(varchar(255), @new_SCH_TAX), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_TAX <> @new_PF_TAX
          or
          ( @old_PF_TAX is null and @new_PF_TAX is not null ) 
          or
          ( @old_PF_TAX is not null and @new_PF_TAX is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_TAX' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3723, convert(varchar(255), @old_PF_TAX), convert(varchar(255), @new_PF_TAX), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_override_dc_tax <> @new_override_dc_tax
          or
          ( @old_override_dc_tax is null and @new_override_dc_tax is not null ) 
          or
          ( @old_override_dc_tax is not null and @new_override_dc_tax is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'override_dc_tax' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3459, convert(varchar(255), @old_override_dc_tax), convert(varchar(255), @new_override_dc_tax), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_override_sch_tax <> @new_override_sch_tax
          or
          ( @old_override_sch_tax is null and @new_override_sch_tax is not null ) 
          or
          ( @old_override_sch_tax is not null and @new_override_sch_tax is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'override_sch_tax' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3467, convert(varchar(255), @old_override_sch_tax), convert(varchar(255), @new_override_sch_tax), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_override_pf_tax <> @new_override_pf_tax
          or
          ( @old_override_pf_tax is null and @new_override_pf_tax is not null ) 
          or
          ( @old_override_pf_tax is not null and @new_override_pf_tax is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'override_pf_tax' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3466, convert(varchar(255), @old_override_pf_tax), convert(varchar(255), @new_override_pf_tax), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_land_ratio <> @new_land_ratio
          or
          ( @old_land_ratio is null and @new_land_ratio is not null ) 
          or
          ( @old_land_ratio is not null and @new_land_ratio is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'land_ratio' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2651, convert(varchar(255), @old_land_ratio), convert(varchar(255), @new_land_ratio), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_land_ratio_typical <> @new_land_ratio_typical
          or
          ( @old_land_ratio_typical is null and @new_land_ratio_typical is not null ) 
          or
          ( @old_land_ratio_typical is not null and @new_land_ratio_typical is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'land_ratio_typical' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2654, convert(varchar(255), @old_land_ratio_typical), convert(varchar(255), @new_land_ratio_typical), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_land_rsf <> @new_land_rsf
          or
          ( @old_land_rsf is null and @new_land_rsf is not null ) 
          or
          ( @old_land_rsf is not null and @new_land_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'land_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2655, convert(varchar(255), @old_land_rsf), convert(varchar(255), @new_land_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_land_size <> @new_land_size
          or
          ( @old_land_size is null and @new_land_size is not null ) 
          or
          ( @old_land_size is not null and @new_land_size is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'land_size' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2672, convert(varchar(255), @old_land_size), convert(varchar(255), @new_land_size), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_land_excess_value <> @new_land_excess_value
          or
          ( @old_land_excess_value is null and @new_land_excess_value is not null ) 
          or
          ( @old_land_excess_value is not null and @new_land_excess_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'land_excess_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2590, convert(varchar(255), @old_land_excess_value), convert(varchar(255), @new_land_excess_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_rent_loss_area <> @new_lu_rent_loss_area
          or
          ( @old_lu_rent_loss_area is null and @new_lu_rent_loss_area is not null ) 
          or
          ( @old_lu_rent_loss_area is not null and @new_lu_rent_loss_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_rent_loss_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2967, convert(varchar(255), @old_lu_rent_loss_area), convert(varchar(255), @new_lu_rent_loss_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_rent_sf <> @new_lu_rent_sf
          or
          ( @old_lu_rent_sf is null and @new_lu_rent_sf is not null ) 
          or
          ( @old_lu_rent_sf is not null and @new_lu_rent_sf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_rent_sf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2969, convert(varchar(255), @old_lu_rent_sf), convert(varchar(255), @new_lu_rent_sf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_rent_num_year <> @new_lu_rent_num_year
          or
          ( @old_lu_rent_num_year is null and @new_lu_rent_num_year is not null ) 
          or
          ( @old_lu_rent_num_year is not null and @new_lu_rent_num_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_rent_num_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2968, convert(varchar(255), @old_lu_rent_num_year), convert(varchar(255), @new_lu_rent_num_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_rent_total <> @new_lu_rent_total
          or
          ( @old_lu_rent_total is null and @new_lu_rent_total is not null ) 
          or
          ( @old_lu_rent_total is not null and @new_lu_rent_total is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_rent_total' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2970, convert(varchar(255), @old_lu_rent_total), convert(varchar(255), @new_lu_rent_total), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_lease_pct <> @new_lu_lease_pct
          or
          ( @old_lu_lease_pct is null and @new_lu_lease_pct is not null ) 
          or
          ( @old_lu_lease_pct is not null and @new_lu_lease_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_lease_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2963, convert(varchar(255), @old_lu_lease_pct), convert(varchar(255), @new_lu_lease_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_lease_total <> @new_lu_lease_total
          or
          ( @old_lu_lease_total is null and @new_lu_lease_total is not null ) 
          or
          ( @old_lu_lease_total is not null and @new_lu_lease_total is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_lease_total' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2964, convert(varchar(255), @old_lu_lease_total), convert(varchar(255), @new_lu_lease_total), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_tfo_sf <> @new_lu_tfo_sf
          or
          ( @old_lu_tfo_sf is null and @new_lu_tfo_sf is not null ) 
          or
          ( @old_lu_tfo_sf is not null and @new_lu_tfo_sf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_tfo_sf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2971, convert(varchar(255), @old_lu_tfo_sf), convert(varchar(255), @new_lu_tfo_sf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_tfo_total <> @new_lu_tfo_total
          or
          ( @old_lu_tfo_total is null and @new_lu_tfo_total is not null ) 
          or
          ( @old_lu_tfo_total is not null and @new_lu_tfo_total is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_tfo_total' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2972, convert(varchar(255), @old_lu_tfo_total), convert(varchar(255), @new_lu_tfo_total), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_disc_rate <> @new_lu_disc_rate
          or
          ( @old_lu_disc_rate is null and @new_lu_disc_rate is not null ) 
          or
          ( @old_lu_disc_rate is not null and @new_lu_disc_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_disc_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2962, convert(varchar(255), @old_lu_disc_rate), convert(varchar(255), @new_lu_disc_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_num_year <> @new_lu_num_year
          or
          ( @old_lu_num_year is null and @new_lu_num_year is not null ) 
          or
          ( @old_lu_num_year is not null and @new_lu_num_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_num_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2965, convert(varchar(255), @old_lu_num_year), convert(varchar(255), @new_lu_num_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_cost <> @new_lu_cost
          or
          ( @old_lu_cost is null and @new_lu_cost is not null ) 
          or
          ( @old_lu_cost is not null and @new_lu_cost is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_cost' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2961, convert(varchar(255), @old_lu_cost), convert(varchar(255), @new_lu_cost), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_ind_rsf <> @new_dc_ind_rsf
          or
          ( @old_dc_ind_rsf is null and @new_dc_ind_rsf is not null ) 
          or
          ( @old_dc_ind_rsf is not null and @new_dc_ind_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'dc_ind_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1161, convert(varchar(255), @old_dc_ind_rsf), convert(varchar(255), @new_dc_ind_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_ind_rsf <> @new_sch_ind_rsf
          or
          ( @old_sch_ind_rsf is null and @new_sch_ind_rsf is not null ) 
          or
          ( @old_sch_ind_rsf is not null and @new_sch_ind_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'sch_ind_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4645, convert(varchar(255), @old_sch_ind_rsf), convert(varchar(255), @new_sch_ind_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_ind_rsf <> @new_pf_ind_rsf
          or
          ( @old_pf_ind_rsf is null and @new_pf_ind_rsf is not null ) 
          or
          ( @old_pf_ind_rsf is not null and @new_pf_ind_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_ind_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3684, convert(varchar(255), @old_pf_ind_rsf), convert(varchar(255), @new_pf_ind_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_ocr_rsf <> @new_dc_ocr_rsf
          or
          ( @old_dc_ocr_rsf is null and @new_dc_ocr_rsf is not null ) 
          or
          ( @old_dc_ocr_rsf is not null and @new_dc_ocr_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'dc_ocr_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1173, convert(varchar(255), @old_dc_ocr_rsf), convert(varchar(255), @new_dc_ocr_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_ocr_rsf <> @new_sch_ocr_rsf
          or
          ( @old_sch_ocr_rsf is null and @new_sch_ocr_rsf is not null ) 
          or
          ( @old_sch_ocr_rsf is not null and @new_sch_ocr_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'sch_ocr_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4657, convert(varchar(255), @old_sch_ocr_rsf), convert(varchar(255), @new_sch_ocr_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_ocr_rsf <> @new_pf_ocr_rsf
          or
          ( @old_pf_ocr_rsf is null and @new_pf_ocr_rsf is not null ) 
          or
          ( @old_pf_ocr_rsf is not null and @new_pf_ocr_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_ocr_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3711, convert(varchar(255), @old_pf_ocr_rsf), convert(varchar(255), @new_pf_ocr_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_ocr_runit <> @new_dc_ocr_runit
          or
          ( @old_dc_ocr_runit is null and @new_dc_ocr_runit is not null ) 
          or
          ( @old_dc_ocr_runit is not null and @new_dc_ocr_runit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'dc_ocr_runit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1174, convert(varchar(255), @old_dc_ocr_runit), convert(varchar(255), @new_dc_ocr_runit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_ocr_runit <> @new_sch_ocr_runit
          or
          ( @old_sch_ocr_runit is null and @new_sch_ocr_runit is not null ) 
          or
          ( @old_sch_ocr_runit is not null and @new_sch_ocr_runit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'sch_ocr_runit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4658, convert(varchar(255), @old_sch_ocr_runit), convert(varchar(255), @new_sch_ocr_runit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_ocr_runit <> @new_pf_ocr_runit
          or
          ( @old_pf_ocr_runit is null and @new_pf_ocr_runit is not null ) 
          or
          ( @old_pf_ocr_runit is not null and @new_pf_ocr_runit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_ocr_runit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3712, convert(varchar(255), @old_pf_ocr_runit), convert(varchar(255), @new_pf_ocr_runit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_ind_runit <> @new_dc_ind_runit
          or
          ( @old_dc_ind_runit is null and @new_dc_ind_runit is not null ) 
          or
          ( @old_dc_ind_runit is not null and @new_dc_ind_runit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'dc_ind_runit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1162, convert(varchar(255), @old_dc_ind_runit), convert(varchar(255), @new_dc_ind_runit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_ind_runit <> @new_sch_ind_runit
          or
          ( @old_sch_ind_runit is null and @new_sch_ind_runit is not null ) 
          or
          ( @old_sch_ind_runit is not null and @new_sch_ind_runit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'sch_ind_runit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4646, convert(varchar(255), @old_sch_ind_runit), convert(varchar(255), @new_sch_ind_runit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_ind_runit <> @new_pf_ind_runit
          or
          ( @old_pf_ind_runit is null and @new_pf_ind_runit is not null ) 
          or
          ( @old_pf_ind_runit is not null and @new_pf_ind_runit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_ind_runit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3685, convert(varchar(255), @old_pf_ind_runit), convert(varchar(255), @new_pf_ind_runit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_num_units <> @new_num_units
          or
          ( @old_num_units is null and @new_num_units is not null ) 
          or
          ( @old_num_units is not null and @new_num_units is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'num_units' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3371, convert(varchar(255), @old_num_units), convert(varchar(255), @new_num_units), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_override_num_units <> @new_override_num_units
          or
          ( @old_override_num_units is null and @new_override_num_units is not null ) 
          or
          ( @old_override_num_units is not null and @new_override_num_units is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'override_num_units' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3463, convert(varchar(255), @old_override_num_units), convert(varchar(255), @new_override_num_units), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lu_override_cost <> @new_lu_override_cost
          or
          ( @old_lu_override_cost is null and @new_lu_override_cost is not null ) 
          or
          ( @old_lu_override_cost is not null and @new_lu_override_cost is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lu_override_cost' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2966, convert(varchar(255), @old_lu_override_cost), convert(varchar(255), @new_lu_override_cost), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_VARate <> @new_pf_input_VARate
          or
          ( @old_pf_input_VARate is null and @new_pf_input_VARate is not null ) 
          or
          ( @old_pf_input_VARate is not null and @new_pf_input_VARate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_VARate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3697, convert(varchar(255), @old_pf_input_VARate), convert(varchar(255), @new_pf_input_VARate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_expense_structure_cd <> @new_expense_structure_cd
          or
          ( @old_expense_structure_cd is null and @new_expense_structure_cd is not null ) 
          or
          ( @old_expense_structure_cd is not null and @new_expense_structure_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'expense_structure_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 1840, convert(varchar(255), @old_expense_structure_cd), convert(varchar(255), @new_expense_structure_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_lease_type_cd <> @new_lease_type_cd
          or
          ( @old_lease_type_cd is null and @new_lease_type_cd is not null ) 
          or
          ( @old_lease_type_cd is not null and @new_lease_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'lease_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2768, convert(varchar(255), @old_lease_type_cd), convert(varchar(255), @new_lease_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_rent_type_cd <> @new_rent_type_cd
          or
          ( @old_rent_type_cd is null and @new_rent_type_cd is not null ) 
          or
          ( @old_rent_type_cd is not null and @new_rent_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'rent_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 4382, convert(varchar(255), @old_rent_type_cd), convert(varchar(255), @new_rent_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_clr <> @new_pf_input_clr
          or
          ( @old_pf_input_clr is null and @new_pf_input_clr is not null ) 
          or
          ( @old_pf_input_clr is not null and @new_pf_input_clr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_clr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3687, convert(varchar(255), @old_pf_input_clr), convert(varchar(255), @new_pf_input_clr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_rer <> @new_pf_input_rer
          or
          ( @old_pf_input_rer is null and @new_pf_input_rer is not null ) 
          or
          ( @old_pf_input_rer is not null and @new_pf_input_rer is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_rer' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3693, convert(varchar(255), @old_pf_input_rer), convert(varchar(255), @new_pf_input_rer), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_input_lcr <> @new_pf_input_lcr
          or
          ( @old_pf_input_lcr is null and @new_pf_input_lcr is not null ) 
          or
          ( @old_pf_input_lcr is not null and @new_pf_input_lcr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'pf_input_lcr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 3689, convert(varchar(255), @old_pf_input_lcr), convert(varchar(255), @new_pf_input_lcr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_include_in_pf <> @new_include_in_pf
          or
          ( @old_include_in_pf is null and @new_include_in_pf is not null ) 
          or
          ( @old_include_in_pf is not null and @new_include_in_pf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'include_in_pf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 2337, convert(varchar(255), @old_include_in_pf), convert(varchar(255), @new_include_in_pf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_other_value <> @new_DC_other_value
          or
          ( @old_DC_other_value is null and @new_DC_other_value is not null ) 
          or
          ( @old_DC_other_value is not null and @new_DC_other_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_other_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9739, convert(varchar(255), @old_DC_other_value), convert(varchar(255), @new_DC_other_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_other_value_comment <> @new_DC_other_value_comment
          or
          ( @old_DC_other_value_comment is null and @new_DC_other_value_comment is not null ) 
          or
          ( @old_DC_other_value_comment is not null and @new_DC_other_value_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_other_value_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9740, convert(varchar(255), @old_DC_other_value_comment), convert(varchar(255), @new_DC_other_value_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_DC_base_indicated_value <> @new_DC_base_indicated_value
          or
          ( @old_DC_base_indicated_value is null and @new_DC_base_indicated_value is not null ) 
          or
          ( @old_DC_base_indicated_value is not null and @new_DC_base_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'DC_base_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9733, convert(varchar(255), @old_DC_base_indicated_value), convert(varchar(255), @new_DC_base_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_other_value <> @new_SCH_other_value
          or
          ( @old_SCH_other_value is null and @new_SCH_other_value is not null ) 
          or
          ( @old_SCH_other_value is not null and @new_SCH_other_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_other_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9776, convert(varchar(255), @old_SCH_other_value), convert(varchar(255), @new_SCH_other_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_other_value_comment <> @new_SCH_other_value_comment
          or
          ( @old_SCH_other_value_comment is null and @new_SCH_other_value_comment is not null ) 
          or
          ( @old_SCH_other_value_comment is not null and @new_SCH_other_value_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_other_value_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9777, convert(varchar(255), @old_SCH_other_value_comment), convert(varchar(255), @new_SCH_other_value_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_SCH_base_indicated_value <> @new_SCH_base_indicated_value
          or
          ( @old_SCH_base_indicated_value is null and @new_SCH_base_indicated_value is not null ) 
          or
          ( @old_SCH_base_indicated_value is not null and @new_SCH_base_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'SCH_base_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9770, convert(varchar(255), @old_SCH_base_indicated_value), convert(varchar(255), @new_SCH_base_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_other_value <> @new_PF_other_value
          or
          ( @old_PF_other_value is null and @new_PF_other_value is not null ) 
          or
          ( @old_PF_other_value is not null and @new_PF_other_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_other_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9761, convert(varchar(255), @old_PF_other_value), convert(varchar(255), @new_PF_other_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_other_value_comment <> @new_PF_other_value_comment
          or
          ( @old_PF_other_value_comment is null and @new_PF_other_value_comment is not null ) 
          or
          ( @old_PF_other_value_comment is not null and @new_PF_other_value_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_other_value_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9762, convert(varchar(255), @old_PF_other_value_comment), convert(varchar(255), @new_PF_other_value_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PF_base_indicated_value <> @new_PF_base_indicated_value
          or
          ( @old_PF_base_indicated_value is null and @new_PF_base_indicated_value is not null ) 
          or
          ( @old_PF_base_indicated_value is not null and @new_PF_base_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'PF_base_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9755, convert(varchar(255), @old_PF_base_indicated_value), convert(varchar(255), @new_PF_base_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_include_in_grm_gim <> @new_include_in_grm_gim
          or
          ( @old_include_in_grm_gim is null and @new_include_in_grm_gim is not null ) 
          or
          ( @old_include_in_grm_gim is not null and @new_include_in_grm_gim is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'include_in_grm_gim' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9748, convert(varchar(255), @old_include_in_grm_gim), convert(varchar(255), @new_include_in_grm_gim), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_non_income_land_imps_value <> @new_non_income_land_imps_value
          or
          ( @old_non_income_land_imps_value is null and @new_non_income_land_imps_value is not null ) 
          or
          ( @old_non_income_land_imps_value is not null and @new_non_income_land_imps_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'non_income_land_imps_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9751, convert(varchar(255), @old_non_income_land_imps_value), convert(varchar(255), @new_non_income_land_imps_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_non_income_land_value <> @new_non_income_land_value
          or
          ( @old_non_income_land_value is null and @new_non_income_land_value is not null ) 
          or
          ( @old_non_income_land_value is not null and @new_non_income_land_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'non_income_land_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9752, convert(varchar(255), @old_non_income_land_value), convert(varchar(255), @new_non_income_land_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_non_income_imprv_value <> @new_non_income_imprv_value
          or
          ( @old_non_income_imprv_value is null and @new_non_income_imprv_value is not null ) 
          or
          ( @old_non_income_imprv_value is not null and @new_non_income_imprv_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'non_income_imprv_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9750, convert(varchar(255), @old_non_income_imprv_value), convert(varchar(255), @new_non_income_imprv_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_other_land_value <> @new_other_land_value
          or
          ( @old_other_land_value is null and @new_other_land_value is not null ) 
          or
          ( @old_other_land_value is not null and @new_other_land_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'other_land_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9754, convert(varchar(255), @old_other_land_value), convert(varchar(255), @new_other_land_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_grid_static <> @new_schil_grid_static
          or
          ( @old_schil_grid_static is null and @new_schil_grid_static is not null ) 
          or
          ( @old_schil_grid_static is not null and @new_schil_grid_static is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_grid_static' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9782, convert(varchar(255), @old_schil_grid_static), convert(varchar(255), @new_schil_grid_static), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_override_schedule_values <> @new_schil_override_schedule_values
          or
          ( @old_schil_override_schedule_values is null and @new_schil_override_schedule_values is not null ) 
          or
          ( @old_schil_override_schedule_values is not null and @new_schil_override_schedule_values is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_override_schedule_values' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9789, convert(varchar(255), @old_schil_override_schedule_values), convert(varchar(255), @new_schil_override_schedule_values), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_method_value <> @new_schil_method_value
          or
          ( @old_schil_method_value is null and @new_schil_method_value is not null ) 
          or
          ( @old_schil_method_value is not null and @new_schil_method_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_method_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9786, convert(varchar(255), @old_schil_method_value), convert(varchar(255), @new_schil_method_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_personal_property_value <> @new_schil_personal_property_value
          or
          ( @old_schil_personal_property_value is null and @new_schil_personal_property_value is not null ) 
          or
          ( @old_schil_personal_property_value is not null and @new_schil_personal_property_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_personal_property_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9790, convert(varchar(255), @old_schil_personal_property_value), convert(varchar(255), @new_schil_personal_property_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_other_value <> @new_schil_other_value
          or
          ( @old_schil_other_value is null and @new_schil_other_value is not null ) 
          or
          ( @old_schil_other_value is not null and @new_schil_other_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_other_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9787, convert(varchar(255), @old_schil_other_value), convert(varchar(255), @new_schil_other_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_other_value_comment <> @new_schil_other_value_comment
          or
          ( @old_schil_other_value_comment is null and @new_schil_other_value_comment is not null ) 
          or
          ( @old_schil_other_value_comment is not null and @new_schil_other_value_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_other_value_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9788, convert(varchar(255), @old_schil_other_value_comment), convert(varchar(255), @new_schil_other_value_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_base_indicated_value <> @new_schil_base_indicated_value
          or
          ( @old_schil_base_indicated_value is null and @new_schil_base_indicated_value is not null ) 
          or
          ( @old_schil_base_indicated_value is not null and @new_schil_base_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_base_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9781, convert(varchar(255), @old_schil_base_indicated_value), convert(varchar(255), @new_schil_base_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_indicated_value <> @new_schil_indicated_value
          or
          ( @old_schil_indicated_value is null and @new_schil_indicated_value is not null ) 
          or
          ( @old_schil_indicated_value is not null and @new_schil_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9785, convert(varchar(255), @old_schil_indicated_value), convert(varchar(255), @new_schil_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_indicated_land_value <> @new_schil_indicated_land_value
          or
          ( @old_schil_indicated_land_value is null and @new_schil_indicated_land_value is not null ) 
          or
          ( @old_schil_indicated_land_value is not null and @new_schil_indicated_land_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_indicated_land_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9784, convert(varchar(255), @old_schil_indicated_land_value), convert(varchar(255), @new_schil_indicated_land_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_schil_indicated_imprv_value <> @new_schil_indicated_imprv_value
          or
          ( @old_schil_indicated_imprv_value is null and @new_schil_indicated_imprv_value is not null ) 
          or
          ( @old_schil_indicated_imprv_value is not null and @new_schil_indicated_imprv_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income' and
                    chg_log_columns = 'schil_indicated_imprv_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 333, 9783, convert(varchar(255), @old_schil_indicated_imprv_value), convert(varchar(255), @new_schil_indicated_imprv_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_income_id, @old_sup_num, @old_income_yr, @old_GBA, @old_NRA, @old_TAX, @old_override_tax, @old_override_gba, @old_DC_LA, @old_DC_VA, @old_DC_BE, @old_DC_OR, @old_DC_VR, @old_DC_LARate, @old_DC_VARate, @old_DC_LI, @old_DC_VI, @old_DC_GPI, @old_DC_GPIVR, @old_DC_GPIVI, @old_DC_GPICLR, @old_DC_GPICLI, @old_DC_GPIRER, @old_DC_GPIRE, @old_DC_GPISIR, @old_DC_GPISI, @old_DC_EGI, @old_DC_EXPOEI, @old_DC_MGMTR, @old_DC_MGMTI, @old_DC_RRR, @old_DC_RRI, @old_DC_TIR, @old_DC_TII, @old_DC_LCR, @old_DC_LCI, @old_DC_EXP, @old_DC_NOI, @old_DC_CAPR, @old_DC_CAPI, @old_DC_PERS, @old_DC_IND, @old_DC_GPIRSF, @old_DC_GPIVRSF, @old_DC_GPICLRSF, @old_DC_GPIRERSF, @old_DC_GPISIRSF, @old_DC_EGIRSF, @old_DC_EGIPCTREV, @old_DC_EXPOERSF, @old_DC_EXPTAXRSF, @old_DC_EXPMGMTRSF, @old_DC_RRRSF, @old_DC_EXPTIRSF, @old_DC_EXPLCRSF, @old_DC_EXPRSF, @old_DC_EXPPCTREV, @old_DC_NOIRSF, @old_DC_NOIPCTREV, @old_SCH_LA, @old_SCH_VA, @old_SCH_BE, @old_SCH_OR, @old_SCH_VR, @old_SCH_LARate, @old_SCH_VARate, @old_SCH_LI, @old_SCH_VI, @old_SCH_GPI, @old_SCH_GPIVR, @old_SCH_GPIVI, @old_SCH_GPICLR, @old_SCH_GPICLI, @old_SCH_GPIRER, @old_SCH_GPIRE, @old_SCH_GPISIR, @old_SCH_GPISI, @old_SCH_EGI, @old_SCH_EXPOEI, @old_SCH_MGMTR, @old_SCH_MGMTI, @old_SCH_RRR, @old_SCH_RRI, @old_SCH_TIR, @old_SCH_TII, @old_SCH_LCR, @old_SCH_LCI, @old_SCH_EXP, @old_SCH_NOI, @old_SCH_CAPR, @old_SCH_CAPI, @old_SCH_PERS, @old_SCH_IND, @old_SCH_GPIRSF, @old_SCH_GPIVRSF, @old_SCH_GPICLRSF, @old_SCH_GPIRERSF, @old_SCH_GPISIRSF, @old_SCH_EGIRSF, @old_SCH_EGIPCTREV, @old_SCH_EXPOERSF, @old_SCH_EXPTAXRSF, @old_SCH_EXPMGMTRSF, @old_SCH_RRRSF, @old_SCH_EXPTIRSF, @old_SCH_EXPLCRSF, @old_SCH_EXPRSF, @old_SCH_EXPPCTREV, @old_SCH_NOIRSF, @old_SCH_NOIPCTREV, @old_PF_LA, @old_PF_VA, @old_PF_BE, @old_PF_OR, @old_PF_VR, @old_PF_LARate, @old_PF_VARate, @old_PF_LI, @old_PF_VI, @old_PF_GPI, @old_PF_GPIVR, @old_PF_GPIVI, @old_PF_GPICLR, @old_PF_GPICLI, @old_PF_GPIRER, @old_PF_GPIRE, @old_PF_GPISIR, @old_PF_GPISI, @old_PF_EGI, @old_PF_EXPOEI, @old_PF_MGMTR, @old_PF_MGMTI, @old_PF_RRR, @old_PF_RRI, @old_PF_TIR, @old_PF_TII, @old_PF_LCR, @old_PF_LCI, @old_PF_EXP, @old_PF_NOI, @old_PF_CAPR, @old_PF_CAPI, @old_PF_PERS, @old_PF_IND, @old_PF_GPIRSF, @old_PF_GPIVRSF, @old_PF_GPICLRSF, @old_PF_GPIRERSF, @old_PF_GPISIRSF, @old_PF_EGIRSF, @old_PF_EGIPCTREV, @old_PF_EXPOERSF, @old_PF_EXPTAXRSF, @old_PF_EXPMGMTRSF, @old_PF_RRRSF, @old_PF_EXPTIRSF, @old_PF_EXPLCRSF, @old_PF_EXPRSF, @old_PF_EXPPCTREV, @old_PF_NOIRSF, @old_PF_NOIPCTREV, @old_flat_value, @old_econ_area, @old_prop_type_cd, @old_class, @old_level_cd, @old_yr_blt, @old_stories, @old_prop_name, @old_comment, @old_value_method, @old_income_value, @old_lease_company, @old_lease_contact, @old_lease_address, @old_lease_phone, @old_lease_fax, @old_lease_email, @old_lease_survery_dt, @old_recalc_flag, @old_pf_input_ocr, @old_pf_input_mgmtr, @old_pf_input_exp_rsf, @old_pf_input_si_rsf, @old_pf_input_tir, @old_pf_input_rrr, @old_pf_input_capr, @old_pf_input_lease_rsf, @old_pf_date, @old_pf_prop_name, @old_DC_TAX, @old_SCH_TAX, @old_PF_TAX, @old_override_dc_tax, @old_override_sch_tax, @old_override_pf_tax, @old_land_ratio, @old_land_ratio_typical, @old_land_rsf, @old_land_size, @old_land_excess_value, @old_lu_rent_loss_area, @old_lu_rent_sf, @old_lu_rent_num_year, @old_lu_rent_total, @old_lu_lease_pct, @old_lu_lease_total, @old_lu_tfo_sf, @old_lu_tfo_total, @old_lu_disc_rate, @old_lu_num_year, @old_lu_cost, @old_dc_ind_rsf, @old_sch_ind_rsf, @old_pf_ind_rsf, @old_dc_ocr_rsf, @old_sch_ocr_rsf, @old_pf_ocr_rsf, @old_dc_ocr_runit, @old_sch_ocr_runit, @old_pf_ocr_runit, @old_dc_ind_runit, @old_sch_ind_runit, @old_pf_ind_runit, @old_num_units, @old_override_num_units, @old_lu_override_cost, @old_pf_input_VARate, @old_expense_structure_cd, @old_lease_type_cd, @old_rent_type_cd, @old_pf_input_clr, @old_pf_input_rer, @old_pf_input_lcr, @old_include_in_pf, @old_DC_other_value, @old_DC_other_value_comment, @old_DC_base_indicated_value, @old_SCH_other_value, @old_SCH_other_value_comment, @old_SCH_base_indicated_value, @old_PF_other_value, @old_PF_other_value_comment, @old_PF_base_indicated_value, @old_include_in_grm_gim, @old_non_income_land_imps_value, @old_non_income_land_value, @old_non_income_imprv_value, @old_other_land_value, @old_schil_grid_static, @old_schil_override_schedule_values, @old_schil_method_value, @old_schil_personal_property_value, @old_schil_other_value, @old_schil_other_value_comment, @old_schil_base_indicated_value, @old_schil_indicated_value, @old_schil_indicated_land_value, @old_schil_indicated_imprv_value, 
                                  @new_income_id, @new_sup_num, @new_income_yr, @new_GBA, @new_NRA, @new_TAX, @new_override_tax, @new_override_gba, @new_DC_LA, @new_DC_VA, @new_DC_BE, @new_DC_OR, @new_DC_VR, @new_DC_LARate, @new_DC_VARate, @new_DC_LI, @new_DC_VI, @new_DC_GPI, @new_DC_GPIVR, @new_DC_GPIVI, @new_DC_GPICLR, @new_DC_GPICLI, @new_DC_GPIRER, @new_DC_GPIRE, @new_DC_GPISIR, @new_DC_GPISI, @new_DC_EGI, @new_DC_EXPOEI, @new_DC_MGMTR, @new_DC_MGMTI, @new_DC_RRR, @new_DC_RRI, @new_DC_TIR, @new_DC_TII, @new_DC_LCR, @new_DC_LCI, @new_DC_EXP, @new_DC_NOI, @new_DC_CAPR, @new_DC_CAPI, @new_DC_PERS, @new_DC_IND, @new_DC_GPIRSF, @new_DC_GPIVRSF, @new_DC_GPICLRSF, @new_DC_GPIRERSF, @new_DC_GPISIRSF, @new_DC_EGIRSF, @new_DC_EGIPCTREV, @new_DC_EXPOERSF, @new_DC_EXPTAXRSF, @new_DC_EXPMGMTRSF, @new_DC_RRRSF, @new_DC_EXPTIRSF, @new_DC_EXPLCRSF, @new_DC_EXPRSF, @new_DC_EXPPCTREV, @new_DC_NOIRSF, @new_DC_NOIPCTREV, @new_SCH_LA, @new_SCH_VA, @new_SCH_BE, @new_SCH_OR, @new_SCH_VR, @new_SCH_LARate, @new_SCH_VARate, @new_SCH_LI, @new_SCH_VI, @new_SCH_GPI, @new_SCH_GPIVR, @new_SCH_GPIVI, @new_SCH_GPICLR, @new_SCH_GPICLI, @new_SCH_GPIRER, @new_SCH_GPIRE, @new_SCH_GPISIR, @new_SCH_GPISI, @new_SCH_EGI, @new_SCH_EXPOEI, @new_SCH_MGMTR, @new_SCH_MGMTI, @new_SCH_RRR, @new_SCH_RRI, @new_SCH_TIR, @new_SCH_TII, @new_SCH_LCR, @new_SCH_LCI, @new_SCH_EXP, @new_SCH_NOI, @new_SCH_CAPR, @new_SCH_CAPI, @new_SCH_PERS, @new_SCH_IND, @new_SCH_GPIRSF, @new_SCH_GPIVRSF, @new_SCH_GPICLRSF, @new_SCH_GPIRERSF, @new_SCH_GPISIRSF, @new_SCH_EGIRSF, @new_SCH_EGIPCTREV, @new_SCH_EXPOERSF, @new_SCH_EXPTAXRSF, @new_SCH_EXPMGMTRSF, @new_SCH_RRRSF, @new_SCH_EXPTIRSF, @new_SCH_EXPLCRSF, @new_SCH_EXPRSF, @new_SCH_EXPPCTREV, @new_SCH_NOIRSF, @new_SCH_NOIPCTREV, @new_PF_LA, @new_PF_VA, @new_PF_BE, @new_PF_OR, @new_PF_VR, @new_PF_LARate, @new_PF_VARate, @new_PF_LI, @new_PF_VI, @new_PF_GPI, @new_PF_GPIVR, @new_PF_GPIVI, @new_PF_GPICLR, @new_PF_GPICLI, @new_PF_GPIRER, @new_PF_GPIRE, @new_PF_GPISIR, @new_PF_GPISI, @new_PF_EGI, @new_PF_EXPOEI, @new_PF_MGMTR, @new_PF_MGMTI, @new_PF_RRR, @new_PF_RRI, @new_PF_TIR, @new_PF_TII, @new_PF_LCR, @new_PF_LCI, @new_PF_EXP, @new_PF_NOI, @new_PF_CAPR, @new_PF_CAPI, @new_PF_PERS, @new_PF_IND, @new_PF_GPIRSF, @new_PF_GPIVRSF, @new_PF_GPICLRSF, @new_PF_GPIRERSF, @new_PF_GPISIRSF, @new_PF_EGIRSF, @new_PF_EGIPCTREV, @new_PF_EXPOERSF, @new_PF_EXPTAXRSF, @new_PF_EXPMGMTRSF, @new_PF_RRRSF, @new_PF_EXPTIRSF, @new_PF_EXPLCRSF, @new_PF_EXPRSF, @new_PF_EXPPCTREV, @new_PF_NOIRSF, @new_PF_NOIPCTREV, @new_flat_value, @new_econ_area, @new_prop_type_cd, @new_class, @new_level_cd, @new_yr_blt, @new_stories, @new_prop_name, @new_comment, @new_value_method, @new_income_value, @new_lease_company, @new_lease_contact, @new_lease_address, @new_lease_phone, @new_lease_fax, @new_lease_email, @new_lease_survery_dt, @new_recalc_flag, @new_pf_input_ocr, @new_pf_input_mgmtr, @new_pf_input_exp_rsf, @new_pf_input_si_rsf, @new_pf_input_tir, @new_pf_input_rrr, @new_pf_input_capr, @new_pf_input_lease_rsf, @new_pf_date, @new_pf_prop_name, @new_DC_TAX, @new_SCH_TAX, @new_PF_TAX, @new_override_dc_tax, @new_override_sch_tax, @new_override_pf_tax, @new_land_ratio, @new_land_ratio_typical, @new_land_rsf, @new_land_size, @new_land_excess_value, @new_lu_rent_loss_area, @new_lu_rent_sf, @new_lu_rent_num_year, @new_lu_rent_total, @new_lu_lease_pct, @new_lu_lease_total, @new_lu_tfo_sf, @new_lu_tfo_total, @new_lu_disc_rate, @new_lu_num_year, @new_lu_cost, @new_dc_ind_rsf, @new_sch_ind_rsf, @new_pf_ind_rsf, @new_dc_ocr_rsf, @new_sch_ocr_rsf, @new_pf_ocr_rsf, @new_dc_ocr_runit, @new_sch_ocr_runit, @new_pf_ocr_runit, @new_dc_ind_runit, @new_sch_ind_runit, @new_pf_ind_runit, @new_num_units, @new_override_num_units, @new_lu_override_cost, @new_pf_input_VARate, @new_expense_structure_cd, @new_lease_type_cd, @new_rent_type_cd, @new_pf_input_clr, @new_pf_input_rer, @new_pf_input_lcr, @new_include_in_pf, @new_DC_other_value, @new_DC_other_value_comment, @new_DC_base_indicated_value, @new_SCH_other_value, @new_SCH_other_value_comment, @new_SCH_base_indicated_value, @new_PF_other_value, @new_PF_other_value_comment, @new_PF_base_indicated_value, @new_include_in_grm_gim, @new_non_income_land_imps_value, @new_non_income_land_value, @new_non_income_imprv_value, @new_other_land_value, @new_schil_grid_static, @new_schil_override_schedule_values, @new_schil_method_value, @new_schil_personal_property_value, @new_schil_other_value, @new_schil_other_value_comment, @new_schil_base_indicated_value, @new_schil_indicated_value, @new_schil_indicated_land_value, @new_schil_indicated_imprv_value
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Direct Cap Other Value Comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'DC_other_value_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Non-Income Land/Imps Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'non_income_land_imps_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'indicated improvement value for pro forma income valuation', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'PF_indicated_imprv_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Other Value Comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_other_value_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Pro Forma Other Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'PF_other_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Override Schedule Values', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_override_schedule_values';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Number of designated units', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'num_designated_units';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Direct Cap Other Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'DC_other_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Include in GRM/GIM Pro Forma Searches', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'include_in_grm_gim';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Other Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_other_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'indicated improvement value for schedule(property level) income valuation', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'SCH_indicated_imprv_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Base Indicated Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'SCH_base_indicated_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Indicated Improvement Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_indicated_imprv_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Make Income Schedule Improvement Level Grid Static', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_grid_static';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Pro Forma Base Indicated Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'PF_base_indicated_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'indicated improvement value for direct cap income valuation', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'DC_indicated_imprv_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Less Personal Property Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_personal_property_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Other Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'SCH_other_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Other Value Comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'SCH_other_value_comment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Other Land Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'other_land_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Indicated Land Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_indicated_land_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Method Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_method_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Direct Cap Base Indicated Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'DC_base_indicated_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Non-Income Land Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'non_income_land_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Base Indicated Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_base_indicated_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Non-Income Improvement Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'non_income_imprv_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Schedule Improvement Level Indicated Value', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'schil_indicated_value';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'GBA of designated units', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'gba_designated_units';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Pro Forma Other Value Comment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income', @level2type = N'COLUMN', @level2name = N'PF_other_value_comment';


GO

