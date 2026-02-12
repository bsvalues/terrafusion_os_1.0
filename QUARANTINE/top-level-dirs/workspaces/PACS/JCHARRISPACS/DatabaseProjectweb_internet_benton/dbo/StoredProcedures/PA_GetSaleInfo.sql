

CREATE PROCEDURE dbo.PA_GetSaleInfo  

-- comma delimited parameters
 @prop_type varchar(2)    = NULL
,@local_dor_code varchar(1000)   = NULL  -- didn't see this on your list but had already coded this also
,@state_dor_code varchar(1000)   = NULL  -- didn't see this on your list but had already coded this also
,@imprv_type_cd varchar(1000) = NULL
,@imprv_det_class_cd varchar(1000) = NULL
,@imprv_det_sub_class_cd varchar(1000)   = NULL
,@imprv_det_meth_cd varchar(1000)   = NULL

,@zoning varchar(1000)    = NULL
,@tax_area_number varchar(1000)    = NULL
,@tax_district varchar(1000)    = NULL


-- equality parameters
,@land_only_sale bit    = NULL
,@multi_prop_sale bit    = NULL
,@subdivision varchar(1000)    = NULL

-- range search parameters
,@sale_dt_From datetime       = NULL
,@sale_dt_To datetime       = NULL
,@living_area_From numeric(14,0)   = NULL
,@living_area_To numeric(14,0)   = NULL

,@actual_yr_built_From numeric(4,0)   = NULL
,@actual_yr_built_To numeric(4,0)   = NULL
,@eff_yr_built_From numeric(4,0)   = NULL
,@eff_yr_built_To numeric(4,0)   = NULL

,@price_From numeric(14,0)   = NULL
,@price_To numeric(14,0)   = NULL
,@acreage_From numeric(14,0)   = NULL
,@acreage_To numeric(14,0)   = NULL

,@geo_From varchar(50)   = NULL
,@geo_To varchar(50)   = NULL

,@mh_make varchar(100)   = NULL
,@mh_model varchar(100)   = NULL
,@mh_serial varchar(100)   = NULL
,@mh_hud varchar(100)   = NULL
,@mh_title varchar(100)   = NULL


-- order by parameter
,@order_by varchar(1000)   = '' -- single or comma delimited fields to sort by

AS

---- following for testing, remove for production
--set @prop_type = 'RS'
--set @local_dor_code = 'C'
--set @state_dor_code = 'C'
--set @actual_yr_built_From = 1991
--set @actual_yr_built_To = 2002
--set @imprv_type_cd = 'R,C,M'
--set @sale_dt_From = '1/1/1965'
--set @sale_dt_To = '8/1/2009'
--set @land_only_sale = 0
--set @multi_prop_sale = 1
--set @subdivision = ''
--set @order_by = 'prop_id,sale_dt,living_area'
--set @imprv_det_class_cd = 'R1,C1'
--set @imprv_det_sub_class_cd = 'R1,C1'
--set @zoning = 'PZ ATTRIBUTE,TEST'
--set @tax_area_number = 'PZ ATTRIBUTE,TEST'
--set @tax_district = 'PZ ATTRIBUTE,TEST'
---- above for testing

SET NOCOUNT ON

DECLARE @CRLF VARCHAR(2)
    SET @CRLF = CHAR(13) + CHAR(10) -- to help format dynamic sql for debugging

DECLARE @SQL varchar(4000)
    SET @SQL = ''
DECLARE @Join varchar(4000)
    SET @Join = ''
DECLARE @Where varchar(4000)
    SET @Where = 'WHERE 1=1'  -- to simplify WHERE,this will always be first

-- first build tables to join on for all comma delimited parameter values
--             Instructions for building tables from comma delimited parameters
--   1. Create a temp table with one field the size and datatype of one to match with
--   2. Pass the parameter value to the function fn_ReturnTableFromCommaSepValues
--      and insert the value into your temp table. Field from function is named Id.
--   3. Create your join statement for joining the temp table to your table
--      to match on. Unless changes are made, table will be _clientdb_sales 
--      which is aliased as 's' 

IF LEN(@local_dor_code) > 0
   BEGIN
     CREATE TABLE #local_dor_code(local_dor_code varchar(10))
     INSERT INTO #local_dor_code
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@local_dor_code)
     SET @Join = @Join + ' INNER JOIN #local_dor_code as ldc '  + @CRLF
         + 'ON s.local_dor_code = ldc.local_dor_code '  + @CRLF
   END

