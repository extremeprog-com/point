(function () {
  "use strict";

  pointApp.factory('countdown', function (vm, timeProcessing) {

    var Countdown = function () {
      var that  = this;
      that.mins = null;
      that.sec  = null;
      that.start_ms = 0;


      /**
       * get parent elem for append a countdown timer
       * @param {number} index - index of task
       */
      that.getParent = function (index) {
        return document.getElementsByClassName('list')[0].children[index].children[0];
      };

      that.startTimer = function (minutes, seconds, parent) {
        that.start_ms = Date.now() % 1000;
        return that.add(minutes, seconds, parent);
      }

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
        if (document.getElementById('timer') && vm.play_index !== -1) {
          that.removeTimer();
        }

        that.mins = minutes;
        that.sec  = seconds || 60;

        var timerEl = document.createElement('div');
        timerEl.setAttribute('id', 'timer');
        console.log(parent);
        console.log(timerEl);
        parent.appendChild(timerEl);

        tick(parent);
      };

      function tick(parent) {
        var counter         = document.getElementById('timer');
        var current_minutes = that.mins;
        that.sec -= 1;
        counter.innerText   = current_minutes.toString() + ':' +
          (that.sec < 10 ? '0' : '') +
          String(that.sec);
        if (that.sec >= 0) {
          var curr_ms = Date.now() % 1000;
          var wait = curr_ms >= that.start_ms ? ( 1000 - curr_ms + that.start_ms ) : (that.start_ms - curr_ms);
          that.timer = setTimeout(function(){ tick(parent) }, wait);
        } else {

          if (that.mins >= 1) {

            that.add(that.mins - 1, 60, parent);

          }
        }
      }

      that.removeTimer = function () {
        var timer = document.getElementById('timer');
        if(timer) {
          timer.remove();
          clearTimeout(that.timer);
        }
      }

    };
    return new Countdown();
  });
})();
