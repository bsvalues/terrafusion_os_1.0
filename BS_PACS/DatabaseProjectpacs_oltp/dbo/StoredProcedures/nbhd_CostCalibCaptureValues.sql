
create procedure dbo.nbhd_CostCalibCaptureValues 
	@detail_id int 
with recompile
as

declare @begin_date as varchar(50) 
declare @end_date as varchar(50) 
declare @run_id as varchar(50)
declare @prop_val_yr as int
declare @valid_date as int

set nocount on

set @valid_date = 0
---------------------------------------------------------------------------------------
--We need to preserve some value before we delete them
declare @locked bit
declare @lock_user int
declare @lock_dt datetime
declare @override_system_target_ratio numeric(14,4)
declare @prev_nbhd_adj_pct numeric(14,4) --Once this is captured, it shouldn't be changed
declare @preserve_values bit
--
declare @filter_by_sale_type_cd bit
declare @filter_by_sale_sale_ratio_type_cd bit


set @preserve_values = 0 
set @filter_by_sale_type_cd = 0 
set @filter_by_sale_sale_ratio_type_cd = 0 

if EXISTS(SELECT * FROM nbhd_cost_calc_capture where profile_run_list_detail_id = @detail_id)
BEGIN
    SELECT @locked= locked, @lock_user = lock_user, @lock_dt = lock_dt,
           @override_system_target_ratio = override_system_target_ratio,
           @prev_nbhd_adj_pct = prev_nbhd_adj, @preserve_values= 1
    FROM nbhd_cost_calc_capture where profile_run_list_detail_id = @detail_id
END
--We also need to save the outlier status if there was a previous capture
create table #outliers
(
    detail_id int,
    run_id    int,
    chg_of_owner_id int,
    prop_id int,
    is_outlier bit    
)

CREATE TABLE #my_sale_ratio_type_cds
( 
	[sl_ratio_type_cd] [char] (5) NULL
)
-- 
CREATE TABLE #my_sale_type_cds
( 
	[sl_type_cd] [char] (5)  NULL
) 

INSERT INTO #outliers SELECT profile_run_list_detail_id,
                              run_id,
                              chg_of_owner_id,
                              prop_id,
                              is_outlier
                       FROM nbhd_cost_calc_capture_props WITH(NOLOCK)
                       WHERE profile_run_list_detail_id = @detail_id
                            -- AND is_outlier = 1 //They want to keep the outlier state also


-- 
---------------------------------------------------------------------------------------
--Remove any previous values for this detail_id
DELETE FROM nbhd_cost_calc_capture where profile_run_list_detail_id       = @detail_id
DELETE FROM nbhd_cost_calc_capture_props where profile_run_list_detail_id = @detail_id
--------------------------------------------------------------------------------------- 

--Get the settings used during the neighborhood capture 
-- sale date range
-- sale types
-- sale ratio types
SELECT @run_id     = prl.run_id, @prop_val_yr = prl.prop_val_yr, 
       @begin_date = (SELECT option_desc from profile_run_list_options WITH (NOLOCK) where run_id = prl.run_id and option_type = 'BD'), 
       @end_date   = (SELECT option_desc from profile_run_list_options WITH (NOLOCK) where run_id = prl.run_id and option_type = 'ED')
FROM profile_run_list prl WITH (NOLOCK)
	 WHERE 
       prl.detail_id = @detail_id
-- Save the Sale Type and the Sale Ratio Types for this run in the #mySales table, if the nbhd profile
-- capture didn't filter on sale_ratio_type or sale_type_cds add all the codes in the table, this is 
-- to help later in the query when we are filtering
if EXISTS(SELECT option_desc FROM   profile_run_list_options WITH (NOLOCK) 
            WHERE  run_id = @run_id AND
                   option_type in( 'ISS','LSS' ) )
BEGIN
    INSERT INTO #my_sale_ratio_type_cds
    SELECT option_desc 
    FROM   profile_run_list_options WITH (NOLOCK) 
    WHERE  run_id = @run_id AND
           option_type in( 'ISS','LSS' ) 

    set @filter_by_sale_sale_ratio_type_cd = 1 
END

IF EXISTS(SELECT option_desc FROM   profile_run_list_options WITH (NOLOCK) WHERE  run_id = @run_id AND option_type = 'ST')
BEGIN
    INSERT INTO #my_sale_type_cds
    SELECT option_desc 
    FROM   profile_run_list_options WITH (NOLOCK) 
    WHERE  run_id = @run_id AND
            option_type = 'ST' 

   set @filter_by_sale_type_cd = 1 
