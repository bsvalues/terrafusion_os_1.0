import os
from logging import getLogger
from math import sqrt, ceil, floor

from PIL import Image

logger = getLogger(__name__)


def get_basename(filename):
    """Strip path and extension. Return basename."""
    return os.path.splitext(os.path.basename(filename))[0]


class Tile(object):
    def __init__(self, image, number, position, filename=None):
        """
        Represents a single tile
        :param image: pil.Image
            tile image
        :param number: int
            tile number
        :param position: tuple
            tile position
        :param filename: str
            tile output filename
        """
        self.image = image
        self.number = number
        self.position = position
        self.filename = filename

    @property
    def row(self):
        return self.position[0]

    @property
    def column(self):
        return self.position[1]

    @property
    def basename(self):
        """Strip path and extension. Return base filename."""
        return get_basename(self.filename)

    def generate_filename(self, directory=None, prefix='',
                          format='png', path=True):

        filename = prefix + '{col}_{row}.{ext}'.format(
            col=self.column, row=self.row, ext=format)
        if not path:
            return filename
        return os.path.join(directory, filename)

    def save(self, filename=None, format='png'):
        if not filename:
            filename = self.generate_filename(format=format)
        self.image.save(filename, format)
        self.filename = filename


def calc_columns_rows(n):
    """
    Calculate the number of columns and rows required to divide an image
    into ``n`` parts.

    :param n: 
    :return: tuple(int)
       (num_columns, num_rows)

    """
    num_columns = int(ceil(sqrt(n)))
    num_rows = int(ceil(n / float(num_columns)))
    return (num_columns, num_rows)


def slice_img_core(filename, number_tiles=None, number_cols=None,
                   number_rows=None, tile_w=None, tile_h=None,
                   preprocessing_img=lambda x: x):
    """
    Slicer of images. Allows to slice by given total number of tiles or
     by given number of rows and cols. In addition allows to specify resolution 
     of tile in pixels.
    :param filename: str
        path
    :param number_tiles: int
        total number of tiles
    :param number_cols: int
        number of tiles in columns
    :param number_rows: int
        number of tiles in rows
    :param tile_w: int
        width resolution of tile in pixels
    :param tile_h: int
        height resolution of tile in pixels

    :param preprocessing_img: lambda(PIL.Image)
        to preprocess picture before tiling
    :return: list(Tiles)
        Tiled object
    """
    im = Image.open(filename)
    im = preprocessing_img(img=im)
    im_w, im_h = im.size

    logger.info('Size of img: width: %s height: %s' % (im_w, im_h))
    if number_tiles:
        columns, rows = calc_columns_rows(number_tiles)
    else:
        columns = number_cols
        rows = number_rows
        if None in (number_cols, number_rows):
            raise AttributeError('Must be provided number'
                                 '_tiles or number_rows and number_cols')

    if None in (tile_w, tile_h):
        tile_w, tile_h = int(floor(im_w / columns)), int(floor(im_h / rows))

    # generate tiles sizes
    tiles_cols = [tile_w] * rows
    if im_w % tile_w != 0:
        tiles_cols = tiles_cols[1:] + [im_w % tile_w]

    tiles_rows = [tile_h] * columns
    if im_h % tile_h != 0:
        tiles_rows = tiles_rows[1:] + [im_h % tile_h]

    tiles = []
    number = 0
    pos_x = 0

    logger.debug('cols %s' % tiles_cols)
    logger.debug('rows %s' % tiles_rows)

    for idx_w, _tile_w in enumerate(tiles_cols):
        pos_y = 0
        for idx_h, _tile_h in enumerate(tiles_rows):
            position = (idx_w, idx_h)
            logger.debug("tile: {} {}".format(number, position))
            tiles.append(
                Tile(im.crop((pos_x, pos_y, pos_x + _tile_w, pos_y + _tile_h)),
                     number, position))

            number += 1
            pos_y += _tile_h

        pos_x += _tile_w

    return tuple(tiles)


def scale_tile(img, width, height):
    im = Image.open(img) if isinstance(img, str) else img
    logger.debug('Resizing picture %s' % str((width, height)))
    return im.resize((width, height), Image.ANTIALIAS)


def save_tiles(tiles, prefix='', directory=None, format='png'):
    """
    Save tiles to directories
    :param tiles: list(Tiles)
        tiles objects
    :param prefix: str
        prefix of final file name
    :param directory: str
        path of dir to save images 
    :param format: str
        PIL supported file format
    :return: 
    """
    if not os.path.exists(directory):
        os.makedirs(directory)

    for tile in tiles:
        file_name = tile.generate_filename(prefix=prefix,
                                           directory=directory,
                                           format=format)
        logger.debug("saving tile: %s" % file_name)
        tile.save(filename=file_name)

    return tuple(tiles)
