import pytest

from color_rules import SKIN_TONE_MAP, get_color_recommendations

KEYS = ("name", "label", "group", "recommended_colors", "shirt_colors", "pant_colors", "shoe_colors")


@pytest.mark.parametrize("hex_code", list(SKIN_TONE_MAP))
def test_exact_match_each_tone(hex_code):
    rec = get_color_recommendations(hex_code)
    assert rec is SKIN_TONE_MAP[hex_code]
    for k in KEYS:
        assert rec[k]


def test_all_groups_present():
    groups = {v["group"] for v in SKIN_TONE_MAP.values()}
    assert groups == {"deep", "medium_dark", "medium", "fair", "very_fair"}


@pytest.mark.parametrize(
    "query,expected",
    [("#000000", "#422811"), ("#FFFFFF", "#FBF2F3"), ("#80654F", "#81654F"), ("bea07f", "#BEA07E")],
)
def test_nearest_match(query, expected):
    assert get_color_recommendations(query) is SKIN_TONE_MAP[expected]
