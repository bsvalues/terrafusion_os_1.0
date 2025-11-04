

create proc REETWebPortalPropertyValidate 
(
@propertyid varchar(max),  
@geoid varchar(max), 
@validationYear decimal = -1, 
@taxable bit = 1)
as
BEGIN
declare @SplitOn char(1)
declare @Cnt int
declare @id int
declare @appraisal_yr int


set nocount on

	IF object_id('tempdb..#properties') IS NOT NULL
	BEGIN
		DROP TABLE #properties
	END
	
	
	IF object_id('tempdb..#propertyValidation') IS NOT NULL
	BEGIN
		DROP TABLE #propertyValidation
	END


	CREATE TABLE #properties (
	id int,
	prop_id int,
	geo_id varchar(50),
	urban_growth_cd varchar(10),
	prop_inactive_dt datetime,
	error varchar(500)
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

	select @appraisal_yr = appr_yr from pacs_system with (nolock)
	
	if (@validationYear = -1)
	begin
		set @validationYear = @appraisal_yr
	end
	
	
	SET @SplitOn = ','

	--INSERT PROPERTY IDs into the table
	set @id = 0
	Set @Cnt = 1

	While (Charindex(@SplitOn,@propertyid)>0)
	Begin
		set @id = @id + 1
		Insert Into #properties (id, prop_id)
		Select @id,
			cast(ltrim(rtrim(Substring(@propertyid,1,Charindex(@SplitOn,@propertyid)-1))) as int)

		Set @propertyid = Substring(@propertyid,Charindex(@SplitOn,@propertyid)+1,len(@propertyid))
		Set @Cnt = @Cnt + 1
	End
	
	set @id = @id + 1
		Insert Into #properties (id, prop_id)
		Select @id,
			cast(ltrim(rtrim(@propertyid)) as int)



	--INSERT GEO IDs into the table
	Set @Cnt = 1

	While (Charindex(@SplitOn,@geoid)>0)
	Begin
		set @id = @id + 1
		Insert Into #properties (id,geo_id)
		Select @id,
			ltrim(rtrim(Substring(@geoid,1,Charindex(@SplitOn,@geoid)-1)))

		Set @geoid = Substring(@geoid,Charindex(@SplitOn,@geoid)+1,len(@geoid))
		Set @Cnt = @Cnt + 1
	End
	set @id = @id + 1
	Insert Into #properties (id,geo_id)
	Select @id, ltrim(rtrim(@geoid))

	delete #properties where isnull(prop_id,'') = '' and isnull(geo_id,'') = ''


	--Update the missing Property Ids
	update #properties set prop_id = p.prop_id
		from property p with (nolock) inner join #properties i
			on p.geo_id = i.geo_id 
			and i.prop_id is null

	--Update the missing Geo Ids
	update #properties set geo_id = p.geo_id
		from property p  with (nolock) inner join #properties i
			on p.prop_id = i.prop_id
			and i.geo_id is null

	--Remove Duplicate records
	delete #properties where id in (
		select max(id) from #properties 
			group by prop_id, geo_id 
			having count(*) > 1
		)

	---- set urban_growth_cd
	update #properties 
	set urban_growth_cd = pv.urban_growth_cd, prop_inactive_dt = pv.prop_inactive_dt
		from
			#properties p 
			inner join prop_supp_assoc psa  with (nolock)
				on psa.owner_tax_yr = @validationYear and psa.prop_id = p.prop_id
			inner join property_val pv with (nolock) 
				on pv.prop_val_yr = @validationYear
				and pv.sup_num = psa.sup_num 
				and p.prop_id = pv.prop_id


	---- set error if prop_id not found, or no property found for the given geo_id
	update #properties 
	set error = 'Property doesn''t exist for the given id in year ' + CONVERT(varchar(5), @validationYear)
	from #properties i 
	left outer join property_val p on 
		i.prop_id = p.prop_id and
		p.prop_val_yr = @validationYear 
		--p.prop_inactive_dt is null
	where p.prop_id is null or i.prop_id is null
	
	declare @deleted_prop int	
	select @deleted_prop = 
		(select count(*) from  #properties
			where prop_inactive_dt is not null )
				

	if (@deleted_prop > 0)
	begin
		select 
			prop_id,
			geo_id,
			@validationYear year,
			'This is a deleted property'  message,
			prop_inactive_dt
			from #properties
		where prop_inactive_dt is not null
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
		#properties.prop_id, 
		
		td.location_code, td.tax_district_type_cd, td.tax_district_id,
		pv.prop_val_yr, pv.sup_num
	from #properties  with(nolock)
	join property_val pv with(nolock)
		on pv.prop_id = #properties.prop_id	
	join property p with(nolock)
		on p.prop_id = pv.prop_id	
	join property_tax_area pta with(nolock)
		on	pta.prop_id = pv.prop_id
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
		where wpotda.year = @validationYear and psa.owner_tax_yr = @validationYear
		group by wpotda.prop_id,  wpotda.year, wpotda.sup_num, wpotda.tax_district_id		
	) as wpotda_minOwner
		on  wpotda_minOwner.prop_id = pv.prop_id
		and wpotda_minOwner.year = pv.prop_val_yr
		and wpotda_minOwner.sup_num = pv.sup_num
		 
	join tax_district td with(nolock)
		on td.tax_district_id = wpotda_minOwner.tax_district_id
		and isnull(td.location_code, '') <> ''	
	where (pv.prop_val_yr = @validationYear) and (#properties.error is null)            
	order by tax_district_type_cd, location_code asc
	----pv.prop_val_yr, tax_district_type_cd, location_code, prop_id
	


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
	set 
	geo_id =  
		(select geo_id from #properties 
			where #properties.prop_id = #propertyValidation.prop_id),
	urban_growth_cd =  
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
			BEGIN
				---- City or County location does not match
				update #propertyValidation
				set error = 'Location Code: ' + @firstLocation + ' Do not Match. Multiple properties are only allowed where the resulting distribution of funds is consistent; i.e. City or County.'
				where #propertyValidation.location_code = @firstLocation		
			END		
	
		END
		---- validate urban_growth_cd
		declare @ugacount int	
		select @ugacount = count(*) from 
			(select urban_growth_cd from  #propertyValidation
				where urban_growth_cd is not null  
				group by urban_growth_cd) as i


		if @ugacount > 1
		BEGIN
			update #propertyValidation
			set error = 
			case when (#propertyValidation.error is null) 
				then 'Urban Growth Codes do not match.'
			else 
				(#propertyValidation.error  + '  Urban Growth Codes do not match.')
			END  
		END
	END

	---- add error for non-exist properties
	insert into #propertyValidation(
		prop_id, geo_id, error)
	select prop_id, geo_id, error
	from #properties
	where #properties.error is not null


set nocount off

		
select 
	prop_id, 
	geo_id,
	prop_val_yr,
	location_code,
	tax_district_id,
	tax_district_type_cd,
	--is_city, 
	tax_area_id, 
	tax_area_number,
	urban_growth_cd,
	error
from #propertyValidation
order by prop_id , location_code
	
	
	
drop table #properties
drop table #propertyValidation

END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalPropertyValidate] TO PUBLIC
    AS [dbo];


GO

