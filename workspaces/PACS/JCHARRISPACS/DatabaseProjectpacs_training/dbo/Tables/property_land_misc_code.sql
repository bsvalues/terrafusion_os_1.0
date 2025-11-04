CREATE TABLE [dbo].[property_land_misc_code] (
    [prop_id]          INT             NOT NULL,
    [prop_val_yr]      NUMERIC (4)     NOT NULL,
    [sup_num]          INT             NOT NULL,
    [sale_id]          INT             NOT NULL,
    [misc_id]          INT             NOT NULL,
    [county_indicator] NUMERIC (1)     NOT NULL,
    [cycle]            NUMERIC (1)     NOT NULL,
    [region_cd]        VARCHAR (5)     NULL,
    [hood_cd]          VARCHAR (10)    NULL,
    [subset_cd]        VARCHAR (5)     NULL,
    [misc_code]        VARCHAR (6)     NOT NULL,
    [value]            NUMERIC (14, 3) NOT NULL,
    [index]            NUMERIC (8, 2)  NOT NULL,
    [indexed_value]    NUMERIC (14)    NOT NULL,
    [sched_id]         INT             NULL,
    [calc_value]       NUMERIC (14)    NULL,
    CONSTRAINT [CPK_property_land_misc_code] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [misc_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_land_misc_code_misc_code] FOREIGN KEY ([misc_code]) REFERENCES [dbo].[land_misc_code] ([misc_cd])
);


GO

 
create trigger tr_property_land_misc_code_delete_ChangeLog
on property_land_misc_code
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
          chg_log_tables = 'property_land_misc_code' and
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
declare @prop_val_yr numeric(4,0)
declare @misc_code varchar(6)
declare @sup_num int
declare @sale_id int
declare @county_indicator numeric (1,0)
declare @cycle numeric (1,0)
declare @region_cd varchar(5)
declare @hood_cd varchar(10)
declare @subset_cd varchar(5)

 
declare curRows cursor
for
     select prop_id, case prop_val_yr when 0 then @tvar_lFutureYear else prop_val_yr end,misc_code,sup_num, sale_id,county_indicator,
     cycle,region_cd,hood_cd,subset_cd from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @misc_code,@sup_num, @sale_id,@county_indicator,@cycle,@region_cd,@hood_cd,@subset_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Property:' + convert(varchar(100),@prop_id) + '-' + convert(varchar(100),@prop_val_yr) + '-' + convert(varchar(100),@sup_num)
	 if exists (
			  select chg_log_audit
			  from chg_log_columns with(nolock)
			  where
				   chg_log_tables = 'property_land_misc_code' and
				   chg_log_columns = 'misc_code' and
				   chg_log_audit = 1
		 )
		 begin
		 insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
		 values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1512, 3088, convert(varchar(55),@misc_code), null, @tvar_szRefID )
		 set @tvar_lChangeID = @@identity

		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
		
	   end
	   
	   if exists (
			  select chg_log_audit
			  from chg_log_columns with(nolock)
			  where
				   chg_log_tables = 'property_land_misc_code' and
				   chg_log_columns = 'county_indicator' and
				   chg_log_audit = 1
		 )
		 begin
		 insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
		 values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1512, 9942, convert(varchar(55),@county_indicator), null, @tvar_szRefID )
		 set @tvar_lChangeID = @@identity

		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
		
	   end
	   
	   if exists (
			  select chg_log_audit
			  from chg_log_columns with(nolock)
			  where
				   chg_log_tables = 'property_land_misc_code' and
				   chg_log_columns = 'cycle' and
				   chg_log_audit = 1
		 )
		 begin
		 insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
		 values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1512, 9444, convert(varchar(55),@cycle), null, @tvar_szRefID )
		 set @tvar_lChangeID = @@identity

		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
		
	   end
	   
	   if exists (
			  select chg_log_audit
			  from chg_log_columns with(nolock)
			  where
				   chg_log_tables = 'property_land_misc_code' and
				   chg_log_columns = 'region_cd' and
				   chg_log_audit = 1
		 )
		 begin
		 insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
		 values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1512, 4359, convert(varchar(55),@region_cd), null, @tvar_szRefID )
		 set @tvar_lChangeID = @@identity

		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
		
	   end
	   
	   if exists (
			  select chg_log_audit
			  from chg_log_columns with(nolock)
			  where
				   chg_log_tables = 'property_land_misc_code' and
				   chg_log_columns = 'hood_cd' and
				   chg_log_audit = 1
		 )
		 begin
		 insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
		 values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1512, 2068, convert(varchar(55),@hood_cd), null, @tvar_szRefID )
		 set @tvar_lChangeID = @@identity

		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
		 
	   end
	   
	   if exists (
			  select chg_log_audit
			  from chg_log_columns with(nolock)
			  where
				   chg_log_tables = 'property_land_misc_code' and
				   chg_log_columns = 'subset_cd' and
				   chg_log_audit = 1
		 )
		 begin
		 insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
		 values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1512, 4977, convert(varchar(55),@subset_cd), null, @tvar_szRefID )
		 set @tvar_lChangeID = @@identity

		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
		 insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
		 
	   end
       
       
     
     fetch next from curRows into @prop_id, @prop_val_yr, @misc_code,@sup_num, @sale_id,@county_indicator,@cycle,@region_cd,@hood_cd,@subset_cd
