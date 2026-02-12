
CREATE PROCEDURE AppraisalCardInfoSE  
 @prop_id  int,      
 @year   Numeric(4,0),      
 @sup_num  int = 0,      
 @sale_id  int = 0,      
 @UDIOutputType  int = 0,  --  0=Parent & Children, 1=Parent Only, 2=Children Only      
 @DatasetId  int = -1     --number of dataset you want to get, -1 - all    
AS      
      
SET NOCOUNT ON      
DECLARE @prior_yr_sup_num int      
DECLARE @currentDatasetId int    
declare @CurrentPropertySupNum int  
set  @currentDatasetId=0    
  
declare @bIsUDIParent int  
set @bIsUDIParent = 0 --false  
     
 /*      
  * If sup_num = -1 get the latest one...      
  */      
IF @sup_num = -1      
BEGIN      
  SELECT @CurrentPropertySupNum = sup_num      
   FROM prop_supp_assoc WITH (NOLOCK)      
  WHERE prop_id = @prop_id      
    AND owner_tax_yr = @year      
END    
  
if (@CurrentPropertySupNum is null)  
 set @CurrentPropertySupNum=0       
  
declare @prop_type varchar  
  
select @prop_type=prop_type_cd   
from  property   
WHERE prop_id = @prop_id  
  
    
 /*      
  * PROPERTY ID AND LEGAL DESCRIPTION area     
    
  */    
  
--print @prop_type    
  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
if @prop_type='MH'   
begin   
 IF @UDIOutputType = 0 -- parent and children      
   BEGIN      
    SELECT * FROM appr_card_mobile_property_vw with (nolock)   
    WHERE   
   prop_id = @prop_id  
   AND prop_val_yr = @year  
   AND sup_num = @CurrentPropertySupNum  
    UNION   
    SELECT * FROM appr_card_mobile_property_vw with (nolock)   
    WHERE   
   udi_parent_prop_id = @prop_id  
   AND prop_val_yr =  @year   
   AND sup_num = @CurrentPropertySupNum  
   AND prop_inactive_dt IS NULL   
   ORDER BY udi_parent_prop_id, prop_id     
  
  END     
   
 IF @UDIOutputType = 1 -- parent only      
   BEGIN      
     SELECT * FROM appr_card_mobile_property_vw with (nolock)   
     WHERE  
   prop_id = @prop_id   
   AND prop_val_yr = @year  
   AND sup_num =  @CurrentPropertySupNum  
   END      
       
 IF @UDIOutputType = 2 -- children only      
   BEGIN      
   SELECT * FROM appr_card_mobile_property_vw with (nolock)   
      WHERE prop_id = @prop_id  
        AND prop_val_yr = @year           
        AND sup_num = @CurrentPropertySupNum  
   end  
end  
  
ELSE   
begin    
  
   
 IF @sup_num = -1      
  BEGIN   
  
  if @UDIOutputType = 0  
   begin  
  
      SELECT *   
     FROM appr_card_curr_property_vw with (nolock)   
      WHERE   
     prop_id = @prop_id  
     AND prop_val_yr = @year  
      UNION   
      SELECT * FROM appr_card_curr_property_vw with (nolock)   
      WHERE   
      udi_parent_prop_id = @prop_id  
      AND prop_val_yr = @year  
      AND prop_inactive_dt IS NULL   
    ORDER BY udi_parent_prop_id,  prop_id, sup_num DESC   
  
   end  
   else if @UDIOutputType = 1 --UDIParentOnly  
   begin  
  
    SELECT *   
    FROM appr_card_curr_property_vw with (nolock)   
    WHERE   
       prop_id = @prop_id  
       AND prop_val_yr = @year  
  
   end  
  
   else if @UDIOutputType = 2 --UDIChildrenOnly  
    begin  
   -- Determine if the property passed in is a UDI parent property    
    declare @tmp int  
  
     SELECT @tmp=udi_parent FROM appr_card_curr_property_vw with (nolock)   
     WHERE prop_id = @prop_id  
     AND prop_val_yr = @year  
      
    if (@tmp is not null)  
    begin  
     if ((@tmp = 'T')or (@tmp = 'D'))  
     begin  
       
       set @bIsUDIParent=1 --true  
       
       SELECT * FROM appr_card_curr_property_vw with (nolock)   
       WHERE udi_parent_prop_id = @prop_id  
         AND prop_val_yr = @year    
         AND prop_inactive_dt IS NULL   
           
     end  
     else     
     begin  
       
       set @bIsUDIParent=0 --false  
       
       SELECT * FROM appr_card_curr_property_vw with (nolock)   
       WHERE prop_id = @prop_id  
         AND prop_val_yr = @year  
        
     end       
    end  
