

CREATE VIEW  PropMortAssoc_LenderMatchesPropID_Vw
AS
SELECT lenderNo, COUNT(lenderNo) AS Matches
FROM PropMortAssoc_PropID_Vw
WHERE (propID IS NOT NULL) AND (mortID IS NOT NULL)
GROUP BY lenderNo

GO

