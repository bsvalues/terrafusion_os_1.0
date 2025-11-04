
CREATE PROCEDURE PopulateBoardOrderCertMailerLetters
-- parameters as selection criteria
--@input_selection int ,
--@input_sub_selection int = -1,
--@input_prot_statuses varchar(2048) = NULL,
--@input_status_chg_dt_begin smalldatetime = NULL,
--@input_status_chg_dt_end smalldatetime = NULL,
--@input_hearing_dt_begin smalldatetime = NULL,
--@input_hearing_dt_end smalldatetime = NULL,
-- @input_caseIDs varchar(2048) = NULL,
-- @input_prot_docket_dt_begin smalldatetime  = NULL,
-- @input_prot_docket_dt_end smalldatetime = NULL,
-- @input_case_yr int = NULL, 
@input_sql_where varchar(4000),
@input_addr_deliverable bit = 0,
@input_primary_protester int = 2

  
AS

-- HS 31659 Arbitration , Sai K  
-- This procedure populates the board_order_cert_mailer_letter table with appropriate protest case information  
-- To summarize the workflow  
-- Step 1) procedure will first divide the selected cases into two sub-batches based on whether they qualify for arbitration or not  
-- Step 2) procedure will then take each sub-batch and then divide into 3 groups - Agent, Single Owner and Multi Owner  
-- Step 3) Final step is to load the board_order_cert_mailer_letter table with the correct sub-batch id and group id  
  
-- NOTE: The procedure has been designed in a way such that it is easily extensible.  
--       This means that in Step 1, the selected cases (based on the search criteria sent as the input parameter)  
--       can be divided into n (can vary) sub-batches depending on what is the condition to divide using the sub-batch id concept  
--  And similarly, in Step 2, more groups can be added to a single sub-batch using the group-id concept  
  
DECLARE @output_batch_id int  
  
--DECLARE @sqlWhere varchar(4000)  
--SET @sqlWhere = ''  
  
DECLARE @sqlInsert varchar(8000)  
SET @sqlInsert = ''  
  
-- STEP 1  
-- Filter all the cases based on the selection criteria  
IF EXISTS (select name from tempdb.dbo.sysobjects where name = '#board_letter_batch')  
 BEGIN  
 DROP TABLE #board_letter_batch  
 END  
  
CREATE TABLE #board_letter_batch  
 (  
  prop_id int NOT NULL,  
  prop_val_yr numeric(4,0) NOT NULL,
  sup_num int NOT NULL,	  
  case_id int NOT NULL, 
  sub_batch_id int NOT NULL,
  letter_id int null,
  legal_desc varchar(255) NULL,
  real_est_val_bef [numeric](19, 2) NULL ,
  pers_prop_val_bef [numeric](19, 2) NULL ,
  ag_val_bef [numeric](19, 2) NULL ,
  real_est_val_aft [numeric](19, 2) NULL ,
  pers_prop_val_aft [numeric](19, 2) NULL ,
  ag_val_aft [numeric](19, 2) NULL ,
  hear_dt [smalldatetime] NULL ,
  status_cd [varchar] (50)  NULL ,
		 
  CONSTRAINT CPK_board_letter_batch PRIMARY KEY CLUSTERED   
  (  
   [prop_id],  
   [prop_val_yr],  
   [case_id]  
  ) WITH  FILLFACTOR = 100  ON [PRIMARY]    
)  
  

-- Retrieve all cases that qualify for arbitration  
DECLARE @include_decision_reason bit  
  
-- Max Market/Appraised Value to be qualified for Arbitration  
DECLARE @maxValueForArbit numeric(14,0)  
SET @maxValueForArbit = 1000000   
  
  
SELECT  @include_decision_reason = ISNULL(arss.include_decision_reason, 0)   
FROM    arbitration_system_settings as arss with (nolock)  
WHERE  arss.settings_id = 0    

-- if multiple protest by configuration setting is off then always look for primary protestors  
DECLARE @hasMultiProtByConfig varchar(1)  
SET @hasMultiProtByConfig = 'T'  
SELECT  @hasMultiProtByConfig = szConfigValue   
FROM pacs_config   
WHERE szGroup='ARBProtest' AND szConfigName = 'ARB Multiple Protest By'  
  
IF @hasMultiProtByConfig = 'F'  
BEGIN  
SET @input_primary_protester = 0  
END    
   
DECLARE @primary_protestor int  
SET @primary_protestor = (@input_primary_protester ^ 1)  
     
  
-- Prepare the Insert Statement  
  
