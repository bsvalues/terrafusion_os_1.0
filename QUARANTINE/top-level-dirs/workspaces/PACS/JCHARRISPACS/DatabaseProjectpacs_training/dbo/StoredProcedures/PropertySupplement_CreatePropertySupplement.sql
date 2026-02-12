
create procedure dbo.PropertySupplement_CreatePropertySupplement
	@input_prop_id int,
	@input_current_supp int,
	@input_tax_yr numeric(4,0),
	@input_new_supp int,
	@input_new_yr numeric(4,0),
	@input_new_prop_id int = @input_prop_id,
	@input_from_supp char(1) = 'F',
	@input_new_lease_id varchar(20) = '',
 	@split_merge_flag bit = 0,
	@udi_supplement char(1) = 'F',
	@szPropType char(5) = null, -- If the caller knows the value, it should be passed so this sp doesn't have to query for it
	@bCopyImprvLandSalesInfo bit = 0 -- If set to 1, then LayerCopyImprovement/Land will copy sale_id records too.
as

set nocount on


declare @current_sup_num int

select
	@current_sup_num = psa.sup_num
from
	dbo.prop_supp_assoc as psa with (nolock)
where
	psa.prop_id = @input_new_prop_id
and	psa.owner_tax_yr = @input_new_yr

set @current_sup_num = isnull(@current_sup_num, 0)


exec CreatePropertySupplementLayer @input_prop_id, @input_current_supp, @input_tax_yr, @input_new_supp, @input_new_yr, @input_new_prop_id, @input_from_supp, @input_new_lease_id, @split_merge_flag, 0, @szPropType, 0, @bCopyImprvLandSalesInfo


if not exists
(
	select
		*
	from
		dbo.situs as s with (nolock)
	where
		s.prop_id = @input_new_prop_id
)
begin
	insert into
		situs
	(
		prop_id,
		situs_id,
		primary_situs,
		situs_num,
		situs_street_prefx,
		situs_street,
		situs_street_sufix,
		situs_unit,
		situs_city,
		situs_state,
		situs_zip
	)
	select
		@input_new_prop_id,
		situs_id,
		primary_situs,
		situs_num,
		situs_street_prefx,
		situs_street,
		situs_street_sufix,
		situs_unit,
		situs_city,
		situs_state,
		situs_zip
	from
		dbo.situs as s with (nolock)
	where
		s.prop_id = @input_prop_id
end


declare @udi_parent varchar(1)

select
	@udi_parent = pv.udi_parent
from
	dbo.property_val as pv with (nolock)
where
	pv.prop_id = @input_new_prop_id
and	pv.prop_val_yr = @input_new_yr
and	pv.sup_num = @input_new_supp


