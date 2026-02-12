// TerraFlow Map Configuration
// Auto-generated from XML configuration files

const MapConfig = {
  "defaultBaseLayer": "Imagery",
  "baseLayers": [
    {
      "name": "",
      "url": "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer",
      "type": "ESRITiledLayer",
      "visible": true,
      "spatialReference": 0
    },
    {
      "name": "",
      "url": "https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/",
      "type": "ESRITiledLayer",
      "visible": true,
      "spatialReference": 0
    },
    {
      "name": "",
      "url": "https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer",
      "type": "ESRITiledLayer",
      "visible": true,
      "spatialReference": 0
    },
    {
      "name": "",
      "url": "https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHLWMS/MapServer",
      "type": "ESRITiledLayer",
      "visible": true,
      "spatialReference": 0
    },
    {
      "name": "",
      "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer",
      "type": "ESRITiledLayer",
      "visible": true,
      "spatialReference": 0
    }
  ],
  "viewableLayers": [
    {
      "name": "",
      "url": "https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/Parcels_and_Assess/FeatureServer",
      "type": "ESRIDynamicLayer",
      "visible": true,
      "selectable": true,
      "selectionLayerId": 0
    },
    {
      "name": "",
      "url": "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Short_Plats/FeatureServer",
      "type": "ESRIDynamicLayer",
      "visible": false,
      "selectable": false,
      "selectionLayerId": 0
    },
    {
      "name": "",
      "url": "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Long_Plats/FeatureServer",
      "type": "ESRIDynamicLayer",
      "visible": false,
      "selectable": false,
      "selectionLayerId": 0
    },
    {
      "name": "",
      "url": "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/FEMA_FLOOD_ZONES/FeatureServer",
      "type": "ESRIDynamicLayer",
      "visible": false,
      "selectable": false,
      "selectionLayerId": 0
    },
    {
      "name": "",
      "url": "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/WellLogs/FeatureServer",
      "type": "ESRIDynamicLayer",
      "visible": false,
      "selectable": false,
      "selectionLayerId": 0
    },
    {
      "name": "",
      "url": "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/Zoning/FeatureServer",
      "type": "ESRIDynamicLayer",
      "visible": false,
      "selectable": false,
      "selectionLayerId": 0
    },
    {
      "name": "",
      "url": "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services/BC_Zoning/FeatureServer",
      "type": "ESRIDynamicLayer",
      "visible": false,
      "selectable": false,
      "selectionLayerId": 0
    }
  ],
  "mapExtent": {
    "spatial_reference_wkid": 3857,
    "x_min": -180.0,
    "y_min": 25.6,
    "x_max": -93.2,
    "y_max": 36.7
  },
  "selectionStyle": {
    "fill_opacity": 0.15,
    "border_thickness": 1,
    "border_color": "0,255,255",
    "highlighted_border_color": "0,0,255",
    "highlighted_border_thickness": 3,
    "filtered_fill_opacity": 0.25,
    "filtered_fill_color": "200,0,0",
    "filtered_border_color": "200,0,0",
    "filtered_border_thickness": 1
  },
  "pacsDatabase": {
    "name": "PACS Database",
    "type": "SQLAdvanced",
    "connectionString": "Data Source=JCHARRISPACS;Initial Catalog=pacs_oltp;Integrated Security=True",
    "keyField": "Property_ID",
    "queries": [
      {
        "name": "",
        "description": "Prop Data SQL",
        "sql": "Select Cast(pp.prop_id as varchar) as Property_ID, pp.[prop_val_yr], pp.[sup_num], [update_dt], [school_id], [city_id], [state_cd], [class_cd], [land_type_cd], [yr_blt], [living_area], [imprv_unit_price], [imprv_add_val], [land_sqft], [land_acres], [land_front_feet], [land_depth], [land_lot], [land_unit_price], [region], [abs_subdv], [neighborhood], [subset], pp.[map_id], pp.[appraised_val], [land_num_lots], [land_appr_method], [land_total_sqft], [eff_yr_blt], [condition_cd], [percent_complete], [ls_table], [main_land_unit_price], [main_land_total_adj], [size_adj_pct], [heat_ac_code], [land_total_acres], [zoning], pp.[visibility_access_cd], pp.[sub_market_cd], [road_access], [land_useable_acres], [land_useable_sqft], pp.[property_use_cd], pp.[last_appraisal_dt], [utilities], [topography], [num_imprv], [imprv_type_cd], [imprv_det_sub_class_cd], [class_cd_highvalueimprov], [imprv_det_sub_class_cd_highvalueimprov], [living_area_highvalueimprov], [actual_year_built], [characteristic_zoning1], [characteristic_zoning2], [characteristic_view], [actual_age], [mbl_hm_make], [mbl_hm_model], [mbl_hm_sn], [mbl_hm_hud_num], [mbl_hm_title_num], [imprv_det_meth_cd_highvalueimprov], [imprv_building_name_highvalueimprov], [imprv_det_lease_class_highvalueimprov] From property_profile pp with(nolock) inner join property_val pv with(nolock) on pv.prop_id = pp.prop_id and pv.prop_val_yr = pp.prop_val_yr and pv.sup_num = pp.sup_num and pv.prop_inactive_dt is null where pp.prop_val_yr = @YEAR and pp.prop_id in (@KEYFIELD_IDS)",
        "executeImmediate": false,
        "type": "Sql"
      },
      {
        "name": "",
        "description": "Property",
        "sql": "SELECT t.prop_id as Property_ID, s.situs_display as Situs, t.[prop_val_yr], t.[sup_num], [update_dt], [school_id], [city_id], [state_cd], [class_cd], [land_type_cd], [yr_blt], [living_area], [imprv_unit_price], [imprv_add_val], [land_sqft], [land_acres], [land_front_feet], [land_depth], [land_lot], [land_unit_price], [region], [abs_subdv], [neighborhood], [subset], t.[map_id], t.[appraised_val], [land_num_lots], [land_appr_method], [land_total_sqft], [eff_yr_blt], [condition_cd], [percent_complete], [ls_table], [main_land_unit_price], [main_land_total_adj], [size_adj_pct], [heat_ac_code], [land_total_acres], [zoning], t.[visibility_access_cd], t.[sub_market_cd], [road_access], [land_useable_acres], [land_useable_sqft], t.[property_use_cd], t.[last_appraisal_dt], [utilities], [topography], [num_imprv], [imprv_type_cd], [imprv_det_sub_class_cd], [class_cd_highvalueimprov], [imprv_det_sub_class_cd_highvalueimprov], [living_area_highvalueimprov], [actual_year_built], [characteristic_zoning1], [characteristic_zoning2], [characteristic_view], [actual_age], [mbl_hm_make], [mbl_hm_model], [mbl_hm_sn], [mbl_hm_hud_num], [mbl_hm_title_num], [imprv_det_meth_cd_highvalueimprov], [imprv_building_name_highvalueimprov], [imprv_det_lease_class_highvalueimprov] FROM property_profile as t with(nolock) inner join situs s with(nolock) on t.prop_id = s.prop_id and s.primary_situs='Y' inner join property_val pv with(nolock) on pv.prop_id = t.prop_id and pv.prop_val_yr = t.prop_val_yr and pv.sup_num = t.sup_num and pv.prop_inactive_dt is null Where t.prop_val_yr = @YEAR and t.prop_id in (@KEYFIELD_IDS)\n\t\t  ",
        "executeImmediate": false,
        "type": "Sql"
      },
      {
        "name": "",
        "description": "Permits",
        "sql": " select pba.prop_id as Property_ID, pba.bldg_permit_id,  bp.bldg_permit_type_cd, bp.bldg_permit_sub_type_cd, bp.bldg_permit_num,bp.bldg_permit_issue_dt, bp.bldg_permit_dt_complete,bp.bldg_permit_appraiser_id, bp.bldg_permit_dt_worked, bp.bldg_permit_pct_complete, bp.bldg_permit_builder, bp.bldg_permit_active, bp.bldg_permit_cmnt from building_permit as bp inner join prop_building_permit_assoc as pba on bp.bldg_permit_id = pba.bldg_permit_id inner join property_profile as t on pba.prop_id = t.prop_id inner join property_val pv with(nolock) on pv.prop_id = t.prop_id and pv.prop_val_yr = t.prop_val_yr and pv.sup_num = t.sup_num and pv.prop_inactive_dt is null Where t.prop_val_yr = @YEAR and pba.prop_id in (@KEYFIELD_IDS)\n\t\t",
        "executeImmediate": false,
        "type": "Sql"
      },
      {
        "name": "",
        "description": "Land",
        "sql": "SELECT pv.prop_id as Property_ID, ld.state_cd, ld.land_type_cd, ls.ls_code, ls.ls_method, ld.mkt_unit_price, ld.size_acres, ld.land_seg_mkt_val, ld.land_adj_amt, ld.land_adj_factor, ld.land_mass_adj_factor FROM property_val pv WITH (nolock) INNER JOIN prop_supp_assoc psa WITH ( nolock ) ON             pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num and pv.prop_inactive_dt is null INNER JOIN land_detail ld WITH (nolock) ON pv.prop_id = ld.prop_id AND  pv.prop_val_yr = ld.prop_val_yr AND pv.sup_num = ld.sup_num AND ld.sale_id = 0 LEFT OUTER JOIN land_sched ls WITH (nolock) ON ld.ls_mkt_id = ls.ls_id AND ld.prop_val_yr = ls.ls_year WHERE pv.prop_val_yr = @YEAR and pv.prop_id in (@KEYFIELD_IDS) \n              ",
        "executeImmediate": false,
        "type": "Sql"
      },
      {
        "name": "",
        "description": "Property Links",
        "sql": "select pv.prop_id as Property_ID, pa.child_prop_id as linked_prop_id, p_linked.prop_type_cd, a.file_as_name from property_val as pv inner join owner as o with (nolock) on     pv.prop_id = o.prop_id and pv.prop_val_yr =o.owner_tax_yr and pv.sup_num = o.sup_num and pv.prop_inactive_dt is null inner join account as a with (nolock) on o.owner_id = a.acct_id inner join property as p with (nolock) on pv.prop_id = p.prop_id left outer join property_assoc as pa with (nolock) on pv.prop_id = pa.parent_prop_id and pv.prop_val_yr = pa.prop_val_yr left outer join property as p_linked on p_linked.prop_id = pa.child_prop_id INNER JOIN pacs_system ps WITH (nolock) ON pv.prop_val_yr = ps.appr_yr WHERE pv.prop_val_yr = ps.appr_yr and (pv.prop_inactive_dt is null) and pv.prop_id in (@KEYFIELD_IDS)\n\t\t  ",
        "executeImmediate": false,
        "type": "Sql"
      },
      {
        "name": "",
        "description": "Field Work",
        "sql": "SELECT pv.prop_id as Property_ID, pv.abs_subdv_cd as 'Abst/Subd',ac.file_as_name as 'Owner',  pv.last_appraisal_yr as 'Last Appraisal Year',pv.hscap_prev_reappr_yr 'Previous Reappraisal Year', cast((pv.last_appraisal_dt) as date) as Last_Inspection_Date, cast((pv.next_appraisal_dt) as date) as Next_Inspection_Date, REPLACE(REPLACE(REPLACE(pv.next_appraisal_rsn, char(13), ' '), ',', ' '), char(10), ' ') as 'Next Appraisal Reason', REPLACE(REPLACE(REPLACE(p.remarks, char(13), ' '), ',', ' '), char(10), ' ') as 'Remarks', REPLACE(REPLACE(REPLACE(p.prop_cmnt, char(13), ' '), ',', ' '), char(10), ' ') as 'Comments', REPLACE(REPLACE(REPLACE(pv.legal_desc, char(13), ' '), ',', ' '), char(10), ' ') as 'Legal Desc', pv.prop_val_yr FROM property_val pv WITH (nolock) INNER JOIN prop_supp_assoc psa with (nolock) ON psa.prop_id = pv.prop_id AND psa.owner_tax_yr = pv.prop_val_yr AND psa.sup_num = pv.sup_num and pv.prop_inactive_dt is null INNER JOIN property p WITH (nolock) ON  pv.prop_id = p.prop_id AND p.prop_type_cd = 'R' INNER JOIN owner o WITH (nolock) ON o.prop_id = pv.prop_id AND o.owner_tax_yr = pv.prop_val_yr AND o.sup_num = pv.sup_num INNER JOIN account ac WITH (nolock) ON o.owner_id = ac.acct_id INNER JOIN pacs_system ps WITH (nolock) ON pv.prop_val_yr = ps.appr_yr WHERE pv.prop_val_yr = ps.appr_yr AND (pv.prop_inactive_dt is null)and pv.prop_id in (@KEYFIELD_IDS) ORDER BY pv.abs_subdv_cd \n\t\t  \n\t\t  ",
        "executeImmediate": false,
        "type": "Sql"
      },
      {
        "name": "",
        "description": "Sales",
        "sql": "SELECT pv.prop_id as Property_ID, pv.hood_cd as 'NBHD', pp.state_cd, pp.class_cd, ac.file_as_name as Current_Owner, pv.legal_acreage, s.sl_type_cd, s.sl_ratio_type_cd, s.land_only_sale, pp.ls_table, CAST(s.sl_dt as datetime) as Sale_Date, s.sl_price, s.adjusted_sl_price, case when s.sl_price != 0 then CAST(ROUND((pv.market / s.sl_price), 2) as decimal (10,2)) else 0 end as Sales_Ratio, (pv.land_hstd_val + pv.land_non_hstd_val + pv.timber_market + pv.ag_market) as land_val, (pv.imprv_hstd_val + pv.imprv_non_hstd_val) as imprv_val, pv.market, convert(varchar(20), coo.deed_dt, 101) as Deed_Date, coo.deed_book_id, coo.deed_book_page, coo.deed_num, pv.prop_inactive_dt FROM property_val pv WITH (nolock) INNER JOIN prop_supp_assoc psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num and pv.prop_inactive_dt is null INNER JOIN owner o WITH (nolock) ON o.prop_id = pv.prop_id AND o.owner_tax_yr = pv.prop_val_yr AND o.sup_num = pv.sup_num INNER JOIN account ac WITH (nolock) ON ac.acct_id = o.owner_id INNER JOIN chg_of_owner_prop_assoc copa WITH (nolock) ON copa.prop_id = pv.prop_id INNER JOIN chg_of_owner coo WITH (nolock) ON coo.chg_of_owner_id = copa.chg_of_owner_id INNER JOIN sale s WITH (nolock) ON s.chg_of_owner_id = copa.chg_of_owner_id INNER JOIN property_profile pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr INNER JOIN pacs_system ps WITH (nolock) ON pv.prop_val_yr = ps.appr_yr WHERE pv.prop_val_yr = ps.appr_yr AND (DATEPART(year, s.sl_dt) = pv.prop_val_yr or DATEPART(year, s.sl_dt) = pv.prop_val_yr -1) AND isnull(s.adjusted_sl_price, 0) > 0 and pv.prop_id in (@KEYFIELD_IDS) ORDER BY pv.hood_cd\n\t\t  ",
        "executeImmediate": false,
        "type": "Sql"
      },
      {
        "name": "",
        "description": "Base Tax Due",
        "sql": "select b.prop_id as Property_ID, b.display_year, b.statement_id, sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid,0))) base_due from bill b with(nolock) left join bill_fee_assoc bfa with(nolock) on bfa.bill_id = b.bill_id left join fee f with(nolock) on f.fee_id = bfa.fee_id group by b.prop_id, b.display_year, b.statement_id having sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid,0))) > 0 and b.prop_id in (@KEYFIELD_IDS) \n\t\t  ",
        "executeImmediate": false,
        "type": "Sql"
      }
    ]
  },
  "savedLocations": [
    {
      "name": "",
      "description": "my sub divsion",
      "spatial_reference_wkid": 102100,
      "x_min": -10732428.312289072,
      "y_min": 3887403.3981508096,
      "x_max": -10727131.882723967,
      "y_max": 3889245.611858123
    },
    {
      "name": "",
      "description": "hood 1",
      "spatial_reference_wkid": 102100,
      "x_min": -10731580.871576982,
      "y_min": 3888260.945155521,
      "x_max": -10728678.860285364,
      "y_max": 3889182.0520091774
    },
    {
      "name": "",
      "description": "Year built hood",
      "spatial_reference_wkid": 3857,
      "x_min": -10737120.598997863,
      "y_min": 3888668.509002252,
      "x_max": -10732572.595814893,
      "y_max": 3889815.500993796
    },
    {
      "name": "",
      "description": "Year built hood 2",
      "spatial_reference_wkid": 3857,
      "x_min": -10734211.474257603,
      "y_min": 3886804.4867678564,
      "x_max": -10725115.467891641,
      "y_max": 3889872.3956623394
    },
    {
      "name": "",
      "description": "hood 2 yb",
      "spatial_reference_wkid": 3857,
      "x_min": -10734073.0915814,
      "y_min": 3885884.3305779384,
      "x_max": -10721482.65443723,
      "y_max": 3890130.8441077187
    },
    {
      "name": "",
      "description": "lukes house",
      "spatial_reference_wkid": 3857,
      "x_min": -10718142.109793805,
      "y_min": 3878704.9444261924,
      "x_max": -10710544.958665717,
      "y_max": 3880449.3475512546
    },
    {
      "name": "",
      "description": "new subs",
      "spatial_reference_wkid": 3857,
      "x_min": -10731081.068227492,
      "y_min": 3889059.468275232,
      "x_max": -10729685.298743593,
      "y_max": 3890139.4536823393
    },
    {
      "name": "",
      "description": "city view",
      "spatial_reference_wkid": 3857,
      "x_min": -10728381.617103226,
      "y_min": 3875536.699120396,
      "x_max": -10726577.360757597,
      "y_max": 3876109.2309433753
    },
    {
      "name": "",
      "description": "permits",
      "spatial_reference_wkid": 3857,
      "x_min": -10725145.88196022,
      "y_min": 3879459.2373834313,
      "x_max": -10719061.715975309,
      "y_max": 3884088.3371588276
    },
    {
      "name": "",
      "description": "mobile homes",
      "spatial_reference_wkid": 3857,
      "x_min": -10728983.320160596,
      "y_min": 3882594.0892482908,
      "x_max": -10725605.31725279,
      "y_max": 3884802.5574212833
    },
    {
      "name": "",
      "description": "Commercial Properties",
      "spatial_reference_wkid": 3857,
      "x_min": -10738725.944775186,
      "y_min": 3882813.8569813273,
      "x_max": -10735182.498742506,
      "y_max": 3885022.3251543227
    },
    {
      "name": "",
      "description": "playground",
      "spatial_reference_wkid": 3857,
      "x_min": -10737123.02110212,
      "y_min": 3887290.6384035004,
      "x_max": -10735726.871447053,
      "y_max": 3888831.192348312
    },
    {
      "name": "",
      "description": "Google street view",
      "spatial_reference_wkid": 3857,
      "x_min": -10728374.500443906,
      "y_min": 3887879.076680337,
      "x_max": -10728228.491092125,
      "y_max": 3888086.6624448495
    },
    {
      "name": "",
      "description": "new development",
      "spatial_reference_wkid": 3857,
      "x_min": -10730123.681273649,
      "y_min": 3888224.9166373555,
      "x_max": -10729012.804349972,
      "y_max": 3889582.19584521
    }
  ],
  "ui": {
    "showScaleBar": false,
    "showLegalText": true,
    "legalText": "THIS PRODUCT IS FOR INFORMATIONAL PURPOSES AND MAY NOT HAVE BEEN PREPARED FOR OR BE SUITABLE FOR LEGAL, ENGINEERING, OR SURVEYING PURPOSES. IT DOES NOT REPRESENT AN ON-THE-GROUND SURVEY AND REPRESENTS ONLY THE APPROXIMATE RELATIVE LOCATION OF PROPERTY BOUNDARIES.",
    "mapTitle": "Benton County Assessor Office",
    "geometryServer": "https://webmap.trueautomation.com/arcgis/rest/services/Utilities/Geometry/GeometryServer"
  }
};

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapConfig };
}
