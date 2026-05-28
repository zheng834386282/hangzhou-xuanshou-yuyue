/**
 * 数据存储层 - C/B 端共享 localStorage
 * 数据模型：activity / sessions / bookings / currentUser
 */

const KEYS = {
  ACTIVITY: 'qy_activity',
  SESSIONS: 'qy_sessions',
  BOOKINGS: 'qy_bookings',
  CURRENT_USER: 'qy_current_user',
  INITED: 'qy_inited_v4'
};

// 旧版本数据键，初始化时清理
const LEGACY_KEYS = ['qy_inited_v1', 'qy_inited_v2', 'qy_inited_v3'];

// ---------- 工具 ----------
const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// 生成预约 ID（用作核销凭证）
const genBookingId = () => {
  // 简短可读：8 位大写字母数字（去除易混淆字符），前缀方便业务识别
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `BK${s}`;
};

// 取预约 ID 的"短展示"：去掉前缀，便于工作人员录入
export const shortBookingId = (id) =>
  String(id || '').replace(/^bk_/i, '').replace(/^BK/, '').toUpperCase();

// 兼容旧 ID（之前是 bk_xxxx 格式）的展示
export const formatBookingDisplayId = (id) => {
  const s = shortBookingId(id);
  return s ? `#${s}` : '—';
};

// 日期格式
export const fmtDate = (d) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const fmtDateCN = (dateStr) => {
  const d = new Date(dateStr);
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
};
export const isPast = (dateStr, timeStr) => {
  const target = new Date(`${dateStr}T${timeStr || '23:59'}:00`);
  return target.getTime() < Date.now();
};

// ---------- 游戏类型配置 ----------
export const GAMES = {
  jcc: {
    key: 'jcc',
    name: '金铲铲之战',
    short: '金铲铲',
    icon: '⚔️',
    // 主色 + 辅色（用于日期卡背景渐变 / 场次徽标）
    color1: '#FFB94A',
    color2: '#E07A2C',
    accent: '#FFD66B'
  },
  tft: {
    key: 'tft',
    name: '云顶之弈',
    short: '云顶',
    icon: '♟️',
    color1: '#7BA8E8',
    color2: '#5B6FCF',
    accent: '#A8C0F0'
  }
};
export const getGame = (key) => GAMES[key] || GAMES.jcc;

// ---------- 占位选手池 ----------
const CHALLENGER_POOL = [
  { name: '红莲', avatar: '🔥' },
  { name: '白起', avatar: '⚡' },
  { name: '狐妖', avatar: '🦊' },
  { name: '墨竹', avatar: '🎋' },
  { name: '星河', avatar: '✨' },
  { name: '玄夜', avatar: '🌙' },
  { name: '青龙', avatar: '🐲' },
  { name: '朱雀', avatar: '🦅' }
];
export const getChallengerPool = () => CHALLENGER_POOL;

// ---------- Mock 游戏登录态 ----------
const MOCK_ACCOUNTS = [
  {
    openid: 'oQy_xiaoyu_7521',
    nickname: '棋小遇',
    tag: '#7521',
    avatar: '🐲',
    server: '艾欧尼亚',
    level: 178,
    rank: '钻石 II',
    summonerId: 'SU_98765001'
  },
  {
    openid: 'oQy_panda_3340',
    nickname: '熊猫吃铲铲',
    tag: '#3340',
    avatar: '🐼',
    server: '黑色玫瑰',
    level: 256,
    rank: '大师',
    summonerId: 'SU_98765002'
  },
  {
    openid: 'oQy_jiuwei_8866',
    nickname: '九尾狐召唤师',
    tag: '#8866',
    avatar: '🦊',
    server: '德玛西亚',
    level: 92,
    rank: '黄金 I',
    summonerId: 'SU_98765003'
  }
];

export const getMockAccounts = () => MOCK_ACCOUNTS;

