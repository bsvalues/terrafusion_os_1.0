

CREATE   PROCEDURE Certified_Mailer_Qualify
    @mailer_batch int 
     
AS 

-- Retrieve all cases that qualify for arbitration  
DECLARE @include_decision_reason bit  

DECLARE @sqlInsert as VARCHAR(2500)

set @sqlInsert = ''
  
--
-- Max Market/Appraised Value to be qualified for Arbitration  
DECLARE @maxValueForArbit numeric(14,0)  
SET @maxValueForArbit = 1000000   
--
  
SELECT  @include_decision_reason = ISNULL(arss.include_decision_reason, 0)   
FROM    arbitration_system_settings as arss with (nolock)  
WHERE   arss.settings_id = 0   

--print @include_decision_reason
--print @maxValueForArbit

SELECT @sqlInsert = @sqlInsert + 'UPDATE certified_mailer '
SELECT @sqlInsert = @sqlInsert + ' SET qualify = '
SELECT @sqlInsert = @sqlInsert + '(SELECT '  
SELECT @sqlInsert = @sqlInsert + ' '  
SELECT @sqlInsert = @sqlInsert + ' CASE WHEN ( p.prop_type_cd IN (''R'', ''MH'', ''MN'') )'
SELECT @sqlInsert = @sqlInsert + '      AND  ( pv.market <= ' + STR(@maxValueForArbit) + ' OR pv.assessed_val <= ' + STR(@maxValueForArbit) + ')  ' 	

IF @include_decision_reason = 1
BEGIN
SELECT @sqlInsert = @sqlInsert + ' 	AND ( ISNULL(apdr.qualify_for_arbitration, 0)= 1 ) '
END
SELECT @sqlInsert = @sqlInsert + '      AND ( aps.arbitration_letter_id IS NOT NULL ) '	

SELECT @sqlInsert = @sqlInsert + '       THEN 1 '
SELECT @sqlInsert = @sqlInsert + ' ELSE 0 '
SELECT @sqlInsert = @sqlInsert + ' END as qualify '
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

IF @include_decision_reason = 1
BEGIN
SELECT @sqlInsert = @sqlInsert + ' LEFT OUTER JOIN _arb_protest_decision_reason as apdr with (nolock) '  
SELECT @sqlInsert = @sqlInsert + ' ON apdr.decision_reason_cd = arb.decision_reason_cd '  
END 

SELECT @sqlInsert = @sqlInsert + ' WHERE'
SELECT @sqlInsert = @sqlInsert + ' ctmlr.prop_val_yr = arb.prop_val_yr   '
SELECT @sqlInsert = @sqlInsert + ' AND ctmlr.case_id = arb.case_id  ' 
SELECT @sqlInsert = @sqlInsert + ' AND ctmlr.prop_id = arb.prop_id ) '  
SELECT @sqlInsert = @sqlInsert + ' FROM certified_mailer as ctmlr WITH(NOLOCK) '
SELECT @sqlInsert = @sqlInsert +  ' WHERE ctmlr.certified_mailer_batch_id = ' + STR(@mailer_batch)


 

-- print @sqlInsert

EXECUTE( @sqlInsert )

GO

