import React, { useState, useEffect, useRef, useCallback, memo } from "react";

const SUBJECTS = ["国語", "算数", "理科", "社会"];
const SUBJECT_COLORS = { 算数: "#FF6B6B", 国語: "#4ECDC4", 理科: "#45B7D1", 社会: "#96CEB4" };
const SUBJECT_ICONS = { 算数: "🔢", 国語: "📖", 理科: "🔬", 社会: "🌍" };
const TIME_SLOTS = ["朝", "昼", "夜", "塾"];
const SLOT_STYLES = {
  朝: { icon: "🌅", color: "#66BB6A", bg: "#FFF8ED" },
  昼: { icon: "☀️", color: "#4ECDC4", bg: "#F0FAFA" },
  夜: { icon: "🌙", color: "#764ba2", bg: "#F5F0FA" },
  塾: { icon: "🏫", color: "#E74C3C", bg: "#FFF0EF" },
};
const SCALE_LABELS = {
  体調: ["😴", "😔", "😐", "🙂", "😄"],
  気持ち: ["😭", "😢", "😐", "😊", "🥰"],
  自信度: ["😰", "😟", "😐", "😌", "💪"],
  姿勢: ["😴", "😔", "😐", "🙂", "🌟"],
  気持ち_parent: ["😮‍💨", "😟", "😐", "😊", "😁"],
};
const HAMSTER_MOODS = ["😴", "🐑", "😊🐑", "🐑✨", "🏆🐑"];
const DAILY_CHECKS = [
  { key: "meal", label: "ご飯を楽しく食べれた", icon: "🍚" },
  { key: "sleep", label: "よく寝た", icon: "😴" },
  { key: "book", label: "本読めた", icon: "📚" },
  { key: "rest", label: "テレビ・ゲーム休憩", icon: "🎮" },
  { key: "talk", label: "家族とおしゃべり", icon: "💬" },
];
// ===== 暦・天気コメントシステム =====

// 生駒郡の座標
const IKOMA_LAT = 34.68;
const IKOMA_LNG = 135.71;

// WMOコード → 天気カテゴリ変換
function wmoToCategory(code) {
  if (code === 0 || code === 1) return "sunny";
  if (code === 2 || code === 3) return "cloudy";
  if (code >= 45 && code <= 57) return "foggy";
  if (code >= 61 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 80 && code <= 82) return "rainy";
  if (code >= 95 && code <= 99) return "stormy";
  return "cloudy";
}

// 天気コメント（生駒郡らしさを込めて）
const WEATHER_COMMENTS = {
  sunny: [
    "今日の生駒は晴れてるよ！窓から青空が見えたら深呼吸して、さあ勉強しよう☀️🐑",
    "晴れの日は気分も上がるね！ぼくも草原ランがぴかぴかしてる気がするよ✨",
    "今日みたいな晴れた日は集中力が上がるんだって！生駒の空がきみを応援してるよ🌟",
    "ぽかぽかの晴れ日！でも勉強が終わったらお外に出てもいいかもね🐑☀️",
    "青空って見てるだけで元気が出るよね！その元気を問題にぶつけよう💪",
    "今日は晴れているから、気持ちも明るく前向きに！ぼくも全力で応援してるよ🐑🌟",
  ],
  cloudy: [
    "曇り空だけど、頭の中は晴れ晴れにしよう！こつこつが大事だよ🐑",
    "曇りの日はお外よりお勉強日和だね。ぼくも一緒に頑張るよ☁️",
    "生駒の山に雲がかかってるね。でも雲の上はいつも晴れてるよ！🌥️",
    "どんよりした空でも、きみのやる気は晴れ晴れでいよう！🐑",
    "曇りの日って実は集中しやすいんだって。今日は深い勉強ができる日だよ📚",
  ],
  rainy: [
    "雨の音ってなんか集中できるよね！今日は内側に向かう日だよ🌧️🐑",
    "雨の日は読書とか勉強が一番合う！もこの毛がぬれないよう応援してるよ☂️",
    "生駒に雨が降ってるね。雨の水分でぼくのほっぺもふっくらするよ🌂✨",
    "雨音をBGMに、今日は集中モードで行こう！🌧️📖",
    "傘マークの日は外に出なくていい理由ができたね。たくさん勉強しよう🐑",
    "雨の日の勉強は特別な気がするよ。なんか落ち着いて頭に入る感じ！☔✨",
  ],
  snowy: [
    "雪だ！生駒に雪が降ってる！ぼくの毛皮でも少し寒いくらいだよ❄️🐑",
    "雪の日は体を温めながら勉強しよう！もこは丸まって応援してるよ⛄",
    "雪が積もってるね！今日は家でこつこつ勉強する最高の日だよ❄️✨",
    "雪景色の生駒、きれいだね！ぼくも白くてふわふわしたい🐑⛄",
    "寒い日こそ熱く勉強しよう！体の中からぽかぽかにしよう🔥❄️",
  ],
  foggy: [
    "今日は霧がかかってるね。霧の中でも前に進むのが受験生だよ！🌫️🐑",
    "霧のような問題も、一つずつ解いていけば晴れてくるよ🌫️✨",
    "霧の生駒もなんか神秘的だよね。そんな日は難しい問題に挑戦してみよう🌫️🔥",
  ],
  stormy: [
    "嵐の日も勉強する子は本物だ！ぼくが応援するよ⛈️🐑",
    "外は荒れてても、心は落ち着いて問題に向かおう！🌩️✨",
    "嵐に負けない強さ、勉強でも発揮しよう！⛈️💪🐑",
  ],
};

// 時間帯別コメント（朝・昼・夜で出し分け）
function getTimeComment() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return [
    "おはよう！朝の勉強は頭がスッキリして一番効率がいいんだって🌅🐑",
    "早起きして勉強してるの？すごいね！ぼくもついさっき起きたよ🐑☀️",
    "朝ごはん食べた？しっかり食べてからが勉強の基本だよ🍚🐑",
    "朝の空気って気持ちいいよね！その気持ちよさで問題を解いちゃおう🌸",
  ];
  if (h >= 10 && h < 14) return [
    "お昼前後の時間帯！集中力が続くよう小休憩も入れながら頑張ろう☀️🐑",
    "お昼ごはんの前に一踏ん張り！終わったらごほうびを用意しておこう🍱🐑",
    "昼間は明るくて勉強しやすいね！窓を開けて換気しながら頑張ろう🌤️",
  ];
  if (h >= 14 && h < 18) return [
    "午後の時間帯！眠くなりやすいから、ちょっと体を動かしてから再開しよう🐑",
    "午後3時ごろが一番集中しにくいんだって。でもきみは頑張ってる！💪",
    "ここで踏ん張れる子が合格に近づくんだよ！一緒に頑張ろう🐑🔥",
  ];
  if (h >= 18 && h < 22) return [
    "夜の勉強タイム！今日の復習をしっかりやっておこう🌙🐑",
    "夜はぼくハムスターが一番元気な時間帯！一緒に頑張るよ🌙✨",
    "今日学んだことを夜に復習すると、記憶に残りやすいんだって📚🌙",
    "夜遅くなりすぎないようにね。睡眠も大事な勉強の一部だよ🐑💤",
  ];
  return [
    "夜更かしして勉強してるの？えらい！でも睡眠も大切にしてね🌟🐑",
    "ぼくは夜行性だから、夜は得意だよ！一緒に頑張ろう🐑✨",
  ];
}

// 励ましコメント（汎用・バリエーション豊富）
const GENERAL_COMMENTS = [
  "ぼくも今日は草原を全力で走り回ったよ！きみもいっしょにがんばろう🌿",
  "羊はね、毎日もこもこ歩き続けるのが得意なんだ。きみもそうだよ！✨",
  "毛がもこもこ育つみたいに、知識もふわふわ積み上げていこう📚",
  "ぼく、昨日も草原ランで10キロ走ったよ！きみの勉強もすごいね🏃",
  "羊はいつも草を食べながら考えてるよ。きみも考えながら勉強しよう🌟",
  "ぼくの毛みたいにふわふわの知識を頭に詰め込んでいこう💡",
  "今日も草原散歩（勉強）お疲れさま！少しずつ積み上げていこうね🏠",
  "草原ランって止まらないけど、きみの努力もそれと同じだよ！🔄",
  "ぼくも今日は新しいルートを探検したよ。きみも新しい問題に挑戦！🗺️",
  "羊の毛は刈っても刈っても伸び続けるんだよ。きみの力も伸び続けてるね🦷✨",
  "毛がもこもこになるまで知識を積み上げたよ！きみも知識をもこもこに！😄",
  "できないことができるようになるのが勉強の醍醐味だよ！ぼくも応援してる🐑",
  "今日の1問が、入試の1点につながるかもしれないよ。大切にしよう🎯",
  "失敗した問題が宝物！なぜ間違えたかを考えると一気に強くなるよ💡🐑",
  "わからなくて当たり前！わかるようになるのが勉強だよ。焦らないで🐑",
  "ライバルが休んでいる今、きみが前に進める！チャンスだよ💪",
  "勉強した時間は絶対に裏切らない。積み上げた分だけ力になるよ🐑📚",
  "今日のがんばりが、春の合格につながってるよ。信じて続けよう🌸🐑",
  "つかれたときは5分休んでいいよ。ぼくもたまに巣でぼーっとするから😄",
  "人間の脳は寝てる間に記憶を整理するんだって。今日の勉強を夢で復習しよう🌙",
  "問題を解けたときの気持ちよさ、ぼくも草原ランでゴールしたときに似てるよ！🏆",
  "奈良の大仏様も応援してくれてるよ！きっと合格を見守ってるはず🦌✨",
  "生駒の山からぼくがきみのことを見てるよ！がんばってるの知ってる🐑🏔️",
];


// 暦・季節イベントコメント（月/日 → コメント）
const CALENDAR_EVENTS = [
  // 1月
  { m:1, d:1,  msg:"あけましておめでとう！新しい年のスタートだよ🎍 今年も一緒にがんばろうね🐑" },
  { m:1, d:7,  msg:"七草粥の日だよ！春の七草みたいに、きみにも7つの強みがあるはず🌿✨" },
  { m:1, d:11, msg:"鏡開きの日！お餅みたいにのびのびと実力を伸ばしていこう🍡🐑" },
  { m:1, d:15, msg:"小正月だよ！どんど焼きで去年の疲れを燃やして新鮮な気持ちで！🔥" },
  { m:1, d:25, msg:"天神様の日（初天神）！菅原道真公は超努力家だったんだって📚 見習おう！" },
  // 2月
  { m:2, d:3,  msg:"節分だよ！鬼は外、福は内～！悪い点数は外に出してしまおう😄🐑" },
  { m:2, d:4,  msg:"立春🌸 暦の上では春が始まったよ！受験まであと少し、春の風を感じながら！" },
  { m:2, d:11, msg:"建国記念日！日本の歴史を社会で学ぼう！奈良も歴史がいっぱいだよ🦌" },
  { m:2, d:14, msg:"バレンタインだよ💝 チョコレートみたいに甘い合格をもらえるよう頑張ろう！🐑" },
  { m:2, d:22, msg:"ネコの日にゃ〜🐱 ぼくハムスターだけど、きみのことを応援してるよ！" },
  // 3月
  { m:3, d:3,  msg:"ひなまつり🎎 桃の花が咲く頃、きみの実力も花開こう！がんばれ！" },
  { m:3, d:11, msg:"奈良東大寺でお水取りが終わる頃🕯️ 奈良に春が来るサインだよ！" },
  { m:3, d:14, msg:"ホワイトデー🍬 勉強へのご褒美は合格証書だよ！もう少し！🐑" },
  { m:3, d:20, msg:"春分の日🌸 昼と夜が同じ長さ。勉強と休憩のバランスも大事だよ！" },
  { m:3, d:25, msg:"もうすぐ春休み！最後のまとめ復習をしっかりやっておこう📚🐑" },
  // 4月
  { m:4, d:1,  msg:"エイプリルフール🎭 でもぼくの「きみは合格できる！」は嘘じゃないよ🐑" },
  { m:4, d:8,  msg:"花まつり🌸 仏様の誕生日！奈良には大仏様もいるよ。パワーもらおう！" },
  { m:4, d:15, msg:"春まっさかり！生駒山のサクラが満開だよ🌸 見に行くのは合格してからね！" },
  { m:4, d:22, msg:"アースデイ🌍 地球に優しくしながら、社会科の勉強もバッチリ！" },
  { m:4, d:29, msg:"ゴールデンウィーク前！今のうちに苦手科目をやっつけておこう🐑💪" },
  // 5月
  { m:5, d:3,  msg:"憲法記念日📜 日本の法律を守りながら、ぼくも草原ランを守るよ！🐑" },
  { m:5, d:5,  msg:"こどもの日🎏 きみはこどもの特権を使って思いっきり勉強しよう！🎐" },
  { m:5, d:10, msg:"もうすぐ母の日💐 お母さんへの一番のプレゼントは合格だよね！がんばれ！" },
  { m:5, d:18, msg:"生駒の新緑が一番きれいな時期だよ🌿 深呼吸して、今日も集中！" },
  { m:5, d:25, msg:"もうすぐ6月！梅雨前に苦手を克服しておこう☔🐑" },
  // 6月
  { m:6, d:1,  msg:"衣替えの日👕 頭の中も衣替え！古い間違いを捨てて新鮮な知識を入れよう" },
  { m:6, d:10, msg:"時の記念日⏰ 時間を大切に使おう！ぼくの草原ランも止まらないよ！" },
  { m:6, d:15, msg:"梅雨まっさかり☔ 雨の音をBGMに、集中タイムにしよう！🐑" },
  { m:6, d:21, msg:"夏至！一番昼が長い日だよ☀️ 長い時間、勉強できるチャンス！" },
  { m:6, d:28, msg:"もうすぐ7月！夏休みまであと少し。気を抜かないで！🐑" },
  // 7月
  { m:7, d:1,  msg:"7月スタート！夏休みの計画を立てよう📅 計画通りが一番強いよ！" },
  { m:7, d:7,  msg:"七夕🌟 「合格できますように」って願い事したよ！ぼくからも！🐑🎋" },
  { m:7, d:15, msg:"生駒山上遊園地が賑やかな季節だね🎡 遊ぶのは合格の後！頑張れ！" },
  { m:7, d:20, msg:"もうすぐ土用の丑の日！うなぎパワーで夏バテ知らずで勉強しよう🐟💪" },
  { m:7, d:28, msg:"夏真っ盛り！暑くてもクーラーつけてコツコツが勝負だよ☀️🐑" },
  // 8月
  { m:8, d:6,  msg:"平和を考える日だよ🕊️ 社会の勉強で歴史をしっかり学ぼうね" },
  { m:8, d:11, msg:"山の日🏔️ 生駒山も奈良の山々も見守ってるよ！登るように実力を積もう⛰️" },
  { m:8, d:15, msg:"お盆だよ🏮 ご先祖様も応援してくれてるはず！お墓参りもしてね" },
  { m:8, d:24, msg:"夏休みも残り少ない！やり残しないようにラストスパート！🏃🐑" },
  { m:8, d:31, msg:"夏休み最終日！明日から全力で！宿題は終わったかな？🐑✏️" },
  // 9月
  { m:9, d:1,  msg:"新学期スタート！気持ち切り替えて今日から全力で！🎒🐑" },
  { m:9, d:9,  msg:"重陽の節句🌸 菊の花のように、どんな環境でも美しく咲いてね！" },
  { m:9, d:15, msg:"敬老の日👴 おじいちゃんおばあちゃんに合格を報告できるよう頑張ろう！" },
  { m:9, d:23, msg:"秋分の日🍂 昼と夜が同じ長さ。秋の集中タイムが始まるよ！🐑" },
  { m:9, d:28, msg:"もうすぐ10月！受験まで折り返し地点だよ。ギアを上げていこう💪" },
  // 10月
  { m:10, d:1, msg:"10月スタート！秋の受験シーズン本番だよ🍂 ぼくも全力で草原ラン！" },
  { m:10, d:9, msg:"奈良の鹿が発情期でさわがしいよ🦌 でもきみは落ち着いて勉強！" },
  { m:10, d:14, msg:"鉄道の日🚃 近鉄で塾に通う日々、一駅一駅が合格への道のりだよ！" },
  { m:10, d:21, msg:"もうすぐ試験本番の季節！体調管理も勉強の一つだよ🐑💊" },
  { m:10, d:31, msg:"ハロウィン🎃 今夜はお化けより怖い問題をやっつけちゃおう！" },
  // 11月
  { m:11, d:1, msg:"文化の日週間🎨 日本の文化を国語で学ぼう！古文も怖くない！" },
  { m:11, d:3, msg:"文化の日🎌 芸術や文化に触れる日だけど、今日も勉強が一番の文化！🐑" },
  { m:11, d:7, msg:"立冬❄️ 冬が始まったよ！受験まであと少し、最後の追い込みだ！" },
  { m:11, d:15, msg:"七五三🎋 きみの成長をぼくも見てきたよ！もうすぐ大きな節目だね！" },
  { m:11, d:23, msg:"勤労感謝の日🌾 毎日コツコツ勉強してる自分に感謝しよう！えらいよ！" },
  // 12月
  { m:12, d:1, msg:"12月スタート！いよいよ大詰めだよ🎄 ぼくも全力で応援する！🐑" },
  { m:12, d:8, msg:"事始め🎍 正月準備の季節。きみも受験の総仕上げを始めよう！" },
  { m:12, d:13, msg:"ことはじめ🎊 江戸時代の大掃除の日！頭の中も総ざらいしよう📚" },
  { m:12, d:22, msg:"冬至🌙 一番夜が長い日！ゆず湯で疲れを癒やして、明日も頑張ろう🍊" },
  { m:12, d:25, msg:"クリスマス🎄 サンタさんへのお願いは合格だよ！ぼくも煙突を見張ってる🐑" },
  { m:12, d:31, msg:"大晦日🎊 今年の勉強をふり返ろう！来年はきっといい年になるよ！" },
];

