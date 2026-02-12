CREATE TABLE [dbo].[neighborhood] (
    [hood_cd]            VARCHAR (10)   NOT NULL,
    [hood_yr]            NUMERIC (4)    NOT NULL,
    [hood_name]          VARCHAR (100)  NULL,
    [hood_land_pct]      NUMERIC (5, 2) NOT NULL,
    [hood_imprv_pct]     NUMERIC (5, 2) NOT NULL,
    [sys_flag]           CHAR (1)       NULL,
    [changed_flag]       CHAR (1)       NULL,
    [reappraisal_status] VARCHAR (20)   NULL,
    [life_cycle]         VARCHAR (20)   NULL,
    [phys_comment]       VARCHAR (500)  NULL,
    [eco_comment]        VARCHAR (500)  NULL,
    [gov_comment]        VARCHAR (500)  NULL,
    [soc_comment]        VARCHAR (500)  NULL,
    [inactive]           BIT            DEFAULT ((0)) NOT NULL,
    [inactive_date]      DATETIME       NULL,
    [created_date]       DATETIME       NULL,
    [cycle]              INT            NULL,
    [nbhd_descr]         VARCHAR (5000) NULL,
    [nbhd_comment]       VARCHAR (5000) NULL,
    [ls_id]              INT            NULL,
    [appraiser_id]       INT            CONSTRAINT [CDF_neighborhood_appraiser_id] DEFAULT ((0)) NOT NULL,
    [comments]           VARCHAR (500)  NULL,
    CONSTRAINT [CPK_neighborhood] PRIMARY KEY CLUSTERED ([hood_cd] ASC, [hood_yr] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_neighborhood_life_cycle] FOREIGN KEY ([life_cycle]) REFERENCES [dbo].[life_cycle] ([life_cycle_cd]),
    CONSTRAINT [CFK_neighborhood_reappraisal_status] FOREIGN KEY ([reappraisal_status]) REFERENCES [dbo].[reappraisal_status] ([reappraisal_status_cd])
);


GO


create trigger tr_neighborhood_insert_ChangeLog
on neighborhood
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
 
declare @hood_cd varchar(10)
declare @hood_yr numeric(4,0)
declare @hood_name varchar(50)
declare @hood_land_pct numeric(5,2)
declare @hood_imprv_pct numeric(5,2)
declare @sys_flag char(1)
declare @changed_flag char(1)
declare @reappraisal_status varchar(20)
declare @life_cycle varchar(20)
declare @phys_comment varchar(500)
declare @eco_comment varchar(500)
declare @gov_comment varchar(500)
declare @soc_comment varchar(500)
declare @inactive bit
declare @inactive_date datetime
declare @created_date datetime
declare @cycle int
declare @nbhd_descr varchar(5000)
declare @nbhd_comment varchar(5000)
declare @ls_id int
 
declare curRows cursor
for
     select hood_cd, case hood_yr when 0 then @tvar_lFutureYear else hood_yr end, hood_name, hood_land_pct, hood_imprv_pct, sys_flag, changed_flag, reappraisal_status, life_cycle, phys_comment, eco_comment, gov_comment, soc_comment, inactive, inactive_date, created_date, cycle, nbhd_descr, nbhd_comment, ls_id from inserted
for read only
 