end
 
close curRows
deallocate curRows

GO


create trigger tr_property_land_misc_code_insert_ChangeLog
on property_land_misc_code
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

declare @propId int
declare @propYear numeric(4,0)
declare @supNum int
declare @saleId int
declare @miscCode varchar(6)
declare @county_indicator numeric (1,0)
declare @cycle numeric (1,0)
declare @region_cd varchar(5)
declare @hood_cd varchar(10)
declare @subset_cd varchar(5)


 
declare curRows cursor
for
     select misc_code,prop_id,case prop_val_yr when 0 then @tvar_lFutureYear else prop_val_yr end,sup_num,sale_id,county_indicator,
     cycle,region_cd,hood_cd,subset_cd from inserted 
for read only
 
open curRows
fetch next from curRows into @miscCode,@propId,@propYear,@supNum,@saleId,@county_indicator,@cycle,@region_cd,@hood_cd,@subset_cd

while ( @@fetch_status = 0 )
begin
       set @tvar_szRefID = 'Property:' + convert(varchar(255),@propId) + '-' + convert(varchar(255),@propYear) + '-' + convert(varchar(255),@supNum)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_land_misc_code' and
               chg_log_columns = 'misc_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1512, 3088, null, convert(varchar(255), @miscCode), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @propId), @propId)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @propYear), case when @propYear > @tvar_intMin and @propYear < @tvar_intMax then convert(int, round(@propYear, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @supNum), @supNum)
    end
    
      if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_land_misc_code' and
               chg_log_columns = 'county_indicator' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1512, 9942, null, convert(varchar(255), @county_indicator), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @propId), @propId)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @propYear), case when @propYear > @tvar_intMin and @propYear < @tvar_intMax then convert(int, round(@propYear, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @supNum), @supNum)
    end
    
      if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_land_misc_code' and
               chg_log_columns = 'cycle' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1512, 9444, null, convert(varchar(255), @cycle), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @propId), @propId)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @propYear), case when @propYear > @tvar_intMin and @propYear < @tvar_intMax then convert(int, round(@propYear, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @supNum), @supNum)
    end
    
      if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_land_misc_code' and
               chg_log_columns = 'region_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1512, 4359, null, convert(varchar(255), @region_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @propId), @propId)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @propYear), case when @propYear > @tvar_intMin and @propYear < @tvar_intMax then convert(int, round(@propYear, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @supNum), @supNum)
    end
    
      if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_land_misc_code' and
               chg_log_columns = 'hood_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1512, 2068, null, convert(varchar(255), @hood_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @propId), @propId)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @propYear), case when @propYear > @tvar_intMin and @propYear < @tvar_intMax then convert(int, round(@propYear, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @supNum), @supNum)
    end
    
      if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_land_misc_code' and
               chg_log_columns = 'subset_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1512, 4977, null, convert(varchar(255), @subset_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @propId), @propId)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @propYear), case when @propYear > @tvar_intMin and @propYear < @tvar_intMax then convert(int, round(@propYear, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @supNum), @supNum)
    end
        
    
        
        fetch next from curRows into @miscCode,@propId,@propYear,@supNum,@saleId,@county_indicator,@cycle,@region_cd,@hood_cd,@subset_cd
        
        end
 
close curRows
deallocate curRows

