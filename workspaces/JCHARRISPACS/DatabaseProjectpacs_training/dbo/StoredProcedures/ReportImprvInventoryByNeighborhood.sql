
-- delete from ##nbhd_inventory_imprv_report where dataset_id = 1 exec dbo.ReportImprvInventoryByNeighborhood 1,'2009','0111,0001',NULL
--select * from ##nbhd_inventory_imprv_report where dataset_id = 1
CREATE PROCEDURE dbo.ReportImprvInventoryByNeighborhood

  @dataset_id int,
  @yr numeric(4,0),
  @nbhood_list varchar(4000), -- comma delimited list of neighborhood codes OR NULL for all nbhoods',
  @sub_cls_cd_list varchar(4000) -- comma delimited list of sub class codes OR NULL for all sub class codes 

AS

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @dataset_id =' +  convert(varchar(30),@dataset_id) + ','
 + ' @yr =' +  convert(varchar(30),@yr) + ','
 + ' @nbhood_list =' + isnull(@nbhood_list,'') + ','
 + ' @sub_cls_cd_list =' + isnull(@sub_cls_cd_list,'') 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
set @StartStep = getdate()  --logging capture start time of step

declare @nbhood table(hood_cd varchar(10))
declare @sub_cls table(sub_cls_cd varchar(10))

-- 1st narrow which properties we need to look at
create table #props
 ( prop_id int
  ,sup_num int
  ,hood_cd varchar(10)
 )

if @nbhood_list IS NOT NULL
   begin
      -- put list of neighborhood codes into a table for join in later step
      insert into @nbhood(hood_cd)
        select id from dbo.fn_ReturnTableFromCommaSepValues(@nbhood_list)
   end
if @nbhood_list IS NULL
   begin
      -- insert all neighborhood codes for cross tab combinations
      insert into @nbhood(hood_cd)
        select  hood_cd from neighborhood where hood_yr = @yr
   end
if @sub_cls_cd_list IS NOT NULL
   begin
      -- put list of neighborhood codes into a table for join in later step
      insert into @sub_cls(sub_cls_cd)
        select id from dbo.fn_ReturnTableFromCommaSepValues(@sub_cls_cd_list)
   end


create table #all_possible_combos
(  hood_cd varchar(15)
  ,[class] char(10)
  ,class_desc varchar(50)
  ,yr_range_id int
  ,ss_range_id int
  ,year_range_desc varchar(30)
  ,sqft_range_desc varchar(30)
  ,subclass_cd varchar(10)
  ,subclass_desc varchar(50)
)

insert into #all_possible_combos
(  hood_cd 
  ,[class]
  ,class_desc
  ,yr_range_id 
  ,ss_range_id 
  ,year_range_desc 
  ,sqft_range_desc 
  ,subclass_cd 
  ,subclass_desc 
)
select 
     n.hood_cd,
     idc.imprv_det_class_cd as [class],
     idc.imprv_det_cls_desc as [class_desc],
     yr.range_id as yr_range_id,
     ss.range_id as ss_range_id,
     (convert(varchar(15), yr.min_value) + '-' + convert(varchar(15), yr.max_value)) as [years],
     (convert(varchar(15), ss.min_value) + ' TO ' + convert(varchar(15), ss.max_value)) as [sqfts],
     ids.imprv_det_sub_cls_cd as [subclass],
     ids.imprv_det_sub_cls_desc as [subclass_desc]
from imprv_det_class idc with(nolock)
     cross join
     nbhd_inventory_imprv_year_range yr with(nolock)
     cross join
     nbhd_inventory_imprv_sqft_range ss with(nolock)
     cross join
     imprv_det_sub_class ids with(nolock)
     cross join
     @nbhood as n
where (@sub_cls_cd_list IS NULL -- all sub class codes
           OR
         exists
       (select sub_cls_cd from @sub_cls as s
         where ids.imprv_det_sub_cls_cd = s.sub_cls_cd)
       )    

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
   
create clustered index idx_hood_cd on #all_possible_combos
  (hood_cd,[class],yr_range_id,ss_range_id,subclass_cd)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
  

