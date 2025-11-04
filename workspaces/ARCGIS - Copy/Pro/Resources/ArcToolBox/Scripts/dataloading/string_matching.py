import functools
from typing import Collection, Iterable, Optional

import numpy as np
import pandas as pd

from ._ratio import *

# Cached translation table
TRANSLATE = {ord(x): ord(" ") for x in r"/\-_"}


def get_ratio(a: str, b: str) -> float:
    if a == b:
        return 100

    # a or b ends with a quote character, signifying units such as inches and feet.
    # This is marginally faster than using str.endswith(<tuple>)
    if a[-1] in {"'", '"'} or b[-1] in {"'", '"'}:
        return 0

    r = ratio(a, b)

    # Give a higher weight to substring matches.
    substring = in_ratio(a, b)
    if substring:
        r = (r + substring) / 2
    else:
        sub_score = max(split_ratio(a, b), split_ratio(b, a))
        if sub_score > r:  # comparing substrings should never lower score
            r = (r + sub_score) / 2

    return r * 100


def _is_exact_word_match(a: list[str], b: list[str], t0: list[str], t1: list[str]):
    return (set(t0) == set(a) and set(t1) == set(b)) or (set(t1) == set(a) and set(t0) == set(b))


def _is_in_word(a: str, b: str, t0: list[str], t1: list[str]):
    return (all(x in a for x in t0) and all(x in b for x in t1)) or (
        all(x in a for x in t1) and all(x in b for x in t0)
    )


def in_check(a: str, b: str, terms: list[tuple[list[str]]], block: list[tuple[list[str]]]) -> int:
    """Check if the words in terms, block list are present in a and b. Get score with block list taking precedence.
    0 = no match found to terms or block
    100 = terms words found in a and b are best match
    255 = block words found in a and b are best match (used to zero out difflib matches)
    """
    a_split = _lower_and_split(a)
    b_split = _lower_and_split(b)

    score = 0
    # check positive first
    for t0, t1 in terms:
        if _is_exact_word_match(a_split, b_split, t0, t1):
            score = 101
            break
        elif _is_in_word(a, b, t0, t1):
            score = 101 if a == b else 100

    # now check negatives which take precedence
    for t0, t1 in block:
        if _is_exact_word_match(a_split, b_split, t0, t1):
            return 255
        elif _is_in_word(a, b, t0, t1):
            if score < 101:
                return 255

    return score


def _lower_and_split(x: str) -> list[str]:
    """Lowercase x and split on space"""
    return x.casefold().split(" ")


def _replace_and_split(x: str) -> list[str]:
    """Replace 'junk characters' with spaces and split on space"""
    return x.translate(TRANSLATE).split(" ")


def _lower_and_replace(x: str) -> str:
    """Lowercase x and replace 'junk characters' with spaces"""
    return x.casefold().translate(TRANSLATE)


def _build_matrix(func, index_values, column_values) -> pd.DataFrame:
    """construct score matrix using specific function for each cell calculation"""
    import itertools

    shape = len(index_values), len(column_values)
    arr = np.fromiter(
        itertools.starmap(
            func, itertools.product(map(_lower_and_replace, index_values), map(_lower_and_replace, column_values))
        ),
        dtype=np.uint8,
        count=shape[0] * shape[1],
    )
    return pd.DataFrame(arr.reshape(shape), index=index_values, columns=column_values)


def _create_score_matrix(
    index_values: Collection[str],
    column_values: Collection[str],
    cutoff: float = None,
) -> pd.DataFrame:
    """create matrix by string similarity"""

    df = _build_matrix(get_ratio, index_values, column_values)
    if cutoff:
        df[df < cutoff] = 0

    return df


def _create_lookup_matrix(
    index_values: Collection[str],
    column_values: Collection[str],
    lookup: Iterable[tuple[str, str]] = None,
    block: Iterable[tuple[str, str]] = None,
    lookup_exact: Iterable[tuple[str, str]] = None,
    block_exact: Iterable[tuple[str, str]] = None,
) -> pd.DataFrame:
    """create matrix by using lookups"""
    if lookup or block:
        _lookup = [tuple(map(_replace_and_split, x)) for x in lookup] if lookup else []
        _block = [tuple(map(_replace_and_split, x)) for x in block] if block else []
        f = functools.partial(in_check, terms=_lookup, block=_block)
        df = _build_matrix(f, index_values, column_values)

    if lookup_exact or block_exact:
        # create zero filled dataframe
        df_exact = pd.DataFrame(
            0, index=list(map(str.casefold, index_values)), columns=list(map(str.casefold, column_values))
        )
        # negatives take precedence
        _add_exact_scores(df_exact, lookup_exact, 101)
        _add_exact_scores(df_exact, block_exact, 255)
        df_exact.index = index_values
        df_exact.columns = column_values
        if lookup or block:
            df.mask(cond=(df_exact == 101), other=df_exact, inplace=True)
            df.mask(cond=(df_exact == 255), other=df_exact, inplace=True)
            return df
        return df_exact

    return df


