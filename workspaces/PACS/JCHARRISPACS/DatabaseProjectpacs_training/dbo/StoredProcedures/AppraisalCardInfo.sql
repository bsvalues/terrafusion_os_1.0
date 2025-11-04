
CREATE PROCEDURE [dbo].[AppraisalCardInfo]  
 @prop_id  int,  
 @year   Numeric(4,0),  
 @sup_num  int = 0,  
 @sale_id  int = 0,  
 @UDIOutputType  int = 0,  -- 33727 changes: 0=Parent & Children, 1=Parent Only, 2=Children Only  
 @DatasetId  int = -1  --number of dataset you want to get, -1 - all
AS  
  
SET NOCOUNT ON  
DECLARE @prior_yr_sup_num int  
DECLARE @currentDatasetId int

set  @currentDatasetId=0
 
 /*  
  * If sup_num = -1 get the latest one...  
  */  
  
 IF @sup_num = -1  
 BEGIN  
  SELECT @sup_num = sup_num  
  FROM prop_supp_assoc  
  WITH (NOLOCK)  
  WHERE prop_id = @prop_id  
  AND owner_tax_yr = @year  
 END  
  
 /*  
  * Title bar area, must have office name in top left corner  
  */  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
 SELECT ISNULL(office_name, '') as office_name  
 FROM system_address  
 WITH (NOLOCK)  
 WHERE system_type = 'A'  