if @nbhood_list IS NULL
   begin
      -- delete codes from temp table, only used for possible combinations
      delete from @nbhood
      -- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 2.5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

   end
   
set @StartStep = getdate()  --logging capture start time of step


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
   
insert into #props
( prop_id
 ,sup_num
 ,hood_cd
)
select pv.prop_id
	  ,pv.sup_num
	  ,pv.hood_cd  
 from
	 property_val pv with(nolock)
	 inner join
	 prop_supp_assoc psa with(nolock)
  on psa.owner_tax_yr = pv.prop_val_yr
 and psa.sup_num = pv.sup_num
 and psa.prop_id = pv.prop_id
 where pv.prop_val_yr = @yr
   and ( @nbhood_list IS NULL -- all neigbhorhoods
           OR
         exists
       (select hood_cd from @nbhood as n
         where pv.hood_cd = n.hood_cd)
       )

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
 
create clustered index idx_props on #props(prop_id,sup_num,hood_cd)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

-- now that we have the properties, get related imprv information

create table #imprvs
(
  prop_id int
 ,imprv_id int
 ,sup_num int
	,has_ma_details bit
 ,imprv_det_class_cd char(10)
 ,imprv_det_sub_class_cd varchar(10) 
 ,yr_range_id int
 ,ss_range_id int
)

insert into #imprvs
(
  prop_id  
 ,imprv_id
 ,sup_num
	,has_ma_details
)
select 
		i.prop_id, i.imprv_id, i.sup_num,
		case when exists (select * from imprv_detail id with(nolock)
				inner join
						imprv_det_type idt with(nolock)
								on id.imprv_det_type_cd = idt.imprv_det_type_cd
				where id.prop_id = id.prop_id and id.imprv_id = i.imprv_id	and id.prop_val_yr = @yr
						and idt.main_area = 'T'
		) then 1 else 0 end
from 
		imprv i with(nolock)
inner join #props p
		on p.prop_id = i.prop_id 
				and p.sup_num = i.sup_num
where i.prop_val_yr = @yr and exists (select * from imprv_detail id with(nolock)
				where id.prop_id = id.prop_id and id.imprv_id = i.imprv_id	and id.prop_val_yr = @yr)


 
-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
  
create clustered index idx_imprvs on #imprvs(prop_id,sup_num)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
 

 
-- now that we have the improvements, get related imprv_details information

create table #id
(
  prop_id int
 ,imprv_id int
 ,imprv_det_id int
 ,sup_num int
 ,imprv_det_class_cd char(10)
 ,depreciation_yr numeric(4,0)
 ,imprv_det_sub_class_cd varchar(10)
 ,net_rentable_area numeric(18,0)
 ,imprv_det_val numeric(18,0)
)

insert into #id
(
  prop_id  
 ,imprv_id  
 ,imprv_det_id 
 ,sup_num  
 ,imprv_det_class_cd  
 ,depreciation_yr  
 ,imprv_det_sub_class_cd  
 ,net_rentable_area
 ,imprv_det_val
)
select id.prop_id
     , id.imprv_id
     , id.imprv_det_id
     , id.sup_num
     , id.imprv_det_class_cd
     , id.depreciation_yr
     , id.imprv_det_sub_class_cd
     , id.net_rentable_area
     , id.imprv_det_val
from imprv_detail id with(nolock)
 				inner join
					#imprvs as i
	 on id.prop_id = i.prop_id
 and id.sup_num = i.sup_num
	and id.imprv_id = i.imprv_id
     inner join
     imprv_det_type idt with(nolock)
  on id.imprv_det_type_cd = idt.imprv_det_type_cd
WHERE id.prop_val_yr = @yr 
		and (i.has_ma_details = 0 or idt.main_area = 'T') -- either all main area details or all details
		and id.imprv_det_sub_class_cd is not null 
  and ( @sub_cls_cd_list IS NULL -- all sub class codes
           OR
         exists
       (select sub_cls_cd from @sub_cls as s
         where id.imprv_det_sub_class_cd = s.sub_cls_cd)
       )
 
