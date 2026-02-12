







CREATE     PROCEDURE SalesRatioReportUpdateAdditionalFields

@input_user_id 			int,
@input_value_option 		varchar(1)

as

declare @prop_id		int
declare @sup_num		int
declare @prop_val_yr		numeric(4)
declare @sale_id		int
declare @temp_sale_id		int
declare @economic_pct		numeric(5,2)
declare @physical_pct   	numeric(5,2)
declare @functional_pct		numeric(5,2)
declare @imprv_id		int
declare @imprv_val_1		numeric(14,0)
declare @imprv_desc_1 		varchar(50)
declare @imprv_val_2		numeric(14,0)
declare @imprv_desc_2 		varchar(50)
declare @imprv_val_3		numeric(14,0)
declare @imprv_desc_3 		varchar(50)
declare @base_dep	   		numeric(5,2)

declare property scroll cursor
for select prop_id, sup_num, prop_val_yr, chg_of_owner_id
from #sales_ratio_report_property WITH (NOLOCK)
where pacs_user_id = @input_user_id

open property
fetch next from property into @prop_id, @sup_num, @prop_val_yr, @sale_id

while (@@FETCH_STATUS = 0)
begin
	set @temp_sale_id = @sale_id
	set @imprv_id     = 0

	if (@input_value_option <> 'S')
	begin
		set @sale_id      = 0
	end

	set @economic_pct   = 100
	set @physical_pct   = 100
	set @functional_pct = 100
	set @imprv_val_1    = 0
	set @imprv_desc_1   = ''	
	set @imprv_val_2    = 0
	set @imprv_desc_2   = ''		
	set @imprv_val_3    = 0		
	set @imprv_desc_3   = ''		
	set @base_dep       = 100
	
	select top 1 @imprv_val_1  = imprv_val,
		     @imprv_desc_1 = case when imprv.imprv_desc is not null 
				     then imprv.imprv_desc 
				     else imprv_type.imprv_type_desc end, 
		     @imprv_id     = imprv_id     
	from imprv WITH (NOLOCK), imprv_type WITH (NOLOCK)
	where prop_id 	   = @prop_id
	and   prop_val_yr  = @prop_val_yr
	and   sup_num	   = @sup_num
	and   sale_id      = @sale_id
	and   imprv_type.imprv_type_cd = imprv.imprv_type_cd
	order by imprv_id

	select top 1 @imprv_val_2  = imprv_val,
		     @imprv_desc_2 = case when imprv.imprv_desc is not null 
				     then imprv.imprv_desc 
				     else imprv_type.imprv_type_desc end,  
		     @imprv_id     = imprv_id     
	from imprv WITH (NOLOCK), imprv_type WITH (NOLOCK)
	where prop_id 	   =  @prop_id
	and   prop_val_yr  =  @prop_val_yr
	and   sup_num	   =  @sup_num
	and   sale_id      =  @sale_id
	and   imprv_id     >  @imprv_id
	and   imprv_type.imprv_type_cd = imprv.imprv_type_cd
	order by imprv_id

	select top 1 @imprv_val_3  = imprv_val,
		     @imprv_desc_3 = case when imprv.imprv_desc is not null 
				     then imprv.imprv_desc 
				     else imprv_type.imprv_type_desc end, 
		     @imprv_id     = imprv_id     
	from imprv WITH (NOLOCK), imprv_type WITH (NOLOCK)
	where prop_id 	   =  @prop_id
	and   prop_val_yr  =  @prop_val_yr
	and   sup_num	   =  @sup_num
	and   sale_id      =  @sale_id
	and   imprv_id     >  @imprv_id
	and   imprv_type.imprv_type_cd = imprv.imprv_type_cd
	order by imprv_id
	
	select top 1 @economic_pct   = economic_pct,
		     @physical_pct   =  physical_pct,
		     @functional_pct =  functional_pct,
             @base_dep       =  dep_pct
	from imprv_detail WITH (NOLOCK), 
	     imprv_det_type WITH (NOLOCK)
	where prop_id 	  = @prop_id
	and   sup_num 	  = @sup_num
	and   prop_val_yr = @prop_val_yr
	and   sale_id     = @sale_id
	and   imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd
	and   imprv_det_type.main_area = 'T'
	order by imprv_id, imprv_det_id


	update #sales_ratio_report_property
	set imprv_val_1  = @imprv_val_1,
	    imprv_desc_1 = @imprv_desc_1,
	    imprv_val_2  = @imprv_val_2,
	    imprv_desc_2 = @imprv_desc_2, 
	    imprv_val_3  = @imprv_val_3,
	    imprv_desc_3 = @imprv_desc_3,  
	    econ_pct	 = @economic_pct,
	    phy_pct      = @physical_pct,
        func_pct     = @functional_pct,
        base_dep     = @base_dep
	where chg_of_owner_id = @temp_sale_id
	and   prop_id	      = @prop_id
	and   pacs_user_id    = @input_user_id

	fetch next from property into @prop_id, @sup_num, @prop_val_yr, @sale_id
end

close property
deallocate property

GO