end
set  @currentDatasetId=@currentDatasetId +1
  
 /*  
  * PROPERTY ID AND LEGAL DESCRIPTION area  
  * includes Remarks for the Remarks/Sketch section  
  * includes recalc_flag for Improvements section  
  * includes image_path for Picture section  
  */  
  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin

 IF @UDIOutputType = 0 -- parent and children  
 BEGIN  
  SELECT p.prop_id,  
   RTRIM(ISNULL(p.prop_type_cd,'')) as prop_type_cd,  
   ISNULL(pt.prop_type_desc,'') as type,   
   ISNULL(p.dba_name,'') as dba_name,  
   ISNULL(pv.legal_desc, '') as legal_desc,   
   ISNULL(p.geo_id, '') as geo_id,  
   ISNULL(pv.map_id,'') as map_id,   
   ISNULL(p.ref_id1,'') as ref_id1,   
   ISNULL(p.ref_id2,'') as ref_id2,   
   ISNULL(pv.mapsco,'') as mapsco,   
   CASE WHEN ISNULL(pv.tif_flag, 'F') = 'F' THEN 'N' ELSE 'Y' END as tif_flag,  
   IsNull(LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), ' ')), '') as situs,  
   ISNULL(p.remarks,'') as remarks,  
   ISNULL(pv.image_path,'') as image_path,  
   ISNULL(pv.recalc_flag,'') as recalc_flag,  
   pv.prop_inactive_dt,  
   pv.udi_parent as udi_parent,  
   pv.udi_parent_prop_id  
  FROM property as p  
  WITH (NOLOCK)  
  
  INNER JOIN property_type as pt  
  WITH (NOLOCK)  
  ON p.prop_type_cd = pt.prop_type_cd  
  
  INNER JOIN property_val as pv  
  WITH (NOLOCK)  
  ON p.prop_id = pv.prop_id  
  AND pv.prop_val_yr = @year  
  AND pv.sup_num = @sup_num  
  
  LEFT OUTER JOIN situs as s  
  WITH (NOLOCK)  
  ON p.prop_id = s.prop_id  
  AND s.primary_situs = 'Y'  
  
  WHERE  
   (  
    ( pv.udi_parent_prop_id = @prop_id AND pv.prop_inactive_dt IS NULL ) OR -- We are a [not deleted] child with the given parent  
    pv.prop_id = @prop_id -- We are the given parent  
   )  
  
  ORDER BY pv.udi_parent_prop_id, p.prop_id  
 END  
 IF @UDIOutputType = 1 -- parent only  
 BEGIN  
  SELECT p.prop_id,  
   RTRIM(ISNULL(p.prop_type_cd,'')) as prop_type_cd,  
   ISNULL(pt.prop_type_desc,'') as type,   
   ISNULL(p.dba_name,'') as dba_name,  
   ISNULL(pv.legal_desc, '') as legal_desc,   
   ISNULL(p.geo_id, '') as geo_id,  
   ISNULL(pv.map_id,'') as map_id,   
   ISNULL(p.ref_id1,'') as ref_id1,   
   ISNULL(p.ref_id2,'') as ref_id2,   
   ISNULL(pv.mapsco,'') as mapsco,   
   CASE WHEN ISNULL(pv.tif_flag, 'F') = 'F' THEN 'N' ELSE 'Y' END as tif_flag,  
   IsNull(LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), ' ')), '') as situs,  
   ISNULL(p.remarks,'') as remarks,  
   ISNULL(pv.image_path,'') as image_path,  
   ISNULL(pv.recalc_flag,'') as recalc_flag,  
   pv.prop_inactive_dt,  
   pv.udi_parent as udi_parent,  
   pv.udi_parent_prop_id  
  FROM property as p  
  WITH (NOLOCK)  
  
  INNER JOIN property_type as pt  
  WITH (NOLOCK)  
  ON p.prop_type_cd = pt.prop_type_cd  
  
  INNER JOIN property_val as pv  
  WITH (NOLOCK)  
  ON p.prop_id = pv.prop_id  
  AND pv.prop_val_yr = @year  
  AND pv.sup_num = @sup_num  
  
  LEFT OUTER JOIN situs as s  
  WITH (NOLOCK)  
  ON p.prop_id = s.prop_id  
  AND s.primary_situs = 'Y'  
  
  WHERE pv.prop_id = @prop_id -- We are the specified parent property ID  
 END  
  
 IF @UDIOutputType = 2 -- children only  
 BEGIN  
  
    
  SELECT  
   p.prop_id,  
   RTRIM(ISNULL(p.prop_type_cd,'')) as prop_type_cd,  
   ISNULL(pt.prop_type_desc,'') as type,   
   ISNULL(p.dba_name,'') as dba_name,  
   ISNULL(pv.legal_desc, '') as legal_desc,   
   ISNULL(p.geo_id, '') as geo_id,  
   ISNULL(pv.map_id,'') as map_id,   
   ISNULL(p.ref_id1,'') as ref_id1,   
   ISNULL(p.ref_id2,'') as ref_id2,   
   ISNULL(pv.mapsco,'') as mapsco,   
   CASE WHEN ISNULL(pv.tif_flag, 'F') = 'F' THEN 'N' ELSE 'Y' END as tif_flag,  
   IsNull(LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), ' ')), '') as situs,  
   ISNULL(p.remarks,'') as remarks,  
   ISNULL(pv.image_path,'') as image_path,  
   ISNULL(pv.recalc_flag,'') as recalc_flag,  
   pv.prop_inactive_dt,  
   pv.udi_parent as udi_parent,  
   pv.udi_parent_prop_id  
  FROM property as p  
  WITH (NOLOCK)  
    
  INNER JOIN property_type as pt  
  WITH (NOLOCK)  
  ON p.prop_type_cd = pt.prop_type_cd  
    
  INNER JOIN property_val as pv  
  WITH (NOLOCK)  
  ON p.prop_id = pv.prop_id  
  AND pv.prop_val_yr = @year  
  AND pv.sup_num = @sup_num  
    
  LEFT OUTER JOIN situs as s  
  WITH (NOLOCK)  
  ON p.prop_id = s.prop_id  
  AND s.primary_situs = 'Y'  
    
  WHERE  
   (  
    (pv.udi_parent_prop_id = @prop_id AND pv.prop_inactive_dt IS NULL) OR -- Children of the given parent property ID  
    (pv.prop_id = @prop_id AND pv.udi_parent_prop_id IS NULL AND NOT (ISNULL(udi_parent,'F') = 'T' OR ISNULL(udi_parent,'F') = 'D')) OR -- non-UDI property  
    (pv.prop_id = @prop_id AND pv.udi_parent_prop_id IS NOT NULL AND ISNULL(udi_parent,'F') <> 'T' AND ISNULL(udi_parent,'F') <> 'D') --  child properties specified by the given property ID  
   )  
  
 END 
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
  
  
  -- create a temp table for the agent info  
  create table #AppraisalCardInfo_unique_agent (prop_id INT PRIMARY KEY, file_as_name VARCHAR(70), phone_num VARCHAR(20))  
  
  -- get the number of unique agents  
  declare @agent_count as int  
  SELECT @agent_count = COUNT(*) FROM  
  
    agent_assoc as ag  
  
    LEFT OUTER JOIN account as aga  
    WITH (NOLOCK)  
    ON ag.agent_id = aga.acct_id  
  
    LEFT OUTER JOIN phone as ph  
    WITH (NOLOCK)  
    ON aga.acct_id = ph.acct_id  
    AND ph.phone_type_cd = 'B'  
    AND ph.phone_num IS NOT NULL  
  WHERE  
   ag.prop_id = @prop_id AND  
   ag.owner_tax_yr = @year  
  
  -- do different things depending on the number of agents  
  if @agent_count = 0  
  BEGIN  
   -- there is no agent; insert empty strings  
   INSERT INTO #AppraisalCardInfo_unique_agent VALUES(0, '', '' )   
  END  
  ELSE  
  BEGIN  
   IF @agent_count = 1  
   BEGIN  
    -- there is 1 agent; insert the agent name and number  
    declare @acct_id as int  
    declare @file_as_name as VARCHAR(70)  
    declare @phone_num as VARCHAR(20)  
     
    SELECT  
     @file_as_name = ISNULL(aga.file_as_name,''),  
     @phone_num = ISNULL(ph.phone_num,'')  
    FROM  
     agent_assoc as ag  
     LEFT OUTER JOIN account as aga  
     WITH (NOLOCK)  
     ON ag.agent_id = aga.acct_id  
      
     LEFT OUTER JOIN phone as ph  
     WITH (NOLOCK)  
     ON aga.acct_id = ph.acct_id  
     AND ph.phone_type_cd = 'B'  
     AND ph.phone_num IS NOT NULL  
    WHERE  
     ag.prop_id = @prop_id AND  
     ag.owner_tax_yr = @year  
  
    INSERT INTO #AppraisalCardInfo_unique_agent VALUES(@prop_id, @file_as_name, @phone_num)  
  
   END  
   ELSE  
   BEGIN  
    -- there are multiple agents; insert '(Multiple)' for name and number  
    INSERT INTO #AppraisalCardInfo_unique_agent VALUES(@prop_id, '(Multiple)', '(Multiple)' )  
   END  
  END  
  
  -- make the selection  
  SELECT ISNULL(a.file_as_name,'') as file_as_name,  
   o.sup_num,  
   o.owner_id, o.pct_ownership,  
   ISNULL(ad.addr_line1,'') as addr_line1,  
   ISNULL(ad.addr_line2,'') as addr_line2,  
   ISNULL(ad.addr_line3,'') as addr_line3,  
   ISNULL(ad.addr_city,'') as addr_city,  
   ISNULL(ad.addr_state,'') as addr_state,  
   ISNULL(ad.addr_zip,'') as addr_zip,  
   ISNULL(ad.country_cd,'') as country_cd,  
   ISNULL(pv.eff_size_acres,0) as eff_size_acres,  
   ISNULL(agent.file_as_name,'') as tax_agent,  
   ISNULL(agent.phone_num,'') as phone,  
   ISNULL(ad.zip, '') as zip,  
   ISNULL(ad.cass, '') as cass,  
   ISNULL(ad.route, '') as route,  
   ISNULL(o.udi_child_prop_id, -1) as udi_child_prop_id,  
   ISNULL(o.percent_type, 'O') as percent_type,  
   pv.prop_id  
  FROM owner as o  
  WITH (NOLOCK)  
  
  INNER JOIN account as a  
  WITH (NOLOCK)  
  ON o.owner_id = a.acct_id  
  
  INNER JOIN property_val as pv  
  WITH (NOLOCK)  
  ON o.prop_id = pv.prop_id  
  AND o.owner_tax_yr = pv.prop_val_yr  
  AND o.sup_num = pv.sup_num  
  
  LEFT OUTER JOIN address as ad  
  WITH (NOLOCK)  
  ON o.owner_id = ad.acct_id  
  AND ad.primary_addr = 'Y'  
  
  LEFT OUTER JOIN #AppraisalCardInfo_unique_agent as agent  
  WITH (NOLOCK)  
  ON agent.prop_id = pv.prop_id  
  
  WHERE o.prop_id = @prop_id  
  AND o.owner_tax_yr = @year  
  AND o.sup_num = @sup_num  
  
  ORDER BY o.owner_id  
  
  
  -- delete the temp table  
  drop table #AppraisalCardInfo_unique_agent  
  
  
 END  
 ELSE  
 BEGIN  
  IF @UDIOutputType = 0  
  BEGIN  
   SELECT top 1 'UDI Parent Property' as file_as_name,  
    @sup_num as sup_num,  
    null as owner_id, 100 as pct_ownership,  
    coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
    situs.situs_unit as addr_line2,   
    null as addr_line3, situs.situs_city as addr_city,  
    situs.situs_state as addr_state, situs.situs_zip as addr_zip,  
    'US' as country_cd, ISNULL(pv.eff_size_acres,0) as eff_size_acres,  
    '' as tax_agent,  
    '' as phone,  
    situs.situs_zip as zip,  
    null as cass,  
    null as route,  
    null as udi_child_prop_id,  
    'O' as percent_type,  
    @prop_id as prop_id  
   FROM property_val as pv  
  
   LEFT OUTER JOIN situs ON situs.prop_id = pv.prop_id   
   WHERE pv.prop_id = @prop_id   
   AND pv.prop_val_yr = @year  
   AND pv.sup_num = @sup_num  
   AND coalesce(situs.primary_situs, 'Y') = 'Y'  
  
   UNION  
  
   SELECT top 1 'UDI Parent Property' as file_as_name,  
    @sup_num as sup_num,  
    null as owner_id, 100 as pct_ownership,  
    coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
    situs.situs_unit as addr_line2,   
    null as addr_line3, situs.situs_city as addr_city,  
    situs.situs_state as addr_state, situs.situs_zip as addr_zip,  
    'US' as country_cd, ISNULL(pv.eff_size_acres,0) as eff_size_acres,  
    '' as tax_agent,  
    '' as phone,  
    situs.situs_zip as zip,  
    null as cass,  
    null as route,  
    null as udi_child_prop_id,  
    'O' as percent_type,  
    @prop_id as prop_id  
   FROM property_val as pv  
  
   LEFT OUTER JOIN situs ON situs.prop_id = pv.prop_id   
   WHERE pv.prop_id = @prop_id   
   AND pv.prop_val_yr = @year  
   AND pv.sup_num = @sup_num  
   AND pv.prop_id NOT IN (select prop_id from situs where primary_situs = 'Y')  
  
   UNION  
  
   SELECT ISNULL(a.file_as_name,'') as file_as_name,  
    o.sup_num,  
    o.owner_id, o.pct_ownership,  
    ISNULL(ad.addr_line1,'') as addr_line1, ISNULL(ad.addr_line2,'') as addr_line2,  
    ISNULL(ad.addr_line3,'') as addr_line3, ISNULL(ad.addr_city,'') as addr_city,  
    ISNULL(ad.addr_state,'') as addr_state, ISNULL(ad.addr_zip,'') as addr_zip,  
    ISNULL(ad.country_cd,'') as country_cd, ISNULL(pv.eff_size_acres,0) as eff_size_acres,  
    ISNULL(aga.file_as_name,'') as tax_agent,  
    ISNULL(ph.phone_num,'') as phone,  
    ISNULL(ad.zip, '') as zip,  
    ISNULL(ad.cass, '') as cass,  
    ISNULL(ad.route, '') as route,  
    ISNULL(o.udi_child_prop_id, -1) as udi_child_prop_id,  
    ISNULL(o.percent_type, 'O') as percent_type,  
    pv.prop_id as prop_id  
   FROM owner as o  
   WITH (NOLOCK)  
  
   INNER JOIN account as a  
   WITH (NOLOCK)  
   ON o.owner_id = a.acct_id  
  
   INNER JOIN property_val as pv  
   WITH (NOLOCK)  
   ON o.prop_id = pv.prop_id  
   AND o.owner_tax_yr = pv.prop_val_yr  
   AND o.sup_num = pv.sup_num  
  
   LEFT OUTER JOIN address as ad  
   WITH (NOLOCK)  
   ON o.owner_id = ad.acct_id  
   AND ad.primary_addr = 'Y'  
  
   LEFT OUTER JOIN agent_assoc as ag  
   WITH (NOLOCK)  
   ON o.owner_id = ag.owner_id  
   AND o.owner_tax_yr = ag.owner_tax_yr  
   AND o.prop_id = ag.prop_id  
  
   LEFT OUTER JOIN account as aga  
   WITH (NOLOCK)  
   ON ag.agent_id = aga.acct_id  
  
   LEFT OUTER JOIN phone as ph  
   WITH (NOLOCK)  
   ON aga.acct_id = ph.acct_id  
   AND ph.phone_type_cd = 'B'  
   AND ph.phone_num IS NOT NULL  
  
   WHERE pv.udi_parent_prop_id = @prop_id  
   AND pv.prop_val_yr = @year  
   AND pv.sup_num = @sup_num  
   AND pv.prop_inactive_dt IS NULL  
  
   ORDER BY owner_id  
  END  
  
  IF @UDIOutputType = 1  
  BEGIN  
   SELECT top 1 'UDI Parent Property' as file_as_name,  
    @sup_num as sup_num,  
    null as owner_id, 100 as pct_ownership,  
    coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
    situs.situs_unit as addr_line2,   
    null as addr_line3, situs.situs_city as addr_city,  
    situs.situs_state as addr_state, situs.situs_zip as addr_zip,  
    'US' as country_cd, ISNULL(pv.eff_size_acres,0) as eff_size_acres,  
    '' as tax_agent,  
    '' as phone,  
    situs.situs_zip as zip,  
    null as cass,  
    null as route,  
    null as udi_child_prop_id,  
    'O' as percent_type,  
    @prop_id as prop_id  
   FROM property_val as pv  
  
   LEFT OUTER JOIN situs ON situs.prop_id = pv.prop_id   
   WHERE pv.prop_id = @prop_id   
   AND pv.prop_val_yr = @year  
   AND pv.sup_num = @sup_num  
   AND coalesce(situs.primary_situs, 'Y') = 'Y'  
  
   UNION  
  
   SELECT top 1 'UDI Parent Property' as file_as_name,  
    @sup_num as sup_num,  
    null as owner_id, 100 as pct_ownership,  
    coalesce(situs.situs_num,'') + ' ' + coalesce(situs.situs_street_prefx, '') + ' ' + coalesce(situs.situs_street, '') + ' ' + coalesce(situs.situs_street_sufix, '') as addr_line1,   
    situs.situs_unit as addr_line2,   
    null as addr_line3, situs.situs_city as addr_city,  
    situs.situs_state as addr_state, situs.situs_zip as addr_zip,  
    'US' as country_cd, ISNULL(pv.eff_size_acres,0) as eff_size_acres,  
    '' as tax_agent,  
    '' as phone,  
    situs.situs_zip as zip,  
    null as cass,  
    null as route,  
    null as udi_child_prop_id,  
    'O' as percent_type,  
    @prop_id as prop_id  
   FROM property_val as pv  
  
   LEFT OUTER JOIN situs ON situs.prop_id = pv.prop_id   
   WHERE pv.prop_id = @prop_id   
   AND pv.prop_val_yr = @year  
   AND pv.sup_num = @sup_num  
   AND pv.prop_id NOT IN (select prop_id from situs where primary_situs = 'Y')  
  
   ORDER BY owner_id  
  END  
  
  IF @UDIOutputType = 2  
  BEGIN  
   SELECT ISNULL(a.file_as_name,'') as file_as_name,  
    o.sup_num,  
    o.owner_id, o.pct_ownership,  
    ISNULL(ad.addr_line1,'') as addr_line1, ISNULL(ad.addr_line2,'') as addr_line2,  
    ISNULL(ad.addr_line3,'') as addr_line3, ISNULL(ad.addr_city,'') as addr_city,  
    ISNULL(ad.addr_state,'') as addr_state, ISNULL(ad.addr_zip,'') as addr_zip,  
    ISNULL(ad.country_cd,'') as country_cd, ISNULL(pv.eff_size_acres,0) as eff_size_acres,  
    ISNULL(aga.file_as_name,'') as tax_agent,  
    ISNULL(ph.phone_num,'') as phone,  
    ISNULL(ad.zip, '') as zip,  
    ISNULL(ad.cass, '') as cass,  
    ISNULL(ad.route, '') as route,  
    ISNULL(o.udi_child_prop_id, -1) as udi_child_prop_id,  
    ISNULL(o.percent_type, 'O') as percent_type,  
    pv.prop_id as prop_id  
   FROM owner as o  
   WITH (NOLOCK)  
  
   INNER JOIN account as a  
   WITH (NOLOCK)  
   ON o.owner_id = a.acct_id  
  
   INNER JOIN property_val as pv  
   WITH (NOLOCK)  
   ON o.prop_id = pv.prop_id  
   AND o.owner_tax_yr = pv.prop_val_yr  
   AND o.sup_num = pv.sup_num  
  
   LEFT OUTER JOIN address as ad  
   WITH (NOLOCK)  
   ON o.owner_id = ad.acct_id  
   AND ad.primary_addr = 'Y'  
  
   LEFT OUTER JOIN agent_assoc as ag  
   WITH (NOLOCK)  
   ON o.owner_id = ag.owner_id  
   AND o.owner_tax_yr = ag.owner_tax_yr  
   AND o.prop_id = ag.prop_id  
  
   LEFT OUTER JOIN account as aga  
   WITH (NOLOCK)  
   ON ag.agent_id = aga.acct_id  
  
   LEFT OUTER JOIN phone as ph  
   WITH (NOLOCK)  
   ON aga.acct_id = ph.acct_id  
   AND ph.phone_type_cd = 'B'  
   AND ph.phone_num IS NOT NULL  
  
   WHERE pv.udi_parent_prop_id = @prop_id  
   AND pv.prop_val_yr = @year  
   AND pv.sup_num = @sup_num  
   AND pv.prop_inactive_dt IS NULL  
  
   ORDER BY o.owner_id  
  END    
 END  