GO

 
create trigger tr_property_land_misc_code_update_ChangeLog
on property_land_misc_code
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
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_misc_code varchar(6)
declare @new_misc_code varchar(6)
declare @old_sup_num int
declare @new_sup_num int
declare @old_sale_id int
declare @new_sale_id int
declare @old_county_indicator numeric (1,0)
declare @old_cycle numeric (1,0)
declare @old_region_cd varchar(5)
declare @old_hood_cd varchar(10)
declare @old_subset_cd varchar(5)
declare @new_county_indicator numeric (1,0)
declare @new_cycle numeric (1,0)
declare @new_region_cd varchar(5)
declare @new_hood_cd varchar(10)
declare @new_subset_cd varchar(5)

declare curRows cursor
for
     select d.prop_id, case d.prop_val_yr when 0 then @tvar_lFutureYear else d.prop_val_yr end, d.misc_code, d.sup_num, d.sale_id,d.county_indicator,
     d.cycle,d.region_cd,d.hood_cd,d.subset_cd
     ,i.prop_id,
     case i.prop_val_yr when 0 then @tvar_lFutureYear else i.prop_val_yr end,i.misc_code,i.sup_num,i.sale_id,i.county_indicator,
     i.cycle,i.region_cd,i.hood_cd,i.subset_cd
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.prop_val_yr = i.prop_val_yr and
     d.sup_num = i.sup_num 
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_misc_code, @old_sup_num, @old_sale_id,@old_county_indicator,@old_cycle,
@old_region_cd,@old_hood_cd,@old_subset_cd,@new_prop_id, @new_prop_val_yr, @new_misc_code, @new_sup_num, @new_sale_id,@new_county_indicator,
@new_cycle,@new_region_cd,@new_hood_cd,@new_subset_cd

while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Property:' + convert(varchar(100),@new_prop_id) + '-' + convert(varchar(100),@new_prop_val_yr) + '-' + convert(varchar(100),@new_sup_num)
 
     if (
          @old_misc_code <> @new_misc_code
          or
          ( @old_misc_code is null and @new_misc_code is not null ) 
          or
          ( @old_misc_code is not null and @new_misc_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_land_misc_code' and
                    chg_log_columns = 'misc_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1512, 3088, convert(varchar(255), @old_misc_code), convert(varchar(255), @new_misc_code), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               
          end
         end 
         
     if (
          @old_county_indicator <> @new_county_indicator
          or
          ( @old_county_indicator is null and @new_county_indicator is not null ) 
          or
          ( @old_county_indicator is not null and @new_county_indicator is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_land_misc_code' and
                    chg_log_columns = 'county_indicator' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1512, 9942, convert(varchar(255), @old_county_indicator), convert(varchar(255), @new_county_indicator), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               
          end
         end 
         
     if (
          @old_cycle <> @new_cycle
          or
          ( @old_cycle is null and @new_cycle is not null ) 
          or
          ( @old_cycle is not null and @new_cycle is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_land_misc_code' and
                    chg_log_columns = 'cycle' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1512, 9444, convert(varchar(255), @old_cycle), convert(varchar(255), @new_cycle), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               
          end
         end 
         
     if (
          @old_region_cd <> @new_region_cd
          or
          ( @old_region_cd is null and @new_region_cd is not null ) 
          or
          ( @old_region_cd is not null and @new_region_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_land_misc_code' and
                    chg_log_columns = 'region_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1512, 4359, convert(varchar(255), @old_region_cd), convert(varchar(255), @new_region_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               
          end
         end 
         
     if (
          @old_hood_cd <> @new_hood_cd
          or
          ( @old_hood_cd is null and @new_hood_cd is not null ) 
          or
          ( @old_hood_cd is not null and @new_hood_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_land_misc_code' and
                    chg_log_columns = 'hood_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1512, 2068, convert(varchar(255), @old_hood_cd), convert(varchar(255), @new_hood_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               
          end
         end 
         
     if (
          @old_subset_cd <> @new_subset_cd
          or
          ( @old_subset_cd is null and @new_subset_cd is not null ) 
          or
          ( @old_subset_cd is not null and @new_subset_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_land_misc_code' and
                    chg_log_columns = 'subset_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1512, 4977, convert(varchar(255), @old_subset_cd), convert(varchar(255), @new_subset_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               
          end
         end 
       
    
 
 fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_misc_code, @old_sup_num, @old_sale_id,@old_county_indicator,@old_cycle,
@old_region_cd,@old_hood_cd,@old_subset_cd,@new_prop_id, @new_prop_val_yr, @new_misc_code, @new_sup_num, @new_sale_id,@new_county_indicator,
@new_cycle,@new_region_cd,@new_hood_cd,@new_subset_cd

end
 
close curRows
deallocate curRows

GO