// 直近イベントを探す（±3日以内）
function getNearbyEvent(now) {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  let best = null;
  let bestDist = 999;
  for (const ev of CALENDAR_EVENTS) {
    // 同年として日付差を計算（年をまたぐ場合は簡略化）
    const evDate = new Date(now.getFullYear(), ev.m - 1, ev.d);
    const dist = Math.round((evDate - now) / 86400000);
    if (dist >= -1 && dist <= 3 && Math.abs(dist) < bestDist) {
      bestDist = Math.abs(dist);
      best = { ...ev, dist };
    }
  }
  return best;
}

// 季節コメント（イベントがない日用）
function getSeasonComment(month) {
  if (month >= 3 && month <= 5) return [
    "生駒の春は気持ちいいね🌸 さあ今日も一問一問丁寧に！🐑",
    "桜が咲く頃、実力も満開にしよう🌸✨",
    "春風が吹いてるよ🌿 深呼吸して、今日もファイト！",
  ];
  if (month >= 6 && month <= 8) return [
    "夏の生駒は緑がきれいだよ🌿 暑さに負けず頑張れ！🐑",
    "蝉が鳴いてるね🌻 ぼくも負けじと草原ランを回すよ！",
    "夏バテしないように水分補給しながら勉強しよう☀️🐑",
  ];
  if (month >= 9 && month <= 11) return [
    "秋の生駒山は紅葉がきれいだよ🍂 美しい季節に実力を磨こう！",
    "秋の夜長は勉強にぴったり🌙 ぼくも夜行性だから一緒に頑張るよ！🐑",
    "食欲の秋より勉強の秋！知識をもりもり食べよう📚🍄",
  ];
  return [
    "冬の生駒はキリリと冷えるね❄️ 寒さに負けず机に向かおう！🐑",
    "温かいお茶を飲みながら、集中タイムにしよう☕✨",
    "冬こそ差がつく季節！ライバルに差をつけるチャンスだよ💪🐑",
  ];
}

// 天気コメントを取得
async function fetchWeatherComment() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${IKOMA_LAT}&longitude=${IKOMA_LNG}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=1`;
    const res = await fetch(url);
    const json = await res.json();
    const code = json.daily.weather_code[0];
    const tMax = Math.round(json.daily.temperature_2m_max[0]);
    const tMin = Math.round(json.daily.temperature_2m_min[0]);
    const cat = wmoToCategory(code);
    const comments = WEATHER_COMMENTS[cat] || WEATHER_COMMENTS.cloudy;
    const base = comments[Math.floor(Math.random() * comments.length)];
    // 気温コメントを付加
    let tempNote = "";
    if (tMax >= 35) tempNote = `今日は最高${tMax}℃の猛暑日！水分補給を忘れずに☀️`;
    else if (tMax >= 30) tempNote = `今日は最高${tMax}℃！暑いけど涼しい部屋で頑張ろう！`;
    else if (tMax <= 3) tempNote = `今日は最高${tMax}℃の寒い日！温かくして勉強しよう🧤`;
    else if (tMin <= 0) tempNote = `今朝は${tMin}℃まで冷えたね！体を温めてからスタートしよう❄️`;
    return tempNote ? `${base} ${tempNote}` : base;
  } catch {
    return null;
  }
}

// メインのもこメッセージ生成
async function buildOmochiMessage(streak, totalDays) {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (totalDays === 0) return "はじめまして！もこだよ🐑 いっしょにがんばろうね！";

  // 暦イベント（直近なら必ず表示）
  const event = getNearbyEvent(now);
  if (event && event.dist === 0) return event.msg;
  if (event && event.dist <= 1 && Math.random() < 0.8) return event.msg;
  if (event && Math.random() < 0.5) return event.msg;

  // どのコメント種別を使うかランダムに選ぶ（天気30%・時間帯25%・季節20%・汎用25%）
  const roll = Math.random();

  if (roll < 0.30) {
    const weather = await fetchWeatherComment();
    if (weather) return weather;
  }

  if (roll < 0.55) {
    const timeMsgs = getTimeComment();
    const picked = timeMsgs[Math.floor(Math.random() * timeMsgs.length)];
    if (picked) return picked;
  }

  if (roll < 0.75) {
    const seasonMsgs = getSeasonComment(month);
    return seasonMsgs[Math.floor(Math.random() * seasonMsgs.length)];
  }

  // 汎用コメント
  const gen = GENERAL_COMMENTS[Math.floor(Math.random() * GENERAL_COMMENTS.length)];
  if (gen) return gen;

  // 連続日数コメント（フォールバック）
  if (streak >= 7) return `すごい！${streak}日連続だ！もこも感動してるよ！🏆🐑`;
  if (streak >= 3) return `${streak}日連続！もこも草原を全力で走るよ！🔥`;

  return GENERAL_COMMENTS[0];
}


// 分を「1時間30分」形式に変換
function fmtMins(m) {
  const mins = Math.round(m);
  if (mins === 0) return "0分";
  if (mins < 60) return `${mins}分`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${h}時間${rem}分` : `${h}時間`;
}

const GAS_URL = ""; // 羊スタディ用のApps Script URLをここに設定してください

// 日本時間（JST）でYYYY-MM-DDを返す
function getJSTDateString(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().split("T")[0];
}

// 日本時間でYYYY-MM-DD HH:MM:SSを返す
function getJSTDateTimeString(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().replace("T", " ").substring(0, 19);
}

// getOmochiMessage → buildOmochiMessage に置き換え済み

// ---- 草原ランアニメーション ----
function HitsujiWalk({ minutes }) {
  const speed = minutes === 0 ? 0 : minutes <= 30 ? 3 : minutes <= 60 ? 1.8 : minutes <= 120 ? 1.2 : 0.7;
  const isRunning = minutes > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "12px 0 20px", padding: "14px 16px", background: "linear-gradient(135deg, #F1F8E9, #F9FBF9)", borderRadius: 16, border: "2px solid #C8E6C9" }}>
      <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
        {/* 草原ラン */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          border: "4px solid #7BC47F",
          borderTop: "4px solid #5BAD6F",
          borderRight: "4px solid #FF6B6B",
          position: "absolute",
          animation: isRunning ? `spin ${speed}s linear infinite` : "none",
        }} />
        {/* スポーク */}
        <div style={{
          width: 64, height: 64, position: "absolute", top: 0, left: 0,
          animation: isRunning ? `spin ${speed}s linear infinite` : "none",
        }}>
          {[0,60,120].map(deg => (
            <div key={deg} style={{
              position: "absolute", top: "50%", left: "50%",
              width: "46%", height: 2, background: "#FFD0A0",
              transformOrigin: "left center",
              transform: `translateY(-50%) rotate(${deg}deg)`,
            }} />
          ))}
        </div>
        {/* ハムスター */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 26,
          animation: isRunning ? `hitsujiWalk ${speed * 0.5}s ease-in-out infinite` : "none",
        }}>🐑</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#5BAD6F", marginBottom: 2 }}>
          {minutes === 0 ? "さあ、走ろう！" :
           minutes <= 30 ? "ゆっくりスタート🌱" :
           minutes <= 60 ? "いい感じ！🔥" :
           minutes <= 120 ? "全力疾走中！💨" : "止まらないよ〜！🏆"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#5BAD6F" }}>
          {Math.floor(minutes/60) > 0 ? `${Math.floor(minutes/60)}時間` : ""}{minutes % 60}分
        </div>
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>5分単位で追加</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => {}} style={{ display: "none" }} />
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes hitsujiWalk { 0%,100% { transform: translate(-50%,-50%) rotate(-8deg); } 50% { transform: translate(-50%,-50%) rotate(8deg); } }
      `}</style>
    </div>
  );
}

// 科目ごとの勉強時間入力コンポーネント
function SubjectTimeInput({ subjectMinutes, onChange }) {
  const total = Object.values(subjectMinutes).reduce((a, b) => a + b, 0);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 8, fontWeight: 600 }}>科目ごとの勉強時間</div>
      <HitsujiWalk minutes={total} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SUBJECTS.map((s) => {
          const mins = subjectMinutes[s] || 0;
          return (
            <div key={s} style={{
              background: SUBJECT_COLORS[s] + "10",
              border: `2px solid ${mins > 0 ? SUBJECT_COLORS[s] : "#e8e0d5"}`,
              borderRadius: 14, padding: "10px 14px",
              transition: "border-color 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{SUBJECT_ICONS[s]}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: SUBJECT_COLORS[s] }}>{s}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, color: mins > 0 ? SUBJECT_COLORS[s] : "#ccc" }}>
                  {Math.floor(mins / 60) > 0 ? `${Math.floor(mins/60)}h ` : ""}{mins % 60}分
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onChange({ ...subjectMinutes, [s]: Math.max(0, mins - 5) })} style={{
                  flex: 1, padding: "8px", borderRadius: 10, border: "none",
                  background: "#f0ece6", fontSize: 14, cursor: "pointer", fontWeight: 700, color: "#999",
                }}>− 5分</button>
                <button onClick={() => onChange({ ...subjectMinutes, [s]: mins + 5 })} style={{
                  flex: 2, padding: "8px", borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${SUBJECT_COLORS[s]}, ${SUBJECT_COLORS[s]}bb)`,
                  fontSize: 14, cursor: "pointer", fontWeight: 700, color: "white",
                  boxShadow: `0 2px 8px ${SUBJECT_COLORS[s]}44`,
                }}>＋ 5分</button>
              </div>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <div style={{ marginTop: 10, padding: "8px 14px", background: "#F1F8E9", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#aaa" }}>合計</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "#5BAD6F" }}>
            {Math.floor(total/60) > 0 ? `${Math.floor(total/60)}時間` : ""}{total % 60}分
          </span>
        </div>
      )}
    </div>
  );
}

function ScaleSelector({ label, value, onChange, scaleKey, color = "#5BAD6F" }) {
  const icons = SCALE_LABELS[scaleKey] || SCALE_LABELS["気持ち"];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {icons.map((icon, i) => (
          <button key={i} onClick={() => onChange(i + 1)} style={{
            width: 48, height: 48, borderRadius: 12,
            border: value === i + 1 ? `3px solid ${color}` : "2px solid #e8e0d5",
            background: value === i + 1 ? color + "18" : "#FAFAF8",
            fontSize: 22, cursor: "pointer", transition: "all 0.15s",
            transform: value === i + 1 ? "scale(1.15)" : "scale(1)",
            boxShadow: value === i + 1 ? `0 4px 12px ${color}44` : "none",
          }}>{icon}</button>
        ))}
      </div>
    </div>
  );
}



function TimeSlotSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 8, fontWeight: 600 }}>勉強した時間帯</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TIME_SLOTS.map((slot) => {
          const s = SLOT_STYLES[slot];
          const active = value === slot;
          return (
            <button key={slot} onClick={() => onChange(slot)} style={{
              flex: 1, minWidth: 60, padding: "10px 8px", borderRadius: 20,
              border: active ? `2px solid ${s.color}` : "2px solid #e8e0d5",
              background: active ? s.bg : "#FAFAF8",
              color: active ? s.color : "#999",
              fontWeight: active ? 700 : 400, cursor: "pointer", fontSize: 15,
              transition: "all 0.15s",
              boxShadow: active ? `0 2px 8px ${s.color}33` : "none",
            }}>{s.icon} {slot}</button>
          );
        })}
      </div>
      {value === "塾" && (
        <div style={{ marginTop: 8, padding: "6px 12px", background: "#FFF0EF", borderRadius: 10, fontSize: 12, color: "#E74C3C" }}>
          🏫 塾での学習時間を記録します
        </div>
      )}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 2, color = "#5BAD6F" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: "100%", borderRadius: 12, border: `2px solid ${color}33`, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: color + "08", resize: "vertical", boxSizing: "border-box", outline: "none", lineHeight: 1.6 }} />
    </div>
  );
}

function DailyCheckList({ checks, onChange, bestDay, onBestDayChange, color = "#5BAD6F" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 10, fontWeight: 600 }}>✅ 今日できたこと</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DAILY_CHECKS.map(({ key, label, icon }) => {
          const checked = checks[key] || false;
          return (
            <button key={key} onClick={() => onChange({ ...checks, [key]: !checked })} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, cursor: "pointer",
              border: checked ? `2px solid ${color}` : "2px solid #e8e0d5",
              background: checked ? color + "12" : "#FAFAF8", textAlign: "left", transition: "all 0.15s",
            }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: checked ? `2px solid ${color}` : "2px solid #ddd", background: checked ? color : "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "white", transition: "all 0.15s" }}>{checked ? "✓" : ""}</div>
              <span style={{ fontSize: 13, color: checked ? "#555" : "#999" }}>{icon} {label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>🌟 その他・最高だったこと</div>
        <textarea value={bestDay} onChange={(e) => onBestDayChange(e.target.value)} placeholder="今日最高だったこと、なんでもOK！" rows={2}
          style={{ width: "100%", borderRadius: 12, border: `2px solid ${color}33`, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: color + "08", resize: "vertical", boxSizing: "border-box", outline: "none", lineHeight: 1.6 }} />
      </div>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 16px" }}>
      <div style={{ flex: 1, height: 1, background: "#f0ece6" }} />
      <div style={{ fontSize: 11, color: "#ccc", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: "#f0ece6" }} />
    </div>
  );
}

function BarChart({ records }) {
  if (records.length === 0) return <div style={{ color: "#bbb", textAlign: "center", padding: 24 }}>まだ記録がありません</div>;

  // 直近7日のカレンダー日付を生成（記録がなくても表示）
  const today = getJSTDateString();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(new Date(today).getTime() - (6 - i) * 86400000);
    return getJSTDateString(d);
  });

  // 日付×時間帯で勉強時間を合計（同じ時間帯に複数記録があれば加算）
  const dayMap = {};
  last7.forEach(d => { dayMap[d] = { 朝: 0, 昼: 0, 夜: 0, 塾: 0 }; });
  records.forEach((r) => {
    if (!dayMap[r.date]) return;
    const slot = r.timeSlot;
    if (slot === "朝" || slot === "昼" || slot === "夜" || slot === "塾") {
      dayMap[r.date][slot] += r.studyMinutes || 0;
    }
  });

  const CHART_HEIGHT = 160;
  // 実データの最大値から上限を動的計算（30分単位で切り上げ、最低60分）
  const maxTotal = Math.max(...last7.map(d => {
    const s = dayMap[d];
    return (s.朝||0) + (s.昼||0) + (s.夜||0) + (s.塾||0);
  }), 60);
  const MAX_MINUTES = Math.ceil(maxTotal / 60) * 60; // 1時間単位で切り上げ
  // 縦軸ラベルを動的生成（最大4〜5本）
  const tickCount = Math.min(MAX_MINUTES / 60, 5);
  const tickStep = MAX_MINUTES / tickCount;
  const SCALE_LABELS_Y = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(tickStep * i));
  const slotColors = { 朝: "#66BB6A", 昼: "#4ECDC4", 夜: "#764ba2", 塾: "#E74C3C" };

  return (
    <div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 600 }}>📊 勉強時間（直近7日）</div>
      <div style={{ display: "flex", gap: 4 }}>
        {/* 縦軸ラベル */}
        <div style={{ display: "flex", flexDirection: "column-reverse", justifyContent: "space-between", height: CHART_HEIGHT, paddingBottom: 20, marginRight: 4 }}>
          {SCALE_LABELS_Y.map((m) => (
            <div key={m} style={{ fontSize: 9, color: "#ccc", lineHeight: 1 }}>
              {m === 0 ? "0" : `${m/60}h`}
            </div>
          ))}
        </div>
        {/* グラフ本体 */}
        <div style={{ flex: 1, position: "relative" }}>
          {SCALE_LABELS_Y.map((m) => (
            <div key={m} style={{
              position: "absolute", left: 0, right: 0,
              bottom: 20 + (m / MAX_MINUTES) * (CHART_HEIGHT - 20),
              height: 1, background: m === 0 ? "#ddd" : "#f0ece6",
            }} />
          ))}
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: CHART_HEIGHT, paddingBottom: 20 }}>
            {last7.map((date) => {
              const dateParts = date.split("-");
              const dm = parseInt(dateParts[1], 10);
              const dd = parseInt(dateParts[2], 10);
              const slots = dayMap[date];
              const total = (slots.朝 || 0) + (slots.昼 || 0) + (slots.夜 || 0) + (slots.塾 || 0);
              const totalLabel = total > 0 ? fmtMins(total) : "";
              const isToday = date === today;
              return (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%", justifyContent: "flex-end" }}>
                  {total > 0 && <div style={{ fontSize: 9, color: "#aaa", marginBottom: 2 }}>{totalLabel}</div>}
                  <div style={{ width: "100%", display: "flex", flexDirection: "column-reverse", borderRadius: "6px 6px 0 0", overflow: "hidden" }}>
                    {["朝", "昼", "夜", "塾"].map((slot) => {
                      const mins = slots[slot] || 0;
                      if (mins === 0) return null;
                      const h = (mins / MAX_MINUTES) * (CHART_HEIGHT - 20);
                      return <div key={slot} style={{ width: "100%", height: h, background: slotColors[slot], minHeight: 3 }} />;
                    })}
                    {total === 0 && <div style={{ width: "100%", height: 3, background: "#f0ece6", borderRadius: 3 }} />}
                  </div>
                  <div style={{ fontSize: 10, color: isToday ? "#5BAD6F" : "#aaa", fontWeight: isToday ? 700 : 400, marginTop: 4 }}>{dm}/{dd}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#aaa" }}>
        <span>🟡 朝</span><span>🟢 昼</span><span>🟣 夜</span><span style={{color:"#E74C3C"}}>🏫 塾</span>
      </div>
    </div>
  );
}

function MentalChart({ records }) {
  if (records.length === 0) return null;

  // 直近7日のカレンダー日付を固定生成
  const todayStr = getJSTDateString();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(new Date(todayStr).getTime() - (6 - i) * 86400000);
    return getJSTDateString(d);
  });

  // 日付単位で気持ちを平均（繰り上げ）集計
  const dayMap = {};
  last7.forEach(d => { dayMap[d] = { childMoods: [], parentMoods: [] }; });
  records.forEach(r => {
    if (!dayMap[r.date]) return;
    if (r.child?.気持ち > 0) dayMap[r.date].childMoods.push(r.child.気持ち);
    if (r.parent?.気持ち > 0) dayMap[r.date].parentMoods.push(r.parent.気持ち);
  });

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 600 }}>💝 メンタル推移（直近7日）</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {last7.map((date) => {
          const dp = date.split("-");
          const mm = parseInt(dp[1], 10);
          const md = parseInt(dp[2], 10);
          const cMoods = dayMap[date].childMoods;
          const pMoods = dayMap[date].parentMoods;
          const cm = cMoods.length ? Math.ceil(cMoods.reduce((a,b)=>a+b,0)/cMoods.length) : 0;
          const pm = pMoods.length ? Math.ceil(pMoods.reduce((a,b)=>a+b,0)/pMoods.length) : 0;
          const isToday = date === todayStr;
          return (
            <div key={date} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 20, opacity: cm > 0 ? 1 : 0.2 }}>{cm > 0 ? SCALE_LABELS["気持ち"][cm-1] : "·"}</div>
              <div style={{ fontSize: 10, color: isToday ? "#5BAD6F" : "#ccc", fontWeight: isToday ? 700 : 400, margin: "2px 0" }}>{mm}/{md}</div>
              <div style={{ fontSize: 13, opacity: pm > 0 ? 0.7 : 0.15 }}>{pm > 0 ? SCALE_LABELS["気持ち_parent"][pm-1] : "·"}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>大: 子ども / 小: 保護者（複数記録は平均・繰り上げ）</div>
    </div>
  );
}