end
set  @currentDatasetId=@currentDatasetId +1  
  
 /*  
  * EXEMPTIONS area  
  */  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin  
 SELECT  
  pe.prop_id,  
  RTRIM(ISNULL(pe.exmpt_type_cd,'')) as exmpt_type_cd,  
         pe.owner_id  
 FROM  
  property_exemption as pe WITH (NOLOCK)  
 INNER JOIN  
  owner AS o  WITH (NOLOCK)  
  ON (pe.prop_id = o.prop_id OR pe.prop_id = o.udi_child_prop_id) AND  
  pe.sup_num = o.sup_num AND  
  pe.exmpt_tax_yr = o.owner_tax_yr  
 WHERE  
  o.prop_id = @prop_id AND   
  o.owner_tax_yr = @year AND   
  o.sup_num = @sup_num AND  
  pe.exmpt_type_cd NOT IN ('AG') ---- HS 13853 Pratima  
 ORDER BY  
  pe.exmpt_type_cd  
 
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
  * VALUES area  
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
  SELECT pv.prop_id, pv.prop_val_yr as year,  
   o.owner_id,  
   (ISNULL(imprv_hstd_val,0) + ISNULL(imprv_non_hstd_val,0)) as improvement,  
   (ISNULL(land_hstd_val,0) + ISNULL(land_non_hstd_val,0) + ISNULL(ag_market,0) + ISNULL(timber_market,0)) as land_mkt,  
   (ISNULL(ag_market,0) + ISNULL(timber_market,0) - ISNULL(ag_use_val,0) - ISNULL(timber_use,0)) as prod_loss,  
   ISNULL(appraised_val,0) as appraised,  
   ISNULL(ten_percent_cap,0) as hs_cap_loss,  
   ISNULL(assessed_val,0) as assessed,  
   RTRIM(ISNULL(pv.appr_method,'')) as appr_method, a.file_as_name,  
   ISNULL(pv.udi_parent, '') as udi_parent   
  FROM property_val as pv  
  WITH (NOLOCK)  
  
  INNER JOIN OWNER as o  
  WITH (NOLOCK)  
  ON pv.prop_id = o.prop_id  
  AND pv.prop_val_yr = o.owner_tax_yr  
  AND pv.sup_num = o.sup_num  
  
  INNER JOIN account as a  
  WITH (NOLOCK)  
  ON o.owner_id = a.acct_id  
  
  WHERE pv.prop_id = @prop_id   
  AND pv.prop_val_yr = @year  
  AND pv.sup_num = @sup_num  
  
  UNION  
  
  SELECT  pv.prop_id, pv.prop_val_yr as year,  
   o.owner_id,  
   (ISNULL(imprv_hstd_val,0) + ISNULL(imprv_non_hstd_val,0)) as improvement,  
   (ISNULL(land_hstd_val,0) + ISNULL(land_non_hstd_val,0) + ISNULL(ag_market,0) + ISNULL(timber_market,0)) as land_mkt,  
   (ISNULL(ag_market,0) + ISNULL(timber_market,0) - ISNULL(ag_use_val,0) - ISNULL(timber_use,0)) as prod_loss,  
   ISNULL(appraised_val,0) as appraised,  
   ISNULL(ten_percent_cap,0) as hs_cap_loss,  
   ISNULL(assessed_val,0) as assessed,  
   RTRIM(ISNULL(pv.appr_method,'')) as appr_method,   
   a.file_as_name,  
   ISNULL(pv.udi_parent, '') as udi_parent   
  FROM property_val as pv  
  WITH (NOLOCK)  
  
  INNER JOIN prop_supp_assoc as psa WITH (NOLOCK)  
  ON pv.prop_val_yr = psa.owner_tax_yr  
  AND pv.sup_num = psa.sup_num  
  AND pv.prop_id = psa.prop_id  
  
  INNER JOIN OWNER as o  
  WITH (NOLOCK)  
  ON pv.prop_id = o.prop_id  
  AND pv.prop_val_yr = o.owner_tax_yr  
  AND pv.sup_num = o.sup_num  
  
  INNER JOIN account as a  
  WITH (NOLOCK)  
  ON o.owner_id = a.acct_id  
  
  WHERE pv.prop_id = @prop_id  
  AND pv.prop_val_yr = @year - 1  
  
  ORDER BY pv.prop_val_yr, pv.prop_id, a.file_as_name  
 END  
 ELSE  
 BEGIN  
  SELECT pv.prop_id, pv.prop_val_yr as year,  
   null as owner_id,  
   (ISNULL(imprv_hstd_val,0) + ISNULL(imprv_non_hstd_val,0)) as improvement,  
   (ISNULL(land_hstd_val,0) + ISNULL(land_non_hstd_val,0) + ISNULL(ag_market,0) + ISNULL(timber_market,0)) as land_mkt,  
   (ISNULL(ag_market,0) + ISNULL(timber_market,0) - ISNULL(ag_use_val,0) - ISNULL(timber_use,0)) as prod_loss,  
   ISNULL(appraised_val,0) as appraised,  
   ISNULL(ten_percent_cap,0) as hs_cap_loss,  
   ISNULL(assessed_val,0) as assessed,  
   RTRIM(ISNULL(pv.appr_method,'')) as appr_method, 'UDI Parent Property' as file_as_name,  
   ISNULL(pv.udi_parent, '') as udi_parent   
  FROM property_val as pv  
  WITH (NOLOCK)  
  WHERE pv.prop_id = @prop_id   
  AND pv.prop_val_yr = @year  
  AND pv.sup_num = @sup_num  
  
  UNION  
  
  SELECT pv.prop_id, pv.prop_val_yr as year,  
   o.owner_id,  
   (ISNULL(imprv_hstd_val,0) + ISNULL(imprv_non_hstd_val,0)) as improvement,  
   (ISNULL(land_hstd_val,0) + ISNULL(land_non_hstd_val,0) + ISNULL(ag_market,0) + ISNULL(timber_market,0)) as land_mkt,  
   (ISNULL(ag_market,0) + ISNULL(timber_market,0) - ISNULL(ag_use_val,0) - ISNULL(timber_use,0)) as prod_loss,  
   ISNULL(appraised_val,0) as appraised,  
   ISNULL(ten_percent_cap,0) as hs_cap_loss,  
   ISNULL(assessed_val,0) as assessed,  
   RTRIM(ISNULL(pv.appr_method,'')) as appr_method, a.file_as_name as file_as_name,  
   ISNULL(pv.udi_parent, '') as udi_parent   
  FROM property_val as pv  
  WITH (NOLOCK)  
  INNER JOIN OWNER as o  
  WITH (NOLOCK)  
  ON pv.prop_id = o.prop_id  
  AND pv.prop_val_yr = o.owner_tax_yr  
  AND pv.sup_num = o.sup_num  
  INNER JOIN account as a  
  WITH (NOLOCK)  
  ON o.owner_id = a.acct_id  
  WHERE pv.udi_parent_prop_id = @prop_id   
  AND pv.prop_val_yr = @year  
  AND pv.sup_num = @sup_num  
  AND pv.prop_inactive_dt IS NULL  
  
  UNION  
  
  SELECT pv.prop_id, pv.prop_val_yr as year,  
   null as owner_id,  
   (ISNULL(imprv_hstd_val,0) + ISNULL(imprv_non_hstd_val,0)) as improvement,  
   (ISNULL(land_hstd_val,0) + ISNULL(land_non_hstd_val,0) + ISNULL(ag_market,0) + ISNULL(timber_market,0)) as land_mkt,  
   (ISNULL(ag_market,0) + ISNULL(timber_market,0) - ISNULL(ag_use_val,0) - ISNULL(timber_use,0)) as prod_loss,  
   ISNULL(appraised_val,0) as appraised,  
   ISNULL(ten_percent_cap,0) as hs_cap_loss,  
   ISNULL(assessed_val,0) as assessed,  
   RTRIM(ISNULL(pv.appr_method,'')) as appr_method, 'UDI Parent Property' as file_as_name,  
   ISNULL(pv.udi_parent, '') as udi_parent   
  FROM property_val as pv  
  WITH (NOLOCK)  
  INNER JOIN prop_supp_assoc as psa WITH (NOLOCK)  
  ON pv.prop_val_yr = psa.owner_tax_yr  
  AND pv.sup_num = psa.sup_num  
  AND pv.prop_id = psa.prop_id  
  WHERE pv.prop_id = @prop_id   
  AND pv.prop_val_yr = @year - 1  
  
  UNION   
  
  SELECT  pv.prop_id, pv.prop_val_yr as year,  
   o.owner_id,  
   (ISNULL(imprv_hstd_val,0) + ISNULL(imprv_non_hstd_val,0)) as improvement,  
   (ISNULL(land_hstd_val,0) + ISNULL(land_non_hstd_val,0) + ISNULL(ag_market,0) + ISNULL(timber_market,0)) as land_mkt,  
   (ISNULL(ag_market,0) + ISNULL(timber_market,0) - ISNULL(ag_use_val,0) - ISNULL(timber_use,0)) as prod_loss,  
   ISNULL(appraised_val,0) as appraised,  
   ISNULL(ten_percent_cap,0) as hs_cap_loss,  
   ISNULL(assessed_val,0) as assessed,  
   RTRIM(ISNULL(pv.appr_method,'')) as appr_method,   
   a.file_as_name as file_as_name,  
   ISNULL(pv.udi_parent, '') as udi_parent   
  FROM property_val as pv  
  WITH (NOLOCK)  
  INNER JOIN prop_supp_assoc as psa WITH (NOLOCK)  
  ON pv.prop_val_yr = psa.owner_tax_yr  
  AND pv.sup_num = psa.sup_num  
  AND pv.prop_id = psa.prop_id  
  INNER JOIN OWNER as o  
  WITH (NOLOCK)  
  ON pv.prop_id = o.prop_id  
  AND pv.prop_val_yr = o.owner_tax_yr  
  AND pv.sup_num = o.sup_num  
  INNER JOIN account as a  
  WITH (NOLOCK)  
  ON o.owner_id = a.acct_id  
  WHERE pv.udi_parent_prop_id = @prop_id  
  AND pv.prop_val_yr = @year - 1  
  AND pv.prop_inactive_dt IS NULL  
  
  ORDER BY pv.prop_val_yr, pv.prop_id, file_as_name  
 END  
 