// ---------- 初始化 ----------
function seed() {
  if (read(KEYS.INITED)) return;

  // 清理旧版本残留数据
  LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
  Object.values(KEYS).forEach(k => { if (k !== KEYS.INITED) localStorage.removeItem(k); });

  const activity = {
    id: 'act_qiyu_summer',
    title: '杭州棋遇·夏季赛线下选手挑战赛',
    subtitle: '金铲铲之战 / 云顶之弈 双游戏交替',
    cover: '',
    location: '杭州市西湖区·棋遇电竞馆 3F',
    address: '浙江省杭州市西湖区文三路 478 号',
    duration: '每场 90 分钟',
    description:
      '召唤师集结！棋遇夏季赛线下选手挑战赛邀你来场对战！每天围绕一款游戏开战（今天金铲铲之战，明天云顶之弈），完成挑战可获得限定胖胖龙周边、夏季赛专属皮肤兑换码。请按预约时间提前 15 分钟到场签到。',
    rules: [
      '每位玩家每场仅可预约一位（人数固定 1 人）',
      '请按时到场，迟到 15 分钟视为放弃',
      '请凭预约 ID 现场签到',
      '每天围绕一款游戏开战，预约前请确认游戏类型'
    ]
  };

  // 生成未来 14 天的场次（每天 4 个时段，按日交替游戏，每场配选手）
  const sessions = [];
  const slots = [
    { start: '10:00', end: '11:30', cap: 8 },
    { start: '14:00', end: '15:30', cap: 12 },
    { start: '16:00', end: '17:30', cap: 12 },
    { start: '19:00', end: '20:30', cap: 10 }
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dayIndex = 0; // 用于按日交替游戏
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 1) continue; // 周一闭馆
    // 按"今天一个游戏明天另一个"
    const gameKey = dayIndex % 2 === 0 ? 'jcc' : 'tft';
    dayIndex++;

    slots.forEach((s, slotIdx) => {
      const challenger = CHALLENGER_POOL[(i + slotIdx) % CHALLENGER_POOL.length];
      sessions.push({
        id: uid('sess'),
        date: fmtDate(d),
        startTime: s.start,
        endTime: s.end,
        capacity: s.cap,
        booked: Math.floor(Math.random() * (s.cap + 2)),
        status: 'open',
        game: gameKey,
        challenger: { name: challenger.name, avatar: challenger.avatar }
      });
    });
  }
  sessions.forEach((s) => { s.booked = Math.min(s.booked, s.capacity); });

  // mock 预约（仅含登录态信息，不含 name/phone/code）
  const bookings = [];
  const sampleAccounts = [MOCK_ACCOUNTS[1], MOCK_ACCOUNTS[2], MOCK_ACCOUNTS[1], MOCK_ACCOUNTS[0]];
  for (let i = 0; i < sampleAccounts.length; i++) {
    const sess = sessions[Math.floor(Math.random() * 6) + 4];
    if (!sess) continue;
    const acc = sampleAccounts[i];
    bookings.push({
      id: genBookingId(),
      sessionId: sess.id,
      openid: acc.openid,
      gameAccount: {
        nickname: acc.nickname,
        tag: acc.tag,
        avatar: acc.avatar,
        server: acc.server,
        rank: acc.rank
      },
      status: 'pending',
      createdAt: Date.now() - i * 3600_000
    });
  }

  // 默认登录态
  write(KEYS.CURRENT_USER, MOCK_ACCOUNTS[0]);

  write(KEYS.ACTIVITY, activity);
  write(KEYS.SESSIONS, sessions);
  write(KEYS.BOOKINGS, bookings);
  write(KEYS.INITED, true);
}

// ---------- 公开 API ----------
export function initStore() {
  seed();
}

export function resetStore() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  seed();
}

// 活动
export const getActivity = () => read(KEYS.ACTIVITY, null);
export const setActivity = (a) => write(KEYS.ACTIVITY, a);

// 场次
export const getSessions = () => read(KEYS.SESSIONS, []);
export const setSessions = (s) => write(KEYS.SESSIONS, s);
export const addSession = (s) => {
  const list = getSessions();
  list.push({
    id: uid('sess'),
    booked: 0,
    status: 'open',
    game: 'jcc',
    challenger: null,
    ...s
  });
  setSessions(list);
};
export const updateSession = (id, patch) => {
  const list = getSessions().map((s) => (s.id === id ? { ...s, ...patch } : s));
  setSessions(list);
};
export const deleteSession = (id) => {
  setSessions(getSessions().filter((s) => s.id !== id));
};
export const batchAddSessions = ({ startDate, endDate, slots, weekdays, skipMonday }) => {
  const list = getSessions();
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (skipMonday && wd === 1) continue;
    if (weekdays && weekdays.length && !weekdays.includes(wd)) continue;
    slots.forEach((s) => {
      list.push({
        id: uid('sess'),
        date: fmtDate(d),
        startTime: s.start,
        endTime: s.end,
        capacity: Number(s.cap),
        booked: 0,
        status: 'open',
        game: s.game || 'jcc',
        challenger: s.challengerName
          ? { name: s.challengerName, avatar: s.challengerAvatar || '🎮' }
          : null
      });
      count++;
    });
  }
  setSessions(list);
  return count;
};

export const getSessionsByDate = (dateStr) =>
  getSessions().filter((s) => s.date === dateStr);
export const getSessionById = (id) => getSessions().find((s) => s.id === id);

