



CREATE PROCEDURE AutoBuildLegal
@input_prop_id	int,
@input_year	numeric(4)

AS

declare @abs_subdv_cd	varchar(10)
declare @abs_subdv_desc varchar(50)
declare @abs_subdv_ind	varchar(5)
declare @block		varchar(50)
declare @tract_lot	varchar(50)
declare @mh_space	varchar(50)
declare @legal_acreage	numeric(14,4)
declare @legal_2	varchar(255)
declare @mh_sn		varchar(100)
declare @mh_hud_num	varchar(100)
declare @mh_title_num	varchar(100)	
declare @legal		varchar(255)

--Initialize the legal description
select @legal = ''

--Populate variables
select  @abs_subdv_cd 	= property_val.abs_subdv_cd,
	@abs_subdv_desc = abs_subdv.abs_subdv_desc,
       	@abs_subdv_ind	= abs_subdv.abs_subdv_ind,
	@block		= property_val.block,
	@tract_lot	= property_val.tract_or_lot,
        @mh_space    	= property_val.mbl_hm_space,
 	@legal_acreage 	= property_val.legal_acreage,
       	@legal_2	= property_val.legal_desc_2
	from property_val, prop_supp_assoc, abs_subdv
	where property_val.prop_id 	= prop_supp_assoc.prop_id
	and   property_val.sup_num 	= prop_supp_assoc.sup_num
	and   property_val.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
	and   property_val.abs_subdv_cd = abs_subdv.abs_subdv_cd
	and   property_val.prop_val_yr	= abs_subdv.abs_subdv_yr
	and   property_val.prop_id 	= @input_prop_id
	and   property_val.prop_val_yr 	= @input_year

--Now build the legal description...
if (@abs_subdv_cd is not null)
begin
	select @abs_subdv_cd = RTRIM(@abs_subdv_cd)

	if (@abs_subdv_ind is not null)
	begin
		if (@abs_subdv_ind = 'A')
		begin
			select @legal = @legal + 'ABSTRACT ' + @abs_subdv_cd + ' ' + @abs_subdv_desc
		end
		else if (@abs_subdv_ind = 'S')
		begin
			select @legal = @legal + @abs_subdv_desc
		end
		else if (@abs_subdv_ind = 'M')
		begin
			select @legal = @legal + @abs_subdv_desc
		end
	end
end

if (@mh_space is not null)
begin
	if (@legal is not null)
	begin
		select @legal = @legal + ', SPACE '
	end
	else
	begin
		select @legal = @legal + 'SPACE '
	end

	select @legal = @legal + @mh_space
end

if (@block is not null)
begin
	if (@legal is not null)
	begin
		select @legal = @legal + ', BLOCK '
	end
	else
	begin
		select @legal = @legal + 'BLOCK '
	end

	select @legal = @legal + @block
end

if (@tract_lot is not null)
begin
	if (@abs_subdv_ind is not null)
	begin
		if (@abs_subdv_ind = 'A')
		begin
			if (@legal is not null)
			begin
				select @legal = @legal + ', TRACT '
			end
			else
			begin
				select @legal = @legal + 'TRACT '
			end
		end
		else if (@abs_subdv_ind = 'S')
		begin
			if (@legal is not null)
			begin
				select @legal = @legal + ', LOT '
			end
			else
			begin
				select @legal = @legal + 'LOT '
			end
		end
		else if (@abs_subdv_ind = 'M')
		begin
			if (@legal is not null)
			begin
				select @legal = @legal + ', TRACT '
			end
			else
			begin
				select @legal = @legal + 'TRACT '
			end
		end
	end
	else
	begin
		if (@legal is not null)
		begin
			select @legal = @legal + ', TRACT '
		end
		else
		begin
			select @legal = @legal + 'TRACT '
		end
	end

	select @legal = @legal + @tract_lot
end

if ((@legal_acreage is not null) and (@legal_acreage > 0))
begin
	if (@legal is not null)
	begin
		select @legal = @legal + ', ACRES '
	end
	else
	begin
		select @legal = @legal + 'ACRES '
	end

	select @legal = @legal + CONVERT(varchar(20), @legal_acreage)
end

if (@legal_2 is not null)
begin
	if (@legal is not null)
	begin
		select @legal = @legal + ', '
	end
	else
	begin
		select @legal = @legal + ' '
	end

	select @legal = @legal + @legal_2
end

--If the property has any mobile home improvements, add those...
if exists (select imprv_vw.* from imprv_vw, prop_supp_assoc
				where imprv_vw.prop_id 	 = @input_prop_id
				and imprv_vw.prop_val_yr = @input_year
				and imprv_vw.imprv_type_cd = 'M'
				and imprv_vw.prop_id 	 = prop_supp_assoc.prop_id
				and imprv_vw.prop_val_yr = prop_supp_assoc.owner_tax_yr
				and imprv_vw.sup_num	 = prop_supp_assoc.sup_num)
begin
	DECLARE MH_IMPRV SCROLL CURSOR
	FOR select imprv_vw.mbl_hm_sn, imprv_vw.mbl_hm_hud_num, imprv_vw.mbl_hm_title_num
	from imprv_vw, prop_supp_assoc
	where imprv_vw.prop_id 	 = @input_prop_id
	and imprv_vw.prop_val_yr = @input_year
	and imprv_vw.imprv_type_cd = 'M'
	and imprv_vw.prop_id 	 = prop_supp_assoc.prop_id
	and imprv_vw.prop_val_yr = prop_supp_assoc.owner_tax_yr
	and imprv_vw.sup_num	 = prop_supp_assoc.sup_num

	OPEN MH_IMPRV
	FETCH NEXT FROM MH_IMPRV into @mh_sn, @mh_hud_num, @mh_title_num

	while (@@FETCH_STATUS = 0)
	begin
		if (@mh_sn is not null)
		begin
			if (@legal is not null)
			begin
				select @legal = @legal + ', SN#: '
			end
			else
			begin
				select @legal = @legal + 'SN#: '
			end

			select @legal = @legal + @mh_sn
		end

		if (@mh_hud_num is not null)
		begin
			if (@legal is not null)
			begin
				select @legal = @legal + ', HUD#: '
			end
			else
			begin
				select @legal = @legal + 'HUD#: '
			end

			select @legal = @legal + @mh_hud_num
		end

		if (@mh_title_num is not null)
		begin
			if (@legal is not null)
			begin
				select @legal = @legal + ', TITLE#: '
			end
			else
			begin
				select @legal = @legal + 'TITLE#: '
			end

			select @legal = @legal + @mh_title_num
		end

		FETCH NEXT FROM MH_IMPRV into @mh_sn, @mh_hud_num, @mh_title_num
	end

	CLOSE MH_IMPRV
	DEALLOCATE MH_IMPRV
end

--Now update the property_val table with the new legal description
update property_val set legal_desc = @legal
from prop_supp_assoc
where property_val.prop_id 	= @input_prop_id
and   property_val.prop_val_yr 	= @input_year
and   property_val.prop_id 	= prop_supp_assoc.prop_id
and   property_val.prop_val_yr 	= prop_supp_assoc.owner_tax_yr
and   property_val.sup_num 	= prop_supp_assoc.sup_num

GO

