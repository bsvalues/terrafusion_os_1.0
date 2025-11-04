
CREATE          VIEW litigation_report_by_entity_vw
AS


select 
            entity_cd,
            entity_name,
            IsNull(file_as_name, 'UDI Property') owner_name,
            A.prop_id,
            geo_id,
            A.lawsuit_yr,
            status_desc,
            case when isnull(inactive_flag,0) = 1 then 'Inactive' else 'Active' end as status_type,
            cause_num,
            situs_display,
            certified_value,
            IsNull(taxpayer_opinion_of_value, 0) AS taxpayer_opinion_of_value,
            CCA.tax_area_number
from (
            select
                                    entity_cd,
                                    file_as_name entity_name,
                                    A.prop_id,
                                    geo_id,
                                    lawsuit_id,
                                    lawsuit_yr,
                                    status_desc,
                                    inactive_flag,
                                    cause_num,
                                    certified_value,
                                    taxpayer_opinion_of_value
            from (
                        select
                                    e.entity_cd,
                                    ae.file_as_name,
                                    p.prop_id,
                                    pv.sup_num,
                                    p.geo_id,
                                    lp.lawsuit_id,
                                    lp.lawsuit_yr,
                                    ls.status_desc,
                                    ls.inactive_flag,
                                    l.cause_num,
                                    lp.certified_value,
                                    lp.taxpayer_opinion_of_value
                        from lawsuit_property lp
                        inner join entity_prop_assoc epa on epa.prop_id=lp.prop_id and epa.tax_yr=lp.lawsuit_yr
                        inner join entity e on e.entity_id=epa.entity_id
                        inner join account ae on ae.acct_id=e.entity_id
                        inner join property_val pv on pv.prop_id=lp.prop_id and pv.prop_val_yr=lp.lawsuit_yr and pv.sup_num=epa.sup_num
                        inner join property p on p.prop_id=pv.prop_id 
                        inner join lawsuit l on l.lawsuit_id=lp.lawsuit_id
                        left join lawsuit_status ls on ls.status_cd=l.status -- left join needed in case lawsuit has no status
            ) A
            inner join
            (
                        select prop_id, prop_val_yr, max(sup_num) MAXSUP
                        from property_val
                        group by prop_id, prop_val_yr
            ) B
            on A.prop_id=B.prop_id and A.lawsuit_yr=B.prop_val_yr and A.sup_num=B.MAXSUP
) A
left join (  -- not all properties have a SITUS and some have multiple SITUS so take primary but use inner join as well
            select 
                        Aprop_id  prop_id,
                        case when primary_situs = 'Y' then situs_display else Asitus_display end situs_display,
                        case when primary_situs = 'Y' then primary_situs else Aprimary_situs end primary_situs,
                lawsuit_id lawsuit_id,
                lawsuit_yr lawsuit_yr
            from
            (
                        select * from
                        (
                                    select 
                                                lp.prop_id Aprop_id, s.situs_id Asitus_id, s.situs_display Asitus_display, s.primary_situs Aprimary_situs, lp.lawsuit_yr  Alawsuit_yr, lp.lawsuit_id Alawsuit_id
                                    from lawsuit_property lp
                                    inner join situs s on lp.prop_id=s.prop_id 
                                    where  s.situs_id = (select min(ABC.situs_id)
        from situs ABC
                                                where ABC.prop_id=s.prop_id)
                        ) A
                        left join
                        (
                                    select 
                                                lp.prop_id, s.situs_id, s.situs_display, s.primary_situs, lp.lawsuit_yr, lp.lawsuit_id
                                    from lawsuit_property lp
                                    inner join situs s on lp.prop_id=s.prop_id 
                                    where s.primary_situs = 'Y' 
                        ) B
                        on A.Aprop_id=B.prop_id and A.Alawsuit_yr=B.lawsuit_yr and A.Alawsuit_id=B.lawsuit_id
            ) RES
) B 
on A.prop_id=B.prop_id and A.lawsuit_id=B.lawsuit_id and A.lawsuit_yr=B.lawsuit_yr
left join ( -- properties with mutliple owners are to display UDI Property. Also have to consider multiple lawsuits on the property
            select ABC.lawsuit_id, ABC.prop_id, file_as_name, ABC.lawsuit_yr
            from (
                        select prop_id, lawsuit_id, lawsuit_yr, count(prop_id) CNT, MAXSUP from ( 
                                    select A.prop_id, A.lawsuit_id, A.lawsuit_yr, MAXSUP
                                    from (
                                                select lp.prop_id, lp.lawsuit_id, lp.lawsuit_yr, pv.sup_num
                                                from lawsuit_property lp
                                                inner join property_val pv on pv.prop_id=lp.prop_id and pv.prop_val_yr=lp.lawsuit_yr
                                                inner join owner o on o.prop_id=pv.prop_id and o.sup_num=pv.sup_num and o.owner_tax_yr=pv.prop_val_yr
                                                inner join account ao on ao.acct_id=o.owner_id
                                    ) A
                                    inner join (
                                                select prop_id, prop_val_yr, max(sup_num) MAXSUP
                                                from property_val
                                                group by prop_id, prop_val_yr
                                    ) B
                                    on A.prop_id=B.prop_id and A.lawsuit_yr=B.prop_val_yr and A.sup_num=B.MAXSUP
                        ) Z
                        GROUP BY prop_id, lawsuit_id, lawsuit_yr, MAXSUP
                        HAVING count(prop_id)=1
            ) ABC inner join
            (
                        select lp.prop_id, lp.lawsuit_id, ao.file_as_name, pv.sup_num, lawsuit_yr
                        from lawsuit_property lp
                        inner join property_val pv on pv.prop_id=lp.prop_id and pv.prop_val_yr=lp.lawsuit_yr
                        inner join owner o on o.prop_id=pv.prop_id and o.sup_num=pv.sup_num and o.owner_tax_yr=pv.prop_val_yr
                        inner join account ao on ao.acct_id=o.owner_id
            ) XYZ
            on ABC.lawsuit_id=XYZ.lawsuit_id and ABC.prop_id=XYZ.prop_id and XYZ.sup_num=ABC.MAXSUP and ABC.lawsuit_yr=XYZ.lawsuit_yr
) C
on C.lawsuit_id=A.lawsuit_id and C.prop_id=A.prop_id and C.lawsuit_yr = A.lawsuit_yr
LEFT OUTER JOIN
                          (SELECT     pta.year, pta.prop_id, ta.tax_area_number
                            FROM          dbo.lawsuit_property AS lp WITH (nolock) RIGHT OUTER JOIN
                                                   dbo.property_tax_area AS pta WITH (nolock) ON lp.lawsuit_yr = pta.year AND lp.prop_id = pta.prop_id INNER JOIN
                                                   dbo.prop_supp_assoc AS psa WITH (nolock) ON pta.year = psa.owner_tax_yr AND pta.sup_num = psa.sup_num AND 
                                                   pta.prop_id = psa.prop_id INNER JOIN
                                                   dbo.tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id) AS CCA ON CCA.prop_id = A.prop_id

GO