SELECT @sqlInsert =    'INSERT #board_letter_batch '  
SELECT @sqlInsert = @sqlInsert + ' SELECT '  
SELECT @sqlInsert = @sqlInsert + ' arb.prop_id as prop_id, '  
SELECT @sqlInsert = @sqlInsert + ' arb.prop_val_yr as prop_val_yr, '
SELECT @sqlInsert = @sqlInsert + ' pv.sup_num as sup_num, '  
SELECT @sqlInsert = @sqlInsert + ' arb.case_id as case_id, '  

-- Qualifying Arbitration or non-qualifying arbitration
SELECT @sqlInsert = @sqlInsert + ' CASE WHEN ( p.prop_type_cd IN (''R'', ''MH'', ''MN'') )'
SELECT @sqlInsert = @sqlInsert + '      AND  ( pv.market <= ' + STR(@maxValueForArbit) + ' OR pv.appraised_val <= ' + STR(@maxValueForArbit) + ')  ' 	

IF @include_decision_reason = 1
BEGIN
SELECT @sqlInsert = @sqlInsert + ' 	AND ( ISNULL(apdr.qualify_for_arbitration, 0)= 1 ) '
END
SELECT @sqlInsert = @sqlInsert + '      AND ( aps.arbitration_letter_id IS NOT NULL ) '	

SELECT @sqlInsert = @sqlInsert + '       THEN 1 '
SELECT @sqlInsert = @sqlInsert + ' ELSE 0 '
SELECT @sqlInsert = @sqlInsert + ' END as sub_batch_id, '	
SELECT @sqlInsert = @sqlInsert + ' aps.letter_type as letter_id, '
SELECT @sqlInsert = @sqlInsert + ' pv.legal_desc as legal_desc, '  
SELECT @sqlInsert = @sqlInsert + ' CASE p.prop_type_cd '  
SELECT @sqlInsert = @sqlInsert + ' WHEN ''P'' THEN 0.0 '  
SELECT @sqlInsert = @sqlInsert + ' else ISNULL(arb.begin_market, 0.0) '  
SELECT @sqlInsert = @sqlInsert + ' END as real_est_val_bef, '  
SELECT @sqlInsert = @sqlInsert + ' CASE p.prop_type_cd '  
SELECT @sqlInsert = @sqlInsert + ' WHEN ''P'' THEN ISNULL(arb.begin_market, 0.0) '  
SELECT @sqlInsert = @sqlInsert + ' else 0.0 '  
SELECT @sqlInsert = @sqlInsert + ' END as pers_prop_val_bef, '  
SELECT @sqlInsert = @sqlInsert + ' ISNULL(arb.begin_ag_market, 0.0) + ISNULL(arb.begin_timber_market, 0.0) as ag_val_bef, '  
SELECT @sqlInsert = @sqlInsert + ' CASE p.prop_type_cd '  
SELECT @sqlInsert = @sqlInsert + ' WHEN ''P'' THEN 0.0 '  
SELECT @sqlInsert = @sqlInsert + ' else ISNULL(arb.final_market, 0.0) '  
SELECT @sqlInsert = @sqlInsert + ' END as real_est_val_aft, '  
SELECT @sqlInsert = @sqlInsert + ' CASE p.prop_type_cd '  
SELECT @sqlInsert = @sqlInsert + ' WHEN ''P'' THEN ISNULL(arb.final_market, 0.0) '  
SELECT @sqlInsert = @sqlInsert + ' else 0.0 '  
SELECT @sqlInsert = @sqlInsert + ' END as pers_prop_val_aft, '  
SELECT @sqlInsert = @sqlInsert + ' ISNULL(arb.final_ag_market, 0.0) + ISNULL(arb.final_timber_market, 0.0) as ag_val_aft, '  
SELECT @sqlInsert = @sqlInsert + ' aphd.docket_start_date_time as hear_dt, ' 
SELECT @sqlInsert = @sqlInsert + ' arb.prot_status as status_cd '  

SELECT @sqlInsert = @sqlInsert + ' FROM '  
SELECT @sqlInsert = @sqlInsert + ' _arb_protest as arb with (nolock) '  

SELECT @sqlInsert = @sqlInsert + ' INNER JOIN property_val as pv with (nolock) '  
SELECT @sqlInsert = @sqlInsert + ' ON pv.prop_val_yr = arb.prop_val_yr '  
SELECT @sqlInsert = @sqlInsert + ' AND pv.prop_id = arb.prop_id '  
    
SELECT @sqlInsert = @sqlInsert + ' INNER JOIN prop_supp_assoc as psa with (nolock) '  
SELECT @sqlInsert = @sqlInsert + ' ON psa.prop_id = pv.prop_id '  
SELECT @sqlInsert = @sqlInsert + ' AND psa.owner_tax_yr = pv.prop_val_yr '  
SELECT @sqlInsert = @sqlInsert + ' AND psa.sup_num = pv.sup_num '    
   
