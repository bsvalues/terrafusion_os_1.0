
CREATE VIEW dbo.property_special_assessment_vw
AS
SELECT psa.prop_id, psa.sup_num, psa.assessment_amt, sas.*
FROM property_special_assessment psa
 INNER JOIN special_assessment sas
   ON sas.agency_id = psa.agency_id and sas.[year] = psa.[year]

GO

