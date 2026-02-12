# pylint: disable=logging-fstring-interpolation
# pylint: disable=attribute-defined-outside-init
from abc import ABC, abstractmethod
from typing import List, Optional, Union, Dict, Any
from datetime import datetime

import arcpy
import numpy as np

from .palog import LogUtils

LOGGER = LogUtils.setup_logger(__name__)
__all__ = ["GroupStatsCalcObj", "RegStatsObject", "ShpStatsObject"]


class GroupStatsCalcObj(ABC):

    def __init__(self, sois: List[str]):
        """Set the statistics of interests (soi).

        Args:
            sois (List): a list of string where each one represents a soi.
        """
        self.sois = sois
    
    def __repr__(self):
        """overwrite str method.

        Returns:
            str: concatenate sois with comma.
        """
        return ",".join(self.sois)

    @abstractmethod
    def reset(self):
        """Set the group statistics to initial values without updating the sois."""
        raise NotImplementedError

    @abstractmethod
    def get_stat(self, soi: str) -> Any:
        """Get the value based on the soi specified.

        Args:
            soi (str): name of the soi.

        Returns:
            Any: value of the soi.
        """
        raise NotImplementedError

    def get_all_sois(self) -> List:
        """Get the values of all sois in order.

        Returns:
            List: all the soi values.
        """
        result = []
        for soi in self.sois:
            result.append(self.get_stat(soi))
        return result

    @classmethod
    def get_string_val(cls, val: Any) -> str:
        """Stringify the value.

        Args:
            val (Any): value to get the string from.

        Returns:
            str: the formatted string.
        """
        if isinstance(val, datetime):
            val_str = val.isoformat()
            if val.microsecond != 0 and "." in val_str:
                return val_str[:-3]
            elif val.microsecond == 0 and "." in val_str:
                return val_str[:-7]
            return val_str
        else:
            return str(val)


class RegStatsObject(GroupStatsCalcObj):
    """StatsObject for regular stats calculation."""
    SUPPORT_STATS = ["min", "max", "sum", "mean", "std", "count",
                     "weightmean", "weightstd"]

    def __init__(self, sois: List):
        """Set the statistics of interests (soi).

        Args:
            sois (List): a list of string where each one represents a soi.
        """
        super(RegStatsObject, self).__init__(sois)

        self.store_vals = False
        self.store_weights = False
        self.validate_soi()
        self.reset()

    def reset(self):
        self.min = None
        self.max = None
        self.sum = None
        self.count = 0
        self.nn_count = 0  # count of not none value
        self.vals = []
        self.weights = []

        self.np_vals = None
        self.np_weights = None
        self.wavg = None
        self.wstd = None

    def validate_soi(self):
        """Check if the soi is valid.

        Raises:
            ValueError: if one of the sois is not supported.
        """
        for soi in self.sois:
            if soi not in self.SUPPORT_STATS:
                LOGGER.error(f"{soi} is currently not supported.")
                raise ValueError

            if soi in ["weightmean", "weightstd"]:
                self.store_vals = True
                self.store_weights = True
            elif soi == "std":
                self.store_vals = True

    def add_val(self, val: Any, weight: Optional[Union[int, float]] = None):
        """add the value/weight of the group.

        Args:
            val (Any): the value of the item.
            weight (Optional[Union[int, float]], optional): the associate weight
            of the value. It will be used for weightmean and weightstd calculation.
            Defaults to None.
        """
        self.count += 1
        if val is not None:
            self.nn_count += 1
            if isinstance(val, (int, float)):
                if self.sum is None:
                    self.sum = val
                else:
                    self.sum += val

            if self.min is None:
                self.min = val
            elif self.min > val:
                self.min = val

            if self.max is None:
                self.max = val
            elif self.max < val:
                self.max = val

        if self.store_vals and self.store_weights and val is not None and weight is not None:
            self.vals.append(val)
            self.weights.append(weight)
        elif self.store_vals and not self.store_weights and val is not None:
            self.vals.append(val)

    def get_stat(self, soi: str) -> Any:
        if soi == "min":
            return self.min
        elif soi == "max":
            return self.max
        elif soi == "count":
            return self.count
        elif soi == "sum":
            return self.sum
        elif soi == "mean":
            if self.nn_count == 0:
                return None
            if self.sum is None:
                return None
            return self.sum / self.nn_count
        elif soi == "std":
            if self.nn_count == 1:
                return 0
            elif self.vals:
                if self.np_vals is None:
                    self.np_vals = np.array(self.vals)
                return np.std(self.np_vals, ddof=1)
            return None
        elif soi == "weightmean":
            if self.vals and self.weights:
                if self.np_vals is None:
                    self.np_vals = np.array(self.vals)
                if self.np_weights is None:
                    self.np_weights = np.array(self.weights)
                self.wavg = np.sum(self.np_vals * self.np_weights) / np.sum(self.np_weights)
                return self.wavg
            return None
        elif soi == "weightstd":
            if self.vals and self.weights:
                if len(self.vals) == 1:
                    return 0
                if self.np_vals is None:
                    self.np_vals = np.array(self.vals)
                if self.np_weights is None:
                    self.np_weights = np.array(self.weights)
                if self.wavg is None:
                    self.wavg = np.sum(self.np_vals * self.np_weights) / np.sum(self.np_weights)
                size = self.np_weights.size
                numerator = np.sum(self.np_weights * (self.np_vals - self.wavg)**2)
                denominator = (((size - 1) / size) * np.sum(self.np_weights))
                return np.sqrt(numerator / denominator)
            return 0
        else:
            LOGGER.error(f"{soi} is not supported.")
            raise ValueError


