﻿(function () {
    // 检测url
    if (!window.location.href.startsWith('https://mooc1-1.chaoxing.com/mycourse/studentstudy')) {
        alert('请在"学生学习页面"使用！ 地址为 https://mooc1-1.chaoxing.com/mycourse/studentstudy');
        return;
    };
    if (window._eryahelper) return;
    window._eryahelper = true;

    // 提醒接口
    var notify = (function () {
        if (!("Notification" in window)) {
            return alert;
        } else if (Notification.permission === "granted") {
            return function (msg) {
                var notification = new Notification('尔雅助手', {
                    body: msg + '\n点击关闭\n',
                    icon: 'https://juszoe.github.io/erya/favicon.ico'
                });
                notification.onclick = function () {
                    notification.close();
                }
            }
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                if (permission === "granted") {
                    notify = function (msg) {
                        var notification = new Notification('尔雅助手', {
                            body: msg + '\n(点击关闭)',
                            icon: 'https://github.com/favicon.ico'
                        });
                        notification.onclick = function () {
                            notification.close();
                        }
                    }
                }
            });
        }
        $('#helper').append('<p style="color: red;">显示通知功能需要权限，请允许通知</p>');
        return alert;
    })();

    // 使用img进行跨域请求
    function postAnswer(answers) {
        $.ajax({
            url: "https://api.tensor-flow.club:8700/collect",
            type: "GET",
            data: {
                answers: JSON.stringify(answers)
            },
            dataType: "jsonp", //指定服务器返回的数据类型
            success: function (data) {
                console.log(data);
            }
        });
    }
    function getAnswer(course, keyword, cb) {
        $.ajax({
            url: "https://api.tensor-flow.club:8700/answer",
            type: "GET",
            data: {
                course: course,
                keyword: keyword
            },
            dataType: "jsonp", //指定服务器返回的数据类型
            success: cb
        });
    }

    // 初始化
    var course = $('#mainid > h1').text()
    $('.content').prepend('<h1 id="helper" style="text-align:center;font-size:28px;">尔雅助手<a style="color:blue;" href="https://juszoe.github.io/erya" target="_blank">主页</a></h1>');
    if (window.frames['iframe'].contentDocument.readyState == 'complete') {
        start();
    }
    $('iframe').on("load", function () {
        start();
    })

    // 启动助手
    function start() {
        // 解除视频限制
        var trycount = 0;
        (function videoListener() {
            setTimeout(function () {
                try {
                    trycount++;
                    var video = window.frames['iframe'].contentDocument.querySelector('iframe').contentDocument.querySelector('video')
                    video.addEventListener('ended', function () {
                        notify('《' + course + '》 课程视频播放完毕');
                    });
                    video.addEventListener('pause', function () {
                        setTimeout(function () {
                            if (video.paused && !video.ended)
                                video.play();
                        }, 100);
                    });
                } catch (e) {
                    if (trycount > 20) return;
                    videoListener()
                }
            }, 1000);
        })();

        // 共享答案
        try {
            // 嵌套太多iframe了吧...
            var timu = window.frames['iframe'].contentDocument.querySelector('iframe').contentDocument.querySelector('iframe').contentDocument.querySelectorAll('.TiMu');
            var result = [];
            $(timu).each(function () {
                var question = $(this).find('.Zy_TItle .clearfix').text().trim();
                var answer = $(this).find('.Py_answer span')[0].innerText.trim().replace('我的答案：', '');
                var correct = $(this).find('.fr').hasClass("dui");
                result.push({
                    course: course,
                    question: question,
                    answer: answer,
                    correct: correct
                });
            });
            postAnswer(result);
        }
        catch (e) { }

        // 划词助手
        try {
            var idocument = window.frames['iframe'].contentDocument.querySelector('iframe').contentDocument.querySelector('iframe').contentDocument;
            var iwindow = window.frames['iframe'].contentDocument.querySelector('iframe').contentDocument.querySelector('iframe').contentWindow;
            $(idocument.querySelector('body')).prepend('<div id="answer" style="border-radius:5px;font-size:16px;background-color:#71AAFF;color:#fff;padding: 5px;">答案区<div>');
            idocument.addEventListener('mouseup', function (e) {
                var text = iwindow.getSelection().toString().trim();
                var $answer = $(idocument.querySelector('#answer'));
                if (text) {
                    $answer.text('正在搜索答案中...');
                    getAnswer(course, text, function (data) {
                        $answer.text('');
                        if(data.length == 0) {
                            $answer.text('未搜索到答案');
                        }
                        for (var i = 0; i < data.length; i++) {
                            var o = data[i]
                            $answer.append('<p>【题目】 ' + o.question + '</p>');
                            $answer.append('<p>【答案】 ' + o.answer + '</p>');
                            $answer.append('<hr style="border:none;border-top: 1px solid #fff;">');
                        }
                    })
                }
            });
        } catch (e) { console.log(e) }

    }

    // 修改原函数
    window.getTeacherAjax = function (courseId, clazzid, chapterId, cpi, chapterVerCode) {
        closeChapterVerificationCode();
        if (courseId == 0 || clazzid == 0 || chapterId == 0) {
            alert("无效的参数！");
            return;
        }
        if (typeof (cpi) == 'undefined') {
            cpi = 0;
        }
        document.getElementById("mainid").innerHTML = "<div style=\"width:32px;height:32px;margin:0 auto;padding:300px 0\"><img src=\"/images/courselist/loading.gif\" /></div>"
        jQuery.post("/mycourse/studentstudyAjax",
            {
                courseId: courseId
                , clazzid: clazzid
                , chapterId: chapterId
                , cpi: cpi
                , verificationcode: chapterVerCode || ''
            },
            function (data) {
                data = data.replace(/(^\s*)|(\s*$)/g, "");
                var doc = document.getElementById("mainid");
                jQuery(doc).html(data);
                $('iframe').on("load", function () {  // 修改原函数，在这里添加了事件
                    start();
                })
                if (data.indexOf('showChapterVerificationCode') > -1) {
                    recordCheckedChapterParam(courseId, clazzid, chapterId, cpi);
                    return;
                }
                document.getElementById("iframe").src = "/knowledge/cards?clazzid=" + clazzid + "&courseid=" + courseId + "&knowledgeid=" + chapterId + "&num=0&ut=s&cpi=55761320&v=20160407-1";
                var el = $('#iframe');
                //var openlockdiv=document.getElementById("openlock");
                if ($("#openlock").length > 0) {
                    var count = document.getElementById("cardcount").value;
                    if (count == 1) {
                        setTimeout('openlockshow();', 2000);
                    }
                }
                if ($("#cur" + chapterId + " .orange01").length > 0) {

                    jQuery.ajax({
                        type: "get",
                        url: "/edit/validatejobcount",
                        data: {
                            courseId: courseId
                            , clazzid: clazzid
                            , nodeid: chapterId
                        },
                    });
                }
                window.ed_reinitIframe = function ed_reinitIframe() {
                    var iframe = el[0];

                    try {
                        var bHeight = iframe.contentWindow.document.body.scrollHeight;
                        var dHeight = iframe.contentWindow.document.documentElement.scrollHeight;
                        var height = Math.max(bHeight, dHeight);
                        el.attr('height', height);
                    } catch (ex) { }
                }
                window.setInterval("ed_reinitIframe()", 200);

                var tab = 0;
                if (tab == 3) {
                    getClazzNote(); changePan('3');
                } else if (tab == 2) {
                    getChapterRightDiscuss(); changePan('2');
                } else {
                    changePan('1');
                }
            }

        );
        window.setInterval("setposition()", 200);
        jobflagOperation();
        scroll(0, 0);
    }

})()