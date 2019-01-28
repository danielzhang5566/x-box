// 计算加班餐补

/**
 * 简化选择器
 * @param  {String} elem 选择元素 ('body')/('#idName')/('.banner a')
 * @return {Object} 返回匹配的第一个元素对象
 */
function $(elem) {
    return document.querySelector(elem);
}

Bonus = {

    onReady: function () {
        $('#content').childNodes.length && Bonus.calc()
    },

    calc: function () {
        const MONEY_PRE_DAY = 15    // 每日餐补金额
        let overDays = 0            // 加班天数
        let overNumCounts = 0       // 加班获取多少份15元

        $('#content').childNodes.forEach(($item, i) => {
            let $cols = $item.childNodes,
                date = $cols[6].innerText.replace(/-/g, '/'),
                begin = $cols[8].innerText,
                end = $cols[9].innerText;

            const { num, isWeekend, hours } =  Bonus.calculateBonus(date, begin, end)

            if (begin && end && num) {
                overDays += 1
                overNumCounts += num

                $cols[1].innerText = '✓ ' + $cols[1].innerText
                $cols[9].innerText += (isWeekend ? ' [周]':' [工]') + hours + 'h'
                $item.style.backgroundColor = 'yellow'
            }
        })

        $('#record').innerHTML += `<div style="margin: 30px 0 10px; font-size: 24px;text-align: center;">加班${overDays}天，可申请 ${overNumCounts * MONEY_PRE_DAY}¥</div>`

        setTimeout(() => {
            overDays ?
                alert('补贴提醒：' + '加班 ' + overDays + ' 天,获取 ￥' + overNumCounts * MONEY_PRE_DAY + ' 元') :
                alert('补贴提醒：' + '未检测到加班，请刷新页面重试～')
        }, 0)
    },

    clean: function () {
        $('#content').childNodes.forEach(($item, i) => {
            $item.style.backgroundColor = 'white'
        })
    },

    /**
     * 计算获得加班餐补份数（一份 = 15元）
     * A. 正常工作日，以9点上班为准，加班到20::00可报销餐补（上班晚于9点则顺延, 减去中午休息一小时相当于上班10h）
     * B. 周末及节假日，加班时间满4个小时可报销15，满8个小时报销30
     *
     * @param  {String} date   加班日期
     * @param  {String} begin  上班打卡时间
     * @param  {String} end    下班打卡时间
     * @return {Object} .num 返回是否可报销餐补份数（1份 = 15元）
     *                  .isWeekend 是否周末
     *                  .hours 小时数
     */
    calculateBonus: function (date, begin, end) {
        let beginTime = new Date(date + ' ' + begin);
        let endTime = new Date(date + ' ' + end);
        let hours = Math.round((endTime - beginTime) / 1000 / 60 / 60 -1);     // 总上班时长(h)
        let isWeekend = new Date(date).getDay() % 6 == 0; // 是否周末

        let num = 0

        if (!isWeekend) {    // A. 正常工作日
            // 上班总时长够10h
            // 上班打卡11 AM之前
            // 下班打卡8 PM之后
            num = hours >= 10 &&
                beginTime.getHours() < 11 &&
                endTime.getHours() >= 20
                  ? 1 : 0
        } else {            // B. 周末（节假日偷懒就不算了）
            ++hours // 周末不扣除1小时休息时间

            // 上班总时 满4h --> 15元，满8h --> 15元 x 2份
            num = hours < 4
              ? 0 : hours < 8
                ? 1 : 2
        }

        return {
            num,
            isWeekend,
            hours
        }
    }
}

// Bonus.clean()
Bonus.onReady()
