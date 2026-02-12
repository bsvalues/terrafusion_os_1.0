



CREATE procedure UpdateSalesRatioReport
@input_year		numeric(4,0),
@input_user_id 		int,
@input_value_option 	varchar(1),
@input_report_type    	varchar(2)

as

insert into sales_ratio_report_property
(
	chg_of_owner_id, 
	report_type, 
	pacs_user_id, 
	prop_id,     
	prop_type_cd, 
	subdivision_cd, 
	hood_cd,    
	subset_cd, 
	region_cd,
	geo_id
)
select distinct sales_ratio_report.chg_of_owner_id, 
	sales_ratio_report.report_type, 
	sales_ratio_report.pacs_user_id, 
	property.prop_id,
	property.prop_type_cd,
	IsNULL(property_val.abs_subdv_cd, ''),
	IsNULL(property_val.hood_cd, ''),
	IsNULL(property_val.subset_cd, ''),
	IsNULL(property_val.rgn_cd, ''),
	property.geo_id
from sales_ratio_report, chg_of_owner_prop_assoc, property, property_val, prop_supp_assoc
where sales_ratio_report.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
and  chg_of_owner_prop_assoc.prop_id 	= property.prop_id
and  property.prop_id = property_val.prop_id
and  property_val.prop_id = prop_supp_assoc.prop_id
and  property_val.sup_num = prop_supp_assoc.sup_num
and  property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
and  prop_supp_assoc.owner_tax_yr = @input_year
and  sales_ratio_report.pacs_user_id 	= @input_user_id

-- entity codes
update sales_ratio_report set school_cd = entity.entity_cd
from entity
where entity.entity_id = sales_ratio_report.school_id
and   pacs_user_id = @input_user_id

update sales_ratio_report set city_cd = entity.entity_cd
from entity
where entity.entity_id = sales_ratio_report.city_id
and   pacs_user_id = @input_user_id


-- property info
update sales_ratio_report_property
set situs_location = REPLACE(IsNull(situs_display, ''), CHAR(13) + CHAR(10), ' ')  
from situs
where sales_ratio_report_property.prop_id = situs.prop_id
and   situs.primary_situs = 'Y'
and   pacs_user_id = @input_user_id


update sales_ratio_report_property set legal_acreage = property_val.legal_acreage,
			      eff_size_acres = property_val.eff_size_acres,
			      legal_desc     = property_val.legal_desc
from   property_val, chg_of_owner_prop_assoc, prop_supp_assoc
where  sales_ratio_report_property.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
and    sales_ratio_report_property.prop_id = chg_of_owner_prop_assoc.prop_id
and    sales_ratio_report_property.prop_id = property_val.prop_id
and    property_val.prop_id = prop_supp_assoc.prop_id
and    property_val.sup_num = prop_supp_assoc.sup_num
and    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
and    prop_supp_assoc.owner_tax_yr = @input_year
and    pacs_user_id = @input_user_id

