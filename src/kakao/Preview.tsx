import { ChevronLeft, Menu, MessageSquare, Plus, Search, Send, Smile, User, Users } from "lucide-react";
import type { KakaoTheme } from "./theme";

interface Props {
  theme: KakaoTheme;
  screen: "chatroom" | "friends";
}

const FRIENDS = [
  { name: "김민준", status: "오늘도 화이팅" },
  { name: "이서연", status: "🌿" },
  { name: "박도윤", status: "" },
  { name: "최하은", status: "여행 중" },
];

export function Preview({ theme, screen }: Props) {
  const c = (key: string) => theme.colors[key];

  const navBar = (title: string) => (
    <div
      className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-[15px] font-semibold"
      style={{ background: c("thm_general_navigationbar_bg"), color: c("thm_general_navigationbar_title_color") }}
    >
      {screen === "chatroom" && (
        <ChevronLeft size={20} strokeWidth={2.2} style={{ color: c("thm_general_navigationbar_icon_color") }} />
      )}
      <span className="flex-1 truncate">{title}</span>
      <Search size={18} style={{ color: c("thm_general_navigationbar_icon_color") }} />
      <Menu size={18} style={{ color: c("thm_general_navigationbar_icon_color") }} />
    </div>
  );

  const tabBar = (
    <div
      className="flex shrink-0 items-center justify-around py-2.5"
      style={{ background: c("thm_general_tabbar_bg") }}
    >
      {[User, MessageSquare, Users].map((Icon, i) => (
        <div key={i} className="relative">
          <Icon
            size={20}
            style={{
              color:
                (i === 0 && screen === "friends") || (i === 1 && screen === "chatroom")
                  ? c("thm_general_tabbar_selected_item_color")
                  : c("thm_general_tabbar_unselected_item_color"),
            }}
          />
          {i === 1 && (
            <span
              className="absolute -top-1.5 -right-2 rounded-full px-1.5 text-[10px] leading-4 font-bold"
              style={{ background: c("thm_general_badge_bg"), color: c("thm_general_badge_font_color") }}
            >
              3
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[28px] border-[7px] border-neutral-800 bg-neutral-800 shadow-2xl">
      <div className="flex h-[560px] flex-col">
        {screen === "chatroom" ? (
          <>
            {navBar("이서연")}
            <ChatRoom theme={theme} />
          </>
        ) : (
          <>
            {navBar("친구")}
            <FriendList theme={theme} />
          </>
        )}
        {tabBar}
      </div>
    </div>
  );
}

function ChatRoom({ theme }: { theme: KakaoTheme }) {
  const c = (key: string) => theme.colors[key];
  const bg = theme.images.thm_chatroom_bg_image;

  return (
    <>
      <div
        className="flex-1 space-y-3 overflow-hidden bg-cover bg-center p-3"
        style={{
          background: c("thm_chatroom_bg"),
          ...(bg ? { backgroundImage: `url(${bg.dataUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
        }}
      >
        <div className="flex justify-center">
          <span
            className="rounded-full px-3 py-1 text-[11px]"
            style={{ background: c("thm_chatroom_date_bg"), color: c("thm_chatroom_date_font_color") }}
          >
            2026년 8월 2일 일요일
          </span>
        </div>

        <div className="flex gap-2">
          <div
            className="mt-4 size-8 shrink-0 rounded-2xl"
            style={{ background: c("thm_chatroom_other_bubble_bg") }}
          />
          <div className="min-w-0">
            <div className="mb-1 text-[11px]" style={{ color: c("thm_chatroom_other_name_font_color") }}>
              이서연
            </div>
            <div className="flex items-end gap-1">
              <div
                className="max-w-[170px] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug"
                style={{ background: c("thm_chatroom_other_bubble_bg"), color: c("thm_chatroom_other_font_color") }}
              >
                테마 색 바꿔봤어 어때?
              </div>
              <span className="text-[10px] whitespace-nowrap" style={{ color: c("thm_chatroom_bubble_time_font_color") }}>
                오후 2:14
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-end gap-1">
          <div className="text-right text-[10px] leading-tight">
            <div style={{ color: c("thm_chatroom_unread_count_color") }}>1</div>
            <div style={{ color: c("thm_chatroom_bubble_time_font_color") }}>오후 2:15</div>
          </div>
          <div
            className="max-w-[170px] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug"
            style={{ background: c("thm_chatroom_me_bubble_bg"), color: c("thm_chatroom_me_font_color") }}
          >
            훨씬 낫다 이걸로 하자
          </div>
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-2 px-2.5 py-2"
        style={{ background: c("thm_chatroom_edit_bar_bg") }}
      >
        <Plus size={18} style={{ color: c("thm_chatroom_edittext_hint_font_color") }} />
        <div
          className="flex flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-[12px]"
          style={{ background: c("thm_chatroom_edittext_bg"), color: c("thm_chatroom_edittext_hint_font_color") }}
        >
          <span className="flex-1">메시지 입력</span>
          <Smile size={15} />
        </div>
        <Send size={17} style={{ color: c("thm_chatroom_send_button_font_color") }} />
      </div>
    </>
  );
}

function FriendList({ theme }: { theme: KakaoTheme }) {
  const c = (key: string) => theme.colors[key];
  const bg = theme.images.thm_general_default_bg_image;

  return (
    <div
      className="flex-1 overflow-hidden px-3 pt-2"
      style={{
        background: c("thm_general_default_bg"),
        ...(bg ? { backgroundImage: `url(${bg.dataUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
      }}
    >
      <div
        className="mb-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px]"
        style={{ background: c("thm_general_searchbar_bg"), color: c("thm_general_searchbar_font_color") }}
      >
        <Search size={14} />
        <span>이름 검색</span>
      </div>

      {FRIENDS.map((friend, i) => (
        <div key={friend.name}>
          {i > 0 && <div className="h-px" style={{ background: c("thm_general_list_divider_color") }} />}
          <div className="flex items-center gap-2.5 py-2">
            <div
              className="size-9 shrink-0 rounded-2xl"
              style={{ background: c("thm_general_list_divider_color") }}
            />
            <div className="min-w-0">
              <div className="truncate text-[13px]" style={{ color: c("thm_general_list_item_title_font_color") }}>
                {friend.name}
              </div>
              {friend.status && (
                <div
                  className="truncate text-[11px]"
                  style={{ color: c("thm_general_list_item_description_font_color") }}
                >
                  {friend.status}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