-- Update the imprvs table with the total rentable area range id
update i
set i.ss_range_id = isnull(ss.range_id, 0)		
from #imprvs i
inner join (
		select id.prop_id, id.imprv_id, id.sup_num, sum(isnull(id.net_rentable_area,0)) sum_rentable_area
		from #id id
		group by id.prop_id, id.imprv_id, id.sup_num
) as id
on id.prop_id = i.prop_id and id.imprv_id = i.imprv_id and id.sup_num = i.sup_num
inner join
     nbhd_inventory_imprv_sqft_range as ss
  on id.sum_rentable_area >= ss.min_value
 and id.sum_rentable_area <= ss.max_value
  

-- Update the imprvs table with the year range id
update i
set i.yr_range_id = isnull(yr.range_id, 0),
i.imprv_det_class_cd = id.imprv_det_class_cd,
i.imprv_det_sub_class_cd = id.imprv_det_sub_class_cd
from #imprvs i
				inner join
		#id id with(nolock)
		on id.imprv_id = i.imprv_id and id.sup_num = i.sup_num
    inner join (
						select id.prop_id, id.sup_num, id.imprv_id, max(isnull(id.imprv_det_val, 0)) max_imprv_det_val, ROW_NUMBER() OVER(PARTITION BY id.prop_id, id.sup_num, id.imprv_id ORDER BY id.prop_id, id.imprv_id) as row_id
						from #id id with(nolock)
						group by id.prop_id, id.sup_num, id.imprv_id
) idh 
	on id.prop_id = idh.prop_id
 and id.sup_num = idh.sup_num
	and id.imprv_id = idh.imprv_id
 and id.imprv_det_val = idh.max_imprv_det_val
 and idh.row_id = 1
     inner join
     nbhd_inventory_imprv_year_range as yr
  on id.depreciation_yr >= yr.min_value
 and id.depreciation_yr <= yr.max_value


-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
  
create clustered index idx_id on #id(prop_id,sup_num)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
 

create table #results
(
  hood_cd varchar(10)
 ,imprv_det_class_cd char(10)
 ,yr_range_id int
 ,ss_range_id int
 ,imprv_det_sub_cls_cd varchar(10) 
 ,imprv_cnt int
)


insert into #results   
(
  hood_cd 
 ,imprv_det_class_cd 
 ,yr_range_id 
 ,ss_range_id
 ,imprv_det_sub_cls_cd 
 ,imprv_cnt 
)
select p.hood_cd
      ,i.imprv_det_class_cd 
      ,i.yr_range_id
      ,i.ss_range_id
      ,i.imprv_det_sub_class_cd
      ,count(i.imprv_id) as imprv_cnt
 from #imprvs as i
						inner join
						#props as p
   on p.prop_id = i.prop_id
  and p.sup_num = i.sup_num
group by p.hood_cd
      ,i.imprv_det_class_cd 
      ,i.yr_range_id
      ,i.ss_range_id
      ,i.imprv_det_sub_class_cd  

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
  
create clustered index idx_hood_cd on #results
  (hood_cd,imprv_det_class_cd,yr_range_id,ss_range_id,imprv_det_sub_cls_cd)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step

      
-- last step -- insert results into global temp table
insert into ##nbhd_inventory_imprv_report
(
	dataset_id,
	hood_cd,
	class_cd,
	class_desc,
	year_range_desc,
	sqft_range_desc,
	subclass_cd,
	subclass_desc,
	[count]
)

select @dataset_id
      ,coalesce(r.hood_cd,a.hood_cd) as hood_cd
      ,coalesce(r.imprv_det_class_cd,a.class) as [class]
      ,a.class_desc    
      ,a.year_range_desc 
      ,a.sqft_range_desc
      ,coalesce(r.imprv_det_sub_cls_cd,subclass_cd) as [subclass] 
      ,a.subclass_desc  
      ,isnull(r.imprv_cnt,0)
 from #all_possible_combos as a
      left join
      #results as r
   on a.hood_cd = r.hood_cd
  and a.class = r.imprv_det_class_cd
  and a.yr_range_id = r.yr_range_id
  and a.ss_range_id = r.ss_range_id
  and a.subclass_cd = r.imprv_det_sub_cls_cd
where isnull(r.imprv_cnt,0) > 0
  
      
-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

set @StartStep = getdate()  --logging capture start time of step
    
-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