-- user sale value
if (@input_value_option = 'S')
begin
		update sales_ratio_report set 
			       sales_ratio_report.land_val      =  (select sum( IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0))
							 from   property_val, chg_of_owner_prop_assoc, prop_supp_assoc
							where chg_of_owner_prop_assoc.prop_id = prop_supp_assoc.prop_id
							and    chg_of_owner_prop_assoc.sup_tax_yr = prop_supp_assoc.owner_tax_yr
							and    chg_of_owner_prop_assoc.chg_of_owner_id = sales_ratio_report.chg_of_owner_id
							and     prop_supp_assoc.prop_id = property_val.prop_id
							and    prop_supp_assoc.sup_num = property_val.sup_num
							and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr),

			       sales_ratio_report.imprv_val     =  (select sum(IsNull(property_val.imprv_hstd_val, 0) + IsNull(property_val.imprv_non_hstd_val, 0))
							        from   property_val, chg_of_owner_prop_assoc, prop_supp_assoc
							where chg_of_owner_prop_assoc.prop_id = prop_supp_assoc.prop_id
							and    chg_of_owner_prop_assoc.sup_tax_yr = prop_supp_assoc.owner_tax_yr
							and    chg_of_owner_prop_assoc.chg_of_owner_id = sales_ratio_report.chg_of_owner_id
							and     prop_supp_assoc.prop_id = property_val.prop_id
							and   prop_supp_assoc.sup_num = property_val.sup_num
							and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr),

			       sales_ratio_report.appraised_val =  (select sum( IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0) + 
 								IsNull(property_val.imprv_hstd_val, 0) + IsNull(property_val.imprv_non_hstd_val, 0))
								 from   property_val, chg_of_owner_prop_assoc, prop_supp_assoc
							where chg_of_owner_prop_assoc.prop_id = prop_supp_assoc.prop_id
							and    chg_of_owner_prop_assoc.sup_tax_yr = prop_supp_assoc.owner_tax_yr
							and    chg_of_owner_prop_assoc.chg_of_owner_id = sales_ratio_report.chg_of_owner_id
							and     prop_supp_assoc.prop_id = property_val.prop_id
							and    prop_supp_assoc.sup_num = property_val.sup_num
							and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr),

			       sales_ratio_report.temp_subdivision_cd = (select top 1 subdivision_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id),
			        sales_ratio_report.temp_hood_cd = (select top 1 hood_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id),
			        sales_ratio_report.temp_region_cd = (select top 1 region_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id),
			        sales_ratio_report.temp_subset_cd = (select top 1 subset_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id)
								       
		where     pacs_user_id = @input_user_id 

end
else
-- use current appraisal value
begin
			update sales_ratio_report set 
      		             sales_ratio_report.land_val      =  (select sum( IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0))
							from   property_val, chg_of_owner_prop_assoc, prop_supp_assoc
							where chg_of_owner_prop_assoc.prop_id = prop_supp_assoc.prop_id	
							and    chg_of_owner_prop_assoc.chg_of_owner_id = sales_ratio_report.chg_of_owner_id
							and     prop_supp_assoc.prop_id = property_val.prop_id
							and    prop_supp_assoc.sup_num = property_val.sup_num
							and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
							and    property_val.prop_val_yr = @input_year),

			       sales_ratio_report.imprv_val     =  (select sum(IsNull(property_val.imprv_hstd_val, 0) + IsNull(property_val.imprv_non_hstd_val, 0))
							       from   property_val, chg_of_owner_prop_assoc, prop_supp_assoc
							where chg_of_owner_prop_assoc.prop_id = prop_supp_assoc.prop_id
							and    chg_of_owner_prop_assoc.chg_of_owner_id = sales_ratio_report.chg_of_owner_id
							and     prop_supp_assoc.prop_id = property_val.prop_id
							and    prop_supp_assoc.sup_num = property_val.sup_num
							and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
							and    property_val.prop_val_yr = @input_year),

			       sales_ratio_report.appraised_val =  (select sum( IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0) + 
 								IsNull(property_val.imprv_hstd_val, 0) + IsNull(property_val.imprv_non_hstd_val, 0))
								from   property_val, chg_of_owner_prop_assoc, prop_supp_assoc
							where chg_of_owner_prop_assoc.prop_id = prop_supp_assoc.prop_id
							and    chg_of_owner_prop_assoc.chg_of_owner_id = sales_ratio_report.chg_of_owner_id
							and     prop_supp_assoc.prop_id = property_val.prop_id
							and    prop_supp_assoc.sup_num = property_val.sup_num
							and    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
							and    property_val.prop_val_yr = @input_year),

			       sales_ratio_report.temp_subdivision_cd = (select top 1 subdivision_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id),
			        sales_ratio_report.temp_hood_cd = (select top 1 hood_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id),
			        sales_ratio_report.temp_region_cd = (select top 1 region_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id),
			        sales_ratio_report.temp_subset_cd = (select top 1 subset_cd 
								       from sales_ratio_report_property 
								       where sales_ratio_report_property.chg_of_owner_id = sales_ratio_report.chg_of_owner_id)
								       
			where     pacs_user_id = @input_user_id 
