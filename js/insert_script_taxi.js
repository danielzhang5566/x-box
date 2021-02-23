/**
 * @file 计算加班打车
 */

// 默认的日期配置
const defaultConfig = {
    // 排除日期：不纳入计算的日期，比如某些特殊日期打卡了但不计算
    exclusiveDays: [],

    // 节假日：要当作「节假日」计算的日期，比如元旦节来公司加班呢
    asHolidays: ['2021-01-01', '2021-02-11', '2021-02-12', '2021-02-11', '2021-02-16', '2021-02-17', '2021-03-05'],

    // 工作日：要当作「工作日」计算的日期，比如元旦前的周末要上班
    asWorkdays: ['2021-02-07', '2021-02-20'],

    isUseDefault: true,
    isNotUseDefault: false
}

/**
 * 简化选择器
 * @param  {String} elem 选择元素 ('body')/('#idName')/('.banner a')
 * @return {Object} 返回匹配的第一个元素对象
 */
function $(elem) {
    return document.querySelector(elem);
}

/**
 * 转换时间为秒
 *
 * @param  {String} time     时间，格式：hh:mm:ss 或 hh:mm
 * @return {Number} 返回秒数
 *
 */
function timeToSecond (time) {
    const tmp = time && time.split(':')
    let h = 0, m = 0, s = 0

    if(!tmp || tmp.length < 2 || tmp.length > 3) return 0

    if (tmp.length === 2) {
        h = +tmp[0]
        m = +tmp[1]
        s = 0
    } else if (tmp.length === 3) {
        h = +tmp[0]
        m = +tmp[1]
        s = +tmp[2]
    }

    return h * 3600 + m * 60 + s
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
        let overDays = 0            // 加班天数
        const { exclusiveDays, asHolidays, asWorkdays } = allConfig

        $('#content').childNodes.forEach(($item, i) => {
            let $cols = $item.childNodes,
                date = $cols[6].innerText.replace(/-/g, '/'),
                originalDate = $cols[6].innerText,
                begin = $cols[8].innerText,
                end = $cols[9].innerText;

            const { num, hours, type } =  Bonus.calculateBonus(date, originalDate, begin, end, exclusiveDays, asHolidays, asWorkdays)

            $cols[6].innerText += type

            if (begin && end) {
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
        $('#record').innerHTML += `<div style="margin: 10px 0 10px; font-size: 12px;">请留意节假日，调休日等是否正确计算，可在「特殊日期设置」中配置日期。</div>`
        $('#record').innerHTML += `<div style="margin: 30px 0; font-size: 24px;text-align: center;">满足【加班打车】有${overDays}天</div>`

        setTimeout(() => {
            overDays ?
                alert('满足【打车报销】有 ' + overDays + ' 天\n请注意核对') :
                alert('未检测到满足加班打车条件，努力加班吧：）')
        }, 0)
    },

    clean: function () {
        $('#content').childNodes.forEach(($item, i) => {
            $item.style.backgroundColor = 'white'
        })
    },

/*
    打车报销条件

    1.工作日加班打车：
        a) 冬令时：每年10月1日-次年3月31日，21:30-次日7:00间，有效工作时长超过10.5个小时后，可报销回程打车；
        b) 夏令时：每年4月1日-9月30日，22:00-次日7:00间，有效工作时长超过11个小时后，可报销回程打车;
    2.休息日加班打车：
        加班时长满8小时后，可报销单程/双程打车。
    3.培训日 9:00-12:00 工作时长不计入

    有效工作时长计算规则：
        有效工作时长 = 下班打卡时间 - 上班打卡时间 - 2（2小时为午饭&晚饭休息时间，如果有）

    例如，
        冬令时下「9:00 - 21:30」、「10:00 - 22:30」、「10:30 - 23:00」
        夏令时下「9:00 - 22:00」、「10:00 - 23:00」、「10:30 - 23:30」
    均可以报销。
*/

    /**
     * 计算当天加班打车报销
     *
     * @param  {String} date           日期，格式：YYYY/MM/DD
     * @param  {String} originalDate   原始日期，格式：YYYY-MM-DD
     * @param  {String} begin          上班打卡时间，格式：hh:mm:ss
     * @param  {String} end            下班打卡时间，格式：hh:mm:ss
     * @return {Object} .num 返回是否可报销加班打车
     *                  .hours 有效工作时长，小时数
     *                  .type 类型：[排除日]/[节假日]/[工作日]
     *
     * 注：暂不支持计算"跨夜加班"
     */
    calculateBonus: function (date, originalDate, begin, end, exclusiveDays, asHolidays, asWorkdays) {
        let beginDate = new Date(date + ' ' + begin) // 格式如：Fri Jan 01 2021 10:00:00 GMT+0800 (China Standard Time)
        let endDate = new Date(date + ' ' + end);
        let isWeekend = new Date(date).getDay() % 6 == 0; // 是否周末
        let isExclusiveDay = false
        let isHoliday = isWeekend

        let month = +date.split('/')[1]
        let isWinter = month < 4 || month >=10 // 是否冬令时

        let num = 0
        let type = ''

        // 有效工作时长/h（向下取整，保留1位小数）
        let hours = Math.floor(((endDate.getTime() - beginDate.getTime()) / 1000 / 60 / 60) * 10) / 10
        // 加班打车需要扣除2小时休息时间
        hours -= 2

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
            type = '[排除日]'
            hours = 0
        } else if (!isHoliday) {    // A. 正常工作日
            type = '[工作日]'

            if (isWinter) {
                if (timeToSecond(end) >= timeToSecond('21:30') && hours >= 10.5) {
                    num = 1
                }
            } else {
                if (timeToSecond(end) >= timeToSecond('22:00') && hours >= 11) {
                    num = 1
                }
            }
        } else {            // B. 周末或节假日
            type = '[节假日]'
            hours += 1 // 节假日了多幸苦，就扣1小时吧
            if (hours >= 8) {
                num = 1
            }
        }

        return {
            num,
            type,
            hours
        }
    }
}

Bonus.clean()
Bonus.onReady()
