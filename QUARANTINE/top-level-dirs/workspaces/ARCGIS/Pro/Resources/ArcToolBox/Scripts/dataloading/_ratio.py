__all__ = ["ratio", "split_ratio", "in_ratio"]


from difflib import SequenceMatcher


def ratio(a, b):
    return SequenceMatcher(a=a, b=b, autojunk=False).ratio()


def split_ratio(a: str, b: str) -> float:
    if " " not in b:
        return 0
    return max(ratio(a, x) for x in b.split(" "))


def in_ratio(a: str, b: str) -> bool:
    # A longer string can't be a substring of a shorter one, so we flip so a is always the shortest.
    x, y = len(a), len(b)
    if x > y:
        a, b = b, a
        x, y = y, x

    # returning True if "a in b" gives matches for words that don't necessarily make sense.
    # For example:
    # station | wSamplingStation is 44% overlap
    # low | blowoff valve is 23% overlap
    # Requiring a to be at least half of b helps with this.
    return a in b and x / y > 0.5
