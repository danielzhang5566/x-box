// 当前页面url
let currentUrl = ''
chrome.tabs.getSelected(null, function(tab) {
    currentUrl = tab.url
})

let XBOX = {
    data: {
        name: 'X-BOX工具箱'
    },
    init() {
        // 挂载事件
        this.addEvent();
    },
    addEvent() {
        let me = this;
        let $menu = $('.menu');

        // 事件委托
        $menu.addEventListener('click', function (e) {
            // 注意这里html层次为：
            // ul>li>text ，当点击到text时不会触发事件
            // 所以记得在css中运行【点击穿透】
            if (e.target) {
                switch (e.target.id) {
                    case 'calculate-meal-bonus':
                        me.calculateMealBonus();
                        break;
                    case 'calculate-taxi-bonus':
                        me.calculateTaxiBonus();
                        break;
                    case 'waiting-for-u':
                        me.waitingForU();
                        break;
                    case 'setting':
                      me.jumpToSetting();
                      break;
                    case 'about':
                        me.about();
                        break;
                    default:
                        break;
                }
            }
        });
    },
    calculateMealBonus() {
        if(isOnLegalPage('http://kaoqin.jd.com/kaoqin/KaoQin')) {
            // 注入餐补计算脚本
            chrome.tabs.executeScript(null, {file: "./js/insert_script_meal.js"});
        }
    },
    calculateTaxiBonus() {
        if(isOnLegalPage('http://kaoqin.jd.com/kaoqin/KaoQin')) {
            // 注入打车计算脚本
            chrome.tabs.executeScript(null, {file: "./js/insert_script_taxi.js"});
        }
    },
    jumpToSetting() {
        chrome.tabs.create({ url: "options.html" })
    },
    waitingForU() {

    },
    about() {
        chrome.tabs.create({ url: "about.html" })
    }
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
 * 判断当前是否在合法页面
 * @param  {String} url 目标页面
 * @return {Boolean}
 */
function isOnLegalPage(url) {
    const pattern = new RegExp(url, 'i')

    if (pattern.test(currentUrl)) {
        return true
    } else {
        alert(`请在【${url}】使用本功能`)
        return false
    }
}


document.addEventListener("DOMContentLoaded", function (event) {
    XBOX.init();
});
