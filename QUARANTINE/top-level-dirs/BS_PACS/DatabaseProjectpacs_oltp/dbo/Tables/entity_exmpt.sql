CREATE TABLE [dbo].[entity_exmpt] (
    [entity_id]                  INT              NOT NULL,
    [exmpt_type_cd]              VARCHAR (10)     NOT NULL,
    [exmpt_tax_yr]               NUMERIC (4)      NOT NULL,
    [entity_exmpt_desc]          VARCHAR (50)     NULL,
    [special_exmpt]              CHAR (1)         NULL,
    [local_option_pct]           NUMERIC (13, 10) NULL,
    [state_mandate_amt]          NUMERIC (14)     NULL,
    [local_option_min_amt]       NUMERIC (14)     NULL,
    [local_option_amt]           NUMERIC (14)     NULL,
    [apply_pct_ownrship]         CHAR (1)         NULL,
    [freeze_flag]                BIT              NOT NULL,
    [transfer_flag]              BIT              NOT NULL,
    [set_initial_freeze_date]    DATETIME         NULL,
    [set_initial_freeze_user_id] INT              NULL,
    CONSTRAINT [CPK_entity_exmpt] PRIMARY KEY CLUSTERED ([entity_id] ASC, [exmpt_tax_yr] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_entity_exmpt_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id]),
    CONSTRAINT [CFK_entity_exmpt_exmpt_type_cd] FOREIGN KEY ([exmpt_type_cd]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_exmpt_type_cd]
    ON [dbo].[entity_exmpt]([exmpt_type_cd] ASC) WITH (FILLFACTOR = 100);


GO



create trigger dbo.tr_entity_exmpt_update
	on	dbo.entity_exmpt
	for	update
	not for replication

as


if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on

declare @old_entity_id int
declare @new_entity_id int
declare @old_exmpt_tax_yr numeric(4,0)
declare @new_exmpt_tax_yr numeric(4,0)
declare @old_exmpt_type_cd  char(5)
declare @new_exmpt_type_cd  char(5)
declare @old_set_initial_freeze_date datetime
declare @new_set_initial_freeze_date datetime
declare	@old_freeze_flag bit
declare	@new_freeze_flag bit
declare @old_transfer_flag bit
declare @new_transfer_flag bit

declare curRows cursor
for
	select
		d.entity_id,
		i.entity_id,
		d.exmpt_tax_yr,
		i.exmpt_tax_yr,
		d.exmpt_type_cd,
		i.exmpt_type_cd,
		d.freeze_flag,
		i.freeze_flag,
		d.transfer_flag,
		i.transfer_flag,
		d.set_initial_freeze_date,
		i.set_initial_freeze_date
	from
		deleted as d
	join
		inserted as i
	on
		d.entity_id = i.entity_id
	and	d.exmpt_tax_yr = i.exmpt_tax_yr
	and	d.exmpt_type_cd = i.exmpt_type_cd
for read only

open curRows

fetch next from curRows
into
	@old_entity_id,
	@new_entity_id,
	@old_exmpt_tax_yr,
	@new_exmpt_tax_yr,
	@old_exmpt_type_cd,
	@new_exmpt_type_cd,
	@old_freeze_flag,
	@new_freeze_flag,
	@old_transfer_flag,
	@new_transfer_flag,
	@old_set_initial_freeze_date,
	@new_set_initial_freeze_date