end
set  @currentDatasetId=@currentDatasetId +1 
  
 /*  
  * GENERAL area  
  */  
  
 declare @group_code varchar(20)  
 declare @group_codes varchar(200)  
  
 declare GRP_CODES CURSOR FAST_FORWARD  
 FOR SELECT prop_group_cd  
  FROM prop_group_assoc  
  WITH (NOLOCK)  
  WHERE prop_id = @prop_id  
  ORDER BY prop_group_cd  
  
 OPEN GRP_CODES  
  
 FETCH NEXT FROM GRP_CODES INTO @group_code  
  
 SET @group_codes = ''  
  
 WHILE @@FETCH_STATUS = 0  
 BEGIN  
  IF LEN(@group_codes) > 0  
  BEGIN  
   SET @group_codes = @group_codes + ','  
  END  
  
  SET @group_codes = @group_codes + RTRIM(@group_code)  
  
  FETCH NEXT FROM GRP_CODES INTO @group_code  
 END  
  
 CLOSE GRP_CODES  
 DEALLOCATE GRP_CODES  
 if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin 
 SELECT ISNULL(p.utilities,'') as utilities,   
   ISNULL(pv.last_appraisal_yr,0) as last_appr_yr,  
   ISNULL(a.appraiser_nm,'') as last_appr,   
   ISNULL(p.topography,'') as topography,  
   ISNULL(pv.hscap_base_yr,-1) as cap_basis_yr,  
   ISNULL(an.appraiser_nm,'') as nbhd_appr,  
   ISNULL(p.road_access,'') as road_access,  
  
   CASE ISNULL(pv.last_appraisal_dt,'')  
   WHEN '' THEN ''  
   ELSE CONVERT(varchar(10), pv.last_appraisal_dt, 101)  
   END as last_insp_date,  
   ISNULL(asubdv.appraiser_nm,'') as subdv_appr,  
  
   ISNULL(p.zoning,'') as zoning,  
  
   CASE ISNULL(pv.next_appraisal_dt, '')  
   WHEN '' THEN ''  
   ELSE CONVERT(varchar(10), pv.next_appraisal_dt, 101)  
   END as next_insp_date,  
  
   ISNULL(al.appraiser_nm,'') as land_appr,  
  
   ISNULL(@group_codes,'') as group_codes,  
   ISNULL(av.appraiser_nm,'') as value_appr,  
   ISNULL(pv.next_appraisal_rsn,'') as next_appraisal_rsn,  
   '' as rent  
 FROM property as p  
 WITH (NOLOCK)  
  
 INNER JOIN property_val as pv  
 WITH (NOLOCK)  
 ON p.prop_id = pv.prop_id  
 AND pv.prop_val_yr = @year  
 AND pv.sup_num = @sup_num  
  
 LEFT OUTER JOIN appraiser as a  
 WITH (NOLOCK)  
 ON pv.last_appraiser_id = a.appraiser_id  
  
 LEFT OUTER JOIN appraiser as al  
 WITH (NOLOCK)  
 ON pv.land_appraiser_id = al.appraiser_id  
  
 LEFT OUTER JOIN appraiser as av  
 WITH (NOLOCK)  
 ON pv.value_appraiser_id = av.appraiser_id  
  
 LEFT OUTER JOIN profile_type_desc as ptdn  
 WITH (NOLOCK)  
 ON ptdn.code = pv.hood_cd  
 AND ptdn.type = 'N'  
  
 LEFT OUTER JOIN appraiser as an  
 WITH (NOLOCK)  
 ON ptdn.appraiser_id = an.appraiser_id  
  
 LEFT OUTER JOIN profile_type_desc as ptda  
 WITH (NOLOCK)  
 ON ptda.code = pv.abs_subdv_cd  
 AND ptda.type = 'AS'  
  
 LEFT OUTER JOIN appraiser as asubdv  
 WITH (NOLOCK)  
 ON ptda.appraiser_id = asubdv.appraiser_id  
  
 WHERE p.prop_id = @prop_id  
  