END


if ( LEN(@begin_date) > 0 AND LEN(@end_date)> 0 ) 
BEGIN
    set @valid_date = 1
END
ELSE
BEGIN
    SET @begin_date = '1/01/1970' --Selet one date way back
    SET @end_date = GETDATE()
END

 
---------------------------------------------------------------------------------------  
declare @system_target_ratio numeric(14,4)
--We need to get just one result in the following query, all the rows in pacs_system for 
--column nbhd_cost_calibration_default_target_ratio should be the same
SELECT @system_target_ratio = MAX(nbhd_cost_calibration_default_target_ratio) from pacs_system
--
INSERT INTO nbhd_cost_calc_capture 
			  (
              profile_run_list_detail_id, 
			  run_id, 
			  hood_cd, 
			  population, 
			  prev_nbhd_adj,
              system_target_ratio 
              ) 	 
			  SELECT prl.detail_id, 
                     prl.run_id, 
                     prl.hood_cd, 
                     prl.imprv_ct as 'population', 
                     --n.hood_imprv_pct as 'prev_nbhd_adj' 
                     'prev_nbhd_adj' = 
                     case WHEN n.hood_imprv_pct is null THEN 1.00
                     else n.hood_imprv_pct /100.00
                     end,
                     @system_target_ratio
              FROM profile_run_list prl WITH (NOLOCK) 
              INNER JOIN neighborhood as n WITH (NOLOCK) on n.hood_cd = prl.hood_cd 
              AND n.hood_yr = prl.prop_val_yr 
              WHERE prl.detail_id = @detail_id  

--if we are preserving some values then update them to the db
if @preserve_values=1
BEGIN
    UPDATE nbhd_cost_calc_capture SET 
    locked =@locked, lock_user = @lock_user,lock_dt=@lock_dt,
    override_system_target_ratio = @override_system_target_ratio,
    prev_nbhd_adj = @prev_nbhd_adj_pct
    where profile_run_list_detail_id       = @detail_id

END
 
--------------------------------------------------------------------------------------------
--Build the final select query dynamically
declare @strDynQuery varchar(4080) 
set @strDynQuery = ' INSERT INTO [nbhd_cost_calc_capture_props]'
set @strDynQuery = @strDynQuery + ' (profile_run_list_detail_id, '
set @strDynQuery = @strDynQuery + ' run_id,'
set @strDynQuery = @strDynQuery + ' chg_of_owner_id,'
set @strDynQuery = @strDynQuery + ' prop_id,'
set @strDynQuery = @strDynQuery + ' sale_date,'
set @strDynQuery = @strDynQuery + ' sale_price,'
set @strDynQuery = @strDynQuery + ' living_area, '
set @strDynQuery = @strDynQuery + ' land_total_val,'
set @strDynQuery = @strDynQuery + ' imprv_val,'
set @strDynQuery = @strDynQuery + ' is_outlier )'
set @strDynQuery = @strDynQuery + ' select'
set @strDynQuery = @strDynQuery + ' ppl.detail_id,'
set @strDynQuery = @strDynQuery + ' ppl.run_id,'
set @strDynQuery = @strDynQuery + ' s.chg_of_owner_id,'
set @strDynQuery = @strDynQuery + ' coopa.prop_id,'
set @strDynQuery = @strDynQuery + ' s.sl_dt as ''sale_date'','
set @strDynQuery = @strDynQuery + ' ''sale_price'' = case when s.adjusted_sl_price is not null then s.adjusted_sl_price'
set @strDynQuery = @strDynQuery + ' else s.sl_price  end,'
set @strDynQuery = @strDynQuery + ' ISNULL(pp.living_area, 0) as living_area,'
set @strDynQuery = @strDynQuery + ' (pv.cost_land_hstd_val+pv.cost_land_non_hstd_val+pv.cost_ag_market+pv.cost_timber_market) as ''land_total_val''  ,'
set @strDynQuery = @strDynQuery + ' pv.cost_imprv_hstd_val+pv.cost_imprv_non_hstd_val as ''imprv_val'','
set @strDynQuery = @strDynQuery + ' ''is_outlier''= case when s.suppress_on_ratio_rpt_cd =''T'' then 1  else 0  end '
--set @strDynQuery = @strDynQuery + ' s.sl_ratio_type_cd,'
--set @strDynQuery = @strDynQuery + ' s.sl_type_cd'
set @strDynQuery = @strDynQuery + ' FROM chg_of_owner_prop_assoc as coopa WITH (NOLOCK)'
set @strDynQuery = @strDynQuery + ' INNER join sale as s WITH (NOLOCK)'
set @strDynQuery = @strDynQuery + ' on coopa.chg_of_owner_id  = s.chg_of_owner_id'
set @strDynQuery = @strDynQuery + ' INNER JOIN profile_prop_list as ppl WITH (NOLOCK)'
set @strDynQuery = @strDynQuery + ' ON coopa.prop_id  = ppl.prop_id'
set @strDynQuery = @strDynQuery + ' INNER JOIN prop_supp_assoc psa WITH (NOLOCK)'
set @strDynQuery = @strDynQuery + ' ON psa.prop_id = coopa.prop_id'
set @strDynQuery = @strDynQuery + ' INNER JOIN property_val pv WITH (NOLOCK)'
set @strDynQuery = @strDynQuery + ' ON pv.prop_id = coopa.prop_id AND'
set @strDynQuery = @strDynQuery + ' pv.sup_num = psa.sup_num AND'
set @strDynQuery = @strDynQuery + ' pv.prop_val_yr = psa.owner_tax_yr'
set @strDynQuery = @strDynQuery + ' INNER JOIN property_profile pp WITH(NOLOCK)'
set @strDynQuery = @strDynQuery + ' ON pp.prop_id = pv.prop_id AND'
set @strDynQuery = @strDynQuery + ' pp.prop_val_yr = pv.prop_val_yr'
set @strDynQuery = @strDynQuery + ' WHERE'
set @strDynQuery = @strDynQuery + ' ppl.detail_id = ' + CAST( @detail_id as varchar(10) )
set @strDynQuery = @strDynQuery + ' AND psa.owner_tax_yr = ' + CAST( @prop_val_yr as varchar(10) )

