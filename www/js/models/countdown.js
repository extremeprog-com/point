(function () {
  "use strict";

  pointApp.factory('countdown', function () {

    var Countdown = function () {
      var that = this,
          mins = null,
          sec  = null;


      /**
       * get parent elem for append a countdown timer
       * @param {number} index - index of task
       */
      that.getParent = function (index) {
        return document.getElementsByClassName('list')[0].children[index].children[0];
      };

      /**
       * add countdown timer to parent element
       * @param {number} minutes - minutes to end of task
       * @param {number} seconds - seconds to end of task
       * @param {object} parent - parent DOM element to append timer
       */
      that.add = function (minutes, seconds, parent) {
        if (seconds === 0) {
          return that.add(minutes - 1, 60, parent);
        }
        if (minutes < 0) {
          return;
        }
        if (document.getElementById('timer') && that.vm.play_index !== -1) {
          that.removeTimer();
        }

        mins = minutes;
        sec  = seconds || 60;

        var timerEl = document.createElement('div');
        timerEl.setAttribute('id', 'timer');
        console.log(parent);
        console.log(timerEl);
        parent.appendChild(timerEl);

        tick();
      };

      function tick() {
        var counter         = document.getElementById('timer');
        var current_minutes = mins;
        sec -= 1;
        counter.innerText   = current_minutes.toString() + ':' +
          (sec < 10 ? '0' : '') +
          String(sec);
        if (sec > 0) {
          that.timer = setTimeout(tick, 1000);
        } else {

          if (mins >= 1) {

            that.add(mins - 1, 60, parent);

          }
        }
      }

      that.removeTimer = function () {
        document.getElementById('timer').remove();
        clearTimeout(that.timer);
      }

    };
    return new Countdown();
  });
})();