// 期間フィルタリング用ヘルパー
function filterByPeriod(records, period) {
  const now = new Date();
  const cutoff = new Date(now);
  if (period === "7d") cutoff.setDate(now.getDate() - 7);
  else cutoff.setDate(now.getDate() - 30);
  const cutoffStr = getJSTDateString(cutoff);
  return records.filter(r => r.date >= cutoffStr);
}

// 日付単位でユニーク集計（習慣チェック用）
function groupByDate(records) {
  const map = {};
  records.forEach(r => {
    const d = r.date;
    if (!map[d]) map[d] = { checks: {} };
    const c = r.dailyChecks || {};
    DAILY_CHECKS.forEach(({ key }) => {
      if (c[key]) map[d].checks[key] = true;
    });
  });
  return map;
}

function PeriodToggle({ period, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
      {[["7d", "直近7日"], ["30d", "1ヶ月"]].map(([val, lbl]) => (
        <button key={val} onClick={() => onChange(val)} style={{
          padding: "4px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: val === period ? 700 : 400,
          background: val === period ? "#5BAD6F" : "#f0ece6",
          color: val === period ? "white" : "#aaa",
          transition: "all 0.15s",
        }}>{lbl}</button>
      ))}
    </div>
  );
}

function SubjectChart({ records }) {
  const [period, setPeriod] = useState("7d");
  const filtered = filterByPeriod(records, period);
  if (records.length === 0) return null;
  const st = {};
  SUBJECTS.forEach((s) => (st[s] = 0));
  filtered.forEach((r) => {
    if (r.subjectMinutes) {
      SUBJECTS.forEach((s) => { st[s] += r.subjectMinutes[s] || 0; });
    } else {
      const subs = r.subjects || [];
      const t = subs.length > 0 ? (r.studyMinutes || 0) / subs.length : 0;
      subs.forEach((s) => { if (st[s] !== undefined) st[s] += t; });
    }
  });
  const total = Object.values(st).reduce((a, b) => a + b, 0);
  if (total === 0 && filtered.length === 0) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>📚 科目別の取り組み時間</div>
        <PeriodToggle period={period} onChange={setPeriod} />
      </div>
      {total === 0 ? (
        <div style={{ color: "#ccc", fontSize: 12, textAlign: "center", padding: "8px 0" }}>この期間の記録がありません</div>
      ) : (
        <>
          {(() => {
            const homeMins = filtered.filter(r => r.timeSlot !== "塾").reduce((a, r) => {
              SUBJECTS.forEach(s => { a[s] = (a[s]||0) + (r.subjectMinutes?.[s] || 0); }); return a;
            }, {});
            const jukuMins = filtered.filter(r => r.timeSlot === "塾").reduce((a, r) => {
              SUBJECTS.forEach(s => { a[s] = (a[s]||0) + (r.subjectMinutes?.[s] || 0); }); return a;
            }, {});
            const homeTotal = Object.values(homeMins).reduce((a,b)=>a+b,0);
            const jukuTotal = Object.values(jukuMins).reduce((a,b)=>a+b,0);
            return (
              <>
                {jukuTotal > 0 && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 12 }}>
                    <span style={{ color: "#5BAD6F" }}>🏠 家庭 {fmtMins(homeTotal)}</span>
                    <span style={{ color: "#E74C3C" }}>🏫 塾 {fmtMins(jukuTotal)}</span>
                  </div>
                )}
                {SUBJECTS.map((s) => (
                  <div key={s} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span>{SUBJECT_ICONS[s]} {s}</span>
                      <span style={{ color: "#aaa" }}>
                        {fmtMins(st[s])}
                        {jukuTotal > 0 && jukuMins[s] > 0 && <span style={{ color: "#E74C3C", marginLeft: 4 }}>(塾{fmtMins(jukuMins[s])})</span>}
                      </span>
                    </div>
                    <div style={{ background: "#f0ece6", borderRadius: 6, height: 8, overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${total > 0 ? ((st[s]-(jukuMins[s]||0))/total)*100 : 0}%`, height: "100%", background: SUBJECT_COLORS[s], transition: "width 0.5s ease" }} />
                      <div style={{ width: `${total > 0 ? ((jukuMins[s]||0)/total)*100 : 0}%`, height: "100%", background: "#E74C3C", opacity: 0.7, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}

function CheckChart({ records }) {
  const [period, setPeriod] = useState("7d");
  const filtered = filterByPeriod(records, period);
  if (records.length === 0) return null;
  // 日付単位でユニーク集計
  const dayMap = groupByDate(filtered);
  const days = Object.keys(dayMap);
  const totalDays = days.length;
  const totals = {};
  DAILY_CHECKS.forEach(({ key }) => (totals[key] = 0));
  days.forEach(d => { DAILY_CHECKS.forEach(({ key }) => { if (dayMap[d].checks[key]) totals[key]++; }); });
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>✅ 習慣チェック達成率</div>
        <PeriodToggle period={period} onChange={setPeriod} />
      </div>
      {totalDays === 0 ? (
        <div style={{ color: "#ccc", fontSize: 12, textAlign: "center", padding: "8px 0" }}>この期間の記録がありません</div>
      ) : DAILY_CHECKS.map(({ key, label, icon }) => {
        const pct = totalDays > 0 ? (totals[key] / totalDays) * 100 : 0;
        return (
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span>{icon} {label}</span>
              <span style={{ color: "#aaa" }}>{Math.round(pct)}% <span style={{ fontSize: 10 }}>({totals[key]}/{totalDays}日)</span></span>
            </div>
            <div style={{ background: "#f0ece6", borderRadius: 6, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #96CEB4, #4ECDC4)", borderRadius: 6, transition: "width 0.5s ease" }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: "#bbb", marginTop: 4 }}>※1日に複数回入力があっても1日1回として集計</div>
    </div>
  );
}

// ---- 声かけヒント（傾向分析アドバイス） ----
function ParentAdvice({ records, today }) {
  const recent = records.slice(-7);
  if (recent.length === 0) return (
    <div style={{ background: "#F0FAFA", borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 12, color: "#4ECDC4", lineHeight: 1.7 }}>
      💡 <strong>声かけヒント：</strong><br />結果より過程を褒めましょう。努力を認める言葉が子どものやる気につながります。
    </div>
  );

  const advices = [];

  // 子どもの気持ち平均
  const childMoods = recent.filter(r => r.child?.気持ち > 0).map(r => r.child.気持ち);
  const avgChildMood = childMoods.length ? childMoods.reduce((a,b)=>a+b,0)/childMoods.length : 0;

  // 保護者の気持ち平均
  const parentMoods = recent.filter(r => r.parent?.気持ち > 0).map(r => r.parent.気持ち);
  const avgParentMood = parentMoods.length ? parentMoods.reduce((a,b)=>a+b,0)/parentMoods.length : 0;

  // 自信度平均
  const confidence = recent.filter(r => r.child?.自信度 > 0).map(r => r.child.自信度);
  const avgConf = confidence.length ? confidence.reduce((a,b)=>a+b,0)/confidence.length : 0;

  // 勉強時間の科目偏り
  const subjectTotals = { 算数: 0, 国語: 0, 理科: 0, 社会: 0 };
  recent.forEach(r => {
    if (r.subjectMinutes) {
      SUBJECTS.forEach(s => { subjectTotals[s] += r.subjectMinutes[s] || 0; });
    } else {
      const subs = r.subjects || [];
      const t = subs.length ? (r.studyMinutes||0)/subs.length : 0;
      subs.forEach(s => { if (subjectTotals[s]!==undefined) subjectTotals[s]+=t; });
    }
  });
  const maxSubject = Object.entries(subjectTotals).sort((a,b)=>b[1]-a[1]);
  const zeroSubjects = maxSubject.filter(([,v])=>v===0).map(([k])=>k);
  const topSubject = maxSubject[0][1] > 0 ? maxSubject[0][0] : null;

  // すれ違い検出（子ども気持ち↑ 保護者気持ち↓ or逆）
  if (avgChildMood > 0 && avgParentMood > 0) {
    const diff = avgChildMood - avgParentMood;
    if (diff >= 1.5) advices.push("🔍 お子さんは楽しく取り組めていますが、保護者のみなさんは少し心配気味かもしれません。お子さんの気持ちをそのまま受け止めてあげましょう。");
    else if (diff <= -1.5) advices.push("🤝 保護者は前向きに見守っていますが、お子さんが内心しんどさを感じているかもしれません。「何が難しい？」と聞いてみましょう。");
    else advices.push("😊 親子の気持ちがよく合っています！この調子でコミュニケーションを続けてください。");
  }

  // 自信度が低い
  if (avgConf > 0 && avgConf < 2.5) advices.push("💪 最近自信度が低め(" + avgConf.toFixed(1) + "/5)です。「できたこと」に注目して、小さな成功を一緒に喜びましょう。");
  else if (avgConf >= 4) advices.push("🌟 自信度がとても高いです！難しい問題にも挑戦する気持ちが育っています。");

  // 勉強時間の偏り
  if (zeroSubjects.length > 0) advices.push(`📚 この7日間で ${zeroSubjects.join("・")} の記録がありません。バランスよく取り組めるよう一緒に計画を立ててみましょう。`);
  else if (topSubject) advices.push(`🔢 最近は${topSubject}に一番時間をかけています。得意を伸ばしつつ、他の科目も少しずつ。`);

  // 体調チェック
  const sleepCheck = recent.filter(r => r.dailyChecks?.sleep);
  if (sleepCheck.length < recent.length * 0.5) advices.push("😴 睡眠チェックの達成率が低めです。受験期の体調管理はとても大切！早寝早起きを心がけましょう。");

  return (
    <div style={{ background: "#F0FAFA", borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 12, lineHeight: 1.8 }}>
      <div style={{ fontWeight: 700, color: "#4ECDC4", marginBottom: 8, fontSize: 13 }}>💡 直近7日の傾向アドバイス</div>
      {advices.map((a, i) => (
        <div key={i} style={{ marginBottom: i < advices.length-1 ? 8 : 0, color: "#555", paddingLeft: 4, borderLeft: "3px solid #4ECDC444", paddingLeft: 8 }}>{a}</div>
      ))}
    </div>
  );
}

// ---- テスト入力フォーム（独立コンポーネント：再レンダリングでフォーカスが飛ばない） ----
function TestEditForm({ initialData, onSave, onCancel }) {
  const [data, setData] = useState(initialData);

  const updateField = (field, val) => setData(prev => ({ ...prev, [field]: val }));
  const updateSubject = useCallback((key, field, val) =>
    setData(prev => ({ ...prev, subjects: { ...prev.subjects, [key]: { ...prev.subjects[key], [field]: val } } })),
  []);

  const COMBINED = [
    { key: "2科目", label: "2科目合計", color: "#9B59B6", icon: "📘" },
    { key: "4科目", label: "4科目合計", color: "#E74C3C", icon: "📕" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={onCancel} style={{ border: "none", background: "#f0ece6", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#888" }}>← 戻る</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#7C5CBF" }}>📝 テスト結果を入力</div>
      </div>
      <div style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        {/* 基本情報 */}
        {[["date","📅 受験日","date"],["schoolName","🏫 塾名","text","例：〇〇進学塾"],["testName","📋 テスト名","text","例：第3回一斉学力テスト"]].map(([field,lbl,type,ph]) => (
          <div key={field} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>{lbl}</div>
            <input type={type} value={data[field]} onChange={e => updateField(field, e.target.value)}
              placeholder={ph} style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "2px solid #E8D5FF", fontSize: 14, background: "#FAFAFF", boxSizing: "border-box", outline: "none" }} />
          </div>
        ))}

        {/* 科目別 */}
        <div style={{ fontSize: 13, color: "#7C5CBF", marginBottom: 10, fontWeight: 700 }}>📊 科目別（未入力の科目はスキップ）</div>
        {SUBJECTS.map(s => (
          <SubjectInputBlock key={s} sKey={s} label={s} color={SUBJECT_COLORS[s]} icon={SUBJECT_ICONS[s]}
            subData={data.subjects[s] || {}} onUpdate={updateSubject} />
        ))}

        {/* 2科目・4科目合計 */}
        <div style={{ fontSize: 13, color: "#7C5CBF", marginBottom: 10, fontWeight: 700, marginTop: 4 }}>📊 合計成績（2科目・4科目）</div>
        {COMBINED.map(c => (
          <SubjectInputBlock key={c.key} sKey={c.key} label={c.label} color={c.color} icon={c.icon}
            subData={data.subjects[c.key] || {}} onUpdate={updateSubject} />
        ))}

        {/* 全体コメント */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>💬 テスト全体のコメント</div>
          <textarea value={data.overallComment} onChange={e => updateField("overallComment", e.target.value)}
            placeholder="全体的な感想・反省・次回に向けてなど" rows={3}
            style={{ width: "100%", borderRadius: 12, border: "2px solid #E8D5FF", padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: "#FAFAFF", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
        </div>
        <button onClick={() => onSave(data)} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #7C5CBF, #B39DDB)", border: "none", borderRadius: 16, color: "white", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,92,191,0.3)" }}>
          📝 テスト結果を保存
        </button>
      </div>
    </div>
  );
}

// 科目入力ブロック（メモ化で親の再レンダリングに影響されない）
const SubjectInputBlock = React.memo(function SubjectInputBlock({ sKey, label, color, icon, subData, onUpdate }) {
  const emptyS = { deviation: "", score: "", avg: "", rankNum: "", rankTotal: "", rankFNum: "", rankFTotal: "", comment: "" };
  const sub = { ...emptyS, ...subData };
  return (
    <div style={{ background: color + "10", border: `2px solid ${color}33`, borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
      <div style={{ fontWeight: 700, color, marginBottom: 10, fontSize: 14 }}>{icon} {label}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {[["score","得点"],["avg","平均点"],["deviation","偏差値"]].map(([field, lbl]) => (
          <div key={field} style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3, textAlign: "center" }}>{lbl}</div>
            <input type="number" inputMode="numeric" value={sub[field]}
              onChange={e => onUpdate(sKey, field, e.target.value)}
              placeholder="—" style={{ width: "100%", padding: "7px 4px", borderRadius: 8, border: `2px solid ${color}33`, fontSize: 15, fontWeight: 700, background: "white", boxSizing: "border-box", outline: "none", textAlign: "center" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
        {[["順位（全体）", "rankNum", "rankTotal"], ["男女別順位", "rankFNum", "rankFTotal"]].map(([lbl, numKey, totKey]) => (
          <div key={lbl} style={{ width: "100%" }}>
            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 4, fontWeight: 600 }}>{lbl}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" inputMode="numeric" value={sub[numKey]}
                onChange={e => onUpdate(sKey, numKey, e.target.value)}
                placeholder="—" style={{ flex: 1, minWidth: 0, padding: "7px 4px", borderRadius: 8, border: `2px solid ${color}33`, fontSize: 14, fontWeight: 700, background: "white", boxSizing: "border-box", outline: "none", textAlign: "center" }} />
              <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>位/</span>
              <input type="number" inputMode="numeric" value={sub[totKey]}
                onChange={e => onUpdate(sKey, totKey, e.target.value)}
                placeholder="—" style={{ flex: 1, minWidth: 0, padding: "7px 4px", borderRadius: 8, border: `2px solid ${color}33`, fontSize: 14, fontWeight: 700, background: "white", boxSizing: "border-box", outline: "none", textAlign: "center" }} />
              <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>人</span>
            </div>
          </div>
        ))}
      </div>
      <textarea value={sub.comment} onChange={e => onUpdate(sKey, "comment", e.target.value)}
        placeholder="コメント（任意）" rows={2}
        style={{ width: "100%", borderRadius: 8, border: `2px solid ${color}22`, padding: "7px 10px", fontSize: 12, fontFamily: "inherit", background: "white", resize: "vertical", boxSizing: "border-box", outline: "none" }} />
    </div>
  );
});

// ---- テスト結果タブ ----
function TestTab({ tests, onSave, onDelete }) {
  const [mode, setMode] = useState("list");
  const [editTest, setEditTest] = useState(null);

  const emptySubject = () => ({ deviation: "", score: "", avg: "", rankNum: "", rankTotal: "", rankFNum: "", rankFTotal: "", comment: "" });

  const emptyTest = () => ({
    id: Date.now().toString(),
    date: getJSTDateString(),
    schoolName: "",
    testName: "",
    subjects: {
      国語: emptySubject(), 算数: emptySubject(), 理科: emptySubject(), 社会: emptySubject(),
      "2科目": emptySubject(), "4科目": emptySubject(),
    },
    overallComment: "",
  });

  const handleSave = (data) => {
    onSave(data);
    setMode("list");
    setEditTest(null);
  };

  if (mode === "add" && editTest) {
    return <TestEditForm initialData={editTest} onSave={handleSave} onCancel={() => { setMode("list"); setEditTest(null); }} />;
  }

  // ---- リスト表示 ----
  const sortedTests = [...tests].sort((a,b) => a.date.localeCompare(b.date));
  const ALL_KEYS = [...SUBJECTS, "2科目", "4科目"];
  const ALL_COLORS = { ...SUBJECT_COLORS, "2科目": "#9B59B6", "4科目": "#E74C3C" };
  const ALL_ICONS = { ...SUBJECT_ICONS, "2科目": "📘", "4科目": "📕" };

  const graphKeys = SUBJECTS.filter(k => sortedTests.some(t => t.subjects?.[k]?.deviation));
  const allDevs = sortedTests.flatMap(t => SUBJECTS.map(k => parseFloat(t.subjects?.[k]?.deviation)||0)).filter(v=>v>0);
  const minDev = allDevs.length ? Math.max(20, Math.min(...allDevs) - 5) : 30;
  const maxDev = allDevs.length ? Math.min(80, Math.max(...allDevs) + 5) : 70;
  const GRAPH_H = 150;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#7C5CBF" }}>📝 テスト結果</div>
        <button onClick={() => { setEditTest(emptyTest()); setMode("add"); }}
          style={{ background: "linear-gradient(135deg, #7C5CBF, #B39DDB)", border: "none", borderRadius: 12, padding: "8px 16px", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          ＋ 追加
        </button>
      </div>

      {tests.length === 0 ? (
        <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ color: "#bbb", fontSize: 14 }}>テスト結果を追加してみよう！</div>
        </div>
      ) : (
        <>
          {/* 偏差値推移グラフ */}
          {graphKeys.length > 0 && (
            <div style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 12 }}>📈 偏差値推移</div>
              <div style={{ position: "relative", height: GRAPH_H + 24, marginLeft: 28 }}>
                {Array.from({length: 6}, (_, i) => Math.round(minDev + (maxDev - minDev) * i / 5)).map(v => {
                  const y = GRAPH_H - ((v - minDev) / Math.max(1, maxDev - minDev)) * GRAPH_H;
                  return (
                    <div key={v} style={{ position: "absolute", left: -28, right: 0, top: y }}>
                      <span style={{ fontSize: 9, color: "#ccc", position: "absolute", left: 0 }}>{v}</span>
                      <div style={{ position: "absolute", left: 20, right: 0, height: 1, background: "#f0ece6" }} />
                    </div>
                  );
                })}
                <svg style={{ position: "absolute", top: 0, left: 20, width: "calc(100% - 0px)", height: GRAPH_H }}
                  viewBox={`0 0 ${Math.max(1, sortedTests.length - 1) * 70 + 20} ${GRAPH_H}`} preserveAspectRatio="none">
                  {graphKeys.map(k => {
                    const pts = sortedTests.map((t, i) => {
                      const dev = parseFloat(t.subjects?.[k]?.deviation);
                      if (!dev) return null;
                      const x = sortedTests.length === 1 ? 10 : i * (Math.max(1, sortedTests.length - 1) * 70 / Math.max(1, sortedTests.length - 1)) * (i / Math.max(1, sortedTests.length - 1)) + 10;
                      const xi = sortedTests.length === 1 ? 10 : (i / Math.max(1, sortedTests.length - 1)) * (Math.max(1, sortedTests.length - 1) * 70) + 10;
                      const y = GRAPH_H - ((dev - minDev) / Math.max(1, maxDev - minDev)) * GRAPH_H;
                      return { x: xi, y, dev };
                    });
                    const valid = pts.filter(Boolean);
                    return (
                      <g key={k}>
                        {valid.length > 1 && valid.map((p, i) => i > 0 ? (
                          <line key={i} x1={valid[i-1].x} y1={valid[i-1].y} x2={p.x} y2={p.y}
                            stroke={ALL_COLORS[k]} strokeWidth="2.5" strokeLinecap="round"
                            strokeDasharray={k === "2科目" || k === "4科目" ? "5,3" : "none"} />
                        ) : null)}
                        {valid.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="5" fill={ALL_COLORS[k]} />
                        ))}
                      </g>
                    );
                  })}
                </svg>
                <div style={{ position: "absolute", top: GRAPH_H + 4, left: 20, right: 0, display: "flex", justifyContent: sortedTests.length === 1 ? "center" : "space-between" }}>
                  {sortedTests.map((t, i) => {
                    const pts = t.date.split("-");
                    return <div key={i} style={{ fontSize: 9, color: "#aaa", textAlign: "center" }}>{parseInt(pts[1])}/{parseInt(pts[2])}</div>;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                {graphKeys.map(k => (
                  <span key={k} style={{ fontSize: 11, color: ALL_COLORS[k], fontWeight: 700 }}>● {k}</span>
                ))}
              </div>
            </div>
          )}

          {/* 結果一覧表（偏差値：4科目＋2科目・4科目合計） */}
          {(() => {
            // 実際にデータがある列だけ表示（4科目 + 2科目・4科目合計）
            const tableKeys = ALL_KEYS.filter(k => sortedTests.some(t => t.subjects?.[k]?.deviation));
            if (tableKeys.length === 0) return null;
            return (
              <div style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflowX: "auto" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 12 }}>📋 偏差値一覧</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 320 }}>
                  <thead>
                    <tr style={{ background: "#7C5CBF11" }}>
                      <th style={{ padding: "6px 4px", textAlign: "left", color: "#7C5CBF", borderBottom: "2px solid #E8D5FF", fontSize: 11 }}>日付・塾名</th>
                      {tableKeys.map(k => (
                        <th key={k} style={{ padding: "6px 4px", textAlign: "center", color: ALL_COLORS[k], borderBottom: "2px solid #E8D5FF", fontSize: 11, whiteSpace: "nowrap",
                          borderLeft: (k === "2科目") ? "2px solid #E8D5FF" : undefined }}>
                          {ALL_ICONS[k]}<br/>{k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...sortedTests].reverse().map((t, i) => {
                      const pts = t.date.split("-");
                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid #f0ece6", background: i % 2 === 0 ? "white" : "#FAFAFF" }}>
                          <td style={{ padding: "6px 4px", color: "#555", fontSize: 11 }}>
                            <div style={{ color: "#aaa", fontSize: 10 }}>{parseInt(pts[1])}/{parseInt(pts[2])}</div>
                            <div style={{ fontWeight: 600, maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.schoolName || t.testName}</div>
                          </td>
                          {tableKeys.map(k => {
                            const dev = t.subjects?.[k]?.deviation;
                            return (
                              <td key={k} style={{ padding: "6px 4px", textAlign: "center", fontWeight: dev ? 700 : 400,
                                color: dev ? ALL_COLORS[k] : "#ddd", fontSize: 13,
                                borderLeft: (k === "2科目") ? "2px solid #E8D5FF" : undefined }}>
                                {dev || "—"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* テスト詳細カード */}
          {[...sortedTests].reverse().map(t => (
            <TestCard key={t.id} test={t} onDelete={onDelete} onEdit={() => { setEditTest({ ...emptyTest(), ...t, subjects: { ...emptyTest().subjects, ...t.subjects } }); setMode("add"); }}
              allColors={ALL_COLORS} allIcons={ALL_ICONS} />
          ))}
        </>
      )}
    </div>
  );
}

function TestCard({ test, onDelete, onEdit, allColors = {}, allIcons = {} }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const parts = test.date.split("-");
  const dateStr = `${parseInt(parts[0])}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  const ALL_KEYS = [...SUBJECTS, "2科目", "4科目"];
  const colors = { ...SUBJECT_COLORS, "2科目": "#9B59B6", "4科目": "#E74C3C", ...allColors };
  const icons = { ...SUBJECT_ICONS, "2科目": "📘", "4科目": "📕", ...allIcons };
  const filledKeys = ALL_KEYS.filter(k => test.subjects?.[k]?.deviation || test.subjects?.[k]?.score);

  const fmt = (sub) => {
    const parts = [];
    if (sub.deviation) parts.push(`偏差値${sub.deviation}`);
    if (sub.score) parts.push(`${sub.score}点`);
    if (sub.avg) parts.push(`(平均${sub.avg})`);
    return parts.join(" ");
  };

  return (
    <div style={{ background: "white", borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E8D5FF" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ fontSize: 22 }}>📝</div>
        <div style={{ flex: 1, cursor: "pointer" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{test.testName || "（テスト名未入力）"}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{dateStr}{test.schoolName && ` · ${test.schoolName}`}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            {filledKeys.slice(0,4).map(k => (
              <span key={k} style={{ fontSize: 11, fontWeight: 700, color: colors[k] }}>{icons[k]}{test.subjects[k].deviation || test.subjects[k].score}</span>
            ))}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ border: "none", background: "none", fontSize: 14, cursor: "pointer", color: "#ccc", padding: 4 }}>✏️</button>
        <button onClick={e => { e.stopPropagation(); setConfirmDel(true); }} style={{ border: "none", background: "none", fontSize: 14, cursor: "pointer", color: "#ddd", padding: 4 }}>🗑️</button>
        <div style={{ fontSize: 14, color: "#ccc" }}>{expanded ? "▲" : "▼"}</div>
      </div>
      {confirmDel && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#FFF0F0", borderRadius: 10, border: "1px solid #FFD0D0" }}>
          <div style={{ fontSize: 13, color: "#e05555", marginBottom: 8 }}>この記録を削除しますか？</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onDelete(test.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#FF6B6B", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>削除</button>
            <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #ddd", background: "white", color: "#888", fontSize: 13, cursor: "pointer" }}>キャンセル</button>
          </div>
        </div>
      )}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8D5FF" }}>
          {ALL_KEYS.filter(k => test.subjects?.[k]?.deviation || test.subjects?.[k]?.score || test.subjects?.[k]?.comment).map(k => {
            const sub = test.subjects[k];
            return (
              <div key={k} style={{ marginBottom: 10, background: colors[k]+"12", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, color: colors[k], fontSize: 13, marginBottom: 6 }}>{icons[k]} {k}</div>
                {/* 数値行 */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: sub.comment ? 6 : 0 }}>
                  {sub.deviation && <span style={{ fontSize: 13, color: "#555" }}>偏差値 <strong style={{ color: colors[k] }}>{sub.deviation}</strong></span>}
                  {sub.score && <span style={{ fontSize: 13, color: "#555" }}>得点 <strong>{sub.score}</strong>{sub.avg && <span style={{ color: "#aaa", fontSize: 11 }}>（平均{sub.avg}）</span>}</span>}
                  {sub.rankNum && sub.rankTotal && <span style={{ fontSize: 13, color: "#555" }}>全体 <strong>{sub.rankNum}</strong>/{sub.rankTotal}位</span>}
                  {sub.rankFNum && sub.rankFTotal && <span style={{ fontSize: 13, color: "#555" }}>男女別 <strong>{sub.rankFNum}</strong>/{sub.rankFTotal}位</span>}
                </div>
                {sub.comment && <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>{sub.comment}</div>}
              </div>
            );
          })}
          {test.overallComment && (
            <div style={{ background: "#F8F5FF", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#666", lineHeight: 1.7 }}>
              💬 {test.overallComment}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// 月別アコーディオン
function MonthAccordion({ records, onDelete, onEdit }) {
  const sorted = [...records].sort((a,b) => (b.date+b.timeSlot).localeCompare(a.date+a.timeSlot));
  const months = {};
  sorted.forEach(r => {
    const ym = r.date.substring(0,7);
    if (!months[ym]) months[ym] = [];
    months[ym].push(r);
  });
  const ymKeys = Object.keys(months).sort().reverse();
  const currentYM = new Date().toISOString().substring(0,7);
  const [openMonths, setOpenMonths] = useState(() => {
    const init = {};
    ymKeys.forEach((ym, i) => { init[ym] = (ym === currentYM || i === 0); });
    return init;
  });
  const toggle = (ym) => setOpenMonths(prev => ({ ...prev, [ym]: !prev[ym] }));
  return (
    <div>
      {ymKeys.map(ym => {
        const [y, m] = ym.split("-");
        const isOpen = openMonths[ym];
        const recs = months[ym];
        const totalMins = recs.reduce((a,r) => a + (r.studyMinutes||0), 0);
        return (
          <div key={ym} style={{ marginBottom: 8 }}>
            <div onClick={() => toggle(ym)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: isOpen ? "14px 14px 0 0" : 14,
              background: isOpen ? "linear-gradient(135deg, #5BAD6F, #7BC47F)" : "#F1F8E9",
              border: `2px solid ${isOpen ? "#5BAD6F" : "#C8E6C9"}`,
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: isOpen ? "white" : "#5BAD6F" }}>
                  {parseInt(y)}年{parseInt(m)}月
                </span>
                <span style={{ fontSize: 11, color: isOpen ? "rgba(255,255,255,0.8)" : "#aaa" }}>
                  {recs.length}件 · {fmtMins(totalMins)}
                </span>
              </div>
              <span style={{ fontSize: 14, color: isOpen ? "white" : "#7BC47F", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
            </div>
            {isOpen && (
              <div style={{ border: "2px solid #C8E6C9", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "10px 10px 4px" }}>
                {recs.map((r,i) => <RecordCard key={i} record={r} onDelete={onDelete} onEdit={onEdit} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecordCard({ record, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dateParts3 = (record.date || "").split("-");
  const dateStr = `${parseInt(dateParts3[0])}年${parseInt(dateParts3[1])}月${parseInt(dateParts3[2])}日`;

  const checks = record.dailyChecks || {};
  const checkedCount = DAILY_CHECKS.filter(({ key }) => checks[key]).length;
  const c = record.child || {};
  const p = record.parent || {};

  // 子ども・保護者それぞれ「何か入力されているか」を判定
  const hasChildMood = c.体調 > 0 || c.気持ち > 0 || c.自信度 > 0;
  const hasChildText = c.dekita || c.tsumazuki || c.hitokoto;
  const hasChild = hasChildMood || hasChildText;
  const hasParent = p.goodPoint || p.tsumazuki || p.bestDay || p.姿勢 > 0 || p.気持ち > 0;

  // カードのアクセントカラー：子どものみ→オレンジ、保護者のみ→青緑、両方→グラデ
  const accentColor = hasChild && hasParent ? "#7C5CBF"
    : hasChild ? "#5BAD6F"
    : hasParent ? "#4ECDC4" : "#aaa";

  // ヘッダーアイコン: 子ども気持ちがあればその絵文字、なければスロットアイコン
  const headerIcon = hasChildMood && c.気持ち > 0
    ? SCALE_LABELS["気持ち"][c.気持ち - 1]
    : SLOT_STYLES[record.timeSlot]?.icon || "📝";

  return (
    <div style={{ background: "white", borderRadius: 16, marginBottom: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${accentColor}33`, overflow: "hidden" }}>
      {/* カラーバー */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}66)` }} />
      <div style={{ padding: "12px 16px" }}>
        {/* ヘッダー行 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => setExpanded(!expanded)}>
          <div style={{ fontSize: 22, cursor: "pointer", minWidth: 28 }}>{headerIcon}</div>
          <div style={{ flex: 1, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{dateStr}</span>
              {/* 時間帯バッジ：保護者のみ入力の場合は非表示 */}
              {hasChild && (
                <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 10, background: accentColor + "18", color: accentColor, fontWeight: 700 }}>
                  {SLOT_STYLES[record.timeSlot]?.icon} {record.timeSlot}
                </span>
              )}
            </div>
            {/* 勉強時間・科目：こども入力がある時のみ表示 */}
            {hasChild && (
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                {record.studyMinutes}分 · {(record.subjects || []).join(", ")}
              </div>
            )}
            {/* 入力者バッジ（"あり"なし、アイコンのみ） */}
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {hasChild && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "#F1F8E9", color: "#5BAD6F", fontWeight: 700 }}>🐑 こども</span>}
              {hasParent && <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "#F0FAFA", color: "#4ECDC4", fontWeight: 700 }}>👨‍👩‍👧 保護者</span>}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(record); }} style={{ border: "none", background: "none", fontSize: 14, cursor: "pointer", color: "#aaa", padding: 4 }}>✏️</button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", color: "#ddd", padding: 4 }}>🗑️</button>
          <div style={{ fontSize: 14, color: "#ccc", cursor: "pointer" }}>{expanded ? "▲" : "▼"}</div>
        </div>

        {confirmDelete && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "#FFF0F0", borderRadius: 10, border: "1px solid #FFD0D0" }}>
            <div style={{ fontSize: 13, color: "#e05555", marginBottom: 8 }}>この記録を削除しますか？</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onDelete(record)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#FF6B6B", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>削除する</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #ddd", background: "white", color: "#888", fontSize: 13, cursor: "pointer" }}>キャンセル</button>
            </div>
          </div>
        )}

        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0ece6" }}>

            {/* こどもの記録（実際に入力されている場合のみ） */}
            {hasChild && (
              <div style={{ marginBottom: 12, background: "#F9FBF9", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#5BAD6F", marginBottom: 8 }}>🐑 こどもの記録</div>
                {hasChildMood && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                    {c.体調 > 0 && <span style={{ fontSize: 13 }}>体調 {SCALE_LABELS["体調"][c.体調-1]}</span>}
                    {c.気持ち > 0 && <span style={{ fontSize: 13 }}>気持ち {SCALE_LABELS["気持ち"][c.気持ち-1]}</span>}
                    {c.自信度 > 0 && <span style={{ fontSize: 13 }}>自信度 {SCALE_LABELS["自信度"][c.自信度-1]}</span>}
                  </div>
                )}
                {c.dekita && <div style={{ marginTop: 4, background: "white", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>🌟 {c.dekita}</div>}
                {c.tsumazuki && <div style={{ marginTop: 4, background: "white", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>💭 {c.tsumazuki}</div>}
                {c.hitokoto && <div style={{ marginTop: 4, background: "white", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>💌 {c.hitokoto}</div>}
              </div>
            )}

            {/* 保護者の記録（実際に入力されている場合のみ） */}
            {hasParent && (
              <div style={{ marginBottom: 12, background: "#F0FAFA", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4ECDC4", marginBottom: 8 }}>👨‍👩‍👧 保護者の記録</div>
                {(p.姿勢 > 0 || p.気持ち > 0) && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                    {p.姿勢 > 0 && <span style={{ fontSize: 13 }}>姿勢 {SCALE_LABELS["姿勢"][p.姿勢-1]}</span>}
                    {p.気持ち > 0 && <span style={{ fontSize: 13 }}>気持ち {SCALE_LABELS["気持ち_parent"][p.気持ち-1]}</span>}
                  </div>
                )}
                {p.goodPoint && <div style={{ marginTop: 4, background: "white", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>⭐ {p.goodPoint}</div>}
                {p.tsumazuki && <div style={{ marginTop: 4, background: "white", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>💭 {p.tsumazuki}</div>}
                {p.bestDay && <div style={{ marginTop: 4, background: "white", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>🌟 {p.bestDay}</div>}
              </div>
            )}

            {/* 習慣チェック */}
            {(checkedCount > 0 || record.bestDay) && (
              <div style={{ background: "#F0FFF4", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#96CEB4", marginBottom: 6 }}>✅ 習慣チェック</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DAILY_CHECKS.filter(({ key }) => checks[key]).map(({ key, label, icon }) => (
                    <span key={key} style={{ fontSize: 11, background: "white", borderRadius: 20, padding: "3px 10px", color: "#555" }}>{icon} {label}</span>
                  ))}
                </div>
                {record.bestDay && <div style={{ marginTop: 6, background: "white", borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>🌟 {record.bestDay}</div>}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}


const JUKU_QUIZZES = [
  // ===== 都道府県・県庁所在地（47問）=====
  { subject: "地理", q: "北海道の県庁所在地は？", a: "札幌市" },
  { subject: "地理", q: "青森県の県庁所在地は？", a: "青森市" },
  { subject: "地理", q: "岩手県の県庁所在地は？", a: "盛岡市" },
  { subject: "地理", q: "宮城県の県庁所在地は？", a: "仙台市" },
  { subject: "地理", q: "秋田県の県庁所在地は？", a: "秋田市" },
  { subject: "地理", q: "山形県の県庁所在地は？", a: "山形市" },
  { subject: "地理", q: "福島県の県庁所在地は？", a: "福島市" },
  { subject: "地理", q: "茨城県の県庁所在地は？", a: "水戸市" },
  { subject: "地理", q: "栃木県の県庁所在地は？", a: "宇都宮市" },
  { subject: "地理", q: "群馬県の県庁所在地は？", a: "前橋市" },
  { subject: "地理", q: "埼玉県の県庁所在地は？", a: "さいたま市" },
  { subject: "地理", q: "千葉県の県庁所在地は？", a: "千葉市" },
  { subject: "地理", q: "東京都の都庁所在地は？", a: "新宿区（東京）" },
  { subject: "地理", q: "神奈川県の県庁所在地は？", a: "横浜市" },
  { subject: "地理", q: "新潟県の県庁所在地は？", a: "新潟市" },
  { subject: "地理", q: "富山県の県庁所在地は？", a: "富山市" },
  { subject: "地理", q: "石川県の県庁所在地は？", a: "金沢市" },
  { subject: "地理", q: "福井県の県庁所在地は？", a: "福井市" },
  { subject: "地理", q: "山梨県の県庁所在地は？", a: "甲府市" },
  { subject: "地理", q: "長野県の県庁所在地は？", a: "長野市" },
  { subject: "地理", q: "岐阜県の県庁所在地は？", a: "岐阜市" },
  { subject: "地理", q: "静岡県の県庁所在地は？", a: "静岡市" },
  { subject: "地理", q: "愛知県の県庁所在地は？", a: "名古屋市" },
  { subject: "地理", q: "三重県の県庁所在地は？", a: "津市" },
  { subject: "地理", q: "滋賀県の県庁所在地は？", a: "大津市" },
  { subject: "地理", q: "京都府の府庁所在地は？", a: "京都市" },
  { subject: "地理", q: "大阪府の府庁所在地は？", a: "大阪市" },
  { subject: "地理", q: "兵庫県の県庁所在地は？", a: "神戸市" },
  { subject: "地理", q: "奈良県の県庁所在地は？", a: "奈良市" },
  { subject: "地理", q: "和歌山県の県庁所在地は？", a: "和歌山市" },
  { subject: "地理", q: "鳥取県の県庁所在地は？", a: "鳥取市" },
  { subject: "地理", q: "島根県の県庁所在地は？", a: "松江市" },
  { subject: "地理", q: "岡山県の県庁所在地は？", a: "岡山市" },
  { subject: "地理", q: "広島県の県庁所在地は？", a: "広島市" },
  { subject: "地理", q: "山口県の県庁所在地は？", a: "山口市" },
  { subject: "地理", q: "徳島県の県庁所在地は？", a: "徳島市" },
  { subject: "地理", q: "香川県の県庁所在地は？", a: "高松市" },
  { subject: "地理", q: "愛媛県の県庁所在地は？", a: "松山市" },
  { subject: "地理", q: "高知県の県庁所在地は？", a: "高知市" },
  { subject: "地理", q: "福岡県の県庁所在地は？", a: "福岡市" },
  { subject: "地理", q: "佐賀県の県庁所在地は？", a: "佐賀市" },
  { subject: "地理", q: "長崎県の県庁所在地は？", a: "長崎市" },
  { subject: "地理", q: "熊本県の県庁所在地は？", a: "熊本市" },
  { subject: "地理", q: "大分県の県庁所在地は？", a: "大分市" },
  { subject: "地理", q: "宮崎県の県庁所在地は？", a: "宮崎市" },
  { subject: "地理", q: "鹿児島県の県庁所在地は？", a: "鹿児島市" },
  { subject: "地理", q: "沖縄県の県庁所在地は？", a: "那覇市" },
  // ===== 地理・日本の地形（小5中心）=====
  { subject: "地理", q: "日本で一番長い川は？", a: "信濃川（367km）" },
  { subject: "地理", q: "日本で一番短い川は？", a: "ぶつぶつ川（わずか13.5m、和歌山県）" },
  { subject: "地理", q: "日本で一番広い湖は？", a: "琵琶湖（滋賀県）" },
  { subject: "地理", q: "日本で一番高い山は？", a: "富士山（3776m）" },
  { subject: "地理", q: "日本で一番大きい平野は？", a: "関東平野" },
  { subject: "地理", q: "本州・四国・九州・北海道のうち一番大きい島は？", a: "本州" },
  { subject: "地理", q: "日本最南端の島は？", a: "沖ノ鳥島" },
  { subject: "地理", q: "日本最北端の島は？", a: "択捉島（えとろふとう）" },
  { subject: "地理", q: "日本最東端の島は？", a: "南鳥島" },
  { subject: "地理", q: "日本最西端の島は？", a: "与那国島" },
  { subject: "地理", q: "関東地方は何県何都？", a: "1都6県（東京・神奈川・埼玉・千葉・茨城・栃木・群馬）" },
  { subject: "地理", q: "近畿地方の府県の数は？", a: "2府5県" },
  { subject: "地理", q: "日本アルプスの3つの山脈は？", a: "飛騨山脈・木曽山脈・赤石山脈" },
  { subject: "地理", q: "利根川はどこに注ぐ？", a: "太平洋（銚子市）" },
  { subject: "地理", q: "日本海側に面する政令指定都市は？", a: "新潟市" },
  { subject: "地理", q: "四国にある川で一番長いのは？", a: "四万十川" },
  { subject: "地理", q: "瀬戸内海にある最大の島は？", a: "淡路島" },
  { subject: "地理", q: "津軽海峡をはさむ2つの県は？", a: "青森県と北海道" },
  { subject: "地理", q: "本州と四国を結ぶルートは3つ。瀬戸大橋はどの府県を結ぶ？", a: "岡山県と香川県" },
  // ===== 地理・産業・農業（小5中心）=====
  { subject: "地理", q: "米の生産量が日本一の都道府県は？", a: "新潟県" },
  { subject: "地理", q: "りんごの生産量が日本一の県は？", a: "青森県" },
  { subject: "地理", q: "みかんの生産量が日本一の県は？（近年）", a: "和歌山県" },
  { subject: "地理", q: "桃の生産量が日本一の県は？", a: "山梨県" },
  { subject: "地理", q: "ぶどうの生産量が日本一の県は？", a: "山梨県" },
  { subject: "地理", q: "いちごの生産量が日本一の県は？", a: "栃木県" },
  { subject: "地理", q: "さくらんぼの生産量が日本一の県は？", a: "山形県" },
  { subject: "地理", q: "日本一の漁港といえば？（水揚げ量）", a: "銚子港（千葉県）" },
  { subject: "地理", q: "日本最大の工業地帯は？", a: "中京工業地帯（愛知県中心）" },
  { subject: "地理", q: "自動車生産台数日本一の都道府県は？", a: "愛知県" },
  { subject: "地理", q: "促成栽培が盛んな宮崎・高知で作られる野菜は？", a: "ピーマン・きゅうり・なすなど" },
  { subject: "地理", q: "抑制栽培とは？", a: "涼しい高原などで夏に野菜を育てる栽培法" },
  { subject: "地理", q: "日本の農業で一番多く作られている作物は？", a: "米" },
  { subject: "地理", q: "北海道で盛んな農業形態は？", a: "大規模な畑作・酪農" },
  { subject: "地理", q: "茶の生産量日本一の県は？", a: "静岡県" },
  // ===== 社会・歴史（小5後半〜6年前半）=====
  { subject: "歴史", q: "日本最古の国家（古墳時代の大和政権の中心）はどこ？", a: "大和（奈良）" },
  { subject: "歴史", q: "卑弥呼が治めた国は？", a: "邪馬台国（やまたいこく）" },
  { subject: "歴史", q: "大化の改新は何年？", a: "645年" },
  { subject: "歴史", q: "大化の改新を進めた人物は？", a: "中大兄皇子と中臣鎌足" },
  { subject: "歴史", q: "奈良に都が置かれた時代は？", a: "奈良時代（710〜794年）" },
  { subject: "歴史", q: "東大寺の大仏を建てた天皇は？", a: "聖武天皇" },
  { subject: "歴史", q: "平安京に都を移した天皇は？", a: "桓武天皇（794年）" },
  { subject: "歴史", q: "源氏と平氏が争った戦は？", a: "源平合戦（治承・寿永の乱）" },
  { subject: "歴史", q: "鎌倉幕府を開いたのは誰・何年？", a: "源頼朝・1185年（実質）〜1192年（征夷大将軍）" },
  { subject: "歴史", q: "元寇はいつ？", a: "1274年（文永の役）・1281年（弘安の役）" },
  { subject: "歴史", q: "室町幕府を開いたのは誰？", a: "足利尊氏（1338年）" },
  { subject: "歴史", q: "金閣寺を建てたのは誰？", a: "足利義満" },
  { subject: "歴史", q: "銀閣寺を建てたのは誰？", a: "足利義政" },
  { subject: "歴史", q: "応仁の乱はいつ？", a: "1467年" },
  { subject: "歴史", q: "鉄砲が日本に伝わったのはいつ・どこで？", a: "1543年・種子島" },
  { subject: "歴史", q: "キリスト教を日本に伝えたのは誰？", a: "フランシスコ・ザビエル（1549年）" },
  { subject: "歴史", q: "桶狭間の戦いで今川義元を破ったのは？", a: "織田信長（1560年）" },
  { subject: "歴史", q: "本能寺の変はいつ？誰が裏切った？", a: "1582年・明智光秀" },
  { subject: "歴史", q: "太閤検地・刀狩りを行った人物は？", a: "豊臣秀吉" },
  { subject: "歴史", q: "関ヶ原の戦いはいつ？", a: "1600年" },
  { subject: "歴史", q: "江戸幕府を開いたのは誰・何年？", a: "徳川家康・1603年" },
  { subject: "歴史", q: "参勤交代を制度化した将軍は？", a: "徳川家光" },
  { subject: "歴史", q: "鎖国を完成させた将軍は？", a: "徳川家光（1639年）" },
  { subject: "歴史", q: "元禄文化の時代の将軍は？", a: "徳川綱吉" },
  { subject: "歴史", q: "享保の改革を行った将軍は？", a: "徳川吉宗" },
  { subject: "歴史", q: "ペリーが浦賀に来たのはいつ？", a: "1853年" },
  { subject: "歴史", q: "明治維新はいつ？", a: "1868年" },
  { subject: "歴史", q: "廃藩置県はいつ？", a: "1871年" },
  { subject: "歴史", q: "日清戦争はいつ？", a: "1894〜1895年" },
  { subject: "歴史", q: "日露戦争はいつ？", a: "1904〜1905年" },
  { subject: "歴史", q: "第一次世界大戦はいつ？", a: "1914〜1918年" },
  { subject: "歴史", q: "関東大震災はいつ？", a: "1923年" },
  { subject: "歴史", q: "太平洋戦争の開戦はいつ？", a: "1941年12月8日" },
  { subject: "歴史", q: "広島に原爆が投下されたのはいつ？", a: "1945年8月6日" },
  { subject: "歴史", q: "終戦はいつ？", a: "1945年8月15日" },
  { subject: "歴史", q: "日本国憲法が公布されたのはいつ？", a: "1946年11月3日" },
  { subject: "歴史", q: "日本国憲法が施行されたのはいつ？", a: "1947年5月3日" },
  { subject: "歴史", q: "日本が国連に加盟したのはいつ？", a: "1956年" },
  { subject: "歴史", q: "東京オリンピック（第1回）はいつ？", a: "1964年" },
  // ===== 理科・植物（小5）=====
  { subject: "理科", q: "花粉が同じ花のめしべにつくことを何という？", a: "自家受粉" },
  { subject: "理科", q: "花粉が別の花のめしべにつくことを何という？", a: "他家受粉" },
  { subject: "理科", q: "受粉後、めしべの根元が変化してできるものは？", a: "果実（かじつ）" },
  { subject: "理科", q: "種子植物のうち、胚珠が子房の中にある植物を何という？", a: "被子植物" },
  { subject: "理科", q: "種子植物のうち、胚珠がむき出しの植物を何という？", a: "裸子植物（マツ・スギなど）" },
  { subject: "理科", q: "光合成が行われる葉の細胞の中の緑色の粒は？", a: "葉緑体（ようりょくたい）" },
  { subject: "理科", q: "植物が水蒸気を葉から出すことを何という？", a: "蒸散（じょうさん）" },
  { subject: "理科", q: "根から吸い上げた水が通る管は？", a: "道管（どうかん）" },
  { subject: "理科", q: "葉で作った養分が通る管は？", a: "師管（しかん）" },
  { subject: "理科", q: "双子葉植物の葉脈の形は？", a: "網状脈（もうじょうみゃく）" },
  { subject: "理科", q: "単子葉植物の葉脈の形は？", a: "平行脈（へいこうみゃく）" },
  { subject: "理科", q: "双子葉植物の根の形は？", a: "主根と側根" },
  { subject: "理科", q: "単子葉植物の根の形は？", a: "ひげ根" },
  // ===== 理科・天体（小5）=====
  { subject: "理科", q: "地球が太陽の周りを回ることを何という？", a: "公転（こうてん）" },
  { subject: "理科", q: "地球が1回公転するのにかかる時間は？", a: "約365日（1年）" },
  { subject: "理科", q: "地球の自転の向きは？（北極側から見て）", a: "反時計回り（西→東）" },
  { subject: "理科", q: "月が地球の周りを1周するのにかかる時間は？", a: "約27.3日（約1か月）" },
  { subject: "理科", q: "月食とは何？", a: "地球の影に月が入る現象" },
  { subject: "理科", q: "日食とは何？", a: "月が太陽を隠す現象" },
  { subject: "理科", q: "夏に南の空で見られる大三角の星は？", a: "ベガ・デネブ・アルタイル" },
  { subject: "理科", q: "冬の大三角の星は？", a: "シリウス・ベテルギウス・プロキオン" },
  { subject: "理科", q: "北極星がある星座は？", a: "こぐま座" },
  { subject: "理科", q: "太陽系の惑星の数は？", a: "8個（水金地火木土天海）" },
  { subject: "理科", q: "地球に一番近い惑星は？（距離が近いもの）", a: "金星（または火星）" },
  { subject: "理科", q: "太陽系で一番大きい惑星は？", a: "木星" },
  { subject: "理科", q: "太陽系で輪を持つ惑星は？", a: "土星（最も有名）、他に天王星・海王星・木星にも輪がある" },
  // ===== 理科・天気（小5）=====
  { subject: "理科", q: "雲をつくる主なものは何？", a: "小さな水滴や氷の粒" },
  { subject: "理科", q: "天気図で丸い線（等圧線）が混んでいるほど？", a: "風が強い" },
  { subject: "理科", q: "日本の天気は主にどちらの方向に動く？", a: "西から東" },
  { subject: "理科", q: "梅雨の原因となる2つの気団は？", a: "小笠原気団とオホーツク海気団" },
  { subject: "理科", q: "夏に日本を覆う気団は？", a: "小笠原気団（高温多湿）" },
  { subject: "理科", q: "冬に日本に寒さをもたらす気団は？", a: "シベリア気団（寒冷乾燥）" },
  { subject: "理科", q: "日本海側が冬に雪が多い理由は？", a: "シベリアからの冷たい風が日本海で水分を含むから" },
  // ===== 理科・物質（小5）=====
  { subject: "理科", q: "食塩水で食塩のように溶けているものを何という？", a: "溶質（ようしつ）" },
  { subject: "理科", q: "食塩水で水のように溶かしているものを何という？", a: "溶媒（ようばい）" },
  { subject: "理科", q: "水に溶けたものは水の中でどうなる？", a: "均一に広がる（目に見えなくなる）" },
  { subject: "理科", q: "一定量の水に溶ける物質の量の上限を何という？", a: "溶解度（ようかいど）" },
  { subject: "理科", q: "温度を下げて結晶を取り出す方法を何という？", a: "再結晶（さいけっしょう）" },
  { subject: "理科", q: "物が燃えるために必要な3つの条件は？", a: "燃えるもの・酸素・温度（発火点以上）" },
  { subject: "理科", q: "二酸化炭素を石灰水に通すとどうなる？", a: "白くにごる" },
  { subject: "理科", q: "酸素の性質を2つあげると？", a: "ものを燃やすはたらきがある・無色無臭" },
  // ===== 理科・人体（小5〜6年）=====
  { subject: "理科", q: "心臓から血液が出るときに通る血管は？", a: "動脈（どうみゃく）" },
  { subject: "理科", q: "心臓に血液が戻るときに通る血管は？", a: "静脈（じょうみゃく）" },
  { subject: "理科", q: "酸素を運ぶ血液中の成分は？", a: "赤血球（ヘモグロビン）" },
  { subject: "理科", q: "体の中で最も大きい臓器は？", a: "肝臓" },
  { subject: "理科", q: "だ液が消化するものは？", a: "デンプン（炭水化物）" },
  { subject: "理科", q: "胃液が消化するものは？", a: "タンパク質" },
  { subject: "理科", q: "消化された栄養を吸収する主な場所は？", a: "小腸（柔毛）" },
  { subject: "理科", q: "息を吸うとき、横隔膜はどう動く？", a: "下がる（肺が広がる）" },
  // ===== 理科・力と電気（小5）=====
  { subject: "理科", q: "電流の流れる向きは？（電池のプラス極から）", a: "プラス極→回路→マイナス極" },
  { subject: "理科", q: "直列つなぎと並列つなぎで電球が明るいのは？", a: "並列つなぎ（電圧が同じ）" },
  { subject: "理科", q: "電磁石が強くなる方法を2つあげると？", a: "コイルの巻き数を増やす・電流を強くする" },
  { subject: "理科", q: "てこが釣り合う条件は？", a: "左のおもり×距離＝右のおもり×距離" },
  { subject: "理科", q: "ふりこの周期を決める要因は？", a: "ふりこの長さだけ（重さや振れ幅は関係ない）" },
  // ===== 算数・比・割合（小5中心）=====
  { subject: "算数", q: "割合の公式は？", a: "割合＝比べる量÷もとにする量" },
  { subject: "算数", q: "百分率で80%を小数で表すと？", a: "0.8" },
  { subject: "算数", q: "歩合で3割5分は百分率で何%？", a: "35%" },
  { subject: "算数", q: "比の値とは？例：3:4の比の値は？", a: "前の数÷後の数。3:4→3÷4＝0.75" },
  { subject: "算数", q: "比を簡単にする：12:18は？", a: "2:3" },
  { subject: "算数", q: "速さの3つの公式は？", a: "速さ＝距離÷時間、距離＝速さ×時間、時間＝距離÷速さ" },
  { subject: "算数", q: "時速90kmは分速何m？", a: "分速1500m（÷60×1000）" },
  { subject: "算数", q: "面積の単位：1ha（ヘクタール）＝何m²？", a: "10000m²" },
  { subject: "算数", q: "体積の単位：1m³＝何cm³？", a: "1000000cm³（100×100×100）" },
  { subject: "算数", q: "四角形の種類：向かい合う辺が平行な四角形は？", a: "平行四辺形（台形・正方形・長方形・ひし形も含む）" },
  { subject: "算数", q: "ひし形の面積の公式は？", a: "対角線×対角線÷2" },
  { subject: "算数", q: "円の面積の公式は？", a: "半径×半径×3.14" },
  { subject: "算数", q: "三角形の3辺の長さが3,4,5のとき何三角形？", a: "直角三角形（3²+4²=5²）" },
  { subject: "算数", q: "1から10の整数の平均は？", a: "5.5" },
  { subject: "算数", q: "植木算：両端に植える。20mを4m間隔で何本？", a: "6本（20÷4+1）" },
  { subject: "算数", q: "植木算：輪のように植える。20mを4m間隔で何本？", a: "5本（20÷4）" },
  { subject: "算数", q: "通過算：長さ100mの電車が秒速20mで200mのトンネルを通過する時間は？", a: "15秒（（100+200）÷20）" },
  { subject: "算数", q: "仕事算：Aさんが6日、Bさんが4日でできる仕事。2人でやると何日？", a: "2.4日（1/6+1/4=5/12、12/5=2.4）" },
  { subject: "算数", q: "場合の数：3枚のカード1,2,3から2枚選んで並べると何通り？", a: "6通り（3×2）" },
  { subject: "算数", q: "最小公倍数の求め方（12と18）は？", a: "素因数分解：2²×3²＝36" },
  // ===== 国語・ことわざ・慣用句（重要）=====
  { subject: "国語", q: "「猿も木から落ちる」の意味は？", a: "どんな名人でも失敗することがある" },
  { subject: "国語", q: "「海老で鯛を釣る」の意味は？", a: "少ない元手で大きな利益を得ること" },
  { subject: "国語", q: "「棚からぼたもち」の意味は？", a: "思いがけない幸運が転がり込んでくること" },
  { subject: "国語", q: "「七転び八起き」の意味は？", a: "何度失敗してもあきらめずに立ち上がること" },
  { subject: "国語", q: "「弘法にも筆の誤り」の意味は？", a: "どんな名人・達人でも失敗することがある" },
  { subject: "国語", q: "「石橋をたたいて渡る」の意味は？", a: "用心に用心を重ねて慎重に行動すること" },
  { subject: "国語", q: "「目から鱗が落ちる」の意味は？", a: "急に物事の本質がわかること" },
  { subject: "国語", q: "「足元に火がつく」の意味は？", a: "差し迫った危険が近づいてくること" },
  { subject: "国語", q: "「耳にたこができる」の意味は？", a: "同じことを何度も聞かされて嫌になること" },
  { subject: "国語", q: "「鼻が高い」の意味は？", a: "誇りに思う・得意になること" },
  { subject: "国語", q: "「腹を割る」の意味は？", a: "本音を話すこと" },
  { subject: "国語", q: "「肩を持つ」の意味は？", a: "一方の味方をすること" },
  { subject: "国語", q: "「口が堅い」の意味は？", a: "秘密をしっかり守ること" },
  { subject: "国語", q: "「頭が上がらない」の意味は？", a: "相手に対して対等に振る舞えないこと" },
  { subject: "国語", q: "「水に流す」の意味は？", a: "過去のことをなかったことにして許すこと" },
  // ===== 国語・四字熟語（重要）=====
  { subject: "国語", q: "「一石二鳥」の意味は？", a: "ひとつのことで二つの利益を得ること" },
  { subject: "国語", q: "「以心伝心」の意味は？", a: "言葉を使わずに気持ちが通じ合うこと" },
  { subject: "国語", q: "「四面楚歌」の意味は？", a: "周囲が敵ばかりで孤立すること" },
  { subject: "国語", q: "「温故知新」の意味は？", a: "昔のことを学び、新しい知識を得ること" },
  { subject: "国語", q: "「臥薪嘗胆」の読みと意味は？", a: "がしんしょうたん。目的のために苦労に耐えること" },
  { subject: "国語", q: "「五里霧中」の意味は？", a: "方針が立たず、どうしてよいかわからない状態" },
  { subject: "国語", q: "「大器晩成」の意味は？", a: "大物は遅れて頭角を現すこと" },
  { subject: "国語", q: "「自業自得」の意味は？", a: "自分のした行いの結果を自分で受けること" },
  { subject: "国語", q: "「一期一会」の読みと意味は？", a: "いちごいちえ。一生に一度の出会いを大切にすること" },
  { subject: "国語", q: "「付和雷同」の意味は？", a: "自分の意見がなく、他人に同調すること" },
  // ===== 国語・古典・文学（重要）=====
  { subject: "国語", q: "「枕草子」の書き出しは？", a: "春はあけぼの" },
  { subject: "国語", q: "「徒然草」の書き出しは？", a: "つれづれなるままに" },
  { subject: "国語", q: "「平家物語」の書き出しは？", a: "祇園精舎の鐘の声、諸行無常の響きあり" },
  { subject: "国語", q: "「奥の細道」の書き出しは？", a: "月日は百代の過客にして" },
  { subject: "国語", q: "俳句・短歌の違いは？", a: "俳句は五七五（17音）、短歌は五七五七七（31音）" },
  { subject: "国語", q: "「古池や蛙飛び込む水の音」の作者は？", a: "松尾芭蕉" },
  { subject: "国語", q: "「春の海ひねもすのたりのたりかな」の作者は？", a: "与謝蕪村（よさぶそん）" },
  { subject: "国語", q: "「雪とけて村いっぱいの子どもかな」の作者は？", a: "小林一茶" },
  { subject: "国語", q: "「坊っちゃん」の作者は？", a: "夏目漱石" },
  { subject: "国語", q: "「ごんぎつね」の作者は？", a: "新美南吉（にいみなんきち）" },
  { subject: "国語", q: "「注文の多い料理店」の作者は？", a: "宮沢賢治" },
  { subject: "国語", q: "「銀河鉄道の夜」の作者は？", a: "宮沢賢治" },
  { subject: "国語", q: "「ちいちゃんのかげおくり」の作者は？", a: "あまんきみこ" },
  // ===== 公民・政治（小6内容・入試頻出）=====
  { subject: "公民", q: "日本国憲法の三大原則は？", a: "国民主権・基本的人権の尊重・平和主義" },
  { subject: "公民", q: "国会の種類を3つあげると？", a: "通常国会・臨時国会・特別国会" },
  { subject: "公民", q: "衆議院の議員の任期は？", a: "4年（解散あり）" },
  { subject: "公民", q: "参議院の議員の任期は？", a: "6年（3年ごとに半数改選）" },
  { subject: "公民", q: "最高裁判所の裁判官を国民が審査することを何という？", a: "国民審査" },
  { subject: "公民", q: "選挙権が与えられる年齢は？", a: "18歳以上" },
  { subject: "公民", q: "内閣総理大臣を指名するのは？", a: "国会" },
  { subject: "公民", q: "法律を制定するのはどこ？", a: "国会（立法機関）" },
  { subject: "公民", q: "地方公共団体の長（知事・市長など）の任期は？", a: "4年" },
  { subject: "公民", q: "消費税が初めて導入された年は？", a: "1989年（3%）" },
  // ===== 算数・規則性・数列（小5）=====
  { subject: "算数", q: "等差数列：2,5,8,11,…の次の数は？", a: "14（＋3ずつ）" },
  { subject: "算数", q: "等比数列：2,6,18,54,…の次の数は？", a: "162（×3ずつ）" },
  { subject: "算数", q: "1から始まる奇数の和：1+3+5+…+19は？", a: "100（10²）" },
  { subject: "算数", q: "三角数とは？最初の5つは？", a: "1,3,6,10,15（前の数に2,3,4,5…を足す）" },
  { subject: "算数", q: "分数の逆数とは？3/4の逆数は？", a: "分母と分子を入れ替えた数。4/3" },
  { subject: "算数", q: "素数を小さい順に5つあげると？", a: "2,3,5,7,11" },
  { subject: "算数", q: "100以下の素数の数は？", a: "25個" },
  { subject: "算数", q: "2の乗数：2¹〜2⁸を順に言うと？", a: "2,4,8,16,32,64,128,256" },
  { subject: "算数", q: "n角形の内角の和の公式は？", a: "180°×(n-2)" },
  { subject: "算数", q: "正多角形の1つの内角：正五角形は？", a: "108°（540÷5）" },
  // ===== 理科・昆虫・生物（小3〜5）=====
  { subject: "理科", q: "完全変態をする昆虫を3つあげると？", a: "モンシロチョウ・カブトムシ・ミツバチ（卵→幼虫→さなぎ→成虫）" },
  { subject: "理科", q: "不完全変態をする昆虫を3つあげると？", a: "バッタ・トンボ・セミ（卵→幼虫→成虫）" },
  { subject: "理科", q: "昆虫の特徴は？", a: "体が頭・胸・腹の3つに分かれ、足が6本" },
  { subject: "理科", q: "クモは昆虫か？", a: "違う（足が8本・節足動物だが昆虫ではない）" },
  { subject: "理科", q: "メダカのオスとメスを見分ける方法は？", a: "オスは背びれに切れ込み・しりびれが平行四辺形、メスは丸い" },
  { subject: "理科", q: "アブラナの花びらの枚数は？", a: "4枚" },
  { subject: "理科", q: "ヘチマの花で花粉をつくるのはどちら？", a: "おばな（雄花）" },
  { subject: "理科", q: "でんぷんがあるか調べる液体は？", a: "ヨウ素液（青紫色になればでんぷんあり）" },
  // ===== 地理・日本の気候・自然（小5）=====
  { subject: "地理", q: "太平洋側の冬の天気の特徴は？", a: "晴れが続き、乾燥する" },
  { subject: "地理", q: "日本海側の冬の天気の特徴は？", a: "雪が多く降る（曇りや雪の日が多い）" },
  { subject: "地理", q: "内陸の気候の特徴は？", a: "夏と冬の気温差が大きく、雨が少ない" },
  { subject: "地理", q: "北海道の気候の特徴は？", a: "冷涼で梅雨がない" },
  { subject: "地理", q: "沖縄の気候の特徴は？", a: "1年中温暖で台風が多い" },
  { subject: "地理", q: "フォッサマグナとは何？", a: "日本列島を東西に分ける大地溝帯" },
  { subject: "地理", q: "リアス海岸が見られる場所を2つあげると？", a: "三陸海岸・志摩半島・若狭湾など" },
  { subject: "地理", q: "日本の世界遺産（文化遺産）を1つあげると？", a: "法隆寺・日光東照宮・姫路城・屋久島（自然）など" },
  { subject: "地理", q: "季節風（モンスーン）とは？", a: "季節によって向きが変わる風" },
  { subject: "地理", q: "台風はどちらの方向に進むことが多い？", a: "最初は北西、日本付近では北東に向きを変える" },
  // ===== 追加30問（地理・歴史・理科）=====
  { subject: "地理", q: "日本の電力で一番多い発電方法は？（2020年代）", a: "火力発電（LNG・石炭・石油）" },
  { subject: "地理", q: "水力発電が盛んな地域は？", a: "山がちな内陸（富山・長野・岐阜など）" },
  { subject: "地理", q: "日本の食料自給率（カロリーベース）はおよそ何%？", a: "約38%（2020年代）" },
  { subject: "地理", q: "過疎化とは？", a: "人口が減り、地域社会が維持しにくくなること" },
  { subject: "地理", q: "日本最大の貿易相手国は？（輸出入合計）", a: "中国" },
  { subject: "地理", q: "世界最大の湖は？", a: "カスピ海" },
  { subject: "地理", q: "世界最長の川は？", a: "ナイル川" },
  { subject: "地理", q: "アジア最高峰の山は？", a: "エベレスト（8849m）" },
  { subject: "地理", q: "日本のほぼ真ん中を通る緯線は？", a: "北緯35〜36度あたり（東京付近）" },
  { subject: "地理", q: "東経135度が通る都市は？（日本の標準時子午線）", a: "兵庫県明石市" },
  { subject: "歴史", q: "聖徳太子が定めた17条の憲法は何年？", a: "604年" },
  { subject: "歴史", q: "遣唐使を廃止したのは誰？", a: "菅原道真（894年）" },
  { subject: "歴史", q: "平将門の乱・藤原純友の乱を合わせて何という？", a: "承平・天慶の乱" },
  { subject: "歴史", q: "後醍醐天皇が行った政治を何という？", a: "建武の新政（1333年）" },
  { subject: "歴史", q: "秀吉が行った朝鮮出兵を何という？（2回）", a: "文禄の役・慶長の役" },
  { subject: "歴史", q: "江戸時代の三大改革は？", a: "享保の改革・寛政の改革・天保の改革" },
  { subject: "歴史", q: "黒船来航後に結ばれた不平等条約は？", a: "日米修好通商条約（1858年）" },
  { subject: "歴史", q: "西南戦争を起こした人物は？", a: "西郷隆盛（1877年）" },
  { subject: "歴史", q: "日本で最初の本格的な憲法は何年発布？", a: "大日本帝国憲法（1889年）" },
  { subject: "歴史", q: "二・二六事件はいつ？", a: "1936年" },
  { subject: "理科", q: "地層が堆積した時代を推定できる化石を何という？", a: "示準化石（しじゅんかせき）" },
  { subject: "理科", q: "その土地の当時の環境を示す化石を何という？", a: "示相化石（しそうかせき）" },
  { subject: "理科", q: "火山岩と深成岩の違いは？", a: "火山岩はマグマが地表付近で急冷、深成岩は地下深くでゆっくり冷えた" },
  { subject: "理科", q: "花こう岩は火山岩？深成岩？", a: "深成岩（白っぽい・粒が大きい）" },
  { subject: "理科", q: "流れる水の3つのはたらきは？", a: "侵食・運搬・堆積" },
  { subject: "理科", q: "川の上流と下流で石の形の違いは？", a: "上流は角ばった大きい石、下流は丸い小さい石" },
  { subject: "理科", q: "日本付近のプレートは何枚？", a: "4枚（太平洋・フィリピン海・ユーラシア・北米）" },
  { subject: "公民", q: "三権分立を説いた思想家は？", a: "モンテスキュー（フランス）" },
  { subject: "公民", q: "社会契約説を唱えた思想家は？", a: "ルソー（フランス）" },
  { subject: "公民", q: "国連の安全保障理事会の常任理事国は？（5か国）", a: "アメリカ・イギリス・フランス・ロシア・中国" },
];

const QUIZ_SUBJECT_COLORS = { 算数: "#FF6B6B", 国語: "#4ECDC4", 理科: "#45B7D1", 社会: "#96CEB4", 地理: "#96CEB4", 歴史: "#C9A84C", 公民: "#9B59B6" };

const OMOCHI_QUIZ_SAYS = [ // もこクイズのセリフ
  "さあ問題だよ🐑 もこもこ覚えていこう！",
  "もこからの挑戦状だよ🐑 わかるかな？",
  "草原ラン止めて問題に集中！🐑",
  "これ知ってる？もこは知ってるよ🐑✨",
  "一緒に覚えていこうね🐑📚",
  "答えがわかったらタップしてね！🐑👆",
  "もこも一緒に覚えるよ🐑 がんばれ！",
  "毎日もこもこ覚えれば大丈夫！🐑",
];

function QuizCard() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * JUKU_QUIZZES.length));
  const [showAnswer, setShowAnswer] = useState(false);
  const [sayIdx] = useState(() => Math.floor(Math.random() * OMOCHI_QUIZ_SAYS.length));
  const quiz = JUKU_QUIZZES[idx];
  const color = QUIZ_SUBJECT_COLORS[quiz.subject] || "#96CEB4";

  const next = () => {
    setIdx(i => {
      let n = Math.floor(Math.random() * JUKU_QUIZZES.length);
      if (n === i) n = (n + 1) % JUKU_QUIZZES.length;
      return n;
    });
    setShowAnswer(false);
  };

  return (
    <div style={{ background: "white", borderRadius: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: `2px solid ${color}33`, overflow: "hidden" }}>
      {/* もこヘッダー */}
      <div style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)`, padding: "12px 16px", borderBottom: `1px solid ${color}22` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>🐑</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 2 }}>もこクイズ</div>
            <div style={{ fontSize: 12, color: "#777", lineHeight: 1.4 }}>{OMOCHI_QUIZ_SAYS[sayIdx]}</div>
          </div>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: color, color: "white", fontWeight: 800 }}>{quiz.subject}</span>
        </div>
      </div>
      {/* 問題 */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#333", lineHeight: 1.7, marginBottom: 14 }}>
          Q. {quiz.q}
        </div>
        {showAnswer ? (
          <div style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)`, borderRadius: 14, padding: "12px 14px", marginBottom: 12, border: `1.5px solid ${color}44` }}>
            <div style={{ fontSize: 11, color, fontWeight: 800, marginBottom: 4 }}>✅ こたえ</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#333", lineHeight: 1.6 }}>{quiz.a}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>もこも覚えたよ🐑 次の問題に行こう！</div>
          </div>
        ) : (
          <button onClick={() => setShowAnswer(true)} style={{
            width: "100%", padding: "12px", borderRadius: 14, border: `2px dashed ${color}88`,
            background: color + "10", color, fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 12,
            transition: "all 0.15s",
          }}>
            👆 タップして答えを見る
          </button>
        )}
      </div>
      {/* フッター */}
      <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#ccc" }}>全{JUKU_QUIZZES.length}問</span>
        <button onClick={next} style={{
          padding: "8px 18px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer",
          boxShadow: `0 3px 10px ${color}44`,
        }}>
          次の問題 ➡️
        </button>
      </div>
    </div>
  );
}

function SavedOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", animation: "fadeIn 0.15s ease" }}>
      <div style={{ background: "white", borderRadius: 32, padding: "44px 48px", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", animation: "popIn 0.2s ease" }}>
        <div style={{ fontSize: 80, marginBottom: 16, animation: "bounce 0.4s ease" }}>🐑</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#5BAD6F", marginBottom: 8 }}>きろく完了！</div>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 15, color: "#aaa" }}>もこも喜んでるよ🎉</div>
      </div>
    </div>
  );
}

// ---- スプシのCSVデータをパースしてrecords形式に変換 ----
function parseSheetRows(rows) {
  // rows[0]はヘッダー行、rows[1]以降がデータ
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).map((row) => {
    const get = (i) => (row[i] || "").toString().trim();
    return {
      date: get(0).substring(0, 10),  // "2026-02-28 14:30:00" → "2026-02-28"
      timeSlot: get(1),
      studyMinutes: parseInt(get(2)) || 0,
      subjects: get(3) ? get(3).split("/") : [],
subjectMinutes: (() => {
        // 新列（19〜22）に科目別分数があればそれを使う、なければ均等割り（旧データ互換）
        const sm算数 = parseInt(get(19)) || 0;
        const sm国語 = parseInt(get(20)) || 0;
        const sm理科 = parseInt(get(21)) || 0;
        const sm社会 = parseInt(get(22)) || 0;
        const hasNew = sm算数 + sm国語 + sm理科 + sm社会 > 0;
        if (hasNew) return { 算数: sm算数, 国語: sm国語, 理科: sm理科, 社会: sm社会 };
        // 旧データ：科目名だけある場合は均等割り
        const subs = get(3) ? get(3).split("/") : [];
        const total = parseInt(get(2)) || 0;
        const each = subs.length > 0 ? Math.round(total / subs.length / 5) * 5 : 0;
        return { 算数: subs.includes("算数") ? each : 0, 国語: subs.includes("国語") ? each : 0, 理科: subs.includes("理科") ? each : 0, 社会: subs.includes("社会") ? each : 0 };
      })(),
      child: {
        体調: parseInt(get(4)) || 0,
        気持ち: parseInt(get(5)) || 0,
        自信度: parseInt(get(6)) || 0,
        dekita: get(7),
        tsumazuki: get(8),
        hitokoto: get(9),
      },
      parent: {
        姿勢: parseInt(get(10)) || 0,
        気持ち: parseInt(get(11)) || 0,
        goodPoint: get(12),
        tsumazuki: get(13),   // 親:dekita は削除済み → 13=親:つまづき
      },
      dailyChecks: {
        meal: get(14) === "○",   // 14=チェック:ご飯
        sleep: get(15) === "○",  // 15=チェック:睡眠
        book: get(16) === "○",   // 16=チェック:読書
        rest: get(17) === "○",   // 17=チェック:休憩
        talk: get(18) === "○",   // 18=チェック:おしゃべり
      },
      bestDay: get(23),          // 23=最高だったこと
      recordedAt: get(24),       // 24=記録日時(アプリ)
    };
  }).filter(r => r.date);
}

// テスト結果シートの行をパース
function parseTestRows(rows) {
  if (!rows || rows.length < 2) return [];
  // ヘッダー行をスキップ
  return rows.slice(1).map((row) => {
    const g = (i) => (row[i] || "").toString().trim();

    // 日付パース：スプシのDate型・文字列型どちらも YYYY-MM-DD に変換
    const parseDate = (val) => {
      if (!val) return "";
      const s = val.toString().trim();
      // 既に YYYY-MM-DD 形式
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
      // GASがDate型で返した場合 (例: "Sat Feb 28 2026 00:00:00 GMT+0900")
      // または "2026/01/10" 形式
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
        return jst.toISOString().split("T")[0];
      }
      // "2026/01/10" → "2026-01-10"
      return s.replace(/\//g, "-").substring(0, 10);
    };

    const parseSub = (offset) => ({
      deviation: g(offset),
      score: g(offset + 1),
      avg: g(offset + 2),
      rankNum: g(offset + 3),
      rankTotal: g(offset + 4),
      rankFNum: g(offset + 5),
      rankFTotal: g(offset + 6),
    });
    const parseSub8 = (offset) => ({ ...parseSub(offset), comment: g(offset + 7) });
    return {
      id: g(0) || Date.now().toString(),
      date: parseDate(row[1]),
      schoolName: g(2),
      testName: g(3),
      subjects: {
        算数: parseSub8(4),
        国語: parseSub8(12),
        理科: parseSub8(20),
        社会: parseSub8(28),
        "2科目": parseSub(36),
        "4科目": parseSub(43),
      },
      overallComment: g(50),
    };
  }).filter(r => r.date);
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [records, setRecords] = useState([]);
  const [today, setToday] = useState({
    date: getJSTDateString(),
    timeSlot: "朝",
    studyMinutes: 0,
    subjectMinutes: { 算数: 0, 国語: 0, 理科: 0, 社会: 0 },
    subjects: [],
    child: { 体調: 0, 気持ち: 0, 自信度: 0, dekita: "", tsumazuki: "", hitokoto: "" },
    parent: { 姿勢: 0, goodPoint: "", 気持ち: 0, tsumazuki: "" },
    dailyChecks: {},
    bestDay: "",
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // 編集中の記録
  const [gasUrl, setGasUrl] = useState(GAS_URL);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [omochiMsg, setOmochiMsg] = useState("");
  const [tests, setTests] = useState([]);

  // 起動時にスプシからデータを読み込む
  useEffect(() => {
    const loadFromSheet = async () => {
      setLoading(true);
      try {
        const url = gasUrl || GAS_URL;
        const res = await fetch(`${url}?action=getAll`);
        if (res.ok) {
          const json = await res.json();
          if (json.rows && json.rows.length > 0) {
            const parsed = parseSheetRows(json.rows);
            setRecords(parsed);
          }
        }
      } catch (e) {
        // スプシ読み込み失敗時はlocalStorageにフォールバック
        try {
          const raw = localStorage.getItem("hitsuji_records");
          if (raw) setRecords(JSON.parse(raw));
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    const loadTestsFromSheet = async () => {
      try {
        const url = gasUrl || GAS_URL;
        const res = await fetch(`${url}?action=getTests`);
        if (res.ok) {
          const json = await res.json();
          if (json.rows && json.rows.length > 0) {
            const parsed = parseTestRows(json.rows);
            if (parsed.length > 0) setTests(parsed);
          }
        }
      } catch (e) {
        try {
          const raw = localStorage.getItem("hitsuji_tests");
          if (raw) setTests(JSON.parse(raw));
        } catch {}
      }
    };

    loadFromSheet();
    loadTestsFromSheet();
  }, []);

  useEffect(() => {
    buildOmochiMessage(streak, records.length).then(msg => setOmochiMsg(msg));
  }, [records.length]); // streakはレンダリング中の計算値のため依存に入れない

  const syncToSheet = async (record) => {
    if (!gasUrl) return;
    setSyncing(true);
    try {
      const encoded = encodeURIComponent(JSON.stringify(record));
      const res = await fetch(`${gasUrl}?data=${encoded}`);
      setSyncStatus(res.ok ? "ok" : "error");
      // 保存後にスプシから再読み込みして最新状態を反映
      if (res.ok) {
        const res2 = await fetch(`${gasUrl}?action=getAll`);
        if (res2.ok) {
          const json = await res2.json();
          if (json.rows) setRecords(parseSheetRows(json.rows));
        }
      }
    } catch {
      try {
        await fetch(gasUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(record) });
        setSyncStatus("ok");
      } catch { setSyncStatus("error"); }
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const saveRecord = async () => {
    if (isSaving) return; // 2度押し防止
    setIsSaving(true);
    // subjectMinutes から studyMinutes と subjects を再計算
    const sm = today.subjectMinutes || {};
    const totalMins = Object.values(sm).reduce((a, b) => a + b, 0);
    const subs = Object.entries(sm).filter(([, v]) => v > 0).map(([k]) => k);
    const recordToSave = { ...today, studyMinutes: totalMins, subjects: subs, recordedAt: getJSTDateTimeString() };
    await syncToSheet(recordToSave);
    // ローカルにも保存（フォールバック用）
    const newRecords = [...records];
    const idx = newRecords.findIndex((r) => r.date === today.date && r.timeSlot === today.timeSlot);
    if (idx >= 0) newRecords[idx] = { ...recordToSave }; else newRecords.push({ ...recordToSave });
    newRecords.sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));
    try { localStorage.setItem("hitsuji_records", JSON.stringify(newRecords)); } catch {}
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsSaving(false);
      setTab("home");
    }, 1200);
  };

  const saveTest = async (test) => {
    const newTests = [...tests];
    const idx = newTests.findIndex((t) => t.id === test.id);
    if (idx >= 0) newTests[idx] = test; else newTests.push(test);
    newTests.sort((a, b) => a.date.localeCompare(b.date));
    setTests(newTests);
    // ローカル保存
    try { localStorage.setItem("hitsuji_tests", JSON.stringify(newTests)); } catch {}
    // スプシに送信
    if (gasUrl) {
      try {
        const payload = { ...test, type: "test" };
        const encoded = encodeURIComponent(JSON.stringify(payload));
        await fetch(`${gasUrl}?data=${encoded}`);
      } catch {}
    }
  };

  const deleteTest = async (id) => {
    const newTests = tests.filter((t) => t.id !== id);
    setTests(newTests);
    try { localStorage.setItem("hitsuji_tests", JSON.stringify(newTests)); } catch {}
    // ※スプシ側の物理削除はサポートしない（行が残る）
  };

  const updateRecord = async (updated) => {
    if (isSaving) return;
    setIsSaving(true);
    const sm = updated.subjectMinutes || {};
    const totalMins = Object.values(sm).reduce((a, b) => a + b, 0);
    const subs = Object.entries(sm).filter(([, v]) => v > 0).map(([k]) => k);
    const recordToSave = { ...updated, studyMinutes: totalMins, subjects: subs, recordedAt: getJSTDateTimeString() };
    await syncToSheet(recordToSave);
    const newRecords = [...records];
    const idx = newRecords.findIndex((r) => r.date === updated.date && r.timeSlot === updated.timeSlot);
    if (idx >= 0) newRecords[idx] = { ...recordToSave }; else newRecords.push({ ...recordToSave });
    newRecords.sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));
    try { localStorage.setItem("hitsuji_records", JSON.stringify(newRecords)); } catch {}
    setEditingRecord(null);
    setSaved(true);
    setTimeout(() => { setSaved(false); setIsSaving(false); }, 1200);
  };

  const deleteRecord = async (record) => {
    const newRecords = records.filter((r) => !(r.date === record.date && r.timeSlot === record.timeSlot));
    setRecords(newRecords);
    try { localStorage.setItem("hitsuji_records", JSON.stringify(newRecords)); } catch {}
  };

  const deleteAllRecords = async () => {
    setRecords([]);
    try { localStorage.setItem("hitsuji_records", JSON.stringify([])); } catch {}
    setShowDeleteAll(false);
  };

  const refreshFromSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${gasUrl}?action=getAll`);
      if (res.ok) {
        const json = await res.json();
        if (json.rows) setRecords(parseSheetRows(json.rows));
      }
    } catch {}
    try {
      const res2 = await fetch(`${gasUrl}?action=getTests`);
      if (res2.ok) {
        const json2 = await res2.json();
        if (json2.rows) {
          const parsed = parseTestRows(json2.rows);
          if (parsed.length > 0) setTests(parsed);
        }
      }
    } catch {}
    setLoading(false);
  };

  const totalMinutes = records.reduce((a, r) => a + (r.studyMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const uniqueDays = new Set(records.map(r => r.date)).size;
  const streak = (() => {
    let s = 0;
    const todayStr = getJSTDateString();
    const dates = [...new Set(records.map((r) => r.date))].sort().reverse();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]);
      const expected = new Date(todayStr);
      expected.setDate(expected.getDate() - i);
      if (getJSTDateString(d) === getJSTDateString(expected)) s++;
      else break;
    }
    return s;
  })();
  const todayTotal = Object.values(today.subjectMinutes || {}).reduce((a,b)=>a+b,0);
  const hamsterMood = streak >= 7 ? 4 : streak >= 3 ? 3 : streak >= 1 ? 2 : todayTotal > 0 ? 1 : 0;

  const S = {
    app: { maxWidth: 440, margin: "0 auto", height: "100dvh", display: "flex", flexDirection: "column", background: "#FFFBF7", fontFamily: "'Hiragino Maru Gothic ProN', 'Noto Sans JP', sans-serif", overflow: "hidden", position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%" },
    header: { background: "linear-gradient(135deg, #5BAD6F 0%, #7BC47F 100%)", padding: "12px 16px 16px", position: "relative", overflow: "hidden" },
    nav: { flexShrink: 0, background: "white", borderTop: "1px solid #f0ece6", display: "flex", zIndex: 100, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" },
    navBtn: (a) => ({ flex: 1, padding: "6px 2px 10px", border: "none", background: "none", color: a ? "#5BAD6F" : "#bbb", fontSize: 9, fontWeight: a ? 700 : 400, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }),
    content: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 16px 80px", WebkitOverflowScrolling: "touch" },
    card: { background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
    title: (c) => ({ fontSize: 16, fontWeight: 800, color: c || "#444", marginBottom: 16 }),
    saveBtn: (bg) => ({ width: "100%", padding: "16px", background: bg || "linear-gradient(135deg, #5BAD6F, #FF6B6B)", border: "none", borderRadius: 16, color: "white", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(255,107,107,0.3)", letterSpacing: 1, marginTop: 4 }),
  };

  return (
    <div style={S.app}>
      <SavedOverlay visible={saved} />
      <div style={S.header}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>小学校 学習記録</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{HAMSTER_MOODS[hamsterMood]} ひつじスタディ</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 1 }}>
              {streak > 0 ? `🔥 ${streak}日連続！` : "さあ今日もがんばろう！"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={refreshFromSheet} style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: 12, padding: "7px 10px", cursor: "pointer", color: "white", fontSize: 14 }}>
              {loading ? "⏳" : "🔄"}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: "rgba(255,255,255,0.22)", border: "none", borderRadius: 12, padding: "7px 11px", cursor: "pointer", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 16 }}>⚙️</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.85)" }}>{gasUrl ? "連携中" : "設定"}</span>
            </button>
          </div>
        </div>
      </div>

      <div style={S.content}>
        {loading && (
          <div style={{ background: "#F1F8E9", borderRadius: 12, padding: "10px 16px", marginBottom: 12, textAlign: "center", fontSize: 13, color: "#5BAD6F" }}>
            🐑 スプレッドシートからデータを読み込み中...
          </div>
        )}
        {syncStatus === "ok" && gasUrl && (
          <div style={{ background: "#96CEB4", color: "white", borderRadius: 12, padding: "8px 16px", marginBottom: 8, textAlign: "center", fontWeight: 700, fontSize: 13 }}>📊 スプレッドシートに保存しました！</div>
        )}
        {syncing && (
          <div style={{ background: "#7BC47F", color: "white", borderRadius: 12, padding: "8px 16px", marginBottom: 8, textAlign: "center", fontWeight: 700, fontSize: 13 }}>📡 送信中...</div>
        )}

        {showSettings && (
          <div style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: "2px solid #C8E6C9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#5BAD6F" }}>⚙️ スプレッドシート連携</div>
              <button onClick={() => setShowSettings(false)} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#ccc" }}>✕</button>
            </div>
            <textarea value={gasUrl} onChange={(e) => setGasUrl(e.target.value)} rows={3}
              style={{ width: "100%", borderRadius: 10, border: "2px solid #C8E6C9", padding: "8px 10px", fontSize: 12, fontFamily: "monospace", background: "#F9FBF9", boxSizing: "border-box", resize: "none", outline: "none" }} />
            {gasUrl && <div style={{ marginTop: 8, fontSize: 12, color: "#96CEB4", fontWeight: 600 }}>✅ URL設定済み</div>}
          </div>
        )}

        {tab === "home" && (
          <>
            <div style={{ ...S.card, display: "flex", gap: 0 }}>
              {[["累計時間", `${totalHours}h`], ["記録日数", `${uniqueDays}日`], ["連続日数", `🔥${streak}`]].map(([label, val], i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid #f0ece6" : "none", padding: "4px 0" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#5BAD6F" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.title()}>今日の記録</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={() => setTab("child")} style={{ flex: 1, padding: "16px 10px", borderRadius: 16, border: "2px solid #C8E6C9", background: "#F9FBF9", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>🐑</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#5BAD6F", marginTop: 4 }}>こどもが入力</div>
                </button>
                <button onClick={() => setTab("parent")} style={{ flex: 1, padding: "16px 10px", borderRadius: 16, border: "2px solid #D4F0EE", background: "#F0FAFA", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>👨‍👩‍👧</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4ECDC4", marginTop: 4 }}>保護者が入力</div>
                </button>
              </div>
              <TimeSlotSelector value={today.timeSlot} onChange={(v) => setToday({ ...today, timeSlot: v })} />
            </div>
            <div style={{ ...S.card, background: "linear-gradient(135deg, #F1F8E9, #F9FBF9)", border: "2px solid #C8E6C9" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 36 }}>🐑</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#5BAD6F", marginBottom: 3 }}>もこより</div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{omochiMsg}</div>
                </div>
              </div>
            </div>
            <QuizCard />
          </>
        )}

        {tab === "child" && (
          <div style={S.card}>
            <div style={S.title("#5BAD6F")}>🐑 こどもの記録</div>
            {/* 日付変更（後日入力用） */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>📅 記録する日付</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="date" value={today.date}
                  onChange={e => setToday({ ...today, date: e.target.value })}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 12, border: "2px solid #C8E6C9", fontSize: 14, background: "#F9FBF9", outline: "none", boxSizing: "border-box" }} />
                {today.date !== getJSTDateString() && (
                  <button onClick={() => setToday({ ...today, date: getJSTDateString() })}
                    style={{ padding: "9px 12px", borderRadius: 12, border: "none", background: "#C8E6C9", color: "#5BAD6F", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    今日に戻す
                  </button>
                )}
              </div>
              {today.date !== getJSTDateString() && (
                <div style={{ marginTop: 4, fontSize: 11, color: "#7BC47F" }}>⚠️ 過去の日付で記録します</div>
              )}
            </div>
            <SubjectTimeInput
              subjectMinutes={today.subjectMinutes || { 算数: 0, 国語: 0, 理科: 0, 社会: 0 }}
              onChange={(sm) => {
                const total = Object.values(sm).reduce((a, b) => a + b, 0);
                const subjects = Object.entries(sm).filter(([, v]) => v > 0).map(([k]) => k);
                setToday({ ...today, subjectMinutes: sm, studyMinutes: total, subjects });
              }}
            />
            <Divider label="📊 今日のコンディション" />
            <ScaleSelector label="今日の体調" value={today.child.体調} onChange={(v) => setToday({ ...today, child: { ...today.child, 体調: v } })} scaleKey="体調" />
            <ScaleSelector label="気持ち（楽しかった？）" value={today.child.気持ち} onChange={(v) => setToday({ ...today, child: { ...today.child, 気持ち: v } })} scaleKey="気持ち" />
            <ScaleSelector label="自信度（できた感じ）" value={today.child.自信度} onChange={(v) => setToday({ ...today, child: { ...today.child, 自信度: v } })} scaleKey="自信度" />
            <Divider label="✏️ 今日の振り返り" />
            <TextArea label="🌟 今日のできた！" value={today.child.dekita} onChange={(v) => setToday({ ...today, child: { ...today.child, dekita: v } })} placeholder="できたこと、わかったこと！" color="#5BAD6F" />
            <TextArea label="💭 つまづき・課題" value={today.child.tsumazuki} onChange={(v) => setToday({ ...today, child: { ...today.child, tsumazuki: v } })} placeholder="どんなところが難しかった？" color="#7BC47F" />
            <TextArea label="💌 自分へのひとこと" value={today.child.hitokoto} onChange={(v) => setToday({ ...today, child: { ...today.child, hitokoto: v } })} placeholder="今日がんばった自分へメッセージ！" color="#FF6B6B" />
            <Divider label="✅ 今日の生活チェック" />
            <DailyCheckList checks={today.dailyChecks} onChange={(v) => setToday({ ...today, dailyChecks: v })} bestDay={today.bestDay} onBestDayChange={(v) => setToday({ ...today, bestDay: v })} color="#5BAD6F" />
            <button style={{...S.saveBtn(), opacity: isSaving ? 0.6 : 1, cursor: isSaving ? "not-allowed" : "pointer"}} onClick={saveRecord} disabled={isSaving}>{isSaving ? "⏳ 保存中..." : "🐑 もこと記録する！"}</button>
          </div>
        )}

        {tab === "parent" && (
          <div style={S.card}>
            <div style={S.title("#4ECDC4")}>👨‍👩‍👧 保護者の記録</div>
            {/* 日付変更（後日入力用） */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>📅 記録する日付</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="date" value={today.date}
                  onChange={e => setToday({ ...today, date: e.target.value })}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 12, border: "2px solid #D4F0EE", fontSize: 14, background: "#F0FAFA", outline: "none", boxSizing: "border-box" }} />
                {today.date !== getJSTDateString() && (
                  <button onClick={() => setToday({ ...today, date: getJSTDateString() })}
                    style={{ padding: "9px 12px", borderRadius: 12, border: "none", background: "#D4F0EE", color: "#4ECDC4", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    今日に戻す
                  </button>
                )}
              </div>
              {today.date !== getJSTDateString() && (
                <div style={{ marginTop: 4, fontSize: 11, color: "#7BC47F" }}>⚠️ 過去の日付で記録します</div>
              )}
            </div>
            <ScaleSelector label="子どもの勉強への姿勢" value={today.parent.姿勢} onChange={(v) => setToday({ ...today, parent: { ...today.parent, 姿勢: v } })} scaleKey="姿勢" color="#4ECDC4" />
            <ScaleSelector label="今日の保護者の気持ち" value={today.parent.気持ち} onChange={(v) => setToday({ ...today, parent: { ...today.parent, 気持ち: v } })} scaleKey="気持ち_parent" color="#4ECDC4" />
            <Divider label="✏️ 今日の記録" />
            <TextArea label="⭐ 今日の良かったこと・ほめたいこと" value={today.parent.goodPoint} onChange={(v) => setToday({ ...today, parent: { ...today.parent, goodPoint: v } })} placeholder="子どもの良かったところ" color="#4ECDC4" />
            <TextArea label="💭 つまづき・課題" value={today.parent.tsumazuki} onChange={(v) => setToday({ ...today, parent: { ...today.parent, tsumazuki: v } })} placeholder="サポートが必要なこと" color="#96CEB4" />
            <TextArea label="🌟 最高だったこと・今日のひとこと" value={today.parent.bestDay || ""} onChange={(v) => setToday({ ...today, parent: { ...today.parent, bestDay: v } })} placeholder="今日一番よかったこと、印象に残ったことなど" color="#7BC47F" />
            <ParentAdvice records={records} today={today} />
            <button style={{...S.saveBtn("linear-gradient(135deg, #4ECDC4, #45B7D1)"), opacity: isSaving ? 0.6 : 1, cursor: isSaving ? "not-allowed" : "pointer"}} onClick={saveRecord} disabled={isSaving}>{isSaving ? "⏳ 保存中..." : "💾 記録する"}</button>
          </div>
        )}

        {tab === "graph" && (
          <>
            <div style={S.card}>
              <BarChart records={records} />
              <MentalChart records={records} />
              <SubjectChart records={records} />
              <CheckChart records={records} />
            </div>
          </>
        )}

        {tab === "test" && (
          <TestTab tests={tests} onSave={saveTest} onDelete={deleteTest} />
        )}

        {tab === "history" && editingRecord && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", overflowY: "auto" }}>
            <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 100px" }}>
              <div style={{ background: "white", borderRadius: 20, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#555" }}>✏️ 記録を編集</div>
                  <button onClick={() => setEditingRecord(null)} style={{ border: "none", background: "#f0ece6", borderRadius: 10, padding: "6px 12px", fontSize: 13, color: "#888", cursor: "pointer" }}>✕ 閉じる</button>
                </div>
                {/* 日付 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 6, fontWeight: 600 }}>📅 日付</div>
                  <input type="date" value={editingRecord.date}
                    onChange={e => setEditingRecord({...editingRecord, date: e.target.value})}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 12, border: "2px solid #C8E6C9", fontSize: 14, background: "#F9FBF9", outline: "none", boxSizing: "border-box" }} />
                </div>
                {/* 時間帯 */}
                <TimeSlotSelector value={editingRecord.timeSlot}
                  onChange={v => setEditingRecord({...editingRecord, timeSlot: v})} />
                {/* 勉強時間 */}
                <SubjectTimeInput
                  subjectMinutes={editingRecord.subjectMinutes || { 算数: 0, 国語: 0, 理科: 0, 社会: 0 }}
                  onChange={sm => {
                    const total = Object.values(sm).reduce((a, b) => a + b, 0);
                    const subjects = Object.entries(sm).filter(([, v]) => v > 0).map(([k]) => k);
                    setEditingRecord({...editingRecord, subjectMinutes: sm, studyMinutes: total, subjects});
                  }} />
                <Divider label="🐑 こどもの記録" />
                <ScaleSelector label="体調" value={editingRecord.child?.体調||0}
                  onChange={v => setEditingRecord({...editingRecord, child: {...(editingRecord.child||{}), 体調: v}})} scaleKey="体調" />
                <ScaleSelector label="気持ち" value={editingRecord.child?.気持ち||0}
                  onChange={v => setEditingRecord({...editingRecord, child: {...(editingRecord.child||{}), 気持ち: v}})} scaleKey="気持ち" />
                <ScaleSelector label="自信度" value={editingRecord.child?.自信度||0}
                  onChange={v => setEditingRecord({...editingRecord, child: {...(editingRecord.child||{}), 自信度: v}})} scaleKey="自信度" />
                <TextArea label="🌟 できた！" value={editingRecord.child?.dekita||""}
                  onChange={v => setEditingRecord({...editingRecord, child: {...(editingRecord.child||{}), dekita: v}})} placeholder="できたこと" color="#5BAD6F" />
                <TextArea label="💭 つまづき" value={editingRecord.child?.tsumazuki||""}
                  onChange={v => setEditingRecord({...editingRecord, child: {...(editingRecord.child||{}), tsumazuki: v}})} placeholder="難しかったこと" color="#7BC47F" />
                <TextArea label="💌 自分へのひとこと" value={editingRecord.child?.hitokoto||""}
                  onChange={v => setEditingRecord({...editingRecord, child: {...(editingRecord.child||{}), hitokoto: v}})} placeholder="メッセージ" color="#FF6B6B" />
                <Divider label="👨‍👩‍👧 保護者の記録" />
                <ScaleSelector label="姿勢" value={editingRecord.parent?.姿勢||0}
                  onChange={v => setEditingRecord({...editingRecord, parent: {...(editingRecord.parent||{}), 姿勢: v}})} scaleKey="姿勢" color="#4ECDC4" />
                <TextArea label="⭐ 良かったこと" value={editingRecord.parent?.goodPoint||""}
                  onChange={v => setEditingRecord({...editingRecord, parent: {...(editingRecord.parent||{}), goodPoint: v}})} placeholder="よかったところ" color="#4ECDC4" />
                <TextArea label="💭 つまづき・課題" value={editingRecord.parent?.tsumazuki||""}
                  onChange={v => setEditingRecord({...editingRecord, parent: {...(editingRecord.parent||{}), tsumazuki: v}})} placeholder="サポートが必要なこと" color="#96CEB4" />
                <button
                  style={{...S.saveBtn(), opacity: isSaving ? 0.6 : 1, cursor: isSaving ? "not-allowed" : "pointer", marginTop: 8}}
                  onClick={() => updateRecord(editingRecord)}
                  disabled={isSaving}>
                  {isSaving ? "⏳ 保存中..." : "💾 変更を保存する"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={S.title()}>📅 記録一覧</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={refreshFromSheet} style={{ border: "1px solid #C8E6C9", background: "#F9FBF9", borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#5BAD6F", cursor: "pointer" }}>
                  {loading ? "⏳" : "🔄 更新"}
                </button>
                {records.length > 0 && (
                  <button onClick={() => setShowDeleteAll(true)} style={{ border: "1px solid #ffcccc", background: "#fff0f0", borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#e05555", cursor: "pointer" }}>🗑️ 全件削除</button>
                )}
              </div>
            </div>
            {showDeleteAll && (
              <div style={{ background: "#FFF0F0", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #FFD0D0" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e05555", marginBottom: 8 }}>⚠️ 全ての記録を削除しますか？</div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>アプリ上の表示のみ削除されます。スプレッドシートのデータは残ります。</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={deleteAllRecords} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#FF6B6B", color: "white", fontWeight: 700, cursor: "pointer" }}>削除する</button>
                  <button onClick={() => setShowDeleteAll(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #ddd", background: "white", color: "#888", cursor: "pointer" }}>キャンセル</button>
                </div>
              </div>
            )}
            {loading ? (
              <div style={{ textAlign: "center", color: "#7BC47F", padding: 24 }}>🐑 読み込み中...</div>
            ) : records.length === 0 ? (
              <div style={{ textAlign: "center", color: "#bbb", padding: 24 }}>🐑 もこがまってるよ！<br />最初の記録をつけてみよう</div>
            ) : <MonthAccordion records={records} onDelete={deleteRecord} onEdit={(r) => setEditingRecord({...r})} />}
          </div>
        )}
      </div>

      <nav style={S.nav}>
        {[
          { key: "home", icon: "🏠", label: "ホーム" },
          { key: "child", icon: "🐑", label: "こども" },
          { key: "parent", icon: "👨‍👩‍👧", label: "保護者" },
          { key: "graph", icon: "📊", label: "グラフ" },
          { key: "test", icon: "📝", label: "テスト" },
          { key: "history", icon: "📅", label: "履歴" },
        ].map(({ key, icon, label }) => (
          <button key={key} style={S.navBtn(tab === key)} onClick={() => {
            setTab(key);
            if (key === "home") buildOmochiMessage(streak, records.length).then(msg => setOmochiMsg(msg));
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