end  
  END  
 else --sup num  
  begin  
  
   IF @UDIOutputType = 0 -- parent and children      
   BEGIN      
    SELECT * FROM appr_card_property_vw with (nolock)   
    WHERE   
   prop_id = @prop_id  
   AND prop_val_yr = @year  
   AND sup_num = @sup_num  
    UNION   
    SELECT * FROM appr_card_property_vw with (nolock)   
    WHERE   
   udi_parent_prop_id = @prop_id  
   AND prop_val_yr =  @year   
   AND sup_num = @sup_num  
   AND prop_inactive_dt IS NULL   
   ORDER BY udi_parent_prop_id, prop_id     
  
   END      
   IF @UDIOutputType = 1 -- parent only      
   BEGIN      
     SELECT * FROM appr_card_property_vw with (nolock)   
     WHERE  
   prop_id = @prop_id   
   AND prop_val_yr = @year  
   AND sup_num =  @sup_num  
   END      
        
   IF @UDIOutputType = 2 -- children only      
   BEGIN      
       
   --declare @tmp int  
   SELECT @tmp=udi_parent FROM appr_card_property_vw with (nolock)   
     WHERE prop_id = @prop_id  
        AND prop_val_yr = @year  
        AND sup_num = @sup_num  
       
   if @tmp is not null  
   begin  
    if ((@tmp = 'T')or (@tmp = 'D'))  
      begin  
        
      set @bIsUDIParent=1 --true  
      SELECT * FROM appr_card_property_vw with (nolock)   
      WHERE udi_parent_prop_id = @prop_id  
        AND prop_val_yr = @year    
        AND prop_inactive_dt IS NULL   
        AND sup_num = @sup_num  
          
      end  
    else  
     begin  
      
      set @bIsUDIParent=0 --false  
      SELECT * FROM appr_card_property_vw with (nolock)   
      WHERE prop_id = @prop_id  
        AND prop_val_yr = @year  
        AND sup_num = @sup_num  
          
     end   
   end  
        
   END   
      
  end   
  
 end  
  
  