while (@@fetch_status = 0)
begin
	if ((@old_transfer_flag = 1) and (@new_transfer_flag = 0))
	begin
		update
			dbo.property_freeze
		set
			transfer_dt = null,
			prev_tax_due = null,
			prev_tax_nofrz = null,
			transfer_pct = null,
			transfer_pct_override = null
		where
			entity_id = @new_entity_id
		and	exmpt_tax_yr = @new_exmpt_tax_yr
		and	owner_tax_yr = @new_exmpt_tax_yr
		and	exmpt_type_cd = @new_exmpt_type_cd
	end

	if ((@old_freeze_flag = 1) and (@new_freeze_flag = 0))
	begin
		delete
			dbo.property_freeze
		where
			entity_id = @new_entity_id
		and	exmpt_tax_yr = @new_exmpt_tax_yr
		and	owner_tax_yr = @new_exmpt_tax_yr
		and	exmpt_type_cd = @new_exmpt_type_cd

		if (@new_set_initial_freeze_date is not null)
		begin
			update
				dbo.entity_exmpt
			set
				set_initial_freeze_date = null,
				set_initial_freeze_user_id = null
			where
				entity_id = @new_entity_id
			and	exmpt_tax_yr = @new_exmpt_tax_yr
			and	exmpt_type_cd = @new_exmpt_type_cd
		end
	end

	fetch next from curRows
	into
		@old_entity_id,
		@new_entity_id,
		@old_exmpt_tax_yr,
		@new_exmpt_tax_yr,
		@old_exmpt_type_cd,
		@new_exmpt_type_cd,
		@old_freeze_flag,
		@new_freeze_flag,
		@old_transfer_flag,
		@new_transfer_flag,
		@old_set_initial_freeze_date,
		@new_set_initial_freeze_date
end

close curRows
deallocate curRows

set nocount off

GO


create trigger tr_entity_exmpt_insert_ChangeLog
on entity_exmpt
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
 
declare @entity_id int
declare @exmpt_type_cd char(5)
declare @exmpt_tax_yr numeric(4,0)
declare @entity_exmpt_desc varchar(50)
declare @special_exmpt char(1)
declare @local_option_pct numeric(13,10)
declare @state_mandate_amt numeric(14,0)
declare @local_option_min_amt numeric(14,0)
declare @local_option_amt numeric(14,0)
declare @apply_pct_ownrship char(1)
declare @freeze_flag bit
 
declare curRows cursor
for
     select entity_id, exmpt_type_cd, case exmpt_tax_yr when 0 then @tvar_lFutureYear else exmpt_tax_yr end, entity_exmpt_desc, special_exmpt, local_option_pct, state_mandate_amt, local_option_min_amt, local_option_amt, apply_pct_ownrship, freeze_flag from inserted
for read only
 
