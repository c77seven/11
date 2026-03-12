WidgetMetadata = {
  id: "douban_test",
  title: "豆瓣热播测试",
  description: "豆瓣榜单",
  author: "test",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "热播剧集",
      functionName: "load",
      cacheDuration: 3600
    }
  ]
};

async function load() {

  const url =
  "https://m.douban.com/rexxar/api/v2/subject_collection/tv_hot/items?start=0&count=20";

  const res = await Widget.http.get(url,{
    headers:{
      Referer:"https://m.douban.com/",
      "User-Agent":"Mozilla/5.0"
    }
  });

  const data = JSON.parse(res.body);

  const list = data.subject_collection_items;

  return list.map(i => ({
    id: String(i.id),
    type: "video",
    title: i.title,
    cover: i.cover.url
  }));
}