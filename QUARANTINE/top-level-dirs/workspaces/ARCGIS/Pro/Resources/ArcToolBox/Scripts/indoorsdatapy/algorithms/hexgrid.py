# -*- coding: utf-8 -*-
"""
hexgrid.py

Thomas Burgess < thomas@indoo.rs >
"""

import math
from collections import defaultdict

import numpy as np


class HexCell(object):
    """
    A hex cell

    Uses axial flat topped coordinates

    Attributes:
        q, r - axial cell coordinates
    Constants:
        SQRT3 - sqrt(3)
    """

    SQRT3 = math.sqrt(3)

    def __init__(self, index_q, index_r):
        self.index_q = index_q
        self.index_r = index_r
        self.value = None

    def set_value(self, value):
        self.value = value

    def indices(self):
        """
        Get indices

        Return:
            (q,r) indices
        """
        return (self.index_q, self.index_r)

    def as_xy(self, side=1):
        """
        Convert hex cell to x, y

        Parameters:
            side - hexagon side length[default: 1]

        Return:
            x, y - coordinate at cell center
        """
        return HexCell.xy_from_qr(self.index_q, self.index_r, side)

    @staticmethod
    def xy_from_qr(q, r, side):
        """Cartesian x, y coordinate from q, r index

        Parameters
        ----------
        q : int
            index q
        r : int
            index r
        side : float
            side of hex cell

        Returns
        -------
        float, float
            Cartesian x, y coordinate
        """
        return side * 1.5 * q, side * HexCell.SQRT3 * (r + q * 0.5)

    @staticmethod
    def qr_from_xy(x, y, side=1):
        """
        Convert cartesian x, y coordinate to fractional q, r indices

        Parameters
        ----------
        x : float
            Cartesian x coordinate
        y : float
            Cartesian y coordinate
        side : int, optional
            side of hex cell

        Return
        ------
        float, float
            Fractionl q, r index
        """
        iside = 1. / (side * 3)
        return (2 * x) * iside, (y * HexCell.SQRT3 - x) * iside

    @staticmethod
    def int_qr_from_xy(x, y, side=1):
        """Convert cartesian x, y coordinate to q, r indices

        Vectorized!

        Parameters
        ----------
        x : iterable(number)
            Cartesian x coordinate
        y : iterable(number)
            Cartesian y coordinate
        side : int, optional
            side of hex cell

        Return
        ------
        np.array(int), np.array(int)
            q, r index
        """
        xx, yy = np.asarray(x), np.asarray(y) * HexCell.SQRT3
        iside = 1. / (side * 3)
        xyz = iside * np.vstack((2 * xx, -xx - yy, yy - xx)).T
        rxyz = np.round(xyz)
        dxyz = np.abs(rxyz - xyz)
        dx, dy, dz = dxyz[:, 0], dxyz[:, 1], dxyz[:, 2]
        rxyz = rxyz.astype(int)
        q, qr, r = rxyz[:, 0], rxyz[:, 1], rxyz[:, 2]
        swapq = (dx > dy) & (dx > dz)
        swapr = (dy <= dz) & np.logical_not(swapq)
        q[swapq] = -qr[swapq] - r[swapq]
        r[swapr] = -q[swapr] - qr[swapr]
        return q, r

    @staticmethod
    def side(height):
        """
        Calculate side from height

        Parameters:
            height - hexagon height

        Return:
            side - hexagon side length
        """
        return height / HexCell.SQRT3

    @staticmethod
    def area(side=1):
        """
        Get area given side

        Return:
            Area of hexagon
        """
        return 1.5 * HexCell.SQRT3 * side * side

    @staticmethod
    def width(side=1):
        """
        Get width given side

        Parameters:
            side - hexagon side length[default: 1]

        Return:
            Distance between two opposing vertices in the hexagon
        """
        return side * 2

    @staticmethod
    def horiz(side=1):
        """
        Get horizontal separation given side

        Parameters:
            side - hexagon side length[default: 1]

        Return:
            Horizontal offset between cells in adjacent columns
        """
        return 0.75 * HexCell.width(side)

    @staticmethod
    def vert(side=1):
        """
        Get vertical cell separation give side

        Parameters:
            side - hexagon side length[default: 1]

        Return:
            Vertical offset between cells in adjacent columns
        """
        return HexCell.height(side) * 0.5

    @staticmethod
    def height(side=1):
        """
        Get height of cell given side

        Parameters:
            side - hexagon side length[default: 1]

        Return:
            Distance between two opposing sides in the hexagon
        """
        return 0.5 * HexCell.SQRT3 * HexCell.width(side)

    @staticmethod
    def from_xy(xy_coord, side=1):
        """
        Convert cartesian x, y coordinate to hex cell indices

        Parameters:
            xy_coord - (x, z) cartesian coordinate
            side - hexagon side length[default: 1]

        Return:
            HexCell with center closest to x, y
        """
        frac_q = (2. / 3.) * xy_coord[0] / side
        frac_r = ((-1. / 3.) * xy_coord[0] +
                  (1. / 3.) * HexCell.SQRT3 * xy_coord[1]) / side
        return HexCell(frac_q, frac_r).round()

    def as_cube(self):
        """
        Conver coordinate to hex indices

        Return:
            Cube coordinate representation
        """
        return (self.index_q, -self.index_q - self.index_r, self.index_r)

    @staticmethod
    def from_cube(ijk):
        """
        Convert to cube coordinate representation

        Parameters:
            ijk - hex cell coordinates in cube foorm(i, j, k)
        Return:
            HexCell
        """
        return HexCell(ijk[0], ijk[2])

    def neighbours(self):
        """
        Get list of direct neighbours

        Return:
            list of neighboring HexCells
        """
        neighbours = \
            ((+1, 0), (+1, -1), (0, -1), (-1, 0), (-1, +1), (0, +1))
        return [HexCell(self.index_q + q, self.index_r + r)
                for q, r in neighbours]

    def distance(self, hexcell=None):
        """
        Distance in cell units between cells

        Parameters:
            hexcell - cell to calculate distance to
                      (if not specified use(0, 0))
        Return:
            distance in cells between self and hexcell
        """
        index_q, index_r = (hexcell.index_q, hexcell.index_r) \
            if hexcell is not None else (0, 0)
        return int((abs(self.index_q - index_q) +
                    abs(self.index_r - index_r) +
                    abs(self.index_q + self.index_r -
                        index_q - index_r)) / 2)

    def vertices(self, side=1):
        """
        Create list of vertices

        Parameters:
            side - hexagon side length[default: 1]

        Return:
            list of coordinates at hex vertices
        """
        xorigin, yorigin = self.as_xy(side)
        angle_step = math.pi / 3.
        angles = [i * angle_step for i in range(6)]
        return [(xorigin + side * math.cos(angle),
                 yorigin + side * math.sin(angle)) for angle in angles]

    def round(self):
        """
        Round cell with fractional indices to integer indices

        Return:
            Rounded HexCell
        """
        return HexCell.from_cube(HexCell.cube_round(self.as_cube()))

    @staticmethod
    def cube_round(ijk):
        """
        Round cube coordinate to integers

        Parameters:
            ijk - cube coordinate i, j, k
        Returns
            rijk - rounded i, j, k
        """
        rijk = [int(round(ijk[0])), int(round(ijk[1])), int(round(ijk[2]))]
        dijk = (abs(rijk[0] - ijk[0]), abs(
            rijk[1] - ijk[1]), abs(rijk[2] - ijk[2]))
        if dijk[0] > dijk[1] and dijk[0] > dijk[2]:
            rijk[0] = -rijk[1] - rijk[2]
        elif dijk[1] > dijk[2]:
            rijk[1] = -rijk[0] - rijk[2]
        else:
            rijk[2] = -rijk[0] - rijk[1]
        return rijk

    def range(self, cell_range):
        """
        Get all cells within range

        Parameters:
            cell_range - Radius in units of cells
        Returns:
            cells - list of cells within cell_range
        """
        cells = []
        for dx in range(-cell_range, cell_range + 1):
            for dy in range(max(-cell_range, -dx - cell_range),
                            min(cell_range, -dx + cell_range) + 1):
                cells.append(
                    HexCell(self.index_q + dx, self.index_r - dx - dy))
        return cells

    @staticmethod
    def qr_round(q, r):
        xyz = q, -q - r, r
        rxyz = list(map(lambda x: int(round(x)), xyz))
        dxyz = list(map(lambda xy: abs(xy[0] - xy[1]), zip(rxyz, xyz)))
        if dxyz[0] > dxyz[1] and dxyz[0] > dxyz[2]:
            rxyz[0] = -rxyz[1] - rxyz[2]
        elif dxyz[1] <= dxyz[2]:
            rxyz[2] = -rxyz[0] - rxyz[1]
        return rxyz[0], rxyz[2]

    @staticmethod
    def within_radius(xy, radius, side=1):
        """Vectorized within radius function

        Parameters
        ----------
        xy : tuple(float,float)
            center to search around
        radius : float
            radius to search within
        side : float
            hexagon side length[default: 1]

        Returns
        -------
        np.array
            [x, y, d^2, q, r]
        """
        # Radius in cells
        N = int(np.floor(radius / (1.5 * side)))

        # # Create cells
        qr = np.indices((N * 2 + 1, N * 2 + 1)).reshape(2, -1).T - (N, N)

        # Find center cell qr (qr from xy)
        cq, cr = HexCell.int_qr_from_xy(xy[0], xy[1], side=side)

        # Displace cells by center cell
        q, r = qr[:, 0] + cq[0], -qr[:, 0] - qr[:, 1] + cr[0]

        # Find xy of cells
        x, y = HexCell.xy_from_qr(q, r, side)

        # Calc distance squared to cell center for each cell
        dx, dy = xy[0] - x, xy[1] - y
        d2 = dx * dx + dy * dy

        # Return cells within radius^2
        return np.array([x, y, d2, q, r]).T[d2 <= radius * radius]

    @staticmethod
    def cells_within_radius(xy_center, radius, side=1):
        """
        Get all cells within radius of xy_center

        Parameters:
            xy_center - center to search around
            radius - radius to search within
            side - hexagon side length[default: 1]
        Returns:
            cells - list of cells within radius of xy_center
        """
        # Defines index of right most possible selected cell
        cell_range = int(math.floor(radius / (1.5 * side)))
        cell_range_inner = int(math.floor(radius / (HexCell.SQRT3 * side)))
        cells = []
        cell_center = HexCell.from_xy(xy_center, side=side)
        radius2 = radius * radius
        for dx in range(-cell_range, cell_range + 1):
            for dy in range(max(-cell_range, -dx - cell_range),
                            min(cell_range, -dx + cell_range) + 1):
                cell = HexCell(dx, -dx - dy)
                if cell.distance() < cell_range_inner:
                    cell.index_q += cell_center.index_q
                    cell.index_r += cell_center.index_r
                    cells.append(cell)
                    continue
                cell.index_q += cell_center.index_q
                cell.index_r += cell_center.index_r
                cxy = cell.as_xy(side=side)
                cdx = cxy[0] - xy_center[0]
                cdy = cxy[1] - xy_center[1]
                if cdx * cdx + cdy * cdy <= radius2:
                    cells.append(cell)
        return cells

    def __str__(self):
        return "HexCell({}, {})".format(
            self.index_q, self.index_r)

    def __repr__(self):
        return str(self)

    def __hash__(self):
        return hash((self.index_q, self.index_r))

    def __eq__(self, other):
        return isinstance(other, self.__class__) and \
               self.index_q == other.index_q and \
               self.index_r == other.index_r

    def __ne__(self, other):
        return not self.__eq__(other)


