
create procedure LayerCopyIncome
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int

as

DECLARE @StartProc datetime
DECLARE @cur_income_id int
DECLARE @active_valuation varchar(1)

set nocount on

/*
 * Do NOT allow the copy of Income Valuation data from one property to another.  This
 * is NOT supported.  So far the only 2 procedures that call this are:
 *
 * CreatePropertySupplementLayer
 * CreateFutureYearPropertyLayer
 *
 */
 
 if @lPropID_From = @lPropID_To
 begin
 
	/*
	 * First, since this is being done from the Property level, get all the income_id's
	 * for that Property, Year and Sup Num combination
	 */


		-- INCOME logic neccessitates some information be backed up as it is lost during the CREATE/DELETE move to Supplement group process
		-- Design is as follows:
		--	remove any duplicate data in the staging table
		--	stage the income_land_detail_assoc data for all properties UNLESS it is the main property (identified in income_prop_assoc)
		--	ONLY ON MOVES, when the main property is being processed copy the staged data in to income_land_detail_assoc with the new sup_num
		--	clean up the staged table
	if exists (select * from income_land_detail_assoc_supplement_staging where prop_id = @lPropID_From and income_yr = @lYear_From and sup_num = @lSupNum_From)
		delete from income_land_detail_assoc_supplement_staging where prop_id = @lPropID_From and income_yr = @lYear_From and sup_num = @lSupNum_From

	insert into income_land_detail_assoc_supplement_staging
		select ilda.income_yr, ilda.sup_num, ilda.income_id, ilda.prop_id, ilda.land_seg_id, ilda.included, ilda.value  
		from income_land_detail_assoc as ilda with (nolock)
		left join income_prop_assoc as ipa with(nolock)
		on ilda.prop_id=ipa.prop_id and ilda.income_yr=ipa.prop_val_yr and ilda.sup_num=ipa.sup_num
		where ilda.income_yr = @lYear_From
		and ilda.sup_num = @lSupNum_From
		and ilda.prop_id = @lPropID_From 
		and ipa.prop_id Is Null

	 
	 declare @income_id_table table (income_id int primary key, active_valuation varchar(1))
	 
	 insert @income_id_table
	 (income_id, active_valuation)
	 select income_id, active_valuation 
	 from income_prop_assoc as ipa
	 with (nolock)
	 where prop_val_yr = @lYear_From
	 and sup_num = @lSupNum_From
	 and prop_id = @lPropID_From
	 
	 /*
		* Next, copy each Income Valuation, one at a time.
		*/
	  
		declare curIncome cursor fast_forward
		for select income_id, active_valuation 
				from @income_id_table
				order by income_id
				
		open curIncome
		
		fetch next from curIncome into @cur_income_id, @active_valuation 
		
		while @@fetch_status = 0
		begin

			-- NOTE:  As multiple properties can share the same Income Valuation, it is possible that the
			--				Income Valuation already exists.  The below procedure will check the existence first
			--				and only create the copy if it needs to.
			
			exec IncomeCreateCopy @cur_income_id, @lSupNum_From, @lYear_From, @cur_income_id, @lSupNum_To, @lYear_To, @active_valuation

			insert into income_land_detail_assoc
				select ildass.income_yr, @lSupNum_To, ildass.income_id, ildass.prop_id, ildass.land_seg_id, ildass.included, ildass.value  
				from income_land_detail_assoc_supplement_staging as ildass with (nolock)
			
				---- join table land_detail to prevent FOREIGN KEY constraint error - [CFK_income_land_detail_assoc_land_detail]
				join land_detail as ld with (nolock) 
					on	ld.prop_val_yr = ildass.income_yr
					and ld.sup_num = @lSupNum_To
					and ld.sale_id = ildass.sale_id
					and	ld.prop_id = ildass.prop_id 
					and ld.land_seg_id = ildass.land_seg_id
				
				--- join table income to prevent FOREIGN KEY constraint error - [CFK_income_land_detail_assoc_income]
				join income as i with (nolock)  
					on	i.income_yr = ildass.income_yr
					and i.sup_num = @lSupNum_To
					and i.income_id = ildass.income_id

				left join income_land_detail_assoc ilda
				on ildass.prop_id=ilda.prop_id and ildass.income_yr=ilda.income_yr and ildass.sup_num=ilda.sup_num and ildass.income_id=ilda.income_id
				where ildass.income_yr = @lYear_From 
				and ildass.sup_num = @lSupNum_From
				and ilda.prop_id Is Null

			delete 
				from income_land_detail_assoc_supplement_staging
				where income_yr = @lYear_From 
				and sup_num = @lSupNum_From
				and income_id = @cur_income_id
			
			fetch next from curIncome into @cur_income_id, @active_valuation 
		end
		
		close curIncome
		deallocate curIncome
	end
	
	-- Income Characteristics are NOT linked to an Income Valuation.  It's a misnomer.  However,
	-- as this is a "property-level" copy process, make sure to copy then Income Characteristics
	-- data as well.
	
	insert dbo.property_income_characteristic with(rowlock) 
	(
		year,
		sup_num,
		prop_id,
		pic_id,
		type,
		owner_occupied,
		survey_date,
		situs,
		contact_name,
		contact_phone,
		vacancy_rate,
		num_rooms,
		potential_gross_income,
		actual_gross_income,
		misc_income,
		comment,
		unusual_income,
		unusual_expense,
		unusual_expense_reason,
		other_issues,
		total_num_units,
		total_num_units_override,
		property_name
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		pic_id,
		type,
		owner_occupied,
		survey_date,
		situs,
		contact_name,
		contact_phone,
		vacancy_rate,
		num_rooms,
		potential_gross_income,
		actual_gross_income,
		misc_income,
		comment,
		unusual_income,
		unusual_expense,
		unusual_expense_reason,
		other_issues,
		total_num_units,
		total_num_units_override,
		property_name
	from dbo.property_income_characteristic with(nolock)
	where
		year = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From
	
	-- Only if the property_income_characteristic rows were copied
	-- could there be any rows in the below tables
	if ( @@rowcount > 0 )
	begin
		insert dbo.property_income_characteristic_amount with(rowlock) 
		(
			year,
			sup_num,
			prop_id,
			pic_id,
			code,
			quality,
			type
		)
		select
			@lYear_To,
			@lSupNum_To,
			@lPropID_To,
			pic_id,
			code,
			quality,
			type
		from dbo.property_income_characteristic_amount with(nolock)
		where
			year = @lYear_From and
			sup_num = @lSupNum_From and
			prop_id = @lPropID_From


		insert dbo.property_income_characteristic_tenant with(rowlock) 
		(
			year,
			sup_num,
			prop_id,
			pic_id,
			tenant_id,
			tenant_name,
			lease_begin_date,
			lease_end_date,
			sqft_occupancy,
			base_rent_per_month,
			base_rent_per_year,
			indicated_rent_per_sqft,
			monthly_cam_per_sqft,
			water_sewer,
			garbage,
			electricity,
			heat,
			gas,
			real_estate_taxes,
			fire_insurance,
			other
		)
		select
			@lYear_To,
			@lSupNum_To,
			@lPropID_To,
			pic_id,
			tenant_id,
			tenant_name,
			lease_begin_date,
			lease_end_date,
			sqft_occupancy,
			base_rent_per_month,
			base_rent_per_year,
			indicated_rent_per_sqft,
			monthly_cam_per_sqft,
			water_sewer,
			garbage,
			electricity,
			heat,
			gas,
			real_estate_taxes,
			fire_insurance,
			other
		from dbo.property_income_characteristic_tenant with(nolock)
		where
			year = @lYear_From and
			sup_num = @lSupNum_From and
			prop_id = @lPropID_From


		insert dbo.property_income_characteristic_unit_mix with(rowlock) 
		(
			year,
			sup_num,
			prop_id,
			pic_id,
			unit_mix_id,
			num_units,
			unit_type,
			baths,
			style,
			size_sqft,
			rent_per_unit,
			num_spaces,
			rent_per_space,
			gross_monthly_rent,
			special_program_unit,
			water_sewer,
			garbage,
			electricity,
			heat,
			cable,
			carport_garage_in_rent,
			other
		)
		select
			@lYear_To,
			@lSupNum_To,
			@lPropID_To,
			pic_id,
			unit_mix_id,
			num_units,
			unit_type,
			baths,
			style,
			size_sqft,
			rent_per_unit,
			num_spaces,
			rent_per_space,
			gross_monthly_rent,
			special_program_unit,
			water_sewer,
			garbage,
			electricity,
			heat,
			cable,
			carport_garage_in_rent,
			other
		from dbo.property_income_characteristic_unit_mix with(nolock)
		where
			year = @lYear_From and
			sup_num = @lSupNum_From and
			prop_id = @lPropID_From
	end
	
	return(0)

GO