class ShpStatsObject(GroupStatsCalcObj):
    """StatsObject for shape related statistics calculation."""

    SUPPORT_STATS = ["minpercent", "maxpercent", "minpercentval", "maxpercentval",
                     "count", "percentshape", "sum"]

    def __init__(self, sois: List, base_weight: Optional[Dict]):
        """Set the sois and other properties.

        Args:
            sois (List): a list of string where each one represents a soi.
            base_weight (Optional[Dict]): a dictionary keyed by the OID and valued
            by the weight base (i.e., total area of the bounding polygon, total
            line length within the bounding polygon, total count of points within).
        """
        super(ShpStatsObject, self).__init__(sois)
        self.base_weight = base_weight
        self.minmaj = False  # minority/majority calculation needed
        self.reset()
        self.calc_ps = False  # sois contain percentshape
        for soi in self.sois:
            if soi.startswith("min") or soi.startswith("max"):
                self.minmaj = True
            if soi == "percentshape":
                self.calc_ps = True

    def reset(self):
        self.min_val = ""
        self.max_val = ""
        self.min_perc = 0.0
        self.max_perc = 0.0
        self.curr_val = None
        self.curr_perc = 0.0
        self.tot = 0.0
        self.count = 0

        self.perc_shp = 0.0

    def add_val(self, gval: Union[int, float],
                grp_val: Any,
                bid: Optional[int] = None):
        """add the value/weight of the group.

        Args:
            gval (Union[int, float]): the geometry value (i.e., shape area/length).
            grp_val (Any): value of the subgroup within the boundary.
            bid (Optional[int], optional): ID of the boundary which will be used to
            access the base weight. Defaults to None.
        """
        grp_str = self.get_string_val(grp_val) if grp_val else ""

        if bid and self.base_weight:
            base_weight = self.base_weight.get(bid)
            if base_weight and gval is not None:
                gval /= base_weight
            elif not gval:
                LOGGER.debug(f"invalid gval: {gval}")

        if gval:
            self.tot += gval
        self.count += 1

        if not self.minmaj and self.calc_ps:
            if self.curr_val is None or self.curr_val != grp_str:
                self.curr_val = grp_str
                self.perc_shp = gval
            else:
                self.perc_shp += gval
        elif self.minmaj:
            if self.curr_val is None:
                (self.min_val, self.max_val, self.curr_val) = (grp_str, grp_str, grp_str)
                (self.curr_perc, self.min_perc, self.max_perc) = (gval, gval, gval)
            elif self.curr_val == grp_str:
                self.curr_perc += gval
                if self.curr_val == self.min_val:
                    self.min_perc = self.curr_perc

                if self.curr_val == self.max_val:
                    self.max_perc = self.curr_perc
            else:
                if self.curr_perc < self.min_perc:
                    self.min_perc = self.curr_perc
                    self.min_val = self.curr_val
                elif self.curr_perc == self.min_perc:
                    if self.curr_val not in self.min_val:
                        self.min_val += f";{self.curr_val}"  # type: ignore

                if self.curr_perc > self.max_perc:
                    self.max_perc = self.curr_perc
                    self.max_val = self.curr_val
                elif self.curr_perc == self.max_perc:
                    if self.curr_val not in self.max_val:
                        self.max_val += f";{self.curr_val}"  # type: ignore

                self.curr_perc = gval
                self.curr_val = grp_str

    def get_stat(self, soi: str) -> Any:
        if soi == "minpercent":
            # deal with the last group value
            if self.min_perc > self.curr_perc:
                self.min_perc = self.curr_perc
                self.min_val = self.curr_val

            if not self.base_weight:
                return (self.min_perc / self.tot) * 100.0
            else:
                return self.min_perc * 100.0

        elif soi == "maxpercent":
            # deal with the last group value
            if self.max_perc < self.curr_perc:
                self.max_perc = self.curr_perc
                self.max_val = self.curr_val

            if not self.base_weight:
                return (self.max_perc / self.tot) * 100.0
            else:
                return self.max_perc * 100.0

        elif soi == "minpercentval":
            if self.min_perc < self.curr_perc:
                return self.min_val
            elif self.min_perc > self.curr_perc:
                return self.curr_val
            else:
                if (
                    isinstance(self.min_val, str)
                    and isinstance(self.curr_val, str)
                    and self.curr_val not in self.min_val
                ):
                    self.min_val += f";{self.curr_val}"
                return self.min_val

        elif soi == "maxpercentval":
            if self.max_perc > self.curr_perc:
                return self.max_val
            elif self.max_perc < self.curr_perc:
                return self.curr_val
            else:
                if (
                    isinstance(self.max_val, str)
                    and isinstance(self.curr_val, str)
                    and self.curr_val not in self.max_val
                ):
                    self.max_val += f";{self.curr_val}"
                return self.max_val

        elif soi == "count":
            return self.count

        elif soi == "percentshape":
            return self.perc_shp * 100.0

        elif soi == "sum":
            return self.tot

        else:
            LOGGER.error(f"{soi} is not supported.")
            raise ValueError
