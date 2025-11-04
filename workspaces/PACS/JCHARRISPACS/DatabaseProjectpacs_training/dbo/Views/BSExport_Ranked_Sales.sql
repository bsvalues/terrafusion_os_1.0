create view BSExport_Ranked_Sales as
WITH RankedSales AS (
    SELECT
        copa.prop_id,
        s.sl_dt AS SaleDate,
        s.sl_price AS SalePrice,
        ROW_NUMBER() OVER (PARTITION BY copa.prop_id ORDER BY s.sl_dt ASC) AS SaleRank
    FROM
        Chg_of_owner_prop_assoc copa
    INNER JOIN
        Sale s ON copa.chg_of_owner_id = s.chg_of_owner_id
)
SELECT
    prop_id,
    MAX(CASE WHEN SaleRank = 1 THEN SaleDate ELSE NULL END) AS FirstSaleDate,
    MAX(CASE WHEN SaleRank = 1 THEN SalePrice ELSE NULL END) AS FirstSalePrice,
    MAX(CASE WHEN SaleRank = 2 THEN SaleDate ELSE NULL END) AS SecondSaleDate,
    MAX(CASE WHEN SaleRank = 2 THEN SalePrice ELSE NULL END) AS SecondSalePrice,
    MAX(CASE WHEN SaleRank = 3 THEN SaleDate ELSE NULL END) AS ThirdSaleDate,
    MAX(CASE WHEN SaleRank = 3 THEN SalePrice ELSE NULL END) AS ThirdSalePrice
FROM
    RankedSales
GROUP BY
    prop_id;

GO