if (@valid_date=1 )
BEGIN
    set @strDynQuery = @strDynQuery + ' AND s.sl_dt>= ''' + dbo.fn_FormatDate( @begin_date, 0 )+''''
    set @strDynQuery = @strDynQuery + ' AND s.sl_dt<= ''' + dbo.fn_FormatDate( @end_date, 0 )+''''
END
 
 if (@filter_by_sale_type_cd = 1 )
BEGIN
    set @strDynQuery = @strDynQuery + 'AND sl_type_cd IN (SELECT DISTINCT sl_type_cd FROM #my_sale_type_cds WITH(NOLOCK))'
END

if (@filter_by_sale_sale_ratio_type_cd=1)
BEGIN
    set @strDynQuery = @strDynQuery + 'AND sl_ratio_type_cd in (SELECT DISTINCT sl_ratio_type_cd FROM #my_sale_ratio_type_cds WITH(NOLOCK))'
END
--
INSERT INTO [nbhd_cost_calc_capture_props] exec(@strDynQuery)

--------------------------------------------------------------------------------------------
--Calculate the sample size ( this is defined as: The count of the number of sales in a neighborhood meeting the date and selection
DECLARE @SampleSize as int
DECLARE @sample_size_pct as numeric(14, 4)
DECLARE @population as int
--
SET @sampleSize = 0
SELECT @sample_size_pct = '0.0'

IF (@valid_date=1)
BEGIN
    SELECT @sampleSize = COUNT(*) 
           FROM nbhd_cost_calc_capture_props WITH (NOLOCK)
           where profile_run_list_detail_id = @detail_id
    --
    SELECT @sample_size_pct = 
        CASE WHEN population > 0 THEN ( (CAST(@sampleSize AS numeric(14,4)) / CAST(population AS numeric(14,4)) ) * 100.0 )
             ELSE 0.0
        END --CASE
        FROM nbhd_cost_calc_capture WITH (NOLOCK)
        where profile_run_list_detail_id = @detail_id
    -- 
 
END
--
    UPDATE nbhd_cost_calc_capture
    SET sample_size = @SampleSize, 
        sample_size_pct = @sample_size_pct 
        WHERE 
        profile_run_list_detail_id = @detail_id
--
    UPDATE  nbhd_cost_calc_capture_props
        SET is_outlier = o.is_outlier
        FROM   nbhd_cost_calc_capture_props nccp WITH(NOLOCK)
        INNER JOIN #outliers o WITH(NOLOCK)
        ON o.detail_id = nccp.profile_run_list_detail_id
        AND o.run_id = nccp.run_id
        AND o.chg_of_owner_id = nccp.chg_of_owner_id
        AND o.prop_id = nccp.prop_id


set nocount off

GO

