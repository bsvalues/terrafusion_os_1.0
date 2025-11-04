CREATE TABLE [dbo].[prop_building_permit_assoc] (
    [bldg_permit_id]   INT NOT NULL,
    [prop_id]          INT NOT NULL,
    [primary_property] BIT CONSTRAINT [CDF_prop_building_permit_assoc_primary_property] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_prop_building_permit_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [bldg_permit_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_bldg_permit_id]
    ON [dbo].[prop_building_permit_assoc]([bldg_permit_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_prop_building_permit_assoc_insert_ChangeLog
on prop_building_permit_assoc
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
 
declare @bldg_permit_id int
declare @prop_id int
 
declare curRows cursor
for
     select bldg_permit_id, prop_id from inserted
for read only
 
open curRows
fetch next from curRows into @bldg_permit_id, @prop_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Permit: ' + convert(varchar(12), @bldg_permit_id)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_building_permit_assoc' and
               chg_log_columns = 'bldg_permit_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 630, 531, null, convert(varchar(255), @bldg_permit_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'prop_building_permit_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 630, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     end
 
     fetch next from curRows into @bldg_permit_id, @prop_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_prop_building_permit_assoc_delete_ChangeLog
on prop_building_permit_assoc
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
          chg_log_tables = 'prop_building_permit_assoc' and
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
 
declare @bldg_permit_id int
declare @prop_id int
 
declare curRows cursor
for
     select bldg_permit_id, prop_id from deleted
for read only
 
open curRows
fetch next from curRows into @bldg_permit_id, @prop_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Permit: ' + convert(varchar(12), @bldg_permit_id)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 630, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 531, convert(varchar(24), @bldg_permit_id), @bldg_permit_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
 
     fetch next from curRows into @bldg_permit_id, @prop_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'States whether or not this Property / Building Permit association represents the Building Permit''s Primary Property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prop_building_permit_assoc', @level2type = N'COLUMN', @level2name = N'primary_property';


GO