open curRows
fetch next from curRows into @entity_id, @exmpt_type_cd, @exmpt_tax_yr, @entity_exmpt_desc, @special_exmpt, @local_option_pct, @state_mandate_amt, @local_option_min_amt, @local_option_amt, @apply_pct_ownrship, @freeze_flag
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Entity: ' + ltrim(rtrim(entity.entity_cd)) + '; Year: ' + convert(varchar(4), @exmpt_tax_yr)
     from entity with(nolock)
     where entity_id = @entity_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'entity_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 1757, null, convert(varchar(255), @entity_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'exmpt_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 1830, null, convert(varchar(255), @exmpt_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'exmpt_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 1829, null, convert(varchar(255), @exmpt_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'entity_exmpt_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 1754, null, convert(varchar(255), @entity_exmpt_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'special_exmpt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 4903, null, convert(varchar(255), @special_exmpt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'local_option_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 2893, null, convert(varchar(255), @local_option_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'state_mandate_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 4935, null, convert(varchar(255), @state_mandate_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'local_option_min_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 2891, null, convert(varchar(255), @local_option_min_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'local_option_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 2888, null, convert(varchar(255), @local_option_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'apply_pct_ownrship' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 225, null, convert(varchar(255), @apply_pct_ownrship), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_exmpt' and
               chg_log_columns = 'freeze_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 247, 8827, null, convert(varchar(255), @freeze_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @entity_id, @exmpt_type_cd, @exmpt_tax_yr, @entity_exmpt_desc, @special_exmpt, @local_option_pct, @state_mandate_amt, @local_option_min_amt, @local_option_amt, @apply_pct_ownrship, @freeze_flag
end
 
close curRows
deallocate curRows

GO


create trigger tr_entity_exmpt_delete_insert_update_MemTable
on entity_exmpt
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
where szTableName = 'entity_exmpt'

GO


create trigger tr_entity_exmpt_update_ChangeLog
on entity_exmpt
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
 
declare @old_entity_id int
declare @new_entity_id int
declare @old_exmpt_type_cd char(5)
declare @new_exmpt_type_cd char(5)
declare @old_exmpt_tax_yr numeric(4,0)
declare @new_exmpt_tax_yr numeric(4,0)
declare @old_entity_exmpt_desc varchar(50)
declare @new_entity_exmpt_desc varchar(50)
declare @old_special_exmpt char(1)
declare @new_special_exmpt char(1)
declare @old_local_option_pct numeric(13,10)
declare @new_local_option_pct numeric(13,10)
declare @old_state_mandate_amt numeric(14,0)
declare @new_state_mandate_amt numeric(14,0)
declare @old_local_option_min_amt numeric(14,0)
declare @new_local_option_min_amt numeric(14,0)
declare @old_local_option_amt numeric(14,0)
declare @new_local_option_amt numeric(14,0)
declare @old_apply_pct_ownrship char(1)
declare @new_apply_pct_ownrship char(1)
declare @old_freeze_flag bit
declare @new_freeze_flag bit
 
declare curRows cursor
for
     select d.entity_id, d.exmpt_type_cd, case d.exmpt_tax_yr when 0 then @tvar_lFutureYear else d.exmpt_tax_yr end, d.entity_exmpt_desc, d.special_exmpt, d.local_option_pct, d.state_mandate_amt, d.local_option_min_amt, d.local_option_amt, d.apply_pct_ownrship, d.freeze_flag, i.entity_id, i.exmpt_type_cd, case i.exmpt_tax_yr when 0 then @tvar_lFutureYear else i.exmpt_tax_yr end, i.entity_exmpt_desc, i.special_exmpt, i.local_option_pct, i.state_mandate_amt, i.local_option_min_amt, i.local_option_amt, i.apply_pct_ownrship, i.freeze_flag
from deleted as d
join inserted as i on 
     d.entity_id = i.entity_id and
     d.exmpt_type_cd = i.exmpt_type_cd and
     d.exmpt_tax_yr = i.exmpt_tax_yr
for read only
 
open curRows
fetch next from curRows into @old_entity_id, @old_exmpt_type_cd, @old_exmpt_tax_yr, @old_entity_exmpt_desc, @old_special_exmpt, @old_local_option_pct, @old_state_mandate_amt, @old_local_option_min_amt, @old_local_option_amt, @old_apply_pct_ownrship, @old_freeze_flag, @new_entity_id, @new_exmpt_type_cd, @new_exmpt_tax_yr, @new_entity_exmpt_desc, @new_special_exmpt, @new_local_option_pct, @new_state_mandate_amt, @new_local_option_min_amt, @new_local_option_amt, @new_apply_pct_ownrship, @new_freeze_flag
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Entity: ' + ltrim(rtrim(entity.entity_cd)) + '; Exemption: ' + ltrim(rtrim(@new_exmpt_type_cd)) + '; Year: ' + convert(varchar(4), @new_exmpt_tax_yr)
     from entity with(nolock)
     where entity_id = @new_entity_id
 
     if (
          @old_entity_id <> @new_entity_id
          or
          ( @old_entity_id is null and @new_entity_id is not null ) 
          or
          ( @old_entity_id is not null and @new_entity_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'entity_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 1757, convert(varchar(255), @old_entity_id), convert(varchar(255), @new_entity_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_exmpt_type_cd <> @new_exmpt_type_cd
          or
          ( @old_exmpt_type_cd is null and @new_exmpt_type_cd is not null ) 
          or
          ( @old_exmpt_type_cd is not null and @new_exmpt_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'exmpt_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 1830, convert(varchar(255), @old_exmpt_type_cd), convert(varchar(255), @new_exmpt_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_exmpt_tax_yr <> @new_exmpt_tax_yr
          or
          ( @old_exmpt_tax_yr is null and @new_exmpt_tax_yr is not null ) 
          or
          ( @old_exmpt_tax_yr is not null and @new_exmpt_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'exmpt_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 1829, convert(varchar(255), @old_exmpt_tax_yr), convert(varchar(255), @new_exmpt_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_entity_exmpt_desc <> @new_entity_exmpt_desc
          or
          ( @old_entity_exmpt_desc is null and @new_entity_exmpt_desc is not null ) 
          or
          ( @old_entity_exmpt_desc is not null and @new_entity_exmpt_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'entity_exmpt_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 1754, convert(varchar(255), @old_entity_exmpt_desc), convert(varchar(255), @new_entity_exmpt_desc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_special_exmpt <> @new_special_exmpt
          or
          ( @old_special_exmpt is null and @new_special_exmpt is not null ) 
          or
          ( @old_special_exmpt is not null and @new_special_exmpt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'special_exmpt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 4903, convert(varchar(255), @old_special_exmpt), convert(varchar(255), @new_special_exmpt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_local_option_pct <> @new_local_option_pct
          or
          ( @old_local_option_pct is null and @new_local_option_pct is not null ) 
          or
          ( @old_local_option_pct is not null and @new_local_option_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'local_option_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 2893, convert(varchar(255), @old_local_option_pct), convert(varchar(255), @new_local_option_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_state_mandate_amt <> @new_state_mandate_amt
          or
          ( @old_state_mandate_amt is null and @new_state_mandate_amt is not null ) 
          or
          ( @old_state_mandate_amt is not null and @new_state_mandate_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'state_mandate_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 4935, convert(varchar(255), @old_state_mandate_amt), convert(varchar(255), @new_state_mandate_amt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_local_option_min_amt <> @new_local_option_min_amt
          or
          ( @old_local_option_min_amt is null and @new_local_option_min_amt is not null ) 
          or
          ( @old_local_option_min_amt is not null and @new_local_option_min_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'local_option_min_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 2891, convert(varchar(255), @old_local_option_min_amt), convert(varchar(255), @new_local_option_min_amt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_local_option_amt <> @new_local_option_amt
          or
          ( @old_local_option_amt is null and @new_local_option_amt is not null ) 
          or
          ( @old_local_option_amt is not null and @new_local_option_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'local_option_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 2888, convert(varchar(255), @old_local_option_amt), convert(varchar(255), @new_local_option_amt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_apply_pct_ownrship <> @new_apply_pct_ownrship
          or
          ( @old_apply_pct_ownrship is null and @new_apply_pct_ownrship is not null ) 
          or
          ( @old_apply_pct_ownrship is not null and @new_apply_pct_ownrship is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'apply_pct_ownrship' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 225, convert(varchar(255), @old_apply_pct_ownrship), convert(varchar(255), @new_apply_pct_ownrship), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_freeze_flag <> @new_freeze_flag
          or
          ( @old_freeze_flag is null and @new_freeze_flag is not null ) 
          or
          ( @old_freeze_flag is not null and @new_freeze_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_exmpt' and
                    chg_log_columns = 'freeze_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 247, 8827, convert(varchar(255), @old_freeze_flag), convert(varchar(255), @new_freeze_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_entity_id, @old_exmpt_type_cd, @old_exmpt_tax_yr, @old_entity_exmpt_desc, @old_special_exmpt, @old_local_option_pct, @old_state_mandate_amt, @old_local_option_min_amt, @old_local_option_amt, @old_apply_pct_ownrship, @old_freeze_flag, @new_entity_id, @new_exmpt_type_cd, @new_exmpt_tax_yr, @new_entity_exmpt_desc, @new_special_exmpt, @new_local_option_pct, @new_state_mandate_amt, @new_local_option_min_amt, @new_local_option_amt, @new_apply_pct_ownrship, @new_freeze_flag
end
 
close curRows
deallocate curRows

GO


create trigger tr_entity_exmpt_delete_ChangeLog
on entity_exmpt
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
          chg_log_tables = 'entity_exmpt' and
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
 
declare @entity_id int
declare @exmpt_type_cd char(5)
declare @exmpt_tax_yr numeric(4,0)
 
declare curRows cursor
for
     select entity_id, exmpt_type_cd, case exmpt_tax_yr when 0 then @tvar_lFutureYear else exmpt_tax_yr end from deleted
for read only
 
open curRows
fetch next from curRows into @entity_id, @exmpt_type_cd, @exmpt_tax_yr
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID =  + 'Year: ' + convert(varchar(4), @exmpt_tax_yr) + '; Entity: ' + ltrim(rtrim(entity.entity_cd)) + '; Exemption: ' + ltrim(rtrim(@exmpt_type_cd))
     from entity with(nolock)
     where entity_id = @entity_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 247, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @entity_id, @exmpt_type_cd, @exmpt_tax_yr
end
 
close curRows
deallocate curRows

GO

