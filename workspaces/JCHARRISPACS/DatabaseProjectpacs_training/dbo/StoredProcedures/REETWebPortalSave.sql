
create proc REETWebPortalSave (@webportal_id varchar(10), @taxable bit = 1)
as
BEGIN

	set nocount on

	--declare @appraisal_yr int
	declare @sale_date datetime 
	declare @validation_yr int
	declare @error_message varchar(512)
	
	set @error_message = ''

	IF object_id('tempdb..#properties') IS NOT NULL
	BEGIN
	   DROP TABLE #properties
	END
		
	
	IF object_id('tempdb..#propertyValidation') IS NOT NULL
	BEGIN
		DROP TABLE #propertyValidation
	END
	
	

	CREATE TABLE #properties (
	id int IDENTITY(1,1),
	prop_id int,
	geo_id varchar(50),
	urban_growth_cd varchar(10),
	error varchar(255)
	)
	
	
	CREATE TABLE #propertyValidation (
	prop_id int, 
	geo_id varchar(50),
	location_code varchar(10),
	tax_district_type_cd varchar(20), 
	tax_district_id int,
	is_city bit,
	prop_val_yr numeric(4,0), 
	sup_num int, 
	tax_area_id int, 
	tax_area_number varchar(23),
	urban_growth_cd varchar(10),
	error varchar(500)
	)
	

	insert into #properties (prop_id)
		select distinct prop_id from ##reet_webportal_import_property
			where webportal_id = @webportal_id


	if not exists (select * from #properties)
	BEGIN
		delete ##reet_webportal_import_property where webportal_id = @webportal_id
		delete ##reet_webportal_import_account where webportal_id = @webportal_id
		delete ##reet_webportal_import where webportal_id = @webportal_id

		set nocount off
		select 'No properties found.' as [Error_msg]
		return
	END

	
	---- initialize the @validation_yr to appraisal year
	select @validation_yr = appr_yr from pacs_system with (nolock) 
	select @sale_date = sale_date from ##reet_webportal_import where webportal_id = @webportal_id
	
	--- set the validation year to sale year if sale_date is a valid date
	if (isNull(@sale_date, '') <> '')  
	begin
		if (ISDATE(@sale_date) = 1)	
			select @validation_yr = year(@sale_date)		
	end
	

--update missing fields from the table.

	--Update the missing Geo Ids
	update #properties set geo_id = p.geo_id
		from property p  with (nolock) inner join #properties i
			on p.prop_id = i.prop_id
			and i.geo_id is null


	update #properties set urban_growth_cd = pv.urban_growth_cd 
		from
			#properties p 
			inner join prop_supp_assoc psa  with (nolock)
				on psa.owner_tax_yr = @validation_yr and psa.prop_id = p.prop_id
			inner join property_val pv with (nolock) 
				on pv.prop_val_yr = @validation_yr and pv.sup_num = psa.sup_num and p.prop_id = pv.prop_id


	---- set error if prop_id not found, or no property found for the given geo_id
	update #properties 
	set error = 'Property doesn''t exist for the given id in year ' + CONVERT(varchar(5), @validation_yr)
	from #properties i 
	left outer join property_val p on 
		i.prop_id = p.prop_id and
		p.prop_val_yr = @validation_yr
	where p.prop_id is null or i.prop_id is null
	
		
	if @@rowcount > 0
	begin
		set @error_message = 'Property doesn''t exist for the given id in year ' + CONVERT(varchar(5), @validation_yr)
	end
	
	--------------------------------
	---- Validate location code
	--------------------------------
	
	---- get location code for each property	
	insert into #propertyValidation (
		prop_id, 
		location_code,		
		tax_district_type_cd, 
		tax_district_id,	
		prop_val_yr, 
		sup_num		
		)
	select 
		#properties.prop_id, td.location_code, td.tax_district_type_cd, td.tax_district_id,
		pv.prop_val_yr, pv.sup_num
	from #properties  with(nolock)
	join property_val pv with(nolock)
		on pv.prop_id = #properties.prop_id	
	join property p with(nolock)
		on p.prop_id = pv.prop_id
	join property_tax_area pta with(nolock)
		on pta.prop_id = pv.prop_id
		and pta.year = pv.prop_val_yr
		and pta.sup_num = pv.sup_num
	join tax_area ta with(nolock)
		on ta.tax_area_id = pta.tax_area_id
	join 	
	(	
		select  wpotda.prop_id, wpotda.year, wpotda.sup_num, 
				wpotda.tax_district_id, MIN(wpotda.owner_id) owner_id
		from wash_prop_owner_tax_district_assoc wpotda with(nolock)
		join prop_supp_assoc psa with(nolock)
		on	psa.prop_id = wpotda.prop_id 
			and psa.owner_tax_yr = wpotda.year
			and psa.sup_num = wpotda.sup_num
		where wpotda.year = @validation_yr and psa.owner_tax_yr = @validation_yr
		group by wpotda.prop_id,  wpotda.year, wpotda.sup_num, wpotda.tax_district_id		
	) as wpotda_minOwner
		on  wpotda_minOwner.prop_id = pv.prop_id
		and wpotda_minOwner.year = pv.prop_val_yr
		and wpotda_minOwner.sup_num = pv.sup_num	 
	join tax_district td with(nolock)
		on td.tax_district_id = wpotda_minOwner.tax_district_id
		and isnull(location_code, '') <> ''	
	where (pv.prop_val_yr = @validation_yr) and  #properties.error is null            
	order by tax_district_type_cd, location_code asc
	
	
	update #propertyValidation
	set 
		tax_area_id = pta.tax_area_id,
		tax_area_number = ta.tax_area_number
	from #propertyValidation as pv
	join property_tax_area pta with(nolock)
		on pta.prop_id = pv.prop_id
		and pta.year = pv.prop_val_yr
		and pta.sup_num = pv.sup_num
	join tax_area ta with(nolock)
		on ta.tax_area_id = pta.tax_area_id
		
			
	update #propertyValidation
	set #propertyValidation.is_city = tax_district_type.is_city
	from #propertyValidation
	join tax_district_type
	on #propertyValidation.tax_district_type_cd = tax_district_type.tax_district_type_cd
	
	
	update #propertyValidation
	set geo_id =  
		(select geo_id from #properties 
			where #properties.prop_id = #propertyValidation.prop_id)
				
	update #propertyValidation
	set urban_growth_cd =  
		(select urban_growth_cd from #properties 
			where #properties.prop_id = #propertyValidation.prop_id)
			
		
	declare @propertyCount int
	select @propertyCount = count (Distinct prop_id) from #propertyValidation 
	
	declare @locationCount int
	select @locationCount = count (Distinct location_code) from #propertyValidation 
		
	
	---- Validate Location Code for Taxable REET			
	if (@taxable = 1) and (@propertyCount > 1)
	BEGIN	
		if (@locationCount > 1)
		BEGIN	
			declare @firstLocation varchar(10) 
			declare @firstLocationPropertyCount int
			
			select top 1 @firstLocation = 
				location_code from #propertyValidation ----where (isNull(is_city, 0) = 1)
								
			select @firstLocationPropertyCount = count (*) from #propertyValidation 
				where location_code = @firstLocation ----and (isNull(is_city, 0) = 1)
			
			if (@firstLocationPropertyCount <> @propertyCount)
			begin
				---- City or County location does not match
				update #propertyValidation
				set error = 'Location Code: ' + @firstLocation + ' Do not Match. Multiple properties are only allowed where the resulting distribution of funds is consistent; i.e. City or County.'
				where #propertyValidation.location_code = @firstLocation		
			end		
		
	
			declare @locationErrorCount int
			select @locationErrorCount = 
				COUNT (*) from #propertyValidation where #propertyValidation.error is not null
		
			if @locationErrorCount > 0
			begin
				set @error_message = @error_message + '  Location Codes do not match.'
			end	 			 	
		END
			
		declare @ugacount int	
		select @ugacount = count(*) from 
			(select urban_growth_cd from #properties 
				where urban_growth_cd is not null and #properties.error is null 
				group by urban_growth_cd) as i

		if @ugacount > 1
		BEGIN
			update #properties set error = 'Urban Growth Codes do not match'
			set @error_message = @error_message + '  Urban Growth Codes do not match.'
		END
	
	END

	


	if	(exists(select * from #properties where #properties.error is not null)) or
			(exists(select * from #propertyValidation where #propertyValidation.error is not null))
	BEGIN
		delete ##reet_webportal_import_property where webportal_id = @webportal_id
		delete ##reet_webportal_import_account where webportal_id = @webportal_id
		delete ##reet_webportal_import where webportal_id = @webportal_id

		set nocount off
		select 'Invalid Data found.   ' + ltrim(@error_message) as [Error_msg]
		return
	END

	insert into reet_webportal_import select * from ##reet_webportal_import where webportal_id = @webportal_id
	insert into reet_webportal_import_property select * from ##reet_webportal_import_property where webportal_id = @webportal_id
	insert into reet_webportal_import_account select * from ##reet_webportal_import_account where webportal_id = @webportal_id

	delete ##reet_webportal_import_property where webportal_id = @webportal_id
	delete ##reet_webportal_import_account where webportal_id = @webportal_id
	delete ##reet_webportal_import where webportal_id = @webportal_id

	drop table #properties
	drop table #propertyValidation

	set nocount off
	select NULL as [Error_msg]

END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalSave] TO PUBLIC
    AS [dbo];


GO

