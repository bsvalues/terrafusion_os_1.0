
CREATE PROCEDURE GetFeatureValue

	@prop_id		int, 
	@imprv_id		int, 
	@imprv_det_id	int, 
	@imprv_yr		numeric(4), 
	@sup_num		int,
	@sale_id		int,
	@imprv_det_class_cd	char(10), 
	@imprv_det_method_cd	char(5), 
	@imprv_det_type_cd	char(10), 
	@base_area		numeric(18,1), 
	@base_up		numeric(14,2), 
	@modify_up		char(1),
	@add_factor		numeric(14,4),
	@sum_feature_value	numeric(14) OUTPUT,
	@adj_up			numeric(14,2) OUTPUT

as

declare @imprv_attr_id		int
declare @i_attr_val_id 		int
declare @i_attr_val_cd		varchar(75)
declare @imprv_attr_up		numeric(14,2)
declare @imprv_attr_incr 	numeric(14)
declare @imprv_attr_pct		numeric(5,2)
declare @feature_value		numeric(14)
declare @use_up_for_pct_base	char(1)

/* initialize the output value */
set @sum_feature_value = 0
set @adj_up = @base_up

if (@modify_up is null)
begin
	set @modify_up = 'F'
end

SET NOCOUNT ON 

DECLARE IMPRV_DETAIL_ATTR SCROLL CURSOR
FOR select imprv_attr_id,
	   i_attr_val_id, 
	   i_attr_val_cd                                      
    from imprv_attr where imprv_attr.prop_id = @prop_id
    and  imprv_attr.imprv_id     = @imprv_id
    and  imprv_attr.imprv_det_id = @imprv_det_id
    and  imprv_attr.prop_val_yr  = @imprv_yr
    and  imprv_attr.sup_num      = @sup_num
    and  imprv_attr.sale_id      = @sale_id 

OPEN IMPRV_DETAIL_ATTR
FETCH NEXT FROM IMPRV_DETAIL_ATTR into @imprv_attr_id, @i_attr_val_id, @i_attr_val_cd

/* scroll through all the features associated with the improvement detail record */
while (@@FETCH_STATUS = 0)
begin
	set @feature_value = 0

	/* find the value for the feature from the schedule and sum it to the feature value */
	select  @imprv_attr_up       = imprv_attr_up,    
		@imprv_attr_incr     =  imprv_attr_incr,  
		@imprv_attr_pct      = imprv_attr_pct,
		@use_up_for_pct_base =  use_up_for_pct_base 
	from imprv_attr_val, imprv_sched_attr
	where  imprv_attr_val.imprv_attr_id      = @i_attr_val_id
	and   imprv_attr_val.imprv_attr_val_cd   = @i_attr_val_cd
	and   imprv_attr_val.imprv_yr		 = @imprv_yr
	and   imprv_attr_val. imprv_det_meth_cd  = @imprv_det_method_cd
	and   imprv_attr_val.imprv_det_type_cd   = @imprv_det_type_cd
	and   imprv_attr_val.imprv_det_class_cd  = @imprv_det_class_cd
	and  imprv_sched_attr.imprv_attr_id      = imprv_attr_val.imprv_attr_id
	and  imprv_sched_attr.imprv_yr           = imprv_attr_val.imprv_yr
	and  imprv_sched_attr.imprv_det_meth_cd  = imprv_attr_val.imprv_det_meth_cd
	and  imprv_sched_attr.imprv_det_type_cd  = imprv_attr_val.imprv_det_type_cd
	and  imprv_sched_attr.imprv_det_class_cd = imprv_attr_val.imprv_det_class_cd

	if (@@ROWCOUNT > 0)
	begin
		if (@imprv_attr_up is not null)
		begin
			if (@use_up_for_pct_base = 'T' and @modify_up = 'T')
			begin
				set @adj_up = @adj_up + @imprv_attr_up
			end
			else
			begin
				set @feature_value = (@imprv_attr_up * @base_area)
			end
		end
		else if (@imprv_attr_incr is not null)
		begin
			set @feature_value = @imprv_attr_incr
		end
		else if (@imprv_attr_pct is not null)
		begin
			set @feature_value = (@base_up * (@imprv_attr_pct/100))
		end
		else
		begin
			select @feature_value = 0
		end

		set @feature_value = @feature_value * @add_factor
	end


	/* update the attribute with the calculated value */
	update imprv_attr set imprv_attr_val = @feature_value                                
	where imprv_attr.prop_id       = @prop_id
	and   imprv_attr.imprv_id      = @imprv_id
	and   imprv_attr.imprv_det_id  = @imprv_det_id
	and   imprv_attr.prop_val_yr   = @imprv_yr
	and   imprv_attr.sup_num       = @sup_num
	and   imprv_attr.sale_id       = @sale_id 
	and   imprv_attr.imprv_attr_id = @imprv_attr_id 
	and   imprv_attr.i_attr_val_id = @i_attr_val_id 
	and   imprv_attr.i_attr_val_cd = @i_attr_val_cd       

	set @sum_feature_value = @sum_feature_value + @feature_value
	
	FETCH NEXT FROM IMPRV_DETAIL_ATTR into @imprv_attr_id, @i_attr_val_id, @i_attr_val_cd

end

CLOSE IMPRV_DETAIL_ATTR
DEALLOCATE IMPRV_DETAIL_ATTR

GO