class HexGrid(defaultdict):
    def __init__(self, type=None):
        super(HexGrid, self).__init__(type or list)

    def add(self, hex_cell):
        self[hex_cell].append(hex_cell.value)


def build_hex_index(source_df, hex_side, attr_map=None):
    """
    Build hex grid to xy coords
    :param source_df: pd.DataFrame
    :param hex_side: float
        side of hexagon
    :param attr_map: dict
        column mapping
    :return: pd.DataFrame
        dataframe with hex grid  columns [q,r]
    """
    attr_map = attr_map or {'x': 'x', 'y': 'y'}

    q, r = HexCell.qr_from_xy(x=source_df[attr_map['x']].values,
                              y=source_df[attr_map['y']].values, side=hex_side)
    qr = np.array(map(
        lambda qr: HexCell.qr_round(qr[0], qr[1]), zip(q, r)))

    source_df['q'] = qr[:, 0]
    source_df['r'] = qr[:, 1]
    return source_df


def build_xy_from_hex_index(source_df, hex_side, attr_map=None):
    """
    Build xy grid from hex qr index
    :param source_df: DataFrame
        [x,y]
    :param hex_side: float
        side of hexagon
    :param attr_map: dict
        column mapping
    :return: pd.DataFrame
        dataframe with columns [x,y]
    """
    attr_map = attr_map or {'q': 'q', 'r': 'r'}

    x, y = HexCell.xy_from_qr(q=source_df[attr_map['q']].values,
                              r=source_df[attr_map['r']].values, side=hex_side)

    source_df['x'] = x
    source_df['y'] = y
    return source_df
