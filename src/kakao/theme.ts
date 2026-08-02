/** Theme model.
 *
 * Color keys are the resource names a KakaoTalk theme APK declares in
 * res/values/colors.xml, so the exported file can be dropped straight into a
 * theme project. Anything not listed here simply keeps KakaoTalk's default.
 */

export interface ColorKey {
  /** Android resource name, used verbatim in colors.xml. */
  name: string;
  label: string;
}

export interface ColorGroup {
  id: string;
  label: string;
  keys: ColorKey[];
}

export const COLOR_GROUPS: ColorGroup[] = [
  {
    id: "general",
    label: "공통",
    keys: [
      { name: "thm_general_default_bg", label: "기본 배경" },
      { name: "thm_general_navigationbar_bg", label: "상단바 배경" },
      { name: "thm_general_navigationbar_title_color", label: "상단바 제목" },
      { name: "thm_general_navigationbar_icon_color", label: "상단바 아이콘" },
      { name: "thm_general_tabbar_bg", label: "탭바 배경" },
      { name: "thm_general_tabbar_selected_item_color", label: "선택된 탭" },
      { name: "thm_general_tabbar_unselected_item_color", label: "선택 안 된 탭" },
      { name: "thm_general_badge_bg", label: "뱃지 배경" },
      { name: "thm_general_badge_font_color", label: "뱃지 글자" },
    ],
  },
  {
    id: "list",
    label: "친구 · 채팅 목록",
    keys: [
      { name: "thm_general_list_item_title_font_color", label: "이름" },
      { name: "thm_general_list_item_description_font_color", label: "상태메시지 · 미리보기" },
      { name: "thm_general_list_divider_color", label: "구분선" },
      { name: "thm_general_searchbar_bg", label: "검색창 배경" },
      { name: "thm_general_searchbar_font_color", label: "검색창 글자" },
    ],
  },
  {
    id: "chatroom",
    label: "채팅방",
    keys: [
      { name: "thm_chatroom_bg", label: "채팅방 배경" },
      { name: "thm_chatroom_other_name_font_color", label: "상대 이름" },
      { name: "thm_chatroom_other_bubble_bg", label: "상대 말풍선" },
      { name: "thm_chatroom_other_font_color", label: "상대 글자" },
      { name: "thm_chatroom_me_bubble_bg", label: "내 말풍선" },
      { name: "thm_chatroom_me_font_color", label: "내 글자" },
      { name: "thm_chatroom_bubble_time_font_color", label: "시간" },
      { name: "thm_chatroom_unread_count_color", label: "읽지 않음 표시" },
      { name: "thm_chatroom_date_bg", label: "날짜 배경" },
      { name: "thm_chatroom_date_font_color", label: "날짜 글자" },
    ],
  },
  {
    id: "input",
    label: "입력창",
    keys: [
      { name: "thm_chatroom_edit_bar_bg", label: "입력 바 배경" },
      { name: "thm_chatroom_edittext_bg", label: "입력칸 배경" },
      { name: "thm_chatroom_edittext_font_color", label: "입력 글자" },
      { name: "thm_chatroom_edittext_hint_font_color", label: "입력 힌트" },
      { name: "thm_chatroom_send_button_font_color", label: "전송 버튼" },
    ],
  },
];

export const ALL_KEYS = COLOR_GROUPS.flatMap((g) => g.keys);

export type Colors = Record<string, string>;

export interface ThemeImage {
  /** data: URL, kept as uploaded so the export is byte-identical to the source. */
  dataUrl: string;
  /** Original file name, only shown in the UI. */
  fileName: string;
}

export interface KakaoTheme {
  name: string;
  author: string;
  colors: Colors;
  /** Full-screen background images, optional. Keyed by drawable resource name. */
  images: Partial<Record<BackgroundKey, ThemeImage>>;
}

export const BACKGROUNDS = [
  { key: "thm_general_default_bg_image", label: "전체 배경 이미지" },
  { key: "thm_chatroom_bg_image", label: "채팅방 배경 이미지" },
] as const;

export type BackgroundKey = (typeof BACKGROUNDS)[number]["key"];

export interface Preset {
  id: string;
  label: string;
  colors: Colors;
}

