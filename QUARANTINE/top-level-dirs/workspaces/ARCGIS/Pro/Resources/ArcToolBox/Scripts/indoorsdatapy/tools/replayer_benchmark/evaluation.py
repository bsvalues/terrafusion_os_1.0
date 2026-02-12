from collections import defaultdict

from indoorsdatapy.access.kpi import KpiAccess


def evaluation(kpi_ref, kpi_obs, cols=None, key='recording', threshold=90):
    """
    Comparison of reference and observed kpi.
    :param kpi_ref: str
        path
    :param kpi_obs: str
        path
    :param cols: list(str)
        columns of kpi to evaluate
    :param key: str
        key for grouping by kpis
    :param threshold: number
        threshold defining validity of kpi. It is how many percent of
        recordings has to result better for observed kpis. i.e. 95%
    :return: dict

    """

    cols = cols or [u'd_ref', u't_res', u'd_floor',
                    u'vel_res', u'angle_res', u'one_mark']
    cols_extra = cols + [u'obs_sdk_accuracy',
                         u'obs_sdk_accuracy_res', u'obs_sdk_accuracy_hit',
                         u'offset_obs_res', u'offset_ref_res']

    stats = ['mean', '50%', 'std']
    stats_rename = {'mean': 'mean', '50%': 'median', "std": 'std'}

    access_ref = KpiAccess(kpi_ref)
    access_obs = KpiAccess(kpi_obs)

    res_ref = access_ref.residuals()
    res_obs = access_obs.residuals()

    cols = list(
        set(cols).intersection(set(res_ref.columns.values)).intersection(
            res_obs.columns.values))
    cols_extra = list(set(cols_extra).intersection(
        set(res_ref.columns.values)).intersection(res_obs.columns.values))

    res_ref[key] = res_ref[key].astype('int64')
    res_obs[key] = res_obs[key].astype('int64')
    res_ref['obs_sdk_accuracy_hit'] = res_ref['obs_sdk_accuracy_hit'].astype(
        'float64')

    res_obs['obs_sdk_accuracy_hit'] = res_obs['obs_sdk_accuracy_hit'].astype(
        'float64')

    res_obs_f = res_obs[res_obs[key].isin(
        map(int, res_ref[key].drop_duplicates().values))]

    res_ref_f = res_ref[res_ref[key].isin(
        map(int, res_obs[key].drop_duplicates().values))]

    res_ref_f.sort_values(by=key, inplace=True)
    res_obs_f.sort_values(by=key, inplace=True)
    percentile = [.05, .15, .25, .50, .75, .85, .95]

    ref_desc = res_ref_f.groupby([key]).describe(
        percentiles=percentile).dropna()
    obs_desc = res_obs_f.groupby([key]).describe(
        percentiles=percentile).dropna()
    score = ref_desc.ge(obs_desc)
    diff = ref_desc - obs_desc
    score_dict = defaultdict(dict)
    r_score = defaultdict(dict)
    isvalid = True
    if not score.empty:
        for col in cols:
            for stat in stats:
                sc = score[col][stat]
                valid = sc[sc == True]
                stat_m = stats_rename[stat]
                mark = 100. / float(len(sc.index)) * float(len(valid.index))
                score_dict[col][stat_m] = mark

                sorted_rec = diff[col][stat].sort_values()
                if not sorted_rec.empty:
                    r_score[col][stat_m] = sorted_rec.tail(3).index.values

                if col == u'one_mark' and mark < threshold:
                    isvalid = False

    return {
        'score': score_dict,
        'valid': isvalid,
        'ref_df': res_ref[cols_extra],
        'obs_df': res_obs[cols_extra],
        'recordings': r_score,
        'raw': {
            'ref_desc': ref_desc[cols_extra],
            'obs_desc': obs_desc[cols_extra],
            'score': score[cols_extra],
            'diff': diff[cols_extra]
        }
    }
