WidgetMetadata = {
  id: "douban_hot",
  title: "豆瓣热播",
  description: "豆瓣热门影视榜单",
  author: "seven",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [

    {
      title: "🔥 热播电影",
      functionName: "movie",
      cacheDuration: 3600
    },

    {
      title: "📺 热播剧集",
      functionName: "tv",
      cacheDuration: 3600
    },

    {
      title: "🎨 热播动画",
      functionName: "anime",
      cacheDuration: 3600
    },

    {
      title: "🎤 热播综艺",
      functionName: "show",
      cacheDuration: 3600
    }

  ]
};


async function movie() {
  return load("movie_hot");
}

async function tv() {
  return load("tv_hot");
}

async function anime() {
  return load("tv_animation");
}

async function show() {
  return load("show_hot");
}



async function load(type) {

  const url =
  `https://m.douban.com/rexxar/api/v2/subject_collection/${type}/items?start=0&count=20`;

  const res = await Widget.http.get(url,{
    headers:{
      Referer:"https://m.douban.com/",
      "User-Agent":"Mozilla/5.0"
    }
  });

  const data = JSON.parse(res.body);

  const list = data.subject_collection_items || [];

  return list.map(item => ({

    id: String(item.id),

    type: "video",

    title: item.title,

    cover: item.cover?.url,

    description:
      item.rating?.value
      ? `⭐ ${item.rating.value}`
      : "暂无评分",

    link:
      `https://movie.douban.com/subject/${item.id}/`

  }));

}