set  @currentDatasetId=@currentDatasetId +1    
    
 /*      
  * OWNER ID, NAME AND ADDRESS area      
  */      
 -- if its not a UDI parent property, just do what we always did      
 -- otherwise, worry about getting parent/child owner data      
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin    
 IF NOT EXISTS(      
  SELECT prop_id       
  FROM property_val       
  WHERE prop_id = @prop_id       
  and prop_val_yr = @year      
  and sup_num = @sup_num      
  and udi_parent in ('T', 'D')      
 )      
      BEGIN  
      if (@UDIOutputType = 0)  
      BEGIN  
  
        select top 1 owner.owner_id  as owner_id,  @year  AS owner_tax_yr,  @prop_id  
             AS prop_id, 100 as pct_ownership,   
         
            coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
        situs.situs_unit as addr_line2, null as addr_line3, situs.situs_city as addr_city,   
        situs.situs_state as addr_state, 'US' as country_cd, situs.situs_zip as addr_zip,   
        NULL as zip_4_2, 'UDI Parent Property' as file_as_name,  @CurrentPropertySupNum  
             AS sup_num,   
         
            NULL as ref_id1, situs.situs_zip as zip, NULL as cass, NULL as route, NULL as udi_child_prop_id   
        FROM property   
          
        LEFT OUTER JOIN situs with (nolock) ON situs.prop_id = property.prop_id   
          left outer join  owner with (nolock) ON owner.prop_id = property.prop_id   
        WHERE property.prop_id =  @prop_id  AND coalesce(situs.primary_situs, 'Y') = 'Y'   
  
          
        UNION   
          
        select top 1 owner.owner_id  as owner_id,  @year  AS owner_tax_yr,  @prop_id  
             AS prop_id, 100 as pct_ownership,   
          
         
            coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
          
        situs.situs_unit as addr_line2, null as addr_line3, situs.situs_city as addr_city,   
          
        situs.situs_state as addr_state, 'US' as country_cd, situs.situs_zip as addr_zip,   
          
        NULL as zip_4_2, 'UDI Parent Property' as file_as_name,  @CurrentPropertySupNum  
             AS sup_num,   
          
         
            NULL as ref_id1, situs.situs_zip as zip, NULL as cass, NULL as route, NULL as udi_child_prop_id   
          
        FROM property   
          
        LEFT OUTER JOIN situs with (nolock) ON situs.prop_id = property.prop_id   
        left outer join  owner with (nolock) ON owner.prop_id = property.prop_id    
        WHERE property.prop_id =  @prop_id  
             AND property.prop_id NOT IN (select prop_id from situs with (nolock) where primary_situs = 'Y')   
  
          
        UNION   
          
         
            SELECT acov.* FROM appr_card_owner_vw AS acov with (nolock) INNER JOIN property_val AS pv with (nolock)   
          
         
            ON pv.prop_id = acov.prop_id AND pv.prop_val_yr = acov.owner_tax_yr AND pv.sup_num = acov.sup_num   
          
        WHERE pv.udi_parent_prop_id =  @prop_id  AND pv.prop_val_yr =  @year  
             AND pv.sup_num =  @CurrentPropertySupNum    
          
        AND pv.prop_inactive_dt IS NULL   
  
  
      END  
      else if (@UDIOutputType = 1)  
      BEGIN  
  
        select top 1 owner.owner_id  as owner_id,  @year  AS owner_tax_yr,  @prop_id  
             AS prop_id, 100 as pct_ownership,   
          
         
            coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
          
        situs.situs_unit as addr_line2, null as addr_line3, situs.situs_city as addr_city,   
          
        situs.situs_state as addr_state, 'US' as country_cd, situs.situs_zip as addr_zip,   
          
        NULL as zip_4_2, 'UDI Parent Property' as file_as_name,  @CurrentPropertySupNum  
             AS sup_num,   
          
         
            NULL as ref_id1, situs.situs_zip as zip, NULL as cass, NULL as route, NULL as udi_child_prop_id   
          
        FROM property   
          
        LEFT OUTER JOIN situs with (nolock) ON situs.prop_id = property.prop_id   
         left outer join  owner with (nolock) ON owner.prop_id = property.prop_id   
        WHERE property.prop_id =  @prop_id  AND coalesce(situs.primary_situs, 'Y') = 'Y'   
  
          
        UNION   
          
        select top 1 owner.owner_id  as owner_id,  @year  AS owner_tax_yr,  @prop_id  
             AS prop_id, 100 as pct_ownership,   
          
         
            coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
          
        situs.situs_unit as addr_line2, null as addr_line3, situs.situs_city as addr_city,   
          
        situs.situs_state as addr_state, 'US' as country_cd, situs.situs_zip as addr_zip,   
          
        NULL as zip_4_2, 'UDI Parent Property' as file_as_name,  @CurrentPropertySupNum  
             AS sup_num,   
          
         
            NULL as ref_id1, situs.situs_zip as zip, NULL as cass, NULL as route, NULL as udi_child_prop_id   
          
        FROM property   
          
        LEFT OUTER JOIN situs with (nolock) ON situs.prop_id = property.prop_id   
         left outer join  owner with (nolock) ON owner.prop_id = property.prop_id   
        WHERE property.prop_id =  @prop_id  
             AND property.prop_id NOT IN (select prop_id from situs with (nolock) where primary_situs = 'Y')   
  
      END  
      else if (@UDIOutputType = 2)  
      BEGIN  
  
         
        SELECT acov.* FROM appr_card_owner_vw AS acov with (nolock) INNER JOIN property_val AS pv with (nolock)   
          
         
            ON pv.prop_id = acov.prop_id AND pv.prop_val_yr = acov.owner_tax_yr AND pv.sup_num = acov.sup_num   
          
        WHERE pv.udi_parent_prop_id =  @prop_id  AND pv.prop_val_yr =  @year  
             AND pv.sup_num =  @CurrentPropertySupNum    
        AND pv.prop_inactive_dt IS NULL   
  
      END  
     END  
     else  
     BEGIN  
       SELECT * FROM appr_card_owner_vw with (nolock) WHERE prop_id =  @prop_id  
            AND owner_tax_yr =  @year  AND sup_num =  @CurrentPropertySupNum  
     END  
  
     
    
