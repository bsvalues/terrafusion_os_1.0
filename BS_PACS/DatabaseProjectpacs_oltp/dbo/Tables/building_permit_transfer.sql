CREATE TABLE [dbo].[building_permit_transfer] (
    [source_building_permit]      INT NOT NULL,
    [source_property]             INT NULL,
    [destination_building_permit] INT NULL,
    [destination_property]        INT NULL,
    CONSTRAINT [CPK_building_permit_transfer] PRIMARY KEY CLUSTERED ([source_building_permit] ASC),
    CONSTRAINT [CFK_building_permit_transfer_destination_building_permit_bldg_permit_id] FOREIGN KEY ([destination_building_permit]) REFERENCES [dbo].[building_permit] ([bldg_permit_id]),
    CONSTRAINT [CFK_building_permit_transfer_destination_property_prop_id] FOREIGN KEY ([destination_property]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_building_permit_transfer_source_building_permit_bldg_permit_id] FOREIGN KEY ([source_building_permit]) REFERENCES [dbo].[building_permit] ([bldg_permit_id]),
    CONSTRAINT [CFK_building_permit_transfer_source_property_prop_id] FOREIGN KEY ([source_property]) REFERENCES [dbo].[property] ([prop_id])
);


GO

 
create trigger tr_building_permit_transfer_update_ChangeLog
on building_permit_transfer
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
 
declare @old_source_building_permit int
declare @new_source_building_permit int
declare @old_source_property int
declare @new_source_property int
declare @old_destination_building_permit int
declare @new_destination_building_permit int
declare @old_destination_property int
declare @new_destination_property int
 
declare curRows cursor
for
     select d.source_building_permit, d.source_property, d.destination_building_permit, d.destination_property, 
            i.source_building_permit, i.source_property, i.destination_building_permit, i.destination_property
from deleted as d
join inserted as i on 
     d.source_building_permit = i.source_building_permit
for read only
 
open curRows
fetch next from curRows into @old_source_building_permit, @old_source_property, @old_destination_building_permit, @old_destination_property, 
                             @new_source_building_permit, @new_source_property, @new_destination_building_permit, @new_destination_property
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_source_building_permit <> @new_source_building_permit
          or
          ( @old_source_building_permit is null and @new_source_building_permit is not null ) 
          or
          ( @old_source_building_permit is not null and @new_source_building_permit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit_transfer' and
                    chg_log_columns = 'source_building_permit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1682, 9794, convert(varchar(255), @old_source_building_permit), convert(varchar(255), @new_source_building_permit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @new_source_building_permit), @new_source_building_permit)
          end
     end
 
     if (
          @old_source_property <> @new_source_property
          or
          ( @old_source_property is null and @new_source_property is not null ) 
          or
          ( @old_source_property is not null and @new_source_property is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit_transfer' and
                    chg_log_columns = 'source_property' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1682, 9797, convert(varchar(255), @old_source_property), convert(varchar(255), @new_source_property), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @new_source_building_permit), @new_source_building_permit)
          end
     end
 
     if (
          @old_destination_building_permit <> @new_destination_building_permit
          or
          ( @old_destination_building_permit is null and @new_destination_building_permit is not null ) 
          or
          ( @old_destination_building_permit is not null and @new_destination_building_permit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit_transfer' and
                    chg_log_columns = 'destination_building_permit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1682, 9795, convert(varchar(255), @old_destination_building_permit), convert(varchar(255), @new_destination_building_permit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @new_source_building_permit), @new_source_building_permit)
          end
     end
 
     if (
          @old_destination_property <> @new_destination_property
          or
          ( @old_destination_property is null and @new_destination_property is not null ) 
          or
          ( @old_destination_property is not null and @new_destination_property is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'building_permit_transfer' and
                    chg_log_columns = 'destination_property' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1682, 9796, convert(varchar(255), @old_destination_property), convert(varchar(255), @new_destination_property), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @new_source_building_permit), @new_source_building_permit)
          end
     end
 
     fetch next from curRows into @old_source_building_permit, @old_source_property, @old_destination_building_permit, @old_destination_property, 
                                  @new_source_building_permit, @new_source_property, @new_destination_building_permit, @new_destination_property
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_building_permit_transfer_insert_ChangeLog
on building_permit_transfer
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
 
declare @source_building_permit int
declare @source_property int
declare @destination_building_permit int
declare @destination_property int
 
declare curRows cursor
for
     select source_building_permit, source_property, destination_building_permit, destination_property from inserted
for read only
 
open curRows
fetch next from curRows into @source_building_permit, @source_property, @destination_building_permit, @destination_property
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit_transfer' and
               chg_log_columns = 'source_building_permit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1682, 9794, null, convert(varchar(255), @source_building_permit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @source_building_permit), @source_building_permit)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit_transfer' and
               chg_log_columns = 'source_property' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1682, 9797, null, convert(varchar(255), @source_property), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @source_building_permit), @source_building_permit)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit_transfer' and
               chg_log_columns = 'destination_building_permit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1682, 9795, null, convert(varchar(255), @destination_building_permit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @source_building_permit), @source_building_permit)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'building_permit_transfer' and
               chg_log_columns = 'destination_property' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1682, 9796, null, convert(varchar(255), @destination_property), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @source_building_permit), @source_building_permit)
     end
 
     fetch next from curRows into @source_building_permit, @source_property, @destination_building_permit, @destination_property
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_building_permit_transfer_delete_ChangeLog
on building_permit_transfer
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
          chg_log_tables = 'building_permit_transfer' and
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
 
declare @source_building_permit int
 
declare curRows cursor
for
     select source_building_permit from deleted
for read only
 
open curRows
fetch next from curRows into @source_building_permit
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1682, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9794, convert(varchar(24), @source_building_permit), @source_building_permit)
 
     fetch next from curRows into @source_building_permit
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Logs when a Building Permit is transferred to a different Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_transfer';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The new ID of the Building Permit that was transferred', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_transfer', @level2type = N'COLUMN', @level2name = N'destination_building_permit';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The original ID of the Building Permit that was transferred', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_transfer', @level2type = N'COLUMN', @level2name = N'source_building_permit';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The ID of the Property to which the new Building Permit was transferred', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_transfer', @level2type = N'COLUMN', @level2name = N'destination_property';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The ID of the Property with which the source Building Permit was associated', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'building_permit_transfer', @level2type = N'COLUMN', @level2name = N'source_property';


GO