IF LEN(@state_dor_code) > 0
   BEGIN
     CREATE TABLE #state_dor_code(state_dor_code varchar(10))
     INSERT INTO #state_dor_code
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@state_dor_code)
     SET @Join = @Join + ' INNER JOIN #state_dor_code as sdc '  + @CRLF
         + 'ON s.state_dor_code = sdc.state_dor_code '  + @CRLF
   END


IF LEN(@imprv_type_cd) > 0
   BEGIN
     CREATE TABLE #imprv_type_cd(imprv_type_cd char(5))
     INSERT INTO #imprv_type_cd
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@imprv_type_cd)
     SET @Join = @Join + ' INNER JOIN #imprv_type_cd as itc '  + @CRLF
         + 'ON s.imprv_type_cd = itc.imprv_type_cd '  + @CRLF
   END

IF LEN(@imprv_det_sub_class_cd) > 0
   BEGIN
     CREATE TABLE #imprv_det_sub_class_cd(imprv_det_sub_class_cd varchar(10))
     INSERT INTO #imprv_det_sub_class_cd
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@imprv_det_sub_class_cd)
     SET @Join = @Join + ' INNER JOIN #imprv_det_sub_class_cd as idscc '  + @CRLF
         + 'ON s.imprv_det_sub_class_cd = idscc.imprv_det_sub_class_cd '  + @CRLF
   END

IF LEN(@imprv_det_class_cd) > 0
   BEGIN
     CREATE TABLE #imprv_det_class_cd(imprv_det_class_cd varchar(10))
     INSERT INTO #imprv_det_class_cd
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@imprv_det_class_cd)
     SET @Join = @Join + ' INNER JOIN #imprv_det_class_cd as idcc '  + @CRLF
         + 'ON s.imprv_class = idcc.imprv_det_class_cd '  + @CRLF
   END

IF LEN(@imprv_det_meth_cd) > 0
   BEGIN
     CREATE TABLE #imprv_det_meth_cd(imprv_det_meth_cd varchar(5))
     INSERT INTO #imprv_det_meth_cd
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@imprv_det_meth_cd)
     SET @Join = @Join + ' INNER JOIN #imprv_det_meth_cd as idmc '  + @CRLF
         + 'ON s.imprv_det_meth_cd = idmc.imprv_det_meth_cd '  + @CRLF
   END


IF LEN(@zoning) > 0
   BEGIN
     CREATE TABLE #zoning(zoning varchar(20))
     INSERT INTO #zoning
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@zoning)
     SET @Join = @Join + ' INNER JOIN #zoning as z '  + @CRLF
         + 'ON s.zoning = z.zoning '  + @CRLF
   END

IF LEN(@tax_area_number) > 0
   BEGIN
     CREATE TABLE #tax_area_number(tax_area_number varchar(20))
     INSERT INTO #tax_area_number
     SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@tax_area_number)
     SET @Join = @Join + ' INNER JOIN #tax_area_number as ta '  + @CRLF
         + 'ON s.tax_area_number = ta.tax_area_number '  + @CRLF
   END


	IF LEN(@tax_district) > 0
	BEGIN
		SELECT Id as tax_district_cd into #tax_district 
		FROM dbo.fn_ReturnTableFromCommaSepValues(@tax_district)
		SET @Join = @Join + ' 
		join _clientdb_property_tax_district_assoc as ptda with (nolock) ' + @CRLF + '
		on s.prop_val_yr = ptda.prop_val_yr ' + @CRLF + '
		and s.prop_id = ptda.prop_id ' + @CRLF + '
		join #tax_district as td  ' + @CRLF + '
		ON ptda.tax_district_cd = td.tax_district_cd ' + @CRLF
	END



/*******************************************************************
        add parameter values must be equal to @WHERE clause
*******************************************************************/
IF @land_only_sale = 1
   begin
     set @Where = @Where + @CRLF
       + ' AND s.land_only_sale = 1 ' 
   end

IF @multi_prop_sale = 1
   begin
     set @Where = @Where + @CRLF
       + ' AND s.multi_prop_sale = 1 ' 
   end

