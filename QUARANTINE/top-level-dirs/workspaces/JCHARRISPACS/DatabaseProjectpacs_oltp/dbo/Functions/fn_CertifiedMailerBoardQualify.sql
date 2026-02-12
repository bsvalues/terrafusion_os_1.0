
CREATE FUNCTION fn_CertifiedMailerBoardQualify (@input_case_id int,  @input_prop_id int, @input_year int   )
RETURNS bit 
AS
BEGIN
    DECLARE @include_decision_reason bit  
    DECLARE @maxValueForArbit numeric(14,0)  

	declare @output_qualify  bit 
    --
    SET @output_qualify = 0 
    --
    SELECT  @include_decision_reason = ISNULL(arss.include_decision_reason, 0)   
    FROM    arbitration_system_settings as arss with (nolock)  
    WHERE   arss.settings_id = 0  
    -- Max Market/Appraised Value to be qualified for Arbitration  
    SET @maxValueForArbit = 1000000  
    --
    if (@include_decision_reason=1)
    BEGIN
        SELECT @output_qualify = 
                   case when ( p.prop_type_cd IN ('R', 'MH', 'MN') )
                        AND  ( (pv.market <= @maxValueForArbit) OR (pv.appraised_val <= @maxValueForArbit) )
                        AND ( ISNULL(apdr.qualify_for_arbitration, 0)= 1 )
                        AND ( aps.arbitration_letter_id IS NOT NULL )
                   THEN 1
                   ELSE 0
                   END  
                FROM _arb_protest as arb with (nolock)
                INNER JOIN property_val as pv with (nolock)
                ON pv.prop_val_yr = arb.prop_val_yr
                AND pv.prop_id = arb.prop_id
                INNER JOIN prop_supp_assoc as psa with (nolock)  
                ON psa.prop_id = pv.prop_id  
                AND psa.owner_tax_yr = pv.prop_val_yr  
                AND psa.sup_num = pv.sup_num    
                
                INNER JOIN property as p with (nolock)    
                ON pv.prop_id = p.prop_id  
                
                INNER JOIN _arb_protest_status as aps with (nolock)  
                ON aps.status_cd = arb.prot_status  

                LEFT OUTER JOIN _arb_protest_decision_reason as apdr with (nolock)
                ON apdr.decision_reason_cd = arb.decision_reason_cd
                WHERE arb.case_id     = @input_case_id
                  AND arb.prop_id     = @input_prop_id
                  AND arb.prop_val_yr = @input_year
    END --if
    ELSE
    BEGIN
        SELECT @output_qualify = 
                   case when ( p.prop_type_cd IN ('R', 'MH', 'MN') )
                        AND  ( (pv.market <= @maxValueForArbit) OR (pv.appraised_val <= @maxValueForArbit) ) 
                        AND ( aps.arbitration_letter_id IS NOT NULL )
                   THEN 1
                   ELSE 0
                   END 
                FROM _arb_protest as arb with (nolock)
                INNER JOIN property_val as pv with (nolock)
                ON pv.prop_val_yr = arb.prop_val_yr
                AND pv.prop_id = arb.prop_id
                INNER JOIN prop_supp_assoc as psa with (nolock)  
                ON psa.prop_id = pv.prop_id  
                AND psa.owner_tax_yr = pv.prop_val_yr  
                AND psa.sup_num = pv.sup_num    
                
                INNER JOIN property as p with (nolock)    
                ON pv.prop_id = p.prop_id  
                
                INNER JOIN _arb_protest_status as aps with (nolock)  
                ON aps.status_cd = arb.prot_status  
 
                WHERE arb.case_id     = @input_case_id
                  AND arb.prop_id     = @input_prop_id
                  AND arb.prop_val_yr = @input_year
    END 
    	   
	RETURN (@output_qualify)
END

GO

