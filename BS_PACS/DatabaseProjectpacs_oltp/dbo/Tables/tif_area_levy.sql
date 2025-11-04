CREATE TABLE [dbo].[tif_area_levy] (
    [tif_area_id]            INT          NOT NULL,
    [year]                   NUMERIC (4)  NOT NULL,
    [tax_district_id]        INT          NOT NULL,
    [levy_cd]                VARCHAR (10) NOT NULL,
    [base_value]             NUMERIC (14) NULL,
    [senior_base_value]      NUMERIC (14) NULL,
    [linked_tax_district_id] INT          NULL,
    [linked_levy_cd]         VARCHAR (10) NULL,
    CONSTRAINT [cpk_tif_area_levy] PRIMARY KEY CLUSTERED ([tif_area_id] ASC, [year] ASC, [tax_district_id] ASC, [levy_cd] ASC),
    CONSTRAINT [cfk_tif_area_levy_linked_levy] FOREIGN KEY ([year], [linked_tax_district_id], [linked_levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd]),
    CONSTRAINT [fk_tif_area_levy_levy] FOREIGN KEY ([year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd]),
    CONSTRAINT [fk_tif_area_levy_tif_area] FOREIGN KEY ([tif_area_id]) REFERENCES [dbo].[tif_area] ([tif_area_id])
);


GO

 
create trigger tr_tif_area_levy_update_ChangeLog
on tif_area_levy
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
 
declare @old_tif_area_id int
declare @new_tif_area_id int
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_tax_district_id int
declare @new_tax_district_id int
declare @old_levy_cd varchar(10)
declare @new_levy_cd varchar(10)
declare @old_base_value numeric(14,0)
declare @new_base_value numeric(14,0)
declare @old_senior_base_value numeric(14,0)
declare @new_senior_base_value numeric(14,0)
declare @old_linked_tax_district_id int
declare @new_linked_tax_district_id int
declare @old_linked_levy_cd varchar(10)
declare @new_linked_levy_cd varchar(10)
 
declare curRows cursor
for
     select d.tif_area_id, d.year, d.tax_district_id, d.levy_cd, d.base_value, d.senior_base_value, d.linked_tax_district_id, d.linked_levy_cd, 
            i.tif_area_id, i.year, i.tax_district_id, i.levy_cd, i.base_value, i.senior_base_value, i.linked_tax_district_id, i.linked_levy_cd
from deleted as d
join inserted as i on 
     d.tif_area_id = i.tif_area_id and
     d.year = i.year and
     d.tax_district_id = i.tax_district_id and
     d.levy_cd = i.levy_cd
for read only
 
