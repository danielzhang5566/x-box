// 计算加班打车

/**
 * 简化选择器
 * @param  {String} ele 选择元素 ('body')/('#idName')/('.banner a')
 * @return {Object} 返回匹配的第一个元素对象
 */
function $(elem) {
    return document.querySelector(elem);
}

let Bonus = {

    onReady: function () {
        $('#content').childNodes.length && Bonus.calc()
    },

    calc: function () {
        let overDays = 0            // 加班天数

        $('#content').childNodes.forEach(($item, i) => {
            let $cols = $item.childNodes,
                date = $cols[6].innerText.replace(/-/g, '/'),
                begin = $cols[8].innerText,
                end = $cols[9].innerText;

            if (begin && end && Bonus.isCanGetCartBonus(date, begin, end)) {
                ++overDays
                $item.style.backgroundColor = 'yellow'
            }
        })

        setTimeout(() => {
            overDays ?
                alert('补贴提醒：' + '可打车报销 ' + overDays + ' 天') :
                alert('补贴提醒：' + '很遗憾，您没有补贴哦，努力加班吧：）')
        }, 0)
    },

    /**
     * 是否可以获得加班打车报销
     * A. 正常工作日，超过21:00可报销打车费用
     * B. 周末及节假日，加班时间超过3个小时则可报销餐补
     *
     * @param  {String} date   加班日期
     * @param  {String} begin  上班打卡时间
     * @param  {String} end    下班打卡时间
     * @return {Boolean} 返回是否可报销打车费用
     */
    isCanGetCartBonus: function (date, begin, end) {
        let beginTime = new Date(date + ' ' + begin);
        let endTime = new Date(date + ' ' + end);
        let hours = (endTime - beginTime) / 1000 / 60 / 60;     // 总上班时长(h)
        let isWeekend = new Date(date).getDay() % 6 == 0; // 是否周末

        if (!isWeekend) {    // A. 正常工作日
            // 下班打卡21:00之后
            return endTime.getHours() >= 21

        } else {            // B. 周末（节假日偷懒就不算了）
            // 上班总时长够3h即可
            return hours >= 3
        }
    }
}

if (window.location.href === "http://kaoqin.jd.com/kaoqin/KaoQin") {

    Bonus.onReady()

} else {
    alert('请到JD打卡机页面再使用：http://kaoqin.jd.com/kaoqin/KaoQin')
}
