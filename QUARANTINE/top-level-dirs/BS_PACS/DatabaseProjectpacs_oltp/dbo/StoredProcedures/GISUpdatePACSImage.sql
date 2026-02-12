
create procedure dbo.GISUpdatePACSImage

	@action varchar(10),
	@prop_id int,
	@year numeric(4,0),
	@image_type char(10),
	@sub_type char(10),
	@pacs_user_name varchar(20) = '',
	@image_id int = 0,
	@location varchar(255) = '',
	@scan_date datetime = null,
	@comment varchar(255) = null,
	@image_date datetime = null,
	@expiration_date datetime = '12/31/9999',
	@main_image bit = 0,
	@rec_type char(10),
	@imprv_id int=0
	


as
SET NOCOUNT ON
declare @new_subdir varchar(4000)
declare @new_basedir varchar(4000)
declare @pacs_user_id int

set @pacs_user_id = -999

select @pacs_user_id = pacs_user_id
from pacs_user
with (nolock)
where pacs_user_name = @pacs_user_name

if @scan_date = null
begin
	set @scan_date = getdate()
end

-- remove non printable characters from fields
select @image_type = dbo.fn_RemoveNonASCII(@image_type)
select @sub_type = dbo.fn_RemoveNonASCII(@sub_type)
select @comment = dbo.fn_RemoveNonASCII(@comment)
select @rec_type = dbo.fn_RemoveNonASCII(@rec_type)


if @action = 'Update'
begin
	if len(@location) > 0 and len(@image_type) > 0 and len(@sub_type) > 0 and len(@rec_type) > 0
	begin
		-- update the specified image.
		if @image_id > 0
		begin

			if @imprv_id = 0
			begin
				update pacs_image
				set image_type = @image_type,
					location = @location,
					image_nm = substring(@location, len(@location) - charindex('\', reverse(@location), 1) +2, len(@location)),
					sub_type = @sub_type,
					scan_dt = @scan_date,
					comment = @comment,
					image_dt = @image_date,
					expiration_dt = @expiration_date,
					rec_type = @rec_type,
					ref_id1 = 0,
					ref_id2 = 0,
					ref_id3 = 0,
					main = @main_image
				where image_id = @image_id
				and ref_id = @prop_id
				and ref_type = 'P'
			end
			else
			begin
				update pacs_image
				set image_type = @image_type,
					location = @location,
					image_nm = substring(@location, len(@location) - charindex('\', reverse(@location), 1) +2, len(@location)),
					sub_type = @sub_type,
					scan_dt = @scan_date,
					comment = @comment,
					image_dt = @image_date,
					expiration_dt = @expiration_date,
					rec_type = @rec_type,
					ref_id2 = 0,
					ref_id3 = 0,
					main = @main_image
				where image_id = @image_id
				and ref_id = @prop_id
				and ref_id1 = @imprv_id
				and ref_type = 'PI'				
			end
			
			if @main_image = 1
			begin
				update property_val
				set image_path = @location
				from property_val as pv
				join prop_supp_assoc as psa
				with (nolock)
				on pv.prop_val_yr = psa.owner_tax_yr
				and pv.sup_num = psa.sup_num
				and pv.prop_id = psa.prop_id
				where pv.prop_val_yr = @year
				and pv.prop_id = @prop_id
			end
		end
		else if @pacs_user_id > 0
		begin
			set @image_id = -1

			exec GetNextImageIDOutput @new_subdir output, @image_id output, @new_basedir output

			if @image_id > 0
			begin

				if @imprv_id = 0
				begin
					insert pacs_image
					(image_id, image_type, location, image_nm, scan_dt, expiration_dt, sub_type, rec_type, eff_yr,
					 comment, image_dt, pacs_user_id, ref_id, ref_type, ref_year, role_attribute_id,ref_id1,ref_id2,ref_id3,main)
					values
					(@image_id, @image_type, @location,
					substring(@location, len(@location) - charindex('\', reverse(@location), 1) +2, len(@location)),
					@scan_date, @expiration_date, @sub_type, @rec_type, @year, @comment, @image_date, @pacs_user_id,
					@prop_id, 'P', @year, 0,0,0,0,@main_image)
				end
				else
				begin
					insert pacs_image
					(image_id, image_type, location, image_nm, scan_dt, expiration_dt, sub_type, rec_type, eff_yr,
					 comment, image_dt, pacs_user_id, ref_id, ref_type, ref_year, role_attribute_id,ref_id1,ref_id2,ref_id3,main)	
					values
					(@image_id, @image_type, @location,
					substring(@location, len(@location) - charindex('\', reverse(@location), 1) +2, len(@location)),
					@scan_date, @expiration_date, @sub_type, @rec_type, @year, @comment, @image_date, @pacs_user_id,
					@prop_id, 'PI', @year, 0,@imprv_id,0,0,@main_image)
				end
				
				if @main_image = 1
				begin
					update property_val
					set image_path = @location
					from property_val as pv
					join prop_supp_assoc as psa
					with (nolock)
					on pv.prop_val_yr = psa.owner_tax_yr
					and pv.sup_num = psa.sup_num
					and pv.prop_id = psa.prop_id
					where pv.prop_val_yr = @year
					and pv.prop_id = @prop_id
				end
			end
		end
		else
		begin
			print 'Please enter your PACS username correctly.'
		end
	end
	else
	begin
		print 'Please make sure you have entered values for location, image_type and sub_type'
	end
end
else if @action = 'Delete' and @image_id > 0
begin
	update pacs_image
	set expiration_dt = @expiration_date
	   ,main = 0
	where image_id = @image_id
	and ref_id = @prop_id
	and ref_type = 'P'
	and image_type = @image_type
	and sub_type = @sub_type
end

GO

