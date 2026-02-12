CREATE TABLE [dbo].[lease_prop_assoc] (
    [lease_id]         VARCHAR (20)    NOT NULL,
    [lease_yr]         INT             NOT NULL,
    [rev_num]          INT             NOT NULL,
    [sup_num]          INT             NOT NULL,
    [prop_id]          INT             NOT NULL,
    [interest_type_cd] VARCHAR (5)     NULL,
    [interest_pct]     NUMERIC (14, 8) NULL,
    [barrels_per_day]  NUMERIC (18)    NULL,
    CONSTRAINT [CPK_lease_prop_assoc] PRIMARY KEY CLUSTERED ([lease_id] ASC, [lease_yr] ASC, [rev_num] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_lease_prop_assoc_interest_type_cd] FOREIGN KEY ([interest_type_cd]) REFERENCES [dbo].[interest_type] ([interest_type_cd]),
    CONSTRAINT [CFK_lease_prop_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO



create trigger tr_lease_prop_assoc_delete_ChangeLog
on lease_prop_assoc
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
          chg_log_tables = 'lease_prop_assoc' and
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
 
declare @lease_id varchar(20)
declare @lease_yr int
declare @rev_num int
declare @sup_num int
declare @prop_id int
 
declare curRows cursor
for
     select lease_id, lease_yr, rev_num, sup_num, prop_id from deleted
for read only
 
open curRows
fetch next from curRows into @lease_id, @lease_yr, @rev_num, @sup_num, @prop_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @lease_id)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 384, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
 
     fetch next from curRows into @lease_id, @lease_yr, @rev_num, @sup_num, @prop_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_lease_prop_assoc_update_ChangeLog
on lease_prop_assoc
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
 
declare @old_lease_id varchar(20)
declare @new_lease_id varchar(20)
declare @old_lease_yr int
declare @new_lease_yr int
declare @old_rev_num int
declare @new_rev_num int
declare @old_sup_num int
declare @new_sup_num int
declare @old_prop_id int
declare @new_prop_id int
declare @old_interest_type_cd varchar(5)
declare @new_interest_type_cd varchar(5)
declare @old_interest_pct numeric(14,8)
declare @new_interest_pct numeric(14,8)
declare @old_barrels_per_day numeric(18,0)
declare @new_barrels_per_day numeric(18,0)
 
declare curRows cursor
for
     select d.lease_id, d.lease_yr, d.rev_num, d.sup_num, d.prop_id, d.interest_type_cd, d.interest_pct, d.barrels_per_day, i.lease_id, i.lease_yr, i.rev_num, i.sup_num, i.prop_id, i.interest_type_cd, i.interest_pct, i.barrels_per_day
from deleted as d
join inserted as i on 
     d.lease_id = i.lease_id and
     d.lease_yr = i.lease_yr and
     d.rev_num = i.rev_num and
     d.sup_num = i.sup_num and
     d.prop_id = i.prop_id
for read only
 
open curRows
fetch next from curRows into @old_lease_id, @old_lease_yr, @old_rev_num, @old_sup_num, @old_prop_id, @old_interest_type_cd, @old_interest_pct, @old_barrels_per_day, @new_lease_id, @new_lease_yr, @new_rev_num, @new_sup_num, @new_prop_id, @new_interest_type_cd, @new_interest_pct, @new_barrels_per_day
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @new_lease_id)
 
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
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'lease_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 2761, convert(varchar(255), @old_lease_id), convert(varchar(255), @new_lease_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_lease_yr <> @new_lease_yr
          or
          ( @old_lease_yr is null and @new_lease_yr is not null ) 
          or
          ( @old_lease_yr is not null and @new_lease_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'lease_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 2770, convert(varchar(255), @old_lease_yr), convert(varchar(255), @new_lease_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_rev_num <> @new_rev_num
          or
          ( @old_rev_num is null and @new_rev_num is not null ) 
          or
          ( @old_rev_num is not null and @new_rev_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'rev_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 4414, convert(varchar(255), @old_rev_num), convert(varchar(255), @new_rev_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
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
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_interest_type_cd <> @new_interest_type_cd
          or
          ( @old_interest_type_cd is null and @new_interest_type_cd is not null ) 
          or
          ( @old_interest_type_cd is not null and @new_interest_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'interest_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 2466, convert(varchar(255), @old_interest_type_cd), convert(varchar(255), @new_interest_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_interest_pct <> @new_interest_pct
          or
          ( @old_interest_pct is null and @new_interest_pct is not null ) 
          or
          ( @old_interest_pct is not null and @new_interest_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'interest_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 2462, convert(varchar(255), @old_interest_pct), convert(varchar(255), @new_interest_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'lease_prop_assoc' and
                    chg_log_columns = 'barrels_per_day' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 384, 409, convert(varchar(255), @old_barrels_per_day), convert(varchar(255), @new_barrels_per_day) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @new_lease_id), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @new_lease_yr), @new_lease_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @new_rev_num), @new_rev_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     fetch next from curRows into @old_lease_id, @old_lease_yr, @old_rev_num, @old_sup_num, @old_prop_id, @old_interest_type_cd, @old_interest_pct, @old_barrels_per_day, @new_lease_id, @new_lease_yr, @new_rev_num, @new_sup_num, @new_prop_id, @new_interest_type_cd, @new_interest_pct, @new_barrels_per_day
end
 
close curRows
deallocate curRows

GO



create trigger tr_lease_prop_assoc_insert_ChangeLog
on lease_prop_assoc
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
 
declare @lease_id varchar(20)
declare @lease_yr int
declare @rev_num int
declare @sup_num int
declare @prop_id int
declare @interest_type_cd varchar(5)
declare @interest_pct numeric(14,8)
declare @barrels_per_day numeric(18,0)
 
declare curRows cursor
for
     select lease_id, lease_yr, rev_num, sup_num, prop_id, interest_type_cd, interest_pct, barrels_per_day from inserted
for read only
 
open curRows
fetch next from curRows into @lease_id, @lease_yr, @rev_num, @sup_num, @prop_id, @interest_type_cd, @interest_pct, @barrels_per_day
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(12), @lease_id)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'lease_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 2761, null, convert(varchar(255), @lease_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'lease_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 2770, null, convert(varchar(255), @lease_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'rev_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 4414, null, convert(varchar(255), @rev_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'interest_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 2466, null, convert(varchar(255), @interest_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'interest_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 2462, null, convert(varchar(255), @interest_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'lease_prop_assoc' and
               chg_log_columns = 'barrels_per_day' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 384, 409, null, convert(varchar(255), @barrels_per_day), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2761, convert(varchar(24), @lease_id), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2770, convert(varchar(24), @lease_yr), @lease_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4414, convert(varchar(24), @rev_num), @rev_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     fetch next from curRows into @lease_id, @lease_yr, @rev_num, @sup_num, @prop_id, @interest_type_cd, @interest_pct, @barrels_per_day
end
 
close curRows
deallocate curRows

GO

