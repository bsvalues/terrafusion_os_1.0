
create procedure GetTempTableDDL
	@szTempTable varchar(64),
	@szDDL varchar(2048) = null output
as

set nocount on

	if (@szTempTable = '#sales_comp_print')
	begin
		set @szDDL = '
create table #sales_comp_print
(
print_id int identity(0,1) not null,
prop_id varchar(50) null,
year varchar(50) null,
geo_id varchar(50) null,
owner varchar(50) null,
situs varchar(173) null,
school varchar(50) null,
city varchar(50) null,
state_cd varchar(50) null,
region varchar(50) null,
abs_subdv varchar(50) null,
hood varchar(50) null,
subset varchar(50) null,
map_id varchar(50) null,
imprv_class varchar(50) null,
living_area varchar(50) null,
year_built varchar(50) null,
imprv_up varchar(50) null,
imprv_val varchar(50) null,
imprv_add_val varchar(50) null,
land_type varchar(50) null,
land_sqft varchar(50) null,
land_front_feet varchar(50) null,
land_acres varchar(50) null,
land_lot varchar(50) null,
land_size varchar(50) null,
land_up varchar(50) null,
land_val varchar(50) null,
land_val_per_area varchar(50) null,
land_sale_val_per_area varchar(50) null,
appraised_val varchar(50) null,
appraised_val_per_sqft varchar(50) null,
sale_type varchar(50) null,
sale_date varchar(50) null,
sale_price varchar(50) null,
sale_price_per_sqft varchar(50) null,
sale_ratio varchar(50) null,
score varchar(50) null,
print_flag varchar(1) null,
sequence_num int null,
situs_street varchar(50) null,
sale_id int null
) on [primary]
'
	end

set nocount off

	select szDDL = @szDDL

GO

