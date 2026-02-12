


CREATE procedure SetRollExemptionFromExemptionReset
@input_tax_yr	numeric(4)

as

declare @prop_id	int
declare @owner_id	int
declare @exmpt_type_cd  varchar(5)
declare @prev_prop_id	int
declare @prev_owner_id	int
declare @str_exemption  varchar(500)
declare @effective_dt	datetime
declare @termination_dt datetime

select @prev_prop_id  = 0
select @prev_owner_id = 0

update owner set roll_exemption = NULL from property, prop_supp_assoc
where owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
and owner.sup_num = prop_supp_assoc.sup_num
and owner.prop_id = prop_supp_assoc.prop_id
and owner.prop_id = property.prop_id
and property.exmpt_reset = 'T'
and owner.owner_tax_yr = @input_tax_yr


declare property_exemption_cursor SCROLL CURSOR
FOR select property_exemption.prop_id,
	   property_exemption.owner_id,
	   property_exemption.exmpt_type_cd,
	   property_exemption.effective_dt,
	   property_exemption.termination_dt
	from prop_supp_assoc, property, property_exemption
    	where property_exemption.owner_tax_yr = prop_supp_assoc.owner_tax_yr
	and property_exemption.sup_num = prop_supp_assoc.sup_num
	and property_exemption.prop_id = prop_supp_assoc.prop_id
	and property_exemption.prop_id = property.prop_id
	and property.exmpt_reset = 'T'
	and property_exemption.owner_tax_yr = @input_tax_yr
	order by exmpt_type_cd
  
OPEN property_exemption_cursor
FETCH NEXT from property_exemption_cursor into @prop_id, @owner_id, @exmpt_type_cd, @effective_dt, @termination_dt

while (@@FETCH_STATUS = 0)
begin
	select @str_exemption = roll_exemption from owner, prop_supp_assoc, property
	where owner.prop_id	 = prop_supp_assoc.prop_id
	and   owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
	and   owner.sup_num      = prop_supp_assoc.sup_num
        and   owner.prop_id      = property.prop_id
	and   property.exmpt_reset = 'T'
	and   owner.owner_tax_yr = @input_tax_yr
	and   owner.prop_id      = @prop_id
	and   owner.owner_id     = @owner_id

	if (@str_exemption is null)
	begin
		select @str_exemption = RTRIM(@exmpt_type_cd)
	end
	else
	begin
		select @str_exemption = @str_exemption + ', ' + RTRIM(@exmpt_type_cd)

		if ((@exmpt_type_cd = 'OV65') and (@effective_dt is not null))
		begin
			select @str_exemption = @str_exemption + ' (Prorated from ' + CONVERT(varchar(50), @effective_dt, 101)
		end

		if ((@exmpt_type_cd = 'OV65') and (@termination_dt is not null))
		begin
			if (@effective_dt is null)
			begin
				select @str_exemption = @str_exemption + ' (Prorated to '
			end
			else
			begin
				select @str_exemption = @str_exemption + ' to '
			end

			select @str_exemption = @str_exemption + CONVERT(varchar(50), @termination_dt, 101) + ')'
		end
	end

	update owner set roll_exemption = @str_exemption from prop_supp_assoc, property
	where owner.prop_id	 = prop_supp_assoc.prop_id
	and   owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
	and   owner.sup_num      = prop_supp_assoc.sup_num
        and   owner.prop_id      = property.prop_id
	and   property.exmpt_reset = 'T'
	and   owner.owner_tax_yr = @input_tax_yr
	and   owner.prop_id      = @prop_id
	and   owner.owner_id     = @owner_id
	

	FETCH NEXT from property_exemption_cursor into @prop_id, @owner_id, @exmpt_type_cd, @effective_dt, @termination_dt

end

CLOSE property_exemption_cursor
DEALLOCATE property_exemption_cursor

GO

