CREATE TABLE [dbo].[property] (
    [prop_id]             INT            NOT NULL,
    [prop_type_cd]        CHAR (5)       NOT NULL,
    [prop_create_dt]      DATETIME       NULL,
    [ref_id1]             VARCHAR (50)   NULL,
    [ref_id2]             VARCHAR (50)   NULL,
    [geo_id]              VARCHAR (50)   NULL,
    [ams_load_dt]         DATETIME       NULL,
    [prop_cmnt]           VARCHAR (3000) NULL,
    [prop_sic_cd]         VARCHAR (10)   NULL,
    [dba_name]            VARCHAR (50)   NULL,
    [alt_dba_name]        VARCHAR (50)   NULL,
    [exmpt_reset]         CHAR (1)       NULL,
    [gpm_irrig]           INT            NULL,
    [utilities]           VARCHAR (50)   NULL,
    [topography]          VARCHAR (50)   NULL,
    [road_access]         VARCHAR (50)   NULL,
    [other]               VARCHAR (50)   NULL,
    [zoning]              VARCHAR (50)   NULL,
    [remarks]             VARCHAR (3000) NULL,
    [state_cd]            CHAR (5)       NULL,
    [mass_created_from]   INT            NULL,
    [simple_geo_id]       VARCHAR (50)   NULL,
    [reference_flag]      CHAR (1)       NULL,
    [penpad_run_id]       INT            NULL,
    [reference_desc]      VARCHAR (64)   NULL,
    [col_owner_id]        INT            NULL,
    [col_agent_id]        INT            NULL,
    [col_owner_yr]        INT            NULL,
    [col_owner_override]  BIT            CONSTRAINT [CDF_property_col_owner_override] DEFAULT (0) NOT NULL,
    [col_agent_override]  BIT            CONSTRAINT [CDF_property_col_agent_override] DEFAULT (0) NOT NULL,
    [col_owner_update_dt] DATETIME       NULL,
    [col_agent_update_dt] DATETIME       NULL,
    [mass_create_run_id]  INT            NULL,
    [col_autopay_id]      INT            CONSTRAINT [CDF_property_col_autopay_id] DEFAULT ('') NULL,
    CONSTRAINT [CPK_property] PRIMARY KEY CLUSTERED ([prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_prop_type_cd] FOREIGN KEY ([prop_type_cd]) REFERENCES [dbo].[property_type] ([prop_type_cd]),
    CONSTRAINT [CFK_property_state_cd] FOREIGN KEY ([state_cd]) REFERENCES [dbo].[state_code] ([state_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_geo_id]
    ON [dbo].[property]([geo_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_reference_flag]
    ON [dbo].[property]([reference_flag] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_type_cd]
    ON [dbo].[property]([prop_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_penpad_run_id]
    ON [dbo].[property]([penpad_run_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_property_update
on property
for update
not for replication

as

set nocount on

	/* Update the simple_geo_id */
	update property set
		simple_geo_id = replace(replace(geo_id, ' ', ''), '-', '')
	where
		prop_id in (
			select prop_id from inserted
		)

	IF UPDATE(col_owner_id) 
	begin
		update property set col_owner_update_dt=GetDate()
		from inserted
		where inserted.prop_id=property.prop_id
	end
	IF UPDATE(col_agent_id) 
	begin
		update property set col_agent_update_dt=GetDate()
		from inserted
		where inserted.prop_id=property.prop_id
	end
set nocount off

GO

 
create trigger tr_property_insert_ChangeLog
on property
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
declare @prop_type_cd char(5)
declare @prop_create_dt datetime
declare @ref_id1 varchar(50)
declare @ref_id2 varchar(50)
declare @geo_id varchar(50)
declare @ams_load_dt datetime
declare @prop_cmnt varchar(3000)
declare @prop_sic_cd char(5)
declare @dba_name varchar(50)
declare @alt_dba_name varchar(50)
declare @exmpt_reset char(1)
declare @gpm_irrig int
declare @utilities varchar(50)
declare @topography varchar(50)
declare @road_access varchar(50)
declare @other varchar(50)
declare @zoning varchar(50)
declare @remarks varchar(3000)
declare @state_cd char(5)
declare @mass_created_from int
declare @simple_geo_id varchar(50)
declare @reference_flag char(1)
declare @penpad_run_id int
declare @reference_desc varchar(64)
declare @col_owner_id int
declare @col_agent_id int
declare @col_owner_yr int
declare @col_owner_override bit
declare @col_agent_override bit
declare @col_owner_update_dt datetime
declare @col_agent_update_dt datetime
declare @mass_create_run_id int
 
declare curRows cursor
for
     select prop_id, prop_type_cd, prop_create_dt, ref_id1, ref_id2, geo_id, ams_load_dt, prop_cmnt, prop_sic_cd, dba_name, alt_dba_name, exmpt_reset, gpm_irrig, utilities, topography, road_access, other, zoning, remarks, state_cd, mass_created_from, simple_geo_id, reference_flag, penpad_run_id, reference_desc, col_owner_id, col_agent_id, col_owner_yr, col_owner_override, col_agent_override, col_owner_update_dt, col_agent_update_dt, mass_create_run_id from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_type_cd, @prop_create_dt, @ref_id1, @ref_id2, @geo_id, @ams_load_dt, @prop_cmnt, @prop_sic_cd, @dba_name, @alt_dba_name, @exmpt_reset, @gpm_irrig, @utilities, @topography, @road_access, @other, @zoning, @remarks, @state_cd, @mass_created_from, @simple_geo_id, @reference_flag, @penpad_run_id, @reference_desc, @col_owner_id, @col_agent_id, @col_owner_yr, @col_owner_override, @col_agent_override, @col_owner_update_dt, @col_agent_update_dt, @mass_create_run_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'prop_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4079, null, convert(varchar(255), @prop_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'prop_create_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4013, null, convert(varchar(255), @prop_create_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'ref_id1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4327, null, convert(varchar(255), @ref_id1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'ref_id2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4328, null, convert(varchar(255), @ref_id2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'geo_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 2006, null, convert(varchar(255), @geo_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'ams_load_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 181, null, convert(varchar(255), @ams_load_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'prop_cmnt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4011, null, convert(varchar(255), @prop_cmnt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'prop_sic_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4067, null, convert(varchar(255), @prop_sic_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'dba_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 1130, null, convert(varchar(255), @dba_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'alt_dba_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 174, null, convert(varchar(255), @alt_dba_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'exmpt_reset' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 1828, null, convert(varchar(255), @exmpt_reset), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'gpm_irrig' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 2012, null, convert(varchar(255), @gpm_irrig), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'utilities' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 5468, null, convert(varchar(255), @utilities), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'topography' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 5242, null, convert(varchar(255), @topography), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'road_access' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4420, null, convert(varchar(255), @road_access), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'other' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 3421, null, convert(varchar(255), @other), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'zoning' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 5564, null, convert(varchar(255), @zoning), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'remarks' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4362, null, convert(varchar(255), @remarks), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'state_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4928, null, convert(varchar(255), @state_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'mass_created_from' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 3018, null, convert(varchar(255), @mass_created_from), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'simple_geo_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4737, null, convert(varchar(255), @simple_geo_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'reference_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4337, null, convert(varchar(255), @reference_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'penpad_run_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 3632, null, convert(varchar(255), @penpad_run_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'reference_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 4336, null, convert(varchar(255), @reference_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'col_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9707, null, convert(varchar(255), @col_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'col_agent_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9708, null, convert(varchar(255), @col_agent_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'col_owner_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9709, null, convert(varchar(255), @col_owner_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'col_owner_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9710, null, convert(varchar(255), @col_owner_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'col_agent_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9711, null, convert(varchar(255), @col_agent_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'col_owner_update_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9712, null, convert(varchar(255), @col_owner_update_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'col_agent_update_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9713, null, convert(varchar(255), @col_agent_update_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property' and
               chg_log_columns = 'mass_create_run_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 642, 9714, null, convert(varchar(255), @mass_create_run_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
     end
 
     fetch next from curRows into @prop_id, @prop_type_cd, @prop_create_dt, @ref_id1, @ref_id2, @geo_id, @ams_load_dt, @prop_cmnt, @prop_sic_cd, @dba_name, @alt_dba_name, @exmpt_reset, @gpm_irrig, @utilities, @topography, @road_access, @other, @zoning, @remarks, @state_cd, @mass_created_from, @simple_geo_id, @reference_flag, @penpad_run_id, @reference_desc, @col_owner_id, @col_agent_id, @col_owner_yr, @col_owner_override, @col_agent_override, @col_owner_update_dt, @col_agent_update_dt, @mass_create_run_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_property_insert
on property
for insert
not for replication

as

set nocount on

	/* Update the simple_geo_id */
	update property set
		simple_geo_id = replace(replace(geo_id, ' ', ''), '-', '')
	where
		prop_id in (
			select prop_id from inserted
		)

set nocount off

GO

 
create trigger tr_property_delete_ChangeLog
on property
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
          chg_log_tables = 'property' and
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
 
declare @prop_id int
 
declare curRows cursor
for
     select prop_id from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 642, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
 
     fetch next from curRows into @prop_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_property_update_ChangeLog
on property
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
declare @old_prop_type_cd char(5)
declare @new_prop_type_cd char(5)
declare @old_prop_create_dt datetime
declare @new_prop_create_dt datetime
declare @old_ref_id1 varchar(50)
declare @new_ref_id1 varchar(50)
declare @old_ref_id2 varchar(50)
declare @new_ref_id2 varchar(50)
declare @old_geo_id varchar(50)
declare @new_geo_id varchar(50)
declare @old_ams_load_dt datetime
declare @new_ams_load_dt datetime
declare @old_prop_cmnt varchar(3000)
declare @new_prop_cmnt varchar(3000)
declare @old_prop_sic_cd char(5)
declare @new_prop_sic_cd char(5)
declare @old_dba_name varchar(50)
declare @new_dba_name varchar(50)
declare @old_alt_dba_name varchar(50)
declare @new_alt_dba_name varchar(50)
declare @old_exmpt_reset char(1)
declare @new_exmpt_reset char(1)
declare @old_gpm_irrig int
declare @new_gpm_irrig int
declare @old_utilities varchar(50)
declare @new_utilities varchar(50)
declare @old_topography varchar(50)
declare @new_topography varchar(50)
declare @old_road_access varchar(50)
declare @new_road_access varchar(50)
declare @old_other varchar(50)
declare @new_other varchar(50)
declare @old_zoning varchar(50)
declare @new_zoning varchar(50)
declare @old_remarks varchar(3000)
declare @new_remarks varchar(3000)
declare @old_state_cd char(5)
declare @new_state_cd char(5)
declare @old_mass_created_from int
declare @new_mass_created_from int
declare @old_simple_geo_id varchar(50)
declare @new_simple_geo_id varchar(50)
declare @old_reference_flag char(1)
declare @new_reference_flag char(1)
declare @old_penpad_run_id int
declare @new_penpad_run_id int
declare @old_reference_desc varchar(64)
declare @new_reference_desc varchar(64)
declare @old_col_owner_id int
declare @new_col_owner_id int
declare @old_col_agent_id int
declare @new_col_agent_id int
declare @old_col_owner_yr int
declare @new_col_owner_yr int
declare @old_col_owner_override bit
declare @new_col_owner_override bit
declare @old_col_agent_override bit
declare @new_col_agent_override bit
declare @old_col_owner_update_dt datetime
declare @new_col_owner_update_dt datetime
declare @old_col_agent_update_dt datetime
declare @new_col_agent_update_dt datetime
declare @old_mass_create_run_id int
declare @new_mass_create_run_id int
 
declare curRows cursor
for
     select d.prop_id, d.prop_type_cd, d.prop_create_dt, d.ref_id1, d.ref_id2, d.geo_id, d.ams_load_dt, d.prop_cmnt, d.prop_sic_cd, d.dba_name, d.alt_dba_name, d.exmpt_reset, d.gpm_irrig, d.utilities, d.topography, d.road_access, d.other, d.zoning, d.remarks, d.state_cd, d.mass_created_from, d.simple_geo_id, d.reference_flag, d.penpad_run_id, d.reference_desc, d.col_owner_id, d.col_agent_id, d.col_owner_yr, d.col_owner_override, d.col_agent_override, d.col_owner_update_dt, d.col_agent_update_dt, d.mass_create_run_id, 
            i.prop_id, i.prop_type_cd, i.prop_create_dt, i.ref_id1, i.ref_id2, i.geo_id, i.ams_load_dt, i.prop_cmnt, i.prop_sic_cd, i.dba_name, i.alt_dba_name, i.exmpt_reset, i.gpm_irrig, i.utilities, i.topography, i.road_access, i.other, i.zoning, i.remarks, i.state_cd, i.mass_created_from, i.simple_geo_id, i.reference_flag, i.penpad_run_id, i.reference_desc, i.col_owner_id, i.col_agent_id, i.col_owner_yr, i.col_owner_override, i.col_agent_override, i.col_owner_update_dt, i.col_agent_update_dt, i.mass_create_run_id
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_prop_type_cd, @old_prop_create_dt, @old_ref_id1, @old_ref_id2, @old_geo_id, @old_ams_load_dt, @old_prop_cmnt, @old_prop_sic_cd, @old_dba_name, @old_alt_dba_name, @old_exmpt_reset, @old_gpm_irrig, @old_utilities, @old_topography, @old_road_access, @old_other, @old_zoning, @old_remarks, @old_state_cd, @old_mass_created_from, @old_simple_geo_id, @old_reference_flag, @old_penpad_run_id, @old_reference_desc, @old_col_owner_id, @old_col_agent_id, @old_col_owner_yr, @old_col_owner_override, @old_col_agent_override, @old_col_owner_update_dt, @old_col_agent_update_dt, @old_mass_create_run_id, 
                             @new_prop_id, @new_prop_type_cd, @new_prop_create_dt, @new_ref_id1, @new_ref_id2, @new_geo_id, @new_ams_load_dt, @new_prop_cmnt, @new_prop_sic_cd, @new_dba_name, @new_alt_dba_name, @new_exmpt_reset, @new_gpm_irrig, @new_utilities, @new_topography, @new_road_access, @new_other, @new_zoning, @new_remarks, @new_state_cd, @new_mass_created_from, @new_simple_geo_id, @new_reference_flag, @new_penpad_run_id, @new_reference_desc, @new_col_owner_id, @new_col_agent_id, @new_col_owner_yr, @new_col_owner_override, @new_col_agent_override, @new_col_owner_update_dt, @new_col_agent_update_dt, @new_mass_create_run_id
 
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
                    chg_log_tables = 'property' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_prop_type_cd <> @new_prop_type_cd
          or
          ( @old_prop_type_cd is null and @new_prop_type_cd is not null ) 
          or
          ( @old_prop_type_cd is not null and @new_prop_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'prop_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4079, convert(varchar(255), @old_prop_type_cd), convert(varchar(255), @new_prop_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_prop_create_dt <> @new_prop_create_dt
          or
          ( @old_prop_create_dt is null and @new_prop_create_dt is not null ) 
          or
          ( @old_prop_create_dt is not null and @new_prop_create_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'prop_create_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4013, convert(varchar(255), @old_prop_create_dt), convert(varchar(255), @new_prop_create_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_ref_id1 <> @new_ref_id1
          or
          ( @old_ref_id1 is null and @new_ref_id1 is not null ) 
          or
          ( @old_ref_id1 is not null and @new_ref_id1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'ref_id1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4327, convert(varchar(255), @old_ref_id1), convert(varchar(255), @new_ref_id1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_ref_id2 <> @new_ref_id2
          or
          ( @old_ref_id2 is null and @new_ref_id2 is not null ) 
          or
          ( @old_ref_id2 is not null and @new_ref_id2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'ref_id2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4328, convert(varchar(255), @old_ref_id2), convert(varchar(255), @new_ref_id2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_geo_id <> @new_geo_id
          or
          ( @old_geo_id is null and @new_geo_id is not null ) 
          or
          ( @old_geo_id is not null and @new_geo_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'geo_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 2006, convert(varchar(255), @old_geo_id), convert(varchar(255), @new_geo_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_ams_load_dt <> @new_ams_load_dt
          or
          ( @old_ams_load_dt is null and @new_ams_load_dt is not null ) 
          or
          ( @old_ams_load_dt is not null and @new_ams_load_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'ams_load_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 181, convert(varchar(255), @old_ams_load_dt), convert(varchar(255), @new_ams_load_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_prop_cmnt <> @new_prop_cmnt
          or
          ( @old_prop_cmnt is null and @new_prop_cmnt is not null ) 
          or
          ( @old_prop_cmnt is not null and @new_prop_cmnt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'prop_cmnt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4011, convert(varchar(255), @old_prop_cmnt), convert(varchar(255), @new_prop_cmnt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_prop_sic_cd <> @new_prop_sic_cd
          or
          ( @old_prop_sic_cd is null and @new_prop_sic_cd is not null ) 
          or
          ( @old_prop_sic_cd is not null and @new_prop_sic_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'prop_sic_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4067, convert(varchar(255), @old_prop_sic_cd), convert(varchar(255), @new_prop_sic_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_dba_name <> @new_dba_name
          or
          ( @old_dba_name is null and @new_dba_name is not null ) 
          or
          ( @old_dba_name is not null and @new_dba_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'dba_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 1130, convert(varchar(255), @old_dba_name), convert(varchar(255), @new_dba_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_alt_dba_name <> @new_alt_dba_name
          or
          ( @old_alt_dba_name is null and @new_alt_dba_name is not null ) 
          or
          ( @old_alt_dba_name is not null and @new_alt_dba_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'alt_dba_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 174, convert(varchar(255), @old_alt_dba_name), convert(varchar(255), @new_alt_dba_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_exmpt_reset <> @new_exmpt_reset
          or
          ( @old_exmpt_reset is null and @new_exmpt_reset is not null ) 
          or
          ( @old_exmpt_reset is not null and @new_exmpt_reset is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'exmpt_reset' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 1828, convert(varchar(255), @old_exmpt_reset), convert(varchar(255), @new_exmpt_reset), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_gpm_irrig <> @new_gpm_irrig
          or
          ( @old_gpm_irrig is null and @new_gpm_irrig is not null ) 
          or
          ( @old_gpm_irrig is not null and @new_gpm_irrig is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'gpm_irrig' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 2012, convert(varchar(255), @old_gpm_irrig), convert(varchar(255), @new_gpm_irrig), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_utilities <> @new_utilities
          or
          ( @old_utilities is null and @new_utilities is not null ) 
          or
          ( @old_utilities is not null and @new_utilities is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'utilities' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 5468, convert(varchar(255), @old_utilities), convert(varchar(255), @new_utilities), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_topography <> @new_topography
          or
          ( @old_topography is null and @new_topography is not null ) 
          or
          ( @old_topography is not null and @new_topography is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'topography' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 5242, convert(varchar(255), @old_topography), convert(varchar(255), @new_topography), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_road_access <> @new_road_access
          or
          ( @old_road_access is null and @new_road_access is not null ) 
          or
          ( @old_road_access is not null and @new_road_access is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'road_access' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4420, convert(varchar(255), @old_road_access), convert(varchar(255), @new_road_access), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_other <> @new_other
          or
          ( @old_other is null and @new_other is not null ) 
          or
          ( @old_other is not null and @new_other is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'other' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 3421, convert(varchar(255), @old_other), convert(varchar(255), @new_other), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_zoning <> @new_zoning
          or
          ( @old_zoning is null and @new_zoning is not null ) 
          or
          ( @old_zoning is not null and @new_zoning is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'zoning' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 5564, convert(varchar(255), @old_zoning), convert(varchar(255), @new_zoning), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_remarks <> @new_remarks
          or
          ( @old_remarks is null and @new_remarks is not null ) 
          or
          ( @old_remarks is not null and @new_remarks is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'remarks' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4362, convert(varchar(255), @old_remarks), convert(varchar(255), @new_remarks), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_state_cd <> @new_state_cd
          or
          ( @old_state_cd is null and @new_state_cd is not null ) 
          or
          ( @old_state_cd is not null and @new_state_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'state_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4928, convert(varchar(255), @old_state_cd), convert(varchar(255), @new_state_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_mass_created_from <> @new_mass_created_from
          or
          ( @old_mass_created_from is null and @new_mass_created_from is not null ) 
          or
          ( @old_mass_created_from is not null and @new_mass_created_from is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'mass_created_from' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 3018, convert(varchar(255), @old_mass_created_from), convert(varchar(255), @new_mass_created_from), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_simple_geo_id <> @new_simple_geo_id
          or
          ( @old_simple_geo_id is null and @new_simple_geo_id is not null ) 
          or
          ( @old_simple_geo_id is not null and @new_simple_geo_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'simple_geo_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4737, convert(varchar(255), @old_simple_geo_id), convert(varchar(255), @new_simple_geo_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_reference_flag <> @new_reference_flag
          or
          ( @old_reference_flag is null and @new_reference_flag is not null ) 
          or
          ( @old_reference_flag is not null and @new_reference_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'reference_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4337, convert(varchar(255), @old_reference_flag), convert(varchar(255), @new_reference_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_penpad_run_id <> @new_penpad_run_id
          or
          ( @old_penpad_run_id is null and @new_penpad_run_id is not null ) 
          or
          ( @old_penpad_run_id is not null and @new_penpad_run_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'penpad_run_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 3632, convert(varchar(255), @old_penpad_run_id), convert(varchar(255), @new_penpad_run_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_reference_desc <> @new_reference_desc
          or
          ( @old_reference_desc is null and @new_reference_desc is not null ) 
          or
          ( @old_reference_desc is not null and @new_reference_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'reference_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 4336, convert(varchar(255), @old_reference_desc), convert(varchar(255), @new_reference_desc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_col_owner_id <> @new_col_owner_id
          or
          ( @old_col_owner_id is null and @new_col_owner_id is not null ) 
          or
          ( @old_col_owner_id is not null and @new_col_owner_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'col_owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9707, convert(varchar(255), @old_col_owner_id), convert(varchar(255), @new_col_owner_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_col_agent_id <> @new_col_agent_id
          or
          ( @old_col_agent_id is null and @new_col_agent_id is not null ) 
          or
          ( @old_col_agent_id is not null and @new_col_agent_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'col_agent_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9708, convert(varchar(255), @old_col_agent_id), convert(varchar(255), @new_col_agent_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_col_owner_yr <> @new_col_owner_yr
          or
          ( @old_col_owner_yr is null and @new_col_owner_yr is not null ) 
          or
          ( @old_col_owner_yr is not null and @new_col_owner_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'col_owner_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9709, convert(varchar(255), @old_col_owner_yr), convert(varchar(255), @new_col_owner_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_col_owner_override <> @new_col_owner_override
          or
          ( @old_col_owner_override is null and @new_col_owner_override is not null ) 
          or
          ( @old_col_owner_override is not null and @new_col_owner_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'col_owner_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9710, convert(varchar(255), @old_col_owner_override), convert(varchar(255), @new_col_owner_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_col_agent_override <> @new_col_agent_override
          or
          ( @old_col_agent_override is null and @new_col_agent_override is not null ) 
          or
          ( @old_col_agent_override is not null and @new_col_agent_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'col_agent_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9711, convert(varchar(255), @old_col_agent_override), convert(varchar(255), @new_col_agent_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_col_owner_update_dt <> @new_col_owner_update_dt
          or
          ( @old_col_owner_update_dt is null and @new_col_owner_update_dt is not null ) 
          or
          ( @old_col_owner_update_dt is not null and @new_col_owner_update_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'col_owner_update_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9712, convert(varchar(255), @old_col_owner_update_dt), convert(varchar(255), @new_col_owner_update_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_col_agent_update_dt <> @new_col_agent_update_dt
          or
          ( @old_col_agent_update_dt is null and @new_col_agent_update_dt is not null ) 
          or
          ( @old_col_agent_update_dt is not null and @new_col_agent_update_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'col_agent_update_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9713, convert(varchar(255), @old_col_agent_update_dt), convert(varchar(255), @new_col_agent_update_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     if (
          @old_mass_create_run_id <> @new_mass_create_run_id
          or
          ( @old_mass_create_run_id is null and @new_mass_create_run_id is not null ) 
          or
          ( @old_mass_create_run_id is not null and @new_mass_create_run_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property' and
                    chg_log_columns = 'mass_create_run_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 642, 9714, convert(varchar(255), @old_mass_create_run_id), convert(varchar(255), @new_mass_create_run_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @tvar_key_year), @tvar_key_year)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_prop_type_cd, @old_prop_create_dt, @old_ref_id1, @old_ref_id2, @old_geo_id, @old_ams_load_dt, @old_prop_cmnt, @old_prop_sic_cd, @old_dba_name, @old_alt_dba_name, @old_exmpt_reset, @old_gpm_irrig, @old_utilities, @old_topography, @old_road_access, @old_other, @old_zoning, @old_remarks, @old_state_cd, @old_mass_created_from, @old_simple_geo_id, @old_reference_flag, @old_penpad_run_id, @old_reference_desc, @old_col_owner_id, @old_col_agent_id, @old_col_owner_yr, @old_col_owner_override, @old_col_agent_override, @old_col_owner_update_dt, @old_col_agent_update_dt, @old_mass_create_run_id, 
                                  @new_prop_id, @new_prop_type_cd, @new_prop_create_dt, @new_ref_id1, @new_ref_id2, @new_geo_id, @new_ams_load_dt, @new_prop_cmnt, @new_prop_sic_cd, @new_dba_name, @new_alt_dba_name, @new_exmpt_reset, @new_gpm_irrig, @new_utilities, @new_topography, @new_road_access, @new_other, @new_zoning, @new_remarks, @new_state_cd, @new_mass_created_from, @new_simple_geo_id, @new_reference_flag, @new_penpad_run_id, @new_reference_desc, @new_col_owner_id, @new_col_agent_id, @new_col_owner_yr, @new_col_owner_override, @new_col_agent_override, @new_col_owner_update_dt, @new_col_agent_update_dt, @new_mass_create_run_id
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The run id for the mass create properties run that created this property.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property', @level2type = N'COLUMN', @level2name = N'mass_create_run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Auto-Pay Account ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property', @level2type = N'COLUMN', @level2name = N'col_autopay_id';


GO

