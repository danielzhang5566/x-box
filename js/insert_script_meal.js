/**
 * @file 计算加班餐补
 */

// 默认的日期配置
const defaultConfig = {
    // 排除日期：不纳入计算的日期，比如某些特殊日期打卡了但不计算
    exclusiveDays: [],

    // 节假日：要当作「节假日」计算的日期，比如元旦节来公司加班呢
    asHolidays: ['2021-04-03', '2021-04-04', '2021-04-05', '2021-05-01', '2021-05-02', '2021-05-03', '2021-05-04', '2021-05-05', '2021-06-12', '2021-06-13', '2021-06-14' ],

    // 工作日：要当作「工作日」计算的日期，比如元旦前的周末要上班
    asWorkdays: ['2021-04-25', '2021-05-08'],

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
        $('#record').innerHTML += `<div style="margin: 10px 0 10px; font-size: 12px;">请留意节假日，调休日等是否正确计算，可在「特殊日期设置」中配置日期。</div>`
        $('#record').innerHTML += `<div style="margin: 30px 0; font-size: 24px;text-align: center;">满足【加班餐补】有${overDays}天，可申请 ${overNumCounts * MONEY_PRE_DAY}¥</div>`

        setTimeout(() => {
            overDays ?
                alert('满足【加班餐补】有 ' + overDays + ' 天，可申请 ￥' + overNumCounts * MONEY_PRE_DAY + ' 元\n请注意核对') :
                alert('未检测到满足加班餐补条件，努力加班吧：）')
        }, 0)
    },

    clean: function () {
        $('#content').childNodes.forEach(($item, i) => {
            $item.style.backgroundColor = 'white'
        })
    },

    /*
    餐补报销条件：

        工作日：
            工作时长满 10 小时可申请加班餐补：15 元

        休息日：
            工作时长满 4 小时可申请加班餐补：15 元
            工作时长满 8 小时可申请加班餐补：30 元

        工作时长计算规则：
            工作时长 = 下班打卡时间 - 上班打卡时间 - 1（1小时为午饭休息时间，如果有）

        例如，
            「9:00 - 20:00」、「10:00 - 21:00」
        均可报销餐补。
    * */

    /**
     * 计算当天获得加班餐补份数（一份 = 15元）
     *
     * @param  {String} date           日期，格式：YYYY/MM/DD
     * @param  {String} originalDate   原始日期，格式：YYYY-MM-DD
     * @param  {String} begin          上班打卡时间，格式：hh:mm:ss
     * @param  {String} end            下班打卡时间，格式：hh:mm:ss
     * @return {Object} .num 返回是否可报销餐补份数（1份 = 15元）
     *                  .hours 工作时长，小时数
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

        let num = 0
        let type = ''

        // 工作时长/h（向下取整）
        let hours = Math.floor((endDate.getTime() - beginDate.getTime()) / 1000 / 60 / 60)
        // 如果上班起止时间跨越中午（12:00-13:00），需要扣除1小时休息时间
        if (timeToSecond(begin) < timeToSecond('12:00') && timeToSecond(end) > timeToSecond('13:00')) {
            hours -= 1
        }

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

            // 上班总时长满10h
            // 上班打卡11 AM之前
            // 下班打卡8 PM之后
            num = hours >= 10 &&
                beginDate.getHours() < 11 &&
                endDate.getHours() >= 20
                  ? 1 : 0
        } else {            // B. 周末或节假日
            type = '[节假日]'

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