def _add_exact_scores(df: pd.DataFrame, lookup: Optional[Iterable], value: int):
    """use lookup to set values of certain cells"""
    if not lookup:
        return
    index, columns = set(df.index), set(df.columns)

    for a, b in lookup:
        if a in index and b in columns:
            df.at[a, b] = value
        if b in index and a in columns:
            df.at[b, a] = value


def create_score_matrix(
    index_values: Collection[str],
    column_values: Collection[str],
    string_match: bool = True,
    cutoff: float = None,
    lookup: Iterable[tuple[str, str]] = None,
    block: Iterable[tuple[str, str]] = None,
    lookup_exact: Iterable[tuple[str, str]] = None,
    block_exact: Iterable[tuple[str, str]] = None,
) -> pd.DataFrame:
    """Creates an M x N DataFrame of the string similarities between index_values and column_values. Each cell in the
    Dataframe will have a score calculated based on the index/column pair. String similarity is calculated first if
    set to True, then lookup will be used to find matches, and finally block will be used to block certain matches.

    Args:
        index_values (Collection): A collection of strings that will form the rows (axis 0).
        column_values (Collection): A collection of strings that will form the columns (axis 1).
        string_match (bool): Find string similarity between index/column pairs.
        cutoff (float): Scores under this value will be replaced with zero. 0 < cutoff < 100
        lookup (Iterable): A collection of string tuples. Instead of matching index/column pairs,
            this uses phrases for matching. For example ("red", "blue") lookup will cause the dissimilar strings
            "Redlands" and "Blue Bell" to match. A match sets the score to 100. If an exact match occurs like if the
            lookup were ("redlands", "blue bell"), the score is set to 101, or the highest possible score.
        block (Iterable): A collection of string tuples used to block certain index/column pairs from matching. For
            example ("one", "dog") will prevent the similar strings "Dog" and "Doggone" from matching. If a block
            is found the score is set to 0 and block takes precedence over lookup.
        lookup_exact (Iterable): A collection of string tuples. Instead of matching index/column pairs, this uses exact
            strings for matching two candidates. For example ("redlands", "blue bell") lookup will cause the dissimilar
            strings "Redlands" and "Blue Bell" to match. The score is set to 101, or the highest possible score. Only
            exact matches are used.
        block_exact (Iterable): A collection of string tuples used to block certain index/column pairs from matching.
            Only exact matches to the two candidate strings will block a match. For example ("dogone", "dog") will
            prevent the similar strings "Dog" and "Doggone" from matching. If a block is found the score is set to 0
            and block takes precedence over lookup.


    Examples:
        >>> index = ['redlands', 'dog']
        >>> columns = ['hello', 'doggone', 'blue bell']
        >>> force = [('red', 'blue')]
        >>> prevent = [('one', 'dog')]
        >>> create_score_matrix(index, columns)
                  hello  doggone  blue bell
        redlands     30       26         28
        dog          25       60          0
        >>> create_score_matrix(index, columns, lookup=force)
                  hello  doggone  blue bell
        redlands     30       26        100
        dog          25       60          0
        >>> create_score_matrix(index, columns, lookup=force, string_match=False)
                  hello  doggone  blue bell
        redlands      0        0        100
        dog           0        0          0
        >>> create_score_matrix(index, columns, lookup=force, block=prevent)
                  hello  doggone  blue bell
        redlands     30       26        100
        dog          25        0          0
        >>> create_score_matrix(index, columns, lookup=force, block=prevent, string_match=False)
                  hello  doggone  blue bell
        redlands      0        0        100
        dog           0        0          0
        >>> prevent = [('redlands', 'blue bell')]
        >>> create_score_matrix(index, columns, lookup=force, block=prevent, string_match=False)
                  hello  doggone  blue bell
        redlands      0        0          0
        dog           0        0          0

    Returns:
        DataFrame of type uint8
    """

    main = pd.DataFrame()

    if string_match:
        main = _create_score_matrix(index_values=index_values, column_values=column_values, cutoff=cutoff)

    if lookup or block or lookup_exact or block_exact:
        override = _create_lookup_matrix(
            index_values=index_values,
            column_values=column_values,
            lookup=lookup,
            block=block,
            lookup_exact=lookup_exact,
            block_exact=block_exact,
        )
        if string_match:
            # replace values in string matching dataframe (main) with results from override.
            main.mask(cond=(override == 255), other=0, inplace=True)
            main.mask(cond=((override == 100) | (override == 101)), other=override, inplace=True)
        else:
            # Return override if only lookup provided. Set any 255 flags back to 0.
            override.replace(255, 0, inplace=True)
            return override

    return main
