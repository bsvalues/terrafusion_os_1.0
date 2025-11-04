CREATE TABLE [dbo].[property_assoc] (
    [parent_prop_id]   INT         NOT NULL,
    [child_prop_id]    INT         NOT NULL,
    [prop_val_yr]      NUMERIC (4) NOT NULL,
    [sup_num]          INT         NOT NULL,
    [lOrder]           INT         NULL,
    [link_type_cd]     VARCHAR (5) NULL,
    [link_sub_type_cd] VARCHAR (5) NULL,
    CONSTRAINT [CPK_property_assoc] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [parent_prop_id] ASC, [child_prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_assoc_child_prop_id] FOREIGN KEY ([child_prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_property_assoc_link_sub_type_cd_link_type_cd] FOREIGN KEY ([link_sub_type_cd], [link_type_cd]) REFERENCES [dbo].[link_sub_type] ([link_sub_type_cd], [link_type_cd]),
    CONSTRAINT [CFK_property_assoc_parent_prop_id] FOREIGN KEY ([parent_prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO


create trigger tr_property_assoc_insert_ChangeLog
on property_assoc
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
 
declare @parent_prop_id int
declare @child_prop_id int
declare @prop_val_yr numeric(4,0)
declare @sup_num int
declare @link_type_cd varchar(5)
declare @link_sub_type_cd varchar(5)
 
declare curRows cursor
for
     select prop_val_yr, sup_num, parent_prop_id, child_prop_id, link_type_cd, link_sub_type_cd from inserted
for read only
 
open curRows
fetch next from curRows into @prop_val_yr, @sup_num, @parent_prop_id, @child_prop_id, @link_type_cd, @link_sub_type_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'LINKED - Link Type: ' + isnull(@link_type_cd,'') + '; Link Sub Type: ' + isnull(@link_sub_type_cd, '')
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_assoc' and
               chg_log_columns = 'parent_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 643, 3546, null, convert(varchar(255), @parent_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3546, convert(varchar(24), @parent_prop_id), @parent_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 751, convert(varchar(24), @child_prop_id), @child_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_assoc' and
               chg_log_columns = 'child_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 643, 751, null, convert(varchar(255), @child_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3546, convert(varchar(24), @parent_prop_id), @parent_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 751, convert(varchar(24), @child_prop_id), @child_prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     fetch next from curRows into @prop_val_yr, @sup_num, @parent_prop_id, @child_prop_id, @link_type_cd, @link_sub_type_cd
end
 
close curRows
deallocate curRows

GO


create trigger tr_property_assoc_insert_Order
on property_assoc
for insert
not for replication
as

	/* Note that we do not support multiple inserts */
	if ( @@rowcount <> 1 )
	begin
		return
	end

set nocount on

	declare @lParentPropID int
	declare @lChildPropID int
	declare @lNewOrder int
	declare @lPropValYr numeric(4,0)
	declare @lSupNum int

	select
		@lPropValYr = prop_val_yr,
		@lSupNum = sup_num,
		@lParentPropID = parent_prop_id,
		@lChildPropID = child_prop_id
	from inserted

	exec PropertyAssocGetNextOrder @lPropValYr, @lSupNum, @lParentPropID, @lNewOrder output, 0

	update property_assoc with(rowlock)
	set lOrder = @lNewOrder
	where
		prop_val_yr = @lPropValYr and
		sup_num = @lSupNum and
		parent_prop_id = @lParentPropID and
		child_prop_id = @lChildPropID

GO


create trigger tr_property_assoc_delete_ChangeLog
on property_assoc
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
          chg_log_tables = 'property_assoc' and
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
 
declare @parent_prop_id int
declare @child_prop_id int
declare @prop_val_yr numeric(4,0)
declare @sup_num int
declare @link_type_cd varchar(5)
declare @link_sub_type_cd varchar(5)
 
declare curRows cursor
for
     select prop_val_yr, sup_num, parent_prop_id, child_prop_id, link_type_cd, link_sub_type_cd from deleted
for read only
 
open curRows
fetch next from curRows into @prop_val_yr, @sup_num, @parent_prop_id, @child_prop_id, @link_type_cd, @link_sub_type_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'LINKED - Link Type: ' + isnull(@link_type_cd,'') + '; Link Sub Type: ' + isnull(@link_sub_type_cd, '')
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 643, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3546, convert(varchar(24), @parent_prop_id), @parent_prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 751, convert(varchar(24), @child_prop_id), @child_prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
 
     fetch next from curRows into @prop_val_yr, @sup_num, @parent_prop_id, @child_prop_id, @link_type_cd, @link_sub_type_cd
end
 
close curRows
deallocate curRows

GO