open curRows
fetch next from curRows into @old_tif_area_id, @old_year, @old_tax_district_id, @old_levy_cd, @old_base_value, @old_senior_base_value, @old_linked_tax_district_id, @old_linked_levy_cd, 
                             @new_tif_area_id, @new_year, @new_tax_district_id, @new_levy_cd, @new_base_value, @new_senior_base_value, @new_linked_tax_district_id, @new_linked_levy_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_tif_area_id <> @new_tif_area_id
          or
          ( @old_tif_area_id is null and @new_tif_area_id is not null ) 
          or
          ( @old_tif_area_id is not null and @new_tif_area_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'tif_area_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 9992, convert(varchar(255), @old_tif_area_id), convert(varchar(255), @new_tif_area_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     if (
          @old_year <> @new_year
          or
          ( @old_year is null and @new_year is not null ) 
          or
          ( @old_year is not null and @new_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     if (
          @old_tax_district_id <> @new_tax_district_id
          or
          ( @old_tax_district_id is null and @new_tax_district_id is not null ) 
          or
          ( @old_tax_district_id is not null and @new_tax_district_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'tax_district_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 9377, convert(varchar(255), @old_tax_district_id), convert(varchar(255), @new_tax_district_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     if (
          @old_levy_cd <> @new_levy_cd
          or
          ( @old_levy_cd is null and @new_levy_cd is not null ) 
          or
          ( @old_levy_cd is not null and @new_levy_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'levy_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 9375, convert(varchar(255), @old_levy_cd), convert(varchar(255), @new_levy_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     if (
          @old_base_value <> @new_base_value
          or
          ( @old_base_value is null and @new_base_value is not null ) 
          or
          ( @old_base_value is not null and @new_base_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'base_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 10002, convert(varchar(255), @old_base_value), convert(varchar(255), @new_base_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     if (
          @old_senior_base_value <> @new_senior_base_value
          or
          ( @old_senior_base_value is null and @new_senior_base_value is not null ) 
          or
          ( @old_senior_base_value is not null and @new_senior_base_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'senior_base_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 10003, convert(varchar(255), @old_senior_base_value), convert(varchar(255), @new_senior_base_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     if (
          @old_linked_tax_district_id <> @new_linked_tax_district_id
          or
          ( @old_linked_tax_district_id is null and @new_linked_tax_district_id is not null ) 
          or
          ( @old_linked_tax_district_id is not null and @new_linked_tax_district_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'linked_tax_district_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 10004, convert(varchar(255), @old_linked_tax_district_id), convert(varchar(255), @new_linked_tax_district_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     if (
          @old_linked_levy_cd <> @new_linked_levy_cd
          or
          ( @old_linked_levy_cd is null and @new_linked_levy_cd is not null ) 
          or
          ( @old_linked_levy_cd is not null and @new_linked_levy_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area_levy' and
                    chg_log_columns = 'linked_levy_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1698, 10005, convert(varchar(255), @old_linked_levy_cd), convert(varchar(255), @new_linked_levy_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @new_tax_district_id), @new_tax_district_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @new_levy_cd), 0)
          end
     end
 
     fetch next from curRows into @old_tif_area_id, @old_year, @old_tax_district_id, @old_levy_cd, @old_base_value, @old_senior_base_value, @old_linked_tax_district_id, @old_linked_levy_cd, 
                                  @new_tif_area_id, @new_year, @new_tax_district_id, @new_levy_cd, @new_base_value, @new_senior_base_value, @new_linked_tax_district_id, @new_linked_levy_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_tif_area_levy_delete_ChangeLog
on tif_area_levy
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
          chg_log_tables = 'tif_area_levy' and
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
 
declare @tif_area_id int
declare @year numeric(4,0)
declare @tax_district_id int
declare @levy_cd varchar(10)
 
declare curRows cursor
for
     select tif_area_id, year, tax_district_id, levy_cd from deleted
for read only
 
open curRows
fetch next from curRows into @tif_area_id, @year, @tax_district_id, @levy_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1698, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
 
     fetch next from curRows into @tif_area_id, @year, @tax_district_id, @levy_cd
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_tif_area_levy_insert_ChangeLog
on tif_area_levy
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
 
declare @tif_area_id int
declare @year numeric(4,0)
declare @tax_district_id int
declare @levy_cd varchar(10)
declare @base_value numeric(14,0)
declare @senior_base_value numeric(14,0)
declare @linked_tax_district_id int
declare @linked_levy_cd varchar(10)
 
declare curRows cursor
for
     select tif_area_id, year, tax_district_id, levy_cd, base_value, senior_base_value, linked_tax_district_id, linked_levy_cd from inserted
for read only
 
open curRows
fetch next from curRows into @tif_area_id, @year, @tax_district_id, @levy_cd, @base_value, @senior_base_value, @linked_tax_district_id, @linked_levy_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'tif_area_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 9992, null, convert(varchar(255), @tif_area_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'tax_district_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 9377, null, convert(varchar(255), @tax_district_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'levy_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 9375, null, convert(varchar(255), @levy_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'base_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 10002, null, convert(varchar(255), @base_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'senior_base_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 10003, null, convert(varchar(255), @senior_base_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'linked_tax_district_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 10004, null, convert(varchar(255), @linked_tax_district_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area_levy' and
               chg_log_columns = 'linked_levy_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1698, 10005, null, convert(varchar(255), @linked_levy_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9377, convert(varchar(24), @tax_district_id), @tax_district_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9375, convert(varchar(24), @levy_cd), 0)
     end
 
     fetch next from curRows into @tif_area_id, @year, @tax_district_id, @levy_cd, @base_value, @senior_base_value, @linked_tax_district_id, @linked_levy_cd
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Linked tax district', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tif_area_levy', @level2type = N'COLUMN', @level2name = N'linked_tax_district_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Linked levy code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tif_area_levy', @level2type = N'COLUMN', @level2name = N'linked_levy_cd';


GO

