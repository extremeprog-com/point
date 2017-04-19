(function () {
  "use strict";

  pointApp.factory('timeProcessing', function () {

    var TimeProcessing = function () {
      var that = this;
      var timeReg = /\d{1,2}\s?(мин|м|min|mins|m)$/i;


      /**
       * parse time from task string
       * @param {string} str - text of task
       * @returns {number} - time in seconds
       */
      that.parseTime = function (str) {
        var time = str.match(timeReg);

        if (time !== null) {
          time = time[0];
          var timeNum = parseInt(time, 10);
          return timeNum * 60;
        } else {
          return 2 * 60;
        }
      };


      /**
       * trim time from task text
       * @param {string} str - text of task
       */
      that.trimTime = function (str) {
        return str.replace(timeReg, '');
      };


      /**
       * get left
       * @param el
       * @returns {[*,*]}
       */
      that.getCurrentTime = function (el) {
        var time = document.querySelector(el).innerText,
          regex = /(\d{1,2})/g,
          mins = parseInt(time.match(regex)[0]),
          sec = parseInt(time.match(regex)[1]);

        return [mins, sec];
      };


      /**
       * add 1 min to delay to end of task playing
       * @param currentTime
       * @returns {number} - minutes to and
       */
      that.addMinute = function (currentTime) {
        return parseInt(currentTime) + 1;
      };


      /**
       * substract 1 min from delay to end of task playing
       * @param currentTime
       * @returns {number}
       */
      that.subtractsMinute = function (currentTime) {
        return Math.max(0, (parseInt(currentTime) - 1));
      };

    };

    return new TimeProcessing();
  });
})();
