CREATE TABLE [dbo].[situs] (
    [prop_id]            INT          NOT NULL,
    [situs_id]           INT          NOT NULL,
    [primary_situs]      CHAR (1)     NULL,
    [situs_num]          VARCHAR (15) NULL,
    [situs_street_prefx] VARCHAR (10) NULL,
    [situs_street]       VARCHAR (50) NULL,
    [situs_street_sufix] VARCHAR (10) NULL,
    [situs_unit]         VARCHAR (5)  NULL,
    [situs_city]         VARCHAR (30) NULL,
    [situs_state]        CHAR (2)     NULL,
    [situs_zip]          VARCHAR (10) NULL,
    [situs_display]      AS           ((((((((((case when isnull([situs_num],'')='' then '' else rtrim(ltrim([situs_num]))+' ' end+case when isnull([sub_num],'')='' then '' else rtrim(ltrim([sub_num]))+' ' end)+case when isnull([situs_street_prefx],'')='' then '' else rtrim(ltrim([situs_street_prefx]))+' ' end)+case when [situs_street] IS NULL then '' else rtrim(ltrim([situs_street]))+' ' end)+case when [situs_street_sufix] IS NULL then '' else rtrim(ltrim([situs_street_sufix]))+' ' end)+case when isnull([building_num],'')='' then '' else rtrim(ltrim([building_num]))+' ' end)+case when [situs_unit] IS NULL then '' else rtrim(ltrim([situs_unit])) end)+case when [situs_city] IS NULL AND [situs_state] IS NULL AND [situs_zip] IS NULL then '' else char((13))+char((10)) end)+case when [situs_city] IS NULL then '' else rtrim(ltrim([situs_city]))+', ' end)+case when [situs_state] IS NULL then '' else rtrim(ltrim([situs_state]))+' ' end)+case when [situs_zip] IS NULL then '' else rtrim(ltrim([situs_zip])) end),
    [building_num]       VARCHAR (15) NULL,
    [sub_num]            VARCHAR (15) NULL,
    CONSTRAINT [CPK_situs] PRIMARY KEY CLUSTERED ([prop_id] ASC, [situs_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_situs_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_situs_num]
    ON [dbo].[situs]([situs_num] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_situs_city]
    ON [dbo].[situs]([situs_city] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_situs_street]
    ON [dbo].[situs]([situs_street] ASC) WITH (FILLFACTOR = 90);


GO

create trigger tr_situs_insert_ChangeLog
on dbo.situs
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
 
declare @prop_id int
declare @situs_id int
declare @primary_situs char(1)
declare @situs_num varchar(15)
declare @situs_street_prefx varchar(10)
declare @situs_street varchar(50)
declare @situs_street_sufix varchar(10)
declare @situs_unit varchar(5)
declare @situs_city varchar(30)
declare @situs_state char(2)
declare @situs_zip varchar(10)
declare @situs_display varchar(140)
 
declare curRows cursor
for
     select prop_id, situs_id, primary_situs, situs_num, situs_street_prefx, situs_street, situs_street_sufix, situs_unit, situs_city, situs_state, situs_zip, situs_display from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @situs_id, @primary_situs, @situs_num, @situs_street_prefx, @situs_street, @situs_street_sufix, @situs_unit, @situs_city, @situs_state, @situs_zip, @situs_display
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4740, null, convert(varchar(255), @situs_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'primary_situs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 3929, null, convert(varchar(255), @primary_situs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4742, null, convert(varchar(255), @situs_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_street_prefx' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4746, null, convert(varchar(255), @situs_street_prefx), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_street' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4744, null, convert(varchar(255), @situs_street), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_street_sufix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4747, null, convert(varchar(255), @situs_street_sufix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_unit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 5933, null, convert(varchar(255), @situs_unit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4739, null, convert(varchar(255), @situs_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_state' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4743, null, convert(varchar(255), @situs_state), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_zip' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 4748, null, convert(varchar(255), @situs_zip), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'situs' and
               chg_log_columns = 'situs_display' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 763, 5932, null, convert(varchar(255), @situs_display), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     fetch next from curRows into @prop_id, @situs_id, @primary_situs, @situs_num, @situs_street_prefx, @situs_street, @situs_street_sufix, @situs_unit, @situs_city, @situs_state, @situs_zip, @situs_display
end
 
close curRows
deallocate curRows

GO

create trigger tr_situs_delete_ChangeLog
on dbo.situs
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
          chg_log_tables = 'situs' and
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
 
declare @prop_id int
declare @situs_id int
 
declare curRows cursor
for
     select prop_id, situs_id from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @situs_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 763, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @situs_id), @situs_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
 
     fetch next from curRows into @prop_id, @situs_id
end
 
close curRows
deallocate curRows

GO

create trigger tr_situs_update_ChangeLog
on dbo.situs
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
 
declare @old_prop_id int
declare @new_prop_id int
declare @old_situs_id int
declare @new_situs_id int
declare @old_primary_situs char(1)
declare @new_primary_situs char(1)
declare @old_situs_num varchar(15)
declare @new_situs_num varchar(15)
declare @old_situs_street_prefx varchar(10)
declare @new_situs_street_prefx varchar(10)
declare @old_situs_street varchar(50)
declare @new_situs_street varchar(50)
declare @old_situs_street_sufix varchar(10)
declare @new_situs_street_sufix varchar(10)
declare @old_situs_unit varchar(5)
declare @new_situs_unit varchar(5)
declare @old_situs_city varchar(30)
declare @new_situs_city varchar(30)
declare @old_situs_state char(2)
declare @new_situs_state char(2)
declare @old_situs_zip varchar(10)
declare @new_situs_zip varchar(10)
declare @old_situs_display varchar(140)
declare @new_situs_display varchar(140)
 
declare curRows cursor
for
     select d.prop_id, d.situs_id, d.primary_situs, d.situs_num, d.situs_street_prefx, d.situs_street, d.situs_street_sufix, d.situs_unit, d.situs_city, d.situs_state, d.situs_zip, d.situs_display, i.prop_id, i.situs_id, i.primary_situs, i.situs_num, i.situs_street_prefx, i.situs_street, i.situs_street_sufix, i.situs_unit, i.situs_city, i.situs_state, i.situs_zip, i.situs_display
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.situs_id = i.situs_id
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_situs_id, @old_primary_situs, @old_situs_num, @old_situs_street_prefx, @old_situs_street, @old_situs_street_sufix, @old_situs_unit, @old_situs_city, @old_situs_state, @old_situs_zip, @old_situs_display, @new_prop_id, @new_situs_id, @new_primary_situs, @new_situs_num, @new_situs_street_prefx, @new_situs_street, @new_situs_street_sufix, @new_situs_unit, @new_situs_city, @new_situs_state, @new_situs_zip, @new_situs_display
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_prop_id <> @new_prop_id
          or
          ( @old_prop_id is null and @new_prop_id is not null ) 
          or
          ( @old_prop_id is not null and @new_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_situs_id <> @new_situs_id
          or
          ( @old_situs_id is null and @new_situs_id is not null ) 
          or
          ( @old_situs_id is not null and @new_situs_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4740, convert(varchar(255), @old_situs_id), convert(varchar(255), @new_situs_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_primary_situs <> @new_primary_situs
          or
          ( @old_primary_situs is null and @new_primary_situs is not null ) 
          or
          ( @old_primary_situs is not null and @new_primary_situs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'primary_situs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 3929, convert(varchar(255), @old_primary_situs), convert(varchar(255), @new_primary_situs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_situs_num <> @new_situs_num
          or
          ( @old_situs_num is null and @new_situs_num is not null ) 
          or
          ( @old_situs_num is not null and @new_situs_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4742, convert(varchar(255), @old_situs_num), convert(varchar(255), @new_situs_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_situs_street_prefx <> @new_situs_street_prefx
          or
          ( @old_situs_street_prefx is null and @new_situs_street_prefx is not null ) 
          or
          ( @old_situs_street_prefx is not null and @new_situs_street_prefx is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_street_prefx' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4746, convert(varchar(255), @old_situs_street_prefx), convert(varchar(255), @new_situs_street_prefx) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
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
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_street' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4744, convert(varchar(255), @old_situs_street), convert(varchar(255), @new_situs_street) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_situs_street_sufix <> @new_situs_street_sufix
          or
          ( @old_situs_street_sufix is null and @new_situs_street_sufix is not null ) 
          or
          ( @old_situs_street_sufix is not null and @new_situs_street_sufix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_street_sufix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4747, convert(varchar(255), @old_situs_street_sufix), convert(varchar(255), @new_situs_street_sufix) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_situs_unit <> @new_situs_unit
          or
          ( @old_situs_unit is null and @new_situs_unit is not null ) 
          or
          ( @old_situs_unit is not null and @new_situs_unit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_unit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 5933, convert(varchar(255), @old_situs_unit), convert(varchar(255), @new_situs_unit) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
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
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_city' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4739, convert(varchar(255), @old_situs_city), convert(varchar(255), @new_situs_city) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
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
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_state' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4743, convert(varchar(255), @old_situs_state), convert(varchar(255), @new_situs_state) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
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
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_zip' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 4748, convert(varchar(255), @old_situs_zip), convert(varchar(255), @new_situs_zip) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_situs_display <> @new_situs_display
          or
          ( @old_situs_display is null and @new_situs_display is not null ) 
          or
          ( @old_situs_display is not null and @new_situs_display is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'situs' and
                    chg_log_columns = 'situs_display' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 763, 5932, convert(varchar(255), @old_situs_display), convert(varchar(255), @new_situs_display) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4740, convert(varchar(24), @new_situs_id), @new_situs_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_situs_id, @old_primary_situs, @old_situs_num, @old_situs_street_prefx, @old_situs_street, @old_situs_street_sufix, @old_situs_unit, @old_situs_city, @old_situs_state, @old_situs_zip, @old_situs_display, @new_prop_id, @new_situs_id, @new_primary_situs, @new_situs_num, @new_situs_street_prefx, @new_situs_street, @new_situs_street_sufix, @new_situs_unit, @new_situs_city, @new_situs_state, @new_situs_zip, @new_situs_display
end
 
close curRows
deallocate curRows

GO

