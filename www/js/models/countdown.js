(function () {
  "use strict";

  app.factory('countdownTimer', function (parser) {

    var countdownTimer = function () {
      var that = this;

      that.countdown = {};
      that.countdown.mins = null;
      that.countdown.seconds = null;

      // countdown timer
      that.countdown = function (minutes, parent, seconds) {
        if (seconds === 0) {
          return that.countdown(minutes - 1, parent, 60);
        }
        if (minutes < 0) {
          return;
        }
        if (document.getElementById('timer') && that.vm.play_index !== -1) {
          that.removeTimer();
        }
        that.countdown.mins = minutes;
        that.countdown.seconds = seconds || 60;
        var timerEl = document.createElement('div');
        timerEl.setAttribute('id', 'timer');
        parent.appendChild(timerEl);

        function tick() {
          var counter = document.getElementById('timer');
          var current_minutes = that.countdown.mins;
          that.countdown.seconds--;
          counter.innerText = current_minutes.toString() + ':' +
            (that.countdown.seconds < 10 ? '0' : '') +
            String(that.countdown.seconds);
          if (that.countdown.seconds > 0) {
            that.timer = setTimeout(tick, 1000);
          } else {

            if (that.countdown.mins >= 1) {

              that.countdown(that.countdown.mins - 1, parent, 60);

            }

          }
        }

        tick();
      }
    };

    return countdownTimer;
  });
})();
