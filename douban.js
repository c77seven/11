// 豆瓣热播定制版 JS - 纯净剧集、动画、综艺源
var rule = {
    title: '豆瓣热播',
    author: '定制优化版', // 补充作者信息（部分引擎强制校验）
    version: '1.0.0',    // 补充插件版本信息（关键：部分引擎无版本号不加载）
    host: 'https://movie.douban.com',
    
    // 首页推荐：默认展示'热门'（即热播剧集）
    homeUrl: '/j/search_subjects?type=tv&tag=热门&sort=recommend&page_limit=20&page_start=0',
    // 分类页：fypage 和 fyclass 是 drpy 的内置替换符
    url: '/j/search_subjects?type=tv&tag=fyclass&sort=recommend&page_limit=20&page_start=fypage',
    searchUrl: '',
    searchable: 0,
    quickSearch: 0,
    filterable: 0,
    
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Referer': 'https://movie.douban.com/',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest'
    },
    
    // 【核心定制】仅配置你需要的三个分类
    class_name: '热播剧集&热播动画&热播综艺',
    class_url: '热门&动画&综艺',
    
    play_parse: true,
    lazy: '',
    limit: 20,
    
    推荐: `js:
        var d = [];
        try {
            var fetch_url = encodeURI(input);
            var html = request(fetch_url);
            var json = JSON.parse(html);
            json.subjects.forEach(function(it) {
                d.push({
                    vod_id: it.title,
                    vod_name: it.title,
                    vod_pic: it.cover || it.pic,
                    vod_remarks: '评分: ' + it.rate
                });
            });
        } catch(e) {
            d.push({vod_id: '', vod_name: '首页数据加载失败', vod_remarks: e.toString(), vod_pic: 'https://img3.doubanio.com/favicon.ico'});
        }
        setResult(d);
    `,
    
    一级: `js:
        var d = [];
        try {
            var page_start = (MY_PAGE - 1) * 20;
            var fetch_url = input.replace('fypage', page_start);
            fetch_url = encodeURI(fetch_url);
            
            var html = request(fetch_url);
            var json = JSON.parse(html);
            
            json.subjects.forEach(function(it) {
                var remarks = it.episodes_info ? (it.episodes_info + ' | 评分:' + it.rate) : ('评分:' + it.rate);
                d.push({
                    vod_id: it.title,
                    vod_name: it.title,
                    vod_pic: it.cover || it.pic,
                    vod_remarks: remarks
                });
            });
        } catch(e) {
            d.push({vod_id: '', vod_name: '分类数据加载失败', vod_remarks: e.toString(), vod_pic: 'https://img3.doubanio.com/favicon.ico'});
        }
        setResult(d);
    `,
    
    二级: `js:
        VOD = {
            vod_id: input,
            vod_name: input,
            type_name: "豆瓣推荐",
            vod_pic: "https://img3.doubanio.com/favicon.ico",
            vod_content: "【豆瓣热播榜单】本接口只作为热门推荐展示，不提供直接播放源。请长按片名，或点击下方按钮，触发全网搜索引擎为您找剧！",
            vod_play_from: "全网搜索",
            vod_play_url: "点击搜剧$" + input
        };
    `,
}