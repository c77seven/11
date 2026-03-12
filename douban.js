/**
 * WidgetMetadata 定义
 */
const WidgetMetadata = {
  id: "douban_hot",
  title: "豆瓣热播",
  description: "豆瓣热门影视榜单 (网页增强版)",
  author: "seven",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  modules: [
    { title: "🔥 电影榜", functionName: "movie", cacheDuration: 3600 },
    { title: "📺 电视剧", functionName: "tv", cacheDuration: 3600 },
    { title: "🎨 动画榜", functionName: "anime", cacheDuration: 3600 },
    { title: "🎤 综艺榜", functionName: "show", cacheDuration: 3600 }
  ]
};

/**
 * 模块入口函数
 */
async function movie() { return load("movie"); }
async function tv() { return load("tv"); }
async function anime() { return load("tv"); } // 网页版动画通常合并在剧集中
async function show() { return load("tv"); }

/**
 * 核心加载函数
 * @param {string} category - 类别: movie 或 tv
 */
async function load(category) {
  // 豆瓣电影排行榜网页 URL
  const url = `https://movie.douban.com/chart`;
  
  try {
    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Host": "movie.douban.com",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9"
      }
    });

    // 1. 防御性检查：确保 response 和 body 存在
    if (!response || !response.body) {
      console.error("❌ 未能获取到网页内容，响应为空");
      return [];
    }

    const html = response.body;

    // 2. 检查是否撞到了豆瓣的登录墙或验证码
    if (html.includes("login") || html.includes("captcha")) {
      console.error("⚠️ 触发了豆瓣反爬验证，请在浏览器中打开豆瓣手动验证后再试");
      return [];
    }

    // 3. 使用正则解析 HTML (针对豆瓣排行榜页面的结构)
    // 匹配结构：<a class="nbg" href="URL" title="TITLE"> <img src="COVER"
    const itemRegex = /<a class="nbg" href="(https:\/\/movie\.douban\.com\/subject\/(\d+)\/)"\s+title="(.*?)">[\s\S]*?<img src="(.*?)"/g;
    
    const results = [];
    let match;

    // 循环提取前 10 条数据
    while ((match = itemRegex.exec(html)) !== null && results.length < 15) {
      const [_, link, id, title, cover] = match;
      
      results.push({
        id: id,
        type: "video",
        title: title,
        cover: cover.replace('s_ratio_poster', 'm_ratio_poster'), // 换成中等尺寸图
        description: "豆瓣热门更新",
        link: link
      });
    }

    // 4. 如果正则没匹配到，尝试第二种常见的列表结构
    if (results.length === 0) {
        console.warn("⚠️ 正则匹配为空，尝试解析备用结构...");
        const altRegex = /<img src="(.*?)" alt="(.*?)"[\s\S]*?href="(https:\/\/movie\.douban\.com\/subject\/(\d+)\/)"/g;
        while ((match = altRegex.exec(html)) !== null && results.length < 10) {
            results.push({
                id: match[4],
                type: "video",
                title: match[2],
                cover: match[1],
                description: "热门推荐",
                link: match[3]
            });
        }
    }

    console.log(`✅ 成功抓取 ${results.length} 条数据`);
    return results;

  } catch (error) {
    console.error("🚨 脚本执行发生异常:", error.message);
    return []; // 发生错误时返回空数组，防止 UI 崩溃
  }
}
