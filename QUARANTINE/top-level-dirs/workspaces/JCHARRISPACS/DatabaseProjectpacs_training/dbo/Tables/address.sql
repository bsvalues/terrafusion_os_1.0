CREATE TABLE [dbo].[address] (
    [acct_id]            INT          NOT NULL,
    [addr_type_cd]       CHAR (5)     NOT NULL,
    [primary_addr]       CHAR (1)     NULL,
    [addr_line1]         VARCHAR (60) NULL,
    [addr_line2]         VARCHAR (60) NULL,
    [addr_line3]         VARCHAR (60) NULL,
    [addr_city]          VARCHAR (50) NULL,
    [addr_state]         VARCHAR (50) NULL,
    [country_cd]         CHAR (5)     NULL,
    [ml_returned_dt]     DATETIME     NULL,
    [ml_type_cd]         CHAR (5)     NULL,
    [ml_deliverable]     CHAR (1)     NULL,
    [ml_return_type_cd]  CHAR (5)     NULL,
    [ml_returned_reason] VARCHAR (50) NULL,
    [cass_dt]            DATETIME     NULL,
    [delivery_point]     VARCHAR (2)  NULL,
    [carrier_route]      VARCHAR (5)  NULL,
    [check_digit]        VARCHAR (2)  NULL,
    [update_flag]        CHAR (1)     NULL,
    [chg_reason_cd]      CHAR (5)     NULL,
    [last_change_dt]     DATETIME     NULL,
    [zip]                VARCHAR (5)  NULL,
    [cass]               VARCHAR (4)  NULL,
    [route]              VARCHAR (2)  NULL,
    [addr_zip]           AS           (convert(varchar(10),case when (len(rtrim(ltrim(isnull([cass],'')))) = 4) then (rtrim(ltrim(isnull([zip],''))) + '-' + rtrim(ltrim(isnull([cass],'')))) else (rtrim(ltrim(isnull([zip],'')))) end)),
    [zip_4_2]            AS           (convert(varchar(14),case when (len(rtrim(ltrim(isnull([cass],'')))) = 4 and (len(rtrim(ltrim(isnull([route],'')))) = 2)) then ([dbo].[fn_GetPOSTNETCode](rtrim(ltrim(isnull([zip],''))) + rtrim(ltrim(isnull([cass],''))) + rtrim(ltrim(isnull([route],''))))) else '' end)),
    [is_international]   BIT          CONSTRAINT [CDF_address_is_international] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_address] PRIMARY KEY CLUSTERED ([acct_id] ASC, [addr_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_address_acct_id] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_address_addr_type_cd] FOREIGN KEY ([addr_type_cd]) REFERENCES [dbo].[address_type] ([addr_type_cd]),
    CONSTRAINT [CFK_address_chg_reason_cd] FOREIGN KEY ([chg_reason_cd]) REFERENCES [dbo].[chg_reason] ([chg_reason_cd]),
    CONSTRAINT [CFK_address_country_cd] FOREIGN KEY ([country_cd]) REFERENCES [dbo].[country] ([country_cd]),
    CONSTRAINT [CFK_address_ml_return_type_cd] FOREIGN KEY ([ml_return_type_cd]) REFERENCES [dbo].[mail_returned_type] ([ml_return_type_cd]),
    CONSTRAINT [CFK_address_ml_type_cd] FOREIGN KEY ([ml_type_cd]) REFERENCES [dbo].[mail_type] ([ml_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_acct_id_primary_addr]
    ON [dbo].[address]([acct_id] ASC, [primary_addr] ASC) WITH (FILLFACTOR = 90);


GO

 
create trigger tr_address_delete_ChangeLog
on address
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
          chg_log_tables = 'address' and
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
 
declare @acct_id int
declare @addr_type_cd char(5)
 
declare curRows cursor
for
     select acct_id, addr_type_cd from deleted
for read only
 
open curRows
fetch next from curRows into @acct_id, @addr_type_cd
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = account.file_as_name
     from account with(nolock)
     where acct_id = @acct_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 66, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
 
     fetch next from curRows into @acct_id, @addr_type_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_address_insert_ChangeLog
on address
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
 
declare @acct_id int
declare @addr_type_cd char(5)
declare @primary_addr char(1)
declare @addr_line1 varchar(60)
declare @addr_line2 varchar(60)
declare @addr_line3 varchar(60)
declare @addr_city varchar(50)
declare @addr_state varchar(50)
declare @country_cd char(5)
declare @ml_returned_dt datetime
declare @ml_type_cd char(5)
declare @ml_deliverable char(1)
declare @ml_return_type_cd char(5)
declare @ml_returned_reason varchar(50)
declare @cass_dt datetime
declare @delivery_point varchar(2)
declare @carrier_route varchar(5)
declare @check_digit varchar(2)
declare @update_flag char(1)
declare @chg_reason_cd char(5)
declare @last_change_dt datetime
declare @zip varchar(5)
declare @cass varchar(4)
declare @route varchar(2)
declare @addr_zip varchar(10)
declare @zip_4_2 varchar(14)
declare @is_international bit
 
declare curRows cursor
for
     select acct_id, addr_type_cd, primary_addr, addr_line1, addr_line2, addr_line3, addr_city, addr_state, country_cd, ml_returned_dt, ml_type_cd, ml_deliverable, ml_return_type_cd, ml_returned_reason, cass_dt, delivery_point, carrier_route, check_digit, update_flag, chg_reason_cd, last_change_dt, zip, cass, route, addr_zip, zip_4_2, is_international from inserted
for read only
 
open curRows
fetch next from curRows into @acct_id, @addr_type_cd, @primary_addr, @addr_line1, @addr_line2, @addr_line3, @addr_city, @addr_state, @country_cd, @ml_returned_dt, @ml_type_cd, @ml_deliverable, @ml_return_type_cd, @ml_returned_reason, @cass_dt, @delivery_point, @carrier_route, @check_digit, @update_flag, @chg_reason_cd, @last_change_dt, @zip, @cass, @route, @addr_zip, @zip_4_2, @is_international
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = account.file_as_name
     from account with(nolock)
     where acct_id = @acct_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 42, null, convert(varchar(255), @acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'addr_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 75, null, convert(varchar(255), @addr_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'primary_addr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 3927, null, convert(varchar(255), @primary_addr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'addr_line1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 70, null, convert(varchar(255), @addr_line1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'addr_line2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 71, null, convert(varchar(255), @addr_line2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'addr_line3' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 72, null, convert(varchar(255), @addr_line3), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'addr_city' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 66, null, convert(varchar(255), @addr_city), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'addr_state' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 74, null, convert(varchar(255), @addr_state), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'country_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 909, null, convert(varchar(255), @country_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'ml_returned_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 3102, null, convert(varchar(255), @ml_returned_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'ml_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 3104, null, convert(varchar(255), @ml_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'ml_deliverable' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 3099, null, convert(varchar(255), @ml_deliverable), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'ml_return_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 3101, null, convert(varchar(255), @ml_return_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'ml_returned_reason' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 3103, null, convert(varchar(255), @ml_returned_reason), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'cass_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 615, null, convert(varchar(255), @cass_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'delivery_point' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 1227, null, convert(varchar(255), @delivery_point), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'carrier_route' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 611, null, convert(varchar(255), @carrier_route), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'check_digit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 649, null, convert(varchar(255), @check_digit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'update_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 5418, null, convert(varchar(255), @update_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'chg_reason_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 742, null, convert(varchar(255), @chg_reason_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'last_change_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 2713, null, convert(varchar(255), @last_change_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'zip' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 5561, null, convert(varchar(255), @zip), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'cass' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 8520, null, convert(varchar(255), @cass), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'route' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 8728, null, convert(varchar(255), @route), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'addr_zip' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 77, null, convert(varchar(255), @addr_zip), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'zip_4_2' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 8819, null, convert(varchar(255), @zip_4_2), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'address' and
               chg_log_columns = 'is_international' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 66, 9888, null, convert(varchar(255), @is_international), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @addr_type_cd), 0)
     end
 
     fetch next from curRows into @acct_id, @addr_type_cd, @primary_addr, @addr_line1, @addr_line2, @addr_line3, @addr_city, @addr_state, @country_cd, @ml_returned_dt, @ml_type_cd, @ml_deliverable, @ml_return_type_cd, @ml_returned_reason, @cass_dt, @delivery_point, @carrier_route, @check_digit, @update_flag, @chg_reason_cd, @last_change_dt, @zip, @cass, @route, @addr_zip, @zip_4_2, @is_international
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_address_update_ChangeLog
on address
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
 
declare @old_acct_id int
declare @new_acct_id int
declare @old_addr_type_cd char(5)
declare @new_addr_type_cd char(5)
declare @old_primary_addr char(1)
declare @new_primary_addr char(1)
declare @old_addr_line1 varchar(60)
declare @new_addr_line1 varchar(60)
declare @old_addr_line2 varchar(60)
declare @new_addr_line2 varchar(60)
declare @old_addr_line3 varchar(60)
declare @new_addr_line3 varchar(60)
declare @old_addr_city varchar(50)
declare @new_addr_city varchar(50)
declare @old_addr_state varchar(50)
declare @new_addr_state varchar(50)
declare @old_country_cd char(5)
declare @new_country_cd char(5)
declare @old_ml_returned_dt datetime
declare @new_ml_returned_dt datetime
declare @old_ml_type_cd char(5)
declare @new_ml_type_cd char(5)
declare @old_ml_deliverable char(1)
declare @new_ml_deliverable char(1)
declare @old_ml_return_type_cd char(5)
declare @new_ml_return_type_cd char(5)
declare @old_ml_returned_reason varchar(50)
declare @new_ml_returned_reason varchar(50)
declare @old_cass_dt datetime
declare @new_cass_dt datetime
declare @old_delivery_point varchar(2)
declare @new_delivery_point varchar(2)
declare @old_carrier_route varchar(5)
declare @new_carrier_route varchar(5)
declare @old_check_digit varchar(2)
declare @new_check_digit varchar(2)
declare @old_update_flag char(1)
declare @new_update_flag char(1)
declare @old_chg_reason_cd char(5)
declare @new_chg_reason_cd char(5)
declare @old_last_change_dt datetime
declare @new_last_change_dt datetime
declare @old_zip varchar(5)
declare @new_zip varchar(5)
declare @old_cass varchar(4)
declare @new_cass varchar(4)
declare @old_route varchar(2)
declare @new_route varchar(2)
declare @old_addr_zip varchar(10)
declare @new_addr_zip varchar(10)
declare @old_zip_4_2 varchar(14)
declare @new_zip_4_2 varchar(14)
declare @old_is_international bit
declare @new_is_international bit
 
declare curRows cursor
for
     select d.acct_id, d.addr_type_cd, d.primary_addr, d.addr_line1, d.addr_line2, d.addr_line3, d.addr_city, d.addr_state, d.country_cd, d.ml_returned_dt, d.ml_type_cd, d.ml_deliverable, d.ml_return_type_cd, d.ml_returned_reason, d.cass_dt, d.delivery_point, d.carrier_route, d.check_digit, d.update_flag, d.chg_reason_cd, d.last_change_dt, d.zip, d.cass, d.route, d.addr_zip, d.zip_4_2, d.is_international, 
            i.acct_id, i.addr_type_cd, i.primary_addr, i.addr_line1, i.addr_line2, i.addr_line3, i.addr_city, i.addr_state, i.country_cd, i.ml_returned_dt, i.ml_type_cd, i.ml_deliverable, i.ml_return_type_cd, i.ml_returned_reason, i.cass_dt, i.delivery_point, i.carrier_route, i.check_digit, i.update_flag, i.chg_reason_cd, i.last_change_dt, i.zip, i.cass, i.route, i.addr_zip, i.zip_4_2, i.is_international
from deleted as d
join inserted as i on 
     d.acct_id = i.acct_id and
     d.addr_type_cd = i.addr_type_cd
for read only
 
open curRows
fetch next from curRows into @old_acct_id, @old_addr_type_cd, @old_primary_addr, @old_addr_line1, @old_addr_line2, @old_addr_line3, @old_addr_city, @old_addr_state, @old_country_cd, @old_ml_returned_dt, @old_ml_type_cd, @old_ml_deliverable, @old_ml_return_type_cd, @old_ml_returned_reason, @old_cass_dt, @old_delivery_point, @old_carrier_route, @old_check_digit, @old_update_flag, @old_chg_reason_cd, @old_last_change_dt, @old_zip, @old_cass, @old_route, @old_addr_zip, @old_zip_4_2, @old_is_international, 
                             @new_acct_id, @new_addr_type_cd, @new_primary_addr, @new_addr_line1, @new_addr_line2, @new_addr_line3, @new_addr_city, @new_addr_state, @new_country_cd, @new_ml_returned_dt, @new_ml_type_cd, @new_ml_deliverable, @new_ml_return_type_cd, @new_ml_returned_reason, @new_cass_dt, @new_delivery_point, @new_carrier_route, @new_check_digit, @new_update_flag, @new_chg_reason_cd, @new_last_change_dt, @new_zip, @new_cass, @new_route, @new_addr_zip, @new_zip_4_2, @new_is_international
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = account.file_as_name
     from account with(nolock)
     where acct_id = @new_acct_id
 
     if (
          @old_acct_id <> @new_acct_id
          or
          ( @old_acct_id is null and @new_acct_id is not null ) 
          or
          ( @old_acct_id is not null and @new_acct_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 42, convert(varchar(255), @old_acct_id), convert(varchar(255), @new_acct_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_addr_type_cd <> @new_addr_type_cd
          or
          ( @old_addr_type_cd is null and @new_addr_type_cd is not null ) 
          or
          ( @old_addr_type_cd is not null and @new_addr_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'addr_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 75, convert(varchar(255), @old_addr_type_cd), convert(varchar(255), @new_addr_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_primary_addr <> @new_primary_addr
          or
          ( @old_primary_addr is null and @new_primary_addr is not null ) 
          or
          ( @old_primary_addr is not null and @new_primary_addr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'primary_addr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 3927, convert(varchar(255), @old_primary_addr), convert(varchar(255), @new_primary_addr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_addr_line1 <> @new_addr_line1
          or
          ( @old_addr_line1 is null and @new_addr_line1 is not null ) 
          or
          ( @old_addr_line1 is not null and @new_addr_line1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'addr_line1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 70, convert(varchar(255), @old_addr_line1), convert(varchar(255), @new_addr_line1), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_addr_line2 <> @new_addr_line2
          or
          ( @old_addr_line2 is null and @new_addr_line2 is not null ) 
          or
          ( @old_addr_line2 is not null and @new_addr_line2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'addr_line2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 71, convert(varchar(255), @old_addr_line2), convert(varchar(255), @new_addr_line2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_addr_line3 <> @new_addr_line3
          or
          ( @old_addr_line3 is null and @new_addr_line3 is not null ) 
          or
          ( @old_addr_line3 is not null and @new_addr_line3 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'addr_line3' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 72, convert(varchar(255), @old_addr_line3), convert(varchar(255), @new_addr_line3), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_addr_city <> @new_addr_city
          or
          ( @old_addr_city is null and @new_addr_city is not null ) 
          or
          ( @old_addr_city is not null and @new_addr_city is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'addr_city' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 66, convert(varchar(255), @old_addr_city), convert(varchar(255), @new_addr_city), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_addr_state <> @new_addr_state
          or
          ( @old_addr_state is null and @new_addr_state is not null ) 
          or
          ( @old_addr_state is not null and @new_addr_state is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'addr_state' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 74, convert(varchar(255), @old_addr_state), convert(varchar(255), @new_addr_state), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_country_cd <> @new_country_cd
          or
          ( @old_country_cd is null and @new_country_cd is not null ) 
          or
          ( @old_country_cd is not null and @new_country_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'country_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 909, convert(varchar(255), @old_country_cd), convert(varchar(255), @new_country_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_ml_returned_dt <> @new_ml_returned_dt
          or
          ( @old_ml_returned_dt is null and @new_ml_returned_dt is not null ) 
          or
          ( @old_ml_returned_dt is not null and @new_ml_returned_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'ml_returned_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 3102, convert(varchar(255), @old_ml_returned_dt), convert(varchar(255), @new_ml_returned_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_ml_type_cd <> @new_ml_type_cd
          or
          ( @old_ml_type_cd is null and @new_ml_type_cd is not null ) 
          or
          ( @old_ml_type_cd is not null and @new_ml_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'ml_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 3104, convert(varchar(255), @old_ml_type_cd), convert(varchar(255), @new_ml_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_ml_deliverable <> @new_ml_deliverable
          or
          ( @old_ml_deliverable is null and @new_ml_deliverable is not null ) 
          or
          ( @old_ml_deliverable is not null and @new_ml_deliverable is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'ml_deliverable' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 3099, convert(varchar(255), @old_ml_deliverable), convert(varchar(255), @new_ml_deliverable), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_ml_return_type_cd <> @new_ml_return_type_cd
          or
          ( @old_ml_return_type_cd is null and @new_ml_return_type_cd is not null ) 
          or
          ( @old_ml_return_type_cd is not null and @new_ml_return_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'ml_return_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 3101, convert(varchar(255), @old_ml_return_type_cd), convert(varchar(255), @new_ml_return_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_ml_returned_reason <> @new_ml_returned_reason
          or
          ( @old_ml_returned_reason is null and @new_ml_returned_reason is not null ) 
          or
          ( @old_ml_returned_reason is not null and @new_ml_returned_reason is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'ml_returned_reason' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 3103, convert(varchar(255), @old_ml_returned_reason), convert(varchar(255), @new_ml_returned_reason), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_cass_dt <> @new_cass_dt
          or
          ( @old_cass_dt is null and @new_cass_dt is not null ) 
          or
          ( @old_cass_dt is not null and @new_cass_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'cass_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 615, convert(varchar(255), @old_cass_dt), convert(varchar(255), @new_cass_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_delivery_point <> @new_delivery_point
          or
          ( @old_delivery_point is null and @new_delivery_point is not null ) 
          or
          ( @old_delivery_point is not null and @new_delivery_point is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'delivery_point' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 1227, convert(varchar(255), @old_delivery_point), convert(varchar(255), @new_delivery_point), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_carrier_route <> @new_carrier_route
          or
          ( @old_carrier_route is null and @new_carrier_route is not null ) 
          or
          ( @old_carrier_route is not null and @new_carrier_route is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'carrier_route' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 611, convert(varchar(255), @old_carrier_route), convert(varchar(255), @new_carrier_route), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_check_digit <> @new_check_digit
          or
          ( @old_check_digit is null and @new_check_digit is not null ) 
          or
          ( @old_check_digit is not null and @new_check_digit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'check_digit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 649, convert(varchar(255), @old_check_digit), convert(varchar(255), @new_check_digit), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_update_flag <> @new_update_flag
          or
          ( @old_update_flag is null and @new_update_flag is not null ) 
          or
          ( @old_update_flag is not null and @new_update_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'update_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 5418, convert(varchar(255), @old_update_flag), convert(varchar(255), @new_update_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_chg_reason_cd <> @new_chg_reason_cd
          or
          ( @old_chg_reason_cd is null and @new_chg_reason_cd is not null ) 
          or
          ( @old_chg_reason_cd is not null and @new_chg_reason_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'chg_reason_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 742, convert(varchar(255), @old_chg_reason_cd), convert(varchar(255), @new_chg_reason_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_last_change_dt <> @new_last_change_dt
          or
          ( @old_last_change_dt is null and @new_last_change_dt is not null ) 
          or
          ( @old_last_change_dt is not null and @new_last_change_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'last_change_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 2713, convert(varchar(255), @old_last_change_dt), convert(varchar(255), @new_last_change_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_zip <> @new_zip
          or
          ( @old_zip is null and @new_zip is not null ) 
          or
          ( @old_zip is not null and @new_zip is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'zip' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 5561, convert(varchar(255), @old_zip), convert(varchar(255), @new_zip), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_cass <> @new_cass
          or
          ( @old_cass is null and @new_cass is not null ) 
          or
          ( @old_cass is not null and @new_cass is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'cass' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 8520, convert(varchar(255), @old_cass), convert(varchar(255), @new_cass), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_route <> @new_route
          or
          ( @old_route is null and @new_route is not null ) 
          or
          ( @old_route is not null and @new_route is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'route' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 8728, convert(varchar(255), @old_route), convert(varchar(255), @new_route), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_addr_zip <> @new_addr_zip
          or
          ( @old_addr_zip is null and @new_addr_zip is not null ) 
          or
          ( @old_addr_zip is not null and @new_addr_zip is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'addr_zip' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 77, convert(varchar(255), @old_addr_zip), convert(varchar(255), @new_addr_zip), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_zip_4_2 <> @new_zip_4_2
          or
          ( @old_zip_4_2 is null and @new_zip_4_2 is not null ) 
          or
          ( @old_zip_4_2 is not null and @new_zip_4_2 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'zip_4_2' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 8819, convert(varchar(255), @old_zip_4_2), convert(varchar(255), @new_zip_4_2), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     if (
          @old_is_international <> @new_is_international
          or
          ( @old_is_international is null and @new_is_international is not null ) 
          or
          ( @old_is_international is not null and @new_is_international is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'address' and
                    chg_log_columns = 'is_international' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 66, 9888, convert(varchar(255), @old_is_international), convert(varchar(255), @new_is_international), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 75, convert(varchar(24), @new_addr_type_cd), 0)
          end
     end
 
     fetch next from curRows into @old_acct_id, @old_addr_type_cd, @old_primary_addr, @old_addr_line1, @old_addr_line2, @old_addr_line3, @old_addr_city, @old_addr_state, @old_country_cd, @old_ml_returned_dt, @old_ml_type_cd, @old_ml_deliverable, @old_ml_return_type_cd, @old_ml_returned_reason, @old_cass_dt, @old_delivery_point, @old_carrier_route, @old_check_digit, @old_update_flag, @old_chg_reason_cd, @old_last_change_dt, @old_zip, @old_cass, @old_route, @old_addr_zip, @old_zip_4_2, @old_is_international, 
                                  @new_acct_id, @new_addr_type_cd, @new_primary_addr, @new_addr_line1, @new_addr_line2, @new_addr_line3, @new_addr_city, @new_addr_state, @new_country_cd, @new_ml_returned_dt, @new_ml_type_cd, @new_ml_deliverable, @new_ml_return_type_cd, @new_ml_returned_reason, @new_cass_dt, @new_delivery_point, @new_carrier_route, @new_check_digit, @new_update_flag, @new_chg_reason_cd, @new_last_change_dt, @new_zip, @new_cass, @new_route, @new_addr_zip, @new_zip_4_2, @new_is_international
end
 
close curRows
deallocate curRows

GO



create trigger tr_address_delete
on address
for delete
not for replication

as

set nocount on

	update account set update_dt = GetDate()
	from deleted
	where deleted.acct_id = account.acct_id

set nocount off

GO



create trigger tr_address_insert
on address
for insert
not for replication

as

set nocount on

	update account set update_dt = GetDate()
	from inserted
	where inserted.acct_id = account.acct_id

	UPDATE	address
	SET	last_change_dt = GetDate()
	FROM	inserted
	WHERE	inserted.acct_id = address.acct_id
	AND	inserted.addr_type_cd = address.addr_type_cd

GO



create trigger tr_address_update
on address
for update
not for replication

as

set nocount on

	IF UPDATE(primary_addr) or UPDATE(addr_line1) or UPDATE(addr_line2) or
		UPDATE(addr_line3) or UPDATE(addr_city) or UPDATE(addr_state) or
		UPDATE(country_cd) or UPDATE(ml_deliverable) or
        UPDATE(zip) Or UPDATE(cass) or UPDATE(route) 
	BEGIN
		update account set update_dt = GetDate()
		from inserted
		where inserted.acct_id = account.acct_id
	END

	IF UPDATE(primary_addr) or UPDATE(addr_line1) or UPDATE(addr_line2) or
		UPDATE(addr_line3) or UPDATE(addr_city) or UPDATE(addr_state) or
		UPDATE(country_cd)  or
        UPDATE(zip) Or UPDATE(cass) or UPDATE(route) 
	BEGIN
		UPDATE	address
		SET	last_change_dt = GetDate()
		FROM	inserted
		WHERE	inserted.acct_id = address.acct_id
		AND	inserted.addr_type_cd = address.addr_type_cd
	END

GO

