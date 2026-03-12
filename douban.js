WidgetMetadata = {
  id: "douban_hot_full",
  title: "豆瓣榜单",
  description: "豆瓣热播电影/剧集/动画/综艺",
  author: "七七",
  site: "https://douban.com",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [

    {
      title: "🔥 热播电影",
      functionName: "movieHot",
      cacheDuration: 3600,
      params: [{ name: "page", type: "page", startPage: 1 }]
    },

    {
      title: "📺 热播剧集",
      functionName: "tvHot",
      cacheDuration: 3600,
      params: [{ name: "page", type: "page", startPage: 1 }]
    },

    {
      title: "🎨 热播动画",
      functionName: "animeHot",
      cacheDuration: 3600,
      params: [{ name: "page", type: "page", startPage: 1 }]
    },

    {
      title: "🎤 热播综艺",
      functionName: "varietyHot",
      cacheDuration: 3600,
      params: [{ name: "page", type: "page", startPage: 1 }]
    },

    {
      title: "📈 一周口碑榜",
      functionName: "weeklyHot",
      cacheDuration: 3600,
      params: [{ name: "page", type: "page", startPage: 1 }]
    }

  ]
};

async function movieHot(params = {}) {
  return load("movie_hot", params.page);
}

async function tvHot(params = {}) {
  return load("tv_hot", params.page);
}

async function animeHot(params = {}) {
  return load("tv_animation", params.page);
}

async function varietyHot(params = {}) {
  return load("show_hot", params.page);
}

async function weeklyHot(params = {}) {
  return load("tv_weekly_best", params.page);
}

async function load(type, page = 1) {

  const start = (page - 1) * 20;

  const url =
  `https://m.douban.com/rexxar/api/v2/subject_collection/${type}/items?start=${start}&count=20`;

  const res = await Widget.http.get(url,{
    headers:{
      Referer:"https://m.douban.com/",
      "User-Agent":"Mozilla/5.0"
    }
  });

  const data = JSON.parse(res.body);

  const list =
  data.subject_collection_items ||
  data.items ||
  [];

  return list.map(item => ({

    id: item.id || item.title,

    type: "video",

    title: item.title,

    cover: item.cover?.url ||
           item.pic?.normal ||
           "",

    description:
      (item.rating?.value
        ? `⭐ ${item.rating.value}`
        : "暂无评分") +

      (item.year
        ? ` · ${item.year}`
        : "")

  }));

}