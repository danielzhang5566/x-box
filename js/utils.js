/**
 * 判断当前时间是否在开始和结束时间之间
 * 例：isInTime('2018-09-25','2018-10-24','2018-10-18')
 * @param {string} start 开始时间
 * @param {string} end 结束时间
 * @param {string} now 当前时间
 *
 * @return {boolean} 当前时间是否在开始和结束时间之间
 *
 */
export function isInTime(start, end, now) {
    const startTime = new Date(start.replace(/-/g, '/'))
    const endTime = new Date(end.replace(/-/g, '/'))
    const nowTime = new Date(now.replace(/-/g, '/'))
    return startTime < nowTime && endTime > nowTime
}

/**
 * 判断当前时间是否在补贴计算周期内
 * 例：isLegalTime('2018-10-24')
 * @description 上个月25号到这个月24号
 *
 * @return {boolean} 是否合法时间
 *
 */
export function isLegalTime(time) {
    const date = new Date()
    const startTime = new Date(date.getFullYear() + '/' + date.getMonth() + '/' + '25')
    const endTime = new Date(date.getFullYear() + '/' + (date.getMonth() + 2) + '/' + '24')
    const nowTime = new Date(time.replace(/-/g, '/'))
    return startTime < nowTime && endTime > nowTime
}
