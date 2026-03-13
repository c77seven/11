// 道长 drpy 引擎适用的豆瓣聚合规则（定制版）
var rule = {
    title: '豆瓣热播',
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
        'Referer': 'https://movie.douban.com/'
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
            var html = request(input);
            var json = JSON.parse(html);
            json.subjects.forEach(function(it) {
                d.push({
                    vod_id: it.title, // 故意设置为 title，以便后续触发全网搜索
                    vod_name: it.title,
                    vod_pic: it.cover || it.pic,
                    vod_remarks: '评分: ' + it.rate
                });
            });
        } catch(e) {}
        setResult(d);
    `,
    
    一级: `js:
        var d = [];
        try {
            // fypage 默认从 1 开始，豆瓣的 page_start 需要换算 (0, 20, 40...)
            var page_start = (MY_PAGE - 1) * 20;
            var fetch_url = input.replace('fypage', page_start);
            var html = request(fetch_url);
            var json = JSON.parse(html);
            
            json.subjects.forEach(function(it) {
                // 拼接更新状态和评分
                var remarks = it.episodes_info ? (it.episodes_info + ' | 评分:' + it.rate) : ('评分:' + it.rate);
                d.push({
                    vod_id: it.title,
                    vod_name: it.title,
                    vod_pic: it.cover || it.pic,
                    vod_remarks: remarks
                });
            });
        } catch(e) {}
        setResult(d);
    `,
    
    二级: `js:
        // 二级详情页的作用是做个中转，因为豆瓣本身不提供视频播放源。
        // 将视频数据封装好，引导用户调用 TVBox 的全网搜索去找剧。
        VOD = {
            vod_id: input,
            vod_name: input,
            type_name: "豆瓣推荐",
            vod_pic: "https://img3.doubanio.com/favicon.ico",
            vod_content: "【豆瓣热度展示源】本接口不提供直接播放。您可以在此长按片名，或点击下方按钮，触发TVBox全网搜索引擎为您找剧！",
            vod_play_from: "全网搜索",
            vod_play_url: "点击搜剧$" + input // 配合部分影视APP支持的点击直搜协议
        };
    `,
}