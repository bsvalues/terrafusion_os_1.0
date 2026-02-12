


CREATE PROCEDURE PopulateStateReviewerTables
@input_type	varchar(1),
@input_sql	varchar(2000),
@input_user_id	int

AS

declare @exec_sql varchar(8000)

delete from state_reviewer_export
where pacs_user_id = @input_user_id

if (@input_type = 'W')
begin
	set @exec_sql = '
	insert into state_reviewer_export
	(
		 pacs_user_id,
		 isd_cd,
		 cad_account_number,
		 state_category_code,
		 sale_price,
		 deed_date,
		 deed_volume,
		 deed_page,
		 deed_number,
		 deed_type,
		 grantee,
		 grantee_address_line_1,
		 grantee_address_line_2,
		 grantee_address_line_3,
		 grantee_address_city,
		 grantee_address_state,
		 grantee_address_zip,
		 grantee_address_country,
		 grantor,
		 grantor_address_line_1,
		 grantor_address_line_2,
		 grantor_address_line_3,
		 grantor_address_city,
		 grantor_address_state,
		 grantor_address_zip,
		 grantor_address_country,
		 legal_description,
		 situs,
		 comments
		 arb_set_value,
		 partial_complete
	)
	select
		' + rtrim(convert(varchar(10), @input_user_id)) + ',
		isd_cd,
		prop_id,
		sl_state_cd,
		sl_price,
		deed_dt,
		deed_book_id,
		deed_book_page,
		deed_num,
		deed_type_cd,
		grantee,
		grantee_addr_line_1,
		grantee_addr_line_2,
		grantee_addr_line_3,
		grantee_addr_city,
		grantee_addr_state,
		grantee_addr_zip,
		grantee_addr_country,
		grantor,
		grantor_addr_line_1,
		grantor_addr_line_2,
		grantor_addr_line_3,
		grantor_addr_city,
		grantor_addr_state,
		grantor_addr_zip,
		grantor_addr_country,
		legal_desc,
		situs,
		comments,
		''F'',
		''F''
	from sales_export_vw '

	if ((@input_sql is not null) and (len(@input_sql) > 0))
	begin
		set @exec_sql = @exec_sql + @input_sql
	end
end
else if (@input_type = 'S')
begin
	set @exec_sql = '
	insert into state_reviewer_export
	(
		 pacs_user_id,
		 isd_cd,
		 cad_account_number,
		 state_category_code,
		 sale_price,
		 sale_date,
		 deed_volume,
		 deed_page,
		 legal_description,
		 situs,
		 land_market_val,
		 imprv_market_val,
		 market_val,
		 comments,
		 sl_sqft,
		 blg_age,
		 blg_condition,
		 sl_class_cd,
		 abs_subdv_cd,
		 map_id,
		 sl_land_acres,
		 sl_type_cd,
		 arb_set_value,
		 partial_complete
	)
	select
		' + rtrim(convert(varchar(10), @input_user_id)) + ',
		isd_cd,
		prop_id,
		sl_state_cd,
		sl_price,
		sl_dt,
		deed_book_id,
		deed_book_page,
		legal_desc,
		situs,
		land_market_val,
		imprv_market_val,
		market_val,
		comments,
		sl_sqft,
		blg_age,
		blg_condition,
		sl_class_cd,
		abs_subdv_cd,
		map_id,
		sl_land_acres,
		sl_type_cd,
		''F'',
		''F''
	from sales_export_vw '

	if ((@input_sql is not null) and (len(@input_sql) > 0))
	begin
		set @exec_sql = @exec_sql + @input_sql
	end
end
else if (@input_type = 'C')
begin
	set @exec_sql = '
	insert into state_reviewer_export
	(
		 pacs_user_id,
		 isd_cd,
		 cad_account_number,
		 state_category_code,
		 sale_price,
		 sale_date,
		 deed_date,
		 deed_volume,
		 deed_page,
		 deed_number,
		 deed_type,
		 grantee,
		 grantee_address_line_1,
		 grantee_address_line_2,
		 grantee_address_line_3,
		 grantee_address_city,
		 grantee_address_state,
		 grantee_address_zip,
		 grantee_address_country,
		 grantor,
		 grantor_address_line_1,
		 grantor_address_line_2,
		 grantor_address_line_3,
		 grantor_address_city,
		 grantor_address_state,
		 grantor_address_zip,
		 grantor_address_country,
		 legal_description,
		 situs,
		 sl_sqft,
		 blg_age,
		 blg_condition,
		 sl_class_cd,
		 abs_subdv_cd,
		 map_id,
		 sl_land_acres,
		 sl_type_cd,
		 land_market_val,
		 imprv_market_val,
		 market_val,
		 comments,
		 arb_set_value,
		 partial_complete
	)
	select
		' + rtrim(convert(varchar(10), @input_user_id)) + ',
		isd_cd,
		prop_id,
		sl_state_cd,
		sl_price,
		sl_dt,
		deed_dt,
		deed_book_id,
		deed_book_page,
		deed_num,
		deed_type_cd,
		grantee,
		grantee_addr_line_1,
		grantee_addr_line_2,
		grantee_addr_line_3,
		grantee_addr_city,
		grantee_addr_state,
		grantee_addr_zip,
		grantee_addr_country,
		grantor,
		grantor_addr_line_1,
		grantor_addr_line_2,
		grantor_addr_line_3,
		grantor_addr_city,
		grantor_addr_state,
		grantor_addr_zip,
		grantor_addr_country,
		legal_desc,
		situs,
		sl_sqft,
		blg_age,
		blg_condition,
		sl_class_cd,
		abs_subdv_cd,
		map_id,
		sl_land_acres,
		sl_type_cd,
		land_market_val,
		imprv_market_val,
		market_val,
		comments,
		''F'',
		''F''
	from sales_export_property_vw '

	if ((@input_sql is not null) and (len(@input_sql) > 0))
	begin
		set @exec_sql = @exec_sql + @input_sql
	end
end

exec(@exec_sql)

GO

