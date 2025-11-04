CREATE TABLE [dbo].[mineral_acct] (
    [mineral_acct_id] INT          NOT NULL,
    [prop_id]         INT          NOT NULL,
    [field_cd]        VARCHAR (20) NULL,
    [mineral_zone]    VARCHAR (20) NULL,
    [rr_comm_num]     VARCHAR (20) NULL,
    [lease_id]        VARCHAR (20) NULL,
    [lease_nm]        VARCHAR (50) NULL,
    [opr]             VARCHAR (30) NULL,
    [type_of_int]     CHAR (5)     NULL,
    [well_type]       VARCHAR (20) NULL,
    [geo_info]        VARCHAR (50) NULL,
    [barrels_per_day] NUMERIC (18) NULL,
    CONSTRAINT [CPK_mineral_acct] PRIMARY KEY CLUSTERED ([prop_id] ASC, [mineral_acct_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mineral_acct_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO



create trigger tr_mineral_acct_delete_ChangeLog
on mineral_acct
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
          chg_log_tables = 'mineral_acct' and
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
 
declare @mineral_acct_id int
declare @prop_id int
 
declare curRows cursor
for
     select mineral_acct_id, prop_id from deleted
for read only
 
open curRows
fetch next from curRows into @mineral_acct_id, @prop_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 414, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
 
     fetch next from curRows into @mineral_acct_id, @prop_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_mineral_acct_insert_ChangeLog
on mineral_acct
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
 
declare @mineral_acct_id int
declare @prop_id int
declare @field_cd varchar(20)
declare @mineral_zone varchar(20)
declare @rr_comm_num varchar(20)
declare @lease_id varchar(20)
declare @lease_nm varchar(50)
declare @opr varchar(30)
declare @type_of_int char(5)
declare @well_type varchar(20)
declare @geo_info varchar(50)
declare @barrels_per_day numeric(18,0)
 
declare curRows cursor
for
     select mineral_acct_id, prop_id, field_cd, mineral_zone, rr_comm_num, lease_id, lease_nm, opr, type_of_int, well_type, geo_info, barrels_per_day from inserted
for read only
 
open curRows
fetch next from curRows into @mineral_acct_id, @prop_id, @field_cd, @mineral_zone, @rr_comm_num, @lease_id, @lease_nm, @opr, @type_of_int, @well_type, @geo_info, @barrels_per_day
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'mineral_acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 3072, null, convert(varchar(255), @mineral_acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'field_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 1875, null, convert(varchar(255), @field_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'mineral_zone' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 3086, null, convert(varchar(255), @mineral_zone), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'rr_comm_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 4452, null, convert(varchar(255), @rr_comm_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'lease_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 2761, null, convert(varchar(255), @lease_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'lease_nm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 2764, null, convert(varchar(255), @lease_nm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'opr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 3412, null, convert(varchar(255), @opr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'type_of_int' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 5401, null, convert(varchar(255), @type_of_int), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'well_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 5534, null, convert(varchar(255), @well_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'geo_info' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 2008, null, convert(varchar(255), @geo_info), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mineral_acct' and
               chg_log_columns = 'barrels_per_day' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 414, 409, null, convert(varchar(255), @barrels_per_day), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @mineral_acct_id), @mineral_acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     fetch next from curRows into @mineral_acct_id, @prop_id, @field_cd, @mineral_zone, @rr_comm_num, @lease_id, @lease_nm, @opr, @type_of_int, @well_type, @geo_info, @barrels_per_day
end
 
close curRows
deallocate curRows

GO



create trigger tr_mineral_acct_update_ChangeLog
on mineral_acct
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
 
declare @old_mineral_acct_id int
declare @new_mineral_acct_id int
declare @old_prop_id int
declare @new_prop_id int
declare @old_field_cd varchar(20)
declare @new_field_cd varchar(20)
declare @old_mineral_zone varchar(20)
declare @new_mineral_zone varchar(20)
declare @old_rr_comm_num varchar(20)
declare @new_rr_comm_num varchar(20)
declare @old_lease_id varchar(20)
declare @new_lease_id varchar(20)
declare @old_lease_nm varchar(50)
declare @new_lease_nm varchar(50)
declare @old_opr varchar(30)
declare @new_opr varchar(30)
declare @old_type_of_int char(5)
declare @new_type_of_int char(5)
declare @old_well_type varchar(20)
declare @new_well_type varchar(20)
declare @old_geo_info varchar(50)
declare @new_geo_info varchar(50)
declare @old_barrels_per_day numeric(18,0)
declare @new_barrels_per_day numeric(18,0)
 
declare curRows cursor
for
     select d.mineral_acct_id, d.prop_id, d.field_cd, d.mineral_zone, d.rr_comm_num, d.lease_id, d.lease_nm, d.opr, d.type_of_int, d.well_type, d.geo_info, d.barrels_per_day, i.mineral_acct_id, i.prop_id, i.field_cd, i.mineral_zone, i.rr_comm_num, i.lease_id, i.lease_nm, i.opr, i.type_of_int, i.well_type, i.geo_info, i.barrels_per_day
from deleted as d
join inserted as i on 
     d.mineral_acct_id = i.mineral_acct_id and
     d.prop_id = i.prop_id
for read only
 
open curRows
fetch next from curRows into @old_mineral_acct_id, @old_prop_id, @old_field_cd, @old_mineral_zone, @old_rr_comm_num, @old_lease_id, @old_lease_nm, @old_opr, @old_type_of_int, @old_well_type, @old_geo_info, @old_barrels_per_day, @new_mineral_acct_id, @new_prop_id, @new_field_cd, @new_mineral_zone, @new_rr_comm_num, @new_lease_id, @new_lease_nm, @new_opr, @new_type_of_int, @new_well_type, @new_geo_info, @new_barrels_per_day
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_mineral_acct_id <> @new_mineral_acct_id
          or
          ( @old_mineral_acct_id is null and @new_mineral_acct_id is not null ) 
          or
          ( @old_mineral_acct_id is not null and @new_mineral_acct_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'mineral_acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 3072, convert(varchar(255), @old_mineral_acct_id), convert(varchar(255), @new_mineral_acct_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
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
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_field_cd <> @new_field_cd
          or
          ( @old_field_cd is null and @new_field_cd is not null ) 
          or
          ( @old_field_cd is not null and @new_field_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'field_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 1875, convert(varchar(255), @old_field_cd), convert(varchar(255), @new_field_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_mineral_zone <> @new_mineral_zone
          or
          ( @old_mineral_zone is null and @new_mineral_zone is not null ) 
          or
          ( @old_mineral_zone is not null and @new_mineral_zone is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'mineral_zone' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 3086, convert(varchar(255), @old_mineral_zone), convert(varchar(255), @new_mineral_zone) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_rr_comm_num <> @new_rr_comm_num
          or
          ( @old_rr_comm_num is null and @new_rr_comm_num is not null ) 
          or
          ( @old_rr_comm_num is not null and @new_rr_comm_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'rr_comm_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 4452, convert(varchar(255), @old_rr_comm_num), convert(varchar(255), @new_rr_comm_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_lease_id <> @new_lease_id
          or
          ( @old_lease_id is null and @new_lease_id is not null ) 
          or
          ( @old_lease_id is not null and @new_lease_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'lease_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 2761, convert(varchar(255), @old_lease_id), convert(varchar(255), @new_lease_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_lease_nm <> @new_lease_nm
          or
          ( @old_lease_nm is null and @new_lease_nm is not null ) 
          or
          ( @old_lease_nm is not null and @new_lease_nm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'lease_nm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 2764, convert(varchar(255), @old_lease_nm), convert(varchar(255), @new_lease_nm) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_opr <> @new_opr
          or
          ( @old_opr is null and @new_opr is not null ) 
          or
          ( @old_opr is not null and @new_opr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'opr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 3412, convert(varchar(255), @old_opr), convert(varchar(255), @new_opr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_type_of_int <> @new_type_of_int
          or
          ( @old_type_of_int is null and @new_type_of_int is not null ) 
          or
          ( @old_type_of_int is not null and @new_type_of_int is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'type_of_int' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 5401, convert(varchar(255), @old_type_of_int), convert(varchar(255), @new_type_of_int) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_well_type <> @new_well_type
          or
          ( @old_well_type is null and @new_well_type is not null ) 
          or
          ( @old_well_type is not null and @new_well_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'well_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 5534, convert(varchar(255), @old_well_type), convert(varchar(255), @new_well_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_geo_info <> @new_geo_info
          or
          ( @old_geo_info is null and @new_geo_info is not null ) 
          or
          ( @old_geo_info is not null and @new_geo_info is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'geo_info' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 2008, convert(varchar(255), @old_geo_info), convert(varchar(255), @new_geo_info) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_barrels_per_day <> @new_barrels_per_day
          or
          ( @old_barrels_per_day is null and @new_barrels_per_day is not null ) 
          or
          ( @old_barrels_per_day is not null and @new_barrels_per_day is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mineral_acct' and
                    chg_log_columns = 'barrels_per_day' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 414, 409, convert(varchar(255), @old_barrels_per_day), convert(varchar(255), @new_barrels_per_day) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3072, convert(varchar(24), @new_mineral_acct_id), @new_mineral_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     fetch next from curRows into @old_mineral_acct_id, @old_prop_id, @old_field_cd, @old_mineral_zone, @old_rr_comm_num, @old_lease_id, @old_lease_nm, @old_opr, @old_type_of_int, @old_well_type, @old_geo_info, @old_barrels_per_day, @new_mineral_acct_id, @new_prop_id, @new_field_cd, @new_mineral_zone, @new_rr_comm_num, @new_lease_id, @new_lease_nm, @new_opr, @new_type_of_int, @new_well_type, @new_geo_info, @new_barrels_per_day
end
 
close curRows
deallocate curRows

GO