SELECT @sqlInsert = @sqlInsert + ' INNER JOIN property as p with (nolock) '    
SELECT @sqlInsert = @sqlInsert + ' ON pv.prop_id = p.prop_id '  
   
SELECT @sqlInsert = @sqlInsert + ' INNER JOIN _arb_protest_status as aps with (nolock) '  
SELECT @sqlInsert = @sqlInsert + ' ON aps.status_cd = arb.prot_status '   
  
SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN _arb_protest_hearing_docket as aphd with (nolock) '  
SELECT @sqlInsert = @sqlInsert + ' ON aphd.docket_id = arb.docket_id '

IF @include_decision_reason = 1
BEGIN
SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN _arb_protest_decision_reason as apdr with (nolock) '  
SELECT @sqlInsert = @sqlInsert + ' ON apdr.decision_reason_cd = arb.decision_reason_cd '  
END
   
SELECT @sqlInsert = @sqlInsert +  ' WHERE 1=1 '     
  
-- Add additional search criteria from input parameters  
IF @input_sql_where <> ''  
 SELECT @sqlInsert = @sqlInsert  + @input_sql_where   
  
-- Load all matching cases  
exec (@sqlInsert)  

-- Remove cases for which status codes do not have appropriate letters
DELETE FROM #board_letter_batch 
WHERE sub_batch_id = 0 AND letter_id IS NULL
      

  
-- If no case was selected just return with an invalid batch id  
IF NOT EXISTS (SELECT * FROM #board_letter_batch)  
BEGIN  
	SELECT @output_batch_id = -1  
	SELECT batch_id = @output_batch_id 
	RETURN  
END

-- IF atleast one case has been selected from previous selects, create a new batch id for this entire process  
-- otherwise return from here itself 
ELSE 
BEGIN
	INSERT INTO board_order_letter_batch (batch_date) values (getdate())  
	SELECT @output_batch_id = @@identity  
END  
  
-- Re Initialise sql insert  
SELECT @sqlInsert = ''  
  
-- Create Temp table for group   
-- This table will store the protest by ids during the processing of a single group   
-- on a sub batch  
CREATE TABLE #board_letter_group_batch  
(  
 prot_by_id int NOT NULL,  
 sub_batch_id int NOT NULL,  
 CONSTRAINT CPK_board_letter_group_batch PRIMARY KEY CLUSTERED   
 (  
  [prot_by_id],  
  [sub_batch_id]  
 )WITH  FILLFACTOR = 100  ON [PRIMARY]    
)  
  
  
  
   
  
--STEP 3:  
-- Divide sub batch#1 further into groups   
    
-- Group 1: Agent  
-- Group 2: Accounts (not agents) Protesting on a single case   
-- Group 3: Accounts (not agents) Protesting on multiple cases  
-- Note: For Group 2/3 , these are accounts who have protested case(s) on properties   
--       that they may or may not own  
  
  
-- Temp Table has protest ids of all agents  
INSERT #board_letter_group_batch  
SELECT   
 DISTINCT   
 appa.prot_by_id as prot_by_id,  
 bol.sub_batch_id as sub_batch_id  
FROM  
 #board_letter_batch as bol with (nolock)  
   
 INNER JOIN _arb_protest_protest_by_assoc as appa with (nolock)  
 on bol.prop_id = appa.prop_id  
 and bol.prop_val_yr = appa.prop_val_yr  
 and bol.case_id = appa.case_id  
 AND appa.withdrew = 0
     
 INNER JOIN agent  with (nolock)  
 on agent.agent_id = appa.prot_by_id  
    
  
  
-- Any Agents who protested this cases   
IF EXISTS (SELECT * from #board_letter_group_batch)  
BEGIN    
  
  SELECT @sqlInsert =    ' INSERT board_order_cert_mailer_letter '  
       
   -- only if cases have been protested by agents   
  SELECT @sqlInsert = @sqlInsert + ' SELECT '   
  SELECT @sqlInsert = @sqlInsert + ' bol.prop_val_yr as prop_val_yr, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.case_id as case_id, '  
  SELECT @sqlInsert = @sqlInsert + STR(@output_batch_id)  +  ' as board_order_letter_batch_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 0 as mailer_type, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.prop_id as prop_id, '  
  SELECT @sqlInsert = @sqlInsert + ' appa.prot_by_id as agent_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 0 as owner_id, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.legal_desc as legal_desc, '  
  SELECT @sqlInsert = @sqlInsert + ' NULL as owner_name, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.real_est_val_bef as real_est_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.pers_prop_val_bef as pers_prop_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.ag_val_bef as ag_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.real_est_val_aft as real_est_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.pers_prop_val_aft as pers_prop_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.ag_val_aft as ag_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.hear_dt as hear_dt, '  
  SELECT @sqlInsert = @sqlInsert + ' appa.prot_by_id as acct_id, '  
  SELECT @sqlInsert = @sqlInsert + ' LEFT((RTRIM(LTRIM(ISNULL(NULLIF(acag.file_as_name + CHAR(13),CHAR(13)),''''))) + RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_line1 + CHAR(13),CHAR(13)),''''))) + '   
  SELECT @sqlInsert = @sqlInsert + ' RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_line2 + CHAR(13),CHAR(13)),''''))) + LTRIM(RTRIM(ISNULL(NULLIF(adag.addr_line3 + CHAR(13),CHAR(13)),''''))) + '  
  SELECT @sqlInsert = @sqlInsert + ' RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_city + '', '','', ''),''''))) + LTRIM(RTRIM(ISNULL(NULLIF(adag.addr_state + '' '','' ''),''''))) + '' '' + adag.addr_zip), 100) '  
  SELECT @sqlInsert = @sqlInsert + ' as mail_to_addr, '  
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(acow.file_as_name + CHAR(13),CHAR(13)),'''') + ISNULL(NULLIF(adow.addr_line1 + CHAR(13),CHAR(13)),'''') + '   
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(adow.addr_line2 + CHAR(13),CHAR(13)),'''') + ISNULL(NULLIF(adow.addr_line3 + CHAR(13),CHAR(13)),'''') + '  
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(adow.addr_city + '', '','', ''),'''') + ISNULL(NULLIF(adow.addr_state + '' '','' ''),'''') + adow.addr_zip '   
  SELECT @sqlInsert = @sqlInsert + ' NULL as owner_addr, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.status_cd as status_cd, '  
  SELECT @sqlInsert = @sqlInsert + ' NULL, '  
  SELECT @sqlInsert = @sqlInsert + ' appa.prot_by_id as prot_by_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 0 as group_id, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.sub_batch_id as sub_batch_id '  
              
          
  SELECT @sqlInsert = @sqlInsert + ' FROM '  
  SELECT @sqlInsert = @sqlInsert + ' #board_letter_batch as bol with (nolock) '  
        
  SELECT @sqlInsert = @sqlInsert + 'INNER JOIN _arb_protest_protest_by_assoc as appa with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' ON  bol.prop_id = appa.prop_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND bol.prop_val_yr = appa.prop_val_yr '  
  SELECT @sqlInsert = @sqlInsert + ' AND bol.case_id = appa.case_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND appa.withdrew = 0 '
    
  IF @input_primary_protester <> 2  
  BEGIN  
  --SELECT @sqlInsert = @sqlInsert +        ' and appa.primary_protester = ' + STR(@input_primary_protester)  
  SELECT @sqlInsert = @sqlInsert +        ' and appa.primary_protester = ' + STR(@primary_protestor)  
  END     
           
  SELECT @sqlInsert = @sqlInsert +  ' INNER JOIN #board_letter_group_batch as bog with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' ON appa.prot_by_id = bog.prot_by_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND bog.sub_batch_id = bol.sub_batch_id '  
            
      
  --SELECT @sqlInsert = @sqlInsert + ' INNER JOIN owner  with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' ON owner.prop_id = pv.prop_id '  
  --SELECT @sqlInsert = @sqlInsert + ' AND owner.owner_tax_yr = pv.prop_val_yr '  
  --SELECT @sqlInsert = @sqlInsert + ' AND owner.sup_num = pv.sup_num '  
       
  --SELECT @sqlInsert = @sqlInsert + ' INNER JOIN account as acow with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' on owner.owner_id = acow.acct_id '  
            
       --INNER JOIN agent  with (nolock)  
       --on agent.agent_id = appa.prot_by_id  
       
  SELECT @sqlInsert = @sqlInsert + ' INNER JOIN account as acag with (nolock) '  
       --on agent.agent_id = acag.acct_id  
  SELECT @sqlInsert = @sqlInsert + ' ON bog.prot_by_id = acag.acct_id '  
    
  
  
  --SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN address as adow with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' on adow.acct_id = acow.acct_id '  
  --SELECT @sqlInsert = @sqlInsert + ' AND adow.primary_addr = ''Y'' '  
       
  SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN address as adag with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' on adag.acct_id = acag.acct_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND adag.primary_addr = ''Y'''  
  IF @input_addr_deliverable = 1   
  BEGIN  
  SELECT @sqlInsert = @sqlInsert + ' AND ISNULL(adag.ml_deliverable, ''Y'') = ''Y'' '  
  END  
  
  
--PRINT  @sqlInsert  
exec (@sqlInsert)    
  
  
END -- End of if for agent protested cases   
  
-- Always CLEAR the temp table for group batch  
DELETE FROM #board_letter_group_batch   
  
-- accounts that have protested only one case  
INSERT #board_letter_group_batch  
SELECT   
 DISTINCT   
 appa.prot_by_id as prot_by_id,  
 bol.sub_batch_id as sub_batch_id  
FROM  
 #board_letter_batch as bol with (nolock)  
   
 INNER JOIN _arb_protest_protest_by_assoc as appa with (nolock)  
 on bol.prop_id = appa.prop_id  
 and bol.prop_val_yr = appa.prop_val_yr  
 and bol.case_id = appa.case_id  
 AND appa.withdrew = 0
     
 WHERE  NOT EXISTS   
 (  
    SELECT * FROM agent WHERE appa.prot_by_id = agent.agent_id  
 )   
 GROUP BY   
  appa.prot_by_id,  
  bol.sub_batch_id  
 HAVING   
  COUNT(*) = 1  
    
  
  
-- Any Protesters who protested exactly one case  
IF EXISTS (SELECT * from #board_letter_group_batch)  
BEGIN    
  
  SELECT @sqlInsert =    ' INSERT board_order_cert_mailer_letter '  
       
   -- only if Protesters who protested exactly one case   
  SELECT @sqlInsert = @sqlInsert + ' SELECT '   
  SELECT @sqlInsert = @sqlInsert + ' bol.prop_val_yr as prop_val_yr, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.case_id as case_id, '  
  SELECT @sqlInsert = @sqlInsert + STR(@output_batch_id)  +  ' as board_order_letter_batch_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 1 as mailer_type, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.prop_id as prop_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 0 as agent_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 0 as owner_id, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.legal_desc as legal_desc, '  
  SELECT @sqlInsert = @sqlInsert + ' NULL as owner_name, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.real_est_val_bef as real_est_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.pers_prop_val_bef as pers_prop_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.ag_val_bef as ag_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.real_est_val_aft as real_est_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.pers_prop_val_aft as pers_prop_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.ag_val_aft as ag_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.hear_dt as hear_dt, '  
  SELECT @sqlInsert = @sqlInsert + ' appa.prot_by_id as acct_id, '  
  SELECT @sqlInsert = @sqlInsert + ' LEFT((RTRIM(LTRIM(ISNULL(NULLIF(acag.file_as_name + CHAR(13),CHAR(13)),''''))) + RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_line1 + CHAR(13),CHAR(13)),''''))) + '   
  SELECT @sqlInsert = @sqlInsert + ' RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_line2 + CHAR(13),CHAR(13)),''''))) + LTRIM(RTRIM(ISNULL(NULLIF(adag.addr_line3 + CHAR(13),CHAR(13)),''''))) + '  
  SELECT @sqlInsert = @sqlInsert + ' RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_city + '', '','', ''),''''))) + LTRIM(RTRIM(ISNULL(NULLIF(adag.addr_state + '' '','' ''),''''))) + '' '' + adag.addr_zip), 100) '  
  SELECT @sqlInsert = @sqlInsert + ' as mail_to_addr, '  
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(acow.file_as_name + CHAR(13),CHAR(13)),'''') + ISNULL(NULLIF(adow.addr_line1 + CHAR(13),CHAR(13)),'''') + '   
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(adow.addr_line2 + CHAR(13),CHAR(13)),'''') + ISNULL(NULLIF(adow.addr_line3 + CHAR(13),CHAR(13)),'''') + '  
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(adow.addr_city + '', '','', ''),'''') + ISNULL(NULLIF(adow.addr_state + '' '','' ''),'''') + adow.addr_zip '   
  SELECT @sqlInsert = @sqlInsert + ' NULL as owner_addr, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.status_cd as status_cd, '  
  SELECT @sqlInsert = @sqlInsert + ' NULL, '  
  SELECT @sqlInsert = @sqlInsert + ' appa.prot_by_id as prot_by_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 1 as group_id, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.sub_batch_id as sub_batch_id '  
              
          
  SELECT @sqlInsert = @sqlInsert + ' FROM '  
  SELECT @sqlInsert = @sqlInsert + ' #board_letter_batch as bol with (nolock) '  
   
  SELECT @sqlInsert = @sqlInsert + 'INNER JOIN _arb_protest_protest_by_assoc as appa with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' ON  bol.prop_id = appa.prop_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND bol.prop_val_yr = appa.prop_val_yr '  
  SELECT @sqlInsert = @sqlInsert + ' AND bol.case_id = appa.case_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND appa.withdrew = 0 '
    
  IF @input_primary_protester <> 2  
  BEGIN  
  --SELECT @sqlInsert = @sqlInsert +        ' and appa.primary_protester = ' + STR(@input_primary_protester)  
  SELECT @sqlInsert = @sqlInsert +        ' and appa.primary_protester = ' + STR(@primary_protestor)  
  END     
           
  SELECT @sqlInsert = @sqlInsert +  ' INNER JOIN #board_letter_group_batch as bog with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' ON appa.prot_by_id = bog.prot_by_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND bog.sub_batch_id = bol.sub_batch_id '  
            
      
  --SELECT @sqlInsert = @sqlInsert + ' INNER JOIN owner  with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' ON owner.prop_id = pv.prop_id '  
  --SELECT @sqlInsert = @sqlInsert + ' AND owner.owner_tax_yr = pv.prop_val_yr '  
  --SELECT @sqlInsert = @sqlInsert + ' AND owner.sup_num = pv.sup_num '  
       
  --SELECT @sqlInsert = @sqlInsert + ' INNER JOIN account as acow with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' on owner.owner_id = acow.acct_id '  
            
       --INNER JOIN agent  with (nolock)  
       --on agent.agent_id = appa.prot_by_id  
       
  SELECT @sqlInsert = @sqlInsert + ' INNER JOIN account as acag with (nolock) '  
       --on agent.agent_id = acag.acct_id  
  SELECT @sqlInsert = @sqlInsert + ' ON bog.prot_by_id = acag.acct_id '  
    
  --SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN address as adow with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' on adow.acct_id = acow.acct_id '  
  --SELECT @sqlInsert = @sqlInsert + ' AND adow.primary_addr = ''Y'' '  
       
  SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN address as adag with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' on adag.acct_id = acag.acct_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND adag.primary_addr = ''Y'' '  
  IF @input_addr_deliverable = 1   
  BEGIN  
  SELECT @sqlInsert = @sqlInsert + ' AND ISNULL(adag.ml_deliverable, ''Y'') = ''Y'' '  
  END  
  
--SELECT  @sqlInsert  
exec (@sqlInsert)    
   
  
  
  
  
  
END -- End of if Protesters who protested exactly one case   
  
-- Always CLEAR the temp table for group batch  
TRUNCATE TABLE #board_letter_group_batch   
  
-- accounts that have protested on more than one case  
INSERT #board_letter_group_batch  
SELECT   
 DISTINCT   
 appa.prot_by_id as prot_by_id,  
 bol.sub_batch_id as sub_batch_id  
FROM  
 #board_letter_batch as bol with (nolock)  
   
 INNER JOIN _arb_protest_protest_by_assoc as appa with (nolock)  
 on bol.prop_id = appa.prop_id  
 and bol.prop_val_yr = appa.prop_val_yr  
 and bol.case_id = appa.case_id 
 AND appa.withdrew = 0 
     
 WHERE  NOT EXISTS   
 (  
    SELECT * FROM agent WHERE appa.prot_by_id = agent.agent_id  
 )   
 GROUP BY   
  appa.prot_by_id,  
  bol.sub_batch_id  
 HAVING   
  COUNT(*) > 1  
    
  
-- Any Protesters who protested more than one case  
IF EXISTS (SELECT * from #board_letter_group_batch)  
BEGIN    
  
  SELECT @sqlInsert =    ' INSERT board_order_cert_mailer_letter '  
       
   -- only if Protesters who protested more than one case   
  SELECT @sqlInsert = @sqlInsert + ' SELECT '   
  SELECT @sqlInsert = @sqlInsert + ' bol.prop_val_yr as prop_val_yr, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.case_id as case_id, '  
  SELECT @sqlInsert = @sqlInsert + STR(@output_batch_id)  +  ' as board_order_letter_batch_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 2 as mailer_type, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.prop_id as prop_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 0 as agent_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 0 as owner_id, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.legal_desc as legal_desc, '  
  SELECT @sqlInsert = @sqlInsert + ' NULL as owner_name, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.real_est_val_bef as real_est_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.pers_prop_val_bef as pers_prop_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.ag_val_bef as ag_val_bef, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.real_est_val_aft as real_est_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.pers_prop_val_aft as pers_prop_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.ag_val_aft as ag_val_aft, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.hear_dt as hear_dt, '  
  SELECT @sqlInsert = @sqlInsert + ' appa.prot_by_id as acct_id, '  
  SELECT @sqlInsert = @sqlInsert + ' LEFT((RTRIM(LTRIM(ISNULL(NULLIF(acag.file_as_name + CHAR(13),CHAR(13)),''''))) + RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_line1 + CHAR(13),CHAR(13)),''''))) + '   
  SELECT @sqlInsert = @sqlInsert + ' RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_line2 + CHAR(13),CHAR(13)),''''))) + LTRIM(RTRIM(ISNULL(NULLIF(adag.addr_line3 + CHAR(13),CHAR(13)),''''))) + '  
  SELECT @sqlInsert = @sqlInsert + ' RTRIM(LTRIM(ISNULL(NULLIF(adag.addr_city + '', '','', ''),''''))) + LTRIM(RTRIM(ISNULL(NULLIF(adag.addr_state + '' '','' ''),''''))) + '' '' + adag.addr_zip), 100) '  
  SELECT @sqlInsert = @sqlInsert + ' as mail_to_addr, '  
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(acow.file_as_name + CHAR(13),CHAR(13)),'''') + ISNULL(NULLIF(adow.addr_line1 + CHAR(13),CHAR(13)),'''') + '   
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(adow.addr_line2 + CHAR(13),CHAR(13)),'''') + ISNULL(NULLIF(adow.addr_line3 + CHAR(13),CHAR(13)),'''') + '  
  --SELECT @sqlInsert = @sqlInsert + ' ISNULL(NULLIF(adow.addr_city + '', '','', ''),'''') + ISNULL(NULLIF(adow.addr_state + '' '','' ''),'''') + adow.addr_zip '   
  SELECT @sqlInsert = @sqlInsert + ' NULL as owner_addr, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.status_cd as status_cd, '  
  SELECT @sqlInsert = @sqlInsert + ' NULL, '  
  SELECT @sqlInsert = @sqlInsert + ' appa.prot_by_id as prot_by_id, '  
  SELECT @sqlInsert = @sqlInsert + ' 2 as group_id, '  
  SELECT @sqlInsert = @sqlInsert + ' bol.sub_batch_id as sub_batch_id '  
              
          
  SELECT @sqlInsert = @sqlInsert + ' FROM '  
  SELECT @sqlInsert = @sqlInsert + ' #board_letter_batch as bol with (nolock) '  
        
  SELECT @sqlInsert = @sqlInsert + 'INNER JOIN _arb_protest_protest_by_assoc as appa with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' ON  bol.prop_id = appa.prop_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND bol.prop_val_yr = appa.prop_val_yr '  
  SELECT @sqlInsert = @sqlInsert + ' AND bol.case_id = appa.case_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND appa.withdrew = 0 '
    
  IF @input_primary_protester <> 2  
  BEGIN  
  --SELECT @sqlInsert = @sqlInsert +        ' and appa.primary_protester = ' + STR(@input_primary_protester)  
  SELECT @sqlInsert = @sqlInsert +        ' and appa.primary_protester = ' + STR(@primary_protestor)  
  END     
           
  SELECT @sqlInsert = @sqlInsert +  ' INNER JOIN #board_letter_group_batch as bog with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' ON appa.prot_by_id = bog.prot_by_id '  
  SELECT @sqlInsert = @sqlInsert + '  AND bog.sub_batch_id = bol.sub_batch_id '  
  
  --SELECT @sqlInsert = @sqlInsert + ' INNER JOIN owner  with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' ON owner.prop_id = pv.prop_id '  
  --SELECT @sqlInsert = @sqlInsert + ' AND owner.owner_tax_yr = pv.prop_val_yr '  
  --SELECT @sqlInsert = @sqlInsert + ' AND owner.sup_num = pv.sup_num '  
       
  --SELECT @sqlInsert = @sqlInsert + ' INNER JOIN account as acow with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' on owner.owner_id = acow.acct_id '  
            
       --INNER JOIN agent  with (nolock)  
       --on agent.agent_id = appa.prot_by_id  
       
  SELECT @sqlInsert = @sqlInsert + ' INNER JOIN account as acag with (nolock) '  
       --on agent.agent_id = acag.acct_id  
  SELECT @sqlInsert = @sqlInsert + ' ON bog.prot_by_id = acag.acct_id '  
    
  --SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN address as adow with (nolock) '  
  --SELECT @sqlInsert = @sqlInsert + ' on adow.acct_id = acow.acct_id '  
  --SELECT @sqlInsert = @sqlInsert + ' AND adow.primary_addr = ''Y'' '  
       
  SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN address as adag with (nolock) '  
  SELECT @sqlInsert = @sqlInsert + ' on adag.acct_id = acag.acct_id '  
  SELECT @sqlInsert = @sqlInsert + ' AND adag.primary_addr = ''Y'' '  
  IF @input_addr_deliverable = 1   
  BEGIN  
  SELECT @sqlInsert = @sqlInsert + ' AND ISNULL(adag.ml_deliverable, ''Y'') = ''Y'' '  
  END  
  
exec (@sqlInsert)    
  
  
END -- End of if Protesters who protested more than one case   
  
-- Always CLEAR the temp table for group batch  
DELETE FROM #board_letter_group_batch   
  
-- Iterate over all the rows for this batch and update their owner ids, owner name and owner addresses  
-- Open Cursor over this batch  
  
declare @prop_id int  
declare @prop_val_yr int   
declare @sup_num int  
declare @udi_parent varchar(1)  
declare @owner_id int  
declare @owner_name varchar(255)  
declare @owner_addr varchar(100)  
  
set @udi_parent = ''  


DECLARE BOLetters CURSOR FAST_FORWARD  
FOR SELECT DISTINCT prop_id, prop_val_yr  
FROM board_order_cert_mailer_letter  
WHERE board_order_letter_batch_id = @output_batch_id  
  
OPEN BOLetters  
FETCH NEXT FROM BOLetters INTO @prop_id, @prop_val_yr  
   
WHILE @@FETCH_STATUS = 0  
BEGIN  
    
 SELECT    
          @udi_parent = ISNULL(pv.udi_parent, '') ,  
          @sup_num = pv.sup_num  
        FROM   
   property_val as pv with (nolock)  
     INNER JOIN prop_supp_assoc as psa with (nolock)  
  ON pv.prop_id =  @prop_id  
  AND pv.prop_val_yr = @prop_val_yr  
  AND psa.prop_id = pv.prop_id  
  AND psa.owner_tax_yr = pv.prop_val_yr  
   AND psa.sup_num = pv.sup_num  
   
       IF (@udi_parent = '')  
       BEGIN   
  -- Get the id, name, addr of the single owner of this property  
  SELECT   
   @owner_id = owner.owner_id ,      
   @owner_name = acow.file_as_name ,    
   @owner_addr = ( ISNULL(NULLIF(acow.file_as_name + CHAR(13),CHAR(13)),'') +   
     ISNULL(NULLIF(adow.addr_line1 + CHAR(13),CHAR(13)),'') +   
     ISNULL(NULLIF(adow.addr_line2 + CHAR(13),CHAR(13)),'') +   
     ISNULL(NULLIF(adow.addr_line3 + CHAR(13),CHAR(13)),'') +   
     ISNULL(NULLIF(adow.addr_city + ', ',', '),'') +   
     ISNULL(NULLIF(adow.addr_state + ' ',' '),'') + adow.addr_zip  
          )    
     
  FROM   
   owner with (nolock)   
   INNER JOIN account as acow with (nolock)   
   ON owner.owner_id = acow.acct_id   
   LEFT OUTER JOIN address as adow with (nolock)   
   ON adow.acct_id = acow.acct_id   
   AND adow.primary_addr = 'Y'   
  WHERE   
   owner.prop_id = @prop_id   
   AND owner.owner_tax_yr = @prop_val_yr   
   AND owner.sup_num = @sup_num   
     
       END   
  
       ELSE   
       BEGIN  
  -- default the id, name, addr for this udi property  
  SET @owner_id = 0  
  SET @owner_name = 'UDI Property'  
  SET @owner_addr = ''  
     
       END     
  
 UPDATE board_order_cert_mailer_letter  
 SET   
 owner_id = @owner_id,  
 owner_name = @owner_name,  
 owner_addr = @owner_addr  
 WHERE   
 prop_id=@prop_id AND   
 prop_val_yr = @prop_val_yr AND   
 board_order_letter_batch_id = @output_batch_id   
    
   
       FETCH NEXT FROM BOLetters INTO @prop_id, @prop_val_yr    
    
END  
  
CLOSE BOLetters  
DEALLOCATE BOLetters   

delete bcm_curr 
from
board_order_cert_mailer_letter bcm_curr with (nolock)
inner join board_order_cert_mailer_letter bcm with (nolock) on
bcm.case_id = bcm_curr.case_id and
bcm.prop_val_yr = bcm_curr.prop_val_yr and
bcm.prot_by_id = bcm_curr.prot_by_id
where 
bcm_curr.board_order_letter_batch_id = @output_batch_id and
bcm.board_order_letter_batch_id < @output_batch_id
 
select @output_batch_id
if exists (select * from board_order_cert_mailer_letter where board_order_letter_batch_id = @output_batch_id)
	SELECT batch_id = @output_batch_id   
else
begin
	delete from board_order_letter_batch where board_order_letter_batch_id = @output_batch_id
	SELECT batch_id = -1   
end

GO

