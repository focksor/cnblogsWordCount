'use strict';

function getAllUrl(data) {
    const reg = /<a[^>]+href="(([^"]+)")/ig;

    // 获取所有链接
    let urlSet = new Set();
    let result;
    while ((result = reg.exec(data)) != null) {
        urlSet.add(result[2])
    }

    return Array.from(urlSet)
}

function getAllPostsUrl(data) {
    let mypostsIndex = data.indexOf('<div id="myposts">');
    let endMypostsIndex = data.indexOf('<div class="pager">', mypostsIndex);
    let postHTML = data.substring(mypostsIndex, endMypostsIndex);

    return getAllUrl(postHTML)
}

function refreshSum() {
    let countSum = postCountList.reduce(function (x, y) {
        return x + y;
    });

    if (postCountList.length !== postList.length) {
        countSum = `统计中...(${countSum})`;
    }
    console.log(countSum)

    if($('#wordCount').text().length === 0) {
        $("#p_b_follow").before("<br/>博客总字数：" + "<a id='wordCount' href='https://gitee.com/focksor/cnblogsWordCount' target='_blank'>" + countSum + "</a>");
    } else {
        $('#wordCount').text(countSum)
    }
}

function countWord(href) {
    axios.get(href).then(function (response) {
        let contentIndex = response.data.indexOf("<div id=\"cnblogs_post_body\"");
        let contentEndIndex = response.data.indexOf("</div>", contentIndex);
        let content = response.data.substring(contentIndex, contentEndIndex);
        // 去除html标签
        content = content.replace(/<[^>]*>|<\/[^>]*>/gm, "");

        postCountList.push(content.length);

        refreshSum()
    })
}

// 文章的字数列表
let postCountList = [];
let userName = window.location.pathname.split('/')[1];
let url = `https://www.cnblogs.com/${userName}/p/?page=1`;
// 文章的链接列表
let postList = [];
let data;

// 只有在主页才进行统计
if (!window.location.pathname.endsWith(".html")) {
    axios.get(url).then(function(response) {
        data = response.data;

        // 所有文章的列表
        let pagePostList = [];
        pagePostList.push(getAllPostsUrl(data));

        let pagerIndex = data.indexOf('<div class="Pager">');
        let pagerEndIndex = data.indexOf('/div', pagerIndex);
        let pagerHTML = data.substring(pagerIndex, pagerEndIndex);
        let pagerUrlList = getAllUrl(pagerHTML);

        for (let pagerUrl of pagerUrlList) {
            axios.get(pagerUrl).then(function (response) {
                pagePostList.push(getAllPostsUrl(response.data));

                // 文章列表已全部检索
                if (pagePostList.length === pagerUrlList.length + 1) {
                    for (let page of pagePostList) {
                        for (let post of page) {
                            postList.push(post)
                        }
                    }

                    for (let post of postList) {
                        countWord(post)
                    }
                }
            })
        }
    })
} else {
    // 在文章内的统计
    let postLength = $('#cnblogs_post_body').text().length;
    console.log(postLength);
    let readTime = postLength / 400;
    readTime = Math.round(readTime);

    let postBody = $('div.postBody')
    postBody.prepend("本文总字数："+ postLength + "，阅读预计需要：" + readTime + "分钟<br/>")
}