/** KakaoTalk's own light theme — also the starting point for a new theme. */
const BASIC: Colors = {
  thm_general_default_bg: "#ffffff",
  thm_general_navigationbar_bg: "#ffffff",
  thm_general_navigationbar_title_color: "#000000",
  thm_general_navigationbar_icon_color: "#000000",
  thm_general_tabbar_bg: "#ffffff",
  thm_general_tabbar_selected_item_color: "#000000",
  thm_general_tabbar_unselected_item_color: "#b6b6b6",
  thm_general_badge_bg: "#ff3b30",
  thm_general_badge_font_color: "#ffffff",
  thm_general_list_item_title_font_color: "#000000",
  thm_general_list_item_description_font_color: "#8c8c8c",
  thm_general_list_divider_color: "#ededed",
  thm_general_searchbar_bg: "#f1f1f1",
  thm_general_searchbar_font_color: "#8c8c8c",
  thm_chatroom_bg: "#b2c7d9",
  thm_chatroom_other_name_font_color: "#3d3d3d",
  thm_chatroom_other_bubble_bg: "#ffffff",
  thm_chatroom_other_font_color: "#000000",
  thm_chatroom_me_bubble_bg: "#fef01b",
  thm_chatroom_me_font_color: "#000000",
  thm_chatroom_bubble_time_font_color: "#5b5b5b",
  thm_chatroom_unread_count_color: "#e8a33d",
  thm_chatroom_date_bg: "#8a9daf",
  thm_chatroom_date_font_color: "#ffffff",
  thm_chatroom_edit_bar_bg: "#ffffff",
  thm_chatroom_edittext_bg: "#ffffff",
  thm_chatroom_edittext_font_color: "#000000",
  thm_chatroom_edittext_hint_font_color: "#b6b6b6",
  thm_chatroom_send_button_font_color: "#b6b6b6",
};

