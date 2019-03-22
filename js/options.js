// 默认的日期配置
const config = {
  // 排除日期：不纳入计算的日期，比如某些特殊日期打卡了但不计算
  exclusiveDays: [],

  // 节假日：要当作「节假日」计算的日期，比如元旦节来公司加班呢
  asHolidays: ['2019-04-05', '2019-04-06', '2019-04-07', '2019-05-01'],

  // 工作日：要当作「工作日」计算的日期，比如元旦前的周末要上班
  asWorkdays: []
}

let form = $('form')

form.addEventListener('submit', function(event) {
  event.preventDefault()

  const exclusiveDaysCustom = convertStrToDays($('#exclusiveDaysCustom').value)
  const asHolidaysCustom = convertStrToDays($('#asHolidaysCustom').value)
  const asWorkdaysCustom = convertStrToDays($('#asWorkdaysCustom').value)

  if(!exclusiveDaysCustom || !asHolidaysCustom || !asWorkdaysCustom) {
    alert('输入格式不正确，请检查格式，像「2019-1-1」「2019-01-01,」「2019-01-01，2019-11-11」（中文逗号）都是不合法的。')
  }

  const data = {
    exclusiveDays: config.exclusiveDays.concat(exclusiveDaysCustom),
    asHolidays: config.asHolidays.concat(asHolidaysCustom),
    asWorkdays:  config.asWorkdays.concat(asWorkdaysCustom),
  }

  // alert(JSON.stringify(data))

}, false)


function renderDefaultConfig() {
  $('#exclusiveDaysDefault').innerText = config.exclusiveDays
  $('#asHolidaysDefault').innerText = config.asHolidays
  $('#asWorkdaysDefault').innerText = config.asWorkdays
}


/**
 * 简化选择器
 * @param  {String} ele 选择元素 ('body')/('#idName')/('.banner a')
 * @return {Object} 返回匹配的第一个元素对象
 */
function $(elem) {
  return document.querySelector(elem);
}

/**
 * 转换输入框字符串为日期数组
 * @param  {String} str 输入
 * @return 返回转换好的日期数组，空str输入返回[]，错误输入返回false
 */
function convertStrToDays(str) {
  let results = []
  let isLegalStr = true

  str = str.trim()

  if(str === '') return []

  const days = str.split(',')

  days.forEach(day => {
    if( /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(day)) {
      results.push(day)
    } else {
      isLegalStr = false
    }
  })

  return isLegalStr ? results : false
}


document.addEventListener("DOMContentLoaded", function (event) {
  renderDefaultConfig()
})