end
set  @currentDatasetId=@currentDatasetId +1
  
 /*  
  * REMARKS/SKETCH area  
  * use remarks from PROPERTY section, use sketch_cmds from  
  * IMPROVEMENT section.  
  */  
  
 /*  
  * BUILDING PERMIT area  
  */  
  
 declare @bprintBP char(1)  
 declare @strSQL varchar(5000)  
 declare @str_pid varchar(10)  
 select @bprintBP= print_inactive_building_permits from pacs_system  with (nolock)  
 set @str_pid = @prop_id  
 set @strSQL =   
  'SELECT bp.bldg_permit_id AS bldg_permit_id,  
   CASE ISNULL(bp.bldg_permit_issue_dt,'''') WHEN ''''   
    THEN ''''  
    ELSE CONVERT(varchar(10), bp.bldg_permit_issue_dt, 101)  
   END as issue_dt,  
   ISNULL(bp.bldg_permit_num,'''') as permit,  
   ISNULL(bp.bldg_permit_type_cd,'''') as type,  
   CASE WHEN ISNULL(bldg_permit_active,''F'') = ''F'' THEN ''I'' ELSE ''A'' END as st,  
   ISNULL(bp.bldg_permit_val,0) as est_value,  
   ISNULL(a.appraiser_nm,'''') as appr,  
   ISNULL(bp.bldg_permit_builder,'''') as builder,  
   ISNULL(bp.bldg_permit_cmnt,'''') as comment  
  FROM prop_building_permit_assoc as pbpa WITH (NOLOCK)  
   INNER JOIN building_permit as bp WITH (NOLOCK) ON   
    pbpa.bldg_permit_id = bp.bldg_permit_id'  
 if(@bprintBP <> 'T')  
 begin   
  set @strSQL = @strSQL + '    
    and (bp.bldg_permit_active = ''T'' OR bp.bldg_permit_active = ''Y'')'  
 end  
 set @strSQL = @strSQL + '    
  LEFT OUTER JOIN appraiser as a WITH (NOLOCK) ON   
    bp.bldg_permit_appraiser_id = a.appraiser_id  
  WHERE pbpa.prop_id = '  
 set @strSQL = @strSQL + @str_pid  
 set @strSQL = @strSQL + ' ORDER BY bp.bldg_permit_issue_dt DESC, bp.bldg_permit_active DESC'  

if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin

     exec(@strSQL)  
 
end
set  @currentDatasetId=@currentDatasetId +1 
  
 /*  
  * INCOME APPROACH area  
  *  
  * Agent information is stored in the owner part as agents relate  
  * directly to owners.  
  */  
  
 declare @income_id int  
 declare @gpi numeric(14,0)  
 declare @vac numeric(5,2)  
 declare @egr numeric(14,0)  
 declare @other_inc numeric(14,0)  
 declare @egi numeric(14,0)  
 declare @expense numeric(14,0)  
 declare @taxes numeric(14,0)  
 declare @noi numeric(14,0)  
 declare @method varchar(5)  
 declare @inc_value numeric(14,0)  
 declare @egi_nnnsft numeric(14,2)  
 declare @expense_nnnsft numeric(14,2)  
 declare @noi_nnnsft numeric(14,2)  
 declare @inc_value_nnnsft numeric(14,2)  
 declare @gross_sqft numeric(14,0)  
 declare @net_sqft numeric(14,0)  
 declare @linked_accts varchar(200)  
 declare @reconciled_value numeric(14,0)  
 declare @temp_prop_id int  
  
 set @gpi = -1  
 set @vac = -1  
 set @egr = -1  
 set @other_inc = -1  
 set @egi = -1  
 set @expense = -1  
 set @taxes = -1  
 set @noi = -1  
 set @method = ''  
 set @inc_value = -1  
 set @egi_nnnsft = -1  
 set @expense_nnnsft = -1  
 set @noi_nnnsft = -1  
 set @inc_value_nnnsft = -1  
 set @gross_sqft = -1  
 set @net_sqft = -1  
 set @reconciled_value = -1  
  
 SELECT @income_id = i.income_id,  
   @gpi = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_GPI,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_GPI,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_GPI,-1)  
     ELSE -1  
   END,  
  
   @vac = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_VR,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_VR,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_VR,-1)  
    ELSE -1  
   END,  
  
   @egr = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_LA,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_LA,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_LA,-1)  
    ELSE -1  
   END,  
  
   @other_inc = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_GPISI,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_GPISI,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_GPISI,-1)  
    ELSE -1  
   END,  
  
   @egi = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_EGI,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_EGI,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_EGI,-1)  
    ELSE -1  
   END,  
  
   @expense = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_EXP,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_EXP,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_EXP,-1)  
    ELSE -1  
   END,  
  
   @taxes = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_TAX,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_TAX,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_TAX,-1)  
    ELSE -1  
   END,  
  
   @noi = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_NOI,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_NOI,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_NOI,-1)  
    ELSE -1  
   END,  
  
   @method = ISNULL(i.value_method,''),  
   @inc_value = ISNULL(i.income_value,-1),  
  
   @egi_nnnsft = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_EGIRSF,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_EGIRSF,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_EGIRSF,-1)  
    ELSE -1  
   END,  
  
   @expense_nnnsft = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_EXPRSF,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_EXPRSF,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_EXPRSF,-1)  
    ELSE -1  
   END,  
  
   @noi_nnnsft = CASE ISNULL(i.value_method,'')  
    WHEN 'DC' THEN ISNULL(i.DC_NOIRSF,-1)  
    WHEN 'SCH' THEN ISNULL(i.SCH_NOIRSF,-1)  
    WHEN 'PF' THEN ISNULL(i.PF_NOIRSF,-1)  
    ELSE -1  
   END,  
  
   @inc_value_nnnsft = CASE ISNULL(i.nra,0)  
    WHEN 0 THEN 0  
    ELSE i.income_value / i.nra  
   END,  
  
   @gross_sqft = ISNULL(i.gba,-1),  
   @net_sqft = ISNULL(i.nra,-1),  
   @reconciled_value = ISNULL(i.flat_value,-1)  
 FROM income_prop_assoc as ipa  
 WITH (NOLOCK)  
  
 INNER JOIN income as i  
 WITH (NOLOCK)  
 ON ipa.income_id = i.income_id  
 AND ipa.prop_val_yr = i.income_yr  
 AND ipa.sup_num = i.sup_num  
  
 WHERE ipa.prop_id = @prop_id  
 AND ipa.prop_val_yr = @year  
 AND ipa.sup_num = @sup_num  
 AND ipa.active_valuation = 'T'  
  
 DECLARE LINKED_PROPS CURSOR FAST_FORWARD  
 FOR SELECT prop_id  
  FROM income_prop_assoc as ipa  
  WITH (NOLOCK)  
  WHERE ipa.income_id = @income_id  
  AND ipa.prop_val_yr = @year  
  AND ipa.sup_num = @sup_num  
  AND ipa.active_valuation = 'T'  
  AND ipa.prop_id <> @prop_id  
  
 OPEN LINKED_PROPS  
  
 FETCH NEXT FROM LINKED_PROPS INTO @temp_prop_id  
  
 set @linked_accts = ''  
  
 WHILE @@FETCH_STATUS = 0  
 BEGIN  
  IF LEN(@linked_accts) > 0  
  BEGIN  
   SET @linked_accts = @linked_accts + ','  
  END  
  
  SET @linked_accts = @linked_accts + CONVERT(varchar(10), @temp_prop_id)  
  
  FETCH NEXT FROM LINKED_PROPS INTO @temp_prop_id  
 END  
  
 CLOSE LINKED_PROPS  
 DEALLOCATE LINKED_PROPS  
  if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
 SELECT  @gpi as gpi,  
  @vac as vac,  
  @egr as egr,  
  @other_inc as other_inc,  
  @egi as egi,  
  
  @expense as expense,  
  @taxes as taxes,  
  @noi as noi,  
  @method as method,  
  @inc_value as inc_value,  
  @egi_nnnsft as egi_nnnsft,  
  @expense_nnnsft as expense_nnnsft,  
  @noi_nnnsft as noi_nnnsft,  
  @inc_value_nnnsft as inc_value_nnnsft,  
  @gross_sqft as gross_sqft,  
  @net_sqft as net_sqft,  
  @linked_accts as linked_accts,  
  @reconciled_value as reconciled_value  
  
