create view BSExport_Imprv as 

WITH MostValuableImprovement AS (
    SELECT
        prop_id,
        imprv_id,
        imprv_val,
        ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_val DESC) AS rank
    FROM
        imprv
)
SELECT
    i.prop_id,
    MAX(CASE WHEN mvi.rank = 1 THEN i.imprv_val ELSE 0 END) AS MostValuableImprvVal,
    SUM(CASE WHEN mvi.rank IS NULL OR mvi.rank > 1 THEN i.imprv_val ELSE 0 END) AS SumOfOtherImprovements
FROM
    imprv i
LEFT JOIN
    MostValuableImprovement mvi ON i.prop_id = mvi.prop_id AND i.imprv_id = mvi.imprv_id
GROUP BY
    i.prop_id;

GO