if (isnull(@udi_parent, '') in ('D', 'T'))
begin
	declare @child_sup_cd varchar(6)

	select
		@child_sup_cd = ltrim(rtrim(uss.sup_type_cd))
	from
		dbo.udi_system_settings as uss with (nolock)
	where
		uss.id = 1


	-- copy child properties (if current supplement is 'from' supplement)
	declare child_property_cursor cursor
	for
	select
		pv.prop_id,
		pv.udi_status
	from
		dbo.property_val as pv with (nolock)
	inner join
		dbo.prop_supp_assoc as psa with (nolock)
	on
		psa.prop_id = pv.prop_id
	and	psa.owner_tax_yr = pv.prop_val_yr
	and	psa.sup_num = pv.sup_num
	where
		pv.udi_parent_prop_id = @input_prop_id
	and	pv.prop_val_yr = @input_tax_yr
	and	pv.sup_num = @input_current_supp
	and	pv.prop_inactive_dt is null
	for read only


	declare @child_prop_id int
	declare @child_prop_status varchar(5)

	declare @exists_in_year bit
	set @exists_in_year = 1


	-- same property but different year
	if ((@input_prop_id = @input_new_prop_id) and (@input_tax_yr <> @input_new_yr))
	begin
		declare @new_yr_udi_parent varchar(1)

		select
			@new_yr_udi_parent = udi_parent
		from
			dbo.property_val with (nolock)
		where
			prop_id = @input_new_prop_id
		and	prop_val_yr = @input_new_yr
		and	sup_num = @current_sup_num

		set @new_yr_udi_parent = isnull(@new_yr_udi_parent, '')


		open child_property_cursor

		fetch next from
			child_property_cursor
		into
			@child_prop_id,
			@child_prop_status


		while (@@fetch_status = 0)
		begin
			if (@child_prop_status = 'S')
			begin
				delete
					dbo.owner with (rowlock)
				where
					prop_id = @input_new_prop_id
				and	owner_tax_yr = @input_new_yr
				and	sup_num = @input_new_supp
				and	udi_child_prop_id = @child_prop_id
			end
			else
			begin
				set @exists_in_year = 1
	

				if (@udi_supplement = 'T')
				begin
					if not exists
					(
						select
							*
						from
							dbo.property_val with (nolock)
						where
							prop_id = @child_prop_id
						and	prop_val_yr = @input_new_yr
					)
					begin
						set @exists_in_year = 0
					end
				end
	

				exec dbo.CreatePropertySupplementLayer @child_prop_id, @input_current_supp, @input_tax_yr, @input_new_supp, @input_new_yr, @child_prop_id, @input_from_supp, @input_new_lease_id, @split_merge_flag, 0, @szPropType, 0, @bCopyImprvLandSalesInfo


				update
					dbo.property_val with (rowlock)
				set
					udi_parent_prop_id = @input_new_prop_id
				where
					prop_id = @child_prop_id
				and	prop_val_yr = @input_new_yr
				and	sup_num = @input_new_supp


				if (@udi_supplement = 'T')
				begin
					update
						dbo.property_val with (rowlock)
					set
						sup_action = case when prop_inactive_dt is not null then 'D' when @exists_in_year = 1 then 'M' else 'A' end,
						sup_cd = @child_sup_cd,
						sup_dt = GetDate(),
						sup_desc = 'UDI Supplement'
					where
						prop_id = @child_prop_id
					and	prop_val_yr = @input_new_yr
					and	sup_num = @input_new_supp
				end
			end


			fetch next from
				child_property_cursor
			into
				@child_prop_id,
				@child_prop_status
		end


		close child_property_cursor


		-- Check to see if it is possible that there are owner differences.
		-- If so, copy deleted owner properties to the supplemented parent property.
		if (((@udi_parent = '') and (@new_yr_udi_parent in ('D', 'T'))) or ((@udi_parent in ('D', 'T')) and (@new_yr_udi_parent in ('D', 'T'))))
		begin
			declare prev_year_child_property_id_cursor cursor
			for
			select
				udi_child_prop_id
			from
				dbo.owner with (nolock)
			where
				prop_id = @input_prop_id
			and	owner_tax_yr = @input_new_yr
			and	sup_num = @current_sup_num
			for read only


			declare @prev_year_child_prop_id int


			open prev_year_child_property_id_cursor

			fetch next from
				prev_year_child_property_id_cursor
			into
				@prev_year_child_prop_id
	

			while (@@fetch_status = 0)
			begin
				if not exists
				(
					select
						*
					from
						dbo.property_val with (nolock)
					where
						prop_id = @prev_year_child_prop_id
					and	prop_val_yr = @input_new_yr
					and	sup_num = @input_new_supp
				)
				begin
					if exists
					(
						select
							*
						from
							dbo.property_val with (nolock)
						where
							prop_id = @prev_year_child_prop_id
						and	prop_val_yr = @input_new_yr
						and	sup_num = @current_sup_num
					)
					begin
						-- supplement the child property for the owner that was deleted in the new year
						exec dbo.CreatePropertySupplementLayer @prev_year_child_prop_id, @current_sup_num, @input_new_yr, @input_new_supp, @input_new_yr, @prev_year_child_prop_id, @input_from_supp, @input_new_lease_id, @split_merge_flag, 0, @szPropType, 0, @bCopyImprvLandSalesInfo
					end


					-- if the child supplemented - mark it as deleted
					if exists
					(
						select
							*
						from
							dbo.property_val with (nolock)
						where
							prop_id = @prev_year_child_prop_id
						and	prop_val_yr = @input_new_yr
						and	sup_num = @input_new_supp
					)
					begin
						update
							dbo.property_val with (rowlock)
						set
							prop_inactive_dt = getdate(),
							sup_action = 'D',
							sup_cd = @child_sup_cd,
							sup_dt = GetDate(),
							sup_desc = 'UDI Supplement'
					   	where
							prop_id = @prev_year_child_prop_id
						and	prop_val_yr = @input_new_yr
						and	sup_num = @input_new_supp
					end
				end
		

				fetch next from
					prev_year_child_property_id_cursor
				into
					@prev_year_child_prop_id
			end


			close prev_year_child_property_id_cursor
			deallocate prev_year_child_property_id_cursor
		end
	end
	else
	-- (a) same property, same year; or (b) different property
	begin
		open child_property_cursor

		fetch next from
			child_property_cursor
		into
			@child_prop_id,
			@child_prop_status


		while (@@fetch_status = 0)
		begin
			declare @next_child_id int
			
			if (@input_prop_id <> @input_new_prop_id)
			begin
				exec dbo.GetUniqueID 'property', @next_child_id output, 1, 0
			end
			else
			begin
				set @next_child_id = @child_prop_id
			end


			set @exists_in_year = 1


			if (@udi_supplement = 'T')
			begin
				if not exists
				(
					select
						*
					from
						dbo.property_val with (nolock)
					where
						prop_id = @child_prop_id
					and	prop_val_yr = @input_new_yr
				)
				begin
					set @exists_in_year = 0
				end
			end


			exec dbo.CreatePropertySupplementLayer @child_prop_id, @input_current_supp, @input_tax_yr, @input_new_supp, @input_new_yr, @next_child_id, @input_from_supp, @input_new_lease_id, @split_merge_flag, 0, @szPropType, 0, @bCopyImprvLandSalesInfo


			if (@udi_supplement = 'T')
			begin
				update
					dbo.property_val with (rowlock)
				set
					sup_action = case when prop_inactive_dt is not null then 'D' when @exists_in_year = 1 then 'M' else 'A' end,
					sup_cd = @child_sup_cd,
					sup_dt = GetDate(),
					sup_desc = 'UDI Supplement'
				where
					prop_id = @next_child_id
				and	prop_val_yr = @input_new_yr
				and	sup_num = @input_new_supp
			end


			update
				dbo.property_val with (rowlock)
			set
				udi_parent_prop_id = @input_new_prop_id
			where
				prop_id = @next_child_id
			and	prop_val_yr = @input_new_yr
			and	sup_num = @input_new_supp


			update
				dbo.owner with(rowlock)
			set
				udi_child_prop_id = @next_child_id
			where
				prop_id = @input_new_prop_id
			and	owner_tax_yr = @input_new_yr
			and	sup_num = @input_new_supp
			and	udi_child_prop_id = @child_prop_id


			if not exists
			(
				select
					*
				from
					dbo.situs as s with (nolock)
				where
					s.prop_id = @next_child_id
			)
			begin
				insert into
					situs
				(
					prop_id,
					situs_id,
					primary_situs,
					situs_num,
					situs_street_prefx,
					situs_street,
					situs_street_sufix,
					situs_unit,
					situs_city,
					situs_state,
					situs_zip
				)
				select
					@next_child_id,
					situs_id,
					primary_situs,
					situs_num,
					situs_street_prefx,
					situs_street,
					situs_street_sufix,
					situs_unit,
					situs_city,
					situs_state,
					situs_zip
				from
					dbo.situs as s with (nolock)
				where
					s.prop_id = @child_prop_id
			end


			fetch next from
				child_property_cursor
			into
				@child_prop_id,
				@child_prop_status
		end

		close child_property_cursor
	end

	deallocate child_property_cursor
end

GO

