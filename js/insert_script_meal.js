// 计算加班餐补

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
        const MONEY_PRE_DAY = 15    // 每日餐补金额
        let overDays = 0            // 加班天数

        $('#content').childNodes.forEach(($item, i) => {
            let $cols = $item.childNodes,
                date = $cols[6].innerText.replace(/-/g, '/'),
                begin = $cols[8].innerText,
                end = $cols[9].innerText;

            if (begin && end && Bonus.isCanGetMealBonus(date, begin, end)) {
                ++overDays
                $item.style.backgroundColor = 'yellow'
            }
        })

        setTimeout(() => {
            overDays ?
                alert('补贴提醒：' + '加班 ' + overDays + ' 天,获取 ￥' + overDays * MONEY_PRE_DAY + ' 元') :
                alert('补贴提醒：' + '很遗憾，您没有补贴哦，努力加班吧：）')
        }, 0)
    },

    /**
     * 是否可以获得加班餐补
     * A. 正常工作日，以9点上班为准，加班到20::00可报销餐补（上班晚于9点则顺延, 相当于上班11h）
     * B. 周末及节假日，加班时间超过4个小时则可报销餐补
     *
     * @param  {String} date   加班日期
     * @param  {String} begin  上班打卡时间
     * @param  {String} end    下班打卡时间
     * @return {Boolean} 返回是否可报销餐补
     */
    isCanGetMealBonus: function (date, begin, end) {
        let beginTime = new Date(date + ' ' + begin);
        let endTime = new Date(date + ' ' + end);
        let hours = (endTime - beginTime) / 1000 / 60 / 60;     // 总上班时长(h)
        let isWeekend = new Date(date).getDay() % 6 == 0; // 是否周末

        if (!isWeekend) {    // A. 正常工作日
            // 上班总时长够11h
            // 上班打卡11 AM之前
            // 下班打卡8 PM之后
            return hours >= 11 &&
                beginTime.getHours() < 11 &&
                endTime.getHours() >= 20

        } else {            // B. 周末（节假日偷懒就不算了）
            // 上班总时长够4h即可
            return hours >= 4
        }
    }
}

if (window.location.href === "http://kaoqin.jd.com/kaoqin/KaoQin") {

    Bonus.onReady()

} else {
    alert('请到JD打卡机页面再使用：http://kaoqin.jd.com/kaoqin/KaoQin')
}
