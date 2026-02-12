

CREATE VIEW  PropMortAssoc_LenderMatchesGeoID_Vw
AS
SELECT lenderNo, COUNT(lenderNo) AS Matches
FROM PropMortAssoc_GeoID_Vw
WHERE (propID IS NOT NULL) AND (mortID IS NOT NULL)
GROUP BY lenderNo

GO