end    
set  @currentDatasetId=@currentDatasetId +1      
     
 /*      
  * ENTITIES area      
  */      
  if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin    
 SELECT  RTRIM(ISNULL(e.entity_cd,'')) as entity_cd,      
  IsNull(epa.entity_prop_pct, 100) as entity_prop_pct,      
  epa.entity_id,      
  case when exists(select prop_id      
      from imprv_entity_assoc as ipa      
      with (nolock)      
      where prop_id = epa.prop_id      
      and prop_val_yr = epa.tax_yr      
      and sup_num = epa.sup_num      
      
      union      
      
      select prop_id      
      from land_entity_assoc as ipa      
      with (nolock)      
      where prop_id = epa.prop_id      
      and prop_val_yr = epa.tax_yr      
      and sup_num = epa.sup_num      
      
      union      
      
      select prop_id      
      from pers_prop_entity_assoc as ipa      
      with (nolock)      
      where prop_id = epa.prop_id      
      and prop_val_yr = epa.tax_yr      
      and sup_num = epa.sup_num)      
    then '*'      
    else ''      
    end as entity_pct_flag      
      
 FROM entity_prop_assoc as epa      
 WITH (NOLOCK)      
      
 INNER JOIN entity as e      
 WITH (NOLOCK)      
 ON epa.entity_id = e.entity_id      
      
 WHERE epa.prop_id = @prop_id      
 AND epa.tax_yr = @year      
 AND epa.sup_num = @sup_num      
      
 ORDER BY e.entity_cd      
     
end    
set  @currentDatasetId=@currentDatasetId +1     
   
 /*      
  * prevYearOwnerPropertyInfo      
  */  
  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin   
  
 SELECT appr_card_property_vw.appraised_val, appr_card_owner_vw.pct_ownership              
 FROM appr_card_property_vw with (nolock)    
   
    JOIN appr_card_owner_vw with (nolock)  
    on appr_card_owner_vw.prop_id = appr_card_property_vw.prop_id   
    AND  appr_card_owner_vw.owner_tax_yr = appr_card_property_vw.prop_val_yr   
    AND  appr_card_owner_vw.sup_num = appr_card_property_vw.sup_num    
     
    Where    
   appr_card_property_vw.prop_id =  @prop_id  AND    
   appr_card_property_vw.prop_val_yr =   (@year - 1)  AND    
   appr_card_property_vw.sup_num = (  
            SELECT sup_num From prop_supp_assoc With (NOLOCK)   
            WHERE   
             prop_id =  @prop_id     
             AND owner_tax_yr =  (@year - 1)  )  
  
  
end    
set  @currentDatasetId=@currentDatasetId +1     
  
/*  
isUdiChild region  
*/  
declare @isUdiChild int  
declare @udi_parent_prop_id int  
set @isUdiChild = 0  
  
SELECT @udi_parent_prop_id=udi_parent_prop_id       
  FROM property_val       
  WHERE prop_id = @prop_id       
  and prop_val_yr = @year      
  and sup_num = @sup_num      
  and udi_parent in ('T', 'D')    
and udi_parent_prop_id is not null    
  
  
if   @udi_parent_prop_id is not null  
begin  
set @isUdiChild=1  
end  
  
  
  
/*  
* region imprvInfoReader  
*/  
 declare @strSQL varchar(5000)  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin  
  
 if (@isUdiChild=1)  
 begin  
  
  set @strSQL =       
    '   
  SELECT * FROM appr_card_imprv_vw with (nolock)   
     WHERE prop_id ='+CAST ( @udi_parent_prop_id as varchar) +'  
     AND prop_val_yr = '+ CAST ( @year as varchar)  +'  
     AND sup_num =  '+ CAST ( @CurrentPropertySupNum as varchar)   
    if (@sale_id >= 0)   
    set @strSQL =  @strSQL +' AND sale_id = '+ CAST ( @sale_id as varchar) --+ SaleID  
  set @strSQL = @strSQL+' ORDER BY imprv_id, imprv_det_id'  
    
 end   
 else  
 begin  
  
  set @strSQL =       
    'SELECT * FROM appr_card_imprv_vw with (nolock)   
   WHERE prop_id = '+ CAST ( @prop_id as varchar)+'  
   AND prop_val_yr = '+ CAST ( @year as varchar)  +'  
   AND sup_num = '+ CAST ( @CurrentPropertySupNum as varchar)   
--print @strSQL  
      
      if (@sale_id >= 0)   
    set @strSQL =  @strSQL +' AND sale_id = '+  CAST ( @sale_id as varchar) --+ SaleID  
--print @strSQL  
  
 end  
--print @strSQL  
 exec(@strSQL)   
end    
set  @currentDatasetId=@currentDatasetId +1     
  
  
/*  
* region landInfoReader  
*/  
  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin  
  
if @isUdiChild=1  
begin  
set @strSQL =       
  '  
SELECT * FROM appr_card_land_vw with (nolock)   
WHERE prop_id =  '+CAST ( @udi_parent_prop_id as varchar)+'  
AND prop_val_yr ='+  CAST ( @year as varchar)  +'  
AND sup_num = '+ CAST ( @CurrentPropertySupNum as varchar)   
  if (@sale_id >= 0)   
  set @strSQL =  @strSQL +' AND sale_id = '+ CAST ( @sale_id as varchar) --+ SaleID  
 set @strSQL =  @strSQL +' ORDER BY land_seg_id '  
  
