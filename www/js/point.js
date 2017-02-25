pointApp.controller('point', function($scope, $interval, $timeout) {
  "use strict";

  $scope.vm = {};
  var textenter = {textenter: 1};
  $scope.vm.old_list = angular.fromJson(localStorage.vmOldList) || null;
  $scope.vm.focus_index = -1;
  $scope.vm. play_index = -1;
  $scope.vm.delete_index= -1;
  $scope.textenter = textenter;
  $scope.lastActions = angular.fromJson(localStorage.lastActions) || null;
  $scope.rebase_period = 2 * 60 * 60 * 1000;
  var timeReg = /\d{1,2}\s{0,1}(мин|м|min|mins|m)$/i;

  $scope.countdown = {};
  $scope.countdown.mins = null;
  $scope.countdown.seconds = null;

  var def_min = 2, 
      sec_before_end = 30,
      time_scale = 60, // need 60
      repeat_int = 2; // repeat next message interval

  window.$scope = $scope;

  // cordova plugins
  $scope.insomniaOn = function () {
    try {
      if ($scope.vm.play_index !== -1) {
        window.cordova.plugins.insomnia.keepAwake();
      }
    } catch(e) {
      console.error(e.stack);
    }
  }

  $scope.insomniaOff = function () {
    try {
    window.cordova.plugins.insomnia.allowSleepAgain();
    } catch(e) {
      console.error(e.stack);
    }
  }

  // timeouts id
  var _to1 = null;
  var _to2 = null;
  var _to3 = null;
   
  // update $scope.vm.list
  if (!localStorage.vmList || localStorage.vmList === 'undefined') {
    $scope.vm.list = [textenter];
    localStorage.vmList = angular.toJson($scope.vm.list);
  } else {
    $scope.vm.list = angular.fromJson(localStorage.vmList);
    textenter =  $scope.vm.list.filter(function (x) {
      return x.textenter == 1;
    })[0]; 
    $scope.textenter = textenter;
  }

  // write tasks to localStorage
  $scope.$watchCollection('vm.list', function() {
    localStorage.vmList = angular.toJson($scope.vm.list);
  }, true);

  // write old tasks to localStorage
  $scope.$watchCollection('vm.old_list', function() {
    localStorage.vmOldList = angular.toJson($scope.vm.old_list);
  }, true);

  // set interval to check time
  // save old task to new array
  // and clean local storage vmList
  $scope.startRebasePeriod = function () {
    $timeout.cancel(_to3);
    var now = Date.now();
    // console.log('Было ', $scope.rebase_period);
    if ($scope.lastActions + $scope.rebase_period > now) {
      $scope.rebase_period = ($scope.lastActions + $scope.rebase_period) - now;
      // console.log('Осталось ', $scope.rebase_period);
      _to3 = $timeout(function () {
        $scope.vm.old_list = $scope.vm.list.slice(0);
        localStorage.vmList = undefined;

        // console.log('old list: ', $scope.vm.old_list);
        $timeout.cancel(_to3);

      }, $scope.rebase_period, true);
    }
  }

  $scope.startRebasePeriod();

  // update lastActions datetime
  $scope.updateLastActDate = function () {
    $interval.cancel(_to3);
    $scope.lastActions = Date.now();
    localStorage.lastActions = angular.toJson($scope.lastActions);
    $scope.startRebasePeriod();
  }

  // catch user activity
  document.body.addEventListener('click', $scope.updateLastActDate, true);
  document.body.addEventListener('drag', $scope.updateLastActDate, true);
  document.body.addEventListener('keypress', $scope.updateLastActDate, true);
  $scope.$watch('msg', function() {
    $scope.updateLastActDate();
    console.log('msg changed');
  }, true);

  // controll play, pause, delete button
  $scope.controlPlay = function ($index, item) {
    if ($scope.vm.delete_index == $index) {

      $scope.vm.list.splice($index, 1);
      $scope.vm.delete_index = -1;

    } else if ($scope.vm.play_index != $index) {

      $scope.play($index, item);

    } else if ($scope.vm.play_index == $index) {

      $scope.stopPlay();

    } else {
      $scope.vm.play_index == $index && $scope.play(-1, item);
    }
  }

  // parse time from task text
  $scope.parseTime = function (str) {
    var time = str.match(timeReg); 

    if (time !== null) {
      time = time[0];
      var timeNum = parseInt(time, 10);
      return timeNum; 
    } else {
      return 2;
    }
  }; 

  // trim time from task text
  $scope.trimTime = function (str) {
    return str.replace(timeReg, '');
  }

  // get parent elem for insert a countdown timer
  $scope.getParent = function (index) {
    return document.getElementsByClassName('list')[0].children[index].children[0];
  }

  $scope.removeTimer = function () {
    document.getElementById('timer').remove();
    clearTimeout($scope.timer);
  }

  // countdown timer
  $scope.countdown = function (minutes, parent, seconds) {
    if (seconds === 0) {
      return $scope.countdown(minutes - 1, parent, 60);
    }
    if (minutes < 0) {
      return;
    }
    if (document.getElementById('timer') && $scope.vm.play_index !== -1) {
      $scope.removeTimer();
    }
    $scope.countdown.mins = minutes;
    $scope.countdown.seconds = seconds || 60;
    var timerEl = document.createElement('div');
    timerEl.setAttribute('id', 'timer');
    parent.appendChild(timerEl);

    function tick() {
      var counter = document.getElementById('timer');
      var current_minutes = $scope.countdown.mins;
      $scope.countdown.seconds--;
      counter.innerText = current_minutes.toString() + ':' +
        ($scope.countdown.seconds < 10 ? '0' : '') +
        String($scope.countdown.seconds);
      if( $scope.countdown.seconds > 0 ) {
        $scope.timer = setTimeout(tick, 1000);
      } else {

        if($scope.countdown.mins > 1){

          $scope.countdown($scope.countdown.mins - 1, parent, 60);

        }

      }
    }
    tick();
  }

  $scope.util = Core.Class({
    /**
     * Returns plural suffix of unit
     *      plural(days, "%d день", "%d дня", "%d дней")
     *
     * @param {Number} num
     * @param {String} one
     * @param {String} two
     * @param {String} many
     * @returns {String}
     */
    plural: function(num, one, two, many) {
      return (function(num) { return (num == 1 && one) 
        || (num && num < 5 && parseInt(num) == num && two) || many }) 
        (parseFloat(num)%10 + (parseInt(num/10)%10==1?1:0) * 10).replace(/%d/g, num);
    }
  });

  $scope.stopPlay = function () {
    $scope.insomniaOff();
    $timeout.cancel(_to1);
    $timeout.cancel(_to2);

    $scope.msg = null;
    $scope.vm.play_index = -1;

    $scope.removeTimer();
  }

  // play task
  $scope.play = function($index, item) {
    $scope.insomniaOn();
    $timeout.cancel(_to1);
    $timeout.cancel(_to2);

    $scope.vm.play_index = $scope.vm.list.indexOf(textenter) > $index ? $index : -1;

    if($scope.vm.play_index == -1) {
      return;
    }

    if (document.getElementById('timer') && $scope.vm.play_index !== -1) {
      $scope.removeTimer();
    }

    // time from the task suffix
    def_min = $scope.parseTime(item);
    // text of task without time in suffix
    var task = $scope.trimTime($scope.vm.list[$scope.vm.play_index]);
    console.log(item, $index, def_min);
    var declensionedTime = (def_min === 1) ? 'одну минуту '
      : $scope.util.plural(def_min, "%d минуту. ", "%d минуты. ", "%d минут. ");

    // set countdown timer
    $scope.countdown(def_min, $scope.getParent($scope.vm.play_index), 0);

    $scope.msg = 'Задача на ' + declensionedTime + task;

    _to1 = $timeout(function() {
      $scope.msg = sec_before_end + ' секунд до конца задачи. ' + task;
    }, (def_min * time_scale - sec_before_end) * 1000, true );

    var setLeftTimeout = function () {
      _to1 = $timeout(function() {
        left_time -= repeat_int;
        $scope.msg = task + 'Осталось' +
          $scope.util.plural(left_time, "%d минута. ", "%d минуты. ", "%d минут. ") +
          ' до конца задачи. ';

        $timeout.cancel(_to1);
        if ($scope.vm.play_index === $index && left_time > 2) {
          setLeftTimeout();
        }
      }, repeat_int * time_scale * 1000, true );
    }

    var left_time = def_min;
    if (def_min >= 3 && left_time > 2) {
      setLeftTimeout(task, left_time);
    }


    _to2 = $timeout(function() {
      var idx = $scope.vm.list.indexOf(textenter) <= ++$scope.vm.play_index ? 0 : $scope.vm.play_index;
      $scope.play(idx, $scope.vm.list[idx]);
    }, def_min * time_scale * 1000, true );

    $scope.$$phase || $scope.$apply();

  };

  $scope.onTextareFocus = function ($index) {
    $scope.this_task = $scope.vm.list[$index];
  }

  $scope.onTextareaBlur = function ($index, item) {
    $scope.vm.focus_index = -1;
    if ($scope.this_task !== $scope.vm.list[$index] &&
        $scope.vm.play_index !== -1 &&
        $scope.vm.play_index === $index) {
      $scope.play($index, item);
    }
  }

  $scope.onReorder = function (item, $fromIndex, $toIndex) {

    console.log($fromIndex, $toIndex, $scope.vm.play_index);

    $scope.vm.list.splice($fromIndex, 1);
    $scope.vm.list.splice($toIndex, 0, item);

    if($fromIndex == $scope.vm.play_index) {

      $scope.vm.play_index = $toIndex;

      // $scope.removeTimer();
      $scope.countdown($scope.countdown.mins, $scope.getParent($scope.vm.play_index), $scope.countdown.seconds);

      if($scope.vm.play_index > $scope.vm.list.indexOf(textenter)) {
        var idx = $fromIndex >= $scope.vm.list.indexOf(textenter) ? 0 : $fromIndex;
        $scope.play(idx, $scope.vm.list[idx]);
      }
    } else if($scope.vm.play_index < $fromIndex && $scope.vm.play_index >= $toIndex) {
      $scope.vm.play_index++;
    } else if($scope.vm.play_index > $fromIndex && $scope.vm.play_index < $toIndex) {
      $scope.vm.play_index--;
    }

    $scope.$$phase || $scope.$apply();
  }

});
