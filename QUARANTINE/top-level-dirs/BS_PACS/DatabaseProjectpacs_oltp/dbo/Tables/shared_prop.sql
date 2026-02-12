CREATE TABLE [dbo].[shared_prop] (
    [pacs_prop_id]             INT             NOT NULL,
    [shared_year]              NUMERIC (4)     NOT NULL,
    [shared_cad_code]          VARCHAR (5)     NOT NULL,
    [shared_prop_id]           VARCHAR (30)    NOT NULL,
    [tape_run_dt]              DATETIME        NULL,
    [tape_load_dt]             DATETIME        NULL,
    [link_dt]                  DATETIME        NULL,
    [deed_dt]                  DATETIME        NULL,
    [situs_city]               VARCHAR (30)    NULL,
    [legal]                    VARCHAR (255)   NULL,
    [map_id]                   VARCHAR (25)    NULL,
    [prev_tax_unfrozen]        CHAR (1)        NULL,
    [owner_name]               VARCHAR (70)    NULL,
    [owner_addr]               VARCHAR (255)   NULL,
    [owner_state]              VARCHAR (50)    NULL,
    [owner_zip]                VARCHAR (10)    NULL,
    [ag_use]                   CHAR (1)        NULL,
    [special_exmpt_entity_cd]  CHAR (5)        NULL,
    [situs_street_num]         VARCHAR (10)    NULL,
    [dv_exemption_amount]      NUMERIC (12)    NULL,
    [cad_name]                 VARCHAR (30)    NULL,
    [exmpt]                    VARCHAR (255)   NULL,
    [deed_volume]              VARCHAR (20)    NULL,
    [ref_id]                   VARCHAR (50)    NULL,
    [prorated_qualify_dt]      DATETIME        NULL,
    [prorated_remove_dt]       DATETIME        NULL,
    [arb_hearing_dt]           DATETIME        NULL,
    [oa_qual_dt]               DATETIME        NULL,
    [owner_addr2]              VARCHAR (255)   NULL,
    [owner_city]               VARCHAR (50)    NULL,
    [prorated_exmpt_flg]       CHAR (1)        NULL,
    [productivity_code]        VARCHAR (10)    NULL,
    [oa_remove_dt]             DATETIME        NULL,
    [situs_zip]                VARCHAR (10)    NULL,
    [situs_state]              VARCHAR (2)     NULL,
    [prev_tax_due]             CHAR (1)        NULL,
    [special_exmpt_amt]        NUMERIC (12)    NULL,
    [arb_indicator]            CHAR (1)        NULL,
    [deed_page]                VARCHAR (20)    NULL,
    [special_exemption_cd]     CHAR (5)        NULL,
    [situs_street]             VARCHAR (50)    NULL,
    [dba_name]                 VARCHAR (50)    NULL,
    [new_hs_value]             NUMERIC (14)    NULL,
    [owner_addr_line1]         VARCHAR (70)    NULL,
    [owner_addr_line2]         VARCHAR (70)    NULL,
    [owner_addr_line3]         VARCHAR (70)    NULL,
    [cad_sup_num]              INT             NULL,
    [cad_sup_code]             VARCHAR (10)    NULL,
    [num_imprv_segs]           INT             NULL,
    [imprv_ptd_code]           VARCHAR (10)    NULL,
    [imprv_class]              VARCHAR (10)    NULL,
    [num_land_segs]            INT             NULL,
    [land_ptd_code]            VARCHAR (10)    NULL,
    [size_acres]               NUMERIC (14, 4) NULL,
    [mineral_ptd_code]         VARCHAR (5)     NULL,
    [personal_ptd_code]        VARCHAR (5)     NULL,
    [entities]                 VARCHAR (50)    NULL,
    [freeze_transfer_flag]     CHAR (1)        NULL,
    [transfer_pct]             NUMERIC (9, 6)  NULL,
    [imprv_hs_val]             NUMERIC (14, 2) NULL,
    [imprv_non_hs_val]         NUMERIC (14, 2) NULL,
    [land_hs]                  NUMERIC (14, 2) NULL,
    [land_non_hs]              NUMERIC (14, 2) NULL,
    [ag_market]                NUMERIC (14, 2) NULL,
    [timber_use]               NUMERIC (14, 2) NULL,
    [timber_market]            NUMERIC (14, 2) NULL,
    [market]                   NUMERIC (14, 2) NULL,
    [appraised_val]            NUMERIC (14, 2) NULL,
    [cad_ten_percent_cap]      NUMERIC (14, 2) NULL,
    [cad_assessed_val]         NUMERIC (14, 2) NULL,
    [arb_status]               VARCHAR (5)     NULL,
    [sales_dt]                 DATETIME        NULL,
    [sales_price]              NUMERIC (14, 2) NULL,
    [appraiser]                VARCHAR (10)    NULL,
    [cad_sup_comment]          VARCHAR (500)   NULL,
    [exempt_prev_tax]          NUMERIC (14, 2) NULL,
    [exempt_prev_tax_unfrozen] NUMERIC (14, 2) NULL,
    [ag_use_val]               NUMERIC (14, 2) NULL,
    [multi_owner]              CHAR (1)        NULL,
    [imp_new_value]            NUMERIC (14, 2) NULL,
    [land_new_value]           NUMERIC (14, 2) NULL,
    [run_id]                   INT             NULL,
    [sup_num]                  INT             CONSTRAINT [CDF_shared_prop_sup_num] DEFAULT (0) NOT NULL,
    [arb_dt]                   DATETIME        NULL,
    [productivity_loss]        NUMERIC (14, 2) NULL,
    [tsRowVersion]             ROWVERSION      NOT NULL,
    CONSTRAINT [CPK_shared_prop] PRIMARY KEY CLUSTERED ([shared_year] ASC, [sup_num] ASC, [pacs_prop_id] ASC, [shared_cad_code] ASC, [shared_prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_shared_prop_pacs_prop_id] FOREIGN KEY ([pacs_prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CUQ_shared_prop_shared_year_sup_num_pacs_prop_id_shared_cad_code] UNIQUE NONCLUSTERED ([shared_year] ASC, [sup_num] ASC, [pacs_prop_id] ASC, [shared_cad_code] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_shared_year_shared_cad_code_shared_prop_id]
    ON [dbo].[shared_prop]([shared_year] ASC, [shared_cad_code] ASC, [shared_prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_pacs_prop_id]
    ON [dbo].[shared_prop]([pacs_prop_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_shared_prop_update_ChangeLog
on shared_prop
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
select @tvar_lFutureYear = future_yr
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
 
declare @old_pacs_prop_id int
declare @new_pacs_prop_id int
declare @old_shared_year numeric(4,0)
declare @new_shared_year numeric(4,0)
declare @old_shared_cad_code varchar(5)
declare @new_shared_cad_code varchar(5)
declare @old_shared_prop_id varchar(30)
declare @new_shared_prop_id varchar(30)
declare @old_tape_run_dt datetime
declare @new_tape_run_dt datetime
declare @old_tape_load_dt datetime
declare @new_tape_load_dt datetime
declare @old_link_dt datetime
declare @new_link_dt datetime
declare @old_deed_dt datetime
declare @new_deed_dt datetime
declare @old_situs_city varchar(30)
declare @new_situs_city varchar(30)
declare @old_legal varchar(255)
declare @new_legal varchar(255)
declare @old_map_id varchar(20)
declare @new_map_id varchar(20)
declare @old_prev_tax_unfrozen char(1)
declare @new_prev_tax_unfrozen char(1)
declare @old_owner_name varchar(70)
declare @new_owner_name varchar(70)
declare @old_owner_addr varchar(255)
declare @new_owner_addr varchar(255)
declare @old_owner_state varchar(2)
declare @new_owner_state varchar(2)
declare @old_owner_zip varchar(10)
declare @new_owner_zip varchar(10)
declare @old_ag_use char(1)
declare @new_ag_use char(1)
declare @old_special_exmpt_entity_cd char(5)
declare @new_special_exmpt_entity_cd char(5)
declare @old_situs_street_num varchar(10)
declare @new_situs_street_num varchar(10)
declare @old_dv_exemption_amount numeric(12,0)
declare @new_dv_exemption_amount numeric(12,0)
declare @old_cad_name varchar(30)
declare @new_cad_name varchar(30)
declare @old_exmpt varchar(255)
declare @new_exmpt varchar(255)
declare @old_deed_volume varchar(20)
declare @new_deed_volume varchar(20)
declare @old_ref_id varchar(50)
declare @new_ref_id varchar(50)
declare @old_prorated_qualify_dt datetime
declare @new_prorated_qualify_dt datetime
declare @old_prorated_remove_dt datetime
declare @new_prorated_remove_dt datetime
declare @old_arb_hearing_dt datetime
declare @new_arb_hearing_dt datetime
declare @old_oa_qual_dt datetime
declare @new_oa_qual_dt datetime
declare @old_owner_addr2 varchar(255)
declare @new_owner_addr2 varchar(255)
declare @old_owner_city varchar(50)
declare @new_owner_city varchar(50)
declare @old_prorated_exmpt_flg char(1)
declare @new_prorated_exmpt_flg char(1)
declare @old_productivity_code char(5)
declare @new_productivity_code char(5)
declare @old_oa_remove_dt datetime
declare @new_oa_remove_dt datetime
declare @old_situs_zip varchar(10)
declare @new_situs_zip varchar(10)
declare @old_situs_state varchar(2)
declare @new_situs_state varchar(2)
declare @old_prev_tax_due char(1)
declare @new_prev_tax_due char(1)
declare @old_special_exmpt_amt numeric(12,0)
declare @new_special_exmpt_amt numeric(12,0)
declare @old_arb_indicator char(1)
declare @new_arb_indicator char(1)
declare @old_deed_page varchar(20)
declare @new_deed_page varchar(20)
declare @old_special_exemption_cd char(5)
declare @new_special_exemption_cd char(5)
declare @old_situs_street varchar(50)
declare @new_situs_street varchar(50)
declare @old_dba_name varchar(50)
declare @new_dba_name varchar(50)
declare @old_new_hs_value numeric(14,0)
declare @new_new_hs_value numeric(14,0)
declare @old_owner_addr_line1 varchar(70)
declare @new_owner_addr_line1 varchar(70)
declare @old_owner_addr_line2 varchar(70)
declare @new_owner_addr_line2 varchar(70)
declare @old_owner_addr_line3 varchar(70)
declare @new_owner_addr_line3 varchar(70)
declare @old_cad_sup_num int
declare @new_cad_sup_num int
declare @old_cad_sup_code varchar(10)
declare @new_cad_sup_code varchar(10)
declare @old_num_imprv_segs int
declare @new_num_imprv_segs int
declare @old_imprv_ptd_code varchar(10)
declare @new_imprv_ptd_code varchar(10)
declare @old_imprv_class varchar(10)
declare @new_imprv_class varchar(10)
declare @old_num_land_segs int
declare @new_num_land_segs int
declare @old_land_ptd_code varchar(10)
declare @new_land_ptd_code varchar(10)
declare @old_size_acres numeric(14,4)
declare @new_size_acres numeric(14,4)
declare @old_mineral_ptd_code varchar(5)
declare @new_mineral_ptd_code varchar(5)
declare @old_personal_ptd_code varchar(5)
declare @new_personal_ptd_code varchar(5)
declare @old_entities varchar(50)
declare @new_entities varchar(50)
declare @old_freeze_transfer_flag char(1)
declare @new_freeze_transfer_flag char(1)
declare @old_transfer_pct numeric(9,6)
declare @new_transfer_pct numeric(9,6)
declare @old_imprv_hs_val numeric(14,2)
declare @new_imprv_hs_val numeric(14,2)
declare @old_imprv_non_hs_val numeric(14,2)
declare @new_imprv_non_hs_val numeric(14,2)
declare @old_land_hs numeric(14,2)
declare @new_land_hs numeric(14,2)
declare @old_land_non_hs numeric(14,2)
declare @new_land_non_hs numeric(14,2)
declare @old_ag_market numeric(14,2)
declare @new_ag_market numeric(14,2)
declare @old_timber_use numeric(14,2)
declare @new_timber_use numeric(14,2)
declare @old_timber_market numeric(14,2)
declare @new_timber_market numeric(14,2)
declare @old_market numeric(14,2)
declare @new_market numeric(14,2)
declare @old_appraised_val numeric(14,2)
declare @new_appraised_val numeric(14,2)
declare @old_cad_ten_percent_cap numeric(14,2)
declare @new_cad_ten_percent_cap numeric(14,2)
declare @old_cad_assessed_val numeric(14,2)
declare @new_cad_assessed_val numeric(14,2)
declare @old_arb_status varchar(5)
declare @new_arb_status varchar(5)
declare @old_sales_dt datetime
declare @new_sales_dt datetime
declare @old_sales_price numeric(14,2)
declare @new_sales_price numeric(14,2)
declare @old_appraiser varchar(10)
declare @new_appraiser varchar(10)
declare @old_cad_sup_comment varchar(500)
declare @new_cad_sup_comment varchar(500)
declare @old_exempt_prev_tax numeric(14,2)
declare @new_exempt_prev_tax numeric(14,2)
declare @old_exempt_prev_tax_unfrozen numeric(14,2)
declare @new_exempt_prev_tax_unfrozen numeric(14,2)
declare @old_ag_use_val numeric(14,2)
declare @new_ag_use_val numeric(14,2)
declare @old_multi_owner char(1)
declare @new_multi_owner char(1)
declare @old_imp_new_value numeric(14,2)
declare @new_imp_new_value numeric(14,2)
declare @old_land_new_value numeric(14,2)
declare @new_land_new_value numeric(14,2)
declare @old_run_id int
declare @new_run_id int
declare @old_sup_num int
declare @new_sup_num int
declare @old_arb_dt datetime
declare @new_arb_dt datetime
declare @old_productivity_loss numeric(14,2)
declare @new_productivity_loss numeric(14,2)
 
declare curRows cursor
for
     select d.pacs_prop_id, case d.shared_year when 0 then @tvar_lFutureYear else d.shared_year end, d.shared_cad_code, d.shared_prop_id, d.tape_run_dt, d.tape_load_dt, d.link_dt, d.deed_dt, d.situs_city, d.legal, d.map_id, d.prev_tax_unfrozen, d.owner_name, d.owner_addr, d.owner_state, d.owner_zip, d.ag_use, d.special_exmpt_entity_cd, d.situs_street_num, d.dv_exemption_amount, d.cad_name, d.exmpt, d.deed_volume, d.ref_id, d.prorated_qualify_dt, d.prorated_remove_dt, d.arb_hearing_dt, d.oa_qual_dt, d.owner_addr2, d.owner_city, d.prorated_exmpt_flg, d.productivity_code, d.oa_remove_dt, d.situs_zip, d.situs_state, d.prev_tax_due, d.special_exmpt_amt, d.arb_indicator, d.deed_page, d.special_exemption_cd, d.situs_street, d.dba_name, d.new_hs_value, d.owner_addr_line1, d.owner_addr_line2, d.owner_addr_line3, d.cad_sup_num, d.cad_sup_code, d.num_imprv_segs, d.imprv_ptd_code, d.imprv_class, d.num_land_segs, d.land_ptd_code, d.size_acres, d.mineral_ptd_code, d.personal_ptd_code, d.entities, d.freeze_transfer_flag, d.transfer_pct, d.imprv_hs_val, d.imprv_non_hs_val, d.land_hs, d.land_non_hs, d.ag_market, d.timber_use, d.timber_market, d.market, d.appraised_val, d.cad_ten_percent_cap, d.cad_assessed_val, d.arb_status, d.sales_dt, d.sales_price, d.appraiser, d.cad_sup_comment, d.exempt_prev_tax, d.exempt_prev_tax_unfrozen, d.ag_use_val, d.multi_owner, d.imp_new_value, d.land_new_value, d.run_id, d.sup_num, d.arb_dt, d.productivity_loss, i.pacs_prop_id, case i.shared_year when 0 then @tvar_lFutureYear else i.shared_year end, i.shared_cad_code, i.shared_prop_id, i.tape_run_dt, i.tape_load_dt, i.link_dt, i.deed_dt, i.situs_city, i.legal, i.map_id, i.prev_tax_unfrozen, i.owner_name, i.owner_addr, i.owner_state, i.owner_zip, i.ag_use, i.special_exmpt_entity_cd, i.situs_street_num, i.dv_exemption_amount, i.cad_name, i.exmpt, i.deed_volume, i.ref_id, i.prorated_qualify_dt, i.prorated_remove_dt, i.arb_hearing_dt, i.oa_qual_dt, i.owner_addr2, i.owner_city, i.prorated_exmpt_flg, i.productivity_code, i.oa_remove_dt, i.situs_zip, i.situs_state, i.prev_tax_due, i.special_exmpt_amt, i.arb_indicator, i.deed_page, i.special_exemption_cd, i.situs_street, i.dba_name, i.new_hs_value, i.owner_addr_line1, i.owner_addr_line2, i.owner_addr_line3, i.cad_sup_num, i.cad_sup_code, i.num_imprv_segs, i.imprv_ptd_code, i.imprv_class, i.num_land_segs, i.land_ptd_code, i.size_acres, i.mineral_ptd_code, i.personal_ptd_code, i.entities, i.freeze_transfer_flag, i.transfer_pct, i.imprv_hs_val, i.imprv_non_hs_val, i.land_hs, i.land_non_hs, i.ag_market, i.timber_use, i.timber_market, i.market, i.appraised_val, i.cad_ten_percent_cap, i.cad_assessed_val, i.arb_status, i.sales_dt, i.sales_price, i.appraiser, i.cad_sup_comment, i.exempt_prev_tax, i.exempt_prev_tax_unfrozen, i.ag_use_val, i.multi_owner, i.imp_new_value, i.land_new_value, i.run_id, i.sup_num, i.arb_dt, i.productivity_loss
from deleted as d
join inserted as i on 
     d.pacs_prop_id = i.pacs_prop_id and
     d.shared_year = i.shared_year and
     d.shared_cad_code = i.shared_cad_code and
     d.sup_num = i.sup_num
for read only
 
open curRows
fetch next from curRows into @old_pacs_prop_id, @old_shared_year, @old_shared_cad_code, @old_shared_prop_id, @old_tape_run_dt, @old_tape_load_dt, @old_link_dt, @old_deed_dt, @old_situs_city, @old_legal, @old_map_id, @old_prev_tax_unfrozen, @old_owner_name, @old_owner_addr, @old_owner_state, @old_owner_zip, @old_ag_use, @old_special_exmpt_entity_cd, @old_situs_street_num, @old_dv_exemption_amount, @old_cad_name, @old_exmpt, @old_deed_volume, @old_ref_id, @old_prorated_qualify_dt, @old_prorated_remove_dt, @old_arb_hearing_dt, @old_oa_qual_dt, @old_owner_addr2, @old_owner_city, @old_prorated_exmpt_flg, @old_productivity_code, @old_oa_remove_dt, @old_situs_zip, @old_situs_state, @old_prev_tax_due, @old_special_exmpt_amt, @old_arb_indicator, @old_deed_page, @old_special_exemption_cd, @old_situs_street, @old_dba_name, @old_new_hs_value, @old_owner_addr_line1, @old_owner_addr_line2, @old_owner_addr_line3, @old_cad_sup_num, @old_cad_sup_code, @old_num_imprv_segs, @old_imprv_ptd_code, @old_imprv_class, @old_num_land_segs, @old_land_ptd_code, @old_size_acres, @old_mineral_ptd_code, @old_personal_ptd_code, @old_entities, @old_freeze_transfer_flag, @old_transfer_pct, @old_imprv_hs_val, @old_imprv_non_hs_val, @old_land_hs, @old_land_non_hs, @old_ag_market, @old_timber_use, @old_timber_market, @old_market, @old_appraised_val, @old_cad_ten_percent_cap, @old_cad_assessed_val, @old_arb_status, @old_sales_dt, @old_sales_price, @old_appraiser, @old_cad_sup_comment, @old_exempt_prev_tax, @old_exempt_prev_tax_unfrozen, @old_ag_use_val, @old_multi_owner, @old_imp_new_value, @old_land_new_value, @old_run_id, @old_sup_num, @old_arb_dt, @old_productivity_loss, @new_pacs_prop_id, @new_shared_year, @new_shared_cad_code, @new_shared_prop_id, @new_tape_run_dt, @new_tape_load_dt, @new_link_dt, @new_deed_dt, @new_situs_city, @new_legal, @new_map_id, @new_prev_tax_unfrozen, @new_owner_name, @new_owner_addr, @new_owner_state, @new_owner_zip, @new_ag_use, @new_special_exmpt_entity_cd, @new_situs_street_num, @new_dv_exemption_amount, @new_cad_name, @new_exmpt, @new_deed_volume, @new_ref_id, @new_prorated_qualify_dt, @new_prorated_remove_dt, @new_arb_hearing_dt, @new_oa_qual_dt, @new_owner_addr2, @new_owner_city, @new_prorated_exmpt_flg, @new_productivity_code, @new_oa_remove_dt, @new_situs_zip, @new_situs_state, @new_prev_tax_due, @new_special_exmpt_amt, @new_arb_indicator, @new_deed_page, @new_special_exemption_cd, @new_situs_street, @new_dba_name, @new_new_hs_value, @new_owner_addr_line1, @new_owner_addr_line2, @new_owner_addr_line3, @new_cad_sup_num, @new_cad_sup_code, @new_num_imprv_segs, @new_imprv_ptd_code, @new_imprv_class, @new_num_land_segs, @new_land_ptd_code, @new_size_acres, @new_mineral_ptd_code, @new_personal_ptd_code, @new_entities, @new_freeze_transfer_flag, @new_transfer_pct, @new_imprv_hs_val, @new_imprv_non_hs_val, @new_land_hs, @new_land_non_hs, @new_ag_market, @new_timber_use, @new_timber_market, @new_market, @new_appraised_val, @new_cad_ten_percent_cap, @new_cad_assessed_val, @new_arb_status, @new_sales_dt, @new_sales_price, @new_appraiser, @new_cad_sup_comment, @new_exempt_prev_tax, @new_exempt_prev_tax_unfrozen, @new_ag_use_val, @new_multi_owner, @new_imp_new_value, @new_land_new_value, @new_run_id, @new_sup_num, @new_arb_dt, @new_productivity_loss
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_shared_cad_code
 
     if (
          @old_pacs_prop_id <> @new_pacs_prop_id
          or
          ( @old_pacs_prop_id is null and @new_pacs_prop_id is not null ) 
          or
          ( @old_pacs_prop_id is not null and @new_pacs_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'pacs_prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3521, convert(varchar(255), @old_pacs_prop_id), convert(varchar(255), @new_pacs_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_year <> @new_shared_year
          or
          ( @old_shared_year is null and @new_shared_year is not null ) 
          or
          ( @old_shared_year is not null and @new_shared_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'shared_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4723, convert(varchar(255), @old_shared_year), convert(varchar(255), @new_shared_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_cad_code <> @new_shared_cad_code
          or
          ( @old_shared_cad_code is null and @new_shared_cad_code is not null ) 
          or
          ( @old_shared_cad_code is not null and @new_shared_cad_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'shared_cad_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4708, convert(varchar(255), @old_shared_cad_code), convert(varchar(255), @new_shared_cad_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_shared_prop_id <> @new_shared_prop_id
          or
          ( @old_shared_prop_id is null and @new_shared_prop_id is not null ) 
          or
          ( @old_shared_prop_id is not null and @new_shared_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'shared_prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4715, convert(varchar(255), @old_shared_prop_id), convert(varchar(255), @new_shared_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_tape_run_dt <> @new_tape_run_dt
          or
          ( @old_tape_run_dt is null and @new_tape_run_dt is not null ) 
          or
          ( @old_tape_run_dt is not null and @new_tape_run_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'tape_run_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5088, convert(varchar(255), @old_tape_run_dt), convert(varchar(255), @new_tape_run_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_tape_load_dt <> @new_tape_load_dt
          or
          ( @old_tape_load_dt is null and @new_tape_load_dt is not null ) 
          or
          ( @old_tape_load_dt is not null and @new_tape_load_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'tape_load_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5087, convert(varchar(255), @old_tape_load_dt), convert(varchar(255), @new_tape_load_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_link_dt <> @new_link_dt
          or
          ( @old_link_dt is null and @new_link_dt is not null ) 
          or
          ( @old_link_dt is not null and @new_link_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'link_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 2842, convert(varchar(255), @old_link_dt), convert(varchar(255), @new_link_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_deed_dt <> @new_deed_dt
          or
          ( @old_deed_dt is null and @new_deed_dt is not null ) 
          or
          ( @old_deed_dt is not null and @new_deed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'deed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1199, convert(varchar(255), @old_deed_dt), convert(varchar(255), @new_deed_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_situs_city <> @new_situs_city
          or
          ( @old_situs_city is null and @new_situs_city is not null ) 
          or
          ( @old_situs_city is not null and @new_situs_city is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'situs_city' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4739, convert(varchar(255), @old_situs_city), convert(varchar(255), @new_situs_city) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_legal <> @new_legal
          or
          ( @old_legal is null and @new_legal is not null ) 
          or
          ( @old_legal is not null and @new_legal is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'legal' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 2771, convert(varchar(255), @old_legal), convert(varchar(255), @new_legal) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_map_id <> @new_map_id
          or
          ( @old_map_id is null and @new_map_id is not null ) 
          or
          ( @old_map_id is not null and @new_map_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'map_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3001, convert(varchar(255), @old_map_id), convert(varchar(255), @new_map_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_prev_tax_unfrozen <> @new_prev_tax_unfrozen
          or
          ( @old_prev_tax_unfrozen is null and @new_prev_tax_unfrozen is not null ) 
          or
          ( @old_prev_tax_unfrozen is not null and @new_prev_tax_unfrozen is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'prev_tax_unfrozen' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3896, convert(varchar(255), @old_prev_tax_unfrozen), convert(varchar(255), @new_prev_tax_unfrozen) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_name <> @new_owner_name
          or
          ( @old_owner_name is null and @new_owner_name is not null ) 
          or
          ( @old_owner_name is not null and @new_owner_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3496, convert(varchar(255), @old_owner_name), convert(varchar(255), @new_owner_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_addr <> @new_owner_addr
          or
          ( @old_owner_addr is null and @new_owner_addr is not null ) 
          or
          ( @old_owner_addr is not null and @new_owner_addr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_addr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3475, convert(varchar(255), @old_owner_addr), convert(varchar(255), @new_owner_addr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_state <> @new_owner_state
          or
          ( @old_owner_state is null and @new_owner_state is not null ) 
          or
          ( @old_owner_state is not null and @new_owner_state is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_state' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3504, convert(varchar(255), @old_owner_state), convert(varchar(255), @new_owner_state) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_zip <> @new_owner_zip
          or
          ( @old_owner_zip is null and @new_owner_zip is not null ) 
          or
          ( @old_owner_zip is not null and @new_owner_zip is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_zip' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3508, convert(varchar(255), @old_owner_zip), convert(varchar(255), @new_owner_zip) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_ag_use <> @new_ag_use
          or
          ( @old_ag_use is null and @new_ag_use is not null ) 
          or
          ( @old_ag_use is not null and @new_ag_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'ag_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 138, convert(varchar(255), @old_ag_use), convert(varchar(255), @new_ag_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_special_exmpt_entity_cd <> @new_special_exmpt_entity_cd
          or
          ( @old_special_exmpt_entity_cd is null and @new_special_exmpt_entity_cd is not null ) 
          or
          ( @old_special_exmpt_entity_cd is not null and @new_special_exmpt_entity_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'special_exmpt_entity_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4905, convert(varchar(255), @old_special_exmpt_entity_cd), convert(varchar(255), @new_special_exmpt_entity_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_situs_street_num <> @new_situs_street_num
          or
          ( @old_situs_street_num is null and @new_situs_street_num is not null ) 
          or
          ( @old_situs_street_num is not null and @new_situs_street_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'situs_street_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4745, convert(varchar(255), @old_situs_street_num), convert(varchar(255), @new_situs_street_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_dv_exemption_amount <> @new_dv_exemption_amount
          or
          ( @old_dv_exemption_amount is null and @new_dv_exemption_amount is not null ) 
          or
          ( @old_dv_exemption_amount is not null and @new_dv_exemption_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'dv_exemption_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1397, convert(varchar(255), @old_dv_exemption_amount), convert(varchar(255), @new_dv_exemption_amount) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_cad_name <> @new_cad_name
          or
          ( @old_cad_name is null and @new_cad_name is not null ) 
          or
          ( @old_cad_name is not null and @new_cad_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'cad_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 598, convert(varchar(255), @old_cad_name), convert(varchar(255), @new_cad_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_exmpt <> @new_exmpt
          or
          ( @old_exmpt is null and @new_exmpt is not null ) 
          or
          ( @old_exmpt is not null and @new_exmpt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'exmpt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1818, convert(varchar(255), @old_exmpt), convert(varchar(255), @new_exmpt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_deed_volume <> @new_deed_volume
          or
          ( @old_deed_volume is null and @new_deed_volume is not null ) 
          or
          ( @old_deed_volume is not null and @new_deed_volume is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'deed_volume' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1207, convert(varchar(255), @old_deed_volume), convert(varchar(255), @new_deed_volume) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_ref_id <> @new_ref_id
          or
          ( @old_ref_id is null and @new_ref_id is not null ) 
          or
          ( @old_ref_id is not null and @new_ref_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'ref_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4326, convert(varchar(255), @old_ref_id), convert(varchar(255), @new_ref_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_prorated_qualify_dt <> @new_prorated_qualify_dt
          or
          ( @old_prorated_qualify_dt is null and @new_prorated_qualify_dt is not null ) 
          or
          ( @old_prorated_qualify_dt is not null and @new_prorated_qualify_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'prorated_qualify_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4093, convert(varchar(255), @old_prorated_qualify_dt), convert(varchar(255), @new_prorated_qualify_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_prorated_remove_dt <> @new_prorated_remove_dt
          or
          ( @old_prorated_remove_dt is null and @new_prorated_remove_dt is not null ) 
          or
          ( @old_prorated_remove_dt is not null and @new_prorated_remove_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'prorated_remove_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4094, convert(varchar(255), @old_prorated_remove_dt), convert(varchar(255), @new_prorated_remove_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_arb_hearing_dt <> @new_arb_hearing_dt
          or
          ( @old_arb_hearing_dt is null and @new_arb_hearing_dt is not null ) 
          or
          ( @old_arb_hearing_dt is not null and @new_arb_hearing_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'arb_hearing_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 299, convert(varchar(255), @old_arb_hearing_dt), convert(varchar(255), @new_arb_hearing_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_oa_qual_dt <> @new_oa_qual_dt
          or
          ( @old_oa_qual_dt is null and @new_oa_qual_dt is not null ) 
          or
          ( @old_oa_qual_dt is not null and @new_oa_qual_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'oa_qual_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3390, convert(varchar(255), @old_oa_qual_dt), convert(varchar(255), @new_oa_qual_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_addr2 <> @new_owner_addr2
          or
          ( @old_owner_addr2 is null and @new_owner_addr2 is not null ) 
          or
          ( @old_owner_addr2 is not null and @new_owner_addr2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_addr2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3486, convert(varchar(255), @old_owner_addr2), convert(varchar(255), @new_owner_addr2) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_city <> @new_owner_city
          or
          ( @old_owner_city is null and @new_owner_city is not null ) 
          or
          ( @old_owner_city is not null and @new_owner_city is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_city' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3490, convert(varchar(255), @old_owner_city), convert(varchar(255), @new_owner_city) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_prorated_exmpt_flg <> @new_prorated_exmpt_flg
          or
          ( @old_prorated_exmpt_flg is null and @new_prorated_exmpt_flg is not null ) 
          or
          ( @old_prorated_exmpt_flg is not null and @new_prorated_exmpt_flg is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'prorated_exmpt_flg' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4092, convert(varchar(255), @old_prorated_exmpt_flg), convert(varchar(255), @new_prorated_exmpt_flg) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_productivity_code <> @new_productivity_code
          or
          ( @old_productivity_code is null and @new_productivity_code is not null ) 
          or
          ( @old_productivity_code is not null and @new_productivity_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'productivity_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3992, convert(varchar(255), @old_productivity_code), convert(varchar(255), @new_productivity_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_oa_remove_dt <> @new_oa_remove_dt
          or
          ( @old_oa_remove_dt is null and @new_oa_remove_dt is not null ) 
          or
          ( @old_oa_remove_dt is not null and @new_oa_remove_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'oa_remove_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3391, convert(varchar(255), @old_oa_remove_dt), convert(varchar(255), @new_oa_remove_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_situs_zip <> @new_situs_zip
          or
          ( @old_situs_zip is null and @new_situs_zip is not null ) 
          or
          ( @old_situs_zip is not null and @new_situs_zip is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'situs_zip' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4748, convert(varchar(255), @old_situs_zip), convert(varchar(255), @new_situs_zip) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_situs_state <> @new_situs_state
          or
          ( @old_situs_state is null and @new_situs_state is not null ) 
          or
          ( @old_situs_state is not null and @new_situs_state is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'situs_state' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4743, convert(varchar(255), @old_situs_state), convert(varchar(255), @new_situs_state) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_prev_tax_due <> @new_prev_tax_due
          or
          ( @old_prev_tax_due is null and @new_prev_tax_due is not null ) 
          or
          ( @old_prev_tax_due is not null and @new_prev_tax_due is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'prev_tax_due' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3894, convert(varchar(255), @old_prev_tax_due), convert(varchar(255), @new_prev_tax_due) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_special_exmpt_amt <> @new_special_exmpt_amt
          or
          ( @old_special_exmpt_amt is null and @new_special_exmpt_amt is not null ) 
          or
          ( @old_special_exmpt_amt is not null and @new_special_exmpt_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'special_exmpt_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4904, convert(varchar(255), @old_special_exmpt_amt), convert(varchar(255), @new_special_exmpt_amt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_arb_indicator <> @new_arb_indicator
          or
          ( @old_arb_indicator is null and @new_arb_indicator is not null ) 
          or
          ( @old_arb_indicator is not null and @new_arb_indicator is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'arb_indicator' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 300, convert(varchar(255), @old_arb_indicator), convert(varchar(255), @new_arb_indicator) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_deed_page <> @new_deed_page
          or
          ( @old_deed_page is null and @new_deed_page is not null ) 
          or
          ( @old_deed_page is not null and @new_deed_page is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'deed_page' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1202, convert(varchar(255), @old_deed_page), convert(varchar(255), @new_deed_page) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_special_exemption_cd <> @new_special_exemption_cd
          or
          ( @old_special_exemption_cd is null and @new_special_exemption_cd is not null ) 
          or
          ( @old_special_exemption_cd is not null and @new_special_exemption_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'special_exemption_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4902, convert(varchar(255), @old_special_exemption_cd), convert(varchar(255), @new_special_exemption_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_situs_street <> @new_situs_street
          or
          ( @old_situs_street is null and @new_situs_street is not null ) 
          or
          ( @old_situs_street is not null and @new_situs_street is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'situs_street' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4744, convert(varchar(255), @old_situs_street), convert(varchar(255), @new_situs_street) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_dba_name <> @new_dba_name
          or
          ( @old_dba_name is null and @new_dba_name is not null ) 
          or
          ( @old_dba_name is not null and @new_dba_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'dba_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1130, convert(varchar(255), @old_dba_name), convert(varchar(255), @new_dba_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_new_hs_value <> @new_new_hs_value
          or
          ( @old_new_hs_value is null and @new_new_hs_value is not null ) 
          or
          ( @old_new_hs_value is not null and @new_new_hs_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'new_hs_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3236, convert(varchar(255), @old_new_hs_value), convert(varchar(255), @new_new_hs_value) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_addr_line1 <> @new_owner_addr_line1
          or
          ( @old_owner_addr_line1 is null and @new_owner_addr_line1 is not null ) 
          or
          ( @old_owner_addr_line1 is not null and @new_owner_addr_line1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_addr_line1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3480, convert(varchar(255), @old_owner_addr_line1), convert(varchar(255), @new_owner_addr_line1) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_addr_line2 <> @new_owner_addr_line2
          or
          ( @old_owner_addr_line2 is null and @new_owner_addr_line2 is not null ) 
          or
          ( @old_owner_addr_line2 is not null and @new_owner_addr_line2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_addr_line2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3481, convert(varchar(255), @old_owner_addr_line2), convert(varchar(255), @new_owner_addr_line2) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_addr_line3 <> @new_owner_addr_line3
          or
          ( @old_owner_addr_line3 is null and @new_owner_addr_line3 is not null ) 
          or
          ( @old_owner_addr_line3 is not null and @new_owner_addr_line3 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'owner_addr_line3' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3482, convert(varchar(255), @old_owner_addr_line3), convert(varchar(255), @new_owner_addr_line3) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_cad_sup_num <> @new_cad_sup_num
          or
          ( @old_cad_sup_num is null and @new_cad_sup_num is not null ) 
          or
          ( @old_cad_sup_num is not null and @new_cad_sup_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'cad_sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5901, convert(varchar(255), @old_cad_sup_num), convert(varchar(255), @new_cad_sup_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_cad_sup_code <> @new_cad_sup_code
          or
          ( @old_cad_sup_code is null and @new_cad_sup_code is not null ) 
          or
          ( @old_cad_sup_code is not null and @new_cad_sup_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'cad_sup_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5899, convert(varchar(255), @old_cad_sup_code), convert(varchar(255), @new_cad_sup_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_num_imprv_segs <> @new_num_imprv_segs
          or
          ( @old_num_imprv_segs is null and @new_num_imprv_segs is not null ) 
          or
          ( @old_num_imprv_segs is not null and @new_num_imprv_segs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'num_imprv_segs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5915, convert(varchar(255), @old_num_imprv_segs), convert(varchar(255), @new_num_imprv_segs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_imprv_ptd_code <> @new_imprv_ptd_code
          or
          ( @old_imprv_ptd_code is null and @new_imprv_ptd_code is not null ) 
          or
          ( @old_imprv_ptd_code is not null and @new_imprv_ptd_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'imprv_ptd_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5908, convert(varchar(255), @old_imprv_ptd_code), convert(varchar(255), @new_imprv_ptd_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_imprv_class <> @new_imprv_class
          or
          ( @old_imprv_class is null and @new_imprv_class is not null ) 
          or
          ( @old_imprv_class is not null and @new_imprv_class is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'imprv_class' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 2222, convert(varchar(255), @old_imprv_class), convert(varchar(255), @new_imprv_class) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_num_land_segs <> @new_num_land_segs
          or
          ( @old_num_land_segs is null and @new_num_land_segs is not null ) 
          or
          ( @old_num_land_segs is not null and @new_num_land_segs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'num_land_segs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5916, convert(varchar(255), @old_num_land_segs), convert(varchar(255), @new_num_land_segs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_land_ptd_code <> @new_land_ptd_code
          or
          ( @old_land_ptd_code is null and @new_land_ptd_code is not null ) 
          or
          ( @old_land_ptd_code is not null and @new_land_ptd_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'land_ptd_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5912, convert(varchar(255), @old_land_ptd_code), convert(varchar(255), @new_land_ptd_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_size_acres <> @new_size_acres
          or
          ( @old_size_acres is null and @new_size_acres is not null ) 
          or
          ( @old_size_acres is not null and @new_size_acres is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'size_acres' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4749, convert(varchar(255), @old_size_acres), convert(varchar(255), @new_size_acres) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_mineral_ptd_code <> @new_mineral_ptd_code
          or
          ( @old_mineral_ptd_code is null and @new_mineral_ptd_code is not null ) 
          or
          ( @old_mineral_ptd_code is not null and @new_mineral_ptd_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'mineral_ptd_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5913, convert(varchar(255), @old_mineral_ptd_code), convert(varchar(255), @new_mineral_ptd_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_personal_ptd_code <> @new_personal_ptd_code
          or
          ( @old_personal_ptd_code is null and @new_personal_ptd_code is not null ) 
          or
          ( @old_personal_ptd_code is not null and @new_personal_ptd_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'personal_ptd_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5917, convert(varchar(255), @old_personal_ptd_code), convert(varchar(255), @new_personal_ptd_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_entities <> @new_entities
          or
          ( @old_entities is null and @new_entities is not null ) 
          or
          ( @old_entities is not null and @new_entities is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'entities' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1456, convert(varchar(255), @old_entities), convert(varchar(255), @new_entities) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_freeze_transfer_flag <> @new_freeze_transfer_flag
          or
          ( @old_freeze_transfer_flag is null and @new_freeze_transfer_flag is not null ) 
          or
          ( @old_freeze_transfer_flag is not null and @new_freeze_transfer_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'freeze_transfer_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 1973, convert(varchar(255), @old_freeze_transfer_flag), convert(varchar(255), @new_freeze_transfer_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_transfer_pct <> @new_transfer_pct
          or
          ( @old_transfer_pct is null and @new_transfer_pct is not null ) 
          or
          ( @old_transfer_pct is not null and @new_transfer_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'transfer_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5384, convert(varchar(255), @old_transfer_pct), convert(varchar(255), @new_transfer_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_imprv_hs_val <> @new_imprv_hs_val
          or
          ( @old_imprv_hs_val is null and @new_imprv_hs_val is not null ) 
          or
          ( @old_imprv_hs_val is not null and @new_imprv_hs_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'imprv_hs_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5906, convert(varchar(255), @old_imprv_hs_val), convert(varchar(255), @new_imprv_hs_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_imprv_non_hs_val <> @new_imprv_non_hs_val
          or
          ( @old_imprv_non_hs_val is null and @new_imprv_non_hs_val is not null ) 
          or
          ( @old_imprv_non_hs_val is not null and @new_imprv_non_hs_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'imprv_non_hs_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5907, convert(varchar(255), @old_imprv_non_hs_val), convert(varchar(255), @new_imprv_non_hs_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_land_hs <> @new_land_hs
          or
          ( @old_land_hs is null and @new_land_hs is not null ) 
          or
          ( @old_land_hs is not null and @new_land_hs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'land_hs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5909, convert(varchar(255), @old_land_hs), convert(varchar(255), @new_land_hs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_land_non_hs <> @new_land_non_hs
          or
          ( @old_land_non_hs is null and @new_land_non_hs is not null ) 
          or
          ( @old_land_non_hs is not null and @new_land_non_hs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'land_non_hs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5911, convert(varchar(255), @old_land_non_hs), convert(varchar(255), @new_land_non_hs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_ag_market <> @new_ag_market
          or
          ( @old_ag_market is null and @new_ag_market is not null ) 
          or
          ( @old_ag_market is not null and @new_ag_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'ag_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 124, convert(varchar(255), @old_ag_market), convert(varchar(255), @new_ag_market) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_timber_use <> @new_timber_use
          or
          ( @old_timber_use is null and @new_timber_use is not null ) 
          or
          ( @old_timber_use is not null and @new_timber_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'timber_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5228, convert(varchar(255), @old_timber_use), convert(varchar(255), @new_timber_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_timber_market <> @new_timber_market
          or
          ( @old_timber_market is null and @new_timber_market is not null ) 
          or
          ( @old_timber_market is not null and @new_timber_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'timber_market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5226, convert(varchar(255), @old_timber_market), convert(varchar(255), @new_timber_market) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_market <> @new_market
          or
          ( @old_market is null and @new_market is not null ) 
          or
          ( @old_market is not null and @new_market is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'market' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3010, convert(varchar(255), @old_market), convert(varchar(255), @new_market) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_appraised_val <> @new_appraised_val
          or
          ( @old_appraised_val is null and @new_appraised_val is not null ) 
          or
          ( @old_appraised_val is not null and @new_appraised_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'appraised_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 244, convert(varchar(255), @old_appraised_val), convert(varchar(255), @new_appraised_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_cad_ten_percent_cap <> @new_cad_ten_percent_cap
          or
          ( @old_cad_ten_percent_cap is null and @new_cad_ten_percent_cap is not null ) 
          or
          ( @old_cad_ten_percent_cap is not null and @new_cad_ten_percent_cap is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'cad_ten_percent_cap' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5902, convert(varchar(255), @old_cad_ten_percent_cap), convert(varchar(255), @new_cad_ten_percent_cap) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_cad_assessed_val <> @new_cad_assessed_val
          or
          ( @old_cad_assessed_val is null and @new_cad_assessed_val is not null ) 
          or
          ( @old_cad_assessed_val is not null and @new_cad_assessed_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'cad_assessed_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5898, convert(varchar(255), @old_cad_assessed_val), convert(varchar(255), @new_cad_assessed_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_arb_status <> @new_arb_status
          or
          ( @old_arb_status is null and @new_arb_status is not null ) 
          or
          ( @old_arb_status is not null and @new_arb_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'arb_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 324, convert(varchar(255), @old_arb_status), convert(varchar(255), @new_arb_status) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sales_dt <> @new_sales_dt
          or
          ( @old_sales_dt is null and @new_sales_dt is not null ) 
          or
          ( @old_sales_dt is not null and @new_sales_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'sales_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5918, convert(varchar(255), @old_sales_dt), convert(varchar(255), @new_sales_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sales_price <> @new_sales_price
          or
          ( @old_sales_price is null and @new_sales_price is not null ) 
          or
          ( @old_sales_price is not null and @new_sales_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'sales_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5919, convert(varchar(255), @old_sales_price), convert(varchar(255), @new_sales_price) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_appraiser <> @new_appraiser
          or
          ( @old_appraiser is null and @new_appraiser is not null ) 
          or
          ( @old_appraiser is not null and @new_appraiser is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'appraiser' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5896, convert(varchar(255), @old_appraiser), convert(varchar(255), @new_appraiser) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_cad_sup_comment <> @new_cad_sup_comment
          or
          ( @old_cad_sup_comment is null and @new_cad_sup_comment is not null ) 
          or
          ( @old_cad_sup_comment is not null and @new_cad_sup_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'cad_sup_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5900, convert(varchar(255), @old_cad_sup_comment), convert(varchar(255), @new_cad_sup_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_exempt_prev_tax <> @new_exempt_prev_tax
          or
          ( @old_exempt_prev_tax is null and @new_exempt_prev_tax is not null ) 
          or
          ( @old_exempt_prev_tax is not null and @new_exempt_prev_tax is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'exempt_prev_tax' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5903, convert(varchar(255), @old_exempt_prev_tax), convert(varchar(255), @new_exempt_prev_tax) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_exempt_prev_tax_unfrozen <> @new_exempt_prev_tax_unfrozen
          or
          ( @old_exempt_prev_tax_unfrozen is null and @new_exempt_prev_tax_unfrozen is not null ) 
          or
          ( @old_exempt_prev_tax_unfrozen is not null and @new_exempt_prev_tax_unfrozen is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'exempt_prev_tax_unfrozen' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5904, convert(varchar(255), @old_exempt_prev_tax_unfrozen), convert(varchar(255), @new_exempt_prev_tax_unfrozen) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_ag_use_val <> @new_ag_use_val
          or
          ( @old_ag_use_val is null and @new_ag_use_val is not null ) 
          or
          ( @old_ag_use_val is not null and @new_ag_use_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'ag_use_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 143, convert(varchar(255), @old_ag_use_val), convert(varchar(255), @new_ag_use_val) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_multi_owner <> @new_multi_owner
          or
          ( @old_multi_owner is null and @new_multi_owner is not null ) 
          or
          ( @old_multi_owner is not null and @new_multi_owner is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'multi_owner' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5914, convert(varchar(255), @old_multi_owner), convert(varchar(255), @new_multi_owner) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_imp_new_value <> @new_imp_new_value
          or
          ( @old_imp_new_value is null and @new_imp_new_value is not null ) 
          or
          ( @old_imp_new_value is not null and @new_imp_new_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'imp_new_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5905, convert(varchar(255), @old_imp_new_value), convert(varchar(255), @new_imp_new_value) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_land_new_value <> @new_land_new_value
          or
          ( @old_land_new_value is null and @new_land_new_value is not null ) 
          or
          ( @old_land_new_value is not null and @new_land_new_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'land_new_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5910, convert(varchar(255), @old_land_new_value), convert(varchar(255), @new_land_new_value) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_run_id <> @new_run_id
          or
          ( @old_run_id is null and @new_run_id is not null ) 
          or
          ( @old_run_id is not null and @new_run_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'run_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 4460, convert(varchar(255), @old_run_id), convert(varchar(255), @new_run_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_arb_dt <> @new_arb_dt
          or
          ( @old_arb_dt is null and @new_arb_dt is not null ) 
          or
          ( @old_arb_dt is not null and @new_arb_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'arb_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 5897, convert(varchar(255), @old_arb_dt), convert(varchar(255), @new_arb_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_productivity_loss <> @new_productivity_loss
          or
          ( @old_productivity_loss is null and @new_productivity_loss is not null ) 
          or
          ( @old_productivity_loss is not null and @new_productivity_loss is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'shared_prop' and
                    chg_log_columns = 'productivity_loss' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 760, 3993, convert(varchar(255), @old_productivity_loss), convert(varchar(255), @new_productivity_loss) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @new_pacs_prop_id), @new_pacs_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @new_shared_year), case when @new_shared_year > @tvar_intMin and @new_shared_year < @tvar_intMax then convert(int, round(@new_shared_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @new_shared_cad_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     fetch next from curRows into @old_pacs_prop_id, @old_shared_year, @old_shared_cad_code, @old_shared_prop_id, @old_tape_run_dt, @old_tape_load_dt, @old_link_dt, @old_deed_dt, @old_situs_city, @old_legal, @old_map_id, @old_prev_tax_unfrozen, @old_owner_name, @old_owner_addr, @old_owner_state, @old_owner_zip, @old_ag_use, @old_special_exmpt_entity_cd, @old_situs_street_num, @old_dv_exemption_amount, @old_cad_name, @old_exmpt, @old_deed_volume, @old_ref_id, @old_prorated_qualify_dt, @old_prorated_remove_dt, @old_arb_hearing_dt, @old_oa_qual_dt, @old_owner_addr2, @old_owner_city, @old_prorated_exmpt_flg, @old_productivity_code, @old_oa_remove_dt, @old_situs_zip, @old_situs_state, @old_prev_tax_due, @old_special_exmpt_amt, @old_arb_indicator, @old_deed_page, @old_special_exemption_cd, @old_situs_street, @old_dba_name, @old_new_hs_value, @old_owner_addr_line1, @old_owner_addr_line2, @old_owner_addr_line3, @old_cad_sup_num, @old_cad_sup_code, @old_num_imprv_segs, @old_imprv_ptd_code, @old_imprv_class, @old_num_land_segs, @old_land_ptd_code, @old_size_acres, @old_mineral_ptd_code, @old_personal_ptd_code, @old_entities, @old_freeze_transfer_flag, @old_transfer_pct, @old_imprv_hs_val, @old_imprv_non_hs_val, @old_land_hs, @old_land_non_hs, @old_ag_market, @old_timber_use, @old_timber_market, @old_market, @old_appraised_val, @old_cad_ten_percent_cap, @old_cad_assessed_val, @old_arb_status, @old_sales_dt, @old_sales_price, @old_appraiser, @old_cad_sup_comment, @old_exempt_prev_tax, @old_exempt_prev_tax_unfrozen, @old_ag_use_val, @old_multi_owner, @old_imp_new_value, @old_land_new_value, @old_run_id, @old_sup_num, @old_arb_dt, @old_productivity_loss, @new_pacs_prop_id, @new_shared_year, @new_shared_cad_code, @new_shared_prop_id, @new_tape_run_dt, @new_tape_load_dt, @new_link_dt, @new_deed_dt, @new_situs_city, @new_legal, @new_map_id, @new_prev_tax_unfrozen, @new_owner_name, @new_owner_addr, @new_owner_state, @new_owner_zip, @new_ag_use, @new_special_exmpt_entity_cd, @new_situs_street_num, @new_dv_exemption_amount, @new_cad_name, @new_exmpt, @new_deed_volume, @new_ref_id, @new_prorated_qualify_dt, @new_prorated_remove_dt, @new_arb_hearing_dt, @new_oa_qual_dt, @new_owner_addr2, @new_owner_city, @new_prorated_exmpt_flg, @new_productivity_code, @new_oa_remove_dt, @new_situs_zip, @new_situs_state, @new_prev_tax_due, @new_special_exmpt_amt, @new_arb_indicator, @new_deed_page, @new_special_exemption_cd, @new_situs_street, @new_dba_name, @new_new_hs_value, @new_owner_addr_line1, @new_owner_addr_line2, @new_owner_addr_line3, @new_cad_sup_num, @new_cad_sup_code, @new_num_imprv_segs, @new_imprv_ptd_code, @new_imprv_class, @new_num_land_segs, @new_land_ptd_code, @new_size_acres, @new_mineral_ptd_code, @new_personal_ptd_code, @new_entities, @new_freeze_transfer_flag, @new_transfer_pct, @new_imprv_hs_val, @new_imprv_non_hs_val, @new_land_hs, @new_land_non_hs, @new_ag_market, @new_timber_use, @new_timber_market, @new_market, @new_appraised_val, @new_cad_ten_percent_cap, @new_cad_assessed_val, @new_arb_status, @new_sales_dt, @new_sales_price, @new_appraiser, @new_cad_sup_comment, @new_exempt_prev_tax, @new_exempt_prev_tax_unfrozen, @new_ag_use_val, @new_multi_owner, @new_imp_new_value, @new_land_new_value, @new_run_id, @new_sup_num, @new_arb_dt, @new_productivity_loss
end
 
close curRows
deallocate curRows

GO



create trigger tr_shared_prop_delete_ChangeLog
on shared_prop
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
          chg_log_tables = 'shared_prop' and
          chg_log_audit = 1
)
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
select @tvar_lFutureYear = future_yr
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
 
declare @pacs_prop_id int
declare @shared_year numeric(4,0)
declare @shared_cad_code varchar(5)
declare @sup_num int
 
declare curRows cursor
for
     select pacs_prop_id, case shared_year when 0 then @tvar_lFutureYear else shared_year end, shared_cad_code, sup_num from deleted
for read only
 
open curRows
fetch next from curRows into @pacs_prop_id, @shared_year, @shared_cad_code, @sup_num
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @shared_cad_code
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 760, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
 
     fetch next from curRows into @pacs_prop_id, @shared_year, @shared_cad_code, @sup_num
end
 
close curRows
deallocate curRows

GO



create trigger tr_shared_prop_insert_ChangeLog
on shared_prop
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
select @tvar_lFutureYear = future_yr
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
 
declare @pacs_prop_id int
declare @shared_year numeric(4,0)
declare @shared_cad_code varchar(5)
declare @shared_prop_id varchar(30)
declare @tape_run_dt datetime
declare @tape_load_dt datetime
declare @link_dt datetime
declare @deed_dt datetime
declare @situs_city varchar(30)
declare @legal varchar(255)
declare @map_id varchar(20)
declare @prev_tax_unfrozen char(1)
declare @owner_name varchar(70)
declare @owner_addr varchar(255)
declare @owner_state varchar(2)
declare @owner_zip varchar(10)
declare @ag_use char(1)
declare @special_exmpt_entity_cd char(5)
declare @situs_street_num varchar(10)
declare @dv_exemption_amount numeric(12,0)
declare @cad_name varchar(30)
declare @exmpt varchar(255)
declare @deed_volume varchar(20)
declare @ref_id varchar(50)
declare @prorated_qualify_dt datetime
declare @prorated_remove_dt datetime
declare @arb_hearing_dt datetime
declare @oa_qual_dt datetime
declare @owner_addr2 varchar(255)
declare @owner_city varchar(50)
declare @prorated_exmpt_flg char(1)
declare @productivity_code char(5)
declare @oa_remove_dt datetime
declare @situs_zip varchar(10)
declare @situs_state varchar(2)
declare @prev_tax_due char(1)
declare @special_exmpt_amt numeric(12,0)
declare @arb_indicator char(1)
declare @deed_page varchar(20)
declare @special_exemption_cd char(5)
declare @situs_street varchar(50)
declare @dba_name varchar(50)
declare @new_hs_value numeric(14,0)
declare @owner_addr_line1 varchar(70)
declare @owner_addr_line2 varchar(70)
declare @owner_addr_line3 varchar(70)
declare @cad_sup_num int
declare @cad_sup_code varchar(10)
declare @num_imprv_segs int
declare @imprv_ptd_code varchar(10)
declare @imprv_class varchar(10)
declare @num_land_segs int
declare @land_ptd_code varchar(10)
declare @size_acres numeric(14,4)
declare @mineral_ptd_code varchar(5)
declare @personal_ptd_code varchar(5)
declare @entities varchar(50)
declare @freeze_transfer_flag char(1)
declare @transfer_pct numeric(9,6)
declare @imprv_hs_val numeric(14,2)
declare @imprv_non_hs_val numeric(14,2)
declare @land_hs numeric(14,2)
declare @land_non_hs numeric(14,2)
declare @ag_market numeric(14,2)
declare @timber_use numeric(14,2)
declare @timber_market numeric(14,2)
declare @market numeric(14,2)
declare @appraised_val numeric(14,2)
declare @cad_ten_percent_cap numeric(14,2)
declare @cad_assessed_val numeric(14,2)
declare @arb_status varchar(5)
declare @sales_dt datetime
declare @sales_price numeric(14,2)
declare @appraiser varchar(10)
declare @cad_sup_comment varchar(500)
declare @exempt_prev_tax numeric(14,2)
declare @exempt_prev_tax_unfrozen numeric(14,2)
declare @ag_use_val numeric(14,2)
declare @multi_owner char(1)
declare @imp_new_value numeric(14,2)
declare @land_new_value numeric(14,2)
declare @run_id int
declare @sup_num int
declare @arb_dt datetime
declare @productivity_loss numeric(14,2)
 
declare curRows cursor
for
     select pacs_prop_id, case shared_year when 0 then @tvar_lFutureYear else shared_year end, shared_cad_code, shared_prop_id, tape_run_dt, tape_load_dt, link_dt, deed_dt, situs_city, legal, map_id, prev_tax_unfrozen, owner_name, owner_addr, owner_state, owner_zip, ag_use, special_exmpt_entity_cd, situs_street_num, dv_exemption_amount, cad_name, exmpt, deed_volume, ref_id, prorated_qualify_dt, prorated_remove_dt, arb_hearing_dt, oa_qual_dt, owner_addr2, owner_city, prorated_exmpt_flg, productivity_code, oa_remove_dt, situs_zip, situs_state, prev_tax_due, special_exmpt_amt, arb_indicator, deed_page, special_exemption_cd, situs_street, dba_name, new_hs_value, owner_addr_line1, owner_addr_line2, owner_addr_line3, cad_sup_num, cad_sup_code, num_imprv_segs, imprv_ptd_code, imprv_class, num_land_segs, land_ptd_code, size_acres, mineral_ptd_code, personal_ptd_code, entities, freeze_transfer_flag, transfer_pct, imprv_hs_val, imprv_non_hs_val, land_hs, land_non_hs, ag_market, timber_use, timber_market, market, appraised_val, cad_ten_percent_cap, cad_assessed_val, arb_status, sales_dt, sales_price, appraiser, cad_sup_comment, exempt_prev_tax, exempt_prev_tax_unfrozen, ag_use_val, multi_owner, imp_new_value, land_new_value, run_id, sup_num, arb_dt, productivity_loss from inserted
for read only
 
open curRows
fetch next from curRows into @pacs_prop_id, @shared_year, @shared_cad_code, @shared_prop_id, @tape_run_dt, @tape_load_dt, @link_dt, @deed_dt, @situs_city, @legal, @map_id, @prev_tax_unfrozen, @owner_name, @owner_addr, @owner_state, @owner_zip, @ag_use, @special_exmpt_entity_cd, @situs_street_num, @dv_exemption_amount, @cad_name, @exmpt, @deed_volume, @ref_id, @prorated_qualify_dt, @prorated_remove_dt, @arb_hearing_dt, @oa_qual_dt, @owner_addr2, @owner_city, @prorated_exmpt_flg, @productivity_code, @oa_remove_dt, @situs_zip, @situs_state, @prev_tax_due, @special_exmpt_amt, @arb_indicator, @deed_page, @special_exemption_cd, @situs_street, @dba_name, @new_hs_value, @owner_addr_line1, @owner_addr_line2, @owner_addr_line3, @cad_sup_num, @cad_sup_code, @num_imprv_segs, @imprv_ptd_code, @imprv_class, @num_land_segs, @land_ptd_code, @size_acres, @mineral_ptd_code, @personal_ptd_code, @entities, @freeze_transfer_flag, @transfer_pct, @imprv_hs_val, @imprv_non_hs_val, @land_hs, @land_non_hs, @ag_market, @timber_use, @timber_market, @market, @appraised_val, @cad_ten_percent_cap, @cad_assessed_val, @arb_status, @sales_dt, @sales_price, @appraiser, @cad_sup_comment, @exempt_prev_tax, @exempt_prev_tax_unfrozen, @ag_use_val, @multi_owner, @imp_new_value, @land_new_value, @run_id, @sup_num, @arb_dt, @productivity_loss
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @shared_cad_code
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'pacs_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3521, null, convert(varchar(255), @pacs_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'shared_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4723, null, convert(varchar(255), @shared_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'shared_cad_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4708, null, convert(varchar(255), @shared_cad_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'shared_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4715, null, convert(varchar(255), @shared_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'tape_run_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5088, null, convert(varchar(255), @tape_run_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'tape_load_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5087, null, convert(varchar(255), @tape_load_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'link_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 2842, null, convert(varchar(255), @link_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'deed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1199, null, convert(varchar(255), @deed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'situs_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4739, null, convert(varchar(255), @situs_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'legal' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 2771, null, convert(varchar(255), @legal), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'map_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3001, null, convert(varchar(255), @map_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'prev_tax_unfrozen' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3896, null, convert(varchar(255), @prev_tax_unfrozen), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3496, null, convert(varchar(255), @owner_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_addr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3475, null, convert(varchar(255), @owner_addr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_state' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3504, null, convert(varchar(255), @owner_state), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_zip' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3508, null, convert(varchar(255), @owner_zip), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'ag_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 138, null, convert(varchar(255), @ag_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'special_exmpt_entity_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4905, null, convert(varchar(255), @special_exmpt_entity_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'situs_street_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4745, null, convert(varchar(255), @situs_street_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'dv_exemption_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1397, null, convert(varchar(255), @dv_exemption_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'cad_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 598, null, convert(varchar(255), @cad_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'exmpt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1818, null, convert(varchar(255), @exmpt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'deed_volume' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1207, null, convert(varchar(255), @deed_volume), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'ref_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4326, null, convert(varchar(255), @ref_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'prorated_qualify_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4093, null, convert(varchar(255), @prorated_qualify_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'prorated_remove_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4094, null, convert(varchar(255), @prorated_remove_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'arb_hearing_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 299, null, convert(varchar(255), @arb_hearing_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'oa_qual_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3390, null, convert(varchar(255), @oa_qual_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_addr2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3486, null, convert(varchar(255), @owner_addr2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3490, null, convert(varchar(255), @owner_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'prorated_exmpt_flg' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4092, null, convert(varchar(255), @prorated_exmpt_flg), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'productivity_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3992, null, convert(varchar(255), @productivity_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'oa_remove_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3391, null, convert(varchar(255), @oa_remove_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'situs_zip' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4748, null, convert(varchar(255), @situs_zip), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'situs_state' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4743, null, convert(varchar(255), @situs_state), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'prev_tax_due' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3894, null, convert(varchar(255), @prev_tax_due), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'special_exmpt_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4904, null, convert(varchar(255), @special_exmpt_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'arb_indicator' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 300, null, convert(varchar(255), @arb_indicator), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'deed_page' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1202, null, convert(varchar(255), @deed_page), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'special_exemption_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4902, null, convert(varchar(255), @special_exemption_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'situs_street' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4744, null, convert(varchar(255), @situs_street), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'dba_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1130, null, convert(varchar(255), @dba_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'new_hs_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3236, null, convert(varchar(255), @new_hs_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_addr_line1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3480, null, convert(varchar(255), @owner_addr_line1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_addr_line2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3481, null, convert(varchar(255), @owner_addr_line2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'owner_addr_line3' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3482, null, convert(varchar(255), @owner_addr_line3), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'cad_sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5901, null, convert(varchar(255), @cad_sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'cad_sup_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5899, null, convert(varchar(255), @cad_sup_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'num_imprv_segs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5915, null, convert(varchar(255), @num_imprv_segs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'imprv_ptd_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5908, null, convert(varchar(255), @imprv_ptd_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'imprv_class' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 2222, null, convert(varchar(255), @imprv_class), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'num_land_segs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5916, null, convert(varchar(255), @num_land_segs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'land_ptd_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5912, null, convert(varchar(255), @land_ptd_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'size_acres' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4749, null, convert(varchar(255), @size_acres), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'mineral_ptd_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5913, null, convert(varchar(255), @mineral_ptd_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'personal_ptd_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5917, null, convert(varchar(255), @personal_ptd_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'entities' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1456, null, convert(varchar(255), @entities), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'freeze_transfer_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 1973, null, convert(varchar(255), @freeze_transfer_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'transfer_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5384, null, convert(varchar(255), @transfer_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'imprv_hs_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5906, null, convert(varchar(255), @imprv_hs_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'imprv_non_hs_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5907, null, convert(varchar(255), @imprv_non_hs_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'land_hs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5909, null, convert(varchar(255), @land_hs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'land_non_hs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5911, null, convert(varchar(255), @land_non_hs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'ag_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 124, null, convert(varchar(255), @ag_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'timber_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5228, null, convert(varchar(255), @timber_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'timber_market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5226, null, convert(varchar(255), @timber_market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'market' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3010, null, convert(varchar(255), @market), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'appraised_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 244, null, convert(varchar(255), @appraised_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'cad_ten_percent_cap' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5902, null, convert(varchar(255), @cad_ten_percent_cap), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'cad_assessed_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5898, null, convert(varchar(255), @cad_assessed_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'arb_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 324, null, convert(varchar(255), @arb_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'sales_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5918, null, convert(varchar(255), @sales_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'sales_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5919, null, convert(varchar(255), @sales_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'appraiser' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5896, null, convert(varchar(255), @appraiser), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'cad_sup_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5900, null, convert(varchar(255), @cad_sup_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'exempt_prev_tax' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5903, null, convert(varchar(255), @exempt_prev_tax), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'exempt_prev_tax_unfrozen' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5904, null, convert(varchar(255), @exempt_prev_tax_unfrozen), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'ag_use_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 143, null, convert(varchar(255), @ag_use_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'multi_owner' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5914, null, convert(varchar(255), @multi_owner), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'imp_new_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5905, null, convert(varchar(255), @imp_new_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'land_new_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5910, null, convert(varchar(255), @land_new_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'run_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 4460, null, convert(varchar(255), @run_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'arb_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 5897, null, convert(varchar(255), @arb_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'shared_prop' and
               chg_log_columns = 'productivity_loss' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 760, 3993, null, convert(varchar(255), @productivity_loss), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3521, convert(varchar(24), @pacs_prop_id), @pacs_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4723, convert(varchar(24), @shared_year), case when @shared_year > @tvar_intMin and @shared_year < @tvar_intMax then convert(int, round(@shared_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4708, convert(varchar(24), @shared_cad_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     fetch next from curRows into @pacs_prop_id, @shared_year, @shared_cad_code, @shared_prop_id, @tape_run_dt, @tape_load_dt, @link_dt, @deed_dt, @situs_city, @legal, @map_id, @prev_tax_unfrozen, @owner_name, @owner_addr, @owner_state, @owner_zip, @ag_use, @special_exmpt_entity_cd, @situs_street_num, @dv_exemption_amount, @cad_name, @exmpt, @deed_volume, @ref_id, @prorated_qualify_dt, @prorated_remove_dt, @arb_hearing_dt, @oa_qual_dt, @owner_addr2, @owner_city, @prorated_exmpt_flg, @productivity_code, @oa_remove_dt, @situs_zip, @situs_state, @prev_tax_due, @special_exmpt_amt, @arb_indicator, @deed_page, @special_exemption_cd, @situs_street, @dba_name, @new_hs_value, @owner_addr_line1, @owner_addr_line2, @owner_addr_line3, @cad_sup_num, @cad_sup_code, @num_imprv_segs, @imprv_ptd_code, @imprv_class, @num_land_segs, @land_ptd_code, @size_acres, @mineral_ptd_code, @personal_ptd_code, @entities, @freeze_transfer_flag, @transfer_pct, @imprv_hs_val, @imprv_non_hs_val, @land_hs, @land_non_hs, @ag_market, @timber_use, @timber_market, @market, @appraised_val, @cad_ten_percent_cap, @cad_assessed_val, @arb_status, @sales_dt, @sales_price, @appraiser, @cad_sup_comment, @exempt_prev_tax, @exempt_prev_tax_unfrozen, @ag_use_val, @multi_owner, @imp_new_value, @land_new_value, @run_id, @sup_num, @arb_dt, @productivity_loss
end
 
close curRows
deallocate curRows

GO