// 获取某天的"主流游戏"（用于日期卡着色）：取该日期场次中数量最多的游戏
export const getPrimaryGameOfDate = (dateStr) => {
  const list = getSessionsByDate(dateStr);
  if (!list.length) return null;
  const cnt = {};
  list.forEach(s => { cnt[s.game || 'jcc'] = (cnt[s.game || 'jcc'] || 0) + 1; });
  return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
};

// 预约
export const getBookings = () => read(KEYS.BOOKINGS, []);
export const setBookings = (list) => write(KEYS.BOOKINGS, list);
export const getBookingsBySession = (sessionId) =>
  getBookings().filter((b) => b.sessionId === sessionId);

export const getBookingsByOpenid = (openid) =>
  getBookings()
    .filter((b) => b.openid === openid)
    .sort((a, b) => b.createdAt - a.createdAt);

export const createBooking = ({ sessionId, openid, gameAccount }) => {
  const sess = getSessionById(sessionId);
  if (!sess) throw new Error('场次不存在');
  if (sess.booked + 1 > sess.capacity) throw new Error('该场次余位不足');

  const booking = {
    id: genBookingId(),
    sessionId,
    openid: openid || null,
    gameAccount: gameAccount || null,
    status: 'pending',
    createdAt: Date.now()
  };
  const list = getBookings();
  list.push(booking);
  setBookings(list);
  updateSession(sessionId, { booked: sess.booked + 1 });
  return booking;
};

// 用预约 ID 核销（支持模糊匹配：去前缀、忽略大小写、忽略 # 和空格）
export const checkInBooking = (idOrShort) => {
  const norm = (s) => String(s || '').trim().replace(/^#/, '').replace(/\s/g, '').toUpperCase();
  const target = norm(idOrShort);
  if (!target) return { ok: false, msg: '请输入预约 ID' };

  const list = getBookings();
  const bk = list.find((b) => {
    const id = String(b.id || '').toUpperCase();
    if (id === target) return true;
    // 兼容用户输入"短码"（去掉 BK 前缀）
    if (id.replace(/^BK/, '') === target.replace(/^BK/, '')) return true;
    // 兼容旧 ID 格式 bk_xxx
    if (id.replace(/^BK_/, '') === target) return true;
    return false;
  });

  if (!bk) return { ok: false, msg: '未找到该预约 ID，请核对后重试' };
  if (bk.status === 'checked') return { ok: false, msg: '该预约已核销', booking: bk };
  bk.status = 'checked';
  bk.checkedAt = Date.now();
  setBookings(list);
  return { ok: true, msg: '核销成功', booking: bk };
};

// 当前用户
export const getCurrentUser = () => read(KEYS.CURRENT_USER, null);
export const setCurrentUser = (u) => write(KEYS.CURRENT_USER, u);
export const clearCurrentUser = () => localStorage.removeItem(KEYS.CURRENT_USER);

export const getCurrentAccount = () => {
  let u = read(KEYS.CURRENT_USER, null);
  if (!u || !u.openid) {
    u = MOCK_ACCOUNTS[0];
    write(KEYS.CURRENT_USER, u);
  }
  return u;
};

// 统计（B 端看板用）
export const getStats = () => {
  const sessions = getSessions();
  const bookings = getBookings();
  const valid = bookings.filter((b) => b.status !== 'cancelled');
  const checked = bookings.filter((b) => b.status === 'checked');
  const totalCap = sessions.reduce((s, x) => s + x.capacity, 0);
  const totalBooked = sessions.reduce((s, x) => s + x.booked, 0);

  // 最近 7 天每日预约数
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = fmtDate(d);
    const dayStart = new Date(`${ds}T00:00:00`).getTime();
    const dayEnd = dayStart + 86400_000;
    const cnt = valid.filter((b) => b.createdAt >= dayStart && b.createdAt < dayEnd).length;
    trend.push({ date: ds, count: cnt });
  }

  // 按游戏分预约数
  const gameStats = {};
  Object.keys(GAMES).forEach(k => { gameStats[k] = 0; });
  valid.forEach(b => {
    const s = sessions.find(x => x.id === b.sessionId);
    if (s) gameStats[s.game || 'jcc'] = (gameStats[s.game || 'jcc'] || 0) + 1;
  });

  return {
    totalSessions: sessions.length,
    totalCap,
    totalBooked,
    fillRate: totalCap ? Math.round((totalBooked / totalCap) * 100) : 0,
    totalBookings: valid.length,
    checkedCount: checked.length,
    checkRate: valid.length ? Math.round((checked.length / valid.length) * 100) : 0,
    trend,
    gameStats
  };
};

export const KEYS_ALL = KEYS;