export const PRESETS: Preset[] = [
  { id: "basic", label: "카카오 기본", colors: BASIC },
  {
    id: "night",
    label: "다크",
    colors: {
      ...BASIC,
      thm_general_default_bg: "#1b1b1d",
      thm_general_navigationbar_bg: "#1b1b1d",
      thm_general_navigationbar_title_color: "#f2f2f2",
      thm_general_navigationbar_icon_color: "#f2f2f2",
      thm_general_tabbar_bg: "#1b1b1d",
      thm_general_tabbar_selected_item_color: "#fef01b",
      thm_general_tabbar_unselected_item_color: "#6b6b70",
      thm_general_list_item_title_font_color: "#f2f2f2",
      thm_general_list_item_description_font_color: "#8e8e93",
      thm_general_list_divider_color: "#2c2c2f",
      thm_general_searchbar_bg: "#2c2c2f",
      thm_general_searchbar_font_color: "#8e8e93",
      thm_chatroom_bg: "#121214",
      thm_chatroom_other_name_font_color: "#b8b8bd",
      thm_chatroom_other_bubble_bg: "#2c2c2f",
      thm_chatroom_other_font_color: "#f2f2f2",
      thm_chatroom_me_bubble_bg: "#fef01b",
      thm_chatroom_me_font_color: "#1b1b1d",
      thm_chatroom_bubble_time_font_color: "#7a7a80",
      thm_chatroom_date_bg: "#2c2c2f",
      thm_chatroom_date_font_color: "#b8b8bd",
      thm_chatroom_edit_bar_bg: "#1b1b1d",
      thm_chatroom_edittext_bg: "#2c2c2f",
      thm_chatroom_edittext_font_color: "#f2f2f2",
      thm_chatroom_edittext_hint_font_color: "#6b6b70",
      thm_chatroom_send_button_font_color: "#fef01b",
    },
  },
  {
    id: "peach",
    label: "피치",
    colors: {
      ...BASIC,
      thm_general_default_bg: "#fff6f2",
      thm_general_navigationbar_bg: "#fff6f2",
      thm_general_navigationbar_title_color: "#6b4438",
      thm_general_navigationbar_icon_color: "#6b4438",
      thm_general_tabbar_bg: "#fff6f2",
      thm_general_tabbar_selected_item_color: "#ff8a65",
      thm_general_tabbar_unselected_item_color: "#d9bdb2",
      thm_general_badge_bg: "#ff8a65",
      thm_general_list_item_title_font_color: "#6b4438",
      thm_general_list_item_description_font_color: "#b39288",
      thm_general_list_divider_color: "#f6e3dc",
      thm_general_searchbar_bg: "#fbe9e2",
      thm_general_searchbar_font_color: "#b39288",
      thm_chatroom_bg: "#fbe3d8",
      thm_chatroom_other_name_font_color: "#8a5a4a",
      thm_chatroom_other_bubble_bg: "#ffffff",
      thm_chatroom_other_font_color: "#4a3129",
      thm_chatroom_me_bubble_bg: "#ffb59b",
      thm_chatroom_me_font_color: "#4a3129",
      thm_chatroom_bubble_time_font_color: "#a68278",
      thm_chatroom_unread_count_color: "#ff7043",
      thm_chatroom_date_bg: "#e8c3b4",
      thm_chatroom_date_font_color: "#6b4438",
      thm_chatroom_edit_bar_bg: "#fff6f2",
      thm_chatroom_edittext_bg: "#fbe9e2",
      thm_chatroom_edittext_hint_font_color: "#c9a99f",
      thm_chatroom_send_button_font_color: "#ff8a65",
    },
  },
  {
    id: "forest",
    label: "포레스트",
    colors: {
      ...BASIC,
      thm_general_default_bg: "#f3f7f2",
      thm_general_navigationbar_bg: "#f3f7f2",
      thm_general_navigationbar_title_color: "#25402c",
      thm_general_navigationbar_icon_color: "#25402c",
      thm_general_tabbar_bg: "#f3f7f2",
      thm_general_tabbar_selected_item_color: "#3f7d4e",
      thm_general_tabbar_unselected_item_color: "#adbfae",
      thm_general_badge_bg: "#e0603f",
      thm_general_list_item_title_font_color: "#25402c",
      thm_general_list_item_description_font_color: "#7d947f",
      thm_general_list_divider_color: "#e0e9de",
      thm_general_searchbar_bg: "#e6efe4",
      thm_general_searchbar_font_color: "#7d947f",
      thm_chatroom_bg: "#dbe7d7",
      thm_chatroom_other_name_font_color: "#3c5a41",
      thm_chatroom_other_bubble_bg: "#ffffff",
      thm_chatroom_other_font_color: "#1f3325",
      thm_chatroom_me_bubble_bg: "#a8d5a2",
      thm_chatroom_me_font_color: "#1f3325",
      thm_chatroom_bubble_time_font_color: "#6f8871",
      thm_chatroom_unread_count_color: "#e0603f",
      thm_chatroom_date_bg: "#b6cbb2",
      thm_chatroom_date_font_color: "#25402c",
      thm_chatroom_edit_bar_bg: "#f3f7f2",
      thm_chatroom_edittext_bg: "#e6efe4",
      thm_chatroom_edittext_hint_font_color: "#a3b8a4",
      thm_chatroom_send_button_font_color: "#3f7d4e",
    },
  },
];

export function newTheme(): KakaoTheme {
  return { name: "내 테마", author: "", colors: { ...BASIC }, images: {} };
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Accepts anything the file/clipboard might hold and keeps only a usable theme. */
export function sanitize(value: unknown): KakaoTheme | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const rawColors = (typeof raw.colors === "object" && raw.colors !== null ? raw.colors : {}) as Record<string, unknown>;

  const colors: Colors = { ...BASIC };
  for (const { name } of ALL_KEYS) {
    const c = rawColors[name];
    if (typeof c === "string" && HEX.test(c)) colors[name] = c.toLowerCase();
  }

  const rawImages = (typeof raw.images === "object" && raw.images !== null ? raw.images : {}) as Record<string, unknown>;
  const images: KakaoTheme["images"] = {};
  for (const { key } of BACKGROUNDS) {
    const img = rawImages[key];
    if (typeof img !== "object" || img === null) continue;
    const { dataUrl, fileName } = img as Record<string, unknown>;
    if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
      images[key] = { dataUrl, fileName: typeof fileName === "string" ? fileName : "background" };
    }
  }

  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : "내 테마",
    author: typeof raw.author === "string" ? raw.author : "",
    colors,
    images,
  };
}