end
set  @currentDatasetId=@currentDatasetId +1
  
 /*  
  * INQUIRY / ARB PROTESTS area  
  */  
  if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
 SELECT TOP 1  ap.case_id,  
  CASE ISNULL(ap.prot_create_dt,'')  
  WHEN ''   
    THEN ''  
    ELSE CONVERT(varchar(10), ap.prot_create_dt, 101)   
  END as date,  
  ISNULL(api.appraiser_nm,'') as appr,  
  RTRIM(ISNULL(ap.prot_status,'')) as status,  
  ISNULL(ap.prot_taxpayer_comments,'') as owner_comments,  
  ISNULL(ap.prot_district_comments,'') as staff_comments  
 FROM  _arb_protest as ap WITH (NOLOCK)  
  LEFT OUTER JOIN appraiser as api WITH (NOLOCK)  
   ON ap.associated_inquiry = api.appraiser_id  
  LEFT OUTER JOIN appraiser as app WITH (NOLOCK)  
   ON ap.associated_inquiry = app.appraiser_id  
 WHERE  ap.prop_id = @prop_id AND   
  ap.prop_val_yr = @year  
 ORDER BY ap.prot_create_dt DESC  
  
end
set  @currentDatasetId=@currentDatasetId +1
 /*  
  * SALES HISTORY area - moved to AppraisalCardInfoSales.sql  
  */  
  
  
 /*  
  * IMPROVEMENT area  
  */  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
    SELECT i.imprv_id,   
  ISNULL(id.imprv_det_id,-1) as imprv_det_id,  
  CASE WHEN ISNULL(pv.rgn_cd,'') <> '' THEN  
   CASE WHEN ISNULL(r.rgn_imprv_pct,-1) <> -1 THEN  
    RTRIM(pv.rgn_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, r.rgn_imprv_pct)),'') + '%)'  
   ELSE  
    RTRIM(ISNULL(pv.rgn_cd,''))  
   END  
  ELSE  
   RTRIM(ISNULL(pv.rgn_cd,''))  
  END as region,  
  
  CASE WHEN ISNULL(pv.abs_subdv_cd,'') <> '' THEN  
   CASE WHEN ISNULL(abs.abs_imprv_pct,-1) <> -1 THEN  
    RTRIM(pv.abs_subdv_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, abs.abs_imprv_pct)),'') + '%)'  
   ELSE  
    RTRIM(ISNULL(pv.abs_subdv_cd,''))  
   END  
  ELSE  
   RTRIM(ISNULL(pv.abs_subdv_cd,''))  
  END as subd,  
  
  CASE WHEN ISNULL(pv.hood_cd,'') <> '' THEN  
   CASE WHEN ISNULL(n.hood_imprv_pct,-1) <> -1 THEN  
    RTRIM(pv.hood_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, n.hood_imprv_pct)),'') + '%)'  
   ELSE  
    RTRIM(ISNULL(pv.hood_cd,''))  
   END  
  ELSE  
   RTRIM(ISNULL(pv.hood_cd,''))  
  END as nbhd,  
  
  CASE WHEN ISNULL(pv.subset_cd,'') <> '' THEN  
   CASE WHEN ISNULL(s.subset_imprv_pct,-1) <> -1 THEN  
    RTRIM(pv.subset_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, s.subset_imprv_pct)),'') + '%)'  
   ELSE  
    RTRIM(ISNULL(pv.subset_cd,''))  
   END  
  ELSE  
   RTRIM(ISNULL(pv.subset_cd,''))  
  END as subset,   
  
  RTRIM(ISNULL(idt.imprv_det_type_cd, i.imprv_type_cd)) as type,  
  ISNULL(id.imprv_det_desc, ISNULL(idt.imprv_det_typ_desc, ISNULL(i.imprv_desc,''))) AS description,  
  ISNULL(i.effective_yr_blt, -1) as effective_year,  
  ISNULL(idt.main_area,'F') as main_area,  
  ISNULL(id.imprv_det_meth_cd, '') as mthd,  
  ISNULL(id.imprv_det_class_cd, '') as class,  
  ISNULL(id.imprv_det_sub_class_cd, '') as subclass,  
  ISNULL(id.imprv_det_area, 0) as area,  
  ISNULL(id.unit_price, 0) as unit_price,  
  ISNULL(id.num_units, 0) as units,  
  ISNULL(id.yr_built, -1) as built,  
  CASE ISNULL(id.depreciation_yr_override, 'F')  
  WHEN 'T' THEN  
   ISNULL(id.depreciation_yr, -1)  
  ELSE  
   ISNULL(i.effective_yr_blt, -1)  
  END as eff_yr,  
  ISNULL(id.condition_cd, '') as cond,  
  
  CASE ISNULL(i.imprv_val_source, '')  
  WHEN 'F' THEN  
   ISNULL(i.flat_val, -1)  
  ELSE  
   -1  
  END as use_flat_values,  
  
  CASE ISNULL(id.imprv_det_val_source, '')  
  WHEN '' THEN  
   CASE ISNULL(id.imprv_det_calc_val, -1)  
   WHEN -1 THEN  
    CASE WHEN ISNULL(i.imprv_val_source, '') = '' THEN  
     ISNULL(i.calc_val,-1)  
    ELSE  
     -1  
    END  
   ELSE  
    ISNULL(id.imprv_det_calc_val,-1)  
   END  
  WHEN 'F' THEN  
   ISNULL(id.imprv_det_flat_val, -1)  
  ELSE  
   ISNULL(id.imprv_det_calc_val, -1)  
  END as value,  
   
  CASE ISNULL(id.physical_pct_override,'')  
  WHEN 'F' THEN  
   CASE ISNULL(id.physical_pct_source,'')  
   WHEN 'I' THEN  
    ISNULL(i.physical_pct, 0)  
   WHEN '' THEN  
    ISNULL(i.physical_pct, 0)  
   ELSE  
    ISNULL(id.physical_pct, ISNULL(i.physical_pct, 0))  
   END  
  ELSE  
   ISNULL(id.physical_pct, ISNULL(i.physical_pct, 0))  
  END as phys,  
  
  CASE ISNULL(id.economic_pct_override,'')  
  WHEN 'F' THEN  
   ISNULL(i.economic_pct, 0)  
  ELSE  
   ISNULL(id.economic_pct, ISNULL(i.economic_pct, 0))  
  END as econ,  
  
  CASE ISNULL(id.functional_pct_override,'')  
  WHEN 'F' THEN  
   ISNULL(i.functional_pct, 0)  
  ELSE  
   ISNULL(id.functional_pct, ISNULL(i.functional_pct, 0))  
  END as func,  
  
  CASE ISNULL(id.percent_complete_override,'')  
  WHEN 'F' THEN  
   ISNULL(i.percent_complete, 0)  
  ELSE  
   ISNULL(id.percent_complete, ISNULL(i.percent_complete, 0))  
  END as comp,  
  
  ISNULL(id.imprv_det_adj_factor, ISNULL(i.imprv_adj_factor, -1)) as adj,  
  ISNULL(id.imprv_det_val, ISNULL(i.imprv_val, -1)) as adj_value,  
  ISNULL(i.imprv_adj_factor, -1) as imprv_adj_factor,  
  ISNULL(i.imprv_val, -1) as imprv_adj_value,  
  ISNULL(i.imprv_desc, ISNULL(it.imprv_type_desc, '')) as type_desc,  
  ISNULL(i.imprv_state_cd, '') as stcd,  
  ISNULL(i.imprv_homesite, '') as homesite,  
  ISNULL(i.hs_pct_override, 0) as hs_pct_override,  
  ISNULL(i.hs_pct, 100) as hs_pct,  
  LTRIM(RTRIM(ISNULL(i.imprv_cmnt, ''))) as comment,  
  ISNULL(id.sketch_cmds, '') as sketch_cmds,  
  CASE WHEN EXISTS(select prop_id  
      from imprv_detail as tid  
      with (nolock)  
      where tid.prop_id = i.prop_id  
      and tid.prop_val_yr = i.prop_val_yr  
      and tid.sup_num = i.sup_num  
      and tid.sale_id = i.sale_id  
      and tid.imprv_id = i.imprv_id  
      and len(isnull(tid.sketch_cmds,'')) > 0)  
   THEN 'T'  
   ELSE 'F'  
  END as sketch_flag,  
        id.dep_pct AS impv_detail_dep_pct,  
 id.imprv_det_type_cd, id.imprv_det_meth_cd, id.imprv_det_class_cd  
  FROM imprv as i  
  WITH (NOLOCK)  
    
  INNER JOIN property_val as pv  
  WITH (NOLOCK)  
  ON i.prop_id = pv.prop_id  
  AND i.prop_val_yr = pv.prop_val_yr  
  AND i.sup_num = pv.sup_num  
  
  LEFT OUTER JOIN imprv_detail as id  
  WITH (NOLOCK)  
  ON i.imprv_id = id.imprv_id  
  AND i.prop_id = id.prop_id  
  AND i.prop_val_yr = id.prop_val_yr  
  AND i.sup_num = id.sup_num  
  AND i.sale_id = id.sale_id  
  
  LEFT OUTER JOIN imprv_det_type as idt  
  WITH (NOLOCK)  
  ON id.imprv_det_type_cd = idt.imprv_det_type_cd  
    
  LEFT OUTER JOIN imprv_type as it  
  WITH (NOLOCK)  
  ON i.imprv_type_cd = it.imprv_type_cd  
    
  LEFT OUTER JOIN region as r  
  WITH (NOLOCK)  
  ON pv.rgn_cd = r.rgn_cd  
  
  LEFT OUTER JOIN abs_subdv as abs  
  WITH (NOLOCK)  
  ON pv.abs_subdv_cd = abs.abs_subdv_cd  
  AND pv.prop_val_yr = abs.abs_subdv_yr  
  
  LEFT OUTER JOIN neighborhood as n  
  WITH (NOLOCK)  
  ON pv.hood_cd = n.hood_cd  
  AND pv.prop_val_yr = n.hood_yr  
  
  LEFT OUTER JOIN subset as s  
  WITH (NOLOCK)  
  ON pv.subset_cd = s.subset_code  
  
  WHERE i.prop_id = @prop_id  
  AND i.prop_val_yr = @year  
  AND i.sup_num = @sup_num  
  AND i.sale_id = @sale_id  
  
  ORDER BY i.imprv_id, id.imprv_det_id  
  
