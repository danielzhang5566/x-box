// 计算加班餐补

/**
 * 简化选择器
 * @param  {String} elem 选择元素 ('body')/('#idName')/('.banner a')
 * @return {Object} 返回匹配的第一个元素对象
 */
function $(elem) {
    return document.querySelector(elem);
}

// 默认的日期配置
const defaultConfig = {
    // 排除日期：不纳入计算的日期，比如某些特殊日期打卡了但不计算
    exclusiveDays: [],

    // 节假日：要当作「节假日」计算的日期，比如元旦节来公司加班呢
    asHolidays: ['2020-10-01', '2020-10-02', '2020-10-03', '2020-10-04', '2020-10-05', '2020-10-06', '2020-10-07', '2020-10-08'],

    // 工作日：要当作「工作日」计算的日期，比如元旦前的周末要上班
    asWorkdays: ['2020-09-27', '2020-10-10'],

    isUseDefault: true,
    isNotUseDefault: false
}

Bonus = {

    onReady: function () {
        chrome.storage.sync.get(['userConfigString'], function(items) {
            const { userConfigString } = items
            console.log('获取userConfigString：', userConfigString)

            let userConfig

            try {
                userConfig = JSON.parse(userConfigString)
            } catch (e) {
                console.log('初始化用户配置失败，userConfig不合法或者未设置。')
            }

            if(!userConfig) userConfig = {
                exclusiveDays: [],
                asHolidays: [],
                asWorkdays: []
            }

            const allConfig = {
                exclusiveDays: userConfig.isNotUseDefault ? userConfig.exclusiveDays : defaultConfig.exclusiveDays.concat(userConfig.exclusiveDays),
                asHolidays: userConfig.isNotUseDefault ? userConfig.asHolidays : defaultConfig.asHolidays.concat(userConfig.asHolidays),
                asWorkdays:  userConfig.isNotUseDefault ? userConfig.asWorkdays : defaultConfig.asWorkdays.concat(userConfig.asWorkdays)
            }

            $('#content').childNodes.length && Bonus.calc(allConfig)
        })
    },

    calc: function (allConfig) {
        console.log('获取的配置：', allConfig)
        const { exclusiveDays, asHolidays, asWorkdays } = allConfig
        const MONEY_PRE_DAY = 15    // 每日餐补金额
        let overDays = 0            // 加班天数
        let overNumCounts = 0       // 加班获取多少份15元

        $('#content').childNodes.forEach(($item, i) => {
            let $cols = $item.childNodes,
                date = $cols[6].innerText.replace(/-/g, '/'),
                originalDate = $cols[6].innerText,
                begin = $cols[8].innerText,
                end = $cols[9].innerText;

            const { num, hours, type } =  Bonus.calculateBonus(date, originalDate, begin, end, exclusiveDays, asHolidays, asWorkdays)

            $cols[6].innerText += type

            if (begin && end) {
                overNumCounts += num

                $cols[9].innerText += '[' + hours + 'h]'

                if (num) {
                    overDays += 1
                    $cols[1].innerText = '✓ ' + $cols[1].innerText
                    $item.style.backgroundColor = 'yellow'
                }
            }
        })

        const specialDaysString = exclusiveDays.concat(asHolidays, asWorkdays).toString()

        $('#record').innerHTML += `<div style="margin: 10px 0 10px; font-size: 12px;">已设置的特殊日期：${specialDaysString || '（无）'}</div>`
        $('#record').innerHTML += `<div style="margin: 30px 0; font-size: 24px;text-align: center;">加班${overDays}天，可申请 ${overNumCounts * MONEY_PRE_DAY}¥</div>`

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
     * @param  {String} date           日期
     * @param  {String} originalDate   原始日期
     * @param  {String} begin          上班打卡时间
     * @param  {String} end            下班打卡时间
     * @return {Object} .num 返回是否可报销餐补份数（1份 = 15元）
     *                  .hours 小时数
     *                  .type 类型：[除]/[假]/[班]
     */
    calculateBonus: function (date, originalDate, begin, end, exclusiveDays, asHolidays, asWorkdays) {
        let beginTime = new Date(date + ' ' + begin);
        let endTime = new Date(date + ' ' + end);
        let hours = Math.floor((endTime - beginTime) / 1000 / 60 / 60 -1); // 总上班时长(h)，扣除1小时休息时间，向下取整
        let isWeekend = new Date(date).getDay() % 6 == 0; // 是否周末
        let type = ''

        let num = 0

        let isExclusiveDay = false
        let isHoliday = isWeekend

        exclusiveDays.some(item => {
            if (item === originalDate) {
                isExclusiveDay = true
                return true
            }
        })

        asHolidays.some(item => {
            if (item === originalDate) {
                isHoliday = true
                return true
            }
        })

        asWorkdays.some(item => {
            if (item === originalDate) {
                isHoliday = false
                return true
            }
        })

        if (isExclusiveDay) {
            return { num: 0, type: '[排除日]', hours }
        } else if (!isHoliday) {    // A. 正常工作日
            type = '[工作日]'
            // 上班总时长满10h
            // 上班打卡11 AM之前
            // 下班打卡8 PM之后
            num = hours >= 10 &&
                beginTime.getHours() < 11 &&
                endTime.getHours() >= 20
                  ? 1 : 0
        } else {            // B. 周末或节假日
            type = '[节假日]'
            ++hours // 不扣除1小时休息时间了

            // 上班总时 满4h --> 15元，满8h --> 15元 x 2份
            num = hours < 4
              ? 0 : hours < 8
                ? 1 : 2
        }

        return {
            num,
            type,
            hours
        }
    }
}

// Bonus.clean()
Bonus.onReady()
