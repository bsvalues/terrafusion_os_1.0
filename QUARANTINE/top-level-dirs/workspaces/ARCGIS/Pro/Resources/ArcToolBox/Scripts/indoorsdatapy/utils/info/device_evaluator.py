import os
from collections import defaultdict
from logging import getLogger

if os.environ.get('DISPLAY', '') == '':
    print('no display found. Using non-interactive Agg backend')
    import matplotlib as mpl

    mpl.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import recording_dtos, custom_parser, output_dir
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.common.utils import get_filename

logger = getLogger(__name__)


def compare_radio(accesses, wide, dir):
    res = defaultdict(list)
    for dto, access in accesses.items():
        rd = access['radios']
        device = access.get_metadata_value('device_name')[0]
        for tm in range(int(rd['t'].min()), int(rd['t'].max())):
            rr = rd[(rd['t'] > tm) & (rd['t'] < tm + wide)]
            cnt = rr['t'].count()
            trx = rr['ssid'].drop_duplicates().count()

            res[(dto, device)].append({'signal_rate': cnt, 'transmitters': trx})
        res[(dto, device)] = pd.DataFrame.from_dict(res[(dto, device)])

    fig, axes = plt.subplots(nrows=2, ncols=len(res.keys()))
    dtos = set()
    for plot_n, (dto, df) in enumerate(res.items(), 0):
        print(dto)
        dto, meta = dto
        dtos.add(dto)
        df["signal_rate"].plot(kind='bar', legend=True, figsize=(15, 10),
                               ax=axes[0][plot_n], title='ID %s \nDevice: \n%s' % (dto, meta), fontsize=5)
        df["transmitters"].plot(kind='bar', figsize=(15, 10),
                                legend=True,
                                ax=axes[1][plot_n],
                                fontsize=5)
        plt.legend(dto)

    plt.savefig(os.path.join(dir, '_'.join(list(dtos)) + '.svg'))
    plt.clf()


def main():
    args = [recording_dtos, output_dir]
    parser = custom_parser(args, description="{} - Recording joiner".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    wide = 1
    accesses = {get_filename(dto): RecordingAccess(dto) for dto in parsed.recording_dtos}

    if not os.path.isdir(parsed.output_dir):
        os.makedirs(parsed.output_dir)

    compare_radio(accesses, wide, parsed.output_dir)


if __name__ == "__main__":
    main()
