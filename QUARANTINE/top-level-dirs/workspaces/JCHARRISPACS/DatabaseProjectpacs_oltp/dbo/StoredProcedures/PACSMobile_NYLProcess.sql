

--Make sure that SS is stopped and also the 
create proc [dbo].[PACSMobile_NYLProcess]
@certification_year int
As

Begin

	declare 
			@apprYear int,
			@jobName varchar(4000),
			@jobEnabled bit

	print 'Step 1: Verify Certification year'
	select @apprYear = appr_yr from pacs_system
	
	if @certification_year <> @apprYear
	begin
		select 'pacs_system.appr_yr year is incorrect' as [Description] ,@apprYear as Value 
		return -1
	end
	
	print 'Step 2: Check queue tables'
	if (select count(*) as propertyCount from ccUpSyncQueue ) > 0
	Begin
		select 'Queue table NOT empty' as [Description] , 'SQL: truncate table ccUpSyncQueue' as Value 
		return -1 
	end

	if (select count(*) as propertyCount from ccAssignmentGroupQueue ) > 0
	Begin
		select 'Queue table NOT empty' as [Description] , 'SQL: truncate table ccAssignmentGroupQueue' as Value  
		return -1 
	end

	if (select count(*) as propertyCount from ccUserSyncQueue ) > 0
	Begin
		select 'Queue table NOT empty' as [Description] , 'SQL: truncate table ccUserSyncQueue' as Value  
		return -1 
	end
	 
	print 'Step 3: Check Compare Job'
	select @jobName = s.name
	from  msdb..sysjobs s 
	left join master.sys.syslogins l on s.owner_sid = l.sid
	where s.name like '%PACS MOBILE COMPARE%'

	SELECT @jobEnabled = [enabled]
	FROM msdb.dbo.sysjobs job
		INNER JOIN 
		msdb.dbo.sysjobsteps steps        
		ON job.job_id = steps.job_id
	WHERE
		name = @jobName

	If (@jobEnabled = 1)
	Begin
		select 'PACS MOBILE COMPARE is enabled' as [Description] , 'Enabled = True' as Value 
		return -1
	End		
	 
	print 'Step 4: Update ccProperty with new appr year'
	update ccProperty set prop_val_yr = @apprYear

	print 'Step 5: Verify deleted properties'
	declare @deletedProperties int
	select @deletedProperties = count(*)  
	from ccProperty as cc
	join property_val as pv on
	cc.prop_id = pv.prop_id
	and cc.prop_val_yr = pv.prop_val_yr
	and cc.sup_num = pv.sup_num
	where (pv.prop_inactive_dt is not null and pv.udi_parent <> 'T')
	--and udi_parent_prop_id is not null
	

	if (@deletedProperties > 0)
	begin
		
		print 'Step 6: Remove deleted property from ccProperty table'
		Delete ccProperty 
		from ccProperty as cc
		join property_val as pv on
		cc.prop_id = pv.prop_id
		and cc.prop_val_yr = pv.prop_val_yr
		and cc.sup_num = pv.sup_num
		where (pv.prop_inactive_dt is not null or pv.udi_parent <> 'T')
		--and udi_parent_prop_id is not null
	end
	
	print 'Step 7: Check UpSync changes.If any wait for all the changes to get processed'
	declare @upSyncChanges int
	select @upSyncChanges = count(*) from TADM_CHANGE_TRACKING

	if (@upSyncChanges > 0)
	begin
		select 'UpSync changes found, Start SS and let TADM gets processed' as [Description] , 'SQL: Select * from tadm_change_tracking' as Value  		
	end

	print 'Step 8: Executing Compare with run_type =1, creating a new baseline'
	exec dbo.usp_ccCheckSum_Compare '1'

	print 'Step 9: Verify deleted properties - 2nd time'
	select @deletedProperties = count(*)  
	from ccProperty as cc
	join property_val as pv on
	cc.prop_id = pv.prop_id
	and cc.prop_val_yr = pv.prop_val_yr
	and cc.sup_num = pv.sup_num
	where (pv.prop_inactive_dt is not null or pv.udi_parent <> 'T')
	--and udi_parent_prop_id is not null

	if (@deletedProperties > 0)
	begin
		print 'Step 10: Remove deleted property from ccProperty table - 2nd time'
		Delete ccProperty 
		from ccProperty as cc
		join property_val as pv on
		cc.prop_id = pv.prop_id
		and cc.prop_val_yr = pv.prop_val_yr
		and cc.sup_num = pv.sup_num
		where (pv.prop_inactive_dt is not null or pv.udi_parent <> 'T')
		--and udi_parent_prop_id is not null
	end

	print 'Step 11: Check queue tables - 2nd time'
	
	if (select count(*) as propertyCount from ccUpSyncQueue ) > 0
	Begin
		select 'Queue table NOT empty' as [Description] , 'SQL: truncate table ccUpSyncQueue' as Value 
		return -1 
	end

	if (select count(*) as propertyCount from ccAssignmentGroupQueue ) > 0
	Begin
		select 'Queue table NOT empty' as [Description] , 'SQL: truncate table ccAssignmentGroupQueue' as Value  
		return -1 
	end

	if (select count(*) as propertyCount from ccUserSyncQueue ) > 0
	Begin
		select 'Queue table NOT empty' as [Description] , 'SQL: truncate table ccUserSyncQueue' as Value  
		return -1 
	end
	
	print 'Step 12: Insert into CCUpSyncQueue from ccProperty'
	insert into CCUpSyncQueue
	select prop_id,0,'99' from ccProperty

	print 'Step 13: Clear the image queue table for deleted properpties'
	delete ccImageUpSyncQueue 
	where prop_id not in  (select distinct prop_id from ccProperty)

	print 'Step 14: Get the list of properties and send it to DCS'
	if OBJECT_ID('ccProperty_property_list', 'U') is not null
	begin
		drop table ccProperty_property_list
	end

	select prop_id, prop_val_yr, sup_num, mobile_assignment_group_id into ccProperty_property_list from ccProperty 

	select 'Send the list of properties to DCS' as [Description] , 'SQL: select * from ccProperty_property_list' as Value  

End

GO

