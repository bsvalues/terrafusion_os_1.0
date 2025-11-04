
create procedure GISUpdatePropertyCharacteristic
	@action char(1),  -- 'U' or 'D'
	@prop_id int,
	@characteristic_cd varchar(10),
	@attribute_cd varchar(20) 
as
	set nocount on

	-- Get the latest uncertified year layer
	declare @prop_val_yr numeric(4, 0)
	select @prop_val_yr = appr_yr from pacs_system with (nolock)

	-- Check for the existence of the property
	if not exists (select * from [property] with (nolock) where prop_id = @prop_id)
	begin
		return 1;
	end

	-- Check for existience in the current year layer 
	-- Note that an uncertified year is always at supplement zero until certification.
	if not exists 
		(select * from property_val with (nolock) 
		where	prop_id = @prop_id 
			and prop_val_yr = @prop_val_yr 
			and sup_num = 0
			and prop_inactive_dt is null)
	begin
		return 2;
	end

	-- If the action is 'D', then delete existing records matching the specified criteria
	if @action = 'D'
	begin
		delete from prop_characteristic_assoc
		where	prop_id = @prop_id 
			and prop_val_yr = @prop_val_yr 
			and sup_num = 0
			and characteristic_cd = @characteristic_cd
			and attribute_cd = @attribute_cd
	end
	else
	begin
		-- Ensure that the characteristic_cd, attribute_cd combination is allowed
		if not exists
			(select * from attribute_value_code with (nolock) 
			where	characteristic_cd = @characteristic_cd
				and attribute_cd = @attribute_cd)
		begin
			return 3;
		end

		-- if a matching record in prop_characteristic_assoc already exists, just return success
		if exists
			(select * from prop_characteristic_assoc with (nolock)
			where	prop_id = @prop_id 
				and prop_val_yr = @prop_val_yr 
				and sup_num = 0
				and characteristic_cd = @characteristic_cd
				and attribute_cd = @attribute_cd)
		begin
			return 0;
		end

		-- perform an update
		update prop_characteristic_assoc set 
			attribute_cd = @attribute_cd
		where	prop_id = @prop_id 
			and prop_val_yr = @prop_val_yr 
			and sup_num = 0
			and characteristic_cd = @characteristic_cd

		-- if no rows were affected, then perform an insert
		if @@rowcount = 0
		begin
			insert into prop_characteristic_assoc
			(prop_id, prop_val_yr, sup_num, characteristic_cd, attribute_cd)
			values
			(@prop_id, @prop_val_yr, 0, @characteristic_cd, @attribute_cd)
		end
	end	
	
	return 0;

GO

