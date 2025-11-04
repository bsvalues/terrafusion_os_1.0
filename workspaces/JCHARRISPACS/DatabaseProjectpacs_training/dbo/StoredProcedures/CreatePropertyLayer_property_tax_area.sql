CREATE   PROCEDURE CreatePropertyLayer_property_tax_area
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(50) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End') 
/* End top of each procedure to capture parameters */
INSERT INTO 
    property_tax_area
(
    year
   ,sup_num
   ,prop_id
   ,tax_area_id
   ,tax_area_id_pending
   ,effective_date
   ,is_annex_value
)
SELECT 
    @lCopyToYear
    ,0  -- pta.sup_num
    ,pta.prop_id
    ,case when new_annex.prop_id IS NULL THEN pta.tax_area_id
          else isnull(pta.tax_area_id_pending, pta.tax_area_id) -- has matching annex with start_year = new year
     end
    ,case when pending_annex.prop_id IS NOT NULL then pending_annex.tax_area_destination_id 
          when new_annex.prop_id IS NULL THEN pta.tax_area_id_pending
          else NULL -- has matching annex with start_year = new year but not a pending annex
     end 
    ,case when pending_annex.prop_id IS NOT NULL then pending_annex.effective_date
          else NULL 
     end          
    ,case when new_annex.prop_id IS NULL THEN 0
          else 1 -- has matching annex with start_year = new year
     end
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      property_tax_area as pta  with(tablockx) 
   on pta.year = cplpl.prop_val_yr
  and pta.sup_num = cplpl.sup_num
  and pta.prop_id = cplpl.prop_id
left join -- get matching annexation info with start_year = to new year, if it exists
      (select apa.prop_id,a.effective_date,a.start_year
         from annexation_property_assoc apa join
              annexation a
           on apa.annexation_id = a.annexation_id
         where a.start_year = @lCopyToYear
         and a.accept_date is not null
	   ) as new_annex
  on  pta.prop_id = new_annex.prop_id
 and pta.effective_date = new_annex.effective_date
left join -- see if there is a pending annexation for year after new year being copied to
      (select apa.prop_id,tam.tax_area_destination_id, max(a.effective_date) as effective_date
         from annexation as a 
         join
              annexation_property_assoc as apa
           on a.annexation_id = apa.annexation_id
         join 
              tax_area_mapping as tam
           on tam.annexation_id = apa.annexation_id
          and tam.tax_area_source_id = apa.tax_area_source_id
        where a.start_year >= @lCopyToYear + 1
          and YEAR(a.effective_date) < @lCopyToYear + 1
          and a.accept_date is not null
        group by prop_id,tam.tax_area_destination_id
       ) as pending_annex 
  on  pta.prop_id = pending_annex.prop_id

-- update log

exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