end
set  @currentDatasetId=@currentDatasetId +1
  
  /*  
   * IMPROVEMENT DETAIL ADJUSTMENTS area  
   */  
  if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
  SELECT imprv_id,   
    imprv_det_id,   
    RTRIM(ISNULL(imprv_adj_type_cd,'')) as adj_type,   
    ISNULL(imprv_det_adj_amt,-1) as adj_amt,   
    ISNULL(imprv_det_adj_pc,-1) as adj_percent  
  FROM imprv_det_adj  
  WITH (NOLOCK)  
  
  WHERE prop_id = @prop_id  
  AND prop_val_yr = @year  
  AND sup_num = @sup_num  
  AND sale_id = @sale_id  
  ORDER BY imprv_id, imprv_det_id  
 
end
set  @currentDatasetId=@currentDatasetId +1 
  /*  
   * IMPROVEMENT FEATURES area  
   */  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin  
  SELECT ia.imprv_id,   
  ia.prop_id,  
  ia.imprv_det_id,  
  ISNULL(a.imprv_attr_desc,'') as description,  
  ISNULL(ia.i_attr_unit, 0) as units,  
  RTRIM(ISNULL(ia.i_attr_val_cd,'')) as code,   
  ISNULL(ia.imprv_attr_val, 0) as value  
   
  FROM imprv_attr as ia  
  WITH (NOLOCK)  
  
    
  
  LEFT OUTER JOIN attribute as a  
  WITH (NOLOCK)  
  ON ia.i_attr_val_id = a.imprv_attr_id  
    
  WHERE ia.prop_id = @prop_id  
  AND ia.prop_val_yr = @year  
  AND ia.sup_num = @sup_num  
  AND ia.sale_id = @sale_id  
  
  ORDER BY ia.imprv_id  
 
