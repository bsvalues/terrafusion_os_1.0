





CREATE procedure GetImprvDetailArea

@class_cd	char(10),
@type_cd	char(10),
@method_cd	char(5),
@imprv_id	int,
@imprv_det_id	int,
@prop_id	int,
@sup_num	int,
@sup_yr		numeric(4),
@sale_id	int,
@output_area    numeric(18, 1) output

as

declare @sched_area_type  char(10)

select @sched_area_type = imprv_sched_area_type_cd
from imprv_sched
where imprv_det_meth_cd  = @method_cd
and   imprv_det_type_cd  = @type_cd
and   imprv_det_class_cd = @class_cd
and   imprv_yr		 = @sup_yr

/* return the segments area */
if (@sched_area_type = 'S')
begin
	select @output_area = imprv_detail.imprv_det_area
	from   imprv_detail
	where  imprv_detail.prop_id      = @prop_id
	and    imprv_detail.imprv_id     = @imprv_id
	and    imprv_detail.imprv_det_id = @imprv_det_id
	and    imprv_detail.prop_val_yr  = @sup_yr
	and    imprv_detail.sup_num	 = @sup_num
	and    imprv_detail.sale_id	 = @sale_id
end

/* return the sum of all the segments */
else if (@sched_area_type = 'ST')
begin
	/* select the area for the all the detail segments */
	select @output_area  = sum(imprv_det_area) 
	from imprv_detail where prop_id = @prop_id
		 	  and imprv_detail.imprv_id    = @imprv_id
                  	  and imprv_detail.sup_num     = @sup_num
			  and imprv_detail.prop_val_yr = @sup_yr
			  and imprv_detail.sale_id     = @sale_id 
end

/* return the sum of all the main area segments */
else if (@sched_area_type = 'STMA')
begin

	/* select the area for the all the main area detail segments */
	select @output_area = sum(imprv_detail.imprv_det_area) 
	from imprv_detail, imprv_det_type where imprv_detail.prop_id = @prop_id
		  and   imprv_detail.imprv_id    = @imprv_id
		  and   imprv_detail.prop_val_yr = @sup_yr
		  and   imprv_detail.sup_num     = @sup_num
		  and   imprv_detail.sale_id     = @sale_id 
		  and   imprv_detail.imprv_det_area is not null
		  and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd 
		  and   imprv_det_type.main_area = 'T'
end

/* return the sum all the segments who have the same class as the main area */
else if (@sched_area_type = 'STMAC')
begin

	/* select the area for the detail segments that have the same class as the main area */
	select @output_area = sum(imprv_detail.imprv_det_area) 
	from imprv_detail where imprv_detail.prop_id = @prop_id
	and   imprv_detail.imprv_id    = @imprv_id
	and   imprv_detail.prop_val_yr = @sup_yr
	and   imprv_detail.sup_num     = @sup_num
	and   imprv_detail.sale_id     = @sale_id 
	and   imprv_detail.imprv_det_area is not null
	and   imprv_detail.imprv_det_class_cd  in (select imprv_det_class_cd
					   from imprv_detail, imprv_det_type where imprv_detail.prop_id = @prop_id 
					   and   imprv_detail.sup_num     = @sup_num
					   and   imprv_detail.prop_val_yr = @sup_yr
		  			   and   imprv_detail.sale_id     = @sale_id 
		  			   and   imprv_detail.imprv_det_area is not null
		  			   and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd 
		 			   and   imprv_det_type.main_area = 'T')
end

/* return the sum all the segments who have the same class as the main area */
else if (@sched_area_type = 'STMACP')
begin
	declare @imprv_area	numeric(18,1)
	declare @other_area	numeric(18,1)
	declare @other_imprv_id	int

	/* select the area for the detail segments that have the same class as the main area */
	select @imprv_area = IsNull(sum(imprv_detail.imprv_det_area) , 0)
	from imprv_detail, imprv_det_type
	where imprv_detail.prop_id       = @prop_id
	and   imprv_detail.prop_val_yr  = @sup_yr
	and   imprv_detail.sup_num      = @sup_num
	and   imprv_detail.sale_id         = @sale_id
	and   imprv_detail.imprv_id       = @imprv_id 
	and   imprv_detail.imprv_det_area is not null
	and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd 
	and   imprv_det_type.main_area = 'T'

	if exists (select *
		from imprv_detail where imprv_detail.prop_id = @prop_id
		and   imprv_detail.prop_val_yr = @sup_yr
		and   imprv_detail.sup_num     = @sup_num
		and   imprv_detail.sale_id     = @sale_id 
		and   imprv_detail.imprv_id    <> @imprv_id
		and   imprv_detail.imprv_det_area is not null
		and   imprv_detail.imprv_det_class_cd  in (select imprv_det_class_cd
					   from imprv_detail, imprv_det_type where imprv_detail.prop_id = @prop_id 
					   and   imprv_detail.sup_num       = @sup_num
					   and   imprv_detail.prop_val_yr   = @sup_yr
		  			   and   imprv_detail.sale_id           = @sale_id 
					   and   imprv_detail.imprv_id	= @imprv_id
		  			   and   imprv_detail.imprv_det_area is not null
		  			   and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd 
		 			   and   imprv_det_type.main_area = 'T'
					   and   imprv_detail.use_up_for_pct_base = 'T'))
	begin
	
		select @other_area = IsNull(sum(imprv_detail.imprv_det_area) , 0)
		from imprv_detail, imprv_det_type
		where imprv_detail.prop_id       = @prop_id
		and   imprv_detail.prop_val_yr  = @sup_yr
		and   imprv_detail.sup_num      = @sup_num
		and   imprv_detail.sale_id         = @sale_id
		and   imprv_detail.imprv_id       <> @imprv_id 
		and   imprv_detail.imprv_det_area is not null
		and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd 
		and   imprv_det_type.main_area = 'T'
		and   imprv_detail.imprv_id in ( select imprv_detail.imprv_id
						from imprv_detail where imprv_detail.prop_id = @prop_id
						and   imprv_detail.prop_val_yr = @sup_yr
						and   imprv_detail.sup_num     = @sup_num
						and   imprv_detail.sale_id     = @sale_id 
						and   imprv_detail.imprv_id    <> @imprv_id
						and   imprv_detail.imprv_det_area is not null
						and   imprv_detail.imprv_det_class_cd  in (select imprv_det_class_cd
					  						 from imprv_detail, imprv_det_type where imprv_detail.prop_id = @prop_id 
					   						and   imprv_detail.sup_num       = @sup_num
					  						and   imprv_detail.prop_val_yr   = @sup_yr
		  			   						and   imprv_detail.sale_id           = @sale_id 
					   						and   imprv_detail.imprv_id	= @imprv_id
		  			   						and   imprv_detail.imprv_det_area is not null
		  			  						and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd 
		 			   						and   imprv_det_type.main_area = 'T'
					   						and   imprv_detail.use_up_for_pct_base = 'T'))
	end
	else
	begin
		set @other_area = 0
	end
		

	set @output_area = @imprv_area + @other_area
end
else 
begin
	set @output_area = 0
end

GO