IF len(@subdivision) > 0
	begin
		CREATE TABLE #subdivision(abs_subdv_cd varchar(50))
		INSERT INTO #subdivision
		SELECT Id FROM dbo.fn_ReturnTableFromCommaSepValues(@subdivision)
		SET @Join = @Join + ' INNER JOIN #subdivision as sub '  + @CRLF
			+ 'ON s.abs_subdv_cd = sub.abs_subdv_cd '  + @CRLF
	end

IF len(@prop_type) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.property_type = ''' + @prop_type + ''''
   end

IF len(@mh_make) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.mh_make LIKE ''%' + @mh_make + '%'''
   end

IF len(@mh_model) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.mh_model LIKE ''%' + @mh_model + '%'''
   end

IF len(@mh_serial) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.mh_serial LIKE ''%' + @mh_serial + '%'''
   end

IF len(@mh_hud) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.mh_hud LIKE ''%' + @mh_hud + '%'''
   end

IF len(@mh_title) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.mh_title LIKE ''%' + @mh_title + '%'''
   end


/*******************************************************************
    add parameter values that have a range search to the @WHERE clause
*******************************************************************/

IF len(@sale_dt_From) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.sale_dt >= ''' + convert(varchar(30),@sale_dt_From) + ''''
   end
   
IF len(@sale_dt_To) > 0
   begin
     -- set to date as midnight of day requested
     set @sale_dt_To = convert(varchar(10),@sale_dt_To,101) + ' 23:59:59.997' 
     set @Where = @Where + @CRLF
       + ' AND s.sale_dt <= ''' + convert(varchar(30),@sale_dt_To) + ''''
   end

IF len(@living_area_From) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.living_area >= ' + convert(varchar(30),@living_area_From)
   end
   
IF len(@living_area_To) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.living_area <= ' + convert(varchar(30),@living_area_To)
   end

IF len(@actual_yr_built_From) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.actual_yr_built >= ' + convert(varchar(30),@actual_yr_built_From)
   end
   
IF len(@actual_yr_built_To) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.actual_yr_built <= ' + convert(varchar(30),@actual_yr_built_To)
   end
   
 IF len(@eff_yr_built_From) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.eff_yr_built >= ' + convert(varchar(30),@eff_yr_built_From)
   end
   
IF len(@eff_yr_built_To) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.eff_yr_built <= ' + convert(varchar(30),@eff_yr_built_To)
   end

 IF len(@price_From) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.sl_adj_price >= ' + convert(varchar(30),@price_From)
   end
   
IF len(@price_To) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.sl_adj_price <= ' + convert(varchar(30),@price_To)
   end

 IF len(@acreage_From) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.land_total_acres >= ' + convert(varchar(30),@acreage_From)
   end
   
IF len(@acreage_To) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.land_total_acres <= ' + convert(varchar(30),@acreage_To)
   end

 IF len(@geo_From) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.geo_id >= ''' + convert(varchar(30),@geo_From) + ''''
   end
   
IF len(@geo_To) > 0
   begin
     set @Where = @Where + @CRLF
       + ' AND s.geo_id <= ''' + convert(varchar(30),@geo_To) + ''''
   end






print @Where
print @Join
/*******************************************************************

        now put it all together for select statement
    @CRLF carriage return/line feeds are added to make @sql 
    easier to read if printed for debugging purposes
*******************************************************************/

set @SQL = 
'SELECT s.* ' + @CRLF
+ '   FROM _clientdb_sales as s ' + @CRLF
+ @Join  + @CRLF
+ @Where + @CRLF
IF Len(@order_by) > 0
   set @SQL = @SQL + ' ORDER BY  ' + @order_by

print @SQL
exec(@SQL)

--
--if object_id('tempdb.dbo.#local_dor_code') is not null
--   drop table #local_dor_code
--if object_id('tempdb.dbo.#state_dor_code') is not null
--   drop table #state_dor_code
--if object_id('tempdb.dbo.#imprv_type_cd') is not null
--   drop table #imprv_type_cd
--
--if object_id('tempdb.dbo.#imprv_det_sub_class_cd') is not null
--   drop table #imprv_det_sub_class_cd
--
--if object_id('tempdb.dbo.#zoning') is not null
--   drop table #zoning
--if object_id('tempdb.dbo.#tax_area_number') is not null
--   drop table #tax_area_number
--if object_id('tempdb.dbo.#tax_district') is not null
--   drop table #tax_district

GO