end

update sales_ratio_report set appr_avg_price_per_sqft = appraised_val/living_area_sqft
where pacs_user_id = @input_user_id
and living_area_sqft <> 0
and living_area_sqft is not null
and appraised_val <> 0
and  appraised_val is not null

update sales_ratio_report set sale_avg_price_per_sqft = sl_adj_price/living_area_sqft
where pacs_user_id = @input_user_id
and living_area_sqft <> 0
and living_area_sqft is not null
and sl_adj_price<> 0
and  sl_adj_price  is not null

update sales_ratio_report set sale_avg_price_per_sqft = 0
where pacs_user_id = @input_user_id
and sale_avg_price_per_sqft is null


update sales_ratio_report set appr_avg_price_per_sqft = 0
where pacs_user_id = @input_user_id
and appr_avg_price_per_sqft is null

if (@input_report_type = 'LP')
begin
	update sales_ratio_report set sales_ratio = land_val/sl_adj_price,
				       sales_ratio_report.imprv_val  = 0,
				       sales_ratio_report.appraised_val = land_val
				       
	where pacs_user_id = @input_user_id
	and    sl_adj_price <> 0
	and    sl_adj_price is not null
end
else
begin
	update sales_ratio_report set sales_ratio = appraised_val/sl_adj_price
	where pacs_user_id = @input_user_id
	and    sl_adj_price <> 0
	and    sl_adj_price is not null
end

update sales_ratio_report set sales_ratio = 0
where pacs_user_id = @input_user_id
and (sl_adj_price =  0
or    sl_adj_price is null)

-- buyer information
update sales_ratio_report set buyer_name =  account.file_as_name
from buyer_assoc, account
where  buyer_assoc.chg_of_owner_id = sales_ratio_report.chg_of_owner_id
and     buyer_assoc.buyer_id = account.acct_id 
and      pacs_user_id = @input_user_id

update sales_ratio_report set deed_dt = chg_of_owner.deed_dt,
			      deed_num = chg_of_owner.deed_num,
			      deed_book_id = chg_of_owner.deed_book_id,
			      deed_book_page = chg_of_owner.deed_book_page
from chg_of_owner
where sales_ratio_report.chg_of_owner_id = chg_of_owner.chg_of_owner_id
and      pacs_user_id = @input_user_id

update sales_ratio_report set confirmed_source = sale_conf.confirmed_source,
			       confirmed_by = sale_conf.confirmed_by,
			       confirmed_dt = sale_conf.confirmed_dt
from sale_conf
where sales_ratio_report.chg_of_owner_id = sale_conf.chg_of_owner_id
and    sale_conf.primary_sl_conf = 'T' 
and     pacs_user_id = @input_user_id

-- land dimensions
update sales_ratio_report set dimensions = ' '
where pacs_user_id = @input_user_id

-- sqft
update sales_ratio_report set dimensions =  dimensions + '  SQ: ' + convert(varchar(10), sale.sl_land_sqft)
from sale
where pacs_user_id = @input_user_id
and     sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and      sale.sl_land_sqft is not null
and      sale.sl_land_sqft <> 0

-- acres
update sales_ratio_report set dimensions =  dimensions + '  AC: ' + convert(varchar(10), sale.sl_land_acres)
from sale
where pacs_user_id = @input_user_id
and     sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and     sale.sl_land_acres is not null
and     sale.sl_land_acres <> 0

-- ff
update sales_ratio_report set dimensions =  dimensions + '  FF: ' + convert(varchar(10), sale.sl_land_front_feet)
from sale
where pacs_user_id = @input_user_id
and     sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and      sale.sl_land_front_feet is not null
and      sale.sl_land_front_feet <> 0

-- depth
update sales_ratio_report set dimensions =  dimensions + '  DEPTH: ' + convert(varchar(10), sale.sl_land_depth)
from sale
where pacs_user_id = @input_user_id
and     sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and     sale.sl_land_depth is not null 
and     sale.sl_land_depth <> 0

GO