open curRows
fetch next from curRows into @hood_cd, @hood_yr, @hood_name, @hood_land_pct, @hood_imprv_pct, @sys_flag, @changed_flag, @reappraisal_status, @life_cycle, @phys_comment, @eco_comment, @gov_comment, @soc_comment, @inactive, @inactive_date, @created_date, @cycle, @nbhd_descr, @nbhd_comment, @ls_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @hood_cd + '-' + convert(varchar(4), @hood_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'hood_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 2068, null, convert(varchar(255), @hood_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'hood_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 2072, null, convert(varchar(255), @hood_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'hood_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 2071, null, convert(varchar(255), @hood_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'hood_land_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 2070, null, convert(varchar(255), @hood_land_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'hood_imprv_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 2069, null, convert(varchar(255), @hood_imprv_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'sys_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 5025, null, convert(varchar(255), @sys_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'changed_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 647, null, convert(varchar(255), @changed_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'reappraisal_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9362, null, convert(varchar(255), @reappraisal_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'life_cycle' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9360, null, convert(varchar(255), @life_cycle), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'phys_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9361, null, convert(varchar(255), @phys_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'eco_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9358, null, convert(varchar(255), @eco_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'gov_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9359, null, convert(varchar(255), @gov_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'soc_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9363, null, convert(varchar(255), @soc_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'inactive' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 8647, null, convert(varchar(255), @inactive), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'inactive_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9535, null, convert(varchar(255), @inactive_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'created_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 919, null, convert(varchar(255), @created_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'cycle' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9444, null, convert(varchar(255), @cycle), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'nbhd_descr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9537, null, convert(varchar(255), @nbhd_descr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'nbhd_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 9536, null, convert(varchar(255), @nbhd_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'neighborhood' and
               chg_log_columns = 'ls_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 454, 2932, null, convert(varchar(255), @ls_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @hood_cd, @hood_yr, @hood_name, @hood_land_pct, @hood_imprv_pct, @sys_flag, @changed_flag, @reappraisal_status, @life_cycle, @phys_comment, @eco_comment, @gov_comment, @soc_comment, @inactive, @inactive_date, @created_date, @cycle, @nbhd_descr, @nbhd_comment, @ls_id
end
 
close curRows
deallocate curRows

GO


create trigger tr_neighborhood_delete_ChangeLog
on neighborhood
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
          chg_log_tables = 'neighborhood' and
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
 
declare @tvar_key_prop_id int
 
declare @hood_cd varchar(10)
declare @hood_yr numeric(4,0)
 
declare curRows cursor
for
     select hood_cd, case hood_yr when 0 then @tvar_lFutureYear else hood_yr end from deleted
for read only
 
open curRows
fetch next from curRows into @hood_cd, @hood_yr
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @hood_cd + '-' + convert(varchar(4), @hood_yr)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 454, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @hood_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @hood_yr), case when @hood_yr > @tvar_intMin and @hood_yr < @tvar_intMax then convert(int, round(@hood_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @hood_cd, @hood_yr
end
 
close curRows
deallocate curRows

GO



create trigger tr_neighborhood_delete_insert_update_MemTable
on neighborhood
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'neighborhood'

GO


create trigger tr_neighborhood_update_ChangeLog
on neighborhood
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
 
declare @old_hood_cd varchar(10)
declare @new_hood_cd varchar(10)
declare @old_hood_yr numeric(4,0)
declare @new_hood_yr numeric(4,0)
declare @old_hood_name varchar(50)
declare @new_hood_name varchar(50)
declare @old_hood_land_pct numeric(5,2)
declare @new_hood_land_pct numeric(5,2)
declare @old_hood_imprv_pct numeric(5,2)
declare @new_hood_imprv_pct numeric(5,2)
declare @old_sys_flag char(1)
declare @new_sys_flag char(1)
declare @old_changed_flag char(1)
declare @new_changed_flag char(1)
declare @old_reappraisal_status varchar(20)
declare @new_reappraisal_status varchar(20)
declare @old_life_cycle varchar(20)
declare @new_life_cycle varchar(20)
declare @old_phys_comment varchar(500)
declare @new_phys_comment varchar(500)
declare @old_eco_comment varchar(500)
declare @new_eco_comment varchar(500)
declare @old_gov_comment varchar(500)
declare @new_gov_comment varchar(500)
declare @old_soc_comment varchar(500)
declare @new_soc_comment varchar(500)
declare @old_inactive bit
declare @new_inactive bit
declare @old_inactive_date datetime
declare @new_inactive_date datetime
declare @old_created_date datetime
declare @new_created_date datetime
declare @old_cycle int
declare @new_cycle int
declare @old_nbhd_descr varchar(5000)
declare @new_nbhd_descr varchar(5000)
declare @old_nbhd_comment varchar(5000)
declare @new_nbhd_comment varchar(5000)
declare @old_ls_id int
declare @new_ls_id int
 
declare curRows cursor
for
     select d.hood_cd, case d.hood_yr when 0 then @tvar_lFutureYear else d.hood_yr end, d.hood_name, d.hood_land_pct, d.hood_imprv_pct, d.sys_flag, d.changed_flag, d.reappraisal_status, d.life_cycle, d.phys_comment, d.eco_comment, d.gov_comment, d.soc_comment, d.inactive, d.inactive_date, d.created_date, d.cycle, d.nbhd_descr, d.nbhd_comment, d.ls_id, 
            i.hood_cd, case i.hood_yr when 0 then @tvar_lFutureYear else i.hood_yr end, i.hood_name, i.hood_land_pct, i.hood_imprv_pct, i.sys_flag, i.changed_flag, i.reappraisal_status, i.life_cycle, i.phys_comment, i.eco_comment, i.gov_comment, i.soc_comment, i.inactive, i.inactive_date, i.created_date, i.cycle, i.nbhd_descr, i.nbhd_comment, i.ls_id
from deleted as d
join inserted as i on 
     d.hood_cd = i.hood_cd and
     d.hood_yr = i.hood_yr
for read only
 
open curRows
fetch next from curRows into @old_hood_cd, @old_hood_yr, @old_hood_name, @old_hood_land_pct, @old_hood_imprv_pct, @old_sys_flag, @old_changed_flag, @old_reappraisal_status, @old_life_cycle, @old_phys_comment, @old_eco_comment, @old_gov_comment, @old_soc_comment, @old_inactive, @old_inactive_date, @old_created_date, @old_cycle, @old_nbhd_descr, @old_nbhd_comment, @old_ls_id, 
                             @new_hood_cd, @new_hood_yr, @new_hood_name, @new_hood_land_pct, @new_hood_imprv_pct, @new_sys_flag, @new_changed_flag, @new_reappraisal_status, @new_life_cycle, @new_phys_comment, @new_eco_comment, @new_gov_comment, @new_soc_comment, @new_inactive, @new_inactive_date, @new_created_date, @new_cycle, @new_nbhd_descr, @new_nbhd_comment, @new_ls_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_hood_cd + '-' + convert(varchar(4), @new_hood_yr)
 
     if (
          @old_hood_cd <> @new_hood_cd
          or
          ( @old_hood_cd is null and @new_hood_cd is not null ) 
          or
          ( @old_hood_cd is not null and @new_hood_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'hood_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 2068, convert(varchar(255), @old_hood_cd), convert(varchar(255), @new_hood_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_hood_yr <> @new_hood_yr
          or
          ( @old_hood_yr is null and @new_hood_yr is not null ) 
          or
          ( @old_hood_yr is not null and @new_hood_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'hood_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 2072, convert(varchar(255), @old_hood_yr), convert(varchar(255), @new_hood_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_hood_name <> @new_hood_name
          or
          ( @old_hood_name is null and @new_hood_name is not null ) 
          or
          ( @old_hood_name is not null and @new_hood_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'hood_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 2071, convert(varchar(255), @old_hood_name), convert(varchar(255), @new_hood_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_hood_land_pct <> @new_hood_land_pct
          or
          ( @old_hood_land_pct is null and @new_hood_land_pct is not null ) 
          or
          ( @old_hood_land_pct is not null and @new_hood_land_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'hood_land_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 2070, convert(varchar(255), @old_hood_land_pct), convert(varchar(255), @new_hood_land_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_hood_imprv_pct <> @new_hood_imprv_pct
          or
          ( @old_hood_imprv_pct is null and @new_hood_imprv_pct is not null ) 
          or
          ( @old_hood_imprv_pct is not null and @new_hood_imprv_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'hood_imprv_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 2069, convert(varchar(255), @old_hood_imprv_pct), convert(varchar(255), @new_hood_imprv_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sys_flag <> @new_sys_flag
          or
          ( @old_sys_flag is null and @new_sys_flag is not null ) 
          or
          ( @old_sys_flag is not null and @new_sys_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'sys_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 5025, convert(varchar(255), @old_sys_flag), convert(varchar(255), @new_sys_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_changed_flag <> @new_changed_flag
          or
          ( @old_changed_flag is null and @new_changed_flag is not null ) 
          or
          ( @old_changed_flag is not null and @new_changed_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'changed_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 647, convert(varchar(255), @old_changed_flag), convert(varchar(255), @new_changed_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_reappraisal_status <> @new_reappraisal_status
          or
          ( @old_reappraisal_status is null and @new_reappraisal_status is not null ) 
          or
          ( @old_reappraisal_status is not null and @new_reappraisal_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'reappraisal_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9362, convert(varchar(255), @old_reappraisal_status), convert(varchar(255), @new_reappraisal_status), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_life_cycle <> @new_life_cycle
          or
          ( @old_life_cycle is null and @new_life_cycle is not null ) 
          or
          ( @old_life_cycle is not null and @new_life_cycle is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'life_cycle' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9360, convert(varchar(255), @old_life_cycle), convert(varchar(255), @new_life_cycle), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_phys_comment <> @new_phys_comment
          or
          ( @old_phys_comment is null and @new_phys_comment is not null ) 
          or
          ( @old_phys_comment is not null and @new_phys_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'phys_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9361, convert(varchar(255), @old_phys_comment), convert(varchar(255), @new_phys_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_eco_comment <> @new_eco_comment
          or
          ( @old_eco_comment is null and @new_eco_comment is not null ) 
          or
          ( @old_eco_comment is not null and @new_eco_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'eco_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9358, convert(varchar(255), @old_eco_comment), convert(varchar(255), @new_eco_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_gov_comment <> @new_gov_comment
          or
          ( @old_gov_comment is null and @new_gov_comment is not null ) 
          or
          ( @old_gov_comment is not null and @new_gov_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'gov_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9359, convert(varchar(255), @old_gov_comment), convert(varchar(255), @new_gov_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_soc_comment <> @new_soc_comment
          or
          ( @old_soc_comment is null and @new_soc_comment is not null ) 
          or
          ( @old_soc_comment is not null and @new_soc_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'soc_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9363, convert(varchar(255), @old_soc_comment), convert(varchar(255), @new_soc_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_inactive <> @new_inactive
          or
          ( @old_inactive is null and @new_inactive is not null ) 
          or
          ( @old_inactive is not null and @new_inactive is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'inactive' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 8647, convert(varchar(255), @old_inactive), convert(varchar(255), @new_inactive), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_inactive_date <> @new_inactive_date
          or
          ( @old_inactive_date is null and @new_inactive_date is not null ) 
          or
          ( @old_inactive_date is not null and @new_inactive_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'inactive_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9535, convert(varchar(255), @old_inactive_date), convert(varchar(255), @new_inactive_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_created_date <> @new_created_date
          or
          ( @old_created_date is null and @new_created_date is not null ) 
          or
          ( @old_created_date is not null and @new_created_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'created_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 919, convert(varchar(255), @old_created_date), convert(varchar(255), @new_created_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cycle <> @new_cycle
          or
          ( @old_cycle is null and @new_cycle is not null ) 
          or
          ( @old_cycle is not null and @new_cycle is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'cycle' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9444, convert(varchar(255), @old_cycle), convert(varchar(255), @new_cycle), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_nbhd_descr <> @new_nbhd_descr
          or
          ( @old_nbhd_descr is null and @new_nbhd_descr is not null ) 
          or
          ( @old_nbhd_descr is not null and @new_nbhd_descr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'nbhd_descr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9537, convert(varchar(255), @old_nbhd_descr), convert(varchar(255), @new_nbhd_descr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_nbhd_comment <> @new_nbhd_comment
          or
          ( @old_nbhd_comment is null and @new_nbhd_comment is not null ) 
          or
          ( @old_nbhd_comment is not null and @new_nbhd_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'nbhd_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 9536, convert(varchar(255), @old_nbhd_comment), convert(varchar(255), @new_nbhd_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ls_id <> @new_ls_id
          or
          ( @old_ls_id is null and @new_ls_id is not null ) 
          or
          ( @old_ls_id is not null and @new_ls_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'neighborhood' and
                    chg_log_columns = 'ls_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 454, 2932, convert(varchar(255), @old_ls_id), convert(varchar(255), @new_ls_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2068, convert(varchar(24), @new_hood_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2072, convert(varchar(24), @new_hood_yr), case when @new_hood_yr > @tvar_intMin and @new_hood_yr < @tvar_intMax then convert(int, round(@new_hood_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_hood_cd, @old_hood_yr, @old_hood_name, @old_hood_land_pct, @old_hood_imprv_pct, @old_sys_flag, @old_changed_flag, @old_reappraisal_status, @old_life_cycle, @old_phys_comment, @old_eco_comment, @old_gov_comment, @old_soc_comment, @old_inactive, @old_inactive_date, @old_created_date, @old_cycle, @old_nbhd_descr, @old_nbhd_comment, @old_ls_id, 
                                  @new_hood_cd, @new_hood_yr, @new_hood_name, @new_hood_land_pct, @new_hood_imprv_pct, @new_sys_flag, @new_changed_flag, @new_reappraisal_status, @new_life_cycle, @new_phys_comment, @new_eco_comment, @new_gov_comment, @new_soc_comment, @new_inactive, @new_inactive_date, @new_created_date, @new_cycle, @new_nbhd_descr, @new_nbhd_comment, @new_ls_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Historical Neighborhood Appraiser', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'neighborhood', @level2type = N'COLUMN', @level2name = N'appraiser_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Gives user ability to specify comments on neighborhoods', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'neighborhood', @level2type = N'COLUMN', @level2name = N'comments';


GO