end   
else  
begin  
set @strSQL =       
  '  
SELECT * FROM appr_card_land_vw with (nolock)   
WHERE prop_id = '+ CAST ( @prop_id as varchar)+'  
AND prop_val_yr ='+  CAST ( @year as varchar)  +'  
AND sup_num ='+ CAST ( @CurrentPropertySupNum as varchar)   
  if (@sale_id >= 0)   
  set @strSQL =  @strSQL +' AND sale_id = '+ CAST ( @sale_id as varchar)  
end  
exec(@strSQL)   
end    
set  @currentDatasetId=@currentDatasetId +1     
  
  
/*  
* region imprvFeaturesInfoReader  
*/  
  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin  
  
if @isUdiChild=1  
begin  
set @strSQL =       
  '  
SELECT * FROM appr_card_imprv_features_vw with (nolock)   
WHERE prop_id = '+  CAST ( @udi_parent_prop_id as varchar)+'  
AND prop_val_yr =  '+CAST ( @year as varchar)  +'  
AND sup_num = '+ CAST ( @CurrentPropertySupNum as varchar)  
  if (@sale_id >= 0)   
  set @strSQL =  @strSQL +' AND sale_id = '+ CAST ( @sale_id as varchar)  
  
  set @strSQL =  @strSQL +' ORDER BY imprv_det_id, imprv_attr_val DESC, imprv_attr_id, i_attr_val_id'  
  
end   
else  
begin  
set @strSQL =       
  'SELECT * FROM appr_card_imprv_features_vw with (nolock)   
WHERE prop_id =  '+CAST ( @prop_id as varchar)+  
'AND prop_val_yr = '+ CAST ( @year as varchar) +'  
AND sup_num ='+CAST ( @CurrentPropertySupNum as varchar)   
  if (@sale_id >= 0)   
  set @strSQL =  @strSQL +' AND sale_id = '+ CAST ( @sale_id as varchar)  
  
  set @strSQL =  @strSQL +' ORDER BY imprv_det_id, imprv_attr_val DESC, imprv_attr_id, i_attr_val_id'  
  
end  
exec(@strSQL)   
end    
set  @currentDatasetId=@currentDatasetId +1     
  
-------------------------------------------------------------------------------------------------  
  
/*  
* region persPropInfoReader  
*/  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin  
if @isUdiChild=1  
begin  
  
 SELECT * FROM appr_card_pers_prop_vw with (nolock)   
  WHERE prop_id =  @udi_parent_prop_id  
  AND prop_val_yr =  @year   
  and sup_num =  @CurrentPropertySupNum  
  ORDER BY pp_type_cd, pp_seg_id  
  
end   
else  
 begin  
  
 SELECT * FROM appr_card_pers_prop_vw with (nolock)  
  WHERE prop_id =  @prop_id  
  AND prop_val_yr =  @year    
  and sup_num =  @CurrentPropertySupNum  
  ORDER BY pp_type_cd, pp_seg_id  
  
 end  
  
end    
set  @currentDatasetId=@currentDatasetId +1    
  
  
/*  
* region persPropRenditionInfoReader  
*/  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin  
  
 if @isUdiChild=1  
  begin  
   SELECT rendition_date, signed_by FROM pers_prop_rendition with (nolock)   
   WHERE prop_id =  @udi_parent_prop_id  
   AND rendition_year =  @year  
  end   
 else  
  begin  
   SELECT rendition_date, signed_by   
   FROM pers_prop_rendition with (nolock)   
   WHERE prop_id =  @prop_id  
   AND rendition_year =  @year  
  
  end  
  
end    
set  @currentDatasetId=@currentDatasetId +1    
  
  
/*  
* region persLinkedInfoReader  
*/  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin  
  
if @isUdiChild=1  
begin  
 SELECT child_prop_id FROM property_assoc with (nolock)   
 WHERE parent_prop_id =  @udi_parent_prop_id  
 ORDER BY child_prop_id  
end   
else  
begin  
  
 SELECT child_prop_id FROM property_assoc with (nolock)   
 WHERE parent_prop_id =  @prop_id  
 ORDER BY child_prop_id  
  
end  
  
end    
set  @currentDatasetId=@currentDatasetId +1    
  
  
/*  
* region persPropSICDescriptionReader  
*/  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0))     
begin  
  
SELECT sic_desc,sic_cd FROM sic_code with (nolock)  
  
  
  
end

GO

