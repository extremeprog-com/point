pointApp.controller('point', ['$scope', '$interval', '$timeout', 'vm', 'countdown', 'timeProcessing', function ($scope, $interval, $timeout, vm, countdown, timeProcessing) {
  "use strict";

  $scope.vm            = vm;
  var textenter        = {textenter: 1};
  $scope.textenter     = textenter;
  $scope.lastActions   = angular.fromJson(localStorage.lastActions) || null;
  $scope.rebase_period = 2 * 60 * 60 * 1000;

  var time_scale     = 60,
      task_sec       = 2 * time_scale,
      sec_before_end = time_scale / 2,
      repeat_int     = 2 * time_scale; // repeat next message interval in sec


  // cordova plugins
  $scope.insomniaOn = function () {
    try {
      if ($scope.vm.play_index !== -1) {
        window.cordova.plugins.insomnia.keepAwake();
      }
    } catch (e) {
      console.error(e.message + ". --> No cordova plugin");
    }
  };

  $scope.insomniaOff = function () {
    try {
      window.cordova.plugins.insomnia.allowSleepAgain();
    } catch (e) {
      console.error(e.message + ". --> No cordova plugin");
    }
  };

  // timeouts id
  var _to1 = null;
  var _to2 = null;
  var _to3 = null;

  // update $scope.vm.list
  if (!localStorage.vmList || localStorage.vmList === 'undefined') {
    $scope.vm.list      = [textenter];
    localStorage.vmList = angular.toJson($scope.vm.list);
  } else {
    $scope.vm.list   = angular.fromJson(localStorage.vmList);
    textenter        = $scope.vm.list.filter(function (x) {
      return x.textenter == 1;
    })[0];
    $scope.textenter = textenter;
  }

  // write tasks to localStorage
  $scope.$watchCollection('vm.list', function () {
    localStorage.vmList = angular.toJson($scope.vm.list);
  }, true);

  // write old tasks to localStorage
  $scope.$watchCollection('vm.old_list', function () {
    localStorage.vmOldList = angular.toJson($scope.vm.old_list);
  }, true);

  // set interval to check time
  // save old task to new array
  // and clean local storage vmList
  $scope.startRebasePeriod = function () {
    $timeout.cancel(_to3);
    var now = Date.now();
    if ($scope.lastActions + $scope.rebase_period > now) {
      $scope.rebase_period = ($scope.lastActions + $scope.rebase_period) - now;
      _to3                 = $timeout(function () {
        $scope.vm.old_list  = $scope.vm.list.slice(0);
        localStorage.vmList = undefined;

        $timeout.cancel(_to3);

      }, $scope.rebase_period, true);
    }
  };

  $scope.startRebasePeriod();

  // update lastActions datetime
  $scope.updateLastActDate = function () {
    $interval.cancel(_to3);
    $scope.lastActions       = Date.now();
    localStorage.lastActions = angular.toJson($scope.lastActions);
    $scope.startRebasePeriod();
  };

  // catch user activity
  document.body.addEventListener('click', $scope.updateLastActDate, true);
  document.body.addEventListener('drag', $scope.updateLastActDate, true);
  document.body.addEventListener('keypress', $scope.updateLastActDate, true);
  $scope.$watch('msg', function () {
    $scope.updateLastActDate();
  }, true);

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
    plural: function (num, one, two, many) {
      return (function (num) {
        return (num == 1 && one)
          || (num && num < 5 && parseInt(num) == num && two) || many
      })
      (parseFloat(num) % 10 + (parseInt(num / 10) % 10 == 1 ? 1 : 0) * 10).replace(/%d/g, num);
    }
  });


  // functions for playing and stopping task


  function initPlay($index, mins, sec) {
    if (mins && sec) task_sec = (mins * 60) + sec; // seconds
    $scope.insomniaOn();
    $timeout.cancel(_to1);
    $timeout.cancel(_to2);

    $scope.vm.play_index = $scope.vm.list.indexOf(textenter) > $index ? $index : -1;

    if ($scope.vm.play_index == -1) {
      return;
    }

    if (document.getElementById('timer') && $scope.vm.play_index !== -1) {
      countdown.removeTimer();
    }
  }

  function setTaskTimeout() {
    _to2 = $timeout(function () {
      var idx = $scope.vm.list.indexOf(textenter) <= ++$scope.vm.play_index ? 0 : $scope.vm.play_index;
      $scope.play(idx, $scope.vm.list[idx], null, null);
    }, task_sec * 1000, true);
  }

  function setNoticeBeforeEndTimeout(task) {
    _to1 = $timeout(function () {
      $scope.msg = sec_before_end + ' секунд до конца задачи. ' + task;
    }, (task_sec - sec_before_end) * 1000, true);
  }

  function setTask(task, item, mins, sec) {
    if (item) {
      // time from the task suffix
      task_sec             = timeProcessing.parseTime(item);
      // text of task without time in suffix
      var declensionedTime = (task_sec / 60 === 1) ? 'одну минуту '
        : $scope.util.plural(task_sec / 60, "%d минуту. ", "%d минуты. ", "%d минут. ");

      // set countdown timer
      countdown.add(task_sec / 60, 0, countdown.getParent($scope.vm.play_index));

      $scope.msg = 'Задача на ' + declensionedTime + task;
    } else {
      // set countdown timer
      countdown.add(mins, sec, countdown.getParent($scope.vm.play_index));
    }
  }

  function setLeftTimeout(task, left_time) {
    // TODO: process case when time before and is not round number
    _to1 = $timeout(function () {
      left_time -= repeat_int;
      $scope.msg = task + 'Осталось' +
        $scope.util.plural(left_time, "%d минута. ", "%d минуты. ", "%d минут. ") +
        ' до конца задачи. ';

      $timeout.cancel(_to1);
      if ($scope.vm.play_index === $index && left_time > 2) {
        setLeftTimeout();
      }
    }, repeat_int * 1000, true);
  }


  /**
   * play task
   * @param $index
   * @param item
   * @param mins
   * @param sec
   */
  $scope.play = function ($index, item, mins, sec) {

    if (typeof mins === "number" && typeof sec === "number") {
      task_sec = (mins * 60) + sec; // seconds
      initPlay($index, mins, sec);
    } else {
      initPlay($index, null, null);
    }

    var task = timeProcessing.trimTime($scope.vm.list[$scope.vm.play_index]);

    setTask(task, item, mins, sec);

    setNoticeBeforeEndTimeout(task);

    var left_time = task_sec / 60;
    if (task_sec / 60 >= 3 && left_time > 2) {
      setLeftTimeout(task, left_time);
    }

    setTaskTimeout();

    $scope.$$phase || $scope.$apply();

  };


  // stop task
  $scope.stopPlay = function () {
    $scope.insomniaOff();
    $timeout.cancel(_to1);
    $timeout.cancel(_to2);

    $scope.msg           = null;
    $scope.vm.play_index = -1;

    countdown.removeTimer();
  };

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
  };


  // function for adding and subtracting 1 minute
  // from current task time


  function restart($index, mins, sec) {
    $scope.stopPlay();
    $scope.play($index, null, mins, sec)
  }

  /**
   * restart task after add or subtract 1 min
   * @param event
   * @param flag
   * @param index
   */
  $scope.changeTime = function (event, flag, index) {
    event.preventDefault();
    var mins, sec;
    if (flag) {
      mins = parseInt(timeProcessing.addMinute(timeProcessing.getCurrentTime('#timer')[0]));
      sec  = parseInt(timeProcessing.getCurrentTime('#timer')[1]);
    } else {
      mins = parseInt(timeProcessing.subtractsMinute(timeProcessing.getCurrentTime('#timer')[0]));
      sec  = parseInt(timeProcessing.getCurrentTime('#timer')[1]);
    }
    restart(index, mins, sec);
    $scope.$$phase || $scope.$apply();
  };


  $scope.onTextareFocus = function ($index) {
    $scope.this_task = $scope.vm.list[$index];
  };

  $scope.onTextareaBlur = function ($index, item) {
    $scope.vm.focus_index = -1;
    if ($scope.this_task !== $scope.vm.list[$index] &&
      $scope.vm.play_index !== -1 &&
      $scope.vm.play_index === $index) {
      $scope.play($index, item, null, null);
    }
  };

  $scope.onReorder = function (item, $fromIndex, $toIndex) {

    $scope.vm.list.splice($fromIndex, 1);
    $scope.vm.list.splice($toIndex, 0, item);

    if ($fromIndex == $scope.vm.play_index) {

      $scope.vm.play_index = $toIndex;

      // countdown.removeTimer();
      countdown.add(countdown.mins, countdown.seconds, countdown.getParent($scope.vm.play_index));

      if ($scope.vm.play_index > $scope.vm.list.indexOf(textenter)) {
        var idx = $fromIndex >= $scope.vm.list.indexOf(textenter) ? 0 : $fromIndex;
        $scope.play(idx, $scope.vm.list[idx], null, null);
      }
    } else if ($scope.vm.play_index < $fromIndex && $scope.vm.play_index >= $toIndex) {
      $scope.vm.play_index++;
    } else if ($scope.vm.play_index > $fromIndex && $scope.vm.play_index < $toIndex) {
      $scope.vm.play_index--;
    }

    $scope.$$phase || $scope.$apply();
  }


}]);
