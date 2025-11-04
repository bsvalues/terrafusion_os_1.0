CREATE TABLE [dbo].[effective_acres_assoc] (
    [group_id]    INT         NOT NULL,
    [prop_val_yr] NUMERIC (4) NOT NULL,
    [prop_id]     INT         NOT NULL,
    [date_added]  DATETIME    NOT NULL,
    [Added_By]    INT         NOT NULL,
    CONSTRAINT [CPK_effective_acres_assoc] PRIMARY KEY CLUSTERED ([group_id] ASC, [prop_val_yr] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_effective_acres_assoc_delete
on effective_acres_assoc
for delete
not for replication
as

declare @old_group_id int
declare @old_prop_val_yr numeric(4,0)
declare @old_prop_id int

-- for each deleted record... 
declare delete_cursor cursor for
select group_id, prop_val_yr, prop_id from deleted
for read only
 
open delete_cursor

fetch next from delete_cursor into @old_group_id, @old_prop_val_yr, @old_prop_id
 
while (@@fetch_status = 0)
begin
	-- reset the effective acreage of the linked property, if it is writeable
	update pv
	set eff_size_acres = null
	
	from prop_supp_assoc psa

	join property_val pv
	on pv.prop_id = psa.prop_id
	and pv.prop_val_yr = psa.owner_tax_yr
	and pv.sup_num = psa.sup_num

	join pacs_year py with(nolock)
	on pv.prop_val_yr = py.tax_yr

	outer apply (
		select top 1 * from supplement with(nolock)
		where supplement.sup_tax_yr = pv.prop_val_yr
		and supplement.sup_num = pv.sup_num
		order by sup_group_id desc
	) s

	left join sup_group sg with(nolock)
	on sg.sup_group_id = s.sup_group_id

	where psa.prop_id = @old_prop_id
	and psa.owner_tax_yr = @old_prop_val_yr
	and (py.certification_dt is null or isnull(sg.status_cd, '') in ('P','C', 'L', 'TO'))

	-- update the effective acreage of the remaining properties and the group itself
	exec EffectiveAcresUpdateSize @old_prop_val_yr, @old_group_id 

	fetch next from delete_cursor into @old_group_id, @old_prop_val_yr, @old_prop_id
end

close delete_cursor
deallocate delete_cursor

GO


create trigger tr_effective_acres_assoc_insert
on effective_acres_assoc
for insert
not for replication
as

declare @group_id int
declare @prop_val_yr numeric(4,0)
 

-- for each group affected by the insert... 
declare group_cursor cursor for
select distinct group_id, prop_val_yr from inserted
for read only
 
open group_cursor

fetch next from group_cursor into @group_id, @prop_val_yr
 
while (@@fetch_status = 0)
begin
	-- update the effective acres in the group and its properties
	exec EffectiveAcresUpdateSize @prop_val_yr, @group_id 
	
	fetch next from group_cursor into @group_id, @prop_val_yr
end

close group_cursor
deallocate group_cursor

GO



create trigger tr_effective_acres_assoc_update_ChangeLog
on effective_acres_assoc
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
 
declare @old_group_id int
declare @new_group_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_prop_id int
declare @new_prop_id int
declare @old_date_added datetime
declare @new_date_added datetime
declare @old_Added_By int
declare @new_Added_By int
 
declare curRows cursor
for
     select d.group_id, d.prop_val_yr, d.prop_id, d.date_added, d.Added_By, i.group_id, i.prop_val_yr, i.prop_id, i.date_added, i.Added_By
from deleted as d
join inserted as i on 
     d.group_id = i.group_id and
     d.prop_val_yr = i.prop_val_yr and
     d.prop_id = i.prop_id
for read only
 
open curRows
fetch next from curRows into @old_group_id, @old_prop_val_yr, @old_prop_id, @old_date_added, @old_Added_By, @new_group_id, @new_prop_val_yr, @new_prop_id, @new_date_added, @new_Added_By
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_group_id <> @new_group_id
          or
          ( @old_group_id is null and @new_group_id is not null ) 
          or
          ( @old_group_id is not null and @new_group_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_assoc' and
                    chg_log_columns = 'group_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 848, 2033, convert(varchar(255), @old_group_id), convert(varchar(255), @new_group_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_prop_val_yr <> @new_prop_val_yr
          or
          ( @old_prop_val_yr is null and @new_prop_val_yr is not null ) 
          or
          ( @old_prop_val_yr is not null and @new_prop_val_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_assoc' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 848, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
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
                    chg_log_tables = 'effective_acres_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 848, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_date_added <> @new_date_added
          or
          ( @old_date_added is null and @new_date_added is not null ) 
          or
          ( @old_date_added is not null and @new_date_added is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_assoc' and
                    chg_log_columns = 'date_added' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 848, 1113, convert(varchar(255), @old_date_added), convert(varchar(255), @new_date_added) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     if (
          @old_Added_By <> @new_Added_By
          or
          ( @old_Added_By is null and @new_Added_By is not null ) 
          or
          ( @old_Added_By is not null and @new_Added_By is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_assoc' and
                    chg_log_columns = 'Added_By' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 848, 6009, convert(varchar(255), @old_Added_By), convert(varchar(255), @new_Added_By) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
          end
     end
 
     fetch next from curRows into @old_group_id, @old_prop_val_yr, @old_prop_id, @old_date_added, @old_Added_By, @new_group_id, @new_prop_val_yr, @new_prop_id, @new_date_added, @new_Added_By
end
 
close curRows
deallocate curRows

GO



create trigger tr_effective_acres_assoc_delete_ChangeLog
on effective_acres_assoc
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
          chg_log_tables = 'effective_acres_assoc' and
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
 
declare @group_id int
declare @prop_val_yr numeric(4,0)
declare @prop_id int
 
declare curRows cursor
for
     select group_id, prop_val_yr, prop_id from deleted
for read only
 
open curRows
fetch next from curRows into @group_id, @prop_val_yr, @prop_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 848, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
 
     fetch next from curRows into @group_id, @prop_val_yr, @prop_id
end
 
close curRows
deallocate curRows

GO


create trigger tr_effective_acres_assoc_update
on effective_acres_assoc
for update
not for replication
as

declare @group_id int
declare @prop_val_yr numeric(4,0)
 

-- for each group affected by the insert... 
declare group_cursor cursor for
select distinct group_id, prop_val_yr from inserted
for read only
 
open group_cursor

fetch next from group_cursor into @group_id, @prop_val_yr
 
while (@@fetch_status = 0)
begin
	-- update the effective acres in the group and its properties
	exec EffectiveAcresUpdateSize @prop_val_yr, @group_id 
	
	fetch next from group_cursor into @group_id, @prop_val_yr
end

close group_cursor
deallocate group_cursor

GO



create trigger tr_effective_acres_assoc_insert_ChangeLog
on effective_acres_assoc
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
 
declare @group_id int
declare @prop_val_yr numeric(4,0)
declare @prop_id int
declare @date_added datetime
declare @Added_By int
 
declare curRows cursor
for
     select group_id, prop_val_yr, prop_id, date_added, Added_By from inserted
for read only
 
open curRows
fetch next from curRows into @group_id, @prop_val_yr, @prop_id, @date_added, @Added_By
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_assoc' and
               chg_log_columns = 'group_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 848, 2033, null, convert(varchar(255), @group_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_assoc' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 848, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 848, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_assoc' and
               chg_log_columns = 'date_added' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 848, 1113, null, convert(varchar(255), @date_added), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_assoc' and
               chg_log_columns = 'Added_By' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 848, 6009, null, convert(varchar(255), @Added_By), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     fetch next from curRows into @group_id, @prop_val_yr, @prop_id, @date_added, @Added_By
end
 
close curRows
deallocate curRows

GO

