
----------------------------------------------------------------------------------------------------
-- Returns a table listing the year, prop_id, and effective tax_area_id (similar to 
-- property_tax_area) given a particular 'As Of' date and based on either the current tax area 
-- associated with the property or the pending tax area associated with the property thru the most 
-- recently active annexation property based on the 'As Of' date and when funds were diverted
----------------------------------------------------------------------------------------------------
CREATE FUNCTION dbo.fn_TaxAreaId_ReturnTable
(
	@balance_dt datetime,
	@year numeric(4, 0) = null,
	@prop_id int = null
)
RETURNS @TaxArea Table (year numeric(4,0),prop_id int, tax_area_id int)

Begin

	-- create a 'working' table that we can update with data
	Declare  @working TABLE
	(
		[year] numeric(4, 0),
		prop_id int,
		sup_num int,
		annexation_id int,
		tax_area_id int
	)

	if (@year is null and @prop_id is null)
	begin
		if not exists (select * from batch_close_input where spid = @@spid)
		begin
			-- assume data in property_tax_area is correct for the moment
			insert into @working 
				([year], prop_id, sup_num)
			select 
				pta.[year], pta.prop_id, max(pta.sup_num)
			from property_tax_area as pta with(nolock)
			group by pta.year, pta.prop_id
			order by pta.[year], pta.prop_id
		end
		else
		begin
			-- assume data in property_tax_area is correct for the moment
			insert into @working 
				([year], prop_id, sup_num)
			select 
				pta.[year], pta.prop_id, max(pta.sup_num)
			from property_tax_area as pta with(nolock)
			join batch_close_input as bci with (nolock) on
					bci.[year] = pta.[year]
				and bci.prop_id = pta.prop_id
				and bci.spid = @@spid
			group by pta.year, pta.prop_id
			order by pta.[year], pta.prop_id
		end
	end
	else if (@year is not null and @prop_id is null)
	begin
		-- assume data in property_tax_area is correct for the moment
		insert into @working 
			([year], prop_id, sup_num)
		select 
			pta.[year], pta.prop_id, max(pta.sup_num)
		from property_tax_area as pta with(nolock)
		where pta.[year] = @year
		group by pta.year, pta.prop_id
		order by pta.[year], pta.prop_id
	end
	else if (@year is null and @prop_id is not null)
	begin
		-- assume data in property_tax_area is correct for the moment
		insert into @working 
			([year], prop_id, sup_num)
		select 
			pta.[year], pta.prop_id, max(pta.sup_num)
		from property_tax_area as pta with(nolock)
		where pta.prop_id = @prop_id
		group by pta.year, pta.prop_id
		order by pta.[year], pta.prop_id
	end
	else if (@year is not null and @prop_id is not null)
	begin
		-- assume data in property_tax_area is correct for the moment
		insert into @working 
			([year], prop_id, sup_num)
		select 
			pta.[year], pta.prop_id, max(pta.sup_num)
		from property_tax_area as pta with(nolock)
		where pta.[year] = @year and pta.prop_id = @prop_id
		group by pta.year, pta.prop_id
		order by pta.[year], pta.prop_id
	end

	update @working set
		tax_area_id = pta.tax_area_id
	from @working w
	join property_tax_area as pta with (nolock) on
			pta.[year] = w.[year]
		and pta.prop_id = w.prop_id
		and pta.sup_num = w.sup_num

	-- collect data for all accepted, diverted annexations in ascending order of 
	-- diversion batch balance date and update the working table tax_area_id
	-- with the effective tax area for each property involved in each annexation
	-- spanning the year(effective_date)-1 to start_year-1 of the annexation
	declare @temp table 
	(
		balance_dt datetime, 
		[year] numeric(4, 0), 
		prop_id int,
		tax_area_destination_id int
	)

    insert into @temp
		(balance_dt, [year], prop_id, tax_area_destination_id)
	select distinct 
		tmp.balance_dt, 
		pta.[year],
		pta.prop_id,
		tmp.tax_area_destination_id
	from @working as pta --with (nolock)
	join (	
		select 
			b.balance_dt,
			year(b.balance_dt) - 1 as begin_year,
			a.start_year - 1 as end_year, 
			apa.prop_id, 
			tam.tax_area_destination_id
		from annexation as a with (nolock)
		join annexation_property_assoc as apa with(nolock) on
			apa.annexation_id = a.annexation_id
		join batch as b with (nolock) on 
			b.batch_id = a.divert_funds_batch_id
		join tax_area_mapping as tam with (nolock) on
			tam.annexation_id = a.annexation_id
			and tam.tax_area_source_id = apa.tax_area_source_id
		where a.accept_date is not null -- Annexation is accepted
		and b.balance_dt <= @balance_dt
	) as tmp on
			tmp.prop_id = pta.prop_id
		and pta.[year] >= tmp.begin_year and pta.[year] <= tmp.end_year
	order by tmp.balance_dt


	-- update the working table  using the collected data
	update @working set
		tax_area_id = tmp2.tax_area_destination_id
	from @working w
	join (
		select max(balance_dt) as balance_dt, [year], prop_id
		from @temp 
		group by [year], prop_id
	) as tmp on 
			tmp.[year] = w.[year]
		and tmp.prop_id = w.prop_id
	join @temp as tmp2 on
			tmp2.balance_dt = tmp.balance_dt
		and tmp2.[year] = tmp.[year]
		and tmp2.prop_id = tmp.prop_id


	-- insert records into the return table
	insert into @TaxArea ([year], prop_id, tax_area_id)
	select distinct [year], prop_id, tax_area_id
	from @working

	Return
End

GO

