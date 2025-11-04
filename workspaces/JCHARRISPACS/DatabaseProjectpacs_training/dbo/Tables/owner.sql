CREATE TABLE [dbo].[owner] (
    [owner_id]             INT              NOT NULL,
    [owner_tax_yr]         NUMERIC (4)      NOT NULL,
    [prop_id]              INT              NOT NULL,
    [updt_dt]              DATETIME         NOT NULL,
    [pct_ownership]        NUMERIC (13, 10) NULL,
    [owner_cmnt]           VARCHAR (255)    NULL,
    [over_65_defer]        CHAR (1)         NULL,
    [over_65_date]         DATETIME         NULL,
    [ag_app_filed]         CHAR (1)         NULL,
    [apply_pct_exemptions] CHAR (1)         NULL,
    [sup_num]              INT              NOT NULL,
    [type_of_int]          CHAR (5)         NULL,
    [hs_prop]              CHAR (1)         NULL,
    [birth_dt]             DATETIME         NULL,
    [roll_exemption]       VARCHAR (500)    NULL,
    [roll_state_code]      VARCHAR (500)    NULL,
    [roll_entity]          VARCHAR (500)    NULL,
    [pct_imprv_hs]         NUMERIC (13, 10) NULL,
    [pct_imprv_nhs]        NUMERIC (13, 10) NULL,
    [pct_land_hs]          NUMERIC (13, 10) NULL,
    [pct_land_nhs]         NUMERIC (13, 10) NULL,
    [pct_ag_use]           NUMERIC (13, 10) NULL,
    [pct_ag_mkt]           NUMERIC (13, 10) NULL,
    [pct_tim_use]          NUMERIC (13, 10) NULL,
    [pct_tim_mkt]          NUMERIC (13, 10) NULL,
    [pct_pers_prop]        NUMERIC (13, 10) NULL,
    [udi_child_prop_id]    INT              NULL,
    [percent_type]         VARCHAR (5)      NULL,
    [pct_ag_use_hs]        NUMERIC (13, 10) NULL,
    [pct_ag_mkt_hs]        NUMERIC (13, 10) NULL,
    [pct_tim_use_hs]       NUMERIC (13, 10) NULL,
    [pct_tim_mkt_hs]       NUMERIC (13, 10) NULL,
    [linked_cd]            VARCHAR (10)     NULL,
    CONSTRAINT [CPK_owner] PRIMARY KEY CLUSTERED ([owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_owner_owner_id] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_owner_owner_link_type_code] FOREIGN KEY ([linked_cd]) REFERENCES [dbo].[owner_link_type_code] ([linked_cd]),
    CONSTRAINT [CFK_owner_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_owner_id]
    ON [dbo].[owner]([owner_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[owner]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_owner_parent_child_sync
on owner
for update
not for replication

as

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'owner'
if ( @lTriggerEnable = 0 )
begin
	return
end

set nocount on


declare @owner_id		int
declare @owner_tax_yr		numeric(4,0)
declare @prop_id		int
declare @updt_dt		datetime
declare @pct_ownership		numeric(13,10)
declare @owner_cmnt		varchar(255)
declare @over_65_defer		char(1)
declare @over_65_date		datetime
declare @ag_app_filed		char(1)
declare @apply_pct_exemptions	char(1)
declare @sup_num		int
declare @type_of_int		char(5)
declare @hs_prop		char(1)
declare @birth_dt		datetime
declare @roll_exemption		varchar(500)
declare @roll_state_code	varchar(500)
declare @roll_entity		varchar(500)
declare @pct_imprv_hs		numeric(13,10)
declare @pct_imprv_nhs		numeric(13,10)
declare @pct_land_hs		numeric(13,10)
declare @pct_land_nhs		numeric(13,10)
declare @pct_ag_use		numeric(13,10)
declare @pct_ag_mkt		numeric(13,10)
declare @pct_tim_use		numeric(13,10)
declare @pct_tim_mkt		numeric(13,10)
declare @pct_pers_prop		numeric(13,10)
declare @udi_child_prop_id	int
declare @percent_type		varchar(5)

DECLARE owner_parent_child_sync_cursor SCROLL CURSOR
FOR 
	SELECT 	owner_id, 
		owner_tax_yr, 
		prop_id, 
		updt_dt, 
		pct_ownership, 
		owner_cmnt, 
		over_65_defer, 
		over_65_date, 
		ag_app_filed, 
		apply_pct_exemptions, 
		sup_num, 
		type_of_int, 
		hs_prop, 
		birth_dt, 
		roll_exemption, 
		roll_state_code, 
		roll_entity, 
		pct_imprv_hs, 
		pct_imprv_nhs, 
		pct_land_hs, 
		pct_land_nhs, 
		pct_ag_use, 
		pct_ag_mkt, 
		pct_tim_use, 
		pct_tim_mkt, 
		pct_pers_prop, 
		udi_child_prop_id, 
		percent_type
	FROM    inserted

OPEN owner_parent_child_sync_cursor
FETCH NEXT FROM owner_parent_child_sync_cursor INTO
	@owner_id, 
	@owner_tax_yr, 
	@prop_id, 
	@updt_dt, 
	@pct_ownership, 
	@owner_cmnt, 
	@over_65_defer, 
	@over_65_date, 
	@ag_app_filed, 
	@apply_pct_exemptions, 
	@sup_num, 
	@type_of_int, 
	@hs_prop, 
	@birth_dt, 
	@roll_exemption, 
	@roll_state_code, 
	@roll_entity, 
	@pct_imprv_hs, 
	@pct_imprv_nhs, 
	@pct_land_hs, 
	@pct_land_nhs, 
	@pct_ag_use, 
	@pct_ag_mkt, 
	@pct_tim_use, 
	@pct_tim_mkt, 
	@pct_pers_prop, 
	@udi_child_prop_id, 
	@percent_type

WHILE (@@FETCH_STATUS = 0)
BEGIN
	IF ((@udi_child_prop_id IS NOT NULL) AND
	    (EXISTS (SELECT 	TOP 1 prop_id
		     FROM	property_val
		     WHERE  	prop_id = @prop_id
				AND sup_num = @sup_num
				AND prop_val_yr = @owner_tax_YR
				AND udi_parent = 'T')
	    )
	   )
	BEGIN
		UPDATE 	owner
		SET 	owner.updt_dt = @updt_dt,
			owner.pct_ownership = @pct_ownership,
			owner.owner_cmnt = @owner_cmnt,
			owner.over_65_defer = @over_65_defer,
			owner.over_65_date = @over_65_date,
			owner.ag_app_filed = @ag_app_filed,
			owner.apply_pct_exemptions = @apply_pct_exemptions,
			owner.type_of_int = @type_of_int,
			owner.hs_prop = @hs_prop,
			owner.birth_dt = @birth_dt,
			owner.roll_exemption = @roll_exemption,
			owner.roll_state_code = @roll_state_code,
			owner.roll_entity = @roll_entity,
			owner.pct_imprv_hs = @pct_imprv_hs,
			owner.pct_imprv_nhs = @pct_imprv_nhs,
			owner.pct_land_hs = @pct_land_hs,
			owner.pct_land_nhs = @pct_land_nhs,
			owner.pct_ag_use = @pct_ag_use,
			owner.pct_ag_mkt = @pct_ag_mkt,
			owner.pct_tim_use = @pct_tim_use,
			owner.pct_tim_mkt = @pct_tim_mkt,
			owner.pct_pers_prop = @pct_pers_prop,
			owner.percent_type = @percent_type
		WHERE	owner.prop_id = @udi_child_prop_id AND
			owner.owner_tax_yr = @owner_tax_yr AND
			owner.sup_num = @sup_num	
	END

	FETCH NEXT FROM owner_parent_child_sync_cursor INTO
		@owner_id, 
		@owner_tax_yr, 
		@prop_id, 
		@updt_dt, 
		@pct_ownership, 
		@owner_cmnt, 
		@over_65_defer, 
		@over_65_date, 
		@ag_app_filed, 
		@apply_pct_exemptions, 
		@sup_num, 
		@type_of_int, 
		@hs_prop, 
		@birth_dt, 
		@roll_exemption, 
		@roll_state_code, 
		@roll_entity, 
		@pct_imprv_hs, 
		@pct_imprv_nhs, 
		@pct_land_hs, 
		@pct_land_nhs, 
		@pct_ag_use, 
		@pct_ag_mkt, 
		@pct_tim_use, 
		@pct_tim_mkt, 
		@pct_pers_prop, 
		@udi_child_prop_id, 
		@percent_type
END

CLOSE owner_parent_child_sync_cursor
DEALLOCATE owner_parent_child_sync_cursor

set nocount off

GO


create trigger tr_owner_insert
on owner
for insert
not for replication

as

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'owner'
if ( @lTriggerEnable = 0 )
begin
	return
end

set nocount on

	update property_val set owner_update_dt = GetDate()
	from inserted
	where inserted.prop_id = property_val.prop_id
	and   inserted.sup_num = property_val.sup_num
	and   inserted.owner_tax_yr = property_val.prop_val_yr 


	update property set col_owner_id = inserted.owner_id,col_owner_update_dt=GetDate(),
		property.col_owner_override = 0
	from inserted
	where property.prop_id = inserted.prop_id
	and   inserted.owner_tax_yr in (select max(owner_tax_yr)
					from prop_supp_assoc
					where prop_id = inserted.prop_id
					)
	and   inserted.sup_num in (select max(sup_num)
				   from prop_supp_assoc
				   where prop_id = inserted.prop_id
				   and   owner_tax_yr = inserted.owner_tax_yr)
	and 	isnull(property.col_owner_id,0) <> inserted.owner_id 

	update autopay_enrollment set ownership_transfer_incomplete = 1
	from inserted
	where autopay_enrollment.prop_id = inserted.prop_id 
	and autopay_enrollment.acct_id <> inserted.owner_id -- only update if owner is changing (does not change on a supplement)
	and autopay_enrollment.acct_id in ( select owner_id from owner ) -- only update if the owner exists (and is also therefore also not an agent)

set nocount off

GO



create trigger tr_owner_delete_ChangeLog
on owner
for delete
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'owner'
if ( @lTriggerEnable = 0 )
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
          chg_log_tables = 'owner' and
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
 
declare @owner_id int
declare @owner_tax_yr numeric(4,0)
declare @prop_id int
declare @sup_num int
 
declare curRows cursor
for
     select owner_id, case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, prop_id, sup_num from deleted
for read only
 
open curRows
fetch next from curRows into @owner_id, @owner_tax_yr, @prop_id, @sup_num
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @owner_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 546, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
 
     fetch next from curRows into @owner_id, @owner_tax_yr, @prop_id, @sup_num
end
 
close curRows
deallocate curRows

GO



create trigger tr_owner_insert_ChangeLog
on owner
for insert
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'owner'
if ( @lTriggerEnable = 0 )
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
 
declare @owner_id int
declare @owner_tax_yr numeric(4,0)
declare @prop_id int
declare @updt_dt datetime
declare @pct_ownership numeric(13,10)
declare @owner_cmnt varchar(255)
declare @over_65_defer char(1)
declare @over_65_date datetime
declare @ag_app_filed char(1)
declare @apply_pct_exemptions char(1)
declare @sup_num int
declare @type_of_int char(5)
declare @hs_prop char(1)
declare @birth_dt datetime
declare @roll_exemption varchar(500)
declare @roll_state_code varchar(500)
declare @roll_entity varchar(500)
declare @pct_imprv_hs numeric(13,10)
declare @pct_imprv_nhs numeric(13,10)
declare @pct_land_hs numeric(13,10)
declare @pct_land_nhs numeric(13,10)
declare @pct_ag_use numeric(13,10)
declare @pct_ag_mkt numeric(13,10)
declare @pct_tim_use numeric(13,10)
declare @pct_tim_mkt numeric(13,10)
declare @pct_pers_prop numeric(13,10)
declare @udi_child_prop_id int
declare @percent_type varchar(5)
 
declare curRows cursor
for
     select owner_id, case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, prop_id, updt_dt, pct_ownership, owner_cmnt, over_65_defer, over_65_date, ag_app_filed, apply_pct_exemptions, sup_num, type_of_int, hs_prop, birth_dt, roll_exemption, roll_state_code, roll_entity, pct_imprv_hs, pct_imprv_nhs, pct_land_hs, pct_land_nhs, pct_ag_use, pct_ag_mkt, pct_tim_use, pct_tim_mkt, pct_pers_prop, udi_child_prop_id, percent_type from inserted
for read only
 
open curRows
fetch next from curRows into @owner_id, @owner_tax_yr, @prop_id, @updt_dt, @pct_ownership, @owner_cmnt, @over_65_defer, @over_65_date, @ag_app_filed, @apply_pct_exemptions, @sup_num, @type_of_int, @hs_prop, @birth_dt, @roll_exemption, @roll_state_code, @roll_entity, @pct_imprv_hs, @pct_imprv_nhs, @pct_land_hs, @pct_land_nhs, @pct_ag_use, @pct_ag_mkt, @pct_tim_use, @pct_tim_mkt, @pct_pers_prop, @udi_child_prop_id, @percent_type
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @owner_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 3493, null, convert(varchar(255), @owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'owner_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 3505, null, convert(varchar(255), @owner_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'updt_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5423, null, convert(varchar(255), @updt_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_ownership' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 3608, null, convert(varchar(255), @pct_ownership), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'owner_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 3491, null, convert(varchar(255), @owner_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'over_65_defer' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 3443, null, convert(varchar(255), @over_65_defer), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'over_65_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 3442, null, convert(varchar(255), @over_65_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'ag_app_filed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 115, null, convert(varchar(255), @ag_app_filed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'apply_pct_exemptions' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 223, null, convert(varchar(255), @apply_pct_exemptions), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'type_of_int' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5401, null, convert(varchar(255), @type_of_int), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'hs_prop' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 2087, null, convert(varchar(255), @hs_prop), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'birth_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 518, null, convert(varchar(255), @birth_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'roll_exemption' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 4425, null, convert(varchar(255), @roll_exemption), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'roll_state_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 4426, null, convert(varchar(255), @roll_state_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'roll_entity' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 4424, null, convert(varchar(255), @roll_entity), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_imprv_hs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5926, null, convert(varchar(255), @pct_imprv_hs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_imprv_nhs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5927, null, convert(varchar(255), @pct_imprv_nhs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_land_hs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5928, null, convert(varchar(255), @pct_land_hs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_land_nhs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5929, null, convert(varchar(255), @pct_land_nhs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_ag_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5925, null, convert(varchar(255), @pct_ag_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_ag_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5924, null, convert(varchar(255), @pct_ag_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_tim_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5931, null, convert(varchar(255), @pct_tim_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_tim_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 5930, null, convert(varchar(255), @pct_tim_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'pct_pers_prop' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 6108, null, convert(varchar(255), @pct_pers_prop), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'udi_child_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 6112, null, convert(varchar(255), @udi_child_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'owner' and
               chg_log_columns = 'percent_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 546, 6109, null, convert(varchar(255), @percent_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     fetch next from curRows into @owner_id, @owner_tax_yr, @prop_id, @updt_dt, @pct_ownership, @owner_cmnt, @over_65_defer, @over_65_date, @ag_app_filed, @apply_pct_exemptions, @sup_num, @type_of_int, @hs_prop, @birth_dt, @roll_exemption, @roll_state_code, @roll_entity, @pct_imprv_hs, @pct_imprv_nhs, @pct_land_hs, @pct_land_nhs, @pct_ag_use, @pct_ag_mkt, @pct_tim_use, @pct_tim_mkt, @pct_pers_prop, @udi_child_prop_id, @percent_type
end
 
close curRows
deallocate curRows

GO




create trigger tr_owner_update
on owner
for update
not for replication

as

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'owner'
if ( @lTriggerEnable = 0 )
begin
	return
end

set nocount on

	IF UPDATE(prop_id) OR UPDATE(owner_id)
	begin
		update property_val set owner_update_dt = GetDate()
		from inserted
		where inserted.prop_id = property_val.prop_id
		and   inserted.sup_num = property_val.sup_num
		and   inserted.owner_tax_yr = property_val.prop_val_yr 

	update property set col_owner_id = inserted.owner_id, col_owner_update_dt=GetDate(),
		property.col_owner_override = 0, col_autopay_id = inserted.owner_id
	from inserted
	where property.prop_id = inserted.prop_id
	and   inserted.owner_tax_yr in (select max(owner_tax_yr)
					from prop_supp_assoc
					where prop_id = inserted.prop_id
					)
	and   inserted.sup_num in (select max(sup_num)
				   from prop_supp_assoc
				   where prop_id = inserted.prop_id
				   and   owner_tax_yr = inserted.owner_tax_yr)

	END



set nocount off

GO



create trigger tr_owner_update_ChangeLog
on owner
for update
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'owner'
if ( @lTriggerEnable = 0 )
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
 
declare @old_owner_id int
declare @new_owner_id int
declare @old_owner_tax_yr numeric(4,0)
declare @new_owner_tax_yr numeric(4,0)
declare @old_prop_id int
declare @new_prop_id int
declare @old_updt_dt datetime
declare @new_updt_dt datetime
declare @old_pct_ownership numeric(13,10)
declare @new_pct_ownership numeric(13,10)
declare @old_owner_cmnt varchar(255)
declare @new_owner_cmnt varchar(255)
declare @old_over_65_defer char(1)
declare @new_over_65_defer char(1)
declare @old_over_65_date datetime
declare @new_over_65_date datetime
declare @old_ag_app_filed char(1)
declare @new_ag_app_filed char(1)
declare @old_apply_pct_exemptions char(1)
declare @new_apply_pct_exemptions char(1)
declare @old_sup_num int
declare @new_sup_num int
declare @old_type_of_int char(5)
declare @new_type_of_int char(5)
declare @old_hs_prop char(1)
declare @new_hs_prop char(1)
declare @old_birth_dt datetime
declare @new_birth_dt datetime
declare @old_roll_exemption varchar(500)
declare @new_roll_exemption varchar(500)
declare @old_roll_state_code varchar(500)
declare @new_roll_state_code varchar(500)
declare @old_roll_entity varchar(500)
declare @new_roll_entity varchar(500)
declare @old_pct_imprv_hs numeric(13,10)
declare @new_pct_imprv_hs numeric(13,10)
declare @old_pct_imprv_nhs numeric(13,10)
declare @new_pct_imprv_nhs numeric(13,10)
declare @old_pct_land_hs numeric(13,10)
declare @new_pct_land_hs numeric(13,10)
declare @old_pct_land_nhs numeric(13,10)
declare @new_pct_land_nhs numeric(13,10)
declare @old_pct_ag_use numeric(13,10)
declare @new_pct_ag_use numeric(13,10)
declare @old_pct_ag_mkt numeric(13,10)
declare @new_pct_ag_mkt numeric(13,10)
declare @old_pct_tim_use numeric(13,10)
declare @new_pct_tim_use numeric(13,10)
declare @old_pct_tim_mkt numeric(13,10)
declare @new_pct_tim_mkt numeric(13,10)
declare @old_pct_pers_prop numeric(13,10)
declare @new_pct_pers_prop numeric(13,10)
declare @old_udi_child_prop_id int
declare @new_udi_child_prop_id int
declare @old_percent_type varchar(5)
declare @new_percent_type varchar(5)
 
declare curRows cursor
for
     select d.owner_id, case d.owner_tax_yr when 0 then @tvar_lFutureYear else d.owner_tax_yr end, d.prop_id, d.updt_dt, d.pct_ownership, d.owner_cmnt, d.over_65_defer, d.over_65_date, d.ag_app_filed, d.apply_pct_exemptions, d.sup_num, d.type_of_int, d.hs_prop, d.birth_dt, d.roll_exemption, d.roll_state_code, d.roll_entity, d.pct_imprv_hs, d.pct_imprv_nhs, d.pct_land_hs, d.pct_land_nhs, d.pct_ag_use, d.pct_ag_mkt, d.pct_tim_use, d.pct_tim_mkt, d.pct_pers_prop, d.udi_child_prop_id, d.percent_type, i.owner_id, case i.owner_tax_yr when 0 then @tvar_lFutureYear else i.owner_tax_yr end, i.prop_id, i.updt_dt, i.pct_ownership, i.owner_cmnt, i.over_65_defer, i.over_65_date, i.ag_app_filed, i.apply_pct_exemptions, i.sup_num, i.type_of_int, i.hs_prop, i.birth_dt, i.roll_exemption, i.roll_state_code, i.roll_entity, i.pct_imprv_hs, i.pct_imprv_nhs, i.pct_land_hs, i.pct_land_nhs, i.pct_ag_use, i.pct_ag_mkt, i.pct_tim_use, i.pct_tim_mkt, i.pct_pers_prop, i.udi_child_prop_id, i.percent_type
from deleted as d
join inserted as i on 
     d.owner_id = i.owner_id and
     d.owner_tax_yr = i.owner_tax_yr and
     d.prop_id = i.prop_id and
     d.sup_num = i.sup_num
for read only
 
open curRows
fetch next from curRows into @old_owner_id, @old_owner_tax_yr, @old_prop_id, @old_updt_dt, @old_pct_ownership, @old_owner_cmnt, @old_over_65_defer, @old_over_65_date, @old_ag_app_filed, @old_apply_pct_exemptions, @old_sup_num, @old_type_of_int, @old_hs_prop, @old_birth_dt, @old_roll_exemption, @old_roll_state_code, @old_roll_entity, @old_pct_imprv_hs, @old_pct_imprv_nhs, @old_pct_land_hs, @old_pct_land_nhs, @old_pct_ag_use, @old_pct_ag_mkt, @old_pct_tim_use, @old_pct_tim_mkt, @old_pct_pers_prop, @old_udi_child_prop_id, @old_percent_type, @new_owner_id, @new_owner_tax_yr, @new_prop_id, @new_updt_dt, @new_pct_ownership, @new_owner_cmnt, @new_over_65_defer, @new_over_65_date, @new_ag_app_filed, @new_apply_pct_exemptions, @new_sup_num, @new_type_of_int, @new_hs_prop, @new_birth_dt, @new_roll_exemption, @new_roll_state_code, @new_roll_entity, @new_pct_imprv_hs, @new_pct_imprv_nhs, @new_pct_land_hs, @new_pct_land_nhs, @new_pct_ag_use, @new_pct_ag_mkt, @new_pct_tim_use, @new_pct_tim_mkt, @new_pct_pers_prop, @new_udi_child_prop_id, @new_percent_type
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @new_owner_id
 
     if (
          @old_owner_id <> @new_owner_id
          or
          ( @old_owner_id is null and @new_owner_id is not null ) 
          or
          ( @old_owner_id is not null and @new_owner_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 3493, convert(varchar(255), @old_owner_id), convert(varchar(255), @new_owner_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_tax_yr <> @new_owner_tax_yr
          or
          ( @old_owner_tax_yr is null and @new_owner_tax_yr is not null ) 
          or
          ( @old_owner_tax_yr is not null and @new_owner_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'owner_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 3505, convert(varchar(255), @old_owner_tax_yr), convert(varchar(255), @new_owner_tax_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_updt_dt <> @new_updt_dt
          or
          ( @old_updt_dt is null and @new_updt_dt is not null ) 
          or
          ( @old_updt_dt is not null and @new_updt_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'updt_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5423, convert(varchar(255), @old_updt_dt), convert(varchar(255), @new_updt_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_ownership <> @new_pct_ownership
          or
          ( @old_pct_ownership is null and @new_pct_ownership is not null ) 
          or
          ( @old_pct_ownership is not null and @new_pct_ownership is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_ownership' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 3608, convert(varchar(255), @old_pct_ownership), convert(varchar(255), @new_pct_ownership) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_owner_cmnt <> @new_owner_cmnt
          or
          ( @old_owner_cmnt is null and @new_owner_cmnt is not null ) 
          or
          ( @old_owner_cmnt is not null and @new_owner_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'owner_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 3491, convert(varchar(255), @old_owner_cmnt), convert(varchar(255), @new_owner_cmnt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_over_65_defer <> @new_over_65_defer
          or
          ( @old_over_65_defer is null and @new_over_65_defer is not null ) 
          or
          ( @old_over_65_defer is not null and @new_over_65_defer is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'over_65_defer' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 3443, convert(varchar(255), @old_over_65_defer), convert(varchar(255), @new_over_65_defer) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_over_65_date <> @new_over_65_date
          or
          ( @old_over_65_date is null and @new_over_65_date is not null ) 
          or
          ( @old_over_65_date is not null and @new_over_65_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'over_65_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 3442, convert(varchar(255), @old_over_65_date), convert(varchar(255), @new_over_65_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_ag_app_filed <> @new_ag_app_filed
          or
          ( @old_ag_app_filed is null and @new_ag_app_filed is not null ) 
          or
          ( @old_ag_app_filed is not null and @new_ag_app_filed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'ag_app_filed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 115, convert(varchar(255), @old_ag_app_filed), convert(varchar(255), @new_ag_app_filed) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_apply_pct_exemptions <> @new_apply_pct_exemptions
          or
          ( @old_apply_pct_exemptions is null and @new_apply_pct_exemptions is not null ) 
          or
          ( @old_apply_pct_exemptions is not null and @new_apply_pct_exemptions is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'apply_pct_exemptions' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 223, convert(varchar(255), @old_apply_pct_exemptions), convert(varchar(255), @new_apply_pct_exemptions) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
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
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'type_of_int' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5401, convert(varchar(255), @old_type_of_int), convert(varchar(255), @new_type_of_int) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_hs_prop <> @new_hs_prop
          or
          ( @old_hs_prop is null and @new_hs_prop is not null ) 
          or
          ( @old_hs_prop is not null and @new_hs_prop is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'hs_prop' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 2087, convert(varchar(255), @old_hs_prop), convert(varchar(255), @new_hs_prop) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_birth_dt <> @new_birth_dt
          or
          ( @old_birth_dt is null and @new_birth_dt is not null ) 
          or
          ( @old_birth_dt is not null and @new_birth_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'birth_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 518, convert(varchar(255), @old_birth_dt), convert(varchar(255), @new_birth_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_roll_exemption <> @new_roll_exemption
          or
          ( @old_roll_exemption is null and @new_roll_exemption is not null ) 
          or
          ( @old_roll_exemption is not null and @new_roll_exemption is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'roll_exemption' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 4425, convert(varchar(255), @old_roll_exemption), convert(varchar(255), @new_roll_exemption) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_roll_state_code <> @new_roll_state_code
          or
          ( @old_roll_state_code is null and @new_roll_state_code is not null ) 
          or
          ( @old_roll_state_code is not null and @new_roll_state_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'roll_state_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 4426, convert(varchar(255), @old_roll_state_code), convert(varchar(255), @new_roll_state_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_roll_entity <> @new_roll_entity
          or
          ( @old_roll_entity is null and @new_roll_entity is not null ) 
          or
          ( @old_roll_entity is not null and @new_roll_entity is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'roll_entity' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 4424, convert(varchar(255), @old_roll_entity), convert(varchar(255), @new_roll_entity) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_imprv_hs <> @new_pct_imprv_hs
          or
          ( @old_pct_imprv_hs is null and @new_pct_imprv_hs is not null ) 
          or
          ( @old_pct_imprv_hs is not null and @new_pct_imprv_hs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_imprv_hs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5926, convert(varchar(255), @old_pct_imprv_hs), convert(varchar(255), @new_pct_imprv_hs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_imprv_nhs <> @new_pct_imprv_nhs
          or
          ( @old_pct_imprv_nhs is null and @new_pct_imprv_nhs is not null ) 
          or
          ( @old_pct_imprv_nhs is not null and @new_pct_imprv_nhs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_imprv_nhs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5927, convert(varchar(255), @old_pct_imprv_nhs), convert(varchar(255), @new_pct_imprv_nhs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_land_hs <> @new_pct_land_hs
          or
          ( @old_pct_land_hs is null and @new_pct_land_hs is not null ) 
          or
          ( @old_pct_land_hs is not null and @new_pct_land_hs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_land_hs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5928, convert(varchar(255), @old_pct_land_hs), convert(varchar(255), @new_pct_land_hs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_land_nhs <> @new_pct_land_nhs
          or
          ( @old_pct_land_nhs is null and @new_pct_land_nhs is not null ) 
          or
          ( @old_pct_land_nhs is not null and @new_pct_land_nhs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_land_nhs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5929, convert(varchar(255), @old_pct_land_nhs), convert(varchar(255), @new_pct_land_nhs) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_ag_use <> @new_pct_ag_use
          or
          ( @old_pct_ag_use is null and @new_pct_ag_use is not null ) 
          or
          ( @old_pct_ag_use is not null and @new_pct_ag_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_ag_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5925, convert(varchar(255), @old_pct_ag_use), convert(varchar(255), @new_pct_ag_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_ag_mkt <> @new_pct_ag_mkt
          or
          ( @old_pct_ag_mkt is null and @new_pct_ag_mkt is not null ) 
          or
          ( @old_pct_ag_mkt is not null and @new_pct_ag_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_ag_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5924, convert(varchar(255), @old_pct_ag_mkt), convert(varchar(255), @new_pct_ag_mkt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_tim_use <> @new_pct_tim_use
          or
          ( @old_pct_tim_use is null and @new_pct_tim_use is not null ) 
          or
          ( @old_pct_tim_use is not null and @new_pct_tim_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_tim_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5931, convert(varchar(255), @old_pct_tim_use), convert(varchar(255), @new_pct_tim_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_tim_mkt <> @new_pct_tim_mkt
          or
          ( @old_pct_tim_mkt is null and @new_pct_tim_mkt is not null ) 
          or
          ( @old_pct_tim_mkt is not null and @new_pct_tim_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_tim_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 5930, convert(varchar(255), @old_pct_tim_mkt), convert(varchar(255), @new_pct_tim_mkt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_pct_pers_prop <> @new_pct_pers_prop
          or
          ( @old_pct_pers_prop is null and @new_pct_pers_prop is not null ) 
          or
          ( @old_pct_pers_prop is not null and @new_pct_pers_prop is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'pct_pers_prop' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 6108, convert(varchar(255), @old_pct_pers_prop), convert(varchar(255), @new_pct_pers_prop) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_udi_child_prop_id <> @new_udi_child_prop_id
          or
          ( @old_udi_child_prop_id is null and @new_udi_child_prop_id is not null ) 
          or
          ( @old_udi_child_prop_id is not null and @new_udi_child_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'udi_child_prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 6112, convert(varchar(255), @old_udi_child_prop_id), convert(varchar(255), @new_udi_child_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_percent_type <> @new_percent_type
          or
          ( @old_percent_type is null and @new_percent_type is not null ) 
          or
          ( @old_percent_type is not null and @new_percent_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'owner' and
                    chg_log_columns = 'percent_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 546, 6109, convert(varchar(255), @old_percent_type), convert(varchar(255), @new_percent_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     fetch next from curRows into @old_owner_id, @old_owner_tax_yr, @old_prop_id, @old_updt_dt, @old_pct_ownership, @old_owner_cmnt, @old_over_65_defer, @old_over_65_date, @old_ag_app_filed, @old_apply_pct_exemptions, @old_sup_num, @old_type_of_int, @old_hs_prop, @old_birth_dt, @old_roll_exemption, @old_roll_state_code, @old_roll_entity, @old_pct_imprv_hs, @old_pct_imprv_nhs, @old_pct_land_hs, @old_pct_land_nhs, @old_pct_ag_use, @old_pct_ag_mkt, @old_pct_tim_use, @old_pct_tim_mkt, @old_pct_pers_prop, @old_udi_child_prop_id, @old_percent_type, @new_owner_id, @new_owner_tax_yr, @new_prop_id, @new_updt_dt, @new_pct_ownership, @new_owner_cmnt, @new_over_65_defer, @new_over_65_date, @new_ag_app_filed, @new_apply_pct_exemptions, @new_sup_num, @new_type_of_int, @new_hs_prop, @new_birth_dt, @new_roll_exemption, @new_roll_state_code, @new_roll_entity, @new_pct_imprv_hs, @new_pct_imprv_nhs, @new_pct_land_hs, @new_pct_land_nhs, @new_pct_ag_use, @new_pct_ag_mkt, @new_pct_tim_use, @new_pct_tim_mkt, @new_pct_pers_prop, @new_udi_child_prop_id, @new_percent_type
end
 
close curRows
deallocate curRows

GO



create trigger tr_owner_delete
on owner
for delete
not for replication

as

declare @lTriggerEnable int
exec @lTriggerEnable = dbo.TriggerGetEnabled 'owner'
if ( @lTriggerEnable = 0 )
begin
	return
end

set nocount on

	update property_val set
		owner_update_dt = GetDate(),
		last_owner_id   = deleted.owner_id
	from deleted
	where deleted.prop_id = property_val.prop_id
	and   deleted.sup_num = property_val.sup_num
	and   deleted.owner_tax_yr = property_val.prop_val_yr 

set nocount off

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Owner link type code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'owner', @level2type = N'COLUMN', @level2name = N'linked_cd';


GO

