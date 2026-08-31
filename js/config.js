/* ============================================================
   config.js — 방명록 백엔드 설정
   ------------------------------------------------------------
   Supabase 프로젝트를 만들고 아래 두 값만 채우면 방명록이 켜집니다.
   비워두면 "로컬 모드"로 동작합니다(내 브라우저에만 저장).

   Supabase 대시보드 → Project Settings → API 에서
     Project URL      → SUPABASE_URL
     anon public key  → SUPABASE_ANON_KEY

   그리고 SQL Editor 에서 아래를 한 번 실행하세요.
   (README 에도 같은 내용이 있습니다)

     create table guestbook (
       id         bigint generated always as identity primary key,
       name       text not null check (char_length(name) between 1 and 12),
       message    text not null check (char_length(message) between 1 and 200),
       created_at timestamptz not null default now()
     );
     alter table guestbook enable row level security;
     create policy "read"   on guestbook for select using (true);
     create policy "insert" on guestbook for insert with check (true);
   ============================================================ */
window.SPIDEY_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  TABLE: 'guestbook',
  POLL_MS: 6000
};