end
set  @currentDatasetId=@currentDatasetId +1 
  /*  
   * LAND area  
   */  
  if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
  SELECT ld.land_seg_id,  
    CASE WHEN ISNULL(pv.rgn_cd,'') <> '' THEN  
     CASE WHEN ISNULL(r.rgn_imprv_pct,-1) <> -1 THEN  
      RTRIM(pv.rgn_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, r.rgn_imprv_pct)),'') + '%)'  
     ELSE  
      RTRIM(ISNULL(pv.rgn_cd,''))  
     END  
    ELSE  
     RTRIM(ISNULL(pv.rgn_cd,''))  
    END as region,  
    
    CASE WHEN ISNULL(pv.abs_subdv_cd,'') <> '' THEN  
     CASE WHEN ISNULL(abs.abs_land_pct,-1) <> -1 THEN  
      RTRIM(pv.abs_subdv_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, abs.abs_land_pct)),'') + '%)'  
     ELSE  
      RTRIM(ISNULL(pv.abs_subdv_cd,''))  
     END  
    ELSE  
     RTRIM(ISNULL(pv.abs_subdv_cd,''))  
    END as subd,  
    
    CASE WHEN ISNULL(pv.hood_cd,'') <> '' THEN  
     CASE WHEN ISNULL(n.hood_land_pct,-1) <> -1 THEN  
      RTRIM(pv.hood_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, n.hood_land_pct)),'') + '%)'  
     ELSE  
      RTRIM(ISNULL(pv.hood_cd,''))  
     END  
    ELSE  
     RTRIM(ISNULL(pv.hood_cd,''))  
    END as nbhd,  
    
    CASE WHEN ISNULL(pv.subset_cd,'') <> '' THEN  
     CASE WHEN ISNULL(s.subset_imprv_pct,-1) <> -1 THEN  
      RTRIM(pv.subset_cd) + ' (' + ISNULL(CONVERT(varchar(3), CONVERT(int, s.subset_imprv_pct)),'') + '%)'  
     ELSE  
      RTRIM(ISNULL(pv.subset_cd,''))  
     END  
    ELSE  
     RTRIM(ISNULL(pv.subset_cd,''))  
    END as subset,  
  
    ISNULL(pv.irr_wells,-1) as irr_wells,  
    ISNULL(pv.irr_capacity,-1) as irr_capacity,  
  
    ISNULL(pv.irr_acres,-1) as irr_acres,  
    ISNULL(pv.oil_wells,-1) as oil_wells,  
  
    ISNULL(lt.land_type_desc, '') as description,  
    ISNULL(ls1.ls_code, '') AS class,  
    ISNULL(ld.state_cd, '') as state_cd,  
       CASE ISNULL(ld.land_seg_homesite, 'F')  
    WHEN 'F' THEN  
     'N'  
    WHEN 'T' THEN  
     'Y'  
    ELSE ''  
    END as hs,  
    ISNULL(ld.hs_pct_override,0) as hs_pct_override,  
    ISNULL(ld.hs_pct,100) as hs_pct,  
  
    ISNULL(ls1.ls_method, '') as meth,  
    
    CASE ISNULL(ls1.ls_method, '')  
    WHEN 'SQ' THEN  
     CASE WHEN ISNULL(ld.size_square_feet, -1) <> -1  
     THEN CONVERT(varchar(20), ld.size_square_feet) + ' SQ'  
     ELSE ''  
     END  
    WHEN 'FF' THEN  
     CASE WHEN ISNULL(ld.effective_front, -1) <> -1 AND ISNULL(ld.effective_depth, -1) <> -1  
     THEN CONVERT(varchar(20), ld.effective_front) + 'X' + CONVERT(varchar(20), ld.effective_depth)  
     ELSE ''  
     END  
    WHEN 'L' THEN  
     CASE WHEN ISNULL(ld.effective_front, -1) <> -1 AND ISNULL(ld.effective_depth, -1) <> -1  
     THEN CONVERT(varchar(20), ld.effective_front) + 'X' + CONVERT(varchar(20), ld.effective_depth)  
     ELSE ''  
     END  
    ELSE  
     CASE WHEN ISNULL(ld.size_acres, -1) <> -1  
     THEN CONVERT(varchar(20), ld.size_acres) + ' AC'  
     ELSE ''  
     END  
    END as dimensions,  
    
    ISNULL(ld.mkt_unit_price, -1) as unit_price,  
    ISNULL(ld.mkt_calc_val, -1) as gross_value,  
    ISNULL(ld.land_adj_factor, -1) as adj_fctr,  
    ISNULL(ld.land_mass_adj_factor, -1) as mass_adj,  
    ISNULL(ld.mkt_val_source, '') as val_src,  
    ISNULL(ld.land_seg_mkt_val, -1) as mkt_val,  
    
    CASE ISNULL(ld.ag_apply, '')  
    WHEN 'F' THEN  
     'N'  
    WHEN 'T' THEN  
     'Y'  
    ELSE ''  
    END as ag_apply,  
    
    ISNULL(ld.ag_use_cd, '') as ag_use,  
    ISNULL(ls.ls_code, '') as ag_table,  
    ISNULL(ld.ag_unit_price, -1) as ag_unit_prc,  
    ISNULL(ld.ag_val, -1) as ag_value,  
        ISNULL(ld.land_type_cd, '') as type,   
    ISNULL(ld.land_soil_code, '') as soil,  
    LTRIM(RTRIM(ISNULL(ld.land_seg_comment, ''))) as comment  
   FROM land_detail as ld  
   WITH (NOLOCK)  
  
   INNER JOIN property_val as pv  
   WITH (NOLOCK)  
   ON ld.prop_id = pv.prop_id  
   AND ld.prop_val_yr = pv.prop_val_yr  
   AND ld.sup_num = pv.sup_num  
  
   LEFT OUTER JOIN land_sched as ls  
   WITH (NOLOCK)  
   ON ld.prop_val_yr = ls.ls_year  
   AND ld.ls_ag_id = ls.ls_id  
    
   LEFT OUTER JOIN land_sched as ls1  
   WITH (NOLOCK)  
   ON ld.prop_val_yr = ls1.ls_year  
   AND ld.ls_mkt_id = ls1.ls_id   
    
   LEFT OUTER JOIN land_type as lt  
   WITH (NOLOCK)  
   ON ld.land_type_cd = lt.land_type_cd  
    
   LEFT OUTER JOIN region as r  
   WITH (NOLOCK)  
   ON pv.rgn_cd = r.rgn_cd  
   
   LEFT OUTER JOIN abs_subdv as abs  
   WITH (NOLOCK)  
   ON pv.abs_subdv_cd = abs.abs_subdv_cd  
   AND pv.prop_val_yr = abs.abs_subdv_yr  
   
   LEFT OUTER JOIN neighborhood as n  
   WITH (NOLOCK)  
   ON pv.hood_cd = n.hood_cd  
   AND pv.prop_val_yr = n.hood_yr  
  
   LEFT OUTER JOIN subset as s  
   WITH (NOLOCK)  
   ON pv.subset_cd = s.subset_code  
  
   WHERE ld.prop_id = @prop_id  
   AND ld.prop_val_yr = @year  
   AND ld.sup_num = @sup_num  
   AND ld.sale_id = @sale_id  
  
 
end
set  @currentDatasetId=@currentDatasetId +1 
  /*  
   * LAND ADJUSTMENTS area  
   */  
  if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
  SELECT la.land_seg_id,  
    RTRIM(ISNULL(la.land_seg_adj_type,'')) as adj_type,   
    CASE   
     WHEN RTRIM(ISNULL(lat.land_adj_type_usage,'')) = 'U' THEN  
      ISNULL(la.land_value,-1)  
     ELSE  
      ISNULL(lat.land_adj_type_amt,-1)  
     END as adj_amt,  
  
    CASE   
     WHEN RTRIM(ISNULL(lat.land_adj_type_usage,'')) = 'U' THEN  
      ISNULL(la.land_seg_adj_pc,-1)  
     ELSE  
      ISNULL(lat.land_adj_type_pct,-1)  
     END as adj_percent  
  FROM land_adj as la  
  WITH (NOLOCK)  
  
  INNER JOIN land_adj_type as lat  
  WITH (NOLOCK)  
  ON la.land_seg_adj_type = lat.land_adj_type_cd  
  AND la.prop_val_yr = lat.land_adj_type_year  
  
  WHERE prop_id = @prop_id  
  AND prop_val_yr = @year  
  AND sup_num = @sup_num  
  AND sale_id = @sale_id  
  ORDER BY land_seg_id  
 
end
set  @currentDatasetId=@currentDatasetId +1 
        /*         
         *  Improvement Adjustements  
         *  
         */  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
  SELECT   
   imprv_id,   
   imprv_adj_type_cd,   
   case imprv_adj_amt when 0 then imprv_adj_type_amt else imprv_adj_amt end as imprv_adj_amt,   
   isnull(imprv_adj_pc, imprv_adj_type_pct) as imprv_adj_pc   
  FROM IMP_ADJ_VW  
         where prop_id = @prop_id  
         AND prop_val_yr = @year  
   AND sup_num = @sup_num  
         AND sale_id = @sale_id  

end
set  @currentDatasetId=@currentDatasetId +1
  
  /*  
   *  Lawsuit Info (HS # 34679 changes)  
   */  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
  select * from lawsuit_property  
  inner join lawsuit on lawsuit.lawsuit_id = lawsuit_property.lawsuit_id  
  left outer join lawsuit_status on lawsuit_status.status_cd = lawsuit.status  
  where isnull(inactive_flag, 0) = 0 and lawsuit_property.prop_id = @prop_id 

end
set  @currentDatasetId=@currentDatasetId +1 
  
  /* Note that as of 3.23.06 the recordsets below do not appear to be getting used by the application */  
  if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
        /*  
         * REC 10/31/2005 - Return the sup num (this saves one db trip on the appraisal card if the sup_num = -1  
         */  
         SELECT @sup_num as 'sup_num'  

end
set  @currentDatasetId=@currentDatasetId +1
          
        /*  
         * REC 10/31/2005 - Return the sketches for the improvments. We should save at least one trip to the db  
         *                   for every imprv with a sketch. #temp_imprv  
         */  
if ((@currentDatasetId=@DatasetId) or (@DatasetId<0)) 
begin
         SELECT imprv_id, NoteType, xLocation, yLocation, NoteText, xLine, yLine, NoteLineType,    
                NoteBorderType, NoteFontSize, NoteJustification, NoteColor    
                FROM imprv_sketch_note  with (nolock) WHERE prop_id = @prop_id   
                AND prop_val_yr = @year AND sup_num = @sup_num  
                AND sale_id = @sale_id AND imprv_id IN (SELECT DISTINCT i.imprv_id    
                                                      FROM imprv as i  
                                                      WITH (NOLOCK)  
                                                      INNER JOIN property_val as pv  
                                                      WITH (NOLOCK)  
                                                      ON i.prop_id = pv.prop_id  
                                                      AND i.prop_val_yr = pv.prop_val_yr  
                                                      AND i.sup_num = pv.sup_num  
                                                            WHERE i.prop_id = @prop_id  
                                                      AND i.prop_val_yr = @year  
                                                      AND i.sup_num = @sup_num  
                                                      AND i.sale_id = @sale_id   
                                                         )  
                ORDER BY seq_num  

end

GO

